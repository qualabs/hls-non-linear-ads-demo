# Diseño: el PNG y el MP4 de cada creativo, para el Roku

**Para qué.** El canal Roku (`projects/hls-non-linear-ads-roku`) tiene que funcionar con la URL de
las playlists publicadas y nada más. El Roku no dibuja SVG y no reproduce un segundo HLS, así que lo
publicado tiene que traer también formas que sí dibuja: PNG para Poster y MP4 progresivo VP9 para
AnimatedImage. El formato está fijado del lado del Roku, en
`hls-non-linear-ads-roku/.project/roadmap/todo-de-lo-publicado/DESIGN.md` §1 (commit `bab9afe`); acá
se decide cómo lo publica esta demo.

**Decidido por Nicolás (2026-10-22):** el PNG va además del SVG y la web sigue con su SVG; las
opciones nuevas van en la demo publicada, sin copia propia del Roku; la librería web, `needsOf`
incluido, no se toca.

## 1. El formato: una opción más por forma, distinguida por el `type` del elemento

Es el §1 del diseño del Roku, sin cambios. Después de cada opción con un elemento HLS va la misma
opción (mismo `type` de layout, misma caja, mismo `id`, mismo `zDepth`, mismo `volume`) con el
elemento como `"type": "video/mp4"` más `"codecs"` en la sintaxis de RFC 6381. Después de cada opción
quieta en SVG va la misma opción con el elemento como `image/png`. Entre una opción y su gemela
cambian sólo `type`, `uri` y, en el MP4, `codecs`.

| demo | breaks | opciones hoy | opciones después |
| --- | --- | --- | --- |
| stage-pair | A, B, C | HLS, SVG | HLS, MP4, SVG, PNG |
| hydration-break | L (`adL`), esquina (`adOverlay`) | el ítem solo, HLS | HLS, MP4 |
| hydration-break | banner | el ítem solo, PNG | sin cambios |
| hydration-break | lineal | sin bloque | sin cambios |
| race-multiview, multiview-offer, compatibility-pair, la carrera de stage-pair | — | — | fuera: el canal no las lee |

## 2. La web dibuja lo mismo, y se puede demostrar sin mirar

`needsOf` cuenta un decodificador por cada elemento que no es `image/*`. Para la librería, la opción
MP4 pide exactamente lo mismo que la HLS que tiene adelante, y la PNG lo mismo que la SVG que tiene
adelante. `selectOption` recorre en orden y se queda con la primera que la capacidad satisface, así
que **cada opción nueva sólo podría elegirse si la anterior también se pudiera, y la anterior gana
siempre**. Con cualquier capacidad declarada, o sin ninguna, la opción elegida es la misma de hoy;
cambia su índice. El player de fábrica no lee opciones (ADR 0090) y el `URI` de nivel superior no
cambia.

Es una propiedad y se verifica como tal: para cada asset-list nuevo contra el de `main`, para cada
combinación de capacidades (las cuatro del control de stage-pair, más "sin capacidad"), la opción
elegida es **la misma por contenido** (`type` de layout, `type` y `uri` de cada elemento), y el
navegador nunca pide un `.png` ni un `.mp4` de un creativo.

**Lo que sí se ve distinto es lo que las páginas cuentan del asset-list, porque el asset-list
cambió.** El inspector de stage-pair lista cuatro opciones por break en lugar de dos, y la traza dice
"option 3" donde decía "option 2" (la de imagen). La página de hydration-break, que muestra los
campos del asset-list con una frase por campo, gana las filas de `options` y `codecs`. Las páginas
muestran el asset-list tal cual llega; esconder las opciones nuevas sería que mientan sobre lo que
leen. El diseño del Roku ya lo da por consecuencia (§1, "lo que muestra el inspector de stage-pair").
Lo que se dibuja sobre el programa no cambia.

## 3. El MP4 sale del HLS publicado, no de los cuadros

El diseño del Roku sugiere sacarlo de los cuadros PNG con que se arma el HLS. Esos cuadros no se
guardan (`puente-a-video.sh` los borra al terminar cada pieza), así que eso es volver a capturar los
SVG y volver a empaquetar: el HLS saldría de nuevo, con otro hash si cambia un byte, y la web pasaría
a reproducir un archivo distinto del que hoy está probado. Transcodificando el HLS publicado, **el
HLS no se toca** (los mismos bytes en la misma URL) y el MP4 es ese mismo creativo, cuadro a cuadro.
Es además como el Roku hizo los suyos en su fase 01 (`build-assets.sh`), que están medidos en el
equipo.

Lo que se pierde es una generación de compresión: H.264 a 2500k pasa a VP9 a 500k con la mitad de la
resolución, y lo que se ve lo decide el bitrate de VP9.

| alternativa | por qué no |
| --- | --- |
| Desde los cuadros, recapturando | re-empaqueta el HLS que la web reproduce, y la premisa de la fase es que la web no cambie |
| Guardar los cuadros de la próxima captura | ~270 MB por pieza para ahorrar una generación de compresión en un MP4 de 500k |

**Parámetros**, los de `build-assets.sh` del Roku: VP9 perfil 0, 8 bits, sin audio, `-row-mt 1`;
960x540 a 500k el 16:9, el backplate y la L de hydration-break; el banner 1120x126 a 300k; la esquina
320x180 a 200k. **La duración es la del HLS entero** (12 s en stage-pair, 15,958 y 24 s en
hydration-break) y no el corte de 6 s de la fase 01 del Roku: en el Roku un MP4 que termina antes que
su ventana deja la caja quieta. `adL` dura 15,958 s contra un slot de 16, que es lo que ya dura su
HLS. El audio de `adL` y `adOverlay` no viaja: AnimatedImage no tiene audio.

Un script compartido, `scripts/progresivo.sh <hls> <mp4> <ancho> <alto> <bitrate>`, en la raíz del
repo porque lo usan las dos demos. Cada demo declara sus números donde declara los demás (ADR 0044):
stage-pair en `stage.json`, hydration-break en `plate.json`.

## 4. Dónde vive el MP4, y la caché

Al lado de su HLS, con nombre fijo `progressive.mp4`: en stage-pair adentro del directorio con hash
(`content/creatives/<pieza>/<hash>/progressive.mp4`), en hydration-break en
`content/adL/progressive.mp4` y `content/adOverlay/progressive.mp4`. El hash de stage-pair es el de
los segmentos del HLS; no cubre los parámetros del MP4, que pueden cambiar solos.

**Por eso `.mp4` pasa a la lista de lo que se sirve con `no-cache`** (`MUTABLE` de
`scripts/publicar.py`). Es la regla que el proyecto ya tiene: lo que tiene nombre fijo y puede
cambiar se sirve sin caché pública, porque el borde de Google sirvió un archivo viejo durante una
hora (fase 15). Con `no-cache` el borde revalida con el ETag y un MP4 que no cambió no se vuelve a
bajar entero.

| alternativa | por qué no |
| --- | --- |
| El hash del MP4 en su nombre | otra ruta más para escribir en `stage.json` y en el asset-list a mano de hydration-break, para lo que una extensión en una lista ya resuelve |
| Incluir el MP4 en el hash del directorio | cambia la URL del HLS que la web pide aunque sus bytes no cambien |

## 5. `codecs` sale del archivo, no se escribe

El valor es `vp09.<perfil>.<nivel>.<bits>`, y el nivel depende del tamaño y la cadencia de cada
archivo: medido sobre un MP4 de prueba del banner, el `vpcC` que escribe ffmpeg trae perfil 0, nivel
21 y 8 bits, o sea `vp09.00.21.08`; el 16:9 a 960x540 da nivel 30, la esquina nivel 11. Un valor fijo
para todos mentiría en dos de los tres tamaños. `progresivo.sh` lee el `vpcC` del archivo que acaba de
escribir y emite el string; quien escribe el asset-list lo toma de ahí (stage-pair lo anota en
`stage.json`, como el `video` de cada pieza) y un chequeo compara cada `codecs` publicado contra su
archivo. El Roku sólo mira el prefijo `vp09.`; el nivel lo necesita un cliente que decida por él.

## 6. El PNG: el SVG congelado, rasterizado, en git

`graphics/campaigns/<pieza>-fijo.png` al lado de su `-fijo.svg`, 1920x1080 RGBA, para las tres piezas
que hoy son opción de imagen (`zumbra-backplate-fijo`, `kovrin-backplate-fijo`, `ketrava-16x9-fijo`).
Se rasteriza con el mismo Chrome headless y el mismo `omit_background` que `capturar-svg.py`, que es
lo que conserva la transparencia. Va a git como su SVG: es liviano, lo sirve la misma ruta, y sale con
el push.

El PNG es derivado y puede quedar viejo si alguien rehace el SVG. Un chequeo rasteriza de nuevo y
compara contra el commiteado con `pxdif.sh` (el instrumento de la demo para esto, con su autotest);
un PNG que no coincide frena.

## 7. hydration-break: sus ítems pasan a tener `options`

Hoy cada ítem es una opción sola (R5.6: sin `options`, el ítem es su única opción). Para ofrecer el
MP4, la L y la esquina pasan a `options: [HLS, MP4]`, con `start`, `duration` e `identifiers` en el
sobre del ítem y `type` y `layout` en cada opción. `selectOption` arma la opción elegida mezclando el
sobre con la opción, así que la librería ve el mismo objeto que hoy.

Pero el asset-list de esta demo está escrito a mano y lo leen otros que miran `payload[0].layout`
directo: `creativos.sh` y `l-capas.sh` (sacan la caja del banner y de la L),
`senalizar-contenido.sh` (los medios de cada aviso), `test/comprobaciones.js`,
`test/signalled-run.test.js`, y la página misma (`js/senalizacion.js`: los campos del asset-list y el
medio de cada aviso). Todos pasan a leer **la primera opción** de un ítem (`item.options?.[0] ??
item`), que es la HLS de hoy, y la tabla de campos de la página desciende por `options` y explica
`options` y `codecs` con una frase cada uno. El banner, que ya es PNG, no se toca.

## 8. stage-pair: el inventario dice las rutas, el escritor las ofrece

- `stage.json`: cada pieza que es opción de video de un break (`zumbra-16x9`, `ketrava-backplate`,
  `kovrin-banner`) gana `mp4` y `mp4Codecs`, que escribe el script que hace el MP4, igual que
  `versionar-creativo.sh` escribe `video`; cada pieza con `svgFijo` gana `pngFijo`. Los tamaños y
  bitrates del MP4, por forma, en `assets`. `assets.tipos` suma `mp4` y `png`.
- `escribir-asset-lists.mjs`: `options: [video, mp4, imagen, png]`, de la misma función `opcion()`.
- La carrera (`asset-list-race-*.json`) no cambia: sus avisos los dibuja una página que el canal no
  abre.

## 9. La publicación, y qué necesita OK

| qué | cómo sale | necesita |
| --- | --- | --- |
| PNG, asset-lists, `stage.json`, páginas, `publicar.py` | push a `main` (CI) | OK de Nicolás |
| MP4 | `scripts/publicar.sh --publicar --con-contenido stage-pair hydration-break`, a mano | OK de Nicolás |

**El orden es el contenido primero.** El CI verifica cada `uri` de los asset-lists contra el árbol y
el `content/` del bucket; un push con asset-lists que nombran MP4 que el bucket todavía no tiene da
rojo y no publica nada. Así que, con el código ya en `main` local: (1) `publicar.sh --publicar
--con-contenido` de las dos demos, que publica HEAD con su contenido; (2) el push, que encuentra todo
publicado. Las dos se piden juntas.

`--con-contenido` es además el camino que la fase 16 dejó sin probar en un run real.

## Riesgos

| riesgo | mitigación |
| --- | --- |
| La web elige otra cosa | la propiedad del §2, medida contra los asset-lists de `main`, y las suites existentes enteras antes y después (T-05) |
| Un lector de hydration-break que no se enteró de `options` falla en silencio (devuelve `null` y la página pierde una etiqueta) | grep de `payload?.[0]?.layout` y `item?.layout` en toda la demo, y capturas de la página antes y después (T-03, T-05) |
| `--con-contenido` en un run real borra del bucket lo que no está en el `content/` local | la corrida en seco lista lo que borraría y se lee antes de publicar (T-04); se corre desde el checkout que tiene el contenido de las dos demos |
| El PNG o el `codecs` quedan viejos contra su fuente | los dos chequeos de §5 y §6, en la verificación de cada demo |
| El MP4 de 12–24 s desde `tmp:/` en AnimatedImage | es del Roku y su primera tarea; acá se le sirve un árbol local para probar antes de publicar (T-06) |

## Fuera de alcance

Cualquier cambio de lo que la web dibuja; `lib/`; el eje de capacidad "MP4 estático"; el canal Roku;
las demos y los breaks que el canal no lee (§1).

## Decisiones (para subir a ADR)

1. **Lo publicado ofrece además PNG y MP4 VP9, como opciones gemelas** de la HLS y la SVG, en el
   formato del diseño del Roku (§1).
2. **La web dibuja lo mismo porque cada gemela pide lo mismo que la opción que tiene adelante** (§2);
   las páginas muestran las opciones nuevas tal cual.
3. **El MP4 se transcodifica del HLS publicado**, no de una captura nueva (§3).
4. **`progressive.mp4` al lado de su HLS, y `.mp4` con `no-cache`** (§4).
5. **`codecs` se lee del `vpcC` del archivo** (§5).
6. **El PNG es el `-fijo.svg` rasterizado, en git, con un chequeo de que está al día** (§6).
7. **Los ítems de hydration-break pasan a `options`, y sus lectores leen la primera** (§7).
8. **Primero el contenido, después el push** (§9).
