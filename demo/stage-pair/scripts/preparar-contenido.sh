#!/usr/bin/env bash
# Prepara el contenido primario de la demo stage-pair: SPARKS, de Netflix Open
# Content, transcodificado y empaquetado a HLS.
#
# La fuente es Sparks_4096x2160_5994fps_SDR.mp4 (419.744.507 B, 229,888 s,
# H.264 Main L5.1 yuv420p 4096x2160 a 59,94, SDR, audio AAC-HE 2.0 a 48 k),
# bajo Creative Commons Attribution 4.0. La atribución que la licencia pide
# está en CREDITS.md de esta demo. Que sea SDR es lo que hace barata la
# transcodificación: no hay tone-mapping, que es el paso que convierte una
# recodificación en un problema de color.
#
# La fuente queda cacheada en content/.fuentes/ para que reempaquetar no vuelva
# a bajar 0,4 GB. Todo content/ está gitignoreado, y content/.fuentes/ además
# NO se publica (ver el CLAUDE.md de la raíz).
#
# La URL es http y no https a propósito: el bucket se llama
# download.opencontent.netflix.com y los puntos del nombre rompen el
# certificado del endpoint de S3, así que por https la conexión no se
# establece. Es el mismo defecto que el CLAUDE.md de la raíz describe para los
# buckets de GCS, visto desde el otro lado.
#
# ── El corte del programa, y de dónde sale el número ─────────────────────────
#
# El programa de la demo es el tramo previo a los créditos. Dónde empiezan no se
# asume: se midió con la luminancia media del cuadro (signalstats YAVG sobre el
# cuadro escalado a 64x36), barriendo la fuente entre los segundos 192 y 202:
#
#   193,0 s  YAVG 106,6  ← arranca el fundido a negro
#   198,0 s  YAVG  16,0  ← negro pleno (16 es el negro del rango limitado)
#   199,0 s  YAVG  17,1  ← sube y se queda clavada: es la placa fija "SPARKS",
#                          o sea el primer cuadro de los créditos
#
# Así que el corte va en 198,0 s: el programa entra entero, con su fundido a
# negro, y termina en el último cuadro antes de la placa. El relevamiento de la
# fase decía "~195 s" y la medición dice 199,0; queda acá el número medido, que
# es el que manda.
set -euo pipefail
cd "$(dirname "$0")/.."

F=content/.fuentes
FUENTE="$F/Sparks_4096x2160_5994fps_SDR.mp4"
URL=http://download.opencontent.netflix.com/TechblogAssets/Sparks/encodes/Sparks_4096x2160_5994fps_SDR.mp4
TAM_ESPERADO=419744507

# El corte del programa: el último instante antes de la placa de créditos,
# medido arriba.
CORTE=198.0

mkdir -p "$F"
if [ ! -s "$FUENTE" ]; then
  echo "bajando SPARKS (0,4 GB) ..."
  curl -fL --retry 3 -o "$FUENTE" "$URL"
fi

# La fuente se verifica por tamaño antes de usarse. Una descarga cortada deja un
# archivo que ffmpeg abre igual y que produce un programa más corto sin avisar,
# que es justo el modo de falla que un empaquetado no detecta.
TAM=$(stat -c %s "$FUENTE")
[ "$TAM" = "$TAM_ESPERADO" ] || {
  echo "ERROR: $FUENTE mide $TAM B y tiene que medir $TAM_ESPERADO B." >&2
  exit 1
}

./scripts/empaquetar-contenido.sh "$FUENTE" content/primary 0 "$CORTE"

# El largo del programa se mide SUMANDO LOS #EXTINF de la playlist empaquetada,
# que es la única medición que vale: ni el contenedor de origen ni el -t de
# arriba. Ese número es el que vive en stage.json como programa.largo.
LARGO=$(awk -F: '/^#EXTINF:/ {s += $2} END {printf "%.3f", s}' content/primary/index.m3u8)
echo "largo del programa por suma de #EXTINF: $LARGO s"
