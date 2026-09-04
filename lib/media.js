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

/**
 * @param node       the <video> or <img> the renderer created for the element
 * @param uri        where the asset is
 * @param mediaType  the `type` the layout declares for the asset
 * @param startAt    seconds into the asset, when the experience is joined late
 * @returns          a function that detaches it
 */
export function attachAsset(node, { uri, mediaType, startAt = 0 }) {
  // An image is the one asset that needs nothing from this side of the seam: no
  // player, no timeline, no second instance. The renderer already created an
  // <img> for it, so attaching is a src and detaching is dropping it.
  if (/^image\//i.test(mediaType || '')) {
    node.src = uri;
    return () => node.removeAttribute('src');
  }
  const isHls = /mpegurl/i.test(mediaType || '') || /\.m3u8($|\?)/i.test(uri);
  if (!isHls) {
    node.src = uri;
    if (startAt > 0) node.currentTime = startAt;
    return () => { node.removeAttribute('src'); node.load(); };
  }
  const adHls = new Hls({ interstitialsController: undefined, startPosition: startAt });
  adHls.loadSource(uri);
  adHls.attachMedia(node);
  return () => adHls.destroy();
}
