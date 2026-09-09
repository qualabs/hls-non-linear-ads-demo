#!/usr/bin/env bash
# Baja el material y lo empaqueta: el plate del partido y los tres creativos del
# minuto que son video.
#
# EL PLATE YA ES EL PROPIO: partido amateur limpio de derechos, en tres actos, con
# el paquete de canal ficticio quemado encima. LOS CREATIVOS DEL MINUTO TODAVÍA NO:
# son las películas abiertas de la Blender Foundation hasta que la T-05 produzca
# los de las tres marcas de fantasía.
#
# Por qué la demo se construye contra un suplente en lugar de esperar el
# material: el guion se ancla a la señalización y no al material (ADR 0037), así
# que la página entera —las anclas, la placa, el botón, la estética— se puede
# construir y mirar con cualquier video adentro. Es la mitigación del riesgo R3
# de la fase, y es lo que hace que los dos frentes no se bloqueen.
#
# Cuando el material propio exista, lo que cambia es este archivo y nada más.
#
# Las fuentes quedan cacheadas en content/.fuentes/ para que reempaquetar no
# vuelva a bajar 380 MB. Todo content/ está gitignoreado.
set -euo pipefail
cd "$(dirname "$0")/.."

F=content/.fuentes
mkdir -p "$F"

# El caché de la demo vecina, si está. Es SÓLO un caché: la demo funciona sin
# él, bajando las fuentes como cualquier clon nuevo. Está acá porque las cuatro
# películas son las mismas y son 380 MB, no porque una demo dependa de la otra.
VECINA=../compatibility-pair/content/.fuentes

baja() { # $1 url, $2 archivo
  [ -s "$F/$2" ] && { echo "ya está: $2"; return; }
  if [ -s "$VECINA/$2" ]; then
    cp "$VECINA/$2" "$F/$2"
    echo "del caché de compatibility-pair: $2"
    return
  fi
  echo "bajando $2 ..."
  curl -fL --retry 3 -o "$F/$2" "$1"
}

baja https://download.blender.org/demo/movies/ToS/tears_of_steel_720p.mov tos.mov
baja https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4 sintel.mp4
baja https://download.blender.org/demo/movies/elephantsdream_teaser.mp4.zip ed.zip
baja https://download.blender.org/demo/movies/caminandes_gran_dillama.mp4.zip caminandes.zip

saca_del_zip() { # $1 zip, $2 destino
  [ -s "$F/$2" ] && return
  unzip -o -j -q "$F/$1" -d "$F/tmpzip" '*.mp4'
  mv "$(find "$F/tmpzip" -name '*.mp4' | head -1)" "$F/$2"
  rm -rf "$F/tmpzip"
}
saca_del_zip ed.zip ed.mp4
saca_del_zip caminandes.zip caminandes.mp4

# LOS CLIPS DEL PLATE, de Pexels, bajo la Pexels License y sin atribución
# exigida. Cada uno pasó el chequeo de cuadro y lo que se miró de cada uno está
# escrito en la evidencia de la T-03. Los títulos de un banco de stock no dicen
# nada sobre derechos: lo que decide es mirar los cuadros.
baja https://www.pexels.com/download/video/31370180/ 31370180.mp4
baja https://www.pexels.com/download/video/9502518/  9502518.mp4
baja https://www.pexels.com/download/video/9517718/  9517718.mp4
baja https://www.pexels.com/download/video/9441632/  9441632.mp4

# EL PLATE: tres actos de metraje amateur limpio de derechos, con el paquete de
# canal ficticio quemado encima. Los dos pasos están en scripts propios porque
# son los dos que hacen que esto se lea como una transmisión y no como un video
# de cancha, y porque el chequeo de cuadro vive con ellos.
#
# Los largos de los tres actos salen de plate.json (ADR 0044), que es el mismo
# archivo del que el script de señalización saca dónde poner el break.
mkdir -p "$F/plate"
./scripts/armar-plate.sh "$F/plate/crudo.mp4"
./scripts/paquete-de-canal.sh "$F/plate/crudo.mp4" "$F/plate/con-paquete.mp4"

LARGO=$(node -e 'process.stdout.write(String(require("./plate.json").largo))')
./scripts/empaquetar-contenido.sh "$F/plate/con-paquete.mp4" content/primary 0 "$LARGO"

# LOS CREATIVOS DEL MINUTO. Tres son video y uno es una imagen fija, que es la
# capacidad que este minuto demuestra (ADR 0046): el mecanismo acepta las dos
# cosas y la demo lo dice en pantalla en lugar de en un README.
#
# Cada uno se empaqueta al largo de su ventana o más. Un asset más corto que su
# ventana se corta, y ese es el único defecto del mecanismo que nada en pantalla
# reporta: la librería lo avisa por consola y no se ve en cámara.
#
# Las ventanas por donde entra cada uno son las que la fase 01 midió por
# luminancia, porque un instante negro adentro de la ventana arruina una
# captura.
./scripts/empaquetar-contenido.sh "$F/sintel.mp4"     content/adL       28.5 16 1280:544:0:88
./scripts/empaquetar-contenido.sh "$F/ed.mp4"         content/adLinear  31   10
./scripts/empaquetar-contenido.sh "$F/caminandes.mp4" content/adOverlay 35   16

# EL BANNER, que es una imagen y no un video (ADR 0046). Un solo cuadro, con el
# mismo encuadre que el resto del material.
#
# El cuadro se elige claro y con el entorno claro, y con el sujeto al medio: la
# caja del banner es una franja de 5,93 a 1 sobre un cuadro de 16 a 9, así que
# el recorte centrado del ADR 0013 se come casi todo el alto. Cuando el creativo
# propio exista (T-05), va a estar escrito como SVG a esa relación de aspecto
# exacta, que es lo que evita que el recorte se lleve la tipografía.
mkdir -p content/adBanner
ffmpeg -hide_banner -loglevel error -y -ss 25.0 -i "$F/caminandes.mp4" -frames:v 1 \
  -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" \
  -q:v 3 content/adBanner/creative.jpg
echo "content/adBanner/creative.jpg  ($(du -h content/adBanner/creative.jpg | cut -f1))"

echo
echo "contenido listo en content/  (los creativos del minuto son PROVISORIOS: ver el encabezado)"
