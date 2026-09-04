// concurrent-hls.js -- the entry point of the library, and the whole of its
// public surface.
//
// The library is the two layers of ADR 0003 -- signalling and rendering -- plus
// the piece that turns a `uri` into pixels, packaged as one classic script that
// defines a global. What an integrator writes is a <script src>, an instance of
// the player library, a container, and one call to `attach`. Everything else on
// this side of the line is ours: the layer the experience is drawn into, the
// boxes, the second instances that play the assets, and from T-03 on, the
// controls of the composition (ADR 0015).
//
// The surface is deliberately NOT frozen yet. ADR 0015 fixes it with the
// controls built and not before, because the controls are most of it.

import { createSignalling, CONCURRENT_CLASS } from './signalling.js';
import { createRenderer } from './renderer.js';
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
 */
function createLayer(container) {
  // The boxes are absolute inside this layer, so the container has to be a
  // positioning context. If the integrator's stylesheet already made it one,
  // nothing is touched.
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
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
 * @param audioControl optional element that turns the ad's sound on. Provisional:
 *                     T-03 replaces it with the controls of the composition.
 * @param onResolved   optional, called with the experiences of each asset-list
 *                     as they resolve.
 * @returns            a handle: the contract of ADR 0003 (`provider`), the
 *                     layer, the renderer once there is one, and the diagnosis
 *                     of the instance's configuration.
 */
export function attach(hls, { container, video = null, audioControl = null, onResolved = null } = {}) {
  if (!hls) throw new TypeError('[concurrent] attach(hls, options): the player instance is required');
  if (!container) throw new TypeError('[concurrent] attach(hls, options): `container` is required');

  const diagnostics = checkConfig(hls);
  const layer = createLayer(container);
  const provider = createSignalling(hls, { onResolved: onResolved || undefined });

  let renderer = null;
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
    renderer = createRenderer({ provider, video: element, layer, audioControl, attachAsset });
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
    get renderer() { return renderer; }
  };
}

/** What the built script hangs off the global. */
export const QualabsConcurrentHls = { VERSION, CONCURRENT_CLASS, hlsConfig, attach };
