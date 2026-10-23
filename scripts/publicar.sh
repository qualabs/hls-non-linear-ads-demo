#!/usr/bin/env bash
# publicar.sh -- publishes demos to their public buckets and verifies them without
# credentials. The same script runs by hand and in CI (.github/workflows/publicar.yml).
#
#   scripts/publicar.sh [--publicar] [--con-contenido] [--control] <demo>... | --all
#
# WITHOUT --publicar IT IS A DRY RUN: it builds the stage, runs every check that can
# be run before writing, and asks gcloud what the sync would copy and delete. It
# writes nothing to any bucket.
#
# WHAT IS PUBLISHED IS HEAD, NOT THE WORKING TREE. The demo, lib/ and vendor/ come
# out of `git archive HEAD` into a stage of their own, dist/ is built there, and the
# demo's own senalizar-contenido.sh runs there. Nothing in the checkout is written,
# so the demos served on this machine from dist/ and content/ are not touched.
#
# CONTENT/ IS NOT IN GIT (.gitignore), so a push can never change it and a CI
# checkout does not have it. By default the bucket's content/ is left as it is: it
# is out of the sync in both directions (the -x keeps it out of the deletion too),
# and the stage gets only its playlists, downloaded from the bucket, which is what
# senalizar-contenido.sh reads. What that script writes into content/ -- the
# signalled playlists, whose START-DATE comes from the packaging (ADR 0005) -- is
# the one part of content/ a push changes, and those files are uploaded when they
# differ. With --con-contenido the local content/ is synced too, deletion included:
# that is the manual path after re-packaging, and it needs content/ on disk.
#
# NO DEMO IS PUBLISHED UNTIL EVERY DEMO ASKED FOR PASSED ITS CHECKS: every reference
# of the pages, the asset-lists and the playlists, followed down to the segments,
# exists in the stage or in content/; senalizar-contenido.sh leaves the committed
# files as they are; the exclusion patterns exclude what they claim. --control plants
# two references that do not exist, to watch the reference check turn red.
#
# What the traps are (the bucket in the host, the 403 at the root, the .ts content
# type, the anchored -x, content/.fuentes/) is in the CLAUDE.md of the project;
# how each one is handled is in scripts/publicar.py, which does the analysis.
#
# The cache: everything outside content/, and every playlist, JSON, page, SVG and
# progressive MP4 inside it, is served with `Cache-Control: no-cache`. The default is a public hour,
# and the Google edge was seen serving an old file for that hour (phase 15).
set -euo pipefail
cd "$(dirname "$0")/.."

ALL=(stage-pair race-multiview multiview-offer hydration-break compatibility-pair)
PUBLISH=0 CONTENT=0 CONTROL=() DEMOS=()
for a in "$@"; do
  case "$a" in
    --publicar) PUBLISH=1 ;;
    --con-contenido) CONTENT=1 ;;
    --control) CONTROL=(/content/no-existe.m3u8 /dist/no-existe.js) ;;
    --all) DEMOS=("${ALL[@]}") ;;
    -*) echo "unknown flag: $a" >&2; exit 2 ;;
    *) [[ " ${ALL[*]} " == *" $a "* ]] || { echo "not a demo: $a (one of: ${ALL[*]})" >&2; exit 2; }
       DEMOS+=("$a") ;;
  esac
done
[ "${#DEMOS[@]}" -gt 0 ] || { echo "usage: $0 [--publicar] [--con-contenido] [--control] <demo>... | --all" >&2; exit 2; }
[ "$PUBLISH" = 1 ] && [ "${#CONTROL[@]}" -gt 0 ] && { echo "--control never publishes" >&2; exit 2; }

PY="python3 $PWD/scripts/publicar.py"
TMP=$(mktemp -d "${XDG_RUNTIME_DIR:-${RUNNER_TEMP:-${TMPDIR:-/tmp}}}/publicar-XXXXXX")
trap 'rm -rf "$TMP"' EXIT
NONCONTENT=$($PY regex noncontent)
bucket() { echo "gs://qualabs-hls-demo-$1"; }
host() { echo "https://qualabs-hls-demo-$1.storage.googleapis.com"; }
# The files of a tree with their hash, outside content/: what senalizar may not change.
hashes() { (cd "$1" && find . -path ./content -prune -o -type f -print0 | sort -z | xargs -0 sha256sum); }

echo "== 0. the exclusion patterns, against planted paths =="
$PY selftest

echo "== 1. the stage: HEAD $(git rev-parse --short HEAD), with dist/ built in it =="
mkdir "$TMP/repo"
git archive HEAD lib scripts vendor demo | tar -x -C "$TMP/repo"
(cd "$TMP/repo" && ./scripts/construir-libreria.sh)

red=0
for d in "${DEMOS[@]}"; do
  S="$TMP/repo/demo/$d" B=$(bucket "$d")
  echo "== 2. $d: checks =="
  cp -r "$TMP/repo/dist" "$TMP/repo/vendor" "$S/"
  gcloud storage ls --json "$B/**" > "$TMP/$d.before.json"
  if [ "$CONTENT" = 1 ]; then
    [ -d "demo/$d/content" ] || { echo "   --con-contenido needs demo/$d/content on disk" >&2; exit 1; }
    STATE="$PWD/demo/$d/content"
    (cd "demo/$d/content" && find . -name '*.m3u8' -not -path './.fuentes/*' -not -path './.work/*' -print0 |
      xargs -0 -I{} install -D -m 644 {} "$S/content/{}")
  else
    STATE="$TMP/$d.before.json"
    gcloud storage rsync -r -x '.*(?<!\.m3u8)$' "$B/content" "$S/content" > "$TMP/$d.hydrate" 2>&1 ||
      { cat "$TMP/$d.hydrate" >&2; exit 1; }
    echo "   $(find "$S/content" -name '*.m3u8' | wc -l) playlists of content/ downloaded from the bucket"
  fi
  hashes "$S" > "$TMP/$d.h0"
  (cd "$S" && ./scripts/senalizar-contenido.sh > /dev/null)
  hashes "$S" > "$TMP/$d.h1"
  # A file that existed and changed is a committed file the script rewrote: HEAD is stale.
  if join -j 2 <(sort -k2 "$TMP/$d.h0") <(sort -k2 "$TMP/$d.h1") | awk '$2 != $3 {print "     REWRITTEN", $1; f=1} END {exit f}'; then
    echo "   senalizar-contenido.sh leaves the committed files as they are"
  else
    echo "   senalizar-contenido.sh rewrites committed files: commit its output first"; red=1
  fi
  $PY check "$S" "$STATE" "$TMP/$d.derived" "${CONTROL[@]}" || red=1
  if [ "$PUBLISH" = 0 ]; then
    echo "   the sync would do (gcloud --dry-run):"
    gcloud storage rsync --dry-run -r -x "$NONCONTENT" --delete-unmatched-destination-objects --checksums-only \
      "$S" "$B" 2>&1 | grep -E '^Would (copy|remove)' | sed 's/^/     /' > "$TMP/$d.dry" || true
    echo "     $(grep -c 'Would copy' "$TMP/$d.dry" || true) to copy, $(grep -c 'Would remove' "$TMP/$d.dry" || true) to remove"
    head -20 "$TMP/$d.dry"
    if [ "$CONTENT" = 1 ]; then
      echo "     and content/: $(gcloud storage rsync --dry-run -r -x "$($PY regex content "$d")" --delete-unmatched-destination-objects \
        --checksums-only "demo/$d/content" "$B/content" 2>&1 | grep -c '^Would' || true) objects to copy or remove"
    fi
    sed 's/^/     signalled, would upload: /' "$TMP/$d.derived"
  fi
done

if [ "$red" = 1 ]; then echo "RED: nothing was published"; exit 1; fi
if [ "$PUBLISH" = 0 ]; then echo "DRY RUN GREEN: nothing was published (--publicar does)"; exit 0; fi

for d in "${DEMOS[@]}"; do
  S="$TMP/repo/demo/$d" B=$(bucket "$d")
  echo "== 3. $d: publish =="
  if [ "$CONTENT" = 1 ]; then
    gcloud storage rsync -r -x "$($PY regex content "$d")" --delete-unmatched-destination-objects --checksums-only \
      "demo/$d/content" "$B/content"
  fi
  gcloud storage rsync -r -x "$NONCONTENT" --delete-unmatched-destination-objects --checksums-only \
    --cache-control=no-cache "$S" "$B"
  while read -r f; do gcloud storage cp --cache-control=no-cache "$S/$f" "$B/$f"; done < "$TMP/$d.derived"
  # rsync skips what did not change, and what it skips keeps its old metadata.
  gcloud storage ls --json "$B/**" > "$TMP/$d.mid.json"
  $PY fixes "$S" "$TMP/$d.mid.json" "$TMP/$d.ts" "$TMP/$d.nc"
  [ -s "$TMP/$d.ts" ] && gcloud storage objects update -I --content-type=video/mp2t < "$TMP/$d.ts" > /dev/null
  [ -s "$TMP/$d.nc" ] && gcloud storage objects update -I --cache-control=no-cache < "$TMP/$d.nc" > /dev/null

  echo "== 4. $d: the bucket against the stage, by md5 =="
  gcloud storage ls --json "$B/**" > "$TMP/$d.after.json"
  # shellcheck disable=SC2046 # with --con-contenido, the local content/ is compared too
  $PY verify "$S" "$TMP/$d.after.json" "$TMP/$d.derived" $([ "$CONTENT" = 1 ] && echo "$PWD/demo/$d/content") || red=1
  echo "== 5. $d: WITHOUT credentials and without cache-busting =="
  $PY http "$S" "$(host "$d")" "$TMP/$d.derived" || red=1
done

if [ "$red" = 1 ]; then echo "RED: what is served does not match HEAD"; exit 1; fi
for d in "${DEMOS[@]}"; do echo "PUBLISHED: $(host "$d")/index.html"; done
