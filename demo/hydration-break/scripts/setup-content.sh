#!/usr/bin/env bash
# setup-content.sh -- trae todo lo que esta demo necesita y que NO está en el
# repositorio: los clips del partido y el video del spot lineal.
#
# POR QUÉ ESTE SCRIPT EXISTE, y es una decisión de Nicolás: **el repositorio no carga
# video.** Ni el metraje del partido ni el spot generado. Lo que carga es de dónde sale
# cada cosa y con qué prompt se genera, que es lo que este script ejecuta. Las imágenes
# generadas sí están versionadas, porque son livianas.
#
# Y el resultado NO tiene que ser idéntico al que se grabó acá. Con un modelo generativo
# no existe eso, y el criterio es explícito: alcanza con que el prompt sea el correcto y
# con que quien lo corra entienda por qué dice lo que dice. Las razones de cada línea del
# prompt están en graphics/creativos/fuentes/README.md.
#
# SE CORRE UNA VEZ, a mano, y no lo llama `run.sh`: genera video, y generar video cuesta
# plata de la cuenta de quien lo corre. Un `run.sh` que gasta sin preguntar es la clase de
# cosa que no se arregla después.
#
#   ./demo/hydration-break/scripts/setup-content.sh
#
# Después de esto, `./run.sh hydration-break` empaqueta y sirve sin pedir nada más.
set -euo pipefail
cd "$(dirname "$0")/.."

F=content/.fuentes
G=graphics/creativos/fuentes
mkdir -p "$F" "$F/creativos"

# ---------------------------------------------------------------------------
# 1. LOS CLIPS DEL PARTIDO
#
# De Pexels, bajo la Pexels License, que no exige atribución. Se acreditan igual en
# CREDITS.md, con lo que se miró de cada uno: **de seis candidatos, cinco no pasaron el
# chequeo de cuadro**, y los títulos de un banco de stock no dicen nada sobre derechos.
# Si alguno de estos links se cae, el reemplazo pasa por el mismo chequeo antes de entrar.
# ---------------------------------------------------------------------------
baja() { # $1 url, $2 archivo
  [ -s "$F/$2" ] && { echo "  ya está: $2"; return; }
  echo "  bajando $2 ..."
  curl -fL --retry 3 -o "$F/$2" "$1" || {
    echo "no se pudo bajar $2 desde $1" >&2
    echo "  si el clip ya no está en Pexels, ver CREDITS.md: qué aporta cada uno y qué" >&2
    echo "  se le miró, para elegir un reemplazo que pase el mismo chequeo de cuadro." >&2
    exit 1
  }
}

echo "== los clips del partido =="
baja https://www.pexels.com/download/video/31370180/ 31370180.mp4
baja https://www.pexels.com/download/video/9502518/  9502518.mp4
baja https://www.pexels.com/download/video/9517718/  9517718.mp4
baja https://www.pexels.com/download/video/9441632/  9441632.mp4

# ---------------------------------------------------------------------------
# 2. EL SPOT LINEAL, generado con Veo desde una imagen fija
# ---------------------------------------------------------------------------
SALIDA="$F/creativos/neonectar-8s.mp4"
if [ -s "$SALIDA" ]; then
  echo "== el spot lineal ya está: $SALIDA =="
  exit 0
fi

MODELO=veo-3.1-fast-generate-001
REGION=us-central1
ENTRADA="$G/neonectar-panel.jpg"

# EL PROMPT. Sus tres razones están medidas y no son preferencias, y están explicadas en
# el README de graphics/creativos/fuentes/:
#
#   - describe el movimiento de cámara, porque Veo honra el primer cuadro y lo que hace
#     después es lo único que hay que pedirle;
#   - NO pide tipografía, porque el titular se va de cuadro cuando la cámara empuja: la
#     tipografía vuelve compuesta como SVG al final del spot (ADR 0045);
#   - y donde prohíbe, DESCRIBE LA ALTERNATIVA. Prohibir deja el hueco y el modelo lo
#     llena con lo que conoce.
PROMPT='A slow, smooth camera push in towards the two drink containers, which stay
centred and in focus. Condensation beads catch the light, a few droplets drift upward, the
liquid inside catches a highlight. The neon room behind them stays soft and out of focus.
Nothing enters or leaves the frame, no cuts, no text appears. Commercial product
cinematography, shallow depth of field, steady motion.
Do not imitate the trade dress of any real brand: no cursive white script on red, no
interlocking letters, no real logo of any kind. The identity in frame is its own -- cool
teal and violet neon over matte black cans.'

echo "== el spot lineal: generando con $MODELO en $REGION =="

# PREFLIGHT, y falla diciendo qué falta en lugar de fallar a la mitad. Cada chequeo dice
# una sola cosa, porque un mensaje que enumera cinco causas posibles no ayuda a nadie.
command -v gcloud >/dev/null || {
  echo "falta el CLI de Google Cloud (gcloud) y este paso genera video con Vertex AI." >&2
  echo "  instalarlo y correr: gcloud auth login" >&2
  exit 1
}
TOKEN=$(gcloud auth print-access-token 2>/dev/null) || {
  echo "gcloud está pero no hay credenciales: correr 'gcloud auth login'." >&2
  exit 1
}
PROYECTO=$(gcloud config get-value project 2>/dev/null | tr -d '[:space:]')
[ -n "$PROYECTO" ] && [ "$PROYECTO" != "(unset)" ] || {
  echo "gcloud no tiene un proyecto configurado: correr 'gcloud config set project <id>'." >&2
  exit 1
}
[ -s "$ENTRADA" ] || { echo "falta la imagen de entrada $ENTRADA" >&2; exit 1; }

BASE="https://$REGION-aiplatform.googleapis.com/v1/projects/$PROYECTO/locations/$REGION/publishers/google/models/$MODELO"

# El chequeo de acceso al modelo, y el instrumento importa: con un cuerpo VACÍO la
# validación corre ANTES del lookup, así que un 400 sale exista el modelo o no y el
# chequeo no puede fallar. Con `instances` presente el lookup corre primero, y ahí un 404
# significa que este proyecto no tiene el modelo.
CODIGO=$(curl -s -o /dev/null -w '%{http_code}' -X POST \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"instances":[{}],"parameters":{}}' "$BASE:predictLongRunning")
if [ "$CODIGO" = "404" ]; then
  echo "este proyecto ($PROYECTO) no tiene acceso a $MODELO." >&2
  echo "  habilitarlo en la consola de Google Cloud, en Vertex AI > Model Garden." >&2
  echo "  ojo con el id: los que terminan en -preview ya no existen, y el 404 dice" >&2
  echo "  'not found OR your project does not have access', sin distinguir las dos cosas." >&2
  exit 1
fi

TMP=$(mktemp -d "${TMPDIR:-/dev/shm}/veo-XXXXXX")
trap 'rm -rf "$TMP"' EXIT

python3 - "$ENTRADA" "$TMP/cuerpo.json" "$PROMPT" <<'PY'
import base64, json, sys
entrada, salida, prompt = sys.argv[1], sys.argv[2], sys.argv[3]
with open(entrada, 'rb') as f:
    imagen = base64.b64encode(f.read()).decode()
json.dump({
    "instances": [{"prompt": prompt, "image": {"bytesBase64Encoded": imagen, "mimeType": "image/jpeg"}}],
    "parameters": {"aspectRatio": "16:9", "sampleCount": 1, "durationSeconds": 8}
}, open(salida, 'w'))
PY

OP=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d @"$TMP/cuerpo.json" "$BASE:predictLongRunning" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("name",""))')
[ -n "$OP" ] || { echo "Vertex no devolvió una operación: revisar la respuesta a mano." >&2; exit 1; }
echo "  operación: $OP"

# Polling. La generación tardó ~118 s en la medición; el techo son 10 minutos.
for _ in $(seq 1 40); do
  sleep 15
  curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"operationName\":\"$OP\"}" "$BASE:fetchPredictOperation" > "$TMP/estado.json"
  if python3 -c 'import json,sys; sys.exit(0 if json.load(open(sys.argv[1])).get("done") else 1)' "$TMP/estado.json"; then
    break
  fi
  echo "  generando ..."
done

python3 - "$TMP/estado.json" "$SALIDA" <<'PY'
import base64, json, sys
estado = json.load(open(sys.argv[1]))
if not estado.get("done"):
    sys.exit("la generación no terminó en diez minutos: la operación sigue viva, "
             "reintentar el fetch con su nombre")
if "error" in estado:
    sys.exit(f"Vertex devolvió un error: {estado['error']}")
videos = (estado.get("response") or {}).get("videos") or []
if not videos:
    sys.exit(f"la operación terminó sin video: {json.dumps(estado)[:400]}")
datos = videos[0].get("bytesBase64Encoded")
if not datos:
    sys.exit("el video vino por URI y no inline: bajarlo de "
             f"{videos[0].get('gcsUri', '(sin uri)')}")
open(sys.argv[2], "wb").write(base64.b64decode(datos))
PY

echo "  $SALIDA  ($(du -h "$SALIDA" | cut -f1))"
echo
echo "listo. Ahora: ./run.sh hydration-break"
