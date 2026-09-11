#!/usr/bin/env bash
# Escribe la playlist señalizada de esta demo: los mismos segmentos que el
# primario, más un EXT-X-DATERANGE por break.
#
# SON LOS DOS TAGS EN UNA SOLA PLAYLIST, y es lo único que esta demo prueba del
# lado de la señalización: el concurrente que ya existe —un `cornerOverlay`
# idéntico al del recorrido que se graba— y el de multi view, que anuncia un
# catálogo del que quien mira elige.
#
# UN TAG POR BREAK Y NO UN PAR. La otra demo escribe dos por break, uno de la
# clase de Apple y uno de la nuestra, porque su argumento es la compatibilidad:
# dos clientes leyendo la misma playlist. Acá el argumento es otro y el par no
# aporta: lo que se muestra es que las dos clases nuestras conviven.
#
# Por qué es un paso generado y no un archivo en git: el START-DATE se resuelve
# contra el EXT-X-PROGRAM-DATE-TIME de la propia playlist (ADR 0005), y ese
# reloj es la hora de pared del empaquetado. Un START-DATE fijo en git apunta al
# pasado la próxima vez que alguien empaqueta el contenido.
#
# Dos modos:
#
#   ./scripts/senalizar-contenido.sh              el recorrido entero (default)
#   ./scripts/senalizar-contenido.sh 20 offer-3   una sola ventana, para trabajar
#
# Y dos variables de entorno, `SRC` y `OUT`, que sirven para escribir la playlist
# de otra fuente a otro destino. Existen para que el test de esta demo pueda
# contar los Date Ranges que este script escribe DE VERDAD, sobre una playlist
# mínima de tres líneas, sin necesitar ffmpeg ni los 660 MB de material. Un
# chequeo que no puede fallar no es un chequeo, y contar los tags leyendo el
# texto de este archivo en lugar de su salida es exactamente eso.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=${SRC:-content/primary/index.m3u8}
OUT=${OUT:-content/primary/con-daterange.m3u8}

# Las dos clases. La concurrente es la del ADR 0009 y la de multi view la del
# ADR 0063: hermanas, y no una extensión de la otra, porque en HLS la clase se
# compara por igualdad exacta de string y el formato no tiene herencia.
CLASE_CONCURRENTE=com.qualabs.hls.concurrentInterstitial
CLASE_MULTIVIEW=com.qualabs.hls.multiViewInterstitial

# El recorrido, sobre un primario de 180 s. Es la tabla que gobierna la corrida:
# segundo de reproducción, asset-list, y el nombre con que se lo llama en la
# tabla que este script imprime.
#
# SON TRES BREAKS Y DOS DE ELLOS SON VENTANAS LARGAS, y eso es del modelo. En un
# aviso cada layout necesita su break, porque el que publica declara la
# composición. En una oferta las tres formas de grilla se recorren ADENTRO de una
# misma ventana, subiendo cámaras de a una, así que una ventana alcanza para
# todas y lo que necesita es tiempo.
#
# La segunda ventana existe por una sola razón, que la primera no puede mostrar:
# un catálogo MÁS LARGO QUE LA GRILLA. Con cinco vistas ofrecidas y cuatro cajas
# de tope, las filas que no están en pantalla quedan deshabilitadas, y el
# movimiento de quien mira es bajar una y subir otra.
RECORRIDO=(
  "20|asset-list-cornerOverlay.json|Corner overlay"
  "45|asset-list-offer-3.json|Oferta de 3 vistas"
  "120|asset-list-offer-5.json|Oferta de 5 vistas"
)

[ -f "$SRC" ] || { echo "falta $SRC: correr ./scripts/preparar-contenido.sh" >&2; exit 1; }

PDT=$(grep -m1 '^#EXT-X-PROGRAM-DATE-TIME:' "$SRC" | cut -d: -f2-)
[ -n "$PDT" ] || { echo "$SRC no tiene EXT-X-PROGRAM-DATE-TIME" >&2; exit 1; }

# Lo que un asset-list declara, leído del propio archivo: la primera línea es el
# largo total en segundos —la suma de las DURATION del Apéndice D.2, que es lo
# que la ventana dura— y después va una línea por asset, `DURATION|type`, con el
# `type` del item del payload.
#
# Se lee y no se escribe a mano por dos cosas. El PLANNED-DURATION de los tags
# sale de acá: escrito fijo, el tag de una ventana de sesenta segundos declara
# otra cosa, y es un dato que miente a cualquier otro cliente que lea la
# playlist. Y LA CLASE TAMBIÉN SALE DE ACÁ, que es lo que hace que un asset-list
# no pueda quedar anunciado con la clase equivocada: lo que decide si el tag es
# concurrente o de multi view es qué trae el payload, y el payload está en el
# archivo.
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

# Lo que una oferta ofrece, para la tabla que se imprime: el nombre del contenido
# principal y el de cada vista, en el orden en que el selector las va a listar,
# que es el orden del array y no otro.
catalogo() { # $1 ruta del asset-list
  node -e '
    const fs = require("fs");
    const item = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
      .ASSETS?.[0]?.["X-AD-CREATIVE-SIGNALING"]?.payload?.[0];
    if (Array.isArray(item?.views)) {
      const filas = [(item.primaryName ?? "(sin primaryName)") + "|el contenido principal"];
      for (const v of item.views) filas.push(v.name + "|" + v.uri);
      process.stdout.write(filas.join("\n") + "\n");
    }
  ' "$1"
}

# Sumar dos segundos, que en la tabla son el arranque de una ventana y su largo.
# Con awk y no con `bc` ni con `$(( ))`: awk ya es dependencia de este script y
# los dos números pueden traer decimales.
suma() { awk -v a="$1" -v b="$2" 'BEGIN { printf "%s", a + b }'; }

# Un break es un tag, y cuál de las dos clases lleva lo dice su asset-list.
#
# DE LO QUE HOY SE ESCRIBE, EL TAG DE MULTI VIEW CAMBIA UNA SOLA COSA: no lleva
# X-RESTRICT="SKIP". En el aviso ese atributo dice que no se puede saltear el
# break; acá no hay break que saltear, porque el contenido principal nunca se
# detiene y componer es opcional (ADR 0063).
#
# X-RESUME-OFFSET y X-SNAP se escriben en los dos y son inertes en los dos, por
# la razón del ADR 0016: no hay nada interrumpido que reanudar.
tag() { # $1 numero de break, $2 offset en segundos, $3 asset-list, $4 largo, $5 tipo del payload
  local n=$1 offset=$2 lista=$3 largo=$4 tipo=$5 start clase id restrict=''
  start=$(date -d "$PDT + $offset seconds" +"%Y-%m-%dT%H:%M:%S.%3N%z")
  if [ "$tipo" = multiViewOffer ]; then
    clase=$CLASE_MULTIVIEW
    id="BREAK-$n-MULTIVIEW"
  else
    clase=$CLASE_CONCURRENTE
    id="BREAK-$n-CONCURRENT"
    restrict=',X-RESTRICT="SKIP"'
  fi
  printf '#EXT-X-DATERANGE:ID="%s",CLASS="%s",START-DATE="%s",X-ASSET-LIST="/signalling/%s",X-RESUME-OFFSET=0,X-SNAP="OUT,IN"%s,PLANNED-DURATION=%s\n' \
    "$id" "$clase" "$start" "$lista" "$restrict" "$largo"
}

TAGS=""
LARGOS=()
TIPOS=()
if [ $# -eq 0 ]; then
  MODO="el recorrido de los tres breaks"
  n=0
  for fila in "${RECORRIDO[@]}"; do
    IFS='|' read -r offset lista nombre <<< "$fila"
    [ -f "signalling/$lista" ] || { echo "falta signalling/$lista" >&2; exit 1; }
    n=$((n + 1))
    decl=$(declaracion "signalling/$lista")
    largo=$(printf '%s\n' "$decl" | head -1)
    tipo=$(printf '%s\n' "$decl" | sed -n '2p' | cut -d'|' -f2)
    LARGOS+=("$largo")
    TIPOS+=("$tipo")
    TAGS="$TAGS$(tag "$n" "$offset" "$lista" "$largo" "$tipo")
"
  done
else
  MODO="un solo break"
  OFFSET=$1
  LAYOUT=${2:-offer-3}
  LIST=asset-list-$LAYOUT.json
  [ -f "signalling/$LIST" ] || { echo "no hay asset-list para '$LAYOUT': falta signalling/$LIST" >&2; exit 1; }
  decl=$(declaracion "signalling/$LIST")
  TAGS="$(tag 1 "$OFFSET" "$LIST" "$(printf '%s\n' "$decl" | head -1)" \
    "$(printf '%s\n' "$decl" | sed -n '2p' | cut -d'|' -f2)")
"
fi

# Los tags van después de las cabeceras y antes del primer segmento, que es
# donde la especificación los admite.
awk -v tags="$TAGS" '
  /^#EXTINF:/ && !hecho { printf "%s", tags; hecho = 1 }
  { print }
' "$SRC" > "$OUT"

echo "$OUT  ($MODO, $(grep -c '^#EXT-X-DATERANGE:' "$OUT") Date Ranges)"
if [ $# -eq 0 ]; then
  echo
  echo "El recorrido:"
  n=0
  for fila in "${RECORRIDO[@]}"; do
    IFS='|' read -r offset lista nombre <<< "$fila"
    n=$((n + 1))
    largo=${LARGOS[$((n - 1))]}
    tipo=${TIPOS[$((n - 1))]}
    if [ "$tipo" = multiViewOffer ]; then clase="multi view"; else clase="concurrente"; fi
    printf '  break %s  t=%3ss a %3ss  (%ss)  %-12s %-20s %s\n' \
      "$n" "$offset" "$(suma "$offset" "$largo")" "$largo" "$clase" "$nombre" "$lista"
    # Lo que la oferta ofrece, cuando es una oferta: el contenido principal y las
    # vistas, en el orden en que el selector las lista. Los nombres los pone esta
    # demo y no la librería, que es lo que hace visible la regla de que la lista
    # se lee por nombre de contenido y no por número de cámara.
    while IFS='|' read -r etiqueta detalle; do
      [ -n "$etiqueta" ] && printf '      %-24s %s\n' "$etiqueta" "$detalle"
    done <<< "$(catalogo "signalling/$lista")"
  done
  echo
  echo "Qué mirar en cada uno:"
  echo
  echo "  break 1  el tag de hoy, sin cambios: un aviso concurrente dibujado"
  echo "           sobre un programa que se sigue viendo. Está en esta demo para"
  echo "           mostrar que las dos clases conviven en una sola playlist."
  echo
  echo "  break 2  la oferta. Se abre la ventana y aparece el anuncio; el"
  echo "           selector lista el contenido principal más las tres vistas, y"
  echo "           subirlas de a una recorre las tres formas de grilla: dos"
  echo "           cajas, tres, cuatro. Adentro de la ventana: agrandar una,"
  echo "           desagrandarla, y salir con el botón."
  echo
  echo "  break 3  el catálogo más largo que la grilla. Cinco vistas ofrecidas y"
  echo "           cuatro cajas de tope: con cuatro arriba las demás filas quedan"
  echo "           deshabilitadas, y para subir otra hay que bajar una. La salida"
  echo "           acá es la otra: destildar la última vista, que deja una sola"
  echo "           caja y devuelve el programa como venía."
  echo
  echo "Dos vistas son la misma película en momentos distintos, a propósito: es"
  echo "lo que hace evidente que son dos decodificadores y no una imagen"
  echo "duplicada."
  echo
  echo "Antes de mirar, y esto se hace UNA vez al empezar: encender el audio con"
  echo "el control de arriba a la derecha de la imagen, que lo dibuja la librería"
  echo "(ADR 0015). La página arranca muteada por la política de autoplay del"
  echo "browser."
fi
