---
id: "0031"
title: Un toque en el primario también suelta el foco, sin ser blanco del gesto
status: accepted
scope: project
date: 2026-09-09
supersedes: "0027"
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Pedido de Nicolás sobre el gesto que la T-02 ya había cerrado: *"si toco el
contenido principal de nuevo, entonces vuelva el contenido principal. Además,
que si toco el contenido principal, también sea como deseleccionar."*

El ADR 0027 ya había mirado esta puerta y la había descartado, por una
colisión concreta: hacer enfocable el primario convertiría **cada** toque
sobre la imagen con el cromo arriba en un cambio de audio, y el gesto que hoy
baja el cromo (fase 04) pasaría a cambiar el sonido en su lugar. Esa colisión
sigue siendo válida hoy — no desapareció —, así que el pedido no se resuelve
reabriendo esa puerta, sino encontrando una que no choque con ella.

## Decisión

El primario sigue sin ser blanco del gesto de foco: no entra al índice, nunca
lleva el anillo, y un toque sobre él con nada enfocado hace exactamente lo de
siempre (ADR 0027, fase 04). Lo que se agrega es una **segunda puerta de
salida**, angosta y condicional, sobre el mismo toque:

- **Con el cromo arriba y algo enfocado**, un `pointerdown` sobre el primario
  suelta ese foco —la composición vuelve a la mezcla que declara el asset
  list, camino del ADR 0029— y el toque se consume ahí: no llega a alternar el
  cromo.
- **Con nada enfocado**, la misma condición (`releaseFocus()`) contesta
  `false` y el toque cae al comportamiento de siempre sin ninguna rama nueva.

La colisión del ADR 0027 no reaparece porque las dos lecturas del toque son
mutuamente excluyentes por construcción: no hay un estado de la composición en
el que el mismo toque pueda significar las dos cosas. Cuando hay algo
enfocado, el pedido de Nicolás — *"que vuelva el contenido principal"* y
*"que sea como deseleccionar"* — son la misma frase leída dos veces, porque
soltar el foco **es** volver a esa mezcla.

Implementación, en el orden de las tres piezas: `lib/renderer.js` gana
`releaseFocus()`, que suelta el foco si hay uno puesto y contesta si lo hizo;
`lib/controls.js` recibe ese predicado con el mismo default seguro que
`chromeUp` (`() => false`) y, en el `pointerdown` del contenedor, un toque con
el cromo arriba y el blanco exacto del `<video>` primario le pregunta antes de
decidir si alterna el cromo; `lib/concurrent-hls.js` cablea
`releaseFocus: () => renderer?.releaseFocus() ?? false` en `attach()`, la
misma forma que `chromeUp: () => controls?.up() ?? false` y por la misma
razón: se evalúa en el momento del toque, así que no importa qué pieza se
construyó primero.

Es una corrección sobre la T-02, ya cerrada, y no una task nueva: la fase no
reabre, el diff son las mismas tres piezas que la T-02 ya tocaba, y queda
anotado como `post-ejecución:` en el bloque de esa task.

## Consecuencias

**El invariante de la T-02 que importaba sigue en pie.** Enfocable sigue
siendo una caja de video del aviso y nada más: el primario no se suma al
índice de foco, no gana un anillo, y su nivel no se puede fijar en 1 por este
gesto. Lo único nuevo es una salida, no un blanco.

**Ahora hay dos puertas de salida por toque y no una que reemplaza a la
otra.** La que ya existía —tocar de nuevo la caja enfocada— sigue intacta y
sin tocar una línea; la que se agrega vive en el primario. Las cuatro salidas
del ADR 0029 quedan en cinco caminos posibles de tocar algo, pero la
que declara mezcla de destino sigue siendo una sola: la que ese ADR ya fijó.

**Descartado, otra vez, hacer focoable el primario en general.** Es
exactamente lo que el ADR 0027 ya había descartado y por la misma colisión;
esta decisión no la reabre, la puerta que agrega es angosta a propósito para
no pisarla.

Supersede al **ADR 0027** porque su afirmación central —"el primario no es
blanco del gesto, y nada más"— ya no es cierta sin matiz: con algo enfocado,
un toque sobre el primario **sí** tiene un efecto de audio. Lo que el ADR 0027
decidió sobre qué es enfocable, y el porqué de la colisión que motivó excluir
al primario, siguen valiendo tal como están escritos ahí.
