// signalling.js -- the signalling layer of ADR 0003.
//
// It has ONE job: for a given playback time, hand over the list of active
// concurrent experiences with their layout already resolved. Everything that
// knows the word HLS lives on this side of the seam: the LEVEL_UPDATED
// subscription, the Date Ranges, the asset-list request, and the
// X-AD-CREATIVE-SIGNALING block. What comes out the other end is the contract,
// and the contract is plain data -- see docs/contrato-senalizacion-renderizado.md.
//
// The pure functions are exported one by one on purpose: they are the surface
// the tests of T-08 aim at, and the module reaches for the `Hls` global only
// INSIDE createSignalling(), so `node --test` can import this file.

/** The class of ADR 0009: sibling of Apple's interstitial, not an extension. */
export const CONCURRENT_CLASS = 'com.qualabs.hls.concurrentInterstitial';

/**
 * Apple's traditional interstitial. The same playlist signals one per break for
 * the clients that are already in the market (ADR 0007), and this layer used to
 * drop it by class because nothing here plays it. It is read now because the
 * ranges of the programme say WHICH KIND each range is, and that one is a kind:
 * it marks where a market client would have stopped.
 */
export const INTERSTITIAL_CLASS = 'com.apple.hls.interstitial';

/**
 * The class of ADR 0063: a window in which several feeds are OFFERED and
 * whoever is watching raises the ones he wants to see. Sibling of the other two
 * and an extension of neither -- a class is compared by exact equality of the
 * string and the format has no inheritance for "extends" to mean anything, so
 * what relates the three is that this layer reads all three and nothing else.
 *
 * What it announces is a CATALOGUE and not a layout, and that is the whole of
 * the difference downstream (ADR 0064): an ad declares where each box goes, and
 * an offer cannot, because where a box goes depends on how many boxes there
 * are, and that number is decided on the other side of the network, several
 * times, while the window is open.
 */
export const MULTIVIEW_CLASS = 'com.qualabs.hls.multiViewInterstitial';

/**
 * The kind of range a Date Range class means. This object is the ONE place a
 * class string is turned into something the contract can carry: the kind
 * crosses the seam, the class never does (ADR 0003). A class that is not in
 * here is not a range of the programme.
 *
 * A KIND IS READ BY THREE TABLES DOWNSTREAM, AND A KIND IN TWO OF THEM FAILS IN
 * SILENCE. One of the three says which kinds THIS player plays, and a kind
 * missing from it never reaches a bar at all; the other two give a kind its
 * colour and its name, and a range with no colour is not drawn while a range
 * with no name is drawn without a tooltip. None of the three throws, which is
 * why what holds them together is a test that asserts their keys agree
 * (ADR 0063): it turns "remember to touch all three" into something that cannot
 * be forgotten.
 */
export const KIND_OF_CLASS = {
  [CONCURRENT_CLASS]: 'concurrent',
  [INTERSTITIAL_CLASS]: 'interstitial',
  [MULTIVIEW_CLASS]: 'multiview'
};

export function kindOfClass(hlsClass) {
  return KIND_OF_CLASS[hlsClass] ?? null;
}

/**
 * The kinds whose Date Range carries an X-ASSET-LIST this layer goes and reads.
 * The other one is reported off the tag alone: nothing on this side plays it,
 * so there is no list to ask for and nothing to resolve, and its window is the
 * one the tag declares (`rangeOfDateRange`).
 *
 * It is a set of KINDS and not of classes, so it is written on the contract's
 * side of the translation and not on the transport's: what decides whether a
 * list is fetched is the kind of experience the tag announces, which is exactly
 * what `KIND_OF_CLASS` above just answered.
 */
export const KINDS_RESOLVED = new Set(['concurrent', 'multiview']);

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
 * WHY THE LIBRARY COMPUTES THIS AND AN ASSET-LIST DOES NOT DECLARE IT. Where a
 * box goes depends on HOW MANY boxes there are, and that number is decided by
 * whoever is watching, several times, while the window is open -- so whoever
 * wrote the catalogue could not have known it (ADR 0064). This is the only
 * place the question is asked with the count already in hand.
 *
 * THE FOUR VALUES OF N=4 ARE NOT INVENTED: they are the Quad this repository
 * already draws -- a layout of fixed `viewport` that whoever published it
 * composed, and the fourth break of the run that gets recorded -- copied out of
 * its asset-list. The grid of this phase was on a screen before the phase
 * started, and the test asserts the two agree by reading that asset-list and
 * not a hand-written copy of its numbers.
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
 * same field an asset-list would have filled, and comes out an `Element` of the
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
 * QUESTION. `slotStart` is the playback time the Date Range's START-DATE
 * resolves to, so it says where the BREAK begins. `assetStart` is how far into
 * the break the ASSET this item belongs to begins, and `resolveAssetList`
 * below is the one that knows it. The item's own `start` is an offset from
 * there, inside its own asset.
 *
 * `itemId` is the identity of this ad INSIDE the break, and it is not the same
 * thing as `id`: `id` names the Date Range and every ad of the break shares it.
 * It falls back to `id` because one experience resolved on its own IS the
 * whole break, and every caller that resolves a list passes it.
 *
 * AND THE ENVELOPE IS THE SAME FOR AN AD AND FOR AN OFFER. Those three numbers,
 * `duration`, `id` and `itemId` are built once below and mean exactly what they
 * mean for an ad, which is the half of ADR 0064 that is easy to miss: an offer
 * is placed on the timeline by the same sum, and `resolveAssetList` accumulates
 * its offset by the same `DURATION`. What the two do not share is what is
 * INSIDE -- a layout, or a catalogue -- and that is the only branch here.
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

/** The extension of ADR 0019: our block, on top of the standard asset. */
export const BLOCK = 'X-AD-CREATIVE-SIGNALING';

/**
 * What the contract calls an ad this layer drew no layout for. It is a label
 * of OUR side and not a value anybody has to write in an asset-list: the
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
 * unreadable would fall back on every asset-list the tool produces, and
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

/** The asset's own `URI`, which is what the fallback plays, or null. */
export function usableUri(asset) {
  const uri = asset?.URI;
  return typeof uri === 'string' && uri.trim() ? uri.trim() : null;
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
 * What happens to ONE asset of a list, decided and not yet acted on: the items
 * narrowed to their options, the payload this client can draw or `null`, the
 * asset's own `URI` and `DURATION`, the first requests it is still waiting on,
 * and whether the first request for its default failed. `resolveAssetList`
 * acts on it and `pendingFirstRequests` only reads `pending`, so the two cannot
 * disagree about which request an asset needs next.
 *
 * THE DEFAULT IS ASKED FOR ONLY WHEN IT IS GOING TO BE PLAYED. Its first
 * request is made when no option is left, and not alongside the options: a
 * request for an ad nobody shows is a request the ad server may count.
 */
function decideAsset(asset, capabilities, loads) {
  const items = [];
  const pending = [];
  const block = narrowBlock(asset?.[BLOCK], capabilities, items, loads, pending);
  const payload = pending.length ? null : usablePayload(block);
  const uri = usableUri(asset);
  const declared = Number(asset?.DURATION);
  let defaultFailed = null;
  if (loads && !pending.length && !payload && uri && declared > 0) {
    const load = loads.get(uri);
    if (!load) pending.push({ uri, mediaType: null });
    else if (!load.ok) defaultFailed = { uri, error: load.error };
  }
  return { items, block, payload, uri, declared, pending, defaultFailed };
}

/**
 * The first requests an asset-list still needs before it can be resolved,
 * given the ones already answered in `loads`: for each asset, those of the
 * first option that fits and has not failed, or those of its default when no
 * option is left. Each `{ uri, mediaType }` once, however many assets share it.
 * Empty means `resolveAssetList` can run with `loads` and decide everything.
 */
export function pendingFirstRequests(assetList, { capabilities = null, loads }) {
  const seen = new Map();
  for (const asset of Array.isArray(assetList?.ASSETS) ? assetList.ASSETS : []) {
    for (const request of decideAsset(asset, capabilities, loads).pending) {
      if (!seen.has(request.uri)) seen.set(request.uri, request);
    }
  }
  return [...seen.values()];
}

/**
 * `resolveAssetList` with PRE-VALIDATION in it: the up-front half of the "Asset
 * load failure" of SVTA2053 5.3.3 (ADR 0096, and since ADR 0097 an optional
 * step, `preValidateAssets`). Before the list is handed over, the first request
 * for each asset of the first option that fits is made -- the playlist its
 * `uri` references, or the image -- and an option one of whose first requests
 * failed is discarded and the next one that fits is requested. When none is
 * left, the first request for the default linear ad is made, and when that
 * fails too the asset is skipped.
 *
 * ITS ONLY EFFECT IS ON THE LIST THE RENDERER IS HANDED (ADR 0097). An option
 * that failed here is not in `Experience.options`, so the renderer never mounts
 * it; what it does mount, and what it falls to when that fails on screen, is
 * the renderer's own failover, which runs whether this ran or not. There is no
 * second failover here: this one decides before the window, that one during
 * the preload, and they share the rule and not the code.
 *
 * `firstRequest(uri, mediaType)` makes the request and answers `{ ok, error }`,
 * and may say which `method` answered. It is injected because how a request is
 * made is the business of the piece that knows the player library
 * (`firstRequest` in media.js, which takes `preValidateMethod`), and because it
 * is what a test replaces. A request that throws counts as failed.
 *
 * IT GOES IN ROUNDS, and a round is every request no answer is known for yet,
 * all at once: the first fitting option of every asset in the first round, and
 * then only what a failure made necessary. So a list whose assets all load
 * costs one round, and the second option of an ad is never asked for unless the
 * first one failed. It ends because every round answers at least one request
 * nobody had answered, and a list has a finite number of them.
 *
 * ONLY THE FIRST REQUEST COUNTS, and that is the whole scope of the rule: what
 * fails after it -- a segment, a variant, a decode -- is a playback error of
 * the ad that was already chosen, and nothing here changes option or falls
 * back over it. The answers live for one asset-list and are not shared between
 * breaks.
 *
 * Returns the experiences, as `resolveAssetList` does, and fills `requests`,
 * when given, with every first request made: `{ uri, ok, error, method }`.
 */
export async function resolveWithFirstRequests(assetList, {
  id, slotStart, capabilities = null, report = null, firstRequest, requests = null
}) {
  const loads = new Map();
  for (let round = pendingFirstRequests(assetList, { capabilities, loads }); round.length;
    round = pendingFirstRequests(assetList, { capabilities, loads })) {
    await Promise.all(round.map(async ({ uri, mediaType }) => {
      let answer;
      try {
        answer = await firstRequest(uri, mediaType);
      } catch (error) {
        answer = { ok: false, error: String(error?.message || error) };
      }
      const load = answer?.ok ? { ok: true } : { ok: false, error: answer?.error || 'the request failed' };
      loads.set(uri, load);
      requests?.push(answer?.method ? { uri, ...load, method: answer.method } : { uri, ...load });
    }));
  }
  return resolveAssetList(assetList, { id, slotStart, capabilities, report, loads });
}

/**
 * Every experience an asset-list declares, one behind the other.
 *
 * THE ORDER IS NOT OURS AND THE OFFSET IS. The assets are played in the order
 * of the `ASSETS` array -- Appendix D.2 of the standard, and there is nothing
 * to decide there. What the standard has no field for is WHERE each one lands
 * on the timeline of the programme, so this layer decides it, and it decides
 * it from the top-level `DURATION`: each asset begins where the ones before it
 * ended, accumulated. The item's `start` then places the item inside its own
 * asset, which is where the block that carries it lives.
 *
 * WHY THE `DURATION` AND NOT THE `start`. The offset has to come out of a
 * field that EVERY asset has. `DURATION` is one of the two members Appendix
 * D.2 makes mandatory on every Asset-Description; the block is our extension
 * and an asset is allowed not to carry one -- that asset is a linear ad, and
 * it has nowhere to write a `start`. A rule written on the `start` would work
 * for the ads we draw and have nothing to say about the one we do not.
 *
 * The six payloads the tool emits carry a single asset with `start: 0`, so the
 * accumulator is 0 and the two readings agree on every one of them, which is
 * why nothing written against the old rule moves.
 *
 * WHAT IT COSTS, AND IT IS NOT HIDDEN. The `DURATION` is DECLARED metadata: a
 * decisioning server can declare one thing and serve a creative of another
 * length, and then the ads that come after are placed against a number that
 * was never true. Which end of that the layer takes is written in
 * docs/contrato-senalizacion-renderizado.md.
 *
 * AND EVERY ASSET RESOLVES ONE OF THREE WAYS, which is ADR 0019 plus the first
 * and third rungs of Appendix D.5, in one place because they are one decision:
 * a usable block becomes the experiences it declares; an asset without one --
 * declared bare, or carrying a block this client cannot draw -- becomes ONE
 * experience that plays its own `URI` at full frame; and an asset with neither
 * is skipped, alone, with the assets after it left where they were.
 *
 * WHAT "USABLE" MEANS DEPENDS ON THE DEVICE SINCE ADR 0085. Before the block is
 * judged, `narrowBlock` keeps, per item, the first of its `layoutOptions` the
 * configured `capabilities` fit; an item with none left makes the block unusable, and
 * the asset goes down the same two paths as any other block this client cannot
 * draw -- its `URI` as the default linear ad, or skipped when it has none.
 * AND SINCE ADR 0096, "USABLE" ALSO MEANS "ITS ASSETS LOAD". `loads`, when
 * given, is what the first request for each asset answered (a Map of `uri` to
 * `{ ok, error }`, written by `resolveWithFirstRequests`): an option whose first
 * request failed is passed over for the next one that fits, and a default
 * linear ad whose first request failed is skipped (SVTA2053 5.3.3, "Asset load
 * failure", and 6.6.4). An asset that still needs a first request nobody has
 * made yet is `pending`, draws nothing, and is what `pendingFirstRequests`
 * lists. Without `loads` nothing is requested and every asset counts as loaded,
 * which is how this function behaved before ADR 0096.
 *
 * `report`, when given, receives one entry per asset: the items' selection and
 * the `outcome`, which is `drawn`, `default` (a block that could not be drawn,
 * played as its `URI`), `linear` (no block at all), `skipped` or `pending`. An
 * asset skipped because the first request for its default failed carries that
 * request in `defaultFailed`, `{ uri, error }`. Each entry also carries its
 * `assetId`, and in `fallback` the `URI` of the default handed to the renderer
 * as its last resort when the asset was drawn, `null` otherwise (ADR 0097).
 *
 * WHAT THE OUTCOME SAYS IS WHAT WAS HANDED OVER, NOT WHAT WAS SHOWN. Since ADR
 * 0097 the renderer can still fall to a later option, to the default or to
 * nothing when an asset fails to load on screen, and what it ends up
 * presenting is reported by the renderer (`onPresented`), not here.
 */
export function resolveAssetList(assetList, { id, slotStart, capabilities = null, report = null, loads = null }) {
  const out = [];
  const assets = assetList?.ASSETS;
  // The third rung of Appendix D.5, and the whole of it: a list with no assets
  // resolves by APPLYING THE OFFSET AND PLAYING NOTHING. Under this render
  // there is no offset to apply, because the primary was never stopped -- so
  // the break contributes no experience, no range, and no interruption. It is
  // said out loud because "nothing happened" is exactly what a break that is
  // silently broken looks like.
  if (!Array.isArray(assets) || assets.length === 0) {
    console.warn(`[signalling] ${id}: the list declares no ASSETS. The break plays nothing and the` +
      ' programme is not interrupted (Appendix D.5, resolved by applying the offset).');
    return out;
  }
  let assetStart = 0;
  for (const [assetIndex, asset] of assets.entries()) {
    const { items, block, payload, uri, declared, pending, defaultFailed } = decideAsset(asset, capabilities, loads);
    // The ad this asset is, whatever happens to it below: drawn, played as its
    // default, or skipped, a page can say WHICH ad it was (ADR 0093).
    const identifiers = blockIdentifiers(asset?.[BLOCK]);
    // WHICH ASSET OF THE LIST, because the unit of the fallback is the asset
    // (see `usablePayload`): when the renderer runs out of options for one item,
    // every item of the same asset goes to its default with it (ADR 0097).
    const assetId = `${id}.a${assetIndex}`;
    const entry = { items, outcome: null, identifiers, assetId, fallback: null };
    report?.push(entry);
    for (const { discarded, offered } of items) {
      for (const { index, reason } of discarded) {
        console.log(`[signalling] ${id}: option ${index + 1} of ${offered.length} discarded, it ${reason}.`);
      }
    }
    if (pending.length) {
      // Only reachable by calling this with `loads` half written: the driver,
      // `resolveWithFirstRequests`, makes every first request before it calls
      // this. Nothing is drawn and nothing falls back, because neither is known
      // yet; the window stays where it is.
      entry.outcome = 'pending';
    } else if (payload) {
      entry.outcome = 'drawn';
      // The default the renderer falls to when every option it was handed for
      // an item of this asset fails to load (ADR 0097). It is not requested
      // here: a request for an ad nobody shows is a request the ad server may
      // count, and the renderer asks for it only if it gets that far.
      const fallback = uri && declared > 0
        ? withOptions(resolveExperience(linearItem(uri, declared, identifiers),
          { id, itemId: `${assetId}.default`, slotStart, assetStart }), { assetId })
        : null;
      entry.fallback = fallback ? uri : null;
      payload.forEach((item, i) => {
        // The ordinal of the whole list and not of the ASSETS array, so that two
        // items of a single asset are two identities and not one.
        const experience = resolveExperience(item, { id, itemId: `${id}.${out.length}`, slotStart, assetStart });
        out.push(isOffer(item) ? experience : withOptions(experience, { assetId, fallback, ranked: block.ranked?.[i] }));
      });
    } else if (uri && declared > 0 && !defaultFailed) {
      // THE ONE PATH OF ADR 0019, TAKEN BY TWO KINDS OF ASSET. One is the
      // linear ad, declared the way it was always declared: `URI`, `DURATION`,
      // and no block of ours. The other is an ad we WOULD have drawn and
      // cannot, because its block is unreadable, asks for something this
      // client does not do, or has no option the configured capabilities fit. They are not the same event and they are said
      // differently below, but what is played is the same thing: the asset's
      // own `URI`, full frame, over a programme that keeps running behind it.
      entry.outcome = block == null ? 'linear' : 'default';
      if (block == null) {
        console.log(`[signalling] ${id}: an ASSET carries no layout block, so it is a linear ad and` +
          ' plays its own URI full frame (ADR 0019).');
      } else {
        console.warn(`[signalling] ${id}: an ASSET carries a layout block this client cannot draw,` +
          " so it falls back to the asset's own URI and plays as a linear ad (ADR 0019).");
      }
      out.push(withOptions(resolveExperience(linearItem(uri, declared, identifiers),
        { id, itemId: `${id}.${out.length}`, slotStart, assetStart }), { assetId }));
    } else {
      // The FIRST rung of Appendix D.5, and the distinction it makes is the
      // one that matters: what is skipped is THAT ASSET and not the break. The
      // accumulator below still advances by the declared DURATION, so the
      // assets after it keep the windows they already had -- a skip that moved
      // them would be the break failing, one asset at a time.
      entry.outcome = 'skipped';
      if (defaultFailed) {
        // The last sentence of the "When no option fits" of SVTA2053 5.3.3: the
        // default linear ad is also an asset with a first request, and when
        // that request fails there is nothing left to play, so the asset goes
        // the way of one that never had a default (ADR 0096).
        entry.defaultFailed = defaultFailed;
        console.warn(`[signalling] ${id}: an ASSET falls to its linear default and the first request` +
          ` for it failed (${defaultFailed.uri}: ${defaultFailed.error}), so THAT asset is skipped and` +
          ' the break is not (SVTA2053 5.3.3 and 6.6.4, ADR 0096).');
      } else console.warn(`[signalling] ${id}: an ASSET has nothing this client can play -- no usable` +
        ' layout block and no usable URI with a DURATION -- so THAT asset is skipped and the break' +
        ' is not. The assets after it keep their windows (Appendix D.5).');
    }
    if (!Number.isFinite(declared)) {
      console.warn(`[signalling] ${id}: an ASSET declares no usable DURATION, so the assets after` +
        ' it start where it did instead of after it. DURATION is mandatory on every asset.');
    }
    assetStart += Number.isFinite(declared) ? declared : 0;
  }
  return out;
}

/**
 * An ad experience with what the renderer needs to fail over on its own (ADR
 * 0097), which is three fields of the contract and nothing that names the
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
function withOptions(experience, { assetId, fallback = null, ranked = null }) {
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
 * the experiences its asset-list resolved into: from the first one to start to
 * the last one to end. One Date Range is ONE range of the programme even when
 * its payload declares several experiences, because what a bar marks is the
 * break and not each ad inside it.
 *
 * THE KIND COMES FROM THE CLASS AND NOT FROM WHAT THE LIST RESOLVED INTO. A tag
 * of the offer class whose asset-list fell back to a linear ad (ADR 0019) is
 * still a range of that kind: what the kind answers is which class of window
 * this was, and that was decided by whoever signalled it, not by how well it
 * could be read afterwards. The default is the concurrent one because that was
 * the only kind with a list to resolve before ADR 0063, so every caller that
 * was already passing two arguments keeps the value it already produced.
 */
export function rangeOfExperiences(id, experiences, kind = 'concurrent') {
  if (!experiences.length) return null;
  const startTime = Math.min(...experiences.map((e) => e.startTime));
  const end = Math.max(...experiences.map((e) => e.startTime + e.duration));
  return { id, kind, startTime, duration: end - startTime };
}

/**
 * The window of a range that is NOT resolved. Nothing on this side plays the
 * traditional interstitial, so there is no asset-list to ask for and no payload
 * to read: its length is the one the tag declares, DURATION if it is there and
 * PLANNED-DURATION otherwise. A tag that declares neither cannot be placed on a
 * bar, and an unplaceable range is not reported at all.
 */
export function rangeOfDateRange(id, dateRange, startTime) {
  // `== null` before the conversion, and not `Number.isFinite` alone:
  // `Number(null)` is 0, so a tag that declares nothing would come out as a
  // range of zero seconds instead of no range at all.
  const declared = dateRange.duration ?? dateRange.plannedDuration;
  const duration = Number(declared);
  if (declared == null || !Number.isFinite(duration)) {
    console.warn(`[signalling] ${id} declares neither DURATION nor PLANNED-DURATION: not a range`);
    return null;
  }
  return { id, kind: 'interstitial', startTime, duration };
}

/** The activation window, half open: active from startTime, out at the end. */
export function activeAt(experiences, time) {
  return experiences.filter((e) => time >= e.startTime && time < e.startTime + e.duration);
}

/**
 * Playback time of an instant of the programme clock. `anchor` is a fragment
 * with a known EXT-X-PROGRAM-DATE-TIME: `{ start, programDateTime }`, seconds
 * of playback and milliseconds since the epoch.
 */
export function mediaTimeOf(date, anchor) {
  return anchor.start + (date.getTime() - anchor.programDateTime) / 1000;
}

/**
 * The `CUE` of a Date Range (HLS, EXT-X-DATERANGE: an enumerated-string-list of
 * PRE, POST and ONCE), as `{ pre, post, once }`. hls.js 1.7.2 already parses it
 * on every Date Range, whatever its class (`DateRange.cue`, src/loader/
 * date-range.ts, falling back to `X-CUE`), and that is what is read when it is
 * there; a plain object, as the tests hand over, is read off `attr` the same way
 * hls.js reads it: split on spaces and commas, lowercased.
 *
 * hls.js also DROPS a Date Range that says PRE and POST at once ("(!this.attr.CUE
 * || (!this.cue.pre && !this.cue.post) || this.cue.pre !== this.cue.post)" in
 * `isValid`, and the parser keeps only valid ones), so that pair never reaches
 * this layer from a real player.
 *
 * PRE and POST change where a break goes and when its list is asked for (ADR
 * 0100, ADR 0101): a preroll where playback begins, a post-roll after the end,
 * where only its linear default plays. ONCE is read and not acted on: a ONCE
 * break plays again on a seek back, as every break here does.
 */
export function cueOf(dateRange) {
  const parsed = dateRange?.cue;
  if (parsed && typeof parsed === 'object') {
    return { pre: !!parsed.pre, post: !!parsed.post, once: !!parsed.once };
  }
  const attr = dateRange?.attr ?? {};
  const raw = attr.CUE ?? attr['X-CUE'];
  const words = new Set(String(raw ?? '').split(/[ ,]+/).filter(Boolean).map((w) => w.toLowerCase()));
  return { pre: words.has('pre'), post: words.has('post'), once: words.has('once') };
}

/**
 * Where a PRE-ROLL sits on the programme (ADR 0100): where playback begins, and
 * NOT at its START-DATE. It is hls.js's reading: `startOffset` is "this.cue.pre ?
 * 0 : this.startTime" (src/loader/interstitial-event.ts), the schedule puts a
 * preroll first whatever its date, and `checkStart` plays it before the
 * primary at whatever `startPosition` playback begins. A non-linear ad does not
 * stop the programme, so "before the primary" becomes "over the primary, from
 * the second playback begins at": `startPosition` when the player was told one,
 * and 0 otherwise (-1, hls.js's "not set", is 0 on a VOD).
 *
 * ON A LIVE PLAYLIST "WHERE PLAYBACK BEGINS" IS THE LIVE JOIN POINT, and -1 is
 * not 0 there: pass `live` (see `liveStartPosition`). It answers `null` when
 * the join point is not known yet, and the caller waits for it.
 */
export function preRollStart(startPosition, live = null) {
  if (live?.live) return liveStartPosition({ startPosition, ...live });
  const at = Number(startPosition);
  return Number.isFinite(at) && at > 0 ? at : 0;
}

/**
 * WHERE A LIVE PLAYLIST IS JOINED, which is where a preroll goes on one (ADR
 * 0100, note of 2026-10-22). It is hls.js 1.7.2's `getLiveStartPos`
 * (src/controller/interstitials-controller.ts), line for line:
 *
 *     const behindLive = (this.primaryDetails?.targetduration || 10) * 3;
 *     if (startPosition === -1 || (liveSync && liveSync - startPosition < behindLive)) {
 *       return liveSync || 0;
 *     }
 *     return startPosition;
 *
 * and it is what `livePrerollResumption` resumes the primary at after a live
 * preroll without X-RESUME-OFFSET: the preroll plays first and the programme
 * is joined at the live sync position (`hls.liveSyncPosition`: the live edge
 * minus the target latency), or at the `startPosition` the player was told when
 * that is more than three target durations behind it. A non-linear preroll
 * does not stop the programme, so it is drawn over it FROM that point.
 *
 * ONE DIFFERENCE, SAID OUT LOUD. hls.js answers 0 when there is no sync
 * position yet, because it only asks after the preroll played, when there is
 * one. This layer has to place the window before, so it answers `null` -- "not
 * known yet" -- and the caller waits for the next playlist update. A sync
 * position of exactly 0 (a stream that has just begun) is a known 0.
 */
export function liveStartPosition({ startPosition = -1, liveSyncPosition = null, targetDuration = null } = {}) {
  const start = Number(startPosition);
  const sync = liveSyncPosition == null ? null : Number(liveSyncPosition);
  const known = sync != null && Number.isFinite(sync);
  const behindLive = (Number(targetDuration) > 0 ? Number(targetDuration) : 10) * 3;
  const unset = !Number.isFinite(start) || start < 0;
  if (unset || (known && sync && sync - start < behindLive)) return known ? sync : null;
  return start;
}

/**
 * WHAT HAPPENS TO A PREROLL, decided when its Date Range is first seen (ADR
 * 0100 and its note of 2026-10-22). Three answers:
 *
 *   `{ start }`       it is placed at `start` (see `preRollStart`).
 *   `{ wait: true }`  live, and the join point is not known yet: ask again on
 *                     the next playlist update.
 *   `{ late: true }`  it was first seen AFTER playback had joined, so it is
 *                     not presented at all.
 *
 * THE THIRD ONE IS hls.js's TOO, and it is why a preroll never plays twice on a
 * live stream. hls.js steps into a preroll only in `checkStart`, and only on
 * the first pass (`timelinePos === -1`): "else if (interstitialEvents[0].cue.pre)
 * { ... this.setSchedulePosition(index); }". After that the schedule is parsed
 * again on every playlist reload (`parseInterstitialDateRanges` on
 * LEVEL_UPDATED), and an event already known keeps its state ("Update
 * InterstitialEvent already parsed and mapped"), so the same preroll is not
 * stepped into again; and a preroll that shows up on a later reload is put
 * first in the schedule, at 0, behind a playhead that is already past it -- it
 * is never reached. On a VOD every Date Range is there on the first update, so
 * the third answer only happens on live.
 */
export function preRollPlacement({ startPosition = -1, live = false, liveSyncPosition = null,
  targetDuration = null, joined = false } = {}) {
  if (joined) return { late: true };
  const start = preRollStart(startPosition, live ? { live, liveSyncPosition, targetDuration } : null);
  return start == null ? { wait: true } : { start };
}

/**
 * WHERE A POST-ROLL GOES: at the end of the programme, and not at its
 * START-DATE (ADR 0101). It is hls.js 1.7.2's `resolveOffsets` and
 * `parseSchedule` (src/controller/interstitials-schedule.ts): "const
 * primaryDuration = details.live ? Infinity : details.edge" and "postroll ?
 * primaryDuration : interstitial.startTime". On a live playlist that is
 * Infinity, a point no playhead reaches, so this answers `null` until the
 * playlist carries its ENDLIST: a post-roll on live only exists once the
 * stream has ended.
 *
 * `details.edge` is hls.js's own "end of the last fragment"; a plain object, as
 * the tests hand over, falls back to the first fragment's start plus the
 * total duration, which is the same number.
 */
export function programEnd(details) {
  if (!details || details.live) return null;
  const edge = Number(details.edge);
  if (Number.isFinite(edge) && edge > 0) return edge;
  const first = Number(details.fragments?.[0]?.start ?? 0);
  const total = Number(details.totalduration);
  return Number.isFinite(total) ? first + total : null;
}

/**
 * Whether a post-roll's asset-list is due (ADR 0101). hls.js asks for it in
 * `onBufferedToEnd` ("Buffered to post-roll": `if (interstitial.cue.post) { ...
 * this.bufferedToItem(item, 0); }`), on BUFFERED_TO_END, which its buffer
 * controller fires when the last fragment of a playlist that has ENDED is
 * appended -- never on a live one. So: when the source is closed (ENDLIST, the
 * `sourceClosed` of `createSignalling`) and the programme is buffered to its
 * end. Reaching the end of the programme counts as buffered to it.
 */
export function postRollDue({ sourceClosed = false, bufferedToEnd = false } = {}) {
  return Boolean(sourceClosed && bufferedToEnd);
}

/**
 * WHAT A POST-ROLL PLAYS, out of its asset-list (ADR 0101): every asset's
 * LINEAR DEFAULT, its own `URI` with its `DURATION`, in order, and nothing
 * else. David Hassoun, 2026-10-22: "it should auto fail to the linear ad if
 * defined as a standard interstitial, or skip if only non-linear is defined".
 *
 * WHY THE NON-LINEAR OPTIONS ARE NOT EVEN LOOKED AT: a non-linear ad is drawn
 * over the programme, and after the end there is no programme to draw over. So
 * a post-roll is the standard interstitial and only that -- what any client
 * already in the market plays from the same list (ADR 0090) -- and an asset
 * that has no standard part is skipped, alone, with the assets after it keeping
 * their place (Appendix D.5), exactly like an asset that has nothing to play
 * in the middle of the programme.
 *
 * Each linear ad is an experience of the contract like any other (full frame,
 * `type: 'linear'`), with its window from `slotStart`, the end of the
 * programme. It is NOT one of the experiences `activeAt` hands over: the
 * programme's clock stops at its end, so the windows past it are played by
 * their own clock (lib/postroll.js), one after the other, each to the end of
 * its asset (ADR 0019).
 *
 * `report`, when given, receives one entry per asset, as `resolveAssetList`
 * writes them: `outcome` is `default` (it carried a layout block, and its
 * linear default is what plays), `linear` (no block) or `skipped`.
 */
export function resolvePostRoll(assetList, { id, slotStart, report = null }) {
  const out = [];
  const assets = Array.isArray(assetList?.ASSETS) ? assetList.ASSETS : [];
  let assetStart = 0;
  for (const [assetIndex, asset] of assets.entries()) {
    const uri = usableUri(asset);
    const declared = Number(asset?.DURATION);
    const block = asset?.[BLOCK];
    const identifiers = blockIdentifiers(block);
    const assetId = `${id}.a${assetIndex}`;
    const entry = { items: [], outcome: null, identifiers, assetId, fallback: null, postroll: true };
    report?.push(entry);
    if (uri && declared > 0) {
      entry.outcome = block == null ? 'linear' : 'default';
      out.push(withOptions(resolveExperience(linearItem(uri, declared, identifiers),
        { id, itemId: `${id}.${out.length}`, slotStart, assetStart }), { assetId }));
    } else {
      entry.outcome = 'skipped';
      console.warn(`[signalling] ${id}: a post-roll (CUE="POST") ASSET has no linear default -- no usable` +
        ' URI with a DURATION -- so THAT asset is skipped: a non-linear ad is never presented after the' +
        ' programme ends (ADR 0101).');
    }
    assetStart += Number.isFinite(declared) ? declared : 0;
  }
  return out;
}

/**
 * The query parameters the configured capabilities travel in, ONE PER AXIS,
 * with the names of SVTA2053 5.3.3, Table 21 (ADR 0086, ADR 0094). They replace
 * `qa-decoder-count`, whose own comment said that the day the capability had a
 * name of the specification, that would be the one to travel.
 *
 *   sgai-video-decoders     an integer above zero: the value of `concurrentVideo`
 *   sgai-image-over-video   1 when `concurrentImage` is true, 0 when it is false
 *
 * THEY DO NOT BEGIN WITH `_HLS_`, which the base reserves for its own query
 * parameters, and which hls.js already puts on the off-the-shelf client's
 * asset-list request (`_HLS_primary_id`).
 *
 * THE THIRD AXIS, `sgai-html-over-video`, IS NOT HERE ON PURPOSE. This library
 * draws `<img>` and `<video>` and nothing else (`media.js`), so there is no
 * value of that axis it could declare about itself and have it be true.
 */
export const VIDEO_DECODERS_PARAM = 'sgai-video-decoders';
export const IMAGE_OVER_VIDEO_PARAM = 'sgai-image-over-video';

/** The two capabilities SVTA2053 5.3.3 requires the configuration to hold. */
const CAPABILITY_KEYS = ['concurrentVideo', 'concurrentImage'];

/**
 * The capabilities as this library is allowed to act on them, or `null` when
 * nothing usable was configured. They are SET BY THE APPLICATION, which knows
 * the device and platform it runs on (SVTA2053 5.3.3, "Device capabilities"),
 * and each one is on its own: one that is absent, or not a value of its kind,
 * is `null` and is neither sent nor filtered on ("a capability that is not
 * configured discards nothing"). Absent is a supported state and is not warned
 * about; a value that is not one of its kind is said out loud, because it would
 * otherwise reach the ad server and the filter as if it were one, and so is a
 * key this library does not read -- `videoDecoders` and `imageOverVideo`, the
 * names before ADR 0094, would otherwise be ignored in silence and the device
 * would be filtered on nothing.
 *
 *   concurrentVideo  a whole number above zero: how many video decoders are
 *                    available to decode and compose video at the same time,
 *                    the one of the primary content included. A device that
 *                    can show one additional video beside the programme sets 2.
 *   concurrentImage  a boolean: whether the device can composite an image over
 *                    video.
 */
export function usableCapabilities(value) {
  if (value == null) return null;
  let concurrentVideo = null;
  let concurrentImage = null;
  for (const key of Object.keys(value)) {
    if (!CAPABILITY_KEYS.includes(key)) {
      console.warn(`[signalling] capabilities.${key} is not a capability this library reads` +
        ` (${CAPABILITY_KEYS.join(', ')}): it is neither sent nor filtered on.`);
    }
  }
  if (value.concurrentVideo != null) {
    const n = Number(value.concurrentVideo);
    if (Number.isInteger(n) && n > 0) concurrentVideo = n;
    else console.warn(`[signalling] capabilities.concurrentVideo is ${JSON.stringify(value.concurrentVideo)},` +
      ' which is not a whole number of decoders above zero: it is neither sent nor filtered on.');
  }
  if (value.concurrentImage != null) {
    if (typeof value.concurrentImage === 'boolean') concurrentImage = value.concurrentImage;
    else console.warn(`[signalling] capabilities.concurrentImage is ${JSON.stringify(value.concurrentImage)},` +
      ' which is not true or false: it is neither sent nor filtered on.');
  }
  return concurrentVideo == null && concurrentImage == null ? null : { concurrentVideo, concurrentImage };
}

/**
 * The methods pre-validation can make the request of a playlist or a file with
 * (ADR 0097). An image is never one of them: it is always loaded by an image,
 * because a `fetch` to another origin has no readable status without CORS.
 */
export const PRE_VALIDATE_METHODS = ['GET', 'HEAD'];

/**
 * The pre-validation as this library is allowed to act on it: `{ enabled,
 * method }`, read once from `preValidateAssets` and `preValidateMethod` (ADR
 * 0097). The defaults are `false` and `'GET'`, and leaving either out is a
 * supported state that is not warned about. A value that is not one of its kind
 * IS warned about and falls to its default, for the same reason a wrong
 * capability is: otherwise `'head'` or `'POST'` would be obeyed or ignored in
 * silence, and the integrator would be validating in a way he did not choose.
 *
 * WHY PRE-VALIDATION IS OFF BY DEFAULT (David Hassoun, 2026-10-20): with a real
 * ad decisioning service behind the assets, an extra request per asset can be
 * time-sensitive and costly -- it may be counted, rate-limited or billed -- so
 * the library makes none unless the integrator asks for them. The renderer's
 * failover, which is always on, is what keeps a dead option off the screen.
 *
 * WHY 'GET' IS THE DEFAULT AND 'HEAD' IS ONLY AN OPTION. GET is the request the
 * player itself makes, so its answer is the one that matters; a server or a CDN
 * can answer HEAD differently -- 405 or 501 when it does not implement it, and
 * 403 when the URL is SIGNED FOR GET, as S3 and CloudFront presigned URLs are:
 * the signature covers the method, so a HEAD on a URL signed for a GET is
 * refused although the asset is there. A 405 or 501 is retried with GET by
 * `firstRequest`; a 403 is not, because it is also what an asset nobody may see
 * answers, so with signed URLs HEAD would discard options that load.
 */
export function usablePreValidation({ preValidateAssets, preValidateMethod } = {}) {
  let enabled = false;
  if (preValidateAssets != null) {
    if (typeof preValidateAssets === 'boolean') enabled = preValidateAssets;
    else console.warn(`[signalling] preValidateAssets is ${JSON.stringify(preValidateAssets)}, which is not` +
      ' true or false: the default, false, is used.');
  }
  let method = 'GET';
  if (preValidateMethod != null) {
    if (PRE_VALIDATE_METHODS.includes(preValidateMethod)) method = preValidateMethod;
    else console.warn(`[signalling] preValidateMethod is ${JSON.stringify(preValidateMethod)}, which is not` +
      ` one of ${PRE_VALIDATE_METHODS.map((m) => `'${m}'`).join(' or ')}: the default, 'GET', is used.`);
  }
  return { enabled, method };
}

/**
 * The URI of a Date Range's asset-list, resolved against the playlist it came
 * in, carrying one parameter per configured capability. Without one the string
 * is what `new URL(...).href` has always produced, character for character.
 * `capabilities` is already the output of `usableCapabilities`; whether they go
 * on the request at all is the caller's choice (`sendCapabilities`, ADR 0094),
 * made by passing `null` here.
 */
export function assetListUrl(uri, base, capabilities = null) {
  const url = new URL(uri, base);
  if (capabilities?.concurrentVideo != null) {
    url.searchParams.set(VIDEO_DECODERS_PARAM, String(capabilities.concurrentVideo));
  }
  if (capabilities?.concurrentImage != null) {
    url.searchParams.set(IMAGE_OVER_VIDEO_PARAM, capabilities.concurrentImage ? '1' : '0');
  }
  return url.href;
}

/**
 * What one layoutOption asks of the device, in the terms of the capabilities:
 * how many video decoders -- ONE FOR THE PRIMARY CONTENT, which keeps playing
 * under every non-linear ad, plus one per element that is not an image -- and
 * whether it draws an image. The discriminant is the renderer's own, `image/*`
 * or not, so the filter and the drawing cannot disagree about what an element
 * is (SVTA2053 5.3.3, "Option selection").
 */
export function needsOf(option) {
  const assets = Array.isArray(option?.layout?.assets) ? option.layout.assets : [];
  const images = assets.filter((a) => /^image\//i.test(a?.type || '')).length;
  return { concurrentVideo: 1 + assets.length - images, concurrentImage: images > 0 };
}

/**
 * Why the configured capabilities cannot fit an option, as ONE SENTENCE
 * somebody can read out loud, or `null` when they can. A capability that was
 * not configured cannot be the reason: it discards nothing.
 */
export function whyNot(option, capabilities) {
  if (!capabilities) return null;
  const needs = needsOf(option);
  const { concurrentVideo, concurrentImage } = capabilities;
  if (concurrentVideo != null && needs.concurrentVideo > concurrentVideo) {
    return `needs ${needs.concurrentVideo} video decoders and concurrentVideo is ${concurrentVideo}`;
  }
  if (concurrentImage === false && needs.concurrentImage) {
    return 'needs an image over the video and concurrentImage is false';
  }
  return null;
}

/**
 * THE INTERMEDIATE STEP OF ADR 0085 (ADR 0095 since `layoutOptions`), the "Option selection" of
 * SVTA2053 5.3.3 written as a function: the `layoutOptions` of an item are
 * walked IN DOCUMENT ORDER, which is the preference of whoever sold the ad, and
 * the first one the configured capabilities fit is the one drawn. The ad
 * presentation server SHOULD have answered only what the device can do;
 * whether it did or not, this is where the Player makes sure, so that a server
 * that ignores the capabilities and one that honours them produce the same
 * screen.
 *
 * An item with no `layoutOptions` is ONE option, itself: the form the Layout
 * Controller emits, with the layout directly in the slot, which the
 * specification lists as accepted by this library (Table 31). Without a
 * configured capability nothing is discarded and the first option wins.
 *
 * THE FIRST OPTION THAT FITS "AND WHOSE ASSETS LOAD" (ADR 0096). With `loads`
 * -- what the first request for each asset answered, see
 * `resolveWithFirstRequests` -- an option that fits but one of whose first
 * requests failed is discarded like one that does not fit, with the request in
 * `failed`, and the walk goes on to the next. An option that fits and has a
 * first request nobody has made yet stops the walk: what to choose is not known
 * until it is made, and those requests come back in `pending`. Without `loads`
 * every option counts as loaded.
 *
 * THE OPTIONS AFTER THE CHOSEN ONE ARE NOT THROWN AWAY (ADR 0097). Every later
 * option that also fits, and whose first request is not known to have failed,
 * comes back in `rest`, in document order: they are what the renderer mounts
 * next when an asset of the chosen one fails to load on screen. They are not
 * requested here -- pre-validation stops at the first option that loads -- so
 * `rest` is a list of candidates and not of options known to load.
 *
 * Returns `{ option, index, discarded, pending, rest }`: the chosen option
 * merged over the item -- so `start`, `duration` and `identifiers` stay the
 * item's -- and its index, or `null` and `-1` when none is left or one is
 * pending; every option discarded, with its index and the sentence that says
 * why; the first requests still to make, `{ uri, mediaType }`; and the later
 * options that fit, `{ index, option }`, merged the same way.
 */
export function selectOption(item, capabilities = null, loads = null) {
  const hasOptions = Array.isArray(item?.layoutOptions);
  const options = hasOptions ? item.layoutOptions : [item];
  const { layoutOptions: _all, ...envelope } = item ?? {};
  const merged = (index) => (hasOptions ? { ...envelope, ...options[index] } : item);
  const failedOn = (option) => (loads
    ? firstRequestsOf(option).find(({ uri }) => loads.get(uri)?.ok === false) ?? null
    : null);
  const discarded = [];
  for (let index = 0; index < options.length; index += 1) {
    const reason = whyNot(options[index], capabilities);
    if (reason) { discarded.push({ index, reason }); continue; }
    const failed = failedOn(options[index]);
    if (failed) {
      discarded.push({
        index,
        reason: `failed on the first request for ${failed.uri} (${loads.get(failed.uri).error})`,
        failed: failed.uri
      });
      continue;
    }
    if (loads) {
      const pending = firstRequestsOf(options[index]).filter(({ uri }) => !loads.has(uri));
      if (pending.length) return { option: null, index: -1, discarded, pending, rest: [] };
    }
    const rest = [];
    for (let later = index + 1; later < options.length; later += 1) {
      if (whyNot(options[later], capabilities) || failedOn(options[later])) continue;
      rest.push({ index: later, option: merged(later) });
    }
    return { option: merged(index), index, discarded, pending: [], rest };
  }
  return { option: null, index: -1, discarded, pending: [], rest: [] };
}

/**
 * The first requests presenting an option takes: one per element of its layout
 * with a `uri`, the playlist for a media element and the image for an image,
 * each `uri` once. An element with an empty `uri` asks for nothing and is not a
 * failure -- the SVTA tool emits `"uri": ""` in all six of its payloads, and
 * SVTA2053 6.6.4 says an empty uri is not by itself a reason to fall back. The
 * primary content is not an asset of the option and is never asked for here.
 */
export function firstRequestsOf(option) {
  const seen = new Map();
  for (const element of Array.isArray(option?.layout?.assets) ? option.layout.assets : []) {
    const uri = typeof element?.uri === 'string' ? element.uri.trim() : '';
    if (uri && !seen.has(uri)) seen.set(uri, { uri, mediaType: element.type ?? null });
  }
  return [...seen.values()];
}

/**
 * The block of an asset with every item narrowed to its chosen option, or with
 * `payload: null` when some item has no option left -- THE UNIT OF THE FALLBACK
 * IS THE ASSET (see `usablePayload`), so one item that cannot be drawn takes
 * the whole asset to its default. That keeps the fallback decision where it
 * was: `usablePayload` still reads a block and nothing else, and what it reads
 * is the block this device can draw.
 *
 * `report`, when given, receives one entry per item: what was offered, what
 * was discarded and why, and what was chosen. It is how a page shows the step
 * instead of asserting it. `loads` and `pending` are those of `selectOption`:
 * an item still waiting on a first request leaves the block undrawable for
 * now, and its requests are added to `pending`.
 *
 * Each item's entry also says, in `order`, which options are handed to the
 * renderer and in what order: the chosen one first, then the later ones that
 * fit (ADR 0097). The same list travels in `ranked`, aligned with `payload`:
 * per item, `{ index, option }` for each of them, or `null` for an offer.
 */
export function narrowBlock(block, capabilities = null, report = null, loads = null, pending = null) {
  if (block == null || !Array.isArray(block.payload)) return block;
  const payload = [];
  const ranked = [];
  const waitingOn = [];
  let drawable = true;
  let hopeless = false;
  for (const item of block.payload) {
    if (!item || typeof item !== 'object' || isOffer(item)) { payload.push(item); ranked.push(null); continue; }
    const { option, index, discarded, pending: waiting, rest } = selectOption(item, capabilities, loads);
    waitingOn.push(...waiting);
    if (!option && !waiting.length) hopeless = true;
    const order = option ? [{ index, option }, ...rest] : [];
    report?.push({
      offered: (Array.isArray(item.layoutOptions) ? item.layoutOptions : [item]).map(describeOption),
      discarded,
      chosen: option ? index : null,
      order: order.map((o) => o.index)
    });
    if (option) { payload.push(option); ranked.push(order); }
    else drawable = false;
  }
  // An item with no option left takes the whole asset to its default whatever
  // the others load, so their first requests would be asked for nothing.
  if (!hopeless) pending?.push(...waitingOn);
  return { ...block, payload: drawable ? payload : null, ranked: drawable ? ranked : null };
}

/** An option as a page lists it: its layout and the media type of each element. */
function describeOption(option) {
  const assets = Array.isArray(option?.layout?.assets) ? option.layout.assets : [];
  return { type: option?.type ?? null, media: assets.map((a) => a?.type ?? null), needs: needsOf(option) };
}

/**
 * WHEN A BREAK'S ASSET-LIST IS REQUESTED (ADR 0098, ADR 0099): the rule of hls.js
 * for the X-ASSET-LIST of an interstitial, read in the 1.7.2 this repository
 * vendors (`interstitials-controller`), and the only timing this library has.
 * Two places ask for it there, and both end in `preloadAssets` ->
 * `assetListLoader.loadAssetList`:
 *
 *   `updateBufferedPos(bufferEnd)`, on every buffer append: when the item at
 *   the forward buffer end of the primary is past the one being buffered,
 *   `bufferedToItem(next)` -> `bufferedToEvent` -> `preloadAssets(event)`, which
 *   loads the list "if (assetList.length === 0 && !assetListLoader)". That is:
 *   the list is asked for WHEN THE PROGRAMME IS BUFFERED UP TO THE START OF THE
 *   BREAK, and the lead is the forward buffer. (Live adds a look-ahead from the
 *   playlist edge, `interstitialLiveLookAhead`; every primary here is a VOD.)
 *
 *   `advanceSchedule`, when playback -- or a seek -- lands on the item:
 *   `preloadAssets(event, assetIndex)`, the same load. A seek into a break asks
 *   for its list right there, and the break waits for it.
 *
 *   `checkStart`, once the media is attached and loading is enabled, when the
 *   first event of the schedule is a PRE-ROLL (`CUE="PRE"`):
 *   `setSchedulePosition(<the preroll>)` -> `preloadAssets`. A preroll's list is
 *   asked for AT LOAD, paused or not and with nothing buffered (ADR 0100).
 *
 * There is no option to ask for every list up front (ADR 0099): a page that
 * wants the breaks on its timeline before their lists arrive reads the Date
 * Ranges hls.js already parsed, as hls.js leaves them to any page.
 */
/**
 * THE RULE OF ADR 0098 AS A PURE FUNCTION: whether a break's asset-list is due,
 * given where the programme is playing (`time`) and where its forward buffer
 * ends (`bufferedEnd`, see `bufferedEndAt`). Due when the break has not ended
 * and the programme is buffered up to its start -- which includes being played
 * or sought into it, because the buffer end is never behind the playhead.
 *
 * A break that already ended is not due: a seek past it does not ask for it,
 * and a seek back into it does, which is what hls.js does too. A break whose tag
 * declares no length has no end to be past, so it is due whenever the buffer
 * reaches its start.
 *
 * A PRE-ROLL (`pre`, `CUE="PRE"`, ADR 0100) is due at once, whatever the clocks
 * say: hls.js asks for a preroll's list in `checkStart`, as soon as there is a
 * media element and loading has started, and not when the buffer reaches it.
 * The caller only asks while there is a media element, which is the other half
 * of that condition.
 *
 * ONE DIFFERENCE WITH hls.js, SAID OUT LOUD. hls.js walks its schedule one item
 * at a time, so it asks for the next break only; this asks for every break the
 * buffer already reaches. They differ only when two breaks fit inside one
 * forward buffer (30 s by default), which no programme here has.
 */
export function assetListDue({ startTime, duration, pre = false }, { time, bufferedEnd }) {
  if (pre) return true;
  if (!Number.isFinite(time) || !Number.isFinite(startTime)) return false;
  const length = Number(duration);
  const end = duration != null && Number.isFinite(length) && length > 0 ? startTime + length : Infinity;
  if (time >= end) return false;
  return startTime <= Math.max(time, Number.isFinite(bufferedEnd) ? bufferedEnd : time);
}

/**
 * The hole, in seconds, that `bufferedEndAt` steps over: 0.1 s, hls.js's own
 * default `maxBufferHole` (src/config.ts: "maxBufferHole: 0.1, // used by
 * stream-controller and gap-controller"), and the value it hands
 * `BufferHelper.bufferInfo(media, pos, maxHoleDuration)` when it measures the
 * forward buffer it loads against (`getFwdBufferInfo`, while playing).
 *
 * WHY THERE IS A TOLERANCE AT ALL (ADR 0099, 2026-10-22 note). The first
 * buffered range of a packaged programme does not start at 0: here it starts at
 * 0.067 s, the first presentation timestamp of the first segment. With no
 * tolerance a page paused at 0 has a forward buffer that ends at the playhead,
 * so the first break's list is not asked for until play, even with the buffer
 * already past the break. hls.js has THE SAME BEHAVIOUR, and it is said here so
 * nobody reads this as copying it: its interstitials controller measures with
 * `bufferInfo(primaryMedia, timelinePos, 0)` (`checkBuffer`), and nothing moves
 * a paused playhead off 0 -- `seekToStartPos` only adjusts the start "if
 * (startPosition >= 0 && currentTime < startPosition)", which is false at 0
 * against 0 on a VOD, and the gap controller returns early on a paused element.
 * The tolerance is the one place this layer is LESS strict than hls.js, and the
 * smallest number hls.js itself uses to call a hole irrelevant.
 */
export const BUFFER_HOLE_TOLERANCE = 0.1;

/**
 * Where the forward buffer ends: the end of the buffered range that contains
 * `time`, or `time` itself when none does. A hole smaller than `tolerance` is
 * stepped over, as `BufferHelper.bufferInfo(media, pos, maxHoleDuration)` does
 * in hls.js 1.7.2: ranges closer than that are merged ("if small hole (value
 * between 0 or maxHoleDuration) or overlapping"), and a range that starts less
 * than that ahead of the playhead counts as containing it ("pos +
 * maxHoleDuration >= start"). A bigger hole is not jumped. `ranges` is a list
 * of `[start, end]`, which `rangesOf` makes out of a media element's
 * `buffered`.
 */
export function bufferedEndAt(ranges, time, tolerance = BUFFER_HOLE_TOLERANCE) {
  const merged = [];
  for (const [start, end] of [...(ranges || [])].sort((a, b) => a[0] - b[0])) {
    const last = merged[merged.length - 1];
    if (last && start - last[1] < tolerance) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  for (const [start, end] of merged) {
    if (time + tolerance >= start && time <= end) return end;
  }
  return time;
}

/** A media element's `buffered`, as the list of `[start, end]` `bufferedEndAt` reads. */
function rangesOf(buffered) {
  const out = [];
  for (let i = 0; i < (buffered?.length ?? 0); i += 1) out.push([buffered.start(i), buffered.end(i)]);
  return out;
}

/**
 * The range a break occupies BEFORE its list is read (ADR 0098): off its tag,
 * DURATION or PLANNED-DURATION, as the replacement kind is always placed, and
 * marked `provisional`. It is replaced by the range of what the list resolves
 * into, or removed when it resolves into nothing. `null` when the tag declares
 * no length: it cannot be placed on a bar until the list says how long it is.
 */
export function provisionalRange(id, dateRange, startTime, kind) {
  const declared = dateRange?.duration ?? dateRange?.plannedDuration;
  const duration = Number(declared);
  if (declared == null || !Number.isFinite(duration)) return null;
  return { id, kind, startTime, duration, provisional: true };
}

/**
 * The one impure function, and the only place hls.js is touched: subscribe to
 * LEVEL_UPDATED, keep the Date Ranges of our class, ask for their X-ASSET-LIST
 * (the APPLICATION asks -- hls.js runs with its interstitials controller off,
 * so it never will, which T-02 verified in flight), and resolve the layout.
 *
 * `capabilities` is read ONCE, here, and not on every request: what it can be
 * wrong about is what the integrator wrote, and that is one statement and not
 * one per break. Five identical warnings for one mistake is how a console stops
 * being read.
 *
 * `sendCapabilities` says whether they also travel on the asset-list request.
 * Configuring them and sending them are two things since ADR 0094: the filter
 * always uses what was configured, and the request carries it only when this is
 * true, because sending is OPTIONAL and capability values add to what can
 * fingerprint a device (SVTA2053 5.3.3, "Capability parameters").
 *
 * `onResolved(experiences, selection)` gets, as its second argument, what the
 * intermediate step of ADR 0085 did with this break: the URL that was asked
 * for, and per asset what was offered, what was discarded and why, and how the
 * asset ended (see `resolveAssetList`). It is called for a break that resolved
 * to nothing too, because a skipped break is exactly what a page has to be able
 * to show. `requests` in it lists every first request made for the break,
 * `{ uri, ok, error }`, and is empty without `firstRequest`.
 *
 * `firstRequest(uri, mediaType, { method })`, when given, is how the first
 * request for an asset is made by PRE-VALIDATION, before the list is handed
 * over (ADR 0096, ADR 0097, SVTA2053 5.3.3 "Asset load failure"): an option one
 * of whose first requests fails is left out of the options handed to the
 * renderer, and a default linear ad whose first request fails is skipped. The
 * entry point passes the one in media.js. Without it nothing is requested here.
 *
 * `preValidateAssets` (default `false`) says whether pre-validation runs at all,
 * and `preValidateMethod` (`'GET'` or `'HEAD'`, default `'GET'`) which method
 * the request of a playlist or a file is made with; both are read once, here,
 * by `usablePreValidation`. With pre-validation off nothing is requested at
 * resolution time and the renderer's failover is the only check, which it is
 * anyway: pre-validation only discards options before the renderer sees them.
 * `onResolved` gets what was used in `preValidation`, `{ enabled, method }`.
 *
 * Each break's asset-list is requested WHEN hls.js WOULD ASK FOR IT (ADR 0098):
 * when the programme is buffered up to the break, or played or sought into it;
 * a preroll's (`CUE="PRE"`), at load, and it is placed where playback begins,
 * which on a live playlist is the live join point; a preroll first seen after
 * playback joined is not presented (ADR 0100).
 * Until then the range of the break is on the list already, `provisional`, off
 * its tag, and `experiences` grows as lists arrive. There is no option for it
 * (ADR 0099).
 */
export function createSignalling(hls, {
  onResolved, capabilities = null, sendCapabilities = true, firstRequest = null,
  preValidateAssets = false, preValidateMethod = 'GET'
} = {}) {
  const experiences = [];
  const ranges = [];
  const done = new Set();
  const declared = usableCapabilities(capabilities);
  const preValidation = usablePreValidation({ preValidateAssets, preValidateMethod });
  const request = firstRequest && preValidation.enabled
    ? (uri, mediaType) => firstRequest(uri, mediaType, { method: preValidation.method })
    : null;
  // The two things `settled` is made of, and neither is about the programme:
  // whether the SOURCE can still hand over ranges, and how many asset-lists are
  // in flight. A list is complete when nothing more can arrive and nothing is
  // half resolved. A break whose list is not due yet is NOT in flight: its range
  // is already in the list, provisional, off its tag (ADR 0098).
  let sourceClosed = false;
  let pending = 0;
  /**
   * id -> a break whose asset-list is not due yet: `{ id, url, slotStart, kind,
   * pre, dateRange, range }`. A live preroll whose join point is not known yet
   * waits here with `slotStart` null and no range (`preRollPlacement`).
   */
  const waiting = new Map();
  /** id -> a preroll of a kind not resolved here, waiting for the live join point to be placed. */
  const unplaced = new Map();
  /** Whether playback has joined: a preroll first seen after that is not presented (ADR 0100). */
  let joined = false;
  /**
   * id -> a POST-ROLL (`CUE="POST"`, ADR 0101): `{ id, kind, dateRange, url,
   * state, startTime, experiences }`. `url` is null for the kind only reported
   * here. `state` is `waiting`, `requested`, `resolved` or `failed`;
   * `startTime` is the end of the programme, null while it has none (live).
   * Its experiences are NOT in `experiences`: they play after the programme,
   * by their own clock (lib/postroll.js).
   */
  const postRolls = new Map();
  /** Whether the programme is buffered to its end: BUFFERED_TO_END, or the media ended. */
  let bufferedToEnd = false;

  /** Where a preroll goes given the playlist just read: hls.js's reading, live included (ADR 0100). */
  function placePreRoll(details, alreadyJoined = joined) {
    return preRollPlacement({
      startPosition: hls.startPosition, live: details.live === true,
      liveSyncPosition: hls.liveSyncPosition, targetDuration: details.targetduration, joined: alreadyJoined
    });
  }

  /** Place the live prerolls that were waiting for the join point, now that there may be one. */
  function placeWaiting(details) {
    for (const brk of waiting.values()) {
      if (brk.slotStart != null) continue;
      const { start } = placePreRoll(details, false);
      if (start == null) continue;
      brk.slotStart = start;
      brk.range = provisionalRange(brk.id, brk.dateRange, start, brk.kind);
      if (brk.range) ranges.push(brk.range);
      console.log(`[signalling] ${brk.id}: the live join point is known, the preroll is placed at t=${start.toFixed(2)}s.`);
    }
    for (const [id, { dateRange }] of unplaced) {
      const { start } = placePreRoll(details, false);
      if (start == null) continue;
      unplaced.delete(id);
      const range = rangeOfDateRange(id, dateRange, start);
      if (range) ranges.push(range);
    }
  }

  hls.on(Hls.Events.LEVEL_UPDATED, (_event, data) => read(data.details));

  // THE TWO CLOCKS THE RULE OF ADR 0098 READS, which are the two hls.js reads:
  // how far the programme is buffered, and where it is playing. Every event
  // that can move either one asks again; asking is a loop over the breaks still
  // waiting, which is a handful, so it is not throttled.
  let watched = null;
  const watch = (media) => {
    if (!media || media === watched) return;
    watched = media;
    for (const type of ['timeupdate', 'seeking', 'progress']) media.addEventListener(type, due);
    media.addEventListener('ended', reachedEnd);
    due();
  };
  hls.on(Hls.Events.MEDIA_ATTACHED, (_event, data) => watch(data?.media));
  hls.on(Hls.Events.BUFFER_APPENDED, () => due());
  // The moment hls.js asks for a post-roll's list (ADR 0101): its buffer
  // controller fires this when the last fragment of an ended playlist is in.
  const reachedEnd = () => { bufferedToEnd = true; duePost(); };
  if (Hls.Events.BUFFERED_TO_END) hls.on(Hls.Events.BUFFERED_TO_END, reachedEnd);
  watch(hls.media);

  /** Request every waiting asset-list the rule says is due now. */
  function due() {
    const media = hls.media;
    if (!media || !waiting.size) return;
    const time = media.currentTime;
    const bufferedEnd = bufferedEndAt(rangesOf(media.buffered), time);
    for (const [id, brk] of waiting) {
      // A live preroll not placed yet has no window to draw into: it waits for
      // the join point, which the next playlist update brings (ADR 0100).
      if (brk.slotStart == null) continue;
      const span = brk.range ?? { startTime: brk.slotStart, duration: null };
      if (!assetListDue({ ...span, pre: brk.pre }, { time, bufferedEnd })) continue;
      waiting.delete(id);
      // Counted BEFORE the first await of `resolveBreak`: counted after it,
      // `pending` could touch zero between two lists due on the same tick and
      // `settled` would say "complete" over half a list.
      pending += 1;
      resolveBreak(brk);
    }
  }

  function read(details) {
    const anchor = (details.fragments || []).find((f) => f.programDateTime != null);
    if (!anchor) return;
    // A playlist without an ENDLIST can still grow, and while it can grow no
    // list of ranges is the final one. This is the whole limit of the promise:
    // it is a property of the source and not of this layer. In this POC it is
    // closed on the first update because the primary is a VOD with the Date
    // Ranges written in the media playlist (ADR 0005).
    if (details.live === false) sourceClosed = true;
    placeWaiting(details);

    // Everything that can be decided without going to the network is decided
    // here, synchronously: the kind, the slot, the URL and the provisional range.
    const toResolve = [];
    for (const [id, dateRange] of Object.entries(details.dateRanges || {})) {
      const kind = kindOfClass(dateRange.class);
      if (!kind || done.has(id)) continue;
      done.add(id);
      // A preroll sits where playback begins and not at its START-DATE, as in
      // hls.js (ADR 0100): on a live playlist, the live join point, and one
      // first seen after playback joined is not presented (`preRollPlacement`).
      // Every other break, at its START-DATE.
      const { pre, post } = cueOf(dateRange);
      // A post-roll goes at the end of the programme, and only its linear
      // default plays there (ADR 0101): it is set aside here and placed below.
      if (post) {
        postRolls.set(id, {
          id, kind, dateRange, state: 'waiting', startTime: null, experiences: [],
          url: KINDS_RESOLVED.has(kind)
            ? assetListUrl(dateRange.attr['X-ASSET-LIST'], details.url || location.href, sendCapabilities ? declared : null)
            : null
        });
        continue;
      }
      let slotStart;
      if (pre) {
        const placement = placePreRoll(details);
        if (placement.late) {
          console.log(`[signalling] ${id} is a preroll (CUE="PRE") first seen after playback joined:` +
            ' it is not presented, as hls.js does not step back into one (ADR 0100).');
          continue;
        }
        slotStart = placement.wait ? null : placement.start;
      } else slotStart = mediaTimeOf(dateRange.startDate, anchor);
      if (!KINDS_RESOLVED.has(kind)) {
        if (slotStart == null) { unplaced.set(id, { id, dateRange, kind }); continue; }
        const range = rangeOfDateRange(id, dateRange, slotStart);
        if (range) ranges.push(range);
        continue;
      }
      const url = assetListUrl(dateRange.attr['X-ASSET-LIST'], details.url || location.href,
        sendCapabilities ? declared : null);
      toResolve.push({
        id, url, slotStart, kind, pre, dateRange,
        range: slotStart == null ? null : provisionalRange(id, dateRange, slotStart, kind)
      });
    }
    // Whether playback has joined, which is what makes a preroll seen from now
    // on a late one: the first update read with a media element there, as
    // hls.js's `checkStart` runs once there is media and loading has started.
    if (hls.media) joined = true;
    placePostRolls(details);

    // ON DEMAND (ADR 0098): the break is known and its list is not asked for
    // yet. Its range goes on the list now, provisional, off the tag -- so the
    // bar marks every break from the start, as it always did -- and the list
    // is asked for when the rule of hls.js says so.
    for (const brk of toResolve) {
      if (brk.range) ranges.push(brk.range);
      waiting.set(brk.id, brk);
      if (brk.slotStart == null) {
        console.log(`[signalling] ${brk.id} is a preroll (CUE="PRE") on a live playlist whose join point` +
          ' is not known yet: it is placed, and its asset-list requested, on the next update (ADR 0100).');
        continue;
      }
      console.log(brk.pre
        ? `[signalling] ${brk.id} is a preroll (CUE="PRE") at t=${brk.slotStart.toFixed(2)}s: its asset-list` +
          ' is requested at load, as hls.js does (ADR 0100).'
        : `[signalling] ${brk.id} at t=${brk.slotStart.toFixed(2)}s: its asset-list is requested` +
          ' when the programme is buffered up to it, or played or sought into it (ADR 0098).');
    }
    due();
    duePost();
  }

  /**
   * Give every post-roll the end of the programme, once there is one (ADR
   * 0101): at once on a VOD, and on live only when the playlist ends. The kind
   * only reported here gets its range there, marked `postroll`: it occupies no
   * time of the programme, so a bar draws nothing for it.
   */
  function placePostRolls(details) {
    const end = programEnd(details);
    if (end == null) return;
    for (const entry of postRolls.values()) {
      if (entry.startTime != null) continue;
      entry.startTime = end;
      if (entry.url) {
        console.log(`[signalling] ${entry.id} is a post-roll (CUE="POST") at the end of the programme,` +
          ` t=${end.toFixed(2)}s: its asset-list is requested when the programme is buffered to its end,` +
          ' and only its linear default plays, after the programme (ADR 0101).');
        continue;
      }
      const range = rangeOfDateRange(entry.id, entry.dateRange, end);
      if (range) ranges.push({ ...range, postroll: true });
    }
  }

  /** Request every post-roll's asset-list the rule says is due now (ADR 0101). */
  function duePost() {
    if (!postRollDue({ sourceClosed, bufferedToEnd })) return;
    for (const entry of postRolls.values()) {
      if (entry.state !== 'waiting' || !entry.url || entry.startTime == null) continue;
      entry.state = 'requested';
      pending += 1;
      resolvePost(entry);
    }
  }

  /** Ask for one post-roll's asset-list and keep its linear defaults. `pending` is already counting it. */
  async function resolvePost(entry) {
    const { id, url } = entry;
    console.log(`[signalling] ${id}: post-roll asset-list ${url}`);
    try {
      const assetList = await fetch(url).then((r) => r.json());
      const report = [];
      entry.experiences = resolvePostRoll(assetList, { id, slotStart: entry.startTime, report });
      entry.state = 'resolved';
      onResolved?.(entry.experiences.slice(), {
        id, url, postroll: true, capabilities: declared, sent: Boolean(sendCapabilities && declared),
        assets: report, requests: [], preValidation: { enabled: false, method: null }
      });
    } catch (error) {
      entry.state = 'failed';
      console.error(`[signalling] ${id}: the post-roll's asset-list could not be read, so it is cancelled` +
        ' (Appendix D.5): nothing plays after the programme.', url, error);
    } finally {
      pending -= 1;
    }
  }

  /** Ask for one break's asset-list, resolve it, and put it on the lists. `pending` is already counting it. */
  async function resolveBreak({ id, url, slotStart, kind, range: provisional }) {
    console.log(`[signalling] ${id} at t=${slotStart.toFixed(2)}s, asset-list ${url}`);
    // The provisional range leaves the list whatever happens below: what
    // replaces it is the range of what the list resolved into, or nothing.
    const drop = () => {
      const at = ranges.indexOf(provisional);
      if (at >= 0) ranges.splice(at, 1);
    };
    try {
      const assetList = await fetch(url).then((r) => r.json());
      const report = [];
      const requests = [];
      // The first requests go out HERE, between the list arriving and the
      // break being handed over, so `pending` keeps counting this break until
      // they are answered and `settled` cannot say "complete" before
      // pre-validation has been decided (ADR 0096, ADR 0097). They are those of
      // THIS break only: the moment its list arrives, and not the moment the
      // playlist does (ADR 0098).
      const resolved = request
        ? await resolveWithFirstRequests(assetList, {
          id, slotStart, capabilities: declared, report, firstRequest: request, requests
        })
        : resolveAssetList(assetList, { id, slotStart, capabilities: declared, report });
      experiences.push(...resolved);
      drop();
      const range = rangeOfExperiences(id, resolved, kind);
      if (range) ranges.push(range);
      onResolved?.(resolved, {
        id, url, capabilities: declared, sent: Boolean(sendCapabilities && declared), assets: report, requests,
        preValidation: { enabled: Boolean(request), method: request ? preValidation.method : null }
      });
    } catch (error) {
      drop();
      // The SECOND rung of Appendix D.5: when the LIST itself cannot be had,
      // what is cancelled is the whole interstitial, with offset 0. Under
      // this render offset 0 is what already happened -- the primary was
      // never interrupted -- so cancelling is exactly this: no experience, no
      // range on the bar, and the programme carrying on. The error is the
      // report; the break leaves no other trace, which is why it is an error
      // and not a warning.
      console.error(`[signalling] ${id}: the asset-list could not be read, so the whole break is` +
        ' cancelled with offset 0 (Appendix D.5): nothing is played, no range is reported, and' +
        ' the programme is not interrupted.', url, error);
    } finally {
      pending -= 1;
    }
  }

  return {
    activeAt: (time) => activeAt(experiences, time),
    // Where all the ranges of the programme are, which is a different question
    // from what is active now. A fresh array on every call, sorted, so the
    // caller cannot reorder the layer's own state. A range is replaced once:
    // a provisional one, off the tag, by the one its list resolved into.
    programRanges: () => ({
      ranges: [...ranges].sort((a, b) => a.startTime - b.startTime),
      settled: sourceClosed && pending === 0
    }),
    // The post-rolls of the programme (ADR 0101), in the order of their tags:
    // what plays after it ends. A fresh copy on every call. Each one is `{ id,
    // kind, state, startTime, experiences }`, and its experiences are linear
    // ads only; `activeAt` never hands them over.
    postRolls: () => [...postRolls.values()]
      .filter((entry) => entry.url)
      .map(({ id, kind, state, startTime, experiences }) => ({ id, kind, state, startTime, experiences: experiences.slice() })),
    experiences
  };
}
