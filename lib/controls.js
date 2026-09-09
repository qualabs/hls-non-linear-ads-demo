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
// EVERY MARK GOES ON THE RAIL AND NOTHING HANGS BELOW IT (ADR 0018). What a bar
// marks is what THE PLAYER IT IS ATTACHED TO plays, so WHICH ranges get marked
// is the answer its provider gives and never a kind this file picks: the same
// bar goes over a player this library does not manage, and there the kind that
// gets marked is the other one. All this file decides is the colour each kind is
// drawn in and the name it is called by.
//
// That second value is named in this file three times: here, a colour and a
// name. All three are on the accepted list of scripts/verificar-cortes.mjs with
// the reason each one is acceptable written beside it, and a fourth fires the
// check -- which is the point. The word is not free on this side of the seam.

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

/**
 * How long the controls stay up after the last movement, while playing.
 *
 * TWO VALUES, BECAUSE THEY ARE NOT THE SAME QUANTITY. A mouse renews the budget
 * by moving: measured, the chrome stayed up through 3.6 s of continuous
 * movement and came down 2602 ms after the pointer stopped. So on a desktop
 * this number is "how long after you stop moving", and 2600 ms of that is
 * plenty, because the next flick of the wrist brings them back.
 *
 * A finger renews nothing, because between one tap and the next it is not on
 * the screen at all: measured on a phone-sized picture with the finger held
 * down, ZERO moves arrived in four seconds and the chrome came down 2601 ms
 * after the press. So on a touch screen the same number is THE WHOLE
 * INTERACTION -- see that the controls are up, pick one, cross the picture with
 * a thumb and land on a 44 px target -- and 2600 ms of that leaves no room for
 * one mistake. 5000 ms leaves room for one. The price of it being long is
 * furniture over the picture for 2.4 s more, and a second tap takes that away
 * at once, which is the point of the gesture below.
 *
 * Both are values, and both are one line to change.
 */
export const CONTROLS_HIDE_MS = 2600;
export const CONTROLS_HIDE_TOUCH_MS = 5000;

/**
 * The two colours the bar marks a break with. They are FUNCTIONAL colours and
 * not brand ones -- the Qualabs kit is teal, orange, ink and paper, and neither
 * of these is in it -- for the same reason a warning light is not a brand
 * colour: what they have to do is be told apart.
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
 * The readable name of each kind of range, for whoever hovers a mark.
 *
 * WHY THERE IS NOTHING ELSE IN HERE. Every mark of every bar is drawn ON the
 * rail, inside it, and nothing hangs below it (ADR 0018) -- a mark under the
 * rail reads as a second element beside the bar and not as part of it. So the
 * only two things a kind of range decides are the colour it is drawn in and
 * this name.
 *
 * AND THE KIND IS NOT WHAT SAYS WHOSE BREAK IT IS: THE BAR IS. Both ranges of a
 * break start at the same second and last the same time, which is what makes
 * the pair of clients a pair, so one bar drawing both of them would add a
 * colour and no information. What separates them is that there is a bar per
 * player: a bar marks what the player it is attached to plays, and which of the
 * two kinds that turns out to be is the answer its provider gives.
 *
 * BOTH KINDS ARE IN HERE, and that is not spare machinery: this table is read
 * by every bar this library draws, and over a client already in the market what
 * that player plays is the replacement kind, marked on ITS rail in the colour
 * that kind already carries.
 *
 * A kind with no NAME is a mark with no tooltip. A kind with no COLOUR is a
 * mark that is not drawn at all, and that is the one `paintRanges` checks for.
 */
const RANGE_TITLES = {
  concurrent: 'concurrent ad: drawn over the content, which never stops',
  interstitial: 'traditional interstitial: the content is replaced by the ad'
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
/* AND ONE SET FOR A FINGER, which is a third instrument and not a third size.
 * What decides how big a target has to be is what points at it, and 34 px is
 * under the 44 px a touch target is drawn at everywhere it is written down. The
 * picture this matters on is the small one -- 361 px wide on a phone, measured
 * -- and the row still fits at 44 px, because the bar takes the width that is
 * left over.
 *
 * Two things are deliberately NOT in here. The play button, because 74 px is
 * already well over the minimum. And the height of the bar, which is 44 px for
 * every pointer and so has nothing to switch: it is written once, on .qa-track,
 * with the reason it is a plain length there and not a token. */
@media (any-pointer: coarse) {
  .qa-controls { --qa-icon: 44px; }
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
/* AND OPACITY DOES NOT STOP A THUMB. Hiding this layer takes its opacity to
 * zero, which is a paint and not a hit test, so the two things in here that
 * turn pointer events back on -- the buttons and the bar -- go on taking them
 * while nobody can see them. On a phone that means the FIRST tap acts instead
 * of showing, and all three were measured happening with the chrome invisible:
 * a tap on the bottom strip seeked 134 s, a tap in the middle paused, and a tap
 * at the top right lifted the mute, which is the worst of the three in front of
 * a camera. The first tap has to show.
 *
 * THIS RULE COVERS THE PRESS AND NOT THE CLICK, and that is not a shortcoming
 * of the rule: a press is hit-tested before anything runs, so the bar, which
 * navigates on the press, is dead here; a click is hit-tested after, once the
 * listener has already put the chrome back on screen, so a button gets it
 * anyway. The click is stopped where clicks live -- see the listener on the
 * container -- and the two halves together are what "the first tap shows" is.
 *
 * Written over every descendant instead of over those two by name, so that a
 * node added later cannot re-open the hole.
 *
 * AND BEHIND any-pointer: coarse, WHICH IS THE HALF THAT IS A DECISION. On a
 * mouse this is not a defect and closing it there would be a change of
 * behaviour: a mouse hovers, so the chrome is up whenever the cursor is over
 * the picture and moving, and the only way to reach the hidden state is to hold
 * the cursor still for 2.6 s and then click without moving it -- which seeks
 * today, measured at 113 s, and goes on seeking. The query is any-pointer and
 * not pointer on purpose: a laptop with a touch screen has a fine primary
 * pointer and a thumb as well, and the thumb is the one this is about. */
@media (any-pointer: coarse) {
  .qa-controls:not(.qa-controls--on) * { pointer-events: none; }
}
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
/* THE HEIGHT OF THIS BOX IS A TARGET AND NOT FURNITURE, which makes it the one
 * length of the chrome that does NOT scale with --qa-rail: what is seen is the
 * rail, and it goes on scaling; what is hit is this box, it is invisible, and
 * it is 44 px -- the number a touch target is drawn at everywhere it is written
 * down, and the same one --qa-icon takes for a finger.
 *
 * ONE VALUE AND NOT ONE PER POINTER, which is where this parts ways with the
 * icons: an icon at 44 px on a desktop would change what the player looks like,
 * and an invisible box that big costs a mouse nothing and buys it a click that
 * lands where it was aimed. What it does cost is height on the row, and the row
 * is inside this overlay, so the box the renderer measures does not move -- see
 * "THE FRAME" on createControls. */
.qa-track {
  pointer-events: auto;
  position: relative;
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  cursor: pointer;
  /* And the other gesture of the browser's that a drag walks into, this one on
   * a mouse: a press that travels selects the text it travels over, and the
   * clocks are right next to this box. On the element the drag STARTS from,
   * which is the whole of what this fixes and the whole of what it touches. */
  user-select: none;
  -webkit-user-select: none;
  /* WHAT THIS TURNS OFF IS THE BROWSER'S OWN GESTURE, not ours (ADR 0034). A
   * drag along this bar is a scrub, and on a phone a browser reads a movement
   * over an element as scrolling the page and takes the gesture away halfway
   * through. The press-and-release worked with or without this line; the drag
   * does not exist without it, and the drag is half of what was asked for. */
  touch-action: none;
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
/* THE BREAKS THIS BAR MARKS, all of them inside the rail: the fill runs through
 * them and the knob crosses them, which is what makes a mark part of the bar
 * and not an element beside it. Above the fill, so a break already gone by is
 * still on the map -- what a bar of five marks is for is seeing the five at
 * once and not only the ones still ahead. */
.qa-track__marks {
  position: absolute;
  inset: 0;
  border-radius: calc(var(--qa-rail) / 2);
  overflow: hidden;
  pointer-events: none;
}
/* No colour in here on purpose. Three things are written on a mark node and two
 * of them -- its left and its width -- are the position of that one range; the
 * third is its colour, which is the KIND of the range and comes out of
 * RANGE_COLOURS with the kind as the key. Keeping it there rather than in a
 * rule per kind is what makes the table a mark is checked against the same
 * table its colour is read from, so the two cannot drift apart. */
.qa-mark {
  position: absolute;
  top: 0; bottom: 0;
  min-width: 2px;
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
/* GROWN WHILE IT IS BEING DRAGGED, and only while (ADR 0036). The dot on its own
 * reports a position; what says it can be TAKEN is that it answers to being
 * taken, and this is that answer. On the token like every other length here, so
 * it goes on scaling in fullscreen and on a phone. At rest nothing about it
 * changes -- not the size, not the colour -- because at rest it was measured and
 * it is seen. */
.qa-track__knob--scrubbing {
  width: calc(var(--qa-rail) * 2.5); height: calc(var(--qa-rail) * 2.5);
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
 * @param video      what plays the primary content: the media element, or
 *                   anything that reports and accepts those four properties and
 *                   forwards `addEventListener`, `play` and `pause` to one. The
 *                   four are the whole of the contact, so a player whose element
 *                   stops reporting the programme while an ad is on screen can
 *                   hand over a facade that does -- and it has to, because this
 *                   bar draws one timeline and the rail is the programme
 * @param provider   optional, the contract of ADR 0003. The only thing read off
 *                   it is `programRanges()`, and the only thing done with it is
 *                   marking the breaks on the bar. Without one the bar is the
 *                   bar and nothing else. WHAT IT HANDS OVER IS WHAT THIS
 *                   PLAYER PLAYS: a bar marks its own player's breaks
 *                   (ADR 0018), and it draws every range it is given rather
 *                   than deciding which ones are somebody else's.
 * @param logo       optional, `{ src, alt }`. The mark of whoever owns the
 *                   picture, drawn in the corner of the composition on a light
 *                   plate. THIS LIBRARY SHIPS NONE: the file is the
 *                   integrator's and so is the accent colour, which is the
 *                   `--qa-accent` of the stylesheet. A player that arrived with
 *                   somebody else's brand already in it would be a worse thing
 *                   to embed than one with no brand at all.
 * @param releaseFocus optional, () -> boolean: the reverse half of the wiring
 *                   `chromeUp` is the other side of (ADR 0031, correction of
 *                   T-02). Asked on a tap on the primary, it lets go of
 *                   whatever box has the focus of the audio and answers
 *                   `true` if it did; `false`, its default with nobody
 *                   supplying one, means there is nothing to release and the
 *                   tap falls through to the ordinary toggle.
 */
export function createControls({
  container, video, provider = null, logo = null, releaseFocus = () => false
}) {
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
  // Order is the stacking here, and it is the one thing about these three nodes
  // that is not arbitrary: the marks go over the fill so a break already played
  // keeps its colour, and the knob goes over everything because it is where the
  // programme is right now. The three of them are children of the RAIL, which
  // is what "nothing hangs below it" is in the DOM and not only in the CSS.
  const marks = document.createElement('div');
  marks.className = 'qa-track__marks';
  const knob = document.createElement('div');
  knob.className = 'qa-track__knob';
  rail.append(fill, marks, knob);
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

  /**
   * THE DRAG IN FLIGHT, as the fraction of the programme the pointer is asking
   * for, and `null` when nobody is dragging (ADR 0033). It is the one piece of
   * state this bar keeps, and it exists because a drag is the only moment when
   * what the bar shows is not what the video is doing: the seek happens on
   * release, so until then the video is somewhere else on purpose.
   */
  let scrubbing = null;

  function paint() {
    // Re-read, both of them, on every frame: ADR 0016 for the length, and the
    // clock because a frame loop is what makes the bar follow a seek and a
    // resize without a second source of truth.
    const length = programLength();
    // ONE SOURCE AT A TIME, AND WHILE A DRAG IS IN FLIGHT IT IS THE POINTER
    // (ADR 0033). The clock is the source whenever nobody is dragging, which is
    // almost always; during a drag the video is deliberately NOT being written
    // -- the seek happens on release -- so painting off it would put the dot
    // back where the video is on the very next frame, and there would be no
    // drag to see. The three things that carry a position read the same
    // fraction, so the whole bar says one thing while the gesture lasts. The
    // marks are not among them: they are the length, not the position.
    const at = scrubbing === null ? video.currentTime : scrubbing * length;
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
    for (const range of ranges) {
      const colour = RANGE_COLOURS[range.kind];
      if (!colour) {
        // Loudly, and once: a kind nobody drew is a break missing from the bar,
        // and a break missing from the bar looks exactly like a break that is
        // not in the playlist.
        if (!warnedKinds.has(range.kind)) {
          warnedKinds.add(range.kind);
          console.warn(`[controls] no colour for a range of kind "${range.kind}": not marked`);
        }
        continue;
      }
      const span = rangeSpan(range, length);
      if (!span) continue;
      const node = document.createElement('div');
      node.className = 'qa-mark';
      node.style.left = `${span.left}%`;
      node.style.width = `${span.width}%`;
      node.style.background = colour;
      node.title = RANGE_TITLES[range.kind] ?? '';
      marks.appendChild(node);
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
  /**
   * The budget of the instrument that last reached the chrome, and a variable
   * rather than a constant because one container gets both of them: a screen
   * with a mouse plugged into it is one player and not two.
   */
  let hideMs = CONTROLS_HIDE_MS;
  /** Whether the click of the tap happening right now has to be swallowed. */
  let swallowClick = false;

  const up = () => layer.classList.contains('qa-controls--on');

  function arm() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
    // Paused is a state somebody is looking at, so the controls stay up.
    if (!video.paused) hideTimer = setTimeout(hide, hideMs);
  }

  function show() {
    layer.classList.add('qa-controls--on');
    arm();
  }

  function hide() {
    // NOT WHILE SOMEBODY IS DRAGGING THE BAR (ADR 0035). The timer counts from
    // the last event that called `show()` and knows nothing about what is being
    // done; a finger resting on the dot while its owner decides eats the whole
    // budget, and the bar would go out from under it with the gesture still in
    // flight. The end of the scrub calls `show()`, so the timer starts again
    // from there like it does for every other control.
    if (scrubbing !== null) return;
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
    layer.classList.remove('qa-controls--on');
  }

  /**
   * A MOUSE HOVERS AND A FINGER DOES NOT, and the three listeners below are
   * that one difference. With a mouse the chrome follows the pointer: it comes
   * up when the pointer moves over the picture, every move renews it, and it
   * goes away when the pointer leaves the box, which is a gesture because there
   * is somewhere to leave to.
   *
   * A finger is never over the picture. It exists between the press and the
   * release and nowhere else, so `pointerleave` fires the instant it is
   * lifted -- and that, and not the timer, is what made these controls unusable
   * on a phone. Measured: the layer went up 0.5 ms after the press, came down
   * 0.3 ms after the release, was up for the 119 ms the finger was down, and
   * the `click` of that same tap arrived when it was already gone. Both
   * candidate causes are real and this is the one that explains "they appear
   * and disappear at once"; the timer, isolated by holding the finger down so
   * that no release could fire, took its full 2601 ms.
   *
   * SO THE GESTURE THAT HIDES THEM WITHOUT A POINTER TO TAKE AWAY IS A SECOND
   * TAP ON THE PICTURE. A tap toggles. It costs the picture nothing -- no
   * button of its own, nothing to learn -- and it is what a phone player does,
   * so it arrives already known. On the furniture it never toggles: a tap on a
   * button or on the bar is that control's tap and nothing else.
   */
  container.addEventListener('pointermove', (event) => {
    // Only a mouse moves without touching. A finger's move is a drag, and a
    // drag read as movement would undo the toggle below before it was seen.
    if (event.pointerType !== 'mouse') return;
    hideMs = CONTROLS_HIDE_MS;
    show();
  });
  container.addEventListener('pointerdown', (event) => {
    const mouse = event.pointerType === 'mouse';
    const wasUp = up();
    hideMs = mouse ? CONTROLS_HIDE_MS : CONTROLS_HIDE_TOUCH_MS;
    // A SECOND DOOR OUT OF THE FOCUS, ON THE PRIMARY (ADR 0031, a correction
    // of T-02). A tap on the primary is already what toggles the chrome
    // (ADR 0027), so with nobody focused this changes nothing. With somebody
    // focused, that same tap gives the mix back instead, and stops here
    // without touching the chrome: it goes down on its own timer, same as
    // always, never as a side effect of this tap. Gated on `wasUp` for the
    // same reason the box of the ad is (ADR 0028): the gesture only counts
    // with the chrome up. `releaseFocus` answers and acts in the one call, so
    // a `false` -- nobody was focused -- is what lets the tap fall through to
    // the toggle below exactly as it did before this existed.
    if (wasUp && event.target === video && releaseFocus()) return;
    // THE OTHER HALF OF "THE FIRST TAP SHOWS AND DOES NOT ACT", and the half
    // the stylesheet cannot reach. A press is hit-tested before this listener
    // runs, so turning pointer events off while the layer is hidden is enough
    // for the bar, which navigates on the press. A CLICK is hit-tested AFTER
    // it, once this line has already put the chrome back on screen, so the
    // click of the tap that woke it lands on whatever button was under the
    // thumb: measured, a press on the invisible middle of the picture arrived
    // at the media element and the click of that same tap arrived at the play
    // button, and the composition paused. So that click is swallowed below.
    swallowClick = !mouse && !wasUp;
    // The one thing about the toggle that is not the gesture: it hides a paused
    // player too, while the timer above never does. Going away by itself has to
    // respect the state somebody is looking at; being asked to go away is being
    // asked.
    if (!mouse && wasUp && !layer.contains(event.target)) hide();
    else show();
  });
  container.addEventListener('click', (event) => {
    // In the capture phase and on the container, which is above every control:
    // this is the one place where the click of a whole gesture can be stopped
    // once, instead of every handler having to ask whether it should have run.
    // Cleared on any click, so the flag can never outlive the tap that set it
    // and swallow somebody's keyboard.
    const swallow = swallowClick;
    swallowClick = false;
    if (!swallow) return;
    event.stopPropagation();
    event.preventDefault();
  }, true);
  container.addEventListener('pointerleave', (event) => {
    // Only a mouse leaves. For a finger this fires on every release, which is
    // the defect above and not a gesture.
    if (event.pointerType === 'mouse' && !video.paused) hide();
  });

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

  /**
   * THE BAR IS ONE GESTURE AND NOT TWO (ADR 0032). A press anywhere on it puts
   * the dot there and starts the drag, the dot follows the pointer, and the
   * release is the seek. A press-and-release without moving is a drag of length
   * zero and seeks where the bar always seeked, so there is no "tap mode" apart
   * from "drag mode" -- and, which is the half that matters with a thumb,
   * NOTHING HAS TO WORK OUT WHETHER THE POINTER LANDED ON THE DOT. It landed on
   * the bar, and that is the whole of the question.
   *
   * The seek moving from the press to the release is the one thing here that
   * changes something that already worked, and it is what makes a drag possible
   * at all: a gesture that seeks when it is pressed has nothing left to drag.
   *
   * What is NOT written, because the stylesheet already says it: that this only
   * counts with the chrome up. The layer takes no pointers while it is hidden,
   * so with the chrome down the press never reaches this bar -- the same reason
   * the bar was always safe to navigate on the press.
   */
  function fractionFromEvent(event) {
    const box = rail.getBoundingClientRect();
    if (!box.width) return null;
    return clamp01((event.clientX - box.left) / box.width);
  }

  function endScrub(commit) {
    if (scrubbing === null) return;
    const fraction = scrubbing;
    scrubbing = null;
    knob.classList.remove('qa-track__knob--scrubbing');
    const length = programLength();
    if (commit && length) video.currentTime = fraction * length;
    // The timer was held off for the whole gesture, so this is where it starts
    // again -- from the end of the drag, like any other control (ADR 0035).
    show();
  }

  track.addEventListener('pointerdown', (event) => {
    const fraction = fractionFromEvent(event);
    if (fraction === null || !programLength()) return;
    scrubbing = fraction;
    knob.classList.add('qa-track__knob--scrubbing');
    // So the drag survives leaving the 44 px, upwards or sideways, which is
    // what a drag does without meaning to (ADR 0034). The browser hands the
    // capture back on its own at `pointerup` and `pointercancel`, so there is
    // nothing to release by hand.
    track.setPointerCapture?.(event.pointerId);
    show();
  });
  track.addEventListener('pointermove', (event) => {
    if (scrubbing === null) return;
    scrubbing = fractionFromEvent(event) ?? scrubbing;
  });
  track.addEventListener('pointerup', (event) => {
    if (scrubbing === null) return;
    scrubbing = fractionFromEvent(event) ?? scrubbing;
    endScrub(true);
  });
  // The two ways a drag ends without a release, and neither one is a seek: the
  // browser took the gesture, or the capture went away under it. Both close the
  // state, and closing it is not housekeeping -- a scrub left open holds the
  // chrome on screen for good.
  track.addEventListener('pointercancel', () => endScrub(false));
  track.addEventListener('lostpointercapture', () => endScrub(false));

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

  // `up` goes out with the rest of the handle because somebody else asks the
  // question these controls already answer for themselves: the touch that moves
  // the focus of the audio counts only while they are on screen (ADR 0028).
  // What crosses is the BOOLEAN and not the class it is read off, so whoever
  // asks learns nothing about this layer, and it is a function, so the answer is
  // the one that is true at the moment of the touch.
  return { layer, track: rail, show, hide, up };
}
