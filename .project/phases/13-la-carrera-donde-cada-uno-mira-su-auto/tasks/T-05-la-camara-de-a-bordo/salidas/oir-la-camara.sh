#!/usr/bin/env bash
# oir-la-camara.sh -- el porton de transcripcion sobre los ocho clips de la camara de a
# bordo, con los dos controles de la T-03.
#
# ES EL MISMO INSTRUMENTO QUE `oir-el-programa.sh` de la T-03 -- mismos dos oyentes, mismos
# dos controles, misma linea de nivel al final -- con la carpeta por argumento. No se toca
# el de la T-03 porque es de otra task; lo que aca no se repite es el porque, que esta
# escrito entero en su cabecera y sigue valiendo:
#
#   - whisper.cpp CONVIERTE HABLA EN TEXTO y se le puede escapar una voz lejana;
#     gemini-2.5-flash ESCUCHA el archivo y se le puede preguntar si hay CUALQUIER voz.
#   - CONTROL POSITIVO: el ambiente del primer clip con una linea de relator real mezclada
#     a -20 LUFS. Sin el, un "no hay habla" no distingue entre no haber habla y no haber
#     transcriptor -- que es exactamente lo que le paso a la T-02.
#   - CONTROL DE OTRO ORIGEN: un clip de la parada del partido, que TIENE dialogo de verdad
#     y que nadie preparo para esto.
#
# LO QUE CAMBIA EN UNA CAMARA DE A BORDO es cual es el riesgo: la radio de equipo. Es habla
# y por eso el porton la atrapa igual, y por eso tampoco se la nombro en el prompt --
# nombrar lo prohibido da permiso, y la oracion de negacion que viajo es letra por letra la
# de las catorce casillas del programa, que volvieron catorce de catorce sin una palabra.
#
#   ./oir-la-camara.sh <carpeta con los .mp4>
set -euo pipefail
cd "$(dirname "$0")"

RAIZ=$(cd ../../../../../.. && pwd)
D=${1:?uso: oir-la-camara.sh <carpeta con los mp4>}
PARADA="$RAIZ/demo/hydration-break/content/.fuentes/parada"
W=/home/nicolas/.claude/skills/whisper-transcribe/.whisper_local_build/whisper.cpp
export LD_LIBRARY_PATH="$W/build/src:$W/build/ggml/src:$W/build/ggml/src/ggml-cpu:${LD_LIBRARY_PATH:-}"

PROYECTO=$(gcloud config get-value project 2>/dev/null | tr -d '[:space:]')
TOKEN=$(gcloud auth print-access-token)

T=$(mktemp -d "/dev/shm/oir-camara-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT

CLIPS=()
for f in "$D"/*.mp4; do
  [ -e "$f" ] || continue
  n=$(basename "$f" .mp4)
  CLIPS+=("$n")
  ffmpeg -hide_banner -loglevel error -y -i "$f" -vn -ac 1 -ar 16000 -c:a pcm_s16le "$T/$n.wav"
done
[ ${#CLIPS[@]} -gt 0 ] || { echo "no hay clips en $D" >&2; exit 1; }

PRIMERO=${CLIPS[0]}
ffmpeg -hide_banner -loglevel error -y -ss 0.4 -t 6.0 -i "$RAIZ/demo/hydration-break/audio/primario.m4a" \
  -ac 1 -ar 16000 -c:a pcm_s16le "$T/linea.wav"
ffmpeg -hide_banner -loglevel error -y -i "$T/$PRIMERO.wav" -i "$T/linea.wav" \
  -filter_complex "[1:a]loudnorm=I=-20:TP=-2:LRA=7[v];[0:a][v]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]" \
  -map "[out]" -ac 1 -ar 16000 -c:a pcm_s16le "$T/CONTROL-POSITIVO-linea-mezclada.wav"

CTRLS=()
for c in "$PARADA"/*.mp4; do
  [ -e "$c" ] || continue
  n="CONTROL-PARADA-$(basename "$c" .mp4)"
  ffmpeg -hide_banner -loglevel error -y -i "$c" -vn -ac 1 -ar 16000 -c:a pcm_s16le "$T/$n.wav"
  CTRLS+=("$n")
done

echo "################################################################"
echo "# 1. PRIMER OYENTE -- whisper.cpp (medium, en)"
echo "################################################################"
echo
for w in "${CLIPS[@]}" CONTROL-POSITIVO-linea-mezclada "${CTRLS[@]}"; do
  printf '%-46s ' "$w"
  out=$("$W/build/bin/whisper-cli" -m "$W/models/ggml-medium.bin" -l en -nt -np -f "$T/$w.wav" 2>/dev/null | tr '\n' ' ' | sed 's/  */ /g;s/^ //;s/ $//')
  [ -n "$out" ] && echo "$out" || echo "(el transcriptor no devolvio una sola palabra)"
done

echo
echo "################################################################"
echo "# 2. SEGUNDO OYENTE -- gemini-2.5-flash escuchando el archivo"
echo "################################################################"
echo
for w in "${CLIPS[@]}" CONTROL-POSITIVO-linea-mezclada "${CTRLS[0]}"; do
  python3 - "$T/$w.wav" "$T/cuerpo.json" <<'PY'
import base64, json, sys
p = ("Listen to this audio track. Answer in exactly three labelled lines and nothing else.\n"
     "SPEECH: YES or NO -- is there ANY human speech, commentary, announcement, team radio, singing or chanting, however faint or distant?\n"
     "TRANSCRIPT: verbatim transcript of anything spoken, or NONE.\n"
     "SOUNDS: list the sounds you actually hear, in order of prominence.")
json.dump({"contents": [{"role": "user", "parts": [
    {"text": p},
    {"inlineData": {"mimeType": "audio/wav",
                    "data": base64.b64encode(open(sys.argv[1], "rb").read()).decode()}}]}],
    "generationConfig": {"temperature": 0}}, open(sys.argv[2], "w"))
PY
  echo "--- $w ---"
  curl -s -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d @"$T/cuerpo.json" \
    "https://us-central1-aiplatform.googleapis.com/v1/projects/$PROYECTO/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent" \
    | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["candidates"][0]["content"]["parts"][-1]["text"].strip() if "candidates" in d else json.dumps(d)[:400])' \
    | sed 's/^/    /'
done

echo
echo "################################################################"
echo "# 3. EL NIVEL DE CADA CLIP -- insumo del montaje, no del porton"
echo "################################################################"
echo
for w in "${CLIPS[@]}"; do
  linea=$(ffmpeg -hide_banner -nostats -i "$D/$w.mp4" -vn -af ebur128=peak=true -f null - 2>&1 \
    | sed -n '/Summary:/,$p' | /usr/bin/grep -E "^\s+(I|LRA|Peak):" | tr -s ' \n' ' ')
  printf '  %-46s %s\n' "$w" "$linea"
done
