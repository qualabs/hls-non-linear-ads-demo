// signalled-run.test.js -- los tests de esta demo, y los únicos que tiene.
//
// QUÉ MIRAN: LA CORRIDA QUE ESTA DEMO SIRVE. El suite de la sdk, en `test/`, prueba las
// funciones puras de la librería sobre datos congelados el día que se midieron, a
// propósito (ADR 0023): una lectura es la lectura de una corrida, así que se guarda
// junto a la corrida que describe. El costo de congelarla es que nada de ahí notaría que
// la corrida de ESTA demo cambia de forma, y para eso están estos tests.
//
// Leen los archivos declarados de la demo -- `plate.json`, el asset list, el guion y el
// script de señalización -- y no `test/fixtures/`. No es una comparación entre dos
// copias: es el chequeo de la corrida que se sirve, hecho con lo que la demo tiene
// adentro.
//
// Y ejecutan `resolveAnchor` de `js/story.js`, que es el código de la página y no una
// reimplementación. Esa es la mitad que importa: el chequeo de anclas prueba lo que la
// página va a hacer en vivo, no algo parecido.
//
// Correr: npm test   (node --test desde la raíz del repositorio, sin argumentos, que
// descubre esta carpeta y `test/` de una sola vez)

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  proveedorDeclarado,
  anclasDelGuion,
  elBreakArrancaEnLaParada,
  elRepartoSaleDeUnSoloLugar,
  lasTresFormasDelMinuto
} from './comprobaciones.js';

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8');
const json = (ruta) => JSON.parse(leer(ruta));

const plate = json('../plate.json');
const assetList = json('../signalling/asset-list-hydration-break.json');
const story = json('../story/story.json');
const senalizador = leer('../scripts/senalizar-contenido.sh');

test('toda ancla del guion cae en un break y en un aviso que existen, y frena antes', () => {
  // El chequeo que hace que el ADR 0037 sea una propiedad y no una intención. Su
  // control -- la corrida con un ancla deliberadamente equivocada, que tiene que dar
  // rojo -- está en `mutaciones.mjs`, porque un chequeo negativo que nunca se vio
  // fallar no se sabe si puede fallar.
  const provider = proveedorDeclarado({ plate, assetList });
  assert.deepEqual(anclasDelGuion({ story, provider }), []);

  // Y que el guion tenga beats: un `story.json` vacío pasa el chequeo de arriba con
  // cero anclas, y una demo guiada sin beats es una demo sin guía.
  assert.ok(story.beats.length >= 4, 'el guion declara al menos cuatro beats');
});

test('el break arranca en el corrimiento declarado de la parada del juego', () => {
  assert.deepEqual(elBreakArrancaEnLaParada({ plate, senalizador }), []);
});

test('el reparto de los avisos sale de plate.json y no del asset list', () => {
  assert.deepEqual(elRepartoSaleDeUnSoloLugar({ plate, assetList }), []);
});

test('el minuto declara sus tres formas de aviso', () => {
  assert.deepEqual(lasTresFormasDelMinuto({ assetList }), []);
});

test('cada creativo del asset list tiene una carpeta de contenido nombrada', () => {
  // Un `uri` mal tipeado es un aviso que no se dibuja, y la librería lo dice por consola
  // y no en pantalla: en cámara se ve como que el break no pasó. Esto no puede chequear
  // que el archivo exista -- `content/` se genera y está gitignoreado -- así que chequea
  // lo que sí es declarado: que cada `uri` apunte adentro de `/content/`.
  const uris = assetList.ASSETS.flatMap((a) => [
    a.URI,
    ...(a['X-AD-CREATIVE-SIGNALING']?.payload?.[0]?.layout?.assets ?? []).map((c) => c.uri)
  ]).filter(Boolean);
  assert.ok(uris.length >= 4);
  for (const uri of uris) {
    assert.match(uri, /^\/content\/[A-Za-z0-9._-]+\//, `${uri} apunta adentro de /content/`);
  }
});
