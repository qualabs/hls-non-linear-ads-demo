// app.js -- the page of the multiview-offer demo.
//
// It is two things and it marks which is which. The first is WHAT AN INTEGRATOR
// WRITES, and it is the block fenced below: the library arrives as a
// <script src> that defines a global, the page builds its own hls.js instance
// with the one configuration the library hands over, and turns the concurrent
// experience on over a container. Six lines, and the multi view is in none of
// them -- it is on because the playlist signals it, and a playlist that signals
// no offer comes out exactly as it did before any of this existed.
//
// Everything else on this page exists because this page is making an argument,
// and none of it is plumbing the library needs.
//
// What crosses out of the library is the contract -- `provider.activeAt(time)`
// and `provider.programRanges()` -- plus the two reads of the handle that only
// exist because there is somebody choosing: `offerAt(time)` and `rows(offer)`.
// The page never writes: it does not tick a row, it does not raise a feed and it
// does not leave. Those are the viewer's, which is the whole of what this demo
// is about, and a page that did them on his behalf would be arguing the
// opposite.

import { runOpening } from './opening.js';
import { showTheRun } from './recorrido.js';
import { showWhatIsAnnounced } from './contrato.js';
import { showSignalling } from './senalizacion.js';

// The signalled playlist: the same segments as the primary plus one Date Range
// per break, written by scripts/senalizar-contenido.sh on every start. Its
// START-DATE is resolved against the playlist's own EXT-X-PROGRAM-DATE-TIME, so
// it cannot be a file in git: the clock moves every time the content is packaged.
const SRC = './content/primary/con-daterange.m3u8';

const video = document.getElementById('video');
const hud = document.getElementById('hud');

// ===========================================================================
// WHAT AN INTEGRATOR WRITES  (with the <script src> and the container of
// index.html).
const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });
const concurrent = QualabsConcurrentHls.attach(hls, {
  container: document.getElementById('player')
});
hls.loadSource(SRC);
hls.attachMedia(video);
// ===========================================================================

// Muted, so the autoplay policy lets the page start without a click. The audio
// control the library draws at the top right of the picture is the one that
// lifts it, and lifting it once at the start is the first step of the run: an
// offer opens with the programme sounding and every feed silent, and that is a
// mix nobody can hear on a muted page.
video.muted = true;

hls.on(Hls.Events.ERROR, (_e, d) => {
  console.error('[hls] error', d.type, d.details, 'fatal:', d.fatal);
  if (d.fatal) hud.textContent = `error: ${d.details}`;
});
hls.on(Hls.Events.MANIFEST_PARSED, () => {
  hud.textContent = `hls.js ${Hls.version} · playing ${SRC}`;
});

// IT STARTS WHEN THE PICTURE IS ON SCREEN AND NOT WHEN THE PAGE LOADS. The run
// is 180 seconds with two windows in it, and the first of them opens at 45: a
// programme that started while the reader was still scrolling the opening would
// spend that time playing to nobody. Sixty per cent of the player visible is the
// threshold, so a pixel showing at the bottom of the fold is not enough.
//
// Somebody who stays up top reading never starts it, and that is the intent
// rather than a defect.
const watching = new IntersectionObserver((entries) => {
  if (!entries.some((entry) => entry.isIntersecting)) return;
  watching.disconnect();
  video.play().catch(() => {});
}, { threshold: 0.6 });
watching.observe(document.getElementById('player'));

runOpening(document.getElementById('opening'));

showTheRun({
  provider: concurrent.provider,
  container: concurrent.container,
  video,
  state: document.getElementById('state'),
  run: document.getElementById('run')
});

showWhatIsAnnounced({
  provider: concurrent.provider,
  video,
  cards: document.getElementById('announces'),
  fields: document.getElementById('fields'),
  shapes: document.getElementById('shapes'),
  wayout: document.getElementById('wayout')
});

showSignalling({
  src: SRC,
  provider: concurrent.provider,
  video,
  tags: document.getElementById('tags'),
  payload: document.getElementById('payload'),
  assets: document.getElementById('assets')
});

// For the console and for whoever comes next. The four decoders of a full grid
// are read off `concurrent.container.querySelectorAll('video')`, which is what
// the line under the player already does once per frame.
window.demo = {
  hls,
  video,
  concurrent,
  provider: concurrent.provider,
  get renderer() { return concurrent.renderer; },
  get layer() { return concurrent.layer; }
};
