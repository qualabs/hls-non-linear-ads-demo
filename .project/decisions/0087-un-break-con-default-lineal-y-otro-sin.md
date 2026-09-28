---
id: "0087"
title: Un break con default lineal y otro sin, y el de sin default no lleva tag lineal
status: accepted
scope: phase-15
date: 2026-09-28
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

David pidió mostrar las dos salidas de un aviso que no se puede dibujar: *"if the default URI is
defined render as linear. If not, it skips"*, con un break de cada tipo. La librería ya tiene
las dos: el `URI` de nivel superior del asset se reproduce como lineal (ADR 0019), y un asset sin
nada reproducible se saltea (D.5).

## Decisión

- **El break A no tiene default**: el asset concurrente no lleva `URI` y la playlist no lleva tag
  lineal. Es contenido que no se interrumpe: el pane de fábrica no pone nada y el nuestro dibuja
  el aviso si puede, y si no, lo saltea.
- Los breaks B y C llevan default: el asset concurrente tiene `URI` (el lineal de su break) y la
  playlist tiene su tag lineal de Apple.
- Es A y no otro porque es el único cuyo creativo lineal (ZUMBRA 16:9) es también su aviso
  concurrente. Sacarle el lineal a B o a C dejaría una de las nueve piezas autoradas sin usar en
  la demo; sacárselo a A no deja ninguna.

## Consecuencias

- En A el pane de fábrica ya no interrumpe. Se descartó dejarle el tag lineal: en cámara se
  contradice con "esto no se interrumpe".
- D.2 hace obligatorio el `URI` de cada Asset-Description. Un asset sin `URI` es lo que D.5 manda
  saltear, y es la forma más chica de decir "sin default" en esta capa. En la spec el default es
  el interstitial de la base con `SUPERSEDE` (ADR 0005 de sgai-for-hls), no un campo del asset.
