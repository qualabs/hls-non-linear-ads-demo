// program-ranges-and-volume.test.js -- the tests of T-06.
//
// What they are for: the two things this phase added that can be wrong with
// nothing looking wrong. Everything else the phase added is on the screen --
// the controls, the skin, the marks on the bar -- and a wrong one is a wrong
// picture. These two are not.
//
//   THE RANGES OF THE PROGRAMME. Where the breaks are and which kind each one
//   is, and where that lands on a bar as a fraction of the whole programme. A
//   mark drawn at the wrong second is a mark, and a bar full of marks looks
//   right from across the room.
//
//   THE VOLUME AN ELEMENT STARTS AT. One default of 0 for every element leaves
//   the programme mute in the five layouts of the recording, and a frame of
//   that recording is identical to a correct one. So is a `||` where a `??`
//   should be, which turns an ad declared silent into the loudest thing on the
//   screen.
//
// Same door as `layout-resolution.test.js` and the same restriction: the pure
// functions and nothing else. No DOM, no browser, no image comparison, and
// coverage is not the goal.
//
// The data is the real one. The five breaks come from the table in
// `scripts/senalizar-contenido.sh`, which is what writes the signalled
// playlist; the layouts come from `signalling/`, which is what the server
// hands over; and the expected values are what T-02 read off the contract in
// flight, what T-04 measured on the bar and what T-05 measured on each media
// node. The three cases that ARE invented say so where they are.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  CONCURRENT_CLASS,
  INTERSTITIAL_CLASS,
  kindOfClass,
  resolveAssetList,
  resolveElement,
  rangeOfExperiences,
  rangeOfDateRange
} from '../lib/signalling.js';
import { volumeOf } from '../lib/renderer.js';
import { rangeSpan } from '../lib/controls.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const readJson = (path) => JSON.parse(read(path));

/** The script that writes the signalled playlist: the five breaks live here. */
const SIGNALLER = read('../scripts/senalizar-contenido.sh');
/** What T-02 read off `programRanges()` with the player running. */
const T02 = readJson('../.project/phases/02-sdk-y-controles/tasks/T-02/t02-los-rangos-del-programa.json');
/** What T-04 measured of the marks on the bar, over a 180 s programme. */
const T04 = readJson('../.project/phases/02-sdk-y-controles/tasks/T-04/t04-la-medicion.json');
/** What T-05 measured on every media node, volume by volume. */
const T05 = readJson('../.project/phases/02-sdk-y-controles/tasks/T-05/t05-la-medicion.json');
/** What T-05 of phase 03 read off the contract with the mixed break in the run. */
const T05_MIXED = readJson(
  '../.project/phases/03-breaks-multiples-y-repliegue/tasks/T-05/t05-el-recorrido-con-el-break-mezclado.json'
);

/** The length of the primary content, re-read in flight by T-02 and by T-04. */
const PROGRAMME = T02.laLectura.largoDelPrimarioReleido; // 180

/**
 * The length a Date Range declares, which the script no longer writes by hand:
 * the sum of the `DURATION`s of the asset-list that tag points at, which is
 * what the break lasts. The two tags of a break declare their own and they are
 * not always the same number -- twelve on the Apple-class tag and forty-eight
 * on ours in the mixed break -- and that difference is the whole of why the
 * compatibility pair inverts inside it.
 */
const declaredLength = (list) =>
  readJson(`../signalling/${list}`).ASSETS.reduce((total, asset) => total + Number(asset.DURATION), 0);

/**
 * The recording's run, parsed out of the shell script that writes the tags:
 * second of playback and asset-list, five rows. Parsed and not copied so that a
 * break moved in the script moves here too -- the expected values below are a
 * reading of the browser, and a reading is about a run.
 */
const RUN = [...SIGNALLER.matchAll(/^\s*"(\d+)\|(asset-list-[^|]+)\|/gm)].map(
  ([, offset, list], i) => ({
    n: i + 1,
    slotStart: Number(offset),
    plannedDuration: declaredLength(list),
    assetList: readJson(`../signalling/${list}`)
  })
);

/** What the Apple-class tag of every break declares: one linear ad of 12 s. */
const LINEAR_PLANNED = declaredLength('asset-list-linear.json');

/**
 * The ten ranges of the run, built the way `createSignalling` builds them: the
 * traditional interstitial straight off the tag, because there is nothing to
 * resolve, and the concurrent one out of the experiences its asset-list
 * resolved into. Sorted by startTime, which is the order the contract promises.
 */
function programRanges() {
  const ranges = [];
  for (const { n, slotStart } of RUN) {
    ranges.push(rangeOfDateRange(`AD-${n}-LINEAR`, { plannedDuration: LINEAR_PLANNED }, slotStart));
  }
  for (const { n, slotStart, assetList } of RUN) {
    const id = `AD-${n}-CONCURRENT`;
    ranges.push(rangeOfExperiences(id, resolveAssetList(assetList, { id, slotStart })));
  }
  return ranges.sort((a, b) => a.startTime - b.startTime);
}

test('the run of the script is the five breaks of the recording', () => {
  // The parse above is the load-bearing part of everything below it, so it is
  // asserted instead of assumed: a script that stops matching would otherwise
  // make every test in the first half pass over an empty list.
  assert.equal(RUN.length, 5, 'five rows in the RECORRIDO table of senalizar-contenido.sh');
  assert.deepEqual(RUN.map((b) => b.slotStart), [20, 45, 70, 95, 120]);
  // Four breaks of one ad and a last one of four, which is the mixed break.
  assert.deepEqual(RUN.map((b) => b.plannedDuration), [12, 12, 12, 12, 48]);
  assert.equal(LINEAR_PLANNED, 12);
  // AND THE LENGTH IS COMPUTED AND NOT TYPED, which is a rule about the script
  // and not about this run. A hard-wired `PLANNED-DURATION` declares twelve
  // seconds of a break that lasts forty-eight: inert for this player, because
  // the concurrent range is built out of the experiences and not out of the
  // tag, and a lie to every other client that reads the playlist.
  assert.match(SIGNALLER, /PLANNED-DURATION=%s/);
  assert.doesNotMatch(SIGNALLER, /PLANNED-DURATION=\d/);
});

// ---------------------------------------------------------------------------
// 1. The kind of a range, which is the class translated
// ---------------------------------------------------------------------------

test('the two classes the playlist signals become the two kinds the contract carries', () => {
  // A range of each class, and they are the two strings the script writes: the
  // side that writes the tag and the side that reads it agree, or every break
  // of the run is missing from the bar.
  assert.ok(SIGNALLER.includes(`CLASS="${INTERSTITIAL_CLASS}"`), 'the script writes the traditional class');
  assert.ok(SIGNALLER.includes(`CLASS="${CONCURRENT_CLASS}"`), 'the script writes the concurrent class');
  assert.equal(kindOfClass(INTERSTITIAL_CLASS), 'interstitial');
  assert.equal(kindOfClass(CONCURRENT_CLASS), 'concurrent');
  // What crosses is the kind and never the class of the transport, so a Date
  // Range of any other class is not a range of this list at all.
  assert.equal(kindOfClass('com.apple.hls.chapter'), null);
  assert.equal(kindOfClass(undefined), null);
});

// ---------------------------------------------------------------------------
// 2. The ranges of the programme
// ---------------------------------------------------------------------------

test('the five breaks are the ten ranges T-05 read off the contract', () => {
  // The reading is of THIS run, taken in flight with the mixed break in it, and
  // it is the whole list: two ranges per break, one of each kind.
  const ranges = programRanges();
  const measured = T05_MIXED.rangos.ranges.map(({ id, kind, startTime, duration }) => ({
    id,
    kind,
    startTime,
    duration
  }));
  assert.equal(measured.length, 10, 'two ranges per break: one of each kind');
  assert.deepEqual(ranges, measured);

  // AND NINE OF THE TEN ARE STILL THE ONES T-02 READ IN PHASE 02, which is the
  // half of this test that a new reading of a new run cannot give: a reading
  // agrees with itself. The mixed break is the one that moved, and it moved in
  // one number -- same second, four ads instead of one -- so anything else that
  // moves is not the change this task made.
  const before = new Map(T02.laLectura.ranges.map((r) => [r.id, r]));
  let mixed = 0;
  for (const { id, kind, startTime, duration } of ranges) {
    const old = before.get(id);
    assert.ok(old, `T-02 read no range called ${id}`);
    if (id === 'AD-5-CONCURRENT') {
      assert.equal(startTime, old.startTime, 'the mixed break starts where the fifth break always did');
      assert.equal(old.duration, 12);
      assert.equal(duration, 48);
      mixed += 1;
      continue;
    }
    assert.deepEqual({ id, kind, startTime, duration },
      { id: old.id, kind: old.kind, startTime: old.startTime, duration: old.duration }, id);
  }
  assert.equal(mixed, 1);
});

test('a break of no experiences is no range, and a tag that declares no length is no range either', () => {
  // The rule both halves follow: a range that cannot be placed is not reported,
  // because a break missing from the bar looks the same as a break that is not
  // in the playlist and a break at second zero does not.
  assert.equal(rangeOfExperiences('AD-1-CONCURRENT', []), null);

  const warnings = [];
  const original = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    // INVENTED: every tag of the run declares PLANNED-DURATION. Both shapes of
    // declaring nothing, because they take different routes: an attribute that
    // is absent is `undefined`, and one that is there and empty is `null`, and
    // `Number(null)` is 0 -- so without the check for null that tag would come
    // out as a range of zero seconds sitting on the bar instead of no range.
    assert.equal(rangeOfDateRange('AD-6-LINEAR', {}, 140), null);
    assert.equal(rangeOfDateRange('AD-7-LINEAR', { duration: null, plannedDuration: null }, 140), null);
  } finally {
    console.warn = original;
  }
  assert.equal(warnings.length, 2);

  // DURATION is what the tag really lasted and PLANNED-DURATION what it meant
  // to, so the first one wins when both are there.
  assert.deepEqual(rangeOfDateRange('AD-1-LINEAR', { duration: 11.5, plannedDuration: 12 }, 20), {
    id: 'AD-1-LINEAR',
    kind: 'interstitial',
    startTime: 20,
    duration: 11.5
  });
});

test('the window of a concurrent break spans every experience its asset-list declares', () => {
  // INVENTED in its overlaps: the mixed break of the run declares four
  // experiences and they go back to back, and no asset-list of the run declares
  // two at once. The rule is that one Date Range is ONE range of the programme
  // however many experiences it carries, so what a bar marks is the break and
  // not each ad.
  const experiences = [
    { id: 'AD-9', startTime: 40, duration: 5 },
    { id: 'AD-9', startTime: 30, duration: 4 },
    { id: 'AD-9', startTime: 35, duration: 20 }
  ];
  assert.deepEqual(rangeOfExperiences('AD-9', experiences), {
    id: 'AD-9',
    kind: 'concurrent',
    startTime: 30, // the first one to start
    duration: 25 // ...to the last one to end, which is not the last one to start
  });
});

// ---------------------------------------------------------------------------
// 3. Where a range lands on the bar
// ---------------------------------------------------------------------------

test('the ten ranges land where T-04 measured them on the bar', () => {
  const expected = T04.enVentana.esperado;
  assert.equal(T04.enVentana.largoDelPrimarioReleido, PROGRAMME);
  let count = 0;
  for (const range of programRanges()) {
    const measured = expected[range.id];
    assert.ok(measured, `T-04 measured no mark for ${range.id}`);
    assert.equal(measured.kind, range.kind, range.id);
    const span = rangeSpan(range, PROGRAMME);
    assert.equal(round(span.left), measured.left, `${range.id} left`);
    if (range.id === 'AD-5-CONCURRENT') {
      // THE ONE MARK T-04 MEASURED IN ANOTHER SHAPE. It measured the fifth
      // break at twelve seconds and the mixed break is forty-eight, so its
      // width is written out as the arithmetic it is -- where it starts is
      // still the measurement, and that is the half of the mark this run did
      // not move.
      assert.equal(round(span.width), round((48 / PROGRAMME) * 100), `${range.id} width`);
      count += 1;
      continue;
    }
    assert.equal(round(span.width), measured.width, `${range.id} width`);
    count += 1;
  }
  assert.equal(count, 10);
});

test('the same ten ranges on a programme of another length land somewhere else', () => {
  // THE TRAP THIS TEST EXISTS FOR, and it is the one T-08 of phase 01 walked
  // into with the 960 of the player area: every case above runs on the same
  // 180 s programme, so a length hard-wired to 180 -- or read once and kept,
  // which is the failure ADR 0016 is about -- passes all of them.
  //
  // Both readings are taken HERE, one after the other, so the second one is
  // asked for after the first one has already been answered: a length cached
  // on the first call fails this test wherever the file's tests are run from.
  const ranges = programRanges();
  const at180 = ranges.map((r) => rangeSpan(r, PROGRAMME));
  const at360 = ranges.map((r) => rangeSpan(r, PROGRAMME * 2));
  for (const [i, range] of ranges.entries()) {
    assert.equal(round(at360[i].left), round(at180[i].left / 2), `${range.id} left`);
    assert.equal(round(at360[i].width), round(at180[i].width / 2), `${range.id} width`);
  }
  // And the arithmetic itself, on the first break of the run: 20 s into a 90 s
  // programme is not 20 s into a 180 s one.
  const at90 = rangeSpan(ranges[0], 90);
  assert.equal(round(at90.left), round((20 / 90) * 100));
  assert.equal(round(at90.width), round((12 / 90) * 100));
});

test('a range that cannot be placed is not a mark', () => {
  const [first] = programRanges();
  const last = programRanges().at(-1);
  // No length yet: `duration` is NaN until the metadata arrives, and the
  // controls hand over 0 while it is.
  assert.equal(rangeSpan(first, 0), null);
  assert.equal(rangeSpan(first, NaN), null);
  // A break of the run past the end of a shorter programme: clamped to the
  // right edge, where it has no width, so it is not drawn.
  assert.equal(last.startTime, 120);
  assert.equal(rangeSpan(last, 90), null);
  // INVENTED: no tag of the run declares zero. A range of no seconds is a mark
  // of no pixels.
  assert.equal(rangeSpan({ startTime: 20, duration: 0 }, PROGRAMME), null);
  // A break that runs past the end is clamped and still drawn, because where it
  // starts is true and only where it ends is not.
  assert.deepEqual(rangeSpan({ startTime: 90, duration: PROGRAMME }, PROGRAMME), {
    left: 50,
    width: 50
  });
});

// ---------------------------------------------------------------------------
// 4. The volume an element starts at
// ---------------------------------------------------------------------------

/**
 * The three breaks T-05 measured node by node, against the asset-list the run
 * serves for each one. The two without `volume` are the two flavours of the
 * absent field, and they are two different paths through the code: the corner
 * overlay carries no `primaryContent` block at all, and the double box carries
 * one that says nothing about audio.
 */
const MEASURED_VOLUME = [
  { measurement: 'overlaySinVolumen', list: 'asset-list-cornerOverlay.json', type: 'cornerOverlay' },
  { measurement: 'dobleBoxSinVolumen', list: 'asset-list-squeezebackDoubleBox.json', type: 'squeezebackDoubleBox' },
  { measurement: 'quadConMezcla', list: 'asset-list-multiView.json', type: 'multiView' }
];

function resolvedElements(list, type) {
  const [experience] = resolveAssetList(readJson(`../signalling/${list}`), { id: type, slotStart: 0 });
  return experience.elements;
}

test('with no volume in the asset-list the ad comes out silent and the programme does not', () => {
  // The asymmetry, over two of the asset-lists the demo serves and the
  // per-element reading T-05 took of them. The double box has no break of its
  // own any more -- it is the second ad of the mixed break, and the file is
  // what the single-break mode serves -- and it stays here because WHICH
  // element the field is absent on is the whole of the case: it is the one of
  // the two that carries a `primaryContent` block saying nothing about audio.
  // A single default of 0 leaves the show mute for the whole recording and
  // every other test of both files still passes: the boxes, the order and the
  // windows would all still be right.
  for (const { measurement, list, type } of MEASURED_VOLUME.slice(0, 2)) {
    const measured = T05[measurement].elementos;
    const elements = resolvedElements(list, type);
    assert.equal(elements.length, measured.length, type);
    for (const element of elements) {
      const node = measured.find((e) => e.id === element.id);
      assert.ok(node, `T-05 measured no element called ${element.id} in ${type}`);
      assert.equal(element.volume, element.primary ? 100 : 0, `${type}/${element.id}`);
      assert.equal(element.volume, node.volumenDeclarado, `${type}/${element.id} as measured`);
    }
  }
});

test('the mix of the Quad is the one the asset-list declares, element by element', () => {
  // The mix David asked for -- the bottom left at 100 and the other three at 10
  // -- lives in `signalling/asset-list-multiView.json` and not in code. What is
  // asserted is that it survives the layer intact and reaches the media nodes
  // as the fractions T-05 read off them.
  const measured = T05.quadConMezcla.elementos;
  const elements = resolvedElements('asset-list-multiView.json', 'multiView');
  assert.deepEqual(
    elements.map((e) => `${e.id}:${e.volume}`),
    ['primaryContent:10', 'view2:10', 'view3:100', 'view4:10']
  );
  for (const element of elements) {
    const node = measured.find((e) => e.id === element.id);
    assert.equal(element.volume, node.volumenDeclarado, element.id);
    // What the layout says in percent is what somebody watching hears.
    assert.equal(volumeOf(element), node.volume, element.id);
  }
});

test('an explicit volume of 0 on the primary content survives, and it is what tells `??` from `||`', () => {
  // INVENTED: no asset-list of the run declares 0 anywhere. It is the case that
  // matters anyway, and WHICH element it is on is the whole of it: with the
  // ad's default at 0, an explicit 0 on an element of the ad no longer tells
  // the two operators apart, because both branches give 0. The primary content,
  // whose default is 100, is where the difference is still visible -- a `||`
  // there brings the programme back to full volume against a mix that asked for
  // silence, and nothing on screen says so.
  assert.equal(resolveElement({ id: 'primaryContent', viewport: '0 0 0 0', volume: 0 }, true).volume, 0);
  assert.equal(volumeOf({ primary: true, volume: 0 }), 0);
  // The same 0 on an element of the ad, for the contrast: it is right, and it
  // is right either way, which is exactly why it cannot be the detector.
  assert.equal(resolveElement({ id: 'adOverlay1', viewport: '0 75 75 0', volume: 0 }, false).volume, 0);
  // And a declared 100 on the ad side, the other end of the same field: what
  // the asset-list says is obeyed, default or no default.
  assert.equal(resolveElement({ id: 'view3', viewport: '50 50 0 0', volume: 100 }, false).volume, 100);
  assert.equal(volumeOf({ primary: false, volume: 100 }), 1);
});

test('a volume that is not a number falls back to the element own default, and there are two', () => {
  // INVENTED, and it is the borderline the contract leaves open: it declares
  // `volume: number // 0..100` and nobody validates the edge. A NaN put on a
  // media node throws, and the one that throws is the primary content.
  assert.equal(volumeOf({ primary: true, volume: undefined }), 1);
  assert.equal(volumeOf({ primary: false, volume: undefined }), 0);
  assert.equal(volumeOf({ primary: true, volume: 'loud' }), 1);
  // Out of range is clamped and not rejected, on both sides.
  assert.equal(volumeOf({ primary: false, volume: 250 }), 1);
  assert.equal(volumeOf({ primary: false, volume: -10 }), 0);
});

/** Six decimals, which is the precision T-04 wrote its measurement with. */
function round(value) {
  return Number(value.toFixed(6));
}
