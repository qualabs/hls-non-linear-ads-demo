// T-02 of phase 19: hls/media.js attachAsset of bb0d78b against the one of HEAD, run on
// the same inputs with a fake Hls and fake nodes, and their traces compared whole.
// Usage: node diferencial.mjs <old-root> <new-root> <cases.json>
import { readFileSync } from 'node:fs';
import { mock } from 'node:test';
const [oldRoot, newRoot, casesFile] = process.argv.slice(2);
const cases = JSON.parse(readFileSync(casesFile, 'utf8'));

let trace;
const log = (...e) => trace.push(e);
class FakeHls {
  static Events = { MANIFEST_LOADED: 'hlsManifestLoaded', ERROR: 'hlsError' };
  static ErrorDetails = { MANIFEST_LOAD_ERROR: 'manifestLoadError', MANIFEST_LOAD_TIMEOUT: 'manifestLoadTimeOut', MANIFEST_PARSING_ERROR: 'manifestParsingError', FRAG_LOAD_ERROR: 'fragLoadError' };
  constructor(config) { log('Hls.new', config); this.h = {}; FakeHls.last = this; }
  on(ev, fn) { log('Hls.on', ev); (this.h[ev] ||= []).push(fn); }
  emit(ev, data) { for (const fn of this.h[ev] || []) fn(ev, data); }
  loadSource(u) { log('Hls.loadSource', u); }
  attachMedia() { log('Hls.attachMedia'); }
  destroy() { log('Hls.destroy'); }
}
globalThis.Hls = FakeHls;
function fakeNode() {
  const l = {};
  const node = {
    addEventListener(t, fn, o) { log('node.on', t, o); (l[t] ||= []).push(fn); },
    fire(t) { for (const fn of l[t] || []) fn(); },
    removeAttribute(a) { log('node.removeAttribute', a); },
    load() { log('node.load'); }
  };
  return new Proxy(node, { set(o, k, v) { log('node.set', k, v); o[k] = v; return true; } });
}
const SCENARIOS = [
  ['node:load', (n) => n.fire('load')],
  ['node:error', (n) => n.fire('error')],
  ['node:loadedmetadata', (n) => n.fire('loadedmetadata')],
  ['hls:manifestLoaded', () => FakeHls.last?.emit('hlsManifestLoaded', {})],
  ['hls:404', () => FakeHls.last?.emit('hlsError', { details: 'manifestLoadError', fatal: true, response: { code: 404 } })],
  ['hls:timeout', () => FakeHls.last?.emit('hlsError', { details: 'manifestLoadTimeOut', fatal: true })],
  ['hls:frag-nonfatal', () => FakeHls.last?.emit('hlsError', { details: 'fragLoadError', fatal: false })],
  ['hls:frag-fatal', () => FakeHls.last?.emit('hlsError', { details: 'fragLoadError', fatal: true })],
  ['timer:10s', () => mock.timers.tick(10000)],
  ['nothing', () => {}]
];
async function run(root) {
  const { attachAsset } = await import(`${root}/hls/media.js`);
  const out = {};
  for (const c of cases) for (const [name, act] of SCENARIOS) {
    trace = [];
    FakeHls.last = null;
    mock.timers.enable({ apis: ['setTimeout'] });
    const node = fakeNode();
    const detach = attachAsset(node, { uri: c.uri, mediaType: c.mediaType, startAt: c.startAt ?? 0,
      onLoaded: () => log('onLoaded'), onFailed: (r) => log('onFailed', r) });
    act(node);
    log('--detach');
    detach();
    mock.timers.tick(20000);
    mock.timers.reset();
    out[`${JSON.stringify(c)} ${name}`] = trace;
  }
  return out;
}
const a = await run(oldRoot), b = await run(newRoot);
let differ = 0;
const branches = {};
for (const k of Object.keys(a)) {
  const same = JSON.stringify(a[k]) === JSON.stringify(b[k]);
  if (!same) { differ++; console.log('DIFFERS', k, '\n  old', JSON.stringify(a[k]), '\n  new', JSON.stringify(b[k])); }
  if (k.endsWith(' nothing')) {
    const t = a[k]; const br = t.some((e) => e[0] === 'Hls.new') ? 'hls.js' : t.some((e) => e[0] === 'node.on' && e[1] === 'load') ? 'image' : 'progressive';
    branches[k.replace(/ nothing$/, '')] = br;
  }
}
for (const [k, v] of Object.entries(branches)) console.log(`branch ${v.padEnd(11)} ${k}`);
console.log(`${Object.keys(a).length} runs (${cases.length} inputs x ${SCENARIOS.length} scenarios), ${differ} differ`);
process.exit(differ ? 1 : 0);
