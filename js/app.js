// app.js -- the page of this demo, which is two things at once and marks which
// is which.
//
// The first is WHAT AN INTEGRATOR WRITES, and it is the block fenced below: the
// library arrives as a <script src> that defines a global, the page builds its
// own hls.js instance with the one configuration the library hands over, and
// turns the concurrent experience on over a container. That is the surface of
// ADR 0015, and the fence is there so it can be counted.
//
// The second is everything this page adds to make its own argument, and none of
// it is plumbing the library needs: the off-the-shelf player of the
// compatibility pair, the trace of the contract under the player and in the
// console, and the label of the demo pane.
//
// The seam of ADR 0003 now lives INSIDE the library, together with the piece
// that turns a `uri` into pixels. What crosses out of it is the contract --
// `provider.activeAt(time)` and nothing else -- which is what the two consumers
// on this page read.

import { traceContract } from './contract-trace.js';
import { createStockPlayer } from './stock-player.js';

// The signalled playlist: the same segments as ./content/primary/index.m3u8
// plus the two Date Ranges, written by scripts/senalizar-contenido.sh on every
// start. Its START-DATE is computed from the playlist's own
// EXT-X-PROGRAM-DATE-TIME, so it cannot be a file in git: the clock moves every
// time the content is packaged.
const SRC = './content/primary/con-daterange.m3u8';

const video = document.getElementById('video');
const hud = document.getElementById('hud');
const contractHud = document.getElementById('contract');

/**
 * This page's own console trace of the resolution, printed as each asset-list
 * comes back. It is passed to the library as an optional hook and nothing
 * depends on it: an integrator who does not want it does not pass it.
 */
function logResolved(experiences) {
  for (const e of experiences) {
    console.log(`[app] resolved ${e.type}#${e.id}: ${e.elements.length} elements,` +
      ` window ${e.startTime.toFixed(2)}s -> ${(e.startTime + e.duration).toFixed(2)}s`);
  }
}

// ===========================================================================
// WHAT AN INTEGRATOR WRITES  (with the <script src> of index.html:116 and the
// container of index.html:93). Everything between the two fences exists because
// the library exists; the rest of this file exists because this page is a
// compatibility demo.
const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });
const concurrent = QualabsConcurrentHls.attach(hls, {
  container: document.getElementById('player'),
  audioControl: document.getElementById('ad-audio'),
  onResolved: logResolved
});
hls.loadSource(SRC);
hls.attachMedia(video);
// ===========================================================================

// The contract, printed: the line of text under the player and the table in the
// console, which is what makes a recording auditable. It reads exactly what the
// renderer inside the library reads, and neither knows about the other.
const consumer = traceContract({ provider: concurrent.provider, video, hud: contractHud });

hls.on(Hls.Events.ERROR, (_e, d) => {
  console.error('[hls] error', d.type, d.details, 'fatal:', d.fatal);
  if (d.fatal) say(`error: ${d.details}`);
});

hls.on(Hls.Events.MANIFEST_PARSED, () => {
  // The check is cheap and it is the whole point of the configuration above, so
  // it is on the page rather than in a comment. The library makes the same
  // reading when it is attached, and says so in the console if it comes out the
  // other way.
  const off = hls.interstitialsManager === null || hls.interstitialsManager === undefined;
  say(`hls.js ${Hls.version} · interstitials manager: ${off ? 'none' : 'PRESENT'} · playing ${SRC}`);
});

function say(text) { hud.textContent = text; }

// Muted, so the autoplay policy lets the recording start without a click. The
// native controls are right there to turn the sound on.
video.muted = true;
video.play().catch(() => {});

// The other half of the compatibility pair (ADR 0007): a client that is already
// in the market, on the SAME playlist -- `SRC`, the same constant, which is the
// whole argument -- and with none of the above wired into it. It schedules the
// linear ad of the Apple-class Date Range and replaces the content with it,
// while the player above keeps the content and draws the concurrent experience
// over it. Neither instance knows the other exists.
const stock = createStockPlayer({
  video: document.getElementById('stock-video'),
  src: SRC,
  pane: document.getElementById('pane-stock'),
  state: document.getElementById('stock-state'),
  hud: document.getElementById('stock-hud')
});

// The demo pane's own label, the mirror of the one the stock player paints for
// itself. It is here and not in the library because it is the page talking
// about the page, and reading it takes the contract -- which is `activeAt` and
// nothing else, the same thing every consumer of the seam gets.
const demoPane = document.getElementById('pane-demo');
const demoState = document.getElementById('demo-state');
function paintDemoPane() {
  const active = concurrent.provider.activeAt(video.currentTime);
  demoPane.dataset.state = active.length ? 'ad' : 'primary';
  demoState.textContent = active.length
    ? `primary content + CONCURRENT AD (${active.map((e) => e.type).join(', ')})` +
      ` · ${video.currentTime.toFixed(1)}s · nothing was replaced`
    : `primary content · ${video.currentTime.toFixed(1)}s`;
}
video.addEventListener('timeupdate', paintDemoPane);
paintDemoPane();

// For the console and for whoever comes next.
window.demo = {
  hls,
  video,
  concurrent,
  provider: concurrent.provider,
  get renderer() { return concurrent.renderer; },
  get layer() { return concurrent.layer; },
  consumer,
  stock
};
