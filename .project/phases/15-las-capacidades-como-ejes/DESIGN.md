# Diseño — fase 15: las capacidades como ejes

Sale de la reunión de Nicolás con David Hassoun del 2026-09-28 (análisis con citas en
`projects/sgai-for-hls/.project/knowledge/reunion-david-2026-09-28.md`, sección 1). La spec
decidió ese mismo día que el Player declara su capacidad como **ejes separados**
(decodificadores, imagen sobre video, HTML sobre video: R29.1), y Nicolás dijo "empecemos por
ejes". Compromiso: tenerlo en `demo/stage-pair/` el 2026-09-29, antes de que David grabe.

## El hallazgo que define la fase: el filtro va en `lib/`

Hasta la fase 14 la librería **manda** `qa-decoder-count` y no lo vuelve a leer (lo dice su
propio JSDoc en `lib/concurrent-hls.js`: *"nothing else happens to it on this side"*). La
adaptación era toda del lado "APS", horneada por valor en dos playlists (ADR 0083). Lo que pide
ahora Nicolás es lo contrario, y es lo que dice R5.6: el APS devuelve todas las opciones y **el
Player** elige. Eso no se puede hacer en la página sin reimplementar la resolución del
asset-list, así que entra a `lib/`. La fase 14 no tocaba `lib/`; ésta sí, y por eso su criterio
es el de no-regresión de la fase 11.

**El repliegue que pide David ya existe en `lib/`**: `resolveAssetList` manda un asset cuyo
bloque no se puede dibujar a su `URI` de nivel superior como lineal (ADR 0019), y saltea el asset
que no tiene ni bloque usable ni `URI` (primer escalón de D.5). Lo único que falta es el paso que
decide que un bloque "no se puede dibujar" **por capacidad**.

## Decisión 1 — el Player filtra las opciones, y el APS estático devuelve todas

- El bloque `X-AD-CREATIVE-SIGNALING` admite, en cada ítem del `payload`, una lista
  `options`: cada opción es un `{ type, layout }` como el que un ítem ya lleva. El orden es la
  preferencia (R5.5). Un ítem sin `options` es una sola opción, así que ningún asset-list
  existente cambia de significado.
- Un paso explícito de la librería, `selectOption`, recorre las opciones en orden y se queda con
  la primera que la capacidad declarada satisface (R5.6). Cada descarte se loguea con su motivo.
- Una opción pide `1 + (elementos de video)` decodificadores —el primario cuenta— y pide
  imágenes si tiene algún elemento `image/*`.
- **Si no queda ninguna, el ítem no se puede dibujar** y el asset cae por el camino que ya
  existe: `URI` → lineal; sin `URI` → salteo (R5.7 / D.5).
- **Sin capacidad declarada no se filtra**: se toma la primera opción, que es exactamente lo que
  hace hoy un cliente con una sola. Es R29.2, y es lo que hace que las otras cuatro demos no se
  enteren.

Descartado: filtrar en la página (reimplementa `resolveAssetList` fuera de la librería, y lo que
David presenta es el SDK); mantener una playlist por escalón además del filtro (dos mecanismos
para lo mismo, y el horneado es justo lo que Nicolás sacó).

## Decisión 2 — la API y los nombres que viajan

```js
QualabsConcurrentHls.attach(hls, {
  container,
  capabilities: { videoDecoders: 1, imageOverVideo: true }
});
```

- Los nombres de la API son los ejes de R29.1 en camelCase, y en el pedido viajan con el nombre
  de la spec: `sgai-video-decoders`, `sgai-image-over-video` (`1`/`0`). DASH los fijó el
  2026-09-28. El comentario de `DECODER_COUNT_PARAM` ya decía que el día que la spec tuviera
  nombre, ése reemplazaría a `qa-decoder-count`.
- `decoderCount` se va. Lo usaba sólo `stage-pair`; ninguna otra demo lo pasa.
- El snippet de Nicolás en la reunión (`concurrentPlaybackPlugin.create(player, conf={countDecoders,
  canRenderImages, canRenderHTML})`) es la misma idea con la superficie que la librería no tiene:
  la librería se engancha con `attach`, no con `create` (ADR 0015).
- **HTML queda afuera**: el renderizador no dibuja HTML (`lib/media.js` conoce `<img>` y
  `<video>`), así que la librería no puede declarar el eje con un valor que sea verdad sobre sí
  misma, y un control que lo prende promete algo que no pasa.
- Cambiar la capacidad sigue rearmando el player (se lee una vez, como en el 0083). La propiedad
  de clase que se cambia en caliente (1.4 de la nota) queda afuera: la librería no tiene teardown.

## Decisión 3 — un break con default lineal y otro sin

- A y B llevan `URI` de nivel superior (el lineal de su break) y su tag lineal de Apple.
- **C no tiene default**: el asset concurrente no lleva `URI` y la playlist no lleva el tag
  lineal. Es "contenido que no se interrumpe": el pane de fábrica no pone nada, y el nuestro pone
  el banner si puede y si no, lo saltea.
- Descartado: dejar el tag lineal en C para que el pane de fábrica no cambie. En cámara se
  contradice: el publisher dice "esto no se interrumpe" y un cliente lo interrumpe igual.
- Costo nombrado: D.2 hace obligatorio el `URI` de cada Asset-Description. Un asset sin `URI` es
  lo que D.5 manda saltear, y es la forma más chica de decir "sin default" en esta capa; en la
  spec el default es el interstitial de la base (ADR 0005 de sgai-for-hls, `SUPERSEDE`).

## Decisión 4 — la convivencia con el 0084

Con imágenes y un decodificador el aviso sale en imagen, que es el 0084 tal cual. Lo nuevo es el
escalón de abajo: sin ninguna opción satisfacible, lineal o salteo. El 0084 decía que nuestro
cliente ya no bajaba al lineal por falta de decodificadores; sigue siendo cierto mientras haya
imágenes, y deja de serlo cuando el dispositivo declara que no las tiene.

## Riesgos

| riesgo | mitigación |
| --- | --- |
| el cambio en `lib/` rompe lo que ya anda | la suite y las costuras contra el conteo al abrir (216, verde); tests nuevos de `selectOption` con sus controles (T-01) |
| el filtro no filtra y la pantalla igual "se ve bien" | se mide sobre el pedido, el JSON y los `<video>` vivos: el JSON idéntico en las cuatro combinaciones y la composición distinta (T-05) |
| los scripts de medición de la fase 14 leen `posiciones`, `rica` y `magra` | se actualizan en la T-05, no se dejan rotos |
| menos de un día | sin rediseño de página: se cambian el control y un panel |

## 2026-09-28 — el break sin default es A y no C

Al escribir la señalización apareció que el lineal de C (KOVRIN 16:9) no se usa en ninguna otra
parte de la demo: sacarle el default a C dejaba una de las nueve piezas autoradas sin aparecer.
A es el único break cuyo lineal es también su aviso concurrente, así que el sin default pasa a
ser A. El ADR 0087 se escribió hoy y se corrigió en el mismo día, antes de que nada se apoyara
en él.
