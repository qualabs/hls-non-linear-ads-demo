---
id: "0074"
title: La galería muestra los avisos que este minuto reproduce, y el resto del catálogo se nombra en prosa
status: accepted
scope: phase-12
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Decidido que las formas se dibujan del contrato (ADR 0073), queda cuántas se
dibujan. Hay tres listas distintas en juego y no son la misma:

- **Los cuatro avisos que este minuto reproduce**: `lowerThirdOverlay` con una imagen,
  `squeezebackLShape`, el lineal sin bloque, y `cornerOverlay`.
- **Los seis identificadores que emite la herramienta de SVTA**, que existen como
  asset-list en `demo/compatibility-pair/signalling/`.
- **Los cinco nombres en prosa del documento de requerimientos de David** —Overlay,
  L-box con video, L-box con imagen, Side by side pullback, Quad—.

## Decisión

**Se dibujan los cuatro avisos que este minuto reproduce, y nada más.** El resto del
catálogo se nombra en una línea de prosa al pie de la sección, sin enumerar y sin
dibujar.

## Consecuencias

- **Tres no lineales y uno lineal es exactamente la distinción que la sección existe
  para explicar**, con la ventaja de que el lector los acaba de ver en movimiento.
- **Son verdad por construcción**, porque salen del contrato de esta corrida.
- **No se dibuja lo que este player no reprodujo.** La opción de dibujar los seis
  obligaría a rotular cada ficha como "esto no es de esta playlist", y además cruzaría
  la línea del ADR 0021 —un signalling por demo— o copiaría archivos de otra demo, que
  es peor.
- **Y no se ponen los cinco nombres del documento de requerimientos, por una razón que
  no es de diseño.** El mapeo de esos cinco nombres a los identificadores de la
  herramienta es el ADR 0012, que sigue en estado `proposed` esperando la respuesta de
  David desde el 2026-09-03. Ponerlo en una página que él presenta sería escribir en
  pantalla una conciliación que él todavía no confirmó.
- El día que la clase `multiView` de la fase 11 aparezca en el asset-list de esta
  demo, aparece dibujada sola. No hay nada que actualizar.
