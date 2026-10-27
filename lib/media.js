// media.js -- the part of attaching an asset that no streaming format owns.
//
// The renderer receives an `attachAsset(node, ...)` from the side that knows the
// player library, and that function attaches a streaming asset with its player
// (ADR 0003). Two kinds of asset need no player at all -- an image and a
// progressive file -- and the first load of any asset is watched the same way,
// whoever plays it. That is what is here, so each format's `attachAsset` and
// pre-validation import it instead of carrying a copy (ADR 0116, phase 19).
//
// ONLY THE FIRST LOAD COUNTS (SVTA2053 5.3.3): the image for an image, the
// metadata for a progressive file, and for a streaming asset the first document
// its player asks for. A failure before that, or no answer in
// FIRST_REQUEST_TIMEOUT_MS, is `onFailed`; anything after it is a playback error
// of the option already presented and calls nothing.

/**
 * The asset kinds that need no player: an image, always, and a progressive file
 * when the caller says the asset is not of its own streaming format
 * (`streaming: false`). Attaches it and returns the function that detaches it,
 * or `null` when the asset is the caller's to attach with its player. `first` is
 * the watch of `watchFirstLoad`, which this settles.
 */
export function attachPlain(node, { uri, mediaType, startAt = 0, streaming = false }, first) {
  // An image is the one asset that needs nothing from this side of the seam: no
  // player, no timeline, no second instance. The renderer already created an
  // <img> for it, so attaching is a src and detaching is dropping it.
  if (/^image\//i.test(mediaType || '')) {
    node.addEventListener('load', first.loaded, { once: true });
    node.addEventListener('error', () => first.failed('the image could not be loaded'), { once: true });
    node.src = uri;
    return () => { first.stop(); node.removeAttribute('src'); };
  }
  if (streaming) return null;
  node.addEventListener('loadedmetadata', first.loaded, { once: true });
  node.addEventListener('error', () => first.failed('the file could not be loaded'), { once: true });
  node.src = uri;
  if (startAt > 0) node.currentTime = startAt;
  return () => { first.stop(); node.removeAttribute('src'); node.load(); };
}

/**
 * The once-only state of a first load: `loaded()` and `failed(reason)` each
 * call their callback at most once and never after the other, a timer fails it
 * after FIRST_REQUEST_TIMEOUT_MS, and `stop()` silences it for good.
 */
export function watchFirstLoad({ onLoaded, onFailed }) {
  let open = Boolean(onLoaded || onFailed);
  const timer = open
    ? setTimeout(() => settle(onFailed, `no answer in ${FIRST_REQUEST_TIMEOUT_MS / 1000} s`), FIRST_REQUEST_TIMEOUT_MS)
    : null;
  function settle(callback, reason) {
    if (!open) return;
    open = false;
    clearTimeout(timer);
    try { callback?.(reason); } catch (error) { console.error('[media] a first-load callback threw', error); }
  }
  return {
    loaded: () => settle(onLoaded),
    failed: (reason) => settle(onFailed, reason),
    stop: () => { open = false; clearTimeout(timer); }
  };
}

/**
 * How long a first request may take before it counts as failed. SVTA2053 5.3.3
 * names a timeout as one of the ways a first request fails and gives no value,
 * so this is the library's, like the other times it keeps (ADR 0054). It is
 * long because a slow answer that would still have played is lost for good once
 * the option is passed over, and because the request goes out when the
 * break's list arrives and not when the break starts (ADR 0106).
 */
export const FIRST_REQUEST_TIMEOUT_MS = 10000;

/**
 * The answers to a HEAD that mean "this server does not do HEAD" rather than
 * "this asset is not there": the same `uri` is asked again with GET.
 */
const RETRY_WITH_GET = new Set([405, 501]);

/**
 * The first request for an asset, made by PRE-VALIDATION before the list is
 * handed to the renderer (ADR 0106, ADR 0107, SVTA2053 5.3.3 "Asset load
 * failure"), answered as `{ ok, error, method }`. It never throws: a failure is
 * an answer.
 *
 * The request is the one `attachAsset` would make first, made the way that
 * function makes it, so the answer is about the asset and not about the way it
 * was asked for:
 *
 *   an image   is loaded by an image, which is what will show it, WHATEVER
 *              `method` SAYS. A `fetch` would be held to CORS, which an <img>
 *              is not, and would fail an image from another origin that draws
 *              fine -- a cross-origin answer has no readable status without
 *              CORS. What an image cannot say is the status: a 404 and a file
 *              that does not decode are both "could not be loaded", and both
 *              mean it cannot be shown.
 *   the rest   is a request for its `uri` with `method` (`preValidateMethod`,
 *              'GET' by default): the first document of a streaming asset
 *              (a playlist, an MPD), which its player asks for with GET, and the file
 *              itself for a progressive one. A status that is not 2xx is a
 *              failure, and so are a network error and no answer in
 *              FIRST_REQUEST_TIMEOUT_MS.
 *
 * HEAD, AND ITS TWO TRAPS. A 405 or a 501 to a HEAD is a server that does not
 * implement it, so the same `uri` is asked again with GET and that answer
 * counts. A 403 is NOT retried, and that is the trap to know about: S3 and
 * CloudFront presigned URLs are signed FOR ONE METHOD, so a HEAD on a URL signed
 * for GET is answered 403 although the asset is there and would play. With
 * signed URLs, use GET. A 403 is not retried because it is also what an asset
 * nobody may see answers, and retrying it would double the requests for every
 * forbidden asset to rescue only the signed ones.
 *
 * TO REVISIT: GET OR HEAD, AND HOW MUCH A GET COSTS (David Hassoun, ADR 0107).
 * The default is GET because it is the request the player itself makes. Here
 * the body is cancelled as soon as the status arrives, which limits the bytes
 * but still opens the transfer; for a playlist that is nothing, and for a large
 * progressive file (an MP4 of the whole ad) it is a transfer started for a
 * check. An implementation that cannot cancel a body -- outside a browser --
 * would download the whole file. The alternatives to evaluate are HEAD, with
 * the traps above, and a GET with `Range: bytes=0-0`, which every server that
 * serves video already honours and which a signature for GET still covers.
 */
export async function firstRequest(uri, mediaType, { method = 'GET' } = {}) {
  if (/^image\//i.test(mediaType || '')) {
    return new Promise((resolve) => {
      const image = new Image();
      const timer = setTimeout(() => {
        image.removeAttribute('src');
        resolve({ ok: false, error: `no answer in ${FIRST_REQUEST_TIMEOUT_MS / 1000} s`, method: 'image' });
      }, FIRST_REQUEST_TIMEOUT_MS);
      image.onload = () => { clearTimeout(timer); resolve({ ok: true, method: 'image' }); };
      image.onerror = () => {
        clearTimeout(timer);
        resolve({ ok: false, error: 'the image could not be loaded', method: 'image' });
      };
      image.src = uri;
    });
  }
  const answer = await requestOnce(uri, method);
  if (method === 'HEAD' && RETRY_WITH_GET.has(answer.status)) {
    const again = await requestOnce(uri, 'GET');
    return again.ok
      ? { ok: true, method: 'HEAD, then GET' }
      : { ok: false, error: `${again.error}, after HTTP ${answer.status} to a HEAD`, method: 'HEAD, then GET' };
  }
  if (answer.ok) return { ok: true, method };
  const hint = method === 'HEAD' && answer.status === 403 ? ' to a HEAD; a URL signed for GET answers 403 to a HEAD' : '';
  return { ok: false, error: `${answer.error}${hint}`, method };
}

/** One request, with its own timeout: `{ ok, status, error }`. The body of a GET is dropped on arrival. */
function requestOnce(uri, method) {
  return fetch(uri, { method, signal: AbortSignal.timeout(FIRST_REQUEST_TIMEOUT_MS) }).then(
    (response) => {
      response.body?.cancel().catch(() => {});
      return response.ok
        ? { ok: true, status: response.status }
        : { ok: false, status: response.status, error: `HTTP ${response.status}` };
    },
    (error) => ({
      ok: false,
      status: null,
      error: error?.name === 'TimeoutError' ? `no answer in ${FIRST_REQUEST_TIMEOUT_MS / 1000} s` : 'network error'
    })
  );
}
