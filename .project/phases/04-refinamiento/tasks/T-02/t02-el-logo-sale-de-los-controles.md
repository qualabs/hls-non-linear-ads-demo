# El logo sale de los controles del player: qué se fue y qué se quedó

2026-09-07. La task es una línea de la **demo** que se va. La distinción es todo
el trabajo: el `logo` de `attach` es superficie pública documentada, así que lo
que se saca es la llamada y no la opción.

## 1. Qué cambió

Dos archivos, los dos de la página y ninguno de la librería.

| archivo | qué |
| --- | --- |
| `js/app.js` | se va la línea `logo: { src: './brand/logo-qualabs.svg', alt: 'Qualabs' }` del bloque entre las dos vallas, y con ella la oración del comentario que la señalaba como la línea opcional |
| `index.html` | los dos comentarios que decían que la marca está en dos lugares: el de la cabecera del archivo (`THE MARK of this page`) y el de arriba del `masthead` |

Los dos comentarios de `index.html` describían el estado que esta task cambia
—"la marca de esta página está en dos lugares y son un archivo"— así que
dejarlos habría dejado el archivo afirmando algo que su propio código ya no
hace. Se reescribieron a la misma cantidad de líneas a propósito: el comentario
de `js/app.js` referencia `index.html:139` y `index.html:119`, y las dos
referencias siguen apuntando al `<script src>` de la librería y al contenedor.

## 2. Qué se quedó, que es la parte que importa

Nada de la superficie pública se movió:

- La opción `logo` de `attach` (`lib/concurrent-hls.js:119` y `:131`).
- El nodo `qa-brand` que la dibuja y su CSS (`lib/controls.js:238-247`, y las
  variables `--qa-logo` y `--qa-plate`).
- La sección 7 del documento del integrador, *The brand is yours, because this
  library ships none*, con su bloque de ejemplo que pasa `logo`.

Un integrador que quiere su marca adentro del cuadro la sigue pasando igual, con
la misma línea y el mismo resultado. Lo único que dejó de tener marca adentro de
la imagen es esta demo.

**La prueba de que la superficie no se movió es el diff vacío:**

    $ git diff -- docs/integrating-the-library.md
    (sin salida)

## 3. La consecuencia, escrita

Sin logo en la barra no queda ninguna marca adentro del cuadro, y en fullscreen
el encabezado no está en el marco. La T-07 de la fase 02 subió el logo del
player a 40 px en fullscreen exactamente por eso.

Hoy no cuesta nada, porque lo que se graba es la página de dos panes y el
encabezado está en ese cuadro —la captura lo muestra—. El día que se grabe
fullscreen, la marca vuelve, y vuelve por la opción que quedó en pie. El
compromiso con David lo sostiene el encabezado.

## 4. La captura, y las dos lecturas que la acompañan

`t02run.py`, por el mismo camino que la T-01: el Chrome real por CDP en el 9333
contra el servidor del 8080, viewport de 1600 × 1000 y captura a tamaño real. Se
cae en el break 1 —el `cornerOverlay`, el mismo aviso con el que la T-07 de la
fase 02 mostró la marca— y con los controles a la vista, porque la barra es
donde estaba el logo y una captura con los controles escondidos no muestra nada.

| | antes | después |
| --- | --- | --- |
| captura | `t02-1-los-dos-panes-antes.png` | `t02-1-los-dos-panes-despues.png` |
| marca adentro del cuadro | existe, 115,34 × 35,19 px | no existe |
| marca del encabezado | existe, 193,75 × 44 px, `./brand/logo-qualabs.svg` | igual |
| controles a la vista | sí | sí |
| avisos en el cuadro | 1 | 1 |

Las dos lecturas del DOM son las dos afirmaciones que la captura hace, escritas
como booleanos: que no hay nodo `qa-brand` adentro de `#player`, y que el `img`
de la marca del encabezado sigue ahí con el mismo archivo y el mismo tamaño. El
largo del riel no se movió —el logo vivía en una fila propia arriba del reloj y
del riel, y lo que se fue es la fila—: `0:28` y `3:00` en los dos extremos, en
las dos capturas.

## 5. Qué no se corrió, y por qué

Nada. Es la verificación mínima que el bloque de la task pide, y no es un
recorte: los dos archivos que se editan no son ninguno de los que
`scripts/verificar-cortes.mjs` mira —su lista es `lib/renderer.js`,
`lib/controls.js`, `js/contract-trace.js`, `css/player.css` y los `lib/*.js`— y
`npm test` importa las funciones puras de las dos capas, que esta task no toca.

Y la captura reducida a un cuarto tampoco se corrió. Estaba para probar que la
marca que sobrevive a la reducción es la del encabezado, y eso ya lo midió la
T-07 de la fase 02: a un cuarto el logo de 22 px de la barra queda en 5,5 px y
el wordmark se disuelve. Volver a medirlo no atrapa ningún defecto nuevo.

## 6. El conteo que no se corrigió

La página mínima del documento del integrador y el bloque de seis líneas del
`README.md` nunca pasaron `logo`, así que ninguno de los dos cambia. El conteo de
12 líneas es el de la página de **esta** demo y vive en la evidencia de la T-08
de la fase 02 y en el informe de esa fase, los dos registro histórico: quedan
como están, porque son la prueba de lo que se midió ese día.
