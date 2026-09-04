// signalling.js -- the signalling layer of ADR 0003.
//
// It has ONE job: for a given playback time, hand over the list of active
// concurrent experiences with their layout already resolved. Everything that
// knows the word HLS lives on this side of the seam: the LEVEL_UPDATED
// subscription, the Date Ranges, the asset-list request, and the
// X-AD-CREATIVE-SIGNALING block. What comes out the other end is the contract,
// and the contract is plain data -- see tasks/T-06/t06-contrato.md.
//
// The pure functions are exported one by one on purpose: they are the surface
// the tests of T-08 aim at, and the module reaches for the `Hls` global only
// INSIDE createSignalling(), so `node --test` can import this file.

/** The class of ADR 0009: sibling of Apple's interstitial, not an extension. */
export const CONCURRENT_CLASS = 'com.qualabs.hls.concurrentInterstitial';

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
  const done = new Set();

  hls.on(Hls.Events.LEVEL_UPDATED, (_event, data) => read(data.details));

  async function read(details) {
    const anchor = (details.fragments || []).find((f) => f.programDateTime != null);
    if (!anchor) return;
    for (const [id, dateRange] of Object.entries(details.dateRanges || {})) {
      if (dateRange.class !== CONCURRENT_CLASS || done.has(id)) continue;
      done.add(id);
      const slotStart = mediaTimeOf(dateRange.startDate, anchor);
      const url = new URL(dateRange.attr['X-ASSET-LIST'], details.url || location.href).href;
      console.log(`[signalling] ${id} at t=${slotStart.toFixed(2)}s, asset-list ${url}`);
      try {
        const assetList = await fetch(url).then((r) => r.json());
        const resolved = resolveAssetList(assetList, { id, slotStart });
        experiences.push(...resolved);
        onResolved?.(resolved);
      } catch (error) {
        console.error('[signalling] asset-list failed', url, error);
      }
    }
  }

  return {
    activeAt: (time) => activeAt(experiences, time),
    experiences
  };
}
