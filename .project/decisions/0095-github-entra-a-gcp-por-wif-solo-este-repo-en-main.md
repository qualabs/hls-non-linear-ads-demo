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

**2026-10-21: nota.** La cuenta lleva **dos roles en cada bucket, y no uno**:
`roles/storage.objectAdmin` y `roles/storage.legacyBucketReader`. El primer run de Actions
(39624308222) falló en "Publish and verify": `gcloud storage rsync` pide `storage.buckets.get`, y
objectAdmin no lo trae. Ese run no escribió nada. legacyBucketReader agrega `storage.buckets.get` y
`storage.objects.list`, y nada más. A nivel de proyecto sigue sin haber nada.
`scripts/configurar-wif.sh` los da y verifica que estén exactamente los dos (commit 9d1aa2b).
