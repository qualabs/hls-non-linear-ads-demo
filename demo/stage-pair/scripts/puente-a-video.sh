#!/usr/bin/env bash
# EL PUENTE A VIDEO: de los nueve SVG animados a nueve HLS reproducibles.
#
# Por qué existe: el aviso LINEAL lo reproduce también el pane de fábrica, que es
# un hls.js de mercado sin una línea nuestra. Recibe un X-ASSET-LIST con una URI a
# un .m3u8 y reproduce; NO SABE QUÉ HACER CON UN SVG. Si el lineal no se ve de ese
# lado, se cae el argumento entero de la demo, que es comparar los dos panes. Y la
# variante rica de cada break es video por la misma razón que el ADR 0084 explica:
# la forma viaja en los dos medios.
#
# La cadena, y cada eslabón en su archivo:
#
#   graphics/campaigns/*.svg
#        -> scripts/capturar-svg.py        navegador headless, reloj controlado
#        -> content/.work/T-05/<pieza>/    cuadros PNG a resolución NATIVA
#        -> scripts/empaquetar-creativo.sh ffmpeg -> H.264 -> HLS
#        -> content/creatives/<pieza>/<hash>/index.m3u8  (versionar-creativo.sh)
#        -> scripts/verificar-creativo.sh  la aserción, con sus controles
#
# LOS NÚMEROS SALEN DE stage.json Y NO DE ACÁ (ADR 0044): el fps y la duración de
# los creativos, la lista de las nueve piezas y los `viewport` de las tres formas.
# Lo único que este archivo agrega es CÓMO se traduce un viewport a un tamaño de
# salida, y eso está argumentado abajo.
#
# ── LOS TEMPORALES VAN A DISCO Y NO A RAM ───────────────────────────────────
# Los cuadros de una pieza de 12 s a 1920x1080 son ~270 MB, y en esta máquina
# tanto /run/user/1000 (1,6 G) como /tmp (7,7 G) son tmpfs, o sea RAM. Nueve
# piezas ahí llenan la memoria y tiran la sesión. Van a content/.work/, que es lo
# que la T-03 ya usó para lo mismo, está gitignoreado, y se borra al terminar cada
# pieza (no al final: así el pico en disco es de una pieza y no de nueve).
set -euo pipefail
cd "$(dirname "$0")/.."

TRABAJO=content/.work/T-05
CONTROL=${1:-}

# ── De un viewport a un tamaño de salida ────────────────────────────────────
# Cada creativo sale AL TAMAÑO EXACTO DE SU CAJA sobre un cuadro de 1280x720, que
# es el precedente escrito de demo/hydration-break/scripts/creativos.sh y la razón
# es el ADR 0013: una caja se llena con recorte centrado, así que un creativo con
# otra relación de aspecto se recorta POR LOS BORDES, que es donde vive la
# tipografía. Acá las tres formas ya tienen la relación de su caja, así que sólo
# se escala.
#
# La excepción es el 16:9, y está argumentada en empaquetar-creativo.sh: su caja
# mide 640x360 pero la misma pieza es el aviso lineal de su break y ahí ocupa la
# pantalla entera, así que sale a 1280x720.
#
# El bitrate sigue los 2500k del contenido primario a 1280x720. El banner, con el
# 15 % de esos píxeles, sale a 800k y no a los ~380k que daría la regla de tres:
# un dibujo vectorial tiene bordes duros y tipografía chica, que es justo lo que
# un bitrate bajo ensucia, y 800k sigue siendo menos de un tercio del primario.
eval "$(node -e '
  const s = require("./stage.json");
  const piezas = s.assets.piezas.map((p) => {
    const f = s.formas[p.forma];
    const [top, right, bottom, left] = f.viewportAviso.split(/\s+/).map(Number);
    let W = Math.round(1280 * (100 - left - right) / 100);
    let H = Math.round(720 * (100 - top - bottom) / 100);
    if (p.forma === "16x9") { W = 1280; H = 720; }   // es tambien el lineal
    const bv = (W * H >= 1280 * 720) ? "2500k" : "800k";
    // El nombre es el del SVG y no el de la ruta del video, que desde la fase 15
    // lleva la versión adentro (scripts/versionar-creativo.sh).
    const nombre = p.svg.replace(/^.*\//, "").replace(/\.svg$/, "");
    return [nombre, p.svg, W, H, bv].join(":");
  });
  console.log(`FPS=${s.creativos.fps}; DUR=${s.creativos.duracion}; PIEZAS=(${piezas.map((p) => `"${p}"`).join(" ")})`);
')"
[ "${#PIEZAS[@]}" = 9 ] || { echo "stage.json no declara nueve piezas" >&2; exit 1; }
# SOLO=<nombre>,<nombre> rehace sólo esas piezas, con el mismo camino que las
# nueve (fase 15: se reanimaron las tres opciones de video del par y las otras
# seis no cambiaron). Un nombre que no es una pieza es un error y no un cero.
if [ -n "${SOLO:-}" ]; then
  ELEGIDAS=()
  for nombre in ${SOLO//,/ }; do
    hallada=""
    for p in "${PIEZAS[@]}"; do [ "${p%%:*}" = "$nombre" ] && { ELEGIDAS+=("$p"); hallada=1; }; done
    [ -n "$hallada" ] || { echo "SOLO nombra '$nombre', que no es una pieza de stage.json" >&2; exit 1; }
  done
  PIEZAS=("${ELEGIDAS[@]}")
fi
echo "puente-a-video: ${#PIEZAS[@]} piezas, $FPS fps, $DUR s"

PY=/home/nicolas/Skills/playwright/.venv/bin/python
[ -x "$PY" ] || { echo "falta el python del skill playwright en $PY" >&2; exit 1; }

# ── El instrumento se valida ANTES de apoyarse en él ────────────────────────
./scripts/pxdif.sh --autotest

# ── El control en rojo ──────────────────────────────────────────────────────
# `--control` no produce nada de la demo: produce las dos cosas que tienen que
# dar ROJO, para que el verde de las nueve signifique algo.
#   a) una captura CORTADA a propósito, la mitad de los cuadros;
#   b) un video CONGELADO, el mismo cuadro repetido todo el clip.
# Si alguna de las dos diera verde, lo que está midiendo la aserción es otra cosa.
if [ "$CONTROL" = "--control" ]; then
  C=$TRABAJO/control
  rm -rf "$C"; mkdir -p "$C/congelado"
  N=$(awk -v d="$DUR" -v f="$FPS" 'BEGIN{printf "%d", d*f+0.5}')
  MITAD=$(awk -v d="$DUR" 'BEGIN{print d/2}')

  # UNA sola captura REAL sirve a los dos controles: es lo cortado del primero y
  # es la REFERENCIA del segundo. Sin una referencia real, el control congelado
  # no se podría poner rojo: la aserción de movimiento compara el video contra el
  # movimiento del SVG, y contra un SVG congelado no hay nada que perder.
  "$PY" scripts/capturar-svg.py graphics/campaigns/zumbra-16x9.svg "$C/real" \
    --fps "$FPS" --duracion "$MITAD"

  echo; echo "== CONTROL a) la captura cortada a la mitad: tiene que dar ROJO =="
  ./scripts/empaquetar-creativo.sh "$C/real" "$C/hls-cortado" 1280 720 "$FPS" 2500k
  if ./scripts/verificar-creativo.sh "$C/hls-cortado/index.m3u8" "$FPS" "$DUR" "$C/real"; then
    echo "EL CONTROL DIO VERDE: la aserción no mide la duración." >&2; exit 1
  fi
  echo "  (rojo, como tenía que dar: $((N / 2)) cuadros contra $N declarados,"
  echo "   y el movimiento en VERDE, que es lo que prueba que lo rojo es la duración)"

  echo; echo "== CONTROL b) el video congelado: tiene que dar ROJO =="
  for i in $(seq 0 $((N - 1))); do cp "$C/real/f00000.png" "$(printf "$C/congelado/f%05d.png" "$i")"; done
  ./scripts/empaquetar-creativo.sh "$C/congelado" "$C/hls-congelado" 1280 720 "$FPS" 2500k
  if ./scripts/verificar-creativo.sh "$C/hls-congelado/index.m3u8" "$FPS" "$DUR" "$C/real"; then
    echo "EL CONTROL DIO VERDE: la aserción no mide el movimiento." >&2; exit 1
  fi
  echo "  (rojo, como tenía que dar: la duración correcta y el movimiento perdido)"
  rm -rf "$C"
  exit 0
fi

# ── Las nueve piezas ────────────────────────────────────────────────────────
for p in "${PIEZAS[@]}"; do
  IFS=: read -r NOMBRE SVG W H BV <<<"$p"
  echo; echo "== $NOMBRE  ($SVG -> ${W}x${H} @ $BV) =="
  CUADROS=$TRABAJO/$NOMBRE
  rm -rf "$CUADROS"
  "$PY" scripts/capturar-svg.py "$SVG" "$CUADROS" --fps "$FPS" --duracion "$DUR"
  ./scripts/empaquetar-creativo.sh "$CUADROS" "content/creatives/$NOMBRE" "$W" "$H" "$FPS" "$BV"
  ./scripts/verificar-creativo.sh "content/creatives/$NOMBRE/index.m3u8" "$FPS" "$DUR" "$CUADROS"
  ./scripts/versionar-creativo.sh "$NOMBRE"
  # Los cuadros se borran acá y no al final: el pico en disco es de una pieza.
  rm -rf "$CUADROS"
done
rmdir "$TRABAJO" 2>/dev/null || true
echo; echo "puente-a-video: ${#PIEZAS[@]} pieza(s) en content/creatives/"
