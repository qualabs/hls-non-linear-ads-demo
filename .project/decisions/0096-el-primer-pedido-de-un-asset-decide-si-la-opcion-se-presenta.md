---
id: "0096"
title: El primer pedido de cada asset decide si la opción se presenta, y se hace al resolver la lista
status: superseded
scope: project
date: 2026-10-20
supersedes: null
superseded_by: "0097"
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0095 deja que la librería se quede con la primera `layoutOption` que entra en las
capacidades configuradas. Si el asset de esa opción no existe (un 404 en su playlist), la
librería la dibuja igual: una caja negra, o un `<img>` roto, durante toda la ventana.

El 2026-10-20 David Hassoun agregó a SVTA2053 (`v3-DRAFT`, cambios con control de cambios de esa
fecha) un párrafo nuevo en 5.3.3:

> *"Asset load failure. Before it presents an option, the Player makes the first request for each
> of its assets: for a media asset, the request for the playlist its uri references (in HLS, its
> Multivariant Playlist or Media Playlist), and for an image, the request for the image. If the
> first request for any asset of the option fails, with an HTTP error status such as 404, or with
> a network error or timeout, the option cannot be presented, and the Player continues with the
> next layoutOption that fits. Only the first request for an asset governs this: a failure after
> it, such as a missing media segment during the presentation, is a playback error of the
> presentation, and does not cause the Player to change option or to fall back."*

En la misma revisión: *"The Player presents the first option that fits and whose assets load"*
(5.3.3), *"If no option of a slot fits the configured capabilities, or every option that fits
fails to load, [...] the Player applies the fallback of 6.6.4 [...]. If the first request for that
URI also fails, the asset is skipped"* (5.3.3), y en 6.6.4 *"If the first request for the URI of a
linear default fails, the asset is skipped, as in the last row of Table 30."* El ejemplo de 5.3.3
suma un cuarto dispositivo: *"A device configured with concurrentVideo 2 and concurrentImage true
whose first request for the backplate playlist of the first option returns HTTP 404 presents the
second."*

La resolución es eager (`.project/PROJECT.md`, "Eager vs lazy"): la señalización pide cada
asset-list apenas ve el Date Range y le entrega al renderizado la lista ya resuelta. El renderer
crea el `<video>` o el `<img>` 3 s antes de la ventana (`bringAhead`), y ahí `attachAsset` hace el
primer pedido del asset.

## Decisión

**El primer pedido de cada asset se hace en la capa de señalización, al resolver la lista y antes
de entregarla, y una opción con un primer pedido fallido se descarta como una que no entra.**

- `selectOption` recibe `loads` (lo que contestó cada primer pedido) y descarta una opción que
  entra pero falló, con el pedido en `failed` y un motivo que se lee en voz alta. Una opción que
  entra y tiene un pedido sin hacer frena el recorrido y lo devuelve en `pending`.
- `resolveWithFirstRequests` hace los pedidos por rondas: en la primera, los de la primera opción
  que entra de cada asset, todos a la vez; después, sólo lo que un fallo volvió necesario. Una
  lista donde todo carga cuesta una ronda, y la segunda opción no se pide si la primera cargó.
- **El default lineal se pide sólo cuando se va a reproducir**: cuando no queda opción. Si su
  primer pedido falla, el asset se saltea (`outcome: 'skipped'`, con `defaultFailed`). Un asset
  sin bloque, el aviso lineal de siempre, es el default lineal de su break y sigue la misma regla.
- **Cuenta sólo el primer pedido.** Lo que falla después (un segmento, una variante, la
  decodificación) es un error de reproducción del aviso elegido y no cambia de opción.
- Cómo se hace el pedido es de `lib/media.js` (`firstRequest`), del lado de la señalización del
  ADR 0003, y `attach` lo inyecta. Una playlist o un archivo se piden con `fetch`, que se corta
  apenas llega el status. Una imagen se carga con una imagen, porque `fetch` está sujeto a CORS y
  un `<img>` no. Sin respuesta en `FIRST_REQUEST_TIMEOUT_MS` (10 s) cuenta como fallo.
- El reporte de `onResolved` suma `requests` (cada primer pedido, con su resultado), el motivo del
  descarte de la opción fallida y `defaultFailed`. `inspect.html` de `stage-pair` ya mostraba el
  motivo de cada descarte, así que una conmutación se ve sin tocar su estructura.
- El renderer no cambia: recibe una lista donde la opción ya es la que carga.

## Alternativas descartadas

- **Observar el fallo en el renderer** (el `MANIFEST_LOAD_ERROR` de la instancia del aviso, el
  `error` del `<img>`) y pedirle a la señalización la opción siguiente. Es el pedido "real", pero
  llega 3 s antes de la ventana o con la ventana ya abierta. Obliga a que el renderer devuelva
  algo por la costura del ADR 0003 y a re-planear la composición en vivo. Además, la spec pide el
  pedido *antes* de presentar la opción, no durante.

## Consecuencias

- Cada asset de la opción elegida se pide dos veces: el primer pedido al resolver y el de
  `attachAsset` al dibujar. Una playlist es chica, y una imagen la sirve la caché del navegador.
  El segundo pedido no cuenta para la regla aunque falle.
- Un primer pedido que tarda demora `onResolved` y `settled` de su break hasta 10 s. Con la
  resolución eager eso pasa al cargar, no en la ventana.
- Los pedidos salen cuando llega la lista, no cuando empieza el break. Si la resolución pasa a
  lazy, los pedidos se mueven con ella sin cambiar la regla.
- Un servidor de assets tiene que contestar estos pedidos igual que contesta al player: CORS para
  la playlist, como ya lo pide hls.js.
- Sin `firstRequest` (los tests de antes, `resolveAssetList` llamado directo) no se pide nada y
  todo cuenta como cargado, que es como se comportaba la librería antes de este ADR.

## Abierto

- Cuánto es "timeout". La spec no da un valor. 10 s es una constante de la librería (ADR 0054).
- Si "the first request" es el pedido antes de la ventana o el de la presentación misma. Se tomó
  el primero, que es el que la frase "Before it presents an option" describe.

**2026-10-20 — nota.** Superseded por el ADR 0097: el fallover pasa al renderer y está siempre
prendido; el primer pedido al resolver la lista queda como paso opcional (`preValidateAssets`,
apagado por default) cuyo único efecto es sacar opciones de la lista que recibe el renderer. Lo que
sigue en pie de esta decisión: la regla (cuenta sólo el primer pedido), `firstRequest` en
`lib/media.js`, el timeout de 10 s y el pedido del default sólo cuando se va a reproducir.
