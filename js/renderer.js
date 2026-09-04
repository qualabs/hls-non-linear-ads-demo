// renderer.js -- the rendering layer of ADR 0003, on the far side of the seam.
//
// It takes the contract of T-06 -- a provider with `activeAt(time)` and boxes
// in percentages -- and draws it: the percentages of inset become a box in
// pixels over the player area, the elements are drawn in the order they come,
// and every asset is an element positioned on top of the primary video
// (ADR 0001). No compositing in video, no canvas: CSS over the picture.
//
// Nothing here knows where the boxes come from. There is no import of the
// player library and not one word of the transport or its tags, which is the
// invariant T-06 left verified with a grep and this file has to keep. The one
// thing the renderer cannot do by itself is turn a `uri` into pixels, so it
// asks: `attachAsset` is injected by app.js, the one file allowed to know both
// sides. See the section "El reproductor de assets" in tasks/T-06/t06-contrato.md.

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
 * @param provider      something with `activeAt(time) -> Experience[]`
 * @param video         the element that is already playing the primary content
 * @param layer         the empty positioned box over the video, where ads are drawn
 * @param audioControl  the visible button of ADR 0010, or null
 * @param attachAsset   (node, {uri, mediaType, startAt}) -> detach();
 *                      injected, because playing a URI is not the renderer's job
 */
export function createRenderer({ provider, video, layer, audioControl, attachAsset }) {
  /** What is on screen right now: one entry per element of the layout. */
  let drawn = [];
  let key = null;
  let area = { width: 0, height: 0 };
  // ADR 0010: the ad starts SILENT and the primary keeps its audio. The state
  // is reset on every new ad, so each one starts silent even if the previous
  // one had been turned on.
  //
  // The layout does carry a `volume` per element and ADR 0010 says to read it
  // as the initial state of this control -- but T-03 measured that the SVTA
  // tool never emits the field, in any element of any of the six layouts, so
  // the signalling layer hands over the assumed default of 100 every time.
  // There is no payload to read, so the other half of the same ADR governs:
  // silent. The field is deliberately NOT read here.
  let adAudioOn = false;

  function tick() {
    const active = provider.activeAt(video.currentTime);
    const nextKey = active.map((e) => `${e.type}#${e.id}`).join(',');
    const box = layer.getBoundingClientRect();
    const resized = Math.abs(box.width - area.width) > 0.5 || Math.abs(box.height - area.height) > 0.5;
    area = { width: box.width, height: box.height };

    if (nextKey !== key) {
      key = nextKey;
      clear();
      for (const experience of active) build(experience);
      place();
      syncControl();
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

  function sizeAsset(node, px) {
    node.style.position = 'absolute';
    node.style.left = `${px.left}px`;
    node.style.top = `${px.top}px`;
    node.style.width = `${px.width}px`;
    node.style.height = `${px.height}px`;
  }

  /**
   * The primary content shrinks with a transform (ADR 0001): its layout box
   * stays where the stylesheet put it, the whole player area, and the transform
   * paints it into the box the layout asked for. `transform-origin` at the top
   * left is what makes the translate the box's own left and top.
   *
   * `position` is not decoration and it is not the transform's doing: a
   * transform creates a stacking context of its own but does NOT make the
   * element positioned, and `z-index` on a static element is ignored. A primary
   * shrunk by a transform alone would therefore paint at the z-index 0 level
   * with its `zDepth` thrown away, and the layouts where the ad is the
   * background and the picture goes on top of it would come out inverted. With
   * this line the video and the ad nodes carry comparable z-indexes in the same
   * stacking context, which is what rule 2 needs.
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
    node.style.position = 'relative';
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
        // Back to what the stylesheet says, which is the full frame.
        node.removeAttribute('style');
        continue;
      }
      detach?.();
      node.remove();
    }
    drawn = [];
    adAudioOn = false;
  }

  /** The ad nodes: every element of the layout that is not the primary. */
  function ads() {
    return drawn.filter((d) => !d.element.primary);
  }

  /**
   * The ad nodes that have a timeline and a soundtrack, which are the ones the
   * audio control and the play/pause/seek of the primary act on. An image ad
   * has neither, and one of the five layouts is made only of images.
   */
  function playable() {
    return ads().filter((d) => !d.image);
  }

  function applyAudio() {
    for (const { node } of playable()) node.muted = !adAudioOn;
  }

  function syncControl() {
    applyAudio();
    if (!audioControl) return;
    const there = playable().length > 0;
    audioControl.disabled = !there;
    audioControl.textContent = !there
      // Two states share the disabled button and saying which one it is matters
      // on camera: an ad made of stills is not the absence of an ad.
      ? (ads().length ? 'the ad on screen has no audio' : 'no ad on screen')
      : adAudioOn
        ? '🔊 ad audio ON — click to mute the ad'
        : '🔇 ad audio OFF — click to unmute the ad';
  }

  audioControl?.addEventListener('click', () => {
    adAudioOn = !adAudioOn;
    syncControl();
  });

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

  syncControl();
  return { tick, get drawn() { return drawn; }, get adAudioOn() { return adAudioOn; }, FILL_MODE };
}
