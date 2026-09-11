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
# Y LOS 30 fps SON EL DEFAULT Y NO UNA LEY, con una excepción que se pide por
# argumento. Lo que la T-01 midió es cuántos decodificadores aguanta el browser a la
# vez, y para eso los 30 son el techo que se probó: bajar uno solo de los creativos a
# 24 no toca esa medición, porque menos cuadros por segundo no es más carga.
#
# Cuando se fijó, además, TODOS los creativos eran imágenes fijas, y una imagen fija no
# tiene cadencia que romper: el fps ahí no significa nada. El caso que lo vuelve
# significativo es nuevo -- un creativo cuyo fondo es video GENERADO, que sale del
# modelo a 24. Empaquetarlo a 30 duplica un cuadro de cada cuatro, que es exactamente
# el tironeo que se acaba de sacar del plate del partido por la misma razón (ver
# `armar-plate.sh`). Comprarlo de vuelta adentro del aviso no tendría sentido.
#
# LA EXCEPCIÓN ES DEL CREATIVO QUE TIENE MOVIMIENTO GENERADO Y NO DE TODOS. Hoy es la L
# y nada más; el banner, el overlay y el spot lineal siguen a 30. Un creativo que no
# nace de un video de 24 no gana nada bajando.
#
# El GOP acompaña al fps y no es un detalle: son dos segundos de cuadros, que es lo que
# hace que los cortes de `-hls_time 2` caigan sobre un keyframe. Fijo en 60 con una
# entrada de 24 daría un keyframe cada 2,5 s y los segmentos se irían de largo.
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
# El tamaño de salida, y por defecto es el de la medición de arriba. Se pasa distinto
# para LOS CREATIVOS DE LOS AVISOS, y no por gusto: el ADR 0013 llena cada caja del
# layout con recorte centrado, así que un creativo que no tiene la relación de aspecto
# de su caja se recorta por los bordes, que es donde vive la tipografía. La barra
# vertical de la L es 512x720 y la horizontal 1280x288 porque ésas son sus cajas.
#
# Forzar 1280x720 acá era el defecto silencioso: el creativo salía perfecto, se
# empaquetaba a 16:9, y el recorte de la caja se llevaba la mitad del texto.
ANCHO=${6:-1280}
ALTO=${7:-720}
# Los cuadros por segundo, y el porqué de que sea un argumento está arriba.
FPS=${8:-30}
# EL AUDIO, opcional, como archivo aparte.
#
# Va por argumento y no adentro del video porque NINGUNA de las fuentes de esta demo
# trae audio: los clips del partido son mudos, y el spot generado también salió mudo.
# Todo lo que suena se produjo aparte -- el relator y la cama de cancha para el
# programa, una cama musical por aviso -- y llega acá como un archivo al lado del video.
#
# Y SIN ÉL NO SUENA NADA, que no es un descuido sino la mitad visible de una regla que
# vive en otro lado: un elemento del aviso sin `volume` en el asset list está en
# silencio (ADR 0014). Un aviso necesita las dos cosas, el audio acá y el número allá;
# con una sola de las dos no se oye, y cuál de las dos falta no se distingue mirando.
AUDIO=${9:-}

mkdir -p "$OUT"
rm -f "$OUT"/*.ts "$OUT"/index.m3u8

# El `-map` sólo aparece cuando hay audio aparte. Sin él ffmpeg elige solo, que es lo
# que hacía antes de que existiera este argumento y lo que sigue haciendo para una
# entrada que ya trae su propia pista.
ENTRADA_AUDIO=()
MAPEO=()
if [ -n "$AUDIO" ]; then
  ENTRADA_AUDIO=(-i "$AUDIO")
  MAPEO=(-map 0:v:0 -map 1:a:0)
fi

ffmpeg -hide_banner -loglevel error -y \
  -ss "$SS" -i "$SRC" "${ENTRADA_AUDIO[@]}" -t "$DUR" \
  -vf "${CROP:+crop=$CROP,}scale=$ANCHO:$ALTO:force_original_aspect_ratio=increase,crop=$ANCHO:$ALTO,fps=$FPS" \
  "${MAPEO[@]}" \
  -c:v libx264 -preset ultrafast -tune zerolatency -g "$((FPS * 2))" -b:v 2000k -pix_fmt yuv420p \
  -c:a aac -b:a 96k -ac 2 -ar 48000 \
  -f hls -hls_time 2 -hls_playlist_type vod -hls_segment_type mpegts \
  -hls_flags program_date_time+independent_segments \
  -hls_segment_filename "$OUT/seg%03d.ts" "$OUT/index.m3u8"

echo "$OUT/index.m3u8  ($(ls "$OUT"/*.ts | wc -l) segmentos, ${FPS} fps)"
