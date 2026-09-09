---
id: "0028"
title: El gesto del foco es un pointerdown sobre la caja, y sólo cuenta con el cromo arriba
status: accepted
scope: project
date: 2026-09-08
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Un cambio de foco disparado desde un blanco invisible tiene el defecto que la
fase 04 midió, agravado: el sonido cambia y no hay nada en pantalla que explique
por qué. Con el cromo invisible, esa fase midió que un toque abajo buscó a 134 s,
uno en el medio pausó, y uno arriba a la derecha levantó el mute
(`lib/controls.js:214-228`).

Dos hechos del código deciden la forma del gesto. El primero: el `pointermove`
del cromo sólo actúa con `pointerType === 'mouse'`, con la razón escrita de que
el movimiento de un dedo es un drag y no un hover (`lib/controls.js:717-720`). El
segundo: en el segundo toque, el `pointerdown` del contenedor llama a `hide()`
cuando el blanco no está adentro de la capa del cromo
(`lib/controls.js:742`), así que cuando llega el `click` de ese mismo toque el
cromo ya está abajo.

Y un tercero, de la otra capa: la capa de avisos no recibe punteros a propósito
(`lib/concurrent-hls.js:122`), para no comerse los clicks que son de lo que está
abajo.

## Decisión

El toque sobre una caja enfoca **sólo cuando el cromo está arriba**, que es la
misma regla que ya gobierna los botones y la barra.

**Una regla, dos comportamientos, y ninguno escrito aparte.** El predicado es
*¿está el cromo arriba?* y no *¿es el segundo toque?*. De ahí sale la asimetría
sin una segunda regla:

- **Con mouse el hover ya puso el cromo arriba, así que el click actúa de una.**
  En escritorio es **un** click y no dos, y no hay sorpresa porque el cromo está
  a la vista todo el tiempo.
- **En celular no hay hover: el primer toque muestra y el segundo actúa**, que es
  lo que ya cuesta cualquier control de este player.
- **En un híbrido** —una notebook con pantalla táctil— la respuesta no depende de
  qué dispositivo es sino de si el cromo está visible en ese momento, que es la
  única forma de que no haya un tercer caso.

**Es un `pointerdown` y no un `click`.** En el segundo toque el `pointerdown` del
contenedor baja el cromo antes de que llegue el `click`, así que un gesto que
preguntara por el estado del cromo en el `click` fallaría justo en el toque que
tiene que actuar. El `pointerdown` del nodo corre **antes** que el del
contenedor, porque burbujea desde el blanco, así que lee el cromo como estaba
cuando el dedo bajó. Es también lo que hace la barra, que navega en el press.

**Los punteros se habilitan en el nodo y no en la capa.** La capa sigue con
`pointerEvents: 'none'` y su invariante intacto; lo que se habilita es
`pointer-events: auto` en los nodos de video del aviso. La capa deja de comerse
los clicks de abajo porque el que los recibe es el nodo, y el otro invariante de
esa función, el `z-index` ausente, no se toca.

**Y se habilitan en `place()` y no en `createNode`, y esto no es un detalle**:
`bringAhead` construye nodos con `opacity: 0` que ya están posicionados sobre su
caja, y **opacity no detiene un dedo**, que es la lección de la fase 04 una capa
más arriba. `place()` sólo recorre lo que está en pantalla, así que un nodo
precargado no puede tomar el gesto.

**El cableado va en `attach()`** (`lib/concurrent-hls.js:203`), que es el punto de
entrada cuyo trabajo es juntar las dos piezas. `createControls` agrega `up` a su
handle —hoy devuelve `{ layer, track, show, hide }` (`lib/controls.js:814`) y el
`up` ya existe adentro (`lib/controls.js:674`)— y `attach()` le pasa al renderer
un predicado que lo consulta. Como es una función que se evalúa en el momento del
toque, no importa que el renderer se cree antes que los controles. Con eso el
renderer no aprende qué es el cromo y los controles no aprenden qué es una caja de
aviso.

## Consecuencias

El invariante de la capa sin punteros se toca por primera vez desde que se
escribió, y queda con su nota: sigue sin recibir punteros, y lo que los recibe es
el nodo que está adentro.

Descartado **que el listener viva en `attach()`** y despache por el
`data-element-id` del nodo. Además de darle al renderer una API pública de foco
que nadie más necesita, se rompe con el `id` de un elemento, que es
`source.id ?? 'asset'` (`lib/signalling.js:84`): dos experiencias solapadas sin
`id` propio comparten el `id` `'asset'` y el foco terminaría en la caja
equivocada. El renderer tiene la referencia al nodo y no necesita nombrarlo.

Descartado también **leer la clase `qa-controls--on` desde el renderer**: le
enseña al renderer qué es el cromo y necesita un selector, que es una de las
palabras que el grep del ADR 0015 prohíbe en `lib/`.

Y descartado **el gesto en el `click`**, por el segundo hecho del contexto, y
**habilitar punteros en la capa** o **en `createNode`**, por los dos defectos que
la decisión nombra.
