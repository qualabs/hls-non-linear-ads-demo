---
id: "0055"
title: La ventana no se toca y al creativo no se le recorta nada
status: accepted
scope: phase-09
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Que la transición se pague con el tiempo del aviso (ADR 0052) habilita una lectura
equivocada: que haya que **recortarle o demorarle contenido al creativo** para
hacerle lugar al efecto. Arrancar el aviso 200 ms más tarde para que entre
difuminado sobre negro, o cortarlo 120 ms antes para que salga, son las dos formas
naturales de equivocarse acá.

La diferencia entre esa lectura y la correcta es la línea entre esta fase y una que
rompe el mecanismo, porque el proyecto entero se apoya en que los avisos son
elementos de video reproduciendo de verdad y en que la ventana declarada es la única
fuente de la activación (regla 5 del contrato).

## Decisión

**El aviso arranca en el instante 0 de su ventana, suena y se ve completo. Y la
ventana no se estira.**

Lo que ocurre durante los primeros 380 ms es que el contenido primario se achica
**encima**, con el aviso ya jugando debajo. Lo mismo a la salida: los últimos 120 ms
del creativo se ven difuminándose en lugar de no verse.

Nada de esta fase toca `build`, `attachAsset`, `applyPlayback`, `applyAudio` ni el
`startAt` con el que un nodo arranca. El control es de código y no de intención: si
la implementación termina cortando o demorando el arranque de un aviso, es la
lectura equivocada y hay que volver.

## Consecuencias

- No se pierde un cuadro de ningún creativo y no se demora ningún arranque.
- **`warnIfCut` sigue midiendo en el mismo instante y dice lo mismo que antes de la
  fase.** Es el chequeo más barato de que la ventana no se movió: si esa advertencia
  cambia de comportamiento, algo de la agenda se metió donde no iba.
- La regla 5 del contrato queda intacta, así que el contrato entre las dos capas no
  cambia y `docs/contrato-senalizacion-renderizado.md` no se toca.
- El costo aceptado es que los últimos 120 ms del creativo se ven difuminados. Es la
  contrapartida directa de lo que Nicolás eligió al decir que el tiempo lo paga el
  aviso.
