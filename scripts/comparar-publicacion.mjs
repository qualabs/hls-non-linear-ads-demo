#!/usr/bin/env node
// comparar-publicacion.mjs -- does what would be published from one commit differ
// from what would be published from another in anything but an INERT way?
//
//   scripts/comparar-publicacion.mjs <before> [<after>=HEAD]
//   scripts/comparar-publicacion.mjs --control [<commit>=HEAD]
//
// It answers the question a restructuring of the library has to answer before it
// is pushed, because every push publishes (ADR 0118): the demos do exactly what
// they did. The dry run of publicar.sh cannot answer it. It says WHETHER a file of a
// bucket would change, not HOW, and a restructuring always changes one: the build
// labels every source with its path, so moving a file of lib/ changes the bytes of
// dist/ while not changing one thing it does.
//
// WHAT IS COMPARED IS WHAT publicar.sh PUBLISHES, built the way it builds it: the
// paths it archives and the demos it knows are read from THAT COMMIT'S OWN
// scripts/publicar.sh, its construir-libreria.sh runs inside the stage, and dist/
// and vendor/ are copied into each demo. content/ is not in git, so it is not
// here; the dry run of publicar.sh is what says the signalled playlists and the
// references did not change.
//
// Per demo, it is GREEN only if:
//
//   1. The two stages hold the same list of files. One more is a new URL; one less
//      is a deletion from the bucket.
//   2. Every file is the same, byte for byte, except in the two cases below.
//   3. dist/qualabs-concurrent-hls.js has the same top-level DECLARATIONS, each with
//      the same text, once the comments are taken out. Their order and the comments
//      may differ, and nothing else. The comments are taken out by a lexer that
//      knows strings, template literals and regular expressions, because a `//`
//      inside a string or a regex is not a comment; what keeps that lexer honest is
//      that the code it leaves has to pass `node --check`, on every run. Both
//      builds are also evaluated, and have to define the same global with the same
//      keys: an order that read a constant before it was declared would throw here.
//   4. Any other file that differs differs ONLY IN ITS IMPORTS of the library: with
//      every path to a module of the library (`.../lib/x.js`, `.../hls/x.js`,
//      `.../dash/x.js`) written as one placeholder and the `import { ... } from`
//      statements taken out, the rest is identical, and the names imported are the
//      same. That admits an import split in two because its names now live in two
//      modules, and nothing else. Which module a name really comes from is not this
//      script's question: a name imported from the wrong one fails the test that
//      imports it.
//
// --control is how to know it measures anything: on copies of one stage it plants
// one change per red branch (a string of the dist, a regex of the dist, a missing
// declaration, a file more, a renamed import, a byte of a page) and the changes
// that must stay green (a comment, two declarations swapped, an import split in
// two). It is RED unless every plant comes out the way it should.
//
// Nothing in the checkout is written: the stages live in a folder of their own
// under $XDG_RUNTIME_DIR, removed on exit.

import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = 'dist/qualabs-concurrent-hls.js';
const GLOBAL = 'QualabsConcurrentHls';
const TMP = mkdtempSync(join(process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || '/tmp', 'comparar-publicacion-'));
process.on('exit', () => rmSync(TMP, { recursive: true, force: true }));

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });

// ---------------------------------------------------------------------------
// The stage of a commit, built the way publicar.sh builds it.

/** What the commit's own publicar.sh archives and which demos it knows. */
function publicationOf(commit) {
  const script = git('show', `${commit}:scripts/publicar.sh`);
  const archived = script.match(/git archive HEAD ([a-z ]+?) \|/);
  const all = script.match(/^ALL=\(([^)]*)\)/m);
  if (!archived || !all) throw new Error(`${commit}: scripts/publicar.sh has no "git archive HEAD ..." or no ALL=(...)`);
  // The DASH side goes only to the demos that load it (phase 19); a commit before
  // that has no such lines and nothing to leave out.
  const list = (name) => (script.match(new RegExp(`^${name}=\\(([^)]*)\\)`, 'm'))?.[1] ?? '').split(/\s+/).filter(Boolean);
  return { paths: archived[1].split(/\s+/), demos: all[1].split(/\s+/).filter(Boolean), dash: list('DASH'), dashFiles: list('DASH_FILES') };
}

/** { demo: absolute path of its stage } for one commit. */
function stage(commit, label) {
  const sha = git('rev-parse', '--verify', `${commit}^{commit}`).trim();
  const { paths, demos, dash, dashFiles } = publicationOf(sha);
  const dir = join(TMP, label);
  mkdirSync(dir);
  const tar = execFileSync('git', ['archive', sha, ...paths], { cwd: ROOT, maxBuffer: 1 << 30 });
  execFileSync('tar', ['-x', '-C', dir], { input: tar });
  execFileSync('./scripts/construir-libreria.sh', { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'] });
  const out = {};
  for (const d of demos) {
    cpSync(join(dir, 'dist'), join(dir, 'demo', d, 'dist'), { recursive: true });
    cpSync(join(dir, 'vendor'), join(dir, 'demo', d, 'vendor'), { recursive: true });
    if (!dash.includes(d)) for (const f of dashFiles) rmSync(join(dir, 'demo', d, f), { force: true });
    out[d] = join(dir, 'demo', d);
  }
  return { sha, demos, stages: out };
}

/** The relative paths of the files under root, outside content/ (publicar.py does the same). */
function files(root) {
  const out = [];
  (function walk(d) {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const rel = relative(root, p);
      if (rel === 'content') continue;
      if (statSync(p).isDirectory()) walk(p);
      else out.push(rel);
    }
  })(root);
  return out.sort();
}

// ---------------------------------------------------------------------------
// A JavaScript lexer, as small as the question allows: tokens without comments.

const PUNCTUATORS = [
  '>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=',
  '&=', '|=', '^=', '**', '<<', '>>',
  '{', '}', '(', ')', '[', ']', ';', ',', '<', '>', '+', '-', '*', '/', '%', '&', '|', '^', '!', '~',
  '?', ':', '=', '.', '@'
];
// After one of these a `/` starts a regular expression; after anything else it divides.
const BEFORE_REGEX = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'throw', 'case', 'do', 'else', 'yield', 'await']);
const IDENT = /[A-Za-z_$#\u0080-￿][\w$\u0080-￿]*/y;
const NUMBER = /(?:0[xXbBoO][0-9a-fA-F_]+n?|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d+)?n?)/y;

/**
 * Tokens of `src` from `i`: `{ type, text, start, end, nl }`, where `nl` says that a
 * line break (or a comment holding one) came before the token, which is what
 * automatic semicolon insertion reads, so it is kept. With `stopAtBrace` it returns
 * at the `}` that closes a `${` of a template literal.
 */
function lex(src, i = 0, stopAtBrace = false) {
  const tokens = [];
  let nl = false;
  let depth = 0;
  const prev = () => tokens[tokens.length - 1];
  const regexAllowed = () => {
    const p = prev();
    if (!p) return true;
    if (p.type === 'punc') return ![')', ']'].includes(p.text);
    if (p.type === 'id') return BEFORE_REGEX.has(p.text);
    return false;
  };
  while (i < src.length) {
    const c = src[i];
    if (c === '\n' || c === '\r' || c === '\u2028' || c === '\u2029') { nl = true; i += 1; continue; }
    if (/\s/.test(c)) { i += 1; continue; }
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) throw new Error(`unterminated comment at ${i}`);
      if (/[\n\r\u2028\u2029]/.test(src.slice(i, end))) nl = true;
      i = end + 2;
      continue;
    }
    const start = i;
    let type;
    if (c === '"' || c === "'") {
      i += 1;
      while (src[i] !== c) {
        if (i >= src.length || src[i] === '\n') throw new Error(`unterminated string at ${start}`);
        i += src[i] === '\\' ? 2 : 1;
      }
      i += 1;
      type = 'str';
    } else if (c === '`') {
      i += 1;
      while (src[i] !== '`') {
        if (i >= src.length) throw new Error(`unterminated template at ${start}`);
        if (src[i] === '\\') i += 2;
        else if (src[i] === '$' && src[i + 1] === '{') i = lex(src, i + 2, true).end + 1;
        else i += 1;
      }
      i += 1;
      type = 'tpl';
    } else if (c === '/' && regexAllowed()) {
      i += 1;
      let inClass = false;
      while (inClass || src[i] !== '/') {
        if (i >= src.length || src[i] === '\n') throw new Error(`unterminated regex at ${start}`);
        if (src[i] === '\\') { i += 2; continue; }
        if (src[i] === '[') inClass = true;
        else if (src[i] === ']') inClass = false;
        i += 1;
      }
      i += 1;
      while (/[a-z]/.test(src[i] ?? '')) i += 1;
      type = 're';
    } else {
      IDENT.lastIndex = i;
      NUMBER.lastIndex = i;
      let m;
      if (/\d/.test(c) || (c === '.' && /\d/.test(src[i + 1] ?? ''))) {
        m = NUMBER.exec(src);
        type = 'num';
      } else if ((m = IDENT.exec(src))) {
        type = 'id';
      }
      if (m) i += m[0].length;
      else {
        const p = PUNCTUATORS.find((x) => src.startsWith(x, i));
        if (!p) throw new Error(`unexpected character ${JSON.stringify(c)} at ${i}`);
        if (stopAtBrace && p === '}' && depth === 0) return { tokens, end: i };
        if (p === '{') depth += 1;
        if (p === '}') depth -= 1;
        i += p.length;
        type = 'punc';
      }
    }
    tokens.push({ type, text: src.slice(start, i), start, end: i, nl });
    nl = false;
  }
  if (stopAtBrace) throw new Error('unterminated template substitution');
  return { tokens, end: i };
}

/** The code without comments: tokens joined by one space, or one newline where a line ended. */
const codeOf = (tokens) => tokens.map((t, k) => (k === 0 ? '' : t.nl ? '\n' : ' ') + t.text).join('');

/**
 * The top-level statements inside the build's wrapper, `(function (global) { ... })`,
 * each as `{ name, text, start, end }`: the text without comments, and the source
 * range it came from (which is what --control cuts and swaps).
 */
function declarations(src) {
  const { tokens } = lex(src);
  const open = tokens.findIndex((t, k) => t.text === '{' && tokens[k - 1]?.text === ')');
  if (open < 0) throw new Error('no function body: is this the build of construir-libreria.sh?');
  const out = [];
  let depth = 0;
  let current = [];
  for (let k = open + 1; k < tokens.length; k += 1) {
    const t = tokens[k];
    if (depth === 0 && t.text === '}' && !current.length) break; // the end of the wrapper
    current.push(t);
    if (['{', '(', '['].includes(t.text)) depth += 1;
    if (['}', ')', ']'].includes(t.text)) depth -= 1;
    const first = current[0].text === 'async' ? current[1]?.text : current[0].text;
    const ends = depth === 0 && (t.text === ';' || (t.text === '}' && (first === 'function' || first === 'class')));
    if (ends) {
      const name = current.find((x, n) => n > 0 && x.type === 'id' && !['function', 'async', 'class', 'const', 'let', 'var'].includes(x.text))?.text ?? current[0].text;
      out.push({ name, text: codeOf(current), start: current[0].start, end: t.end });
      current = [];
    }
  }
  return { list: out, code: codeOf(tokens) };
}

/** The keys of the global the build defines, evaluated in a context of its own. */
function globalKeys(src) {
  const context = vm.createContext({ console: { log() {}, warn() {}, error() {}, info() {} } });
  vm.runInContext(src, context, { filename: DIST });
  const value = vm.runInContext(`globalThis.${GLOBAL}`, context);
  return Object.keys(value ?? {}).sort();
}

/** Problems between two builds of the dist, as sentences; empty is the green case. */
function compareDist(a, b, where) {
  const problems = [];
  const before = declarations(a);
  const after = declarations(b);
  for (const [label, d] of [['before', before], ['after', after]]) {
    const check = join(TMP, `check-${process.hrtime.bigint()}.cjs`);
    writeFileSync(check, d.code);
    try {
      execFileSync('node', ['--check', check], { stdio: 'pipe' });
    } catch (e) {
      const why = String(e.stderr).split('\n').find((l) => /Error/.test(l)) ?? 'node --check failed';
      problems.push(`the dist of ${label} without comments does not parse -- a broken dist, or a lexer that is wrong (${why})`);
    }
  }
  const count = (list) => list.reduce((m, x) => m.set(x.text, (m.get(x.text) ?? 0) + 1), new Map());
  const names = new Map([...before.list, ...after.list].map((x) => [x.text, x.name]));
  const ca = count(before.list);
  const cb = count(after.list);
  for (const [text, n] of ca) {
    if ((cb.get(text) ?? 0) !== n) problems.push(`declaration ${names.get(text)} is missing, or not the same, after`);
  }
  for (const text of cb.keys()) {
    if (!ca.has(text)) problems.push(`declaration ${names.get(text)} is new, or not the same, after`);
  }
  let keys = null;
  try {
    const ka = globalKeys(a);
    const kb = globalKeys(b);
    if (ka.join() !== kb.join()) problems.push(`the global ${GLOBAL} has other keys: before ${ka.join(',')}, after ${kb.join(',')}`);
    keys = ka.length;
  } catch (e) {
    problems.push(`evaluating the dist failed: ${e.message}`);
  }
  const order = before.list.map((x) => x.text).join('\0') === after.list.map((x) => x.text).join('\0') ? 'same order' : 'another order';
  return {
    problems,
    note: `${before.list.length} declarations before, ${after.list.length} after, ${order}; ${keys ?? '?'} keys on the global` + (where ? ` (${where})` : '')
  };
}

// ---------------------------------------------------------------------------
// A file that may only have changed its imports of the library.

const LIBRARY_PATH = /(['"])[^'"\n]*\/(?:lib|hls|dash)\/[A-Za-z0-9_-]+\.js\1/g;
const STATIC_IMPORT = /^import\s*\{([^}]*)\}\s*from\s*'<library>';?[ \t]*\r?\n/gm;

function importsOnly(a, b) {
  const shape = (text) => {
    const normal = text.replace(LIBRARY_PATH, "'<library>'");
    const names = [];
    const rest = normal.replace(STATIC_IMPORT, (_, list) => {
      names.push(...list.split(',').map((n) => n.trim().replace(/\s+/g, ' ')).filter(Boolean));
      return '';
    });
    return { rest, names: names.sort() };
  };
  const sa = shape(a);
  const sb = shape(b);
  const problems = [];
  if (sa.names.join() !== sb.names.join()) {
    const gone = sa.names.filter((n) => !sb.names.includes(n));
    const added = sb.names.filter((n) => !sa.names.includes(n));
    problems.push(`imports other names (gone: ${gone.join(', ') || '-'}; new: ${added.join(', ') || '-'})`);
  }
  if (sa.rest !== sb.rest) {
    const la = sa.rest.split('\n');
    const lb = sb.rest.split('\n');
    const first = la.findIndex((line, k) => line !== lb[k]);
    const n = first < 0 ? la.length : first;
    problems.push(`differs outside its imports, first at line ${n + 1} of what is left: ${JSON.stringify((la[n] ?? '').slice(0, 100))} -> ${JSON.stringify((lb[n] ?? '').slice(0, 100))}`);
  }
  return { problems, note: `${sb.names.length} names imported, the same` };
}

// ---------------------------------------------------------------------------
// One demo, and the whole comparison.

function compareTrees(a, b) {
  const fa = files(a);
  const fb = files(b);
  const red = [];
  const admitted = [];
  for (const f of fa.filter((x) => !fb.includes(x))) red.push(`only before (a deletion from the bucket): ${f}`);
  for (const f of fb.filter((x) => !fa.includes(x))) red.push(`only after (a new URL): ${f}`);
  let same = 0;
  for (const f of fa.filter((x) => fb.includes(x))) {
    const ba = readFileSync(join(a, f));
    const bb = readFileSync(join(b, f));
    if (ba.equals(bb)) { same += 1; continue; }
    let result;
    try {
      result = f === DIST ? compareDist(ba.toString('utf8'), bb.toString('utf8')) : importsOnly(ba.toString('utf8'), bb.toString('utf8'));
    } catch (e) {
      result = { problems: [`could not be compared: ${e.message}`] };
    }
    if (result.problems.length) red.push(...result.problems.map((p) => `${f}: ${p}`));
    else admitted.push(`${f}: ${f === DIST ? 'only order and comments' : 'only its imports'} -- ${result.note}`);
  }
  return { red, admitted, same, total: fb.length };
}

function report(name, r) {
  console.log(`== ${name}: ${r.total} files, ${r.same} identical, ${r.admitted.length} admitted, ${r.red.length} red`);
  for (const x of r.admitted) console.log(`   admitted  ${x}`);
  for (const x of r.red) console.log(`   RED       ${x}`);
  return r.red.length === 0;
}

function compare(before, after) {
  const a = stage(before, 'before');
  const b = stage(after, 'after');
  console.log(`before ${a.sha.slice(0, 7)} (${before}), after ${b.sha.slice(0, 7)} (${after})`);
  let green = true;
  if (a.demos.join() !== b.demos.join()) {
    console.log(`RED: the demos published are not the same: ${a.demos.join(' ')} -> ${b.demos.join(' ')}`);
    green = false;
  }
  for (const d of a.demos.filter((x) => b.demos.includes(x))) green = report(d, compareTrees(a.stages[d], b.stages[d])) && green;
  console.log(green ? 'GREEN: what would be published differs only in the ways ADR 0118 admits' : 'RED');
  return green;
}

// ---------------------------------------------------------------------------
// --control: every branch, planted on copies of one stage.

function control(commit) {
  const s = stage(commit, 'control');
  const demo = s.demos[0];
  const base = s.stages[demo];
  const dist = readFileSync(join(base, DIST), 'utf8');
  const { list } = declarations(dist);
  const { tokens } = lex(dist);
  const firstOf = (type) => tokens.find((t) => t.type === type);
  const libraryImport = /^import\s*\{([^}]*)\}\s*from\s*(['"][^'"]*\/lib\/[A-Za-z0-9_-]+\.js['"]);?/m;
  const testFile = files(base).find((f) => /^test\/.*\.js$/.test(f) && libraryImport.test(readFileSync(join(base, f), 'utf8')));

  const fn = list.filter((x) => x.text.startsWith('function'));
  const [x, y] = [fn[0], fn[1]];
  const swapped = dist.slice(0, x.start) + dist.slice(y.start, y.end) + dist.slice(x.end, y.start) + dist.slice(x.start, x.end) + dist.slice(y.end);
  const byName = (name) => list.find((d) => d.name === name);
  const [early, late] = [byName('VIEWPORTS_BY_COUNT'), byName('MAX_BOXES')];
  const reordered = early && late && early.end <= late.start
    ? dist.slice(0, early.start) + dist.slice(late.start, late.end) + dist.slice(early.end, late.start) + dist.slice(early.start, early.end) + dist.slice(late.end)
    : null;
  const str = firstOf('str');
  const re = firstOf('re');
  const comment = dist.indexOf('// ');

  const plants = [
    // [what, must be green, how to change the copy]
    ['the same stage', true, () => {}],
    ['a comment of the dist changed', true, (d) => writeFileSync(join(d, DIST), dist.slice(0, comment) + '// planted ' + dist.slice(comment + 3))],
    ['two declarations of the dist swapped', true, (d) => writeFileSync(join(d, DIST), swapped)],
    ['a string of the dist changed', false, (d) => writeFileSync(join(d, DIST), dist.slice(0, str.start + 1) + 'X' + dist.slice(str.start + 1))],
    ['a regex of the dist changed', false, (d) => writeFileSync(join(d, DIST), dist.slice(0, re.start + 1) + 'X' + dist.slice(re.start + 1))],
    ['a declaration of the dist missing', false, (d) => writeFileSync(join(d, DIST), dist.slice(0, x.start) + dist.slice(x.end))],
    ['a dist that does not parse', false, (d) => writeFileSync(join(d, DIST), dist.slice(0, x.start) + 'const const;\n' + dist.slice(x.start))],
    ...(reordered ? [['MAX_BOXES moved before VIEWPORTS_BY_COUNT, which it reads when it loads', false, (d) => writeFileSync(join(d, DIST), reordered)]] : []),
    ['a file more', false, (d) => writeFileSync(join(d, 'planted.html'), 'x')],
    ['a file less', false, (d) => rmSync(join(d, 'index.html'))],
    ['a byte of a page changed', false, (d) => writeFileSync(join(d, 'index.html'), readFileSync(join(d, 'index.html'), 'utf8') + ' ')]
  ];
  if (testFile) {
    const text = readFileSync(join(base, testFile), 'utf8');
    const m = text.match(libraryImport);
    const names = m[1].split(',').map((n) => n.trim()).filter(Boolean);
    const split = names.length > 1
      ? `import { ${names[0]} } from '../../../hls/elsewhere.js';\nimport {\n  ${names.slice(1).join(', ')}\n} from ${m[2]};`
      : `import { ${names[0]} } from '../../../hls/elsewhere.js';`;
    plants.push(
      ['an import of a demo test split in two, same names', true, (d) => writeFileSync(join(d, testFile), text.replace(m[0], split))],
      ['an import of a demo test with another name', false, (d) => writeFileSync(join(d, testFile), text.replace(m[0], m[0].replace(names[0], names[0] + 'X')))],
      ['a line of a demo test changed outside its imports', false, (d) => writeFileSync(join(d, testFile), text + '\n// planted\n')]
    );
  }

  let ok = true;
  for (const [n, [what, green, plant]] of plants.entries()) {
    const copy = join(TMP, `plant-${n}`);
    cpSync(base, copy, { recursive: true });
    plant(copy);
    const r = compareTrees(base, copy);
    const got = r.red.length === 0;
    ok = ok && got === green;
    console.log(`   ${got === green ? 'ok   ' : 'WRONG'} ${green ? 'green' : 'red  '} expected, ${got ? 'green' : 'red  '} got: ${what}${r.red[0] ? ` (${r.red[0].slice(0, 110)})` : ''}`);
    rmSync(copy, { recursive: true, force: true });
  }
  console.log(`control on ${demo} at ${s.sha.slice(0, 7)}${testFile ? `, test file ${testFile}` : ', NO demo test with a library import to plant on'}`);
  console.log(ok && testFile ? 'CONTROL GREEN: every plant came out the way it should' : 'CONTROL RED');
  return ok && Boolean(testFile);
}

const args = process.argv.slice(2);
let green;
if (args[0] === '--control') green = control(args[1] ?? 'HEAD');
else if (args.length >= 1 && args.length <= 2 && !args[0].startsWith('-')) green = compare(args[0], args[1] ?? 'HEAD');
else {
  console.error('usage: comparar-publicacion.mjs <before> [<after>=HEAD] | --control [<commit>=HEAD]');
  process.exit(2);
}
process.exit(green ? 0 : 1);
