// layer.js -- the surface an experience is drawn on, created inside the
// integrator's container. Every entry point of the library makes one the same
// way, whatever its player, so it is here (phase 19).

/**
 * The container as a positioning context, which BOTH entry points need and for
 * the same reason: what each of them draws inside it is positioned absolutely.
 * The boxes of a layout in one case; the chrome in the other, which is
 * `position: absolute; inset: 0` and would otherwise land against whatever
 * ancestor happens to be positioned.
 *
 * It writes an inline style over one value only -- `static`, the one that would
 * break it -- so an integrator whose stylesheet already made the container a
 * context keeps his own rule untouched. And it is not left to him to get right:
 * the failure is silent and it is one line to fix, which is the same shape as
 * the check an entry point makes of its player's configuration.
 */
export function ensurePositioned(container) {
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
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
 *
 * THE PROPERTY THAT TAKES NO POINTERS STAYS AS IT IS, AND A BOX OF THE AD TURNS
 * THEM BACK ON FOR ITSELF (ADR 0028). The touch that moves the focus of the
 * audio is taken by the node inside this layer and never by the layer, so what
 * is underneath is still not having its clicks swallowed: the renderer writes
 * `pointer-events: auto` onto the boxes of video it draws, one by one and only
 * while they are on screen. The absent `z-index` stays absent, which is the
 * other half of this comment and the half nothing has a reason to touch.
 */
export function createLayer(container) {
  ensurePositioned(container);
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
