#!/usr/bin/env bash
# Escribe la playlist señalizada: los mismos segmentos que el primario, más los
# dos EXT-X-DATERANGE, uno de la clase de Apple y uno de la clase concurrente,
# con el mismo START-DATE. Es la forma de la playlist que la T-02 midió.
#
# Por qué es un paso generado y no un archivo en git: el START-DATE se resuelve
# contra el EXT-X-PROGRAM-DATE-TIME de la propia playlist (ADR 0005), y ese
# reloj es la hora de pared del empaquetado. Un START-DATE fijo en git apunta al
# pasado la próxima vez que alguien empaqueta el contenido.
#
# Los dos tags valen lo mismo escritos como DateRange Object del Apéndice H
# (ADR 0006): CLASS y START-DATE presentes, IDs únicos, y todos los atributos
# X- con valores escalares.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=content/primary/index.m3u8
OUT=content/primary/con-daterange.m3u8
# Segundo de reproducción donde arranca la experiencia. 20 s deja ver contenido
# antes del aviso, que es lo que la grabación necesita.
OFFSET=${1:-20}
# Cuál de los layouts apunta el Date Range de la clase concurrente. Hay un
# asset-list por layout en ./signalling/, y esto es el interruptor entre ellos:
# `cornerOverlay` es el mínimo de la T-07, `squeezebackLShape` el squeezeback de
# la T-10 y `multiView` el multiview de la T-11, uno por cada mecanismo del
# ADR 0008. El recorrido de los cinco en una sola playlist es la T-12.
LAYOUT=${2:-cornerOverlay}
LIST=signalling/asset-list-$LAYOUT.json
[ -f "$LIST" ] || { echo "no hay asset-list para '$LAYOUT': falta $LIST" >&2; exit 1; }

[ -f "$SRC" ] || { echo "falta $SRC: correr ./scripts/preparar-contenido.sh" >&2; exit 1; }

PDT=$(grep -m1 '^#EXT-X-PROGRAM-DATE-TIME:' "$SRC" | cut -d: -f2-)
[ -n "$PDT" ] || { echo "$SRC no tiene EXT-X-PROGRAM-DATE-TIME" >&2; exit 1; }
START=$(date -d "$PDT + $OFFSET seconds" +"%Y-%m-%dT%H:%M:%S.%3N%z")

# Los tags van después de las cabeceras y antes del primer segmento, que es
# donde la especificación los admite y donde la T-02 los puso.
awk -v start="$START" -v list="/$LIST" '
  /^#EXTINF:/ && !hecho {
    print "#EXT-X-DATERANGE:ID=\"AD-1-LINEAR\",CLASS=\"com.apple.hls.interstitial\",START-DATE=\"" start "\",X-ASSET-LIST=\"/signalling/asset-list-linear.json\",X-RESUME-OFFSET=0,X-RESTRICT=\"SKIP\",PLANNED-DURATION=12"
    print "#EXT-X-DATERANGE:ID=\"AD-1-CONCURRENT\",CLASS=\"com.qualabs.hls.concurrentInterstitial\",START-DATE=\"" start "\",X-ASSET-LIST=\"" list "\",X-RESUME-OFFSET=0,X-SNAP=\"OUT,IN\",X-RESTRICT=\"SKIP\",PLANNED-DURATION=12"
    hecho = 1
  }
  { print }
' "$SRC" > "$OUT"

echo "$OUT  (START-DATE $START, t=${OFFSET}s, layout $LAYOUT)"
