---
id: "0030"
title: La marca del foco la dibuja el renderer sobre el nodo que creó
status: accepted
scope: project
date: 2026-09-08
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El foco cambia el sonido, y un cambio de sonido sin nada en pantalla que lo
explique es el defecto que la fase 04 midió. Así que hace falta una marca sobre
la caja que suena.

Quién la dibuja está decidido por un invariante que ya está escrito:
`controls.js` tiene prohibido tocar la capa de los avisos, y lo dice en su
cabecera (`lib/controls.js:41-47`), porque esa capa queda sin `z-index` a
propósito para que el `zDepth` del layout siga decidiendo quién está arriba.

## Decisión

Un anillo sobre la caja que suena, y **lo dibuja el renderer**, que ya es dueño de
esos nodos y ya les escribe estilo.

Es un `outline` de 4 px en amarillo saturado (`#FFD400`) con `outline-offset`
negativo, escrito inline sobre el nodo. Las tres propiedades están elegidas y cada
una por una razón:

- `outline` se pinta **arriba** del contenido, que es lo que un `border` o un
  `box-shadow` interno no hacen sobre un elemento reemplazado como un `<video>`.
- No participa del layout, así que no mueve la caja que el layout declaró.
- El offset negativo lo dibuja por dentro del borde, así que no lo recorta la
  caja de al lado.

Si el color hay que cambiarlo, el criterio es que se lea sobre cualquier creativo
y que no sea un color de marca, porque nada en la capa de avisos está marcado.

**Se escribe donde se escribe el audio**, o sea cuando el foco cambia: una sola
función mueve el índice, recalcula la mezcla y mueve el anillo, así que no hay dos
fuentes de verdad sobre quién suena.

## Consecuencias

**Sobrevive al auto-hide por construcción y no por una excepción.** El auto-hide
baja la opacidad de la capa del cromo, y esta marca vive en la otra capa.

Y con eso alcanza para que el foco que se mueve solo se vea: cuando el asset se
termina o la composición se rearma (ADR 0029), el anillo desaparece con el nodo.

Descartado un **toast** cuando el foco se mueve solo: la marca moviéndose es el
aviso, y un toast es una pieza de interfaz nueva en la capa que no le
corresponde.

Descartado el **parlante al lado del anillo**. Los pseudo-elementos no se
renderizan sobre un `<video>`, así que el glifo pide un nodo hermano adentro de la
capa de avisos y una caja más que seguir en `place()`. Es maquinaria real para un
POC, y el anillo aparece en el mismo gesto que cambia el sonido, así que el gesto
es el que le enseña qué significa.

**Lo que la marca no resuelve, y se acepta:** que el botón de audio siga diciendo
sólo mute y unmute. Con foco "desmuteado" deja de decir qué vas a escuchar, y eso
lo contesta la marca sobre la caja, que es donde el multiview la puso.
