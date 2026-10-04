#!/usr/bin/env node
// escribir-asset-lists-carrera.mjs -- los asset-lists de la TERCERA página,
// derivados de stage.json y de nada más.
//
// Cinco archivos: uno por cada aviso no lineal de la carrera, y el de la
// ventana de multi view. En ese orden, que es el de la página: primero la
// publicidad, después la extensión.
//
// ---------------------------------------------------------------------------
// POR QUÉ NO ES `escribir-asset-lists.mjs`
// ---------------------------------------------------------------------------
// Aquel escribe el recorrido del PAR: tres por break -- el lineal que reproduce
// el pane de fábrica, la respuesta rica y la magra --, porque esa página tiene
// dos clientes y una escalera de decodificadores. Esta página no tiene ninguna
// de las dos cosas: un solo player, un solo medio, y una clase más que aquella
// no emite nunca. Hacer que un generador contestara las dos formas habría sido
// un `if` sobre la página adentro de un archivo que hoy no sabe que hay páginas.
//
// Lo que sí se comparte es LA FUENTE, que es lo que el ADR 0044 pide: los
// `viewport`, los `zDepth` y los `layout` de las dos formas que la carrera usa
// son los MISMOS campos de `stage.formas` que lee el generador del par, leídos
// de la misma lectura. Un número de esta señalización no está escrito acá.
//
// ---------------------------------------------------------------------------
// LOS AVISOS: LA MISMA FORMA DEL PAR, CON OTRA DURACIÓN
// ---------------------------------------------------------------------------
// El bloque es el de `slot` del contrato, idéntico en forma al del par: un
// `payload` con el layout de la forma y un asset de aviso con su caja. Dos
// cosas lo separan y las dos salen de `stage.carrera.breaks`:
//
//   LA DURACIÓN es la del break de la carrera -- 6 s -- y no los 12 del par.
//   El porqué está en `stage.json` (`carrera._breaks`): 6 s son dos bucles
//   exactos del creativo y una vuelta entera de su anillo.
//
//   EL MEDIO ES SIEMPRE VIDEO. Esta página no lleva el control de
//   decodificadores, así que no hay escalón magro que servir: hay un solo juego
//   y no dos que tengan que ser idénticos salvo en dos campos.
//
// EL REPLIEGUE DEL APÉNDICE D.2 (ADR 0019) es el creativo 16:9 de la campaña
// del aviso, que es lo mismo que hace el par: un cliente que no lee el bloque
// se queda con el aviso a cuadro entero, que es la forma en que ese creativo
// existe. Repetir ahí la pieza de la forma -- un banner de 8,89:1 a cuadro
// entero -- sería servirle a ese cliente una tira en el medio de una pantalla.
//
// ---------------------------------------------------------------------------
// LA OFERTA: UN CATÁLOGO, Y NADA DE DÓNDE VA
// ---------------------------------------------------------------------------
// La forma es la del ADR 0064 y es la de `demo/race-multiview/`, verbatim: un
// bloque `type: "offer"`, un item `multiViewOffer` con `primaryName`, y
// `views[]` con `id`, `name`, `type` y `uri`. SIN `viewport`, SIN `zDepth` y SIN
// `volume`: son los tres campos que quien publica no puede decidir en una oferta
// -- los dos primeros porque dependen de cuántas cajas levantó quien mira, y el
// tercero porque el estado inicial de audio de una oferta no es una mezcla
// compuesta. La grilla la calcula la librería (ADR 0065), con su tope de cuatro
// (ADR 0066), y el catálogo es más largo que el tope a propósito: si todo lo
// ofrecido entra en pantalla a la vez, elegir no significa nada.
//
// LAS VIEWS SON LAS CÁMARAS DECLARADAS QUE ADEMÁS ESTÁN EMPAQUETADAS, en el
// orden en que `stage.carrera.camaras` las declara, que es el orden en que el
// selector las lista. Es lo que hace que el catálogo crezca empaquetando una
// cámara y no editando una lista -- el chequeo que la fase 13 hizo pasar de una
// a seis sin que nadie tocara un script -- y lo que permite que el test corra
// sobre un árbol de contenido falso, sin un byte de video.
//
// ---------------------------------------------------------------------------
// EL CONTROL, Y ESTÁ ACÁ PORQUE UN CHEQUEO QUE NO PUEDE FALLAR NO ES UN CHEQUEO
// ---------------------------------------------------------------------------
// `CONTROL_AVISO_EN_VENTANA=1` corre el ÚLTIMO aviso adentro de la ventana de
// multi view, que es exactamente lo que esta página afirma que no pasa: los
// avisos primero y la ventana después. Es contra ese rojo que se mide el verde;
// una medición que diga "ningún aviso se solapa con la ventana" sin haber visto
// nunca un solapamiento mide su propio instrumento.
//
// NO se usa en ninguna corrida normal: `senalizar-carrera.sh` sólo lo pasa
// cuando el instrumento se lo pide.
//
// Uso:  escribir-asset-lists-carrera.mjs <stage.json> <carpeta-de-salida> <raíz-del-contenido>

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [stagePath, outDir, contentRoot] = process.argv.slice(2);
if (!stagePath || !outDir || !contentRoot) {
  console.error('uso: escribir-asset-lists-carrera.mjs <stage.json> <carpeta-de-salida> <raíz-del-contenido>');
  process.exit(1);
}

const stage = JSON.parse(readFileSync(stagePath, 'utf8'));
const carrera = stage.carrera;

/** Una ruta de stage.json convertida en la URL que un cliente pide (ADR 0022). */
const url = (ruta) => '/' + ruta.replace(/^\/+/, '');

/** La pieza de una campaña en una forma, que es la fila del inventario. */
function pieza(campana, forma) {
  const p = stage.assets.piezas.find((x) => x.campana === campana && x.forma === forma);
  if (!p) throw new Error(`stage.json no declara la pieza ${campana}/${forma}`);
  return p;
}

/** El `identifiers` del Slot: el AdIdentifier que stage.json declara para la campaña. */
function identificadores(campana) {
  const id = stage.campanas[campana]?.identificador;
  if (!id?.scheme || !id?.value) throw new Error(`stage.json no declara el identificador de la campaña ${campana}`);
  return [{ scheme: id.scheme, value: id.value }];
}

/**
 * El identificador del elemento de aviso, por forma. Los mismos nombres que usa
 * el generador del par, porque es el mismo elemento en el mismo layout.
 */
const ID_DEL_AVISO = { '16x9': 'adSideBySide', backplate: 'lBackplate', banner: 'banner' };

/** El asset-list de un aviso de la carrera. */
function aviso(brk) {
  const forma = stage.formas[brk.forma];
  const p = pieza(brk.campana, brk.forma);

  const elemento = {
    id: ID_DEL_AVISO[brk.forma],
    type: stage.assets.tipos.video,
    uri: url(p.video),
    viewport: forma.viewportAviso,
    zDepth: forma.zDepthAviso
  };

  // El bloque del primario va antes de los assets cuando existe, que es el orden
  // en que los asset-lists del repositorio lo escriben. El lowerThirdOverlay no
  // lo declara, y es la misma ausencia deliberada que en el par: la herramienta
  // de SVTA no lo emite en los dos overlays y la capa asume su preset (ADR 0004).
  const layout = forma.viewportPrimario === undefined
    ? { assets: [elemento] }
    : {
        primaryContent: { zDepth: forma.zDepthPrimario, viewport: forma.viewportPrimario },
        assets: [elemento]
      };

  return {
    ASSETS: [{
      URI: url(pieza(brk.campana, '16x9').video),
      DURATION: brk.duracion,
      'X-AD-CREATIVE-SIGNALING': {
        version: 2,
        type: 'slot',
        // El AdIdentifier de la campaña, obligatorio en el Slot, que es cada ítem
        // del payload y no el sobre (SVTA2053, Code 7; ADR 0093).
        payload: [{
          type: forma.layout, start: 0, duration: brk.duracion,
          identifiers: identificadores(brk.campana),
          layout
        }]
      }
    }]
  };
}

/** El asset-list de la ventana: el catálogo de las cámaras empaquetadas. */
function oferta() {
  const views = carrera.camaras
    .filter((c) => existsSync(join(contentRoot, c.id, 'index.m3u8')))
    .map((c) => ({
      id: c.id,
      name: c.nombre,
      type: stage.assets.tipos.video,
      uri: url(c.video)
    }));
  if (!views.length) throw new Error(`no hay ninguna cámara empaquetada en ${contentRoot}`);

  return {
    ASSETS: [{
      // El URI de nivel superior que el Apéndice D.2 obliga lleva el de la
      // primera vista: es el repliegue del ADR 0019 para un cliente que no lee
      // el bloque, que ve un asset común y no una ventana.
      URI: views[0].uri,
      DURATION: carrera.ofertaDura,
      'X-AD-CREATIVE-SIGNALING': {
        version: 2,
        type: 'offer',
        payload: [{
          type: 'multiViewOffer',
          start: 0,
          duration: carrera.ofertaDura,
          primaryName: carrera.programa.nombre,
          views
        }]
      }
    }]
  };
}

// EL CONTROL: el último aviso se corre adentro de la ventana. Se toca el offset
// y nada más, así que lo que se mide sigue siendo la misma señalización.
const control = process.env.CONTROL_AVISO_EN_VENTANA === '1';
const breaks = carrera.breaks.map((b, i) =>
  control && i === carrera.breaks.length - 1 ? { ...b, offset: carrera.ofertaEn + 10 } : b);

mkdirSync(outDir, { recursive: true });
const escritos = [];
for (const brk of breaks) {
  writeFileSync(join(outDir, brk.lista), JSON.stringify(aviso(brk), null, 2) + '\n');
  escritos.push(brk.lista);
}
writeFileSync(join(outDir, carrera.oferta), JSON.stringify(oferta(), null, 2) + '\n');
escritos.push(carrera.oferta);

// Los offsets salen por stdout porque el CONTROL mueve uno: el señalizador
// escribe los tags con lo que este generador decidió y no con lo que stage.json
// declara, o el control movería el archivo y no el tag.
process.stdout.write(breaks.map((b) => `${b.id}|${b.offset}|${b.lista}`).join('\n') + '\n');
