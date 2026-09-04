// app.js -- the wiring, and only the wiring: it creates the hls.js instance,
// hands it to the signalling layer, and hands the signalling layer's contract
// to whoever consumes it. It is the one file allowed to know both sides,
// because somebody has to join them (ADR 0003).
//
// The one thing that IS a decision and not plumbing is the config. The
// interstitials machinery of hls.js is closed over Apple's class: the only
// place a DATERANGE becomes an interstitial asks `if (dateRange.isInterstitial)`
// and that getter is `this.class === 'com.apple.hls.interstitial'`, a module
// constant with no configuration. So a Date Range of our own class would never
// reach it, and the machinery is one of REPLACEMENT anyway -- it hands the same
// MediaSource back and forth between the primary and the asset, which is the
// opposite of drawing two sources at once.
//
// Passing `interstitialsController: undefined` turns it off, because hls.js
// instantiates the controller only if that config value is truthy. The tags are
// NOT lost: the parser keeps every DATERANGE without filtering by class, and
// they arrive on LEVEL_UPDATED as `details.dateRanges` -- which is where the
// signalling layer of T-06 picks them up. All of this is ADR 0002, and T-02
// verified on this same version that the instance ends up with no interstitials
// manager and asks for no asset-list of its own.
//
// hls.js is UNMODIFIED, at 1.7.2, vendored on disk.

import { createSignalling } from './signalling.js';
import { traceContract } from './contract-trace.js';
import { createRenderer } from './renderer.js';
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

const hls = new Hls({ interstitialsController: undefined });

// The two layers, and the seam between them. The signalling layer gets the
// hls.js instance; the consumer gets `provider`, which is `activeAt(time)` and
// nothing else.
const provider = createSignalling(hls, {
  onResolved: (experiences) => {
    for (const e of experiences) {
      console.log(`[app] resolved ${e.type}#${e.id}: ${e.elements.length} elements,` +
        ` window ${e.startTime.toFixed(2)}s -> ${(e.startTime + e.duration).toFixed(2)}s`);
    }
  }
});
// Two consumers of the same contract, and neither knows about the other. The
// renderer draws; the trace of T-06 keeps the line of text under the player and
// the table in the console, which is what makes a recording auditable.
const renderer = createRenderer({
  provider,
  video,
  layer: document.getElementById('ads'),
  audioControl: document.getElementById('ad-audio'),
  attachAsset
});
const consumer = traceContract({ provider, video, hud: contractHud });

/**
 * How a `uri` of the contract becomes pixels. It lives HERE, on the side that
 * is allowed to know the player library, and the renderer receives it as a
 * function: it asks for the asset to be attached to a node and gets back a way
 * to detach it, without importing anything or knowing what a media playlist
 * is. A second hls.js instance is what T-01 measured -- several elements, each
 * with its own instance, play at the same time.
 */
function attachAsset(node, { uri, mediaType, startAt = 0 }) {
  const isHls = /mpegurl/i.test(mediaType || '') || /\.m3u8($|\?)/i.test(uri);
  if (!isHls) {
    node.src = uri;
    if (startAt > 0) node.currentTime = startAt;
    return () => { node.removeAttribute('src'); node.load(); };
  }
  const adHls = new Hls({ interstitialsController: undefined, startPosition: startAt });
  adHls.loadSource(uri);
  adHls.attachMedia(node);
  return () => adHls.destroy();
}

hls.on(Hls.Events.ERROR, (_e, d) => {
  console.error('[hls] error', d.type, d.details, 'fatal:', d.fatal);
  if (d.fatal) say(`error: ${d.details}`);
});

hls.on(Hls.Events.MANIFEST_PARSED, () => {
  // The check is cheap and it is the whole point of the configuration above,
  // so it is on the page rather than in a comment.
  const off = hls.interstitialsManager === null || hls.interstitialsManager === undefined;
  say(`hls.js ${Hls.version} · interstitials manager: ${off ? 'none' : 'PRESENT'} · playing ${SRC}`);
});

function say(text) { hud.textContent = text; }

hls.loadSource(SRC);
hls.attachMedia(video);

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
// itself. It is here and not in the renderer because it is the page talking
// about the page, and reading it takes the contract -- which is `activeAt` and
// nothing else, the same thing every consumer of the seam gets.
const demoPane = document.getElementById('pane-demo');
const demoState = document.getElementById('demo-state');
function paintDemoPane() {
  const active = provider.activeAt(video.currentTime);
  demoPane.dataset.state = active.length ? 'ad' : 'primary';
  demoState.textContent = active.length
    ? `primary content + CONCURRENT AD (${active.map((e) => e.type).join(', ')})` +
      ` · ${video.currentTime.toFixed(1)}s · nothing was replaced`
    : `primary content · ${video.currentTime.toFixed(1)}s`;
}
video.addEventListener('timeupdate', paintDemoPane);
paintDemoPane();

// For the console and for whoever comes next.
window.demo = { hls, video, provider, consumer, renderer, stock };
