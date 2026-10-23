---
id: "0097"
title: "La web dibuja lo mismo porque cada gemela pide lo mismo que la opción que tiene adelante"
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La librería web no se toca (Nicolás, 2026-10-22), así que la web tiene que ignorar las opciones nuevas con su regla de hoy.

## Decisión

`needsOf` cuenta un decodificador por elemento que no es `image/*`: la gemela MP4 pide lo mismo que la HLS que la precede y la PNG lo mismo que la SVG. `selectOption` elige la primera que la capacidad satisface, así que una gemela sólo sería elegible si su original lo fuera, y el original gana siempre. Se verifica como propiedad: misma opción por contenido contra los asset-lists anteriores, en las cinco capacidades, y ningún pedido de red a un `.png`/`.mp4` de creativo. Las páginas que muestran el asset-list (el inspector y la traza de stage-pair, la tabla de campos de hydration-break) muestran las opciones nuevas tal cual, y el índice de la opción elegida corre.

## Consecuencias

El orden HLS, MP4, SVG, PNG es condición de esta decisión: una gemela que pasara adelante de su original cambiaría lo que la web elige.
