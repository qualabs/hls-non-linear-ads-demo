#!/usr/bin/env bash
# generar-parada.sh -- genera la parada del juego encadenando segmentos de Veo desde
# el último cuadro del acto de juego, para que el plate sea UN SOLO PARTIDO de punta a
# punta.
#
# EL PROBLEMA QUE RESUELVE, y es el peor que esta demo puede tener. El plate armado con
# clips distintos tiene un corte de escena justo donde arranca el break, así que el
# espectador percibe que **el video principal cambió** -- que es exactamente la lectura
# opuesta a lo que la demo existe para demostrar, que el primario nunca se reemplaza.
# La demo desmintiendo con la imagen lo que afirma con el texto.
#
# CÓMO. Se toma el último cuadro del acto de juego y se le pide a Veo que continúe desde
# ahí: los jugadores van a tomar agua. Cada segmento arranca del último cuadro del
# anterior, así que la cadena es continua por construcción en las costuras. Y el último
# lleva `lastFrame` contra un cuadro del original jugando, para que el juego vuelva
# exactamente donde el clip real retoma.
#
# LOS DOS ACTOS DE JUEGO COMPARTEN EL RECORTE por esto mismo (ver `armar-plate.sh`): si
# tuvieran encuadres distintos, la cadena no cerraría en los dos extremos.
#
# LOS LÍMITES SON DE LA DOCUMENTACIÓN Y NO DE UNA PRUEBA. Las model cards de
# `veo-3.1-generate-001` y `veo-3.1-fast-generate-001`, las dos GA y sólo en
# `us-central1`, dicen "Video lengths: 4, 6, or 8 seconds" y listan
# "from first and last frame" como soportado. El precio es por segundo: la tabla lo
# encabeza "Paid Tier, per second in USD", y Fast a 720p sin audio son US$ 0,08/s.
#
# SE CORRE POR ESCALERA Y NO DE UNA, y es método y no plata: una primera y se mira. Lo
# que decide el plan es si la continuación se lee como el mismo partido, y eso se sabe
# con la primera; ocho generadas de una vez que derivan son ocho para tirar.
#
#   ./scripts/generar-parada.sh 1     la primera, para mirarla
#   ./scripts/generar-parada.sh 8     la cadena entera
#
# El largo de la cadena es LARGO_CADENA (8 por defecto) y es distinto de cuántos se
# generan hoy. La distinción importa y se aprendió generando: el `lastFrame` va SÓLO en
# el último eslabón de la cadena. Puesto en el único segmento de una prueba, el modelo
# tiene que ir del cuadro de entrada al de salida en ocho segundos, y con los dos
# extremos clavados no le queda lugar para contar nada en el medio -- salió gente
# caminando por la cancha y nadie tomando agua. Los eslabones del medio van sueltos por
# adelante, que es lo que les deja ir hasta el borde y beber.
#
# Cada segmento queda en content/.fuentes/parada/NN.mp4 y no se regenera si ya está,
# así que subir el número continúa la cadena en lugar de rehacerla.
set -euo pipefail
cd "$(dirname "$0")/.."

HASTA=${1:?cuántos segmentos generar, empezando por el 1}
LARGO_CADENA=${LARGO_CADENA:-8}
MODELO=${VEO_MODELO:-veo-3.1-fast-generate-001}
REGION=us-central1
SEGUNDOS=8

G=graphics/creativos/fuentes
P=content/.fuentes/parada
mkdir -p "$P"

ENTRADA="$G/entrada-arranca-la-parada.png"
SALIDA="$G/salida-vuelve-el-juego.png"
[ -s "$ENTRADA" ] && [ -s "$SALIDA" ] || { echo "faltan los cuadros de entrada y salida en $G" >&2; exit 1; }

# EL PROMPT, y sus dos mitades están medidas.
#
# DESCRIBE LA ALTERNATIVA EN LUGAR DE SÓLO PROHIBIR. Es el hallazgo de la T-05: el
# generador llena los huecos con lo que conoce, así que "no cambies de cancha" deja el
# hueco y "la misma cancha de césped sintético con la misma reja verde y los mismos
# banderines rojos" lo llena. Cada cosa que no puede cambiar está nombrada: la cancha,
# la reja, los banderines, las líneas, la ropa, la luz y la cámara.
#
# Y PROHÍBE EL VESTIDO COMERCIAL NOMBRANDO LAS MARCAS Y DANDO ALGO QUE DIBUJAR, que es
# el refinamiento que costó una generación. La primera versión decía "plain and
# unbranded" y el modelo puso **un felino saltando de una marca real en tres pecheras**.
#
# La lección afina el hallazgo de la T-05 en lugar de contradecirlo: **"liso" no es una
# alternativa, es una prohibición con otras palabras.** Al zapato le funcionó porque la
# alternativa era algo que dibujar —"un único acento continuo en ámbar recorriendo la
# entresuela"—; a una pechera decirle "lisa" le deja el mismo hueco que decirle "sin
# logo", y el modelo lo llena con lo que conoce. Así que la pechera tiene algo que
# dibujar: un número, y nada más.
#
# Y la segunda pasada confirmó la regla por donde NO se la había aplicado. Con la
# pechera resuelta —el felino desapareció y quedaron los números— seguían las tres
# tiras en los buzos y apareció **un swoosh en una botineta**, que es marca nueva y no
# heredada del clip. A esas dos prendas el prompt les decía "sin tiras" y nada más: otra
# vez la prohibición sin nada que dibujar. Ahora el buzo tiene una superficie que
# describir —negro mate en un tono, con la trama a la vista y la costura lisa— y la
# botineta también —un color sólido de punta a punta, con el panel lateral sin cortes—.
#
# El chequeo humano corre igual: lo generado es material nuevo aunque el clip original
# haya pasado el chequeo de cuadro.
PROMPT='The same wide sideline shot of the same amateur football match, on the same
synthetic turf pitch, from the same fixed camera position and at the same distance. Play
has stopped for a drinks break: the players walk unhurriedly towards the sideline, stand
around in loose groups and drink from plastic water bottles, a couple of them stretch.
Same people, same clothes: yellow and pale blue training bibs over black tracksuit
bottoms. The green mesh fence, the red corner flags, the white pitch markings and the
mown stripes in the grass all stay exactly where they are. Flat overcast daylight, no
change in exposure. The camera does not move, pan or zoom. No cuts, no slow motion, no
text and no graphics.
Every training bib is a single flat colour with ONE large black printed number on it and
nothing else at all: no other printing, no emblem, no symbol, no lettering. No large or
centred brand mark anywhere in the frame: no leaping cat, no swoosh, no crown, no
interlocking letters, no club crest and no sponsor name on any bib.'

# ¿Se puede generar? El chequeo va con `instances` presente y no con un cuerpo vacío:
# con el cuerpo vacío la validación corre antes del lookup del modelo y el 400 sale
# exista o no, o sea que el chequeo no puede fallar.
command -v gcloud >/dev/null || { echo "falta gcloud" >&2; exit 1; }
TOKEN=$(gcloud auth print-access-token 2>/dev/null) || { echo "sin credenciales: gcloud auth login" >&2; exit 1; }
PROYECTO=$(gcloud config get-value project 2>/dev/null | tr -d '[:space:]')
BASE="https://$REGION-aiplatform.googleapis.com/v1/projects/$PROYECTO/locations/$REGION/publishers/google/models/$MODELO"

TMP=$(mktemp -d "${TMPDIR:-/dev/shm}/parada-XXXXXX")
trap 'rm -rf "$TMP"' EXIT

for n in $(seq 1 "$HASTA"); do
  NN=$(printf '%02d' "$n")
  SEG="$P/$NN.mp4"
  if [ -s "$SEG" ]; then echo "== segmento $NN: ya está =="; continue; fi

  # El primer cuadro: el de entrada para el primero, y el último cuadro del segmento
  # anterior para los que siguen. Ahí es donde la cadena se pega.
  if [ "$n" -eq 1 ]; then
    PRIMER="$ENTRADA"
  else
    ANT="$P/$(printf '%02d' $((n - 1))).mp4"
    [ -s "$ANT" ] || { echo "falta el segmento anterior $ANT" >&2; exit 1; }
    PRIMER="$TMP/desde-$NN.png"
    # `-sseof -1` toma el último cuadro sin tener que saber cuánto dura.
    ffmpeg -hide_banner -loglevel error -y -sseof -1 -i "$ANT" -update 1 -frames:v 1 "$PRIMER"
  fi

  # El ÚLTIMO ESLABÓN DE LA CADENA cierra contra el cuadro de salida, que es lo que hace
  # que el juego vuelva exactamente donde el clip real retoma. Y es el último de la
  # cadena, no el último que se genera hoy: clavarle los dos extremos a un segmento del
  # medio le saca el lugar para contar la parada.
  ULTIMO=""
  [ "$n" -eq "$LARGO_CADENA" ] && ULTIMO="$SALIDA"

  echo "== segmento $NN de $HASTA: ${SEGUNDOS}s desde $(basename "$PRIMER")${ULTIMO:+, cerrando contra $(basename "$ULTIMO")} =="

  python3 - "$PRIMER" "$TMP/cuerpo.json" "$PROMPT" "$SEGUNDOS" "$ULTIMO" <<'PY'
import base64, json, sys
primero, salida, prompt, segundos, ultimo = sys.argv[1:6]
def b64(ruta):
    with open(ruta, 'rb') as f:
        return base64.b64encode(f.read()).decode()
inst = {"prompt": prompt, "image": {"bytesBase64Encoded": b64(primero), "mimeType": "image/png"}}
if ultimo:
    inst["lastFrame"] = {"bytesBase64Encoded": b64(ultimo), "mimeType": "image/png"}
json.dump({"instances": [inst],
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
echo "MIRALO ANTES DE SEGUIR. Lo que hay que ver no es que el video exista: es si se lee"
echo "como el MISMO partido -- la misma cancha, la misma gente, la misma luz -- y si no"
echo "aparecieron marcas ni escudos en la ropa, que en material generado es nuevo."
