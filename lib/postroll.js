// postroll.js -- what plays AFTER the programme ends (ADR 0101), on the far side
// of the seam of ADR 0003.
//
// Everything else this library draws is drawn OVER the programme and follows
// its clock: the renderer asks the contract what is active at the second the
// programme is at. A post-roll cannot be drawn that way, because when it plays
// the programme has ended and its clock has stopped. So it is played the way a
// conventional player plays an ad between two pieces of content: the programme
// is over, the ad takes the frame, and it runs to the end of its own asset
// (ADR 0019), one after the other.
//
// WHAT IS PLAYED IS ALWAYS A LINEAR AD. The signalling layer hands over, per
// post-roll, the linear defaults of its list and nothing else: a non-linear ad
// needs a programme underneath and there is none after the end, so an ad with
// no linear default was already skipped there. This file only plays what it is
// handed, and never learns why.
//
// It knows nothing of the transport: what it reads is `provider.postRolls()`,
// plain data of the contract, and what turns a `uri` into pixels is the same
// injected `attachAsset` the renderer uses.

/**
 * The linear ads to play after the programme, in order: every post-roll that
 * resolved, in the order of its tags, and its ads in the order of its list.
 * A post-roll marked `once` (`CUE="ONCE"`) that is in `played` is left out:
 * it played once, after an earlier end, and does not play again (ADR 0102).
 * Pure, so it is tested on data.
 */
export function postRollQueue(postRolls, played = new Set()) {
  return (postRolls || [])
    .filter((entry) => entry.state === 'resolved' && !(entry.once && played.has(entry.id)))
    .flatMap((entry) => entry.experiences || []);
}

/** Whether a post-roll's list is still on its way, so the end has to wait for it. */
export function postRollPending(postRolls) {
  return (postRolls || []).some((entry) => entry.state === 'waiting' || entry.state === 'requested');
}

/**
 * How long the end of the programme waits for a list still on its way. The
 * list is asked for when the programme is buffered to its end, which is a
 * forward buffer ahead of it, so it is normally there long before; this is
 * only for a slow answer, and an answer later than this plays nothing.
 */
export const POST_ROLL_WAIT_MS = 10000;

/**
 * Play the post-rolls when the programme ends.
 *
 * @param provider     the contract; only `postRolls()` is read off it
 * @param video        the programme's media element: its `ended` starts the
 *                     post-rolls, and a `seeking` or a `play` on it -- somebody
 *                     going back into the programme -- takes them off
 * @param layer        where the ad is drawn, the same layer as the renderer's
 * @param attachAsset  the injected function that turns a `uri` into pixels
 * @param onPresented  optional, as in the renderer: once per ad, `presented`
 *                     or `skipped` (its first load failed), with `postroll: true`
 * @param onTracking   optional, as in tracking.js: `slotStart` and `slotEnd`
 *                     of each ad, with `postroll: true`
 * @param programmeEnded optional, asked when the element ends: whether it was
 *                     the PROGRAMME that ended. The same element can end
 *                     because something else was playing on it, and the entry
 *                     point knows when (ADR 0104). Default: always.
 * @returns            `{ playing, stop }`
 *
 * THE CONTROLS STILL COMMAND THE PROGRAMME, and that is said rather than
 * fixed: pressing play on a programme that ended starts it again from the
 * beginning, which takes the post-roll off, as a seek back would.
 */
export function createPostRoll({
  provider, video, layer, attachAsset, onPresented = null, onTracking = null, programmeEnded = () => true
}) {
  /** The run in progress, or null: `{ cancelled, node, detach, experience }`. */
  let run = null;
  /**
   * The post-rolls marked `once` that have played: started, then left, at
   * their end or taken off (ADR 0102). They are not played again.
   */
  const played = new Set();

  function call(callback, message, label) {
    try {
      callback?.(message);
    } catch (error) {
      console.error(`[postroll] the ${label} callback threw; playback goes on.`, error);
    }
  }

  function trackingEvent(type, experience, time) {
    return {
      type, time, id: experience.id, itemId: experience.itemId, experienceType: experience.type,
      startTime: experience.startTime, duration: experience.duration,
      identifiers: experience.identifiers ?? [], postroll: true
    };
  }

  function report(experience, outcome, attempts = []) {
    call(onPresented, {
      id: experience.id, itemId: experience.itemId, outcome,
      presented: outcome === 'presented' ? { index: null, type: experience.type, linear: true } : null,
      attempts, late: false, lateBy: 0, postroll: true
    }, 'onPresented');
  }

  function takeDown() {
    if (!run) return;
    run.detach?.();
    run.node?.remove();
    run.node = null;
    run.detach = null;
    run.began = false;
  }

  async function start() {
    if (run || !provider.postRolls || !programmeEnded()) return;
    const current = { cancelled: false, node: null, detach: null };
    run = current;
    const waitedFrom = Date.now();
    while (postRollPending(provider.postRolls()) && Date.now() - waitedFrom < POST_ROLL_WAIT_MS) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (current.cancelled) return;
    }
    const rolls = provider.postRolls();
    const queue = postRollQueue(rolls, played);
    current.once = new Set(rolls.filter((entry) => entry.once).map((entry) => entry.id));
    if (!queue.length) { run = null; return; }
    console.log(`[postroll] the programme ended: ${queue.length} linear ad${queue.length === 1 ? '' : 's'}` +
      ' after it (ADR 0101).');
    playAt(current, queue, 0);
  }

  function playAt(current, queue, index) {
    if (current.cancelled) return;
    const experience = queue[index];
    if (!experience) { run = null; return; }
    const element = (experience.elements || []).find((e) => !e.primary);
    const next = () => { takeDown(); playAt(current, queue, index + 1); };
    if (!element?.uri) { report(experience, 'skipped'); next(); return; }

    const node = document.createElement('video');
    node.className = 'ad postroll';
    node.dataset.elementId = element.id;
    node.playsInline = true;
    // Full frame over the ended programme: the frame is the ad's, as a
    // linear ad's is, with a black bed so the last frame of the programme does
    // not show through before the first one of the ad.
    Object.assign(node.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%',
      objectFit: 'contain', background: '#000', zIndex: '1'
    });
    node.muted = video.muted;
    layer.appendChild(node);
    current.node = node;
    current.experience = experience;

    current.began = false;
    node.addEventListener('playing', () => {
      if (current.began || current.cancelled || current.node !== node) return;
      current.began = true;
      // Started is what makes a ONCE post-roll spent, whatever ends it (ADR 0102).
      if (current.once?.has(experience.id)) played.add(experience.id);
      call(onTracking, trackingEvent('slotStart', experience, experience.startTime), 'onTracking');
    });
    node.addEventListener('ended', () => {
      if (current.cancelled) return;
      if (current.began) {
        call(onTracking, trackingEvent('slotEnd', experience, experience.startTime + Number(node.currentTime || 0)),
          'onTracking');
      }
      next();
    }, { once: true });

    current.detach = attachAsset(node, {
      uri: element.uri,
      mediaType: element.mediaType,
      startAt: 0,
      onLoaded: () => { if (!current.cancelled) report(experience, 'presented'); },
      onFailed: (reason) => {
        if (current.cancelled) return;
        console.warn(`[postroll] ${experience.itemId}: failed to load ${element.uri} (${reason}); it is` +
          ' skipped (ADR 0101).');
        report(experience, 'skipped', [{
          index: null, type: experience.type, linear: true, uri: element.uri,
          reason: `failed to load ${element.uri} (${reason})`, late: false
        }]);
        next();
      }
    });
    // Started with the programme's own mute, and muted if the autoplay policy
    // refuses it with sound: an ad that never starts is a black frame.
    node.play().catch(() => {
      node.muted = true;
      node.play().catch(() => {});
    });
  }

  /** Take the post-roll off: somebody went back into the programme. */
  function stop() {
    if (!run) return;
    run.cancelled = true;
    if (run.node && run.experience && run.began) {
      call(onTracking, trackingEvent('slotEnd', run.experience,
        run.experience.startTime + Number(run.node.currentTime || 0)), 'onTracking');
    }
    takeDown();
    run = null;
  }

  video.addEventListener('ended', start);
  video.addEventListener('seeking', stop);
  video.addEventListener('play', stop);
  video.addEventListener('volumechange', () => { if (run?.node) run.node.muted = video.muted; });

  return {
    get playing() { return Boolean(run?.node); },
    stop
  };
}
