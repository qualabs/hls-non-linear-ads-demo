---
id: "0068"
title: El anuncio de multi view son dos piezas, un popup que se va y un punto que se queda
status: accepted
scope: phase-11
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Nicolás pidió el anuncio así: *"si el usuario está viendo el contenido, aparezca
algún tipo de popup sobre el video muy sutil que diga multiview available una vez
que entremos en la ventana de multiview, para que el usuario sepa que ahora puede
elegir qué videos agregar"*.

Un popup solo deja un agujero, y no es hipotético. En `aws-multiview` el riesgo
que efectivamente se materializó fue de descubrimiento: *"El gesto de mantener
apretado no se descubre solo"*, y su informe registra el costo —la afordancia
existía y no respondía al click, después quedaba tapada por la barra superior, y
terminó rediseñada dos veces: **cuatro tasks sobre el mismo elemento**.

## Decisión

Dos piezas, y hacen falta las dos.

**El popup** aparece sobre la imagen cuando se abre la ventana, dice que hay multi
view disponible, y se va solo a los pocos segundos. Es un aviso y no un control:
no se toca y no abre nada. Desaparecer es parte de lo que lo hace sutil.

**El control del selector lleva un punto** mientras la ventana está abierta y
nadie subió todavía ninguna cámara.

## Consecuencias

**El punto es la mitad que cubre a quien miraba para otro lado** durante los
segundos del popup. Un anuncio que sólo existe tres segundos es la misma clase de
apuesta que costó cuatro tasks del otro lado.

El punto se ve cuando el cromo está arriba, y el cromo sube con cualquier
movimiento o toque, así que la señal está siempre a un gesto de distancia sin
ocupar pantalla de forma permanente.

Se verifica mirando, porque es lo único que se puede: dos capturas al tamaño real
de uso, una por estado.

El alcance es de fase por la misma razón que el ADR 0067: decide cómo se comporta
un elemento de la interfaz.
