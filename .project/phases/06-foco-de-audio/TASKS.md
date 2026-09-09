# Tasks — fase 06-foco-de-audio

Tres tasks, y el orden lo fija dónde se puede ver cada cosa. La **T-01** deja el
audio calculado desde un solo lugar y se verifica sin navegador, con un test
sobre la función pura. La **T-02** le pone el gesto que mueve ese índice y el
anillo que lo muestra, que es lo que sólo se puede mirar con el player corriendo.
La **T-03** completa las dos oraciones del README que la capacidad nueva deja
incompletas y mira la corrida entera una vez, sobre el resultado final.

**Vara de POC, quick and dirty**: no hay campaña de mutación en ninguna de las
tres, y el único test nuevo es el de la función pura. Lo que la fase entrega se
escucha y se mira en pantalla, y su modo de falla está a la vista en el primer
break.

| id   | brief                                                        | status  | plan | evidence |
| ---- | ------------------------------------------------------------ | ------- | ---- | -------- |
| T-01 | El foco cambia la mezcla, y el índice es uno solo            | pending | —    | —        |
| T-02 | El gesto mueve el foco, y el anillo dice cuál es             | pending | —    | —        |
| T-03 | Las dos oraciones del README, y la corrida mirada entera     | pending | —    | —        |

---

## T-01 — El foco cambia la mezcla, y el índice es uno solo

- **Objetivo:** el audio de la composición sale de un índice de foco único, así
  que con un elemento enfocado suena ése solo —el primario callado incluido— y
  sin foco suena la mezcla que declara el asset list. Hay un solo lugar que
  decide quién suena, y con eso dos o más fuentes audibles a la vez dejan de ser
  un caso aparte: es la misma regla sobre una lista más larga. El gesto que mueve
  el índice llega con la T-02.
- **Qué tiene que cubrir:**

  - **La función pura del nivel efectivo**, exportada al lado de `volumeOf`
    (`lib/renderer.js:81-85`) y por la misma razón que ésa está exportada: un
    test le puede apuntar sin un navegador. Devuelve `volumeOf(element)` cuando
    nadie tiene el foco, 1 en el elemento que lo tiene, y 0 en todos los demás.
    La firma exacta la elige esta task; el criterio es que sea pura y que el resto
    de `applyAudio` no cambie de forma.
  - **`applyAudio` (`lib/renderer.js:471-481`) cambia en una línea**: donde hoy
    dice `volumeOf(element)` dice el nivel efectivo. Todo lo demás de esa función
    queda igual, y en particular **`video.muted` no se toca en ningún camino**:
    es el switch de la composición, es de quien mira, y la compuerta
    `const off = video.muted` sigue en pie. En el primario el 0 se escribe como
    `volume = 0` y **nunca** como `muted`; en los nodos del aviso `muted` se
    sigue escribiendo donde ya se escribía. Con la composición muteada, tocar una
    caja no suena y sí se ve, y eso es correcto: el switch decide si suena algo y
    el foco decide qué, de lo que suena.
  - **El índice es uno solo para toda la composición y no un flag por elemento.**
    De ahí sale gratis el Quad, que son tres cuadrantes más el primario
    (`demo/compatibility-pair/signalling/asset-list-multiView.json`), y dos
    experiencias solapadas que ponen avisos de dos breaks distintos encima del
    programa (`asset-list-solapado.json`, y `activeAt` devuelve una lista,
    `lib/signalling.js:352`).
  - **Tres de las cuatro salidas del foco**, que son las que no dependen del
    gesto:
    - **Se rearma la composición.** Cuando cambia el `nextKey`, el renderer hace
      `clear()` y reconstruye (`lib/renderer.js:188-215`): el nodo enfocado ya no
      existe y el foco muere con él. **No** se conserva por posición de caja ni
      por `id` de elemento.
    - **El asset del elemento enfocado se termina antes que su ventana.** El nodo
      ya lo detecta y lo dice por consola (`lib/renderer.js:243-253`). Ahí se
      suelta el foco y vuelve la mezcla declarada. El último cuadro se queda en la
      caja hasta que la ventana cierre, porque la composición sigue la ventana y
      eso es del contrato, pero la composición no queda muda.
    - **Cierra el break.** Ya funciona: `clear()` devuelve el primario a
      `volume = 1` y no toca su `muted` (`lib/renderer.js:540-560`). No se agrega
      nada, y verificarlo es parte de esta task.

    La cuarta salida, tocar de nuevo el elemento enfocado, es el toggle del gesto
    y es de la T-02.
  - **El test unitario de la función pura**, en `test/`, con los tres casos que
    la función tiene: sin foco devuelve lo declarado, el elemento enfocado
    devuelve 1, y cualquier otro devuelve 0, el primario incluido. Es lo único
    que el nivel `bajo` le debe a esta task en materia de tests, porque la
    aritmética del audio es su única lógica no visual.
  - Punto de partida, en este orden: el **ADR 0026** (el foco exclusivo y el
    índice único) y el **ADR 0029** (las cuatro salidas); el **ADR 0014**, que es
    el estado inicial que esto no cambia y la mezcla a la que el foco vuelve; y
    `lib/renderer.js`, en las cinco funciones que se nombran arriba.
  - Restricciones: **no se toca `lib/controls.js`**, no se toca la capa de los
    avisos, y ni el contrato de las dos capas ni la superficie pública de la
    librería cambian. Escape hatch: es una función nueva más una línea cambiada
    en `applyAudio`; revertir es sacar las dos.
  - Sin dependencias.
- **Definición de done:**
  - `node --test` en verde, con la cuenta de tests de antes de la task más los
    casos nuevos, y ni un valor esperado de los que ya existían cambiado.
  - El test de la función pura pasa los tres casos: sin foco cada elemento
    devuelve su `volumeOf`; con el foco puesto, el enfocado devuelve 1 y todos
    los demás 0, el primario incluido.
  - `/usr/bin/grep -n 'video\.muted' lib/renderer.js` devuelve exactamente las
    mismas líneas que antes de la task.
  - `npm run check` en verde: las dos costuras siguen donde estaban.
- **nivel de verificación:** bajo. Lo que esta task entrega es la mezcla que se
  escucha, y su modo de falla se oye en el primer break: audio doble, audio
  faltante, o un volumen que baja cuando tenía que subir. Nada acá computa un
  número que alguien decida sin mirar. Lo único que no se oye solo es la
  aritmética del nivel efectivo, y para eso está el test unitario de la función
  pura; sin campaña de mutación, que para tres ramas es maquinaria sin
  contrapartida.

## T-02 — El gesto mueve el foco, y el anillo dice cuál es

- **Objetivo:** con el cromo arriba, un toque sobre una caja de video del aviso
  enfoca esa caja, un anillo aparece sobre ella, y tocarla de nuevo devuelve la
  mezcla declarada. Con el cromo abajo el toque no cambia el audio: muestra el
  cromo, que es lo que ya hace cualquier control de este player.
- **Qué tiene que cubrir:**

  - **La asimetría sale de una regla sola.** El predicado es *¿está el cromo
    arriba?* y no *¿es el segundo toque?*, porque el cromo ya distingue las dos
    entradas: su `pointermove` sólo actúa con `pointerType === 'mouse'`
    (`lib/controls.js:717-720`). **Con mouse el hover ya subió el cromo, así que
    el click actúa de una: en escritorio es un click y no dos.** En celular no hay
    hover, así que el primer toque muestra y el segundo actúa. En un híbrido
    decide si el cromo está visible en ese momento. **No se escribe una segunda
    regla por dispositivo**, y no se consulta `pointerType` desde el renderer.
  - **Es un `pointerdown` y no un `click`.** En el segundo toque, el
    `pointerdown` del contenedor baja el cromo antes de que llegue el `click`
    (`lib/controls.js:742`), así que un gesto que preguntara por el estado del
    cromo en el `click` fallaría justo en el toque que tiene que actuar. El
    `pointerdown` del nodo burbujea desde el blanco, así que corre antes que el
    del contenedor y lee el cromo como estaba cuando el dedo bajó. Es también lo
    que hace la barra, que navega en el press.
  - **Los punteros se habilitan en `place()` (`lib/renderer.js:367`) y no en
    `createNode` (`lib/renderer.js:222`), y esto no es un detalle.**
    `bringAhead` (`lib/renderer.js:324`) construye nodos que ya están
    posicionados sobre su caja con `opacity: 0`, y **opacity no detiene un dedo**:
    habilitados en `createNode`, un nodo precargado invisible tomaría el gesto.
    `place()` sólo recorre lo que está en pantalla, así que un nodo precargado no
    puede tomarlo.
  - **La capa sigue con `pointerEvents: 'none'`** (`lib/concurrent-hls.js:122`) y
    su invariante intacto: lo que se habilita es `pointer-events: auto` en los
    nodos de video del aviso. Ese invariante tiene razón escrita, así que el
    cambio va con su nota: la capa deja de comerse los clicks de lo que está
    abajo porque el que los recibe es el nodo. El otro invariante de esa función,
    el `z-index` ausente, **no se toca**.
  - **Enfocable es una caja de video del aviso y nada más.** El primario no es
    blanco del gesto, porque un `pointerdown` sobre la imagen ya significa
    alternar el cromo (`lib/controls.js:724-744`) y el primario ocupa el fondo
    entero. Las imágenes tampoco: una foto no tiene audio, y darles punteros
    crearía una zona donde el toque no alterna el cromo y no hace nada. El aviso
    lineal a cuadro entero del break 5 sí es enfocable y no molesta: declara 100
    en el aviso y 0 en el programa (`lib/signalling.js:208-216`), así que
    enfocarlo y desenfocarlo dan la mezcla que ya estaba.
  - **El cableado va en `attach()`** (`lib/concurrent-hls.js:203`), que es el
    punto de entrada cuyo trabajo es juntar las dos piezas. `createControls`
    agrega `up` a su handle —hoy devuelve `{ layer, track, show, hide }`
    (`lib/controls.js:814`) y el `up` ya existe adentro
    (`lib/controls.js:674`)— y `attach()` le pasa al renderer un predicado que lo
    consulta. Como se evalúa en el momento del toque, no importa que el renderer
    se cree antes que los controles. Con eso el renderer no aprende qué es el
    cromo y los controles no aprenden qué es una caja de aviso.
  - **Dos caminos que están descartados y no hay que reintentar:** despachar
    desde un listener en `attach()` por el `data-element-id` del nodo, porque dos
    experiencias solapadas sin `id` propio comparten el `id` `'asset'`
    (`lib/signalling.js:84`) y el foco iría a la caja equivocada; y leer la clase
    `qa-controls--on` desde el renderer, porque le enseña al renderer qué es el
    cromo y pide un selector, que es una de las palabras que el grep del ADR 0015
    prohíbe en `lib/`.
  - **El anillo.** `outline` de 4 px en amarillo saturado (`#FFD400`) con
    `outline-offset` negativo, escrito inline sobre el nodo por el renderer,
    porque `controls.js` tiene prohibido tocar la capa de los avisos
    (`lib/controls.js:41-47`) y el renderer ya es dueño de esos nodos. Las tres
    propiedades están elegidas: `outline` se pinta arriba del contenido de un
    elemento reemplazado como un `<video>`, no participa del layout, y el offset
    negativo lo dibuja por dentro del borde para que no lo recorte la caja de al
    lado. Si el color hay que cambiarlo, el criterio es que se lea sobre cualquier
    creativo y que no sea un color de marca. Va **adentro de la misma función que
    mueve el índice y recalcula la mezcla**, la que dejó la T-01: una sola fuente
    de verdad sobre quién suena. Sobrevive al auto-hide por construcción, porque
    el auto-hide baja la opacidad de la capa del cromo y esta marca vive en la
    otra capa.
  - Punto de partida, en este orden: los **ADR 0027**, **0028** y **0030**;
    `lib/controls.js:674` y `:710-750`, que es la regla de la fase 04 y el toggle
    del cromo; `lib/concurrent-hls.js:115-128` y `:203-253`; y `lib/renderer.js`
    en `place`, `bringAhead` y la función de foco que dejó la T-01.
  - Restricciones: **la regla de la fase 04 no se toca**, ni para ampliarla ni
    para excepcionarla; `controls.js` no toca la capa de avisos; no se agrega un
    selector ni una clase nueva en `lib/`; y el `z-index` ausente de la capa se
    queda ausente. Escape hatch: los punteros son una línea en `place()` y el
    listener es uno solo en el nodo; sacar las dos cosas devuelve la capa al
    estado de hoy.
  - Depende de la T-01.
- **Definición de done:**
  - Con el player corriendo y el cromo arriba, en el Quad (break 4): un toque
    sobre un cuadrante deja sonando ése solo, con el primario callado, y el
    anillo está sobre esa caja. Tocarlo de nuevo devuelve `view3` a 100 y el
    resto a 10.
  - En un break de `cornerOverlay`: un toque sobre el aviso calla el programa,
    que es el audio doble que la fase existe para resolver.
  - **Con mouse, un solo click enfoca** —no dos— y en celular o en el emulador
    táctil, con el cromo abajo, el primer toque no cambia el audio.
  - En el break 5, que son cuatro avisos en fila: enfocar uno y ver que en el
    borde al siguiente el anillo desaparece y vuelve la mezcla declarada; y que
    un toque sobre la caja de un aviso que todavía no entró no cambia el audio,
    que es el chequeo del nodo precargado.
  - `node --test` y `npm run check` en verde.
  - Una captura por estado que este bloque nombra: sin foco, con el foco en un
    cuadrante, y después de soltarlo.
- **nivel de verificación:** bajo. Todo lo que esta task entrega se mira y se
  escucha en pantalla: el anillo está o no está, el audio cambió o no cambió, y
  arreglarlo es sacar una línea. Sin tests nuevos, porque no agrega lógica no
  visual, y sin campaña de mutación. La única trampa que no se ve es el nodo
  precargado con `opacity: 0`, y se cierra por construcción —los punteros van en
  `place()`— y se mira en el borde entre los cuatro avisos del break 5.

## T-03 — Las dos oraciones del README, y la corrida mirada entera

- **Objetivo:** el README de la demo ya no afirma de menos: dice que la mezcla del
  asset list es el estado inicial y que quien mira puede llevarse el audio a una
  caja tocándola. Y la corrida de tres minutos está mirada de punta a punta con
  el gesto adentro, así que se sabe que el foco no rompió nada de lo que ya
  andaba.
- **Qué tiene que cubrir:**

  - **Las dos afirmaciones que quedan incompletas, una oración en cada una**, en
    `demo/compatibility-pair/README.md`:
    - El párrafo del switch en `## Before you record` (líneas 89 a 105), que hoy
      cierra diciendo que lo que vale cada elemento adentro es la mezcla que
      declara el asset list y que el player la obedece (ADR 0014). Con foco, esa
      mezcla es el **estado inicial**: con el cromo arriba, un toque sobre una
      caja del aviso se lleva el audio a ésa.
    - El párrafo del Quad (líneas 116 a 125), que dice que así suena un quad de
      fuentes concurrentes *"when the signalling picks one to listen to"*. Con
      foco la señalización propone y quien mira dispone.
  - El README está escrito en inglés: las dos oraciones van en inglés y en el
    mismo registro del resto del documento.
  - **El foco es un paso opcional de la corrida y el guion no lo pide.** La
    corrida se graba igual sin tocar ninguna caja, y el beat típico, si se usa, es
    el Quad del break 4. Esta task **no** agrega un paso al guion ni cambia la
    tabla de la corrida.
  - **La corrida entera, una vez, sobre el resultado final**: `./run.sh`, un
    cuadro por break, los cinco, más el foco probado en el Quad y en un
    `cornerOverlay`. `npm test` y `npm run check` en verde.
  - Punto de partida: `demo/compatibility-pair/README.md`, líneas 85 a 125; el
    **ADR 0026**, que es lo que las dos oraciones tienen que decir; y el
    **ADR 0025**, que reparte qué cuenta el README de la demo y qué el de la raíz.
  - Restricciones: no se toca el README de la raíz, ni el guion de la corrida, ni
    ninguna otra sección del README de la demo. Depende de la T-01 y de la T-02.
- **Definición de done:**
  - Los dos párrafos, leídos de corrido, dicen la política completa: el asset list
    declara el estado inicial y quien mira lo sobrescribe mientras el aviso está
    en pantalla.
  - `./run.sh` levanta la corrida y los cinco breaks se ven como se veían, con un
    cuadro por break guardado como evidencia.
  - `npm test` y `npm run check` en verde.
  - Ninguna otra afirmación de la sección `Before you record` quedó vieja, leída
    línea por línea.
- **nivel de verificación:** bajo. Son dos oraciones que una persona lee y una
  corrida que una persona mira, y las dos fallas posibles —una oración que promete
  algo que el gesto no hace, o un break que dejó de verse— están a la vista en la
  misma pasada. Sin tests nuevos y sin campaña de mutación.
