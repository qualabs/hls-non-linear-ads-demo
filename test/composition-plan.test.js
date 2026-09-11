// composition-plan.test.js -- the test of T-01 of the phase of the multi view.
//
// What it is for: the repartition of ADR 0070, which is the one change of this
// phase that touches the code drawing the ads that already work, and whose
// failure is invisible. Everything else a wrong composition does is on the
// screen -- a box in the wrong place, a picture that jumps -- but these are not:
//
//   WHICH NODE IS RECOGNISED AS WHICH. A composition that changes shape keeps
//   the nodes that survive, and which ones those are is decided by comparing
//   identities. Compare by the wrong field and one advertiser is handed another
//   advertiser's box, with every box on screen still in its right place.
//
//   WHETHER THE COMPOSITION IS EXACTLY THE TARGET. The two functions this
//   replaced were total -- they emptied the composition and filled it again --
//   and that is what bought the property that it could not be left half done.
//   Being incremental has to buy the same property some other way, and "some
//   other way" is the thing a test has to hold.
//
//   WHETHER THE TWO ROUTES AGREE. For an experience that does not change, going
//   incrementally and going totally have to leave the same composition: the
//   same elements, in the same boxes, in the same stacking order. THE SEVENTY
//   TWO TESTS THAT WERE HERE BEFORE THIS PHASE WERE WRITTEN AGAINST THE TOTAL
//   BEHAVIOUR, so they pass in full while this is broken, and that is the whole
//   reason this assertion is new instead of already existing.
//
// Same door as the other suites and the same restriction: the pure functions
// and nothing else. No DOM, no browser. `applyPlan` takes its two halves --
// what makes a node and what takes one off -- as arguments, so the part that
// decides runs here exactly as it runs in a browser, over fake entries.
//
// The data is the real one, in `test/fixtures/asset-lists/`. Three cases are
// CONSTRUCTED and they say so where they are written: an experience whose boxes
// changed without its identity changing, which is what a composition somebody
// watching is rearranging looks like; two breaks overlapping with boxes that
// carry the same name; and a layout with two boxes that name themselves not at
// all.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { resolveAssetList, resolveExperience } from '../lib/signalling.js';
import { planComposition, applyPlan, identityOf, sameGeometry } from '../lib/renderer.js';

/** The experiences of one asset-list, resolved as the renderer gets them. */
function experiencesOf(list, { id = list, slotStart = 0 } = {}) {
  const json = JSON.parse(readFileSync(new URL(`./fixtures/asset-lists/${list}`, import.meta.url), 'utf8'));
  return resolveAssetList(json, { id, slotStart });
}

const one = (list, options) => experiencesOf(list, options)[0];

/**
 * The two halves `applyPlan` needs, faked: an entry is a plain object carrying
 * what the renderer's entries carry of the contract, plus the name of the node
 * that was made for it, so that a node handed to two slots is visible.
 */
let nodes = 0;

function halves() {
  const log = [];
  const made = [];
  const released = [];
  return {
    log,
    made,
    released,
    parts: {
      build: (create) => {
        log.push(`build:${create.length}`);
        return create.map((slot) => {
          const entry = {
            element: slot.element,
            experience: slot.experience,
            node: `node-${++nodes}`
          };
          made.push(entry);
          return entry;
        });
      },
      clear: (destroy) => {
        log.push(`clear:${destroy.length}`);
        released.push(...destroy);
      }
    }
  };
}

/** One pass of the composition: the plan, applied, with what it made and let go. */
function compose(drawn, target) {
  const plan = planComposition(drawn, target);
  const { parts, made, released, log } = halves();
  const next = applyPlan(plan, parts);
  return { plan, next, made, released, log };
}

/** The composition, as the screen would show it: who, where, and in what order. */
const shapeOf = (entries) => entries.map(({ element, experience }) =>
  `${experience.itemId}/${element.id} z${element.zDepth} ` +
  `[${element.box.top} ${element.box.right} ${element.box.bottom} ${element.box.left}]`);

/** Which node is drawing each element, which is what "the node survived" means. */
const nodesOf = (entries) => entries.map((entry) => entry.node);

/**
 * The same experience with one of its boxes somewhere else and everything else
 * untouched -- same `itemId`, same element ids, same order. CONSTRUCTED: it is
 * the shape the composition takes when somebody watching rearranges it, which
 * no asset-list of the fixtures can carry because none of them changes.
 */
function reboxed(experience, id, box) {
  return {
    ...experience,
    elements: experience.elements.map((element) =>
      (element.id === id ? { ...element, box: { ...element.box, ...box } } : element))
  };
}

// --- The borders of the repartition ----------------------------------------

test('with nothing drawn, every element of the target is created and nothing is destroyed', () => {
  const target = [one('asset-list-squeezebackLShape.json')];
  const { plan, next } = compose([], target);
  assert.equal(plan.create.length, 3);   // the primary content and the two bars
  assert.equal(plan.keep.length, 0);
  assert.equal(plan.destroy.length, 0);
  assert.equal(plan.move.length, 0);
  assert.deepEqual(shapeOf(next), shapeOf(target.flatMap((e) =>
    e.elements.map((element) => ({ element, experience: e })))));
});

test('with an empty target, every entry is destroyed and the composition comes back empty', () => {
  const target = [one('asset-list-multiView.json')];
  const { next: drawn } = compose([], target);
  const { plan, next, made, released } = compose(drawn, []);
  assert.equal(plan.destroy.length, 4);
  assert.equal(plan.keep.length, 0);
  assert.equal(plan.create.length, 0);
  assert.deepEqual(released, drawn);
  assert.deepEqual(made, []);
  assert.deepEqual(next, []);
});

test('with the two sides equal, everything is kept and nothing is made or let go', () => {
  const target = [one('asset-list-cornerOverlay.json')];
  const { next: drawn } = compose([], target);
  const { plan, next, made, released } = compose(drawn, target);
  assert.equal(plan.keep.length, 2);
  assert.equal(plan.create.length, 0);
  assert.equal(plan.destroy.length, 0);
  assert.equal(plan.move.length, 0);
  assert.deepEqual(made, []);
  assert.deepEqual(released, []);
  // The same node objects, which is what "it was not rebuilt" means: a
  // composition that came back equal by being made again would pass every
  // assertion above and fail this one.
  assert.deepEqual(nodesOf(next), nodesOf(drawn));
});

test('an element that changes box without changing identity is kept, and it is the one that moves', () => {
  const quad = one('asset-list-multiView.json');
  const { next: drawn } = compose([], [quad]);
  // The quadrant of the top right corner sent to the bottom left one.
  const target = [reboxed(quad, 'view2', { top: 50, right: 50, bottom: 0, left: 0 })];
  const { plan, next, made, released } = compose(drawn, target);
  assert.equal(plan.keep.length, 4);
  assert.equal(plan.create.length, 0);
  assert.equal(plan.destroy.length, 0);
  assert.deepEqual(made, []);
  assert.deepEqual(released, []);
  // One moves and the other three do not, which is what tells `place` there is
  // anything to do at all: a repartition that answered "nothing moved" here
  // would leave the box on the screen where it was, silently.
  assert.deepEqual(plan.move.map((slot) => slot.element.id), ['view2']);
  assert.deepEqual(nodesOf(next), nodesOf(drawn));
  // And the entry carries the box that is being asked for now and not the one
  // it was made with, which is what everything downstream reads.
  assert.deepEqual(next.find((entry) => entry.element.id === 'view2').element.box,
    { top: 50, right: 50, bottom: 0, left: 0 });
});

test('a change of stacking alone is a move, because the stack is geometry too', () => {
  const quad = one('asset-list-multiView.json');
  const { next: drawn } = compose([], [quad]);
  const raised = {
    ...quad,
    elements: quad.elements.map((element) =>
      (element.id === 'view4' ? { ...element, zDepth: element.zDepth + 10 } : element))
  };
  const { plan } = compose(drawn, [raised]);
  assert.deepEqual(plan.move.map((slot) => slot.element.id), ['view4']);
});

// --- The identity, which is rule 6 of the contract --------------------------

test('the second ad of a break recognises no box of the first one as its own', () => {
  // Three ads of ONE break: they share the `id` of the signalling and differ
  // only in `itemId`, which is rule 6. A repartition comparing by `id` keeps
  // the primary content of the first ad for the second -- and, with two ads
  // naming a box the same way, hands over that box too.
  const [first, second] = experiencesOf('asset-list-multiAd.json', { id: 'BREAK' });
  assert.equal(first.id, second.id);
  assert.notEqual(first.itemId, second.itemId);
  const { next: drawn } = compose([], [first]);
  const { plan } = compose(drawn, [second]);
  assert.equal(plan.keep.length, 0);
  assert.equal(plan.destroy.length, drawn.length);
  assert.equal(plan.create.length, second.elements.length);
});

test('two overlapping breaks that name their boxes the same keep them apart', () => {
  // CONSTRUCTED, and it is the case the pair exists for: the same creative
  // signalled by two Date Ranges that overlap, so the two layouts carry the
  // same element ids. Comparing by the id of the element alone gives the second
  // break the first one's node.
  const [a] = experiencesOf('asset-list-cornerOverlay.json', { id: 'BREAK-A', slotStart: 20 });
  const [b] = experiencesOf('asset-list-cornerOverlay.json', { id: 'BREAK-B', slotStart: 24 });
  assert.deepEqual(a.elements.map((e) => e.id), b.elements.map((e) => e.id));
  assert.notEqual(identityOf(a, a.elements[1]), identityOf(b, b.elements[1]));
  const { next: drawn } = compose([], [a]);
  const { plan, next } = compose(drawn, [a, b]);
  assert.equal(plan.keep.length, 2);
  assert.equal(plan.create.length, 2);
  assert.equal(plan.destroy.length, 0);
  // The two nodes of the first break are still the first break's, and the
  // second break got two of its own.
  assert.deepEqual(nodesOf(next).slice(0, 2), nodesOf(drawn));
  assert.equal(new Set(nodesOf(next)).size, 4);
});

test('two boxes that name themselves not at all are two boxes and not one', () => {
  // CONSTRUCTED: the layout the ordinal exists for. An element with no `id`
  // resolves to a constant, so without the ordinal one key would serve two
  // boxes -- and a plan that hands one node to two slots is a composition left
  // half done.
  const nameless = resolveExperience({
    type: 'cornerOverlay',
    start: 0,
    duration: 12,
    layout: {
      assets: [
        { uri: 'a.m3u8', viewport: '0 75 75 0', zDepth: 1, volume: 0 },
        { uri: 'b.m3u8', viewport: '75 0 0 75', zDepth: 2, volume: 0 }
      ]
    }
  }, { id: 'BREAK', itemId: 'BREAK.0', slotStart: 0 });
  const [, first, second] = nameless.elements;
  assert.equal(first.id, second.id);
  assert.notEqual(identityOf(nameless, first, 0), identityOf(nameless, second, 1));
  const { plan, next } = compose([], [nameless]);
  assert.equal(plan.create.length, 3);
  assert.equal(new Set(nodesOf(next)).size, 3);
});

// --- The composition cannot be left half done -------------------------------

test('applied, the composition is exactly the target: not one node more and not one less', () => {
  const quad = one('asset-list-multiView.json');
  const overlay = one('asset-list-cornerOverlay.json', { id: 'OTHER', slotStart: 40 });
  const lshape = one('asset-list-squeezebackLShape.json', { id: 'THIRD', slotStart: 60 });
  // Every pair worth walking, including the two empties and the two that share
  // nothing, each one starting from the composition the one before it left.
  const routes = [[], [quad], [quad, overlay], [overlay], [lshape], [], [quad]];
  let drawn = [];
  for (const target of routes) {
    const { plan, next, made, released } = compose(drawn, target);
    const wanted = target.flatMap((experience) =>
      experience.elements.map((element) => ({ element, experience })));
    // One entry per element of the target, in the order the contract hands
    // them over, and every one of them serving the element it was asked for.
    assert.equal(next.length, wanted.length);
    assert.deepEqual(shapeOf(next), shapeOf(wanted));
    // No node serving two elements, which is the other shape of half done.
    assert.equal(new Set(nodesOf(next)).size, next.length);
    // And the two lists partition exactly: what was drawn is what was kept
    // plus what was let go, and what is drawn now is what was kept plus what
    // was made.
    assert.equal(plan.keep.length + released.length, drawn.length);
    assert.equal(plan.keep.length + made.length, next.length);
    for (const entry of released) assert.equal(next.includes(entry), false);
    drawn = next;
  }
});

test('what is leaving is taken off before what is arriving is made', () => {
  // The order matters on the one node the two halves share: the primary content
  // is given back to the stylesheet by the half that clears, and placed again
  // by the pass that follows. Made first and cleared after, the ad that is
  // starting would be handed a primary that was then reset under it.
  const [first, second] = experiencesOf('asset-list-multiAd.json', { id: 'BREAK' });
  const { next: drawn } = compose([], [first]);
  const { log } = compose(drawn, [second]);
  assert.deepEqual(log, [`clear:${drawn.length}`, `build:${second.elements.length}`]);
});

// --- The equivalence between the two routes ---------------------------------

test('for an experience that does not change, the incremental route and the total one agree', () => {
  // The total route is what the phase replaced: empty the composition and fill
  // it from nothing. The incremental one keeps what it can. For an experience
  // that is not changing they have to leave THE SAME COMPOSITION -- the same
  // elements, in the same boxes, in the same stacking order -- and the only
  // difference between them is how much was rebuilt to get there.
  for (const list of ['asset-list-multiView.json', 'asset-list-squeezebackLShape.json',
    'asset-list-cornerOverlay.json', 'asset-list-linear.json']) {
    const target = [one(list)];
    const { next: drawn } = compose([], target);

    const incremental = compose(drawn, target);
    const total = compose([], target);
    assert.deepEqual(shapeOf(incremental.next), shapeOf(total.next), list);

    // And what tells the two apart is the cost and nothing else: the
    // incremental route built nothing and threw nothing away, while the total
    // one built the whole composition again. That is the rebuffer of every box
    // ADR 0070 exists to remove, and it is asserted so that a repartition that
    // quietly went back to being total cannot pass this file.
    assert.equal(incremental.made.length, 0, list);
    assert.equal(incremental.released.length, 0, list);
    assert.equal(total.made.length, target[0].elements.length, list);
  }
});

test('the two routes agree over a composition that changed, once it settled', () => {
  // The same property one step further along, which is where it earns its
  // keep: a composition that arrived at its shape by three changes is the same
  // composition as one built at that shape from nothing.
  const quad = one('asset-list-multiView.json');
  const overlay = one('asset-list-cornerOverlay.json', { id: 'OTHER', slotStart: 40 });
  let drawn = [];
  for (const target of [[quad], [quad, overlay], [overlay]]) {
    drawn = compose(drawn, target).next;
  }
  assert.deepEqual(shapeOf(drawn), shapeOf(compose([], [overlay]).next));
});

// --- The comparison the fourth reason to place stands on --------------------

test('the geometry of an element is its box and its place in the stack, and nothing else', () => {
  const [element] = one('asset-list-multiView.json').elements.slice(1);
  assert.equal(sameGeometry(element, { ...element }), true);
  assert.equal(sameGeometry(element, { ...element, volume: 100 }), true);
  assert.equal(sameGeometry(element, { ...element, uri: 'other.m3u8' }), true);
  assert.equal(sameGeometry(element, { ...element, zDepth: element.zDepth + 1 }), false);
  for (const edge of ['top', 'right', 'bottom', 'left']) {
    const box = { ...element.box, [edge]: element.box[edge] + 1 };
    assert.equal(sameGeometry(element, { ...element, box }), false, edge);
  }
});
