// both-classes.test.js -- one stream, both kinds of break, one player (ADR 0106).
//
// Our player runs hls.js with its interstitials machinery ON: hls.js plays the
// traditional interstitial (Apple's class) and this library draws its own two
// classes. What is tested here is the seam between the two, over fakes of the
// interstitials manager hls.js 1.7.2 exposes: who says a linear ad is on screen,
// what the programme's clock is meanwhile, what the bar marks of hls.js's
// schedule, and that an `ended` of the element during a linear ad is not the end
// of the programme.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createProgramme, createSignalling, linearOnScreen, programmeAtEnd, resolvePostRoll, scheduledRanges
} from '../lib/signalling.js';
import { createPostRoll } from '../lib/postroll.js';
import { KINDS_PLAYED } from '../lib/concurrent-hls.js';
import { RANGE_COLOURS, RANGE_TITLES } from '../lib/controls.js';

/** The interstitials manager, as far as the library reads it. */
const manager = ({ playing = null, at = 0, duration = 198, events = [] } = {}) => ({
  playingItem: playing ? { event: { identifier: playing } } : { event: null },
  primary: { currentTime: at, duration },
  events
});

test('a linear ad is on screen only while hls.js plays one of its interstitials', () => {
  assert.equal(linearOnScreen(null), false, 'machinery off');
  assert.equal(linearOnScreen(manager()), false, 'a primary item of the schedule');
  assert.equal(linearOnScreen(manager({ playing: 'AD-LINEAR' })), true);
});

test('the programme ends by the programme\'s clock, and the element is trusted with no schedule', () => {
  assert.equal(programmeAtEnd(null), true);
  assert.equal(programmeAtEnd(manager({ duration: 0 })), true);
  assert.equal(programmeAtEnd(manager({ at: 150 })), false, 'the end of an asset in the middle');
  assert.equal(programmeAtEnd(manager({ at: 197.5 })), true);
});

test('the bar marks what hls.js scheduled: the span it takes out of the programme, no post-roll, no skipped break', () => {
  const skipped = new Set();
  const events = [
    { identifier: 'AD-LINEAR', startTime: 150, resumeTime: 162, duration: 12, cue: {} },
    { identifier: 'AD-A', startTime: 20, resumeTime: 20, duration: 12, cue: {}, assetListLoaded: true, assetList: [] },
    { identifier: 'AD-POST', startTime: 198, resumeTime: 198, duration: 12, cue: { post: true } },
    { identifier: 'AD-X', startTime: 40, resumeTime: NaN, duration: 6, cue: {} }
  ];
  assert.deepEqual(scheduledRanges(events, skipped), [
    { id: 'AD-X', kind: 'interstitial', startTime: 40, duration: 6 },
    { id: 'AD-LINEAR', kind: 'interstitial', startTime: 150, duration: 12 }
  ]);
  assert.ok(skipped.has('AD-A'), 'a break with no asset is remembered as skipped');
  // hls.js asks for the list again after a seek: the mark does not come back.
  assert.deepEqual(scheduledRanges([{ ...events[1], assetListLoaded: false, assetList: null }], skipped), []);
  assert.deepEqual(scheduledRanges(undefined), []);
});

test('the kind hls.js plays has a colour and a name on the bar, and this library still draws only its own two', () => {
  assert.ok(RANGE_COLOURS.interstitial && RANGE_TITLES.interstitial);
  assert.deepEqual([...KINDS_PLAYED].sort(), ['concurrent', 'multiview']);
});

test('the programme is the element, except while a linear ad is on screen, and a seek goes where the clock comes from', () => {
  const video = { currentTime: 40, duration: 198, paused: false, muted: true, videoWidth: 1280, videoHeight: 720 };
  const hls = { interstitialsManager: manager({ at: 150 }) };
  const programme = createProgramme(hls, video);
  assert.equal(programme.currentTime, 40);
  assert.equal(programme.duration, 198);
  // hls.js handed the MediaSource to the asset: the element reports the ad.
  Object.assign(video, { currentTime: 3, duration: 12 });
  hls.interstitialsManager = manager({ playing: 'AD-LINEAR', at: 150 });
  assert.equal(programme.linearOnScreen(), true);
  assert.equal(programme.currentTime, 150);
  assert.equal(programme.duration, 198);
  programme.currentTime = 30;
  assert.equal(hls.interstitialsManager.primary.currentTime, 30, 'through hls.js, which applies X-RESTRICT');
  assert.equal(video.currentTime, 3);
  hls.interstitialsManager = manager();
  programme.currentTime = 60;
  assert.equal(video.currentTime, 60);
  assert.equal(programme.videoWidth, 1280);
});

// ---------------------------------------------------------------------------
// The signalling layer and the post-roll player, while hls.js plays a linear ad
// ---------------------------------------------------------------------------

const flush = () => new Promise((r) => setTimeout(r, 0));

function fakeMedia() {
  const listeners = {};
  return {
    currentTime: 0, style: {}, dataset: {}, muted: false,
    buffered: { length: 0, start: () => 0, end: () => 0 },
    addEventListener: (type, fn) => { (listeners[type] ??= []).push(fn); },
    fire: (type) => (listeners[type] ?? []).forEach((fn) => fn()),
    play: () => Promise.resolve(),
    remove() {}
  };
}

test('an element that ends during a linear ad does not ask for the post-roll, and one that ends the programme does', async () => {
  const handlers = {};
  globalThis.Hls = { Events: { LEVEL_UPDATED: 'levelUpdated', MEDIA_ATTACHED: 'mediaAttached', BUFFER_APPENDED: 'bufferAppended' } };
  const media = fakeMedia();
  const hls = { on: (e, fn) => { handlers[e] = fn; }, media, startPosition: -1, liveSyncPosition: null,
    interstitialsManager: manager({ playing: 'AD-LINEAR', at: 150 }) };
  const asked = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => { asked.push(String(url)); return { json: async () => ({ ASSETS: [] }) }; };
  const { log, warn } = console;
  console.log = console.warn = () => {};
  try {
    createSignalling(hls, {});
    handlers.levelUpdated(null, { details: {
      url: 'https://example.test/p.m3u8', live: false, edge: 198, targetduration: 6,
      fragments: [{ start: 0, programDateTime: 0 }],
      dateRanges: { 'AD-POST': { class: 'com.qualabs.hls.concurrentInterstitial', startDate: new Date(186000),
        duration: 12, attr: { CUE: 'POST', 'X-ASSET-LIST': '/post.json' } } }
    } });
    media.fire('ended');
    await flush();
    assert.deepEqual(asked, [], 'the end of the linear asset is not the end of the programme');
    hls.interstitialsManager = manager({ at: 197.9 });
    media.fire('ended');
    await flush();
    assert.deepEqual(asked, ['https://example.test/post.json']);
  } finally {
    globalThis.fetch = realFetch; console.log = log; console.warn = warn;
  }
});

test('the post-roll player does not start on an ended that is not the programme\'s', async () => {
  globalThis.document = { createElement: () => fakeMedia() };
  const video = fakeMedia();
  const attached = [];
  let ended = false;
  const experiences = resolvePostRoll({ ASSETS: [{ URI: '/one.m3u8', DURATION: 12 }] }, { id: 'POST', slotStart: 198 });
  const { log, warn } = console;
  console.log = console.warn = () => {};
  try {
    createPostRoll({
      provider: { postRolls: () => [{ state: 'resolved', experiences }] }, video,
      layer: { appendChild() {} },
      attachAsset: (_n, { uri, onLoaded }) => { attached.push(uri); onLoaded(); return () => {}; },
      programmeEnded: () => ended
    });
    video.fire('ended');
    await flush();
    assert.deepEqual(attached, []);
    ended = true;
    video.fire('ended');
    await flush();
    assert.deepEqual(attached, ['/one.m3u8']);
  } finally {
    console.log = log; console.warn = warn; delete globalThis.document;
  }
});
