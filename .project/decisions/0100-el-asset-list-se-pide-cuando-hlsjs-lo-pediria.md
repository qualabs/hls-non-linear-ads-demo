---
id: "0100"
title: El asset-list de cada break se pide cuando hls.js lo pediría, y eager queda como opción
status: accepted
scope: project
date: 2026-10-20
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## 2026-10-22 — nota: `'eager'` quitado por el ADR 0101

**La opción `assetListTiming` ya no existe.** David Hassoun eligió la opción 2 del Abierto de abajo
("¿Quitar `'eager'`?"): la librería pide cada asset-list sólo con la regla de hls.js, y las cuatro
páginas que pasaban `'eager'` llenan lo que muestran a medida que llega cada lista. Lo que una
página quiera saber de un break antes de su lista lo lee de los Date Ranges que hls.js ya parseó
(ADR 0101).

El resto de este ADR sigue en pie tal como está escrito: la regla, `assetListDue`, los rangos
provisionales en `programRanges()`, la pre-validación en el momento de la lista y el seek adentro
de un break. Por eso queda `accepted` con `superseded_by` en `null`. Lo que dejó de ser cierto son
las menciones a `'eager'` y a `assetListTiming` en la Decisión y el Abierto.

## Contexto

Hasta hoy la señalización pedía el `X-ASSET-LIST` de cada Date Range de nuestra clase apenas lo
veía en `LEVEL_UPDATED`: con la media playlist VOD (ADR 0005), todos al cargar. La pregunta estaba
abierta en `.project/PROJECT.md` ("Eager vs lazy asset-list resolution", planteada por David el
2026-09-30), y el ADR 0039 había descartado resolver cada break al acercarse por el guion de
`hydration-break`.

El 2026-10-20 David Hassoun aprobó cambiarlo para seguir el momento en que hls.js pide el
asset-list de un interstitial, y quedar alineados con la spec de HLS. No depende de
`preValidateAssets` (ADR 0099).

## La regla de hls.js, leída en el 1.7.2 que este repositorio vendoriza

En `interstitials-controller`, dos lugares terminan en `preloadAssets(event)`, que llama a
`assetListLoader.loadAssetList(event)` sólo si `assetList.length === 0 && !assetListLoader`:

- `updateBufferedPos(bufferEnd)`, que corre en cada `BUFFER_APPENDED` (`checkBuffer`): cuando el
  ítem del schedule que está en el fin del buffer hacia adelante del primario
  (`bufferInfo(primaryMedia, timelinePos, 0).end`) es posterior al que se está bufereando,
  `bufferedToItem(next)` → `bufferedToEvent` → `preloadAssets`. Es decir: **el asset-list se pide
  cuando el programa está bufereado hasta el comienzo del break**, y el adelanto es el buffer hacia
  adelante (30 s por default). En live suma una mirada adelante desde el borde de la playlist
  (`interstitialLiveLookAhead`); acá todo primario es VOD.
- `advanceSchedule`, cuando la reproducción, o un seek, cae en el ítem: `preloadAssets(event,
  assetIndex)`, la misma carga. **Un seek adentro de un break pide su lista en ese momento**, y el
  break espera a que llegue.

## Decisión

- **`assetListTiming: 'onDemand' | 'eager'` en `attach`, default `'onDemand'`.** Con
  `'onDemand'` la señalización mira el reloj y el buffer del primario (`timeupdate`, `seeking`,
  `progress` del elemento y `BUFFER_APPENDED` de hls.js) y pide el asset-list de un break cuando la
  regla de arriba lo dice. La regla es una función pura, `assetListDue({ startTime, duration }, {
  time, bufferedEnd })`: vence cuando el break no terminó y `startTime <= max(time, bufferedEnd)`.
  `bufferedEndAt` da el fin del rango bufereado que contiene al playhead, sin saltar huecos, como
  `bufferInfo(..., 0)`.
- Un break ya terminado no se pide: un seek que lo pasa no lo pide, y un seek de vuelta adentro sí.
- **Una diferencia con hls.js, dicha:** hls.js recorre su schedule de a un ítem y pide sólo el
  break siguiente; esto pide todo break al que el buffer ya llega. Sólo difieren con dos breaks
  adentro del mismo buffer, que ningún programa de acá tiene.
- **La barra no pierde marcas.** El rango de un break cuya lista todavía no se pidió está en
  `programRanges()` desde el principio, `provisional: true`, armado con el `DURATION` o
  `PLANNED-DURATION` del tag. Se reemplaza por el rango de lo que la lista resolvió, o se saca si
  resolvió en nada. `settled` sigue siendo "la fuente no puede traer más rangos y no hay listas en
  vuelo"; un break no pedido no está en vuelo, porque su rango ya está.
- **Con pre-validación prendida**, el chequeo corre en ese momento y sobre las opciones de ese break
  solamente.
- **`'eager'` queda para la página que necesita el programa entero de entrada**: las experiencias
  de cada break antes de que suene. Lo pasan explícito las cuatro páginas que cuentan algo sobre la
  línea de tiempo: `hydration-break` (el guion del ADR 0039 se ancla en los avisos de cada break),
  `multiview-offer`, `race-multiview` y `race.html` de `stage-pair`, que leen
  `provider.experiences` para nombrar ventanas futuras. `compatibility-pair` e `index.html` /
  `inspect.html` de `stage-pair` usan el default.

## Consecuencias

- **Lo visible en `stage-pair`:** el panel de pedidos de `index.html` y la tarjeta 2 de
  `inspect.html` ya no muestran los tres asset-lists al arrancar: cada uno aparece cuando el
  programa se bufereó hasta su break (con el buffer de 30 s, unos 30 s antes), igual que el pane
  nativo. Antes de eso la tarjeta dice "no request for this break yet". La barra sigue marcando los tres breaks
  desde el segundo cero.
- **La precarga de 3 s del renderer** se cumple en reproducción normal: la lista llega con el
  adelanto del buffer, mucho más que 3 s. **No se cumple tras un seek** a menos de 3 s de un break,
  o adentro de uno: la lista se pide en ese momento y el aviso entra cuando llega (más la
  pre-validación si está prendida), en el segundo de su ventana en que va el programa y sin fundido.
- **"El break espera a su lista", interpretado para lo concurrente:** hls.js detiene la
  reproducción hasta tener el interstitial; acá el programa nunca se detiene (ADR 0016), así que lo
  que espera es la composición, no el programa. Ver Abierto.
- Un break cuyo tag no declara largo no tiene marca hasta que llega su lista.
- El tracking no cambia: lee lo que se presenta, y una lista que llega tarde sólo adelanta o atrasa
  cuándo hay algo que presentar.

## Abierto

- **Un seek adentro de un break: ¿el programa debería esperar a la lista, como hls.js?** Hoy no:
  sigue corriendo y el aviso entra cuando llega (opción 1, implementada). La opción 2 es pausar el
  primario hasta que la lista y su primera carga estén, que es lo que hace hls.js con un
  interstitial pero contradice que lo concurrente nunca detiene el programa. Recomendación: la 1.
- **¿Quitar `'eager'`?** Opción 1 (implementada): queda como opción explícita para las páginas que
  necesitan el programa entero de entrada. Opción 2: sacarla y rehacer esas cuatro páginas para que
  esperen o se enganchen tarde a los datos. Recomendación: la 1 hasta que alguien pida la 2; las
  cuatro páginas están publicadas y sus guiones dependen de saber los avisos por adelantado.
