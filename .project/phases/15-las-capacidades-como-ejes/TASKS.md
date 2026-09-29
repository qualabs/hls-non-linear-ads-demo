# Tasks — fase 15-las-capacidades-como-ejes

| id | brief | status | plan | evidence |
| --- | --- | --- | --- | --- |
| T-01 | `lib/`: `capabilities`, los parámetros de R29.1 y el paso `selectOption`, con sus tests | done | — | `lib/{signalling,concurrent-hls}.js` · `test/capability-options.test.js` (12 pruebas; suite 216 → 228) · campaña de 8 mutaciones, las 8 en rojo |
| T-02 | La señalización: un asset-list estático por break con todas las opciones, una playlist, A sin default | done | — | `demo/stage-pair/{stage.json,scripts/escribir-asset-lists.mjs,scripts/senalizar-contenido.sh,signalling/}` · `test/signalled-run.test.js` (sección del par reescrita; suite 228 → 229) |
| T-03 | Las páginas: el control de dos ejes, y el panel del filtro en `inspect.html` | done | — | `demo/stage-pair/{index.html,inspect.html,js/app.js,js/inspect.js,js/capabilities.js,css/player.css}` · capturas en `tasks/T-04/` |
| T-04 | La verificación: capturas de las cuatro combinaciones, los pedidos, y los scripts de medición al día | done | — | [`tasks/T-04/README.md`](tasks/T-04/README.md) · `demo/stage-pair/test/{verificar-capacidades.py,medir-tramo-en-el-par.py (ex medir-escalera.py),verificar-inspect.py,medir-tramo-invertido.py,medir-enlace-de-barras.py,banco-de-medicion.html}` |
| T-05 | El README de la demo con el ejemplo de API, y el documento del integrador | done | — | `demo/stage-pair/README.md` ("The API, as it goes on a slide") · `docs/integrating-the-library.md` §6 · `docs/contrato-senalizacion-renderizado.md` (qué cuenta como no dibujable) · `README.md` de la raíz |
| T-06 | `npm run check` construye la librería, y un build roto da rojo | done | — | `scripts/verificar-build.sh` · `package.json` · [`tasks/T-06/`](tasks/T-06/) (verde, y rojo con el import partido) |
| T-07 | La publicación en `qualabs-hls-demo-stage-pair`, verificada sin credenciales | done | — | [`tasks/T-07/README.md`](tasks/T-07/README.md) · publicada el 2026-09-28 |
| T-08 | La opción de imagen, quieta y en otro layout (feedback de Nicolás sobre la publicación) | done | — | [`tasks/T-08/`](tasks/T-08/) · `scripts/congelar-svg.py` · tres `graphics/campaigns/*-fijo.svg` · ADR 0088 |
| T-09 | Las opciones de video, con movimiento grande (feedback de Nicolás) | done | — | [`tasks/T-09/`](tasks/T-09/) · los tres SVG · `test/medir-movimiento.py` · `scripts/{puente-a-video.sh (SOLO),empaquetar-creativo.sh (-sc_threshold 0),verificar-creativo.sh}` |

---

## T-01 — `lib/`: `capabilities` y `selectOption`
- **Objective:** la librería recibe `capabilities: { videoDecoders, imageOverVideo }`, las manda
  en el pedido del asset-list como `sgai-video-decoders` y `sgai-image-over-video`, y antes de
  dibujar elige la primera opción que esa capacidad satisface. Sin opción, el asset cae al
  camino del ADR 0019 / D.5 que ya existe.
- **What it must cover:** `lib/signalling.js` (`usableDecoderCount`, `assetListUrl`,
  `usablePayload`, `resolveAssetList`, `createSignalling`) y `lib/concurrent-hls.js` (`attach`).
  Un ítem sin `options` se comporta exactamente como hoy. Sin `capabilities` no se filtra. ADRs
  0085 y 0086. No tocar el renderizador.
- **Definition of done:** tests nuevos en verde que cubren: cada una de las cuatro combinaciones
  contra `[video, imagen]`, el ítem sin `options`, la ausencia de capacidad, un valor inválido,
  y el asset con y sin `URI` cuando no queda opción. La suite entera ≥ 216 y sin nombres perdidos.
- **nivel de verificación:** alto. Corre sin nadie mirando en todas las demos y decide qué aviso
  se dibuja; una rotura mutada por regla del filtro tiene que poner rojo su test.

## T-02 — La señalización estática
- **Objective:** cada break tiene **un** asset-list concurrente con `options: [video, imagen]`,
  igual para cualquier capacidad, y hay una sola playlist señalizada. B y C tienen default
  lineal; A no tiene `URI` ni tag lineal.
- **What it must cover:** `demo/stage-pair/scripts/escribir-asset-lists.mjs`,
  `scripts/senalizar-contenido.sh`, `stage.json` (`breaks`, `playlists`, `decodificadores`),
  `test/signalled-run.test.js`. ADR 0087. Depende de T-01 para el formato.
- **Definition of done:** los asset-lists escritos pasan los tests de la demo; la playlist tiene
  un tag en A y dos en B y en C.
- **nivel de verificación:** bajo. Lo que produce se ve en pantalla y en el network tab.

## T-03 — Las páginas
- **Objective:** `inspect.html` e `index.html` tienen dos controles —decodificadores 1|2,
  imágenes on|off— y `inspect.html` muestra el filtro: las opciones recibidas, cada descarte con
  una frase que se pueda decir en voz alta, y el resultado (opción, lineal o salteo).
- **What it must cover:** `js/inspect.js`, `js/app.js`, los dos HTML, `css/player.css`. Depende
  de T-01 y T-02.
- **Definition of done:** capturas a 1907 y a 400 de cada estado.
- **nivel de verificación:** bajo.

## T-04 — La verificación
- **Objective:** está probado, con el pedido y el JSON leídos del navegador, que el APS devuelve
  lo mismo en las cuatro combinaciones y que la composición cambia: video, imagen, lineal o salteo.
- **What it must cover:** capturas reales de las cuatro combinaciones en A (sin default) y en B
  (con default); el pedido con sus parámetros; el cuerpo idéntico; los `<video>` vivos contados.
  Actualizar `test/medir-escalera.py`, `test/verificar-inspect.py`, `test/medir-tramo-invertido.py`
  y `test/banco-de-medicion.html` al modelo nuevo. Puerto propio, bajado por PID.
- **Definition of done:** evidencia en `tasks/T-04/` con las capturas y la salida verbatim.
- **nivel de verificación:** bajo.

## T-05 — La documentación
- **Objective:** el README de la demo tiene el ejemplo de API que David muestra, y
  `docs/integrating-the-library.md` documenta `capabilities` en lugar de `decoderCount`.
- **What it must cover:** `demo/stage-pair/README.md`, `docs/integrating-the-library.md`, el
  `README.md` de la raíz donde nombra `decoderCount`.
- **Definition of done:** ningún `decoderCount` ni `qa-decoder-count` vivo fuera de `.project/`,
  buscado con grep y con el control de que el grep encuentra algo que sí está.
- **nivel de verificación:** mínimo.

## T-06 — El build de la librería en `npm run check`
- **Objective:** un cambio que rompe el armado de `lib/` en el global pone rojo `npm run check`.
- **What it must cover:** `scripts/verificar-build.sh` construye en una carpeta descartable y no en
  `dist/`, que es lo que sirven las demos corriendo. `construir-libreria.sh` acepta `SALIDA`.
- **Definition of done:** check verde en el árbol; rojo con un `import` partido en tres líneas, por
  el `SyntaxError` del build y con las costuras en verde; verde de nuevo al restaurar; `dist/` sin tocar.
- **nivel de verificación:** bajo. Es un chequeo, y su control es verlo fallar.

## T-07 — La publicación
- **Objective:** el bucket sirve byte a byte lo que se probó, y se verifica sin credenciales.
- **What it must cover:** el camino del `CLAUDE.md` del proyecto: `dist/` reconstruido, `signalling/`
  y `dist/` nuevos, los asset-lists `*-rica`, `*-magra` y `linear-a` borrados, `.ts` con su
  content type, `-x` anclado, sin `content/.fuentes/`. Autorizado por Nicolás el 2026-09-28.
- **Definition of done:** las cuatro combinaciones en la URL pública, los asset-lists viejos en 404,
  el bucket sin listar, y los md5 comparados con un conteo que no puede ser cero.
- **nivel de verificación:** bajo.

## T-08 — La opción de imagen, quieta y en otro layout
- **Objective:** en las combinaciones con imagen se ve al toque que es una imagen y que es otra
  experiencia: nada se mueve en el aviso, y el layout es otro que el del video, de la misma campaña.
- **What it must cover:** `scripts/congelar-svg.py`, `stage.json` (`formaImagen`, `svgFijo`), el
  generador, `CREDITS.md`, los tests de la demo y `verificar-capacidades.py`. ADR 0088.
- **Definition of done:** la caja del `<img>` da igual en dos capturas separadas por 2 s, y el SVG
  animado en la misma caja da distinta; el layout de la experiencia es el de `formaImagen`.
- **nivel de verificación:** bajo.

## T-09 — Las opciones de video, con movimiento grande
- **Objective:** el video de cada break se nota video de lejos: el producto entra y sale de
  cuadro, los paneles entran y salen, el fondo cambia de color, todo el aviso.
- **What it must cover:** `zumbra-16x9`, `ketrava-backplate` y `kovrin-banner` (las opciones de
  video del par), la misma campaña, layout y duración; el mismo puente a video; `CREDITS.md`.
- **Definition of done:** el % de píxeles que cambian cada 0,5 s sube mucho contra el mismo
  número del video anterior; el formato del HLS (códec, resolución, fps, segmentos) es idéntico.
- **nivel de verificación:** bajo.
