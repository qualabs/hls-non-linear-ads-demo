#!/usr/bin/env bash
# Empaqueta como VOD en HLS lo que las tasks de contenido dejaron en content/.fuentes/: el
# programa de la carrera y las cámaras de a bordo que haya.
#
# ESTE SCRIPT NO BAJA NI GENERA NADA, y la división es la misma que la demo del partido: el
# repositorio no carga video, así que traer el material es un paso aparte que se corre a
# mano y que cuesta plata. Acá ese paso son `armar-programa.sh` y `armar-camara.sh`, que
# pegan los clips de Veo, emparejan los niveles y dejan los mp4 y su audio mezclado.
#
# LAS FUENTES SON DE ESTA DEMO Y NO DE OTRA, que es la diferencia con
# `demo/multiview-offer/`: aquélla lee las cuatro películas de la Blender Foundation que
# `compatibility-pair` ya tiene en disco. Acá todo el material es generado y es nuestro.
#
# ----------------------------------------------------------------------------------------
# EL CATÁLOGO ES EL QUE HAY, Y ESA ES LA PROPIEDAD QUE HACE QUE LA ETAPA 3 NO TOQUE NADA
# ----------------------------------------------------------------------------------------
# `race.json` declara las seis cámaras de la carrera; este script empaqueta las que tengan
# su mp4 en content/.fuentes/. Hoy es una. Cuando la etapa 3 deje las otras cinco, se
# empaquetan solas y el asset-list las ofrece solo, sin que nadie edite un script ni una
# lista. Lo mismo vale al revés: una demo con una sola cámara corre igual, porque la grilla
# de dos cajas ejercita el mecanismo entero.
#
# Todo content/ está gitignoreado.
set -euo pipefail
cd "$(dirname "$0")/.."

DEMO=$(pwd)
F=content/.fuentes

leer() { node -e 'process.stdout.write(String(require("'"$DEMO"'/race.json")["'"$1"'"]))'; }
LARGO=$(leer largo)
VENTANA=$(leer ofertaDura)
FPS=$(leer fps)
# Los ids de las cámaras, en el orden en que race.json las declara, que es el orden en que
# el selector las va a listar.
mapfile -t FEEDS < <(node -e 'require("'"$DEMO"'/race.json").feeds.forEach(f=>console.log(f.id))')

# EL GUARD, con un mensaje que dice qué correr. Sin él lo que falla es ffmpeg tres pasos más
# adelante, con un error sobre un archivo que nadie sabe de dónde tenía que salir.
faltan=()
[ -s "$F/programa.mp4" ] || faltan+=("$F/programa.mp4  ->  ./scripts/armar-programa.sh")
[ -s "audio/programa.m4a" ] || faltan+=("audio/programa.m4a  ->  ./scripts/armar-programa.sh")
if [ ${#faltan[@]} -gt 0 ]; then
  echo "falta el material que no está en el repositorio:" >&2
  printf '  %s\n' "${faltan[@]}" >&2
  echo >&2
  echo "  armar-programa.sh pega los catorce clips de content/.fuentes/programa/ con el" >&2
  echo "  relato encima. Los clips los genera ./scripts/generar-programa.py con Vertex AI," >&2
  echo "  y eso cuesta plata: el detalle está en la task T-03 de la fase 13." >&2
  exit 1
fi

# LAS CÁMARAS QUE HAY. Una cámara sin su mp4 no se empaqueta y no se ofrece; si no hay
# ninguna, la demo no tiene nada que ofrecer y eso sí es un error.
DISPONIBLES=()
for id in "${FEEDS[@]}"; do
  cam=${id#view-}
  if [ -s "$F/$cam.mp4" ] && [ -s "audio/$cam.m4a" ]; then DISPONIBLES+=("$id"); fi
done
if [ ${#DISPONIBLES[@]} -eq 0 ]; then
  echo "no hay ninguna cámara en $F: la oferta quedaría vacía" >&2
  echo "  correr por cámara:  ./scripts/armar-camara.sh <nombre>" >&2
  echo "  pega los ocho clips de content/.fuentes/camaras/<nombre>/, que genera" >&2
  echo "  ./scripts/generar-camara.py con Vertex AI. Cuesta plata: ver la task T-05." >&2
  exit 1
fi

# EL PROGRAMA, que es el contenido principal y el que nunca se detiene. Los 112 s salen de
# race.json y no de acá: es el mismo número que lee el script de señalización para saber que
# la ventana entra, y el mismo que el chequeo de largos va a exigirle a la playlist.
echo "### el programa"
./scripts/empaquetar-contenido.sh "$F/programa.mp4" content/primary 0 "$LARGO" "" 1280 720 "$FPS" audio/programa.m4a

# LAS CÁMARAS. Cada una dura exactamente lo que la ventana -- una vista más corta deja la
# caja vacía antes del final, que es lo que le pasa a Sintel en la demo de la fase 11 -- y
# eso se produjo así: 8 clips x 192 cuadros. Acá se empaqueta ese largo y después se mide.
echo
echo "### las cámaras (${#DISPONIBLES[@]} de ${#FEEDS[@]})"
for id in "${DISPONIBLES[@]}"; do
  cam=${id#view-}
  ./scripts/empaquetar-contenido.sh "$F/$cam.mp4" "content/$id" 0 "$VENTANA" "" 1280 720 "$FPS" "audio/$cam.m4a"
done

# Y LA MEDICIÓN, que es lo que convierte el largo de cada pieza de una intención en un dato.
# Va acá y no en un paso aparte porque un chequeo que hay que acordarse de correr es un
# chequeo que no se corre.
echo
./scripts/verificar-largos.mjs

echo
echo "contenido listo en content/"
