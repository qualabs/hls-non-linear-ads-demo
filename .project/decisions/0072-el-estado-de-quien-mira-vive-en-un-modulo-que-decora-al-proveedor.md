---
id: "0072"
title: El estado de quien mira vive en un módulo que decora al proveedor, y el contrato del ADR 0003 no se toca
status: accepted
scope: project
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El multi view introduce algo que el proyecto no tenía: **estado de quien mira que
cambia la composición**. Hasta ahora lo que se dibujaba era función del tiempo y
de la señalización, y el único estado del lado del que mira era el foco del audio,
que vive en el renderizado y no cambia ninguna caja.

Ese estado tiene que vivir en algún lado, y las dos ubicaciones obvias son malas.
En la capa de señalización contamina el archivo que se define por conocer la
palabra HLS con algo que no es transporte. En el renderizado obliga a esa capa a
aprender qué es una oferta, que es justo lo que el ADR 0003 compra al no hacerlo.

## Decisión

Un módulo nuevo, `lib/multiview.js`, que **decora al proveedor**: recibe el
proveedor de la capa de señalización y devuelve otro con la misma firma. Su
`activeAt(time)` mira si lo que está activo es una oferta y contesta según lo que
quien mira tenga tildado: con nada tildado, un array vacío; con una o más, la
experiencia con las cajas ya calculadas. Todo lo que no es una oferta pasa de
largo sin tocarse.

El estado que guarda es todo lo que esta fase agrega de estado mutable, y se
enumera: **cuáles vistas están tildadas, en qué orden se tildaron, y cuál está
agrandada.** El foco del audio no está en esa lista: sigue siendo del renderizado
y sigue siendo un índice único (ADR 0026).

Las operaciones devuelven estado nuevo en lugar de mutar, y cada una valida su
resultado, de modo que un estado imposible no sea alcanzable por la API.

## Consecuencias

**El contrato del ADR 0003 no cambia en una línea.** Sigue saliendo `Experience[]`
con `Element` que tienen `box`, `zDepth`, `volume`, `uri` y `mediaType`. El
renderizado no aprende qué es una oferta ni que hay alguien eligiendo, y por lo
tanto el día que la capa de abajo se reemplace esto sigue valiendo.

**El aviso y la oferta se pueden solapar y no hubo que decidir nada nuevo.** Si un
break concurrente entra mientras hay un multi view en pantalla, `activeAt(time)`
devuelve las dos experiencias y el renderizado las dibuja a las dos, ordenadas por
`zDepth`. La regla 6 del contrato ya cubre el caso, y `effectiveVolumeOf` dice
explícitamente que dos experiencias solapadas son la misma regla sobre una lista
más larga.

**Se puede testear sin navegador**, que es la propiedad por la que las operaciones
devuelven estado nuevo y validan. Es la forma que `demo-ibc/js/composition.js` de
`aws-multiview` ya usa, y su test hand-escribe un estado roto a propósito para
comprobar el rechazo, que es lo que hace que la validación pueda fallar.

**Lo que se paga es un archivo más en `lib/`**, y el cableado en `attach()`. Es
poco al lado de la alternativa, que era que dos capas ya existentes aprendieran un
concepto que no es de ninguna de las dos.
