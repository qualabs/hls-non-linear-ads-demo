#!/usr/bin/env bash
# Rasteriza las DOS CAPAS de la L a un directorio: el fondo pictórico y la tipografía.
#
# EXISTE PARA QUE LA GEOMETRÍA VIVA EN UN SOLO LUGAR. Las dos capas las necesitan dos
# procesos distintos —`creativos.sh` para componer el creativo y `generar-la-l.sh` para
# tener el cuadro semilla que entra a Veo— y son los mismos números. Escritos en los dos
# lados se despegarían y el texto quedaría corrido contra el fondo que se animó, sin que
# nada falle.
#
# Y LOS NÚMEROS NO SON DE ACÁ TAMPOCO: las dos bandas son la caja del contenido primario
# vista del otro lado, y esa caja la declara el asset list (el criterio del ADR 0044
# aplicado a la geometría de un creativo).
#
# Uso:  ./scripts/l-capas.sh <directorio de salida>
#   deja  <dir>/l-fondo.png       1280x720, opaco, el cuadro semilla
#         <dir>/l-tipografia.png  1280x720 con alfa, sólo letras y velos
set -euo pipefail
cd "$(dirname "$0")/.."

DEST=${1:?directorio de salida}
mkdir -p "$DEST"

G=content/.fuentes/creativos
[ -s "$G/kalto-shoe.jpg" ] || { echo "falta $G/kalto-shoe.jpg (corré ./scripts/preparar-contenido.sh)" >&2; exit 1; }

DEST="$DEST" G="$G" node -e '
  const fs = require("fs");
  const lista = require("./signalling/asset-list-hydration-break.json");
  const capa = lista.ASSETS
    .map((a) => a["X-AD-CREATIVE-SIGNALING"]?.payload?.[0])
    .find((p) => p?.type === "squeezebackLShape")?.layout;
  if (!capa) { console.error("el asset list no declara la L"); process.exit(1); }
  const [top, right, bottom, left] = capa.primaryContent.viewport.split(/\s+/).map(Number);
  if (left !== bottom) {
    console.error(`la banda izquierda (${left}%) y la inferior (${bottom}%) tienen que ser`);
    console.error("el MISMO porcentaje: es lo que mantiene el 16:9 del primario. Con");
    console.error("porcentajes distintos el partido sale recortado por el `cover` del ADR 0013.");
    process.exit(1);
  }
  const L = Math.round(1280 * left / 100);      // ancho de la banda izquierda
  const T = Math.round(720 * (100 - bottom) / 100); // donde arranca la banda inferior
  const TH = 720 - T;

  const comun = { L, T, TH, PCT: left, PERDIDO: Math.round(1280 * (40 - left) / 100) };

  const fondo = {
    ...comun,
    FOTO: "file://" + process.cwd() + "/" + process.env.G + "/kalto-shoe.jpg",
    FX: 360, FY: T - 150, FW: 960, FH: Math.round(960 * 848 / 1264)
  };

  const tipo = {
    ...comun,
    VELOW: L + 120, VELOPIEW: 700,
    MG: 40, MG2: 42,
    FSM: 44, LSM: 8, M1: 78,
    FSS: 15, LSS: 3.8, M2: 108,
    RY: 140, RW: 46,
    FSA: 27, A1: 196, A2: 229,
    FSC: 17, A3: 261, A4: 284,
    FSP: 19, PIE: T + 87
  };

  const render = (tpl, vars, salida) => {
    let svg = fs.readFileSync(`graphics/creativos/${tpl}`, "utf8");
    for (const [k, v] of Object.entries(vars)) svg = svg.split(`{{${k}}}`).join(String(v));
    const sobran = svg.match(/{{[A-Z0-9]+}}/g);
    if (sobran) { console.error(`${tpl}: marcadores sin sustituir ${[...new Set(sobran)].join(" ")}`); process.exit(1); }
    fs.writeFileSync(salida, svg);
  };
  render("l-fondo.svg.tpl", fondo, process.env.DEST + "/l-fondo.svg");
  render("l-tipografia.svg.tpl", tipo, process.env.DEST + "/l-tipografia.svg");
  console.log(`  bandas del ${left}%: izquierda 0..${L}px, inferior ${T}..720px (${TH}px de alto)`);
'

# El fondo va OPACO y la tipografía CON ALFA, y esa diferencia es el punto: el fondo es
# una imagen completa que entra al generador, y la tipografía es una capa que se pega
# encima. `--default-background-color=00000000` da el alfa; para el fondo no molesta,
# porque su propio rectángulo cubre el viewport entero.
rasteriza() { # $1 svg, $2 png
  python3 -c 'import sys, xml.etree.ElementTree as ET; ET.parse(sys.argv[1])' "$1" \
    || { echo "el SVG $1 no parsea como XML: Chrome rasterizaría su pantalla de error" >&2; exit 1; }
  google-chrome --headless=new --disable-gpu \
    --default-background-color=00000000 \
    --allow-file-access-from-files \
    --window-size=1280,720 \
    --screenshot="$2" "$1" >/dev/null 2>&1
  [ -s "$2" ] || { echo "no se pudo rasterizar $1" >&2; exit 1; }
}

rasteriza "$DEST/l-fondo.svg"      "$DEST/l-fondo.png"
rasteriza "$DEST/l-tipografia.svg" "$DEST/l-tipografia.png"
echo "  $DEST/l-fondo.png y $DEST/l-tipografia.png"
