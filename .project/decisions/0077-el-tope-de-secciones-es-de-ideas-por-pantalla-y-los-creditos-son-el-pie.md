---
id: "0077"
title: El tope de secciones es de ideas por pantalla, y los créditos son el pie y no una sección
status: accepted
scope: phase-12
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El comentario de cabecera de `index.html` fija un tope: *"Three sections and a hard
cap of four in total counting the player: one idea per screen, and three is better
than four."*

La reestructura pide cuatro bloques abajo del player, así que a primera vista lo
rompe. Mirado de cerca no: **los créditos de hoy ya son un pie y no una sección.**
Llevan `chapter--end` con `min-height: 72vh`, contra las secciones que son `100vh`.

## Decisión

**El tope no se sube. La página queda con el player, tres secciones de pantalla
completa y el pie de créditos**, que es la misma forma que tiene hoy.

Y **el tope se reformula como lo que siempre fue: una idea por pantalla, no un
número.** Las tres ideas son la taxonomía de avisos, la clase concurrente, y la
señalización.

**El comentario de cabecera se reescribe en la misma task que lo vuelve falso.**

## Consecuencias

- **La regla sobrevive al cambio en lugar de ser esquivada por él.** Lo que se
  defendía era la idea por pantalla, y se sigue cumpliendo.
- **El archivo no queda describiendo otra versión de sí mismo.** Un comentario que
  describe tres bloques que ya no existen con ese nombre es exactamente el defecto que
  la fase 10 persiguió once veces, y en esta demo los comentarios de cabecera son la
  documentación real.
- Descartado subir el tope a cinco bloques: cinco pantallas abajo de un player es un
  documento y no una página de demo.
- Descartado fusionar la taxonomía con el mecanismo: son dos ideas, y fusionarlas deja
  la sección más larga de la página justo donde el lector recién llega.
