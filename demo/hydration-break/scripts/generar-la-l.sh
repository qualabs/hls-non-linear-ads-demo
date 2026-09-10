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
#
# TRES ENUNCIADOS QUE LA PRIMERA VERSIÓN NO TENÍA, y cada uno arregla un defecto medido
# de la primera generación:
#
# 1. DÓNDE VIVE EL ZAPATO. El prompt viejo hablaba de la cámara y nunca decía dónde
#    tenía que estar el producto, así que el zapato se fue al centro del cuadro --que es
#    donde un producto se pone-- y ahí el partido lo tapa: medido, la región que el
#    partido cubre se aclaró un 87 %. Ahora dice el cuarto inferior izquierdo, que es
#    donde el layout lo pone.
#
# 2. QUÉ HAY DEBAJO, en lugar de prohibir un piso. Decía "no floor, no horizon, no props
#    and no set": cuatro prohibiciones seguidas y nada que dibujar en su lugar, y el
#    modelo llenó el hueco con un piso de estudio con sombra proyectada. La banda
#    inferior subió de 30,2 a 65,9 de luz media. Es la misma lección que ya está escrita
#    en `generar-parada.sh` --"liso" es una prohibición con otras palabras-- aplicada
#    donde faltaba.
#
# 6. NO PEDIRLE QUE FLOTE Y DESPUES PEDIRLE QUE NO SE MUEVA. El prompt abría con
#    "floats in the air ... as if suspended" y tres párrafos después le pedía que se
#    quedara quieto en su cuarto. Flotar ES irse: el tercer intento salió sin
#    resplandor, sin piso y moviéndose bien, pero el zapato subía y a la mitad del clip
#    estaba detrás del partido. Ahora gira en el lugar, sobre una plataforma giratoria
#    invisible: el movimiento tiene de dónde salir sin que el producto se desplace.
#
# 4. QUE EL FONDO NO SE PRENDA. El segundo intento salió sin piso y con el zapato en su
#    cuarto, pero "a single faint warm amber glow behind the shoe" volvió como un
#    resplandor naranja que inundó la banda inferior: medido, la esquina donde vive el
#    zapato pasó de 57,2 a 79,6 de luz media a lo largo del clip. Pedir un resplandor
#    "tenue" es pedir un resplandor, y el modelo elige cuánto. Ahora no hay resplandor
#    que pedir: lo único brillante del cuadro es el zapato y su línea ámbar, y el fondo
#    detrás del producto vale lo mismo que el de las esquinas.
#
# 5. QUE EL ZAPATO NO SE AGRANDE NI SE CORRA. En el mismo intento el zapato subía y se
#    iba a la derecha a lo largo del clip hasta cruzar el borde del partido. Decirle
#    dónde arranca no alcanzaba: hay que decirle que se queda.
#
# 3. QUE SE NOTE QUE ES UN VIDEO. "Turns very slowly" puede salir tan sutil que en
#    dieciséis segundos parezca una foto, y un movimiento correcto pero imperceptible es
#    un fracaso igual. Ahora pide un cuarto de vuelta a lo largo del clip, que es un
#    movimiento que se ve sin buscarlo.
PROMPT='A slow, quiet studio product shot of a charcoal grey knit running shoe.
THE SHOE IS HELD STEADY AND TURNS IN PLACE, as if it were standing on an invisible
turntable: the turntable is what moves, not the shoe. It does not float, it does not
drift and it does not rise.
THE SHOE STAYS IN THE LOWER LEFT QUARTER OF THE FRAME for the whole clip. It never rises
above the middle of the frame and never drifts towards the centre or the right: it hangs
low and to the left, and turns there.
IT TURNS VISIBLY. Over the clip the shoe rotates steadily on its own vertical axis by
about a quarter turn, so that the toe swings and the side of the sole comes into view. It
is unmistakably moving footage and not a still photograph, but the movement is smooth and
unhurried, never fast and never jerky.
BELOW THE SHOE THE DARKNESS SIMPLY CONTINUES. The field fades to pure black towards the
bottom edge of the frame: there is nothing for the shoe to stand on, no surface, no line
where a floor would meet a wall, and no shadow falling on anything. The shoe hangs in
open darkness all the way down.
THE BACKGROUND IS ONE FLAT NEAR BLACK AND STAYS THAT WAY. The darkness right behind the
shoe is the same value as the darkness in the corners of the frame: it does not brighten,
it does not warm up, and it does not spread. THE ONLY BRIGHT THINGS IN THE WHOLE FRAME
ARE THE SHOE ITSELF AND THE THIN AMBER LINE ON ITS MIDSOLE. No pool of light, no glow
behind the product, no coloured wash across the lower part of the frame.
THE SHOE KEEPS ITS SIZE AND ITS PLACE. It does not grow, it does not come closer, and its
centre stays within about a tenth of the frame of where it starts. It stays in the lower
left quarter from the first frame to the last. Soft studio light from the upper
left, unchanged throughout. The camera does not move, pan or zoom. No cuts, no flashes,
no text, no graphics, no captions.
The upper of the shoe is a single flat charcoal knit with the mesh weave visible and no
printed mark of any kind anywhere on it. The only marking on the whole shoe is ONE
continuous amber line running along the midsole, and nothing else at all: no other
printing, no emblem, no symbol, no lettering and no numbers. No brand mark anywhere in
the frame: no swoosh, no three stripes, no leaping cat, no interlocking letters, no crown
and no sponsor name.'

# EL PROMPT SE CHEQUEA ENTERO ANTES DE MANDARLO, y no es celo. Va entre comillas
# simples, así que UN APÓSTROFO ADENTRO cierra la cadena y el resto del texto se
# convierte en comandos de shell. `bash -n` no lo ve, porque las comillas se vuelven a
# balancear más abajo y el archivo queda sintácticamente válido: el síntoma fue un
# `width: command not found` y una generación que no se hizo. Se chequea contra la
# última frase, que es lo que se pierde si la cadena se cortó antes.
case "$PROMPT" in
  *"no sponsor name."*) ;;
  *) echo "el PROMPT se cortó: ¿hay un apóstrofo adentro? no se manda nada" >&2; exit 1;;
esac

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
