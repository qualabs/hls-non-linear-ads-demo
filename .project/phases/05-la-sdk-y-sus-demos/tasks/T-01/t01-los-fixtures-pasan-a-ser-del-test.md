# T-01 — los fixtures pasan a ser del test

La suite de la sdk dejó de leer la capa de gestión del desarrollo. Los cinco JSON
de mediciones y los trece asset-lists se copiaron a `test/fixtures/`, la tabla de
la corrida pasó a ser un fixture declarado en lugar de un parseo del script de
señalización, y las tres afirmaciones que hablan del script quedaron sobre el
script en la raíz, que es donde todavía está y donde la T-03 las va a mudar.

**Los 43 tests son los mismos 43**, con los mismos nombres y en el mismo orden:
el inventario antes y después está en `t01-inventario-antes.txt` y
`t01-inventario-despues.txt`, y `diff` entre los dos no devuelve nada.

## Qué se copió y a dónde

**`test/fixtures/mediciones/`** — los cinco JSON, con sus nombres originales,
porque el nombre es la procedencia:

| archivo | copiado de |
| --- | --- |
| `m3-resultados.json` | `phases/01-poc-web-hlsjs/tasks/T-03/` |
| `t02-los-rangos-del-programa.json` | `phases/02-sdk-y-controles/tasks/T-02/` |
| `t04-la-medicion.json` | `phases/02-sdk-y-controles/tasks/T-04/` |
| `t05-la-medicion.json` | `phases/02-sdk-y-controles/tasks/T-05/` |
| `t05-el-recorrido-con-el-break-mezclado.json` | `phases/03-breaks-multiples-y-repliegue/tasks/T-05/` |

Son 232 KB, y el 72 % es el recorrido con el break mezclado.

**`test/fixtures/asset-lists/`** — los trece de la carpeta de señalización,
completos, 56 KB.

**`test/fixtures/run.json`** — las cinco tandas declaradas, cada una con el
segundo en que se señaliza y el asset-list al que apunta su tag concurrente.
Reemplaza el parseo de `scripts/senalizar-contenido.sh` que armaba la constante
`RUN`, o sea la mitad de los tests de `program-ranges-and-volume.test.js`.

**`test/fixtures/README.md`** — de dónde vino cada archivo, y que **no hay
chequeo contra el original, por decisión**, con el costo aceptado escrito y con
qué lo compensa: el test de la demo, que vigila la corrida viva y que la T-03
escribe.

## Los tres archivos de `test/`, reescritos

- `layout-resolution.test.js`: una ruta, la del `m3-resultados.json`.
- `break-sequence-and-fallback.test.js`: cuatro rutas —el `m3-resultados.json`,
  el `list()` que toma el nombre por parámetro y el fixture de JSON roto— y dos
  comentarios que nombraban la carpeta de señalización.
- `program-ranges-and-volume.test.js`: las cuatro mediciones, `declaredLength`,
  `programRanges()`, `resolvedElements()`, la constante `RUN`, y el comentario de
  cabecera que decía de dónde salían los datos.

Los comentarios de cabecera que nombran las tasks de donde salieron los datos se
quedan, con la ruta reescrita para que digan de dónde vino la copia, y cada uno
apunta a `fixtures/README.md`, que es donde está el detalle archivo por archivo.

**La única ruta de `test/` que sale de `test/` y `lib/` es la del script de
señalización, y está en un lugar solo**, con el porqué escrito al lado: las
afirmaciones que la usan son sobre el script —que señaliza cinco breaks, que
computa el `PLANNED-DURATION` en lugar de tipearlo, y que escribe las dos
`CLASS`—, y una copia congelada del script en `fixtures/` las dejaría afirmando
sobre nada.

## Lo que se agregó, y es sobre el fixture y no sobre el parseo

En el primer test del archivo, que es el que ya afirmaba sobre el parseo:

- `run.json` declara cinco tandas, en los segundos 20, 45, 70, 95 y 120.
- Cada tanda trae su segundo (un número) y su asset-list (un nombre con la forma
  que corresponde).
- **Cada asset-list nombrado existe en `test/fixtures/asset-lists/`.** Sin eso un
  nombre mal tipeado no es un test rojo con un mensaje que se entienda, y un
  fixture truncado no es un rojo en absoluto: es una corrida más chica sobre la
  que los demás tests pasan sin mirar nada.
- Y **la tabla del script sigue teniendo cinco filas**, que ahora es una
  afirmación sobre el script y no sobre la tabla: declarada la corrida acá, nada
  más en el archivo notaría un break agregado al script o sacado de él.

## Las tres copias verificadas, y es la única vez

`t01-diffs-de-las-copias.txt`: los cinco JSON de mediciones y los trece
asset-lists, **dieciocho de dieciocho idénticos**, con el `sha256` de las dos
copias de cada uno al pie. Y `t01-run-json-contra-el-script.txt`: el mismo
parseo que la suite hacía hasta hoy, corrido una vez a mano contra el fixture que
lo reemplaza, con los cinco segundos y los cinco nombres coincidiendo.

Después de esto las dos copias no se vuelven a comparar. El ADR 0023 prohíbe un
chequeo **permanente**, no verificar la copia el día que se hace.

## La campaña de mutación: tres cortes, tres rojos

Acotada a la única regla que esta task es dueña —que la tabla de la corrida sale
del fixture y no de un parseo— y corrida sobre el test que la cubre. La salida
verbatim de las tres está en `t01-la-campana-de-mutacion.txt`, con la corrida en
verde del fixture restaurado al final. El arnés restaura el fixture y verifica
por `sha256` que quedó idéntico antes de pasar al corte siguiente.

| corte | la rotura | el rojo | radio en el archivo |
| --- | --- | --- | --- |
| **M01** | se saca la tercera tanda de `run.json` (LBox image) | `five breaks declared in fixtures/run.json` — `4 !== 5` | 3 de 12 |
| **M02** | el segundo break pasa del segundo 45 al 46 | `+ 46 / - 45` en la lista de los cinco segundos | 3 de 12 |
| **M03** | la primera tanda apunta a `asset-list-cornerOverlayy.json` | `break 1 names asset-list-cornerOverlayy.json, which is not in test/fixtures/asset-lists/` | 5 de 12 |

Ninguna quedó verde, así que no hay hallazgo de red floja. Los tres rojos caen en
el test que es dueño de la regla y con el mensaje que nombra la causa, que es la
diferencia que esta task tenía que producir: antes de la M03 un nombre mal
tipeado habría sido un `ENOENT` al cargar el módulo, y antes de la M01 una tabla
más chica no habría sido nada.

## Un hallazgo: el grep de la definición de done no puede dar vacío como está escrito

`/usr/bin/grep -rn "\.project\|signalling/" test/` devuelve **quince líneas**, y
las quince están adentro de dos de los JSON de mediciones que se acaban de
copiar: son líneas de consola que el navegador imprimió durante la corrida
medida, con la URL `http://localhost:8080/signalling/asset-list-....json` adentro
del texto. Es dato medido, no una ruta que alguien resuelva, y editarlo sería
falsificar un registro.

El instrumento correcto es el mismo grep sobre el **código** de la suite:

```
/usr/bin/grep -rn "\.project\|signalling/" test/ --include=*.js   → vacío
/usr/bin/grep -rn "\.\./" test/ --include=*.js                    → seis imports de lib/ y el script
```

Aplica igual a la T-03 y a la T-06, cuya definición de done repite ese grep con
`demo/` agregado. Queda reportado y no corregido en sus bloques, porque esta task
no toca lo que es de otra.

Por la misma razón, `test/fixtures/README.md` escribe las rutas de procedencia
sin el prefijo de la carpeta de gestión y sin nombrar la carpeta de señalización
—`phases/01-poc-web-hlsjs/tasks/T-03/`, y "la carpeta de la que la demo sirve sus
asset-lists"—, y dice ahí mismo que lo hace a propósito, para que nadie borre la
procedencia arreglando un grep. Es el mismo criterio que el archivo
`layout-resolution.test.js` ya usaba en su comentario de la línea 63.

## Decisiones que el bloque no cubría

- **Los tests nuevos son afirmaciones nuevas adentro del test que ya existía**, y
  no tests con nombre propio. El bloque pide las dos cosas —tests nuevos y la
  misma lista de nombres y la misma cuenta— y sólo se pueden cumplir juntas de
  esta forma; además el bloque señala la línea 114, que es exactamente ese test.
  La cuenta quedó en 43.
- **El nombre del test no cambió** (`the run of the script is the five breaks of
  the recording`), porque la restricción del bloque es que los nombres sean los
  mismos. Quedó a medio camino de lo que el test hace hoy: afirma la corrida que
  el fixture declara **y** que el script sigue señalizando cinco breaks. La T-03
  lo parte en dos —la mitad del script baja a la demo—, así que el nombre se
  resuelve ahí y no acá.
- **La forma de `run.json`**: un objeto con `breaks`, y cada tanda con
  `slotStart` y `assetList`. El ordinal del break no se declara, se deriva del
  orden, que es lo que hacía el parseo. Campos en inglés como el resto de
  `test/`.
- **`test/fixtures/README.md` está en inglés**, como el código de `test/` y el
  README de la raíz. La prosa en español del proyecto vive en `.project/` y en
  `docs/contrato-senalizacion-renderizado.md`.
- **`RUN` ya no carga los asset-lists al construirse**: la tabla trae el nombre y
  cada test lee la copia cuando la necesita. Con la carga eager, un nombre mal
  tipeado revienta el módulo antes de que corra el primer test, y la afirmación
  de existencia que el bloque pide sería código muerto.

## Los chequeos del proyecto

- `npm test`: **43 pasan, 0 fallan**, los mismos 43 nombres que antes de la task.
- `node scripts/verificar-cortes.mjs`: las dos costuras se sostienen. No
  corresponde a esta task —no toca `lib/`, `js/` ni `css/`— y se corrió igual
  porque la campaña de mutación escribe sobre un archivo del árbol.
- La autosuficiencia de `test/`, grepeada: el código de la suite lee `test/`,
  `../lib/*.js` y `../scripts/senalizar-contenido.sh`, y nada más.
- La verificación visual **no corresponde**: acá no hay nada que mirar.
