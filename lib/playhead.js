// playhead.js -- where the programme is, read the way every transport needs it.
//
// Three small readings of the programme's clock and buffer that the signalling
// of any format makes before it can say a break is due or spent: whether a
// ONCE break has played, whether a post-roll is due, and where the forward
// buffer ends. They are pure, so the tests hand them numbers.
//
// The rules they implement came from the first player this library ran on (ADR
// 0108, 0109, 0111, 0112), and where that player takes each one from is written
// in the signalling of that format, next to the code that calls them. What is
// here is the rule, which a second format reads the same way (ADR 0117, phase 19).

/**
 * WHETHER A ONCE BREAK HAS PLAYED, AND SO LEAVES (ADR 0112). "Played" is
 * "started, then left", not "completed": a ONCE break that was entered and then
 * sought out of is gone too. A seek that jumps OVER it never entered it, and it
 * stays.
 *
 * `entered` is whether the programme has been inside the break's window (its
 * range, provisional or resolved), and the answer is `{ entered, spent }` for
 * the programme at `time`: spent once it was entered and is now outside.
 */
export function onceProgress(range, entered, time) {
  if (!range || !Number.isFinite(time)) return { entered: Boolean(entered), spent: false };
  const inside = time >= range.startTime && time < range.startTime + range.duration;
  if (inside) return { entered: true, spent: false };
  return { entered: Boolean(entered), spent: Boolean(entered) };
}

/**
 * Whether a post-roll's list is due (ADR 0111): when the source is closed --
 * the programme has an end, which a live one does not -- and the programme is
 * buffered to that end. Reaching the end of the programme counts as buffered to
 * it.
 */
export function postRollDue({ sourceClosed = false, bufferedToEnd = false } = {}) {
  return Boolean(sourceClosed && bufferedToEnd);
}

/**
 * The hole, in seconds, that `bufferedEndAt` steps over: 0.1 s, the smallest
 * hole the player this library first ran on calls irrelevant.
 *
 * WHY THERE IS A TOLERANCE AT ALL (ADR 0109, 2026-10-22 note). The first
 * buffered range of a packaged programme does not start at 0: here it starts at
 * 0.067 s, the first presentation timestamp of the first segment. With no
 * tolerance a page paused at 0 has a forward buffer that ends at the playhead,
 * so the first break's list is not asked for until play, even with the buffer
 * already past the break.
 */
export const BUFFER_HOLE_TOLERANCE = 0.1;

/**
 * Where the forward buffer ends: the end of the buffered range that contains
 * `time`, or `time` itself when none does. A hole smaller than `tolerance` is
 * stepped over: ranges closer than that are merged, and a range that starts
 * less than that ahead of the playhead counts as containing it. A bigger hole is
 * not jumped. `ranges` is a list of `[start, end]`, which `rangesOf` makes out
 * of a media element's `buffered`.
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
export function rangesOf(buffered) {
  const out = [];
  for (let i = 0; i < (buffered?.length ?? 0); i += 1) out.push([buffered.start(i), buffered.end(i)]);
  return out;
}
