#!/usr/bin/env bash
# The one command of a demo: package its content if it is not there yet, write
# its signalled playlist, build the library, and serve the demo.
#
# THE DEMO IS THE ARGUMENT, with the oldest one as the default:
# `./run.sh` is `./run.sh compatibility-pair`. This file stays in the root of
# the sdk and is not split into a run.sh per demo, because that would repeat
# the two lines of the sdk in every one of them and hand "build the library
# before serving" back to somebody's memory, which is the very forgetting the
# ADR 0015 removed by building on every start (ADR 0022).
# EL SERVER SOBREVIVE A LA CORRIDA QUE LO LANZÓ, y eso decide dónde puede ir su log.
# La última línea es un `exec`, así que este proceso queda vivo hasta que alguien lo
# mate: horas o días después de que terminara la tarea que escribió el comando. Si su
# salida se redirige a un directorio de trabajo por corrida --de esos que se borran al
# terminar-- pasan dos cosas y ninguna se ve: el archivo se desvincula y el log deja de
# poder leerse, y el espacio NO se libera, porque el descriptor sigue abierto. Pasó: el
# server que sirve esta demo tiene su log adentro del temporal de una sesión que ya no
# existe. Si se redirige la salida, que sea a un lugar que no dependa de una corrida.
set -euo pipefail
cd "$(dirname "$0")"

DEMO="${1:-compatibility-pair}"
[ -d "demo/$DEMO" ] || { echo "no hay una demo llamada '$DEMO': falta demo/$DEMO" >&2; exit 1; }

[ -f "demo/$DEMO/content/primary/index.m3u8" ] || "demo/$DEMO/scripts/preparar-contenido.sh"
# Every start, because the START-DATE of the Date Ranges is computed from the
# EXT-X-PROGRAM-DATE-TIME of the packaged content and re-packaging moves it.
"demo/$DEMO/scripts/senalizar-contenido.sh"
# Every start, for the same reason and none other: the page consumes the built
# library and not the sources, so the build cannot be a thing somebody remembers
# to run (ADR 0015).
./scripts/construir-libreria.sh
# The folder of the demo is the document root, which is what leaves the URIs of
# its asset-lists and every relative path of its page untouched (ADR 0022).
exec node server.mjs "demo/$DEMO"
