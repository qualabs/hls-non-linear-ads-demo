#!/usr/bin/env bash
# Trae el material y lo empaqueta: el plate del partido con el paquete de canal
# encima, y los cuatro creativos del minuto.
#
# DOS MITADES CON DOS PROCEDENCIAS, y las dos están dichas en CREDITS.md:
#
#   EL PLATE son clips amateur de Pexels, bajo la Pexels License, armados en tres
#   actos —juego, parada del juego, juego— con el paquete de canal ficticio quemado
#   encima. Se bajan y el armado es determinista, así que nada de eso va en git.
#
#   LOS CREATIVOS son nuestros: lo pictórico generado y la tipografía escrita como
#   SVG (ADR 0045). Las fuentes generadas SÍ están en git, en
#   graphics/creativos/fuentes/, porque una generación no se repite y sin ellas la
#   demo sólo correría en la máquina donde se generaron.
#
# El chequeo de cuadro de cada clip del plate y el chequeo de vestido comercial de
# cada pieza generada están en la evidencia de las tasks T-03 y T-05 de la fase 08.
# No son formalidades: de seis candidatos de metraje, cinco no pasaron.
#
# Las descargas quedan cacheadas en content/.fuentes/ para que reempaquetar no
# vuelva a bajarlas. Todo content/ está gitignoreado.
set -euo pipefail
cd "$(dirname "$0")/.."

F=content/.fuentes
mkdir -p "$F"

baja() { # $1 url, $2 archivo
  [ -s "$F/$2" ] && { echo "ya está: $2"; return; }
  echo "bajando $2 ..."
  curl -fL --retry 3 -o "$F/$2" "$1"
}

# LOS CLIPS DEL PLATE, de Pexels, bajo la Pexels License y sin atribución exigida.
# Cada uno pasó el chequeo de cuadro y lo que se miró de cada uno está escrito en la
# evidencia de la T-03. Los títulos de un banco de stock no dicen nada sobre
# derechos: lo que decide es mirar los cuadros.
baja https://www.pexels.com/download/video/31370180/ 31370180.mp4
baja https://www.pexels.com/download/video/9502518/  9502518.mp4
baja https://www.pexels.com/download/video/9517718/  9517718.mp4
baja https://www.pexels.com/download/video/9441632/  9441632.mp4

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
mkdir -p "$F/creativos"
for f in kalto-shoe.jpg meridia-coast.jpg neonectar-8s.mp4; do
  [ -s "$F/creativos/$f" ] || cp "graphics/creativos/fuentes/$f" "$F/creativos/$f"
done
./scripts/creativos.sh

echo
echo "contenido listo en content/"
