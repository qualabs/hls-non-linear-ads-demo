---
id: "0120"
title: El cuerpo del Event DASH es el sobre v2 de SVTA, un pod por corte
status: accepted
scope: phase-19
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

SVTA2053 v3 cubre DASH en §5, §6.1 y §6.5, y deja la carriage DASH de la presentación concurrente
para una edición futura (§1). Hace falta decir qué lleva el MPD por cada corte concurrente, como 6.6
lo dice para HLS con un `EXT-X-DATERANGE` por corte.

## Decisión

Un Event por corte en un EventStream `urn:svta:advertising-wg:ad-creative-signaling`. Su cuerpo es
un sobre de la versión 2 de tipo `pod` (Table 18), en CDATA (Table 25). El Pod lleva sus slots
adentro (`slots`, cada Slot con sus `options`, 5.3.3) o remotos en `$remote.slots` (Table 19), que
devuelve un sobre de tipo `slot`, con `features.remoteFields: true`. El prototipo usa la forma
remota en todos los cortes, para que el par HLS/DASH pida lo mismo; la de adentro se prueba con
fixtures.

Descartadas: un cuerpo propio que sólo apunta a una lista (inventa un formato al lado del de SVTA, y
el ASSET-LIST es de HLS); extender §6.5 con Alternative MPD a un MPD `type="list"` (Alternative MPD
reemplaza o inserta, no compone, y dash.js upstream no ejecuta ninguno de los dos); el `OverlayList`
de `sgai-for-mpeg-dash` (es la segunda opción); `@messageData` (deprecado y `prohibited` en el XSD de
23009-1 6ª ed., Table 44).

## Consecuencias

- La forma remota es el equivalente del ASSET-LIST: la pide el player, con las capacidades.
- dash.js entrega el cuerpo como string y lo borra a los 10 s: se lee al recibirlo.
