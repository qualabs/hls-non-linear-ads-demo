---
id: "0050"
title: El discriminante de las transiciones sale de lo que el contrato ya declara
status: accepted
scope: phase-09
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Nicolás pidió que la L y el banner entren y salgan con tiempo, y **excluyó
explícitamente el aviso a cuadro entero**: *"ahí no hay ningún efecto, ahí es un
cambio brusco y está, está bien, es lo que es"*.

Esa exclusión parecía descartar la solución obvia —animar toda caja que cambie—,
porque el aviso a cuadro entero también compone cajas. Y si el discriminante no
salía de lo que el contrato ya dice, había que agregarle un campo al asset list, o
sea tocar la superficie pública.

No hizo falta. Son dos preguntas distintas y las dos ya están contestadas en los
datos que la capa de señalización entrega.

## Decisión

**La geometría del contenido primario se anima siempre**, por `transform`, sin
preguntar de qué layout se trata. Donde el layout no le da una caja más chica, la
transición interpola entre dos geometrías idénticas y en pantalla no pasa nada: el
aviso a cuadro entero declara `primaryContent` con `viewport: '0 0 0 0'` y `zDepth`
0 (`lib/signalling.js:214`), así que `movePrimary` calcula `scale(1, 1)` y
`translate(0px, 0px)`. **No hay rama, no hay campo y no hay etiqueta que leer**: el
mecanismo se apaga solo donde tiene que apagarse, porque ahí no hay nada que mover.

**El difuminado de un nodo de aviso se prende para todo aviso menos el de cuadro
entero**, y lo decide `experience.type === LINEAR_TYPE`
(`lib/signalling.js:142`). Es una etiqueta **de este contrato** y no un valor que
alguien escriba en un asset list: la pone la capa de señalización cuando un `ASSET`
no trae bloque o trae uno que no se puede dibujar (ADR 0019). El repliegue cae al
mismo lugar, así que un bloque roto también entra sin difuminado, que es lo
correcto: en pantalla es un aviso a cuadro entero y nada más.

**Y un nodo construido en el momento entra sin difuminado.** Los que `bringAhead`
trae anticipados ya están en el DOM en opacidad 0, así que difuminarlos es cambiar
un valor ya calculado; uno que `build` construye en el acto se crea y se inserta en
la misma pasada, donde una transición no arranca sin forzar un reflow o esperar un
cuadro. Ninguna de las dos cosas se paga: el camino es el de caer en el medio de la
ventana de un aviso, o sea un seek, donde un difuminado además sería incorrecto —
nadie está viendo entrar al aviso.

Descartado: una rama por `type` para la geometría, animando sólo en `squeezeback*`.
Una rama por etiqueta hay que mantenerla cada vez que aparece un layout, y se
equivoca al primer layout nuevo que encoja el primario sin llamarse squeezeback.
También descartado: difuminar sólo las imágenes (`isImage`), leyendo *"el banner y
las imágenes"* al pie de la letra. Deja al overlay de video entrando de golpe en la
misma demo donde el banner entra difuminado, y *"siempre tengan estos elementos"*
dice lo contrario.

## Consecuencias

- **La superficie pública no cambia en nada**: ni un campo en el asset list, ni una
  opción en `attach`, ni una línea del contrato. Es lo que hace posible que el
  comportamiento vaya fijo en la sdk como se pidió, porque no hay nada que una demo
  pueda prender ni apagar.
- **Es la segunda vez que el contrato expresó una forma sin que hubiera que
  pedirle un campo**, después del ADR 0047. No es casualidad: la regla 3 —el
  primario es un elemento del layout como cualquier otro, con su caja— es la que
  vuelve a pagar las dos veces.
- El discriminante del difuminado queda como función pura y exportada, así que es
  la única parte de la fase que los tests alcanzan.
- Si mirándolo resulta que el video tenía que entrar seco y sólo las imágenes
  difuminadas, la vuelta es cambiar un predicado de una línea.
