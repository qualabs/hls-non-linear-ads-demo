// capability-options.test.js -- the tests of T-01 of phase 15.
//
// What they are for: the intermediate step of ADR 0085. The ad presentation
// server answers every option of an ad, whatever the device said, and the
// library keeps the first one the declared capability satisfies (R5.6). When
// none is left, the asset falls to its default linear ad or is skipped. Every
// branch of that fails in silence on a screen -- an option that should have
// been discarded is drawn anyway, and looks like the demo working -- so each
// rule is asserted here against a list shaped like the one stage-pair serves.
//
// The asset-list is invented on purpose, and it is the shape of
// demo/stage-pair/signalling/: one asset, one item, two options in order of
// preference, the ad in video first and the same ad as an image second.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BLOCK,
  IMAGE_OVER_VIDEO_PARAM,
  LINEAR_TYPE,
  VIDEO_DECODERS_PARAM,
  assetListUrl,
  needsOf,
  resolveAssetList,
  selectOption,
  usableCapabilities
} from '../lib/signalling.js';

const ID = 'AD-A-CONCURRENT';
const SLOT_START = 20;

const VIDEO = {
  type: 'squeezebackDoubleBox',
  layout: {
    primaryContent: { zDepth: 0, viewport: '25 50 25 0' },
    assets: [{ id: 'ad', type: 'application/vnd.apple.mpegurl', uri: '/ad.m3u8', viewport: '25 0 25 50', zDepth: 1 }]
  }
};
const IMAGE = {
  type: 'squeezebackDoubleBox',
  layout: {
    primaryContent: { zDepth: 0, viewport: '25 50 25 0' },
    assets: [{ id: 'ad', type: 'image/svg+xml', uri: '/ad.svg', viewport: '25 0 25 50', zDepth: 1 }]
  }
};

/** The list stage-pair serves: with a default linear ad (`URI`), or without one. */
function list({ withDefault = true, item = { start: 0, duration: 12, options: [VIDEO, IMAGE] } } = {}) {
  const asset = { DURATION: 12, [BLOCK]: { version: 2, type: 'slot', payload: [item] } };
  if (withDefault) asset.URI = '/linear.m3u8';
  return { ASSETS: [asset] };
}

/** What a list resolves to under a capability: the media drawn, and the report. */
function resolve(capabilities, options) {
  const report = [];
  const out = resolveAssetList(list(options), {
    id: ID, slotStart: SLOT_START, capabilities: usableCapabilities(capabilities), report
  });
  const drawn = out.map((e) => e.type === LINEAR_TYPE
    ? 'linear'
    : e.elements.filter((x) => !x.primary).map((x) => x.mediaType).join(','));
  return { drawn, report: report[0] };
}

const quiet = (fn) => {
  const { warn, log } = console;
  console.warn = console.log = () => {};
  try { return fn(); } finally { console.warn = warn; console.log = log; }
};

test('an option asks one decoder for the primary content plus one per video element, and images apart', () => {
  assert.deepEqual(needsOf(VIDEO), { videoDecoders: 2, imageOverVideo: false });
  assert.deepEqual(needsOf(IMAGE), { videoDecoders: 1, imageOverVideo: true });
});

test('the four combinations of the two axes, against the same list of [video, image]', () => {
  quiet(() => {
    assert.deepEqual(resolve({ videoDecoders: 2, imageOverVideo: true }).drawn, ['application/vnd.apple.mpegurl']);
    assert.deepEqual(resolve({ videoDecoders: 2, imageOverVideo: false }).drawn, ['application/vnd.apple.mpegurl']);
    assert.deepEqual(resolve({ videoDecoders: 1, imageOverVideo: true }).drawn, ['image/svg+xml']);
    assert.deepEqual(resolve({ videoDecoders: 1, imageOverVideo: false }).drawn, ['linear']);
  });
});

test('with no option left, the asset plays its default linear ad, or is skipped when it has none', () => {
  quiet(() => {
    const none = { videoDecoders: 1, imageOverVideo: false };
    const withDefault = resolve(none);
    assert.deepEqual(withDefault.drawn, ['linear']);
    assert.equal(withDefault.report.outcome, 'default');

    const without = resolve(none, { withDefault: false });
    assert.deepEqual(without.drawn, []);
    assert.equal(without.report.outcome, 'skipped');

    // The control: the same list without a default, on a device that can draw
    // it, is drawn. The skip above is the capability's doing and not the
    // missing URI's.
    assert.deepEqual(resolve({ videoDecoders: 2 }, { withDefault: false }).drawn, ['application/vnd.apple.mpegurl']);
  });
});

test('every discarded option is reported with a sentence that says why', () => {
  quiet(() => {
    const { report } = resolve({ videoDecoders: 1, imageOverVideo: false });
    assert.equal(report.items[0].chosen, null);
    assert.deepEqual(report.items[0].discarded, [
      { index: 0, reason: 'needs 2 video decoders and the device declares 1' },
      { index: 1, reason: 'needs an image over the video and the device declares it cannot draw one' }
    ]);
    assert.deepEqual(report.items[0].offered.map((o) => o.media), [['application/vnd.apple.mpegurl'], ['image/svg+xml']]);

    const chose = resolve({ videoDecoders: 1, imageOverVideo: true }).report;
    assert.equal(chose.items[0].chosen, 1);
    assert.equal(chose.outcome, 'drawn');
  });
});

test('the order of the options is the preference, and it is not re-ranked', () => {
  quiet(() => {
    const item = { start: 0, duration: 12, options: [IMAGE, VIDEO] };
    assert.deepEqual(resolve({ videoDecoders: 2, imageOverVideo: true }, { item }).drawn, ['image/svg+xml']);
  });
});

test('the chosen option keeps the window of its item', () => {
  const { option } = selectOption({ start: 3, duration: 9, options: [VIDEO] }, null);
  assert.equal(option.start, 3);
  assert.equal(option.duration, 9);
  assert.equal(option.type, VIDEO.type);
  assert.equal('options' in option, false);
});

test('without a declared capability nothing is filtered and the first option wins (R29.2)', () => {
  quiet(() => {
    assert.deepEqual(resolve(null).drawn, ['application/vnd.apple.mpegurl']);
    assert.deepEqual(resolve({}).drawn, ['application/vnd.apple.mpegurl']);
  });
});

test('an axis that is not declared is not a reason to discard', () => {
  quiet(() => {
    // Only images declared, as absent: the video option needs no image, and the
    // decoders were not declared, so it is not refused over them.
    assert.deepEqual(resolve({ imageOverVideo: false }).drawn, ['application/vnd.apple.mpegurl']);
    // Only one decoder declared: the image option passes because images were
    // not said to be impossible.
    assert.deepEqual(resolve({ videoDecoders: 1 }).drawn, ['image/svg+xml']);
  });
});

test('an item with no options is one option, and a capability can still refuse it', () => {
  quiet(() => {
    const item = { start: 0, duration: 12, ...VIDEO };
    assert.deepEqual(resolve(null, { item }).drawn, ['application/vnd.apple.mpegurl']);
    assert.deepEqual(resolve({ videoDecoders: 2 }, { item }).drawn, ['application/vnd.apple.mpegurl']);
    assert.deepEqual(resolve({ videoDecoders: 1 }, { item }).drawn, ['linear']);
  });
});

test('a value that is not one of its axis is neither used nor sent, and it is said', () => {
  const warned = [];
  const { warn } = console;
  console.warn = (m) => warned.push(m);
  try {
    assert.equal(usableCapabilities({ videoDecoders: 0 }), null);
    assert.equal(usableCapabilities({ videoDecoders: 1.5 }), null);
    assert.equal(usableCapabilities({ imageOverVideo: 'yes' }), null);
    assert.deepEqual(usableCapabilities({ videoDecoders: '2', imageOverVideo: 'no' }), { videoDecoders: 2, imageOverVideo: null });
  } finally { console.warn = warn; }
  assert.equal(warned.length, 4);
  // Absent is a supported state and is not warned about.
  assert.equal(usableCapabilities({}), null);
  assert.equal(usableCapabilities(null), null);
  assert.equal(warned.length, 4);
});

test('the request carries one parameter per declared axis, and nothing without a capability', () => {
  const base = 'http://host/content/primary/con-daterange.m3u8';
  assert.equal(assetListUrl('/signalling/a.json', base), 'http://host/signalling/a.json');
  assert.equal(assetListUrl('/signalling/a.json', base, usableCapabilities({ videoDecoders: 1, imageOverVideo: false })),
    `http://host/signalling/a.json?${VIDEO_DECODERS_PARAM}=1&${IMAGE_OVER_VIDEO_PARAM}=0`);
  assert.equal(assetListUrl('/signalling/a.json', base, usableCapabilities({ imageOverVideo: true })),
    `http://host/signalling/a.json?${IMAGE_OVER_VIDEO_PARAM}=1`);
  assert.equal(VIDEO_DECODERS_PARAM, 'sgai-video-decoders');
  assert.equal(IMAGE_OVER_VIDEO_PARAM, 'sgai-image-over-video');
});

test('one item with no option left takes the whole asset to its default, and not only itself', () => {
  // The unit of the fallback is the asset (see `usablePayload`): drawing the
  // item that fits and dropping the one that does not would play a different
  // ad than the one sold, over a URI that was declared for the whole asset.
  quiet(() => {
    const asset = {
      URI: '/linear.m3u8',
      DURATION: 12,
      [BLOCK]: {
        version: 2,
        type: 'slot',
        payload: [
          { start: 0, duration: 6, options: [IMAGE] },
          { start: 6, duration: 6, options: [VIDEO] }
        ]
      }
    };
    const out = resolveAssetList({ ASSETS: [asset] }, {
      id: ID, slotStart: SLOT_START, capabilities: usableCapabilities({ videoDecoders: 1, imageOverVideo: true })
    });
    assert.deepEqual(out.map((e) => e.type), [LINEAR_TYPE]);
  });
});
