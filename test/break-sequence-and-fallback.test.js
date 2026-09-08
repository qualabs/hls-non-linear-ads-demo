// break-sequence-and-fallback.test.js -- the tests of T-04 of phase 03.
//
// What they are for: the two things this phase added that nobody sees on the
// screen. The rest of the phase is mechanical and was read off the contract in
// flight -- which ad is active at second 38, which node is in the layer, what
// the request carried -- and those readings are the done of T-01, T-02 and
// T-03. These two are not readings of one run, they are rules, and a rule that
// is wrong for a payload nobody signalled yet fails the day a real asset-list
// comes in a shape the demo never served.
//
//   THE ARITHMETIC OF THE SEQUENCE. Where each ad of a break lands on the
//   timeline of the programme, which comes out of the accumulated top-level
//   `DURATION` of each asset, and which ad is which, which is `itemId`. An
//   offset off by one asset puts every ad after it in the wrong second, and a
//   recording of that looks exactly like a recording of the right thing.
//
//   THE DECISION OF THE ASSET WITHOUT A BLOCK. When an asset falls back to its
//   own `URI` and when it does not, which is the frontier T-02 drew: three
//   shapes detected, two deliberately not, and an empty `uri` that is not a
//   failure. Both sides of that frontier fail in silence -- a fallback that
//   does not fire leaves a hole in the break, and one that fires when it should
//   not replaces a layout with a full-frame ad, and neither says anything to
//   anyone watching.
//
// Same door as the other two files and the same restriction: the pure
// functions, and nothing else. No DOM, no browser, no image comparison, and
// coverage is not the goal.
//
// The data is the real one, and it is in `test/fixtures/`: the asset-lists are
// the thirteen the demo serves -- the five of the run, the three phase 03
// added, the linear ad of phase 01 and the four fixtures broken on purpose --
// and the expected numbers are what T-01 and T-02 read off the contract with
// the player running. The six payloads of the SVTA tool are verbatim in the
// reading of T-03 of phase 01. Every fixture says where it was copied from in
// `fixtures/README.md`, and from that copy on it belongs to this suite
// (ADR 0023). The cases that ARE invented say so where they are.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  BLOCK,
  FULL_FRAME,
  LINEAR_ELEMENT_ID,
  LINEAR_TYPE,
  activeAt,
  rangeOfExperiences,
  resolveAssetList,
  resolveExperience,
  usablePayload,
  usableUri
} from '../lib/signalling.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const readJson = (path) => JSON.parse(read(path));

/** The six asset-lists, verbatim as the SVTA tool emits them (T-03, phase 01). */
const TOOL = readJson('./fixtures/mediciones/m3-resultados.json').herramienta;

/** The identifier of the Date Range, which every ad of one break shares. */
const ID = 'AD-1-CONCURRENT';

/** The second the run signals its first break at, and the one T-01 and T-02 read against. */
const SLOT_START = 20;

const list = (name) => readJson(`./fixtures/asset-lists/asset-list-${name}.json`);
const durationsOf = (name) => list(name).ASSETS.map((a) => a.DURATION);
const typesOf = (name) => list(name).ASSETS.map((a) => a[BLOCK]?.payload[0].type ?? null);

/**
 * The signalling layer over one of the asset-lists the demo serves, with the
 * console captured along with the experiences.
 *
 * It is captured and not muted: half of these lists fall back on purpose, and a
 * fallback SAYS SO -- the console line is the only report those paths leave, so
 * dropping it here would throw away the thing that tells a declared linear ad
 * from an ad that fell back, which on screen are the same picture.
 */
function resolveWithConsole(name, { id = ID, slotStart = SLOT_START } = {}) {
  const said = { log: [], warn: [], error: [] };
  const original = { log: console.log, warn: console.warn, error: console.error };
  for (const level of Object.keys(said)) {
    console[level] = (...args) => said[level].push(args.join(' '));
  }
  try {
    return { experiences: resolveAssetList(list(name), { id, slotStart }), said };
  } finally {
    Object.assign(console, original);
  }
}

const resolve = (name, options) => resolveWithConsole(name, options).experiences;

test('the fixtures of the phase are the breaks the readings were taken on', () => {
  // Asserted and not assumed, the same way the run of the script is asserted in
  // program-ranges-and-volume: every number below is what T-01 and T-02 read in
  // flight, and a fixture edited without them would make the tests of this file
  // pass over a break that no longer exists.
  assert.deepEqual(durationsOf('multiAd'), [12, 12, 12]);
  assert.deepEqual(typesOf('multiAd'), ['cornerOverlay', 'cornerOverlay', 'squeezebackDoubleBox'],
    'the first two ads of the break of three share the layout, which is the case of the identity');
  assert.deepEqual(durationsOf('mezclado'), [12, 12, 12, 12]);
  assert.equal(typesOf('mezclado')[2], null, 'the third ad of the mix carries no block: it is the linear one');
  assert.deepEqual(durationsOf('linear'), [12]);
  assert.equal(typesOf('linear')[0], null);
  assert.deepEqual(durationsOf('solapado'), [12, 12]);
  assert.equal(list('solapado').ASSETS[0][BLOCK].payload[0].duration, 18,
    'the first item declares a window longer than the DURATION of the asset that carries it');
});

// ---------------------------------------------------------------------------
// 1. Where each ad of a break lands
// ---------------------------------------------------------------------------

/** The five asset-lists of the recording, plus the linear ad of phase 01. */
const ONE_ASSET = [
  'cornerOverlay',
  'squeezebackLShape',
  'squeezebackLShape-image',
  'squeezebackDoubleBox',
  'multiView',
  'linear'
];

test('a break of one asset opens at the START-DATE, which is every break of the recording', () => {
  // The case of today, and the one that cannot change: the offset is an
  // accumulator, and an accumulator that starts anywhere but at zero moves the
  // five breaks of the recording without anybody asking it to.
  for (const name of ONE_ASSET) {
    const resolved = resolve(name);
    assert.equal(resolved.length, 1, name);
    assert.equal(resolved[0].startTime, SLOT_START, name);
    assert.equal(resolved[0].duration, 12, name);
  }
});

test('each asset begins where the one before it ended, over the breaks of three, four and two', () => {
  // Three assets of 12 s from second 20, which is what T-01 read at 26,040 s,
  // 38,052 s and 50,052 s with the player running.
  assert.deepEqual(resolve('multiAd').map((e) => e.startTime), [20, 32, 44]);
  assert.deepEqual(resolve('multiAd').map((e) => e.duration), [12, 12, 12]);
  // Four, with the third one a bare asset: the ad that plays a `URI` and no
  // layout takes its place in the sequence like any other.
  assert.deepEqual(resolve('mezclado').map((e) => e.startTime), [20, 32, 44, 56]);

  // THE ONE FIXTURE WHERE THE TWO CANDIDATE RULES DISAGREE, and it is why this
  // assertion is here and not in the two above. The first item declares a
  // window of 18 s inside an asset that declares a `DURATION` of 12, so the
  // second asset begins at 32 -- where the DECLARED DURATION of the first one
  // ended -- and not at 38, where the window of the first ad closes. An offset
  // accumulated from the windows instead of from the `DURATION` gives 38 here
  // and gives the same answer as this one on every other asset-list of the
  // demo.
  const overlapped = resolve('solapado');
  assert.deepEqual(overlapped.map((e) => e.startTime), [20, 32]);
  assert.deepEqual(overlapped.map((e) => e.duration), [18, 12]);
  // And the consequence of that, which T-02 went and looked at in the browser
  // before choosing the rule of the end: from 32 to 38 the two are active at
  // once, and the contract hands over both.
  assert.equal(activeAt(overlapped, 34.5).length, 2);
  assert.equal(activeAt(overlapped, 31.9).length, 1);
  assert.equal(activeAt(overlapped, 38).length, 1);
});

test('the start of an item is an offset inside its own asset and not from the START-DATE', () => {
  // INVENTED: the six payloads of the tool and every asset-list of the demo
  // carry `start: 0`, so no real datum tells the two readings apart -- which is
  // exactly why the rule needs a case of its own. The same item, with the same
  // `start`, in the first asset and in the second: 3 s into the first asset is
  // second 23, and 3 s into the second is 35, which is 20 + 12 + 3. A `start`
  // read from the START-DATE puts both of them at 23.
  const item = (start) => ({
    type: 'cornerOverlay',
    start,
    duration: 5,
    layout: { assets: [{ id: 'ad', uri: '/x.m3u8', viewport: '0 75 75 0', zDepth: 1 }] }
  });
  const twoAssets = {
    ASSETS: [
      { URI: '/a.m3u8', DURATION: 12, [BLOCK]: { payload: [item(3)] } },
      { URI: '/b.m3u8', DURATION: 12, [BLOCK]: { payload: [item(3)] } }
    ]
  };
  assert.deepEqual(
    resolveAssetList(twoAssets, { id: ID, slotStart: SLOT_START }).map((e) => e.startTime),
    [23, 35]
  );
});

// ---------------------------------------------------------------------------
// 2. Which ad is which
// ---------------------------------------------------------------------------

test('two ads of one break are two identities even when they share the layout', () => {
  const resolved = resolve('multiAd');
  assert.deepEqual(resolved.map((e) => e.itemId), [`${ID}.0`, `${ID}.1`, `${ID}.2`]);
  // `id` names the Date Range and all three ads share it. That is not a defect
  // to route around: it is what lets the bar mark ONE range for the break, and
  // it is precisely why `id` cannot be the identity of an ad.
  assert.deepEqual([...new Set(resolved.map((e) => e.id))], [ID]);
  assert.equal(new Set(resolved.map((e) => e.itemId)).size, 3);

  // THE BUG T-01 FIXED, KEPT AS A CASE SO IT CANNOT COME BACK. The key the
  // renderer compared used to be the type and the id of the signalling, and for
  // these three ads that is TWO keys and not three, because the first two share
  // the layout. The renderer read "nothing changed", never rebuilt, and the
  // second creative was never drawn -- the node of the first one stayed on
  // screen playing past its own end.
  assert.equal(new Set(resolved.map((e) => `${e.type}#${e.id}`)).size, 2);
});

test('the ordinal of an ad is of the whole break, so two items of one asset are two ads', () => {
  // INVENTED: every asset of the demo carries a single item, so the ordinal of
  // the list and the index of the `ASSETS` array agree on all of them. They are
  // not the same thing: an asset whose block declares two items is two ads, and
  // an ordinal taken from the array would hand them one identity between them,
  // which is the bug above with another cause.
  const ad = (id, start) => ({
    type: 'cornerOverlay',
    start,
    duration: 6,
    layout: { assets: [{ id, uri: `/${id}.m3u8`, viewport: '0 75 75 0', zDepth: 1 }] }
  });
  const twoInOne = {
    ASSETS: [
      { URI: '/a.m3u8', DURATION: 12, [BLOCK]: { payload: [ad('first', 0), ad('second', 6)] } },
      { URI: '/b.m3u8', DURATION: 12, [BLOCK]: { payload: [ad('third', 0)] } }
    ]
  };
  const resolved = resolveAssetList(twoInOne, { id: ID, slotStart: SLOT_START });
  assert.deepEqual(resolved.map((e) => e.itemId), [`${ID}.0`, `${ID}.1`, `${ID}.2`]);
  assert.deepEqual(resolved.map((e) => e.startTime), [20, 26, 32]);

  // And the other end of the field: one experience resolved on its own IS the
  // whole break, so there the two fields are the same thing and the caller does
  // not have to invent an ordinal.
  assert.equal(resolveExperience(ad('alone', 0), { id: ID, slotStart: 0 }).itemId, ID);
});

// ---------------------------------------------------------------------------
// 3. The asset without a block
// ---------------------------------------------------------------------------

test('an ASSET with a URI and a DURATION and nothing else is one full-frame ad', () => {
  // `asset-list-linear.json`, declared without a block since phase 01 and
  // resolving to nothing at all until this phase.
  const { experiences, said } = resolveWithConsole('linear');
  assert.equal(experiences.length, 1);
  const [ad] = experiences;
  assert.equal(ad.type, LINEAR_TYPE);
  assert.equal(ad.startTime, SLOT_START);
  // The window of a synthesized ad is the asset's own top-level `DURATION`,
  // because there is no item to declare one.
  assert.equal(ad.duration, 12);

  const [primary, linear] = ad.elements;
  assert.deepEqual(ad.elements.map((e) => e.id), ['primaryContent', LINEAR_ELEMENT_ID]);
  assert.deepEqual(primary.box, FULL_FRAME);
  assert.deepEqual(linear.box, FULL_FRAME);
  assert.ok(linear.zDepth > primary.zDepth, 'the ad covers the programme by zDepth');
  assert.equal(linear.uri, '/content/adA/index.m3u8');
  assert.equal(primary.uri, null, 'the primary content is already playing');

  // The mix is the INVERSE of a concurrent ad's, and the asymmetry is the whole
  // of why this shape was chosen: a concurrent ad that says nothing about its
  // audio enters silent because it is mixed over a programme somebody is
  // listening to, and this one is not mixed over anything -- it covers the
  // frame, and a full-frame ad with no sound is a fault nothing on screen
  // reports.
  assert.equal(primary.volume, 0);
  assert.equal(linear.volume, 100);

  // And it is not a fallback, so it does not report as one: a log and not a
  // warning. The difference is not cosmetic -- it is what keeps a console full
  // of warnings from being a console nobody reads.
  assert.deepEqual(said.warn, []);
  assert.deepEqual(said.error, []);
  assert.equal(said.log.length, 1);
});

test('in the mixed break the full-frame ad silences the programme and the concurrent ones do not', () => {
  // The mix David named -- concurrent, concurrent, linear, concurrent -- with
  // the two rules of ADR 0014 side by side in one break, which is the only
  // place they can be told apart.
  const { experiences, said } = resolveWithConsole('mezclado');
  assert.deepEqual(experiences.map((e) => e.type),
    ['cornerOverlay', 'squeezebackDoubleBox', LINEAR_TYPE, 'cornerOverlay']);
  assert.deepEqual(experiences.map((e) => e.elements.find((x) => x.primary).volume), [100, 100, 0, 100]);
  assert.deepEqual(experiences.map((e) => e.elements.filter((x) => !x.primary).map((x) => x.volume)),
    [[0], [0], [100], [0]]);

  // One experience with two elements at second 50, which is what T-02 read at
  // 50,036 s with the programme still running behind it.
  const [active] = activeAt(experiences, 50);
  assert.equal(active.itemId, `${ID}.2`);
  assert.equal(active.elements.length, 2);
  assert.deepEqual(said.warn, [], 'a declared linear ad in the middle of a break is not a fallback');
});

// ---------------------------------------------------------------------------
// 4. What counts as "I cannot draw this", and what does not
// ---------------------------------------------------------------------------

test('the three shapes this client cannot draw are the three that cannot become a box', () => {
  // The decision itself: the payload when the block is usable, `null` when it
  // is not, and the caller does the same thing in both of the null cases.
  const item = {
    type: 'cornerOverlay',
    duration: 12,
    layout: { assets: [{ id: 'ad', uri: '/a.m3u8', viewport: '0 75 75 0', zDepth: 1 }] }
  };
  assert.deepEqual(usablePayload({ payload: [item] }), [item], 'a block that can be drawn');

  assert.equal(usablePayload(null), null, 'no block at all');
  assert.equal(usablePayload(undefined), null, 'no block at all');
  assert.equal(usablePayload({}), null, 'a block with no payload');
  assert.equal(usablePayload({ payload: [] }), null, 'an empty payload');
  assert.equal(usablePayload({ payload: 'nope' }), null, 'a payload that is not an array');
  // No window: `duration` is what the activation window is made of, so an item
  // without one is an ad that can never be active.
  for (const noWindow of [undefined, null, 0, -1, 'twelve']) {
    assert.equal(usablePayload({ payload: [{ ...item, duration: noWindow }] }), null,
      `a duration of ${JSON.stringify(noWindow)}`);
  }
  // No assets in the layout: a break in which nothing is drawn over the
  // programme, which is not an ad.
  assert.equal(usablePayload({ payload: [{ ...item, layout: { assets: [] } }] }), null);
  assert.equal(usablePayload({ payload: [{ ...item, layout: {} }] }), null);
  assert.equal(usablePayload({ payload: [{ ...item, layout: undefined }] }), null);

  // THE UNIT OF THE FALLBACK IS THE ASSET AND NOT THE ITEM: one unreadable item
  // takes its whole asset to the linear path. A per-item fallback would play
  // the asset's `URI` for one item while drawing the layout of another over it,
  // which is one ad on top of itself.
  assert.equal(usablePayload({ payload: [item, { ...item, duration: 0 }] }), null);

  // And what the fallback plays, which is the other half of the decision.
  assert.equal(usableUri({ URI: '/content/adA/index.m3u8' }), '/content/adA/index.m3u8');
  assert.equal(usableUri({ URI: '  /content/adA/index.m3u8  ' }), '/content/adA/index.m3u8');
  assert.equal(usableUri({}), null);
  assert.equal(usableUri({ URI: '' }), null);
  assert.equal(usableUri({ URI: '   ' }), null);
});

test('a block this client cannot draw plays the asset own URI, and the ads around it do not move', () => {
  // `asset-list-repliegue-bloque-roto.json`: three assets, the second one
  // carrying an item whose layout declares a `primaryContent` and no assets at
  // all. What T-02 read in flight at 26,066 s, 38,065 s and 50,061 s.
  const { experiences, said } = resolveWithConsole('repliegue-bloque-roto');
  assert.equal(experiences.length, 3, 'the break is filled: the asset falls back, it is not dropped');
  assert.deepEqual(experiences.map((e) => e.type), ['cornerOverlay', LINEAR_TYPE, 'cornerOverlay']);
  assert.deepEqual(experiences.map((e) => e.startTime), [20, 32, 44]);

  const fallen = experiences[1];
  assert.equal(fallen.elements.find((e) => !e.primary).uri, '/content/adA/index.m3u8',
    "what is played is the asset's own URI and not anything the block said");
  assert.equal(fallen.elements.find((e) => e.primary).volume, 0);

  // A fallback and a declared linear ad play the same thing and are not the
  // same event, so they are not said the same way: this one is a warning, and
  // the one in the test above is a log.
  assert.equal(said.warn.length, 1);
  assert.ok(said.warn[0].includes('cannot draw'), said.warn[0]);
  assert.deepEqual(said.log, []);
});

test('an empty uri and a media type nobody knows are not failures of the block', () => {
  // THE TRAP THIS TEST EXISTS FOR, and the suite already walked into it once:
  // the first version of the check counted an element with an empty `uri` as an
  // unreadable block and put nine of the tests of the other two files in red.
  // The SVTA tool emits `"uri": ""` in every one of its six payloads, with
  // `"URI": "[PATH TO ASSET]"` above it -- a client that took that for
  // unreadable would fall back on EVERY asset-list the tool produces, which is
  // the one thing ADR 0004 decides not to do.
  const uris = new Set(Object.values(TOOL).flatMap(
    (l) => l.ASSETS[0][BLOCK].payload[0].layout.assets.map((a) => a.uri)
  ));
  assert.deepEqual([...uris], [''], 'the tool emits an empty uri on every element of the six');
  for (const type of Object.keys(TOOL)) {
    const [experience] = resolveAssetList(TOOL[type], { id: ID, slotStart: SLOT_START });
    assert.equal(experience.type, type, `${type} keeps the layout the tool declared`);
    assert.notEqual(experience.type, LINEAR_TYPE, `${type} does not fall back`);
  }

  // INVENTED, and it is one of the two cases T-02 decided NOT to detect: the
  // `type` of an element is the container and not the codec, so a check there
  // would reject nothing of what really fails. The honest answer arrives when
  // the element tries to play, which is another mechanism at another moment --
  // so here the layout is drawn and the media type is carried across untouched.
  const exotic = {
    ASSETS: [{
      URI: '/content/adA/index.m3u8',
      DURATION: 12,
      [BLOCK]: {
        payload: [{
          type: 'cornerOverlay',
          start: 0,
          duration: 12,
          layout: { assets: [{ id: 'ad', type: 'video/x-nothing-plays-this', uri: '/a.bin', viewport: '0 75 75 0', zDepth: 1 }] }
        }]
      }
    }]
  };
  const [drawn] = resolveAssetList(exotic, { id: ID, slotStart: SLOT_START });
  assert.equal(drawn.type, 'cornerOverlay');
  assert.equal(drawn.elements.find((e) => !e.primary).mediaType, 'video/x-nothing-plays-this');

  // The other one not detected, and the reason is in the signature: the
  // decision is taken from the block alone, so there is no declared decoder
  // count for it to read. The day it compares one, this is the assertion that
  // has to change, and it will fail here first.
  assert.equal(usablePayload.length, 1, 'the fallback decision reads the block and nothing else');
});

/**
 * Every asset-list the demo serves that is NOT a fixture broken on purpose,
 * with what each one has to resolve to. The five of the recording, the three
 * the phase added, and the linear ad of phase 01.
 */
const NO_FALLBACK = [
  { name: 'cornerOverlay', ads: 1, linear: 0 },
  { name: 'squeezebackLShape', ads: 1, linear: 0 },
  { name: 'squeezebackLShape-image', ads: 1, linear: 0 },
  { name: 'squeezebackDoubleBox', ads: 1, linear: 0 },
  { name: 'multiView', ads: 1, linear: 0 },
  { name: 'multiAd', ads: 3, linear: 0 },
  { name: 'mezclado', ads: 4, linear: 1 },
  { name: 'solapado', ads: 2, linear: 0 },
  { name: 'linear', ads: 1, linear: 1 }
];

test('none of the asset-lists the demo serves falls back, and the two linear ads are declared ones', () => {
  // The other side of the frontier, and the one that costs more when it is
  // wrong: a fallback that fires on a list that is fine replaces a layout
  // somebody signalled with a full-frame ad, and the recording of that is a
  // recording of an ad playing. Nothing on screen says which one it should have
  // been.
  let logs = 0;
  for (const { name, ads, linear } of NO_FALLBACK) {
    const { experiences, said } = resolveWithConsole(name);
    assert.equal(experiences.length, ads, name);
    assert.equal(experiences.filter((e) => e.type === LINEAR_TYPE).length, linear, `${name}: linear ads`);
    assert.deepEqual(said.warn, [], `${name}: nothing falls back`);
    assert.deepEqual(said.error, [], name);
    logs += said.log.length;
  }
  // Two lines over the nine lists, and both of them are the declared linear ad
  // of a break saying what it is.
  assert.equal(logs, 2);
});

// ---------------------------------------------------------------------------
// 5. The three rungs of Appendix D.5
// ---------------------------------------------------------------------------

test('an asset with nothing to play is skipped alone, and the ads after it keep their windows', () => {
  // The FIRST rung. `asset-list-repliegue-sin-uri.json`: three assets, the
  // second with neither a block nor a `URI`. What T-02 read at 26,048 s,
  // 38,030 s and 50,019 s.
  const { experiences, said } = resolveWithConsole('repliegue-sin-uri');
  assert.equal(experiences.length, 2);
  assert.deepEqual(experiences.map((e) => e.itemId), [`${ID}.0`, `${ID}.1`]);
  // 44 and not 32: the declared `DURATION` of the skipped asset accumulates
  // anyway, so the third ad keeps the window it already had. A skip that pulled
  // the others back would be the break failing one ad at a time.
  assert.deepEqual(experiences.map((e) => e.startTime), [20, 44]);
  assert.deepEqual(activeAt(experiences, 26).map((e) => e.itemId), [`${ID}.0`]);
  assert.deepEqual(activeAt(experiences, 38), [], 'the window of the skipped asset is empty');
  assert.deepEqual(activeAt(experiences, 50).map((e) => e.itemId), [`${ID}.1`]);

  // AND THE BREAK IS NOT CANCELLED, which is the distinction Appendix D.5 makes
  // and the one that looks identical on a screen: the range is still reported,
  // with one ad less inside it.
  assert.deepEqual(rangeOfExperiences(ID, experiences),
    { id: ID, kind: 'concurrent', startTime: 20, duration: 36 });

  assert.equal(said.warn.length, 1);
  assert.ok(said.warn[0].includes('is skipped and the break'), said.warn[0]);
});

test('the asset-list that cannot be read cancels the whole break, which is not skipping an asset', () => {
  // The SECOND rung, and the reading is split in two because the rung itself
  // lives where the fetch is -- in `createSignalling`, which this file does not
  // reach, because there is no network on this side.
  //
  // The input: the fixture the run serves for this case is not JSON, so the
  // response never becomes a list and there is nothing to resolve. It is
  // asserted here because a fixture "fixed" by somebody tidying up would take
  // the scenario away without taking a test away with it.
  assert.throws(() => JSON.parse(read('./fixtures/asset-lists/asset-list-repliegue-json-roto.json')), SyntaxError);

  // The outcome: a break that resolved nothing is NO RANGE AT ALL, so it is
  // missing from the bar -- which is what cancelling with offset 0 looks like
  // under this render, where the programme was never stopped. The contrast with
  // the test above is the whole of this one: there the break kept its range.
  assert.equal(rangeOfExperiences(ID, []), null);
});

test('a list that declares no ASSETS plays nothing and reports no range', () => {
  // The THIRD rung. `asset-list-repliegue-vacio.json` is `{ "ASSETS": [] }`.
  const { experiences, said } = resolveWithConsole('repliegue-vacio');
  assert.deepEqual(experiences, []);
  assert.equal(rangeOfExperiences(ID, experiences), null);
  assert.equal(said.warn.length, 1);
  assert.ok(said.warn[0].includes('no ASSETS'), said.warn[0]);

  // INVENTED: the fixture declares an empty array. The two other shapes of
  // declaring nothing take the same route, and a check written against `length`
  // alone would throw on both instead of resolving them.
  const quiet = (assetList) => {
    const original = console.warn;
    console.warn = () => {};
    try {
      return resolveAssetList(assetList, { id: ID, slotStart: SLOT_START });
    } finally {
      console.warn = original;
    }
  };
  assert.deepEqual(quiet({}), []);
  assert.deepEqual(quiet({ ASSETS: null }), []);
  assert.deepEqual(quiet(null), []);
});

// ---------------------------------------------------------------------------
// 6. The range the break leaves on the bar
// ---------------------------------------------------------------------------

test('a break of several ads is one range, from the first to start to the last to end', () => {
  // One Date Range is one range of the programme however many ads it carries,
  // because what a bar marks is the break and not each ad inside it. The three
  // numbers are the ones T-01 and T-02 read off `programRanges()` in flight.
  assert.deepEqual(rangeOfExperiences(ID, resolve('multiAd')),
    { id: ID, kind: 'concurrent', startTime: 20, duration: 36 });
  // With a full-frame ad third in the mix: still one range, still concurrent,
  // and its length is the four ads and not the three that carry a layout.
  assert.deepEqual(rangeOfExperiences(ID, resolve('mezclado')),
    { id: ID, kind: 'concurrent', startTime: 20, duration: 48 });
  // And where two ads overlap the range is the union and not the sum: 20 to 44
  // is 24 s, not the 30 s the two windows add up to.
  assert.deepEqual(rangeOfExperiences(ID, resolve('solapado')),
    { id: ID, kind: 'concurrent', startTime: 20, duration: 24 });
});
