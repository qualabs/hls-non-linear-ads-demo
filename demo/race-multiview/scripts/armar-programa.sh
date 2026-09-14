#!/usr/bin/env bash
# armar-programa.sh -- los catorce clips en el orden del plan, con el relato encima y el
# ambiente de los clips debajo. Sale programa.mp4, 112,000 s exactos.
#
# ----------------------------------------------------------------------------------------
# EL CONCAT ES PLANO Y NO DESCARTA NINGUN CUADRO
# ----------------------------------------------------------------------------------------
# La cadena de la fase 08 tira el cuadro 0 de cada eslabon (select=gte(n\,1)) porque ahi la
# cadena esta SEMBRADA: el primer cuadro de un eslabon es la version que el generador hizo
# del ultimo del anterior, o sea el mismo cuadro dos veces. Aca no hay siembra -- las
# catorce casillas son independientes y el corte ES el contenido --, asi que entran los 192
# cuadros de cada una. 14 x 192 = 2688 cuadros a 24 fps = 112,000 s exactos, sin recortar
# nada para que cierre.
#
# Y NADA DE FUNDIDOS. Un corte cada ocho segundos es lo que hace un realizador de carrera;
# un fundido encadenado es ademas el modo de falla que este proyecto describe como "el que
# mas cuesta ver".
#
# ----------------------------------------------------------------------------------------
# EL AMBIENTE SE EMPAREJA CLIP POR CLIP, Y ESE ES EL TRABAJO DE ESTE SCRIPT
# ----------------------------------------------------------------------------------------
# La T-03 midio los catorce: van de -15,3 a -24,8 LUFS, o sea 9,5 LU de dispersion, y la
# casilla 12 pica a -0,9 dBFS. Pegados tal cual, el programa sube y baja de escalon en cada
# corte y siete de las catorce casillas tapan al relator.
#
# Se empareja con una GANANCIA POR CLIP y no con un normalizador dinamico, por la misma
# razon que el molde nivela las voces asi: la ganancia mueve el clip entero y le deja la
# dinamica de adentro intacta. Un auto que pasa tiene que seguir sonando como un auto que
# pasa; lo que se empareja es el escalon entre una casilla y la siguiente, no el adentro de
# cada una.
#
# EL NUMERO, Y POR QUE NO ES EL DEL MOLDE. En la demo del partido la cama de cancha va 12 dB
# debajo de las voces. Aca son 10, y la diferencia esta argumentada: alla el ambiente es una
# tribuna, que es fondo por naturaleza; aca el ambiente ES LA ACCION -- el doppler del auto
# que cruza el cuadro es la mitad de lo que se esta mostrando, y viene sincronizado gratis
# porque el video es generado. Diez decibeles siguen adentro de la banda que la practica de
# transmision acepta para que el relato mande, y dejan al ambiente dos decibeles mas
# presente que una cama de fondo. Cuanto margen quedo de verdad lo mide medir-mezcla.py, que
# es lo unico que decide si el numero sirvio.
#
# Uso:  ./armar-programa.sh
set -euo pipefail
cd "$(dirname "$0")"

DEMO=$(cd .. && pwd)
CLIPS="$DEMO/content/.fuentes/programa"
AUDIO="$DEMO/audio"
# Los .wav intermedios no van al repositorio: audio/ guarda las lineas y la mezcla, que son
# el entregable, y el trabajo pesado vive donde viven los clips crudos.
TRABAJO="$DEMO/content/.fuentes/audio"
mkdir -p "$TRABAJO"
SALIDA="$DEMO/content/.fuentes/programa.mp4"

LARGO=$(node -e 'process.stdout.write(String(require("'"$DEMO"'/race.json").largo))')
CLIPDURA=$(node -e 'process.stdout.write(String(require("'"$DEMO"'/race.json").clipDura))')
FPS=$(node -e 'process.stdout.write(String(require("'"$DEMO"'/race.json").fps))')
LINEAS_LUFS=-20.0          # a lo que generar-relato.sh nivela cada linea
SEPARACION=10.0            # dB que el ambiente queda por debajo de las lineas
AMBIENTE_LUFS=$(awk -v l="$LINEAS_LUFS" -v s="$SEPARACION" 'BEGIN{printf "%.1f", l - s}')

T=$(mktemp -d "/dev/shm/armar-programa-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT

mapfile -t ORDEN < <(ls "$CLIPS"/*.mp4 | sort)
[ ${#ORDEN[@]} -eq 14 ] || { echo "esperaba 14 clips en $CLIPS y hay ${#ORDEN[@]}" >&2; exit 1; }

echo "### 1. cada clip mide lo que tiene que medir"
CUADROS_TOTAL=0
for f in "${ORDEN[@]}"; do
  n=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 "$f")
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  printf '  %-34s %s cuadros  %s s\n' "$(basename "$f" .mp4)" "$n" "$d"
  CUADROS_TOTAL=$((CUADROS_TOTAL + n))
done
ESPERADOS=$(( 14 * CLIPDURA * FPS ))
echo "  total $CUADROS_TOTAL cuadros, esperados $ESPERADOS"
[ "$CUADROS_TOTAL" -eq "$ESPERADOS" ] || { echo "un clip no salio de $CLIPDURA s: el concat no va a dar $LARGO s" >&2; exit 1; }

echo
echo "### 2. el ambiente, clip por clip: antes y despues de emparejar"
printf '  %-34s %8s %8s %8s %8s\n' clip I_antes pico_antes ganancia I_despues
: > "$T/ambiente.txt"
for f in "${ORDEN[@]}"; do
  n=$(basename "$f" .mp4)
  # Exactamente clipDura segundos de audio: el AAC de un mp4 termina unos milisegundos
  # despues del video, y catorce veces ese sobrante son cuadros de desfasaje al final.
  ffmpeg -hide_banner -loglevel error -y -i "$f" -vn -ac 2 -ar 48000 \
    -af "apad=whole_dur=$CLIPDURA,atrim=end=$CLIPDURA,asetpts=N/SR/TB" -c:a pcm_s16le "$T/crudo-$n.wav"
  LEE=$(ffmpeg -hide_banner -nostats -i "$T/crudo-$n.wav" -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary:/,$p')
  I=$(echo "$LEE" | awk '/^ *I: /{print $2}')
  P=$(echo "$LEE" | awk '/^ *Peak: /{print $2}')
  G=$(awk -v d="$AMBIENTE_LUFS" -v i="$I" 'BEGIN{printf "%.2f", d - i}')
  ffmpeg -hide_banner -loglevel error -y -i "$T/crudo-$n.wav" -af "volume=${G}dB" \
    -c:a pcm_s16le -ar 48000 -ac 2 "$T/amb-$n.wav"
  I2=$(ffmpeg -hide_banner -nostats -i "$T/amb-$n.wav" -af ebur128 -f null - 2>&1 | sed -n '/Summary:/,$p' | awk '/^ *I: /{print $2}')
  printf '  %-34s %8s %8s %8s %8s\n' "$n" "$I" "$P" "$G" "$I2"
  echo "file '$T/amb-$n.wav'" >> "$T/ambiente.txt"
done

# El ambiente entero, que es lo que se mezcla y lo que mide medir-mezcla.py.
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$T/ambiente.txt" \
  -af "atrim=end=$LARGO,asetpts=N/SR/TB" -c:a pcm_s16le -ar 48000 -ac 2 "$TRABAJO/ambiente.wav"
# Y el mismo ambiente SIN emparejar, que es la referencia contra la que se lee el de arriba.
# No es un descarte: sin el, "los catorce quedaron parejos" no tiene con que compararse.
: > "$T/crudo.txt"; for f in "${ORDEN[@]}"; do echo "file '$T/crudo-$(basename "$f" .mp4).wav'" >> "$T/crudo.txt"; done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$T/crudo.txt" \
  -af "atrim=end=$LARGO,asetpts=N/SR/TB" -c:a pcm_s16le -ar 48000 -ac 2 "$T/ambiente-sin-emparejar.wav"
cp "$T/ambiente-sin-emparejar.wav" "$TRABAJO/ambiente-sin-emparejar.wav"

echo
echo "### 3. el video: concat plano, sin fundidos, sin descartar cuadros"
FILTRO=""; ETIQUETAS=""
for i in "${!ORDEN[@]}"; do
  FILTRO+="[$i:v]setpts=PTS-STARTPTS[e$i];"
  ETIQUETAS+="[e$i]"
done
FILTRO+="${ETIQUETAS}concat=n=${#ORDEN[@]}:v=1:a=0,fps=$FPS,setsar=1[v]"
ENTRADAS=(); for f in "${ORDEN[@]}"; do ENTRADAS+=(-i "$f"); done
ffmpeg -hide_banner -loglevel error -y "${ENTRADAS[@]}" -filter_complex "$FILTRO" \
  -map "[v]" -an -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r "$FPS" "$T/video.mp4"

echo
echo "### 4. la mezcla: las voces encima, el ambiente debajo"
[ -f "$TRABAJO/relato.wav" ] || { echo "falta $AUDIO/relato.wav -- corre antes armar-relato.mjs" >&2; exit 1; }

# EL RELATO ES MONO Y LA MEZCLA ES ESTEREO, Y PASAR DE UNO AL OTRO NO ES GRATIS. Duplicar
# el canal a los dos lados sube la sonoridad 3 LU medidos: la R128 suma L y R con peso 1,
# asi que una linea nivelada a -20 LUFS en mono entra a la mezcla a -17. Con eso los 10 dB
# de separacion de arriba serian 13 sin que nadie lo hubiera decidido, y el programa entero
# saldria 3 dB mas caliente que la demo del partido. Se compensa con el -3,01 dB de la
# conversion mono->estereo, que es lo que la deja igual. Medido: duplicado -17,2 LUFS,
# compensado -20,2, que es el nivel del archivo mono.
ffmpeg -hide_banner -loglevel error -y -i "$TRABAJO/relato.wav" -i "$TRABAJO/ambiente.wav" \
  -filter_complex "[0:a]pan=stereo|c0=0.7071*c0|c1=0.7071*c0[voz];[voz][1:a]amix=inputs=2:duration=first:normalize=0[out]" \
  -map "[out]" -c:a pcm_s16le -ar 48000 -ac 2 "$T/suma.wav"

# Y UN SOLO PASO DE GANANCIA AL FINAL, para que el programa salga al mismo nivel que las
# otras demos del repositorio: primario.m4a de la demo del partido mide -23,0 LUFS, que es
# ademas el objetivo de la R128. Es una ganancia unica sobre la suma, asi que NO toca la
# relacion entre el relato y el ambiente: los 10 dB que se decidieron arriba quedan.
DESTINO_PROGRAMA=-23.0
IM=$(ffmpeg -hide_banner -nostats -i "$T/suma.wav" -af ebur128 -f null - 2>&1 | sed -n '/Summary:/,$p' | awk '/^ *I: /{print $2}')
GM=$(awk -v d="$DESTINO_PROGRAMA" -v i="$IM" 'BEGIN{printf "%.2f", d - i}')
printf '  suma %s LUFS  ->  ganancia %s dB  ->  destino %s LUFS\n' "$IM" "$GM" "$DESTINO_PROGRAMA"
ffmpeg -hide_banner -loglevel error -y -i "$T/suma.wav" -af "volume=${GM}dB" \
  -c:a pcm_s16le -ar 48000 -ac 2 "$T/mezcla.wav"

ffmpeg -hide_banner -loglevel error -y -i "$T/video.mp4" -i "$T/mezcla.wav" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "$SALIDA"

# Lo que sobrevive a un clon: el .mp4 esta gitignoreado (*.mp4) y los clips tambien
# (content/), asi que el audio mezclado se guarda aparte, que es lo que hace el molde con
# primario.m4a. Es tambien lo que el empaquetado de la T-06 va a necesitar.
ffmpeg -hide_banner -loglevel error -y -i "$T/mezcla.wav" -c:a aac -b:a 128k "$AUDIO/programa.m4a"

echo
echo "### 5. lo que salio"
printf '  %-22s %s\n' archivo "$SALIDA"
V=$(ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames,r_frame_rate,width,height -of csv=p=0 "$SALIDA")
printf '  %-22s %s\n' video "$V"
printf '  %-22s %s s\n' duracion "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SALIDA")"
for a in "$TRABAJO/relato.wav" "$TRABAJO/ambiente.wav" "$TRABAJO/ambiente-sin-emparejar.wav" "$SALIDA"; do
  L=$(ffmpeg -hide_banner -nostats -i "$a" -vn -af ebur128=peak=true -f null - 2>&1 | sed -n '/Summary:/,$p' | /usr/bin/grep -E "^ +(I|LRA|Peak):" | tr -s ' \n' ' ')
  printf '  %-30s %s\n' "$(basename "$a")" "$L"
done
echo
echo "  relato y ambiente estan medidos ANTES de la ganancia final de $GM dB, que los mueve a"
echo "  los dos por igual: en el programa suenan a $(awk -v g="$GM" 'BEGIN{printf "%.1f", -20.2+g}') y $(awk -v g="$GM" 'BEGIN{printf "%.1f", -30.0+g}') LUFS, con los mismos $SEPARACION dB entre uno y otro."
echo "  Cuanto margen queda durante el habla, que es lo unico que decide si el numero sirvio:"
echo "  ./medir-mezcla.py"
