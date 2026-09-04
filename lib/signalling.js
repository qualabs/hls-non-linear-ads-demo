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
export const DEFAULT_PRIMARY = { zDepth: 0, volume: 100, viewport: '0 0 0 0' };
export const DEFAULT_VOLUME = 100;
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
    // a muted ad would come out at 100 and take the audio of the show.
    volume: Number(source.volume ?? DEFAULT_VOLUME),
    uri: isPrimary ? null : source.uri || null,
    mediaType: isPrimary ? null : source.type || null
  };
}

/**
 * One item of the `payload` array becomes one experience. `slotStart` is the
 * playback time the Date Range's START-DATE resolves to, and the item's `start`
 * is an offset from it.
 */
export function resolveExperience(item, { id, slotStart }) {
  const layout = item.layout || {};
  const primary = layout.primaryContent ?? DEFAULT_PRIMARY; // default #1
  const elements = [resolveElement({ id: 'primaryContent', ...primary }, true)]
    .concat((layout.assets || []).map((a) => resolveElement(a, false)))
    // Ascending: the renderer draws in this order and the last one is on top.
    // Array.sort is stable, so equal zDepth keeps the order of the payload.
    .sort((a, b) => a.zDepth - b.zDepth);
  return {
    id,
    type: item.type,
    startTime: slotStart + Number(item.start ?? 0),
    duration: Number(item.duration),
    elements
  };
}

/**
 * Every experience an asset-list declares. `start` is read as an offset from
 * the START-DATE of the Date Range and not from the start of each ASSET: the
 * block's own `type` is "slot", and every payload the tool emits has a single
 * asset with `start: 0`. If a multi-asset asset-list ever shows up, this is the
 * line to check.
 */
export function resolveAssetList(assetList, { id, slotStart }) {
  const out = [];
  for (const asset of assetList?.ASSETS || []) {
    const block = asset['X-AD-CREATIVE-SIGNALING'];
    for (const item of block?.payload || []) {
      out.push(resolveExperience(item, { id, slotStart }));
    }
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
        console.error('[signalling] asset-list failed', url, error);
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
