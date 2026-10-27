#!/usr/bin/env node
// senalizar-dash.mjs -- the signalled MPD of the pair: the programme
// `empaquetar-dash.sh` packaged, plus an EventStream with one Event per break.
//
//   senalizar-dash.mjs <stage.json> <packaged MPD> <signalled MPD>
//
// It is the DASH twin of the playlist `senalizar-contenido.sh` writes, read off
// the same stage.json, so the two panes signal the same breaks at the same
// seconds (phase 19, ADR 0127):
//
//   - each break of `breaks`, an Event of the scheme of SVTA2053 §5 at its
//     offset and for its duration, its body a version 2 `pod` envelope with
//     `features.concurrentPresentation` (ADR 0120, 0121), the `cue` of its tag
//     (ADR 0123), and its Pod pointing at its `slot` envelope in
//     `$remote.slots`, which `escribir-asset-lists.mjs` writes (ADR 0122). The
//     pre-roll goes at 0 and the post-roll in the last seconds of the programme,
//     as their HLS tags do: the Event has to lie inside the Period, and neither
//     client reads its time;
//   - `breakLineal`, an Alternative MPD replace event (ISO/IEC 23009-1, 5.16.4)
//     to the MPD of its 16:9 piece, which this library plays (ADR 0125).
//
// Event@id is an unsigned int in the schema of 23009-1, so each break takes its
// ordinal and the Event says which break it is in the comment next to it.
// It goes in content/, next to the packaged MPD, because it is derived from it.
import { readFileSync, writeFileSync } from 'node:fs';

const [stagePath, packaged, out] = process.argv.slice(2);
if (!stagePath || !packaged || !out) {
  console.error('usage: senalizar-dash.mjs <stage.json> <packaged MPD> <signalled MPD>');
  process.exit(2);
}
const stage = JSON.parse(readFileSync(stagePath, 'utf8'));
const mpd = readFileSync(packaged, 'utf8');
const SVTA = 'urn:svta:advertising-wg:ad-creative-signaling';
const REPLACE = 'urn:mpeg:dash:event:alternativeMPD:replace:2025';

const length = /mediaPresentationDuration="PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?"/.exec(mpd);
if (!length) throw new Error(`${packaged} declares no mediaPresentationDuration`);
const programme = Number(length[1] || 0) * 3600 + Number(length[2] || 0) * 60 + Number(length[3] || 0);
const ms = (seconds) => Math.round(seconds * 1000);

const events = stage.breaks.map((brk, i) => {
  const cue = brk.cue ? [brk.cue] : [];
  const at = brk.cue === 'PRE' ? 0 : brk.cue === 'POST' ? programme - brk.duracion : brk.offset;
  const body = {
    version: 2,
    type: 'pod',
    features: { remoteFields: true, concurrentPresentation: true },
    ...(cue.length ? { cue } : {}),
    payload: [{ duration: brk.duracion, $remote: { slots: `/signalling/dash/slots-break-${brk.id}.json` } }]
  };
  return `      <!-- break ${brk.id} -->\n` +
    `      <Event id="${i + 1}" presentationTime="${ms(at)}" duration="${ms(brk.duracion)}"><![CDATA[${JSON.stringify(body)}]]></Event>`;
});

const lineal = stage.breakLineal;
const piece = stage.assets.piezas.find((p) => p.campana === lineal.campana && p.forma === '16x9');
const linealMpd = '/' + piece.video.replace(/index\.m3u8$/, 'dash/manifest.mpd');
const streams = [
  `    <EventStream schemeIdUri="${SVTA}" timescale="1000">`,
  ...events,
  '    </EventStream>',
  `    <EventStream schemeIdUri="${REPLACE}" timescale="1000">`,
  `      <!-- break ${lineal.id} -->`,
  `      <Event id="${stage.breaks.length + 1}" presentationTime="${ms(lineal.offset)}" duration="${ms(lineal.duracion)}">` +
    `<ReplacePresentation uri="${linealMpd}" maxDuration="${ms(lineal.duracion)}" clip="false" executeOnce="false"/></Event>`,
  '    </EventStream>'
].join('\n');

const periods = mpd.match(/<Period\b[^>]*>/g) || [];
if (periods.length !== 1) throw new Error(`${packaged} has ${periods.length} Periods; the pair is one`);
// The packaged MPD's segments are relative to it; the signalled one lives next to it.
writeFileSync(out, mpd.replace(periods[0], `${periods[0]}\n${streams}`));
console.log(`senalizar-dash: ${out} (${events.length} breaks and the linear one)`);
