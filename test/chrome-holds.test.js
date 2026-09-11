// chrome-holds.test.js -- the test of T-06 of the phase of the multi view.
//
// What it is for: THE COUNTING, which is the one half of the mechanism that is
// not on the screen. Whether the chrome stays up with a hold taken is seen at
// once -- it is furniture over the picture, and the task measured it with a
// clock and a capture -- and this is not: how many holders there are decides
// whether the countdown may start, and a set that counts wrong looks exactly
// like a set that counts right until the second holder shows up.
//
// The failure it is aimed at is the one that costs the most and announces the
// least: a hold that is released by somebody who never took it, or twice, and
// brings the chrome down over the list the OTHER holder still has open.
//
// Same door as the other suites and the same restriction: the pure functions
// and nothing else. No DOM, no browser. The timer is not in here on purpose --
// it is `setTimeout` over a class on a layer, and a test of it would be a test
// of the browser.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import { createHolds } from '../lib/controls.js';

/** `createHolds` plus a counter of how many times the last hold went. */
function holdsWithCounter() {
  const idle = { count: 0 };
  const holds = createHolds(() => { idle.count += 1; });
  return { holds, idle };
}

test('the one that lets go first does not bring the chrome down on the other', () => {
  const { holds, idle } = holdsWithCounter();
  assert.equal(holds.held, false);

  holds.take('the list');
  holds.take('the menu');
  assert.equal(holds.held, true);

  // The whole reason this is a set and not a flag: with a flag this release is
  // the end of the countdown and the menu goes out under the hand that opened it.
  holds.release('the list');
  assert.equal(holds.held, true);
  assert.equal(idle.count, 0);

  holds.release('the menu');
  assert.equal(holds.held, false);
  assert.equal(idle.count, 1);
});

test('releasing twice is releasing once, and the countdown is armed once', () => {
  const { holds, idle } = holdsWithCounter();
  holds.take('the list');

  holds.release('the list');
  assert.equal(holds.held, false);
  assert.equal(idle.count, 1);

  // Not merely "it does not throw": a second `onIdle` would arm the countdown a
  // second time, from the wrong moment, with nothing having happened in between.
  holds.release('the list');
  assert.equal(holds.held, false);
  assert.equal(idle.count, 1);
});

test('releasing a token nobody took changes nothing', () => {
  const { holds, idle } = holdsWithCounter();
  holds.take('the list');

  // What this buys whoever closes something: `release` can be called on the way
  // out without first working out whether the hold was ever taken.
  holds.release('a token that was never taken');
  assert.equal(holds.held, true);
  assert.equal(idle.count, 0);

  holds.release('the list');
  assert.equal(idle.count, 1);
  holds.release('a token that was never taken');
  assert.equal(idle.count, 1);
});

test('the token is the holder and not a count, so taking twice is one hold', () => {
  const { holds, idle } = holdsWithCounter();
  holds.take('the list');
  holds.take('the list');

  // A list that re-takes its own hold on every keystroke is holding it once,
  // and one release is what closes it. The alternative -- counting -- would
  // leave the chrome up for good the day the takes and the releases do not
  // match, which is the leak nothing looks wrong for.
  holds.release('the list');
  assert.equal(holds.held, false);
  assert.equal(idle.count, 1);
});

test('with nobody holding, there is nothing to say', () => {
  const { holds, idle } = holdsWithCounter();
  assert.equal(holds.held, false);
  holds.release('anything');
  assert.equal(idle.count, 0);

  // And a set built without a callback is a set: the mechanism has one caller
  // today and the piece does not depend on there being one.
  const bare = createHolds();
  bare.take('the list');
  assert.equal(bare.held, true);
  bare.release('the list');
  assert.equal(bare.held, false);
});
