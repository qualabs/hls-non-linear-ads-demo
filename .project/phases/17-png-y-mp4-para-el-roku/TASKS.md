# Tasks — fase 17-png-y-mp4-para-el-roku

| id | brief | status | who | plan | evidence |
| --- | --- | --- | --- | --- | --- |
| T-01 | `scripts/progresivo.sh`: el MP4 y su `codecs` | done | agent | — | rama `fase-17` · [`tasks/T-01/`](tasks/T-01/) |
| T-02 | stage-pair: MP4, PNG, `stage.json` y cuatro opciones por break | in-progress | agent | — | — |
| T-03 | hydration-break: MP4, `options` y sus lectores | planned | agent | — | — |
| T-04 | `publicar.py`: `.mp4` sin caché, y la corrida en seco con contenido | planned | agent | — | — |
| T-05 | La web no cambia: la propiedad, la red y las suites | planned | agent | — | — |
| T-06 | El árbol local para `roku-ads-02` | planned | agent | — | — |
| T-07 | La publicación | planned | both | — | — |

---

## T-01 — `scripts/progresivo.sh`

- **Objective:** de cualquier HLS de creativo sale, con un comando, un MP4 VP9 perfil 0 de 8 bits,
  sin audio, de la duración entera del HLS, y el `codecs` RFC 6381 que ese archivo realmente tiene.
- **What it must cover:** `progresivo.sh <hls> <mp4> <ancho> <alto> <bitrate>`; parámetros y razones
  en ADR 0098; `codecs` leído del `vpcC` (ADR 0100), impreso en stdout para que lo anote quien llama.
  Falla si el archivo no es VP9, si trae audio, o si su duración difiere de la suma de `#EXTINF` en
  más de un cuadro. Temporales fuera del repo. Sin dependencias.
- **Definition of done:** los cinco MP4 de la fase salen con su `codecs` (`vp09.00.30.08` a
  960x540@30, `vp09.00.21.08` el banner, `vp09.00.11.08` la esquina, comparados contra la tabla de
  niveles de VP9 calculada a mano); el chequeo da rojo contra un MP4 H.264 y contra uno con audio.
- **nivel de verificación:** bajo. Lo que produce lo consume el Roku, que lo muestra en pantalla; la
  única lógica no visual es el parseo de `vpcC`, y ésa lleva su control en rojo.

## T-02 — stage-pair

- **Objective:** los asset-lists A, B y C ofrecen HLS, MP4, SVG y PNG, en ese orden, y todo lo que
  nombran existe.
- **What it must cover:** DESIGN §8 y ADR 0096, 0099, 0101. Empezar por `stage.json`
  (`assets.piezas`), `scripts/escribir-asset-lists.mjs`, `scripts/versionar-creativo.sh` (cómo se
  anota una ruta) y `scripts/capturar-svg.py` (`omit_background`). Un script de la demo hace los tres
  MP4 con T-01 y anota `mp4`/`mp4Codecs`; otro rasteriza los tres `-fijo.svg` a
  `graphics/campaigns/<pieza>-fijo.png` 1920x1080 RGBA y anota `pngFijo`; el chequeo del PNG al día
  con `pxdif.sh`. Los HLS no se re-empaquetan: sus hashes (`d8eabbdae4`, `8d140e0f2b`,
  `8e5914d854`) no cambian. Actualizar los tests que cuentan o indexan opciones
  (`test/signalled-run.test.js`, `test/verificar-capacidades.py`, `test/verificar-inspect*.py`), las
  cabeceras de los scripts tocados y `CREDITS.md` si `verificar-creditos.py` lo pide. La carrera no
  cambia. Depende de T-01.
- **Definition of done:** `git diff` de `signalling/asset-list-break-*.json` contra `main` muestra
  sólo las dos opciones nuevas por break, cada una igual a la de adelante salvo `type`, `uri` y
  `codecs` (comprobado por un test, que da rojo si se cambia un `viewport` de una gemela); el chequeo
  del PNG da rojo con un PNG alterado; `npm test` verde.
- **nivel de verificación:** alto. Cambia el asset-list publicado que leen la web, el player de
  fábrica y el Roku, y un error en el orden o en una gemela no se ve en la web hasta que alguien
  declara otra capacidad.

## T-03 — hydration-break

- **Objective:** la L y la esquina ofrecen HLS y MP4, y la demo entera —scripts, tests y página—
  lee el asset-list nuevo igual que el de hoy.
- **What it must cover:** DESIGN §7 y ADR 0102. Los MP4 con T-01, números en `plate.json`, a
  `content/adL/progressive.mp4` y `content/adOverlay/progressive.mp4`. El asset-list a mano: `start`,
  `duration` e `identifiers` en el sobre, `type` y `layout` en cada opción; el banner y el lineal no
  cambian. Los lectores: `scripts/creativos.sh`, `scripts/l-capas.sh`,
  `scripts/senalizar-contenido.sh`, `test/comprobaciones.js`, `test/signalled-run.test.js`,
  `js/senalizacion.js` (la tabla de campos gana `options` y `codecs` con su frase; `mediumOf` y las
  etiquetas de los pliegues leen la primera opción). Grep de `layout` en toda la demo para no dejar
  ninguno. Un chequeo del `codecs` contra el archivo. Depende de T-01.
- **Definition of done:** `senalizar-contenido.sh` escribe la misma playlist que en `main` (diff
  vacío salvo la hora de pared); `npm test` y `npm run mutaciones` verdes; las etiquetas de los
  pliegues de la página idénticas a `main` (texto leído del DOM) y la tabla de campos con las dos
  filas nuevas; una gemela con otro `viewport` da rojo.
- **nivel de verificación:** alto. Toca el código de una página pública y lo que la señalización
  escribe, y un lector que no se enteró devuelve `null` sin fallar.

## T-04 — La publicación, en seco

- **Objective:** `publicar.sh` publicaría las dos demos con su contenido nuevo, los MP4 con
  `no-cache`, y se sabe exactamente qué copiaría y qué borraría de cada bucket.
- **What it must cover:** `.mp4` en `MUTABLE` de `scripts/publicar.py` (ADR 0099) y su caso en el
  `selftest`; `scripts/publicar.sh --con-contenido stage-pair hydration-break` en seco desde el
  worktree; la lista de copias y borrados leída. El header de `publicar.sh` y el `CLAUDE.md` del
  proyecto dicen qué se sirve con `no-cache`: se actualizan. Depende de T-02 y T-03.
- **Definition of done:** la corrida en seco verde; sus copias son sólo los archivos nuevos y
  cambiados de la fase, y sus borrados, ninguno (o cada uno explicado); `--control` rojo.
- **nivel de verificación:** alto. Es lo que corre sin nadie mirando contra demos públicas.

## T-05 — La web no cambia

- **Objective:** está medido que la web elige y dibuja lo mismo que en `main`, con cualquier
  capacidad.
- **What it must cover:** ADR 0097. (1) La propiedad: para cada asset-list de las dos demos, y cada
  capacidad (2 dec con y sin imágenes, 1 dec con y sin imágenes, ninguna), `selectOption` del de la
  rama y del de `main` eligen la misma opción por contenido; control: un asset-list con la gemela
  antes que su original tiene que dar distinto. (2) La red: con la página de verdad en un navegador,
  en las cuatro combinaciones del control de stage-pair y en hydration-break, ningún pedido a un
  `.png` o `.mp4` de un creativo; control: el mismo conteo encuentra el `creative.png` del banner. (3)
  Las suites existentes enteras, en `main` y en la rama: `npm run check`, `npm test`,
  `npm run mutaciones`, y las verificaciones de navegador de stage-pair (`verificar-capacidades.py`,
  `verificar-pares.py`, `verificar-inspect.py`, `verificar-inspect-modos.py`). (4) Capturas de la
  ventana de cada break, por combinación, `main` contra rama, con `pxdif.sh`. Servidor propio en un
  puerto que no sea 8080-8082, apagado por su PID. Depende de T-02 y T-03.
- **Definition of done:** las cuatro mediciones con su evidencia en `tasks/T-05/`; cualquier
  diferencia de píxeles explicada o es un hallazgo que frena la publicación.
- **nivel de verificación:** alto. Es la premisa de la fase, y la web es lo público.

## T-06 — El árbol para el Roku

- **Objective:** `roku-ads-02` tiene, en esta máquina, el árbol que se publicaría de cada demo, y lo
  sirve desde la raíz de su host.
- **What it must cover:** el escenario de `publicar.sh` (HEAD de la rama, `dist/`, `vendor/`,
  `content/`), uno por demo, fuera del repo y con permisos que `roku-ads-02` lea; el path por el bus.
  Lo sirve el Roku, en su puerto. Depende de T-04.
- **Definition of done:** los dos paths enviados, y cada `uri` de sus asset-lists resuelto contra el
  árbol (el chequeo de referencias de `publicar.sh` sobre ese árbol, verde).
- **nivel de verificación:** mínimo. Lo consume otra sesión que lo prueba en el equipo.

## T-07 — La publicación

- **Objective:** las dos demos públicas ofrecen las opciones nuevas, y sus URLs responden sin
  credenciales.
- **What it must cover:** ADR 0103: merge a `main` local, `publicar.sh --publicar --con-contenido
  stage-pair hydration-break`, después el push. Depende de T-05 y T-06.
- **Definition of done:** cada `uri` nuevo responde 200 sin credenciales, con su tipo (`video/mp4`,
  `image/png`) y los MP4 con `Cache-Control: no-cache`; el run de Actions del push verde.
- **nivel de verificación:** alto. Escribe en demos públicas.
- **Needs from a person:** Nicolás da el OK para las dos salidas a internet (la subida de
  `content/` y el push a `main`), con la evidencia de T-04, T-05 y T-06 delante.
