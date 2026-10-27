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

// One line: the build strips import lines, and only whole ones.
import { createSignalling, createProgramme, linearOnScreen, programmeAtEnd, scheduledRanges, CONCURRENT_CLASS, MULTIVIEW_CLASS } from './signalling.js';
import { VIDEO_DECODERS_PARAM, IMAGE_OVER_VIDEO_PARAM } from '../lib/ad-list.js';
import { createMultiview } from '../lib/multiview.js';
import { createRenderer } from '../lib/renderer.js';
import { createControls } from '../lib/controls.js';
import { attachAsset } from './media.js';
import { firstRequest } from '../lib/media.js';
import { createTracking } from '../lib/tracking.js';
import { createPostRoll } from '../lib/postroll.js';
import { createLayer, ensurePositioned } from '../lib/layer.js';

export const VERSION = '0.1.0';

/**
 * Whether this instance was built with the interstitials machinery of hls.js
 * on, and the message if it was not.
 *
 * THE MACHINERY STAYS ON, AND THAT IS THE DEFAULT OF hls.js (ADR 0114, which
 * supersedes ADR 0002). One stream may carry Apple's traditional interstitial
 * next to our breaks, never overlapping (ADR 0113), and that kind is hls.js's to
 * play: it replaces the programme with the ad, which is what it is for. This
 * library draws its own two classes, which that machinery never schedules --
 * it is closed over Apple's class (`dateRange.isInterstitial`) -- so the two do
 * not compete for a break. An integrator therefore builds his instance as he
 * would anyway, `new Hls(myConfig)`, and there is nothing to spread into it.
 *
 * IT WARNS WHEN THE MACHINERY IS OFF, and only warns. Off, nothing of ours
 * breaks, but a traditional interstitial the stream carries plays nowhere: the
 * player shows the programme straight through a break somebody sold. That can
 * be what the integrator wants, so it is a warning and not an error. The check
 * reads the configuration because hls.js instantiates the controller in the
 * constructor, gated on nothing but `config.interstitialsController`.
 */
function checkConfig(hls) {
  const on = Boolean(hls?.config?.interstitialsController);
  const message = on
    ? null
    : 'the player instance was built with its interstitials machinery OFF, so a traditional ' +
      'interstitial (CLASS="com.apple.hls.interstitial") in the stream will not play in this ' +
      'player. Build the instance without `interstitialsController: undefined` (ADR 0114).';
  if (message) console.warn(`[concurrent] ${message}`);
  return { interstitialsControllerOn: on, message };
}

/**
 * The ranges THIS player plays, which is what its bar marks (ADR 0018).
 *
 * The contract of ADR 0003 carries EVERY kind of range over the same timeline,
 * on purpose, and they are not all the same player's. Two of them are drawn over
 * the content without ever stopping it: the concurrent ad, and the offer of
 * several feeds whoever is watching picks from (ADR 0063). The third is the
 * traditional one, which replaces the content and which this library does not
 * draw: hls.js plays it (ADR 0114). All of them are data, and a bar marks only
 * what its own player plays (ADR 0018); for the third kind that is hls.js's
 * schedule, not the tag.
 *
 * IT IS DECIDED HERE AND NOT IN THE BAR, and that is the part worth writing
 * down. The same chrome goes over a player this library does not manage, and
 * there what is played is the other kind, in the colour that kind already
 * carries. So a bar cannot pick a kind: it draws every range it is handed, and
 * whoever wires a provider to a bar is the one who knows what the player behind
 * it takes.
 *
 * SINCE ADR 0114 IT IS WHAT THIS LIBRARY DRAWS, and the replacement kind is
 * played too, by hls.js in the same instance; its marks come from hls.js's
 * schedule and not from this set (`playedRanges` below).
 *
 * IT IS A SET AND NOT A CONSTANT, and ADR 0063 is what that bought: this is a
 * list of what this player draws and never a definition of any one class, so a
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

/**
 * WHAT THE BAR OF OUR PLAYER MARKS: the kinds this library draws, off the
 * contract, and the traditional interstitials hls.js plays in the same instance,
 * off ITS schedule (ADR 0114). The second half is the reading the stock pane of
 * the pair already made for its own bar: a bar marks what its player plays
 * (ADR 0018), and what hls.js scheduled -- skipped breaks and spent ONCE ones
 * left out -- only hls.js knows. The range the signalling reports off the
 * Apple tag is NOT used for it, which is why `KINDS_PLAYED` still leaves that
 * kind out: it would be the playlist's word, not the player's.
 */
function playedRanges(provider, hls) {
  const skipped = new Set();
  return {
    programRanges: () => {
      const { ranges, settled } = provider.programRanges();
      const drawn = ranges.filter((r) => KINDS_PLAYED.has(r.kind));
      const replaced = scheduledRanges(hls.interstitialsManager?.events, skipped);
      return { ranges: [...drawn, ...replaced].sort((a, b) => a.startTime - b.startTime), settled };
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
 *                     `capabilities` did with that break (ADR 0085): per
 *                     asset, each option discarded and why -- including the
 *                     ones pre-validation passed over because the first
 *                     request for one of their assets failed (ADR 0106) --,
 *                     the order the rest were handed to the renderer in
 *                     (`order`), every first request made (`requests`), and
 *                     whether pre-validation ran (`preValidation`). It says
 *                     what was HANDED OVER; what was shown is `onPresented`.
 * @param onPresented  optional, called once per ad when it is known which of
 *                     its options was actually presented (ADR 0107): `{ id,
 *                     itemId, outcome: 'presented' | 'skipped', presented:
 *                     { index, type, linear } | null, attempts, late, lateBy }`.
 *                     `attempts` is every option that failed to load on screen
 *                     before it, each `{ index, type, linear, uri, reason,
 *                     late }`, and `late` says the one presented was mounted
 *                     after its window had opened. Distinct from `onResolved`
 *                     because it happens later and on the other side of the
 *                     seam: the renderer's failover is always on, and it is
 *                     the only one that knows.
 * @param onTracking   optional, called when an experience goes on screen and
 *                     when it leaves it: `{ type: 'slotStart' | 'slotEnd', time,
 *                     id, itemId, experienceType, startTime, duration,
 *                     identifiers }`, where `identifiers` are the AdIdentifiers
 *                     of its Slot, `{ scheme, value }` (ADR 0093). It is the
 *                     place to fire a beacon or count an impression; nothing in
 *                     the library depends on it. A linear ad played after the
 *                     programme, a post-roll (`CUE="POST"`, ADR 0111), is
 *                     reported here and in `onPresented` too, with
 *                     `postroll: true`.
 * @param logo         optional, `{ src, alt }`: the integrator's own mark, drawn
 *                     in the corner of the composition on a light plate, inside
 *                     the container so that it is in the frame in fullscreen
 *                     too. It is a file of his and not one of ours, for the same
 *                     reason the accent colour of the chrome is a CSS custom
 *                     property (`--qa-accent`) and not a constant of this
 *                     library: what gets embedded in somebody else's page
 *                     carries his brand or none.
 * @param capabilities optional, `{ concurrentVideo, concurrentImage }`: what
 *                     the device can draw, the two properties SVTA2053 5.3.3
 *                     requires the configuration of the library to hold (ADR
 *                     0104). `concurrentVideo` is how many video decoders can
 *                     decode and compose at the same time, the one of the
 *                     primary content included, so a device that can show one
 *                     ad video beside the programme sets 2; `concurrentImage`
 *                     is whether it can composite an image over video. HTML is
 *                     not a capability here because this library does not
 *                     draw HTML.
 *
 *                     IT IS ALWAYS USED ON THIS SIDE: before anything is drawn,
 *                     of the `layoutOptions` an ad carries, the first one the
 *                     capabilities fit is the one drawn, and with none left the
 *                     break plays its default linear ad or is skipped (ADR
 *                     0085). A server that ignores the capabilities produces
 *                     the same screen as one that honours them. "Fit" also
 *                     means "loads": every option that fits is handed to the
 *                     renderer in order, and when an asset of the one mounted
 *                     fails its first load, the renderer takes the whole
 *                     option down and mounts the next, then the linear
 *                     default, then nothing (ADR 0107). That failover is
 *                     always on.
 *
 *                     IT IS SET AND NOT DETECTED: what else on that page is
 *                     decoding at the same time is something only the
 *                     application knows. Leaving it out, or leaving out one of
 *                     the two, is a supported state: a capability that is not
 *                     configured discards nothing and is not sent.
 * @param sendCapabilities optional, default `true`: whether the configured
 *                     capabilities ALSO travel to the ad presentation server on
 *                     the asset-list request, one parameter per capability
 *                     (`VIDEO_DECODERS_PARAM` with `concurrentVideo`,
 *                     `IMAGE_OVER_VIDEO_PARAM` with 1 or 0 for
 *                     `concurrentImage`), which is where the server SHOULD use
 *                     them. Sending them is OPTIONAL in SVTA2053 5.3.3: they add
 *                     to what can fingerprint a device or a viewer, so they
 *                     should be sent only where the security and personal data
 *                     policies that apply to the integrator allow it, and where
 *                     they allow it sending is RECOMMENDED. Set it to `false`
 *                     where they do not: the filter above keeps working on what
 *                     was configured.
 * @param preValidateAssets optional, default `false`: whether the first request
 *                     for each asset of an option is ALSO made up front, when
 *                     the break's asset-list is resolved, so that an option
 *                     whose asset does not answer is left out before the
 *                     renderer is handed the list (ADR 0106, ADR 0107). It
 *                     only discards; the failover stays the renderer's. Off by
 *                     default because with a real ad decisioning service an
 *                     extra request per asset can be time-sensitive and
 *                     costly, so the library makes none unless asked.
 * @param preValidateMethod optional, `'GET'` (default) or `'HEAD'`: the method
 *                     of that request for a playlist or a file. An image is
 *                     always checked by loading it as an image. A 405 or 501
 *                     to a HEAD is asked again with GET; a 403 is not, and
 *                     that is the trap of signed URLs: an S3 or CloudFront URL
 *                     presigned for GET answers 403 to a HEAD. Any other value
 *                     is warned about and is 'GET'. TO REVISIT: see
 *                     `firstRequest` in media.js.
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
  container, video = null, onResolved = null, onPresented = null, onTracking = null, logo = null,
  capabilities = null, sendCapabilities = true, preValidateAssets = false, preValidateMethod = 'GET'
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
    createSignalling(hls, {
      onResolved: onResolved || undefined, capabilities, sendCapabilities, firstRequest,
      preValidateAssets, preValidateMethod
    })
  );

  let renderer = null;
  let controls = null;
  let media = null;
  let tracking = null;
  let postRoll = null;
  let programme = null;

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
    programme = createProgramme(hls, element);
    // ONE BREAK AT A TIME ON THE SCREEN (ADR 0114). While hls.js plays one of
    // its own interstitials the programme is not on screen -- the ad replaced
    // it, and with the MediaSource handed to the asset the element's clock is
    // the ad's -- so nothing of ours is drawn over it: the renderer is handed
    // no experience for that time, and neither is the tracking that reads what
    // the renderer presents. Overlap is not resolved here (ADR 0113 says the
    // two kinds never overlap); this only keeps our boxes off hls.js's ad.
    const drawable = {
      activeAt: (time) => (linearOnScreen(hls.interstitialsManager) ? [] : provider.activeAt(time))
    };
    renderer = createRenderer({
      provider: drawable,
      video: element,
      layer,
      attachAsset,
      onPresented,
      // The whole of the wiring of the focus of the audio (ADR 0028): the
      // renderer asks whether the controls are up, the controls answer, and
      // neither one learns what the other is made of -- the renderer never
      // reads a class of the chrome and the chrome never learns what a box of
      // an ad is. It is a function, so it is asked at the moment of the touch,
      // which is why it does not matter that the controls are built on a line
      // below this one.
      chromeUp: () => controls?.up() ?? false
    });
    // Fed what the renderer PRESENTS, which is the decorated provider with the
    // failover of ADR 0107 applied: an ad skipped because nothing of it loaded
    // is not an impression, and a linear default is reported as what it is
    // (ADR 0093). The ad keeps its `itemId` across its options, so falling to
    // the next option is not a second ad.
    if (onTracking) {
      tracking = createTracking({
        provider: { activeAt: (time) => renderer.presentedAt(time) }, video: element, onTracking
      });
    }
    // WHAT PLAYS AFTER THE PROGRAMME (ADR 0111): the linear defaults of the
    // post-rolls, by their own clock, because the programme's has stopped. Same
    // layer, same `attachAsset`, and the same two callbacks, whose messages say
    // `postroll: true`.
    // `programmeEnded`: the element also ends at the end of an interstitial
    // asset hls.js played on it, and that is not the end of the programme.
    postRoll = createPostRoll({
      provider, video: element, layer, attachAsset, onPresented, onTracking,
      programmeEnded: () => programmeAtEnd(hls.interstitialsManager)
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
    // The chrome is handed THE PROGRAMME and not the element (ADR 0114): while
    // hls.js plays one of its interstitials the element may be reporting the
    // ad, and the bar is the programme's rail.
    controls = createControls({
      container, video: programme, provider: playedRanges(provider, hls), logo,
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
    // The programme's clock and controls, as the chrome gets them (ADR 0114):
    // the element, except while hls.js plays one of its interstitials.
    get programme() { return programme; },
    // Whether hls.js is playing one of its interstitials right now.
    linearOnScreen: () => linearOnScreen(hls.interstitialsManager),
    get renderer() { return renderer; },
    // What is ON SCREEN at a second, which is `provider.activeAt` with the
    // renderer's failover applied (ADR 0107): the option mounted after the
    // ones that failed to load, the linear default, or nothing. Before there
    // is a renderer it is what the provider says.
    presentedAt: (time) => (renderer ? renderer.presentedAt(time) : provider.activeAt(time)),
    get tracking() { return tracking; },
    // The post-rolls being played after the programme, if any (ADR 0111).
    get postRoll() { return postRoll; },
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
 * diagnosis of the configuration: `checkConfig` reads an instance, and this
 * call is handed none, so an option would make the library diagnose a player it
 * never saw.
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
  attach,
  attachControls
};
