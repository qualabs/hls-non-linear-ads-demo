// date-range-marks.js -- the breaks of a programme on a page's own progress bar,
// read off hls.js and nothing else (ADR 0101).
//
// WHY IT IS A DEMO FILE AND NOT THE LIBRARY'S. The library asks for each break's
// asset-list when hls.js would (ADR 0100), so what a page knows about a break
// before its list arrives is what the playlist says: where it starts and how long
// it is planned to last. hls.js already parsed that, in the Date Ranges of the
// level details, and leaves it to any page. So a page that draws its own bar
// reads the breaks there, and the library is not asked for an option to fetch
// every list up front. The library does not name a demo (ADR 0015), and this file
// is the demos'.
//
// WHERE IT IS MOUNTED: NOWHERE YET, AND THAT IS ON PURPOSE. Every page of this
// repository draws its bar with the library's controls, and that bar already
// marks every break from the start, off the same tags (`programRanges()`,
// `provisional`, ADR 0100). Mounting this as well would draw each break twice.
// Whether the library keeps decorating its bar or leaves it to the pages is an
// open point of ADR 0101; this is what a page mounts the day it is the page's.
// Each bucket publishes one demo folder (CLAUDE.md), so a page that mounts it
// takes a copy into its own js/ or the server gets a mount for this folder.
//
// WHAT IS READ, from the hls.js 1.7.2 this repository vendors:
//
//   `details.dateRanges`   the Date Ranges of a level, keyed by ID, on
//                          LEVEL_LOADED and LEVEL_UPDATED.
//   `dateRange.startTime`  seconds of the programme, which hls.js computes from
//                          START-DATE against the EXT-X-PROGRAM-DATE-TIME of the
//                          segment the tag is anchored to (`tagAnchor`). NaN when
//                          there is no such anchor, and then the break is not
//                          placed.
//   `dateRange.plannedDuration`, then `dateRange.duration`: PLANNED-DURATION
//                          first, because that is what the tag of a break of
//                          this repository declares, and DURATION when that is
//                          all there is. A tag with neither is not placed.
//   `details.totalduration`   the length of the programme, unless the page
//                          hands its own (the media element's `duration`).

/**
 * The breaks of a level, off its Date Ranges: `{ id, class, startTime, duration }`,
 * sorted by `startTime`. `classes`, when given, keeps only the Date Ranges of
 * those CLASS values. A Date Range that cannot be placed -- no start, or no length
 * -- is left out, as the library leaves out a range it cannot measure.
 */
export function breaksOfDateRanges(dateRanges, { classes = null } = {}) {
  const out = [];
  for (const [id, range] of Object.entries(dateRanges || {})) {
    if (classes && !classes.includes(range?.class)) continue;
    const startTime = Number(range?.startTime);
    const declared = range?.plannedDuration ?? range?.duration;
    const duration = Number(declared);
    if (!Number.isFinite(startTime) || declared == null || !Number.isFinite(duration) || duration <= 0) continue;
    out.push({ id, class: range.class, startTime, duration });
  }
  return out.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Where each break sits on a bar of the programme's `length`: `left` and `width`
 * as fractions of the whole bar, clipped to it. A break that falls past the end,
 * or a bar with no length yet, gives nothing to draw.
 */
export function barFractions(breaks, length) {
  if (!(length > 0)) return [];
  const clip = (value) => Math.max(0, Math.min(1, value));
  const out = [];
  for (const brk of breaks) {
    const from = clip(brk.startTime / length);
    const to = clip((brk.startTime + brk.duration) / length);
    if (to > from) out.push({ id: brk.id, class: brk.class, left: from, width: to - from });
  }
  return out;
}

/**
 * Draw the breaks on a page's bar and keep them current. `bar` is the element the
 * marks go in, positioned, as wide as the bar; `colourOf(class)` gives the colour
 * of a mark, and a class with no colour is not drawn; `video`, when given, gives
 * the length (its `duration`) instead of the playlist's. Returns `{ breaks, stop }`.
 */
export function markBreaksOnBar(hls, bar, { classes = null, colourOf = () => 'currentColor', video = null } = {}) {
  let breaks = [];
  let total = 0;
  let key = null;

  function paint() {
    const length = video && Number.isFinite(video.duration) && video.duration > 0 ? video.duration : total;
    const spans = barFractions(breaks, length);
    const next = `${length}|${spans.map((s) => `${s.id}:${s.left}:${s.width}`).join(',')}`;
    if (next === key) return;
    key = next;
    bar.replaceChildren(...spans.flatMap((span) => {
      const colour = colourOf(span.class);
      if (!colour) return [];
      const node = document.createElement('div');
      node.className = 'date-range-mark';
      node.dataset.id = span.id;
      Object.assign(node.style, {
        position: 'absolute', top: '0', bottom: '0',
        left: `${span.left * 100}%`, width: `${span.width * 100}%`, background: colour
      });
      return [node];
    }));
  }

  const onLevel = (_event, data) => {
    const details = data?.details;
    if (!details) return;
    breaks = breaksOfDateRanges(details.dateRanges, { classes });
    total = Number(details.totalduration) || 0;
    paint();
  };
  hls.on(Hls.Events.LEVEL_LOADED, onLevel);
  hls.on(Hls.Events.LEVEL_UPDATED, onLevel);
  video?.addEventListener('durationchange', paint);

  return {
    breaks: () => breaks.slice(),
    stop() {
      hls.off(Hls.Events.LEVEL_LOADED, onLevel);
      hls.off(Hls.Events.LEVEL_UPDATED, onLevel);
      video?.removeEventListener('durationchange', paint);
      bar.replaceChildren();
    }
  };
}
