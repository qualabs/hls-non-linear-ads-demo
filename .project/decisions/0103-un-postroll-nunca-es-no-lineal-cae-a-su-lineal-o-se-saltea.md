---
id: "0103"
title: Un postroll (CUE="POST") nunca se presenta como aviso no lineal; cae a su lineal después del programa, o se saltea
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0102 leyó `CUE` y aplicó sólo `PRE`; un Date Range concurrente o de multi view con
`CUE="POST"` seguía ubicándose en su START-DATE, y su Abierto proponía no soportarlo. El
2026-10-22 David Hassoun decidió, por el coordinador: *"it should auto fail to the linear ad if
defined as a standard interstitial, or skip if only non-linear is defined, for VOD."* Y para live,
seguir a hls.js.

## Lo que hace hls.js 1.7.2, leído en su fuente

- **Dónde lo pone:** al fin del primario, no en su START-DATE. `interstitials-schedule.ts`:
  `const primaryDuration = details.live ? Infinity : details.edge;` y, en `resolveOffsets` y
  `parseSchedule`, `postroll ? primaryDuration : interstitial.startTime`.
- **Cuándo pide la lista:** en `onBufferedToEnd` (`interstitials-controller.ts`): "Buffered to
  post-roll", `if (interstitial.cue.post) { ... this.bufferedToItem(item, 0); }`.
  `BUFFERED_TO_END` lo dispara el buffer controller cuando agregó el último fragmento de una
  playlist terminada (`endOfStream`), así que nunca en una live.
- **Cuándo lo reproduce:** en `onMediaEnded`, que pasa al ítem siguiente del schedule: después del
  fin del primario.
- **En live:** con `primaryDuration = Infinity` el postroll queda en un punto que ningún playhead
  alcanza. Sólo existe cuando la playlist trae su ENDLIST.

## Qué es "lineal definido" en este código

Hay dos fuentes posibles y sólo una aplica al pane nuestro:

- **El default lineal del asset-list**: el `URI` con su `DURATION` de cada asset (Apéndice D.2),
  la parte estándar (ADR 0019). Es lo que la librería ya reproduce como repliegue a mitad de
  programa (`Experience.fallback`).
- **El tag de Apple apareado** (`com.apple.hls.interstitial`, mismo break, ADR 0090/0091): lo
  reproduce hls.js de fábrica en el pane nativo. En el pane nuestro hls.js corre con el
  interstitials controller apagado (`hlsConfig`, ADR 0002), así que ese tag **nunca** se reproduce
  ahí; la librería sólo lo reporta como rango. Y por el ADR 0090 los dos tags nombran el mismo
  asset-list, así que su parte estándar es la misma que la del punto anterior.

Por eso la lectura implementada es la primera: el `URI` del asset-list del tag concurrente.

## Decisión

- **Un postroll concurrente o de multi view nunca presenta su aviso no lineal**: después del fin no
  hay programa sobre el cual dibujarlo. Sus `layoutOptions` ni se miran.
- **Lo que se reproduce es el default lineal de cada asset** (`resolvePostRoll`, pura), en orden, a
  cuadro entero, cuando el programa termina, cada uno hasta el fin de su asset (ADR 0019). Un asset
  sin `URI` con `DURATION` se saltea solo (D.5); un postroll sin ninguno no reproduce nada.
- **Su lista se pide cuando hls.js la pide**: con la fuente cerrada (ENDLIST) y el programa
  bufereado hasta el fin (`postRollDue`, pura): `BUFFERED_TO_END` del hls.js del primario, o el
  `ended` del elemento, lo que llegue primero. No al cargar.
- **Su ventana es el fin del programa** (`programEnd`, pura: `details.edge`, o `null` en live). No
  entra en `experiences` ni en `activeAt`, porque el reloj del programa se detiene en su fin; no
  ocupa tiempo del programa, así que no está en `programRanges()` y la barra no lo marca. El
  proveedor lo expone en `postRolls()`: `{ id, kind, state, startTime, experiences }`.
- **Lo reproduce `lib/postroll.js`**, del lado del renderizado (ADR 0003, verificado por
  `npm run check`): en el `ended` del primario arma un `<video>` a cuadro entero en la capa con el
  mismo `attachAsset`, y pasa al siguiente en su `ended`; un primer pedido que falla saltea ese
  aviso. Reporta en `onPresented` y `onTracking` con `postroll: true`. Un `seeking` o un `play` del
  primario (volver al programa) lo saca.
- **Live:** como hls.js. Mientras la playlist no tenga ENDLIST el postroll no tiene lugar ni se
  pide; cuando lo trae, vale lo de VOD. Probado sólo con entradas simuladas.
- **Un tag de Apple con `CUE="POST"`**, que la librería sólo reporta, se ubica en el fin del
  programa con `postroll: true`.
- **`stage-pair` tiene un postroll**: el break `post` de `stage.json`, `CUE="POST"` en sus dos tags,
  START-DATE a los 186 s (la spec lo exige; ninguno de los dos clientes lo usa), banner de ZUMBRA
  con default lineal ZUMBRA 16:9. Sin media nueva. El par de compatibilidad se mantiene: cuando el
  programa termina, el pane de fábrica reproduce el lineal del tag de Apple y el nuestro el mismo
  lineal del mismo asset-list.

## Consecuencias

- En `inspect.html` aparece una tarjeta "Break POST of 5 · after the programme ends (t = 197.998s)",
  que dice que su lista se pide al bufferear hasta el fin y que el aviso no lineal no se presenta;
  la tarjeta 2 muestra el pedido cuando llega el fin del buffer y la decisión ("plays its linear
  default, full frame, when the programme ends"). El salto "break POST" cae 5 s antes del fin.
- Durante el postroll los controles siguen mandando sobre el programa: play sobre un programa
  terminado lo vuelve a empezar desde 0 y saca el postroll. No hay pausa del postroll.
- Sin pre-validación para el postroll: el primer pedido de su lineal lo hace el reproductor, y si
  falla el aviso se saltea.
- Tests: `test/post-roll.test.js` (funciones puras, la señalización sobre una instancia falsa, live
  simulado, y el reproductor sobre un document falso) y `demo/stage-pair/test/signalled-run.test.js`.

## Abierto

- **¿El tag de Apple apareado cuenta como "lineal definido" en el pane nuestro?** Hoy no (opción 1,
  implementada): en el pane nuestro el interstitials controller está apagado, así que ese tag no se
  reproduce, y el lineal es el `URI` del asset-list del tag concurrente, que por el ADR 0090 es el
  mismo archivo. Opción 2: cuando un postroll concurrente no tiene default lineal pero hay un tag de
  Apple con `CUE="POST"` apareado (mismo break) cuyo asset-list sí lo tiene, la librería pide ESA
  lista y reproduce su lineal. Sólo difiere si los dos tags apuntan a listas distintas, que el ADR
  0090 descarta en estas demos; cuesta aparear tags por break, algo que la señalización no hace hoy.
  Recomendación: la 1.

> **Nota del 2026-10-22.** Cerrado por el ADR 0106: queda la opción 1. Con un juego de tags por stream (ADR 0105) no hay tag de Apple apareado, así que la opción 2 queda sin objeto; un postroll de clase Apple lo reproduce hls.js, también en nuestro pane.
