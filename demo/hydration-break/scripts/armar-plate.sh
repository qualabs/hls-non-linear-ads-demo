#!/usr/bin/env bash
# Arma el plate del partido: tres actos, juego, parada del juego, juego, y deja el
# resultado en un solo mp4 listo para que el paquete de canal se le queme encima.
#
# ES UN SOLO PARTIDO DE PUNTA A PUNTA, y ahí está lo que esta versión resuelve. El plate
# anterior mezclaba dos rodajes y tenía un corte de escena en el segundo exacto del
# break, así que el espectador percibía **que el video principal había cambiado** -- que
# es la lectura opuesta a lo que la demo existe para demostrar, que el primario nunca se
# reemplaza. La demo desmintiendo con la imagen lo que afirma con el texto.
#
# Ahora los dos actos de juego son metraje filmado del mismo picado, y la parada del
# juego **se genera desde el último cuadro del acto 1** con `generar-parada.sh`: los
# mismos jugadores, la misma cancha y la misma luz, dejando de jugar y yendo a tomar
# agua. El último eslabón cierra contra el primer cuadro del acto 3, así que el juego
# vuelve exactamente donde el clip real retoma.
#
# NO HAY DISOLVENCIAS EN LOS BORDES, y es una decisión: los dos empalmes están sembrados
# desde los cuadros que empalman, así que ya son continuos. Una disolvencia de medio
# segundo sobre movimiento continuo no suaviza un corte, **inventa uno** -- se ve como un
# defecto de codificación y no como una edición. Se probó la versión con disolvencias
# sobre el plate de dos rodajes, donde sí hacía falta, y quedó como respaldo.
#
# EL CHEQUEO DE CUADRO CORRE IGUAL SOBRE LO GENERADO, con el umbral que Nicolás fijó: una
# marca incidental en la ropa entra, igual que si estuviera filmada, porque en un partido
# real alguien tiene un pantalón de marca. Lo que no entra es una marca dominando el
# cuadro. Los veredictos, eslabón por eslabón, están en la evidencia de la T-03.
#
# Los tres largos salen de plate.json (ADR 0044), que es el mismo archivo del que el
# script de señalización saca dónde poner el break y de donde sale el reparto de los
# avisos.
set -euo pipefail
cd "$(dirname "$0")/.."

F=content/.fuentes
P=$F/parada
OUT=${1:?mp4 de salida}

JUEGO=$(node -e 'process.stdout.write(String(require("./plate.json").paradaEn))')
PARADA=$(node -e 'process.stdout.write(String(require("./plate.json").paradaDura))')
LARGO=$(node -e 'process.stdout.write(String(require("./plate.json").largo))')
COLA=$(awk -v l="$LARGO" -v j="$JUEGO" -v p="$PARADA" 'BEGIN { printf "%s", l - j - p }')

# EL RECORTE DEL CLIP DE JUEGO NO ES ENCUADRE: ES EL CHEQUEO DE CUADRO. En el tercio
# izquierdo del cuadro original hay un jugador con una camiseta réplica de selección
# —escudo de federación visible, y las tres tiras de una marca real en la manga—. El
# recorte lo saca, y se verificó en cuatro momentos del clip. Cambiar estos números sin
# volver a mirar los cuadros vuelve a meter la marca.
#
# Y LOS DOS ACTOS DE JUEGO COMPARTEN EL RECORTE, que es un requisito de la cadena: la
# parada se genera del último cuadro del acto 1 al primero del acto 3, así que con
# encuadres distintos no cerraría en los dos extremos.
RECORTE=2688:1512:1152:400

# La parada son los eslabones generados, concatenados. Cada uno son 8 s, que es el techo
# de una generación, y por eso `paradaDura` es múltiplo de 8: sin eso queda un resto
# corto, que es el eslabón que peor sale.
ESLABONES=$(awk -v p="$PARADA" 'BEGIN { printf "%d", p / 8 }')
faltan=()
for n in $(seq 1 "$ESLABONES"); do
  f=$(printf '%s/%02d.mp4' "$P" "$n")
  [ -s "$f" ] || faltan+=("$(basename "$f")")
done
if [ ${#faltan[@]} -gt 0 ]; then
  echo "faltan ${#faltan[@]} eslabones de la parada: ${faltan[*]}" >&2
  echo "  generarlos:  ./scripts/generar-parada.sh $ESLABONES" >&2
  echo "  genera video con Vertex AI y cuesta plata de quien lo corre." >&2
  exit 1
fi

TMP=$(mktemp -d "${TMPDIR:-/dev/shm}/plate-XXXXXX")
trap 'rm -rf "$TMP"' EXIT

echo "plate: ${JUEGO}s de juego + ${PARADA}s de parada generada (${ESLABONES} eslabones) + ${COLA}s de juego = ${LARGO}s"

# Los tres actos por separado y después una concatenación sin recodificar el medio: los
# eslabones ya vienen a 1280x720 y 24 fps de la generación, así que se normalizan una
# sola vez acá.
ffmpeg -hide_banner -loglevel error -y -i "$F/31370180.mp4" \
  -filter_complex "[0:v]crop=$RECORTE,scale=1280:720,fps=30,setsar=1,trim=duration=$JUEGO,setpts=PTS-STARTPTS[v]" \
  -map "[v]" -an -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p "$TMP/acto1.mp4"

: > "$TMP/lista.txt"
for n in $(seq 1 "$ESLABONES"); do
  printf "file '%s'\n" "$PWD/$(printf '%s/%02d.mp4' "$P" "$n")" >> "$TMP/lista.txt"
done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$TMP/lista.txt" \
  -filter_complex "[0:v]scale=1280:720,fps=30,setsar=1,trim=duration=$PARADA,setpts=PTS-STARTPTS[v]" \
  -map "[v]" -an -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p "$TMP/acto2.mp4"

ffmpeg -hide_banner -loglevel error -y -i "$F/31370180.mp4" \
  -filter_complex "[0:v]crop=$RECORTE,scale=1280:720,fps=30,setsar=1,trim=duration=$COLA,setpts=PTS-STARTPTS[v]" \
  -map "[v]" -an -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p "$TMP/acto3.mp4"

printf "file '%s'\nfile '%s'\nfile '%s'\n" "$TMP/acto1.mp4" "$TMP/acto2.mp4" "$TMP/acto3.mp4" > "$TMP/actos.txt"
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$TMP/actos.txt" \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -an "$OUT"

echo "$OUT  ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s)"
