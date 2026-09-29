#!/usr/bin/env bash
# Empaqueta una secuencia de PNG —los cuadros que capturar-svg.py sacó del SVG
# animado— como VOD en HLS. Es la segunda mitad del puente a video.
#
# Es el molde de demo/stage-pair/scripts/empaquetar-contenido.sh, con la misma
# regla que aquél estableció —la cadencia va por parámetro y EL GOP ESTÁ ATADO AL
# FPS, dos segundos de cuadros— y cuatro diferencias, todas con razón escrita:
#
#   1. La entrada es una secuencia de PNG y no un archivo de video, así que no hay
#      -ss ni -t: la duración es cuántos cuadros hay dividido el fps, y eso la
#      hace exacta por construcción en lugar de aproximada por corte.
#
#   2. SALE MUDO (-an). Lo decidió Nicolás para toda la demo: un SVG no tiene
#      sonido y acá no se le agrega ninguno, ni al aviso lineal. Y los elementos
#      concurrentes salen en silencio de todos modos, que es el default del
#      proyecto (ADR 0014: el `volume` ausente es silencio).
#
#   3. EL TAMAÑO DE SALIDA ES PARÁMETRO Y NO ES EL NATIVO DEL CREATIVO. Se captura
#      a 1920x1080 (o 1680x189) porque medir animación a resolución reducida da
#      falsos negativos, y se ESCALA ACÁ, que es lo que la T-05 tiene mandado:
#      "se captura a la resolución nativa y se escala en el empaquetado si hace
#      falta". Los tamaños salen de la caja en que cada forma se dibuja sobre un
#      cuadro de 1280x720, que es el precedente escrito de
#      demo/hydration-break/scripts/creativos.sh ("cada creativo sale al tamaño
#      exacto de su caja"), y los calcula puente-a-video.sh desde los `viewport`
#      de stage.json para que no queden escritos dos veces.
#
#      Hay una excepción y es el 16:9: su caja sobre el par mide 640x360, pero esa
#      MISMA pieza es además el aviso LINEAL de su break (ADR 0082) y ahí ocupa la
#      pantalla entera del pane de fábrica. Sale a 1280x720, que es el tamaño del
#      contenido primario. Un 640x360 estirado al doble en cámara es exactamente
#      lo que un vector venía a evitar.
#
#   4. EL ALFA SE APLANA CONTRA NEGRO, EXPLÍCITAMENTE. Los PNG capturados
#      conservan su transparencia —el backplate de la L la usa en la guarda— y
#      H.264 no tiene canal alfa. Dejar que `format=yuv420p` lo descarte solo
#      funciona por accidente: depende de qué RGB haya debajo de un píxel
#      transparente. Acá se compone sobre un `color=black` del tamaño de salida,
#      que es además la cama que la librería le pone a todo <video>
#      (lib/renderer.js:715), así que lo que se ve es lo mismo.
#
# 1280x720 y EXT-X-PROGRAM-DATE-TIME no cambian respecto del molde, y por las
# mismas dos razones: es la configuración con la que la T-01 de la fase 01 midió
# cinco elementos de video a la vez, y sin PROGRAM-DATE-TIME un START-DATE no se
# puede resolver (ADR 0005).
set -euo pipefail

CUADROS=${1:?directorio con los PNG (f%05d.png)}
OUT=${2:?directorio de salida}
W=${3:?ancho de salida}
H=${4:?alto de salida}
FPS=${5:-30}
BV=${6:-2500k}

# El GOP son dos segundos de cuadros, redondeado al entero: 60 a 30 fps. Con un
# GOP que no cae en dos segundos, los cortes de -hls_time 2 no caen sobre un
# keyframe (ADR 0059). Y `-sc_threshold 0`, porque un corte de escena mete un
# keyframe fuera de lugar, reinicia la cuenta del GOP y corre todos los cortes que
# siguen: se vio en la fase 15, con los creativos reanimados.
GOP=$(awk -v f="$FPS" 'BEGIN{split(f,a,"/"); v=(a[2]?a[1]/a[2]:a[1]); printf "%d", int(v*2+0.5)}')

N=$(ls "$CUADROS"/f*.png 2>/dev/null | wc -l)
[ "$N" -gt 0 ] || { echo "ERROR: no hay cuadros en $CUADROS" >&2; exit 1; }

# Las dimensiones impares no existen en yuv420p, y el modo de falla es que ffmpeg
# lo dice en una línea que se pierde entre las demás. Se para acá.
[ $((W % 2)) = 0 ] && [ $((H % 2)) = 0 ] || {
  echo "ERROR: ${W}x${H} tiene un lado impar y yuv420p no lo admite." >&2; exit 1; }

mkdir -p "$OUT"
rm -f "$OUT"/*.ts "$OUT"/index.m3u8

ffmpeg -hide_banner -loglevel error -y \
  -framerate "$FPS" -i "$CUADROS/f%05d.png" \
  -filter_complex "color=c=black:s=${W}x${H}:r=${FPS}[bg];\
[0:v]scale=${W}:${H}:flags=lanczos,setsar=1[fg];\
[bg][fg]overlay=shortest=1:format=auto,format=yuv420p[v]" \
  -map "[v]" -an \
  -c:v libx264 -preset veryfast -g "$GOP" -sc_threshold 0 -b:v "$BV" \
  -f hls -hls_time 2 -hls_playlist_type vod -hls_segment_type mpegts \
  -hls_flags program_date_time+independent_segments \
  -hls_segment_filename "$OUT/seg%03d.ts" "$OUT/index.m3u8"

LARGO=$(awk -F: '/^#EXTINF:/ {s += $2} END {printf "%.3f", s}' "$OUT/index.m3u8")
echo "$OUT/index.m3u8  (${W}x${H}, $N cuadros a $FPS fps, gop=$GOP, $(ls "$OUT"/*.ts | wc -l) segmentos, $LARGO s por suma de #EXTINF)"
