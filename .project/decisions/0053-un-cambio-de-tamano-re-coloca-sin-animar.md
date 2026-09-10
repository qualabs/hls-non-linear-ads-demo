---
id: "0053"
title: Un cambio de tamaño re-coloca sin animar
status: accepted
scope: phase-09
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

`place()` corre por dos caminos distintos y hoy no los distingue, porque hasta
ahora no había razón. Uno es **componer**: cambió el aviso activo. El otro es
**re-colocar**: el área se movió más de medio píxel, o sea que alguien
redimensionó la ventana, entró a pantalla completa, o recién llegó la metadata del
video (`tick()`, `renderer.js:263-284`).

Con una transición puesta, los dos caminos escriben la misma propiedad y no quieren
lo mismo. Redimensionar animando sería la ventana arrastrando la imagen atrás de sí
misma, un cuadro por detrás del borde durante todo el gesto.

## Decisión

**`place()` recibe cuál de los dos caminos es, y escribe la `transition-property` en
consecuencia**: `transform` cuando compone, `none` cuando re-coloca. La propiedad
viaja en la misma pasada que la geometría, así que el camino de re-colocar no
arranca ninguna transición aunque el valor cambie.

`tick()` ya calcula la diferencia entre los dos casos —`nextKey !== key` contra
`resized`— así que no hay que derivar nada nuevo.

## Consecuencias

- Redimensionar y entrar a pantalla completa siguen siendo instantáneos, con break
  en pantalla o sin él.
- **Escribir la `transition-property` en la misma pasada que la geometría es también
  lo que hace que la transición arranque del todo.** `clear()` le borra al primario
  el atributo `style` entero, y una declaración que viviera sólo en el estado
  anterior se iría con él: la que decide es la del estado posterior al cambio. Los
  dos requisitos se cumplen con la misma línea.
- Un redimensionado en medio de una transición la corta y salta al valor nuevo. Es
  correcto —el tamaño de la ventana manda sobre una animación— y el caso es que
  alguien entre a pantalla completa exactamente durante los 380 ms de una entrada.
  Aceptado sin mitigación.
