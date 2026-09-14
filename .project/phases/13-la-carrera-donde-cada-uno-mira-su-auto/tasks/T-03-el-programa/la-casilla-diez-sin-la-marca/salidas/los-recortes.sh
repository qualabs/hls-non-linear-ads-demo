#!/usr/bin/env bash
# recortes.sh -- los recortes con los que se decide si la casilla 10 trae una marca.
#
# A RESOLUCION COMPLETA Y SIN REDUCIR. Un recorte achicado no muestra una palabra de cuatro
# letras en un ponton, que es exactamente el defecto que descalifico la version anterior.
# Cada recorte sale del cuadro 1280x720 a escala 1:1 y despues se agranda x3 con `neighbor`,
# que no inventa bordes: lo que se lee estaba en el pixel.
set -euo pipefail
CLIP="$1"; OUT="$2"; PREFIJO="${3:-}"
mkdir -p "$OUT"

# Los ocho segundos enteros, sin reducir, para elegir donde mirar.
for s in 0 1 2 3 4 5 6 7; do
  ffmpeg -hide_banner -loglevel error -y -ss "$s" -i "$CLIP" -frames:v 1 \
    "$OUT/${PREFIJO}cuadro-s$s.png"
done

# LA VALLA: la banda de arriba del cuadro, donde estan el muro y los carteles.
# EL AUTO: la banda de abajo, donde estan la carroceria, el ponton y el morro.
for s in 0 2 4 6; do
  ffmpeg -hide_banner -loglevel error -y -ss "$s" -i "$CLIP" -frames:v 1 \
    -vf "crop=1280:260:0:100,scale=iw*3:ih*3:flags=neighbor" "$OUT/${PREFIJO}valla-s$s.png"
  ffmpeg -hide_banner -loglevel error -y -ss "$s" -i "$CLIP" -frames:v 1 \
    -vf "crop=1280:340:0:340,scale=iw*3:ih*3:flags=neighbor" "$OUT/${PREFIJO}auto-s$s.png"
done
ls -1 "$OUT" | sed "s/^/  /"
