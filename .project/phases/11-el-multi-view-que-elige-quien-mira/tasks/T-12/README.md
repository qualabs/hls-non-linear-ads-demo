# Evidencia de la T-12 — la lectura base del recorrido, tomada antes de que la fase toque `lib/`

Registro de lo que se midió el 2026-09-11. No es instrucción vigente: lo único
que se vuelve a correr es el comparador, y cómo se corre lo dice él.

Es el primer paso de la T-12 y va antes que todo lo demás de la fase: la lectura
de "cómo se ve hoy la publicidad que ya anda" sólo se puede tomar mientras
`build()` y `clear()` siguen siendo los de antes. Después de la T-01 no hay
contra qué comparar, y *no rompimos nada* pasa a ser una impresión.

## Sobre qué árbol se tomó

Commit **`11a1f8c6598759ac756a59bad6d170cf3933aebb`**, con **`lib/` sin un solo
cambio sin commitear** — que es la condición que hace válida a la lectura. La
lectura guarda la lista entera de lo que sí estaba sin commitear en ese momento
(los ADR 0063 a 0072, `PROJECT.md`, `LOG.md`, la carpeta de la fase y
`demo/multiview-offer/`), así que el archivo se audita solo.

Chrome 153.0.8010.36 lanzado por Playwright con perfil propio y headless, hls.js
1.7.2, viewport 1600×1000, contenedor del reproductor 715×402, video 1280×720,
recorrido de 180 s servido por `./run.sh` en `http://localhost:8080/`.

## Qué dice la lectura, y qué no

`lectura-base.json` es el recorrido corrido de punta a punta, sin un solo seek,
leído en **catorce segundos muestreados** que cubren los cinco breaks, los cuatro
avisos del quinto, y seis momentos de programa entre medio: 10, 26, 38, 51, 63,
76, 88, 101, 113, 126, 138, 150, 162 y 174.

De cada segundo guarda, en coordenadas del contenedor: **cada nodo dibujado con
su caja en píxeles** —el contenido primario y los nodos del aviso—, más su
etiqueta, su `z-index`, su opacidad, si está mudo y a qué volumen; lo que el
contrato dice activo en ese instante (`tipo#itemId` y los elementos); y las cajas
de las marcas de la barra.

| | contrato | lo dibujado, en cajas |
| --- | --- | --- |
| 10 s | — | primario 715×402 |
| 26 s | `cornerOverlay#AD-1-CONCURRENT.0` | primario entero · `adOverlay1` 179×101 arriba a la izquierda |
| 51 s | `squeezebackLShape#AD-2-CONCURRENT.0` | primario achicado a 429×241 · barra vertical 286×402 · barra horizontal 715×161 |
| 76 s | `squeezebackLShape#AD-3-CONCURRENT.0` | la misma L, con los dos nodos como `<img>` y sin audio |
| 101 s | `multiView#AD-4-CONCURRENT.0` | cuatro cuadrantes de 358×201: el primario al 10 % y `view3` al 100 % |
| 126, 138, 150, 162 s | los cuatro avisos de `AD-5-CONCURRENT` | overlay · dos cajas de 358×201 · el lineal a cuadro entero con el primario en 0 · overlay abajo a la derecha |
| 174 s | — | primario 715×402, como antes del break |

**Lo que esta lectura no mira**, escrito acá para que no quede como supuesto: el
pane de fábrica de la izquierda (es hls.js y no esta librería), el cromo salvo
las marcas de la barra, los píxeles de la imagen decodificada (compara cajas y
no cuadros), cualquier otro tamaño de ventana, y iOS.

## El comparador y su forma de fallar

`lectura-del-recorrido.py comparar <base>` vuelve a correr los 180 s y contrasta
la lectura nueva contra la base, campo por campo: igual quiere decir igual. Sale
0 en verde y 1 en rojo. Su docstring tiene el uso completo.

**La reproducibilidad, medida y no supuesta.** Tres corridas de 180 s en tres
navegadores distintos —dos con `tomar` y una con `comparar`— dieron la misma
lectura en los catorce segundos, sin una diferencia de un píxel. Sin eso el
comparador sería un generador de rojos y nadie lo miraría.

**El control en rojo** (`control-en-rojo.txt`): la misma lectura con **un
elemento movido diez píxeles a mano** —`adOverlay1`, el overlay del break 1, de
`[0, 0, 179, 101]` a `[10, 0, 179, 101]`, en `lectura-alterada-para-el-control.json`—
sale roja, nombra el nodo y el segundo, y deja los otros trece en verde.

```
     26.0s  DISTINTO  (2 nodos en la base)
      nodo 1 (adOverlay1) · caja: base [0, 0, 179, 101] → ahora [10, 0, 179, 101]   (movida +10, +0 px; tamaño +0, +0 px)
...
== ROJO: 13 de 14 segundos iguales ==
```

## Los tres conteos de la línea de base

| chequeo | resultado | archivo |
| --- | --- | --- |
| `npm test` sobre el árbol heredado | **72 pruebas, 72 pasan, 0 fallan** | `suite-del-arbol-heredado.txt` |
| `npm test` con lo que ya hay de la fase en disco | **80 pruebas, 80 pasan, 0 fallan** | `suite.txt` |
| `npm run check` | verde: 3 ocurrencias, todas en la lista aceptada, en la primera costura; cero hits en la segunda | `costuras.txt` |
| `npm run mutaciones` | los 4 chequeos en verde sin romper nada, y las 10 roturas en rojo | `mutaciones.txt` |

Los `signalled-run.test.js` de las dos demos que ya andan entran en esos
números y también corren solos: 3 pruebas el de `compatibility-pair` y 5 el de
`hydration-break`, las ocho en verde.

## Tres cosas que aparecieron al medir

**El 72 es del árbol committeado y ya no es el de `npm test` a secas.** Las ocho
pruebas de diferencia son `demo/multiview-offer/test/signalled-run.test.js`, que
`node --test` descubre por estar en disco aunque no esté commiteado. Las dos
cifras están medidas y separadas arriba, porque la de la no-regresión es la del
árbol heredado: la otra incluye trabajo de esta fase.

**`PHASE.md` dice "cero hits en las dos" costuras y la primera tiene tres.** Son
tres ocurrencias en la lista aceptada de `verificar-cortes.mjs` —dos colores y un
título con la palabra `interstitial` en `lib/controls.js`—, así que el chequeo
está verde; lo que está mal es la frase, y la tabla de acá arriba dice lo que el
script dice.

**La tercera marca de la barra se corre un píxel a partir de los 150 s**, de
`left` 274 a 273, y lo hace igual en las tres corridas. Queda adentro de la base
porque es reproducible: un rojo ahí sería un cambio y no ruido.
