---
id: "0119"
title: En la reestructura demo/ no se toca, y dash/ nace sin código y con su regla escrita
status: accepted
scope: project
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Todo `demo/<demo>/` se publica, comentarios incluidos. Varias páginas citan `lib/signalling.js` o
"assembled from lib/", que la fase 18 deja viejo. Y `dash/` tenía que existir vacía, con un README
que diga para qué es.

## Decisión

- **Ningún archivo de `demo/` cambia salvo los imports de sus tests (ADR 0118).** Las citas viejas
  de las páginas quedan como hallazgo del REPORT de la fase 18, para cuando la fase DASH toque
  `demo/`, que la republica igual.
- **`demo/` es el lugar de las demos, sin importar el formato.** Ni el build ni el servidor ni la
  publicación atan una demo a HLS fuera de su propio código. Cómo una demo muestra el mismo stream en
  DASH lo diseña la fase DASH.
- **`dash/README.md`**: lo que DASH necesita y está en `lib/` se importa de ahí; lo que es de DASH
  va en `dash/`; lo que resulte común en `hls/` sube a `lib/`, con el grep del ADR 0003 (ADR 0116) y
  `comparar-publicacion.mjs` (ADR 0118) como testigos. Sin código.

## Consecuencias

- Las URLs y el contenido publicado de las demos no cambian salvo lo del ADR 0118.
- Hasta la fase DASH, algunos comentarios publicados nombran rutas que ya no existen.
