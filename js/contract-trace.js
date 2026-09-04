// contract-trace.js -- the consumer side of the seam of ADR 0003, and for now
// the whole of it: it prints the contract to the console instead of drawing it.
// The renderer of T-07 comes in here, next to this file, and reads exactly the
// same objects.
//
// Nothing here knows where the boxes come from, and that is the point: no
// import of the player library, and not one word of the transport or of its
// tags. This side gets a provider with a single method, `activeAt(time)`, and a
// list of boxes in percentages. The day the layer underneath is replaced --
// a patched player, the client-side API the player library has open for its
// next version, the other platform's framework -- nothing on this side
// changes. Grepping this file for the transport's vocabulary is the check, and
// it is part of the done of T-06.

/**
 * @param provider  something with `activeAt(time) -> Experience[]`
 * @param video     the element that gives the playback time
 * @param hud       one line of text under the player, for the recording
 */
export function traceContract({ provider, video, hud }) {
  const trace = [];
  let last = null;

  function tick() {
    const time = video.currentTime;
    const active = provider.activeAt(time);
    // The line of text follows the clock; the console only speaks on a change.
    if (hud) hud.textContent = describeActive(active, time);
    const key = active.map((e) => `${e.type}#${e.id}`).join(',');
    if (key === last) return;
    last = key;

    if (!active.length) {
      console.log(`[contract] t=${time.toFixed(2)}s  nothing active`);
      trace.push({ time: +time.toFixed(2), active: [] });
      return;
    }
    for (const experience of active) {
      const { id, type, startTime, duration, elements } = experience;
      console.log(
        `[contract] t=${time.toFixed(2)}s  ACTIVE ${type}#${id}  ` +
          `window ${startTime.toFixed(2)}s -> ${(startTime + duration).toFixed(2)}s  ` +
          `${elements.length} elements, ordered by zDepth:`
      );
      // The boxes and the order, which is what T-06 has to show in the console.
      console.table(
        elements.map((e) => ({
          zDepth: e.zDepth,
          element: e.id,
          primary: e.primary,
          'box t/r/b/l %': `${e.box.top}/${e.box.right}/${e.box.bottom}/${e.box.left}`,
          volume: e.volume,
          uri: e.uri ?? '(the primary content)'
        }))
      );
    }
    trace.push({ time: +time.toFixed(2), active });
  }

  video.addEventListener('timeupdate', tick);
  video.addEventListener('seeked', tick);
  return { trace, tick };
}

/** The state as one line of text, so a screenshot says what was active. */
export function describeActive(active, time) {
  if (!active.length) return `t=${time.toFixed(1)}s · no concurrent experience`;
  return active
    .map(
      (e) =>
        `t=${time.toFixed(1)}s · ${e.type} · ` +
        e.elements
          .map((el) => `z${el.zDepth} ${el.id} [${el.box.top} ${el.box.right} ${el.box.bottom} ${el.box.left}]`)
          .join(' · ')
    )
    .join(' | ');
}
