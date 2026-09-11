// views-selector.test.js -- the test of T-07 of phase 11, and it is a small
// file on purpose.
//
// The selector is a list of tick boxes in the chrome, and almost everything
// about it is on the screen: whether it is pretty, whether it opens where it
// should, whether a row is legible from across a room. That is verified with
// captures and by looking at it, which is what the task asks for.
//
// WHAT IS NOT ON THE SCREEN IS THE ONE DECISION THE CHROME ADDS: the line at
// the foot that says WHY some rows are grey. The rows themselves are the
// state's answer (`rowsOf`, tested with the rest of that module), and this file
// exists to keep it that way -- the failure it is aimed at is the chrome
// working the cap out again, by counting ticks instead of reading the flag it
// was handed. That one is invisible: a list that counts to four on its own
// looks exactly right until the day the cap is not four.
//
// The other half of it is the sentence being there only when there is
// something to explain. An offer whose catalogue is no longer than the grid can
// be entirely on the screen, and a line telling that viewer to lower one to
// raise another would be advice about a situation he is not in.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { MAX_BOXES, resolveAssetList } from '../lib/signalling.js';
import { emptySelection, raise, rowsOf } from '../lib/multiview.js';
import { FULL_GRID_NOTE, selectorNote } from '../lib/controls.js';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

/** The offer as it is served: three views, which with the programme is a full grid. */
function offer() {
  const list = readJson('./fixtures/asset-lists/asset-list-offer-3.json');
  return resolveAssetList(list, { id: 'MV-1-OFFER', slotStart: 45 })[0];
}

/**
 * A catalogue LONGER THAN THE GRID, which is the normal case (ADR 0066): built
 * out of the real one by repeating its views under ids of their own, because
 * what this exercises is the length of the list and not what is in a row.
 */
function longOffer() {
  const list = readJson('./fixtures/asset-lists/asset-list-offer-3.json');
  const item = list.ASSETS[0]['X-AD-CREATIVE-SIGNALING'].payload[0];
  item.views = item.views.concat(item.views.map((view, i) => ({
    ...view, id: `${view.id}-again-${i}`, name: `${view.name} (again)`
  })));
  return resolveAssetList(list, { id: 'MV-1-OFFER', slotStart: 45 })[0];
}

const idsOf = (o) => o.views.map((view) => view.id);

test('with room on the grid the list says nothing, because there is nothing to explain', () => {
  const o = longOffer();
  const rows = rowsOf(raise(emptySelection(o), idsOf(o)[0]));
  assert.ok(rows.some((row) => !row.checked), 'the case needs rows that are not up');
  assert.ok(rows.every((row) => !row.disabled));
  assert.equal(selectorNote(rows), null);
});

test('with the grid full the line is there, and it names the cap of the screen', () => {
  const o = longOffer();
  const ids = idsOf(o);
  const full = ids.slice(0, MAX_BOXES - 1).reduce(raise, emptySelection(o));
  const rows = rowsOf(full);
  assert.ok(rows.some((row) => row.disabled), 'the case needs rows the state greyed');

  const note = selectorNote(rows);
  assert.equal(note, FULL_GRID_NOTE);
  // The number in the sentence is the number the grid is capped at, and it gets
  // there by being interpolated: a line that said "four" while the table held
  // five shapes would be the chrome contradicting the rule on the same screen.
  assert.ok(note.includes(String(MAX_BOXES)), note);
});

test('a full grid with nothing left to raise says nothing either', () => {
  // The catalogue is exactly as long as the grid, so everything the offer
  // announces is on the screen at once. The grid is full and NO row is greyed,
  // which is the state that tells a line counting ticks apart from a line
  // reading the flag.
  const o = offer();
  const rows = rowsOf(idsOf(o).reduce(raise, emptySelection(o)));
  assert.equal(rows.length, MAX_BOXES);
  assert.ok(rows.every((row) => row.checked));
  assert.equal(selectorNote(rows), null);
});

test('the line is decided by the flag the state ships and not by counting ticks', () => {
  // Hand-written rows, which is the control: they are not a state anybody could
  // reach, and the sentence has to follow the flag anyway. A chrome that worked
  // the cap out for itself would answer both of these the other way round.
  assert.equal(selectorNote([{ checked: true, disabled: false }]), null);
  assert.equal(selectorNote([{ checked: false, disabled: true }]), FULL_GRID_NOTE);
  assert.equal(selectorNote([]), null);
});
