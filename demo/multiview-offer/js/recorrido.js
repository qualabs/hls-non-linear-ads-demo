// recorrido.js -- the two things under the picture: the line that says what is
// on screen right now, and the map of the run.
//
// THE LINE IS THE CONTRACT AT THE PLAYHEAD, PLUS THE ONE READING THE CONTRACT
// CANNOT MAKE. Its left half is `activeAt(currentTime)`: which window is open,
// how many boxes it resolved, and whether one of them is at full frame. Its
// right half is the DOM -- how many <video> elements are inside the container
// the library was handed, and how many of them have data and are not paused --
// and it is there because that is the one claim of this demo the contract has no
// way to support: that a grid of four is FOUR DECODERS and not one picture that
// was composed somewhere else and shipped as a single stream. Anybody can check
// it, on the page, without opening a console.
//
// THE MAP IS NOT A TABLE SOMEBODY TYPED. Every row is a range of
// `programRanges()`, and what each row SAYS is chosen by what that window
// announces and not by where it sits in the list: an ad has boxes and a
// catalogue has names, and asking the contract which one it is holds the day a
// break is moved, added or taken out of the signalling script.
//
// WHAT IS NOT READ, said out loud because it is the one thing here that can go
// stale: the sentences that describe the gestures -- open the list, tick a row,
// enlarge a box, leave. Those are about the chrome the library draws and the
// contract carries no description of a button, so they are prose. They are kept
// behavioural rather than pictorial for that reason: what a control DOES
// survives a change of icon.

import { el, namesOf, secs } from './dom.js';

/** The half-open window of a range, as the two seconds a reader can watch for. */
const windowOf = (range) => `${secs(range.startTime)} – ${secs(range.startTime + range.duration)}`;

/**
 * Whether one box is at full frame over the others, read off the boxes and not
 * off a flag. `elements` arrives ascending by `zDepth`, so the last one is the
 * one on top: with a composition of more than one box, a top element whose four
 * insets are all zero is covering everything under it.
 *
 * It is deliberately not asked "is this the enlarged one": a linear ad at full
 * frame would answer the same way and would be described the same way, which is
 * correct -- what the line reports is the screen.
 */
function coveringBox(experience) {
  const elements = experience.elements || [];
  if (elements.length < 2) return null;
  const top = elements[elements.length - 1];
  return Object.values(top.box).every((inset) => inset === 0) ? top : null;
}

/** Whether an experience is an offer, by the one field an offer has and an ad has not. */
const isOffer = (experience) => Array.isArray(experience?.views);

/**
 * What is on screen, in the contract's own terms. An offer with nothing raised
 * is a window that is OPEN and composing nothing, which is a different state
 * from no window at all and is the state this demo spends most of its time in.
 */
function onScreen(active, names) {
  if (!active.length) return 'the programme, nothing signalled';
  return active
    .map((experience) => {
      const covering = coveringBox(experience);
      const full = covering ? ` · ${names.get(covering.id) ?? covering.id} at full frame` : '';
      if (!isOffer(experience)) {
        const assets = experience.elements.filter((element) => !element.primary).length;
        return `ad on screen: ${experience.type}, ${assets} element(s)${full}`;
      }
      if (!experience.elements.length) {
        return `multi view offered · ${experience.views.length} feeds · nothing raised`;
      }
      return `multi view · ${experience.elements.length} boxes${full}`;
    })
    .join('  |  ');
}

/**
 * The decoders, off the DOM of the container and nothing else.
 *
 * `readyState >= 2` is HAVE_CURRENT_DATA, which is the honest floor for "this
 * element has a picture in it": a grid that has just been composed has feeds
 * that are still buffering, and calling those decoding would be the page
 * flattering itself.
 */
function decoders(container) {
  const nodes = [...container.querySelectorAll('video')];
  const playing = nodes.filter((node) => node.readyState >= 2 && !node.paused && !node.ended);
  return `${nodes.length} video element${nodes.length === 1 ? '' : 's'} in the player, ` +
    `${playing.length} decoding`;
}

/**
 * One row of the map. The copy is chosen by what the window announces:
 *
 *   an ad          the boxes came declared, so there is nothing for a viewer to
 *                  do and the row says so instead of inventing a gesture.
 *   a catalogue    the feeds are named, so the row lists them -- which is the
 *                  rule this demo exists to make visible: a list is read by the
 *                  name of its content and never by the number of a camera.
 *
 * THE LONGEST CATALOGUE OF THE RUN CARRIES ONE LINE MORE, and it is marked by
 * comparing it against the other offers of this same playlist rather than by its
 * position: the window that offers more than any other is the one where a viewer
 * meets a full grid, and meeting it is the reason that window is in the run.
 */
function rowOf(range, experience, longest) {
  const node = el('li', 'run__row');
  node.dataset.id = range.id;
  node.append(
    el('span', 'run__when', windowOf(range)),
    el('span', 'run__kind', range.kind)
  );
  const what = el('div', 'run__what');
  if (!isOffer(experience)) {
    what.append(el('p', null,
      'An ad, composed by whoever published it: the boxes arrived declared in the ' +
      'asset-list, so there is nothing to choose. It is here to show that the class that ' +
      'already works goes on working in a playlist that also carries the other one.'));
  } else {
    what.append(el('p', null,
      'A catalogue. Open the list of feeds in the bar and tick them one at a time: the ' +
      'grid takes its shape from how many are up, and the programme is one of them.'));
    const names = el('ul', 'run__names');
    for (const view of experience.views) names.append(el('li', null, view.name));
    what.append(names);
    if (longest) {
      what.append(el('p', 'run__more',
        'More feeds on offer here than in any other window of this run. Fill the grid and ' +
        'the rest of the rows go grey: the way past a full grid is to lower one and raise ' +
        'the other, which is two taps and neither of them a surprise.'));
    }
  }
  node.append(what);
  return node;
}

/**
 * Draw the line and the map, and keep the line current.
 *
 * @param provider   the contract, decorated: `activeAt`, `programRanges`,
 *                   `experiences`, and `rows(offer)` for the names.
 * @param container  the box the library was handed. The decoders are counted in
 *                   it, which is why it is the container and not the layer: the
 *                   programme is one of the boxes and it lives beside the layer,
 *                   not inside it.
 */
export function showTheRun({ provider, container, video, state, run }) {
  let drawnKey = null;

  function drawMap() {
    const { ranges } = provider.programRanges();
    // Rebuilt only when the set of ranges changes. They arrive as each
    // asset-list resolves, so the map grows during the first seconds and then
    // stops; comparing the key is what keeps this out of the frame loop's way.
    const key = ranges.map((range) => range.id).join('|');
    if (key === drawnKey) return ranges;
    drawnKey = key;
    const byId = new Map(provider.experiences.map((experience) => [experience.id, experience]));
    const offers = ranges
      .map((range) => byId.get(range.id))
      .filter(isOffer);
    const most = Math.max(0, ...offers.map((offer) => offer.views.length));
    const uncontested = offers.filter((offer) => offer.views.length === most).length === 1;
    run.replaceChildren(...ranges.map((range) => {
      const experience = byId.get(range.id);
      return rowOf(range, experience, uncontested && experience?.views?.length === most);
    }));
    return ranges;
  }

  function paint() {
    const time = video.currentTime;
    const active = provider.activeAt(time);
    const offer = provider.offerAt(time);
    const names = offer ? namesOf(provider.rows(offer)) : new Map();
    state.textContent = `${secs(time)} · ${onScreen(active, names)} · ${decoders(container)}`;
    const ranges = drawMap();
    for (const row of run.children) {
      const range = ranges.find((r) => r.id === row.dataset.id);
      row.classList.toggle('run__row--open',
        !!range && time >= range.startTime && time < range.startTime + range.duration);
      row.classList.toggle('run__row--past', !!range && time >= range.startTime + range.duration);
    }
    requestAnimationFrame(paint);
  }

  // A FRAME LOOP AND NOT `timeupdate`, and the reason is the half of the line
  // that is not about time: a viewer ticks two rows inside one of the quarter
  // seconds `timeupdate` fires at, and a line that lagged behind the picture by
  // a beat would be read as the picture being wrong.
  requestAnimationFrame(paint);
}
