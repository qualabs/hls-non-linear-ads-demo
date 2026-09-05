# T-08 — la página mínima del documento contra la de la demo, línea por línea

2026-09-05. El documento es `docs/integrating-the-library.md`. Está en inglés,
como el `README.md`, `index.html` y todo el código: es lo único de `docs/` que
lee alguien que no somos nosotros, y David lo pidió para poder distribuirlo.

El done de esta task no es que el documento sea correcto. Es que sea
**completo**: si la demo hace algo que el documento no menciona, un integrador
que siga el documento no llega al mismo resultado. Lo que sigue es la
comparación, hecha línea por línea y no de memoria.

## 1. El JavaScript

La valla de `js/app.js` contra el bloque del §1 del documento
(`t08-diff-js.txt`):

```diff
 const hls = new Hls({ ...QualabsConcurrentHls.hlsConfig });
 const concurrent = QualabsConcurrentHls.attach(hls, {
-  container: document.getElementById('player')
+  container: document.getElementById('player'),
+  logo: { src: './brand/logo-qualabs.svg', alt: 'Qualabs' },
+  onResolved: logResolved
 });
-hls.loadSource('./content/primary/con-daterange.m3u8');
+hls.loadSource(SRC);
 hls.attachMedia(video);
```

**Seis líneas contra ocho, y las tres diferencias son las tres esperadas.**
`logo` y `onResolved` son opcionales y el documento dice de cada una que lo es
(§6, §7); `SRC` es la constante con que la demo nombra su propio contenido, que
es la URL que el documento escribe entera.

## 2. La medida en líneas, que es la que hay que verificar

| | | |
| --- | --- | --- |
| T-01 | 13 | 8 de JS + 5 de marcado. Mínimo declarado: 10 |
| T-07 | «de ocho a nueve» | |
| **hoy** | **12** | **8 de JS** (`js/app.js:52-59`) **+ 4 de marcado**. Mínimo: 10 |

**La valla tiene ocho líneas de JavaScript, no nueve.** El número de la T-07
está corrido en uno y se ve en el historial: la T-01 midió ocho **con**
`audioControl`, la T-03 borró esa línea al llevarse los controles a la librería
—`git show 2bcb136:js/app.js` da siete— y la T-07 agregó `logo`, que la deja en
ocho. Lo que la T-07 escribió es correcto en lo que importa —la marca costó una
línea y es opcional— y equivocado en el número, porque comparó contra la medida
de la T-01 sin restarle lo que la T-03 se había llevado.

El marcado bajó de cinco a cuatro por la misma razón: la T-03 se llevó el
`<button id="ad-audio">` que la T-01 había contado.

**El mínimo sigue siendo diez**, que es lo que la T-01 dejó dicho: 12 menos las
dos opcionales. Es el número del §9 del documento.

## 3. El marcado, línea por línea

| el documento (§1) | la demo |
| --- | --- |
| `<script src="./vendor/hls.min.js"></script>` | `index.html:138` |
| `<script src="./dist/qualabs-concurrent-hls.js"></script>` | `index.html:139` |
| `<div class="player" id="player">` | `index.html:119` |
| `<video class="video" id="video" playsinline></video>` | `index.html:120` |
| `</div>` | `index.html:121` |
| el código del integrador, después de los dos anteriores | `index.html:140`, que es un `<script type="module">` |

Idénticas. El `<script>` de hls.js no entra en las cuatro líneas contadas, por
el mismo criterio que la T-01 dejó afuera `const video` y `const SRC`: existe
tenga o no tenga esta librería. Pero **está en el documento**, porque el orden
de los dos importa (§4).

## 4. El CSS

| el documento (§1 y §3) | la demo |
| --- | --- |
| `.video { width: 100%; height: 100%; display: block; object-fit: contain; }` | `css/player.css:127`, **carácter por carácter** |
| `.player { position: relative; aspect-ratio: 16 / 9; background: #000; }` | `css/player.css:117-124`, que agrega `border-radius`, `overflow` y `outline` |

Las tres que el documento no pide son decoración de la demo y se puede decir por
qué ninguna es estructural: el `outline` es el anillo con que la página marca
«hay un aviso», el `border-radius` es la esquina, y el `overflow: hidden` es lo
que recorta contra esa esquina. Nada de la composición se sale del contenedor —
las cajas de los avisos son insets de 0 a 100 sobre la caja de la imagen, que
está adentro del marco, y el primario se escala hacia abajo y nunca hacia
arriba—, así que sin `overflow` no se pierde una línea de nada.

## 5. Lo que la demo hace y no está en la valla, revisado uno por uno

Esta es la parte que decide si el documento es completo. Cada cosa que la página
hace, y de qué lado cae:

| | dónde | de quién es |
| --- | --- | --- |
| `const video = document.getElementById('video')` | `app.js:30` | del integrador; **está en el §1** |
| `const SRC` | `app.js:28` | su contenido; **está en el §1** |
| `video.muted = true; video.play()` | `app.js:86-87` | política de autoplay; **está en el §1**, con la razón |
| `hls.on(ERROR, ...)` | `app.js:67-70` | suyo; el §5 dice que el manejo de errores es del integrador |
| el chequeo de `interstitialsManager` | `app.js:72-79` | de la demo; el §2.1 dice que la librería hace la misma lectura sola |
| `traceContract(...)` | `app.js:65` | de la demo; el §6 nombra `provider` como la manera soportada |
| el player de fábrica, el label del pane, `window.demo` | `app.js:95-145` | de la demo; el §9 lo dice |
| las fuentes, el favicon, el encabezado, el crédito | `index.html` | de la demo |
| `--qa-accent` sobre `.pane-demo .player` | `css/player.css:132` | opcional; **está en el §7** |

**No quedó nada afuera.** Todo lo que la demo hace porque la librería existe está
en el documento, y todo lo que el documento pide está en la demo.

## 6. Dos requisitos que la librería tiene y nadie había escrito

Son el hallazgo de la task: no salieron del bloque, salieron de comparar. Los dos
están en el documento.

**1. La librería necesita el global `Hls` y nunca lo recibe.** La superficie del
ADR 0015 dice «una instancia de hls.js, un contenedor», y por ahí entra la
instancia — pero no el constructor. La librería lo busca en el global tres veces:
`lib/concurrent-hls.js:167` (`Hls.Events.MEDIA_ATTACHED`),
`lib/signalling.js:204` (`Hls.Events.LEVEL_UPDATED`) y `lib/media.js:34`, que
hace `new Hls(...)` por cada asset de un break. Consecuencias para el que
integra, y ninguna es evidente leyendo la valla:

- **El orden de los dos `<script src>` importa**, y la demo lo tiene bien por
  casualidad de haberlos escrito así.
- **`import Hls from 'hls.js'` no alcanza.** El contenido primario arranca y
  reproduce; el primer break tira un `ReferenceError` desde adentro de la
  librería. Es la misma forma de falla que el ADR 0002: anda hasta que importa.

Está escrito como el §4 del documento, con el `window.Hls = Hls` que lo arregla.
No se cambió el código: es una task de documentación, y además el global es
exactamente lo que el ADR 0015 eligió como forma de distribución.

**2. La librería le borra el atributo `style` al elemento de video.** Al terminar
cada break, `lib/renderer.js:346` hace `node.removeAttribute('style')` para
devolvérselo a la hoja de estilos de la página — que es el mecanismo del que
depende la garantía de la T-09. El efecto de costado es que **cualquier estilo en
línea que el integrador le haya puesto al `<video>` desaparece en el primer
break**. La demo no lo sufre porque estila por hoja de estilos. Está en el §3,
como la tercera cosa de esa sección.

## 7. Lo que la T-09 dejó y es de este documento

La T-09 lo anotó como material para acá: **que el encuadre no salte depende de
una regla de la hoja de estilos del integrador.** Mientras hay un layout la
librería es dueña de la caja del primario; en cuanto el break termina le devuelve
el elemento a la página, y de ahí en adelante el rectángulo lo decide su CSS. Con
`object-fit: contain` es el mismo rectángulo que la librería estaba usando y no
se mueve nada; con `cover` es otro, y el salto de encuadre que la T-09 eliminó
vuelve al revés. No tira error y no loguea.

Es la primera de las tres cosas del §3 del documento, y está dicha con la razón y
no como una regla a obedecer.
