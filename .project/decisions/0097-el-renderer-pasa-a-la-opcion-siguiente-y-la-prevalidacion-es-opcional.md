---
id: "0097"
title: El renderer pasa a la opción siguiente cuando un asset no carga, y la pre-validación es opcional
status: accepted
scope: project
date: 2026-10-20
supersedes: "0096"
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0096 hizo el primer pedido de cada asset en la señalización, al resolver la lista ("opción
A"): si fallaba, la señalización pasaba a la opción siguiente que entra, después al default lineal,
y si no quedaba nada salteaba el asset. El renderer recibía una sola opción resuelta por
experiencia.

Eso deja dos huecos. El primer pedido de la pre-validación no es el pedido que dibuja: un asset que
contestó al resolver puede fallar 3 s antes de la ventana, cuando `attachAsset` lo pide de verdad, y
el renderer no tenía a qué pasar. Y cada asset se pide dos veces, lo que con un servicio real de
decisión de avisos tiene costo.

El 2026-10-20 David Hassoun aprobó el diseño que sigue ("opción C" siempre prendida, y la "A" como
paso opcional), y ese mismo día pidió que la pre-validación quede apagada por default.

## Decisión

**El fallover es del renderer y está siempre prendido.**

- La señalización le entrega al renderer, por experiencia, la lista ORDENADA de las `layoutOptions`
  que entran en las capacidades: `Experience.options`, cada una `{ index, type, elements }`. La
  primera es la que se intenta primero y es la que ya describen `type` y `elements`. Atrás va el
  default lineal del asset, `Experience.fallback`, como una experiencia propia con la ventana del
  asset entero, o `null` si no hay. `Experience.assetId` dice de qué asset vino, porque la unidad
  del repliegue es el asset (ADR 0019).
- `attachAsset` (lib/media.js, el único que conoce hls.js) recibe `onLoaded()` y
  `onFailed(motivo)`. Cuenta sólo la primera carga (SVTA2053 5.3.3): el error del pedido de la
  playlist que referencia el `uri` (`MANIFEST_LOAD_ERROR`, `MANIFEST_LOAD_TIMEOUT`,
  `MANIFEST_PARSING_ERROR`) o un error fatal antes de cargarla, el `error` de un `<img>` o de un
  archivo progresivo, o ningún aviso en 10 s. Un segmento que falta después no cuenta.
- Cuando un asset de la opción montada falla, el renderer **saca la opción entera** (todos sus
  elementos ya montados) y monta la siguiente, después el default, después nada. Lo decide
  `nextAfterFailure`, y lo que se presenta en cada instante lo decide `presentedAt`, dos funciones
  puras de `lib/renderer.js`. Una opción posterior tiene su propia clave (`attemptKey`), así que el
  plan de la composición destruye las cajas viejas y construye las nuevas aunque dos opciones
  repitan un id de elemento.
- **El ADR 0003 se mantiene.** El renderer recibe una señal genérica ("cargó", "falló" con una
  frase que no lee) y nunca ve un status, una playlist ni hls.js. Nada vuelve del renderizado a la
  señalización. `npm run check` lo verifica.
- **Cuándo pasa.** El renderer construye el aviso `PRELOAD_LEAD_SECONDS` (3 s) antes de la ventana,
  y un 404 contesta en milisegundos, así que el fallover pasa adentro de la precarga y nadie lo ve.
  Si el fallo llega con la ventana ya abierta (un servidor que agota los 10 s sin contestar, o un
  seek adentro del aviso), la opción siguiente se monta tarde: en el segundo de su ventana en que va
  el programa, sin fundido, igual que una caja a la que se entra por un seek.
- **El integrador se entera de qué se presentó** por un callback nuevo, `onPresented`, distinto de
  `onResolved` porque pasa después y del otro lado de la costura: `{ id, itemId, outcome:
  'presented' | 'skipped', presented: { index, type, linear } | null, attempts, late, lateBy }`, con
  cada intento fallido y su motivo en una frase (`failed to load <uri> (HTTP 404)`).
- El tracking (ADR 0093) se alimenta de lo que el renderer presenta: un aviso salteado no es una
  impresión, y el default se reporta como lo que es. El aviso conserva su `itemId` entre opciones.
- La página puede leer lo que está en pantalla con `handle.presentedAt(time)`.

**La pre-validación es opcional y sólo descarta.**

- `preValidateAssets: boolean`, **default `false`**. Con `true`, el chequeo del ADR 0096 corre al
  resolver la lista, y su único efecto es sacar de `options` las opciones cuyo primer pedido falló
  (y reportarlo en `onResolved`, como antes). No tiene fallover propio: el del renderer es el único
  camino en ejecución. Con `false` no se pide nada por adelantado.
- **Por qué apagada por default (David Hassoun, 2026-10-20):** con un servicio real de decisión de
  avisos, los pedidos extra de assets pueden ser sensibles al tiempo y costosos, así que la
  librería no los hace salvo que el integrador los pida.
- `preValidateMethod: 'GET' | 'HEAD'`, default `'GET'`. Vale para playlists y archivos; una imagen
  se chequea siempre con `Image`, porque un `fetch` a otro origen no tiene status legible sin CORS.
  En HEAD, un 405 o un 501 reintenta el mismo URI con GET. Un 403 **no** reintenta: las URLs
  firmadas de S3 y CloudFront son por método, y un HEAD sobre una URL firmada para GET da 403 aunque
  el asset exista. Un valor desconocido se avisa por consola y vale `'GET'`, igual que la
  validación de las capacidades.
- `onResolved` suma `preValidation: { enabled, method }`, el `order` en que se entregaron las
  opciones de cada item, el `fallback` entregado y el `method` de cada pedido.

## Alternativas descartadas

- **Dejar sólo la pre-validación (ADR 0096).** No ve el pedido que dibuja y obliga a pedir cada
  asset dos veces.
- **Que el renderer le pida la opción siguiente a la señalización.** Haría cruzar algo del
  renderizado a la señalización, contra el ADR 0003. La lista ordenada viaja de una vez y el
  renderer decide solo.

## Consecuencias

- Sin pre-validación, una opción muerta cuesta un pedido fallido en la precarga y nada en
  pantalla. Con ella, cuesta un pedido al resolver y la opción no llega al renderer.
- Un fallo con la ventana abierta se ve: la opción siguiente aparece tarde, sin fundido.
- Un asset con varios items que cae al default reemplaza a todos sus items, y `onPresented` lo
  reporta para los items que el renderer ya había visto.
- `stage-pair` usa el default (`false`) en `index.html` e `inspect.html`; `inspect.html` tiene un
  interruptor "Pre-validate assets" que arranca apagado y muestra qué se entregó y qué se presentó.

## Abierto

- **GET o HEAD, a revisar (pedido de David Hassoun).** Otras implementaciones pueden apuntar a
  archivos muy grandes (un MP4 progresivo) donde una pre-validación con GET es cara. Hoy la librería
  corta el cuerpo apenas llega el status, lo que limita los bytes pero abre la transferencia igual;
  una implementación fuera de un navegador puede no cortarlo. Las alternativas a evaluar son HEAD
  (con la trampa del 403 de arriba) y un GET con `Range: bytes=0-0`.
- El timeout de 10 s sigue siendo una constante de la librería; la spec no da un valor.
