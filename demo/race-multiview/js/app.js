// app.js -- the page of the race-multiview demo.
//
// IT IS THE MINIMUM THE DEMO NEEDS TO RUN, and marking that is the point of this comment.
// The block fenced below is WHAT AN INTEGRATOR WRITES and it is the whole of the plumbing:
// the library arrives as a <script src> that defines a global, the page builds its own
// hls.js instance with the one configuration the library hands over, and turns the
// concurrent experience on over a container. Six lines, and the multi view is in none of
// them -- it is on because the playlist signals it.
//
// The opening, the two scroll sections that draw themselves off the contract, the credits
// and the brand belong to the task that writes the page. What is here besides the six lines
// is the state line, and it is here rather than there because it is the instrument this
// task is verified with: what the contract says is on screen, and how many <video> elements
// are really inside the container. A grid of two is two decoders and not one composed
// picture, and that is the one claim the contract cannot make.
//
// The page never writes: it does not tick a row, it does not raise a feed and it does not
// leave. Those are the viewer's, which is the whole of what this demo is about.

// The signalled playlist: the same segments as the programme plus the one Date Range of the
// offer, written by scripts/senalizar-contenido.sh on every start. Its START-DATE is
// resolved against the playlist's own EXT-X-PROGRAM-DATE-TIME, so it cannot be a file in
// git: the clock moves every time the content is packaged.
const SRC = './content/primary/con-daterange.m3u8';

const video = document.getElementById('video');
const hud = document.getElementById('hud');
const state = document.getElementById('state');

// ===========================================================================
// WHAT AN INTEGRATOR WRITES  (with the <script src> and the container of index.html).
const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });
const concurrent = QualabsConcurrentHls.attach(hls, {
  container: document.getElementById('player')
});
hls.loadSource(SRC);
hls.attachMedia(video);
// ===========================================================================

// Muted, so the autoplay policy lets the page start without a click. The audio control the
// library draws at the top right of the picture is the one that lifts it, and lifting it
// once at the start is the first step of the run: this demo is watched by ear -- the
// commentators announce the window, and enlarging a camera silences them.
video.muted = true;

hls.on(Hls.Events.ERROR, (_e, d) => {
  console.error('[hls] error', d.type, d.details, 'fatal:', d.fatal);
  if (d.fatal) hud.textContent = `error: ${d.details}`;
});
hls.on(Hls.Events.MANIFEST_PARSED, () => {
  hud.textContent = `hls.js ${Hls.version} · playing ${SRC}`;
});

// IT STARTS WHEN THE PICTURE IS ON SCREEN AND NOT WHEN THE PAGE LOADS, which is what the
// other demos do and what the page of the next task needs: a programme that started while
// the reader was still scrolling an opening would spend that time playing to nobody. Sixty
// per cent of the player visible is the threshold.
const watching = new IntersectionObserver((entries) => {
  if (!entries.some((entry) => entry.isIntersecting)) return;
  watching.disconnect();
  video.play().catch(() => {});
}, { threshold: 0.6 });
watching.observe(document.getElementById('player'));

/** The names the selector lists, read off its rows: the feeds AND the programme. */
const namesOf = (rows) => new Map(rows.map((row) => [row.id, row.name]));

/** Whether an experience is an offer, by the one field an offer has and an ad has not. */
const isOffer = (experience) => Array.isArray(experience?.views);

/** What is on screen, in the contract's own terms. */
function onScreen(active, names) {
  if (!active.length) return 'the programme, nothing signalled';
  return active
    .map((experience) => {
      if (!isOffer(experience)) return `ad on screen: ${experience.type}`;
      if (!experience.elements.length) {
        return `multi view offered · ${experience.views.length} feed(s) · nothing raised`;
      }
      const top = experience.elements[experience.elements.length - 1];
      const full = Object.values(top.box).every((inset) => inset === 0)
        ? ` · ${names.get(top.id) ?? top.id} at full frame`
        : '';
      return `multi view · ${experience.elements.length} boxes${full}`;
    })
    .join('  |  ');
}

/** The decoders, off the DOM of the container and nothing else. */
function decoders(container) {
  const nodes = [...container.querySelectorAll('video')];
  const playing = nodes.filter((n) => n.readyState >= 2 && !n.paused && !n.ended);
  return `${nodes.length} video element${nodes.length === 1 ? '' : 's'} in the player, ` +
    `${playing.length} decoding`;
}

const provider = concurrent.provider;
const tick = () => {
  const time = video.currentTime || 0;
  const active = provider.activeAt(time) ?? [];
  const offer = provider.offerAt(time);
  const names = namesOf(offer ? provider.rows(offer) : []);
  state.textContent =
    `t=${time.toFixed(1)}s  ·  ${onScreen(active, names)}  ·  ${decoders(concurrent.container)}`;
  requestAnimationFrame(tick);
};
requestAnimationFrame(tick);

// For the console and for whoever comes next.
window.demo = {
  hls,
  video,
  concurrent,
  provider,
  get renderer() { return concurrent.renderer; },
  get layer() { return concurrent.layer; }
};
