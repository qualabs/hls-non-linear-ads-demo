# Los controles usables con el dedo: la causa medida, el gesto decidido y el tercer defecto

2026-09-07. La task empieza con una medición y no con un arreglo. Las dos causas
candidatas se confirmaron las dos, el tercer defecto existía y estaba en tres
lugares y no en uno, y las dos cosas que se decidieron —el gesto que esconde y
el valor del temporizador en touch— están escritas acá con la razón al lado.

## 1. El instrumento, porque acá es la mitad del trabajo

En este repositorio ya hubo dos falsos "OK" por medir estilos computados en
lugar de mirar la imagen, así que el instrumento se declara y se lee:

| | |
| --- | --- |
| superficie | 412 × 915 css px, que es donde `css/player.css` apila los dos panes y es desde donde Nicolás encontró el defecto. La imagen del pane queda en 361,52 × 203,34 px |
| emulación | `Emulation.setTouchEmulationEnabled` sobre el Chrome real por CDP en el 9333, contra el servidor del 8080 |
| lo que la página ve | `(pointer: coarse)` matchea, `(hover: none)` matchea, `navigator.maxTouchPoints` = 5, `'ontouchstart' in window` = true |
| los toques | `Input.dispatchTouchEvent`, así que cada evento que llega es `isTrusted: true` y de `pointerType: "touch"`, y **el `pointerleave` que aparece al levantar el dedo lo produce el navegador y no el script** |
| lo que juzga | el evento táctil real, el reloj de la página (`performance.now`) y la captura. Nunca `getComputedStyle` |

Los milisegundos de las lecturas son del reloj de la página y no la suma de los
`sleep` del script: cada captura mete su propia latencia, así que una etiqueta
nominal mentiría sobre cuándo se leyó. Por eso los archivos de captura se llaman
"primera / segunda / tercera lectura" y el milisegundo vive en el JSON.

## 2. La causa: las dos existen, y la del código es la que explica el síntoma

**La del `pointerleave` es la que hace lo que Nicolás describió, y es peor que
"casi de inmediato": los controles están arriba sólo mientras el dedo aprieta.**
La secuencia de un toque completo, con la clase de la capa intercalada:

    ms 2047,6  pointerdown  touch  target=video    arriba=false
    ms 2048,1  clase                               arriba=TRUE
    ms 2166,5  pointerup    touch  target=video    arriba=true
    ms 2166,7  pointerleave touch  target=player   arriba=true
    ms 2167,0  clase                               arriba=FALSE
    ms 2173,4  click        touch  target=video    arriba=false

118,9 ms arriba, y la bajada llega 0,3 ms después del `pointerleave`. El `click`
de ese mismo toque aterriza cuando ya no hay nada en pantalla. Las cuatro
lecturas posteriores —a 755,6 / 2676,2 / 5349,7 / 6353,5 ms del toque— dan
`arriba=false` las cuatro.

**La del temporizador también existe, y se aisló sin tocar el código:** con el
dedo apretado y sin levantarlo no hay `pointerleave`, así que lo único que puede
bajar la capa es el temporizador. Bajó a los **2601,3 ms** del `pointerdown`, y
en esos 4 segundos llegaron **cero** `pointermove`. Eso es la causa enunciada,
confirmada: en touch el presupuesto no se renueva con el movimiento porque no
hay movimiento que lo renueve. Pero son 2,6 s y no 100 ms, así que es la
segunda y no la primera.

Arreglar una sola habría dejado el síntoma a medias: sin el `pointerleave` los
controles duran 2,6 s sin poder renovarse, y 2,6 s es el presupuesto entero de
ver, decidir, cruzar la imagen con el pulgar y acertar.

## 3. El tercer defecto: existía, y en tres lugares

La capa se esconde con `opacity: 0`, que es una pintura y no un hit test. Los
dos nodos que vuelven a prender `pointer-events` son los botones y la barra, así
que **los cuatro controles seguían accionables siendo invisibles**, no sólo
`.qa-track`. Los tres toques, con los controles abajo:

| dónde cayó el dedo | qué hizo, invisible |
| --- | --- |
| la franja de abajo, al 80 % del riel | seekeó **134,01 s** (10,267 → 144,277) y los controles ni aparecieron. El `pointerdown` llegó a `qa-track__rail` |
| el centro | **pausó** la composición. El `pointerdown` llegó al `<svg>` del botón de play |
| arriba a la derecha | **levantó el mute**, que de los tres es el peor en cámara |

El bloque de la task nombra `.qa-track` y su `pointerdown`. Es cierto y es el
que el pulgar encuentra primero, pero no es el único: el botón de play mide
74 px y está en el medio de la imagen, y el de audio es el que menos se quiere
apretar sin querer.

## 4. Lo que se decidió, con la razón al lado

**a. `pointerleave` deja de ser el gesto de esconder para todo lo que no sea un
mouse, y sigue siendo el gesto del mouse.** Un mouse tiene a dónde salir y salir
es un gesto; un dedo no está nunca "sobre la imagen", existe entre el apretar y
el soltar, así que ese evento en touch no es un gesto sino el final de cada
toque.

**b. El gesto que los esconde en touch es un segundo toque sobre la imagen. Un
toque alterna.** De las tres opciones que el bloque enumeraba, "el temporizador
sólo mientras reproduce" **ya estaba implementado** —`arm()` ya tenía
`if (!video.paused)` antes de esta task—, así que la decisión real era el toque
que alterna, y se tomó: no cuesta nada de imagen, no hay botón nuevo ni gesto
que aprender, y es lo que hace cualquier player de teléfono, así que llega
sabido. Sobre el mobiliario nunca alterna: un toque en un botón o en la barra es
el toque de ese control y nada más.

Con una consecuencia que se acepta escrita: **el toque esconde también con la
composición pausada**, mientras el temporizador sigue sin esconder nunca un
player pausado. Esconderse solo tiene que respetar el estado que alguien está
mirando; que le pidan esconderse es que le pidan.

**c. `CONTROLS_HIDE_MS` se queda en 2600 y aparece un segundo valor,
`CONTROLS_HIDE_TOUCH_MS = 5000`, porque no son la misma cantidad.** Medido: con
mouse la capa aguantó 3,6 s de movimiento continuo y bajó 2602 ms después de que
el puntero se quedó quieto, así que en escritorio el número es "cuánto después
de que dejás de mover" y 2,6 s de eso alcanzan porque el próximo movimiento los
trae de vuelta. Con el dedo llegaron cero `pointermove` en 4 s, así que el mismo
número es **la interacción entera** —ver que están arriba, elegir uno, cruzar la
imagen con el pulgar y aterrizar en un blanco de 44 px— y 2,6 s de eso no dejan
lugar para un error. 5000 ms dejan lugar para uno. El precio de que sea largo es
mobiliario sobre la imagen 2,4 s más, y el segundo toque lo saca en el momento.
Los dos son valores y los dos son una línea.

Un valor solo para los dos casos era la otra forma, y está afuera por la
restricción de la task: subirlo para los dos cambia el escritorio, y el
escritorio no tiene que cambiar.

**d. El primer toque muestra y no navega, y son dos mitades porque son dos
eventos.** El `pointerdown` se resuelve antes de que corra cualquier listener,
así que apagar `pointer-events` mientras la capa está escondida mata el seek de
la barra, que navega en el `pointerdown`. **El `click` se resuelve después**, ya
con la capa de vuelta en pantalla, así que un botón lo recibe igual: medido, un
toque sobre el medio invisible de la imagen dio `pointerdown` en el elemento de
video y `click` en el botón de play, y la composición se pausó. Por eso el click
se traga en un solo lugar, en fase de captura sobre el contenedor, y no en cada
handler.

**e. El apagado de `pointer-events` va detrás de `(any-pointer: coarse)`, y esa
es la mitad que es una decisión.** En el mouse el agujero existe pero no es un
defecto, y cerrarlo ahí **sí** sería un cambio de comportamiento: medido, en
escritorio un click sin mover con los controles escondidos seekea 113,49 s, y
tiene que seguir seekeando. La consulta es `any-pointer` y no `pointer` a
propósito: un laptop con pantalla táctil tiene puntero fino primario y un pulgar
además, y el pulgar es de quien se trata.

**f. Las áreas de toque: `--qa-icon` pasa de 34 a 44 px, y sólo en touch.** Es
un token y no un layout nuevo, que es lo que la restricción pide. El juego nuevo
está indexado por el **instrumento** y no por el tamaño de la pantalla, que es
una extensión chica del patrón y fiel a su intención: lo que decide cuán grande
tiene que ser un blanco es qué apunta, y 34 px está abajo de los 44 px con los
que se dibuja un blanco táctil en todas partes donde está escrito. `--qa-play`
no cambia: 74 px ya es el doble del mínimo.

**Lo que deliberadamente no cambió: la altura de la barra.** `.qa-track` da
30 px de blanco sobre un riel de 8 px, y ese número sale de la aritmética
`calc(var(--qa-rail) * 3 + 6px)`, que es la de dos carriles. La T-06 saca el
carril de abajo y reescribe esa expresión, así que un valor puesto hoy contra
ella es un valor escrito dos veces. Queda anotado para esa task; el seek con el
dedo no está en la definición de done de esta.

## 5. Qué cambió, en un archivo

`lib/controls.js`, 146 líneas agregadas y 5 sacadas. Ningún otro archivo.

| lugar | qué |
| --- | --- |
| `:65-66` | `CONTROLS_HIDE_MS` se queda en 2600 y aparece `CONTROLS_HIDE_TOUCH_MS = 5000`, con la medición de los dos presupuestos en el comentario |
| `:203-205` | el juego de tokens para un dedo: `@media (any-pointer: coarse) { .qa-controls { --qa-icon: 44px } }`, antes de `.qa-controls--full` para que en fullscreen sigan ganando los 46 px |
| `:243-245` | `@media (any-pointer: coarse) { .qa-controls:not(.qa-controls--on) * { pointer-events: none } }`, escrito sobre todo descendiente y no sobre los dos nodos por nombre, para que un nodo agregado después no pueda reabrir el agujero |
| `:665-667` | `hideMs`, el presupuesto del instrumento que tocó último, y `swallowClick` |
| `:712-717` | `pointermove` sólo para mouse: el movimiento de un dedo es un arrastre, y leído como movimiento desharía el alternar antes de que se vea |
| `:719-738` | `pointerdown`: fija el presupuesto, arma el trago del click, y alterna —esconde si estaba arriba y el toque no cayó en el mobiliario— |
| `:740-751` | el `click` en fase de captura sobre el contenedor, que se traga el click del toque que despertó al cromo. Se limpia en cualquier click, así que la bandera no puede sobrevivir al toque que la puso |
| `:752-756` | `pointerleave` sólo para mouse |

`show()`, `hide()` y `arm()` conservan su forma; lo único que cambió adentro es
que `arm()` lee `hideMs` en lugar de la constante. La superficie pública
documentada no se movió: la tabla de la sección 6 de
`docs/integrating-the-library.md` lista `VERSION`, `CONCURRENT_CLASS`,
`hlsConfig` y `attach`, y ninguno de los cuatro cambia.

## 6. La corrida con el dedo, después

`t03run.py`, mismo camino que la T-01. Los dos toques "sobre la imagen" no están
elegidos a ojo: el script calcula un punto adentro de la imagen y afuera de toda
caja de mobiliario, porque las cajas se mueven con los tokens y un punto a mano
se vuelve un toque sobre la barra en cuanto un token crece.

| | antes | después |
| --- | --- | --- |
| ms que la capa quedó arriba tras un toque | **118,9** | **5000,2** |
| qué la bajó | `pointerleave`, 0,3 ms después | el temporizador, 4879 ms después del click |
| lecturas tras el toque | 755,6 → no · 2676,2 → no · 5349,7 → no · 6353,5 → no | 663,4 → **sí** · 2533,4 → **sí** · 5180,8 → no · 6184,1 → no |
| dedo apretado 4 s | bajaron a los 2601,3 ms | siguen arriba |
| toque en la franja, invisibles | seekeó 134,01 s, no mostró | **no seekeó** (0,492 s de reproducción), **mostró** |
| toque en el centro, invisibles | pausó | **no pausó**, mostró |
| toque arriba a la derecha, invisibles | levantó el mute | **no lo levantó**, mostró |
| la pausa con el dedo, visible | los controles ya no estaban al apuntar | pausó, y quedaron arriba |
| el audio con el dedo, visible | ídem | cambió, y quedaron arriba |
| el gesto que los esconde | — | los escondió, sin seekear |
| el toque siguiente | — | los trae de vuelta |

Las capturas, en orden: `t03-1a/1b/1c-el-toque-*-despues.png` son las tres
lecturas del mismo toque —a los 663,4 ms arriba, a los 2533,4 ms todavía
arriba, y pasada la ventana de 5 s la imagen limpia—, `t03-3-la-pausa-con-el-dedo`
y `t03-4-el-audio-con-el-dedo` son los dos controles accionados con el dedo,
`t03-5-el-gesto-que-los-esconde` es el segundo toque haciéndolo, y
`t03-2-el-primer-toque-en-la-franja-de-abajo` es el par del tercer defecto: en
`antes` otra escena de la película y ningún control, en `despues` el reloj donde
estaba y los controles arriba.

## 7. La corrida con mouse: el escritorio no cambió

Viewport de 1600 × 1000 y la emulación táctil **apagada** —`(pointer: coarse)`
no matchea, `maxTouchPoints` = 0—, para que el escritorio se compare contra sí
mismo.

| | antes | después |
| --- | --- | --- |
| el mouse entra y se queda quieto | bajan a los 2602,2 ms | 2600,4 ms |
| el mouse se mueve 3,6 s | siguen arriba | siguen arriba |
| el mouse sale del contenedor | se esconden | se esconden |
| click en la pausa | alterna | alterna |
| click en el audio | alterna | alterna |
| seek con los controles arriba | +35,103 s | +35,099 s |
| click sin mover con los controles escondidos | **seekea +113,489 s** | **seekea +113,561 s** |
| `--qa-icon` en escritorio | 34 px | 34 px |
| caja del botón de audio | 34 × 34 | 34 × 34 |

La última fila del comportamiento es la que importa y es la razón del
`any-pointer: coarse`: el caso de borde donde un arreglo del dedo podía romper
el mouse sigue haciendo exactamente lo que hacía. Y los tokens del escritorio no
se movieron: 44 px existe sólo donde hay un puntero grueso.

## 8. Los dos chequeos que la task edita y la comparación de la caja

`node scripts/verificar-cortes.mjs` — **verde, código 0**. Las dos costuras en
pie: la de ADR 0003 con las mismas 5 ocurrencias aceptadas de siempre, ninguna
nueva; la de ADR 0015 con cero hits. Nada del vocabulario nuevo —touch, dedo,
puntero grueso— nombra el transporte ni la aplicación.

`npm test` — **27 de 27**. `rangeSpan` no se toca.

**La caja que el contrato pide contra la que el navegador dibujó**, adentro del
break del Quad, sobre cuatro elementos:

| | antes | después |
| --- | --- | --- |
| en el teléfono, 361,52 × 203,34 | 0,007813 px | 0,007813 px |
| en el escritorio, 715 × 402,19 | 0 px | 0 px |

Los 0,007813 px del teléfono **no los trae esta task**: el número es idéntico
antes y después, y en el escritorio da 0 en las dos corridas, igual que las
siete veces anteriores. Es el redondeo sub-pixel de una caja de 361,52 px de
ancho —1/128 de pixel, la mitad del cuanto de 1/64 con el que el navegador
guarda una longitud— y no un corrimiento. La caja de la imagen mide lo mismo en
las dos corridas, 361,52 × 203,34 en el teléfono y 715 × 402,19 en el
escritorio, que es la otra forma de decir que la capa de controles sigue siendo
un overlay y no le agregó altura a la caja que el renderizado mide.

## 9. Lo que el bloque de la task afirma y el código no dice igual

Tres cosas, con la lectura al lado:

1. **"El temporizador sólo mientras reproduce" ya estaba.** El bloque lo
   enumera como una de las tres opciones a decidir, y `arm()` ya tenía
   `if (!video.paused)` antes de esta task. No era una opción, era el estado de
   las cosas, así que la decisión real quedó reducida al toque que alterna y al
   valor del temporizador.
2. **El tercer defecto no es sólo de `.qa-track`.** El bloque nombra la barra y
   su `pointerdown`, que es cierto, pero los cuatro controles tienen
   `pointer-events: auto` y los tres que se probaron accionaron invisibles: la
   barra seekeó, el centro pausó y el de audio levantó el mute.
3. **Apagar `pointer-events` no alcanza para el primer toque.** El bloque lo
   plantea como "el primer toque muestra, no navega", que es el objetivo
   correcto, pero la implementación obvia —apagar los eventos de puntero
   mientras está escondida— cubre sólo la mitad: el `pointerdown` se resuelve
   antes y el `click` después. Se midió y por eso hay dos mecanismos, no uno.

## 10. Lo que no se corrió, y por qué

Nada de lo que el bloque pide. Se corrieron la corrida en el dispositivo, la
corrida con mouse, `verificar-cortes`, `npm test` y la comparación de la caja.

Y nada nuevo se agregó: confirmar la causa fue mirar el síntoma con un evento
táctil real y el reloj de la página, que es la misma instrumentación de la T-01
con dos columnas más, no una campaña.
