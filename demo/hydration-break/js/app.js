// app.js -- the page of the hydration-break demo.
//
// It is two things and it marks which is which. The first is WHAT AN INTEGRATOR
// WRITES, and it is the block fenced below: the library arrives as a
// <script src> that defines a global, the page builds its own hls.js instance
// with the one configuration the library hands over, and turns the concurrent
// experience on over a container. Everything else on this page exists because
// this page is making an argument, and none of it is plumbing the library needs.
//
// What crosses out of the library is the contract -- `provider.activeAt(time)`
// and `provider.programRanges()` -- and nothing else.

import { runStory } from './story.js';

// The signalled playlist: the same segments as the plate plus one Date Range,
// written by scripts/senalizar-contenido.sh on every start. Its START-DATE is
// computed from the playlist's own EXT-X-PROGRAM-DATE-TIME, so it cannot be a
// file in git: the clock moves every time the content is packaged.
const SRC = './content/primary/con-daterange.m3u8';

const video = document.getElementById('video');
const state = document.getElementById('state');
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

hls.on(Hls.Events.ERROR, (_e, d) => {
  console.error('[hls] error', d.type, d.details, 'fatal:', d.fatal);
  if (d.fatal) hud.textContent = `error: ${d.details}`;
});

hls.on(Hls.Events.MANIFEST_PARSED, () => {
  hud.textContent = `hls.js ${Hls.version} · playing ${SRC}`;
});

// Muted, so the autoplay policy lets the page start without a click. The audio
// control the library draws at the top right of the picture is the one that
// lifts it, and lifting it once at the start is a step of the run.
//
// AND THE PAGE DOES NOT PRESS PLAY: the walkthrough does, when its opening card
// goes (ADR 0039). Pressing it here as well showed the first seconds of the
// match before the card that says what is about to happen, which is the one
// thing the opening card exists to prevent. If the walkthrough cannot start, the
// handler at the bottom of this file presses it instead, so a broken story never
// costs the demo its player.
video.muted = true;

/**
 * THE STATE LINE, read off the contract and off nothing else.
 *
 * It says what is on screen right now, and it exists for the same reason the
 * page cannot lie: somebody watching has to be able to check that the ad they
 * are looking at is the ad the signalling declared. `activeAt` carries the type
 * of the layout and the MIME of every element, so the line can say whether the
 * ad on screen is a video or a still without the page knowing anything about
 * the asset-list.
 */
function shape(experience) {
  const assets = experience.elements.filter((e) => !e.primary);
  if (!assets.length) return experience.type;
  const stills = assets.every((e) => /^image\//i.test(e.mediaType || ''));
  return `${experience.type} · ${stills ? 'still image' : 'video'}`;
}

/**
 * The one moment of the minute where "nothing was replaced" reads backwards: the
 * linear ad, at full frame, with the programme still running underneath it. The
 * sentence is literally true there -- the primary was never stopped -- but
 * somebody watching a covered screen reads it as the opposite.
 *
 * So the line says the same thing the other way round when an element of the ad
 * COVERS the primary content. It is read off the contract and not off the type
 * of the ad: a covering ad is a box and a zDepth, and any layout that ever
 * declares one gets the same line without this page learning about it.
 */
function covering(active) {
  for (const experience of active) {
    const primary = experience.elements.find((e) => e.primary);
    if (!primary) continue;
    const over = experience.elements.some(
      (e) => !e.primary && e.zDepth > primary.zDepth && Object.values(e.box).every((v) => v === 0)
    );
    if (over) return true;
  }
  return false;
}

function paint() {
  const active = concurrent.provider.activeAt(video.currentTime);
  const t = video.currentTime.toFixed(1);
  state.textContent = active.length
    ? `${t}s · ad on screen: ${active.map(shape).join(', ')} · ` +
      (covering(active) ? 'the match is underneath, covered' : 'the match is still playing')
    : `${t}s · the match, no ad`;
}
video.addEventListener('timeupdate', paint);
paint();

// THE GUIDED RUN STARTS BY ITSELF, and that is the decision and not an
// oversight: somebody who opens this link from an email does not know there is a
// button, and without the walkthrough the business case is the thing they miss.
// One state and not two pages -- when it ends, the player is theirs.
runStory({
  provider: concurrent.provider,
  video,
  card: document.getElementById('card'),
  skip: document.getElementById('skip')
}).catch((error) => {
  // A walkthrough that cannot load is not a reason to lose the demo: the player
  // keeps playing and the console says what happened.
  console.error('[story] the walkthrough did not start, the player carries on', error);
  document.body.dataset.story = 'done';
  video.play().catch(() => {});
});

// For the console and for whoever comes next.
window.demo = {
  hls,
  video,
  concurrent,
  provider: concurrent.provider,
  get renderer() { return concurrent.renderer; },
  get layer() { return concurrent.layer; }
};
