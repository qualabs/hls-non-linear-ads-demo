#!/usr/bin/env node
// escribir-asset-lists.mjs -- los nueve asset-lists de esta demo, derivados de
// stage.json y de nada más.
//
// Tres por break: el LINEAL, que es lo que reproduce el pane de fábrica; la
// respuesta RICA, que es lo que se sirve cuando el dispositivo declara dos
// decodificadores o no declara ninguno; y la respuesta MAGRA, la de un
// decodificador. Tres breaks, nueve archivos.
//
// ---------------------------------------------------------------------------
// POR QUÉ SE GENERAN Y NO SE ESCRIBEN A MANO, QUE ES LO QUE HACEN TRES DE LAS
// CUATRO DEMOS ANTERIORES
// ---------------------------------------------------------------------------
// Porque son DOS juegos que tienen que ser idénticos salvo en dos campos, y eso
// es exactamente lo que dos archivos escritos a mano dejan de ser el día que
// alguien toca uno. El ADR 0084 dice que la capacidad del dispositivo degrada
// EL FORMATO del aviso y no el aviso: entre la rica y la magra de un mismo break
// cambian el `type` y el `uri` del asset, y NADA MÁS -- ni el layout, ni el
// `viewport`, ni el `zDepth`, ni la campaña, ni la duración. Esa igualdad no es
// una prolijidad: es la afirmación que la demo hace en cámara.
//
// Generarlos del mismo lugar es lo que el ADR 0083 pide con todas las letras
// ("lo que hay que cuidar es que los dos juegos se generen del mismo lugar y no
// se editen a mano por separado"), y el molde del repositorio es
// demo/race-multiview/, que deriva su asset-list de race.json por la misma
// razón: la fuente existe, así que la lista no se tipea.
//
// El test de la demo asserta la igualdad sobre los archivos ESCRITOS y no sobre
// este código, que es la única forma en que puede ponerse rojo.
//
// ---------------------------------------------------------------------------
// LOS NUEVE ARCHIVOS SÍ VAN A GIT, Y LAS DOS PLAYLISTS NO
// ---------------------------------------------------------------------------
// La diferencia es un instante. Una playlist señalizada lleva un START-DATE
// resuelto contra el EXT-X-PROGRAM-DATE-TIME del contenido empaquetado
// (ADR 0005), que es hora de pared y se mueve con cada empaquetado; en git sólo
// puede estar vieja. Un asset-list de éstos no contiene ni un instante: es
// función pura de stage.json, así que el archivo en git y el archivo recién
// escrito son el mismo byte a byte, y tenerlo versionado es lo que hace que un
// cambio de señalización se vea en un diff.
//
// ---------------------------------------------------------------------------
// LO QUE CADA CAMPO ES, Y DE DÓNDE SALE
// ---------------------------------------------------------------------------
//   URI / DURATION de nivel superior   el repliegue del Apéndice D.2 y del
//       ADR 0019: lo que reproduce un cliente que no lee el bloque. Acá es
//       SIEMPRE el creativo 16:9 de la campaña del break, o sea exactamente el
//       aviso lineal de ese break, y es EL MISMO en la rica y en la magra. Que
//       sea el mismo no es una economía: si la magra repusiera otro repliegue,
//       los dos archivos diferirían en tres campos y no en dos, y la afirmación
//       del ADR 0084 dejaría de ser verificable sobre el archivo.
//
//   layout.assets[0].type / .uri        LOS DOS ÚNICOS CAMPOS QUE CAMBIAN entre
//       la rica y la magra. `application/vnd.apple.mpegurl` con el HLS que el
//       puente de la T-05 produjo, o `image/svg+xml` con el MISMO creativo, el
//       SVG autorado que vive en graphics/campaigns/ y va a git.
//
//   layout.assets[0].viewport / .zDepth / .id   de stage.json, y por eso son
//       literalmente el mismo valor en los dos juegos: salen de la misma
//       lectura.
//
//   primaryContent                      lo declaran los dos squeezeback y NO lo
//       declara el lowerThirdOverlay, que es una ausencia deliberada y
//       argumentada en stage.json (`formas.banner._sinPrimario`): para los dos
//       overlays la herramienta de SVTA no lo emite y la capa asume su preset,
//       que es lo que el contrato tiene medido. Escribirlo sería divergir del
//       asset-list que la herramienta emite, que es lo que el ADR 0004 prohíbe.
//
// ---------------------------------------------------------------------------
// EL CONTROL, Y ESTÁ ACÁ PORQUE UN CHEQUEO QUE NO PUEDE FALLAR NO ES UN CHEQUEO
// ---------------------------------------------------------------------------
// `CONTROL_DURACION_CONCURRENTE=<segundos>` escribe los tres asset-lists
// concurrentes con esa duración en lugar de la del break, dejando el lineal con
// la suya. Eso REPRODUCE A PROPÓSITO el defecto de demo/compatibility-pair/ -- un
// lineal de duración distinta a la de su break -- y es contra lo que se corre el
// control de la medición del tramo invertido: con él, los dos panes tienen que
// salir del break en segundos DISTINTOS. Sin ese rojo, la medición en verde no
// prueba nada.
//
// NO se usa en ninguna corrida normal: `senalizar-contenido.sh` sólo lo pasa
// cuando el instrumento se lo pide.
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
 * El asset-list concurrente de un break, en el medio que se le pida.
 *
 * `medio` es 'video' o 'imagen', y es LO ÚNICO que este generador recibe además
 * del break: todo lo demás sale de stage.json, que es lo que hace que los dos
 * juegos no se puedan despegar.
 */
function concurrente(brk, medio) {
  const forma = stage.formas[brk.forma];
  const p = pieza(brk.campana, brk.forma);
  const duracion = control ?? brk.duracion;

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

  return {
    ASSETS: [{
      // El repliegue del ADR 0019, idéntico en los dos escalones: el aviso
      // lineal de este break.
      URI: url(pieza(brk.campana, '16x9').video),
      DURATION: duracion,
      'X-AD-CREATIVE-SIGNALING': {
        version: 2,
        type: 'slot',
        payload: [{
          type: forma.layout,
          start: 0,
          duration: duracion,
          layout
        }]
      }
    }]
  };
}

mkdirSync(outDir, { recursive: true });
const escritos = [];
for (const brk of stage.breaks) {
  for (const [nombre, contenido] of [
    [brk.lineal, lineal(brk)],
    [brk.rica, concurrente(brk, 'video')],
    [brk.magra, concurrente(brk, 'imagen')]
  ]) {
    writeFileSync(join(outDir, nombre), JSON.stringify(contenido, null, 2) + '\n');
    escritos.push(nombre);
  }
}
process.stdout.write(escritos.join('\n') + '\n');
