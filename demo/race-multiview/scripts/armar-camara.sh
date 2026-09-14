#!/usr/bin/env bash
# armar-camara.sh -- los ocho clips de una camara en orden, emparejados de nivel, en un solo
# archivo. Sale <camara>.mp4, 64,000 s exactos.
#
# ----------------------------------------------------------------------------------------
# EL CONCAT ES PLANO Y NO DESCARTA NINGUN CUADRO
# ----------------------------------------------------------------------------------------
# Es la misma razon que en `armar-programa.sh`: la cadena de la fase 08 tira el cuadro 0 de
# cada eslabon porque ahi la cadena esta SEMBRADA, y aca no hay siembra. Entran los 192
# cuadros de cada clip: 8 x 192 = 1536 cuadros a 24 fps = 64,000 s exactos, que es
# EXACTAMENTE lo que dura la ventana de la oferta. Una vista mas corta que su ventana deja
# la caja vacia antes del final -- lo que le pasa a Sintel en la demo de la fase 11 --, y
# aca el material se produce, asi que se produce del largo correcto.
#
# Y NADA DE FUNDIDOS. Una camara de a bordo real corta entre angulos; un fundido encadenado
# es ademas el modo de falla que este proyecto describe como "el que mas cuesta ver".
#
# ----------------------------------------------------------------------------------------
# EL NIVEL: ACA SE EMPAREJA Y ADEMAS SE FIJA EL DESTINO, Y LAS DOS COSAS SON DISTINTAS
# ----------------------------------------------------------------------------------------
# EMPAREJAR entre clips es lo mismo que hace el programa y por la misma razon: los ocho
# vuelven de Veo con niveles que no eligio nadie -- medidos, de -26,1 a -10,3 LUFS, o sea
# 15,8 LU, con el clip de la rueda picando a +0,1 dBFS, o sea recortando -- y pegados asi el
# feed sube y baja de escalon en cada corte. Se empareja con una GANANCIA POR CLIP y no con
# un normalizador dinamico: la ganancia mueve el clip entero y le deja la dinamica de
# adentro intacta, que es lo que hace que un auto que acelera siga sonando como un auto que
# acelera.
#
# EL DESTINO ES -23,0 LUFS Y NO ES UN GUSTO: es lo que mide `programa.mp4`, y el numero
# importa por el ADR 0026. El foco de audio le da volumen 1 al feed agrandado y 0 a todos
# los demas, asi que agrandar esta camara CALLA la transmision y deja al espectador adentro
# del auto. Si el feed estuviera mas fuerte o mas flojo que el programa, ese momento -- que
# es el beat de audio de la demo -- seria un salto de volumen. Con los dos a -23 el cambio
# es de contenido y no de nivel. La referencia se mide en la corrida y se imprime al lado,
# en vez de confiar en que sigue valiendo.
#
# Uso:  ./armar-camara.sh [caldrix]
set -euo pipefail
cd "$(dirname "$0")"

CAMARA=${1:-caldrix}
DEMO=$(cd .. && pwd)
CLIPS="$DEMO/content/.fuentes/camaras/$CAMARA"
AUDIO="$DEMO/audio"
SALIDA="$DEMO/content/.fuentes/$CAMARA.mp4"
PROGRAMA="$DEMO/content/.fuentes/programa.mp4"

CLIPDURA=$(node -e 'process.stdout.write(String(require("'"$DEMO"'/race.json").clipDura))')
FPS=$(node -e 'process.stdout.write(String(require("'"$DEMO"'/race.json").fps))')
VENTANA=$(node -e 'process.stdout.write(String(require("'"$DEMO"'/race.json").ofertaDura))')
ESPERADOS_CLIPS=$(( VENTANA / CLIPDURA ))

T=$(mktemp -d "/dev/shm/armar-camara-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT

mapfile -t ORDEN < <(ls "$CLIPS"/*.mp4 | sort)
[ ${#ORDEN[@]} -eq "$ESPERADOS_CLIPS" ] || {
  echo "esperaba $ESPERADOS_CLIPS clips en $CLIPS (ofertaDura/clipDura de race.json) y hay ${#ORDEN[@]}" >&2
  exit 1; }

echo "### 1. cada clip mide lo que tiene que medir"
CUADROS_TOTAL=0
for f in "${ORDEN[@]}"; do
  n=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$f")
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  printf '  %-34s %s cuadros  %s s\n' "$(basename "$f" .mp4)" "$n" "$d"
  CUADROS_TOTAL=$((CUADROS_TOTAL + n))
done
ESPERADOS=$(( ESPERADOS_CLIPS * CLIPDURA * FPS ))
echo "  total $CUADROS_TOTAL cuadros, esperados $ESPERADOS"
[ "$CUADROS_TOTAL" -eq "$ESPERADOS" ] || { echo "un clip no salio de $CLIPDURA s: el concat no va a dar $VENTANA s" >&2; exit 1; }

# EL DESTINO SE LEE DEL PROGRAMA Y NO SE TIPEA. Si el programa cambia de nivel, esta camara
# lo sigue sola; un numero tipeado aca se despegaria el dia que alguien rehaga la mezcla.
DESTINO=$(ffmpeg -hide_banner -nostats -i "$PROGRAMA" -vn -af ebur128 -f null - 2>&1 \
  | sed -n '/Summary:/,$p' | awk '/^ *I: /{print $2}')
echo
echo "### 2. el destino sale de programa.mp4, medido ahora: $DESTINO LUFS"

echo
echo "### 3. el audio de cada clip: antes y despues de emparejar"
printf '  %-34s %8s %8s %8s %8s\n' clip I_antes pico_antes ganancia I_despues
: > "$T/lista.txt"; : > "$T/crudo.txt"
for f in "${ORDEN[@]}"; do
  n=$(basename "$f" .mp4)
  # Exactamente clipDura segundos de audio: el AAC de un mp4 termina unos milisegundos
  # despues del video, y ocho veces ese sobrante son cuadros de desfasaje al final.
  ffmpeg -hide_banner -loglevel error -y -i "$f" -vn -ac 2 -ar 48000 \
    -af "apad=whole_dur=$CLIPDURA,atrim=end=$CLIPDURA,asetpts=N/SR/TB" -c:a pcm_s16le "$T/crudo-$n.wav"
  LEE=$(ffmpeg -hide_banner -nostats -i "$T/crudo-$n.wav" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary:/,$p')
  I=$(echo "$LEE" | awk '/^ *I: /{print $2}')
  P=$(echo "$LEE" | awk '/^ *Peak: /{print $2}')
  G=$(awk -v d="$DESTINO" -v i="$I" 'BEGIN{printf "%.2f", d - i}')
  ffmpeg -hide_banner -loglevel error -y -i "$T/crudo-$n.wav" -af "volume=${G}dB" \
    -c:a pcm_s16le -ar 48000 -ac 2 "$T/amb-$n.wav"
  I2=$(ffmpeg -hide_banner -nostats -i "$T/amb-$n.wav" -af ebur128 -f null - 2>&1 | sed -n '/Summary:/,$p' | awk '/^ *I: /{print $2}')
  printf '  %-34s %8s %8s %8s %8s\n' "$n" "$I" "$P" "$G" "$I2"
  echo "file '$T/amb-$n.wav'" >> "$T/lista.txt"
  echo "file '$T/crudo-$n.wav'" >> "$T/crudo.txt"
done

ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$T/lista.txt" \
  -af "atrim=end=$VENTANA,asetpts=N/SR/TB" -c:a pcm_s16le -ar 48000 -ac 2 "$T/audio.wav"
# Y EL MISMO AUDIO SIN EMPAREJAR, que es la referencia contra la que se lee el de arriba.
# Sin el, "los ocho quedaron parejos" no tiene con que compararse.
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$T/crudo.txt" \
  -af "atrim=end=$VENTANA,asetpts=N/SR/TB" -c:a pcm_s16le -ar 48000 -ac 2 "$T/audio-sin-emparejar.wav"

echo
echo "### 4. el video: concat plano, sin fundidos, sin descartar cuadros"
FILTRO=""; ETIQUETAS=""
for i in "${!ORDEN[@]}"; do
  FILTRO+="[$i:v]setpts=PTS-STARTPTS[e$i];"
  ETIQUETAS+="[e$i]"
done
FILTRO+="${ETIQUETAS}concat=n=${#ORDEN[@]}:v=1:a=0,fps=$FPS,setsar=1[v]"
ENTRADAS=(); for f in "${ORDEN[@]}"; do ENTRADAS+=(-i "$f"); done
ffmpeg -hide_banner -loglevel error -y "${ENTRADAS[@]}" -filter_complex "$FILTRO" \
  -map "[v]" -an -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r "$FPS" "$T/video.mp4"

ffmpeg -hide_banner -loglevel error -y -i "$T/video.mp4" -i "$T/audio.wav" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "$SALIDA"
# Lo que sobrevive a un clon: el .mp4 y los clips estan gitignoreados, asi que el audio
# mezclado se guarda aparte, igual que programa.m4a. Es tambien lo que el empaquetado de la
# T-06 va a necesitar, porque toma el audio por argumento.
ffmpeg -hide_banner -loglevel error -y -i "$T/audio.wav" -c:a aac -b:a 128k "$AUDIO/$CAMARA.m4a"

echo
echo "### 5. lo que salio"
printf '  %-22s %s\n' archivo "$SALIDA"
V=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames,r_frame_rate,width,height -of csv=p=0 "$SALIDA")
printf '  %-22s %s\n' video "$V"
printf '  %-22s %s s\n' duracion "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SALIDA")"
echo
echo "  el nivel, contra su referencia -- el de arriba es el que se pego, el de abajo el que"
echo "  habria salido sin emparejar, y el programa es el destino:"
for a in "$SALIDA" "$T/audio-sin-emparejar.wav" "$PROGRAMA"; do
  L=$(ffmpeg -hide_banner -nostats -i "$a" -vn -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary:/,$p' | /usr/bin/grep -E "^ +(I|LRA|Peak):" | tr -s ' \n' ' ')
  printf '  %-30s %s\n' "$(basename "$a")" "$L"
done
