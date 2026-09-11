---
id: "0064"
title: El bloque de multi view anuncia un catálogo y no un layout, así que no trae viewport
status: accepted
scope: project
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

En el aviso concurrente, el que publica decide cómo se ve el aviso y el cliente
obedece: el `layout` del bloque `X-AD-CREATIVE-SIGNALING` declara un `viewport` de
cuatro porcentajes, un `zDepth` y un `volume` por elemento, y el renderizado los
dibuja donde dicen.

El multi view invierte esa relación. El que publica **ofrece** un conjunto de
contenidos y quien mira arma su propia composición: sube y baja cámaras mientras
la ventana está abierta. Eso rompe el supuesto sobre el que descansa el `viewport`
declarado, y lo rompe de raíz: **dónde va cada caja depende de cuántas cajas hay**,
y ese número no se conoce cuando se arma el contenido, cambia varias veces adentro
de una misma ventana, y lo decide alguien del otro lado de la red.

Hay además una colisión de nombres que no es cosmética. `multiView` es uno de los
seis identificadores que emite la herramienta de SVTA y el ADR 0012 lo mapea al
Quad editorial, que es un layout de `viewport` fijos y el break 4 del recorrido
que se graba.

## Decisión

El bloque de una oferta es el mismo `X-AD-CREATIVE-SIGNALING`, con `type: "offer"`
en el nivel del bloque —donde el aviso dice `"slot"`— y un item de `payload` con
`type: "multiViewOffer"`.

**Se mantiene todo el sobre**: `ASSETS[]` con `URI` y `DURATION` obligatorios del
Apéndice D.2, `version`, y el item con `start` y `duration` significando lo mismo
que hoy, de modo que `resolveExperience` arma el `startTime` con la misma suma de
tres números y `resolveAssetList` acumula el offset con los mismos `DURATION`.

**Donde el aviso tiene `layout`, la oferta tiene `views[]`**, y cada vista trae
`id`, `name`, `type` (el MIME) y `uri`, **sin `viewport`, sin `zDepth` y sin
`volume`**. Los tres son cosas que el que publica no puede decidir acá: las dos
primeras porque dependen de cuántas cajas hay, y la tercera porque el estado
inicial de audio de una oferta no es una mezcla compuesta, es "sigue sonando el
programa", que es lo que el default asimétrico del ADR 0014 ya hace.

El item trae además **`primaryName`**, porque el contenido principal cuenta como
una vista y por lo tanto es una fila del selector que alguien tiene que nombrar.
Si falta, la librería usa una constante propia: una oferta sin esa etiqueta es una
oferta usable, no una oferta rota.

**`name` es un campo y no dos.** Una `description` sin un renglón donde mostrarse
es un campo del formato que nadie lee.

El `URI` de nivel superior del asset, que el Apéndice D.2 obliga, lleva el `uri` de
la primera vista.

## Consecuencias

**El repliegue del ADR 0019 sigue funcionando sin pedirle nada nuevo.** Un cliente
que no entiende el bloque ve un asset normal con su `URI` y su `DURATION`, lo
reproduce a cuadro entero, y la oferta degrada a "una de las cámaras, lineal". No
es equivalente, y como en el ADR 0019 eso se dice en vez de suavizarse: lo que se
pierde no es calidad de render, es la elección entera.

**El nombre importa tanto como el resto del formato.** `aws-multiview` pagó esa
lección construyendo y la dejó como regla: *"Ni 'View2', ni el nombre del channel
de MediaPackage."* Un catálogo del que alguien elige necesita que sus items se
lean.

**Es la decisión que más material le deja a SVTA**, y por eso el alcance es de
proyecto. Dice que la extensión tiene dos formas y no una —una experiencia cuyo
layout declara el que publica, y una cuyo layout calcula el cliente— y que el
discriminante entre las dos es qué campos trae el payload, no un flag.

**Y el `type` del item viaja al renderizado sin que el renderizado aprenda nada**:
`fadesInAndOut` sólo compara contra `'linear'`, así que `multiViewOffer` cae del
lado que lleva transición, que es el correcto.
