// date-range-marks.test.js -- the arithmetic of demo/shared/js/date-range-marks.js:
// the breaks a page reads off the Date Ranges hls.js parsed, and where they sit on
// its bar (ADR 0101).
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import { barFractions, breaksOfDateRanges } from '../js/date-range-marks.js';

const CONCURRENT = 'com.qualabs.hls.concurrentInterstitial';
const MULTIVIEW = 'com.qualabs.hls.multiViewInterstitial';

/** The shape of an hls.js DateRange, as far as the helper reads it. */
const dr = (fields) => ({ class: CONCURRENT, plannedDuration: null, duration: null, ...fields });

test('a break is placed off startTime and PLANNED-DURATION, sorted by time', () => {
  const breaks = breaksOfDateRanges({
    B: dr({ startTime: 45, plannedDuration: 30, class: MULTIVIEW }),
    A: dr({ startTime: 20, plannedDuration: 12 })
  });
  assert.deepEqual(breaks, [
    { id: 'A', class: CONCURRENT, startTime: 20, duration: 12 },
    { id: 'B', class: MULTIVIEW, startTime: 45, duration: 30 }
  ]);
});

test('PLANNED-DURATION wins over DURATION, and DURATION is the fallback', () => {
  const [both] = breaksOfDateRanges({ A: dr({ startTime: 10, plannedDuration: 8, duration: 9 }) });
  assert.equal(both.duration, 8);
  const [only] = breaksOfDateRanges({ A: dr({ startTime: 10, duration: 9 }) });
  assert.equal(only.duration, 9);
});

test('a Date Range with no start or no length is not placed', () => {
  assert.deepEqual(breaksOfDateRanges({
    noAnchor: dr({ startTime: NaN, plannedDuration: 6 }),
    noLength: dr({ startTime: 6 }),
    zero: dr({ startTime: 6, plannedDuration: 0 })
  }), []);
  assert.deepEqual(breaksOfDateRanges(undefined), []);
});

test('only the classes asked for are kept', () => {
  const breaks = breaksOfDateRanges({
    A: dr({ startTime: 6, plannedDuration: 6 }),
    APPLE: dr({ startTime: 6, plannedDuration: 6, class: 'com.apple.hls.interstitial' })
  }, { classes: [CONCURRENT, MULTIVIEW] });
  assert.deepEqual(breaks.map((b) => b.id), ['A']);
});

test('fractions of the bar, clipped to it, and nothing without a length', () => {
  const breaks = [
    { id: 'A', class: CONCURRENT, startTime: 20, duration: 12 },
    { id: 'END', class: CONCURRENT, startTime: 190, duration: 20 },
    { id: 'PAST', class: CONCURRENT, startTime: 250, duration: 5 }
  ];
  const spans = barFractions(breaks, 200);
  assert.deepEqual(spans.map((s) => s.id), ['A', 'END']);
  assert.equal(spans[0].left, 0.1);
  assert.ok(Math.abs(spans[0].width - 0.06) < 1e-12);
  assert.equal(spans[1].left + spans[1].width, 1);
  assert.deepEqual(barFractions(breaks, 0), []);
  assert.deepEqual(barFractions(breaks, NaN), []);
});
