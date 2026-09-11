// multiview-geometry.test.js -- the tests of T-03 of phase 11.
//
// What they are for: the table that turns HOW MANY boxes are on the screen into
// WHERE each one goes. It is the piece of the multi view where a mistake is
// seen and seen wrongly: nothing throws, nothing is logged, and what is on the
// screen is a picture stretched or a box holding somebody else's camera. The
// three properties below are the ones no screenshot reports.
//
//   THE FOUR VALUES OF N=4 ARE THE QUAD'S. The grid of this phase is the layout
//   this repository already draws in the fourth break of the run that gets
//   recorded, so the assertion is an equality against that asset-list READ, and
//   not against a copy of its numbers written here: a copy somebody has to keep
//   in step is a copy that goes out of step (ADR 0065).
//
//   `sx == sy` FOR THE PRIMARY CONTENT IN THE THREE SHAPES. The primary content
//   is moved with a transform, and a transform scales what `object-fit` already
//   drew, so a box of another aspect ratio than the area deforms the picture and
//   `movePrimary` warns on every frame. It is the whole reason the N=2 carries
//   black bands instead of being two halves of full height, and the discarded
//   shape is measured here too -- otherwise this check has no way of failing.
//
//   THE ORDER IS THE ORDER OF THE SELECTION. `aws-multiview` wrote down what it
//   costs when it is not: "Region order is not reading order... the viewer taps
//   swimming and hears hockey."
//
// The surface is the pure functions of the two layers and nothing else: no DOM,
// no browser, no network.
//
// The data is the real one, in `test/fixtures/asset-lists/`: the Quad of the
// recorded run, copied once -- `fixtures/README.md` says where from, and from
// that copy on it belongs to this suite (ADR 0023).
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { MAX_BOXES, parseViewport, resolveAssetList, viewportsFor } from '../lib/signalling.js';
import { boxToPixels } from '../lib/renderer.js';

/** The four rows of ADR 0065, which is what the table has to be. */
const SHAPES = {
  1: [],
  2: ['25 50 25 0', '25 0 25 50'],
  3: ['0 50 50 0', '0 0 50 50', '50 25 0 25'],
  4: ['0 50 50 0', '0 0 50 50', '50 50 0 0', '50 0 0 50']
};

/** The counts that have a shape, as numbers and in order. */
const COUNTS = Object.keys(SHAPES).map(Number);

/** The three that ARE a composition: one box is no composition at all. */
const COMPOSITIONS = COUNTS.filter((n) => n > 1);

/** The list with the console captured: a count with no shape is said out loud. */
function withConsole(count) {
  const said = [];
  const original = console.warn;
  console.warn = (...args) => said.push(args.join(' '));
  try {
    return { viewports: viewportsFor(count), said };
  } finally {
    console.warn = original;
  }
}

// ---------------------------------------------------------------------------
// 1. The four rows of ADR 0065
// ---------------------------------------------------------------------------

test('the shapes are the four rows of the decision, in their order', () => {
  for (const count of COUNTS) {
    assert.deepEqual(viewportsFor(count), SHAPES[count], `the shape of ${count} boxes`);
  }
});

test('one box is the empty list, which is the way out of the multi view', () => {
  // Not a degenerate case of the table and not an error: with one box there is
  // no composition, so the last view going down ends in the same event as the
  // button of the way out (ADR 0071). It is the row that makes the way out cost
  // nothing, so it is asserted on its own and not inside the loop above.
  assert.deepEqual(viewportsFor(1), []);
  // And it is the only count in the table that says nothing on the console: a
  // composition of one is what happens every time somebody lowers his last
  // camera, so warning here would put a line on the console for the normal way
  // out of the window.
  assert.deepEqual(withConsole(1).said, []);
});

test('every shape places every box it was asked for', () => {
  // A row shorter than its count is a camera somebody raised with nowhere to be
  // drawn, and a row longer is a box with nothing in it. Neither throws.
  for (const count of COUNTS) {
    assert.equal(viewportsFor(count).length, count === 1 ? 0 : count);
  }
  // And a `viewport` is four numbers, which is what `parseViewport` falls back
  // from: a row of three would be drawn at full frame, silently, over the rest.
  for (const count of COMPOSITIONS) {
    for (const viewport of viewportsFor(count)) {
      assert.equal(viewport.trim().split(/\s+/).length, 4, `${viewport} is four percentages`);
      assert.ok(viewport.split(/\s+/).every((n) => Number.isFinite(Number(n))));
    }
  }
});

test('the cap of the screen is the largest shape there is, and it is four', () => {
  // Derived and not typed: the cap of ADR 0066 is how many boxes fit, and how
  // many fit is this table. The day a row is added, whoever holds the selection
  // reads the new number without being edited.
  assert.equal(MAX_BOXES, 4);
  assert.equal(viewportsFor(MAX_BOXES).length, MAX_BOXES);
  assert.deepEqual(viewportsFor(MAX_BOXES + 1), [], 'there is no shape past the cap');
});

// ---------------------------------------------------------------------------
// 2. The N=4 is the Quad that is already drawn
// ---------------------------------------------------------------------------

/**
 * The Quad, resolved the way the renderer receives it: through the layer, with
 * its `viewport` parsed and its elements in the order of their `zDepth`. Read
 * and not transcribed, which is the point of this section -- and read THROUGH
 * the resolution rather than off the JSON, because what has to agree with the
 * table is what ends up on the screen and not what the file says.
 */
function quadElements() {
  const list = JSON.parse(
    readFileSync(new URL('./fixtures/asset-lists/asset-list-multiView.json', import.meta.url))
  );
  const experiences = resolveAssetList(list, { id: 'QUAD', slotStart: 0 });
  assert.equal(experiences.length, 1, 'the Quad is one experience of four elements');
  return experiences[0].elements;
}

test('the four boxes of the full grid are the Quad already in the repository', () => {
  const elements = quadElements();
  assert.equal(elements.length, 4);
  // Box by box and in order, against the four the table hands over. This is the
  // assertion the task exists for: the grid of this phase was on a screen before
  // the phase started, and if the two ever stop agreeing, this is what says so.
  assert.deepEqual(
    elements.map((element) => element.box),
    viewportsFor(4).map(parseViewport)
  );
  // The first box is the primary content, in the published layout and in the
  // table alike: the programme is one of the views and it is the first one.
  assert.equal(elements[0].primary, true);
  assert.equal(elements.filter((element) => element.primary).length, 1);
});

// ---------------------------------------------------------------------------
// 3. The primary content keeps its aspect ratio in the three shapes
// ---------------------------------------------------------------------------

/**
 * The arithmetic of `movePrimary`, which is not imported because it is not
 * exported: it is a closure over the area, inside the renderer. What is shared
 * with it is `boxToPixels`, which IS imported, and the two divisions below are
 * the two lines that follow it there -- `px.width / area.width` against
 * `px.height / area.height`.
 */
const scaleOfPrimary = (viewport, area) => {
  const px = boxToPixels(parseViewport(viewport), area);
  return { sx: px.width / area.width, sy: px.height / area.height };
};

/**
 * Two areas, and the second one is not a rounder version of the first. One is
 * the packaging of the content, 1280x720. The other is the picture T-03
 * measured in fullscreen on this machine, 1601,778 wide over a container of
 * 1920x901, which is where the arithmetic stops landing on whole pixels.
 */
const AREAS = [
  { width: 1280, height: 720 },
  { width: 1601.778, height: 901 }
];

/** What `movePrimary` warns past: a difference of more than a thousandth. */
const DEFORMATION_THRESHOLD = 0.001;

test('the primary content keeps the aspect ratio of the area in the three shapes', () => {
  for (const area of AREAS) {
    for (const count of COMPOSITIONS) {
      const { sx, sy } = scaleOfPrimary(viewportsFor(count)[0], area);
      assert.ok(Math.abs(sx - 0.5) <= Number.EPSILON,
        `the primary content is half the area with ${count} boxes, and it is ${sx}`);
      // Not `assert.equal(sx, sy)`: on the fullscreen picture the two divisions
      // differ by one ulp -- 0.5000000000000001 against 0.5 -- because 1601,778
      // is not a whole number of pixels. `Number.EPSILON` is the tightest bound
      // that is about arithmetic and not about the shape, and it is four orders
      // of magnitude under what the renderer warns past.
      assert.ok(Math.abs(sx - sy) <= Number.EPSILON,
        `${count} boxes over ${area.width}x${area.height}: sx ${sx} against sy ${sy}`);
      assert.ok(Math.abs(sx - sy) < DEFORMATION_THRESHOLD);
    }
  }
});

test('the two halves of full height that were discarded do deform the picture', () => {
  // The control of the check above, and without it that check cannot fail: a
  // ratio that always holds proves nothing until the shape that breaks it is
  // measured with the same arithmetic. This is the N=2 that ADR 0065 rejected --
  // left half and right half at full height -- and it is the one the SVTA tool
  // does not emit either.
  for (const area of AREAS) {
    const { sx, sy } = scaleOfPrimary('0 50 0 0', area);
    assert.ok(Math.abs(sx - 0.5) <= Number.EPSILON);
    assert.equal(sy, 1, 'full height, so the picture comes out twice as wide as it should');
    assert.ok(Math.abs(sx - sy) > DEFORMATION_THRESHOLD, 'this is what `movePrimary` warns about');
  }
});

// ---------------------------------------------------------------------------
// 4. The order
// ---------------------------------------------------------------------------

test('the boxes come out in reading order, and the primary content is the first', () => {
  for (const count of COMPOSITIONS) {
    const boxes = viewportsFor(count).map(parseViewport);
    // Reading order: down the rows first, and left to right inside a row. The
    // list is handed over in the order the selection was made, so box `i` is
    // whatever was raised `i`-th -- an order of another kind here is every box
    // after the first holding a picture that belongs to another row of the list.
    const inReadingOrder = [...boxes].sort((a, b) => a.top - b.top || a.left - b.left);
    assert.deepEqual(boxes, inReadingOrder, `the ${count} boxes are in reading order`);
    // And the first one is the leftmost box of the top row, which is where the
    // primary content goes in all three shapes. It is NOT the top of the frame
    // in the N=2: that shape is inset from above and below on purpose, and that
    // inset is where the black bands come from.
    assert.equal(boxes[0].left, 0);
    assert.equal(boxes[0].top, Math.min(...boxes.map((box) => box.top)));
  }
});

test('no two boxes of a shape are the same box', () => {
  for (const count of COMPOSITIONS) {
    const viewports = viewportsFor(count);
    assert.equal(new Set(viewports).size, viewports.length, `the ${count} boxes are distinct`);
  }
});

// ---------------------------------------------------------------------------
// 5. A count with no shape
// ---------------------------------------------------------------------------

test('a count the table has no shape for composes nothing and says so', () => {
  // Above the cap is the one that can actually happen -- the selection is held a
  // layer above and this is what a cap that was not applied looks like from
  // here. The rest are the shapes of a caller that lost its count.
  for (const count of [0, -1, 5, 8, 2.5, NaN, undefined, null, 'three', {}]) {
    const { viewports, said } = withConsole(count);
    assert.deepEqual(viewports, [], `${String(count)} boxes is no composition`);
    assert.equal(said.length, 1, `${String(count)} boxes is reported`);
    assert.match(said[0], /no shape/);
    assert.match(said[0], /0065/);
  }
});

test('a count that is a number written as text is still that many boxes', () => {
  // The count travels from whoever is counting boxes, and a `length` never
  // arrives as a string -- but a value read off an attribute does, and coming
  // back empty for "4" would be the multi view disappearing with a console line
  // nobody is looking at. It is one conversion and it removes the whole class.
  assert.deepEqual(viewportsFor('3'), viewportsFor(3));
  assert.deepEqual(withConsole('3').said, []);
});

test('the table cannot be edited through the list it hands over', () => {
  const first = viewportsFor(4);
  first.reverse();
  first[0] = 'nothing like a viewport';
  assert.deepEqual(viewportsFor(4), SHAPES[4], 'the next caller gets the table, not the leftovers');
});
