---
description: Un URI relativo adentro de una lista de avisos (ASSET-LIST en HLS, sobre slot en DASH) se resuelve contra la página y no contra la URL de la lista
status: idea
category: fix
impact: low
origin: "Cierre de la fase 19 (2026-10-26), hallazgo de T-09"
---

La librería pasa el `uri` de cada asset del layout al elemento tal como viene, en `hls/` y en
`dash/`, así que uno relativo se resuelve contra la página. La 6.7 escrita en la fase 19 dice que se
resuelve contra la URL del sobre, y la 7.2 lo declara "Partly". Ninguna demo lo nota: todas usan
paths absolutos. Arreglarlo toca lo que dibujan las cinco demos (`lib/ad-list.js`).
