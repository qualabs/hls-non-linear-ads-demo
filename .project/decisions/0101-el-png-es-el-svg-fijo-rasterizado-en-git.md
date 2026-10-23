---
id: "0101"
title: "El PNG es el `-fijo.svg` rasterizado, en git, con un chequeo de que está al día"
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El Roku no decodifica SVG. Las opciones de imagen de stage-pair son los SVG congelados (fase 15).

## Decisión

`graphics/campaigns/<pieza>-fijo.png`, 1920x1080 RGBA, rasterizado con el Chrome headless y el `omit_background` de `capturar-svg.py`, commiteado al lado de su SVG y anotado en `stage.json` (`pngFijo`). Un chequeo lo vuelve a rasterizar y lo compara con `pxdif.sh`.

## Consecuencias

Sale con el push, como el SVG. Si alguien rehace un SVG sin rehacer su PNG, el chequeo frena.
