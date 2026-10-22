---
id: "0099"
title: Se quita assetListTiming, y la página que quiere los breaks por adelantado los lee de hls.js
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## 2026-10-22 — nota: los dos Abiertos, cerrados

**La barra la sigue decorando la librería (opción 1).** David Hassoun lo decidió el 2026-10-22:
`createControls` sigue pintando un rango por cada entrada de `provider.programRanges()`, los
provisionales incluidos, y `demo/shared/js/date-range-marks.js` queda como está: un helper de
página, con test, que ninguna página monta y que existe para quien dibuje una barra propia. Las
cuatro páginas no cambian.

**Una página en pausa en t=0 ya pide la primera lista sin esperar al play.** `bufferedEndAt` salta
un hueco menor a `BUFFER_HOLE_TOLERANCE`, 0,1 s, entre el playhead y el rango bufereado de
adelante (y entre dos rangos), con la misma regla que `BufferHelper.bufferInfo(media, pos,
maxHoleDuration)` de hls.js: `pos + maxHoleDuration >= start`, y los rangos a menos de eso se
funden. El valor es el `maxBufferHole` por defecto de hls.js 1.7.2 (`src/config.ts`:
`maxBufferHole: 0.1, // used by stream-controller and gap-controller`), el que su
`getFwdBufferInfo` usa para medir el buffer hacia adelante mientras reproduce. Con el primer rango
en 0,067 s, el buffer de una página en pausa en 0 llega hasta su fin y el break a 14 s de
`hydration-break` se pide antes del play. Tests en `test/asset-list-timing.test.js`.

**Lo que el Abierto de abajo decía de hls.js no era cierto, y se corrige acá.** hls.js NO corre
el playhead al inicio del buffer en este caso, y tiene el mismo comportamiento que tenía
`bufferedEndAt`:

- `interstitials-controller.ts`, `checkBuffer`: mide con
  `BufferHelper.bufferInfo(this.primaryMedia, this.timelinePos, 0)`, sin tolerancia; con
  `timelinePos` en 0 y el buffer desde 0,067, `bufferInfo.end` es 0 y `updateBufferedPos` no avanza
  (`this.bufferedPos < bufferEnd` es falso).
- `stream-controller.ts`, `seekToStartPos`: sólo ajusta el arranque al inicio del buffer
  (`delta < skipTolerance`, con `skipTolerance = max(maxBufferHole, maxFragLookUpTolerance)`, 0,25
  s) adentro de `if (startPosition >= 0 && currentTime < startPosition)`, que en un VOD es 0 contra
  0: falso.
- `gap-controller.ts`, `poll`: con el elemento en pausa sale temprano (`pausedEndedOrHalted`), y el
  salto del hueco inicial (`MAX_START_GAP_JUMP = 2.0`) sólo corre `if (!media.paused)`.

O sea que el player de fábrica tampoco pide la lista de un interstitial en pausa en 0: lo hace al
darle play, cuando el navegador o el gap controller pasan el hueco. La tolerancia es entonces el
único lugar donde la librería es MENOS estricta que hls.js, y se eligió el número más chico con el
que hls.js mismo da un hueco por irrelevante. Queda dicho en el comentario de
`BUFFER_HOLE_TOLERANCE`.

El resto de este ADR sigue en pie.

## Contexto

El ADR 0098 hizo que el asset-list de cada break se pida cuando hls.js lo pediría, y dejó
`assetListTiming: 'eager'` como opción para las cuatro páginas que contaban algo sobre la línea de
tiempo (`hydration-break`, `multiview-offer`, `race-multiview` y `race.html` de `stage-pair`). Su
"Abierto" preguntaba si quitarla.

El 2026-10-22 David Hassoun lo decidió: "lets remove it but add in the necessary functionality to
decorate the progress bars with the ad breaks not in our library but in the demo pages themselves
where needed. what im thinking is the pages can get the manifest from the hls.js implementation i
believe then look for the date ranges and the planned-duration value to decorate the progress bar.
the rest should stay true to the hls.js functionality."

## Decisión

- **`assetListTiming` no existe más.** La librería pide cada asset-list con la regla de hls.js
  (`assetListDue`, ADR 0098) y no tiene otro camino. Una opción desconocida se ignora, como
  cualquier otra que `attach` no lee. La razón es la de David: quedarse fiel a hls.js, que no tiene
  un modo de pedir todos los asset-lists de entrada.
- **Lo que una página quiere saber de un break antes de su lista lo lee de lo que hls.js ya
  parseó**, y no le pide a la librería que adelante pedidos. hls.js 1.7.2 deja en
  `details.dateRanges` (LEVEL_LOADED / LEVEL_UPDATED) cada Date Range con `startTime` (calculado
  del START-DATE contra el EXT-X-PROGRAM-DATE-TIME de su segmento), `plannedDuration` y
  `duration`. `demo/shared/js/date-range-marks.js` es eso escrito una vez para las demos:
  `breaksOfDateRanges` (PLANNED-DURATION primero, DURATION si no está), `barFractions` (las
  fracciones de la barra, puras y con test en `demo/shared/test/`) y `markBreaksOnBar` (lo que se
  monta sobre una barra propia). Vive en `demo/` y no en `lib/` por el ADR 0015.
- **No se monta en ninguna página todavía.** Las cuatro páginas dibujan su barra con los controles
  de la librería, y esa barra ya marca cada break desde el segundo cero con los mismos datos del
  tag (`programRanges()`, `provisional`, ADR 0098). Montar el helper además dibujaría cada break dos
  veces. Ver Abierto.
- **Lo que las páginas mostraban de todos los breaks por adelantado ahora se llena a medida que
  llega cada lista.** La fila, la tarjeta o el pliegue de un break cuyo rango sigue `provisional`
  dice que su asset-list se pide cuando el programa está bufereado hasta él, como hace hls.js, y se
  completa cuando llega. Las secciones que vuelven a pedir el asset-list para mostrarlo crudo lo
  piden después de que lo pidió el player, nunca antes.
- **El guion de `hydration-break` resuelve cada beat a medida que puede** (`anchorWaits` en
  `js/story.js`): uno anclado a un aviso espera a que llegue la lista de su break, y sólo se
  descarta, con error en consola, si la lista ya llegó y el aviso no existe.

## Consecuencias

- `hydration-break`: el break está a los 14 s, adentro del primer buffer, pero con el player en
  pausa en la placa de apertura la lista recién se pide al darle play (ver Abierto). Los seis beats
  salen en su segundo (verificado en Chrome headless). La galería de formas y los pliegues del
  asset-list aparecen un instante después del play, no al cargar.
- `multiview-offer`: las tres filas, las tres tarjetas y los tres pliegues están desde el
  principio; el del break a 45 s se completa a ~15 s de programa y el de 120 s a ~90 s. La
  comparación de campos aparece con la primera oferta, y ninguna oferta se anuncia como "la más
  larga" mientras quede un catálogo sin leer.
- `race-multiview`: la única ventana (28 s) se completa apenas arranca la reproducción.
- `race.html`: las cinco filas están desde el principio; las tres primeras se completan al
  arrancar, la cuarta y la ventana unos 30 s antes de abrir. Un salto que pasa por encima de un
  break no pide su lista (regla de hls.js), así que esa fila queda "announced by its tag".
- Las secciones de las demos que muestran el asset-list crudo lo piden por segunda vez, después del
  player, como antes lo pedían por segunda vez al cargar.

## Abierto

- **¿La barra la decora la librería o la página?** Hoy `createControls` (lo que dibujan `attach` y
  `attachControls`) pinta sobre el riel un rango por cada entrada de `provider.programRanges()`,
  coloreado por `kind` (`RANGE_COLOURS`), incluidos los provisionales del tag antes de que llegue la
  lista. Opción 1: queda en la librería, como está, y el helper de `demo/shared/` sólo se usa en una
  barra que no sea la de la librería. Opción 2: la librería deja de marcar breaks en su barra y cada
  página monta `markBreaksOnBar` sobre ella; exige que la barra exponga dónde dibujar, copiar el
  helper en cada demo (cada bucket publica una carpeta) y rehacer `attachControls`, cuyo
  `provider` existe para eso. Recomendación: la 1, porque la barra de la librería ya lee lo mismo
  que hls.js (el tag, con PLANNED-DURATION) y es la que el integrador recibe sin escribir nada.
- **Una página en pausa en t=0 no pide la primera lista hasta el play**, aunque el buffer ya pase el
  break: el primer rango bufereado arranca en 0,067 s, y `bufferedEndAt` no salta huecos, así que
  el fin del buffer es el playhead. hls.js corre el playhead al inicio del buffer al arrancar; acá
  sigue en 0. Afecta a `hydration-break` (el guion pausa en la placa de apertura) y a cualquier
  página que no arranca sola.
