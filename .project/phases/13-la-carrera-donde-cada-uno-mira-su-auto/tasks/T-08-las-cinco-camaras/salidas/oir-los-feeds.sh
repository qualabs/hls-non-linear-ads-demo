#!/usr/bin/env bash
# oir-los-feeds.sh -- el porton de transcripcion sobre EL ENTREGABLE y no sobre sus insumos.
#
# Los clips ya pasaron el porton de uno en uno (`oir-la-camara.sh`, una corrida por camara).
# Esto corre sobre los 64 s pegados y emparejados, que es el archivo que la demo reproduce, y
# existe porque el montaje puede meter audio que los insumos no tenian: el concat, la
# ganancia por clip y la recodificacion a AAC son tres pasos entre lo que se verifico y lo que
# se entrega.
#
# EL CONTROL ES EL MISMO Y VA EN LA MISMA CORRIDA: el feed de CALDRIX con una linea de relator
# real mezclada a -20 LUFS encima. Si el porton no lo marca, un "SPEECH: NO" sobre los feeds
# no distingue entre "no hay habla" y "no hay oyente".
#
#   ./oir-los-feeds.sh
set -euo pipefail
cd "$(dirname "$0")"
RAIZ=$(cd ../../../../../.. && pwd)
F="$RAIZ/demo/race-multiview/content/.fuentes"

PROYECTO=$(gcloud config get-value project 2>/dev/null | tr -d '[:space:]')
TOKEN=$(gcloud auth print-access-token)
T=$(mktemp -d "/dev/shm/oir-feeds-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT

FEEDS=(caldrix marvok noctev runtak pentav quentra)
for c in "${FEEDS[@]}"; do
  ffmpeg -hide_banner -loglevel error -y -i "$F/$c.mp4" -vn -ac 1 -ar 16000 -c:a pcm_s16le "$T/$c.wav"
done

# EL CONTROL POSITIVO, armado igual que en `oir-la-camara.sh` de la T-05: el ambiente del
# primer feed con seis segundos de relator real encima, a -20 LUFS.
ffmpeg -hide_banner -loglevel error -y -ss 0.4 -t 6.0 -i "$RAIZ/demo/hydration-break/audio/primario.m4a" \
  -ac 1 -ar 16000 -c:a pcm_s16le "$T/linea.wav"
ffmpeg -hide_banner -loglevel error -y -i "$T/caldrix.wav" -i "$T/linea.wav" \
  -filter_complex "[1:a]loudnorm=I=-20:TP=-2:LRA=7[v];[0:a][v]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]" \
  -map "[out]" -ac 1 -ar 16000 -c:a pcm_s16le "$T/CONTROL-POSITIVO-sobre-el-feed.wav"

echo "gemini-2.5-flash escuchando los seis feeds de 64 s y el control"
echo
for w in "${FEEDS[@]}" CONTROL-POSITIVO-sobre-el-feed; do
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
echo "EL NIVEL DE LOS SEIS FEEDS Y DEL PROGRAMA, que es su destino"
echo
for a in "${FEEDS[@]}" programa; do
  L=$(ffmpeg -hide_banner -nostats -i "$F/$a.mp4" -vn -af ebur128=peak=true -f null - 2>&1 \
    | sed -n '/Summary:/,$p' | /usr/bin/grep -E "^ +(I|LRA|Peak):" | tr -s ' \n' ' ')
  printf '  %-12s %s\n' "$a" "$L"
done
