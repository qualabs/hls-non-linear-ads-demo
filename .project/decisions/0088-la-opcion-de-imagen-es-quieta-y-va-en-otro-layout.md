---
id: "0088"
title: La opción de imagen es quieta y va en otro layout que la de video
status: accepted
scope: project
date: 2026-09-28
supersedes: "0084"
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0084 decidió que cada forma de aviso existe en video y en imagen, y que entre las dos
variantes **no cambian el layout, la campaña ni la duración: cambia el medio**. La imagen era el
mismo SVG animado que el video capturaba.

Nicolás probó la demo publicada y no pudo distinguir las dos opciones sin inspeccionar el
elemento: un SVG con movimiento adentro de un `<img>` se ve como un video, y la misma caja en el
mismo lugar se ve como la misma experiencia. Con dos navegadores lado a lado —dos
decodificadores contra uno con imágenes— la diferencia que la demo quiere mostrar no se veía.

## Decisión

- **La opción de imagen es una imagen quieta.** Es el SVG autorado congelado en un instante por
  `scripts/congelar-svg.py`, sin ninguna animación, y es idéntico píxel por píxel a ese cuadro
  del original.
- **Y va en otro layout que la de video, de la misma campaña**: el side by side pasa a la L, la L
  al side by side y el banner a la L (`breaks[].formaImagen` en `stage.json`). Las opciones de un
  candidato pueden diferir en layout, y la spec lo contempla (R5.5, UC-09).

## Consecuencias

- Del 0084 sigue en pie lo principal: **la capacidad del dispositivo degrada el formato del aviso
  y no el aviso**. El publisher sigue monetizando la misma campaña con publicidad no lineal
  sobre el programa. Lo que deja de ser cierto es "mismo layout, misma caja": ahora cambian el
  medio, la forma y el movimiento.
- El test que aseguraba que entre las dos opciones cambiaban sólo `type` y `uri` se reemplazó por
  uno que asegura que la forma es otra y la campaña la misma.
- Hay tres SVG congelados en `graphics/campaigns/` (`*-fijo.svg`). Se generan del original y no
  se editan a mano; su procedencia está en `CREDITS.md`.
