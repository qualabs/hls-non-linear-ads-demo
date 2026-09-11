# T-03 -- La tabla de geometría, de N a `viewport`

La función pura de ADR 0065 vive en `lib/signalling.js`, al lado de
`resolveElement`: `viewportsFor(count)` devuelve la lista de `viewport` en orden,
y `MAX_BOXES` sale de la tabla misma en vez de estar tipeado al lado. Los tests
son `test/multiview-geometry.test.js`, doce, todos verdes.

## La aserción del N=4 se hace contra `test/fixtures/`, y no contra `demo/`

El plan pedía assertar contra `demo/compatibility-pair/signalling/asset-list-multiView.json`
leído. El ADR 0023 prohíbe exactamente eso —`test/` lee sólo `test/` y `lib/`, y
"que `test/` lea `demo/<nombre>/`" está en su tabla de descartados—, así que la
aserción lee la copia que ya vive en `test/fixtures/asset-lists/asset-list-multiView.json`.

**No hubo que copiar nada**: el Quad ya estaba ahí, entre los trece que el ADR
0023 mandó copiar enteros, con su procedencia anotada en `test/fixtures/README.md`.
El día de esta task las dos copias son idénticas byte a byte:

    $ diff demo/compatibility-pair/signalling/asset-list-multiView.json \
           test/fixtures/asset-lists/asset-list-multiView.json && echo IDENTICAL
    IDENTICAL

La intención del plan se cumple igual: los cuatro `viewport` salen del archivo
real leído, y no de una copia escrita a mano adentro del test. Y se leen
**atravesando la resolución** —`resolveAssetList`, con los elementos ya ordenados
por `zDepth` y las cajas ya parseadas— y no del JSON crudo, porque lo que tiene
que coincidir con la tabla es lo que termina en pantalla.

## `sx == sy`, chequeado a mano contra la aritmética de `movePrimary`

`area` es la imagen del primario, 1280x720. `sx` y `sy` son las dos divisiones
que `movePrimary` hace sobre la salida de `boxToPixels`. Números completos en
`sx-sy-a-mano.txt`; acá las dos filas que deciden:

| forma | `viewport` del primario | px | `sx` | `sy` | \|sx-sy\| |
| --- | --- | --- | --- | --- | --- |
| N=2 de la tabla | `25 50 25 0` | 640 x 360 | 640/1280 = 0,5 | 360/720 = 0,5 | 0 |
| N=2 descartado | `0 50 0 0` | 640 x 720 | 640/1280 = 0,5 | 720/720 = 1 | 0,5 |

El umbral de `movePrimary` es 0,001, así que la fila descartada dispara la
advertencia de deformación en cada cuadro y la de la tabla no la dispara nunca.
El N=3 y el N=4 dan los mismos 640 x 360 sobre esa área. Las bandas negras del
N=2 son lo que cuesta esa igualdad.

**La igualdad no es literal sobre un área fraccionaria.** Sobre la imagen que la
T-03 de la fase 01 midió en pantalla completa —1601,778 de ancho sobre un
contenedor de 1920x901— las dos divisiones difieren en un ulp: 0,5000000000000001
contra 0,5. El test acota por `Number.EPSILON`, que es cuatro órdenes de magnitud
por debajo del umbral del renderizado.

## La campaña de mutación, scopeada

Seis roturas, una por regla, cada una corriendo **sólo** los tests que cubren esa
regla (`--test-name-pattern`) y no la suite entera. Las seis dieron rojo. Salida
verbatim en `mutaciones.txt`, y el script que la corre en `mutaciones.py`, que se
vuelve a correr con `python3 <este directorio>/mutaciones.py` y sale 0 sólo si las
seis siguen dando rojo.

Corrieron sobre una copia del árbol en `/dev/shm`, no sobre el árbol vivo: hay
otras tasks de la fase corriendo en paralelo y una mutación de `lib/` las habría
puesto en rojo por un motivo que no es el suyo.

| # | regla | rotura | tests |
| --- | --- | --- | --- |
| 1 | los cuatro `viewport` del N=4 son los del Quad | se dan vuelta dos viewports de la grilla llena | 2 rojos |
| 2 | el N=2 lleva bandas para que `sx == sy` | el N=2 pasa a dos mitades de alto completo | 2 rojos |
| 3 | el orden es el de la selección | la lista se devuelve invertida | 3 rojos |
| 4 | N=1 es la lista vacía (ADR 0071) | N=1 devuelve el cuadro entero | 2 rojos |
| 5 | un N sin forma no compone nada y lo dice | un N sobre el tope devuelve la última fila | 2 rojos |
| 6 | la tabla se entrega copiada y no prestada | se devuelve la fila de la tabla misma | 1 rojo |

El chequeo de `sx == sy` tiene además su propio control adentro de la suite —el
N=2 descartado, medido con la misma aritmética, que sí deforma—, porque una
igualdad que siempre se cumple no prueba nada hasta que se ve fallar.

## Suite y costuras

`suite.txt` es el conteo de `npm test` con el árbol entero, `suite-de-la-task.txt`
los doce de este archivo, y `costuras.txt` la salida de `npm run check`.
