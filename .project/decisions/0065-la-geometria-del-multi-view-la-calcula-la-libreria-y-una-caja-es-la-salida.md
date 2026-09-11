---
id: "0065"
title: La geometría del multi view la calcula la librería, y una sola caja es la salida
status: accepted
scope: project
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0064 sacó el `viewport` del bloque, así que alguien tiene que calcularlo.
La única de las tres partes que conoce a la vez cuántas cajas hay en este momento
y qué tamaño tiene la pantalla es el player.

Nicolás fijó la escalera: *"si querés ver dos contenidos queda side by side; si
querés tres, dos arriba y uno abajo al medio; si querés cuatro, una grilla de dos
por dos. Y llegamos hasta ahí"*. Y fijó que **el contenido principal cuenta como
una de las vistas**.

## Decisión

Una función de `N` a una lista de `viewport`, en la capa de señalización, junto a
`resolveElement`, de modo que lo que sale sigue siendo `Element` del contrato con
su `box` ya resuelta.

| N | viewports, en orden (top right bottom left) |
| --- | --- |
| 1 | — |
| 2 | `25 50 25 0`, `25 0 25 50` |
| 3 | `0 50 50 0`, `0 0 50 50`, `50 25 0 25` |
| 4 | `0 50 50 0`, `0 0 50 50`, `50 50 0 0`, `50 0 0 50` |

El contenido principal es siempre la primera caja, y las vistas siguen el orden en
que quien mira las subió.

**`N = 1` devuelve la lista vacía**, o sea que no hay composición.

## Consecuencias

**Los cuatro valores de N=4 no se inventaron: son los del Quad que ya está en el
repositorio**, copiados de `asset-list-multiView.json`, que es el break 4 del
recorrido que se graba. La grilla de esta fase ya estaba dibujada.

**El N=2 lleva bandas negras a propósito, y la fuente es la herramienta de SVTA.**
Su `squeezebackDoubleBox` declara el primario en `"25 50 25 0"`: dos cajas de 50 %
por 50 % centradas verticalmente, y no dos mitades de alto completo. La razón está
en `movePrimary`: el contenido primario se achica con un `transform`, y un
transform escala lo que `object-fit` ya dibujó, así que el `cover` del ADR 0013 no
lo salva. Media pantalla de alto completo daría `sx = 0,5` y `sy = 1`, o sea el
doble de ancho aparente, y la advertencia de `movePrimary` se dispararía en cada
cuadro. Con las tres formas de esta tabla `sx == sy` siempre.

**La fila de `N = 1` es la que hace que la salida no necesite un mecanismo
propio**, y es la consecuencia más barata de todo el diseño. Con una sola caja
`activeAt(time)` devuelve vacío, la identidad de la composición cambia, y el
renderizado corre `clear()`, que es exactamente "el programa como venía". Bajar la
última cámara y tocar el botón de salir terminan en el mismo evento (ADR 0071).

**El orden de las cajas es el orden de la selección, y se testea.**
`aws-multiview` documentó el costo de no tenerlo con la mejor descripción posible
del bug: *"Region order is not reading order... the viewer taps swimming and hears
hockey."*

**El renderizado no aprende una palabra nueva**: recibe los mismos cuatro
porcentajes que recibe de un aviso, y `boxToPixels`, `movePrimary` y `sizeAsset`
no se tocan.
