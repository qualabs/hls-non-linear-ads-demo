#!/usr/bin/env bash
# Cuenta cuántos píxeles difieren entre dos imágenes del mismo tamaño.
#
# Es el instrumento con el que esta demo verifica que algo se movió: dos
# instantes de una animación, dos cuadros de un video, un creativo contra su
# control. El número que imprime es un CONTEO DE PÍXELES, no una métrica
# normalizada, porque lo que las tasks comparan es "cuántos píxeles de los
# W*H cambiaron".
#
# ── POR QUÉ NO ES `compare -metric AE` ───────────────────────────────────────
# El `compare` de este ImageMagick no devuelve un conteo: un negro contra un
# verde a 1920x1080 da 1,15e6 y no 2.073.600 (medido en la T-02). Así que el
# conteo se arma a mano: diferencia, a gris, umbral 0 (todo lo distinto de cero
# pasa a blanco), y la media por el área es la cantidad de píxeles distintos.
#
# ── POR QUÉ `-colorspace sRGB` EN LAS DOS ENTRADAS, Y NO ES DECORACIÓN ───────
# ESTE ES EL DEFECTO QUE LA T-05 ENCONTRÓ Y ARREGLÓ. ImageMagick guarda como
# PNG EN ESCALA DE GRISES cualquier imagen cuyos tres canales sean iguales, y
# una entrada Gray restada contra una sRGB da CERO AUNQUE LOS COLORES SEAN
# DISTINTOS. Medido, con la versión sin este arreglo:
#
#     $ identify -format "%f %[colorspace]\n" negro.png verde.png
#     negro.png Gray          <- el negro se guardó en escala de grises
#     verde.png sRGB
#     $ pxdif-sin-arreglo.sh negro.png verde.png
#     0                       <- y un negro contra un verde da CERO
#
# Un cero silencioso acá significa "no se movió nada" cuando lo que pasó es que
# el instrumento no vio. En la T-02 nunca mordió porque todas sus entradas eran
# capturas de Chrome, las dos sRGB; muerde en cuanto se compara un cuadro de
# VIDEO —que ffmpeg puede escribir en gris si el cuadro es monocromo— contra uno
# de navegador, que es exactamente lo que la T-05 y la T-09 hacen.
#
# ── EL UMBRAL, QUE ES EL TERCER ARGUMENTO Y POR DEFECTO ES 0 ────────────────
# Con umbral 0 cuenta todo píxel que difiera aunque sea en una unidad, que es lo
# que corresponde cuando las dos entradas son capturas de navegador: ahí una
# diferencia de una unidad ES una diferencia.
#
# Entre dos cuadros de VIDEO no lo es, y está medido: un video CONGELADO —el
# mismo PNG repetido 360 veces, pasado por H.264— decodifica cuadros que difieren
# en 328.496 píxeles de 921.600 con umbral 0. No se movió nada; es el ruido de
# cuantización del códec, un ±1 repartido por todo el cuadro. Con umbral el mismo
# par cae a 9.841 (2 %), 563 (5 %) y 39 (8 %). Por eso toda comparación que toque
# un cuadro de video se hace con umbral 5 %, y el control congelado —esos 563 px—
# es la referencia contra la que el movimiento real se lee.
#
# ── CÓMO SE SABE QUE ESTE INSTRUMENTO FUNCIONA ──────────────────────────────
# `--autotest` lo corre contra casos de respuesta conocida, incluido el que lo
# rompía y uno del umbral. Un instrumento que no se vio dar el número exacto de un
# caso construido no se sabe si mide. Se corre antes de apoyarse en él.
set -euo pipefail

autotest() {
  local t; t=$(mktemp -d); trap 'rm -rf "$t"' RETURN
  local W=200 H=100 area=$((200 * 100)) fallos=0
  magick -size ${W}x${H} xc:black "$t/negro.png"
  magick -size ${W}x${H} xc:'#00ff00' "$t/verde.png"
  magick -size ${W}x${H} xc:black -fill white -draw 'rectangle 0,0 9,99' "$t/col10.png"
  magick "$t/negro.png" -colorspace Gray "$t/negro-gray.png"
  # Un negro con ruido de ±3/255 en todo el cuadro: es la forma del ruido de
  # cuantización de un códec, y con umbral 5 % tiene que desaparecer entero.
  magick -size ${W}x${H} xc:'#030303' "$t/casi-negro.png"

  # (caso, a, b, umbral, esperado). El cuarto es el que el defecto de arriba
  # rompía: la entrada está forzada a escala de grises a propósito.
  local casos=(
    "negro vs verde|$t/negro.png|$t/verde.png|0|$area"
    "negro vs negro|$t/negro.png|$t/negro.png|0|0"
    "negro vs 10 columnas de $H|$t/negro.png|$t/col10.png|0|$((10 * H))"
    "GRIS vs verde (el caso que fallaba)|$t/negro-gray.png|$t/verde.png|0|$area"
    "ruido de +-3/255, umbral 0|$t/negro.png|$t/casi-negro.png|0|$area"
    "ruido de +-3/255, umbral 5%|$t/negro.png|$t/casi-negro.png|5%|0"
    "verde vs negro, umbral 5%|$t/verde.png|$t/negro.png|5%|$area"
  )
  for c in "${casos[@]}"; do
    IFS='|' read -r nombre a b umbral esperado <<<"$c"
    local got; got=$(medir "$a" "$b" "$umbral")
    if [ "$got" = "$esperado" ]; then
      printf '  OK    %-38s %s\n' "$nombre" "$got"
    else
      printf '  FALLA %-38s %s (esperado %s)\n' "$nombre" "$got" "$esperado"
      fallos=$((fallos + 1))
    fi
  done
  [ "$fallos" = 0 ] || { echo "pxdif: el instrumento NO mide bien ($fallos fallas)" >&2; return 1; }
  echo "pxdif: instrumento validado contra ${#casos[@]} casos de respuesta conocida."
}

medir() {
  magick \( "$1" -colorspace sRGB \) \( "$2" -colorspace sRGB \) \
    -compose difference -composite -colorspace Gray \
    -threshold "${3:-0}" -format "%[fx:int(mean*w*h+0.5)]" info:
}

case "${1:-}" in
  --autotest) autotest ;;
  "" | --help) echo "uso: pxdif.sh A.png B.png [umbral]   |   pxdif.sh --autotest" >&2; exit 2 ;;
  *) medir "$1" "${2:?falta la segunda imagen}" "${3:-0}"; echo ;;
esac
