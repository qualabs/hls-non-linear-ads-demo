# Tasks — fase 15-las-capacidades-como-ejes

| id | brief | status | plan | evidence |
| --- | --- | --- | --- | --- |
| T-01 | `lib/`: `capabilities`, los parámetros de R29.1 y el paso `selectOption`, con sus tests | done | — | `lib/{signalling,concurrent-hls}.js` · `test/capability-options.test.js` (12 pruebas; suite 216 → 228) · campaña de 8 mutaciones, las 8 en rojo |
| T-02 | La señalización: un asset-list estático por break con todas las opciones, una playlist, C sin default | pending | — | — |
| T-03 | Las páginas: el control de dos ejes, y el panel del filtro en `inspect.html` | pending | — | — |
| T-04 | La verificación: capturas de las cuatro combinaciones, los pedidos, y los scripts de medición al día | pending | — | — |
| T-05 | El README de la demo con el ejemplo de API, y el documento del integrador | pending | — | — |

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
  igual para cualquier capacidad, y hay una sola playlist señalizada. A y B tienen default
  lineal; C no tiene `URI` ni tag lineal.
- **What it must cover:** `demo/stage-pair/scripts/escribir-asset-lists.mjs`,
  `scripts/senalizar-contenido.sh`, `stage.json` (`breaks`, `playlists`, `decodificadores`),
  `test/signalled-run.test.js`. ADR 0087. Depende de T-01 para el formato.
- **Definition of done:** los asset-lists escritos pasan los tests de la demo; la playlist tiene
  dos tags en A y B y uno en C.
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
- **What it must cover:** capturas reales de las cuatro combinaciones en A (con default) y en C
  (sin default); el pedido con sus parámetros; el cuerpo idéntico; los `<video>` vivos contados.
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
