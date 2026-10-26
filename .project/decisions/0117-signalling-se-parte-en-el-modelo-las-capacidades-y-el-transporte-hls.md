---
id: "0117"
title: lib/signalling.js se parte en lib/experience.js, lib/capabilities.js y hls/signalling.js, y media.js y concurrent-hls.js pasan a hls/
status: accepted
scope: project
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Con la pregunta del ADR 0116, cinco archivos de `lib/` ya estaban del lado común (`renderer.js`,
`controls.js`, `multiview.js`, `tracking.js`, `postroll.js`: el grep del ADR 0003 no les encuentra
el transporte), y dos eran HLS enteros (`media.js` adjunta con hls.js; `concurrent-hls.js` cablea
hls.js con todo). `signalling.js`, 2059 líneas, mezclaba tres cosas: el modelo de un corte, las
capacidades y el transporte HLS.

## Decisión

- **`lib/experience.js`, el modelo de un corte**: lo que convierte el contenido del bloque SVTA en
  el contrato. `DEFAULT_PRIMARY_VOLUME`, `DEFAULT_AD_VOLUME`, `DEFAULT_PRIMARY`, `FULL_FRAME`,
  `parseViewport`, `resolveElement`, `VIEWPORTS_BY_COUNT`, `MAX_BOXES`, `viewportsFor`,
  `OFFER_TYPE`, `DEFAULT_PRIMARY_NAME`, `isOffer`, `NOT_DECLARED_BY_AN_OFFER`, `resolveView`,
  `resolveExperience`, `layoutElements`, `identifiersOf`, `blockIdentifiers`, `LINEAR_TYPE`,
  `LINEAR_ELEMENT_ID`, `usablePayload`, `linearItem`, `withOptions`, `rangeOfExperiences`,
  `activeAt`.
- **`lib/capabilities.js`, las capacidades y las opciones** (SVTA2053 5.3.3): `CAPABILITY_KEYS`,
  `usableCapabilities`, `PRE_VALIDATE_METHODS`, `usablePreValidation`, `needsOf`, `whyNot`,
  `selectOption`, `firstRequestsOf`, `narrowBlock`, `describeOption`.
- **`hls/signalling.js`, el transporte HLS**: todo lo demás (las clases y su `kind`, `BLOCK`, el
  sobre del asset-list y su resolución, la URL de `X-ASSET-LIST`, el Date Range, el pre-roll y el
  fin del programa según hls.js, cuándo se pide la lista, `onceProgress`, `postRollDue`, y el
  cableado). Conserva el nombre: sigue siendo la capa de señalización del ADR 0003.
- **`hls/media.js` y `hls/concurrent-hls.js`**, enteros.
- **Un auxiliar que no nombra HLS pero sólo lo usa el cableado de HLS se queda en `hls/`**
  (`bufferedEndAt`, `onceProgress`, `postRollDue`, las posiciones del pre-roll). Sube a `lib/` cuando
  la fase DASH lo reuse.
- **Las declaraciones se mueven enteras y en su orden, sin tocar su código.** Sólo `withOptions`
  gana `export` (la usan `resolveAssetList` y `resolvePostRoll`), que el build borra. Los comentarios
  de lo que sube a `lib/` que nombran HLS se reescriben en el vocabulario del contrato.
- **El build arma el mismo dist**, mismo nombre y misma URL, en este orden: `lib/experience.js
  lib/capabilities.js hls/signalling.js lib/multiview.js lib/renderer.js lib/controls.js
  hls/media.js lib/tracking.js lib/postroll.js hls/concurrent-hls.js`.
- `package.json`: `main` y `exports` a `hls/concurrent-hls.js`, `hls/` en `files`; el `name` no
  cambia. Los tests se quedan en `test/`; cambian sólo sus imports.

## Consecuencias

- La fase DASH importa el modelo y las capacidades de `lib/` sin mover nada.
- El dist cambia de orden y de comentarios, no de declaraciones (ADR 0118).
- Quien busque una función de la vieja `lib/signalling.js` la encuentra por la lista de arriba.
- Descartado: mover sólo archivos enteros (el modelo quedaría en `hls/`, contra la estructura
  acordada); subir todo lo que no nombra HLS (es adivinar qué reusa DASH); un archivo por concepto
  (archivos sin lector que los pida); un `lib/signalling.js` que reexporte (`lib/` nombraría HLS y
  el build no concatena un reexport).
