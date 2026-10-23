---
closed: 2026-10-23
---

# Fase 17 cerrada: el PNG y el MP4 de cada creativo, para el Roku

## 1. Resumen

stage-pair y hydration-break ofrecen, al lado de lo que la web dibuja, las formas que un Roku dibuja.
En stage-pair cada break trae HLS, MP4, SVG y PNG; en hydration-break la L y la esquina traen HLS y
MP4. Son cinco MP4 VP9 sin audio, transcodificados de los HLS publicados (que no se re-empaquetaron:
mismos hashes y mismas URLs), con su `codecs` leído del `vpcC` del archivo, y tres PNG de los SVG
congelados. La librería no se tocó. Contra `main`, la web elige lo mismo en las cinco capacidades (30
elecciones), no pide ninguna gemela por la red, y las suites y verificaciones de navegador siguen
verdes. `roku-ads-02` probó los dos árboles en el equipo antes de publicar. Publicado el 2026-10-23:
primero el contenido con `--con-contenido`, después el push (run 39892946733, las cinco demos en
verde).

## 2. Decisiones

- ADR 0096: lo publicado ofrece además PNG y MP4 VP9, como opciones gemelas de la HLS y la SVG.
- ADR 0097: la web dibuja lo mismo porque cada gemela pide lo mismo que la opción que tiene adelante.
- ADR 0098: el MP4 se transcodifica del HLS publicado.
- ADR 0099: `progressive.mp4` al lado de su HLS, y `.mp4` servido con `no-cache`.
- ADR 0100: `codecs` se lee del `vpcC` del archivo.
- ADR 0101: el PNG es el `-fijo.svg` rasterizado, en git, con un chequeo de que está al día.
- ADR 0102: los ítems de hydration-break pasan a `options`, y sus lectores leen la primera.
- ADR 0103: primero el contenido, después el push.

El formato es el del canal (`hls-non-linear-ads-roku`, `todo-de-lo-publicado/DESIGN.md` §1,
`bab9afe`), y se apartó de su §2 en un punto, con razón en el ADR 0098: el MP4 sale del HLS y no de
cuadros recapturados.

## 3. Tasks

Las siete `done`, con su evidencia en `tasks/`. T-01 a T-04 en la rama `fase-17` (1802c38, fe82c1c,
54dd9c7, 70205e1), mergeada en b790757. T-05 es la medición de que la web no cambia; T-06, los dos
árboles locales para `roku-ads-02`; T-07, la publicación con el OK de Nicolás.

## 4. Hilos abiertos

- `content/adBanner/creative.png` de hydration-break tiene nombre fijo y se sirve con la hora de caché
  pública: queda como `roadmap/creative-png-del-banner-sin-no-cache/` (idea, fix, impacto bajo).
- `creativos.sh` de hydration-break no se corrió entero después de cambiarle el lector (rehace los
  creativos de video): la caja del banner que lee sale igual, y su gemela `l-capas.sh` se comparó a 0
  px. Queda sin probar de punta a punta hasta la próxima vez que se rehagan los creativos.

## 5. Riesgos que se dieron

- **Un lector de hydration-break que no se enterara de `options`** era el riesgo previsto, y la
  campaña de mutaciones encontró el hueco: ningún test fijaba los rótulos de los pliegues, y dos
  roturas (el tipo y el medio del rótulo) daban verde. Se agregó el test y pasaron a rojo.
- **En la TV, la L de hydration-break pareció tapar el programa.** Era la entrada del menú que
  apuntaba a la demo publicada, todavía sin MP4, cayendo a su lineal a pantalla completa (consola del
  Roku). `roku-ads-02` midió además que el Video abre su ventana sobre lo dibujado antes en el árbol,
  AnimatedImage incluido. Mi hipótesis (el plano gráfico tapa siempre el video) no se sostuvo y el
  formato no cambió.
- `--con-contenido` en un run real (sin probar desde la fase 16): no borró nada, como había dicho la
  corrida en seco.

## 6. Recomendaciones

- Antes de afirmar la causa de algo que se ve en un equipo, preguntar qué estaba corriendo: la
  primera hipótesis sobre la L se armó sobre una premisa (que se estaba viendo la rama) que nadie
  había verificado.
- Las capturas de página entera no sirven para comparar dos versiones de una demo con video: la
  diferencia entre dos corridas de la misma versión es del mismo orden. Lo que discrimina es la caja
  aislada (0 px) y las mediciones de estado.

## 7. Correcciones post-ejecución

`grep -n "post-ejecuci" TASKS.md` da una línea, en T-07: lo de la L en la TV, que terminó sin cambio
en la fase. Ninguna task necesitó arreglos después de declararse `done`.

## 8. Revisión de la documentación

- **`description` de `PHASE.md`**: reescrita como lo que resultó ser la fase.
- **`docs/arc42/`**: el proyecto no tiene uno, y la fase no cambió la librería.
- **El resto de `docs/`**: nada. `integrating-the-library.md` (§ `options`) y
  `contrato-senalizacion-renderizado.md` describen la librería, que no cambió; lo que dicen de
  `options` sigue siendo cierto.
- **`README.md` del proyecto**: nada; lista las cinco URLs, que no cambiaron. Los README de
  stage-pair y hydration-break ganaron un párrafo cada uno sobre las gemelas (fe82c1c, 54dd9c7), y el
  `CREDITS.md` de stage-pair, los tres PNG y los MP4.
- **`CLAUDE.md` del proyecto**: nada que la fase haya vuelto falso. Su "todo lo de nombre fijo va con
  `no-cache`" ya era falso para el `creative.png` del banner antes de la fase: es el hallazgo del
  roadmap.
- **`.project/knowledge/`**: el proyecto no tiene esa carpeta.
- **`CLAUDE.md` y `knowledge/` de la raíz**: nada; la fase no cambió nada que valga para todo el repo.
- **Runbook de instalación**: no hay. Los pasos nuevos (`progresivo-creativos.sh` en las dos demos,
  `rasterizar-fijo.py`) se describen en su encabezado, y `puente-a-video.sh` llama al primero.
- **`tasks/` de la fase**: son verificaciones fechadas con su commit, registro y no instrucción. Los
  paths de `tasks/T-06/entrega.md` (`~/.cache/cto-tmp/hls17-arbol/`) eran temporales y se borran.
