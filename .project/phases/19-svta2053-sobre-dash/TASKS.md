# Tasks — fase 19-svta2053-sobre-dash

| id | brief | status | who | plan | evidence |
| --- | --- | --- | --- | --- | --- |
| T-01 | Los riesgos medidos: el evento del MPD, el creativo que no carga, el Replace | done | agent | — | [`tasks/T-01/`](tasks/T-01/) · ADR 0128 |
| T-02 | Lo común de `hls/` sube a `lib/` | done | agent | — | rama `fase-19` · [`tasks/T-02/`](tasks/T-02/) |
| T-03 | `dash/signalling.js` | done | agent | — | rama `fase-19` · [`tasks/T-03/`](tasks/T-03/) |
| T-04 | Los tests de `dash/signalling.js`, vistos fallar | done | agent | — | rama `fase-19` · [`tasks/T-04/`](tasks/T-04/) |
| T-05 | `dash/media.js`, `dash/concurrent-dash.js`, el dist DASH y las costuras | done | agent | — | rama `fase-19` · [`tasks/T-05/`](tasks/T-05/) |
| T-06 | El contenido DASH de `stage-pair` | done | agent | — | rama `fase-19` · [`tasks/T-06/`](tasks/T-06/) |
| T-07 | `stage-pair`: "DASH, nuestra librería" en cada pane | done | agent | — | rama `fase-19` · [`tasks/T-07/`](tasks/T-07/) |
| T-08 | `verificar-pares.py`: HLS contra DASH, con sus dos controles | planned | agent | — | — |
| T-09 | El texto para SVTA2053: la 6.7 y los ajustes de §1, §4.1 y §5 | planned | agent | — | — |
| T-10 | La documentación, la verificación final y el merge a main local | planned | agent | — | — |

---

## T-01 — Los riesgos medidos: el evento del MPD, el creativo que no carga, el Replace

- **Objective:** se sabe, medido en dash.js 5.2.1 y no leído en su código, (a) en qué momento
  entrega `onReceive` los eventos del EventStream de un MPD `static` de un Period (todos al cargar, o
  a medida que avanza el playhead), (b) qué evento o error de dash.js dice que un MPD de creativo no
  cargó, con un 404 en el MPD y con un 404 en el primer segmento, y en cuánto tiempo, y (c) si los
  atributos de un `ReplacePresentation` (`@uri`, `@maxDuration`, `@executeOnce`) se leen desde el
  evento que llega. Con eso se decide si el diseño sirve.
- **What it must cover:** ADR 0120, 0125 y el riesgo de `hls/media.js` `attachAsset` (`onLoaded` /
  `onFailed`, ADR 0107). `vendor/dash.all.min.js` 5.2.1 del tarball de npm con su `LICENSE` (queda:
  es el vendor de la fase). Una página de prueba que no se publica, en `tasks/T-01/`, servida por un
  server propio en un puerto que no sea 8080-8082 y apagado por su PID; Chrome headless por
  Playwright. Un MPD de fixture con tres eventos (en 0, en 45 s, en 120 s) y uno de Replace. Si (a)
  no es al cargar, medir el repuesto: leer el EventStream en `addResponseInterceptor`. Sin
  dependencias.
- **Definition of done:** en `tasks/T-01/README.md`, por cada pregunta, el veredicto con la salida
  de la corrida pegada (timestamps de llegada de cada evento contra `currentTime`; el evento de error
  y su latencia en los dos 404; los atributos leídos o la ruta que no llega), y una línea que diga si
  el diseño sigue o qué cambia. Si alguno lo invalida, la fase se frena y se avisa.
- **nivel de verificación:** mínimo. Es una medición que decide si se sigue; se lee antes de que
  nada dependa de ella.

## T-02 — Lo común de `hls/` sube a `lib/`

- **Objective:** lo que leen la lista y el modelo de un corte, y no el transporte, está en `lib/`,
  donde DASH lo importa, y el dist de HLS que sale de ahí es el de antes salvo orden y comentarios.
- **What it must cover:** ADR 0116, 0117, 0118 y `dash/README.md`. De `hls/signalling.js`: `BLOCK`,
  `usableUri`, `resolveAssetList`, `pendingFirstRequests`, `resolveWithFirstRequests`,
  `resolvePostRoll`, `assetListUrl` y sus dos parámetros, `onceProgress`, `postRollDue`,
  `bufferedEndAt`. De `hls/media.js`: `firstRequest`, `FIRST_REQUEST_TIMEOUT_MS` y las ramas de
  imagen y MP4 progresivo de `attachAsset`. Dónde va cada uno en `lib/` (archivo existente o nuevo)
  lo decide la task con el criterio del ADR 0117. Se mueve por declaración entera; los comentarios
  se reescriben sin vocabulario HLS; la costura 0003 tiene que seguir verde sin aceptar líneas
  nuevas. Un commit por grupo (`signalling`, `media`). Constraint: nada de `demo/` salvo imports de
  sus tests. Depende de T-01 (sólo para saber que el diseño sigue).
- **Definition of done:** en cada commit, `npm test` con el mismo número de tests que en `bb0d78b`
  y verde, `npm run check` verde, y `comparar-publicacion.mjs bb0d78b HEAD` verde en las cinco demos;
  el dist evaluado en node define `QualabsConcurrentHls` con las mismas claves.
- **nivel de verificación:** alto. Es el código de las cinco demos públicas; la referencia
  independiente es `bb0d78b` a través del comparador, que ya se vio fallar en la fase 18.
- **post-ejecución:** 2026-10-26, la definición de done pedía `comparar-publicacion.mjs bb0d78b
  HEAD` verde, y no puede darlo: `resolveAssetList` y `assetListUrl` cruzaban la costura 0003 por el
  nombre y se renombraron (commit propio, reproducido por sed), y subir las ramas de `attachAsset`
  cambia `attachAsset`. Cada commit con su testigo en `tasks/T-02/README.md`.

## T-03 — `dash/signalling.js`

- **Objective:** un MPD con el esquema de SVTA se convierte en el contrato del ADR 0003, igual que
  lo hace `hls/signalling.js` con una playlist: cada corte con su rango, su lista resuelta con los
  `sgai-*`, su `cue` aplicada, y el Replace como experiencia lineal que gana.
- **What it must cover:** ADR 0003, 0104-0115, 0120-0126. Funciones puras separadas del cableado con
  dash.js: Event a rango (`presentationTime`, `timescale`, `presentationTimeOffset`, fin del Period);
  el sobre v2 `pod` (slots adentro o en `$remote.slots`, `features.remoteFields`); descarte de los
  sobres sin `features.concurrentPresentation` (ADR 0121); la conversión de slots a la forma de
  `resolveAssetList` (un asset por Slot, `URI` de `Slot.media`, `DURATION` de `Slot.duration`), que
  rechaza slots no contiguos con un error; `cue` (ADR 0123); la regla del pedido a 60 s (ADR 0124);
  el Replace (ADR 0125), por la ruta que T-01 haya medido. Suscripción con `onReceive` (o el repuesto
  de T-01). Cuerpo leído al recibirlo. Cabecera que explique el porqué, como las de `hls/`. Depende
  de T-01 y T-02.
- **Definition of done:** el módulo importa de `lib/` y no de `hls/`; las funciones puras se pueden
  llamar desde node sin dash.js; T-04 verde.
- **nivel de verificación:** alto. Decide qué se dibuja y cuándo, corre sin nadie mirando, y un
  error de tiempo no se ve hasta que se compara con HLS. Sus tests son T-04.

## T-04 — Los tests de `dash/signalling.js`, vistos fallar

- **Objective:** cada regla de `dash/signalling.js` tiene un test que la defiende, y cada test se
  vio fallar rompiendo lo que mide.
- **What it must cover:** `node --test` con MPD y sobres de fixture en `test/fixtures/dash/`: Event
  a rango con `timescale` distinto de 1 y con `presentationTimeOffset`; evento que termina en el fin
  del Period; sobre con slots adentro y remotos; sobre sin el flag descartado; la conversión, incluido
  el rechazo de slots no contiguos; `cue` PRE, POST y ONCE; el pedido en 60 s exactos, a 60,001 s y
  al entrar por un seek; el Replace. Campaña de mutaciones: una ruptura por regla, corriendo sólo los
  tests de esa regla. Depende de T-03.
- **Definition of done:** `npm test` verde; la tabla de mutaciones en `tasks/T-04/` con cada
  ruptura en rojo; un caso calculado a mano (un `presentationTime` con `timescale` y
  `presentationTimeOffset` a segundos de programa) con sus números.
- **nivel de verificación:** alto. Es el instrumento de T-03.

## T-05 — `dash/media.js`, `dash/concurrent-dash.js`, el dist DASH y las costuras

- **Objective:** `attach(player, {...})` sobre un `MediaPlayer` de dash.js dibuja las experiencias
  con las mismas opciones que el de HLS, los creativos MPD cargan con su `onLoaded`/`onFailed`, y el
  build, el check y la publicación conocen `dash/`.
- **What it must cover:** ADR 0015, 0107, 0116, 0119 y `dash/README.md`. `dash/media.js`:
  `attachAsset` para `application/dash+xml` con un `MediaPlayer` por elemento y la detección de
  fallo que midió T-01; imagen y MP4 desde `lib/`. `dash/concurrent-dash.js` con la misma firma que
  `hls/concurrent-hls.js`. `scripts/construir-libreria.sh` arma también
  `dist/qualabs-concurrent-dash.js` sin cambiar el de HLS. `scripts/verificar-cortes.mjs`: `dash/*.js`
  en la costura 0015. `scripts/demos-cambiadas.sh`: `dash/` publica las demos que lo usan.
  `scripts/publicar.sh`: `dash` en el `git archive`. `package.json` (`files`). Cabeceras. Depende de
  T-03.
- **Definition of done:** `npm run check` verde, y rojo con `demo` plantado en `dash/media.js`
  (revertido); el dist DASH evaluado en un browser define su global; el dist HLS idéntico al de T-02
  salvo lo que admite el ADR 0118; `demos-cambiadas.sh` para un commit que sólo toca `dash/` lista
  `stage-pair` y nada más.
- **nivel de verificación:** alto. El check y la publicación corren en CI sin nadie mirando.

## T-06 — El contenido DASH de `stage-pair`

- **Objective:** `stage-pair` tiene el mismo programa en fMP4 con su MPD señalizado con el esquema
  de SVTA, los creativos de video como MPD, y un sobre `slot` por break con los mismos slots que su
  ASSET-LIST, todo regenerable con los scripts de la demo.
- **What it must cover:** ADR 0096, 0120-0125, 0127. `ffmpeg` (no hay `MP4Box` ni
  `shaka-packager`). Primario y creativos desde las mismas fuentes que el HLS; el origen del MPD
  medido contra el 0,067 s del HLS (ADR 0109) y escrito donde T-08 lo lea.
  `escribir-asset-lists.mjs` escribe además los sobres `slot` desde `stage.json`, con las mismas
  gemelas PNG y MP4. El MPD señalizado con un Event por break (pre, A, B, C, post, con su `cue`) y
  el Replace del LINEAR. Constraint: los ASSET-LIST y las playlists de HLS quedan byte a byte iguales;
  `content/` no está en git. Depende de T-01.
- **Definition of done:** los scripts corren de cero; `cmp` de cada ASSET-LIST y playlist HLS contra
  los de antes da iguales; cada sobre `slot` tiene los mismos URIs de gemelas que su ASSET-LIST
  (chequeado por script, y visto fallar con uno cambiado); el MPD carga en dash.js y reproduce.
- **nivel de verificación:** alto. Escribe los archivos que lee la demo HLS publicada, y una
  diferencia en un ASSET-LIST no se ve en pantalla.
- **post-ejecución:** 2026-10-26, la captura de T-07 mostró los creativos DASH 1,47 s adelantados
  (dash.js salta el gap de 1,4667 s que deja `-copyts`); `empaquetar-dash.sh` pasa a
  `-output_ts_offset -1.4` y la diferencia queda en 0,07-0,1 s (`tasks/T-07/README.md`).

## T-07 — `stage-pair`: "DASH, nuestra librería" en cada pane

- **Objective:** en `stage-pair` cada pane elige "HLS nativo", "nuestra librería" o "DASH, nuestra
  librería", y con un pane HLS y otro DASH se ve el mismo programa con los mismos breaks.
- **What it must cover:** ADR 0127; el selector de modo de la fase 15 en `demo/stage-pair/js/app.js`
  y su `?izq=`/`?der=`. Los dos modos HLS hacen exactamente lo de antes. Las 18 líneas viejas de
  `demo/` que listó el REPORT de la fase 18. Server propio fuera de 8080-8082. Depende de T-05 y T-06.
- **Definition of done:** capturas a tamaño real de: un pane HLS y uno DASH en un break concurrente,
  en el LINEAR, y el pre-roll; las 18 líneas corregidas (`git grep` vacío, y sobre `bb0d78b`
  encuentra las 18).
- **nivel de verificación:** bajo. Es interfaz; la igualdad de comportamiento la prueba T-08.

## T-08 — `verificar-pares.py`: HLS contra DASH, con sus dos controles

- **Objective:** está medido que un pane HLS y uno DASH con las mismas capacidades presentan la
  misma opción en el mismo segundo de programa en cada break, piden su lista con los mismos `sgai-*`,
  caen igual ante un asset que no carga, y que B (ONCE) no vuelve tras un seek.
- **What it must cover:** `demo/stage-pair/test/verificar-pares.py` extendido, sin cambiar lo que
  hoy mide entre panes HLS. Comparación de `presentedAt` descontando el origen medido en T-06.
  **Controles**: dos panes DASH con capacidades distintas dan composiciones distintas en B; un 404
  plantado en el MPD de un creativo hace que el pane DASH pase a la opción siguiente y el HLS no.
  Depende de T-07.
- **Definition of done:** la salida en `tasks/T-08/`: verde en cada combinación de capacidades, y
  rojo en los dos controles.
- **nivel de verificación:** alto. Es la prueba de lo que la fase afirma.

## T-09 — El texto para SVTA2053: la 6.7 y los ajustes de §1, §4.1 y §5

- **Objective:** David puede leer, como la próxima edición los llevaría, los cambios que la carriage
  DASH de la presentación concurrente le pide a SVTA2053 v3, con el estilo de 6.6, y lo que la
  implementación de referencia de 7.2 hace de cada sección.
- **What it must cover:** ADR 0120-0126; el esquema de la 6.7 del diseño (6.7.1 a 6.7.8), Abstract,
  Versioning, §1, 4.1, 5.2.2.1 (Table 18), 5.2.2.2.2, 5.3.1, 5.3.3, la 7.2 y los anexos de §10. En
  inglés, en `docs/svta2053-dash-concurrent-presentation.md`. Fuentes: el borrador
  `sandbox/sgai/2026-10-02-svta-doc-update/borrador.md` del repo padre y la norma 23009-1 en
  `pdftotext`. Las preguntas abiertas 5 y 7 del diseño como notas para David. Constraint: no se toca
  el `.docx` de Drive. Depende de T-08 (la 7.2 dice lo que la implementación hace, medido).
- **Definition of done:** cada cita de sección o tabla de SVTA2053 o de 23009-1 contrastada contra
  la fuente con un `grep` cuyo resultado queda en `tasks/T-09/`; la 7.2 coincide con lo que T-08
  midió.
- **nivel de verificación:** mínimo. Lo lee David antes de que nada dependa de él; las citas son la
  parte que se chequea.

## T-10 — La documentación, la verificación final y el merge a main local

- **Objective:** quien abre el repo sabe usar `dash/`, está probado que las demos HLS hacen lo mismo
  que en `bb0d78b`, y la rama está en main local.
- **What it must cover:** `knowledge/documentation-policy.md` del repo padre. `README.md`,
  `dash/README.md` (deja de decir que no hay código), `docs/integrating-the-library.md`,
  `docs/contrato-senalizacion-renderizado.md`, `demo/stage-pair/README.md`, el `CLAUDE.md` del
  proyecto. Desde el worktree: `npm test`, `npm run check`, `scripts/publicar.sh --all` en seco y
  `comparar-publicacion.mjs bb0d78b`, cada salida comparada con la de `bb0d78b`. Merge `--no-ff` a
  main local, sin push; el `dist/` de main no se reconstruye. Depende de T-01 a T-09.
- **Definition of done:** las salidas en `tasks/T-10/` con la comparación escrita; las cuatro demos
  que no son `stage-pair` sólo con los cambios del ADR 0118; main local con el merge; `git status`
  limpio.
- **nivel de verificación:** alto. Es la prueba de la regla dura de la fase.
