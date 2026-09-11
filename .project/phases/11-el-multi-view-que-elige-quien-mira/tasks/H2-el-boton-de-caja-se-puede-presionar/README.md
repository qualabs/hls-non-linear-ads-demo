# H2 — El botón de cada caja se puede presionar, en las tres formas

El hallazgo H2 de la T-10: en la grilla de dos por dos el botón de agrandar de la
cuarta caja queda debajo del de play y no se puede presionar. Medido por la T-10
en `[646, 403, 34, 34]` contra un play en `[603, 359, 74, 74]`.

## 1. El arreglo, y por qué a ese nivel

**La esquina dejó de estar escrita.** La T-09 la eligió a mano —arriba a la
izquierda, *"la única esquina libre en las tres formas"*— y esa regla no puede
equivocarse sobre la esquina: sólo puede equivocarse sobre **qué hay encima**,
que es justamente lo que no está adentro de la regla. En la grilla de cuatro esa
esquina de la cuarta caja **es el centro del cuadro**.

Lo que se escribió en su lugar es el invariante: **el control de una caja no se
pisa con otro control**. `boxButtonCorner(box, taken, button)` recorre las cuatro
esquinas en orden y devuelve **la primera que no cae sobre ninguna** de las
piezas del cromo; si ninguna está libre, la menos tapada, que es la misma
comparación con el empate ya resuelto y no una rama aparte.

**`taken` se mide, no se escribe.** Son tres rectángulos leídos de la pantalla en
el mismo `paintBoxes` que ya calcula dónde va cada caja: la fila de arriba a la
derecha, el play del medio y la barra de abajo. No hay una tabla por forma, no
hay un caso especial para la cuarta caja, y la grilla de dos por dos no se nombra
en ningún lado del código.

El nivel es ése porque **el defecto no es la esquina, es que la esquina estuviera
escrita**: cualquier arreglo que moviera esa caja a otra esquina fija vuelve a
ser una regla sobre la que la próxima forma —o la próxima pieza de cromo— tiene
la misma oportunidad de estar en desacuerdo sin que nada avise.

Archivos: `lib/controls.js` (único archivo tocado de `lib/`) y
`test/box-button-corner.test.js`.

## 2. Qué cambia en pantalla, y qué no

| forma | esquinas antes | esquinas después |
| --- | --- | --- |
| 2 cajas | nw, nw | **nw, nw** |
| 3 cajas | nw, nw, nw | **nw, nw, nw** |
| 2×2 | nw, nw, nw, nw | nw, nw, nw, **ne** |

Se mueve **un botón de una forma**. Las otras dos ya estaban bien y quedan
idénticas, lo cual es la mitad de la medición: un arreglo que moviera todos sería
un cambio en dos pantallas que nadie reportó.

## 3. La medición en el navegador: quién recibe el punto

`medir-esquinas.py`, sobre una copia del SDK en `/dev/shm` con `dist/`
reconstruido, sirviendo `demo/multiview-offer` en el puerto 8088, Chrome del
sistema por Playwright. Salida completa en `medicion-fix.txt`, lecturas en
`lecturas-fix.json`, capturas `fix-*.png`.

**No se lee ni un estilo**, y eso es deliberado: el botón está visible, mide sus
34 px y está donde la aritmética lo puso. Lo que está mal no está adentro del
botón, está encima. Tres lecturas por caja:

| | qué contesta |
| --- | --- |
| `owner` | `document.elementFromPoint` en el **centro** del botón, que es el punto al que apunta un dedo. Es el hit test del browser, el mismo por el que pasa una presión |
| `belongs` | si ese elemento es el botón o algo adentro del botón |
| `click` | un click real de Playwright sin `force`, y lo que prueba que **llegó** no es que no haya tirado excepción sino que la composición se fue a cuadro entero **en la caja que se presionó**, leído del rótulo del único botón que queda |

Cuatro lecturas, las tres formas del ADR 0065 más la grilla de cuatro en una
pantalla de teléfono: **12 + 4 botones, los 16 con `belongs=true`, los 16
presionados, y los 16 agrandando la caja propia.**

```
2-cajas                 1280x900  boxes=2  play=[603, 359, 74, 74]  GREEN
3-cajas                 1280x900  boxes=3  play=[603, 359, 74, 74]  GREEN
4-cajas                 1280x900  boxes=4  play=[603, 359, 74, 74]  GREEN
   Elephants Dream, early  corner=ne rect=[1162, 403, 34, 34] point=[1179, 420] belongs=True
      overPlay=[0, 0, 0] clicked=True enlargedIsTheOnePressed=True
4-cajas-en-un-telefono   420x820  boxes=4  play=[173, 193, 74, 74]  GREEN
ALL GREEN
```

## 4. La rotura que lo pone en rojo

La misma medición contra un build con la regla de la T-09 puesta de vuelta
(`return BOX_CORNERS[0]`). Salida en `medicion-m1.txt`, lecturas en
`lecturas-m1-navegador.json`, capturas `m1-esquina-fija-*.png`.

```
2-cajas                 1280x900  GREEN
3-cajas                 1280x900  GREEN
4-cajas                 1280x900  RED
   Elephants Dream, early  corner=nw rect=[646, 403, 34, 34] point=[663, 420] belongs=False
      owner=button.qa-btn.qa-btn--play in qa-btn qa-btn--play[play or pause the composition]
      overPlay=[31, 30, 930] clicked=False  Locator.click: Timeout 4000ms exceeded.
4-cajas-en-un-telefono   420x820  RED
   Elephants Dream, early  corner=nw rect=[216, 236, 34, 34] belongs=False
      overPlay=[31, 31, 961] clicked=False  Locator.click: Timeout 4000ms exceeded.
```

`[646, 403, 34, 34]` y `31×30` son, al píxel, los números de la T-10. **Dos
formas quedan verdes**, que es lo que separa esta medición de una que se pone
roja por cualquier cosa.

## 5. La suite pura, y su campaña de mutación

`test/box-button-corner.test.js`, seis pruebas sobre la regla. Las formas salen
de `viewportsFor` y `boxToPixels` —el código real— y los rectángulos del cromo
son los medidos en la corrida de arriba, anotados con el tamaño de imagen al que
se leyeron.

`mutar.sh`, una rotura por regla, salida en `mutaciones.txt`:

| | qué se rompió | qué se puso rojo |
| --- | --- | --- |
| **M0** | nada, el control | las 6 verdes |
| **M1** | la regla de la T-09: siempre `nw` | 3 rojas (las tres formas, la del 2×2, el desempate) |
| **M2** | siempre `se` | 4 rojas |
| **M3** | el orden de preferencia dado vuelta | 3 rojas (la del 2×2, las dos formas que ya estaban bien, la aritmética de las esquinas) |
| **M4** | nada otra vez | las 6 verdes |

Las seis pruebas se vieron fallar al menos una vez.

## 6. La suite entera

`suite.txt`, verbatim: `npm test` → **176 pruebas, 176 pasan**, y
`npm run check` con las dos costuras en verde. Eran 170 antes de esta corrida.

## 7. Lo que la T-10 no había previsto

**La cuarta caja también está tapada en un teléfono, y ahí es peor.** A 420 px
el solapamiento es `31×31` de `34×34` en vez de `31×30`: la imagen es más chica,
el play no baja de 74 px y el botón de caja sube a 44 px por el `any-pointer:
coarse`. La T-10 lo midió sólo a 1280.

**La barra entra entera en `taken` y eso es más de lo que gana un hit test.**
Adentro de la barra sólo el riel y el botón de pantalla completa toman punteros;
los relojes y la marca no, así que un botón encima del reloj sería presionable.
Igual no es lugar para uno, y está escrito en el archivo por qué.

**Hoy el que decide es siempre el play.** En las cuatro lecturas, la fila de
arriba y la barra nunca se llevan una esquina. Están en la lista por la misma
razón por la que la esquina dejó de estar escrita: una regla que conoce sólo el
mueble que resultó importar es la regla que estaba mal.

## 8. Los archivos

| | |
| --- | --- |
| `medir-esquinas.py` | la medición del navegador, las cuatro lecturas |
| `medicion-fix.txt`, `lecturas-fix.json` | la corrida con el arreglo |
| `medicion-m1.txt`, `lecturas-m1-navegador.json` | la corrida con la regla de la T-09 puesta de vuelta |
| `mutar.sh`, `mutaciones.txt` | la campaña sobre la suite pura |
| `suite.txt` | `npm test` y `npm run check` verbatim |
| `fix-*.png` | las tres formas y el teléfono, con el arreglo |
| `m1-esquina-fija-4-cajas*.png` | la grilla de cuatro con el defecto puesto |
