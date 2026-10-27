// concurrent-dash.js -- the entry point of the library over dash.js.
//
// The same library as hls/concurrent-hls.js, on another transport: the two
// layers of ADR 0003, the piece that turns a `uri` into pixels, the state of
// whoever is watching and the controls, packaged as one classic script that
// defines a global (ADR 0015), `QualabsConcurrentDash`. Everything but the
// signalling and the media is lib/, the same code the HLS build carries.
//
// THE ORDER OF THE TWO CALLS MATTERS, and it is the one difference an
// integrator sees. The breaks are read off the MPD as dash.js receives it
// (ADR 0128), so `attach` has to come BEFORE `player.initialize(video, url)`:
//
//     const player = dashjs.MediaPlayer().create();
//     QualabsConcurrentDash.attach(player, { container, video });
//     player.initialize(video, url, autoplay);
//
// WHAT IS NOT HERE, AND WHY. hls.js plays Apple's traditional interstitial
// itself, so the HLS entry point checks that its machinery is on and marks its
// schedule on the bar. dash.js upstream does not execute Alternative MPD, so
// the replace event is played by this library (ADR 0125): it is one more
// experience of the contract, the bar marks it off the contract like the
// others, and the programme is always the element.

import { createSignalling, SVTA_SCHEME } from './signalling.js';
import { VIDEO_DECODERS_PARAM, IMAGE_OVER_VIDEO_PARAM } from '../lib/ad-list.js';
import { createMultiview } from '../lib/multiview.js';
import { createRenderer } from '../lib/renderer.js';
import { createControls } from '../lib/controls.js';
import { attachAsset } from './media.js';
import { firstRequest } from '../lib/media.js';
import { createTracking } from '../lib/tracking.js';
import { createPostRoll } from '../lib/postroll.js';
import { createLayer } from '../lib/layer.js';

export const VERSION = '0.1.0';

/**
 * Turn the concurrent experience on over a dash.js `MediaPlayer`, before its
 * `initialize`. The options are those of the HLS `attach`, and `video` is
 * required: dash.js has no element until `initialize`, and the layer has to be
 * listening before then.
 *
 * @returns a handle: the contract of ADR 0003 (`provider`, decorated by the
 *          multi view as in HLS), the layer, the renderer, the tracking, the
 *          post-roll and the controls.
 */
export function attach(player, {
  container, video, onResolved = null, onPresented = null, onTracking = null, logo = null,
  capabilities = null, sendCapabilities = true, preValidateAssets = false, preValidateMethod = 'GET'
} = {}) {
  if (!player) throw new TypeError('[concurrent] attach(player, options): the dash.js MediaPlayer is required');
  if (!container) throw new TypeError('[concurrent] attach(player, options): `container` is required');
  if (!video) throw new TypeError('[concurrent] attach(player, options): `video` is required with dash.js');
  if (!container.contains(video)) {
    console.error('[concurrent] the media element is not inside the container. The primary ' +
      'content is moved and scaled within the container, so it has to be a descendant of it.');
  }
  const layer = createLayer(container);
  // Built last, asked for at the moment of a touch (ADR 0028).
  let controls = null;
  const provider = createMultiview(
    createSignalling(player, video, {
      onResolved: onResolved || undefined, capabilities, sendCapabilities, firstRequest,
      preValidateAssets, preValidateMethod
    })
  );
  const renderer = createRenderer({
    provider, video, layer, attachAsset, onPresented, chromeUp: () => controls?.up() ?? false
  });
  const tracking = onTracking
    ? createTracking({ provider: { activeAt: (time) => renderer.presentedAt(time) }, video, onTracking })
    : null;
  const postRoll = createPostRoll({
    provider, video, layer, attachAsset, onPresented, onTracking, programmeEnded: () => true
  });
  // Every kind this player plays is on the contract, the replace one included,
  // so the bar is handed the provider as it is (ADR 0018).
  controls = createControls({
    container, video, provider, logo,
    releaseFocus: () => renderer.releaseFocus(),
    focusOn: (id) => renderer.focusOn(id),
    multiview: provider
  });
  return {
    container,
    layer,
    provider,
    video,
    programme: video,
    renderer,
    presentedAt: (time) => renderer.presentedAt(time),
    tracking,
    postRoll,
    controls
  };
}

/** What the built script hangs off the global. */
export const QualabsConcurrentDash = {
  VERSION,
  SVTA_SCHEME,
  VIDEO_DECODERS_PARAM,
  IMAGE_OVER_VIDEO_PARAM,
  attach
};
