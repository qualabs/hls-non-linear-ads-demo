---
id: "0005"
title: Hacer el POC sobre VOD con los Date Ranges escritos en la media playlist
status: accepted
scope: phase-01
date: 2026-09-03
supersedes: null
superseded_by: null
---

## Contexto

Hay dos formas de entregarle al player los Date Ranges de una tanda. La
de siempre es escribir los tags en la media playlist. La otra son los
Scheduled Date Ranges del Apéndice H de
`draft-pantos-hls-rfc8216bis-wwdc2026`, donde un único tag con
`CLASS="com.apple.hls.daterange-schedule"` y un atributo `X-URI` apunta a
un JSON con una clave `DATERANGES`, es decir una tanda entera resuelta en
una sola ida al servidor, al estilo de un VMAP.

hls.js 1.7.2 no tiene nada de eso. Buscando
`com.apple.hls.daterange-schedule`, `X-SCHEDULE-OFFSET` y `DATERANGES` en
todo el fuente, lo único que aparece es `RECENTLY-REMOVED-DATERANGES`,
que es de las delta playlists y no tiene relación.

La demo, además, se muestra grabada, y la ventana de grabación es del 28
al 30 de septiembre.

## Decisión

El contenido primario del POC es un VOD empaquetado en HLS, y los Date
Ranges van escritos como tags en la media playlist. Tanto la playlist
como los asset-list son archivos servidos por un servidor de archivos
estáticos. No hay ad server, no hay APS, no hay live, y no se usa el
mecanismo de agenda del Apéndice H.

## Consecuencias

La demo es reproducible y grabable, que es lo que la ventana de
grabación necesita, y no depende de ninguna pieza de infraestructura que
pueda fallar mientras se graba.

Hay dos notas técnicas que hay que respetar al empaquetar. La primera es
que la especificación pide que una media playlist con `EXT-X-DATERANGE`
tenga también al menos un `EXT-X-PROGRAM-DATE-TIME`, porque `START-DATE`
se resuelve contra ese reloj. La segunda es un detalle práctico del
parser de hls.js: dos tags con el mismo `ID` se fusionan, así que cada
Date Range de la demo lleva su propio identificador.

Quedan descartadas dos alternativas:

- **Entregar los Date Ranges con una agenda del Apéndice H.** hls.js no
  soporta la clase de agenda, así que habría que implementarla antes de
  poder mostrar nada, y el propio Rob Walch ofrece la salida de poner los
  tags en la playlist para una demo. Su forma de datos se adopta igual,
  por el ADR 0006, que da el beneficio sin el costo.
- **Hacer live en lugar de VOD.** Agrega trabajo de empaquetado y una
  fuente de fallas durante la grabación, sin agregar nada a lo que se
  quiere demostrar.
