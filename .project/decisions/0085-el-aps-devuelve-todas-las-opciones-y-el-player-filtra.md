---
id: "0085"
title: El APS devuelve todas las opciones y el Player las filtra por su capacidad
status: accepted
scope: project
date: 2026-09-28
supersedes: "0083"
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0083 hacía viajar `qa-decoder-count` y horneaba la respuesta por valor: una playlist por
escalón, cada una con sus asset-lists. La librería mandaba el número y no lo volvía a leer.

En la reunión del 2026-09-28 David dijo que el APS *"should, not must"* respetar la capacidad,
y que si igual devuelve algo que el dispositivo no puede, el SDK cae al repliegue. Nicolás lo
bajó así: el APS de la demo devuelve siempre todas las opciones, y el SDK filtra. Es R5.6 de la
spec: el Player recorre las opciones en orden y dibuja la primera que su capacidad y el slot
admiten.

## Decisión

**El APS estático devuelve todas las opciones del aviso, y la librería las filtra.**

- Un ítem del `payload` puede llevar `options`, una lista ordenada de `{ type, layout }`. El
  orden es la preferencia de quien vende (R5.5). Un ítem sin `options` es una sola opción.
- `selectOption` es un paso explícito de la librería: recorre en orden, descarta la opción que
  pide más decodificadores que los declarados —el primario cuenta como uno— o imágenes cuando no
  se declaran, y dice cada descarte con su motivo.
- Si no queda ninguna, el ítem no se puede dibujar y el asset toma el camino que ya existía:
  su `URI` como lineal (ADR 0019) o, sin `URI`, se saltea (D.5).
- Sin capacidad declarada no se filtra y gana la primera opción (R29.2).
- Una sola playlist y un solo asset-list por break, idéntico para cualquier capacidad.

## Consecuencias

- Lo que del 0083 sigue siendo cierto: no hay servidor, el parámetro viaja de verdad en el
  pedido, y cambiar la capacidad rearma el player porque se lee una vez. Lo que deja de serlo es
  la respuesta horneada por valor y el juego de asset-lists por escalón.
- **La librería ahora lee la capacidad que manda.** Antes era un dato para el ad server; ahora
  además decide qué se dibuja de este lado. Un APS que respeta la capacidad y uno que no
  producen la misma pantalla.
- La prueba en cámara cambia: ya no es "la respuesta cambia", es **"la respuesta es la misma y
  la pantalla no"**.
