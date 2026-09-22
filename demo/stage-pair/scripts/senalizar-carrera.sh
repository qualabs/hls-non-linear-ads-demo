#!/usr/bin/env bash
# Escribe la señalización de la TERCERA página: la playlist de la carrera con
# sus tags, los cuatro asset-lists de los avisos y el de la ventana de multi
# view.
#
# Corre en cada arranque, detrás de `senalizar-contenido.sh`, y por la misma
# razón que aquel: el START-DATE de cada tag se resuelve contra el
# EXT-X-PROGRAM-DATE-TIME de la propia playlist (ADR 0005), que es la hora de
# pared del empaquetado. Una playlist señalizada fija en git apunta al pasado la
# próxima vez que alguien empaqueta.
#
# ---------------------------------------------------------------------------
# DOS CLASES EN UNA PLAYLIST, Y SON LAS DOS HERMANAS
# ---------------------------------------------------------------------------
# Es lo único que esta señalización hace y que ninguna otra del repositorio
# hacía: los cuatro avisos van en la clase concurrente y la ventana en la de
# multi view, en la MISMA media playlist. Son dos clases hermanas y no una
# extensión de la otra (ADR 0063) -- en HLS la clase se compara por igualdad
# exacta de string y no hay herencia --, y el orden en el tiempo es el argumento
# de la página: LOS AVISOS PRIMERO Y LA VENTANA DESPUÉS. El último aviso cierra
# ocho segundos antes de que la ventana abra, así que nunca hay una caja de
# aviso y una caja de cámara en pantalla a la vez, que es donde se ve dónde
# termina la señalización de publicidad y empieza la extensión de Qualabs.
#
# NO HAY TAG DE CLASE APPLE ACÁ, y es la otra diferencia con el par. Esta página
# no tiene pane de fábrica: la compatibilidad es la afirmación de `index.html` y
# repetirla acá sería un segundo lugar donde mantenerla. Lo que esta página
# afirma es otra cosa.
#
# EL TAG DE LA VENTANA NO LLEVA X-RESTRICT, y es lo único que lo separa del de un
# aviso: en un aviso ese atributo dice que el break no se puede saltear; acá no
# hay break que saltear, porque el programa nunca se detiene y componer es
# opcional (ADR 0063). X-RESUME-OFFSET y X-SNAP se escriben en los dos y son
# inertes en los dos, por la razón del ADR 0016: no hay nada interrumpido que
# reanudar.
#
# ---------------------------------------------------------------------------
# LAS VARIABLES DE ENTORNO, Y PARA QUÉ EXISTEN
# ---------------------------------------------------------------------------
#   RACE_SRC          la playlist de entrada    (default, de stage.json)
#   RACE_OUT          la playlist señalizada    (default, de stage.json)
#   RACE_CONTENT      dónde se buscan las cámaras empaquetadas  (default content/race)
#   RACE_SIGNALLING   dónde van los asset-lists (default signalling)
#
# Llevan prefijo y no se llaman SRC, OUT y SIGNALLING a propósito: este script lo
# invoca `senalizar-contenido.sh`, que usa esos tres nombres para lo suyo, y dos
# scripts que leen la misma variable del ambiente para cosas distintas es un
# acoplamiento que sólo se ve el día que alguien corre uno con el otro puesto.
#
# Las cuatro existen para que el test pueda correr ESTE script sobre una playlist
# mínima y un árbol de cámaras falso, y contar lo que salió DE VERDAD, sin ffmpeg
# y sin los 160 MB de video. Leer el texto de este archivo y encontrar un printf
# que menciona una clase prueba que alguien la tipeó, no que la playlist salga con
# ella.
#
#   CONTROL_AVISO_EN_VENTANA=1   EL CONTROL, y sólo eso. Corre el último aviso
#       adentro de la ventana de multi view, que es exactamente lo que esta
#       página afirma que no pasa. Es contra ese rojo que se mide el verde de
#       test/verificar-carrera.py. No se usa en ninguna corrida normal.
set -euo pipefail
cd "$(dirname "$0")/.."

DEMO=$(pwd)

leer() { node -e 'const s=require(process.argv[1]);let v=s;for(const k of process.argv[2].split("."))v=v[k];process.stdout.write(String(v))' "$DEMO/stage.json" "$1"; }

RACE_SRC=${RACE_SRC:-$(leer carrera.programa.video)}
RACE_OUT=${RACE_OUT:-$(leer carrera.playlist)}
RACE_CONTENT=${RACE_CONTENT:-content/race}
RACE_SIGNALLING=${RACE_SIGNALLING:-signalling}

# Las dos clases hermanas del ADR 0063, escritas una sola vez.
CLASE_CONCURRENTE=com.qualabs.hls.concurrentInterstitial
CLASE_MULTIVIEW=com.qualabs.hls.multiViewInterstitial

# LA CARRERA ES CONTENIDO GENERADO Y NO VIVE EN GIT, así que en un clone limpio
# todavía no está. Eso NO es un error de esta corrida: las otras dos páginas
# andan igual, y lo que hace falta es un comando y no un arreglo. Se dice y se
# sigue, que es lo contrario de romper `./run.sh` por una página que el que
# arrancó puede no estar mirando.
if [ ! -f "$RACE_SRC" ]; then
  echo "la carrera no está empaquetada ($RACE_SRC): race.html no va a tener qué reproducir."
  echo "  correr ./demo/stage-pair/scripts/puente-carrera.sh para construirla (T-09)."
  exit 0
fi

PDT=$(/usr/bin/grep -m1 '^#EXT-X-PROGRAM-DATE-TIME:' "$RACE_SRC" | cut -d: -f2-)
[ -n "$PDT" ] || { echo "$RACE_SRC no tiene EXT-X-PROGRAM-DATE-TIME" >&2; exit 1; }

OFERTA=$(leer carrera.oferta)

# LOS CINCO ASSET-LISTS, derivados de stage.json. La receta de cada campo vive en
# la cabecera de ese script (ADR 0061), que es donde la va a leer el que lo edite.
# Devuelve los offsets que usó, y se usan ESOS y no los de stage.json: el control
# mueve uno, y un tag escrito contra stage.json dejaría el archivo corrido y el
# tag en su lugar, o sea mediría cualquier cosa.
RECORRIDO=$("$DEMO/scripts/escribir-asset-lists-carrera.mjs" \
  "$DEMO/stage.json" "$RACE_SIGNALLING" "$RACE_CONTENT")

# Lo que un asset-list declara, LEÍDO DEL PROPIO ARCHIVO: la primera línea es el
# largo total en segundos -- la suma de las DURATION del Apéndice D.2, que es lo
# que el rango dura -- y la segunda el `type` de su bloque, que es lo que decide
# la clase del tag. El PLANNED-DURATION sale de acá y no de un número tipeado:
# escrito fijo, un tag declara un largo que puede no ser el de su lista, y eso es
# inerte para este player -- el rango lo arma `rangeOfExperiences` con las
# experiencias -- pero le miente a cualquier otro cliente que lea la playlist.
declaracion() { # $1 ruta del asset-list
  node -e '
    const fs = require("fs");
    const lista = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const assets = Array.isArray(lista.ASSETS) ? lista.ASSETS : [];
    const largo = (a) => Number(a.DURATION) || 0;
    const num = (v) => String(Number(v.toFixed(3)));
    const bloque = assets[0]?.["X-AD-CREATIVE-SIGNALING"];
    process.stdout.write([
      num(assets.reduce((s, a) => s + largo(a), 0)),
      bloque?.payload?.[0]?.type ?? "linear"
    ].join("\n") + "\n");
  ' "$1"
}

# El catálogo de la ventana, para la hoja: el contenido principal y cada cámara,
# en el orden en que el selector las va a listar, que es el orden del array.
catalogo() { # $1 ruta del asset-list de la oferta
  node -e '
    const fs = require("fs");
    const item = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
      .ASSETS?.[0]?.["X-AD-CREATIVE-SIGNALING"]?.payload?.[0];
    const filas = [(item?.primaryName ?? "(sin primaryName)") + "|el contenido principal"];
    for (const v of item?.views ?? []) filas.push(v.name + "|" + v.uri);
    process.stdout.write(filas.join("\n") + "\n");
  ' "$1"
}

suma() { awk -v a="$1" -v b="$2" 'BEGIN { printf "%s", a + b }'; }

# UN TAG, Y LA CLASE SALE DEL PAYLOAD Y NO DEL PRINTF. Lo que decide si un tag es
# de aviso o de ventana es qué trae su asset-list, y el asset-list está en el
# archivo: escribir la clase a mano sería que el tag y la lista pudieran
# discrepar sin que nada avise.
tag() { # $1 id, $2 offset, $3 nombre del asset-list
  local id=$1 offset=$2 lista=$3 start largo tipo clase restrict
  start=$(date -d "$PDT + $offset seconds" +"%Y-%m-%dT%H:%M:%S.%3N%z")
  largo=$(declaracion "$RACE_SIGNALLING/$lista" | head -1)
  tipo=$(declaracion "$RACE_SIGNALLING/$lista" | sed -n '2p')
  if [ "$tipo" = multiViewOffer ]; then
    clase=$CLASE_MULTIVIEW; restrict=""
  else
    clase=$CLASE_CONCURRENTE; restrict=',X-RESTRICT="SKIP"'
  fi
  printf '#EXT-X-DATERANGE:ID="%s",CLASS="%s",START-DATE="%s",X-ASSET-LIST="/signalling/%s",X-RESUME-OFFSET=0,X-SNAP="OUT,IN"%s,PLANNED-DURATION=%s\n' \
    "$id" "$clase" "$start" "$lista" "$restrict" "$largo"
}

TAGS=""
while IFS='|' read -r id offset lista; do
  [ -n "$id" ] || continue
  [ -f "$RACE_SIGNALLING/$lista" ] || { echo "falta $RACE_SIGNALLING/$lista" >&2; exit 1; }
  TAGS="$TAGS$(tag "RACE-${id^^}-CONCURRENT" "$offset" "$lista")
"
done <<< "$RECORRIDO"
TAGS="$TAGS$(tag "RACE-MULTIVIEW" "$(leer carrera.ofertaEn)" "$OFERTA")
"

# Los tags van después de las cabeceras y antes del primer segmento, que es donde
# la especificación los admite.
mkdir -p "$(dirname "$RACE_OUT")"
awk -v tags="$TAGS" '
  /^#EXTINF:/ && !hecho { printf "%s", tags; hecho = 1 }
  { print }
' "$RACE_SRC" > "$RACE_OUT"

echo "$RACE_OUT  ($(/usr/bin/grep -c '^#EXT-X-DATERANGE:' "$RACE_OUT") Date Ranges)"
OFRECIDAS=$(node -e '
  const fs = require("fs");
  const l = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const s = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const v = l.ASSETS[0]["X-AD-CREATIVE-SIGNALING"].payload[0].views.length;
  process.stdout.write(`${v} de ${s.carrera.camaras.length}`);
' "$RACE_SIGNALLING/$OFERTA" "$DEMO/stage.json")
echo "$RACE_SIGNALLING/  ($(/usr/bin/grep -c . <<< "$RECORRIDO") avisos + la ventana, $OFRECIDAS cámaras empaquetadas)"

# ---------------------------------------------------------------------------
# EL RECORRIDO DE LA TERCERA PÁGINA, que es la tabla con la que se graba.
# ---------------------------------------------------------------------------
OFERTA_EN=$(leer carrera.ofertaEn)
OFERTA_DURA=$(declaracion "$RACE_SIGNALLING/$OFERTA" | head -1)
CIERRA=$(suma "$OFERTA_EN" "$OFERTA_DURA")
LARGO=$(leer carrera.largo)

echo
echo "El recorrido de la carrera, sobre un programa de ${LARGO} s:"
while IFS='|' read -r id offset lista; do
  [ -n "$id" ] || continue
  largo=$(declaracion "$RACE_SIGNALLING/$lista" | head -1)
  forma=$(node -e '
    const s = require(process.argv[1]).carrera.breaks.find((b) => b.id === process.argv[2]);
    process.stdout.write(`${s.layout}|${s.campana}`);
  ' "$DEMO/stage.json" "$id")
  printf '  aviso %s  t=%3ss a %3ss  (%ss)  %-22s %s\n' \
    "${id^^}" "$offset" "$(suma "$offset" "$largo")" "$largo" \
    "${forma%%|*}" "$(leer "campanas.${forma##*|}.marca")"
done <<< "$RECORRIDO"
printf '  la ventana   t=%ss a %ss  (%ss)  multi view   %s\n' \
  "$OFERTA_EN" "$CIERRA" "$OFERTA_DURA" "$RACE_SIGNALLING/$OFERTA"
while IFS='|' read -r etiqueta detalle; do
  [ -n "$etiqueta" ] && printf '      %-24s %s\n' "$etiqueta" "$detalle"
done <<< "$(catalogo "$RACE_SIGNALLING/$OFERTA")"

cat <<TEXTO

Qué mirar, y en qué segundo:

  t=0          arranca la carrera, y no suena nada: todo este contenido es mudo
               por decisión de Nicolás. El foco de audio del ADR 0027 sigue
               funcionando porque los feeds son cajas de video; sencillamente no
               hay qué oír, y la página no promete audio por cámara.

  t=6..48      LOS CUATRO AVISOS NO LINEALES, sobre una carrera que no se
               detiene: banner, L, banner, L. Es la misma librería, los mismos
               creativos y la misma clase que en la página del par.

  t=$OFERTA_EN         ABRE LA VENTANA DE MULTI VIEW, y acá empieza la otra clase. El
               cuadro 0 de cada cámara es ESTE segundo de la carrera, así que las
               seis muestran el momento que el programa está mostrando.

  t=…          abrir la lista en la barra y tildar una cámara. La grilla pasa a
               dos cajas y el programa se corre a la suya: es una vista más y no
               un fondo. Hasta TRES cámaras y no cuatro: el tope del ADR 0066
               es de cuatro CAJAS y el programa es una de ellas, así que con la
               tercera la grilla se llena y la fila siguiente se pone gris. El
               tope es de la grilla y nunca de la oferta, que sigue ofreciendo
               las seis.

  t=…          agrandar una caja: se va a cuadro entero y quedás adentro de ese
               auto. Desagrandar devuelve la grilla.

  t=$CIERRA        cierra la ventana. Si quedaba algo arriba, se baja solo y el
               programa vuelve como venía.
TEXTO
