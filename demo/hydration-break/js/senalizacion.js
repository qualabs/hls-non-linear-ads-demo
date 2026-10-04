// senalizacion.js -- "The signalling, as it is served": the Date Range of the
// playlist this player is playing, glossed attribute by attribute; what the block
// it points at carries, field by field; and the asset-list itself, one fold per Ad
// with its raw JSON inside.
//
// IT IS READ OFF WHAT THIS PLAYER IS PLAYING AND NOT TYPED INTO THE PAGE, which
// is the one thing this section cannot stop being. It is the rule of the whole
// page applied to the scroll: this page does not get to claim something it has
// not read. A tag pasted into the HTML would be an illustration, and an
// illustration of a playlist is worth nothing to an audience that reads
// playlists for a living -- besides which the START-DATE moves every time the
// content is packaged, so a pasted one would be wrong by tomorrow. The playlist
// is fetched over the network here and the asset-list is fetched from the URL
// the tag itself carries.
//
// WHAT CHANGED IS THAT THE REDUCTION STOPPED BEING A LOSS (ADR 0075). This
// section used to print a summary of each Ad -- URI, DURATION, type and the list
// of boxes -- and the hundred lines of the file were nowhere on the page. Now
// that summary is the LABEL of a fold and the raw JSON of that Ad is inside it,
// verbatim, so nothing is hidden and what is on screen when the folds are closed
// is still four lines.
//
// AND THE ONE ON SCREEN IS MARKED, BUT IT IS NOT OPENED. Opening the fold by
// itself feels clever and fights whoever is reading: somebody who opened Ad 3 to
// read it would get Ad 4 opened on top of them eight seconds later. So the mark
// is the whole of the live behaviour, and it is the contract's rule 6 -- the
// `itemId` of what `activeAt` answers, compared against the identity of each
// fold, which is the same comparison `paint()` makes on every `timeupdate`.
//
// THE LABEL OF A FOLD IS READ OFF THE ASSET IT CONTAINS AND NOT OFF THE
// CONTRACT, and that is deliberate in a section whose subject IS the asset-list:
// label and content then come out of one source and cannot drift apart. It also
// makes the label a pure function of the file, which is what lets
// `test/comprobaciones.js` check that every fold names an Ad the asset-list
// really declares, and `test/mutaciones.mjs` plant a hand-written label and see
// that check go red.
//
// The one thing that does come from the contract is the identity: a raw asset
// carries no `itemId`, so the folds are paired with the Ads of the break IN
// ORDER -- Appendix D.2, which is the order the list declares and the order they
// play. The pairing is only made when the two counts agree; when they do not,
// nothing is marked and the console says why, because a mark on the wrong fold
// is worse than no mark.
//
// AND THE GLOSS OF THE BLOCK IS THE GLOSS OF THE TAG ONE LEVEL DOWN, drawn the same
// way and for the same reason: a row appears for a field only when the list in
// front of the reader really carries it, so the explanation cannot describe a
// signalling this page is not showing. What each field MEANS is prose, and every
// sentence of it is answerable against `lib/signalling.js` -- which field is
// refused, which one is assumed, and what the assumption is. A field the list
// carries and this page has no sentence for says so on the page instead of being
// dropped, which is the same choice `NO_GLOSS` makes for an attribute.

import { adsOfTheMinute } from './tipos.js';

/** The extension of ADR 0019, by the name it has in the list. */
const BLOCK = 'X-AD-CREATIVE-SIGNALING';

/** What each attribute of the Date Range means, for the attributes this one carries. */
const GLOSS = {
  'ID': 'Names the break. Every Ad resolved out of it reports this same id, which is ' +
    'what tells one break from another.',
  'CLASS': 'The one attribute that decides who plays this tag. In HLS the class of a ' +
    'Date Range is compared as an exact string and there is no inheritance, so a client ' +
    'that has never heard of this one ignores the tag whole. That is what lets the two ' +
    'classes be served on the same playlist.',
  'START-DATE': "Where the break sits on the programme's own clock. It is resolved " +
    "against the playlist's EXT-X-PROGRAM-DATE-TIME, which is why this tag is written on " +
    'every start instead of being a file in git.',
  'X-ASSET-LIST': 'The URL of what the break plays. The library fetches it and resolves ' +
    'it into the Ads below; the JSON inside each fold is what came back.',
  'X-RESUME-OFFSET': 'Means nothing in a Date Range of this class: nothing was ' +
    'interrupted, so there is nothing to resume. It is written because the tag this one ' +
    'was modelled on is an interstitial, no client in this demo reads it, and which ' +
    'attributes of an interstitial keep their meaning in the sibling class is an open ' +
    'question for the SVTA.',
  'X-SNAP': "An interstitial's: where the player is asked to snap the join to a segment " +
    'boundary. No client in this demo reads it either, and a concurrent break has no join ' +
    'to snap, because the programme is never cut.',
  'X-RESTRICT': "An interstitial's too: what the viewer must not be allowed to do while " +
    'the break runs. No client in this demo reads it.',
  'PLANNED-DURATION': 'How long the break declares it will be, which is the sum of the ' +
    'DURATION of every asset in the list. For this class the window comes from the assets ' +
    'that actually resolved, so this number is read and not obeyed.',
  'DURATION': 'The length the tag declares for the range itself.'
};

/** Said out loud rather than skipped: a silent omission would read as "nothing to say". */
const NO_GLOSS = 'This page has no gloss for this attribute.';

/** What a fold says instead of a layout name when its asset declares no block. */
const NO_BLOCK = 'no layout block, played full frame';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

/**
 * The five depths of the signalling, outermost first. They are the levels the page
 * groups the fields by, and they exist because the same NAME means three different
 * things at three depths: `type` is the tool's own kind of block, the name of a
 * layout, and the media type of a box. `test/comprobaciones.js` walks the list with
 * the same five names, which is what lets it check this gloss against the file.
 */
export const LEVELS = ['asset', 'block', 'item', 'layout', 'element'];

/** What the reader is looking at, at each depth. */
const LEVEL_SAYS = {
  asset: 'On an ASSET of the list',
  block: `In ${BLOCK}`,
  item: 'In an item of payload, which is one Ad',
  layout: 'In layout',
  element: 'In a box: primaryContent, and each entry of assets'
};

/**
 * What each field of the block is for, and what happens when it is not there.
 *
 * THE THIRD MARK IS THE ONE WORTH HAVING. `required` and `optional` are what
 * anybody writing a list wants first; `ignored` is what nobody can find out
 * without reading the client, and two of the three fields of the block are it.
 * Every sentence here is answerable in `lib/signalling.js`: what it refuses, what
 * it assumes, and what the assumption is.
 */
const BLOCK_GLOSS = [
  { level: 'asset', name: 'URI', must: 'required', says:
    'Where the Ad is. It is what plays when there is no block below it, and what an Ad falls ' +
    'back to when its block cannot be drawn (ADR 0019).' },
  { level: 'asset', name: 'DURATION', must: 'required', says:
    'How long this Ad is declared to run, and therefore where the next one starts: the offsets ' +
    'of a break are these numbers accumulated (Appendix D.2). It is declared metadata, and this ' +
    'client does not correct it against the creative that arrives.' },
  { level: 'asset', name: BLOCK, must: 'optional', says:
    'The extension, and the only field of this list that is not the standard\u2019s. Without it ' +
    'the asset is a linear Ad at full frame, played down the same code path as every other ' +
    'Ad (ADR 0019).' },

  { level: 'block', name: 'payload', must: 'required', says:
    'The one field of the block this client reads. An array, and each item of it becomes one Ad; ' +
    'missing or empty, the asset falls back to a linear Ad.' },
  { level: 'block', name: 'version', must: 'ignored', says:
    'Written by the tool that emits the list. This client reads it nowhere: what it branches on ' +
    'is the shape of what arrived, never a number declaring what the shape should be.' },
  { level: 'block', name: 'type', must: 'ignored', says:
    'The tool\u2019s own kind of block. Read nowhere either, and for the same reason.' },

  { level: 'item', name: 'type', must: 'optional', says:
    'The name of the layout. It is carried through to whoever draws and never compared against a ' +
    'list of known names, which is why a layout this client has never heard of still draws.' },
  { level: 'item', name: 'duration', must: 'required', says:
    'Seconds this Ad is on screen, and the only source of when it ends -- not the length of the ' +
    'creative, which can disagree. Not a number greater than zero, and the whole asset falls ' +
    'back to a linear Ad.' },
  { level: 'item', name: 'start', must: 'optional', says:
    'Seconds into its own asset where the Ad begins. Absent it is 0, which is what every payload ' +
    'the SVTA tool emits carries.' },
  { level: 'item', name: 'layout', must: 'required', says:
    'Where the boxes go. A layout with no assets in it cannot become a box on a screen, so its ' +
    'asset falls back to a linear Ad.' },
  { level: 'item', name: 'identifiers', must: 'optional', says:
    'Who this Ad is: one or more scheme and value pairs, here an Ad-ID. Mandatory in the spec, ' +
    'not needed to draw: this client passes it on untouched to the tracking events of the Ad, ' +
    'and a list without it still draws.' },

  { level: 'layout', name: 'primaryContent', must: 'optional', says:
    'The programme, as a box of the layout like any other. Its default is the half worth knowing: ' +
    'absent, the programme is the whole frame, underneath everything, at full volume -- which is ' +
    'what draws both overlays of this minute, because the SVTA tool emits no primaryContent for ' +
    'an overlay (ADR 0004).' },
  { level: 'layout', name: 'assets', must: 'required', says:
    'The boxes of the Ad, and at least one. Missing or empty, the asset falls back to a linear Ad.' },

  { level: 'element', name: 'id', must: 'optional', says:
    'Names the box, which is what the drawing and the console call it.' },
  { level: 'element', name: 'type', must: 'optional', says:
    'The media type, and what decides how the box is filled: a still, another stream, or anything ' +
    'else the browser plays -- the three of them are in the first section. Nothing is checked up ' +
    'front, because a container does not say what is inside it.' },
  { level: 'element', name: 'uri', must: 'optional', says:
    'Where the asset of this box is. The programme has none, because it is already on screen. An ' +
    'empty string is not an error: the SVTA tool emits one in every payload it produces, and a ' +
    'client that refused it would refuse every list the tool makes (ADR 0004).' },
  { level: 'element', name: 'viewport', must: 'optional', says:
    'Four inset percentages, top right bottom left, of THE PICTURE and not of the window this is ' +
    'read in. "0 0 0 0" is the whole frame. Anything else, including nothing at all, is drawn as ' +
    'the whole frame, and the console says the viewport could not be read.' },
  { level: 'element', name: 'zDepth', must: 'optional', says:
    'Where the box sits in the stack, the highest on top, and the programme is one of them. ' +
    'Absent it is 0, and boxes at the same depth keep the order the payload wrote them in.' },
  { level: 'element', name: 'volume', must: 'optional', says:
    'Nought to a hundred, the level the box opens at. Absent, it is silence on a box of the Ad and ' +
    'full volume on the programme (ADR 0014) -- deliberately the opposite of what a missing ' +
    'volume means to the tool, because sound nobody expected is worse in a take than sound missing.' }
];

/** Said out loud rather than dropped, exactly as an unknown attribute of the tag is. */
const NO_FIELD_GLOSS = 'This page has no gloss for this field.';

/**
 * Every field the list really carries, by the depth it carries it at, in the order
 * it is first written.
 *
 * It descends the way `resolveAssetList` descends and stops where it stops: an
 * asset, its block, the items of the payload, the layout of an item, and the boxes
 * of that layout -- `primaryContent` and each entry of `assets`, which are the same
 * kind of thing and therefore one depth (rule 3 of the contract).
 */
export function fieldsOfAssetList(assetList) {
  const found = new Map(LEVELS.map((level) => [level, []]));
  const add = (level, source) => {
    const names = found.get(level);
    for (const name of Object.keys(Object(source))) if (!names.includes(name)) names.push(name);
  };
  const array = (value) => (Array.isArray(value) ? value : []);

  for (const asset of array(assetList?.ASSETS)) {
    add('asset', asset);
    const block = asset?.[BLOCK];
    if (block == null) continue;
    add('block', block);
    for (const item of array(block.payload)) {
      add('item', item);
      const layout = item?.layout;
      if (layout == null) continue;
      add('layout', layout);
      if (layout.primaryContent != null) add('element', layout.primaryContent);
      for (const box of array(layout.assets)) add('element', box);
    }
  }
  return found;
}

/**
 * One row per field this list carries: the depth, the name, whether the Ad can be
 * drawn without it, and what it is for. A field with no sentence written for it
 * gets a row saying so, which is what makes its absence visible on the page and
 * checkable off it.
 *
 * Pure and exported for the same reason `labelsOfAssetList` is: the page draws
 * exactly this and `test/comprobaciones.js` checks exactly this against the file.
 */
export function blockGlossOf(assetList) {
  const found = fieldsOfAssetList(assetList);
  const rows = [];
  for (const level of LEVELS) {
    const present = found.get(level);
    const written = BLOCK_GLOSS
      .filter((row) => row.level === level && present.includes(row.name))
      .map((row) => ({ ...row, glossed: true }));
    const unwritten = present
      .filter((name) => !BLOCK_GLOSS.some((row) => row.level === level && row.name === name))
      .map((name) => ({ level, name, must: null, says: NO_FIELD_GLOSS, glossed: false }));
    rows.push(...written, ...unwritten);
  }
  return rows;
}

/** The gloss of the block: a heading, a line, and one group of rows per depth. */
function glossOfTheBlock(assetList) {
  const box = document.createDocumentFragment();
  box.append(
    el('p', 'payload__title', 'And what the block it points at carries'),
    el('p', 'payload__lede', 'Every field below is one this list really carries, nested the way it ' +
      'is nested in the JSON. Required is what an Ad cannot be drawn without; where a field is ' +
      'optional the library assumes something, and the line says what.')
  );
  for (const level of LEVELS) {
    const rows = blockGlossOf(assetList).filter((row) => row.level === level);
    if (!rows.length) continue;
    box.append(el('p', 'payload__level', LEVEL_SAYS[level]));
    const list = el('dl', 'gloss');
    for (const row of rows) {
      const says = el('dd');
      if (row.must) {
        says.append(el('span', `payload__must payload__must--${row.must}`, row.must));
      }
      says.append(document.createTextNode(row.says));
      list.append(el('dt', null, row.name), says);
    }
    box.append(list);
  }
  return box;
}

/**
 * The attributes of a Date Range line, in the order the line writes them.
 *
 * Quoted values are matched as a whole on purpose: X-SNAP="OUT,IN" carries a
 * comma inside its own value, and splitting the line on commas would turn one
 * attribute into two.
 */
function attributesOfTag(line) {
  const out = [];
  const body = String(line ?? '').replace(/^#EXT-X-DATERANGE:/, '');
  for (const match of body.matchAll(/([A-Z0-9-]+)=(?:"([^"]*)"|([^,]*))/g)) {
    out.push({ name: match[1], value: match[2] ?? match[3] ?? '' });
  }
  return out;
}

/** The layout identifiers an asset declares: none for an asset with no block. */
function layoutTypesOf(asset) {
  const payload = asset?.[BLOCK]?.payload;
  return (Array.isArray(payload) ? payload : [])
    .map((item) => item?.type)
    .filter((type) => typeof type === 'string' && type.length > 0);
}

/**
 * The medium of an Ad, read off the MIME its own boxes declare. An asset that
 * declares none -- the linear one, which has no layout block to declare them in
 * -- says nothing here rather than being guessed into a word out of its URI.
 */
function mediumOf(asset) {
  const payload = asset?.[BLOCK]?.payload;
  const declared = (Array.isArray(payload) ? payload : [])
    .flatMap((item) => item?.layout?.assets ?? [])
    .map((box) => box?.type)
    .filter(Boolean);
  if (!declared.length) return null;
  return declared.every((type) => /^image\//i.test(type)) ? 'still image' : 'video';
}

/**
 * The label of one fold: the ordinal, what the layout is called, how long it
 * runs and what it is made of. Every part is read off the asset, and the parts
 * the asset does not declare are left out instead of filled in.
 */
function labelOfAsset(asset, ordinal) {
  const types = layoutTypesOf(asset);
  const parts = [`Ad ${ordinal}`, types.length ? types.join(' + ') : NO_BLOCK];
  const duration = Number(asset?.DURATION);
  if (Number.isFinite(duration)) parts.push(`${+duration.toFixed(2)} s`);
  const medium = mediumOf(asset);
  if (medium) parts.push(medium);
  return parts.join(' · ');
}

/** One label per ASSET, in the order the list declares them, which is the order they play. */
export function labelsOfAssetList(assetList) {
  return (assetList?.ASSETS ?? []).map((asset, i) => labelOfAsset(asset, i + 1));
}

/** The gloss, one line per attribute the line really carries and none for the rest. */
function glossOfTag(line) {
  const list = el('dl', 'gloss');
  for (const { name } of attributesOfTag(line)) {
    list.append(el('dt', null, name), el('dd', null, GLOSS[name] ?? NO_GLOSS));
  }
  return list;
}

/** One fold: the label of an Ad as the summary, and the raw JSON of that Ad inside. */
function fold(asset, ordinal) {
  const details = el('details', 'asset');
  const summary = el('summary');
  summary.append(
    el('span', 'asset__label', labelOfAsset(asset, ordinal)),
    el('span', 'asset__live', 'on screen now')
  );
  details.append(summary, el('pre', 'code', JSON.stringify(asset, null, 2)));
  return details;
}

/**
 * The identity of the Ad each fold describes, paired by order, or `null` while
 * the signalling has not finished handing its ranges over.
 *
 * An empty array is the third answer and it is not a failure of the page: the
 * counts do not agree, so which fold is which cannot be told from the order
 * alone -- an asset whose block declares two items resolves into two Ads, and an
 * asset with nothing playable resolves into none. Nothing is marked then, which
 * is the honest outcome; a mark on the wrong fold would claim something this
 * page did not read.
 */
function identitiesOf(provider, folds) {
  const ads = adsOfTheMinute(provider);
  if (ads.length === folds) return ads.map((experience) => experience.itemId);
  if (!provider.programRanges().settled) return null;
  console.warn(`[page] the asset-list declares ${folds} assets and the break resolved into ` +
    `${ads.length} Ads, so no fold can be told from another by order alone: the one on screen` +
    ' is not marked.');
  return [];
}

/**
 * Marks the fold of the Ad on screen, and only marks it (ADR 0075).
 *
 * It costs no reading of its own: `activeAt` is the same call `paint()` already
 * makes on every `timeupdate`, and what is added is the comparison by `itemId`,
 * which is rule 6 of the contract -- two Ads are told apart by `itemId` and
 * never by `type`, because a break is allowed to run the same layout twice.
 */
function markTheOneOnScreen({ folds, provider, video }) {
  let identities = null;
  const mark = () => {
    identities ??= identitiesOf(provider, folds.length);
    if (!identities?.length) return;
    const live = new Set(provider.activeAt(video.currentTime).map((e) => e.itemId));
    folds.forEach((node, i) => node.toggleAttribute('data-live', live.has(identities[i])));
  };
  video.addEventListener('timeupdate', mark);
  mark();
}

/**
 * Draws the section: the tag, its gloss, and one fold per Ad of the asset-list.
 *
 * The gloss of the tag is built here and not left as an empty box in the markup
 * because it belongs to the tag and not to the asset-list: it is inserted right
 * after the block it explains, so the two cannot drift apart in the page. The gloss
 * of the BLOCK does have a box of its own, because it belongs to the list and the
 * list arrives one fetch later.
 */
export async function showSignalling({ src, tag, mount, payload, provider, video }) {
  try {
    const playlist = await fetch(src).then((r) => r.text());
    const line = playlist.split('\n').find((l) => l.startsWith('#EXT-X-DATERANGE:'));
    // Wrapped on the commas, because the real line is one long tag and a horizontal
    // scrollbar is a worse way to read it than four short lines.
    tag.textContent = line ? line.replace(/,(?=[A-Z-]+=)/g, ',\n  ') : 'no Date Range in the playlist';
    if (line) tag.insertAdjacentElement('afterend', glossOfTag(line));

    const url = line?.match(/X-ASSET-LIST="([^"]+)"/)?.[1];
    const assetList = url ? await fetch(url).then((r) => r.json()) : null;
    const assets = assetList?.ASSETS;
    if (!Array.isArray(assets) || assets.length === 0) {
      mount.append(el('p', 'note', 'no asset-list on the tag'));
      return;
    }

    payload.replaceChildren(glossOfTheBlock(assetList));
    const folds = assets.map((asset, i) => fold(asset, i + 1));
    mount.replaceChildren(...folds);
    markTheOneOnScreen({ folds, provider, video });
  } catch (error) {
    // Says what happened instead of leaving "loading…" on the page for good.
    tag.textContent = `could not read the signalling: ${error.message}`;
    payload.replaceChildren();
    mount.replaceChildren(el('p', 'note', `could not read the signalling: ${error.message}`));
    console.error('[page] the signalling could not be shown', error);
  }
}
