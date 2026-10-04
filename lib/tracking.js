// tracking.js -- when an ad goes on screen and when it leaves it, with the
// identifiers of its Slot, handed to the integrator (ADR 0093).
//
// WHAT IT MEASURES IS THE CONTRACT AND NOT THE DRAWING. It asks the provider of
// ADR 0003 what is active at the second the programme is at, the same question
// the renderer asks, and it is handed the DECORATED provider, whose answer is
// what is on the screen (see `attach`). So it lives on the drawing side of the
// seam, knows nothing of the transport, and touches no node: an event here is a
// change in that answer, and nothing else.
//
// TWO EVENTS AND NO MORE, because they are the two the contract can answer
// without inventing anything: an experience became active (`slotStart`) and it
// stopped being active (`slotEnd`). Quartiles, pause, mute and the URLs a beacon
// goes to are the spec's tracking objects, which no list of this repository
// carries yet; they would be built on these two, and an integrator who needs one
// today can derive it from the pair.
//
// A SEEK IS NOT HIDDEN. Seeking out of an ad ends it, and seeking into one
// starts it in the middle: the event says when it happened and the experience
// says where its window is, so whoever counts an impression decides what counts.

/**
 * The events between two readings of the contract: what left first, then what
 * entered, each once. Pure, so it is tested on data.
 *
 * @param before  Map of itemId -> experience: what was active at the last reading
 * @param now     Experience[]: what is active at this one
 * @param time    the second of the programme this reading was taken at
 */
export function slotEvents(before, now, time) {
  const current = new Map(now.map((e) => [e.itemId, e]));
  const events = [];
  for (const [itemId, experience] of before) {
    if (!current.has(itemId)) events.push(eventOf('slotEnd', experience, time));
  }
  for (const [itemId, experience] of current) {
    if (!before.has(itemId)) events.push(eventOf('slotStart', experience, time));
  }
  return events;
}

function eventOf(type, experience, time) {
  return {
    type,
    time,
    id: experience.id,
    itemId: experience.itemId,
    experienceType: experience.type,
    startTime: experience.startTime,
    duration: experience.duration,
    identifiers: experience.identifiers ?? []
  };
}

/**
 * Read the contract whenever the programme's clock moves, and hand every change
 * to `onTracking`. `timeupdate` is the cadence: a few times a second, which is
 * what an ad's measurement is counted in, and no frame loop of its own.
 *
 * An integrator's callback that throws is reported and does not stop playback,
 * nor the next event.
 *
 * @returns  `{ active, stop }`: the experiences active at the last reading, and
 *           the call that stops listening.
 */
export function createTracking({ provider, video, onTracking }) {
  let active = new Map();

  function read() {
    const time = video.currentTime;
    const now = provider.activeAt(time);
    for (const event of slotEvents(active, now, time)) {
      try {
        onTracking(event);
      } catch (error) {
        console.error('[tracking] the onTracking callback threw; playback goes on.', error);
      }
    }
    active = new Map(now.map((e) => [e.itemId, e]));
  }

  const kinds = ['timeupdate', 'seeked', 'ended'];
  for (const kind of kinds) video.addEventListener(kind, read);
  read();

  return {
    get active() { return [...active.values()]; },
    stop() { for (const kind of kinds) video.removeEventListener(kind, read); }
  };
}
