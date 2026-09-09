#!/usr/bin/env bash
# Quema el paquete de canal ficticio sobre el plate: el scorebug, el bug del
# canal, el reloj que corre, y la placa de parada del juego durante la parada.
#
# ES LA PIEZA DE MAYOR PALANCA DE LA DEMO, y por eso es un paso propio y no una
# línea adentro de otro script. El mercado de metraje se parte en dos y no hay
# dinero que cierre la grieta: todo lo que PARECE una transmisión es un partido
# profesional real con derechos de liga, club y sponsors, y todo lo que es
# legalmente limpio es metraje amateur que no parece una transmisión. Estos
# gráficos son lo que la cierra, y son nuestros.
#
# TODO ES INVENTADO: el canal, los dos clubes, el marcador. No se imita el
# vestido de ningún broadcaster real.
#
# EL REPARTO DE HERRAMIENTAS ES EL DEL ADR 0045 y está medido, no elegido por
# comodidad:
#
#   - la geometría y la tipografía se escriben como SVG y se rasterizan con
#     Chrome headless, que da alfa REAL y dimensiones exactas. Lo generado no da
#     ninguna de las dos, y el texto chico sobre una forma vuelve deformado.
#   - el reloj lo dibuja ffmpeg y no el SVG, porque un reloj que no corre es la
#     diferencia entre un gráfico y una transmisión, y un SVG no corre. El SVG
#     deja el hueco y la herramienta lo llena.
#
# Uso:
#   ./scripts/paquete-de-canal.sh <entrada.mp4> <salida.mp4>
#
# Los segundos de la parada del juego salen de plate.json (ADR 0044), que es el
# mismo lugar de donde el script de señalización saca dónde poner el break: el
# gráfico que dice "play stopped" y el break que dibuja publicidad encima leen
# un solo número.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=${1:?video de entrada}
OUT=${2:?video de salida}

PARADA_EN=$(node -e 'process.stdout.write(String(require("./plate.json").paradaEn))')
PARADA_DURA=$(node -e 'process.stdout.write(String(require("./plate.json").paradaDura))')
PARADA_FIN=$(awk -v a="$PARADA_EN" -v b="$PARADA_DURA" 'BEGIN { printf "%s", a + b }')

# El reloj arranca en 32:10 y corre todo el plate. En fútbol el reloj NO se
# detiene durante una parada de hidratación, así que sigue corriendo también
# durante la parada: es lo que hace un reloj de verdad y es gratis.
RELOJ_DESDE=$((32 * 60 + 10))

TMP=$(mktemp -d "${TMPDIR:-/dev/shm}/paquete-de-canal-XXXXXX")
trap 'rm -rf "$TMP"' EXIT

# SVG a PNG con alfa real. `--default-background-color=00000000` es lo que hace
# que el fondo salga transparente en lugar de blanco, y es el flag sin el cual
# todo este camino no sirve para nada.
rasteriza() { # $1 svg, $2 png
  google-chrome --headless=new --disable-gpu \
    --default-background-color=00000000 \
    --window-size=1280,720 \
    --screenshot="$2" "$1" >/dev/null 2>&1
  [ -s "$2" ] || { echo "no se pudo rasterizar $1" >&2; exit 1; }
}

rasteriza "$PWD/graphics/scorebug.svg" "$TMP/scorebug.png"
rasteriza "$PWD/graphics/cooling-break.svg" "$TMP/cooling.png"

FUENTE=/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf
[ -f "$FUENTE" ] || FUENTE=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf
[ -f "$FUENTE" ] || { echo "falta una fuente monoespaciada en /usr/share/fonts" >&2; exit 1; }

# El orden del filtro importa y es el de una transmisión: primero el scorebug,
# que está siempre; encima el reloj, que va adentro de su hueco; y encima la
# placa de la parada, que sólo existe entre `PARADA_EN` y `PARADA_FIN`.
#
# El reloj se arma con la aritmética de `drawtext` sobre `t`: minutos y segundos
# del tiempo de reproducción más el arranque, con dos dígitos cada uno.
ffmpeg -hide_banner -loglevel error -y \
  -i "$SRC" -i "$TMP/scorebug.png" -i "$TMP/cooling.png" \
  -filter_complex "\
[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1[bg];\
[bg][1:v]overlay=0:0:format=auto[conbug];\
[conbug]drawtext=fontfile=$FUENTE:\
text='%{eif\\:floor((t+$RELOJ_DESDE)/60)\\:d\\:2}\\:%{eif\\:mod(floor(t+$RELOJ_DESDE)\\,60)\\:d\\:2}':\
x=186:y=44:fontsize=27:fontcolor=0xF4F6F8[conreloj];\
[conreloj][2:v]overlay=0:0:format=auto:enable='between(t,$PARADA_EN,$PARADA_FIN)'[v]" \
  -map "[v]" -map 0:a? \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p \
  -c:a copy \
  "$OUT"

echo "$OUT"
echo "  scorebug y bug de canal: siempre"
echo "  reloj: corre desde 32:10"
echo "  placa de parada del juego: de ${PARADA_EN}s a ${PARADA_FIN}s (de plate.json)"
