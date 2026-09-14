#!/usr/bin/env bash
# generar-relato.sh -- las diecinueve lineas de los dos relatores, una por archivo.
#
# EL MOLDE ES demo/hydration-break/audio/ Y ESTO LO COPIA ENTERO. Mismo sintetizador
# (gemini-2.5-flash-tts), mismo en-GB, las mismas dos voces repartidas POR FUNCION y no
# por turnos -- Charon relata lo que pasa, Kore comenta por que --, una linea un archivo,
# y el porton de transcripcion sobre cada una. Lo unico que cambia es el texto.
#
# ----------------------------------------------------------------------------------------
# POR QUE UNA LINEA ES UN ARCHIVO, que es la decision que mas se nota
# ----------------------------------------------------------------------------------------
#   1. EL NIVEL. Kore sale unos 3 dB mas fuerte que Charon, y en una conversacion eso no se
#      lee como enfasis: se lee como que una esta mas cerca del microfono. Con un archivo
#      por linea se empareja con una GANANCIA POR LINEA, que mueve la linea entera y le
#      deja la dinamica de adentro intacta -- a diferencia de un normalizador, que aplasta.
#   2. EL PORTON. Una falla del sintetizador se arregla regenerando ESA linea y no las
#      diecinueve.
#   3. LOS TIEMPOS. La linea del anuncio tiene que TERMINAR en un instante que sale de
#      race.json; eso se hace corriendo un archivo sobre la linea de tiempo, no cortando
#      una pista larga.
#
# ----------------------------------------------------------------------------------------
# EL PORTON, Y POR QUE NO ALCANZA CON MIRAR LA DURACION
# ----------------------------------------------------------------------------------------
# El sintetizador tiene dos fallas intermitentes: LEE EL PROMPT DE ESTILO EN VOZ ALTA y
# REPITE UNA FRASE. Las dos son invisibles en el archivo y audibles al primer segundo. Por
# eso cada linea se transcribe con gemini-2.5-flash y la transcripcion pasa por
# relato/porton.mjs antes de que el .wav exista en audio/lineas/.
#
# La falla es intermitente, asi que el mismo pedido sale bien al segundo intento: por eso
# hay reintentos y no un abort.
#
# COMO SE LO VE FALLAR:  ./generar-relato.sh --control
# Sintetiza una linea plantada que le mete el prompt de estilo adentro del texto y exige
# que el porton la RECHACE. Si la deja pasar, el chequeo no es un chequeo y el script sale
# distinto de cero.
#
# ----------------------------------------------------------------------------------------
# LOS NOMBRES VIAJAN COMO SE ESCRIBEN, y eso se verifico en vez de suponerse
# ----------------------------------------------------------------------------------------
# La demo del partido necesita mandarle "Norvick" al sintetizador aunque el equipo se llame
# "Norvik", porque con la v sola esta voz lo convierte en Norwich, que es un club ingles de
# verdad. Aca NO hace falta ninguna sustitucion: los seis nombres se eligieron entre
# veintidos midiendo como los dice ESTA voz (T-01, control-como-suena-cada-nombre.txt), y
# los seis vuelven como se escriben. Es un resultado y no una omision.
#
# Uso:
#   ./generar-relato.sh              todas las lineas que falten en audio/lineas/
#   ./generar-relato.sh 04 07        solo esas, regenerandolas
#   ./generar-relato.sh --control    el control del porton, no genera nada del guion
set -euo pipefail
cd "$(dirname "$0")"

DEMO=$(cd .. && pwd)
# LO QUE QUEDA ES .m4a Y NO .wav, Y NO ES UN DETALLE DE FORMATO. audio/ va al repositorio
# -- es la decision de TASKS.md, "son cientos de kilobytes, no video" -- y diecinueve
# lineas en PCM son 7,6 MB contra 1. Los .wav intermedios viven en content/.fuentes/, que
# esta gitignoreado, por la misma razon por la que viven ahi los clips crudos.
SALIDA="$DEMO/audio/lineas"
TSV="$DEMO/audio/transcripciones.tsv"
INTENTOS=4
DESTINO=-20.0            # LUFS por linea, igual que el molde

# El recorte es el del molde: saca el silencio de los dos extremos y deja 60 ms de aire
# adelante y 60 atras. Sin esto, el sintetizador entrega medio segundo de silencio por
# punta y los turnos de la conversacion se separan sin que nadie lo haya decidido.
RECORTE="silenceremove=start_periods=1:start_threshold=-45dB:start_duration=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_duration=0.05,areverse,adelay=60|60,apad=pad_dur=0.06"

PROYECTO=$(gcloud config get-value project 2>/dev/null | tr -d '[:space:]')
TOKEN=$(gcloud auth print-access-token)
TTS=https://texttospeech.googleapis.com/v1beta1/text:synthesize
FLASH="https://us-central1-aiplatform.googleapis.com/v1/projects/$PROYECTO/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent"

T=$(mktemp -d "/dev/shm/relato-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT
mkdir -p "$SALIDA"

# --- sintetiza un texto con una voz y deja el .wav recortado en $T/<slot>.wav ----------
sintetizar() {  # $1 slot  $2 voz(Charon|Kore)  $3 estilo  $4 texto
  python3 - "$3" "$4" "$2" "$T/cuerpo-$1.json" <<'PY'
import json, sys
json.dump({"input": {"prompt": sys.argv[1], "text": sys.argv[2]},
           "voice": {"languageCode": "en-GB", "name": sys.argv[3],
                     "modelName": "gemini-2.5-flash-tts"},
           "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": 48000}},
          open(sys.argv[4], "w"))
PY
  curl -s -o "$T/resp-$1.json" -X POST -H "Authorization: Bearer $TOKEN" \
       -H 'Content-Type: application/json' -d @"$T/cuerpo-$1.json" "$TTS"
  python3 - "$T/resp-$1.json" "$T/crudo-$1.wav" <<'PY'
import base64, json, sys
d = json.load(open(sys.argv[1]))
if "audioContent" not in d:
    print("la API no devolvio audio:", json.dumps(d)[:300], file=sys.stderr); sys.exit(1)
open(sys.argv[2], "wb").write(base64.b64decode(d["audioContent"]))
PY
  ffmpeg -hide_banner -loglevel error -y -i "$T/crudo-$1.wav" -af "$RECORTE" \
         -c:a pcm_s16le -ar 48000 "$T/$1.wav"
}

# --- transcribe $T/<slot>.wav y deja la respuesta en $T/tr-<slot>.json ------------------
transcribir() {  # $1 slot
  python3 - "$T/$1.wav" "$T/pedido-$1.json" <<'PY'
import base64, json, sys
p = ("Transcribe this audio verbatim. Write the transcript on the first line and nothing "
     "else: no preamble, no quotation marks, no commentary. If a phrase is spoken twice, "
     "write it twice.")
json.dump({"contents": [{"role": "user", "parts": [
    {"text": p},
    {"inlineData": {"mimeType": "audio/wav",
                    "data": base64.b64encode(open(sys.argv[1], "rb").read()).decode()}}]}],
    "generationConfig": {"temperature": 0}}, open(sys.argv[2], "w"))
PY
  curl -s -o "$T/tr-$1.json" -X POST -H "Authorization: Bearer $TOKEN" \
       -H 'Content-Type: application/json' -d @"$T/pedido-$1.json" "$FLASH"
}

# --- EL CONTROL: una linea plantada con el prompt adentro tiene que ser rechazada -------
if [ "${1:-}" = "--control" ]; then
  echo "CONTROL DEL PORTON -- una linea con el prompt de estilo metido en el texto"
  echo
  ESTILO=$(cat relato/estilo-R.txt)
  # El texto de la linea 04 del guion con el prompt pegado adelante, que es exactamente lo
  # que se oye cuando el sintetizador lee la instruccion en vez de obedecerla.
  PLANTADA="$ESTILO The cameras on all six cars are open."
  echo "se le pide:  $PLANTADA"
  sintetizar plantada Charon "$ESTILO" "$PLANTADA"
  transcribir plantada
  printf 'duracion:    %s s\n' "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$T/plantada.wav")"
  printf 'veredicto:   '
  if node relato/porton.mjs "$T/tr-plantada.json" 04; then
    echo
    echo "ROJO AL REVES: el porton DEJO PASAR la linea plantada. No es un chequeo."
    exit 1
  fi
  echo
  echo "El porton la rechazo, que es lo que este control tiene que ver."
  exit 0
fi

# --- las lineas -------------------------------------------------------------------------
IDS=("$@")
if [ ${#IDS[@]} -eq 0 ]; then
  mapfile -t IDS < <(node -e '
    const g = JSON.parse(require("fs").readFileSync("relato/guion.json","utf8"));
    for (const l of g) if (!require("fs").existsSync(`'"$SALIDA"'/linea-${l.id}.m4a`)) console.log(l.id);
  ')
fi
[ ${#IDS[@]} -gt 0 ] || { echo "no falta ninguna linea en $SALIDA"; exit 0; }

[ -f "$TSV" ] || printf 'id\tvoz\tintento\tdur_s\tganancia_dB\tdicho\n' > "$TSV"

FALLARON=()
for id in "${IDS[@]}"; do
  VOZ=$(node -e 'const g=JSON.parse(require("fs").readFileSync("relato/guion.json","utf8"));process.stdout.write(g.find(l=>l.id==="'"$id"'").voz)')
  TEXTO=$(node -e 'const g=JSON.parse(require("fs").readFileSync("relato/guion.json","utf8"));process.stdout.write(g.find(l=>l.id==="'"$id"'").texto)')
  case "$VOZ" in R) NOMBRE=Charon; ESTILO=$(cat relato/estilo-R.txt);;
                 C) NOMBRE=Kore;   ESTILO=$(cat relato/estilo-C.txt);; esac
  PASO=no
  for n in $(seq 1 "$INTENTOS"); do
    sintetizar "$id" "$NOMBRE" "$ESTILO" "$TEXTO"
    transcribir "$id"
    DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$T/$id.wav")
    if VEREDICTO=$(node relato/porton.mjs "$T/tr-$id.json" "$id"); then
      # El nivel se empareja recien cuando la linea paso el porton: nivelar un descarte es
      # trabajo tirado, y dejarlo en el TSV seria evidencia de algo que no entro.
      I=$(ffmpeg -hide_banner -nostats -i "$T/$id.wav" -af ebur128=framelog=quiet -f null - 2>&1 | awk '/^ *I: /{print $2}')
      G=$(awk -v d="$DESTINO" -v i="$I" 'BEGIN { printf "%.2f", d - i }')
      ffmpeg -hide_banner -loglevel error -y -i "$T/$id.wav" -af "volume=${G}dB" \
             -c:a aac -b:a 96k -ac 1 -ar 48000 "$SALIDA/linea-$id.m4a"
      printf '%s %s  intento %s  %5.2fs  %+6s dB  %s\n' "$id" "$VOZ" "$n" "$DUR" "$G" "$VEREDICTO"
      printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$id" "$VOZ" "$n" "$DUR" "$G" "${VEREDICTO#bien }" >> "$TSV"
      PASO=si; break
    fi
    printf '%s %s  intento %s  %5.2fs  %s\n' "$id" "$VOZ" "$n" "$DUR" "$VEREDICTO"
  done
  [ "$PASO" = si ] || FALLARON+=("$id")
done

if [ ${#FALLARON[@]} -gt 0 ]; then
  echo
  echo "NO PASARON en $INTENTOS intentos: ${FALLARON[*]}"
  echo "Una linea que falla los cuatro intentos se REESCRIBE, no se reintenta una quinta vez:"
  echo "es lo que le paso a la demo del partido y lo que resolvio fue cambiar el texto."
  exit 1
fi
