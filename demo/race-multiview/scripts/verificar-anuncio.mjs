// verificar-anuncio.mjs -- el fin HABLADO de la linea del anuncio cae adentro de la
// ventana de medio segundo que abre la senalizacion, y no cerca.
//
// ----------------------------------------------------------------------------------------
// QUE MIDE, Y POR QUE NO MIDE LO QUE ESTA EN tiempos.json
// ----------------------------------------------------------------------------------------
// tiempos.json dice donde se PUSO el archivo. Eso no es el fin hablado: cada linea lleva
// 60 ms de aire adelante y 60 atras, puestos por el recorte de generar-relato.sh, asi que
// el archivo termina despues de que la voz se callo. Verificar la aritmetica contra la
// misma aritmetica que la produjo no verifica nada -- es el error de "una referencia que
// devuelve lo que le pediste".
//
// Asi que se mide SOBRE EL AUDIO RENDIDO: se busca el ultimo instante en que el relato
// esta por encima del umbral, adentro de la ventana que va del arranque del anuncio al
// arranque de la linea siguiente. Ese es el fin hablado, y tiene que caer en
// [ofertaEn - 0,5 ; ofertaEn], con ofertaEn leido de race.json -- el mismo archivo del que
// lo va a leer el EXT-X-DATERANGE.
//
// ----------------------------------------------------------------------------------------
// EL CONTROL, SIN EL CUAL ESTO NO ES UN CHEQUEO
// ----------------------------------------------------------------------------------------
// La misma comprobacion sobre una copia con la linea corrida tiene que ponerse ROJA. Se
// corren dos copias, +3 s y -3 s, y las dos las rinde armar-relato.mjs -- el mismo
// renderizador, no uno escrito para el control -- porque un control armado con otra
// herramienta mide la otra herramienta.
//
// Las dos dan rojo por caminos distintos y las dos valen:
//   +3 s  la voz todavia esta hablando cuando arranca la linea siguiente, o sea que el
//         anuncio ya no termina en ningun lado antes de la ventana.
//   -3 s  la voz termina limpia, pero TRES SEGUNDOS ANTES de la ventana. Es el defecto
//         exacto que Nicolas nombro -- "cerca" en lugar de "en" -- y el unico de los dos
//         que devuelve un numero que se puede leer.
//
// Uso:  node verificar-anuncio.mjs        (sale 0 si pasa y el control da rojo)
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const aqui = path.dirname(new URL(import.meta.url).pathname);
const DEMO = path.resolve(aqui, "..");
const race = JSON.parse(fs.readFileSync(path.join(DEMO, "race.json"), "utf8"));
const tiempos = JSON.parse(fs.readFileSync(path.join(DEMO, "audio/tiempos.json"), "utf8"));
const TRABAJO = path.join(DEMO, "content/.fuentes/audio");

const UMBRAL = "-50dB";   // entre dos lineas el render deja silencio digital, no ruido
const MINIMO = 0.10;      // s de silencio para contar como "se callo"

const DESDE = race.ofertaEn - 0.5, HASTA = race.ofertaEn;

// El ultimo instante hablado dentro de [desde, hasta) de un .wav.
function finHablado(wav, desde, hasta, piso) {
  // silencedetect reporta por stderr, asi que la salida se lee de ahi y no de stdout.
  const salida = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-ss", String(desde),
    "-to", String(hasta), "-i", wav, "-af", `silencedetect=n=${UMBRAL}:d=${MINIMO}`,
    "-f", "null", "-"], { encoding: "utf8" }).stderr;
  // ffmpeg reporta relativo al -ss. El arranque de silencio que interesa es el que viene
  // DESPUES de que la linea empezo: el silencio de antes es el aire que la precede, y
  // tomarlo como "fin hablado" hace que una linea corrida hacia adelante -- que todavia
  // esta sonando al final de la ventana -- devuelva un numero en lugar de un rojo.
  const arranques = [...salida.matchAll(/silence_start: ([-0-9.]+)/g)]
    .map(m => +m[1] + desde).filter(t => t > piso);
  return arranques.length ? arranques[arranques.length - 1] : null;
}

function medir(wav, etiqueta, inicioAnuncio) {
  const i = tiempos.findIndex(f => f.anuncio);
  const siguiente = tiempos[i + 1];
  const tope = Math.min(siguiente.inicio, inicioAnuncio + race.anuncioLargoMax + 0.5);
  const fin = finHablado(wav, +(inicioAnuncio - 0.2).toFixed(3), +tope.toFixed(3),
                         inicioAnuncio + 0.05);
  const pasa = fin !== null && fin >= DESDE && fin <= HASTA;
  const dicho = fin === null
    ? `seguia hablando en ${tope.toFixed(3)} s, que es donde arranca la linea siguiente`
    : `fin hablado ${fin.toFixed(3)} s`;
  console.log(`${pasa ? "VERDE" : "ROJO "}  ${etiqueta.padEnd(34)} ${dicho}   ventana [${DESDE} ; ${HASTA}]`);
  return pasa;
}

const a = tiempos.find(f => f.anuncio);

const variante = (corrimiento, nombre) => {
  const wav = path.join("/dev/shm", nombre);
  execFileSync("node", [path.join(aqui, "armar-relato.mjs"), "--salida", wav,
                        "--correr", `${a.id}:${corrimiento}`], { stdio: ["ignore", "ignore", "inherit"] });
  return wav;
};

console.log(`la linea: "${a.texto}"   ${a.d} s   anuncioLargoMax ${race.anuncioLargoMax} s`);
console.log(`race.json: ofertaEn ${race.ofertaEn} s\n`);

const real = medir(path.join(TRABAJO, "relato.wav"), "el relato como se entrega", a.inicio);

const wavMas = variante(3, `control-anuncio-mas3-${process.pid}.wav`);
const wavMenos = variante(-3, `control-anuncio-menos3-${process.pid}.wav`);
const ctrlMas = medir(wavMas, "CONTROL la linea corrida +3 s", a.inicio + 3);
const ctrlMenos = medir(wavMenos, "CONTROL la linea corrida -3 s", a.inicio - 3);
for (const w of [wavMas, wavMenos]) fs.rmSync(w, { force: true });

console.log();
if (!real) { console.log("FALLA: el anuncio no termina adentro de la ventana."); process.exit(1); }
if (ctrlMas || ctrlMenos) {
  console.log("FALLA AL REVES: un control corrido dio VERDE, o sea que esta medicion aprueba cualquier cosa.");
  process.exit(1);
}
console.log("PASA, y se vieron los dos controles en rojo.");
