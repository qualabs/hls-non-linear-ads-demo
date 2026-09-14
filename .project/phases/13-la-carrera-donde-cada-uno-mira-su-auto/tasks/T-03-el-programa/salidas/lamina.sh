#!/usr/bin/env bash
# lamina.sh -- la lamina de contacto del programa: cinco cuadros por clip, uno abajo del
# otro, con el rotulo de cada casilla.
#
# PARA QUE. `PHASE.md` dice que lo que no es medible se mira, y se mira entero: "cada pieza
# generada se mira antes de ir a pantalla". Una lamina es la unica forma de mirar catorce
# clips sin abrir catorce reproductores, y es lo que queda como evidencia de que se
# miraron: un informe que dice "los mire" y no deja con que, no deja nada.
#
# CINCO CUADROS Y NO UNO. Un solo cuadro por clip esconde justo lo que hay que ver: si la
# camara se va, si el color cambia a mitad del clip, si aparece una letra recien en el
# segundo 6. Van a 0,5 / 2 / 4 / 6 / 7,5 s, que son los mismos instantes con los que midio
# el sondeo, para que las dos laminas se puedan comparar sin recalcular nada.
#
#   ./lamina.sh <carpeta de clips> <salida.jpg>
set -euo pipefail
cd "$(dirname "$0")"

D=${1:?uso: lamina.sh <carpeta de clips> <salida.jpg>}
SAL=${2:?uso: lamina.sh <carpeta de clips> <salida.jpg>}

T=$(mktemp -d "/dev/shm/lamina-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT

FUENTE=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
[ -f "$FUENTE" ] || FUENTE=$(fc-match -f '%{file}' sans-serif)

i=0
FILAS=()
for f in "$D"/*.mp4; do
  [ -e "$f" ] || continue
  n=$(basename "$f" .mp4)
  for t in 0.5 2.0 4.0 6.0 7.5; do
    ffmpeg -hide_banner -loglevel error -y -ss $t -i "$f" -frames:v 1 \
      -vf "scale=512:288,drawtext=fontfile=$FUENTE:text='t=${t}s':x=6:y=266:fontsize=14:fontcolor=yellow:box=1:boxcolor=black@0.6:boxborderw=3" \
      "$T/$(printf '%02d' $i)-$t.png"
  done
  ffmpeg -hide_banner -loglevel error -y \
    -i "$T/$(printf '%02d' $i)-0.5.png" -i "$T/$(printf '%02d' $i)-2.0.png" \
    -i "$T/$(printf '%02d' $i)-4.0.png" -i "$T/$(printf '%02d' $i)-6.0.png" \
    -i "$T/$(printf '%02d' $i)-7.5.png" \
    -filter_complex "[0][1][2][3][4]hstack=inputs=5,pad=2560:310:0:22:black,drawtext=fontfile=$FUENTE:text='$n':x=6:y=4:fontsize=16:fontcolor=white" \
    "$T/fila-$(printf '%02d' $i).png"
  FILAS+=("$T/fila-$(printf '%02d' $i).png")
  i=$((i + 1))
done
[ $i -gt 0 ] || { echo "no hay clips en $D" >&2; exit 1; }

ENTRADAS=()
for r in "${FILAS[@]}"; do ENTRADAS+=(-i "$r"); done
ffmpeg -hide_banner -loglevel error -y "${ENTRADAS[@]}" \
  -filter_complex "$(printf '[%d]' $(seq 0 $((i - 1))))vstack=inputs=$i" -q:v 4 "$SAL"
echo "$SAL"
