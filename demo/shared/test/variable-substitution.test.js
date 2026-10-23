// variable-substitution.test.js -- the helper the demo tests read a playlist
// through (ADR 0103), held to the rules of the spec it imitates.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import { substitute, withClass } from './variable-substitution.js';

const APPLE = 'com.apple.hls.interstitial';
const OURS = 'com.qualabs.hls.concurrentInterstitial';

const PLAYLIST = [
  '#EXTM3U',
  '#EXT-X-VERSION:11',
  '#EXT-X-DEFINE:QUERYPARAM="adclass"',
  '#EXT-X-DATERANGE:ID="AD-A",CLASS="{$adclass}",START-DATE="2026-10-22T10:00:00.000Z",X-ASSET-LIST="/signalling/a.json"',
  '#EXT-X-DATERANGE:ID="AD-L",CLASS="com.apple.hls.interstitial",START-DATE="2026-10-22T10:01:00.000Z"',
  '#EXTINF:2,',
  'seg000.ts',
  ''
].join('\n');

const classes = (text) => [...text.matchAll(/CLASS="([^"]+)"/g)].map((m) => m[1]);

test('the same file reads as two classes, one per query parameter, and the literal one is left alone', () => {
  assert.deepEqual(classes(substitute(PLAYLIST, withClass('/p.m3u8', 'adclass', APPLE)).text), [APPLE, APPLE]);
  assert.deepEqual(classes(substitute(PLAYLIST, withClass('/p.m3u8', 'adclass', OURS)).text), [OURS, APPLE]);
});

test('a missing query parameter is a playlist that fails to parse (4.4.2.3)', () => {
  assert.throws(() => substitute(PLAYLIST, '/p.m3u8'), /QUERYPARAM "adclass"/);
  assert.throws(() => substitute(PLAYLIST, '/p.m3u8?adclass='), /QUERYPARAM "adclass"/);
});

test('a reference before its definition, or to no definition, fails too (6.3.1)', () => {
  const late = PLAYLIST.replace('#EXT-X-DEFINE:QUERYPARAM="adclass"\n', '') + '#EXT-X-DEFINE:QUERYPARAM="adclass"\n';
  assert.throws(() => substitute(late, withClass('/p.m3u8', 'adclass', OURS)), /no preceding EXT-X-DEFINE/);
});

test('a name defined twice fails (4.4.2.3)', () => {
  const twice = PLAYLIST.replace('#EXT-X-DEFINE:QUERYPARAM="adclass"', '#EXT-X-DEFINE:QUERYPARAM="adclass"\n#EXT-X-DEFINE:NAME="adclass",VALUE="x"');
  assert.throws(() => substitute(twice, withClass('/p.m3u8', 'adclass', OURS)), /duplicate/);
});
