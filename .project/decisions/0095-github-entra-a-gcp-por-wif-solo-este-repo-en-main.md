---
id: "0095"
title: GitHub entra a GCP por Workload Identity Federation, sólo este repositorio en main
status: accepted
scope: project
date: 2026-10-20
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El workflow necesita escribir los cinco buckets. Una clave JSON en un secreto es una credencial
permanente que se puede filtrar.

## Decisión

- Pool `github` y proveedor OIDC `hls-non-linear-ads-demo` en `cto-assistant-501315`, con la
  condición `repository == 'qualabs/hls-non-linear-ads-demo'`, `repository_id == '1354922930'` y
  `ref == 'refs/heads/main'`. El id además del nombre: un repositorio borrado y recreado con el mismo
  nombre no hereda el acceso.
- Cuenta `hls-demo-publisher`, con `roles/storage.objectAdmin` en cada uno de los cinco buckets y
  nada a nivel de proyecto. Sin claves.
- Lo declara y lo verifica `scripts/configurar-wif.sh`.
