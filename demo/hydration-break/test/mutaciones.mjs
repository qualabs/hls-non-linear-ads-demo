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
  lasTresFormasDelMinuto
} from './comprobaciones.js';

const leer = (r) => readFileSync(new URL(r, import.meta.url), 'utf8');
const json = (r) => JSON.parse(leer(r));
const copia = (o) => JSON.parse(JSON.stringify(o));

const PLATE = json('../plate.json');
const LISTA = json('../signalling/asset-list-hydration-break.json');
const STORY = json('../story/story.json');
const SENAL = leer('../scripts/senalizar-contenido.sh');

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
  }
];

// El control del control: con los archivos como están, todos los chequeos tienen que dar
// verde. Sin esto, una campaña donde todo da rojo se vería igual de exitosa.
const provider = proveedorDeclarado({ plate: PLATE, assetList: LISTA });
const verdeBase = [
  ['anclasDelGuion', anclasDelGuion({ story: STORY, provider })],
  ['elBreakArrancaEnLaParada', elBreakArrancaEnLaParada({ plate: PLATE, senalizador: SENAL })],
  ['elRepartoSaleDeUnSoloLugar', elRepartoSaleDeUnSoloLugar({ plate: PLATE, assetList: LISTA })],
  ['lasTresFormasDelMinuto', lasTresFormasDelMinuto({ assetList: LISTA })]
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
