# Informe de cierre — fase 04: el refinamiento

**Fase cerrada el 2026-09-07 con las siete tasks en `done`.** Se abrió y se
cerró el mismo día.

## 1. Resumen

La fase nació de **seis puntos que Nicolás dio probando la demo desde el
celular**, y **los seis quedaron cerrados**. Ninguno agregaba una capacidad:
tres eran defectos que hacían la demo incómoda o inusable, y tres sacaban
diferencias entre los dos panes que no eran el mecanismo que la demo existe
para mostrar.

Lo que la fase entrega es el criterio cumplido: **los dos players quedan
idénticos en todo y distintos en una sola cosa, qué muestran durante el
break.** Tienen el mismo cromo, la misma barra, el mismo reloj, ninguna marca
sobre la imagen, y están en el mismo segundo del programa. El de la izquierda
sigue siendo `new Hls()` con cero opciones.

### Los seis puntos, uno por uno

1. **El pane sin modificar reemplaza el contenido en lugar de insertarlo** —
   **cerrado por la T-05.** La forma del reemplazo es la **ausencia** del
   `X-RESUME-OFFSET` y no un offset igual a la duración, y la eligió una
   medición: con el atributo ausente hls.js resuelve el retorno contra el largo
   que **midió** del aviso (`resumptionOffset` 12,037 s), y con el offset escrito
   a mano vale el número escrito (12). Son 38 ms de diferencia y son la
   diferencia entre un punto de retorno que es una propiedad del aviso y una
   constante que hay que mantener igual al aviso. Es un `printf` de
   `scripts/senalizar-contenido.sh`, así que es reversible.
2. **La pausa de la composición manda sobre los avisos** — **cerrado por la
   T-01.** `applyPlayback()` lee `video.paused`, corre después de cada `build` y
   en el `play` y el `pause` del primario, y el `node.play()` de `build()` se
   fue. Queda un solo lugar que contesta si un elemento del aviso reproduce, que
   es la forma que el mute ya tenía.
3. **La barra pinta sólo lo que ese player reproduce, y sólo sobre el riel** —
   **cerrado por la T-06 y la T-07.** El carril de abajo se fue: 10 nodos de
   marca pasaron a 5, y los 5 que estaban a +11 px del borde de abajo del riel
   pasaron a 0. El pane de fábrica marca sus cinco interstitials en su propio
   riel, desde su propio `hls.interstitialsManager`.
4. **El pane sin modificar lleva nuestro skin y sigue sin estar modificado** —
   **cerrado por la T-04 y la T-07.** La entrada pública nueva es
   `attachControls(video, { container, provider, logo })`, aditiva: `attach` no
   cambió. Las tres lecturas del ADR 0007 volvieron verdes — `userConfig` con
   cero claves, cinco `assetListUrl` del lineal y nada más con la huella
   `_HLS_primary_id`, y cinco Date Ranges agendados los cinco de clase
   `com.apple.hls.interstitial`.
5. **El logo de Qualabs sale de los controles del player** — **cerrado por la
   T-02.** Se fue la línea de `js/app.js` que pasaba `logo`. La opción, su
   documentación, el nodo `qa-brand` y su CSS quedaron los cuatro en pie: sacar
   la opción le habría quitado a un integrador la única manera de poner su marca
   adentro del cuadro, que es otro problema.
6. **Los controles se pueden usar con el dedo** — **cerrado por la T-03.** La
   capa pasa de quedarse arriba 118,9 ms —exactamente lo que el dedo estuvo
   apretando— a 5000,2 ms, y la baja el temporizador y no el dedo levantándose.
   `pointerleave` deja de esconder para todo lo que no sea un mouse, el gesto de
   touch es un segundo toque sobre la imagen, y `--qa-icon` pasa de 34 a 44 px.

### Lo que las tasks encontraron y nadie había pedido

Es lo más valioso de la fase: **cinco de las siete tasks devolvieron un
hallazgo que su punto no pedía**, y tres de los cinco eran defectos que
entraban en cámara.

- **El aviso volvía desfasado del programa después de una pausa (T-01).** La
  tercera columna de la lectura nodo por nodo —`currentTime`, que estaba pedida
  justamente porque no se ve— midió que al volver de la pausa el asset estaba en
  **11,483 s contra los 7,387 s que el contrato pedía**: los nodos habían seguido
  corriendo los cuatro segundos que la composición estuvo detenida. Un elemento
  en el segundo equivocado se ve perfecto en una captura.
- **Un toque invisible levantaba el mute, y apagar los eventos de puntero cubría
  sólo la mitad (T-03).** El bloque nombraba `.qa-track`, y es cierto —un toque
  en la franja de abajo con los controles invisibles seekeó 134,01 s—, pero los
  cuatro controles tienen `pointer-events: auto`: el toque en el centro pausaba
  la composición y el de arriba a la derecha levantaba el mute, que de los tres
  es el peor en cámara. Y apagar `pointer-events` mientras la capa está escondida
  no alcanza, porque **el `pointerdown` se resuelve antes de que corra cualquier
  listener y el `click` se resuelve después**, ya con la capa de vuelta: medido,
  un toque sobre el medio invisible dio `pointerdown` en el video y `click` en el
  botón de play, y la composición se pausó. Por eso hay dos mecanismos y no uno,
  y el click se traga en fase de captura sobre el contenedor.
- **El atraso de 49,47 s se fue a 0,72 s, y el quinto break pasó a verse (T-05).**
  A los 160 s —el mismo instante en que la T-12 de la fase 01 leyó 49,47 s— el
  pane de la demo va en 160,106 s y el de fábrica en 159,381 s. `AD-5-LINEAR`
  arrancó en 120,021 y cerró en 132,059 con el VOD de 180 s todavía lejos, así que
  **el recorrido pasa a mostrar cinco avisos lineales en lugar de cuatro**. Y los
  0,72 s son de dos breaks y de ninguno de los otros tres: los tres que hls.js
  appendea en el lugar no cuestan nada, los dos que pasan el MediaSource al asset
  y de vuelta cuestan 0,24 s y 0,47 s, que es el precio del reattach.
- **El rótulo del pane de fábrica decía `125.3s of the ad` de un aviso de 12 s
  (T-05 lo encontró, T-07 lo mató).** Hoy dice `2.1s of 12.0s` en los cinco
  breaks. El hallazgo de la T-05 que se lo dejó a la T-07 es más grande que el
  rótulo: el ADR 0017 y el comentario de `js/stock-player.js` dicen que un cliente
  de mercado reporta el tiempo del aviso durante un reemplazo, y **medido es una
  cosa o la otra según el break** —el del aviso en los breaks 2 y 4, el del
  programa en los breaks 1, 3 y 5—, porque hls.js elige la estrategia por break
  según si el punto de retorno cae en un borde de segmento de la grilla de 2 s.
  La respuesta que el riesgo R3 pedía medir no era una: eran dos.
- **Alimentar la barra del pane de fábrica con su elemento le hacía perder las
  cinco marcas (T-07).** En los dos breaks donde hls.js le pasa el MediaSource al
  asset, con `duration` en 12,032 los cinco rangos caen más allá del final y
  `rangeSpan` devuelve `null` para los cinco: la barra mostraría **0:02 de 0:12 y
  ninguna marca**. Eso dejó al otro camino sin defensa y decidió que la barra de
  ese pane es la barra del **programa**, leída de
  `hls.interstitialsManager.primary`.
- **El seek de ese pane resultó no ser mobiliario (T-07).** Adentro de un break
  no lo toma, medido cuatro veces en las dos estrategias y en los dos sentidos:
  es el `X-RESTRICT="SKIP"` del tag haciéndose valer. El informe de la fase 02
  había anotado que la barra quedó seekeable sin que ningún bloque lo pidiera y
  que eran cinco líneas si se quería sacar; esto lo convirtió en la razón para
  dejarlo.
- **La lista de ocurrencias aceptadas de `verificar-cortes` bajó de cinco a tres
  (T-06)**, con las razones de las dos que quedaron reescritas donde dejaron de
  ser exactas. Un chequeo cuyas excepciones ya no existen es un chequeo que dejó
  de probar lo que dice probar.

## 2. Decisiones tomadas

**Ningún ADR con `scope: phase-04`.** Los dos ADR nuevos de la ventana de la
fase salieron con `scope: project` porque las dos decisiones son del producto y
no del plan de esta fase:

- **ADR 0017** (2026-09-07, `accepted`, project) — el pane del cliente de
  mercado reemplaza el contenido en lugar de insertarlo, con el argumento del
  atraso retirado a propósito. Ganó nota fechada con la forma que fijó la
  medición de la T-05: la ausencia del atributo y no un offset escrito.
- **ADR 0018** (2026-09-07, `accepted`, project) — cada barra marca sólo lo que
  ese player reproduce y lo marca sobre su propio riel. Supersede el diseño de
  dos carriles de la T-04 de la fase 02, que vivía en el documento de esa task, y
  paga la recomendación 5 del informe de esa fase, que pedía promoverlo a ADR.

**Cuatro ADR anteriores llevan nota fechada del 2026-09-07** y ninguno cambió su
decisión: el **0007** dice qué cubre "sin modificar" ahora que ese pane lleva
nuestro cromo —la instancia y su configuración, no el mobiliario—, verificado con
tres lecturas; el **0015** gana que los controles funcionan con o sin
experiencias concurrentes y pierde la pata del argumento de compatibilidad que su
nota del 2026-09-04 apoyaba en los 49,5 s; el **0016** conserva su decisión y su
contexto deja de describir la demo que corre. El **0014** conserva la nota del
2026-09-05, anterior a la fase, y la fase la ejerció: la T-07 puso el arbitraje
de audio entre los dos panes en `js/app.js` y no en la librería.

**Tres decisiones de la fase deliberadamente NO salieron como ADR, con la razón
escrita** (T-04): la forma de la entrada pública, de dónde salen las marcas de la
barra del pane de fábrica, y las tres lecturas. Las tres son instancias de
decisiones ya aceptadas —las notas del 0015 y del 0007 y el ADR 0018—, y el
principio de atrás que sí sería un ADR —una capacidad nueva se publica como
función, una perilla como opción de `attach`— tiene hoy un caso solo. **Una regla
escrita sobre un caso solo es ese caso con otra forma**, así que se propone cuando
la fase 03 traiga el segundo.

**El validador de frontmatter de ADR: rojo, 20 hallazgos, todos de la misma
clase.** Los 18 `id:` más el `superseded_by: 0014` del 0010 y el
`supersedes: 0010` del 0014 estaban sin comillar, y en YAML un escalar con cero a
la izquierda es octal: `0011` vuelve como `9`, que es el id de otro ADR de esta
misma carpeta, y no hay error en ningún parser. Ninguno de los 20 es una relación
mal puesta —no hay nada que decidir sobre qué extremo se mueve—, así que se
comillaron en un commit propio inmediatamente después de este cierre. El barrido
es el mismo que ya se había hecho en los otros nueve proyectos del repo; este
había quedado afuera porque había agentes trabajando adentro.

## 3. Tasks

Las siete en `done`, ninguna abandonada, ninguna con `post-ejecución:`.

| id   | qué cerró | nivel |
| ---- | --------- | ----- |
| T-01 | `applyPlayback()` lee `video.paused` y el estado deja de decidirse al crear el nodo. Lectura nodo por nodo con tres columnas en los dos estados. | bajo |
| T-02 | La línea de `js/app.js` que pasaba `logo` se fue; la opción y su documentación quedaron. Diff vacío sobre `docs/integrating-the-library.md`. | mínimo |
| T-03 | `pointerleave` deja de esconder salvo con mouse, segundo toque como gesto de touch, `CONTROLS_HIDE_TOUCH_MS = 5000`, `--qa-icon` a 44 px detrás de `(any-pointer: coarse)`. | bajo |
| T-04 | `attachControls` como segunda función y no como opción de `attach`; las marcas del pane de fábrica salen de su propio manager; las tres lecturas no entran en `verificar-cortes`. Cero líneas de código. | mínimo |
| T-05 | El `X-RESUME-OFFSET` ausente. 49,47 s de atraso a 0,72 s, cinco avisos lineales en el recorrido, párrafo del `README.md` reescrito. | bajo |
| T-06 | Se fue el carril de abajo; `playedRanges(provider)` decide qué clases marca cada barra; `.qa-track` a 44 px de un solo valor. | bajo |
| T-07 | Los dos panes con el mismo cromo; la barra del de fábrica sobre el programa; los cuatro controles con algo que hacer; las tres lecturas verdes. | bajo |

**Los tres chequeos que la fase decidió no recortar corrieron y cerraron en
verde cada vez que la task tocaba lo que miran**: `verificar-cortes` (las dos
costuras), `npm test` (27 de 27 en las cuatro tasks que lo corrieron) y la
comparación de la caja pedida contra la dibujada, con **delta máximo 0 px**
siempre, y 0,007813 px en el teléfono, que es el redondeo sub-pixel de una caja
de 361,52 px y dio el mismo número antes y después del cambio.

**El `npm test` de la T-05 sirvió donde nadie lo esperaba, y el de la T-06
directamente atrapó un defecto**: un backtick que se fue adentro del template de
CSS rompió `lib/controls.js`, y lo agarraron el test que importa `rangeSpan` y el
chequeo de sintaxis del build en la misma corrida.

### Dos tasks tuvieron que decidir algo que su bloque no decidía

Y las dos quedaron escritas, que es lo que hace que esto sea información y no un
agujero.

- **La T-06 tuvo que decidir quién elige los rangos que una barra marca.** El
  bloque decía que el carril se va y que el `kind` del contrato se queda; con el
  carril afuera y sin nada más, nuestra barra dibujaba los diez rangos del
  contrato en los mismos cinco lugares —951,09 y 36,09 px el primero, que es la
  medición de la T-04 de la fase 02 saliendo sola otra vez—, o sea un color encima
  de otro. La respuesta quedó forzada por tres cosas ya cerradas y no fue una
  elección libre: el contrato entrega las dos clases a propósito, la barra no
  puede filtrar por clase porque es la misma barra que la T-07 le pone al pane de
  fábrica, y no había dónde ponerlo como opción porque la T-04 ya había cerrado la
  firma de `attachControls`. Lo elige **quien conecta un proveedor con una
  barra**: `playedRanges(provider)`, un `Set` de las clases que ese player
  reproduce.
- **La T-07 tuvo que decidir qué muestra la barra del pane de fábrica.** El
  bloque pedía medir qué reporta ese elemento durante un interstitial y decidir
  después; lo que la medición devolvió fue que el camino del elemento pierde las
  cinco marcas, y con eso la decisión dejó de tener dos lados.

**Es un aprendizaje sobre cómo se escriben los bloques, no un defecto de las
tasks.** Las dos decisiones son consecuencias de decisiones ya tomadas —el `Set`
sale del ADR 0018 y de la firma que cerró la T-04; el reloj del programa sale de
que la barra tiene que ser cierta— y las dos aparecieron recién cuando alguien
tuvo el código adelante. Lo que el bloque puede hacer distinto es nombrar la
pregunta: el de la T-07 la nombraba y por eso su decisión fue trabajo previsto,
el de la T-06 no la nombraba y por eso fue trabajo encontrado. Las dos veces el
costo lo pagó la task escribiendo la decisión, que es lo correcto y no es gratis.

## 4. Lo que queda abierto

**El hilo abierto real de la fase: 13 commits sin pushear.** Los 12 de la fase
—de `1716f6f plan(fase-04)` a `18641fb ADR 0017: nota fechada`— más el de este
cierre. Nada está en `origin/main`, así que hoy la demo que se graba existe en un
disco y no en el remoto. Es lo primero que conviene resolver, y es un `git push`.

**Lo que le queda a la fase 03, que estaba escrita y sin arrancar: un
precedente, no una decisión pendiente.** Está en la sección 10 del documento de
la T-07: desde la fase 03 nuestro player reproduce un aviso lineal adentro del
break, así que **nuestro** elemento va a poder dejar de reportar el programa por
el mismo mecanismo que el del pane de fábrica. La respuesta ya está escrita en la
sección 3 de ese documento —el reloj de una barra sale de donde viva la posición
del programa, y el del aviso es otra afirmación en otro lugar— y la segunda mitad
la escribió la T-06: `KINDS_PLAYED` se lleva la clase de reemplazo el día que este
player la reproduzca. La fase 03 no tiene que decidirlo, tiene que aplicarlo.

**Una afirmación viva que este cierre no aplicó, porque su alcance era
`.project/`.** El comentario de cabecera de `css/player.css` cierra diciendo que
la marca "travels the other way, as a file passed to `attach`", en un párrafo
sobre lo que **esta página** le entrega al cromo. La oración sigue siendo cierta
del mecanismo, pero desde la T-02 esta página no lo pasa, y desde la T-04 el
`logo` entra además por `attachControls`. La T-02 la dejó anotada y el pase de
limpieza de referencias al logo la confirmó como la única que quedaba.

**El contrato en `docs/` tiene una justificación que la fase dejó vieja.** La
sección "Los rangos del programa" cierra el argumento del campo `kind` con "sin
este campo la barra no puede pintar dos colores". El campo sigue siendo necesario
y por la misma razón de fondo —es lo que le permite a cada barra pintar el rango
que marca con el color que esa clase ya tiene—, pero después de la T-06 los dos
colores no están en una barra: están uno en cada pane. Es una oración y no un
cambio de contrato. Ver la sección 8.

**Dos cosas de la fase 02 siguen abiertas y esta fase las declaró fuera de
alcance**: el global `Hls` y el borrado del atributo `style`. Son de la superficie
pública y no de lo que se graba.

**El argumento nuevo todavía no existe como artefacto.** El del atraso se midió
en dos tasks de la fase 01 y está en un informe cerrado; el nuevo —al mismo
segundo, uno muestra el aviso encima del programa y el otro en lugar del
programa— no tiene todavía el cuadro de los dos panes en el mismo segundo. La
fase dejó lista la condición que lo hace posible y el cuadro lo arma Nicolás.
Hasta que exista, el retiro es una apuesta.

**Lo de antes que la fase no toca**: la confirmación de David sobre la mezcla del
Quad y la dirección del skin, los assets que faltan, la fecha del primer draft,
iOS con Emil, los ADR 0011 y 0012 en pausa, y quién hace el primer pase de la
especificación de SVTA. Y **el punto 1 le cambia a David lo que cuenta en
escenario**, así que va contado antes del sync del 21 de septiembre y no después.

## 5. Riesgos que se materializaron

- **R2 se materializó, y con la forma que el riesgo anticipaba contra la que el
  encargo decía.** El riesgo estaba escrito diciendo que la causa enunciada
  —el temporizador que se renueva con el movimiento del mouse— no era la que
  explicaba el síntoma, y la medición le dio la razón: `pointerleave` dispara
  0,2 ms después del `pointerup` y la capa estuvo arriba 118,9 ms, mientras la
  causa del temporizador, aislada apretando el dedo sin levantarlo, dio 2601,3 ms
  y cero `pointermove`. **Las dos son ciertas y son de órdenes distintos**, así
  que arreglar una sola habría dejado el síntoma a medias. Medir antes de arreglar
  era la mitigación y funcionó.
- **R3 se materializó y devolvió dos respuestas donde el riesgo esperaba una.**
  Qué lee el elemento del pane de fábrica durante un aviso no tiene una respuesta:
  es el tiempo del aviso en los breaks 2 y 4 y el del programa en los breaks 1, 3
  y 5, porque hls.js elige la estrategia por break. Y una de las dos **ya estaba
  mintiendo en cámara** en el rótulo `125.3s of the ad`. La mitigación —medir
  antes de decidir qué muestra esa barra— es lo que evitó que la barra que sostiene
  la comparación cuadro a cuadro se construyera sobre un supuesto.
- **R1 no se materializó y se verificó en lugar de afirmarse.** El pane sigue sin
  estar modificado con las tres lecturas verdes, y la de la instancia salió más
  fuerte de lo que el ADR pedía: `userConfig` con **cero claves**, que cubre
  también el argumento que alguien le pase mañana.
- **R4, el calendario, se cumplió mejor de lo previsto.** La fase se abrió y se
  cerró el mismo día, así que no se comió los días de la 03, y no hubo que
  ejercer el orden de recorte: la T-07, que era lo primero que se recortaba, se
  hizo entera.
- **R5 sigue vivo**, con la mitigación cumplida en su parte de la fase: los dos
  panes están en el mismo segundo. Ver la sección 4.

## 6. Recomendaciones para la fase siguiente

1. **Pushear.** Trece commits, incluida la demo que se graba, existen en un solo
   disco. Es el único item de esta lista que no es trabajo.
2. **Aplicar el precedente de la sección 10 de la T-07 en la primera task de la
   fase 03 que toque el reloj de nuestra barra**, sin volver a decidirlo. Nuestro
   elemento va a dejar de reportar el programa por el mismo mecanismo, y la
   respuesta y su segunda mitad —`KINDS_PLAYED`— ya están escritas.
3. **Cuando un bloque diga "medir y después decidir", nombrar la pregunta que se
   va a decidir.** Las dos decisiones no previstas de esta fase salieron baratas
   porque las dos tasks las escribieron, y la diferencia entre las dos fue que una
   estaba nombrada en el bloque y la otra no. Es una línea en el bloque y no un
   proceso nuevo. La T-01 de la fase 03 es exactamente una medición para decidir.
4. **Corregir las dos afirmaciones vivas de la sección 4 en la primera task de la
   fase 03 que toque esos archivos** —el comentario de `css/player.css` y la
   justificación del `kind` en el contrato—, y no antes: son dos oraciones y las
   dos están anotadas con su ubicación.
5. **Contarle a David el cambio del argumento antes del 21.** No es documentación:
   es lo que él cuenta en escenario, y la fase 04 lo cambió.
6. **La vara de la fase 03 no es la de esta.** Esta fase fue liviana con
   fundamento escrito: los seis defectos se veían todos y el revisor era el ojo de
   Nicolás. La fase 03 son capacidades nuevas, y su primera pregunta es si el aviso
   lineal adentro del break obliga a reabrir un ADR de la fase 01.

## 7. Correcciones post-ejecución

`grep -n "post-ejecuci"` sobre el `TASKS.md` de la fase **no devuelve ninguna
línea**, y no hay ningún `feedback-<n>.md` en la fase. **Ninguna de las siete
tasks necesitó una corrección después de haberse declarado `done`**, igual que en
la fase 01 y en la fase 02.

Leído como medición, y con la advertencia de que tres fases sin una sola
corrección empieza a ser un dato sobre la convención y no sólo sobre las tasks:
lo que sostuvo el `done` acá no fue una definición más exigente sino **una
lectura numérica adentro de cada definición de done que en principio no parecía
necesaria**. Las tres correcciones que en otro proyecto habrían vuelto después
—el asset volviendo desfasado, el mute que un toque invisible levantaba, la barra
del pane de fábrica perdiendo las cinco marcas— las agarró la lectura y no la
captura, y las tres estaban pedidas en la definición de done de su task antes de
que nadie supiera qué iban a devolver. La fase que decidió ser liviana en aparato
fue la que más se apoyó en las lecturas que ya tenía.

**Un caso que la convención trata igual y no lo es**, y conviene dejarlo
separado: hubo **una corrección al encargo y ninguna al trabajo**. Sobre la T-02
ya cerrada, la definición de done del bloque pedía "la sección 7 del documento
del integrador sin cambios", que es el alcance correcto; lo que se ensanchó fue el
encargo al subagente, que pidió probarlo con un `git diff` vacío sobre el archivo
entero, y con eso la sección 9 quedaba inmovilizada sin que ninguna task lo
hubiera decidido. El subagente frenó y lo devolvió en lugar de elegir por su
cuenta. El bloque no cambió, y la sección 9 la corrigió la T-07 cuando le tocó.

## 8. Revisión de documentación

Superficie por superficie, con el resultado por superficie.

- **El índice de fases del `PROJECT.md`.** Actualizado en este pase. La línea de
  la fase 04 se reescribió para decir en qué terminó y no en qué consistía su
  plan: los seis puntos cerrados, el criterio cumplido, y lo que costó. La línea
  de la fase 03 no se toca: sigue diciendo que arranca después de la 04, y ahora
  eso es un hecho y no un plan. `last_update` ya estaba en 2026-09-07. El `status`
  del proyecto queda en `ongoing`: quedan la fase 03, la grabación, iOS y la
  especificación de SVTA.
- **La sección "A confirmar" del `PROJECT.md`.** Actualizada en este pase en un
  item. El del argumento del atraso estaba escrito en futuro —"la fase 04 hace
  que…"— y ahora dice lo que la T-05 midió, con el 0,72 s y el quinto break. Lo
  que sigue abierto de ese item es lo único que siempre fue de David: que le
  cuenten el cambio antes del 21. Los otros items no los tocó la fase.
- **El `PHASE.md` de la fase.** `status: closed` y `closed: 2026-09-07`. El
  cuerpo no se toca: es el contrato de la fase y describe correctamente lo que se
  propuso, incluidos el R2 y el R3, que se materializaron en formas adyacentes a
  las que están escritas. Eso es información y no un error a corregir.
- **El `TASKS.md` de la fase.** Sin cambios. Las siete tasks ya estaban en `done`
  con su carpeta de evidencia apuntada, y no hay líneas `post-ejecución:` que
  agregar.
- **El `LOG.md` del proyecto.** Entrada de cierre agregada. Las diez entradas de
  la ventana de la fase quedan como están: son el registro de lo que pasó.
- **`docs/arc42/`.** **No existe en este proyecto, y este cierre no lo crea.** El
  documento de arquitectura del producto es
  `docs/contrato-senalizacion-renderizado.md`, que la fase 02 creó y el
  `PROJECT.md` nombra como tal. Se re-leyó entero contra lo que la fase construyó
  y **sigue describiendo este sistema**: el contrato no cambió —`programRanges()`
  sigue devolviendo los diez rangos con su `kind`, y `lib/signalling.js` no se
  tocó—, y su sección "El proveedor" está escrita sobre un objeto con dos métodos,
  así que la segunda implementación que la T-04 agregó del lado de la demo la
  confirma en lugar de contradecirla. Es la primera vez que se ejerce la
  consecuencia que el ADR 0003 escribió en la fase 01. **Le queda una oración
  vieja**: el argumento del campo `kind` cierra con "sin este campo la barra no
  puede pintar dos colores", y después de la T-06 los dos colores están uno en
  cada pane. Este cierre no la aplicó porque su alcance era `.project/`: es la
  recomendación 4.
- **El resto de `docs/`.** `docs/integrating-the-library.md` está al día y lo
  pusieron al día las tasks, no este cierre: la T-04 escribió la introducción, el
  acotamiento de las dos exigencias de la sección 2 y la sección 6 con
  `attachControls`; la T-06 reescribió la sección 2.2, que decía "with the breaks
  marked on two lanes"; y la T-07 corrigió la sección 9 y el primer argumento de
  `attachControls` en la sección 6. La sección 7 —"The brand is yours"— no se tocó
  en ninguna de las tres, y eso es deliberado: es la superficie pública y la T-02
  la dejó exactamente donde estaba.
- **El `README.md` del proyecto.** Al día, y también por las tasks: la T-05
  reescribió el párrafo del atraso con el argumento nuevo y le sumó el ítem de la
  fracción de segundo que queda, para que quien grabe no la reporte como defecto;
  la T-06 corrigió la fila de `lib/controls.js`, que decía "the two lanes"; y la
  T-07 corrigió la fila de `lib/concurrent-hls.js` y el párrafo del par de
  compatibilidad, que decía "with nothing of this demo wired into it" y ahora
  distingue la instancia del cromo. **No tiene línea que apunte a `docs/arc42/`
  ni la puede tener, porque ese directorio no existe**; lo que sí tiene es la
  tabla de qué hay dónde, que nombra los dos documentos de `docs/` y para quién
  son. Y la recomendación 3 del informe de la fase 02 —el "five lines" arriba de
  un bloque de seis— quedó pagada: hoy dice "and six lines:".
- **`CLAUDE.md` del proyecto.** **No existe, y esta fase no lo necesita.** Las
  convenciones del proyecto viven en los ADR, en el `PHASE.md` de cada fase y en
  el `README.md`, y de las tres cosas que esta fase podría haber querido escribir
  como convención, las tres tienen dueño: el `Set` de clases está en el ADR 0018 y
  en el código, el límite del cromo está en la nota del 0015, y la vara de
  verificación liviana está en el `PHASE.md` de esta fase, que es donde
  corresponde porque fue la vara de esta fase y no del proyecto.
- **`.project/knowledge/`.** No existe y esta fase tampoco la crea. Nada de lo
  que la fase aprendió quedó sin un lugar: los hallazgos están en los documentos
  de las tasks, las decisiones en los ADR, y las mediciones en la evidencia.
- **El `CLAUDE.md` y `knowledge/` del repo raíz.** **Nada que agregar, y la
  candidata se revisó una por una.** Lo más parecido a un aprendizaje repo-wide
  que produjo la fase es el de la T-03 —que un defecto de render se verifica
  mirando la pantalla en un dispositivo y no leyendo estilos computados—, y eso
  **ya está escrito** en la memoria del repo desde antes de esta fase, que es
  justamente por qué el `PHASE.md` lo pudo citar como precedente al escribir el
  riesgo R2. Los otros dos candidatos son del producto y no del repo: el
  `pointerdown`/`click` resolviéndose en momentos distintos, y que hls.js elige la
  estrategia de interstitial por break. Los dos están en el documento de su task,
  que es donde alguien los va a buscar.
- **El documento de install/runbook.** El proyecto no tiene `INSTALL.md`: el
  arranque son `run.sh` y la sección del `README.md` que lo explica. **Ninguna
  task de la fase agregó ni rompió un paso de setup** —no entró una dependencia,
  ni un bundler, ni una variable de entorno, y `dist/` se sigue armando en cada
  arranque desde `lib/`—, así que no había nada que actualizar. La entrada pública
  nueva es de la superficie de la librería y vive en el documento del integrador,
  que es su lugar.
- **Las carpetas `tasks/` de la fase que cierra, marcadas como registro.** Las
  siete son evidencia y no instrucción vigente, y se leen como registro por
  construcción: los cuatro documentos que las tasks escribieron —el de la T-04, la
  T-05, la T-06 y la T-07— están escritos en pasado sobre lo que se midió y lo que
  se decidió, con los números al lado, y los archivos `*run.py`, `*-la-lectura-*`
  y las capturas `*-antes` / `*-despues` llevan el par en el nombre. Ninguno se
  reescribe. **El único que hay que leer como algo más que registro es el de la
  T-07, por su sección 10**, que es un precedente vigente para la fase 03 y está
  apuntado desde la sección 4 de este informe y desde la recomendación 2.
