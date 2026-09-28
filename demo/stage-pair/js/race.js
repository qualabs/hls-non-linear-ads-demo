// race.js -- the third page of this demo: the race, the non-linear ads over it,
// and the multi view window that opens after them.
//
// This file is two things and it marks which is which.
//
// THE FIRST IS WHAT AN INTEGRATOR WRITES, and it is the block fenced below: the
// library arrives as a <script src> that defines a global, the page builds its
// own hls.js instance with the one configuration the library hands over, and
// turns the concurrent experience on over a container. FIVE LINES, AND THE
// MULTI VIEW IS IN NONE OF THEM -- the window is on because the playlist
// signals it, and a playlist that signals no offer comes out of these same five
// lines as an ordinary player. That is the whole of ADR 0072 seen from the
// outside, and it is why this page's block is SHORTER than `js/app.js`'s: this
// one has no `capabilities`, because the switch belongs to the pair.
//
// THE SECOND IS THE ARGUMENT OF THE PAGE, and none of it is plumbing the library
// needs: the line under the picture, the run beside it, and the jumps.
//
// ============================================================================
// WHAT THE PAGE READS, AND WHAT IT NEVER WRITES
// ============================================================================
// It reads the contract of ADR 0003 -- `activeAt(time)` and `programRanges()`
// -- plus the two reads of the decorated provider that only exist because there
// is somebody choosing: `offerAt(time)` and `rows(offer)`.
//
// IT NEVER WRITES. It does not tick a row, it does not raise a camera and it
// does not enlarge one. Those are the viewer's, and a page that did them on his
// behalf would be arguing the opposite of what the window is for. The selector
// and the button on each box are the library's chrome (ADR 0015, ADR 0067), and
// this page adds no control of its own over the picture.
//
// AND IT PROMISES NO AUDIO. Everything this page plays is mute by decision: the
// programme and the six cameras are captured out of an SVG scene, which has no
// sound, and nothing was added in the capture. The focus of audio (ADR 0027)
// still works -- the feeds are boxes of video, which is what can take it -- so
// the mechanism is there; there is simply nothing to hear, and no caption here
// says otherwise.
//
// No bundler and no framework: native ES modules, hls.js vendored at the version
// the measurements ran on.

// The one source of the numbers of this demo (ADR 0044). The seconds of the four
// ads, the second the window opens and the six cameras all come from here; not
// one of them is typed in this file.
const stage = await (await fetch('/stage.json')).json();
const carrera = stage.carrera;

// The signalled playlist of the race: the same segments as the programme plus
// the five Date Ranges, written by scripts/senalizar-carrera.sh on every start.
// Its START-DATE is resolved against the playlist's own
// EXT-X-PROGRAM-DATE-TIME, so it cannot be a file in git: that clock moves every
// time the content is packaged (ADR 0005).
const SRC = `/${carrera.playlist}`;

const video = document.getElementById('video');
const player = document.getElementById('player');
const state = document.getElementById('state');
const hud = document.getElementById('hud');
const run = document.getElementById('run');

// ===========================================================================
// WHAT AN INTEGRATOR WRITES  (with the <script src> and the container of race.html).
const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });
const concurrent = QualabsConcurrentHls.attach(hls, {
  container: player,
  onResolved: (experiences) => {
    for (const e of experiences) {
      console.log(`[race] resolved ${e.type}#${e.itemId}: ${e.elements.length} elements,` +
        ` window ${e.startTime.toFixed(2)}s -> ${(e.startTime + e.duration).toFixed(2)}s`);
    }
  }
});
hls.loadSource(SRC);
hls.attachMedia(video);
// ===========================================================================

// Muted, so the autoplay policy lets the run begin without a click. It is not
// the usual concession here: there is nothing to unmute.
video.muted = true;
video.play().catch(() => {});

hls.on(Hls.Events.ERROR, (_e, d) => {
  console.error('[hls] error', d.type, d.details, 'fatal:', d.fatal);
  if (d.fatal) hud.textContent = `error: ${d.details}`;
});
hls.on(Hls.Events.MANIFEST_PARSED, () => {
  const off = hls.interstitialsManager == null;
  hud.textContent =
    `hls.js ${Hls.version} · interstitials manager: ${off ? 'none' : 'PRESENT'} · ` +
    `playing ${SRC} · everything on this page is mute`;
});

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

const secs = (value) => `${Number(value).toFixed(1)} s`;

/** Whether an experience is an offer, by the one field an offer has and an ad has not. */
const isOffer = (experience) => Array.isArray(experience?.views);

/** `id` -> the name it is listed by, off the rows of the selector and not translated here. */
const namesOf = (rows) => new Map(rows.map((row) => [row.id, row.name]));

// ===========================================================================
// THE LINE UNDER THE PICTURE
// ===========================================================================
// Its left half is the contract at the playhead. Its right half is the DOM --
// how many <video> elements live inside the container the library was handed,
// and how many of them have a picture -- and it is there because that is the one
// claim this page has no other way to support: that a world feed and three car
// cameras on screen are four decoders and not one composed picture shipped as a
// single stream. It is the same reading `demo/race-multiview/` took as its
// instrument, so a capture of either page can be read against the other.

function onScreen(active, names) {
  if (!active.length) return 'the race, nothing signalled';
  return active
    .map((experience) => {
      if (!isOffer(experience)) {
        return `NON-LINEAR AD on the race: ${experience.type} · nothing was replaced`;
      }
      if (!experience.elements.length) {
        return `multi view offered · ${experience.views.length} camera(s) · nothing raised`;
      }
      // `elements` arrives ascending by `zDepth`, so the last one is on top: in a
      // composition of more than one box, a top element whose four insets are all
      // zero is covering everything under it.
      const top = experience.elements[experience.elements.length - 1];
      const full = Object.values(top.box).every((inset) => inset === 0)
        ? ` · ${names.get(top.id) ?? top.id} at full frame`
        : '';
      return `multi view · ${experience.elements.length} boxes${full}`;
    })
    .join('  |  ');
}

/**
 * The decoders, off the DOM of the container and nothing else.
 *
 * `readyState >= 2` is HAVE_CURRENT_DATA, which is the honest floor for "this
 * element has a picture in it": a grid that was just composed has cameras still
 * buffering, and calling those decoding would be the page flattering itself.
 */
function decoders() {
  const nodes = [...concurrent.container.querySelectorAll('video')];
  const playing = nodes.filter((n) => n.readyState >= 2 && !n.paused && !n.ended);
  return `${nodes.length} video element${nodes.length === 1 ? '' : 's'} in the player, ` +
    `${playing.length} decoding`;
}

// ===========================================================================
// THE RUN, BESIDE THE PICTURE
// ===========================================================================
// Every row is a range of `programRanges()`, so the order on screen is the order
// on the timeline and THAT is the argument of this page: four ads of the
// concurrent class, and after them one window of the multi view class. They are
// two sibling classes and not one extending the other (ADR 0063), and here the
// difference is visible without reading a playlist -- the rows say which kind
// each one is, and the kinds do not interleave.
//
// The names of the cameras are the rows of the selector and not a list typed
// here: a catalogue somebody chooses from cannot be a list of identifiers, so a
// page that turned an id into a readable word by itself would be papering over
// the thing the window is here to show.

function rowOf(range, experience, names) {
  const node = el('li', 'run__row');
  node.dataset.id = range.id;
  node.append(
    el('span', 'run__when', `${secs(range.startTime)} – ${secs(range.startTime + range.duration)}`),
    el('span', 'run__kind', range.kind)
  );
  const what = el('div', 'run__what');
  if (!isOffer(experience)) {
    what.append(el('p', null,
      'An ad, composed by whoever published it: the boxes arrived declared in the ' +
      'asset-list, so there is nothing to choose and the race never stopped to show it.'));
  } else {
    const count = experience.views.length;
    what.append(el('p', null,
      `A catalogue of ${count} camera${count === 1 ? '' : 's'}, and the race carries on ` +
      'underneath it. Open the list in the bar and tick a driver: the grid takes its shape ' +
      'from how many are up, and the world feed is one of them and not a backdrop. Enlarge ' +
      'a box and you are inside that car.'));
    const list = el('ul', 'run__names');
    for (const view of experience.views) {
      list.append(el('li', null, names.get(view.id) ?? view.name));
    }
    what.append(list);
    what.append(el('p', 'run__more',
      'When the grid is full the rows that are not up go grey, with a line in the bar ' +
      'saying why. The cap is of the grid and never of the offer: this catalogue is longer ' +
      'than what fits at once, which is what makes choosing mean something.'));
  }
  node.append(what);
  return node;
}

let drawnKey = null;

function drawRun(names) {
  const { ranges } = concurrent.provider.programRanges();
  // Rebuilt only when the SET of ranges changes. They arrive as each asset-list
  // resolves, so the list fills during the first seconds and then stops;
  // comparing the key is what keeps this out of the frame loop's way.
  const key = ranges.map((range) => range.id).join('|');
  if (key !== drawnKey) {
    drawnKey = key;
    const byId = new Map(concurrent.provider.experiences.map((e) => [e.id, e]));
    run.replaceChildren(...ranges.map((range) => rowOf(range, byId.get(range.id), names)));
  }
  return ranges;
}

function paint() {
  const time = video.currentTime || 0;
  const active = concurrent.provider.activeAt(time) ?? [];
  const offer = concurrent.provider.offerAt(time);
  const names = namesOf(offer ? concurrent.provider.rows(offer) : []);

  player.dataset.state = active.length ? (offer ? 'multiview' : 'ad') : 'primary';
  state.textContent = `t=${time.toFixed(1)}s  ·  ${onScreen(active, names)}  ·  ${decoders()}`;

  const ranges = drawRun(names);
  for (const row of run.children) {
    const range = ranges.find((r) => r.id === row.dataset.id);
    row.classList.toggle('run__row--open',
      !!range && time >= range.startTime && time < range.startTime + range.duration);
    row.classList.toggle('run__row--past', !!range && time >= range.startTime + range.duration);
  }
  requestAnimationFrame(paint);
}

// A FRAME LOOP AND NOT `timeupdate`: a viewer ticks two cameras inside one of
// the quarter seconds `timeupdate` fires at, and a line that lagged behind the
// picture by a beat would be read as the picture being wrong.
requestAnimationFrame(paint);

// ===========================================================================
// THE JUMPS
// ===========================================================================
// There are about two minutes for everything at the event and the window opens
// at fifty-six seconds, so every moment of this page has a button. Four seconds
// of race before each ad, because what is worth seeing is the transition INTO
// the ad and not the ad already on screen; the window gets the same lead-in.
//
// A JUMP IS A SEEK AND NOT A REBUILD, which is the one place this page is
// simpler than the pair. There the switch had to tear both players down because
// `capabilities` is read once when the signalling is created; here there is one
// player, nothing to re-declare, and the experiences are already resolved.
const ENTRADA = 4;

function irA(segundo) {
  video.currentTime = Math.max(0.05, segundo);
  video.play().catch(() => {});
}

const jumps = document.getElementById('jumps');
jumps.replaceChildren(...[
  { texto: 'start', segundo: 0.05 },
  ...carrera.breaks.map((b) => ({
    texto: `ad ${b.id.toUpperCase()}`,
    segundo: b.offset - ENTRADA
  })),
  { texto: 'multi view', segundo: carrera.ofertaEn - ENTRADA }
].map(({ texto, segundo }) => {
  const boton = el('button', 'jump', texto);
  boton.type = 'button';
  boton.addEventListener('click', () => irA(segundo));
  return boton;
}));

// For the console, for the measurements of this task, and for whoever comes
// next. The instrument drives the page through this and through the chrome the
// library draws, never through a hook this page added for it.
window.race = {
  hls,
  video,
  concurrent,
  get provider() { return concurrent.provider; },
  get renderer() { return concurrent.renderer; },
  get layer() { return concurrent.layer; },
  get container() { return concurrent.container; },
  stage,
  src: SRC,
  irA
};
