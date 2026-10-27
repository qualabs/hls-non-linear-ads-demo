// renderer-failover.test.js -- the renderer half of ADR 0107.
//
// What they are for: the failover the renderer runs on its own, always on.
// When an asset of the option it mounted fails its first load, the whole option
// goes and the next one handed over is mounted, then the asset's linear
// default, then nothing. Which one comes next, and what is presented at a given
// second once some have failed, is invisible in any one frame -- a wrong answer
// is a black box, a default over the wrong window, or an ad that comes back
// after it was skipped -- so it is asserted here, on the two pure functions the
// renderer runs it with.
//
// The experiences are built by the signalling layer, from a list with two
// options and a default, so the shape under test is the one the renderer is
// really handed.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import { LINEAR_TYPE } from '../lib/experience.js';
import { BLOCK, resolveAssets } from '../lib/ad-list.js';
import { identityOf, nextAfterFailure, presentedAt, variantOf } from '../lib/renderer.js';

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
    // The same element id as the video on purpose: the next option has to be
    // NEW boxes even where two options name an element the same.
    assets: [{ id: 'ad', type: 'image/svg+xml', uri: '/i.svg', viewport: '25 0 25 50', zDepth: 1 }]
  }
};

function experienceWith({ withDefault = true } = {}) {
  const asset = { DURATION: 12, [BLOCK]: { version: 2, type: 'slot', payload: [{ start: 0, duration: 12, layoutOptions: [VIDEO, IMAGE] }] } };
  if (withDefault) asset.URI = '/linear.m3u8';
  return resolveAssets({ ASSETS: [asset] }, { id: ID, slotStart: SLOT_START })[0];
}

const fresh = () => ({ attempts: new Map(), assets: new Map(), cache: new Map() });
const mediaOf = (e) => e.elements.filter((x) => !x.primary).map((x) => x.mediaType).join(',');

test('the order of the failover: the next option, then the default, then nothing', () => {
  const ad = experienceWith();
  assert.deepEqual(nextAfterFailure(ad), { kind: 'option', attempt: 1 });
  assert.deepEqual(nextAfterFailure(variantOf(ad, 1)), { kind: 'default' });
  // The default is an experience with one option and no default of its own.
  assert.deepEqual(nextAfterFailure(ad.fallback), { kind: 'skip' });
});

test('without a default, the last option failing is a skip', () => {
  const ad = experienceWith({ withDefault: false });
  assert.deepEqual(nextAfterFailure(variantOf(ad, 1)), { kind: 'skip' });
});

test('an experience with no options never fails over, and is presented as it comes', () => {
  const offer = { itemId: 'offer', startTime: 0, duration: 10, elements: [] };
  assert.deepEqual(nextAfterFailure(offer), { kind: 'skip' });
  const state = fresh();
  assert.deepEqual(presentedAt([offer], 1, state), [offer]);
});

test('with nothing failed, what is presented is the experience itself', () => {
  const ad = experienceWith();
  assert.deepEqual(presentedAt([ad], SLOT_START + 1, fresh()), [ad]);
});

test('a later option is presented as a copy with its own key, the same ad and the same window', () => {
  const ad = experienceWith();
  const state = fresh();
  state.attempts.set(ad.itemId, 1);
  const [shown] = presentedAt([ad], SLOT_START + 1, state);
  assert.equal(mediaOf(shown), 'image/svg+xml');
  assert.equal(shown.type, 'squeezebackDoubleBox');
  assert.equal(shown.itemId, ad.itemId);
  assert.equal(shown.startTime, ad.startTime);
  assert.equal(shown.attempt, 1);
  // Its boxes are new boxes: the identity differs although the element id is the same.
  assert.notEqual(identityOf(shown, shown.elements.find((x) => !x.primary)),
    identityOf(ad, ad.elements.find((x) => !x.primary)));
  // And it is the same object while it is presented.
  assert.equal(presentedAt([ad], SLOT_START + 2, state)[0], shown);
});

test('an asset gone to its default is presented by the default inside the default\'s window, and by no item', () => {
  const ad = experienceWith();
  const state = fresh();
  state.assets.set(ad.assetId, { kind: 'default', fallback: ad.fallback });
  const [shown] = presentedAt([ad], SLOT_START + 1, state);
  assert.equal(shown, ad.fallback);
  assert.equal(shown.type, LINEAR_TYPE);
  // Outside the window of the asset nothing is presented.
  assert.deepEqual(presentedAt([], SLOT_START + 12, state), []);
  // Before the window, ahead of time, the default is not presented either.
  assert.deepEqual(presentedAt([], SLOT_START - 1, state), []);
});

test('an asset skipped is presented by nothing, and the programme goes on alone', () => {
  const ad = experienceWith();
  const state = fresh();
  state.assets.set(ad.assetId, { kind: 'skip' });
  assert.deepEqual(presentedAt([ad], SLOT_START + 1, state), []);
});

test('the failover of one ad does not touch another ad of another asset', () => {
  const ad = experienceWith();
  const other = { ...experienceWith(), itemId: `${ID}.9`, assetId: `${ID}.a9` };
  const state = fresh();
  state.assets.set(ad.assetId, { kind: 'skip' });
  assert.deepEqual(presentedAt([ad, other], SLOT_START + 1, state), [other]);
});
