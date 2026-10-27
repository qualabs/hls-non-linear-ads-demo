#!/usr/bin/env bash
# demos-cambiadas.sh <base> [<head>] -- the demos whose published files changed
# between two commits, one per line, for scripts/publicar.sh.
#
# A path under demo/<name>/ is that demo. A path every demo loads from the root,
# or one that changes how they are published, is all five: lib/, hls/ and
# construir-libreria.sh are /dist/, vendor/ is /vendor/, and publicar.* and the
# workflow are the publication itself. dash/ and dash.js are the demos that load the
# DASH side, the DASH list of publicar.sh (phase 19). Anything else (.project/,
# docs/, test/, README) is published nowhere and is none.
#
# CI passes as <base> the commit of the last publication that went green, not the
# previous push: a run that failed, or that the concurrency group skipped, leaves
# its demos for the next one. Without a base it can trust (empty, unknown, or not
# an ancestor of <head> after a force push) the answer is all five.
set -euo pipefail
cd "$(dirname "$0")/.."
ALL=(stage-pair race-multiview multiview-offer hydration-break compatibility-pair)
DASH=(stage-pair)
base=${1:-} head=${2:-HEAD}
if [ -z "$base" ] || ! git cat-file -e "$base^{commit}" 2>/dev/null || ! git merge-base --is-ancestor "$base" "$head"; then
  printf '%s\n' "${ALL[@]}"; exit 0
fi
git diff --name-only "$base" "$head" | awk -v all="${ALL[*]}" -v dash="${DASH[*]}" '
  BEGIN { n = split(all, a, " "); for (i = 1; i <= n; i++) known[a[i]] = 1; m = split(dash, ds, " ") }
  /^dash\// || /^vendor\/dash\./ { for (i = 1; i <= m; i++) out[ds[i]] = 1; next }
  /^(lib|hls|vendor)\// || /^scripts\/(construir-libreria\.sh|publicar\.(sh|py)|demos-cambiadas\.sh)$/ ||
  /^\.github\/workflows\/publicar\.yml$/ { for (d in known) out[d] = 1; next }
  /^demo\// { split($0, p, "/"); if (p[2] in known) out[p[2]] = 1 }
  END { for (i = 1; i <= n; i++) if (a[i] in out) print a[i] }'
