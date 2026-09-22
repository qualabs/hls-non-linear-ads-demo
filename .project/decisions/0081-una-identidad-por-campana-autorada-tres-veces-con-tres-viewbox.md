---
id: "0081"
title: Una identidad por campaña, autorada tres veces con tres viewBox
status: accepted
scope: project
date: 2026-09-21
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Un break no lineal necesita el mismo aviso en varias cajas a la vez, y esas cajas no tienen
la misma forma: el creativo a cuadro entero del lineal es 16:9, el banner del
`lowerThirdOverlay` es 8,89:1, y el backplate de la L es un cuadro entero del que una
esquina queda tapada por el contenido primario.

Con material filmado eso obliga a producir piezas distintas o a recortar una sola, que es lo
que el pedido `T-12` de la fase 01 venía reclamando. Con SVG (ADR 0080) el recorte
desaparece, pero queda en pie la pregunta de si las tres formas son **tres piezas** o **una
pieza autorada tres veces**.

Y queda una segunda pregunta, que la primera esconde: **cuántos anunciantes**. Un recorrido
donde los tres breaks muestran el mismo aviso no se lee como publicidad sino como un defecto.

## Decisión

**Una identidad por campaña, y cada identidad se autora tres veces con tres `viewBox`.**

La identidad es lo que se decide una vez: la marca de fantasía, qué vende, el claim, la
paleta, la construcción del objeto y qué hace el movimiento. Las tres formas son esa misma
identidad compuesta para tres cajas:

| forma | `viewBox` | dónde se usa |
| --- | --- | --- |
| **16:9** | 16:9 | el aviso lineal y el `squeezebackDoubleBox` |
| **banner** | 8,89:1 | el `lowerThirdOverlay` |
| **L backplate** | 16:9 con la guarda vacía | el `squeezebackLShape` (ADR 0047) |

**Y son tres campañas, una por marca**, porque una campaña es de una marca: tres identidades
de fantasía de rubros distintos, cada una con sus tres formas. Nueve piezas.

**La guarda del backplate** es la región que el contenido primario tapa cuando se encoge. No
es un margen de seguridad: es una parte del dibujo que tiene que quedar vacía para que lo que
se vea sea una L y no un fondo con un agujero.

## Consecuencias

**Las tres formas de una campaña se leen como la misma campaña**, que es lo que las hace
parecer publicidad de verdad y no tres gráficos sueltos. Es el beneficio que decidió entre
las dos opciones, por encima del ahorro de autoría.

**El ADR 0013 queda sin nada que hacer sobre estas piezas.** Su política de llenado existe
para una caja cuya relación de aspecto no es la del asset; acá el asset se autora con la
relación de la caja, así que `object-fit: cover` no recorta nada. El ADR no cambia: cambia
que estas piezas no son su caso.

**El ADR 0012 gana su demostración más barata.** Dice que "LBox video" y "LBox image" son el
mismo layout con distinto `mediaType`; con esta forma son literalmente el mismo dibujo, el
backplate, servido como `image/svg+xml` en un escalón y capturado a video en el otro.

**El costo de una campaña nueva es el de una identidad, no el de tres piezas**, y el de una
variante es menor todavía. Lo que hay que cuidar a cambio es que las tres formas se autoren
contra el mismo brief: si la identidad se decide mientras se dibuja la primera forma, las
otras dos la persiguen.

**La primera campaña es la referencia de estructura de las otras dos.** No porque se copie
el dibujo, sino porque fija qué secciones tiene el archivo, qué explica su cabecera y cómo se
reparte el movimiento.
