---
id: 0008
title: Fijar el mínimo en un layout de overlay y ordenar el trabajo del riesgo conocido al desconocido
status: accepted
scope: phase-01
date: 2026-09-03
supersedes: null
superseded_by: null
---

## Contexto

El documento de requerimientos enumera cinco layouts y la herramienta de
SVTA emite seis identificadores de tipo, pero todos se apoyan en
solamente tres mecanismos de render distintos:

| Mecanismo | Qué hace | Tipos que lo usan |
| --- | --- | --- |
| A. Overlay | El contenido primario no se mueve, el asset se dibuja encima. | `cornerOverlay`, `lowerThirdOverlay` |
| B. Squeezeback | El contenido primario se achica y el asset ocupa el espacio liberado. | `squeezebackFrame`, `squeezebackDoubleBox`, `squeezebackLShape` |
| C. Multiview | Varias fuentes conviven sin que ninguna sea privilegiada. | `multiView` |

Eso cambia qué es lo mínimo: cubrir tres mecanismos prueba el modelo
entero, y cubrir cinco layouts del mismo mecanismo no prueba nada más que
uno. Y ordena el riesgo. El mecanismo A es CSS sobre un elemento que ya
existe. El B además requiere mover el video primario. El C es el único
que pone dos o más decodificadores a trabajar al mismo tiempo, que es
justamente el tema que David va a marcar en escenario.

## Decisión

El mínimo de la fase es un `cornerOverlay` sobre un VOD, con el DATERANGE
de clase propia en la playlist y el asset-list servido al lado, y con la
pestaña de red del browser mostrando la playlist, el tag y el JSON. Si
eso anda, la cadena entera anda y lo que falta es más de lo mismo.

El orden de trabajo después del mínimo es el par de compatibilidad del
ADR 0007, que no agrega riesgo técnico y sí agrega el argumento más
fuerte de la demo; después un layout del mecanismo B; y al final el
mecanismo C, que es el único que depende de una capacidad no medida.

## Consecuencias

El reparto de los cinco layouts entre el primer draft y la grabación se
contesta con mecanismos y no con nombres. Si el 21 de septiembre hay uno
de cada mecanismo andando, agregar los layouts que falten es trabajo de
datos y no de ingeniería. La propuesta concreta de ese reparto está en el
ADR 0011.

Queda descartada la alternativa de **empezar por el layout Quad**, que es
el más vistoso. Es el mecanismo C, el único que depende de una capacidad
no medida, así que empezar por ahí pone el riesgo desconocido antes que
la cadena completa.
