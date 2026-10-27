// once.test.js -- the tests of ADR 0112: a Date Range with CUE="ONCE".
//
// What they are for: hls.js 1.7.2 takes a ONCE interstitial out of its schedule
// after it has played -- started, then left, at its end or by a seek out of
// it -- and it never comes back. Here the same break leaves the experiences and
// the ranges, so a seek back neither draws it again nor fires its tracking
// again, and the bar stops marking it. A seek OVER it never entered it, and it
// stays. Nothing in one frame says a break was drawn twice, or an impression
// counted twice, so it is asserted.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import { createSignalling } from '../hls/signalling.js';
import { onceProgress } from '../lib/playhead.js';
import { postRollQueue } from '../lib/postroll.js';
import { slotEvents } from '../lib/tracking.js';

const RANGE = { startTime: 60, duration: 10 };

test('a ONCE break is spent once it was entered and the programme is outside it', () => {
  assert.deepEqual(onceProgress(RANGE, false, 30), { entered: false, spent: false }, 'before it');
  assert.deepEqual(onceProgress(RANGE, false, 61), { entered: true, spent: false }, 'inside it');
  assert.deepEqual(onceProgress(RANGE, true, 70), { entered: true, spent: true }, 'played to its end');
  assert.deepEqual(onceProgress(RANGE, true, 20), { entered: true, spent: true }, 'sought back out of it');
  assert.deepEqual(onceProgress(RANGE, true, 65), { entered: true, spent: false }, 'still inside');
});

test('a seek over a ONCE break never entered it, so it stays', () => {
  assert.deepEqual(onceProgress(RANGE, false, 90), { entered: false, spent: false });
});

test('no range or no clock, nothing changes', () => {
  assert.deepEqual(onceProgress(null, true, 90), { entered: true, spent: false });
  assert.deepEqual(onceProgress(RANGE, true, NaN), { entered: true, spent: false });
});

test('a ONCE post-roll that has played is left out of the queue; one without ONCE is not', () => {
  const a = { id: 'P1' }, b = { id: 'P2' };
  const rolls = [
    { id: 'P1', once: true, state: 'resolved', experiences: [a] },
    { id: 'P2', once: false, state: 'resolved', experiences: [b] }
  ];
  assert.deepEqual(postRollQueue(rolls, new Set(['P1', 'P2'])), [b]);
  assert.deepEqual(postRollQueue(rolls), [a, b]);
});

// ---------------------------------------------------------------------------
// The signalling layer over a fake player instance
// ---------------------------------------------------------------------------

const flush = () => new Promise((r) => setTimeout(r, 0));

function withSignalling(dateRanges) {
  const handlers = {};
  const listeners = {};
  globalThis.Hls = { Events: { LEVEL_UPDATED: 'levelUpdated', MEDIA_ATTACHED: 'mediaAttached', BUFFER_APPENDED: 'bufferAppended' } };
  const media = {
    currentTime: 0,
    ranges: [[0, 20]],
    get buffered() { const r = this.ranges; return { length: r.length, start: (i) => r[i][0], end: (i) => r[i][1] }; },
    addEventListener: (type, fn) => { (listeners[type] ??= []).push(fn); },
    at(time, type = 'timeupdate') { this.currentTime = time; this.ranges = [[time, time + 30]]; (listeners[type] ?? []).forEach((fn) => fn()); }
  };
  const hls = { on: (event, fn) => { handlers[event] = fn; }, media, startPosition: -1 };
  const asked = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => { asked.push(String(url)); return { json: async () => ({ ASSETS: [{ URI: '/linear.m3u8', DURATION: 10 }] }) }; };
  const { log } = console;
  console.log = () => {};
  const provider = createSignalling(hls, {});
  handlers.levelUpdated(null, { details: {
    url: 'https://example.test/primary.m3u8', live: false, edge: 200,
    fragments: [{ start: 0, programDateTime: 0 }], dateRanges
  } });
  const restore = () => { globalThis.fetch = realFetch; console.log = log; };
  return { provider, media, asked, restore };
}

const tag = (id, cue) => ({
  [id]: { class: 'com.qualabs.hls.concurrentInterstitial', startDate: new Date(60000), duration: 10,
    attr: { ...(cue ? { CUE: cue } : {}), 'X-ASSET-LIST': `/${id}.json` } }
});

test('a ONCE break played to its end leaves the experiences and the bar, and a seek back does not draw it', async () => {
  const { provider, media, asked, restore } = withSignalling(tag('AD-ONCE', 'ONCE'));
  try {
    media.at(55);
    await flush();
    media.at(62);
    assert.equal(provider.activeAt(62).length, 1, 'drawn the first time');
    media.at(71);
    assert.deepEqual(provider.programRanges().ranges, [], 'off the bar');
    assert.deepEqual(provider.experiences, []);
    media.at(61, 'seeking');
    assert.deepEqual(provider.activeAt(61), [], 'a seek back does not draw it');
    assert.deepEqual(asked, ['https://example.test/AD-ONCE.json'], 'nor asks for it again');
  } finally { restore(); }
});

test('a ONCE break entered and sought out of is spent too: "played" is started, then left', async () => {
  const { provider, media, restore } = withSignalling(tag('AD-ONCE', 'ONCE'));
  try {
    media.at(55);
    await flush();
    media.at(63);
    media.at(20, 'seeking');
    assert.deepEqual(provider.programRanges().ranges, []);
    media.at(63, 'seeking');
    assert.deepEqual(provider.activeAt(63), []);
  } finally { restore(); }
});

test('a seek over a ONCE break leaves it where it was, and it plays when reached', async () => {
  const { provider, media, restore } = withSignalling(tag('AD-ONCE', 'ONCE'));
  try {
    media.at(90, 'seeking');
    assert.equal(provider.programRanges().ranges.length, 1);
    media.at(58, 'seeking');
    await flush();
    media.at(61);
    assert.equal(provider.activeAt(61).length, 1);
  } finally { restore(); }
});

test('a break without ONCE is drawn again on a seek back, as before', async () => {
  const { provider, media, restore } = withSignalling(tag('AD-AGAIN', null));
  try {
    media.at(55);
    await flush();
    media.at(62);
    media.at(71);
    media.at(61, 'seeking');
    assert.equal(provider.activeAt(61).length, 1);
  } finally { restore(); }
});

test('the tracking of a ONCE break fires once: its slotStart is not repeated on a seek back', async () => {
  const { provider, media, restore } = withSignalling(tag('AD-ONCE', 'ONCE'));
  try {
    media.at(55);
    await flush();
    let active = new Map();
    const events = [];
    const read = (time) => {
      const now = provider.activeAt(time);
      events.push(...slotEvents(active, now, time));
      active = new Map(now.map((e) => [e.itemId, e]));
    };
    for (const t of [61, 65]) { media.at(t); read(t); }
    media.at(71); read(71);
    media.at(61, 'seeking'); read(61);
    assert.deepEqual(events.map((e) => e.type), ['slotStart', 'slotEnd']);
  } finally { restore(); }
});
