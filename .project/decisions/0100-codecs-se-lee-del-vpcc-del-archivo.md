---
id: "0100"
title: "`codecs` se lee del `vpcC` del archivo"
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El nivel de VP9 depende del tamaño y la cadencia: un MP4 de prueba del banner trae nivel 21 en su `vpcC`; a 960x540@30 es 30 y a 320x180 es 11. Un valor fijo mentiría en dos de tres.

## Decisión

`progresivo.sh` lee perfil, nivel y bits del `vpcC` que acaba de escribir y emite `vp09.PP.LL.BB`. stage-pair lo anota en `stage.json` y el escritor lo copia; en hydration-break, un chequeo compara el del asset-list contra el archivo.

## Consecuencias

El Roku mira sólo el prefijo `vp09.`; el nivel queda correcto para un cliente que decida por él.
