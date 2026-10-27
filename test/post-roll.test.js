// post-roll.test.js -- the tests of ADR 0111: a Date Range with CUE="POST".
//
// What they are for: a post-roll of the concurrent or multi-view class is
// NEVER drawn as a non-linear ad -- after the end there is no programme to draw
// over. Its asset-list is asked for when hls.js asks for a post-roll's, when
// the programme is buffered to its end (BUFFERED_TO_END), and only on a
// playlist that has ended; what plays is every asset's linear default, after
// the programme, one after the other; an asset without one is skipped. None of
// that is visible in a single frame -- a post-roll drawn over the last seconds,
// a list asked for at load, a banner shown over a black frame -- so it is
// asserted here: the pure functions, the signalling layer over a fake player
// instance, and the presenter over a fake document.
//
// Live is simulated: there is no live primary in this repository.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import { LINEAR_TYPE } from '../lib/experience.js';
import {
  BLOCK, createSignalling, postRollDue, programEnd, resolvePostRoll
} from '../hls/signalling.js';
import { createPostRoll, postRollPending, postRollQueue } from '../lib/postroll.js';

const BANNER = {
  type: 'lowerThirdOverlay',
  layout: { assets: [{ id: 'banner', type: 'image/svg+xml', uri: '/banner.svg', viewport: '70 6.25 12.5 6.25', zDepth: 1 }] }
};
const slot = (extra = {}) => ({
  ...extra, DURATION: 12,
  [BLOCK]: { version: 2, type: 'slot', payload: [{ start: 0, duration: 12, identifiers: [{ scheme: 'ad-id.org', value: 'X' }], layoutOptions: [BANNER] }] }
});

// ---------------------------------------------------------------------------
// The pure functions
// ---------------------------------------------------------------------------

test('a post-roll goes at the end of the programme: details.edge on a VOD, nowhere on live', () => {
  assert.equal(programEnd({ live: false, edge: 198 }), 198);
  assert.equal(programEnd({ live: false, fragments: [{ start: 0 }], totalduration: 120 }), 120);
  assert.equal(programEnd({ live: true, edge: 3700 }), null, 'Infinity in hls.js: no end until ENDLIST');
  assert.equal(programEnd(null), null);
});

test('a post-roll\'s list is due when the playlist has ended and the programme is buffered to its end', () => {
  assert.equal(postRollDue({ sourceClosed: true, bufferedToEnd: true }), true);
  assert.equal(postRollDue({ sourceClosed: true, bufferedToEnd: false }), false, 'not at load');
  assert.equal(postRollDue({ sourceClosed: false, bufferedToEnd: true }), false, 'not on a live playlist');
});

test('a post-roll plays the linear default of an asset that carries a layout block, never the block', () => {
  const report = [];
  const [ad] = resolvePostRoll({ ASSETS: [slot({ URI: '/linear.m3u8' })] }, { id: 'POST', slotStart: 198, report });
  assert.equal(ad.type, LINEAR_TYPE);
  assert.equal(ad.startTime, 198);
  assert.equal(ad.duration, 12);
  assert.deepEqual(ad.elements.filter((e) => !e.primary).map((e) => e.uri), ['/linear.m3u8']);
  assert.deepEqual(ad.identifiers, [{ scheme: 'ad-id.org', value: 'X' }]);
  assert.equal(report[0].outcome, 'default');
});

test('a post-roll with only a non-linear ad is skipped', () => {
  const report = [];
  const { warn } = console;
  console.warn = () => {};
  try {
    assert.deepEqual(resolvePostRoll({ ASSETS: [slot()] }, { id: 'POST', slotStart: 198, report }), []);
  } finally { console.warn = warn; }
  assert.equal(report[0].outcome, 'skipped');
});

test('a bare linear asset plays, and a skipped asset keeps the ones after it in their place', () => {
  const { warn } = console;
  console.warn = () => {};
  let ads;
  try {
    ads = resolvePostRoll({ ASSETS: [slot(), { URI: '/two.m3u8', DURATION: 8 }] }, { id: 'POST', slotStart: 100 });
  } finally { console.warn = warn; }
  assert.equal(ads.length, 1);
  assert.equal(ads[0].startTime, 112);
  assert.equal(ads[0].duration, 8);
});

test('the queue is every resolved post-roll\'s ads, in order, and the end waits while a list is on its way', () => {
  const a = { id: 'A' }, b = { id: 'B' }, c = { id: 'C' };
  const rolls = [
    { state: 'resolved', experiences: [a, b] },
    { state: 'failed', experiences: [] },
    { state: 'resolved', experiences: [c] }
  ];
  assert.deepEqual(postRollQueue(rolls), [a, b, c]);
  assert.equal(postRollPending(rolls), false);
  assert.equal(postRollPending([...rolls, { state: 'requested' }]), true);
  assert.equal(postRollPending([{ state: 'waiting' }]), true);
});

// ---------------------------------------------------------------------------
// The signalling layer over a fake player instance
// ---------------------------------------------------------------------------

const EVENTS = {
  LEVEL_UPDATED: 'levelUpdated', MEDIA_ATTACHED: 'mediaAttached', BUFFER_APPENDED: 'bufferAppended',
  BUFFERED_TO_END: 'bufferedToEnd'
};
const flush = () => new Promise((r) => setTimeout(r, 0));

function fakeMedia() {
  const listeners = {};
  return {
    currentTime: 0,
    buffered: { length: 0, start: () => 0, end: () => 0 },
    addEventListener: (type, fn) => { (listeners[type] ??= []).push(fn); },
    fire: (type) => (listeners[type] ?? []).forEach((fn) => fn())
  };
}

function withSignalling(list) {
  const handlers = {};
  globalThis.Hls = { Events: EVENTS };
  const media = fakeMedia();
  const hls = { on: (event, fn) => { handlers[event] = fn; }, media, startPosition: -1, liveSyncPosition: null };
  const asked = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => { asked.push(String(url)); return { text: async () => JSON.stringify(list) }; };
  const { log, warn } = console;
  console.log = () => {};
  console.warn = () => {};
  const resolved = [];
  const provider = createSignalling(hls, { onResolved: (experiences, selection) => resolved.push({ experiences, selection }) });
  const update = (dateRanges, { live = false } = {}) => handlers.levelUpdated(null, { details: {
    url: 'https://example.test/primary.m3u8', live, edge: 198, targetduration: 6,
    fragments: [{ start: 0, programDateTime: 0 }], dateRanges
  } });
  const restore = () => { globalThis.fetch = realFetch; console.log = log; console.warn = warn; };
  return { handlers, media, provider, asked, resolved, update, restore };
}

const POST = {
  'AD-POST-CONCURRENT': {
    class: 'com.qualabs.hls.concurrentInterstitial', startDate: new Date(186000), duration: 12,
    attr: { CUE: 'POST', 'X-ASSET-LIST': '/post.json' }
  }
};

test('VOD: a post-roll is not asked for at load, is not on the bar, and is never active over the programme', async () => {
  const { provider, asked, update, restore } = withSignalling({ ASSETS: [slot({ URI: '/linear.m3u8' })] });
  try {
    update(POST);
    await flush();
    assert.deepEqual(asked, []);
    assert.deepEqual(provider.programRanges().ranges, []);
    assert.deepEqual(provider.activeAt(190), [], 'not at its START-DATE');
    assert.deepEqual(provider.postRolls(), [
      { id: 'AD-POST-CONCURRENT', kind: 'concurrent', once: false, state: 'waiting', startTime: 198, experiences: [] }
    ]);
  } finally { restore(); }
});

test('VOD: buffered to the end, its list is asked for once, and only its linear default is kept', async () => {
  const { handlers, provider, asked, resolved, update, restore } = withSignalling({ ASSETS: [slot({ URI: '/linear.m3u8' })] });
  try {
    update(POST);
    handlers.bufferedToEnd();
    handlers.bufferedToEnd();
    await flush();
    assert.deepEqual(asked, ['https://example.test/post.json']);
    const [roll] = provider.postRolls();
    assert.equal(roll.state, 'resolved');
    assert.deepEqual(roll.experiences.map((e) => [e.type, e.startTime, e.duration]), [['linear', 198, 12]]);
    assert.deepEqual(provider.activeAt(198), [], 'played by its own clock, not by the programme\'s');
    assert.equal(resolved[0].selection.postroll, true);
    assert.equal(provider.programRanges().settled, true);
  } finally { restore(); }
});

test('VOD: the programme ending counts as buffered to its end', async () => {
  const { media, asked, update, restore } = withSignalling({ ASSETS: [slot({ URI: '/linear.m3u8' })] });
  try {
    update(POST);
    media.fire('ended');
    assert.deepEqual(asked, ['https://example.test/post.json']);
  } finally { restore(); }
});

test('VOD: with only a non-linear ad, the post-roll resolves to nothing', async () => {
  const { handlers, provider, update, restore } = withSignalling({ ASSETS: [slot()] });
  try {
    update(POST);
    handlers.bufferedToEnd();
    await flush();
    assert.deepEqual(provider.postRolls()[0].experiences, []);
    assert.deepEqual(postRollQueue(provider.postRolls()), []);
  } finally { restore(); }
});

test('live: a post-roll has no place and is not asked for until the playlist ends', async () => {
  const { media, provider, asked, update, restore } = withSignalling({ ASSETS: [slot({ URI: '/linear.m3u8' })] });
  try {
    update(POST, { live: true });
    media.fire('ended');
    assert.deepEqual(asked, []);
    assert.equal(provider.postRolls()[0].startTime, null);
    // The playlist carries its ENDLIST: now it has an end, and the end is due.
    update(POST, { live: false });
    assert.equal(provider.postRolls()[0].startTime, 198);
    assert.deepEqual(asked, ['https://example.test/post.json']);
  } finally { restore(); }
});

test('an Apple-class post-roll, reported off its tag, is placed at the end and marked', () => {
  const { provider, update, restore } = withSignalling({});
  try {
    update({ 'AD-POST-LINEAR': { class: 'com.apple.hls.interstitial', startDate: new Date(186000), duration: 12, attr: { CUE: 'POST' } } });
    assert.deepEqual(provider.programRanges().ranges,
      [{ id: 'AD-POST-LINEAR', kind: 'interstitial', startTime: 198, duration: 12, postroll: true }]);
    assert.deepEqual(provider.postRolls(), [], 'nothing on this side plays it');
  } finally { restore(); }
});

// ---------------------------------------------------------------------------
// The presenter over a fake document
// ---------------------------------------------------------------------------

function fakeNode() {
  const listeners = {};
  return {
    style: {}, dataset: {}, muted: false, currentTime: 0, removed: false,
    addEventListener: (type, fn) => { (listeners[type] ??= []).push(fn); },
    fire(type) { (listeners[type] ?? []).forEach((fn) => fn()); },
    play() { return Promise.resolve(); },
    remove() { this.removed = true; }
  };
}

function withPresenter(rolls, { fail = [] } = {}) {
  const nodes = [];
  globalThis.document = { createElement: () => { const n = fakeNode(); nodes.push(n); return n; } };
  const layer = { children: [], appendChild(n) { this.children.push(n); } };
  const video = fakeNode();
  const attached = [];
  const attachAsset = (node, { uri, onLoaded, onFailed }) => {
    attached.push(uri);
    if (fail.includes(uri)) onFailed('HTTP 404'); else onLoaded();
    return () => {};
  };
  const presented = [];
  const tracked = [];
  const { log, warn } = console;
  console.log = () => {};
  console.warn = () => {};
  const handle = createPostRoll({
    provider: { postRolls: () => rolls }, video, layer, attachAsset,
    onPresented: (m) => presented.push(m), onTracking: (e) => tracked.push(e)
  });
  const restore = () => { console.log = log; console.warn = warn; delete globalThis.document; };
  return { handle, video, nodes, attached, presented, tracked, restore };
}

const ads = () => resolvePostRoll({ ASSETS: [{ URI: '/one.m3u8', DURATION: 12 }, { URI: '/two.m3u8', DURATION: 8 }] },
  { id: 'POST', slotStart: 198 });

test('the presenter plays the linear ads after the programme ends, one after the other, and reports them', async () => {
  const { handle, video, nodes, attached, presented, tracked, restore } = withPresenter([{ state: 'resolved', experiences: ads() }]);
  try {
    assert.equal(handle.playing, false);
    video.fire('ended');
    await flush();
    assert.deepEqual(attached, ['/one.m3u8']);
    assert.equal(handle.playing, true);
    const first = nodes[nodes.length - 1];
    first.fire('playing');
    first.currentTime = 12;
    first.fire('ended');
    assert.equal(first.removed, true);
    assert.deepEqual(attached, ['/one.m3u8', '/two.m3u8']);
    nodes[nodes.length - 1].fire('ended');
    assert.equal(handle.playing, false);
    assert.deepEqual(presented.map((m) => [m.itemId, m.outcome, m.postroll]),
      [['POST.0', 'presented', true], ['POST.1', 'presented', true]]);
    assert.deepEqual(tracked.map((e) => [e.type, e.itemId, e.time]), [['slotStart', 'POST.0', 198], ['slotEnd', 'POST.0', 210]]);
  } finally { restore(); }
});

test('the presenter skips an ad whose first load fails and goes on to the next', async () => {
  const { video, attached, presented, restore } = withPresenter([{ state: 'resolved', experiences: ads() }], { fail: ['/one.m3u8'] });
  try {
    video.fire('ended');
    await flush();
    assert.deepEqual(attached, ['/one.m3u8', '/two.m3u8']);
    assert.deepEqual(presented.map((m) => m.outcome), ['skipped', 'presented']);
    // The skip says which default failed and why, as the renderer's does.
    assert.equal(presented[0].presented, null);
    assert.deepEqual(presented[0].attempts.map((a) => [a.index, a.linear, a.uri, a.reason]),
      [[null, true, '/one.m3u8', 'failed to load /one.m3u8 (HTTP 404)']]);
  } finally { restore(); }
});

test('the presenter reports every default that fails, once each, and plays nothing', async () => {
  const { handle, video, presented, restore } = withPresenter([{ state: 'resolved', experiences: ads() }],
    { fail: ['/one.m3u8', '/two.m3u8'] });
  try {
    video.fire('ended');
    await flush();
    assert.equal(handle.playing, false);
    assert.deepEqual(presented.map((m) => [m.itemId, m.outcome, m.presented, m.attempts.length]),
      [['POST.0', 'skipped', null, 1], ['POST.1', 'skipped', null, 1]]);
  } finally { restore(); }
});

test('going back into the programme takes the post-roll off', async () => {
  const { handle, video, nodes, tracked, restore } = withPresenter([{ state: 'resolved', experiences: ads() }]);
  try {
    video.fire('ended');
    await flush();
    nodes[nodes.length - 1].fire('playing');
    video.fire('seeking');
    assert.equal(handle.playing, false);
    assert.equal(nodes[nodes.length - 1].removed, true);
    assert.deepEqual(tracked.map((e) => e.type), ['slotStart', 'slotEnd']);
  } finally { restore(); }
});

test('nothing resolved, nothing plays', async () => {
  const { handle, video, attached, restore } = withPresenter([{ state: 'resolved', experiences: [] }]);
  try {
    video.fire('ended');
    await flush();
    assert.deepEqual(attached, []);
    assert.equal(handle.playing, false);
  } finally { restore(); }
});
