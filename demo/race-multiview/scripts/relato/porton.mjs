// EL PORTON: una linea no entra a la mezcla sin pasar por aca.
//
// Es el de demo/hydration-break, copiado con una sola cosa cambiada -- la lista de
// palabras del prompt de estilo, porque el prompt es otro. El resto no se toco a
// proposito: lo que atrapa es el mismo defecto del mismo sintetizador.
//
// QUE ATRAPA. gemini-2.5-flash-tts tiene dos fallas intermitentes y las dos son
// INVISIBLES EN EL ARCHIVO: a veces LEE EN VOZ ALTA EL PROMPT DE ESTILO en lugar de
// tomarlo como instruccion, y a veces REPITE una frase. Con el prompt largo original de
// la demo del partido, cinco de quince lineas salieron cuatro veces mas largas de lo
// pedido. Se detectan con la transcripcion y no con la duracion: LA DURACION DICE "RARO",
// LA TRANSCRIPCION DICE QUE SE DIJO.
//
// COMO SE LO VE FALLAR, que es lo unico que lo convierte en un chequeo: se le pasa una
// linea plantada con el prompt de estilo adentro y tiene que rechazarla. El control corre
// en generar-relato.sh --control y su salida esta en la evidencia de la task.
//
// Uso:  node porton.mjs <transcripcion.json> <id>
//   <transcripcion.json> es la respuesta de gemini-2.5-flash con la transcripcion literal.
// Sale 0 si la linea pasa, 1 si no.
import fs from "node:fs";
import path from "node:path";

// Las palabras que solo pueden venir del prompt de estilo. Ninguna aparece en el guion:
// si una se oye, el sintetizador leyo la instruccion en vez de obedecerla.
const FUGA = ["shouting", "advertisement", "unhurried", "commentator", "british",
              "colleague", "conversational", "former racing", "commentary box",
              "live television", "transcript", "synthesise"];

const [trPath, id] = process.argv.slice(2);
const aqui = path.dirname(new URL(import.meta.url).pathname);
const guion = JSON.parse(fs.readFileSync(path.join(aqui, "guion.json"), "utf8"));
const linea = guion.find(l => l.id === id);
if (!linea) { console.log(`MAL  no hay una linea ${id} en el guion`); process.exit(1); }

const resp = JSON.parse(fs.readFileSync(trPath, "utf8"));
const dicho = (resp?.candidates?.[0]?.content?.parts?.at(-1)?.text ?? "").split("\n")[0].trim();
if (!dicho) { console.log("MAL  el transcriptor no devolvio texto"); process.exit(1); }
const bajo = dicho.toLowerCase();

const fugado = FUGA.filter(p => bajo.includes(p));

// La repeticion se ve como una frase de 4+ palabras que aparece dos veces.
const pal = bajo.replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
let repetido = null;
for (let n = 4; n <= Math.floor(pal.length / 2) && !repetido; n++)
  for (let i = 0; i + 2 * n <= pal.length; i++) {
    const a = pal.slice(i, i + n).join(" ");
    if (pal.slice(i + n).join(" ").includes(a)) { repetido = a; break; }
  }

// Largo: el sintetizador no puede decir mucho mas de lo que se le pidio.
const pedidas = linea.texto.split(/\s+/).length, dichas = pal.length;
const estirado = dichas > pedidas * 1.45 + 3;

const problemas = [];
if (fugado.length) problemas.push(`leyo el prompt en voz alta (${fugado.join(", ")})`);
if (repetido) problemas.push(`repitio "${repetido}"`);
if (estirado) problemas.push(`dijo ${dichas} palabras y se le pidieron ${pedidas}`);
if (problemas.length) { console.log("MAL  " + problemas.join(" | ") + "\n     " + dicho); process.exit(1); }
console.log("bien " + dicho);
