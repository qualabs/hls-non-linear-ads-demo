#!/usr/bin/env bash
# Empaqueta un archivo de video como VOD en HLS para la demo stage-pair.
#
# Es el molde de demo/compatibility-pair/scripts/empaquetar-contenido.sh con dos
# cambios, y los dos tienen razón escrita:
#
#   1. La cadencia se pasa por parámetro y por defecto es 30000/1001 (29,97) en
#      lugar de 30. El ADR 0059 manda seguir la cadencia de la fuente cuando la
#      hay: SPARKS viene a 59,94, y 29,97 es su mitad exacta, así que se
#      descartan cuadros enteros y no se remuestrea a otra cadencia. Un fps=30
#      sobre una fuente de 59,94 no es la mitad de nada: remuestrea, y eso es
#      exactamente lo que el ADR prohíbe. La elección de la mitad y no de los
#      59,94 está argumentada en stage.json (`programa.fps`): el sobre medido
#      del proyecto es de cinco elementos a 30 fps y race.html llega a cinco.
#
#   2. El GOP acompaña al fps —dos segundos de cuadros, o sea 60 a 29,97— en
#      lugar de estar fijo en 60. Es la consecuencia que el propio ADR 0059
#      escribe: con un GOP que no cae en dos segundos, los cortes de
#      -hls_time 2 no caen sobre un keyframe.
#
# Lo que NO cambia respecto del molde, y por qué:
#
#   - 1280x720. Es la configuración con la que la T-01 de la fase 01 midió que
#     cinco elementos de video reproducen a la vez, que es lo que race.html
#     necesita. La fuente es 4096x2160 (1,896:1, no 16:9), así que el encuadre
#     se resuelve con recorte centrado y sin deformar, que es la política del
#     ADR 0013.
#
#   - EXT-X-PROGRAM-DATE-TIME. Sin él un START-DATE no se puede resolver y los
#     Date Ranges de la señalización no tendrían dónde anclarse (ADR 0005).
#
# El audio se RECODIFICA, y acá se dice con qué y por qué. La fuente trae
# AAC-HE 2.0 a 48 k, que no es lo que traen los otros primarios del
# repositorio. Sale como AAC-LC 96 k 2.0 a 48 k, que es el perfil de audio de
# todas las demás demos. Dos razones independientes: HE-AAC dentro de MPEG-TS
# depende de que el decodificador resuelva la SBR, que es la clase de cosa que
# una demo que se muestra en escenario no quiere estar averiguando; y un
# primario con otro perfil de audio que el resto del repositorio es una
# diferencia sin propósito. El ADR 0059 gobierna la cadencia de video y no dice
# nada del audio.
set -euo pipefail

SRC=${1:?archivo de entrada}
OUT=${2:?directorio de salida}
SS=${3:-0}
DUR=${4:?duración en segundos}
FPS=${5:-30000/1001}

# El GOP son dos segundos de cuadros, redondeado al entero: 60 a 29,97.
GOP=$(awk -v f="$FPS" 'BEGIN{split(f,a,"/"); v=(a[2]?a[1]/a[2]:a[1]); printf "%d", int(v*2+0.5)}')

mkdir -p "$OUT"
rm -f "$OUT"/*.ts "$OUT"/index.m3u8

ffmpeg -hide_banner -loglevel error -y \
  -ss "$SS" -i "$SRC" -t "$DUR" \
  -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=$FPS" \
  -c:v libx264 -preset veryfast -g "$GOP" -b:v 2500k -pix_fmt yuv420p \
  -c:a aac -b:a 96k -ac 2 -ar 48000 \
  -f hls -hls_time 2 -hls_playlist_type vod -hls_segment_type mpegts \
  -hls_flags program_date_time+independent_segments \
  -hls_segment_filename "$OUT/seg%03d.ts" "$OUT/index.m3u8"

echo "$OUT/index.m3u8  ($(ls "$OUT"/*.ts | wc -l) segmentos, fps=$FPS, gop=$GOP)"
