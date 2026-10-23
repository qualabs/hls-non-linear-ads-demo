#!/usr/bin/env bash
# progresivo-creativos.sh -- the progressive MP4 of the two video boxes of the minute,
# the L (`adL`) and the corner (`adOverlay`), next to their HLS.
#
#   progresivo-creativos.sh              makes them, and then checks the asset-list
#   progresivo-creativos.sh --verificar  only checks
#
# WHY (phase 17, ADR 0096). A Roku cannot play the HLS of a box over the programme: it
# has one video decoder and the programme holds it. What it animates there is a short
# progressive VP9 MP4. So the L and the corner of signalling/asset-list-hydration-break.json
# are two options each, the HLS and then the same option with this file (ADR 0102). The
# web never picks the second one: to the library it asks for what the HLS asks for, and
# the HLS comes first (ADR 0097). The banner is already a PNG and has no twin.
#
# WHAT IT DOES. Runs ../../scripts/progresivo.sh on content/<box>/index.m3u8 into
# content/<box>/progressive.mp4, with the size and bitrate of `progresivo` in plate.json.
# The HLS is read, never re-packaged (ADR 0098), and its audio does not travel: the
# Roku's AnimatedImage plays none.
#
# THE CHECK. The asset-list is written by hand, so what it says about each MP4 is
# compared against the file: every `video/mp4` element of it names a file that exists,
# that passes progresivo.sh --verificar against the HLS of the option before it, and
# whose `codecs` -- read from the file (ADR 0100) -- is the one the asset-list writes.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${1:-}" != "--verificar" ]; then
  while IFS=$'\t' read -r CAJA W H BV; do
    CODECS=$(../../scripts/progresivo.sh "content/$CAJA/index.m3u8" "content/$CAJA/progressive.mp4" "$W" "$H" "$BV")
    echo "progresivo-creativos: content/$CAJA/progressive.mp4  ${W}x${H} @ $BV  $CODECS"
  done < <(node -e '
    const p = require("./plate.json").progresivo;
    if (!p) { console.error("plate.json does not declare progresivo"); process.exit(1); }
    for (const [caja, t] of Object.entries(p)) console.log([caja, t.ancho, t.alto, t.bitrate].join("\t"));
  ')
fi

# Each MP4 element of the asset-list, with the HLS of the option it is the twin of.
mapfile -t GEMELAS < <(node -e '
  const lista = require("./signalling/asset-list-hydration-break.json");
  const p = require("./plate.json").progresivo;
  for (const a of lista.ASSETS) {
    const opciones = a["X-AD-CREATIVE-SIGNALING"]?.payload?.[0]?.options ?? [];
    opciones.forEach((o, i) => o.layout.assets.forEach((e, j) => {
      if (e.type !== "video/mp4") return;
      const hls = opciones[i - 1]?.layout.assets[j]?.uri;
      const caja = (e.uri.match(/^\/content\/([^/]+)\//) || [])[1];
      if (!hls || !p?.[caja]) { console.error(`no HLS or no size before ${e.uri}`); process.exit(1); }
      console.log([e.uri.slice(1), hls.slice(1), p[caja].ancho, p[caja].alto, e.codecs ?? ""].join("\t"));
    }));
  }
')
[ "${#GEMELAS[@]}" -gt 0 ] || { echo "RED: the asset-list has no video/mp4 element, so there is nothing to check" >&2; exit 1; }

red=0
for fila in "${GEMELAS[@]}"; do
  IFS=$'\t' read -r MP4 HLS W H DECLARADO <<<"$fila"
  if ! LEIDO=$(../../scripts/progresivo.sh --verificar "$MP4" "$HLS" "$W" "$H"); then
    echo "RED   $MP4: does not pass progresivo.sh --verificar"; red=1; continue
  fi
  if [ "$LEIDO" = "$DECLARADO" ]; then
    echo "GREEN $MP4: codecs $LEIDO, as the asset-list says"
  else
    echo "RED   $MP4: the asset-list says codecs \"$DECLARADO\" and the file is $LEIDO"; red=1
  fi
done
exit "$red"
