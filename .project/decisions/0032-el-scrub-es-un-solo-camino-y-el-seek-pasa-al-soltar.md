---
id: "0032"
title: El scrub de la barra es un solo camino, y el seek pasa al soltar
status: accepted
scope: phase-07
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La barra navega en el press: `track.addEventListener('pointerdown', …)` llama a
`seekFromEvent` y ahí termina el gesto. Eso alcanza para tocar un punto y saltar,
y no alcanza para lo que pidió Nicolás, que es agarrar la pelotita y llevarla:
un gesto que seekea al apretar ya no tiene nada que arrastrar.

El pedido trae dos entradas, y la pregunta de diseño es si son dos gestos: *"yo
puedo tocar en la pelotita y arrastrarla, o puedo tocar en la barra"*. Escritas
como dos caminos, obligan a decidir en el press cuál de los dos empezó, y esa
decisión se toma comparando la posición del puntero contra la caja de un punto de
14 px. Es una cuenta que falla con el dedo, y falla de la peor manera: un toque
que erró la pelotita por tres píxeles no hace nada.

## Decisión

**Un solo camino:**

```
pointerdown en cualquier parte de la barra → la pelotita salta ahí y empieza el scrub
pointermove                                → la pelotita sigue al puntero
pointerup                                  → ahí es el seek
```

**Un toque suelto es un arrastre de longitud cero.** Tocar la barra, no mover y
soltar seekea a ese punto, que es lo que la barra ya hacía; agarrar la pelotita y
llevarla es el mismo camino con otra longitud.

Y de ahí, lo que **no** se escribe: no hay rama de "modo toque" contra "modo
arrastre", y no hay que averiguar si el puntero cayó sobre la pelotita o al lado.
Cayó en la barra, y con eso alcanza.

**El seek pasa del `pointerdown` al `pointerup`.** La cuenta de `seekFromEvent` no
cambia —la fracción sale de `rail.getBoundingClientRect()` igual que hoy—; lo que
cambia es cuándo se escribe `video.currentTime`.

## Consecuencias

- El arrastre existe, que es el pedido.
- **Es el único cambio sobre algo que ya funcionaba**, así que es el único lugar
  donde esta fase puede romper: un toque suelto tiene que seguir seekeando
  exactamente donde seekea hoy. Está escrito como el riesgo R1 de la fase y como
  criterio de la T-01.
- La asimetría entre el mouse y el dedo sale gratis, como en el ADR 0028: el mismo
  código da un click con mouse y un arrastre con el dedo, sin una rama por
  dispositivo.
- Y una propiedad que no hay que escribir: **el scrub sólo cuenta con el cromo
  arriba**, porque la capa del cromo no recibe punteros mientras está escondida.
  Es lo que el comentario del `pointerdown` del contenedor ya dice de la barra —
  navega en el press, y por eso el primer toque no la alcanza.
- Descartado seekear en cada `pointermove`: no es lo que se pidió —*"una vez que
  suelte, ahí es el seek"*— y haría que el player busque decenas de veces por
  gesto sobre HLS, que es exactamente lo que no se quiere mostrar en cámara.
