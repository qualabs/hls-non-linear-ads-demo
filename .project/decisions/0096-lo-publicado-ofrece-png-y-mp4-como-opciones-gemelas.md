---
id: "0096"
title: "Lo publicado ofrece además PNG y MP4 VP9, como opciones gemelas de la HLS y la SVG"
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El canal Roku tiene que funcionar con la URL de la playlist publicada, y no dibuja SVG ni reproduce un segundo HLS. Nicolás decidió (2026-10-22) que las formas que el Roku dibuja vayan en la demo publicada, sin copia propia del canal, y que el PNG vaya además del SVG.

## Decisión

En stage-pair y hydration-break, después de cada opción con un elemento HLS va la misma opción con el elemento como `video/mp4` y `codecs` (RFC 6381), y después de cada opción con un SVG quieto, la misma con `image/png`. Entre una opción y su gemela cambian sólo `type`, `uri` y `codecs`. Es el formato del diseño del canal (`hls-non-linear-ads-roku`, `.project/roadmap/todo-de-lo-publicado/DESIGN.md` §1, commit `bab9afe`).

## Consecuencias

Sin campo nuevo: es R5.5 y R5.6 de la spec tal como están. Descartado un arreglo de codificaciones por elemento: es un campo que la spec no tiene. Las demos que el canal no lee (race-multiview, multiview-offer, compatibility-pair y la carrera) no cambian.
