#!/usr/bin/env bash
# verificar-build.sh -- the library builds, or `npm run check` goes red.
#
# It exists because the build is not reached by `npm test` (the tests import
# lib/ as ES modules) nor by the seams of verificar-cortes.mjs, so a change that
# breaks the assembly of lib/ into the global -- a multi-line `import`, which the
# build strips line by line -- passed both and was found only when a page loaded
# (phase 15). It builds into a throwaway folder and not into dist/, because the
# demos running on this machine serve dist/ as it is.
set -euo pipefail
cd "$(dirname "$0")/.."
TMP="$(mktemp -d "${XDG_RUNTIME_DIR:-/tmp}/verificar-build-XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
SALIDA="$TMP/qualabs-concurrent-hls.js" ./scripts/construir-libreria.sh
