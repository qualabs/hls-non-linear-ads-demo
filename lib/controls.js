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

const CONTROLS_CSS = `
.qa-controls {
  position: absolute;
  inset: 0;
  z-index: ${CONTROLS_Z_INDEX};
  pointer-events: none;
  opacity: 0;
  transition: opacity 160ms ease;
  font-family: system-ui, -apple-system, sans-serif;
  color: #fff;
}
.qa-controls--on { opacity: 1; }
.qa-controls__scrim {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 34%;
  background: linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0));
}
.qa-controls__top {
  position: absolute;
  top: 0; right: 0;
  padding: 12px 14px;
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
  align-items: center;
  gap: 12px;
  padding: 0 16px 14px;
}
.qa-btn {
  pointer-events: auto;
  display: grid;
  place-items: center;
  width: 34px; height: 34px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.42);
  color: #fff;
  cursor: pointer;
}
.qa-btn:hover { background: rgba(0,0,0,0.62); }
.qa-btn svg { width: 20px; height: 20px; fill: currentColor; display: block; }
.qa-btn--play { width: 74px; height: 74px; background: rgba(0,0,0,0.34); }
.qa-btn--play svg { width: 40px; height: 40px; }
.qa-time {
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
}
.qa-track {
  pointer-events: auto;
  position: relative;
  flex: 1;
  height: 24px;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.qa-track__rail {
  position: relative;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255,255,255,0.3);
}
.qa-track__fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 0;
  border-radius: 3px;
  background: #fff;
}
.qa-track__knob {
  position: absolute;
  top: 50%; left: 0;
  width: 13px; height: 13px;
  border-radius: 50%;
  background: #fff;
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
 */
export function createControls({ container, video }) {
  ensureControlStyles();

  const layer = document.createElement('div');
  layer.className = 'qa-controls';

  const scrim = document.createElement('div');
  scrim.className = 'qa-controls__scrim';

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
  const knob = document.createElement('div');
  knob.className = 'qa-track__knob';
  rail.append(fill, knob);
  track.appendChild(rail);
  const fullBtn = button('qa-btn--full', ICON.enterFull, 'fullscreen');
  bar.append(elapsed, track, total, fullBtn);

  layer.append(scrim, top, centre, bar);
  container.appendChild(layer);

  // ---- what is on screen right now -------------------------------------

  function paint() {
    // Re-read, both of them, on every frame: ADR 0016 for the length, and the
    // clock because a frame loop is what makes the bar follow a seek and a
    // resize without a second source of truth.
    const length = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    const at = video.currentTime;
    const fraction = length ? Math.max(0, Math.min(1, at / length)) : 0;
    fill.style.width = `${fraction * 100}%`;
    knob.style.left = `${fraction * 100}%`;
    elapsed.textContent = formatClock(at);
    total.textContent = formatClock(length);
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
    const length = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    if (!box.width || !length) return;
    const fraction = Math.max(0, Math.min(1, (event.clientX - box.left) / box.width));
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
