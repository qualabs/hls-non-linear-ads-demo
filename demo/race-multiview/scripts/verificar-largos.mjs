#!/usr/bin/env node
// verificar-largos.mjs -- lo que el empaquetado dejó en content/ dura lo que race.json
// declara y está cortado en la grilla que se le pidió, medido SOBRE LA PLAYLIST SERVIDA.
//
// ----------------------------------------------------------------------------------------
// POR QUÉ SE SUMAN LOS #EXTINF Y NO SE MIRA EL -t QUE SE LE PASÓ A FFMPEG
// ----------------------------------------------------------------------------------------
// El `-t 112` del empaquetado es LA ENTRADA. Leerlo de vuelta y declarar que la pieza dura
// 112 s es repetir la orden, no medir el resultado: es exactamente "una referencia que
// devuelve lo que le pediste". Lo que el player reproduce, y lo que un cliente lee para
// saber dónde cae un START-DATE, es la suma de los #EXTINF de la playlist servida.
//
// LO QUE ESTO ATRAPA es una pieza que no dura lo que declara, y el caso que importa acá es
// una cámara más corta que su ventana: la caja se queda vacía antes de que la ventana
// cierre, que es lo que le pasa a Sintel en la demo de la fase 11 -- 52,2 s contra una
// ventana de 55 -- y que allá se declaró en vez de arreglarse. Acá el material se produce,
// así que se produce del largo correcto y se comprueba que salió así.
//
// ----------------------------------------------------------------------------------------
// Y LA SEGUNDA PROPIEDAD, QUE ES LA GRILLA, PORQUE LA PRIMERA NO LA VE
// ----------------------------------------------------------------------------------------
// El GOP tiene que ser dos segundos de cuadros -- 48 a 24 fps -- para que los cortes de
// `-hls_time 2` caigan sobre un keyframe. Con el GOP desacoplado del fps, que es el defecto
// exacto que el ADR 0059 previene, el keyframe cae cada 2,5 s y ffmpeg corta ahí.
//
// MEDIDO, PORQUE LA INTUICIÓN ERA OTRA: eso NO mueve la suma. Empaquetada la misma cámara
// con `-g 60` a 24 fps salen 26 segmentos de 2,500 s más una cola de 1,500, y la suma da
// 64,000000 s igual que la buena. Lo que sí rompe es la playlist: declara
// `#EXT-X-TARGETDURATION:2` y adentro lleva segmentos de 2,5, que es una playlist inválida
// -- el RFC 8216 4.3.3.1 pide que ningún #EXTINF pase el target duration -- y ffmpeg no
// dice una palabra.
//
// Así que son dos mediciones y no una, cada una con su forma de dar distinto.
//
// ----------------------------------------------------------------------------------------
// LOS CONTROLES, SIN LOS CUALES ESTO NO ES UN CHEQUEO
// ----------------------------------------------------------------------------------------
// Los dos se arman ROMPIENDO LA PLAYLIST REAL y se miden con la misma función que mide la
// buena, no con una escrita para el control:
//
//   recortada    se le saca el último segmento. Rompe la suma y deja la grilla intacta.
//   estirada     se le cambia un #EXTINF de 2,000 a 2,500, que es el mismo archivo que sale
//                del GOP desacoplado. Rompe las dos.
//
// Uso:  ./verificar-largos.mjs        (sale 0 si pasan las reales y los controles dan rojo)
import fs from 'node:fs';
import path from 'node:path';

const AQUI = path.dirname(new URL(import.meta.url).pathname);
const DEMO = path.resolve(AQUI, '..');
const race = JSON.parse(fs.readFileSync(path.join(DEMO, 'race.json'), 'utf8'));

// LA TOLERANCIA ES UN CUADRO Y SE DICE POR QUÉ. Los #EXTINF los escribe ffmpeg con seis
// decimales sobre los tiempos del mpegts, cuyo reloj es de 90 kHz: la suma de una pieza de
// 112,000 s puede cerrar unos microsegundos al costado sin que falte ni sobre un cuadro. Un
// cuadro a 24 fps son 41,7 ms, y cualquier defecto que importe -- un segmento de menos, un
// keyframe corrido -- se mide en cientos de milisegundos para arriba.
const TOLERANCIA = 1 / race.fps;

const extinfs = (texto) => [...texto.matchAll(/^#EXTINF:([0-9.]+)/gm)].map((m) => Number(m[1]));
const targetDuration = (texto) => Number(texto.match(/^#EXT-X-TARGETDURATION:(\d+)/m)?.[1]);

function medir(etiqueta, texto, esperado) {
  const segmentos = extinfs(texto);
  const medido = segmentos.reduce((total, s) => total + s, 0);
  const target = targetDuration(texto);
  const pasados = segmentos.filter((s) => s > target + TOLERANCIA);

  const duraLoQueDice = Math.abs(medido - esperado) <= TOLERANCIA;
  const enLaGrilla = Number.isFinite(target) && pasados.length === 0;
  const pasa = duraLoQueDice && enLaGrilla;

  console.log(
    `${pasa ? 'VERDE' : 'ROJO '}  ${etiqueta.padEnd(34)} ` +
    `${medido.toFixed(6)} s contra ${esperado.toFixed(3)} declarados ` +
    `(${(medido - esperado).toFixed(6)} s) · ` +
    `${segmentos.length} segmentos, target ${target} s, ` +
    (pasados.length
      ? `${pasados.length} lo pasan: ${[...new Set(pasados.map((s) => s.toFixed(3)))].join(' ')}`
      : 'ninguno lo pasa')
  );
  return pasa;
}

// LAS PIEZAS: el programa contra `largo`, y cada cámara empaquetada contra `ofertaDura`. Las
// cámaras se buscan por lo que race.json declara y no listando content/, porque un
// directorio que sobró de otra corrida no es una cámara de esta demo.
const piezas = [
  { etiqueta: 'el programa', ruta: 'content/primary/index.m3u8', esperado: race.largo },
  ...race.feeds
    .map((f) => ({
      etiqueta: f.name,
      ruta: path.join('content', f.id, 'index.m3u8'),
      esperado: race.ofertaDura
    }))
    .filter((p) => fs.existsSync(path.join(DEMO, p.ruta)))
];

const primaria = path.join(DEMO, piezas[0].ruta);
if (!fs.existsSync(primaria)) {
  console.error('falta content/primary/index.m3u8: correr ./scripts/preparar-contenido.sh');
  process.exit(1);
}

console.log(`race.json: largo ${race.largo} s, ofertaDura ${race.ofertaDura} s, ${race.fps} fps`);
console.log(`tolerancia: un cuadro, ${(TOLERANCIA * 1000).toFixed(1)} ms\n`);

let todas = true;
for (const pieza of piezas) {
  const texto = fs.readFileSync(path.join(DEMO, pieza.ruta), 'utf8');
  todas = medir(pieza.etiqueta, texto, pieza.esperado) && todas;
}

// LOS CONTROLES, sobre la playlist del programa y con su mismo esperado.
const texto = fs.readFileSync(primaria, 'utf8');
const lineas = texto.split('\n');
const ultimo = lineas.map((l, i) => (l.startsWith('#EXTINF:') ? i : -1)).filter((i) => i >= 0).pop();
const recortada = [...lineas.slice(0, ultimo), ...lineas.slice(ultimo + 2)].join('\n');
const estirada = texto.replace(/^#EXTINF:[0-9.]+/m, '#EXTINF:2.500000');

console.log();
const ctrlCorta = medir('CONTROL sin el último segmento', recortada, race.largo);
const ctrlLarga = medir('CONTROL con un #EXTINF estirado', estirada, race.largo);

console.log();
if (!todas) {
  console.log('FALLA: una pieza no dura lo que declara, o sus segmentos no entran en su grilla.');
  process.exit(1);
}
if (ctrlCorta || ctrlLarga) {
  console.log('FALLA AL REVÉS: un control dio VERDE, o sea que esta medición aprueba cualquier cosa.');
  process.exit(1);
}
console.log('PASA, y se vieron los dos controles en rojo.');
