---
closed: 2026-10-26
---

# Fase 18 — informe de cierre: HLS y DASH lado a lado

## 1. Resumen

La librería quedó partida por formato sin que cambie lo que hace ninguna demo. `lib/` tiene lo que
un player de cualquier formato usa tal cual: el renderer, los controles, el multi-view, el
tracking, el post-roll, el modelo de un corte (`lib/experience.js`) y las capacidades y opciones
(`lib/capabilities.js`). `hls/` tiene el transporte HLS (`signalling.js`), cómo se adjunta un
creativo con hls.js (`media.js`) y el punto de entrada (`concurrent-hls.js`). `dash/` existe con un
README que dice la regla. La fase DASH puede importar el modelo y las capacidades de `lib/` sin
mover nada antes.

La prueba, contra `0739c38`: 378/378, check verde, y la corrida en seco con 0 referencias
faltantes, 0 borrados y los mismos playlists señalizados. Las copias pasan de 0 a 11: el dist en las
cinco demos y los seis archivos de test de demo que importan de la librería.
`scripts/comparar-publicacion.mjs` prueba que esos 11 cambios son inertes: el dist tiene las mismas
174 declaraciones con el mismo texto (otro orden y otros comentarios) y define el mismo global, y
los tests importan los mismos nombres. Nicolás aceptó ese criterio antes de mover código, porque
ninguna reestructura de `lib/` podía dejar el dist byte a byte igual.

**El próximo push a main publica un dist nuevo en las cinco demos, con el mismo comportamiento**, y
los tests de demo con sus imports nuevos. Main local está en `aab6382`, sin push.

## 2. Decisiones

- ADR 0116 (proyecto): `lib/` es lo que no nombra el formato, `hls/` y `dash/` lo que lo nombra, y
  el grep del ADR 0003 corre sobre `lib/` entera. Generaliza el ADR 0020.
- ADR 0117 (proyecto): el reparto de `signalling.js`, declaración por declaración, y el orden del
  build.
- ADR 0118 (proyecto): una reestructura se prueba comparando lo que se publicaría contra lo
  publicado; el dist sólo puede cambiar de orden y comentarios.
- ADR 0119 (proyecto): `demo/` no se toca y `dash/` nace con su regla.

## 3. Tareas

Las cinco `done`: T-01 el comparador (con 14 plantados en su `--control`), T-02 la partición, T-03
las costuras y la publicación, T-04 `dash/` y la documentación, T-05 la verificación y el merge.

## 4. Hilos abiertos

- **18 líneas publicadas en `demo/` nombran rutas que ya no existen** (`lib/signalling.js`,
  `lib/media.js`, "assembled from lib/"), en comentarios de páginas y de JS y en un `"_"` de
  `stage-pair/stage.json`. La lista está en `tasks/T-04/T04-grep.log`. Se corrigen cuando la fase
  DASH toque `demo/`, que la republica igual.
- **La copia de `LINEAR_TYPE` en `lib/renderer.js`** existía para no importar de la capa de
  señalización. Ahora la constante está en `lib/experience.js`, del mismo lado, así que la copia
  podría ser un import. No se cambió porque cambia una declaración del dist.
- **El bucket publica `demo/<demo>/test/`**, tests incluidos. Es anterior a esta fase; fue lo que
  hizo que cambiaran archivos publicados además del dist.

## 5. Riesgos que se dieron

Uno, en el diseño y antes de mover código: la regla "la misma lista de lo que se sube" era
incumplible para cualquier reestructura de `lib/`. Se resolvió con Nicolás (ADR 0118). Ninguno de
los de ejecución se dio.

## 6. Recomendaciones para la fase siguiente

- Subir de `hls/` a `lib/` sólo lo que DASH reuse, cada vez en su propio commit, y correr
  `scripts/comparar-publicacion.mjs <antes>` y `npm run check` como testigos.
- Cuando entre el primer `dash/*.js`: sumar `dash/*.js` a la costura 0015 de
  `verificar-cortes.mjs`, y a `demos-cambiadas.sh` y al `git archive` de `publicar.sh` si entra en
  lo publicado. Lo dice `dash/README.md`.
- Corregir las 18 líneas de `demo/` en la misma fase.

## 7. Correcciones post-ejecución

Una, en T-02: el `hls` del `git archive` de `publicar.sh` se hizo ahí y no en T-03, porque el
comparador arma el stage con el `publicar.sh` de cada commit. Muestra que T-02 y T-03 se partieron
por el lado equivocado de una dependencia: la definición de hecho de T-02 dependía de una línea
asignada a T-03.

## 8. Revisión de la documentación

- **`description` de `PHASE.md`**: reescrita como lo que la fase resultó ser.
- **`docs/arc42/`**: el proyecto no tiene uno; no hubo nada que corregir.
- **`docs/`**: `integrating-the-library.md` (`MAX_BOXES` en `lib/experience.js`,
  `MULTIVIEW_CLASS` en `hls/signalling.js`, el build sobre `lib/` y `hls/`) y
  `contrato-senalizacion-renderizado.md` (`hls/media.js`), en T-04.
- **`README.md`**: "What is where" con `lib/`, `hls/`, `dash/` y el comparador; qué lee `test/`; qué
  es la librería. En T-04.
- **`CLAUDE.md` del proyecto**: la documentación real son las cabeceras de `lib/*.js` y `hls/*.js`.
  En T-04. Sus secciones de publicación no cambiaron, porque la publicación no cambió de forma.
- **`.project/knowledge/`**: el proyecto no tiene; nada.
- **`CLAUDE.md` y `knowledge/` del repo padre**: la fase no cambió nada que valga para todo el repo.
- **Runbook**: la publicación es `publicar.sh`, cuya cabecera nombra `hls/` (T-02, T-03).
- **Registro**: los `tasks/T-0N/README.md` de esta fase dicen en su primera línea que son el
  registro de la corrida del 2026-10-26.
- **`demo/`**: no se tocó (ADR 0119); lo que quedó viejo está en el punto 4.
