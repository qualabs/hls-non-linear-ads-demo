# Tasks — fase 03-breaks-multiples-y-repliegue

**La primera task es una medición**, como la T-01 de la fase 01, y por la
misma razón: el aviso lineal en el medio del break es lo único que queda en el
proyecto capaz de reabrir un ADR de la fase 01, y saberlo antes del sync del
21 de septiembre vale más que saberlo después.

**Las tasks de la T-03 en adelante están escritas contra lo que hoy se sabe, y
la T-02 las puede reescribir con la medición en la mano.** Es exactamente lo
que la T-04 de la fase 01 hizo con las tres mediciones que la precedieron.

| id   | brief                                                            | status  | plan | evidence |
| ---- | ---------------------------------------------------------------- | ------- | ---- | -------- |
| T-01 | Medir el break con varios avisos, mezclando concurrente y lineal   | planned | —    | —        |
| T-02 | Cerrar el plan de construcción con el resultado de la medición     | planned | —    | —        |
| T-03 | Un break con varios avisos concurrentes, uno detrás del otro       | planned | —    | —        |
| T-04 | El aviso lineal en el medio del break                              | planned | —    | —        |
| T-05 | El repliegue del lado del cliente                                  | planned | —    | —        |
| T-06 | El `decoderCount`, de la configuración al pedido del asset-list    | planned | —    | —        |
| T-07 | Tests: la secuencia del break y el repliegue                       | planned | —    | —        |
| T-08 | El break mezclado adentro del recorrido grabable                   | planned | —    | —        |

---

## T-01 — Medir el break con varios avisos, mezclando concurrente y lineal

- **Objetivo:** saber qué cuesta un break con varios avisos antes de
  comprometer un plan de construcción, y en particular si el aviso lineal en
  el medio obliga a tocar el contrato o el ADR 0002. Es la mitigación del
  riesgo R1 de la fase.
- **Qué tiene que cubrir:** un asset-list con varios `ASSETS` sobre el banco
  que ya existe, servido igual que los de hoy, y la lectura de qué hace la
  capa de señalización con él **sin tocarla**. Tres cosas hay que medir y no
  suponer:

  1. **Qué pasa hoy con varios `ASSETS`.** `resolveAssetList` los itera y
     resuelve cada item del payload en `slotStart + item.start`, sin acumular
     la duración de cada asset, así que la lectura del código dice que tres
     avisos saldrían los tres a la vez y superpuestos. El contrato ya nombra
     el supuesto —el `start` se lee desde el `START-DATE` de la señalización y
     no desde el comienzo de cada `ASSET`— y esta es la corrida que lo separa.
  2. **Qué necesita un aviso lineal en el medio del break.** Pausar el
     primario, ocupar el cuadro entero y volver. Hay que registrar qué le pasa
     al elemento primario, a los avisos concurrentes del mismo break si los
     hay, y al reloj: cuánto avanza el programa contra el reloj de pared
     mientras el lineal está en pantalla, que es la medición que dice si el
     largo que la barra lee cambia.
  3. **Si volver a encender la maquinaria de hls.js es o no una salida.** La
     lectura del código dice que no: el aviso lineal de este caso no es un
     Date Range sino un `ASSET` adentro de nuestro asset-list, y el
     controlador de interstitials arma su agenda desde los Date Ranges de
     clase Apple y pide sus asset-list por su cuenta; encenderlo no
     reproduciría este aviso y sí volvería a nuestro player un cliente de
     fábrica. Confirmarlo o desmentirlo en ejecución es barato y evita
     planificar sobre una lectura.

  Punto de partida: `js/signalling.js`, el contrato en `docs/`, los ADR 0002,
  0003 y 0007, y la evidencia de la T-02 de la fase 01, que es la corrida que
  midió el par de compatibilidad. Restricción: **la medición no cambia el
  comportamiento de la demo**; lo que haga falta escribir vive en un
  directorio temporal o detrás de un asset-list que el recorrido no usa. Sin
  dependencias.
- **Definición de done:** existe, guardado como evidencia, un registro que
  dice para cada uno de los tres puntos qué pasó, con la corrida que lo
  muestra. Con eso se puede contestar si el aviso lineal obliga a una noción
  de primario pausado en el contrato, si toca el ADR 0002, y qué forma tiene
  la secuencia de un break con varios avisos.
- **nivel de verificación:** mínimo. Es una medición cuyo resultado entero lo
  lee una persona antes de que nada dependa de él, y lo único que decide es
  cómo se encara la fase.

## T-02 — Cerrar el plan de construcción con el resultado de la medición

- **Objetivo:** convertir el resultado de la T-01 en el plan de tasks de
  construcción, que hasta ese momento es provisional a propósito.
- **Qué tiene que cubrir:** revisar las tasks T-03 a T-08 de este archivo
  contra lo que la medición dijo, y reescribirlas si hace falta. Si la
  medición obliga a cambiar una decisión de la fase 01, **se escribe el ADR
  que la supersede y no se edita la vieja**: los ADR son inmutables después de
  `accepted` y el 0010 ya tiene el precedente. Si obliga a ampliar el
  contrato, el cambio es una versión del documento en `docs/` y hay que decir
  qué promete la noción nueva y qué no. Punto de partida: la evidencia de la
  T-01 y el `PHASE.md`. Restricción: **no se escriben tasks de construcción
  nuevas antes de que Nicolás lea el resultado de la medición.** Depende de
  T-01.
- **Definición de done:** este archivo tiene las tasks de construcción de la
  fase, cada una con su bloque y su nivel de verificación, y las decisiones
  que la medición haya forzado están escritas como ADR.
- **nivel de verificación:** mínimo. Es trabajo de planificación que Nicolás
  lee entero antes de que se ejecute nada.

## T-03 — Un break con varios avisos concurrentes, uno detrás del otro

- **Objetivo:** que un break pueda traer más de un aviso y que salgan en
  secuencia y no encimados. Es la mitad barata de lo que pidió David, y es la
  que no toca ninguna decisión de la fase 01.
- **Qué tiene que cubrir:** la secuencia adentro del break: cada `ASSET`
  arranca donde termina el anterior, y de qué dato sale ese desplazamiento es
  la decisión que hay que tomar y escribir —la `DURATION` de nivel superior de
  cada asset, o la `duration` del item del payload, que hoy coinciden en todos
  los asset-list de la demo y no tienen por qué coincidir siempre—. Los
  asset-list de datos, no de código: el ADR 0008 predijo que agregar casos es
  trabajo de datos y la fase 01 lo midió en líneas. Punto de partida: la T-01,
  `js/signalling.js`, `signalling/` y el contrato. Restricción: el corte del
  ADR 0003 sigue verificado por grep, y el recorrido de los cinco breaks que
  hoy se graba tiene que seguir corriendo igual. Depende de T-02.
- **Definición de done:** un break con tres avisos concurrentes corre entero,
  con una captura por aviso a tamaño real donde se ve que sale uno por vez y
  en el orden del asset-list, y la barra de la fase 02 marcando el break una
  sola vez.
- **nivel de verificación:** bajo. Es interfaz y el error está en la pantalla;
  la aritmética de la secuencia la cubren los tests de la T-07.

## T-04 — El aviso lineal en el medio del break

- **Objetivo:** que un break pueda mezclar concurrente y lineal, que es lo que
  David marcó como lo más importante del día. Es la task con riesgo de la
  fase.
- **Qué tiene que cubrir:** el reemplazo, hecho por el SDK: pausar el
  contenido primario, ocupar el cuadro entero con el asset, y volver donde el
  primario se quedó. El `attachAsset` de la librería ya sabe poner un `uri` en
  un nodo, así que lo que falta no es reproducción sino **la noción que el
  contrato no tiene**: un contenido primario pausado. Las dos formas que hay
  que evaluar con la medición en la mano son que la experiencia no traiga
  elemento primario y el renderizado sepa qué significa su ausencia, o que lo
  traiga con un estado nuevo; la que se elija se escribe en el contrato de
  `docs/` con lo que promete y lo que no.

  Dos cosas que no se pueden perder por el camino, y las dos son argumentos de
  la demo y no detalles: **el par de compatibilidad** (nuestro player no puede
  empezar a comportarse como el de fábrica, ADR 0007) y **la barra**, que
  durante el reemplazo tiene que seguir diciendo la verdad sobre el largo del
  programa. El ADR 0016 dice por qué el largo se relee y esta es la task que
  lo pone a prueba.

  Punto de partida: la evidencia de la T-01, los ADR 0002, 0007 y 0016, el
  contrato en `docs/`, y `js/renderer.js`. Restricción: hls.js entra sin
  modificar. Depende de T-02 y T-03.
- **Definición de done:** un break de tres avisos con el del medio lineal corre
  entero: capturas del concurrente, del lineal a cuadro entero con el primario
  detenido, y del primario de vuelta en la escena donde se quedó. La barra
  marca el break una sola vez y el pane de fábrica sigue haciendo lo suyo.
- **nivel de verificación:** bajo. Es interfaz, y lo que puede fallar en
  silencio —dónde vuelve el primario— se ve en la captura de la vuelta, que la
  definición de done pide justamente por eso.

## T-05 — El repliegue del lado del cliente

- **Objetivo:** que el cliente sepa qué hacer cuando lo que le devuelven no lo
  puede reproducir. David: "if the APS didn't do its job and it did get back
  something that's not supported, it will be the default... then we've now had
  a production level failover situation".
- **Qué tiene que cubrir:** el repliegue en dos escalones. Primero, el `URI` y
  la `duration` de nivel superior del asset, que ya son el lineal tradicional
  y que **todos los asset-list de la demo ya traen** —se ve en
  `signalling/asset-list-cornerOverlay.json`—, así que el dato existe y lo que
  falta es usarlo. Segundo, si no están, saltear el break entero.

  Qué cuenta como "no lo puedo reproducir" es la decisión de la task y hay que
  escribirla: un `mediaType` que el cliente no soporta, un bloque
  `X-AD-CREATIVE-SIGNALING` ausente o ilegible, un layout que pide más
  elementos que los que el `decoderCount` declara. Los tres son casos
  distintos y no tienen por qué replegarse igual.

  Punto de partida: la T-06 —el `decoderCount` es una de las entradas de esta
  decisión—, `js/signalling.js` y el contrato. Restricción: el repliegue es
  del cliente y no del APS; nada de esto cambia lo que el servidor devuelve.
  Depende de T-02.
- **Definición de done:** tres asset-list servidos a propósito rotos, uno por
  caso, y la corrida de cada uno mostrando qué hizo el cliente: el lineal de
  repliegue en pantalla, o el break salteado con el primario sin
  interrumpirse. Ninguno rompe la corrida ni deja un error de consola sin
  explicar.
- **nivel de verificación:** alto. Es el único camino de la fase que **nadie
  ejercita mirando la demo**: si el repliegue está mal, la corrida grabada se
  ve igual de bien y el defecto aparece el día que un asset-list real venga
  distinto. Los tests y la campaña de mutación que este nivel debe son los de
  la T-07, y esa task los tiene enumerados.

## T-06 — El `decoderCount`, de la configuración al pedido del asset-list

- **Objetivo:** que el integrador pueda declarar cuántos decodificadores tiene
  y que ese número llegue al pedido del asset-list. Nada más que eso: es
  passthrough.
- **Qué tiene que cubrir:** las tres condiciones, y son exactamente tres.
  **Que se pueda configurar**, del lado del SDK, que es donde el ADR 0015 dice
  que va. **Que si no se pone no cambie nada de lo que hay hoy**, como si
  fuera infinito: el pedido del asset-list sale igual que ahora, sin
  parámetro, y el recorrido de los cinco breaks corre idéntico. **Y que si
  está, el GET al asset-list lo lleve.** El nombre del parámetro y su forma
  hay que fijarlos y escribirlos, porque es superficie que después le importa
  al APS.

  Que la demo sirve archivos y por lo tanto la respuesta no cambia con el
  parámetro es alcance del proyecto y no un defecto de esta task: lo que se
  muestra es el parámetro viajando, y se muestra en la pestaña de red, que es
  donde esta demo muestra todo.

  Punto de partida: el ADR 0015, `js/signalling.js`, y el `PROJECT.md`, cuya
  sección de detección de capacidades explica por qué esto entra y el modelo
  de detección no. Restricción: **no se agrega detección de nada.** El SDK
  recibe el número, no lo averigua. Depende de T-02.
- **Definición de done:** con el `decoderCount` sin configurar, la pestaña de
  red muestra el mismo pedido de asset-list que hoy y el recorrido corre
  igual; configurado, muestra el parámetro en el pedido. Las dos corridas
  quedan como evidencia y el nombre del parámetro está escrito en la
  documentación del integrador.
- **nivel de verificación:** bajo. El resultado se lee en la pestaña de red,
  que es el instrumento que la demo ya usa para todo lo demás.

## T-07 — Tests: la secuencia del break y el repliegue

- **Objetivo:** cubrir lo que esta fase agrega y que no se ve en la pantalla.
- **Qué tiene que cubrir:** las funciones puras de la secuencia del break —dos
  y tres assets, con y sin `start` explícito, y el caso de un solo asset, que
  es el de hoy y no puede cambiar— y las de la decisión de repliegue: cada uno
  de los casos que la T-05 haya definido, más el que no repliega, que es el
  que garantiza que el repliegue no se dispara cuando el asset-list está bien.

  La campaña de mutación que debe la T-05, una rotura por regla y corriendo
  sólo los tests que cubren esa regla. Las que importan: el repliegue que no
  se dispara cuando debería, el que se dispara cuando no debería, y el skip
  del break confundido con el repliegue al lineal, que son dos cosas distintas
  y en pantalla se parecen. Una mutación que quede verde es un hallazgo.

  Punto de partida: `test/layout-resolution.test.js`. Restricción: la misma
  que en las dos fases anteriores, no hay tests de DOM ni de browser ni
  cobertura como objetivo. Depende de T-03 y T-05.
- **Definición de done:** un comando corre los tests y pasan, con los casos de
  arriba cubiertos, y cada test nuevo se vio en rojo por lo menos una vez con
  su mutación anotada.
- **nivel de verificación:** mínimo. La salida entera es una corrida que una
  persona mira.

## T-08 — El break mezclado adentro del recorrido grabable

- **Objetivo:** que lo que David pidió esté en la corrida que se graba y no en
  una página aparte.
- **Qué tiene que cubrir:** decidir dónde entra el break mezclado en el
  recorrido de `scripts/senalizar-contenido.sh` —un break nuevo, o uno de los
  cinco que ya están— y con qué mezcla, sabiendo que la que David nombró es
  "concurrent, concurrent, linear, concurrent". El recorrido es la tabla que
  gobierna la grabación y el script la imprime en cada arranque: si cambia, esa
  tabla y la sección `Before you record` del `README.md` cambian con ella.

  Hay que mirar de frente lo que el break mezclado le hace al pane de fábrica,
  que ya llega tarde: la T-12 de la fase 01 midió que después de cuatro breaks
  va 49,47 s de programa atrás y que el quinto aviso lineal no se ve nunca
  adentro del recorrido. Un break más, o uno más largo, empeora ese número.

  Punto de partida: `scripts/senalizar-contenido.sh`, el `README.md`, y la
  evidencia de la T-12 de la fase 01. Restricción: el recorrido tiene que
  seguir siendo una sola corrida de punta a punta sin un solo seek, que es lo
  que la fase 01 dejó parado y lo que se graba. Depende de T-03, T-04 y T-05.
- **Definición de done:** el recorrido corre entero en una sola carga, sin
  seek, con el break mezclado adentro, y hay una captura por aviso del break
  mezclado. La tabla que el script imprime y el `README.md` dicen lo que la
  corrida hace, incluido lo que le pasa al pane de fábrica.
- **nivel de verificación:** bajo. Es interfaz y datos, y el error está en la
  pantalla o en la tabla que lee quien graba.
