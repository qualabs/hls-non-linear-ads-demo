# Tasks — fase 01-poc-web-hlsjs

Las tres primeras tasks son mediciones, y están primero porque el diseño
de la fase pidió medir antes de comprometer un plan de construcción. La
T-04 cierra ese plan con sus resultados. De la T-05 en adelante es
construcción, ordenada como manda el ADR 0008: el mínimo es un overlay y
el orden va del riesgo conocido al desconocido.

Ese orden está alineado con la escalera de repliegue del `PHASE.md`, de
manera que cada escalón sea un punto real donde se puede parar y grabar
algo:

| Al terminar | Escalón alcanzado                                                                            |
| ----------- | -------------------------------------------------------------------------------------------- |
| T-07        | 4, el piso: el mecanismo de overlay con la cadena de señalización completa y visible en la red |
| T-10        | 3: los mecanismos de overlay y squeezeback, más el par de compatibilidad                       |
| T-11        | 2: los tres mecanismos con un layout de cada uno, más el par                                   |
| T-12        | 1: los tres mecanismos con los cinco layouts, más el par                                       |

| id   | brief                                                              | status  | plan | evidence                                       |
| ---- | ------------------------------------------------------------------ | ------- | ---- | ---------------------------------------------- |
| T-01 | Medir cuántos elementos de video con hls.js reproducen a la vez     | done    | —    | `.project/phases/01-poc-web-hlsjs/tasks/T-01/`  |
| T-02 | Medir la cadena mínima de señalización y el par de compatibilidad   | done    | —    | `.project/phases/01-poc-web-hlsjs/tasks/T-02/`  |
| T-03 | Medir el render de un layout de SVTA contra su vista previa         | done    | —    | `.project/phases/01-poc-web-hlsjs/tasks/T-03/`  |
| T-04 | Cerrar el plan de construcción con los resultados de las mediciones | done    | —    | este archivo y el ADR 0013                      |
| T-05 | El banco de la demo: repo, página y contenido servido               | done    | —    | el repo mismo y `.project/phases/01-poc-web-hlsjs/tasks/T-05/` |
| T-06 | La capa de señalización y el contrato con el renderizado            | done    | —    | `.project/phases/01-poc-web-hlsjs/tasks/T-06/`  |
| T-07 | El mínimo: un cornerOverlay con la cadena completa a la vista       | pending | —    | —                                              |
| T-08 | Tests de la resolución del layout                                   | pending | —    | —                                              |
| T-09 | El par de compatibilidad en la página de la demo                    | pending | —    | —                                              |
| T-10 | El mecanismo de squeezeback                                         | pending | —    | —                                              |
| T-11 | El mecanismo de multiview                                           | pending | —    | —                                              |
| T-12 | Los cinco layouts en un recorrido grabable                          | pending | —    | —                                              |

---

## T-01 — Medir cuántos elementos de video con hls.js reproducen a la vez

- **Objetivo:** saber si dos o más elementos `<video>`, cada uno con su
  propia instancia de hls.js, reproducen simultáneamente sin pelearse por
  decodificadores. Es la medición que decide si el mecanismo de multiview
  entra en la demo, y en menor medida también toca al overlay cuando el
  asset es video en lugar de imagen. Es la mitigación del riesgo R2 de la
  fase.
- **Qué tiene que cubrir:** contenido HLS real servido por HTTP, no
  archivos sueltos, con una instancia independiente de hls.js por
  elemento. La serie va de uno a cinco elementos, porque el multiview de
  la herramienta de SVTA son cuatro cuadrantes y el peor caso realista es
  el primario más cuatro. **La corrida de un solo elemento no es
  opcional: es el control** contra el que se leen las demás, y sin él un
  número bajo no distingue entre un problema de concurrencia y un
  problema del entorno de medición. Por cada elemento hay que registrar
  cuánto avanzó su `currentTime` contra el reloj de pared, cuántos
  cuadros decodificó y cuántos descartó, y cualquier error de hls.js.
  Punto de partida: la skill `playwright`, que corre el Chrome real del
  sistema; el ADR 0008, que explica por qué el multiview va último; y el
  ADR 0011, cuya propuesta a David depende de este resultado.
  Restricción: la medición no toca el repositorio de la demo, todo el
  banco de pruebas vive en un directorio temporal. Sin dependencias.
- **Definición de done:** existe, guardada como evidencia, una tabla con
  una fila por cantidad de elementos que dice, para cada uno, la tasa de
  avance contra el reloj de pared y los cuadros decodificados y
  descartados, más una captura de pantalla que muestra los elementos
  pintando a la vez. Con eso se puede contestar sí o no a la pregunta de
  si el multiview entra.
- **nivel de verificación:** mínimo. Es una medición cuyo resultado
  entero lo lee una persona antes de que nada dependa de él, y lo único
  que decide es si se sigue por ese camino.

## T-02 — Medir la cadena mínima de señalización y el par de compatibilidad

- **Objetivo:** confirmar en ejecución los hallazgos que hasta ahora son
  lectura del código de hls.js, y validar completo el par de
  compatibilidad del ADR 0007. Son tres cosas: que hls.js no convierte
  nuestra clase en un interstitial, que igual le entrega el tag entero a
  la aplicación, y que el controlador de interstitials se puede apagar
  por configuración.
- **Qué tiene que cubrir:** una media playlist con los dos
  `EXT-X-DATERANGE` en el mismo `START-DATE`, uno de clase
  `com.apple.hls.interstitial` y otro de clase
  `com.qualabs.hls.concurrentInterstitial`, cada uno con su propio `ID` y
  su propio `X-ASSET-LIST`, sobre un VOD que tenga `EXT-X-PROGRAM-DATE-TIME`.
  En la misma página, dos instancias de hls.js sobre esa playlist: una de
  fábrica y otra con el controlador de interstitials apagado. Hay que
  registrar qué ve cada una en `details.dateRanges`, qué agenda de
  interstitials arma cada una, cuál pide cada asset-list, y qué está
  reproduciendo cada una cuando llega el `START-DATE`. Punto de partida:
  los ADR 0002, 0005 y 0007. Restricción: hls.js entra sin modificar, en
  la versión 1.7.2, que es contra la que se leyó el código. Sin
  dependencias.
- **Definición de done:** un registro de eventos guardado como evidencia
  donde se lee que la instancia de fábrica agenda solamente el aviso
  lineal, que las dos instancias reciben los dos Date Ranges con todos
  sus atributos, que la instancia de la demo no tiene manager de
  interstitials, y una captura donde la de fábrica está reproduciendo el
  aviso lineal mientras la de la demo sigue en el contenido primario.
- **nivel de verificación:** mínimo. Es una corrida que confirma o
  desmiente una lectura de código, y su salida entera la lee una persona.

## T-03 — Medir el render de un layout de SVTA contra su vista previa

- **Objetivo:** ver si el modelo de porcentajes de inset alcanza para
  renderizar los layouts, o si falta información que el POC va a tener
  que inventar. Es la medición que le pone piso al trabajo de
  renderizado, que es el grueso de la fase.
- **Qué tiene que cubrir:** los seis tipos que emite la herramienta de
  SVTA, no uno solo, porque cada uno produce cajas de proporciones
  distintas. Para cada uno hay que comparar la caja que el modelo
  describe contra la caja que el navegador dibuja, en píxeles, y contra
  la vista previa de la propia herramienta. Hay que mirar en particular
  qué pasa cuando la relación de aspecto de la caja no coincide con la
  del asset, que es la pregunta que el modelo de datos no contesta.
  Punto de partida: la herramienta en `https://www.svta.org/wp-content/nlag/v4/`
  y los ADR 0001 y 0004. Restricción: el asset-list se consume como la
  herramienta lo emite, así que todo lo que no se pueda renderizar es un
  hueco para reportarle a SVTA y no un formato para cambiar por nuestra
  cuenta. Sin dependencias.
- **Definición de done:** una tabla, guardada como evidencia, con la
  diferencia en píxeles entre la caja esperada y la dibujada para cada
  elemento de cada uno de los seis tipos, más las capturas de nuestro
  render y de la vista previa de la herramienta, y la lista escrita de lo
  que el modelo no dice.
- **nivel de verificación:** mínimo. Es una exploración que decide cómo
  se encara el renderizado, y su resultado lo lee una persona antes de
  que se escriba una línea del renderizador.

## T-04 — Cerrar el plan de construcción con los resultados de las mediciones

- **Objetivo:** convertir los tres resultados en el plan de tareas de
  construcción de la fase, que hasta ese momento no existe a propósito.
- **Qué tiene que cubrir:** los tres resultados ya están medidos y son
  estos.

  De la T-01: hasta cinco elementos de video de 1280x720 a 30 fps, cada
  uno con su instancia de hls.js, reproducen a la vez en el Chrome del
  sistema al 99,6 por ciento del reloj de pared, con unos 29,8 cuadros
  por segundo cada uno y menos del 2 por ciento de cuadros descartados,
  sin errores. El multiview no está bloqueado por concurrencia de
  decodificadores en esta máquina.

  De la T-02: la instancia de fábrica agenda solamente el aviso lineal e
  ignora la clase concurrente, las dos instancias reciben los dos Date
  Ranges completos, y la instancia con el controlador apagado sigue
  reproduciendo el primario mientras la de fábrica reproduce el aviso.
  Los tres hallazgos y el par de compatibilidad quedaron confirmados en
  ejecución.

  De la T-03: la geometría cierra exacta, con cero píxeles de diferencia
  entre la caja del modelo y la que dibuja el navegador en los quince
  elementos de los seis tipos. Lo que el modelo no dice es cómo llena un
  asset una caja cuya relación de aspecto no es la suya, y eso pasa en
  tres de esos quince elementos. Dos detalles más del formato real que
  emite la herramienta: omite el bloque `primaryContent` cuando está en
  sus valores por defecto, y omite `volume` cuando vale 100, así que el
  renderizador tiene que asumir esos defaults en lugar de exigir los
  campos.

  El plan que salga de acá respeta el orden del ADR 0008 y la escalera de
  repliegue del `PHASE.md`, incluye las tasks de tests que corresponden a
  lo que se construya, y decide la política de llenado que la T-03 dejó
  abierta. Punto de partida: el `PHASE.md`, los ADR de `decisions/` y las
  carpetas `tasks/T-01`, `tasks/T-02` y `tasks/T-03`. Restricción: no se
  escriben tasks de construcción antes de que Nicolás lea estos tres
  resultados. Depende de T-01, T-02 y T-03.
- **Definición de done:** este archivo tiene las tasks de construcción de
  la fase, cada una con su bloque y su nivel de verificación, y la
  política de llenado quedó decidida o registrada como pregunta para
  SVTA.
- **nivel de verificación:** mínimo. Es trabajo de planificación que
  Nicolás lee entero antes de que se ejecute nada.

## T-05 — El banco de la demo: repo, página y contenido servido

- **Objetivo:** tener el repositorio con una página que reproduce el VOD
  primario con hls.js sin modificar, y el contenido servido por HTTP. Es
  la base sobre la que corre todo lo demás y no demuestra nada por sí
  sola.
- **Qué tiene que cubrir:** el repositorio `qualabs/hls-non-linear-ads-demo`,
  que existe vacío. Sin bundler y sin framework; el esqueleto reusable es
  `projects/aws-multiview/demo-ibc/`, que ya es un player web sobre
  hls.js sin modificar y con una capa de UI encima del elemento de video.
  hls.js entra en la versión 1.7.2 y sin tocar, y la instancia de la demo
  arranca con `interstitialsController` vacío (ADR 0002). El contenido
  primario es un VOD empaquetado en HLS con al menos un
  `EXT-X-PROGRAM-DATE-TIME`, que es lo que `START-DATE` necesita para
  resolverse (ADR 0005); el empaquetado con ffmpeg ya está resuelto en
  `tasks/T-01/empaquetar-contenido.sh` y se reusa. Van también dos o tres
  assets de aviso cortos, empaquetados igual, y un servidor de archivos
  estáticos: no hay ad server ni APS (ADR 0005). Big Buck Bunny está
  descartado por pedido de Nicolás. Sin dependencias.
- **Definición de done:** con el repo clonado, un comando levanta el
  servidor y la página reproduce el VOD primario en Chrome, con la
  playlist y los segmentos visibles en la pestaña de red. Todavía no hay
  ningún layout.
- **nivel de verificación:** mínimo. No tiene lógica propia y su único
  resultado es que el video se ve, cosa que se sabe en el primer segundo.
- **Resultado:** el banco está en la raíz de este repo, al lado de
  `.project/`. `./run.sh` (o `npm start`) empaqueta el contenido si no
  está y sirve `http://localhost:8080/`. Verificado en el Chrome del
  sistema: hls.js 1.7.2, `interstitialsManager` en `null`, el primario
  reproduciendo a 1280x720 desde el segundo 20 de 180, y en la red la
  media playlist más 26 segmentos servidos, todos desde el servidor de
  archivos estáticos. El criterio se verificó también como lo dice: clon
  limpio del repo, un comando, y el primario reproduciendo. Evidencia en
  `tasks/T-05/`.
- **Dos cosas que el bloque daba por resueltas y no lo estaban.** El
  esqueleto de `demo-ibc` trae hls.js **1.7.0**, no la 1.7.2 que pide el
  ADR 0002, así que la vendorizada salió del tarball de npm de 1.7.2. Y
  `tasks/T-01/empaquetar-contenido.sh` no se pudo reusar tal cual: su
  entrada son cinco fuentes sintéticas de `testsrc2`, porque lo que la
  T-01 medía era cuántos decodificadores aguanta el browser y la imagen
  no importaba. Lo que se reusó verbatim es la invocación de ffmpeg
  —1280x720 a 30 fps, H.264 más AAC, segmentos de 2 s,
  `program_date_time+independent_segments`—; lo que cambió es que la
  entrada ahora es un archivo real.

## T-06 — La capa de señalización y el contrato con el renderizado

- **Objetivo:** implementar la capa que, para un tiempo de reproducción
  dado, entrega la lista de experiencias concurrentes activas con su
  layout resuelto, y dejar escrito el contrato que la capa de renderizado
  consume. Es el corte en dos capas del ADR 0003, y es lo que hace que
  cambiar de transporte más adelante sea reemplazar una capa y no
  reescribir la demo.
- **Qué tiene que cubrir:** suscribirse a `LEVEL_UPDATED`, leer
  `details.dateRanges`, quedarse con los de clase
  `com.qualabs.hls.concurrentInterstitial`, pedir su `X-ASSET-LIST` desde
  la aplicación, y resolver el bloque `X-AD-CREATIVE-SIGNALING` a la
  forma que el renderizado consume. La resolución tiene que parsear
  `viewport` como cuatro porcentajes de inset en el orden top, right,
  bottom, left; **asumir los dos defaults que la herramienta omite**, que
  son el bloque `primaryContent` entero cuando no viene y `volume` 100
  cuando falta, en lugar de exigir esos campos; ordenar los elementos por
  `zDepth`; y decidir qué está activo en cada momento con el `start` y la
  `duration` del payload contra el `START-DATE` del Date Range. El
  contrato es la única superficie entre las dos capas: del lado del
  renderizado no se importa hls.js ni se lee nada de HLS, que es la
  disciplina que el ADR 0003 marca como su costo. El camino entero ya
  corrió en la T-02 y su registro de eventos sirve de guía. Restricción:
  hls.js entra sin modificar. Depende de T-05.
- **Definición de done:** con la playlist de la T-02 servida, la consola
  muestra la experiencia concurrente activa con sus cajas y su orden en
  el momento correcto, y el contrato queda escrito en una página, que
  entra como evidencia de esta task tal como lo pide el `PHASE.md`.
- **nivel de verificación:** bajo. La parte que no se ve, que son los
  defaults omitidos y la ventana de activación, es la que puede fallar en
  silencio, y los tests que le corresponden son los de la T-08.
- **Resultado:** la capa de señalización es `js/signalling.js` y el
  contrato quedó escrito en `tasks/T-06/t06-contrato.md`. El consumidor
  del contrato es `js/contract-trace.js`, que hasta que llegue el
  renderizador de la T-07 imprime en consola en lugar de dibujar;
  `js/app.js` es el único archivo que conoce los dos lados, porque es el
  que los une. Verificado en el Chrome del sistema con el servidor de la
  demo: hls.js 1.7.2, `interstitialsManager` en `null`, los dos Date
  Ranges en la playlist con el mismo `START-DATE`, el concurrente
  resuelto a `t=20.00s` y su ventana de 20 a 32. La consola lo anuncia a
  los `20.07s` con las dos cajas ordenadas por `zDepth` —el primario en
  z0 y `adOverlay1` en z1 con la caja `0 75 75 0`— y a los `32.02s` dice
  que no hay nada activo. De la cadena, la playlist la pide hls.js por
  XHR y el asset-list lo pide la aplicación por `fetch`, que es la misma
  conclusión de la T-02 vista desde otro ángulo; el asset-list del Date
  Range de clase Apple no lo pide nadie. El corte entre las dos capas se
  verificó con grep: cero menciones al transporte del lado del
  renderizado, las 19 del lado de la señalización.
- **Dos cosas que el bloque no tenía previstas.** La playlist señalizada
  **no puede ser un archivo en git**: el `START-DATE` se resuelve contra
  el `EXT-X-PROGRAM-DATE-TIME` que escribe el empaquetado, y ese reloj es
  la hora de pared de cuando se empaquetó, así que un `START-DATE` fijo
  apunta al pasado en el próximo clon. Se resolvió con
  `scripts/senalizar-contenido.sh`, que la genera desde la playlist del
  primario, y con un paso en `run.sh` que la reescribe en cada arranque.
  La segunda: esta task se lleva puestas dos piezas que el bloque de la
  T-07 enumera —el `EXT-X-DATERANGE` de clase propia en la playlist y el
  asset-list servido al lado, en `signalling/`— porque sin ellas el done
  de la T-06 no se puede cumplir. Lo que queda para la T-07 es dibujar.
- **Un cruce entre el default omitido y el ADR 0010.** La herramienta no
  emite `volume` en ninguno de los seis layouts, así que el default que
  la capa asume es 100 en todos los elementos, aviso incluido. El ADR
  0010 dice que el `volume` del layout "se lee y se respeta como estado
  inicial del control", y con este default eso significaría un aviso a
  todo volumen. Manda la otra mitad del mismo ADR, que es la decisión: el
  aviso arranca en silencio. Está anotado en el contrato y le toca a la
  T-07 implementarlo.

## T-07 — El mínimo: un cornerOverlay con la cadena completa a la vista

- **Objetivo:** poner en pantalla la primera experiencia concurrente y
  con eso dejar parado el escalón 4 de la escalera de repliegue, que es
  el piso de la fase. Es el mínimo que fija el ADR 0008: si esto anda, la
  cadena entera anda y lo que falta es más de lo mismo.
- **Qué tiene que cubrir:** la capa de renderizado, que toma el contrato
  de la T-06 y dibuja: convierte los insets porcentuales a la caja en
  píxeles sobre el área del player, ordena por `zDepth`, y dibuja cada
  asset como un elemento posicionado encima del video primario (ADR
  0001). Cada caja se llena con la política del ADR 0013. El aviso
  arranca en silencio, el contenido primario conserva su audio, y la
  página expone un control visible para activar el audio del aviso: es el
  ADR 0010, y entra acá porque esta es la primera task que pone un aviso
  en pantalla. El layout es `cornerOverlay`, con su `EXT-X-DATERANGE` de
  clase propia en la playlist y su asset-list servido al lado. Depende de
  T-06.
- **Definición de done:** el navegador muestra el VOD primario con el
  aviso en la esquina, y la pestaña de red muestra las tres piezas de la
  cadena: la media playlist con el tag, el asset-list JSON y el contenido
  del aviso. Hay una captura a tamaño real y el control de audio del
  aviso funciona.
- **nivel de verificación:** bajo. Es interfaz: el error está en la
  pantalla y la verificación principal es mirar la captura.

## T-08 — Tests de la resolución del layout

- **Objetivo:** que un cambio hecho para un layout no rompa otro sin que
  nadie se entere. Es lo único de la fase que puede fallar en silencio,
  porque todo lo demás se ve en la pantalla y los layouts se miran de a
  uno.
- **Qué tiene que cubrir:** las funciones puras de las dos capas y nada
  más: el parseo de `viewport`, los dos defaults que la herramienta
  omite, el orden por `zDepth`, la ventana de activación, y la conversión
  de insets a caja en píxeles. Los casos salen de los seis payloads que
  la herramienta emite, que están verbatim en
  `tasks/T-03/m3-resultados.json` bajo `herramienta`, y los valores
  esperados son las cajas que la misma T-03 midió. Restricción, y es la
  que define el tamaño de esta task: no hay tests de DOM, ni de browser,
  ni comparación de imágenes, ni cobertura como objetivo. Depende de
  T-07.
- **Definición de done:** un comando corre los tests y pasan, con los
  seis tipos de la herramienta cubiertos.
- **nivel de verificación:** mínimo. La salida entera es una corrida que
  una persona mira.

## T-09 — El par de compatibilidad en la página de la demo

- **Objetivo:** mostrar en la misma página que esto se despliega sin
  romperle nada a los clientes que ya están en el mercado, que es el
  argumento más fuerte que la demo puede hacer (ADR 0007).
- **Qué tiene que cubrir:** la misma media playlist con los dos
  `EXT-X-DATERANGE` en el mismo `START-DATE`, cada uno con su propio `ID`
  y su propio asset-list: uno de clase `com.apple.hls.interstitial` con
  el aviso lineal y otro de clase concurrente con la experiencia. En la
  página, al lado del cliente de la demo, una instancia de hls.js de
  fábrica que reproduce el aviso lineal. La playlist y los dos asset-list
  de la T-02 sirven tal cual, y el comportamiento de las dos instancias
  ya quedó confirmado ahí; lo que falta es que convivan en la página de
  la demo y se vean juntas y etiquetadas, para que en cámara se entienda
  cuál es cuál. Depende de T-07.
- **Definición de done:** una captura de la página donde, en el mismo
  instante, la instancia de fábrica está reproduciendo el aviso lineal y
  la de la demo sigue en el contenido primario con la experiencia
  concurrente encima.
- **nivel de verificación:** bajo. Es interfaz, y lo que podía fallar por
  debajo ya lo confirmó la T-02.

## T-10 — El mecanismo de squeezeback

- **Objetivo:** cubrir el segundo de los tres mecanismos de render y con
  eso dejar parado el escalón 3 de la escalera. Es el mecanismo que
  además mueve el contenido primario.
- **Qué tiene que cubrir:** achicar el elemento de video primario a la
  caja que declara su `primaryContent`, con una transformación de CSS, y
  dibujar los assets en el espacio liberado (ADR 0001). El layout es
  `squeezebackLShape`, por dos razones: es el que el documento de
  requerimientos nombra dos veces, como LBox video y LBox image (ADR
  0012), y es el que pone a prueba la política de llenado del ADR 0013,
  porque sus dos barras son las cajas más alejadas de la relación de
  aspecto del asset entre las que midió la T-03. La geometría esperada de
  sus tres elementos está en `tasks/T-03/m3-resultados.json`. Depende de
  T-07.
- **Definición de done:** el navegador muestra el contenido primario
  achicado con las dos barras del L ocupando el resto, con captura a
  tamaño real, y el aviso se ve sin deformarse.
- **nivel de verificación:** bajo. Es interfaz y el error está en la
  pantalla.

## T-11 — El mecanismo de multiview

- **Objetivo:** cubrir el tercer mecanismo y con eso dejar parado el
  escalón 2 de la escalera, que son los tres mecanismos andando con un
  layout de cada uno más el par de compatibilidad. Va último porque es el
  único que depende de una capacidad que hubo que medir (ADR 0008).
- **Qué tiene que cubrir:** el layout `multiView`, con el contenido
  primario en un cuadrante y tres fuentes más en los otros tres, cada una
  en su propio elemento de video con su propia instancia de hls.js, que
  es exactamente la configuración que la T-01 midió. El primario conserva
  su audio y las otras tres arrancan en silencio (ADR 0010). Restricción:
  nada de detección de capacidad de decodificación concurrente, que el
  `PROJECT.md` deja expresamente fuera de alcance; si en la máquina de la
  grabación no anduviera, la salida es la escalera de repliegue y no un
  mecanismo de detección. Depende de T-07.
- **Definición de done:** los cuatro cuadrantes reproducen a la vez en
  Chrome, con captura a tamaño real, y el audio sale solamente del
  contenido primario.
- **nivel de verificación:** bajo. Es interfaz, y la concurrencia que
  podía bloquearlo ya la midió la T-01.

## T-12 — Los cinco layouts en un recorrido grabable

- **Objetivo:** dejar parado el escalón 1 de la escalera, que es el que
  se graba: los cinco layouts del documento de requerimientos, en un VOD
  que los recorra uno tras otro. Es trabajo de datos y de assets más que
  de ingeniería, que es lo que el ADR 0008 anticipa que va a pasar una
  vez que los tres mecanismos anden.
- **Qué tiene que cubrir:** un VOD con un break por layout, cada uno con
  su `EXT-X-DATERANGE` y su asset-list, cubriendo los cinco nombres del
  documento de requerimientos con el mapeo propuesto en el ADR 0012:
  Overlay, LBox video, LBox image, Side by side pullback y Quad. Lo único
  que agrega código es el asset de imagen del LBox image, que se dibuja
  como un `<img>` en lugar de un `<video>` según el `type` del asset. Los
  assets salen del listado de assets abiertos de SVTA que David quedó en
  compartir; el del LBox con video es el que David marcó como el más
  difícil de conseguir, así que se busca primero. Depende de T-10 y T-11.
- **Definición de done:** una sola corrida del VOD, de punta a punta,
  donde aparecen los cinco layouts, con una captura de cada uno.
- **nivel de verificación:** bajo. Es interfaz y datos, y el error está
  en la pantalla.
