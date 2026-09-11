// box-button-corner.test.js -- the corner each box hangs its button in.
//
// WHAT THIS IS FOR. The button that takes a view to full frame rides on the box
// itself (ADR 0069), and the chrome's own furniture is painted over that layer,
// so the one thing that can take the button away is another control landing on
// top of it. It happened: the T-09 wrote the corner down -- top left, "the one
// corner of every shape that is free" -- and in the 2x2 of ADR 0065 the fourth
// box's top left corner IS the centre of the picture, where the play button is.
// The T-10 measured it at [646, 403, 34, 34] under [603, 359, 74, 74]: 31x30 of
// a 34x34 button buried, and Playwright refusing to press it.
//
// THE FAILURE IT IS AIMED AT IS THE ONE THE FIRST RULE HAD, not the instance of
// it. A rule that names a corner cannot be wrong about the corner -- it can only
// be wrong about what is on top of it, which is not in the rule at all. So what
// is checked here is the property and never the answer: for every box of every
// shape, the button lands clear of every control of this chrome.
//
// AND THE THREE SHAPES, NOT THE ONE THAT FAILED. Two of them were already right,
// and a fix that moved every button would be a change to two screens that had
// nothing wrong with them: the assertion that the other three boxes of the grid
// keep the corner they had is as much of this file as the one that moves.
//
// The shapes are READ from `viewportsFor` and turned into pixels by the
// renderer's own `boxToPixels`, for the reason the geometry suite gives: a copy
// of those numbers is a copy somebody has to keep in step.
//
// WHAT IS A FIXTURE HERE, AND WHY IT IS HONEST TO BE ONE. The rectangles of the
// furniture are measured, not derived: they came off the real chrome in Chrome,
// in the run that goes with this task, and they are written down with the size
// of the picture they were read at. That is the half this file cannot compute
// -- a row is as wide as the buttons it happens to be carrying -- and it is also
// the half this file is not the check for: what proves the real chrome is clear
// is the browser reading, which asks `elementFromPoint` who owns the point and
// then presses it. This one proves the RULE, over geometry that is real.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import { parseViewport, viewportsFor } from '../lib/signalling.js';
import { boxToPixels, imageBox } from '../lib/renderer.js';
import { BOX_CORNERS, boxButtonCorner, boxButtonRect } from '../lib/controls.js';

/**
 * The chrome as it was measured, in the layer's own pixels: a player 1100x619
 * with the picture filling it, which is the demo of this phase in a 1280x900
 * window. Taken off `.qa-controls__top`, `.qa-btn--play` and
 * `.qa-controls__bar` with `getBoundingClientRect`, minus the layer's origin.
 */
const PLAYER = { left: 0, top: 0, width: 1100, height: 619 };
const FURNITURE = [
  { left: 977, top: 16, width: 107, height: 34 },  // the row at the top right
  { left: 513, top: 272, width: 74, height: 74 },  // play, in the middle
  { left: 0, top: 559, width: 1100, height: 60 }   // the bar, along the bottom
];
/** The button and the gap the box leaves around it: 34 px and 16 * 0.4. */
const BUTTON = { size: 34, pad: 6.4 };

/** The boxes of a composition of `count`, in the pixels they are drawn at. */
function boxesOfShape(count, player = PLAYER) {
  const area = imageBox(player, 16 / 9);
  return viewportsFor(count).map((viewport) => {
    const px = boxToPixels(parseViewport(viewport), area);
    return { left: area.left + px.left, top: area.top + px.top,
      width: px.width, height: px.height };
  });
}

/** How much of `a` is under `b`. The test's own, so the rule cannot grade itself. */
function overlap(a, b) {
  const w = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  const h = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

const buried = (rect, taken = FURNITURE) =>
  taken.reduce((sum, other) => sum + overlap(rect, other), 0);

const cornersOfShape = (count) =>
  boxesOfShape(count).map((box) => boxButtonCorner(box, FURNITURE, BUTTON));

test('in the three shapes, no button lands on a control of the chrome', () => {
  for (const count of [2, 3, 4]) {
    const boxes = boxesOfShape(count);
    assert.equal(boxes.length, count, `${count} boxes come out of the table`);
    boxes.forEach((box, i) => {
      const corner = boxButtonCorner(box, FURNITURE, BUTTON);
      const rect = boxButtonRect(corner, box, BUTTON);
      assert.equal(buried(rect), 0,
        `box ${i} of ${count} went to ${corner} and is still buried: ` +
        `${JSON.stringify(rect)}`);
      // And inside its own box, which is the other half of "on the box": a
      // corner that hung off the rectangle would be clear of everything.
      assert.ok(rect.left >= box.left && rect.top >= box.top
        && rect.left + rect.width <= box.left + box.width
        && rect.top + rect.height <= box.top + box.height,
      `box ${i} of ${count} put its button outside itself`);
    });
  }
});

test('the 2x2 is the shape that needed this, and it is its fourth box', () => {
  const boxes = boxesOfShape(4);
  // THE CONTROL OF THE TEST ABOVE, and without it that one passes for a rule
  // that never had anything to avoid: the corner the T-09 chose IS buried, by
  // the play button, and by roughly the 930 square pixels the T-10 measured.
  const asWritten = boxButtonRect('nw', boxes[3], BUTTON);
  assert.ok(buried(asWritten) > 900,
    `the corner of the first rule is clear, so there is nothing to fix: ` +
    `${JSON.stringify(asWritten)}`);

  assert.deepEqual(cornersOfShape(4), ['nw', 'nw', 'nw', 'ne']);
});

test('the two shapes that were right keep the screen they had', () => {
  // A fix that moved every button would be a change to two compositions nobody
  // reported anything about. Both of these are the answer the T-09 gave.
  assert.deepEqual(cornersOfShape(2), ['nw', 'nw']);
  assert.deepEqual(cornersOfShape(3), ['nw', 'nw', 'nw']);
});

test('with nothing in the way the answer is the first corner, every time', () => {
  // The order of BOX_CORNERS is what keeps the look still: the other three only
  // ever appear where the first one is taken, so an empty chrome is all north
  // west and the rule adds no variety of its own.
  for (const count of [2, 3, 4]) {
    for (const box of boxesOfShape(count)) {
      assert.equal(boxButtonCorner(box, [], BUTTON), BOX_CORNERS[0]);
    }
  }
});

test('when every corner is taken, the least buried one wins', () => {
  const box = { left: 0, top: 0, width: 200, height: 200 };
  // Two rectangles that between them cover every corner -- one over the top of
  // the box and one down its left side -- and leave the south east one with
  // least of itself under them. The honest answer on a picture too small for
  // the furniture on it is not an exception; it is how much of the button is
  // left.
  const blanket = [
    { left: 0, top: 0, width: 200, height: 180 },
    { left: 0, top: 0, width: 140, height: 200 }
  ];
  assert.equal(boxButtonCorner(box, blanket, BUTTON), 'se');
  const rect = boxButtonRect('se', box, BUTTON);
  assert.ok(buried(rect, blanket) > 0, 'the least buried corner is still buried');
  for (const corner of BOX_CORNERS.filter((c) => c !== 'se')) {
    assert.ok(buried(boxButtonRect(corner, box, BUTTON), blanket) > buried(rect, blanket),
      `${corner} should be more buried than the one that was chosen`);
  }
});

test('the four corners are four different places, and each is inside the box', () => {
  // What `boxButtonCorner` returns is only useful if the rectangle it names is
  // the one the stylesheet draws, so the arithmetic of the four is asserted
  // once, here, rather than inside every case above.
  const box = { left: 100, top: 200, width: 400, height: 300 };
  const rects = BOX_CORNERS.map((corner) => boxButtonRect(corner, box, BUTTON));
  assert.deepEqual(rects.map((r) => [r.left, r.top]), [
    [106.4, 206.4],                     // nw
    [100 + 400 - 6.4 - 34, 206.4],      // ne
    [106.4, 200 + 300 - 6.4 - 34],      // sw
    [100 + 400 - 6.4 - 34, 200 + 300 - 6.4 - 34] // se
  ]);
  assert.equal(new Set(rects.map((r) => `${r.left}|${r.top}`)).size, 4);
});
