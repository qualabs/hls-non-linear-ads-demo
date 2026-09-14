// recorrido.js -- the two things this page reads off the playhead: the line under the
// picture that says what is on screen right now, and the window of the run.
//
// THE LINE IS THE CONTRACT AT THE PLAYHEAD, PLUS THE ONE READING THE CONTRACT CANNOT MAKE.
// Its left half is `activeAt(currentTime)`: whether the window is open, how many boxes it
// resolved, and whether one of them is at full frame. Its right half is the DOM -- how many
// <video> elements are inside the container the library was handed, and how many of them
// have data and are not paused -- and it is there because that is the one claim this demo
// has no other way to support: that a programme and three on-board cameras on screen are
// four decoders and not one picture composed in a gallery somewhere and shipped as a single
// stream. Anybody can check it, on the page, without opening a console.
//
// IT IS WORD FOR WORD THE LINE THE PREVIOUS TASK VERIFIED WITH, and that is the reason it
// was not tidied up on the way in: the captures of that task read `t=28.0s`, `1 feed(s)` and
// `nothing raised`, so a line reworded here would make those captures unreadable against
// this page.
//
// THE WINDOW IS NOT A TABLE SOMEBODY TYPED. Every row is a range of `programRanges()` and
// every name in it is a row of the selector, so the day a camera is added to the catalogue
// -- which in this demo is the day its footage is packaged -- the row grows a name and
// nobody edits this file.
//
// WHAT IS NOT READ, said out loud because it is the one thing here that can go stale: the
// sentences that describe the gestures -- open the list, tick a camera, enlarge it, leave.
// Those are about the chrome the library draws, and the contract carries no description of a
// button, so they are prose. They are kept behavioural rather than pictorial for that
// reason: what a control DOES survives a change of icon.

import { el, namesOf, secs } from './dom.js';

/** The half-open window of a range, as the two seconds a reader can watch for. */
const windowOf = (range) => `${secs(range.startTime)} – ${secs(range.startTime + range.duration)}`;

/** Whether an experience is an offer, by the one field an offer has and an ad has not. */
const isOffer = (experience) => Array.isArray(experience?.views);

/**
 * What is on screen, in the contract's own terms. An offer with nothing raised is a window
 * that is OPEN and composing nothing, which is a different state from no window at all and
 * is the state this demo spends most of its time in: the commentators have said the cameras
 * are there and nobody has raised one yet.
 */
function onScreen(active, names) {
  if (!active.length) return 'the programme, nothing signalled';
  return active
    .map((experience) => {
      if (!isOffer(experience)) return `ad on screen: ${experience.type}`;
      if (!experience.elements.length) {
        return `multi view offered · ${experience.views.length} feed(s) · nothing raised`;
      }
      // `elements` arrives ascending by `zDepth`, so the last one is the one on top: with a
      // composition of more than one box, a top element whose four insets are all zero is
      // covering everything under it. It is deliberately not asked "is this the enlarged
      // one": what the line reports is the screen.
      const top = experience.elements[experience.elements.length - 1];
      const full = Object.values(top.box).every((inset) => inset === 0)
        ? ` · ${names.get(top.id) ?? top.id} at full frame`
        : '';
      return `multi view · ${experience.elements.length} boxes${full}`;
    })
    .join('  |  ');
}

/**
 * The decoders, off the DOM of the container and nothing else.
 *
 * `readyState >= 2` is HAVE_CURRENT_DATA, which is the honest floor for "this element has a
 * picture in it": a grid that has just been composed has cameras that are still buffering,
 * and calling those decoding would be the page flattering itself.
 */
function decoders(container) {
  const nodes = [...container.querySelectorAll('video')];
  const playing = nodes.filter((n) => n.readyState >= 2 && !n.paused && !n.ended);
  return `${nodes.length} video element${nodes.length === 1 ? '' : 's'} in the player, ` +
    `${playing.length} decoding`;
}

/**
 * One row of the run: when the window is, what class it is, and what it offers.
 *
 * THE CAMERAS ARE LISTED BY NAME AND THE COUNT IS COUNTED, because that is the rule this
 * demo exists to make visible: a list somebody chooses from cannot be a list of identifiers.
 * A viewer looks for a driver, not for `view-caldrix`.
 *
 * AND THE CAP OF THE GRID IS DESCRIBED WITHOUT ITS NUMBER, which is not coyness. The cap is
 * the library's and the library does not publish it, so a number typed here would be this
 * page asserting something it did not read. What the reader gets instead is what happens --
 * the rows that are not up go grey and the bar says why -- and the bar says it with the real
 * number, because the library interpolates it from its own table.
 */
function rowOf(range, experience) {
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
      'asset-list, so there is nothing to choose.'));
  } else {
    const count = experience.views.length;
    what.append(el('p', null,
      `A catalogue of ${count} camera${count === 1 ? '' : 's'}, and the race carries on ` +
      'underneath it. Open the list in the bar and tick a driver: the grid takes its shape ' +
      'from how many are up, and the world feed is one of them and not a backdrop. Enlarge ' +
      'a box and you are inside that car, because the sound goes with the picture.'));
    const names = el('ul', 'run__names');
    for (const view of experience.views) names.append(el('li', null, view.name));
    what.append(names);
    what.append(el('p', 'run__more',
      'When the grid is full the rows that are not up go grey, with a line in the bar ' +
      'saying why: the way past a full grid is to lower one and raise the other, which is ' +
      'two taps and neither of them a surprise. Leaving is one tap and the race never ' +
      'stopped to let you do any of it.'));
  }
  node.append(what);
  return node;
}

/**
 * Draw the line and the window, and keep the line current.
 *
 * @param provider   the contract, decorated: `activeAt`, `programRanges`, `experiences`, and
 *                   `rows(offer)` for the names.
 * @param container  the box the library was handed. The decoders are counted in it, which is
 *                   why it is the container and not the layer: the world feed is one of the
 *                   boxes and it lives beside the layer, not inside it.
 */
export function showTheRun({ provider, container, video, state, run }) {
  let drawnKey = null;

  function drawRun() {
    const { ranges } = provider.programRanges();
    // Rebuilt only when the set of ranges changes. They arrive as the asset-list resolves,
    // so the row appears during the first seconds and then stops; comparing the key is what
    // keeps this out of the frame loop's way.
    const key = ranges.map((range) => range.id).join('|');
    if (key === drawnKey) return ranges;
    drawnKey = key;
    const byId = new Map(provider.experiences.map((experience) => [experience.id, experience]));
    run.replaceChildren(...ranges.map((range) => rowOf(range, byId.get(range.id))));
    return ranges;
  }

  function paint() {
    const time = video.currentTime || 0;
    const active = provider.activeAt(time) ?? [];
    const offer = provider.offerAt(time);
    const names = namesOf(offer ? provider.rows(offer) : []);
    state.textContent =
      `t=${time.toFixed(1)}s  ·  ${onScreen(active, names)}  ·  ${decoders(container)}`;
    const ranges = drawRun();
    for (const row of run.children) {
      const range = ranges.find((r) => r.id === row.dataset.id);
      row.classList.toggle('run__row--open',
        !!range && time >= range.startTime && time < range.startTime + range.duration);
      row.classList.toggle('run__row--past', !!range && time >= range.startTime + range.duration);
    }
    requestAnimationFrame(paint);
  }

  // A FRAME LOOP AND NOT `timeupdate`, and the reason is the half of the line that is not
  // about time: a viewer ticks two cameras inside one of the quarter seconds `timeupdate`
  // fires at, and a line that lagged behind the picture by a beat would be read as the
  // picture being wrong.
  requestAnimationFrame(paint);
}
