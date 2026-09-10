// transition-schedule.test.js -- the test of T-01 of the phase of the transitions.
//
// What it is for: the two questions the transitions ask that are NOT answered by
// looking at the screen. Everything else this phase adds is visible in the first
// break -- a picture that jumps instead of moving, a banner that pops instead of
// fading -- and these two are not:
//
//   WHICH AD GETS NOTHING. An ad at full frame is meant to cut, and getting that
//   backwards is loud; getting it backwards for the FALLBACK of ADR 0019 is not,
//   because a broken block is not a case anybody runs on purpose.
//
//   WHEN A WAY OUT STARTS. The window pays for the transition (ADR 0052), so the
//   fade has to end on the edge of the window and not start there. Twenty
//   milliseconds of drift there looks exactly like no drift at all.
//
// Same door as the other suites and the same restriction: the pure functions and
// nothing else. No DOM, no browser. Coverage is not the goal -- what is aimed at
// is the boundary of each rule, which is where a rule that reads right is wrong.
//
// The data is the real one, in `test/fixtures/asset-lists/`, and one fixture
// carries the whole point: `asset-list-mezclado.json` is a break of four ads
// whose THIRD is at full frame, so the two answers have to differ inside one
// break. A rule written on the break instead of on the ad passes every other
// fixture and fails that one.
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { resolveAssetList, LINEAR_TYPE } from '../lib/signalling.js';
import {
  fadesInAndOut, remainingIn, isLeaving, isImage,
  FULL_FRAME_TYPE, PRIMARY_MOVE_MS, AD_FADE_IN_MS, AD_FADE_OUT_MS
} from '../lib/renderer.js';

/** The experiences of one asset-list, resolved as the renderer gets them. */
function experiencesOf(list) {
  const json = JSON.parse(readFileSync(new URL(`./fixtures/asset-lists/${list}`, import.meta.url), 'utf8'));
  return resolveAssetList(json, { id: list, slotStart: 0 });
}

const one = (list) => experiencesOf(list)[0];

// --- Which ad gets nothing -------------------------------------------------

test('the ads that are drawn a layout fade, and the one at full frame does not', () => {
  assert.equal(fadesInAndOut(one('asset-list-squeezebackLShape.json')), true);
  assert.equal(fadesInAndOut(one('asset-list-squeezebackLShape-image.json')), true);
  assert.equal(fadesInAndOut(one('asset-list-cornerOverlay.json')), true);
  assert.equal(fadesInAndOut(one('asset-list-linear.json')), false);
});

test('inside one break the answer is per ad and not per break', () => {
  // Four ads, the third of them at full frame. This is the case a rule written
  // on the break -- or on the identifier of the signalling, which every ad of a
  // break shares -- gets wrong while passing everything else.
  const experiences = experiencesOf('asset-list-mezclado.json');
  assert.equal(experiences.length, 4);
  assert.deepEqual(experiences.map(fadesInAndOut), [true, true, false, true]);
});

test('the fallback of ADR 0019 lands on the side of the full-frame ad', () => {
  // A block this client cannot draw becomes an ad at full frame, and on screen
  // that is what it IS, whatever the reason it became one. So it gets nothing,
  // for the same reason a declared linear ad gets nothing -- and this is the
  // case nobody runs on purpose, which is why it is asserted rather than
  // assumed.
  const experiences = experiencesOf('asset-list-repliegue-bloque-roto.json');
  assert.deepEqual(experiences.map((e) => e.type), ['cornerOverlay', 'linear', 'cornerOverlay']);
  assert.deepEqual(experiences.map(fadesInAndOut), [true, false, true]);
});

test('the label this file copies is the one the layer underneath writes', () => {
  // The renderer imports nothing from the signalling layer (ADR 0003), so the
  // string is a copy. A copy that has to match is a copy that gets checked, and
  // this is the check: it fails the day either side changes it.
  assert.equal(FULL_FRAME_TYPE, LINEAR_TYPE);
});

test('an experience with no type at all still fades', () => {
  // Nothing in the contract promises a `type`, and the ad that gets nothing is
  // the one that says it is at full frame -- not the one that says nothing. The
  // default has to fall on the side of the effect.
  assert.equal(fadesInAndOut({}), true);
  assert.equal(fadesInAndOut(undefined), true);
});

// --- When a way out starts -------------------------------------------------

test('what is left of a window is the window minus where the playhead is', () => {
  const ad = one('asset-list-cornerOverlay.json'); // 0 + 12
  assert.equal(remainingIn(ad, 0), 12);
  assert.equal(remainingIn(ad, 11.5), 0.5);
  assert.equal(remainingIn(ad, 12), 0);
});

test('the ad of a break that does not start at zero is read against its own window', () => {
  // The third ad of the mixed break starts at 24. A way out computed from the
  // start of the BREAK would fire on the wrong ad, and every ad of a break
  // shares the identifier of the signalling, so nothing else would say so.
  const [, , third] = experiencesOf('asset-list-mezclado.json');
  assert.equal(third.startTime, 24);
  assert.equal(remainingIn(third, 30), 6);
  assert.equal(isLeaving(third, 30, AD_FADE_OUT_MS), false);
  assert.equal(isLeaving(third, 35.95, AD_FADE_OUT_MS), true);
});

test('the middle of a window is not leaving, on either lead', () => {
  const ad = one('asset-list-squeezebackLShape.json'); // 0 + 12
  assert.equal(isLeaving(ad, 6, AD_FADE_OUT_MS), false);
  assert.equal(isLeaving(ad, 6, PRIMARY_MOVE_MS), false);
});

test('a frame inside the lead is leaving and a frame outside it is not', () => {
  // The exact boundary is deliberately NOT asserted: with the window in seconds
  // and the lead in milliseconds it is not representable -- `12 - 0.38` leaves a
  // remainder of 0.3800000000000008 -- and no frame of a 60 Hz loop lands on it.
  // Pinning it would pin an artefact of the arithmetic instead of the rule.
  const ad = one('asset-list-squeezebackLShape.json'); // 0 + 12
  const fadeEdge = 12 - AD_FADE_OUT_MS / 1000;
  assert.equal(isLeaving(ad, fadeEdge + 0.001, AD_FADE_OUT_MS), true);
  assert.equal(isLeaving(ad, fadeEdge - 0.001, AD_FADE_OUT_MS), false);
  // And the two leads are two thresholds on the same window: the picture starts
  // moving back long before the ad starts fading.
  const moveEdge = 12 - PRIMARY_MOVE_MS / 1000;
  assert.equal(isLeaving(ad, moveEdge + 0.001, PRIMARY_MOVE_MS), true);
  assert.equal(isLeaving(ad, moveEdge + 0.001, AD_FADE_OUT_MS), false);
});

test('before the window opens nothing is leaving, and after it closes everything is', () => {
  const [, second] = experiencesOf('asset-list-mezclado.json'); // 12 + 12
  assert.equal(isLeaving(second, 0, PRIMARY_MOVE_MS), false);
  assert.equal(isLeaving(second, 24, PRIMARY_MOVE_MS), true);
  assert.equal(isLeaving(second, 100, PRIMARY_MOVE_MS), true);
});

test('a window shorter than its own transition is leaving from its first frame', () => {
  // The degenerate case of ADR 0052, and what it has to do is degrade to no
  // effect rather than to a broken frame: the target is the way out from the
  // start, so the picture never shrinks at all.
  const brief = { startTime: 10, duration: 0.3 };
  assert.equal(isLeaving(brief, 10, PRIMARY_MOVE_MS), true);
  assert.equal(isLeaving(brief, 10.15, PRIMARY_MOVE_MS), true);
  // The fade is shorter than that window, so it still has a way in.
  assert.equal(isLeaving(brief, 10, AD_FADE_OUT_MS), false);
});

test('a window of zero length is leaving the moment it opens', () => {
  const empty = { startTime: 5, duration: 0 };
  assert.equal(remainingIn(empty, 5), 0);
  assert.equal(isLeaving(empty, 5, AD_FADE_OUT_MS), true);
});

test('a playhead that is not a number is not leaving', () => {
  // `currentTime` before the metadata is in. The harmless answer is that
  // nothing is on its way out, and the alternative would start every way out at
  // once on the frame the player loads.
  const ad = one('asset-list-cornerOverlay.json');
  assert.equal(isLeaving(ad, NaN, PRIMARY_MOVE_MS), false);
  assert.equal(isLeaving(ad, undefined, PRIMARY_MOVE_MS), false);
});

test('the three durations are the ones the phase declared, and the way out is the shortest', () => {
  // Not a test of taste: the numbers are for correcting by eye. What is asserted
  // is the SHAPE somebody asked for -- a short way in and a faster way out --
  // and that the picture takes longer than either, because it has further to go.
  assert.equal(PRIMARY_MOVE_MS, 380);
  assert.equal(AD_FADE_IN_MS, 200);
  assert.equal(AD_FADE_OUT_MS, 120);
  assert.ok(AD_FADE_OUT_MS < AD_FADE_IN_MS);
  assert.ok(AD_FADE_IN_MS < PRIMARY_MOVE_MS);
});

// --- Which node gets an opaque bed under it --------------------------------
//
// `isImage` decided which ELEMENT this file creates long before it decided
// anything about painting, and now the black bed hangs off the same answer: a
// video gets one and a still does not, because a still with an alpha channel is
// composited against it forever (ADR 0056). So the cases below are not about
// the tag any more, and the one that matters is the absent `mediaType`: it has
// to fall on the side that KEEPS the bed, because that is the side where being
// wrong costs a frame instead of a creative.

test('a still is told apart from a video, including when nothing is declared', () => {
  assert.equal(isImage('image/png'), true);
  assert.equal(isImage('image/jpeg'), true);
  assert.equal(isImage('IMAGE/PNG'), true);
  assert.equal(isImage('application/vnd.apple.mpegurl'), false);
  assert.equal(isImage('video/mp4'), false);
  // The two shapes of "the contract said nothing", and both keep the bed.
  assert.equal(isImage(null), false);
  assert.equal(isImage(undefined), false);
  assert.equal(isImage(''), false);
  // And not a substring match: a type that merely mentions an image is not one.
  assert.equal(isImage('application/image-list'), false);
});

test('the ad the phase fades is a still, so the two rules meet on the banner', () => {
  // The banner of the hydration break is a still inside an overlay layout, so
  // it fades in and out AND it must not be painted onto black. This is the one
  // element where both rules of the phase land at once, and it is the reason
  // the bed had to be fixed before the fade was written: a node with a bed
  // fades the bed, so at half opacity a half-black rectangle appears over the
  // picture instead of half a banner.
  const banner = { mediaType: 'image/png' };
  assert.equal(isImage(banner.mediaType), true);
  assert.equal(fadesInAndOut({ type: 'lowerThirdOverlay' }), true);
});
