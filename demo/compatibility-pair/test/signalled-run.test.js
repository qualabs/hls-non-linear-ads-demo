// signalled-run.test.js -- the tests of the demo, and the only ones there are.
//
// What they watch: THE LIVE RUN THIS DEMO SERVES. The suite of the sdk in
// `test/` proves the pure functions of the library over data that was frozen
// the day it was measured, on purpose (ADR 0023): a reading is a reading of one
// run, so it is kept alongside the run it describes. The cost of freezing it is
// that nothing there would notice the run of THIS demo changing shape, and that
// is what these tests are for.
//
// They read the files of the demo -- its signalling script and its
// `signalling/` folder -- and nothing of `test/fixtures/`. This is not a
// comparison between the two copies: it is the check of the run that is served,
// made with what the demo has inside it.
//
// The library is imported because two of the three assertions are about the two
// sides of the seam agreeing, and the demo is allowed to name the sdk: what the
// ADR 0015 forbids is the other direction.
//
// Run: npm test   (node --test from the root of the repository, no arguments,
// which discovers this folder and `test/` in one go)

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONCURRENT_CLASS, INTERSTITIAL_CLASS } from '../../../lib/signalling.js';
import { substitute } from '../../shared/test/variable-substitution.js';

const DEMO = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

/** The script that writes the signalled playlist this demo plays. */
const SIGNALLER = read('../scripts/senalizar-contenido.sh');

/** The page, which asks for the playlist with the class of each pane. */
const APP = read('../js/app.js');

/** Every row of its RECORRIDO table: second of playback, and asset-list. */
const ROWS = [...SIGNALLER.matchAll(/^\s*"(\d+)\|(asset-list-[^|]+)\|/gm)].map(
  ([, slotStart, assetList]) => ({ slotStart: Number(slotStart), assetList })
);

/** The name of the variable of the class, as the script writes it and as the page asks for it. */
const PARAM = SIGNALLER.match(/^PARAMETRO=(\S+)$/m)?.[1];
const PAGE_PARAM = APP.match(/const CLASS_PARAM = '([^']+)'/)?.[1];

const inSignalling = (list) => existsSync(new URL(`../signalling/${list}`, import.meta.url));

/**
 * The playlist the script really writes, over a media playlist of nine lines
 * passed through `SRC`: no ffmpeg and no video, so it runs on a clean clone.
 */
function run() {
  const dir = mkdtempSync(join(tmpdir(), 'compatibility-pair-'));
  const src = join(dir, 'index.m3u8');
  const out = join(dir, 'con-daterange.m3u8');
  writeFileSync(src, [
    '#EXTM3U', '#EXT-X-VERSION:6', '#EXT-X-TARGETDURATION:2', '#EXT-X-PLAYLIST-TYPE:VOD',
    '#EXTINF:2.000000,', '#EXT-X-PROGRAM-DATE-TIME:2026-09-14T10:00:00.000+0000', 'seg000.ts', '#EXT-X-ENDLIST', ''
  ].join('\n'));
  try {
    execFileSync(join(DEMO, 'scripts/senalizar-contenido.sh'), {
      cwd: DEMO, env: { ...process.env, SRC: src, OUT: out }, encoding: 'utf8'
    });
    return readFileSync(out, 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const allTags = (playlist) => playlist.split('\n').filter((l) => l.startsWith('#EXT-X-DATERANGE:'));
/** The tags of the five breaks of the table, without the linear one written with Apple's class (ADR 0115). */
const tags = (playlist) => allTags(playlist).filter((l) => !l.includes('ID="AD-LINEAR"'));
const classOf = (line) => line.match(/CLASS="([^"]+)"/)?.[1];
const readAs = (playlist, hlsClass) =>
  substitute(playlist, `/content/primary/con-daterange.m3u8?${PARAM}=${encodeURIComponent(hlsClass)}`).text;

test('the script signals the five breaks of the recording, and every one names an asset-list of this demo', () => {
  // Five, which is the shape of the recording: four breaks of one ad and the
  // mixed one last. A row added or taken out changes what is recorded, and it
  // is the kind of change that looks like nothing until the playlist is served.
  assert.equal(ROWS.length, 5, 'five rows in the RECORRIDO table of scripts/senalizar-contenido.sh');
  assert.deepEqual(ROWS.map((r) => r.slotStart), [20, 45, 70, 95, 120]);
  // And every row points at a file that is there. A name mistyped in the table
  // is a break the script refuses to write, and the run comes out short.
  for (const { slotStart, assetList } of ROWS) {
    assert.ok(inSignalling(assetList),
      `the break at ${slotStart} s names ${assetList}, which is not in demo/compatibility-pair/signalling/`);
  }
});

test('the length a break declares is computed from its asset-list and not typed into the script', () => {
  // This is the assertion that already caught one: a hard-wired
  // `PLANNED-DURATION` declaring twelve seconds of a break that lasts
  // forty-eight. A lie to every client that reads the playlist.
  assert.match(SIGNALLER, /PLANNED-DURATION=%s/);
  assert.doesNotMatch(SIGNALLER, /PLANNED-DURATION=\d/);
});

test('one tag per break, its class the variable the page fills with each pane\'s class (ADR 0113)', () => {
  // The script and the page spell the parameter once each, and they agree.
  assert.ok(PARAM, 'the script declares PARAMETRO');
  assert.equal(PAGE_PARAM, PARAM, 'js/app.js asks with the parameter the playlist defines');
  const playlist = run();
  const lines = playlist.split('\n');
  const define = lines.indexOf(`#EXT-X-DEFINE:QUERYPARAM="${PARAM}"`);
  assert.ok(define >= 0 && define < lines.findIndex((l) => l.startsWith('#EXT-X-DATERANGE:')),
    'the variable is defined before the first tag');
  assert.ok(lines.includes('#EXT-X-VERSION:11'), 'QUERYPARAM requires EXT-X-VERSION 11');
  assert.deepEqual(tags(playlist).map(classOf), ROWS.map(() => `{$${PARAM}}`));
  assert.ok(!tags(playlist).some((l) => /X-SNAP=|X-RESUME-OFFSET=/.test(l)),
    'the replacement form, with nothing hls.js would apply to the Apple reading');
});

test('read with each class, the same file is all Apple or all ours, and the same asset-lists', () => {
  // The side that writes the tag and the side that reads it agree, or every
  // break of the run is missing from the bar. The class strings come from the
  // library, so this fails if either side is edited on its own.
  const playlist = run();
  const apple = tags(readAs(playlist, INTERSTITIAL_CLASS));
  const ours = tags(readAs(playlist, CONCURRENT_CLASS));
  assert.deepEqual(apple.map(classOf), ROWS.map(() => INTERSTITIAL_CLASS));
  assert.deepEqual(ours.map(classOf), ROWS.map(() => CONCURRENT_CLASS));
  const lists = (ls) => ls.map((l) => l.match(/X-ASSET-LIST="\/signalling\/([^"]+)"/)?.[1]);
  assert.deepEqual(lists(apple), ROWS.map((r) => r.assetList));
  assert.deepEqual(lists(ours), lists(apple), 'one asset-list per break, read by both clients');
  assert.throws(() => substitute(playlist, '/content/primary/con-daterange.m3u8'), /QUERYPARAM/,
    'with no parameter the playlist must fail to parse');
});

test('one traditional linear break, its class written and not chosen, overlapping no other (ADR 0115)', () => {
  const playlist = run();
  const linear = allTags(playlist).filter((l) => l.includes('ID="AD-LINEAR"'));
  assert.equal(linear.length, 1);
  assert.equal(classOf(linear[0]), INTERSTITIAL_CLASS, 'the literal class');
  assert.match(linear[0], /X-ASSET-LIST="\/signalling\/asset-list-linear\.json"/, 'the linear list the demo already had');
  assert.ok(inSignalling('asset-list-linear.json'));
  // Both clients read it as Apple's, whatever class they asked for.
  for (const hlsClass of [INTERSTITIAL_CLASS, CONCURRENT_CLASS]) {
    assert.equal(classOf(allTags(readAs(playlist, hlsClass)).find((l) => l.includes('ID="AD-LINEAR"'))), INTERSTITIAL_CLASS);
  }
  // And it overlaps no break of the table: its window ends before the first one starts.
  const at = SIGNALLER.match(/^LINEAL_EN=(\d+)$/m)?.[1];
  const length = Number(linear[0].match(/PLANNED-DURATION=([\d.]+)/)[1]);
  const windows = ROWS.map((r, i) => [r.slotStart, r.slotStart + Number(tags(playlist)[i].match(/PLANNED-DURATION=([\d.]+)/)[1])]);
  for (const [from, to] of windows) {
    assert.ok(Number(at) + length <= from || Number(at) >= to, `the linear break overlaps the one at ${from} s`);
  }
});
