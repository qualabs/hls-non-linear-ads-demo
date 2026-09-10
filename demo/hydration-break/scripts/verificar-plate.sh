#!/usr/bin/env bash
# verificar-plate.sh -- mide si las costuras del plate se ven, y es el chequeo que
# decide si la cadena de la parada entró.
#
#   ./scripts/verificar-plate.sh plate.mp4
#
# QUÉ MIDE. La diferencia media de luminancia entre cada par de cuadros consecutivos
# (`signalstats` sobre un `tblend` en modo diferencia), a lo largo del plate entero. Un
# corte se ve como un pico en esa serie.
#
# Y SE COMPARA CONTRA EL VECINDARIO, NO CONTRA UN NÚMERO FIJO, que es la parte que costó
# aprender. Un umbral absoluto no sirve acá porque **el paso normal entre dos cuadros
# depende de cuánto se mueve la escena**: en la parada del juego, con gente caminando,
# la mediana anda por 3,3; en el juego, con la pelota corriendo, llega a 7. Un número
# que pasa en un lado falla en el otro sin que nada esté mal. Así que cada costura se
# mide contra la mediana de sus 24 cuadros vecinos y lo que se reporta es la RAZÓN.
#
# LAS DOS CALIBRACIONES, y son dos porque miden cosas distintas:
#
#   PASO INTERNO, adentro de un eslabón: YAVG 3,5 a 7,4 según el movimiento. Es un
#   cuadro de diferencia y nada más.
#
#   COSTURA entre dos eslabones: el mismo paso MÁS el ruido de que Veo vuelve a dibujar
#   el cuadro semilla. Ese ruido se mide solo, comparando el último cuadro de un eslabón
#   contra el cuadro 0 del siguiente —el mismo instante, dibujado dos veces—: da 3,6 a
#   6,9. O sea que una costura arrastra un ruido del tamaño de un paso, y por eso su
#   número crudo es casi el doble del de un paso interno **sin que haya ningún defecto**.
#
# Escribir un umbral absoluto sin esta nota es lo que hace que después se use en el
# lugar equivocado. Con la razón contra el vecindario las dos calibraciones se vuelven
# una sola regla: una costura sana da alrededor de 1x y hasta 2x; de 3x para arriba hay
# algo que mirar con el ojo.
#
# EL VEREDICTO NO ES ESTE NÚMERO. El número dice que las costuras son continuas; si el
# plate se lee como un solo partido lo dice el ojo. Este script existe para que no haya
# que mirar 92 segundos cuadro por cuadro, no para reemplazar el mirarlos.
set -euo pipefail
cd "$(dirname "$0")/.."

PLATE=${1:?el mp4 del plate}
[ -s "$PLATE" ] || { echo "no está $PLATE" >&2; exit 1; }

JUEGO=$(node -e 'process.stdout.write(String(require("./plate.json").paradaEn))')
PARADA=$(node -e 'process.stdout.write(String(require("./plate.json").paradaDura))')
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$PLATE" | awk -F/ '{printf "%d", $1/$2}')

TMP=$(mktemp -d "${TMPDIR:-/dev/shm}/verificar-plate-XXXXXX")
trap 'rm -rf "$TMP"' EXIT

# `format=rgb24` ANTES del tblend, y no es cosmético: sobre yuv420p la diferencia sale
# por otro camino y los números quedan diez veces más grandes, o sea incomparables con
# los de arriba. Verificado contra el método de dos PNG, que da lo mismo al sexto decimal.
ffmpeg -v error -i "$PLATE" \
  -vf "format=rgb24,tblend=all_mode=difference,format=gray,signalstats,metadata=print:file=-" \
  -f null - 2>/dev/null | grep YAVG | sed 's/.*YAVG=//' | nl -v1 -ba > "$TMP/serie.txt"

FPS="$FPS" JUEGO="$JUEGO" PARADA="$PARADA" node -e '
  const fs = require("fs");
  const fps = +process.env.FPS, juego = +process.env.JUEGO, parada = +process.env.PARADA;
  const val = new Map(fs.readFileSync(process.argv[1], "utf8").trim().split("\n")
    .map((l) => l.trim().split(/\s+/)).map(([n, v]) => [+n, +v]));

  // Dónde caen las costuras. El primer eslabón entra entero; los demás entran sin su
  // cuadro 0, así que aportan un cuadro menos cada uno (ver `armar-plate.sh`).
  const eslabones = Math.round(parada / 8), largoEslabon = 8 * fps;
  const bordes = [[Math.round(juego * fps), "acto 1 -> parada"]];
  let cursor = bordes[0][0] + largoEslabon;
  for (let k = 2; k <= eslabones; k++) {
    bordes.push([cursor, `eslabón ${String(k - 1).padStart(2, "0")} -> ${String(k).padStart(2, "0")}`]);
    cursor += largoEslabon - 1;
  }
  bordes.push([cursor, "parada -> acto 3"]);

  const mediana = (a) => { const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; };
  let peor = 0;
  console.log("costura              cuadro    salto   vecindario   razón");
  for (const [n, nombre] of bordes) {
    const v = val.get(n);
    if (v === undefined) { console.log(`${nombre.padEnd(20)} ${String(n).padStart(6)}   (fuera del plate)`); continue; }
    const vec = [];
    for (let k = n - 12; k <= n + 12; k++) if (k !== n && val.has(k)) vec.push(val.get(k));
    const m = mediana(vec), r = v / m;
    peor = Math.max(peor, r);
    const marca = r >= 3 ? "  <== MIRALA" : r >= 2 ? "  <-- alta" : "";
    console.log(`${nombre.padEnd(20)} ${String(n).padStart(6)} ${v.toFixed(2).padStart(8)} ${m.toFixed(2).padStart(12)}   ${r.toFixed(2)}x${marca}`);
  }
  const todos = [...val.values()];
  console.log(`\nmediana del plate entero: ${mediana(todos).toFixed(2)}   máximo: ${Math.max(...todos).toFixed(2)}`);
  console.log(peor >= 3
    ? "\nHAY UNA COSTURA QUE SE VE. El número no alcanza: mirá los cuadros de alrededor."
    : "\nNinguna costura se despega de su vecindario. Falta lo único que el número no dice: mirarlo.");
' "$TMP/serie.txt"
