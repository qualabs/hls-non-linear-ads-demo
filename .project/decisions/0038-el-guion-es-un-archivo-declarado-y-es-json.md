---
id: "0038"
title: El guion es un archivo declarado, y es JSON
status: accepted
scope: phase-08
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Los textos del guion son el único lugar donde esta demo argumenta en palabras y no en
pantalla, y Nicolás los va a reescribir muchas veces antes de mostrarla. Si viven
adentro del JavaScript de la página, cada corrección de una frase es una edición de
código.

## Decisión

**El guion vive en `demo/<slug>/story/story.json` y la página lo pide con `fetch`.** Un
beat tiene cuatro campos: `id`, `anchor` (ADR 0037), `text` y `hold`.

JSON por dos razones. **Es el formato de los datos declarados de este repositorio** —los
asset lists son JSON y el suite los lee como datos—, y la estética le pone un techo al
largo de cada texto, una frase con tipografía grande, que es exactamente el largo que
JSON maneja sin dolor.

`story/` y no `guion/` porque el árbol de una demo está en inglés (`content/`,
`signalling/`, `brand/`, `scripts/`), y no `script/` porque colisiona a la vista con
`scripts/`, que son los shell scripts.

## Consecuencias

- Corregir una frase es editar un archivo de datos, y el diff de una corrección de copy
  no toca código.
- El suite puede leer el guion como dato para chequear sus anclas, sin importar la
  página ni instanciar nada.
- Descartado un módulo JS que exporte el array. Se edita mejor —comillas invertidas,
  saltos de línea, comentarios— y no necesita `fetch`, pero es el lenguaje de la página:
  la línea entre "archivo declarado" y "código" se adelgaza, y el día que alguien meta
  una función adentro el guion dejó de ser un dato.
- Descartado markdown con frontmatter por beat. Se edita mejor que las dos y pide un
  parser en la página para ganar comodidad en un archivo de cuatro o cinco entradas.
