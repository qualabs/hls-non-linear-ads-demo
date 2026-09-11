// focus-after-a-composition-change.test.js -- the test of the gesture that
// moves the audio, asked on a box the composition has already changed around.
//
// WHAT IT IS FOR, AND WHY IT IS NEW. Since ADR 0070 a composition changes by
// keeping the nodes that survive and rebinding them to the elements the
// contract hands over on that pass. The node is the same object and the element
// is not, so ANYTHING THAT REMEMBERED AN ELEMENT IS HOLDING AN OLD ANSWER --
// and what remembers is a listener, which is registered once when the node is
// made and runs after any number of compositions.
//
// THE FAILURE IS THE WORST-SHAPED ONE IN THIS LIBRARY. The focus is one index
// over the whole composition (ADR 0026) and `effectiveVolumeOf` compares it by
// identity, so a focus moved onto an element that is in no composition matches
// nobody and takes EVERY element to 0 -- the box that was touched included, the
// programme included. Nothing is heard, no box carries the ring, and not one
// frame is different. It does not correct itself either: the pass that notices
// a focus with no box only runs when there is a plan to apply.
//
// AND IT IS WHY THIS FILE EXISTS RATHER THAN A LINE IN ANOTHER ONE. The suite
// that came before it aims at pure functions, and this defect lived in a
// closure: `planComposition` and `applyPlan` both keep their promise while it
// happens. What makes it reachable from here is `entryOf`, which is the
// question that closure now asks instead of remembering -- which box of the
// composition is this node, right now.
//
// EVERY READING HAS ITS REFERENCE, and here the reference is the same gesture
// on the same box before the composition changed: one view up, a tap, the box
// at full volume and the programme at 0. That is what the second reading has to
// be equal to. The mix the second one must NOT be is written down beside it and
// it is the one the screen showed: the stale element as the focus, and the
// whole composition silent.
//
// The data is the real offer of `test/fixtures/asset-lists/`, driven through
// `createMultiview`, so the elements are new objects because the library makes
// them new and not because the test made a case out of it. No DOM and no
// browser: `applyPlan` takes what makes a node as an argument, so a node here
// is a string, which is all `entryOf` compares.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { activeAt, isOffer, resolveAssetList } from '../lib/signalling.js';
import { createMultiview } from '../lib/multiview.js';
import { applyPlan, effectiveVolumeOf, entryOf, planComposition } from '../lib/renderer.js';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

/** The identifier of the Date Range, which everything of one window shares. */
const ID = 'MV-1-OFFER';

/** The second of playback the window this list was copied from opens at. */
const SLOT_START = 45;

/** The offer as it is served, behind the decorator that holds the choices. */
function multiview() {
  const list = readJson('./fixtures/asset-lists/asset-list-offer-3.json');
  const experiences = resolveAssetList(list, { id: ID, slotStart: SLOT_START });
  const mv = createMultiview({
    activeAt: (time) => activeAt(experiences, time),
    programRanges: () => ({ ranges: [], settled: true }),
    experiences
  });
  const offer = experiences.find(isOffer);
  return { mv, offer, at: offer.startTime + offer.duration / 2 };
}

/**
 * One pass of the renderer over what the contract answers now: the plan,
 * applied, with the nodes of the pass before kept. A node is a string, because
 * the only thing asked of it is whether it is the same one.
 */
let nodes = 0;

function compose(drawn, target) {
  return applyPlan(planComposition(drawn, target), {
    build: (create) => create.map((slot) => ({
      element: slot.element, experience: slot.experience, node: `node-${++nodes}`
    })),
    clear: () => {}
  });
}

/**
 * WHAT THE TOUCH ON A NODE DOES TO THE FOCUS, written here as the listener
 * writes it: ask which box the node is now, and toggle. The toggle was never
 * the defect -- which element it was given was.
 */
function touch(drawn, node, focused) {
  const entry = entryOf(drawn, node);
  if (!entry) return focused;
  return entry.element === focused ? null : entry.element;
}

/** The composition as it is heard: one level per box, in the order it is drawn. */
const mixOf = (drawn, focused) =>
  drawn.map(({ element }) => `${element.id}:${effectiveVolumeOf(element, focused)}`);

/** Whether anything at all comes out, which is the reading the screen cannot give. */
const audible = (drawn, focused) =>
  drawn.some(({ element }) => effectiveVolumeOf(element, focused) > 0);

test('the touch reaches the element the composition has now, and not the one the node was made with', () => {
  const { mv, offer, at } = multiview();
  const [a, b] = offer.views.map((view) => view.id);

  // ONE VIEW UP, AND THE TAP ON IT. This is the reference: it is the gesture
  // working, and it is what the second reading has to be equal to.
  mv.raise(offer, a);
  let drawn = compose([], mv.activeAt(at));
  const node = drawn.find(({ element }) => element.id === a).node;
  const made = drawn.find(({ element }) => element.id === a).element;

  let focused = touch(drawn, node, null);
  assert.equal(focused, made);
  assert.deepEqual(mixOf(drawn, focused), ['primaryContent:0', `${a}:1`]);
  assert.equal(audible(drawn, focused), true);

  // A SECOND VIEW GOES UP. Nothing about the first one stops: same node, and
  // the contract hands over a new element for it because the grid it is drawn
  // in is another one now.
  focused = null;
  mv.raise(offer, b);
  drawn = compose(drawn, mv.activeAt(at));
  const now = drawn.find(({ element }) => element.id === a);
  assert.equal(now.node, node, 'the box never stopped playing, so it kept its node');
  assert.notEqual(now.element, made, 'and it did not keep its element');

  // THE SAME GESTURE ON THE SAME BOX, and the same reading as the first one
  // except for the box that went up.
  focused = touch(drawn, node, focused);
  assert.equal(focused, now.element);
  assert.deepEqual(mixOf(drawn, focused), ['primaryContent:0', `${a}:1`, `${b}:0`]);
  assert.equal(audible(drawn, focused), true);

  // AND WHAT IT MUST NOT BE, which is what the screen showed: the element of
  // the moment the node was made is in no composition, so it matches nobody and
  // every box comes out at 0 -- the one that was touched included.
  assert.deepEqual(mixOf(drawn, made), ['primaryContent:0', `${a}:0`, `${b}:0`]);
  assert.equal(audible(drawn, made), false);
});

test('each node answers with its own box, and letting go still gives the declared mix back', () => {
  const { mv, offer, at } = multiview();
  const [a, b] = offer.views.map((view) => view.id);
  mv.raise(offer, a);
  mv.raise(offer, b);
  const drawn = compose(compose([], mv.activeAt(at)), mv.activeAt(at));

  // Two boxes and two nodes: a lookup that answered with the first one, or with
  // the composition's own order, would pass every assertion of the test above.
  for (const entry of drawn) {
    assert.equal(entryOf(drawn, entry.node).element, entry.element);
  }

  // The way out of ADR 0029 that this gesture owns: the same tap on the box
  // that already had it lets it go, and the mix goes back to what the layout
  // declared -- which for an offer is the programme whole and the views silent,
  // because a multi view declares no volume on anything and the two defaults of
  // ADR 0014 are not the same.
  const node = drawn.find(({ element }) => element.id === b).node;
  const focused = touch(drawn, node, null);
  assert.deepEqual(mixOf(drawn, focused), ['primaryContent:0', `${a}:0`, `${b}:1`]);
  assert.equal(touch(drawn, node, focused), null);
  assert.deepEqual(mixOf(drawn, null), ['primaryContent:1', `${a}:0`, `${b}:0`]);
});

test('a node the composition does not hold answers nothing at all', () => {
  const { mv, offer, at } = multiview();
  const [a] = offer.views.map((view) => view.id);
  mv.raise(offer, a);
  const drawn = compose([], mv.activeAt(at));

  // The node brought ahead of time is the one that exists without being in the
  // composition, and the node of a box that came down is the same case one pass
  // later. Neither is a box anybody can touch -- `place` only gives pointers to
  // what is drawn -- and neither has a window to be measured against when its
  // asset runs out, so the answer is nothing and every caller reads it as
  // nothing to do.
  assert.equal(entryOf(drawn, 'node-brought-ahead'), null);
  assert.equal(entryOf([], drawn[0].node), null);
});
