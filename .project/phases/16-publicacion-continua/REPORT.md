---
closed: 2026-10-21
---

# Fase 16 cerrada: la publicación continua

## 1. Resumen

Cada push a `main` publica solo las demos que cambió, sin claves. El primer run verde
(39627734040, sobre ffab867) publicó las cinco, porque no había una corrida verde anterior. Contra
HEAD, por md5, dio 0 distintos, 0 faltantes y 0 sobrantes en los cinco buckets, y sin credenciales
dio 0 URLs distintas, 403 en la raíz y 404 en el control. Dejó al día los cuatro buckets que
estaban atrasados respecto de `main`, y en stage-pair borró el `scripts/publicar.sh` viejo
(505 → 504 objetos).

## 2. Decisiones

- ADR 0094: el CI publica lo que está en git, y `content/` del bucket queda salvo sus playlists
  señalizadas.
- ADR 0095: GitHub entra a GCP por WIF, solo este repositorio en `main`. Tiene una nota del
  2026-10-21: son dos roles por bucket.

## 3. Tasks

Las cuatro `done`. T-01 y T-02, en la rama `ci-publicar`, con su evidencia en `tasks/`. T-03 lo
corrió Nicolás con `scripts/configurar-wif.sh`. T-04 es el run verde, en
`tasks/T-04/primer-run-verde.txt`.

## 4. Hilos abiertos

- Ningún run probó todavía `--con-contenido`, que es el camino manual después de re-empaquetar.
  Solo corrió en seco, sobre stage-pair.
- Ninguna corrida en seco prueba los permisos de la cuenta, porque corren con la cuenta Owner.
  Probarlo antes de un run exige `--impersonate-service-account` y un permiso más.

## 5. Riesgos que se dieron

- La primera corrida cambió cuatro demos públicas a la vista. Estaba previsto, y se avisó antes del
  push.
- El riesgo de caché en la primera verificación HTTP no se dio: el run verificó en verde.
- Dos fallas de configuración en GCP que la verificación de la fase no podía ver, y ninguna
  publicó nada. El display name del proveedor pasaba los 32 caracteres (af3cf66), y a objectAdmin
  le falta `storage.buckets.get`, que rsync pide (9d1aa2b, run 39624308222). Las dos se vieron
  recién al crear los recursos o al correr con la cuenta real.

## 6. Recomendaciones

Cuando un script crea permisos, la verificación tiene que correr con la identidad que los va a
usar, no con la que los crea. La lógica de la publicación estaba bien medida (controles en rojo,
mutaciones, referencias contra los buckets vivos), y los dos huecos estaban del lado de la
identidad.

## 7. Correcciones post-ejecución

`grep -n "post-ejecuci" TASKS.md` da 0 líneas. Los dos arreglos de T-03 (af3cf66, 9d1aa2b) no se
anotaron como correcciones de la task: están en el LOG y en la nota del ADR 0095.

## 8. Revisión de la documentación

- **`description` de `PHASE.md`**: reescrita como lo que resultó ser la fase.
- **`docs/arc42/`**: el proyecto no tiene uno, y esta fase no describe la librería sino cómo se
  publica.
- **El resto de `docs/`**: nada que cambiar. Los dos documentos son de la librería y del contrato
  de señalización, y la búsqueda de "publish" en `integrating-the-library.md` solo da usos que no
  hablan de publicar las demos.
- **`README.md`**: nueva sección "Published demos", con las cinco URLs y una línea que apunta al
  `CLAUDE.md` (cc0e34a).
- **`CLAUDE.md` del proyecto**: corregido en la rama, en el commit del CI. Dice que cada push
  publica, que `content/` va a mano con `--con-contenido` y que la autenticación es WIF. Lo demás
  de la sección (host, 403, `.ts`, `-x`, `.fuentes/`) sigue siendo cierto.
- **`.project/knowledge/`**: el proyecto no tiene esa carpeta.
- **`CLAUDE.md` y `knowledge/` de la raíz**: nada, porque la fase no cambió nada que valga para
  todo el repo.
- **Runbook de instalación**: el proyecto no tiene uno. El paso que se agregó, configurar WIF, está
  en `scripts/configurar-wif.sh`, que se describe a sí mismo en su encabezado.
- **`tasks/` de la fase**: los `.txt` son salidas de corridas fechadas por su commit, así que son
  registro y no instrucción vigente.
