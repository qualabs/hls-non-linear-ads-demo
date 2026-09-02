# Tasks, fase 01-plataforma-y-primer-draft

| id   | brief                                                             | status  | plan | evidence |
| ---- | ----------------------------------------------------------------- | ------- | ---- | -------- |
| T-01 | Cerrar el hueco de información AVFoundation contra hls.js         | pending | —    | —        |
| T-02 | Vertical slice en hls.js: clase custom del asset list + layout controller | pending | —    | —        |
| T-03 | Overlay y un L-box sobre el layout controller                      | pending | —    | —        |
| T-04 | Escribir y correr los tests de la lógica no visual del slice       | pending | —    | —        |
| T-05 | Relevar y armar el set base de assets                              | pending | —    | —        |
| T-06 | Enganchar a Emil para la parte de iOS                              | pending | —    | —        |
| T-07 | Volcar los requerimientos en el doc de David y cerrar la fecha del primer draft | pending | —    | —        |
| T-08 | Crear o confirmar el canal `#wg-hls-presentation`                  | pending | —    | —        |
| T-09 | Preparar y correr el sync del 21 de septiembre                     | pending | —    | —        |

---

## T-01 — Cerrar el hueco de información AVFoundation contra hls.js

- **Objetivo:** conseguir los detalles técnicos que sostienen la
  afirmación de que esto es bastante más fácil en AVFoundation, y con
  ellos confirmar hls.js como camino crítico o cambiarlo. Hoy la
  elección está tomada sobre una intuición contra un rumor, y es el
  único riesgo del proyecto que puede quemar dos semanas de trabajo sin
  avisar.
- **Qué tiene que cubrir:** las tres afirmaciones concretas que hay que
  poder evaluar son que existen implementaciones públicas en Swift que
  no están en hls.js, que hay algo alrededor de reemplazar una clase y
  de cómo eso funciona con el DATERANGE, y que el trabajo planificado
  en hls.js que mejoraría esto todavía no está hecho. Esa última es la
  que decide si el camino es parchear hls.js o esperar.
  Empezar por acá: el email que David mandó a Rob durante la reunión
  del 2026-09-02, con Nicolás en copia; el connector de Gmail llega al
  buzón de Qualabs. El documento de requerimientos ya trae la parte
  escrita de esto y no alcanza: dice que hls.js es la opción óptima si
  se logra limpiamente, que "Rob warned might not be suited for this yet
  but it is on their roadmap", y que David presume, sin confirmarlo, que
  se trata de definir la clase en el DATERANGE y de poder inyectar una
  custom que interopere bien. Lo que falta es el detalle de Rob. Leer también el ADR
  `.project/decisions/0001-hls-js-camino-critico.md`, que es la
  decisión que esta task puede llegar a superseder.
  Perseguir la respuesta en lugar de esperarla: David está de viaje por
  IBC hasta el 21 de septiembre y dijo que igual está disponible por
  chat.
  Restricción: esta task no cambia la plataforma por sí sola. Si la
  información contradice la elección, se escribe un ADR nuevo que
  supersede el 0001 y la decisión se toma con David.
  Sin dependencias, y **no bloquea T-02**: la decisión fue arrancar por
  hls.js igual.
- **Definición de done:** una comparación escrita de las dos
  plataformas sobre las tres afirmaciones de arriba, con la fuente de
  cada dato, y un veredicto de una línea que diga si hls.js sigue
  siendo el camino crítico. Si la información no llegó, la task queda
  `blocked` con la fecha del último seguimiento, no `done` con un
  "no hay novedades".
- **nivel de verificación:** mínimo. Todo el output es un documento que
  Nicolás y David leen antes de que algo dependa de él, y lo único que
  se decide con él es si se sigue por donde se venía.

## T-02 — Vertical slice en hls.js: clase custom del asset list + layout controller

- **Objetivo:** tener el mínimo que David nombró funcionando de verdad:
  un player hls.js que use la clase custom para cargar el asset list, y
  un layout controller que resuelva el renderizado del layout del
  interstitial. Es la pieza sobre la que se apoya todo lo demás, y es
  la que decide si la plataforma elegida aguanta.
- **Qué tiene que cubrir:** la carga del asset list por la clase custom
  y su interacción con el DATERANGE **van primero**, porque es
  exactamente donde la contra-indicación de plataforma dice que hls.js
  es peor; si eso no cierra, se sabe antes de haber construido nada
  encima. El asset list es un array y puede encadenar varios elementos
  no lineales con durations distintas, por ejemplo un overlay editorial
  de diez segundos seguido de otro distinto, así que el manejo de
  durations no puede asumir un solo elemento. Hay dos preguntas
  abiertas del diseño que el slice va a tener que resolver de alguna
  manera y conviene dejar registrada cuál eligió: qué URI se usa del
  array, la primera o la última, y qué pasa cuando las durations
  difieren.
  El namespace de la clase custom es
  `com.qualabs.hls.concurrentInterstitial`, provisorio mientras SVTA no
  publique. La clase extiende a `com.apple.hls.interstitial`, para que
  un asset list que responda un interstitial tradicional siga
  funcionando. El layout y el renderizado se resuelven contra el Layout
  Controller de SVTA (`https://www.svta.org/wp-content/nlag/v4/`), que
  trabaja con offsets porcentuales relativos al viewport, y los datos de
  layout vienen en el bloque `X-AD-CREATIVE-SIGNALING` de cada asset.
  La forma óptima del SDK es una librería que se incluya en la
  aplicación y se active si la clase está definida en el DATERANGE; si
  eso pide más scaffolding del que entra en el tiempo, queda anotado qué
  se hizo en su lugar.
  Empezar por acá: el `PHASE.md` de la fase, la sección de alcance del
  `PROJECT.md`, y el ADR 0001. El repo
  `github.com/qualabs/hls-non-linear-ads-demo` está creado, privado y
  vacío: el primer commit de código va ahí.
  Restricción: hoy la vía es parchear o modificar hls.js, no una
  implementación limpia, porque el trabajo planificado upstream no está
  hecho. Mantener el parche aislado y descriptible, porque David quiere
  poder mostrar la pestaña de red del browser durante la demo y eso
  significa que el comportamiento tiene que ser explicable en vivo.
  Sin dependencias.
- **Definición de done:** el player carga un asset list real a través de
  la clase custom, el layout controller renderiza un interstitial no
  lineal en el momento que el DATERANGE indica, y el asset list cargado
  y el DATERANGE se pueden ver en la pestaña de red del browser. Al
  menos un caso de asset list con más de un elemento y durations
  distintas se comporta como corresponde, y los valores parseados
  (URI elegida y durations) se cotejaron a mano contra el manifest.
- **nivel de verificación:** alto. La lógica de carga del asset list y
  de scheduling contra el DATERANGE corre sin nadie mirándola durante
  la reproducción, un error de durations o de qué URI se eligió no se
  ve en el código ni en una corrida corta, y la ventana donde
  aparecería es la grabación del 28 al 30 de septiembre, cuando ya no
  hay tiempo de arreglarlo. David pidió explícitamente que el software
  funcione y no que parezca funcionar.

## T-03 — Overlay y un L-box sobre el layout controller

- **Objetivo:** probar que el layout controller generaliza, y no que
  resuelve un caso. Dos layouts de naturaleza distinta alcanzan para
  eso: el overlay compone encima del video sin tocar su geometría, y el
  L-box la cambia.
- **Qué tiene que cubrir:** los dos layouts salen del layout controller
  y no de código ad-hoc por layout; si hace falta una excepción, queda
  anotada. Cubrir el estado sin ad, el estado con el ad puesto, y la
  transición entre los dos, que es donde se ve si la geometría vuelve a
  su lugar. El L-box de esta task puede ser el de imagen, que es el que
  tiene assets más accesibles; el de video es el difícil de conseguir y
  depende de T-05.
  Empezar por acá: el slice de T-02, y la lista de los cinco layouts en
  el `PROJECT.md`. Los otros tres layouts no son de esta task: su
  reparto entre el primer draft y la grabación se cierra en el sync del
  21 (T-09).
  Restricción: no reescribir el layout controller para acomodar un
  layout puntual; si un layout no entra, eso es información sobre el
  diseño y va al sync.
  Depende de T-02.
- **Definición de done:** los dos layouts se ven correctamente en el
  tamaño real en que se van a grabar, en los tres estados (sin ad, con
  ad, transición), con un screenshot por estado guardado como
  evidencia.
- **nivel de verificación:** bajo. Es interfaz: el error está en la
  pantalla y se ve mirando. La verificación principal son los
  screenshots al tamaño real de uso, no un estilo computado, y la suite
  existente corre entera una vez al final.

## T-04 — Escribir y correr los tests de la lógica no visual del slice

- **Objetivo:** dejar tests versionados que defiendan lo que ya
  funciona, para poder seguir construyendo hasta el 28 de septiembre
  sin romper el slice en silencio.
- **Qué tiene que cubrir:** la lógica no visual de T-02 y T-03. Los
  bordes que hay que cubrir explícitamente son el asset list vacío, el
  asset list con un solo elemento, el asset list con varios elementos y
  durations distintas, la duration que no coincide con la del
  DATERANGE, y el caso en que el ad break no se puede llenar (que es
  además uno de los dos problemas abiertos que David va a marcar en
  escenario, así que el test documenta qué hace hoy la demo).
  El render de los layouts no se testea unitariamente: eso es T-03 por
  screenshot.
  Empezar por acá: el código de T-02 y su definición de done.
  Depende de T-02, y de T-03 para la parte no visual de los layouts.
- **Definición de done:** los tests corren y pasan, cubren los cinco
  bordes de arriba, y una campaña de mutación acotada rompe a propósito
  cada regla de negocio que el slice tiene (elección de URI, cálculo de
  durations, momento del scheduling, break no llenable), corriendo solo
  los tests que cubren esa regla. Una mutación que queda en verde es un
  hallazgo y se arregla el test, no se declara pasada.
- **nivel de verificación:** alto. Es el artefacto del que después se
  va a depender para decir que algo no se rompió, y un test que no
  falla cuando debería falla en silencio.

## T-05 — Relevar y armar el set base de assets

- **Objetivo:** tener el material con el que se graban las demos, sin
  Big Buck Bunny, y descubrir temprano lo que no se va a conseguir.
- **Qué tiene que cubrir:** las cinco fuentes que salieron en la
  reunión: el listado de assets abiertos de SVTA que David tiene en una
  planilla propia (David quedó en compartirlo, hay que pedírselo), el
  material del IAB, los posibles assets de Apple (nadie tomó esa
  gestión), imágenes generadas con IA para los L-box, y el dataset
  público de YouTube que ya usa Nicolás, con la advertencia de que es
  contenido de usuarios y se nota.
  **Atacar primero el L-box con video**, que David marcó como el layout
  más difícil de conseguir en assets: si no hay material, se necesita
  el tiempo para buscar afuera.
  Restricción firme: **Big Buck Bunny queda descartado**, por pedido de
  Nicolás, porque su sola aparición transmite prueba de concepto.
  Preferir el material que los distribuidores de TV usan normalmente,
  que según David es visualmente atractivo.
  Sin dependencias.
- **Definición de done:** una lista de los assets elegidos por layout,
  con su procedencia y su licencia, y los que faltan nombrados como
  faltantes en lugar de reemplazados en silencio. El L-box con video
  tiene material o tiene una alternativa propuesta para llevar al sync.
- **nivel de verificación:** mínimo. Todo el output es una lista que se
  lee antes de que algo dependa de ella.

## T-06 — Enganchar a Emil para la parte de iOS

- **Objetivo:** saber si Emil está disponible y en qué ventana, para
  poder decir en el sync del 21 si iOS es alcanzable o si queda como
  stretch declarado.
- **Qué tiene que cubrir:** Nicolás dijo en la reunión que le habla
  directamente a Emil, así que la conversación no pasa por David ni por
  el equipo. Lo que hay que sacar de la charla es disponibilidad,
  ventana de tiempo, y qué le hace falta para arrancar. Llevarle el
  contexto de plataforma: la contra-indicación dice que en AVFoundation
  esto sería más fácil, y el mejor de los mundos según David es una
  implementación limpia en iOS más un parche sobre hls.js.
  La minuta no registra alcance ni fechas para Emil, así que esta task
  los produce en lugar de asumirlos.
  Sin dependencias, aunque el resultado de T-01 cambia la conversación
  si llega antes.
- **Definición de done:** está registrado si Emil entra, con qué
  ventana de tiempo, y qué necesita para arrancar. Un "no me contestó"
  también es un resultado, con la fecha del último intento.
- **nivel de verificación:** mínimo. El output es lo que se le cuenta a
  David en el sync.

## T-07 — Volcar los requerimientos en el documento de David y cerrar la fecha del primer draft

- **Objetivo:** que exista un target escrito contra el que planificar,
  que es lo que Nicolás propuso en la reunión, y resolver la única
  contradicción que queda entre las dos fuentes del proyecto.
- **Qué tiene que cubrir:** dos cosas distintas.
  La primera es volcar los requerimientos de la demo en el documento de
  David, que es el action item de la reunión: la lista de must-have y
  stretch está en el `PROJECT.md`, y David ya agregó ahí el timeline y
  las fechas.
  La segunda es la fecha del primer draft. El documento dice "First
  draft of demos Sept 1" y la minuta fija el lunes 21 de septiembre.
  Preguntárselo a David y no elegirla, porque la fase entera está
  planificada contra el 21 y la fecha del documento ya pasó. En la misma
  vuelta se puede confirmar August [?].
  Empezar por acá: la sección "Requerimientos de alto nivel" del
  `PROJECT.md`, que ya tiene volcado lo que el documento fija, y la
  sección "A confirmar".
  Restricción: el documento de David es de David y ya circuló entre la
  gente del evento. Editarlo con la Docs API por `batchUpdate` y no
  reemplazando contenido, para no romper comentarios ajenos.
  Sin dependencias.
- **Definición de done:** los requerimientos de la demo están en el
  documento de David, y la fecha del primer draft está confirmada por él
  y reflejada en el `PROJECT.md` y en el `PHASE.md`, o está escrito qué
  se preguntó y cuándo.
- **nivel de verificación:** mínimo. Es un documento que David y Nicolás
  leen antes de que algo dependa de él.

## T-08 — Crear o confirmar el canal `#wg-hls-presentation`

- **Objetivo:** tener el canal dedicado que Nicolás se comprometió a
  crear en la reunión, para que la coordinación por chat hasta el 21 de
  septiembre tenga un lugar.
- **Qué tiene que cubrir:** confirmar primero si el canal ya existe
  antes de crearlo. El nombre lo define Nicolás y no la minuta, que
  solo registra el compromiso de crear un canal dedicado. Sumar a David
  y a Emil.
  Sin dependencias.
- **Definición de done:** el canal existe, con David y Emil dentro.
- **nivel de verificación:** mínimo. Se ve abriendo Slack.

## T-09 — Preparar y correr el sync del 21 de septiembre

- **Objetivo:** llegar al sync de una hora con el estado completo de la
  demo y con las decisiones que hay que tomar ahí ya identificadas, en
  lugar de improvisarlas en la llamada. Es el hito que cierra la fase.
- **Qué tiene que cubrir:** el sync ya está agendado por David, una
  hora, a las 7:00 de su hora, el lunes 21 de septiembre, que es el día
  en que vuelve de Europa. Lo que hay que llevar resuelto o planteado:
  el estado del primer draft, el veredicto de plataforma de T-01, el
  reparto de los cinco layouts entre el primer draft y la grabación (que
  ninguna de las dos fuentes define), el estado de los assets y en particular el
  L-box con video, si iOS entra o queda como stretch, y quién hace el
  primer pase de la especificación de SVTA, que es la decisión que
  David dejó abierta entre Nicolás y Olivier.
  Si la plataforma cambió o no se pudo confirmar, esa es la
  conversación principal del sync y no un punto más de la lista.
  Depende de T-01 a T-06.
- **Definición de done:** el sync se hizo, las seis preguntas de arriba
  tienen respuesta o dueño, y lo que salió está registrado en el
  `LOG.md`. Con eso la fase puede cerrarse.
- **nivel de verificación:** mínimo. El output es lo que se acuerda con
  David y queda escrito.
