---
id: "0107"
title: Cada playlist de los pares lleva un break lineal tradicional con la clase de Apple escrita, y lo reproducen los dos panes
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Decisión (c) de David Hassoun del 2026-10-22: nuestro player soporta las dos clases en una
implementación (ADR 0106), y para mostrarlo cada playlist suma un break lineal tradicional
`CLASS="com.apple.hls.interstitial"` **escrito**, no sustituido por la variable del ADR 0105, en un
momento que no se solape con ningún otro break; todos los demás siguen con la clase del parámetro.

## Decisión

- **`stage-pair`:** `stage.json` declara `breakLineal` (id `linear`, 150 s, 12 s, KETRAVA) fuera de
  `breaks`, porque no es un break de nuestra clase. `escribir-asset-lists.mjs` escribe
  `asset-list-break-linear.json` sólo con la parte estándar (`URI` del KETRAVA 16:9, el lineal de
  PRE y B, y `DURATION` 12): sin media nueva. El señalizador agrega
  `ID="AD-LINEAR",CLASS="com.apple.hls.interstitial"` en forma de reemplazo. Entre C (termina en
  122 s) y el fin (198 s) no se solapa con nada.
- **`compatibility-pair`:** `ID="AD-LINEAR"` a los 5 s con el `asset-list-linear.json` de 12 s que
  la demo ya tenía (adA). Termina a los 17 s, antes del break 1 (20 s). El programa dura 180 s y
  el único hueco de 12 s libre lejos de los bordes está antes del primer break.
- **Las páginas lo muestran:** en `index.html` de `stage-pair` el salto "break LINEAR
  (traditional)" cae 5 s antes y un salto o un arrastre adentro reconstruye los dos panes (ninguno
  acepta un seek ahí); los pedidos que hace hls.js dentro de nuestro pane se listan como los del
  pane de fábrica; la línea bajo el pane dice "LINEAR AD, played by hls.js". En `inspect.html` el
  break tiene su tarjeta: la línea con la clase escrita, el pedido, y "Not a break of ours".
- **No se agrega en `hydration-break`, `multiview-offer` ni `race-multiview`:** sus recorridos están
  atados a un guion y a un relato (`story.json`, `race.json`) que habría que rehacer, y su contenido
  no está empaquetado en esta máquina para verificarlo.

## Consecuencias

- En los dos pares, el mismo segundo muestra lo mismo en los dos panes durante el lineal: es la
  prueba de que nuestro player también es un player de interstitials de mercado.
- Medido en Chrome headless (8091): en `compatibility-pair` los dos panes reproducen el lineal
  (fábrica "LINEAR AD AD-LINEAR · 8.9s of 12.0s", nuestro "LINEAR AD, played by hls.js · programa
  en 5.0s") y nuestro pane vuelve a dibujar el overlay del break 1 a los 20 s. En `stage-pair` los
  dos agendan y piden la lista; el creativo KETRAVA no está empaquetado en esta máquina (404), así
  que hls.js lo saltea, como cualquier asset que no carga.
- Tests: los `signalled-run.test.js` de los dos pares (la clase escrita, la lista, que no se solapa).
