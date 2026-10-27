---
id: "0094"
title: El CI publica lo que está en git, y content/ del bucket queda salvo sus playlists señalizadas
status: accepted
scope: project
date: 2026-10-20
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## 2026-10-26 — nota: la referencia que falta a propósito no frena la publicación

El merge de `svta2053-v3-updates` a `main` (`adde7f2`) dejó el CI en rojo sin publicar nada: el
chequeo de referencias encontró las dos URIs del break C de `stage-pair` que no existen a propósito
(`stage.json`, `primeraOpcionRota`, para que se vea el failover del renderer, ADR 0107):
`content/creatives/kovrin-banner/missing-on-purpose/index.m3u8` en el asset-list HLS y
`.../missing-on-purpose/dash/manifest.mpd` en los slots DASH.

**Desde ahora el chequeo acepta exactamente esas faltas y ninguna otra.** `deliberate()` en
`scripts/publicar.py` lee `primeraOpcionRota` de cada break del `stage.json` del stage y le suma su
forma DASH, derivada como la deriva `escribir-asset-lists.mjs` (`index.m3u8` pasa a
`dash/manifest.mpd`). No hay una lista de rutas escrita a mano: si se saca el campo de `stage.json`,
las dos referencias vuelven a ser faltas. Las aceptadas no se esconden: salen como
`ACCEPTED (deliberate, stage.json primeraOpcionRota)` con el break del que vienen, como las
excepciones de `verificar-cortes.mjs` llevan su motivo. Si una URI declarada existe o nadie la
referencia, el chequeo lo dice en una línea `NOTE` sin ponerse en rojo. El `selftest` arma un stage
de prueba y exige que la falta declarada pase, que una no declarada al lado falle y que la misma
falta sin la declaración falle; las dos mutaciones (sin aceptación, sin la forma DASH) lo ponen en
rojo. Los pasos que siguen a la publicación (`fixes`, `verify`, `http`) no siguen referencias, así
que no piden esas URIs.

## Contexto

`content/` está en `.gitignore`: son ~600 MB de video que se regeneran del material de origen. Un
checkout de CI no lo tiene y un push no lo cambia. El publicador de stage-pair sincronizaba el árbol
entero con borrado, así que corrido desde CI habría borrado el video de los buckets.

## Decisión

- Se publica **HEAD** (`git archive`), con `dist/` construido aparte, no el árbol de trabajo.
- `content/` queda **fuera del sync en las dos direcciones** (`-x '^content/'`, que también lo saca
  del borrado).
- Las playlists señalizadas, que `senalizar-contenido.sh` escribe en `content/` leyendo el
  empaquetado (ADR 0005), son lo único de `content/` que un push cambia: se bajan del bucket las
  playlists, se corre el script, y se suben las que difieren.
- Si el script reescribe un archivo commiteado, HEAD está viejo y no se publica.
- El contenido se sube a mano con `scripts/publicar.sh --publicar --con-contenido <demo>`.

## Consecuencias

Un re-empaquetado no llega solo: hay que subirlo a mano, y el CI siguiente verifica que toda
referencia exista en el bucket antes de publicar.
