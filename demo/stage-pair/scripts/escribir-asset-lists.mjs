#!/usr/bin/env node
// escribir-asset-lists.mjs -- los asset-lists del par, derivados de stage.json y
// de nada más.
//
// Por break: el CONCURRENTE, que es lo que pide el pane de la librería, y el
// LINEAL, que es lo que reproduce el pane de fábrica, sólo en los breaks que
// tienen default. Tres concurrentes y dos lineales: el break A no tiene default
// (ADR 0087).
//
// ---------------------------------------------------------------------------
// UNA SOLA RESPUESTA POR BREAK, CON TODAS LAS OPCIONES
// ---------------------------------------------------------------------------
// El ad presentation server de esta demo es estático, así que contesta lo mismo
// declare lo que declare el dispositivo: el aviso con sus DOS opciones, en orden
// de preferencia -- primero en video, después la misma pieza como
// `image/svg+xml` (R5.5). Quien elige es la librería, que se queda con la primera
// que la capacidad declarada satisface (ADR 0085). Hasta la fase 14 había un
// juego de asset-lists por escalón y la respuesta estaba horneada por valor
// (ADR 0083); eso se fue.
//
// Entre una opción y la otra cambian el `type` y el `uri` del asset, y NADA MÁS
// -- ni el layout, ni el `viewport`, ni el `zDepth`, ni la duración. Es la
// afirmación del ADR 0084, que ahora vive adentro de un solo archivo, y por eso
// las dos opciones salen de la misma función con un solo argumento distinto. El
// test de la demo la asserta sobre los archivos ESCRITOS, que es la única forma
// en que puede ponerse rojo.
//
// Los archivos van a git: no contienen ni un instante, así que son función pura
// de stage.json y un cambio de señalización se ve en un diff. Las playlists no,
// porque llevan un START-DATE de hora de pared (ADR 0005).
//
// ---------------------------------------------------------------------------
// LO QUE CADA CAMPO ES, Y DE DÓNDE SALE
// ---------------------------------------------------------------------------
//   URI de nivel superior     EL DEFAULT del break: lo que la librería reproduce
//       a cuadro entero cuando no queda ninguna opción que se pueda dibujar
//       (ADR 0019), y lo que reproduce un cliente que no lee el bloque. Es el
//       creativo 16:9 de la campaña, o sea el mismo aviso lineal del pane de
//       fábrica. EL BREAK SIN DEFAULT NO LO LLEVA, y sin él la librería saltea el
//       asset (D.5). D.2 hace obligatorio el `URI`; el ADR 0087 dice por qué acá
//       la ausencia es la forma de decir "sin default".
//
//   options[n].layout.assets[0].type / .uri    LOS DOS ÚNICOS CAMPOS QUE CAMBIAN
//       entre opciones: el HLS que produjo el puente de la T-05, o el SVG
//       autorado de graphics/campaigns/.
//
//   primaryContent            lo declaran los dos squeezeback y NO el
//       lowerThirdOverlay, que es una ausencia deliberada y argumentada en
//       stage.json (`formas.banner._sinPrimario`).
//
// ---------------------------------------------------------------------------
// EL CONTROL DEL TRAMO INVERTIDO
// ---------------------------------------------------------------------------
// `CONTROL_DURACION_CONCURRENTE=<segundos>` escribe los concurrentes con esa
// duración en lugar de la del break, dejando los lineales con la suya. Reproduce
// a propósito el defecto de demo/compatibility-pair/, y es contra lo que se corre
// el control de test/medir-tramo-invertido.py. No se usa en ninguna corrida
// normal.
//
// Uso:  escribir-asset-lists.mjs <stage.json> <carpeta-de-salida>

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [stagePath, outDir] = process.argv.slice(2);
if (!stagePath || !outDir) {
  console.error('uso: escribir-asset-lists.mjs <stage.json> <carpeta-de-salida>');
  process.exit(1);
}

const stage = JSON.parse(readFileSync(stagePath, 'utf8'));
const control = Number(process.env.CONTROL_DURACION_CONCURRENTE || 0) || null;

/** Una ruta de stage.json convertida en la URL que un cliente pide (ADR 0022). */
const url = (ruta) => '/' + ruta.replace(/^\/+/, '');

/** La pieza de una campaña en una forma, que es la fila del inventario. */
function pieza(campana, forma) {
  const p = stage.assets.piezas.find((x) => x.campana === campana && x.forma === forma);
  if (!p) throw new Error(`stage.json no declara la pieza ${campana}/${forma}`);
  return p;
}

/**
 * El identificador del elemento de aviso, por forma.
 *
 * Es un nombre y no un número, y es el mismo en la rica y en la magra porque es
 * el mismo elemento dibujado con otro medio. Los tres siguen los nombres que las
 * demos anteriores ya usan para estos layouts.
 */
const ID_DEL_AVISO = {
  '16x9': 'adSideBySide',
  backplate: 'lBackplate',
  banner: 'banner'
};

/** El asset-list lineal de un break: un aviso a cuadro entero y nada más. */
function lineal(brk) {
  return {
    ASSETS: [{ URI: url(pieza(brk.campana, '16x9').video), DURATION: brk.duracion }]
  };
}

/**
 * Una opción de presentación del aviso de un break, en el medio que se le pida.
 *
 * `medio` es 'video' o 'imagen', y es LO ÚNICO que distingue una opción de la
 * otra: todo lo demás sale de stage.json, que es lo que hace que las dos no se
 * puedan despegar.
 */
function opcion(brk, medio) {
  const forma = stage.formas[brk.forma];
  const p = pieza(brk.campana, brk.forma);
  const aviso = {
    id: ID_DEL_AVISO[brk.forma],
    type: medio === 'video' ? stage.assets.tipos.video : stage.assets.tipos.imagen,
    uri: url(medio === 'video' ? p.video : p.svg),
    viewport: forma.viewportAviso,
    zDepth: forma.zDepthAviso
  };
  // El bloque del primario va antes de los assets cuando existe, que es el orden
  // en que los asset-lists del repositorio lo escriben.
  const layout = forma.viewportPrimario === undefined
    ? { assets: [aviso] }
    : {
        primaryContent: { zDepth: forma.zDepthPrimario, viewport: forma.viewportPrimario },
        assets: [aviso]
      };
  return { type: forma.layout, layout };
}

/** El asset-list concurrente de un break: el aviso con sus dos opciones, y su default si tiene. */
function concurrente(brk) {
  const duracion = control ?? brk.duracion;
  const asset = {};
  // El default del break (ADR 0019), o su ausencia deliberada (ADR 0087).
  if (brk.lineal) asset.URI = url(pieza(brk.campana, '16x9').video);
  asset.DURATION = duracion;
  asset['X-AD-CREATIVE-SIGNALING'] = {
    version: 2,
    type: 'slot',
    payload: [{
      start: 0,
      duration: duracion,
      // En orden de preferencia (R5.5): primero el video, después la imagen.
      options: [opcion(brk, 'video'), opcion(brk, 'imagen')]
    }]
  };
  return { ASSETS: [asset] };
}

mkdirSync(outDir, { recursive: true });
const escritos = [];
for (const brk of stage.breaks) {
  const archivos = [[brk.concurrente, concurrente(brk)]];
  if (brk.lineal) archivos.push([brk.lineal, lineal(brk)]);
  for (const [nombre, contenido] of archivos) {
    writeFileSync(join(outDir, nombre), JSON.stringify(contenido, null, 2) + '\n');
    escritos.push(nombre);
  }
}
process.stdout.write(escritos.join('\n') + '\n');
