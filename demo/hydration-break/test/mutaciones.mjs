// mutaciones.mjs -- la campaña de mutación de los chequeos de esta demo.
//
// POR QUÉ EXISTE, y es lo único que hay que leer de este archivo: **un chequeo que nunca
// se vio fallar no se sabe si puede fallar.** Este proyecto se cruzó tres veces con un
// chequeo escrito de buena fe que no podía dar otra cosa que verde -- el scroll de la
// fase 07 sobre una página que no scrollea, el cuerpo vacío que devuelve 400 exista el
// modelo o no, y el 404 que no distingue "no existe" de "no tenés acceso" -- así que
// acá cada chequeo se rompe a propósito y tiene que ponerse rojo.
//
// UNA ROTURA POR REGLA, Y CADA ROTURA CORRE SÓLO EL CHEQUEO QUE LA CUBRE. No la suite
// entera: una rotura que pone rojo a otro chequeo no prueba nada sobre el suyo.
//
// Correr: node demo/hydration-break/test/mutaciones.mjs
// Sale 0 si TODAS las roturas dieron rojo, y 1 si alguna quedó verde, que es el
// hallazgo.

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

const leer = (r) => readFileSync(new URL(r, import.meta.url), 'utf8');
const json = (r) => JSON.parse(leer(r));
const copia = (o) => JSON.parse(JSON.stringify(o));

const PLATE = json('../plate.json');
const LISTA = json('../signalling/asset-list-hydration-break.json');
const STORY = json('../story/story.json');
const SENAL = leer('../scripts/senalizar-contenido.sh');
// Los dos archivos que dibujan la sección 1, y el identificador que se les planta.
// Sale del asset list y no está escrito acá, por lo mismo que el chequeo lo saca de
// ahí: una copia escrita en este archivo deja de ser el identificador que la galería
// dibuja el día que el asset list cambie, y la rotura pasaría a plantar un nombre que
// ya no le importa a nadie.
const FUENTES = [
  { nombre: 'index.html', texto: leer('../index.html') },
  { nombre: 'js/tipos.js', texto: leer('../js/tipos.js') }
];
// Los rótulos de los pliegues tal como los produce la página. Las roturas de abajo son
// tandas escritas a mano sobre esta misma base: cambiar el asset list no sirve como
// rotura, porque los rótulos lo siguen y el chequeo quedaría verde -- lo que hay que
// romper es la correspondencia entre lo que el pliegue dice y el aviso que tiene adentro.
const ROTULOS = labelsOfAssetList(LISTA);
const PLANTADO = LISTA.ASSETS
  .flatMap((a) => a['X-AD-CREATIVE-SIGNALING']?.payload ?? [])
  .map((item) => item?.type)
  .find((tipo) => typeof tipo === 'string' && tipo.length > 0);
// El MIME que se planta, sacado del asset list por lo mismo que el identificador de
// arriba: escrito acá dejaría de ser el que la sección dibuja el día que el creativo
// cambie de formato.
const MEDIO_PLANTADO = LISTA.ASSETS
  .flatMap((a) => a['X-AD-CREATIVE-SIGNALING']?.payload ?? [])
  .flatMap((item) => item?.layout?.assets ?? [])
  .map((caja) => caja?.type)
  .find((tipo) => typeof tipo === 'string' && tipo.length > 0);
// Las filas de la glosa del bloque tal como las produce la página. Las roturas de abajo
// son tandas armadas a mano sobre esta base: editar el asset list no sirve como rotura,
// porque la glosa lo sigue y el chequeo quedaría verde.
const FILAS = blockGlossOf(LISTA);

const roturas = [
  {
    regla: 'un ancla del guion tiene que caer en un aviso que existe (ADR 0037)',
    rotura: 'el beat del caso de negocio pasa a anclarse al aviso 9 del break 1',
    chequeo: 'anclasDelGuion',
    correr: () => {
      const story = copia(STORY);
      story.beats.find((b) => b.id === 'el-caso-de-negocio').anchor.at.ad = 9;
      return anclasDelGuion({ story, provider: proveedorDeclarado({ plate: PLATE, assetList: LISTA }) });
    }
  },
  {
    regla: 'un beat tiene que frenar ANTES de lo que anuncia (ADR 0037)',
    rotura: 'el mismo beat pasa a tener `lead: -3`, así que resuelve después del aviso',
    chequeo: 'anclasDelGuion',
    correr: () => {
      const story = copia(STORY);
      story.beats.find((b) => b.id === 'el-caso-de-negocio').anchor.lead = -3;
      return anclasDelGuion({ story, provider: proveedorDeclarado({ plate: PLATE, assetList: LISTA }) });
    }
  },
  {
    regla: 'el segundo del break lo declara plate.json y no el script (ADR 0044)',
    rotura: 'el script de señalización pasa a tener el segundo escrito a mano',
    chequeo: 'elBreakArrancaEnLaParada',
    correr: () => elBreakArrancaEnLaParada({
      plate: PLATE,
      senalizador: SENAL.replace(/PARADA=\$\(node -e[^\n]*\n/, 'PARADA=14\n')
    })
  },
  {
    regla: 'la parada del juego tiene que caber adentro del plate (ADR 0044)',
    rotura: `la parada pasa a durar el doble del plate (${PLATE.largo * 2}s sobre ${PLATE.largo}s)`,
    chequeo: 'elBreakArrancaEnLaParada',
    correr: () => elBreakArrancaEnLaParada({
      plate: { ...PLATE, paradaDura: PLATE.largo * 2 },
      senalizador: SENAL
    })
  },
  {
    regla: 'los avisos suman lo que dura la parada (el reparto de plate.json)',
    rotura: 'el overlay de cierre pasa de 24 a 20 s, así que la publicidad no cubre la parada',
    chequeo: 'elRepartoSaleDeUnSoloLugar',
    correr: () => {
      const plate = { ...PLATE, avisos: [16, 16, 8, 20] };
      const assetList = copia(LISTA);
      assetList.ASSETS[3].DURATION = 20;
      return elRepartoSaleDeUnSoloLugar({ plate, assetList });
    }
  },
  {
    regla: 'cada aviso es múltiplo de 8, que es el techo de una generación',
    rotura: 'el lineal vuelve a 10 s, que deja un resto corto en la cadena',
    correr: () => elRepartoSaleDeUnSoloLugar({
      plate: { ...PLATE, avisos: [16, 16, 10, 22] },
      assetList: (() => { const a = copia(LISTA); a.ASSETS[2].DURATION = 10; a.ASSETS[3].DURATION = 22; return a; })()
    }),
    chequeo: 'elRepartoSaleDeUnSoloLugar'
  },
  {
    regla: 'el reparto vive en un solo lugar (plate.json), no en el asset list',
    rotura: 'una DURATION del asset list se edita a mano y deja de coincidir con plate.json',
    chequeo: 'elRepartoSaleDeUnSoloLugar',
    correr: () => {
      const assetList = copia(LISTA);
      assetList.ASSETS[0].DURATION = 12;
      return elRepartoSaleDeUnSoloLugar({ plate: PLATE, assetList });
    }
  },
  {
    regla: 'el minuto declara exactamente un aviso de imagen fija (ADR 0046)',
    rotura: 'el banner pasa de `image/jpeg` a un `.m3u8`, que es lo que la demo deja de demostrar',
    chequeo: 'lasTresFormasDelMinuto',
    correr: () => {
      const assetList = copia(LISTA);
      const caja = assetList.ASSETS[0]['X-AD-CREATIVE-SIGNALING'].payload[0].layout.assets[0];
      caja.type = 'application/vnd.apple.mpegurl';
      caja.uri = '/content/adL/index.m3u8';
      return lasTresFormasDelMinuto({ assetList });
    }
  },
  {
    regla: 'el aviso lineal va tercero (ADR 0043)',
    rotura: 'el lineal se mueve al primer lugar del break',
    chequeo: 'lasTresFormasDelMinuto',
    correr: () => {
      const assetList = copia(LISTA);
      const [lineal] = assetList.ASSETS.splice(2, 1);
      assetList.ASSETS.unshift(lineal);
      return lasTresFormasDelMinuto({ assetList });
    }
  },
  {
    regla: 'el break son cuatro avisos (ADR 0043)',
    rotura: 'se le saca el overlay de cierre',
    chequeo: 'lasTresFormasDelMinuto',
    correr: () => {
      const assetList = copia(LISTA);
      assetList.ASSETS.pop();
      return lasTresFormasDelMinuto({ assetList });
    }
  },
  {
    regla: 'ningún identificador de layout está escrito a mano en la página (ADR 0073)',
    rotura: `a una copia de index.html se le planta \`${PLANTADO}\` como rótulo escrito a ` +
      'mano, que es la galería degradada a una lista de nombres',
    chequeo: 'laGaleriaSeDibujaDelContrato',
    correr: () => laGaleriaSeDibujaDelContrato({
      assetList: LISTA,
      fuentes: FUENTES.map((f) => (f.nombre === 'index.html'
        ? { ...f, texto: `${f.texto}\n<p class="shape__caption">${PLANTADO}</p>\n` }
        : f))
    })
  },
  {
    regla: 'ningún tipo de medio está escrito a mano en la página (ADR 0073)',
    rotura: `a una copia de index.html se le planta \`${MEDIO_PLANTADO}\` escrito al lado del ` +
      'dibujo, que es lo que puede ir en una caja degradado a una lista de formatos',
    chequeo: 'losMediosSalenDelContrato',
    correr: () => losMediosSalenDelContrato({
      assetList: LISTA,
      fuentes: FUENTES.map((f) => (f.nombre === 'index.html'
        ? { ...f, texto: `${f.texto}\n<p class="media__mime">${MEDIO_PLANTADO}</p>\n` }
        : f))
    })
  },
  {
    regla: 'todo campo que el asset list trae está explicado en la glosa del bloque',
    rotura: 'el asset list gana un campo que la herramienta todavía no emitía y la glosa se ' +
      'queda como estaba, así que el lector lo ve en el JSON y la página no dice qué es',
    chequeo: 'laGlosaDelBloqueExplicaSusCampos',
    correr: () => {
      const assetList = copia(LISTA);
      assetList.ASSETS[0]['X-AD-CREATIVE-SIGNALING'].payload[0].layout.assets[0]['X-FIT'] = 'contain';
      return laGlosaDelBloqueExplicaSusCampos({ assetList, filas: FILAS });
    }
  },
  {
    regla: 'la glosa del bloque no explica un campo que el asset list no trae',
    rotura: 'la glosa se escribe a mano y le queda una fila de un campo que este archivo no ' +
      'declara, que se lee como que el archivo lo declara',
    chequeo: 'laGlosaDelBloqueExplicaSusCampos',
    correr: () => laGlosaDelBloqueExplicaSusCampos({
      assetList: LISTA,
      filas: [...FILAS, { level: 'element', name: 'opacity', glossed: true }]
    })
  },
  {
    regla: 'el rótulo de un pliegue nombra el layout de su propio aviso (ADR 0075)',
    rotura: `el pliegue del aviso lineal pasa a decir \`${PLANTADO}\` escrito a mano, que es ` +
      'un rótulo que ya no sale del asset list',
    chequeo: 'cadaPliegueRotulaSuAviso',
    correr: () => cadaPliegueRotulaSuAviso({
      assetList: LISTA,
      rotulos: ROTULOS.map((r, i) => (i === 2 ? `Ad 3 · ${PLANTADO} · 8 s` : r))
    })
  },
  {
    regla: 'hay un pliegue por ASSET y ninguno de menos (ADR 0075)',
    rotura: 'se dibujan tres pliegues para cuatro avisos, que es un aviso del break que la ' +
      'página no muestra en ningún lado',
    chequeo: 'cadaPliegueRotulaSuAviso',
    correr: () => cadaPliegueRotulaSuAviso({ assetList: LISTA, rotulos: ROTULOS.slice(0, -1) })
  },
  {
    regla: 'el rótulo dice la duración que declara su aviso (ADR 0075)',
    rotura: 'el rótulo del primer pliegue se queda con los 12 s de una versión anterior del ' +
      'asset list',
    chequeo: 'cadaPliegueRotulaSuAviso',
    correr: () => cadaPliegueRotulaSuAviso({
      assetList: LISTA,
      rotulos: ROTULOS.map((r, i) => (i === 0 ? r.replace(/\d+(\.\d+)? s/, '12 s') : r))
    })
  },
  {
    regla: 'el ordinal del rótulo es el del aviso que el pliegue tiene adentro (ADR 0075)',
    rotura: 'los dos primeros pliegues se rotulan al revés, que es la lista corrida un lugar',
    chequeo: 'cadaPliegueRotulaSuAviso',
    correr: () => cadaPliegueRotulaSuAviso({
      assetList: LISTA,
      rotulos: [ROTULOS[1], ROTULOS[0], ...ROTULOS.slice(2)]
    })
  },
  {
    regla: 'entre dos placas consecutivas se ve partido (ADR 0037)',
    rotura: 'el beat de la señalización pasa a tener el mismo `lead` que el del banner, así ' +
      'que los dos resuelven en el mismo segundo y una placa entra pegada a la otra',
    chequeo: 'elRitmoDelGuion',
    correr: () => {
      const story = copia(STORY);
      const banner = story.beats.find((b) => b.id === 'el-banner');
      story.beats.find((b) => b.id === 'la-senalizacion').anchor.lead = banner.anchor.lead;
      return elRitmoDelGuion({ story, provider: proveedorDeclarado({ plate: PLATE, assetList: LISTA }) });
    }
  },
  {
    regla: 'ninguna placa se queda en pantalla más que el tope (ADR 0037)',
    rotura: 'el beat de la vuelta pasa de `hold: 7` a `hold: 40`, que con el programa ' +
      'congelado atrás se ve como que la demo se colgó',
    chequeo: 'elRitmoDelGuion',
    correr: () => {
      const story = copia(STORY);
      story.beats.find((b) => b.id === 'la-vuelta').hold = 40;
      return elRitmoDelGuion({ story, provider: proveedorDeclarado({ plate: PLATE, assetList: LISTA }) });
    }
  }
];

// El control del control: con los archivos como están, todos los chequeos tienen que dar
// verde. Sin esto, una campaña donde todo da rojo se vería igual de exitosa.
const provider = proveedorDeclarado({ plate: PLATE, assetList: LISTA });
const verdeBase = [
  ['anclasDelGuion', anclasDelGuion({ story: STORY, provider })],
  ['elBreakArrancaEnLaParada', elBreakArrancaEnLaParada({ plate: PLATE, senalizador: SENAL })],
  ['elRepartoSaleDeUnSoloLugar', elRepartoSaleDeUnSoloLugar({ plate: PLATE, assetList: LISTA })],
  ['lasTresFormasDelMinuto', lasTresFormasDelMinuto({ assetList: LISTA })],
  ['laGaleriaSeDibujaDelContrato', laGaleriaSeDibujaDelContrato({ assetList: LISTA, fuentes: FUENTES })],
  ['losMediosSalenDelContrato', losMediosSalenDelContrato({ assetList: LISTA, fuentes: FUENTES })],
  ['laGlosaDelBloqueExplicaSusCampos', laGlosaDelBloqueExplicaSusCampos({ assetList: LISTA, filas: FILAS })],
  ['cadaPliegueRotulaSuAviso', cadaPliegueRotulaSuAviso({ assetList: LISTA, rotulos: ROTULOS })],
  ['elRitmoDelGuion', elRitmoDelGuion({ story: STORY, provider })]
];

let mal = 0;
console.log('== sin romper nada, todos los chequeos tienen que estar en verde ==');
for (const [nombre, hallazgos] of verdeBase) {
  const ok = hallazgos.length === 0;
  if (!ok) mal += 1;
  console.log(`  ${ok ? 'VERDE' : 'ROJO '}  ${nombre}${ok ? '' : '  <-- ' + hallazgos.join(' | ')}`);
}

console.log('\n== una rotura por regla, y cada una tiene que poner ROJO a su chequeo ==');
for (const r of roturas) {
  const hallazgos = r.correr();
  const rojo = hallazgos.length > 0;
  if (!rojo) mal += 1;
  console.log(`  ${rojo ? 'ROJO ' : 'VERDE'}  ${r.chequeo}`);
  console.log(`         regla:  ${r.regla}`);
  console.log(`         rotura: ${r.rotura}`);
  console.log(`         ${rojo ? 'dijo:   ' + hallazgos[0] : 'NO DIJO NADA: el chequeo no cubre su propia regla'}`);
}

console.log(`\n${mal === 0
  ? `las ${roturas.length} roturas dieron rojo y los ${verdeBase.length} chequeos dan verde sin romper nada`
  : `${mal} problema(s): un chequeo que no puede fallar, o uno que falla sin motivo`}`);
process.exit(mal === 0 ? 0 : 1);
