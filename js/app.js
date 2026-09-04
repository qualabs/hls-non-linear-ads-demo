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
const consumer = traceContract({ provider, video, hud: contractHud });

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

// For the console and for whoever comes next.
window.demo = { hls, video, provider, consumer };
