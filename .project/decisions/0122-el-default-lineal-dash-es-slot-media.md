---
id: "0122"
title: El default lineal de un corte concurrente DASH es Slot.media
status: accepted
scope: phase-19
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

En HLS el default lineal es el `URI` del asset (6.6.4, Table 30). En el sobre de DASH no hay asset.

## Decisión

El default lineal es `Slot.media` (4.4.3), un MPD (`application/dash+xml`). Un Slot sin `media` es
un corte sin default lineal, como el asset sin `URI` de 6.6.4. 4.1 prohíbe referenciar la media de
un slot en el esquema, salvo los assets del layout: la propuesta para la spec es extender esa
excepción a la media de un slot concurrente, que tampoco está en la línea de tiempo cosida.

## Consecuencias

- `dash/signalling.js` arma con los slots la forma que `resolveAssetList` ya lee: un asset por Slot,
  `URI` de `Slot.media`, `DURATION` de `Slot.duration`.
- Es un cambio de 4.1, para David.
