#!/usr/bin/env bash
# LA FASE DE UNA PIEZA DE LA CARRERA, MEDIDA SIN BUSCAR POR TIEMPO.
#
# Existe por un defecto MEDIDO en cómo se sacaba el cuadro 0 del video, y no para
# aflojar una aserción. `verificar-creativo.sh` extrae cada cuadro con
# `ffmpeg -ss $t -i $HLS -frames:v 1`, y el MPEG-TS que escribe el empaquetado NO
# EMPIEZA EN CERO: su primer PTS es 1,4667 s, que es el retardo de multiplexado
# por defecto del contenedor. Con `-ss 0` el punto pedido queda ANTES del
# comienzo del stream y lo que vuelve no es el primer cuadro. Medido sobre
# `content/race/caldrix/`:
#
#     $ ffprobe -show_entries packet=pts_time ... | head -3
#     1.466667
#     1.533333
#     1.500000
#     $ pxdif  (cuadro del video con -ss 0)  vs  (navegador en t=56)   537653 px
#     $ pxdif  (primer cuadro SIN -ss)       vs  (navegador en t=56)     2733 px
#
# Los 2.733 px son el ruido de recodificación de un cuadro que SÍ es el mismo;
# los 537.653 son otro momento de la carrera. Con el cuadro 0 equivocado, la
# aserción de fase compara cualquier cosa contra cualquier cosa, y el par 0->15
# de la aserción de movimiento mide un salto que el SVG no tiene. No muerde
# siempre: sobre los nueve creativos de la T-05 el mismo defecto está presente y
# el veredicto no se dio vuelta porque aquellas piezas se mueven poco. Acá, con
# una cámara que barre la pista, se da vuelta.
#
# ── CÓMO SE SACAN LOS CUADROS ACÁ ──────────────────────────────────────────
# No se busca: se DECODIFICA DESDE EL PRINCIPIO y se guardan los primeros 61
# cuadros de una sola pasada. Sin `-ss` no hay punto de partida que elegir mal.
#
# ── LA FASE SE MIDE POR MÍNIMO Y NO POR UNA COMPARACIÓN ────────────────────
# "El cuadro 0 se parece más al 0 que al 15" es una comparación entre dos
# candidatos, y con dos candidatos un empate lo decide el ruido. Acá el cuadro 0
# del video se compara contra SIETE cuadros del navegador (0, 5, 10, 15, 20, 25 y
# 30) y lo que se afirma es dónde cae el MÍNIMO. Si cae en 0, el video arranca
# donde el SVG arranca.
#
# ── Y EL INSTRUMENTO SE VE ENCONTRAR ANTES DE CREERLE ──────────────────────
# `--desfasar N` corre la misma medición partiendo del cuadro N del video en
# lugar del 0. El mínimo TIENE que caer en N. Es el control: un instrumento que
# siempre contesta "cae en 0" contestaría eso también con un video corrido, y no
# estaría midiendo nada. Se corre con N distinto de cero antes de apoyarse en el
# veredicto.
set -euo pipefail
cd "$(dirname "$0")/.."

HLS=${1:?playlist HLS de la pieza}
SVG=${2:?el SVG que la originó}
DESDE=${3:-0}                  # instante de la escena en el que arranca la pieza
DESFASE=${4:-0}                # el control: de qué cuadro del video se parte

FPS=30
UMBRAL=5%
HOLGURA=4
PY=/home/nicolas/Skills/playwright/.venv/bin/python
PXDIF=./scripts/pxdif.sh

mkdir -p "${XDG_RUNTIME_DIR:-/tmp}/cto"
T=$(mktemp -d "${XDG_RUNTIME_DIR:-/tmp}/cto/fase-carrera-XXXXXX")
trap 'rm -rf "$T"' EXIT

# 61 cuadros del video, de una pasada y sin buscar.
ffmpeg -hide_banner -loglevel error -y -i "$HLS" -frames:v 61 -start_number 0 "$T/v%05d.png"
# 61 cuadros del navegador desde el mismo instante de la escena.
"$PY" scripts/capturar-svg.py "$SVG" "$T/nav" --fps "$FPS" --desde "$DESDE" \
  --duracion "$(awk 'BEGIN{printf "%.6f", 61/30}')" >/dev/null
# El PNG del navegador lleva alfa; se aplana contra negro, que es sobre lo que el
# empaquetado compuso.
for i in $(seq -w 0 60); do
  magick "$T/nav/f000$i.png" -background black -alpha remove -alpha off "$T/r000$i.png"
done

echo "  $HLS"
fallos=0
malo() { echo "  ROJO  $*"; fallos=$((fallos + 1)); }
bien() { echo "  VERDE $*"; }

AREA=$(identify -format "%[fx:w*h]" "$T/v00000.png")

# ── el video se mueve lo que el SVG se mueve ────────────────────────────────
perdidos=""
for par in "0 15" "15 30" "30 45" "45 60"; do
  set -- $par
  dv=$($PXDIF "$T/$(printf 'v%05d.png' $1)" "$T/$(printf 'v%05d.png' $2)" "$UMBRAL")
  ds=$($PXDIF "$T/$(printf 'r%05d.png' $1)" "$T/$(printf 'r%05d.png' $2)" "$UMBRAL")
  lectura=$(awk -v dv="$dv" -v ds="$ds" -v a="$AREA" -v k="$HOLGURA" \
    'BEGIN{printf "%.4f %.4f %d", dv*100/a, ds*100/a, (ds>0 && dv >= ds/k) ? 1 : 0}')
  read -r pv ps ok <<<"$lectura"
  printf '        cuadros %3d->%3d  video %7d px (%s %%)   SVG %7d px (%s %%)   %s\n' \
    "$1" "$2" "$dv" "$pv" "$ds" "$ps" "$([ "$ok" = 1 ] && echo ok || echo FALLA)"
  [ "$ok" = 1 ] || perdidos="$perdidos $1->$2"
done
[ -z "$perdidos" ] && bien "el video conserva el movimiento del SVG en los cuatro pares (holgura 1/$HOLGURA)" \
                   || malo "el video PIERDE el movimiento del SVG en los pares:$perdidos"

# ── la fase, por mínimo ─────────────────────────────────────────────────────
ref=$(printf 'v%05d.png' "$DESFASE")
mejor=-1; mejorD=""
for k in 0 5 10 15 20 25 30; do
  d=$($PXDIF "$T/$ref" "$T/$(printf 'r%05d.png' "$k")" "$UMBRAL")
  printf '        cuadro %d del video vs cuadro %2d del navegador  %8d px\n' "$DESFASE" "$k" "$d"
  if [ "$mejor" = -1 ] || [ "$d" -lt "$mejorD" ]; then mejor=$k; mejorD=$d; fi
done
[ "$mejor" = "$DESFASE" ] \
  && bien "el mínimo cae en el cuadro $mejor del navegador, que es donde el cuadro $DESFASE del video tiene que caer" \
  || malo "el mínimo cae en el cuadro $mejor del navegador y el cuadro del video es el $DESFASE"

[ "$fallos" = 0 ] || { echo "  => $fallos aserción(es) en rojo"; exit 1; }
echo "  => en verde"
