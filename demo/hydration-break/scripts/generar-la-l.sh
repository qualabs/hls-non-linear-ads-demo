#!/usr/bin/env bash
# generar-la-l.sh -- genera el MOVIMIENTO del fondo pictórico de la L encadenando
# segmentos de Veo desde el cuadro semilla que arma `l-capas.sh`.
#
# POR QUÉ LA L SE MUEVE. Es el aviso más fuerte de los tres no lineales y era el único
# creativo quieto del minuto: una placa fija de dieciséis segundos al lado de un partido
# en movimiento se lee como una imagen pegada y no como un aviso. Nicolás lo pidió así,
# y con la herramienta que corresponde: el movimiento se genera.
#
# EL REPARTO ES EL DEL ADR 0045 Y ACÁ TIENE UNA RAZÓN DE MÁS. Lo que entra al modelo es
# el fondo pictórico SIN una letra, y la tipografía se compone encima después, cuadro a
# cuadro. La razón no es de gusto: el modelo re-dibuja cada cuadro, así que una
# tipografía adentro de la semilla vuelve con el texto chico deformado. Está medido en
# esta misma fase, en el spot lineal y en la primera L generada. Afuera del modelo, las
# letras quedan exactas.
#
# SON DOS ESLABONES Y NO UN LOOP, y es una decisión. La L dura 16 s y una generación da
# 8, así que las dos salidas eran repetir el mismo clip dos veces o encadenar dos. Un
# loop de 8 s se nota como un loop justo porque el aviso dura exactamente el doble: el
# espectador ve el mismo gesto dos veces en el mismo aviso, que es peor que no tener
# movimiento. El segundo eslabón arranca del último cuadro del primero, así que los
# dieciséis segundos son un solo movimiento continuo. Es el mismo argumento que decidió
# la cadena de la parada del juego.
#
# LOS LÍMITES SON DE LA DOCUMENTACIÓN Y NO DE UNA PRUEBA: `veo-3.1-fast-generate-001`,
# GA y sólo en us-central1, "Video lengths: 4, 6, or 8 seconds", US$ 0,08/s a 720p sin
# audio.
#
# SE CORRE POR ESCALERA: una primera y se mira.
#
#   ./scripts/generar-la-l.sh 1     el primero, para mirarlo
#   ./scripts/generar-la-l.sh 2     la cadena entera
set -euo pipefail
cd "$(dirname "$0")/.."

HASTA=${1:?cuántos segmentos generar, empezando por el 1}
MODELO=${VEO_MODELO:-veo-3.1-fast-generate-001}
REGION=us-central1
SEGUNDOS=8

P=content/.fuentes/l
mkdir -p "$P"

# El cuadro semilla se rearma cada vez desde el asset list, así que un cambio de las
# bandas no puede quedar viejo acá.
SEMILLA=$(mktemp -d "${TMPDIR:-/dev/shm}/l-semilla-XXXXXX")
trap 'rm -rf "$SEMILLA"' EXIT
./scripts/l-capas.sh "$SEMILLA" >/dev/null
[ -s "$SEMILLA/l-fondo.png" ] || { echo "no se pudo armar el cuadro semilla" >&2; exit 1; }

# EL PROMPT. Las dos lecciones de la cadena de la parada aplicadas acá:
#
# 1. DESCRIBE LA ALTERNATIVA EN LUGAR DE SÓLO PROHIBIR. El generador llena los huecos
#    con lo que conoce, así que "sin logo" deja el hueco y "un único acento continuo en
#    ámbar recorriendo la entresuela, y nada más" lo llena. A este zapato ya le funcionó
#    esa formulación exacta cuando se generó la foto.
#
# 2. NOMBRA LAS MARCAS QUE NO PUEDEN APARECER. "Liso" no es una alternativa: es una
#    prohibición con otras palabras. Y en un aviso el umbral es más duro que en el
#    programa: acá las marcas son inventadas y NUNCA imitan a una real, así que ni
#    incidental ni chica.
#
# Y el movimiento se pide chico a propósito: lo que tiene que moverse es el producto,
# no la cámara. Un empuje de cámara sobre un aviso que ocupa la banda de una L hace que
# el fondo se salga de la banda, y la banda no se mueve.
PROMPT='A slow, quiet studio product shot. The charcoal grey knit running shoe floats in
the air and turns very slowly on its own axis, drifting a few centimetres, as if suspended.
The dark background stays exactly as dark and as empty as it is: a deep near black field
with a faint warm glow behind the shoe, no floor, no horizon, no props and no set. The
camera does not move, pan or zoom. Soft studio light from the upper left, unchanged
throughout. No cuts, no flashes, no text, no graphics, no captions.
The upper of the shoe is a single flat charcoal knit with the mesh weave visible and no
printed mark of any kind anywhere on it. The only marking on the whole shoe is ONE
continuous amber line running along the midsole, and nothing else at all: no other
printing, no emblem, no symbol, no lettering and no numbers. No brand mark anywhere in
the frame: no swoosh, no three stripes, no leaping cat, no interlocking letters, no crown
and no sponsor name.'

command -v gcloud >/dev/null || { echo "falta gcloud" >&2; exit 1; }
TOKEN=$(gcloud auth print-access-token 2>/dev/null) || { echo "sin credenciales: gcloud auth login" >&2; exit 1; }
PROYECTO=$(gcloud config get-value project 2>/dev/null | tr -d '[:space:]')
BASE="https://$REGION-aiplatform.googleapis.com/v1/projects/$PROYECTO/locations/$REGION/publishers/google/models/$MODELO"

TMP=$(mktemp -d "${TMPDIR:-/dev/shm}/l-veo-XXXXXX")
trap 'rm -rf "$TMP" "$SEMILLA"' EXIT

for n in $(seq 1 "$HASTA"); do
  NN=$(printf '%02d' "$n")
  SEG="$P/$NN.mp4"
  if [ -s "$SEG" ]; then echo "== segmento $NN: ya está =="; continue; fi

  if [ "$n" -eq 1 ]; then
    PRIMER="$SEMILLA/l-fondo.png"
  else
    ANT="$P/$(printf '%02d' $((n - 1))).mp4"
    [ -s "$ANT" ] || { echo "falta el segmento anterior $ANT" >&2; exit 1; }
    PRIMER="$TMP/desde-$NN.png"
    ffmpeg -hide_banner -loglevel error -y -sseof -1 -i "$ANT" -update 1 -frames:v 1 "$PRIMER"
  fi

  echo "== segmento $NN de $HASTA: ${SEGUNDOS}s desde $(basename "$PRIMER") =="

  python3 - "$PRIMER" "$TMP/cuerpo.json" "$PROMPT" "$SEGUNDOS" <<'PY'
import base64, json, sys
primero, salida, prompt, segundos = sys.argv[1:5]
with open(primero, 'rb') as f:
    img = base64.b64encode(f.read()).decode()
json.dump({"instances": [{"prompt": prompt,
                          "image": {"bytesBase64Encoded": img, "mimeType": "image/png"}}],
           "parameters": {"aspectRatio": "16:9", "sampleCount": 1,
                          "durationSeconds": int(segundos), "resolution": "720p"}},
          open(salida, 'w'))
PY

  OP=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d @"$TMP/cuerpo.json" "$BASE:predictLongRunning" \
    | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("name") or "ERROR:"+json.dumps(d)[:300])')
  case "$OP" in ERROR:*) echo "${OP#ERROR:}" >&2; exit 1;; esac

  for _ in $(seq 1 40); do
    sleep 15
    curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      -d "{\"operationName\":\"$OP\"}" "$BASE:fetchPredictOperation" > "$TMP/estado.json"
    python3 -c 'import json,sys; sys.exit(0 if json.load(open(sys.argv[1])).get("done") else 1)' "$TMP/estado.json" && break
    echo "  generando ..."
  done

  python3 - "$TMP/estado.json" "$SEG" <<'PY'
import base64, json, sys
e = json.load(open(sys.argv[1]))
if not e.get("done"): sys.exit("no terminó en diez minutos")
if "error" in e: sys.exit(f"Vertex devolvió un error: {e['error']}")
v = (e.get("response") or {}).get("videos") or []
if not v: sys.exit(f"terminó sin video: {json.dumps(e)[:400]}")
d = v[0].get("bytesBase64Encoded")
if not d: sys.exit(f"vino por URI: {v[0].get('gcsUri','(sin uri)')}")
open(sys.argv[2], "wb").write(base64.b64decode(d))
PY
  echo "  $SEG  ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SEG")s, $(du -h "$SEG" | cut -f1))"
done

echo
echo "MIRALO ANTES DE SEGUIR. Lo que hay que ver: que el fondo siga siendo un campo"
echo "oscuro y vacío -- si el modelo le puso un piso o un set, el creativo deja de ser"
echo "una L y pasa a ser una foto de estudio dentro de una banda. Y el chequeo de vestido"
echo "comercial, que en un aviso es más duro que en el programa: acá las marcas son"
echo "inventadas y NO imitan a ninguna real, ni chica ni incidental."
