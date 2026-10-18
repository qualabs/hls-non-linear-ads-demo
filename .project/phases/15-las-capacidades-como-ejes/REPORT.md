---
closed: 2026-10-16
---
# Informe de cierre — fase 15: las capacidades como ejes

Abierta el 2026-09-28 y cerrada el 2026-10-16. **Veintitrés tasks, las veintitrés `done`.** Las
siete del plan entraron el 2026-09-28; las otras dieciséis son pedidos de Nicolás y de David
Hassoun sobre la demo publicada, hasta la grabación (2026-09-30) y una después (T-23, 2026-10-04).

## 1. Resumen

En `demo/stage-pair/` el dispositivo declara su capacidad en **dos ejes** (decodificadores de
video `1`|`2`, imágenes sobre video sí|no), el asset-list que vuelve es **el mismo en las cuatro
combinaciones** con todas las opciones del aviso, y **la librería filtra** con un paso explícito
(`selectOption` en `lib/signalling.js`) antes de dibujar. Sin opción que se pueda mostrar, el
break con default cae al lineal y el que no tiene default se saltea. Es lo que pide R5.6: el APS
devuelve todo y el Player elige.

El filtro entró a `lib/`, que la fase 14 no tocaba, así que el criterio fue el de no-regresión
contra la línea de base del 2026-09-28 (`npm test` 216/216, `npm run check` verde). Al cerrar,
sobre `4aae541` más el `CLAUDE.md` de este cierre:

```
$ npm test 2>&1 | tail -6
ℹ pass 246
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 28624.690976
$ npm run check >/dev/null 2>&1; echo "check exit $?"
check exit 0
```

`npm run check` además construye la librería desde la T-06, porque la T-03 encontró un build roto
que la suite y las costuras daban en verde.

Después del plan, la fase absorbió el trabajo de dejar la demo lista para la grabación: la
imagen quieta y en otro layout para que se distinga del video (T-08), video con movimiento grande
(T-09), caché resuelta por contenido en la ruta y `publicar.sh` (T-10), un control por player
con la combinación en la URL (T-11, T-13), el primario por encima de lo que no se le superpone
(T-12, en `lib/renderer.js`), un manifest por clase de cliente sobre un mismo asset-list (T-14),
el layout a 1920×1080 (T-15 a T-18), el break sin default salteado también por el player de
fábrica y sin marca en su barra (T-19 a T-22), y el AdIdentifier del Slot hasta el tracking (T-23).

## 2. Decisiones tomadas

Con `scope: phase-15`:

- **0087** — un break con default lineal y otro sin. `superseded` por el 0091.
- **0092** — la barra del player nativo no marca el break que saltea.

De alcance de proyecto, tomadas en la ventana de la fase:

- **0085** — el APS devuelve todas las opciones y el Player filtra (supersede al 0083, de la fase 14).
- **0086** — la capacidad se declara en ejes y viaja con los nombres de la spec (`sgai-video-decoders`, `sgai-image-over-video`).
- **0088** — la opción de imagen es quieta y va en otro layout (supersede al 0084).
- **0089** — el contenido primario se dibuja encima de lo que no se le superpone.
- **0090** — un asset-list, dos clientes; un manifest por clase (supersede al 0007).
- **0091** — el break sin default también lleva su tag de Apple y el player de fábrica lo saltea.
- **0093** — el AdIdentifier del Slot pasa por el contrato y sale en `slotStart`/`slotEnd`.

## 3. Tasks

| id | resultado |
| --- | --- |
| T-01 | `capabilities` en `attach`, los parámetros de R29.1 y `selectOption`; 8 mutaciones, 8 rojas |
| T-02 | un asset-list por break con `options: [video, imagen]`, una playlist; el sin default es A, no C |
| T-03 | el control de dos ejes y el panel "What the library kept" en `inspect.html` |
| T-04 | las cuatro combinaciones medidas en las dos páginas; mediciones de la fase 14 al día |
| T-05 | README de la demo con el ejemplo de API, `integrating-the-library.md` y el contrato |
| T-06 | `npm run check` construye la librería; rojo con un `import` partido |
| T-07 | publicada en `qualabs-hls-demo-stage-pair`, 494 = 494 objetos, verificada sin credenciales |
| T-08 a T-23 | los pedidos sobre la demo publicada del §1, cada uno con su control contra lo publicado antes |

Ninguna abandonada ni bloqueada.

## 4. Hilos abiertos

- **Lo publicado no tiene la T-23.** La T-23 se hizo sin publicar, y el bucket lo confirma: el
  `js/app.js` servido es igual al del repo (md5 `c5fd9ac1…`), pero
  `signalling/asset-list-break-a.json` tiene `identifiers` en el repo (1) y no en el bucket (0).
  Publicar es decisión de Nicolás.
- **Eager vs lazy asset-list resolution**, la pregunta de David del 2026-09-30: queda en
  `PROJECT.md`, "Preguntas abiertas para la solución real".
- **`lib/` sigue sin teardown**, como lo dejó medido la fase 14: cada rearmado del player (que
  esta fase multiplicó con los cambios de modo y los saltos) deja corriendo lo anterior.
- Una falla de `npm test` en la T-14 que no se reprodujo en cuatro corridas más, sin causa.
- El eje HTML de R29.1 y el cambio de capacidad en caliente quedaron fuera de alcance a propósito.

## 5. Riesgos que se materializaron

- **El cambio en `lib/` rompió algo que la suite no veía**: el build de la librería (T-03). Se
  arregló y se cerró la clase con la T-06.
- **Un defecto que sólo se ve desde el bucket**: los saltos esperaban un segundo a que el player
  estuviera listo, y servido desde GCS tarda más (hallazgo de la T-11, venía de la fase 14).
- **El comparador de md5 de la publicación dio "0 comparados"** igual que en la fase 14; esta vez
  lo atajó el conteo obligatorio (T-07) y quedó resuelto en `publicar.sh` (T-10).
- **El plan de un día se volvió una fase de una semana** por los pedidos de la grabación. No fue
  un error de estimación del plan: los pedidos llegaron después y se registraron como tasks.

## 6. Recomendaciones para la fase siguiente

- Antes de mostrar `stage-pair` otra vez, publicarla con `publicar.sh` para que incluya la T-23.
- Si la librería va a vivir fuera de la demo, el teardown es lo primero: es el único defecto
  medido de `lib/` que sigue abierto.

## 7. Correcciones post-ejecución

```
$ grep -n "post-ejecuci" TASKS.md
$ echo $?
1
```

Ninguna. El grep es válido como instrumento: sobre el `TASKS.md` de la fase 14 la misma búsqueda
encuentra líneas. Las correcciones de esta fase entraron como tasks nuevas (T-08 en adelante), no
como líneas sobre una task cerrada, porque cada una cambiaba lo que la demo muestra y no un detalle
de la task anterior.

## 8. Revisión de documentación

**La `description` de `PHASE.md`** — reescrita en este cierre como lo que la fase terminó siendo.

**`docs/arc42/`** — no existe y esta fase no lo crea, como las catorce anteriores: los dos
documentos de `docs/` cumplen ese papel.

**`docs/integrating-the-library.md`** — al día: documenta `capabilities` (T-05) y `onTracking`
con `identifiers` (T-23). Fuera de `.project/` no quedan menciones de `decoderCount` ni
`qa-decoder` en ningún `.md`.

**`docs/contrato-senalizacion-renderizado.md`** — actualizado por la T-05 (qué cuenta como no
dibujable) y la T-23 (`Experience.identifiers`).

**El `README.md` de la raíz** — la fila de `stage-pair` describe los dos ejes y el filtro (T-05).

**El `README.md` de la demo** — reescrito por la T-05, con "The API, as it goes on a slide".

**El `CLAUDE.md` del proyecto** — **corregido en este cierre**: decía que las demos publicadas eran
cuatro y faltaba la fila de `stage-pair`, que la fase 14 había reportado. Ahora dice cinco, con su
URL, verificada sin credenciales (`curl` da 200 y la página sirve el título de `stage-pair`). La
sección de publicación de `publicar.sh` la había agregado la T-10. Lo de los `.svg` que la fase 14
dejó pendiente ya está cubierto por "Every other type comes out right on its own".

**`.project/knowledge/`** — no existe; la fase no produjo material que informe a varias fases.

**El `CLAUDE.md` y el `knowledge/` del repo padre** — no se tocaron: la fase no cambió nada que
aplique fuera del proyecto.

**Runbook** — no hay uno separado; `publicar.sh` es el paso nuevo y está documentado en el
`CLAUDE.md` del proyecto.

**Las carpetas `tasks/` de esta fase** — son registro: prueban qué se midió en cada fecha y no se
reescriben. La de la T-07 describe una publicación que la T-10 reemplazó por `publicar.sh`; lo
vigente está en el `CLAUDE.md`.
