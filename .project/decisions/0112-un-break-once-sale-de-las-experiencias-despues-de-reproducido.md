---
id: "0112"
title: Un break con CUE="ONCE" sale de las experiencias y de la barra después de reproducido, como en hls.js
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0110 leyó `CUE="ONCE"` y no lo aplicó: un break `ONCE` se volvía a dibujar en un seek de
vuelta, con su tracking. Su Abierto recomendaba la opción de hls.js. El 2026-10-22 David Hassoun
la eligió: una vez que su ventana se presentó, sacarlo de las experiencias y de los rangos de la
barra, para que un seek de vuelta no lo redibuje ni vuelva a disparar tracking, con el disparador
exacto de hls.js.

## Lo que hace hls.js 1.7.2, leído en su fuente

- **Cuándo cuenta como reproducido:** `setSchedulePosition` (`interstitials-controller.ts`), al
  pasar del ítem del interstitial a otro ítem del schedule: `interstitial.hasPlayed = true;`,
  dispara `INTERSTITIAL_ENDED` y "Exiting an Interstitial": `if (interstitial.cue.once && this.hls)
  { // Remove interstitial with CUE attribute value of ONCE after it has played
  this.updateSchedule(); ...`. `hasPlayed` vuelve a `false` en `INTERSTITIAL_STARTED`.
- **Cómo sale:** `parseSchedule` (`interstitials-schedule.ts`) filtra
  `!(event.cue.once && event.hasPlayed)` en cada armado del schedule, así que no vuelve.
- **O sea: "reproducido" es "empezado y dejado", no "completo".** Se sale del ítem al terminar el
  break o por un seek fuera de él (el que el `X-RESTRICT` permita), y en los dos casos el break
  `ONCE` se va. Un seek que salta por encima nunca entró al ítem: no hay `INTERSTITIAL_STARTED`, y
  el break queda.

## Decisión

- **`onceProgress(range, entered, time)`, pura:** `entered` es si el programa estuvo adentro de la
  ventana del break (su rango, provisional o resuelto); está `spent` cuando entró y ahora está
  afuera.
- **`createSignalling` la corre en `timeupdate`, `seeking` y `seeked`.** Un break gastado sale de
  `experiences` (en el lugar, porque se entrega por referencia) y de los rangos, y no se vuelve a
  pedir. Si su lista llega después de gastado, no se agrega. Vale para las dos clases que la
  librería resuelve y para el tag de Apple que sólo reporta.
- **Efectos:** el renderer deja de dibujarlo, el tracking (que lee lo presentado) no vuelve a dar
  `slotStart`, y la barra deja de marcarlo.
- **Un postroll con `ONCE`** (ADR 0111): `lib/postroll.js` lo da por reproducido cuando su lineal
  arrancó, y no lo vuelve a reproducir en un fin posterior (por ejemplo, después de volver a
  empezar el programa).
- **`stage-pair`:** el break B lleva `CUE="ONCE"` en sus dos tags, por `stage.json` y
  `senalizar-contenido.sh`. El pane de fábrica lo saca de su schedule y el nuestro de sus
  experiencias: el par sigue mostrando lo mismo en los dos panes.

## Consecuencias

- En `inspect.html` con nuestra librería, la tarjeta de B dice `CUE="ONCE"`; después de pasar B,
  su marca desaparece de la barra y el segundo salto "break B" cae sobre el programa solo
  (verificado en Chrome headless: 1 caja adentro de B, 0 después, 0 tras el seek de vuelta). En
  `index.html` los saltos reconstruyen los panes, así que cada salto es un player nuevo y B vuelve
  a estar, igual que en hls.js con una instancia nueva.
- La granularidad de "entró" es la de `timeupdate` (unas 4 veces por segundo): una ventana de
  menos de un cuarto de segundo podría pasar sin ser vista. Ninguna de este repositorio lo es.
- Tests: `test/once.test.js` y `demo/stage-pair/test/signalled-run.test.js`.
