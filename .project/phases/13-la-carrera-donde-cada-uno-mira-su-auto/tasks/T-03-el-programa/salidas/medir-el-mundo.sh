#!/usr/bin/env bash
# medir-el-mundo.sh -- si los clips del programa siguen siendo la misma carrera que los del
# sondeo, DESPUES de que el parrafo del mundo se reescribiera.
#
# QUE ESTA EN JUEGO. El parrafo del mundo se reescribio para que la instruccion de camara
# pudiera ganarle: perdio toda frase que implica un punto de vista ("Beyond the barriers:",
# "wind over the camera", "on the horizon"). Los sustantivos y sus adjetivos quedaron, pero
# eso es una afirmacion y hay que medirla: si la reescritura movio la luz o el piso, el R1
# de PHASE.md -- que las piezas se lean como la misma carrera -- se rompio, y se rompio
# justo donde nadie lo estaba mirando.
#
# LA REFERENCIA NO SALE DE ESTE CALCULO, que es lo que la hace valer: son los clips del
# SONDEO, generados con el parrafo viejo, dos dias antes y por otra task. Si los clips
# nuevos quedan a la misma distancia de los viejos que los viejos entre si, la reescritura
# no movio el mundo.
#
# LOS DOS CONTROLES SON LOS DE LA T-02 y estan para lo mismo: sin ellos, un numero chico no
# distingue entre "los clips coinciden" y "este instrumento devuelve siempre lo mismo".
#   1. el mismo cuadro virado a hora dorada -- si el numero no se mueve, no mide la luz.
#   2. un cuadro de otro mundo, metraje real de la demo del break -- si no se mueve, no
#      mide el lugar.
#
# EL PARCHE DE ASFALTO SE ELIGE A MANO POR CLIP y se mira dibujado (marcar.py), porque un
# rectangulo a ciegas puede caer sobre una linea blanca, un piano o una sombra, y entonces
# mide eso.
set -euo pipefail
cd "$(dirname "$0")"

RAIZ=$(cd ../../../../../.. && pwd)
SONDEO="$RAIZ/demo/race-multiview/content/.fuentes/sondeo"
PROGRAMA="$RAIZ/demo/race-multiview/content/.fuentes/programa"
T02=../../T-02-el-sondeo-de-dos-clips/salidas

T=${1:?uso: medir-el-mundo.sh <carpeta de trabajo en /dev/shm>}
mkdir -p "$T/cuadros"

PY=/dev/shm/t03venv/bin/python
[ -x "$PY" ] || { uv venv --python 3.12 /dev/shm/t03venv >/dev/null 2>&1
                  uv pip install --python "$PY" pillow numpy >/dev/null 2>&1; }

# Los cuadros del sondeo (parrafo viejo) y los del programa (parrafo nuevo).
ffmpeg -hide_banner -loglevel error -y -ss 4.0 -i "$SONDEO/a-casilla-04-aereo-los-seis.mp4"            -frames:v 1 "$T/cuadros/sondeo-A.png"
ffmpeg -hide_banner -loglevel error -y -ss 4.0 -i "$SONDEO/b-casilla-12-rueda-runtak.mp4"              -frames:v 1 "$T/cuadros/sondeo-B.png"
ffmpeg -hide_banner -loglevel error -y -ss 4.0 -i "$SONDEO/c-casilla-04-correccion-aereo-y-lista.mp4"  -frames:v 1 "$T/cuadros/sondeo-C.png"
for f in "$PROGRAMA"/*.mp4; do
  [ -e "$f" ] || continue
  ffmpeg -hide_banner -loglevel error -y -ss 4.0 -i "$f" -frames:v 1 "$T/cuadros/prog-$(basename "$f" .mp4).png"
done

# CONTROL 1 -- la misma imagen con la luz cambiada.
ffmpeg -hide_banner -loglevel error -y -i "$T/cuadros/sondeo-A.png" \
  -vf "colorbalance=rs=.25:gs=.05:bs=-.20:rm=.20:bm=-.18:rh=.15:bh=-.12,eq=saturation=1.25:gamma=0.92" \
  "$T/cuadros/CONTROL-hora-dorada.png"
# CONTROL 2 -- otro mundo: metraje real de la demo del break.
ffmpeg -hide_banner -loglevel error -y -ss 3 -i "$RAIZ/demo/hydration-break/content/.fuentes/9439150.mp4" \
  -frames:v 1 -vf scale=1280:720 "$T/cuadros/CONTROL-otro-mundo.png"

for j in rects/mundo-*.json; do
  sed "s#@T@#$T#g" "$j" > "$T/$(basename "$j")"
  "$PY" -W ignore "$T02/comparar-mundo.py" "$T/$(basename "$j")"
  echo
done
