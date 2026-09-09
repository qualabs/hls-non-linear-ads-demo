# T-02 — el gesto mueve el foco, y el anillo dice cuál es

Con el cromo arriba, un toque sobre una caja de video del aviso enfoca esa caja:
suena ésa sola —el primario callado incluido—, un anillo amarillo aparece encima,
y tocarla de nuevo devuelve la mezcla que declara el asset list. Con el cromo
abajo el toque no cambia el audio: muestra el cromo, que es lo que ya hace
cualquier control de este player.

## Qué cambió, y son cuatro lugares de tres archivos

- **`lib/renderer.js`, el gesto**: un `pointerdown` en el nodo, agregado en
  `createNode` adentro de la rama de video, que es la que sólo corren las cajas
  de video del aviso. Pregunta `chromeUp()` y sale sin hacer nada si el cromo
  está abajo; si está arriba, mueve el foco al elemento, o lo suelta si ese
  elemento ya lo tenía, que es la cuarta salida del ADR 0029.
- **`lib/renderer.js`, los punteros**: `place()` escribe
  `pointer-events: auto` en los nodos de video del aviso. No en `createNode`,
  porque `bringAhead` construye nodos ya posicionados sobre su caja con
  `opacity: 0` y opacity no detiene un dedo; `place()` sólo recorre lo que está
  en pantalla. No en las imágenes, que no tienen audio que llevarse.
- **`lib/renderer.js`, el anillo y la única puerta del índice**: `setFocus`
  mueve el índice, mueve el anillo y llama a `applyAudio`, en ese orden y en un
  solo lugar (ADR 0030). El anillo es un `outline` de 4 px `#FFD400` con
  `outline-offset: -4px`, inline sobre el nodo. Las dos salidas que la T-01
  había dejado escritas —`clear()` y el `ended` del nodo— pasaron a llamar a
  `setFocus(null)`.
- **`lib/controls.js`**: el handle devuelve `up`, que ya existía adentro. Lo que
  cruza es el booleano y no la clase de la que se lee.
- **`lib/concurrent-hls.js`**: `attach()` le pasa al renderer
  `chromeUp: () => controls?.up() ?? false`. Es una función, así que se evalúa
  en el momento del toque y no importa que el renderer se construya una línea
  antes que los controles. Y la nota del invariante de la capa quedó con el
  cambio: la capa sigue con `pointerEvents: 'none'` y sin `z-index`; lo que
  recibe el press es el nodo de adentro.

## Dos cosas que la task decidió

- **El anillo se va en el `ended` del nodo y no sólo cuando el nodo desaparece.**
  El ADR 0030 dice que el anillo se va con el nodo, y en dos de las cuatro
  salidas eso es literal, porque el nodo se destruye. En la tercera no: un asset
  que se terminó antes que su ventana **se queda en pantalla** con su último
  cuadro hasta que la ventana cierre, así que un anillo que sobreviviera estaría
  marcando la única caja que con seguridad no suena. Por eso el `ended` pasa por
  `setFocus(null)`, que es la misma puerta, y no por una línea propia.
- **Sin predicado no hay gesto.** `chromeUp` tiene default `() => false`: un
  renderer construido sin controles no tiene cromo que gatee el toque, y la
  capacidad llega con la pieza que la gatea. Es lo que evita un segundo
  comportamiento —"si no hay cromo, actúa de una"— que sería el tercer caso que
  el ADR 0028 existe para no tener.

## Cómo se verificó

`npm test` da **49 en verde**, los mismos 49 de la T-01: esta task no agrega
lógica no visual, así que no agrega tests. `npm run check` sigue en
`both seams hold.`. Los dos, verbatim, en `t02-suite-y-costuras.txt`.

Y lo demás se mira y se escucha con el player corriendo, con el switch de la
composición encendido a mano con el botón del cromo, que es sin lo cual el
`muted` de los nodos del aviso no dice nada. Doce lecturas, todas en verde, en
`t02-mirada-con-el-player.txt`:

- **Quad (break 4)**: sin foco, la mezcla declarada —`view3` a 100, los otros
  dos cuadrantes y el primario a 10—. **Un** click con mouse sobre `view2` y
  queda `view2` a 100 sin mutear, `view3` y `view4` a 0 y muteados, el primario
  a 0, y el anillo sobre `view2` y sobre ninguna otra caja. Tocado de nuevo,
  vuelve la mezcla declarada y el anillo se va.
- **`cornerOverlay` (break 1)**: el aviso declara 0 y el programa 100. Un click
  sobre el aviso lo lleva a 100 sin mutear y **calla el programa**, que es el
  audio doble que la fase existe para resolver.
- **Break 5, el nodo precargado**: a los 129,9 s `ad2-box` está construido,
  posicionado sobre su caja, con `opacity: 0` y **`pointer-events: none`**. Un
  click sobre esa caja no cambia un solo nivel y no pone anillo.
- **Break 5, el borde**: `ad1-overlay` enfocado a los 131 s, y pasado el 132 la
  composición se rearmó: el anillo no está y el programa volvió a 100.
- **Táctil, con el cromo abajo** (toques reales por CDP, con emulación táctil
  encendida): el **primer** toque no cambia ningún nivel y no pone anillo, sólo
  sube el cromo; el **segundo** enfoca `view2` y le pone el anillo. La asimetría
  sale del predicado y no de una rama por dispositivo: el mismo código da un
  click con mouse y dos toques con dedo.

Las capturas, una por estado: `t02-quad-sin-foco.png`,
`t02-quad-con-foco.png` y `t02-quad-foco-suelto.png`, más
`t02-overlay-con-foco.png`, `t02-break5-precargado.png`,
`t02-break5-borde.png` y `t02-quad-tactil-segundo-toque.png`. El anillo se lee
sobre un creativo oscuro y sobre uno claro, que era el criterio del color.
