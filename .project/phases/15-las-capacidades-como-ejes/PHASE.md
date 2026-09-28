---
phase: 15-las-capacidades-como-ejes
title: "Las capacidades como ejes: el APS devuelve todo y el SDK filtra"
status: in-progress
started: 2026-09-28
closed: null
---

# Fase 15: las capacidades como ejes

El diseño y sus descartes están en `DESIGN.md`; esto es el contrato.

## Objetivo

Que en `demo/stage-pair/` el usuario declare la capacidad del dispositivo en **dos ejes**
—decodificadores de video `1`|`2` e imágenes sobre video sí|no—, que el asset-list que vuelve
sea **el mismo en las cuatro combinaciones** con todas las opciones del aviso, y que **la
librería filtre** esas opciones con un paso explícito y visible antes de dibujar. Sin opción que
se pueda mostrar, el break con default cae al lineal y el que no tiene default se saltea.

Fecha comprometida: **2026-09-29**, antes de la grabación de David (hasta el 2026-09-30).

## Decisiones

- ADR 0085: el Player filtra las opciones y el APS estático devuelve todas (supersede al 0083).
- ADR 0086: la capacidad se declara en `capabilities`, con los ejes de R29.1, y viaja con sus nombres.
- ADR 0087: un break con default lineal y otro sin, y el de sin default no lleva tag lineal.
- ADR 0084: sigue en pie, con una nota fechada.

## Alcance

1. `lib/signalling.js` y `lib/concurrent-hls.js`: `capabilities`, los parámetros del pedido, y
   `selectOption`.
2. La señalización de `stage-pair`: un asset-list por break con `options`, una sola playlist.
3. `inspect.html` e `index.html`: el control de dos ejes; en `inspect.html`, el panel del filtro.
4. El README de la demo con el ejemplo de API para David, y `docs/integrating-the-library.md`.

## Fuera de alcance

- El eje HTML: la librería no dibuja HTML.
- Cambiar la capacidad en caliente sin rearmar el player.
- `race.html` (medio video, sin control), las otras cuatro demos, `docs/contrato-senalizacion-renderizado.md` más allá de la opción nueva.
- Push y deploy al bucket.

## Criterio

**Nada de lo que ya anda se rompe.** Línea de base medida el 2026-09-28 sobre `010eb23`:
`npm test` **216 pruebas, 216 pasan**; `npm run check` **verde, sale 0**.

## Riesgos

Ver la tabla de `DESIGN.md`; cada mitigación está en su task.
