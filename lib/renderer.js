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
 * @param provider      something with `activeAt(time) -> Experience[]`
 * @param video         the element that is already playing the primary content
 * @param layer         the empty positioned box over the video, where ads are drawn
 * @param attachAsset   (node, {uri, mediaType, startAt}) -> detach();
 *                      injected, because playing a URI is not the renderer's job
 */
export function createRenderer({ provider, video, layer, attachAsset }) {
  /** What is on screen right now: one entry per element of the layout. */
  let drawn = [];
  let key = null;
  let area = { left: 0, top: 0, width: 0, height: 0 };

  function tick() {
    const active = provider.activeAt(video.currentTime);
    const nextKey = active.map((e) => `${e.type}#${e.id}`).join(',');
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

    if (nextKey !== key) {
      key = nextKey;
      clear();
      for (const experience of active) build(experience);
      place();
    } else if (resized) {
      place();
    }
  }

  /** One element of the layout becomes one node, in the order it comes. */
  function build(experience) {
    for (const element of experience.elements) {
      // Rule 3: the primary content is an element of the layout like any
      // other, it just does not bring a `uri` because it is already playing.
      // What there is to do with it is move it to its box -- never touch its
      // audio, which is the primary's and stays its own (ADR 0010).
      if (element.primary) {
        drawn.push({ element, node: video, detach: null });
        continue;
      }
      const image = isImage(element.mediaType);
      const node = document.createElement(image ? 'img' : 'video');
      node.className = 'ad';
      node.dataset.elementId = element.id;
      // A black bed, so the first frame of the asset does not show the picture
      // underneath through it. It is the one thing about an ad node that does
      // not come from the layout, and it is set here, on the node this file
      // creates, rather than left to a stylesheet somebody else writes.
      node.style.background = '#000';
      if (image) {
        // The layer is aria-hidden and the picture is the ad itself, so there
        // is nothing to describe that is not already on screen.
        node.alt = '';
      } else {
        node.playsInline = true;
        node.muted = true;
      }
      layer.appendChild(node);
      const startAt = Math.max(0, video.currentTime - experience.startTime);
      const detach = attachAsset(node, { uri: element.uri, mediaType: element.mediaType, startAt });
      // A still has no timeline: nothing to start and nothing to follow.
      if (!image) node.play().catch(() => {});
      drawn.push({ element, node, detach, experience, image });
    }
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
   */
  function place() {
    for (const { element, node } of drawn) {
      const px = boxToPixels(element.box, area);
      node.style.objectFit = FILL_MODE;
      node.style.zIndex = String(element.zDepth);
      if (element.primary) movePrimary(node, px);
      else sizeAsset(node, px);
    }
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
  function movePrimary(node, px) {
    if (!area.width || !area.height) return;
    const sx = px.width / area.width;
    const sy = px.height / area.height;
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

  function clear() {
    for (const { element, node, detach } of drawn) {
      if (element.primary) {
        // Back to what the stylesheet says, which fits the video into the
        // container without deforming it -- the same rectangle `imageBox`
        // computes, and the reason the picture does not move when a break ends.
        node.removeAttribute('style');
        continue;
      }
      detach?.();
      node.remove();
    }
    drawn = [];
  }

  /**
   * The ad nodes that have a timeline, which are the ones the play, the pause
   * and the seek of the primary act on. A still has none, and one of the five
   * layouts is made only of stills.
   *
   * Every one of them is created muted (see `build`) and stays muted. The mix
   * per element is declared by the layout and reading it is T-05, which is also
   * where the mute of the composition has to gate it.
   */
  function playable() {
    return drawn.filter((d) => !d.element.primary && !d.image);
  }

  // The ad follows the primary: the experience is concurrent with the content,
  // so pausing the content pauses it and seeking inside the window moves it.
  video.addEventListener('play', () => { for (const { node } of playable()) node.play().catch(() => {}); });
  video.addEventListener('pause', () => { for (const { node } of playable()) node.pause(); });
  video.addEventListener('seeked', () => {
    for (const { node, experience } of playable()) {
      node.currentTime = Math.max(0, video.currentTime - experience.startTime);
    }
  });

  // A frame loop and not `timeupdate`: the box has to follow the player area
  // when the window is resized or somebody goes fullscreen mid-ad, and
  // `timeupdate` only fires four times a second.
  (function loop() {
    tick();
    requestAnimationFrame(loop);
  })();

  return { tick, get drawn() { return drawn; }, FILL_MODE };
}
