---
closed: 2026-10-26
---

# Fase 19 — SVTA2053 sobre DASH: informe de cierre

## 1. Resumen

La presentación concurrente tiene su carriage DASH escrita y probada. `dash/` (sobre dash.js 5.2.1
sin modificar) lee un EventStream con el esquema de SVTA2053, un Event por break con un sobre v2
`pod` marcado `features.concurrentPresentation`, pide `$remote.slots` 60 s antes con los `sgai-*`, y
entrega el mismo contrato que `hls/` usando el mismo `lib/`. `stage-pair` tiene un tercer modo por
pane, "DASH, our library", y con un pane HLS y otro DASH **se ve la misma opción, en la misma
ventana, pedida con la misma query, en cada break y en las cuatro combinaciones de capacidades**
(T-08, 64 chequeos y dos controles). El texto para SVTA2053 (la 6.7 y los ajustes de §1-§5, la 7.2)
está en `docs/svta2053-dash-concurrent-presentation.md`, con 63 citas chequeadas.

Las demos HLS publicadas hacen lo mismo: lo que cambia en ellas es la forma del dist (renombres y
mudanzas a `lib/`) y comentarios, cada cosa medida (T-02, T-05, T-07, T-10). Merge a main local
`7ec15b5`, sin push y sin publicar.

## 2. Decisiones

- ADR 0120 a 0127, las ocho decisiones del diseño (sobre v2 `pod`, el flag, `Slot.media`, `cue`, 60 s,
  el Replace en la librería, sin `?adclass=`, `stage-pair` con tercer modo). Las siete preguntas
  abiertas del diseño se tomaron con su recomendación.
- **ADR 0128**, nacido en T-01: `dash/signalling.js` lee el EventStream del texto del MPD en el
  interceptor de respuesta, porque dash.js 5.2.1 pierde el cuerpo en CDATA, no pasa los atributos de
  `ReplacePresentation` y pasa el `@id` por `parseInt`.
- Sin ADR, decididas en la ejecución con el criterio de los ADR y escritas en su task:
  - el renombre `resolveAssetList` → `resolveAssets`, `assetListUrl` → `listRequestUrl` (T-02);
  - los archivos de DASH se publican sólo en `stage-pair` (`DASH=(…)` en `publicar.sh`, T-05);
  - el remux en la línea de tiempo de HLS (`-output_ts_offset -1.4`, T-06/T-07).

## 3. Tareas

Las diez `done`; ninguna abandonada.

| | |
| --- | --- |
| T-01 | riesgos medidos: eventos al cargar, fallo de creativo por `ERROR`, el bug del CDATA → ADR 0128 |
| T-02 | `lib/ad-list.js`, `lib/playhead.js`, `lib/media.js`; `attachAsset` medido contra `bb0d78b` con un diferencial (590 corridas, 0 diferencias) |
| T-03, T-04 | `dash/signalling.js`; 29 tests, 16 mutaciones en rojo, `readMpd` en Chrome igual a la fixture |
| T-05 | `dash/media.js`, `dash/concurrent-dash.js`, el dist DASH, costuras; dist HLS byte a byte igual |
| T-06 | remux DASH, sobres `slot`, MPD señalizado; mismo cuadro que HLS en el mismo segundo |
| T-07 | el modo DASH en `stage-pair`; las 18 líneas viejas de `demo/` corregidas |
| T-08 | `verificar-pares.py --solo-dash` verde, con sus dos controles |
| T-09 | el texto para SVTA2053 |
| T-10 | documentación, verificación final, merge |

## 4. Hilos abiertos

- **Publicar es de Nicolás, y tiene un paso a mano.** El próximo push publica las cinco demos (el
  dist HLS cambió de forma). `stage-pair` va a dar rojo en CI hasta que su contenido DASH esté en el
  bucket: `publicar.sh --publicar --con-contenido stage-pair` desde un checkout que lo tenga (en seco:
  verde; 262 objetos de `content/` a copiar o borrar, sin desglosar). El contenido DASH está hoy sólo
  en el worktree `.worktrees/fase-19`; el `content/` de main no tiene ni el remux ni el MPD
  señalizado: hay que correr `empaquetar-dash.sh` ahí, o copiarlo, antes de esa subida.
- **Para David** (notas al final del texto de T-09): la pregunta 5 (un MPD por clase), la 7
  (`ad-id-signaling` en Code 8, 9 y 13), y **el bug de dash.js 5.2.1 con el CDATA**, que pega en todos
  los ejemplos de 6.1. Vale reportarlo también a dash.js upstream.
- **El camino de `sgai-for-mpeg-dash`**, la segunda opción, queda para su propia fase.
- Dos `idea` sembradas en `roadmap/`: `uris-relativos-de-las-listas` y `verificar-pares-nativo`.

## 5. Riesgos que se materializaron

- **dash.js no entrega lo que el diseño leía del evento** (cuerpo CDATA, atributos del Replace): se
  materializó en T-01. El repuesto que el diseño nombraba (el interceptor) lo resolvió, ADR 0128.
- **El origen del fMP4**: se materializó dos veces. Un `@presentationTimeOffset` de 1,4 s corría el
  programa DASH 1,4 s; `-copyts` solo dejaba un "gap" de 1,4667 s que dash.js salta al arrancar cada
  creativo. Medido con cuadros y con el `currentTime` de los creativos; arreglado en el empaquetado.
- **Subir a `lib/` cambió el dist HLS** más que en orden y comentarios: el renombre y `attachAsset`.
  Mitigado con evidencia propia para cada uno; el comparador solo no alcanzaba a probarlo.
- No se materializaron: slots no contiguos (rechazados con error, test), varios `MediaPlayer` a la vez (anduvieron en
  todas las corridas de T-07 y T-08; no se midió CPU).

## 6. Recomendaciones

- Antes del push, decidir si la publicación de `stage-pair` va con su contenido DASH en el mismo
  momento; si no, su CI queda en rojo.
- El texto de T-09 se escribió contra el borrador del 2026-10-02 y contra el texto vigente que citan
  los ADR 0104-0113: conviene contrastarlo con el `.docx` actual antes de mandárselo a David.
- Arreglar `verificar-pares-nativo` antes de volver a usar esa parte como testigo.

## 7. Correcciones post-ejecución

`grep -n "post-ejecuci" TASKS.md`: tres, en T-02, T-06 y T-10.

- **T-02 y T-10**: la definición de done pedía el comparador verde contra `bb0d78b`, y no podía darlo
  con lo que el diseño pedía mover (el nombre cruzaba la costura 0003; las ramas de `attachAsset` no
  suben sin tocarlo). Es una señal sobre cómo se escribió la definición, no sobre la ejecución:
  nombré como referencia un instrumento sin verificar que pudiera dar verde para ese cambio.
- **T-06**: el corrimiento de los creativos lo encontró la captura de T-07, no la verificación de
  T-06, que comparó cuadros del programa y de un creativo después de un seek, nunca arrancando. La
  medición de T-06 tenía un punto ciego exactamente donde estaba el error.

## 8. Revisión de la documentación

- **`description` de `PHASE.md`**: reescrita como lo que la fase resultó.
- **`docs/arc42/`**: el proyecto no tiene; nada que corregir.
- **`docs/`**: `integrating-the-library.md` (un párrafo sobre el build DASH y sus dos diferencias),
  `contrato-senalizacion-renderizado.md` (`dash/media.js` junto a `hls/media.js`), y el nuevo
  `svta2053-dash-concurrent-presentation.md`.
- **`README.md`**: DASH en la intro, la tabla de qué está dónde con `lib/` nuevo y `dash/`, el
  snippet sobre dash.js, y qué lee `test/`.
- **`dash/README.md`**: reescrito; ya no dice que no hay código.
- **`CLAUDE.md` del proyecto**: `dash/*.js` en la tabla, y cómo se publica el lado DASH de
  `stage-pair`.
- **`demo/stage-pair/README.md`**: el modo DASH en la tabla de páginas, y el paso `empaquetar-dash.sh`.
- **`.project/knowledge/`**: no existe en el proyecto.
- **`CLAUDE.md` y `knowledge/` del repo padre**: nada; la fase no cambió nada que valga para todo el
  repo.
- **Runbook de instalación**: no hay uno aparte; el paso nuevo está en el README de `stage-pair`.
- **Registro**: `tasks/README.md` marca la carpeta de la fase como registro.
