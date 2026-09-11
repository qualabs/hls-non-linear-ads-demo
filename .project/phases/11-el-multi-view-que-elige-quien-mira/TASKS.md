# Tasks — fase 11-el-multi-view-que-elige-quien-mira

| id | brief | status | plan | evidence |
| --- | --- | --- | --- | --- |
| T-01 | La composición cambia sin reconstruirse: el diff puro, `build` y `clear` incrementales | done | — | [`tasks/T-01/`](tasks/T-01/README.md) |
| T-02 | El tag nuevo: la clase, el `kind` en sus tres tablas y la lectura del catálogo | done | — | `lib/signalling.js`, `lib/concurrent-hls.js`, `lib/controls.js`, `test/multiview-offer.test.js`, `test/fixtures/asset-lists/asset-list-offer-3.json` |
| T-03 | La tabla de geometría, de N a `viewport` | done | — | `tasks/T-03/` |
| T-04 | El contenido y la playlist señalizada de la demo nueva | done | — | `demo/multiview-offer/` (8 archivos versionados + contenido empaquetado) |
| T-05 | El estado de quien mira: `lib/multiview.js` | done | — | `tasks/T-05/` |
| T-06 | El cromo se puede quedar quieto: el mecanismo de *holds* | done | — | tasks/T-06/ |
| T-07 | El selector, la lista de casilleros en los controles | done | — | [`tasks/T-07/`](tasks/T-07/t07-el-selector.md) |
| T-08 | El anuncio: el popup que se va y el punto que se queda | pending | — | — |
| T-09 | Agrandar y desagrandar | done | — | `tasks/T-09/` (mas el wiring.patch, aplicado por el coordinador) |
| T-10 | La salida, por sus dos entradas | done | — | [`tasks/T-10/`](tasks/T-10/README.md) (mas el `way-out.patch`, sin aplicar: el boton vive en `lib/controls.js`) |
| T-11 | La página de la demo y la corrida mirada | pending | — | — |
| T-12 | La no-regresión: las tres suites y las dos demos que ya andan | pending | — | — |
| T-13 | La documentación: los dos de `docs/` y el README de la demo | pending | — | — |

**El orden lo pone el riesgo y no la dependencia.** La T-01 va primera porque es
la más grande, porque todo lo demás se apoya en que la composición pueda cambiar
sin reconstruirse, y sobre todo porque es **el único cambio de la fase que toca el
código que ya dibuja los avisos que andan**. Si rompe algo, conviene saberlo con
un solo cambio encima y no con seis.

La T-02, la T-03 y la T-04 no dependen de la T-01 ni entre sí, así que pueden ir
en paralelo. La T-05 necesita la T-02 y la T-03; la T-07 necesita la T-05 y la
T-06; la T-09 y la T-10 necesitan la T-07.

**Lo primero que se ve en pantalla es la página de medición de la T-01**, que
maneja el renderizado a mano por dos composiciones seguidas. Lo primero que se ve
**en la demo** es la T-07: hasta ahí la fase es headless, y decirlo por adelantado
evita la sensación de que no avanza.

**Por qué no hay una task de tests aparte, salvo la T-12.** El default del
proyecto es que lo que se construye viaje con sus tests, y en esta fase el grueso
de lo testeable es puro: el diff de la T-01, el parser y las tres tablas de la
T-02, la geometría de la T-03 y el estado de la T-05. Cada una lleva los suyos. La
T-12 es otra cosa y por eso sí es una task: no escribe tests nuevos de lo que la
fase construye, **verifica que lo que ya existía sigue en pie**.

---

## T-01 — La composición cambia sin reconstruirse

- **Objective:** la composición puede cambiar sin destruir y volver a crear los
  nodos que sobreviven: subir una vista, bajarla, agrandar y desagrandar mueven
  cajas en lugar de reconstruir. El reparto entre lo que se conserva, lo que se
  crea y lo que se destruye sale de una **función pura**, y queda fijada por test
  la equivalencia entre la ruta incremental y la total. Importa porque es el
  cambio más caro de la fase y el único que toca el código que ya dibuja los
  avisos que andan: acá es donde se puede romper la publicidad en silencio.

- **What it must cover:**
  - **El plan, como función pura y exportada.** Recibe lo dibujado y lo que tiene
    que estar, y devuelve qué se conserva, qué se crea, qué se destruye y qué se
    mueve. Nada de DOM adentro, porque todo el valor de la task es que se pueda
    testear sin navegador, igual que `boxToPixels`, `effectiveVolumeOf` y
    `fadesInAndOut`.
  - **La identidad con la que se compara.** Un elemento se reconoce por la regla 6
    del contrato, o sea por `itemId` más la identidad del elemento, **nunca por
    `id`**: dos experiencias solapadas sin `id` propio comparten ese campo, y
    comparar por ahí le entrega a un anunciante el nodo de otro.
  - **`build()` y `clear()` aplicando el plan** en lugar de ser totales.
  - **La cuarta razón para llamar a `place()`**, con la forma de `turning()`
    (`lib/renderer.js:645`): un predicado que compara la geometría dibujada contra
    la pedida y, cuando difieren, pide `place({ animate: true })`.
  - **La propiedad que las funciones totales compraban y hay que conservar: la
    composición no puede quedar a medias.** Aplicado el plan, lo dibujado es
    exactamente el objetivo, ni un nodo de más ni uno de menos. **Va escrito como
    aserción, no descubierto después.**
  - **La equivalencia, que es lo que la suite de hoy no puede ver.** Para una
    experiencia que no cambia, la ruta incremental y la total dejan la misma
    composición: mismos elementos, mismas cajas, mismo orden de apilado. Las 72
    pruebas actuales fueron escritas contra el comportamiento total, así que
    **pasan enteras aunque esto se rompa**, y por eso es una aserción nueva y no
    una que ya exista.
  - **La página de medición**, que es lo primero que se ve en pantalla: maneja el
    renderizado a mano por dos composiciones que comparten elementos y lee el
    `currentTime` de cada nodo antes y después. Molde:
    `.project/phases/01-poc-web-hlsjs/tasks/T-01/medicion-1.html`.
  - **Entry points:** `lib/renderer.js` —`tick` en 370, `createNode` en 421,
    `build` en 519, `bringAhead` en 582, `turning` en 645, `place` en 673,
    `clear` en 949—, la regla 6 de `docs/contrato-senalizacion-renderizado.md`, y
    los ADR 0070, 0050, 0051 y 0053.
  - **Constraints:** no se toca la firma del contrato ni una forma de dato. No se
    cambia el comportamiento visible de ningún layout existente: esta task es un
    refactor con capacidad nueva, y lo que ya se ve tiene que seguir viéndose
    igual. Si algo tiene que cambiar en pantalla, es un hallazgo y se reporta.
    Sin dependencias.

- **Definition of done:** `npm test` en verde con **las 72 de antes más las
  nuevas**; la equivalencia y la propiedad de "no queda a medias" con su aserción
  cada una; la página de medición mostrando que el `currentTime` de los nodos que
  sobreviven avanza y no vuelve a cero; y `npm run check` en verde, porque el
  refactor no puede meter una palabra de la demo adentro de `lib/`.

- **nivel de verificación:** **alto**. Cambia el código que dibuja todos los avisos
  y el error es invisible: una composición distinta en pantalla con la suite en
  verde. Lo que eso pide acá: tests nuevos de los bordes —lo dibujado vacío, el
  objetivo vacío, los dos iguales, un elemento que cambia de caja sin cambiar de
  identidad, dos experiencias solapadas sin `id` propio—; una **campaña de
  mutación scopeada**, con una rotura deliberada por regla —comparar por `id` en
  vez de por identidad, no destruir lo que sobra, no mover lo que cambió de caja,
  aplicar el plan a medias— corriendo en cada una **sólo los tests que cubren esa
  regla** y no la suite entera, y una rotura que queda verde es un hallazgo y no un
  pase; y la lectura del `currentTime` contra su propia referencia en la página de
  medición.

## T-02 — El tag nuevo: la clase, el `kind` en sus tres tablas y la lectura del catálogo

- **Objective:** la capa de señalización reconoce
  `com.qualabs.hls.multiViewInterstitial`, lo traduce al `kind` `'multiview'`, y
  lee un `payload` de tipo `multiViewOffer` con sus `views[]` y su `primaryName`.
  Importa porque es la puerta de entrada de todo lo demás: sin esto no hay oferta
  que mostrar.

- **What it must cover:**
  - **La clase y el `kind`**, al lado de las otras dos, sin tocar `kindOfClass()`.
  - **Las tres tablas indexadas por `kind`**, que son `KINDS_PLAYED` en
    `lib/concurrent-hls.js:157`, `RANGE_COLOURS` en `lib/controls.js:91` y
    `RANGE_TITLES` en `lib/controls.js:120`. **Un `kind` en dos de las tres
    produce un rango que el player reproduce y la barra no marca, sin error de
    ningún tipo**, y el propio comentario de `RANGE_TITLES` lo dice.
  - **Un test que asserta que las tres tablas tienen el mismo conjunto de
    claves.** Es lo que convierte "acordate de tocar las tres" en algo que no se
    puede olvidar, y es la mitigación de R7.
  - **La lectura del catálogo:** `views[]` con `id`, `name`, `type` y `uri`, y
    `primaryName` en el item. **Sin `viewport`, sin `zDepth` y sin `volume`**: si
    el payload los trae, se ignoran y se avisa, porque un `viewport` en una oferta
    es una posición calculada contra un número que el autor no conocía.
  - **`primaryName` ausente no rompe**: se usa una constante de la librería. Una
    oferta sin esa etiqueta es usable, no rota.
  - **El sobre no cambia:** `start`, `duration` y la acumulación de offsets por
    `DURATION` siguen siendo los de hoy, y eso se prueba con un asset-list de
    oferta cuyo `start` no es cero.
  - **Entry points:** `lib/signalling.js` —`CONCURRENT_CLASS` en 15,
    `KIND_OF_CLASS` en 32, `BLOCK` en 133, `usablePayload`, `resolveAssetList`,
    `resolveExperience`—, `lib/concurrent-hls.js:157`, `lib/controls.js:91` y
    `120`, y los ADR 0063 y 0064.
  - **Constraints:** no se toca el camino del aviso concurrente ni el del
    repliegue del ADR 0019. Sin dependencias.

- **Definition of done:** `npm test` en verde con las 72 de antes más las nuevas,
  incluido el test de las tres tablas; una oferta de ejemplo resuelta con sus
  nombres; y una oferta sin `primaryName` resuelta igual.

- **nivel de verificación:** **alto**. Es la premisa de la fase entera y su error
  más caro es silencioso —el `kind` en dos tablas—. Lo que eso pide acá: los tests
  de los bordes enumerados; una **campaña de mutación scopeada** con una rotura por
  regla —sacar el `kind` de una de las tres tablas, aceptar un `viewport` en la
  oferta, romper la acumulación del offset—, cada una corriendo sólo los tests de
  esa regla; y el control del test de las tres tablas, que es correrlo con una
  tabla incompleta a propósito **antes** de darlo por bueno, con su salida en la
  evidencia.

## T-03 — La tabla de geometría, de N a `viewport`

- **Objective:** una función pura que, dado cuántas cajas hay, devuelve la lista
  de `viewport` en orden. Importa porque es la pieza donde equivocarse deforma la
  imagen sin que nada lo diga.

- **What it must cover:**
  - **Las cuatro filas del ADR 0065**, con N=1 devolviendo la lista vacía.
  - **Que los cuatro valores de N=4 sean idénticos a los del Quad que ya está en
    el repositorio**, `demo/compatibility-pair/signalling/asset-list-multiView.json`.
    Se asserta contra ese archivo leído, no contra una copia escrita a mano: una
    copia que hay que mantener es una copia que se desincroniza.
  - **Que `sx == sy` para el contenido primario en las tres formas.** Es la razón
    por la que el N=2 lleva bandas negras, y la aritmética es la de `movePrimary`:
    `px.width / area.width` contra `px.height / area.height`.
  - **El orden**, que es el de la selección, y se asserta.
  - **Entry points:** `lib/signalling.js` (`parseViewport` en 72, `resolveElement`
    en 82), `lib/renderer.js` (`boxToPixels` en 267, `movePrimary` en 774 para la
    advertencia de deformación), los dos asset-lists citados, y el ADR 0065.
  - **Constraints:** nada de DOM. No se toca `boxToPixels` ni `movePrimary`. Sin
    dependencias.

- **Definition of done:** `npm test` en verde con las 72 de antes más las nuevas, y
  la aserción de N=4 leyendo el asset-list del repositorio.

- **nivel de verificación:** **alto**. Un error acá se ve pero se ve mal y tarde, y
  la deformación del primario es de las que se notan recién en cámara. Lo que eso
  pide acá: los tests de las cuatro filas y de `sx == sy`; una campaña de mutación
  scopeada con una rotura por regla —dar vuelta dos viewports, poner el N=2 a alto
  completo, invertir el orden—; y el caso de `sx == sy` chequeado a mano contra la
  aritmética de `movePrimary` para una de las tres formas, con los números en la
  evidencia.

## T-04 — El contenido y la playlist señalizada de la demo nueva

- **Objective:** `demo/multiview-offer/` tiene su contenido empaquetado y su
  script de señalización escribiendo una playlist con **los dos tags**: el
  concurrente que ya existe y el de multi view. Importa porque es lo que le da a
  toda la librería algo real contra qué correr, y porque no depende de nada de
  `lib/`, así que puede ir desde el primer día.

- **What it must cover:**
  - **El recorrido del ADR sobre 180 s:** un break concurrente `cornerOverlay` a
    los 20 s, una ventana de multi view con oferta de 3 vistas de los 45 a los
    105, y una de 5 vistas de los 120 a los 175. La segunda existe para ejercitar
    el caso de la grilla llena del ADR 0066, que la primera no puede mostrar.
  - **El contenido sale de lo que ya está descargado**, en
    `demo/compatibility-pair/content/.fuentes/`, y no se baja nada:
    `tos.mov` (734,17 s) para el primario, y tramos de `caminandes.mp4`
    (146,04 s), `ed.mp4` (75,25 s) y `sintel.mp4` (52,21 s) para las vistas. Las
    cinco de la segunda ventana salen de tramos **distintos** de esas tres
    fuentes, y eso no es sólo por falta de material: dos cajas mostrando la misma
    película en momentos distintos hacen evidente que son dos decodificadores y no
    uno duplicado.
  - **Los `name` los pone la demo**, que es lo que hace visible la regla de que la
    lista se lee por nombre de contenido.
  - **`CREDITS.md`**, copiando las cuatro filas CC BY del de `compatibility-pair`.
  - **Entry points:** `demo/compatibility-pair/scripts/` los tres scripts,
    `run.sh`, el ADR 0022, y la sección de la demo en `DESIGN.md`.
  - **Constraints:** **no se toca `demo/compatibility-pair/` ni
    `demo/hydration-break/`**, que son las dos que ya andan y una de ellas está
    grabada. El recipe de ffmpeg de `empaquetar-contenido.sh` se usa tal cual, sin
    cambiarle un parámetro: los 1280x720 a 30 fps son la configuración con la que
    se midieron los cinco decodificadores. Sin dependencias.

- **Definition of done:** `./run.sh multiview-offer` levanta y sirve; la playlist
  generada tiene los Date Ranges esperados con sus dos clases, contados por
  `grep -c`; y el script imprime la tabla del recorrido como hace el de
  `compatibility-pair`.

- **nivel de verificación:** **bajo**. Es empaquetado y señalización, y lo que sale
  mal se ve: un tag que falta es un break que no ocurre. La lógica no visual que sí
  lleva test es el conteo de Date Ranges por clase. Sin campaña de mutación. La
  suite entera corre una vez al final.

## T-05 — El estado de quien mira: `lib/multiview.js`

- **Objective:** existe el módulo que decora al proveedor y guarda lo único que
  esta fase agrega de estado mutable: cuáles vistas están tildadas, en qué orden, y
  cuál está agrandada. Importa porque es lo que hace que el contrato del ADR 0003
  no se toque.

- **What it must cover:**
  - **La decoración**: mismo `activeAt(time)` y mismo `programRanges()`. Lo que no
    es una oferta pasa de largo sin tocarse, y eso se asserta con un asset-list de
    aviso.
  - **Las operaciones**, devolviendo estado nuevo en vez de mutar, y **validando su
    resultado**, para que un estado imposible no sea alcanzable por la API. El test
    hand-escribe uno roto a propósito —cinco tildadas, la misma vista dos veces, la
    agrandada no tildada— y comprueba el rechazo. **Es lo que le da a la validación
    una forma de fallar.**
  - **Los casos que valen:** tildar la primera, tildar con la grilla llena,
    destildar la última, destildar la que está agrandada, y una oferta que se
    cierra con cosas tildadas.
  - **El contenido principal siempre tildado y bloqueado** (ADR 0067).
  - **Entry points:** `lib/signalling.js` para la firma del proveedor,
    `docs/contrato-senalizacion-renderizado.md`, los ADR 0072, 0065, 0066 y 0067, y
    `projects/aws-multiview/demo-ibc/js/composition.js` como molde de la forma del
    estado —no de su contenido, que es de otro producto—.
  - **Constraints:** nada de DOM. No se toca `lib/signalling.js` ni
    `lib/renderer.js`. Depends-on T-02 y T-03.

- **Definition of done:** `npm test` en verde con las 72 de antes más las nuevas;
  cada caso de arriba con su aserción; y el estado roto hand-escrito rechazado.

- **nivel de verificación:** **alto**. Es la máquina que decide qué se dibuja, y un
  estado inconsistente se ve como una caja que falta y no como un error. Lo que eso
  pide acá: los tests de los bordes enumerados; una campaña de mutación scopeada
  con una rotura por regla —permitir cinco, permitir duplicados, dejar la agrandada
  fuera de las tildadas, dejar destildar el primario—; y el control de la
  validación, que es el estado roto escrito a mano.

## T-06 — El cromo se puede quedar quieto: el mecanismo de *holds*

- **Objective:** `lib/controls.js` tiene un mecanismo por el que cualquier
  componente suspende el auto-ocultado, y el temporizador sólo corre cuando todos
  lo soltaron. Importa porque sin esto el selector se cierra a los 2,6 segundos en
  medio de la elección, y es lo único del cromo que se construye de cero.

- **What it must cover:**
  - **Un `Set` de holds**, no un booleano: dos componentes pueden tenerlo tomado a
    la vez y el que suelta primero no puede bajar el cromo del otro.
  - **Soltar es idempotente** y soltar algo que no se tomó no rompe.
  - **No se cambia el comportamiento sin holds**: con el `Set` vacío, el cromo se
    oculta exactamente como hoy, a `CONTROLS_HIDE_MS` y `CONTROLS_HIDE_TOUCH_MS`.
  - **Entry points:** `lib/controls.js` —`arm`, `show`, `hide` en 723-735, las dos
    constantes en 72-73—, el ADR 0067, y
    `projects/aws-multiview/demo-ibc/js/visibility.js`, que es el mecanismo del que
    esto se copia.
  - **Constraints:** no se cambian los dos tiempos. Sin dependencias.

- **Definition of done:** con un hold tomado, el cromo sigue arriba después de 6
  segundos sin actividad —más que el temporizador táctil de 5—; soltado, se oculta;
  y **el control: la misma espera de 6 segundos sin hold oculta el cromo**. Sin ese
  control el chequeo no puede fallar, porque un cromo que se queda arriba por un
  bug se ve igual que uno que se queda arriba por el hold.

- **nivel de verificación:** **bajo**. Es comportamiento de interfaz y el error está
  en la pantalla. La lógica no visual —el `Set` y su idempotencia— sí lleva test.
  Sin campaña de mutación. Capturas de los dos estados.

## T-07 — El selector, la lista de casilleros en los controles

- **Objective:** hay un control en la fila de arriba, al lado del audio, que abre
  la lista de todo lo que la oferta declara y deja tildar y destildar. Importa
  porque es la interfaz del pedido entero, y porque es **lo primero de esta fase
  que se ve en la demo**.

- **What it must cover:**
  - **Una fila por vista**, con su `name`, más la fila del contenido principal
    tildada y bloqueada.
  - **Tildar sube y destildar baja**, contra el estado de la T-05.
  - **Con cuatro tildadas, las demás deshabilitadas**, con una línea que dice por
    qué (ADR 0066).
  - **Toma un hold mientras está abierta** (T-06) y lo suelta al cerrar. Cierra al
    elegir, al tocar afuera, o con escape.
  - **El cierre por toque afuera se escucha en el contenedor del player y no en el
    documento**, porque en pantalla completa el documento de afuera no está en
    pantalla. Es la lección de `menu.js`.
  - **Vive adentro del elemento del player** (ADR 0015, y la R2 de
    `aws-multiview`).
  - **Entry points:** `lib/controls.js` —`createControls` en 536, la fila de
    arriba, `button()` en 464, `ICON` en 445, `CONTROLS_CSS` en 151—,
    `projects/aws-multiview/demo-ibc/js/menu.js` para la anatomía, y los ADR 0067,
    0066 y 0015.
  - **Constraints:** nada de `lib/` puede nombrar la demo: `npm run check` tiene
    que seguir verde. Depends-on T-05 y T-06.

- **Definition of done:** con la ventana abierta, tildar la primera vista pone dos
  cajas en pantalla; tildar la segunda y la tercera recorre las tres formas;
  destildar las baja; con cuatro tildadas las demás filas están deshabilitadas. Más
  capturas al tamaño real de uso de la lista abierta, de la lista con filas
  deshabilitadas, y de las tres formas.

- **nivel de verificación:** **bajo**. Es interfaz y el error está en la pantalla. Lo
  que eso pide acá: tests sólo de la lógica no visual —qué filas se habilitan y en
  qué orden se listan—; la verificación principal es mirar las capturas, una por
  estado; y la suite entera corre una vez al final y no por cambio. Sin campaña de
  mutación. Nicolás pidió que sea *"muy estético y lindo"*, así que las capturas son
  para que él lo mire y esta task es el punto donde puede volver con una corrección.

## T-08 — El anuncio: el popup que se va y el punto que se queda

- **Objective:** cuando se abre la ventana aparece un popup sutil sobre la imagen
  que dice que hay multi view disponible y se va solo, y el control del selector
  lleva un punto mientras nadie subió ninguna cámara. Importa porque el riesgo de
  descubrimiento es el que `aws-multiview` pagó con cuatro tasks.

- **What it must cover:**
  - **El popup** aparece al abrirse la ventana, no se toca, no abre nada, y se va
    solo a los pocos segundos.
  - **El punto** está mientras la ventana está abierta y no hay ninguna vista
    tildada, y desaparece con la primera.
  - **Ninguno de los dos sobrevive al cierre de la ventana.**
  - **Entry points:** `lib/controls.js`, el ADR 0068, y el `REPORT.md` de
    `projects/aws-multiview/.project/phases/02-player-con-overlay-selector/` para
    el costo del riesgo que esto mitiga.
  - **Constraints:** el popup va sobre la imagen pero no puede tomar pointer
    events, porque lo que hay debajo sigue siendo el primario y su toque suelta el
    foco (ADR 0031). Depends-on T-07.

- **Definition of done:** capturas de los tres estados —ventana abierta sin nada
  tildado con popup, el mismo momento pasados los segundos con el punto y sin
  popup, y con una vista tildada sin punto—; y un chequeo de que un toque sobre el
  popup llega al primario y no al popup.

- **nivel de verificación:** **bajo**. Es interfaz. Sin tests nuevos salvo el de
  pointer events, que no es visual. Sin campaña de mutación. Las capturas son la
  verificación.

## T-09 — Agrandar y desagrandar

- **Objective:** cada caja de video tiene un botón que la agranda a cuadro entero
  dándole también el audio, y otro que la devuelve a su lugar sin tocar el audio.
  Los dos aparecen sólo con el cromo arriba. Importa porque es la mitad del pedido
  que no es el selector.

- **What it must cover:**
  - **Agrandar es una llamada a `setFocus` sobre esa caja** más el cambio de su
    `box` a cuadro entero con el `zDepth` más alto. No se escribe una segunda ruta
    de audio: `setFocus` es la puerta única de la fase 06.
  - **Desagrandar devuelve la geometría y no llama a `setFocus`.** La caja vuelve
    a su lugar y sigue sonando, con su anillo puesto (ADR 0069).
  - **Las otras cajas se tapan y siguen reproduciendo**, que es lo que hace que
    desagrandar sea instantáneo.
  - **Los botones aparecen sólo con el cromo arriba**, colgando del predicado
    `up()` que ya existe, sin una rama por dispositivo.
  - **El botón detiene la propagación**, para no pisar el `pointerdown` de la caja
    que mueve sólo el audio (ADR 0028).
  - **Entry points:** `lib/renderer.js` —`createNode` en 421 para el listener que
    ya existe, `setFocus` en 866, `place` en 673—, `lib/controls.js` para `up()`,
    y los ADR 0069, 0028, 0026 y 0030.
  - **Constraints:** no se agrega una salida al foco: las cinco de la fase 06
    quedan como están. Depends-on T-01 y T-07.

- **Definition of done:** los `volume` de las cuatro cajas y del primario leídos en
  tres momentos —en la grilla, con una agrandada, y de vuelta en la grilla— con la
  tercera lectura **igual a la segunda**; el `currentTime` de las cuatro sin saltos
  a cero a través de agrandar y desagrandar; y con el cromo abajo, el botón no está.

- **nivel de verificación:** **alto**. El audio es la falla que nada en pantalla
  reporta, y ésta es la task que lo mueve desde un lugar nuevo. Lo que eso pide
  acá: tests de la aritmética de la mezcla en los tres momentos, apuntados a
  `effectiveVolumeOf` que ya es pura; una campaña de mutación scopeada con una
  rotura por regla —que desagrandar suelte el foco, que agrandar no lo tome, que el
  botón no detenga la propagación—; y las tres lecturas de `volume` contra su
  propia referencia, con los números en la evidencia.

## T-10 — La salida, por sus dos entradas

- **Objective:** salir del multi view devuelve el contenido principal exactamente
  como venía, y lo hace por una sola implementación con dos entradas: el botón de
  salir y destildar la última vista. Importa porque es el invariante que Nicolás
  puso en palabras y el único de la fase que él nombró como no negociable.

- **What it must cover:**
  - **Las dos entradas llaman a lo mismo.** No se escribe un `exitMultiview()` que
    restaure cosas: eso sería la segunda fuente de verdad.
  - **Destildar la última deja una sola caja**, que por el ADR 0065 es ninguna
    composición, así que `clear()` corre por la razón por la que ya corría.
  - **El botón de salir**, en la fila de arriba.
  - **La ventana que se cierra con cosas tildadas sale por el mismo camino.**
  - **Entry points:** `lib/renderer.js:949` (`clear`), `lib/controls.js`, y los
    ADR 0071 y 0065.
  - **Constraints:** no se toca `clear()` más que lo que la T-01 ya le hizo. Ni una
    línea de `lib/` puede tocar `textTracks`. Depends-on T-05 y T-07.

- **Definition of done:** por **cada una de las dos entradas**, y por el cierre de
  ventana: `getAttribute('style')` del `<video>` primario es `null` antes de subir
  la primera vista y `null` después de salir; `video.volume` vale 1; y no queda
  ningún nodo de vista en la capa. **Que las dos entradas den lo mismo es lo que
  prueba que hay una sola puerta**; si divergen, alguien escribió la segunda.
  Más: `grep -i "texttrack\|cue\|subtitle\|caption" lib/*.js` devuelve cero,
  **corrido además sobre un `lib/` con una ocurrencia plantada a propósito** para
  comprobar que la encuentra.

- **nivel de verificación:** **alto**. Es el invariante que Nicolás nombró y su
  falla se descubre en cámara. Lo que eso pide acá: las comparaciones de arriba
  contra su propia referencia, con los valores en la evidencia; una campaña de
  mutación scopeada con una rotura por regla —que una entrada no llame a `clear`,
  que el `volume` no vuelva a 1, que quede un nodo—; y el control del grep, que es
  la parte sin la cual ese chequeo no puede fallar.

## T-11 — La página de la demo y la corrida mirada

- **Objective:** `demo/multiview-offer/` tiene su página y la corrida de 180 s se
  mira entera. Importa porque es donde la fase se ve como un todo y donde aparece
  lo que ninguna task suelta muestra.

- **What it must cover:**
  - **La página**, con el bloque fenceado de lo que un integrador escribe, como en
    las otras dos demos.
  - **La corrida entera mirada**, con los dos tags: el break concurrente a los 20 s
    dibujando su `cornerOverlay`, y las dos ventanas de multi view.
  - **Los cuatro decodificadores leídos del navegador**: con la grilla de 2x2 en
    pantalla, los cuatro elementos con `readyState` 4, `paused` en `false` y
    `currentTime` avanzando. Es el instrumento de la fase 03 y no capturas.
  - **La consola imprime un `[signalling]` por Date Range resuelto**, con sus dos
    clases.
  - **El `README.md` de la demo.**
  - **Entry points:** `demo/hydration-break/index.html` y `js/app.js` como molde,
    `demo/compatibility-pair/README.md`, y el ADR 0022.
  - **Constraints:** la página no reimplementa nada de la librería. Depends-on
    T-04, T-07, T-08, T-09 y T-10.

- **Definition of done:** `./run.sh multiview-offer` levanta y la corrida completa
  se hace de punta a punta; las lecturas de los cuatro elementos con sus números; y
  capturas de las tres formas y del aviso concurrente.

- **nivel de verificación:** **bajo**. Es la corrida mirada y el error está en la
  pantalla. La lectura del estado del navegador no es visual y va con sus números.
  Sin campaña de mutación. La suite entera corre una vez, al final.

## T-12 — La no-regresión: las tres suites y las dos demos que ya andan

- **Objective:** queda probado que nada de lo que ya funcionaba de publicidad se
  rompió. Importa porque es un requisito que puso Nicolás —*"en el proceso también
  verificar que no se rompa nada de lo que hicimos de ads, si hay tests o cosas
  correrlas obviamente"*— y porque la fase toca el código que dibuja los avisos.

- **What it must cover:**
  - **Las tres cosas que el repositorio ya tiene, contra la línea de base medida el
    2026-09-11 y escrita en `PHASE.md`:** `npm test` con sus **72 pruebas en
    verde** más las que la fase agregó; `npm run check` verde con las dos costuras
    y cero hits; y `npm run mutaciones`.
  - **La demo del break de hidratación, que es la que está grabada.** Su
    `test/signalled-run.test.js` lee sus archivos declarados —`plate.json`, su
    asset list, su guion y su script de señalización— y ejecuta el `resolveAnchor`
    de su propia página, así que verde ahí significa que su corrida no cambió de
    forma. Más `npm run mutaciones`, que corre sus tres comprobaciones sobre copias
    rotas a propósito.
  - **El recorrido de `compatibility-pair`, comparado contra su propia
    referencia.** La suite no ve píxeles, así que esto es lo que cubre el hueco que
    `PHASE.md` nombra: se corren los 180 s y se leen, en una lista de segundos
    muestreados que cubra los cinco breaks, **qué elementos hay dibujados y en qué
    caja está cada uno en píxeles**; se compara contra la misma lectura tomada
    antes de la fase. Igual quiere decir igual.
  - **La lectura de antes se toma al principio de la fase y no al final**, porque
    después ya no hay con qué compararla. Es la primera cosa que hace esta task,
    aunque su cierre sea de los últimos.
  - **Entry points:** `package.json` para los tres scripts,
    `demo/hydration-break/test/` los tres archivos,
    `demo/compatibility-pair/test/signalled-run.test.js`, `scripts/verificar-cortes.mjs`,
    y la sección "El criterio de la fase" de `PHASE.md`.
  - **Constraints:** **no se modifica ningún test existente para que pase.** Un
    test que se pone rojo es un hallazgo y se reporta antes de tocarlo; si el
    comportamiento cambió a propósito, el cambio va argumentado y el test se
    reescribe con esa razón escrita, no en silencio. Depends-on todas las que tocan
    `lib/`.

- **Definition of done:** los tres comandos en verde con sus conteos citados; el
  `signalled-run.test.js` de las dos demos existentes en verde; y la comparación
  del recorrido de `compatibility-pair` antes contra después, con las dos lecturas
  guardadas en la evidencia y la diferencia en cero.

- **nivel de verificación:** **alto**. Es la task que existe para atajar el error
  invisible, así que verificarla de menos anula su motivo. Lo que eso pide acá: las
  dos lecturas del recorrido con sus números en la evidencia y no un "quedó igual";
  y **el control, que es lo que le da forma de fallar**: la comparación se corre una
  vez contra una lectura alterada a mano —un elemento movido diez píxeles— y tiene
  que salir roja. Sin ese control, un comparador que siempre dice "igual" pasa
  desapercibido.

## T-13 — La documentación: los dos de `docs/` y el README de la demo

- **Objective:** los documentos que describen el sistema siguen describiéndolo.
  Importa porque es la recomendación 2 del informe de la fase 06 en forma
  operativa, y porque esta fase cambia comportamiento del producto.

- **What it must cover:**
  - **`docs/contrato-senalizacion-renderizado.md`**: el `kind` `'multiview'`, y que
    el reparto de los nodos pasó a ser incremental, que es una promesa del lado del
    renderizado. **Las formas de dato no cambian y eso también se dice**, porque un
    lector que ve una fase nueva supone que sí.
  - **`docs/integrating-the-library.md`**: la superficie pública y los controles.
  - **El `README.md` de `demo/multiview-offer/`**, si la T-11 no lo dejó cerrado.
  - **Entry points:** los dos documentos, el `REPORT.md` de la fase 06 sección 6, y
    `knowledge/documentation-policy.md` del repo padre para la distinción entre
    documento vigente y registro.
  - **Constraints:** los dos documentos se corrigen en su lugar, como si siempre
    hubieran dicho lo nuevo; no llevan nota de cambios. Depends-on todas.

- **Definition of done:** los dos documentos leídos de punta a punta con la
  pregunta "¿esto sigue describiendo el sistema?" y corregido lo que no; y dicho en
  el informe qué se tocó de cada uno y por qué, o por qué no hizo falta.

- **nivel de verificación:** **mínimo**. Es prosa que una persona lee antes de que
  nada dependa de ella. Sin tests nuevos y sin campaña de mutación.
