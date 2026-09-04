---
id: 0011
title: Repartir los layouts entre el primer draft y la grabación por mecanismo
status: proposed
scope: phase-01
date: 2026-09-03
supersedes: null
superseded_by: null
---

## Contexto

Este ADR es una **propuesta a David y está pendiente de su
confirmación**. Se registra como propuesta y no como decisión tomada
porque qué se muestra en la demo lo decide él.

El reparto de los cinco layouts entre el primer draft y la grabación
sigue sin definirse ni en la minuta de la reunión del 2026-09-02 ni en el
documento de requerimientos. El primer draft corre contra el 21 de
septiembre y la ventana de grabación es del 28 al 30.

El ADR 0008 fija que la pregunta se contesta por mecanismos y no por
nombres, porque los cinco layouts se apoyan en tres mecanismos de render
y cubrir los tres prueba el modelo entero.

## Decisión propuesta

En el primer draft va un layout de cada mecanismo: uno de overlay, uno de
squeezeback y uno de multiview.

En la grabación van los cinco layouts.

El Quad va en el borrador, y no recién en la grabación.

El motivo de meter el Quad temprano es que la capacidad de la que
depende ya está medida y su costo pasó a ser el mismo que el de
cualquier otro layout. El Quad es el que pone dos o más elementos de
video a reproducir a la vez, y la T-01 midió que hasta cinco elementos
de 1280x720 a 30 fps, cada uno con su propia instancia de hls.js,
reproducen simultáneamente al 99,6 por ciento del reloj de pared, con
menos del 2 por ciento de cuadros descartados y sin errores. Con eso
resuelto, el Quad es el layout que más muestra de qué se trata la
publicidad no lineal, y conviene tenerlo en el borrador para que David
lo vea el 21 de septiembre con una semana por delante para cambiarlo si
quiere otra cosa.

## Consecuencias

Si David confirma, el orden de trabajo del ADR 0008 y este reparto
coinciden, y el 21 de septiembre la conversación con él es sobre qué
layouts agregar y no sobre si la plataforma aguanta.

Si David define otro reparto, el orden de trabajo del ADR 0008 se
mantiene igual, porque está ordenado por riesgo y no por lo que se
muestra. Lo único que cambia es qué layouts se agregan primero después
del mínimo.

Si la medición del mecanismo C muestra que dos elementos de video no
conviven, el Quad sale del borrador y esta propuesta se rehace contra la
escalera de repliegue de la fase, que es lo que fija qué se muestra
cuando algo no llega.
