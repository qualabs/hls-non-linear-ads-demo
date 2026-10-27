---
id: "0127"
title: La demo DASH es stage-pair, con DASH como tercer modo de cada pane
status: accepted
scope: phase-19
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La fase 15 dio a cada pane de `stage-pair` el modo "HLS nativo" o "nuestra librería". La fase 19
tiene que mostrar el mismo stream en HLS y en DASH lado a lado.

## Decisión

Cada pane suma "DASH, nuestra librería". Mismos `stage.json`, breaks, capacidades y verificador
(`verificar-pares.py`). Se agrega: el primario empaquetado en fMP4 con su MPD (dash.js no reproduce
TS), los creativos en video como MPD, y un juego de sobres `slot` que `escribir-asset-lists.mjs`
escribe desde `stage.json` con los mismos slots que los ASSET-LIST de HLS y las mismas gemelas PNG y
MP4 (ADR 0096). Se empaqueta con `ffmpeg`. Las 18 líneas viejas de `demo/` del REPORT de la fase 18
se corrigen en la misma fase.

## Consecuencias

- `stage-pair` cambia en lo publicado; las otras cuatro demos no, salvo lo inerte del ADR 0118.
- Los dos modos HLS hacen exactamente lo de antes.
