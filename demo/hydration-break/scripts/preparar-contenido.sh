#!/usr/bin/env bash
# Trae el material y lo empaqueta: el plate del partido con el paquete de canal
# encima, y los cuatro creativos del minuto.
#
# ESTE SCRIPT NO BAJA NI GENERA NADA: empaqueta lo que `setup-content.sh` dejó en
# content/.fuentes/. La división es una decisión de Nicolás y la razón es del
# repositorio: **el repositorio no carga video**, ni el metraje del partido ni el
# spot generado, así que traerlos es un paso aparte que se corre una vez y que
# puede costar plata. Las imágenes generadas sí están versionadas, en
# graphics/creativos/fuentes/, porque son livianas.
#
# DOS MITADES CON DOS PROCEDENCIAS, y las dos están dichas en CREDITS.md:
#
#   EL PLATE son clips amateur de Pexels, bajo la Pexels License, armados en tres
#   actos —juego, parada del juego, juego— con el paquete de canal ficticio quemado
#   encima.
#
#   LOS CREATIVOS son nuestros: lo pictórico generado y la tipografía escrita como
#   SVG (ADR 0045).
#
# El chequeo de cuadro de cada clip del plate y el chequeo de vestido comercial de
# cada pieza generada están en la evidencia de las tasks T-03 y T-05 de la fase 08.
# No son formalidades: de seis candidatos de metraje, cinco no pasaron.
#
# Todo content/ está gitignoreado.
set -euo pipefail
cd "$(dirname "$0")/.."

F=content/.fuentes
mkdir -p "$F"

# LO QUE SETUP-CONTENT TIENE QUE HABER DEJADO. Se chequea acá y con un mensaje que
# dice qué correr, porque lo que falla si no está es ffmpeg tres pasos más adelante,
# con un error sobre un archivo que nadie sabe de dónde tenía que salir.
faltan=()
for f in 31370180.mp4 9502518.mp4 9517718.mp4 9441632.mp4; do
  [ -s "$F/$f" ] || faltan+=("$f")
done
[ -s "$F/creativos/neonectar-8s.mp4" ] || faltan+=("creativos/neonectar-8s.mp4")

if [ ${#faltan[@]} -gt 0 ]; then
  echo "falta el material que no está en el repositorio: ${faltan[*]}" >&2
  echo "  correr una vez:  ./demo/hydration-break/scripts/setup-content.sh" >&2
  echo "  baja los clips del partido y genera el spot lineal con Vertex AI." >&2
  exit 1
fi

# Las imágenes generadas SÍ están en el repositorio, así que se copian y no se bajan.
mkdir -p "$F/creativos"
for f in kalto-shoe.jpg meridia-coast.jpg; do
  [ -s "$F/creativos/$f" ] || cp "graphics/creativos/fuentes/$f" "$F/creativos/$f"
done

# EL PLATE: tres actos, con el paquete de canal ficticio quemado encima. Los dos
# pasos están en scripts propios porque son los dos que hacen que esto se lea como
# una transmisión y no como un video de cancha, y porque el chequeo de cuadro vive
# con ellos.
#
# Los largos de los tres actos salen de plate.json (ADR 0044), que es el mismo
# archivo del que el script de señalización saca dónde poner el break.
mkdir -p "$F/plate"
./scripts/armar-plate.sh "$F/plate/crudo.mp4"
./scripts/paquete-de-canal.sh "$F/plate/crudo.mp4" "$F/plate/con-paquete.mp4"

LARGO=$(node -e 'process.stdout.write(String(require("./plate.json").largo))')
./scripts/empaquetar-contenido.sh "$F/plate/con-paquete.mp4" content/primary 0 "$LARGO"

# LOS CREATIVOS DEL MINUTO, en su propio script porque el reparto de herramientas del
# ADR 0045 y el tamaño exacto de cada caja son de ahí. Tres son video y uno es una
# imagen fija, que es la capacidad que este minuto demuestra (ADR 0046): el mecanismo
# acepta las dos cosas y la demo lo dice en pantalla en lugar de en un README.
./scripts/creativos.sh

echo
echo "contenido listo en content/"
