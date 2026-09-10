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
  const L = Math.round(1280 * left / 100);          // ancho de la banda izquierda
  const T = Math.round(720 * (100 - bottom) / 100); // donde arranca la banda inferior
  const TH = 720 - T;

  // LA CAJA DEL ZAPATO ADENTRO DE LA IMAGEN, medida por luminancia contra el campo.
  // Es lo que permite colocar el ZAPATO y no la imagen. Si se regenera la imagen del
  // producto, este rectángulo se vuelve a medir: es el único número de este bloque que
  // no se deriva de otro.
  const Z = { x: 90, y: 326, w: 752, h: 360, W: 1376, H: 768 };
  const CAMPO = "#010101";      // el negro que la imagen trae, medido en sus cinco esquinas
  const ANCHO_ZAPATO = 264;     // lo que la plantilla pide para el codo

  // LA IMAGEN SE COLOCA A ESCALA CONTRA EL BORDE INFERIOR IZQUIERDO, sobre un campo del
  // mismo negro que ella trae: el borde de la colocación no puede verse. No hay máscara
  // y no hace falta, porque la imagen se generó con el encuadre del aviso.
  const escala = ANCHO_ZAPATO / Z.w;
  const FW = Math.round(Z.W * escala), FH = Math.round(Z.H * escala), FY = 720 - FH;
  const ZAPATO_DER = Math.round((Z.x + Z.w) * escala);

  // LA FILA DE LA BANDA INFERIOR. Los tres elementos comparten el eje horizontal de la
  // banda, y los centros salen de ese eje en lugar de escribirse a mano.
  const EJE = (T + 720) / 2;
  const QR_LADO = 132, QR_AIRE = 10;                 // la placa blanca sobresale 10 px
  const QR_X = 1280 - 80 - QR_LADO - QR_AIRE;        // margen derecho, el mismo del banner
  const QR_Y = Math.round(EJE - QR_LADO / 2);
  const LEY_X = QR_X - QR_AIRE - 24;                 // la leyenda termina donde arranca la placa
  // El ancho de la leyenda está MEDIDO sobre el render (14 px con letter-spacing 3),
  // porque un script no puede medir texto. Si cambia el cuerpo o el texto, se vuelve a
  // medir: es lo único de este bloque que no se deriva.
  const LEY_ANCHO = 194;
  const PIE_X = Math.round((ZAPATO_DER + (LEY_X - LEY_ANCHO)) / 2);

  const comun = { L, T, TH, PCT: left, PERDIDO: Math.round(1280 * (40 - left) / 100) };

  const fondo = {
    ...comun,
    FOTO: "file://" + process.cwd() + "/" + process.env.G + "/kalto-shoe.jpg",
    CAMPO, FW, FH, FY
  };

  // EL QR SE DIBUJA COMO RECTÁNGULOS Y VIVE EN ESTA CAPA. Pasado por el generador deja
  // de escanear. La matriz y la URL a la que lleva están en `qr-github.txt`.
  const matriz = fs.readFileSync("graphics/creativos/qr-github.txt", "utf8")
    .split("\n").filter((l) => /^[#.]{20,}$/.test(l)).map((l) => [...l].map((c) => c === "#"));
  if (!matriz.length) { console.error("qr-github.txt no tiene matriz"); process.exit(1); }
  const m = QR_LADO / matriz.length;
  const qr = [`<rect x="${QR_X}" y="${QR_Y - QR_AIRE}" width="${QR_LADO + 2 * QR_AIRE}" height="${QR_LADO + 2 * QR_AIRE}" rx="6" fill="#f6f8f9"/>`];
  matriz.forEach((f, i) => f.forEach((c, j) => { if (c) qr.push(
    `<rect x="${(QR_X + QR_AIRE + j * m).toFixed(2)}" y="${(QR_Y + i * m).toFixed(2)}" width="${(m + 0.4).toFixed(2)}" height="${(m + 0.4).toFixed(2)}" fill="#0b0f15"/>`); }));

  const tipo = {
    ...comun,
    VELO: 0.55,
    MG: 40, MG2: 42,
    FSM: 44, LSM: 8, M1: 78,
    FSS: 15, LSS: 3.8, M2: 108,
    RY: 140, RW: 46,
    FSA: 27, A1: 196, A2: 229,
    FSC: 17, A3: 261, A4: 284,
    FSPK: 14, P1: 328, FSP: 46, P2: 384, FSPV: 19, P3: 415,
    FSPIE: 19, PIEX: PIE_X, PIEY: Math.round(EJE + 0.35 * 19),
    FSLEY: 14, LEYX: LEY_X, LEY1: Math.round(EJE - 8), LEY2: Math.round(EJE - 8) + 26,
    QR: qr.join("\n  ")
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
  console.log(`  la imagen a ${FW}x${FH} contra el borde inferior, sin máscara; el zapato mide ${ANCHO_ZAPATO} px y termina en x=${ZAPATO_DER}`);
  console.log(`  los tres de la banda inferior sobre el eje y=${EJE}`);
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
