---
id: "0098"
title: "El MP4 se transcodifica del HLS publicado"
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Los cuadros con que se arma el HLS de stage-pair no se guardan. Sacar el MP4 de cuadros es recapturar y re-empaquetar, y el HLS que la web reproduce saldría de nuevo.

## Decisión

`scripts/progresivo.sh` transcodifica el HLS publicado: VP9 perfil 0, 8 bits, sin audio, la duración entera del HLS; 960x540 a 500k (16:9, backplate, L), banner 1120x126 a 300k, esquina 320x180 a 200k, los números del `build-assets.sh` del Roku, medidos en el equipo. Cada demo declara los suyos en su fuente de números (ADR 0044).

## Consecuencias

El HLS no cambia ni de bytes ni de URL. Se pierde una generación de compresión, dominada por el bitrate de VP9. Descartado guardar los cuadros: ~270 MB por pieza.
