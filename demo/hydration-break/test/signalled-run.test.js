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
  lasTresFormasDelMinuto,
  laGaleriaSeDibujaDelContrato,
  losMediosSalenDelContrato,
  cadaPliegueRotulaSuAviso,
  laGlosaDelBloqueExplicaSusCampos,
  elRitmoDelGuion
} from './comprobaciones.js';
import { labelsOfAssetList, blockGlossOf } from '../js/senalizacion.js';

/** Los archivos que dibujan rótulos de la página leyendo el asset list. La lista se
 * amplía cuando aparece otro que los derive: un identificador o un MIME escrito a mano es
 * el mismo defecto en cualquiera de ellos. */
const FUENTES = () => [
  { nombre: 'index.html', texto: leer('../index.html') },
  { nombre: 'js/tipos.js', texto: leer('../js/tipos.js') },
  { nombre: 'js/senalizacion.js', texto: leer('../js/senalizacion.js') }
];

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

test('la galería de formas se dibuja del contrato y no de una lista escrita a mano', () => {
  // La propiedad del ADR 0073, medida sobre TODOS los archivos que derivan rótulos del
  // asset list, y no sólo sobre los de la sección 1: la lista se amplía cuando aparece
  // otro que los derive, porque un identificador escrito a mano es el mismo defecto en
  // cualquiera de ellos. Su control -- la corrida con un identificador plantado, que
  // tiene que dar rojo -- está en `mutaciones.mjs`, por la misma razón que el de las
  // anclas: un chequeo que nadie vio fallar es un chequeo que nadie sabe que puede fallar.
  assert.deepEqual(laGaleriaSeDibujaDelContrato({ assetList, fuentes: FUENTES() }), []);
});

test('lo que puede ir en una caja se lee del contrato y no está escrito en la página', () => {
  // La misma propiedad del ADR 0073 sobre la otra mitad derivada de la sección 1: la
  // galería dice dónde va cada caja y el bloque de abajo qué puede ir adentro, y los dos
  // se caen igual si alguien tipea lo que el asset list ya declara. Su control -- un MIME
  // plantado a mano, que tiene que dar rojo -- está en `mutaciones.mjs`.
  assert.deepEqual(losMediosSalenDelContrato({ assetList, fuentes: FUENTES() }), []);
});

test('cada pliegue de la señalización rotula el aviso que tiene adentro', () => {
  // Los rótulos los produce la página -- `labelsOfAssetList` es el código que la sección
  // corre en vivo, no una reimplementación -- y el chequeo los coteja contra el asset
  // list. Su control está en `mutaciones.mjs`: cuatro tandas escritas a mano, una por
  // cada forma en que el rótulo y el aviso se pueden despegar.
  assert.deepEqual(cadaPliegueRotulaSuAviso({
    assetList,
    rotulos: labelsOfAssetList(assetList)
  }), []);
});

test('la glosa del bloque explica los campos que el asset list trae, y ninguno más', () => {
  // Las filas las produce la página -- `blockGlossOf` es el código que la sección corre en
  // vivo -- y el chequeo recorre el asset list por su cuenta para cotejarlas. Sus controles
  // están en `mutaciones.mjs`: un campo que el archivo trae y la glosa no explica, y una
  // fila que explica un campo que el archivo no trae.
  assert.deepEqual(laGlosaDelBloqueExplicaSusCampos({
    assetList,
    filas: blockGlossOf(assetList)
  }), []);
});

test('entre dos placas se ve partido, y ninguna placa se queda', () => {
  // El chequeo de anclas mira cada placa sola y ésta la relación entre dos, que es
  // donde las separaciones viven hoy: no están declaradas en ningún lado, salen de los
  // `lead` del guion calculados a mano, así que la próxima edición de textos las mueve
  // sin que nada avise. Sus controles -- dos placas resolviendo en el mismo segundo, y
  // un `hold` absurdo -- están en `mutaciones.mjs`, por lo mismo que los otros: un
  // chequeo que nadie vio fallar es un chequeo que nadie sabe que puede fallar.
  const provider = proveedorDeclarado({ plate, assetList });
  assert.deepEqual(elRitmoDelGuion({ story, provider }), []);
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
