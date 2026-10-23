---
id: "0099"
title: "`progressive.mp4` al lado de su HLS, y `.mp4` servido con `no-cache`"
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El MP4 necesita una ruta. El hash del directorio de stage-pair cubre los segmentos del HLS y no los parámetros del MP4, y hydration-break no versiona. Lo de nombre fijo con la hora pública por defecto se sirvió viejo (fase 15).

## Decisión

`progressive.mp4` en el directorio de su HLS (`content/creatives/<pieza>/<hash>/`, `content/adL/`, `content/adOverlay/`), y `.mp4` en `MUTABLE` de `scripts/publicar.py`, que lo sirve con `Cache-Control: no-cache`.

## Consecuencias

El borde revalida con el ETag. Descartados el hash del MP4 en su nombre (otra ruta que escribir a mano en hydration-break) y el MP4 dentro del hash del directorio (cambia la URL del HLS sin que cambien sus bytes).
