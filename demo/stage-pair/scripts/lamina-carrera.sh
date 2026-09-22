#!/usr/bin/env bash
# LA LÁMINA DE CONTACTO DE LAS CÁMARAS, Y LA MEDICIÓN DE QUE SON SEIS CÁMARAS Y
# NO SEIS COPIAS.
#
# Saca un cuadro de cada cámara EN EL MISMO INSTANTE, lo pone todo en una imagen,
# y mide cuánto se parecen entre sí. Existe porque la definición de terminado de
# la T-09 pide las dos cosas —la que se mira y la que se mide—, y porque el riesgo
# R7 de la fase (las seis cámaras se leen como seis copias) no se descarta
# mirando una sola.
#
# ── EL NÚMERO SOLO NO DICE NADA, ASÍ QUE VA CON DOS REFERENCIAS ─────────────
# "Las cámaras difieren en el 70 % del cuadro" no se puede leer sin saber cuánto
# daría el caso que se quiere descartar. Por eso se miden tres cosas y no una:
#
#   1. LAS QUINCE PAREJAS de cámaras, en el mismo instante.
#   2. CONTROL DE CERO: la misma cámara contra sí misma, extraída dos veces del
#      mismo HLS. Tiene que dar 0. Si diera distinto de 0, lo que la medición de
#      arriba está viendo es ruido de extracción y no encuadre.
#   3. CONTROL DE COPIA: la cámara de CALDRIX con los autos recoloreados y NADA
#      MÁS, empaquetada por el mismo camino y comparada contra la original. Es
#      EXACTAMENTE la alternativa que el DESIGN descarta —"lo hacemos la misma
#      para todos y después cambiamos el color del auto"— y el número que da es
#      el techo de lo que una copia recoloreada puede diferir. Toda pareja real
#      tiene que estar MUY por encima de ese techo; si alguna estuviera cerca,
#      esas dos cámaras son la misma toma con otro color y el encuadre no está
#      haciendo nada.
#
# Las tres mediciones se hacen sobre cuadros de VIDEO y no de navegador, para que
# el ruido de cuantización de H.264 esté en los tres lados por igual. Por eso el
# control de copia se empaqueta de verdad en lugar de compararse contra un PNG
# del navegador.
#
# ── EL CUADRO SE ELIGE POR NÚMERO Y NO POR TIEMPO ──────────────────────────
# `-ss` sobre estos HLS no sirve para el cuadro 0: el MPEG-TS que escribe el
# empaquetado arranca en PTS 1,4667 s, así que `-ss 0` pide un punto anterior al
# comienzo del stream y devuelve otro cuadro (medido en
# scripts/verificar-fase-carrera.sh). Acá se decodifica desde el principio y se
# selecciona el cuadro por su número, que no depende de en qué instante empiece
# el contenedor.
set -euo pipefail
cd "$(dirname "$0")/.."

T=${1:-0}                       # instante, en segundos dentro del clip de cámara
SALIDA=${2:-content/.work/T-09/lamina}
PY=/home/nicolas/Skills/playwright/.venv/bin/python
PXDIF=./scripts/pxdif.sh
UMBRAL=5%

eval "$(node -e '
  const s = require("./stage.json").carrera;
  console.log(`FPS=${s.fps}; W=${s.salida.ancho}; H=${s.salida.alto}; BV=${s.salida.bitrate};`
    + ` OFERTA_EN=${s.ofertaEn};`
    + ` IDS=(${s.camaras.map((c) => `"${c.id}"`).join(" ")});`
    + ` NOMBRES=(${s.camaras.map((c) => `"${c.nombre}"`).join(" ")});`
    + ` COLORES=(${s.camaras.map((c) => `"${c.color}"`).join(" ")});`
    + ` VIDEOS=(${s.camaras.map((c) => `"${c.video}"`).join(" ")});`
    + ` SVGS=(${s.camaras.map((c) => `"${c.svg}"`).join(" ")})`);
')"

rm -rf "$SALIDA"; mkdir -p "$SALIDA"
./scripts/pxdif.sh --autotest

# ── Un cuadro de cada cámara, en el mismo instante ──────────────────────────
N=$(awk -v t="$T" -v f="$FPS" 'BEGIN{printf "%d", t*f+0.5}')
cuadro() {   # cuadro <hls> <numero> <png>
  ffmpeg -hide_banner -loglevel error -y -i "$1" \
    -vf "select=eq(n\,$2)" -fps_mode passthrough -frames:v 1 "$3"
}
for i in "${!IDS[@]}"; do
  cuadro "${VIDEOS[$i]}" "$N" "$SALIDA/${IDS[$i]}.png"
done
AREA=$(identify -format "%[fx:w*h]" "$SALIDA/${IDS[0]}.png")

etiquetadas=()
for i in "${!IDS[@]}"; do
  magick "$SALIDA/${IDS[$i]}.png" -resize 620x349 \
    -background '#0d1014' -fill "${COLORES[$i]}" -pointsize 22 \
    -font Helvetica -gravity north -splice 0x34 -annotate +0+6 "${NOMBRES[$i]}" \
    "$SALIDA/lbl-${IDS[$i]}.png"
  etiquetadas+=("$SALIDA/lbl-${IDS[$i]}.png")
done
magick montage "${etiquetadas[@]}" -tile 3x2 -geometry +4+4 -background '#0d1014' "$SALIDA/lamina.png"
magick "$SALIDA/lamina.png" -background '#0d1014' -fill '#e8eaec' -pointsize 24 -font Helvetica \
  -gravity north -splice 0x40 -annotate +0+8 \
  "the same race at the same instant, second ${T} of the multi view window" "$SALIDA/lamina.png"

# ── El control de cero ──────────────────────────────────────────────────────
cuadro "${VIDEOS[0]}" "$N" "$SALIDA/cero.png"
CERO=$($PXDIF "$SALIDA/${IDS[0]}.png" "$SALIDA/cero.png" "$UMBRAL")

# ── El control de copia: la misma toma con los autos de otro color ──────────
# Rota los seis colores de la escena sobre el archivo de la PRIMERA cámara. El
# encuadre, el circuito, el movimiento y el instante quedan idénticos: lo único
# distinto es la pintura, que es la alternativa que el DESIGN descarta.
cp "${SVGS[0]}" "$SALIDA/copia.svg"
for i in "${!COLORES[@]}"; do
  sed -i "s/${COLORES[$i]}/@@$i@@/gI" "$SALIDA/copia.svg"
done
for i in "${!COLORES[@]}"; do
  sed -i "s/@@$i@@/${COLORES[$(((i + 1) % ${#COLORES[@]}))]}/g" "$SALIDA/copia.svg"
done
"$PY" scripts/capturar-svg.py "$SALIDA/copia.svg" "$SALIDA/copia-cuadros" \
  --fps "$FPS" --desde "$(awk -v a="$OFERTA_EN" -v b="$T" 'BEGIN{print a+b}')" --duracion 1 >/dev/null
./scripts/empaquetar-creativo.sh "$SALIDA/copia-cuadros" "$SALIDA/copia-hls" "$W" "$H" "$FPS" "$BV" >/dev/null
cuadro "$SALIDA/copia-hls/index.m3u8" 0 "$SALIDA/copia.png"
COPIA=$($PXDIF "$SALIDA/${IDS[0]}.png" "$SALIDA/copia.png" "$UMBRAL")
rm -rf "$SALIDA/copia-cuadros"

# ── Las quince parejas ──────────────────────────────────────────────────────
echo
echo "cámaras comparadas de a pares, en el segundo $T del clip, umbral $UMBRAL"
peor=$AREA; peorPar=""
for i in "${!IDS[@]}"; do
  for ((j = i + 1; j < ${#IDS[@]}; j++)); do
    d=$($PXDIF "$SALIDA/${IDS[$i]}.png" "$SALIDA/${IDS[$j]}.png" "$UMBRAL")
    printf '  %-9s vs %-9s %8d px  %6.2f %%\n' "${IDS[$i]}" "${IDS[$j]}" "$d" \
      "$(awk -v d="$d" -v a="$AREA" 'BEGIN{printf "%.2f", d*100/a}')"
    if [ "$d" -lt "$peor" ]; then peor=$d; peorPar="${IDS[$i]} vs ${IDS[$j]}"; fi
  done
done

echo
printf '  CONTROL cero   la misma cámara dos veces          %8d px  %6.2f %%\n' "$CERO" \
  "$(awk -v d="$CERO" -v a="$AREA" 'BEGIN{printf "%.2f", d*100/a}')"
printf '  CONTROL copia  la misma toma, autos recoloreados  %8d px  %6.2f %%\n' "$COPIA" \
  "$(awk -v d="$COPIA" -v a="$AREA" 'BEGIN{printf "%.2f", d*100/a}')"
printf '  la pareja de cámaras MÁS parecida (%s)  %8d px  %6.2f %%\n' "$peorPar" "$peor" \
  "$(awk -v d="$peor" -v a="$AREA" 'BEGIN{printf "%.2f", d*100/a}')"
echo
echo "  lámina en $SALIDA/lamina.png"

fallos=0
[ "$CERO" = 0 ] || { echo "  ROJO  el control de cero no dio 0: la extracción no es determinista"; fallos=1; }
awk -v p="$peor" -v c="$COPIA" 'BEGIN{exit !(p > 3*c)}' \
  || { echo "  ROJO  hay una pareja de cámaras que difiere menos que el triple de una copia recoloreada"; fallos=1; }
[ "$fallos" = 0 ] || exit 1
echo "  VERDE las seis se leen como seis encuadres distintos y no como copias"
