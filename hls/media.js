// media.js -- how a `uri` of the contract becomes pixels.
//
// This is the piece that sits on the far side of the seam of ADR 0003 and is
// still library and not integrator plumbing: it is the one that knows the
// player library. The renderer receives it as a function, so it asks for an
// asset to be attached to a node and gets back a way to detach it, without
// importing anything and without knowing what a media playlist is.
//
// Several elements, each with its own instance of the player library, play at
// the same time. That is what T-01 of phase 01 measured, and it is the whole
// reason a concurrent experience can be drawn at all.
//
// What needs no hls.js -- an image, a progressive file, the watch of a first
// load and the first request of pre-validation -- is lib/media.js (phase 19).

import { attachPlain, watchFirstLoad } from '../lib/media.js';


/**
 * @param node       the <video> or <img> the renderer created for the element
 * @param uri        where the asset is
 * @param mediaType  the `type` the layout declares for the asset
 * @param startAt    seconds into the asset, when the experience is joined late
 * @param onLoaded   optional, called once when the asset's FIRST LOAD succeeds
 * @param onFailed   optional, called once, with a sentence, when it fails
 * @returns          a function that detaches it
 *
 * THE TWO CALLBACKS ARE THE WHOLE OF WHAT CROSSES BACK TO THE RENDERER (ADR
 * 0107), and they are generic on purpose: "it loaded" and "it failed, because
 * <a sentence>". What failed -- a status, a playlist, an error of the player
 * library -- is decided here, on the side of the seam of ADR 0003 that knows
 * it, and the renderer only learns that it has to mount the next option.
 *
 * ONLY THE FIRST LOAD COUNTS (SVTA2053 5.3.3): the request for the playlist the
 * `uri` references -- the Multivariant or Media Playlist the player library
 * asks for first -- for an HLS asset; the metadata for a progressive file; the
 * image for an image. A failure, a fatal error of the player library before
 * that, or no answer in FIRST_REQUEST_TIMEOUT_MS, is `onFailed`. Anything
 * after the first load succeeded -- a missing segment, a variant, a decode --
 * is a playback error of the option already presented and calls nothing.
 * Detaching cancels both: a node taken off before its first load is not a
 * failure of anybody's.
 */
export function attachAsset(node, { uri, mediaType, startAt = 0, onLoaded = null, onFailed = null }) {
  const first = watchFirstLoad({ onLoaded, onFailed });
  // An element with no `uri` asks for nothing, so there is nothing to fail:
  // SVTA2053 6.6.4 says an empty uri is not by itself a reason to fall back.
  if (!uri) first.loaded();
  // An image, or a file that is not a playlist, needs no hls.js (lib/media.js).
  const isHls = /mpegurl/i.test(mediaType || '') || /\.m3u8($|\?)/i.test(uri);
  const plain = attachPlain(node, { uri, mediaType, startAt, streaming: isHls }, first);
  if (plain) return plain;
  const adHls = new Hls({ interstitialsController: undefined, startPosition: startAt });
  adHls.on(Hls.Events.MANIFEST_LOADED, first.loaded);
  adHls.on(Hls.Events.ERROR, (_event, data) => {
    const firstRequest = [
      Hls.ErrorDetails.MANIFEST_LOAD_ERROR, Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT, Hls.ErrorDetails.MANIFEST_PARSING_ERROR
    ].includes(data?.details);
    if (!firstRequest && !data?.fatal) return;
    const code = data?.response?.code;
    first.failed(code ? `HTTP ${code}` : data?.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT
      ? 'no answer' : `the playlist could not be loaded (${data?.details})`);
  });
  adHls.loadSource(uri);
  adHls.attachMedia(node);
  return () => { first.stop(); adHls.destroy(); };
}
