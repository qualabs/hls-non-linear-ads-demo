# T-04, post-ejecución — el player que la guiada no soltaba

Nicolás probó la demo y encontró el defecto que él llama el más grave: **termina la guiada,
aprieta play, y el programa no arranca.** Eso rompe la mitad de la propuesta, porque el
flujo es guiada y después libre.

Su intuición fue la correcta y vale citarla porque nombra el defecto mejor que el síntoma:
*"hay algo de los controles que la aplicación intenta controlar del player que no suelta"*.

## Lo que se midió antes de arreglar nada

Cuatro caminos, porque "no se reproduce" tiene más de una causa posible y arreglar la
primera que se me ocurriera no probaba nada.

| camino | resultado |
| --- | --- |
| la guiada termina sola, y `play()` desde JS | **anda**: `paused: false`, el tiempo avanza 54,73 → 55,93 |
| la guiada termina sola, y el botón del cromo | **anda**: pausa, reproduce, pausa, con el tiempo avanzando |
| **saltear con una placa arriba**, y después play | **ROTO**: `story: done`, placa oculta, y **dos clicks del cromo y un `play()` de JS dejan `paused: true` en `t: 0`** |
| con una placa arriba, un click al cromo | correcto: el player se queda quieto, que es la invariante |

O sea que el camino que Nicolás describió —terminar y apretar play— **no era el que
fallaba**, y el que fallaba era el otro: **apretar el botón de saltear mientras había una
placa en pantalla.**

## Qué era

La guarda que la T-04 había agregado: *mientras una placa está arriba, cualquier `play`
vuelve a pausar*. Estaba escrita como **un listener permanente que consultaba una bandera**,
`speaking`.

Y `say()` tiene dos salidas tempranas, `if (!running) return`, para cuando la guiada termina
por debajo mientras una placa está en pantalla. **Esas dos salidas se van sin apagar la
bandera.** Así que apretar saltear durante una placa dejaba `speaking` en `true` para
siempre, y desde ahí **todos** los `play` se cancelaban: los del cromo, los de la página, y
el que el propio `end()` hace al terminar.

**El player no estaba muerto: seguía agarrado.**

## El arreglo, y por qué no es "apagar la bandera también en `end()`"

Apagarla ahí habría hecho desaparecer el síntoma y habría dejado el defecto: la limpieza
repartida entre varios lugares, y cada lugar nuevo una chance de olvidarse.

Lo que se hizo es cambiar la forma: **la guarda ahora vive lo que vive la placa.** Se
agrega con `addEventListener` cuando la placa aparece y se saca cuando la placa se va, y
hay **una sola función que suelta todo lo que la guiada tomó** —el listener, la placa y el
loop—, que es la que `end()` llama. Todas las salidas de `say()`, incluidas las dos que
abandonan a mitad de camino, pasan por ahí.

La diferencia entre las dos formas es la que importa:

> **Una bandera que significa "solté" se puede quedar prendida. Un listener que no está
> puesto no puede.**

## Lo verificado después

Los cuatro caminos, otra vez, y ahora los cuatro correctos:

- **saltear con placa arriba** → `paused: false`, el programa corre, y el botón del cromo
  alterna bien (pausa en 0,9 s, reproduce hasta 2,0);
- **saltear con el player corriendo** entre beats → sigue corriendo, y el cromo alterna;
- **la guiada termina sola** → corriendo en 55,45 s, y el cromo alterna tres veces;
- **la invariante que no se podía perder**: con una placa arriba, un `pointerdown` más un
  click al botón del cromo **más un `play()` de JS** dejan el player en `paused: true` y la
  guiada en `running`.

`npm test` en 55 verdes, `npm run check` en `both seams hold.`, `npm run mutaciones` con las
siete roturas en rojo.

## Lo que esto dice sobre cómo se verificó la T-04

Es la segunda vez que esta guarda muerde, y las dos por el mismo motivo: **es un pedazo de
estado global con un ciclo de vida implícito.** La primera vez trabó el guion entero porque
el orden de dos líneas estaba invertido, y se arregló moviendo una línea — o sea, se
arregló el caso y no la forma. Si en ese momento se hubiera cambiado la forma, este defecto
no habría existido.

Y la verificación de la T-04 probó **tres invariantes de la guiada corriendo** y ninguna del
estado en que la deja. La lista de invariantes miraba lo que la guiada hace, no lo que
devuelve.
