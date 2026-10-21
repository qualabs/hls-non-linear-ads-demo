---
title: "La publicación continua: cada push a main republica sus demos"
description: "Un publicador para las cinco demos, un workflow que publica en cada push a main sólo lo que cambió, y WIF sin claves; content/ queda fuera del CI porque no está en git"
started: 2026-10-20
origin: "Nicolás, 2026-10-20, despacho de agent-nicolas-laptop-865daf a hls-demo-ci"
category: chore
priority: medium
---

# Fase 16: la publicación continua

El diseño y lo que lo cambió están en `DESIGN.md`; esto es el contrato.

## Objetivo

Que un push a `main` deje las demos que tocó publicadas igual a `main`, verificadas sin credenciales,
sin que nadie corra nada a mano ni exista una clave.

## Decisiones

- ADR 0094: el CI publica lo que está en git, y `content/` del bucket queda salvo sus playlists señalizadas.
- ADR 0095: GitHub entra a GCP por Workload Identity Federation, sólo este repositorio en `main`.

## Alcance

1. `scripts/publicar.sh` y `scripts/publicar.py`, que reemplazan a `demo/stage-pair/scripts/publicar.sh`.
2. `scripts/demos-cambiadas.sh` y `.github/workflows/publicar.yml`.
3. `scripts/configurar-wif.sh`: pool, proveedor, cuenta, y su verificación. La cuenta lleva dos
   roles en cada bucket: `roles/storage.objectAdmin` y `roles/storage.legacyBucketReader`, porque
   `gcloud storage rsync` necesita `storage.buckets.get` y objectAdmin no lo trae. A nivel de proyecto,
   nada.

## Fuera de alcance

- Crear buckets, o tocar su acceso público o su IAM más allá de la cuenta nueva.
- Publicar desde otras ramas.
- Subir `content/` desde CI.

## Riesgos

- **La primera corrida cambia cuatro demos públicas** que hoy están atrasadas. Mitigación: se dice
  antes del push y la corrida va con el OK de Nicolás.
- **La primera verificación HTTP puede dar rojo por caché**: los objetos viejos tienen la hora
  pública por defecto y el borde de Google la respeta. Aceptado: la corrida siguiente, una hora
  después, lo confirma; desde ahí todo lo de nombre fijo va con `no-cache`.
- **Una corrida que falla a mitad deja demos publicadas a medias.** Mitigación: todas las
  verificaciones corren antes de escribir nada, y la base de la corrida siguiente es la última verde,
  que vuelve a publicar las que quedaron.
