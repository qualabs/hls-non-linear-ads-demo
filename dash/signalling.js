// signalling.js -- the signalling layer of ADR 0003, for MPEG-DASH.
//
// The same job as hls/signalling.js, read off another transport: for a given
// playback time, hand over the list of active concurrent experiences with their
// layout already resolved. What comes out the other end is the same contract
// (docs/contrato-senalizacion-renderizado.md), built by the same lib/: the
// model of a break (lib/experience.js), the options and capabilities
// (lib/capabilities.js), and what a break's list resolves into (lib/ad-list.js).
//
// HOW A BREAK IS SIGNALLED IN DASH, which is the carriage SVTA2053 v3 left for a
// future edition and phase 19 writes (docs/svta2053-dash-concurrent-presentation.md):
//
//   - an EventStream with the scheme of SVTA2053 §5,
//     `urn:svta:advertising-wg:ad-creative-signaling`, one Event per break, its
//     window in `@presentationTime` and `@duration` (ADR 0120);
//   - the Event's body, a version 2 carriage envelope of type `pod`, with
//     `features.concurrentPresentation: true` (ADR 0121) and, for this carriage,
//     a `cue` (ADR 0123); its Pod carries the slots inside or in
//     `$remote.slots`, which resolves to an envelope of type `slot`;
//   - each Slot with its `layoutOptions` (5.3.3, ADR 0105), and its `media` as the default
//     linear ad (ADR 0122);
//   - and the traditional linear break, an Alternative MPD replace event
//     (ISO/IEC 23009-1, 5.16.4), which this library plays itself because dash.js
//     does not (ADR 0125).
//
// THE MPD IS READ HERE, OFF THE RESPONSE, AND NOT OFF dash.js's EVENTS (ADR
// 0128). dash.js 5.2.1 hands MPD events to the page at load, but measured in T-01
// of phase 19 it loses the body when it is in CDATA -- the form every example of
// SVTA2053 uses -- and it passes neither the attributes of ReplacePresentation
// nor an id that is not a number. All three are in the MPD itself, which a
// response interceptor of dash.js receives as text before any event. So this
// layer parses that text and computes each Event's time itself.
//
// WHEN A BREAK'S SLOTS ARE ASKED FOR (ADR 0124): 60 s before it begins, or when
// the programme lands inside its window by a seek; a pre-roll's at load.
//
// The pure functions are exported one by one, as in hls/signalling.js: they are
// what the tests aim at, and dash.js is touched only inside createSignalling(),
// so `node --test` can import this file. `readMpd` needs a DOM and is checked in
// a browser against the same fixtures the tests read (test/fixtures/dash/).

import { activeAt, linearItem, rangeOfExperiences, resolveExperience, withOptions } from '../lib/experience.js';
import { usableCapabilities, usablePreValidation } from '../lib/capabilities.js';
import { BLOCK, listRequestUrl, resolveAssets, resolvePostRoll, resolveWithFirstRequests } from '../lib/ad-list.js';
import { bufferedEndAt, onceProgress, postRollDue, rangesOf } from '../lib/playhead.js';

/** The scheme of SVTA2053 §5 (Table 24). Its Code 8, 9 and 13 write `ad-id-signaling`; §5 is the one. */
export const SVTA_SCHEME = 'urn:svta:advertising-wg:ad-creative-signaling';

/** The Alternative MPD replace event of ISO/IEC 23009-1, 5.16.4. */
export const REPLACE_SCHEME = 'urn:mpeg:dash:event:alternativeMPD:replace:2025';

/** The flag of ADR 0121: without it, an envelope is the signalling of SVTA2053 6.1, not a presentation. */
export const CONCURRENT_FEATURE = 'concurrentPresentation';

/** The features this reader implements; any other set to true makes the payload ignored (5.2.2.1). */
export const FEATURES_SUPPORTED = new Set(['remoteFields', CONCURRENT_FEATURE]);

/** ADR 0124: how far ahead of a break its `$remote.slots` is asked for. `@earliestResolutionTimeOffset`'s default, Table 63. */
export const SLOTS_LEAD_SECONDS = 60;

/** The tolerance, in seconds, when two slots are checked for being one behind the other. */
const CONTIGUITY_TOLERANCE = 0.001;

// ---------------------------------------------------------------------------
// Reading the MPD
// ---------------------------------------------------------------------------

/**
 * An `xs:duration` of the MPD (`PT1H2M3.5S`, `P1DT2H`) in seconds, or null when
 * absent or unreadable. Years and months are refused: their length in seconds
 * is not defined, and no MPD of a programme uses them.
 */
export function isoDuration(value) {
  if (value == null) return null;
  const m = /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/
    .exec(String(value).trim());
  if (!m || String(value).trim() === 'P' || String(value).trim() === 'PT') return null;
  const [, d = 0, h = 0, min = 0, s = 0] = m;
  return Number(d) * 86400 + Number(h) * 3600 + Number(min) * 60 + Number(s);
}

/** The element children of `node` with the local name `name`, whatever their namespace. */
function childrenNamed(node, name) {
  return [...(node?.children || [])].filter((child) => child.localName === name);
}

/** An attribute as a number, or `fallback` when absent or not a number. */
function numberAttr(node, name, fallback = null) {
  const raw = node.getAttribute(name);
  const value = raw == null || raw === '' ? NaN : Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

/**
 * The parts of an MPD this layer reads, as plain data: its type and length, and
 * per Period its start, its length and its EventStreams with their Events. An
 * Event's body is its text, CDATA included; a ReplacePresentation is read into
 * `replace`. `doc` is the MPD parsed into a DOM (`DOMParser`, `text/xml`).
 */
export function readMpd(doc) {
  const mpd = doc?.documentElement;
  if (!mpd || mpd.localName !== 'MPD') return null;
  return {
    type: mpd.getAttribute('type') || 'static',
    mediaPresentationDuration: isoDuration(mpd.getAttribute('mediaPresentationDuration')),
    periods: childrenNamed(mpd, 'Period').map((period) => ({
      id: period.getAttribute('id'),
      start: isoDuration(period.getAttribute('start')),
      duration: isoDuration(period.getAttribute('duration')),
      eventStreams: childrenNamed(period, 'EventStream').map((stream) => ({
        schemeIdUri: stream.getAttribute('schemeIdUri'),
        value: stream.getAttribute('value'),
        timescale: numberAttr(stream, 'timescale', 1),
        presentationTimeOffset: numberAttr(stream, 'presentationTimeOffset', 0),
        events: childrenNamed(stream, 'Event').map((event) => {
          const replace = childrenNamed(event, 'ReplacePresentation')[0];
          return {
            id: event.getAttribute('id'),
            presentationTime: numberAttr(event, 'presentationTime', 0),
            duration: numberAttr(event, 'duration'),
            body: replace ? null : event.textContent,
            replace: replace
              ? {
                uri: replace.getAttribute('uri'),
                maxDuration: numberAttr(replace, 'maxDuration'),
                executeOnce: replace.getAttribute('executeOnce') === 'true'
              }
              : null
          };
        })
      }))
    }))
  };
}

/**
 * Where each Period begins and ends on the programme's timeline, in seconds: a
 * Period's `@start`, or the end of the one before it; its end, its `@duration`,
 * or the start of the next, or the MPD's `@mediaPresentationDuration` for the
 * last one (ISO/IEC 23009-1, 5.3.2.1). `end` is null when nothing says it.
 */
export function periodWindows(mpd) {
  const periods = mpd?.periods || [];
  const out = [];
  let previousEnd = 0;
  periods.forEach((period, i) => {
    const start = period.start ?? previousEnd;
    out.push({ start, end: period.duration != null ? start + period.duration : null });
    previousEnd = out[i].end;
  });
  out.forEach((window, i) => {
    if (window.end != null) return;
    const next = out[i + 1];
    window.end = next ? next.start : mpd?.mediaPresentationDuration ?? null;
  });
  return out;
}

/**
 * An Event's window on the programme's timeline (Tables 24 and 25 of SVTA2053,
 * ISO/IEC 23009-1 5.10.2): `(@presentationTime - @presentationTimeOffset) /
 * @timescale` after the start of its Period, for `@duration / @timescale`. An
 * Event ends at the end of its Period at the latest (5.10.2.1), so the window is
 * clipped there. `duration` is null when the Event declares none.
 */
export function eventWindow(event, stream, period) {
  const timescale = stream.timescale > 0 ? stream.timescale : 1;
  const startTime = period.start + (event.presentationTime - (stream.presentationTimeOffset || 0)) / timescale;
  let duration = event.duration != null ? event.duration / timescale : null;
  if (period.end != null) {
    const room = Math.max(0, period.end - startTime);
    duration = duration == null ? room : Math.min(duration, room);
  }
  return { startTime, duration };
}

/** The MPD's text, parsed in the browser and read. */
export function parseMpdText(text) {
  return readMpd(new DOMParser().parseFromString(text, 'text/xml'));
}

// ---------------------------------------------------------------------------
// The envelope
// ---------------------------------------------------------------------------

/**
 * An Event's body read as the carriage of ADR 0120: a version 2 envelope of type
 * `pod`, marked concurrent, with every feature it declares implemented here.
 * Returns `{ pods, cue, remote }` -- `cue` the set of the ADR 0123 key, `remote`
 * whether `$remote` may appear -- or `{ ignored: <why> }`. An envelope without
 * the flag is not an error: it is the signalling of SVTA2053 6.1, for whoever
 * does tracking with it, and it is not a presentation.
 */
export function readEnvelope(body) {
  let envelope;
  try {
    envelope = typeof body === 'string' ? JSON.parse(body) : body;
  } catch {
    return { ignored: 'its body is not JSON' };
  }
  if (!envelope || typeof envelope !== 'object') return { ignored: 'it has no body' };
  if (envelope.version !== 2) return { ignored: `it is version ${envelope.version}, and the carriage is version 2` };
  const features = envelope.features && typeof envelope.features === 'object' ? envelope.features : {};
  if (features[CONCURRENT_FEATURE] !== true) {
    return { ignored: 'it does not set features.concurrentPresentation, so it is not a concurrent presentation (ADR 0121)' };
  }
  const unknown = Object.keys(features).filter((key) => features[key] === true && !FEATURES_SUPPORTED.has(key));
  if (unknown.length) {
    return { ignored: `it requires features this reader does not implement (${unknown.join(', ')}), SVTA2053 5.2.2.1` };
  }
  if (envelope.type !== 'pod') return { ignored: `its type is "${envelope.type}", and a break is a "pod"` };
  const pods = Array.isArray(envelope.payload) ? envelope.payload.filter((p) => p && typeof p === 'object') : [];
  if (!pods.length) return { ignored: 'its payload holds no Pod' };
  return { pods, cue: cueOf(envelope.cue), remote: features.remoteFields === true };
}

/**
 * The `cue` of ADR 0123, with the values of `CUE` of HLS: `PRE`, `POST`, `ONCE`.
 * An array of them, or one string, in either case or comma separated; anything
 * else is dropped. Answered the way hls/signalling.js answers its tag.
 */
export function cueOf(cue) {
  const values = (Array.isArray(cue) ? cue : typeof cue === 'string' ? cue.split(',') : [])
    .map((v) => String(v).trim().toUpperCase());
  return { pre: values.includes('PRE'), post: values.includes('POST'), once: values.includes('ONCE') };
}

/**
 * What `$remote.slots` answered, validated as 5.2.2.2.2 asks: a version 2
 * envelope of type `slot`. Returns its Slots, or throws with the reason.
 */
export function slotsOfEnvelope(envelope) {
  if (!envelope || envelope.version !== 2 || envelope.type !== 'slot' || !Array.isArray(envelope.payload)) {
    throw new Error('$remote.slots did not answer a version 2 envelope of type "slot" (SVTA2053 5.2.2.2.2)');
  }
  return envelope.payload;
}

/**
 * A Pod's Slots in the shape lib/ad-list.js reads (ADR 0122): one asset per
 * Slot, in their order, its `URI` the first of the Slot's `media` -- the default
 * linear ad -- and its `DURATION` the Slot's; and the Slot itself, with its
 * `start` made 0, as the block of a single item, because in that shape an item's
 * `start` is an offset inside its own asset and each Slot is its own asset.
 *
 * THE SLOTS HAVE TO BE ONE BEHIND THE OTHER. The list's rule places each asset
 * where the ones before it ended, and a Slot's `start` is relative to the Pod
 * (Table 5), so the two agree only when every Slot starts where the previous
 * one ended. A Pod with a hole or an overlap between its Slots throws: placed
 * by the list's rule, its ads would be drawn at the wrong second, and nothing on
 * screen would say so.
 */
export function adListOfSlots(slots) {
  const assets = [];
  let expected = 0;
  for (const [i, slot] of (Array.isArray(slots) ? slots : []).entries()) {
    const start = Number(slot?.start ?? 0);
    if (Math.abs(start - expected) > CONTIGUITY_TOLERANCE) {
      throw new Error(`slot ${i + 1} starts at ${start} s and the slots before it end at ${expected} s:` +
        ' the slots of a Pod have to be one behind the other');
    }
    const duration = Number(slot?.duration);
    const media = Array.isArray(slot?.media) ? slot.media.find((m) => typeof m?.uri === 'string' && m.uri.trim()) : null;
    const { media: _media, ...item } = slot || {};
    const asset = { DURATION: duration, [BLOCK]: { version: 2, type: 'slot', payload: [{ ...item, start: 0 }] } };
    if (media) asset.URI = media.uri;
    assets.push(asset);
    expected = start + (Number.isFinite(duration) ? duration : 0);
  }
  return { ASSETS: assets };
}

/**
 * Whether a break's `$remote.slots` is due (ADR 0124): from SLOTS_LEAD_SECONDS
 * before it begins until it ends, which also covers landing inside its window
 * by a seek. A pre-roll is due at once. A break that already ended is not.
 */
export function slotsDue({ startTime, duration, pre = false }, time, lead = SLOTS_LEAD_SECONDS) {
  if (pre) return true;
  if (!Number.isFinite(time) || !Number.isFinite(startTime)) return false;
  const end = Number.isFinite(duration) && duration > 0 ? startTime + duration : Infinity;
  return time >= startTime - lead && time < end;
}

/**
 * Every break the MPD signals, decided as far as it can be without the network:
 * `{ id, kind, startTime, duration, cue, pods, remote }` for the concurrent ones
 * and `{ id, kind: 'interstitial', startTime, duration, once, replace }` for an
 * Alternative MPD replace. `ignored` lists the Events left out, with why. `base`
 * is the URL of the MPD, against which every relative URI resolves.
 */
export function breaksOfMpd(mpd, base) {
  const breaks = [];
  const ignored = [];
  const windows = periodWindows(mpd);
  (mpd?.periods || []).forEach((period, p) => {
    for (const stream of period.eventStreams) {
      if (stream.schemeIdUri !== SVTA_SCHEME && stream.schemeIdUri !== REPLACE_SCHEME) continue;
      for (const event of stream.events) {
        const id = String(event.id ?? `${period.id ?? p}.${stream.events.indexOf(event)}`);
        const { startTime, duration } = eventWindow(event, stream, windows[p]);
        if (stream.schemeIdUri === REPLACE_SCHEME) {
          const replace = event.replace;
          if (!replace?.uri) { ignored.push({ id, why: 'its ReplacePresentation has no @uri' }); continue; }
          const timescale = stream.timescale > 0 ? stream.timescale : 1;
          const max = replace.maxDuration != null ? replace.maxDuration / timescale : null;
          const length = [duration, max].filter((v) => Number.isFinite(v) && v > 0);
          breaks.push({
            id, kind: 'interstitial', startTime, duration: length.length ? Math.min(...length) : null,
            once: replace.executeOnce, uri: new URL(replace.uri, base).href
          });
          continue;
        }
        const read = readEnvelope(event.body);
        if (read.ignored) { ignored.push({ id, why: read.ignored }); continue; }
        breaks.push({ id, kind: 'concurrent', startTime, duration, cue: read.cue, pods: read.pods, remote: read.remote });
      }
    }
  });
  return { breaks, ignored };
}

/**
 * The traditional linear break as an experience of the contract (ADR 0125): its
 * MPD at full frame for its window, over a programme that keeps running and is
 * not shown -- the semantics of ReplacePresentation (ISO/IEC 23009-1, 5.16.1)
 * and of the default linear ad the renderer already draws (ADR 0016, 0107).
 */
export function replaceExperience({ id, startTime, duration, uri }) {
  if (!(duration > 0)) return null;
  return withOptions(resolveExperience(linearItem(uri, duration), { id, itemId: `${id}.0`, slotStart: startTime }),
    { assetId: `${id}.a0` });
}

/**
 * What is drawn at `time`: the active experiences, except that a traditional
 * linear break wins over everything else while it is on (ADR 0114 and 0125):
 * the programme is not on the screen, so nothing is drawn over it.
 */
export function drawnAt(experiences, linear, time) {
  const active = activeAt(experiences, time);
  const replacing = activeAt(linear, time);
  return replacing.length ? replacing : active;
}

// ---------------------------------------------------------------------------
// The one impure function
// ---------------------------------------------------------------------------

/**
 * `parseMpd(text)` turns the MPD's text into what `readMpd` returns; it is
 * there so a test can hand it the plain data without a DOM.
 *
 * Subscribe to the MPD dash.js loads, keep the breaks of SVTA's scheme and the
 * replace events, ask for each break's `$remote.slots` when ADR 0124 says, and
 * resolve the layout -- the same options as hls/signalling.js's, and the same
 * contract out: `activeAt`, `programRanges`, `postRolls`, `experiences`.
 *
 * `player` is a dash.js `MediaPlayer` before `initialize` (the interceptor has to
 * be there when the MPD arrives); `video` is its element. Only a `static` MPD
 * is read: live is out of the prototype (phase 19).
 */
export function createSignalling(player, video, {
  onResolved, capabilities = null, sendCapabilities = true, firstRequest = null,
  preValidateAssets = false, preValidateMethod = 'GET', parseMpd = parseMpdText
} = {}) {
  const experiences = [];
  const linear = [];
  const ranges = [];
  const declared = usableCapabilities(capabilities);
  const preValidation = usablePreValidation({ preValidateAssets, preValidateMethod });
  const request = firstRequest && preValidation.enabled
    ? (uri, mediaType) => firstRequest(uri, mediaType, { method: preValidation.method })
    : null;
  let sourceClosed = false;
  let read = false;
  let pending = 0;
  let base = null;
  let bufferedToEnd = false;
  /** id -> a concurrent break whose slots are not asked for yet. */
  const waiting = new Map();
  /** id -> a ONCE break (ADR 0112): `{ entered, spent }`. */
  const onces = new Map();
  /** id -> a post-roll (ADR 0111): `{ id, kind, once, state, startTime, experiences, brk }`. */
  const postRolls = new Map();

  player.addResponseInterceptor((response) => {
    const text = typeof response?.data === 'string' ? response.data : null;
    if (!read && text && /<MPD[\s>]/.test(text)) {
      read = true;
      try {
        base = new URL(response.request?.url || '', globalThis.location?.href).href;
        readBreaks(parseMpd(text));
      } catch (error) {
        console.error('[signalling] the MPD could not be read for breaks; none is presented.', error);
        sourceClosed = true;
      }
    }
    return Promise.resolve(response);
  });

  function readBreaks(mpd) {
    if (!mpd) { sourceClosed = true; return; }
    if (mpd.type !== 'static') {
      console.warn('[signalling] the MPD is dynamic: live is not read by this prototype, no break is presented.');
      sourceClosed = true;
      return;
    }
    const end = mpd.mediaPresentationDuration ?? periodWindows(mpd).at(-1)?.end ?? null;
    const { breaks, ignored } = breaksOfMpd(mpd, base);
    for (const { id, why } of ignored) console.log(`[signalling] Event ${id} is left out: ${why}.`);
    for (const brk of breaks) {
      if (brk.kind === 'interstitial') {
        const experience = replaceExperience(brk);
        if (!experience) continue;
        linear.push(experience);
        ranges.push({ id: brk.id, kind: 'interstitial', startTime: brk.startTime, duration: experience.duration });
        if (brk.once) onces.set(brk.id, { entered: false, spent: false });
        console.log(`[signalling] ${brk.id}: a replace event at t=${brk.startTime.toFixed(2)}s, played by this` +
          ' library at full frame over the programme (ADR 0125).');
        continue;
      }
      const { pre, post, once } = brk.cue;
      if (once && !post) onces.set(brk.id, { entered: false, spent: false });
      if (post) {
        postRolls.set(brk.id, { id: brk.id, kind: 'concurrent', once, state: 'waiting', startTime: end, experiences: [], brk });
        continue;
      }
      // A pre-roll sits where playback begins (ADR 0110): 0 on a static MPD.
      const startTime = pre ? 0 : brk.startTime;
      const placed = { ...brk, startTime, pre };
      const range = Number.isFinite(brk.duration) ? { id: brk.id, kind: 'concurrent', startTime, duration: brk.duration, provisional: true } : null;
      placed.range = range;
      if (range) ranges.push(range);
      waiting.set(brk.id, placed);
    }
    sourceClosed = true;
    due();
    duePost();
  }

  for (const type of ['timeupdate', 'seeking', 'progress']) video.addEventListener(type, due);
  for (const type of ['timeupdate', 'seeking', 'seeked']) video.addEventListener(type, spend);
  video.addEventListener('ended', () => { bufferedToEnd = true; duePost(); });
  video.addEventListener('progress', () => {
    const length = video.duration;
    if (Number.isFinite(length) && bufferedEndAt(rangesOf(video.buffered), video.currentTime) >= length - 0.5) {
      bufferedToEnd = true;
      duePost();
    }
  });

  function due() {
    const time = video.currentTime;
    for (const [id, brk] of waiting) {
      if (!slotsDue(brk, time)) continue;
      waiting.delete(id);
      pending += 1;
      resolveBreak(brk);
    }
  }

  function duePost() {
    if (!postRollDue({ sourceClosed, bufferedToEnd })) return;
    for (const entry of postRolls.values()) {
      if (entry.state !== 'waiting' || entry.startTime == null) continue;
      entry.state = 'requested';
      pending += 1;
      resolvePost(entry);
    }
  }

  /** The Pod's slots, inside or behind `$remote.slots`, with the capabilities on the request. */
  async function slotsOf(brk) {
    const pod = brk.pods[0];
    const remote = pod?.$remote?.slots;
    if (brk.remote && typeof remote === 'string') {
      const url = listRequestUrl(remote, base, sendCapabilities ? declared : null);
      console.log(`[signalling] ${brk.id}: $remote.slots ${url}`);
      return { url, slots: slotsOfEnvelope(await fetch(url).then((r) => r.json())) };
    }
    return { url: null, slots: Array.isArray(pod?.slots) ? pod.slots : [] };
  }

  async function resolveBreak(brk) {
    const { id, startTime: slotStart, range: provisional } = brk;
    const drop = () => { const at = ranges.indexOf(provisional); if (at >= 0) ranges.splice(at, 1); };
    let url = null;
    try {
      const got = await slotsOf(brk);
      url = got.url;
      const adList = adListOfSlots(got.slots);
      const report = [];
      const requests = [];
      const resolved = request
        ? await resolveWithFirstRequests(adList, { id, slotStart, capabilities: declared, report, firstRequest: request, requests })
        : resolveAssets(adList, { id, slotStart, capabilities: declared, report });
      drop();
      if (onces.get(id)?.spent) return;
      experiences.push(...resolved);
      const range = rangeOfExperiences(id, resolved, 'concurrent');
      if (range) ranges.push(range);
      onResolved?.(resolved, {
        id, url, capabilities: declared, sent: Boolean(url && sendCapabilities && declared), assets: report, requests,
        preValidation: { enabled: Boolean(request), method: request ? preValidation.method : null }
      });
    } catch (error) {
      drop();
      console.error(`[signalling] ${id}: the slots could not be read, so the whole break is cancelled and the` +
        ' programme is not interrupted.', url, error);
    } finally {
      pending -= 1;
    }
  }

  async function resolvePost(entry) {
    const { id } = entry;
    try {
      const { url, slots } = await slotsOf(entry.brk);
      const report = [];
      entry.experiences = resolvePostRoll(adListOfSlots(slots), { id, slotStart: entry.startTime, report });
      entry.state = 'resolved';
      onResolved?.(entry.experiences.slice(), {
        id, url, postroll: true, capabilities: declared, sent: Boolean(url && sendCapabilities && declared),
        assets: report, requests: [], preValidation: { enabled: false, method: null }
      });
    } catch (error) {
      entry.state = 'failed';
      console.error(`[signalling] ${id}: the post-roll's slots could not be read; nothing plays after the programme.`, error);
    } finally {
      pending -= 1;
    }
  }

  /** ONCE breaks that have played leave the lists for good (ADR 0112), the replace ones included. */
  function spend() {
    const time = video.currentTime;
    for (const [id, state] of onces) {
      if (state.spent) continue;
      const { entered, spent } = onceProgress(ranges.find((r) => r.id === id), state.entered, time);
      state.entered = entered;
      if (!spent) continue;
      state.spent = true;
      waiting.delete(id);
      for (const list of [experiences, linear, ranges]) {
        for (let i = list.length; i--;) if (list[i].id === id) list.splice(i, 1);
      }
      console.log(`[signalling] ${id} is ONCE and has played: it leaves the experiences and the ranges (ADR 0112).`);
    }
  }

  return {
    activeAt: (time) => drawnAt(experiences, linear, time),
    programRanges: () => ({
      ranges: [...ranges].sort((a, b) => a.startTime - b.startTime),
      settled: sourceClosed && pending === 0
    }),
    postRolls: () => [...postRolls.values()].map(({ id, kind, once, state, startTime, experiences: e }) => ({
      id, kind, once: Boolean(once), state, startTime, experiences: e.slice()
    })),
    experiences
  };
}
