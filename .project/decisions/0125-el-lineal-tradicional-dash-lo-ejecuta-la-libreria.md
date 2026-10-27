---
id: "0125"
title: El lineal tradicional en DASH lo ejecuta la librería, sobre dash.js sin modificar
status: accepted
scope: phase-19
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El corte lineal tradicional en DASH es `ReplacePresentation` (23009-1, 5.16.4). dash.js upstream
5.2.1 no ejecuta Alternative MPD. El fork `qualabs/dash.js` sí, pero está en 5.2.0, atrás de
upstream.

## Decisión

`dash/signalling.js` se suscribe a `urn:mpeg:dash:event:alternativeMPD:replace:2025`, lee `@uri`,
`@maxDuration` y `@executeOnce` del Event, y lo entrega como una experiencia lineal que gana sobre
cualquier otra (ADR 0114). Su semántica (el principal no se muestra y su tiempo avanza, 5.16.1) es la
del default lineal que la librería ya dibuja a cuadro entero (ADR 0016, 0107). Sólo Replace: Insert
corre el programa y no existe en `dynamic`.

Descartadas: el fork (atrás de upstream; HLS se hizo sobre hls.js sin modificar); dejar el lineal
afuera (el par HLS/DASH dejaría de mostrar el mismo stream en el corte LINEAR).

## Consecuencias

- dash.js no pasa esos atributos en el evento: la ruta para leerlos se mide en la fase (T-01), con el
  interceptor de respuesta del MPD como repuesto.
