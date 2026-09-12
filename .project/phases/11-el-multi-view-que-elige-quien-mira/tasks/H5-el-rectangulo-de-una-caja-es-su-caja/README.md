# H5 — El rectángulo de una caja es su caja

Cierra el hallazgo 1 de la H4. `.qa-box` escribe `width`/`height` y tiene
`padding`, y la hoja de la librería no declaraba `box-sizing`: el rectángulo era
**content-box** y medía dos paddings de más en cada eje. En `nw` no se nota,
porque el botón se apoya en la esquina donde las longitudes arrancan; en `ne` —la
esquina que toma la cuarta caja de la grilla de dos por dos desde la H2— el botón
quedaba 12,8 px afuera de su caja y recortado por el borde derecho de la imagen.

El archivo tocado es **`lib/controls.js`** y nada más.

## El arreglo

`box-sizing: border-box` en `.qa-box`, con el comentario que dice por qué está
declarado en la librería y no heredado de la página.

**Por qué la librería lo declara en vez de heredarlo.** Las tres páginas de las
demos traen `* { box-sizing: border-box }` en su propia hoja, así que sobre ellas
el defecto no pasa y **no se puede ver**: medido ahí, el antes y el después dan
idénticos. Lo que la geometría de este cromo dependía era de la página en la que
se lo suelta, que es la misma grilla saliendo bien en una integración y cortada en
la siguiente, en una casa que desde acá no se ve. Una clase le gana a `*` en
cualquier orden, así que la declaración vale aunque la página también la traiga.

**Y por qué importa más que 12,8 px.** `boxButtonCorner` recibe la caja
**verdadera** y elige la esquina libre con ella; después el DOM ponía el botón
12,8 px más allá. La esquina que la aritmética eligió por estar libre no era donde
el botón terminaba, que es sacarle el piso a la regla que la elige.

## Sobre qué página está medido, y por qué esa

Sobre `demo/multiview-offer/index.html` **tal como está en el último commit**, que
no tiene hoja de página propia y por lo tanto **no declara `box-sizing:
border-box`**. Es la única forma de que el antes y el después digan algo, y es
además la misma página sobre la que la H2 y la H4 tomaron las suyas, así que las
dos mediciones heredadas se comparan contra sus propios números.

El árbol de la corrida vivió en `/dev/shm`, con `lib/` copiado, `dist/` construido
adentro y `content/` enlazado al del repositorio; servido en el puerto **8093**.
El `dist/` del repositorio no se tocó hasta el final.

| | sha256 del `dist/` servido |
| --- | --- |
| la base (idéntica al `dist/` del repositorio antes del cambio) | `c4b3792eae42994a7f4f9a5626fdf56f26f2645eb5c28d1891ebcdf97084d4a3` |
| con el arreglo | `585311d9d443ee3ca3aa1c8646af7a6b2c33340b7a13e9af66b88d3556004997` |

Con los chequeos en verde el `dist/` del repositorio se volvió a construir y quedó
en ese segundo sha, que es byte por byte el que se midió.

## 1. La lectura del defecto: antes y después

`leer-el-rectangulo.py` vuelve a tomar la lectura que la H4 dejó en
`hallazgo-box-sizing.json`, y compara dos cosas que fallan por separado: lo que
`paintBoxes` **escribe** contra lo que el navegador **pinta**, y el botón contra el
área de imagen. **Su rojo es la corrida de antes**, con el mismo script y la misma
página.

```
### antes.json   (Chrome 153.0.8010.36, contenedor [1100, 618.8], imagen [0, 0, 1100, 618.8])
  qa-box qa-box--nw    box-sizing=content-box padding=6.4px
    escrito   550.0 x   309.4   pintado   562.8 x   322.2   sobra +12.8 x +12.8   MIDE DE MAS
    botón [6.4, 6.4, 34, 34]   adentro de la imagen
  qa-box qa-box--nw    box-sizing=content-box padding=6.4px
    escrito   550.0 x   309.4   pintado   562.8 x   322.2   sobra +12.8 x +12.8   MIDE DE MAS
    botón [556.4, 6.4, 34, 34]   adentro de la imagen
  qa-box qa-box--nw    box-sizing=content-box padding=6.4px
    escrito   550.0 x   309.4   pintado   562.8 x   322.2   sobra +12.8 x +12.8   MIDE DE MAS
    botón [6.4, 315.8, 34, 34]   adentro de la imagen
  qa-box qa-box--ne    box-sizing=content-box padding=6.4px
    escrito   550.0 x   309.4   pintado   562.8 x   322.2   sobra +12.8 x +12.8   MIDE DE MAS
    botón [1072.4, 315.8, 34, 34]   RECORTADO por el borde de la imagen

== ROJO: 4 caja(s) cuyo rectángulo no mide la caja o cuyo botón se sale de la imagen ==

### despues.json   (Chrome 153.0.8010.36, contenedor [1100, 618.8], imagen [0, 0, 1100, 618.8])
  qa-box qa-box--nw    box-sizing=border-box  padding=6.4px
    escrito   550.0 x   309.4   pintado   550.0 x   309.4   sobra +0.0 x +0.0   mide la caja
    botón [6.4, 6.4, 34, 34]   adentro de la imagen
  qa-box qa-box--nw    box-sizing=border-box  padding=6.4px
    escrito   550.0 x   309.4   pintado   550.0 x   309.4   sobra +0.0 x +0.0   mide la caja
    botón [556.4, 6.4, 34, 34]   adentro de la imagen
  qa-box qa-box--nw    box-sizing=border-box  padding=6.4px
    escrito   550.0 x   309.4   pintado   550.0 x   309.4   sobra +0.0 x +0.0   mide la caja
    botón [6.4, 315.8, 34, 34]   adentro de la imagen
  qa-box qa-box--ne    box-sizing=border-box  padding=6.4px
    escrito   550.0 x   309.4   pintado   550.0 x   309.4   sobra +0.0 x +0.0   mide la caja
    botón [1059.6, 315.8, 34, 34]   adentro de la imagen

== VERDE: los cuatro rectángulos miden su caja y los cuatro botones caen adentro de la imagen ==
```

Los números de la corrida de antes son, al decimal, los del
`hallazgo-box-sizing.json` de la H4: `562,8 × 322,2`, padding `6,4`, botón `ne` en
`1072,4`. Es la misma lectura tomada de nuevo y no una parecida.

`esquina-ne-antes-y-despues.png` es el mismo recorte de las dos capturas, arriba
antes y abajo después: el disco cruzando el borde derecho de la imagen y el disco
entero adentro.

## 2. La medición heredada de la H2: el botón sigue siendo presionable

`H2-el-boton-de-caja-se-puede-presionar/medir-esquinas.py`, sin tocarle una línea,
contra el mismo puerto. Es la que tenía que volver a correr porque este arreglo
**mueve la geometría que ella midió**: las tres formas del ADR 0065 más la grilla
de cuatro en un teléfono, `elementFromPoint` en el centro de cada botón y un click
real que tiene que agrandar **la caja que se presionó**.

```
$ grep -E "^(===|[0-9]-cajas|4-cajas-en|ALL|SOMETHING)" h2-antes.txt h2-despues.txt
h2-antes.txt:=== antes ===
h2-antes.txt:2-cajas  1280x900  boxes=2  play=[603, 359, 74, 74]  bar=[90, 646, 1100, 60]  GREEN
h2-antes.txt:3-cajas  1280x900  boxes=3  play=[603, 359, 74, 74]  bar=[90, 646, 1100, 60]  GREEN
h2-antes.txt:4-cajas  1280x900  boxes=4  play=[603, 359, 74, 74]  bar=[90, 646, 1100, 60]  GREEN
h2-antes.txt:4-cajas-en-un-telefono  420x820  boxes=4  play=[173, 193, 74, 74]  bar=[20, 277, 380, 60]  GREEN
h2-antes.txt:ALL GREEN
h2-despues.txt:=== despues ===
h2-despues.txt:2-cajas  1280x900  boxes=2  play=[603, 359, 74, 74]  bar=[90, 646, 1100, 60]  GREEN
h2-despues.txt:3-cajas  1280x900  boxes=3  play=[603, 359, 74, 74]  bar=[90, 646, 1100, 60]  GREEN
h2-despues.txt:4-cajas  1280x900  boxes=4  play=[603, 359, 74, 74]  bar=[90, 646, 1100, 60]  GREEN
h2-despues.txt:4-cajas-en-un-telefono  420x820  boxes=4  play=[173, 193, 74, 74]  bar=[20, 277, 380, 60]  GREEN
h2-despues.txt:ALL GREEN
```

Las salidas enteras están en `h2-antes.txt` y `h2-despues.txt`; las lecturas, en
los dos `.json`; las capturas, en `fotos-h2-antes/` y `fotos-h2-despues/`. Contados
sobre los dos `.json`: **13 botones, los 13 con `belongs=true`, los 13 presionados y
los 13 agrandando la caja propia**, antes y después.

**Y lo que se movió es exactamente lo que tenía que moverse.** El diff de las trece
lecturas de esquina y rectángulo, antes contra después:

```
$ diff <(grep -oE "corner=[a-z]+ rect=\[[0-9, ]+\]" h2-antes.txt) \
       <(grep -oE "corner=[a-z]+ rect=\[[0-9, ]+\]" h2-despues.txt)
9c9
< corner=ne rect=[1162, 403, 34, 34]
---
> corner=ne rect=[1150, 403, 34, 34]
13c13
< corner=ne rect=[372, 236, 34, 34]
---
> corner=ne rect=[360, 236, 34, 34]
```

Dos líneas de trece, y son las dos `ne`: la cuarta caja a 1280 y la cuarta caja en
el teléfono, cada una 12 px a la izquierda. **Las once `nw` son idénticas**, que es
la predicción de la aritmética escrita en el comentario —el botón que se apoya en
la esquina donde las longitudes arrancan no se entera del ancho del rectángulo— y
no una coincidencia. **Ninguna esquina cambió de elección**: la regla de la H2
sigue contestando `nw, nw, nw, ne`.

## 3. La medición heredada de la H4: el botón sigue viajando con su caja

`H4-el-boton-viaja-con-su-caja/lectura-del-boton.py` y `juzgar-el-viaje.py`, sin
tocarles una línea. Los cinco gestos, cuadro por cuadro, con las cajas quietas al
lado de la que viaja como referencia de adentro de la corrida.

```
### H5-el-rectangulo-de-una-caja-es-su-caja/h4-despues.json   (Chrome 153.0.8010.36, contenedor [1100, 619], 2026-09-12T00:44:07Z)
  agrandar una vista
    primario             caja quieta (  0 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los    6.5 ms   ok
    view-caminandes-a    caja VIAJA  ( 19 cuadros intermedios)   esquina wn   deriva máx     0.1 px a los  331.9 ms   ok
    view-caminandes-b    caja quieta (  0 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los    6.5 ms   ok
    view-ed-a            sin botón en pantalla durante el gesto
  desagrandar una vista
    primario             caja quieta (  0 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los   42.4 ms   ok
    view-caminandes-a    caja VIAJA  ( 22 cuadros intermedios)   esquina wn   deriva máx     0.1 px a los  193.3 ms   ok
    view-caminandes-b    caja quieta (  0 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los   42.4 ms   ok
    view-ed-a            sin botón en pantalla durante el gesto
  agrandar el primario
    primario             caja VIAJA  ( 22 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los    8.3 ms   ok
    view-caminandes-a    caja quieta (  0 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los    8.3 ms   ok
    view-caminandes-b    caja quieta (  0 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los    8.3 ms   ok
    view-ed-a            sin botón en pantalla durante el gesto
  desagrandar el primario
    primario             caja VIAJA  ( 22 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los    5.9 ms   ok
    view-caminandes-a    caja quieta (  0 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los   55.3 ms   ok
    view-caminandes-b    caja quieta (  0 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los   55.3 ms   ok
    view-ed-a            sin botón en pantalla durante el gesto
  subir una tercera cámara
    primario             caja quieta (  0 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los   12.4 ms   ok
    view-caminandes-a    caja quieta (  0 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los   12.4 ms   ok
    view-caminandes-b    caja VIAJA  ( 16 cuadros intermedios)   esquina wn   deriva máx     0.0 px a los   12.4 ms   ok
    view-ed-a            caja quieta (  0 cuadros intermedios)   esquina en   deriva máx     0.0 px a los  283.5 ms   ok

== VERDE: el botón se mantuvo en su esquina en todos los cuadros de todos los gestos ==
```

Las dos corridas enteras, con las cajas quietas, están en `h4-antes.txt` y
`h4-despues.txt`; los cuadros crudos, en los dos `.json`. La deriva máxima es la
misma del informe de la H4 —0,1 px sobre 380 ms— antes y después.

## 4. La suite y las costuras

| chequeo | resultado | archivo |
| --- | --- | --- |
| `npm test` | **183 pruebas, 183 pasan, 0 fallan** | `suite.txt` |
| `npm run check` | verde: 3 ocurrencias en la lista aceptada, cero hits en la segunda costura | `costuras.txt` |

**No hay prueba nueva.** El arreglo es una declaración de estilo: no produce una
función pura, y lo que la mira es la lectura del punto 1, que corre sobre un
navegador de verdad y tiene su rojo.

**La costura del ADR 0015 se puso roja en el camino y eso cambió el comentario.**
La primera redacción decía que *"las tres páginas de las demos"* traen el reset, y
`verificar-cortes.mjs` lo marcó: la librería no nombra a la aplicación que la usa.
El comentario quedó escrito sin nombrarlas —una página que declara un reset propio—
que además es lo que corresponde, porque el defecto no es de esas tres páginas sino
de cualquiera que no traiga el reset.

## 5. Lo que el diagnóstico de la H4 no había previsto

**`.qa-box` era el único lugar de la librería donde `box-sizing` podía cambiar
algo, y está verificado y no supuesto.** Los seis lugares donde la librería escribe
un `width`/`height` explícito son `lib/controls.js:1368` (el relleno de la barra),
`:1413` (una marca), `:1658-1659` (la caja) y `lib/renderer.js:1108-1109` y
`:1170-1171` (un anuncio y el contenido primario). `lib/renderer.js` **no tiene la
palabra `padding` en todo el archivo**, y `.qa-track__fill` y `.qa-mark` tampoco
tienen padding, así que en los otros cinco el modo de caja no cambia un píxel.

**La otra regla que escribe `width: 100%` con padding adentro —`.qa-views__row`— no
tiene el defecto, y por una razón que no se deduce leyendo la hoja.** Es un
`<button>`, y la hoja del navegador ya le pone `box-sizing: border-box` a los
controles de formulario. Medido sobre la misma página sin reset
(`hallazgo-la-fila-del-selector.txt`):

```
panel 210.0 px, padding 6.5px/6.5px, ancho de contenido 197.0
fila  195.0 px, box-sizing border-box, padding 9.75px
la fila se pasa -2.0 px del ancho de contenido del panel
desborde horizontal del panel: 0 px
```

**El chequeo de sintaxis del build atajó un error que no tiene nada que ver con la
sintaxis.** La hoja de la librería vive adentro de un template literal de
JavaScript, así que el backtick con el que este repositorio cita un identificador
en sus comentarios —`` `paintBoxes` ``— corta el string. La primera versión del
comentario los tenía y `construir-libreria.sh` salió con
`SyntaxError: Unexpected identifier 'paintBoxes'`. El comentario quedó sin
backticks. Es una restricción del archivo que no está escrita en ningún lado y que
el próximo comentario dentro de `CONTROLS_CSS` va a volver a encontrar.

## 6. Lo que esta tarea no mira

- **Ningún tamaño de ventana que no sea 1600×1000** para la lectura del punto 1 y
  el viaje, y 1280×900 y 420×820 para la de la H2.
- **Ni `sw` ni `se`**, que ninguna de las formas del ADR 0065 llega a usar. El
  arreglo las alcanza por la misma aritmética —el rectángulo dejó de sobrar por
  abajo y por la derecha— pero no están medidas porque no hay cómo llegar a ellas.
- **iOS**, como toda la fase.

## 7. Los archivos

| | |
| --- | --- |
| `leer-el-rectangulo.py` | la lectura del defecto, con su verdicto |
| `antes.json`, `lectura-antes.txt` | la corrida sin el arreglo, que es el rojo |
| `despues.json`, `lectura-despues.txt` | la corrida con el arreglo |
| `antes-4-cajas.png`, `despues-4-cajas.png` | la grilla de cuatro entera, antes y después |
| `esquina-ne-antes-y-despues.png` | el recorte de la esquina `ne` de las dos |
| `h2-antes.txt`, `h2-despues.txt`, `h2-*.json`, `fotos-h2-*/` | la medición heredada de la H2, las dos corridas |
| `h4-antes.txt`, `h4-despues.txt`, `h4-*.json` | la medición heredada de la H4, las dos corridas |
| `h4-despues-viaje-150ms.png` | el botón montado en su caja a mitad del viaje |
| `hallazgo-la-fila-del-selector.txt`, `.png` | la fila del selector, que no tiene el defecto |
| `suite.txt`, `costuras.txt` | `npm test` y `npm run check` verbatim |
