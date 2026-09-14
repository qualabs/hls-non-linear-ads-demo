#!/usr/bin/env bash
# medir-sondeo.sh -- todo lo que se midio sobre los dos clips del sondeo, de punta a punta,
# desde los .mp4. Se corre entero y escribe su salida por stdout; el informe de la T-02 cita
# esa salida verbatim.
#
# LOS TRES INSTRUMENTOS Y SUS TRES CONTROLES. Un chequeo que no puede fallar no es un
# chequeo, asi que cada medicion de aca va con la referencia que tiene que dar distinto, y
# las tres se vieron dar distinto antes de creerles:
#
#   1. COLOR DE CADA AUTO (medir-color.py). Control: el MISMO recorte-instrumento sobre un
#      pedazo de asfalto del MISMO cuadro, donde no hay auto. Tiene que devolver
#      "(ninguno)": cero pixeles cromaticos. Si devolviera un color, la medicion estaria
#      midiendo el asfalto y no el auto.
#      Segundo control: un recorte sobre el aleron NEGRO. Ahi el estimador de la T-01
#      devuelve un hexadecimal calculado sobre uno o dos pixeles, con un dE00 que parece
#      bueno -- y es basura. Por eso toda fila lleva su `n`.
#
#   2. EL MUNDO (comparar-mundo.py). Controles: el mismo cuadro virado a hora dorada, y un
#      cuadro de otro mundo de verdad (metraje real de la demo del break). Los dos tienen
#      que dar varias veces mas lejos que los dos clips entre si.
#
#   3. EL AUDIO. Control: el ambiente del clip A con una linea de relator REAL en ingles
#      mezclada adentro a -20 LUFS, que es el nivel al que DESIGN.md normaliza cada linea.
#      El transcriptor tiene que devolver esa linea. Sin ese control, un "no hay habla" no
#      distingue entre no haber habla y no haber transcriptor -- que es exactamente lo que
#      paso la primera vez: el binario de whisper.cpp fallaba por una libreria compartida
#      que falta en el PATH del linker, y sin el control los tres archivos daban "vacio".
#
# LOS RECTANGULOS SE MIRARON ANTES DE MEDIRLOS. Estan puestos a mano y verificados
# dibujandolos sobre el cuadro (marcar.py) y mirando la tira de recortes al lado del color
# que devolvieron (tira.py). Un rectangulo elegido a ciegas mide lo que le toca.
set -euo pipefail
cd "$(dirname "$0")"

RAIZ=$(cd ../../../../../.. && pwd)
D="$RAIZ/demo/race-multiview/content/.fuentes/sondeo"
A=a-casilla-04-aereo-los-seis
B=b-casilla-12-rueda-runtak
C=c-casilla-04-correccion-aereo-y-lista
W=/home/nicolas/.claude/skills/whisper-transcribe/.whisper_local_build/whisper.cpp
export LD_LIBRARY_PATH="$W/build/src:$W/build/ggml/src:$W/build/ggml/src/ggml-cpu:${LD_LIBRARY_PATH:-}"

T=$(mktemp -d "/dev/shm/medir-sondeo-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT
mkdir -p "$T/cuadros" "$T/audio"

PY=$T/.venv/bin/python
uv venv --python 3.12 "$T/.venv" >/dev/null 2>&1
uv pip install --python "$PY" numpy pillow >/dev/null 2>&1

for f in $A $B $C; do
  for t in 0.5 2.0 4.0 6.0 7.5; do
    ffmpeg -hide_banner -loglevel error -y -ss $t -i "$D/$f.mp4" -frames:v 1 "$T/cuadros/$f-t$t.png"
  done
  ffmpeg -hide_banner -loglevel error -y -i "$D/$f.mp4" -vn -ac 1 -ar 16000 -c:a pcm_s16le "$T/audio/$f.wav"
done

echo "################################################################"
echo "# 1. EL COLOR DE CADA AUTO, SOBRE EL CUADRO EN MOVIMIENTO"
echo "################################################################"
echo
for t in 4.0 7.5; do
  "$PY" -W ignore medir-color.py "$T/cuadros/$A-t$t.png" "rects/a-t$t.json"
  echo
done
for t in 0.5 4.0 7.5; do
  "$PY" -W ignore medir-color.py "$T/cuadros/$B-t$t.png" "rects/b-t$t.json"
  echo
done
"$PY" -W ignore medir-color.py "$T/cuadros/$C-t4.0.png" "rects/c-t4.0.json"
echo

echo "################################################################"
echo "# 2. LA SEPARACION ENTRE LOS SEIS, CONTRA LA DE LAS FICHAS"
echo "################################################################"
echo
for j in rects/pares-*.json; do "$PY" -W ignore pares.py "$j"; echo; done

echo "################################################################"
echo "# 3. EL MUNDO: EL MISMO CIRCUITO Y LA MISMA LUZ"
echo "################################################################"
echo
# El control de la luz: el mismo cuadro del clip A virado a hora dorada.
ffmpeg -hide_banner -loglevel error -y -i "$T/cuadros/$A-t7.5.png" \
  -vf "colorbalance=rs=.25:gs=.05:bs=-.20:rm=.20:bm=-.18:rh=.15:bh=-.12,eq=saturation=1.25:gamma=0.92" \
  "$T/cuadros/CONTROL-hora-dorada.png"
# El control del lugar: un cuadro de otro mundo, metraje real de la demo del break.
ffmpeg -hide_banner -loglevel error -y -ss 3 -i "$RAIZ/demo/hydration-break/content/.fuentes/9439150.mp4" \
  -frames:v 1 -vf scale=1280:720 "$T/cuadros/CONTROL-otro-mundo.png"
for j in rects/mundo-*.json; do
  sed "s#@T@#$T#g" "$j" > "$T/$(basename "$j")"
  "$PY" -W ignore comparar-mundo.py "$T/$(basename "$j")"
  echo
done

echo "################################################################"
echo "# 4. EL AUDIO: NIVEL Y PORTON DE TRANSCRIPCION"
echo "################################################################"
echo
for f in $A $B $C; do
  echo "--- $f ---"
  # Solo el bloque Summary del final: las lineas por cuadro que ebur128 escribe mientras
  # corre traen los mismos rotulos y taparian el resultado con ochenta lineas de proceso.
  ffmpeg -hide_banner -nostats -i "$D/$f.mp4" -vn -af ebur128=peak=true -f null - 2>&1 \
    | sed -n '/Summary:/,$p' | /usr/bin/grep -E "I: |LRA: |Peak: " | sed 's/^/    /'
done
echo "--- referencia: DESIGN.md normaliza cada linea de relator a -20 LUFS ---"
echo

# El control positivo del porton: el ambiente del clip A con una linea de relator real
# adentro, al nivel al que va a ir en la mezcla.
ffmpeg -hide_banner -loglevel error -y -ss 0.4 -t 6.0 -i "$RAIZ/demo/hydration-break/audio/primario.m4a" \
  -ac 1 -ar 16000 -c:a pcm_s16le "$T/audio/linea.wav"
ffmpeg -hide_banner -loglevel error -y -i "$T/audio/$A.wav" -i "$T/audio/linea.wav" \
  -filter_complex "[1:a]loudnorm=I=-20:TP=-2:LRA=7[v];[0:a][v]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]" \
  -map "[out]" -ac 1 -ar 16000 -c:a pcm_s16le "$T/audio/CONTROL-con-habla.wav"

for w in $A $B $C CONTROL-con-habla; do
  echo "--- transcripcion de $w ---"
  out=$("$W/build/bin/whisper-cli" -m "$W/models/ggml-medium.bin" -l en -nt -np -f "$T/audio/$w.wav" 2>&1 | sed '/^$/d')
  [ -n "$out" ] && echo "$out" || echo "    (el transcriptor no devolvio una sola palabra)"
done
