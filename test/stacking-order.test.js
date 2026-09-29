// stacking-order.test.js -- the z-index the renderer gives each element (ADR 0089).
//
// What it is for: the order of the stack is invisible in a still frame of a
// side by side -- the boxes do not touch -- and it is the whole of what the way
// in and the way out look like, when the picture is moving over the ad. So it
// is asserted on the pure function that decides it, against the layouts the
// SVTA tool emits, and not by looking at a transition.
//
//   side by side (squeezebackDoubleBox)   primary 0, ad 1, boxes disjoint:
//                                         the PRIMARY goes above
//   L (squeezebackLShape)                 primary 1 over a backplate 0 that
//                                         covers the frame: as declared
//   lower third (lowerThirdOverlay)       the banner over the programme,
//                                         overlapping it: as declared
//
// Run: npm test

import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveElement } from '../lib/signalling.js';
import { overlaps, stackingOf } from '../lib/renderer.js';

const el = (id, viewport, zDepth, primary = false) =>
  resolveElement({ id, viewport, zDepth, ...(primary ? {} : { uri: `/${id}` }) }, primary);

/** Who is on top between the primary and one ad, by the z-index `stackingOf` gives. */
function arriba(elements, adId) {
  const z = stackingOf(elements);
  const primary = elements.find((e) => e.primary);
  const ad = elements.find((e) => e.id === adId);
  return z.get(primary) > z.get(ad) ? 'primary' : 'ad';
}

test('two boxes overlap when they share area, and touching edges do not count', () => {
  const izquierda = el('p', '25 50 25 0', 0, true).box;
  const derecha = el('a', '25 0 25 50', 1).box;
  assert.equal(overlaps(izquierda, derecha), false, 'the two halves of a side by side touch and do not overlap');
  assert.equal(overlaps(el('f', '0 0 0 0', 0).box, izquierda), true);
  assert.equal(overlaps(el('b', '70 6.25 12.5 6.25', 1).box, el('q', '0 0 0 0', 0, true).box), true);
});

test('side by side: the primary content goes above the ad it does not overlap', () => {
  const elements = [el('primaryContent', '25 50 25 0', 0, true), el('adSideBySide', '25 0 25 50', 1)];
  assert.equal(arriba(elements, 'adSideBySide'), 'primary');
});

test('L-shape: the backplate stays under the picture, as declared', () => {
  const elements = [el('lBackplate', '0 0 0 0', 0), el('primaryContent', '0 0 25 25', 1, true)];
  assert.equal(arriba(elements, 'lBackplate'), 'primary');
  // The control of this case: the same boxes with the zDepths swapped put the
  // backplate on top, because an overlapping element keeps its declared order.
  const invertido = [el('primaryContent', '0 0 25 25', 0, true), el('lBackplate', '0 0 0 0', 1)];
  assert.equal(arriba(invertido, 'lBackplate'), 'ad');
});

test('lower third: the banner stays over the programme, as declared', () => {
  const elements = [el('primaryContent', '0 0 0 0', 0, true), el('banner', '70 6.25 12.5 6.25', 1)];
  assert.equal(arriba(elements, 'banner'), 'ad');
});

test('an overlay declared above the picture stays above it even when the picture is lifted', () => {
  // A side by side with a logo over the picture: the picture goes above the ad
  // it does not touch, and the logo, which overlaps it, stays on top of it.
  const elements = [
    el('primaryContent', '25 50 25 0', 0, true),
    el('logo', '30 55 60 5', 1),
    el('adSideBySide', '25 0 25 50', 2)
  ];
  assert.equal(arriba(elements, 'adSideBySide'), 'primary');
  assert.equal(arriba(elements, 'logo'), 'ad');
  const z = stackingOf(elements);
  assert.ok(z.get(elements[1]) > z.get(elements[0]), 'the logo is above the picture');
});

test('a multi view with one box enlarged: the enlarged box covers everything, the rest under the picture', () => {
  const elements = [
    el('primaryContent', '0 50 50 0', 0, true),
    el('camA', '0 0 50 50', 1),
    el('camB', '0 0 0 0', 3)
  ];
  assert.equal(arriba(elements, 'camA'), 'primary');
  assert.equal(arriba(elements, 'camB'), 'ad');
});

test('without a primary content, or with nothing disjoint from it, the order is the declared one', () => {
  const soloAvisos = [el('a', '0 50 0 0', 0), el('b', '0 0 0 50', 1)];
  assert.deepEqual([...stackingOf(soloAvisos).values()], [0, 2]);
  const linear = [el('primaryContent', '0 0 0 0', 0, true), el('linear', '0 0 0 0', 1)];
  assert.equal(arriba(linear, 'linear'), 'ad', 'a linear ad at full frame covers the programme');
});
