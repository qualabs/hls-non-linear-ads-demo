// story.js -- the guided run, which is the page telling the story while the
// player plays it.
//
// The whole of it is: the experience stops by itself, a line of type says what
// you are about to see, the line goes, and the player carries on so you see it
// happen. When the ad is about to change it stops again, and that is where the
// business case gets made.
//
// FOUR THINGS ARE DECIDED AND NOT UP TO THIS FILE.
//
// 1  A BEAT NEVER NAMES A SECOND OF THE PROGRAMME (ADR 0037). It names a range
//    or an ad, and how far ahead of it to speak. The seconds are resolved here,
//    live, against the contract -- `programRanges()` and `experiences` -- so
//    moving a break in the signalling moves the story with it and nobody edits
//    anything. `resolveAnchor` below is the whole of that, and it is the only
//    place in this demo that turns signalling into a second.
//
// 2  IT ARMS ON `settled`, AND THE FIRST BEAT IS A CARD WITH THE PLAYER PAUSED
//    (ADR 0039). The asset-lists come over the network, so at t=0 there are no
//    ranges to resolve against. Opening on a card with the programme stopped
//    makes that race disappear instead of mitigating it: by the time the card
//    goes, the signalling has long since settled.
//
// 3  THE FREEZE IS `video.pause()` AND NOTHING ELSE (ADR 0040). The renderer
//    applies the playback state of the primary to every ad node that has a
//    timeline, so one call freezes the whole composition -- three boxes of video
//    included. Measured in the browser before this file was written: the boxes
//    go from playing to paused and their currentTime does not advance across
//    1600 ms of wall clock, and `play()` resumes each one on the frame it was
//    left at, so nothing here saves or restores positions.
//
// 4  THERE IS ONE WAY OUT AND IT IS THE BUTTON (ADR 0042). A click or a tap on
//    the player's own controls does NOT end the walkthrough. This is going to be
//    recorded, and a second exit that fires on any gesture is an exit that fires
//    by itself in the middle of a take.
//
// The beats are a file and not code (ADR 0038): `story/story.json`.

/** Where a beat hangs off the signalling, turned into a second of the programme.
 *
 * Three shapes and no more:
 *
 *   {"at": "start"}                                  before the programme runs
 *   {"before": {"break": n}, "lead": s}              s before the n-th break
 *   {"at": {"break": n, "ad": k}, "lead": s}         s before the k-th ad of it
 *
 * `n` and `k` are ordinals over what the contract hands back, sorted by time.
 * THE PAGE BUILDS NO IDENTIFIERS: `HYDRATION-BREAK` is a convention of the
 * signalling script and the story does not know it exists.
 *
 * Returns `null` when the anchor names something that is not there -- the fourth
 * ad of a break that has three -- and a null is what the demo's own test suite
 * turns into a red. That is what keeps ADR 0037 a property instead of an
 * intention.
 */
export function resolveAnchor(anchor, provider) {
  if (anchor?.at === 'start') return 0;
  const spec = anchor?.before ?? anchor?.at;
  if (!spec || typeof spec !== 'object') return null;
  const lead = Number(anchor.lead) || 0;

  const breaks = provider.programRanges().ranges
    .filter((r) => r.kind === 'concurrent')
    .sort((a, b) => a.startTime - b.startTime);
  const range = breaks[spec.break - 1];
  if (!range) return null;

  if (spec.ad == null) return Math.max(0, range.startTime - lead);

  const ads = provider.experiences
    .filter((e) => e.id === range.id)
    .sort((a, b) => a.startTime - b.startTime);
  const ad = ads[spec.ad - 1];
  if (!ad) return null;
  return Math.max(0, ad.startTime - lead);
}

/**
 * @param provider   the contract, `programRanges()` and `experiences`
 * @param video      the element playing the primary content
 * @param card       the element the line of type is written into
 * @param skip        the button, the one way out
 * @param url        where the beats are declared
 */
export async function runStory({ provider, video, card, skip, url = './story/story.json' }) {
  const story = await fetch(url).then((r) => r.json());
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // `settled` is true when the source can hand over no more ranges and none is
  // half resolved. Polling it is the whole of arming: there is no event for it,
  // and the card in front of the player is what pays for the wait.
  while (!provider.programRanges().settled) await wait(120);

  const beats = (story.beats || []).map((beat) => ({
    ...beat,
    at: resolveAnchor(beat.anchor, provider)
  }));

  // An anchor that does not resolve is said out loud and skipped, and the beat
  // is not invented at another second: a card over the wrong thing is the one
  // way this demo can look wrong without anything failing.
  for (const beat of beats) {
    if (beat.at === null) {
      console.error(`[story] the beat "${beat.id}" anchors to something the signalling does not` +
        ' have, so it is skipped. Check story/story.json against the asset-list.', beat.anchor);
    }
  }

  const queue = beats.filter((b) => b.at !== null).sort((a, b) => a.at - b.at);
  if (story.skip) skip.textContent = story.skip;

  let running = true;
  let speaking = false;

  // WHILE A CARD IS UP THE PROGRAMME STAYS STILL, whoever pressed play. The card
  // takes pointer events, so a person cannot reach the chrome underneath it --
  // but "the card is on top" is a fact about the stylesheet, and this is a fact
  // about the state, which is the one that survives somebody moving a z-index.
  //
  // It is here because it was measured: dispatching a click straight at the play
  // button of the chrome, which is what a test does and a person cannot, started
  // the match behind a card that says it is about to start. Without this the
  // cost is silent and expensive -- the card goes and the moment it was
  // announcing has already passed.
  video.addEventListener('play', () => { if (speaking) video.pause(); });

  function end() {
    running = false;
    card.hidden = true;
    document.body.dataset.story = 'done';
    video.play().catch(() => {});
  }
  skip.addEventListener('click', end);
  document.body.dataset.story = 'running';

  async function say(beat) {
    speaking = true;
    video.pause();
    card.textContent = beat.text;
    card.hidden = false;
    // Two frames, so the element is laid out before the transition starts;
    // without it the first card appears without fading.
    await wait(40);
    card.dataset.on = 'yes';
    await wait((Number(beat.hold) || 6) * 1000);
    if (!running) return;
    delete card.dataset.on;
    await wait(320);
    card.hidden = true;
    if (!running) return;
    // THE ORDER OF THESE TWO LINES IS THE WHOLE THING. The guard above pauses
    // the programme on any `play` that arrives while a card is up, and this call
    // is a `play`: with `speaking` still true it cancels itself and the
    // walkthrough never gets past its first card. Measured that way round first.
    speaking = false;
    await video.play().catch(() => {});
  }

  // THE BEATS FIRE OFF A FRAME LOOP AND NOT OFF `timeupdate`, and that is not a
  // preference: `timeupdate` arrives about four times a second, so a beat can be
  // crossed up to 250 ms late -- and 250 ms late on a beat anchored to an ad
  // change means the new ad has already been seen, which is exactly the thing
  // the beat exists to get ahead of.
  let next = 0;
  async function tick() {
    if (!running) return;
    if (!speaking && next < queue.length && video.currentTime >= queue[next].at) {
      const beat = queue[next];
      next += 1;
      await say(beat);
      if (next >= queue.length) return end();
    }
    requestAnimationFrame(tick);
  }

  // The opening beat is a card over a still player, so it does not wait for a
  // currentTime to arrive: it is already due at 0.
  requestAnimationFrame(tick);

  return { get running() { return running; }, end, beats: queue };
}
