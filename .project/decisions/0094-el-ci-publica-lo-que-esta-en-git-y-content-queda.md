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
