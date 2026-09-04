---
id: 0013
title: Llenar la caja del layout con recorte centrado y sin deformar el asset
status: accepted
scope: phase-01
date: 2026-09-03
supersedes: null
superseded_by: null
---

## Contexto

El modelo de la herramienta de SVTA describe cada elemento del layout
como una caja de porcentajes de inset, y no dice nada sobre el asset que
va adentro de esa caja.

La T-03 lo midió. La geometría cierra exacta, con cero píxeles de
diferencia entre la caja del modelo y la que dibuja el navegador en los
quince elementos de los seis tipos. En tres de esos quince, la caja no
tiene la relación de aspecto del asset: la banda de `lowerThirdOverlay`
es de 5,93 a 1, la barra vertical de `squeezebackLShape` es de 0,71 a 1
y la horizontal de 4,44 a 1, todas contra un asset de 16 a 9. Estirando
el asset hasta llenar la caja, la deformación es de 233, 60 y 150 por
ciento.

La vista previa de la propia herramienta no contesta la pregunta, porque
lo que dibuja adentro de cada caja es un rectángulo de color con una
etiqueta y no un asset.

Las formas de llenar una caja que no tiene la relación de aspecto del
asset son tres, y son las tres que CSS ofrece: estirar el asset
(`fill`), encajarlo entero dejando franjas vacías (`contain`), o llenar
la caja y recortar lo que sobra (`cover`).

## Decisión

El renderizador llena cada caja con recorte centrado y sin deformar, es
decir `object-fit: cover`, con el mismo valor para el contenido primario
y para los assets del aviso.

Esta decisión fija el comportamiento de la demo y no toma posición sobre
el formato. El hueco del modelo es real y va a SVTA como pregunta, tal
como manda el ADR 0004: el modelo tiene que decir, por asset, o el modo
de llenado o la relación de aspecto para la que el creativo está
pensado, porque mientras no lo diga dos clientes que cumplen la
especificación dibujan el mismo layout distinto.

## Consecuencias

De las tres formas, el recorte es la única que respeta a la vez la caja
que el layout declara y la forma del creativo. Estirar deforma hasta un
233 por ciento en un caso ya medido, y una cara estirada es lo primero
que se ve en una grabación. Encajar el asset entero deja la caja del
aviso parcialmente vacía, que en cámara se lee como que el player no
terminó de dibujar.

Lo que se paga es que un pedazo del creativo no entra en la caja. Para
esta demo eso es un problema de elegir el creativo y no de código: si en
algún layout el recorte se come algo que importa, se cambia el asset,
que es un cambio de datos.

El modo de llenado vive en una sola constante del renderizador, para
poder pasarlo a `contain` mientras se eligen los assets sin tener que
buscarlo en el código.

La medición deja además una nota que conviene tener presente: en los
seis tipos que emite la herramienta, la caja del `primaryContent`
conserva la relación de aspecto del área del player, así que el recorte
nunca le toca al contenido primario.
