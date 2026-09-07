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
 * How long before its window an ad is built, so that it is not being fetched at
 * the moment it has to be shown. See `bringAhead` for what that buys and what
 * it costs; the number is argued there.
 */
export const PRELOAD_LEAD_SECONDS = 3;

/**
 * How far into an ad's window the composition can already be and still take the
 * node that was brought ahead of time. Past it the window was joined in the
 * middle -- a seek -- and the node waiting is at the wrong second.
 */
export const LATE_JOIN_SECONDS = 0.5;

/**
 * How far the real asset and the window it was given can disagree before this
 * file says so. See `warnIfCut`: the disagreement is the one defect of this
 * whole mechanism that NOTHING on screen reports, so half a second is a
 * tolerance for the ordinary slack of starting and stopping a media element,
 * and not a budget for a creative that is a different length than declared.
 */
export const CUT_TOLERANCE_SECONDS = 0.5;

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
 * The declared volume of an element as the fraction a media element takes, 0 to
 * 1. What the layout says in percent is what somebody watching hears, and the
 * conversion is the whole of it.
 *
 * A value that is not a number falls back to the element's own default, and the
 * two defaults are NOT the same: full volume for the primary content and
 * silence for an element of the ad (ADR 0014). It is the same asymmetry the
 * layer underneath applies to a missing field, repeated here because it is the
 * same failure -- one default for both leaves the programme mute, and a mute
 * programme is not visible in a frame.
 *
 * Pure and exported for the same reason `boxToPixels` is.
 */
export function volumeOf(element) {
  const declared = Number(element.volume);
  if (!Number.isFinite(declared)) return element.primary ? 1 : 0;
  return Math.min(1, Math.max(0, declared / 100));
}

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
  /**
   * What has been brought ahead of time and is not on screen yet: `itemId` of
   * the experience that is coming, against the entries built for it. They live
   * apart from `drawn` on purpose -- everything that reads `drawn` is about
   * what is being shown, and these are not being shown.
   */
  const ahead = new Map();
  let key = null;
  let area = { left: 0, top: 0, width: 0, height: 0 };

  function tick() {
    const active = provider.activeAt(video.currentTime);
    // THE KEY IS THE IDENTITY OF EACH AD AND NOT ITS LABEL. It used to be
    // `type` and the identifier of the signalling, and inside one break every
    // ad carries the same identifier, so two ads in a row of the same layout
    // came out with the same key, this comparison said nothing changed, and
    // the second creative was never built: what stayed on screen was the node
    // of the first. `itemId` is the field of the contract that names one ad of
    // one break, so two of them are two keys even when everything else about
    // them is equal.
    const nextKey = active.map((e) => e.itemId).join(',');
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
      // The two states of the composition every element of it has to arrive
      // into, and in this order: `applyPlayback` starts a node while it is
      // still muted, which is the only way the autoplay policy lets it start,
      // and `applyAudio` then gives it the volume its element declares.
      applyPlayback();
      applyAudio();
    } else if (resized) {
      place();
    }
    bringAhead(active);
  }

  /**
   * One element of the layout becomes one node, and nothing about whether it is
   * on screen is decided here: that is what makes the same function serve the
   * ad that is starting and the one that is still to come.
   */
  function createNode(element, experience, startAt) {
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
      // Muted to START, and only to start: an audible element is one the
      // autoplay policy refuses to play, and an ad that never starts is a
      // black box on camera. `applyAudio` below gives it the volume the
      // layout declared, once it is playing.
      node.muted = true;
      // The other half of `warnIfCut`, and the cheaper half: an asset that
      // runs out INSIDE its window says so itself. What is left on screen
      // until the window closes is its last frame, which looks exactly like an
      // ad that is still playing.
      node.addEventListener('ended', () => {
        const left = experience.startTime + experience.duration - video.currentTime;
        if (left <= CUT_TOLERANCE_SECONDS) return;
        console.warn(`[renderer] ${element.id}: the asset ran out with ${left.toFixed(2)}s still` +
          ' left in the window it was given. The composition follows the window, so the last' +
          ' frame stays in the box until the window closes.');
      });
    }
    layer.appendChild(node);
    const detach = attachAsset(node, { uri: element.uri, mediaType: element.mediaType, startAt });
    // Whether it plays is NOT decided here -- see `applyPlayback`. What this
    // line used to do was start it, which is the state of the composition
    // being decided at the moment a node is created instead of being read off
    // the composition, and the two answers differ exactly when the node
    // arrives while the composition is not playing.
    return { element, node, detach, experience, image };
  }

  /**
   * One element of the layout becomes one node, in the order it comes -- taking
   * the node that was brought ahead of time when there is one for it.
   */
  function build(experience) {
    const ready = ahead.get(experience.itemId) ?? [];
    ahead.delete(experience.itemId);
    for (const element of experience.elements) {
      // Rule 3: the primary content is an element of the layout like any
      // other, it just does not bring a `uri` because it is already playing.
      // What there is to do with it is move it to its box and give it the
      // volume the layout declared for it -- see `applyAudio`.
      if (element.primary) {
        drawn.push({ element, node: video, detach: null });
        continue;
      }
      const startAt = Math.max(0, video.currentTime - experience.startTime);
      const i = ready.findIndex((entry) => entry.element === element);
      // A node brought ahead of time was left at the start of its asset,
      // because that is where the window it is waiting for opens. Arriving in
      // the MIDDLE of that window -- somebody seeked into the ad -- is the one
      // case where it is at the wrong second, and there it is thrown away and
      // built again rather than started in the wrong place.
      const usable = i >= 0 && startAt <= LATE_JOIN_SECONDS;
      const entry = usable ? ready.splice(i, 1)[0] : createNode(element, experience, startAt);
      if (usable) entry.node.style.removeProperty('opacity');
      drawn.push(entry);
    }
    discard(ready);
  }

  /**
   * The ad that comes NEXT, fetched while the one on screen is still running.
   *
   * WHY IT EXISTS. Building an ad means a node, a second instance of the player
   * library, and its first fetches, and until those land the node is the black
   * bed `createNode` paints on it. With one ad per break that cold start falls
   * before there is anything to show; inside a break of several ads it falls
   * between two ads, once per transition, in the middle of the picture.
   *
   * HOW FAR AHEAD, and it is a trade and not a constant somebody picked. Too
   * little and the node is still black when its turn comes, which is the defect
   * this exists to remove; too much and a second decoder runs for longer than
   * it has to, over a client that told us how many it has. Three seconds is
   * enough for the two round trips a cold start costs on a real network and it
   * is a small fraction of an ordinary ad, so at most one extra decoder is
   * alive and only for the tail of the ad before it.
   *
   * WHAT IT LOOKS LIKE AND SOUNDS LIKE UNTIL ITS TURN: nothing. It is in its
   * box already, so its arrival costs no reflow, but at `opacity: 0` -- which
   * hides it without taking it out of the picture the way `display: none`
   * would, and a node that is not being painted is a node that is not being
   * decoded either. It is never started and never unmuted: `applyPlayback` and
   * `applyAudio` read `drawn`, and this is not in `drawn`.
   *
   * IT ASKS THE CONTRACT AND NOTHING ELSE. "What is going to be active three
   * seconds from now" is `activeAt` of a time three seconds from now, so there
   * is no second question for the layer underneath to answer.
   */
  function bringAhead(active) {
    const onScreen = new Set(active.map((e) => e.itemId));
    const wanted = new Set();
    for (const experience of provider.activeAt(video.currentTime + PRELOAD_LEAD_SECONDS)) {
      if (onScreen.has(experience.itemId)) continue;
      wanted.add(experience.itemId);
      if (ahead.has(experience.itemId)) continue;
      ahead.set(experience.itemId, experience.elements
        .filter((element) => !element.primary)
        .map((element) => {
          const entry = createNode(element, experience, 0);
          entry.node.style.opacity = '0';
          sizeAsset(entry.node, boxToPixels(element.box, area));
          return entry;
        }));
    }
    // What is no longer coming -- a seek backwards, a window that moved -- is
    // dropped, because a fetch nobody is going to watch is the cost of this
    // without the benefit.
    for (const [itemId, entries] of ahead) {
      if (wanted.has(itemId)) continue;
      discard(entries);
      ahead.delete(itemId);
    }
  }

  function discard(entries) {
    for (const { node, detach } of entries) {
      detach?.();
      node.remove();
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

  /**
   * The audio of what is on screen, element by element, which is what the
   * layout declares and this file used to ignore on purpose (ADR 0014).
   *
   * TWO KINDS OF ELEMENT AND TWO RULES, and what separates them is which of the
   * two switches each one owns.
   *
   *   An element of the ad gets the volume the layout declared, and it is muted
   *   outright when that volume is 0. Muted and not merely at zero, because a
   *   node that is audible on paper is one the autoplay policy refuses to
   *   start, and the default of a layout that declares nothing is exactly 0:
   *   without this line the ordinary case would be four silent black boxes.
   *
   *   The primary content gets its declared volume too -- a mix that leaves the
   *   show at the same level as the ad it is being mixed against is not a mix --
   *   but its MUTE is never touched here. That switch is the audio of the
   *   composition, it belongs to whoever is watching, and the control that
   *   flips it is on the screen.
   *
   * THE COMPOSITION'S MUTE GATES THE ELEMENTS OF THE AD. The page starts muted
   * so that the autoplay policy lets it begin without a click, and an ad that
   * took its declared volume regardless would be the one thing making noise
   * before anybody asked for it. So this runs again on every `volumechange` of
   * the primary, which is where that switch lives.
   */
  function applyAudio() {
    const off = video.muted;
    for (const { element, node, image } of drawn) {
      // A still has no audio. `volume` on an <img> is an expando that means
      // nothing to anybody, so it is not set rather than set uselessly.
      if (image) continue;
      const level = volumeOf(element);
      node.volume = level;
      if (!element.primary) node.muted = off || level === 0;
    }
  }

  /**
   * Whether the elements of the ad are playing, which is a state of the
   * COMPOSITION and not a property of each one.
   *
   * IT IS THE SAME SHAPE AS `applyAudio`, and for the same reason. This file
   * used to propagate the TRANSITIONS of the primary -- its `play` and its
   * `pause` -- and separately decide the state of a node at the moment it was
   * created, which is one answer coming from two places. They disagree exactly
   * when a node is created while the composition is not playing: a seek that
   * lands inside the window of an ad with the composition paused built the node
   * and started it, so the ad played alone with everything else still.
   *
   * So the state is APPLIED and not propagated. This runs after every `build`
   * and again on every `play` and `pause` of the primary, and it reads
   * `video.paused` rather than remembering which event brought it here, so an
   * element that arrives late is governed exactly like one that was already
   * there.
   *
   * TWO THINGS IT DOES NOT DECIDE. Not the audio: every node is created muted
   * because an audible element is one the autoplay policy refuses to play, and
   * `applyAudio` is what gives it the volume the layout declared once it is
   * playing. And not the position: the `startAt` that `build` hands to
   * `attachAsset` already leaves the asset at the right second when the window
   * is joined in the middle, so what there is to govern here is WHETHER it
   * plays and not where.
   */
  function applyPlayback() {
    for (const { node } of playable()) {
      if (video.paused) node.pause();
      else node.play().catch(() => {});
    }
  }

  /**
   * The ad that is being taken off screen with asset still to play, which is
   * the one failure of this whole mechanism that NOTHING reports on its own.
   *
   * The window an ad gets is DECLARED -- it comes from numbers somebody wrote
   * in the signalling -- and the asset behind it is a real file with a real
   * length. When they disagree, an ad cut two seconds early looks exactly like
   * an ad that ended, and an ad that ran out early looks exactly like one that
   * is still playing: the defect survives any number of people watching the
   * recording. So the composition keeps following the window -- that is the
   * decision, and it is written in the contract -- and this file says out loud
   * every time the window and the asset were not the same length.
   */
  function warnIfCut({ element, node, experience, image }) {
    if (!experience || image || element.primary || node.ended) return;
    const asset = Number(node.duration);
    if (!Number.isFinite(asset)) return;
    const left = asset - Number(node.currentTime || 0);
    if (left <= CUT_TOLERANCE_SECONDS) return;
    console.warn(`[renderer] ${element.id}: taken off with ${left.toFixed(2)}s of its asset still` +
      ` unplayed -- the asset is ${asset.toFixed(2)}s long and the window it was given is` +
      ` ${experience.duration}s. The composition follows the window.`);
  }

  function clear() {
    for (const entry of drawn) warnIfCut(entry);
    for (const { element, node, detach } of drawn) {
      if (element.primary) {
        // Back to what the stylesheet says, which fits the video into the
        // container without deforming it -- the same rectangle `imageBox`
        // computes, and the reason the picture does not move when a break ends.
        node.removeAttribute('style');
        // And back to its own audio, which the style does not carry: `volume`
        // is a property. A break that declared a mix and left the show at the
        // 10 % of it would go on quietly for the rest of the programme, with
        // nothing on screen saying why -- the same failure as the mute default,
        // one break later. The mute is not touched, here either: it is the
        // viewer's.
        node.volume = 1;
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
   * Their audio is not decided here: each one is created muted so that it can
   * start at all, and `applyAudio` gives it the volume its element declares.
   */
  function playable() {
    return drawn.filter((d) => !d.element.primary && !d.image);
  }

  // The ad follows the primary: the experience is concurrent with the content,
  // so the state of the composition is the state of every element of it, and
  // seeking inside the window moves them.
  //
  // The two of them are the same call and it takes no argument, which is the
  // point: what reaches the elements is `video.paused` and not the name of the
  // event, so there is one place that answers the question and `build` is not a
  // second one.
  video.addEventListener('play', applyPlayback);
  video.addEventListener('pause', applyPlayback);
  video.addEventListener('seeked', () => {
    for (const { node, experience } of playable()) {
      node.currentTime = Math.max(0, video.currentTime - experience.startTime);
    }
  });

  // The audio of the composition is the primary's own mute, and flipping it has
  // to reach the elements of the ad: that is the fourth event this file follows
  // and the reason `applyAudio` is not a thing that only runs when a break
  // starts.
  video.addEventListener('volumechange', applyAudio);

  // A frame loop and not `timeupdate`: the box has to follow the player area
  // when the window is resized or somebody goes fullscreen mid-ad, and
  // `timeupdate` only fires four times a second.
  (function loop() {
    tick();
    requestAnimationFrame(loop);
  })();

  return { tick, get drawn() { return drawn; }, FILL_MODE };
}
