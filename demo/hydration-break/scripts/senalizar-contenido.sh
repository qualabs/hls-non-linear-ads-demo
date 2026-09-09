#!/usr/bin/env bash
# Escribe la playlist señalizada: los mismos segmentos que el plate, más UN
# EXT-X-DATERANGE de la clase concurrente, en el segundo donde arranca la parada
# del juego.
#
# UN SOLO TAG Y NO UN PAR. Esta demo no lleva el par de compatibilidad
# (ADR 0043): la comparación entre la forma tradicional y la concurrente está
# adentro del minuto —el tercero de los cuatro avisos es el lineal— así que va en
# el tiempo y no en el espacio. Dos players en pantalla harían el argumento de la
# otra demo, que es `compatibility-pair`, y esa se queda como está.
#
# El aviso lineal es un ASSET sin bloque de layout, que es lo que el
# requerimiento 4 del documento del evento pide para la compatibilidad hacia
# atrás y lo que el ADR 0019 ya reproduce por el camino único: su propio URI a
# cuadro entero, con el programa corriendo detrás.
#
# Por qué es un paso generado y no un archivo en git: el START-DATE se resuelve
# contra el EXT-X-PROGRAM-DATE-TIME de la propia playlist (ADR 0005), y ese reloj
# es la hora de pared del empaquetado. Un START-DATE fijo en git apunta al pasado
# la próxima vez que alguien empaqueta el contenido.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=content/primary/index.m3u8
OUT=content/primary/con-daterange.m3u8
LISTA=asset-list-hydration-break.json

[ -f "$SRC" ] || { echo "falta $SRC: correr ./scripts/preparar-contenido.sh" >&2; exit 1; }
[ -f "signalling/$LISTA" ] || { echo "falta signalling/$LISTA" >&2; exit 1; }

PDT=$(grep -m1 '^#EXT-X-PROGRAM-DATE-TIME:' "$SRC" | cut -d: -f2-)
[ -n "$PDT" ] || { echo "$SRC no tiene EXT-X-PROGRAM-DATE-TIME" >&2; exit 1; }

# EL CORRIMIENTO DE LA PARADA SE LEE Y NO SE ESCRIBE (ADR 0044). Es el mismo
# número que usa el script que empaqueta el plate, y vive en un solo lugar:
# `plate.json`. Escrito a mano en los dos, la demo entera se corre de lugar la
# primera vez que alguien reedita el plate, y lo hace sin que nada falle —el
# break entra sobre juego corriendo en lugar de sobre la parada—.
#
# El suite de la demo chequea que el break arranque acá, que es lo que hace que
# esto no sea un acuerdo verbal entre dos scripts.
PARADA=$(node -e 'process.stdout.write(String(require("./plate.json").paradaEn))')

# Lo que el asset list declara, leído del propio archivo: el largo total del
# break —la suma de las DURATION del Apéndice D.2— y una línea por aviso con su
# largo y su tipo, con `linear` cuando el asset no trae bloque.
#
# Se lee y no se escribe a mano porque el PLANNED-DURATION del tag sale de acá.
# Escrito fijo, el tag declara un largo que miente a cualquiera que lo lea.
declaracion() { # $1 ruta del asset-list
  node -e '
    const fs = require("fs");
    const lista = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const assets = Array.isArray(lista.ASSETS) ? lista.ASSETS : [];
    const largo = (a) => Number(a.DURATION) || 0;
    const num = (v) => String(Number(v.toFixed(3)));
    const filas = [num(assets.reduce((s, a) => s + largo(a), 0))];
    for (const a of assets) {
      const bloque = a["X-AD-CREATIVE-SIGNALING"]?.payload?.[0];
      const tipo = bloque?.type ?? "linear";
      const cajas = bloque?.layout?.assets ?? [];
      const medios = [...new Set(cajas.map((c) => c.type))].join("+") || "-";
      filas.push([num(largo(a)), tipo, medios].join("|"));
    }
    process.stdout.write(filas.join("\n") + "\n");
  ' "$1"
}

suma() { awk -v a="$1" -v b="$2" 'BEGIN { printf "%s", a + b }'; }

LARGO_BREAK=$(declaracion "signalling/$LISTA" | head -1)
START=$(date -d "$PDT + $PARADA seconds" +"%Y-%m-%dT%H:%M:%S.%3N%z")

TAG=$(printf '#EXT-X-DATERANGE:ID="HYDRATION-BREAK",CLASS="com.qualabs.hls.concurrentInterstitial",START-DATE="%s",X-ASSET-LIST="/signalling/%s",X-RESUME-OFFSET=0,X-SNAP="OUT,IN",X-RESTRICT="SKIP",PLANNED-DURATION=%s\n' \
  "$START" "$LISTA" "$LARGO_BREAK")

# El tag va después de las cabeceras y antes del primer segmento, que es donde
# la especificación lo admite.
awk -v tag="$TAG" '
  /^#EXTINF:/ && !hecho { printf "%s\n", tag; hecho = 1 }
  { print }
' "$SRC" > "$OUT"

echo "$OUT  ($(grep -c '^#EXT-X-DATERANGE:' "$OUT") Date Range)"
echo
echo "El minuto, que es la curva de intrusión del ADR 0043:"
printf '  break  t=%3ss a %3ss  (%ss)  la parada del juego\n' \
  "$PARADA" "$(suma "$PARADA" "$LARGO_BREAK")" "$LARGO_BREAK"
cursor=$PARADA
i=0
while IFS='|' read -r dur tipo medios; do
  i=$((i + 1))
  fin=$(suma "$cursor" "$dur")
  case "$tipo" in
    linear) detalle="a cuadro entero, el programa corre detrás" ;;
    *)      detalle="concurrente, el partido se sigue viendo" ;;
  esac
  printf '      aviso %s  t=%3ss a %3ss  %-18s %-32s %s\n' \
    "$i" "$cursor" "$fin" "$tipo" "$detalle" "$medios"
  cursor=$fin
done < <(declaracion "signalling/$LISTA" | tail -n +2)
echo
echo "Tres formas de aviso y no dos: el primero es una IMAGEN FIJA (ADR 0046), el"
echo "tercero es el lineal a cuadro entero por el camino del ADR 0019, y los otros"
echo "dos son video concurrente. Es lo que este minuto demuestra."
echo
echo "Antes de grabar, y esto se hace UNA vez al empezar: encender el audio con el"
echo "control de arriba a la derecha de la imagen, que lo dibuja la librería"
echo "(ADR 0015). La página arranca muteada por la política de autoplay del browser."
echo "Los avisos concurrentes entran callados sobre un partido que se sigue"
echo "escuchando, y el aviso a cuadro entero es el único que se queda con el audio"
echo "(ADR 0019)."
