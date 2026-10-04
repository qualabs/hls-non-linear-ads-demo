---
id: "0093"
title: El AdIdentifier del Slot pasa por el contrato y sale en dos eventos de tracking
status: accepted
scope: project
date: 2026-10-04
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

SVTA2053 hace obligatorio el `identifiers` del Slot (Table 5): un array de AdIdentifier
`{scheme, value}` (Table 7), por ejemplo un Ad-ID. David pidió que las listas de la demo lo traigan
y que llegue al tracking. Las listas no lo traían, la herramienta del ADR 0004 no lo emite, y la
librería no tenía tracking.

## Decisión

- **El Slot es cada ítem de `payload` y no el sobre**, así que `identifiers` va al lado de `start`,
  `duration` y `layout` u `options`. Así lo muestra el Code 7 del borrador vigente
  (`sandbox/2026-10-02-svta-doc-update/borrador.md`), y así lo emite la herramienta:
  `{version: 2, type: "slot", payload: [...]}`.
- **Los valores son ilustrativos**: el esquema es el registro de Ad-ID (`ad-id.org`, el idRegistry
  del UniversalAdId de VAST) y los valores tienen la forma de un Ad-ID, pero no están registrados.
  Hay uno por aviso. En `stage-pair` lo declara `stage.json` por campaña y lo copian los dos
  generadores; en las listas escritas a mano, el mismo aviso lleva el mismo valor en todas.
- **La capa de señalización lo pasa sin interpretarlo**. `Experience.identifiers` es la lista de
  pares `{scheme, value}` bien formados, y vacía si no hay. Una lista sin el campo se sigue
  dibujando. El default lineal y el reporte de `onResolved` llevan los del Slot, porque el default
  es el mismo aviso reproducido de otra forma, y un aviso salteado tiene que poder nombrarse.
- **El tracking son dos eventos sobre el contrato**: `slotStart` y `slotEnd`, con los identifiers,
  entregados a `attach(hls, { onTracking })`. Viven en `lib/tracking.js`, que lee `activeAt` del
  proveedor decorado (lo que está en pantalla) en cada `timeupdate`. Está del lado del dibujo del
  corte del ADR 0003 y `verificar-cortes` lo revisa.

## Consecuencias

- Cuartiles, pausa, mute y las URLs de beacon son objetos de tracking del spec que ninguna lista de
  este repositorio trae. Se construirían sobre estos dos eventos. No se hicieron.
- Las ofertas de multi view no llevan `identifiers`: no son un aviso. Si el spec lo exige también
  ahí, es otra decisión.
- `test/fixtures/` no se actualizó, por el ADR 0023: los tests nuevos usan una lista escrita en el
  test con la forma del Code 7.
- En `stage-pair` el identificador es por campaña, así que dos piezas de la misma campaña (por
  ejemplo los avisos 1 y 4 de la carrera, banner y backplate de ZUMBRA) comparten valor. Si cada
  pieza tiene que tener el suyo, se mueve de la campaña a la pieza en `stage.json`.
