---
id: "0069"
title: Agrandar una caja es foco completo, y desagrandar no toca el audio
status: accepted
scope: project
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La fase 06 dejó el foco de audio con una sola puerta, `setFocus`, que mueve el
índice, el anillo y la mezcla en un solo lugar, y con cinco salidas enumeradas
(ADR 0029, 0031). El gesto que lo mueve es un `pointerdown` sobre una caja de
video, y sólo cuenta con el cromo arriba (ADR 0028).

El multi view agrega un segundo gesto sobre la misma caja: un botón que la agranda
a cuadro entero. Nicolás fijó qué hace con el audio: *"si un video pasa a full
pantalla entonces es el único que tiene que sonar: el botón de full pantalla es
full foco (video y audio)"*.

Lo que el pedido no contesta es qué pasa al desagrandar.

## Decisión

**Agrandar es una sola llamada a `setFocus` sobre esa caja**, más el cambio de su
`box` a cuadro entero con el `zDepth` más alto de la composición. Las otras cajas
se quedan donde están, reproduciendo, tapadas.

**Tocar la caja y agrandarla siguen siendo dos gestos distintos**: el toque es
sólo el audio (ADR 0028) y el botón es las dos cosas. El botón detiene la
propagación, así que no se pisan.

**Desagrandar devuelve la geometría y no toca el foco.** La caja que estaba grande
vuelve a su lugar en la grilla y **sigue sonando**, con su anillo puesto.

## Consecuencias

**No se agrega una sexta salida al foco.** Soltarlo al desagrandar habría sido
exactamente eso, sobre las cinco que la fase 06 enumeró y cerró. No llamar a
`setFocus` es no agregar nada.

**El audio sigue al contenido y no a la caja**, que es la R17 de `aws-multiview`
dicha con sus palabras: *"el audio se conserva por deporte, no por posición"*.
Volver a la grilla es un cambio de posición, y quien mira no pidió dejar de
escuchar lo que estaba escuchando.

**Y soltarlo sigue siendo trivial**, por dos caminos que ya existen y ya están en
pantalla: tocar esa misma caja de nuevo (ADR 0028) o tocar el primario
(ADR 0031).

**Se descartó recordar el foco anterior a la ampliación.** Habría sido el primer
estado de audio viviendo fuera de `setFocus`, y el invariante de la fase 06 es que
el foco es **un índice único sin historia**: guardar un segundo es romper la
propiedad que esa fase compró.

**Las otras cajas se tapan y no se van**, porque Nicolás pidió *"volver al tamaño
que tenía naturalmente"* —o sea que siguen existiendo—, y porque taparlas cuesta
un `zDepth` mientras que sacarlas costaría una segunda tabla de geometría. Que
sigan reproduciendo es lo que hace que desagrandar sea instantáneo.

El alcance es de proyecto porque toca el modelo de audio que la fase 06 fijó con
alcance de proyecto, y porque la pregunta "quién decide qué se escucha en una
composición de varias fuentes" es material para SVTA.
