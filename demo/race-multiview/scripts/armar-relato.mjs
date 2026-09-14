// armar-relato.mjs -- ubica las diecinueve lineas sobre los 112 s del programa y rinde
// la pista de voces sola.
//
// ----------------------------------------------------------------------------------------
// EL ANCLA, QUE ES LA RAZON DE SER DE ESTE ARCHIVO
// ----------------------------------------------------------------------------------------
// Una sola linea tiene el tiempo mandado desde afuera: la del anuncio. Tiene que TERMINAR
// DE DECIRSE en [ofertaEn - 0,5 ; ofertaEn], o sea que la voz entra ANTES que el tag. Es
// lo que la demo del partido midio y dejo escrito -- el silbato cae 0,2 s antes de que el
// grafico cambie, "que es como pasa en una transmision: primero se oye, despues se ve".
//
// ofertaEn SALE DE race.json Y NO SE TIPEA ACA. Es el ADR 0044 otra vez: el segundo se
// declara una sola vez y lo leen los dos lados -- este armado y el script que escribe el
// EXT-X-DATERANGE. Dos numeros tipeados en dos archivos se despegan el dia que alguien
// mueve uno, y el defecto que aparece es justo el que Nicolas nombro: el anuncio cae CERCA
// de la ventana y no EN ella.
//
// Las demas lineas no tienen ancla externa: tienen la casilla que estan contando. Una
// linea que habla de la pelea de la casilla 6 arranca cuando esa casilla esta en pantalla.
//
// ----------------------------------------------------------------------------------------
// LOS TURNOS SE PEGAN, Y LOS HUECOS SON DONDE CORTA EL REALIZADOR
// ----------------------------------------------------------------------------------------
// Entre dos personas que conversan hay dos o tres decimas, no dos segundos: por eso las
// lineas de respuesta (inicio null) salen a HUECO segundos de la anterior y no en un
// instante fijo. Los huecos largos que quedan caen en los cortes, que es donde un relator
// de verdad deja respirar la imagen.
//
// ----------------------------------------------------------------------------------------
// POR QUE ESTE ARCHIVO TAMBIEN RINDE EL .wav, EN LUGAR DE SOLO CALCULAR TIEMPOS
// ----------------------------------------------------------------------------------------
// Porque el control del anuncio necesita rendir una variante -- la misma pista con la
// linea corrida 3 s -- y un control que se arma con OTRO renderizador no controla nada:
// mediria el segundo renderizador. verificar-anuncio.mjs invoca a este mismo con
// --correr y compara las dos salidas del mismo codigo.
//
// Uso:
//   node armar-relato.mjs                              escribe audio/tiempos.json y el relato.wav de trabajo
//   node armar-relato.mjs --salida X.wav --correr 04:3 rinde una variante y no toca tiempos.json
//
// --correr <id>:<segundos> corre UNA linea de su lugar, y existe para los controles: es lo
// que deja que verificar-anuncio.mjs y verificar-linea-15.mjs vean su medicion en ROJO sin
// escribir un segundo renderizador. Quien corre la linea es el que verifica, y nombra el id
// que leyo del guion en lugar de tipearlo.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const aqui = path.dirname(new URL(import.meta.url).pathname);
const DEMO = path.resolve(aqui, "..");
const AUDIO = path.join(DEMO, "audio");
const LINEAS = path.join(AUDIO, "lineas");
// Los .wav de trabajo -- el relato rendido y el ambiente -- viven en content/.fuentes/,
// que esta gitignoreado. audio/ guarda solo lo que va al repositorio.
const TRABAJO = path.join(DEMO, "content/.fuentes/audio");
fs.mkdirSync(TRABAJO, { recursive: true });

const arg = (n, d) => { const i = process.argv.indexOf(n); return i < 0 ? d : process.argv[i + 1]; };
const SALIDA = arg("--salida", path.join(TRABAJO, "relato.wav"));
const CORRER = arg("--correr", null);                       // "<id>:<segundos>"
const CORRER_ID = CORRER ? CORRER.split(":")[0] : null;
const CORRER_SEG = CORRER ? parseFloat(CORRER.split(":")[1]) : 0;
const ESCRIBE_TIEMPOS = !CORRER && !process.argv.includes("--salida");

const race = JSON.parse(fs.readFileSync(path.join(DEMO, "race.json"), "utf8"));
const guion = JSON.parse(fs.readFileSync(path.join(aqui, "relato/guion.json"), "utf8"));

// El fin hablado del anuncio: adentro de [ofertaEn - 0,5 ; ofertaEn] y con margen a los
// dos bordes, porque el borde de una ventana de medio segundo no es un lugar donde
// pararse. 0,30 es del mismo orden que los 0,2 s que midio la demo del partido.
const FIN_ANUNCIO = race.ofertaEn - 0.30;

// [id, inicio]  --  null = le contesta a la anterior, a HUECO segundos
const PLAN = [
  ["01",   0.50],  // casilla 1: los seis juntos, la camara viajando con ellos
  ["02",   8.30],  // casilla 2: Caldrix solo
  ["03",  15.90],  // casilla 3: Marvok sale del rebufo. Entra medio segundo antes del corte
  ["04", "ANUNCIO"],  // casilla 4: el plano general de los seis por la recta
  ["05",   null],
  ["06",  32.30],  // casilla 5: Noctev solo por un tramo abierto
  ["07",  40.30],  // casilla 6: la frenada de Runtak y Pentav
  ["08",  48.20],  // casilla 7: Quentra por afuera
  ["09",   null],
  ["10",  56.40],  // casilla 8: Caldrix solo, el cruce de la compuerta 2
  ["11",  63.60],  // casilla 9: Marvok y Noctev rueda a rueda por el curvon
  ["12",   null],
  ["13",  73.10],  // casilla 10: el tramo costero, con el mar detras de los dos autos
  ["14",  80.30],  // casilla 11: el plano general de la costa
  ["15",  88.20],  // casilla 12: Runtak al lado del piano. Ese plano se termina a los
                   //             4,375 s del clip, asi que la linea tiene que terminar
                   //             antes; lo mide verificar-linea-15.mjs contra el clip
  ["16",   null],
  ["17",  96.40],  // casilla 13: la recta principal, la diferencia cerrada
  ["18",   null],
  ["19", 105.00],  // casilla 14: la tribuna
];
const HUECO = 0.32;

const dur = id => parseFloat(execFileSync("ffprobe",
  ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
   path.join(LINEAS, `linea-${id}.m4a`)]).toString());

let t = 0;
const filas = [];
for (const [id, fijo] of PLAN) {
  const l = guion.find(x => x.id === id);
  const d = dur(id);
  let inicio;
  if (fijo === "ANUNCIO") inicio = +(FIN_ANUNCIO - d).toFixed(3);
  else if (fijo === null)  inicio = +(t + HUECO).toFixed(3);
  else                     inicio = fijo;
  if (id === CORRER_ID) inicio = +(inicio + CORRER_SEG).toFixed(3);
  filas.push({ id, voz: l.voz, casilla: l.casilla, inicio, fin: +(inicio + d).toFixed(3),
               d: +d.toFixed(3), anuncio: !!l.anuncio, texto: l.texto });
  t = inicio + d;
}

// Las tres cosas que tienen que dar rojo si el guion crece o una linea se regenera mas
// larga. No son adorno: cualquiera de las tres rompe el montaje en silencio.
if (!CORRER) {
  for (const f of filas) if (f.fin > race.largo) throw new Error(`${f.id} se pasa de los ${race.largo} s: ${f.fin}`);
  for (let i = 1; i < filas.length; i++)
    if (filas[i].inicio < filas[i - 1].fin)
      throw new Error(`${filas[i].id} se pisa con ${filas[i - 1].id}: ${filas[i].inicio} < ${filas[i - 1].fin}`);
  const a = filas.find(f => f.anuncio);
  if (a.d > race.anuncioLargoMax)
    throw new Error(`el anuncio dura ${a.d} s y anuncioLargoMax es ${race.anuncioLargoMax}`);
  const casillaDelAnuncio = Math.floor(race.ofertaEn / race.clipDura) * race.clipDura;
  if (a.inicio < casillaDelAnuncio)
    throw new Error(`el anuncio arranca en ${a.inicio} y se derrama fuera de la casilla que empieza en ${casillaDelAnuncio}`);
}

// El render: cada linea con su retardo, sumadas sin normalizar -- no se pisan, asi que
// sumar es exacto -- y recortadas al largo del programa.
const partes = filas.map((f, i) => `[${i}:a]adelay=${Math.round(f.inicio * 1000)}:all=1[v${i}]`);
const etiquetas = filas.map((_, i) => `[v${i}]`).join("");
const filtro = `${partes.join(";")};${etiquetas}amix=inputs=${filas.length}:duration=longest:normalize=0,` +
               `apad=whole_dur=${race.largo},atrim=end=${race.largo},asetpts=N/SR/TB[out]`;
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y",
  ...filas.flatMap(f => ["-i", path.join(LINEAS, `linea-${f.id}.m4a`)]),
  "-filter_complex", filtro, "-map", "[out]", "-ac", "1", "-ar", "48000",
  "-c:a", "pcm_s16le", SALIDA], { stdio: "inherit" });

if (ESCRIBE_TIEMPOS) {
  fs.writeFileSync(path.join(AUDIO, "tiempos.json"), JSON.stringify(filas, null, 1));
  const habla = filas.reduce((s, f) => s + f.d, 0);
  console.log("id voz cas  inicio     fin     dur  texto");
  for (const f of filas)
    console.log(`${f.id}  ${f.voz}  ${String(f.casilla).padStart(2)} ${String(f.inicio).padStart(7)} ${String(f.fin).padStart(7)} ${String(f.d).padStart(7)}  ${f.texto}`);
  console.log(`\nhabla ${habla.toFixed(2)} s de ${race.largo} = ${(100 * habla / race.largo).toFixed(1)} %`);
  const a = filas.find(f => f.anuncio);
  console.log(`anuncio: ${a.inicio} -> ${a.fin}   (ofertaEn=${race.ofertaEn}, ventana [${race.ofertaEn - 0.5} ; ${race.ofertaEn}])`);
}
console.log(`rendido ${SALIDA}`);
