---
id: "0034"
title: El arrastre es de la barra hasta que se suelta, con captura y sin gesto del browser
status: accepted
scope: phase-07
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Un arrastre empieza en la barra y no se queda ahí. La caja que recibe el press
tiene 44 px de alto —el número que la fase 02 eligió como blanco de un dedo— y
cualquier arrastre real se sale de eso hacia arriba o hacia el costado. Y en un
teléfono hay un segundo dueño posible del gesto: el browser, que interpreta un
movimiento vertical sobre un elemento como scroll de la página y se lo lleva a
mitad de camino.

Los dos son la misma pregunta: **de quién es el gesto entre el press y el
release.**

## Decisión

Del elemento que recibió el press, hasta que se suelta.

- **`setPointerCapture` sobre la barra** en el `pointerdown`, y suelto en el
  `pointerup`. Con eso los `pointermove` y el `pointerup` llegan a la barra aunque
  el puntero esté afuera.
- **`touch-action: none` en `.qa-track`**, que hoy está en `auto` (medido). No es
  lo que habilita el gesto: es lo que impide que el browser lo lea como scroll.

## Consecuencias

- Soltar el botón a mitad de la imagen igual seekea, que es como se comporta
  cualquier barra y es lo que un arrastre con mouse hace sin querer todo el
  tiempo.
- En mobile el arrastre existe. El toque suelto andaba igual con o sin
  `touch-action`, así que lo que esta mitad compra es exactamente la mitad del
  pedido que no se ve probando con un mouse.
- `touch-action: none` sobre la barra apaga el scroll de la página **sólo ahí**, y
  la barra ya era furniture que no scrollea nada.
- Descartado escuchar el move y el up en `window`: da el mismo resultado y obliga
  a desuscribir a mano en cada salida, incluida la que nadie prueba.
