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
#
# El segundo por donde entra cada ventana no es arbitrario y no es el mismo que
# eligió la T-05: los tres creativos se barrieron enteros midiendo la luminancia
# media de cada medio segundo, con la formula Rec.709 sobre el cuadro escalado a
# 64x36, y de cada fuente se tomo la ventana de doce segundos cuyo instante MAS
# OSCURO es el mas claro posible. El minimo y no el promedio, porque lo que
# arruina una captura es un instante negro adentro de la ventana y no un
# promedio bajo: la T-10 y la T-11 se encontraron con eso dos veces. Los numeros
# del barrido estan en la evidencia de la T-12, y lo que cambio contra la T-05
# es Sintel —de 20 s, con dos cortes a negro adentro, a 28,5 s— y el teaser de
# Elephants Dream, que pasa a su mejor ventana y sigue siendo insuficiente:
# ninguno de sus 75 segundos llega a 46 de luminancia sobre 255.
./scripts/empaquetar-contenido.sh "$F/sintel.mp4"     content/adA 28.5 12 1280:544:0:88
./scripts/empaquetar-contenido.sh "$F/caminandes.mp4" content/adB 35 12
./scripts/empaquetar-contenido.sh "$F/ed.mp4"         content/adC 31 12

# Los dos creativos de imagen del layout LBox image, que es el unico de los
# cinco del documento de requerimientos cuyo asset no es un video (ADR 0012).
# Un solo cuadro cada uno, con el mismo encuadre que el resto del material
# —recorte centrado a 16:9, sin deformar, la politica del ADR 0013—.
#
# El cuadro no lo elige la luminancia sola, y esto se aprendio probando: el
# instante mas claro de Caminandes es su placa de agradecimientos, que mide 180
# sobre 255 y en pantalla se lee como que el player esta mostrando los creditos.
# Asi que el criterio es el de siempre —claro y con el entorno claro, para que no
# sea un flash— pero mirando la imagen, y con el sujeto al medio, porque la caja
# del LBox se come el 60 % del asset por los costados (ADR 0013).
#
# Y hay un segundo criterio, que tambien salio de mirar: el cuadro tiene que
# venir de una escena que NO este en la ventana de doce segundos del video de la
# misma pelicula. La primera eleccion fue el cuadro mas claro de Sintel, que cae
# adentro de su propia ventana, y en pantalla el LBox image quedaba igual al
# LBox video: la misma duna en la misma barra. La diferencia entre los dos
# layouts es que uno se mueve y el otro no, y con la misma imagen en los dos no
# se ve.
saca_una_imagen() { # $1 fuente, $2 segundo, $3 destino, $4 crop previo opcional
  mkdir -p "$(dirname "$3")"
  ffmpeg -hide_banner -loglevel error -y -ss "$2" -i "$1" -frames:v 1 \
    -vf "${4:+crop=$4,}scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" \
    -q:v 3 "$3"
  echo "$3  ($(du -h "$3" | cut -f1))"
}
saca_una_imagen "$F/caminandes.mp4"  25.0 content/adImageA/creative.jpg
saca_una_imagen "$F/sintel.mp4"       6.5 content/adImageB/creative.jpg 1280:544:0:88

echo
echo "contenido listo en content/"
