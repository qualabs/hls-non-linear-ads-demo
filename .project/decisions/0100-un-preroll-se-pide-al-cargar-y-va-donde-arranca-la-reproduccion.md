---
id: "0100"
title: Un preroll (CUE="PRE") se pide al cargar y va donde arranca la reproducción, como en hls.js
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## 2026-10-22 — nota: el preroll en live, como hls.js

**David Hassoun eligió la opción 1 del primer Abierto** ("Arranque más allá de 0, y live"): en un VOD
el preroll sigue yendo donde arranca la reproducción (`startPosition`), y pidió hacer también el
trabajo para live aunque acá no se pueda probar de punta a punta. Lo que hace hls.js 1.7.2, leído
en su fuente (`src/controller/interstitials-controller.ts`):

- **Dónde se une al live:** `getLiveStartPos` es `startPosition === -1 || (liveSync && liveSync -
  startPosition < behindLive) ? liveSync || 0 : startPosition`, con `behindLive =
  (targetduration || 10) * 3` y `liveSync = hls.liveSyncPosition` (el borde live menos la latencia
  objetivo, `latency-controller.ts`). Un preroll live sin `X-RESUME-OFFSET` retoma el primario ahí
  (`livePrerollResumption`), así que el -1 de `startPosition` en live **no** es 0: es el punto de
  unión.
- **Un preroll no vuelve a dispararse en los reloads:** `checkStart` entra al preroll sólo en la
  primera pasada (`timelinePos === -1`). El schedule se vuelve a armar en cada `LEVEL_UPDATED`, pero
  un evento ya conocido conserva su estado ("Update InterstitialEvent already parsed and mapped",
  `interstitials-schedule.ts`). Y un preroll que aparece en un reload posterior queda primero en el
  schedule, en 0, detrás de un playhead que ya pasó: no se alcanza nunca.

**Lo que hace la librería, con funciones puras en `lib/signalling.js`:**

- `liveStartPosition({ startPosition, liveSyncPosition, targetDuration })` es `getLiveStartPos`
  línea por línea, con una diferencia dicha: sin `liveSyncPosition` todavía, responde `null` ("no se
  sabe") en vez de 0, porque hls.js lo pregunta después de reproducir el preroll y esta capa tiene
  que ubicar la ventana antes. Un `liveSyncPosition` de 0 exacto es un 0 conocido.
- `preRollStart(startPosition, { live, liveSyncPosition, targetDuration })`: en VOD lo de siempre;
  en live, el punto de unión.
- `preRollPlacement(...)` decide al ver el Date Range: `{ start }`, `{ wait: true }` (live sin
  punto de unión: se ubica y se pide su lista en el update siguiente) o `{ late: true }` (visto por
  primera vez después de que la reproducción se unió: no se presenta). "Se unió" es el primer update
  leído con elemento de media, que es la condición de `checkStart`.
- El mismo Date Range en los reloads no se vuelve a pedir ni se mueve (ya lo garantizaba `done`).
  Un tag de Apple con `CUE="PRE"` en live, que la librería sólo reporta, se ubica igual.

**Sin probar contra un live real.** No hay primarios live en el proyecto; los tests de
`test/asset-list-timing.test.js` simulan las entradas (`live: true`, `liveSyncPosition`,
`targetduration`, reloads) sobre una instancia falsa. Lo que no simulan: el orden real entre el
`LEVEL_UPDATED` del latency controller y el nuestro (si el primero no tuviera todavía
`liveSyncPosition`, el preroll espera un update), y la ventana DVR que se corre con el tiempo.

El resto de este ADR sigue en pie.

## Contexto

El atributo `CUE` de `EXT-X-DATERANGE` (HLS, una enumerated-string-list con `PRE`, `POST` y
`ONCE`) dice cuándo se dispara un Date Range respecto del programa, independientemente de su
START-DATE. Hasta hoy la librería no lo leía: un Date Range concurrente o de multi view con
`CUE="PRE"` se ubicaba en su START-DATE y su asset-list se pedía cuando el buffer llegaba ahí, como
cualquier break.

El 2026-10-22 David Hassoun pidió, por el coordinador, que la librería soporte `CUE="PRE"` y que
una demo tenga un preroll. `POST` y `ONCE` quedan como propuesta (ver Abierto).

## Lo que hace hls.js 1.7.2, leído en su fuente

- **Lo parsea en todo Date Range, de cualquier clase:** `DateRange.cue` (`src/loader/date-range.ts`)
  es `attr.enumeratedStringList(this.attr.CUE ? 'CUE' : 'X-CUE', { pre, post, once })`. Y descarta
  el Date Range que dice PRE y POST a la vez (`isValid`: `this.cue.pre !== this.cue.post`), así que
  ese par nunca llega a una aplicación.
- **Dónde lo pone:** `InterstitialEvent.startOffset` es `this.cue.pre ? 0 : this.startTime`; el
  schedule ordena los PRE primero y los POST últimos sin mirar la fecha, y en `resolveOffsets` el
  inicio es `preroll ? 0 : postroll ? primaryDuration : interstitial.startTime`. El START-DATE de un
  preroll no cuenta.
- **Cuándo pide la lista:** en `checkStart`, que corre en `MEDIA_ATTACHED` y en `LEVEL_UPDATED` en
  cuanto hay media y la carga arrancó: `else if (interstitialEvents[0].cue.pre) {
  ... this.setSchedulePosition(index); }`, y `setSchedulePosition` llama a `preloadAssets`. **Al
  cargar, en pausa o no, sin esperar al buffer.** Lo hace a cualquier `startPosition`: el preroll se
  reproduce antes del primario empiece donde empiece.
- **El punto de retorno:** `resumeTime = startOffset + resumptionOffset`, con `resumptionOffset` =
  `X-RESUME-OFFSET` si está y el largo del break si no. Sin el atributo, el primario de un preroll
  retoma en su largo (forma de reemplazo); con `X-RESUME-OFFSET=0`, en 0. `X-PLAYOUT-LIMIT` recorta
  el largo (`duration = playoutLimit` si es menor), y `X-SNAP` sólo mueve inicio y retorno a bordes
  de segmento. Un preroll nunca es `appendInPlace` (`!this.cue.pre`).
- **`POST`:** se ubica en el fin del primario y su lista se pide en `BUFFERED_TO_END`.
  **`ONCE`:** después de reproducido (`hasPlayed`) se saca del schedule y no vuelve.

## Decisión

- **La librería lee `CUE` de cada Date Range de sus clases** (`cueOf`, pura): el `cue` que hls.js ya
  parseó, o el atributo con la misma regla. Sólo `PRE` cambia algo.
- **Un preroll concurrente o de multi view va donde arranca la reproducción** (`preRollStart`,
  pura): el `startPosition` del player si se le dio uno, 0 si no (el -1 de hls.js, "sin fijar", es 0
  en un VOD). No en su START-DATE. Es la lectura de hls.js trasladada a lo no lineal: hls.js lo pone
  antes del primario empiece donde empiece; un aviso no lineal no detiene el programa, así que "antes
  del primario" pasa a ser "sobre el primario, desde el segundo en que arranca", por el largo que
  declara su asset-list. Lo mismo vale para el rango de un tag de Apple que la librería sólo reporta.
- **Su asset-list se pide al cargar**: `assetListDue` lo da por vencido apenas hay elemento de media,
  sin mirar el buffer ni el reloj, que es la condición de `checkStart`. Su rango está en
  `programRanges()` desde ahí, provisional hasta que llega la lista, como cualquier break.
- **Un seek de vuelta adentro de su ventana lo vuelve a dibujar**, como a cualquier break: es lo que
  hace hls.js con un preroll sin `ONCE`, que queda primero en el schedule.
- **`stage-pair` tiene un preroll**: el break `pre` de `stage.json`, `CUE="PRE"` en sus dos tags,
  START-DATE en el instante del EXT-X-PROGRAM-DATE-TIME (la spec lo exige), 12 s, banner
  `lowerThirdOverlay` de KETRAVA con default lineal (KETRAVA 16:9) y la imagen en side by side (el
  16:9 congelado). Sin media nueva: el banner es la pieza de la carrera y el lineal, el de B. Lo
  escriben `senalizar-contenido.sh` y `escribir-asset-lists.mjs` desde `stage.json`.
- **El par de compatibilidad se mantiene.** El tag de Apple del preroll va en la forma de reemplazo
  (sin `X-RESUME-OFFSET`): el pane de fábrica reproduce el lineal a cuadro entero antes del programa
  y retoma el programa en 12 s; el nuestro dibuja el banner sobre los primeros 12 s. A los 12 s los
  dos panes están en el mismo segundo del programa, que es lo que el ADR 0082 afirma. Los dos piden
  la lista al cargar.

## Consecuencias

- Al abrir `stage-pair` los dos panes piden `asset-list-break-pre.json` antes del play. En
  `inspect.html` la tarjeta del break abre en el preroll ("preroll, CUE="PRE": its list is asked for
  at load"), con el rango y su `CUE="PRE"` en la tarjeta 1 y el pedido ya hecho en la tarjeta 2.
- En una máquina sin los creativos en video empaquetados (`content/creatives/` falta), la opción en
  video del preroll da 404 y el renderer pasa a la imagen; el lineal del pane de fábrica también da
  404, y lo que haga hls.js con ese error se ve en la consola del pane.
- Un Date Range con `CUE="POST"` sigue ubicándose en su START-DATE y uno con `ONCE` se vuelve a
  dibujar en un seek de vuelta: se leen y no se aplican.
- Tests: `test/asset-list-timing.test.js` (lectura del CUE, ubicación, pedido al cargar para las dos
  clases) y `demo/stage-pair/test/signalled-run.test.js` (el preroll en los dos manifests).

## Abierto

- **Arranque más allá de 0, y live.** *Cerrado en la nota del 2026-10-22 de arriba: opción 1, y
  live con el punto de unión de hls.js.* Implementado como hls.js: el preroll va donde arranca la
  reproducción. Opción 1 (la implementada): en `startPosition`, así que quien entra a los 30 s ve el
  preroll de 30 a 42 s, y un seek a 0 no lo muestra. Opción 2: siempre en 0 del programa, así que
  quien entra más allá de su largo no lo ve nunca. Recomendación: la 1, que es la de hls.js y la del
  nombre ("antes de lo que se mire"). En live hls.js lo ubica en el punto de unión
  (`livePrerollResumption`); acá el -1 de `startPosition` se lee como 0, que en live estaría mal. No
  hay primarios live en el proyecto, así que queda anotado y no resuelto.
- **`CUE="POST"`.** Opción 1: ubicarlo sobre los últimos segundos del programa, `[fin - largo,
  fin)`, y pedir su lista cuando el buffer llega al fin, como `BUFFERED_TO_END` en hls.js. Opción 2:
  no soportarlo: descartar el rango con un aviso en consola, en lugar de dibujarlo en su START-DATE
  como hoy. Recomendación: la 2 hasta que haya un caso, porque un aviso no lineal necesita programa
  abajo y después del fin no hay; y un multi view al final no tiene sentido.
- **`CUE="ONCE"`.** Opción 1: como hls.js, una vez que su ventana se presentó entera se saca de las
  experiencias y de los rangos, así que un seek de vuelta no lo redibuja ni vuelve a contar la
  impresión. Opción 2: ignorarlo, porque `ONCE` existe para no repetir una interrupción y un aviso no
  lineal no interrumpe. Recomendación: la 1, que es la de hls.js y evita impresiones dobles.
