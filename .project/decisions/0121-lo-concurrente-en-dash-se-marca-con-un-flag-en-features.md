---
id: "0121"
title: Lo concurrente en DASH se marca con features.concurrentPresentation, sin versión nueva ni @value
status: accepted
scope: phase-19
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Un lector de §6.1 que hace tracking con lo que recibe contaría una impresión de un concurrente que
nunca dibujó. En HLS lo evita la clase propia (6.6.5). En DASH el esquema es el mismo para los dos
casos.

## Decisión

El sobre lleva `features.concurrentPresentation: true`, obligatorio en la carriage de 6.7. La versión
2 ya define que un lector trata como error un flag de `features` que no soporta e ignora el payload
(5.2.2.1). Ni versión 3 (rompería a todo lector de la 2 sin cambiar la estructura, 5.1) ni `@value`
(Table 24 lo pide omitido, partiría el esquema en dos EventStreams por Period, y no protege nada que
el flag no proteja). La librería descarta los sobres sin el flag: son señalización de 6.1.

## Consecuencias

- El lector conforme a 5.2.2.1 queda protegido; el que no respeta los flags, no, y 6.7.8 lo dice.
- Es una fila nueva de Table 18, para David.
