#!/usr/bin/env bash
# La aserción de que lo capturado es lo animado. Corre sobre el HLS que
# empaquetar-creativo.sh acaba de escribir, con los cuadros del navegador que lo
# originaron al lado como referencia.
#
# EXISTE PORQUE EL DEFECTO DE ESTE PASO ES INVISIBLE EN EL ARCHIVO. Un video con
# cuadros perdidos, con el bucle cortado, con un arranque tarde o —el peor— con un
# solo cuadro congelado repetido 360 veces pesa parecido, dura lo mismo y se abre
# igual. Sólo aparece en cámara. Es la lección medida de la fase 10, donde un
# comentario afirmaba que `-sseof -1 -frames:v 1` daba el último cuadro y daba el
# 168 de 192.
#
# MIDE TRES COSAS Y CADA UNA VA CONTRA SU REFERENCIA:
#
#   1. CUÁNTOS CUADROS Y CUÁNTO DURA, contra lo declarado. Los cuadros se cuentan
#      DECODIFICANDO (`-count_frames`) y no leyendo metadatos, y la duración se
#      saca SUMANDO LOS #EXTINF, que es la única medición que vale en este
#      repositorio. El control es una captura cortada a propósito.
#
#   2. QUE EL VIDEO SE MUEVA LO QUE EL SVG SE MUEVE. Para cada par de instantes
#      muestreados se mide cuánto cambió el VIDEO y cuánto cambió el mismo par de
#      cuadros del NAVEGADOR, y se comparan como fracción del cuadro. El control
#      es un video congelado verificado contra los cuadros reales: ahí el SVG se
#      mueve y el video no, y la aserción se pone roja.
#
#   3. QUE SE MUEVA EN FASE, y no en otro orden ni con otro desfasaje: el cuadro 0
#      del video se compara contra SIETE cuadros del navegador (0, 5, 10, 15, 20,
#      25 y 30) y lo que se afirma es dónde cae el MÍNIMO. Si cae en 0, el video
#      arranca donde el SVG arranca. El control es `--desfasar N`, abajo.
#
# ── LOS CUADROS DEL VIDEO SE SACAN SIN BUSCAR POR TIEMPO ────────────────────
# Se DECODIFICA DESDE EL PRINCIPIO de una sola pasada y se guardan los primeros
# 61 cuadros. No hay `-ss`, así que no hay punto de partida que elegir mal.
#
# Existe por un defecto MEDIDO: el MPEG-TS que escribe el empaquetado NO EMPIEZA
# EN CERO —su primer PTS es 1,4667 s, el retardo de multiplexado por defecto del
# contenedor—, así que `-ss 0` pide un punto ANTERIOR al comienzo del stream y lo
# que vuelve no es el primer cuadro. Medido sobre `content/creatives/zumbra-16x9/`:
#
#     $ ffprobe -show_entries packet=pts_time ... | head -3
#     1.466667
#     1.500000
#     1.566667
#     $ pxdif  (cuadro con -ss 0)      vs (navegador f00000)  5%   19922 px
#     $ pxdif  (primer cuadro SIN -ss) vs (navegador f00000)  5%    2882 px
#     $ pxdif  (cuadro con -ss 0)      vs (primer cuadro SIN -ss)   18829 px
#
# Los 2.882 px son el ruido de recodificación de un cuadro que SÍ es el mismo. Con
# el cuadro 0 equivocado, la aserción de fase compara cualquier cosa contra
# cualquier cosa y el par 0->15 de la aserción de movimiento mide un salto que el
# SVG no tiene. Sobre estas nueve piezas el veredicto no llegaba a darse vuelta
# porque se mueven poco; sobre una cámara que barre una pista, sí.
#
# ── LA FASE SE MIDE POR MÍNIMO Y NO POR UNA COMPARACIÓN ────────────────────
# "El cuadro 0 se parece más al 0 que al 15" es una comparación entre DOS
# candidatos, y con dos candidatos un empate lo decide el ruido. El mínimo sobre
# siete dice además EN QUÉ cuadro cae, que es una afirmación que puede salir mal
# de seis maneras en lugar de una.
#
# ── Y EL INSTRUMENTO SE VE ENCONTRAR ANTES DE CREERLE ──────────────────────
# `--desfasar N` corre la misma medición partiendo del cuadro N del video en lugar
# del 0. El mínimo TIENE que caer en N. Un instrumento que siempre contestara "cae
# en 0" contestaría eso también con un video corrido, y no estaría midiendo nada.
#
# ── POR QUÉ LA REFERENCIA ES EL PROPIO SVG Y NO UN NÚMERO FIJO ──────────────
# La primera versión de esta aserción exigía que el video moviera más del 1 % del
# cuadro, y KOVRIN la puso roja: su movimiento es "el suelo y no el zapato", un
# patrón de tacos de bajo contraste que corre por debajo, y movió 3.495 px de
# 921.600 (0,38 %). El video estaba BIEN —el mismo par movía 7.775 px de 2.073.600
# en el navegador, o sea 0,375 %, así que el video movió MÁS que el SVG como
# fracción del cuadro—; lo que estaba mal era el número fijo, calibrado contra un
# creativo ruidoso.
#
# Un umbral absoluto sobre "cuánto se mueve" no puede existir: cuánto se mueve es
# una propiedad del creativo y no del pipeline. Lo que el pipeline tiene que
# garantizar es que NO PIERDE el movimiento que había, y eso sólo se mide contra
# el movimiento que había.
#
# ── POR QUÉ TODAS LAS COMPARACIONES VAN CON UMBRAL 5 % ─────────────────────
# Medido sobre un video CONGELADO —el mismo PNG repetido 360 veces, pasado por
# H.264— que no se mueve en absoluto: 328.496 px de 921.600 de diferencia con
# umbral 0, y 563 con umbral 5 %. Es el ±1 de cuantización del códec repartido por
# todo el cuadro. Con umbral 0 un video congelado pasa por "movido", así que el
# umbral no es una tolerancia puesta para que pase: es lo que hace que la medición
# mida movimiento y no ruido. El mismo umbral se aplica a los cuadros del
# navegador para que las dos fracciones sean comparables.
#
# Y ES ESTA MEDICIÓN la que obligó a arreglar pxdif.sh antes de usarlo: un cuadro
# de video monocromo sale de ffmpeg como PNG en escala de grises, y la versión de
# la T-02 devolvía 0 contra un sRGB aunque los colores fueran distintos. Un cero
# ahí habría dicho "el video salió igual al SVG".
set -euo pipefail
cd "$(dirname "$0")/.."

HLS=${1:?playlist HLS del creativo (index.m3u8)}
FPS=${2:?fps declarado}
DUR=${3:?duración declarada en segundos}
REF=${4:-}            # directorio con los PNG del navegador que originaron el video
DESFASE=0             # el control: de qué cuadro del video se parte para medir la fase
[ "${5:-}" = "--desfasar" ] && DESFASE=${6:?--desfasar pide un número de cuadro}

PXDIF=./scripts/pxdif.sh
UMBRAL=5%
# Cuánto puede perder el video del movimiento del SVG antes de que sea un defecto
# y no la escala. El video sale a 2/3 del ancho nativo y recodificado, así que algo
# pierde; cuatro veces es holgura amplia sobre lo medido, donde el video movía MÁS
# que el SVG (KOVRIN: 0,590 % contra 0,375 %).
HOLGURA=4

mkdir -p "${XDG_RUNTIME_DIR:-/tmp}/cto"
T=$(mktemp -d "${XDG_RUNTIME_DIR:-/tmp}/cto/verificar-creativo-XXXXXX")
trap 'rm -rf "$T"' EXIT

fallos=0
malo() { echo "  ROJO  $*"; fallos=$((fallos + 1)); }
bien() { echo "  VERDE $*"; }

# ── 1. cuadros y duración ────────────────────────────────────────────────────
ESP_N=$(awk -v d="$DUR" -v f="$FPS" 'BEGIN{printf "%d", d*f+0.5}')
# ffprobe imprime el conteo DOS VECES —una por el stream y otra por el programa
# del MPEG-TS— más una línea vacía en el medio, así que la salida cruda de un
# video de 360 cuadros es "360\n\n360\n". Comparar eso contra 360 da distinto
# SIEMPRE, incluido cuando está bien. Se toma la primera línea.
N=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames \
      -of csv=p=0 "$HLS" | head -n1 | tr -cd '0-9')
LARGO=$(awk -F: '/^#EXTINF:/ {s += $2} END {printf "%.3f", s}' "$HLS")
DIF=$(awk -v a="$LARGO" -v b="$DUR" 'BEGIN{printf "%.3f", (a>b?a-b:b-a)}')

[ "$N" = "$ESP_N" ] && bien "cuadros decodificados: $N (declarado $ESP_N)" \
                    || malo "cuadros decodificados: $N, declarado $ESP_N"
awk -v d="$DIF" 'BEGIN{exit !(d <= 0.034)}' \
  && bien "duración por suma de #EXTINF: $LARGO s (declarado $DUR s, delta $DIF s)" \
  || malo "duración por suma de #EXTINF: $LARGO s, declarado $DUR s (delta $DIF s)"

# ── 2. el video se mueve lo que el SVG se mueve ──────────────────────────────
# Cinco instantes repartidos, de a pares consecutivos. Un solo par no distingue
# "no anima" de "cayeron en la misma fase del bucle".
CUADROS_REF=(0 15 30 45 60)
# Los 61 primeros cuadros de UNA pasada y sin `-ss`, por la razón medida de la
# cabecera. `-start_number 0` para que el archivo vNNNNN sea el cuadro NNNNN.
ffmpeg -hide_banner -loglevel error -y -i "$HLS" -frames:v 61 -start_number 0 "$T/v%05d.png"
v() { printf '%s/v%05d.png' "$T" "$1"; }
AREA_V=$(identify -format "%[fx:w*h]" "$(v 0)")

if [ -z "$REF" ]; then
  malo "sin cuadros del navegador de referencia: el movimiento NO se puede medir"
else
  AREA_R=$(identify -format "%[fx:w*h]" "$REF/f00000.png")
  perdidos=""
  for i in 0 1 2 3; do
    j=$((i + 1))
    dv=$($PXDIF "$(v "${CUADROS_REF[$i]}")" "$(v "${CUADROS_REF[$j]}")" "$UMBRAL")
    ds=$($PXDIF "$REF/$(printf 'f%05d.png' "${CUADROS_REF[$i]}")" \
                "$REF/$(printf 'f%05d.png' "${CUADROS_REF[$j]}")" "$UMBRAL")
    lectura=$(awk -v dv="$dv" -v av="$AREA_V" -v ds="$ds" -v ar="$AREA_R" -v k="$HOLGURA" \
      'BEGIN{fv=dv/av; fs=ds/ar;
             printf "%.4f %.4f %d", fv*100, fs*100, (ds>0 && fv >= fs/k) ? 1 : 0}')
    read -r pv ps ok <<<"$lectura"
    printf '        cuadros %3d->%3d  video %7d px (%s %%)   SVG %7d px (%s %%)   %s\n' \
      "${CUADROS_REF[$i]}" "${CUADROS_REF[$j]}" "$dv" "$pv" "$ds" "$ps" \
      "$([ "$ok" = 1 ] && echo ok || echo FALLA)"
    [ "$ok" = 1 ] || perdidos="$perdidos ${CUADROS_REF[$i]}->${CUADROS_REF[$j]}"
  done
  if [ -z "$perdidos" ]; then
    bien "el video conserva el movimiento del SVG en los cuatro pares (holgura 1/$HOLGURA)"
  else
    malo "el video PIERDE el movimiento del SVG en los pares:$perdidos"
  fi

  # ── 3. en fase con el SVG, por mínimo ──────────────────────────────────────
  W=$(identify -format "%w" "$(v 0)"); H=$(identify -format "%h" "$(v 0)")
  # El PNG del navegador es de otro tamaño y tiene alfa: se lo lleva al del video
  # por el mismo camino que el empaquetado —aplanado contra negro— para que lo
  # único que quede distinto sea la recodificación.
  ref() { magick -size "${W}x${H}" xc:black \( "$1" -resize "${W}x${H}!" \) \
            -compose over -composite "$2"; }
  mejor=-1; mejorD=""
  for k in 0 5 10 15 20 25 30; do
    ref "$REF/$(printf 'f%05d.png' "$k")" "$T/r$k.png"
    d=$($PXDIF "$(v "$DESFASE")" "$T/r$k.png" "$UMBRAL")
    printf '        cuadro %d del video vs cuadro %2d del navegador  %8d px\n' "$DESFASE" "$k" "$d"
    if [ "$mejor" = -1 ] || [ "$d" -lt "$mejorD" ]; then mejor=$k; mejorD=$d; fi
  done
  [ "$mejor" = "$DESFASE" ] \
    && bien "el mínimo cae en el cuadro $mejor del navegador, que es donde el cuadro $DESFASE del video tiene que caer" \
    || malo "el mínimo cae en el cuadro $mejor del navegador y el cuadro del video es el $DESFASE"
fi

[ "$fallos" = 0 ] || { echo "  => $fallos aserción(es) en rojo para $HLS"; exit 1; }
echo "  => $HLS en verde"
