---
id: 0001
title: Renderizar la experiencia concurrente en el DOM sobre el video
status: accepted
scope: phase-01
date: 2026-09-03
supersedes: null
superseded_by: null
---

## Contexto

La publicidad no lineal que este POC tiene que mostrar convive con el
contenido en lugar de reemplazarlo: un overlay en una esquina, una banda
inferior, un squeezeback donde el contenido primario se achica, o una
grilla de fuentes simultáneas.

El layout viene descrito en el bloque `X-AD-CREATIVE-SIGNALING` del
asset-list, y su unidad de medida es el porcentaje. El campo `viewport`
es un string de cuatro porcentajes en el orden top, right, bottom, left,
y son insets, es decir cuánto se recorta cada borde respecto del área
del player. El contenido primario es un elemento más del layout, con su
propio `viewport` y su propio `zDepth`: el `primaryContent` de un
squeezeback vale `"20 20 20 20"`, o sea que el contenido se achica un 20
por ciento por cada lado y el aviso ocupa el fondo.

Un modelo de porcentajes de inset sobre un área rectangular es
exactamente lo que CSS sabe resolver con un elemento posicionado.

## Decisión

La experiencia concurrente se renderiza en el DOM, encima del video, y
no se compone en video.

El contenido primario se achica con una transformación de CSS sobre el
elemento `<video>`, y los assets del aviso se dibujan como elementos
posicionados encima, ordenados por `zDepth`.

## Consecuencias

No hace falta ningún trabajo a nivel de bitstream ni de compositing, y
la demo es honesta en el sentido en que David lo pidió, porque lo que se
ve en pantalla es el player resolviendo el layout de verdad.

El mecanismo de squeezeback queda casi tan barato como el de overlay,
porque la única diferencia es que además hay que mover el elemento de
video primario, y moverlo es una transformación más.

Quedan descartadas dos alternativas:

- **Componer el layout en el video, del lado del servidor o del
  cliente.** David lo descartó explícitamente ("I don't want it smoke in
  mirrors"), y además es innecesario, porque el modelo de datos es de
  porcentajes sobre el área del player, que es DOM.
- **Usar Media Source Extensions para meter las dos fuentes en un solo
  elemento de video.** Es muchísimo más caro y no muestra nada que dos
  elementos no muestren. El costo solo se justificaría si la limitación
  de decodificadores lo obligara, y esa es una pregunta de dispositivos
  que está fuera del alcance de esta fase.
