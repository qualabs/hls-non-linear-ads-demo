// box-travel.test.js -- the arithmetic a box of the composition travels by.
//
// What it is for: a box that changes shape because somebody raised a camera or
// enlarged one goes to its destination in one write and is painted back where
// it was by a transform, and letting that transform go is the movement
// (`transformFrom` in lib/renderer.js, ADR 0051). The screen shows whether
// something moved; what it does NOT show is whether it started from the right
// place, because the only frame that can say so is the first one of 380 ms and
// by the time anybody looks the box is already where it belongs. A transform
// that is wrong by a factor shows as a box that flicks and settles, which reads
// like a video decoding.
//
// The reference is the one box whose arithmetic is already on the screen: the
// inverse has to say "no movement" for a destination equal to the origin, and
// it has to land EXACTLY on the origin for every other one -- which is what the
// round trip below asserts, by applying the transform by hand to the corners of
// the destination and comparing against the origin.
//
// Same door as the other suites: the pure function and nothing else. No DOM, no
// browser.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import { transformFrom, boxToPixels } from '../lib/renderer.js';

/** The player area of the demos, in pixels: the picture inside the container. */
const AREA = { left: 0, top: 0, width: 715, height: 402 };

/** A box of the grid of ADR 0065, in pixels, off the `viewport` the tool writes. */
const px = (top, right, bottom, left) => boxToPixels({ top, right, bottom, left }, AREA);

/**
 * Where the four corners of `to` land once the transform is applied, which is
 * what the browser paints and therefore the only thing worth asserting. The
 * transform is `translate(tx, ty) scale(sx, sy)` about the top left corner, so
 * a point of the node at (x, y) is drawn at (x * sx + tx, y * sy + ty).
 */
function painted(transform, to) {
  const [, tx, ty, sx, sy] = transform.match(
    /^translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\((-?[\d.]+), (-?[\d.]+)\)$/
  ).map(Number);
  return {
    left: to.left + Number(tx),
    top: to.top + Number(ty),
    width: to.width * Number(sx),
    height: to.height * Number(sy)
  };
}

const close = (a, b, what) => assert.ok(Math.abs(a - b) < 1e-9, `${what}: ${a} vs ${b}`);

function landsOn(from, to) {
  const drawn = painted(transformFrom(from, to), to);
  close(drawn.left, from.left, 'left');
  close(drawn.top, from.top, 'top');
  close(drawn.width, from.width, 'width');
  close(drawn.height, from.height, 'height');
}

// --- The round trip --------------------------------------------------------

test('enlarging: the transform paints the whole picture back in its quadrant', () => {
  // The gesture of ADR 0069: the box of a raised camera goes to full frame.
  landsOn(px(0, 0, 50, 50), px(0, 0, 0, 0));
});

test('shrinking: the transform paints the quadrant back over the whole picture', () => {
  landsOn(px(0, 0, 0, 0), px(50, 50, 0, 0));
});

test('re-shaping: a box that changes slot when another camera goes up', () => {
  // Three boxes: the second one of the grid of two becomes the second of the
  // grid of three, which moves it and changes its size at once.
  landsOn(px(25, 0, 25, 50), px(0, 0, 50, 50));
});

test('a box that only moves is a translate and a scale of one', () => {
  const t = transformFrom(px(25, 50, 25, 0), px(25, 0, 25, 50));
  assert.match(t, /scale\(1, 1\)$/);
  landsOn(px(25, 50, 25, 0), px(25, 0, 25, 50));
});

// --- The two ends ----------------------------------------------------------

test('a destination equal to the origin asks for no movement at all', () => {
  const box = px(0, 50, 50, 0);
  assert.equal(transformFrom(box, box), 'translate(0px, 0px) scale(1, 1)');
});

test('a destination with no area gets no transform instead of a division by zero', () => {
  const from = px(0, 50, 50, 0);
  assert.equal(transformFrom(from, { left: 0, top: 0, width: 0, height: 201 }), 'none');
  assert.equal(transformFrom(from, { left: 0, top: 0, width: 358, height: 0 }), 'none');
});

test('the origin is read and the destination is what the node is laid out at', () => {
  // The two arguments are not interchangeable, and the way they get swapped is
  // silent: both orders produce a transform, and the wrong one sends the box
  // travelling away from where it was instead of towards where it is going.
  const quadrant = px(0, 50, 50, 0);
  const whole = px(0, 0, 0, 0);
  assert.notEqual(transformFrom(quadrant, whole), transformFrom(whole, quadrant));
  assert.match(transformFrom(quadrant, whole), /scale\(0\.5, 0\.5\)$/);
  assert.match(transformFrom(whole, quadrant), /scale\(2, 2\)$/);
});
