#!/usr/bin/env bash
# Empaqueta el contenido de la demo del multi view: el primario, el creativo del
# aviso concurrente, y las cinco vistas del catálogo.
#
# ESTE SCRIPT NO BAJA NADA. Las cuatro películas ya están en disco, bajadas por
# `demo/compatibility-pair/scripts/preparar-contenido.sh`, y esta demo las lee de
# ahí. Es la propiedad que hace que se pueda armar en una tarde, y es la
# diferencia con la demo de la carrera, que sí lleva ir a buscar material.
#
# Las cuatro obras son de la Blender Foundation bajo Creative Commons
# Attribution y la atribución está en CREDITS.md, copiada de la otra demo.
#
# El recipe de ffmpeg es `scripts/empaquetar-contenido.sh`, copia byte por byte
# del de `compatibility-pair`: 1280x720 a 30 fps, que es la configuración con la
# que la fase 01 midió que cinco elementos de video decodifican a la vez, que es
# exactamente lo que una grilla de cuatro más el primario necesita. No se le
# cambia un parámetro.
#
# Todo content/ está gitignoreado.
set -euo pipefail
cd "$(dirname "$0")/.."

# LAS FUENTES SON LAS DE LA OTRA DEMO Y SE LEEN DE AHÍ, sin copiarlas: son 660 MB
# y una copia es una copia que se desincroniza y que ocupa el doble.
F=../compatibility-pair/content/.fuentes

# Se chequea acá, con un mensaje que dice qué correr, porque lo que falla si no
# están es ffmpeg tres pasos más adelante, con un error sobre un archivo que
# nadie sabe de dónde tenía que salir.
faltan=()
for f in tos.mov caminandes.mp4 ed.mp4 sintel.mp4; do
  [ -s "$F/$f" ] || faltan+=("$f")
done
if [ ${#faltan[@]} -gt 0 ]; then
  echo "faltan las fuentes que esta demo no baja: ${faltan[*]}" >&2
  echo "  correr una vez:  ./demo/compatibility-pair/scripts/preparar-contenido.sh" >&2
  echo "  baja las cuatro películas de la Blender Foundation y las deja en" >&2
  echo "  demo/compatibility-pair/content/.fuentes/, que es de donde las lee ésta." >&2
  exit 1
fi

# EL PRIMARIO: tres minutos de Tears of Steel, la misma ventana que la otra demo
# y por las mismas razones, que son de la grabación: desde el minuto 4:30 no hay
# placas de créditos ni armas ni sangre, y la imagen cambia bastante entre calle,
# robot y laboratorio, que es lo que hace visible una composición dibujada
# encima. Ciento ochenta segundos es el recorrido entero: el aviso concurrente a
# los 20 y las dos ventanas de multi view.
./scripts/empaquetar-contenido.sh "$F/tos.mov" content/primary 270 180

# EL CREATIVO DEL AVISO CONCURRENTE, doce segundos. Es el mismo tramo de
# Caminandes que la otra demo usa para su `cornerOverlay`, y el tramo no es
# arbitrario: salió de un barrido de luminancia que buscó la ventana de doce
# segundos cuyo instante más oscuro es el más claro posible. Reusar esa elección
# es gratis y el argumento sigue valiendo.
./scripts/empaquetar-contenido.sh "$F/caminandes.mp4" content/overlay 35 12

# LAS CINCO VISTAS DEL CATÁLOGO, y son cinco tramos DISTINTOS de tres películas.
# Que dos cajas muestren la misma película en momentos distintos no es una
# limitación del material: es lo que hace evidente que son dos decodificadores y
# no una imagen duplicada, que es justamente lo que esta demo tiene que mostrar.
#
# Se empaquetan de sesenta segundos, que es la ventana más larga de las dos. La
# ventana corta dura 55 y las cajas se bajan cuando se cierra, así que un asset
# más largo que su ventana no se ve: lo que sí se vería es uno más corto.
#
# Y HAY UNO MÁS CORTO, QUE ES SINTEL. El trailer dura 52,2 s medidos con ffprobe,
# así que su vista termina 2,8 s antes de que cierre la ventana de 55 y no llega
# a la de 60. Por eso Sintel sólo se ofrece en la ventana corta. No se arregla
# repitiendo el material ni alargándolo, porque las dos cosas son generar, y esta
# demo no genera nada: se dice y se acepta.
#
# Sintel llega además con las bandas negras quemadas en el cuadro, así que se le
# sacan antes de recortar, igual que en la otra demo.
./scripts/empaquetar-contenido.sh "$F/caminandes.mp4" content/view-caminandes-a 10 60
./scripts/empaquetar-contenido.sh "$F/caminandes.mp4" content/view-caminandes-b 84 60
./scripts/empaquetar-contenido.sh "$F/ed.mp4"         content/view-ed-a          0 60
./scripts/empaquetar-contenido.sh "$F/ed.mp4"         content/view-ed-b         15 60
./scripts/empaquetar-contenido.sh "$F/sintel.mp4"     content/view-sintel        0 60 1280:544:0:88

echo
echo "contenido listo en content/"
