#!/usr/bin/env bash
# lamina-las-cuatro-nuevas.sh -- una sola lamina con las cuatro casillas nuevas, una por
# fila, ocho cuadros repartidos por los ocho segundos. Es la que se mira para decidir.
#
# OCHO CUADROS Y NO UNO, por lo mismo que la lamina de antes y despues: lo que hay que ver
# es que el mundo NO cambia adentro del clip, y eso solo se ve en la secuencia.
set -euo pipefail
cd "$(dirname "$0")"
RAIZ=$(cd ../../../../../../.. && pwd)
D="$RAIZ/demo/race-multiview/content/.fuentes/programa"
OUT="$(cd .. && pwd)/lamina"
T=$(mktemp -d "/dev/shm/lamina-cuatro-nuevas-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT

i=0; ENTRADAS=(); FILTRO=""
for c in 01-los-seis-trackside 05-noctev-chicana 10-pentav-quentra-eses 12-runtak-rueda-piano; do
  ffmpeg -hide_banner -loglevel error -y -i "$D/$c.mp4" \
    -vf "select='not(mod(n\,24))',scale=320:-1,tile=8x1" -frames:v 1 "$T/$c.png"
  ENTRADAS+=(-i "$T/$c.png")
  FILTRO="$FILTRO[$i:v]drawtext=text='$c':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=6[f$i];"
  i=$((i+1))
done
FILTRO="$FILTRO[f0][f1][f2][f3]vstack=inputs=4"
ffmpeg -hide_banner -loglevel error -y "${ENTRADAS[@]}" -filter_complex "$FILTRO" \
  -frames:v 1 -q:v 3 "$OUT/las-cuatro-nuevas.jpg"
echo "$OUT/las-cuatro-nuevas.jpg"
