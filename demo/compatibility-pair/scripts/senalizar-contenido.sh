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
#                                                       cinco breaks (default)
#   ./scripts/senalizar-contenido.sh 20 cornerOverlay   un solo break, para
#                                                       trabajar en un layout
#
# El recorrido es la forma final de la demo y por eso es el default: los cinco
# layouts del documento de requerimientos y el break mezclado que pidió David,
# uno detrás del otro en una sola corrida, que es lo que se graba. El modo de un
# solo break es el interruptor con el que se construyó cada mecanismo, y sigue
# ahí porque para mirar un layout no hace falta esperar dos minutos.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=content/primary/index.m3u8
OUT=content/primary/con-daterange.m3u8

# El recorrido, y es la tabla que gobierna la grabación: segundo de
# reproducción, asset-list y el nombre con que se lo llama en la tabla que este
# script imprime.
#
# Los cuatro primeros breaks traen un aviso cada uno y cubren cuatro de los
# cinco nombres del documento de requerimientos (el mapeo del ADR 0012). El
# quinto es el break mezclado —"concurrent, concurrent, linear, concurrent"—, y
# el quinto nombre del documento, Side by side pullback, está adentro de él como
# segundo aviso: por eso ese layout no tiene break propio y los cinco nombres
# siguen estando en la corrida.
#
# Los cinco nombres del documento se cubren con cuatro identificadores de la
# herramienta de SVTA, porque LBox video y LBox image son el mismo layout con
# distinto tipo de asset: el `type` del payload dice `squeezebackLShape` en los
# dos y lo que cambia es el `type` de cada asset, `application/vnd.apple.mpegurl`
# contra `image/jpeg`.
#
# Los 20 s del primer break dejan ver contenido antes del aviso, y los 25 entre
# arranques dejan ver el contenido volver: los dos son requisitos de la
# grabación y no del código. El break mezclado va último y dura 48 s, así que
# cierra en el 168 y quedan 12 s de programa después, que es lo mismo que
# separa a los otros.
RECORRIDO=(
  "20|asset-list-cornerOverlay.json|Overlay"
  "45|asset-list-squeezebackLShape.json|LBox video"
  "70|asset-list-squeezebackLShape-image.json|LBox image"
  "95|asset-list-multiView.json|Quad"
  "120|asset-list-mezclado.json|Break mezclado"
)

# El asset-list del tag de clase Apple, que es el mismo en los cinco breaks: un
# aviso lineal de 12 s, que es lo que el cliente de mercado reemplaza.
LISTA_LINEAL=asset-list-linear.json

[ -f "$SRC" ] || { echo "falta $SRC: correr ./scripts/preparar-contenido.sh" >&2; exit 1; }

PDT=$(grep -m1 '^#EXT-X-PROGRAM-DATE-TIME:' "$SRC" | cut -d: -f2-)
[ -n "$PDT" ] || { echo "$SRC no tiene EXT-X-PROGRAM-DATE-TIME" >&2; exit 1; }

# Lo que un asset-list declara, leído del propio archivo: la primera línea es el
# largo total en segundos —la suma de las DURATION del Apéndice D.2, que es lo
# que el break dura— y después va una línea por aviso, `DURATION|type`, con el
# `type` del bloque o `linear` cuando el asset no trae bloque, que es el aviso a
# cuadro entero del ADR 0019.
#
# Se lee y no se escribe a mano porque el PLANNED-DURATION de los tags sale de
# acá. Escrito fijo en 12, el tag de un break de varios avisos declara doce
# segundos de un break que dura cuarenta y ocho: es inerte para este player,
# porque el rango concurrente lo arma `rangeOfExperiences` con las experiencias
# y no con el tag, pero es un dato que miente a cualquier otro que lo lea.
declaracion() { # $1 ruta del asset-list
  node -e '
    const fs = require("fs");
    const lista = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const assets = Array.isArray(lista.ASSETS) ? lista.ASSETS : [];
    const largo = (a) => Number(a.DURATION) || 0;
    const num = (v) => String(Number(v.toFixed(3)));
    const filas = [num(assets.reduce((s, a) => s + largo(a), 0))];
    for (const a of assets) {
      const tipo = a["X-AD-CREATIVE-SIGNALING"]?.payload?.[0]?.type ?? "linear";
      filas.push(num(largo(a)) + "|" + tipo);
    }
    process.stdout.write(filas.join("\n") + "\n");
  ' "$1"
}

PLANNED_LINEAL=$(declaracion "signalling/$LISTA_LINEAL" | head -1)

# Sumar dos segundos, que en la tabla son el arranque de un aviso y su largo.
# Con awk y no con `bc` ni con `$(( ))`: awk ya es dependencia de este script y
# los dos numeros pueden traer decimales.
suma() { awk -v a="$1" -v b="$2" 'BEGIN { printf "%s", a + b }'; }


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
#
# CADA TAG DECLARA EL LARGO DE SU PROPIO ASSET-LIST y no el del otro: el de
# clase Apple los 12 s del aviso lineal que reemplaza, y el concurrente lo que
# suman los avisos de su lista. En los cuatro primeros breaks los dos numeros
# coinciden; en el mezclado son 12 y 48, y esa diferencia es exactamente lo que
# hace que el par de compatibilidad se invierta en un tramo del break.
par_de_tags() { # $1 numero de break, $2 offset en segundos, $3 asset-list, $4 largo del concurrente
  local n=$1 offset=$2 lista=$3 largo=$4 start
  start=$(date -d "$PDT + $offset seconds" +"%Y-%m-%dT%H:%M:%S.%3N%z")
  printf '#EXT-X-DATERANGE:ID="AD-%s-LINEAR",CLASS="com.apple.hls.interstitial",START-DATE="%s",X-ASSET-LIST="/signalling/%s",X-RESTRICT="SKIP",PLANNED-DURATION=%s\n' "$n" "$start" "$LISTA_LINEAL" "$PLANNED_LINEAL"
  printf '#EXT-X-DATERANGE:ID="AD-%s-CONCURRENT",CLASS="com.qualabs.hls.concurrentInterstitial",START-DATE="%s",X-ASSET-LIST="/signalling/%s",X-RESUME-OFFSET=0,X-SNAP="OUT,IN",X-RESTRICT="SKIP",PLANNED-DURATION=%s\n' "$n" "$start" "$lista" "$largo"
}

TAGS=""
LARGOS=()
if [ $# -eq 0 ]; then
  MODO="el recorrido de los cinco breaks"
  n=0
  for fila in "${RECORRIDO[@]}"; do
    IFS='|' read -r offset lista nombre <<< "$fila"
    [ -f "signalling/$lista" ] || { echo "falta signalling/$lista" >&2; exit 1; }
    n=$((n + 1))
    largo=$(declaracion "signalling/$lista" | head -1)
    LARGOS+=("$largo")
    TAGS="$TAGS$(par_de_tags "$n" "$offset" "$lista" "$largo")
"
  done
else
  MODO="un solo break"
  OFFSET=$1
  LAYOUT=${2:-cornerOverlay}
  LIST=asset-list-$LAYOUT.json
  [ -f "signalling/$LIST" ] || { echo "no hay asset-list para '$LAYOUT': falta signalling/$LIST" >&2; exit 1; }
  TAGS="$(par_de_tags 1 "$OFFSET" "$LIST" "$(declaracion "signalling/$LIST" | head -1)")
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
    largo=${LARGOS[$((n - 1))]}
    printf '  break %s  t=%3ss a %3ss  (%ss)  %-16s %s\n' \
      "$n" "$offset" "$(suma "$offset" "$largo")" "$largo" "$nombre" "$lista"
    # Los avisos de adentro, cuando el break trae más de uno: es el orden del
    # array ASSETS (Apéndice D.2) y el desplazamiento acumulado que la capa de
    # señalización aplica, o sea los mismos segundos que programRanges() y
    # activeAt() devuelven.
    filas=$(declaracion "signalling/$lista" | tail -n +2)
    if [ "$(printf '%s\n' "$filas" | wc -l)" -gt 1 ]; then
      cursor=$offset
      i=0
      while IFS='|' read -r dur tipo; do
        i=$((i + 1))
        fin=$(suma "$cursor" "$dur")
        if [ "$tipo" = linear ]; then
          detalle="a cuadro entero, el programa corre detrás"
        else
          detalle="concurrente, el programa se sigue viendo"
        fi
        printf '      aviso %s  t=%3ss a %3ss  %-21s %s\n' "$i" "$cursor" "$fin" "$tipo" "$detalle"
        cursor=$fin
      done <<< "$filas"
    fi
  done
  echo
  echo "El break 5 es el que pidió David —concurrent, concurrent, linear,"
  echo "concurrent— y adentro trae el Side by side pullback del documento de"
  echo "requerimientos, que por eso no tiene break propio: los cinco nombres"
  echo "siguen estando en la corrida."
  echo
  echo "Antes de grabar, y esto se hace UNA vez al empezar: encender el audio"
  echo "con el control de arriba a la derecha de la imagen, que lo dibuja la"
  echo "librería (ADR 0015). La página arranca muteada por la política de"
  echo "autoplay del browser y ese control es el que la levanta: es el audio de"
  echo "la composición entera, primario y aviso a la vez."
  echo
  echo "La mezcla de cada elemento la declara el asset list y el reproductor la"
  echo "respeta (ADR 0014). En este recorrido: el break del Quad trae la mezcla"
  echo "—100 en el cuadrante de abajo a la izquierda y 10 en los otros tres—,"
  echo "los avisos que declaran layout entran callados sobre un programa que se"
  echo "sigue escuchando, y el aviso a cuadro entero del break 5 es el único"
  echo "que se queda con el audio: la capa lo sintetiza con 100 en el aviso y 0"
  echo "en el programa (ADR 0019), porque un aviso que tapa la pantalla entera"
  echo "sin sonido es una falla que nada en pantalla reporta."
  echo
  echo "El par de compatibilidad durante el break 5, y conviene contarlo antes"
  echo "de grabarlo. Los dos tags del break arrancan en el mismo segundo"
  echo "(ADR 0018), el de clase Apple declara 12 s y el nuestro 48. Del 120 al"
  echo "132 el pane de fábrica muestra su aviso a cuadro entero y el nuestro el"
  echo "programa con el aviso encima, que es el cuadro que la demo quiere. Del"
  echo "132 en adelante el de fábrica ya volvió al programa y nosotros seguimos"
  echo "adentro del break, y del 144 al 156 —el aviso a cuadro entero— la"
  echo "comparación queda al revés: el nuestro tapado y el de fábrica con el"
  echo "programa. Son 12 segundos de 48 y no cambian el argumento: los dos"
  echo "players están haciendo lo mismo en momentos distintos, porque les"
  echo "tocaron breaks de largos distintos."
fi
