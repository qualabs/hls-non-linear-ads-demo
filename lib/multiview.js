// multiview.js -- the state of whoever is watching, which is the only mutable
// state this library has ever had.
//
// WHAT IT IS: A DECORATOR OVER THE PROVIDER of ADR 0003. It takes the provider
// the signalling layer builds and hands back another one with the same
// signature -- `activeAt(time)` and `programRanges()` -- so nothing downstream
// learns that it is there. Everything that is not an offer goes through
// UNTOUCHED, the same object in the same place of the list. An offer comes out
// carrying the boxes of whatever was raised, in the same `Element` shape an ad
// produces, which is why the contract does not change by a field.
//
// WHY IT IS A FILE OF ITS OWN, AND THE TWO OBVIOUS HOMES ARE BOTH WRONG
// (ADR 0072). Underneath, it would put a viewer's choices in the file that is
// defined by knowing the transport, and a choice is not transport. Above,
// it would teach the rendering side what an offer is, which is exactly what
// ADR 0003 buys by not doing. In between, both layers stay as they were and the
// day the one underneath is replaced this still holds.
//
// THE STATE, ENUMERATED, BECAUSE IT IS SHORT AND BECAUSE IT IS ALL OF IT: WHICH
// VIEWS ARE RAISED, IN WHICH ORDER THEY WERE RAISED, AND WHICH ONE IS ENLARGED.
// The order is not decoration: it is the geometry, because the shapes of
// ADR 0065 are handed out in order and the box a view lands in is the place it
// holds in this list. The audio focus is NOT in here and does not belong here:
// it is one index of the rendering side, without history, and its five ways out
// were closed by another phase (ADR 0026, 0029, 0031).
//
// EVERY OPERATION RETURNS A NEW STATE AND VALIDATES ITS RESULT, so that a state
// that cannot be drawn is not reachable through this API -- it can only be
// written by hand, which is what the tests of this module do on purpose. That
// is what gives the validation a way to fail: a check that nothing can trip is
// not a check, and a wrong state here does not look like an error, it looks
// like a box that is missing.
//
// THE PRIMARY CONTENT IS ALWAYS CHECKED AND IT IS LOCKED (ADR 0067), so it is
// not in `raised` at all: a list that cannot say "the programme is down" needs
// no rule forbidding it. What it costs is one constant, `PRIMARY_ID`, which is
// the `id` the contract gives that element and therefore the name its row in
// the selector and its box in the composition already share.
//
// Pure from end to end and with no DOM: the whole value of keeping the machine
// that decides WHAT IS DRAWN outside the drawing is that it can be aimed at
// without a browser.

// One line, like every other import of the library: the build strips them with
// a substitution over whole lines, so an import spread over several would leave
// its tail behind in the bundle (scripts/construir-libreria.sh).
import { FULL_FRAME, MAX_BOXES, isOffer, resolveElement, viewportsFor } from './signalling.js';

/**
 * What the primary content is called, in the selector and in the composition.
 * It is the `id` `resolveElement` gives it when nobody names it, so the row
 * somebody ticks and the box that moves carry the same name without anybody
 * translating one into the other.
 */
export const PRIMARY_ID = 'primaryContent';

// ---------------------------------------------------------------------------
// The state, and what makes one legal.
//
// `{ offer, raised, enlarged }`: the offer this selection belongs to, the ids
// of the views that are up in the order they went up, and the id of the box at
// full frame, or `null`.
//
// The offer is IN the state and not beside it because three of the five rules
// below are about the catalogue -- an id that is not in it, the cap counted
// against it, a row read off it -- and a validation that has to be handed its
// context separately is one call away from being run without it.
// ---------------------------------------------------------------------------

/**
 * Every rule a selection has to hold, in one place, thrown and not warned: the
 * caller of an operation here is this library's own chrome and not a payload
 * somebody else wrote, so a refusal is a defect of the caller and the console
 * is where defects go to be ignored.
 */
export function validate(state) {
  if (!state || typeof state !== 'object') {
    throw new Error('multiview: a selection has to be an object');
  }
  const { offer, raised, enlarged } = state;
  if (!isOffer(offer)) {
    throw new Error('multiview: a selection belongs to an offer, and this one announces no views');
  }
  if (!Array.isArray(raised)) {
    throw new Error(`multiview: raised has to be a list of view ids, got ${JSON.stringify(raised)}`);
  }
  const catalogue = new Set(offer.views.map((view) => view.id));
  for (const id of raised) {
    if (!catalogue.has(id)) {
      throw new Error(`multiview: ${JSON.stringify(id)} is not a view of this offer, so it is a` +
        ' box with nothing to put in it');
    }
  }
  if (new Set(raised).size !== raised.length) {
    throw new Error(`multiview: a view cannot be raised twice (${raised.join(', ')})`);
  }
  // The programme is one of the boxes, so the cap is counted with it. It is of
  // the SCREEN and never of the offer (ADR 0066): a catalogue is as long as
  // whoever published it wants, and what is capped is how much of it is up at
  // once.
  const boxes = raised.length + 1;
  if (boxes > MAX_BOXES) {
    throw new Error(`multiview: ${boxes} boxes, and the screen holds ${MAX_BOXES} (ADR 0066):` +
      ' the way past a full grid is to lower one and raise the other');
  }
  if (enlarged != null) {
    if (!raised.length) {
      throw new Error('multiview: nothing is enlarged while there is no composition, because one' +
        ' box at full frame is the programme as it was');
    }
    if (enlarged !== PRIMARY_ID && !raised.includes(enlarged)) {
      throw new Error(`multiview: ${JSON.stringify(enlarged)} is enlarged and is not on the grid`);
    }
  }
  return state;
}

/**
 * Frozen, and the array with it: what comes out of an operation here is handed
 * to the chrome, and a chrome that sorted the list it was given would be
 * re-composing somebody else's screen without saying so.
 */
function make(offer, raised, enlarged) {
  return validate(Object.freeze({
    offer,
    raised: Object.freeze(raised.slice()),
    enlarged: enlarged ?? null
  }));
}

/** A selection written out in full, which is what a test hand-writes. */
export function selection(offer, raised = [], enlarged = null) {
  return make(offer, raised, enlarged);
}

/**
 * The state a window opens in: the offer is on and nothing has been raised, so
 * there is one box, which is no composition at all and therefore the programme
 * exactly as it was (ADR 0065).
 */
export function emptySelection(offer) {
  return make(offer, [], null);
}

// ---------------------------------------------------------------------------
// The operations. Each one returns a new state; none of them mutates.
// ---------------------------------------------------------------------------

/**
 * One view goes up, at the end, because the end is where the last box is and
 * the order of this list is the order of the boxes.
 *
 * The full grid is refused HERE and not counted here: `make` validates, so the
 * cap is stated once, in `validate`, and every road into a fifth box hits the
 * same sentence.
 */
export function raise(state, id) {
  validate(state);
  if (id === PRIMARY_ID) {
    throw new Error('multiview: the programme is always on the grid (ADR 0067)');
  }
  if (state.raised.includes(id)) {
    throw new Error(`multiview: ${JSON.stringify(id)} is already up`);
  }
  return make(state.offer, state.raised.concat([id]), state.enlarged);
}

/**
 * One view comes down, and the enlargement comes down with it if it was the one
 * that was enlarged: the alternative is a state pointing at a box that is not
 * on the screen, which is the shape of every bug this module exists to make
 * unreachable.
 *
 * Lowering the LAST one is not a special case and that is the whole design: it
 * leaves one box, which is no composition, which is `clear()` on the other side
 * of the contract -- the same event the button of the way out fires and the
 * same one that ends an ad (ADR 0071).
 */
export function lower(state, id) {
  validate(state);
  if (id === PRIMARY_ID) {
    throw new Error('multiview: the programme cannot be taken off the grid (ADR 0067): it carries' +
      ' the clock everything else is placed against, so lowering it would be leaving it playing' +
      ' and invisible');
  }
  if (!state.raised.includes(id)) {
    throw new Error(`multiview: ${JSON.stringify(id)} is not up`);
  }
  const raised = state.raised.filter((view) => view !== id);
  const enlarged = state.enlarged === id || !raised.length ? null : state.enlarged;
  return make(state.offer, raised, enlarged);
}

/**
 * The one gesture of the selector, which is a list of tick boxes and not a menu
 * of things to add: the same row puts a view up and takes it down, and the row
 * of the programme refuses both with the sentence that says why.
 */
export function toggle(state, id) {
  validate(state);
  return state.raised.includes(id) ? lower(state, id) : raise(state, id);
}

/**
 * One box to full frame, above everything else. What this does NOT do is touch
 * the audio, and that is not an omission: enlarging is full focus (ADR 0069),
 * and focus is one call to the single door the rendering side keeps for it. Two
 * sides of one gesture, each done where it lives.
 *
 * The programme can be the enlarged one for the same reason it is a row of the
 * selector: it is a box of the composition like the others. What decides
 * whether a button is drawn on it is the chrome and not this.
 */
export function enlarge(state, id) {
  validate(state);
  if (!state.raised.length) {
    throw new Error('multiview: there is no composition, so there is no box to enlarge');
  }
  if (id !== PRIMARY_ID && !state.raised.includes(id)) {
    throw new Error(`multiview: ${JSON.stringify(id)} is not on the grid, so it cannot be enlarged`);
  }
  return make(state.offer, state.raised, id);
}

/**
 * Back to the grid, and the audio stays where it is (ADR 0069): the box that
 * was big goes back to its place still sounding, with its ring on, because the
 * audio follows the content and not the position. Letting it go would be a
 * sixth way out of a focus that another phase closed with five.
 */
export function shrink(state) {
  validate(state);
  return make(state.offer, state.raised, null);
}

/**
 * The way out, which is everything down: one box, no composition, `clear()`.
 * It is the SAME implementation the last view coming down reaches, which is the
 * point of ADR 0071 -- two entrances and one door, because two doors are two
 * things that can differ and the one that differs shows up on camera.
 */
export function exit(state) {
  validate(state);
  return emptySelection(state.offer);
}

// ---------------------------------------------------------------------------
// What the state is read as: the rows of the selector, the boxes the chrome
// hangs a button on, and the elements of the contract.
// ---------------------------------------------------------------------------

/**
 * One row per view of the offer, with the programme first, and the three flags
 * a row is drawn by.
 *
 * `locked` is the programme and only the programme. `disabled` is the cap of
 * ADR 0066 seen from a row: with the grid full, what is NOT up cannot go up,
 * and the way forward is to lower one first. It is off on a row that is already
 * ticked, because a full grid has to stay untickable and never unremovable.
 *
 * The line that says WHY a row is disabled belongs to the chrome: this library
 * ships the state of a row and not its wording.
 */
export function rowsOf(state) {
  validate(state);
  const full = state.raised.length + 1 >= MAX_BOXES;
  return [
    { id: PRIMARY_ID, name: state.offer.primaryName, checked: true, locked: true, disabled: false },
    ...state.offer.views.map((view) => {
      const checked = state.raised.includes(view.id);
      return { id: view.id, name: view.name, checked, locked: false, disabled: !checked && full };
    })
  ];
}

/**
 * THE COMPOSITION, as `Element[]` of the contract with their boxes already
 * resolved, which is the one thing this module exists to produce.
 *
 * The count includes the programme, the shapes come from the table of ADR 0065
 * with the count already in hand, and the programme is always the first box.
 * N=1 IS THE EMPTY LIST and it is not a case handled here: `viewportsFor`
 * answers it, and what an empty list of elements means on the other side is
 * "nothing is composed", which is the programme as it was.
 *
 * `resolveElement` and not a literal, so that the two defaults the tool omits
 * (ADR 0014) are applied in the one place that owns them: the programme comes
 * out at 100 and a view at 0, which is the opening mix of an offer said in the
 * contract's own terms -- the programme keeps sounding until a gesture moves
 * the focus.
 *
 * THE ONE TRANSLATION IS `type`, and it is worth naming because it is silent
 * when it is wrong: a view was already read off the payload and carries the
 * contract's name for the field, `mediaType`, while `resolveElement` reads the
 * name the PAYLOAD uses, `type`. Dropping it costs an element its MIME, which
 * is what decides how the asset is put in the box, and nothing on a screen says
 * so -- so it is asserted.
 */
export function elementsOf(state) {
  validate(state);
  const count = state.raised.length + 1;
  const viewports = viewportsFor(count);
  if (!viewports.length) return [];
  const byId = new Map(state.offer.views.map((view) => [view.id, view]));
  const elements = [
    resolveElement({ id: PRIMARY_ID, viewport: viewports[0], zDepth: 0 }, true),
    ...state.raised.map((id, i) => {
      const view = byId.get(id);
      return resolveElement(
        { id: view.id, uri: view.uri, type: view.mediaType, viewport: viewports[i + 1], zDepth: i + 1 },
        false
      );
    })
  ];
  if (state.enlarged == null) return elements;
  // Out of its slot and onto the end, at full frame and above everything: the
  // others stay exactly where they are, playing, covered (ADR 0069). Moving it
  // to the end is what keeps the list ascending by `zDepth`, which is rule 2 of
  // the contract and what the rendering side draws in.
  const enlarged = elements.find((element) => element.id === state.enlarged);
  return elements
    .filter((element) => element !== enlarged)
    .concat([{ ...enlarged, box: { ...FULL_FRAME }, zDepth: count }]);
}

/**
 * THE BOXES SOMETHING CAN BE HUNG ON, which is the composition read by the one
 * side that puts furniture OVER a box instead of a picture IN it: `elementsOf`
 * answers what is drawn, and this answers what a button of the chrome is drawn
 * on top of. Same state, same order, one field more -- the `name`, because the
 * label of a control is read by somebody and an `id` is not a name (ADR 0064).
 *
 * WITH SOMETHING ENLARGED IT IS ONE BOX AND NOT N, and that is the whole of the
 * decision this function carries. The other boxes are still there and still
 * playing -- that is what makes going back instant (ADR 0069) -- but they are
 * COVERED, and a button over a picture nobody can see is a control pointing at
 * nothing. What is on the screen while one box is at full frame is that box,
 * so what the chrome can hang a button on is that box: one way out, which is
 * the one Nicolás asked for in the same sentence as the way in.
 *
 * It is decided HERE and not in the chrome for the reason `rowsOf` is: the
 * chrome that worked out for itself which boxes are covered would be the second
 * place that knows what `enlarged` means, and the two would differ on the day
 * one of them changed.
 *
 * N=1 IS THE EMPTY LIST, inherited from `elementsOf` and not re-decided: one box
 * is no composition, so there is nothing to enlarge and nothing to draw on.
 */
export function boxesOf(state) {
  const elements = elementsOf(state);
  if (!elements.length) return [];
  const names = new Map(state.offer.views.map((view) => [view.id, view.name]));
  names.set(PRIMARY_ID, state.offer.primaryName);
  const enlarged = state.enlarged != null;
  // `elementsOf` puts the enlarged one LAST, at full frame and on top, so the
  // box the chrome draws on is read off the list rather than looked up by id:
  // the one thing that is on screen is the last one, whatever it is called.
  const drawn = enlarged ? [elements[elements.length - 1]] : elements;
  return drawn.map((element) => ({
    id: element.id,
    name: names.get(element.id) ?? element.id,
    box: element.box,
    enlarged
  }));
}

// ---------------------------------------------------------------------------
// The decorator.
// ---------------------------------------------------------------------------

/**
 * The provider of ADR 0003 with the state of whoever is watching wrapped around
 * it. What comes back has two halves: the provider's own surface, which is the
 * one the rendering side reads and is unchanged, and the handle the chrome
 * drives the selector with.
 *
 * A SELECTION BELONGS TO AN OFFER AND IS KEPT BY ITS `itemId`, and that is not
 * bookkeeping, it is the one thing that makes this safe to call in a frame
 * loop. `activeAt` is asked TWICE per frame and at TWO DIFFERENT TIMES: once
 * for now, and once for three seconds ahead, which is how the rendering side
 * brings the next ad in before its turn. A module that adopted "the offer" from
 * whatever it was last asked about would drop a viewer's selection three
 * seconds before his window ended, on a call that is not even about him. Keyed
 * by `itemId` there is no "current" to get wrong: every call composes the
 * window it was asked about, out of that window's own selection.
 *
 * The handle's operations take the OFFER a gesture was made on, not a state and
 * not a time. The chrome drew those rows off an offer it had in its hand, so
 * that is the thing it still has when somebody taps one; and a tap that lands
 * after the window closed applies to a window nobody is drawing, which is the
 * harmless end of that race and the only one worth having.
 */
export function createMultiview(provider) {
  /** `itemId` -> the selection for that window. Absent means nothing raised. */
  const selections = new Map();
  /** `itemId` -> the last experience composed for it, and what composed it. */
  const composed = new Map();

  function keyOf(offer) {
    if (!isOffer(offer)) {
      throw new Error('multiview: this is not an offer, so it has no selection');
    }
    if (offer.itemId == null) {
      throw new Error('multiview: an offer with no itemId cannot be told from another one');
    }
    return offer.itemId;
  }

  function selectionFor(offer) {
    return selections.get(keyOf(offer)) ?? emptySelection(offer);
  }

  function operate(offer, operation) {
    const next = operation(selectionFor(offer));
    selections.set(keyOf(offer), next);
    return next;
  }

  /**
   * One offer with its boxes. With nothing raised the experience is handed back
   * UNTOUCHED -- the same object, with the empty `elements` the layer
   * underneath already produced -- which is both the honest answer and the one
   * that allocates nothing on a frame where nobody chose anything.
   *
   * The memo is the contract's promise kept: `activeAt` hands back the same
   * objects while the experience is still active, so the composition is built
   * when the selection changes and not once per frame.
   */
  function compose(experience) {
    const state = selections.get(experience.itemId);
    if (!state || !state.raised.length) return experience;
    const cached = composed.get(experience.itemId);
    if (cached && cached.state === state && cached.source === experience) return cached.experience;
    const next = { ...experience, elements: elementsOf(state) };
    composed.set(experience.itemId, { state, source: experience, experience: next });
    return next;
  }

  return {
    // --- the provider of ADR 0003, unchanged in signature and in meaning -----
    activeAt: (time) => provider.activeAt(time).map((e) => (isOffer(e) ? compose(e) : e)),
    programRanges: () => provider.programRanges(),
    get experiences() { return provider.experiences; },

    // --- the handle the selector is driven by -------------------------------
    /** The offer active at `time`, or `null`: whether there is anything to offer. */
    offerAt: (time) => provider.activeAt(time).find(isOffer) ?? null,
    selectionFor,
    rows: (offer) => rowsOf(selectionFor(offer)),
    boxes: (offer) => boxesOf(selectionFor(offer)),
    toggle: (offer, id) => operate(offer, (state) => toggle(state, id)),
    raise: (offer, id) => operate(offer, (state) => raise(state, id)),
    lower: (offer, id) => operate(offer, (state) => lower(state, id)),
    enlarge: (offer, id) => operate(offer, (state) => enlarge(state, id)),
    shrink: (offer) => operate(offer, shrink),
    exit: (offer) => operate(offer, exit)
  };
}
