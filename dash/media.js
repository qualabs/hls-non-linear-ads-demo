// media.js -- how a `uri` of the contract becomes pixels, with dash.js.
//
// The same piece as hls/media.js, on the far side of the seam of ADR 0003: the
// renderer receives it as a function and asks for an asset to be attached to a
// node. An image and a progressive file need no player and are lib/media.js's;
// what is here is the MPD, with one dash.js `MediaPlayer` per element. Several
// of them in one page is what dash.js supports (`MediaPlayerFactory`, one
// context per instance), and what the concurrent experience needs.
//
// ONLY THE FIRST LOAD COUNTS (SVTA2053 5.3.3, ADR 0107): for an MPD, the MPD.
// `MANIFEST_LOADED` is "it loaded"; an `ERROR` before it is "it failed", with
// the code dash.js gives. Measured in T-01 of phase 19 on dash.js 5.2.1: a 404
// on the MPD is error 25 in 1.6 s, after its retries. A 404 on the init segment
// (28) or on the first media segment (27) arrives after `MANIFEST_LOADED`, so it
// is a playback error of the option already presented, as a missing segment is
// in HLS, and calls nothing.

import { attachPlain, watchFirstLoad } from '../lib/media.js';

/** Whether an asset is an MPD: by its declared type, or by its extension when it declares none. */
export function isDash(uri, mediaType) {
  return /dash\+xml/i.test(mediaType || '') || (!mediaType && /\.mpd($|\?)/i.test(uri || ''));
}

/**
 * @param node       the <video> or <img> the renderer created for the element
 * @param uri        where the asset is
 * @param mediaType  the `type` the layout declares for the asset
 * @param startAt    seconds into the asset, when the experience is joined late
 * @param onLoaded   optional, called once when the asset's FIRST LOAD succeeds
 * @param onFailed   optional, called once, with a sentence, when it fails
 * @returns          a function that detaches it
 */
export function attachAsset(node, { uri, mediaType, startAt = 0, onLoaded = null, onFailed = null }) {
  const first = watchFirstLoad({ onLoaded, onFailed });
  // An element with no `uri` asks for nothing, so there is nothing to fail.
  if (!uri) first.loaded();
  const plain = attachPlain(node, { uri, mediaType, startAt, streaming: isDash(uri, mediaType) }, first);
  if (plain) return plain;
  const events = dashjs.MediaPlayer.events;
  const player = dashjs.MediaPlayer().create();
  player.on(events.MANIFEST_LOADED, first.loaded);
  player.on(events.ERROR, (event) => {
    const error = event?.error;
    first.failed(`the MPD could not be loaded (dash.js error ${error?.code ?? '?'}: ${error?.message ?? 'no message'})`);
  });
  // Not autoplaying: whether an element plays is the renderer's to decide.
  player.initialize(node, uri, false, startAt > 0 ? startAt : undefined);
  return () => { first.stop(); player.reset(); };
}
