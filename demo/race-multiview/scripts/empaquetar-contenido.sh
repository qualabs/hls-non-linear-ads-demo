#!/usr/bin/env bash
# Empaqueta un archivo de video como VOD en HLS: H.264 + AAC, segmentos de 2 s y
# EXT-X-PROGRAM-DATE-TIME.
#
# ES UNA COPIA DEL DE `demo/hydration-break/` Y NO DEL DE `demo/multiview-offer/`, que es
# la demo de la que sale todo lo demás de ésta. La razón es la firma: el de multiview tiene
# 1280x720, 30 fps y `-g 60` fijos adentro y no toma audio; el de hydration-break toma
# `SRC OUT SS DUR CROP ANCHO ALTO FPS AUDIO` por argumento, que es exactamente lo que esta
# demo necesita -- 24 fps y una pista de audio aparte.
#
# Y SE COPIA EN LUGAR DE IMPORTARSE, que es la política del repositorio: cada demo lleva su
# recipe adentro, así que una demo que se publica sola no depende de un archivo de otra.
#
# ----------------------------------------------------------------------------------------
# LOS 24 CUADROS POR SEGUNDO, QUE ES LO ÚNICO QUE ESTA DEMO DECIDE DISTINTO
# ----------------------------------------------------------------------------------------
# Todo el video de esta demo sale de Veo y Veo entrega 24 -- medido: 192 cuadros en 8,000 s
# por clip, y los concats dan 2688 y 1536 cuadros exactos. El ADR 0059 manda empaquetar el
# video generado a la cadencia de su fuente: a 30 se duplicaría un cuadro de cada cuatro,
# que es el tironeo que la fase 10 le sacó al plate del partido por la misma razón.
#
# Los 30 del default de las otras demos no son decorativos y por eso no se discuten acá:
# salen de la T-01 de la fase 01, que midió que cinco elementos de video a 1280x720 y 30 fps
# decodifican a la vez. Bajar a 24 no toca esa medición -- menos cuadros por segundo no es
# más carga -- y el tope de esta demo son cuatro cajas.
#
# EL GOP ACOMPAÑA AL FPS y no es un detalle: son dos segundos de cuadros, que es lo que hace
# que los cortes de `-hls_time 2` caigan sobre un keyframe. Fijo en 60 con una entrada de 24
# daría un keyframe cada 2,5 s y los segmentos se irían de largo, que es justo lo que la
# comprobación de largos de `verificar-largos.mjs` mide.
#
# ----------------------------------------------------------------------------------------
# 1280x720 PARA TODO, PROGRAMA Y CÁMARAS
# ----------------------------------------------------------------------------------------
# No se empaqueta cada cámara al tamaño de su caja, que es lo que la demo del partido hace
# con sus creativos: allá la caja la declara el que publica y no cambia, así que el creativo
# puede nacer con su relación de aspecto. Acá la caja cambia de tamaño EN VIVO cuando sube o
# baja otra cámara, y una vista agrandada va casi a cuadro entero. El tamaño de destino es
# uno solo y el recorte lo hace el layout (ADR 0013), que es lo que ya hace la demo de la
# fase 11.
#
# El EXT-X-PROGRAM-DATE-TIME no es opcional: sin él un START-DATE no se puede resolver y el
# Date Range de la oferta no tendría dónde anclarse (ADR 0005).
#
# El encuadre se resuelve con recorte centrado y sin deformar (ADR 0013).
set -euo pipefail

SRC=${1:?archivo de entrada}
OUT=${2:?directorio de salida}
SS=${3:-0}
DUR=${4:?duración en segundos}
# Recorte previo opcional, como expresión de `crop` de ffmpeg (w:h:x:y). Es para las fuentes
# que traen las bandas negras quemadas en el cuadro. Ninguna de esta demo las trae -- Veo
# entrega 1280x720 limpio --, y el argumento queda porque es el de la firma que se copió.
CROP=${5:-}
ANCHO=${6:-1280}
ALTO=${7:-720}
# Los cuadros por segundo, y el porqué de que sea un argumento está arriba.
FPS=${8:-24}
# EL AUDIO, como archivo aparte.
#
# Va por argumento y no adentro del video por lo mismo que en la demo del partido: lo que
# suena se produce aparte y llega acá al lado del video. Acá además el video crudo SÍ trae
# audio -- el ambiente que Veo genera --, pero el que se empaqueta es el mezclado, que es el
# que `armar-programa.sh` y `armar-camara.sh` dejaron emparejado de nivel y a -23,0 LUFS.
# Ese emparejado es el que hace que agrandar una cámara no sea un salto de volumen (ADR 0026),
# así que empaquetar la pista cruda del mp4 tiraría medio trabajo de las dos tasks anteriores.
AUDIO=${9:-}

mkdir -p "$OUT"
rm -f "$OUT"/*.ts "$OUT"/index.m3u8

# El `-map` sólo aparece cuando hay audio aparte. Sin él ffmpeg elige solo, que es lo que
# hace para una entrada que ya trae su propia pista.
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
