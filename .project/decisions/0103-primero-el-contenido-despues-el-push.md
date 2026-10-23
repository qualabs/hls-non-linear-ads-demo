---
id: "0103"
title: "Primero el contenido, después el push"
status: accepted
scope: project
date: 2026-10-22
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El CI verifica cada `uri` de los asset-lists contra el árbol y el `content/` del bucket, y `content/` no está en git (ADR 0094): un push con asset-lists que nombran MP4 que el bucket no tiene da rojo y no publica.

## Decisión

Con el código en `main` local: `scripts/publicar.sh --publicar --con-contenido stage-pair hydration-break`, que publica HEAD con su contenido, y después el push. Las dos son salidas a internet y se piden juntas a Nicolás.

## Consecuencias

Es el primer uso real de `--con-contenido` (la fase 16 lo dejó sin probar): la corrida en seco previa lista sus copias y borrados.
