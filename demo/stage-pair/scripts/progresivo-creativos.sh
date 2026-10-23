#!/usr/bin/env bash
# progresivo-creativos.sh -- the progressive MP4 of every piece that is the video
# option of a break, next to its HLS, recorded in stage.json.
#
# WHY (phase 17, ADR 0096). A Roku cannot play the HLS of a box over the programme: it
# has one video decoder and the programme holds it. What it animates there is a short
# progressive VP9 MP4. So each asset-list offers, right after the HLS option, the same
# option with this file (scripts/escribir-asset-lists.mjs). The web picks it only when
# the HLS fails to load (ADR 0099): to the library it asks for what the HLS option asks
# for, and the HLS option comes first (ADR 0097).
#
# WHAT IT DOES, per piece named by `breaks[].forma` of each break: runs
# ../../scripts/progresivo.sh on the HLS that stage.json declares in its `video`, writes
# `progressive.mp4` into the SAME directory -- the one with the hash
# (versionar-creativo.sh) -- and writes `mp4` and `mp4Codecs` on the piece's line of
# stage.json. The HLS is read, never re-packaged (ADR 0098): its bytes and its URL stay.
# Size and bitrate come from `assets.progresivo`, by shape.
#
# It runs after every re-packaging: puente-a-video.sh calls it at its end, because a
# new HLS is a new directory and the old one, MP4 included, is deleted.
#
# Usage: progresivo-creativos.sh
set -euo pipefail
cd "$(dirname "$0")/.."

mapfile -t PIEZAS < <(node -e '
  const s = require("./stage.json");
  const vistas = new Set();
  for (const b of s.breaks) {
    const p = s.assets.piezas.find((x) => x.campana === b.campana && x.forma === b.forma);
    if (!p) { console.error(`stage.json does not declare the piece ${b.campana}/${b.forma}`); process.exit(1); }
    const t = s.assets.progresivo?.[b.forma];
    if (!t) { console.error(`stage.json does not declare assets.progresivo.${b.forma}`); process.exit(1); }
    if (vistas.has(p.svg)) continue;
    vistas.add(p.svg);
    console.log([p.svg, p.video, t.ancho, t.alto, t.bitrate].join("\t"));
  }
')
[ "${#PIEZAS[@]}" -gt 0 ] || { echo "no break declares a video piece" >&2; exit 1; }

for fila in "${PIEZAS[@]}"; do
  IFS=$'\t' read -r SVG HLS W H BV <<<"$fila"
  MP4=$(dirname "$HLS")/progressive.mp4
  CODECS=$(../../scripts/progresivo.sh "$HLS" "$MP4" "$W" "$H" "$BV")
  node -e '
    const fs = require("fs");
    const [svg, mp4, codecs] = process.argv.slice(1);
    const lineas = fs.readFileSync("stage.json", "utf8").split("\n");
    const i = lineas.findIndex((l) => l.includes(`"svg": "${svg}"`));
    if (i < 0) { console.error(`stage.json does not declare ${svg}`); process.exit(1); }
    let l = lineas[i].replace(/, "mp4": "[^"]*", "mp4Codecs": "[^"]*"/, "");
    l = l.replace(/("video": "[^"]+")/, `$1, "mp4": "${mp4}", "mp4Codecs": "${codecs}"`);
    if (!l.includes(`"mp4": "${mp4}"`)) { console.error(`the line of ${svg} has no "video" to write after`); process.exit(1); }
    lineas[i] = l;
    fs.writeFileSync("stage.json", lineas.join("\n"));
    JSON.parse(fs.readFileSync("stage.json", "utf8"));
  ' "$SVG" "$MP4" "$CODECS"
  echo "progresivo-creativos: $MP4  ${W}x${H} @ $BV  $CODECS"
done
