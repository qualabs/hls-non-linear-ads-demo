#!/usr/bin/env bash
# lamina-antes-y-despues.sh -- una lamina por casilla regenerada: arriba el clip que
# Nicolas rechazo, abajo el que lo reemplaza, los dos con doce cuadros repartidos por los
# ocho segundos.
#
# POR QUE DOCE CUADROS Y NO UNO. Lo que se rechazo no se ve en un cuadro: es que la
# geometria del circuito cambia ADENTRO del clip. Un cuadro solo no puede mostrar ni el
# defecto ni el arreglo; la secuencia si.
#
# POR QUE LOS DOS JUNTOS. El clip nuevo solo no dice si mejoro: dice como salio. La
# referencia es el viejo, que sigue en `rechazados-geometria/` a proposito.
set -euo pipefail
cd "$(dirname "$0")"

RAIZ=$(cd ../../../../../../.. && pwd)
D="$RAIZ/demo/race-multiview/content/.fuentes/programa"
OUT="$(cd .. && pwd)/lamina"
mkdir -p "$OUT"
T=$(mktemp -d "/dev/shm/lamina-antes-despues-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT

CASILLAS="01-los-seis-trackside 05-noctev-chicana 06-runtak-pentav-frenada
          10-pentav-quentra-eses 12-runtak-rueda-piano"

for c in $CASILLAS; do
  ffmpeg -hide_banner -loglevel error -y -i "$D/rechazados-geometria/$c.mp4" \
    -vf "select='not(mod(n\,16))',scale=426:-1,tile=6x2" -frames:v 1 "$T/$c-viejo.png"
  ffmpeg -hide_banner -loglevel error -y -i "$D/$c.mp4" \
    -vf "select='not(mod(n\,16))',scale=426:-1,tile=6x2" -frames:v 1 "$T/$c-nuevo.png"
  ffmpeg -hide_banner -loglevel error -y -i "$T/$c-viejo.png" -i "$T/$c-nuevo.png" \
    -filter_complex "[0:v]drawtext=text='RECHAZADO':x=8:y=8:fontsize=28:fontcolor=red:box=1:boxcolor=black@0.6:boxborderw=6[a];\
[1:v]drawtext=text='NUEVO':x=8:y=8:fontsize=28:fontcolor=lime:box=1:boxcolor=black@0.6:boxborderw=6[b];\
[a][b]vstack=inputs=2" -frames:v 1 -q:v 4 "$OUT/$c.jpg"
  echo "$OUT/$c.jpg"
done
