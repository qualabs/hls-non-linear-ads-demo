---
id: "0130"
title: inspect.html tiene modo DASH, y su tarjeta 1 lee el MPD que recibió dash.js
status: accepted
scope: project
date: 2026-11-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

`inspect.html` comparte el selector de modo con `index.html` (`js/capabilities.js`, `MODOS`), que
desde la fase 19 incluye `dash` (ADR 0127). Pero `inspect.js` sólo sabía armar `nativo` y `ours`:
`ROTULOS` no tenía `dash`, y `?modo=dash-2dec-img` tiraba "Cannot read properties of undefined
(reading 'rol')" y no cargaba nada, también en la página publicada. Además, la señalización DASH
pedía `$remote.slots` con `fetch(url).then(r => r.json())` y no entregaba la respuesta en
`onResolved`, así que la tarjeta 3 no tenía de dónde salir sin un segundo pedido. David eligió el
soporte DASH completo en `inspect.html`.

## Decisión

- **El modo DASH arma el mismo player que el pane DASH de `index.html`**: el bloque del integrador
  (`attach` antes de `initialize`, ADR 0128) pasa a `js/dash-player.js`, que usan las dos páginas.
- **Tarjeta 1: el Event del break, tal como está escrito en el MPD que recibió dash.js.** La página
  cuelga su propio `addResponseInterceptor` al lado del de la librería y corta el elemento del texto
  (`js/dash-mpd.js`, funciones puras): no se pide el MPD dos veces. Debajo, lo que la librería leyó
  (la ventana, de su `programRanges`, y el sobre) y lo que trajo el evento propio de dash.js en
  `EVENT_MODE_ON_RECEIVE`: con el cuerpo en CDATA, `messageData` `undefined` y el id como número,
  que es la razón del ADR 0128, mostrada en vivo y no afirmada.
- **Tarjetas 2 y 3: el pedido a `$remote.slots` con su query de capacidades, y el sobre `slot` que
  volvió, textual, del reporte de la librería.** `dash/signalling.js` lee la respuesta con
  `readListResponse` de `lib/ad-list.js` (la función del ADR 0129, que se muda ahí con un nombre sin
  vocabulario de HLS para que la costura del ADR 0003 siga verde; `hls/signalling.js` la sigue
  exportando como `readAssetList`) y entrega `response: { url, status, text, json }` en los breaks y
  en el post-roll. Un pedido por lista.
- **Tarjeta 4: igual que en HLS**, de `onResolved` y `onPresented`, con la falla deliberada de la
  primera opción del break C en su forma DASH (`.../missing-on-purpose/dash/manifest.mpd`).
- **Lo que DASH no tiene se dice en la página:** no hay cliente DASH nativo con qué comparar ni
  `?adclass=` (ADR 0126); el break lineal tradicional es un replace de Alternative MPD que dash.js no
  ejecuta y reproduce la librería (ADR 0125), sin lista que pedir, así que las tarjetas 2 y 3 dicen
  que no se pidió nada y por qué. `PRE`, `ONCE` y `POST` van en la clave `cue` del sobre (ADR 0123).
- **Un modo desconocido no rompe la página**: un `?modo=` que no se lee se dice en una línea
  (`#aviso`) y se juega el default; un `armar` con un modo sin rótulo no reconstruye nada y lo dice.

## Consecuencias

- `?modo=dash-<N>dec-<img|noimg>` funciona, con `?prevalidar=1` también, y la URL va y vuelve con el
  botón de modo.
- `demo/stage-pair/test/dash-mpd.test.js` (lectura del EventStream, emparejado por número, resumen
  del sobre, la frase sobre el evento de dash.js); `test/dash-signalling.test.js` (la `response` de
  DASH, un pedido por lista); `verificar-inspect-modos.py` pasa a ocho modos con un pedido por lista,
  sin excepciones, el failover del break C, el botón de modo y el modo desconocido.
- Corrige un detalle del ADR 0129, que ubicaba `readAssetList` en `lib/signalling.js`: estaba en
  `hls/signalling.js`, y desde ahora vive en `lib/ad-list.js` como `readListResponse`.
- Publicar el modo DASH sigue necesitando el contenido DASH en el bucket (`publicar.sh --publicar
  --con-contenido stage-pair`, CLAUDE.md).
