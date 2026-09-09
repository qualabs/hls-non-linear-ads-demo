# Tasks — fase 07-la-pelotita-de-la-barra

Dos tasks. La **T-01** es el gesto entero, y es entero un solo archivo,
`lib/controls.js`: el scrub, el seek movido al soltar, el pintado que sigue al
puntero, la captura, el cromo que se queda arriba y la pelotita que crece. La
**T-02** lo mira con los dos punteros sobre el resultado final, que es lo único
que este cambio no puede demostrar de otra forma.

**Vara de POC, quick and dirty, y sin tests nuevos.** No es un descuido y por eso
está escrito acá: la fase **no agrega lógica no visual**. Lo que agrega es un
gesto y un pintado, la cuenta de la fracción es la que ya existe y ya está en el
código (`seekFromEvent`), y las dos fallas posibles —el toque suelto que seekea en
otro lado, o el arrastre que no arrastra— están a la vista en la primera pasada
con el player. Sin campaña de mutación, por la misma razón.

| id   | brief                                                    | status  | plan | evidence |
| ---- | -------------------------------------------------------- | ------- | ---- | -------- |
| T-01 | El scrub: un solo camino, y el seek al soltar            | pending | —    | —        |
| T-02 | Los dos punteros, mirados sobre el resultado final       | pending | —    | —        |

---

## T-01 — El scrub: un solo camino, y el seek al soltar

- **Objetivo:** la posición del programa se cambia arrastrando. Un press en
  cualquier parte de la barra pone la pelotita ahí y empieza el arrastre, la
  pelotita sigue al puntero mientras se mueve, y al soltar el video seekea a donde
  quedó. Un toque suelto —press y release sin mover— seekea a ese punto, que es lo
  que la barra ya hacía. Con mouse y con el dedo, con el mismo código.
- **Qué tiene que cubrir:**

  - **Un solo camino y no dos** (ADR 0032). El toque suelto es un arrastre de
    longitud cero, así que no hay rama de "modo toque" contra "modo arrastre", y
    **no hay que averiguar si el puntero cayó sobre la pelotita o al lado**: cayó
    en la barra y con eso alcanza. Si al terminar la task hay un `if` que pregunta
    cualquiera de esas dos cosas, la task se hizo distinta de como está decidida.
  - **El seek se mueve del press al release.** Hoy es
    `track.addEventListener('pointerdown', (event) => { seekFromEvent(event); show(); })`
    (`lib/controls.js`, abajo de `seekFromEvent`), y es **el único cambio sobre
    algo que ya funciona**. `seekFromEvent` calcula la fracción contra
    `rail.getBoundingClientRect()` y esa cuenta no cambia: lo que cambia es cuándo
    se escribe `video.currentTime`.
  - **El estado de scrub, y `paint()` respetándolo** (ADR 0033). Mientras hay un
    arrastre en vuelo, la fracción que se pinta es la que pide el puntero y no la
    del `currentTime`. La leen las tres cosas que dependen de la posición —el
    `fill`, el `knob` y el reloj `elapsed`—, así que la barra entera cuenta lo
    mismo durante el gesto. `paintRanges` no se toca: depende del largo y no de la
    posición. **El video no se escribe hasta el release**, y ése es el punto: sin
    el estado, el frame loop repinta con el `currentTime` y la pelotita salta
    atrás sola.
  - **La captura y el touch-action** (ADR 0034). `setPointerCapture` sobre la
    barra en el press y suelto en el release, así el move y el up llegan aunque el
    puntero se haya ido de los 44 px; y `touch-action: none` en la regla `.qa-track`
    de la hoja de estilos, que hoy está en `auto` (medido). Cerrar el scrub también
    en `pointercancel`, que es como el browser avisa que se llevó el gesto.
  - **El cromo se queda arriba mientras dura el arrastre** (ADR 0035). Hay un
    temporizador —`arm()`, `hide()`, `hideMs`— que no sabe nada del gesto, y un
    dedo apoyado y quieto se come su presupuesto. Con un scrub en vuelo `hide()`
    no corre, y al terminar el scrub se llama a `show()`, que rearma el
    temporizador como siempre.
  - **La pelotita crece mientras se arrastra** (ADR 0036). Una clase sobre el nodo
    que ya existe y una regla en la hoja que ya existe, con el tamaño expresado
    sobre `--qa-rail` como todo el resto del cromo, así que sigue escalando en
    fullscreen y en mobile. **En reposo no cambia nada**: ni tamaño, ni color, ni
    forma.
  - Punto de partida, en este orden: los **ADR 0032 a 0036**; y `lib/controls.js`,
    en `seekFromEvent` y el listener que le sigue, en `paint()` y el `loop()` del
    final, en `arm()` / `show()` / `hide()`, y en las reglas `.qa-track` y
    `.qa-track__knob` de la hoja de estilos de arriba del archivo.
  - Restricciones: **no se toca el `pointerdown` del contenedor**, que es la regla
    de la fase 04 y el gesto del foco de la fase 06; no se toca `lib/renderer.js`
    ni `lib/concurrent-hls.js`; la superficie pública no cambia; y la barra del
    pane de fábrica no se trata aparte, se lleva el gesto de rebote porque es el
    mismo cromo. Escape hatch: el gesto son listeners sobre la barra y un estado
    local; volver atrás es dejar el seek en el press y borrar el estado.
  - ⚠️ **La costura del ADR 0015** grepea el literal `demo` en `lib/*.js` con
    lista de aceptados vacía: un comentario que nombre la demo deja
    `npm run check` en rojo. Si pasa, el arreglo es sacar la ruta y dejar la
    frase.
  - Sin dependencias.
- **Definición de done:**
  - Con el player corriendo, un **click suelto** en la barra seekea al mismo punto
    al que seekea hoy: la misma x de la barra da el mismo segundo, comparado
    contra la cuenta de `seekFromEvent` y no contra una impresión.
  - Un **arrastre con mouse** mueve la pelotita y el `currentTime` **no** cambia
    mientras el botón está apretado; al soltar, el `currentTime` es el de donde
    quedó la pelotita.
  - El arrastre **sobrevive a que el puntero se salga de la barra**, para arriba y
    al costado, y al soltar afuera igual seekea.
  - `getComputedStyle` sobre `.qa-track` devuelve `touch-action: none`.
  - Durante el arrastre el cromo sigue arriba, aunque el puntero se quede quieto
    más que el presupuesto del temporizador.
  - `npm test` en 49 verdes, la misma cuenta de antes de la task y sin un valor
    esperado tocado, y `npm run check` en `both seams hold.`
- **nivel de verificación:** bajo. Todo lo que esta task entrega se mira en
  pantalla: la pelotita se mueve o no se mueve, el seek cae donde caía o no, y
  arreglarlo es volver el seek al press. Sin tests nuevos, porque no agrega lógica
  no visual, y sin campaña de mutación. Lo único que no se ve solo es que el
  `currentTime` esté quieto durante el arrastre, y para eso la definición de done
  pide leerlo y no mirarlo.

## T-02 — Los dos punteros, mirados sobre el resultado final

- **Objetivo:** el gesto está probado con mouse y con el dedo sobre el resultado
  final, y se sabe que no rompió nada de lo que ya andaba: la barra sigue
  marcando los cinco breaks, el cromo sigue apareciendo y escondiéndose como
  siempre, y ninguna afirmación viva de la documentación quedó vieja.
- **Qué tiene que cubrir:**

  - **Los seis casos, con los dos punteros**, con el player corriendo y **anclando
    todo en `#player`**: la página tiene dos panes con el mismo cromo y un selector
    global mide el de fábrica, que es una trampa que este proyecto ya pagó dos
    veces.
    1. La pelotita está y está donde está el video.
    2. Un click suelto en la barra seekea a ese punto, como hoy.
    3. Arrastrarla mueve la pelotita sin que el video seekee, y al soltar seekea.
    4. El arrastre sobrevive a salirse de la barra.
    5. Con toque emulado, arrastrar **no scrollea la página**.
    6. El cromo no se baja en medio del arrastre.
  - **Que lo de siempre siga**: las cinco marcas en el riel, el cromo que aparece
    con el mouse y con el primer toque, y un break mirado en cuadro para saber que
    la composición no se movió.
  - **Las dos superficies de `docs/` leídas**, no sólo el README de la demo. Es el
    hallazgo 2 del cierre de la fase 06 en forma de trabajo:
    `docs/integrating-the-library.md` describe el cromo que la librería dibuja y
    `docs/contrato-senalizacion-renderizado.md` es el contrato entre las dos capas.
    La pregunta por documento es una sola, **¿esto sigue describiendo el
    sistema?**, y la respuesta se escribe aunque sea "no cambió nada, porque…".
    El README de la demo entra en la misma pasada.
  - **Lo que esta task no hace es arreglar por su cuenta.** Si encuentra algo que
    la T-01 introdujo, se corrige en la T-01 con su línea `post-ejecución:`.
  - Punto de partida: el `PHASE.md` de la fase, en su lista de verificación; la
    evidencia de la T-03 de la fase 06, que tiene el harness de la corrida y las
    dos notas que valen para la próxima —anclar en `#player`, y apagar el audio
    con `--mute-audio` en lugar de tocar el sink del sistema—.
  - Restricciones: no se toca `lib/` salvo para una corrección de la T-01; el
    server del 8080 se deja arriba.
  - Depende de la T-01.
- **Definición de done:**
  - Los seis casos, corridos y anotados con su lectura, con mouse y con toque
    emulado donde el caso lo pide.
  - Un cuadro de la barra arrastrándose y uno en reposo, y un break en cuadro.
  - `npm test` en 49 verdes y `npm run check` en `both seams hold.`
  - Las tres superficies de documentación nombradas una por una, cada una con lo
    que se corrigió o con por qué no necesitaba nada.
- **nivel de verificación:** bajo. Es una corrida que una persona mira y dos
  documentos que una persona lee, y las fallas posibles —un caso que no anda, una
  afirmación que quedó vieja— están a la vista en la misma pasada. Sin tests
  nuevos y sin campaña de mutación.
