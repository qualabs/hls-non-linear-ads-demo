// multiview-state.test.js -- the tests of T-05 of phase 11.
//
// What they are for: the machine that decides WHAT IS DRAWN once whoever is
// watching starts choosing. It is the one piece of this phase whose errors are
// not errors on a screen -- a state that cannot be drawn shows up as a box that
// is missing, a box holding somebody else's picture, or a grid that quietly
// stops accepting a fifth camera by drawing it on top of a fourth.
//
// WHAT GIVES THE VALIDATION A WAY TO FAIL, and it is the point of this file:
// the operations of the module cannot produce a broken state, so a test that
// only drove the operations would prove nothing about the checking. The broken
// states here are HAND-WRITTEN on purpose -- five boxes, the same view twice,
// the enlarged one not on the grid, an id that is not in the catalogue -- and
// what is asserted is the refusal. Alongside them, and just as load-bearing, is
// the control: the same shape written by hand and LEGAL is accepted, because a
// validation that refused everything would pass every rejection test in here.
//
// The surface is the pure functions of `lib/multiview.js` plus the decorator,
// and the one thing borrowed from the rendering side is `planComposition`,
// which is pure and is what answers whether a node survives a change of the
// composition. No DOM, no browser, no network.
//
// The data is the real offer, in `test/fixtures/asset-lists/`, resolved through
// the layer underneath rather than hand-built, so what is under test is fed the
// same objects the library feeds it. The cases that are INVENTED -- a catalogue
// longer than the grid, above all -- are built out of it in the open, right
// where they are used, and each one says so.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  DEFAULT_AD_VOLUME,
  DEFAULT_PRIMARY_VOLUME,
  MAX_BOXES,
  activeAt,
  isOffer,
  resolveAssetList,
  viewportsFor
} from '../lib/signalling.js';
import {
  PRIMARY_ID,
  createMultiview,
  elementsOf,
  emptySelection,
  enlarge,
  exit,
  lower,
  raise,
  rowsOf,
  selection,
  shrink,
  toggle,
  validate
} from '../lib/multiview.js';
import { planComposition } from '../lib/renderer.js';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

/** The identifier of the Date Range, which everything of one window shares. */
const ID = 'MV-1-OFFER';

/** The second of playback the window this list was copied from opens at. */
const SLOT_START = 45;

/** The offer as it is served: one asset, one item, three views of 60 s. */
function offer({ id = ID, slotStart = SLOT_START } = {}) {
  const list = readJson('./fixtures/asset-lists/asset-list-offer-3.json');
  return resolveAssetList(list, { id, slotStart })[0];
}

/**
 * A catalogue LONGER THAN THE GRID, which is the normal case and not the error
 * case (ADR 0066): a playlist can announce eight cameras and the screen still
 * holds four boxes. INVENTED HERE, out of the real one, by repeating its views
 * under ids of their own -- what is exercised is the length of the list and not
 * what is inside each row.
 */
function longOffer() {
  const list = readJson('./fixtures/asset-lists/asset-list-offer-3.json');
  const item = list.ASSETS[0]['X-AD-CREATIVE-SIGNALING'].payload[0];
  item.views = item.views.concat(item.views.slice(0, 2).map((view, i) => ({
    ...view, id: `${view.id}-again-${i}`, name: `${view.name} (again)`
  })));
  return resolveAssetList(list, { id: ID, slotStart: SLOT_START })[0];
}

/** An ad, which is everything this module has to leave exactly as it found it. */
function ad() {
  const list = readJson('./fixtures/asset-lists/asset-list-cornerOverlay.json');
  return resolveAssetList(list, { id: 'AD-1', slotStart: 20 });
}

/** The provider of ADR 0003 over a fixed list, which is all the decorator reads. */
function providerOf(experiences) {
  return {
    activeAt: (time) => activeAt(experiences, time),
    programRanges: () => ({ ranges: [], settled: true }),
    experiences
  };
}

/** The ids of the views of an offer, in the order the catalogue lists them. */
const idsOf = (o) => o.views.map((view) => view.id);

/** Halfway into a window, which is where everything here is asked about. */
const inside = (experience) => experience.startTime + experience.duration / 2;

// ---------------------------------------------------------------------------
// 1. The decoration: same signature, and everything that is not an offer goes
//    through untouched
// ---------------------------------------------------------------------------

test('an ad goes through the decorator as the same object, elements and all', () => {
  const ads = ad();
  const inner = providerOf(ads);
  const mv = createMultiview(inner);
  const time = inside(ads[0]);
  const through = mv.activeAt(time);
  const direct = inner.activeAt(time);
  assert.ok(direct.length, 'the fixture has to be active at this second for the case to exist');
  assert.equal(through.length, direct.length);
  // IDENTITY and not equality: the rendering side matches a node brought ahead
  // of time against the element object the contract handed over, so an ad that
  // came back merely EQUAL would build a node it already had. This is the
  // assertion that says the ad path is not touched at all.
  through.forEach((experience, i) => assert.equal(experience, direct[i]));
  assert.equal(through[0].elements, direct[0].elements);
});

test('programRanges is the one underneath, unchanged', () => {
  const ranges = { ranges: [{ id: 'AD-1', kind: 'concurrent', startTime: 20, duration: 10 }], settled: true };
  const mv = createMultiview({ activeAt: () => [], programRanges: () => ranges, experiences: [] });
  assert.deepEqual(mv.programRanges(), ranges);
});

test('with nothing raised the offer comes back untouched, which is the programme as it was', () => {
  const o = offer();
  const mv = createMultiview(providerOf([o]));
  const [through] = mv.activeAt(inside(o));
  // The same object, because there is nothing to compose: one box is no
  // composition at all (ADR 0065), and the layer underneath already said so by
  // resolving an offer with no elements.
  assert.equal(through, o);
  assert.deepEqual(through.elements, []);
  assert.ok(isOffer(through), 'it is still recognisable as an offer downstream');
});

// ---------------------------------------------------------------------------
// 2. A broken state is refused, and it has to be written by hand to exist
// ---------------------------------------------------------------------------

test('the control: the same shape, written by hand and legal, is accepted', () => {
  // Without this one every rejection below would pass on a validation that
  // refused everything, which is the failure this repository has already
  // written twice.
  const o = offer();
  const [a, b] = idsOf(o);
  const legal = validate({ offer: o, raised: [a, b], enlarged: b });
  assert.deepEqual(legal.raised, [a, b]);
  assert.equal(validate({ offer: o, raised: [], enlarged: null }).enlarged, null);
});

test('a hand-written state with five boxes is refused, and the cap counts the programme', () => {
  const o = longOffer();
  const ids = idsOf(o);
  assert.ok(ids.length >= MAX_BOXES, 'the catalogue has to be longer than the grid for this case');
  // Four views up is FIVE boxes, because the programme is one of them. The
  // fifth box is the one nothing on a screen would report: the table of shapes
  // has no row for it, so what would be drawn is four boxes and a camera
  // nobody can see.
  assert.throws(() => validate({ offer: o, raised: ids.slice(0, MAX_BOXES), enlarged: null }),
    new RegExp(`${MAX_BOXES + 1} boxes`));
  assert.throws(() => selection(o, ids.slice(0, MAX_BOXES)), /boxes/);
  // And the last legal one is accepted, so the refusal is a cap and not a wall.
  assert.equal(selection(o, ids.slice(0, MAX_BOXES - 1)).raised.length, MAX_BOXES - 1);
});

test('a hand-written state with the same view twice is refused', () => {
  const o = offer();
  const [a] = idsOf(o);
  // Two boxes of one camera is two decoders on one feed and a row of the
  // selector that cannot say which of them it is about.
  assert.throws(() => validate({ offer: o, raised: [a, a], enlarged: null }), /twice/);
});

test('a hand-written state whose enlarged box is not on the grid is refused', () => {
  const o = offer();
  const [a, b] = idsOf(o);
  assert.throws(() => validate({ offer: o, raised: [a], enlarged: b }), /is not on the grid/);
  // And with nothing raised there is no box to enlarge: the composition is one
  // box, which is the programme as it was.
  assert.throws(() => validate({ offer: o, raised: [], enlarged: a }), /no composition/);
  assert.throws(() => validate({ offer: o, raised: [], enlarged: PRIMARY_ID }), /no composition/);
});

test('a hand-written state naming a view the offer does not announce is refused', () => {
  const o = offer();
  assert.throws(() => validate({ offer: o, raised: ['view-that-is-not-there'], enlarged: null }),
    /is not a view of this offer/);
});

test('a state that is not a selection at all is refused, and each one says which', () => {
  assert.throws(() => validate(null), /has to be an object/);
  assert.throws(() => validate({ offer: { views: [] }, raised: 'view-1' }), /list of view ids/);
  // An ad is not an offer: a selection has nowhere to live on one.
  assert.throws(() => validate({ offer: ad()[0], raised: [] }), /announces no views/);
});

test('what an operation returns is frozen, so the chrome cannot re-compose the screen', () => {
  const o = offer();
  const [a] = idsOf(o);
  const state = raise(emptySelection(o), a);
  assert.throws(() => { state.raised = []; }, TypeError);
  assert.throws(() => { state.raised.push('x'); }, TypeError);
  assert.throws(() => { state.enlarged = a; }, TypeError);
});

// ---------------------------------------------------------------------------
// 3. The cases that count
// ---------------------------------------------------------------------------

test('raising the first view is what entering the multi view is, and there is no other door', () => {
  const o = offer();
  const [a] = idsOf(o);
  const before = emptySelection(o);
  const after = raise(before, a);
  // A new state and not a mutation: what was there before still reads as it did.
  assert.deepEqual(before.raised, []);
  assert.deepEqual(after.raised, [a]);
  assert.deepEqual(elementsOf(before), []);
  const elements = elementsOf(after);
  assert.equal(elements.length, 2);
  assert.deepEqual(elements.map((e) => e.id), [PRIMARY_ID, a]);
});

test('with the grid full a view that is not up is refused, and its row says so', () => {
  const o = longOffer();
  const ids = idsOf(o);
  const full = ids.slice(0, MAX_BOXES - 1).reduce(raise, emptySelection(o));
  assert.equal(elementsOf(full).length, MAX_BOXES);
  // The cap is of the SCREEN and not of the offer: the catalogue keeps every
  // row it had, and what changes is that the ones that are not up cannot go up.
  const rows = rowsOf(full);
  assert.equal(rows.length, ids.length + 1);
  const disabled = rows.filter((row) => row.disabled).map((row) => row.id);
  assert.deepEqual(disabled, ids.slice(MAX_BOXES - 1));
  assert.ok(rows.filter((row) => row.checked).every((row) => !row.disabled),
    'a full grid stays untickable and never unremovable');
  assert.throws(() => raise(full, ids[MAX_BOXES - 1]), /boxes/);
  // And the way past it is the one ADR 0066 describes: lower one, raise another.
  const swapped = raise(lower(full, ids[0]), ids[MAX_BOXES - 1]);
  assert.deepEqual(swapped.raised, [ids[1], ids[2], ids[3]]);
});

test('lowering the last view leaves one box, which is the way out and not a case of its own', () => {
  const o = offer();
  const [a] = idsOf(o);
  const up = raise(emptySelection(o), a);
  const down = lower(up, a);
  assert.deepEqual(down.raised, []);
  // No composition, which is what the rendering side reads as `clear()`: the
  // last camera going down and the button of the way out end in one event.
  assert.deepEqual(elementsOf(down), []);
  assert.deepEqual(elementsOf(exit(up)), []);
  assert.deepEqual(exit(up), down);
});

test('lowering the box that is enlarged takes the enlargement with it', () => {
  const o = offer();
  const [a, b] = idsOf(o);
  const big = enlarge(raise(raise(emptySelection(o), a), b), b);
  assert.equal(big.enlarged, b);
  const after = lower(big, b);
  assert.equal(after.enlarged, null, 'nothing points at a box that is not on the screen');
  // And lowering ANOTHER box leaves the enlargement where it was.
  assert.equal(lower(big, a).enlarged, b);
});

test('an offer that closes with views raised draws nothing, and leaves nothing behind', () => {
  const o = offer();
  const [a] = idsOf(o);
  const mv = createMultiview(providerOf([o]));
  mv.raise(o, a);
  assert.equal(mv.activeAt(inside(o))[0].elements.length, 2);
  // The window closes and the composition goes with it, by the only route
  // there is: nothing is active, so there is nothing to draw.
  assert.deepEqual(mv.activeAt(o.startTime + o.duration), []);
  // And the selection of one window is not the selection of another: a second
  // offer opens with nothing raised, which is the programme as it was.
  const second = offer({ id: 'MV-2-OFFER', slotStart: 120 });
  const two = createMultiview(providerOf([o, second]));
  two.raise(o, a);
  const [through] = two.activeAt(inside(second));
  assert.equal(through, second);
  assert.deepEqual(through.elements, []);
});

// ---------------------------------------------------------------------------
// 4. The programme is always checked, and it is locked
// ---------------------------------------------------------------------------

test('the programme is the first row, ticked and locked, and no gesture takes it down', () => {
  const o = offer();
  const [a] = idsOf(o);
  const rows = rowsOf(emptySelection(o));
  assert.deepEqual(rows[0], {
    id: PRIMARY_ID, name: o.primaryName, checked: true, locked: true, disabled: false
  });
  assert.ok(rows.slice(1).every((row) => !row.locked && !row.checked));
  // It carries the clock everything else is placed against, so lowering it
  // would leave it playing and invisible -- a state the contract has no shape
  // for (ADR 0067).
  const state = raise(emptySelection(o), a);
  assert.throws(() => lower(state, PRIMARY_ID), /cannot be taken off the grid/);
  assert.throws(() => raise(state, PRIMARY_ID), /always on the grid/);
  assert.throws(() => toggle(state, PRIMARY_ID), /always on the grid/);
  // And it is the first box of every composition there is.
  const ids = idsOf(o);
  for (const n of [1, 2, 3]) {
    const up = ids.slice(0, n).reduce(raise, emptySelection(o));
    assert.equal(elementsOf(up)[0].id, PRIMARY_ID);
    assert.equal(elementsOf(up)[0].primary, true);
  }
});

// ---------------------------------------------------------------------------
// 5. The composition the state resolves into
// ---------------------------------------------------------------------------

test('the boxes are the shapes of the table, in the order the views were raised', () => {
  const o = offer();
  const [a, b] = idsOf(o);
  // Raised in reverse of the catalogue on purpose: the order of the boxes is
  // the order of the SELECTION, and a table read in the catalogue's order
  // instead is every box holding somebody else's picture with nothing on a
  // screen saying so.
  const state = raise(raise(emptySelection(o), b), a);
  const elements = elementsOf(state);
  assert.deepEqual(elements.map((e) => e.id), [PRIMARY_ID, b, a]);
  const shapes = viewportsFor(3).map((viewport) => {
    const [top, right, bottom, left] = viewport.split(' ').map(Number);
    return { top, right, bottom, left };
  });
  assert.deepEqual(elements.map((e) => e.box), shapes);
  // Ascending by zDepth, which is rule 2 of the contract and the order the
  // rendering side draws in.
  assert.deepEqual(elements.map((e) => e.zDepth), [0, 1, 2]);
});

test('the opening mix is the programme sounding and the views silent', () => {
  const o = offer();
  const [a, b] = idsOf(o);
  const elements = elementsOf(raise(raise(emptySelection(o), a), b));
  assert.equal(elements[0].volume, DEFAULT_PRIMARY_VOLUME);
  assert.deepEqual(elements.slice(1).map((e) => e.volume), [DEFAULT_AD_VOLUME, DEFAULT_AD_VOLUME]);
});

test('a view carries its uri and its MIME into the box, which is what fills it', () => {
  const o = offer();
  const [a] = idsOf(o);
  const view = o.views.find((v) => v.id === a);
  const [primary, box] = elementsOf(raise(emptySelection(o), a));
  assert.equal(box.uri, view.uri);
  // The field that is silent when it is dropped: the MIME decides how the asset
  // is put in the box, and a box with none looks like a box that is still
  // loading.
  assert.equal(box.mediaType, view.mediaType);
  assert.ok(box.mediaType, 'the fixture declares one, or this assertion proves nothing');
  // And the programme brings neither, because it is already on the screen.
  assert.equal(primary.uri, null);
  assert.equal(primary.mediaType, null);
});

test('enlarging puts one box at full frame above the others, and leaves them where they are', () => {
  const o = offer();
  const [a, b] = idsOf(o);
  const grid = raise(raise(emptySelection(o), a), b);
  const before = elementsOf(grid);
  const after = elementsOf(enlarge(grid, b));
  const big = after.find((e) => e.id === b);
  assert.deepEqual(big.box, { top: 0, right: 0, bottom: 0, left: 0 });
  assert.equal(big.zDepth, Math.max(...before.map((e) => e.zDepth)) + 1);
  assert.equal(after[after.length - 1].id, b, 'and it is last, so the list stays ascending');
  // The others stay where they are, playing, covered (ADR 0069).
  for (const id of [PRIMARY_ID, a]) {
    assert.deepEqual(after.find((e) => e.id === id), before.find((e) => e.id === id));
  }
  // Shrinking gives the geometry back and touches nothing else: the audio is
  // not in this state at all, so there is nothing here that could let it go.
  assert.deepEqual(elementsOf(shrink(enlarge(grid, b))), before);
  assert.deepEqual(shrink(enlarge(grid, b)), grid);
});

test('the programme can be the enlarged box, because it is a box like the others', () => {
  const o = offer();
  const [a] = idsOf(o);
  const elements = elementsOf(enlarge(raise(emptySelection(o), a), PRIMARY_ID));
  const big = elements[elements.length - 1];
  assert.equal(big.id, PRIMARY_ID);
  assert.deepEqual(big.box, { top: 0, right: 0, bottom: 0, left: 0 });
});

test('what is not on the grid cannot be enlarged, and neither can nothing', () => {
  const o = offer();
  const [a, b] = idsOf(o);
  assert.throws(() => enlarge(raise(emptySelection(o), a), b), /is not on the grid/);
  assert.throws(() => enlarge(emptySelection(o), a), /no box to enlarge/);
});

// ---------------------------------------------------------------------------
// 6. The frame loop, which is where this is actually called from
// ---------------------------------------------------------------------------

test('for one selection the composition is the same object, which is what the preload matches on', () => {
  const o = offer();
  const [a] = idsOf(o);
  const mv = createMultiview(providerOf([o]));
  mv.raise(o, a);
  const first = mv.activeAt(inside(o))[0];
  const second = mv.activeAt(inside(o) + 0.016)[0];
  // IDENTITY, and it is not tidiness: a node brought ahead of time is matched
  // against the element object the contract handed over, so a composition
  // rebuilt every frame would throw away the node it had ready and build a cold
  // one at the exact moment the box appears.
  assert.equal(first, second);
  assert.equal(first.elements, second.elements);
  first.elements.forEach((element, i) => assert.equal(element, second.elements[i]));
  // And a change of the selection is a new one, because the geometry changed.
  mv.raise(o, idsOf(o)[1]);
  assert.notEqual(mv.activeAt(inside(o))[0], first);
});

test('asking about a time ahead of now does not touch what is raised now', () => {
  // The rendering side calls `activeAt` TWICE per frame, at two different
  // times: once for now, and once for three seconds ahead, which is how the ad
  // that comes next is brought in before its turn. A module that adopted "the
  // offer" from whatever it was last asked about would drop a selection three
  // seconds before its window ended, on a call that is not even about it.
  const o = offer();
  const next = offer({ id: 'MV-2-OFFER', slotStart: SLOT_START + 200 });
  const [a] = idsOf(o);
  const mv = createMultiview(providerOf([o, next]));
  mv.raise(o, a);
  const now = o.startTime + o.duration - 1;
  assert.equal(mv.activeAt(now)[0].elements.length, 2);
  mv.activeAt(now + 3);                 // the look-ahead: past the end of the window
  mv.activeAt(now + 200);               // and well into the next one
  assert.equal(mv.activeAt(now)[0].elements.length, 2, 'the selection is still there');
  assert.deepEqual(mv.selectionFor(o).raised, [a]);
});

test('the handle drives the same operations, on the offer a gesture was made on', () => {
  const o = offer();
  const [a, b] = idsOf(o);
  const mv = createMultiview(providerOf([o]));
  assert.deepEqual(mv.rows(o).map((row) => row.checked), [true, false, false, false]);
  mv.toggle(o, a);
  assert.deepEqual(mv.selectionFor(o).raised, [a]);
  mv.toggle(o, a);
  assert.deepEqual(mv.selectionFor(o).raised, []);
  mv.raise(o, a);
  mv.raise(o, b);
  mv.enlarge(o, b);
  assert.equal(mv.selectionFor(o).enlarged, b);
  mv.shrink(o);
  assert.equal(mv.selectionFor(o).enlarged, null);
  mv.exit(o);
  assert.deepEqual(mv.selectionFor(o).raised, []);
  assert.deepEqual(mv.activeAt(inside(o))[0].elements, []);
  // And the offer active at a second, which is what tells the chrome there is
  // anything to offer at all.
  assert.equal(mv.offerAt(inside(o)), o);
  assert.equal(mv.offerAt(o.startTime + o.duration), null);
  assert.throws(() => mv.rows(ad()[0]), /not an offer/);
});

// ---------------------------------------------------------------------------
// 7. What the state costs on the screen, which is the whole reason it is a
//    state and not an identity
// ---------------------------------------------------------------------------

test('raising a view keeps every node that was already up, and only builds the new one', () => {
  const o = offer();
  const [a, b] = idsOf(o);
  const one = raise(emptySelection(o), a);
  const two = raise(one, b);
  // The repartition of ADR 0070, over the elements this module produces: what
  // is on screen against what has to be. Nothing is destroyed and one node is
  // built, which is the property the whole design is for -- a camera going up
  // costs one buffer and not one per box.
  const drawn = elementsOf(one).map((element) => ({ element, experience: o }));
  const plan = planComposition(drawn, [{ ...o, elements: elementsOf(two) }]);
  assert.equal(plan.create.length, 1);
  assert.equal(plan.create[0].element.id, b);
  assert.equal(plan.destroy.length, 0);
  assert.equal(plan.keep.length, 2);
  // And the two that stayed have somewhere to travel to, because the shape
  // changed under them.
  assert.deepEqual(plan.move.map((slot) => slot.element.id), [PRIMARY_ID, a]);
});

test('enlarging builds nothing and destroys nothing: it moves one box', () => {
  const o = offer();
  const [a, b] = idsOf(o);
  const grid = raise(raise(emptySelection(o), a), b);
  const drawn = elementsOf(grid).map((element) => ({ element, experience: o }));
  const plan = planComposition(drawn, [{ ...o, elements: elementsOf(enlarge(grid, b)) }]);
  assert.equal(plan.create.length, 0);
  assert.equal(plan.destroy.length, 0);
  assert.deepEqual(plan.move.map((slot) => slot.element.id), [b]);
});
