---
id: "0123"
title: PRE, POST y ONCE en DASH van en una clave cue del sobre, con el vocabulario de HLS
status: accepted
scope: phase-19
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El esquema de SVTA no tiene dónde decir cuándo se ejecuta un corte respecto de la reproducción, y un
Event genérico no tiene atributos para eso. En HLS es `CUE` (ADR 0110-0112).

## Decisión

Una clave `cue` en el sobre, definida por la carriage de 6.7, con los valores de `CUE` de HLS. Va en
el sobre y no en el Pod porque es de la carriage, no del modelo del aviso. La librería aplica las
reglas de los ADR 0110-0112 tal cual. `@executeOnce` de 23009-1 no se usa: tiene otra semántica de
conteo (5.16.2.2) y sólo existe para Alternative MPD; el texto lo aclara.

## Consecuencias

- Es una tabla nueva de 6.7.2 (claves del sobre propias de 6.7), para David.
