# T-09 — Agrandar y desagrandar

Cada caja de la composición tiene un botón que la lleva a cuadro entero y le da
el audio, y mientras una está grande hay un solo botón, el que la devuelve a su
lugar. Los dos aparecen con el cromo y se van con él.

## 1. Dónde vive el botón, y por qué ahí y no sobre la caja

El `TASKS.md` nombraba `lib/renderer.js` —`createNode`— como el lugar del botón.
**No puede ir ahí**, y la razón es una decisión de esta misma fase: agrandar es
dos cosas a la vez y **ningún lado es dueño de las dos**. La caja pasa a cuadro
entero, que es el estado de quien mira (`lib/multiview.js`), y la caja se queda
con el audio, que es el índice único del renderizado (`setFocus`). El ADR 0072
dice que el renderizado **nunca aprende qué es una oferta**, así que el
renderizado no puede llamar a `enlarge`.

El lugar que sí puede es el cromo, que ya es dueño de la mueblería sobre la
imagen (ADR 0015) y **ya tiene esa costura abierta**: `releaseFocus` existe desde
la corrección del ADR 0031 exactamente porque el cromo necesitaba mover el foco
sin ser su dueño. El botón de agrandar es el segundo usuario de esa costura.

| pieza | archivo | qué hace |
| --- | --- | --- |
| `boxesOf(state)` | `lib/multiview.js` | qué cajas hay y cómo se llaman. Con una agrandada devuelve **una**: las otras siguen ahí y siguen reproduciendo, pero están tapadas, y un control sobre una imagen que nadie ve no apunta a nada |
| `.qa-boxes` | `lib/controls.js` | un rectángulo por caja, en los píxeles que el renderizado le dio, con el botón en la esquina de arriba a la izquierda —la única esquina libre en las tres formas del ADR 0065 y también a cuadro entero |
| `focusOn(id)` | `lib/renderer.js` | **pendiente de cablear**: ver `wiring.patch` |

**Los dos gestos no se pisan y no hay propagación que detener.** El gesto que
mueve sólo el audio es un `pointerdown` sobre la caja de video (ADR 0028), y esa
caja está en la capa de abajo; el botón está en la del cromo, así que una
presión sobre el botón no llega al video. Medido, no deducido: la lectura 5 de
`lecturas.txt` agranda una caja **que ya tenía el foco**, y si la presión se
filtrara el toggle de la caja le sacaría el audio y la caja grande quedaría
muda. Sale en 1.

## 2. Lo que falta cablear: `wiring.patch`

`lib/renderer.js` y `lib/concurrent-hls.js` no eran de esta task, así que el
cableado va acá en lugar de aplicado. Son dos agregados y ninguno cambia nada de
lo que ya andaba:

- `lib/renderer.js`: `focusOn(id)`, el espejo de `releaseFocus` —el contenido
  primario y una imagen fija significan "nadie", porque ninguno es enfocable
  (ADR 0027) y lo que hace que el programa sea lo único que se oye es
  precisamente que nadie tenga el foco— y una palabra más en el handle.
- `lib/concurrent-hls.js`: una línea, hermana de la de `releaseFocus`.

```bash
git apply .project/phases/11-el-multi-view-que-elige-quien-mira/tasks/T-09/wiring.patch
```

Sin eso el botón agranda la imagen y deja la mezcla que declara el layout, que
es el modo M2 de la campaña de mutación: se ve una vista a cuadro entero y se
oye el programa debajo.

## 3. Lo que se midió

Todo lo de abajo con el cableado puesto, sobre una copia del SDK en `/dev/shm`
que servía `demo/multiview-offer` con `dist/` reconstruido, Chrome del sistema
por Playwright, 1280×900. El guion es `medir.py`.

**Las tres lecturas del volumen** (`lecturas.txt`, completo con `currentTime`,
anillo, `readyState` y rectángulos):

| momento | primario | caminandes-a | **caminandes-b** | ed-a |
| --- | --- | --- | --- | --- |
| 1, en la grilla | 1 | 0 | **0** | 0 |
| 2, con b a cuadro entero | 0 | 0 | **1** | 0 |
| 3, de vuelta en la grilla | 0 | 0 | **1** | 0 |

La tercera es idéntica a la segunda, anillo incluido: desagrandar devuelve la
geometría y no toca el audio (ADR 0069). Y la primera es distinta, que es lo que
hace que la comparación pueda fallar.

**Nada se rebuffera.** Las cuatro cajas atraviesan agrandar y desagrandar con
`readyState` 4, `paused` en `false` y el `currentTime` avanzando parejo —
8.06 → 9.53 → 11.08 en la que se agranda, contra 53.26 → 54.98 → 56.50 del
programa. Ni un salto a cero.

**Con el cromo abajo el botón no está**: `4-chrome-down.png`, con la capa del
cromo en `opacity: 0`. El anillo del foco sí se queda, porque lo dibuja el
renderizado sobre el nodo y vive en la otra capa (ADR 0030).

**La campaña de mutación** (`mutaciones.txt`), una rotura por regla, sobre la
misma medición:

| | qué se rompió | qué se puso rojo |
| --- | --- | --- |
| M1 | desagrandar suelta el foco | la lectura 3 vuelve a ser la 1: `3 == 2` da **False** |
| M2 | agrandar no toma el foco | la lectura 2 es la 1: el control `1 != 2` da **False** |
| M3 | la presión del botón llega también a la caja | igual que M2, porque el toggle de la caja deshace el foco que el botón acababa de tomar |

Y tres mutaciones más sobre las funciones puras, con la suite (`npm test`):

| | qué se rompió | qué test se puso rojo |
| --- | --- | --- |
| U1 | `boxesOf` dibuja las cuatro cajas con una agrandada | *while one box is at full frame there is one button* — 4 en lugar de 1 |
| U2 | una caja se nombra por su `id` y no por el catálogo | *one button per box on the grid* — `primaryContent` en lugar de `Tears of Steel` |
| U3 | el elemento agrandado lleva mezcla propia, fuera de `setFocus` | *a box at full frame that did not take the audio is a box nobody hears* |

## 4. Los archivos

| | |
| --- | --- |
| `wiring.patch` | las dos adiciones que faltan, fuera de los archivos de esta task |
| `lecturas.txt` | las lecturas de los seis momentos, verbatim |
| `mutaciones.txt` | las tres mutaciones del navegador con sus lecturas |
| `medir.py` | el guion de la medición |
| `1-grid.png` … `5-enlarged-again.png` | la grilla con los cuatro botones, la caja a cuadro entero con el anillo, la vuelta con el anillo todavía puesto, el cromo abajo, y la caja que ya tenía el foco agrandada de nuevo |
