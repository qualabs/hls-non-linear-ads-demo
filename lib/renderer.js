// renderer.js -- the rendering layer of ADR 0003, on the far side of the seam.
//
// It takes the contract of T-06 -- a provider with `activeAt(time)` and boxes
// in percentages -- and draws it: the percentages of inset become a box in
// pixels over the player area, the elements are drawn in the order they come,
// and every asset is an element positioned on top of the primary video
// (ADR 0001). No compositing in video, no canvas: CSS over the picture.
//
// THE PLAYER AREA IS THE PICTURE AND NOT THE CONTAINER, which is the one thing
// about this file worth knowing before reading it: see `imageBox` below.
//
// Nothing here knows where the boxes come from. There is no import of the
// player library and not one word of the transport or its tags, which is the
// invariant T-06 left verified -- today by scripts/verificar-cortes.mjs, which
// also carries the list of what is accepted -- and this file has to keep. The
// one thing the renderer cannot do by itself is turn a `uri` into pixels, so it
// asks: `attachAsset` is injected by the entry point of the library, which is
// the one file on this side allowed to know the player library. See the section
// "El reproductor de assets" in docs/contrato-senalizacion-renderizado.md.

/**
 * How a box that does not have the aspect ratio of its asset gets filled:
 * centred crop, without deforming (ADR 0013). One constant, so that turning it
 * into 'contain' while the creatives are being chosen is a one-line change.
 * The same value for the ad assets and for the primary content, which the ADR
 * asks for explicitly.
 */
export const FILL_MODE = 'cover';

/**
 * How long before its window an ad is built, so that it is not being fetched at
 * the moment it has to be shown. See `bringAhead` for what that buys and what
 * it costs; the number is argued there.
 */
export const PRELOAD_LEAD_SECONDS = 3;

/**
 * How far into an ad's window the composition can already be and still take the
 * node that was brought ahead of time. Past it the window was joined in the
 * middle -- a seek -- and the node waiting is at the wrong second.
 */
export const LATE_JOIN_SECONDS = 0.5;

/**
 * How far the real asset and the window it was given can disagree before this
 * file says so. See `warnIfCut`: the disagreement is the one defect of this
 * whole mechanism that NOTHING on screen reports, so half a second is a
 * tolerance for the ordinary slack of starting and stopping a media element,
 * and not a budget for a creative that is a different length than declared.
 */
export const CUT_TOLERANCE_SECONDS = 0.5;

/**
 * The ring that says which box the audio is on (ADR 0030), and the three
 * properties of it are chosen one by one. An `outline` is painted ON TOP of the
 * content of a replaced element like a video, which is what a border and an
 * inner shadow are not; it takes no part in the layout, so it cannot move the
 * box the layout declared; and the OFFSET IS NEGATIVE, so it is drawn inside
 * the edge and the box beside it cannot clip it.
 *
 * The colour has one criterion and it is not taste: it has to read over any
 * creative, and it must not be anybody's brand colour, because nothing in this
 * layer is branded.
 */
export const FOCUS_RING_PX = 4;
export const FOCUS_RING_COLOUR = '#FFD400';

/**
 * How long the composition takes to change, and it is three numbers because
 * three things were asked for and one of them was asked NOT to happen.
 *
 * THE TIME COMES OUT OF THE AD'S OWN WINDOW and is never added after it. A fade
 * ENDS on the edge of the window instead of starting there, and the shrink of
 * the primary content likewise, so nothing on screen outlives the window the
 * contract gave it: while a transition is running the ad is still active, which
 * is what makes `clear` able to go on destroying at the edge (ADR 0052).
 *
 * The values are for correcting by eye and they are not measurements. The order
 * of magnitude is what a squeezeback on air does, and the asymmetry of the fade
 * -- shorter on the way out -- is the one thing about them that was asked for
 * directly. They live here, next to the other numbers of this file that
 * somebody may want to argue with, and NOT as CSS custom properties nor as an
 * option of `attach`: either of those would hand the effect to whoever
 * integrates the library, and it was asked for as fixed behaviour of this side
 * (ADR 0054).
 *
 * ONE NUMBER FOR BOTH DIRECTIONS OF THE GEOMETRY. A second one for the way out
 * is one line the day looking at it asks for it; today it would be one more
 * knob nobody asked for.
 *
 * AND ONE NUMBER FOR EVERY BOX AND NOT ONLY FOR THE PRIMARY CONTENT: it is how
 * long anything on the screen takes to get from one box to another, which is
 * the primary content shrinking into a layout and it is equally a camera of the
 * multi view travelling because somebody raised another one or enlarged this
 * one. The name is the primary's because the primary is the only thing that
 * moves in the layouts an ad composes, and a box that travels beside it at
 * another speed is two movements of one composition.
 */
export const PRIMARY_MOVE_MS = 380;
export const AD_FADE_IN_MS = 200;
export const AD_FADE_OUT_MS = 120;

/**
 * The curves, apart from the durations because they are a different question:
 * an ease-out is what makes the picture arrive at its box instead of stopping
 * dead in it, and a fade has nowhere to arrive.
 */
export const MOVE_EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
export const FADE_EASING = 'ease';

/**
 * The `type` an experience carries when this layer drew no layout for it: an
 * ad at full frame, which is what an `ASSET` with no usable block becomes
 * (ADR 0019). IT IS A LABEL OF THE CONTRACT and not a value the layer
 * underneath is handed from outside, which is what makes it usable here: a
 * label of this seam is something this side is allowed to know.
 *
 * THIS IS THE SECOND COPY OF THAT STRING -- the first is `LINEAR_TYPE` in
 * lib/signalling.js, which is the side that puts it there. It is copied and not
 * imported so that this file goes on importing nothing from the layer
 * underneath, which is the invariant of ADR 0003 that the header of this file
 * names. A copy that has to match is a copy that gets checked, and the check is
 * a test that imports both and asserts they are equal.
 */
export const FULL_FRAME_TYPE = 'linear';

/**
 * Whether the elements of an ad fade in and out, or appear and disappear with
 * nothing.
 *
 * The ad at full frame is the one that gets nothing, and that is a decision
 * somebody made out loud: "ahi no hay ningun efecto, ahi es un cambio brusco y
 * esta, esta bien, es lo que es". The fallback of ADR 0019 lands on the same
 * side, and it is the right side: on screen it IS an ad at full frame, whatever
 * the reason it became one.
 *
 * WHAT THIS DOES NOT DECIDE is whether the primary content moves. That question
 * needs no discriminant at all: the full-frame ad declares the primary at
 * `viewport: '0 0 0 0'`, so the geometry it asks for is the identity and a
 * transition between two identical geometries shows nothing (ADR 0050).
 *
 * Pure and exported for the same reason `boxToPixels` is: it is the one bit of
 * this whole phase where being wrong is invisible in a frame, so it is the bit
 * a test can aim at.
 */
export function fadesInAndOut(experience) {
  return experience?.type !== FULL_FRAME_TYPE;
}

/**
 * How much of an experience's window is left at a given moment, in seconds.
 *
 * The same arithmetic `warnIfCut`'s counterpart already does on `ended`, named
 * here because the transitions need it every frame. IT READS THE WINDOW AND
 * DOES NOT DECIDE IT: rule 5 of the contract is untouched -- `activeAt` is the
 * only source of whether an ad is active -- and this only answers where inside
 * an already-open window the composition is standing.
 */
export function remainingIn(experience, time) {
  return experience.startTime + experience.duration - time;
}

/**
 * Whether an element is inside the tail of its window where its way out is
 * being painted -- `leadMs` before the edge.
 *
 * THE TWO SIDES ARE WHAT IS DECIDED AND THE THRESHOLD ITSELF IS NOT. With the
 * window in seconds and the lead in milliseconds, the moment that lands exactly
 * on the boundary is not representable -- `12 - 0.38` leaves a remainder of
 * 0.3800000000000008 -- and a frame loop never lands on it anyway. So the
 * comparison is `<=` and nothing is built on top of that choice: what matters is
 * that a frame inside the lead is leaving, a frame outside it is not, and no
 * frame falls through. A test that pinned the exact boundary would be pinning an
 * artefact of the arithmetic.
 *
 * A WINDOW SHORTER THAN ITS OWN TRANSITION comes out `true` from its first
 * frame, and that is the whole of what happens: the target is the way out from
 * the start, so the primary never shrinks and the ad never fades up. The
 * transition is bounded by the window because the window is what pays for it,
 * and the degenerate case degrades to no effect rather than to a broken frame.
 *
 * A time that is not a number -- `currentTime` before the metadata is in --
 * comes out `false`, which is the harmless answer: nothing is leaving.
 */
export function isLeaving(experience, time, leadMs) {
  return remainingIn(experience, time) <= leadMs / 1000;
}

/**
 * The box the primary content goes back to on its way out, which is the same
 * box it occupies with no layout on screen: the whole picture. Written as a box
 * of the contract rather than as a special case, so that the way out is the
 * same code path as the way in and `movePrimary` cannot tell them apart.
 */
const WHOLE_FRAME = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Which DOM element draws a given asset. Of the five layouts of the
 * requirements document, one -- LBox image -- inserts a still instead of a
 * video, and what tells them apart is the `mediaType` of the element and
 * nothing else: the layout is the same L-shape either way (ADR 0012).
 *
 * The decision lives here because it is a question about the DOM and not about
 * where the boxes came from, so the seam of ADR 0003 stays where it was: this
 * file learns nothing new about the layer underneath. What the renderer still
 * cannot do by itself is turn the `uri` into pixels -- that is `attachAsset`,
 * injected, for an image exactly as for a video.
 */
export const isImage = (mediaType) => /^image\//i.test(mediaType || '');

/**
 * The declared volume of an element as the fraction a media element takes, 0 to
 * 1. What the layout says in percent is what somebody watching hears, and the
 * conversion is the whole of it.
 *
 * A value that is not a number falls back to the element's own default, and the
 * two defaults are NOT the same: full volume for the primary content and
 * silence for an element of the ad (ADR 0014). It is the same asymmetry the
 * layer underneath applies to a missing field, repeated here because it is the
 * same failure -- one default for both leaves the programme mute, and a mute
 * programme is not visible in a frame.
 *
 * Pure and exported for the same reason `boxToPixels` is.
 */
export function volumeOf(element) {
  const declared = Number(element.volume);
  if (!Number.isFinite(declared)) return element.primary ? 1 : 0;
  return Math.min(1, Math.max(0, declared / 100));
}

/**
 * The level an element actually comes out at, which is what the layout
 * declared until somebody watching takes the focus of the audio (ADR 0026).
 * With nobody focused it is `volumeOf(element)`; with somebody focused the
 * focused element is at full volume and EVERY other element is at 0, the
 * primary content included.
 *
 * `focused` is the focused element itself, or nothing when nobody is: the
 * focus is ONE index for the whole composition and not a flag on each element,
 * and that is what makes two or more audible sources stop being a case of
 * their own. The Quad is three boxes plus the programme, and two overlapping
 * experiences put boxes of two different breaks over it: both are this same
 * rule over a longer list, and a flag per element would allow two focuses at
 * once.
 *
 * IT COMPARES BY IDENTITY AND NOT BY `id`. An `id` names one element inside
 * one layout, and the composition can hold the elements of more than one
 * layout at the same time, so identity is the one comparison that does not
 * depend on two layouts having agreed on their names.
 *
 * A FOCUS IS A REDISTRIBUTION AND NOT AN ASSIGNMENT, which is the whole reason
 * this is not "the element that was touched takes the level of the primary
 * content": in the Quad the mix is 10, 10, 100 and 10, so that rule changes
 * nothing audible there, and where the programme is at 100 and the ad at 0 it
 * leaves two soundtracks playing at once.
 *
 * Pure and exported for the same reason `volumeOf` is: a test can aim at it
 * without a browser, and the arithmetic of the mix is the only part of the
 * focus that is not on the screen.
 */
export function effectiveVolumeOf(element, focused) {
  if (!focused) return volumeOf(element);
  return element === focused ? 1 : 0;
}

/**
 * The conversion of rule 1 of the contract: `box` are percentages of INSET
 * over the player area, so going to pixels is a subtraction. T-03 measured
 * this same arithmetic against the model of the SVTA tool with zero pixels of
 * difference in the fifteen elements of the six layouts.
 *
 * Pure and exported on purpose: it is one of the functions the tests of T-08
 * aim at.
 */
export function boxToPixels(box, area) {
  const left = (area.width * box.left) / 100;
  const top = (area.height * box.top) / 100;
  return {
    left,
    top,
    width: area.width - left - (area.width * box.right) / 100,
    height: area.height - top - (area.height * box.bottom) / 100
  };
}

/**
 * THE TRANSFORM THAT PUTS A NODE ALREADY LAID OUT AT `to` BACK AT `from`, which
 * is how a box of the composition travels without a single property of layout
 * being animated (ADR 0051).
 *
 * WHY IT IS THE INVERSE AND NOT THE TRAVEL. `left`, `top`, `width` and `height`
 * are what an ad node is placed with, and they are the four the browser
 * resolves by doing layout on every frame of an animation -- which is the cost
 * ADR 0051 refused, and it refused it where a dropped frame is seen: in the one
 * moment the whole composition is moving at once. So the
 * node is put at its DESTINATION in one write, with no transition, and a
 * transform paints it back where it was; letting that transform go to the
 * identity is the travel, and a transform is the compositor's work and not
 * layout's. The layout box is therefore always the truth about where a box is
 * going, and the transform is only ever alive while it is getting there.
 *
 * `transform-origin` at the top left is what makes the translate the box's own
 * left and top, the same way it does for the primary content.
 *
 * A DESTINATION WITH NO AREA gets no transform at all: the scale would be a
 * division by zero, and there is nothing to see in a box of no size anyway.
 *
 * Pure and exported for the same reason `boxToPixels` is: the whole of what can
 * be wrong here is arithmetic, and arithmetic is what a test can aim at without
 * a browser.
 */
export function transformFrom(from, to) {
  if (!to.width || !to.height) return 'none';
  return `translate(${from.left - to.left}px, ${from.top - to.top}px)` +
    ` scale(${from.width / to.width}, ${from.height / to.height})`;
}

/**
 * The picture inside the frame, which is the area every layout is resolved
 * against: the frame reduced to the aspect ratio of the primary content and
 * centred in it. `frame` comes in the container's own coordinates and the box
 * goes back out in the same ones, so what it carries is where the picture
 * starts and not only how big it is.
 *
 * WHY THE PICTURE AND NOT THE CONTAINER. The boxes of a layout are percentages
 * of the area, and the area is what somebody is watching: the video with its
 * aspect ratio, not the shape of the screen it is being watched on. In a window
 * the container is 16:9 and the two boxes are the same box, so nothing tells
 * them apart. In fullscreen over a screen of another shape they are not, and
 * T-03 measured it: container 1920x901, picture 1601,778 wide starting at pixel
 * 159,111. Resolved against the container there, an ad declared flush left is
 * drawn on the black bar and outside the picture, and the framing of the
 * primary content changes on the way in and out of every break -- with a layout
 * on screen it fills the container and without one it comes back whole.
 *
 * It also makes true in fullscreen what ADR 0013 says and until now only held
 * in a window: with the picture as the area, the box of the primary content
 * keeps the aspect ratio of the video in every layout the tool emits, so the
 * centred crop never reaches the primary content.
 *
 * The aspect ratio is the video's own -- `videoWidth / videoHeight`, which the
 * browser already reports with the pixel aspect ratio applied -- because the
 * one thing this cannot do is change the shape of the content. Before the
 * metadata arrives there is no ratio and no picture, and the frame comes back
 * unchanged rather than NaN.
 *
 * Pure and exported for the same reason `boxToPixels` is: it is arithmetic, and
 * arithmetic is what a test can aim at.
 */
export function imageBox(frame, ratio) {
  const { left, top, width, height } = frame;
  if (!(ratio > 0) || !width || !height) return { left, top, width, height };
  const w = Math.min(width, height * ratio);
  const h = Math.min(height, width / ratio);
  return { left: left + (width - w) / 2, top: top + (height - h) / 2, width: w, height: h };
}

/**
 * Whether the area moved enough to redraw. Half a pixel, and on the origin as
 * well as on the size: the picture can change place without changing size --
 * a container that gets taller pillarboxes it in the other direction -- and the
 * metadata of the video arriving changes it without the container moving at all.
 */
function moved(a, b) {
  return Math.abs(a.left - b.left) > 0.5 || Math.abs(a.top - b.top) > 0.5 ||
    Math.abs(a.width - b.width) > 0.5 || Math.abs(a.height - b.height) > 0.5;
}

/**
 * THE IDENTITY AN ELEMENT OF THE COMPOSITION IS RECOGNISED BY, which is rule 6
 * of the contract written as a key: the `itemId` of the experience the element
 * belongs to, and the element's own `id` inside it.
 *
 * WHY NOT THE `id` OF THE EXPERIENCE. That one names the BREAK and every ad of
 * the break carries the same one, so a key built on it would let the second ad
 * of a break recognise the first one's boxes as its own -- one advertiser
 * handed another advertiser's node, with everything on screen looking right.
 * `itemId` is the one field of the contract that names a single ad, and it is
 * the same field `bringAhead` already groups by.
 *
 * WHY NOT THE `id` OF THE ELEMENT ALONE. Two experiences can be active at once,
 * and an element that declares no `id` of its own resolves to a constant, so
 * two boxes belonging to two different ads come out carrying the same name. The
 * pair is what tells them apart and neither half of it is enough by itself.
 *
 * THE ORDINAL IS THE THIRD PIECE AND IT IS FOR THE ELEMENTS THAT DO NOT NAME
 * THEMSELVES: it counts the repetitions of a key inside one composition, so a
 * layout carrying two unnamed boxes offers two keys instead of one. It is 0 for
 * every element of every layout the tool emits, where the ids are declared and
 * distinct.
 *
 * The separator is a character no identifier can carry, because the two fields
 * are somebody else's strings: with a dot or a space between them, two names
 * cut in different places would come out as one key.
 *
 * Pure and exported for the same reason `boxToPixels` is: the whole value of
 * this repartition is that it can be aimed at without a browser.
 */
export function identityOf(experience, element, ordinal = 0) {
  // THE LENGTH GOES IN FRONT OF EACH FIELD, and it is not belt and braces: these
  // two strings arrive as JSON, and JSON can carry a NUL. Joined by
  // a separator the field itself may contain, two different pairs produce the same
  // key -- which is one advertiser handed the node of another, the exact failure
  // this identity exists to prevent. Writing the length first makes the encoding
  // unambiguous whatever the fields hold. Found porting this library to iOS.
  const item = String(experience?.itemId ?? '');
  const id = String(element?.id ?? '');
  return `${item.length}:${item}${id.length}:${id}${ordinal}`;
}

/** The identities of a list of `{ experience, element }`, ordinals and all. */
function identitiesOf(list) {
  const seen = new Map();
  return list.map(({ experience, element }) => {
    const first = identityOf(experience, element, 0);
    const n = seen.get(first) ?? 0;
    seen.set(first, n + 1);
    return n === 0 ? first : identityOf(experience, element, n);
  });
}

/**
 * Whether an element is already drawn at the geometry it is asking for: the
 * four percentages of its box and where it stands in the stack, which are
 * exactly the two things `place` writes off the layout. Nothing else about an
 * element is geometry -- its volume is the mix and its `uri` is what is inside
 * the box -- so nothing else belongs in this comparison.
 */
export function sameGeometry(a, b) {
  return a.zDepth === b.zDepth &&
    a.box.top === b.box.top && a.box.right === b.box.right &&
    a.box.bottom === b.box.bottom && a.box.left === b.box.left;
}

/**
 * THE REPARTITION BETWEEN WHAT IS KEPT, WHAT IS CREATED AND WHAT IS DESTROYED
 * (ADR 0070), and it is a pure function over plain data because that is the
 * whole point: a composition that changes by moving boxes instead of rebuilding
 * them is otherwise only provable by looking at it, and looking is what this
 * repository has already found twice is not enough.
 *
 * WHY IT EXISTS. Rebuilding a composition means destroying every node and
 * making it again, which costs every box its buffer: one to three seconds of
 * black per box, every time anything about the composition changes. Nobody pays
 * that while the composition only changes when the ad changes; it is the whole
 * defect the moment somebody watching can change it.
 *
 * WHAT IT ANSWERS, AND IT IS FOUR QUESTIONS AND NOT ONE. `keep` is the entries
 * that stay; `create` is the elements that have no node yet; `destroy` is the
 * entries whose element is not wanted any more; and `move` is the kept ones
 * whose box or stacking changed, which are the ones with somewhere to travel
 * to. `keep` and `create` partition the target, `keep` and `destroy` partition
 * what was on screen, and `move` is a subset of `keep`.
 *
 * `order` IS THE COMPOSITION ITSELF: one slot per element of the target, in the
 * order the contract hands them over, each carrying the entry that serves it or
 * `null` when there is none yet. It is what `applyPlan` walks, and it is what
 * turns "the composition cannot be left half done" into a property of data
 * instead of a hope about a loop.
 *
 * @param drawn   what is on screen: anything carrying `element` and `experience`
 * @param target  the experiences that have to be on screen
 */
export function planComposition(drawn, target) {
  const wanted = [];
  for (const experience of target) {
    for (const element of experience.elements) wanted.push({ experience, element });
  }
  const wantedIds = identitiesOf(wanted);
  const held = new Map();
  identitiesOf(drawn).forEach((identity, i) => {
    if (!held.has(identity)) held.set(identity, drawn[i]);
  });
  const order = wanted.map(({ experience, element }, i) => {
    const identity = wantedIds[i];
    const entry = held.get(identity) ?? null;
    // Taken out of reach so that a second slot asking for the same identity
    // gets a node of its own instead of the same one handed over twice, which
    // is one of the two shapes a composition left half done arrives in.
    held.delete(identity);
    return {
      identity,
      experience,
      element,
      entry,
      moves: entry ? !sameGeometry(entry.element, element) : false
    };
  });
  const kept = new Set(order.map((slot) => slot.entry));
  return {
    order,
    keep: order.filter((slot) => slot.entry),
    create: order.filter((slot) => !slot.entry),
    move: order.filter((slot) => slot.moves),
    destroy: drawn.filter((entry) => !kept.has(entry))
  };
}

/**
 * THE PLAN APPLIED, AND THE ONE PROPERTY IT HAS TO LEAVE BEHIND: what comes
 * back is EXACTLY the target -- one entry per element of it, in its order, and
 * not one node more or one node less. The two functions this replaced bought
 * that property by being total, which is to say by throwing everything away and
 * starting again; here it is bought by walking `order`, which IS the target,
 * and by walking nothing else.
 *
 * The two halves that touch the screen are injected, and keeping them out is
 * what lets the part that decides be read and aimed at without a browser.
 *
 * @param build  (create[]) -> one entry per slot, in the same order
 * @param clear  (destroy[]) -> void; the entries that leave the composition
 */
export function applyPlan(plan, { build, clear }) {
  clear(plan.destroy);
  const made = build(plan.create);
  let n = 0;
  return plan.order.map((slot) => {
    if (!slot.entry) return made[n++];
    // A KEPT ENTRY KEEPS ITS NODE AND NOT ITS DATA. The element and the
    // experience are the ones the contract hands over on this pass, and they
    // are written onto the entry so that everything downstream -- the box, the
    // stacking, the mix, and the window the way out is scheduled against --
    // reads what is being asked for now instead of what was being asked for
    // when the node was made.
    slot.entry.element = slot.element;
    slot.entry.experience = slot.experience;
    return slot.entry;
  });
}

/**
 * WHICH ENTRY OF THE COMPOSITION A NODE IS, ASKED NOW -- which is the other
 * half of what `applyPlan` promises. A kept entry keeps its node and not its
 * data, so the node is the one thing about a box that does NOT change when the
 * composition does, and the element bound to it is replaced on every pass where
 * the contract answers differently.
 *
 * SO NOTHING THAT OUTLIVES A PASS MAY REMEMBER AN ELEMENT, and the listeners on
 * a node are exactly that: they are registered once, when the node is made, and
 * they run after any number of compositions. One that holds the element of that
 * moment is answering with what was being asked for back then, and the failure
 * is silent in the worst way -- the focus lands on an object that is in no
 * composition, `effectiveVolumeOf` finds nobody equal to it and takes EVERY
 * element of the composition to 0, the box that was touched included. Audio
 * missing, which is the one defect that is not in a frame; and it does not
 * correct itself, because the pass that would notice the focus is gone only
 * runs when there is a plan to apply.
 *
 * IT IS THE CRITERION OF `identityOf` APPLIED ONE LEVEL IN. There, what could
 * not be compared by object was the element the contract hands over, and the
 * answer was a key that survives the object being replaced. Here what survives
 * IS an object -- the node, which is precisely the thing ADR 0070 keeps -- so
 * the node is the key, and the element is looked up instead of remembered.
 *
 * `null` when the node is not in the composition, which is a node brought ahead
 * of time or one already gone, and every caller reads that as nothing to do: a
 * box nobody is being shown is not a box anybody touched.
 *
 * Pure and exported for the same reason `boxToPixels` is, and here that is not
 * a habit: it is what turns the gesture from something only a browser can
 * answer into something a test can.
 */
export function entryOf(drawn, node) {
  return drawn.find((entry) => entry.node === node) ?? null;
}

/**
 * @param provider      something with `activeAt(time) -> Experience[]`
 * @param video         the element that is already playing the primary content
 * @param layer         the empty positioned box over the video, where ads are drawn
 * @param attachAsset   (node, {uri, mediaType, startAt}) -> detach();
 *                      injected, because playing a URI is not the renderer's job
 * @param chromeUp      () -> boolean, whether the controls are on screen right
 *                      now. The touch that moves the focus of the audio counts
 *                      only while they are (ADR 0028), and WHAT CROSSES IS THAT
 *                      ANSWER AND NOTHING ELSE: no class and no selector, so
 *                      this file learns nothing about what the controls are.
 *                      A function and not a value because it is asked at the
 *                      moment of the touch, which is what makes the order the
 *                      two pieces are built in irrelevant. Left out, there are
 *                      no controls to gate the gesture and so there is no
 *                      gesture: the capability arrives with the piece that
 *                      gates it.
 */
export function createRenderer({ provider, video, layer, attachAsset, chromeUp = () => false }) {
  /** What is on screen right now: one entry per element of the layout. */
  let drawn = [];
  /**
   * What has been brought ahead of time and is not on screen yet: `itemId` of
   * the experience that is coming, against the entries built for it. They live
   * apart from `drawn` on purpose -- everything that reads `drawn` is about
   * what is being shown, and these are not being shown.
   */
  const ahead = new Map();
  /**
   * Which element of the composition somebody watching chose to listen to, or
   * `null` when nobody chose: ONE index for the whole composition and not a
   * flag on each element (ADR 0026). It is state of the renderer and it dies
   * with the ad that was on screen, so the mix the layout declared is always
   * what the composition goes back to (ADR 0029). What moves it is a gesture on
   * a box of the ad; what reads it is `applyAudio`, through
   * `effectiveVolumeOf`.
   */
  let focused = null;
  let area = { left: 0, top: 0, width: 0, height: 0 };

  function tick() {
    const active = provider.activeAt(video.currentTime);
    // The frame is the container and the area is the picture inside it. The
    // frame is taken in the container's own coordinates -- the layer covers it
    // with `inset: 0`, so its origin IS the container's -- and everything from
    // here on is written in those, which are the ones both the ad nodes and the
    // primary content are positioned in.
    const frame = layer.getBoundingClientRect();
    const next = imageBox({ left: 0, top: 0, width: frame.width, height: frame.height },
      video.videoWidth / video.videoHeight);
    const resized = moved(next, area);
    area = next;

    // WHAT IS DRAWN AGAINST WHAT HAS TO BE, AND IT IS ONE ANSWER AND NOT TWO.
    // This used to be a key of the `itemId`s of what was active, compared
    // against the key of the pass before: a cheap way of asking whether the
    // composition changed, which could only answer yes or no and whose only yes
    // was "throw all of it away and start again" (ADR 0070). The plan answers
    // that same question and three more -- what stays, what is new, what has
    // somewhere to travel to -- and it compares by rule 6 of the contract
    // rather than by a label, which is the same reason the key compared by
    // `itemId` and not by `type`: inside one break every ad shares everything
    // except that field.
    const plan = planComposition(drawn, active);

    // FOUR REASONS TO PLACE, AND ONLY ONE OF THEM DOES NOT ANIMATE. Composing,
    // turning and moving are movements of the composition, so they are
    // interpolated; a resize is the window changing shape under it, and
    // animating that would drag the picture a frame behind the edge for the
    // whole gesture (ADR 0053).
    //
    // THE FOURTH IS THE ONE THIS PHASE ADDS AND IT HAS THE SHAPE OF `turning()`:
    // a comparison between the geometry an element is drawn at and the one it
    // is asking for, and when they differ the same `place` that carries every
    // other movement carries this one too. That is what makes a box that
    // changes size because another one went up or came down travel there with
    // the time and the curve of ADR 0051, instead of jumping.
    if (plan.create.length || plan.destroy.length) {
      apply(plan);
      place({ animate: true });
      // The two states of the composition every element of it has to arrive
      // into, and in this order: `applyPlayback` starts a node while it is
      // still muted, which is the only way the autoplay policy lets it start,
      // and `applyAudio` then gives it the volume its element declares.
      applyPlayback();
      applyAudio();
    } else if (resized) {
      apply(plan);
      place({ animate: false });
    } else if (turning() || plan.move.length) {
      apply(plan);
      place({ animate: true });
    }
    bringAhead(active);
  }

  /**
   * The plan carried out on the screen: `clear` takes off what is leaving,
   * `build` makes what is new, and what survives is bound to the data of this
   * pass. Everything that decides is in `applyPlan`, which is pure; what is
   * left here is the DOM and the one index that is state of this file.
   *
   * THE FOCUS NOW DIES WITH ITS BOX AND NO LONGER WITH THE COMPOSITION, which
   * is the one rule of ADR 0029 that being incremental touches -- and it
   * touches it by making it exact rather than by weakening it. The second and
   * fourth exits of that ADR were written as "the composition is rebuilt" and
   * "the break closes" because until now both destroyed every node, so there
   * was nothing to tell apart. What they always meant is that the node holding
   * the focus stopped existing, and that is what is asked below. A composition
   * that changes shape around a box that never stopped playing leaves the focus
   * where somebody watching put it, which is the only answer that does not take
   * the audio off a box that did not go anywhere.
   */
  function apply(plan) {
    // AND THE INDEX TRAVELS WITH ITS ELEMENT. The focus is the element object
    // itself (ADR 0026), and a kept entry is rebound to the element the
    // contract hands over on this pass, so without this line a composition that
    // merely changed shape would let go of a focus nobody asked it to let go
    // of. Silently, because a focus let go is audible and not visible.
    const refocused = plan.keep.find((slot) => slot.entry.element === focused);
    drawn = applyPlan(plan, { build, clear });
    if (refocused) focused = refocused.element;
    if (focused && !drawn.some((entry) => entry.element === focused)) setFocus(null);
  }

  /**
   * One element of the layout becomes one node, and nothing about whether it is
   * on screen is decided here: that is what makes the same function serve the
   * ad that is starting and the one that is still to come.
   */
  function createNode(element, experience, startAt) {
    const image = isImage(element.mediaType);
    const node = document.createElement(image ? 'img' : 'video');
    node.className = 'ad';
    node.dataset.elementId = element.id;
    // A black bed FOR A VIDEO AND NOT FOR A STILL, so the first frame of the
    // asset does not show the picture underneath through it. It is the one
    // thing about an ad node that does not come from the layout, and it is set
    // here, on the node this file creates, rather than left to a stylesheet
    // somebody else writes -- which is also why the page cannot correct it: no
    // stylesheet of theirs beats an inline style.
    //
    // AND A STILL WANTS THE OPPOSITE. A video is transparent until it decodes,
    // so the bed costs it nothing once it has; a still with an alpha channel is
    // composited against the bed FOREVER, and its transparency stops existing.
    // The two harms do not last the same, so one answer for both cannot be
    // right. Measured on the banner of the hydration break: 47 % of its pixels
    // carry partial alpha, so half the creative was being painted onto black.
    //
    // The discriminant is `isImage` and NOT a table of which formats carry
    // alpha. A JPEG has none and would take the bed harmlessly, but this layer
    // does not read a container to deduce what is inside it -- the contract
    // rejects exactly that in "what counts as 'I cannot draw it'" -- and a
    // table of formats is a thing to maintain. What that leaves is a still
    // showing the picture behind it in the frames before it loads, and
    // `bringAhead` already brings it three seconds early at `opacity: 0`.
    if (!image) node.style.background = '#000';
    if (image) {
      // The layer is aria-hidden and the picture is the ad itself, so there
      // is nothing to describe that is not already on screen.
      node.alt = '';
    } else {
      node.playsInline = true;
      // Muted to START, and only to start: an audible element is one the
      // autoplay policy refuses to play, and an ad that never starts is a
      // black box on camera. `applyAudio` below gives it the volume the
      // layout declared, once it is playing.
      node.muted = true;
      // The other half of `warnIfCut`, and the cheaper half: an asset that
      // runs out INSIDE its window says so itself. What is left on screen
      // until the window closes is its last frame, which looks exactly like an
      // ad that is still playing.
      node.addEventListener('ended', () => {
        // WHAT THIS NODE IS SHOWING IS ASKED AND NOT REMEMBERED (`entryOf`).
        // This listener is registered once and the composition around it
        // changes as often as somebody watching wants it to, so the element
        // and the window of the moment the node was made are both answers to
        // an old question. A node that is in no composition ran out off
        // screen, and there is neither a focus on it to let go nor a window to
        // measure it against.
        const entry = entryOf(drawn, node);
        if (!entry) return;
        // AND THE THIRD EXIT OF THE FOCUS (ADR 0029). An asset that ran out is
        // not what anybody is listening to any more, so the focus is let go and
        // the composition goes back to the mix the layout declared. It is let
        // go on every `ended` and not only on the ones the warning below
        // reports: a node that ended is silent either way, and a focus left on
        // it would put the whole composition at 0 -- audio missing, which is
        // the one failure that is not visible in a frame. THE RING GOES WITH
        // IT, and here that is not automatic: this node stays on screen with
        // its last frame until the window closes, so a mark left on it would
        // be pointing at the one box that is certainly not making a sound.
        if (entry.element === focused) setFocus(null);
        const left = entry.experience.startTime + entry.experience.duration - video.currentTime;
        if (left <= CUT_TOLERANCE_SECONDS) return;
        console.warn(`[renderer] ${entry.element.id}: the asset ran out with ${left.toFixed(2)}s still` +
          ' left in the window it was given. The composition follows the window, so the last' +
          ' frame stays in the box until the window closes.');
      });
      // THE GESTURE THAT MOVES THE FOCUS (ADR 0028), and it is on the node
      // because the node is what this file holds a reference to: a listener
      // higher up would have to NAME the box it was given, and the `id` of an
      // element does not name one -- two overlapping experiences without an
      // `id` of their own share the same one, so the focus would land on the
      // wrong box.
      //
      // A `pointerdown` AND NOT A `click`. On the second tap the press on the
      // container takes the controls down before the click of that same tap
      // arrives, so a gesture that asked about them on the click would fail on
      // exactly the tap that has to act. This one bubbles up from the target,
      // so it runs first and reads them as they were when the finger went down.
      // It is also what the bar does, which navigates on the press.
      //
      // ONE RULE AND TWO BEHAVIOURS, and neither of them written apart. With a
      // mouse the hover has already brought the controls up, so ONE click acts;
      // with a finger there is no hover, so the first tap shows and the second
      // acts. Nothing here asks which device it is -- that question is what
      // would create a third case out of a screen that has both.
      //
      // AND WHICH BOX IT IS IS ASKED AT THE MOMENT OF THE TOUCH (`entryOf`).
      // The node names the box for as long as the box exists, which is longer
      // than the element the contract handed over for it the day the node was
      // made: a composition that changes shape around a box that never stopped
      // playing gives it a new element and the same node (ADR 0070). A gesture
      // that had kept the old one would move the focus onto an object that is
      // in no composition -- the whole composition at 0, no ring anywhere, and
      // nothing on the screen saying so.
      node.addEventListener('pointerdown', () => {
        if (!chromeUp()) return;
        const entry = entryOf(drawn, node);
        if (!entry) return;
        setFocus(entry.element === focused ? null : entry.element);
      });
    }
    layer.appendChild(node);
    const detach = attachAsset(node, { uri: element.uri, mediaType: element.mediaType, startAt });
    // Whether it plays is NOT decided here -- see `applyPlayback`. What this
    // line used to do was start it, which is the state of the composition
    // being decided at the moment a node is created instead of being read off
    // the composition, and the two answers differ exactly when the node
    // arrives while the composition is not playing.
    return { element, node, detach, experience, image };
  }

  /**
   * ONE ELEMENT OF THE LAYOUT BECOMES ONE NODE, AND IT IS ONLY THE ONES THE
   * PLAN ASKS FOR: what is already on screen is not made again, which is the
   * whole of ADR 0070 on this side. It used to take a whole experience and make
   * every element of it, which is the same function whenever the only way to
   * change a composition is to build it from nothing.
   *
   * What comes back is one entry per slot and in the same order, because that
   * is what `applyPlan` puts back into the composition.
   */
  function build(create) {
    // What was brought ahead of time for the experiences this plan builds from,
    // taken out of `ahead` in one pass instead of one per element: the nodes of
    // an experience were brought together, and what is not matched below is
    // discarded together.
    const ready = new Map();
    for (const { experience } of create) {
      if (ready.has(experience.itemId)) continue;
      ready.set(experience.itemId, ahead.get(experience.itemId) ?? []);
      ahead.delete(experience.itemId);
    }
    const made = create.map(({ element, experience }) => {
      // Rule 3: the primary content is an element of the layout like any
      // other, it just does not bring a `uri` because it is already playing.
      // What there is to do with it is move it to its box and give it the
      // volume the layout declared for it -- see `applyAudio`.
      //
      // AND IT CARRIES ITS EXPERIENCE, which is what the way out is scheduled
      // against: `leavingNow` needs the window, and the window is on the
      // experience. `warnIfCut` already guards against an entry without one,
      // so nothing that reads `drawn` changes by this being here.
      if (element.primary) return { element, node: video, detach: null, experience };
      const startAt = Math.max(0, video.currentTime - experience.startTime);
      const waiting = ready.get(experience.itemId);
      const i = waiting.findIndex((entry) => entry.element === element);
      // A node brought ahead of time was left at the start of its asset,
      // because that is where the window it is waiting for opens. Arriving in
      // the MIDDLE of that window -- somebody seeked into the ad -- is the one
      // case where it is at the wrong second, and there it is thrown away and
      // built again rather than started in the wrong place.
      const usable = i >= 0 && startAt <= LATE_JOIN_SECONDS;
      // AND ITS OPACITY IS NOT TOUCHED HERE. It used to be removed on the spot,
      // which put the node at full opacity in the same pass it was pushed;
      // `place` is the one that writes it now, and it needs the node to still
      // be at the 0 `bringAhead` left it at, because that is what the way in
      // interpolates FROM. Removing it here would leave nothing to fade.
      return usable ? waiting.splice(i, 1)[0] : createNode(element, experience, startAt);
    });
    for (const entries of ready.values()) discard(entries);
    return made;
  }

  /**
   * The ad that comes NEXT, fetched while the one on screen is still running.
   *
   * WHY IT EXISTS. Building an ad means a node, a second instance of the player
   * library, and its first fetches, and until those land the node is the black
   * bed `createNode` paints on it. With one ad per break that cold start falls
   * before there is anything to show; inside a break of several ads it falls
   * between two ads, once per transition, in the middle of the picture.
   *
   * HOW FAR AHEAD, and it is a trade and not a constant somebody picked. Too
   * little and the node is still black when its turn comes, which is the defect
   * this exists to remove; too much and a second decoder runs for longer than
   * it has to, over a client that told us how many it has. Three seconds is
   * enough for the two round trips a cold start costs on a real network and it
   * is a small fraction of an ordinary ad, so at most one extra decoder is
   * alive and only for the tail of the ad before it.
   *
   * WHAT IT LOOKS LIKE AND SOUNDS LIKE UNTIL ITS TURN: nothing. It is in its
   * box already, so its arrival costs no reflow, but at `opacity: 0` -- which
   * hides it without taking it out of the picture the way `display: none`
   * would, and a node that is not being painted is a node that is not being
   * decoded either. It is never started and never unmuted: `applyPlayback` and
   * `applyAudio` read `drawn`, and this is not in `drawn`.
   *
   * IT ASKS THE CONTRACT AND NOTHING ELSE. "What is going to be active three
   * seconds from now" is `activeAt` of a time three seconds from now, so there
   * is no second question for the layer underneath to answer.
   */
  function bringAhead(active) {
    const onScreen = new Set(active.map((e) => e.itemId));
    const wanted = new Set();
    for (const experience of provider.activeAt(video.currentTime + PRELOAD_LEAD_SECONDS)) {
      if (onScreen.has(experience.itemId)) continue;
      wanted.add(experience.itemId);
      if (ahead.has(experience.itemId)) continue;
      ahead.set(experience.itemId, experience.elements
        .filter((element) => !element.primary)
        .map((element) => {
          const entry = createNode(element, experience, 0);
          entry.node.style.opacity = '0';
          sizeAsset(entry.node, boxToPixels(element.box, area));
          return entry;
        }));
    }
    // What is no longer coming -- a seek backwards, a window that moved -- is
    // dropped, because a fetch nobody is going to watch is the cost of this
    // without the benefit.
    for (const [itemId, entries] of ahead) {
      if (wanted.has(itemId)) continue;
      discard(entries);
      ahead.delete(itemId);
    }
  }

  function discard(entries) {
    for (const { node, detach } of entries) {
      detach?.();
      node.remove();
    }
  }

  /**
   * Whether an element is inside the tail of its window where its way out is
   * being painted, right now. The lead is the only thing that differs between
   * the two kinds of element: the picture has further to travel than an opacity
   * does, so it starts sooner.
   *
   * An entry with no experience answers `false` rather than throwing. Nothing
   * puts one in `drawn` today, and a way out that cannot be scheduled is better
   * than a frame loop that stops.
   */
  function leavingNow({ element, experience }) {
    if (!experience) return false;
    if (element.primary) return isLeaving(experience, video.currentTime, PRIMARY_MOVE_MS);
    // AN AD THAT GETS NO FADE IS NEVER LEAVING, and that is not a shortcut: its
    // way out is `clear` destroying it on the edge of its window, so there is
    // nothing to paint before that. Answering `true` here would take its
    // opacity to zero 120 ms EARLY and uncover the primary content for those
    // 120 ms, which is the opposite of the dry cut the ad at full frame is
    // supposed to be.
    if (!fadesInAndOut(experience)) return false;
    return isLeaving(experience, video.currentTime, AD_FADE_OUT_MS);
  }

  /**
   * Whether any element crossed the threshold of its own way out since the last
   * time it was placed. IT IS A COMPARISON AND NOT A REWRITE, which is the
   * whole reason each entry remembers what it was last given: this runs on
   * every frame, and writing the same style sixty times a second to find out
   * that nothing changed is the cost this avoids.
   */
  function turning() {
    return drawn.some((entry) => leavingNow(entry) !== entry.leaving);
  }

  /**
   * The boxes, in pixels. Rule 2: `elements` already comes ordered by ascending
   * `zDepth` and the last one is on top, which is what `z-index` says here so
   * that the order holds no matter which node is which in the DOM.
   *
   * The two kinds of element get to their box by different means, because they
   * start from different places: an ad node is created by this file and its box
   * IS its geometry, while the primary content is already on screen filling the
   * frame and what there is to do with it is move it (rule 3, ADR 0001).
   *
   * THEY TRAVEL THE SAME WAY, THOUGH, and that is not a coincidence of two
   * implementations: what is animated on either of them is a `transform` and
   * never a property of layout (ADR 0051), so a box of the composition that
   * changes shape arrives at its new one with the same time and the same curve
   * the picture has always arrived with. Which of them is doing it is the one
   * branch below; how long it takes and what it looks like is one answer.
   *
   * `animate` is which of the four callers this is, and it is the only thing
   * that decides whether a transition runs: see the four of them in `tick`.
   *
   * THE WAY OUT IS A BOX AND NOT A SECOND MECHANISM. An element inside the tail
   * of its window is placed against the box it will end at instead of the one
   * the layout asked for -- the whole picture, for the primary content -- so the
   * way out is this same function with a different box, and the transition that
   * carries it is the same one that carried the way in.
   *
   * That the way out lands ON the edge of the window instead of starting there
   * is what makes it possible at all (ADR 0052): while it runs, the window has
   * not closed, so the ad underneath is still drawn and still playing, and
   * `clear` can go on destroying at the edge.
   */
  function place({ animate = false } = {}) {
    for (const entry of drawn) {
      const { element, node, image } = entry;
      entry.leaving = leavingNow(entry);
      const px = boxToPixels(entry.leaving && element.primary ? WHOLE_FRAME : element.box, area);
      node.style.objectFit = FILL_MODE;
      node.style.zIndex = String(element.zDepth);
      if (element.primary) movePrimary(node, px, animate);
      else {
        // THE POINTERS ARE TURNED ON HERE AND NOT WHERE THE NODE IS BUILT, AND
        // THAT IS NOT A DETAIL (ADR 0028). `bringAhead` builds nodes that are
        // already positioned over their box at `opacity: 0`, and OPACITY DOES
        // NOT STOP A FINGER: turned on at build time, a box that has not
        // entered yet and that nobody can see would take the gesture and change
        // the audio. This function walks only what is on screen.
        //
        // On the box and never on the layer, which goes on taking none of them:
        // what receives the press is the node inside it, so nothing that
        // belongs underneath is being swallowed. And not on a still, which has
        // no audio to take (ADR 0027) -- giving one pointers would only create
        // a patch of the picture where a touch neither moves the audio nor
        // toggles the controls.
        if (!image) node.style.pointerEvents = 'auto';
        // THE WAY IN AND THE WAY OUT OF AN AD, and both are one property. The
        // node arrives at `opacity: 0` because `bringAhead` left it there, so
        // the way in is taking it to 1; the way out is taking it back to 0 over
        // the last stretch of its own window, which is what `leaving` says.
        //
        // THE AD AT FULL FRAME GETS NEITHER, and the two halves of that are in
        // different places: it is never `leaving` (see `leavingNow`), and here
        // its transition is `none`, so it arrives and goes with nothing.
        //
        // A NODE BUILT ON THE SPOT ARRIVES WITHOUT A FADE, and it costs no
        // branch (ADR 0050): it has no inline opacity to come from, so writing
        // 1 changes nothing and no transition starts. That node is the one a
        // seek into the middle of a window builds, where a fade would be wrong
        // anyway -- nobody is watching the ad arrive, they landed inside one
        // that was already running.
        const fades = animate && fadesInAndOut(entry.experience);
        // THE GEOMETRY OF A BOX THAT STAYS, AND IT IS THE ONLY GEOMETRY THAT
        // TRAVELS. `entry.px` is where this function last put this node, so a
        // node that has one is a node that was already on the screen: the way
        // in has none and gets none, and the way out is an opacity and a
        // `clear`, not a box going anywhere. What is left is the box that was
        // there before and is somewhere else now -- somebody raised a camera
        // and the grid re-shaped around it, or enlarged this one and it is on
        // its way to the whole picture -- which is exactly the gesture that was
        // asked for and exactly the one the primary content has always had.
        //
        // AND A RESIZE IS NOT ONE OF THEM, for free and not by a second check:
        // it is the one caller that places with `animate: false` (ADR 0053).
        const travels = animate && Boolean(entry.px) && moved(px, entry.px);
        if (travels) travelFrom(node, entry.px, px);
        else {
          sizeAsset(node, px);
          // AND THE TRANSFORM GOES BACK TO NOTHING ON EVERY OTHER PASS, which
          // is what keeps "the layout box is the truth" true. `none` is the
          // initial value, so on the nodes of an ad that never travels this
          // writes what was already there and creates no stacking context. On
          // a node caught in the middle of a travel -- the window changing
          // shape under the gesture -- what ends it is the list below no
          // longer naming `transform`: a property that leaves the list cancels
          // the transition running on it, and the node is left on the box
          // `sizeAsset` has just given it. Re-placed and not animated, which
          // is the answer ADR 0053 gives to a resize.
          node.style.transform = 'none';
        }
        // TWO PROPERTIES, TWO DURATIONS AND TWO CURVES, in the order the lists
        // are read in: an opacity has nowhere to arrive and a box does, so they
        // never shared a curve, and the box travels in the time of the
        // composition while the fade is the shorter one of its own direction.
        const moving = [];
        const fade = entry.leaving ? AD_FADE_OUT_MS : AD_FADE_IN_MS;
        if (fades) moving.push(['opacity', fade, FADE_EASING]);
        if (travels) moving.push(['transform', PRIMARY_MOVE_MS, MOVE_EASING]);
        node.style.transitionProperty = moving.length ? moving.map(([p]) => p).join(', ') : 'none';
        node.style.transitionDuration = moving.length
          ? moving.map(([, ms]) => `${ms}ms`).join(', ') : '0ms';
        node.style.transitionTimingFunction = moving.length
          ? moving.map(([, , easing]) => easing).join(', ') : FADE_EASING;
        node.style.opacity = entry.leaving ? '0' : '1';
        // The travel is this line and the transition above is what carries it:
        // the node is at its destination already and the transform is what is
        // holding it back, so letting go of the transform is the movement.
        if (travels) node.style.transform = 'none';
        // WHERE THIS NODE IS NOW, which is the only thing the next pass needs
        // to know to tell a box that moved from one that did not. It is a
        // rectangle and not an element, so it is not the memory `applyPlan`
        // forbids: a kept entry gets a new element on every pass, and this
        // says where the last one of them was drawn.
        entry.px = px;
      }
    }
  }

  /**
   * The first half of a travel: the node goes to its destination with no
   * transition, and a transform puts it back where it was.
   *
   * THE READ IS THE MECHANISM AND NOT A PRECAUTION. Two style changes inside
   * one turn of the event loop are one change as far as the browser is
   * concerned -- it would paint only the second and nothing would transition --
   * so something has to make it resolve the first before the second is written,
   * and reading a geometric property is what does that. It costs one layout per
   * box that is travelling, ONCE PER GESTURE and never per frame: what runs
   * sixty times a second after this is the transform, and that one is the
   * compositor's.
   */
  function travelFrom(node, from, to) {
    node.style.transitionProperty = 'none';
    sizeAsset(node, to);
    node.style.transformOrigin = '0 0';
    node.style.transform = transformFrom(from, to);
    void node.offsetWidth;
  }

  /**
   * `px` comes out of `boxToPixels` measured from the area, and the area is the
   * picture, which does not start where the container does. Adding the origin
   * is what turns one into the other, and it is the whole of the difference on
   * this side: an ad declared flush left lands on the left edge of the picture
   * instead of on the black bar beside it.
   */
  function sizeAsset(node, px) {
    node.style.position = 'absolute';
    node.style.left = `${area.left + px.left}px`;
    node.style.top = `${area.top + px.top}px`;
    node.style.width = `${px.width}px`;
    node.style.height = `${px.height}px`;
  }

  /**
   * The primary content shrinks with a transform (ADR 0001): its box is put on
   * the picture and the transform paints it into the box the layout asked for.
   * `transform-origin` at the top left is what makes the translate the box's own
   * left and top.
   *
   * THE BOX IS THE PICTURE, and the four lines that set it are the other half
   * of this task. The element arrives filling the container, which in fullscreen
   * over a screen of another shape is bigger than the picture and a different
   * shape; sized to the area instead, its box has the aspect ratio of the video,
   * so `object-fit` has nothing left to crop and the scale below is a scale of
   * the whole picture and not of a cropped one. And it is the same rectangle the
   * element occupies with no layout on screen, where the stylesheet fits the
   * video into the container without deforming it -- which is the same
   * arithmetic `imageBox` does. That is why the framing no longer changes on the
   * way in and out of a break: the two states name the same rectangle.
   *
   * `position` is not decoration and it is not the transform's doing: a
   * transform creates a stacking context of its own but does NOT make the
   * element positioned, and `z-index` on a static element is ignored. A primary
   * shrunk by a transform alone would therefore paint at the z-index 0 level
   * with its `zDepth` thrown away, and the layouts where the ad is the
   * background and the picture goes on top of it would come out inverted. With
   * this line the video and the ad nodes carry comparable z-indexes in the same
   * stacking context, which is what rule 2 needs. `absolute` and no longer
   * `relative` because what is being given is a box of its own rather than an
   * offset from where the page put it; it is positioned either way, so the
   * stacking argument is untouched.
   *
   * The scale is what the box asks for on each axis, and it is the same on both
   * for every layout the tool emits, because in all of them the primary's box
   * keeps the aspect ratio of the player area. A box that did not would deform
   * the picture right here, and the fill mode cannot save it: a transform
   * scales whatever `object-fit` already drew. That is the one case the crop
   * policy of ADR 0013 does not reach, so it says so out loud rather than
   * deforming quietly.
   */
  function movePrimary(node, px, animate = false) {
    if (!area.width || !area.height) return;
    const sx = px.width / area.width;
    const sy = px.height / area.height;
    // THE DECLARATION TRAVELS IN THE SAME PASS AS THE GEOMETRY, and that is not
    // tidiness: `clear` returns the primary content to the stylesheet by
    // removing its whole `style` attribute, which takes the transition with it.
    // What decides whether a transition runs is the style AFTER the change, so
    // writing both here is what makes the way in animate at all -- and writing
    // `none` on the resize path is what keeps that path instant.
    //
    // Only `transform`. The four lines below it are the base rectangle and they
    // are layout: animating them would cost a reflow per frame, and there is
    // nothing to see in them anyway, because they name the same rectangle every
    // time the area has not moved (ADR 0051).
    node.style.transitionProperty = animate ? 'transform' : 'none';
    node.style.transitionDuration = `${animate ? PRIMARY_MOVE_MS : 0}ms`;
    node.style.transitionTimingFunction = MOVE_EASING;
    node.style.position = 'absolute';
    node.style.left = `${area.left}px`;
    node.style.top = `${area.top}px`;
    node.style.width = `${area.width}px`;
    node.style.height = `${area.height}px`;
    node.style.transformOrigin = '0 0';
    node.style.transform = `translate(${px.left}px, ${px.top}px) scale(${sx}, ${sy})`;
    if (Math.abs(sx - sy) > 0.001) {
      console.warn('[renderer] the primary content box does not keep the aspect ratio of the' +
        ` player area: scale ${sx.toFixed(4)} by ${sy.toFixed(4)}. The picture is being deformed.`);
    }
  }

  /**
   * The audio of what is on screen, element by element, which is what the
   * layout declares and this file used to ignore on purpose (ADR 0014).
   *
   * TWO KINDS OF ELEMENT AND TWO RULES, and what separates them is which of the
   * two switches each one owns.
   *
   *   An element of the ad gets the volume the layout declared, and it is muted
   *   outright when that volume is 0. Muted and not merely at zero, because a
   *   node that is audible on paper is one the autoplay policy refuses to
   *   start, and the default of a layout that declares nothing is exactly 0:
   *   without this line the ordinary case would be four silent black boxes.
   *
   *   The primary content gets its declared volume too -- a mix that leaves the
   *   show at the same level as the ad it is being mixed against is not a mix --
   *   but its MUTE is never touched here. That switch is the audio of the
   *   composition, it belongs to whoever is watching, and the control that
   *   flips it is on the screen.
   *
   * THE COMPOSITION'S MUTE GATES THE ELEMENTS OF THE AD. The page starts muted
   * so that the autoplay policy lets it begin without a click, and an ad that
   * took its declared volume regardless would be the one thing making noise
   * before anybody asked for it. So this runs again on every `volumechange` of
   * the primary, which is where that switch lives.
   *
   * AND THE FOCUS DOES NOT TOUCH THAT SWITCH EITHER (ADR 0026). What it moves
   * is the level of each element, so the two are named apart: the switch
   * decides WHETHER anything is heard and the focus decides WHAT, of what is
   * heard. With the composition muted, taking a box changes what would be
   * heard and nothing is, because the gate below is still in place.
   */
  function applyAudio() {
    const off = video.muted;
    for (const { element, node, image } of drawn) {
      // A still has no audio. `volume` on an <img> is an expando that means
      // nothing to anybody, so it is not set rather than set uselessly.
      if (image) continue;
      const level = effectiveVolumeOf(element, focused);
      node.volume = level;
      if (!element.primary) node.muted = off || level === 0;
    }
  }

  /**
   * WHICH BOX IS BEING LISTENED TO, WHICH IS ONE ANSWER AND THEREFORE ONE
   * FUNCTION (ADR 0030): it moves the index, it moves the ring and it
   * recalculates the mix, in that order and in one place, so what is heard and
   * what is marked cannot come apart.
   *
   * `null` lets the focus go, and letting go is the same call. Of the four ways
   * out of a focus (ADR 0029) -- a touch on the box that already had it, the
   * composition being rebuilt, the asset running out, the break closing -- this
   * is the only door for every one of them.
   *
   * THE RING IS WRITTEN INLINE ONTO THE NODE, by this file. The one that draws
   * the controls is not allowed to touch this layer, and this one already owns
   * these nodes and already writes style onto them. And it survives the
   * auto-hide by construction and not by an exception: the auto-hide takes the
   * opacity of the controls' own layer down, and this mark lives on the other
   * one.
   */
  function setFocus(element) {
    focused = element ?? null;
    for (const { element: el, node, image } of drawn) {
      if (el.primary || image) continue;
      const on = el === focused;
      node.style.outline = on ? `${FOCUS_RING_PX}px solid ${FOCUS_RING_COLOUR}` : '';
      node.style.outlineOffset = on ? `-${FOCUS_RING_PX}px` : '';
    }
    applyAudio();
  }

  /**
   * THE PRIMARY'S OWN DOOR OUT OF THE FOCUS (ADR 0031, a correction of T-02).
   * The primary is not enfocable (ADR 0027), so it never gets the `pointerdown`
   * that toggles `setFocus` the way a box of the ad does -- releasing the
   * focus from a tap on the primary needs an entry point of its own. `true`
   * when it let something go, `false` when nobody was focused, and the answer
   * is what the caller -- the controls, on a tap on the primary -- reads to
   * decide whether that tap was for this or for the chrome.
   */
  function releaseFocus() {
    if (!focused) return false;
    setFocus(null);
    return true;
  }

  /**
   * WHICH BOX IS THE ONE THAT SOUNDS, asked from outside by the name the
   * contract gives it (ADR 0069). It is the mirror of `releaseFocus` and the
   * second user of the same seam: the chrome draws the button that takes a box
   * to full frame, the geometry of that is the state of whoever is watching,
   * and the audio of it is this one index -- so the chrome asks each side for
   * its half and neither one learns what the other is made of.
   *
   * THE PRIMARY CONTENT AND A STILL BOTH MEAN "NOBODY", and that is not a
   * refusal. Neither is enfocable (ADR 0027), and what makes the programme the
   * only thing heard is precisely nobody being focused, which is the mix the
   * layout declared. So the one sentence -- make this box the only one that
   * sounds -- has one answer for every box of the composition, and the caller
   * needs no branch.
   *
   * `false` when nothing on screen carries that `id`, which is the composition
   * having moved under the press.
   */
  function focusOn(id) {
    const entry = drawn.find((slot) => slot.element.id === id);
    if (!entry) return false;
    setFocus(entry.element.primary || entry.image ? null : entry.element);
    return true;
  }

  /**
   * Whether the elements of the ad are playing, which is a state of the
   * COMPOSITION and not a property of each one.
   *
   * IT IS THE SAME SHAPE AS `applyAudio`, and for the same reason. This file
   * used to propagate the TRANSITIONS of the primary -- its `play` and its
   * `pause` -- and separately decide the state of a node at the moment it was
   * created, which is one answer coming from two places. They disagree exactly
   * when a node is created while the composition is not playing: a seek that
   * lands inside the window of an ad with the composition paused built the node
   * and started it, so the ad played alone with everything else still.
   *
   * So the state is APPLIED and not propagated. This runs after every `build`
   * and again on every `play` and `pause` of the primary, and it reads
   * `video.paused` rather than remembering which event brought it here, so an
   * element that arrives late is governed exactly like one that was already
   * there.
   *
   * TWO THINGS IT DOES NOT DECIDE. Not the audio: every node is created muted
   * because an audible element is one the autoplay policy refuses to play, and
   * `applyAudio` is what gives it the volume the layout declared once it is
   * playing. And not the position: the `startAt` that `build` hands to
   * `attachAsset` already leaves the asset at the right second when the window
   * is joined in the middle, so what there is to govern here is WHETHER it
   * plays and not where.
   */
  function applyPlayback() {
    for (const { node } of playable()) {
      if (video.paused) node.pause();
      else node.play().catch(() => {});
    }
  }

  /**
   * The ad that is being taken off screen with asset still to play, which is
   * the one failure of this whole mechanism that NOTHING reports on its own.
   *
   * The window an ad gets is DECLARED -- it comes from numbers somebody wrote
   * in the signalling -- and the asset behind it is a real file with a real
   * length. When they disagree, an ad cut two seconds early looks exactly like
   * an ad that ended, and an ad that ran out early looks exactly like one that
   * is still playing: the defect survives any number of people watching the
   * recording. So the composition keeps following the window -- that is the
   * decision, and it is written in the contract -- and this file says out loud
   * every time the window and the asset were not the same length.
   */
  function warnIfCut({ element, node, experience, image }) {
    if (!experience || image || element.primary || node.ended) return;
    const asset = Number(node.duration);
    if (!Number.isFinite(asset)) return;
    const left = asset - Number(node.currentTime || 0);
    if (left <= CUT_TOLERANCE_SECONDS) return;
    console.warn(`[renderer] ${element.id}: taken off with ${left.toFixed(2)}s of its asset still` +
      ` unplayed -- the asset is ${asset.toFixed(2)}s long and the window it was given is` +
      ` ${experience.duration}s. The composition follows the window.`);
  }

  /**
   * WHAT LEAVES THE COMPOSITION GOES BACK TO NOTHING, AND IT IS ONLY WHAT THE
   * PLAN SAYS IS LEAVING. It used to be every element there was, which is the
   * same list whenever the only way to change a composition is to empty it; a
   * target with nothing in it still empties the whole of it, so the break that
   * closes and the last box that comes down go out through here exactly as
   * they always did (ADR 0070, ADR 0071).
   *
   * AND THE WAY OUT OF A MULTI VIEW HAS NO ROUTE OF ITS OWN (ADR 0071). Three
   * gestures end here and they are one event: the last box unticked, the
   * button of the way out in the chrome, and the window closing under whoever
   * is watching. NONE OF THEM RESTORES ANYTHING -- the `style` attribute is
   * removed whole and the page's stylesheet decides again -- so there is no
   * saved state that can be out of step with the screen. That is what makes
   * the invariant cheap, and it is why a second implementation of it would be
   * a regression even if it worked.
   *
   * THE SECOND AND FOURTH EXITS OF THE FOCUS (ADR 0029) ARE NO LONGER HERE, and
   * that is not them being dropped: they are asked in `apply`, where the
   * question can be the exact one -- whether the node that HAD the focus stopped
   * existing -- instead of the approximation this function could make when
   * everything stopped existing at once. The focus is still never kept by box
   * position nor by element `id`, which would hand a new advertiser the audio
   * somebody chose for another one, silently and by a coincidence of layout.
   */
  function clear(destroy) {
    for (const entry of destroy) warnIfCut(entry);
    for (const { element, node, detach } of destroy) {
      if (element.primary) {
        // Back to what the stylesheet says, which fits the video into the
        // container without deforming it -- the same rectangle `imageBox`
        // computes, and the reason the picture does not move when a break ends.
        node.removeAttribute('style');
        // And back to its own audio, which the style does not carry: `volume`
        // is a property. A break that declared a mix and left the show at the
        // 10 % of it would go on quietly for the rest of the programme, with
        // nothing on screen saying why -- the same failure as the mute default,
        // one break later. The mute is not touched, here either: it is the
        // viewer's.
        node.volume = 1;
        continue;
      }
      detach?.();
      node.remove();
    }
  }

  /**
   * The ad nodes that have a timeline, which are the ones the play, the pause
   * and the seek of the primary act on. A still has none, and one of the five
   * layouts is made only of stills.
   *
   * Their audio is not decided here: each one is created muted so that it can
   * start at all, and `applyAudio` gives it the volume its element declares.
   */
  function playable() {
    return drawn.filter((d) => !d.element.primary && !d.image);
  }

  // The ad follows the primary: the experience is concurrent with the content,
  // so the state of the composition is the state of every element of it, and
  // seeking inside the window moves them.
  //
  // The two of them are the same call and it takes no argument, which is the
  // point: what reaches the elements is `video.paused` and not the name of the
  // event, so there is one place that answers the question and `build` is not a
  // second one.
  video.addEventListener('play', applyPlayback);
  video.addEventListener('pause', applyPlayback);
  video.addEventListener('seeked', () => {
    for (const { node, experience } of playable()) {
      node.currentTime = Math.max(0, video.currentTime - experience.startTime);
    }
  });

  // The audio of the composition is the primary's own mute, and flipping it has
  // to reach the elements of the ad: that is the fourth event this file follows
  // and the reason `applyAudio` is not a thing that only runs when a break
  // starts.
  video.addEventListener('volumechange', applyAudio);

  // A frame loop and not `timeupdate`: the box has to follow the player area
  // when the window is resized or somebody goes fullscreen mid-ad, and
  // `timeupdate` only fires four times a second.
  (function loop() {
    tick();
    requestAnimationFrame(loop);
  })();

  return { tick, get drawn() { return drawn; }, FILL_MODE, releaseFocus, focusOn };
}
