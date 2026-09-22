#!/usr/bin/env bash
# EL PUENTE A VIDEO DE LA CARRERA: de la escena en SVG al programa y a las seis
# cámaras, empaquetados a HLS.
#
# NO ES UN PIPELINE NUEVO. Es el de la T-05 con otra lista de piezas: los tres
# eslabones —`capturar-svg.py`, `empaquetar-creativo.sh`, `verificar-creativo.sh`—
# son los mismos archivos, sin una línea modificada, y el instrumento
# (`pxdif.sh`) también. Lo único propio de acá es CUÁLES piezas se capturan y
# DESDE QUÉ INSTANTE de la escena.
#
#   scripts/escribir-carrera.mjs      una escena, siete encuadres
#        -> content/race/svg/*.svg
#        -> scripts/capturar-svg.py        navegador headless, reloj controlado
#        -> content/.work/T-09/<pieza>/    cuadros PNG a resolución NATIVA
#        -> scripts/empaquetar-creativo.sh ffmpeg -> H.264 -> HLS
#        -> content/race/<pieza>/index.m3u8
#        -> scripts/verificar-creativo.sh  la aserción, con sus controles
#
# ── LAS CÁMARAS NO EMPIEZAN EN CERO, Y ES LA DECISIÓN QUE HACE QUE SEAN DE LA
#    MISMA CARRERA ──────────────────────────────────────────────────────────
# El programa captura la escena entera, de 0 a `largo`. Cada cámara la captura
# DESDE `ofertaEn`, que es el segundo del programa en el que race.html abre la
# ventana de multi view, y por `ofertaDura` segundos. Así el cuadro 0 de una
# cámara es el mismo instante de la carrera que el programa está mostrando cuando
# quien mira abre la ventana: se ven los mismos adelantamientos desde otro lado y
# no dos carreras distintas. Los dos números salen de stage.json (ADR 0044), y si
# alguno cambia, las cámaras hay que capturarlas de nuevo.
#
# ── LOS TEMPORALES VAN A DISCO Y NO A RAM ───────────────────────────────────
# Es la misma razón que en la T-05 y acá pesa más: son 15.120 cuadros contra
# 3.240. En esta máquina /run/user/1000 (1,6 G) y /tmp (7,7 G) son tmpfs, o sea
# RAM. Van a content/.work/T-09/, que está gitignoreado, y cada pieza borra los
# suyos apenas la verificación pasa, así que el pico en disco es de las piezas que
# estén corriendo a la vez y no de las siete.
#
# ── POR QUÉ CORRE DE A VARIAS PIEZAS A LA VEZ ───────────────────────────────
# La captura es un cuadro por vez contra un navegador, así que es serial dentro
# de una pieza y el trabajo es de un solo hilo. Con siete piezas independientes y
# seis núcleos, correrlas de a tres baja el reloj de pared sin tocar el resultado:
# cada pieza levanta SU navegador y lo cierra al terminar (lo hace
# capturar-svg.py), y ninguna comparte archivo con otra. El Chrome compartido del
# skill playwright no se toca.
set -euo pipefail
cd "$(dirname "$0")/.."

TRABAJO=content/.work/T-09
PARALELO=${PARALELO:-3}
CONTROL=${1:-}

PY=/home/nicolas/Skills/playwright/.venv/bin/python
[ -x "$PY" ] || { echo "falta el python del skill playwright en $PY" >&2; exit 1; }

# ── Los números, de stage.json y de ningún otro lado ────────────────────────
eval "$(node -e '
  const s = require("./stage.json").carrera;
  const p = [[s.programa.id, s.programa.svg, s.programa.video, 0, s.largo]];
  for (const c of s.camaras) p.push([c.id, c.svg, c.video, s.ofertaEn, s.ofertaDura]);
  console.log(`FPS=${s.fps}; LARGO=${s.largo}; W=${s.salida.ancho}; H=${s.salida.alto};`
    + ` BV=${s.salida.bitrate}; OFERTA_EN=${s.ofertaEn}; OFERTA_DURA=${s.ofertaDura};`
    + ` PIEZAS=(${p.map((x) => `"${x.join(":")}"`).join(" ")})`);
')"
echo "puente-carrera: ${#PIEZAS[@]} piezas, $FPS fps, escena de $LARGO s, ventana en $OFERTA_EN s por $OFERTA_DURA s"

# ── La escena, y la guarda de XML sobre cada archivo ────────────────────────
# capturar-svg.py parsea cada SVG como XML antes de dibujarlo y se planta si está
# roto, que es el modo de falla silencioso de esta fase (un SVG mal formado no se
# dibuja y no avisa). Acá se regenera antes de capturar para que nadie capture una
# escena vieja.
node scripts/escribir-carrera.mjs

# ── El instrumento se valida ANTES de apoyarse en él ────────────────────────
./scripts/pxdif.sh --autotest

# ── El control en rojo ──────────────────────────────────────────────────────
# `--control` no produce nada de la demo: produce las dos cosas que tienen que dar
# ROJO sobre ESTE contenido, para que el verde de las siete piezas signifique
# algo. Es el mismo par de controles de la T-05 —captura cortada y video
# congelado— corrido sobre una cámara de la carrera y no sobre un creativo,
# porque lo que se quiere saber es si la aserción sabe ponerse roja con ESTE
# movimiento, que es mucho más grande que el de un creativo.
if [ "$CONTROL" = "--control" ]; then
  C=$TRABAJO/control
  SVG=$(node -e 'const s=require("./stage.json").carrera; console.log(s.camaras[0].svg)')
  DUR=12
  rm -rf "$C"; mkdir -p "$C/congelado"
  N=$(awk -v d="$DUR" -v f="$FPS" 'BEGIN{printf "%d", d*f+0.5}')
  MITAD=$(awk -v d="$DUR" 'BEGIN{print d/2}')

  # UNA sola captura REAL sirve a los dos controles: es lo cortado del primero y
  # es la REFERENCIA del segundo. Sin una referencia real, el control congelado no
  # se podría poner rojo nunca, porque la aserción de movimiento compara contra el
  # movimiento del SVG.
  "$PY" scripts/capturar-svg.py "$SVG" "$C/real" --fps "$FPS" --desde "$OFERTA_EN" --duracion "$DUR"

  echo; echo "== CONTROL a) la captura cortada a la mitad: tiene que dar ROJO =="
  rm -rf "$C/mitad"; mkdir -p "$C/mitad"
  for i in $(seq 0 $(( $(awk -v d="$MITAD" -v f="$FPS" 'BEGIN{printf "%d", d*f+0.5}') - 1 ))); do
    cp "$(printf "$C/real/f%05d.png" "$i")" "$(printf "$C/mitad/f%05d.png" "$i")"
  done
  ./scripts/empaquetar-creativo.sh "$C/mitad" "$C/hls-cortado" "$W" "$H" "$FPS" "$BV"
  if ./scripts/verificar-creativo.sh "$C/hls-cortado/index.m3u8" "$FPS" "$DUR" "$C/real"; then
    echo "EL CONTROL DIO VERDE: la aserción no mide la duración." >&2; exit 1
  fi
  echo "  (rojo, como tenía que dar: $((N / 2)) cuadros contra $N declarados)"

  echo; echo "== CONTROL b) el video congelado: tiene que dar ROJO =="
  for i in $(seq 0 $((N - 1))); do cp "$C/real/f00000.png" "$(printf "$C/congelado/f%05d.png" "$i")"; done
  ./scripts/empaquetar-creativo.sh "$C/congelado" "$C/hls-congelado" "$W" "$H" "$FPS" "$BV"
  if ./scripts/verificar-creativo.sh "$C/hls-congelado/index.m3u8" "$FPS" "$DUR" "$C/real"; then
    echo "EL CONTROL DIO VERDE: la aserción no mide el movimiento." >&2; exit 1
  fi
  echo "  (rojo, como tenía que dar: la duración correcta y el movimiento perdido)"
  rm -rf "$C"
  exit 0
fi

# ── Las siete piezas ────────────────────────────────────────────────────────
una() {
  IFS=: read -r NOMBRE SVG VIDEO DESDE DUR <<<"$1"
  local CUADROS=$TRABAJO/$NOMBRE
  local SALIDA=${VIDEO%/index.m3u8}
  local LOG=$TRABAJO/$NOMBRE.log
  # El subshell se lleva el `set -e`: una pieza que falla deja SU log y no tumba
  # a las otras seis ni se lleva el borrado de sus cuadros. Quién quedó en verde
  # se decide después leyendo los logs, que es una medición y no una impresión.
  (
    echo "== $NOMBRE  ($SVG desde ${DESDE}s por ${DUR}s -> ${W}x${H} @ $BV) =="
    rm -rf "$CUADROS"
    "$PY" scripts/capturar-svg.py "$SVG" "$CUADROS" --fps "$FPS" --desde "$DESDE" --duracion "$DUR"
    ./scripts/empaquetar-creativo.sh "$CUADROS" "$SALIDA" "$W" "$H" "$FPS" "$BV"
    ./scripts/verificar-creativo.sh "$SALIDA/index.m3u8" "$FPS" "$DUR" "$CUADROS"
  ) >"$LOG" 2>&1 || true
  # Los cuadros se borran acá y no al final: el pico en disco es de las piezas
  # que estén corriendo a la vez.
  rm -rf "$CUADROS"
  cat "$LOG"
}

mkdir -p "$TRABAJO"
fallos=0
for p in "${PIEZAS[@]}"; do
  una "$p" &
  while [ "$(jobs -rp | wc -l)" -ge "$PARALELO" ]; do wait -n || true; done
done
wait

# El estado de cada pieza se lee de su propio log, que es lo que sobrevive a que
# `wait -n` ya haya cosechado el proceso.
for p in "${PIEZAS[@]}"; do
  IFS=: read -r NOMBRE _ _ _ _ <<<"$p"
  if /usr/bin/grep -q "en verde" "$TRABAJO/$NOMBRE.log"; then
    echo "VERDE  $NOMBRE"
  else
    echo "ROJO   $NOMBRE  (ver $TRABAJO/$NOMBRE.log)"; fallos=$((fallos + 1))
  fi
done
[ "$fallos" = 0 ] || { echo; echo "puente-carrera: $fallos pieza(s) en rojo"; exit 1; }
echo; echo "puente-carrera: las ${#PIEZAS[@]} piezas en content/race/"
