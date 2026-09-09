---
id: "0033"
title: Mientras se arrastra, la posición la manda el puntero y no el video
status: accepted
scope: phase-07
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El pintado de la barra tiene hoy una única fuente de verdad, el `currentTime`, y
un frame loop que lo repinta —`paint()` y el `loop()` del final de
`lib/controls.js`—. Es la misma forma que usa el renderer y por la misma razón: la
barra sigue al reloj, a un seek y a un cambio de tamaño sin cuatro fuentes.

Un arrastre rompe esa premisa, porque agrega una segunda fuente que durante el
gesto es la que manda. El ADR 0032 dice que el video no se escribe hasta el
release, así que durante el arrastre el `currentTime` está quieto: sin un estado
que el loop respete, el frame siguiente repinta la pelotita donde está el video y
el arrastre no se ve.

## Decisión

Hay un **estado de scrub** con la fracción que el puntero pide, y mientras existe
`paint()` lee de ahí en lugar del `currentTime`. Lo leen las tres cosas que
dependen de la posición —el `fill`, el `knob` y el reloj `elapsed`—, así que la
barra entera cuenta lo mismo durante el gesto.

`paintRanges` no participa: las marcas dependen del largo del programa y no de la
posición, así que un arrastre no las mueve.

**El video no se escribe hasta el release.**

## Consecuencias

- La única fuente de verdad sigue siendo una en cada momento: el `currentTime`
  cuando no hay gesto, y el puntero mientras lo hay. No hay un instante con las
  dos prendidas.
- El reloj de la izquierda dice a dónde se va a saltar mientras se arrastra, que
  es lo que hace legible el gesto sin agregar nada a la pantalla.
- El player no busca durante el arrastre, que sobre HLS es la diferencia entre un
  gesto y una tormenta de pedidos.
- El estado tiene que cerrarse por todos sus finales o la barra queda congelada:
  el release, y también el `pointercancel`. Es la contrapartida y está en la T-01.
