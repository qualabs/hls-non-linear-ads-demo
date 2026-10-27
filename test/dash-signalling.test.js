// dash/signalling.js (phase 19): an MPD with the scheme of SVTA becomes the
// contract of ADR 0003, as a playlist does in hls/signalling.js.
//
// The MPD of these tests is test/fixtures/dash/breaks.mpd, and its plain reading
// is breaks.json, written by hand from the MPD's text: the pure functions are
// tested on that, and `readMpd` -- which needs a DOM -- is checked against the
// same pair in a browser (T-04 of phase 19). The slots `$remote.slots` answers
// are slots-two.json and slots-post.json, the options of break B of stage-pair.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  SVTA_SCHEME, SLOTS_LEAD_SECONDS, adListOfSlots, breaksOfMpd, createSignalling, cueOf, drawnAt, eventWindow,
  isoDuration, periodWindows, readEnvelope, replaceExperience, slotsDue, slotsOfEnvelope
} from '../dash/signalling.js';
import { resolveAssets } from '../lib/ad-list.js';

const fixture = (name) => readFileSync(new URL(`fixtures/dash/${name}`, import.meta.url), 'utf8');
const MPD = JSON.parse(fixture('breaks.json'));
const SLOTS_TWO = JSON.parse(fixture('slots-two.json'));
const SLOTS_POST = JSON.parse(fixture('slots-post.json'));
const BASE = 'https://cdn.example/demo/content/primary/dash/manifest.mpd';
const envelope = (fields) => JSON.stringify({ version: 2, type: 'pod', payload: [{ duration: 6, slots: [] }], ...fields });
const CONCURRENT = { concurrentPresentation: true };

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

test('xs:duration in seconds, and null for what has no length', () => {
  assert.equal(isoDuration('PT3M20S'), 200);
  assert.equal(isoDuration('PT0.5S'), 0.5);
  assert.equal(isoDuration('P1DT1H'), 90000);
  assert.equal(isoDuration(null), null);
  assert.equal(isoDuration('PT'), null);
  assert.equal(isoDuration('P1Y'), null, 'a year has no length in seconds');
});

test('a Period begins at its @start or where the one before it ended, and the last ends with the MPD', () => {
  assert.deepEqual(periodWindows(MPD), [{ start: 0, end: 100 }, { start: 100, end: 200 }]);
  assert.deepEqual(periodWindows({ mediaPresentationDuration: 30, periods: [{ start: null, duration: null }, { start: 10, duration: null }] }),
    [{ start: 0, end: 10 }, { start: 10, end: 30 }]);
});

test('an Event is placed by its timescale and the presentationTimeOffset of its stream, from its Period', () => {
  // By hand: (4950000 - 900000) / 90000 = 45 s into the Period that starts at
  // 100 s, so 145 s; 1080000 / 90000 = 12 s long.
  const [, p1] = MPD.periods;
  assert.deepEqual(eventWindow(p1.eventStreams[0].events[0], p1.eventStreams[0], { start: 100, end: 200 }),
    { startTime: 145, duration: 12 });
});

test('an Event ends at the end of its Period at the latest', () => {
  const [p0] = MPD.periods;
  const event5 = p0.eventStreams[0].events[4];
  assert.deepEqual(eventWindow(event5, p0.eventStreams[0], { start: 0, end: 100 }), { startTime: 95, duration: 5 });
  assert.deepEqual(eventWindow({ ...event5, duration: null }, p0.eventStreams[0], { start: 0, end: 100 }),
    { startTime: 95, duration: 5 }, 'no @duration: up to the end of the Period');
  assert.deepEqual(eventWindow(event5, p0.eventStreams[0], { start: 0, end: null }), { startTime: 95, duration: 12 });
});

// ---------------------------------------------------------------------------
// The envelope
// ---------------------------------------------------------------------------

test('a version 2 pod with the flag is a break, with its cue and whether it may be remote', () => {
  const read = readEnvelope(envelope({ features: { ...CONCURRENT, remoteFields: true }, cue: ['ONCE'] }));
  assert.equal(read.ignored, undefined);
  assert.equal(read.pods.length, 1);
  assert.deepEqual(read.cue, { pre: false, post: false, once: true });
  assert.equal(read.remote, true);
});

test('without features.concurrentPresentation the envelope is the signalling of 6.1, not a break', () => {
  assert.match(readEnvelope(envelope({})).ignored, /concurrentPresentation/);
  assert.match(readEnvelope(envelope({ features: { concurrentPresentation: false } })).ignored, /concurrentPresentation/);
});

test('a feature this reader does not implement makes the payload ignored (5.2.2.1)', () => {
  assert.match(readEnvelope(envelope({ features: { ...CONCURRENT, somethingNew: true } })).ignored, /somethingNew/);
  assert.equal(readEnvelope(envelope({ features: { ...CONCURRENT, somethingNew: false } })).ignored, undefined,
    'a flag set to false asks for nothing');
});

test('another version, another type, no pod, or no JSON: ignored, each with its reason', () => {
  assert.match(readEnvelope(envelope({ version: 1, features: CONCURRENT })).ignored, /version 1/);
  assert.match(readEnvelope(envelope({ type: 'slot', features: CONCURRENT })).ignored, /"slot"/);
  assert.match(readEnvelope(envelope({ payload: [], features: CONCURRENT })).ignored, /no Pod/);
  assert.match(readEnvelope('{ not json').ignored, /not JSON/);
  assert.match(readEnvelope('').ignored, /not JSON|no body/);
});

test('the cue takes the values of HLS, in an array or a string, in any case', () => {
  assert.deepEqual(cueOf(['PRE']), { pre: true, post: false, once: false });
  assert.deepEqual(cueOf('post'), { pre: false, post: true, once: false });
  assert.deepEqual(cueOf('PRE, ONCE'), { pre: true, post: false, once: true });
  assert.deepEqual(cueOf(['MID', 3]), { pre: false, post: false, once: false });
  assert.deepEqual(cueOf(undefined), { pre: false, post: false, once: false });
});

test('$remote.slots has to answer a version 2 envelope of type slot (5.2.2.2.2)', () => {
  assert.equal(slotsOfEnvelope(SLOTS_TWO).length, 2);
  assert.throws(() => slotsOfEnvelope({ version: 2, type: 'pod', payload: [] }), /type "slot"/);
  assert.throws(() => slotsOfEnvelope({ version: 1, type: 'slot', payload: [] }), /version 2/);
  assert.throws(() => slotsOfEnvelope(null));
});

// ---------------------------------------------------------------------------
// From slots to the list lib/ad-list.js reads
// ---------------------------------------------------------------------------

test('one asset per slot: its media is the default linear ad, its duration the asset\'s, its start 0', () => {
  const { ASSETS } = adListOfSlots(SLOTS_TWO.payload);
  assert.equal(ASSETS.length, 2);
  assert.equal(ASSETS[0].URI, '/content/creatives/ketrava-16x9/dash/manifest.mpd');
  assert.equal(ASSETS[1].URI, undefined, 'a slot with no media has no default (ADR 0122)');
  assert.deepEqual(ASSETS.map((a) => a.DURATION), [6, 6]);
  const item = ASSETS[1]['X-AD-CREATIVE-SIGNALING'].payload[0];
  assert.equal(item.start, 0, 'an item\'s start is an offset inside its own asset');
  assert.equal(item.media, undefined);
  assert.equal(item.layoutOptions.length, 4);
});

test('the slots resolve one behind the other on the programme, as the slot starts said', () => {
  const resolved = resolveAssets(adListOfSlots(SLOTS_TWO.payload), { id: '2', slotStart: 45 });
  assert.deepEqual(resolved.map((e) => [e.startTime, e.duration]), [[45, 6], [51, 6]]);
});

test('slots with a hole or an overlap between them are refused, not drawn at the wrong second', () => {
  const [a, b] = SLOTS_TWO.payload;
  assert.throws(() => adListOfSlots([a, { ...b, start: 7 }]), /starts at 7 s and the slots before it end at 6 s/);
  assert.throws(() => adListOfSlots([a, { ...b, start: 5 }]), /starts at 5 s/);
  assert.doesNotThrow(() => adListOfSlots([a, { ...b, start: 6.0005 }]), 'within a millisecond is contiguous');
  assert.throws(() => adListOfSlots([{ ...a, start: 1 }]), /slot 1 starts at 1 s/);
});

test('the first media with a uri is the default; an empty list is a list with no assets', () => {
  const [a] = SLOTS_TWO.payload;
  const media = [{ type: 'application/dash+xml', id: 'x', uri: ' ' }, { type: 'video/mp4', id: 'y', uri: '/y.mp4' }];
  assert.equal(adListOfSlots([{ ...a, media }]).ASSETS[0].URI, '/y.mp4');
  assert.deepEqual(adListOfSlots([]), { ASSETS: [] });
  assert.deepEqual(adListOfSlots(undefined), { ASSETS: [] });
});

// ---------------------------------------------------------------------------
// When the slots are asked for (ADR 0124)
// ---------------------------------------------------------------------------

test('the slots are due 60 s before the break, and not a millisecond earlier', () => {
  const brk = { startTime: 145, duration: 12 };
  assert.equal(SLOTS_LEAD_SECONDS, 60);
  assert.equal(slotsDue(brk, 85), true);
  assert.equal(slotsDue(brk, 84.999), false);
  assert.equal(slotsDue(brk, 0), false);
});

test('a seek into the window asks for them, and a break already over is not asked for', () => {
  const brk = { startTime: 145, duration: 12 };
  assert.equal(slotsDue(brk, 150), true);
  assert.equal(slotsDue(brk, 157), false);
  assert.equal(slotsDue(brk, 300), false);
});

test('a pre-roll is due at once; a break with no length stays due once reached', () => {
  assert.equal(slotsDue({ startTime: 0, duration: 12, pre: true }, NaN), true);
  assert.equal(slotsDue({ startTime: 145, duration: null }, 1000), true);
  assert.equal(slotsDue({ startTime: 145, duration: 12 }, NaN), false);
});

// ---------------------------------------------------------------------------
// The breaks of an MPD
// ---------------------------------------------------------------------------

test('the breaks of the MPD: each in its place, the replace one with its length cut by maxDuration', () => {
  const { breaks, ignored } = breaksOfMpd(MPD, BASE);
  assert.deepEqual(breaks.map((b) => [b.id, b.kind, b.startTime, b.duration]), [
    ['1', 'concurrent', 0, 12],
    ['2', 'concurrent', 45, 12],
    ['3', 'concurrent', 70, 6],
    ['5', 'concurrent', 95, 5],
    ['6', 'concurrent', 145, 12],
    ['9', 'interstitial', 150, 10]
  ]);
  assert.deepEqual(ignored.map((i) => i.id), ['4'], 'the envelope without the flag');
  const replace = breaks.find((b) => b.id === '9');
  assert.equal(replace.once, true);
  assert.equal(replace.uri, 'https://cdn.example/content/creatives/ketrava-16x9/dash/manifest.mpd');
  assert.deepEqual(breaks.find((b) => b.id === '6').cue, { pre: false, post: true, once: false });
});

test('a replace without maxDuration lasts its Event, and one without @uri is left out', () => {
  const stream = MPD.periods[1].eventStreams[1];
  const event = stream.events[0];
  const mpd = (replace) => ({ ...MPD, periods: [MPD.periods[0], { ...MPD.periods[1], eventStreams: [{ ...stream, events: [{ ...event, replace }] }] }] });
  const lone = (m) => breaksOfMpd(m, BASE);
  assert.equal(lone(mpd({ ...event.replace, maxDuration: null })).breaks.find((b) => b.id === '9').duration, 12);
  assert.deepEqual(lone(mpd({ ...event.replace, uri: null })).ignored.find((i) => i.id === '9').why, 'its ReplacePresentation has no @uri');
});

test('the traditional linear break is drawn alone: nothing of ours over it (ADR 0125)', () => {
  const linear = [replaceExperience({ id: '9', startTime: 150, duration: 10, uri: 'https://cdn.example/x.mpd' })];
  assert.equal(linear[0].type, 'linear');
  assert.equal(linear[0].elements.find((e) => !e.primary).uri, 'https://cdn.example/x.mpd');
  const ours = resolveAssets(adListOfSlots(SLOTS_TWO.payload), { id: '2', slotStart: 148 });
  assert.deepEqual(drawnAt(ours, linear, 151).map((e) => e.id), ['9']);
  assert.deepEqual(drawnAt(ours, linear, 149).map((e) => e.id), ['2']);
  assert.deepEqual(drawnAt(ours, linear, 160).map((e) => e.id), []);
  assert.equal(replaceExperience({ id: '9', startTime: 150, duration: null, uri: 'x' }), null);
});

// ---------------------------------------------------------------------------
// createSignalling, with a fake dash.js, element and network
// ---------------------------------------------------------------------------

/** A dash.js MediaPlayer as far as the layer touches one, its element, and a fetch that answers the fixtures. */
function harness({ mpd = MPD, slots = { 'slots-two.json': SLOTS_TWO, 'slots-post.json': SLOTS_POST } } = {}) {
  const listeners = {};
  const video = {
    currentTime: 0, duration: 200, buffered: { length: 0 },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    fire(type) { for (const fn of listeners[type] || []) fn(); }
  };
  const asked = [];
  const fetch = mock.method(globalThis, 'fetch', async (url) => {
    asked.push(url);
    const name = Object.keys(slots).find((key) => new URL(url).pathname.endsWith(key));
    if (!name) return { json: async () => { throw new Error(`404 ${url}`); } };
    return { json: async () => structuredClone(slots[name]) };
  });
  let interceptor = null;
  const player = { addResponseInterceptor(fn) { interceptor = fn; } };
  const resolved = [];
  const signalling = createSignalling(player, video, {
    capabilities: { concurrentVideo: 2, concurrentImage: true },
    onResolved: (experiences, selection) => resolved.push({ experiences, selection }),
    parseMpd: () => structuredClone(mpd)
  });
  const load = () => interceptor({ data: '<MPD type="static"></MPD>', request: { url: BASE } });
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
  const at = async (time, type = 'timeupdate') => { video.currentTime = time; video.fire(type); await settle(); await settle(); };
  return { video, asked, signalling, resolved, load, settle, at, restore: () => fetch.mock.restore() };
}

test('at load: every break on the bar, and the slots of the pre-roll and of what starts within 60 s asked for', async () => {
  const h = harness();
  try {
    assert.equal(h.signalling.programRanges().settled, false, 'nothing is final before the MPD');
    await h.load();
    await h.settle(); await h.settle();
    // The pre-roll's, relative to the MPD; and break 2's, at 45 s, which is
    // within 60 s of 0. Break 6, the post-roll, waits for the end.
    assert.deepEqual(h.asked, [
      'https://cdn.example/demo/content/primary/dash/slots-two.json?sgai-video-decoders=2&sgai-image-over-video=1',
      'https://cdn.example/signalling/slots-two.json?sgai-video-decoders=2&sgai-image-over-video=1'
    ]);
    const { ranges, settled } = h.signalling.programRanges();
    // As in HLS (ADR 0108): a break not due yet is on the list, provisional,
    // and not in flight, so the list is complete once nothing is in flight.
    assert.equal(settled, true);
    assert.deepEqual(ranges.map((r) => [r.id, r.kind, r.startTime, r.provisional ?? false]), [
      ['1', 'concurrent', 0, false], ['2', 'concurrent', 45, false], ['3', 'concurrent', 70, true],
      ['5', 'concurrent', 95, true], ['9', 'interstitial', 150, false]
    ]);
    assert.equal(h.resolved[0].selection.sent, true);
  } finally { h.restore(); }
});

test('a break\'s slots are asked for 60 s before it, with the capabilities, and resolved into its window', async () => {
  const h = harness();
  try {
    await h.load();
    await h.at(0); // break 2, at 45 s, is due from -15 s: due already
    assert.ok(h.asked.some((u) => u.startsWith('https://cdn.example/signalling/slots-two.json?sgai-video-decoders=2')));
    const two = h.signalling.experiences.filter((e) => e.id === '2');
    assert.deepEqual(two.map((e) => e.startTime), [45, 51]);
    assert.equal(h.signalling.activeAt(46).length, 1);
  } finally { h.restore(); }
});

test('a break further than 60 s ahead waits for the playhead', async () => {
  const late = structuredClone(MPD);
  late.periods[0].eventStreams[0].events[1].presentationTime = 90000; // break 2 at 90 s
  const h = harness({ mpd: late });
  try {
    await h.load();
    await h.at(29.9);
    assert.equal(h.asked.filter((u) => u.includes('/signalling/')).length, 0);
    await h.at(30);
    assert.equal(h.asked.filter((u) => u.includes('/signalling/')).length, 1);
  } finally { h.restore(); }
});

test('a ONCE break leaves for good once entered and left, and a seek back does not draw it', async () => {
  const h = harness();
  try {
    await h.load();
    await h.at(0);
    await h.at(46);
    assert.equal(h.signalling.activeAt(46).length, 1);
    await h.at(60, 'seeked');
    await h.at(46, 'seeked');
    assert.equal(h.signalling.activeAt(46).length, 0);
    assert.equal(h.signalling.programRanges().ranges.some((r) => r.id === '2'), false);
  } finally { h.restore(); }
});

test('the replace break is ONCE too when executeOnce says so', async () => {
  const h = harness();
  try {
    await h.load();
    await h.at(151);
    assert.deepEqual(h.signalling.activeAt(151).map((e) => e.id), ['9']);
    await h.at(170, 'seeked');
    await h.at(151, 'seeked');
    assert.deepEqual(h.signalling.activeAt(151).map((e) => e.id), []);
  } finally { h.restore(); }
});

test('the post-roll waits for the end, and plays only its linear default, after the programme', async () => {
  const h = harness();
  try {
    await h.load();
    assert.deepEqual(h.signalling.postRolls().map((p) => [p.id, p.state, p.startTime]), [['6', 'waiting', 200]]);
    assert.equal(h.asked.some((u) => u.includes('slots-post')), false);
    h.video.fire('ended');
    await h.settle(); await h.settle();
    const [post] = h.signalling.postRolls();
    assert.equal(post.state, 'resolved');
    assert.deepEqual(post.experiences.map((e) => [e.type, e.startTime, e.duration]), [['linear', 200, 12]]);
  } finally { h.restore(); }
});

test('slots that cannot be had cancel the break, and nothing else', async () => {
  const h = harness({ slots: { 'slots-post.json': SLOTS_POST } });
  const error = mock.method(console, 'error', () => {});
  try {
    await h.load();
    await h.at(0);
    assert.equal(h.signalling.experiences.some((e) => e.id === '1' || e.id === '2'), false);
    const ids = h.signalling.programRanges().ranges.map((r) => r.id);
    assert.equal(ids.includes('1') || ids.includes('2'), false, 'their provisional ranges leave the bar');
    assert.ok(ids.includes('3'));
  } finally { error.mock.restore(); h.restore(); }
});

test('a dynamic MPD is not read: no break, and the list is final', async () => {
  const h = harness({ mpd: { ...MPD, type: 'dynamic' } });
  const warn = mock.method(console, 'warn', () => {});
  try {
    await h.load();
    assert.deepEqual(h.signalling.programRanges(), { ranges: [], settled: true });
  } finally { warn.mock.restore(); h.restore(); }
});

test('only the scheme of SVTA2053 §5 is read', () => {
  assert.equal(SVTA_SCHEME, 'urn:svta:advertising-wg:ad-creative-signaling');
  const other = structuredClone(MPD);
  other.periods[0].eventStreams[0].schemeIdUri = 'urn:svta:advertising-wg:ad-id-signaling';
  assert.equal(breaksOfMpd(other, BASE).breaks.some((b) => b.id === '2'), false);
});
