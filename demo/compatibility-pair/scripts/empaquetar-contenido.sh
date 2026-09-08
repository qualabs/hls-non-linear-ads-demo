#!/usr/bin/env bash
# Empaqueta un archivo de video como VOD en HLS, con los parámetros de la
# medición de la T-01: 1280x720 a 30 fps, H.264 + AAC, segmentos de 2 s y
# EXT-X-PROGRAM-DATE-TIME.
#
# El recipe de ffmpeg viene de `tasks/T-01/empaquetar-contenido.sh` de la fase
# 01 y no se cambió. Lo único distinto es la entrada: ahí eran cinco fuentes
# sintéticas de `testsrc2`, porque lo que se medía era cuántos decodificadores
# aguanta el browser y la imagen no importaba. Acá la demo se graba, así que la
# entrada es un archivo real.
#
# Los 1280x720 y los 30 fps no son decorativos: son exactamente la
# configuración con la que la T-01 midió que cinco elementos de video
# reproducen a la vez, que es lo que el mecanismo de multiview de la T-11
# necesita.
#
# El EXT-X-PROGRAM-DATE-TIME tampoco: sin él un START-DATE no se puede
# resolver, y los Date Ranges de la T-06 no tendrían dónde anclarse (ADR 0005).
#
# El encuadre se resuelve con recorte centrado y sin deformar, que es la misma
# política que el ADR 0013 fijó para llenar la caja de un layout.
set -euo pipefail

SRC=${1:?archivo de entrada}
OUT=${2:?directorio de salida}
SS=${3:-0}
DUR=${4:?duración en segundos}
# Recorte previo opcional, como expresión de `crop` de ffmpeg (w:h:x:y). Es
# para las fuentes que traen las bandas negras quemadas en el cuadro: si no se
# les saca antes, el recorte a 16:9 conserva las bandas y el aviso aparece
# rodeado de negro.
CROP=${5:-}

mkdir -p "$OUT"
rm -f "$OUT"/*.ts "$OUT"/index.m3u8

ffmpeg -hide_banner -loglevel error -y \
  -ss "$SS" -i "$SRC" -t "$DUR" \
  -vf "${CROP:+crop=$CROP,}scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30" \
  -c:v libx264 -preset ultrafast -tune zerolatency -g 60 -b:v 2000k -pix_fmt yuv420p \
  -c:a aac -b:a 96k -ac 2 -ar 48000 \
  -f hls -hls_time 2 -hls_playlist_type vod -hls_segment_type mpegts \
  -hls_flags program_date_time+independent_segments \
  -hls_segment_filename "$OUT/seg%03d.ts" "$OUT/index.m3u8"

echo "$OUT/index.m3u8  ($(ls "$OUT"/*.ts | wc -l) segmentos)"
