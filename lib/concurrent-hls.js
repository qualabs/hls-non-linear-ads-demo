// concurrent-hls.js -- the entry point of the library, and the whole of its
// public surface.
//
// The library is the two layers of ADR 0003 -- signalling and rendering -- plus
// the piece that turns a `uri` into pixels, the state of whoever is watching,
// and the controls of the composition, packaged as one classic script that
// defines a global. What an integrator writes is a <script src>, a container,
// and one call. Everything else on this side of the line is ours: the layer the
// experience is drawn into, the boxes, the second instances that play the
// assets, the selection whoever is watching makes, and the controls (ADR 0015).
//
// THERE ARE TWO CALLS AND THEY ARE NOT A CHOICE OF STYLE. `attach` turns the
// concurrent experience on over an instance of the player library.
// `attachControls` draws the chrome on a player and does nothing else -- no
// instance, no signalling, no layer -- because the two are separable and an
// integrator can want one without the other (ADR 0015). What that costs in
// surface is one function; what it buys is that the chrome can go over a player
// this library does not drive at all.
//
// The surface is deliberately NOT frozen yet. ADR 0015 fixes it with the
// controls built and not before, because the controls are most of it.

import { createSignalling, CONCURRENT_CLASS, MULTIVIEW_CLASS, VIDEO_DECODERS_PARAM, IMAGE_OVER_VIDEO_PARAM } from './signalling.js';
import { createMultiview } from './multiview.js';
import { createRenderer } from './renderer.js';
import { createControls } from './controls.js';
import { attachAsset } from './media.js';

export const VERSION = '0.1.0';

/**
 * The configuration the player library has to be built with, ready to be spread
 * into whatever else the integrator passes:
 *
 *     new Hls({ ...myConfig, ...QualabsConcurrentHls.hlsConfig })
 *
 * It is one key and it is the one thing about the instance that this library
 * cannot fix for the integrator afterwards, so it is handed over rather than
 * described. Why it is needed is ADR 0002: the interstitials machinery of the
 * player library is closed over Apple's interstitial class, so a Date Range of
 * the concurrent class never reaches it, and the machinery is one of
 * REPLACEMENT anyway -- it hands the same MediaSource back and forth between
 * the primary and the asset, which is the opposite of drawing two sources at
 * once. The tags are not lost: the parser keeps every Date Range regardless of
 * class and they arrive on LEVEL_UPDATED, which is where the signalling layer
 * picks them up.
 */
export const hlsConfig = { interstitialsController: undefined };

/**
 * Whether this instance was built with the interstitials machinery on, and the
 * message if it was.
 *
 * THIS LIBRARY VERIFIES AND WARNS. It does not require and it does not merely
 * document, and the reason is the shape of the failure. The integrator builds
 * his own instance -- that is the surface ADR 0015 fixes -- and the controller
 * is instantiated in the constructor, gated on nothing but the truthiness of
 * `config.interstitialsController`, so by the time the instance reaches this
 * function the machinery either exists or does not and no call from here can
 * change it. Leaving it at documentation is not enough: with the machinery on,
 * the player schedules the Apple-class Date Range that the same playlist
 * carries and replaces the content with it, so what the integrator gets is a
 * perfectly ordinary player and no error of any kind. He would be looking at a
 * page that works, doing the one thing this library exists not to do. And
 * throwing is a bigger promise than a plugin gets to make: taking somebody's
 * page down over a configuration he can fix in one line is worse than telling
 * him, loudly, what to change.
 */
function checkConfig(hls) {
  const on = Boolean(hls?.config?.interstitialsController);
  const message = on
    ? 'the player instance was built with its interstitials machinery ON. That machinery ' +
      'replaces the content with the ad instead of playing them together, and it will ' +
      'schedule the traditional interstitial that the same playlist carries. Build the ' +
      'instance with `new Hls({ ...QualabsConcurrentHls.hlsConfig })` (ADR 0002).'
    : null;
  if (message) console.error(`[concurrent] ${message}`);
  return { interstitialsControllerOn: on, message };
}

/**
 * The container as a positioning context, which BOTH entry points need and for
 * the same reason: what each of them draws inside it is positioned absolutely.
 * The boxes of a layout in one case; the chrome in the other, which is
 * `position: absolute; inset: 0` and would otherwise land against whatever
 * ancestor happens to be positioned.
 *
 * It writes an inline style over one value only -- `static`, the one that would
 * break it -- so an integrator whose stylesheet already made the container a
 * context keeps his own rule untouched. And it is not left to him to get right:
 * the failure is silent and it is one line to fix, which is the same shape as
 * the configuration check above.
 */
function ensurePositioned(container) {
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
}

/**
 * The layer the experience is drawn into: created here, inside the container,
 * because it is the drawing surface of the renderer and not something the
 * integrator should have to get right.
 *
 * Three properties and no fourth, and the fourth is the point. It is positioned
 * and it covers the container, so the boxes the renderer writes in pixels land
 * over the picture; it takes no pointer events, so it does not swallow the
 * clicks that belong underneath; and it deliberately has NO `z-index`. At
 * `z-index: auto` the layer is not a stacking context, so the ad boxes inside
 * it and the primary video -- which is its sibling and not its child -- compete
 * in the same stacking context and the `zDepth` of the layout is what decides
 * who is on top. Closing it (a z-index, a transform, a filter, an opacity below
 * 1) would put every ad above the picture, and there are layouts where the ad
 * is the background. That invariant is the library's and it is why the layer is
 * not a div the integrator writes and styles.
 *
 * THE PROPERTY THAT TAKES NO POINTERS STAYS AS IT IS, AND A BOX OF THE AD TURNS
 * THEM BACK ON FOR ITSELF (ADR 0028). The touch that moves the focus of the
 * audio is taken by the node inside this layer and never by the layer, so what
 * is underneath is still not having its clicks swallowed: the renderer writes
 * `pointer-events: auto` onto the boxes of video it draws, one by one and only
 * while they are on screen. The absent `z-index` stays absent, which is the
 * other half of this comment and the half nothing has a reason to touch.
 */
function createLayer(container) {
  ensurePositioned(container);
  const layer = document.createElement('div');
  layer.className = 'qa-concurrent-layer';
  // The picture is the ad itself: there is nothing to describe here that is not
  // already on screen.
  layer.setAttribute('aria-hidden', 'true');
  layer.style.position = 'absolute';
  layer.style.inset = '0';
  layer.style.pointerEvents = 'none';
  container.appendChild(layer);
  return layer;
}

/**
 * The ranges THIS player plays, which is what its bar marks (ADR 0018).
 *
 * The contract of ADR 0003 carries EVERY kind of range over the same timeline,
 * on purpose, and they are not all the same player's. Two of them are drawn over
 * the content without ever stopping it: the concurrent ad, and the offer of
 * several feeds whoever is watching picks from (ADR 0063). The third is the
 * traditional one the same playlist signals in every break for the clients
 * already in the market, which nothing on this side plays. All of them are data
 * -- they are what makes the pair of clients readable at all -- and only some of
 * them are breaks of THIS player. A bar that marked the other one would be
 * reporting somebody else's playback on our rail, which is the defect ADR 0018
 * pays off.
 *
 * IT IS DECIDED HERE AND NOT IN THE BAR, and that is the part worth writing
 * down. The same chrome goes over a player this library does not manage, and
 * there what is played is the other kind, in the colour that kind already
 * carries. So a bar cannot pick a kind: it draws every range it is handed, and
 * whoever wires a provider to a bar is the one who knows what the player behind
 * it takes.
 *
 * IT IS A SET AND NOT A CONSTANT, and ADR 0063 is what that bought: this is a
 * list of what this player plays and never a definition of any one class, so a
 * second kind drawn over the content is one more entry and nothing else. What
 * keeps it OUT of the table of colours and names is the opposite property --
 * those two are indexed by every kind that can cross, because the same chrome
 * marks the replacement kind on the rail of a player that does play it. The
 * three tables therefore do not hold the same keys, and that is asserted rather
 * than assumed: the one thing that must never happen is a kind this player plays
 * with no colour and no name, which is a break missing from the bar.
 *
 * It is exported for that assertion and for no other reason: nothing outside
 * this file reads it.
 */
export const KINDS_PLAYED = new Set(['concurrent', 'multiview']);

function playedRanges(provider) {
  return {
    programRanges: () => {
      const { ranges, settled } = provider.programRanges();
      return { ranges: ranges.filter((r) => KINDS_PLAYED.has(r.kind)), settled };
    }
  };
}

/**
 * Turn the concurrent experience on for an instance of the player library.
 *
 * @param hls          the instance, already built. Its media element is taken
 *                     from it -- either it is attached already or it arrives on
 *                     MEDIA_ATTACHED -- so there is nothing to pass twice.
 * @param container    the positioned box the composition lives in. The library
 *                     draws inside it and moves the primary content within it
 *                     (ADR 0015), so the media element has to be inside it too.
 * @param video        optional, only if the media element is not the one the
 *                     instance is attached to.
 * @param onResolved   optional, called with the experiences of each asset-list
 *                     as they resolve, and with what the filter of
 *                     `capabilities` did with that break (ADR 0085).
 * @param logo         optional, `{ src, alt }`: the integrator's own mark, drawn
 *                     in the corner of the composition on a light plate, inside
 *                     the container so that it is in the frame in fullscreen
 *                     too. It is a file of his and not one of ours, for the same
 *                     reason the accent colour of the chrome is a CSS custom
 *                     property (`--qa-accent`) and not a constant of this
 *                     library: what gets embedded in somebody else's page
 *                     carries his brand or none.
 * @param capabilities optional, `{ videoDecoders, imageOverVideo }`: what the
 *                     device can draw, one axis at a time (R29.1, ADR 0086).
 *                     `videoDecoders` counts the primary content too, so a
 *                     device that can show one ad video beside the programme
 *                     declares 2; `imageOverVideo` is whether it can draw an
 *                     image over the video. HTML is not an axis here because
 *                     this library does not draw HTML.
 *
 *                     IT IS USED TWICE. It travels to the ad presentation
 *                     server on the asset-list request, one parameter per axis
 *                     (`VIDEO_DECODERS_PARAM`, `IMAGE_OVER_VIDEO_PARAM`), which
 *                     is where the server SHOULD use it. And it is checked
 *                     again on this side before anything is drawn: of the
 *                     options an ad carries, the first one it satisfies is the
 *                     one drawn, and with none left the break plays its
 *                     default linear ad or is skipped (ADR 0085). A server that
 *                     ignores the capability produces the same screen as one
 *                     that honours it.
 *
 *                     IT IS ASKED FOR AND NOT DETECTED: what else on that page
 *                     is decoding at the same time is something only the
 *                     application knows. Leaving it out, or leaving out an
 *                     axis, is a supported state: nothing is added to the
 *                     request for it and nothing is filtered on it.
 * @returns            a handle: the contract of ADR 0003 (`provider`), the
 *                     layer, the renderer and the controls once there is a media
 *                     element, and the diagnosis of the instance's configuration.
 *
 *                     `provider` IS THE DECORATED ONE, which is the same
 *                     contract and the honest one: what it reports active is
 *                     what is on the screen, boxes and all, so a page that
 *                     traces the contract traces what is drawn and not what
 *                     would have been drawn if nobody had chosen anything.
 */
export function attach(hls, {
  container, video = null, onResolved = null, logo = null, capabilities = null
} = {}) {
  if (!hls) throw new TypeError('[concurrent] attach(hls, options): the player instance is required');
  if (!container) throw new TypeError('[concurrent] attach(hls, options): `container` is required');

  const diagnostics = checkConfig(hls);
  const layer = createLayer(container);
  // THE STATE OF WHOEVER IS WATCHING GOES IN THE MIDDLE, AND NOBODY DOWNSTREAM
  // IS TOLD (ADR 0072). `createMultiview` decorates the provider: same
  // signature, same meaning, and everything that is not an offer crosses it as
  // the same object in the same place of the list. So what the renderer is
  // handed is the contract of ADR 0003 and it never learns that somebody is
  // choosing -- which is the property that let the offer be added without the
  // drawing side changing by a field.
  //
  // IT IS BUILT HERE BECAUSE THIS IS THE ONLY PLACE THAT HOLDS BOTH ENDS. The
  // decorator has a second face -- `offerAt`, `rows`, `toggle` -- which is what
  // the selector in the chrome is driven by, and the chrome is built in this
  // function too. Underneath, a viewer's choices would live in the file that is
  // defined by knowing the transport; above, the drawing side would have to
  // learn what an offer is. Both were refused, and what is left is this line.
  //
  // IT IS ALWAYS ON AND THERE IS NOTHING TO SWITCH OFF. A playlist that signals
  // no offer resolves none, so `offerAt` answers `null` for the whole programme
  // and `createControls` draws neither the button nor the list: a player of a
  // single feed comes out exactly as it did before this line existed. An option
  // would be a second way to say what the playlist already says.
  const provider = createMultiview(
    createSignalling(hls, { onResolved: onResolved || undefined, capabilities })
  );

  let renderer = null;
  let controls = null;
  let media = null;

  function start(element) {
    if (renderer || !element) return;
    // The renderer moves this element inside the container with a transform, so
    // an element that lives somewhere else would be dragged around outside the
    // box the integrator gave us. Same reasoning as the configuration check: it
    // is silent, and it is one line for him to fix.
    if (!container.contains(element)) {
      console.error('[concurrent] the media element is not inside the container. The primary ' +
        'content is moved and scaled within the container, so it has to be a descendant of it.');
    }
    media = element;
    renderer = createRenderer({
      provider,
      video: element,
      layer,
      attachAsset,
      // The whole of the wiring of the focus of the audio (ADR 0028): the
      // renderer asks whether the controls are up, the controls answer, and
      // neither one learns what the other is made of -- the renderer never
      // reads a class of the chrome and the chrome never learns what a box of
      // an ad is. It is a function, so it is asked at the moment of the touch,
      // which is why it does not matter that the controls are built on a line
      // below this one.
      chromeUp: () => controls?.up() ?? false
    });
    // After the ad layer and never before it, so that the controls are the last
    // child of the container. Their own z-index is what puts them above every
    // element of every layout; the order in the DOM is what makes that visible
    // in a snapshot instead of only in a computed style.
    // The provider goes in for one reason and it is the only thing the controls
    // ask of it: `programRanges()`, to mark the breaks on the bar. It is the
    // same contract the renderer gets and it crosses the same seam -- but the
    // bar gets a VIEW of it and not the whole of it, because a bar marks what
    // its own player plays and this one does not play both kinds. See
    // `playedRanges`.
    controls = createControls({
      container, video: element, provider: playedRanges(provider), logo,
      // The reverse half of the wiring above (ADR 0031, a correction of
      // T-02): a tap on the primary asks the renderer to let go of whatever
      // box has the focus, and the renderer answers and acts in the same
      // call. Same shape as `chromeUp`, same reason it is a function and not
      // a value -- asked at the moment of the touch, so the build order of
      // the two pieces still does not matter.
      releaseFocus: () => renderer?.releaseFocus() ?? false,
      // The other half of the same seam (ADR 0069). The button on a box is
      // drawn by the chrome, because enlarging is two things at once and
      // neither side owns both: the box goes to full frame, which is the
      // selection, and the box takes the audio, which is the renderer's one
      // index. The chrome asks each side for its half, and this is the line
      // that hands it the second one.
      focusOn: (id) => renderer?.focusOn(id) ?? false,
      // The selector of ADR 0067, and it is THE SAME OBJECT the renderer was
      // given a few lines above. What somebody ticks and what gets drawn are
      // two faces of one piece of state, so there is no copy to keep in step
      // and no event to forward: the tick writes the selection, and the next
      // `activeAt` the renderer asks for already carries the boxes.
      multiview: provider
    });
  }

  const attached = video || hls.media || null;
  if (attached) start(attached);
  else hls.on(Hls.Events.MEDIA_ATTACHED, (_event, data) => start(data?.media));

  return {
    container,
    layer,
    provider,
    diagnostics,
    get video() { return media; },
    get renderer() { return renderer; },
    get controls() { return controls; }
  };
}

/**
 * Draw the chrome on a player, and do nothing else to it.
 *
 * IT RECEIVES NO INSTANCE, and the signature is what says so. The controls read
 * four properties off what they are handed -- `currentTime`, `duration`,
 * `paused` and `muted` -- and write them back, so they need no transport and
 * they are given none. This call creates no layer, resolves no experience, asks
 * the network for nothing, and applies no `transform` to the element: it is
 * `createControls` plus the positioning context they stand on.
 *
 * WHY A SECOND FUNCTION AND NOT AN OPTION OF `attach`. `attach` requires an
 * instance that this call has nothing to do with, and it does five things of
 * which an option would have to switch off four. One of those four is the
 * diagnosis of the configuration, and that one settles it: `checkConfig` shouts
 * when the machinery of replacement is on, and a player that is already in the
 * market has it on ON PURPOSE. An option would make the library silence its own
 * alarm according to a flag, and an alarm with a switch is the one the next
 * person turns off for the wrong reason.
 *
 * @param video      what plays the programme. A media element -- or anything
 *                   that reports and accepts those four properties and forwards
 *                   `addEventListener`, `play` and `pause` to one. That is not
 *                   a loophole, it is the point of the seam: a player whose
 *                   element stops reporting the programme while an ad is on
 *                   screen can hand over a facade that does, and the bar then
 *                   draws one timeline instead of two.
 * @param container  the box the controls are drawn in, and the element that
 *                   goes fullscreen. The element they command has to be inside
 *                   it.
 * @param provider   optional, the contract of ADR 0003. `programRanges()` is
 *                   the only thing read off it, and WHAT IT HANDS OVER IS WHAT
 *                   THIS PLAYER PLAYS: a bar marks its own player's breaks
 *                   (ADR 0018), so the ranges have to come out of the player
 *                   the bar is drawn on. It is the contract and not this
 *                   library's implementation of it.
 * @param logo       optional, `{ src, alt }`, the same option `attach` takes.
 * @returns          a handle: the container, what it was handed, and the
 *                   controls it built.
 */
export function attachControls(video, { container, provider = null, logo = null } = {}) {
  if (!video) {
    throw new TypeError('[concurrent] attachControls(video, options): the media element is required');
  }
  if (!container) {
    throw new TypeError('[concurrent] attachControls(video, options): `container` is required');
  }
  ensurePositioned(container);
  const controls = createControls({ container, video, provider, logo });
  return { container, video, controls };
}

/**
 * What the built script hangs off the global.
 *
 * The two capability parameters and the two class names are here for the same reason:
 * they are the names this library writes onto the wire, where somebody else --
 * a packager, an ad server, whoever reads the request log -- has to recognise
 * them. A name of that kind that lives only in a document is a name two people
 * can spell differently.
 *
 * THE TWO CLASSES TRAVEL TOGETHER because they are written the same way and
 * read by the same stranger. Publishing one and not the other is not a smaller
 * surface: it is one of the two names spelled by hand at the other end, which
 * is the failure this export exists to prevent.
 */
export const QualabsConcurrentHls = {
  VERSION,
  CONCURRENT_CLASS,
  MULTIVIEW_CLASS,
  VIDEO_DECODERS_PARAM,
  IMAGE_OVER_VIDEO_PARAM,
  hlsConfig,
  attach,
  attachControls
};
