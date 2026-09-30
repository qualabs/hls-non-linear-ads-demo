---
id: "0092"
title: La barra del player nativo de index no marca el break que saltea
status: accepted
scope: phase-15
date: 2026-09-30
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La barra del pane nativo marca los breaks que programó su hls.js (`programRanges` de
`js/stock-player.js`). Desde el ADR 0091 hls.js programa también el break A, que no tiene default
y saltea, así que la barra marcaba un break en el que el pane no reproduce nada. David pidió que
esa marca se vaya en cuanto se sabe que el break se saltea y no vuelva nunca.

## Decisión

- En `index.html` la barra del pane nativo **no marca un break que su hls.js saltea**. Se sabe por
  el propio schedule: la lista llegó y no le dio ningún asset (`assetListLoaded` en true con
  `assetList` vacío).
- **Lo que se sabe lo guarda la página y no la instancia**, en un `Set` de `app.js` que comparten
  los dos panes. Un salto reconstruye el player y un seek hace que hls.js vuelva a pedir la lista,
  y ninguno de los dos trae la marca de vuelta.
- `inspect.html` no pasa el `Set` y su barra nativa sigue marcando los tres.

## Consecuencias

- Es la regla del ADR 0018 (una barra marca lo que reproduce el player sobre el que está) aplicada
  a un break que se programa y no se reproduce.
- Hasta que llega la lista de A la marca se ve: medido, menos de un segundo en local y unos
  segundos desde el bucket. hls.js pide esa lista unos cinco segundos antes del break, así que
  la marca se va antes de que el programa llegue a A.
- Medido en hls.js 1.7.2: un break con default, una vez cargado, tiene un asset, y vuelve a "no
  cargado" después de reproducirse, así que nunca cumple la condición. Si una versión futura de
  hls.js cambiara eso, `test/verificar-marca-a-nativo.py` lo detecta: B y C tienen que seguir
  marcados.

> **Nota del 2026-09-30.** David pidió lo mismo para el modo nativo de `inspect.html` (T-22), así
> que el punto que decía que `inspect.html` no pasa el `Set` ya no vale: también tiene el suyo, de
> la página, porque ahí un cambio de modo y un salto en modo nativo reconstruyen el player.
