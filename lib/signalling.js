// signalling.js -- the signalling layer of ADR 0003.
//
// It has ONE job: for a given playback time, hand over the list of active
// concurrent experiences with their layout already resolved. Everything that
// knows the word HLS lives on this side of the seam: the LEVEL_UPDATED
// subscription, the Date Ranges, the asset-list request, and the
// X-AD-CREATIVE-SIGNALING block. What comes out the other end is the contract,
// and the contract is plain data -- see docs/contrato-senalizacion-renderizado.md.
//
// The pure functions are exported one by one on purpose: they are the surface
// the tests of T-08 aim at, and the module reaches for the `Hls` global only
// INSIDE createSignalling(), so `node --test` can import this file.

/** The class of ADR 0009: sibling of Apple's interstitial, not an extension. */
export const CONCURRENT_CLASS = 'com.qualabs.hls.concurrentInterstitial';

/**
 * Apple's traditional interstitial. The same playlist signals one per break for
 * the clients that are already in the market (ADR 0007), and this layer used to
 * drop it by class because nothing here plays it. It is read now because the
 * ranges of the programme say WHICH KIND each range is, and that one is a kind:
 * it marks where a market client would have stopped.
 */
export const INTERSTITIAL_CLASS = 'com.apple.hls.interstitial';

/**
 * The kind of range a Date Range class means. This object is the ONE place a
 * class string is turned into something the contract can carry: the kind
 * crosses the seam, the class never does (ADR 0003). A class that is not in
 * here is not a range of the programme.
 */
export const KIND_OF_CLASS = {
  [CONCURRENT_CLASS]: 'concurrent',
  [INTERSTITIAL_CLASS]: 'interstitial'
};

export function kindOfClass(hlsClass) {
  return KIND_OF_CLASS[hlsClass] ?? null;
}

// The two defaults the SVTA tool OMITS. Measured in T-03: of the six payloads
// the tool emits, the two overlays carry no `primaryContent` block at all, and
// none of the six carries `volume` on any element -- even though the tool's own
// presets have primaryContent at zDepth 0, volume 100, viewport "0 0 0 0".
// So the layer ASSUMES them; asking for those fields would break on a real
// payload copied out of the tool (ADR 0004: consume it as it is emitted).
//
// THE VOLUME HAS TWO DEFAULTS AND NOT ONE, AND CONFUSING THEM TURNS THE SHOW
// OFF. An absent `volume` is silence on an element of the ad and full volume on
// the primary content (ADR 0014). The asymmetry is the whole of the decision:
// the tool omits the field on EVERY element, the `primaryContent` block
// included, so one default of 0 for all of them would leave the programme mute
// in the five layouts, and that is a failure nothing on screen reports. What
// buys the 0 on the ad side is that unexpected audio on camera is worse than
// missing audio -- an ad that should have sounded is one click away, an ad that
// takes the audio of the show ruins the take. The primary content has no such
// trade: it was already playing before the break and the field being absent
// says nothing about it.
//
// It is a deliberate divergence with the tool, for which an absent `volume` is
// 100 everywhere. ADR 0014 argues it and leaves it written down as a question
// for SVTA.
export const DEFAULT_PRIMARY_VOLUME = 100;
export const DEFAULT_AD_VOLUME = 0;
export const DEFAULT_PRIMARY = { zDepth: 0, volume: DEFAULT_PRIMARY_VOLUME, viewport: '0 0 0 0' };
export const FULL_FRAME = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * `viewport` is four percentages of INSET in the order top, right, bottom,
 * left: how much each edge is pulled in from the player area (ADR 0001).
 */
export function parseViewport(viewport) {
  const n = String(viewport ?? '').trim().split(/[\s,]+/).map(Number);
  if (n.length !== 4 || n.some((v) => !Number.isFinite(v))) {
    console.warn('[signalling] viewport is not four numbers, using the full frame:', viewport);
    return { ...FULL_FRAME };
  }
  return { top: n[0], right: n[1], bottom: n[2], left: n[3] };
}

/** One element of the layout, in the shape the contract declares. */
export function resolveElement(source, isPrimary) {
  return {
    id: source.id ?? (isPrimary ? 'primaryContent' : 'asset'),
    primary: isPrimary,
    box: parseViewport(source.viewport),
    zDepth: Number(source.zDepth ?? 0),
    // `??` and not `||`: volume 0 is a legal value and means silent. With `||`
    // an ad declared silent on purpose would come out at the default and take
    // the audio of the show, and it is one character of difference.
    // The default depends on WHICH element this is, and that asymmetry is the
    // one above: 0 for an element of the ad, 100 for the primary content.
    volume: Number(source.volume ?? (isPrimary ? DEFAULT_PRIMARY_VOLUME : DEFAULT_AD_VOLUME)),
    uri: isPrimary ? null : source.uri || null,
    mediaType: isPrimary ? null : source.type || null
  };
}

/**
 * One item of the `payload` array becomes one experience.
 *
 * THE WINDOW IS BUILT FROM THREE NUMBERS AND EACH ONE ANSWERS A DIFFERENT
 * QUESTION. `slotStart` is the playback time the Date Range's START-DATE
 * resolves to, so it says where the BREAK begins. `assetStart` is how far into
 * the break the ASSET this item belongs to begins, and `resolveAssetList`
 * below is the one that knows it. The item's own `start` is an offset from
 * there, inside its own asset.
 *
 * `itemId` is the identity of this ad INSIDE the break, and it is not the same
 * thing as `id`: `id` names the Date Range and every ad of the break shares it.
 * It falls back to `id` because one experience resolved on its own IS the
 * whole break, and every caller that resolves a list passes it.
 */
export function resolveExperience(item, { id, itemId = id, slotStart, assetStart = 0 }) {
  const layout = item.layout || {};
  const primary = layout.primaryContent ?? DEFAULT_PRIMARY; // default #1
  const elements = [resolveElement({ id: 'primaryContent', ...primary }, true)]
    .concat((layout.assets || []).map((a) => resolveElement(a, false)))
    // Ascending: the renderer draws in this order and the last one is on top.
    // Array.sort is stable, so equal zDepth keeps the order of the payload.
    .sort((a, b) => a.zDepth - b.zDepth);
  return {
    id,
    itemId,
    type: item.type,
    startTime: slotStart + assetStart + Number(item.start ?? 0),
    duration: Number(item.duration),
    elements
  };
}

/** The extension of ADR 0019: our block, on top of the standard asset. */
export const BLOCK = 'X-AD-CREATIVE-SIGNALING';

/**
 * What the contract calls an ad this layer drew no layout for. It is a label
 * of OUR side and not a value anybody has to write in an asset-list: the
 * alternative the phase rejected was asking the list to declare
 * `"type": "linear"`, which the tool does not emit and which the standard
 * already expresses by the block simply not being there.
 */
export const LINEAR_TYPE = 'linear';

/** The id the one element of a synthesized linear experience carries. */
export const LINEAR_ELEMENT_ID = 'linear';

/**
 * Whether the block of an asset is one this client can draw, and it is the
 * fallback decision of ADR 0019 written as a function: it returns the payload
 * when the block is usable and `null` when it is not, and the caller does the
 * same thing in both of the `null` cases.
 *
 * THE UNIT OF THE FALLBACK IS THE ASSET AND NOT THE ITEM. One unreadable item
 * takes its whole asset to the linear path, because what the fallback plays is
 * the asset's `URI` -- a per-item fallback would have to play that same `URI`
 * for one item while drawing the layout of another over it, which is one ad on
 * top of itself.
 *
 * WHAT IS CHECKED IS WHAT IS DRAWN, and the list is short on purpose: no
 * payload at all, an item with no window -- a `duration` that is not a
 * positive number -- and a layout with no assets in it. Those are the three
 * shapes that cannot become a box on a screen no matter what the renderer
 * does.
 *
 * TWO THINGS ARE DELIBERATELY NOT CHECKED, and each one would break something
 * that works. An element with an EMPTY `uri` is not a failure of the block:
 * the SVTA tool emits `"uri": ""` in every one of its six payloads, with
 * `"URI": "[PATH TO ASSET]"` above it, so a client that took that for
 * unreadable would fall back on every asset-list the tool produces, and
 * ADR 0004 is exactly the decision not to do that. And the `type` of an
 * element -- see the contract for why the media type is not a fallback of this
 * layer.
 */
export function usablePayload(block) {
  if (block == null) return null;
  const payload = block.payload;
  if (!Array.isArray(payload) || payload.length === 0) return null;
  for (const item of payload) {
    if (!item || typeof item !== 'object') return null;
    if (!(Number(item.duration) > 0)) return null;
    const assets = item.layout?.assets;
    if (!Array.isArray(assets) || assets.length === 0) return null;
  }
  return payload;
}

/** The asset's own `URI`, which is what the fallback plays, or null. */
export function usableUri(asset) {
  const uri = asset?.URI;
  return typeof uri === 'string' && uri.trim() ? uri.trim() : null;
}

/**
 * The experience a bare asset becomes: ONE element at full frame with the
 * asset's own `URI`, on top of the primary content, and the primary content
 * underneath, covered and silent -- and STILL PLAYING, which is the whole of
 * why this shape was chosen. Nothing here is a new field of the contract: it
 * is the same `viewport`, `zDepth` and `volume` every other layout uses, so
 * the renderer draws a linear ad without learning a single thing.
 *
 * The volume is the one asymmetry: 100 on the ad and 0 on the programme, which
 * is the opposite of the default a missing field takes (ADR 0014). A concurrent
 * ad that says nothing about its audio enters silent because it is mixed OVER a
 * programme somebody is listening to; this one is not mixed over anything --
 * it covers the frame, and an ad at full frame with no sound is a fault
 * nothing on screen reports.
 */
export function linearItem(uri, duration) {
  return {
    type: LINEAR_TYPE,
    start: 0,
    duration,
    layout: {
      primaryContent: { zDepth: 0, volume: 0, viewport: '0 0 0 0' },
      assets: [{ id: LINEAR_ELEMENT_ID, uri, viewport: '0 0 0 0', zDepth: 1, volume: 100 }]
    }
  };
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
 */
export function resolveAssetList(assetList, { id, slotStart }) {
  const out = [];
  const assets = assetList?.ASSETS;
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
  for (const asset of assets) {
    const declared = Number(asset?.DURATION);
    const block = asset?.[BLOCK];
    const payload = usablePayload(block);
    const uri = usableUri(asset);
    if (payload) {
      for (const item of payload) {
        // The ordinal of the whole list and not of the ASSETS array, so that two
        // items of a single asset are two identities and not one.
        out.push(resolveExperience(item, { id, itemId: `${id}.${out.length}`, slotStart, assetStart }));
      }
    } else if (uri && declared > 0) {
      // THE ONE PATH OF ADR 0019, TAKEN BY TWO KINDS OF ASSET. One is the
      // linear ad, declared the way it was always declared: `URI`, `DURATION`,
      // and no block of ours. The other is an ad we WOULD have drawn and
      // cannot, because its block is unreadable or asks for something this
      // client does not do. They are not the same event and they are said
      // differently below, but what is played is the same thing: the asset's
      // own `URI`, full frame, over a programme that keeps running behind it.
      if (block == null) {
        console.log(`[signalling] ${id}: an ASSET carries no layout block, so it is a linear ad and` +
          ' plays its own URI full frame (ADR 0019).');
      } else {
        console.warn(`[signalling] ${id}: an ASSET carries a layout block this client cannot draw,` +
          " so it falls back to the asset's own URI and plays as a linear ad (ADR 0019).");
      }
      out.push(resolveExperience(linearItem(uri, declared),
        { id, itemId: `${id}.${out.length}`, slotStart, assetStart }));
    } else {
      // The FIRST rung of Appendix D.5, and the distinction it makes is the
      // one that matters: what is skipped is THAT ASSET and not the break. The
      // accumulator below still advances by the declared DURATION, so the
      // assets after it keep the windows they already had -- a skip that moved
      // them would be the break failing, one asset at a time.
      console.warn(`[signalling] ${id}: an ASSET has nothing this client can play -- no usable` +
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
 * The window a concurrent break occupies on the primary timeline, built from
 * the experiences its asset-list resolved into: from the first one to start to
 * the last one to end. One Date Range is ONE range of the programme even when
 * its payload declares several experiences, because what a bar marks is the
 * break and not each ad inside it.
 */
export function rangeOfExperiences(id, experiences) {
  if (!experiences.length) return null;
  const startTime = Math.min(...experiences.map((e) => e.startTime));
  const end = Math.max(...experiences.map((e) => e.startTime + e.duration));
  return { id, kind: 'concurrent', startTime, duration: end - startTime };
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

/** The activation window, half open: active from startTime, out at the end. */
export function activeAt(experiences, time) {
  return experiences.filter((e) => time >= e.startTime && time < e.startTime + e.duration);
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
 * The one impure function, and the only place hls.js is touched: subscribe to
 * LEVEL_UPDATED, keep the Date Ranges of our class, ask for their X-ASSET-LIST
 * (the APPLICATION asks -- hls.js runs with its interstitials controller off,
 * so it never will, which T-02 verified in flight), and resolve the layout.
 */
export function createSignalling(hls, { onResolved } = {}) {
  const experiences = [];
  const ranges = [];
  const done = new Set();
  // The two things `settled` is made of, and neither is about the programme:
  // whether the SOURCE can still hand over ranges, and how many asset-lists are
  // in flight. A list is complete when nothing more can arrive and nothing is
  // half resolved.
  let sourceClosed = false;
  let pending = 0;

  hls.on(Hls.Events.LEVEL_UPDATED, (_event, data) => read(data.details));

  async function read(details) {
    const anchor = (details.fragments || []).find((f) => f.programDateTime != null);
    if (!anchor) return;
    // A playlist without an ENDLIST can still grow, and while it can grow no
    // list of ranges is the final one. This is the whole limit of the promise:
    // it is a property of the source and not of this layer. In this POC it is
    // closed on the first update because the primary is a VOD with the Date
    // Ranges written in the media playlist (ADR 0005).
    if (details.live === false) sourceClosed = true;

    // Two passes, and the split is not cosmetic. Everything that can be decided
    // without going to the network is decided here, synchronously, so that
    // `pending` is already counting every asset-list before the first `await`.
    // Counted inside the loop below, `pending` would touch zero between two
    // fetches and `settled` would say "complete" over half a list.
    const toResolve = [];
    for (const [id, dateRange] of Object.entries(details.dateRanges || {})) {
      const kind = kindOfClass(dateRange.class);
      if (!kind || done.has(id)) continue;
      done.add(id);
      const slotStart = mediaTimeOf(dateRange.startDate, anchor);
      if (kind !== 'concurrent') {
        const range = rangeOfDateRange(id, dateRange, slotStart);
        if (range) ranges.push(range);
        continue;
      }
      toResolve.push({ id, dateRange, slotStart });
    }
    pending += toResolve.length;

    for (const { id, dateRange, slotStart } of toResolve) {
      const url = new URL(dateRange.attr['X-ASSET-LIST'], details.url || location.href).href;
      console.log(`[signalling] ${id} at t=${slotStart.toFixed(2)}s, asset-list ${url}`);
      try {
        const assetList = await fetch(url).then((r) => r.json());
        const resolved = resolveAssetList(assetList, { id, slotStart });
        experiences.push(...resolved);
        const range = rangeOfExperiences(id, resolved);
        if (range) ranges.push(range);
        onResolved?.(resolved);
      } catch (error) {
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
  }

  return {
    activeAt: (time) => activeAt(experiences, time),
    // Where all the ranges of the programme are, which is a different question
    // from what is active now. A fresh array on every call, sorted, so the
    // caller cannot reorder the layer's own state; the range objects are the
    // same ones, because a range never changes once it is reported.
    programRanges: () => ({
      ranges: [...ranges].sort((a, b) => a.startTime - b.startTime),
      settled: sourceClosed && pending === 0
    }),
    experiences
  };
}
