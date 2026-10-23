---
id: "0097"
title: Las opciones viajan en layoutOptions; el APS estático devuelve todas y el Player filtra
status: accepted
scope: project
date: 2026-10-20
supersedes: "0085"
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0085 decidió que el APS estático devuelve todas las opciones de un aviso en la clave
`options` de cada ítem del `payload`, y que la librería se queda con la primera que la capacidad
satisface.

El 2026-10-20 David Hassoun renombró en SVTA2053 (`v3-DRAFT`) la clave y su objeto: `options` pasa
a `layoutOptions` y `SlotOption` a `LayoutOption` (4.4.9, Table 5, Table 12, Table 16, 5.3.3,
Code 7). La Table 5 dice ahora: *"layoutOptions — Array<LayoutOption> — Yes, for a concurrent
presentation — An ordered list of the presentations of the creative, in order of preference. A
concurrent presentation is always carried in layoutOptions, even when it has a single one."* La
spec no dice nada de seguir aceptando `options`. Lo renombra igual en toda la sección, también en
el texto que lo explica. La Table 31 sigue diciendo que la librería acepta el layout directo en
el slot, sin `layoutOptions`, como una sola opción.

En la misma revisión, 5.3.3 agrega del lado del APS: *"It is RECOMMENDED that the APS not return
any layoutOption the declared capabilities do not support, and omit it from the slot instead. [...]
When they are not sent, the APS SHOULD answer with all the layoutOptions of each slot. Whatever the
APS answers, the Player selects the option it presents."*

## Decisión

**Un ítem del `payload` lleva `layoutOptions`, una lista ordenada de `{ type, layout }`, y la
librería se queda con la primera que entra en las capacidades configuradas (ADR 0096).**

- `selectOption` y `narrowBlock` leen `layoutOptions` y nada más. Un ítem que trae `options`
  es, para la librería, un ítem sin layout propio: no se puede dibujar y el asset cae a su
  default o se saltea. No hay compatibilidad hacia atrás porque la spec no la pide.
- Un ítem sin `layoutOptions`, con el layout directo en el slot (la forma que emite el Layout
  Controller), sigue siendo una sola opción, como dice la Table 31.
- El resto del 0085 queda igual: se recorre en orden, se descarta lo que pide más decodificadores
  que `concurrentVideo` o imágenes con `concurrentImage` en `false`, cada descarte se dice con su
  motivo, sin ninguna opción el asset va a su `URI` como lineal o se saltea, y sin capacidad
  configurada gana la primera.
- **El APS de las demos sigue devolviendo todas las opciones**, declare lo que declare el
  dispositivo. Es un servidor de archivos estáticos (`server.mjs`, y los buckets de GCS) que no
  puede leer la query. La spec lo pone como RECOMMENDED y no como obligación, y el Player filtra
  igual. Queda como punto abierto para David.

## Consecuencias

- Los tres asset-lists de `stage-pair` (`signalling/asset-list-break-{a,b,c}.json`) los vuelve a
  escribir `scripts/escribir-asset-lists.mjs` con `layoutOptions`. El diff es una línea por
  archivo. `senalizar-contenido.sh`, `js/inspect.js` y la suite de la demo leen la clave nueva.
- Lo publicado en el bucket de `stage-pair` todavía lleva `options` y la librería vieja. Las dos
  cosas cambian juntas cuando se vuelva a publicar, así que la demo publicada no queda rota en
  ningún momento.
- Un asset-list escrito antes de la v3 deja de dibujarse en la librería: cae a su lineal. Las
  otras cuatro demos no usan opciones y no cambian.
