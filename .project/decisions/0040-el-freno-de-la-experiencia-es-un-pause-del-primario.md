---
id: "0040"
title: El freno de la experiencia es un `pause` del primario, y la página no toca la librería
status: accepted
scope: phase-08
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El guion frena la experiencia para explicarla, y la frena en medio de un aviso, cuando
puede haber tres cajas de video corriendo encima del programa.

`lib/renderer.js` aplica el estado de reproducción en cada `play` y en cada `pause` del
primario, y lo aplica leyendo `video.paused` en lugar de recordar qué evento lo trajo
hasta ahí: `applyPlayback` recorre los nodos que tienen línea de tiempo y los pausa o los
reanuda según el primario. La razón por la que está escrito así es de la fase 04 y es
otra —un nodo creado mientras la composición está en pausa tenía que quedar en pausa— y
lo que deja disponible es exactamente esto.

## Decisión

**Cuando un beat llega, la página llama `video.pause()` sobre el elemento del contenido
primario. Nada más.** La composición entera se congela, las cajas del aviso incluidas.

**La superficie pública de la librería no cambia**: ni `attach` ni `attachControls`
reciben nada nuevo, y el contrato entre señalización y renderizado no se mueve. La demo
nueva usa la sdk exactamente como la usa la demo actual.

Los beats se disparan desde un loop de `requestAnimationFrame` propio de la página y no
desde `timeupdate`, que llega unas cuatro veces por segundo: 250 ms tarde en un beat
anclado a un cambio de aviso significa que el aviso nuevo ya se vio, y eso es
exactamente el tamaño de la cosa que el beat quiere anticipar.

## Consecuencias

- Una demo no le agrega capacidades al player. Si esta página necesitara algo que la sdk
  no da, eso es un hallazgo para reportar y no un cambio para hacer adentro de la fase.
- La propiedad estaba **leída en el código y no medida en el navegador** cuando se tomó
  la decisión, y es la que decide el tamaño de la fase, así que se mide antes de construir
  sobre ella: es la primera task y el riesgo R6.
- Si la medición saliera al revés, lo que cambia no es este ADR sino la fase: frenar
  pasaría a ser trabajo de la librería.
