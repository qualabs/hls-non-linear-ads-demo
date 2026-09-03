#!/usr/bin/env bash
# Genera los VOD HLS de prueba usados por las tres mediciones de la fase 01.
# Cinco fuentes distintas (una primaria y cuatro avisos), 1280x720 a 30 fps,
# H.264 + AAC, segmentos de 2 s, con EXT-X-PROGRAM-DATE-TIME.
set -e
W=${1:?directorio de salida}
enc() { # $1 nombre, $2 segundos, $3 filtro de video, $4 frecuencia del tono
  mkdir -p "$W/$1"
  ffmpeg -hide_banner -loglevel error -y \
    -f lavfi -i "testsrc2=size=1280x720:rate=30:duration=$2,$3" \
    -f lavfi -i "sine=frequency=$4:duration=$2" \
    -c:v libx264 -preset ultrafast -tune zerolatency -g 60 -b:v 2000k -pix_fmt yuv420p \
    -c:a aac -b:a 96k -shortest \
    -f hls -hls_time 2 -hls_playlist_type vod -hls_segment_type mpegts \
    -hls_flags program_date_time+independent_segments \
    -hls_segment_filename "$W/$1/seg%03d.ts" "$W/$1/index.m3u8"
}
enc primary 40 "hue=h=0"   440
enc adA     15 "hue=h=120" 660
enc adB     15 "hue=h=240" 880
enc adC     15 "hue=h=60"  520
enc adD     15 "hue=h=300" 330
