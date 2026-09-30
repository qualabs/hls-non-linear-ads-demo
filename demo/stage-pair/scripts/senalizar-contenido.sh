#!/usr/bin/env bash
# Escribe la señalización de esta demo: los asset-lists y LOS DOS MANIFESTS,
# cada uno con los mismos segmentos del programa más los EXT-X-DATERANGE de su
# clase.
#
# Corre en cada arranque, y no es una comodidad: el START-DATE de cada tag se
# resuelve contra el EXT-X-PROGRAM-DATE-TIME de la propia playlist (ADR 0005), y
# ese reloj es la hora de pared del empaquetado. Una playlist señalizada fija en
# git apunta al pasado la próxima vez que alguien empaqueta el contenido.
#
# ---------------------------------------------------------------------------
# DOS MANIFESTS, UNO POR CLASE, Y UN ASSET-LIST POR BREAK PARA LOS DOS
# ---------------------------------------------------------------------------
# Es el ADR 0090, que supersede al 0007. El manifest de INTERSTITIALS lleva sólo
# los tags `com.apple.hls.interstitial` y lo carga el player de fábrica; el
# CONCURRENTE lleva sólo los `com.qualabs.hls.concurrentInterstitial` y lo carga
# el nuestro. Los dos tags de un break apuntan al MISMO asset-list: su parte
# estándar la reproduce hls.js, y el bloque de encima lo lee nuestra librería,
# que cae a esa parte estándar cuando no puede dibujar. La capacidad viaja en el
# pedido y la librería filtra (ADR 0085).
#
# UN BREAK NO TIENE DEFAULT (ADR 0087): el A. Su asset-list no lleva `URI`, así
# que no tiene parte estándar: el player de fábrica, que igual lo pide porque el
# manifest de interstitials lo nombra (ADR 0091), no tiene nada que reproducir y
# lo saltea, y la librería lo saltea cuando ninguna opción entra en la capacidad.
#
# Y NO HAY TRAMO INVERTIDO POR CONSTRUCCIÓN (ADR 0082): los dos clientes leen el
# MISMO asset-list, con la duración de su break, así que entran y salen del break
# en el mismo segundo. `demo/stage-pair/test/medir-tramo-invertido.py` lo mide.
#
# ---------------------------------------------------------------------------
# LAS VARIABLES DE ENTORNO, Y PARA QUÉ EXISTEN
# ---------------------------------------------------------------------------
#   SRC                la playlist de entrada        (default content/primary/index.m3u8)
#   OUT_INTERSTITIAL   el manifest de interstitials  (default, de stage.json)
#   OUT_CONCURRENTE    el manifest concurrente       (default, de stage.json)
#   SIGNALLING         dónde van los asset-lists     (default signalling)
#
# Las cuatro existen para que el test pueda correr ESTE script sobre una playlist
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

OUT_INTERSTITIAL=${OUT_INTERSTITIAL:-$(leer playlists.interstitial)}
OUT_CONCURRENTE=${OUT_CONCURRENTE:-$(leer playlists.concurrente)}

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

# El tag de cada clase, para un break, apuntando al asset-list de ESE break.
#
# EL TAG DE INTERSTITIALS VA EN LA FORMA DE REEMPLAZO, y la forma es la AUSENCIA
# de X-RESUME-OFFSET: sin el atributo el primario retoma donde el aviso terminó,
# así que los dos panes se quedan en el mismo segundo del programa (ADR 0017).
# Entre las dos formas decidió una medición: con el atributo ausente hls.js 1.7.2
# resuelve el punto de retorno contra el largo que MIDIÓ del aviso.
#
# SALVO EL BREAK SIN DEFAULT, que lleva X-RESUME-OFFSET=0 (ADR 0091). Su
# asset-list no tiene nada que reproducir, así que no hay aviso y el programa
# tiene que seguir desde donde estaba. Sin el atributo, hls.js 1.7.2 retoma en el
# fin del break --el inicio más el DURATION declarado--, un punto que no bajó
# porque paró de bufferear en el borde del break, y el video queda congelado en
# el último cuadro (medido: más de 40 s, sin evento fatal).
#
# El X-RESUME-OFFSET del tag concurrente no significa nada, porque no hay nada
# interrumpido que reanudar (ADR 0016), y se escribe como en las demás demos.
#
# LOS DOS DECLARAN EL LARGO DEL MISMO ASSET-LIST, leído del archivo.
tag_de() { # $1 clase (interstitial|concurrente), $2 id del break, $3 offset, $4 asset-list, $5 lineal ("si" o "")
  local clase=$1 id=$2 offset=$3 lista=$4 lineal=$5 start largo retorno=""
  start=$(date -d "$PDT + $offset seconds" +"%Y-%m-%dT%H:%M:%S.%3N%z")
  largo=$(declaracion "$SIGNALLING/$lista" | head -1)
  if [ "$clase" = interstitial ]; then
    [ -n "$lineal" ] || retorno=',X-RESUME-OFFSET=0'
    printf '#EXT-X-DATERANGE:ID="AD-%s-LINEAR",CLASS="%s",START-DATE="%s",X-ASSET-LIST="/signalling/%s"%s,X-RESTRICT="SKIP",PLANNED-DURATION=%s\n' \
      "${id^^}" "$CLASE_LINEAL" "$start" "$lista" "$retorno" "$largo"
  else
    printf '#EXT-X-DATERANGE:ID="AD-%s-CONCURRENT",CLASS="%s",START-DATE="%s",X-ASSET-LIST="/signalling/%s",X-RESUME-OFFSET=0,X-SNAP="OUT,IN",X-RESTRICT="SKIP",PLANNED-DURATION=%s\n' \
      "${id^^}" "$CLASE_CONCURRENTE" "$start" "$lista" "$largo"
  fi
}

# El recorrido sale de stage.json: id, offset, duración, campaña, forma, el
# asset-list del break y si tiene default lineal. Ni un segundo tipeado acá.
RECORRIDO=$(node -e '
  const s = require(process.argv[1]);
  process.stdout.write(s.breaks.map((b) =>
    [b.id, b.offset, b.duracion, b.campana, b.forma, b.concurrente, b.lineal ? "si" : ""].join("|")
  ).join("\n") + "\n");
' "$DEMO/stage.json")

# Un manifest por clase: los mismos segmentos y los mismos START-DATE, y cada
# break en los dos. El break sin default también tiene su tag de Apple (ADR 0091):
# nombra el mismo asset-list, que no tiene parte estándar, y hls.js lo saltea.
escribir_playlist() { # $1 salida, $2 clase (interstitial|concurrente)
  local salida=$1 clase=$2 tags=""
  while IFS='|' read -r id offset duracion campana forma lista lineal; do
    [ -n "$id" ] || continue
    [ -f "$SIGNALLING/$lista" ] || { echo "falta $SIGNALLING/$lista" >&2; exit 1; }
    tags="$tags$(tag_de "$clase" "$id" "$offset" "$lista" "$lineal")
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

escribir_playlist "$OUT_INTERSTITIAL" interstitial
escribir_playlist "$OUT_CONCURRENTE" concurrente
echo "$SIGNALLING/  ($(ls "$SIGNALLING" | /usr/bin/grep -c '^asset-list-break-') asset-lists del par)"

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
    printf '      de fábrica   %-26s la parte estándar, a cuadro entero: el programa se reemplaza\n' "$lista"
    printf '      librería     %-26s %s; sin opción que entre, el lineal\n' "$lista" "$(medios "$SIGNALLING/$lista")"
  else
    printf '      de fábrica   %-26s sin parte estándar: hls.js lo saltea y el programa sigue\n' "$lista"
    printf '      librería     %-26s %s; sin opción que entre, se saltea\n' "$lista" "$(medios "$SIGNALLING/$lista")"
  fi
done <<< "$RECORRIDO"

cat <<'TEXTO'

Los dos panes entran y salen de cada break con default EN EL MISMO SEGUNDO,
porque los dos leen el MISMO asset-list, con la duración de su break (ADR 0082,
ADR 0090). Lo mide demo/stage-pair/test/medir-tramo-invertido.py leyendo el
estado de los dos players, y su control es este mismo script corrido con
CONTROL_DURACION_CONCURRENTE.

El asset-list de cada break es el mismo para cualquier capacidad y para los dos
clientes: el player de fábrica lee su parte estándar y la librería el bloque de
encima, con sus dos opciones, video e imagen, y elige (ADR 0085).
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
