#!/usr/bin/env bash
# Escribe la señalización de esta demo: los asset-lists y LA PLAYLIST, con los
# mismos segmentos del programa más un EXT-X-DATERANGE por break.
#
# Corre en cada arranque, y no es una comodidad: el START-DATE de cada tag se
# resuelve contra el EXT-X-PROGRAM-DATE-TIME de la propia playlist (ADR 0005), y
# ese reloj es la hora de pared del empaquetado. Una playlist señalizada fija en
# git apunta al pasado la próxima vez que alguien empaqueta el contenido.
#
# ---------------------------------------------------------------------------
# UNA PLAYLIST, UN TAG POR BREAK, Y LA CLASE LA ELIGE EL CLIENTE POR LA URL
# ---------------------------------------------------------------------------
# Es el ADR 0105, que supersede el manifest por clase del ADR 0090. La playlist
# declara `#EXT-X-DEFINE:QUERYPARAM="adclass"` y cada break lleva
# `CLASS="{$adclass}"`: cada player pide la MISMA playlist con otro parámetro
# (`?adclass=com.apple.hls.interstitial` el de fábrica,
# `?adclass=com.qualabs.hls.concurrentInterstitial` el nuestro) y hls.js sustituye
# la referencia al parsear (draft-pantos-hls-rfc8216bis-22, 4.3 y 4.4.2.3). El
# archivo es uno, byte por byte, así que un bucket estático lo sirve igual. Un
# QUERYPARAM obliga a EXT-X-VERSION 11 (la spec, 7), y este script la sube.
#
# El tag es UNO para las dos clases, así que sus atributos tienen que significar
# lo correcto en las dos lecturas: va en la forma de Apple, y para la clase
# concurrente los atributos de reemplazo son inertes (ADR 0016). Por eso no lleva
# X-SNAP, que hls.js aplicaría a la lectura de Apple.
#
# El asset-list de cada break lo leen los dos clientes: su parte estándar la
# reproduce hls.js, y el bloque de encima lo lee nuestra librería, que cae a esa
# parte estándar cuando no puede dibujar. La capacidad viaja en el pedido y la
# librería filtra (ADR 0085).
#
# UN BREAK NO TIENE DEFAULT (ADR 0087): el A. Su asset-list no lleva `URI`, así
# que no tiene parte estándar: el player de fábrica, que igual lo pide (ADR 0091),
# no tiene nada que reproducir y lo saltea, y la librería lo saltea cuando
# ninguna opción entra en la capacidad.
#
# Y NO HAY TRAMO INVERTIDO POR CONSTRUCCIÓN (ADR 0082): los dos clientes leen el
# MISMO asset-list, con la duración de su break, así que entran y salen del break
# en el mismo segundo. `demo/stage-pair/test/medir-tramo-invertido.py` lo mide.
#
# ---------------------------------------------------------------------------
# LAS VARIABLES DE ENTORNO, Y PARA QUÉ EXISTEN
# ---------------------------------------------------------------------------
#   SRC          la playlist de entrada        (default content/primary/index.m3u8)
#   OUT          la playlist señalizada        (default, de stage.json)
#   SIGNALLING   dónde van los asset-lists     (default signalling)
#
# Las tres existen para que el test pueda correr ESTE script sobre una playlist
# mínima y contar lo que salió DE VERDAD, sin ffmpeg y sin los 30 MB de video.
# Leer el texto de este archivo y encontrar un printf que menciona una clase
# prueba que alguien la tipeó, no que la playlist salga con ella.
#
#   CONTROL_DURACION_CONCURRENTE=<s>   EL CONTROL, y sólo eso. Escribe la
#       DURATION de los asset-lists con esa duración en lugar de la de su break:
#       el player de fábrica reproduce el creativo hasta que termina y la
#       librería ubica la ventana con lo declarado, así que la medición del
#       tramo invertido tiene contra qué ponerse roja. No se usa en ninguna
#       corrida normal.
set -euo pipefail
cd "$(dirname "$0")/.."

DEMO=$(pwd)
SRC=${SRC:-content/primary/index.m3u8}
SIGNALLING=${SIGNALLING:-signalling}

leer() { node -e 'const s=require(process.argv[1]);let v=s;for(const k of process.argv[2].split("."))v=v[k];process.stdout.write(String(v))' "$DEMO/stage.json" "$1"; }

OUT=${OUT:-$(leer playlist)}

# La variable de la clase (ADR 0105): su nombre es a la vez el del parámetro de
# la URL, y sale de stage.json, que es donde lo leen también las páginas.
PARAMETRO=$(leer parametroDeClase)

[ -f "$SRC" ] || { echo "falta $SRC: correr ./scripts/preparar-contenido.sh" >&2; exit 1; }

PDT=$(/usr/bin/grep -m1 '^#EXT-X-PROGRAM-DATE-TIME:' "$SRC" | cut -d: -f2-)
[ -n "$PDT" ] || { echo "$SRC no tiene EXT-X-PROGRAM-DATE-TIME" >&2; exit 1; }

# LOS ASSET-LISTS, derivados de stage.json. La receta de cada campo vive en
# la cabecera de ese script (ADR 0061), que es donde la va a leer el que lo edite.
"$DEMO/scripts/escribir-asset-lists.mjs" "$DEMO/stage.json" "$SIGNALLING" > /dev/null

# Lo que un asset-list declara, LEÍDO DEL PROPIO ARCHIVO: la primera línea es el
# largo total en segundos -- la suma de las DURATION del Apéndice D.2, que es lo
# que el break dura -- y después una línea por aviso, `DURATION|type`, con el
# `type` del bloque o `linear` cuando el asset no trae bloque (ADR 0019).
#
# Se lee y no se escribe a mano porque el PLANNED-DURATION de los tags sale de
# acá: escrito fijo, un tag declara un número que puede no ser el de su lista, y
# eso es inerte para este player -- el rango concurrente lo arma
# `rangeOfExperiences` con las experiencias y no con el tag -- pero le miente a
# cualquier otro cliente que lea la playlist.
declaracion() { # $1 ruta del asset-list
  node -e '
    const fs = require("fs");
    const lista = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const assets = Array.isArray(lista.ASSETS) ? lista.ASSETS : [];
    const largo = (a) => Number(a.DURATION) || 0;
    const num = (v) => String(Number(v.toFixed(3)));
    const filas = [num(assets.reduce((s, a) => s + largo(a), 0))];
    for (const a of assets) {
      const item = a["X-AD-CREATIVE-SIGNALING"]?.payload?.[0];
      const tipo = item?.layoutOptions?.[0]?.type ?? item?.type ?? "linear";
      filas.push(num(largo(a)) + "|" + tipo);
    }
    process.stdout.write(filas.join("\n") + "\n");
  ' "$1"
}

# Los medios de las opciones del aviso, en orden, leídos del archivo: es lo que
# el cliente recibe para elegir, así que la tabla que se imprime lo lee y no lo
# deduce de stage.json.
medios() { # $1 ruta del asset-list concurrente
  node -e '
    const fs = require("fs"), path = require("path");
    const l = JSON.parse(fs.readFileSync(path.resolve(process.argv[1]), "utf8"));
    const item = l.ASSETS[0]["X-AD-CREATIVE-SIGNALING"].payload[0];
    const opciones = item.layoutOptions ?? [item];
    process.stdout.write(opciones.map((o) => o.layout.assets.map((a) => a.type).join("+")).join(", luego "));
  ' "$1"
}

suma() { awk -v a="$1" -v b="$2" 'BEGIN { printf "%s", a + b }'; }

# El tag de un break, apuntando al asset-list de ESE break, con la clase que el
# cliente elige por la URL.
#
# VA EN LA FORMA DE REEMPLAZO, y la forma es la AUSENCIA de X-RESUME-OFFSET: sin
# el atributo el primario retoma donde el aviso terminó, así que los dos panes se
# quedan en el mismo segundo del programa (ADR 0017). Entre las dos formas decidió
# una medición: con el atributo ausente hls.js 1.7.2 resuelve el punto de retorno
# contra el largo que MIDIÓ del aviso. Leído con la clase concurrente el atributo
# no significa nada, porque no hay nada interrumpido que reanudar (ADR 0016).
#
# SALVO EL BREAK SIN DEFAULT, que lleva X-RESUME-OFFSET=0 (ADR 0091). Su
# asset-list no tiene nada que reproducir, así que no hay aviso y el programa
# tiene que seguir desde donde estaba. Sin el atributo, hls.js 1.7.2 retoma en el
# fin del break --el inicio más el DURATION declarado--, un punto que no bajó
# porque paró de bufferear en el borde del break, y el video queda congelado en
# el último cuadro (medido: más de 40 s, sin evento fatal).
#
# DECLARA EL LARGO DEL ASSET-LIST, leído del archivo.
#
# EL PREROLL LLEVA `CUE="PRE"` (ADR 0102): cada cliente lo pone antes del
# programa, sea cual sea su START-DATE, y pide su asset-list al cargar. El
# START-DATE se escribe igual (offset 0, el instante del EXT-X-PROGRAM-DATE-TIME)
# porque la spec lo exige en todo Date Range.
#
# Y UN BREAK CON `CUE="ONCE"` (ADR 0104), el B: cada cliente lo saca después de
# reproducirlo.
#
# EL POSTROLL, `CUE="POST"` (ADR 0103): cada cliente lo pone después del fin del
# programa y pide su lista cuando el programa está bufereado hasta el fin. El
# START-DATE se escribe en los últimos segundos del programa porque la spec lo
# exige y ninguno de los dos lo usa.
tag() { # $1 id del break, $2 offset, $3 asset-list, $4 lineal ("si" o ""), $5 cue ("PRE" o "")
  local id=$1 offset=$2 lista=$3 lineal=$4 cue=${5:-} start largo retorno="" marca=""
  start=$(date -d "$PDT + $offset seconds" +"%Y-%m-%dT%H:%M:%S.%3N%z")
  largo=$(declaracion "$SIGNALLING/$lista" | head -1)
  [ -z "$cue" ] || marca=",CUE=\"$cue\""
  [ -n "$lineal" ] || retorno=',X-RESUME-OFFSET=0'
  printf '#EXT-X-DATERANGE:ID="AD-%s",CLASS="{$%s}",START-DATE="%s"%s,X-ASSET-LIST="/signalling/%s"%s,X-RESTRICT="SKIP",PLANNED-DURATION=%s\n' \
    "${id^^}" "$PARAMETRO" "$start" "$marca" "$lista" "$retorno" "$largo"
}

# El recorrido sale de stage.json: id, offset, duración, campaña, forma, el
# asset-list del break, si tiene default lineal y su CUE. Ni un segundo tipeado acá.
RECORRIDO=$(node -e '
  const s = require(process.argv[1]);
  process.stdout.write(s.breaks.map((b) =>
    [b.id, b.offset, b.duracion, b.campana, b.forma, b.concurrente, b.lineal ? "si" : "", b.cue ?? ""].join("|")
  ).join("\n") + "\n");
' "$DEMO/stage.json")

# La playlist: la definición de la variable y un tag por break, después de las
# cabeceras y antes del primer segmento, que es donde la especificación los
# admite. La definición va ANTES de los tags porque una referencia sólo se
# sustituye con una variable definida antes que ella (la spec, 6.3.1).
tags="#EXT-X-DEFINE:QUERYPARAM=\"$PARAMETRO\"
"
while IFS='|' read -r id offset duracion campana forma lista lineal cue; do
  [ -n "$id" ] || continue
  [ -f "$SIGNALLING/$lista" ] || { echo "falta $SIGNALLING/$lista" >&2; exit 1; }
  tags="$tags$(tag "$id" "$offset" "$lista" "$lineal" "$cue")
"
done <<< "$RECORRIDO"
# EL BREAK LINEAL TRADICIONAL, ESCRITO (ADR 0107): CLASS de Apple literal, sin la
# variable, así que los dos panes lo leen igual y lo reproduce hls.js en los dos
# (el nuestro con su maquinaria encendida, ADR 0106). Su hueco no se solapa con
# ningún break de `breaks` (ADR 0105), y lo verifica el test.
LINEAL=$(node -e '
  const b = require(process.argv[1]).breakLineal;
  if (b) process.stdout.write([b.id, b.offset, b.lista].join("|"));
' "$DEMO/stage.json")
if [ -n "$LINEAL" ]; then
  IFS='|' read -r lin_id lin_offset lin_lista <<< "$LINEAL"
  [ -f "$SIGNALLING/$lin_lista" ] || { echo "falta $SIGNALLING/$lin_lista" >&2; exit 1; }
  lin_start=$(date -d "$PDT + $lin_offset seconds" +"%Y-%m-%dT%H:%M:%S.%3N%z")
  tags="$tags$(printf '#EXT-X-DATERANGE:ID="AD-%s",CLASS="com.apple.hls.interstitial",START-DATE="%s",X-ASSET-LIST="/signalling/%s",X-RESTRICT="SKIP",PLANNED-DURATION=%s' \
    "${lin_id^^}" "$lin_start" "$lin_lista" "$(declaracion "$SIGNALLING/$lin_lista" | head -1)")
"
fi
mkdir -p "$(dirname "$OUT")"
awk -v tags="$tags" '
  /^#EXT-X-VERSION:/ { if (substr($0, 16) + 0 < 11) $0 = "#EXT-X-VERSION:11" }
  /^#EXTINF:/ && !hecho { printf "%s", tags; hecho = 1 }
  { print }
' "$SRC" > "$OUT"
echo "$OUT  ($(/usr/bin/grep -c '^#EXT-X-DATERANGE:' "$OUT") Date Ranges, CLASS=\"{\$$PARAMETRO}\")"
echo "$SIGNALLING/  ($(ls "$SIGNALLING" | /usr/bin/grep -c '^asset-list-break-') asset-lists del par)"

# ---------------------------------------------------------------------------
# EL RECORRIDO, que es la tabla con la que se graba y se mira.
# ---------------------------------------------------------------------------
echo
echo "El recorrido del par, sobre un programa de $(leer programa.largo) s:"
while IFS='|' read -r id offset duracion campana forma lista lineal cue; do
  [ -n "$id" ] || continue
  largo=$(declaracion "$SIGNALLING/$lista" | head -1)
  printf '  break %s  t=%3ss a %3ss  (%ss)  %-22s %s%s\n' \
    "${id^^}" "$offset" "$(suma "$offset" "$largo")" "$largo" "$(leer "formas.$forma.layout")" "$(leer "campanas.$campana.marca")" \
    "$(case "$cue" in
         PRE) echo '  CUE=PRE: los dos clientes piden su lista al cargar' ;;
         POST) echo '  CUE=POST: después del fin del programa, sólo como lineal; la lista se pide al bufferear hasta el fin' ;;
         ONCE) echo '  CUE=ONCE: después de reproducido, los dos clientes lo sacan; un seek de vuelta no lo repite' ;;
       esac)"
  if [ "$cue" = POST ]; then
    printf '      de fábrica   %-26s la parte estándar, a cuadro entero, cuando el programa termina\n' "$lista"
    printf '      librería     %-26s nunca el aviso no lineal: el lineal cuando el programa termina, o nada\n' "$lista"
  elif [ -n "$lineal" ]; then
    printf '      de fábrica   %-26s la parte estándar, a cuadro entero: el programa se reemplaza\n' "$lista"
    printf '      librería     %-26s %s; sin opción que entre, el lineal\n' "$lista" "$(medios "$SIGNALLING/$lista")"
  else
    printf '      de fábrica   %-26s sin parte estándar: hls.js lo saltea y el programa sigue\n' "$lista"
    printf '      librería     %-26s %s; sin opción que entre, se saltea\n' "$lista" "$(medios "$SIGNALLING/$lista")"
  fi
done <<< "$RECORRIDO"

if [ -n "$LINEAL" ]; then
  printf '  break %s  t=%3ss a %3ss  (%ss)  CLASS="com.apple.hls.interstitial", escrita\n' \
    "${lin_id^^}" "$lin_offset" "$(suma "$lin_offset" "$(declaracion "$SIGNALLING/$lin_lista" | head -1)")" \
    "$(declaracion "$SIGNALLING/$lin_lista" | head -1)"
  printf '      los dos      %-26s el lineal a cuadro entero, reproducido por hls.js (ADR 0107)\n' "$lin_lista"
fi

cat <<'TEXTO'

Los dos panes entran y salen de cada break con default EN EL MISMO SEGUNDO,
porque los dos leen el MISMO asset-list, con la duración de su break (ADR 0082,
ADR 0090). Lo mide demo/stage-pair/test/medir-tramo-invertido.py leyendo el
estado de los dos players, y su control es este mismo script corrido con
CONTROL_DURACION_CONCURRENTE.

El asset-list de cada break es el mismo para cualquier capacidad y para los dos
clientes: el player de fábrica lee su parte estándar y la librería el bloque de
encima, con sus dos opciones, video e imagen, y elige (ADR 0085). Cada una va
seguida de su gemela para el Roku, MP4 y PNG, cuando la pieza la tiene, que la
librería sólo alcanza si la original no carga (ADR 0096, 0097 y 0099).
TEXTO

# ---------------------------------------------------------------------------
# LA TERCERA PÁGINA, que tiene su propio señalizador (T-10)
# ---------------------------------------------------------------------------
# `race.html` corre sobre otro programa -- la carrera -- y sobre otras dos clases
# en la misma playlist, así que su señalización es otro script. La llamada está
# acá y no en `run.sh` porque ese archivo es del sdk y toma el nombre de la demo
# como argumento: el único gancho por demo es este script.
#
# SÓLO CUANDO LA SEÑALIZACIÓN VA A LA CARPETA DE LA DEMO, y la condición no es un
# adorno: el test de la señalización del par le pasa `SIGNALLING` a un temporal y
# cuenta los archivos que salieron, así que cinco archivos más ahí lo pondrían
# rojo por una causa que no es la suya. Cuando la carrera no está empaquetada, el
# señalizador lo dice y sigue: eso es un comando que falta, no un error.
if [ "$SIGNALLING" = signalling ]; then
  echo
  "$DEMO/scripts/senalizar-carrera.sh"
fi
