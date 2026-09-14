#!/usr/bin/env bash
# generar-sondeo.sh -- las dos generaciones del sondeo de la T-02, y nada mas.
#
# POR QUE VIVE ACA Y NO EN demo/race-multiview/scripts/. El ADR 0061 manda que la receta
# de generacion viva con el generador, y la del programa va a vivir ahi cuando la escriba
# la T-03. Esto no es el generador del programa: es una sonda de dos clips que existe para
# decidir si ese generador se escribe con este prompt o con otro, y PHASE.md dice que lo
# que sobrevive a un aborto vive en .project/phases/13-.../tasks/. Ponerlo en la carpeta de
# la demo lo dejaria a mitad de camino entre las dos cosas y colisionaria con la T-03.
#
# EL TOPE ES DURO Y ESTA EN EL CODIGO. La T-02 puede gastar cuatro generaciones. El script
# se niega a pasar de cuatro contando los .mp4 que ya hay en la carpeta de salida, para que
# el tope no dependa de que alguien se acuerde.
#
# LAS DOS TOMAS, Y POR QUE ESTAS DOS. La primera es la casilla 4 del plan -- el aereo con
# los seis autos en fila -- porque es el segundo 28, donde cae el anuncio, y el resto de la
# fase la da por supuesta. La segunda es la casilla 12 -- la rueda trasera de RUNTAK sobre
# un piano -- porque es la que mas probabilidad tiene de salir mal: es el color mas oscuro
# de los seis (#5B223C, el de menor luminancia) en el encuadre donde menos carroceria hay,
# o sea el caso mas debil para identificar al auto por su color, que es la unica cosa que
# hace que una fila del selector signifique algo.
#
# DOS LINEAS DEL PLAN NO SE OBEDECEN, Y ESTA DICHO EN EL INFORME:
#
#   1. El plan de tomas escribe la casilla 4 sin nombrar los seis colores. Con la linea tal
#      cual, Veo elige seis colores suyos y el clip no puede medir lo que el sondeo existe
#      para medir. Van nombrados, en orden de carrera.
#   2. Donde el plan dice "YELLOW-GREEN" y "LIGHT VIOLET" van las palabras corregidas de la
#      T-01 -- BRIGHT APPLE GREEN y BRIGHT ELECTRIC PURPLE. La T-01 midio que
#      "vivid yellow-green" volvia amarillo y chocaba con CALDRIX a dE00 6,9, y las cambio;
#      el plan de tomas quedo con las viejas. Gastar una generacion en redescubrir un
#      defecto ya medido no es probar el prompt.
#
# EL AUDIO SE PIDE EXPLICITO. `generateAudio: true` va escrito aunque sea el default, porque
# el clip sin audio cuesta US$0,08/s en vez de US$0,10/s y la diferencia entre los dos techos
# de la fase no puede depender de un default.
#
# Cada clip queda en demo/race-multiview/content/.fuentes/sondeo/ y no se regenera si ya
# esta, asi que volver a correrlo no gasta.
set -euo pipefail
cd "$(dirname "$0")/../../../../../.."   # raiz del repo

CUAL=${1:?cual toma: a (casilla 4, el aereo) o b (casilla 12, la rueda de RUNTAK)}
MODELO=${VEO_MODELO:-veo-3.1-fast-generate-001}
REGION=us-central1
SEGUNDOS=8
TOPE=4

DEST=demo/race-multiview/content/.fuentes/sondeo
mkdir -p "$DEST"

YA=$(find "$DEST" -maxdepth 1 -name '*.mp4' | wc -l)
[ "$YA" -lt "$TOPE" ] || { echo "TOPE: ya hay $YA generaciones en $DEST y el tope de la T-02 es $TOPE" >&2; exit 2; }

# El parrafo del mundo, copiado LETRA POR LETRA de
# .project/phases/13-.../tasks/T-01-el-mundo-y-los-autos/el-mundo-y-los-seis-autos.md §1.
# Va al frente de los dos prompts identico: es lo unico que hace que dos piezas generadas
# por separado se lean como la misma carrera, y es justo lo que este sondeo mide.
MUNDO='WORLD (identical in every shot of this race): a fictional single-seater championship racing on a wide, flat coastal circuit. Late afternoon under a high, even overcast: soft flat light, no sun, no hard shadows, no lens flare. Dry mid-grey asphalt, wide kerbs painted in alternating white and red blocks at the corners, plain white edge lines. Beyond the barriers: low green coastal scrub, grey concrete walls faced with boards painted in wide diagonal bands of white and slate grey, and one distant grey grandstand with a sparse crowd. A flat grey sea on the horizon under a pale sky. Daylight throughout: no rain, no night, no floodlights. The cars are contemporary open-cockpit single-seaters with exposed wheels, each painted one flat dominant colour with a single accent stripe running from the nose to the tail; the bodywork carries nothing else, and there is no number, no lettering, no logo and no sponsor marking anywhere on the car, on the driver'"'"'s helmet or on the team clothing. SOUND: engines, tyres scrubbing on asphalt, wind over the camera, and a distant crowd. No speech, no commentary, no music.'

case "$CUAL" in
  a)
    NOMBRE=a-casilla-04-aereo-los-seis
    TOMA='SHOT: High wide aerial shot looking down the main straight: the six cars strung out one behind the other, the grandstand on one side and the grey sea on the other. The camera drifts slowly forward. In running order from the front, the six cars are: BRIGHT LEMON YELLOW, then BRIGHT ELECTRIC PURPLE, then BRIGHT AQUAMARINE, then DEEP PLUM MAGENTA, then BRIGHT APPLE GREEN, then DARK BRONZE GOLD. Each car is a single flat colour over its whole body and no two cars share a colour.'
    ;;
  b)
    NOMBRE=b-casilla-12-rueda-runtak
    TOMA='SHOT: Low tracking shot close on the rear wheels of the DEEP PLUM MAGENTA car as it rides a kerb at speed, the camera low and just behind the car, moving along with it.'
    ;;
  c)
    # LA CORRECCION, Y SE CAMBIAN DOS COSAS Y NO CINCO. La toma `a` fallo en dos frentes a la
    # vez: volvio una camara baja de persecucion en vez del aereo, y de los seis colores
    # pedidos volvieron cinco con un cyan repetido. Esta generacion cambia SOLO lo que se
    # puede atribuir a la redaccion, y deja todo lo demas letra por letra igual:
    #
    #   1. LA CLASE DE TOMA VA PRIMERA Y EN TERMINOS DE CAMARA, no ultima y en terminos de
    #      composicion. En `a` la frase "High wide aerial shot" entraba despues de 190
    #      palabras de mundo y el modelo la ignoro entera.
    #
    #      NOTA DE FIDELIDAD: el prompt que se ENVIO decia "bird\\'s-eye view" con una barra
    #      invertida delante del apostrofo, por un escape de mas al escribir este `case`. El
    #      texto exacto que viajo esta en el .prompt.txt al lado del clip. La frase quedo
    #      sacada aca para que una nueva corrida no mande otra cosa que la que se midio; es
    #      un defecto de tipeo y no cambia la clase de toma, que el resto del parrafo repite
    #      tres veces.
    #   2. LOS SEIS AUTOS SON UNA LISTA NUMERADA Y NO UNA ENUMERACION EN PROSA, con la
    #      posicion de cada uno en la fila, y con la regla de unicidad pegada a la lista.
    #
    # LAS PALABRAS DE COLOR NO SE TOCAN. Son las de la T-01, medidas y corregidas alla, y
    # cambiarlas aca mezclaria dos experimentos: si la lista numerada arregla el reparto, hay
    # que poder decir que lo arreglo la lista.
    NOMBRE=c-casilla-04-correccion-aereo-y-lista
    TOMA='SHOT TYPE: aerial drone shot. The camera is a drone flying high above the circuit, at least sixty metres up, looking steeply down at the track. This is a view from the air: no part of the shot is at track level. The drone drifts slowly forward along the main straight.
WHAT IS IN FRAME: six racing cars, seen from above, strung out one behind the other down the straight with clear gaps between them, the grandstand along one side and the grey sea on the other.
THE SIX CARS, in running order from the front, each a single flat colour over its whole body:
1st: BRIGHT LEMON YELLOW
2nd: BRIGHT ELECTRIC PURPLE
3rd: BRIGHT AQUAMARINE
4th: DEEP PLUM MAGENTA
5th: BRIGHT APPLE GREEN
6th: DARK BRONZE GOLD
All six colours are different from one another. No two cars in the frame are the same colour, and no colour is repeated anywhere.'
    ;;
  d)
    # LA CUARTA Y ULTIMA, Y NO ES UNA TOMA DEL PROGRAMA: ES UN DIAGNOSTICO.
    #
    # Tres generaciones seguidas pidieron una toma aerea y las tres volvieron con la camara a
    # la altura de la pista. En la `c` la instruccion estaba dicha tres veces y primera. Con
    # eso quedan dos explicaciones y son incompatibles, y la diferencia entre las dos cambia
    # el plan de tomas: o el parrafo del mundo -- 190 palabras que describen un punto de
    # vista de nivel de pista, con vallas, kerbs y publico -- se come la instruccion de
    # camara, o este modelo no entrega un cenital y hay que sacar las dos casillas aereas del
    # plan (la 4 y la 11).
    #
    # POR ESO ESTE PROMPT NO LLEVA EL PARRAFO DEL MUNDO, y el clip que salga NO SIRVE para el
    # programa: es a proposito. Aislar la variable es lo unico que separa las dos
    # explicaciones, y un cuarto clip que repita las cinco variables juntas no separa nada.
    NOMBRE=d-diagnostico-solo-la-camara-aerea
    SIN_MUNDO=1
    TOMA='Aerial drone footage. The camera is a drone hovering one hundred metres above a race circuit, pointing straight down at the ground. Top-down overhead view: six single-seater racing cars drive along a straight far below, seen from directly above, small in the frame. The drone holds its altitude and does not descend. Flat overcast daylight.'
    ;;
  *) echo "toma desconocida: $CUAL" >&2; exit 1;;
esac

SALIDA="$DEST/$NOMBRE.mp4"
[ -s "$SALIDA" ] && { echo "== $NOMBRE: ya esta, no se regenera =="; exit 0; }

# La toma `d` va SOLA, sin el parrafo del mundo, y eso es el experimento y no un descuido:
# lo que mide es si el parrafo se come la instruccion de camara.
if [ "${SIN_MUNDO:-0}" = 1 ]; then PROMPT="$TOMA"; else PROMPT="$MUNDO

$TOMA"; fi

command -v gcloud >/dev/null || { echo "falta gcloud" >&2; exit 1; }
TOKEN=$(gcloud auth print-access-token 2>/dev/null) || { echo "sin credenciales: gcloud auth login" >&2; exit 1; }
PROYECTO=$(gcloud config get-value project 2>/dev/null | tr -d '[:space:]')
BASE="https://$REGION-aiplatform.googleapis.com/v1/projects/$PROYECTO/locations/$REGION/publishers/google/models/$MODELO"

TMP=$(mktemp -d "/dev/shm/sondeo-$CUAL-XXXXXX")
trap 'rm -rf "$TMP"' EXIT

# El prompt queda escrito al lado del clip: sin eso, el clip es un mp4 del que nadie sabe
# que se le pidio, y todo el sondeo es comparar lo que volvio contra lo que se pidio.
printf '%s\n' "$PROMPT" > "$DEST/$NOMBRE.prompt.txt"

python3 - "$TMP/cuerpo.json" "$PROMPT" "$SEGUNDOS" <<'PY'
import json, sys
salida, prompt, segundos = sys.argv[1:4]
json.dump({"instances": [{"prompt": prompt}],
           "parameters": {"aspectRatio": "16:9", "sampleCount": 1,
                          "durationSeconds": int(segundos), "resolution": "720p",
                          "generateAudio": True}},
          open(salida, 'w'))
PY

echo "== $NOMBRE: ${SEGUNDOS}s, $MODELO, 720p, con audio =="
OP=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d @"$TMP/cuerpo.json" "$BASE:predictLongRunning" \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("name") or "ERROR:"+json.dumps(d)[:600])')
case "$OP" in ERROR:*) echo "${OP#ERROR:}" >&2; exit 1;; esac
echo "  operacion $OP"

for _ in $(seq 1 40); do
  sleep 15
  curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"operationName\":\"$OP\"}" "$BASE:fetchPredictOperation" > "$TMP/estado.json"
  python3 -c 'import json,sys; sys.exit(0 if json.load(open(sys.argv[1])).get("done") else 1)' "$TMP/estado.json" && break
  echo "  generando ..."
done

python3 - "$TMP/estado.json" "$SALIDA" <<'PY'
import base64, json, sys
e = json.load(open(sys.argv[1]))
if not e.get("done"): sys.exit("no termino en diez minutos")
if "error" in e: sys.exit(f"Vertex devolvio un error: {e['error']}")
v = (e.get("response") or {}).get("videos") or []
if not v: sys.exit(f"termino sin video: {json.dumps(e)[:600]}")
d = v[0].get("bytesBase64Encoded")
if not d: sys.exit(f"vino por URI: {v[0].get('gcsUri','(sin uri)')}")
open(sys.argv[2], "wb").write(base64.b64decode(d))
PY

echo "  $SALIDA  ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SALIDA")s, $(du -h "$SALIDA" | cut -f1))"
