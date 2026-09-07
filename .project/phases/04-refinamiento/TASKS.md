# Tasks — fase 04-refinamiento

**Los tres defectos van primero.** Son chicos, no tienen decisiones adentro y
son lo que hace que la demo se pueda usar desde el celular, que es donde Nicolás
la está probando. Nada de lo que sigue depende de ellos, y por eso van antes: si
el calendario aprieta, lo que no puede quedar afuera es lo que se ve en cámara.

**Después la separabilidad, y antes de que se toque el pane del otro.** Es el
mecanismo que la fase 02 usó para el corte: la decisión se toma al principio y
se verifica, en lugar de afirmarse. La T-04 no toca ese pane; decide cómo se lo
va a tocar y cómo se va a comprobar que sigue siendo un cliente sin modificar.

**El criterio de la fase no tiene task.** Es una afirmación sobre el conjunto,
así que se verifica una vez y sobre el recorrido corriendo entero, y lo verifica
Nicolás mirando los dos panes: el cuadro de los dos en el mismo segundo lo arma
él y lo arma más rápido a mano. Las diferencias que se espera que sobrevivan
están enumeradas en el `PHASE.md`, para que cuando mire sepa cuáles son
legítimas y cuáles son un hallazgo.

**La verificación de las tasks es liviana, y liviano tiene un límite.** No se
agrega aparato nuevo, porque los seis defectos de la fase se ven todos en la
pantalla y el revisor es él. Pero lo que ya existe se sigue corriendo:
`node scripts/verificar-cortes.mjs` y `npm test` al final de cada task que toque
los archivos que cada uno mira, y la comparación de la caja pedida contra la
dibujada donde la task toque el renderizado o los controles. El razonamiento
completo está en el `PHASE.md`; cada bloque de acá dice qué le queda y qué se le
fue.

| id   | brief                                                              | status  | plan | evidence |
| ---- | ------------------------------------------------------------------ | ------- | ---- | -------- |
| T-01 | El estado de la composición gobierna a todos sus elementos         | done    | —    | `.project/phases/04-refinamiento/tasks/T-01/` |
| T-02 | El logo de Qualabs sale de los controles del player                | planned | —    | —        |
| T-03 | Los controles usables con el dedo                                  | planned | —    | —        |
| T-04 | La separabilidad: el cromo sin la parte de concurrentes            | planned | —    | —        |
| T-05 | El pane de fábrica reemplaza el contenido en lugar de insertarlo   | planned | —    | —        |
| T-06 | La barra marca sólo lo que ese player reproduce, y sobre el riel   | planned | —    | —        |
| T-07 | El pane del otro con nuestro cromo, y su propio riel               | planned | —    | —        |

---

## T-01 — El estado de la composición gobierna a todos sus elementos

- **Objetivo:** que la pausa de la composición mande sobre los avisos. Con la
  composición pausada, un seek que cae adentro de un aviso concurrente de video
  hoy arranca a reproducir ese aviso solo, con todo lo demás detenido.
- **Qué tiene que cubrir:** la regla general y no el caso. Hoy el renderizado
  propaga las **transiciones** del primario —los listeners de `play`, `pause` y
  `seeked` de `lib/renderer.js`— y no aplica el estado al **crear** un elemento:
  `build()` llama a `node.play()` sin mirar `video.paused`
  (`lib/renderer.js:209`). El mute ya está resuelto de la forma correcta y es el
  modelo a seguir: `applyAudio()` corre después de cada `build` y también en cada
  `volumechange`, así que la composición muteada gobierna a los elementos nuevos
  igual que a los que ya estaban. Lo que falta es lo mismo para el estado de
  reproducción.

  Dos cosas que no se pueden perder por el camino. El arranque en silencio: cada
  nodo de video se crea `muted` porque un elemento audible es uno que la política
  de autoplay se niega a reproducir, y eso no cambia. Y el desplazamiento: el
  `startAt` que `build()` le pasa a `attachAsset` ya deja el asset en el segundo
  correcto cuando se cae en el medio de la ventana, así que lo que hay que
  gobernar es si reproduce, no dónde.

  Punto de partida: `lib/renderer.js` —`build()`, `playable()`, `applyAudio()` y
  los tres listeners del final— y el contrato en `docs/`. Restricción: el corte
  del ADR 0003 se sigue verificando con `scripts/verificar-cortes.mjs`, y el
  recorrido de los cinco breaks tiene que seguir corriendo igual. Sin
  dependencias.
- **Definición de done:** la secuencia exacta corrida y capturada: pausar la
  composición, hacer seek hasta caer adentro de un aviso concurrente de video, y
  ver todos los elementos detenidos, con la lectura nodo por nodo —que es lo que
  hace verificable el "todos" en lugar del que se probó—. Y la vuelta: apretar
  play y ver que todos arrancan juntos. El recorrido completo sigue corriendo sin
  cambios.
- **nivel de verificación:** bajo. El error está en la pantalla —un aviso
  reproduciendo solo mientras todo lo demás está quieto— y la lectura nodo por
  nodo es lo que cubre el resto de los elementos. No es `alto` porque lo que hay
  que cubrir vive en el camino que toca el DOM y este proyecto decidió no tener
  tests de DOM ni de browser: lo que un test cubriría acá es un booleano que la
  captura y la lectura muestran directo.

  **Queda:** `verificar-cortes` y `npm test`, porque la task edita
  `lib/renderer.js` y los dos lo miran. La comparación de la caja pedida contra
  la dibujada, porque `build()` es la función que aplica la caja y es la que se
  edita. Y la lectura nodo por nodo lee tres campos y no uno: además de `paused`,
  `volume`/`muted` y `currentTime`. Son las dos únicas cosas de esta task que no
  se ven en la pantalla —un elemento que arranca con el volumen equivocado o en
  el segundo equivocado se ve bien— y las dos pasan por la misma función, porque
  `applyAudio()` corre después de `build()` y el `startAt` se calcula adentro.
  No es una medición nueva: es la misma lectura con dos columnas más.

  **Se fue:** nada. Esta task nunca tuvo campaña ni capturas a un cuarto.

## T-02 — El logo de Qualabs sale de los controles del player

- **Objetivo:** sacar la marca de adentro de la imagen. Queda la del encabezado,
  que es la que se lee de lejos. Supersede la parte de la T-07 de la fase 02 que
  puso el logo en la barra.
- **Qué tiene que cubrir:** el cambio es de la **demo** y no de la librería, y
  esa distinción es la task. El `logo` de `attach` es superficie pública
  documentada —la sección 7 de `docs/integrating-the-library.md`, "The brand is
  yours, because this library ships none"— y el nodo `qa-brand` de
  `lib/controls.js` es el mecanismo que esa superficie ofrece. Lo que se va es la
  línea de `js/app.js` que pasa el `logo`; la opción, su documentación y su CSS
  se quedan. Sacar la opción le quitaría a un integrador la única manera de poner
  su marca adentro del cuadro, que es un problema distinto del que Nicolás
  encontró.

  La consecuencia hay que aceptarla escrita: sin logo en la barra no queda
  ninguna marca adentro del cuadro, y en fullscreen no hay encabezado. La T-07 de
  la fase 02 subió el logo del player a 40 px en fullscreen exactamente por eso.
  Hoy no cuesta nada, porque lo que se graba es la página de dos panes y el
  encabezado está en ese cuadro; el día que se grabe fullscreen, vuelve. Y el
  compromiso con David —el logo de Qualabs va a estar ahí— lo sostiene el
  encabezado.

  Punto de partida: `js/app.js` (el bloque entre las dos vallas), `index.html`
  (el `masthead`), la evidencia de la T-07 de la fase 02 y la sección 7 del
  documento del integrador. Restricción: los archivos de `brand/` son copias byte
  a byte y no se editan.

  Y un conteo que **no** hay que corregir, porque el error fácil acá es
  corregirlo: la página mínima del documento del integrador y el bloque de seis
  líneas del `README.md` nunca pasaron `logo`, así que ninguno de los dos cambia.
  El que cambia en uno es el de la página de **esta demo**, que son 12 líneas y
  vive en la evidencia de la T-08 de la fase 02 y en el informe de esa fase, los
  dos registro y ninguno de los dos se reescribe.
- **Definición de done:** una captura a tamaño real de los dos panes sin marca
  sobre la imagen y con la del encabezado en su lugar. La sección 7 del documento
  del integrador sin cambios, que es la prueba de que la superficie no se movió.
- **nivel de verificación:** mínimo. Es una línea de `js/app.js` que se va, y la
  salida entera es una captura que una persona mira.

  **Queda:** la captura a tamaño real, y nada más que correr: la task no toca
  `lib/` ni ninguno de los archivos que `verificar-cortes` mira, y `npm test` no
  tiene qué mirar acá.

  **Se fue:** la captura reducida a un cuarto. Estaba para probar que la marca
  que sobrevive a la reducción es la del encabezado y no la del player, y eso ya
  lo midió la T-07 de la fase 02: a un cuarto el logo de 22 px de la barra queda
  en 5,5 px y el wordmark se disuelve. Volver a medirlo no atrapa ningún defecto
  nuevo.

## T-03 — Los controles usables con el dedo

- **Objetivo:** que los controles se puedan usar desde un celular, que es la
  superficie donde Nicolás va a mostrar la demo. Hoy aparecen y desaparecen casi
  de inmediato al tocar.
- **Qué tiene que cubrir:** dos cosas, y la primera es medir antes de arreglar.

  **La causa.** La enunciada es que el temporizador de auto-ocultar se renueva
  con el movimiento del mouse, que en touch no existe. La lectura del código dice
  otra: `container.addEventListener('pointerleave', () => { if (!video.paused)
  hide(); })` (`lib/controls.js:615`). En touch el puntero deja de existir cuando
  el dedo se levanta, así que `pointerleave` dispara inmediatamente después del
  `pointerup` y esconde los controles en cada toque. Eso explica "casi de
  inmediato" mejor que `CONTROLS_HIDE_MS`, que son 2600 ms y se verían como un
  ocultamiento lento. Las dos causas no son excluyentes y las dos son baratas de
  confirmar en un dispositivo; lo que no se puede hacer es arreglar una y dar el
  síntoma por ido sin mirar.

  **El gesto.** `pointerleave` no puede ser el gesto de esconder en touch, así
  que hay que decidirlo y dejarlo dicho: un toque sobre la imagen que alterna, el
  temporizador solo mientras reproduce, o los dos. Y `CONTROLS_HIDE_MS` es un
  valor: 2600 ms puede ser poco para un dedo que además tiene que apuntar.

  **Un tercer defecto que conviene mirar acá porque es del mismo toque.** La capa
  de controles queda en `opacity: 0` cuando se esconde, y `opacity` no desactiva
  los eventos de puntero: `.qa-track` tiene `pointer-events: auto` y su
  `pointerdown` seekea. O sea que un toque en la franja de abajo con los
  controles invisibles seekea a donde cayó el dedo en lugar de mostrarlos, y en un
  celular el pulgar cae justo ahí. Hay que comprobarlo y, si es así, resolverlo:
  el primer toque muestra, no navega.

  Punto de partida: `lib/controls.js` —los tres listeners de `container`, `arm()`,
  `show()`, `hide()`, `CONTROLS_HIDE_MS` y el `pointerdown` de `track`—.
  Restricción: lo que haga usable el dedo no puede romper el mouse, y las áreas de
  toque son los tokens `--qa-icon` y `--qa-play`, con un juego por tamaño de
  pantalla: si un dedo necesita más, es un token y no un layout nuevo.
- **Definición de done:** **verificado en un celular o en emulación de touch de
  verdad, no moviendo el mouse.** Una secuencia de capturas o un video corto desde
  un dispositivo táctil donde se ve: un toque que trae los controles y los deja
  arriba el tiempo suficiente para apretar uno, la pausa y el audio accionados con
  el dedo, y el gesto que los esconde haciéndolo. Más una corrida con mouse que
  muestra que el comportamiento de escritorio no cambió.
- **nivel de verificación:** bajo. El error está en la pantalla, y el instrumento
  es un dispositivo: en este repositorio ya hubo dos falsos "OK" por medir estilos
  computados en lugar de mirar la imagen.

  **Queda:** la corrida en el dispositivo y la corrida con mouse que muestra que
  el escritorio no cambió, que son las dos que juzgan el síntoma. `verificar-cortes`
  y `npm test`, porque la task edita `lib/controls.js` y los dos lo miran. Y la
  comparación de la caja pedida contra la dibujada, porque las áreas de toque son
  tokens de tamaño y la capa de controles está sobre la misma imagen contra la que
  se resuelven los layouts.

  **Se fue:** nada. Confirmar la causa antes de arreglar es mirar el síntoma en un
  celular, no una medición nueva, y sin eso la task arregla una de las dos causas
  y da el síntoma por ido sin mirar.

## T-04 — La separabilidad: el cromo sin la parte de concurrentes

- **Objetivo:** decidir, **antes de que nadie toque el pane del otro**, cómo
  nuestro skin llega a un cliente que sigue sin estar modificado. Es la T-01 de
  esta fase: la decisión se toma al principio y se verifica en las tasks que
  siguen.
- **Qué tiene que cubrir:** la lectura que rompe la demo y la que no.

  Si el pane del otro corre nuestra librería para tener el skin, deja de ser un
  cliente sin modificar y el argumento del ADR 0007 se cae: el punto es que un
  cliente de mercado funciona sobre la misma playlist **sin tocarlo**. La lectura
  que queda es que **el skin y los controles se puedan usar sin la parte de
  concurrentes**: ese pane sigue corriendo hls.js pelado y lo único nuestro es el
  cromo.

  **Qué cuesta eso en superficie pública.** Hoy la única entrada es
  `attach(hls, { container })`, que enciende la experiencia entera: crea la capa
  de avisos, la señalización y el renderizado (`lib/concurrent-hls.js:131`). En el
  código la separación ya está casi hecha —`createControls` acepta
  `provider = null` y su archivo no nombra ni a la señalización ni al
  renderizado—, así que lo que falta no es desacoplar sino **publicar**: una
  segunda función, o una opción de `attach`, y la que se elija se escribe en
  `docs/integrating-the-library.md`, incluida la tabla de la sección 6. La razón
  del cambio de superficie no es la comodidad de esta demo: es que un integrador
  puede querer uno y no el otro.

  **De dónde salen las marcas de esa barra**, que es la mitad del punto 3 que cae
  en este pane. La regla del ADR 0018 es que una barra marca lo que ese player
  reproduce, y ese player reproduce el interstitial tradicional. Su agenda es
  propia: `hls.interstitialsManager`, que `js/stock-player.js` ya lee para la
  línea de estado y para su getter `scheduled`. Sacarlas de ahí deja el pane con
  su propio player como única fuente. La otra forma es alimentarlo con un
  proveedor nuestro filtrado por `kind`, que mete nuestra capa de señalización en
  ese pane y debilita justamente lo que el pane muestra. La que se elija se
  escribe con esa razón al lado.

  **La verificación, que es el mecanismo de la fase 02.** El invariante se
  comprueba y no se afirma, y son tres lecturas de la página corriendo, las tres
  con instrumentación que ya existe: la instancia de ese pane se construye con
  cero opciones (`new Hls()`, `js/stock-player.js`), su pestaña de red nunca pide
  un asset-list concurrente, y sigue agendando el Date Range de clase Apple
  (`INTERSTITIALS_UPDATED` ya lo loguea). Si eso entra en
  `scripts/verificar-cortes.mjs` como una tercera costura o queda como lectura por
  task es parte de la decisión: las costuras de ese script son greps sobre
  archivos y esta es una lectura de una página corriendo, así que forzarla adentro
  puede ser la forma equivocada.

  Punto de partida: los ADR 0007 y 0015 con sus notas fechadas,
  `lib/concurrent-hls.js`, `lib/controls.js`, las secciones 5 y 6 de
  `docs/integrating-the-library.md`, y `js/stock-player.js`. Restricción: **nada
  de esto cambia con qué se construye la instancia del otro pane.** El logo y el
  `--qa-accent` siguen entrando por donde entran (sección 7). Sin dependencias
  nuevas y sin bundler.
- **Definición de done:** la decisión escrita: la forma de la entrada pública, de
  dónde salen las marcas de la barra de ese pane, y las tres lecturas que
  verifican que sigue sin estar modificado. `docs/integrating-the-library.md`
  actualizado con la superficie nueva, y la nota fechada del ADR 0015 puesta.
  **Ninguna línea del pane del otro tocada:** esta task decide y las que siguen
  construyen.
- **nivel de verificación:** mínimo. Es trabajo de decisión que Nicolás lee entero
  antes de que algo dependa de él.

  **Queda:** nada que correr. La task no toca código —su done dice que ninguna
  línea del pane del otro se toca— y lo que escribe son la decisión y el documento
  del integrador, que ninguno de los dos chequeos mira.

  **Se fue:** nada.

## T-05 — El pane de fábrica reemplaza el contenido en lugar de insertarlo

- **Objetivo:** que los dos panes muestren el mismo segundo del programa al mismo
  tiempo, para que se puedan comparar cuadro a cuadro. Hoy uno inserta el aviso y
  retoma donde interrumpió, así que después del primer break están en escenas
  distintas de la misma película.
- **Qué tiene que cubrir:** el `X-RESUME-OFFSET` del tag de clase Apple que
  escribe `scripts/senalizar-contenido.sh`. Hoy los dos tags salen con
  `X-RESUME-OFFSET=0`, que es inserción, y la consecuencia está medida en la T-12
  de la fase 01: 49,47 s de programa atrás después de cuatro breaks, a 12,37 s por
  break. **Qué forma tiene el reemplazo se mide y no se supone**: si el offset
  tiene que valer la duración del aviso o si el atributo tiene que faltar, y qué
  hace hls.js 1.7.2 con cada una. El `X-RESUME-OFFSET` del tag concurrente no
  significa nada (ADR 0016) y no es lo que esta task cambia.

  Dos cosas vienen con el cambio.

  **El quinto break se vuelve visible en el pane de la izquierda.** Hoy no se ve
  nunca: la T-12 midió que para el quinto `START-DATE` el cliente de fábrica ya
  está 49,5 s atrás, así que ese break llega cerca del final del VOD de 180 s y el
  quinto aviso lineal no se completa. Con reemplazo los dos panes llegan a los
  cinco breaks en el mismo segundo, y el recorrido pasa a mostrar cinco avisos
  lineales en lugar de cuatro.

  **El párrafo del `README.md` que afirma el argumento retirado.** Dice "The left
  player falls behind, and that is the second argument of the demo" y sigue con
  los números del atraso. Es documento vivo y deja de ser cierto, así que lo
  reescribe esta task, con el argumento nuevo: afuera del break los dos panes
  muestran el mismo cuadro; adentro, uno muestra el programa con el aviso encima y
  el otro el aviso en lugar del programa; y cuando vuelve, están otra vez en el
  mismo segundo. El informe de la fase 01 no se toca: es el registro de lo que se
  midió.

  Punto de partida: el ADR 0017, el ADR 0016 con su nota, `scripts/senalizar-contenido.sh`,
  la evidencia de la T-09 y la T-12 de la fase 01, y `js/stock-player.js`.
  Restricción: el tag concurrente no cambia, hls.js entra sin modificar, el
  recorrido sigue siendo una sola corrida de punta a punta sin un solo seek, y el
  contenido primario y los cinco asset-list no se tocan: es un atributo de la
  playlist.
- **Definición de done:** el recorrido corre entero, y adentro de un break hay una
  captura de los dos panes en el mismo instante mostrando el mismo segundo del
  programa —uno con el aviso encima de la imagen y el otro con el aviso en lugar de
  la imagen—. Más la lectura del `currentTime` de los dos elementos al final del
  recorrido, que es el número que dice que el atraso se fue, contra los 49,47 s que
  la T-12 midió. El quinto break llegando completo al pane de la izquierda. Y el
  párrafo del `README.md` reescrito.
- **nivel de verificación:** bajo. El error grueso está en la pantalla —los dos
  panes en escenas distintas de la misma película—, pero el fino no: dos panes
  desincronizados por un par de segundos se ven sincronizados, y la fase entera se
  apoya en que estén en el mismo segundo. Lo que lo dice es el número.

  **Queda:** la captura adentro del break, y la lectura del `currentTime` de los
  dos elementos al final del recorrido contra los 49,47 s de la T-12 de la fase
  01, que de las dos es la única que agarra el error fino. Y `npm test`, que acá
  es el que menos se espera: `test/program-ranges-and-volume.test.js` parsea la
  tabla del recorrido y el `PLANNED-DURATION` de `scripts/senalizar-contenido.sh`,
  que es el archivo que esta task edita, así que un cambio que le rompa la forma a
  esas líneas se ve como tests en rojo en lugar de no verse. `verificar-cortes` no
  corre: ninguna de sus dos costuras mira ese script.

  **Se fue:** nada. Medir qué forma tiene el reemplazo —si el offset vale la
  duración del aviso o si el atributo tiene que faltar, y qué hace hls.js 1.7.2
  con cada una— es una corrida y no una campaña, y sin ella la task no sabe qué
  escribir.

## T-06 — La barra marca sólo lo que ese player reproduce, y sobre el riel

- **Objetivo:** sacar el carril de abajo. El amarillo colgando debajo del riel se
  lee como otro elemento y no como parte de la barra.
- **Qué tiene que cubrir:** el carril de los cues —`RANGE_LANES` con
  `under: true`, `.qa-track__cues` y `.qa-cue` en `lib/controls.js`— se va, y las
  marcas de lo que este player reproduce se quedan sobre el riel.

  **Lo que reemplaza al diseño de dos carriles no es "la barra marca una clase".**
  La regla es que cada barra marca **lo que ese player reproduce** (ADR 0018), y
  esa redacción no es un detalle: desde la fase 03 nuestro player reproduce un
  aviso lineal adentro del break, así que va a haber un rango de clase
  `interstitial` que es nuestro y va sobre nuestro riel. Una regla escrita como
  "nuestra barra marca los concurrentes" habría que reabrirla en la fase
  siguiente. Por lo mismo, **el `kind` del contrato se queda y sigue siendo
  necesario**: es lo que le permite a cada barra pintar el rango que marca con el
  color que esa clase ya tiene.

  La razón que tenía el diseño de dos carriles sigue siendo cierta y no es lo que
  cambió: los dos rangos de un break comparten `START-DATE` y duración —la T-04 de
  la fase 02 lo midió—, así que dibujados uno encima del otro agregan un color y
  no información. Lo que cambia es que ahora cada player tiene su propia barra, así
  que la distinción la hace el pane y no el carril.

  **Dos consecuencias concretas que hay que resolver y no descubrir.** La altura de
  `.qa-track` es `calc(var(--qa-rail) * 3 + 6px)`, y esa aritmética es exactamente
  la de dos carriles, con la cuenta escrita en el comentario del CSS: con un carril
  el número cambia y la posición vertical de la barra adentro del cuadro se mueve
  con él. Y la lista de ocurrencias aceptadas de `scripts/verificar-cortes.mjs`
  está indexada por el **contenido** de la línea, y las líneas que nombran la
  segunda clase del lado del renderizado están ahí: sacar el carril borra algunas
  de esas líneas, así que la lista tiene que quedar consistente con el archivo. Un
  chequeo cuyas excepciones ya no existen es un chequeo que dejó de probar lo que
  dice probar.

  Punto de partida: `lib/controls.js` —`RANGE_LANES`, `RANGE_COLOURS`, el bloque
  `.qa-track*` y `paintRanges()`—, la evidencia de la T-04 de la fase 02, el
  contrato en `docs/` y el ADR 0018. Restricción: la capa de controles sigue siendo
  un overlay **sobre** la imagen y nunca una franja **debajo**, porque el
  renderizado resuelve los layouts contra la caja que mide y una barra que le
  agregara altura movería todos los elementos de todos los layouts. Los dos colores
  siguen siendo funcionales y no de marca, y siguen deliberadamente fuera de la
  superficie pública (sección 7 del documento del integrador). Depende de T-04, que
  es donde se decide de dónde salen las marcas del otro pane.
- **Definición de done:** una captura a tamaño real de nuestra barra con los cinco
  breaks marcados sobre el riel y nada colgando debajo. `scripts/verificar-cortes.mjs`
  pasando, con su lista de aceptadas consistente con el archivo después del cambio.
  Y `npm test` cerrando como cerraba: `rangeSpan` no cambia, pero el archivo sí.
- **nivel de verificación:** bajo. Es interfaz y el error está en la pantalla. La
  aritmética que pone cada marca en su lugar ya la cubren los tests de la T-06 de
  la fase 02.

  **Queda:** la captura a tamaño real. `verificar-cortes` **con su lista de
  ocurrencias aceptadas consistente con el archivo**, que acá no es una
  formalidad: la task borra líneas que están en esa lista, y un chequeo cuyas
  excepciones ya no existen dejó de probar lo que dice probar. `npm test`, porque
  la task edita `lib/controls.js` y de ahí sale `rangeSpan`. Y la comparación de la
  caja pedida contra la dibujada, porque la altura de `.qa-track` cambia y esa capa
  está sobre la imagen contra la que se resuelven los layouts.

  **Se fue:** la captura reducida a un cuarto como requisito. Lo que probaba —que
  un riel fino no sobrevive a la reducción— ya lo midió la T-04 de la fase 02, y
  mirar la barra chica es un vistazo que el revisor da o no da, no un artefacto que
  la task tenga que producir.

## T-07 — El pane del otro con nuestro cromo, y su propio riel

- **Objetivo:** paridad visual entre los dos panes, con el de la izquierda
  siguiendo siendo un cliente sin modificar. Es la mitad caro del punto 4 y es lo
  primero que se recorta si el calendario aprieta.
- **Qué tiene que cubrir:** la entrada pública que decidió la T-04, construida y
  usada sobre el pane de fábrica; el riel de ese pane marcando sus propios
  interstitials, desde la fuente que la T-04 eligió; y las tres lecturas que
  verifican que el pane sigue siendo de fábrica.

  **Lo que nadie midió y hay que medir antes de decidir qué muestra esa barra.**
  Los controles leen `currentTime`, `duration`, `paused` y `muted` del elemento que
  reproduce el contenido primario. En ese pane, durante un interstitial, hls.js
  pasa el MediaSource del primario al asset y de vuelta, y `js/stock-player.js` ya
  lo dice en una línea: el tiempo que reporta un cliente de mercado durante un
  aviso de reemplazo es el del aviso y no el del programa. Así que esa barra puede
  mostrar el reloj del aviso durante el break, y su `duration` puede ser la del
  aviso. Que eso sea un defecto o que sea exactamente la verdad de lo que
  significa reemplazar es la decisión de esta task, y lo que muestre tiene que ser
  cierto: la barra es el instrumento sobre el que se apoya la comparación cuadro a
  cuadro que la fase existe para hacer posible.

  **Qué controles actúan sobre ese pane, decidido y escrito.** El cromo trae cuatro
  y los cuatro accionan el elemento: la pausa, el audio, el fullscreen y el seek de
  la barra. Ese pane hoy está muteado a propósito, porque el audio de la
  composición es del pane de la demo (ADR 0014), y nadie lo maneja. Las dos
  consideraciones tiran para lados distintos y por eso es una decisión y no un
  default: un control que está y no hace nada es una diferencia propia, que es lo
  que el criterio de la fase manda sacar, y dos panes audibles a la vez es peor en
  cámara. Lo mismo con el seek: un seek en ese pane durante un interstitial es
  asunto de la maquinaria de hls.js, y el informe de la fase 02 ya dejó anotado que
  la barra quedó seekeable sin que ningún bloque lo pidiera y que son cinco líneas
  si se quiere sacar.

  La marca no cuesta nada acá: después de la T-02 ninguno de los dos panes lleva
  logo sobre la imagen.

  Punto de partida: la decisión de la T-04, `js/stock-player.js`, `lib/controls.js`,
  `index.html` —el `div.player` del pane de fábrica y su `<video id="stock-video">`—,
  y los ADR 0007 y 0015 con sus notas. Restricción: **la instancia de ese pane se
  sigue construyendo con cero opciones.** `new Hls()` y nada más, ningún asset-list
  concurrente pedido desde ese pane, y el Date Range de clase Apple todavía
  agendado. Ninguno de los dos panes muestra controles nativos (nota del ADR 0015).
  Depende de T-04, T-05 y T-06.
- **Definición de done:** capturas a tamaño real de los dos panes con el mismo
  cromo, adentro y afuera de un break; el riel del pane de fábrica con sus cinco
  interstitials marcados; **las tres lecturas escritas** —la configuración de la
  instancia, la pestaña de red de ese pane y los eventos agendados—; y qué muestra
  esa barra durante un interstitial, decidido, escrito y visible en una captura
  tomada adentro del break.
- **nivel de verificación:** bajo. Lo que puede fallar en silencio acá no es
  aritmética sino una afirmación sobre el pane —que parezca sin modificar y no lo
  esté—, y lo que la agarra es una lectura de la página corriendo, que la definición
  de done pide por nombre. No es `alto` porque los tests que ese nivel debe serían
  de browser, y este proyecto decidió no tenerlos.

  **Queda:** las capturas de los dos panes adentro y afuera del break; **las tres
  lecturas**, que son lo único que separa un pane sin modificar de uno que lo
  parece y por eso no se recortan; la lectura de qué reporta el elemento de ese
  pane durante un interstitial, que es lo que decide qué muestra su barra y la
  barra tiene que ser cierta; y `verificar-cortes` con `npm test` si la task
  termina tocando `lib/controls.js` para construir la entrada pública que decidió
  la T-04.

  **Se fue:** nada. Esta task ya estaba escrita sobre lecturas de una página
  corriendo y no sobre aparato.
