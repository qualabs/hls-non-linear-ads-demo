#!/usr/bin/env bash
# The one command of the demo: package the content if it is not there yet,
# write the signalled playlist, and serve it.
set -euo pipefail
cd "$(dirname "$0")"
[ -f content/primary/index.m3u8 ] || ./scripts/preparar-contenido.sh
# Every start, because the START-DATE of the Date Ranges is computed from the
# EXT-X-PROGRAM-DATE-TIME of the packaged content and re-packaging moves it.
./scripts/senalizar-contenido.sh
exec node server.mjs
