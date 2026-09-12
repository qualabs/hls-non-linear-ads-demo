// contrato.js -- everything the two middle sections draw, and all of it off the
// provider.
//
// NONE OF IT IS A PICTURE OF THE DEMO. Every box on this page is markup with its
// four insets written as percentages, taken from the `box` the contract
// resolved; every name is a `name` the asset-list declared; every field name is
// a key of an object the library handed over. A screenshot is a claim frozen on
// the day somebody pressed the shutter, and this page is built on the opposite
// property: change the asset-list and these drawings change with it, and there
// is nobody who has to remember to be told.
//
// AND NOT ONE LAYOUT NAME, VIEW NAME OR PERCENTAGE IS WRITTEN IN THIS FILE,
// which is what makes the paragraph above a property rather than an intention.
//
// THE TWO SECTIONS ASK THE PROVIDER TWO DIFFERENT QUESTIONS, and the difference
// is the whole shape of this file.
//
//   WHAT IS ANNOUNCED is answered once, as soon as the asset-lists resolve, and
//   never changes: an ad announces boxes, an offer announces a catalogue, and
//   neither depends on anybody watching. It is drawn from `experiences`.
//
//   WHAT WAS COMPOSED cannot be answered in advance AT ALL, and that is not a
//   shortcoming of the page, it is the subject of the demo: the shapes do not
//   exist until a viewer makes them. So the gallery starts empty and fills as
//   the run walks it, one cell per number of boxes the composition has actually
//   reached, each one stamped with the second it happened. It is a record of the
//   run the reader just did, and it cannot disagree with the picture because it
//   is read off the same provider that drew it.
//
// THE CAP OF THE GRID IS NOWHERE IN THIS FILE, on purpose. How many boxes fit is
// the library's and the page has no business repeating it: a number typed here
// is a number that goes stale in silence the day the table of shapes grows. What
// the gallery shows is the counts that happened, so it says the same thing
// without asserting it.

import { el, namesOf, secs } from './dom.js';

/** Whether an experience is an offer, by the one field an offer has and an ad has not. */
const isOffer = (experience) => Array.isArray(experience?.views);

/**
 * A box, as the four percentages the contract declares, drawn where they put it.
 *
 * `inset` takes top, right, bottom and left in that order, which is the order of
 * `viewport` itself (ADR 0001), so the drawing is the declaration with a unit
 * appended and nothing in between to get wrong.
 */
function boxNode(element, name) {
  const { top, right, bottom, left } = element.box;
  const node = el('div', 'box');
  node.style.inset = `${top}% ${right}% ${bottom}% ${left}%`;
  // THE STACK IS THE CONTRACT'S OWN, and it matters in exactly one drawing: a
  // box at full frame is on top of the others and HIDES them, which is what the
  // screen does and therefore what the diagram has to do. Without it the labels
  // underneath read through the one on top and the cell says four things are on
  // screen when one is.
  node.style.zIndex = String(element.zDepth);
  if (element.primary) node.classList.add('box--primary');
  node.append(el('span', 'box__name', name ?? element.id));
  return node;
}

/** A 16/9 area with one box per element of a composition, in `zDepth` order. */
function figureOf(elements, names) {
  const figure = el('div', 'figure');
  for (const element of elements) figure.append(boxNode(element, names.get(element.id)));
  return figure;
}

// ---------------------------------------------------------------------------
// Section 1: what a break announces.
// ---------------------------------------------------------------------------

/**
 * One card per break of the programme, in the order they play, and the card an
 * experience gets is decided by what it announces and never by its position.
 *
 * An ad is drawn: its boxes are in the payload, so they can be. An offer is
 * LISTED, because there is nothing to draw -- and the card says that out loud
 * rather than leaving a suspicious empty rectangle, because "no geometry here"
 * is the point of the card and not a gap in it.
 */
function announceCard(experience) {
  const card = el('article', 'card');
  card.append(el('p', 'card__kind', isOffer(experience) ? 'a catalogue' : 'a composition'));
  card.append(el('h3', null, experience.type));
  if (isOffer(experience)) {
    card.append(el('p', 'card__lede',
      `${experience.views.length} feeds on offer, and the programme makes one more. Each one ` +
      'arrives with a name to be listed by and an address to be played from, and nothing at all ' +
      'about where it goes.'));
    const list = el('ol', 'card__catalogue');
    list.append(el('li', 'card__primary', experience.primaryName));
    for (const view of experience.views) list.append(el('li', null, view.name));
    card.append(list);
    card.append(el('p', 'card__note',
      'The first row is the programme. It is a view like the others and it is the reason the ' +
      'grid counts one more box than the catalogue has feeds.'));
    return card;
  }
  const assets = experience.elements.filter((element) => !element.primary);
  const one = assets.length === 1;
  card.append(el('p', 'card__lede',
    `${assets.length} box${one ? '' : 'es'} over the programme, and the picture below is ` +
    `${one ? 'that box' : 'those boxes'} in the percentages the payload declared. Nothing on ` +
    'this side is decided by whoever is watching.'));
  card.append(figureOf(experience.elements, new Map(
    experience.elements.map((element) => [element.id, element.primary ? 'the programme' : element.id])
  )));
  return card;
}

/**
 * What one item of each kind carries, as the keys themselves.
 *
 * The gloss is prose and the FIELD NAMES ARE NOT: they are read off an element
 * of the ad and a view of the catalogue this run really resolved. A field with
 * no gloss written for it says so on the page instead of being quietly left out,
 * which is the only way this stays honest when the contract grows a field.
 */
const GLOSS = {
  id: 'what this box is called, in the composition and in the list',
  primary: 'whether this box is the programme',
  box: 'where it goes, as four percentages of inset from the edges',
  zDepth: 'what it is drawn over',
  volume: 'how loud it arrives',
  uri: 'where the media is',
  mediaType: 'what kind of media it is, which decides how it is put in the box',
  name: 'what the row in the list says — the one field an ad has no use for'
};

function fieldList(title, subtitle, keys, missing) {
  const column = el('div', 'fields__col');
  column.append(el('h3', null, title), el('p', 'fields__sub', subtitle));
  const list = el('dl', 'fields__list');
  for (const key of keys) {
    const term = el('dt', null, key);
    if (missing.has(key)) term.classList.add('fields__only');
    list.append(term, el('dd', null, GLOSS[key] ?? 'no gloss is written for this field on this page'));
  }
  column.append(list);
  return column;
}

function drawFields(mount, element, view) {
  const elementKeys = Object.keys(element);
  const viewKeys = Object.keys(view);
  const onlyElement = new Set(elementKeys.filter((key) => !viewKeys.includes(key)));
  const onlyView = new Set(viewKeys.filter((key) => !elementKeys.includes(key)));
  mount.replaceChildren(
    fieldList('one element of the ad', 'what the publisher composed', elementKeys, onlyElement),
    fieldList('one view of the catalogue', 'what the publisher offered', viewKeys, onlyView),
    el('p', 'fields__foot',
      `Marked: ${[...onlyElement].join(', ')} arrive on the ad and not on the view, and ` +
      `${[...onlyView].join(', ')} arrives on the view and not on the ad. What an offer leaves ` +
      'out is the geometry and the mix, and neither is an oversight: where a box goes depends on ' +
      'how many boxes there will be, which is a number whoever wrote the catalogue did not have, ' +
      'and the opening mix of an offer is not a mix somebody composed — it is the programme ' +
      'carrying on. What it adds is the name, because a catalogue somebody chooses from cannot ' +
      'be a list of identifiers.')
  );
}

// ---------------------------------------------------------------------------
// Section 2: the shapes, and the way out.
// ---------------------------------------------------------------------------

/** The one cell that is there before anybody has composed anything. */
function emptyGallery(mount) {
  mount.replaceChildren(el('p', 'shapes__empty',
    'Nothing has been composed yet. Open a window above, tick a feed, and the shape it makes ' +
    'appears here — with the boxes the contract resolved for it and the second it happened.'));
}

/** One recorded shape: its boxes, its names, and when the run reached it. */
function shapeCard(shape) {
  const card = el('figure', 'shape');
  card.append(figureOf(shape.elements, shape.names));
  const caption = el('figcaption', null, shape.title);
  caption.append(el('span', 'shape__when', ` · first seen at ${secs(shape.at)}`));
  card.append(caption);
  return card;
}

/**
 * Whether one box is at full frame over the others, read off the boxes. The
 * elements arrive ascending by `zDepth`, so the last one is the one on top.
 */
function covering(elements) {
  if (elements.length < 2) return null;
  const top = elements[elements.length - 1];
  return Object.values(top.box).every((inset) => inset === 0) ? top : null;
}

export function showWhatIsAnnounced({ provider, video, cards, fields, shapes, wayout }) {
  // THE READING OF THE PRIMARY CONTENT BEFORE ANYTHING WAS COMPOSED, taken now,
  // which is the only moment it can be taken: this module runs before the first
  // window opens, and after that there is no going back for it.
  const atLoad = { style: video.getAttribute('style'), volume: video.volume };

  /** Number of boxes -> the shape recorded the first time the run reached it. */
  const seen = new Map();
  let announced = false;
  let lastKey = null;

  emptyGallery(shapes);

  function drawAnnounced() {
    if (announced) return;
    // SETTLED, AND NOT "THERE IS ENOUGH TO DRAW". The breaks arrive one at a
    // time, as each asset-list comes back off the network, and a section drawn
    // the moment it had one of each would be a section that showed the first two
    // breaks of a playlist that has three. `settled` is the contract's own
    // answer to "is this the whole list": the source is closed and nothing is
    // still being fetched. Waiting for it costs a few hundred milliseconds of an
    // empty container, and an empty container is the honest state of a section
    // whose subject has not finished arriving. Measured: drawn on the first
    // sufficient frame instead, this section showed two of the three breaks.
    const { ranges, settled } = provider.programRanges();
    if (!settled) return;
    announced = true;
    const byId = new Map(provider.experiences.map((e) => [e.id, e]));
    // Every break and not a pair picked here: a playlist with four would show
    // four, because what the list comes from is the ranges.
    const ordered = ranges.map((range) => byId.get(range.id)).filter(Boolean);
    cards.replaceChildren(...ordered.map(announceCard));
    // The field comparison needs one of each kind, and half a comparison is
    // worth nothing: a playlist that carried only offers leaves that container
    // empty rather than comparing a view against itself.
    const offer = ordered.find(isOffer);
    const adAsset = ordered
      .filter((experience) => !isOffer(experience))
      .flatMap((experience) => experience.elements)
      .find((element) => !element.primary);
    if (offer && adAsset) drawFields(fields, adAsset, offer.views[0]);
  }

  function recordShape(experience, elements) {
    const names = namesOf(provider.rows(experience));
    const full = covering(elements);
    // The enlarged state is recorded under a key of its own and not under a
    // number of boxes, because it is the same count with a different shape: the
    // other boxes are still there and still playing, covered.
    const key = full ? 'full' : elements.length;
    if (seen.has(key)) return;
    seen.set(key, {
      key,
      at: video.currentTime,
      elements: elements.map((element) => ({ ...element, box: { ...element.box } })),
      names,
      title: full
        ? `one box at full frame, over ${elements.length - 1} that keep playing`
        : `${elements.length} boxes`
    });
    // Ascending by count, with the full-frame one last: it is not a step of the
    // ladder, it is what a viewer does once he is on it.
    const cells = [...seen.values()].sort((a, b) => {
      if (a.key === 'full') return 1;
      if (b.key === 'full') return -1;
      return a.key - b.key;
    });
    shapes.replaceChildren(...cells.map(shapeCard));
  }

  function drawWayOut() {
    const now = { style: video.getAttribute('style'), volume: video.volume };
    const show = (reading) =>
      `style=${reading.style === null ? 'null' : JSON.stringify(reading.style)} · ` +
      `volume=${reading.volume}`;
    wayout.replaceChildren(
      el('dt', null, 'the primary content, when the page loaded'),
      el('dd', null, show(atLoad)),
      el('dt', null, 'the primary content, now'),
      el('dd', 'wayout__now', show(now))
    );
  }

  function tick() {
    drawAnnounced();
    const offer = provider.offerAt(video.currentTime);
    if (offer) {
      const elements = provider.activeAt(video.currentTime)
        .find((experience) => experience.itemId === offer.itemId)?.elements ?? [];
      // A key over the ids and the boxes: a composition that changed is a
      // composition where one of those moved, and comparing it is what keeps
      // this out of the way on the frames where nothing happened.
      const key = elements.map((e) => `${e.id}@${Object.values(e.box).join(',')}`).join('|');
      if (key !== lastKey) {
        lastKey = key;
        if (elements.length) recordShape(offer, elements);
      }
    }
    drawWayOut();
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}
