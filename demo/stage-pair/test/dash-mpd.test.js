// dash-mpd.test.js -- what inspect.html's card 1 reads off the signalled MPD in
// DASH mode, and how card 3 sums up a `$remote.slots` answer.
//
// What they are for: card 1 shows each break's Event AS IT IS WRITTEN in the MPD
// dash.js received, CDATA and all, so the reading has to cut the element out of
// the text untouched, pair it with its break by the number senalizar-dash.mjs
// gave it, and leave comments alone. Card 3's line has to describe the slot
// envelope that came back, read off that envelope.
//
// The MPD is written here in the shape senalizar-dash.mjs writes it (one SVTA
// EventStream with one Event per break, CDATA bodies, a comment naming each
// break, and a replace EventStream for the linear break).
//
// Run: npm test   (node --test, no dependencies)

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  breakDash, eventoDelBreak, eventoEnLineas, eventosDelMpd, lecturaDeDashjs, resumenDeSlots, sobreDelEvento
} from '../js/dash-mpd.js';

const STAGE = { breaks: [{ id: 'pre' }, { id: 'a' }, { id: 'b' }], breakLineal: { id: 'linear' } };
const POD = (cue) => JSON.stringify({
  version: 2, type: 'pod', features: { remoteFields: true, concurrentPresentation: true }, ...(cue ? { cue } : {}),
  payload: [{ duration: 12, $remote: { slots: '/signalling/dash/slots-break-a.json' } }]
});
const EVENT_A = `<Event id="2" presentationTime="20000" duration="12000"><![CDATA[${POD()}]]></Event>`;
const MPD = `<?xml version="1.0" encoding="utf-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" mediaPresentationDuration="PT3M18.0S">
  <Period id="0" start="PT0.0S">
    <EventStream schemeIdUri="urn:svta:advertising-wg:ad-creative-signaling" timescale="1000">
      <!-- break pre -->
      <Event id="1" presentationTime="0" duration="12000"><![CDATA[${POD(['PRE'])}]]></Event>
      <!-- break a -->
      ${EVENT_A}
      <!-- <Event id="3" presentationTime="65000" duration="12000"><![CDATA[{}]]></Event> -->
    </EventStream>
    <EventStream schemeIdUri="urn:mpeg:dash:event:alternativeMPD:replace:2025" timescale="1000">
      <!-- break linear -->
      <Event id="4" presentationTime="150000" duration="12000"><ReplacePresentation uri="/c/ketrava-16x9/dash/manifest.mpd" maxDuration="12000" clip="false" executeOnce="false"/></Event>
    </EventStream>
    <AdaptationSet id="0" contentType="video"></AdaptationSet>
  </Period>
</MPD>`;

test('every Event of every EventStream, in order, with its stream; a commented-out Event is not read', () => {
  const eventos = eventosDelMpd(MPD);
  assert.deepEqual(eventos.map((e) => [e.id, e.scheme]), [
    ['1', 'urn:svta:advertising-wg:ad-creative-signaling'],
    ['2', 'urn:svta:advertising-wg:ad-creative-signaling'],
    ['4', 'urn:mpeg:dash:event:alternativeMPD:replace:2025']
  ]);
  assert.equal(eventos[0].apertura, '<EventStream schemeIdUri="urn:svta:advertising-wg:ad-creative-signaling" timescale="1000">');
  assert.equal(eventos[1].timescale, 1000);
  assert.equal(eventos[1].presentationTime, 20000);
  assert.equal(eventos[1].duration, 12000);
});

test('the Event is cut out exactly as written, and its CDATA body is read as text', () => {
  const a = eventosDelMpd(MPD)[1];
  assert.equal(a.crudo, EVENT_A, 'byte for byte: the card shows what the file says');
  assert.equal(a.cuerpo, POD());
  assert.equal(a.replace, null);
  assert.deepEqual(sobreDelEvento(a).features, { remoteFields: true, concurrentPresentation: true });
});

test('a replace Event: no body, and the attributes of its ReplacePresentation', () => {
  const linear = eventosDelMpd(MPD)[2];
  assert.equal(linear.cuerpo, null);
  assert.deepEqual(linear.replace, { uri: '/c/ketrava-16x9/dash/manifest.mpd', maxDuration: 12000, executeOnce: false });
  assert.equal(sobreDelEvento(linear), null);
});

test('a body written as plain text is read too, and one that is not JSON gives no envelope', () => {
  const [plano, roto] = eventosDelMpd(`<EventStream schemeIdUri="x"><Event id="1"> {"version":2} </Event><Event id="2">nope</Event></EventStream>`);
  assert.deepEqual(sobreDelEvento(plano), { version: 2 });
  assert.equal(sobreDelEvento(roto), null);
  assert.equal(plano.timescale, 1, 'no @timescale is 1');
});

test('each break of stage.json is its Event by number, the linear one the next; dash.js\'s numbers too', () => {
  const eventos = eventosDelMpd(MPD);
  assert.equal(eventoDelBreak(eventos, 'a', STAGE).id, '2');
  assert.equal(eventoDelBreak(eventos, 'pre', STAGE).id, '1');
  assert.equal(eventoDelBreak(eventos, 'linear', STAGE).id, '4');
  assert.equal(eventoDelBreak(eventos, 'b', STAGE), null, 'commented out, so not there');
  assert.equal(breakDash(2, STAGE), 'a', 'dash.js hands the id over as a number');
  assert.equal(breakDash('4', STAGE), 'linear');
  assert.equal(breakDash('5', STAGE), null);
  assert.equal(breakDash('x', STAGE), null);
  assert.equal(breakDash(null, STAGE), null);
});

test('on lines: broken only between the tags, nothing inside the CDATA or an attribute touched', () => {
  const lineas = eventoEnLineas(EVENT_A);
  assert.equal(lineas.replace(/\n {2}|\n/g, ''), EVENT_A);
  assert.equal(lineas.split('\n').length, 3);
  assert.ok(lineas.split('\n')[1].includes(POD()));
  const replace = eventoEnLineas(eventosDelMpd(MPD)[2].crudo);
  assert.deepEqual(replace.split('\n').map((l) => l.trim().slice(0, 20)), ['<Event id="4" presen', '<ReplacePresentation', '</Event>']);
});

test('the summary of a $remote.slots answer is read off the envelope that came back', () => {
  const sobre = {
    version: 2, type: 'slot', payload: [{
      start: 0, duration: 12, media: [{ type: 'application/dash+xml', uri: '/c/linear.mpd' }],
      layoutOptions: [
        { type: 'lowerThirdOverlay', layout: { assets: [{ type: 'application/dash+xml', uri: '/x.mpd' }] } },
        { type: 'squeezebackLShape', layout: { assets: [{ type: 'image/png', uri: '/x.png' }] } }
      ]
    }]
  };
  assert.equal(resumenDeSlots(JSON.stringify(sobre)),
    'envelope v2 "slot" · 1 slot · 2 options · linear default (Slot.media) · lowerThirdOverlay, squeezebackLShape · ' +
    'application/dash+xml, image/png · 12 s');
  delete sobre.payload[0].media;
  assert.match(resumenDeSlots(JSON.stringify(sobre)), / · no default · /);
  assert.equal(resumenDeSlots('Not Found'), 'the answer is not JSON');
  assert.equal(resumenDeSlots('{"version":2,"type":"pod","payload":[]}'), 'not a version 2 envelope of type "slot"');
});

test('what dash.js\'s own event carried is said as it arrived: the CDATA body missing, or there', () => {
  assert.match(lecturaDeDashjs(null), /has not handed this Event/);
  const sinCuerpo = lecturaDeDashjs({ id: 2, presentationTime: 20, duration: 12, messageData: undefined });
  assert.match(sinCuerpo, /id 2 \(a number/);
  assert.match(sinCuerpo, /at 20\.00 s for 12\.00 s/);
  assert.match(sinCuerpo, /messageData undefined: the body in CDATA did not reach it/);
  assert.match(lecturaDeDashjs({ id: 2, messageData: '{"version":2}' }), /with its body in messageData/);
  assert.match(lecturaDeDashjs({ id: 4 }, { replace: true }), /no ReplacePresentation attributes/);
});
