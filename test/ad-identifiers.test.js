// ad-identifiers.test.js -- the AdIdentifiers of a Slot reach the contract, and
// from it the tracking events (ADR 0093).
//
// The list below has the shape of Code 7 of the SVTA2053 draft: `identifiers`
// inside the payload item, which is the Slot, beside `start`, `duration` and
// `options`. It is written here and not read from a demo, because `test/` only
// reads `test/` and `lib/` (ADR 0023).
//
// Run: npm test

import test from 'node:test';
import assert from 'node:assert/strict';

import { blockIdentifiers, identifiersOf, resolveAssetList } from '../lib/signalling.js';
import { createTracking, slotEvents } from '../lib/tracking.js';

const AD_ID = { scheme: 'ad-id.org', value: 'KTRV0001000H' };

/** A Slot with two options, video first and a still image second, and a linear default. */
function lista({ uri = '/ketrava-16x9.m3u8', identifiers = [AD_ID] } = {}) {
  const asset = {
    DURATION: 12,
    'X-AD-CREATIVE-SIGNALING': {
      version: 2,
      type: 'slot',
      payload: [{
        start: 0,
        duration: 12,
        identifiers,
        options: [
          { type: 'squeezebackLShape',
            layout: { primaryContent: { zDepth: 1, viewport: '0 0 25 25' },
              assets: [{ id: 'lBackplate', type: 'application/vnd.apple.mpegurl', uri: '/b.m3u8', viewport: '0 0 0 0', zDepth: 0 }] } },
          { type: 'squeezebackDoubleBox',
            layout: { primaryContent: { zDepth: 0, viewport: '25 50 25 0' },
              assets: [{ id: 'adSideBySide', type: 'image/svg+xml', uri: '/k.svg', viewport: '25 0 25 50', zDepth: 1 }] } }
        ]
      }]
    }
  };
  if (uri) asset.URI = uri;
  return { ASSETS: [asset] };
}

const resolver = (l, capabilities = null, report = null) =>
  resolveAssetList(l, { id: 'AD-B-CONCURRENT', slotStart: 65, capabilities, report });

test('identifiersOf keeps the scheme and value pairs and drops what is not one', () => {
  assert.deepEqual(identifiersOf([AD_ID, { scheme: ' ad-id.org ', value: ' X ' }]),
    [AD_ID, { scheme: 'ad-id.org', value: 'X' }]);
  assert.deepEqual(identifiersOf([{ scheme: 'ad-id.org' }, { value: 'X' }, { scheme: '', value: 'X' }, null, 'X']), []);
  assert.deepEqual(identifiersOf(undefined), [], 'a Slot without identifiers still resolves');
  assert.deepEqual(identifiersOf({ scheme: 'ad-id.org', value: 'X' }), [], 'an object is not an array');
});

test('the drawn option carries the identifiers of its Slot, whichever option it is', () => {
  const [video] = resolver(lista(), { videoDecoders: 2, imageOverVideo: true });
  assert.equal(video.type, 'squeezebackLShape');
  assert.deepEqual(video.identifiers, [AD_ID]);
  const [imagen] = resolver(lista(), { videoDecoders: 1, imageOverVideo: true });
  assert.equal(imagen.type, 'squeezebackDoubleBox');
  assert.deepEqual(imagen.identifiers, [AD_ID], 'the image is the same ad, so the same identifier');
});

test('the linear default is the same ad played another way, and it keeps the identifiers', () => {
  const report = [];
  const [linear] = resolver(lista(), { videoDecoders: 1, imageOverVideo: false }, report);
  assert.equal(linear.type, 'linear');
  assert.deepEqual(linear.identifiers, [AD_ID]);
  assert.equal(report[0].outcome, 'default');
  assert.deepEqual(report[0].identifiers, [AD_ID]);
});

test('a skipped asset plays nothing, and the report still says which ad it was', () => {
  const report = [];
  const out = resolver(lista({ uri: null }), { videoDecoders: 1, imageOverVideo: false }, report);
  assert.equal(out.length, 0);
  assert.equal(report[0].outcome, 'skipped');
  assert.deepEqual(report[0].identifiers, [AD_ID]);
});

test('an asset with no block has no Slot, so no identifiers', () => {
  const [linear] = resolver({ ASSETS: [{ URI: '/l.m3u8', DURATION: 8 }] });
  assert.deepEqual(linear.identifiers, []);
});

test('blockIdentifiers gathers the Slots of a block without repeats', () => {
  const other = { scheme: 'ad-id.org', value: 'ZMBR0001000H' };
  assert.deepEqual(blockIdentifiers({ payload: [{ identifiers: [AD_ID] }, { identifiers: [AD_ID, other] }] }),
    [AD_ID, other]);
  assert.deepEqual(blockIdentifiers(null), []);
});

// --- tracking ---------------------------------------------------------------

const exp = (itemId, identifiers = [AD_ID]) =>
  ({ id: 'AD-B-CONCURRENT', itemId, type: 'squeezebackLShape', startTime: 65, duration: 12, identifiers });

test('slotEvents: an experience entering is a slotStart, one leaving a slotEnd, both with the identifiers', () => {
  const a = exp('AD-B-CONCURRENT.0');
  const [start] = slotEvents(new Map(), [a], 65.1);
  assert.deepEqual(start, { type: 'slotStart', time: 65.1, id: 'AD-B-CONCURRENT', itemId: 'AD-B-CONCURRENT.0',
    experienceType: 'squeezebackLShape', startTime: 65, duration: 12, identifiers: [AD_ID] });
  assert.deepEqual(slotEvents(new Map([[a.itemId, a]]), [a], 70), [], 'still on screen: nothing to say');
  const [end] = slotEvents(new Map([[a.itemId, a]]), [], 77);
  assert.equal(end.type, 'slotEnd');
  assert.deepEqual(end.identifiers, [AD_ID]);
});

test('slotEvents: one ad giving way to the next is the end of the first and then the start of the second', () => {
  const a = exp('X.0'); const b = exp('X.1', [{ scheme: 'ad-id.org', value: 'ZMBR0001000H' }]);
  const events = slotEvents(new Map([[a.itemId, a]]), [b], 12);
  assert.deepEqual(events.map((e) => [e.type, e.itemId, e.identifiers[0].value]),
    [['slotEnd', 'X.0', 'KTRV0001000H'], ['slotStart', 'X.1', 'ZMBR0001000H']]);
});

/** A media element as far as tracking reads one: a clock and its events. */
function fakeVideo() {
  const listeners = new Map();
  return {
    currentTime: 0,
    addEventListener: (k, f) => listeners.set(k, [...(listeners.get(k) ?? []), f]),
    removeEventListener: (k, f) => listeners.set(k, (listeners.get(k) ?? []).filter((g) => g !== f)),
    fire(k) { for (const f of listeners.get(k) ?? []) f(); }
  };
}

test('createTracking reads the contract on every timeupdate and hands each change to onTracking', () => {
  const video = fakeVideo();
  const a = exp('AD-B-CONCURRENT.0');
  const provider = { activeAt: (t) => (t >= 65 && t < 77 ? [a] : []) };
  const events = [];
  const tracking = createTracking({ provider, video, onTracking: (e) => events.push(e) });
  for (const t of [64, 65.2, 70, 77.1]) { video.currentTime = t; video.fire('timeupdate'); }
  assert.deepEqual(events.map((e) => [e.type, e.time, e.identifiers]),
    [['slotStart', 65.2, [AD_ID]], ['slotEnd', 77.1, [AD_ID]]]);
  // A seek into the middle of the ad starts it, at the second of the seek.
  video.currentTime = 70; video.fire('seeked');
  assert.deepEqual(events.at(-1).type, 'slotStart');
  tracking.stop();
  video.currentTime = 90; video.fire('timeupdate');
  assert.equal(events.length, 3, 'stopped means no more events');
});

test('a callback that throws does not stop the next event', () => {
  const video = fakeVideo();
  const a = exp('A.0'); const b = exp('A.1');
  const provider = { activeAt: (t) => (t < 10 ? [a] : [b]) };
  const seen = [];
  const original = console.error;
  console.error = () => {};
  try {
    createTracking({ provider, video, onTracking: (e) => { seen.push(e.itemId + ':' + e.type); throw new Error('beacon down'); } });
    video.currentTime = 11; video.fire('timeupdate');
  } finally {
    console.error = original;
  }
  assert.deepEqual(seen, ['A.0:slotStart', 'A.0:slotEnd', 'A.1:slotStart']);
});
