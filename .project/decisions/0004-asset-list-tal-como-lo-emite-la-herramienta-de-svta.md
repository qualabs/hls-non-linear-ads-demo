---
id: "0004"
title: Consumir el asset-list tal como lo emite el Layout Controller de SVTA
status: accepted
scope: phase-01
date: 2026-09-03
supersedes: null
superseded_by: null
---

## Contexto

La herramienta de SVTA que el `PROJECT.md` nombra como referencia, en
`https://www.svta.org/wp-content/nlag/v4/`, es la que genera el JSON del
asset-list con el bloque `X-AD-CREATIVE-SIGNALING`, y es la que muestra
cómo se debería ver el layout.

La especificación acompaña: el Asset-Description obliga a `URI` y
`DURATION` y no prohíbe claves adicionales
(`draft-pantos-hls-rfc8216bis-wwdc2026`, Apéndice D.2). La extensión de
este trabajo consiste exactamente en eso, en agregarle por asset un
bloque con los datos de layout que un cliente que no lo conoce ignora.

Conviene aclarar qué es esa herramienta, porque el nombre "Layout
Controller" sugiere otra cosa: es un generador de datos con una vista
previa estática, donde `previewPlayer` es un `div` con cajas
redimensionables y no reproduce video. No es una librería que se pueda
embeber.

## Decisión

El POC consume el asset-list tal como lo emite la herramienta de SVTA,
sin definir un formato propio y sin transformar su salida.

## Consecuencias

La herramienta pasa a ser el banco de pruebas y la referencia visual del
renderizado. Se arma un layout ahí, se copia el JSON, y el player tiene
que mostrar lo mismo que muestra su vista previa.

Todo lo que no podamos renderizar es un hueco para reportar a SVTA, no un
formato para cambiar por nuestra cuenta. Esa es justamente la posición
que le sirve al proyecto, porque el marco del trabajo es llevar la guía
de SVTA a su próxima versión y no construir un dialecto paralelo.

Aportar el render de verdad, con video reproduciéndose donde la
herramienta muestra un rectángulo, es precisamente lo que esta demo
agrega sobre la herramienta.
