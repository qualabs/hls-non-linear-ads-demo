---
id: "0120"
title: El reporte de onResolved lleva la respuesta del asset-list, y ninguna página lo pide dos veces
status: accepted
scope: project
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

`inspect.html` de `stage-pair` veía el pedido del asset-list de la librería con un
`PerformanceObserver` y después hacía su propio `fetch` a la misma URL para leer el cuerpo de la
tarjeta 3: cada asset-list se pedía dos veces. Lo mismo hacían, a propósito, las secciones de
señalización de `hydration-break`, `multiview-offer` y `race-multiview`, que esperaban a que el
player pidiera la lista y la volvían a pedir, porque la librería sólo entregaba el contrato
(experiencias resueltas) y esas secciones muestran el documento antes de esa lectura. Con un ad
server real un segundo pedido es una segunda impresión, y su respuesta no tiene por qué ser la
misma que resolvió el player. David eligió la opción A: que la librería exponga la respuesta que ya
recibió.

## Decisión

- **`onResolved(experiences, selection)` suma `selection.response = { url, status, text, json }`**,
  en los breaks y en los post-rolls: la URL de la que vino la respuesta (`Response.url`, o la pedida
  si no trae), su status HTTP, el cuerpo tal cual y el objeto parseado del que se resolvió el break.
  Lo arma `readAssetList` en `lib/signalling.js`, función pura exportada, que lee el cuerpo una sola
  vez como texto y lo parsea; un cuerpo que no es JSON sigue cancelando el break (Apéndice D.5),
  como con `response.json()`. Es el hook más cercano que ya existía y ya documentado; no se agrega
  otro callback.
- **`inspect.html` no pide nada para mostrar:** para un break nuestro, URL y cuerpo salen del
  reporte. Para las listas que pide hls.js (todos los breaks en modo nativo y, en nuestro modo, el
  break tradicional `AD-LINEAR`, ADR 0114/0115), el cuerpo sale del `assetListResponse` que hls.js
  guarda en su evento de interstitial, capturado en `ASSET_LIST_LOADING`; hls.js lo asigna antes de
  disparar `ASSET_LIST_LOADED`, así que está también para la lista sin default, cuyo evento nunca
  llega a un listener (fase 15, T-20). hls.js guarda el JSON parseado y no los bytes: se muestra
  re-serializado y la tarjeta lo dice. La URL de esas listas se sigue leyendo del
  `PerformanceObserver`, filtrada por el `_HLS_primary_id` de la sesión, porque hls.js no la entrega
  para esa misma lista; el observer sólo mira, no pide.
- **`hydration-break`, `multiview-offer` y `race-multiview`** guardan en su `app.js` la `response` de
  cada break por el ID del Date Range y su sección de señalización la muestra (en las dos de
  multiview, el texto tal cual) en lugar de pedirla de nuevo.

## Consecuencias

- Una página que muestra el asset-list muestra exactamente lo que el player resolvió, y cada lista
  sale una sola vez a la red. Medido en Chrome headless (8091).
- En `inspect.html`, en nuestro modo la tarjeta 2 aparece cuando la librería resolvió el break
  (con pre-validación, después de sus primeros pedidos), no cuando terminó el pedido.
- Si una lista no se puede leer, `onResolved` no se llama (como antes) y la página dice que no se
  pudo leer, sin reintentar.
- Tests: `test/asset-list-response.test.js` (forma de `readAssetList` y del reporte, un solo pedido
  por lista, break y post-roll); los fetch falsos de los tests de la señalización pasan a `text()`.
- Docs: `docs/integrating-the-library.md` (fila `onResolved` y §6), JSDoc de `attach` y de
  `createSignalling`.
