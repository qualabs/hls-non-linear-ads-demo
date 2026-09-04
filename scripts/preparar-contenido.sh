#!/usr/bin/env bash
# Baja el material y lo empaqueta: el VOD primario y tres avisos cortos.
#
# Todo el material es de las películas abiertas de la Blender Foundation, bajo
# Creative Commons Attribution. Es footage real y con la licencia clara, que es
# lo que una demo que se graba y se muestra necesita. Big Buck Bunny quedó
# descartado por pedido de Nicolás. La atribución que la licencia exige está en
# CREDITS.md y en la página.
#
# Las fuentes quedan cacheadas en content/.fuentes/ para que reempaquetar no
# vuelva a bajar 380 MB. Todo content/ está gitignoreado.
set -euo pipefail
cd "$(dirname "$0")/.."

F=content/.fuentes
mkdir -p "$F"

baja() { # $1 url, $2 archivo
  [ -s "$F/$2" ] && { echo "ya está: $2"; return; }
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

# El primario: tres minutos de Tears of Steel. Tres minutos alcanzan para el
# recorrido de la demo, que en su forma final son cinco layouts uno detrás del
# otro (T-12), y no tanto como para que empaquetarlo sea una espera.
#
# La ventana arranca en el minuto 4:30 y no en el principio de la película por
# dos razones, y las dos son de la grabación: ahí no hay placas de créditos ni
# armas ni sangre, y la imagen cambia bastante entre calle, robot y laboratorio,
# que es lo que hace visible un aviso dibujado encima.
./scripts/empaquetar-contenido.sh "$F/tos.mov" content/primary 270 180

# Los avisos: doce segundos cada uno, de tres películas distintas, para que en
# pantalla se distingan entre sí y del primario de un vistazo. Sintel llega con
# las bandas negras quemadas en el cuadro, así que se le sacan antes de recortar.
./scripts/empaquetar-contenido.sh "$F/sintel.mp4"     content/adA 20 12 1280:544:0:88
./scripts/empaquetar-contenido.sh "$F/caminandes.mp4" content/adB 35 12
./scripts/empaquetar-contenido.sh "$F/ed.mp4"         content/adC 52 12

echo
echo "contenido listo en content/"
