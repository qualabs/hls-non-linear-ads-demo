// tipos.js -- everything "Two ways to run an Ad" draws off the contract: the
// gallery of shapes, what can go inside one of those boxes, and the one number of
// the section that is a sum and not a count.
//
// NONE OF IT IS A PICTURE OF THE DEMO (ADR 0073). Every card is markup built at
// load time out of what the provider resolved for THIS run: the type of the
// layout, the inset percentages of every element, the order they stack in, the
// media type and the duration. A screenshot would be a claim frozen on the day
// somebody took it, and this page is built on the opposite property -- so when
// the asset-list changes, these drawings change with it, and there is nobody who
// has to remember to be told.
//
// AND THERE IS NOT ONE LAYOUT NAME WRITTEN IN THIS FILE, which is what makes the
// paragraph above a property instead of an intention. The names are drawn on the
// page and typed nowhere: `test/comprobaciones.js` asserts that no layout
// identifier of the asset-list appears as a literal here or in `index.html`, and
// `test/mutaciones.mjs` plants one on a copy to prove that check can fail.
//
// WHAT IT READS IS THE CONTRACT AND NOTHING ELSE -- `programRanges()` for where
// the breaks are, `activeAt(t)` for what is on at an instant. `activeAt` answers
// for instants that have not been played yet, because it filters the whole
// resolved array; that is the premise this section rests on, and it was measured
// in flight before any of this was written: with the programme at 0 s, the
// fourth Ad of the break came back with its boxes already resolved.
//
// THE WALK IS NOT A FIXED STEP, and that is the only piece of cleverness here.
// Sampling every half second would ask a hundred questions for four answers and
// would still miss an Ad shorter than the step. Every answer says where to ask
// next instead: the earliest `startTime + duration` among what is active is the
// first instant anything can change, so the walk lands on the start of every Ad
// of the break and nowhere else. The step is the fallback for an instant with
// nothing active, which a break of consecutive Ads never has.
//
// AND THE RANGES ARE FILTERED BY KIND, which is what keeps this file right the
// day a range of another kind lands in this demo. A multi-view offer announces a
// catalogue and not a layout (ADR 0064), so it has no boxes to draw, and the
// traditional interstitial the same playlist signals is a window this player
// does not play at all.
//
// WHAT CAN GO IN A BOX IS THE LIBRARY'S THREE BRANCHES AND NOT A LIST OF FORMATS.
// `attachAsset` in `lib/media.js` asks three questions in order -- is it an image,
// is it a media playlist, is it anything else -- and each answer is a different way
// of getting pixels into the box. `KINDS` below is those three questions in that
// order, and the media types printed next to them are the ones THIS run declares,
// read off the contract like everything else here. A table of formats is the thing
// ADR 0056 already refused to keep: this layer does not read a container to deduce
// what is inside it.

/** Seconds to advance when an instant has nothing active. See the walk, above. */
const STEP = 0.5;

/** How the gallery re-reads while the signalling is still resolving: fifteen seconds. */
const RETRY_EVERY_MS = 250;
const RETRY_TIMES = 60;

/**
 * Every Ad of the concurrent breaks of this programme, in the order they play.
 *
 * Two Ads are told apart by `itemId` and never by `type` (rule 6): a break is
 * allowed to run the same layout twice in a row, and a gallery that deduplicated
 * by type would draw one card for two Ads.
 */
export function adsOfTheMinute(provider) {
  const seen = new Map();
  for (const range of provider.programRanges().ranges) {
    if (range.kind !== 'concurrent') continue;
    const end = range.startTime + range.duration;
    let t = range.startTime;
    while (t < end) {
      const active = provider.activeAt(t);
      for (const experience of active) {
        if (!seen.has(experience.itemId)) seen.set(experience.itemId, experience);
      }
      // Strictly greater than `t` in both branches, so the walk always advances
      // and the loop needs no counter to be finite.
      const ends = active.map((e) => e.startTime + e.duration).filter((x) => x > t);
      t = ends.length ? Math.min(...ends) : t + STEP;
    }
  }
  return [...seen.values()].sort((a, b) => a.startTime - b.startTime);
}

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
};

/**
 * The medium of an Ad, read off the MIME of its own elements rather than off its
 * type. The primary content carries none because it is already on screen
 * (rule 3), and an element the contract declares no media type for says nothing
 * here instead of being guessed into a word.
 */
function medium(experience) {
  const declared = experience.elements.filter((e) => !e.primary && e.mediaType);
  if (!declared.length) return null;
  return declared.every((e) => /^image\//i.test(e.mediaType)) ? 'still image' : 'video';
}

/**
 * Whether the Ad covers the picture, which is the one moment of this minute
 * where "nothing was replaced" reads backwards on screen: the programme is
 * underneath and never stopped, and somebody looking at a covered frame reads
 * the opposite.
 *
 * It is read off the boxes and not off the type of the Ad, so any layout that
 * ever declares one gets the same line without this file learning about it.
 * `elements` arrives ascending by zDepth (rule 2), so the last one is the one on
 * top: an Ad element up there with every inset at zero is an Ad at full frame.
 */
function coversThePicture(experience) {
  const top = experience.elements[experience.elements.length - 1];
  return top != null && !top.primary && Object.values(top.box).every((v) => v === 0);
}

/**
 * The three things an element of a layout can be, in the order `attachAsset` asks
 * about them: the questions are the library's and the sentences are this page's.
 *
 * `holds` takes an Element of the contract and repeats the library's own test,
 * which is the one duplication in this file and the same one `medium` above and
 * `shape()` in `js/app.js` already carry: what tells a still from a video is the
 * `mediaType`, and this page asks it the same way rather than asking the library
 * for an answer the contract does not carry. The last one holds everything, which
 * is what makes it the `else` and not a third test.
 */
const KINDS = [
  {
    id: 'still',
    name: 'A still image',
    holds: (element) => /^image\//i.test(element.mediaType || ''),
    what: 'An <img>, with no player under it and no timeline of its own: the stretch of the ' +
      'break it fills is the one the signalling declares. Transparency survives, because a ' +
      'still is never laid on the black bed a video gets while it decodes (ADR 0056) -- 47 % ' +
      'of the pixels of this minute\u2019s banner carry partial alpha. A JPEG goes down the ' +
      'same path and has no alpha to keep: nothing here reads a container to decide.'
  },
  {
    id: 'stream',
    name: 'Another HLS stream',
    holds: (element) => /mpegurl/i.test(element.mediaType || '') ||
      /\.m3u8($|\?)/i.test(element.uri || ''),
    what: 'The box gets an instance of the player library of its own, so what is in it is a ' +
      'whole stream and not a clip: its own variants, its own segments and its own audio, ' +
      'playing at the same time as the programme. A URI that ends in .m3u8 is enough on its ' +
      'own, which is the path the Ad that declares no layout takes.'
  },
  {
    id: 'file',
    name: 'Anything else the browser plays',
    holds: () => true,
    what: 'The URI goes on the video element as it is and the browser plays what it can -- an ' +
      'MP4, a WebM. Nothing on this side checks the media type first: a container does not ' +
      'say what is inside it, so the only honest answer arrives when the element tries to play.'
  }
];

/** What the tile says when this minute declares nothing of that kind. */
const NOT_HERE = 'nothing in this minute';

/**
 * The media types this run declares, grouped by the branch that would draw them.
 *
 * An element that declares none is counted into its branch and adds no name to it,
 * which is not a gap: the Ad with no layout block declares no `type` and is drawn
 * as a stream because its URI ends in .m3u8, so the branch is right and there is no
 * media type to print. Guessing one out of the URI is what the rest of this file
 * refuses to do.
 */
export function mediaKinds(ads) {
  const found = new Map(KINDS.map((kind) => [kind.id, []]));
  for (const experience of ads) {
    for (const element of experience.elements) {
      if (element.primary) continue;
      const kind = KINDS.find((k) => k.holds(element));
      const names = found.get(kind.id);
      if (element.mediaType && !names.includes(element.mediaType)) names.push(element.mediaType);
    }
  }
  return found;
}

/** One tile per branch: the texture, the name, what this run puts in it, and why. */
function mediaCards(ads) {
  const found = mediaKinds(ads);
  return KINDS.map((kind) => {
    const card = el('li', 'media__kind');
    const swatch = el('div', `media__swatch media__swatch--${kind.id}`);
    swatch.setAttribute('aria-hidden', 'true');
    const names = found.get(kind.id);
    card.append(
      swatch,
      el('p', 'media__name', kind.name),
      el('p', 'media__mime', names.length ? names.join(' \u00b7 ') : NOT_HERE),
      el('p', 'media__what', kind.what)
    );
    return card;
  });
}

/**
 * Seconds of the break with the picture covered, and the whole of the break to read
 * it against. A number with no reference is not a measurement.
 *
 * It is the honest half of what used to be typed into this section as "0 seconds of
 * programme replaced". Nothing IS replaced -- the programme is never stopped and the
 * timeline never changes length (ADR 0016) -- and for eight seconds of this minute
 * the match cannot be seen, which is what somebody watching reads. The sentence was
 * true about the timeline and backwards about the screen, so the screen wins.
 */
export function secondsWithoutThePicture(ads) {
  return ads.filter(coversThePicture).reduce((total, e) => total + e.duration, 0);
}

/** The whole of the concurrent breaks of this programme, in seconds. */
export function secondsOfTheBreaks(provider) {
  return provider.programRanges().ranges
    .filter((range) => range.kind === 'concurrent')
    .reduce((total, range) => total + range.duration, 0);
}

/** The ordinal, the type of the layout, the medium and the window: every part read. */
function caption(experience, ordinal) {
  const parts = [`Ad ${ordinal}`, experience.type];
  const mime = medium(experience);
  if (mime) parts.push(mime);
  parts.push(`${+experience.duration.toFixed(2)} s`);
  return parts.join(' · ');
}

/** One card: the boxes of one Ad over a 16:9 frame, and what the contract calls it. */
export function shapeCard(experience, ordinal) {
  const figure = el('figure', 'shape');
  const frame = el('div', 'shape__frame');

  // Drawn in the order the contract hands them over -- ascending zDepth, rule 2
  // -- so the last box in the markup is the one on top and no z-index of ours
  // decides anything. The insets go straight into `inset`, which is the same
  // subtraction the renderer does in pixels, in the units the layout declared.
  for (const element of experience.elements) {
    const box = el('div', element.primary ? 'shape__box shape__box--primary' : 'shape__box');
    const { top, right, bottom, left } = element.box;
    box.style.inset = `${top}% ${right}% ${bottom}% ${left}%`;
    box.append(
      el('span', 'shape__id', element.id),
      el('span', 'shape__inset', `${top} ${right} ${bottom} ${left}`)
    );
    frame.append(box);
  }

  const legend = el('figcaption', 'shape__caption', caption(experience, ordinal));
  if (coversThePicture(experience)) {
    legend.append(el('span', 'shape__note', 'At full frame, over a programme that never stopped.'));
  }
  figure.append(frame, legend);
  return figure;
}

/**
 * The number of the section that is a sum and not a count, appended rather than
 * typed: the two items next to it are shapes of the asset-list and the suite
 * already checks them, and this one is read off the boxes, which only the contract
 * knows. It is replaced and not appended twice, because the walk below re-reads.
 */
function paintFact(facts, provider, ads) {
  const covered = secondsWithoutThePicture(ads);
  const whole = secondsOfTheBreaks(provider);
  let item = facts.querySelector('.facts__derived');
  if (!item) facts.append(item = el('li', 'facts__derived'));
  item.replaceChildren(
    el('span', null, `${+covered.toFixed(2)}`),
    document.createTextNode(` seconds of the ${+whole.toFixed(2)} without the match on screen`)
  );
}

/**
 * Draws the three derived parts of the section, and re-reads until the signalling
 * has finished handing over its ranges.
 *
 * The re-reading is the contract's own rule and not a workaround: with `settled`
 * false the list of ranges is partial, and whoever paints re-reads. It gives up
 * after fifteen seconds rather than asking for the life of the page -- an empty
 * box is honest about a break that never resolved, and a page that keeps asking
 * for ever is not more honest than one that stopped.
 *
 * THE THREE ARE DRAWN TOGETHER AND FROM ONE WALK, which is not a saving: they are
 * three readings of the same four Ads, and drawn apart they could disagree -- a
 * gallery of four cards over a number that counted three.
 */
export function showTypes({ provider, shapes, media, facts }) {
  let left = RETRY_TIMES;
  const draw = () => {
    const ads = adsOfTheMinute(provider);
    if (ads.length) {
      shapes.replaceChildren(...ads.map((e, i) => shapeCard(e, i + 1)));
      media.replaceChildren(...mediaCards(ads));
      paintFact(facts, provider, ads);
    }
    return provider.programRanges().settled || --left <= 0;
  };
  const tick = () => {
    try {
      return draw();
    } catch (error) {
      // A section that cannot be drawn is not a reason to lose the demo: the boxes
      // stay empty, which is what they already say, and the console says why.
      console.error('[page] the shapes of the minute could not be drawn', error);
      return true;
    }
  };
  if (tick()) return;
  const timer = setInterval(() => { if (tick()) clearInterval(timer); }, RETRY_EVERY_MS);
}
