# El selector: la lista de casilleros en los controles

2026-09-11. `lib/controls.js` tiene un control nuevo en la fila de arriba, al
lado del audio, que abre la lista de todo lo que la oferta declara y deja tildar
y destildar (ADR 0067). Es lo primero de esta fase que se ve en pantalla, así
que la verificación son las capturas y las lecturas que las acompañan.

## 1. Lo que se construyó

| dónde | qué |
| --- | --- |
| el botón | `qa-btn--views`, ícono de cuatro cajas, primero en la fila de arriba. No existe hasta que hay una oferta activa y desaparece con ella. Queda encendido mientras el panel está abierto |
| el panel | `qa-views`: eyebrow, una fila por vista, y la línea al pie. Cuelga del borde derecho debajo de la fila de botones, adentro del elemento del player (ADR 0015), y todas sus medidas son tokens del cromo, así que crece en pantalla completa |
| la fila | `qa-views__row`: casillero, nombre, y el hint `always on` en la del programa. 44 px de alto bajo un dedo, como cualquier otro blanco del cromo |
| el estado | ninguno propio. Las tres banderas —`checked`, `locked`, `disabled`— salen de `rows(offer)` de la T-05 y este archivo las dibuja |
| `selectorNote(rows)` | lo único que el cromo decide: la línea que dice **por qué** hay filas grises, y que sólo está cuando las hay. El tope se interpola de `MAX_BOXES` y no se escribe |

**Tres llamadas y nada más** cruzan hacia el estado de quien mira: `offerAt`,
`rows` y `toggle`. `createControls` las recibe en un parámetro `multiview`
opcional; sin él no hay botón ni lista, que es lo que ve un player de un solo
feed, y por eso las dos demos que ya andan no cambian en nada.

**El hold.** Con la lista abierta se toma el hold de la T-06 con un token propio
y se suelta al cerrar, por las cuatro salidas —el botón, un toque afuera, escape
y la ventana que se termina—, todas por la misma línea.

**Tildar no cierra la lista**, y es la única línea del plan de la task que no se
siguió. Está argumentado en §5.

## 2. El instrumento

| | |
| --- | --- |
| la página | `t07-la-pagina.html`, en un directorio temporal, con `lib/` traído por un enlace: lo que corre es la librería viva y no una copia. Cablea `createMultiview`, `createRenderer` y `createControls` igual que `attach()` |
| el contenido | el de la demo nueva: el primario de 180 s y las cinco vistas, servidos por `server.mjs` |
| la oferta | `signalling/asset-list-offer-5.json` resuelto por `resolveAssetList`, con la ventana abierta en el segundo 4. **Cinco vistas y cuatro cajas**: es la única forma de que existan filas deshabilitadas |
| el tamaño | 960 × 540, y el recorte de cada captura es el player y no la página |
| los gestos | `page.mouse` sobre coordenadas: lo que corre son los listeners de la librería |
| lo que juzga | las cajas leídas del DOM contra la geometría calculada aparte en `t07run.py` a partir de la imagen que reporta el navegador, y las filas leídas del panel y no del estado |
| el script | `t07run.py`, y la corrida entera en `t07-la-corrida.json` |

**La geometría esperada está escrita a mano en el script**: si se leyera de la
librería, la comparación sería la librería contra sí misma.

**Y la captura espera** a que la composición se asiente (`PRIMARY_MOVE_MS` es
380 ms) y a que el panel termine su transición: una captura disparada al
cambiar la clase fotografía algo que ya no es verdad. Es la lección de la T-06.

## 3. La corrida, con sus números

Los 41 chequeos de `t07run.py` dieron todos verde. Los que importan:

| momento | lo que se leyó |
| --- | --- |
| ventana abierta, nada tildado | el botón está; una sola caja, que es el programa como venía; seis filas, la primera tildada y bloqueada (`Tears of Steel`), ninguna gris, sin línea al pie |
| **6 s sin tocar nada** | la lista sigue abierta con opacidad 1 y el cromo arriba. Es más que los 2600 ms del presupuesto del mouse y más que los 5000 del táctil: sin el hold, acá no habría lista |
| tildar la primera | 2 cajas, en `(0,135,480,270)` y `(480,135,480,270)` |
| tildar la segunda | 3 cajas, la tercera centrada abajo en `(240,270,480,270)` |
| tildar la tercera | 4 cajas en los cuatro cuadrantes exactos |
| **la grilla llena** | 4 filas tildadas, las 2 que no lo están deshabilitadas (`Elephants Dream, late`, `Sintel`), **ninguna tildada se deshabilita** —la grilla llena sigue siendo destildable— y la línea al pie: *"4 boxes is what the screen holds. Lower one to raise another."* |
| destildar una | 3 cajas, las filas vuelven a habilitarse y la línea se va |
| destildar la última | una sola caja: la salida, sin ningún caso especial |
| escape | cierra la lista y el botón queda sin expandir |
| pantalla completa | el panel mide 290 px y una fila 46, con el texto en 18 px: la lista crece con el resto de la furniture |

Las cajas de cada forma se compararon contra las tres del ADR 0065 con ±2 px de
tolerancia, y las vistas subidas se leyeron reproduciendo (`paused === false`).

## 4. Las capturas

| archivo | qué se mira |
| --- | --- |
| `t07-1-la-lista-abierta.png` | la lista abierta sobre el programa, seis filas, el programa tildado y bloqueado |
| `t07-2-dos-cajas.png` | la primera vista tildada: dos cajas |
| `t07-3-tres-cajas.png` | la segunda: tres |
| `t07-4-cuatro-cajas.png` | la tercera: la grilla llena, las dos filas restantes grises y la línea que dice por qué |
| `t07-5-la-grilla-sin-la-lista.png` | el toque afuera cerró la lista y el cromo se quedó |
| `t07-6-el-cromo-se-fue-solo.png` | 2,6 s después: la grilla sola |
| `t07-7-destildar-vuelve-a-tres.png` | destildar baja una caja y devuelve las filas |
| `t07-8-destildadas-todas.png` | todo destildado: el programa como venía |
| `t07-9-pantalla-completa.png` | la misma lista a escala de pantalla completa |
| `t07-regresion-compatibility-pair.png` | la demo que ya anda, sin tocar |

**Y la demo que ya anda no se movió.** `t07-regresion.py` la levanta y mide la
fila de arriba: un solo hijo, el botón de audio, con su caja pegada al borde
—`top` y `right` idénticos a los de la fila— y ningún botón de vistas. La fila
pasó a ser `flex`, y sobre un solo botón eso no mueve un píxel.

## 5. Las dos decisiones que la corrida dejó tomar

**El cromo no se va con la lista, se va 2,6 s después**, y está bien. Medido:
2591,6 ms desde el toque que la cerró, contra el reloj de la página. Sale del
orden de registro —el `pointerdown` del cromo corre primero, donde ocultar no
hace nada porque el hold está puesto, y el de la lista después— y se dejó así a
propósito: **el toque que descarta la lista hace una sola cosa**, y el cromo
sigue su temporizador como después de cualquier otro gesto. Lo contrario sería
una respuesta doble a un solo toque, y además taparía el momento en que se ve la
composición que se acaba de armar. Registrar el listener en fase de captura lo
invertiría, así que el orden está escrito en el comentario y no sólo en las dos
líneas.

**Tildar no cierra la lista.** El plan de la task dice *"cierra al elegir, al
tocar afuera, o con escape"*. Las otras dos se implementaron; la primera no,
porque choca con la forma que el ADR 0067 eligió: una **lista de casilleros** y
no un menú de agregar, donde la misma fila sube y baja. Armar la grilla de
cuatro son tres tildes, y una lista que se cerrara en cada una los volvería tres
tildes y tres aperturas —justo lo que Nicolás pidió evitar: *"que te deje ir
seleccionando qué videos querés ver"*—. El costo de equivocarse para este lado
es una línea; para el otro, el gesto central de la fase se hace tres veces más
largo en la demo que se va a mostrar.

## 6. El test y lo que mata

`test/views-selector.test.js`, cuatro casos sobre la única lógica no visual que
el selector agrega: con lugar en la grilla no hay línea; con la grilla llena
está y nombra el tope; **una grilla llena cuyo catálogo entra entero no dice
nada**, porque no hay ninguna fila gris que explicar; y el control, con filas
escritas a mano, que es lo que distingue una línea que lee la bandera del estado
de una que cuenta tildes por su cuenta.

Sin campaña de mutación, que el nivel de verificación de la task no pide.

La suite quedó en **156 pruebas, 156 pasan**, y `npm run check` en verde: las
dos costuras siguen en pie, con las tres ocurrencias aceptadas de siempre y
ninguna nueva.

**El conteo se movió dos veces y sólo una es de esta task.** Al empezar eran
151; estas cuatro son 155. La que falta es de
`demo/hydration-break/test/signalled-run.test.js`, que la fase 12 estaba
editando en paralelo —mtime 13:01, en medio de esta corrida— y que nada de acá
toca. Ninguna prueba se perdió: cada suite corre exactamente los `test(` que
tiene escritos, y la lista completa de nombres está en la salida de
`node --test --test-reporter=tap`.
