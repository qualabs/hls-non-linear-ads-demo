---
id: "0039"
title: El guion se arma con `settled`, y el primer beat es una placa con el player en pausa
status: accepted
scope: phase-08
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Los asset lists se piden por red. Al segundo cero no hay rangos, así que un guion que
resuelve sus anclas al cargar la página las resuelve todas contra una lista vacía.

`provider.programRanges()` devuelve un `settled` justamente para esto: vale `true` cuando
la fuente no puede entregar más rangos y no queda ninguno a medio resolver. Los Date
Ranges de esta demo van en la media playlist (ADR 0005), así que la capa de señalización
los ve todos en el primer `LEVEL_UPDATED` y pide los asset lists ahí mismo.

## Decisión

**El guion se arma cuando `settled` es `true`, y el primer beat es una placa con el
player en pausa.**

Con eso la carrera **desaparece en lugar de mitigarse**: la página arranca en pausa
mostrando su primera frase, y el programa no empieza a correr hasta que esa placa se va,
momento en el que la señalización hace rato que está resuelta.

## Consecuencias

- No hay estado intermedio que haya que sostener, ni anclas resueltas dos veces, ni un
  beat que se pierde porque llegó antes que su rango.
- Es además la apertura que la estética pide: una idea por pantalla, y el video entra
  después de la frase que dice qué se va a ver.
- El intervalo entre el arranque y el `settled` no está medido, y no hace falta que lo
  esté: la placa no depende de que sea corto.
- Descartado resolver cada ancla tarde, cuando el programa se le acerca. Anda, y es más
  código para sostener un caso que la placa de apertura ya eliminó.
