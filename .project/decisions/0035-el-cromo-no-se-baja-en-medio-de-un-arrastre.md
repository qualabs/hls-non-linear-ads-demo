---
id: "0035"
title: El cromo no se baja en medio de un arrastre
status: accepted
scope: phase-07
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El cromo se esconde solo con un temporizador —`arm()`, `hide()`, y el presupuesto
variable `hideMs`, que es distinto para un mouse y para un dedo—. Ese temporizador
no sabe nada de lo que el usuario está haciendo: cuenta desde el último evento que
llamó a `show()`.

Un arrastre lento, o un dedo apoyado sobre la pelotita sin moverse mientras se
decide, se come el presupuesto entero. Y cuando el cromo se baja, la barra se va
de abajo del dedo con el gesto todavía en vuelo.

## Decisión

**Mientras hay un scrub en vuelo, `hide()` no corre.** Al terminar el scrub se
llama a `show()`, que vuelve a armar el temporizador como siempre.

## Consecuencias

- El gesto sobrevive a durar más que el presupuesto, que es el caso que lo rompía.
- El cromo no queda arriba para siempre: el gesto termina y el temporizador
  arranca de cero desde ahí, que es lo mismo que hace cualquier otro control.
- Descartado llamar a `show()` en cada `pointermove` del scrub. Es la versión que
  parece más simple y falla justo en el caso que este ADR existe para cubrir, el
  dedo apoyado y quieto, donde no hay moves que renueven nada.
