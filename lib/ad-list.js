// ad-list.js -- what a break's list of ads resolves into, in any transport.
//
// A break is announced by its transport and its ads arrive in a list: the
// ordered `ASSETS` of Appendix D.2 of the HTTP Live Streaming base, each with its
// `URI`, its `DURATION` and the block of ADR 0019 (`X-AD-CREATIVE-SIGNALING`,
// SVTA2053 6.4). That shape is the one this file reads, and it is the shape the
// signalling of every format hands it: the side of one transport reads its list
// as it comes, and the side of another converts what it read into the same
// shape before calling here (ADR 0117, phase 19). So the rules of the list --
// which option of an ad is drawn, when a default linear ad plays, when an asset
// is skipped, where each ad lands on the timeline, how the request for the list
// carries the capabilities -- are written once.
//
// It moved here from the signalling of the first format in phase 19, when the
// second one came to read it; its code did not change.

import { blockIdentifiers, isOffer, linearItem, resolveExperience, usablePayload, withOptions } from './experience.js';
import { narrowBlock } from './capabilities.js';

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
 * The first requests a list still needs before it can be resolved,
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
 * back over it. The answers live for one list and are not shared between
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
 * Every experience a list declares, one behind the other.
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
 * WHAT A POST-ROLL PLAYS, out of its list (ADR 0111): every asset's
 * LINEAR DEFAULT, its own `URI` with its `DURATION`, in order, and nothing
 * else. David Hassoun, 2026-10-22: "it should auto fail to the linear ad if
 * defined as a standard [break], or skip if only non-linear is defined".
 *
 * WHY THE NON-LINEAR OPTIONS ARE NOT EVEN LOOKED AT: a non-linear ad is drawn
 * over the programme, and after the end there is no programme to draw over. So
 * a post-roll is the standard linear break and only that -- what any client
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
 * THEY DO NOT BEGIN WITH THE PREFIX A TRANSPORT RESERVES for its own query
 * parameters; why that matters for the first one is written in its signalling.
 *
 * THE THIRD AXIS, `sgai-html-over-video`, IS NOT HERE ON PURPOSE. This library
 * draws `<img>` and `<video>` and nothing else (`media.js`), so there is no
 * value of that axis it could declare about itself and have it be true.
 */
export const VIDEO_DECODERS_PARAM = 'sgai-video-decoders';
export const IMAGE_OVER_VIDEO_PARAM = 'sgai-image-over-video';

/**
 * The URI of a break's list, resolved against the document that announced it,
 * carrying one parameter per configured capability. Without one the string
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
