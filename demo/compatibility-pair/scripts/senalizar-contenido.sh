#!/usr/bin/env bash
# Escribe la playlist señalizada: los mismos segmentos que el primario, más UN
# EXT-X-DATERANGE por break cuya clase elige el cliente por la URL (ADR 0103).
#
# La playlist declara `#EXT-X-DEFINE:QUERYPARAM="adclass"` y cada break lleva
# `CLASS="{$adclass}"`. Los dos panes cargan ESTE archivo: el de fábrica con
# `?adclass=com.apple.hls.interstitial` y el nuestro con
# `?adclass=com.qualabs.hls.concurrentInterstitial`, y hls.js sustituye la
# referencia al parsear (draft-pantos-hls-rfc8216bis-22, 4.3 y 4.4.2.3). Antes
# cada break eran dos tags de clases distintas en el mismo START-DATE (ADR 0007);
# David decidió el 2026-10-22 que un stream lleva UN juego de tags. QUERYPARAM
# obliga a EXT-X-VERSION 11, y este script la sube.
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

SRC=${SRC:-content/primary/index.m3u8}
OUT=${OUT:-content/primary/con-daterange.m3u8}

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

# El nombre de la variable de la clase y del parámetro de la URL, que por la spec
# son el mismo. js/app.js lo repite y el test de esta demo compara los dos.
PARAMETRO=adclass

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

# Sumar dos segundos, que en la tabla son el arranque de un aviso y su largo.
# Con awk y no con `bc` ni con `$(( ))`: awk ya es dependencia de este script y
# los dos numeros pueden traer decimales.
suma() { awk -v a="$1" -v b="$2" 'BEGIN { printf "%s", a + b }'; }


# Un break es UN tag, y lo leen los dos clientes: el de fábrica como
# interstitial de Apple y el de la demo como concurrente. Su asset-list es el
# concurrente del break, y lo leen los dos: su parte estándar —el `URI` y la
# `DURATION` de cada asset, Apéndice D.2— es lo que hls.js reproduce, y el bloque
# de encima lo que lee la librería (ADR 0090).
#
# El tag va en la forma de REEMPLAZO, y la forma es la AUSENCIA de
# X-RESUME-OFFSET: sin el atributo el primario retoma donde el aviso termino, asi
# que un pedazo del programa no se ve y los dos panes se quedan en el mismo
# segundo del programa (ADR 0017). Con la clase concurrente el atributo no
# significa nada, porque no hay nada interrumpido que reanudar (ADR 0016), y por
# la misma razón el tag no lleva X-SNAP: lo leería hls.js en la lectura de Apple.
#
# EL TAG DECLARA EL LARGO DE SU ASSET-LIST, que es el que reproducen los dos.
tag() { # $1 numero de break, $2 offset en segundos, $3 asset-list, $4 largo
  local n=$1 offset=$2 lista=$3 largo=$4 start
  start=$(date -d "$PDT + $offset seconds" +"%Y-%m-%dT%H:%M:%S.%3N%z")
  printf '#EXT-X-DATERANGE:ID="AD-%s",CLASS="{$%s}",START-DATE="%s",X-ASSET-LIST="/signalling/%s",X-RESTRICT="SKIP",PLANNED-DURATION=%s\n' "$n" "$PARAMETRO" "$start" "$lista" "$largo"
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
    TAGS="$TAGS$(tag "$n" "$offset" "$lista" "$largo")
"
  done
else
  MODO="un solo break"
  OFFSET=$1
  LAYOUT=${2:-cornerOverlay}
  LIST=asset-list-$LAYOUT.json
  [ -f "signalling/$LIST" ] || { echo "no hay asset-list para '$LAYOUT': falta signalling/$LIST" >&2; exit 1; }
  TAGS="$(tag 1 "$OFFSET" "$LIST" "$(declaracion "signalling/$LIST" | head -1)")
"
fi

# Los tags van después de las cabeceras y antes del primer segmento, que es
# donde la especificación los admite y donde la T-02 los puso, con la definición
# de la variable delante: una referencia sólo se sustituye con una variable
# definida antes que ella (la spec, 6.3.1).
TAGS="#EXT-X-DEFINE:QUERYPARAM=\"$PARAMETRO\"
$TAGS"
awk -v tags="$TAGS" '
  /^#EXT-X-VERSION:/ { if (substr($0, 16) + 0 < 11) $0 = "#EXT-X-VERSION:11" }
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
  echo "de grabarlo. Los dos panes leen el MISMO tag y el MISMO asset-list, así"
  echo "que entran y salen del break juntos, del 120 al 168. El de fábrica"
  echo "reproduce la parte estándar de los cuatro avisos, uno detrás del otro y a"
  echo "cuadro entero; el nuestro dibuja tres de ellos encima del programa y el"
  echo "tercero, que es lineal, a cuadro entero. Del 144 al 156 los dos panes"
  echo "muestran lo mismo, el aviso lineal, y es lo que tiene que pasar: es el"
  echo "único aviso del break que no tiene forma concurrente."
fi
