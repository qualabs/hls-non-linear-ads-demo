// experience.js -- the model of a break: what the signalling hands the renderer,
// built from what the ad declares.
//
// Every function here reads the content of the creative-signalling block of
// SVTA2053 -- its `payload` of items, each one a `layout` or a catalogue of
// `views`, with its `identifiers` -- or the contract built from it
// (docs/contrato-senalizacion-renderizado.md). None of them reads how the block
// arrived or when it was asked for: that is the side of each streaming format,
// in a folder of its own. It is the line of ADR 0116 -- a file in lib/ is one a
// player of any format would use as it is -- and the seam of ADR 0003 checks the
// whole of lib/ for the vocabulary of the transport.
//
// The pure functions are exported one by one, as everywhere in this library:
// they are the surface the tests aim at.

// The two defaults the SVTA tool OMITS. Measured in T-03: of the six payloads
// the tool emits, the two overlays carry no `primaryContent` block at all, and
// none of the six carries `volume` on any element -- even though the tool's own
// presets have primaryContent at zDepth 0, volume 100, viewport "0 0 0 0".
// So the layer ASSUMES them; asking for those fields would break on a real
// payload copied out of the tool (ADR 0004: consume it as it is emitted).
//
// THE VOLUME HAS TWO DEFAULTS AND NOT ONE, AND CONFUSING THEM TURNS THE SHOW
// OFF. An absent `volume` is silence on an element of the ad and full volume on
// the primary content (ADR 0014). The asymmetry is the whole of the decision:
// the tool omits the field on EVERY element, the `primaryContent` block
// included, so one default of 0 for all of them would leave the programme mute
// in the five layouts, and that is a failure nothing on screen reports. What
// buys the 0 on the ad side is that unexpected audio on camera is worse than
// missing audio -- an ad that should have sounded is one click away, an ad that
// takes the audio of the show ruins the take. The primary content has no such
// trade: it was already playing before the break and the field being absent
// says nothing about it.
//
// It is a deliberate divergence with the tool, for which an absent `volume` is
// 100 everywhere. ADR 0014 argues it and leaves it written down as a question
// for SVTA.
export const DEFAULT_PRIMARY_VOLUME = 100;
export const DEFAULT_AD_VOLUME = 0;
export const DEFAULT_PRIMARY = { zDepth: 0, volume: DEFAULT_PRIMARY_VOLUME, viewport: '0 0 0 0' };
export const FULL_FRAME = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * `viewport` is four percentages of INSET in the order top, right, bottom,
 * left: how much each edge is pulled in from the player area (ADR 0001).
 */
export function parseViewport(viewport) {
  const n = String(viewport ?? '').trim().split(/[\s,]+/).map(Number);
  if (n.length !== 4 || n.some((v) => !Number.isFinite(v))) {
    console.warn('[signalling] viewport is not four numbers, using the full frame:', viewport);
    return { ...FULL_FRAME };
  }
  return { top: n[0], right: n[1], bottom: n[2], left: n[3] };
}

/** One element of the layout, in the shape the contract declares. */
export function resolveElement(source, isPrimary) {
  return {
    id: source.id ?? (isPrimary ? 'primaryContent' : 'asset'),
    primary: isPrimary,
    box: parseViewport(source.viewport),
    zDepth: Number(source.zDepth ?? 0),
    // `??` and not `||`: volume 0 is a legal value and means silent. With `||`
    // an ad declared silent on purpose would come out at the default and take
    // the audio of the show, and it is one character of difference.
    // The default depends on WHICH element this is, and that asymmetry is the
    // one above: 0 for an element of the ad, 100 for the primary content.
    volume: Number(source.volume ?? (isPrimary ? DEFAULT_PRIMARY_VOLUME : DEFAULT_AD_VOLUME)),
    uri: isPrimary ? null : source.uri || null,
    mediaType: isPrimary ? null : source.type || null
  };
}

/**
 * The shapes of ADR 0065: how many boxes are on the screen, and the `viewport`
 * each one of them goes in, in order.
 *
 * WHY THE LIBRARY COMPUTES THIS AND THE SIGNALLING DOES NOT DECLARE IT. Where a
 * box goes depends on HOW MANY boxes there are, and that number is decided by
 * whoever is watching, several times, while the window is open -- so whoever
 * wrote the catalogue could not have known it (ADR 0064). This is the only
 * place the question is asked with the count already in hand.
 *
 * THE FOUR VALUES OF N=4 ARE NOT INVENTED: they are the Quad this repository
 * already draws -- a layout of fixed `viewport` that whoever published it
 * composed, and the fourth break of the run that gets recorded -- copied out of
 * the list of ads that declares it. The grid of this phase was on a screen
 * before the phase started, and the test asserts the two agree by reading that
 * list and not a hand-written copy of its numbers.
 *
 * THE N=2 CARRIES BLACK BANDS ON PURPOSE, and it is the row that looks wrong
 * until the arithmetic is done. Two halves of full height would be `0 50 0 0`
 * and `0 0 0 50`, which gives the primary content `sx = 0.5` and `sy = 1`: a
 * picture twice as wide as it is meant to be, with the warning of `movePrimary`
 * firing on every frame. The primary content is moved with a transform and a
 * transform scales what `object-fit` already drew, so the centred crop of
 * ADR 0013 does not save it. With the three shapes of this table `sx == sy`
 * always, and the bands are what that costs. The source is the tool of SVTA,
 * whose `squeezebackDoubleBox` declares the primary content at `25 50 25 0` for
 * the same reason.
 *
 * WHAT COMES OUT IS A `viewport` AND NOT A BOX, which keeps one parse in this
 * layer instead of two: a row of this table goes into `resolveElement` in the
 * same field a declared layout would have filled, and comes out an `Element` of the
 * contract with its `box` already resolved. The rendering side is handed the
 * same four percentages it is handed for an ad and learns nothing new.
 *
 * THE ORDER IS THE ORDER OF THE SELECTION, and the primary content is always
 * the first box. It is a promise of this table and not a detail of how it is
 * written, which is why it is asserted: a list in another order is every box
 * holding somebody else's picture, and there is nothing on a screen that says
 * so (ADR 0065).
 *
 * `N = 1` IS THE EMPTY LIST, and that row is where the way out of the multi
 * view comes from for free: one box is no composition at all, so the last view
 * going down and the button of the way out end in the same event (ADR 0071).
 */
const VIEWPORTS_BY_COUNT = new Map([
  [1, []],
  [2, ['25 50 25 0', '25 0 25 50']],
  [3, ['0 50 50 0', '0 0 50 50', '50 25 0 25']],
  [4, ['0 50 50 0', '0 0 50 50', '50 50 0 0', '50 0 0 50']]
]);

/**
 * How many boxes fit on one screen, which is the cap of ADR 0066 -- of the
 * screen and never of the offer: a catalogue is as long as whoever publishes it
 * wants, and this library does not question it.
 *
 * DERIVED FROM THE TABLE AND NOT TYPED BESIDE IT. The two have to agree, and
 * the way they stop agreeing is a row being added while a number written
 * somewhere else stays where it was.
 */
export const MAX_BOXES = Math.max(...VIEWPORTS_BY_COUNT.keys());

/**
 * The `viewport` of every box, in order, for a composition of `count` of them.
 *
 * A count this table has no shape for -- above `MAX_BOXES`, below one, or not a
 * whole number at all -- comes back as NO COMPOSITION, said out loud. The two
 * alternatives fail in the same direction, which is in silence: fitting more
 * boxes than there are slots draws one on top of another, and handing back the
 * last row drops a box somebody raised. Whoever keeps the selection is the one
 * that holds the cap, so reaching that line means the cap was not applied,
 * which is a defect of that layer and not a shape this one can guess.
 *
 * A fresh array on every call, for the same reason `programRanges` builds one:
 * the table belongs to the library, and a caller that sorted the list it was
 * handed would be re-composing everybody else's screen.
 */
export function viewportsFor(count) {
  const shape = VIEWPORTS_BY_COUNT.get(Number(count));
  if (!shape) {
    console.warn(`[signalling] there is no shape for ${JSON.stringify(count)} boxes: the grid goes` +
      ` from 1 to ${MAX_BOXES} (ADR 0065), so nothing is composed. The cap is of the screen and it` +
      ' belongs to whoever keeps the selection (ADR 0066).');
    return [];
  }
  return [...shape];
}

/**
 * The `type` an item of the payload carries when what it announces is a
 * catalogue. It is `multiViewOffer` and NOT `multiView`, which is one of the
 * six identifiers the SVTA tool emits and which this repository already uses
 * for the Quad -- a layout of fixed `viewport` that whoever published it
 * composed. The two look alike on a screen and have nothing else in common: one
 * is composed by the publisher and the other is built by whoever is watching
 * (ADR 0064).
 *
 * It is exported to be recognised and not to be branched on: what tells an
 * offer from an ad is `isOffer` below, and the type travels to the renderer as
 * the opaque label every other layout has -- `fadesInAndOut` only compares
 * against `'linear'`, so an offer falls on the side that has a transition,
 * which is the right one: raising a camera re-composes, it does not cut.
 */
export const OFFER_TYPE = 'multiViewOffer';

/**
 * What the primary content is listed by when the offer declares no
 * `primaryName`. The programme is one view among the others and therefore one
 * row of a list somebody reads, so it needs a label; whoever publishes is the
 * only one who knows whether it is called "Programme", "Main camera" or "World
 * feed", and when he does not say so, an offer with one generic row is a usable
 * offer and not a broken one (ADR 0064).
 */
export const DEFAULT_PRIMARY_NAME = 'Main feed';

/**
 * Whether an item of the payload announces a catalogue instead of a layout, and
 * THE DISCRIMINANT IS THE FIELD AND NOT A FLAG: an ad carries `layout`, an offer
 * carries `views`. ADR 0064 leaves it written that way on purpose, because it is
 * material for the specification: the extension has two shapes, and which one an
 * item is, is answered by what the item brought.
 */
export function isOffer(item) {
  return Array.isArray(item?.views);
}

/**
 * The three fields a view MUST NOT carry, which are the three whoever publishes
 * cannot decide here: the first two because they depend on how many boxes there
 * are, and `volume` because the opening state of an offer is not a mix somebody
 * composed -- it is "the programme keeps playing", which the asymmetric default
 * above already produces (ADR 0064).
 */
const NOT_DECLARED_BY_AN_OFFER = ['viewport', 'zDepth', 'volume'];

/**
 * One view of the catalogue, which is NOT an `Element` of the contract and is
 * short of being one by exactly the geometry: no `box`, no `zDepth` and no
 * `volume`, because those come out of how many views were raised and by whom,
 * and that is decided a layer above this one (ADR 0072). What it does share is
 * the NAMES -- `uri` and `mediaType` -- so that turning a view into an element
 * is adding geometry to a record and not translating one.
 *
 * A field of `NOT_DECLARED_BY_AN_OFFER` is IGNORED AND SAID OUT LOUD, rather
 * than obeyed or refused. Obeying it would place a box against a number its
 * author never knew; refusing the offer over it would take the whole catalogue
 * away because of one stray key, which is the fallback of ADR 0019 firing for a
 * reason nobody can see on a screen.
 *
 * THE TWO LABELS FALL BACK AND NEITHER FALLS BACK TO NOTHING. A view with no
 * `id` is named by its place in the catalogue, because the identity is what the
 * state of whoever is watching is kept by; a view with no `name` is listed by
 * its `id`, because a row nobody can read is a row nobody can pick.
 */
export function resolveView(source, index) {
  const declared = NOT_DECLARED_BY_AN_OFFER.filter((field) => field in Object(source));
  if (declared.length) {
    console.warn(`[signalling] a view declares ${declared.join(', ')}, which an offer does not` +
      ' carry: where a box goes depends on how many boxes there are, and that is not known when' +
      ' the catalogue is written. Ignored, and the geometry is computed from what is raised.');
  }
  const id = source?.id ?? `view${index}`;
  return {
    id,
    name: source?.name || id,
    uri: source?.uri || null,
    mediaType: source?.type || null
  };
}

/**
 * One item of the `payload` array becomes one experience.
 *
 * THE WINDOW IS BUILT FROM THREE NUMBERS AND EACH ONE ANSWERS A DIFFERENT
 * QUESTION. `slotStart` is the playback time the signal of the break resolves
 * to, so it says where the BREAK begins. `assetStart` is how far into the
 * break the ASSET this item belongs to begins, and whoever resolves the list of
 * ads of the break is the one that knows it. The item's own `start` is an
 * offset from there, inside its own asset.
 *
 * `itemId` is the identity of this ad INSIDE the break, and it is not the same
 * thing as `id`: `id` names the signal of the break and every ad of the break
 * shares it.
 * It falls back to `id` because one experience resolved on its own IS the
 * whole break, and every caller that resolves a list passes it.
 *
 * AND THE ENVELOPE IS THE SAME FOR AN AD AND FOR AN OFFER. Those three numbers,
 * `duration`, `id` and `itemId` are built once below and mean exactly what they
 * mean for an ad, which is the half of ADR 0064 that is easy to miss: an offer
 * is placed on the timeline by the same sum, and the resolution of the list of
 * ads accumulates its offset by the same duration of each asset. What the two
 * do not share is what is INSIDE -- a layout, or a catalogue -- and that is the
 * only branch here.
 */
export function resolveExperience(item, { id, itemId = id, slotStart, assetStart = 0 }) {
  const envelope = {
    id,
    itemId,
    type: item.type,
    identifiers: identifiersOf(item.identifiers),
    startTime: slotStart + assetStart + Number(item.start ?? 0),
    duration: Number(item.duration)
  };
  if (isOffer(item)) {
    return {
      ...envelope,
      // NO ELEMENTS, and it is the honest reading of "a catalogue and not a
      // layout" rather than a gap to be filled later: with nothing raised there
      // is one box on the screen, which is no composition at all, so whoever
      // draws this before anybody has chosen anything draws the programme
      // exactly as it was. The boxes appear when there is somebody choosing,
      // and that somebody lives a layer above this one (ADR 0065, ADR 0072).
      elements: [],
      views: item.views.map((view, index) => resolveView(view, index)),
      primaryName: item.primaryName || DEFAULT_PRIMARY_NAME
    };
  }
  return { ...envelope, elements: layoutElements(item.layout) };
}

/**
 * The elements of one layout, in the shape the contract declares: the primary
 * content with its default when the layout omits it, then the assets, ordered
 * by ascending `zDepth`. It is what `resolveExperience` draws an ad with, and
 * what every alternative option of `Experience.options` is drawn with too, so
 * the two cannot resolve the same layout two ways.
 */
export function layoutElements(layout) {
  const source = layout || {};
  const primary = source.primaryContent ?? DEFAULT_PRIMARY; // default #1
  return [resolveElement({ id: 'primaryContent', ...primary }, true)]
    .concat((source.assets || []).map((a) => resolveElement(a, false)))
    // Ascending: the renderer draws in this order and the last one is on top.
    // Array.sort is stable, so equal zDepth keeps the order of the payload.
    .sort((a, b) => a.zDepth - b.zDepth);
}

/**
 * The AdIdentifiers of a Slot (SVTA2053, `identifiers`), as the contract carries
 * them: each one a `{ scheme, value }` of two non-empty strings, in the order the
 * list declared them (ADR 0093).
 *
 * IT IS PASSED THROUGH AND NOT INTERPRETED. Which registry a scheme names, and
 * whether a value is a well-formed code of it, is a question for whoever
 * reconciles the measurement, and that is not this side. What this layer
 * guarantees is the shape, so a consumer can read the two fields without
 * checking them.
 *
 * AN ENTRY THAT IS NOT ONE IS DROPPED, AND A MISSING FIELD IS AN EMPTY LIST. The
 * spec makes the field mandatory on the Slot, but the tool of ADR 0004 does not
 * emit it, and a list without it is still a list that can be drawn: refusing it
 * would trade an identifier nobody reads yet for an ad nobody sees.
 */
export function identifiersOf(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x) => typeof x?.scheme === 'string' && x.scheme.trim() &&
      typeof x?.value === 'string' && x.value.trim())
    .map((x) => ({ scheme: x.scheme.trim(), value: x.value.trim() }));
}

/**
 * Every AdIdentifier the Slots of a block declare, without repeats. It is what
 * an asset that falls back to its `URI` keeps (ADR 0019): the default is the
 * same ad played another way, so it is measured as the same ad.
 */
export function blockIdentifiers(block) {
  const seen = new Set();
  const out = [];
  for (const item of Array.isArray(block?.payload) ? block.payload : []) {
    for (const identifier of identifiersOf(item?.identifiers)) {
      const key = `${identifier.scheme}\n${identifier.value}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(identifier);
    }
  }
  return out;
}

/**
 * What the contract calls an ad this layer drew no layout for. It is a label
 * of OUR side and not a value anybody has to write in the list of ads: the
 * alternative the phase rejected was asking the list to declare
 * `"type": "linear"`, which the tool does not emit and which the standard
 * already expresses by the block simply not being there.
 */
export const LINEAR_TYPE = 'linear';

/** The id the one element of a synthesized linear experience carries. */
export const LINEAR_ELEMENT_ID = 'linear';

/**
 * Whether the block of an asset is one this client can draw, and it is the
 * fallback decision of ADR 0019 written as a function: it returns the payload
 * when the block is usable and `null` when it is not, and the caller does the
 * same thing in both of the `null` cases.
 *
 * THE UNIT OF THE FALLBACK IS THE ASSET AND NOT THE ITEM. One unreadable item
 * takes its whole asset to the linear path, because what the fallback plays is
 * the asset's `URI` -- a per-item fallback would have to play that same `URI`
 * for one item while drawing the layout of another over it, which is one ad on
 * top of itself.
 *
 * WHAT IS CHECKED IS WHAT IS DRAWN, and the list is short on purpose: no
 * payload at all, an item with no window -- a `duration` that is not a
 * positive number -- and nothing to draw, which is a layout with no assets in
 * it for an ad and a catalogue with no views in it for an offer. Those are the
 * three shapes that cannot become a box on a screen no matter what the renderer
 * does, and the third one is ONE shape and not two: what an offer has instead
 * of a layout is a catalogue, so the check moves to the other field and stays
 * the same check.
 *
 * TWO THINGS ARE DELIBERATELY NOT CHECKED, and each one would break something
 * that works. An element with an EMPTY `uri` is not a failure of the block:
 * the SVTA tool emits `"uri": ""` in every one of its six payloads, with
 * `"URI": "[PATH TO ASSET]"` above it, so a client that took that for
 * unreadable would fall back on every list the tool produces, and
 * ADR 0004 is exactly the decision not to do that. And the `type` of an
 * element -- see the contract for why the media type is not a fallback of this
 * layer.
 */
export function usablePayload(block) {
  if (block == null) return null;
  const payload = block.payload;
  if (!Array.isArray(payload) || payload.length === 0) return null;
  for (const item of payload) {
    if (!item || typeof item !== 'object') return null;
    if (!(Number(item.duration) > 0)) return null;
    const drawable = isOffer(item) ? item.views : item.layout?.assets;
    if (!Array.isArray(drawable) || drawable.length === 0) return null;
  }
  return payload;
}

/**
 * The experience a bare asset becomes: ONE element at full frame with the
 * asset's own `URI`, on top of the primary content, and the primary content
 * underneath, covered and silent -- and STILL PLAYING, which is the whole of
 * why this shape was chosen. Nothing here is a new field of the contract: it
 * is the same `viewport`, `zDepth` and `volume` every other layout uses, so
 * the renderer draws a linear ad without learning a single thing.
 *
 * The volume is the one asymmetry: 100 on the ad and 0 on the programme, which
 * is the opposite of the default a missing field takes (ADR 0014). A concurrent
 * ad that says nothing about its audio enters silent because it is mixed OVER a
 * programme somebody is listening to; this one is not mixed over anything --
 * it covers the frame, and an ad at full frame with no sound is a fault
 * nothing on screen reports.
 */
export function linearItem(uri, duration, identifiers = []) {
  return {
    type: LINEAR_TYPE,
    start: 0,
    duration,
    identifiers,
    layout: {
      primaryContent: { zDepth: 0, volume: 0, viewport: '0 0 0 0' },
      assets: [{ id: LINEAR_ELEMENT_ID, uri, viewport: '0 0 0 0', zDepth: 1, volume: 100 }]
    }
  };
}

/**
 * An ad experience with what the renderer needs to fail over on its own (ADR
 * 0107), which is three fields of the contract and nothing that names the
 * transport:
 *
 *   options   the layoutOptions handed over, IN THE ORDER TO TRY THEM, each one
 *             `{ index, type, elements }`: `index` is its place in the
 *             `layoutOptions` of the item (`null` for a linear ad), and the
 *             FIRST is the one to try first, the one `type` and `elements`
 *             already describe. The rest are the later options that fit the
 *             capabilities and did not fail pre-validation, not yet requested.
 *   fallback  the linear default of the asset, as an experience of its own --
 *             full frame, with the window of the whole asset -- or `null` when
 *             the asset has none, or when this experience already is it.
 *   assetId   which asset of the list this came from: the fallback is the
 *             asset's, so running out of options on one item takes every item
 *             of that asset to it.
 *
 * `ranked` is the list `narrowBlock` kept for the item, `{ index, option }`;
 * without it the experience is its own single option.
 */
export function withOptions(experience, { assetId, fallback = null, ranked = null }) {
  const first = { index: ranked?.[0]?.index ?? null, type: experience.type, elements: experience.elements };
  const later = (ranked ?? []).slice(1).map(({ index, option }) => ({
    index, type: option.type, elements: layoutElements(option.layout)
  }));
  experience.options = [first, ...later];
  experience.fallback = fallback;
  experience.assetId = assetId;
  return experience;
}

/**
 * The window a concurrent break occupies on the primary timeline, built from
 * the experiences its list of ads resolved into: from the first one to start
 * to the last one to end. One signal of a break is ONE range of the programme
 * even when its payload declares several experiences, because what a bar marks
 * is the break and not each ad inside it.
 *
 * THE KIND COMES FROM THE CLASS AND NOT FROM WHAT THE LIST RESOLVED INTO. A
 * break signalled with the offer class whose list fell back to a linear ad
 * (ADR 0019) is still a range of that kind: what the kind answers is which
 * class of window this was, and that was decided by whoever signalled it, not
 * by how well it could be read afterwards. The default is the concurrent one
 * because that was the only kind with a list to resolve before ADR 0063, so
 * every caller that was already passing two arguments keeps the value it
 * already produced.
 */
export function rangeOfExperiences(id, experiences, kind = 'concurrent') {
  if (!experiences.length) return null;
  const startTime = Math.min(...experiences.map((e) => e.startTime));
  const end = Math.max(...experiences.map((e) => e.startTime + e.duration));
  return { id, kind, startTime, duration: end - startTime };
}

/** The activation window, half open: active from startTime, out at the end. */
export function activeAt(experiences, time) {
  return experiences.filter((e) => time >= e.startTime && time < e.startTime + e.duration);
}
