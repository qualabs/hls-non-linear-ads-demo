// asset-list-timing.test.js -- the tests of ADR 0108.
//
// What they are for: WHEN a break's asset-list is requested. It is on demand,
// always (ADR 0109 removed the option to ask for every list up front), with the
// rule hls.js 1.7.2 applies to the X-ASSET-LIST of an
// interstitial: when the programme is buffered up to the start of the break,
// or when it is played or sought into it. Asked too late, the ad is not ready
// at its window; asked for a break already behind, it is a request for an ad
// nobody will see; and either one fails without anything on screen saying so.
//
// The last addition, also of 2026-10-22: a preroll on a LIVE playlist sits at
// the live join point, as hls.js's `getLiveStartPos` computes it, and one first
// seen after playback joined is not presented (ADR 0110, dated note). No live
// primary exists in this repository, so the live inputs are simulated: a fake
// instance with `liveSyncPosition` and playlist updates with `live: true`.
//
// Two additions of 2026-10-22: the forward buffer steps over a hole smaller
// than hls.js's maxBufferHole, so a page paused at 0 over a buffer that starts
// at 0.067 s still asks for the first break (ADR 0109, dated note); and a
// preroll, `CUE="PRE"`, is asked for at load and sits where playback begins,
// as hls.js does with an interstitial (ADR 0110).
//
// The rule is a pure function, and so is where the forward buffer ends. The
// last tests drive the signalling layer over a fake player instance and a fake
// media element, to show the rule wired: nothing is asked for until it is due,
// the range of the break is on the list before that, provisional, and it is
// replaced by the resolved one.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assetListDue,
  BUFFER_HOLE_TOLERANCE,
  bufferedEndAt,
  createSignalling,
  cueOf,
  liveStartPosition,
  preRollPlacement,
  preRollStart,
  provisionalRange
} from '../lib/signalling.js';

const BREAK = { startTime: 60, duration: 12 };

test('not due while the programme and its buffer are short of the break', () => {
  assert.equal(assetListDue(BREAK, { time: 10, bufferedEnd: 40 }), false);
});

test('due when the forward buffer reaches the start of the break', () => {
  assert.equal(assetListDue(BREAK, { time: 35, bufferedEnd: 60 }), true);
  assert.equal(assetListDue(BREAK, { time: 35, bufferedEnd: 65 }), true);
  assert.equal(assetListDue(BREAK, { time: 35, bufferedEnd: 59.9 }), false);
});

test('due when the programme is played or sought into the break, with nothing buffered', () => {
  assert.equal(assetListDue(BREAK, { time: 60, bufferedEnd: 60 }), true);
  assert.equal(assetListDue(BREAK, { time: 66, bufferedEnd: NaN }), true);
});

test('not due once the break is over: a seek past it does not ask for it', () => {
  assert.equal(assetListDue(BREAK, { time: 72, bufferedEnd: 100 }), false);
  assert.equal(assetListDue(BREAK, { time: 200, bufferedEnd: 230 }), false);
});

test('a break whose tag declares no length is due whenever the buffer reaches its start', () => {
  assert.equal(assetListDue({ startTime: 60, duration: null }, { time: 500, bufferedEnd: 500 }), true);
  assert.equal(assetListDue({ startTime: 60, duration: null }, { time: 10, bufferedEnd: 30 }), false);
});

test('no time, nothing due: before the media is there nothing is asked for', () => {
  assert.equal(assetListDue(BREAK, { time: NaN, bufferedEnd: 100 }), false);
});

test('the forward buffer ends where the range around the playhead ends, and no big hole is jumped', () => {
  const ranges = [[0, 30], [45, 70]];
  assert.equal(bufferedEndAt(ranges, 10), 30);
  assert.equal(bufferedEndAt(ranges, 50), 70);
  // In a hole the buffer ends at the playhead.
  assert.equal(bufferedEndAt(ranges, 40), 40);
  assert.equal(bufferedEndAt([], 5), 5);
});

test('the tolerance is hls.js\'s default maxBufferHole, 0.1 s', () => {
  assert.equal(BUFFER_HOLE_TOLERANCE, 0.1);
});

test('paused at 0 with the first range starting at 0.067 s, the buffer counts as ahead of the playhead', () => {
  // The case of ADR 0109: the first presentation timestamp of the programme.
  assert.equal(bufferedEndAt([[0.067, 31.2]], 0), 31.2);
  // And the break at 14 s is due before anybody presses play.
  assert.equal(assetListDue({ startTime: 14, duration: 12 },
    { time: 0, bufferedEnd: bufferedEndAt([[0.067, 31.2]], 0) }), true);
});

test('a hole at or above the tolerance is not stepped over, ahead of the playhead or between ranges', () => {
  assert.equal(bufferedEndAt([[0.1, 30]], 0), 30, 'exactly the tolerance still counts, as pos + maxHole >= start');
  assert.equal(bufferedEndAt([[0.25, 30]], 0), 0);
  assert.equal(bufferedEndAt([[0, 30], [30.05, 60]], 10), 60, 'a small hole between ranges is merged');
  assert.equal(bufferedEndAt([[0, 30], [30.5, 60]], 10), 30, 'a big one is not');
  assert.equal(bufferedEndAt([[0.067, 30]], 0, 0), 0, 'with no tolerance, the old behaviour');
});

test('bufferedEndAt reads unsorted ranges and does not touch them', () => {
  const ranges = [[30.05, 60], [0, 30]];
  assert.equal(bufferedEndAt(ranges, 10), 60);
  assert.deepEqual(ranges, [[30.05, 60], [0, 30]]);
});

// ---------------------------------------------------------------------------
// CUE="PRE" (ADR 0110)
// ---------------------------------------------------------------------------

test('the CUE of a Date Range is read as hls.js reads it, parsed or off attr, and X-CUE as a fallback', () => {
  assert.deepEqual(cueOf({ cue: { pre: true, post: false, once: false } }), { pre: true, post: false, once: false });
  assert.deepEqual(cueOf({ attr: { CUE: 'PRE' } }), { pre: true, post: false, once: false });
  assert.deepEqual(cueOf({ attr: { CUE: 'POST,ONCE' } }), { pre: false, post: true, once: true });
  assert.deepEqual(cueOf({ attr: { 'X-CUE': 'pre once' } }), { pre: true, post: false, once: true });
  assert.deepEqual(cueOf({ attr: {} }), { pre: false, post: false, once: false });
  assert.deepEqual(cueOf(null), { pre: false, post: false, once: false });
});

test('a preroll sits where playback begins: startPosition when set, 0 otherwise', () => {
  assert.equal(preRollStart(-1), 0);
  assert.equal(preRollStart(undefined), 0);
  assert.equal(preRollStart(0), 0);
  assert.equal(preRollStart(30), 30);
});

test('a preroll is due at once: nothing buffered, paused at 0, or with no clock at all', () => {
  const PRE = { startTime: 0, duration: 12, pre: true };
  assert.equal(assetListDue(PRE, { time: 0, bufferedEnd: 0 }), true);
  assert.equal(assetListDue(PRE, { time: NaN, bufferedEnd: NaN }), true);
  // Without the flag, the same window at 0 waits for the buffer like any break.
  assert.equal(assetListDue({ startTime: 0.5, duration: 12 }, { time: 0, bufferedEnd: 0 }), false);
});

test('a break is on the list before its list is read, provisional, off its tag', () => {
  assert.deepEqual(provisionalRange('X', { duration: 12 }, 60, 'concurrent'),
    { id: 'X', kind: 'concurrent', startTime: 60, duration: 12, provisional: true });
  assert.deepEqual(provisionalRange('X', { plannedDuration: 9 }, 60, 'multiview').duration, 9);
  assert.equal(provisionalRange('X', {}, 60, 'concurrent'), null);
});

// ---------------------------------------------------------------------------
// The rule wired into the signalling layer
// ---------------------------------------------------------------------------

/** A fake media element: a clock, a buffer, and the three events the layer listens to. */
function fakeMedia() {
  const listeners = {};
  const media = {
    currentTime: 0,
    ranges: [[0, 20]],
    get buffered() {
      const r = this.ranges;
      return { length: r.length, start: (i) => r[i][0], end: (i) => r[i][1] };
    },
    addEventListener: (type, fn) => { (listeners[type] ??= []).push(fn); },
    fire: (type) => (listeners[type] ?? []).forEach((fn) => fn())
  };
  return media;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

async function onDemand({ dateRanges = null, startPosition = -1, ranges = [[0, 20]] } = {}) {
  const handlers = {};
  globalThis.Hls = { Events: { LEVEL_UPDATED: 'levelUpdated', MEDIA_ATTACHED: 'mediaAttached', BUFFER_APPENDED: 'bufferAppended' } };
  const media = fakeMedia();
  media.ranges = ranges;
  const hls = { on: (event, fn) => { handlers[event] = fn; }, media, startPosition };
  const asked = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    asked.push(String(url));
    return { json: async () => ({ ASSETS: [{ URI: '/linear.m3u8', DURATION: 10 }] }) };
  };
  const { log } = console;
  console.log = () => {};
  const provider = createSignalling(hls, {});
  await handlers.levelUpdated(null, { details: {
    url: 'https://example.test/primary.m3u8',
    live: false,
    fragments: [{ start: 0, programDateTime: 0 }],
    dateRanges: dateRanges ?? { 'AD-A-CONCURRENT': { class: 'com.qualabs.hls.concurrentInterstitial', startDate: new Date(60000), duration: 10, attr: { 'X-ASSET-LIST': '/list.json' } } }
  } });
  const restore = () => { globalThis.fetch = realFetch; console.log = log; };
  return { provider, media, asked, restore };
}

test('on demand: nothing is asked for until the buffer reaches the break, and the range is there from the start', async () => {
  const { provider, media, asked, restore } = await onDemand();
  try {
    assert.deepEqual(asked, []);
    const before = provider.programRanges();
    assert.equal(before.settled, true);
    assert.deepEqual(before.ranges, [{ id: 'AD-A-CONCURRENT', kind: 'concurrent', startTime: 60, duration: 10, provisional: true }]);
    assert.deepEqual(provider.activeAt(61), []);

    // Playing on, with a buffer that still stops short of the break.
    media.currentTime = 10;
    media.ranges = [[0, 45]];
    media.fire('timeupdate');
    assert.deepEqual(asked, []);

    // The buffer reaches the break: its list is asked for, once.
    media.ranges = [[0, 62]];
    media.fire('progress');
    media.fire('timeupdate');
    assert.deepEqual(asked, ['https://example.test/list.json']);
    await flush();
    const after = provider.programRanges();
    assert.deepEqual(after.ranges, [{ id: 'AD-A-CONCURRENT', kind: 'concurrent', startTime: 60, duration: 10 }]);
    assert.equal(provider.activeAt(61).length, 1);
  } finally { restore(); }
});

test('on demand: a seek into the break asks for its list right there', async () => {
  const { media, asked, restore } = await onDemand();
  try {
    media.currentTime = 65;
    media.ranges = [];
    media.fire('seeking');
    assert.deepEqual(asked, ['https://example.test/list.json']);
  } finally { restore(); }
});

test('on demand: a seek past the break does not ask for it', async () => {
  const { media, asked, restore } = await onDemand();
  try {
    media.currentTime = 90;
    media.ranges = [[90, 120]];
    media.fire('seeking');
    assert.deepEqual(asked, []);
  } finally { restore(); }
});

test('on demand: paused at 0 with the buffer starting at 0.067 s, the first break inside it is asked for before play', async () => {
  const dateRanges = { 'AD-A-CONCURRENT': { class: 'com.qualabs.hls.concurrentInterstitial', startDate: new Date(14000), duration: 10, attr: { 'X-ASSET-LIST': '/list.json' } } };
  const { asked, restore } = await onDemand({ dateRanges, ranges: [[0.067, 31.2]] });
  try {
    assert.deepEqual(asked, ['https://example.test/list.json']);
  } finally { restore(); }
});

/** A preroll of each resolved class, dated in the middle of the programme on purpose: CUE wins over START-DATE. */
const PREROLLS = {
  'AD-PRE-CONCURRENT': { class: 'com.qualabs.hls.concurrentInterstitial', startDate: new Date(90000), duration: 10, attr: { CUE: 'PRE', 'X-ASSET-LIST': '/pre.json' } },
  'AD-A-CONCURRENT': { class: 'com.qualabs.hls.concurrentInterstitial', startDate: new Date(60000), duration: 10, attr: { 'X-ASSET-LIST': '/list.json' } }
};

test('a preroll\'s list is asked for at load, with nothing buffered, and the break at 60 s still waits', async () => {
  const { provider, asked, restore } = await onDemand({ dateRanges: PREROLLS, ranges: [] });
  try {
    assert.deepEqual(asked, ['https://example.test/pre.json']);
    await flush();
    const ranges = provider.programRanges().ranges;
    assert.deepEqual(ranges.find((r) => r.id === 'AD-PRE-CONCURRENT'),
      { id: 'AD-PRE-CONCURRENT', kind: 'concurrent', startTime: 0, duration: 10 });
    assert.equal(ranges.find((r) => r.id === 'AD-A-CONCURRENT').provisional, true);
    assert.deepEqual(provider.activeAt(5).map((e) => e.id.split('.')[0]), ['AD-PRE-CONCURRENT']);
    assert.deepEqual(provider.activeAt(91), []);
  } finally { restore(); }
});

test('a preroll is placed where playback begins when the player was told a startPosition', async () => {
  const { provider, restore } = await onDemand({ dateRanges: PREROLLS, ranges: [], startPosition: 30 });
  try {
    await flush();
    const pre = provider.programRanges().ranges.find((r) => r.id === 'AD-PRE-CONCURRENT');
    assert.equal(pre.startTime, 30);
  } finally { restore(); }
});

test('a multiview preroll is asked for at load too', async () => {
  const dateRanges = { 'MV-PRE': { class: 'com.qualabs.hls.multiViewInterstitial', startDate: new Date(90000), duration: 10, attr: { CUE: 'PRE', 'X-ASSET-LIST': '/offer.json' } } };
  const { provider, asked, restore } = await onDemand({ dateRanges, ranges: [] });
  try {
    assert.deepEqual(asked, ['https://example.test/offer.json']);
    assert.equal(provider.programRanges().ranges[0].startTime, 0);
  } finally { restore(); }
});

// ---------------------------------------------------------------------------
// CUE="PRE" on a LIVE playlist (ADR 0110, note of 2026-10-22). Simulated: there
// is no live primary in this repository.
// ---------------------------------------------------------------------------

test('the live join point is hls.js\'s getLiveStartPos: the sync position when startPosition is unset', () => {
  assert.equal(liveStartPosition({ startPosition: -1, liveSyncPosition: 3600, targetDuration: 6 }), 3600);
  assert.equal(liveStartPosition({ startPosition: undefined, liveSyncPosition: 3600, targetDuration: 6 }), 3600);
});

test('the live join point: a startPosition within three target durations of the sync position is the sync position', () => {
  // 3600 - 3590 = 10 < 18: joined at the sync position, as hls.js does.
  assert.equal(liveStartPosition({ startPosition: 3590, liveSyncPosition: 3600, targetDuration: 6 }), 3600);
  // A startPosition AHEAD of the sync position is too (a negative distance is below the limit).
  assert.equal(liveStartPosition({ startPosition: 3700, liveSyncPosition: 3600, targetDuration: 6 }), 3600);
});

test('the live join point: a startPosition further behind than that is kept (DVR start)', () => {
  assert.equal(liveStartPosition({ startPosition: 3500, liveSyncPosition: 3600, targetDuration: 6 }), 3500);
  // Without a target duration hls.js takes 10 s, so the limit is 30 s.
  assert.equal(liveStartPosition({ startPosition: 3575, liveSyncPosition: 3600 }), 3600);
  assert.equal(liveStartPosition({ startPosition: 3565, liveSyncPosition: 3600 }), 3565);
});

test('the live join point is unknown (null) while there is no sync position and no startPosition', () => {
  assert.equal(liveStartPosition({ startPosition: -1, liveSyncPosition: null, targetDuration: 6 }), null);
  // A sync position of exactly 0 is a known 0: a stream that has just begun.
  assert.equal(liveStartPosition({ startPosition: -1, liveSyncPosition: 0, targetDuration: 6 }), 0);
  // A startPosition given explicitly is usable without a sync position.
  assert.equal(liveStartPosition({ startPosition: 120, liveSyncPosition: null, targetDuration: 6 }), 120);
});

test('-1 is 0 on a VOD and the join point on a live playlist', () => {
  assert.equal(preRollStart(-1), 0);
  assert.equal(preRollStart(-1, { live: false, liveSyncPosition: 3600 }), 0);
  assert.equal(preRollStart(-1, { live: true, liveSyncPosition: 3600, targetDuration: 6 }), 3600);
});

test('a preroll is placed, waits for the join point, or is late', () => {
  assert.deepEqual(preRollPlacement({ startPosition: -1 }), { start: 0 });
  assert.deepEqual(preRollPlacement({ startPosition: 30 }), { start: 30 });
  assert.deepEqual(preRollPlacement({ startPosition: -1, live: true, liveSyncPosition: 3600, targetDuration: 6 }), { start: 3600 });
  assert.deepEqual(preRollPlacement({ startPosition: -1, live: true, liveSyncPosition: null }), { wait: true });
  assert.deepEqual(preRollPlacement({ startPosition: -1, live: true, liveSyncPosition: 3600, joined: true }), { late: true });
  assert.deepEqual(preRollPlacement({ startPosition: -1, joined: true }), { late: true });
});

/** The signalling layer over a fake LIVE instance: playlist updates are handed in one by one. */
function onLive({ liveSyncPosition = 3600, startPosition = -1 } = {}) {
  const handlers = {};
  globalThis.Hls = { Events: { LEVEL_UPDATED: 'levelUpdated', MEDIA_ATTACHED: 'mediaAttached', BUFFER_APPENDED: 'bufferAppended' } };
  const media = fakeMedia();
  media.ranges = [];
  const hls = { on: (event, fn) => { handlers[event] = fn; }, media, startPosition, liveSyncPosition };
  const asked = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    asked.push(String(url));
    return { json: async () => ({ ASSETS: [{ URI: '/linear.m3u8', DURATION: 10 }] }) };
  };
  const { log } = console;
  console.log = () => {};
  const provider = createSignalling(hls, {});
  // A live playlist: no ENDLIST, its first fragment at 3580 s of the stream's clock.
  const update = (dateRanges) => handlers.levelUpdated(null, { details: {
    url: 'https://example.test/live.m3u8', live: true, targetduration: 6,
    fragments: [{ start: 3580, programDateTime: 3580000 }], dateRanges
  } });
  const restore = () => { globalThis.fetch = realFetch; console.log = log; };
  return { hls, provider, asked, update, restore };
}

const LIVE_PRE = { 'AD-PRE-CONCURRENT': { class: 'com.qualabs.hls.concurrentInterstitial', startDate: new Date(3580000), duration: 10, attr: { CUE: 'PRE', 'X-ASSET-LIST': '/pre.json' } } };

test('live: a preroll is placed at the live join point, not at 0, and its list is asked for at load', async () => {
  const { provider, asked, update, restore } = onLive();
  try {
    update(LIVE_PRE);
    assert.deepEqual(asked, ['https://example.test/pre.json']);
    await flush();
    const pre = provider.programRanges().ranges.find((r) => r.id === 'AD-PRE-CONCURRENT');
    assert.equal(pre.startTime, 3600);
    assert.equal(provider.programRanges().settled, false, 'a live source is never closed');
    assert.deepEqual(provider.activeAt(3605).map((e) => e.id.split('.')[0]), ['AD-PRE-CONCURRENT']);
    assert.deepEqual(provider.activeAt(5), []);
  } finally { restore(); }
});

test('live: a startPosition far behind the edge (DVR) places the preroll there', async () => {
  const { provider, update, restore } = onLive({ startPosition: 3500 });
  try {
    update(LIVE_PRE);
    await flush();
    assert.equal(provider.programRanges().ranges[0].startTime, 3500);
  } finally { restore(); }
});

test('live: the reloads of the playlist do not ask for the preroll again, nor move it', async () => {
  const { hls, provider, asked, update, restore } = onLive();
  try {
    update(LIVE_PRE);
    await flush();
    hls.liveSyncPosition = 3606;
    update(LIVE_PRE);
    update(LIVE_PRE);
    await flush();
    assert.deepEqual(asked, ['https://example.test/pre.json']);
    assert.equal(provider.programRanges().ranges.length, 1);
    assert.equal(provider.programRanges().ranges[0].startTime, 3600);
  } finally { restore(); }
});

test('live: a preroll first seen on a reload after the join is not presented, as hls.js never steps back into one', async () => {
  const { provider, asked, update, restore } = onLive();
  try {
    update({});
    update(LIVE_PRE);
    await flush();
    assert.deepEqual(asked, []);
    assert.deepEqual(provider.programRanges().ranges, []);
  } finally { restore(); }
});

test('live: with no join point yet the preroll waits, and is placed and asked for on the next update', async () => {
  const { hls, provider, asked, update, restore } = onLive({ liveSyncPosition: null });
  try {
    update(LIVE_PRE);
    assert.deepEqual(asked, []);
    assert.deepEqual(provider.programRanges().ranges, []);
    hls.liveSyncPosition = 3600;
    update(LIVE_PRE);
    assert.deepEqual(asked, ['https://example.test/pre.json']);
    await flush();
    assert.equal(provider.programRanges().ranges[0].startTime, 3600);
  } finally { restore(); }
});

test('live: an Apple-class preroll, reported off its tag, is placed at the join point too', async () => {
  const { provider, update, restore } = onLive();
  try {
    update({ 'AD-PRE-LINEAR': { class: 'com.apple.hls.interstitial', startDate: new Date(3580000), duration: 10, attr: { CUE: 'PRE' } } });
    assert.deepEqual(provider.programRanges().ranges, [{ id: 'AD-PRE-LINEAR', kind: 'interstitial', startTime: 3600, duration: 10 }]);
  } finally { restore(); }
});
