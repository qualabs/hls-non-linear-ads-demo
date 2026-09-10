# Tasks — fase 09-las-transiciones-de-la-composicion

| id | brief | status | plan | evidence |
| --- | --- | --- | --- | --- |
| T-01 | Las dos funciones puras, las constantes y sus tests | done | — | tasks/T-01/ |
| T-02 | La geometría del primario, entrada y salida | done | — | tasks/T-02/ |
| T-03 | El difuminado de los nodos de aviso, entrada y salida | done | — | tasks/T-03/ |
| T-04 | El párrafo al integrador | done | — | — |
| T-05 | La corrida mirada y las suites | done | — | tasks/T-05/ |
| T-06 | La cama negra deja de romper el alfa de una imagen | done | — | tasks/T-06/ |

El orden lo pone el riesgo: la T-01 es lo único que se cierra sin navegador, y la
T-02 es donde se mide R1 antes de construir nada encima. La T-03 depende de la
agenda que deja la T-02, y **de la T-06**, que corre antes que ella aunque su
número sea posterior: un nodo con cama negra difumina la cama, así que el
difuminado del banner no se puede entregar bien hasta que la T-06 esté.

**Por qué no hay una task de tests aparte.** El default del proyecto es que lo que
se construye viaja con tests propios, y acá esos tests **son** la T-01: el renderer
con DOM no está testeado y esta fase no cambia esa línea (fuera de alcance). Lo que
se puede volver puro —el discriminante y la aritmética de la agenda— se testea ahí,
y lo que queda es pintura, que se mira en la T-05.

---

## T-01 — Las dos funciones puras, las constantes y sus tests

- **Objective:** la librería expone, como funciones puras y exportadas, **qué
  elemento difumina** y **en qué instante empieza una salida**, con los cuatro
  tiempos como constantes al lado; y `node --test` las cubre, incluidos los bordes.
  Importa porque es el único lugar de la fase donde equivocarse no se ve en
  pantalla: un aviso a cuadro entero que difumina se nota, pero veinte
  milisegundos de corrimiento en el umbral, no.

- **What it must cover:**
  - **El discriminante del difuminado.** Un elemento de aviso difumina salvo que su
    experiencia sea un aviso a cuadro entero, o sea `experience.type ===
    LINEAR_TYPE`. `LINEAR_TYPE` ya está exportado en `lib/signalling.js:142`; no
    inventar una etiqueta nueva ni leer el asset list.
  - **La aritmética de la agenda.** Cuánto queda de la ventana de una experiencia
    en un instante dado, que es
    `experience.startTime + experience.duration - time`; la misma cuenta está hecha
    hoy en `renderer.js:330`. Y, dado ese resto y un umbral, si el elemento está
    entrando, en régimen, o saliendo.
  - **Las constantes**, exportadas arriba de `lib/renderer.js` junto a
    `PRELOAD_LEAD_SECONDS` y `CUT_TOLERANCE_SECONDS`: 380 ms de geometría, 200 ms
    de difuminado de entrada, 120 ms de salida, más las curvas. Un solo número para
    las dos direcciones de la geometría (ADR 0054).
  - **Los casos de borde, y son los que valen:** el instante exacto del umbral, un
    tiempo anterior al arranque de la ventana, un tiempo posterior a su cierre, una
    ventana **más corta que la transición** (R2, donde el objetivo tiene que ser la
    identidad desde el primer cuadro), y `duration` en cero.
  - **Los fixtures ya existen y se usan tal cual**, sin agregar ninguno:
    `test/fixtures/asset-lists/asset-list-squeezebackLShape.json` y
    `asset-list-cornerOverlay.json` difuminan; `asset-list-linear.json` y los tres
    `asset-list-repliegue-*.json` no. Que el repliegue caiga del lado del lineal es
    parte del criterio, no una casualidad (ADR 0019).
  - **Entry points:** `lib/renderer.js` (las constantes exportadas de las líneas
    28-66 y `warnIfCut` en 700 para el idioma de la cuenta), `lib/signalling.js:142`
    y `208-217` para `LINEAR_TYPE` y `linearItem`, `test/audio-focus.test.js` como
    molde de un suite de este proyecto, y los ADRs 0050, 0052, 0054 y 0055.
  - **Constraints:** nada de DOM en estas funciones, porque todo el valor de la task
    es que se puedan testear sin navegador. No se toca ninguna función existente ni
    se cambia ninguna firma: esta task **sólo agrega**. Sin dependencias.

- **Definition of done:** `npm test` en verde con los suites nuevos, cada caso de
  borde de arriba con su aserción, y las constantes exportadas y usadas por los
  tests en lugar de estar repetidas como literales.

- **nivel de verificación:** **alto**. Es la premisa sobre la que se construyen las
  tres tasks que siguen y el único pedazo de la fase que los tests alcanzan. Lo que
  eso pide acá: los tests de los bordes enumerados arriba; una **campaña de
  mutación scopeada**, con una rotura deliberada por regla —invertir el
  discriminante del lineal, correr el umbral un cuadro, dar vuelta el signo del
  resto— corriendo en cada una **sólo los tests que cubren esa regla** y no la suite
  entera, y una rotura que queda verde es un hallazgo y no un pase; y el control de
  R7, que es correr el test del discriminante contra el predicado invertido a
  propósito **antes** de darlo por bueno, con su salida en la evidencia.

## T-02 — La geometría del primario, entrada y salida

- **Objective:** el contenido primario **se mueve con tiempo** entre las cajas que
  los layouts le dan: se achica en los primeros 380 ms de la ventana de un aviso y
  vuelve al cuadro entero en los últimos 380 ms, y un cambio de tamaño de la
  ventana lo re-coloca sin animar. Y queda medido si una transición de CSS arranca
  del todo en este archivo, que es la premisa de la fase entera (R1).

- **What it must cover:**
  - **La animación va por `transform` y por nada más.** `movePrimary` ya escribe el
    movimiento en una sola línea (`renderer.js:560`); las otras cuatro son la caja
    base y no se animan. Nunca `left`, `top`, `width` ni `height` (ADR 0051).
  - **`place()` sigue siendo el único que escribe**, y `tick()` gana un tercer
    disparador: además de que cambie el aviso activo y de que se mueva el área, que
    un elemento cruce el umbral de su salida. Cada entrada de `drawn` recuerda qué
    se le escribió por última vez, así que no se reescribe por cuadro (ADR 0052).
  - **La `transition-property` viaja en la misma pasada que la geometría**, que es
    lo que hace que el camino de componer anime y el de re-colocar no (ADR 0053).
    Es también la mitigación de R1: `clear()` le borra el atributo `style` entero al
    primario y la declaración tiene que estar en el estilo posterior al cambio.
  - **La entrada de `drawn` del primario necesita su experiencia.** Hoy se empuja
    sin ella (`renderer.js:383`), así que no hay de dónde leer la ventana para
    agendar la salida. Se le agrega el campo; `warnIfCut` ya se protege de que no
    esté (`renderer.js:701`), así que no cambia nada de lo que funciona.
  - **`clear()` no cambia.** En el borde de la ventana el primario ya está en el
    cuadro entero, así que borrarle el atributo `style` en el acto —lo que hace hoy
    en `renderer.js:721-737`— es visualmente un no-op, y el borrado sigue siendo
    obligatorio porque con la composición vacía `place()` no recorre nada.
  - **Se mide R1 primero.** Antes de escribir la salida: componer una L en el
    navegador y confirmar que el achique se ve interpolado y no de golpe. **Si no
    arranca, se para y se reporta**; la alternativa es una hoja inyectada por la
    librería (`controls.js:459-461` es el precedente) y eso cambia el tamaño de la
    fase.
  - **Entry points:** `lib/renderer.js`, y adentro `tick()` (249-287), `place()`
    (472-496), `movePrimary()` (550-565), `build()` (374-399) y `clear()` (711-740).
    Los ADRs 0050, 0051, 0052 y 0053. Para mirar, `./run.sh compatibility-pair` y su
    `asset-list-squeezebackLShape.json`.
  - **Constraints:** no se toca `demo/`. No se toca `applyAudio`, `applyPlayback`,
    `attachAsset` ni el `startAt` de ningún nodo (ADR 0055). No se anima el
    redimensionado. La vuelta atrás es un revert del archivo: la fase no tiene
    migración ni estado persistido. Depende de la T-01 (las constantes y la
    aritmética).

- **Definition of done:** en `demo/compatibility-pair`, la L entra con el primario
  achicándose de forma visible y continua y sale con el primario creciendo hasta el
  cuadro entero, terminando **antes** de que el break cierre; el aviso a cuadro
  entero de `asset-list-linear.json` no muestra ningún movimiento del primario en
  ninguna de las dos puntas; redimensionar la ventana durante un break re-coloca sin
  animar; y `npm test` sigue en verde.

- **nivel de verificación:** **bajo**. Es la imagen en la pantalla: el error se ve
  mirando y arreglarlo es una línea. Lo que eso pide acá: la lógica no visual que
  hay adentro ya está testeada en la T-01 y no se duplica; la verificación principal
  es mirar, con una captura por estado —entrada, régimen, salida, redimensionado— al
  tamaño real de uso; y la suite entera se corre **una vez al final** y no por
  cambio.

## T-03 — El difuminado de los nodos de aviso, entrada y salida

- **Objective:** un nodo de aviso **entra difuminándose** en los primeros 200 ms de
  su ventana y **sale difuminándose** en los últimos 120 ms, salvo cuando su
  experiencia es un aviso a cuadro entero, que aparece y desaparece seco.

- **What it must cover:**
  - **La entrada aprovecha lo que ya está.** Los nodos que `bringAhead` trae
    anticipados ya están en el DOM en opacidad 0 (`renderer.js:440`), así que la
    entrada es subir esa opacidad con transición en lugar de borrar la propiedad
    (`renderer.js:395`).
  - **Un nodo construido en el momento entra sin difuminado**, y es una decisión y
    no un olvido (ADR 0050): se crea y se inserta en la misma pasada, y ahí una
    transición no arranca sin forzar un reflow o esperar un cuadro. El camino es el
    de caer en el medio de la ventana de un aviso, o sea un seek, donde un
    difuminado además sería incorrecto.
  - **La salida usa la agenda de la T-02**, no un mecanismo propio: mismo tercer
    disparador, mismo `place()`, mismo recuerdo de lo último escrito.
  - **El aviso a cuadro entero queda seco en las dos puntas**, y lo decide el
    discriminante de la T-01. Un nodo que no difumina se destruye en el borde como
    se destruye hoy.
  - **Un seek hacia atrás que salga de los últimos 120 ms tiene que volver a subir
    la opacidad.** Sale gratis si el valor se escribe como función del instante y no
    como reacción a un evento que ya pasó, y es el chequeo que lo demuestra.
  - **Entry points:** `lib/renderer.js`, y adentro `build()` (374-399), `place()`
    (472-496), `bringAhead()` (429-453) y `createNode()` (293-368). Los ADRs 0050 y
    0052.
  - **Constraints:** no se toca `demo/`. No se anima la caja de ningún nodo (ADR
    0051). No se le recorta ni se le demora contenido a ningún creativo: el nodo
    arranca en el instante 0 de su ventana como arranca hoy (ADR 0055). Depende de
    la T-01 y de la T-02.

- **Definition of done:** en `demo/compatibility-pair`, el banner de imagen y el
  overlay entran y salen difuminándose; el aviso a cuadro entero de
  `asset-list-linear.json` y el repliegue de `asset-list-repliegue-bloque-roto.json`
  aparecen y desaparecen sin difuminado; un seek hacia atrás desde los últimos 120 ms
  de un aviso lo devuelve a opacidad plena; y `npm test` sigue en verde.

- **nivel de verificación:** **bajo**. Misma razón que la T-02: es opacidad en
  pantalla. Una captura por estado —entrando, en régimen, saliendo, y el lineal en
  sus dos puntas—, sin tests nuevos más allá de los de la T-01, y la suite entera una
  vez al final.

## T-04 — El párrafo al integrador

- **Objective:** quien integra la librería sabe, leyendo `docs/`, que la imagen del
  contenido primario **se mueve sola**, que eso es la librería y no su página, que no
  es configurable, y dónde están los números por si quiere discutirlos.

- **What it must cover:** un párrafo en `docs/integrating-the-library.md`, y nada
  más. Qué se anima (la geometría del primario y la opacidad de los nodos de aviso),
  qué no (el aviso a cuadro entero, y ninguna propiedad de layout), que el tiempo
  sale de la ventana del propio aviso, y el nombre de las constantes. **El contrato
  no se toca**: `docs/contrato-senalizacion-renderizado.md` describe la superficie
  entre las dos capas y esa superficie no cambió (ADR 0050). Entry points:
  `docs/integrating-the-library.md` y el ADR 0054. Constraint: no repetir los
  valores en el texto — se nombra la constante, porque un número copiado en un doc
  es un número que queda viejo. Depende de la T-01 (las constantes ya nombradas).

- **Definition of done:** el párrafo está, nombra las constantes en lugar de sus
  valores, y `docs/contrato-senalizacion-renderizado.md` no tiene ningún cambio.

- **nivel de verificación:** **mínimo**. Es texto que una persona lee antes de que
  algo dependa de él. Sin tests y sin campaña: se relee una vez.

## T-05 — La corrida mirada y las suites

- **Objective:** los efectos están mirados enteros en las dos demos y las dos suites
  están en verde, así que la fase se puede cerrar con la evidencia de lo que se ve y
  no con la de lo que debería verse.

- **What it must cover:**
  - **En `demo/compatibility-pair`**, los seis casos que ya están autorados: la L
    con su geometría, el banner de imagen y el overlay con su opacidad, el aviso a
    cuadro entero y el repliegue sin nada, el redimensionado durante y después de un
    break, y el seek hacia atrás desde los últimos 120 ms.
  - **En `demo/hydration-break`**, corriéndola sin tocar un archivo, la forma del
    ADR 0047: el primario tapando al backplate mientras crece, en los últimos 380 ms
    de la L y antes de que el aviso a cuadro entero arranque. Es la forma que Nicolás
    describió y la única de las dos demos que la tiene. Aceptar que el contenido de
    esa demo está a mitad de camino en otra sesión, y que si algo de su contenido
    falla eso **no** es un hallazgo de esta fase.
  - **R3, mirado y no supuesto:** los últimos 120 ms de la L, donde el backplate se
    difumina mientras el primario todavía lo tapa. Si aparece una banda fina de
    fondo, se anota y se propone la línea del ADR 0052 —un elemento con `zDepth` por
    debajo del primario no difumina a la salida— **sin escribirla en esta task**.
  - **R4, mirado:** el creativo del aviso a cuadro entero se ve y se oye entero, y
    `warnIfCut` no dice nada que no dijera antes de la fase.
  - **R5, mirado:** ningún tirón durante las transiciones.
  - **`npm test` y `npm run check`** en verde, corridos enteros.
  - **Entry points:** `./run.sh compatibility-pair` y `./run.sh hydration-break`, el
    README de cada demo para el paso de encender el audio, y el skill `playwright`
    si hace falta manejar el navegador.
  - **Constraints:** no se escribe en `demo/`. Depende de la T-02, la T-03 y la
    T-04.

- **Definition of done:** una captura por caso guardada como evidencia, la corrida
  de las dos suites pegada, y una línea por cada uno de R3, R4 y R5 diciendo qué se
  vio. Si algo se ve mal, queda anotado con la vuelta propuesta y no se arregla acá.

- **nivel de verificación:** **bajo**. La task es la verificación, y su forma es
  mirar: capturas al tamaño real de uso, una por estado. Un estilo computado no es
  evidencia de que algo se vea.

## T-06 — La cama negra deja de romper el alfa de una imagen

- **Objective:** una imagen de aviso con canal alfa **conserva su transparencia**
  cuando la librería la compone sobre el contenido primario, y el nodo de video
  conserva su cama negra. Importa por dos cosas a la vez: es una capacidad que la
  demo del break de hidratación anuncia y que con la línea puesta no existía, y es
  una precondición de la T-03, porque un nodo con cama difumina la cama.

- **What it must cover:**
  - **La condición y no el borrado.** `createNode` escribía `background: '#000'`
    incondicionalmente; pasa a escribirlo sólo cuando el nodo no es una imagen. La
    cama del video se queda: sacarla devuelve el parpadeo del contenido primario a
    través del aviso mientras decodifica.
  - **El discriminante es `isImage`**, que el archivo ya calcula para decidir qué
    elemento crear. No una tabla de qué formatos llevan alfa: el contrato rechaza
    que esta capa lea un contenedor para deducir lo que hay adentro (ADR 0056).
  - **Entry points:** `lib/renderer.js`, `createNode` y la constante `isImage` de
    arriba del archivo. El ADR 0056.
  - **Constraints:** no se toca `demo/`, ni el creativo, ni el SVG que lo genera.
    Lo que esta task arregla es que la librería deje de romper el alfa; que el
    creativo se vea bien es de quien lo hace. Sin dependencias — corre antes de la
    T-03.

- **Definition of done:** la misma aserción sobre el DOM vivo, corrida antes y
  después del arreglo, muestra que el `<img>` del banner pasó de tener el
  `background` inline a no tenerlo **y que el `<video>` del backplate lo tiene en
  las dos corridas**; una captura del mismo cuadro antes y después muestra la
  diferencia; y `npm test` en verde con los casos de `isImage`.

- **nivel de verificación:** **bajo**. El error se ve en pantalla en las dos
  direcciones y arreglarlo es una línea. Lo que eso pide acá: tests para la lógica
  no visual, que es `isImage` decidiendo sobre un `mediaType` —incluido el ausente,
  que tiene que caer del lado que conserva la cama—; la verificación principal es
  mirar, con la captura del mismo cuadro antes y después; y sin campaña de
  mutación, porque la regla tiene un solo eje y la aserción antes/después ya la
  prueba en sus dos valores.
