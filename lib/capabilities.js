// capabilities.js -- what the device can draw, and which option of an ad gets
// drawn (SVTA2053 5.3.3, "Device capabilities" and "Asset load failure").
//
// The application declares what the device can do. An item of the payload may
// offer several layouts in order of preference (`layoutOptions`), and the one
// drawn is the first the device can draw whose first requests did not fail.
// Nothing here reads how the payload arrived, and nothing here sends the
// capabilities anywhere: putting them on a request is the side of the streaming
// format (ADR 0116, ADR 0117).

import { isOffer } from './experience.js';

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
 * names before ADR 0104, would otherwise be ignored in silence and the device
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
 * (ADR 0107). An image is never one of them: it is always loaded by an image,
 * because a `fetch` to another origin has no readable status without CORS.
 */
export const PRE_VALIDATE_METHODS = ['GET', 'HEAD'];

/**
 * The pre-validation as this library is allowed to act on it: `{ enabled,
 * method }`, read once from `preValidateAssets` and `preValidateMethod` (ADR
 * 0107). The defaults are `false` and `'GET'`, and leaving either out is a
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
 * THE INTERMEDIATE STEP OF ADR 0085 (ADR 0105 since `layoutOptions`), the "Option selection" of
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
 * THE FIRST OPTION THAT FITS "AND WHOSE ASSETS LOAD" (ADR 0106). With `loads`
 * -- what the first request for each asset answered, which the side of the
 * format makes -- an option that fits but one of whose first
 * requests failed is discarded like one that does not fit, with the request in
 * `failed`, and the walk goes on to the next. An option that fits and has a
 * first request nobody has made yet stops the walk: what to choose is not known
 * until it is made, and those requests come back in `pending`. Without `loads`
 * every option counts as loaded.
 *
 * THE OPTIONS AFTER THE CHOSEN ONE ARE NOT THROWN AWAY (ADR 0107). Every later
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
 * fit (ADR 0107). The same list travels in `ranked`, aligned with `payload`:
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
