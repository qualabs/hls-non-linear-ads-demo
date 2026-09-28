#!/usr/bin/env bash
# Escribe la señalización de esta demo: los asset-lists y LA PLAYLIST, con los
# mismos segmentos del programa más los EXT-X-DATERANGE de cada break.
#
# Corre en cada arranque, y no es una comodidad: el START-DATE de cada tag se
# resuelve contra el EXT-X-PROGRAM-DATE-TIME de la propia playlist (ADR 0005), y
# ese reloj es la hora de pared del empaquetado. Una playlist señalizada fija en
# git apunta al pasado la próxima vez que alguien empaqueta el contenido.
#
# ---------------------------------------------------------------------------
# UNA PLAYLIST, CUALQUIERA SEA LA CAPACIDAD
# ---------------------------------------------------------------------------
# Es el ADR 0085. El control de la página declara la capacidad en dos ejes, los
# dos VIAJAN DE VERDAD en la petición del asset-list, y del otro lado no hay
# servidor: las demos se publican como archivos estáticos en un bucket. El
# asset-list de cada break contesta lo mismo siempre -- el aviso con sus dos
# opciones, video e imagen -- y quien elige es la librería. Hasta la fase 14
# había una playlist por escalón con la respuesta horneada por valor (ADR 0083).
#
# UN BREAK NO TIENE DEFAULT (ADR 0087): el A. No lleva tag lineal, así que el
# pane de fábrica no pone nada, y su asset concurrente no lleva `URI`, así que
# cuando ninguna opción entra en la capacidad la librería lo saltea.
#
# ---------------------------------------------------------------------------
# UN ASSET-LIST LINEAL POR BREAK, Y ES DONDE MUERE EL TRAMO INVERTIDO
# ---------------------------------------------------------------------------
# Es el ADR 0082. demo/compatibility-pair/ señaliza sus cinco breaks contra UN
# único asset-list lineal de 12 s, con un quinto break concurrente de 48: de ahí
# sale que durante 12 de esos 48 segundos el pane de fábrica ya volvió al
# programa y el nuestro sigue tapado, o sea la comparación al revés. Acá cada
# break trae su propio lineal, con la duración de SU break y con el creativo 16:9
# de SU campaña, así que los dos panes entran y salen del break en el mismo
# segundo -- y el START-DATE compartido del ADR 0007 no hubo que tocarlo.
#
# ---------------------------------------------------------------------------
# LAS VARIABLES DE ENTORNO, Y PARA QUÉ EXISTEN
# ---------------------------------------------------------------------------
#   SRC          la playlist de entrada     (default content/primary/index.m3u8)
#   OUT          la playlist señalizada     (default, de stage.json)
#   SIGNALLING   dónde van los asset-lists  (default signalling)
#
# Las tres existen para que el test pueda correr ESTE script sobre una playlist
# mínima y contar lo que salió DE VERDAD, sin ffmpeg y sin los 30 MB de video.
# Leer el texto de este archivo y encontrar un printf que menciona una clase
# prueba que alguien la tipeó, no que la playlist salga con ella.
#
#   CONTROL_DURACION_CONCURRENTE=<s>   EL CONTROL, y sólo eso. Escribe los
#       asset-lists concurrentes con esa duración en lugar de la de su break,
#       dejando los lineales con la suya: reproduce a propósito el defecto de
#       compatibility-pair para que la medición del tramo invertido tenga contra
#       qué ponerse roja. No se usa en ninguna corrida normal.
set -euo pipefail
cd "$(dirname "$0")/.."

DEMO=$(pwd)
SRC=${SRC:-content/primary/index.m3u8}
SIGNALLING=${SIGNALLING:-signalling}

leer() { node -e 'const s=require(process.argv[1]);let v=s;for(const k of process.argv[2].split("."))v=v[k];process.stdout.write(String(v))' "$DEMO/stage.json" "$1"; }

OUT=${OUT:-$(leer playlists.par)}

# Las dos clases del ADR 0007, escritas una sola vez. La de Apple es la que el
# pane de fábrica reproduce; la concurrente es la que reproduce el nuestro. En
# HLS la clase se compara por igualdad exacta de string y no hay herencia
# (ADR 0009), así que las dos tienen que estar en la misma playlist para que cada
# cliente se quede con la suya.
CLASE_LINEAL=com.apple.hls.interstitial
CLASE_CONCURRENTE=com.qualabs.hls.concurrentInterstitial

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
      const tipo = item?.options?.[0]?.type ?? item?.type ?? "linear";
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
    const opciones = item.options ?? [item];
    process.stdout.write(opciones.map((o) => o.layout.assets.map((a) => a.type).join("+")).join(", luego "));
  ' "$1"
}

suma() { awk -v a="$1" -v b="$2" 'BEGIN { printf "%s", a + b }'; }

# Un break son dos tags con el MISMO START-DATE (ADR 0007), cada uno con su ID y
# su asset-list.
#
# EL TAG LINEAL VA EN LA FORMA DE REEMPLAZO, y la forma es la AUSENCIA de
# X-RESUME-OFFSET: sin el atributo el primario retoma donde el aviso terminó, así
# que un pedazo del programa no se ve y los dos panes se quedan en el mismo
# segundo del programa (ADR 0017). Escrito en 0 pide la otra cosa -- el primario
# retoma donde lo interrumpieron -- y el pane de fábrica se atrasa la duración del
# aviso en cada break. Entre las dos formas decidió una medición: con el atributo
# ausente hls.js 1.7.2 resuelve el punto de retorno contra el largo que MIDIÓ del
# aviso, que es lo que sigue siendo cierto si el aviso cambia de largo.
#
# El X-RESUME-OFFSET del tag concurrente no significa nada, porque no hay nada
# interrumpido que reanudar (ADR 0016), y se escribe como en las demás demos.
#
# CADA TAG DECLARA EL LARGO DE SU PROPIO ASSET-LIST. Acá los dos coinciden en los
# breaks que tienen los dos, y ésa es toda la diferencia con compatibility-pair.
#
# UN BREAK SIN DEFAULT NO LLEVA EL TAG LINEAL (ADR 0087): `$4` llega vacío y sale
# sólo el concurrente.
par_de_tags() { # $1 id del break, $2 offset, $3 lista concurrente, $4 lista lineal o vacío
  local id=$1 offset=$2 lista=$3 lineal=$4 start largo_c largo_l
  start=$(date -d "$PDT + $offset seconds" +"%Y-%m-%dT%H:%M:%S.%3N%z")
  largo_c=$(declaracion "$SIGNALLING/$lista" | head -1)
  if [ -n "$lineal" ]; then
    largo_l=$(declaracion "$SIGNALLING/$lineal" | head -1)
    printf '#EXT-X-DATERANGE:ID="AD-%s-LINEAR",CLASS="%s",START-DATE="%s",X-ASSET-LIST="/signalling/%s",X-RESTRICT="SKIP",PLANNED-DURATION=%s\n' \
      "${id^^}" "$CLASE_LINEAL" "$start" "$lineal" "$largo_l"
  fi
  printf '#EXT-X-DATERANGE:ID="AD-%s-CONCURRENT",CLASS="%s",START-DATE="%s",X-ASSET-LIST="/signalling/%s",X-RESUME-OFFSET=0,X-SNAP="OUT,IN",X-RESTRICT="SKIP",PLANNED-DURATION=%s\n' \
    "${id^^}" "$CLASE_CONCURRENTE" "$start" "$lista" "$largo_c"
}

# El recorrido sale de stage.json: id, offset, duración, campaña, forma y los
# nombres de los tres asset-lists del break. Ni un segundo tipeado acá.
RECORRIDO=$(node -e '
  const s = require(process.argv[1]);
  process.stdout.write(s.breaks.map((b) =>
    [b.id, b.offset, b.duracion, b.campana, b.forma, b.concurrente, b.lineal ?? ""].join("|")
  ).join("\n") + "\n");
' "$DEMO/stage.json")

# Una playlist por escalón: los mismos segmentos, los mismos START-DATE, y lo
# único que cambia es a qué asset-list concurrente apunta cada break.
escribir_playlist() { # $1 salida
  local salida=$1 tags=""
  while IFS='|' read -r id offset duracion campana forma lista lineal; do
    [ -n "$id" ] || continue
    for f in "$lista" $lineal; do
      [ -f "$SIGNALLING/$f" ] || { echo "falta $SIGNALLING/$f" >&2; exit 1; }
    done
    tags="$tags$(par_de_tags "$id" "$offset" "$lista" "$lineal")
"
  done <<< "$RECORRIDO"
  mkdir -p "$(dirname "$salida")"
  # Los tags van después de las cabeceras y antes del primer segmento, que es
  # donde la especificación los admite.
  awk -v tags="$tags" '
    /^#EXTINF:/ && !hecho { printf "%s", tags; hecho = 1 }
    { print }
  ' "$SRC" > "$salida"
  echo "$salida  ($(/usr/bin/grep -c '^#EXT-X-DATERANGE:' "$salida") Date Ranges)"
}

escribir_playlist "$OUT"
echo "$SIGNALLING/  ($(ls "$SIGNALLING" | /usr/bin/grep -c '^asset-list-\(break\|linear\)-') asset-lists del par)"

# ---------------------------------------------------------------------------
# EL RECORRIDO, que es la tabla con la que se graba y se mira.
# ---------------------------------------------------------------------------
echo
echo "El recorrido del par, sobre un programa de $(leer programa.largo) s:"
while IFS='|' read -r id offset duracion campana forma lista lineal; do
  [ -n "$id" ] || continue
  largo=$(declaracion "$SIGNALLING/$lista" | head -1)
  printf '  break %s  t=%3ss a %3ss  (%ss)  %-22s %s\n' \
    "${id^^}" "$offset" "$(suma "$offset" "$largo")" "$largo" "$(leer "formas.$forma.layout")" "$(leer "campanas.$campana.marca")"
  if [ -n "$lineal" ]; then
    printf '      de fábrica   %-26s aviso lineal, el programa se reemplaza\n' "$lineal"
    printf '      librería     %-26s %s; sin opción que entre, el lineal\n' "$lista" "$(medios "$SIGNALLING/$lista")"
  else
    printf '      de fábrica   %-26s sin tag lineal: no hay default y el programa sigue\n' "-"
    printf '      librería     %-26s %s; sin opción que entre, se saltea\n' "$lista" "$(medios "$SIGNALLING/$lista")"
  fi
done <<< "$RECORRIDO"

cat <<'TEXTO'

Los dos panes entran y salen de cada break con default EN EL MISMO SEGUNDO,
porque el lineal de cada break dura lo que ese break (ADR 0082). No hay tramo
invertido: es lo único que esta demo hace distinto de compatibility-pair en
este punto, y es medible -- demo/stage-pair/test/medir-tramo-invertido.py lo mide leyendo el
estado de los dos players, y su control es este mismo script corrido con
CONTROL_DURACION_CONCURRENTE.

El asset-list de cada break es el mismo para cualquier capacidad, y entre sus
dos opciones cambia UNA sola cosa: el `type` y el `uri` del asset del aviso.
Mismo layout, mismo viewport, mismo zDepth, misma campaña, misma duración
(ADR 0084). Quien elige es la librería (ADR 0085).
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
