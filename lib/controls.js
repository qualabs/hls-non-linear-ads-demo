// controls.js -- the controls of the composition, which is the thing the
// library is dueño of and the page is not (ADR 0015).
//
// They command the WHOLE experience and not one of its elements. That is the
// difference from the native controls they replace: those are part of the video
// element, so they scale with the transform the renderer applies to it, and
// with more than one <video> on screen they command a piece and not the
// picture. Five of them, and the reference the layout follows: one progress bar
// at the very bottom, the play/pause centred over the composition, the audio
// control and the list of feeds at the top right, and everything inside the
// frame.
//
// Nothing here knows where the boxes come from and nothing here knows what a
// transport is: it reads `currentTime`, `duration`, `paused` and `muted` off the
// element that plays the primary content, and it writes them back. The one thing
// it must never do is change the box the renderer measures -- see "the frame" in
// the comment on createControls.
//
// IT DOES DRAW ONE PIECE OF FURNITURE ON A BOX AND NOT BESIDE ONE: the button
// that takes a view to full frame and brings it back (ADR 0069). That is still
// not knowing where a box comes from -- the boxes are handed over, in the
// percentages the contract carries -- but it is landing on the same pixel the
// renderer landed on, so the two lines of arithmetic that decide that pixel are
// IMPORTED from the file that owns them rather than copied. A second copy of
// `boxToPixels` is a second answer to "where is that box", and the day the two
// disagree what is on the screen is a button floating off the corner of a
// picture, which reads as a bug of the layout and not of the chrome.
//
// The bar also MARKS THE BREAKS, and that is the one thing here that is asked of
// somebody else: `provider.programRanges()`, which is the contract of ADR 0003
// and not the transport. What crosses is the KIND of each range -- 'concurrent'
// and 'multiview', the two drawn over a programme that never stops,
// or 'interstitial' -- which the contract carries on purpose, because the two
// tables below are indexed by it: a kind is a colour and a name, and without the
// kind the bar could only paint one of them.
//
// EVERY MARK GOES ON THE RAIL AND NOTHING HANGS BELOW IT (ADR 0018). What a bar
// marks is what THE PLAYER IT IS ATTACHED TO plays, so WHICH ranges get marked
// is the answer its provider gives and never a kind this file picks: the same
// bar goes over a player this library does not manage, and there the kind that
// gets marked is the other one. All this file decides is the colour each kind is
// drawn in and the name it is called by.
//
// The kind of REPLACEMENT is named in this file three times: here, a colour and
// a name. All three are on the accepted list of scripts/verificar-cortes.mjs with
// the reason each one is acceptable written beside it, and a fourth fires the
// check -- which is the point. The word is not free on this side of the seam.

// THE ONE THING THIS SIDE IMPORTS, and it is a number of the screen and not of
// the transport: how many boxes fit at once, which is what turns the rows of a
// full grid grey (ADR 0066). It is derived from the table of shapes, so the day
// a fifth shape exists this file says five without anybody editing it -- which
// is the whole reason it is imported instead of typed. One line, like every
// other import of the library: the build strips them with a substitution over
// whole lines (scripts/construir-libreria.sh).
import { MAX_BOXES } from './signalling.js';
// And the arithmetic of WHERE a box lands, from the file that owns it: the
// button of ADR 0069 is drawn on a box and has to land on the pixel the
// renderer put that box on. See the head of this file for why it is imported
// and not copied. Pure, exported, and already the thing the tests of the
// geometry aim at.
// And the time and the curve a box of the composition travels in, from the same
// file and for a stronger reason than sharing code: they are ONE answer and not
// one per place (ADR 0054). The button of a box is drawn on top of that box and
// has to arrive when it does; a second 380 written here would be a second number
// to keep in step, and the day somebody corrects the movement by looking at it,
// the one that did not move is the chrome.
import { boxToPixels, imageBox, PRIMARY_MOVE_MS, MOVE_EASING } from './renderer.js';

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
 * The three colours the bar marks a break with. They are FUNCTIONAL colours and
 * not brand ones -- the Qualabs kit is teal, orange, ink and paper, and none of
 * these is in it -- for the same reason a warning light is not a brand colour:
 * what they have to do is be told apart.
 *
 * YELLOW IS THE TRADITIONAL ONE, because that is the colour Apple's own players
 * mark it with, so it arrives already read. VIOLET IS THE CONCURRENT ONE, which
 * has no convention to respect because it is the thing being shown for the
 * first time. GREEN IS THE OFFER OF SEVERAL FEEDS, and it is green for an
 * arithmetic reason and not a taste one: on the colour wheel it is the point
 * furthest from BOTH of the other two at once, some 130 degrees from each, which
 * is the most a third mark can be told apart from the two that were already
 * there. It is also much darker than the yellow, so where hue fails -- a
 * colour-blind viewer, a washed-out screen -- lightness still separates them.
 *
 * Strong orange was the other candidate for the concurrent range and it is out
 * for a reason that is about this screen and not about taste: beside yellow it
 * stops being a different colour at a distance, and a progress bar gets read
 * from across a room. The three are values, and each is one line to change.
 */
export const RANGE_COLOURS = {
  concurrent: '#a273ff',
  multiview: '#33cc66',
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
 * EVERY KIND IS IN HERE, including the one this player does not play, and that
 * is not spare machinery: this table is read by every bar this library draws,
 * and over a client already in the market what that player plays is the
 * replacement kind, marked on ITS rail in the colour that kind already carries.
 * So this table and the one above are indexed by every kind that can cross the
 * seam, while the list of what THIS player plays is shorter and lives with the
 * wiring. The three do not hold the same keys, and the relation between them is
 * asserted rather than remembered.
 *
 * A kind with no NAME is a mark with no tooltip. A kind with no COLOUR is a
 * mark that is not drawn at all, and that is the one `paintRanges` checks for.
 * A kind missing from the third table never gets this far: its range is filtered
 * out before any bar sees it, and nothing anywhere says so.
 */
export const RANGE_TITLES = {
  concurrent: 'concurrent ad: drawn over the content, which never stops',
  multiview: 'multi view: several feeds to pick from, drawn over the content, which never stops',
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

/* NO BACKTICKS INSIDE THIS STYLESHEET, NOT EVEN IN A COMMENT. The whole thing is a
 * template literal, so the repository's habit of quoting an identifier with backticks
 * closes the string here and the build comes out with a SyntaxError that points at the
 * identifier and not at the quote. It has happened once already. Name things in plain
 * words in these comments; the code below is CSS and does not need them. */
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
}
/* THE TOKENS THEMSELVES, ON TWO SELECTORS, and the second one is the
 * announcement of multi view (ADR 0068). It is furniture of this same player,
 * so it has to scale with it, and it cannot be a child of the layer above: that
 * layer carries the opacity that hides the chrome, and an opacity of zero on a
 * parent is a group nothing inside it can climb out of. The popup has to be able
 * to appear over a picture whose chrome is DOWN -- which is the state of
 * somebody who has been watching without touching anything, and the only state
 * the popup exists for. So it is a sibling of the chrome and the sizes are
 * declared once, for both. */
.qa-controls, .qa-announce {
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
  .qa-controls, .qa-announce { --qa-icon: 44px; }
}
.qa-controls--full, .qa-announce--full {
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
  display: flex;
  align-items: center;
  gap: calc(var(--qa-pad) * 0.15);
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
/* THE LIST OF FEEDS (ADR 0067). It is a panel that hangs off the row at the top
 * right, and every length in it is a token, so it grows in fullscreen with the
 * rest of the furniture and its rows are 44 px under a finger without a branch
 * per device.
 *
 * A BUTTON THAT IS NOT THERE HAS TO BE display:none AND THE ATTRIBUTE ALONE
 * DOES NOT DO IT: .qa-btn sets display:grid, which beats the [hidden] of the
 * browser's own stylesheet, so a hidden button would go on taking its place in
 * the row. That is what this rule is, and it is written on the class so that
 * anything else hidden the same way is covered too. */
.qa-btn[hidden] { display: none; }
/* The button stays lit while its panel is open, which is the one thing that
 * ties the two together on screen: the panel hangs below the row and there is
 * nothing else saying which of the buttons it came out of. */
.qa-btn[aria-expanded="true"] { background: rgba(255, 255, 255, 0.18); }
.qa-views {
  position: absolute;
  top: calc(var(--qa-pad) + var(--qa-icon) + var(--qa-pad) * 0.5);
  right: var(--qa-pad);
  /* As wide as the names need and no wider, between a floor that keeps a short
   * catalogue from looking like a tooltip and a ceiling that keeps a long name
   * from crossing the picture. Both are multiples of the type token, so the
   * panel scales with its own text and not against it. */
  width: max-content;
  min-width: calc(var(--qa-text) * 15);
  max-width: min(calc(var(--qa-text) * 24), 62%);
  /* A catalogue is as long as whoever publishes it wants (ADR 0066), so the
   * panel scrolls inside the picture instead of growing past it. */
  max-height: calc(100% - var(--qa-pad) * 3 - var(--qa-icon));
  overflow-y: auto;
  padding: calc(var(--qa-text) * 0.5);
  border-radius: calc(var(--qa-radius) * 1.5);
  background: rgba(12, 16, 24, 0.82);
  -webkit-backdrop-filter: blur(18px) saturate(1.4);
  backdrop-filter: blur(18px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.46);
  opacity: 0;
  transform: scale(0.95) translateY(calc(var(--qa-text) * -0.4));
  transform-origin: top right;
  pointer-events: none;
  transition: opacity 140ms ease, transform 140ms ease;
}
.qa-views--on {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}
/* The eyebrow over the rows: what this list is, said once, so no row has to
 * carry it. */
.qa-views__title {
  padding: calc(var(--qa-text) * 0.55) calc(var(--qa-text) * 0.75) calc(var(--qa-text) * 0.7);
  font-size: calc(var(--qa-text) * 0.76);
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.58);
}
.qa-views__row {
  display: flex;
  align-items: center;
  gap: calc(var(--qa-text) * 0.75);
  width: 100%;
  /* 44 px under a finger for the same reason every other target is: the row is
   * what is hit, and the type token is what is read. */
  min-height: var(--qa-icon);
  padding: calc(var(--qa-text) * 0.45) calc(var(--qa-text) * 0.75);
  border: 0;
  border-radius: var(--qa-radius);
  background: transparent;
  color: #fff;
  font: inherit;
  font-size: var(--qa-text);
  text-align: left;
  cursor: pointer;
  transition: background-color 120ms ease;
}
.qa-views__row:hover:not(:disabled):not(.qa-views__row--locked) {
  background: rgba(255, 255, 255, 0.12);
}
.qa-views__row:focus-visible { outline: 2px solid var(--qa-accent, #fff); outline-offset: -2px; }
/* THE ROW OF A FULL GRID, and the one state of this list that has to be read
 * from across a room: greyed and not gone. A row that disappeared would say the
 * feed is not on offer, which is the opposite of what is true -- it is on offer
 * and the screen is full, which is what the line at the foot says. */
.qa-views__row:disabled { opacity: 0.38; cursor: default; }
/* The programme, which is a row like the others and cannot be taken down
 * (ADR 0067): nothing to press, and nothing that looks pressable. */
.qa-views__row--locked { cursor: default; }
.qa-views__name { flex: 1 1 auto; min-width: 0; }
.qa-views__hint {
  flex: 0 0 auto;
  font-size: calc(var(--qa-text) * 0.76);
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
}
/* THE TICK, and the accent of whoever integrates this is on it for the same
 * reason it is on the knob: both say where the viewer is. The mark inside it is
 * ink and not white, because the plate under it is the brand's colour and a
 * white tick on a light accent is a tick nobody sees. */
.qa-tick {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: calc(var(--qa-text) * 1.35);
  height: calc(var(--qa-text) * 1.35);
  border-radius: calc(var(--qa-text) * 0.38);
  border: 2px solid rgba(255, 255, 255, 0.5);
  transition: background-color 120ms ease, border-color 120ms ease;
}
.qa-views__row[aria-checked="true"] .qa-tick {
  background: var(--qa-accent, #fff);
  border-color: var(--qa-accent, #fff);
}
.qa-tick svg {
  width: 80%; height: 80%;
  display: block;
  fill: #0c1018;
  opacity: 0;
  transition: opacity 120ms ease;
}
.qa-views__row[aria-checked="true"] .qa-tick svg { opacity: 1; }
/* THE BUTTON ON EACH BOX (ADR 0069), and it is the one piece of this chrome
 * that is positioned by arithmetic instead of by the layout of the bar: each
 * box of the composition gets a rectangle of its own here, in the same pixels
 * the renderer put that box on, and the button rides in its corner.
 *
 * IT APPEARS WITH THE MOUSE AND WITH THE FINGER AND THERE IS NO RULE FOR IT
 * HERE, which is the whole reason it lives inside this layer. Nicolás asked for
 * a button that "only appears when you go with the mouse or when you touch with
 * a finger", and that is the chrome: the layer's opacity is what shows and
 * hides everything in it, and the rule below .qa-controls--on is what takes
 * the presses away from a finger while it is invisible. A button of its own,
 * drawn on the box by the layer underneath, would need both of those written a
 * second time -- and a second timer to go with them.
 *
 * THE CORNER IS NOT THE INVARIANT. What has to hold is that the button of a
 * box can be pressed, and what takes that away is another control on top of
 * it: the furniture of this chrome is at the top right (the way out, the list
 * and the audio), at the centre (play) and along the bottom (the bar and the
 * mark), and every one of those wins the overlap, because they are painted
 * after this layer. So the corner is CHOSEN, per box, by boxButtonCorner --
 * the first of the four whose button lands on none of them -- and these three
 * rules are the four answers it can give. The base is the north west one.
 *
 * A FIXED CORNER WAS THE FIRST ANSWER AND IT WAS WRONG BY ONE BOX. Top left
 * reads as free in every shape until the 2x2 of ADR 0065, where the fourth
 * box's top left corner IS the centre of the picture: measured, its button at
 * [646, 403, 34, 34] under a play button at [603, 359, 74, 74], 31x30 of the
 * 34x34 buried, and not pressable. The rule that says "top left" cannot see
 * that, because the thing it is wrong about -- where the other controls are --
 * is not in it. This one is made of exactly that.
 *
 * The rectangle takes no pointers -- it inherits that from the layer and
 * nothing turns it back on -- so the only thing in here that can be pressed is
 * the button, and the box of video underneath goes on taking the press that
 * moves the audio (ADR 0028) everywhere else. */
.qa-boxes { position: absolute; inset: 0; }
.qa-box {
  position: absolute;
  /* THE RECTANGLE IS THE BOX, WHICH IS WHAT THIS LINE BUYS AND IT IS NOT A
   * DEFAULT. paintBoxes writes four lengths here and they are the box of the
   * composition -- the same rectangle it hands boxButtonCorner to choose the
   * corner with. Without this, the padding below is added OUTSIDE them and the
   * painted rectangle is two paddings wider and taller than the box it stands
   * for: measured on the 2x2, a box of 550 x 309.4 painted 562.8 x 322.2, and
   * the button 12.8 px past the side and the bottom of its own picture. In nw
   * that is invisible, because the button leans on the corner the lengths start
   * at; in ne -- the corner the fourth box of the grid takes -- it hangs over
   * the right edge of the picture and is cut by it. The corner the arithmetic
   * chose for being free would not be where the button ended up, which takes
   * the ground out from under the rule that chooses it.
   *
   * AND IT IS DECLARED HERE BECAUSE THE PAGE IS NOT OURS. A page that declares
   * a reset of its own -- * { box-sizing: border-box } -- hides the defect above
   * without fixing it, and hides it from us first: measured where the reset is,
   * the before and the after read the same. So what the geometry of this chrome
   * depended on was the page it was dropped into, which is the same grid coming
   * out right in one integration and cut in the next, in a house nobody here can
   * see. A class beats * at any order, so this holds whichever way they load. */
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: calc(var(--qa-pad) * 0.4);
}
.qa-box--ne { justify-content: flex-end; }
.qa-box--sw { align-items: flex-end; }
.qa-box--se { align-items: flex-end; justify-content: flex-end; }
/* A disc and not a bare glyph, which is what the play button already is and for
 * the same reason: this one sits ON the picture instead of on a scrim, and a
 * white shape with nothing behind it disappears over a bright frame. */
.qa-box__btn {
  background: rgba(10, 14, 22, 0.46);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}
.qa-box__btn:hover { background: rgba(10, 14, 22, 0.66); }
/* The line that says WHY the rows below are grey, which is only there while
 * they are. The library ships the state of a row (ADR 0066); the wording is
 * this file's. */
.qa-views__note {
  margin: calc(var(--qa-text) * 0.4) 0 0;
  padding: calc(var(--qa-text) * 0.55) calc(var(--qa-text) * 0.75);
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  font-size: calc(var(--qa-text) * 0.8);
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.62);
}
/* THE ANNOUNCEMENT, WHICH IS TWO THINGS AND NOT ONE (ADR 0068), and the two
 * rules below are the two halves. What makes them one design is that each
 * covers exactly what the other cannot: the popup reaches somebody looking at
 * the middle of the picture and lasts a few seconds; the dot lasts as long as
 * the window and is only there when the chrome is up.
 *
 * THE POPUP SITS WHERE THE LIST WILL SIT: same top, same right, same surface as
 * .qa-views. That is the whole of the affordance -- it is not a control and it
 * says nothing about how to open anything, so the one thing it can do is be in
 * the place the thing it announces comes out of, under the button whose icon it
 * carries.
 *
 * AND IT TAKES NO POINTERS, which is not politeness: what is under it is the
 * primary content, and a tap on the primary content is a gesture already spoken
 * for -- it gives back the focus of the audio (ADR 0031) and it toggles the
 * chrome (ADR 0027). A popup that swallowed a tap would take a gesture away
 * from the picture for as long as it is on screen, and the thing it took would
 * be the one somebody uses to reach the control it is advertising. */
.qa-announce {
  position: absolute;
  top: calc(var(--qa-pad) + var(--qa-icon) + var(--qa-pad) * 0.5);
  right: var(--qa-pad);
  z-index: ${CONTROLS_Z_INDEX};
  display: flex;
  align-items: center;
  gap: calc(var(--qa-text) * 0.6);
  max-width: calc(100% - var(--qa-pad) * 2);
  padding: calc(var(--qa-text) * 0.6) calc(var(--qa-text) * 0.9);
  border-radius: calc(var(--qa-radius) * 1.5);
  background: rgba(12, 16, 24, 0.82);
  -webkit-backdrop-filter: blur(18px) saturate(1.4);
  backdrop-filter: blur(18px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.46);
  font-family: inherit;
  font-size: var(--qa-text);
  line-height: 1;
  color: #fff;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: scale(0.95) translateY(calc(var(--qa-text) * -0.4));
  transform-origin: top right;
  /* The same 180 ms the chrome fades in, so the two pieces of furniture that
   * can be on screen at once arrive at the same speed. It is also why a reading
   * taken the instant a class changes is a reading of something that is no
   * longer true: what is measured is the settled value. */
  transition: opacity 180ms ease, transform 180ms ease;
}
.qa-announce--on { opacity: 1; transform: none; }
.qa-announce svg {
  flex: 0 0 auto;
  display: block;
  width: calc(var(--qa-text) * 1.25);
  height: calc(var(--qa-text) * 1.25);
  fill: ${RANGE_COLOURS.multiview};
}
/* THE DOT, AND IT IS THE GREEN THE BAR MARKS THIS WINDOW WITH. Not the accent,
 * which is the brand's and says where the viewer is (the knob, the tick); not a
 * red badge, which says something went wrong. It is the colour of the range on
 * the rail below, so the two pieces of furniture that talk about the same
 * window say it in the same colour -- and the colour comes out of the same
 * table the mark reads, so a kind that changes colour changes both. */
.qa-btn--views { position: relative; }
.qa-btn--views.qa-btn--new::after {
  content: '';
  position: absolute;
  top: calc(var(--qa-icon) * 0.1);
  right: calc(var(--qa-icon) * 0.1);
  width: calc(var(--qa-icon) * 0.22);
  height: calc(var(--qa-icon) * 0.22);
  border-radius: 50%;
  background: ${RANGE_COLOURS.multiview};
  /* The ring is what keeps it a badge and not a smudge on the glyph underneath,
   * over a picture of any brightness. */
  box-shadow: 0 0 0 2px rgba(10, 14, 22, 0.62);
}
`;

const ICON = {
  play: '<path d="M8 5v14l11-7z"/>',
  pause: '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>',
  sound: '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/>',
  muted: '<path d="M3 9v6h4l5 5V4L7 9H3zm18 0-1.4-1.4L17 10.2 14.4 7.6 13 9l2.6 2.6L13 14.2l1.4 1.4 2.6-2.6 2.6 2.6L21 14.2l-2.6-2.6L21 9z"/>',
  enterFull: '<path d="M5 5h5v2H7v3H5V5zm9 0h5v5h-2V7h-3V5zM5 14h2v3h3v2H5v-5zm12 0h2v5h-5v-2h3v-3z"/>',
  exitFull: '<path d="M8 5h2v5H5V8h3V5zm6 0h2v3h3v2h-5V5zM5 14h5v5H8v-3H5v-2zm9 0h5v2h-3v3h-2v-5z"/>',
  // Four boxes, which is what this control opens and also what the fullest
  // composition looks like: the icon is the shape of the thing it leads to.
  views: '<rect x="3" y="4.5" width="8" height="6.5" rx="1.4"/>' +
    '<rect x="13" y="4.5" width="8" height="6.5" rx="1.4"/>' +
    '<rect x="3" y="13" width="8" height="6.5" rx="1.4"/>' +
    '<rect x="13" y="13" width="8" height="6.5" rx="1.4"/>',
  tick: '<path d="M9.2 16.3 5 12.1l-1.5 1.5L9.2 19.3 20.5 8l-1.5-1.5z"/>',
  // THE TWO OF THE BOX, AND THEY ARE NOT THE TWO OF THE BAR. Fullscreen is the
  // corner brackets above, and it is the browser's fullscreen: the picture
  // takes the screen. These two are a box taking the FRAME, which is a
  // different thing that can be done at the same time, so the two pairs are
  // drawn differently on purpose -- diagonal arrows out, diagonal arrows in --
  // and never reused for each other. Two controls that look alike and do
  // different things is the defect this avoids.
  expand: '<path d="M21 11V3h-8l3.29 3.29-4.3 4.29 1.42 1.42 4.29-4.3L21 11zM3 13v8h8l-3.29-3.29' +
    ' 4.3-4.29-1.42-1.42-4.29 4.3L3 13z"/>',
  collapse: '<path d="M12 12V4h-2v3.59L5.41 3 4 4.41 8.59 9H5v2h7zm0 0v8h2v-3.59L18.59 21 20' +
    ' 19.59 15.41 15H19v-2h-7z"/>',
  // ONE SCREEN, WHICH IS THE SHAPE OF WHAT THE WAY OUT LEADS TO, by the same
  // rule the four boxes are drawn under a few lines above: what this button
  // reaches is the programme alone, and the two icons read as a pair because
  // they are the two ends of one gesture. It is a FRAME and not a filled
  // square, because a solid block beside four solid blocks reads as a stop
  // button, and a frame reads as a picture.
  oneView: '<path d="M3 4.5h18v15H3zM5 6.5v11h14v-11z"/>'
};

/**
 * The line at the foot of the list, which is there only while the grid is full.
 *
 * IT IS THE HALF OF ADR 0066 THE LIBRARY DOES NOT SHIP. What comes out of the
 * state of whoever is watching is that a row is `disabled`, and a grey row with
 * nothing beside it reads as "this feed is not available", which is the
 * opposite of what is true: it is available and the screen is full. The way
 * forward -- lower one to raise another -- is the sentence, and it lives here
 * because the wording of a screen belongs to the chrome.
 *
 * THE CAP IS INTERPOLATED AND NOT TYPED. `MAX_BOXES` is derived from the table
 * of shapes, so the sentence and the rule cannot come apart: the day there is a
 * shape for five, this line says five.
 */
export const FULL_GRID_NOTE =
  `${MAX_BOXES} boxes is what the screen holds. Lower one to raise another.`;

/**
 * That line, or `null` when there is nothing to explain.
 *
 * Pure and exported for the reason `rangeSpan` and `createHolds` are: the rows
 * themselves are the state's answer and this file must not re-decide one, so
 * the only thing left to get wrong is WHEN the explanation shows -- and a note
 * that is always there, or never, looks like a panel that is merely wordy
 * rather than like a rule that stopped working.
 */
export function selectorNote(rows) {
  return rows.some((row) => row.disabled) ? FULL_GRID_NOTE : null;
}

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

/** What the button and the panel are called, in one place because they are one thing. */
const VIEWS_LABEL = 'the feeds on screen';

/**
 * What the way out is called. It names the DESTINATION and not the mechanism --
 * "back to the programme" and not "close the grid" -- because that is what
 * ADR 0071 says happens: the content comes back exactly as it was, and the
 * composition is simply not there any more.
 */
const WAY_OUT_LABEL = 'back to the programme alone';

/**
 * The token this list holds the chrome with. A value of its own and not a flag,
 * because the point of a `Set` of holds is that two open things do not take
 * each other's chrome down (T-06): whatever opens next brings its own token and
 * neither one has to know about the other.
 */
const VIEWS_HOLD = 'the list of feeds';

/**
 * WHAT THE POPUP SAYS, and it is three words because it is an announcement and
 * not an instruction: that there is something new, and what it is called. How
 * to reach it is what the icon beside it and the position under the button say,
 * and a sentence explaining it would be a sentence nobody finishes in the few
 * seconds this is on screen.
 */
const ANNOUNCE_TEXT = 'Multi view available';

/**
 * HOW LONG IT STAYS, and it is not the time to read three words.
 *
 * What it has to cover is noticing: somebody is watching the middle of the
 * picture, something appears in a corner, the eye goes there, and only then is
 * there anything to read. The measured budgets of this same chrome are the two
 * references either side of it -- 2600 ms is what a mouse gets after it stops
 * moving, and 5000 ms is the whole of a touch interaction, see-decide-reach --
 * and this is between them, because noticing something is more than the first
 * and less than crossing the screen to press it.
 *
 * IT IS ALSO WHY THE DOT EXISTS AND WHY THIS NUMBER IS NOT THE ANSWER TO THE
 * RISK. Any value here is a bet that somebody was looking during those seconds
 * (ADR 0068). Making it longer does not win the bet, it turns the popup into
 * furniture; what covers the case is the half that does not expire. One value,
 * one line to change.
 */
const ANNOUNCE_MS = 4500;

/**
 * The popup, empty: what it says is written when it is shown, never here (see
 * `raiseAnnounce`).
 *
 * `role="status"` and not a plain div, because this is the one piece of this
 * chrome that nothing else reports. A button that appears can be found by
 * anybody going through the controls; a thing that exists for four seconds over
 * the picture and then leaves cannot, so it is a live region and the price of
 * that is one attribute.
 */
function announcePopup() {
  const node = document.createElement('div');
  node.className = 'qa-announce';
  node.setAttribute('role', 'status');
  return node;
}

/** The panel of the list, empty: the rows are built from the offer that is on. */
function selectorPanel() {
  const panel = document.createElement('div');
  panel.className = 'qa-views';
  panel.setAttribute('role', 'menu');
  panel.setAttribute('aria-label', VIEWS_LABEL);
  const title = document.createElement('div');
  title.className = 'qa-views__title';
  title.textContent = 'Multi view';
  const list = document.createElement('div');
  list.className = 'qa-views__list';
  const note = document.createElement('p');
  note.className = 'qa-views__note';
  note.hidden = true;
  panel.append(title, list, note);
  return { panel, list, note };
}

/**
 * One row of the list, from one row of the state: a tick box, the name, and the
 * hint that says why the programme has no tick to press.
 *
 * THE NAME GOES IN AS TEXT AND NEVER AS MARKUP. It comes off the catalogue,
 * which is a third party's payload, so a name with a `<` in it would be markup
 * in the chrome of the player -- and `textContent` is the whole of the fix,
 * which is why there is no escaping function in this file.
 *
 * The three flags are NOT read here: they are painted by `paintRows`, because a
 * row that is rebuilt on every tick loses the focus and the hover of whoever is
 * reading down it.
 */
function selectorRow(row) {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = `qa-views__row${row.locked ? ' qa-views__row--locked' : ''}`;
  node.setAttribute('role', 'menuitemcheckbox');
  const tick = document.createElement('span');
  tick.className = 'qa-tick';
  tick.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON.tick}</svg>`;
  const name = document.createElement('span');
  name.className = 'qa-views__name';
  name.textContent = row.name;
  node.append(tick, name);
  if (row.locked) {
    const hint = document.createElement('span');
    hint.className = 'qa-views__hint';
    hint.textContent = 'always on';
    node.appendChild(hint);
  }
  return node;
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
 * THE HOLDS: who is asking the chrome to stay where it is (ADR 0067).
 *
 * A SET AND NOT A FLAG, and that is the whole design. Two things can be open
 * over the picture at the same time, and with a flag the first one to close
 * would take the chrome out from under the second. The token IS the holder, so
 * a release is that holder's own: releasing twice does what releasing once did,
 * and releasing a token nobody took does nothing at all -- which is what lets
 * whoever opens something call `release` on its way out without first working
 * out whether it ever got as far as taking the hold.
 *
 * `onIdle` fires when the LAST hold goes and never before, and it is the reason
 * this is a piece of its own rather than three lines beside the timer: it is the
 * one part of the mechanism that is NOT on the screen. A hold that leaks is a
 * chrome that never comes down again, and it fails the way a leak fails --
 * nothing looks wrong, because a chrome that is up looks the same whether it is
 * up for a reason or because nobody counted the holders. Pure and exported for
 * the same reason `rangeSpan` is: that is what a test can aim at.
 */
export function createHolds(onIdle = () => {}) {
  const tokens = new Set();
  return {
    get held() { return tokens.size > 0; },
    take(token) { tokens.add(token); },
    release(token) {
      if (!tokens.delete(token)) return;
      if (tokens.size === 0) onIdle();
    }
  };
}

/**
 * The four corners of a box, in the order this chrome prefers them: the north
 * west one first, so that a composition whose boxes are all clear looks exactly
 * as it did when the corner was written down instead of worked out, and the
 * other three only ever appear where the first one is taken.
 *
 * The order of the last three is what a shape that needs them gets, and it is
 * north before south on purpose: the bottom of the picture is the widest piece
 * of furniture this chrome has -- the bar runs the whole width -- so a corner
 * down there is the one most likely to be taken next.
 */
export const BOX_CORNERS = ['nw', 'ne', 'sw', 'se'];

/** How much of `a` is under `b`, in square pixels. Zero when they miss. */
function overlapArea(a, b) {
  const w = Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  const h = Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

/**
 * Where the button of a box lands in one of the four corners: the square of
 * `size`, inset by the `pad` the rectangle of the box carries.
 *
 * Exported because it is the other half of the answer `boxButtonCorner` gives:
 * a test that only had the name of a corner would have to work the rectangle
 * out again to say whether it is clear of anything, and a second copy of this
 * arithmetic is the same mistake `boxToPixels` is imported to avoid.
 */
export function boxButtonRect(corner, box, { size, pad }) {
  return {
    left: corner[1] === 'e' ? box.left + box.width - pad - size : box.left + pad,
    top: corner[0] === 's' ? box.top + box.height - pad - size : box.top + pad,
    width: size,
    height: size
  };
}

/**
 * WHICH CORNER OF THIS BOX THE BUTTON CAN BE PRESSED IN, and it is a function
 * of where the box is because that is what the question is made of: a control
 * of the chrome is on top of the boxes, so the corners that are free are the
 * ones no control of the chrome is sitting on -- which depends on where the box
 * landed and on nothing else about it.
 *
 * THE FIRST CLEAR ONE WINS, IN THE ORDER OF `BOX_CORNERS`, so the answer is the
 * north west corner everywhere it is clear and the shape never has to be named:
 * the 2x2 of ADR 0065 is not written down in here, and neither is the fact that
 * it is its fourth box that has the problem. Both fall out of `taken`, which is
 * the chrome measuring its own furniture.
 *
 * AND WHEN NOTHING IS CLEAR, THE LEAST BURIED ONE, which is not a fallback that
 * will never run so much as the same rule with the tie already broken: "clear"
 * is "buried by zero", so one comparison answers both and there is no branch
 * that can go untested. It matters on a picture small enough that a box is not
 * much bigger than the play button, where the honest answer is that some of the
 * button is covered and the question is only how much.
 *
 * Pure and exported for the reason `createHolds` is: the choice is arithmetic
 * and the drawing is not, so this is the half a test can aim at.
 *
 * @param box    {left, top, width, height} of the box, in the layer's pixels.
 * @param taken  the rectangles of the controls that win the overlap, same space.
 * @param button {size, pad} of the button inside the box.
 */
export function boxButtonCorner(box, taken, button) {
  let best = BOX_CORNERS[0];
  let least = Infinity;
  for (const corner of BOX_CORNERS) {
    const rect = boxButtonRect(corner, box, button);
    let buried = 0;
    for (const other of taken) buried += overlapArea(rect, other);
    if (buried === 0) return corner;
    if (buried < least) { least = buried; best = corner; }
  }
  return best;
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
 * @param focusOn    optional, (id) -> boolean: THE OTHER HALF OF THAT SAME
 *                   SEAM, and the second thing on this screen that has to move
 *                   the focus of the audio without owning it. `releaseFocus`
 *                   says "nobody"; this one says WHICH, by the `id` of the box,
 *                   and the rendering side answers what that means -- the ring,
 *                   the index and the mix in one call, which is the single door
 *                   of ADR 0026 and ADR 0030. The box the programme is in is a
 *                   legal argument and it means the mix the layout declared,
 *                   because the primary content is not enfocable (ADR 0027) and
 *                   what makes it the only one heard is nobody being focused.
 *
 *                   IT IS ASKED FOR HERE BECAUSE THE BUTTON IS HERE. Enlarging
 *                   is two things at once (ADR 0069): the box goes to full
 *                   frame, which is the state of whoever is watching, and the
 *                   box takes the audio, which is the renderer's one index.
 *                   Neither side owns both -- the rendering side deliberately
 *                   never learns what an offer is (ADR 0072) -- so the button
 *                   lives where the furniture lives and asks each side for its
 *                   half.
 *
 *                   Default `() => false`: a chrome wired without it enlarges
 *                   the picture and leaves the mix the layout declared.
 * @param multiview  optional, the state of whoever is watching (ADR 0067).
 *                   SEVEN CALLS AND NOTHING ELSE: `offerAt(time)`, which
 *                   answers whether there is a catalogue on screen right now
 *                   and hands it over; `rows(offer)`, the rows of the list
 *                   already decided -- name, ticked, locked, greyed;
 *                   `toggle(offer, id)`, which is the one gesture of the list;
 *                   and `boxes(offer)`, which is what is on the screen and
 *                   therefore what a button can be hung on, with
 *                   `enlarge(offer, id)` and `shrink(offer)` as the two that
 *                   move it; and `exit(offer)`, which empties the selection.
 *                   That last one is a SECOND ENTRANCE AND NOT A SECOND DOOR
 *                   (ADR 0071): it reaches the state unticking the last row
 *                   reaches, so the way back to the programme has one
 *                   implementation, and this file owns neither half of it.
 *                   What this file does with them is DRAW them: it re-decides
 *                   none of the three flags, so the cap of the screen, the
 *                   order of the boxes and the programme being fixed are stated
 *                   once, where the state lives, and not a second time here.
 *                   Without one there is no list and no button, which is what a
 *                   player of a single feed looks like.
 */
export function createControls({
  container, video, provider = null, logo = null, releaseFocus = () => false,
  focusOn = () => false, multiview = null
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

  // THE RECTANGLES OF THE COMPOSITION, one per box, and they are first in this
  // layer on purpose: what comes after paints over them, so the bar, the play
  // button and the list win every overlap against a button that rides on a
  // picture. It exists only where there is a composition to ride on, which is
  // the same condition the list of feeds is drawn under.
  const boxLayer = multiview ? document.createElement('div') : null;
  if (boxLayer) boxLayer.className = 'qa-boxes';

  const top = document.createElement('div');
  top.className = 'qa-controls__top';
  // BESIDE THE AUDIO AND NOT IN THE BOTTOM ROW, which is where Nicolás put it:
  // the row down there already carries the bar, the two clocks and fullscreen,
  // and this control is the brother of the audio one in what it does -- both
  // choose what of the composition reaches you. It comes FIRST in the row so
  // that the audio keeps the corner it has had, and it is not there at all
  // until there is a catalogue to open.
  //
  // AND THE WAY OUT GOES FIRST, WHICH IS THE OUTER END OF THE ROW. The row is
  // anchored to the right corner, so the button that comes and goes grows it
  // leftwards: neither the audio nor the list moves under a thumb that was
  // already reaching for one of them. It is the only one of the three whose
  // presence depends on the composition and not on the window.
  //
  // WHAT IT DOES IS EMPTY THE SELECTION AND NOTHING ELSE (ADR 0071). That
  // leaves one box, which is no composition, which is the event that already
  // ends an ad -- so the button is a SECOND ENTRANCE TO A DOOR THAT EXISTS and
  // not a second door. There is nothing restored here and nothing remembered:
  // the rendering side takes the whole `style` attribute off the primary
  // content and gives it its volume back, and a chrome that tried to help
  // would be the second source of truth the ADR exists to prevent.
  const wayOutBtn = multiview ? button('qa-btn--way-out', ICON.oneView, WAY_OUT_LABEL) : null;
  if (wayOutBtn) {
    wayOutBtn.hidden = true;
    top.appendChild(wayOutBtn);
  }
  const viewsBtn = multiview ? button('qa-btn--views', ICON.views, VIEWS_LABEL) : null;
  if (viewsBtn) {
    viewsBtn.hidden = true;
    viewsBtn.setAttribute('aria-haspopup', 'true');
    viewsBtn.setAttribute('aria-expanded', 'false');
    top.appendChild(viewsBtn);
  }
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

  // The panel of the list is a child of the LAYER and not of the row it hangs
  // from, for two reasons that are both about the picture: it is measured
  // against the whole frame, so it can be told not to grow past it, and it is
  // last, so it is over every other piece of furniture without a z-index of its
  // own inside a layer that already has one.
  const selector = multiview ? selectorPanel() : null;
  layer.append(scrim, scrimTop, ...(boxLayer ? [boxLayer] : []), top, centre, bar,
    ...(selector ? [selector.panel] : []));
  container.appendChild(layer);

  // THE POPUP GOES BESIDE THE CHROME AND NOT IN IT (ADR 0068), which is the one
  // structural thing about this announcement: the layer above is hidden by
  // taking its opacity to zero, and a child cannot be more opaque than its
  // parent. Inside it, the popup would be invisible in exactly the state it is
  // for -- a picture nobody has touched for a few seconds. After the layer in
  // the container, so where they do overlap the announcement is on top; on the
  // same z-index, so neither has to know the other's number.
  const announce = multiview ? announcePopup() : null;
  if (announce) container.appendChild(announce);

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
    paintSelector();
    paintBoxes();
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

  /**
   * THE CATALOGUE THAT IS ON SCREEN RIGHT NOW, or `null`. Read off the clock
   * like everything else on this bar, and off `currentTime` and never off the
   * drag in flight: what is on the screen is where the video IS, and a window
   * that opened under the thumb of somebody dragging would be a list of feeds
   * that are not playing yet.
   */
  let offer = null;
  /** The row nodes of the list, in the order the state hands them over. */
  let viewRows = [];

  const selectorOpen = () => selector?.panel.classList.contains('qa-views--on') ?? false;

  /**
   * The rows, built once per catalogue. What changes on a tick is the three
   * flags and not the nodes (see `selectorRow`), so this runs when the window
   * changes and when the list opens, and never on a tick.
   */
  function buildRows() {
    viewRows = multiview.rows(offer).map((row) => {
      const node = selectorRow(row);
      // No listener on the programme, which is the whole of what "locked"
      // costs: a row that cannot be pressed is one that nothing is listening
      // to, rather than one that asks the state a question it already answered.
      if (!row.locked) node.addEventListener('click', () => pick(row.id));
      return { id: row.id, node };
    });
    selector.list.replaceChildren(...viewRows.map((row) => row.node));
    paintRows();
  }

  /**
   * The three flags of every row, straight off the state, plus the line that
   * says why some of them are grey. Nothing is decided here: `disabled` is the
   * cap of the screen as the state sees it (ADR 0066), and this file would be
   * the second place that knows the cap if it worked it out again.
   */
  function paintRows() {
    const rows = multiview.rows(offer);
    rows.forEach((row, i) => {
      const node = viewRows[i]?.node;
      if (!node) return;
      node.setAttribute('aria-checked', String(row.checked));
      node.disabled = row.disabled;
    });
    const note = selectorNote(rows);
    selector.note.textContent = note ?? '';
    selector.note.hidden = note === null;
    /* AND THE PANEL IS LEFT SHOWING ITS FOOT, WHICH IS THE ONE THING THIS FILE
     * DECIDES ABOUT A LIST THAT DOES NOT FIT. The panel may not grow past the
     * picture, so on a phone it is a window onto the list and not the list --
     * measured on a 420 px screen, 137 px of panel over 297 px of rows -- and
     * the only thing left to choose is which end of the list that window is
     * over.
     *
     * THE FOOT, BECAUSE THE HEAD IS THE HALF THAT IS ALREADY ON THE SCREEN. At
     * the head are the title and the ticked rows, and a ticked row IS a box
     * being watched: it says a second time what the picture says. At the foot
     * are the grey rows and the line that says why they are grey, which is the
     * only thing in this panel that is nowhere else -- and without it the cap
     * reads as a control that stopped working, which is the whole reason the
     * line exists (ADR 0066). Left to the browser, what a phone got was the
     * head: measured with the grid full at 420, the title, the line and the
     * first row all at zero pixels visible.
     *
     * ONLY WHILE THERE IS A LINE TO READ. A list with room on the grid explains
     * nothing, has nothing at its foot, and is left wherever whoever is reading
     * it left it. And where everything fits, this is arithmetic that writes a
     * zero -- measured at 1440, scrollHeight 297 and clientHeight 297 -- so the
     * panel that never needed the line is not moved by it.
     *
     * A PINNED FOOT WAS THE OTHER ANSWER AND IT IS PAID FOR WITH THE LIST.
     * Taking the line out of the scroller keeps it up through any scroll, and
     * it also takes its 50 px off the 137 for good: one row and a third left to
     * read, against the two grey rows and the line this leaves. So the line is
     * put in front of whoever filled the grid, and the scroll is theirs from
     * there on. */
    if (note !== null) {
      selector.panel.scrollTop = selector.panel.scrollHeight - selector.panel.clientHeight;
    }
  }

  /**
   * The button appears with the window and goes with it, and so does the list:
   * an offer that ended is a list of feeds nobody is serving any more.
   *
   * COMPARED BY IDENTITY, which is what makes this cheap enough to ask on every
   * frame: the contract hands back the same object while the experience is
   * active, so the rows are rebuilt when the window changes and not sixty times
   * a second under the eyes of whoever is reading them.
   */
  function paintSelector() {
    if (!multiview) return;
    const next = multiview.offerAt(video.currentTime);
    if (next === offer) return;
    offer = next;
    viewsBtn.hidden = !offer;
    if (!offer) {
      closeSelector();
      // NEITHER HALF OF THE ANNOUNCEMENT OUTLIVES THE WINDOW (ADR 0068). The
      // popup can still be up -- a window shorter than `ANNOUNCE_MS` is legal,
      // the publisher decides how long an offer lasts -- and it would be
      // announcing a catalogue nobody is serving any more.
      dropAnnounce();
    } else {
      raiseAnnounce();
      if (selectorOpen()) buildRows();
    }
    paintDot();
  }

  /**
   * THE ANNOUNCEMENT OF A WINDOW THAT JUST OPENED, and the two functions below
   * are its whole life (ADR 0068). It is fired from the one place that knows a
   * window opened, which is the identity comparison above: once per window, not
   * once per frame, and a second window announces itself the same way the first
   * did.
   */
  let announceTimer = null;

  function raiseAnnounce() {
    if (!announce) return;
    clearTimeout(announceTimer);
    // WRITTEN ON EVERY SHOWING AND NOT ONCE AT BUILD TIME, because this is a
    // live region and what is announced is a CHANGE of content: a node filled
    // in when the player was built would be read out to nobody, at a moment
    // when there is no offer. The text is ours and the icon is the button's,
    // which is the one thing the popup says about where to go.
    announce.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON.views}</svg>`;
    announce.append(ANNOUNCE_TEXT);
    announce.classList.add('qa-announce--on');
    announceTimer = setTimeout(dropAnnounce, ANNOUNCE_MS);
  }

  /**
   * GOING AWAY IS PART OF WHAT MAKES IT SUBTLE, so this is called by the timer,
   * by the window ending, and by the list being opened -- an announcement whose
   * message has been acted on has nothing left to say, and the list comes out
   * exactly where the popup is.
   */
  function dropAnnounce() {
    if (!announce) return;
    clearTimeout(announceTimer);
    announceTimer = null;
    announce.classList.remove('qa-announce--on');
  }

  /**
   * THE HALF THAT DOES NOT EXPIRE: the dot on the button, while the window is
   * open and nobody has raised a camera yet (ADR 0068).
   *
   * READ OFF THE ROWS AND NOT COUNTED HERE, for the reason `paintRows` gives:
   * what is ticked is the state's answer, and a second place working it out is
   * a second place to be wrong. A row that is `locked` is the programme, which
   * is ticked from the first frame and is not a camera anybody raised.
   *
   * Asked when the window changes and when somebody ticks, which are the only
   * two things that can move it -- enlarging and shrinking do not.
   */
  function paintDot() {
    const fresh = Boolean(offer) &&
      multiview.rows(offer).every((row) => row.locked || !row.checked);
    viewsBtn.classList.toggle('qa-btn--new', fresh);
  }

  // EMPTIED WHEN THE FADE IS OVER AND NOT WHEN IT STARTS, which is the one
  // thing about the live region that needs a listener. Emptied on the way out,
  // the pill would collapse to nothing while it is still half visible; left
  // full, the second window would write the same words over the same words, and
  // a live region whose content did not change announces nothing. So the text
  // leaves with the last frame of the transition, and the next window writes
  // into an empty node.
  if (announce) {
    announce.addEventListener('transitionend', (event) => {
      if (event.propertyName !== 'opacity') return;
      if (announce.classList.contains('qa-announce--on')) return;
      announce.replaceChildren();
    });
  }

  /** The rectangles of the composition, against the nodes drawn for them. */
  let boxNodes = [];
  /** Which buttons exist: the boxes and whether one of them is at full frame. */
  let boxIdsKey = null;
  /** Where they are: the picture, which moves with the window and the metadata. */
  let boxRectKey = null;

  /**
   * ONE BUTTON PER BOX, AND WHILE ONE BOX IS AT FULL FRAME THERE IS ONE BUTTON
   * (ADR 0069). Which of the two it is, and on what, is `multiview.boxes`:
   * this file draws that answer and re-decides none of it, the same way it
   * draws the rows of the list without working out the cap again.
   *
   * TWO KEYS AND NOT ONE, because the two things that change here change for
   * different reasons and cost different amounts. WHICH buttons exist changes
   * when somebody ticks a row or presses one of these, and it rebuilds nodes.
   * WHERE they are changes when the picture moves -- a resize, fullscreen, the
   * metadata of the video arriving -- and it only writes four lengths. Asked on
   * every frame like everything else on this bar, and written on neither of
   * them when the answer is the one already on the screen: this runs sixty
   * times a second, and a style written sixty times a second to say what it
   * already said is the cost the marks of the bar avoid the same way.
   *
   * THE FIRST OF THE TWO IS ALSO WHEN A BOX CHANGES PLACE, and that is why the
   * rebuild is not the end of it: the buttons come back on the boxes of the
   * composition that is arriving, while the pictures underneath are still on
   * their way there. Left at that, every gesture that moves a box would put its
   * button at the destination on the first frame and leave it hanging over an
   * image that arrives 380 ms later. So this frame is also the frame a travel
   * starts on, and `travelButtons` below is the whole of it.
   *
   * AND WHICH CORNER OF ITS BOX EACH BUTTON RIDES IN IS PART OF "WHERE", not a
   * third thing: it is decided from the rectangle the box just got and from the
   * rectangles of the chrome's own furniture, so the two move together and the
   * one key already covers both. A composition that came up in the same place
   * does not get asked again -- and a box whose answer did not change is a
   * `classList.toggle` that writes nothing, the same way the lengths above are.
   *
   * THE PIXELS ARE THE RENDERER'S OWN ARITHMETIC over the renderer's own area:
   * the picture inside the container, which is NOT the container in fullscreen
   * over a screen of another shape. Resolved against the container instead, a
   * button on the box flush left would be drawn on the black bar beside the
   * picture -- the same error, in the same place, that `imageBox` exists to
   * stop the boxes themselves from making.
   */
  function paintBoxes() {
    if (!boxLayer) return;
    const boxes = offer ? multiview.boxes(offer) : [];
    const idsKey = boxes.map((box) => `${box.id}:${box.enlarged}`).join('|');
    // WHERE EVERY BUTTON IS BEING PAINTED RIGHT NOW, read on the one frame the
    // composition changes and `null` on all the others -- which is also what
    // says, further down, that this is the frame a travel starts on.
    let from = null;
    if (idsKey !== boxIdsKey) {
      from = buttonsOnScreen();
      boxIdsKey = idsKey;
      // The nodes are new, so nothing on the screen is where this thinks it is.
      boxRectKey = null;
      boxNodes = boxes.map(boxButton);
      boxLayer.replaceChildren(...boxNodes);
      // THE WAY OUT IS DRAWN OFF THE SAME ANSWER, because it is the same
      // question asked once: a composition on the screen is what there is to
      // leave. With nothing raised there is no button, which is the honest
      // reading -- the programme alone has nowhere to go back to -- and it
      // keeps no flag of its own, so the button and the boxes cannot come to
      // disagree about whether there is a grid. It rides on this key and not
      // on a line of its own because WHETHER there are boxes is a function of
      // WHICH boxes, which is exactly what this key is.
      wayOutBtn.hidden = !boxes.length;
    }
    if (!boxes.length) return;
    const frame = layer.getBoundingClientRect();
    const area = imageBox({ left: 0, top: 0, width: frame.width, height: frame.height },
      video.videoWidth / video.videoHeight);
    const rectKey = `${area.left}|${area.top}|${area.width}|${area.height}`;
    if (rectKey === boxRectKey) return;
    boxRectKey = rectKey;
    // Read before anything is written, which is both a layout the browser does
    // not have to do twice and the reason these two can be read once for all
    // the boxes: neither the size of the button nor the gap around it depends
    // on the box it is in -- both are tokens of this stylesheet -- so what they
    // do depend on is the only thing that changes them, and that is the same
    // resize or fullscreen that brought this line a new `rectKey`.
    const button = buttonMetrics(boxNodes[0]);
    const taken = furnitureRects(frame);
    boxes.forEach((box, i) => {
      const px = boxToPixels(box.box, area);
      const node = boxNodes[i];
      node.style.left = `${area.left + px.left}px`;
      node.style.top = `${area.top + px.top}px`;
      node.style.width = `${px.width}px`;
      node.style.height = `${px.height}px`;
      const corner = boxButtonCorner(
        { left: area.left + px.left, top: area.top + px.top, width: px.width, height: px.height },
        taken, button);
      for (const name of BOX_CORNERS) node.classList.toggle(`qa-box--${name}`, name === corner);
      // NOTHING IN FLIGHT AND NOTHING LEFT OVER, and it is two answers in one
      // line. `none` is the initial value, so on the frames nobody is
      // travelling this writes what was already there. On a node caught in the
      // middle of a travel it is the answer ADR 0053 gives to a resize: a
      // property that leaves the transition list cancels the transition running
      // on it, so the button is left on the box the four lengths above have
      // just given it, re-placed and not animated.
      node.style.transitionProperty = 'none';
      node.style.transform = 'none';
    });
    if (from) travelButtons(boxes, from);
  }

  /**
   * The painted rectangle of every button on the screen, by the id of the box
   * it belongs to.
   *
   * PAINTED AND NOT WRITTEN DOWN, which is the difference that matters and it
   * is one call: `getBoundingClientRect` reads through the transform, so a
   * button caught halfway through a travel -- somebody pressed twice, or ticked
   * a row while the grid was still moving -- is read where it IS rather than
   * where the last gesture meant to leave it, and the next travel starts from
   * there instead of jumping back.
   */
  function buttonsOnScreen() {
    const seen = new Map();
    for (const node of boxNodes) {
      seen.set(node.dataset.boxId, node.firstElementChild.getBoundingClientRect());
    }
    return seen;
  }

  /**
   * THE BUTTON OF A BOX THAT CHANGED PLACE TRAVELS WITH IT, in the time and the
   * curve of the box itself, and this is the same mechanism the rendering side
   * moves the picture with (ADR 0051, ADR 0070): the node is written at its
   * DESTINATION in one pass -- the four lengths above -- and a transform paints
   * it back where it was, so letting that transform go to nothing IS the
   * movement. What is animated is a transform and never a length, which is the
   * decision of ADR 0051 and the reason this costs the compositor and not
   * layout.
   *
   * WHY THIS ONE IS A TRANSLATE WHERE THE PICTURE'S IS A TRANSLATE AND A SCALE.
   * The picture's transform has to reproduce a whole rectangle, because the
   * rectangle is what is seen. Here the rectangle is invisible -- `.qa-box`
   * draws nothing and takes no pointers -- and what is seen is a button whose
   * size is a token of this stylesheet and has no business changing because a
   * box did. A scale would shrink the glyph to half on the way out of a
   * quadrant and grow it back, which is a second movement nobody asked for. So
   * what is reproduced is the one thing that has to land: where the button was.
   *
   * AND THE BUTTON ENDS UP ON ITS BOX IN EVERY FRAME AND NOT ONLY AT THE TWO
   * ENDS, which is arithmetic and not luck. The browser interpolates the
   * translate and the scale of the picture's transform with the same easing and
   * the same duration as this translate, and under that the painted corner of
   * the picture is the plain interpolation between its corner at the origin and
   * its corner at the destination. This button's corner is the interpolation
   * between the same two corners plus the padding, which is constant. The two
   * are the same path, so a button that starts on its box arrives on its box
   * with the box underneath it the whole way.
   *
   * THE TRANSFORM IS ON THE RECTANGLE AND NOT ON THE BUTTON, which is not a
   * matter of taste: `.qa-btn` already animates a `transform` of its own -- the
   * scale of 0.94 every button of this chrome answers a press with, 120 ms on
   * `:active` -- and an inline transform written on the button would beat that
   * rule and take the press feedback away for good. The rectangle around it has
   * no transform and no transition of its own, so the travel has the property
   * to itself.
   *
   * A BOX WITH NOWHERE TO COME FROM DOES NOT TRAVEL: a camera that has just
   * gone up has no button on the screen to read, so `from` has no entry for it
   * and it appears in its place, which is what its picture does too.
   */
  function travelButtons(boxes, from) {
    // Every destination read before a single transform is written. The reads
    // are what cost a layout and, taken in one pass, they cost one.
    const to = boxNodes.map((node) => node.firstElementChild.getBoundingClientRect());
    boxes.forEach((box, i) => {
      const was = from.get(box.id);
      if (!was) return;
      const dx = was.left - to[i].left;
      const dy = was.top - to[i].top;
      // Half a pixel is the floor the rest of this file re-places on, and a
      // button that did not move is a transition that would only cost a frame.
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      const node = boxNodes[i];
      // Written with the transition off -- the line above left it off -- and
      // then read back, which is the mechanism and not a precaution: two style
      // changes inside one turn of the event loop are one change as far as the
      // browser is concerned, and nothing would transition at all.
      node.style.transform = `translate(${dx}px, ${dy}px)`;
      void node.offsetWidth;
      node.style.transitionProperty = 'transform';
      node.style.transitionDuration = `${PRIMARY_MOVE_MS}ms`;
      node.style.transitionTimingFunction = MOVE_EASING;
      node.style.transform = 'none';
    });
  }

  /**
   * THE THREE PIECES OF FURNITURE THIS CHROME HAS TAKEN THE PICTURE FOR, in the
   * coordinates the boxes are placed in: the row at the top right, the play
   * button in the middle, and the bar along the bottom. They are read off the
   * screen instead of written down, because a row that grows by a button, a
   * play button that changes size in fullscreen and a bar that is as tall as
   * the mark makes it are lengths this file already owns somewhere else, and a
   * second copy of one is a copy that goes stale the day the first one moves.
   *
   * THE BAR GOES IN WHOLE AND THAT IS MORE THAN WINS A HIT TEST. Inside it only
   * the track and the fullscreen button take a pointer; the clocks and the mark
   * do not, so a button dropped on the clock would be pressable. It is still
   * the wrong place for one -- that strip is the width the composition has
   * already given up to furniture -- and a rule that placed a control over a
   * running clock because the clock cannot press back is a rule about hit
   * testing and not about a screen somebody reads.
   *
   * AND TODAY IT IS THE PLAY BUTTON THAT DECIDES, EVERY TIME: measured over the
   * three shapes of ADR 0065 at 1280 and again at 420, the only corner any of
   * these ever takes is the one at the centre. The other two are in here for
   * the reason the corner stopped being written down -- a rule that knows only
   * about the furniture that happened to matter is the rule that was wrong.
   *
   * WHAT IS DELIBERATELY NOT IN HERE IS EVERYTHING THAT COMES AND GOES: the
   * panel of the list and the popup of the announcement are over the picture
   * for as long as somebody is reading them, and counting them would move a
   * button to another corner while a finger was on its way to it. They are also
   * the two things a press can close, which is the difference that matters --
   * the furniture above cannot be got out of the way.
   */
  function furnitureRects(frame) {
    return [top, playBtn, bar].map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left - frame.left,
        top: rect.top - frame.top,
        width: rect.width,
        height: rect.height
      };
    });
  }

  /**
   * The square of the button and the gap around it, off the node itself.
   *
   * THE GAP IS THE SMALLER OF THE TWO SIDES and that is what makes this work
   * whichever corner the node is already in: the padding is uniform, so the
   * side the button is anchored to measures the padding and the other measures
   * everything left over, which is never less. On a node that has not been
   * placed yet the box is shrink to fit and the two are equal, which is the
   * same answer.
   */
  function buttonMetrics(node) {
    const btn = node.firstElementChild;
    const inner = btn.getBoundingClientRect();
    const outer = node.getBoundingClientRect();
    return {
      size: inner.width,
      pad: Math.min(inner.left - outer.left, outer.right - inner.right)
    };
  }

  /**
   * The rectangle of one box with its button in the corner.
   *
   * THE TWO HALVES OF ENLARGING ARE TWO CALLS AND THEY GO TO TWO PLACES, which
   * is ADR 0069 written out: `focusOn` is the audio and it is the rendering
   * side's single door, `enlarge` is the geometry and it is the state of
   * whoever is watching. Shrinking calls ONE of them and that is the decision
   * of that ADR, not an omission: the box goes back to its place in the grid
   * and goes on sounding, with its ring on, because the audio follows the
   * content and not the position. Calling `focusOn` here in some other form
   * would be a sixth way out of a focus that phase 06 closed with five.
   *
   * THE ORDER IS THE AUDIO FIRST. Either works -- a box that changes shape
   * keeps the focus somebody put on it -- but the focus has to land on a box
   * that is on the screen, and the one that is certainly on the screen is the
   * one that is there now.
   *
   * AND THERE IS NO PROPAGATION TO STOP, which is worth saying because the plan
   * asked for it. The gesture that moves only the audio is a `pointerdown` on
   * the box of video (ADR 0028), and that box is in the layer underneath: this
   * button is in the chrome, so a press on it never reaches the video at all
   * and the two gestures cannot be the same press. What the press DOES reach is
   * the container, which is where this chrome decides whether to show itself,
   * and that one is wanted.
   */
  function boxButton(box) {
    const node = document.createElement('div');
    node.className = 'qa-box';
    // WHICH BOX THIS RECTANGLE IS FOR, and it is on the node because the one
    // thing that has to survive a rebuild is the answer to "was this button
    // already on the screen, and where". The nodes are thrown away and made
    // again on every change of the composition, so an index into them is an
    // index into the nodes of the composition that just ended.
    node.dataset.boxId = box.id;
    const label = box.enlarged
      ? `${box.name}: back to the grid`
      : `${box.name}: to the whole picture`;
    const btn = button('qa-box__btn', box.enlarged ? ICON.collapse : ICON.expand, label);
    btn.addEventListener('click', () => {
      // The window can close between the frame that drew this and the press.
      if (!offer) return;
      if (box.enlarged) multiview.shrink(offer);
      else {
        focusOn(box.id);
        multiview.enlarge(offer, box.id);
      }
      show();
    });
    node.appendChild(btn);
    return node;
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
    // And the announcement takes the same scale, because it is not inside the
    // layer that carries it: the tokens are declared for both selectors and
    // this is the line that keeps them switching together.
    announce?.classList.toggle('qa-announce--full', on);
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
  /**
   * WHAT IS OPEN OVER THE PICTURE SUSPENDS THE COUNTDOWN (ADR 0067). Without
   * this the chrome is on a timer nothing can stop, so anything that takes more
   * than `hideMs` to use -- a list somebody is reading down -- goes out from
   * under the hand that opened it, and it does it at the moment of choosing.
   *
   * The countdown does not PAUSE and resume: the release of the last hold arms
   * it again from there, which is the same thing every other control does at the
   * end of its gesture. Whatever was open was activity, and what the budget
   * measures is the time since the last of it.
   */
  const holds = createHolds(arm);

  const up = () => layer.classList.contains('qa-controls--on');

  function arm() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
    if (holds.held) return;
    // Paused is a state somebody is looking at, so the controls stay up.
    if (!video.paused) hideTimer = setTimeout(hide, hideMs);
  }

  function show() {
    layer.classList.add('qa-controls--on');
    arm();
  }

  /**
   * Suspend the auto-hide until `token` gives it back, and bring the chrome up
   * with it: whatever is taking a hold is opening NOW, and opening under a
   * chrome that is on its way out would be the defect with one extra step.
   * `show` is also what stops the countdown, through `arm`.
   */
  function hold(token) {
    holds.take(token);
    show();
  }

  function hide() {
    // NOT WHILE SOMEBODY IS DRAGGING THE BAR (ADR 0035). The timer counts from
    // the last event that called `show()` and knows nothing about what is being
    // done; a finger resting on the dot while its owner decides eats the whole
    // budget, and the bar would go out from under it with the gesture still in
    // flight. The end of the scrub calls `show()`, so the timer starts again
    // from there like it does for every other control.
    if (scrubbing !== null) return;
    // AND NOT WHILE SOMETHING IS OPEN OVER THE PICTURE (ADR 0067). The guard is
    // here as well as in `arm` because the timer is not the only thing that asks
    // to hide: a mouse leaving the box asks, and so does a second tap. A list
    // that goes away because the pointer wandered off the picture is the same
    // defect the timer would have caused, only sooner -- and the drag above is
    // the one hold nobody has to take, because the bar already knows it is being
    // dragged.
    if (holds.held) return;
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
   * THE LIST OF FEEDS: open, close, and the one gesture in between (ADR 0067).
   *
   * IT TAKES A HOLD WHILE IT IS OPEN, which is what the whole of T-06 was for:
   * without it the chrome goes out from under whoever is reading down the list,
   * at 2.6 s, which is less than it takes to read four names and decide. The
   * hold is given back on close and only there, so every way out of the list --
   * the button, a press outside, escape, and the window ending -- gives it back
   * through the same line.
   *
   * AND A TICK DOES NOT CLOSE IT. This is a list of tick boxes and not a menu
   * of things to add, which is the form ADR 0067 chose so that raising and
   * lowering are the same row: building a grid of four is three ticks, and a
   * list that shut after each one would make it three ticks and three
   * re-openings. What closes it is a gesture that says so.
   */
  function openSelector() {
    if (!selector || !offer || selectorOpen()) return;
    // The list comes out where the popup is, and whoever opened it has already
    // been told (ADR 0068).
    dropAnnounce();
    buildRows();
    selector.panel.classList.add('qa-views--on');
    viewsBtn.setAttribute('aria-expanded', 'true');
    // After the rows are up: `hold` also brings the chrome, and the list is
    // what is being opened under it.
    hold(VIEWS_HOLD);
    // The keyboard lands in the list and not behind it. First row and not first
    // pressable one: the programme is a row like the others, and skipping it
    // would be the one place in this file that says otherwise.
    viewRows[0]?.node.focus({ preventScroll: true });
  }

  function closeSelector() {
    if (!selector || !selectorOpen()) return;
    selector.panel.classList.remove('qa-views--on');
    viewsBtn.setAttribute('aria-expanded', 'false');
    // Where the focus came from, and only if it is still in here: a list that
    // closed while the focus was inside it would drop the keyboard on the body.
    if (selector.panel.contains(document.activeElement)) viewsBtn.focus({ preventScroll: true });
    holds.release(VIEWS_HOLD);
  }

  if (wayOutBtn) {
    wayOutBtn.addEventListener('click', () => {
      // The window can close between the frame that drew this and the press,
      // and that race ends where the press was going anyway: with nothing
      // composed. It is the same guard the button on a box takes.
      if (!offer) return;
      multiview.exit(offer);
      show();
    });
  }

  function pick(id) {
    if (!offer) return;
    multiview.toggle(offer, id);
    // The rows again, from the state and not from what was just pressed: one
    // tick can grey out every other row (ADR 0066), so the answer to a tick is
    // the whole list and never the row that was touched.
    paintRows();
    // And the dot, which the first raised camera takes away (ADR 0068). Here
    // and not in `paintRows`, because the two are asked at different moments:
    // the rows are repainted whenever the list is open, and this is the one
    // thing that changes only when a selection does.
    paintDot();
    show();
  }

  if (selector) {
    viewsBtn.addEventListener('click', () => {
      if (selectorOpen()) closeSelector();
      else openSelector();
      show();
    });

    /**
     * CLOSING ON A PRESS OUTSIDE, ON THE CONTAINER AND NOT ON THE DOCUMENT,
     * which is the lesson of `menu.js`: in fullscreen the document outside the
     * player is not on the screen at all, so a listener there would be one that
     * only works in a window.
     *
     * AND AFTER THE CHROME'S OWN, WHICH IS WHAT THE ORDER OF THESE TWO LINES
     * BUYS. The press that dismisses the list reaches the listener up in
     * "appearing and disappearing" first, where hiding does nothing because
     * this hold is still taken, and reaches this one second. So the tap does
     * ONE thing -- it puts the list away -- and the chrome then goes on its own
     * timer from there, like after any other gesture. Registering this in the
     * capture phase would invert it: the hold would already be back and the
     * same tap would take the furniture down with the list, which is two
     * answers to one press.
     */
    container.addEventListener('pointerdown', (event) => {
      if (!selectorOpen()) return;
      if (selector.panel.contains(event.target) || viewsBtn.contains(event.target)) return;
      closeSelector();
    });

    // Escape closes it, and on the document because that is where a key without
    // a target of its own arrives -- including in fullscreen, where the keyboard
    // still belongs to the page even though the picture is the screen.
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !selectorOpen()) return;
      closeSelector();
      show();
    });
  }

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
  //
  // `hold` and `release` go out for the same kind of reason and they are the
  // pair: whoever opens something over the picture takes a hold while it is
  // open and gives it back when it closes, with any token of its own -- the
  // token is what makes two open things independent of each other. What crosses
  // is neither the timer nor the set, so nobody outside learns anything about
  // how the chrome counts.
  return { layer, track: rail, show, hide, up, hold, release: holds.release };
}
