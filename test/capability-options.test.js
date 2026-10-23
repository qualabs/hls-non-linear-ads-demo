// capability-options.test.js -- the tests of T-01 of phase 15.
//
// What they are for: the intermediate step of ADR 0085. The ad presentation
// server answers every layoutOption of an ad, whatever the device said, and the
// library keeps the first one the configured capabilities fit (SVTA2053 5.3.3,
// `{ concurrentVideo, concurrentImage }` since ADR 0104). When
// none is left, the asset falls to its default linear ad or is skipped. Every
// branch of that fails in silence on a screen -- an option that should have
// been discarded is drawn anyway, and looks like the demo working -- so each
// rule is asserted here against a list shaped like the one stage-pair serves.
//
// The asset-list is invented on purpose, and it is the shape of
// demo/stage-pair/signalling/: one asset, one item, two layoutOptions in order of
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
function list({ withDefault = true, item = { start: 0, duration: 12, layoutOptions: [VIDEO, IMAGE] } } = {}) {
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
  assert.deepEqual(needsOf(VIDEO), { concurrentVideo: 2, concurrentImage: false });
  assert.deepEqual(needsOf(IMAGE), { concurrentVideo: 1, concurrentImage: true });
});

test('the four combinations of the two axes, against the same list of [video, image]', () => {
  quiet(() => {
    assert.deepEqual(resolve({ concurrentVideo: 2, concurrentImage: true }).drawn, ['application/vnd.apple.mpegurl']);
    assert.deepEqual(resolve({ concurrentVideo: 2, concurrentImage: false }).drawn, ['application/vnd.apple.mpegurl']);
    assert.deepEqual(resolve({ concurrentVideo: 1, concurrentImage: true }).drawn, ['image/svg+xml']);
    assert.deepEqual(resolve({ concurrentVideo: 1, concurrentImage: false }).drawn, ['linear']);
  });
});

test('with no option left, the asset plays its default linear ad, or is skipped when it has none', () => {
  quiet(() => {
    const none = { concurrentVideo: 1, concurrentImage: false };
    const withDefault = resolve(none);
    assert.deepEqual(withDefault.drawn, ['linear']);
    assert.equal(withDefault.report.outcome, 'default');

    const without = resolve(none, { withDefault: false });
    assert.deepEqual(without.drawn, []);
    assert.equal(without.report.outcome, 'skipped');

    // The control: the same list without a default, on a device that can draw
    // it, is drawn. The skip above is the capability's doing and not the
    // missing URI's.
    assert.deepEqual(resolve({ concurrentVideo: 2 }, { withDefault: false }).drawn, ['application/vnd.apple.mpegurl']);
  });
});

test('every discarded option is reported with a sentence that says why', () => {
  quiet(() => {
    const { report } = resolve({ concurrentVideo: 1, concurrentImage: false });
    assert.equal(report.items[0].chosen, null);
    assert.deepEqual(report.items[0].discarded, [
      { index: 0, reason: 'needs 2 video decoders and concurrentVideo is 1' },
      { index: 1, reason: 'needs an image over the video and concurrentImage is false' }
    ]);
    assert.deepEqual(report.items[0].offered.map((o) => o.media), [['application/vnd.apple.mpegurl'], ['image/svg+xml']]);

    const chose = resolve({ concurrentVideo: 1, concurrentImage: true }).report;
    assert.equal(chose.items[0].chosen, 1);
    assert.equal(chose.outcome, 'drawn');
  });
});

test('the order of the layoutOptions is the preference, and it is not re-ranked', () => {
  quiet(() => {
    const item = { start: 0, duration: 12, layoutOptions: [IMAGE, VIDEO] };
    assert.deepEqual(resolve({ concurrentVideo: 2, concurrentImage: true }, { item }).drawn, ['image/svg+xml']);
  });
});

test('the chosen option keeps the window of its item', () => {
  const { option } = selectOption({ start: 3, duration: 9, layoutOptions: [VIDEO] }, null);
  assert.equal(option.start, 3);
  assert.equal(option.duration, 9);
  assert.equal(option.type, VIDEO.type);
  assert.equal('layoutOptions' in option, false);
});

test('without configured capabilities nothing is filtered and the first option wins', () => {
  quiet(() => {
    assert.deepEqual(resolve(null).drawn, ['application/vnd.apple.mpegurl']);
    assert.deepEqual(resolve({}).drawn, ['application/vnd.apple.mpegurl']);
  });
});

test('a capability that is not configured discards nothing', () => {
  quiet(() => {
    // Only images configured, as absent: the video option needs no image, and
    // the decoders were not configured, so it is not refused over them.
    assert.deepEqual(resolve({ concurrentImage: false }).drawn, ['application/vnd.apple.mpegurl']);
    // Only one decoder configured: the image option passes because images were
    // not said to be impossible.
    assert.deepEqual(resolve({ concurrentVideo: 1 }).drawn, ['image/svg+xml']);
  });
});

test('an item with no layoutOptions is one option, and a capability can still refuse it', () => {
  quiet(() => {
    const item = { start: 0, duration: 12, ...VIDEO };
    assert.deepEqual(resolve(null, { item }).drawn, ['application/vnd.apple.mpegurl']);
    assert.deepEqual(resolve({ concurrentVideo: 2 }, { item }).drawn, ['application/vnd.apple.mpegurl']);
    assert.deepEqual(resolve({ concurrentVideo: 1 }, { item }).drawn, ['linear']);
  });
});

test('a value that is not one of its axis is neither used nor sent, and it is said', () => {
  const warned = [];
  const { warn } = console;
  console.warn = (m) => warned.push(m);
  try {
    assert.equal(usableCapabilities({ concurrentVideo: 0 }), null);
    assert.equal(usableCapabilities({ concurrentVideo: 1.5 }), null);
    assert.equal(usableCapabilities({ concurrentImage: 'yes' }), null);
    assert.deepEqual(usableCapabilities({ concurrentVideo: '2', concurrentImage: 'no' }), { concurrentVideo: 2, concurrentImage: null });
  } finally { console.warn = warn; }
  assert.equal(warned.length, 4);
  // Absent is a supported state and is not warned about.
  assert.equal(usableCapabilities({}), null);
  assert.equal(usableCapabilities(null), null);
  assert.equal(warned.length, 4);
});

test('the request carries one parameter per configured capability, and nothing without one', () => {
  const base = 'http://host/content/primary/con-daterange.m3u8';
  assert.equal(assetListUrl('/signalling/a.json', base), 'http://host/signalling/a.json');
  assert.equal(assetListUrl('/signalling/a.json', base, usableCapabilities({ concurrentVideo: 1, concurrentImage: false })),
    `http://host/signalling/a.json?${VIDEO_DECODERS_PARAM}=1&${IMAGE_OVER_VIDEO_PARAM}=0`);
  assert.equal(assetListUrl('/signalling/a.json', base, usableCapabilities({ concurrentImage: true })),
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
          { start: 0, duration: 6, layoutOptions: [IMAGE] },
          { start: 6, duration: 6, layoutOptions: [VIDEO] }
        ]
      }
    };
    const out = resolveAssetList({ ASSETS: [asset] }, {
      id: ID, slotStart: SLOT_START, capabilities: usableCapabilities({ concurrentVideo: 1, concurrentImage: true })
    });
    assert.deepEqual(out.map((e) => e.type), [LINEAR_TYPE]);
  });
});

test('the names before ADR 0104 are not read, and that is said instead of filtering on nothing', () => {
  const warned = [];
  const { warn } = console;
  console.warn = (m) => warned.push(m);
  try {
    assert.equal(usableCapabilities({ videoDecoders: 1, imageOverVideo: false }), null);
    assert.deepEqual(usableCapabilities({ concurrentVideo: 1, imageOverVideo: false }),
      { concurrentVideo: 1, concurrentImage: null });
  } finally { console.warn = warn; }
  assert.equal(warned.length, 3);
  assert.match(warned[0], /capabilities\.videoDecoders is not a capability this library reads/);
});

test('an asset-list with the key `options` of the drafts before v3 is not read as layoutOptions', () => {
  // SVTA2053 v3 renamed `options` to `layoutOptions` and says nothing about the
  // old name, so the library reads only the new one (ADR 0105): an item that
  // carries `options` is an item with no layout of its own, which cannot be
  // drawn, and the asset goes to its default.
  quiet(() => {
    const item = { start: 0, duration: 12, options: [VIDEO, IMAGE] };
    assert.deepEqual(resolve(null, { item }).drawn, ['linear']);
  });
});

test('the example of SVTA2053 5.3.3: backplate in video first, the same campaign as an image second', () => {
  // The four devices of the example of the specification, against the shape of
  // its Code 7. The fourth, the load failure, is in first-request-failover.test.js.
  const BACKPLATE = {
    type: 'squeezebackLShape',
    layout: {
      primaryContent: { zDepth: 1, viewport: '0 0 25 25' },
      assets: [{ id: 'lBackplate', type: 'application/vnd.apple.mpegurl', uri: '/b.m3u8', viewport: '0 0 0 0', zDepth: 0 }]
    }
  };
  const item = { start: 0, duration: 12, layoutOptions: [BACKPLATE, IMAGE] };
  quiet(() => {
    assert.deepEqual(resolve({ concurrentVideo: 2 }, { item }).drawn, ['application/vnd.apple.mpegurl']);
    assert.deepEqual(resolve({ concurrentVideo: 1, concurrentImage: true }, { item }).drawn, ['image/svg+xml']);
    assert.deepEqual(resolve({ concurrentVideo: 1, concurrentImage: false }, { item }).drawn, ['linear']);
  });
});
