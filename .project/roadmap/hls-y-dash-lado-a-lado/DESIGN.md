# El repo con HLS y DASH lado a lado

## Para qué

La fase siguiente prototipa en `dash/` los mismos mecanismos de SVTA2053 v3 sobre MPEG-DASH,
reusando lo común. Ésta sólo prepara el terreno: que lo común esté en `lib/`, lo de HLS en `hls/`,
y que `dash/` exista con su regla escrita. **Nada de lo que hace la demo cambia**, y eso se mide
contra la publicación de hoy, no se afirma.

La estructura la acordó Nicolás: `lib/` lo común (el renderer, el modelo de un corte, las
capacidades), `hls/` lo de HLS (señalización, playlists, interstitials), `dash/` vacía con un
README, `demo/` hoy de HLS y preparada para mostrar después el mismo stream en los dos. El nombre del
repo no cambia. Lo que queda por decidir acá es el reparto fino, leyendo el código.

## Lo que hay hoy

`lib/` son ocho archivos que `scripts/construir-libreria.sh` concatena en
`dist/qualabs-concurrent-hls.js`, un script clásico que define `window.QualabsConcurrentHls`
(ADR 0015). La costura del ADR 0003 ya parte esos ocho en dos, y la verifica
`scripts/verificar-cortes.mjs` con un grep por archivo:

| lado del renderizado (el grep no encuentra el transporte) | lado de la señalización (`SIGNALLING_SIDE`) |
| --- | --- |
| `renderer.js`, `controls.js`, `multiview.js`, `tracking.js`, `postroll.js` | `signalling.js`, `media.js`, `concurrent-hls.js` |

Los términos del grep son `hls|daterange|date range|asset-list|assetlist|m3u8|manifest|EXT-X|interstitial|Hls\.`,
con tres líneas aceptadas en `controls.js` (el valor `interstitial` del campo `kind` del contrato).

`signalling.js` (2059 líneas) es el único archivo mezclado. Leído declaración por declaración:

- **El modelo de un corte**: lo que convierte el contenido del bloque SVTA (el `payload`: ítems,
  `layout`, `views`, `identifiers`) en el contrato (`Experience`, `Element`, el rango). Viewports,
  elementos, la tabla de formas del multi-view, ofertas, identificadores, el ítem lineal sintetizado,
  `usablePayload`, `withOptions`, `rangeOfExperiences`, `activeAt`. No lee un tag ni un objeto de
  hls.js.
- **Las capacidades y las opciones** (SVTA2053 5.3.3): `usableCapabilities`, `needsOf`, `whyNot`,
  `selectOption`, `firstRequestsOf`, `narrowBlock`, `describeOption`, y la prevalidación
  (`usablePreValidation`). Leen el bloque y lo que el cliente declara; tampoco leen HLS.
- **El transporte HLS**: las tres clases y su tabla de `kind`, el nombre del bloque en el asset-list
  (`BLOCK`), el sobre del asset-list (`ASSETS`, `URI`, `DURATION`) y su resolución con los primeros
  pedidos, los parámetros de capacidades en la URL de `X-ASSET-LIST`, el Date Range (`cueOf`,
  `rangeOfDateRange`, `provisionalRange`, `mediaTimeOf` contra el PDT), la colocación del pre-roll con
  las posiciones de hls.js, `programEnd` sobre los `details` de hls.js, cuándo se pide la lista
  (`assetListDue`, `bufferedEndAt`), `onceProgress` y `postRollDue`, y el cableado con hls.js
  (`linearOnScreen`, `programmeAtEnd`, `scheduledRanges`, `createProgramme`, `createSignalling`).

`media.js` adjunta un creativo con hls.js y `concurrent-hls.js` es el punto de entrada que cablea
hls.js con todo lo demás: los dos son HLS enteros.

## Decisión 1 — `lib/` es lo que no nombra el formato, y lo prueba el grep del ADR 0003 sobre la carpeta entera

**La pregunta que reparte un archivo de la librería es: ¿lo usaría tal cual un player de DASH?**
Sí, va a `lib/`; no, va a `hls/` (y mañana a `dash/`). Es la pregunta del ADR 0020 ("¿existiría si
no hubiera ninguna demo?") aplicada un nivel más adentro, y no le contradice nada: `lib/`, `hls/` y
`dash/` son los tres de la librería.

**El instrumento ya existe: la costura del ADR 0003.** Su grep busca exactamente el vocabulario de
HLS, y su lado del renderizado es justamente lo que un player de DASH reusaría. Así que la costura
deja de ser una lista de archivos escrita a mano y pasa a ser una carpeta: **el grep corre sobre
`lib/*.js` entero**, y un archivo nuevo en `lib/` entra en el chequeo solo. La verificación de
completitud (`nobodyIsUnwatched`, que exigía que todo `lib/*.js` estuviera en una de las dos listas)
deja de tener objeto: con el glob no hay lista que olvidar. `SIGNALLING_SIDE` desaparece por la misma
razón: el lado de la señalización es la carpeta del formato.

Las tres líneas aceptadas de `controls.js` siguen igual: nombran un valor del contrato, no el
transporte.

La costura del ADR 0015 (la librería no nombra la demo) se extiende a `hls/*.js`, porque `hls/` es
librería. `dash/*.js` se agrega el día que exista un archivo: un glob sin archivos le pasaría a grep
una lista vacía y grep leería stdin.

**Que `lib/` no importe de `hls/` no necesita un chequeo aparte**: un `import … from '../hls/…'` en
`lib/` contiene `hls` y el grep lo encuentra.

Descartado:

| alternativa | por qué no |
| --- | --- |
| Una costura nueva, con su propia lista de términos | La del ADR 0003 ya mide esto, con sus excepciones razonadas. Dos listas de términos se separan con el tiempo |
| Mantener la lista de archivos a mano y sumarle los nuevos | La lista a mano es lo que obligaba a tener el chequeo de completitud. La carpeta lo hace innecesario |

## Decisión 2 — El reparto de `signalling.js`: el modelo y las capacidades a `lib/`, el transporte a `hls/`

`lib/signalling.js` se parte en tres archivos, **moviendo declaraciones enteras sin tocar su código**:

- `lib/experience.js`: el modelo de un corte (la lista de arriba).
- `lib/capabilities.js`: las capacidades, las opciones y la prevalidación.
- `hls/signalling.js`: el transporte HLS. Conserva el nombre porque sigue siendo la capa de
  señalización del ADR 0003, ahora sólo la de HLS.

`media.js` y `concurrent-hls.js` pasan enteros a `hls/`. `renderer.js`, `controls.js`,
`multiview.js`, `tracking.js` y `postroll.js` se quedan en `lib/`.

**Un auxiliar que no nombra HLS pero que sólo usa el cableado de HLS se queda en `hls/`**:
`bufferedEndAt`, `onceProgress`, `postRollDue`, las posiciones del pre-roll. Subirlos ahora sería
adivinar qué va a necesitar DASH; la fase DASH los sube cuando los reuse, con el mismo grep y la
misma comparación de esta fase como testigos. Lo que sí sube es lo que el pedido nombra (el modelo y
las capacidades), que ya tiene hoy dos lectores: la señalización y el renderer o los tests de cada
uno.

**Las declaraciones se mueven en el orden en que estaban**, y el código de cada una no se toca. Lo
que cambia es:

- `withOptions` pasa a exportarse, porque la usan `resolveAssetList` y `resolvePostRoll`, que quedan
  en `hls/`. El build borra el `export`, así que en el dist es el mismo texto.
- Los comentarios de lo que sube a `lib/` que nombran HLS (un Date Range, el asset-list) se
  reescriben en el vocabulario del contrato, porque el grep los encontraría y porque en `lib/`
  dejaron de ser ciertos para todo lector. El código no se toca.
- Las cabeceras de los tres archivos dicen qué es cada uno.

**El build arma el mismo dist con las fuentes en orden de dependencia, `lib/` primero**:
`lib/experience.js lib/capabilities.js hls/signalling.js lib/multiview.js lib/renderer.js
lib/controls.js hls/media.js lib/tracking.js lib/postroll.js hls/concurrent-hls.js`. El orden importa
sólo para las constantes de nivel superior que se evalúan al cargar, y ninguna de `lib/` lee una de
`hls/`.

**El dist sigue siendo uno, con el mismo nombre y la misma URL.** Cómo se distribuye la librería de
DASH no se decide acá: lo decide la fase DASH.

`package.json` apunta `main` y `exports` a `hls/concurrent-hls.js` y suma `hls/` a `files`. Su
`name` no cambia.

**Los tests se quedan en `test/`**, y lo único que cambia en ellos es de dónde importan. Mudarlos
por formato es mover archivos sin que nada lo pida; la fase DASH decide si sus tests van aparte.

Descartado:

| alternativa | por qué no |
| --- | --- |
| Mover archivos enteros solamente (`signalling.js` entero a `hls/`) | El modelo y las capacidades quedarían dentro de `hls/` hasta la fase DASH, y la estructura acordada los pone en `lib/` |
| Subir también todo lo que no nombra HLS (`bufferedEndAt`, `onceProgress`…) | Es adivinar qué reusa DASH. Sube cuando haya un segundo lector |
| Un archivo de `lib/` por concepto (viewports, ofertas, identificadores…) | Más archivos sin un lector que los pida; el modelo se lee entero |
| Dejar un `lib/signalling.js` que reexporte desde `hls/` para no tocar imports | `lib/` nombraría HLS, y el build no sabe concatenar un reexport |

## Decisión 3 — La publicación se compara contra la anterior con un script, y el dist puede cambiar sólo de forma inerte

El bucket de cada demo es la carpeta `demo/<demo>/` entera, más `dist/` y `vendor/`. Hoy la corrida
en seco de `scripts/publicar.sh --all` da **0 para copiar y 0 para borrar** en las cinco: lo
publicado es byte a byte HEAD (`0739c38`).

Ninguna reestructura de `lib/` puede dejar el dist byte a byte igual: las etiquetas de procedencia
del build nombran la ruta de cada fuente, y partir `signalling.js` reordena declaraciones. Y los cinco
`demo/<demo>/test/signalled-run.test.js` (más `demo/stage-pair/test/verificar-carrera.py`) importan
de `lib/signalling.js`, y están en el bucket. **Nicolás lo aceptó** (vía agent-nicolas-laptop-865daf,
2026-10-26): la regla quería decir que la demo no cambie lo que hace, y eso se prueba así:

**`scripts/comparar-publicacion.mjs <antes> [<después>]`** arma, para cada demo, lo que se publicaría
desde cada commit (el árbol del commit, el build adentro, `dist/` y `vendor/` copiados en la demo:
lo mismo que arma `publicar.sh`) y los compara:

1. **La lista de archivos es la misma.** Uno que aparece o desaparece es rojo: sería una URL nueva o
   un borrado.
2. **Todo archivo es byte a byte igual**, salvo los dos casos que siguen.
3. **El dist**: se le sacan los comentarios con un lexer de JS (cadenas, plantillas y expresiones
   regulares incluidas), se parte en sus declaraciones de nivel superior, y **el conjunto de
   declaraciones, cada una con su texto exacto, es idéntico**. Lo único que puede diferir es el orden
   y los comentarios.
4. **Un archivo que sólo cambió sus imports**: se normaliza cada ruta a un módulo de la librería
   (`…/lib/x.js`, `…/hls/x.js`) y se sacan las sentencias `import { … } from`: el resto es idéntico y
   **los nombres importados son los mismos**. Cubre el caso de un import que se parte en dos porque
   sus nombres quedaron en dos módulos.

Y se prueba que puede fallar, cada rama una vez: un literal cambiado en el dist, una declaración que
falta, un archivo de más, un import de un nombre distinto. Un comentario cambiado y dos funciones
permutadas tienen que dar verde.

Queda en `scripts/` porque la fase DASH lo vuelve a correr: cuando suba un auxiliar de `hls/` a
`lib/`, la misma pregunta se contesta con el mismo comando. El chequeo de que el contenido
señalizado y las referencias no cambian lo sigue dando la corrida en seco de `publicar.sh`, que se
compara antes y después.

**El próximo push publica un dist nuevo en las cinco demos, con el mismo comportamiento**, y los
`signalled-run.test.js` con sus imports nuevos. Va dicho en el REPORT.

Descartado:

| alternativa | por qué no |
| --- | --- |
| Que el build siga escribiendo las rutas viejas en las etiquetas | El dist mentiría sobre su procedencia para pasar un chequeo |
| Comparar el dist con un parser de JS de npm | El repo no tiene dependencias, y no las gana por un script de comparación |
| Comparar sólo con la corrida en seco | Dice que el dist cambió, no cómo. Es la regla que esta fase no podía cumplir |

## Decisión 4 — `demo/` no se toca, y `dash/` nace con su regla

**Ningún archivo publicado cambia salvo los que la decisión 3 admite.** Eso incluye los
comentarios de las páginas: `demo/stage-pair/index.html`, `inspect.html` y otros citan
`lib/signalling.js` o "assembled from lib/". Quedan como están y van al REPORT como hallazgo para
cuando la fase DASH toque `demo/`, que la va a republicar igual.

**`demo/` queda como el lugar de las demos, sin importar el formato.** Que "queda preparada" quiere
decir que nada en el árbol ata una demo a HLS fuera de su propio código: el build, el servidor
(`/dist/`, `/vendor/`) y la publicación sirven lo que haya. Cómo una demo muestra el mismo stream en
DASH (otra página, un parámetro, otro par) es diseño de la fase DASH.

**`dash/README.md`** dice para qué es la carpeta y su regla: lo que DASH necesita y ya está en
`lib/` se importa de ahí; lo que es de DASH va en `dash/`; y lo que la fase descubra común en `hls/`
se sube a `lib/` con el grep del ADR 0003 y `comparar-publicacion.mjs` como testigos. Sin código.

## La publicación y CI

- `scripts/publicar.sh` arma el stage con `git archive HEAD lib scripts vendor demo`: suma `hls`.
- `scripts/demos-cambiadas.sh` publica las cinco cuando cambia `lib/`: suma `hls/`. `dash/` no
  publica nada mientras no sea parte del dist.
- `.github/workflows/publicar.yml` no nombra `lib/`: no cambia.

## Lo que se actualiza en la documentación

`README.md` (la estructura), `docs/integrating-the-library.md` y
`docs/contrato-senalizacion-renderizado.md` (las rutas), el `CLAUDE.md` del proyecto (dónde está la
documentación real: las cabeceras de `lib/*.js` y `hls/*.js`), los comentarios de `test/` y de los
scripts que nombran una ruta que se movió. Los ADR y las fases cerradas son registro y no se tocan.

## Riesgos

| riesgo | mitigación |
| --- | --- |
| Partir `signalling.js` cambia sin querer el código de una declaración | El código se mueve por script, declaración entera; `comparar-publicacion.mjs` exige el mismo conjunto de declaraciones; 378/378 |
| Una constante de `lib/` lee una de `hls/` al cargar y el nuevo orden del build la evalúa antes | Ninguna de `lib/` importa de `hls/` (lo verifica el grep), y el dist nuevo se evalúa entero en node y define el mismo global con las mismas claves que el de hoy |
| El lexer del comparador confunde una expresión regular con un comentario y declara iguales dos dists distintos | Se lo hace fallar a propósito (un literal y una regex cambiados dan rojo), y el texto sin comentarios del dist de hoy pasa `node --check` |
| Un archivo publicado cambia y nadie lo nota | La comparación por demo exige la misma lista y los mismos bytes salvo los dos casos admitidos, y la corrida en seco se compara antes y después |
| David cambia `lib/signalling.js` en paralelo y el merge no sigue el archivo | La rama v3 ya está en main y no hay otra rama remota adelante; el REPORT dice adónde fue cada declaración |
| Los servers de Nicolás (8080-8082) sirven el `dist/` de main | Todo se hace en `.worktrees/`; el merge a main local no reconstruye `dist/`, lo hace el próximo `./run.sh` |
