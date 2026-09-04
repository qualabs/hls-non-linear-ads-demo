#!/usr/bin/env bash
# The one command of the demo: package the content if it is not there yet, and
# serve it.
set -euo pipefail
cd "$(dirname "$0")"
[ -f content/primary/index.m3u8 ] || ./scripts/preparar-contenido.sh
exec node server.mjs
