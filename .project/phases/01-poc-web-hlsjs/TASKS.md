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
| T-07 | El mínimo: un cornerOverlay con la cadena completa a la vista       | done    | —    | `.project/phases/01-poc-web-hlsjs/tasks/T-07/`  |
| T-08 | Tests de la resolución del layout                                   | done    | —    | `test/layout-resolution.test.js` y `.project/phases/01-poc-web-hlsjs/tasks/T-08/` |
| T-09 | El par de compatibilidad en la página de la demo                    | done    | —    | `.project/phases/01-poc-web-hlsjs/tasks/T-09/`  |
| T-10 | El mecanismo de squeezeback                                         | done    | —    | `.project/phases/01-poc-web-hlsjs/tasks/T-10/`  |
| T-11 | El mecanismo de multiview                                           | done    | —    | `.project/phases/01-poc-web-hlsjs/tasks/T-11/`  |
| T-12 | Los cinco layouts en un recorrido grabable                          | done    | —    | `.project/phases/01-poc-web-hlsjs/tasks/T-12/`  |

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
- **Resultado:** la capa de renderizado es `js/renderer.js`; `js/app.js` la
  une al proveedor de la T-06 y `index.html` con `css/player.css` agregan la
  capa donde se dibuja y el control de audio visible. En el Chrome del sistema,
  con la página cargada y sin ningún seek, el primario reproduce y a los 20 s
  aparece el aviso solo en la esquina superior izquierda, con el área del
  player en 1280x720 y la caja del aviso en 320x180 desde 0,0. A los 32 s
  desaparece y el primario vuelve al cuadro entero. La captura a tamaño real es
  `t07-cornerOverlay-player.png`.
  **La caja dibujada coincide con la que el contrato pidió: 0,00 px de
  diferencia** en los dos elementos, midiendo el rectángulo del DOM contra la
  cuenta de los porcentajes hecha aparte del renderizador, y otros 0,00 px con
  el player en 960x540 después de un resize, que es la prueba de que la
  conversión se recalcula y no está cableada. Es el mismo cero que midió la
  T-03. En la red están las tres piezas de la cadena, las tres 200: la media
  playlist `con-daterange.m3u8` como `application/vnd.apple.mpegurl` que pide
  hls.js, el `asset-list-cornerOverlay.json` como `application/json` que pide
  la aplicación, y el contenido del aviso `/content/adB/index.m3u8` con sus
  seis segmentos, que pide la segunda instancia de hls.js. El asset-list del
  Date Range de clase Apple sigue sin pedirlo nadie. El corte entre las dos
  capas se mantiene: grep del lado del renderizado, cero hits.
  El control de audio se probó y funciona: el aviso arranca muteado, el click
  —un click real despachado por el browser— lo desmutea, el segundo lo vuelve a
  mutear, y el estado del primario no lo toca nadie en todo el recorrido. Con
  los dos en silencio la salida del sistema son 32000 muestras de silencio
  exacto y Chrome no tiene ningún stream de playback abierto; al clickear el
  control Chrome abre un stream sin mutear con el primario todavía en silencio,
  así que el sonido que aparece es el del aviso. Los dos elementos decodifican
  audio al mismo tiempo, 13,1 y 12,6 KB por segundo.
  **Lo que no se pudo medir** es el nivel de la salida mientras suena: en esta
  máquina `parec` devuelve cero bytes sobre el monitor del sink cada vez que
  algo está sonando, y se reproduce con un tono de 440 Hz sin browser de por
  medio. Es el stack de audio de la sesión, no la demo.
- **Tres cosas que el bloque no tenía previstas.** La primera es que **el
  contrato estaba incompleto**, y no en los datos sino en una capacidad: da el
  `uri` y el `mediaType`, que alcanzan para saber qué va en la caja, pero en un
  browser un `uri` de media playlist no lo reproduce el elemento de video solo.
  Se resolvió sin romper el corte, con una función que el renderizado recibe
  —`attachAsset(node, {uri, mediaType, startAt})`, que devuelve cómo
  desconectar— y que implementa `js/app.js`, el único archivo que conoce los dos
  lados. Quedó escrito en el contrato.
  La segunda es del escenario y no del código: la página arranca el primario
  muteado para que la política de autoplay deje empezar sin un click, así que si
  el operador enciende el audio del aviso sin haber desmuteado antes el primario
  con el control nativo, lo que se ve es justo lo contrario de lo que el ADR
  0010 quiere mostrar. Es una instrucción de la grabación, y le toca a la T-12.
  La tercera es una nota para la T-10: para que el orden por `zDepth` valga
  también cuando el aviso va **detrás** del primario, como en
  `squeezebackFrame`, el elemento de video y los del aviso tienen que compartir
  el contexto de apilado. El renderizador ya escribe el `z-index` de los dos en
  el mismo contexto, pero ese caso no lo ejercita ningún layout de esta task.

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
- **Resultado:** los tests son `test/layout-resolution.test.js` y corren con
  `npm test`, que es `node --test` sin una sola dependencia. **Quince tests, los
  quince verdes**, y la corrida está en `t08-corrida.txt`. Los casos salen de
  los seis payloads verbatim de la herramienta, que el test lee de
  `tasks/T-03/m3-resultados.json`, y los valores esperados son las quince cajas
  en píxeles que la misma T-03 midió sobre un área de 960x540: el test entra por
  `resolveAssetList`, que es la misma puerta que usa `js/app.js`, y compara
  contra `medidoPx` con igualdad exacta. Los cinco puntos quedaron cubiertos:
  el orden top-right-bottom-left del `viewport` con las dos cadenas reales que
  lo distinguen, el `primaryContent` ausente en los dos overlays y el `volume`
  ausente en los seis, el orden ascendente por `zDepth` con el caso de
  `squeezebackFrame` donde el aviso es el fondo, la ventana semiabierta sobre la
  duración real de 15,015 s, y la conversión de insets a píxeles.
  **Cada test se vio en rojo antes de darlo por bueno**: se rompió a mano una
  cosa por vez en `js/signalling.js` o `js/renderer.js`, se corrió la suite, se
  anotó qué test se puso rojo y se devolvió el código. Dieciocho mutaciones,
  ninguna sobrevivió, y los quince tests aparecieron en rojo por lo menos una
  vez. La tabla en las dos direcciones está en `t08-vistos-en-rojo.md` y el
  script en `t08-mutar.py`. **Ningún test destapó un defecto**: la lógica de
  producción no se tocó, y el diff de la task son los tests y esta evidencia.
- **Tres casos hubo que inventarlos, porque no hay payload real que los
  ejercite.** El que importa es **un `volume: 0` explícito**, que tiene que
  sobrevivir: la herramienta no emite el campo nunca, así que no hay dato real,
  pero es el caso donde un `||` en lugar de un `??` convertiría un aviso
  deliberadamente en silencio en uno a todo volumen, y nada en la pantalla lo
  diría. Los otros dos son un `viewport` que no trae cuatro números —el
  repliegue al cuadro entero es invisible en pantalla, así que el test también
  exige el warning, que es la única señal que le queda al operador— y un empate
  de `zDepth`, donde el orden del payload tiene que mantenerse.
- **Cuatro cosas que el bloque no decía.** La primera es que los datos de la
  T-03 no se cruzan por `id`: a la herramienta el único aviso de tres layouts le
  sale como `adOverlay1` y la T-03 lo llamó `asset1`, así que el test lleva un
  alias de dos entradas para emparejarlos, y falla a propósito si no encuentra
  el elemento medido en lugar de saltearlo.
  La segunda es que la caja en píxeles medida a 960x540 no alcanza para cubrir
  la conversión: una mutación que cablea el 960 pasa los quince elementos y
  falla sólo contra un área distinta, así que hay un test más que corre las
  mismas cajas reales de `squeezebackFrame` al doble del área. Es la conversión
  que se recalcula en cada resize, y la T-07 ya la había medido en vivo.
  La tercera es que `DEFAULT_PRIMARY` no cambia el comportamiento: con el bloque
  ausente, los defaults por campo que ya tiene `resolveElement` —`zDepth` 0,
  `volume` 100, y un `viewport` que falta y repliega al cuadro entero— dan
  exactamente lo mismo. La constante documenta el supuesto y evita el warning
  del repliegue; no lo sostiene. Para verla en rojo hay que cambiarle los
  valores, no borrarla.
  La cuarta es que los seis payloads traen `uri: ""`, que no es un `uri` sino un
  hueco para que lo llene el operador, y la capa lo convierte en `null`. El
  contrato no lo dice y el test lo fija.
- **Lo que quedó afuera a propósito:** `mediaTimeOf`, que convierte un instante
  del reloj del programa a tiempo de reproducción. No es uno de los cinco puntos
  del bloque, y no es de las que fallan en silencio: si el `START-DATE` cae en el
  segundo equivocado se ve en la pantalla, y la T-06 lo verificó en vuelo con
  una captura.

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
- **Resultado:** el cliente de mercado es `js/stock-player.js` —una instancia de
  hls.js a la que no se le pasa una sola opción, sin el proveedor de la T-06 y
  sin el renderizador de la T-07— y `js/app.js` la crea con **la misma constante
  `SRC`** que carga la instancia de la demo, que es el argumento entero. La
  página quedó en dos paneles del mismo tamaño, cada uno con su nombre de rol,
  su línea de configuración, la clase que se queda y la clase que ignora, una
  línea de estado en vivo y su propio HUD con la versión, el manager de
  interstitials y la URL que está reproduciendo.
  **El instante está atrapado en una sola captura,
  `t09-el-par-en-el-mismo-instante.png`**: a los 20,81 s del primario la
  instancia de la demo sigue en el contenido con el `cornerOverlay` encima
  —ventana 20 a 32, el aviso a 0,68 s— y la de fábrica está a 0,6 s del aviso
  lineal `AD-1-LINEAR` con el contenido fuera de la pantalla. Sin ningún seek:
  las dos arrancan de cero y cruzan el `START-DATE` reproduciendo, que es lo que
  va a pasar en la grabación.
  Lo que la T-02 midió se sostiene ahora que comparten página, y sostenido es
  literal: **las dos instancias reciben los dos Date Ranges completos**, con
  todos sus atributos y con `isInterstitial` en `true` para la clase de Apple y
  en `false` para la nuestra en las dos; la de fábrica agenda **un solo** evento,
  `AD-1-LINEAR`; y la de la demo tiene el manager de interstitials en `null`.
  **La playlist se sirvió exactamente dos veces, una por cliente** —el mismo
  `/content/primary/con-daterange.m3u8`—, y en la red están los segmentos de los
  dos avisos, `adA` para el lineal y `adB` para el concurrente. Sesenta y un
  respuestas, las sesenta y una 200, y la consola sin un solo error ni warning.
  **Las dos instancias no interfirieron en nada.** Con los tres elementos
  decodificando a la vez —el primario de la demo, el aviso encima, y el aviso
  lineal de la de fábrica— los tres avanzan al 100,0 % del reloj de pared, a 30,0
  cuadros por segundo, con **cero cuadros descartados** y sin errores de ninguna
  de las dos instancias. Es el mismo resultado de la T-01, ahora con un
  controlador de interstitials encendido en una de ellas. El corte entre capas se
  mantiene: el mismo grep de la T-06 y la T-07, cero hits del lado del
  renderizado.
- **Cuatro cosas que el bloque no tenía previstas.** La primera es que **esta
  task no agregó nada de señalización**. El bloque dice que la playlist y los dos
  asset-list de la T-02 sirven tal cual, y en realidad ya estaban servidos: el
  `EXT-X-DATERANGE` de clase Apple lo escribe `scripts/senalizar-contenido.sh`
  desde la T-06 y `signalling/asset-list-linear.json` está en el repo desde
  entonces. El argumento de compatibilidad estaba latente en la playlist hacía
  dos tasks y no había nadie en la página que lo mostrara; el diff de la T-09 es
  la página.
  La segunda corrige un renglón de la T-06 y de la T-07, que decían que **el
  asset-list del Date Range de clase Apple no lo pide nadie**. Ahora lo pide la
  instancia de fábrica, y se distingue de quién es cada pedido a simple vista: el
  de la de fábrica lleva el `?_HLS_primary_id=<uuid>` que hls.js le agrega, y el
  del concurrente, que lo pide la aplicación con `fetch`, no lleva nada. No es
  una contradicción sino la consecuencia de que el par esté en la página.
  La tercera es un segundo argumento que apareció gratis y no estaba buscado:
  cuando el aviso termina, la instancia de fábrica **vuelve al primario en el
  segundo 20,44** —donde lo había dejado, que es lo que pide su
  `X-RESUME-OFFSET=0`— mientras la de la demo va por el 32,78. El cliente de
  mercado se perdió los doce segundos de programa que reemplazó y el de la demo
  no se perdió ninguno, y eso se ve en un cuadro: en
  `t09-despues-del-aviso.png` los dos están en el contenido primario y en
  escenas distintas. Es material para la grabación y le toca a la T-12.
  La cuarta es de etiquetado y sale de la anterior: **los dos paneles no pueden
  compartir un reloj**. El `currentTime` que reporta un cliente de mercado
  mientras reemplaza es el del aviso y no el del programa, así que la línea de
  estado de la izquierda dice los segundos del aviso y la de la derecha los del
  programa. Lo que distingue un estado del otro no es el número sino de dónde
  sale: la etiqueta se arma con `interstitialsManager.playingItem`, que es la
  misma propiedad que leyó la T-02.

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
- **Resultado:** el contenido primario se achica con una transformación de CSS
  —`transform: translate() scale()` con el origen en la esquina superior
  izquierda, sobre el mismo `boxToPixels` que ya usaban los assets— y las dos
  barras del L se dibujan en el espacio liberado. En `js/renderer.js` el método
  que coloca se partió en dos, porque los dos tipos de elemento llegan a su
  caja desde lugares distintos: un nodo del aviso lo crea el renderizador y la
  caja **es** su geometría, y el primario ya está en pantalla ocupando el cuadro
  entero, así que lo que hay que hacer con él es moverlo (regla 3 del contrato,
  ADR 0001). El layout entra por datos: `signalling/asset-list-squeezebackLShape.json`
  es el payload de la herramienta de SVTA con las URIs puestas, y
  `scripts/senalizar-contenido.sh` toma ahora el layout como segundo argumento,
  con `cornerOverlay` de default para no mover lo que la T-07 y la T-09 dejaron.
  La captura a tamaño real es `t10-squeezebackLShape-player.png`: el primario en
  429x241 arriba a la izquierda, la barra vertical de 286x402 a la derecha y la
  horizontal de 715x161 abajo, que entre las dos cubren exactamente el resto del
  cuadro. `t10-el-par-con-el-squeezeback.png` es la página; ahí el player de la
  izquierda va por su propio reloj porque el único que se adelantó fue el de la
  demo, y el instante simultáneo de los dos es la evidencia de la T-09.
  **La caja dibujada coincide con la que el contrato pidió: 0,00 px de
  diferencia** en los tres elementos, con el área del player en 715x402,19 y la
  cuenta de los porcentajes hecha aparte del renderizador; y otros 0,00 px con
  el área en 435x244,69 después de un resize. Es el mismo cero de la T-03 y de
  la T-07, ahora con el primario movido por una transformación en lugar de
  redimensionado.
  **El aviso se ve sin deformarse, y el número es el del ADR 0013.** Los dos
  assets son de 1280x720, o sea 1,7778. La caja de la barra vertical es de
  0,7111 y la de la horizontal de 4,4444, que son las dos cajas más lejanas del
  aspecto del asset entre las quince que midió la T-03. Con recorte centrado
  cada barra deja afuera **el 60 % del asset**: de la vertical se ven 512 de las
  1280 columnas y de la horizontal 288 de las 720 filas, y en las dos el
  estiramiento es cero. Los 60 % y 150 % que la T-03 calculó para esas mismas
  cajas son lo que costaría llenarlas con `fill`, y no se paga.
  `t10-recorte-vs-estirado.png` muestra el mismo cuadro congelado de la barra
  vertical en los dos modos, y entre las dos imágenes cambia el 55,27 % de los
  píxeles: la constante del ADR 0013 no es decorativa.
  Todos los números de arriba salen de `t10-medicion.json`, que es la corrida de
  `t10run.py` sobre el navegador, y de `t10-pixeles.json`, que es la lectura de
  las capturas.
  El corte entre las dos capas se mantiene: el mismo grep de la T-06, la T-07 y
  la T-09, cero hits del lado del renderizado, en `t10-corte-entre-capas.txt`.
  Los 15 tests de la T-08 siguen pasando sin tocarlos. En la red está la cadena
  entera y todo responde 200: la media playlist, el asset-list del layout, y los
  dos contenidos de aviso con sus segmentos, cada uno pedido por su propia
  instancia de hls.js. Con esto la página corre cuatro elementos de
  video a la vez por primera vez —el primario, las dos barras y el player de
  fábrica— y ninguno falló, que es un dato para la T-11.
- **Cuatro cosas que aparecieron al hacerlo.** La primera es que **el detalle de
  apilado muerde de verdad, y lo que lo evita es una palabra**: `position`. Una
  transformación crea un contexto de apilado propio pero **no** posiciona el
  elemento, y `z-index` en un elemento estático se ignora, así que un primario
  achicado solamente con la transformación pierde su `zDepth`. Se midió, con la
  nota que la T-07 dejó para esta task: una experiencia sintética de
  `squeezebackFrame` —el contrato es data plana, así que se construye a mano—
  con el elemento de atrás en `zDepth` 0 pintado de magenta y el primario en
  `zDepth` 1. Con el primario posicionado el magenta ocupa el 63,85 % del
  cuadro, que es exactamente el 64 % que queda afuera de su caja, y 0 % en el
  centro: el orden se respeta (`t10-zdepth-primario-posicionado.png`). Sacándole
  el `position` y dejando la transformación, el magenta pasa al 99,73 % y el
  contenido primario **desaparece** detrás del aviso
  (`t10-zdepth-primario-estatico.png`). El renderizador escribe el `position`
  junto con el `z-index` y `css/player.css` documenta la otra mitad, que es que
  la capa de avisos no puede llevar z-index ni transformación propia: si la
  cierra, todo aviso queda encima del primario. La nota de la T-07 queda
  cerrada, y el caso que ningún layout ejercitaba ahora está medido.
  La segunda es un límite del mecanismo que el ADR 0001 no dice: **la
  transformación solo achica el primario sin deformarlo mientras su caja
  conserve la relación de aspecto del área del player.** Si no la conserva, la
  escala es distinta en cada eje y la imagen se estira ahí mismo, y el modo de
  llenado no puede salvarla, porque la transformación escala lo que
  `object-fit` ya dibujó. La nota final del ADR 0013 —que el recorte nunca le
  toca al contenido primario— es cierta en los seis payloads de la herramienta,
  pero la razón es más fuerte que lo que el ADR dice: con este mecanismo la
  política de recorte **no llega** al primario. El renderizador avisa por
  consola en vez de deformar en silencio; en los seis layouts no se dispara.
  La tercera sale de la primera: **el invariante que sostiene el orden no lo
  cubre ningún test**. Los 15 de la T-08 son lógica pura sobre la resolución del
  layout, y esto solo falla en pantalla. Hoy lo sostienen un comentario en cada
  una de las dos puntas y la medición de arriba.
  La cuarta es de assets y le toca a la T-12. La primera corrida del layout usó
  los dos avisos que quedaban libres y dio un squeezeback con las dos barras
  casi negras: el teaser de *Elephants Dream* tiene una luminancia media de 7 a
  30 sobre 255 en sus doce segundos, así que la barra no permitía ver si el
  aviso estaba deformado, que es justo lo que la task tiene que mostrar. Se
  cambió a *Caminandes* en la vertical y *Sintel* en la horizontal, y la captura
  se toma a los 9 s del aviso. Es un problema de datos y no de código, que es lo
  que el ADR 0013 anticipa, y agrega un criterio a la elección de creativos de
  la T-12: no alcanza con que el recorte no se coma nada importante, el cuadro
  también tiene que tener luz para que se lea en cámara.

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
- **Resultado:** el mecanismo entró **sin una línea de código**. El diff contra
  la T-10 son dos cosas y las dos del lado de los datos:
  `signalling/asset-list-multiView.json`, que es el payload de `multiView` de la
  herramienta de SVTA con las URIs de los tres assets puestas, y un comentario
  en `scripts/senalizar-contenido.sh`, que es donde vive el interruptor de cuál
  layout señalizar. `git diff --stat 98013a3 -- js/ css/ index.html test/` no
  devuelve nada.
  **Los cuatro cuadrantes reproducen a la vez.** La medición entra a la ventana
  **sin seek**: la página se carga y se deja llegar a los 20 s sola, así que el
  número no se apoya en un seek que calentó el buffer. Son cinco elementos de
  video y cinco instancias de hls.js en la misma pestaña, porque a los cuatro
  del layout se suma el player de fábrica del par de compatibilidad, y en 9,01 s
  de reloj de pared los cinco dan lo mismo: `rateVsWall` 0,999, 30,0 fps, 0
  cuadros descartados, 0 corruptos, `readyState` 4, ninguno pausado y ningún
  error de hls.js en consola. La tabla, en el formato de la T-01, está en
  `t11-medicion.json`; contra la corrida de cinco elementos de la T-01 —0,996 y
  4 descartados en 12 s— los números son los mismos dentro del ruido, con los
  descartados en cero.
  **La caja dibujada coincide con la que el contrato pidió: 0,00 px de
  diferencia** en los cuatro elementos, con el área del player en 715x402,19 y
  cada cuadrante en 357,5x201,09, midiendo el rectángulo del DOM contra la
  cuenta de los porcentajes hecha aparte del renderizador; y otros 0,00 px con
  el área en 435x244,69 después de un resize. Es el mismo cero de la T-03, la
  T-07 y la T-10.
  La captura a tamaño real es `t11-multiView-player.png`, tomada también sin
  ningún seek, a los 25,81 s: los cuatro cuadrantes con imagen, el primario
  arriba a la izquierda y los tres avisos en los otros tres.
  `t11-el-par-con-el-multiview.png` es el par en el **mismo instante**, sin que
  ninguno de los dos relojes se haya tocado: a la izquierda el player de fábrica
  con el aviso lineal y el rótulo "the content is off the screen", a la derecha
  los cuatro cuadrantes y "nothing was replaced".
  **En este layout la política de llenado no cuesta nada, y eso es el contraste
  con la T-10.** Las cuatro cajas son cuadrantes del área del player, así que
  conservan su relación de aspecto: 1,7778 de caja contra 1,7778 de asset, 0 %
  de recorte y 0 % de estiramiento en los cuatro. Es el otro extremo de las dos
  barras del `squeezebackLShape`, que dejaban afuera el 60 % del asset. El aviso
  del renderizador sobre la relación de aspecto del primario no se dispara, que
  es lo que el ADR 0013 anticipa para los seis payloads de la herramienta.
  En la red está la cadena entera y todo responde 200: la media playlist, el
  `asset-list-multiView.json` como `application/json` que pide la aplicación, y
  los **tres** contenidos de aviso con sus seis segmentos cada uno, cada uno
  pedido por su propia instancia de hls.js. El asset-list de clase Apple lo pide
  el player de fábrica y nadie más.
  El corte entre las dos capas se mantiene: el mismo grep de la T-06, la T-07,
  la T-09 y la T-10, cero hits del lado del renderizado y los mismos tres
  contadores, en `t11-corte-entre-capas.txt`. Los 15 tests de la T-08 siguen
  pasando sin tocarlos.
- **Del audio se pudo medir una parte, y conviene decir cuál.** Lo que sostiene
  que el audio sale del contenido primario son tres mediciones, en
  `t11-audio.json`, sobre cuatro estados:
  1. **El `muted` de cada uno de los cinco elementos.** En el estado del ADR
     0010 —el primario con audio y el aviso en silencio— los tres cuadrantes del
     aviso están en `muted: true` y el único que no lo está es el primario. Para
     un elemento de media eso no es un indicio: un elemento muteado no rinde su
     audio a la salida.
  2. **Los streams de playback que Chrome abre en el sink del sistema.** Con los
     cinco elementos muteados, cero streams y el sink en `IDLE`. En el instante
     en que algo se desmutea, Chrome abre exactamente un stream sin mutear y el
     sink pasa a `RUNNING`. Lo que ese contador **no** discrimina es cuántos
     elementos están sonando: es uno solo con tres avisos encendidos y uno solo
     con los cuatro, así que lo que separa silencio de sonido es la aparición del
     stream y no su cantidad. Es la misma lectura que dejó la T-07.
  3. **El audio decodificado por elemento.** Los cinco decodifican su propio
     audio a la vez, entre 25,7 y 26,4 kB en los dos segundos de cada captura, y
     el número no cambia según el `muted`. O sea que decodificar y escucharse son
     cosas distintas, y este número dice la primera.
  **Lo que no se pudo medir es el nivel de la salida mientras suena**, así que no
  hay una grabación del audio que respalde la frase. `parec` sobre el monitor del
  sink por defecto devolvió cero bytes en los cuatro estados, incluido el estado
  en que nada sonaba; el mismo comando desde una shell, con la página cerrada,
  devuelve 32000 muestras de silencio exacto. El instrumento anda a veces y no
  otras en esta sesión, así que no se apoya nada en él: la T-07 había leído su
  cero como "cero bytes cuando algo suena", y con esta corrida el cero también
  aparece con nada sonando. Y hay una razón más de fondo para no ir por ahí: el
  monitor del sink graba la **mezcla**, así que incluso funcionando diría que algo
  suena y no cuál de los cuatro elementos.
- **Tres cosas que aparecieron al hacerlo.** La primera es que **los tres
  mecanismos del ADR 0008 son dos caminos de código, no tres.** El ADR los
  separa por lo que hacen en pantalla, y para elegir el orden de trabajo eso fue
  lo correcto. Pero en el renderizador un multiview es un squeezeback con cuatro
  cajas: mover el contenido primario a su caja lo aprendió la T-10 y dibujar N
  assets posicionados lo sabía desde la T-07, y el tercer mecanismo no agregó
  nada. Lo que el ADR 0008 anticipa para los layouts de un mismo mecanismo —que
  agregar los que falten es trabajo de datos y no de ingeniería— vale también
  cruzando la frontera entre el mecanismo B y el C.
  La segunda es que **el control de audio del ADR 0010 es uno para todo el
  aviso, y con tres fuentes concurrentes esa pregunta se ve.** El botón enciende
  y apaga los tres cuadrantes a la vez, y con este layout aparece la pregunta de
  cuál de las tres querría escuchar quien mira. Hoy no hay dato para contestarla:
  el modelo de la herramienta tiene un `volume` por elemento y la T-03 midió que
  no lo emite en ninguno de los seis layouts, así que una mezcla por cuadrante
  sería inventada. Es exactamente el hueco que el ADR 0010 dejó anotado, y el
  multiview es el layout que lo vuelve una pregunta concreta para SVTA.
  La tercera es de assets y le toca a la T-12, y es la nota de la T-10 medida en
  serio. El barrido de `t11-luz.json` recorre la ventana de 12 s muestreando la
  luminancia de cada cuadrante: `view3` (*Caminandes*) va de 108 a 163, `view2`
  (*Sintel*) oscila entre 0 y 177, y `view4` (el teaser de *Elephants Dream*)
  **no pasa de 42,4 en ningún instante de los doce segundos**. En el mejor
  instante de la ventana, que es el que la captura usa, el 66 % de ese cuadrante
  sigue siendo casi negro (`t11-pixeles.json`). Y esta vez no hay con qué
  cambiarlo: el layout consume los tres assets de aviso del repo de una sola vez
  —la cuarta fuente es el contenido primario—, así que la salida que usó la T-10,
  que fue cambiar el asset oscuro por otro, acá no existe. El listado de SVTA que
  la T-12 va a pedir necesita al menos un asset más, y con luz.

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
- **Resultado:** el recorrido es una sola playlist con **diez `EXT-X-DATERANGE`**,
  cinco pares de la misma `START-DATE`: uno de la clase concurrente por layout y
  uno de la clase de Apple al lado, que es la forma del par de compatibilidad de
  la T-09 repetida cinco veces. Los cinco nombres del documento de
  requerimientos quedan cubiertos con el mapeo del ADR 0012:

  | break | t | asset-list | `type` del payload | nombre en el documento |
  | --- | --- | --- | --- | --- |
  | 1 | 20 s | `asset-list-cornerOverlay.json` | `cornerOverlay` | Overlay |
  | 2 | 45 s | `asset-list-squeezebackLShape.json` | `squeezebackLShape` | LBox video |
  | 3 | 70 s | `asset-list-squeezebackLShape-image.json` | `squeezebackLShape` | LBox image |
  | 4 | 95 s | `asset-list-squeezebackDoubleBox.json` | `squeezebackDoubleBox` | Side by side pullback |
  | 5 | 120 s | `asset-list-multiView.json` | `multiView` | Quad |

  **El done está en una sola corrida y sin tocar el reloj de nadie.** La página se
  carga una vez, llega sola a cada break y de cada uno sale una captura a tamaño
  real: `t12-1-cornerOverlay-player.png` y las otras cuatro, más el par en el
  mismo instante en `t12-N-...-el-par.png`. No es una promesa del script: el
  elemento de video primario lleva un contador de eventos `seeking` y la corrida
  termina con la lista **vacía**, con una sola carga de la página y sin un solo
  error de consola (`t12-sin-seek.json`). Y avanza al reloj de pared: 160,0 s de
  programa en 160,15 s de pared desde que la página quedó lista, o sea 0,999,
  que es el mismo número que midieron la T-01 y la T-11.
  **Lo único que agregó código es el asset de imagen del LBox image**, y son
  **24 líneas en dos archivos**: `isImage(mediaType)` y el nodo que se crea, un
  `<img>` o un `<video>` según esa función; `playable()`, que son los nodos del
  aviso que tienen línea de tiempo y audio, sobre los que actúan el control del
  ADR 0010 y el play/pause/seek que sigue al primario; y la rama de imagen de
  `attachAsset`, que es un `src` y nada más, sin segunda instancia del player.
  Más dos líneas en `server.mjs`, que son el `Content-Type` de un `.jpg`. Los
  cinco breaks, los cinco Date Ranges, los dos asset-list nuevos y el recorrido
  son **datos**, y no aparecen en el diff de código: es exactamente lo que
  anticipa el ADR 0008 y ahora está contado.
  **La caja dibujada coincide con la que el contrato pidió: 0,00 px de
  diferencia** en los **catorce** elementos de los cinco layouts, con el área del
  player en 715x402,19, y otros 0,00 px en los catorce con el área en 435x244,69
  después de un resize. Es el mismo cero de la T-03, la T-07, la T-10 y la T-11,
  y ahora incluye dos cajas que no son un elemento de video sino un `<img>`.
  **El llenado del ADR 0013 se aplica a una imagen igual que a un video, y el
  número es el mismo.** Las dos barras del L dejan afuera el 60 % del asset en
  los dos breaks del LBox, el de video y el de imagen: la caja no cambió y el
  tipo de asset no le importa a la política. En `cornerOverlay`, en
  `squeezebackDoubleBox` y en los cuatro cuadrantes del `multiView` el recorte es
  0 %, porque esas cajas conservan la relación de aspecto del asset.
  **El control de audio del ADR 0010 anda en cuatro de los cinco breaks**, y en
  el quinto no hay nada que encender: los dos assets del LBox image son cuadros
  fijos. El botón lo dice —`the ad on screen has no audio`, deshabilitado— en
  lugar de quedar gris como si no hubiera aviso en pantalla, que son dos estados
  distintos y en cámara se distinguen.
  **El segundo argumento de la T-09 quedó atrapado en un cuadro.** Los cinco
  breaks llevan también su Date Range lineal, así que el cliente de fábrica
  reemplaza cinco veces y vuelve al primario donde lo había dejado: a los 160 s
  de la corrida va **49,5 s de programa atrás** del nuestro, los dos en el
  contenido primario y en escenas distintas
  (`t12-el-programa-que-el-de-fabrica-se-perdio.png`, el de la izquierda en
  110,5 s y el de la derecha en 160,0). Los doce segundos por break que declara
  el tag le cuestan 12,4 s de programa, y esta medición no separa el costo de la
  transición de una detención del player de la izquierda.
  **La instrucción de grabación de la T-07 quedó donde la lee quien graba**, y no
  en una evidencia: la sección `Before you record` del `README.md` la abre, y
  `./run.sh` la imprime en cada arranque junto con la tabla de los cinco breaks.
  Lo que dice es que hay que desmutear el contenido primario con el control
  nativo **antes** de tocar el botón del aviso, porque la página arranca muteada
  por la política de autoplay y encender el audio del aviso con el primario en
  silencio muestra lo contrario de lo que el ADR 0010 quiere mostrar.
  El corte entre las dos capas se mantiene: el mismo grep de la T-06, la T-07, la
  T-09, la T-10 y la T-11, cero hits del lado del renderizado y los mismos tres
  contadores —19, 22 y 30—, en `t12-corte-entre-capas.txt`. Los 15 tests de la
  T-08 siguen pasando sin tocarlos. En la red está la cadena entera y todo
  responde 200 —207 respuestas, las 207 con 200—: la media playlist, los **cinco**
  asset-list de clase concurrente que pide la aplicación sin ningún parámetro,
  uno por break; el de clase Apple que pide el player de fábrica con su
  `?_HLS_primary_id`, que es lo que distingue de quién es cada pedido desde la
  T-09; los tres contenidos de aviso con sus segmentos, cada uno por su propia
  instancia de hls.js; y los dos `.jpg` como `image/jpeg`, que es el
  `Content-Type` que el servidor estático aprendió en esta task.
- **Los assets: cuatro layouts de cinco quedan bien y uno no, y está medido.**
  El barrido de luminancia de la T-11 se corrió sobre las tres fuentes enteras
  para elegir la ventana de doce segundos de cada creativo —la ventana cuyo
  instante más oscuro es el más claro posible, porque lo que arruina una captura
  es un instante negro adentro y no un promedio bajo—, y adentro del navegador
  sobre los cinco breaks. Sintel pasó de la ventana de la T-05, con dos cortes a
  negro y una media de 82,4, a una media de 123,1. En la corrida del recorrido el
  asset más oscuro de cada layout mide 162,7, 151,6, 135,1 y 162,7 en los cuatro
  primeros breaks, y **24,5 en el Quad**.
  **El Quad es el que se queda sin material y no hay con qué arreglarlo desde
  acá.** Consume los tres assets de aviso de una sola vez, así que la salida de
  la T-10 —cambiar el asset oscuro por otro— no existe. Y no es la ventana: en
  los 75 segundos del teaser de *Elephants Dream* no hay un solo instante que
  llegue a 46 de luminancia sobre 255, la película entera promedia 15,0 y su
  mejor ventana de doce segundos promedia 24,9. El pedido concreto, y los números
  con los que se pide, están en `t12-los-assets-que-faltan.md`: un creativo de
  video de doce segundos, 1280x720 o más, con media arriba de 100 y sin ningún
  instante por debajo de 40.
  **Y el del LBox con video, que es el que David marcó como el más difícil de
  conseguir, está cubierto recortando el 60 % de un clip de 16:9.** Lo que se ve
  es un fragmento de una película y no un creativo pensado para una caja de 0,71
  a 1, y que se vea bien es una elección de encuadre hecha a mano. Lo que falta
  ahí no es luz: es un creativo hecho para la forma de la barra, o que el modelo
  diga por asset la relación de aspecto para la que el creativo está pensado, que
  es la pregunta que el ADR 0013 ya le manda a SVTA.
- **Cinco cosas que aparecieron al hacerlo.** La primera es que **los dos LBox
  son el mismo layout hasta el MIME del asset**, y eso vuelve más filosa la
  pregunta del ADR 0012. Los dos breaks declaran el mismo `type`, los mismos tres
  elementos, los mismos `viewport` y los mismos `zDepth`: el único campo que
  difiere en todo el payload es el `type` de cada asset,
  `application/vnd.apple.mpegurl` contra `image/jpeg`. La línea del contrato que
  la página imprime debajo del player es **idéntica** en los dos, así que quien
  audite la consola no puede distinguir LBox video de LBox image más que por la
  URI. Si el documento de requerimientos quiere que sean dos layouts con nombre
  propio, hoy no hay en el payload nada que los nombre. Y el sexto identificador
  de la herramienta, `squeezebackFrame`, es el único que el recorrido no ejercita,
  porque ninguno de los cinco nombres le corresponde: sigue exactamente donde el
  ADR 0012 lo dejó.
  La segunda es que **el control de audio del ADR 0010 supone que el aviso tiene
  audio**, y uno de los cinco layouts no lo tiene. No es una contradicción del
  ADR sino un caso que no cubre: el ADR dice que la página expone un control para
  activar el audio del aviso, y con dos cuadros fijos no hay nada que activar. El
  renderizador ahora distingue "no hay aviso" de "el aviso no tiene audio", que
  es la única forma de que el botón no mienta.
  La tercera es que **elegir un creativo no es medir su luminancia.** El instante
  más claro de *Caminandes* en toda la película es su placa de agradecimientos:
  mide 180 sobre 255, es perfectamente estable, y en pantalla se lee como que el
  reproductor está mostrando los créditos de algo. Y el primer cuadro fijo de
  Sintel salió del instante más claro de la película, que cae adentro de la
  ventana de doce segundos del **video** de Sintel, así que los dos breaks del
  LBox quedaban con la misma duna en la misma barra: lo que distingue LBox video
  de LBox image es que uno se mueve y el otro no, y con la misma imagen en los dos
  eso no se ve. Los dos cuadros se terminaron eligiendo mirándolos, con el
  criterio medido como filtro y no como decisión.
  La cuarta es que **los cinco breaks lineales hacen que el par deje de ser
  comparable break a break, y ahí está justamente el argumento.** Sólo en el
  primer break los dos clientes reaccionan al mismo par de tags en el mismo
  instante; del segundo en adelante el de fábrica va atrasado y está mostrando
  otra parte del programa, o su propio aviso lineal de un break anterior —en el
  cuarto break los dos paneles tienen un aviso en pantalla, uno reemplazando y el
  otro no—. El cuadro donde los dos están en el contenido primario y en escenas
  distintas vale más que cinco cuadros donde los dos hacen lo mismo, así que la
  captura del par que importa es la de los 160 s.
  La quinta es una observación sin causa establecida, y se anota porque le toca a
  quien grabe: en uno de los seis cuadros del par, el de los 160 s, **el panel de
  fábrica muestra un artefacto de decodificación** —bloques verdes y magenta sobre
  el cuadro entero— mientras el panel de la demo dibuja el mismo contenido sin un
  defecto. Los segmentos son los mismos archivos para los dos clientes y el
  nuestro los reproduce limpios, así que el artefacto es de esa instancia y no del
  contenido; qué lo produce esta medición no lo dice. Si aparece en la grabación,
  el cuadro que se usa es otro.
- **post-ejecución:** 2026-09-04, el cierre de la fase encontró que el resultado
  dice que el cliente de fábrica "reemplaza cinco veces" y en el mismo párrafo
  cita 49,5 s de atraso, y los dos números no pueden ser ciertos a la vez. Son
  cuatro reemplazos: `t12-sin-seek.json` deja al player de fábrica en 110,54 s de
  programa al final de la corrida, antes del `START-DATE` del quinto break, y los
  49,47 s de atraso son 12,37 s por break sobre cuatro. La consecuencia es de
  grabación: el quinto aviso lineal no se ve nunca en el panel de la izquierda
  dentro del recorrido, porque con ese atraso llegaría a ese break alrededor del
  segundo 170 del reloj del nuestro y no lo terminaría antes de que el VOD de
  180 s se acabe. El `README.md` arrastra el mismo cinco y hay que corregirlo
  ahí, que es donde lo lee quien graba; queda fuera de este cierre, cuyo alcance
  era `.project/`.
- **post-ejecución:** 2026-09-04, el cierre encontró que el piso de luminancia
  que `t12-los-assets-que-faltan.md` le pide a David —"sin ningún instante por
  debajo de 40", justificado como lo que miden los otros dos— no lo cumple adA
  (*Sintel*), que en la tabla del propio archivo tiene un mínimo de 10,8 y en el
  navegador baja a 21,3 en la barra horizontal del LBox video y a 5,4 en su
  cuadrante del Quad. Del material actual sólo lo cumple adB. El pedido queda en
  pie como criterio deseado y no como el estándar que el material ya cumple. La
  nota fechada está al pie de ese archivo, sin tocar su tabla.
