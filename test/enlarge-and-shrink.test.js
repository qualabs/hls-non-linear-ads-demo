// enlarge-and-shrink.test.js -- the test of T-09 of the phase of the multi
// view, and it is aimed at the half of that button that nothing on a screen
// reports.
//
// The geometry of enlarging is on camera: a box is at full frame or it is not,
// and the task takes a capture of both. THE MIX IS NOT. A composition whose
// audio went to the wrong box, or went nowhere, looks exactly like one whose
// audio went where it was asked -- and of the three moments the definition of
// done names, the one that can be wrong in silence is the third: coming back to
// the grid must NOT take the sound off the box that was enlarged (ADR 0069),
// and a player that let it go would look right in every frame.
//
// SO WHAT IS MEASURED IS THE MIX AT THE THREE MOMENTS, and it is measured
// through `effectiveVolumeOf`, which is the same call the rendering side makes
// per node. Reading the volumes off a page is the other half and it is in the
// evidence of the task; this is the arithmetic underneath it, without a
// browser, so it fails on a laptop instead of on camera.
//
// AND EVERY READING HAS ITS CONTROL. The third reading being equal to the
// second proves nothing on its own -- two readings of a mix that never moved
// are also equal. So the mix the third one must NOT be is written down beside
// it: the grid's own declared mix, which is what would come out if shrinking
// let the focus go. Same for taking the audio at all: the mix of a box at full
// frame with nobody focused is the failure "it enlarged and did not take the
// sound", and it is asserted as the thing that is different.
//
// The boxes themselves are the other half of this file: what a button can be
// hung on, which is one per box on the grid and exactly ONE while a box is at
// full frame, because the others are covered and a control over a picture
// nobody can see points at nothing.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { FULL_FRAME, resolveAssetList } from '../lib/signalling.js';
import {
  PRIMARY_ID, boxesOf, elementsOf, emptySelection, enlarge, raise, shrink
} from '../lib/multiview.js';
import { effectiveVolumeOf } from '../lib/renderer.js';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

/** The offer as it is served: three views, which with the programme is a full grid. */
function offer() {
  const list = readJson('./fixtures/asset-lists/asset-list-offer-3.json');
  return resolveAssetList(list, { id: 'MV-1-OFFER', slotStart: 45 })[0];
}

const idsOf = (o) => o.views.map((view) => view.id);

/** The whole catalogue up: four boxes, which is the shape the task is about. */
function fullGrid(o) {
  return idsOf(o).reduce(raise, emptySelection(o));
}

/**
 * THE COMPOSITION AS IT IS HEARD: every element against the one index the
 * rendering side keeps for the whole of it (ADR 0026).
 *
 * `focusedId` and not an element, because a test that had to hold on to the
 * object would be holding on to a different object on each side of a change of
 * state -- which is exactly the case the rendering side handles by rebinding
 * the focus to the element the contract hands over on the pass (`apply`). This
 * models that: the id survives the change, and the element is found again in
 * the composition being measured.
 */
function mixOf(state, focusedId) {
  const elements = elementsOf(state);
  const focused = focusedId == null ? null : elements.find((e) => e.id === focusedId);
  assert.ok(focusedId == null || focused, `${focusedId} is not in this composition`);
  return Object.fromEntries(elements.map((e) => [e.id, effectiveVolumeOf(e, focused)]));
}

test('the three moments of the mix, with the third equal to the second', () => {
  const o = offer();
  const ids = idsOf(o);
  const grid = fullGrid(o);
  // The second view and not the first, so that a reading that happened to be
  // right by position instead of by identity comes out wrong.
  const big = ids[1];

  // 1. THE GRID. Nobody has chosen anything, so what is heard is the mix an
  //    offer opens at: the programme, and the views silent (ADR 0014).
  const inTheGrid = mixOf(grid, null);
  assert.deepEqual(inTheGrid,
    { [PRIMARY_ID]: 1, [ids[0]]: 0, [ids[1]]: 0, [ids[2]]: 0 });

  // 2. ONE BOX AT FULL FRAME, and it is the only one that sounds: the button is
  //    full focus, picture and audio, which is one call to `setFocus` on that
  //    box (ADR 0069).
  const enlarged = enlarge(grid, big);
  const atFullFrame = mixOf(enlarged, big);
  assert.deepEqual(atFullFrame,
    { [PRIMARY_ID]: 0, [ids[0]]: 0, [ids[1]]: 1, [ids[2]]: 0 });

  // 3. BACK IN THE GRID, and this is the reading the whole task is about.
  //    Shrinking gives the geometry back and does not touch the focus, so the
  //    box that was big goes back to its place STILL SOUNDING.
  const backInTheGrid = mixOf(shrink(enlarged), big);
  assert.deepEqual(backInTheGrid, atFullFrame);
});

test('and the third reading is measured against the one it must not be', () => {
  // Two readings of a mix that never moved are also equal, so the assertion
  // above needs the other answer written down beside it: this is what coming
  // back to the grid would sound like if shrinking let the focus go, which is
  // the sixth way out of the focus that phase 06 closed with five.
  const o = offer();
  const ids = idsOf(o);
  const grid = fullGrid(o);
  const big = ids[1];

  const asItIs = mixOf(shrink(enlarge(grid, big)), big);
  const ifItLetGo = mixOf(shrink(enlarge(grid, big)), null);

  assert.notDeepEqual(asItIs, ifItLetGo);
  // And what it would be instead is the grid as it was before anybody pressed
  // anything: the programme back, and the box somebody chose silent.
  assert.deepEqual(ifItLetGo, mixOf(grid, null));
  assert.equal(ifItLetGo[big], 0);
  assert.equal(asItIs[big], 1);
});

test('a box at full frame that did not take the audio is a box nobody hears', () => {
  // The other rule of the button, measured as the thing that is different: the
  // picture at full frame with the mix the layout declared is what "it enlarged
  // and did not take the sound" is, and there is nothing in that frame that
  // says so -- you see one view and hear the programme underneath it.
  const o = offer();
  const ids = idsOf(o);
  const big = ids[1];
  const enlarged = enlarge(fullGrid(o), big);

  const withoutTheFocus = mixOf(enlarged, null);
  assert.equal(withoutTheFocus[big], 0);
  assert.equal(withoutTheFocus[PRIMARY_ID], 1);
  assert.notDeepEqual(withoutTheFocus, mixOf(enlarged, big));
});

test('the programme at full frame is the mix the layout declared', () => {
  // The programme is a box of the composition like the others and can be the
  // enlarged one, but it is NOT enfocable (ADR 0027) -- and it does not need to
  // be: what makes it the only one that is heard is nobody being focused, which
  // is the mix an offer already opens at. So "the only one that sounds" and
  // "the focus is released" are the same state here, and there is no second
  // rule for the one box of the four that is already playing.
  const o = offer();
  const ids = idsOf(o);
  const state = enlarge(fullGrid(o), PRIMARY_ID);

  assert.deepEqual(mixOf(state, null),
    { [PRIMARY_ID]: 1, [ids[0]]: 0, [ids[1]]: 0, [ids[2]]: 0 });
});

test('one button per box on the grid, on the box the picture is in', () => {
  const o = offer();
  const grid = fullGrid(o);
  const boxes = boxesOf(grid);

  assert.deepEqual(boxes.map((box) => box.id), [PRIMARY_ID, ...idsOf(o)]);
  assert.ok(boxes.every((box) => !box.enlarged));
  // The rectangle a button rides on is the rectangle the picture is drawn in,
  // and it is the same object the contract carries: the chrome converts it to
  // pixels with the renderer's own arithmetic, so a box that differed here
  // would be a button floating off the corner of a picture.
  assert.deepEqual(boxes.map((box) => box.box), elementsOf(grid).map((e) => e.box));
  // And every one of them is named by something somebody can read, which is
  // what the label of a control is (ADR 0064).
  assert.equal(boxes[0].name, o.primaryName);
  assert.deepEqual(boxes.slice(1).map((box) => box.name), o.views.map((view) => view.name));
  assert.ok(boxes.every((box) => box.name && box.name !== box.id),
    'the fixture names its views, or this assertion proves nothing');
});

test('while one box is at full frame there is one button, and it is on that box', () => {
  const o = offer();
  const ids = idsOf(o);
  const big = ids[1];
  const boxes = boxesOf(enlarge(fullGrid(o), big));

  // ONE, and not four. The other three are still there and still playing --
  // that is what makes coming back instant -- but they are covered, and a
  // button over a picture nobody can see is a control pointing at nothing.
  assert.equal(boxes.length, 1);
  assert.equal(boxes[0].id, big);
  assert.equal(boxes[0].enlarged, true);
  assert.deepEqual(boxes[0].box, FULL_FRAME);
});

test('with no composition there is nothing to enlarge and nothing to draw on', () => {
  const o = offer();
  assert.deepEqual(boxesOf(emptySelection(o)), []);
  // One view up is two boxes, which is a composition and therefore two buttons:
  // the row above is the empty list of ADR 0065 and not "the grid is small".
  assert.equal(boxesOf(raise(emptySelection(o), idsOf(o)[0])).length, 2);
});
