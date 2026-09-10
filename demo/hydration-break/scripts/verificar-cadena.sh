#!/usr/bin/env bash
# verificar-cadena.sh -- mira los eslabones generados de la parada ANTES de armar el
# plate, y contesta la pregunta que el chequeo de costuras no puede contestar.
#
#   ./scripts/verificar-cadena.sh
#
# POR QUÉ HAY DOS CHEQUEOS Y NO UNO. `verificar-plate.sh` mide la diferencia entre
# cuadros consecutivos, y eso mide CONTINUIDAD: sirve para una costura, donde el defecto
# es un salto. Es ciego a un corte suave.
#
# Y eso no es teórico, pasó: un eslabón volvió con un FUNDIDO ENCADENADO adentro --los
# jugadores duplicados y semitransparentes durante treinta cuadros-- y del otro lado del
# fundido la escena era otra, con un arco y una reja que no estaban. La serie de
# diferencias cuadro a cuadro de ese eslabón se quedó entre 3,1 y 6,0 de punta a punta,
# o sea en el rango sano, mientras la pantalla mostraba un doble expuesto. Un fundido es
# suave por construcción: por eso lo atraviesa sin despeinarse.
#
# LO QUE SÍ LO AGARRA ES COMPARAR EL FONDO CONTRA EL CLIP FILMADO. Se recorta la franja
# de arriba del cuadro --reja, pista, arco: lo que no se mueve, porque los jugadores
# están abajo-- y se mide contra el mismo recorte del acto 1.
#
# Y SE MIRA EL SALTO CONTRA EL ESLABÓN ANTERIOR, NO EL VALOR ABSOLUTO. Eso costó una
# corrida entender: la distancia contra el acto 1 **crece sola** a medida que la cadena
# se aleja del cuadro filmado, porque cada eslabón es una generación más de distancia.
# Medido sobre una cadena sana, eslabón por eslabón: 22,7 / 23,4 / 23,8 / 25,8 / 27,9 /
# 30,8. Un umbral fijo en 28 habría marcado el sexto estando bien.
#
# Los saltos de esa misma cadena sana son +0,7 / +0,4 / +2,0 / +2,1 / +2,9: nunca más de
# tres. El eslabón del fundido saltó **+29** de golpe, y el que se fue caminando a otra
# parte de la cancha, **+51**. Por eso el umbral es un salto de 10: queda muy arriba de
# lo que la acumulación normal produce y muy abajo de los dos defectos que se vieron.
#
# EL VEREDICTO SIGUE SIENDO DEL OJO. Este script dice cuál eslabón mirar primero, no si
# la cadena entró. Tres modos de falla distintos aparecieron en un solo día --deriva de
# escena, un piso que el prompt prohibía, y este fundido-- y ninguno de los tres se
# parece al anterior. El número acota dónde buscar.
set -euo pipefail
cd "$(dirname "$0")/.."

F=content/.fuentes
P=$F/parada
CLIP=$(node -e 'process.stdout.write(String(require("./plate.json").clip))')
RECORTE=$(node -e 'process.stdout.write(String(require("./plate.json").recorte))')
PARADA=$(node -e 'process.stdout.write(String(require("./plate.json").paradaDura))')
ESLABONES=$(awk -v p="$PARADA" 'BEGIN { printf "%d", p / 8 }')

TMP=$(mktemp -d "${TMPDIR:-/dev/shm}/verificar-cadena-XXXXXX")
trap 'rm -rf "$TMP"' EXIT

# La franja de arriba: 200 px de alto sobre el ancho entero. Es fondo y no gente.
franja() { # $1 entrada  $2 índice de cuadro  $3 filtros previos  $4 salida
  ffmpeg -hide_banner -loglevel error -y -i "$1" -vf "$3select=eq(n\,$2),crop=1280:200:0:0" \
    -vsync 0 -frames:v 1 "$4"
}
dif() { # $1 $2 png -> YAVG
  ffmpeg -v error -i "$1" -i "$2" -filter_complex \
    "blend=all_mode=difference,format=gray,signalstats,metadata=print:file=-" -f null - 2>/dev/null \
    | grep -m1 YAVG | sed 's/.*YAVG=//'
}

franja "$F/$CLIP" 168 "crop=$RECORTE,scale=1280:720,setsar=1," "$TMP/acto1.png"

: > "$TMP/serie.txt"
for n in $(seq 1 "$ESLABONES"); do
  f=$(printf '%s/%02d.mp4' "$P" "$n")
  if [ ! -s "$f" ]; then printf '%s -\n' "$n" >> "$TMP/serie.txt"; continue; fi
  # Tres momentos y no uno: un fundido puede ocupar un tercio del eslabón y dejar los
  # otros dos limpios, que es exactamente como se vio la primera vez.
  vals=""
  for c in 48 96 144; do
    franja "$f" "$c" "" "$TMP/e.png"
    vals="$vals $(dif "$TMP/acto1.png" "$TMP/e.png")"
  done
  printf '%s%s\n' "$n" "$vals" >> "$TMP/serie.txt"
done

node -e '
  const fs = require("fs");
  const filas = fs.readFileSync(process.argv[1], "utf8").trim().split("\n")
    .map((l) => l.trim().split(/\s+/));
  const SALTO = 10;
  console.log("eslabón   fondo contra el acto 1 (tres momentos)   peor    salto");
  let previo = null, alarma = null;
  for (const [n, ...v] of filas) {
    if (v[0] === "-" || !v.length) { console.log(`   ${n}      (falta)`); continue; }
    const nums = v.map(Number), peor = Math.max(...nums);
    const salto = previo === null ? null : peor - previo;
    const marca = salto !== null && salto >= SALTO ? "   <== MIRALO" : "";
    if (marca && !alarma) alarma = n;
    console.log(`   ${n}     ${nums.map((x) => x.toFixed(1).padStart(7)).join("")}   ${peor.toFixed(1).padStart(5)}` +
      `   ${salto === null ? "    -" : (salto >= 0 ? "+" : "") + salto.toFixed(1).padStart(4)}${marca}`);
    previo = peor;
  }
  console.log("");
  console.log(alarma
    ? `EL ESLABÓN ${alarma} NO ESTÁ EN LA MISMA ESCENA QUE EL ANTERIOR. Miralo cuadro por cuadro:\npuede ser deriva --se fue caminando-- o un fundido con un corte adentro, y los dos se\ndistinguen mirando y no midiendo.`
    : "Ningún eslabón se despega del anterior. Falta lo que el número no dice: mirarlos,\nque es donde aparecieron los tres defectos de esta fase.");
' "$TMP/serie.txt"
