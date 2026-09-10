---
id: "0062"
title: El movimiento generado va donde la tipografía vive en su propia capa
status: accepted
scope: phase-10
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: ["0045"]
generalized_by: null
---

## Contexto

El ADR 0045 reparte cómo se produce cada pieza de un creativo: lo pictórico se
genera, la geometría y la tipografía se escriben como SVG y se rasterizan, y **el
movimiento se genera sólo donde la tipografía puede irse de cuadro**, que en ese
momento era un solo lugar, el spot lineal. Los formatos no lineales quedaban como
imagen fija con tipografía compuesta, porque ahí el texto tiene que quedarse quieto y
legible durante todo el break.

**La L rompió esa enumeración: su fondo ahora se mueve.** Lo que lo hizo posible no
fue relajar la regla sino **partir la L en dos capas**: el fondo, que es el cuadro
semilla de la generación, y la tipografía encima. El modelo redibuja cada cuadro, así
que una tipografía adentro de la semilla vuelve **deformada**; afuera, las letras
quedan exactas.

## Decisión

**El movimiento generado puede ir en cualquier pieza cuya tipografía viva en una capa
propia, por encima del cuadro generado.** La regla del ADR 0045 no cambia: sigue
siendo que el movimiento va donde la tipografía puede irse de cuadro. Lo que cambia
es que **partir las capas es la manera de sacarla**, así que la lista de lugares donde
el movimiento cabe deja de ser una enumeración de formatos y pasa a ser una propiedad
de cómo está armada la pieza.

**Y nada que tenga que salir exacto va adentro de la capa generada.** Son dos casos
medidos y no uno:

- **La tipografía**, que vuelve deformada.
- **El QR**, que pasado por el generador **deja de escanear**. Va en la capa de
  tipografía y nunca en la del fondo, y ésa es la razón entera de que las capas estén
  partidas.

El QR lleva al repositorio de este proyecto, y su matriz vive en `qr-github.txt` con
la URL al lado y la línea exacta para regenerarla, así que el dato y su destino no se
pueden despegar (ADR 0044 aplicado a otro dato). **Un QR que no lleva a ningún lado es
una mentira en una demo que se muestra a ingenieros, y alguien lo escanea.**

## Consecuencias

- **Generaliza el ADR 0045 y no lo supersede.** Nada de lo que el 0045 dice dejó de
  ser cierto: sus tres caminos siguen en pie y su chequeo humano de vestido comercial
  también. Lo que se ensanchó es dónde cabe el movimiento generado, y el 0045 queda
  como el caso particular en que la tipografía todavía no estaba en su propia capa.
- **El costo de partir las capas se paga una vez y habilita todo lo demás.** Es lo
  que dejó entrar el fondo animado de la L, y es lo que hace que el QR escanee.
- **Los eslabones generados no pueden ser un requisito del script que arma los
  creativos.** Cuestan plata de quien los corre, así que el fondo se mueve si la
  cadena está y se queda quieto si no: sin ella la L sale como salía antes.
- **La falla que esto previene es invisible.** Una tipografía deformada se ve; un QR
  que no escanea se descubre cuando alguien lo apunta con el teléfono en una sala.
  Por eso queda escrito acá y no sólo en un comentario del template.
