// renderer-on-presented.test.js -- what the renderer REPORTS about its failover
// (ADR 0107), over a fake document.
//
// What they are for: `onPresented` is the one way an integrator learns which
// option of an ad was shown, and an ad it is never called for is invisible in
// every frame -- nothing on screen, and nothing said about why. The pure order
// of the failover is asserted in renderer-failover.test.js; these drive the
// renderer itself, with an `attachAsset` that fails the URIs it is told to, and
// assert that every path ends in exactly one report per ad: presented, or
// skipped with `presented: null` and every attempt that failed, with its reason.
//
// The path that once ended in silence is the last one of the chain: every
// option failed, the asset went to its linear default, and the default failed
// too. The skip was written into the state before it was reported, so the
// report no longer found the ads the default stood for.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import { BLOCK, resolveAssetList } from '../hls/signalling.js';
import { createRenderer } from '../lib/renderer.js';

const ID = 'AD-B-CONCURRENT';
const SLOT_START = 40;

const VIDEO = {
  type: 'squeezebackLShape',
  layout: {
    primaryContent: { zDepth: 1, viewport: '0 0 25 25' },
    assets: [{ id: 'ad', type: 'application/vnd.apple.mpegurl', uri: '/v.m3u8', viewport: '0 0 0 0', zDepth: 0 }]
  }
};
const IMAGE = {
  type: 'squeezebackDoubleBox',
  layout: {
    primaryContent: { zDepth: 0, viewport: '25 50 25 0' },
    assets: [{ id: 'ad', type: 'image/svg+xml', uri: '/i.svg', viewport: '25 0 25 50', zDepth: 1 }]
  }
};

/** A list of one asset: an item with two layoutOptions and, optionally, a linear default. */
function slotAsset({ withDefault = true, payload = null } = {}) {
  const asset = {
    DURATION: 12,
    [BLOCK]: { version: 2, type: 'slot', payload: payload ?? [{ start: 0, duration: 12, layoutOptions: [VIDEO, IMAGE] }] }
  };
  if (withDefault) asset.URI = '/linear.m3u8';
  return asset;
}

function resolve(assets) {
  const { log, warn } = console;
  console.log = () => {};
  console.warn = () => {};
  try {
    return resolveAssetList({ ASSETS: assets }, { id: ID, slotStart: SLOT_START });
  } finally { console.log = log; console.warn = warn; }
}

function fakeNode() {
  const listeners = {};
  return {
    style: {}, dataset: {}, muted: false, paused: true, currentTime: 0, volume: 1,
    videoWidth: 1920, videoHeight: 1080, offsetWidth: 0,
    addEventListener: (type, fn) => { (listeners[type] ??= []).push(fn); },
    play() { this.paused = false; return Promise.resolve(); },
    pause() { this.paused = true; },
    remove() { this.removed = true; },
    removeAttribute() {}
  };
}

/**
 * A renderer over a fake document, whose `attachAsset` answers the first load
 * of every node at once: failed for the URIs in `fail`, loaded otherwise.
 * `at(time)` moves the programme there and runs a frame.
 */
function withRenderer(experiences, { fail = [] } = {}) {
  globalThis.document = { createElement: () => fakeNode() };
  globalThis.requestAnimationFrame = () => {};
  const { log, warn } = console;
  console.log = () => {};
  console.warn = () => {};
  const video = fakeNode();
  const layer = {
    appendChild() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1920, height: 1080 })
  };
  const attached = [];
  const attachAsset = (node, { uri, onLoaded, onFailed }) => {
    attached.push(uri);
    if (fail.includes(uri)) onFailed('HTTP 404'); else onLoaded();
    return () => {};
  };
  const provider = {
    activeAt: (time) => experiences.filter((e) => time >= e.startTime && time < e.startTime + e.duration)
  };
  const presented = [];
  const renderer = createRenderer({ provider, video, layer, attachAsset, onPresented: (m) => presented.push(m) });
  const at = (time, frames = 4) => {
    video.currentTime = time;
    for (let i = 0; i < frames; i += 1) renderer.tick();
  };
  const restore = () => {
    console.log = log; console.warn = warn;
    delete globalThis.document; delete globalThis.requestAnimationFrame;
  };
  return { renderer, attached, presented, at, restore };
}

const summary = (attempts) => attempts.map((a) => [a.index, a.type, a.uri, a.reason]);

test('every option and the default fail: the ad is reported once, skipped, with all three attempts', () => {
  const experiences = resolve([slotAsset()]);
  const { attached, presented, at, restore } = withRenderer(experiences, { fail: ['/v.m3u8', '/i.svg', '/linear.m3u8'] });
  try {
    at(SLOT_START + 1);
    at(SLOT_START + 2);
    assert.deepEqual(attached, ['/v.m3u8', '/i.svg', '/linear.m3u8']);
    assert.equal(presented.length, 1, 'onPresented is called once');
    const [report] = presented;
    assert.equal(report.itemId, `${ID}.0`);
    assert.equal(report.outcome, 'skipped');
    assert.equal(report.presented, null);
    assert.deepEqual(summary(report.attempts), [
      [0, 'squeezebackLShape', '/v.m3u8', 'failed to load /v.m3u8 (HTTP 404)'],
      [1, 'squeezebackDoubleBox', '/i.svg', 'failed to load /i.svg (HTTP 404)'],
      [null, 'linear', '/linear.m3u8', 'failed to load /linear.m3u8 (HTTP 404)']
    ]);
  } finally { restore(); }
});

test('every option fails and the default loads: the ad is reported presented by its default', () => {
  const experiences = resolve([slotAsset()]);
  const { presented, at, restore } = withRenderer(experiences, { fail: ['/v.m3u8', '/i.svg'] });
  try {
    at(SLOT_START + 1);
    assert.equal(presented.length, 1);
    assert.equal(presented[0].outcome, 'presented');
    assert.deepEqual(presented[0].presented, { index: null, type: 'linear', linear: true });
    assert.deepEqual(summary(presented[0].attempts).map(([index]) => index), [0, 1]);
  } finally { restore(); }
});

test('an asset with no default whose options all fail is reported skipped, with both attempts', () => {
  const experiences = resolve([slotAsset({ withDefault: false })]);
  const { attached, presented, at, restore } = withRenderer(experiences, { fail: ['/v.m3u8', '/i.svg'] });
  try {
    at(SLOT_START + 1);
    assert.deepEqual(attached, ['/v.m3u8', '/i.svg']);
    assert.equal(presented.length, 1);
    assert.equal(presented[0].outcome, 'skipped');
    assert.equal(presented[0].presented, null);
    assert.deepEqual(summary(presented[0].attempts).map(([index, , uri]) => [index, uri]), [[0, '/v.m3u8'], [1, '/i.svg']]);
  } finally { restore(); }
});

test('a bare linear asset that fails is reported skipped, with its one attempt', () => {
  const experiences = resolve([{ URI: '/bare.m3u8', DURATION: 12 }]);
  const { presented, at, restore } = withRenderer(experiences, { fail: ['/bare.m3u8'] });
  try {
    at(SLOT_START + 1);
    assert.equal(presented.length, 1);
    assert.equal(presented[0].outcome, 'skipped');
    assert.equal(presented[0].presented, null);
    assert.deepEqual(summary(presented[0].attempts),
      [[null, 'linear', '/bare.m3u8', 'failed to load /bare.m3u8 (HTTP 404)']]);
  } finally { restore(); }
});

test('two items of one asset: the default failing reports both skipped, and an item that opens later too', () => {
  // The second item opens after the asset is already skipped, so it is first
  // met then, and it is reported then: the asset's outcome is its outcome.
  const payload = [
    { start: 0, duration: 6, layoutOptions: [VIDEO, IMAGE] },
    { start: 6, duration: 6, layoutOptions: [VIDEO, IMAGE] }
  ];
  const experiences = resolve([slotAsset({ payload })]);
  const { presented, at, restore } = withRenderer(experiences, { fail: ['/v.m3u8', '/i.svg', '/linear.m3u8'] });
  try {
    at(SLOT_START + 1);
    assert.deepEqual(presented.map((m) => [m.itemId, m.outcome]), [[`${ID}.0`, 'skipped']]);
    at(SLOT_START + 7);
    assert.deepEqual(presented.map((m) => [m.itemId, m.outcome]), [[`${ID}.0`, 'skipped'], [`${ID}.1`, 'skipped']]);
    assert.equal(presented[1].presented, null);
    assert.deepEqual(summary(presented[1].attempts).map(([, , uri]) => uri), ['/linear.m3u8'],
      'the later item never tried its options; what failed for it is the default');
  } finally { restore(); }
});

test('an ad presented at once is reported once, and a later frame does not report it again', () => {
  const experiences = resolve([slotAsset()]);
  const { presented, at, restore } = withRenderer(experiences);
  try {
    at(SLOT_START + 1);
    at(SLOT_START + 5);
    assert.deepEqual(presented.map((m) => [m.outcome, m.presented.index, m.attempts.length]), [['presented', 0, 0]]);
  } finally { restore(); }
});

test('two items of one asset: the default presented, an item that opens later is reported presented by it', () => {
  const payload = [
    { start: 0, duration: 6, layoutOptions: [VIDEO, IMAGE] },
    { start: 6, duration: 6, layoutOptions: [VIDEO, IMAGE] }
  ];
  const experiences = resolve([slotAsset({ payload })]);
  const { presented, at, restore } = withRenderer(experiences, { fail: ['/v.m3u8', '/i.svg'] });
  try {
    at(SLOT_START + 1);
    at(SLOT_START + 7);
    assert.deepEqual(presented.map((m) => [m.itemId, m.outcome, m.presented?.linear, m.attempts.length]),
      [[`${ID}.0`, 'presented', true, 2], [`${ID}.1`, 'presented', true, 0]]);
  } finally { restore(); }
});

test('two items of one asset with no default: one running out of options skips the other too, and says so', () => {
  const payload = [
    { start: 0, duration: 6, layoutOptions: [VIDEO, IMAGE] },
    { start: 6, duration: 6, layoutOptions: [VIDEO, IMAGE] }
  ];
  const experiences = resolve([slotAsset({ withDefault: false, payload })]);
  const { attached, presented, at, restore } = withRenderer(experiences, { fail: ['/v.m3u8', '/i.svg'] });
  try {
    at(SLOT_START + 1);
    at(SLOT_START + 7);
    assert.deepEqual(attached, ['/v.m3u8', '/i.svg'], 'the second item is never mounted');
    assert.deepEqual(presented.map((m) => [m.itemId, m.outcome, m.attempts.length]),
      [[`${ID}.0`, 'skipped', 2], [`${ID}.1`, 'skipped', 0]]);
  } finally { restore(); }
});
