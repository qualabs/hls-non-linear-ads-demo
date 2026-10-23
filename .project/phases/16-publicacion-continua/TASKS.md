# Tasks — fase 16-publicacion-continua

| id | brief | status | who | plan | evidence |
| --- | --- | --- | --- | --- | --- |
| T-01 | `scripts/publicar.sh`: un publicador para las cinco, en seco por defecto | done | agent | — | rama `ci-publicar` · [`tasks/T-01/`](tasks/T-01/) |
| T-02 | El workflow y `scripts/demos-cambiadas.sh` | done | agent | — | rama `ci-publicar` · [`tasks/T-02/`](tasks/T-02/) |
| T-03 | El lado GCP: WIF, la cuenta y sus permisos por bucket | done | both | — | `scripts/configurar-wif.sh` (af3cf66, 9d1aa2b), corrido por Nicolás |
| T-04 | El push y la primera corrida, verificada | done | human | — | [`tasks/T-04/primer-run-verde.txt`](tasks/T-04/primer-run-verde.txt) · run 39627734040 |

---

## T-01 — Un publicador para las cinco demos

- **Objective:** cualquiera de las cinco demos se publica con un comando, igual a HEAD, y no se
  publica ninguna si alguna verificación falla.
- **What it must cover:** las trampas del `CLAUDE.md` (host, 403, `.ts`, `-x` anclado,
  `.fuentes/`); `content/` fuera del sync salvo con `--con-contenido` (ADR 0094); las referencias de
  páginas, asset-lists y playlists hasta los segmentos; `no-cache` en lo de nombre fijo; md5 contra
  el bucket y sha256 sin credenciales. Parte de `demo/stage-pair/scripts/publicar.sh`, que reemplaza.
- **Definition of done:** `--all` en seco verde, `--control` rojo, y las mutaciones (segmento que
  falta, asset-list commiteado viejo) en rojo.
- **nivel de verificación:** alto. Corre sin nadie mirando y escribe en demos públicas.

## T-02 — El workflow

- **Objective:** un push a `main` publica sólo las demos que cambió desde la última publicación verde.
- **What it must cover:** build, `npm run check`, `npm test` antes de publicar; lo compartido
  (`lib/`, `vendor/`, el build, el publicador, el workflow) son las cinco; sin base confiable, las
  cinco; `concurrency` sin cancelar; acciones pineadas por SHA. Depende de T-01.
- **Definition of done:** actionlint con shellcheck en verde, y en rojo con una mutación; el selector
  simulado contra commits reales del repo.
- **nivel de verificación:** alto. Decide qué se publica sin nadie mirando.

## T-03 — El lado GCP

- **Objective:** el workflow de este repositorio en `main`, y nada más, puede escribir los cinco
  buckets, sin clave.
- **What it must cover:** lo que declara `scripts/configurar-wif.sh` (ADR 0095), incluida la API
  `sts.googleapis.com`.
- **Definition of done:** `scripts/configurar-wif.sh` termina en `GREEN`.
- **nivel de verificación:** alto. Es el permiso de escribir demos públicas.
- **Needs from a person:** correr `scripts/configurar-wif.sh` desde la rama `ci-publicar` con la
  cuenta Owner del proyecto (el agente no tiene permiso para crear recursos de IAM), y pasar la salida.

## T-04 — El push y la primera corrida

- **Objective:** el workflow corrió en `main` y las cinco demos quedaron iguales a `main`.
- **What it must cover:** depende de T-03. La primera corrida publica las cinco (no hay corrida verde
  previa), y cuatro cambian a la vista (`DESIGN.md`).
- **Definition of done:** la corrida en verde, con su paso de verificación HTTP sin credenciales.
- **nivel de verificación:** alto. Es la primera escritura real.
- **Needs from a person:** el OK de Nicolás para el push de la rama a `main`.
