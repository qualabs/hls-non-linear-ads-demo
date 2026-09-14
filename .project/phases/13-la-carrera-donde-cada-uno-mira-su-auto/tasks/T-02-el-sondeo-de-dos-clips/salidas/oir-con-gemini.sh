#!/usr/bin/env bash
# oir-con-gemini.sh -- el segundo oyente del porton de audio, independiente del primero.
#
# POR QUE HAY DOS Y NO UNO. whisper.cpp es un transcriptor: su trabajo es convertir habla en
# texto, y cuando no hay habla escribe una anotacion entre parentesis -- "(engine revving)".
# Eso alcanza para atrapar diálogo en primer plano, que es la falla que la demo del partido
# tuvo, y NO alcanza para atrapar una voz de fondo que el transcriptor descarta por debajo
# de su umbral: un locutor de circuito lejano, una radio, un coro del publico. Ahi un
# "vacio" del transcriptor y un "no hay voces" se ven iguales y no son lo mismo.
#
# gemini-2.5-flash escucha el archivo en vez de transcribirlo, asi que se le puede preguntar
# por lo que un transcriptor no reporta: si hay CUALQUIER voz humana por debil que sea, y que
# suena. Se le pide en cuatro lineas rotuladas para que la respuesta se pueda leer de un
# vistazo y no haya que interpretarla.
#
# SU CONTROL ES EL MISMO que el del otro: el ambiente del clip con una linea de relator real
# mezclada a -20 LUFS. Los dos oyentes tienen que decir YES ahi.
#
# NO ES UNA GENERACION DE VEO y no cuenta contra el tope de cuatro de la T-02: son unos
# 250 tokens de audio por clip contra gemini-2.5-flash.
set -euo pipefail
cd "$(dirname "$0")"

RAIZ=$(cd ../../../../../.. && pwd)
D="$RAIZ/demo/race-multiview/content/.fuentes/sondeo"
A=a-casilla-04-aereo-los-seis
B=b-casilla-12-rueda-runtak
C=c-casilla-04-correccion-aereo-y-lista
PROYECTO=$(gcloud config get-value project 2>/dev/null | tr -d '[:space:]')
TOKEN=$(gcloud auth print-access-token)

T=$(mktemp -d "/dev/shm/oir-sondeo-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT

for f in $A $B $C; do
  ffmpeg -hide_banner -loglevel error -y -i "$D/$f.mp4" -vn -ac 1 -ar 16000 -c:a pcm_s16le "$T/$f.wav"
done
ffmpeg -hide_banner -loglevel error -y -ss 0.4 -t 6.0 -i "$RAIZ/demo/hydration-break/audio/primario.m4a" \
  -ac 1 -ar 16000 -c:a pcm_s16le "$T/linea.wav"
ffmpeg -hide_banner -loglevel error -y -i "$T/$A.wav" -i "$T/linea.wav" \
  -filter_complex "[1:a]loudnorm=I=-20:TP=-2:LRA=7[v];[0:a][v]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]" \
  -map "[out]" -ac 1 -ar 16000 -c:a pcm_s16le "$T/CONTROL-con-habla.wav"

for w in $A $B $C CONTROL-con-habla; do
  python3 - "$T/$w.wav" "$T/cuerpo.json" <<'PY'
import base64, json, sys
p = ("Listen to this 8-second audio track. Answer in exactly four labelled lines and nothing else.\n"
     "SPEECH: YES or NO -- is there ANY human speech, commentary, announcement, singing or chanting, however faint or distant?\n"
     "TRANSCRIPT: verbatim transcript of anything spoken, or NONE.\n"
     "SOUNDS: list the sounds you actually hear, in order of prominence.\n"
     "MUSIC: YES or NO -- is there any music?")
json.dump({"contents": [{"role": "user", "parts": [
    {"text": p},
    {"inlineData": {"mimeType": "audio/wav",
                    "data": base64.b64encode(open(sys.argv[1], "rb").read()).decode()}}]}],
    "generationConfig": {"temperature": 0}}, open(sys.argv[2], "w"))
PY
  echo "--- $w ---"
  curl -s -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d @"$T/cuerpo.json" \
    "https://us-central1-aiplatform.googleapis.com/v1/projects/$PROYECTO/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent" \
    | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["candidates"][0]["content"]["parts"][-1]["text"].strip() if "candidates" in d else json.dumps(d)[:400])'
done
