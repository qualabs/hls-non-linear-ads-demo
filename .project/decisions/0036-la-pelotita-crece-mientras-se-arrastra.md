---
id: "0036"
title: La pelotita crece mientras se arrastra, y en reposo no cambia
status: accepted
scope: phase-07
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El pedido de Nicolás empieza diciendo que la pelotita no está: *"veo que en los
controles no está la pelotita que me muestra dónde estamos en el player."*
Medido contra el player corriendo, **está y se ve**: `.qa-track__knob` existe
desde la fase 02, `paint()` la mueve todos los frames, y en pantalla es un punto
de 14 px en el `--qa-accent` de la demo con anillo blanco, sobre la cabeza del
fill y por encima de las marcas.

La lectura de por qué la vio ausente es una lectura y no una medición: **un punto
que sólo informa no se lee como un agarre.** Sin nada que se pueda hacer con él,
se lee como la punta del fill.

Si eso es lo que pasó, el arrastre lo arregla solo, y este ADR existe para la
parte que el arrastre no dice por sí misma: que el punto es agarrable antes de que
alguien lo haya agarrado, y que el agarre está pasando mientras pasa.

## Decisión

**Mientras dura el scrub, la pelotita se dibuja más grande.** Una clase sobre el
nodo que ya existe y una regla en la hoja de estilos que ya existe, con el tamaño
expresado sobre `--qa-rail` como todo el resto del cromo.

**En reposo no cambia nada**: ni el tamaño, ni el color, ni la forma.

## Consecuencias

- El gesto se confirma solo: crecer es la respuesta a que el agarre agarró, y es
  lo que hace cualquier player, que es el estándar que el propio pedido nombra.
- Sigue escalando igual en fullscreen y en mobile, porque el tamaño se expresa
  sobre el token y no en píxeles.
- Descartado cambiar el tamaño o el color en reposo. Sería tocar lo que no se
  midió: el punto se ve, y agrandarlo en reposo cambia cómo se ve la barra en
  cámara, que es lo que la fase 04 dejó cerrado. Si después de esto la pelotita
  sigue leyéndose como ausente, ahí el número que falta es el del tamaño en reposo
  y se mide aparte.
