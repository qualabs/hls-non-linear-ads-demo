// signalling.js -- the signalling layer of ADR 0003, for HLS.
//
// It has ONE job: for a given playback time, hand over the list of active
// concurrent experiences with their layout already resolved. Everything that
// knows the word HLS lives on this side of the seam: the LEVEL_UPDATED
// subscription, the Date Ranges, the asset-list request, and the
// X-AD-CREATIVE-SIGNALING block. What comes out the other end is the contract,
// and the contract is plain data -- see docs/contrato-senalizacion-renderizado.md.
//
// What the contract is built WITH does not know HLS, and it is not here: the
// model of a break is lib/experience.js, and the capabilities and the options of
// an ad are lib/capabilities.js (ADR 0117). This file reads the transport and
// hands what it read to them.
//
// The pure functions are exported one by one on purpose: they are the surface
// the tests of T-08 aim at, and the module reaches for the `Hls` global only
// INSIDE createSignalling(), so `node --test` can import this file.

import { activeAt, blockIdentifiers, isOffer, linearItem, rangeOfExperiences, resolveExperience, usablePayload, withOptions } from '../lib/experience.js';
import { narrowBlock, usableCapabilities, usablePreValidation } from '../lib/capabilities.js';

/** The class of ADR 0009: sibling of Apple's interstitial, not an extension. */
export const CONCURRENT_CLASS = 'com.qualabs.hls.concurrentInterstitial';

/**
 * Apple's traditional interstitial. A stream may carry it next to ours, never
 * overlapping (ADR 0113), and in our player hls.js plays it with its own
 * interstitials machinery (ADR 0114): nothing on this side resolves its list or
 * draws it. This layer still reports its range off the tag, because the ranges
 * of the programme say WHICH KIND each range is; what a bar of our player marks
 * for this kind comes from hls.js's schedule (`scheduledRanges`).
 */
export const INTERSTITIAL_CLASS = 'com.apple.hls.interstitial';

/**
 * The class of ADR 0063: a window in which several feeds are OFFERED and
 * whoever is watching raises the ones he wants to see. Sibling of the other two
 * and an extension of neither -- a class is compared by exact equality of the
 * string and the format has no inheritance for "extends" to mean anything, so
 * what relates the three is that this layer reads all three and nothing else.
 *
 * What it announces is a CATALOGUE and not a layout, and that is the whole of
 * the difference downstream (ADR 0064): an ad declares where each box goes, and
 * an offer cannot, because where a box goes depends on how many boxes there
 * are, and that number is decided on the other side of the network, several
 * times, while the window is open.
 */
export const MULTIVIEW_CLASS = 'com.qualabs.hls.multiViewInterstitial';

/**
 * The kind of range a Date Range class means. This object is the ONE place a
 * class string is turned into something the contract can carry: the kind
 * crosses the seam, the class never does (ADR 0003). A class that is not in
 * here is not a range of the programme.
 *
 * A KIND IS READ BY THREE TABLES DOWNSTREAM, AND A KIND IN TWO OF THEM FAILS IN
 * SILENCE. One of the three says which kinds THIS player plays, and a kind
 * missing from it never reaches a bar at all; the other two give a kind its
 * colour and its name, and a range with no colour is not drawn while a range
 * with no name is drawn without a tooltip. None of the three throws, which is
 * why what holds them together is a test that asserts their keys agree
 * (ADR 0063): it turns "remember to touch all three" into something that cannot
 * be forgotten.
 */
export const KIND_OF_CLASS = {
  [CONCURRENT_CLASS]: 'concurrent',
  [INTERSTITIAL_CLASS]: 'interstitial',
  [MULTIVIEW_CLASS]: 'multiview'
};

export function kindOfClass(hlsClass) {
  return KIND_OF_CLASS[hlsClass] ?? null;
}

/**
 * The kinds whose Date Range carries an X-ASSET-LIST this layer goes and reads.
 * The other one is reported off the tag alone: hls.js plays it, not this side
 * (ADR 0114), so there is no list to ask for here and nothing to resolve, and
 * its window is the one the tag declares (`rangeOfDateRange`).
 *
 * It is a set of KINDS and not of classes, so it is written on the contract's
 * side of the translation and not on the transport's: what decides whether a
 * list is fetched is the kind of experience the tag announces, which is exactly
 * what `KIND_OF_CLASS` above just answered.
 */
export const KINDS_RESOLVED = new Set(['concurrent', 'multiview']);

/** The extension of ADR 0019: our block, on top of the standard asset. */
export const BLOCK = 'X-AD-CREATIVE-SIGNALING';

/** The asset's own `URI`, which is what the fallback plays, or null. */
export function usableUri(asset) {
  const uri = asset?.URI;
  return typeof uri === 'string' && uri.trim() ? uri.trim() : null;
}

/**
 * What happens to ONE asset of a list, decided and not yet acted on: the items
 * narrowed to their options, the payload this client can draw or `null`, the
 * asset's own `URI` and `DURATION`, the first requests it is still waiting on,
 * and whether the first request for its default failed. `resolveAssets`
 * acts on it and `pendingFirstRequests` only reads `pending`, so the two cannot
 * disagree about which request an asset needs next.
 *
 * THE DEFAULT IS ASKED FOR ONLY WHEN IT IS GOING TO BE PLAYED. Its first
 * request is made when no option is left, and not alongside the options: a
 * request for an ad nobody shows is a request the ad server may count.
 */
function decideAsset(asset, capabilities, loads) {
  const items = [];
  const pending = [];
  const block = narrowBlock(asset?.[BLOCK], capabilities, items, loads, pending);
  const payload = pending.length ? null : usablePayload(block);
  const uri = usableUri(asset);
  const declared = Number(asset?.DURATION);
  let defaultFailed = null;
  if (loads && !pending.length && !payload && uri && declared > 0) {
    const load = loads.get(uri);
    if (!load) pending.push({ uri, mediaType: null });
    else if (!load.ok) defaultFailed = { uri, error: load.error };
  }
  return { items, block, payload, uri, declared, pending, defaultFailed };
}

/**
 * The first requests an asset-list still needs before it can be resolved,
 * given the ones already answered in `loads`: for each asset, those of the
 * first option that fits and has not failed, or those of its default when no
 * option is left. Each `{ uri, mediaType }` once, however many assets share it.
 * Empty means `resolveAssets` can run with `loads` and decide everything.
 */
export function pendingFirstRequests(adList, { capabilities = null, loads }) {
  const seen = new Map();
  for (const asset of Array.isArray(adList?.ASSETS) ? adList.ASSETS : []) {
    for (const request of decideAsset(asset, capabilities, loads).pending) {
      if (!seen.has(request.uri)) seen.set(request.uri, request);
    }
  }
  return [...seen.values()];
}

/**
 * `resolveAssets` with PRE-VALIDATION in it: the up-front half of the "Asset
 * load failure" of SVTA2053 5.3.3 (ADR 0106, and since ADR 0107 an optional
 * step, `preValidateAssets`). Before the list is handed over, the first request
 * for each asset of the first option that fits is made -- the playlist its
 * `uri` references, or the image -- and an option one of whose first requests
 * failed is discarded and the next one that fits is requested. When none is
 * left, the first request for the default linear ad is made, and when that
 * fails too the asset is skipped.
 *
 * ITS ONLY EFFECT IS ON THE LIST THE RENDERER IS HANDED (ADR 0107). An option
 * that failed here is not in `Experience.options`, so the renderer never mounts
 * it; what it does mount, and what it falls to when that fails on screen, is
 * the renderer's own failover, which runs whether this ran or not. There is no
 * second failover here: this one decides before the window, that one during
 * the preload, and they share the rule and not the code.
 *
 * `firstRequest(uri, mediaType)` makes the request and answers `{ ok, error }`,
 * and may say which `method` answered. It is injected because how a request is
 * made is the business of the piece that knows the player library
 * (`firstRequest` in media.js, which takes `preValidateMethod`), and because it
 * is what a test replaces. A request that throws counts as failed.
 *
 * IT GOES IN ROUNDS, and a round is every request no answer is known for yet,
 * all at once: the first fitting option of every asset in the first round, and
 * then only what a failure made necessary. So a list whose assets all load
 * costs one round, and the second option of an ad is never asked for unless the
 * first one failed. It ends because every round answers at least one request
 * nobody had answered, and a list has a finite number of them.
 *
 * ONLY THE FIRST REQUEST COUNTS, and that is the whole scope of the rule: what
 * fails after it -- a segment, a variant, a decode -- is a playback error of
 * the ad that was already chosen, and nothing here changes option or falls
 * back over it. The answers live for one asset-list and are not shared between
 * breaks.
 *
 * Returns the experiences, as `resolveAssets` does, and fills `requests`,
 * when given, with every first request made: `{ uri, ok, error, method }`.
 */
export async function resolveWithFirstRequests(adList, {
  id, slotStart, capabilities = null, report = null, firstRequest, requests = null
}) {
  const loads = new Map();
  for (let round = pendingFirstRequests(adList, { capabilities, loads }); round.length;
    round = pendingFirstRequests(adList, { capabilities, loads })) {
    await Promise.all(round.map(async ({ uri, mediaType }) => {
      let answer;
      try {
        answer = await firstRequest(uri, mediaType);
      } catch (error) {
        answer = { ok: false, error: String(error?.message || error) };
      }
      const load = answer?.ok ? { ok: true } : { ok: false, error: answer?.error || 'the request failed' };
      loads.set(uri, load);
      requests?.push(answer?.method ? { uri, ...load, method: answer.method } : { uri, ...load });
    }));
  }
  return resolveAssets(adList, { id, slotStart, capabilities, report, loads });
}

/**
 * Every experience an asset-list declares, one behind the other.
 *
 * THE ORDER IS NOT OURS AND THE OFFSET IS. The assets are played in the order
 * of the `ASSETS` array -- Appendix D.2 of the standard, and there is nothing
 * to decide there. What the standard has no field for is WHERE each one lands
 * on the timeline of the programme, so this layer decides it, and it decides
 * it from the top-level `DURATION`: each asset begins where the ones before it
 * ended, accumulated. The item's `start` then places the item inside its own
 * asset, which is where the block that carries it lives.
 *
 * WHY THE `DURATION` AND NOT THE `start`. The offset has to come out of a
 * field that EVERY asset has. `DURATION` is one of the two members Appendix
 * D.2 makes mandatory on every Asset-Description; the block is our extension
 * and an asset is allowed not to carry one -- that asset is a linear ad, and
 * it has nowhere to write a `start`. A rule written on the `start` would work
 * for the ads we draw and have nothing to say about the one we do not.
 *
 * The six payloads the tool emits carry a single asset with `start: 0`, so the
 * accumulator is 0 and the two readings agree on every one of them, which is
 * why nothing written against the old rule moves.
 *
 * WHAT IT COSTS, AND IT IS NOT HIDDEN. The `DURATION` is DECLARED metadata: a
 * decisioning server can declare one thing and serve a creative of another
 * length, and then the ads that come after are placed against a number that
 * was never true. Which end of that the layer takes is written in
 * docs/contrato-senalizacion-renderizado.md.
 *
 * AND EVERY ASSET RESOLVES ONE OF THREE WAYS, which is ADR 0019 plus the first
 * and third rungs of Appendix D.5, in one place because they are one decision:
 * a usable block becomes the experiences it declares; an asset without one --
 * declared bare, or carrying a block this client cannot draw -- becomes ONE
 * experience that plays its own `URI` at full frame; and an asset with neither
 * is skipped, alone, with the assets after it left where they were.
 *
 * WHAT "USABLE" MEANS DEPENDS ON THE DEVICE SINCE ADR 0085. Before the block is
 * judged, `narrowBlock` keeps, per item, the first of its `layoutOptions` the
 * configured `capabilities` fit; an item with none left makes the block unusable, and
 * the asset goes down the same two paths as any other block this client cannot
 * draw -- its `URI` as the default linear ad, or skipped when it has none.
 * AND SINCE ADR 0106, "USABLE" ALSO MEANS "ITS ASSETS LOAD". `loads`, when
 * given, is what the first request for each asset answered (a Map of `uri` to
 * `{ ok, error }`, written by `resolveWithFirstRequests`): an option whose first
 * request failed is passed over for the next one that fits, and a default
 * linear ad whose first request failed is skipped (SVTA2053 5.3.3, "Asset load
 * failure", and 6.6.4). An asset that still needs a first request nobody has
 * made yet is `pending`, draws nothing, and is what `pendingFirstRequests`
 * lists. Without `loads` nothing is requested and every asset counts as loaded,
 * which is how this function behaved before ADR 0106.
 *
 * `report`, when given, receives one entry per asset: the items' selection and
 * the `outcome`, which is `drawn`, `default` (a block that could not be drawn,
 * played as its `URI`), `linear` (no block at all), `skipped` or `pending`. An
 * asset skipped because the first request for its default failed carries that
 * request in `defaultFailed`, `{ uri, error }`. Each entry also carries its
 * `assetId`, and in `fallback` the `URI` of the default handed to the renderer
 * as its last resort when the asset was drawn, `null` otherwise (ADR 0107).
 *
 * WHAT THE OUTCOME SAYS IS WHAT WAS HANDED OVER, NOT WHAT WAS SHOWN. Since ADR
 * 0107 the renderer can still fall to a later option, to the default or to
 * nothing when an asset fails to load on screen, and what it ends up
 * presenting is reported by the renderer (`onPresented`), not here.
 */
export function resolveAssets(adList, { id, slotStart, capabilities = null, report = null, loads = null }) {
  const out = [];
  const assets = adList?.ASSETS;
  // The third rung of Appendix D.5, and the whole of it: a list with no assets
  // resolves by APPLYING THE OFFSET AND PLAYING NOTHING. Under this render
  // there is no offset to apply, because the primary was never stopped -- so
  // the break contributes no experience, no range, and no interruption. It is
  // said out loud because "nothing happened" is exactly what a break that is
  // silently broken looks like.
  if (!Array.isArray(assets) || assets.length === 0) {
    console.warn(`[signalling] ${id}: the list declares no ASSETS. The break plays nothing and the` +
      ' programme is not interrupted (Appendix D.5, resolved by applying the offset).');
    return out;
  }
  let assetStart = 0;
  for (const [assetIndex, asset] of assets.entries()) {
    const { items, block, payload, uri, declared, pending, defaultFailed } = decideAsset(asset, capabilities, loads);
    // The ad this asset is, whatever happens to it below: drawn, played as its
    // default, or skipped, a page can say WHICH ad it was (ADR 0093).
    const identifiers = blockIdentifiers(asset?.[BLOCK]);
    // WHICH ASSET OF THE LIST, because the unit of the fallback is the asset
    // (see `usablePayload`): when the renderer runs out of options for one item,
    // every item of the same asset goes to its default with it (ADR 0107).
    const assetId = `${id}.a${assetIndex}`;
    const entry = { items, outcome: null, identifiers, assetId, fallback: null };
    report?.push(entry);
    for (const { discarded, offered } of items) {
      for (const { index, reason } of discarded) {
        console.log(`[signalling] ${id}: option ${index + 1} of ${offered.length} discarded, it ${reason}.`);
      }
    }
    if (pending.length) {
      // Only reachable by calling this with `loads` half written: the driver,
      // `resolveWithFirstRequests`, makes every first request before it calls
      // this. Nothing is drawn and nothing falls back, because neither is known
      // yet; the window stays where it is.
      entry.outcome = 'pending';
    } else if (payload) {
      entry.outcome = 'drawn';
      // The default the renderer falls to when every option it was handed for
      // an item of this asset fails to load (ADR 0107). It is not requested
      // here: a request for an ad nobody shows is a request the ad server may
      // count, and the renderer asks for it only if it gets that far.
      const fallback = uri && declared > 0
        ? withOptions(resolveExperience(linearItem(uri, declared, identifiers),
          { id, itemId: `${assetId}.default`, slotStart, assetStart }), { assetId })
        : null;
      entry.fallback = fallback ? uri : null;
      payload.forEach((item, i) => {
        // The ordinal of the whole list and not of the ASSETS array, so that two
        // items of a single asset are two identities and not one.
        const experience = resolveExperience(item, { id, itemId: `${id}.${out.length}`, slotStart, assetStart });
        out.push(isOffer(item) ? experience : withOptions(experience, { assetId, fallback, ranked: block.ranked?.[i] }));
      });
    } else if (uri && declared > 0 && !defaultFailed) {
      // THE ONE PATH OF ADR 0019, TAKEN BY TWO KINDS OF ASSET. One is the
      // linear ad, declared the way it was always declared: `URI`, `DURATION`,
      // and no block of ours. The other is an ad we WOULD have drawn and
      // cannot, because its block is unreadable, asks for something this
      // client does not do, or has no option the configured capabilities fit. They are not the same event and they are said
      // differently below, but what is played is the same thing: the asset's
      // own `URI`, full frame, over a programme that keeps running behind it.
      entry.outcome = block == null ? 'linear' : 'default';
      if (block == null) {
        console.log(`[signalling] ${id}: an ASSET carries no layout block, so it is a linear ad and` +
          ' plays its own URI full frame (ADR 0019).');
      } else {
        console.warn(`[signalling] ${id}: an ASSET carries a layout block this client cannot draw,` +
          " so it falls back to the asset's own URI and plays as a linear ad (ADR 0019).");
      }
      out.push(withOptions(resolveExperience(linearItem(uri, declared, identifiers),
        { id, itemId: `${id}.${out.length}`, slotStart, assetStart }), { assetId }));
    } else {
      // The FIRST rung of Appendix D.5, and the distinction it makes is the
      // one that matters: what is skipped is THAT ASSET and not the break. The
      // accumulator below still advances by the declared DURATION, so the
      // assets after it keep the windows they already had -- a skip that moved
      // them would be the break failing, one asset at a time.
      entry.outcome = 'skipped';
      if (defaultFailed) {
        // The last sentence of the "When no option fits" of SVTA2053 5.3.3: the
        // default linear ad is also an asset with a first request, and when
        // that request fails there is nothing left to play, so the asset goes
        // the way of one that never had a default (ADR 0106).
        entry.defaultFailed = defaultFailed;
        console.warn(`[signalling] ${id}: an ASSET falls to its linear default and the first request` +
          ` for it failed (${defaultFailed.uri}: ${defaultFailed.error}), so THAT asset is skipped and` +
          ' the break is not (SVTA2053 5.3.3 and 6.6.4, ADR 0106).');
      } else console.warn(`[signalling] ${id}: an ASSET has nothing this client can play -- no usable` +
        ' layout block and no usable URI with a DURATION -- so THAT asset is skipped and the break' +
        ' is not. The assets after it keep their windows (Appendix D.5).');
    }
    if (!Number.isFinite(declared)) {
      console.warn(`[signalling] ${id}: an ASSET declares no usable DURATION, so the assets after` +
        ' it start where it did instead of after it. DURATION is mandatory on every asset.');
    }
    assetStart += Number.isFinite(declared) ? declared : 0;
  }
  return out;
}

/**
 * The window of a range that is NOT resolved. Nothing on this side plays the
 * traditional interstitial, so there is no asset-list to ask for and no payload
 * to read: its length is the one the tag declares, DURATION if it is there and
 * PLANNED-DURATION otherwise. A tag that declares neither cannot be placed on a
 * bar, and an unplaceable range is not reported at all.
 */
export function rangeOfDateRange(id, dateRange, startTime) {
  // `== null` before the conversion, and not `Number.isFinite` alone:
  // `Number(null)` is 0, so a tag that declares nothing would come out as a
  // range of zero seconds instead of no range at all.
  const declared = dateRange.duration ?? dateRange.plannedDuration;
  const duration = Number(declared);
  if (declared == null || !Number.isFinite(duration)) {
    console.warn(`[signalling] ${id} declares neither DURATION nor PLANNED-DURATION: not a range`);
    return null;
  }
  return { id, kind: 'interstitial', startTime, duration };
}

/**
 * Playback time of an instant of the programme clock. `anchor` is a fragment
 * with a known EXT-X-PROGRAM-DATE-TIME: `{ start, programDateTime }`, seconds
 * of playback and milliseconds since the epoch.
 */
export function mediaTimeOf(date, anchor) {
  return anchor.start + (date.getTime() - anchor.programDateTime) / 1000;
}

/**
 * The `CUE` of a Date Range (HLS, EXT-X-DATERANGE: an enumerated-string-list of
 * PRE, POST and ONCE), as `{ pre, post, once }`. hls.js 1.7.2 already parses it
 * on every Date Range, whatever its class (`DateRange.cue`, src/loader/
 * date-range.ts, falling back to `X-CUE`), and that is what is read when it is
 * there; a plain object, as the tests hand over, is read off `attr` the same way
 * hls.js reads it: split on spaces and commas, lowercased.
 *
 * hls.js also DROPS a Date Range that says PRE and POST at once ("(!this.attr.CUE
 * || (!this.cue.pre && !this.cue.post) || this.cue.pre !== this.cue.post)" in
 * `isValid`, and the parser keeps only valid ones), so that pair never reaches
 * this layer from a real player.
 *
 * PRE and POST change where a break goes and when its list is asked for (ADR
 * 0110, ADR 0111): a preroll where playback begins, a post-roll after the end,
 * where only its linear default plays. ONCE takes a break out for good once it
 * has played, entered and then left (ADR 0112), so a seek back neither draws
 * it again nor reports it again.
 */
export function cueOf(dateRange) {
  const parsed = dateRange?.cue;
  if (parsed && typeof parsed === 'object') {
    return { pre: !!parsed.pre, post: !!parsed.post, once: !!parsed.once };
  }
  const attr = dateRange?.attr ?? {};
  const raw = attr.CUE ?? attr['X-CUE'];
  const words = new Set(String(raw ?? '').split(/[ ,]+/).filter(Boolean).map((w) => w.toLowerCase()));
  return { pre: words.has('pre'), post: words.has('post'), once: words.has('once') };
}

/**
 * Where a PRE-ROLL sits on the programme (ADR 0110): where playback begins, and
 * NOT at its START-DATE. It is hls.js's reading: `startOffset` is "this.cue.pre ?
 * 0 : this.startTime" (src/loader/interstitial-event.ts), the schedule puts a
 * preroll first whatever its date, and `checkStart` plays it before the
 * primary at whatever `startPosition` playback begins. A non-linear ad does not
 * stop the programme, so "before the primary" becomes "over the primary, from
 * the second playback begins at": `startPosition` when the player was told one,
 * and 0 otherwise (-1, hls.js's "not set", is 0 on a VOD).
 *
 * ON A LIVE PLAYLIST "WHERE PLAYBACK BEGINS" IS THE LIVE JOIN POINT, and -1 is
 * not 0 there: pass `live` (see `liveStartPosition`). It answers `null` when
 * the join point is not known yet, and the caller waits for it.
 */
export function preRollStart(startPosition, live = null) {
  if (live?.live) return liveStartPosition({ startPosition, ...live });
  const at = Number(startPosition);
  return Number.isFinite(at) && at > 0 ? at : 0;
}

/**
 * WHERE A LIVE PLAYLIST IS JOINED, which is where a preroll goes on one (ADR
 * 0110, note of 2026-10-22). It is hls.js 1.7.2's `getLiveStartPos`
 * (src/controller/interstitials-controller.ts), line for line:
 *
 *     const behindLive = (this.primaryDetails?.targetduration || 10) * 3;
 *     if (startPosition === -1 || (liveSync && liveSync - startPosition < behindLive)) {
 *       return liveSync || 0;
 *     }
 *     return startPosition;
 *
 * and it is what `livePrerollResumption` resumes the primary at after a live
 * preroll without X-RESUME-OFFSET: the preroll plays first and the programme
 * is joined at the live sync position (`hls.liveSyncPosition`: the live edge
 * minus the target latency), or at the `startPosition` the player was told when
 * that is more than three target durations behind it. A non-linear preroll
 * does not stop the programme, so it is drawn over it FROM that point.
 *
 * ONE DIFFERENCE, SAID OUT LOUD. hls.js answers 0 when there is no sync
 * position yet, because it only asks after the preroll played, when there is
 * one. This layer has to place the window before, so it answers `null` -- "not
 * known yet" -- and the caller waits for the next playlist update. A sync
 * position of exactly 0 (a stream that has just begun) is a known 0.
 */
export function liveStartPosition({ startPosition = -1, liveSyncPosition = null, targetDuration = null } = {}) {
  const start = Number(startPosition);
  const sync = liveSyncPosition == null ? null : Number(liveSyncPosition);
  const known = sync != null && Number.isFinite(sync);
  const behindLive = (Number(targetDuration) > 0 ? Number(targetDuration) : 10) * 3;
  const unset = !Number.isFinite(start) || start < 0;
  if (unset || (known && sync && sync - start < behindLive)) return known ? sync : null;
  return start;
}

/**
 * WHAT HAPPENS TO A PREROLL, decided when its Date Range is first seen (ADR
 * 0110 and its note of 2026-10-22). Three answers:
 *
 *   `{ start }`       it is placed at `start` (see `preRollStart`).
 *   `{ wait: true }`  live, and the join point is not known yet: ask again on
 *                     the next playlist update.
 *   `{ late: true }`  it was first seen AFTER playback had joined, so it is
 *                     not presented at all.
 *
 * THE THIRD ONE IS hls.js's TOO, and it is why a preroll never plays twice on a
 * live stream. hls.js steps into a preroll only in `checkStart`, and only on
 * the first pass (`timelinePos === -1`): "else if (interstitialEvents[0].cue.pre)
 * { ... this.setSchedulePosition(index); }". After that the schedule is parsed
 * again on every playlist reload (`parseInterstitialDateRanges` on
 * LEVEL_UPDATED), and an event already known keeps its state ("Update
 * InterstitialEvent already parsed and mapped"), so the same preroll is not
 * stepped into again; and a preroll that shows up on a later reload is put
 * first in the schedule, at 0, behind a playhead that is already past it -- it
 * is never reached. On a VOD every Date Range is there on the first update, so
 * the third answer only happens on live.
 */
export function preRollPlacement({ startPosition = -1, live = false, liveSyncPosition = null,
  targetDuration = null, joined = false } = {}) {
  if (joined) return { late: true };
  const start = preRollStart(startPosition, live ? { live, liveSyncPosition, targetDuration } : null);
  return start == null ? { wait: true } : { start };
}

/**
 * WHERE A POST-ROLL GOES: at the end of the programme, and not at its
 * START-DATE (ADR 0111). It is hls.js 1.7.2's `resolveOffsets` and
 * `parseSchedule` (src/controller/interstitials-schedule.ts): "const
 * primaryDuration = details.live ? Infinity : details.edge" and "postroll ?
 * primaryDuration : interstitial.startTime". On a live playlist that is
 * Infinity, a point no playhead reaches, so this answers `null` until the
 * playlist carries its ENDLIST: a post-roll on live only exists once the
 * stream has ended.
 *
 * `details.edge` is hls.js's own "end of the last fragment"; a plain object, as
 * the tests hand over, falls back to the first fragment's start plus the
 * total duration, which is the same number.
 */
export function programEnd(details) {
  if (!details || details.live) return null;
  const edge = Number(details.edge);
  if (Number.isFinite(edge) && edge > 0) return edge;
  const first = Number(details.fragments?.[0]?.start ?? 0);
  const total = Number(details.totalduration);
  return Number.isFinite(total) ? first + total : null;
}

/**
 * Whether a post-roll's asset-list is due (ADR 0111). hls.js asks for it in
 * `onBufferedToEnd` ("Buffered to post-roll": `if (interstitial.cue.post) { ...
 * this.bufferedToItem(item, 0); }`), on BUFFERED_TO_END, which its buffer
 * controller fires when the last fragment of a playlist that has ENDED is
 * appended -- never on a live one. So: when the source is closed (ENDLIST, the
 * `sourceClosed` of `createSignalling`) and the programme is buffered to its
 * end. Reaching the end of the programme counts as buffered to it.
 */
/**
 * WHETHER A `CUE="ONCE"` BREAK HAS PLAYED, AND SO LEAVES (ADR 0112). hls.js
 * 1.7.2 removes a ONCE interstitial from its schedule "after it has played"
 * (src/controller/interstitials-controller.ts, `setSchedulePosition`):
 *
 *     interstitial.hasPlayed = true;
 *     this.hls.trigger(Events.INTERSTITIAL_ENDED, { ... });
 *     // Exiting an Interstitial
 *     if (interstitial.cue.once && this.hls) {
 *       // Remove interstitial with CUE attribute value of ONCE after it has played
 *       this.updateSchedule();
 *
 * and `parseSchedule` filters it out for good: "!(event.cue.once &&
 * event.hasPlayed)". `hasPlayed` is set when playback LEAVES the interstitial's
 * item for another one, after INTERSTITIAL_STARTED -- at its end, or by a seek
 * out of it. So "played" is "started, then left", not "completed": a ONCE
 * break that was entered and then sought out of is gone too. A seek that jumps
 * OVER it never entered it, and it stays.
 *
 * Here: `entered` is whether the programme has been inside the break's window
 * (its range, provisional or resolved), and the answer is `{ entered, spent }`
 * for the programme at `time`: spent once it was entered and is now outside.
 */
export function onceProgress(range, entered, time) {
  if (!range || !Number.isFinite(time)) return { entered: Boolean(entered), spent: false };
  const inside = time >= range.startTime && time < range.startTime + range.duration;
  if (inside) return { entered: true, spent: false };
  return { entered: Boolean(entered), spent: Boolean(entered) };
}

export function postRollDue({ sourceClosed = false, bufferedToEnd = false } = {}) {
  return Boolean(sourceClosed && bufferedToEnd);
}

/**
 * WHAT A POST-ROLL PLAYS, out of its asset-list (ADR 0111): every asset's
 * LINEAR DEFAULT, its own `URI` with its `DURATION`, in order, and nothing
 * else. David Hassoun, 2026-10-22: "it should auto fail to the linear ad if
 * defined as a standard interstitial, or skip if only non-linear is defined".
 *
 * WHY THE NON-LINEAR OPTIONS ARE NOT EVEN LOOKED AT: a non-linear ad is drawn
 * over the programme, and after the end there is no programme to draw over. So
 * a post-roll is the standard interstitial and only that -- what any client
 * already in the market plays from the same list (ADR 0090) -- and an asset
 * that has no standard part is skipped, alone, with the assets after it keeping
 * their place (Appendix D.5), exactly like an asset that has nothing to play
 * in the middle of the programme.
 *
 * Each linear ad is an experience of the contract like any other (full frame,
 * `type: 'linear'`), with its window from `slotStart`, the end of the
 * programme. It is NOT one of the experiences `activeAt` hands over: the
 * programme's clock stops at its end, so the windows past it are played by
 * their own clock (lib/postroll.js), one after the other, each to the end of
 * its asset (ADR 0019).
 *
 * `report`, when given, receives one entry per asset, as `resolveAssets`
 * writes them: `outcome` is `default` (it carried a layout block, and its
 * linear default is what plays), `linear` (no block) or `skipped`.
 */
export function resolvePostRoll(adList, { id, slotStart, report = null }) {
  const out = [];
  const assets = Array.isArray(adList?.ASSETS) ? adList.ASSETS : [];
  let assetStart = 0;
  for (const [assetIndex, asset] of assets.entries()) {
    const uri = usableUri(asset);
    const declared = Number(asset?.DURATION);
    const block = asset?.[BLOCK];
    const identifiers = blockIdentifiers(block);
    const assetId = `${id}.a${assetIndex}`;
    const entry = { items: [], outcome: null, identifiers, assetId, fallback: null, postroll: true };
    report?.push(entry);
    if (uri && declared > 0) {
      entry.outcome = block == null ? 'linear' : 'default';
      out.push(withOptions(resolveExperience(linearItem(uri, declared, identifiers),
        { id, itemId: `${id}.${out.length}`, slotStart, assetStart }), { assetId }));
    } else {
      entry.outcome = 'skipped';
      console.warn(`[signalling] ${id}: a post-roll (CUE="POST") ASSET has no linear default -- no usable` +
        ' URI with a DURATION -- so THAT asset is skipped: a non-linear ad is never presented after the' +
        ' programme ends (ADR 0111).');
    }
    assetStart += Number.isFinite(declared) ? declared : 0;
  }
  return out;
}

/**
 * The query parameters the configured capabilities travel in, ONE PER AXIS,
 * with the names of SVTA2053 5.3.3, Table 21 (ADR 0086, ADR 0104). They replace
 * `qa-decoder-count`, whose own comment said that the day the capability had a
 * name of the specification, that would be the one to travel.
 *
 *   sgai-video-decoders     an integer above zero: the value of `concurrentVideo`
 *   sgai-image-over-video   1 when `concurrentImage` is true, 0 when it is false
 *
 * THEY DO NOT BEGIN WITH `_HLS_`, which the base reserves for its own query
 * parameters, and which hls.js already puts on the off-the-shelf client's
 * asset-list request (`_HLS_primary_id`).
 *
 * THE THIRD AXIS, `sgai-html-over-video`, IS NOT HERE ON PURPOSE. This library
 * draws `<img>` and `<video>` and nothing else (`media.js`), so there is no
 * value of that axis it could declare about itself and have it be true.
 */
export const VIDEO_DECODERS_PARAM = 'sgai-video-decoders';
export const IMAGE_OVER_VIDEO_PARAM = 'sgai-image-over-video';

/**
 * The URI of a Date Range's asset-list, resolved against the playlist it came
 * in, carrying one parameter per configured capability. Without one the string
 * is what `new URL(...).href` has always produced, character for character.
 * `capabilities` is already the output of `usableCapabilities`; whether they go
 * on the request at all is the caller's choice (`sendCapabilities`, ADR 0104),
 * made by passing `null` here.
 */
export function listRequestUrl(uri, base, capabilities = null) {
  const url = new URL(uri, base);
  if (capabilities?.concurrentVideo != null) {
    url.searchParams.set(VIDEO_DECODERS_PARAM, String(capabilities.concurrentVideo));
  }
  if (capabilities?.concurrentImage != null) {
    url.searchParams.set(IMAGE_OVER_VIDEO_PARAM, capabilities.concurrentImage ? '1' : '0');
  }
  return url.href;
}

/**
 * WHEN A BREAK'S ASSET-LIST IS REQUESTED (ADR 0108, ADR 0109): the rule of hls.js
 * for the X-ASSET-LIST of an interstitial, read in the 1.7.2 this repository
 * vendors (`interstitials-controller`), and the only timing this library has.
 * Two places ask for it there, and both end in `preloadAssets` ->
 * `assetListLoader.loadAssetList`:
 *
 *   `updateBufferedPos(bufferEnd)`, on every buffer append: when the item at
 *   the forward buffer end of the primary is past the one being buffered,
 *   `bufferedToItem(next)` -> `bufferedToEvent` -> `preloadAssets(event)`, which
 *   loads the list "if (assetList.length === 0 && !assetListLoader)". That is:
 *   the list is asked for WHEN THE PROGRAMME IS BUFFERED UP TO THE START OF THE
 *   BREAK, and the lead is the forward buffer. (Live adds a look-ahead from the
 *   playlist edge, `interstitialLiveLookAhead`; every primary here is a VOD.)
 *
 *   `advanceSchedule`, when playback -- or a seek -- lands on the item:
 *   `preloadAssets(event, assetIndex)`, the same load. A seek into a break asks
 *   for its list right there, and the break waits for it.
 *
 *   `checkStart`, once the media is attached and loading is enabled, when the
 *   first event of the schedule is a PRE-ROLL (`CUE="PRE"`):
 *   `setSchedulePosition(<the preroll>)` -> `preloadAssets`. A preroll's list is
 *   asked for AT LOAD, paused or not and with nothing buffered (ADR 0110).
 *
 * There is no option to ask for every list up front (ADR 0109): a page that
 * wants the breaks on its timeline before their lists arrive reads the Date
 * Ranges hls.js already parsed, as hls.js leaves them to any page.
 */
/**
 * THE RULE OF ADR 0108 AS A PURE FUNCTION: whether a break's asset-list is due,
 * given where the programme is playing (`time`) and where its forward buffer
 * ends (`bufferedEnd`, see `bufferedEndAt`). Due when the break has not ended
 * and the programme is buffered up to its start -- which includes being played
 * or sought into it, because the buffer end is never behind the playhead.
 *
 * A break that already ended is not due: a seek past it does not ask for it,
 * and a seek back into it does, which is what hls.js does too. A break whose tag
 * declares no length has no end to be past, so it is due whenever the buffer
 * reaches its start.
 *
 * A PRE-ROLL (`pre`, `CUE="PRE"`, ADR 0110) is due at once, whatever the clocks
 * say: hls.js asks for a preroll's list in `checkStart`, as soon as there is a
 * media element and loading has started, and not when the buffer reaches it.
 * The caller only asks while there is a media element, which is the other half
 * of that condition.
 *
 * ONE DIFFERENCE WITH hls.js, SAID OUT LOUD. hls.js walks its schedule one item
 * at a time, so it asks for the next break only; this asks for every break the
 * buffer already reaches. They differ only when two breaks fit inside one
 * forward buffer (30 s by default), which no programme here has.
 */
export function assetListDue({ startTime, duration, pre = false }, { time, bufferedEnd }) {
  if (pre) return true;
  if (!Number.isFinite(time) || !Number.isFinite(startTime)) return false;
  const length = Number(duration);
  const end = duration != null && Number.isFinite(length) && length > 0 ? startTime + length : Infinity;
  if (time >= end) return false;
  return startTime <= Math.max(time, Number.isFinite(bufferedEnd) ? bufferedEnd : time);
}

/**
 * The hole, in seconds, that `bufferedEndAt` steps over: 0.1 s, hls.js's own
 * default `maxBufferHole` (src/config.ts: "maxBufferHole: 0.1, // used by
 * stream-controller and gap-controller"), and the value it hands
 * `BufferHelper.bufferInfo(media, pos, maxHoleDuration)` when it measures the
 * forward buffer it loads against (`getFwdBufferInfo`, while playing).
 *
 * WHY THERE IS A TOLERANCE AT ALL (ADR 0109, 2026-10-22 note). The first
 * buffered range of a packaged programme does not start at 0: here it starts at
 * 0.067 s, the first presentation timestamp of the first segment. With no
 * tolerance a page paused at 0 has a forward buffer that ends at the playhead,
 * so the first break's list is not asked for until play, even with the buffer
 * already past the break. hls.js has THE SAME BEHAVIOUR, and it is said here so
 * nobody reads this as copying it: its interstitials controller measures with
 * `bufferInfo(primaryMedia, timelinePos, 0)` (`checkBuffer`), and nothing moves
 * a paused playhead off 0 -- `seekToStartPos` only adjusts the start "if
 * (startPosition >= 0 && currentTime < startPosition)", which is false at 0
 * against 0 on a VOD, and the gap controller returns early on a paused element.
 * The tolerance is the one place this layer is LESS strict than hls.js, and the
 * smallest number hls.js itself uses to call a hole irrelevant.
 */
export const BUFFER_HOLE_TOLERANCE = 0.1;

/**
 * Where the forward buffer ends: the end of the buffered range that contains
 * `time`, or `time` itself when none does. A hole smaller than `tolerance` is
 * stepped over, as `BufferHelper.bufferInfo(media, pos, maxHoleDuration)` does
 * in hls.js 1.7.2: ranges closer than that are merged ("if small hole (value
 * between 0 or maxHoleDuration) or overlapping"), and a range that starts less
 * than that ahead of the playhead counts as containing it ("pos +
 * maxHoleDuration >= start"). A bigger hole is not jumped. `ranges` is a list
 * of `[start, end]`, which `rangesOf` makes out of a media element's
 * `buffered`.
 */
export function bufferedEndAt(ranges, time, tolerance = BUFFER_HOLE_TOLERANCE) {
  const merged = [];
  for (const [start, end] of [...(ranges || [])].sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1];
    if (last && start - last[1] < tolerance) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  for (const [start, end] of merged) {
    if (time + tolerance >= start && time <= end) return end;
  }
  return time;
}

/** A media element's `buffered`, as the list of `[start, end]` `bufferedEndAt` reads. */
function rangesOf(buffered) {
  const out = [];
  for (let i = 0; i < (buffered?.length ?? 0); i += 1) out.push([buffered.start(i), buffered.end(i)]);
  return out;
}

/**
 * The range a break occupies BEFORE its list is read (ADR 0108): off its tag,
 * DURATION or PLANNED-DURATION, as the replacement kind is always placed, and
 * marked `provisional`. It is replaced by the range of what the list resolves
 * into, or removed when it resolves into nothing. `null` when the tag declares
 * no length: it cannot be placed on a bar until the list says how long it is.
 */
export function provisionalRange(id, dateRange, startTime, kind) {
  const declared = dateRange?.duration ?? dateRange?.plannedDuration;
  const duration = Number(declared);
  if (declared == null || !Number.isFinite(duration)) return null;
  return { id, kind, startTime, duration, provisional: true };
}

// ===========================================================================
// THE OTHER CLASS, PLAYED BY hls.js IN THE SAME INSTANCE (ADR 0114)
// ===========================================================================
// One stream can carry both kinds of break -- ours, drawn over the programme,
// and Apple's traditional interstitial, which REPLACES it -- as long as they do
// not overlap in time (ADR 0113). The second kind is not this library's to
// play: hls.js has a whole machinery for it, and the instance now runs with that
// machinery ON. What this side needs from it is three readings, all off the
// interstitials manager hls.js exposes (`hls.interstitialsManager`, null when
// the machinery is off), and they are pure so the tests can hand them a fake:
//
//   - whether hls.js is playing one of its interstitials right now, because
//     while it is, the media element may not be playing the programme at all:
//     hls.js 1.7.2 either appends the ad into the primary timeline or hands the
//     MediaSource to the asset, and in the second case the element's clock and
//     length are the AD's (measured, ADR 0114);
//   - the programme's own clock, which is `primary` of that manager;
//   - and the breaks it scheduled, which is what a bar of this player marks for
//     that kind (ADR 0018: a bar marks what its own player plays).

/** Whether hls.js is playing an interstitial of its own (Apple's class) right now. */
export function linearOnScreen(manager) {
  return Boolean(manager?.playingItem?.event);
}

/**
 * Whether the programme has reached its end, by the programme's clock. An
 * `ended` of the element can be the end of an interstitial asset that hls.js
 * played on that same element, and the programme is then nowhere near its end.
 * With no manager, or no schedule to measure against, the element is trusted.
 */
export function programmeAtEnd(manager, tolerance = 1) {
  const duration = Number(manager?.primary?.duration);
  if (!(duration > 0)) return true;
  const at = Number(manager.primary.currentTime);
  return Number.isFinite(at) && at >= duration - tolerance;
}

/**
 * The ranges of the programme hls.js scheduled for its own interstitials, as
 * ranges of the contract, kind `interstitial`.
 *
 * The span is what the break takes out of the PROGRAMME, `resumeTime -
 * startTime` (the replacement form, ADR 0017), and the length of the ad where
 * that is not known. Two kinds of scheduled event are not marked: a post-roll,
 * which takes no time of the programme (the rule ADR 0111 set for ours), and a
 * break hls.js is known to skip -- its list loaded and gave it no asset to play
 * (ADR 0092) -- whose identifier is remembered in `skipped`, because hls.js asks
 * for the list again after a seek and the mark must not come back.
 */
export function scheduledRanges(events, skipped = new Set()) {
  const out = [];
  for (const event of events || []) {
    if (event.assetListLoaded && event.assetList?.length === 0) skipped.add(event.identifier);
    if (skipped.has(event.identifier) || event.cue?.post) continue;
    const span = event.resumeTime - event.startTime;
    const duration = Number.isFinite(span) && span > 0 ? span : Number(event.duration);
    if (!Number.isFinite(event.startTime) || !(duration > 0)) continue;
    out.push({ id: event.identifier, kind: KIND_OF_CLASS[INTERSTITIAL_CLASS], startTime: event.startTime, duration });
  }
  return out.sort((a, b) => a.startTime - b.startTime);
}

/**
 * THE PROGRAMME, as something the chrome can be handed instead of the element:
 * the four properties the controls read and write (`currentTime`, `duration`,
 * `paused`, `muted`), the two they read for the frame (`videoWidth`,
 * `videoHeight`), and `play`, `pause` and the listeners forwarded to the
 * element. It is the facade a player of that kind needs for its bar, moved into
 * the library because ours now plays that kind too (ADR 0114).
 *
 * WHILE hls.js IS NOT PLAYING ONE OF ITS INTERSTITIALS IT IS THE ELEMENT, and
 * that is deliberate: the element's clock is the smooth one, read on every
 * frame, and it IS the programme's. While one is on screen it is
 * `interstitialsManager.primary`, which reports the programme -- its length
 * throughout, and a playhead that stays inside the break -- whichever of its two
 * strategies hls.js chose. A seek written then goes to the programme's timeline
 * through hls.js, which applies the break's `X-RESTRICT`: that policy is its
 * to enforce.
 */
export function createProgramme(hls, video) {
  const manager = () => hls.interstitialsManager;
  const replaced = () => linearOnScreen(manager());
  return {
    get currentTime() {
      const at = manager()?.primary?.currentTime;
      return replaced() && Number.isFinite(at) ? at : video.currentTime;
    },
    set currentTime(seconds) {
      const primary = manager()?.primary;
      if (replaced() && primary) primary.currentTime = seconds;
      else video.currentTime = seconds;
    },
    get duration() {
      const length = manager()?.primary?.duration;
      return replaced() && Number.isFinite(length) && length > 0 ? length : video.duration;
    },
    get paused() { return video.paused; },
    get muted() { return video.muted; },
    set muted(value) { video.muted = value; },
    get videoWidth() { return video.videoWidth; },
    get videoHeight() { return video.videoHeight; },
    play: () => video.play(),
    pause: () => video.pause(),
    addEventListener: (...args) => video.addEventListener(...args),
    removeEventListener: (...args) => video.removeEventListener(...args),
    /** Whether hls.js is playing one of its interstitials, so the programme is off the screen. */
    linearOnScreen: replaced
  };
}

/**
 * The one impure function, and the only place hls.js is touched: subscribe to
 * LEVEL_UPDATED, keep the Date Ranges of our classes, ask for their X-ASSET-LIST
 * (the APPLICATION asks: hls.js only schedules Apple's class, ADR 0114), and
 * resolve the layout.
 *
 * `capabilities` is read ONCE, here, and not on every request: what it can be
 * wrong about is what the integrator wrote, and that is one statement and not
 * one per break. Five identical warnings for one mistake is how a console stops
 * being read.
 *
 * `sendCapabilities` says whether they also travel on the asset-list request.
 * Configuring them and sending them are two things since ADR 0104: the filter
 * always uses what was configured, and the request carries it only when this is
 * true, because sending is OPTIONAL and capability values add to what can
 * fingerprint a device (SVTA2053 5.3.3, "Capability parameters").
 *
 * `onResolved(experiences, selection)` gets, as its second argument, what the
 * intermediate step of ADR 0085 did with this break: the URL that was asked
 * for, and per asset what was offered, what was discarded and why, and how the
 * asset ended (see `resolveAssets`). It is called for a break that resolved
 * to nothing too, because a skipped break is exactly what a page has to be able
 * to show. `requests` in it lists every first request made for the break,
 * `{ uri, ok, error }`, and is empty without `firstRequest`.
 *
 * `firstRequest(uri, mediaType, { method })`, when given, is how the first
 * request for an asset is made by PRE-VALIDATION, before the list is handed
 * over (ADR 0106, ADR 0107, SVTA2053 5.3.3 "Asset load failure"): an option one
 * of whose first requests fails is left out of the options handed to the
 * renderer, and a default linear ad whose first request fails is skipped. The
 * entry point passes the one in media.js. Without it nothing is requested here.
 *
 * `preValidateAssets` (default `false`) says whether pre-validation runs at all,
 * and `preValidateMethod` (`'GET'` or `'HEAD'`, default `'GET'`) which method
 * the request of a playlist or a file is made with; both are read once, here,
 * by `usablePreValidation`. With pre-validation off nothing is requested at
 * resolution time and the renderer's failover is the only check, which it is
 * anyway: pre-validation only discards options before the renderer sees them.
 * `onResolved` gets what was used in `preValidation`, `{ enabled, method }`.
 *
 * Each break's asset-list is requested WHEN hls.js WOULD ASK FOR IT (ADR 0108):
 * when the programme is buffered up to the break, or played or sought into it;
 * a preroll's (`CUE="PRE"`), at load, and it is placed where playback begins,
 * which on a live playlist is the live join point; a preroll first seen after
 * playback joined is not presented (ADR 0110).
 * Until then the range of the break is on the list already, `provisional`, off
 * its tag, and `experiences` grows as lists arrive. There is no option for it
 * (ADR 0109).
 */
export function createSignalling(hls, {
  onResolved, capabilities = null, sendCapabilities = true, firstRequest = null,
  preValidateAssets = false, preValidateMethod = 'GET'
} = {}) {
  const experiences = [];
  const ranges = [];
  const done = new Set();
  const declared = usableCapabilities(capabilities);
  const preValidation = usablePreValidation({ preValidateAssets, preValidateMethod });
  const request = firstRequest && preValidation.enabled
    ? (uri, mediaType) => firstRequest(uri, mediaType, { method: preValidation.method })
    : null;
  // The two things `settled` is made of, and neither is about the programme:
  // whether the SOURCE can still hand over ranges, and how many asset-lists are
  // in flight. A list is complete when nothing more can arrive and nothing is
  // half resolved. A break whose list is not due yet is NOT in flight: its range
  // is already in the list, provisional, off its tag (ADR 0108).
  let sourceClosed = false;
  let pending = 0;
  /**
   * id -> a break whose asset-list is not due yet: `{ id, url, slotStart, kind,
   * pre, dateRange, range }`. A live preroll whose join point is not known yet
   * waits here with `slotStart` null and no range (`preRollPlacement`).
   */
  const waiting = new Map();
  /** id -> a preroll of a kind not resolved here, waiting for the live join point to be placed. */
  const unplaced = new Map();
  /** Whether playback has joined: a preroll first seen after that is not presented (ADR 0110). */
  let joined = false;
  /**
   * id -> a POST-ROLL (`CUE="POST"`, ADR 0111): `{ id, kind, dateRange, url,
   * state, startTime, experiences }`. `url` is null for the kind only reported
   * here. `state` is `waiting`, `requested`, `resolved` or `failed`;
   * `startTime` is the end of the programme, null while it has none (live).
   * Its experiences are NOT in `experiences`: they play after the programme,
   * by their own clock (lib/postroll.js).
   */
  const postRolls = new Map();
  /**
   * id -> a `CUE="ONCE"` break (ADR 0112): `{ entered, spent }`. Once spent its
   * experiences and its range leave the lists for good, as hls.js takes a ONCE
   * interstitial out of its schedule after it played.
   */
  const onces = new Map();
  /** Whether the programme is buffered to its end: BUFFERED_TO_END, or the media ended. */
  let bufferedToEnd = false;

  /** Where a preroll goes given the playlist just read: hls.js's reading, live included (ADR 0110). */
  function placePreRoll(details, alreadyJoined = joined) {
    return preRollPlacement({
      startPosition: hls.startPosition, live: details.live === true,
      liveSyncPosition: hls.liveSyncPosition, targetDuration: details.targetduration, joined: alreadyJoined
    });
  }

  /** Place the live prerolls that were waiting for the join point, now that there may be one. */
  function placeWaiting(details) {
    for (const brk of waiting.values()) {
      if (brk.slotStart != null) continue;
      const { start } = placePreRoll(details, false);
      if (start == null) continue;
      brk.slotStart = start;
      brk.range = provisionalRange(brk.id, brk.dateRange, start, brk.kind);
      if (brk.range) ranges.push(brk.range);
      console.log(`[signalling] ${brk.id}: the live join point is known, the preroll is placed at t=${start.toFixed(2)}s.`);
    }
    for (const [id, { dateRange }] of unplaced) {
      const { start } = placePreRoll(details, false);
      if (start == null) continue;
      unplaced.delete(id);
      const range = rangeOfDateRange(id, dateRange, start);
      if (range) ranges.push(range);
    }
  }

  hls.on(Hls.Events.LEVEL_UPDATED, (_event, data) => read(data.details));

  // THE TWO CLOCKS THE RULE OF ADR 0108 READS, which are the two hls.js reads:
  // how far the programme is buffered, and where it is playing. Every event
  // that can move either one asks again; asking is a loop over the breaks still
  // waiting, which is a handful, so it is not throttled.
  let watched = null;
  const watch = (media) => {
    if (!media || media === watched) return;
    watched = media;
    for (const type of ['timeupdate', 'seeking', 'progress']) media.addEventListener(type, due);
    for (const type of ['timeupdate', 'seeking', 'seeked']) media.addEventListener(type, spend);
    // The element's `ended` counts only when it is the PROGRAMME that ended: it
    // also fires at the end of an interstitial asset hls.js played on this
    // element (ADR 0114).
    media.addEventListener('ended', () => { if (programmeAtEnd(hls.interstitialsManager)) reachedEnd(); });
    due();
  };
  hls.on(Hls.Events.MEDIA_ATTACHED, (_event, data) => watch(data?.media));
  hls.on(Hls.Events.BUFFER_APPENDED, () => due());
  // The moment hls.js asks for a post-roll's list (ADR 0111): its buffer
  // controller fires this when the last fragment of an ended playlist is in.
  const reachedEnd = () => { bufferedToEnd = true; duePost(); };
  if (Hls.Events.BUFFERED_TO_END) hls.on(Hls.Events.BUFFERED_TO_END, reachedEnd);
  watch(hls.media);

  /** Request every waiting asset-list the rule says is due now. */
  function due() {
    const media = hls.media;
    if (!media || !waiting.size) return;
    // While hls.js plays one of its interstitials the element may be playing
    // the AD, on the ad's clock and the ad's buffer: neither says anything
    // about the programme, so nothing is decided until it is back (ADR 0114).
    if (linearOnScreen(hls.interstitialsManager)) return;
    const time = media.currentTime;
    const bufferedEnd = bufferedEndAt(rangesOf(media.buffered), time);
    for (const [id, brk] of waiting) {
      // A live preroll not placed yet has no window to draw into: it waits for
      // the join point, which the next playlist update brings (ADR 0110).
      if (brk.slotStart == null) continue;
      const span = brk.range ?? { startTime: brk.slotStart, duration: null };
      if (!assetListDue({ ...span, pre: brk.pre }, { time, bufferedEnd })) continue;
      waiting.delete(id);
      // Counted BEFORE the first await of `resolveBreak`: counted after it,
      // `pending` could touch zero between two lists due on the same tick and
      // `settled` would say "complete" over half a list.
      pending += 1;
      resolveBreak(brk);
    }
  }

  function read(details) {
    const anchor = (details.fragments || []).find((f) => f.programDateTime != null);
    if (!anchor) return;
    // A playlist without an ENDLIST can still grow, and while it can grow no
    // list of ranges is the final one. This is the whole limit of the promise:
    // it is a property of the source and not of this layer. In this POC it is
    // closed on the first update because the primary is a VOD with the Date
    // Ranges written in the media playlist (ADR 0005).
    if (details.live === false) sourceClosed = true;
    placeWaiting(details);

    // Everything that can be decided without going to the network is decided
    // here, synchronously: the kind, the slot, the URL and the provisional range.
    const toResolve = [];
    for (const [id, dateRange] of Object.entries(details.dateRanges || {})) {
      const kind = kindOfClass(dateRange.class);
      if (!kind || done.has(id)) continue;
      done.add(id);
      // A preroll sits where playback begins and not at its START-DATE, as in
      // hls.js (ADR 0110): on a live playlist, the live join point, and one
      // first seen after playback joined is not presented (`preRollPlacement`).
      // Every other break, at its START-DATE.
      const { pre, post, once } = cueOf(dateRange);
      if (once && !post) onces.set(id, { entered: false, spent: false });
      // A post-roll goes at the end of the programme, and only its linear
      // default plays there (ADR 0111): it is set aside here and placed below.
      if (post) {
        postRolls.set(id, {
          id, kind, dateRange, once, state: 'waiting', startTime: null, experiences: [],
          url: KINDS_RESOLVED.has(kind)
            ? listRequestUrl(dateRange.attr['X-ASSET-LIST'], details.url || location.href, sendCapabilities ? declared : null)
            : null
        });
        continue;
      }
      let slotStart;
      if (pre) {
        const placement = placePreRoll(details);
        if (placement.late) {
          console.log(`[signalling] ${id} is a preroll (CUE="PRE") first seen after playback joined:` +
            ' it is not presented, as hls.js does not step back into one (ADR 0110).');
          continue;
        }
        slotStart = placement.wait ? null : placement.start;
      } else slotStart = mediaTimeOf(dateRange.startDate, anchor);
      if (!KINDS_RESOLVED.has(kind)) {
        if (slotStart == null) { unplaced.set(id, { id, dateRange, kind }); continue; }
        const range = rangeOfDateRange(id, dateRange, slotStart);
        if (range) ranges.push(range);
        continue;
      }
      const url = listRequestUrl(dateRange.attr['X-ASSET-LIST'], details.url || location.href,
        sendCapabilities ? declared : null);
      toResolve.push({
        id, url, slotStart, kind, pre, dateRange,
        range: slotStart == null ? null : provisionalRange(id, dateRange, slotStart, kind)
      });
    }
    // Whether playback has joined, which is what makes a preroll seen from now
    // on a late one: the first update read with a media element there, as
    // hls.js's `checkStart` runs once there is media and loading has started.
    if (hls.media) joined = true;
    placePostRolls(details);

    // ON DEMAND (ADR 0108): the break is known and its list is not asked for
    // yet. Its range goes on the list now, provisional, off the tag -- so the
    // bar marks every break from the start, as it always did -- and the list
    // is asked for when the rule of hls.js says so.
    for (const brk of toResolve) {
      if (brk.range) ranges.push(brk.range);
      waiting.set(brk.id, brk);
      if (brk.slotStart == null) {
        console.log(`[signalling] ${brk.id} is a preroll (CUE="PRE") on a live playlist whose join point` +
          ' is not known yet: it is placed, and its asset-list requested, on the next update (ADR 0110).');
        continue;
      }
      console.log(brk.pre
        ? `[signalling] ${brk.id} is a preroll (CUE="PRE") at t=${brk.slotStart.toFixed(2)}s: its asset-list` +
          ' is requested at load, as hls.js does (ADR 0110).'
        : `[signalling] ${brk.id} at t=${brk.slotStart.toFixed(2)}s: its asset-list is requested` +
          ' when the programme is buffered up to it, or played or sought into it (ADR 0108).');
    }
    due();
    duePost();
  }

  /**
   * Give every post-roll the end of the programme, once there is one (ADR
   * 0111): at once on a VOD, and on live only when the playlist ends. The kind
   * only reported here gets its range there, marked `postroll`: it occupies no
   * time of the programme, so a bar draws nothing for it.
   */
  function placePostRolls(details) {
    const end = programEnd(details);
    if (end == null) return;
    for (const entry of postRolls.values()) {
      if (entry.startTime != null) continue;
      entry.startTime = end;
      if (entry.url) {
        console.log(`[signalling] ${entry.id} is a post-roll (CUE="POST") at the end of the programme,` +
          ` t=${end.toFixed(2)}s: its asset-list is requested when the programme is buffered to its end,` +
          ' and only its linear default plays, after the programme (ADR 0111).');
        continue;
      }
      const range = rangeOfDateRange(entry.id, entry.dateRange, end);
      if (range) ranges.push({ ...range, postroll: true });
    }
  }

  /** Request every post-roll's asset-list the rule says is due now (ADR 0111). */
  function duePost() {
    if (!postRollDue({ sourceClosed, bufferedToEnd })) return;
    for (const entry of postRolls.values()) {
      if (entry.state !== 'waiting' || !entry.url || entry.startTime == null) continue;
      entry.state = 'requested';
      pending += 1;
      resolvePost(entry);
    }
  }

  /** Ask for one post-roll's asset-list and keep its linear defaults. `pending` is already counting it. */
  async function resolvePost(entry) {
    const { id, url } = entry;
    console.log(`[signalling] ${id}: post-roll asset-list ${url}`);
    try {
      const assetList = await fetch(url).then((r) => r.json());
      const report = [];
      entry.experiences = resolvePostRoll(assetList, { id, slotStart: entry.startTime, report });
      entry.state = 'resolved';
      onResolved?.(entry.experiences.slice(), {
        id, url, postroll: true, capabilities: declared, sent: Boolean(sendCapabilities && declared),
        assets: report, requests: [], preValidation: { enabled: false, method: null }
      });
    } catch (error) {
      entry.state = 'failed';
      console.error(`[signalling] ${id}: the post-roll's asset-list could not be read, so it is cancelled` +
        ' (Appendix D.5): nothing plays after the programme.', url, error);
    } finally {
      pending -= 1;
    }
  }

  /**
   * Take every ONCE break that has played out of the lists (ADR 0112): its
   * experiences, so nothing draws it again and no tracking fires for it again,
   * and its range, so the bar stops marking it. In place, because
   * `experiences` is handed out by reference.
   */
  function spend() {
    const media = hls.media;
    if (!media || !onces.size) return;
    // Same reason as in `due`: the ad's clock would enter and leave windows of
    // the programme it never played (ADR 0114).
    if (linearOnScreen(hls.interstitialsManager)) return;
    const time = media.currentTime;
    for (const [id, state] of onces) {
      if (state.spent) continue;
      const { entered, spent } = onceProgress(ranges.find((r) => r.id === id), state.entered, time);
      state.entered = entered;
      if (!spent) continue;
      state.spent = true;
      waiting.delete(id);
      for (let i = experiences.length; i--;) if (experiences[i].id === id) experiences.splice(i, 1);
      for (let i = ranges.length; i--;) if (ranges[i].id === id) ranges.splice(i, 1);
      console.log(`[signalling] ${id} is CUE="ONCE" and has played: it leaves the experiences and the` +
        ' ranges for good, as hls.js removes it from its schedule (ADR 0112).');
    }
  }

  /** Ask for one break's asset-list, resolve it, and put it on the lists. `pending` is already counting it. */
  async function resolveBreak({ id, url, slotStart, kind, range: provisional }) {
    console.log(`[signalling] ${id} at t=${slotStart.toFixed(2)}s, asset-list ${url}`);
    // The provisional range leaves the list whatever happens below: what
    // replaces it is the range of what the list resolved into, or nothing.
    const drop = () => {
      const at = ranges.indexOf(provisional);
      if (at >= 0) ranges.splice(at, 1);
    };
    try {
      const assetList = await fetch(url).then((r) => r.json());
      const report = [];
      const requests = [];
      // The first requests go out HERE, between the list arriving and the
      // break being handed over, so `pending` keeps counting this break until
      // they are answered and `settled` cannot say "complete" before
      // pre-validation has been decided (ADR 0106, ADR 0107). They are those of
      // THIS break only: the moment its list arrives, and not the moment the
      // playlist does (ADR 0108).
      const resolved = request
        ? await resolveWithFirstRequests(assetList, {
          id, slotStart, capabilities: declared, report, firstRequest: request, requests
        })
        : resolveAssets(assetList, { id, slotStart, capabilities: declared, report });
      drop();
      // A ONCE break already played while its list was on its way stays gone (ADR 0112).
      if (onces.get(id)?.spent) return;
      experiences.push(...resolved);
      const range = rangeOfExperiences(id, resolved, kind);
      if (range) ranges.push(range);
      onResolved?.(resolved, {
        id, url, capabilities: declared, sent: Boolean(sendCapabilities && declared), assets: report, requests,
        preValidation: { enabled: Boolean(request), method: request ? preValidation.method : null }
      });
    } catch (error) {
      drop();
      // The SECOND rung of Appendix D.5: when the LIST itself cannot be had,
      // what is cancelled is the whole interstitial, with offset 0. Under
      // this render offset 0 is what already happened -- the primary was
      // never interrupted -- so cancelling is exactly this: no experience, no
      // range on the bar, and the programme carrying on. The error is the
      // report; the break leaves no other trace, which is why it is an error
      // and not a warning.
      console.error(`[signalling] ${id}: the asset-list could not be read, so the whole break is` +
        ' cancelled with offset 0 (Appendix D.5): nothing is played, no range is reported, and' +
        ' the programme is not interrupted.', url, error);
    } finally {
      pending -= 1;
    }
  }

  return {
    activeAt: (time) => activeAt(experiences, time),
    // Where all the ranges of the programme are, which is a different question
    // from what is active now. A fresh array on every call, sorted, so the
    // caller cannot reorder the layer's own state. A range is replaced once:
    // a provisional one, off the tag, by the one its list resolved into.
    programRanges: () => ({
      ranges: [...ranges].sort((a, b) => a.startTime - b.startTime),
      settled: sourceClosed && pending === 0
    }),
    // The post-rolls of the programme (ADR 0111), in the order of their tags:
    // what plays after it ends. A fresh copy on every call. Each one is `{ id,
    // kind, state, startTime, experiences }`, and its experiences are linear
    // ads only; `activeAt` never hands them over.
    postRolls: () => [...postRolls.values()]
      .filter((entry) => entry.url)
      .map(({ id, kind, once, state, startTime, experiences }) => ({
        id, kind, once: Boolean(once), state, startTime, experiences: experiences.slice()
      })),
    experiences
  };
}
