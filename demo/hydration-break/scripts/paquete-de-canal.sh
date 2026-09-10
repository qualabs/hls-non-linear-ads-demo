#!/usr/bin/env bash
# Quema el paquete de canal ficticio sobre el plate: el bug del canal, el reloj que
# corre, y el gráfico que CAMBIA cuando entra la parada -- el tanteador durante el
# juego, y `HYDRATION BREAK` en su lugar durante la parada.
#
# POR QUÉ CAMBIA: porque **el estado del partido cambió**, y el gráfico es cómo una
# transmisión dice eso. En ese minuto no hay nada que tantear. **No mitiga una
# discontinuidad: no hay discontinuidad** — la parada sale generada desde el cuadro
# de juego, así que la imagen muestra a los jugadores dejando de jugar y yendo a
# tomar agua.
#
# La razón va escrita así a propósito, porque una razón equivocada sobrevive mejor
# que un error: si acá dijera "disimula el corte", el día que alguien mire y vea que
# no hay corte lo sacaría, con toda la lógica del mundo.
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
# gráfico que cambia y el break que dibuja publicidad encima leen un solo número.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=${1:?video de entrada}
OUT=${2:?video de salida}

PARADA_EN=$(node -e 'process.stdout.write(String(require("./plate.json").paradaEn))')
PARADA_DURA=$(node -e 'process.stdout.write(String(require("./plate.json").paradaDura))')
PARADA_FIN=$(awk -v a="$PARADA_EN" -v b="$PARADA_DURA" 'BEGIN { printf "%s", a + b }')

# EL RELOJ ARRANCA EN 32:10 Y NO SE DETIENE, tampoco durante la parada, y la razón
# es de fútbol y no de diseño: en una parada de hidratación el partido no está
# detenido reglamentariamente. Un reloj corriendo mientras el tanteador se va dice
# exactamente "el partido no se detuvo, la transmisión cambió de gráfico", que es la
# propiedad que esta demo existe para mostrar.
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

rasteriza "$PWD/graphics/bug-de-canal.svg"    "$TMP/bug.png"
rasteriza "$PWD/graphics/scorebug.svg"        "$TMP/scorebug.png"
rasteriza "$PWD/graphics/hydration-break.svg" "$TMP/hydration.png"

FUENTE=/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf
[ -f "$FUENTE" ] || FUENTE=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf
[ -f "$FUENTE" ] || { echo "falta una fuente monoespaciada en /usr/share/fonts" >&2; exit 1; }

# El orden del filtro importa y es el de una transmisión: el bug del canal, que está
# siempre; después el tanteador SÓLO durante el juego y `HYDRATION BREAK` SÓLO durante la
# parada, los dos con `enable` sobre `t`, que es lo que hace el cambio; y encima el reloj,
# que va adentro del hueco que las dos placas dejan en las mismas coordenadas.
#
# El reloj se dibuja ÚLTIMO a propósito: así queda sobre cualquiera de las dos placas y no
# hay un instante del cambio en el que los dígitos queden tapados.
ffmpeg -hide_banner -loglevel error -y \
  -i "$SRC" -i "$TMP/bug.png" -i "$TMP/scorebug.png" -i "$TMP/hydration.png" \
  -filter_complex "\
[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1[bg];\
[bg][1:v]overlay=0:0:format=auto[conbug];\
[conbug][2:v]overlay=0:0:format=auto:enable='lt(t,$PARADA_EN)+gt(t,$PARADA_FIN)'[conjuego];\
[conjuego][3:v]overlay=0:0:format=auto:enable='between(t,$PARADA_EN,$PARADA_FIN)'[conplacas];\
[conplacas]drawtext=fontfile=$FUENTE:\
text='%{eif\\:floor((t+$RELOJ_DESDE)/60)\\:d\\:2}\\:%{eif\\:mod(floor(t+$RELOJ_DESDE)\\,60)\\:d\\:2}':\
x=186:y=44:fontsize=27:fontcolor=0xF4F6F8[v]" \
  -map "[v]" -map 0:a? \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p \
  -c:a copy \
  "$OUT"

echo "$OUT"
echo "  bug de canal: siempre"
echo "  reloj: corre desde 32:10, y NO se detiene en la parada"
echo "  tanteador: de 0s a ${PARADA_EN}s y de ${PARADA_FIN}s en adelante"
echo "  HYDRATION BREAK: de ${PARADA_EN}s a ${PARADA_FIN}s (de plate.json)"
