// senalizacion.js -- the second section: the signalling of this race, as it is served.
//
// EVERYTHING HERE COMES OFF THE NETWORK AND NOTHING OFF THIS REPOSITORY. The tag is the line
// of the media playlist this player is playing, fetched again and printed as it is; the JSON
// is the asset-list that tag points at, fetched from the URL the tag declares, which is the
// URL the library fetched it from. A tag or a payload pasted into a file here would be an
// illustration of a playlist, which is worth nothing to an audience that reads playlists for
// a living.
//
// AND IT IS FETCHED A SECOND TIME ON PURPOSE, rather than asking the library for what it
// already has. What the library hands over is the contract -- resolved experiences, with the
// two defaults of the tool already applied -- and the point of this section is the document
// BEFORE that happened. Asking the provider would show the reading and call it the source.
//
// IT MATTERS MORE HERE THAN IN THE DEMO THIS CODE COMES FROM, because this asset-list is not
// a file somebody wrote: it is derived from `race.json` at packaging time, and the cameras in
// it are the cameras that were really packaged. Printing the document that was served is the
// only way to show that the catalogue on screen is the catalogue on the wire.
//
// THE GLOSS IS PROSE AND THE FIELD NAMES ARE NOT. Each list below is the keys of the object
// in front of the reader, in the order the document carries them, and a key nobody wrote a
// gloss for says so on the page. That is the only shape that stays honest the day a field is
// added: the alternative -- a written list of fields -- goes quiet instead of going wrong.

import { el, secs } from './dom.js';

/** What each level of the document carries. Prose, and keyed by the real names. */
const GLOSS = {
  asset: {
    URI: 'what a client that does not read our block plays instead: the first camera of the ' +
      'catalogue, at full frame. The offer degrades to one camera, linear, and that is said ' +
      'rather than smoothed over',
    DURATION: 'how long this asset lasts, which is what the window adds up to',
    'X-AD-CREATIVE-SIGNALING': 'our block, on top of the standard asset'
  },
  block: {
    version: 'the version of the block',
    type: 'what class of thing this is: an offer announces a catalogue, a slot announces ads',
    payload: 'the items of the block, one per experience'
  },
  item: {
    type: 'the mechanism this item asks for',
    start: 'how far into the asset this item begins',
    duration: 'how long the cameras stay on offer. The race does not stop for it and it does ' +
      'not stop the race: when it closes, whoever was watching a car is back on the world feed',
    primaryName: 'what the race coverage is called in the list, because it is one of the views ' +
      'and therefore one of the rows. Whoever publishes is the only one who knows whether it ' +
      'is "World feed", "Programme" or the name of a channel',
    views: 'the catalogue itself: the cameras that were packaged for this race'
  },
  view: {
    id: 'what this camera is called in the composition',
    name: 'what its row in the list says -- the driver, because that is what somebody is ' +
      'looking for when they open the list',
    type: 'the MIME of the feed',
    uri: 'where it is played from'
  }
};

/** One `<dl>` of the keys an object really carries, with the gloss of its level. */
function levelOf(title, object, gloss) {
  const block = el('div', 'payload__level');
  block.append(el('h3', null, title));
  const list = el('dl', null);
  for (const key of Object.keys(object)) {
    list.append(
      el('dt', null, key),
      el('dd', null, gloss[key] ?? 'no gloss is written for this field on this page')
    );
  }
  block.append(list);
  return block;
}

/** The attributes of one Date Range line, wrapped so a narrow screen can read it. */
function tagNode(line) {
  const node = el('div', 'tag');
  const [head, ...rest] = line.split(':');
  node.append(el('span', 'tag__name', `${head}:`));
  // Split on commas that are not inside quotes, which is what an attribute list of a
  // playlist is: a value may carry a comma.
  const attributes = rest.join(':').match(/(?:[^,"]|"[^"]*")+/g) || [];
  for (const attribute of attributes) node.append(el('span', 'tag__attr', attribute));
  return node;
}

export function showSignalling({ src, provider, video, tags, payload, assets }) {
  let folds = [];

  fetch(src)
    .then((response) => response.text())
    .then(async (playlist) => {
      const lines = playlist.split('\n').filter((line) => line.startsWith('#EXT-X-DATERANGE:'));
      if (!lines.length) throw new Error('the playlist carries no Date Range');
      tags.replaceChildren(...lines.map(tagNode));

      // One fold per tag, in the order of the playlist, each one carrying the document that
      // tag points at. The fetch is what the library does, at the URL the tag declares,
      // resolved against the playlist so a relative X-ASSET-LIST works the same way here as
      // it does there.
      const documents = await Promise.all(lines.map(async (line) => {
        const id = line.match(/ID="([^"]+)"/)?.[1] ?? '(no ID)';
        const url = line.match(/X-ASSET-LIST="([^"]+)"/)?.[1];
        if (!url) return { id, url: null, list: null };
        const absolute = new URL(url, new URL(src, location.href)).href;
        try {
          return { id, url: absolute, list: await fetch(absolute).then((r) => r.json()) };
        } catch (error) {
          console.error('[page] the asset-list of', id, 'could not be read', absolute, error);
          return { id, url: absolute, list: null };
        }
      }));

      folds = documents.map(({ id, url, list }) => {
        const fold = el('details', 'asset');
        const summary = el('summary', null, id);
        summary.append(el('span', 'asset__url', url ?? 'no X-ASSET-LIST'));
        summary.append(el('span', 'asset__live', 'open now'));
        fold.append(summary);
        fold.append(el('pre', 'code',
          list ? JSON.stringify(list, null, 2) : 'the asset-list could not be read'));
        return { id, node: fold };
      });
      assets.replaceChildren(...folds.map((fold) => fold.node));

      // The gloss is drawn off the offer of this run, at its four levels. If no asset-list of
      // this playlist announces a catalogue there is nothing to explain, and the container
      // stays empty rather than explaining a shape the reader cannot see.
      const offer = documents
        .map(({ list }) => list?.ASSETS?.[0])
        .find((asset) => Array.isArray(asset?.['X-AD-CREATIVE-SIGNALING']?.payload?.[0]?.views));
      if (!offer) return;
      const block = offer['X-AD-CREATIVE-SIGNALING'];
      const item = block.payload[0];
      payload.replaceChildren(
        el('p', 'payload__lede',
          'The block of the offer, field by field, read off the asset-list this player ' +
          'fetched — the same document that is open in the fold below. What is worth looking ' +
          'for is what is NOT in it: a camera carries no viewport, no zDepth and no volume. ' +
          'Where a box goes depends on how many cars somebody is watching at once, and nobody ' +
          'knew that when the race was packaged.'),
        levelOf('the asset', offer, GLOSS.asset),
        levelOf('the block', block, GLOSS.block),
        levelOf('the item', item, GLOSS.item),
        levelOf('one camera of the catalogue', item.views[0], GLOSS.view)
      );
    })
    .catch((error) => {
      // A section that cannot load is not a reason to lose the demo, and an empty container is
      // the honest state of one: the player above it is playing and the console says what
      // happened.
      console.error('[page] the signalling section did not load', error);
      tags.textContent = 'the playlist could not be read';
    });

  // WHICH FOLD IS LIVE, kept current off the ranges. The id of a range is the ID of its Date
  // Range, so the fold and the window are matched by the one name the two documents share,
  // and not by their order.
  function mark() {
    const time = video.currentTime || 0;
    const { ranges } = provider.programRanges();
    for (const fold of folds) {
      const range = ranges.find((r) => r.id === fold.id);
      const open = !!range && time >= range.startTime && time < range.startTime + range.duration;
      fold.node.classList.toggle('asset--live', open);
      if (range) {
        fold.node.dataset.window = `${secs(range.startTime)} – ${secs(range.startTime + range.duration)}`;
      }
    }
    requestAnimationFrame(mark);
  }
  requestAnimationFrame(mark);
}
