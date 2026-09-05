// layout-resolution.test.js -- the tests of T-08.
//
// What they are for: a change made for one layout must not break another
// without anybody noticing. The layout resolution is the only part of the phase
// that can fail in silence -- everything else is on the screen, and the layouts
// are looked at one at a time. What is not on the screen is the parsing, the
// defaults, the order and the activation window, and any of those can be wrong
// for one layout while the one being looked at is fine.
//
// So the surface is the pure functions of the two layers, and nothing else: the
// parsing of `viewport`, the two defaults the tool omits, the order by `zDepth`,
// the activation window, and the conversion of insets into a box in pixels. No
// DOM, no browser, no image comparison, and coverage is not the goal.
//
// The cases come from real data: the six payloads the SVTA tool emits are
// verbatim in the evidence of T-03 under `herramienta`, and the expected values
// are the boxes T-03 measured in pixels under `nuestro`. A test written with an
// invented payload would only prove that the code does what whoever wrote it
// believed. The three cases that ARE invented say so where they are.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  parseViewport,
  resolveElement,
  resolveExperience,
  resolveAssetList,
  activeAt,
  DEFAULT_AD_VOLUME,
  DEFAULT_PRIMARY_VOLUME,
  FULL_FRAME
} from '../lib/signalling.js';
import { boxToPixels } from '../lib/renderer.js';

const M3 = JSON.parse(
  readFileSync(new URL('../.project/phases/01-poc-web-hlsjs/tasks/T-03/m3-resultados.json', import.meta.url))
);

/** The six asset-lists, verbatim as the SVTA tool emits them. */
const TOOL = M3.herramienta;
/** The same six layouts as T-03 measured them: viewport in %, box in pixels. */
const MEASURED = M3.nuestro;

const LAYOUTS = [
  'cornerOverlay',
  'lowerThirdOverlay',
  'squeezebackFrame',
  'squeezebackDoubleBox',
  'squeezebackLShape',
  'multiView'
];

/** The two layouts whose payload carries no `primaryContent` block (T-03). */
const WITHOUT_PRIMARY = ['cornerOverlay', 'lowerThirdOverlay'];

/**
 * The playback time the Date Range's START-DATE resolves to. 100 is the value
 * T-06 used to resolve these same six payloads, so the numbers below are the
 * ones in `tasks/T-06/t06-los-seis-payloads-resueltos.json`.
 */
const SLOT_START = 100;

/** T-03 called the single ad of the three one-asset layouts `asset1`; the tool
 * calls it `adOverlay1`. Same element, two names. */
const MEASURED_ID = { adOverlay1: 'asset1' };

function measuredElement(type, id) {
  const list = MEASURED[type].elementos;
  const found = list.find((e) => e.elemento === id) || list.find((e) => e.elemento === MEASURED_ID[id]);
  assert.ok(found, `T-03 measured no element called ${id} in ${type}`);
  return found;
}

/** The player area T-03 measured against: 960x540. */
function measuredArea(type) {
  return { width: MEASURED[type].playerArea.w, height: MEASURED[type].playerArea.h };
}

/** The tool's asset-list through the whole signalling layer, as app.js calls it. */
function resolve(type) {
  return resolveAssetList(TOOL[type], { id: type, slotStart: SLOT_START });
}

function toolLayout(type) {
  return TOOL[type].ASSETS[0]['X-AD-CREATIVE-SIGNALING'].payload[0].layout;
}

// ---------------------------------------------------------------------------
// 1. The parsing of `viewport`
// ---------------------------------------------------------------------------

test('viewport is four inset percentages in the order top right bottom left', () => {
  // The two strings of the real payloads that tell the order apart: swapping
  // right with left, or top with bottom, changes both results.
  assert.deepEqual(parseViewport('0 75 75 0'), { top: 0, right: 75, bottom: 75, left: 0 });
  assert.deepEqual(parseViewport('0 0 0 60'), { top: 0, right: 0, bottom: 0, left: 60 });

  // And the same thing through the layer, for the fifteen elements of the six
  // layouts, against the percentages T-03 measured.
  for (const type of LAYOUTS) {
    const [experience] = resolve(type);
    for (const element of experience.elements) {
      assert.deepEqual(
        element.box,
        measuredElement(type, element.id).viewport,
        `${type}/${element.id}`
      );
    }
  }
});

test('a viewport that is not four numbers falls back to the full frame, and warns', () => {
  // INVENTED: the tool always emits four numbers, so there is no real payload
  // for this. The fallback is silent on screen -- the ad would be drawn over
  // the whole frame -- and the warning is the only signal, so it is asserted.
  const warnings = [];
  const original = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    assert.deepEqual(parseViewport('0 75 75'), FULL_FRAME);
    assert.deepEqual(parseViewport('top right bottom left'), FULL_FRAME);
    assert.deepEqual(parseViewport(undefined), FULL_FRAME);
  } finally {
    console.warn = original;
  }
  assert.equal(warnings.length, 3);
});

// ---------------------------------------------------------------------------
// 2. The experience and its window, per layout
// ---------------------------------------------------------------------------

test('each of the six asset-lists resolves to one experience with its type and window', () => {
  for (const type of LAYOUTS) {
    const resolved = resolve(type);
    assert.equal(resolved.length, 1, type);
    const [experience] = resolved;
    assert.equal(experience.id, type);
    assert.equal(experience.type, type);
    // `start` is 0 in the six payloads, so the window opens at the START-DATE.
    assert.equal(experience.startTime, SLOT_START, type);
    assert.equal(experience.duration, 15.015, type);
  }
});

test('the fifteen elements come out with the ids, the uri and the mediaType of the payload', () => {
  let count = 0;
  for (const type of LAYOUTS) {
    const [experience] = resolve(type);
    const layout = toolLayout(type);
    const primary = experience.elements.filter((e) => e.primary);
    assert.equal(primary.length, 1, `${type}: exactly one primary element`);
    assert.equal(primary[0].id, 'primaryContent');
    // Rule 3 of the contract: the primary brings no uri, it is already playing.
    assert.equal(primary[0].uri, null);
    assert.equal(primary[0].mediaType, null);

    const ads = experience.elements.filter((e) => !e.primary);
    assert.deepEqual(
      ads.map((e) => e.id).sort(),
      layout.assets.map((a) => a.id).sort(),
      `${type}: the ads of the payload`
    );
    for (const ad of ads) {
      const source = layout.assets.find((a) => a.id === ad.id);
      assert.equal(ad.mediaType, source.type, `${type}/${ad.id}`);
      // The tool emits `uri: ""` -- an empty string is not a uri, it is a hole
      // for the operator to fill, and it has to come out as null.
      assert.equal(ad.uri, source.uri || null, `${type}/${ad.id}`);
    }
    count += experience.elements.length;
  }
  assert.equal(count, 15, 'the fifteen elements of the six layouts');
});

// ---------------------------------------------------------------------------
// 3. The order by zDepth
// ---------------------------------------------------------------------------

test('elements come out ordered by ascending zDepth in the six layouts', () => {
  for (const type of LAYOUTS) {
    const [experience] = resolve(type);
    const depths = experience.elements.map((e) => e.zDepth);
    assert.deepEqual(depths, [...depths].sort((a, b) => a - b), `${type}: ${depths}`);
  }
});

test('in squeezebackFrame the ad is the background and the primary content is on top', () => {
  // The case where the order matters for real: the ad is at zDepth 0 and the
  // primary at 1, so the ad has to be drawn FIRST. It is also the only layout
  // where the payload puts the primary above an asset.
  const [experience] = resolve('squeezebackFrame');
  assert.deepEqual(
    experience.elements.map((e) => `z${e.zDepth} ${e.id}`),
    ['z0 adOverlay1', 'z1 primaryContent']
  );
});

test('on an equal zDepth the order of the payload holds', () => {
  // INVENTED: no payload of the tool repeats a zDepth. The sort is stable, so
  // the primary content -- which the layer puts first -- stays ahead of the
  // assets, and the assets keep the order of the asset-list.
  const experience = resolveExperience(
    {
      type: 'invented',
      start: 0,
      duration: 1,
      layout: {
        primaryContent: { zDepth: 0, viewport: '0 0 0 0' },
        assets: [
          { id: 'first', zDepth: 0, viewport: '0 0 0 0' },
          { id: 'second', zDepth: 0, viewport: '0 0 0 0' }
        ]
      }
    },
    { id: 'invented', slotStart: 0 }
  );
  assert.deepEqual(experience.elements.map((e) => e.id), ['primaryContent', 'first', 'second']);
});

// ---------------------------------------------------------------------------
// 4. The two defaults the tool omits
// ---------------------------------------------------------------------------

test('the two overlays carry no primaryContent, and the layer assumes the full frame at zDepth 0', () => {
  for (const type of WITHOUT_PRIMARY) {
    assert.equal(toolLayout(type).primaryContent, undefined, `${type}: the payload has no primaryContent`);
    const [experience] = resolve(type);
    const primary = experience.elements.find((e) => e.primary);
    assert.deepEqual(primary.box, FULL_FRAME, type);
    assert.equal(primary.zDepth, 0, type);
    assert.equal(primary.volume, 100, type);
  }
});

test('the four layouts that do carry primaryContent keep its zDepth and its viewport', () => {
  for (const type of LAYOUTS.filter((t) => !WITHOUT_PRIMARY.includes(t))) {
    const source = toolLayout(type).primaryContent;
    assert.ok(source, `${type}: the payload has primaryContent`);
    const [experience] = resolve(type);
    const primary = experience.elements.find((e) => e.primary);
    assert.equal(primary.zDepth, source.zDepth, type);
    assert.deepEqual(primary.box, parseViewport(source.viewport), type);
  }
});

test('no payload of the tool carries volume: the ad comes out silent and the show does not', () => {
  // The fact T-06 measured, asserted over the evidence itself: the field is not
  // omitted only when it is worth 100, it is never there. What the layer does
  // with that absence is ADR 0014, and it is not one answer but two -- silence
  // on the ad, full volume on the primary content.
  //
  // THE PRIMARY HALF IS THE ONE THIS TEST IS FOR. The tool omits the field on
  // the `primaryContent` block as well, so a single default of 0 would leave
  // the show mute in the six layouts and pass every other test in this file:
  // the boxes, the order and the windows would all still be right, and a frame
  // of the recording would look correct.
  assert.ok(!JSON.stringify(TOOL).includes('volume'), 'the six payloads mention volume nowhere');
  assert.equal(DEFAULT_AD_VOLUME, 0);
  assert.equal(DEFAULT_PRIMARY_VOLUME, 100);
  for (const type of LAYOUTS) {
    const [experience] = resolve(type);
    for (const element of experience.elements) {
      assert.equal(element.volume, element.primary ? 100 : 0, `${type}/${element.id}`);
    }
  }
});

test('an explicit volume of 0 survives, because a silent ad is silent on purpose', () => {
  // INVENTED: the tool never emits the field, so there is no real payload with
  // a volume of 0. It is the case that matters anyway -- with `||` instead of
  // `??` a deliberately silent ad would come out at 100 and take the audio of
  // the show, and nothing on screen would say so.
  const experience = resolveExperience(
    {
      type: 'cornerOverlay',
      start: 0,
      duration: 15.015,
      layout: {
        primaryContent: { zDepth: 0, viewport: '0 0 0 0', volume: 0 },
        assets: [{ id: 'adOverlay1', viewport: '0 75 75 0', zDepth: 1, volume: 0 }]
      }
    },
    { id: 'invented', slotStart: 0 }
  );
  for (const element of experience.elements) {
    assert.equal(element.volume, 0, element.id);
  }
  // And the contrast: the same element with the field missing is 0 anyway, so
  // what this proves is that the 0 above SURVIVED and was not produced by the
  // default. The pair that tells `??` from `||` apart is the other one: an
  // explicit 0 on the primary content, whose default is 100.
  assert.equal(resolveElement({ id: 'adOverlay1', viewport: '0 75 75 0' }, false).volume, 0);
  assert.equal(resolveElement({ id: 'primaryContent', viewport: '0 0 0 0' }, true).volume, 100);
});

// ---------------------------------------------------------------------------
// 5. The activation window
// ---------------------------------------------------------------------------

test('the activation window is half open: in at startTime, out at the end', () => {
  const [experience] = resolve('cornerOverlay');
  const end = experience.startTime + experience.duration; // 115.015
  assert.deepEqual(activeAt([experience], experience.startTime - 0.001), []);
  assert.deepEqual(activeAt([experience], experience.startTime), [experience]);
  assert.deepEqual(activeAt([experience], experience.startTime + 7), [experience]);
  assert.deepEqual(activeAt([experience], end - 0.001), [experience]);
  assert.deepEqual(activeAt([experience], end), []);
});

test('activeAt returns every experience active at that instant', () => {
  // Two of the real layouts, in two Date Ranges that overlap: the renderer
  // builds all of them, so the window has to hand over all of them.
  const corner = resolveAssetList(TOOL.cornerOverlay, { id: 'AD-1', slotStart: 100 });
  const lower = resolveAssetList(TOOL.lowerThirdOverlay, { id: 'AD-2', slotStart: 110 });
  const all = [...corner, ...lower];
  assert.deepEqual(activeAt(all, 99), []);
  assert.deepEqual(activeAt(all, 105), corner);
  assert.deepEqual(activeAt(all, 112), all);
  assert.deepEqual(activeAt(all, 120), lower);
  assert.deepEqual(activeAt(all, 126), []);
});

// ---------------------------------------------------------------------------
// 6. From insets to a box in pixels
// ---------------------------------------------------------------------------

test('the insets become the fifteen boxes in pixels T-03 measured', () => {
  for (const type of LAYOUTS) {
    const [experience] = resolve(type);
    const area = measuredArea(type);
    for (const element of experience.elements) {
      const measured = measuredElement(type, element.id);
      assert.deepEqual(boxToPixels(element.box, area), measured.medidoPx, `${type}/${element.id}`);
      // What T-03 predicted and what the browser rendered were the same thing.
      assert.deepEqual(measured.esperadoPx, measured.medidoPx, `${type}/${element.id}`);
    }
  }
});

test('the conversion follows the player area, which is what a resize depends on', () => {
  // The boxes are the real ones of squeezebackFrame, the layout that pulls in
  // all four edges; the area is twice the one T-03 measured, so every number
  // doubles. A hard-coded 960x540 passes the test above and fails this one.
  const [experience] = resolve('squeezebackFrame');
  const primary = experience.elements.find((e) => e.primary);
  assert.deepEqual(boxToPixels(primary.box, { width: 1920, height: 1080 }), {
    left: 384,
    top: 216,
    width: 1152,
    height: 648
  });
});
