---
id: "0042"
title: El guion tiene una sola salida, y es el botón
status: accepted
scope: phase-08
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La demo guiada arranca sola al entrar a la página, porque alguien que abre el link desde
un mail no sabe que hay un botón y sin la guía se pierde el caso de negocio entero.
Cuando termina, el usuario queda libre para jugar con el player. Y hay un botón para
saltearla, para el que ya la vio.

Mientras la guiada corre, el guion frena y reanuda el programa, y el usuario tiene el
cromo del player a mano.

## Decisión

**La demo guiada termina de dos maneras: porque se acabó el último beat, o porque el
usuario apretó el botón de saltear. Nada más la corta.** En particular, un click o un
toque sobre los controles del player no la corta.

Y cuando termina, termina: no queda un estado guiado latente al que se pueda volver.

## Consecuencias

- **Esto se graba**, y una segunda salida que se dispara con cualquier gesto sobre el
  player es una salida que se dispara sola en medio de una toma. Una toma arruinada
  cuesta más que la molestia de tener que apretar el botón.
- "Un flujo, no dos modos" queda cierto en el código y no sólo en la página: hay un solo
  estado y su transición es de ida.
- El botón es visible durante toda la demo guiada, porque es la única salida.
- Descartado que cualquier gesto sobre el player ceda el control. Es lo que haría un
  producto, y no lo que le sirve a una grabación.
