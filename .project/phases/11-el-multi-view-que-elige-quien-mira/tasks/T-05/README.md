# T-05 -- El estado de quien mira: `lib/multiview.js`

El módulo del ADR 0072, nuevo, que decora al proveedor: recibe el de la capa de
señalización y devuelve otro con la misma firma. Lo que no es una oferta pasa de
largo **como el mismo objeto**; una oferta sale con las cajas de lo que quien
mira haya subido, en la misma forma `Element` que produce un aviso. El contrato
del ADR 0003 no cambia en un campo.

El estado es `{ offer, raised, enlarged }` y nada más: cuáles vistas están
tildadas, en qué orden se tildaron, y cuál está agrandada. El foco del audio no
está, y sigue siendo un índice del renderizado (ADR 0026).

Los tests son `test/multiview-state.test.js`, veintisiete, todos verdes.

## El contenido principal no está en `raised`, y por eso no hay regla que lo cuide

Está siempre tildado y bloqueado (ADR 0067). La forma de escribirlo es **no
poder decirlo al revés**: una lista que no puede decir "el programa está bajado"
no necesita una regla que lo prohíba. Lo que cuesta es una constante,
`PRIMARY_ID`, que es el `id` que el contrato ya le da a ese elemento, así que la
fila que se tilda y la caja que se mueve se llaman igual sin que nadie traduzca.

La grilla se cuenta **con el programa adentro**: `raised.length + 1 <= MAX_BOXES`.
El tope es de pantalla y nunca de oferta (ADR 0066), y eso se ve en los tests con
un catálogo de cinco vistas armado en abierto arriba de la oferta real.

## La selección se guarda por `itemId`, y no hay "la oferta actual"

Es el hallazgo que cambió el diseño, y no estaba en el plan. **`activeAt` se
llama dos veces por cuadro y con dos tiempos distintos**: una para ahora y otra
para tres segundos adelante, que es como `bringAhead` trae el aviso que viene
(`lib/renderer.js:790`). Un módulo que adoptara "la oferta" de lo último que le
preguntaron le borraría la selección a quien mira tres segundos antes de que su
ventana termine, en una llamada que ni siquiera es sobre él.

Guardada en un `Map` por `itemId` no hay un "actual" que equivocar: cada llamada
compone la ventana por la que le preguntaron, con la selección de esa ventana.
Las operaciones del handle toman **la oferta sobre la que se hizo el gesto**, que
es lo que el cromo tiene en la mano cuando alguien toca una fila.

El test que lo fija es *asking about a time ahead of now does not touch what is
raised now*.

## La experiencia resuelta es el mismo objeto mientras el estado no cambia

`build` empareja un nodo adelantado contra el objeto `element` que el proveedor
devolvió, con `===` (`lib/renderer.js:741`). Una composición armada de nuevo en
cada cuadro tiraría el nodo que ya tenía listo y construiría uno frío justo en el
momento en que la caja aparece. El memo es por `(estado, experiencia de origen)`,
así que se arma cuando la selección cambia y no una vez por cuadro, y de paso
cumple la promesa del contrato de devolver los mismos objetos mientras la
experiencia siga activa.

Con nada tildado la oferta se devuelve **sin tocar** -- el mismo objeto, con los
`elements: []` que la capa de abajo ya produjo --, que es a la vez la respuesta
honesta y la que no asigna nada en un cuadro donde nadie eligió.

## Lo que prueba que un estado inconsistente se rechaza

Las operaciones no pueden producir uno, así que un test que sólo las manejara no
probaría nada sobre la validación. Los estados rotos se **escriben a mano** y lo
que se asserta es el rechazo:

| estado escrito a mano | por qué no se puede dibujar |
| --- | --- |
| cuatro vistas tildadas (cinco cajas) | la tabla de formas no tiene fila para cinco: se dibujarían cuatro cajas y una cámara que nadie ve |
| la misma vista dos veces | dos decodificadores sobre un mismo feed, y una fila del selector que no sabe de cuál habla |
| la agrandada fuera de la grilla | apunta a una caja que no está en pantalla |
| agrandada con nada tildado | no hay composición: una caja es el programa como venía |
| una vista que la oferta no anuncia | una caja sin nada que poner adentro |
| `raised` que no es una lista, una oferta que es un aviso, `null` | no es una selección |

Y el control, que es lo que hace que los seis valgan: **la misma forma escrita a
mano y legal se acepta** (*the control: the same shape, written by hand and legal,
is accepted*). Sin él, una validación que rechazara todo pasaría los seis.

## La campaña de mutación, scopeada

Diez roturas, una por regla, cada una corriendo **sólo** los tests que cubren esa
regla (`--test-name-pattern`) y no la suite entera. Las diez dieron rojo. Salida
verbatim en `mutaciones.txt`, y el script en `mutaciones.py`, que se vuelve a
correr con `python3 <este directorio>/mutaciones.py <copia del árbol>` y sale 0
sólo si las diez siguen dando rojo.

Corrieron sobre una copia del árbol en `/dev/shm`, no sobre el árbol vivo: hay
otras tasks de la fase corriendo en paralelo y una mutación de `lib/` las habría
puesto en rojo por un motivo que no es el suyo.

| # | regla | rotura |
| --- | --- | --- |
| 1 | el tope de cuatro cajas | se deja pasar la quinta |
| 2 | una vista no se tilda dos veces | se dejan pasar los duplicados |
| 3 | la agrandada está en la grilla | se deja apuntar afuera |
| 4 | la fila del programa está bloqueada | `locked: false` |
| 5 | el programa no se destilda | se saca la guarda de `lower` |
| 6 | con la grilla llena las otras filas se deshabilitan | `full` queda en falso |
| 7 | la composición es el mismo objeto por estado | se saca el memo |
| 8 | una vista lleva su MIME a la caja | se pierde en el camino |
| 9 | bajar la agrandada baja la ampliación | queda apuntando a la que se fue |
| 10 | el orden de las cajas es el de la selección | se ordena por catálogo |

## Dos archivos compartidos que hubo que tocar, y por qué

**`scripts/verificar-cortes.mjs`.** El chequeo de completitud que dejó la T-01
exige que todo `lib/*.js` esté de un lado o del otro de la costura del ADR 0003,
y sin eso `npm run check` sale en rojo diciendo exactamente eso. `lib/multiview.js`
va del lado del renderizado: decora al proveedor, así que lee lo que la capa de
abajo resolvió y entrega el mismo contrato, pero **no puede nombrar el
transporte**, que es lo que el grep de esa costura vigila.

**`scripts/construir-libreria.sh`.** `FUENTES` es una lista escrita a mano y un
archivo de `lib/` que no esté ahí no viaja en el bundle. Va segundo, después de
`lib/signalling.js`, que es de lo único que depende. El import del módulo va en
**una sola línea**, como los de todo `lib/`: el build borra los imports con una
sustitución sobre líneas enteras, así que uno partido en varias dejaría su cola
adentro del bundle.

## `type` contra `mediaType`: la traducción de un nombre, y por qué está asserteada

`resolveView` devuelve la vista con el nombre del contrato, `mediaType`, y
`resolveElement` lee el nombre que usa el **payload**, `type`. Componer con
`resolveElement({ ...view, ... })` tal cual deja el elemento sin MIME, que es lo
que decide cómo se mete el asset en la caja, y una caja sin MIME se ve como una
caja que todavía está cargando. La traducción se hace explícita en el único lugar
donde una vista se vuelve elemento, y el test *a view carries its uri and its MIME
into the box* la fija.

## Suite y costuras

`suite.txt` es `npm test` con el árbol entero -- **151 pruebas, 151 pasan, 0
fallan**, sobre una línea de base de 124 al empezar la task --,
`suite-de-la-task.txt` las veintisiete de este archivo, y `costuras.txt` la
salida de `npm run check`, verde en las dos.
