#!/usr/bin/env bash
# oir-el-programa.sh -- el porton de transcripcion sobre los catorce clips, y su control.
#
# QUE DECIDE. Un clip cuyo audio traiga una palabra hablada se regenera: es el R3 de
# PHASE.md y la falla que la demo del partido descubrio tarde (pidio imagen sin mencionar
# el sonido y volvio con dialogo en ingles entre los jugadores, repetido entre clips). Se
# comprueba con transcripcion y no de oido, porque de oido no queda evidencia.
#
# HAY DOS OYENTES Y MIDEN COSAS DISTINTAS, y esto lo dejo escrito la T-02:
#   - whisper.cpp CONVIERTE HABLA EN TEXTO. Atrapa dialogo en primer plano y descarta lo
#     que queda bajo su umbral, asi que un locutor lejano se le puede escapar.
#   - gemini-2.5-flash ESCUCHA el archivo, asi que se le puede preguntar por lo que un
#     transcriptor no reporta: si hay CUALQUIER voz, por debil que sea.
#   No es una generacion de Veo: son unos 250 tokens de audio por clip.
#
# LOS DOS CONTROLES, Y SIN ELLOS ESTO NO ES UN CHEQUEO:
#   POSITIVO -- el ambiente del clip 1 con una linea de relator REAL mezclada a -20 LUFS,
#     que es el nivel al que DESIGN.md normaliza cada linea. Los dos oyentes tienen que
#     decir que ahi hay habla. Sin este control, un "no hay habla" no distingue entre no
#     haber habla y no haber transcriptor: es exactamente lo que le paso a la T-02, cuyo
#     binario de whisper.cpp abortaba por una biblioteca fuera del PATH del enlazador y
#     devolvia vacio para los tres archivos, control incluido.
#   NEGATIVO DE OTRO ORIGEN -- un clip de demo/hydration-break/content/.fuentes/parada/,
#     que TIENE dialogo de verdad y que TASKS.md nombra como el control de esta task. Tiene
#     que ser rechazado. Es un archivo distinto, de otra demo, que nadie preparo para esto.
#
# LA LINEA DE NIVEL NO ES PARTE DEL PORTON y va aparte al final: cuanto mide cada clip en
# LUFS, que es el insumo que la task del montaje necesita para emparejarlos. Acá se mide y
# no se corrige: el montaje es de otra task.
set -euo pipefail
cd "$(dirname "$0")"

RAIZ=$(cd ../../../../../.. && pwd)
D="$RAIZ/demo/race-multiview/content/.fuentes/programa"
PARADA="$RAIZ/demo/hydration-break/content/.fuentes/parada"
W=/home/nicolas/.claude/skills/whisper-transcribe/.whisper_local_build/whisper.cpp
export LD_LIBRARY_PATH="$W/build/src:$W/build/ggml/src:$W/build/ggml/src/ggml-cpu:${LD_LIBRARY_PATH:-}"

PROYECTO=$(gcloud config get-value project 2>/dev/null | tr -d '[:space:]')
TOKEN=$(gcloud auth print-access-token)

T=$(mktemp -d "/dev/shm/oir-programa-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT

CLIPS=()
for f in "$D"/*.mp4; do
  [ -e "$f" ] || continue
  n=$(basename "$f" .mp4)
  CLIPS+=("$n")
  ffmpeg -hide_banner -loglevel error -y -i "$f" -vn -ac 1 -ar 16000 -c:a pcm_s16le "$T/$n.wav"
done
[ ${#CLIPS[@]} -gt 0 ] || { echo "no hay clips en $D" >&2; exit 1; }

# CONTROL POSITIVO: el ambiente del primer clip con una linea de relator real adentro.
PRIMERO=${CLIPS[0]}
ffmpeg -hide_banner -loglevel error -y -ss 0.4 -t 6.0 -i "$RAIZ/demo/hydration-break/audio/primario.m4a" \
  -ac 1 -ar 16000 -c:a pcm_s16le "$T/linea.wav"
ffmpeg -hide_banner -loglevel error -y -i "$T/$PRIMERO.wav" -i "$T/linea.wav" \
  -filter_complex "[1:a]loudnorm=I=-20:TP=-2:LRA=7[v];[0:a][v]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[out]" \
  -map "[out]" -ac 1 -ar 16000 -c:a pcm_s16le "$T/CONTROL-POSITIVO-linea-mezclada.wav"

# CONTROL DE OTRO ORIGEN: los clips de la parada del partido, que traen dialogo de verdad.
# Se pasan TODOS por el primer oyente, que es local y no cuesta nada, y al segundo va uno
# solo. Que sean todos no es exceso: TASKS.md nombra "uno de los clips de la parada" sin
# decir cual, y cual de los ocho trae la voz es justamente lo que hay que averiguar antes
# de apoyarse en el.
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
     "SPEECH: YES or NO -- is there ANY human speech, commentary, announcement, singing or chanting, however faint or distant?\n"
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
echo "    (DESIGN.md normaliza cada linea de relator a -20 LUFS)"
echo
for w in "${CLIPS[@]}"; do
  linea=$(ffmpeg -hide_banner -nostats -i "$D/$w.mp4" -vn -af ebur128=peak=true -f null - 2>&1 \
    | sed -n '/Summary:/,$p' | /usr/bin/grep -E "^\s+(I|LRA|Peak):" | tr -s ' \n' ' ')
  printf '  %-46s %s\n' "$w" "$linea"
done
