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
export G=content/.fuentes/creativos
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

export TMP=$(mktemp -d "${TMPDIR:-/dev/shm}/creativos-XXXXXX")
trap 'rm -rf "$TMP"' EXIT

# `--default-background-color=00000000` es el flag sin el cual todo esto no sirve:
# sin él el fondo sale blanco en lugar de transparente.
rasteriza() { # $1 svg relativo a la demo, $2 png, $3 ancho, $4 alto
  rasteriza_abs "$PWD/$1" "$2" "$3" "$4"
}

rasteriza_abs() { # $1 svg con ruta absoluta, $2 png, $3 ancho, $4 alto
  # EL SVG SE VALIDA COMO XML ANTES DE RASTERIZARLO, y esto no es celo: si el archivo no
  # parsea, Chrome **rasteriza su propia pantalla de error** y devuelve un PNG del tamaño
  # pedido, con contenido, sin código de salida distinto de cero y sin una sola línea en la
  # consola. El creativo sale mal y todo dice que salió bien.
  #
  # Ya pasó dos veces en esta fase, las dos por lo mismo: **un comentario XML no puede
  # contener `- -` pegados**, y los comentarios de estos archivos explican flags de línea
  # de comandos que empiezan justamente así. La primera vez el síntoma fue tres SVG que no
  # rasterizaban; la segunda, un banner cuya forma medida era un rectángulo que nadie había
  # dibujado. El arreglo va acá, en el instrumento, porque acordarse de no escribir dos
  # guiones es exactamente la clase de cosa que no se recuerda.
  python3 -c 'import sys, xml.etree.ElementTree as ET; ET.parse(sys.argv[1])' "$1" \
    || { echo "el SVG $1 no parsea como XML: Chrome rasterizaría su pantalla de error" >&2; exit 1; }
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

# EL BANNER, Y NO PASA POR ffmpeg. Es lo único de este script que se rasteriza directo al
# archivo final, y la razón es el alfa: `fijo()` compone la tipografía sobre un fondo opaco
# con `overlay`, que **aplana el canal alfa sin fallar**. El síntoma sería un rectángulo
# negro donde tiene que verse la cancha. Chrome headless con
# `--default-background-color=00000000` da alfa real, así que el camino corto es también el
# único que conserva la transparencia.
#
# LA GEOMETRÍA SALE DEL ASSET LIST, igual que la de la L: la caja del banner está declarada
# ahí y acá sólo se lee. Escritos en los dos lados se despegarían y el creativo saldría con
# otra relación de aspecto que la de su caja, que el ADR 0013 recorta por los bordes.
echo "== el banner: PNG con alfa, forma propia y caja despegada de los bordes (ADR 0046) =="

# La sustitución la hace node y no `sed` a propósito: los veinte números de la plantilla
# salen todos del alto de la caja, así que calcularlos y sustituirlos en el mismo lugar es
# lo que impide que uno quede escrito a mano contra otro calculado.
node -e '
  const fs = require("fs");
  const lista = require("./signalling/asset-list-hydration-break.json");
  const caja = lista.ASSETS
    .map((a) => a["X-AD-CREATIVE-SIGNALING"]?.payload?.[0])
    .find((p) => p?.type === "lowerThirdOverlay")?.layout.assets[0];
  if (!caja) { console.error("el asset list no declara el banner"); process.exit(1); }
  const [top, right, bottom, left] = caja.viewport.split(/\s+/).map(Number);
  const W = Math.round(1280 * (100 - left - right) / 100);
  const H = Math.round(720 * (100 - top - bottom) / 100);
  const r = (k) => Math.round(H * k);
  const lean = r(0.21);
  const v = {
    W, H, VIEWPORT: caja.viewport,
    MX: Math.round(1280 * left / 100), MY: Math.round(720 * bottom / 100),
    RATIO: (W / H).toFixed(2),
    LEAN: lean, WL: W - lean, LEANR: lean + r(0.055), RULE: r(0.055),
    FOTOX: Math.round(W * 0.50), FOTOW: Math.round(W * 0.56), FOTOH: H + 80,
    TX: r(0.60), T1: r(0.445), FS1: r(0.333), LS1: (H * 0.048).toFixed(1),
    TX2: r(0.63), T2: r(0.70), FS2: r(0.123), LS2: (H * 0.030).toFixed(1),
    BX: Math.round(W * 0.42), BY: r(0.34), BW: r(1.51), BH: r(0.32), BR: r(0.16),
    FS3: r(0.119),
    FOTO: "file://" + process.cwd() + "/" + process.env.G + "/meridia-coast.jpg"
  };
  v.BWM = Math.round(v.BW / 2);
  v.BTY = Math.round(v.BH * 0.66);
  let svg = fs.readFileSync("graphics/creativos/banner.svg.tpl", "utf8");
  for (const [k, x] of Object.entries(v)) svg = svg.split(`{{${k}}}`).join(String(x));
  const sobran = svg.match(/{{[A-Z0-9]+}}/g);
  if (sobran) { console.error("marcadores sin sustituir: " + [...new Set(sobran)].join(" ")); process.exit(1); }
  fs.writeFileSync(process.env.TMP + "/banner.svg", svg);
  fs.writeFileSync(process.env.TMP + "/banner.dim", `${W} ${H}\n`);
  console.log(`  caja ${W}x${H} px (${v.RATIO} a 1), margen ${v.MX} px a los costados y ${v.MY} px abajo`);
'
read -r B_W B_H < "$TMP/banner.dim"

mkdir -p content/adBanner
rm -f content/adBanner/creative.jpg
rasteriza_abs "$TMP/banner.svg" content/adBanner/creative.png "$B_W" "$B_H"

# EL CHEQUEO DEL ALFA, y va acá y no en un test porque es una propiedad del archivo que se
# acaba de escribir. Un PNG sin canal alfa, o con alfa opaco en las esquinas, es un aviso
# rectangular que dice ser una forma: se ve como un rectángulo negro sobre la cancha y no
# falla en ningún lado. Se miran las dos esquinas que la placa inclinada deja afuera.
B_W="$B_W" B_H="$B_H" node -e '
  const { execFileSync } = require("child_process");
  const [W, H] = [process.env.B_W, process.env.B_H].map(Number);
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", "content/adBanner/creative.png",
    "-f", "rawvideo", "-pix_fmt", "rgba", "-"], { maxBuffer: 1 << 28 });
  if (raw.length !== W * H * 4) { console.error(`  el PNG no salió ${W}x${H}`); process.exit(1); }
  const a = (x, y) => raw[(y * W + x) * 4 + 3];
  const esquinas = [["arriba-izq", 3, 3], ["abajo-der", W - 4, H - 4]];
  const centro = a(Math.round(W / 2), Math.round(H / 2));
  const malas = esquinas.filter(([, x, y]) => a(x, y) > 8);
  console.log(`  alfa: centro ${centro}/255, ${esquinas.map(([n, x, y]) => n + "=" + a(x, y)).join(", ")}`);
  if (centro < 200) { console.error("  el centro del banner no es opaco: el aviso no se vería"); process.exit(1); }
  if (malas.length) { console.error(`  ${malas.map((m) => m[0]).join(" y ")} sin transparencia: la forma es la caja`); process.exit(1); }
  console.log("  la forma NO es la caja: las dos esquinas de la diagonal transparentes y el centro opaco");
'
echo "content/adBanner/creative.png  (${B_W}x${B_H})"

# LA L, Y ES UN SOLO VIDEO A CUADRO ENTERO. Así la autora la industria y no como
# dos tiras: el aviso ocupa el viewport completo y va al fondo, y el contenido
# primario se encoge, mantiene su relación de aspecto, se ancla contra los bordes
# superior y derecho, y va arriba. El espectador percibe una banda en L; lo que hay
# es un video entero con el partido tapándole el centro.
#
# Y SON DOS CAPAS, NO UNA (ADR 0045). El fondo pictórico va por un lado y la tipografía
# por otro, y se componen acá. La división no es de gusto: el fondo es lo que entra al
# generador como cuadro semilla, y el modelo re-dibuja cada cuadro, así que una
# tipografía adentro de la semilla vuelve con el texto deformado. Afuera del modelo las
# letras quedan exactas. Las dos capas las arma `l-capas.sh`, que es también quien las
# arma para la generación, así que la geometría vive en un solo lugar.
#
# LOS NÚMEROS DE LAS DOS BANDAS SALEN DEL ASSET LIST Y NO DE ACÁ. Son la caja del
# primario vista del otro lado, así que si vivieran en los dos lados se despegarían
# y el creativo quedaría con tipografía debajo del partido o con una franja negra al
# costado -- sin que nada falle. Es el mismo criterio del ADR 0044 aplicado a la
# geometría de un creativo. `l-capas.sh` los lee y los reporta.
#
# LOS CREATIVOS QUE NACEN DE VIDEO GENERADO VAN A 24 fps, QUE ES EL PASO DE SU FUENTE.
# El default de la medición de la T-01 son 30 y ahí se queda para los demás; la
# excepción no es "la L", es **tener movimiento generado**, y medido con ffprobe hoy
# eso son dos creativos y no uno:
#
#   la L       su fondo son los eslabones de `generar-la-l.sh`  24 fps, 192 cuadros en 8,00 s
#   el lineal  su cuerpo es `neonectar-8s.mp4`                  24 fps, 192 cuadros en 8,00 s
#
# Empaquetarlos a 30 duplica un cuadro de cada cuatro, que es exactamente el tironeo
# que se sacó del plate del partido por la misma razón. El porqué largo, y de dónde
# salía el 30, está en `empaquetar-contenido.sh`.
#
# EL BANNER Y EL OVERLAY SIGUEN A 30 y no ganan nada bajando: los dos nacen de una
# imagen fija, y una imagen fija no tiene cadencia que romper. El `zoompan` del overlay
# ya lo dice más arriba: reetiqueta cuadros, no remuestrea.
#
# Y la L va a 24 también cuando su fondo es la imagen fija, o sea mientras la cadena no
# esté generada: ahí el número no cambia nada, y un creativo con dos fps según cómo se
# armó sería una cosa de más para recordar.
FPS_GEN=24

# EL FONDO SE MUEVE SI LA CADENA ESTÁ, Y SI NO SE QUEDA QUIETO. Los dos eslabones de
# `generar-la-l.sh` cuestan plata de quien los corre, así que no pueden ser un
# requisito de este script: sin ellos la L sale con el fondo fijo, que es exactamente lo
# que era antes, y con ellos sale animada sin cambiar una línea acá. El camino es el
# mismo y lo único que cambia es si los archivos están.
./scripts/l-capas.sh "$TMP/capas"

FL=content/.fuentes/l
ESLABONES_L=2
CADENA_L=1
for n in $(seq 1 "$ESLABONES_L"); do
  [ -s "$(printf '%s/%02d.mp4' "$FL" "$n")" ] || CADENA_L=0
done

if [ "$CADENA_L" = 1 ]; then
  # Los eslabones se pegan con la misma regla que la parada del juego: cada uno menos
  # el primero entra SIN SU CUADRO 0, porque ese cuadro es la versión que el generador
  # hace del último del anterior y pegados tal cual el instante se ve dos veces.
  echo "== la L: fondo generado ($ESLABONES_L eslabones) + tipografía compuesta encima =="
  ENTRADAS_L=(); FILTRO_L=""; ETIQUETAS_L=""
  for n in $(seq 1 "$ESLABONES_L"); do
    ENTRADAS_L+=(-i "$(printf '%s/%02d.mp4' "$FL" "$n")")
    i=$((n - 1))
    if [ "$n" -eq 1 ]; then
      FILTRO_L+="[$i:v]setpts=PTS-STARTPTS[l$i];"
    else
      FILTRO_L+="[$i:v]select=gte(n\,1),setpts=PTS-STARTPTS[l$i];"
    fi
    ETIQUETAS_L+="[l$i]"
  done
  ffmpeg -hide_banner -loglevel error -y "${ENTRADAS_L[@]}" -i "$TMP/capas/l-tipografia.png" \
    -filter_complex "${FILTRO_L}${ETIQUETAS_L}concat=n=$ESLABONES_L:v=1:a=0,scale=1280:720,fps=$FPS_GEN,setsar=1,trim=duration=$D2,setpts=PTS-STARTPTS[bg];[bg][${ESLABONES_L}:v]overlay=0:0:format=auto[v]" \
    -map "[v]" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -an "$TMP/l-backplate.mp4"
else
  echo "== la L: fondo FIJO (falta la cadena en $FL) + tipografía compuesta encima =="
  echo "   para que se mueva:  ./scripts/generar-la-l.sh $ESLABONES_L"
  echo "   genera video con Vertex AI y cuesta plata de quien lo corre."
  ffmpeg -hide_banner -loglevel error -y -loop 1 -t "$D2" -i "$TMP/capas/l-fondo.png" \
    -i "$TMP/capas/l-tipografia.png" \
    -filter_complex "[0:v]scale=1280:720,fps=$FPS_GEN,setsar=1[bg];[bg][1:v]overlay=0:0:format=auto[v]" \
    -map "[v]" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -an "$TMP/l-backplate.mp4"
fi

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
  -filter_complex "[0:v]scale=1280:720,fps=$FPS_GEN,setsar=1,trim=duration=$(awk -v d="$D3" 'BEGIN { printf "%s", d - 2 }'),setpts=PTS-STARTPTS[a];\
[1:v]scale=1280:720,fps=$FPS_GEN,setsar=1[b];[a][b]concat=n=2:v=1:a=0[v]" \
  -map "[v]" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -an "$TMP/lineal.mp4"

# EMPAQUETAR CADA CREATIVO AL TAMAÑO DE SU CAJA Y NO A 1280x720. Es el defecto
# silencioso de este paso: el creativo sale perfecto, se empaqueta a 16:9, y después el
# recorte centrado del ADR 0013 se lleva la mitad de la tipografía. Los dos últimos
# argumentos son el tamaño, y son los mismos números del SVG.
# CADA AVISO LLEVA SU CAMA, y las tres son distintas a proposito. Lo que la demo
# demuestra es que quien mira ELIGE que escuchar, y para elegir hay que oir la
# diferencia: tres camas parecidas dejarian el cambio de foco sin nada que mostrar.
#
# El banner no lleva ninguna, y eso es correcto: es una imagen fija y una imagen fija
# no suena. `applyAudio` ni siquiera le pone volumen a un <img> (ADR 0014).
echo "== empaquetando los cuatro videos como HLS, cada uno al tamaño de su caja =="
./scripts/empaquetar-contenido.sh "$TMP/l-backplate.mp4" content/adL       0 "$D2" "" 1280 720 "$FPS_GEN" audio/kalto.m4a
./scripts/empaquetar-contenido.sh "$TMP/overlay.mp4"     content/adOverlay 0 "$D4" "" 320  180 30         audio/meridia.m4a
./scripts/empaquetar-contenido.sh "$TMP/lineal.mp4"      content/adLinear  0 "$D3" "" 1280 720 "$FPS_GEN" audio/neonectar.m4a

echo
echo "los cuatro creativos del minuto están en content/"
