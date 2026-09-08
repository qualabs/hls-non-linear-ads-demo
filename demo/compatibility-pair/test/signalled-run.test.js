// signalled-run.test.js -- the tests of the demo, and the only ones there are.
//
// What they watch: THE LIVE RUN THIS DEMO SERVES. The suite of the sdk in
// `test/` proves the pure functions of the library over data that was frozen
// the day it was measured, on purpose (ADR 0023): a reading is a reading of one
// run, so it is kept alongside the run it describes. The cost of freezing it is
// that nothing there would notice the run of THIS demo changing shape, and that
// is what these three tests are for.
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
import { existsSync, readFileSync } from 'node:fs';

import { CONCURRENT_CLASS, INTERSTITIAL_CLASS } from '../../../lib/signalling.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

/** The script that writes the signalled playlist this demo plays. */
const SIGNALLER = read('../scripts/senalizar-contenido.sh');

/** Every row of its RECORRIDO table: second of playback, and asset-list. */
const ROWS = [...SIGNALLER.matchAll(/^\s*"(\d+)\|(asset-list-[^|]+)\|/gm)].map(
  ([, slotStart, assetList]) => ({ slotStart: Number(slotStart), assetList })
);

/** The asset-list of the Apple-class tag, the same one in all five breaks. */
const LINEAR = SIGNALLER.match(/^LISTA_LINEAL=(\S+)$/m)?.[1];

const inSignalling = (list) => existsSync(new URL(`../signalling/${list}`, import.meta.url));

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
  // Plus the one asset-list the table does not name and every break uses: the
  // linear ad the Apple-class tag of all five points at, which is what a
  // market client replaces the content with.
  assert.match(LINEAR ?? '', /^asset-list-.+\.json$/, 'the script declares LISTA_LINEAL');
  assert.ok(inSignalling(LINEAR), `LISTA_LINEAL is ${LINEAR}, which is not in demo/compatibility-pair/signalling/`);
});

test('the length a break declares is computed from its asset-list and not typed into the script', () => {
  // This is the assertion that already caught one: a hard-wired
  // `PLANNED-DURATION` declaring twelve seconds of a break that lasts
  // forty-eight. Inert for this player -- the concurrent range is built out of
  // the experiences the asset-list resolves into and not out of the tag -- and
  // a lie to every other client that reads the playlist.
  assert.match(SIGNALLER, /PLANNED-DURATION=%s/);
  assert.doesNotMatch(SIGNALLER, /PLANNED-DURATION=\d/);
});

test('the two classes the script writes are the two the library translates', () => {
  // The side that writes the tag and the side that reads it agree, or every
  // break of the run is missing from the bar. The strings come from the
  // library, so this fails if either side is edited on its own.
  assert.ok(SIGNALLER.includes(`CLASS="${INTERSTITIAL_CLASS}"`), 'the script writes the traditional class');
  assert.ok(SIGNALLER.includes(`CLASS="${CONCURRENT_CLASS}"`), 'the script writes the concurrent class');
});
