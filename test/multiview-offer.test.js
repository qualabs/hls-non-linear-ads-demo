// multiview-offer.test.js -- the tests of T-02 of phase 11.
//
// What they are for: the door of the multi view, which is the one piece of it
// that fails without anything to look at.
//
//   THE KIND IN ITS THREE TABLES. A class becomes a `kind`, and downstream three
//   tables are indexed by that field: which kinds this player plays, what colour
//   each one is marked in, and what each one is called. A kind added to two of
//   the three throws nothing, logs nothing and draws nothing -- the range is
//   filtered out before any bar sees it, or the mark is not painted, or it is
//   painted with no tooltip. ADR 0063 names the three for that reason and asks
//   for the assertion below instead of asking somebody to remember.
//
//   THE THREE TABLES DO NOT HOLD THE SAME KEYS, and that is the correction this
//   file makes to the shortest way of saying it. The two of the chrome are
//   indexed by EVERY kind that can cross the seam, because the same bar is drawn
//   over a player already in the market and there what is played is the
//   replacement kind. The third is the list of what THIS player plays, and the
//   replacement kind is deliberately out of it (ADR 0018). So what is asserted
//   is the relation and not an equality: every kind has a colour and a name, the
//   kinds played are the kinds whose list this layer resolves, and every one of
//   those has both.
//
//   READING THE CATALOGUE. An offer announces what contents there are and says
//   nothing about where they go (ADR 0064), so a view carries `id`, `name`,
//   `type` and `uri` and NOT `viewport`, `zDepth` or `volume`. A geometry
//   obeyed here would be a box placed against a number its author never knew.
//
// The surface is the pure functions of the layer plus the three tables, and
// nothing else: no DOM, no browser, no network.
//
// The data is the real one, in `test/fixtures/asset-lists/`, and it is the first
// multi view window of the demo of the offer, copied once -- `fixtures/README.md`
// says where from, and from that copy on it belongs to this suite (ADR 0023).
// The cases that are INVENTED are built out of it in the open, right where they
// are used, and each one says so.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  BLOCK,
  CONCURRENT_CLASS,
  DEFAULT_PRIMARY_NAME,
  INTERSTITIAL_CLASS,
  KINDS_RESOLVED,
  KIND_OF_CLASS,
  LINEAR_TYPE,
  MULTIVIEW_CLASS,
  OFFER_TYPE,
  activeAt,
  isOffer,
  kindOfClass,
  rangeOfExperiences,
  resolveAssetList,
  usablePayload
} from '../lib/signalling.js';
import { KINDS_PLAYED } from '../lib/concurrent-hls.js';
import { RANGE_COLOURS, RANGE_TITLES } from '../lib/controls.js';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

/** The offer as the demo serves it: one asset, one item, three views. */
const OFFER = () => readJson('./fixtures/asset-lists/asset-list-offer-3.json');

/** The identifier of the Date Range, which everything of one window shares. */
const ID = 'MV-1-OFFER';

/** The second of playback the window this list was copied from opens at. */
const SLOT_START = 45;

/** The item of the payload, which is where the catalogue is. */
const itemOf = (assetList, asset = 0, item = 0) => assetList.ASSETS[asset][BLOCK].payload[item];

/**
 * The layer over an asset-list, with the console captured along with the
 * experiences. Captured and not muted: the fields an offer must not declare are
 * IGNORED AND SAID OUT LOUD, so the console line is the whole of the report for
 * that case and dropping it here would throw away the thing being tested.
 */
function resolveWithConsole(assetList, { id = ID, slotStart = SLOT_START } = {}) {
  const said = { log: [], warn: [], error: [] };
  const original = { log: console.log, warn: console.warn, error: console.error };
  for (const level of Object.keys(said)) {
    console[level] = (...args) => said[level].push(args.join(' '));
  }
  try {
    return { experiences: resolveAssetList(assetList, { id, slotStart }), said };
  } finally {
    Object.assign(console, original);
  }
}

const resolve = (assetList, options) => resolveWithConsole(assetList, options).experiences;

// ---------------------------------------------------------------------------
// 1. The class, and the kind it becomes
// ---------------------------------------------------------------------------

test('the class of the offer is the third kind the layer translates, and the other two do not move', () => {
  assert.equal(kindOfClass(MULTIVIEW_CLASS), 'multiview');
  // The two that were already there, asserted here because this is the change
  // that could have moved them: a table is edited, and a table is where an
  // entry gets overwritten instead of added.
  assert.equal(kindOfClass(CONCURRENT_CLASS), 'concurrent');
  assert.equal(kindOfClass(INTERSTITIAL_CLASS), 'interstitial');
  // A class is compared by EXACT equality of the string, which is the whole
  // reason ADR 0063 makes the three siblings instead of relatives: there is no
  // inheritance and there is no case folding, so a tag that spells it
  // differently is not this experience and is not a range at all.
  assert.equal(kindOfClass(MULTIVIEW_CLASS.toLowerCase()), null);
  assert.equal(kindOfClass('com.qualabs.hls.multiView'), null);
  assert.equal(kindOfClass(undefined), null);
});

test('the window of an offer is one this layer goes and reads, and the replacement kind is not', () => {
  // What decides whether the list is fetched is the kind and not the class, and
  // the offer is on the side that has a list to read. The replacement kind is
  // reported off its own tag, because nothing on this side plays it.
  assert.ok(KINDS_RESOLVED.has('multiview'));
  assert.ok(KINDS_RESOLVED.has('concurrent'));
  assert.ok(!KINDS_RESOLVED.has('interstitial'));
});

// ---------------------------------------------------------------------------
// 2. The three tables indexed by the kind
// ---------------------------------------------------------------------------

/** Every kind the layer can hand over, which is what the chrome is indexed by. */
const KINDS = [...new Set(Object.values(KIND_OF_CLASS))].sort();

test('every kind that can cross the seam has a colour and a name', () => {
  // EQUALITY and not inclusion, in both directions at once: a kind added to the
  // translation and not to these two is a mark that is not drawn or a mark with
  // no tooltip, and a key left in here for a kind that no longer exists is a
  // table describing something else.
  assert.deepEqual(Object.keys(RANGE_COLOURS).sort(), KINDS,
    'the colours are indexed by every kind of range, and by no other key');
  assert.deepEqual(Object.keys(RANGE_TITLES).sort(), KINDS,
    'the names are indexed by every kind of range, and by no other key');
  // And told apart, which is what the colours are for: two kinds of the same
  // colour is a bar that marks two things and shows one.
  assert.equal(new Set(Object.values(RANGE_COLOURS)).size, KINDS.length);
  assert.equal(new Set(Object.values(RANGE_TITLES)).size, KINDS.length);
  for (const kind of KINDS) {
    assert.match(RANGE_COLOURS[kind], /^#[0-9a-f]{6}$/i, `${kind} is drawn in a colour`);
    assert.ok(RANGE_TITLES[kind].length > 0, `${kind} is called something`);
  }
});

test('the kinds this player plays are the kinds whose list it reads, and each one is drawn and named', () => {
  // THE THIRD TABLE, and the relation that holds it to the other two. It is not
  // the same set as theirs and it must not become one: what a bar marks is what
  // ITS player plays (ADR 0018), and the replacement kind is somebody else's
  // playback. What it IS equal to is the list of kinds this layer resolves into
  // experiences, because an experience this player draws is a break this player
  // plays -- two lists decided in two files for two reasons, and the same list.
  assert.deepEqual([...KINDS_PLAYED].sort(), [...KINDS_RESOLVED].sort(),
    'what the bar marks and what the layer resolves are the same list of kinds');
  assert.ok(!KINDS_PLAYED.has('interstitial'),
    'the replacement kind is deliberately not played here, which is why the three tables differ');
  // And the miss that reports nothing: a kind this player plays with no colour
  // is a break missing from the bar, and a break missing from the bar looks
  // exactly like a break that was never signalled.
  for (const kind of KINDS_PLAYED) {
    assert.ok(KINDS.includes(kind), `${kind} is a kind the layer can hand over`);
    assert.ok(RANGE_COLOURS[kind], `${kind} is played by this player and has no colour`);
    assert.ok(RANGE_TITLES[kind], `${kind} is played by this player and has no name`);
  }
});

test('the kind of the offer is in the three tables', () => {
  // The same three assertions, on the one kind this task adds, spelled out so
  // that the failure names it. The general ones above go red too; this one says
  // which kind and which table.
  assert.ok(KINDS_PLAYED.has('multiview'), 'a range of the offer reaches no bar');
  assert.ok(RANGE_COLOURS.multiview, 'a range of the offer is not drawn');
  assert.ok(RANGE_TITLES.multiview, 'a mark of the offer has no tooltip');
});

test('the window of an offer is a range of its own kind, and that is what the bar filters by', () => {
  const experiences = resolve(OFFER());
  const range = rangeOfExperiences(ID, experiences, 'multiview');
  assert.deepEqual(range, { id: ID, kind: 'multiview', startTime: 45, duration: 60 });
  assert.ok(KINDS_PLAYED.has(range.kind), 'the range survives the filter of the bar');
  // The kind comes from the class of the tag and not from what the list turned
  // out to hold, and the default is the one every caller produced before this
  // task: the concurrent ad.
  assert.equal(rangeOfExperiences(ID, experiences).kind, 'concurrent');
});

// ---------------------------------------------------------------------------
// 3. Reading the catalogue
// ---------------------------------------------------------------------------

test('the offer resolves to one experience with its three views, in order and with their names', () => {
  const { experiences, said } = resolveWithConsole(OFFER());
  assert.equal(experiences.length, 1);
  const [offer] = experiences;
  assert.equal(offer.type, OFFER_TYPE);
  assert.equal(offer.id, ID);
  assert.equal(offer.itemId, `${ID}.0`);
  assert.equal(offer.startTime, 45);
  assert.equal(offer.duration, 60);
  assert.equal(offer.primaryName, 'Tears of Steel');
  // NO ELEMENTS. An offer announces a catalogue and not a layout, so with
  // nobody having chosen anything there is one box on the screen, which is no
  // composition at all: whoever draws this draws the programme as it was.
  assert.deepEqual(offer.elements, []);
  // The order of the catalogue is the order it was declared in, and it is
  // asserted because it is the order the boxes are laid out in.
  assert.deepEqual(offer.views.map((v) => v.id),
    ['view-caminandes-a', 'view-caminandes-b', 'view-ed-a']);
  assert.deepEqual(offer.views.map((v) => v.name),
    ['Caminandes, early', 'Caminandes, late', 'Elephants Dream, early']);
  assert.deepEqual(offer.views.map((v) => v.uri), [
    '/content/view-caminandes-a/index.m3u8',
    '/content/view-caminandes-b/index.m3u8',
    '/content/view-ed-a/index.m3u8'
  ]);
  for (const view of offer.views) {
    assert.equal(view.mediaType, 'application/vnd.apple.mpegurl');
    // FOUR FIELDS AND NOT SEVEN: a view of an offer is an element of the
    // contract short of exactly the geometry, because the geometry depends on
    // how many boxes there are and that is not known here (ADR 0064).
    assert.deepEqual(Object.keys(view).sort(), ['id', 'mediaType', 'name', 'uri']);
  }
  // A catalogue that reads cleanly says nothing, and the fallback of ADR 0019
  // did not fire on it.
  assert.deepEqual(said.warn, []);
  assert.deepEqual(said.error, []);
});

test('a view that declares a geometry is ignored, and the layer says so', () => {
  // INVENTED: the same offer with the three fields an offer does not carry
  // added to its first view. Obeying them would place a box against a number
  // their author never knew; refusing the offer over them would take the whole
  // catalogue away because of a stray key, which is the fallback of ADR 0019
  // firing for a reason nobody can see on a screen.
  const list = OFFER();
  Object.assign(itemOf(list).views[0], { viewport: '0 50 50 0', zDepth: 3, volume: 100 });
  const { experiences, said } = resolveWithConsole(list);
  assert.equal(experiences.length, 1, 'the offer is read and not refused');
  const [view] = experiences[0].views;
  assert.deepEqual(Object.keys(view).sort(), ['id', 'mediaType', 'name', 'uri']);
  assert.equal(said.warn.length, 1, 'said once, for the one view that declared them');
  for (const field of ['viewport', 'zDepth', 'volume']) {
    assert.ok(said.warn[0].includes(field), `the warning names ${field}`);
  }
});

test('an offer with no primaryName is a usable offer', () => {
  // INVENTED: the same offer with its label taken out. The programme is one row
  // of the list somebody reads, so it needs a name; whoever publishes is the
  // only one who knows it, and when he does not say, the library has one of its
  // own (ADR 0064).
  const list = OFFER();
  delete itemOf(list).primaryName;
  const [offer] = resolve(list);
  assert.equal(offer.primaryName, DEFAULT_PRIMARY_NAME);
  assert.ok(DEFAULT_PRIMARY_NAME.length > 0, 'the constant is a label and not an empty string');
  // The three views are read exactly as before: the missing label costs the row
  // of the programme its name and nothing else.
  assert.deepEqual(offer.views.map((v) => v.name),
    ['Caminandes, early', 'Caminandes, late', 'Elephants Dream, early']);
});

test('a view with no name is listed by its id, and one with no id by its place', () => {
  // INVENTED: a catalogue is a list somebody picks from, so a row with nothing
  // written on it is a row nobody can pick. Neither fallback invents anything:
  // the id is the other thing that names the view, and the place is what the
  // catalogue itself gives it.
  const list = OFFER();
  const views = itemOf(list).views;
  delete views[0].name;
  delete views[1].id;
  const [offer] = resolve(list);
  assert.equal(offer.views[0].name, 'view-caminandes-a');
  assert.equal(offer.views[1].id, 'view1');
  assert.equal(offer.views[1].name, 'Caminandes, late');
});

test('an offer is told from an ad by the field it brings and not by its type', () => {
  // The discriminant of ADR 0064, which is material for the specification: the
  // extension has two shapes, and which one an item is, is answered by what the
  // item brought -- `views` against `layout` -- and never by a flag.
  assert.ok(isOffer(itemOf(OFFER())));
  assert.ok(!isOffer(itemOf(readJson('./fixtures/asset-lists/asset-list-cornerOverlay.json'))));
  assert.ok(!isOffer({ type: OFFER_TYPE, duration: 10 }), 'the label alone is not a catalogue');
  assert.ok(isOffer({ type: 'somethingElse', views: [] }), 'the catalogue alone is one');
  assert.ok(!isOffer(null));
});

test('an offer with an empty catalogue falls back to the linear path of ADR 0019', () => {
  // INVENTED: an offer with nothing in it. It is the same rung as a layout with
  // no assets in it and it is checked in the same line -- nothing to draw is
  // nothing to draw -- so what plays is the asset's own URI at full frame, over
  // a programme that keeps running. The catalogue being empty is not a reason to
  // leave a hole in the window.
  const list = OFFER();
  itemOf(list).views = [];
  assert.equal(usablePayload(list.ASSETS[0][BLOCK]), null);
  const { experiences, said } = resolveWithConsole(list);
  assert.equal(experiences.length, 1);
  assert.equal(experiences[0].type, LINEAR_TYPE);
  assert.equal(experiences[0].elements.length, 2, 'the ad at full frame, and the programme under it');
  assert.equal(said.warn.length, 1, 'and it is reported: a window that degraded is not a window that ran');
});

// ---------------------------------------------------------------------------
// 4. The envelope, which is the same one
// ---------------------------------------------------------------------------

test('the window of an offer is the same sum of three numbers, offset included', () => {
  // INVENTED: a break of two assets, the second of them an offer that begins
  // five seconds into its own asset. It is the case the two lists of the run
  // cannot show, because both carry a single asset with `start` 0, so the
  // accumulator is 0 there and the two readings agree whatever the rule is.
  //
  // The number is the sum of three: where the break begins, how far into the
  // break this asset begins -- the accumulated top-level DURATION of the ones
  // before it -- and how far into its own asset the item begins.
  const list = OFFER();
  const second = structuredClone(list.ASSETS[0]);
  Object.assign(itemOf({ ASSETS: [second] }), { start: 5, duration: 55 });
  list.ASSETS[0].DURATION = 30;
  list.ASSETS.push(second);
  const experiences = resolve(list);
  assert.equal(experiences.length, 2);
  assert.equal(experiences[0].startTime, 45, 'the first asset begins where the break does');
  assert.equal(experiences[1].startTime, 45 + 30 + 5);
  assert.equal(experiences[1].duration, 55);
  // Two identities and not one, which is rule 6 of the contract: `id` names the
  // window and both share it, `itemId` names one thing inside it.
  assert.deepEqual(experiences.map((e) => e.itemId), [`${ID}.0`, `${ID}.1`]);
  assert.equal(new Set(experiences.map((e) => e.id)).size, 1);
});

test('an offer answers the activation window like anything else', () => {
  // Rule 5 of the contract: `activeAt` is the only source of the window, and
  // it is half open -- active from `startTime`, out at the end. An offer is not
  // a special case of it, and that is asserted rather than assumed, because the
  // whole of the phase hangs off this call answering with the offer in it.
  const experiences = resolve(OFFER());
  assert.deepEqual(activeAt(experiences, 44.9), []);
  assert.deepEqual(activeAt(experiences, 45).map((e) => e.type), [OFFER_TYPE]);
  assert.deepEqual(activeAt(experiences, 104.9).map((e) => e.type), [OFFER_TYPE]);
  assert.deepEqual(activeAt(experiences, 105), [], 'out at the end, not at the end plus a frame');
});
