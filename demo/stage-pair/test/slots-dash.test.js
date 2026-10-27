// The `slot` envelopes of the DASH pane (phase 19) are the HLS asset-lists of the
// same break with TWO differences and no other: the video is the MPD next to
// each playlist, and the linear default moves from the asset's `URI` to the
// Slot's `media` (ADR 0122). The PNG and MP4 twins, the images, the layouts, the
// identifiers and the order of the options are the same (ADR 0096, 0127).
//
// What is in git is read, both sets of files, and one is compared with the
// other by the rule written here, not by the function that writes them: if
// `escribir-asset-lists.mjs` gets it wrong, this does not get it wrong with it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const DEMO = fileURLToPath(new URL('..', import.meta.url));
const json = (path) => JSON.parse(readFileSync(join(DEMO, path), 'utf8'));
const STAGE = json('stage.json');
const HLS = 'application/vnd.apple.mpegurl';
const MPD = 'application/dash+xml';
const mpdOf = (uri) => uri.replace(/\/index\.m3u8$/, '/dash/manifest.mpd');

for (const brk of STAGE.breaks) {
  test(`break ${brk.id}: the DASH envelope is its HLS asset-list with the video as an MPD and the default in media`, () => {
    const lista = json(join('signalling', brk.concurrente));
    const sobre = json(join('signalling', 'dash', `slots-break-${brk.id}.json`));
    assert.equal(sobre.version, 2);
    assert.equal(sobre.type, 'slot');
    assert.equal(lista.ASSETS.length, 1);
    assert.equal(sobre.payload.length, lista.ASSETS.length);
    const [asset] = lista.ASSETS;
    const [slotHls] = asset['X-AD-CREATIVE-SIGNALING'].payload;
    const [slot] = sobre.payload;

    const { layoutOptions: opcionesHls, ...restoHls } = slotHls;
    const { layoutOptions: opciones, media, ...resto } = slot;
    assert.deepEqual(resto, restoHls, 'everything but the options and media, the same');

    if (asset.URI) {
      assert.deepEqual(media, [{ type: MPD, id: `${brk.campana}-16x9`, uri: mpdOf(asset.URI) }]);
    } else {
      assert.equal(media, undefined, 'no default in HLS, no default in DASH (ADR 0087)');
    }

    assert.equal(opciones.length, opcionesHls.length);
    opciones.forEach((opcion, i) => {
      const esperada = structuredClone(opcionesHls[i]);
      for (const a of esperada.layout.assets) {
        if (a.type === HLS) Object.assign(a, { type: MPD, uri: mpdOf(a.uri) });
      }
      assert.deepEqual(opcion, esperada, `option ${i + 1}`);
    });
  });
}

test('one envelope per break and no other', () => {
  const nombres = STAGE.breaks.map((b) => `slots-break-${b.id}.json`).sort();
  assert.deepEqual(readdirSync(join(DEMO, 'signalling', 'dash')).sort(), nombres);
});
