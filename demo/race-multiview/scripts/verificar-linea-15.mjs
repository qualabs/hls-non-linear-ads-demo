// verificar-linea-15.mjs -- la linea que nombra la rueda sobre el piano termina de decirse
// ANTES de que esa imagen salga de cuadro.
//
// ----------------------------------------------------------------------------------------
// POR QUE EXISTE ESTE CHEQUEO Y NO ALCANZA CON MIRAR LA CASILLA
// ----------------------------------------------------------------------------------------
// Trece de los catorce clips son una sola toma de ocho segundos: lo que se nombra al
// principio sigue en cuadro al final, y el relato no tiene con que desalinearse. El clip de
// la casilla 12 trae DOS tomas -- un seguimiento lateral con la rueda sobre el piano, y
// despues un corte a un plano frontal --, asi que ahi la linea tiene una fecha de
// vencimiento adentro del clip. Una linea que se pasa del corte describe una imagen que ya
// no esta, que es exactamente el defecto que esta fase pide no tener.
//
// ----------------------------------------------------------------------------------------
// EL CORTE SE MIDE SOBRE EL CLIP, NO SE TIPEA
// ----------------------------------------------------------------------------------------
// El segundo del corte sale del video: se leen los scene scores cuadro a cuadro y se toma
// el salto mas grande despues del primer cuadro (el primero siempre marca alto porque no
// tiene anterior con que compararse). Un numero asi, solo, no dice nada, asi que va CONTRA
// SU REFERENCIA: el mismo estadistico sobre los otros trece clips, que son de una sola
// toma. El corte de la 12 tiene que destacarse de todos ellos; si no se destaca, este
// script no esta midiendo un corte sino ruido de compresion, y lo dice.
//
// ----------------------------------------------------------------------------------------
// EL CONTROL, SIN EL CUAL ESTO NO ES UN CHEQUEO
// ----------------------------------------------------------------------------------------
// La misma medicion sobre una copia con la linea corrida +1 s tiene que ponerse ROJA. La
// copia la rinde armar-relato.mjs -- el mismo renderizador que hace la buena, no uno
// escrito para el control -- con --correr <id>:<segundos>.
//
// Uso:  node verificar-linea-15.mjs [id]      (id por defecto: 15)
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const aqui = path.dirname(new URL(import.meta.url).pathname);
const DEMO = path.resolve(aqui, "..");
const race = JSON.parse(fs.readFileSync(path.join(DEMO, "race.json"), "utf8"));
const tiempos = JSON.parse(fs.readFileSync(path.join(DEMO, "audio/tiempos.json"), "utf8"));
const CLIPS = path.join(DEMO, "content/.fuentes/programa");
const TRABAJO = path.join(DEMO, "content/.fuentes/audio");

const ID = process.argv[2] ?? "15";
const linea = tiempos.find(f => f.id === ID);
if (!linea) { console.log(`no hay una linea ${ID} en tiempos.json`); process.exit(1); }

const UMBRAL = "-50dB", MINIMO = 0.10;

// --- el salto de imagen mas grande de un clip, sin contar el primer cuadro ---------------
function saltoMasGrande(mp4) {
  const salida = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", mp4,
    "-vf", "select='gte(scene,0)',metadata=print:file=-", "-f", "null", "-"],
    { encoding: "utf8", maxBuffer: 64 << 20 }).stdout;
  const t = [...salida.matchAll(/pts_time:([0-9.]+)/g)].map(m => +m[1]);
  const s = [...salida.matchAll(/scene_score=([0-9.]+)/g)].map(m => +m[1]);
  let mejor = { t: null, s: -1 };
  for (let i = 0; i < s.length; i++)
    if (t[i] > 0.1 && s[i] > mejor.s) mejor = { t: t[i], s: s[i] };
  return mejor;
}

const clips = fs.readdirSync(CLIPS).filter(f => f.endsWith(".mp4")).sort();
const casilla = String(linea.casilla).padStart(2, "0");
const elClip = clips.find(f => f.startsWith(casilla + "-"));
if (!elClip) { console.log(`no encontre el clip de la casilla ${linea.casilla}`); process.exit(1); }

console.log("el salto de imagen mas grande de cada clip, sin contar el primer cuadro:");
const medidos = clips.map(f => ({ f, ...saltoMasGrande(path.join(CLIPS, f)) }));
for (const m of medidos)
  console.log(`  ${m.f === elClip ? "->" : "  "} ${m.f.padEnd(34)} ${m.s.toFixed(4)}  en ${m.t.toFixed(3)} s`);

const corte = medidos.find(m => m.f === elClip);
const resto = medidos.filter(m => m.f !== elClip);
const techoResto = Math.max(...resto.map(m => m.s));
console.log(`\nel clip de la casilla ${linea.casilla} salta ${corte.s.toFixed(4)}; el mas alto de los otros ` +
            `${resto.length} es ${techoResto.toFixed(4)}  (${(corte.s / techoResto).toFixed(1)} veces)`);
if (corte.s <= techoResto * 1.5) {
  console.log("NO HAY CORTE QUE MEDIR: el salto de este clip no se separa del de los que son de una sola toma.");
  process.exit(1);
}

const CORTE_ABS = +((linea.casilla - 1) * race.clipDura + corte.t).toFixed(3);
console.log(`corte del clip a los ${corte.t.toFixed(3)} s  ->  segundo ${CORTE_ABS} del programa\n`);

// --- el fin hablado de la linea, medido sobre el audio rendido ---------------------------
function finHablado(wav, inicio) {
  const hasta = Math.min(inicio + 12, race.largo);
  const salida = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-ss", String(inicio + 0.05),
    "-to", String(hasta), "-i", wav, "-af", `silencedetect=n=${UMBRAL}:d=${MINIMO}`,
    "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const arranques = [...salida.matchAll(/silence_start: ([-0-9.]+)/g)].map(m => +m[1] + inicio + 0.05);
  return arranques.length ? arranques[0] : null;
}

function medir(wav, etiqueta, inicio) {
  const fin = finHablado(wav, inicio);
  const pasa = fin !== null && fin <= CORTE_ABS;
  const margen = fin === null ? null : CORTE_ABS - fin;
  console.log(`${pasa ? "VERDE" : "ROJO "}  ${etiqueta.padEnd(30)} fin hablado ${fin === null ? "no se callo" : fin.toFixed(3) + " s"}` +
              `   ${margen === null ? "" : (margen >= 0 ? `${margen.toFixed(3)} s antes del corte` : `${(-margen).toFixed(3)} s DESPUES del corte`)}`);
  return pasa;
}

const real = medir(path.join(TRABAJO, "relato.wav"), "el relato como se entrega", linea.inicio);

const wav = path.join("/dev/shm", `control-linea-${ID}-mas1-${process.pid}.wav`);
execFileSync("node", [path.join(aqui, "armar-relato.mjs"), "--salida", wav, "--correr", `${ID}:1`],
             { stdio: ["ignore", "ignore", "inherit"] });
const ctrl = medir(wav, "CONTROL la linea corrida +1 s", linea.inicio + 1);
fs.rmSync(wav, { force: true });

console.log();
if (!real) { console.log(`FALLA: la linea ${ID} sigue hablando despues del corte.`); process.exit(1); }
if (ctrl) { console.log("FALLA AL REVES: el control corrido dio VERDE, o sea que esta medicion aprueba cualquier cosa."); process.exit(1); }
console.log("PASA, y se vio el control en rojo.");
