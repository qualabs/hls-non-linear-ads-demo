---
id: "0044"
title: El corrimiento de la parada del juego se declara una vez en la demo
status: accepted
scope: phase-08
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El plate se arma concatenando clips y la parada del juego cae en un segundo que decide
esa edición. La tabla del script de señalización tiene que poner el break exactamente
ahí, porque el break es lo que le dibuja publicidad encima a la parada.

Si los dos números se escriben a mano en dos archivos, la demo completa se corre de
lugar la primera vez que alguien reedita el plate, y lo hace sin que nada falle: el
break entra sobre juego corriendo en lugar de sobre la parada.

El contenido no está en git —`content/` está gitignoreado— así que el número no puede
vivir en el material.

## Decisión

**El corrimiento de la parada es un valor declarado una vez en la demo**, y los dos
scripts —el que empaqueta el contenido y el que señaliza— lo leen de ese lugar.

**Y el suite de la demo lo chequea**: el break que el script señaliza tiene que arrancar
en el corrimiento declarado.

## Consecuencias

- Es el mismo criterio del ADR 0037 aplicado al único eslabón de la cadena que no puede
  leerse del contrato, porque ocurre antes de que exista un player.
- El chequeo es lo que hace que la decisión no sea un acuerdo verbal entre dos scripts.
- Reeditar el plate es cambiar un número, y el break lo sigue.
