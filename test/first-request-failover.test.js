// first-request-failover.test.js -- the tests of ADR 0106 and of the signalling
// half of ADR 0107.
//
// What they are for: the "Asset load failure" of SVTA2053 5.3.3 as
// PRE-VALIDATION, which since ADR 0107 is optional (`preValidateAssets`, off by
// default) and only shapes the ordered list the renderer is handed. When it
// runs, the first request for each asset of the first fitting option is made;
// when one fails, the option is left out and the next one that fits is asked
// for, and when no option is left the default linear ad is asked for, and
// skipped if its own first request fails. The renderer's own failover, which
// is always on, is in renderer-failover.test.js. All of it fails in silence on a screen: an option that
// should have been passed over is drawn as a black box, and a default that
// should have been skipped is a black frame over the programme.
//
// The request itself is the browser's (`firstRequest` in hls/media.js) and is
// not here. What is here is the decision, driven by a fake that answers from a
// table and records what it was asked, so a test can also say what was NOT
// asked for -- the second option of an ad whose first option loaded.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import { LINEAR_TYPE } from '../lib/experience.js';
import {
  PRE_VALIDATE_METHODS,
  firstRequestsOf,
  selectOption,
  usableCapabilities,
  usablePreValidation
} from '../lib/capabilities.js';
import {
  BLOCK,
  createSignalling,
  pendingFirstRequests,
  resolveAssets,
  resolveWithFirstRequests
} from '../hls/signalling.js';
import { firstRequest as mediaFirstRequest } from '../hls/media.js';

const ID = 'AD-A-CONCURRENT';
const SLOT_START = 20;

// The example of SVTA2053 5.3.3: the backplate in video first, the same
// campaign as an image second.
const BACKPLATE = {
  type: 'squeezebackLShape',
  layout: {
    primaryContent: { zDepth: 1, viewport: '0 0 25 25' },
    assets: [{ id: 'lBackplate', type: 'application/vnd.apple.mpegurl', uri: '/b.m3u8', viewport: '0 0 0 0', zDepth: 0 }]
  }
};
const IMAGE = {
  type: 'squeezebackDoubleBox',
  layout: {
    primaryContent: { zDepth: 0, viewport: '25 50 25 0' },
    assets: [{ id: 'ad', type: 'image/svg+xml', uri: '/ad.svg', viewport: '25 0 25 50', zDepth: 1 }]
  }
};
const DEFAULT_URI = '/linear.m3u8';

function list({ withDefault = true, item = { start: 0, duration: 12, layoutOptions: [BACKPLATE, IMAGE] } } = {}) {
  const asset = { DURATION: 12, [BLOCK]: { version: 2, type: 'slot', payload: [item] } };
  if (withDefault) asset.URI = DEFAULT_URI;
  return { ASSETS: [asset] };
}

/** A first request that answers from `failing` and records every uri it is asked for. */
function fake(failing = {}) {
  const asked = [];
  const firstRequest = async (uri, mediaType) => {
    asked.push({ uri, mediaType });
    if (failing[uri] === 'throw') throw new Error('boom');
    return failing[uri] ? { ok: false, error: failing[uri] } : { ok: true };
  };
  return { asked, firstRequest };
}

const quietSync = (fn) => {
  const { warn, log } = console;
  console.warn = console.log = () => {};
  try { return fn(); } finally { console.warn = warn; console.log = log; }
};

const quiet = async (fn) => {
  const { warn, log } = console;
  console.warn = console.log = () => {};
  try { return await fn(); } finally { console.warn = warn; console.log = log; }
};

/** Resolve a list with the fake, and say what was drawn, what was asked and what was reported. */
async function run({ capabilities = { concurrentVideo: 2, concurrentImage: true }, failing = {}, listOptions } = {}) {
  const { asked, firstRequest } = fake(failing);
  const report = [];
  const requests = [];
  const out = await quiet(() => resolveWithFirstRequests(list(listOptions), {
    id: ID, slotStart: SLOT_START, capabilities: usableCapabilities(capabilities), report, firstRequest, requests
  }));
  const drawn = out.map((e) => e.type === LINEAR_TYPE
    ? 'linear'
    : e.elements.filter((x) => !x.primary).map((x) => x.mediaType).join(','));
  return { drawn, asked: asked.map((a) => a.uri), report: report[0], requests, out };
}

/** What an experience hands the renderer: the media of each option in order, and the default. */
const handed = (e) => ({
  options: e.options.map((o) => [o.index, o.elements.filter((x) => !x.primary).map((x) => x.mediaType).join(',')]),
  fallback: e.fallback ? e.fallback.elements.find((x) => !x.primary).uri : null
});

test('the first requests of an option are its elements with a uri, the image and the playlist alike', () => {
  assert.deepEqual(firstRequestsOf(BACKPLATE), [{ uri: '/b.m3u8', mediaType: 'application/vnd.apple.mpegurl' }]);
  assert.deepEqual(firstRequestsOf(IMAGE), [{ uri: '/ad.svg', mediaType: 'image/svg+xml' }]);
  // An empty uri asks for nothing and is not a failure (SVTA2053 6.6.4), and a
  // uri shared by two elements is asked for once.
  const shared = { layout: { assets: [{ uri: '' }, { uri: '/x.m3u8' }, { uri: ' /x.m3u8 ' }] } };
  assert.deepEqual(firstRequestsOf(shared).map((r) => r.uri), ['/x.m3u8']);
});

test('everything loads: the first option is drawn, and the second one is never asked for', async () => {
  const { drawn, asked, report } = await run();
  assert.deepEqual(drawn, ['application/vnd.apple.mpegurl']);
  assert.deepEqual(asked, ['/b.m3u8']);
  assert.equal(report.outcome, 'drawn');
  assert.equal(report.items[0].chosen, 0);
});

test('the example of SVTA2053 5.3.3: a 404 on the backplate playlist presents the second option', async () => {
  const { drawn, asked, report, requests } = await run({ failing: { '/b.m3u8': 'HTTP 404' } });
  assert.deepEqual(drawn, ['image/svg+xml']);
  assert.deepEqual(asked, ['/b.m3u8', '/ad.svg']);
  assert.equal(report.outcome, 'drawn');
  assert.equal(report.items[0].chosen, 1);
  assert.deepEqual(report.items[0].discarded, [
    { index: 0, reason: 'failed on the first request for /b.m3u8 (HTTP 404)', failed: '/b.m3u8' }
  ]);
  assert.deepEqual(requests, [{ uri: '/b.m3u8', ok: false, error: 'HTTP 404' }, { uri: '/ad.svg', ok: true }]);
});

test('the next option is the next one that FITS: one the capabilities refuse is not asked for', async () => {
  // Three options: video, a second video, the image. One decoder for the ad
  // and images allowed -- so the second video does not fit either, and after
  // the image fails there is nothing left.
  const SECOND_VIDEO = { ...BACKPLATE, layout: { ...BACKPLATE.layout, assets: [{ ...BACKPLATE.layout.assets[0], uri: '/c.m3u8' }] } };
  const item = { start: 0, duration: 12, layoutOptions: [IMAGE, SECOND_VIDEO] };
  const { drawn, asked, report } = await run({
    capabilities: { concurrentVideo: 1, concurrentImage: true },
    failing: { '/ad.svg': 'the image could not be loaded' },
    listOptions: { item }
  });
  assert.deepEqual(asked, ['/ad.svg', DEFAULT_URI]);
  assert.deepEqual(drawn, ['linear']);
  assert.equal(report.outcome, 'default');
  assert.deepEqual(report.items[0].discarded.map((d) => d.index), [0, 1]);
});

test('every option that fits fails: the default linear ad is asked for, and played when it loads', async () => {
  const { drawn, asked, report } = await run({ failing: { '/b.m3u8': 'HTTP 404', '/ad.svg': 'network error' } });
  assert.deepEqual(asked, ['/b.m3u8', '/ad.svg', DEFAULT_URI]);
  assert.deepEqual(drawn, ['linear']);
  assert.equal(report.outcome, 'default');
  assert.equal(report.defaultFailed, undefined);
});

test('the first request of the linear default fails: the asset is skipped', async () => {
  const { drawn, report } = await run({
    failing: { '/b.m3u8': 'HTTP 404', '/ad.svg': 'HTTP 404', [DEFAULT_URI]: 'HTTP 500' }
  });
  assert.deepEqual(drawn, []);
  assert.equal(report.outcome, 'skipped');
  assert.deepEqual(report.defaultFailed, { uri: DEFAULT_URI, error: 'HTTP 500' });
});

test('no option fits: the default is asked for without asking for any option, and skipped if it fails', async () => {
  const none = { concurrentVideo: 1, concurrentImage: false };
  const played = await run({ capabilities: none });
  assert.deepEqual(played.asked, [DEFAULT_URI]);
  assert.deepEqual(played.drawn, ['linear']);

  const skipped = await run({ capabilities: none, failing: { [DEFAULT_URI]: 'network error' } });
  assert.deepEqual(skipped.drawn, []);
  assert.equal(skipped.report.outcome, 'skipped');
});

test('a bare linear ad is the linear default too, and its failed first request skips it', async () => {
  const { firstRequest } = fake({ [DEFAULT_URI]: 'HTTP 404' });
  const report = [];
  const out = await quiet(() => resolveWithFirstRequests({ ASSETS: [{ URI: DEFAULT_URI, DURATION: 10 }] }, {
    id: ID, slotStart: SLOT_START, report, firstRequest
  }));
  assert.deepEqual(out, []);
  assert.equal(report[0].outcome, 'skipped');
});

test('without a default, every option failing skips the asset and nothing else is asked for', async () => {
  const { drawn, asked, report } = await run({
    failing: { '/b.m3u8': 'HTTP 404', '/ad.svg': 'HTTP 404' }, listOptions: { withDefault: false }
  });
  assert.deepEqual(asked, ['/b.m3u8', '/ad.svg']);
  assert.deepEqual(drawn, []);
  assert.equal(report.outcome, 'skipped');
  assert.equal(report.defaultFailed, undefined);
});

test('a first request that throws counts as failed', async () => {
  const { drawn, report } = await run({ failing: { '/b.m3u8': 'throw' } });
  assert.deepEqual(drawn, ['image/svg+xml']);
  assert.match(report.items[0].discarded[0].reason, /failed on the first request for \/b\.m3u8 \(boom\)/);
});

test('a skipped asset keeps the window of the ones after it', async () => {
  // Two assets: the first has nothing that loads, the second draws. The
  // second still starts after the DURATION of the first (Appendix D.5).
  const asset = (uri) => ({
    DURATION: 12,
    [BLOCK]: { version: 2, type: 'slot', payload: [{ start: 0, duration: 12, layoutOptions: [{ ...IMAGE, layout: { ...IMAGE.layout, assets: [{ ...IMAGE.layout.assets[0], uri }] } }] }] }
  });
  const { firstRequest } = fake({ '/dead.svg': 'HTTP 404' });
  const out = await quiet(() => resolveWithFirstRequests({ ASSETS: [asset('/dead.svg'), asset('/live.svg')] }, {
    id: ID, slotStart: SLOT_START, firstRequest
  }));
  assert.equal(out.length, 1);
  assert.equal(out[0].startTime, SLOT_START + 12);
});

test('an item with no option left does not ask for the options of the other items of its asset', () => {
  // The unit of the fallback is the asset: one item that cannot be drawn takes
  // it to its default, so asking for the other item's assets is wasted.
  const assetList = {
    ASSETS: [{
      URI: DEFAULT_URI,
      DURATION: 12,
      [BLOCK]: { version: 2, type: 'slot', payload: [
        { start: 0, duration: 6, layoutOptions: [BACKPLATE] },
        { start: 6, duration: 6, layoutOptions: [IMAGE] }
      ] }
    }]
  };
  const capabilities = usableCapabilities({ concurrentVideo: 2, concurrentImage: false });
  assert.deepEqual(pendingFirstRequests(assetList, { capabilities, loads: new Map() }), [{ uri: DEFAULT_URI, mediaType: null }]);
});

test('selectOption waits for a first request it does not know, and passes over one that failed', () => {
  const item = { start: 0, duration: 12, layoutOptions: [BACKPLATE, IMAGE] };
  const waiting = selectOption(item, null, new Map());
  assert.equal(waiting.option, null);
  assert.deepEqual(waiting.pending.map((r) => r.uri), ['/b.m3u8']);

  const next = selectOption(item, null, new Map([['/b.m3u8', { ok: false, error: 'HTTP 404' }]]));
  assert.equal(next.option, null);
  assert.deepEqual(next.pending.map((r) => r.uri), ['/ad.svg']);

  const chosen = selectOption(item, null, new Map([['/b.m3u8', { ok: false, error: 'HTTP 404' }], ['/ad.svg', { ok: true }]]));
  assert.equal(chosen.index, 1);
  assert.deepEqual(chosen.pending, []);
});

test('without load results nothing is asked for and every asset counts as loaded', () => {
  const out = resolveAssets(list(), { id: ID, slotStart: SLOT_START, capabilities: usableCapabilities({ concurrentVideo: 2 }) });
  assert.equal(out.length, 1);
  assert.notEqual(out[0].type, LINEAR_TYPE);
});

// ---------------------------------------------------------------------------
// The ordered list the renderer is handed (ADR 0107)
// ---------------------------------------------------------------------------

test('without pre-validation every option that fits is handed over in order, and the default last', () => {
  const out = resolveAssets(list(), { id: ID, slotStart: SLOT_START, capabilities: usableCapabilities({ concurrentVideo: 2, concurrentImage: true }) });
  assert.deepEqual(handed(out[0]), {
    options: [[0, 'application/vnd.apple.mpegurl'], [1, 'image/svg+xml']],
    fallback: DEFAULT_URI
  });
  // The first option is what `type` and `elements` already describe.
  assert.equal(out[0].options[0].elements, out[0].elements);
  assert.equal(out[0].assetId, `${ID}.a0`);
  // The default is an experience of its own, with the whole asset as its window.
  assert.equal(out[0].fallback.type, LINEAR_TYPE);
  assert.equal(out[0].fallback.startTime, SLOT_START);
  assert.equal(out[0].fallback.duration, 12);
  assert.equal(out[0].fallback.fallback, null);
});

test('without pre-validation an option the capabilities refuse is not handed over', () => {
  const report = [];
  const out = quietSync(() => resolveAssets(list(), {
    id: ID, slotStart: SLOT_START, capabilities: usableCapabilities({ concurrentVideo: 1, concurrentImage: true }), report
  }));
  assert.deepEqual(handed(out[0]).options, [[1, 'image/svg+xml']]);
  assert.deepEqual(report[0].items[0].order, [1]);
  assert.equal(report[0].fallback, DEFAULT_URI);
});

test('with pre-validation, an option whose first request failed is left out of the list, and the later ones stay', async () => {
  const { out, report } = await run({ failing: { '/b.m3u8': 'HTTP 404' } });
  assert.deepEqual(handed(out[0]), { options: [[1, 'image/svg+xml']], fallback: DEFAULT_URI });
  assert.deepEqual(report.items[0].order, [1]);
});

test('with pre-validation and everything loading, the later options are handed over unrequested', async () => {
  const { out, asked } = await run();
  assert.deepEqual(asked, ['/b.m3u8']);
  assert.deepEqual(handed(out[0]).options, [[0, 'application/vnd.apple.mpegurl'], [1, 'image/svg+xml']]);
});

test('a default chosen up front is its own single option, with no default behind it', async () => {
  const { out } = await run({ failing: { '/b.m3u8': 'HTTP 404', '/ad.svg': 'HTTP 404' } });
  assert.equal(out[0].type, LINEAR_TYPE);
  assert.deepEqual(out[0].options.map((o) => o.index), [null]);
  assert.equal(out[0].fallback, null);
});

test('a break without a default hands over its options and no fallback', () => {
  const out = resolveAssets(list({ withDefault: false }), { id: ID, slotStart: SLOT_START });
  assert.equal(out[0].fallback, null);
  assert.equal(out[0].options.length, 2);
});

// ---------------------------------------------------------------------------
// The configuration: preValidateAssets and preValidateMethod (ADR 0107)
// ---------------------------------------------------------------------------

test('the defaults: pre-validation off, and GET', () => {
  assert.deepEqual(usablePreValidation(), { enabled: false, method: 'GET' });
  assert.deepEqual(usablePreValidation({ preValidateAssets: true }), { enabled: true, method: 'GET' });
  assert.deepEqual(usablePreValidation({ preValidateAssets: true, preValidateMethod: 'HEAD' }), { enabled: true, method: 'HEAD' });
  assert.deepEqual(PRE_VALIDATE_METHODS, ['GET', 'HEAD']);
});

test('an unknown method or a non-boolean switch is warned about and falls to its default', () => {
  const warnings = [];
  const { warn } = console;
  console.warn = (m) => warnings.push(m);
  try {
    assert.deepEqual(usablePreValidation({ preValidateAssets: 'yes', preValidateMethod: 'head' }), { enabled: false, method: 'GET' });
  } finally { console.warn = warn; }
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /preValidateAssets/);
  assert.match(warnings[1], /preValidateMethod is "head"/);
});

/** A signalling layer over a fake player instance, resolving one list; what it asked for and reported. */
async function signal(options) {
  const handlers = {};
  globalThis.Hls = { Events: { LEVEL_UPDATED: 'levelUpdated', MEDIA_ATTACHED: 'mediaAttached', BUFFER_APPENDED: 'bufferAppended' } };
  // The programme is playing inside the break, so its list is due the moment
  // the playlist names it (ADR 0108) and the test does not have to drive a clock.
  const media = { currentTime: 25, buffered: { length: 0 }, addEventListener: () => {} };
  const hls = { on: (event, fn) => { handlers[event] = fn; }, media };
  const listUrls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => { listUrls.push(String(url)); return { json: async () => list() }; };
  const { asked, firstRequest } = fake({ '/b.m3u8': 'HTTP 404' });
  const resolved = [];
  try {
    await quiet(async () => {
      createSignalling(hls, {
        ...options, firstRequest,
        onResolved: (experiences, selection) => resolved.push({ experiences, selection })
      });
      await handlers.levelUpdated(null, { details: {
        url: 'https://example.test/primary.m3u8',
        live: false,
        fragments: [{ start: 0, programDateTime: 0 }],
        dateRanges: { [ID]: { class: 'com.qualabs.hls.concurrentInterstitial', startDate: new Date(20000), duration: 12, attr: { 'X-ASSET-LIST': '/list.json' } } }
      } });
      for (let i = 0; i < 50 && !resolved.length; i += 1) await new Promise((r) => setTimeout(r, 0));
    });
  } finally { globalThis.fetch = realFetch; }
  return { asked, listUrls, resolved };
}

test('by default no first request is made at resolution time, and the renderer gets every option', async () => {
  const { asked, resolved } = await signal({});
  assert.deepEqual(asked, []);
  assert.deepEqual(resolved[0].selection.requests, []);
  assert.deepEqual(resolved[0].selection.preValidation, { enabled: false, method: null });
  assert.deepEqual(handed(resolved[0].experiences[0]).options.map(([i]) => i), [0, 1]);
});

test('preValidateAssets: true makes the requests, with the configured method, and only discards', async () => {
  const { asked, resolved } = await signal({ preValidateAssets: true, preValidateMethod: 'HEAD' });
  assert.deepEqual(asked.map((a) => a.uri), ['/b.m3u8', '/ad.svg']);
  assert.deepEqual(resolved[0].selection.preValidation, { enabled: true, method: 'HEAD' });
  assert.deepEqual(handed(resolved[0].experiences[0]).options.map(([i]) => i), [1]);
});

// ---------------------------------------------------------------------------
// The request itself: GET, HEAD, and the two traps of HEAD (media.js)
// ---------------------------------------------------------------------------

/** `firstRequest` of media.js over a fake fetch that answers `statuses[method]`. */
async function requestWith(method, statuses) {
  const made = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (uri, init) => {
    made.push(init.method);
    const status = statuses[init.method];
    return { ok: status >= 200 && status < 300, status, body: { cancel: async () => {} } };
  };
  try {
    return { answer: await mediaFirstRequest('/a.m3u8', 'application/vnd.apple.mpegurl', { method }), made };
  } finally { globalThis.fetch = realFetch; }
}

test('GET is the default method of the request', async () => {
  const realFetch = globalThis.fetch;
  let seen = null;
  globalThis.fetch = async (_uri, init) => { seen = init.method; return { ok: true, status: 200, body: null }; };
  try { assert.deepEqual(await mediaFirstRequest('/a.m3u8', 'application/vnd.apple.mpegurl'), { ok: true, method: 'GET' }); }
  finally { globalThis.fetch = realFetch; }
  assert.equal(seen, 'GET');
});

test('HEAD answered 200 is a pass, with one request', async () => {
  const { answer, made } = await requestWith('HEAD', { HEAD: 200 });
  assert.deepEqual(made, ['HEAD']);
  assert.deepEqual(answer, { ok: true, method: 'HEAD' });
});

test('HEAD answered 405 or 501 is asked again with GET, and the GET decides', async () => {
  for (const status of [405, 501]) {
    const passed = await requestWith('HEAD', { HEAD: status, GET: 200 });
    assert.deepEqual(passed.made, ['HEAD', 'GET']);
    assert.deepEqual(passed.answer, { ok: true, method: 'HEAD, then GET' });
  }
  const failed = await requestWith('HEAD', { HEAD: 405, GET: 404 });
  assert.deepEqual(failed.answer, { ok: false, error: 'HTTP 404, after HTTP 405 to a HEAD', method: 'HEAD, then GET' });
});

test('HEAD answered 403 is NOT retried, and the sentence names the signed-URL trap', async () => {
  const { answer, made } = await requestWith('HEAD', { HEAD: 403, GET: 200 });
  assert.deepEqual(made, ['HEAD']);
  assert.equal(answer.ok, false);
  assert.match(answer.error, /^HTTP 403 to a HEAD; a URL signed for GET answers 403 to a HEAD$/);
});

test('a GET answered 405 is a failure like any other status', async () => {
  const { answer, made } = await requestWith('GET', { GET: 405 });
  assert.deepEqual(made, ['GET']);
  assert.deepEqual(answer, { ok: false, error: 'HTTP 405', method: 'GET' });
});
