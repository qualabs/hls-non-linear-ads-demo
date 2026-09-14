#!/usr/bin/env bash
# Escribe la playlist señalizada de esta demo -- los mismos segmentos que el programa más un
# EXT-X-DATERANGE -- y el asset-list que ese tag anuncia.
#
# UN SOLO BREAK Y UNA SOLA VENTANA. Las otras demos recorren varios; acá el recorrido es uno
# porque el argumento es otro: una carrera de 112 s en la que, a los 28, los relatores dicen
# que las cámaras están disponibles y la señalización abre una ventana de 64 s. No hay aviso
# concurrente, y no es un olvido: ésta es la única de las cuatro demos puramente editorial.
#
# ----------------------------------------------------------------------------------------
# LOS SEGUNDOS Y LOS NOMBRES SALEN DE race.json, Y ES LA RAZÓN POR LA QUE EXISTE ESE ARCHIVO
# ----------------------------------------------------------------------------------------
# Es el ADR 0044 aplicado de nuevo. `ofertaEn` lo leen los dos lados: este script, para
# saber dónde poner el START-DATE, y `armar-relato.mjs`, para saber dónde poner la línea del
# anuncio. Dos números tipeados en dos archivos se despegan el día que alguien mueve uno, y
# el defecto que sale de ahí es exactamente el que Nicolás nombró: el anuncio cae CERCA de la
# ventana en lugar de EN ella. Que caiga en ella lo mide `verificar-anuncio.mjs`.
#
# Los nombres de las vistas son el mismo caso con otra cara. La fila del selector es lo único
# que hace que elegir una cámara signifique algo, y el nombre que esa fila muestra sale del
# asset-list. Si el asset-list se escribiera a mano, el nombre viviría en dos lados.
#
# ----------------------------------------------------------------------------------------
# POR ESO EL ASSET-LIST SE GENERA, Y ES LA ÚNICA COSA QUE ESTA DEMO HACE DISTINTO DEL MOLDE
# ----------------------------------------------------------------------------------------
# `demo/multiview-offer/` lleva sus asset-lists escritos a mano en `signalling/`, y ahí está
# bien: sus vistas son tramos de películas que no tienen otra fuente. Acá la fuente existe y
# es `race.json`, así que la lista se deriva -- las vistas son las cámaras DECLARADAS que
# además están EMPAQUETADAS, en el orden en que race.json las declara.
#
# Lo que eso compra: la etapa 3 deja cinco cámaras más, `preparar-contenido.sh` las empaqueta
# y el catálogo pasa de una a seis sin que nadie edite un script ni una lista. Y con una sola
# cámara la demo corre igual: la grilla de dos cajas ejercita el mecanismo entero.
#
# ES UN PASO GENERADO Y NO UN ARCHIVO EN GIT, por lo mismo que en la demo de la fase 11: el
# START-DATE se resuelve contra el EXT-X-PROGRAM-DATE-TIME de la propia playlist (ADR 0005),
# y ese reloj es la hora de pared del empaquetado. Un START-DATE fijo en git apunta al pasado
# la próxima vez que alguien empaqueta.
#
# Cuatro variables de entorno, que existen para que el test pueda correr ESTE script sobre
# una playlist mínima y contar lo que salió DE VERDAD, sin ffmpeg y sin los 120 MB de video:
#
#   SRC      la playlist de entrada        (default content/primary/index.m3u8)
#   OUT      la playlist señalizada        (default content/primary/con-daterange.m3u8)
#   CONTENT  dónde se buscan las cámaras   (default content)
#   LISTA    dónde se escribe el asset-list (default signalling/asset-list-offer.json)
#
# Un chequeo que no puede fallar no es un chequeo, y contar los tags leyendo el texto de este
# archivo en lugar de su salida es exactamente eso.
set -euo pipefail
cd "$(dirname "$0")/.."

DEMO=$(pwd)
SRC=${SRC:-content/primary/index.m3u8}
OUT=${OUT:-content/primary/con-daterange.m3u8}
CONTENT=${CONTENT:-content}
LISTA=${LISTA:-signalling/asset-list-offer.json}

# La clase de multi view es la del ADR 0063: hermana de la concurrente y no una extensión,
# porque en HLS la clase se compara por igualdad exacta de string y el formato no tiene
# herencia. Acá se escribe una sola vez y el tag la toma de lo que el payload declara, igual
# que en la demo de la fase 11: lo que decide la clase es qué trae el asset-list.
CLASE_MULTIVIEW=com.qualabs.hls.multiViewInterstitial

[ -f "$SRC" ] || { echo "falta $SRC: correr ./scripts/preparar-contenido.sh" >&2; exit 1; }

PDT=$(/usr/bin/grep -m1 '^#EXT-X-PROGRAM-DATE-TIME:' "$SRC" | cut -d: -f2-)
[ -n "$PDT" ] || { echo "$SRC no tiene EXT-X-PROGRAM-DATE-TIME" >&2; exit 1; }

# EL ASSET-LIST, en la forma del ADR 0064 y sin un campo de más: `type: "offer"` en el nivel
# del bloque, un item de payload con `type: "multiViewOffer"`, y `views[]` con `id`, `name`,
# `type` y `uri`. SIN `viewport`, SIN `zDepth` y SIN `volume`, que son los tres campos que el
# que publica no puede decidir en una oferta -- los dos primeros porque dependen de cuántas
# cajas levantó quien mira, y el tercero porque el estado inicial de audio de una oferta no
# es una mezcla compuesta sino "sigue sonando el programa".
mkdir -p "$(dirname "$LISTA")"
node -e '
  const fs = require("fs"), path = require("path");
  const [demo, contenido, salida] = process.argv.slice(1);
  const race = JSON.parse(fs.readFileSync(path.join(demo, "race.json"), "utf8"));
  // Las cámaras declaradas que además están empaquetadas, en el orden de race.json.
  const views = race.feeds
    .filter((f) => fs.existsSync(path.join(contenido, f.id, "index.m3u8")))
    .map((f) => ({
      id: f.id,
      name: f.name,
      type: "application/vnd.apple.mpegurl",
      uri: `/content/${f.id}/index.m3u8`
    }));
  if (!views.length) { console.error("no hay ninguna cámara empaquetada en " + contenido); process.exit(1); }
  const lista = {
    ASSETS: [{
      // El URI de nivel superior que el Apéndice D.2 obliga lleva el uri de la primera
      // vista: es el repliegue del ADR 0019 para un cliente que no lee el bloque.
      URI: views[0].uri,
      DURATION: race.ofertaDura,
      "X-AD-CREATIVE-SIGNALING": {
        version: 2,
        type: "offer",
        payload: [{
          type: "multiViewOffer",
          start: 0,
          duration: race.ofertaDura,
          primaryName: race.primaryName,
          views
        }]
      }
    }]
  };
  fs.writeFileSync(salida, JSON.stringify(lista, null, 2) + "\n");
' "$DEMO" "$CONTENT" "$LISTA"

# Lo que el asset-list declara, leído del propio archivo y no escrito a mano.
#
# El PLANNED-DURATION del tag sale de acá -- la suma de las DURATION del Apéndice D.2, que es
# lo que la ventana dura --, y escrito fijo sería un dato que le miente a cualquier otro
# cliente que lea la playlist. Y LA CLASE TAMBIÉN SALE DE ACÁ: lo que decide si el tag es
# concurrente o de multi view es qué trae el payload, y el payload está en el archivo.
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

# El catálogo, para la tabla que se imprime: el contenido principal y cada vista, en el orden
# en que el selector las va a listar, que es el orden del array y no otro.
catalogo() { # $1 ruta del asset-list
  node -e '
    const fs = require("fs");
    const item = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
      .ASSETS?.[0]?.["X-AD-CREATIVE-SIGNALING"]?.payload?.[0];
    const filas = [(item?.primaryName ?? "(sin primaryName)") + "|el contenido principal"];
    for (const v of item?.views ?? []) filas.push(v.name + "|" + v.uri);
    process.stdout.write(filas.join("\n") + "\n");
  ' "$1"
}

leer() { node -e 'process.stdout.write(String(require("'"$DEMO"'/race.json")["'"$1"'"]))'; }
suma() { awk -v a="$1" -v b="$2" 'BEGIN { printf "%s", a + b }'; }

OFERTA_EN=$(leer ofertaEn)
LARGO=$(leer largo)

DECL=$(declaracion "$LISTA")
VENTANA=$(printf '%s\n' "$DECL" | head -1)
TIPO=$(printf '%s\n' "$DECL" | sed -n '2p' | cut -d'|' -f2)

# La clase sale del tipo del payload y no se tipea en el printf.
if [ "$TIPO" = multiViewOffer ]; then CLASE=$CLASE_MULTIVIEW; else
  echo "el payload de $LISTA declara '$TIPO' y esta demo sólo señaliza ofertas" >&2; exit 1; fi

# EL TAG NO LLEVA X-RESTRICT="SKIP", y es lo único que lo separa del de un aviso: en un aviso
# ese atributo dice que el break no se puede saltear; acá no hay break que saltear, porque el
# programa nunca se detiene y componer es opcional (ADR 0063). X-RESUME-OFFSET y X-SNAP se
# escriben y son inertes, por la razón del ADR 0016: no hay nada interrumpido que reanudar.
START=$(date -d "$PDT + $OFERTA_EN seconds" +"%Y-%m-%dT%H:%M:%S.%3N%z")
# EL X-ASSET-LIST ES UNA URL Y NO LA RUTA EN DISCO, aunque con los defaults las dos se
# escriban igual. La carpeta de la demo es la raíz de documentos del servidor (ADR 0022), así
# que lo que un cliente pide es siempre `/signalling/<archivo>`; `$LISTA` es dónde se escribe,
# y el test lo manda a un temporal. Atarlas era un acoplamiento que sólo se veía el día que
# alguien las separaba.
LISTA_URI="/signalling/$(basename "$LISTA")"
TAG=$(printf '#EXT-X-DATERANGE:ID="%s",CLASS="%s",START-DATE="%s",X-ASSET-LIST="%s",X-RESUME-OFFSET=0,X-SNAP="OUT,IN",PLANNED-DURATION=%s\n' \
  "BREAK-1-MULTIVIEW" "$CLASE" "$START" "$LISTA_URI" "$VENTANA")

# El tag va después de las cabeceras y antes del primer segmento, que es donde la
# especificación lo admite.
mkdir -p "$(dirname "$OUT")"
awk -v tags="$TAG
" '
  /^#EXTINF:/ && !hecho { printf "%s", tags; hecho = 1 }
  { print }
' "$SRC" > "$OUT"

CIERRA=$(suma "$OFERTA_EN" "$VENTANA")
echo "$OUT  ($(/usr/bin/grep -c '^#EXT-X-DATERANGE:' "$OUT") Date Range)"
# Cuántas de las cámaras declaradas quedaron ofrecidas. Se leen los dos números de sus dos
# archivos -- el asset-list recién escrito y race.json -- y no se cuentan a ojo.
OFRECIDAS=$(node -e '
  const fs = require("fs");
  const l = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const r = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const v = l.ASSETS[0]["X-AD-CREATIVE-SIGNALING"].payload[0].views.length;
  process.stdout.write(`${v} de ${r.feeds.length}`);
' "$LISTA" "$DEMO/race.json")
echo "$LISTA  ($OFRECIDAS cámaras empaquetadas)"

# ----------------------------------------------------------------------------------------
# LA HOJA DE SEÑALES, que es para quien mira la demo y para quien la graba.
#
# Esta demo no tiene guion de placas -- los relatores SON el guion, que es lo que la vuelve
# la única de las cuatro que puede anunciar el momento con una voz de adentro de la
# transmisión -- así que lo que hace falta es esto: los segundos, y qué hacer en cada uno.
# Los cuatro momentos se calculan sobre la ventana y no están tipeados: si la ventana cambia
# de largo, se corren solos.
# ----------------------------------------------------------------------------------------
echo
echo "El recorrido, sobre un programa de ${LARGO} s:"
printf '  la ventana   t=%ss a %ss  (%ss)  multi view   %s\n' "$OFERTA_EN" "$CIERRA" "$VENTANA" "$LISTA"
while IFS='|' read -r etiqueta detalle; do
  [ -n "$etiqueta" ] && printf '      %-24s %s\n' "$etiqueta" "$detalle"
done <<< "$(catalogo "$LISTA")"

SUBIR=$(awk -v a="$OFERTA_EN" -v w="$VENTANA" 'BEGIN{printf "%d", a + w*0.05}')
AGRANDAR=$(awk -v a="$OFERTA_EN" -v w="$VENTANA" 'BEGIN{printf "%d", a + w*0.30}')
VOLVER=$(awk -v a="$OFERTA_EN" -v w="$VENTANA" 'BEGIN{printf "%d", a + w*0.65}')
SALIR=$(awk -v a="$OFERTA_EN" -v w="$VENTANA" 'BEGIN{printf "%d", a + w*0.85}')

cat <<TEXTO

Qué mirar, y en qué segundo:

  t=0          arranca la carrera. ANTES DE NADA, encender el audio con el control de
               arriba a la derecha de la imagen, que lo dibuja la librería (ADR 0015):
               la página arranca muteada por la política de autoplay del browser, y esta
               demo se maneja de oído.

  t=$OFERTA_EN         los relatores dicen que las cámaras están disponibles y la ventana abre
               EN ESE MISMO SEGUNDO. La voz entra un instante antes que el tag, que es
               como pasa en una transmisión: primero se oye, después se ve. Aparece el
               anuncio y el selector se llena.

  t=$SUBIR         subir la cámara. La grilla pasa a dos cajas y el programa se corre a la
               suya: es una vista más y no un fondo.

  t=$AGRANDAR         agrandar la cámara. Acá está el beat de audio de esta demo y no de las
               otras tres: el foco es exclusivo (ADR 0026), así que la transmisión se
               calla y quedás adentro del auto, con su motor. Los dos están mezclados al
               mismo nivel a propósito, así que el cambio es de contenido y no de volumen.

  t=$VOLVER         desagrandar. Vuelve la grilla y vuelve el relato; el audio no se toca al
               desagrandar (ADR 0069).

  t=$SALIR         salir. Destildar la última vista y apretar el botón de una sola vista son
               el mismo evento: una caja no es una composición.

  t=$CIERRA         cierra la ventana. Si quedaba algo arriba, se baja solo y el programa
               vuelve como venía. La carrera sigue hasta $LARGO.
TEXTO
