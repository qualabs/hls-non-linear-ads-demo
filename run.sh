#!/usr/bin/env bash
# The one command of the demo: package the content if it is not there yet,
# build the library, write the signalled playlist, and serve it.
set -euo pipefail
cd "$(dirname "$0")"
[ -f content/primary/index.m3u8 ] || ./scripts/preparar-contenido.sh
# Every start, because the START-DATE of the Date Ranges is computed from the
# EXT-X-PROGRAM-DATE-TIME of the packaged content and re-packaging moves it.
./scripts/senalizar-contenido.sh
# Every start, for the same reason and none other: the page consumes the built
# library and not the sources, so the build cannot be a thing somebody remembers
# to run (ADR 0015).
./scripts/construir-libreria.sh
exec node server.mjs
