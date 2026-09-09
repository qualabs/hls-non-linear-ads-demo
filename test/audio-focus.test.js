// audio-focus.test.js -- the test of T-01 of the phase of the audio focus.
//
// What it is for: the arithmetic of the mix, which is the only part of the
// focus that is not on the screen. Everything else the focus adds is heard or
// seen in the first break -- audio doubled, audio missing, a mark on the wrong
// box -- and this is not: `effectiveVolumeOf` decides a number, and a number
// that comes out wrong still sounds like a mix somebody declared.
//
// Same door as the other suites and the same restriction: the pure functions
// and nothing else. No DOM, no browser, and coverage is not the goal -- the
// function has three branches and this file has the three.
//
// The data is the real one, in `test/fixtures/asset-lists/`, and it is what
// makes the cases the ones that matter: the Quad is where a rule that gave the
// focused element the level of the primary content would change nothing
// audible, and the corner overlay is where two soundtracks would play at once.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { resolveAssetList } from '../lib/signalling.js';
import { volumeOf, effectiveVolumeOf } from '../lib/renderer.js';

/** The elements of one of the layouts the run signals, resolved as the renderer gets them. */
function elementsOf(list, id) {
  const json = JSON.parse(readFileSync(new URL(`./fixtures/asset-lists/${list}`, import.meta.url), 'utf8'));
  const [experience] = resolveAssetList(json, { id, slotStart: 0 });
  return experience.elements;
}

/** The Quad: primary content at 10, two quadrants at 10 and one at 100. */
const quad = () => elementsOf('asset-list-multiView.json', 'multiView');
const byId = (elements, id) => elements.find((e) => e.id === id);

test('with nobody focused every element comes out at the level the layout declared', () => {
  const elements = quad();
  assert.deepEqual(
    elements.map((e) => `${e.id}:${effectiveVolumeOf(e, null)}`),
    ['primaryContent:0.1', 'view2:0.1', 'view3:1', 'view4:0.1']
  );
  // And it is `volumeOf` and not a second reading of the field: the mix with no
  // focus is the mix of ADR 0014, unchanged.
  for (const element of elements) {
    assert.equal(effectiveVolumeOf(element, null), volumeOf(element), element.id);
    // Nothing focused is also what arrives before anybody touches anything,
    // and the renderer holds it as `null`.
    assert.equal(effectiveVolumeOf(element, undefined), volumeOf(element), element.id);
  }
});

test('the focused element comes out at full volume even when it declared 10', () => {
  const elements = quad();
  const focused = byId(elements, 'view2');
  assert.equal(volumeOf(focused), 0.1);
  assert.equal(effectiveVolumeOf(focused, focused), 1);
  // The other end of the same field: the quadrant that declares 100 is at 1
  // with the focus on it too, so focusing never LOWERS what was chosen.
  const loud = byId(elements, 'view3');
  assert.equal(effectiveVolumeOf(loud, loud), 1);
});

test('everything else goes to 0 with the focus taken, the primary content included', () => {
  const elements = quad();
  const focused = byId(elements, 'view2');
  assert.deepEqual(
    elements.filter((e) => e !== focused).map((e) => `${e.id}:${effectiveVolumeOf(e, focused)}`),
    ['primaryContent:0', 'view3:0', 'view4:0']
  );
  // The corner overlay is the case the focus exists for: the programme is at
  // 100 there and the ad at 0, so an ad brought up to full volume without this
  // leaves two soundtracks playing at once.
  const overlay = elementsOf('asset-list-cornerOverlay.json', 'cornerOverlay');
  const ad = overlay.find((e) => !e.primary);
  const programme = overlay.find((e) => e.primary);
  assert.equal(volumeOf(programme), 1);
  assert.equal(effectiveVolumeOf(ad, ad), 1);
  assert.equal(effectiveVolumeOf(programme, ad), 0);
});
