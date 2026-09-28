---
id: "0086"
title: La capacidad se declara en ejes y viaja con los nombres de la spec
status: accepted
scope: project
date: 2026-09-28
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La spec decidió el 2026-09-28 que el Player declara su capacidad en ejes separados y nunca
como una clase (R29.1): `sgai-video-decoders`, `sgai-image-over-video`, `sgai-html-over-video`.
David propuso en la misma reunión un único valor enumerado; Nicolás dijo "empecemos por ejes".
La librería tenía una sola opción, `decoderCount`, y un parámetro propio, `qa-decoder-count`,
cuyo comentario ya decía que lo reemplazaría el nombre de la spec cuando existiera.

## Decisión

```js
QualabsConcurrentHls.attach(hls, {
  container,
  capabilities: { videoDecoders: 2, imageOverVideo: true }
});
```

- `capabilities` reemplaza a `decoderCount`. Cada eje es opcional y el que falta no viaja (R29.3).
- En el pedido del asset-list viajan `sgai-video-decoders=<n>` y `sgai-image-over-video=1|0`.
  Desaparece `qa-decoder-count`.
- **El eje HTML no está**: el renderizador de esta librería no dibuja HTML, así que no hay valor
  que la librería pueda declarar siendo verdad, y un control que lo prende promete algo que no
  pasa.

## Consecuencias

- Si la spec de HLS fija otros nombres, se cambian dos constantes de `lib/signalling.js`.
- `decoderCount` lo usaba sólo `stage-pair`, así que sacarlo no rompe ninguna otra demo.
- El snippet que Nicolás pegó en la reunión (`create(player, {countDecoders, canRenderImages,
  canRenderHTML})`) queda como la idea; el ejemplo para la presentación es el de arriba.
