# Evidencia de la T-04 — la figura de la convivencia

Registro de lo que se construyó, se corrió y se miró el 2026-09-11. No es instrucción
vigente: lo vigente es el comentario de cabecera de la figura en `index.html` y el
bloque `THE FIGURE OF COEXISTENCE` de `css/page.css`.

## Lo que se construyó

| archivo | qué es |
| --- | --- |
| `demo/hydration-break/index.html` | la figura en la sección 2, con su comentario de cabecera: una playlist arriba, dos clientes abajo |
| `demo/hydration-break/css/page.css` | el bloque `.coexist`, sin colores nuevos y sin una caja más que la de la playlist |

Markup y CSS y nada más: sin imágenes, sin librería, y sin una línea de JavaScript. Nada
de `lib/`, nada de `story/story.json` y nada de las otras dos demos.

## Las etiquetas, y el ADR que sostiene cada afirmación

| lo que dice en pantalla | de dónde sale |
| --- | --- |
| *One media playlist, and it carries both.* | ADR 0007: *"La media playlist lleva dos tags en el mismo `START-DATE`"* |
| `EXT-X-DATERANGE  com.apple.hls.interstitial` | ADR 0007 y ADR 0009: son las dos clases, nombradas por su nombre |
| `EXT-X-DATERANGE  com.qualabs.hls.concurrentInterstitial` | ídem |
| *Same `START-DATE`, one `ID` each.* | ADR 0007: el mismo `START-DATE`, y *"Cada Date Range del par lleva su propio `ID`"* |
| *A client in the market today* | ADR 0007: *"una instancia de hls.js sin modificar y con su configuración de fábrica"* |
| *plays `com.apple.hls.interstitial`* | ADR 0007: *"reproduce el aviso lineal e ignora lo que no entiende"* |
| *The class it does not know is compared as an exact string, with no inheritance to fall back on, so it goes straight past it.* | ADR 0009: *"la clase de un DATERANGE se compara por igualdad exacta de string y el formato no tiene ningún mecanismo de herencia"*, y *"lo que va a pasar es que la ignore por completo"* |
| *The Ad replaces the programme, exactly as it does today* | ADR 0007: reproduce el aviso lineal; la nota del 2026-09-07 agrega que ese pane **reemplaza** |
| *and not one option of the player had to change* | ADR 0007, nota del 2026-09-07: *"La instancia se construye con cero opciones (`new Hls()`)"* |
| *The same client, with the library on top* | ADR 0007: *"en la misma página y con la misma librería, una instancia que se comporta como cualquier cliente de mercado y otra que hace lo nuestro"* |
| *plays `com.qualabs.hls.concurrentInterstitial`* | ADR 0007: *"el cliente de la demo elige la experiencia concurrente"* |
| *Same hls.js and the same version: the new class is read by a library on top of the player and not by a change inside it.* | ADR 0007 (*"con la misma librería"*) y el lede de esta misma sección, que ya lo dice: *"An unmodified hls.js plays it; a library on top reads the asset-list"* |
| *The Ad is drawn into the box the layout declares, and the programme underneath keeps running.* | el lede de la sección, verbatim en su primera mitad; ADR 0007 |
| *Drawn, not read. This page runs one client, so the playlist under it carries the concurrent tag alone* | `content/primary/con-daterange.m3u8`: un solo `EXT-X-DATERANGE`, y es el de la clase concurrente |
| *the pair of clients on a single playlist is the other demo in this repository* | ADR 0007; mencionada y **no enlazada**, porque `run.sh` sirve una demo por vez (ADR 0022) |

**Ninguna etiqueta nombra un identificador de layout**, que es lo que el chequeo
`laGaleriaSeDibujaDelContrato` mide sobre `index.html` y lo que la rotura
`lowerThirdOverlay` de `mutaciones.mjs` le hace fallar.

## Las dos decisiones de la figura que no son de estilo

**Las dos columnas pesan lo mismo, y eso es el encuadre escrito como tipografía.** El
ADR 0076 dice que el interstitial tradicional es una de las opciones y no el problema.
Una figura que ilumina una columna y apaga la otra argumenta reemplazo en la tipografía
mientras el párrafo de arriba argumenta convivencia, y la tipografía es la mitad que se
cree. Medido y no afirmado: a 1907 las dos columnas miden **424 px cada una**
(`medicion.json`), con el mismo tamaño, el mismo color y la misma regla.

**Se dibujan clases y nunca un tag.** El comentario de cabecera de `index.html` prohíbe
que esta página muestre algo que no leyó, y el de `showSignalling` lo dice más fuerte:
*"a tag pasted into the HTML would be an illustration"*. Un nombre de clase es una
constante del protocolo (ADR 0009); un `EXT-X-DATERANGE` con sus atributos y sus valores
sería una playlist inventada. Por eso la figura nombra las dos clases y **el tag de
verdad sigue estando una sección más abajo**, leído de la red. El `figcaption` lo dice
en la página, con dos palabras: *Drawn, not read.*

## Las tres corridas

| archivo | qué dice |
| --- | --- |
| `suite.txt` | `npm test` — **164 pruebas, 164 en verde**, el mismo número que antes de esta task |
| `costuras.txt` | `npm run check` — las dos costuras en pie |
| `mutaciones.txt` | `npm run mutaciones` — 6 chequeos en verde y las 15 roturas en rojo |

Esta task no agrega pruebas, y por eso el número no se mueve: es interfaz sin lógica, y
lo que podría romperse en silencio —un identificador de layout escrito a mano en
`index.html`— ya lo mide el chequeo que trajo la T-02.

## La medición de ancho, con su referencia

`capturas.py` mide el documento a los dos anchos contra los que esta página mide:

| ancho | `scrollWidth` | `clientWidth` | columnas |
| --- | --- | --- | --- |
| 400 × 780 | 400 | 400 | apiladas (las dos en `x = 20`) |
| 1907 | 1907 | 1907 | lado a lado, 424 px cada una |

Sin errores de consola a ninguno de los dos anchos, y con la galería (4 fichas) y los
pliegues (4) intactos, que es lo que prueba que la figura no le pisó nada a las otras
dos tasks.

**Y la medición tiene su control, porque una que no puede dar distinto no mide nada.**
`control-ancho.py` corre la misma lectura con las dos líneas que defienden el ancho
—`min-width: 0` y `overflow-wrap: anywhere`— **apagadas en caliente**, a 320, 360 y
400 px (`control-ancho.json`):

| ancho | con las guardas: bloque de la playlist | sin ellas |
| --- | --- | --- |
| 320 | 278 px | **308 px** |
| 360 | 318 px | 318 px |
| 400 | 358 px | 358 px |

O sea: **la guarda hace algo y se lo ve hacerlo**, y a 360 y a 400 no hace falta porque
el nombre de la clase entra igual. Se queda por lo que dice el comentario: es la tercera
instancia del mismo defecto en esta página, y la clase hermana son 38 caracteres de
monoespaciada sin un espacio adentro.

## Un hallazgo que no es de esta task y que no se arregló

**A 320 px de ancho el documento scrollea de costado, y no es la figura.** `control-320.py`
lo mide con la figura puesta y con la figura escondida: en los dos casos el documento da
`scrollWidth` **334** contra `clientWidth` 320, y el único elemento que se pasa es el
mismo: el `<code>com.qualabs.hls.concurrentInterstitial</code>` **inline del párrafo
`.lede` de la sección 2**, que es copia de la T-01.

No es una regresión: los dos anchos declarados de esta página son 400 y 1907, y a los dos
el documento no se mueve de costado. Queda anotado acá y no arreglado, porque arreglar
copia de otra task mezcla dos cambios en uno.
