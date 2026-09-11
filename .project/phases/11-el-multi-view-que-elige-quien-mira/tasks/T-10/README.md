# T-10 — La salida, por sus dos entradas

Salir del multi view devuelve el contenido principal como venía, y lo hace por
una sola implementación: `clear()`. Tiene tres entradas y ninguna tiene código
propio.

## 1. Lo que no se construyó, que es el resultado de la task

**`lib/renderer.js` y `lib/multiview.js` no cambian.** El invariante ya estaba
escrito antes de esta task y lo que había que hacer era no romperlo:

| pieza | dónde | qué garantiza |
| --- | --- | --- |
| `clear()` | `lib/renderer.js` | `node.removeAttribute('style')` sobre el primario y `node.volume = 1`. No restaura un valor guardado: **borra el atributo y la hoja de estilos de la página vuelve a mandar**, así que no hay estado que pueda quedar desincronizado porque no se guarda ninguno |
| `exit(state)` | `lib/multiview.js` | devuelve `emptySelection(offer)`, que es el mismo estado al que llega destildar la última vista. No es una ruta: es el mismo destino |
| `apply()` | `lib/renderer.js` | `setFocus(null)` cuando el nodo que tenía el foco dejó de existir, que es lo que pasa al salir |

**No hay `exitMultiview()` y no se escribió ninguno.** Esa era la segunda fuente
de verdad que el ADR 0071 existe para no tener, y el `Constraints` de esta task
—*no se toca `clear()` más que lo que la T-01 ya le hizo*— se cumplió al pie: el
único cambio que la task propone sobre `lib/renderer.js` es una línea de
documentación, y viaja adentro del parche porque describe el botón.

## 2. El botón vive en el cromo, y por eso va como parche

La T-10 nombraba `lib/controls.js` entre sus *entry points*, y ese archivo es de
otra task que está corriendo en paralelo. El botón está escrito y medido, pero
**no aplicado**: `way-out.patch`, igual que hizo la T-09 con su cableado.

```bash
git apply .project/phases/11-el-multi-view-que-elige-quien-mira/tasks/T-10/way-out.patch
```

Generado contra `lib/controls.js` md5 `4af7036c3209fc3d65ad027733afe329` y
`lib/renderer.js` md5 `c119eebb76bbf17b4d95104979c170bc`. **`controls.js` se está
moviendo mientras tanto**, así que si el `git apply` se queja hay que regenerar
las cinco ediciones y no forzarlo; son todas de contexto local.

Qué agrega, y nada más que eso:

| | |
| --- | --- |
| `ICON.oneView` | una pantalla sola, dibujada como marco. Es la forma de adónde lleva, que es la misma regla con la que está dibujado el ícono de cuatro cajas del selector; marco y no bloque lleno porque un cuadrado sólido al lado de cuatro cuadrados sólidos se lee como un *stop* |
| `wayOutBtn` | en la fila de arriba y **primero**, o sea el extremo de afuera: la fila está anclada al borde derecho, así que el botón que aparece y desaparece la estira hacia la izquierda y ni el audio ni el selector se mueven debajo del dedo |
| la visibilidad | `wayOutBtn.hidden = !boxes.length`, adentro del mismo `if` que decide qué botones de caja existen. Es la misma pregunta contestada una vez: si hay composición, hay de dónde salir |
| la presión | `multiview.exit(offer)` y nada más. Sin restaurar nada, que es el punto |

Lo que **no** agrega: ni una línea de CSS —`.qa-btn` ya lo viste— ni estado
propio en el cromo.

## 3. Las tres mediciones, una por entrada

`medir-salida.py` sobre una copia del SDK en `/dev/shm` con el parche puesto,
`dist/` reconstruido, sirviendo `demo/multiview-offer` en el puerto 8087, Chrome
del sistema por Playwright, 1280×900. Cada entrada corre en su **propia carga de
página**, así que ninguna hereda el estado de la anterior. Lecturas completas en
`lecturas.json`.

| entrada | momento | `style` del primario | `transform` | `volume` | nodos de vista | botones de caja |
| --- | --- | --- | --- | --- | --- | --- |
| **A** el botón, desde una caja a cuadro entero | antes | **null** | none | **1** | 0 | 0 |
| | con la grilla y el audio tomado | escrito | `matrix(0.5, 0, 0, 0.5, 0, 0)` | 0 | 3 | 1 |
| | **después** | **null** | none | **1** | 0 | 0 |
| **B** destildar la última vista | antes | **null** | none | **1** | 0 | 0 |
| | con la grilla y el audio tomado | escrito | `matrix(0.5, 0, 0, 0.5, 0, 154.688)` | 0 | 1 | 2 |
| | **después** | **null** | none | **1** | 0 | 0 |
| **C** la ventana que se cierra con cosas tildadas | antes | **null** | none | **1** | 0 | 0 |
| | con la grilla y el audio tomado | escrito | `matrix(0.5, 0, 0, 0.5, 0, 0)` | 0 | 2 | 3 |
| | **después** | **null** | none | **1** | 0 | 0 |

**Las tres salidas dan lo mismo, y eso es lo que prueba que hay una sola
puerta.** La lectura del medio es la que le da a las otras dos una forma de
fallar: con la grilla arriba el atributo `style` está escrito, el primario está
en 0 porque una caja tiene el foco, y hay nodos en la capa. Un chequeo que
pasara de casualidad tendría que pasar también ahí.

El audio se toma a mano en las tres —un toque sobre una caja de video (ADR
0028)— justamente para que `volume == 1` pueda dar distinto: sin eso el primario
vale 1 durante toda la corrida y la comparación no mide nada. El anillo del foco
aparece en la lectura del medio (`rings`) y no aparece en la de después.

En A la salida se toma desde el estado que el diagrama llama **Agrandada**, que
es la transición que el resto de la fase no ejerce.

Capturas: `t10-a-0-grilla-de-cuatro.png` (la grilla de cuatro con el botón
nuevo en la fila de arriba), y el par antes/después de cada entrada.

## 4. La campaña de mutación

Una rotura por regla, sobre la misma medición (`mutaciones.txt`, guion
`mutar.sh`):

| | qué se rompió | qué se puso rojo |
| --- | --- | --- |
| **M1** | `exit()` devuelve el mismo estado: el botón no llega a `clear()` | **A rojo** (`style` escrito, `volume` 0, 3 nodos) y **B y C verdes** |
| **M2** | se saca `node.volume = 1` de `clear()` | las **tres** rojas en `volume=0` |
| **M3** | se saca `node.remove()` de `clear()` | las **tres** rojas, con 3, 1 y 2 nodos colgados |
| — | sin mutación, al final | las tres verdes |

**M1 es la que importa** y es la forma que tiene esta verificación de descubrir
una segunda puerta: rompe *una* entrada y la medición la separa de las otras
dos. Si mañana alguien escribe un camino propio para el botón, M1 es el chequeo
que lo ve.

## 5. El CC, con su control

`cc.txt`, verbatim. El grep sobre `lib/` da cero; el mismo grep sobre una copia
de `lib/` con una ocurrencia plantada a propósito la encuentra; y sobre el
`lib/` **con el parche puesto** vuelve a dar cero, que es lo que dice que el
botón no trae una palabra del CC con él.

```
$ /usr/bin/grep -i -n "texttrack\|cue\|subtitle\|caption" lib/*.js ; echo "exit=$?"
exit=1

$ /usr/bin/grep -i -n "texttrack\|cue\|subtitle\|caption" lib-plantada/*.js ; echo "exit=$?"
lib-plantada/renderer.js:1197:    video.textTracks[0].mode = 'showing';
exit=0
```

## 6. Dos hallazgos, los dos fuera del alcance de esta task

**H1 — el gesto que mueve el audio deja de funcionar sobre una caja cuya
composición cambió, y deja la composición entera en silencio.** Es una regresión
de la T-01 y la evidencia es `bug-foco.json`, que corre el **mismo gesto sobre la
misma caja dos veces**:

| | qué pasó | programa | la vista tocada | anillo | ¿se oye algo? |
| --- | --- | --- | --- | --- | --- |
| 2 | con una sola vista arriba, se la toca | 0 | **1** | sí | sí |
| 5 | sube una segunda vista y se toca **la misma caja** | 0 | 0, muteada | **no** | **no** |

El mecanismo: `applyPlan` reescribe `slot.entry.element` con el elemento que el
contrato entrega en esa pasada (`lib/renderer.js:477`), pero el listener de
`pointerdown` que `createNode` le puso al nodo cerró sobre el elemento con el que
el nodo se creó (`lib/renderer.js:692`). Cuando la composición cambia sin destruir
el nodo, los dos dejan de ser el mismo objeto: el toque hace `setFocus(viejo)`,
`effectiveVolumeOf` compara por identidad y devuelve 0 **para todos**, y ningún
nodo lleva el anillo porque ninguno es el enfocado. No se corrige sola: `apply()`
es la que anularía ese foco fantasma y sólo corre cuando hay un plan que aplicar,
así que el silencio dura hasta el próximo cambio de composición. No se tocó.

**H2 — en la grilla de 2×2 el botón de agrandar de la cuarta caja queda debajo
del botón de play.** El de play mide `[603, 359, 74, 74]` y el de la cuarta caja
`[646, 403, 34, 34]`: se superponen en unos 31×30 de los 34×34, y Playwright no
puede presionarlo. La T-09 eligió la esquina de arriba a la izquierda porque *"es
la única esquina libre en las tres formas del ADR 0065"*, y en la de cuatro esa
esquina de la cuarta caja **es el centro del cuadro**. Se ve en
`t10-a-0-grilla-de-cuatro.png`. No se tocó.

## 7. Los archivos

| | |
| --- | --- |
| `way-out.patch` | el botón, sin aplicar |
| `lecturas.json` | las nueve lecturas completas de las tres entradas |
| `mutaciones.txt` | la campaña, con su control sin mutación |
| `cc.txt` | el grep del CC y su control |
| `suite.txt` | `npm test` y `npm run check` verbatim |
| `bug-foco.json` | el hallazgo H1, con su referencia |
| `medir-salida.py`, `bug-foco.py`, `mutar.sh` | los guiones |
| `t10-*.png` | la grilla de cuatro y el antes/después de cada entrada |
