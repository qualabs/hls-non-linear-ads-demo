#!/usr/bin/env bash
# se-entiende-el-relato.sh -- el relato se sigue entendiendo DEBAJO del ambiente.
#
# POR QUE HACE FALTA ADEMAS DEL MARGEN EN dB. medir-mezcla.py dice cuantos decibeles hay
# entre la voz y el ambiente en cada instante. Eso es la causa; esto es el efecto. Un margen
# de 10 dB es un numero que hay que creerle a una tabla de practica de transmision; que un
# transcriptor que no vio el guion recupere las diecinueve lineas del audio mezclado es la
# propiedad misma.
#
# LOS DOS CONTROLES:
#   NEGATIVO -- el mismo transcriptor sobre el ambiente solo, sin voces. Tiene que devolver
#     ruido de motores y ninguna linea. Sin el, "las recupero" no distingue entre que se
#     entiendan y que el transcriptor este inventando lo que espera oir.
#   POSITIVO -- el mismo transcriptor sobre el relato solo, sin ambiente. Es el techo: lo
#     que se pierda ahi no lo perdio la mezcla, lo perdio el sintetizador o el oyente.
#
# El transcriptor es whisper.cpp local, el mismo con el que la T-03 paso el porton sobre los
# catorce clips. Corre en la maquina y no cuesta nada.
set -euo pipefail
cd "$(dirname "$0")"

RAIZ=$(cd ../../../../../.. && pwd)
DEMO="$RAIZ/demo/race-multiview"
W=/home/nicolas/.claude/skills/whisper-transcribe/.whisper_local_build/whisper.cpp
export LD_LIBRARY_PATH="$W/build/src:$W/build/ggml/src:$W/build/ggml/src/ggml-cpu:${LD_LIBRARY_PATH:-}"

T=$(mktemp -d "/dev/shm/oir-mezcla-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT

oir() {  # $1 archivo  $2 etiqueta
  ffmpeg -hide_banner -loglevel error -y -i "$1" -vn -ac 1 -ar 16000 -c:a pcm_s16le "$T/a.wav"
  echo "--- $2 ---"
  "$W/build/bin/whisper-cli" -m "$W/models/ggml-medium.bin" -l en -np -f "$T/a.wav" 2>/dev/null \
    | sed 's/^/    /'
  echo
}

echo "################################################################"
echo "# EL PROGRAMA MEZCLADO -- voces sobre el ambiente de los clips"
echo "################################################################"
echo
oir "$DEMO/content/.fuentes/programa.mp4" "programa.mp4"

echo "################################################################"
echo "# CONTROL NEGATIVO -- el ambiente solo, sin una voz encima"
echo "################################################################"
echo
oir "$DEMO/content/.fuentes/audio/ambiente.wav" "ambiente.wav"

echo "################################################################"
echo "# CONTROL POSITIVO -- el relato solo, sin ambiente. Es el techo."
echo "################################################################"
echo
oir "$DEMO/content/.fuentes/audio/relato.wav" "relato.wav"

echo "################################################################"
echo "# EL GUION, PARA COMPARAR CONTRA LO DE ARRIBA"
echo "################################################################"
echo
python3 - "$DEMO/audio/tiempos.json" <<'PY'
import json, sys
for f in json.load(open(sys.argv[1])):
    print(f"    [{f['inicio']:7.3f} -> {f['fin']:7.3f}]  {f['voz']}  {f['texto']}")
PY
