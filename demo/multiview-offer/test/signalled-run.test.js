// signalled-run.test.js -- the tests of this demo, and the only ones there are.
//
// What they watch: THE PLAYLIST THIS DEMO SERVES. The suite of the sdk in
// `test/` proves the pure functions of the library over data that was frozen
// the day it was measured (ADR 0023), so nothing there would notice the run of
// THIS demo changing shape. That is what these tests are for.
//
// THE COUNT OF DATE RANGES BY CLASS IS TAKEN OFF A PLAYLIST THE SCRIPT REALLY
// WRITES, and not off the text of the script. The difference is the whole point:
// reading the source and finding two printf that mention two classes proves that
// somebody typed them, not that the playlist comes out with one tag of one class
// and two of the other. So the test hands the script a media playlist of nine
// lines through `SRC`, collects the output through `OUT`, and counts what came
// out. It needs no ffmpeg and none of the 660 MB of footage, which is what lets
// it run in `npm test` on a clean clone.
//
// The library is imported for the two class strings -- the classes this demo
// signals are the ones the library translates, which is what makes the tags it
// writes reach a bar at all -- and the demo is allowed to name the sdk: what
// ADR 0015 forbids is the other direction.
//
// Run: npm test   (node --test from the root of the repository, no arguments,
// which discovers this folder along with the other two)

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The two classes of ADR 0063, taken from the library and not written out here.
 * They were a literal while the library did not know the second one, and the
 * comment said what to do the day it did: the string the tag carries and the
 * string the library translates have to be the same one, because a client
 * compares a class by exact equality and two spellings are two experiences that
 * never meet. Now that both are in `KIND_OF_CLASS`, importing them is what makes
 * that impossible to get wrong, instead of something a test asserts about a copy.
 */
import { CONCURRENT_CLASS, MULTIVIEW_CLASS } from '../../../lib/signalling.js';

const DEMO = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(join(DEMO, path), 'utf8');

/** The script that writes the signalled playlist this demo plays. */
const SIGNALLER = read('scripts/senalizar-contenido.sh');

/** Every row of its RECORRIDO table: second of playback, asset-list, name. */
const ROWS = [...SIGNALLER.matchAll(/^\s*"(\d+)\|(asset-list-[^|]+)\|([^"]*)"/gm)].map(
  ([, slotStart, assetList, name]) => ({ slotStart: Number(slotStart), assetList, name })
);

/** The seconds an asset-list declares: the sum of the DURATION of Appendix D.2. */
function declaredLength(assetList) {
  const { ASSETS } = JSON.parse(read(join('signalling', assetList)));
  return ASSETS.reduce((total, asset) => total + Number(asset.DURATION), 0);
}

/**
 * The playlist the script writes, over a media playlist of nine lines.
 *
 * The one thing the fixture has to carry is the EXT-X-PROGRAM-DATE-TIME, which
 * is what every START-DATE is resolved against (ADR 0005), and an EXTINF, which
 * is where the tags are inserted before.
 */
const PDT = '2026-09-11T10:00:00.000+0000';

function signalledPlaylist() {
  const dir = mkdtempSync(join(tmpdir(), 'multiview-offer-'));
  const src = join(dir, 'index.m3u8');
  const out = join(dir, 'con-daterange.m3u8');
  writeFileSync(
    src,
    [
      '#EXTM3U',
      '#EXT-X-VERSION:3',
      '#EXT-X-TARGETDURATION:2',
      '#EXT-X-PLAYLIST-TYPE:VOD',
      '#EXT-X-INDEPENDENT-SEGMENTS',
      `#EXT-X-PROGRAM-DATE-TIME:${PDT}`,
      '#EXTINF:2.000000,',
      'seg000.ts',
      '#EXT-X-ENDLIST',
      ''
    ].join('\n')
  );
  try {
    execFileSync(join(DEMO, 'scripts/senalizar-contenido.sh'), {
      cwd: DEMO,
      env: { ...process.env, SRC: src, OUT: out },
      encoding: 'utf8'
    });
    return readFileSync(out, 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** One Date Range line, as the attributes that are asserted about it. */
function dateRanges(playlist) {
  return playlist
    .split('\n')
    .filter((line) => line.startsWith('#EXT-X-DATERANGE:'))
    .map((line) => ({
      line,
      id: line.match(/ID="([^"]+)"/)?.[1],
      hlsClass: line.match(/CLASS="([^"]+)"/)?.[1],
      startDate: line.match(/START-DATE="([^"]+)"/)?.[1],
      assetList: line.match(/X-ASSET-LIST="\/signalling\/([^"]+)"/)?.[1],
      plannedDuration: Number(line.match(/PLANNED-DURATION=([\d.]+)/)?.[1]),
      restricts: line.includes('X-RESTRICT=')
    }));
}

test('the script signals the three breaks of the run, and every one names an asset-list of this demo', () => {
  // Three, which is the shape of this demo: the concurrent ad that already
  // works, and the two windows of multi view. A row added or taken out changes
  // what the demo shows, and it is the kind of change that looks like nothing
  // until the playlist is served.
  assert.equal(ROWS.length, 3, 'three rows in the RECORRIDO table of scripts/senalizar-contenido.sh');
  assert.deepEqual(ROWS.map((r) => r.slotStart), [20, 45, 120]);
  for (const { slotStart, assetList } of ROWS) {
    assert.ok(existsSync(join(DEMO, 'signalling', assetList)),
      `the break at ${slotStart} s names ${assetList}, which is not in demo/multiview-offer/signalling/`);
  }
});

test('the run fits inside the 180 s of the primary, and the windows are the ones the phase declared', () => {
  // 20 to 32, 45 to 105, 120 to 175. The last one closes with five seconds of
  // programme left, and the whole point of a window being this long is that the
  // three shapes of the grid are walked INSIDE one of them: a viewer raising
  // cameras one at a time needs time, and an ad does not.
  const windows = ROWS.map((r) => [r.slotStart, r.slotStart + declaredLength(r.assetList)]);
  assert.deepEqual(windows, [[20, 32], [45, 105], [120, 175]]);
  assert.ok(windows.at(-1)[1] <= 180, 'the last window closes before the primary ends');
});

test('the playlist comes out with one Date Range of the concurrent class and two of multi view', () => {
  // THE COUNT, TAKEN OFF THE OUTPUT. This is the assertion the task asks for and
  // the reason this file runs the script instead of reading it: a tag that is
  // not written is a break that never happens, and the playlist is the only
  // place where that can be seen.
  const ranges = dateRanges(signalledPlaylist());
  assert.equal(ranges.length, 3, 'three Date Ranges, one per break');
  const byClass = (hlsClass) => ranges.filter((r) => r.hlsClass === hlsClass);
  assert.equal(byClass(CONCURRENT_CLASS).length, 1, 'one tag of the concurrent class');
  assert.equal(byClass(MULTIVIEW_CLASS).length, 2, 'two tags of the multi view class');
  // And nothing else: a third class in the playlist is a client of ours reading
  // something this demo did not mean to signal.
  assert.deepEqual(
    [...new Set(ranges.map((r) => r.hlsClass))].sort(),
    [CONCURRENT_CLASS, MULTIVIEW_CLASS].sort()
  );
  // Unique IDs, which the specification requires of a Date Range.
  assert.equal(new Set(ranges.map((r) => r.id)).size, 3);
});

test('every tag points at its own asset-list, starts where the table says, and declares its real length', () => {
  const ranges = dateRanges(signalledPlaylist());
  const origin = new Date(PDT).getTime();
  ROWS.forEach((row, i) => {
    const range = ranges[i];
    assert.equal(range.assetList, row.assetList);
    // The START-DATE is the EXT-X-PROGRAM-DATE-TIME of the playlist plus the
    // second of the table. It is compared as an instant and not as a string
    // because the script writes it in local time, and the instant is what a
    // client resolves.
    assert.equal((new Date(range.startDate).getTime() - origin) / 1000, row.slotStart,
      `the break at ${row.slotStart} s starts there`);
    // And the length it declares is the one its asset-list adds up to. Typed
    // into the script instead, a tag declaring twelve seconds of a window that
    // lasts sixty is inert for this player -- the range is built out of the
    // experiences and not out of the tag -- and a lie to every other client.
    assert.equal(range.plannedDuration, declaredLength(row.assetList));
  });
  // PLANNED-DURATION is never a number typed into the script.
  assert.doesNotMatch(SIGNALLER, /PLANNED-DURATION=\d/);
});

test('the multi view tag drops X-RESTRICT and the concurrent one keeps it', () => {
  // The one attribute that changes between the two classes (ADR 0063). In an ad
  // it says the break cannot be skipped; in an offer there is no break to skip,
  // because the primary content never stops and composing is optional.
  const ranges = dateRanges(signalledPlaylist());
  for (const range of ranges) {
    assert.equal(range.restricts, range.hlsClass === CONCURRENT_CLASS,
      `${range.id} carries X-RESTRICT=${range.restricts}`);
  }
});

test('the offers announce a catalogue and not a layout', () => {
  // Rule of ADR 0064, checked on the two asset-lists this demo serves: a view
  // carries `id`, `name`, `type` and `uri`, and NOT `viewport`, `zDepth` or
  // `volume`. A viewport in an offer is a position computed against a number the
  // author did not know -- how many boxes the viewer would raise.
  const offers = ROWS.map((r) => r.assetList).filter((a) => a.includes('offer'));
  assert.equal(offers.length, 2, 'the two windows of multi view');
  for (const assetList of offers) {
    const { ASSETS } = JSON.parse(read(join('signalling', assetList)));
    const block = ASSETS[0]['X-AD-CREATIVE-SIGNALING'];
    assert.equal(block.type, 'offer');
    const item = block.payload[0];
    assert.equal(item.type, 'multiViewOffer');
    assert.equal(typeof item.primaryName, 'string');
    assert.ok(!('layout' in item), `${assetList} declares no layout`);
    for (const view of item.views) {
      for (const field of ['id', 'name', 'type', 'uri']) {
        assert.equal(typeof view[field], 'string', `${assetList}: view ${view.id} has a ${field}`);
      }
      for (const field of ['viewport', 'zDepth', 'volume']) {
        assert.ok(!(field in view), `${assetList}: view ${view.id} declares no ${field}`);
      }
    }
    // The URI of Appendix D.2 that every asset must carry is the uri of the
    // first view, which is what leaves the fallback of ADR 0019 something to
    // play: a client that does not read the block sees an ordinary asset.
    assert.equal(ASSETS[0].URI, item.views[0].uri);
  }
});

test('the two catalogues are three views and five, and the long one is longer than the grid', () => {
  const views = (assetList) =>
    JSON.parse(read(join('signalling', assetList)))
      .ASSETS[0]['X-AD-CREATIVE-SIGNALING'].payload[0].views;
  const three = views('asset-list-offer-3.json');
  const five = views('asset-list-offer-5.json');
  assert.equal(three.length, 3);
  // Five, and the grid tops out at four boxes counting the programme: that is
  // the case the second window exists for and the first one cannot show.
  assert.equal(five.length, 5);
  // Every view of a catalogue is a different piece of content. Two boxes showing
  // the same film at different moments is deliberate and is what makes it
  // evident that there are two decoders; two boxes showing the SAME URI would
  // not.
  for (const catalogue of [three, five]) {
    assert.equal(new Set(catalogue.map((v) => v.uri)).size, catalogue.length);
    assert.equal(new Set(catalogue.map((v) => v.id)).size, catalogue.length);
    assert.equal(new Set(catalogue.map((v) => v.name)).size, catalogue.length);
  }
});

test('the content is packaged with the configuration the five decoders were measured at', () => {
  // 1280x720 at 30 fps is not decoration: it is the configuration phase 01
  // measured five simultaneous video elements at, which is exactly what a grid
  // of four plus the primary needs. The recipe is a copy of the one of
  // compatibility-pair and it is not to be touched.
  const packager = read('scripts/empaquetar-contenido.sh');
  assert.match(packager, /scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30/);
  // And this demo downloads nothing: its four sources are the ones the other
  // demo already has on disk.
  const preparer = read('scripts/preparar-contenido.sh');
  assert.doesNotMatch(preparer, /curl|wget/);
  assert.match(preparer, /compatibility-pair\/content\/\.fuentes/);
});
