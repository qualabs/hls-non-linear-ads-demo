#!/usr/bin/env bash
# Compone los cuatro creativos del minuto: el fondo pictórico generado, y encima la
# tipografía escrita a mano como SVG.
#
# EL REPARTO ES EL DEL ADR 0045 y sale de mediciones, no de comodidad. Lo pictórico
# se genera —la lata, el zapato, la costa—; la geometría y TODA la tipografía se
# escriben como SVG y se rasterizan con Chrome headless, que da alfa real y
# dimensiones exactas. Medido: una L generada volvió como la foto de una L dentro de
# un rectángulo negro, sin alfa y con las dimensiones equivocadas; el titular grande
# sale limpio del generador y el texto chico sobre el producto sale deformado.
#
# CADA CREATIVO SALE AL TAMAÑO EXACTO DE SU CAJA, y eso tampoco es preferencia: el
# ADR 0013 llena cada caja con recorte centrado y sin deformar, así que un creativo
# con otra relación de aspecto se recorta POR LOS BORDES, que es donde vive la
# tipografía. Los números salen de los `viewport` del asset list sobre 1280x720 y
# están en graphics/creativos/README.md.
#
# Y LOS TRES QUE SON VIDEO SE MUEVEN CON UN ZOOM DE ffmpeg Y NO CON UN GENERADOR DE
# VIDEO, que es la otra mitad del ADR 0045: el movimiento va sólo donde la tipografía
# puede irse de cuadro. Acá el fondo se mueve y la tipografía se queda quieta, así que
# no puede irse. En el spot lineal sí hay movimiento generado, y por eso su tipografía
# vuelve compuesta al final.
set -euo pipefail
cd "$(dirname "$0")/.."

# Las imágenes generadas. No están en git —`content/` está gitignoreado— y el script
# que las trajo desde el generador es la evidencia de la T-05.
G=content/.fuentes/creativos
[ -d "$G" ] || { echo "faltan las imágenes generadas en $G" >&2; exit 1; }

# LOS LARGOS SALEN DE plate.json Y NO DE ACÁ, que es el mismo criterio del ADR 0044
# aplicado a la duración de cada creativo. Un creativo más corto que su ventana **se
# corta**, y ese es el único defecto del mecanismo que nada en pantalla reporta: la
# librería lo avisa por consola y en cámara se ve como que el aviso terminó antes.
# Escritos acá a mano, un cambio del reparto los dejaría cortos sin que nada falle.
eval "$(node -e '
  const a = require("./plate.json").avisos;
  console.log(`D1=${a[0]}; D2=${a[1]}; D3=${a[2]}; D4=${a[3]}`);
')"
[ -n "${D1:-}" ] && [ -n "${D4:-}" ] || { echo "plate.json no declara los cuatro avisos" >&2; exit 1; }
echo "largos del reparto, de plate.json: $D1 / $D2 / $D3 / $D4"

TMP=$(mktemp -d "${TMPDIR:-/dev/shm}/creativos-XXXXXX")
trap 'rm -rf "$TMP"' EXIT

# `--default-background-color=00000000` es el flag sin el cual todo esto no sirve:
# sin él el fondo sale blanco en lugar de transparente.
rasteriza() { # $1 svg relativo a la demo, $2 png, $3 ancho, $4 alto
  rasteriza_abs "$PWD/$1" "$2" "$3" "$4"
}

rasteriza_abs() { # $1 svg con ruta absoluta, $2 png, $3 ancho, $4 alto
  google-chrome --headless=new --disable-gpu \
    --default-background-color=00000000 \
    --allow-file-access-from-files \
    --window-size="$3,$4" \
    --screenshot="$2" "$1" >/dev/null 2>&1
  [ -s "$2" ] || { echo "no se pudo rasterizar $1" >&2; exit 1; }
}

# Un creativo QUIETO: el fondo recortado a la caja, y la tipografía encima.
fijo() { # $1 imagen de fondo, $2 svg, $3 ancho, $4 alto, $5 salida
  rasteriza "$2" "$TMP/tipo.png" "$3" "$4"
  mkdir -p "$(dirname "$5")"
  ffmpeg -hide_banner -loglevel error -y -i "$1" -i "$TMP/tipo.png" \
    -filter_complex "[0:v]scale=$3:$4:force_original_aspect_ratio=increase,crop=$3:$4[bg];\
[bg][1:v]overlay=0:0:format=auto" \
    -frames:v 1 -q:v 2 "$5"
  echo "$5  ($3x$4)"
}

# Un creativo que SE MUEVE: el mismo fondo con un zoom lento, y la tipografía quieta
# encima. El zoom es de 1,0 a 1,08 a lo largo del clip, que a esta escala se lee como
# un empuje de cámara y no como un efecto.
movido() { # $1 imagen, $2 svg, $3 ancho, $4 alto, $5 segundos, $6 salida
  rasteriza "$2" "$TMP/tipo.png" "$3" "$4"
  local cuadros=$(( $5 * 30 ))
  # `-framerate 30` EN LA ENTRADA, y no es cosmético: `-loop 1` sirve la imagen a 25 fps,
  # y el `fps=30` de zoompan **reetiqueta** esos cuadros en lugar de remuestrearlos, así
  # que 24 s de imagen a 25 fps salen como 20 s de video a 30. El creativo quedaba corto
  # contra su ventana, que es exactamente el defecto que nada en pantalla reporta.
  ffmpeg -hide_banner -loglevel error -y -loop 1 -framerate 30 -t "$5" -i "$1" -i "$TMP/tipo.png" \
    -filter_complex "[0:v]scale=$(( $3 * 3 )):-1,\
zoompan=z='1+0.08*on/$cuadros':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=$3x$4:fps=30,\
setsar=1[bg];[bg][1:v]overlay=0:0:format=auto[v]" \
    -map "[v]" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -an "$6"
  echo "$6  ($3x$4, ${5}s)"
}

echo "== el banner, imagen fija (ADR 0046) =="
fijo "$G/meridia-coast.jpg" graphics/creativos/banner.svg 1280 216 content/adBanner/creative.jpg

# LA L, Y ES UN SOLO VIDEO A CUADRO ENTERO. Así la autora la industria y no como
# dos tiras: el aviso ocupa el viewport completo y va al fondo, y el contenido
# primario se encoge, mantiene su relación de aspecto, se ancla contra los bordes
# superior y derecho, y va arriba. El espectador percibe una banda en L; lo que hay
# es un video entero con el partido tapándole el centro.
#
# LOS NÚMEROS DE LAS DOS BANDAS SALEN DEL ASSET LIST Y NO DE ACÁ. Son la caja del
# primario vista del otro lado, así que si vivieran en los dos lados se despegarían
# y el creativo quedaría con tipografía debajo del partido o con una franja negra al
# costado -- sin que nada falle. Es el mismo criterio del ADR 0044 aplicado a la
# geometría de un creativo.
echo "== la L: un solo backplate, con las bandas leídas del asset list =="
eval "$(node -e '
  const lista = require("./signalling/asset-list-hydration-break.json");
  const capa = lista.ASSETS
    .map((a) => a["X-AD-CREATIVE-SIGNALING"]?.payload?.[0])
    .find((p) => p?.type === "squeezebackLShape")?.layout;
  const [top, right, bottom, left] = capa.primaryContent.viewport.split(/\s+/).map(Number);
  // La banda izquierda es el inset izquierdo del primario; la inferior, el de abajo.
  const L = Math.round(1280 * left / 100);
  const T = Math.round(720 * (100 - bottom) / 100);
  console.log(`L=${L}; T=${T}`);
')"
[ -n "${L:-}" ] && [ -n "${T:-}" ] || { echo "no se pudo leer la caja del primario del asset list" >&2; exit 1; }
echo "  banda izquierda 0..${L}px, banda inferior ${T}..720px"

sed -e "s/{{L}}/$L/g" -e "s/{{T}}/$T/g" \
    -e "s/{{TH}}/$((720 - T))/g" \
    -e "s/{{LM3}}/$((L - 3))/g" \
    -e "s/{{FY}}/$T/g" -e "s/{{FH}}/$((720 - T))/g" \
    -e "s/{{ARG1}}/$((T - 150))/g" -e "s/{{ARG2}}/$((T - 114))/g" -e "s/{{ARG3}}/$((T - 78))/g" \
    -e "s/{{PIE}}/$((T + 58))/g" \
    -e "s#{{FOTO}}#file://$PWD/$G/kalto-shoe.jpg#g" \
    graphics/creativos/l-backplate.svg.tpl > "$TMP/l-backplate.svg"

rasteriza_abs "$TMP/l-backplate.svg" "$TMP/l-tipo.png" 1280 720
ffmpeg -hide_banner -loglevel error -y -loop 1 -t "$D2" -i "$TMP/l-tipo.png" \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -r 30 -an "$TMP/l-backplate.mp4"

echo "== el overlay de cierre, video con la tipografía quieta =="
movido "$G/meridia-coast.jpg" graphics/creativos/overlay.svg 320 180 "$D4" "$TMP/overlay.mp4"

# EL SPOT LINEAL. El movimiento acá SÍ es generado —un clip de Veo de 8 s que toma la
# imagen fija como primer cuadro y la anima— y por eso su tipografía vuelve compuesta
# al final: está medido que el titular se va de cuadro cuando la cámara empuja, así
# que el último cuadro del clip generado no tiene tipografía. La placa la pone el SVG.
# El spot dura lo que el reparto dice, con los dos últimos segundos de placa compuesta:
# el clip generado se recorta a D3 menos 2. Sin el recorte el spot sale más largo que su
# ventana y el aviso no termina, que en cámara se ve como que se cortó.
echo "== el spot lineal: $(awk -v d="$D3" 'BEGIN { printf "%s", d - 2 }')s generados + 2 s de placa compuesta =="
rasteriza graphics/creativos/linear-endcard.svg "$TMP/endcard.png" 1920 1080
ffmpeg -hide_banner -loglevel error -y \
  -i "$G/neonectar-8s.mp4" -loop 1 -t 2 -i "$TMP/endcard.png" \
  -filter_complex "[0:v]scale=1280:720,fps=30,setsar=1,trim=duration=$(awk -v d="$D3" 'BEGIN { printf "%s", d - 2 }'),setpts=PTS-STARTPTS[a];\
[1:v]scale=1280:720,fps=30,setsar=1[b];[a][b]concat=n=2:v=1:a=0[v]" \
  -map "[v]" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -an "$TMP/lineal.mp4"

# EMPAQUETAR CADA CREATIVO AL TAMAÑO DE SU CAJA Y NO A 1280x720. Es el defecto
# silencioso de este paso: el creativo sale perfecto, se empaqueta a 16:9, y después el
# recorte centrado del ADR 0013 se lleva la mitad de la tipografía. Los dos últimos
# argumentos son el tamaño, y son los mismos números del SVG.
echo "== empaquetando los cuatro videos como HLS, cada uno al tamaño de su caja =="
./scripts/empaquetar-contenido.sh "$TMP/l-backplate.mp4" content/adL       0 "$D2" "" 1280 720
./scripts/empaquetar-contenido.sh "$TMP/overlay.mp4"     content/adOverlay 0 "$D4" "" 320  180
./scripts/empaquetar-contenido.sh "$TMP/lineal.mp4"      content/adLinear  0 "$D3" "" 1280 720

echo
echo "los cuatro creativos del minuto están en content/"
