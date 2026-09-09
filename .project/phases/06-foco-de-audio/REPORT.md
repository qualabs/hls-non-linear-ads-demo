# Informe de cierre — fase 06: el foco de audio

**Fase abierta, diseñada y generada el 2026-09-08; ejecutada y cerrada el
2026-09-09 con las tres tasks en `done`.** Ninguna abandonada, ninguna agregada
después de la generación, y una corrección post-ejecución.

## 1. Resumen

El ADR 0014 había dejado el audio de cada elemento en manos de quien arma la
campaña: el `volume` del asset list se respeta y el reproductor lo obedece. Lo
que quedaba sin dueño era la otra mitad, la de quien mira: con tres o cuatro
fuentes sonando a la vez, elegir cuál se escucha no tenía gesto. **Esta fase se
lo da.** Con los controles del player a la vista, un toque sobre una caja de
video del aviso y esa caja se lleva todo el sonido —va a 100 y el resto de la
composición a 0, el contenido primario incluido—; un anillo amarillo dice cuál
es; y la mezcla declarada vuelve sola por cinco caminos.

Lo que la fase entrega son tres piezas y una sola puerta. **La aritmética** es
una función pura, `effectiveVolumeOf(element, focused)`, con tres ramas. **El
índice es uno solo para toda la composición** y no un flag por elemento, y de ahí
salen gratis el Quad —tres cuadrantes más el primario— y dos experiencias
solapadas que ponen avisos de dos breaks distintos encima del programa. **El
gesto es un `pointerdown` y el predicado es *¿está el cromo arriba?***, así que
con mouse un click actúa de una y con dedo el primer toque muestra y el segundo
actúa, sin una rama por dispositivo en ninguna parte. Todo lo que mueve el foco
pasa por `setFocus`, que mueve el índice, mueve el anillo y recalcula la mezcla
en ese orden y en un solo lugar.

Es un POC y su vara está escrita en el `TASKS.md`: un único test nuevo, el de la
función pura, y ninguna campaña de mutación. Lo que la fase entrega se escucha y
se mira en pantalla, y su modo de falla está a la vista en el primer break.

### Lo que la fase midió

- **`npm test` en 49 verdes**, los 46 con los que la fase arrancó más los tres
  casos de la función pura, sin un solo valor esperado de los que ya existían
  tocado. Las tres tasks y la corrección terminaron en el mismo número.
- **`npm run check` en `both seams hold.`** Las dos costuras siguen donde
  estaban, y en particular el grep del ADR 0015 no creció: el foco es
  renderizado y no señalización.
- **La corrida entera, en un solo playback de 171 s desde el segundo 0 y sin
  seeks.** Los cinco breaks entran en su segundo —20,2 / 45,4 / 70,2 / 95,3 /
  120,2— y los cuatro avisos del break 5 se relevan en el 132, el 144 y el 156.
  Doce cuadros y quince lecturas, todas en verde.
- **El gesto, mirado con el player corriendo en dos pasadas** —doce lecturas en
  la T-02 y las quince de la corrida en la T-03—, con el switch de la
  composición levantado a mano, que es sin lo cual el `muted` de los nodos del
  aviso no dice nada. El Quad con un click deja el cuadrante tocado a 100 sin
  mutear, el resto y el primario a 0, y un anillo y uno solo; el
  `cornerOverlay` con un click calla el programa, que es el audio doble que la
  fase existe para resolver.
- **El nodo precargado, que era el riesgo que no se ve**: a los 129,9 s
  `ad2-box` está construido y posicionado sobre su caja con `opacity: 0` y
  `pointer-events: none`. Un click ahí no cambia un solo nivel y no pone anillo.

### Los commits

| commit | qué es |
| --- | --- |
| `1293d32` | el diseño del foco de audio |
| `8395d2d` | el diseño decía que en celular son dos toques y no decía nada del mouse |
| `b945d6f` | la fase generada del diseño aprobado: tres tasks y cinco ADR |
| `d978f96` | T-01: el foco cambia la mezcla, y el índice es uno solo |
| `7632439` | T-02: el gesto mueve el foco, y el anillo dice cuál es |
| `706e9ac` | T-03: las dos oraciones del README, y la corrida mirada entera |
| `1b980c8` | el `status` del `PHASE.md`, que decía `planning` con las tres tasks hechas |
| `ef7c13c` | T-02, post-ejecución: el primario también suelta el foco |

Los dos últimos no son tasks. El `1b980c8` es la sección 4 y el `ef7c13c` es la
sección 7.

## 2. Decisiones tomadas

Seis ADR nuevos, el **0026 al 0031**, y **los seis con `scope: project`**. Es un
dato del cierre y no una etiqueta descuidada: filtrar las decisiones de esta fase
por `scope: phase-06` devuelve cero, porque **ninguna de las seis es sobre cómo
se ejecuta esta fase**. Lo que fijan es quién decide qué se escucha en este
producto, y eso sobrevive a la fase por definición. Se identifican por su ventana
de fechas: el 0026 al 0030 son del 2026-09-08, el día del diseño, y el 0031 del
2026-09-09.

- **ADR 0026 — el foco de audio es exclusivo y es un índice único de toda la
  composición.** El elemento con foco suena a 100 y todo el resto va a 0, el
  primario con `volume = 0` y nunca con `muted`. La aritmética vive en una
  función pura al lado de `volumeOf`. **Generaliza el ADR 0014**, que queda
  `accepted` con `generalized_by: "0026"` y su nota fechada: nada de lo que ese
  ADR decide dejó de valer, y lo que se ensancha es quién contesta cuál de varias
  fuentes concurrentes se escucha. Descartada la regla como venía enunciada —"el
  elemento tocado se lleva el nivel del primario"—, que medida contra el código es
  un no-op en el Quad y deja audio doble en `cornerOverlay`.
- **ADR 0027 — enfocable es una caja de video del aviso y nada más.** El primario
  queda afuera porque un `pointerdown` sobre la imagen ya significa alternar el
  cromo; las imágenes, porque no tienen audio que llevarse.
- **ADR 0028 — el gesto es un `pointerdown` sobre la caja y sólo cuenta con el
  cromo arriba.** Una regla y dos comportamientos, sin rama por dispositivo. Es
  `pointerdown` y no `click` porque en el segundo toque el `pointerdown` del
  contenedor baja el cromo antes de que llegue el `click`. Los punteros se
  habilitan en el nodo y en `place()`, no en la capa y no en `createNode`.
- **ADR 0029 — el foco se suelta a la mezcla declarada, y tiene cuatro salidas**:
  se toca de nuevo el elemento enfocado, se rearma la composición, el asset se
  termina antes que su ventana, o cierra el break. No se vuelve "al primario",
  que en el Quad declara 10 y no 100.
- **ADR 0030 — la marca la dibuja el renderer sobre el nodo que creó**, porque
  `controls.js` tiene prohibido tocar la capa de los avisos. Un `outline` de 4 px
  en `#FFD400` con `outline-offset` negativo, inline. Descartados el toast y el
  parlante al lado del anillo.
- **ADR 0031 — un toque en el primario también suelta el foco, sin ser blanco del
  gesto.** Es la sección 7, y **supersede al 0027** en su afirmación de que el
  primario nunca tiene efecto de audio; lo que el 0027 decidió sobre qué es
  enfocable sigue en pie tal como está escrito ahí.

**Dos decisiones del diseño no se volvieron ADR, a propósito.** Que el 0026
generalice al 0014 en lugar de supersederlo es una decisión sobre cómo se escribe
el registro y no sobre el sistema, así que vive en el `generalizes: ["0014"]` del
0026 y en la nota fechada del 0014. Y que el foco sea un beat opcional de la
corrida grabada es alcance y calendario, así que vive en el `PHASE.md`.

### El par 0031 → 0027, que es la fase probada y corregida

La fase se ejecutó entera, Nicolás la probó, y sobre el gesto ya cerrado pidió
una cosa más: *"si toco el contenido principal de nuevo, entonces vuelva el
contenido principal. Además, que si toco el contenido principal, también sea como
deseleccionar."* El ADR 0027 ya había mirado esa puerta durante el diseño y la
había descartado por una colisión concreta: hacer enfocable el primario
convertiría cada toque sobre la imagen con el cromo arriba en un cambio de audio,
y el gesto que baja el cromo pasaría a cambiar el sonido en su lugar.

La colisión seguía siendo válida, así que **el pedido no se resolvió reabriendo
esa puerta sino agregando una angosta y condicional**: con el cromo arriba y algo
enfocado, un `pointerdown` sobre el primario suelta ese foco y el toque se consume
ahí; con nada enfocado, la misma condición contesta que no hay nada que soltar y
el toque cae al comportamiento de siempre. Las dos lecturas son mutuamente
excluyentes por construcción, así que no hay un estado en el que el mismo toque
pueda significar las dos cosas.

**Entró como corrección de la T-02 y no como task nueva, y la fase no se
reabrió.** El diff son las mismas tres piezas que la T-02 ya tocaba, la task se
quedó en `done` con su línea `post-ejecución:`, y la decisión quedó escrita donde
va, en un ADR con su supersede completo en los dos extremos.

## 3. Tasks

Tres, las tres en `done`, cada una con su carpeta de evidencia, y las tres en
nivel de verificación `bajo`.

| id | qué dejó |
| --- | --- |
| T-01 | `effectiveVolumeOf` pura y exportada, el índice `focused` como estado del renderer, `applyAudio` cambiada en una línea, y las tres salidas del ADR 0029 que no dependen del gesto puestas donde el evento ya estaba. `test/audio-focus.test.js` con sus tres casos sobre los asset lists reales de `test/fixtures/`. En pantalla no cambió nada: lo que entrega es la aritmética |
| T-02 | el `pointerdown` en la rama de video de `createNode`, los punteros en `place()`, `setFocus` como única puerta del índice y del anillo, `up` en el handle de `createControls` y `chromeUp` cableado en `attach()`. Doce lecturas con el player, siete capturas, y el nodo precargado medido |
| T-03 | las dos oraciones del README de la demo —una en el párrafo del switch de `Before you record` y una en el del Quad—, la sección leída línea por línea, los links del documento chequeados y no declarados, y la corrida entera mirada en un playback continuo |

### Lo que las tasks decidieron y su bloque no decidía

Seis cosas en tres tasks, y **ninguna se preguntó**. Todas son del mismo tipo: el
bloque fijaba el qué y el caso concreto pedía elegir el cómo.

- **T-01.** El índice compara **por identidad del elemento y no por `id`**, porque
  un `id` nombra un elemento adentro de un layout y la composición puede tener
  elementos de más de un layout a la vez; los elementos son estables porque
  `activeAt` filtra un array guardado. El foco se suelta **en todo `ended`** y no
  sólo en los que la advertencia reporta, porque un nodo que terminó está callado
  igual y el foco quedándose ahí deja la composición entera en 0, que es audio
  faltante. Y el test nuevo va en su propio archivo y no adentro de
  `program-ranges-and-volume.test.js`, cuyo encabezado declara ser la medición de
  otra fase.
- **T-02.** El anillo se va **en el `ended` del nodo** y no sólo cuando el nodo
  desaparece: un asset que se terminó antes que su ventana se queda en pantalla
  con su último cuadro, así que un anillo que sobreviviera estaría marcando la
  única caja que con seguridad no suena. Y `chromeUp` tiene default `() => false`,
  o sea que **sin predicado no hay gesto**: un renderer construido sin controles
  no tiene cromo que gatee el toque, y eso evita el tercer comportamiento que el
  ADR 0028 existe para no tener.
- **T-03.** El anillo se nombra **en el párrafo del Quad y no en el del switch**:
  el del switch es donde vive la política y el del Quad es el beat que se ve en
  cámara, así que la marca va donde alguien la va a estar mirando.

## 4. Lo que queda abierto

### Los dos hallazgos de la fase

1. **El `PHASE.md` llegó al cierre diciendo `planning` con las tres tasks en
   `done`, y es la segunda fase seguida.** Le pasó exactamente lo mismo a la
   fase 05 el día anterior (`20923ef`), así que no es un olvido de una vez:
   **nadie mueve el `status` al arrancar la ejecución**, y el contrato afirma algo
   falso de sí mismo durante toda la fase. Lo encontró una sesión paralela en un
   ping de sólo lectura, sin que nadie lo pidiera, que es la parte que conviene
   mirar: dos fases seguidas pasaron por un cierre y por seis commits de ejecución
   sin que el archivo se leyera. Corregido en `1b980c8`, y la forma operativa está
   en la recomendación 1.
2. **La documentación del producto se revisó por el README de la demo y no por
   `docs/`.** La T-03 tenía como entregable las dos oraciones del README de la
   demo y leyó su sección línea por línea; nadie leyó los dos documentos de
   `docs/`, que son el documento de arquitectura de este producto. La línea que
   quedó vieja es una: `docs/integrating-the-library.md` decía que el volumen de
   cada elemento durante un break es *"which the asset-list declares"*, que con
   foco es la mitad de la política. **Corregida en este pase** (sección 8). Lo que
   queda abierto no es la línea, es el alcance: una fase que cambia comportamiento
   del producto tiene que mirar los documentos del producto, y el `TASKS.md` de
   esta fase nombró uno de tres.

### Lo que se queda de pie por decisión

- **La restricción futura en el asset list** —un campo que diga si el volumen de
  un elemento se puede cambiar, o si un elemento es enfocable— sigue afuera. Es
  del formato y no del renderizado, el formato está en desarrollo, y el ADR 0004
  manda consumir el asset list tal como lo emite la herramienta de SVTA. La
  pregunta ya está en la lista para SVTA del `PROJECT.md`.
- **El botón de audio no dice qué se está escuchando.** Hoy sabe mute y unmute, y
  con foco puesto "desmuteado" deja de decir qué vas a escuchar. Aceptado
  explícito: eso lo contesta el anillo sobre la caja.
- **Foco por teclado y accesibilidad.** Fuera de alcance por construcción: la capa
  de avisos es `aria-hidden` a propósito, porque la imagen es el aviso.
- **Eventos de tracking** de audio, tipo los `mute` y `unmute` de VAST 4.3. No hay
  nada que reportar en un POC sin ad server.
- **Los 0,7 s de atraso del pane de fábrica**, que la sección `Before you record`
  afirma y esta corrida **no puede confirmar ni desmentir**. La lectura del final
  da alrededor de un segundo (170,2 s contra 171,4 s) y no es una medición de eso:
  son dos líneas de estado con su propio `timeupdate`, y el costo que produce el
  número es el traspaso del MediaSource, que en un Chrome headless sobre una
  máquina compartida no cuesta lo que en la máquina donde se graba. El número es
  de la fase 04 y nada de la 06 tocó la implementación que lo produjo, así que la
  línea se queda como está.

### Uno que no es de esta fase y sigue abierto

- **Las fases 02 y 04 no tienen `DESIGN.md`**, y el validador las reporta en rojo
  desde antes de esta fase. No se silencian y no se rellenan: un `DESIGN.md`
  reconstruido desde el contrato que tenía que generar es procedencia que nunca
  existió. La decisión —tener la conversación de diseño, o aceptar el hallazgo en
  `EXCEPTIONS` con su razón escrita— es de Nicolás, y es la misma que dejó abierta
  el cierre de la fase 05.

## 5. Riesgos que se materializaron

El `PHASE.md` escribió tres. **No se materializó ninguno**, y los dos primeros
tenían mitigación de diseño que corrió tal como estaba escrita.

- **R1 — habilitar punteros en las cajas del aviso toca un invariante con razón
  escrita.** No se materializó. Los punteros se habilitaron en los nodos y no en
  la capa, así que la capa sigue con `pointerEvents: 'none'` y sigue sin
  `z-index`, y lo que recibe el press es el nodo de adentro. El invariante quedó
  con su nota en el mismo comentario que lo declara, que es lo que la mitigación
  pedía. Es la primera vez que ese comentario se toca desde que se escribió.
- **R2 — un nodo precargado invisible toma el gesto.** No se materializó, y es el
  único de los tres que se midió en lugar de razonarse: a los 129,9 s, en el borde
  entre los cuatro avisos del break 5, `ad2-box` está sobre su caja con
  `opacity: 0` y `pointer-events: none`, y un click ahí no mueve un solo nivel.
  La mitigación era de construcción —los punteros van en `place()`, que sólo
  recorre lo que está en pantalla— y la medición la confirma.
- **R3 — el anillo puede no leerse como "esto es lo que suena" en cámara.**
  Aceptado desde el diseño, y **no se midió**: no hay cámara todavía, y la corrida
  grabada no depende del foco. Lo único que sí se miró es el color, que era su
  criterio: el anillo se lee sobre un creativo oscuro y sobre uno claro.

## 6. Recomendaciones para la fase siguiente

1. **Mover el `status` del `PHASE.md` a `in-progress` en el primer commit de la
   primera task.** Dos fases seguidas llegaron al cierre con el contrato diciendo
   `planning`, y las dos veces lo encontró alguien que estaba mirando otra cosa.
   Es una línea de trabajo en la ejecución, no un chequeo nuevo.
2. **Cuando una fase cambia comportamiento del producto, la task que escribe
   documentación cubre los dos documentos de `docs/` y no sólo el README de la
   demo.** Es el hallazgo 2 en forma operativa, y es barato: son dos archivos y la
   pregunta es una, ¿esto sigue describiendo el sistema?
3. **El punto de entrada de cualquier cosa que toque el audio es `setFocus` en
   `lib/renderer.js`.** Una sola puerta mueve el índice, el anillo y la mezcla, y
   las cinco salidas pasan por ahí. Agregar una salida es llamarla; agregar un
   estado de audio afuera de ella es romper la propiedad que la fase compró.
4. **La pregunta para SVTA sobre cuál de varias fuentes concurrentes se escucha ya
   tiene una respuesta construida y mirada.** Está implementada del lado del
   renderizado y no del formato, que es lo que el ADR 0004 obliga, pero la
   conversación con SVTA puede llevarse una propuesta con comportamiento atrás en
   lugar de una pregunta abierta.

## 7. Correcciones post-ejecución

`grep -n "post-ejecuci"` sobre el `TASKS.md` de la fase devuelve **una línea**, en
la T-02, del 2026-09-09. No hay ningún `feedback-<n>.md` en la fase.

| task | qué se corrigió |
| --- | --- |
| T-02 | con algo enfocado, un toque en el primario también suelta el foco y devuelve la mezcla declarada, sin que el primario pase a ser blanco del gesto. `releaseFocus()` en `lib/renderer.js`, el parámetro homónimo en `createControls` con el mismo default seguro que `chromeUp`, y el cableado en `attach()`. Registrado en el ADR 0031 |

**Leída como medición y no como registro, dice una cosa y no dice otra.** No dice
que el `done` de la T-02 estuviera flojo: la task cumplió su definición de done
entera y el comportamiento que Nicolás pidió no estaba en el contrato de la fase
—el `PHASE.md` lo tenía en el fuera de alcance, con su razón escrita en el
ADR 0027—, así que ninguna verificación de la T-02 podía encontrarlo. **Lo que sí
dice es que un gesto se juzga usándolo.** El diseño miró esa puerta, la descartó
por una colisión real, y la colisión resultó evitable con una condición que el
diseño no consideró: la puerta angosta que sólo existe con algo enfocado. Eso no
se ve en un documento, se ve con el dedo sobre la pantalla, y por eso el pedido
llegó después de probar y no durante el diseño.

Y una diferencia con las tres de la fase 05, que vale para leer la tabla: ésas
las encontró la propia fase, con la task de verificación que se había dado para
eso. Ésta la encontró Nicolás probando, que es la única forma en que se encuentra
lo que no es un defecto contra ningún criterio escrito.

## 8. Revisión de documentación

Superficie por superficie, con el resultado por superficie.

- **El índice de fases del `PROJECT.md`.** Reescrito en este pase. La fase 06 ya
  tenía línea desde que se abrió —el cierre de la 05 encontró que el índice se
  escribía al cerrar y no al abrir, y `f652173` lo corrigió—, así que lo que este
  pase hace es cambiar la línea de la intención al resultado: qué quedó
  construido, cuál es la propiedad que compró y cuál fue su corrección.
  `last_update` pasa a 2026-09-09. **El `status` del proyecto queda en `ongoing`**:
  quedan la grabación, iOS y la especificación de SVTA.
- **El resto del `PROJECT.md`.** Sin cambios. La sección "A confirmar" no la tocó
  esta fase: su ítem sobre la mezcla del Quad sigue igual de abierto, porque lo
  que falta confirmar ahí es si David contó al programa entre *"the other ones"*
  cuando propuso el 100/10, y el foco no cambia esa mezcla declarada sino que la
  sobrescribe temporalmente. La pregunta para SVTA sobre cuál de varias fuentes
  concurrentes se escucha tampoco cambia de estado: sigue siendo del formato.
- **El `PHASE.md` de la fase.** `status: closed` y `closed: 2026-09-09`. El cuerpo
  no se toca: es el contrato y describe correctamente lo que la fase se propuso,
  incluida la sección de fuera de alcance donde el primario aparece descartado
  como blanco del gesto. El ADR 0031 no lo contradice —el primario sigue sin ser
  blanco— y de todos modos un contrato no se reescribe después de ejecutado.
- **El `TASKS.md` de la fase.** Sin cambios en este pase. Las tres tasks ya están
  en `done` con su carpeta de evidencia apuntada, y la línea `post-ejecución:` de
  la T-02 ya está escrita con el ADR que la registra.
- **`docs/arc42/`.** **No existe en este proyecto y este cierre no lo crea**, por
  la misma razón que dieron las fases 05 y 06 en su diseño: el documento de
  arquitectura del producto son los dos de `docs/`, y tienen un solo lector, quien
  construye con la sdk.
- **`docs/contrato-senalizacion-renderizado.md`.** Re-leído contra lo que la fase
  hizo, y **sigue describiendo este sistema**. La respuesta es del propio
  documento: su línea 214 dice que la política de audio no está ahí y que el
  `volume` es el **estado inicial declarado** de cada elemento, así que un
  override en tiempo de ejecución es del renderizado por definición. El contrato
  entre las dos capas no cambió, `lib/signalling.js` no se tocó, y el grep de
  `scripts/verificar-cortes.mjs` no creció.
- **`docs/integrating-the-library.md`.** **Corregido en este pase**, y es el
  hallazgo 2. La fila de la tabla de §5 que reparte qué es de la librería decía
  *"the volume of every element during a break, including the primary's, which the
  asset-list declares"*, y esa cláusula final quedó vieja el día que el foco entró:
  el asset list declara la mezcla inicial y quien mira la sobrescribe. La fila
  ahora dice las dos mitades y cita el ADR 0026. **El resto del documento no
  cambió y se chequeó por qué**: la superficie pública no se movió —`attach` y
  `attachControls` tienen los mismos parámetros que antes, y el `releaseFocus` que
  `createControls` ahora acepta lo pasa `attach` y no el integrador—, y §6 sigue
  describiendo las dos llamadas tal como son.
- **El `README.md` de la raíz.** Sin cambios, y se chequeó por qué. Su párrafo del
  audio dice que cada elemento **empieza** en el `volume` que su asset list
  declara (*"starts at"*), que es exactamente la lectura de estado inicial que el
  ADR 0026 formaliza, así que no quedó falso. Y por el reparto del ADR 0025 este
  README enruta y no describe el comportamiento del renderizado: la fase no agregó
  ni un archivo ni un punto de entrada público a los que enrutar. No tiene línea
  que apunte a `docs/arc42/` ni la puede tener, porque ese directorio no existe.
- **El `README.md` de la demo.** Es el entregable de la T-03 y no de este pase. Las
  dos oraciones entraron adentro de párrafos que ya existían, en inglés y en el
  registro del documento, y entre las dos dicen la política completa del ADR 0026:
  el estado inicial, el override mientras el aviso está en pantalla, el foco
  exclusivo con el primario callado incluido, el gesto que cuenta sólo con el cromo
  arriba, la caja de video del aviso como único blanco, y el override que muere con
  el aviso. **La corrección del ADR 0031 no agregó una tercera oración**, y es una
  decisión de este cierre y no un olvido: la segunda oración ya dice que la mezcla
  vuelve *"on a second press, or on its own when the ad leaves the screen"*, y el
  toque en el primario es un cuarto camino de salida que nadie va a necesitar en
  cámara, donde el beat es tocar el cuadrante y volver a tocarlo. Nombrarlo cuesta
  una oración en el párrafo donde vive la política y compra una salida que el guion
  no usa.
- **El `CLAUDE.md` del proyecto.** **No existe, y esta fase no lo necesita.** Todo
  lo que la fase podría haber querido escribir como convención tiene dueño: el
  reparto de quién dibuja qué está en el ADR 0030, el predicado del gesto en el
  0028, y las salidas en el 0029 y el 0031.
- **`.project/knowledge/`.** No existe y este cierre no la crea. Nada de lo que la
  fase aprendió quedó sin lugar: los hallazgos están en la sección 4, las
  decisiones en los seis ADR, y las mediciones en la evidencia de las tres tasks.
- **El `LOG.md` del proyecto.** Entrada de cierre agregada. Las seis entradas de la
  ventana de la fase quedan como están: son el registro de lo que pasó.
- **El `CLAUDE.md` y `knowledge/` del repo raíz.** **Nada que agregar, y el
  candidato se revisó.** El aprendizaje más general de la fase es el hallazgo 1
  —nadie mueve el `status` de un `PHASE.md` al arrancar la ejecución, dos fases
  seguidas—, y su lugar natural no es el repo padre sino el skill `create-project`,
  que es el dueño del ciclo de vida de una fase. **No se escribe solo**: va con su
  texto exacto a Nicolás, que corrige y aprueba, y recién ahí se edita un archivo.
  Por ahora vive en la recomendación 1 y en la sección 4.
- **El documento de install/runbook.** El proyecto no tiene `INSTALL.md`: el
  arranque es `run.sh` y las secciones de los dos README que lo explican. **Ninguna
  task agregó ni rompió un paso de setup**: no entró una dependencia, ni un
  bundler, ni una variable de entorno, y el comando de arranque no cambió de forma.
- **Las carpetas `tasks/` de la fase que cierra, marcadas como registro.** Las tres
  son evidencia y no instrucción vigente, y se leen como registro por construcción:
  los `.txt` son salidas verbatim con su fecha, los tres `.md` están escritos en
  pasado sobre lo que se corrió y lo que se midió, y las capturas llevan el break y
  el estado en el nombre. **Ninguno se reescribe**, y en particular ninguno se
  actualiza con la corrección del ADR 0031: la evidencia de la T-02 dice lo que se
  midió el día que se midió, y lo que pasó después está en el `TASKS.md`, en el
  ADR y acá.

### El gate del cierre

`validar-proyecto.py` sobre el proyecto **sale en rojo con dos hallazgos, y
ninguno es de esta fase**: `phases/02-sdk-y-controles/PHASE.md` y
`phases/04-refinamiento/PHASE.md`, las dos `phase-without-design`. Son las mismas
dos de siempre, están en la sección 4 y la decisión es de Nicolás. **La fase 06
sale limpia**, con su `DESIGN.md` en su lugar, los seis ADR con el frontmatter
válido —ids como strings, la generalización 0026 → 0014 y el supersede 0031 → 0027
completos en los dos extremos— y ningún bloque de task difiriendo una decisión a
una persona.
