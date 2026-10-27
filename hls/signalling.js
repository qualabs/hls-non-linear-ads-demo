// signalling.js -- the signalling layer of ADR 0003, for HLS.
//
// It has ONE job: for a given playback time, hand over the list of active
// concurrent experiences with their layout already resolved. Everything that
// knows the word HLS lives on this side of the seam: the LEVEL_UPDATED
// subscription, the Date Ranges, the asset-list request, and the
// X-AD-CREATIVE-SIGNALING block. What comes out the other end is the contract,
// and the contract is plain data -- see docs/contrato-senalizacion-renderizado.md.
//
// What the contract is built WITH does not know HLS, and it is not here: the
// model of a break is lib/experience.js, the capabilities and the options of an
// ad are lib/capabilities.js (ADR 0117), what a break's list resolves into is
// lib/ad-list.js, and the readings of the programme's clock that say a break is
// due or spent are lib/playhead.js (phase 19). This file reads the transport and
// hands what it read to them.
//
// The pure functions are exported one by one on purpose: they are the surface
// the tests of T-08 aim at, and the module reaches for the `Hls` global only
// INSIDE createSignalling(), so `node --test` can import this file.

import { activeAt, rangeOfExperiences } from '../lib/experience.js';
import { usableCapabilities, usablePreValidation } from '../lib/capabilities.js';
import { listRequestUrl, resolveAssets, resolvePostRoll, resolveWithFirstRequests } from '../lib/ad-list.js';
import { bufferedEndAt, onceProgress, postRollDue, rangesOf } from '../lib/playhead.js';

/** The class of ADR 0009: sibling of Apple's interstitial, not an extension. */
export const CONCURRENT_CLASS = 'com.qualabs.hls.concurrentInterstitial';

/**
 * Apple's traditional interstitial. A stream may carry it next to ours, never
 * overlapping (ADR 0113), and in our player hls.js plays it with its own
 * interstitials machinery (ADR 0114): nothing on this side resolves its list or
 * draws it. This layer still reports its range off the tag, because the ranges
 * of the programme say WHICH KIND each range is; what a bar of our player marks
 * for this kind comes from hls.js's schedule (`scheduledRanges`).
 */
export const INTERSTITIAL_CLASS = 'com.apple.hls.interstitial';

/**
 * The class of ADR 0063: a window in which several feeds are OFFERED and
 * whoever is watching raises the ones he wants to see. Sibling of the other two
 * and an extension of neither -- a class is compared by exact equality of the
 * string and the format has no inheritance for "extends" to mean anything, so
 * what relates the three is that this layer reads all three and nothing else.
 *
 * What it announces is a CATALOGUE and not a layout, and that is the whole of
 * the difference downstream (ADR 0064): an ad declares where each box goes, and
 * an offer cannot, because where a box goes depends on how many boxes there
 * are, and that number is decided on the other side of the network, several
 * times, while the window is open.
 */
export const MULTIVIEW_CLASS = 'com.qualabs.hls.multiViewInterstitial';

/**
 * The kind of range a Date Range class means. This object is the ONE place a
 * class string is turned into something the contract can carry: the kind
 * crosses the seam, the class never does (ADR 0003). A class that is not in
 * here is not a range of the programme.
 *
 * A KIND IS READ BY THREE TABLES DOWNSTREAM, AND A KIND IN TWO OF THEM FAILS IN
 * SILENCE. One of the three says which kinds THIS player plays, and a kind
 * missing from it never reaches a bar at all; the other two give a kind its
 * colour and its name, and a range with no colour is not drawn while a range
 * with no name is drawn without a tooltip. None of the three throws, which is
 * why what holds them together is a test that asserts their keys agree
 * (ADR 0063): it turns "remember to touch all three" into something that cannot
 * be forgotten.
 */
export const KIND_OF_CLASS = {
  [CONCURRENT_CLASS]: 'concurrent',
  [INTERSTITIAL_CLASS]: 'interstitial',
  [MULTIVIEW_CLASS]: 'multiview'
};

export function kindOfClass(hlsClass) {
  return KIND_OF_CLASS[hlsClass] ?? null;
}

/**
 * The kinds whose Date Range carries an X-ASSET-LIST this layer goes and reads.
 * The other one is reported off the tag alone: hls.js plays it, not this side
 * (ADR 0114), so there is no list to ask for here and nothing to resolve, and
 * its window is the one the tag declares (`rangeOfDateRange`).
 *
 * It is a set of KINDS and not of classes, so it is written on the contract's
 * side of the translation and not on the transport's: what decides whether a
 * list is fetched is the kind of experience the tag announces, which is exactly
 * what `KIND_OF_CLASS` above just answered.
 */
export const KINDS_RESOLVED = new Set(['concurrent', 'multiview']);

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

/**
 * Playback time of an instant of the programme clock. `anchor` is a fragment
 * with a known EXT-X-PROGRAM-DATE-TIME: `{ start, programDateTime }`, seconds
 * of playback and milliseconds since the epoch.
 */
export function mediaTimeOf(date, anchor) {
  return anchor.start + (date.getTime() - anchor.programDateTime) / 1000;
}

/**
 * The `CUE` of a Date Range (HLS, EXT-X-DATERANGE: an enumerated-string-list of
 * PRE, POST and ONCE), as `{ pre, post, once }`. hls.js 1.7.2 already parses it
 * on every Date Range, whatever its class (`DateRange.cue`, src/loader/
 * date-range.ts, falling back to `X-CUE`), and that is what is read when it is
 * there; a plain object, as the tests hand over, is read off `attr` the same way
 * hls.js reads it: split on spaces and commas, lowercased.
 *
 * hls.js also DROPS a Date Range that says PRE and POST at once ("(!this.attr.CUE
 * || (!this.cue.pre && !this.cue.post) || this.cue.pre !== this.cue.post)" in
 * `isValid`, and the parser keeps only valid ones), so that pair never reaches
 * this layer from a real player.
 *
 * PRE and POST change where a break goes and when its list is asked for (ADR
 * 0110, ADR 0111): a preroll where playback begins, a post-roll after the end,
 * where only its linear default plays. ONCE takes a break out for good once it
 * has played, entered and then left (ADR 0112), so a seek back neither draws
 * it again nor reports it again.
 */
export function cueOf(dateRange) {
  const parsed = dateRange?.cue;
  if (parsed && typeof parsed === 'object') {
    return { pre: !!parsed.pre, post: !!parsed.post, once: !!parsed.once };
  }
  const attr = dateRange?.attr ?? {};
  const raw = attr.CUE ?? attr['X-CUE'];
  const words = new Set(String(raw ?? '').split(/[ ,]+/).filter(Boolean).map((w) => w.toLowerCase()));
  return { pre: words.has('pre'), post: words.has('post'), once: words.has('once') };
}

/**
 * Where a PRE-ROLL sits on the programme (ADR 0110): where playback begins, and
 * NOT at its START-DATE. It is hls.js's reading: `startOffset` is "this.cue.pre ?
 * 0 : this.startTime" (src/loader/interstitial-event.ts), the schedule puts a
 * preroll first whatever its date, and `checkStart` plays it before the
 * primary at whatever `startPosition` playback begins. A non-linear ad does not
 * stop the programme, so "before the primary" becomes "over the primary, from
 * the second playback begins at": `startPosition` when the player was told one,
 * and 0 otherwise (-1, hls.js's "not set", is 0 on a VOD).
 *
 * ON A LIVE PLAYLIST "WHERE PLAYBACK BEGINS" IS THE LIVE JOIN POINT, and -1 is
 * not 0 there: pass `live` (see `liveStartPosition`). It answers `null` when
 * the join point is not known yet, and the caller waits for it.
 */
export function preRollStart(startPosition, live = null) {
  if (live?.live) return liveStartPosition({ startPosition, ...live });
  const at = Number(startPosition);
  return Number.isFinite(at) && at > 0 ? at : 0;
}

/**
 * WHERE A LIVE PLAYLIST IS JOINED, which is where a preroll goes on one (ADR
 * 0110, note of 2026-10-22). It is hls.js 1.7.2's `getLiveStartPos`
 * (src/controller/interstitials-controller.ts), line for line:
 *
 *     const behindLive = (this.primaryDetails?.targetduration || 10) * 3;
 *     if (startPosition === -1 || (liveSync && liveSync - startPosition < behindLive)) {
 *       return liveSync || 0;
 *     }
 *     return startPosition;
 *
 * and it is what `livePrerollResumption` resumes the primary at after a live
 * preroll without X-RESUME-OFFSET: the preroll plays first and the programme
 * is joined at the live sync position (`hls.liveSyncPosition`: the live edge
 * minus the target latency), or at the `startPosition` the player was told when
 * that is more than three target durations behind it. A non-linear preroll
 * does not stop the programme, so it is drawn over it FROM that point.
 *
 * ONE DIFFERENCE, SAID OUT LOUD. hls.js answers 0 when there is no sync
 * position yet, because it only asks after the preroll played, when there is
 * one. This layer has to place the window before, so it answers `null` -- "not
 * known yet" -- and the caller waits for the next playlist update. A sync
 * position of exactly 0 (a stream that has just begun) is a known 0.
 */
export function liveStartPosition({ startPosition = -1, liveSyncPosition = null, targetDuration = null } = {}) {
  const start = Number(startPosition);
  const sync = liveSyncPosition == null ? null : Number(liveSyncPosition);
  const known = sync != null && Number.isFinite(sync);
  const behindLive = (Number(targetDuration) > 0 ? Number(targetDuration) : 10) * 3;
  const unset = !Number.isFinite(start) || start < 0;
  if (unset || (known && sync && sync - start < behindLive)) return known ? sync : null;
  return start;
}

/**
 * WHAT HAPPENS TO A PREROLL, decided when its Date Range is first seen (ADR
 * 0110 and its note of 2026-10-22). Three answers:
 *
 *   `{ start }`       it is placed at `start` (see `preRollStart`).
 *   `{ wait: true }`  live, and the join point is not known yet: ask again on
 *                     the next playlist update.
 *   `{ late: true }`  it was first seen AFTER playback had joined, so it is
 *                     not presented at all.
 *
 * THE THIRD ONE IS hls.js's TOO, and it is why a preroll never plays twice on a
 * live stream. hls.js steps into a preroll only in `checkStart`, and only on
 * the first pass (`timelinePos === -1`): "else if (interstitialEvents[0].cue.pre)
 * { ... this.setSchedulePosition(index); }". After that the schedule is parsed
 * again on every playlist reload (`parseInterstitialDateRanges` on
 * LEVEL_UPDATED), and an event already known keeps its state ("Update
 * InterstitialEvent already parsed and mapped"), so the same preroll is not
 * stepped into again; and a preroll that shows up on a later reload is put
 * first in the schedule, at 0, behind a playhead that is already past it -- it
 * is never reached. On a VOD every Date Range is there on the first update, so
 * the third answer only happens on live.
 */
export function preRollPlacement({ startPosition = -1, live = false, liveSyncPosition = null,
  targetDuration = null, joined = false } = {}) {
  if (joined) return { late: true };
  const start = preRollStart(startPosition, live ? { live, liveSyncPosition, targetDuration } : null);
  return start == null ? { wait: true } : { start };
}

/**
 * WHERE A POST-ROLL GOES: at the end of the programme, and not at its
 * START-DATE (ADR 0111). It is hls.js 1.7.2's `resolveOffsets` and
 * `parseSchedule` (src/controller/interstitials-schedule.ts): "const
 * primaryDuration = details.live ? Infinity : details.edge" and "postroll ?
 * primaryDuration : interstitial.startTime". On a live playlist that is
 * Infinity, a point no playhead reaches, so this answers `null` until the
 * playlist carries its ENDLIST: a post-roll on live only exists once the
 * stream has ended.
 *
 * `details.edge` is hls.js's own "end of the last fragment"; a plain object, as
 * the tests hand over, falls back to the first fragment's start plus the
 * total duration, which is the same number.
 */
export function programEnd(details) {
  if (!details || details.live) return null;
  const edge = Number(details.edge);
  if (Number.isFinite(edge) && edge > 0) return edge;
  const first = Number(details.fragments?.[0]?.start ?? 0);
  const total = Number(details.totalduration);
  return Number.isFinite(total) ? first + total : null;
}

// ===========================================================================
// THE RULES OF lib/playhead.js, AS hls.js 1.7.2 APPLIES THEM
// ===========================================================================
// `onceProgress`, `postRollDue` and `bufferedEndAt` moved to lib/playhead.js in
// phase 19, because a second format reads them the same way. Where each rule
// comes from on this side is hls.js, and it stays written here, next to the code
// that calls them.
//
// A POST-ROLL'S ASSET-LIST (ADR 0111). hls.js asks for it in `onBufferedToEnd`
// ("Buffered to post-roll": `if (interstitial.cue.post) { ...
// this.bufferedToItem(item, 0); }`), on BUFFERED_TO_END, which its buffer
// controller fires when the last fragment of a playlist that has ENDED is
// appended -- never on a live one. So `postRollDue` is asked with the source
// closed (ENDLIST, the `sourceClosed` of `createSignalling`) and the programme
// buffered to its end.
//
// A `CUE="ONCE"` BREAK (ADR 0112). hls.js 1.7.2 removes a ONCE interstitial
// from its schedule "after it has played"
// (src/controller/interstitials-controller.ts, `setSchedulePosition`):
//
//     interstitial.hasPlayed = true;
//     this.hls.trigger(Events.INTERSTITIAL_ENDED, { ... });
//     // Exiting an Interstitial
//     if (interstitial.cue.once && this.hls) {
//       // Remove interstitial with CUE attribute value of ONCE after it has played
//       this.updateSchedule();
//
// and `parseSchedule` filters it out for good: "!(event.cue.once &&
// event.hasPlayed)". `hasPlayed` is set when playback LEAVES the interstitial's
// item for another one, after INTERSTITIAL_STARTED -- at its end, or by a seek
// out of it. That is the "started, then left" of `onceProgress`.
//
// THE QUERY PARAMETERS OF THE CAPABILITIES (`listRequestUrl`, lib/ad-list.js)
// DO NOT BEGIN WITH `_HLS_`, which the base reserves for its own query
// parameters, and which hls.js already puts on the off-the-shelf client's
// asset-list request (`_HLS_primary_id`).
//
// THE BUFFER HOLE. `BUFFER_HOLE_TOLERANCE` is hls.js's own default
// `maxBufferHole` (src/config.ts: "maxBufferHole: 0.1, // used by
// stream-controller and gap-controller"), and the value it hands
// `BufferHelper.bufferInfo(media, pos, maxHoleDuration)` when it measures the
// forward buffer it loads against (`getFwdBufferInfo`, while playing).
// `bufferedEndAt` merges ranges as that function does ("if small hole (value
// between 0 or maxHoleDuration) or overlapping", and "pos + maxHoleDuration >=
// start"). The paused page at 0 of ADR 0109 has THE SAME BEHAVIOUR in hls.js,
// and it is said here so nobody reads the tolerance as copying it: its
// interstitials controller measures with `bufferInfo(primaryMedia,
// timelinePos, 0)` (`checkBuffer`), and nothing moves a paused playhead off 0
// -- `seekToStartPos` only adjusts the start "if (startPosition >= 0 &&
// currentTime < startPosition)", which is false at 0 against 0 on a VOD, and
// the gap controller returns early on a paused element. The tolerance is the
// one place this layer is LESS strict than hls.js, and the smallest number
// hls.js itself uses to call a hole irrelevant.

/**
 * WHEN A BREAK'S ASSET-LIST IS REQUESTED (ADR 0108, ADR 0109): the rule of hls.js
 * for the X-ASSET-LIST of an interstitial, read in the 1.7.2 this repository
 * vendors (`interstitials-controller`), and the only timing this library has.
 * Two places ask for it there, and both end in `preloadAssets` ->
 * `assetListLoader.loadAssetList`:
 *
 *   `updateBufferedPos(bufferEnd)`, on every buffer append: when the item at
 *   the forward buffer end of the primary is past the one being buffered,
 *   `bufferedToItem(next)` -> `bufferedToEvent` -> `preloadAssets(event)`, which
 *   loads the list "if (assetList.length === 0 && !assetListLoader)". That is:
 *   the list is asked for WHEN THE PROGRAMME IS BUFFERED UP TO THE START OF THE
 *   BREAK, and the lead is the forward buffer. (Live adds a look-ahead from the
 *   playlist edge, `interstitialLiveLookAhead`; every primary here is a VOD.)
 *
 *   `advanceSchedule`, when playback -- or a seek -- lands on the item:
 *   `preloadAssets(event, assetIndex)`, the same load. A seek into a break asks
 *   for its list right there, and the break waits for it.
 *
 *   `checkStart`, once the media is attached and loading is enabled, when the
 *   first event of the schedule is a PRE-ROLL (`CUE="PRE"`):
 *   `setSchedulePosition(<the preroll>)` -> `preloadAssets`. A preroll's list is
 *   asked for AT LOAD, paused or not and with nothing buffered (ADR 0110).
 *
 * There is no option to ask for every list up front (ADR 0109): a page that
 * wants the breaks on its timeline before their lists arrive reads the Date
 * Ranges hls.js already parsed, as hls.js leaves them to any page.
 */
/**
 * THE RULE OF ADR 0108 AS A PURE FUNCTION: whether a break's asset-list is due,
 * given where the programme is playing (`time`) and where its forward buffer
 * ends (`bufferedEnd`, see `bufferedEndAt`). Due when the break has not ended
 * and the programme is buffered up to its start -- which includes being played
 * or sought into it, because the buffer end is never behind the playhead.
 *
 * A break that already ended is not due: a seek past it does not ask for it,
 * and a seek back into it does, which is what hls.js does too. A break whose tag
 * declares no length has no end to be past, so it is due whenever the buffer
 * reaches its start.
 *
 * A PRE-ROLL (`pre`, `CUE="PRE"`, ADR 0110) is due at once, whatever the clocks
 * say: hls.js asks for a preroll's list in `checkStart`, as soon as there is a
 * media element and loading has started, and not when the buffer reaches it.
 * The caller only asks while there is a media element, which is the other half
 * of that condition.
 *
 * ONE DIFFERENCE WITH hls.js, SAID OUT LOUD. hls.js walks its schedule one item
 * at a time, so it asks for the next break only; this asks for every break the
 * buffer already reaches. They differ only when two breaks fit inside one
 * forward buffer (30 s by default), which no programme here has.
 */
export function assetListDue({ startTime, duration, pre = false }, { time, bufferedEnd }) {
  if (pre) return true;
  if (!Number.isFinite(time) || !Number.isFinite(startTime)) return false;
  const length = Number(duration);
  const end = duration != null && Number.isFinite(length) && length > 0 ? startTime + length : Infinity;
  if (time >= end) return false;
  return startTime <= Math.max(time, Number.isFinite(bufferedEnd) ? bufferedEnd : time);
}

/**
 * The range a break occupies BEFORE its list is read (ADR 0108): off its tag,
 * DURATION or PLANNED-DURATION, as the replacement kind is always placed, and
 * marked `provisional`. It is replaced by the range of what the list resolves
 * into, or removed when it resolves into nothing. `null` when the tag declares
 * no length: it cannot be placed on a bar until the list says how long it is.
 */
export function provisionalRange(id, dateRange, startTime, kind) {
  const declared = dateRange?.duration ?? dateRange?.plannedDuration;
  const duration = Number(declared);
  if (declared == null || !Number.isFinite(duration)) return null;
  return { id, kind, startTime, duration, provisional: true };
}

// ===========================================================================
// THE OTHER CLASS, PLAYED BY hls.js IN THE SAME INSTANCE (ADR 0114)
// ===========================================================================
// One stream can carry both kinds of break -- ours, drawn over the programme,
// and Apple's traditional interstitial, which REPLACES it -- as long as they do
// not overlap in time (ADR 0113). The second kind is not this library's to
// play: hls.js has a whole machinery for it, and the instance now runs with that
// machinery ON. What this side needs from it is three readings, all off the
// interstitials manager hls.js exposes (`hls.interstitialsManager`, null when
// the machinery is off), and they are pure so the tests can hand them a fake:
//
//   - whether hls.js is playing one of its interstitials right now, because
//     while it is, the media element may not be playing the programme at all:
//     hls.js 1.7.2 either appends the ad into the primary timeline or hands the
//     MediaSource to the asset, and in the second case the element's clock and
//     length are the AD's (measured, ADR 0114);
//   - the programme's own clock, which is `primary` of that manager;
//   - and the breaks it scheduled, which is what a bar of this player marks for
//     that kind (ADR 0018: a bar marks what its own player plays).

/** Whether hls.js is playing an interstitial of its own (Apple's class) right now. */
export function linearOnScreen(manager) {
  return Boolean(manager?.playingItem?.event);
}

/**
 * Whether the programme has reached its end, by the programme's clock. An
 * `ended` of the element can be the end of an interstitial asset that hls.js
 * played on that same element, and the programme is then nowhere near its end.
 * With no manager, or no schedule to measure against, the element is trusted.
 */
export function programmeAtEnd(manager, tolerance = 1) {
  const duration = Number(manager?.primary?.duration);
  if (!(duration > 0)) return true;
  const at = Number(manager.primary.currentTime);
  return Number.isFinite(at) && at >= duration - tolerance;
}

/**
 * The ranges of the programme hls.js scheduled for its own interstitials, as
 * ranges of the contract, kind `interstitial`.
 *
 * The span is what the break takes out of the PROGRAMME, `resumeTime -
 * startTime` (the replacement form, ADR 0017), and the length of the ad where
 * that is not known. Two kinds of scheduled event are not marked: a post-roll,
 * which takes no time of the programme (the rule ADR 0111 set for ours), and a
 * break hls.js is known to skip -- its list loaded and gave it no asset to play
 * (ADR 0092) -- whose identifier is remembered in `skipped`, because hls.js asks
 * for the list again after a seek and the mark must not come back.
 */
export function scheduledRanges(events, skipped = new Set()) {
  const out = [];
  for (const event of events || []) {
    if (event.assetListLoaded && event.assetList?.length === 0) skipped.add(event.identifier);
    if (skipped.has(event.identifier) || event.cue?.post) continue;
    const span = event.resumeTime - event.startTime;
    const duration = Number.isFinite(span) && span > 0 ? span : Number(event.duration);
    if (!Number.isFinite(event.startTime) || !(duration > 0)) continue;
    out.push({ id: event.identifier, kind: KIND_OF_CLASS[INTERSTITIAL_CLASS], startTime: event.startTime, duration });
  }
  return out.sort((a, b) => a.startTime - b.startTime);
}

/**
 * THE PROGRAMME, as something the chrome can be handed instead of the element:
 * the four properties the controls read and write (`currentTime`, `duration`,
 * `paused`, `muted`), the two they read for the frame (`videoWidth`,
 * `videoHeight`), and `play`, `pause` and the listeners forwarded to the
 * element. It is the facade a player of that kind needs for its bar, moved into
 * the library because ours now plays that kind too (ADR 0114).
 *
 * WHILE hls.js IS NOT PLAYING ONE OF ITS INTERSTITIALS IT IS THE ELEMENT, and
 * that is deliberate: the element's clock is the smooth one, read on every
 * frame, and it IS the programme's. While one is on screen it is
 * `interstitialsManager.primary`, which reports the programme -- its length
 * throughout, and a playhead that stays inside the break -- whichever of its two
 * strategies hls.js chose. A seek written then goes to the programme's timeline
 * through hls.js, which applies the break's `X-RESTRICT`: that policy is its
 * to enforce.
 */
export function createProgramme(hls, video) {
  const manager = () => hls.interstitialsManager;
  const replaced = () => linearOnScreen(manager());
  return {
    get currentTime() {
      const at = manager()?.primary?.currentTime;
      return replaced() && Number.isFinite(at) ? at : video.currentTime;
    },
    set currentTime(seconds) {
      const primary = manager()?.primary;
      if (replaced() && primary) primary.currentTime = seconds;
      else video.currentTime = seconds;
    },
    get duration() {
      const length = manager()?.primary?.duration;
      return replaced() && Number.isFinite(length) && length > 0 ? length : video.duration;
    },
    get paused() { return video.paused; },
    get muted() { return video.muted; },
    set muted(value) { video.muted = value; },
    get videoWidth() { return video.videoWidth; },
    get videoHeight() { return video.videoHeight; },
    play: () => video.play(),
    pause: () => video.pause(),
    addEventListener: (...args) => video.addEventListener(...args),
    removeEventListener: (...args) => video.removeEventListener(...args),
    /** Whether hls.js is playing one of its interstitials, so the programme is off the screen. */
    linearOnScreen: replaced
  };
}

/**
 * The one impure function, and the only place hls.js is touched: subscribe to
 * LEVEL_UPDATED, keep the Date Ranges of our classes, ask for their X-ASSET-LIST
 * (the APPLICATION asks: hls.js only schedules Apple's class, ADR 0114), and
 * resolve the layout.
 *
 * `capabilities` is read ONCE, here, and not on every request: what it can be
 * wrong about is what the integrator wrote, and that is one statement and not
 * one per break. Five identical warnings for one mistake is how a console stops
 * being read.
 *
 * `sendCapabilities` says whether they also travel on the asset-list request.
 * Configuring them and sending them are two things since ADR 0104: the filter
 * always uses what was configured, and the request carries it only when this is
 * true, because sending is OPTIONAL and capability values add to what can
 * fingerprint a device (SVTA2053 5.3.3, "Capability parameters").
 *
 * `onResolved(experiences, selection)` gets, as its second argument, what the
 * intermediate step of ADR 0085 did with this break: the URL that was asked
 * for, and per asset what was offered, what was discarded and why, and how the
 * asset ended (see `resolveAssets`). It is called for a break that resolved
 * to nothing too, because a skipped break is exactly what a page has to be able
 * to show. `requests` in it lists every first request made for the break,
 * `{ uri, ok, error }`, and is empty without `firstRequest`.
 *
 * `firstRequest(uri, mediaType, { method })`, when given, is how the first
 * request for an asset is made by PRE-VALIDATION, before the list is handed
 * over (ADR 0106, ADR 0107, SVTA2053 5.3.3 "Asset load failure"): an option one
 * of whose first requests fails is left out of the options handed to the
 * renderer, and a default linear ad whose first request fails is skipped. The
 * entry point passes the one in media.js. Without it nothing is requested here.
 *
 * `preValidateAssets` (default `false`) says whether pre-validation runs at all,
 * and `preValidateMethod` (`'GET'` or `'HEAD'`, default `'GET'`) which method
 * the request of a playlist or a file is made with; both are read once, here,
 * by `usablePreValidation`. With pre-validation off nothing is requested at
 * resolution time and the renderer's failover is the only check, which it is
 * anyway: pre-validation only discards options before the renderer sees them.
 * `onResolved` gets what was used in `preValidation`, `{ enabled, method }`.
 *
 * Each break's asset-list is requested WHEN hls.js WOULD ASK FOR IT (ADR 0108):
 * when the programme is buffered up to the break, or played or sought into it;
 * a preroll's (`CUE="PRE"`), at load, and it is placed where playback begins,
 * which on a live playlist is the live join point; a preroll first seen after
 * playback joined is not presented (ADR 0110).
 * Until then the range of the break is on the list already, `provisional`, off
 * its tag, and `experiences` grows as lists arrive. There is no option for it
 * (ADR 0109).
 */
export function createSignalling(hls, {
  onResolved, capabilities = null, sendCapabilities = true, firstRequest = null,
  preValidateAssets = false, preValidateMethod = 'GET'
} = {}) {
  const experiences = [];
  const ranges = [];
  const done = new Set();
  const declared = usableCapabilities(capabilities);
  const preValidation = usablePreValidation({ preValidateAssets, preValidateMethod });
  const request = firstRequest && preValidation.enabled
    ? (uri, mediaType) => firstRequest(uri, mediaType, { method: preValidation.method })
    : null;
  // The two things `settled` is made of, and neither is about the programme:
  // whether the SOURCE can still hand over ranges, and how many asset-lists are
  // in flight. A list is complete when nothing more can arrive and nothing is
  // half resolved. A break whose list is not due yet is NOT in flight: its range
  // is already in the list, provisional, off its tag (ADR 0108).
  let sourceClosed = false;
  let pending = 0;
  /**
   * id -> a break whose asset-list is not due yet: `{ id, url, slotStart, kind,
   * pre, dateRange, range }`. A live preroll whose join point is not known yet
   * waits here with `slotStart` null and no range (`preRollPlacement`).
   */
  const waiting = new Map();
  /** id -> a preroll of a kind not resolved here, waiting for the live join point to be placed. */
  const unplaced = new Map();
  /** Whether playback has joined: a preroll first seen after that is not presented (ADR 0110). */
  let joined = false;
  /**
   * id -> a POST-ROLL (`CUE="POST"`, ADR 0111): `{ id, kind, dateRange, url,
   * state, startTime, experiences }`. `url` is null for the kind only reported
   * here. `state` is `waiting`, `requested`, `resolved` or `failed`;
   * `startTime` is the end of the programme, null while it has none (live).
   * Its experiences are NOT in `experiences`: they play after the programme,
   * by their own clock (lib/postroll.js).
   */
  const postRolls = new Map();
  /**
   * id -> a `CUE="ONCE"` break (ADR 0112): `{ entered, spent }`. Once spent its
   * experiences and its range leave the lists for good, as hls.js takes a ONCE
   * interstitial out of its schedule after it played.
   */
  const onces = new Map();
  /** Whether the programme is buffered to its end: BUFFERED_TO_END, or the media ended. */
  let bufferedToEnd = false;

  /** Where a preroll goes given the playlist just read: hls.js's reading, live included (ADR 0110). */
  function placePreRoll(details, alreadyJoined = joined) {
    return preRollPlacement({
      startPosition: hls.startPosition, live: details.live === true,
      liveSyncPosition: hls.liveSyncPosition, targetDuration: details.targetduration, joined: alreadyJoined
    });
  }

  /** Place the live prerolls that were waiting for the join point, now that there may be one. */
  function placeWaiting(details) {
    for (const brk of waiting.values()) {
      if (brk.slotStart != null) continue;
      const { start } = placePreRoll(details, false);
      if (start == null) continue;
      brk.slotStart = start;
      brk.range = provisionalRange(brk.id, brk.dateRange, start, brk.kind);
      if (brk.range) ranges.push(brk.range);
      console.log(`[signalling] ${brk.id}: the live join point is known, the preroll is placed at t=${start.toFixed(2)}s.`);
    }
    for (const [id, { dateRange }] of unplaced) {
      const { start } = placePreRoll(details, false);
      if (start == null) continue;
      unplaced.delete(id);
      const range = rangeOfDateRange(id, dateRange, start);
      if (range) ranges.push(range);
    }
  }

  hls.on(Hls.Events.LEVEL_UPDATED, (_event, data) => read(data.details));

  // THE TWO CLOCKS THE RULE OF ADR 0108 READS, which are the two hls.js reads:
  // how far the programme is buffered, and where it is playing. Every event
  // that can move either one asks again; asking is a loop over the breaks still
  // waiting, which is a handful, so it is not throttled.
  let watched = null;
  const watch = (media) => {
    if (!media || media === watched) return;
    watched = media;
    for (const type of ['timeupdate', 'seeking', 'progress']) media.addEventListener(type, due);
    for (const type of ['timeupdate', 'seeking', 'seeked']) media.addEventListener(type, spend);
    // The element's `ended` counts only when it is the PROGRAMME that ended: it
    // also fires at the end of an interstitial asset hls.js played on this
    // element (ADR 0114).
    media.addEventListener('ended', () => { if (programmeAtEnd(hls.interstitialsManager)) reachedEnd(); });
    due();
  };
  hls.on(Hls.Events.MEDIA_ATTACHED, (_event, data) => watch(data?.media));
  hls.on(Hls.Events.BUFFER_APPENDED, () => due());
  // The moment hls.js asks for a post-roll's list (ADR 0111): its buffer
  // controller fires this when the last fragment of an ended playlist is in.
  const reachedEnd = () => { bufferedToEnd = true; duePost(); };
  if (Hls.Events.BUFFERED_TO_END) hls.on(Hls.Events.BUFFERED_TO_END, reachedEnd);
  watch(hls.media);

  /** Request every waiting asset-list the rule says is due now. */
  function due() {
    const media = hls.media;
    if (!media || !waiting.size) return;
    // While hls.js plays one of its interstitials the element may be playing
    // the AD, on the ad's clock and the ad's buffer: neither says anything
    // about the programme, so nothing is decided until it is back (ADR 0114).
    if (linearOnScreen(hls.interstitialsManager)) return;
    const time = media.currentTime;
    const bufferedEnd = bufferedEndAt(rangesOf(media.buffered), time);
    for (const [id, brk] of waiting) {
      // A live preroll not placed yet has no window to draw into: it waits for
      // the join point, which the next playlist update brings (ADR 0110).
      if (brk.slotStart == null) continue;
      const span = brk.range ?? { startTime: brk.slotStart, duration: null };
      if (!assetListDue({ ...span, pre: brk.pre }, { time, bufferedEnd })) continue;
      waiting.delete(id);
      // Counted BEFORE the first await of `resolveBreak`: counted after it,
      // `pending` could touch zero between two lists due on the same tick and
      // `settled` would say "complete" over half a list.
      pending += 1;
      resolveBreak(brk);
    }
  }

  function read(details) {
    const anchor = (details.fragments || []).find((f) => f.programDateTime != null);
    if (!anchor) return;
    // A playlist without an ENDLIST can still grow, and while it can grow no
    // list of ranges is the final one. This is the whole limit of the promise:
    // it is a property of the source and not of this layer. In this POC it is
    // closed on the first update because the primary is a VOD with the Date
    // Ranges written in the media playlist (ADR 0005).
    if (details.live === false) sourceClosed = true;
    placeWaiting(details);

    // Everything that can be decided without going to the network is decided
    // here, synchronously: the kind, the slot, the URL and the provisional range.
    const toResolve = [];
    for (const [id, dateRange] of Object.entries(details.dateRanges || {})) {
      const kind = kindOfClass(dateRange.class);
      if (!kind || done.has(id)) continue;
      done.add(id);
      // A preroll sits where playback begins and not at its START-DATE, as in
      // hls.js (ADR 0110): on a live playlist, the live join point, and one
      // first seen after playback joined is not presented (`preRollPlacement`).
      // Every other break, at its START-DATE.
      const { pre, post, once } = cueOf(dateRange);
      if (once && !post) onces.set(id, { entered: false, spent: false });
      // A post-roll goes at the end of the programme, and only its linear
      // default plays there (ADR 0111): it is set aside here and placed below.
      if (post) {
        postRolls.set(id, {
          id, kind, dateRange, once, state: 'waiting', startTime: null, experiences: [],
          url: KINDS_RESOLVED.has(kind)
            ? listRequestUrl(dateRange.attr['X-ASSET-LIST'], details.url || location.href, sendCapabilities ? declared : null)
            : null
        });
        continue;
      }
      let slotStart;
      if (pre) {
        const placement = placePreRoll(details);
        if (placement.late) {
          console.log(`[signalling] ${id} is a preroll (CUE="PRE") first seen after playback joined:` +
            ' it is not presented, as hls.js does not step back into one (ADR 0110).');
          continue;
        }
        slotStart = placement.wait ? null : placement.start;
      } else slotStart = mediaTimeOf(dateRange.startDate, anchor);
      if (!KINDS_RESOLVED.has(kind)) {
        if (slotStart == null) { unplaced.set(id, { id, dateRange, kind }); continue; }
        const range = rangeOfDateRange(id, dateRange, slotStart);
        if (range) ranges.push(range);
        continue;
      }
      const url = listRequestUrl(dateRange.attr['X-ASSET-LIST'], details.url || location.href,
        sendCapabilities ? declared : null);
      toResolve.push({
        id, url, slotStart, kind, pre, dateRange,
        range: slotStart == null ? null : provisionalRange(id, dateRange, slotStart, kind)
      });
    }
    // Whether playback has joined, which is what makes a preroll seen from now
    // on a late one: the first update read with a media element there, as
    // hls.js's `checkStart` runs once there is media and loading has started.
    if (hls.media) joined = true;
    placePostRolls(details);

    // ON DEMAND (ADR 0108): the break is known and its list is not asked for
    // yet. Its range goes on the list now, provisional, off the tag -- so the
    // bar marks every break from the start, as it always did -- and the list
    // is asked for when the rule of hls.js says so.
    for (const brk of toResolve) {
      if (brk.range) ranges.push(brk.range);
      waiting.set(brk.id, brk);
      if (brk.slotStart == null) {
        console.log(`[signalling] ${brk.id} is a preroll (CUE="PRE") on a live playlist whose join point` +
          ' is not known yet: it is placed, and its asset-list requested, on the next update (ADR 0110).');
        continue;
      }
      console.log(brk.pre
        ? `[signalling] ${brk.id} is a preroll (CUE="PRE") at t=${brk.slotStart.toFixed(2)}s: its asset-list` +
          ' is requested at load, as hls.js does (ADR 0110).'
        : `[signalling] ${brk.id} at t=${brk.slotStart.toFixed(2)}s: its asset-list is requested` +
          ' when the programme is buffered up to it, or played or sought into it (ADR 0108).');
    }
    due();
    duePost();
  }

  /**
   * Give every post-roll the end of the programme, once there is one (ADR
   * 0111): at once on a VOD, and on live only when the playlist ends. The kind
   * only reported here gets its range there, marked `postroll`: it occupies no
   * time of the programme, so a bar draws nothing for it.
   */
  function placePostRolls(details) {
    const end = programEnd(details);
    if (end == null) return;
    for (const entry of postRolls.values()) {
      if (entry.startTime != null) continue;
      entry.startTime = end;
      if (entry.url) {
        console.log(`[signalling] ${entry.id} is a post-roll (CUE="POST") at the end of the programme,` +
          ` t=${end.toFixed(2)}s: its asset-list is requested when the programme is buffered to its end,` +
          ' and only its linear default plays, after the programme (ADR 0111).');
        continue;
      }
      const range = rangeOfDateRange(entry.id, entry.dateRange, end);
      if (range) ranges.push({ ...range, postroll: true });
    }
  }

  /** Request every post-roll's asset-list the rule says is due now (ADR 0111). */
  function duePost() {
    if (!postRollDue({ sourceClosed, bufferedToEnd })) return;
    for (const entry of postRolls.values()) {
      if (entry.state !== 'waiting' || !entry.url || entry.startTime == null) continue;
      entry.state = 'requested';
      pending += 1;
      resolvePost(entry);
    }
  }

  /** Ask for one post-roll's asset-list and keep its linear defaults. `pending` is already counting it. */
  async function resolvePost(entry) {
    const { id, url } = entry;
    console.log(`[signalling] ${id}: post-roll asset-list ${url}`);
    try {
      const assetList = await fetch(url).then((r) => r.json());
      const report = [];
      entry.experiences = resolvePostRoll(assetList, { id, slotStart: entry.startTime, report });
      entry.state = 'resolved';
      onResolved?.(entry.experiences.slice(), {
        id, url, postroll: true, capabilities: declared, sent: Boolean(sendCapabilities && declared),
        assets: report, requests: [], preValidation: { enabled: false, method: null }
      });
    } catch (error) {
      entry.state = 'failed';
      console.error(`[signalling] ${id}: the post-roll's asset-list could not be read, so it is cancelled` +
        ' (Appendix D.5): nothing plays after the programme.', url, error);
    } finally {
      pending -= 1;
    }
  }

  /**
   * Take every ONCE break that has played out of the lists (ADR 0112): its
   * experiences, so nothing draws it again and no tracking fires for it again,
   * and its range, so the bar stops marking it. In place, because
   * `experiences` is handed out by reference.
   */
  function spend() {
    const media = hls.media;
    if (!media || !onces.size) return;
    // Same reason as in `due`: the ad's clock would enter and leave windows of
    // the programme it never played (ADR 0114).
    if (linearOnScreen(hls.interstitialsManager)) return;
    const time = media.currentTime;
    for (const [id, state] of onces) {
      if (state.spent) continue;
      const { entered, spent } = onceProgress(ranges.find((r) => r.id === id), state.entered, time);
      state.entered = entered;
      if (!spent) continue;
      state.spent = true;
      waiting.delete(id);
      for (let i = experiences.length; i--;) if (experiences[i].id === id) experiences.splice(i, 1);
      for (let i = ranges.length; i--;) if (ranges[i].id === id) ranges.splice(i, 1);
      console.log(`[signalling] ${id} is CUE="ONCE" and has played: it leaves the experiences and the` +
        ' ranges for good, as hls.js removes it from its schedule (ADR 0112).');
    }
  }

  /** Ask for one break's asset-list, resolve it, and put it on the lists. `pending` is already counting it. */
  async function resolveBreak({ id, url, slotStart, kind, range: provisional }) {
    console.log(`[signalling] ${id} at t=${slotStart.toFixed(2)}s, asset-list ${url}`);
    // The provisional range leaves the list whatever happens below: what
    // replaces it is the range of what the list resolved into, or nothing.
    const drop = () => {
      const at = ranges.indexOf(provisional);
      if (at >= 0) ranges.splice(at, 1);
    };
    try {
      const assetList = await fetch(url).then((r) => r.json());
      const report = [];
      const requests = [];
      // The first requests go out HERE, between the list arriving and the
      // break being handed over, so `pending` keeps counting this break until
      // they are answered and `settled` cannot say "complete" before
      // pre-validation has been decided (ADR 0106, ADR 0107). They are those of
      // THIS break only: the moment its list arrives, and not the moment the
      // playlist does (ADR 0108).
      const resolved = request
        ? await resolveWithFirstRequests(assetList, {
          id, slotStart, capabilities: declared, report, firstRequest: request, requests
        })
        : resolveAssets(assetList, { id, slotStart, capabilities: declared, report });
      drop();
      // A ONCE break already played while its list was on its way stays gone (ADR 0112).
      if (onces.get(id)?.spent) return;
      experiences.push(...resolved);
      const range = rangeOfExperiences(id, resolved, kind);
      if (range) ranges.push(range);
      onResolved?.(resolved, {
        id, url, capabilities: declared, sent: Boolean(sendCapabilities && declared), assets: report, requests,
        preValidation: { enabled: Boolean(request), method: request ? preValidation.method : null }
      });
    } catch (error) {
      drop();
      // The SECOND rung of Appendix D.5: when the LIST itself cannot be had,
      // what is cancelled is the whole interstitial, with offset 0. Under
      // this render offset 0 is what already happened -- the primary was
      // never interrupted -- so cancelling is exactly this: no experience, no
      // range on the bar, and the programme carrying on. The error is the
      // report; the break leaves no other trace, which is why it is an error
      // and not a warning.
      console.error(`[signalling] ${id}: the asset-list could not be read, so the whole break is` +
        ' cancelled with offset 0 (Appendix D.5): nothing is played, no range is reported, and' +
        ' the programme is not interrupted.', url, error);
    } finally {
      pending -= 1;
    }
  }

  return {
    activeAt: (time) => activeAt(experiences, time),
    // Where all the ranges of the programme are, which is a different question
    // from what is active now. A fresh array on every call, sorted, so the
    // caller cannot reorder the layer's own state. A range is replaced once:
    // a provisional one, off the tag, by the one its list resolved into.
    programRanges: () => ({
      ranges: [...ranges].sort((a, b) => a.startTime - b.startTime),
      settled: sourceClosed && pending === 0
    }),
    // The post-rolls of the programme (ADR 0111), in the order of their tags:
    // what plays after it ends. A fresh copy on every call. Each one is `{ id,
    // kind, state, startTime, experiences }`, and its experiences are linear
    // ads only; `activeAt` never hands them over.
    postRolls: () => [...postRolls.values()]
      .filter((entry) => entry.url)
      .map(({ id, kind, once, state, startTime, experiences }) => ({
        id, kind, once: Boolean(once), state, startTime, experiences: experiences.slice()
      })),
    experiences
  };
}
