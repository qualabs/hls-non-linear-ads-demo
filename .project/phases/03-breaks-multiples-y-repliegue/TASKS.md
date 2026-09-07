# Tasks — fase 03-breaks-multiples-y-repliegue

**La fase no arranca con una medición, y antes arrancaba con una.** Las tres cosas
que la vieja primera task iba a medir se cayeron por razones distintas. El parpadeo
negro entre un aviso y el siguiente **no es un hallazgo**: es la consecuencia
conocida de crear la instancia del aviso que entra recién cuando el anterior salió,
tiene arreglo conocido —traer el asset siguiente mientras corre el actual— y medir
cuánto dura para después arreglarlo igual es trabajo que ninguna decisión de esta
fase necesita. Así que **la precarga pasa a ser parte de lo que la T-01 construye**.
Si el primario decodificando detrás de un aviso opaco cuesta lo mismo que
decodificando visible tampoco lo necesita ninguna decisión de acá: el
`decoderCount` es passthrough por diseño de la propia fase y no hace nada con ese
costo, así que la pregunta queda donde ya estaba, abierta en el `PHASE.md`. Y qué
hace el renderizador con dos experiencias solapadas sí le importa a una decisión
concreta —la regla de fin de la T-02—, así que es **una lectura adentro de esa
task** y no una medición aparte. Con las tres afuera, la task que devolvía la
medición al diseño se quedó sin nada que devolver, y las dos se fueron: la fase
pasa de siete tasks a cinco y se renumera entera. Ninguna tenía plan ni evidencia,
así que la renumeración no rompe nada.

**El aviso lineal y el repliegue son una sola task.** El ADR 0019 dice que un asset
sin bloque se reproduce por su `URI` hasta el fin del asset, y que un bloque que
falla cae al mismo lugar. Son el mismo camino de código, así que dos tasks
separadas eran dos implementaciones del mismo mecanismo.

**Las cinco tasks están escritas contra el `DESIGN.md`**, que es de donde salen: el
plan de construcción existe y no hay que escribirlo adentro de la fase.

**Cada task afirma lo suyo leyendo el estado, y no mirando una imagen.** Lo que
esta fase construye es mecánico: que el aviso 2 arranque cuando el 1 termina, que un
asset sin bloque dispare su `URI`, que un parámetro viaje en el pedido. Todo eso es
un número o un booleano que se lee del navegador con el recorrido corriendo —el
`currentTime` de un nodo en un instante dado, qué nodos hay en la capa y con qué
caja, qué pidió la pestaña de red y con qué query params, qué devuelve una función
pura ante una entrada— y `window.demo` ya expone el proveedor, el renderizador y la
capa para leerlos. **"El aviso 2 arrancó en el segundo 12,03" es una afirmación;
"se ve bien" no es nada.** Cada definición de done de acá abajo está escrita para
poder fallar sola, sin que nadie mire.

**No se guardan capturas como requisito de done, y es un cambio respecto de la fase
04.** Allá el done era una captura a tamaño real y **estaba bien**: los seis
defectos de esa fase eran visuales —un logo encima de la imagen, el amarillo
colgando debajo del riel, los controles que desaparecían al tocar— y mirar **era**
la medición. Acá el contenido es mecánico y una captura no afirma nada sobre él: un
asset que corta medio segundo antes se ve idéntico en la foto, y dos creativos del
mismo layout también. Traer el instrumento de una fase a otra que no se le parece
es exactamente lo que hay que no hacer.

**Y el límite, porque no todo se lee.** Hay cosas que sólo se juzgan mirando: si la
mezcla del break se cuenta bien en escenario, si la transición entre dos avisos
queda prolija, si el par de compatibilidad dice lo que tiene que decir. **Para esas
el revisor es Nicolás corriendo la demo**, que es como se verificó el criterio de la
fase 04, y no hace falta reemplazarlo por un artefacto guardado en una carpeta. Lo
que no vale es usar esa revisión como excusa para no afirmar lo que sí se puede
leer.

**La verificación de base del proyecto sigue corriendo**, y cada bloque dice qué le
queda y qué se le fue: `node scripts/verificar-cortes.mjs` y `npm test` al final de
cada task que toque los archivos que esos dos miran, y la comparación de la caja
pedida contra la dibujada donde la task toque el renderizado, que ya era una lectura
de números y no una mirada.

| id   | brief                                                              | status  | plan | evidence |
| ---- | ------------------------------------------------------------------ | ------- | ---- | -------- |
| T-01 | Un break con varios avisos, uno detrás del otro                    | done    | —    | [tasks/T-01/](tasks/T-01/) |
| T-02 | El asset sin bloque: el aviso lineal y el repliegue                | done    | —    | [tasks/T-02/](tasks/T-02/) |
| T-03 | El `decoderCount`, de la configuración al pedido del asset-list    | done    | —    | [tasks/T-03/](tasks/T-03/) |
| T-04 | Tests: la secuencia del break y el asset sin bloque                | done    | —    | [tasks/T-04/](tasks/T-04/) |
| T-05 | El break mezclado adentro del recorrido grabable                   | done    | —    | [tasks/T-05/](tasks/T-05/) |

---

## T-01 — Un break con varios avisos, uno detrás del otro

- **Objetivo:** que un break pueda traer más de un aviso, que salgan en secuencia y
  no encimados, que el segundo se vea aunque comparta layout con el primero, y que
  la transición entre uno y otro no pase por un cuadro en negro. Es la mitad barata
  de lo que pidió David.
- **Qué tiene que cubrir:** tres cosas. La segunda es un bug que este escenario
  destapa y la tercera es la que antes iba a medirse.

  **La secuencia.** El orden es herencia de la norma —los assets se reproducen en el
  orden en que aparecen en el array `ASSETS`, Apéndice D.2— así que no hay que
  decidirlo. Lo que sí hay que decidir y escribir es **de qué dato sale el
  desplazamiento de cada aviso**: el `start` del item del payload, la `DURATION` de
  nivel superior de cada asset, o acumular. Hoy coinciden en todos los asset-list de
  la demo y no tienen por qué coincidir siempre, la norma no define un campo para
  esto, y el asset sin bloque de la T-02 no tiene dónde llevar un `start`. Es
  superficie que después le importa al APS y a SVTA.

  **El bug de la identidad.** La clave del renderizador es `${e.type}#${e.id}`
  (`lib/renderer.js:150`) y el `id` es el del Date Range, el mismo para todos los
  items del break (`lib/signalling.js:104-118`). Dos avisos consecutivos del mismo
  `type` producen la misma clave, `nextKey !== key` da falso, **el renderizador no
  reconstruye y el segundo creativo no se ve nunca**. Es exactamente el escenario de
  esta task, y lo natural es que dos avisos de un break compartan layout. Se arregla
  dándole identidad propia a cada item, que es un campo que el contrato hoy no
  tiene.

  **La precarga del aviso siguiente.** Hoy el renderizador destruye la experiencia
  que sale y recién ahí construye la que entra (`clear()` y `build()`,
  `lib/renderer.js:162-172`), así que cada transición de adentro del break paga un
  arranque en frío entero —instancia nueva de hls.js, fetch de playlist y de
  segmento— con el nodo en fondo negro mientras dura (`lib/renderer.js:194`). Con un
  aviso por break no se nota, porque ese único arranque cae antes de que haya algo
  que mostrar; con cuatro pasa tres veces en el medio. **El asset siguiente se trae
  mientras corre el actual**, y eso es construcción y no medición: la causa se
  conoce y el arreglo también. Lo que hay que decidir y escribir es con cuánta
  anticipación se trae y qué se hace con el nodo precargado hasta que le toca, sin
  que aparezca antes de tiempo ni suene.

  Los asset-list son datos, no código: el ADR 0008 predijo que agregar casos es
  trabajo de datos y la fase 01 lo midió en líneas. Punto de partida: las secciones
  6, 10 y 11 del `DESIGN.md`, `lib/signalling.js` —`resolveExperience`,
  `resolveAssetList` y `rangeOfExperiences`—, `lib/renderer.js:150`, `lib/media.js`
  —`attachAsset`—, `signalling/` y el contrato en `docs/`. Restricción: el corte del
  ADR 0003 se sigue verificando con `scripts/verificar-cortes.mjs`, y el recorrido de
  los cinco breaks que hoy se graba tiene que seguir corriendo igual. Sin
  dependencias.
- **Definición de done:** un break de tres avisos corre entero, con dos de los tres
  compartiendo `type`, y cuatro lecturas lo afirman con el recorrido corriendo.

  1. **La secuencia.** En un instante de adentro de cada aviso,
     `provider.activeAt(t)` devuelve **exactamente una** experiencia, y es la que
     corresponde al orden del array `ASSETS`, con su `startTime` en el segundo que
     el desplazamiento elegido predice. Tres instantes, tres respuestas, y ninguna
     con dos experiencias adentro.
  2. **La identidad.** En el instante del segundo aviso, el nodo que hay en la capa
     es el del segundo creativo: lo dice su `src` y su `data-element-id`, no la
     pantalla. Con el bug vivo el nodo que hay ahí es el que `build()` creó para el
     primero, y **la lectura del `src` los distingue aunque los dos creativos se
     parezcan**, que es lo que una captura no puede.
  3. **La barra.** `provider.programRanges()` devuelve **un** rango para ese Date
     Range, con `startTime` en el arranque del primer aviso y `duration` hasta el fin
     del último.
  4. **La precarga.** En el instante anterior a cada transición, el nodo del aviso
     que entra **ya existe en la capa** y reporta `readyState >= 2`. Es un booleano
     por transición y falla solo: sin precarga, en ese instante el nodo todavía no
     existe.
- **nivel de verificación:** bajo. Lo que la task agrega es aritmética de secuencia
  y una clave, y las dos se leen del contrato con el recorrido corriendo; la
  aritmética además la cubren los tests de la T-04.

  **Queda:** `verificar-cortes` y `npm test`, porque la task edita
  `lib/signalling.js` y `lib/renderer.js` y los dos los miran. La comparación de la
  caja pedida contra la dibujada, porque el escenario pone tres layouts distintos uno
  detrás del otro y es la primera vez que se encadenan.

  **Se fue:** la captura por aviso como requisito de done. Lo que pedía mostrar —que
  sale uno por vez, en el orden del asset-list y con la barra marcando una vez— lo
  afirman las lecturas 1 a 3, y la 2 lo afirma mejor: no depende de que los dos
  creativos se distingan a simple vista.

## T-02 — El asset sin bloque: el aviso lineal y el repliegue

- **Objetivo:** que un asset sin bloque se reproduzca solo y que el cliente sepa qué
  hacer con cada forma de falla, que es el mecanismo del ADR 0019. Un asset sin
  bloque `X-AD-CREATIVE-SIGNALING` se reproduce por su `URI` hasta el fin del asset,
  y un bloque que falla cae al mismo lugar. **El aviso lineal en el medio del break
  y el repliegue del lado del cliente son el mismo camino de código**, y por eso son
  una sola task. Es lo que David marcó como lo más importante del día, y la parte de
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
  servidor de decisioning puede declarar distinto de la duración real. Pero la regla
  5 del contrato dice que `activeAt` es la única fuente de la ventana de activación,
  calculada desde `startTime` y `duration`, y las dos no pueden ser ciertas a la vez.
  Las dos salidas: que el elemento avise su fin —el `ended` del nodo— y `activeAt`
  deje de ser la única fuente, o que la `duration` declarada siga decidiendo y la
  divergencia quede aceptada y escrita. **La que se elija va al contrato de `docs/`
  con lo que promete y lo que no**, y con qué les pasa a los assets que vienen
  después cuando el fin real no coincide con el declarado.

  **Y lo que pasa cuando dos experiencias se solapan, que la regla de fin vuelve
  condición de operación normal.** Si la `duration` declarada sigue decidiendo y el
  creativo dura más, el aviso que entra se solapa con el que todavía no terminó, y
  las dos experiencias declaran caja para el primario. Leyendo el código, `drawn`
  termina con dos entradas apuntando al mismo nodo `<video>`
  (`lib/renderer.js:185-187`) y `place()` las aplica a las dos y gana la última
  (`:232-239`). **Eso hay que verlo pasar antes de elegir la salida**, porque es lo
  que dice cuánto cuesta dejar que la `duration` declarada decida. No es una medición
  aparte y no la hace nadie más: es una lectura de esta task, sobre un asset-list
  solapado a propósito.

  **Qué cuenta como "no lo puedo reproducir".** Cuatro casos, y no tienen por qué
  detectarse igual: un `mediaType` que el cliente no soporta, un bloque ausente, un
  bloque ilegible, y un layout que pide más elementos que los que el `decoderCount`
  declara. Los cuatro caen al mismo lugar por el ADR 0019, pero **la lista de los que
  efectivamente se detectan es decisión de la task** y hay que escribirla.

  **Y el segundo escalón lo contesta la norma, no nosotros.** El "si no están,
  salteá el break entero" que la fase tenía escrito es más grueso que lo que el
  Apéndice D.5 pide: si falla el pedido del `URI` de **un** asset se saltea **ese
  asset** y no el break; si falla el pedido del **asset list** se cancela el
  interstitial entero con offset 0; y un `ASSETS` vacío se resuelve aplicando el
  offset sin reproducir nada.

  **La decisión sobre la barra, que hay que tomar y escribir.**
  `lib/signalling.js:150` devuelve `kind: 'concurrent'` fijo y es uno por Date Range,
  así que un break mezclado se reporta como un rango entero de clase concurrente y no
  hay forma de expresar "este aviso de adentro del break es a cuadro entero". El ADR
  0018 anticipa que nuestro player va a producir un rango de clase `interstitial`
  sobre su propio riel, y la T-06 de la fase 04 dejó `KINDS_PLAYED` preparado para
  recibirlo. **Pero bajo este render ese aviso no cambia el largo de la línea de
  tiempo, y el contrato define `kind` exactamente por eso** (ADR 0016), así que la
  anticipación no se sigue sola. Las dos salidas: la barra marca el break entero con
  una sola marca, como hoy, y no hay nada que arreglar; o el aviso a cuadro entero se
  marca aparte, y entonces hay que decidir qué significa su `kind` sin contradecir el
  contrato. **La task decide y escribe; no reescribe el ADR 0018.**

  Dos cosas que no se pueden perder por el camino, y las dos son argumentos de la
  demo: **el par de compatibilidad** —nuestro player no puede empezar a comportarse
  como el de fábrica, ADR 0007— y **la barra**, que durante el aviso a cuadro entero
  tiene que seguir diciendo la verdad sobre el largo del programa. Bajo este render
  el largo no cambia, y eso hay que **verificarlo** y no afirmarlo.

  Punto de partida: el ADR 0019, las secciones 4, 7, 11 y 13 del `DESIGN.md`,
  `lib/signalling.js` —`resolveAssetList`, `resolveExperience` y
  `rangeOfExperiences`—, `lib/renderer.js`, `lib/concurrent-hls.js:149`
  —`KINDS_PLAYED`—, el contrato en `docs/`, y `signalling/asset-list-linear.json`,
  que es el aviso lineal ya declarado sin bloque desde la fase 01 y la forma exacta
  que el mecanismo tiene que saber reproducir. Restricción: hls.js entra sin
  modificar y su controlador de interstitials sigue apagado; el ADR 0002 no se
  reabre. Depende de T-01.
- **Definición de done:** cuatro bloques de lecturas y un documento.

  **El asset sin bloque.** Un break de cuatro avisos con el tercero sin bloque corre
  entero y, en un instante de adentro del tercero: `provider.activeAt(t)` devuelve
  una sola experiencia con dos elementos, el del asset y el primario; la caja del
  elemento del asset es la del cuadro entero y el primario está debajo por `zDepth`;
  el nodo del asset tiene `volume` 1 y `muted` en falso; y el `<video>` del primario
  tiene `volume` 0 y **`paused` en falso**, que es la lectura que dice que el
  primario no se detuvo. Un instante después del fin del tercero, ese nodo ya no está
  en la capa y el `<video>` del primario volvió a `volume` 1 y sin `style` inline.

  **El largo del programa, que es el ADR 0016 verificado y no afirmado.** El
  `duration` del primario y los `startTime` y `duration` que
  `provider.programRanges()` devuelve son los mismos tres números antes, durante y
  después del aviso a cuadro entero. Y la barra marca lo que la task haya decidido
  que marca, leído de `programRanges()` y no de la pantalla.

  **El repliegue, un asset-list roto a propósito por cada caso que la task haya
  decidido detectar.** Por cada uno, la lectura que dice qué hizo el cliente y no que
  "no se rompió": el asset que falla se saltea y `activeAt` no devuelve nada en su
  ventana mientras las ventanas de los otros assets siguen intactas; el asset list
  que falla cancela el interstitial entero y `programRanges()` no reporta ese rango;
  el `ASSETS` vacío no produce experiencias. Y **el que no repliega**: con el
  asset-list bien, ninguna de esas lecturas se dispara. Ninguna de las corridas deja
  un error de consola sin explicar.

  **La solapada.** Con el asset-list solapado a propósito, en el instante del solape
  `activeAt` devuelve dos experiencias, y qué caja termina teniendo el `<video>` del
  primario en ese instante queda escrito con el número que se leyó, al lado de la
  salida que la task eligió para la regla de fin.

  **Y el documento:** el contrato en `docs/` dice de dónde sale el fin del asset, qué
  le pasa a la secuencia cuando no coincide con el declarado, y qué marca la barra.
- **nivel de verificación:** alto, y por dos razones. **El repliegue es el único
  camino de la fase que nadie ejercita mirando la demo**: si está mal, la corrida
  grabada se ve igual de bien y el defecto aparece el día que un asset-list real
  venga distinto. Y **la regla de fin falla en silencio**: un asset que corta medio
  segundo antes o después se ve perfecto en una captura y corre todo lo que viene
  atrás. Las dos razones dicen lo mismo sobre el instrumento: acá el done tiene que
  ser una lectura del estado, porque lo que puede fallar no se ve. Los tests y la
  campaña de mutación que este nivel debe son los de la T-04, y esa task los tiene
  enumerados.

  **Queda:** `verificar-cortes` y `npm test`, porque la task edita
  `lib/signalling.js` y `lib/renderer.js`. La comparación de la caja pedida contra la
  dibujada, que acá es una de las lecturas de arriba: el aviso a cuadro entero es una
  caja `0 0 0 0` que tapa al primario y es la primera vez que se dibuja una así. Y la
  lectura del largo del programa antes, durante y después.

  **Se fue:** las capturas del concurrente anterior, del asset a cuadro entero y del
  primario de vuelta en la escena. Nada de lo que afirmaban se perdió: las tres están
  arriba como lecturas de la capa y del contrato, y las tres pueden fallar solas. Una
  foto del aviso a cuadro entero **no distingue** un primario que sigue corriendo
  detrás de uno que se detuvo, que es justamente lo que esta task tiene que
  garantizar.

## T-03 — El `decoderCount`, de la configuración al pedido del asset-list

- **Objetivo:** que el integrador pueda declarar cuántos decodificadores tiene y que
  ese número llegue al pedido del asset-list. Nada más que eso: es passthrough.
- **Qué tiene que cubrir:** las tres condiciones, y son exactamente tres. **Que se
  pueda configurar**, del lado del SDK, que es donde el ADR 0015 dice que va. **Que
  si no se pone no cambie nada de lo que hay hoy**, como si fuera infinito: el pedido
  del asset-list sale igual que ahora, sin parámetro, y el recorrido de los cinco
  breaks corre idéntico. **Y que si está, el GET al asset-list lo lleve.** El nombre
  del parámetro y su forma hay que fijarlos y escribirlos, porque es superficie que
  después le importa al APS.

  Que la demo sirve archivos y por lo tanto la respuesta no cambia con el parámetro
  es alcance del proyecto y no un defecto de esta task: lo que se muestra es el
  parámetro viajando, y se lee de la pestaña de red, que es donde esta demo muestra
  todo.

  Una conexión con la T-02, para que no haya que buscarla: **el `decoderCount` es una
  de las cuatro entradas de la lista de "no lo puedo reproducir"** —un layout que
  pide más elementos que los decodificadores declarados—, así que si la T-02 lo
  incluyó entre los casos que detecta, el número tiene que estar donde esa decisión
  lo pueda leer.

  Punto de partida: el ADR 0015, `lib/signalling.js`, `lib/concurrent-hls.js`, y la
  sección del `PROJECT.md` sobre detección de capacidades, que explica por qué esto
  entra y el modelo de detección no. Restricción: **no se agrega detección de nada.**
  El SDK recibe el número, no lo averigua. Sin dependencias.
- **Definición de done:** dos corridas y tres lecturas, las tres sobre el pedido y
  no sobre una foto de la pestaña de red.

  Sin configurar: la URL del GET al asset-list es **carácter por carácter** la misma
  que la de hoy, sin query string; y el recorrido de los cinco breaks llega al final
  con la misma lista de rangos que `programRanges()` devuelve hoy, comparada rango
  por rango. Configurado en un número: la URL del GET lleva el parámetro con ese
  valor, con el nombre y la forma que la task fijó.

  Las dos URLs quedan en la evidencia como texto, y el nombre del parámetro está
  escrito en la documentación del integrador.
- **nivel de verificación:** bajo. El resultado se lee del pedido, que es un string,
  y la única de las tres condiciones que puede romper algo que hoy funciona es la
  segunda, que tiene su propia lectura.

  **Queda:** `verificar-cortes` y `npm test`, porque la task edita archivos de
  `lib/`. Y la corrida del recorrido completo con el parámetro sin configurar.

  **Se fue:** la comparación de la caja pedida contra la dibujada, porque esta task
  no toca el renderizado.

## T-04 — Tests: la secuencia del break y el asset sin bloque

- **Objetivo:** cubrir lo que esta fase agrega y que no se ve en la pantalla.
- **Qué tiene que cubrir:** las funciones puras de la secuencia y las de la decisión
  del asset sin bloque.

  **De la secuencia:** dos y tres assets, con y sin `start` explícito, y el caso de un
  solo asset, que es el de hoy y no puede cambiar. Más el caso de la identidad: dos
  experiencias consecutivas del mismo `type` tienen que producir claves distintas,
  que es el bug que la T-01 arregla y el único que se ve en la pantalla como "el
  segundo creativo no aparece".

  **Del asset sin bloque:** que un `ASSET` con `URI` y `DURATION` y nada más produce
  exactamente una experiencia, a cuadro entero y con el primario en silencio; cada
  uno de los casos de "no lo puedo reproducir" que la T-02 haya decidido detectar;
  los tres escalones del Apéndice D.5 —asset que falla, asset list que falla,
  `ASSETS` vacío—; y **el que no repliega**, que es el que garantiza que el repliegue
  no se dispara cuando el asset-list está bien.

  **La campaña de mutación que debe la T-02**, una rotura por regla y corriendo sólo
  los tests que cubren esa regla. Las que importan: el repliegue que no se dispara
  cuando debería, el que se dispara cuando no debería, el skip del asset confundido
  con la cancelación del break —que son dos cosas distintas y en pantalla se
  parecen—, y la regla de fin resuelta por `DURATION` en lugar de por el fin del
  asset. Una mutación que quede verde es un hallazgo.

  Punto de partida: `test/layout-resolution.test.js` y
  `test/program-ranges-and-volume.test.js`. Restricción: la misma que en las tres
  fases anteriores, no hay tests de DOM ni de browser ni cobertura como objetivo.
  Depende de T-01 y T-02.
- **Definición de done:** `npm test` corre y pasa con los casos de arriba cubiertos,
  y cada test nuevo se vio en rojo por lo menos una vez, con su mutación anotada y el
  test que la atrapó.
- **nivel de verificación:** mínimo. La salida entera es una corrida que pasa o
  falla, y no hay nada que agregarle: los tests son el instrumento, no el objeto.

  **Queda:** `npm test`, que es la task misma.

  **Se fue:** `verificar-cortes` y la comparación de cajas, porque la task no toca
  `lib/` ni el renderizado.

## T-05 — El break mezclado adentro del recorrido grabable

- **Objetivo:** que lo que David pidió esté en la corrida que se graba y no en una
  página aparte.
- **Qué tiene que cubrir:** decidir dónde entra el break mezclado en el recorrido de
  `scripts/senalizar-contenido.sh` —un break nuevo, o uno de los cinco que ya
  están— y con qué mezcla, sabiendo que la que David nombró es "concurrent,
  concurrent, linear, concurrent". El recorrido es la tabla que gobierna la grabación
  y el script la imprime en cada arranque: si cambia, esa tabla y la sección `Before
  you record` del `README.md` cambian con ella.

  **La inversión del par de compatibilidad, de frente.** El tag de clase Apple y el
  concurrente comparten `START-DATE` (`scripts/senalizar-contenido.sh:82-83`), que es
  lo que hace que el par sea un par. Con el aviso a cuadro entero tercero en la
  mezcla, hay un tramo del break donde **nuestro pane muestra un aviso a cuadro
  entero y el de fábrica muestra el programa**, o sea al revés del cuadro que la demo
  quiere. Los dos panes siguen en el mismo segundo del programa —el ADR 0017 se
  cumple—, pero durante ese tramo la comparación dice lo contrario de lo que quiere
  decir. Las tres salidas están en la sección 8 del `DESIGN.md`: poner el aviso a
  cuadro entero primero en la mezcla, aceptar la inversión y explicarla, o desalinear
  los `START-DATE`. **Es decisión de producto y de David**, porque es lo que él
  cuenta en escenario, y la task la aplica.

  **Lo que la mezcla ya no tiene que esquivar.** Las transiciones de adentro del
  break costaban un arranque en frío cada una, con el nodo en negro mientras duraba,
  y este bloque decía que la mezcla y el largo de cada aviso se elegían con ese
  número en la mano. La T-01 trae el asset siguiente mientras corre el actual, así
  que la mezcla se elige por lo que cuenta mejor en escenario y no por lo que el
  renderizador aguanta.

  **Lo que este bloque ya no dice, y conviene saber por qué.** Decía que el pane de
  fábrica va 49,47 s de programa atrás después de cuatro breaks y que el quinto aviso
  lineal no se ve nunca, y pedía preservar ese argumento. El ADR 0017 pasó ese tag a
  forma de reemplazo: **el atraso ya no existe** —la T-05 de la fase 04 lo midió en
  0,72 s—, el quinto aviso ya se ve, y el argumento se retiró a propósito. Lo que lo
  reemplaza es la inversión de arriba.

  Punto de partida: `scripts/senalizar-contenido.sh`, el `README.md`, la sección 8
  del `DESIGN.md` y la evidencia de la T-05 de la fase 04. Restricción: el recorrido
  tiene que seguir siendo una sola corrida de punta a punta sin un solo seek, que es
  lo que la fase 01 dejó parado y lo que se graba. Depende de T-01, T-02 y T-03.
- **Definición de done:** el recorrido corre de punta a punta en una sola carga y
  `video.currentTime` avanza monótono del arranque al fin del programa, sin un salto
  hacia atrás ni hacia adelante en ninguna de las lecturas, que es lo que dice que no
  hubo seek. Sobre el break mezclado: `provider.programRanges()` devuelve los rangos
  con los mismos segundos que la tabla que el script imprime, y en un instante de
  adentro de cada aviso del break mezclado `activeAt` devuelve la experiencia que la
  mezcla predice, en el orden que la mezcla declara. La tabla del script y la sección
  `Before you record` del `README.md` dicen lo que la corrida hace, incluido qué pasa
  con el par de compatibilidad durante el break mezclado.

  **El tramo invertido no se afirma acá.** Es lo que la demo cuenta en escenario y se
  juzga mirando los dos panes en el mismo cuadro: lo mira Nicolás corriendo la demo,
  que es además quien lleva la decisión a David.
- **nivel de verificación:** bajo. Es datos y guion de recorrido: la aritmética la
  dicen las lecturas de arriba, y lo que queda es de escenario y tiene su revisor.

  **Queda:** `verificar-cortes` y `npm test` si la task termina tocando algo de
  `lib/`, que no debería. Y la corrida completa de punta a punta sin seek, que es la
  task misma y es lo que se graba.

  **Se fue:** la captura por aviso del break mezclado y la del tramo invertido como
  requisitos de done. La primera la reemplazan las lecturas de arriba; la segunda no
  se reemplaza por nada, porque es exactamente lo que sólo se juzga mirando. Y la
  comparación de la caja pedida contra la dibujada, porque esta task es datos y guion
  de recorrido, no renderizado.
