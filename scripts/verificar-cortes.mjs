#!/usr/bin/env node
// verificar-cortes.mjs -- runs the two seam checks of the project and answers
// the one question a bare grep cannot: is what it found ACCEPTED or is it new?
//
// The project has two seams, and each one is verified and not asserted with a
// grep that has to come back empty:
//
//   ADR 0003 -- the rendering side does not know one word of the transport.
//   ADR 0015 -- the library side does not name the demo application.
//
// The grep of ADR 0003 stopped coming back empty in the T-04 of phase 02, and
// the finding was about the LIST OF TERMS and not about the code: `interstitial`
// is the value of the `kind` field of the contract that the T-02 designed, and
// the contract says out loud that the kind is what crosses the seam. Three
// places on the rendering side name it: the comment that explains it, its
// colour and its name.
//
// There were two ways out and Nicolas took the second. Dropping the term from
// the list weakens the only alarm that keeps the two layers from mixing again --
// the word would then be free to appear anywhere, for any reason. So THE WORD
// STAYS IN THE SEARCH AND THE ACCEPTED PLACES ARE WRITTEN DOWN HERE. A fourth
// one fires.
//
// TWO THINGS ABOUT THE SHAPE OF THAT LIST, AND THE SECOND ONE IS THE POINT.
//
//   1. An exception is registered BY CONTENT AND NOT BY LINE NUMBER. Line
//      numbers move with any edit above them, so a list keyed by number would
//      start failing for reasons that have nothing to do with the seam, and a
//      check that cries wolf gets switched off. What is compared is the line
//      itself, normalised -- trimmed, and inner runs of whitespace collapsed to
//      one space -- so that reindenting is not a finding either. What somebody
//      judged the day the exception was accepted is the text, so the text is
//      the key.
//
//   2. Every exception carries WHY it is acceptable, in `porque`, and the script
//      refuses to run with one that does not. A list of exceptions without
//      reasons is a list the next person extends without thinking, and that is
//      how this alarm would die: not in one go, but one accepted line at a time.
//
// Exit code 0 if both seams hold, 1 if anything is off, saying which and where.

import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The signalling side of the seam of ADR 0003: the files of the library that ARE
 * allowed to name the transport, because naming it is their job.
 *
 * It is written down for one reason. The check of ADR 0003 runs over a list of
 * files written by hand, so a new file in `lib/` that nobody adds to either list
 * would pass by never being looked at. Every `lib/*.js` has to be on one side or
 * the other, and the script says so when one is on neither.
 */
const SIGNALLING_SIDE = ['lib/signalling.js', 'lib/media.js', 'lib/concurrent-hls.js'];

const SEAMS = [
  {
    adr: '0003',
    title: 'the rendering side does not know one word of the transport',
    // The same list of terms six tasks of phase 01 and four of phase 02 ran.
    // `interstitial` stays in it on purpose -- see the head of this file.
    terms: 'hls|daterange|date range|asset-list|assetlist|m3u8|manifest|EXT-X|interstitial|Hls\\.',
    // Per file and not per directory: written as one file, signalling and
    // rendering would share a scope and the grep would have nothing to point at.
    // That is also why the library is assembled by a build step instead of being
    // written by hand (scripts/construir-libreria.sh).
    files: ['lib/renderer.js', 'lib/controls.js', 'js/contract-trace.js', 'css/player.css'],
    accepted: [
      {
        file: 'lib/controls.js',
        line: "// or 'interstitial' -- which the contract carries on purpose, because the two",
        times: 1,
        porque:
          'The header comment that names the two values of the `kind` field of the contract ' +
          'and says why the kind is the thing that crosses the seam. Naming the value of the ' +
          'contract is not knowing the transport: this file names no playlist tag and no ' +
          'hls.js class.'
      },
      {
        file: 'lib/controls.js',
        line: "interstitial: '#ffcc00'",
        times: 1,
        porque:
          'A key of RANGE_COLOURS, a table indexed by the `kind` of the contract. Every mark ' +
          'reads its colour off it, and a kind that is NOT a key in it is a break that is not ' +
          'drawn and says so out loud, so this is also the table the miss is checked against. ' +
          'Without the value as a key there is no table: the colour would be chosen off ' +
          'something other than what the contract hands over.'
      },
      {
        file: 'lib/controls.js',
        line: "interstitial: 'traditional interstitial: the content is replaced by the ad'",
        times: 1,
        porque:
          'An entry of RANGE_TITLES: the readable name of the kind of range, which is the ' +
          'tooltip of a mark of that kind, for whoever hovers over it. It is the only one of ' +
          'the three that is prose and not only a key, and it is accepted because it describes ' +
          'a PLAYBACK BEHAVIOUR -- that the content is replaced by the ad -- and not a ' +
          'transport mechanism: it names no tag, no playlist and no HLS class. The day this ' +
          'text explains where the range comes from it stops being acceptable, and the fix is ' +
          'to rewrite the sentence, not to widen this list.'
      }
    ]
  },
  {
    adr: '0015',
    title: 'the library side does not name the demo application',
    terms:
      'demo|app\\.js|contract-trace|stock-player|index\\.html|getElementById|querySelector|#player|#ads|#video|#ad-audio|pane-|data-state',
    // Here the whole directory does go in: a new file in `lib/` walks into this
    // check on its own, which is what this seam needs and the other one cannot
    // have, because that one is per file on purpose.
    files: ['lib/*.js', 'scripts/construir-libreria.sh'],
    // None, and not for lack of use: the T-04 ran this grep, it found a comment
    // explaining a colour with a reason that belonged to this page, and the
    // reason moved to the document of the task instead of being written here.
    accepted: []
  }
];

/** Trimmed, inner runs of whitespace collapsed: reindenting is not a finding. */
const normalise = (text) => text.trim().replace(/\s+/g, ' ');

/** `lib/*.js` -> the files, sorted. Only a `*` in the last segment is supported. */
function expand(pattern) {
  if (!pattern.includes('*')) return [pattern];
  const slash = pattern.lastIndexOf('/');
  const folder = pattern.slice(0, slash);
  const regex = new RegExp(
    '^' + pattern.slice(slash + 1).replace(/[.]/g, '\\.').replace(/\*/g, '.*') + '$'
  );
  return readdirSync(resolve(ROOT, folder))
    .filter((name) => regex.test(name))
    .sort()
    .map((name) => `${folder}/${name}`);
}

/** The grep of a seam, as `{ file, number, line }`. Empty is the good case. */
function runGrep(seam) {
  const files = seam.files.flatMap(expand);
  let out = '';
  try {
    out = execFileSync('/usr/bin/grep', ['-n', '-i', '-E', seam.terms, ...files], {
      cwd: ROOT,
      encoding: 'utf8'
    });
  } catch (e) {
    // grep(1): status 1 is "no lines selected", which is the case this check
    // hopes for. Anything else is grep itself failing -- a file that is not
    // there, a bad pattern -- and must never be read as a clean seam.
    if (e.status !== 1) {
      console.error(`verificar-cortes: the grep of ADR ${seam.adr} failed (status ${e.status})`);
      if (e.stderr) process.stderr.write(e.stderr);
      process.exit(1);
    }
  }
  return out
    .split('\n')
    .filter(Boolean)
    .map((row) => {
      const [file, number, ...rest] = row.split(':');
      return { file, number: Number(number), line: rest.join(':') };
    });
}

/** Every `lib/*.js` has to be on one side of the seam of ADR 0003 or the other. */
function nobodyIsUnwatched() {
  const seam = SEAMS.find((s) => s.adr === '0003');
  const classified = new Set([...seam.files, ...SIGNALLING_SIDE]);
  const loose = expand('lib/*.js').filter((f) => !classified.has(f));
  if (loose.length === 0) return true;
  console.error('The seam of ADR 0003 is not looking at every file of the library.\n');
  for (const f of loose) {
    console.error(`  ${f} is on neither the rendering side nor the signalling side.`);
  }
  console.error(
    '\n  A file on neither list is a file nobody checks. Put it in `files` of seam 0003\n' +
      '  if it is rendering, or in SIGNALLING_SIDE if it knows the transport on purpose.'
  );
  return false;
}

/** An exception without a written reason is a configuration error, not an exception. */
function everyReasonIsWritten() {
  const mute = SEAMS.flatMap((seam) =>
    seam.accepted
      .filter((a) => !a.porque || normalise(a.porque).length < 40)
      .map((a) => ({ adr: seam.adr, ...a }))
  );
  if (mute.length === 0) return true;
  console.error('There are accepted occurrences with no reason written, and those do not count.\n');
  for (const a of mute) console.error(`  ADR ${a.adr}  ${a.file}  ${a.line}`);
  console.error('\n  Write in `porque` why that occurrence is acceptable, or take it off the list.');
  return false;
}

function checkSeam(seam) {
  const hits = runGrep(seam);
  const key = (file, line) => `${file} ${normalise(line)}`;

  const byKey = new Map();
  for (const hit of hits) {
    const k = key(hit.file, hit.line);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(hit);
  }

  const unexpected = [];
  const stale = [];
  const accepted = [];

  for (const exception of seam.accepted) {
    const k = key(exception.file, exception.line);
    const found = byKey.get(k) ?? [];
    byKey.delete(k);
    const expected = exception.times ?? 1;
    if (found.length === expected) {
      accepted.push(...found);
    } else if (found.length > expected) {
      // A copy of an accepted line is a NEW occurrence: nobody judged that one.
      accepted.push(...found.slice(0, expected));
      unexpected.push(...found.slice(expected));
    } else {
      stale.push({ exception, found: found.length, expected });
    }
  }
  for (const rest of byKey.values()) unexpected.push(...rest);

  const byFileAndLine = (a, b) => a.file.localeCompare(b.file) || a.number - b.number;
  unexpected.sort(byFileAndLine);
  accepted.sort(byFileAndLine);

  console.log(`## ADR ${seam.adr} -- ${seam.title}`);
  console.log(`   /usr/bin/grep -n -i -E "${seam.terms}" ${seam.files.join(' ')}`);

  if (unexpected.length > 0) {
    console.log(`\n   RED: ${unexpected.length} occurrence(s) that are not on the accepted list.\n`);
    for (const hit of unexpected) {
      console.log(`     ${hit.file}:${hit.number}`);
      console.log(`       ${hit.line.trim()}`);
    }
    console.log(
      '\n   If the seam was crossed, this is the finding and the mention has to go.\n' +
        '   If the occurrence is legitimate, it goes in `accepted` in this script WITH ITS\n' +
        '   REASON WRITTEN, which is what keeps the next one from being added on its own.'
    );
  }

  if (stale.length > 0) {
    console.log('\n   RED: the accepted list no longer matches the code.\n');
    for (const { exception, found, expected } of stale) {
      console.log(`     ${exception.file}  expected ${expected}, found ${found}`);
      console.log(`       ${exception.line}`);
      console.log(`       porque: ${normalise(exception.porque)}`);
    }
    console.log(
      '\n   The occurrence was edited or is gone. Delete the exception if it is no longer\n' +
        '   needed, or update its text if the line changed and the reason still holds.'
    );
  }

  if (unexpected.length === 0 && stale.length === 0) {
    if (accepted.length === 0) {
      console.log('\n   GREEN: zero hits.');
    } else {
      console.log(`\n   GREEN: ${accepted.length} occurrence(s), all of them on the accepted list.`);
      for (const hit of accepted) console.log(`     ${hit.file}:${hit.number}  ${hit.line.trim()}`);
    }
  }

  console.log('');
  return unexpected.length === 0 && stale.length === 0;
}

let ok = everyReasonIsWritten();
if (ok) ok = nobodyIsUnwatched();
if (ok) {
  console.log('# The two seams of the project, verified and not asserted\n');
  for (const seam of SEAMS) ok = checkSeam(seam) && ok;
}
if (!ok) process.exit(1);
console.log('verificar-cortes: both seams hold.');
