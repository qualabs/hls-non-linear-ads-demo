// The part of attaching an asset that no streaming format owns (lib/media.js,
// phase 19): an image and a progressive file need no player, and the first load
// of any asset is watched once, with a timeout. Each format's `attachAsset` hands
// these two kinds over and attaches only its own streaming one, so what is tested
// here is the hand-over: which asset is attached here and which is left to the
// caller, and what settles the first load.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

import { attachPlain, watchFirstLoad, FIRST_REQUEST_TIMEOUT_MS } from '../lib/media.js';

/** A <video> or <img> as far as attachPlain touches one. */
function fakeNode() {
  const listeners = {};
  return {
    src: null,
    currentTime: 0,
    loads: 0,
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    fire(type) { for (const fn of listeners[type] || []) fn(); },
    removeAttribute(name) { if (name === 'src') this.src = null; },
    load() { this.loads += 1; }
  };
}

/** A first-load watch that records what settled it. */
function recorder() {
  const calls = [];
  const first = watchFirstLoad({ onLoaded: () => calls.push('loaded'), onFailed: (why) => calls.push(`failed: ${why}`) });
  return { first, calls };
}

test('an image is attached here, whatever the caller streams, and its load settles the first load', () => {
  const node = fakeNode();
  const { first, calls } = recorder();
  const detach = attachPlain(node, { uri: '/a.png', mediaType: 'image/png', streaming: true }, first);
  assert.equal(typeof detach, 'function');
  assert.equal(node.src, '/a.png');
  node.fire('load');
  assert.deepEqual(calls, ['loaded']);
  detach();
  assert.equal(node.src, null);
  first.stop();
});

test('an image that does not load fails the first load once, with a sentence', () => {
  const node = fakeNode();
  const { first, calls } = recorder();
  attachPlain(node, { uri: '/a.png', mediaType: 'image/png' }, first);
  node.fire('error');
  node.fire('load');
  assert.deepEqual(calls, ['failed: the image could not be loaded']);
});

test('a streaming asset is left to the caller: nothing is attached and nothing is settled', () => {
  const node = fakeNode();
  const { first, calls } = recorder();
  assert.equal(attachPlain(node, { uri: '/ad.mpd', mediaType: 'application/dash+xml', streaming: true }, first), null);
  assert.equal(node.src, null);
  assert.deepEqual(calls, []);
  first.stop();
});

test('a progressive file is attached here, joined late when startAt says so, and detaching unloads it', () => {
  const node = fakeNode();
  const { first, calls } = recorder();
  const detach = attachPlain(node, { uri: '/ad.mp4', mediaType: 'video/mp4', startAt: 3, streaming: false }, first);
  assert.equal(node.src, '/ad.mp4');
  assert.equal(node.currentTime, 3);
  node.fire('loadedmetadata');
  assert.deepEqual(calls, ['loaded']);
  detach();
  assert.equal(node.src, null);
  assert.equal(node.loads, 1);
});

test('a progressive file that does not load fails the first load', () => {
  const node = fakeNode();
  const { first, calls } = recorder();
  attachPlain(node, { uri: '/ad.mp4', mediaType: 'video/mp4' }, first);
  assert.equal(node.currentTime, 0, 'not joined late');
  node.fire('error');
  assert.deepEqual(calls, ['failed: the file could not be loaded']);
});

test('no answer in FIRST_REQUEST_TIMEOUT_MS fails the first load, and stop() silences it for good', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const late = recorder();
    mock.timers.tick(FIRST_REQUEST_TIMEOUT_MS - 1);
    assert.deepEqual(late.calls, []);
    mock.timers.tick(1);
    assert.deepEqual(late.calls, [`failed: no answer in ${FIRST_REQUEST_TIMEOUT_MS / 1000} s`]);
    late.first.loaded();
    assert.equal(late.calls.length, 1, 'settled once');

    const stopped = recorder();
    stopped.first.stop();
    mock.timers.tick(FIRST_REQUEST_TIMEOUT_MS);
    stopped.first.failed('late');
    assert.deepEqual(stopped.calls, []);
  } finally {
    mock.timers.reset();
  }
});
