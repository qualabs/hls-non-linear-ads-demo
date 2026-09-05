// controls.js -- the controls of the composition, which is the thing the
// library is dueño of and the page is not (ADR 0015).
//
// They command the WHOLE experience and not one of its elements. That is the
// difference from the native controls they replace: those are part of the video
// element, so they scale with the transform the renderer applies to it, and
// with more than one <video> on screen they command a piece and not the
// picture. Four of them, and the reference the layout follows: one progress bar
// at the very bottom, the play/pause centred over the composition, one audio
// control at the top right, and everything inside the frame.
//
// Nothing here knows where the boxes come from and nothing here knows what a
// transport is: it reads `currentTime`, `duration`, `paused` and `muted` off the
// element that plays the primary content, and it writes them back. The one thing
// it must never do is change the box the renderer measures -- see "the frame" in
// the comment on createControls.
//
// The bar also MARKS THE BREAKS, and that is the one thing here that is asked of
// somebody else: `provider.programRanges()`, which is the contract of ADR 0003
// and not the transport. What crosses is the KIND of each range -- 'concurrent'
// or 'interstitial' -- which the contract carries on purpose, because the two
// kinds are two colours and without the kind the bar can only paint one.
//
// That second value is named in this file five times: here, a colour, a lane
// and a tooltip. All five are on the accepted list of scripts/verificar-cortes.mjs
// with the reason each one is acceptable written beside it, and a sixth fires
// the check -- which is the point. The word is not free on this side of the seam.

/**
 * Above every element of every layout. The stacking order inside a layout is
 * the `zDepth` the payload declares, which is a third party's number, so the
 * controls do not sit "one above the highest one seen" -- they sit above the
 * range that number can take.
 *
 * The other half of the invariant is what this file does NOT do: it never
 * touches the layer the ads are drawn into, which stays without a `z-index` on
 * purpose so that it is not a stacking context and the `zDepth` of the layout
 * keeps deciding who is on top. There are layouts where the ad is the
 * background and the primary content goes over it, and closing that layer would
 * invert every one of them.
 */
export const CONTROLS_Z_INDEX = 2147483000;

/** How long the controls stay up after the last movement, while playing. */
export const CONTROLS_HIDE_MS = 2600;

/**
 * The two colours the bar marks a break with. They are FUNCTIONAL colours and
 * not brand ones -- the Qualabs kit is teal, orange, ink and paper, and neither
 * of these is in it (brand/README.md) -- for the same reason a warning light is
 * not a brand colour: what they have to do is be told apart.
 *
 * YELLOW IS THE TRADITIONAL ONE, because that is the colour Apple's own players
 * mark it with, so it arrives already read. VIOLET IS THE CONCURRENT ONE, which
 * has no convention to respect because it is the thing being shown for the
 * first time.
 *
 * Strong orange was the other candidate for the concurrent range and it is out
 * for a reason that is about this screen and not about taste: beside yellow it
 * stops being a different colour at a distance, and a progress bar gets read
 * from across a room. Both are values, and both are one line to change.
 */
export const RANGE_COLOURS = {
  concurrent: '#a273ff',
  interstitial: '#ffcc00'
};

/**
 * Which lane each kind of range is drawn in. The lane carries half of what the
 * colour says, and on this timeline it carries more than half.
 *
 * THE BAR MARKS BOTH KINDS. The same playlist signals two ranges on every
 * break, this player draws one of them and ignores the other, and a bar that
 * marked only what this player draws would go silent about a break that a
 * client already in the market does take -- which is the thing the two ranges
 * are on the playlist to show: one playlist, two clients, neither aware of the
 * other.
 *
 * AND THEY GO IN DIFFERENT LANES, which is what keeps the second colour from
 * being a decoration. The two ranges of a break start at the same second and
 * last the same time, so drawn one over the other they would add a colour and
 * no information. Split in two lanes they say which player each one belongs to,
 * without a word of text: what is ON the rail is what this player plays, and
 * the fill runs through it and the knob crosses it. What is in the lane
 * UNDERNEATH is what another client does with the same break, and no playhead
 * ever reaches it, because it is not this player's timeline.
 *
 * A full-width second rail under the first one was the other way to say it, and
 * it is out: David asked for one progress bar and a second rail reads as a
 * second progress bar, whatever it is drawn in.
 */
const RANGE_LANES = {
  concurrent: {
    under: false,
    className: 'qa-mark',
    title: 'concurrent ad: drawn over the content, which never stops'
  },
  interstitial: {
    under: true,
    className: 'qa-cue',
    title: 'traditional interstitial: where a client already in the market replaces the content'
  }
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

/**
 * Where a range of the programme sits on the bar: the left edge and the width,
 * both as percentages of the whole bar. `length` is the length of the
 * programme, which the caller RE-READS on every paint and never stores
 * (ADR 0016) -- that is why it is an argument and not a field of the range: the
 * contract deliberately does not carry it.
 *
 * `null` for a range that cannot be placed: no length yet, a length that is not
 * a number, a range of no width, or one that falls past the end. A mark that
 * cannot be placed is not drawn, which is the rule the signalling layer already
 * follows with a range it cannot measure.
 *
 * Pure and exported on purpose: it is the arithmetic of the markers, it is the
 * one thing here that can be wrong with nothing looking wrong, and it is what
 * the tests of T-06 aim at.
 */
export function rangeSpan(range, length) {
  if (!(length > 0)) return null;
  const from = clamp01(range.startTime / length);
  const to = clamp01((range.startTime + range.duration) / length);
  if (!(to > from)) return null;
  return { left: from * 100, width: (to - from) * 100 };
}

const CONTROLS_CSS = `
/* THE SIZES ARE TOKENS AND THERE IS ONE SET OF THEM PER SIZE OF SCREEN. The
 * chrome of a player is read from as far away as the picture is big, so a bar
 * that is right in a 715 px box is a thread on a 1920 px one: what changes in
 * fullscreen is not the layout but the scale of the furniture, and the class
 * that switches it is put on by the same function that paints the fullscreen
 * icon, because the two say the same thing.
 *
 * TWO OF THEM ARE NOT PRIVATE, and they are the theming of this library: the
 * integrator sets them on his container and the chrome takes them.
 *
 *   --qa-accent  the one colour that is his and not ours: the knob and the
 *                focus ring. It falls back to white, which is what a player
 *                with no brand looks like. It is deliberately NOT used on the
 *                marks of the bar, which are functional colours (see above).
 *   --qa-plate   the surface the logo sits on, light by default, because a
 *                logo over a picture needs a surface of its own -- recolouring
 *                it to suit the picture is how a brand gets broken.
 */
.qa-controls {
  position: absolute;
  inset: 0;
  z-index: ${CONTROLS_Z_INDEX};
  pointer-events: none;
  opacity: 0;
  transition: opacity 180ms ease;
  /* The typeface of the page it is embedded in. A player that arrives with a
   * font of its own looks like a third party's widget on somebody else's page,
   * and this library ships no font. */
  font-family: inherit;
  color: #fff;
  --qa-pad: 16px;
  --qa-icon: 34px;
  --qa-play: 74px;
  --qa-text: 13px;
  --qa-rail: 8px;
  --qa-logo: 22px;
  --qa-radius: 8px;
}
.qa-controls--full {
  --qa-pad: 30px;
  --qa-icon: 46px;
  --qa-play: 104px;
  --qa-text: 18px;
  --qa-rail: 10px;
  --qa-logo: 40px;
  --qa-radius: 10px;
}
.qa-controls--on { opacity: 1; }
/* Two scrims and not one. The bottom one is what makes the bar and the clock
 * legible over a bright picture; the top one is what lets the audio button be
 * an icon instead of a disc, and it is the reason the plate does not have to
 * carry a shadow big enough to be furniture of its own. */
.qa-controls__scrim {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 38%;
  background: linear-gradient(to top,
    rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.52) 26%, rgba(0,0,0,0.22) 58%, rgba(0,0,0,0) 100%);
}
.qa-controls__scrim--top {
  top: 0; bottom: auto;
  height: 22%;
  background: linear-gradient(to bottom,
    rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.24) 45%, rgba(0,0,0,0) 100%);
}
.qa-controls__top {
  position: absolute;
  top: var(--qa-pad); right: var(--qa-pad);
}
.qa-controls__centre {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}
.qa-controls__bar {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--qa-pad) * 0.55);
  padding: 0 var(--qa-pad) var(--qa-pad);
}
.qa-controls__row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: calc(var(--qa-pad) * 0.85);
}
/* THE MARK OF WHOEVER OWNS THE PICTURE, AND IT GOES IN THE BAR. It rides in
 * this layer and not in a corner of the page, so that it is in the frame in
 * fullscreen too -- which is the only frame a recording has -- and it comes and
 * goes with the rest of the furniture, so the picture is clean while it plays.
 *
 * A corner of the picture is where a channel bug goes and it is the one place
 * this player cannot use, because in this player the picture belongs to the
 * layout: a layout of four tiles has an element in all four corners, and there
 * are layouts whose ad IS the top left corner. A mark in a corner would sit on
 * top of the advertiser's creative, which is the one thing on screen that
 * somebody paid for. The bar is the strip the composition has already given up
 * to furniture, so the mark goes in it and costs the picture nothing new -- and
 * it goes in a row of its own so that it costs the progress bar no width
 * either, because the length of that bar is what a break is measured against.
 *
 * On a light surface and not recoloured: a wordmark is usually ink, and a dark
 * version of somebody's logo is a broken logo and not a variant. */
.qa-brand {
  display: flex;
  align-items: center;
  padding: calc(var(--qa-logo) * 0.30) calc(var(--qa-logo) * 0.42);
  border-radius: var(--qa-radius);
  background: var(--qa-plate, #f8f9fa);
  box-shadow: 0 2px 14px rgba(0,0,0,0.34);
}
.qa-brand img { display: block; height: var(--qa-logo); width: auto; }
.qa-btn {
  pointer-events: auto;
  display: grid;
  place-items: center;
  width: var(--qa-icon); height: var(--qa-icon);
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background-color 120ms ease, transform 120ms ease;
}
.qa-btn:hover { background: rgba(255,255,255,0.16); }
.qa-btn:active { transform: scale(0.94); }
.qa-btn:focus-visible { outline: 2px solid var(--qa-accent, #fff); outline-offset: 2px; }
.qa-btn svg {
  width: 60%; height: 60%;
  fill: currentColor;
  display: block;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.55));
}
.qa-btn--play {
  width: var(--qa-play); height: var(--qa-play);
  background: rgba(10,14,22,0.40);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
}
.qa-btn--play:hover { background: rgba(10,14,22,0.56); }
.qa-btn--play svg { width: 46%; height: 46%; }
.qa-time {
  font-variant-numeric: tabular-nums;
  font-size: var(--qa-text);
  font-weight: 500;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 3px rgba(0,0,0,0.7);
  /* So the bar does not shift by a digit as the clock runs. */
  min-width: 4ch;
}
.qa-time--total { text-align: right; }
/* The height is what the two lanes need and the arithmetic is the one thing
 * about it that is not free: half of what is left under the rail is the gap
 * plus the lane, so this expression keeps the lane of the cues exactly under
 * the rail at every size. */
.qa-track {
  pointer-events: auto;
  position: relative;
  flex: 1;
  height: calc(var(--qa-rail) * 3 + 6px);
  display: flex;
  align-items: center;
  cursor: pointer;
}
.qa-track__rail {
  position: relative;
  width: 100%;
  height: var(--qa-rail);
  border-radius: calc(var(--qa-rail) / 2);
  background: rgba(255,255,255,0.3);
}
.qa-track__fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 0;
  border-radius: calc(var(--qa-rail) / 2);
  background: #fff;
}
/* The breaks this player DRAWS: on the rail, and above the fill so that a break
 * already gone by is still on the map -- what a bar of five marks is for is
 * seeing the five of them at once, not only the ones still ahead. */
.qa-track__marks {
  position: absolute;
  inset: 0;
  border-radius: calc(var(--qa-rail) / 2);
  overflow: hidden;
  pointer-events: none;
}
.qa-mark {
  position: absolute;
  top: 0; bottom: 0;
  min-width: 2px;
  background: ${RANGE_COLOURS.concurrent};
}
/* The breaks another client takes: off the rail, in a lane of their own that
 * neither the fill nor the knob ever reaches. */
.qa-track__cues {
  position: absolute;
  left: 0; right: 0;
  top: calc(100% + 3px);
  height: var(--qa-rail);
  pointer-events: none;
}
.qa-cue {
  position: absolute;
  top: 0; bottom: 0;
  min-width: 2px;
  border-radius: 1px;
  background: ${RANGE_COLOURS.interstitial};
}
/* The knob is where the accent of whoever integrates this goes, and it is the
 * only place on the bar where a brand colour is allowed: it is a dot that says
 * where the programme is, it never sits on top of a mark, and the ring keeps it
 * legible on the white of the fill and on the grey of the rail alike. */
.qa-track__knob {
  position: absolute;
  top: 50%; left: 0;
  width: calc(var(--qa-rail) * 1.75); height: calc(var(--qa-rail) * 1.75);
  border-radius: 50%;
  background: var(--qa-accent, #fff);
  box-shadow: 0 0 0 2px rgba(255,255,255,0.92), 0 1px 4px rgba(0,0,0,0.45);
  transform: translate(-50%, -50%);
}
`;

const ICON = {
  play: '<path d="M8 5v14l11-7z"/>',
  pause: '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>',
  sound: '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/>',
  muted: '<path d="M3 9v6h4l5 5V4L7 9H3zm18 0-1.4-1.4L17 10.2 14.4 7.6 13 9l2.6 2.6L13 14.2l1.4 1.4 2.6-2.6 2.6 2.6L21 14.2l-2.6-2.6L21 9z"/>',
  enterFull: '<path d="M5 5h5v2H7v3H5V5zm9 0h5v5h-2V7h-3V5zM5 14h2v3h3v2H5v-5zm12 0h2v5h-5v-2h3v-3z"/>',
  exitFull: '<path d="M8 5h2v5H5V8h3V5zm6 0h2v3h3v2h-5V5zM5 14h5v5H8v-3H5v-2zm9 0h5v2h-3v3h-2v-5z"/>'
};

let controlStylesInjected = false;

function ensureControlStyles() {
  if (controlStylesInjected) return;
  controlStylesInjected = true;
  const style = document.createElement('style');
  style.textContent = CONTROLS_CSS;
  document.head.appendChild(style);
}

function button(className, icon, label) {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = `qa-btn ${className}`;
  node.setAttribute('aria-label', label);
  node.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>`;
  return node;
}

function setIcon(node, icon) {
  node.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>`;
}

/**
 * Seconds as a clock. Pure and exported because it is the one piece of
 * arithmetic here that can be wrong without anything looking wrong.
 */
export function formatClock(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/**
 * The controls, drawn inside the container the integrator handed over.
 *
 * THE FRAME. They are an overlay ON the picture and never a strip UNDER it, and
 * that is not a matter of taste: the renderer converts the percentages of the
 * layout into pixels over the box it measures, so a bar that added height to
 * that box would move every element of every layout by the height of the bar.
 * Drawn as an overlay, the box is the same box it was before these controls
 * existed, the element that goes fullscreen is the container itself -- the 16:9
 * box of the picture, with the ad layer and the primary content already inside
 * it -- and there is nothing to compensate for.
 *
 * THE LENGTH IS RE-READ, never stored (ADR 0016). For the concurrent class it
 * is invariant -- a break draws over the timeline instead of adding to it, so
 * one bar for the whole experience is possible and it does not grow -- but an
 * ad of the replacement kind inside the break can change it, and an assumption
 * that breaks between phases without saying so is the one not to hard-wire.
 *
 * @param container  the box the composition lives in, and the element that goes
 *                   fullscreen
 * @param video      the element that plays the primary content
 * @param provider   optional, the contract of ADR 0003. The only thing read off
 *                   it is `programRanges()`, and the only thing done with it is
 *                   marking the breaks on the bar. Without one the bar is the
 *                   bar and nothing else.
 * @param logo       optional, `{ src, alt }`. The mark of whoever owns the
 *                   picture, drawn in the corner of the composition on a light
 *                   plate. THIS LIBRARY SHIPS NONE: the file is the
 *                   integrator's and so is the accent colour, which is the
 *                   `--qa-accent` of the stylesheet. A player that arrived with
 *                   somebody else's brand already in it would be a worse thing
 *                   to embed than one with no brand at all.
 */
export function createControls({ container, video, provider = null, logo = null }) {
  ensureControlStyles();

  const layer = document.createElement('div');
  layer.className = 'qa-controls';

  const scrim = document.createElement('div');
  scrim.className = 'qa-controls__scrim';
  const scrimTop = document.createElement('div');
  scrimTop.className = 'qa-controls__scrim qa-controls__scrim--top';

  const brand = logo?.src ? document.createElement('div') : null;
  if (brand) {
    brand.className = 'qa-brand';
    const image = document.createElement('img');
    image.src = logo.src;
    image.alt = logo.alt ?? '';
    // With no text of its own it is decoration, and a screen reader that reads
    // out a file name is worse than one that says nothing.
    if (!image.alt) brand.setAttribute('aria-hidden', 'true');
    brand.appendChild(image);
  }

  const top = document.createElement('div');
  top.className = 'qa-controls__top';
  const audioBtn = button('qa-btn--audio', ICON.muted, 'sound of the composition');
  top.appendChild(audioBtn);

  const centre = document.createElement('div');
  centre.className = 'qa-controls__centre';
  const playBtn = button('qa-btn--play', ICON.play, 'play or pause the composition');
  centre.appendChild(playBtn);

  const bar = document.createElement('div');
  bar.className = 'qa-controls__bar';
  const elapsed = document.createElement('span');
  elapsed.className = 'qa-time qa-time--elapsed';
  const total = document.createElement('span');
  total.className = 'qa-time qa-time--total';
  const track = document.createElement('div');
  track.className = 'qa-track';
  const rail = document.createElement('div');
  rail.className = 'qa-track__rail';
  const fill = document.createElement('div');
  fill.className = 'qa-track__fill';
  // Order is the stacking here, and it is the one thing about these four nodes
  // that is not arbitrary: the marks go over the fill so a break already played
  // keeps its colour, the cues go in their lane below the rail, and the knob
  // goes over everything because it is where the programme is right now.
  const marks = document.createElement('div');
  marks.className = 'qa-track__marks';
  const cues = document.createElement('div');
  cues.className = 'qa-track__cues';
  const knob = document.createElement('div');
  knob.className = 'qa-track__knob';
  rail.append(fill, marks, cues, knob);
  track.appendChild(rail);
  const fullBtn = button('qa-btn--full', ICON.enterFull, 'fullscreen');
  // Two rows and not one: the mark on top, the transport underneath. In one row
  // the mark would take its width off the progress bar, and the progress bar is
  // what the whole programme is measured against.
  const row = document.createElement('div');
  row.className = 'qa-controls__row';
  row.append(elapsed, track, total, fullBtn);
  bar.append(...(brand ? [brand] : []), row);

  layer.append(scrim, scrimTop, top, centre, bar);
  container.appendChild(layer);

  // ---- what is on screen right now -------------------------------------

  /**
   * The length of the programme, read off the primary content and never stored
   * (ADR 0016). One function because three things need it -- the fill, the
   * seek and the marks -- and a length that three places read differently is
   * three bars.
   */
  function programLength() {
    return Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  }

  function paint() {
    // Re-read, both of them, on every frame: ADR 0016 for the length, and the
    // clock because a frame loop is what makes the bar follow a seek and a
    // resize without a second source of truth.
    const length = programLength();
    const at = video.currentTime;
    const fraction = length ? clamp01(at / length) : 0;
    fill.style.width = `${fraction * 100}%`;
    knob.style.left = `${fraction * 100}%`;
    elapsed.textContent = formatClock(at);
    total.textContent = formatClock(length);
    paintRanges(length);
  }

  const warnedKinds = new Set();
  let rangesKey = null;

  /**
   * The breaks, marked. Asked for on every frame and REDRAWN only when the
   * answer changes, which is what lets both halves be re-read instead of
   * cached: the list grows as the signalling resolves it (`settled` says when
   * it stopped) and the length is re-read for the reason ADR 0016 gives, so
   * neither can be read once at the start. The key covers both, so a length
   * that changes moves every mark even though no range did.
   */
  function paintRanges(length) {
    if (!provider?.programRanges) return;
    const { ranges } = provider.programRanges();
    const key = `${length}|` +
      ranges.map((r) => `${r.id}:${r.kind}:${r.startTime}:${r.duration}`).join(',');
    if (key === rangesKey) return;
    rangesKey = key;
    marks.replaceChildren();
    cues.replaceChildren();
    for (const range of ranges) {
      const lane = RANGE_LANES[range.kind];
      if (!lane) {
        // Loudly, and once: a kind nobody drew is a break missing from the bar,
        // and a break missing from the bar looks exactly like a break that is
        // not in the playlist.
        if (!warnedKinds.has(range.kind)) {
          warnedKinds.add(range.kind);
          console.warn(`[controls] no lane for a range of kind "${range.kind}": not marked`);
        }
        continue;
      }
      const span = rangeSpan(range, length);
      if (!span) continue;
      const node = document.createElement('div');
      node.className = lane.className;
      node.style.left = `${span.left}%`;
      node.style.width = `${span.width}%`;
      node.title = lane.title;
      (lane.under ? cues : marks).appendChild(node);
    }
  }

  function paintPlay() {
    setIcon(playBtn, video.paused ? ICON.play : ICON.pause);
  }

  function paintAudio() {
    setIcon(audioBtn, video.muted ? ICON.muted : ICON.sound);
  }

  function paintFullscreen() {
    const on = document.fullscreenElement === container;
    setIcon(fullBtn, on ? ICON.exitFull : ICON.enterFull);
    // The other half of what fullscreen means here: the same layout at the
    // scale of the screen it is being read from. The class carries the whole
    // change, because every size in this stylesheet is a token.
    layer.classList.toggle('qa-controls--full', on);
  }

  // ---- appearing and disappearing --------------------------------------

  let hideTimer = null;

  function arm() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
    // Paused is a state somebody is looking at, so the controls stay up.
    if (!video.paused) hideTimer = setTimeout(hide, CONTROLS_HIDE_MS);
  }

  function show() {
    layer.classList.add('qa-controls--on');
    arm();
  }

  function hide() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
    layer.classList.remove('qa-controls--on');
  }

  container.addEventListener('pointermove', show);
  container.addEventListener('pointerdown', show);
  container.addEventListener('pointerleave', () => { if (!video.paused) hide(); });

  // ---- what each control does ------------------------------------------

  playBtn.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
    show();
  });

  // The audio of the composition, which is also the one that lifts the mute the
  // page starts with so that the autoplay policy lets it begin without a click.
  // The mix per element is declared by the layout and belongs to the renderer;
  // this is the switch of the whole thing.
  audioBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    paintAudio();
    show();
  });

  fullBtn.addEventListener('click', () => {
    if (document.fullscreenElement === container) document.exitFullscreen?.();
    else container.requestFullscreen?.().catch(() => {});
    show();
  });

  function seekFromEvent(event) {
    const box = rail.getBoundingClientRect();
    const length = programLength();
    if (!box.width || !length) return;
    const fraction = clamp01((event.clientX - box.left) / box.width);
    video.currentTime = fraction * length;
  }
  track.addEventListener('pointerdown', (event) => { seekFromEvent(event); show(); });

  video.addEventListener('play', () => { paintPlay(); arm(); });
  video.addEventListener('pause', () => { paintPlay(); show(); });
  video.addEventListener('volumechange', paintAudio);
  document.addEventListener('fullscreenchange', () => { paintFullscreen(); show(); });

  // A frame loop, like the renderer's and for the same reason: the bar has to
  // follow the clock, a seek and a change of size without four sources of
  // truth. `timeupdate` fires four times a second and would show it.
  (function loop() {
    paint();
    requestAnimationFrame(loop);
  })();

  paintPlay();
  paintAudio();
  paintFullscreen();
  show();

  return { layer, track: rail, show, hide };
}
