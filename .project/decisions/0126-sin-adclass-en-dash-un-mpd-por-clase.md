---
id: "0126"
title: Sin ?adclass= en DASH: el publicador sirve un MPD por clase
status: accepted
scope: phase-19
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

En HLS la clase del corte se elige por URL con `EXT-X-DEFINE:QUERYPARAM` (ADR 0113). En el MPD no
hay sustitución de variables en atributos; Annex I de 23009-1 sólo parametriza pedidos (I.1).

## Decisión

El prototipo no tiene `?adclass=` en DASH: las dos caras del par son nuestra librería y leen el
esquema de SVTA. Para la spec, la recomendación es que un publicador sirva un MPD por clase del lado
del servidor (el origen o el APS lo eligen por la query, que es como DASH personaliza), dicho como el
equivalente de 6.6 para `?adclass=`. Señalizar el break dos veces haría que un player con las dos
clases lo ejecute dos veces.

## Consecuencias

- Es la pregunta abierta 5 del diseño, que va como nota para David.
