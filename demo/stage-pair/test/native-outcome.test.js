// native-outcome.test.js -- what index.html and inspect.html say hls.js DID with
// a break it plays itself, over a fake hls.js instance.
//
// What they are for: the list of a break declares a default, and that is only
// the plan. A default that fails to load is skipped by hls.js, and the page
// used to go on saying "plays its default". These assert that the plan is said
// as a plan until hls.js reports an outcome, and that a failed default is said
// as skipped, with its HTTP status.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import { followInterstitials, outcomeNote, reasonOf } from '../js/native-outcome.js';

const EVENTS = {
  INTERSTITIAL_ASSET_STARTED: 'started', INTERSTITIAL_ASSET_ERROR: 'assetError', INTERSTITIAL_ENDED: 'ended'
};
const tick = () => new Promise((r) => setTimeout(r, 0));

function fakeHls(events = []) {
  globalThis.Hls = { Events: EVENTS };
  const handlers = {};
  return {
    interstitialsManager: { events },
    on: (name, fn) => { handlers[name] = fn; },
    fire: (name, data) => handlers[name](name, data)
  };
}

test('before hls.js says anything, the outcome is unknown and the note is the plan', () => {
  const hls = fakeHls();
  const { outcome } = followInterstitials(hls);
  assert.equal(outcome('AD-B'), null);
  assert.equal(outcomeNote(null, { hasDefault: true }), '→ will play its default: the linear ad');
  assert.equal(outcomeNote(null, { hasDefault: false }), '→ no default content: will be skipped');
});

test('an asset that started is the default playing', () => {
  const hls = fakeHls();
  const changed = [];
  const { outcome } = followInterstitials(hls, (k) => changed.push(k));
  hls.fire('started', { event: { identifier: 'AD-B' } });
  assert.deepEqual(outcome('AD-B'), { kind: 'played' });
  assert.deepEqual(changed, ['AD-B']);
});

test('a default that fails to load, once hls.js gives up on the event, is skipped with its status', async () => {
  const event = { identifier: 'AD-B' };
  const hls = fakeHls([event]);
  const { outcome } = followInterstitials(hls, () => {}, (id) => id.slice(3).toLowerCase());
  hls.fire('assetError', { event, response: { code: 404 }, details: 'manifestLoadError' });
  // An asset error alone is not the outcome: hls.js emits it for errors it recovers from too.
  assert.equal(outcome('b'), null);
  event.error = new Error('failed');
  await tick();
  assert.deepEqual(outcome('b'), { kind: 'failed', reason: 'HTTP 404' });
  assert.equal(outcomeNote(outcome('b'), { hasDefault: true }), '→ default failed to load (HTTP 404): skipped');
});

test('a list with no asset is a break without default, skipped', () => {
  const hls = fakeHls([{ identifier: 'AD-A', assetListLoaded: true, assetList: [] }]);
  const { outcome } = followInterstitials(hls);
  assert.deepEqual(outcome('AD-A'), { kind: 'empty' });
  assert.equal(outcomeNote(outcome('AD-A')), '→ skipped: no default content');
});

test('the reason is the HTTP status when there is one, else what hls.js said', () => {
  assert.equal(reasonOf({ response: { code: 403 } }), 'HTTP 403');
  assert.equal(reasonOf({ error: new Error('boom'), details: 'x' }), 'boom');
  assert.equal(reasonOf({ details: 'manifestLoadTimeOut' }), 'manifestLoadTimeOut');
});

test('a start followed by the failure of the event is a failure: a pre-roll is started before it loads', async () => {
  const event = { identifier: 'AD-PRE' };
  const hls = fakeHls([event]);
  const { outcome } = followInterstitials(hls);
  hls.fire('started', { event });
  assert.deepEqual(outcome('AD-PRE'), { kind: 'played' });
  hls.fire('assetError', { event, response: { code: 404 } });
  event.error = new Error('failed');
  await tick();
  assert.deepEqual(outcome('AD-PRE'), { kind: 'failed', reason: 'HTTP 404' });
});
