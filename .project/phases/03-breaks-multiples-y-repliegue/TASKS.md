# Tasks — fase 03-breaks-multiples-y-repliegue

**La primera task sigue siendo una medición, y mide otra cosa que antes.** El
`DESIGN.md` contestó leyendo casi todo lo que la vieja T-01 iba a medir: qué hace
hoy la capa de señalización con varios `ASSETS`, cómo se declara un aviso lineal
—que es el ADR 0019— y si encender la maquinaria de hls.js es una salida. Lo que
queda por medir de verdad son tres cosas, y la primera es la que puede arruinar la
grabación: **cuánto dura el arranque en frío de cada instancia de hls.js en las
transiciones de adentro del break.** Cada nodo nace con fondo negro y hoy no se
nota porque hay un aviso por break.

**El aviso lineal y el repliegue son una sola task, y ese es el cambio grande.**
El ADR 0019 dice que un asset sin bloque se reproduce por su `URI` hasta el fin
del asset, y que un bloque que falla cae al mismo lugar. Son el mismo camino de
código, así que dos tasks separadas eran dos implementaciones del mismo mecanismo.

**Las tasks de la T-03 en adelante están escritas contra el diseño, y la T-02 las
puede corregir con la medición en la mano.** No es lo mismo que antes: antes la
T-02 escribía el plan de construcción, y ahora el plan existe y sale del diseño.
Lo que la T-02 hace es devolver la medición a los artefactos por el camino que
corresponde.

**La verificación de base de este proyecto sigue corriendo**, y cada bloque dice
qué le queda y qué se le fue: `node scripts/verificar-cortes.mjs` y `npm test` al
final de cada task que toque los archivos que esos dos miran, y la comparación de
la caja pedida contra la dibujada donde la task toque el renderizado.

| id   | brief                                                              | status  | plan | evidence |
| ---- | ------------------------------------------------------------------ | ------- | ---- | -------- |
| T-01 | Medir las tres cosas que el diseño no pudo leer                    | planned | —    | —        |
| T-02 | Devolver la medición al diseño y a las tasks                       | planned | —    | —        |
| T-03 | Un break con varios avisos, uno detrás del otro                    | planned | —    | —        |
| T-04 | El asset sin bloque: el aviso lineal y el repliegue                | planned | —    | —        |
| T-05 | El `decoderCount`, de la configuración al pedido del asset-list    | planned | —    | —        |
| T-06 | Tests: la secuencia del break y el asset sin bloque                | planned | —    | —        |
| T-07 | El break mezclado adentro del recorrido grabable                   | planned | —    | —        |

---

## T-01 — Medir las tres cosas que el diseño no pudo leer

- **Objetivo:** saber lo que no se puede leer del código antes de que nada dependa
  de ello. Es la mitigación del riesgo R1 de la fase, y la primera de las tres
  mediciones es la que decide si el break mezclado se puede grabar.
- **Qué tiene que cubrir:** tres cosas, y son exactamente tres.

  1. **Cuánto dura el arranque en frío de cada instancia de hls.js en las
     transiciones de adentro del break.** Un break de cuatro avisos tiene tres
     transiciones, y en cada una el renderizador destruye la experiencia anterior
     entera y construye la siguiente: `clear()` hace `adHls.destroy()` y `build()`
     crea una instancia nueva con su fetch de playlist y de segmento antes del
     primer cuadro. Cada nodo se crea con fondo negro
     (`lib/renderer.js:194`), así que lo que hay que medir es **cuánto dura ese
     negro**, transición por transición, con un número y no una impresión.
  2. **Qué hace el renderizador con dos experiencias solapadas que declaran cajas
     distintas para el primario.** Dejó de ser una hipótesis sobre un asset-list
     mal armado: con la regla de "hasta el fin del asset" del ADR 0019, un creativo
     que dure más que su `DURATION` declarada solapa al siguiente en operación
     normal. La lectura del código dice que `drawn` termina con dos entradas
     apuntando al mismo nodo `<video>` y que `place()` las aplica a las dos y gana
     la última; hay que verlo pasar.
  3. **Si el primario decodificando detrás de un aviso opaco cuesta lo mismo que
     decodificando visible.** Es lo que dice si el `decoderCount` significa algo
     real bajo el render que esta fase construye, y es el dato que le falta a la
     comparación entre las lecturas C1 y C2 del `DESIGN.md`.

  Punto de partida: las secciones 10 y 12 del `DESIGN.md`, `lib/renderer.js`
  —`clear()`, `build()` y `place()`—, `lib/media.js` —`attachAsset`—, y la
  evidencia de la T-02 de la fase 01, que es la corrida que midió el par de
  compatibilidad. Restricción: **la medición no cambia el comportamiento de la
  demo**; lo que haga falta escribir vive en un directorio temporal o detrás de un
  asset-list que el recorrido no usa. Sin dependencias.
- **Definición de done:** existe, guardado como evidencia, un registro que dice
  para cada uno de los tres puntos qué pasó, con la corrida que lo muestra. El
  punto 1 con un número por transición.
- **nivel de verificación:** mínimo. Es una medición cuyo resultado entero lo lee
  una persona antes de que nada dependa de él, y lo único que decide es cómo se
  encara la fase.

  **Queda:** nada de la verificación de base, porque la task no toca ningún
  archivo que `verificar-cortes` o `npm test` miren.

  **Se fue:** los tres puntos que esta task medía antes, porque el `DESIGN.md` los
  contestó leyendo. Qué hace hoy la capa de señalización con varios `ASSETS` está
  en su sección 6 —el `start` del item es el que posiciona, así que con `start`
  acumulados el código de hoy ya secuencia—; cómo se declara un aviso lineal es el
  ADR 0019; y que encender la maquinaria de hls.js no es una salida está en la
  sección 5, con la cadena buscada en el bundle que la demo sirve.

## T-02 — Devolver la medición al diseño y a las tasks

- **Objetivo:** que lo que la T-01 mida vuelva a los artefactos de la fase por el
  camino que corresponde, en lugar de quedarse adentro de la evidencia de una
  task.
- **Qué tiene que cubrir:** leer la evidencia de la T-01 contra el `DESIGN.md` y
  contra los bloques de acá abajo, y escribir lo que se movió donde va: el diseño
  se sigue escribiendo en `DESIGN.md`, y cada artefacto afectado se corrige por su
  modo —un ADR nuevo que supersede o generaliza al viejo, un bloque de task
  reescrito, una línea de alcance—. **El `DESIGN.md` no se reescribe para que
  coincida con los artefactos.**

  Las dos conexiones previsibles, para que no haya que buscarlas: si el punto 1
  dice que el negro entre avisos se ve, lo afectado es la T-07 —la mezcla y dónde
  entra en el recorrido— y quizás la T-03, según si la transición se puede
  suavizar sin tocar el mecanismo; y si el punto 3 dice que el primario detrás de
  un aviso opaco cuesta un decodificador, lo afectado es la pregunta abierta del
  `PHASE.md` y no el alcance de esta fase, que es passthrough por diseño.

  **Lo que esta task ya no es:** escribir el plan de construcción. El plan existe
  y sale del diseño. Punto de partida: la evidencia de la T-01, el `DESIGN.md` y el
  `PHASE.md`. Restricción: **ninguna task de construcción cambia antes de que
  Nicolás lea el resultado de la medición.** Depende de T-01.
- **Definición de done:** por cada uno de los tres puntos de la T-01 hay una
  respuesta escrita de qué artefacto tocó y cómo, incluido "ninguno" cuando la
  medición confirmó lo que ya estaba escrito. Las decisiones que la medición haya
  forzado están como ADR.
- **nivel de verificación:** mínimo. Es trabajo de planificación que Nicolás lee
  entero antes de que se ejecute nada.

  **Queda:** nada de la verificación de base; esta task no toca código.

  **Se fue:** la escritura del plan de construcción, que era casi todo lo que esta
  task hacía. Con `DESIGN.md`, `PHASE.md` y los bloques de acá abajo escritos, lo
  que queda es el pase de la medición.

## T-03 — Un break con varios avisos, uno detrás del otro

- **Objetivo:** que un break pueda traer más de un aviso y que salgan en secuencia
  y no encimados, y que el segundo se vea aunque comparta layout con el primero.
  Es la mitad barata de lo que pidió David.
- **Qué tiene que cubrir:** dos cosas, y la segunda es un bug que este escenario
  destapa.

  **La secuencia.** El orden es herencia de la norma —los assets se reproducen en
  el orden en que aparecen en el array `ASSETS`, Apéndice D.2— así que no hay que
  decidirlo. Lo que sí hay que decidir y escribir es **de qué dato sale el
  desplazamiento de cada aviso**: el `start` del item del payload, la `DURATION` de
  nivel superior de cada asset, o acumular. Hoy coinciden en todos los asset-list
  de la demo y no tienen por qué coincidir siempre, la norma no define un campo
  para esto, y el asset sin bloque de la T-04 no tiene dónde llevar un `start`. Es
  superficie que después le importa al APS y a SVTA.

  **El bug de la identidad.** La clave del renderizador es `${e.type}#${e.id}`
  (`lib/renderer.js:150`) y el `id` es el del Date Range, el mismo para todos los
  items del break (`lib/signalling.js:104-118`). Dos avisos consecutivos del mismo
  `type` producen la misma clave, `nextKey !== key` da falso, **el renderizador no
  reconstruye y el segundo creativo no se ve nunca**. Es exactamente el escenario
  de esta task, y lo natural es que dos avisos de un break compartan layout. Se
  arregla dándole identidad propia a cada item, que es un campo que el contrato hoy
  no tiene.

  Los asset-list son datos, no código: el ADR 0008 predijo que agregar casos es
  trabajo de datos y la fase 01 lo midió en líneas. Punto de partida: las secciones
  6 y 11 del `DESIGN.md`, `lib/signalling.js` —`resolveExperience`,
  `resolveAssetList` y `rangeOfExperiences`—, `lib/renderer.js:150`, `signalling/`
  y el contrato en `docs/`. Restricción: el corte del ADR 0003 se sigue verificando
  con `scripts/verificar-cortes.mjs`, y el recorrido de los cinco breaks que hoy se
  graba tiene que seguir corriendo igual. Depende de T-02.
- **Definición de done:** un break con tres avisos concurrentes corre entero, con
  una captura por aviso a tamaño real donde se ve que sale uno por vez y en el
  orden del asset-list, y la barra marcando el break una sola vez. **Y dos de esos
  tres comparten `type`**, que es lo que hace verificable el arreglo del bug: sin
  él, la captura del segundo muestra el creativo del primero.
- **nivel de verificación:** bajo. Es interfaz y el error está en la pantalla; la
  aritmética de la secuencia la cubren los tests de la T-06.

  **Queda:** `verificar-cortes` y `npm test`, porque la task edita
  `lib/signalling.js` y `lib/renderer.js` y los dos los miran. La comparación de la
  caja pedida contra la dibujada, porque el escenario pone tres layouts distintos
  uno detrás del otro y es la primera vez que se encadenan.

  **Se fue:** nada. Esta task nunca tuvo campaña de mutación propia; la tiene la
  T-06.

## T-04 — El asset sin bloque: el aviso lineal y el repliegue

- **Objetivo:** construir el mecanismo del ADR 0019. Un asset sin bloque
  `X-AD-CREATIVE-SIGNALING` se reproduce por su `URI` hasta el fin del asset, y un
  bloque que falla cae al mismo lugar. **El aviso lineal en el medio del break y el
  repliegue del lado del cliente son el mismo camino de código**, y por eso son una
  sola task. Es lo que David marcó como lo más importante del día, y la parte de
  repliegue es la que él llamó "a production level failover situation".
- **Qué tiene que cubrir:** el mecanismo, la regla de fin, la lista de casos que
  caen en él, y una decisión sobre la barra que hay que tomar y escribir.

  **El mecanismo.** La capa de señalización sintetiza una experiencia para un asset
  sin bloque usable, con los campos que el contrato ya tiene: un elemento a cuadro
  entero con el `uri` del asset, arriba del primario y con volumen, y el primario
  abajo, tapado y en silencio. Hoy `resolveAssetList` itera `block?.payload || []`
  (`lib/signalling.js:132`), así que un asset sin bloque contribuye cero
  experiencias: eso es lo que cambia. **No hace falta un campo nuevo del contrato**
  y el primario **no se detiene**, que es lo que mantiene el ADR 0016 intacto y la
  barra honesta.

  **La regla de fin, y es la decisión más delicada de la task.** Se escribe
  **"reproducí el `URI` hasta el fin del asset"** y nunca "por su `DURATION`": la
  norma dice *"the interstitial MUST end upon reaching the end of the interstitial
  asset(s)"* y el `DURATION` del Asset-Description es metadato declarativo, que un
  servidor de decisioning puede declarar distinto de la duración real. Pero la
  regla 5 del contrato dice que `activeAt` es la única fuente de la ventana de
  activación, calculada desde `startTime` y `duration`, y las dos no pueden ser
  ciertas a la vez. Las dos salidas: que el elemento avise su fin —el `ended` del
  nodo— y `activeAt` deje de ser la única fuente, o que la `duration` declarada
  siga decidiendo y la divergencia quede aceptada y escrita. **La que se elija va
  al contrato de `docs/` con lo que promete y lo que no**, y con qué les pasa a los
  assets que vienen después cuando el fin real no coincide con el declarado.

  **Qué cuenta como "no lo puedo reproducir".** Cuatro casos, y no tienen por qué
  detectarse igual: un `mediaType` que el cliente no soporta, un bloque ausente, un
  bloque ilegible, y un layout que pide más elementos que los que el `decoderCount`
  declara. Los cuatro caen al mismo lugar por el ADR 0019, pero **la lista de los
  que efectivamente se detectan es decisión de la task** y hay que escribirla.

  **Y el segundo escalón lo contesta la norma, no nosotros.** El "si no están,
  salteá el break entero" que la fase tenía escrito es más grueso que lo que el
  Apéndice D.5 pide: si falla el pedido del `URI` de **un** asset se saltea **ese
  asset** y no el break; si falla el pedido del **asset list** se cancela el
  interstitial entero con offset 0; y un `ASSETS` vacío se resuelve aplicando el
  offset sin reproducir nada.

  **La decisión sobre la barra, que hay que tomar y escribir.**
  `lib/signalling.js:150` devuelve `kind: 'concurrent'` fijo y es uno por Date
  Range, así que un break mezclado se reporta como un rango entero de clase
  concurrente y no hay forma de expresar "este aviso de adentro del break es a
  cuadro entero". El ADR 0018 anticipa que nuestro player va a producir un rango de
  clase `interstitial` sobre su propio riel, y la T-06 de la fase 04 dejó
  `KINDS_PLAYED` preparado para recibirlo. **Pero bajo este render ese aviso no
  cambia el largo de la línea de tiempo, y el contrato define `kind` exactamente
  por eso** (ADR 0016), así que la anticipación no se sigue sola. Las dos salidas:
  la barra marca el break entero con una sola marca, como hoy, y no hay nada que
  arreglar; o el aviso a cuadro entero se marca aparte, y entonces hay que decidir
  qué significa su `kind` sin contradecir el contrato. **La task decide y escribe;
  no reescribe el ADR 0018.**

  Dos cosas que no se pueden perder por el camino, y las dos son argumentos de la
  demo: **el par de compatibilidad** —nuestro player no puede empezar a comportarse
  como el de fábrica, ADR 0007— y **la barra**, que durante el aviso a cuadro
  entero tiene que seguir diciendo la verdad sobre el largo del programa. Bajo este
  render el largo no cambia, y eso hay que **verificarlo** y no afirmarlo.

  Punto de partida: el ADR 0019, las secciones 4, 7, 11 y 13 del `DESIGN.md`,
  `lib/signalling.js` —`resolveAssetList`, `resolveExperience` y
  `rangeOfExperiences`—, `lib/renderer.js`, `lib/concurrent-hls.js:149`
  —`KINDS_PLAYED`—, el contrato en `docs/`, y
  `signalling/asset-list-linear.json`, que es el aviso lineal ya declarado sin
  bloque desde la fase 01 y la forma exacta que el mecanismo tiene que saber
  reproducir. Restricción: hls.js entra sin modificar y su controlador de
  interstitials sigue apagado; el ADR 0002 no se reabre. Depende de T-02 y T-03.
- **Definición de done:** dos corridas y un documento.

  Un break de cuatro avisos con el tercero sin bloque corre entero: capturas del
  concurrente anterior, del asset sin bloque a cuadro entero con el primario
  invisible y en silencio, y del primario de vuelta en la escena donde estaba. La
  barra marca lo que la task haya decidido que marca, y el pane de fábrica sigue
  haciendo lo suyo.

  Un asset-list servido a propósito roto por cada caso que la task haya decidido
  detectar, con la corrida de cada uno mostrando qué hizo el cliente: el `URI` del
  asset en pantalla, o el asset salteado, o el break cancelado, según el escalón
  que corresponda. Ninguno rompe la corrida ni deja un error de consola sin
  explicar.

  Y el contrato en `docs/` dice de dónde sale el fin del asset, qué le pasa a la
  secuencia cuando no coincide con el declarado, y qué marca la barra.
- **nivel de verificación:** alto, y por dos razones. **El repliegue es el único
  camino de la fase que nadie ejercita mirando la demo**: si está mal, la corrida
  grabada se ve igual de bien y el defecto aparece el día que un asset-list real
  venga distinto. Y **la regla de fin falla en silencio**: un asset que corta medio
  segundo antes o después se ve perfecto en una captura y corre todo lo que viene
  atrás. Los tests y la campaña de mutación que este nivel debe son los de la T-06,
  y esa task los tiene enumerados.

  **Queda:** `verificar-cortes` y `npm test`, porque la task edita
  `lib/signalling.js` y `lib/renderer.js`. La comparación de la caja pedida contra
  la dibujada, porque el aviso a cuadro entero es una caja `0 0 0 0` que tapa al
  primario y es la primera vez que se dibuja una así. Y la lectura del largo del
  programa antes, durante y después del aviso a cuadro entero, que es lo que
  verifica que el ADR 0016 sigue en pie en lugar de afirmarlo.

  **Se fue:** nada. Es la task con el nivel más alto de la fase.

## T-05 — El `decoderCount`, de la configuración al pedido del asset-list

- **Objetivo:** que el integrador pueda declarar cuántos decodificadores tiene y
  que ese número llegue al pedido del asset-list. Nada más que eso: es passthrough.
- **Qué tiene que cubrir:** las tres condiciones, y son exactamente tres. **Que se
  pueda configurar**, del lado del SDK, que es donde el ADR 0015 dice que va. **Que
  si no se pone no cambie nada de lo que hay hoy**, como si fuera infinito: el
  pedido del asset-list sale igual que ahora, sin parámetro, y el recorrido de los
  cinco breaks corre idéntico. **Y que si está, el GET al asset-list lo lleve.** El
  nombre del parámetro y su forma hay que fijarlos y escribirlos, porque es
  superficie que después le importa al APS.

  Que la demo sirve archivos y por lo tanto la respuesta no cambia con el parámetro
  es alcance del proyecto y no un defecto de esta task: lo que se muestra es el
  parámetro viajando, y se muestra en la pestaña de red, que es donde esta demo
  muestra todo.

  Una conexión con la T-04, para que no haya que buscarla: **el `decoderCount` es
  una de las cuatro entradas de la lista de "no lo puedo reproducir"** —un layout
  que pide más elementos que los decodificadores declarados—, así que si la T-04 lo
  incluyó entre los casos que detecta, el número tiene que estar donde esa decisión
  lo pueda leer.

  Punto de partida: el ADR 0015, `lib/signalling.js`, `lib/concurrent-hls.js`, y la
  sección del `PROJECT.md` sobre detección de capacidades, que explica por qué esto
  entra y el modelo de detección no. Restricción: **no se agrega detección de
  nada.** El SDK recibe el número, no lo averigua. Depende de T-02.
- **Definición de done:** con el `decoderCount` sin configurar, la pestaña de red
  muestra el mismo pedido de asset-list que hoy y el recorrido corre igual;
  configurado, muestra el parámetro en el pedido. Las dos corridas quedan como
  evidencia y el nombre del parámetro está escrito en la documentación del
  integrador.
- **nivel de verificación:** bajo. El resultado se lee en la pestaña de red, que es
  el instrumento que la demo ya usa para todo lo demás.

  **Queda:** `verificar-cortes` y `npm test`, porque la task edita archivos de
  `lib/`. Y la corrida del recorrido completo con el parámetro sin configurar, que
  es lo que verifica la segunda de las tres condiciones y es la única que puede
  romper algo que hoy funciona.

  **Se fue:** la comparación de la caja pedida contra la dibujada, porque esta task
  no toca el renderizado.

## T-06 — Tests: la secuencia del break y el asset sin bloque

- **Objetivo:** cubrir lo que esta fase agrega y que no se ve en la pantalla.
- **Qué tiene que cubrir:** las funciones puras de la secuencia y las de la
  decisión del asset sin bloque.

  **De la secuencia:** dos y tres assets, con y sin `start` explícito, y el caso de
  un solo asset, que es el de hoy y no puede cambiar. Más el caso de la identidad:
  dos experiencias consecutivas del mismo `type` tienen que producir claves
  distintas, que es el bug que la T-03 arregla y el único que se ve en la pantalla
  como "el segundo creativo no aparece".

  **Del asset sin bloque:** que un `ASSET` con `URI` y `DURATION` y nada más
  produce exactamente una experiencia, a cuadro entero y con el primario en
  silencio; cada uno de los casos de "no lo puedo reproducir" que la T-04 haya
  decidido detectar; los tres escalones del Apéndice D.5 —asset que falla, asset
  list que falla, `ASSETS` vacío—; y **el que no repliega**, que es el que garantiza
  que el repliegue no se dispara cuando el asset-list está bien.

  **La campaña de mutación que debe la T-04**, una rotura por regla y corriendo
  sólo los tests que cubren esa regla. Las que importan: el repliegue que no se
  dispara cuando debería, el que se dispara cuando no debería, el skip del asset
  confundido con la cancelación del break —que son dos cosas distintas y en
  pantalla se parecen—, y la regla de fin resuelta por `DURATION` en lugar de por
  el fin del asset. Una mutación que quede verde es un hallazgo.

  Punto de partida: `test/layout-resolution.test.js` y
  `test/program-ranges-and-volume.test.js`. Restricción: la misma que en las tres
  fases anteriores, no hay tests de DOM ni de browser ni cobertura como objetivo.
  Depende de T-03 y T-04.
- **Definición de done:** `npm test` corre y pasa con los casos de arriba
  cubiertos, y cada test nuevo se vio en rojo por lo menos una vez con su mutación
  anotada.
- **nivel de verificación:** mínimo. La salida entera es una corrida que una
  persona mira.

  **Queda:** `npm test`, que es la task misma.

  **Se fue:** `verificar-cortes` y la comparación de cajas, porque la task no toca
  `lib/` ni el renderizado.

## T-07 — El break mezclado adentro del recorrido grabable

- **Objetivo:** que lo que David pidió esté en la corrida que se graba y no en una
  página aparte.
- **Qué tiene que cubrir:** decidir dónde entra el break mezclado en el recorrido
  de `scripts/senalizar-contenido.sh` —un break nuevo, o uno de los cinco que ya
  están— y con qué mezcla, sabiendo que la que David nombró es "concurrent,
  concurrent, linear, concurrent". El recorrido es la tabla que gobierna la
  grabación y el script la imprime en cada arranque: si cambia, esa tabla y la
  sección `Before you record` del `README.md` cambian con ella.

  **Dos cosas de frente, y ninguna es un detalle.**

  **La inversión del par de compatibilidad.** El tag de clase Apple y el
  concurrente comparten `START-DATE` (`scripts/senalizar-contenido.sh:82-83`), que
  es lo que hace que el par sea un par. Con el aviso a cuadro entero tercero en la
  mezcla, hay un tramo del break donde **nuestro pane muestra un aviso a cuadro
  entero y el de fábrica muestra el programa**, o sea al revés del cuadro que la
  demo quiere. Los dos panes siguen en el mismo segundo del programa —el ADR 0017
  se cumple—, pero durante ese tramo la comparación dice lo contrario de lo que
  quiere decir. Las tres salidas están en la sección 8 del `DESIGN.md`: poner el
  aviso a cuadro entero primero en la mezcla, aceptar la inversión y explicarla, o
  desalinear los `START-DATE`. **Es decisión de producto y de David**, porque es lo
  que él cuenta en escenario, y la task la aplica.

  **El número de la T-01.** Las transiciones de adentro del break cuestan un
  arranque en frío cada una, con fondo negro mientras dura. La mezcla y el largo de
  cada aviso se eligen con ese número en la mano y no antes.

  **Lo que este bloque ya no dice, y conviene saber por qué.** Decía que el pane de
  fábrica va 49,47 s de programa atrás después de cuatro breaks y que el quinto
  aviso lineal no se ve nunca, y pedía preservar ese argumento. El ADR 0017 pasó
  ese tag a forma de reemplazo: **el atraso ya no existe** —la T-05 de la fase 04
  lo midió en 0,72 s—, el quinto aviso ya se ve, y el argumento se retiró a
  propósito. Lo que lo reemplaza es la inversión de arriba.

  Punto de partida: `scripts/senalizar-contenido.sh`, el `README.md`, la sección 8
  del `DESIGN.md`, la evidencia de la T-01 de esta fase y la de la T-05 de la fase
  04. Restricción: el recorrido tiene que seguir siendo una sola corrida de punta a
  punta sin un solo seek, que es lo que la fase 01 dejó parado y lo que se graba.
  Depende de T-03, T-04 y T-05.
- **Definición de done:** el recorrido corre entero en una sola carga, sin seek,
  con el break mezclado adentro, y hay una captura por aviso del break mezclado más
  una del tramo invertido con los dos panes en el mismo cuadro. La tabla que el
  script imprime y el `README.md` dicen lo que la corrida hace, incluido qué pasa
  con el par de compatibilidad durante el break mezclado.
- **nivel de verificación:** bajo. Es interfaz y datos, y el error está en la
  pantalla o en la tabla que lee quien graba.

  **Queda:** `verificar-cortes` y `npm test` si la task termina tocando algo de
  `lib/`, que no debería. Y la corrida completa de punta a punta sin seek, que es
  la task misma y es lo que se graba.

  **Se fue:** la comparación de la caja pedida contra la dibujada, porque esta task
  es datos y guion de recorrido, no renderizado.
