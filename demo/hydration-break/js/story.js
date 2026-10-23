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
// 2  IT ARMS AT ONCE, AND THE FIRST BEAT IS A CARD WITH THE PLAYER PAUSED
//    (ADR 0039). The break is on the contract from the moment the playlist is
//    read, with its window off the tag, but its ADS are not: the asset-list is
//    requested when the programme is buffered up to the break, as hls.js does
//    for an interstitial (ADR 0100, ADR 0101). So a beat is not resolved once,
//    at arming: every beat still waiting is resolved again on every frame until
//    its anchor answers, and one anchored to an ad answers when that break's
//    list has arrived. Here that is during the opening card: the break is well
//    inside the forward buffer of a paused player, so the list arrives seconds
//    before the first beat that names an ad is due.
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
 * Whether an anchor that does not resolve yet MAY still resolve, which is the
 * difference between waiting for an asset-list and naming something that is not
 * there. It waits while the signalling is still handing over ranges, and while
 * the break it names is on the contract only off its tag (`provisional`): its
 * list has not been asked for yet, so its ads are not known yet. Once the list
 * is in, an anchor that still answers `null` is the fourth ad of a break that
 * has three, and that is a mistake in story/story.json and not a wait.
 */
export function anchorWaits(anchor, provider) {
  const spec = anchor?.before ?? anchor?.at;
  if (!spec || typeof spec !== 'object') return false;
  const { ranges, settled } = provider.programRanges();
  if (!settled) return true;
  const breaks = ranges
    .filter((r) => r.kind === 'concurrent')
    .sort((a, b) => a.startTime - b.startTime);
  return Boolean(breaks[spec.break - 1]?.provisional);
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

  // NOTHING IS WAITED FOR HERE. Every beat starts unresolved and `settle()`
  // resolves the ones still waiting on every frame of the loop below (see 2 at
  // the top of this file).
  const beats = (story.beats || []).map((beat) => ({ ...beat, at: null, fired: false, dropped: false }));

  // An anchor that does not resolve once its break's list is in is said out loud
  // and skipped, and the beat is not invented at another second: a card over the
  // wrong thing is the one way this demo can look wrong without anything failing.
  function settle() {
    for (const beat of beats) {
      if (beat.fired || beat.dropped || beat.at !== null) continue;
      beat.at = resolveAnchor(beat.anchor, provider);
      if (beat.at !== null || anchorWaits(beat.anchor, provider)) continue;
      beat.dropped = true;
      console.error(`[story] the beat "${beat.id}" anchors to something the signalling does not` +
        ' have, so it is skipped. Check story/story.json against the asset-list.', beat.anchor);
    }
  }

  /** The beats that will still be said, resolved ones first and in the order they play. */
  const remaining = () => beats
    .filter((b) => !b.fired && !b.dropped)
    .sort((a, b) => (a.at ?? Infinity) - (b.at ?? Infinity));

  if (story.skip) skip.textContent = story.skip;

  let running = true;
  let speaking = false;

  // THE WALKTHROUGH TAKES THREE THINGS FROM THE PLAYER, AND `release()` IS THE ONLY
  // PLACE THAT GIVES THEM BACK. That is the shape and not a tidiness preference: the
  // flow is guided and then free, so a walkthrough that ends still holding one thread
  // leaves a player that looks dead, and every symptom of it looks like a different
  // bug.
  //
  // What it takes: the frame loop, the card over the picture, and the guard below.
  //
  // WHILE A CARD IS UP THE PROGRAMME STAYS STILL, whoever pressed play. The card takes
  // pointer events, so a person cannot reach the chrome underneath it -- but that is a
  // fact about the stylesheet, and this is a fact about the player, which is the one
  // that survives somebody moving a z-index. Measured: a click dispatched straight at
  // the chrome's play button started the match behind a card that says it is about to
  // start.
  //
  // AND ITS LIFETIME IS THE CARD'S LIFETIME, not the value of a flag. That is the
  // correction, and the bug that forced it is worth writing down because the first
  // version looked correct: the guard used to be permanent and consult a `speaking`
  // flag, and `say()` bails early when the walkthrough ends underneath it -- so
  // pressing skip while a card was up left `speaking` true for good, and from then on
  // EVERY play was cancelled. The player was not dead; it was still being held. A flag
  // that means "released" can be left behind. A listener that is not attached cannot.
  const holdStill = () => video.pause();

  function release() {
    video.removeEventListener('play', holdStill);
    delete card.dataset.on;
    card.hidden = true;
  }

  function end() {
    running = false;
    release();
    document.body.dataset.story = 'done';
    video.play().catch(() => {});
  }
  // EL BOTÓN NO ES DE ESTE ARCHIVO, y eso cambió cuando apareció el de reiniciar. Un
  // recorrido que se engancha solo al botón deja su listener atado para siempre, así que
  // el segundo recorrido tenía dos y el primer clic hacía las dos cosas. Acá se pone el
  // rótulo y se devuelve `end`; quién llama a qué, y cuándo, lo decide `app.js`, que es
  // el único que sabe si hay un recorrido corriendo o uno terminado.
  document.body.dataset.story = 'running';

  async function say(beat) {
    speaking = true;
    video.pause();
    // The guard goes up with the card and comes down with it, which is what makes it
    // impossible to leave behind. Every path out of this function goes through
    // `release()`, including the two that bail because the walkthrough ended
    // underneath it.
    video.addEventListener('play', holdStill);
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
    if (!running) return;
    // And the release comes BEFORE the play, because this call is a `play`: with the
    // guard still attached it cancels itself and the walkthrough never gets past its
    // first card. Measured that way round first, too.
    release();
    speaking = false;
    await video.play().catch(() => {});
  }

  // THE BEATS FIRE OFF A FRAME LOOP AND NOT OFF `timeupdate`, and that is not a
  // preference: `timeupdate` arrives about four times a second, so a beat can be
  // crossed up to 250 ms late -- and 250 ms late on a beat anchored to an ad
  // change means the new ad has already been seen, which is exactly the thing
  // the beat exists to get ahead of.
  async function tick() {
    if (!running) return;
    if (!speaking) {
      settle();
      const queue = remaining();
      if (!queue.length) return end();
      const beat = queue[0];
      if (beat.at !== null && video.currentTime >= beat.at) {
        beat.fired = true;
        await say(beat);
        if (!remaining().length) return end();
      }
    }
    requestAnimationFrame(tick);
  }

  // The opening beat is a card over a still player, so it does not wait for a
  // currentTime to arrive: it is already due at 0.
  requestAnimationFrame(tick);

  return {
    get running() { return running; },
    end,
    get beats() { return beats.filter((b) => !b.dropped && b.at !== null).sort((a, b) => a.at - b.at); }
  };
}
