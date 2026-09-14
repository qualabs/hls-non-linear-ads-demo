// signalled-run.test.js -- the tests of this demo, and the only ones there are.
//
// What they watch: THE PLAYLIST AND THE ASSET-LIST THIS DEMO SERVES. The suite of the sdk
// in `test/` proves the pure functions of the library over data frozen the day it was
// measured (ADR 0023), so nothing there would notice the run of THIS demo changing shape.
//
// THE TAG AND THE CATALOGUE ARE TAKEN OFF WHAT THE SCRIPT REALLY WROTE, and not off the
// text of the script. The difference is the whole point: reading the source and finding a
// printf that mentions a class proves that somebody typed it, not that the playlist comes
// out with one tag of that class pointing at a catalogue with the names of this race in it.
// So the test hands the script a media playlist of nine lines through `SRC`, a content tree
// of one empty playlist through `CONTENT`, and collects both outputs through `OUT` and
// `LISTA`. It needs no ffmpeg and none of the 120 MB of video, which is what lets it run in
// `npm test` on a clean clone.
//
// The library is imported for the class string -- the class this demo signals is the one the
// library translates, which is what makes the tag it writes reach a bar at all -- and the
// demo is allowed to name the sdk: what ADR 0015 forbids is the other direction.
//
// Run: npm test   (node --test from the root of the repository, no arguments, which
// discovers this folder along with the other three)

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MULTIVIEW_CLASS } from '../../../lib/signalling.js';

const DEMO = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => readFileSync(join(DEMO, path), 'utf8');

/** The one file the seconds, the names and the colours of this demo are declared in. */
const RACE = JSON.parse(read('race.json'));

/**
 * The run, produced by really running the signaller.
 *
 * The fixture carries the two things it has to: an EXT-X-PROGRAM-DATE-TIME, which every
 * START-DATE is resolved against (ADR 0005), and an EXTINF, which is where the tag is
 * inserted before. And a content tree with `feeds` of them packaged, which is what decides
 * how long the catalogue comes out: the point of passing it in is that the same script
 * answers a catalogue of one and a catalogue of six without being edited.
 */
const PDT = '2026-09-14T10:00:00.000+0000';

function run(feeds = [RACE.feeds[0].id]) {
  const dir = mkdtempSync(join(tmpdir(), 'race-multiview-'));
  const src = join(dir, 'index.m3u8');
  const out = join(dir, 'con-daterange.m3u8');
  const lista = join(dir, 'asset-list-offer.json');
  const content = join(dir, 'content');
  writeFileSync(
    src,
    [
      '#EXTM3U',
      '#EXT-X-VERSION:6',
      '#EXT-X-TARGETDURATION:2',
      '#EXT-X-PLAYLIST-TYPE:VOD',
      '#EXT-X-INDEPENDENT-SEGMENTS',
      '#EXTINF:2.000000,',
      `#EXT-X-PROGRAM-DATE-TIME:${PDT}`,
      'seg000.ts',
      '#EXT-X-ENDLIST',
      ''
    ].join('\n')
  );
  for (const id of feeds) {
    mkdirSync(join(content, id), { recursive: true });
    writeFileSync(join(content, id, 'index.m3u8'), '#EXTM3U\n');
  }
  try {
    const sheet = execFileSync(join(DEMO, 'scripts/senalizar-contenido.sh'), {
      cwd: DEMO,
      env: { ...process.env, SRC: src, OUT: out, CONTENT: content, LISTA: lista },
      encoding: 'utf8'
    });
    return { playlist: readFileSync(out, 'utf8'), list: JSON.parse(readFileSync(lista, 'utf8')), sheet };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** One Date Range line, as the attributes that are asserted about it. */
const dateRanges = (playlist) =>
  playlist
    .split('\n')
    .filter((line) => line.startsWith('#EXT-X-DATERANGE:'))
    .map((line) => ({
      line,
      id: line.match(/ID="([^"]+)"/)?.[1],
      hlsClass: line.match(/CLASS="([^"]+)"/)?.[1],
      startDate: line.match(/START-DATE="([^"]+)"/)?.[1],
      assetList: line.match(/X-ASSET-LIST="([^"]+)"/)?.[1],
      plannedDuration: Number(line.match(/PLANNED-DURATION=([\d.]+)/)?.[1]),
      restricts: line.includes('X-RESTRICT=')
    }));

/** The offer block of an asset-list. */
const offerOf = (list) => list.ASSETS[0]['X-AD-CREATIVE-SIGNALING'];

test('the playlist comes out with one Date Range, of the multi view class, and no other', () => {
  // THE COUNT, TAKEN OFF THE OUTPUT. A tag that is not written is a window that never
  // happens, and the playlist is the only place where that can be seen. One and not three:
  // this is the only one of the four demos that is purely editorial -- no concurrent ad and
  // no linear break -- so a second tag here would be something nobody meant to signal.
  const ranges = dateRanges(run().playlist);
  assert.equal(ranges.length, 1, 'one Date Range, one window');
  assert.equal(ranges[0].hlsClass, MULTIVIEW_CLASS);
});

test('the window opens at the second race.json declares, and lasts what it declares', () => {
  // THIS IS THE ASSERTION THE PHASE EXISTS TO PROTECT (ADR 0044). `ofertaEn` is read by two
  // sides: this script, to place the START-DATE, and armar-relato.mjs, to place the line in
  // which the commentators announce the cameras. Two numbers typed into two files come
  // apart the day somebody moves one, and the defect that falls out is the one Nicolás
  // named: the announcement lands NEAR the window instead of IN it.
  //
  // The START-DATE is compared as an instant and not as a string, because the script writes
  // it in local time and the instant is what a client resolves.
  const [range] = dateRanges(run().playlist);
  const origin = new Date(PDT).getTime();
  assert.equal((new Date(range.startDate).getTime() - origin) / 1000, RACE.ofertaEn);
  // And the length it declares is the one its asset-list adds up to, never a number typed
  // into the script: a tag declaring twelve seconds of a window that lasts sixty-four is
  // inert for this player -- the range is built out of the experiences and not out of the
  // tag -- and a lie to every other client.
  assert.equal(range.plannedDuration, RACE.ofertaDura);
  assert.doesNotMatch(read('scripts/senalizar-contenido.sh'), /PLANNED-DURATION=\d/);
  assert.equal(range.assetList, '/signalling/asset-list-offer.json');
});

test('the multi view tag drops X-RESTRICT', () => {
  // The one attribute that separates it from an ad (ADR 0063). In an ad it says the break
  // cannot be skipped; in an offer there is no break to skip, because the programme never
  // stops and composing is optional.
  assert.equal(dateRanges(run().playlist)[0].restricts, false);
});

test('the offer announces a catalogue and not a layout', () => {
  // Rule of ADR 0064: a view carries `id`, `name`, `type` and `uri`, and NOT `viewport`,
  // `zDepth` or `volume`. A viewport in an offer is a position computed against a number
  // whoever published did not know -- how many boxes the viewer would raise.
  const { list } = run();
  const block = offerOf(list);
  assert.equal(block.type, 'offer');
  assert.equal(block.version, 2);
  const item = block.payload[0];
  assert.equal(item.type, 'multiViewOffer');
  assert.equal(item.start, 0);
  assert.equal(item.duration, RACE.ofertaDura);
  assert.ok(!('layout' in item), 'an offer declares no layout');
  for (const view of item.views) {
    for (const field of ['id', 'name', 'type', 'uri']) {
      assert.equal(typeof view[field], 'string', `view ${view.id} has a ${field}`);
    }
    for (const field of ['viewport', 'zDepth', 'volume']) {
      assert.ok(!(field in view), `view ${view.id} declares no ${field}`);
    }
  }
  // The URI of Appendix D.2 that every asset must carry is the uri of the first view, which
  // is what leaves the fallback of ADR 0019 something to play: a client that does not read
  // the block sees an ordinary asset.
  assert.equal(list.ASSETS[0].URI, item.views[0].uri);
  assert.equal(list.ASSETS[0].DURATION, RACE.ofertaDura);
});

test('the catalogue is the cameras that are packaged, named as race.json names them', () => {
  // THE NAMES ARE NOT TYPED TWICE. The row of the selector is the only thing that makes
  // choosing a camera mean something, and the word in that row comes off the asset-list. If
  // the asset-list were written by hand, the name of a car would live in two files.
  //
  // And the catalogue is as long as what is packaged, which is what lets stage 3 add five
  // cameras without anybody editing a script or a list: same script, one feed and six.
  const one = offerOf(run([RACE.feeds[0].id]).list).payload[0];
  assert.equal(one.primaryName, RACE.primaryName);
  assert.deepEqual(one.views.map((v) => v.id), [RACE.feeds[0].id]);
  assert.deepEqual(one.views.map((v) => v.name), [RACE.feeds[0].name]);

  const all = offerOf(run(RACE.feeds.map((f) => f.id)).list).payload[0];
  assert.deepEqual(all.views.map((v) => v.id), RACE.feeds.map((f) => f.id));
  assert.deepEqual(all.views.map((v) => v.name), RACE.feeds.map((f) => f.name));
  // Every view is a different piece of content, and they are listed in the order race.json
  // declares them, which is the order the selector lists them in.
  assert.equal(new Set(all.views.map((v) => v.uri)).size, all.views.length);
  // Six against a grid that tops out at four boxes: a catalogue longer than the grid is half
  // of what this demo argues, and the cap is of the screen and never of the offer (ADR 0066).
  assert.ok(all.views.length > 4, 'the full catalogue is longer than the grid');
});

test('the cue sheet prints the seconds of the window, and they are computed and not typed', () => {
  // The sheet is what replaces a story.json here: this demo is driven by hand, and the
  // commentators are the script. What it has to get right is the arithmetic of the window.
  const { sheet } = run();
  assert.match(sheet, new RegExp(`t=${RACE.ofertaEn}s a ${RACE.ofertaEn + RACE.ofertaDura}s`));
  assert.match(sheet, new RegExp(`\\b${RACE.feeds[0].name}\\b`));
  assert.match(sheet, new RegExp(`\\b${RACE.primaryName}\\b`));
});

test('the content is packaged at 1280x720 and at the cadence of the footage', () => {
  // 24 fps and not 30 (ADR 0059): all the video of this demo comes out of Veo at 24, and
  // packaging it at 30 duplicates one frame in four. The GOP follows the fps -- two seconds
  // of frames -- which is what makes the cuts of `-hls_time 2` land on a keyframe; with a
  // GOP fixed at 60 over a 24 fps input the keyframe falls every 2.5 s and the segments run
  // long, which is exactly what verificar-largos.mjs measures.
  const packager = read('scripts/empaquetar-contenido.sh');
  assert.match(packager, /scale=\$ANCHO:\$ALTO:force_original_aspect_ratio=increase,crop=\$ANCHO:\$ALTO,fps=\$FPS/);
  assert.match(packager, /-g "\$\(\(FPS \* 2\)\)"/);
  assert.match(packager, /^FPS=\$\{8:-24\}$/m);
  // And the preparer passes the size and the cadence off race.json rather than off itself.
  const preparer = read('scripts/preparar-contenido.sh');
  assert.match(preparer, /1280 720 "\$FPS"/);
  assert.doesNotMatch(preparer, /curl|wget/);
});

test('the numbers this demo runs on are declared once, in race.json', () => {
  // ADR 0044, checked instead of promised, and it is the check that holds the whole phase
  // together: the second the window opens, the seconds it lasts and the length of the
  // programme are read by the signaller, by the packager, by the mix of the commentary and
  // by the length check. A copy of any of them in a second file is a copy that comes apart,
  // and the defect that falls out of that is the one Nicolás named: the announcement lands
  // NEAR the window instead of IN it.
  //
  // COMMENTS ARE NOT CODE and are stripped before looking: half the value of this repository
  // is prose that explains why a number is what it is, and a check that forbade writing
  // "112 s" in a comment would be a check against documentation.
  //
  // AND THERE IS AN ACCEPTED LIST, which is the shape `scripts/verificar-cortes.mjs` already
  // uses for the two seams of the project. 64 and 112 are ordinary numbers and a tree this
  // size is going to contain them for reasons that have nothing to do with a race. What the
  // list may never hold is a number that governs the run; each line says why it does not.
  const typed = typedNumbers([RACE.largo, RACE.ofertaDura, RACE.ofertaEn]);
  const unexpected = typed.filter((hit) => !ACCEPTED.some((rx) => rx.test(hit)));
  assert.deepEqual(unexpected, [], `a number race.json declares is typed here too:\n${unexpected.join('\n')}`);
});

test('the check for typed numbers can see one', () => {
  // AND THE CONTROL, without which the assertion above is a check that cannot fail. A file
  // that really types the second of the window has to be found; the same number inside a
  // comment must not, which is the half that makes the stripping honest rather than lax.
  const dir = mkdtempSync(join(tmpdir(), 'race-numeros-'));
  try {
    writeFileSync(join(dir, 'plantado.sh'), `OFERTA_EN=${RACE.ofertaEn}\n`);
    writeFileSync(join(dir, 'comentado.sh'), `# la ventana abre a los ${RACE.ofertaEn} s\n`);
    writeFileSync(join(dir, 'pegado.mjs'), `const x = "base${RACE.ofertaDura}";\n`);
    const hits = typedNumbers([RACE.ofertaEn, RACE.ofertaDura], dir);
    assert.equal(hits.length, 1, `expected exactly the planted file, got:\n${hits.join('\n')}`);
    assert.match(hits[0], /plantado\.sh/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * The occurrences the check tolerates, each one a number that means something else.
 *
 * `verificar-linea-15.mjs` sizes a pipe buffer at 64 MiB, which is a number about a pipe.
 * There is nothing else on the list, and a line added to it without a reason on the same
 * line is the way this check stops working.
 */
const ACCEPTED = [/^scripts\/verificar-linea-15\.mjs:\d+\s+.*maxBuffer/];

/**
 * The files of a tree that TYPE one of `numbers` as a value, comments stripped.
 *
 * Three things are left out and each for its own reason. `race.json` is the one place the
 * numbers are allowed to be. `content/` and `signalling/` are generated output: the packaged
 * playlists carry the seconds of the programme because that is what they are, and the
 * asset-list carries the window because this script just wrote it there off race.json.
 * `test/` is this file, which has to name the fields to assert about them.
 */
function typedNumbers(numbers, root = DEMO) {
  const skip = new Set(['content', 'signalling', 'test', 'node_modules', '.git', '__pycache__']);
  const hits = [];
  // A standalone numeric literal: not glued to a word (base64), not part of a longer number
  // and not carrying a unit (28px, 28.02, 64%).
  const literal = (n) => new RegExp(`(?<![\\w.])${n}(?![\\w.%])`);
  const walk = (dir, rel) => {
    for (const name of readdirSync(dir).sort()) {
      if (skip.has(name) || name === 'race.json') continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { walk(full, `${rel}${name}/`); continue; }
      if (!/\.(sh|mjs|js|py|json|html|css)$/.test(name)) continue;
      // Block comments first, on the whole file, so a multi-line one is gone as a unit.
      const text = readFileSync(full, 'utf8')
        .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
        .replace(/"""[\s\S]*?"""/g, (m) => m.replace(/[^\n]/g, ' '));
      text.split('\n').forEach((line, i) => {
        const code = line.replace(/#.*$/, '').replace(/\/\/.*$/, '');
        for (const n of numbers) {
          if (literal(n).test(code)) hits.push(`${rel}${name}:${i + 1}  ${line.trim()}`);
        }
      });
    }
  };
  walk(root, '');
  return hits;
}
