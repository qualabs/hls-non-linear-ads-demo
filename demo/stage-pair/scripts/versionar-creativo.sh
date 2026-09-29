#!/usr/bin/env bash
# versionar-creativo.sh <pieza> -- le pone al video recién empaquetado de una
# pieza un nombre que depende de su contenido, y lo anota en stage.json.
#
# POR QUÉ (fase 15). La demo se sirve desde un bucket con caché pública. Un video
# rehecho con el MISMO nombre lo sigue sirviendo viejo cualquier caché que lo haya
# visto, hasta que vence, y ni el navegador ni el borde de Google saben que
# cambió. Con el contenido en el nombre, un video nuevo es una URL que nadie pidió
# nunca: no hay nada viejo que servir. Lo que sí tiene nombre fijo -- las páginas,
# stage.json, las playlists, los asset-lists -- se publica sin caché
# (scripts/publicar.sh), así que apunta al video nuevo apenas se sube.
#
# QUÉ HACE. Toma `content/creatives/<pieza>/index.m3u8` y sus `seg*.ts`, que es
# donde empaquetar-creativo.sh los deja; calcula un hash corto de los segmentos
# (los segmentos y no la playlist, que lleva la hora de pared del empaquetado);
# los mueve a `content/creatives/<pieza>/<hash>/`; borra las versiones anteriores
# de esa pieza; y escribe la ruta nueva en el `video` de la pieza en stage.json.
# Todo lo que arma asset-lists lee esa ruta de ahí, así que nadie más la tipea.
#
# La carpeta de la pieza no cambia de nombre y la versión va adentro, así que la
# fila de CREDITS.md que declara `content/creatives/<pieza>/` la sigue cubriendo.
#
# Uso: versionar-creativo.sh <pieza>     (pieza = nombre del SVG sin .svg)
set -euo pipefail
cd "$(dirname "$0")/.."

PIEZA=${1:?pieza}
DIR=content/creatives/$PIEZA
[ -f "$DIR/index.m3u8" ] || { echo "no hay $DIR/index.m3u8 recién empaquetado" >&2; exit 1; }
ls "$DIR"/seg*.ts >/dev/null 2>&1 || { echo "no hay segmentos en $DIR" >&2; exit 1; }

HASH=$(cat $(ls "$DIR"/seg*.ts | sort) | sha256sum | cut -c1-10)
DEST=$DIR/$HASH
rm -rf "$DEST"; mkdir -p "$DEST"
mv "$DIR"/index.m3u8 "$DIR"/seg*.ts "$DEST"/
# Las versiones anteriores de esta pieza: ya no las apunta nada.
for v in "$DIR"/*/; do [ "${v%/}" = "$DEST" ] || rm -rf "$v"; done

node -e '
  const fs = require("fs");
  const [pieza, ruta] = process.argv.slice(1);
  let s = fs.readFileSync("stage.json", "utf8");
  const svg = `"svg": "graphics/campaigns/${pieza}.svg"`;
  const lineas = s.split("\n");
  const i = lineas.findIndex((l) => l.includes(svg));
  if (i < 0) { console.error(`stage.json no declara la pieza ${pieza}`); process.exit(1); }
  const antes = lineas[i];
  lineas[i] = antes.replace(/"video": "[^"]+"/, `"video": "${ruta}"`);
  if (lineas[i] === antes && !antes.includes(`"video": "${ruta}"`)) {
    console.error(`la fila de ${pieza} en stage.json no tiene un "video" que reemplazar`); process.exit(1);
  }
  fs.writeFileSync("stage.json", lineas.join("\n"));
  JSON.parse(fs.readFileSync("stage.json", "utf8"));
' "$PIEZA" "$DEST/index.m3u8"
echo "versionar-creativo: $PIEZA -> $DEST/index.m3u8"
