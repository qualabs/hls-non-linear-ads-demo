# La barra marca sólo lo que ese player reproduce, y sobre el riel

2026-09-07. Se fue el carril de abajo. Nuestra barra queda con cinco marcas
violetas adentro del riel y nada colgando debajo, la altura de la caja que se
toca pasó a ser un blanco y no un resto de aritmética, y la lista de aceptadas
de `scripts/verificar-cortes.mjs` bajó de cinco líneas a tres.

Lo que costó decidir no fue el carril: fue **quién elige los rangos que una
barra marca**, porque la regla del ADR 0018 es sobre el player y no sobre la
clase de rango. Está en la sección 3, y es la parte que el bloque no nombra.

## 1. El instrumento

| | |
| --- | --- |
| superficie | 1600 × 1000 css px, `dpr 1`, así que la captura es a tamaño real. La imagen de nuestro pane queda en 715 × 402,19 px. Y una segunda corrida en 412 × 915 con la emulación táctil prendida, que es la superficie desde la que Nicolás encontró el defecto |
| camino | el Chrome real por CDP en el 9333 contra el servidor del 8080, el mismo de la T-01 y la T-03 |
| lo que juzga | las cajas dibujadas (`getBoundingClientRect`) **y la captura**. En este repositorio ya hubo dos falsos "OK" por medir estilos computados, así que "nada cuelga debajo del riel" se lee de dos maneras que no comparten fuente: el rectángulo de cada nodo de marca contra el borde de abajo del riel, y la imagen |
| script | `t06run.py`, en esta carpeta. Con `telefono` como tercer argumento corre lo mismo en el viewport del teléfono |

## 2. Qué cambió, archivo por archivo

| archivo | qué |
| --- | --- |
| `lib/controls.js` | `RANGE_LANES` pasa a ser `RANGE_TITLES`, un mapa plano de `kind` a nombre legible: con un solo carril lo único que quedaba dependiendo de la clase eran el color y el tooltip. Se van los bloques `.qa-track__cues` y `.qa-cue` del CSS y el nodo del contenedor de cues del DOM, así que las tres cosas que cuelgan del riel son `fill`, `marks` y `knob`. `paintRanges` chequea contra `RANGE_COLOURS` y pinta el color en el nodo. `.qa-track` pasa de `calc(var(--qa-rail) * 3 + 6px)` a `44px` |
| `lib/concurrent-hls.js` | `playedRanges(provider)`, la vista del contrato que la barra de este player recibe: los rangos de la clase que este player reproduce. Sección 3 |
| `scripts/verificar-cortes.mjs` | la lista de aceptadas del corte del ADR 0003, de cinco entradas a tres. Sección 5 |
| `docs/integrating-the-library.md` | la sección 2.2 decía "with the breaks marked on two lanes". Sección 6 |
| `README.md` | la fila de `lib/controls.js` decía "the two lanes that mark where the breaks are". Sección 6 |

`rangeSpan` no se tocó: la aritmética que pone cada marca en su lugar es la
misma y sus tests son los mismos.

## 3. Quién elige los rangos que una barra marca, que es lo que el bloque no decide

**La decisión: la elige quien conecta un proveedor con una barra, y para nuestro
pane eso es `attach`. `lib/controls.js` dibuja todo lo que recibe.**

Está forzada por tres cosas ya cerradas, y por eso se resolvió acá en lugar de
devolverse:

1. **El contrato entrega las dos clases a propósito.** `programRanges()` es
   "dónde están todos los rangos del programa", y el documento del contrato dice
   de frente que el rango de reemplazo "este reproductor no reproduce y que igual
   está ahí". Medido en esta corrida: el proveedor de la página devuelve **10
   rangos, 5 concurrentes y 5 de reemplazo**, antes y después de la task. El
   contrato no se tocó.
2. **La barra no puede filtrar por clase.** El ADR 0018 dice que el `kind` se
   queda porque es lo que le permite **a cada barra** pintar el rango que marca
   con el color de esa clase, y la T-07 le pone esta misma barra al pane de
   fábrica alimentada con `kind: 'interstitial'` (decisión 2 de la T-04). Una
   tabla en `lib/controls.js` que dejara afuera la clase de reemplazo dejaría a
   esa barra sin dibujar nada, y la fase 03 la tendría que reponer para el aviso
   lineal que nuestro player va a reproducir adentro del break.
3. **No hay dónde ponerlo como opción.** La T-04 cerró la firma:
   `attachControls(video, { container, provider, logo })`. Una opción `kinds`
   sería reabrir una decisión cerrada.

Con esas tres, el único lugar que queda es el que ya sabe qué reproduce este
player y ya conecta el proveedor con la barra:

```js
const KINDS_PLAYED = new Set(['concurrent']);

function playedRanges(provider) {
  return {
    programRanges: () => {
      const { ranges, settled } = provider.programRanges();
      return { ranges: ranges.filter((r) => KINDS_PLAYED.has(r.kind)), settled };
    }
  };
}
```

Es un `Set` y no una constante porque es **la lista de lo que este player
reproduce** y no una definición de la clase concurrente: las dos dejan de ser la
misma lista el día que se reproduzca un aviso de reemplazo de este lado, que es
la fase 03. Y el `settled` se pasa igual aunque la barra no lo lea, porque lo que
cruza es el contrato.

Lo que esto NO hizo, dicho para que no haya que buscarlo: no se tocó
`lib/signalling.js`, no se sacó `rangeOfDateRange` y no se cambió la forma del
contrato. Sacar el rango de reemplazo del proveedor habría hecho lo mismo en la
pantalla y habría roto el par de compatibilidad como dato: es el rango que dice
dónde un cliente de mercado se detiene, y es lo que la T-07 va a marcar en el
riel de ese pane.

## 4. La altura: 44 px, y qué se hizo con los 44 px táctiles de la T-03

`calc(var(--qa-rail) * 3 + 6px)` era la aritmética de dos carriles: la mitad de
lo que sobraba debajo del riel tenía que ser el hueco más el carril, o sea
`(H - R) / 2 = R + 3`, y de ahí `H = 3R + 6` = **30 px** sobre un riel de 8. Con
un carril esa cuenta no tiene nada que resolver, así que el número se eligió por
lo único que le queda que decidir: **cuánto mide el blanco que se toca.**

**44 px, un solo valor, para los dos punteros.**

- **44 y no 30**, que es la anotación que la T-03 dejó: 30 px está abajo de los
  44 con los que se dibuja un blanco táctil en todas partes donde está escrito,
  y es el mismo número que la T-03 le puso a `--qa-icon` en `any-pointer:
  coarse`. El seek con el dedo no estaba en la definición de done de la T-06,
  pero el número salía de la expresión que esta task reescribe, así que dejarlo
  en 30 habría sido escribirlo mal a propósito.
- **No escala con `--qa-rail`**, y es la única longitud del cromo que no escala.
  Lo que se ve es el riel y sigue escalando —8 px, 10 en fullscreen—; lo que se
  toca es esta caja, es invisible, y un blanco es físico: 44 css px son 44 css px
  con la imagen del tamaño que sea. En fullscreen la fila la gobiernan los
  iconos de 46 px, así que la caja de 44 entra sin apretar.
- **Un valor y no uno por puntero**, que es donde se aparta del patrón de la
  T-03. Un icono de 44 px en escritorio cambia cómo se ve el player; una caja
  invisible de 44 px no se ve, y le compra al mouse un click que aterriza donde
  apuntó. Dos valores serían dos números que justificar y una barra que cambia de
  alto sin que se vea por qué.

**Lo que cuesta, medido:** la fila pasa de 34 a 44 px de alto y el bloque de la
barra de 50 a 60, así que **el riel sube 5 px** dentro del cuadro (y = 695,52 →
690,52 en escritorio). El borde de abajo de la barra no se movió: sigue pegado al
borde de abajo de la imagen (732,52 en los dos casos). En el teléfono, con el
cromo arriba, la tira de abajo pasa a ocupar 60 de los 203 px de la imagen, y se
esconde sola.

**Y lo que no cuesta, que es la restricción de la fase:** la capa sigue siendo un
overlay sobre la imagen. La caja del contenedor y la del elemento de video son
**idénticas antes y después** —715 × 402,19 px, mismo origen—, así que el
renderizado resuelve los layouts contra la misma caja. Está en la sección 7.

## 5. La lista de aceptadas de `verificar-cortes`: de cinco a tres

El grep del corte del ADR 0003 vuelve con el término `interstitial` en el lado
del renderizado, y la lista está indexada por el **contenido** de la línea. Sacar
el carril borró tres de las cinco y agregó una.

| antes | después |
| --- | --- |
| `// or 'interstitial' -- which the contract carries on purpose, because the two` | **igual**, y su razón no cambió |
| `interstitial: '#ffcc00'` | **igual la línea, reescrita la razón**: además de ser de dónde cada marca lee su color, `RANGE_COLOURS` es ahora la tabla contra la que se chequea una clase antes de dibujarla, así que una clase que no es clave ahí es un break que no se dibuja y lo dice en voz alta |
| `interstitial: {` (clave de `RANGE_LANES`) | **se fue.** Con un solo carril el valor por clase dejó de ser un objeto |
| `title: 'traditional interstitial: where a client already in the market replaces the content'` | **se fue**, y la reemplaza una sola línea nueva: `interstitial: 'traditional interstitial: the content is replaced by the ad'`, la entrada de `RANGE_TITLES`. El texto se reescribió porque la marca de esa clase ahora va en el riel del player que **sí** reemplaza, así que el nombre describe el comportamiento de ese player y no el de un tercero. Sigue siendo un comportamiento de reproducción y no un mecanismo de transporte, que es la condición con la que estaba aceptada |
| `background: ${RANGE_COLOURS.interstitial};` (el CSS del carril) | **se fue.** El color de una marca se escribe en el nodo, leído de `RANGE_COLOURS` con el `kind` como clave, así que la tabla contra la que se chequea es la misma de la que sale el color y las dos no se pueden desincronizar |

La cabecera del script decía "Five places on the rendering side name it: the
comment that explains it, its colour, its lane and its tooltip" y "A sixth one
fires": ahora dice tres lugares —el comentario, el color y el nombre— y "A fourth
one fires". La misma cuenta está en la cabecera de `lib/controls.js`.

**Verde con las tres, y son exactamente las tres que el grep encuentra.** Un
chequeo con una excepción que ya no existe da `RED: the accepted list no longer
matches the code`, que es lo que este script hace en lugar de un grep pelado.

## 6. Las dos afirmaciones vivas que dejaron de ser ciertas

**La sección 2.2 del documento del integrador**, que la T-04 dejó anotada. El
párrafo nuevo:

> What you get instead, drawn by the library inside your container: one progress
> bar along the bottom for the **whole programme**, with the breaks marked **on
> the bar itself** and nothing hanging below it; play/pause centred over the
> composition; one audio control at the top right; and fullscreen **of the
> composition**, which is the container and everything in it.
>
> What a bar marks is what the player it is attached to plays, and only that. The
> breaks come from the `provider` you hand over (§6), so a bar over your own
> player marks your own breaks and a bar over a second player marks that one's.

El segundo párrafo es nuevo y no es adorno: la sección 6 ya documenta
`attachControls` sobre un player que la librería no maneja, y sin esa frase el
integrador no sabe qué aparece en cada barra. **La sección 7 no se tocó**: los dos
colores siguen fuera de la superficie pública, y lo que dice ahí —"the violet of
a concurrent range and the yellow of a traditional one, on the bar"— sigue siendo
cierto sin cambiarle una palabra.

**Y una que el bloque no nombra: `README.md`.** La fila de `lib/controls.js`
decía "the two lanes that mark where the breaks are". Es documento vigente y dejó
de ser cierta con este cambio, así que la reescribe esta task: ahora dice "the
marks on its rail that say where the breaks this player plays are". Es la misma
clase de afirmación que la sección 2.2 y estaba en el mismo estado, sólo que en
otro archivo.

**Lo que se dejó como está, a propósito:** `.project/PROJECT.md:507` dice que la
fase 02 cerró con "una sola barra con los breaks en dos carriles". Está en la
lista de fases cerradas, que es registro histórico: era cierto el día que esa
fase cerró y reescribirlo borraría lo que el documento sirve para probar. Lo que
supersede ese diseño es el ADR 0018, que ya está aceptado.

## 7. Las lecturas

**Las marcas y el riel, escritorio, fuera de un break** (`t06-la-lectura-*.json`):

| | antes | después |
| --- | --- | --- |
| nodos de marca | 10 | **5** |
| nodos por debajo del borde de abajo del riel | 5, a +11 px | **0** |
| contenedor `.qa-track__cues` | 178,08 × 8 px, a `100% + 3px` del riel | **no existe** |
| `.qa-track` | 30 px de alto, y = 684,52 | **44 px**, y = 672,52 |
| `.qa-track__rail` | 8 px, y = 695,52 | 8 px, **y = 690,52** |
| fila / bloque de la barra | 34 / 50 px | **44 / 60 px** |
| caja del contenedor y del video | 715 × 402,19 px | **715 × 402,19 px** |
| rangos que devuelve el proveedor de la página | 10 (5 + 5) | 10 (5 + 5) |
| errores y warnings en consola | ninguno | **ninguno** |

Cero warnings es una lectura y no un detalle: la clase que no llega a la barra no
llega **filtrada**, así que el aviso de `paintRanges` —"no colour for a range of
kind …: not marked", que existe para que un break que falta no se vea igual que
un break que no está en la playlist— no se dispara.

**Y de paso, la medición de la T-04 de la fase 02 vuelve a salir sola:** en la
lectura de antes, la marca concurrente y la de reemplazo de cada break tienen el
**mismo `x` y el mismo `w`** —951,09 y 36,09 px la primera, y así las cinco—. Los
dos rangos comparten `START-DATE` y duración, que es la razón por la que dibujados
uno encima del otro agregaban un color y no información. Esa razón no es lo que
cambió.

**Con el dedo** (412 × 915, emulación táctil: `(any-pointer: coarse)` matchea,
`maxTouchPoints` = 5, `ontouchstart` presente): imagen de 361,52 × 203,34 px,
`--qa-icon` = 44 px, `.qa-track` = **44 px**, riel de 8, **cinco marcas, ninguna
colgando**.

**La caja pedida contra la dibujada**, adentro del break del Quad (`multiView`,
cuatro elementos con el contenido primario adentro): **delta máximo 0 px en los
cuatro, antes y después.** Es la comparación que la fase pide donde una task toca
el renderizado o los controles, y acá hacía falta porque la altura de `.qa-track`
cambió y esa capa está sobre la misma imagen contra la que se resuelven los
layouts.

**Las capturas.** A tamaño real (`dpr 1`), y el recorte de la tira de abajo es
donde el amarillo colgaba:

| archivo | qué muestra |
| --- | --- |
| `t06-1-nuestra-barra-despues.png` | el pane entero a tamaño real, 715 × 403, con los cinco breaks marcados sobre el riel y nada debajo |
| `t06-2-la-tira-de-abajo-despues.png` | la tira de la barra sola. Contra `…-antes.png`, que tiene las cinco marcas amarillas colgando, es la definición de done a simple vista |
| `t06-1-nuestra-barra-telefono.png` | lo mismo en 361 × 203, que es la superficie desde la que salió el reporte |
| `t06-3-adentro-del-quad-despues.png` | adentro del break, con el `fill` pasando por las marcas y la perilla cruzándolas: es lo que hace que una marca sea parte de la barra y no un elemento al lado |

**Los chequeos:** `node scripts/verificar-cortes.mjs` verde con las dos costuras
y tres aceptadas; `npm test` 27 de 27, igual que antes; `./scripts/construir-libreria.sh`
arma el `dist/` sin quejarse.

## 8. Lo que no coincide con el bloque

Tres cosas, con la evidencia al lado.

1. **El bloque nombra `RANGE_LANES` con `under: true` como lo que se va, y lo que
   se fue es `RANGE_LANES` entero.** Con un solo carril el objeto por clase queda
   con un campo —el nombre—, así que una tabla de objetos para un campo es
   ceremonia: pasó a ser un mapa plano de clase a nombre. La clase del nodo dejó
   de estar en la tabla porque es una sola, `qa-mark`, y el color pasó al nodo.
2. **El bloque dice que sacar el carril "borra algunas de esas líneas" de la lista
   de aceptadas, y no dice que también agrega una.** Borró tres y agregó una: la
   entrada de `RANGE_TITLES`. La lista queda en tres, que es la dirección correcta
   —una lista de excepciones más corta es una alarma más viva—, pero no es sólo un
   borrado. Sección 5.
3. **El bloque no nombra quién elige los rangos que una barra marca, y sin eso la
   task no se podía terminar.** Con el carril afuera y sin filtro, nuestra barra
   dibujaba los diez rangos en el mismo lugar: cinco marcas con un color encima de
   otro, que es exactamente lo que el ADR 0018 dice que no informa. Está resuelto
   en la sección 3 y no devuelto, porque las tres alternativas posibles ya estaban
   cerradas por el contrato, por el ADR 0018 y por la firma que fijó la T-04.
   Queda escrito acá para que la T-07 y la fase 03 lo encuentren: la fase 03 le
   agrega una clase a `KINDS_PLAYED` el día que este player reproduzca un aviso de
   reemplazo adentro del break.

Y una que sí coincide y conviene decir porque es lo que el nivel de verificación
bajo dejó adentro: **`npm test` sirvió.** Un backtick que se me fue adentro del
template de CSS rompió `lib/controls.js`, y lo agarraron el test que importa
`rangeSpan` y el chequeo de sintaxis del build, en la misma corrida. El archivo
cambia y `rangeSpan` no, pero el archivo entero pasa por ahí.
