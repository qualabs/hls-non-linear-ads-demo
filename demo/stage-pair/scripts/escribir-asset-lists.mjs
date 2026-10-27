#!/usr/bin/env node
// escribir-asset-lists.mjs -- los asset-lists del par, derivados de stage.json y
// de nada más.
//
// UNO POR BREAK, Y LO LEEN LOS DOS CLIENTES (ADR 0090). El manifest de
// interstitials y el concurrente apuntan, para el mismo break, a este mismo
// archivo: su parte ESTÁNDAR -- `URI` y `DURATION` de cada asset, el Apéndice D.2
// -- es lo que reproduce el player de fábrica, y el bloque
// `X-AD-CREATIVE-SIGNALING` que va encima es lo que lee nuestra librería, que cae
// a esa misma parte estándar cuando no puede dibujar (ADR 0019). El break A no
// tiene default (ADR 0087): su asset no lleva `URI` y el manifest de interstitials
// no lo nombra.
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
// Las dos opciones son DE LA MISMA CAMPAÑA y duran lo mismo, y la de imagen va en
// OTRA FORMA que la de video (`formaImagen`, ADR 0088): el side by side pasa a la
// L, la L al side by side, el banner a la L. Con dos navegadores lado a lado, dos
// decodificadores contra uno con imágenes, se tienen que ver como experiencias
// distintas. Las dos salen de la misma función, con el medio y la forma como
// únicos argumentos, y el resto de stage.json.
//
// Los archivos van a git: no contienen ni un instante, así que son función pura
// de stage.json y un cambio de señalización se ve en un diff. Las playlists no,
// porque llevan un START-DATE de hora de pared (ADR 0005).
//
// ---------------------------------------------------------------------------
// LO QUE CADA CAMPO ES, Y DE DÓNDE SALE
// ---------------------------------------------------------------------------
//   URI de nivel superior     EL DEFAULT del break y LA PARTE ESTÁNDAR: lo que el
//       player de fábrica reproduce, y lo que la librería reproduce a cuadro
//       entero cuando no queda ninguna opción que se pueda dibujar (ADR 0019). Es
//       el creativo 16:9 de la campaña. EL BREAK SIN DEFAULT NO LO LLEVA, y sin él la librería saltea el
//       asset (D.5). D.2 hace obligatorio el `URI`; el ADR 0087 dice por qué acá
//       la ausencia es la forma de decir "sin default".
//
//   layoutOptions[n]          el layout de la forma de esa opción (`forma` para el
//       video, `formaImagen` para la imagen) con su caja de stage.json, y el
//       asset: el HLS que produjo el puente de la T-05, o el SVG CONGELADO de la
//       pieza de esa forma (`svgFijo`), sin animación, para que la imagen se lea
//       como imagen.
//
//   THE TWINS (phase 17, ADR 0096). Right after the HLS option goes the same
//       option with the piece's progressive VP9 MP4 (`mp4`, with its `codecs`
//       from `mp4Codecs`), and right after the SVG option the same option with
//       its PNG (`pngFijo`). Between an option and its twin only `type`, `uri`
//       and `codecs` change. They are for a client that draws neither a second
//       HLS nor an SVG, the Roku. The web picks one only when its original
//       fails to load, as the next option that fits (ADR 0107): to the library a
//       twin asks for exactly what the option before it asks for, and the first
//       that fits wins (ADR 0097). So the order is not cosmetic: a twin placed
//       before its original would change what the web draws. A twin goes only
//       where its piece declares it (`mp4`, `pngFijo`).
//
//   primeraOpcionRota         A FIRST OPTION THAT FAILS ON PURPOSE. A break that
//       declares it gets its first layoutOption written with that URI instead of
//       the piece's, a path that does not exist, so the renderer's failover (ADR
//       0107) is seen working in the demo: the 404 sends it to the next option.
//       Only the first option's `uri` changes; the rest and the default stay
//       real. Break C carries it (`_primeraOpcionRota` in stage.json says why).
//
//   primaryContent            lo declaran los dos squeezeback y NO el
//       lowerThirdOverlay, que es una ausencia deliberada y argumentada en
//       stage.json (`formas.banner._sinPrimario`).
//
// ---------------------------------------------------------------------------
// EL CONTROL DEL TRAMO INVERTIDO
// ---------------------------------------------------------------------------
// `CONTROL_DURACION_CONCURRENTE=<segundos>` escribe la `DURATION` de cada
// asset-list con esa duración en lugar de la del break. El player de fábrica
// reproduce el creativo hasta que termina (12 s) y la librería ubica la ventana
// con la `DURATION` declarada, así que los dos panes salen del break en segundos
// distintos: es el control de test/medir-tramo-invertido.py. No se usa en ninguna
// corrida normal.
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

/** La variante de imagen de una pieza: su SVG congelado, que stage.json declara. */
function fijo(p) {
  if (!p.svgFijo) throw new Error(`stage.json no declara svgFijo para ${p.campana}/${p.forma}`);
  return p.svgFijo;
}

/**
 * The element of an option in each medium: its `type`, its `uri`, and the
 * `codecs` the MP4 carries. 'video' and 'imagen' are the web's; 'mp4' and 'png'
 * their twins (ADR 0096).
 */
function medioDe(p, medio) {
  const tipos = stage.assets.tipos;
  const requerido = (campo) => {
    if (!p[campo]) throw new Error(`stage.json no declara ${campo} para ${p.campana}/${p.forma}`);
    return p[campo];
  };
  switch (medio) {
    case 'video': return { type: tipos.video, uri: url(p.video) };
    case 'mp4': return { type: tipos.mp4, codecs: requerido('mp4Codecs'), uri: url(requerido('mp4')) };
    case 'imagen': return { type: tipos.imagen, uri: url(fijo(p)) };
    case 'png': return { type: tipos.png, uri: url(requerido('pngFijo')) };
    default: throw new Error(`medio desconocido: ${medio}`);
  }
}

/**
 * Una opción de presentación del aviso de un break, en el medio que se le pida.
 *
 * `medio` es 'video', 'mp4', 'imagen' o 'png', y decide la forma: la del break
 * para el video y su gemela, `formaImagen` para la imagen y la suya (ADR 0088).
 * La campaña es la del break en todas.
 */
function opcion(brk, medio) {
  const enVideo = medio === 'video' || medio === 'mp4';
  const nombreForma = enVideo ? brk.forma : brk.formaImagen;
  if (!nombreForma) throw new Error(`stage.json no declara formaImagen para el break ${brk.id}`);
  const forma = stage.formas[nombreForma];
  const p = pieza(brk.campana, nombreForma);
  const aviso = {
    id: ID_DEL_AVISO[nombreForma],
    // La imagen es el SVG CONGELADO (fase 15): con movimiento, una imagen se lee
    // como un video. Sin `svgFijo` declarado el break no tiene opción de imagen
    // que servir, y se dice en lugar de servir la animada.
    ...medioDe(p, medio),
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

/** The media of a break's options, in the order they are offered: each twin right after its original (ADR 0097). */
const MEDIOS = ['video', 'mp4', 'imagen', 'png'];

/**
 * Whether the break has an option in that medium. The web's two always (a
 * missing one is an error `opcion` reports); a twin only when the piece it
 * would be made from declares it (`mp4`, `pngFijo`). The preroll and the
 * postroll came after phase 17 and their banners have no MP4 yet: they offer
 * the twins their pieces have, and the order of the rest does not change.
 */
function tieneMedio(brk, medio) {
  if (medio === 'video' || medio === 'imagen') return true;
  const p = pieza(brk.campana, medio === 'mp4' ? brk.forma : brk.formaImagen);
  return Boolean(medio === 'mp4' ? p.mp4 : p.pngFijo);
}

/** El `identifiers` del Slot: el AdIdentifier que stage.json declara para la pieza (ADR 0093). */
function identificadores(campana, forma) {
  const id = pieza(campana, forma).identificador;
  if (!id?.scheme || !id?.value) throw new Error(`stage.json no declara el identificador de la pieza ${campana}/${forma}`);
  return [{ scheme: id.scheme, value: id.value }];
}

/** El asset-list de un break: la parte estándar (su default, si tiene) y el aviso con sus dos opciones. */
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
      // El AdIdentifier de la pieza, obligatorio en el Slot, que es cada ítem
      // del payload y no el sobre (SVTA2053, Code 7; ADR 0093).
      identifiers: identificadores(brk.campana, brk.forma),
      // En orden de preferencia (R5.5): primero el video, después la imagen,
      // cada una seguida de su gemela cuando la pieza la declara (ADR 0096 y 0097).
      layoutOptions: MEDIOS.filter((medio) => tieneMedio(brk, medio)).map((medio) => opcion(brk, medio))
    }]
  };
  // The deliberate failover demonstration: the first option points at a URI
  // that does not exist (`primeraOpcionRota`).
  if (brk.primeraOpcionRota) {
    asset['X-AD-CREATIVE-SIGNALING'].payload[0].layoutOptions[0].layout.assets[0].uri = url(brk.primeraOpcionRota);
  }
  return { ASSETS: [asset] };
}

/**
 * El asset-list del break lineal tradicional (ADR 0115): SÓLO la parte estándar,
 * el `URI` y la `DURATION` del Apéndice D.2, porque su tag es de la clase de
 * Apple y lo reproduce hls.js en los dos panes. Sin bloque: no hay nada que
 * dibujar. La pieza es el 16:9 de su campaña, que ya existe.
 */
function lineal(brk) {
  return { ASSETS: [{ URI: url(pieza(brk.campana, '16x9').video), DURATION: brk.duracion }] };
}

mkdirSync(outDir, { recursive: true });
const escritos = [];
for (const brk of stage.breaks) {
  writeFileSync(join(outDir, brk.concurrente), JSON.stringify(concurrente(brk), null, 2) + '\n');
  escritos.push(brk.concurrente);
}
if (stage.breakLineal) {
  writeFileSync(join(outDir, stage.breakLineal.lista), JSON.stringify(lineal(stage.breakLineal), null, 2) + '\n');
  escritos.push(stage.breakLineal.lista);
}

// ---------------------------------------------------------------------------
// EL LADO DASH (fase 19): un sobre `slot` por break, lo que contesta su `$remote.slots`
// ---------------------------------------------------------------------------
// El MPD señalizado lleva un Event por break con un sobre `pod` cuyo Pod apunta,
// en `$remote.slots`, a este archivo (ADR 0120). Es EL MISMO Slot que el bloque del
// asset-list de HLS del mismo break -- mismas opciones, mismo orden, mismas gemelas
// PNG y MP4 (ADR 0096) -- con dos diferencias, las dos de transporte: el video es
// el MPD que `empaquetar-dash.sh` escribe al lado de cada playlist, y el default
// lineal, que en HLS es el `URI` del asset, es el `media` del Slot (ADR 0122). Se
// arma DESDE el asset-list de HLS y no aparte, así que no pueden divergir en nada
// que no sea eso.
const MPD = 'application/dash+xml';
const mpdDe = (uri) => {
  if (!/\/index\.m3u8$/.test(uri)) throw new Error(`no sé dónde está el MPD de ${uri}`);
  return uri.replace(/index\.m3u8$/, 'dash/manifest.mpd');
};
const enDash = (opt) => ({
  ...opt,
  layout: {
    ...opt.layout,
    assets: opt.layout.assets.map((x) => (x.type === stage.assets.tipos.video ? { ...x, type: MPD, uri: mpdDe(x.uri) } : x))
  }
});
function slotsDash(brk) {
  const [asset] = concurrente(brk).ASSETS;
  const { layoutOptions, ...slot } = asset['X-AD-CREATIVE-SIGNALING'].payload[0];
  if (asset.URI) slot.media = [{ type: MPD, id: `${brk.campana}-16x9`, uri: mpdDe(asset.URI) }];
  return { version: 2, type: 'slot', payload: [{ ...slot, layoutOptions: layoutOptions.map(enDash) }] };
}
mkdirSync(join(outDir, 'dash'), { recursive: true });
for (const brk of stage.breaks) {
  const nombre = join('dash', `slots-break-${brk.id}.json`);
  writeFileSync(join(outDir, nombre), JSON.stringify(slotsDash(brk), null, 2) + '\n');
  escritos.push(nombre);
}
process.stdout.write(escritos.join('\n') + '\n');
