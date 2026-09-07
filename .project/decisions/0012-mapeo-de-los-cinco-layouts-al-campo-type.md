---
id: "0012"
title: Mapear los cinco layouts del documento de requerimientos al campo type del payload
status: proposed
scope: phase-01
date: 2026-09-03
supersedes: null
superseded_by: null
---

## Contexto

Este ADR es una **propuesta y está pendiente de la respuesta de David**.
Se registra como propuesta y no como decisión tomada porque el mapeo
parece obvio en la mayoría de los casos, y "parece obvio" no es una
fuente.

El documento de requerimientos usa cinco nombres en prosa (Overlay, LBox
Video, LBox Image, Side by Side pullback y Quad editorial) y la
herramienta de SVTA emite seis identificadores distintos en el campo
`type` del payload (`cornerOverlay`, `lowerThirdOverlay`,
`squeezebackFrame`, `squeezebackDoubleBox`, `squeezebackLShape` y
`multiView`). Las dos listas nunca se conciliaron.

## Decisión propuesta

Se propone este mapeo, y se le pregunta a David solamente por lo que no
cierra.

| Nombre en el documento de requerimientos | Identificador propuesto | Estado |
| --- | --- | --- |
| Overlay | `cornerOverlay` | propuesto |
| LBox Video | `squeezebackLShape` | a confirmar |
| LBox Image | `squeezebackLShape` | a confirmar |
| Side by Side pullback | `squeezebackDoubleBox` | propuesto |
| Quad (editorial) | `multiView` | propuesto |

Sobre los dos LBox: la forma de L es la que corresponde a un LBox, así
que el identificador del mecanismo es `squeezebackLShape`. Lo que
distingue "LBox Video" de "LBox Image" es el tipo de asset que se
inserta, no el layout, y este diseño no fija cuál de los identificadores
de squeezeback va con cada uno. Esa es la primera parte de la pregunta
para David.

La segunda parte, y la principal, es `squeezebackFrame`: es el
identificador que la herramienta emite y que no tiene correlato en
ninguno de los cinco nombres del documento. Su `primaryContent` vale
`"20 20 20 20"`, es decir que el contenido se achica por los cuatro
lados y el aviso ocupa el fondo, y no hay en la lista de cinco ningún
layout que se describa así.

Una aclaración que no es pregunta: el nombre "Overlay" del documento no
distingue entre `cornerOverlay` y `lowerThirdOverlay`, que son los dos
identificadores del mecanismo de overlay. El POC arranca por
`cornerOverlay` porque es el mínimo que fija el ADR 0008.

## Consecuencias

Hasta que David conteste, el POC usa los identificadores de la
herramienta de SVTA tal cual, que es lo que fija el ADR 0004. Por eso la
pregunta no bloquea nada: el código lee el `type` que viene en el JSON y
no necesita saber cómo lo llama el documento de requerimientos.

Lo que sí depende de la respuesta es el material que se escriba para
SVTA y lo que David diga en escenario, donde las dos listas tienen que
ser la misma lista.
