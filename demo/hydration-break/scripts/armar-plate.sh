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
CLIP=$(node -e 'process.stdout.write(String(require("./plate.json").clip))')
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
#
# POR ESO EL RECORTE Y EL CLIP VIVEN EN plate.json Y NO ACÁ (ADR 0044, aplicado a la
# geometría). `generar-parada.sh` necesita los mismos dos valores para sacar el cuadro
# contra el que cierra la cadena, y escritos en los dos lados se despegan: el eslabón
# final cerraría contra un encuadre que el plate ya no usa, sin que nada falle.
RECORTE=$(node -e 'process.stdout.write(String(require("./plate.json").recorte))')

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

# Los tres actos por separado y después una concatenación sin recodificar el medio: se
# normalizan una sola vez acá.
#
# A 24 FPS, QUE ES EL PASO DE TODA LA CADENA. El clip filmado es de 24, y los eslabones
# generados también (192 cuadros en 8,00 s). Normalizar a 30 remuestrea 24 a 30
# duplicando un cuadro de cada cuatro, y eso es un tironeo parejo a lo largo de TODO el
# plate, no sólo en las costuras. Nada en esta cadena es de 30, así que a 24 el
# remuestreo desaparece. Los creativos sí son de 30 (`creativos.sh`), y no necesitan
# coincidir: son streams HLS separados del primario.
# EL ACTO 1 CIERRA UN CUADRO ANTES DE LOS 14 s, y ese cuadro no es un redondeo. El
# cuadro contra el que se generó la parada es `entrada-arranca-la-parada.png`, y está
# medido: es el cuadro **334** del clip. `trim=duration=14` a 24 fps deja los cuadros
# 0..335, o sea que el acto 1 terminaba UN CUADRO DESPUÉS de donde la generación
# arrancaba, y la costura se leía `333, 334, 335, 334-redibujado`: un cuadro de más y
# después uno para atrás. Cortando en el 334 la secuencia queda `333, 334` y sigue.
#
# Y ESTO NO FUNCIONA SOLO: va junto con que el eslabón 01 entre sin su cuadro 0, más
# abajo. Con el acto 1 cerrando en el 334, ese cuadro 0 --que es el 334 redibujado--
# pasa a ser un duplicado, que es exactamente lo que le pasaba a los otros siete. Uno
# solo de los dos cambios deja el defecto por el otro lado: el primero sin el segundo
# duplica el 334, y el segundo sin el primero deja el paso atrás.
CUADROS_ACTO1=$(awk -v j="$JUEGO" 'BEGIN { printf "%d", j * 24 - 1 }')
ffmpeg -hide_banner -loglevel error -y -i "$F/$CLIP" \
  -filter_complex "[0:v]crop=$RECORTE,scale=1280:720,fps=24,setsar=1,trim=end_frame=$CUADROS_ACTO1,setpts=PTS-STARTPTS[v]" \
  -map "[v]" -an -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p "$TMP/acto1.mp4"

# CADA ESLABÓN ENTRA SIN SU CUADRO 0, y es la otra mitad de la costura.
# Cada eslabón se genera sembrado con el último cuadro del anterior --y el primero, con
# el último cuadro del acto 1--, así que su cuadro 0 es la versión que Veo hace de ese
# mismo instante: pegados tal cual, el instante se ve dos veces y queda un cuadro
# congelado en cada costura. Se descarta el de la copia generada y se conserva el del
# material que ya venía corriendo.
#
# Por eso son `$ESLABONES` entradas y un `concat` de filtro en lugar del demuxer: el
# demuxer pega archivos enteros y no sabe saltear un cuadro.
ENTRADAS=(); FILTRO=""; ETIQUETAS=""
for n in $(seq 1 "$ESLABONES"); do
  ENTRADAS+=(-i "$(printf '%s/%02d.mp4' "$P" "$n")")
  i=$((n - 1))
  # TODOS entran sin su cuadro 0, el primero incluido. El del primero es el cuadro 334
  # redibujado, y el acto 1 ahora cierra en el 334: sin descartarlo se vería dos veces,
  # igual que en las otras siete costuras.
  FILTRO+="[$i:v]select=gte(n\,1),setpts=PTS-STARTPTS[e$i];"
  ETIQUETAS+="[e$i]"
done
FILTRO+="${ETIQUETAS}concat=n=$ESLABONES:v=1:a=0,scale=1280:720,fps=24,setsar=1,trim=duration=$PARADA,setpts=PTS-STARTPTS[v]"
ffmpeg -hide_banner -loglevel error -y "${ENTRADAS[@]}" \
  -filter_complex "$FILTRO" \
  -map "[v]" -an -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p "$TMP/acto2.mp4"

ffmpeg -hide_banner -loglevel error -y -i "$F/$CLIP" \
  -filter_complex "[0:v]crop=$RECORTE,scale=1280:720,fps=24,setsar=1,trim=duration=$COLA,setpts=PTS-STARTPTS[v]" \
  -map "[v]" -an -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p "$TMP/acto3.mp4"

printf "file '%s'\nfile '%s'\nfile '%s'\n" "$TMP/acto1.mp4" "$TMP/acto2.mp4" "$TMP/acto3.mp4" > "$TMP/actos.txt"
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$TMP/actos.txt" \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -an "$OUT"

echo "$OUT  ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s)"
