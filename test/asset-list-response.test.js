// asset-list-response.test.js -- the tests of ADR 0116: the answer to each
// asset-list request travels in the report `onResolved` gets, as it was received.
//
// What they are for: a page that shows the asset-list of a break reads it from
// the library's report and does NOT request it a second time. A second request
// is a second impression to an ad server and its answer need not be the first
// one, and nothing on screen tells the two apart: the card would show an answer
// the player never resolved. So it is asserted here, over a fake player
// instance and a fake fetch, that the report carries `response` -- URL, status,
// the body verbatim and the object it was resolved from -- and that the list was
// asked for once.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import { BLOCK, createSignalling, readAssetList } from '../hls/signalling.js';

const LIST = {
  ASSETS: [{
    URI: '/linear.m3u8', DURATION: 12,
    [BLOCK]: { version: 2, type: 'slot', payload: [{ start: 0, duration: 12, layoutOptions: [{
      type: 'lowerThirdOverlay',
      layout: { assets: [{ id: 'banner', type: 'image/svg+xml', uri: '/banner.svg', viewport: '70 6.25 12.5 6.25', zDepth: 1 }] }
    }] }] }
  }]
};
// Written with its own spacing on purpose: `text` has to be the body as it came, not a re-serialisation.
const BODY = JSON.stringify(LIST, null, 3);

/** A Response-shaped answer: what `readAssetList` reads off it is url, status and text. */
const answer = (url, { status = 200, body = BODY } = {}) => ({ url, status, text: async () => body });

// ---------------------------------------------------------------------------
// The pure function
// ---------------------------------------------------------------------------

test('readAssetList keeps the URL, the status, the body verbatim and the parsed list', async () => {
  const read = await readAssetList(answer('https://example.test/final.json'), 'https://example.test/asked.json');
  assert.equal(read.url, 'https://example.test/final.json', 'the response\'s own URL, so after any redirect');
  assert.equal(read.status, 200);
  assert.equal(read.text, BODY);
  assert.deepEqual(read.json, LIST);
});

test('readAssetList falls back to the URL asked for, and to a null status, when the response carries neither', async () => {
  const read = await readAssetList({ text: async () => '{"ASSETS":[]}' }, 'https://example.test/asked.json');
  assert.equal(read.url, 'https://example.test/asked.json');
  assert.equal(read.status, null);
  assert.deepEqual(read.json, { ASSETS: [] });
});

test('readAssetList throws on a body that is not JSON, as response.json() did', async () => {
  await assert.rejects(readAssetList(answer('https://example.test/x.json', { body: 'Not Found' }), 'x'), SyntaxError);
});

// ---------------------------------------------------------------------------
// The signalling layer over a fake player instance
// ---------------------------------------------------------------------------

const EVENTS = {
  LEVEL_UPDATED: 'levelUpdated', MEDIA_ATTACHED: 'mediaAttached', BUFFER_APPENDED: 'bufferAppended',
  BUFFERED_TO_END: 'bufferedToEnd'
};
const settle = async (until) => { for (let i = 0; i < 50 && !until(); i += 1) await new Promise((r) => setTimeout(r, 0)); };

/** A signalling layer resolving the Date Ranges given; what it fetched and what it reported. */
async function signal(dateRanges, { bufferedToEnd = false, expect = 1 } = {}) {
  const handlers = {};
  globalThis.Hls = { Events: EVENTS };
  // Inside the break, so its list is due the moment the playlist names it (ADR 0108).
  const media = { currentTime: 25, buffered: { length: 0 }, addEventListener: () => {} };
  const hls = { on: (event, fn) => { handlers[event] = fn; }, media, startPosition: -1, liveSyncPosition: null };
  const fetched = [];
  const resolved = [];
  const realFetch = globalThis.fetch;
  const { log, warn } = console;
  globalThis.fetch = async (url) => { fetched.push(String(url)); return answer(`${url}#served`); };
  console.log = () => {};
  console.warn = () => {};
  try {
    createSignalling(hls, {
      capabilities: { concurrentVideo: 2, concurrentImage: true },
      onResolved: (experiences, selection) => resolved.push({ experiences, selection })
    });
    await handlers.levelUpdated(null, { details: {
      url: 'https://example.test/primary.m3u8', live: false, edge: 198, targetduration: 6,
      fragments: [{ start: 0, programDateTime: 0 }], dateRanges
    } });
    if (bufferedToEnd) handlers.bufferedToEnd();
    await settle(() => resolved.length >= expect);
  } finally {
    globalThis.fetch = realFetch;
    console.log = log;
    console.warn = warn;
  }
  return { fetched, resolved };
}

const BREAK = {
  'AD-A-CONCURRENT': {
    class: 'com.qualabs.hls.concurrentInterstitial', startDate: new Date(20000), duration: 12,
    attr: { 'X-ASSET-LIST': '/list.json' }
  }
};

test('a break: the report carries the answer as received, and the list was fetched once', async () => {
  const { fetched, resolved } = await signal(BREAK);
  assert.equal(fetched.length, 1);
  assert.equal(resolved.length, 1);
  const { selection } = resolved[0];
  assert.deepEqual(Object.keys(selection.response).sort(), ['json', 'status', 'text', 'url']);
  assert.equal(selection.response.url, `${fetched[0]}#served`, 'the URL the answer came from');
  assert.match(selection.url, /\/list\.json\?sgai-video-decoders=2&sgai-image-over-video=1$/, 'the URL asked for, unchanged');
  assert.equal(selection.response.status, 200);
  assert.equal(selection.response.text, BODY);
  assert.deepEqual(selection.response.json, LIST);
});

test('a post-roll: the report carries the answer too, and the list was fetched once', async () => {
  const { fetched, resolved } = await signal({
    'AD-POST-CONCURRENT': {
      class: 'com.qualabs.hls.concurrentInterstitial', startDate: new Date(186000), duration: 12,
      attr: { CUE: 'POST', 'X-ASSET-LIST': '/post.json' }
    }
  }, { bufferedToEnd: true });
  assert.equal(fetched.length, 1);
  const { selection } = resolved[0];
  assert.equal(selection.postroll, true);
  assert.equal(selection.response.text, BODY);
  assert.deepEqual(selection.response.json, LIST);
  assert.equal(selection.response.status, 200);
});
