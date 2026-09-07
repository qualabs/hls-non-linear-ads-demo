#!/usr/bin/env bash
# Escribe la playlist señalizada: los mismos segmentos que el primario, más un
# par de EXT-X-DATERANGE por break —uno de la clase de Apple y uno de la clase
# concurrente, con el mismo START-DATE—, que es la forma de la playlist que la
# T-02 midió.
#
# Por qué es un paso generado y no un archivo en git: el START-DATE se resuelve
# contra el EXT-X-PROGRAM-DATE-TIME de la propia playlist (ADR 0005), y ese
# reloj es la hora de pared del empaquetado. Un START-DATE fijo en git apunta al
# pasado la próxima vez que alguien empaqueta el contenido.
#
# Los tags valen lo mismo escritos como DateRange Object del Apéndice H
# (ADR 0006): CLASS y START-DATE presentes, IDs únicos, y todos los atributos
# X- con valores escalares.
#
# Dos modos:
#
#   ./scripts/senalizar-contenido.sh                    el recorrido de los
#                                                       cinco layouts (default)
#   ./scripts/senalizar-contenido.sh 20 cornerOverlay   un solo break, para
#                                                       trabajar en un layout
#
# El recorrido es la forma final de la demo y por eso es el default: los cinco
# layouts del documento de requerimientos, uno detrás del otro en una sola
# corrida, que es lo que se graba. El modo de un solo break es el interruptor
# con el que se construyó cada mecanismo, y sigue ahí porque para mirar un
# layout no hace falta esperar dos minutos.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=content/primary/index.m3u8
OUT=content/primary/con-daterange.m3u8

# El recorrido, y es la tabla que gobierna la grabación: segundo de
# reproducción, layout, asset-list y el nombre con que el documento de
# requerimientos lo llama (el mapeo del ADR 0012).
#
# Los cinco nombres del documento se cubren con cuatro identificadores de la
# herramienta de SVTA, porque LBox video y LBox image son el mismo layout con
# distinto tipo de asset: el `type` del payload dice `squeezebackLShape` en los
# dos y lo que cambia es el `type` de cada asset, `application/vnd.apple.mpegurl`
# contra `image/jpeg`.
#
# Los 20 s del primer break dejan ver contenido antes del aviso, y los 25 entre
# breaks dejan ver el contenido volver: los dos son requisitos de la grabación y
# no del código.
RECORRIDO=(
  "20|asset-list-cornerOverlay.json|Overlay"
  "45|asset-list-squeezebackLShape.json|LBox video"
  "70|asset-list-squeezebackLShape-image.json|LBox image"
  "95|asset-list-squeezebackDoubleBox.json|Side by side pullback"
  "120|asset-list-multiView.json|Quad"
)

[ -f "$SRC" ] || { echo "falta $SRC: correr ./scripts/preparar-contenido.sh" >&2; exit 1; }

PDT=$(grep -m1 '^#EXT-X-PROGRAM-DATE-TIME:' "$SRC" | cut -d: -f2-)
[ -n "$PDT" ] || { echo "$SRC no tiene EXT-X-PROGRAM-DATE-TIME" >&2; exit 1; }

# Un break son dos tags: el lineal que se queda el cliente de mercado y el
# concurrente que se queda el de la demo (ADR 0007). Los dos con el mismo
# START-DATE, cada uno con su ID y su asset-list.
#
# El tag lineal va en la forma de REEMPLAZO, y la forma es la AUSENCIA de
# X-RESUME-OFFSET: sin el atributo el primario retoma donde el aviso termino, asi
# que un pedazo del programa no se ve y los dos panes se quedan en el mismo
# segundo del programa (ADR 0017). Escrito en 0 el atributo pide la otra cosa: el
# primario retoma donde lo interrumpieron, no se pierde programa, y el pane de
# fabrica se atrasa la duracion del aviso en cada break.
#
# Entre las dos formas del reemplazo decidio una medicion y no la
# especificacion: con el atributo ausente hls.js 1.7.2 resuelve el punto de
# retorno contra el largo que MIDIO del aviso, y con el offset escrito a mano
# vale el numero escrito aunque el aviso dure otra cosa. Las dos reemplazan; la
# ausencia es la que sigue siendo cierta si el aviso cambia de largo.
#
# El X-RESUME-OFFSET del tag concurrente no significa nada, porque no hay nada
# interrumpido que reanudar (ADR 0016), y queda como estaba.
par_de_tags() { # $1 numero de break, $2 offset en segundos, $3 asset-list
  local n=$1 offset=$2 lista=$3 start
  start=$(date -d "$PDT + $offset seconds" +"%Y-%m-%dT%H:%M:%S.%3N%z")
  printf '#EXT-X-DATERANGE:ID="AD-%s-LINEAR",CLASS="com.apple.hls.interstitial",START-DATE="%s",X-ASSET-LIST="/signalling/asset-list-linear.json",X-RESTRICT="SKIP",PLANNED-DURATION=12\n' "$n" "$start"
  printf '#EXT-X-DATERANGE:ID="AD-%s-CONCURRENT",CLASS="com.qualabs.hls.concurrentInterstitial",START-DATE="%s",X-ASSET-LIST="/signalling/%s",X-RESUME-OFFSET=0,X-SNAP="OUT,IN",X-RESTRICT="SKIP",PLANNED-DURATION=12\n' "$n" "$start" "$lista"
}

TAGS=""
if [ $# -eq 0 ]; then
  MODO="el recorrido de los cinco layouts"
  n=0
  for fila in "${RECORRIDO[@]}"; do
    IFS='|' read -r offset lista nombre <<< "$fila"
    [ -f "signalling/$lista" ] || { echo "falta signalling/$lista" >&2; exit 1; }
    n=$((n + 1))
    TAGS="$TAGS$(par_de_tags "$n" "$offset" "$lista")
"
  done
else
  MODO="un solo break"
  OFFSET=$1
  LAYOUT=${2:-cornerOverlay}
  LIST=asset-list-$LAYOUT.json
  [ -f "signalling/$LIST" ] || { echo "no hay asset-list para '$LAYOUT': falta signalling/$LIST" >&2; exit 1; }
  TAGS="$(par_de_tags 1 "$OFFSET" "$LIST")
"
fi

# Los tags van después de las cabeceras y antes del primer segmento, que es
# donde la especificación los admite y donde la T-02 los puso.
awk -v tags="$TAGS" '
  /^#EXTINF:/ && !hecho { printf "%s", tags; hecho = 1 }
  { print }
' "$SRC" > "$OUT"

echo "$OUT  ($MODO, $(grep -c '^#EXT-X-DATERANGE:' "$OUT") Date Ranges)"
if [ $# -eq 0 ]; then
  echo
  echo "El recorrido, que es el orden en que hay que grabarlo:"
  n=0
  for fila in "${RECORRIDO[@]}"; do
    IFS='|' read -r offset lista nombre <<< "$fila"
    n=$((n + 1))
    printf '  break %s  t=%3ss a %3ss  %-22s %s\n' "$n" "$offset" "$((offset + 12))" "$nombre" "$lista"
  done
  echo
  echo "Antes de grabar, y esto se hace UNA vez al empezar: encender el audio"
  echo "con el control de arriba a la derecha de la imagen, que lo dibuja la"
  echo "librería (ADR 0015). La página arranca muteada por la política de"
  echo "autoplay del browser y ese control es el que la levanta: es el audio de"
  echo "la composición entera, primario y aviso a la vez."
  echo
  echo "La mezcla de cada elemento la declara el asset list y el reproductor la"
  echo "respeta (ADR 0014). En este recorrido: el break del Quad trae la mezcla"
  echo "—100 en el cuadrante de abajo a la izquierda y 10 en los otros tres—, y"
  echo "los otros cuatro no declaran volumen, así que el aviso entra callado y"
  echo "el programa se sigue escuchando."
fi
