# Informe de cierre — fase 03: breaks múltiples y repliegue

**Fase cerrada el 2026-09-07 con las cinco tasks en `done`.** Se diseñó y se
ejecutó el mismo día, después de la 04 y con la ventana de grabación del 28 al 30
de septiembre por delante.

## 1. Resumen

La fase construyó **capacidades nuevas** y no arregló defectos, que es lo que la
separa de la 04. Las tres que pidió David están adentro de la corrida que se
graba: un break de cuatro avisos mezclando concurrente y lineal, el asset sin
bloque, y el `decoderCount` viajando hasta el pedido del asset-list.

### El modelo del ADR 0019, construido y verificado

Lo más importante que produjo la fase no es una función: es que **el modelo que el
ADR 0019 fijó resultó cierto en el código**. Un asset sin bloque
`X-AD-CREATIVE-SIGNALING` se reproduce solo, a cuadro entero, con el programa
corriendo detrás; un bloque que falla cae exactamente al mismo lugar. **El aviso
lineal y el repliegue son el mismo camino de código**, y eso dejó de ser una
predicción del diseño para ser una task sola con una sola implementación. Es lo
que David marcó como lo más importante del día y la parte que él llamó "a
production level failover situation".

La verificación que lo sostiene es del estado y no de la pantalla: durante el
aviso a cuadro entero el `<video>` del primario tiene `volume` 0 y **`paused` en
falso**, y el `duration` del primario y el `startTime` y el `duration` del rango
son los mismos tres números antes, durante y después —180, 20 y 48—. Con eso el
ADR 0016 quedó verificado y no afirmado, que es la diferencia entre una demo que
funciona y una que se puede defender.

### La regla de fin la decidió una medición, no un argumento

La tensión entre la regla 5 del contrato —`activeAt` es la única fuente de la
ventana de activación— y la norma —*"the interstitial MUST end upon reaching the
end of the interstitial asset(s)"*— no podía resolverse razonando: las dos
posiciones tienen argumento. **Se corrió un asset-list solapado a propósito**, que
es el único escenario donde el número declarado y la ventana real no coinciden, y
la alternativa mostró lo que cuesta: en el instante del solape `activeAt` devuelve
dos experiencias, `drawn` queda con dos entradas apuntando al mismo `<video>` y
gana la última, así que **el contenido primario terminó a 357,5 píxeles de la caja
que la primera experiencia había pedido**, con el aviso dibujado sobre un área que
el primario ya no ocupaba. Y al cerrarse el solape el aviso que seguía corriendo
se destruyó y se reconstruyó, **tirando 6,09 s de asset ya bajado**: un arranque en
frío en el medio del break, que es justo lo que la T-01 había sacado.

Con eso decidido —la ventana declarada decide, y la divergencia con la norma queda
escrita como tal en `docs/`, con el renderizador diciéndola en consola con el
número—, la fase le devuelve a SVTA una pregunta de especificación en lugar de una
opinión.

### Los hallazgos que nadie pidió

Son cuatro, y ninguno estaba en el diseño.

1. **El `src` de un nodo no distingue dos creativos.** La definición de done de la
   T-01 pedía distinguir el primer aviso del segundo por el `src` del nodo. Un
   asset de media playlist se adjunta con una segunda instancia del player, así que
   el `src` es un `blob:` del MediaSource y no nombra a nadie. **El bloque suponía
   algo que el código no hace**, y la task lo dijo en vez de acomodar el resultado:
   lo que nombra al creativo es el `data-element-id` del nodo y el `uri` del
   elemento del contrato, y las dos lecturas están en la evidencia.
2. **La reserva del prefijo `_HLS_` no era teórica.** El draft reserva ese prefijo
   para sus propios query params, y en la misma corrida el pane de fábrica pide
   `asset-list-linear.json?_HLS_primary_id=<uuid>`. O sea que la maquinaria de
   interstitials de hls.js le pone su huella al pedido — **y esa huella es la que
   la evidencia del par de compatibilidad usa para saber qué pidió cada pane**, que
   es la prueba de que ese player sigue sin modificar. La reserva de la norma y el
   instrumento de la demo resultaron la misma cosa. El nombre quedó
   `qa-decoder-count`, del namespace del vendor.
3. **Dos mutaciones de los tests ponen en rojo a los tests que ya estaban, y es el
   lado caro de la frontera del repliegue.** **M10** —contar un `uri` vacío como
   bloque ilegible— pone diez tests en rojo, **nueve de ellos de los archivos
   anteriores**, porque los seis payloads de la herramienta de SVTA emiten
   `"uri": ""` y dejarían de resolver a su layout. **M15** —exigir un bloque
   `primaryContent`, que la herramienta omite en los dos overlays— pone dieciséis.
   Las dos son la misma familia: **un repliegue que se dispara cuando no debería
   reemplaza un layout señalizado por un aviso a cuadro entero**, y grabar eso es
   grabar un aviso reproduciéndose. El error no es hipotético: la primera versión
   de la T-02 lo cometió y la suite lo atrapó.
4. **El `PLANNED-DURATION` escrito a mano mentía.** Estaba fijo en 12 en los dos
   tags, así que el concurrente de un break de cuarenta y ocho segundos declaraba
   doce. Es inerte para este player —el rango sale de las experiencias y no del
   tag— y **falso para cualquier otro cliente que lea la playlist**. Ahora cada tag
   declara la suma de las `DURATION` de su propio asset-list, leída del archivo.

### La verificación cambió de instrumento respecto de la fase 04, a propósito

La fase 04 verificaba con capturas a tamaño real y **estaba bien**: sus seis
defectos eran visuales —un logo sobre la imagen, el amarillo colgando debajo del
riel, los controles que desaparecían al tocar— y mirar **era** la medición. Acá el
contenido es mecánico: que el aviso 2 arranque cuando el 1 termina, que un asset
sin bloque dispare su `URI`, que un parámetro viaje en el pedido. Una captura no
afirma nada sobre eso —un asset que corta medio segundo antes se ve idéntico en la
foto, y dos creativos del mismo layout también—, así que **cada definición de done
se escribió como una lectura del estado que puede fallar sola**, sin que nadie
mire.

Traer el instrumento de una fase a otra que no se le parece es el error que esta
fase estuvo a punto de cometer, y la corrección llegó antes de ejecutar. Lo que
queda del otro lado del límite tiene su revisor y no se reemplaza por un artefacto
guardado: si la mezcla se cuenta bien en escenario lo juzga Nicolás corriendo la
demo.

### El defecto de diseño que la fase encontró en sí misma

El bloque de la T-05 llevaba adentro, en "qué tiene que cubrir", que la salida de
la inversión del par de compatibilidad **"es decisión de producto y de David"**.
Una fase aprobada no puede llevar una decisión que depende de una persona: cuando
la ejecución llegó ahí **tuvo que frenar y preguntar**, que es exactamente lo que
diseñar la fase existe para evitar. El bloque quedó reescrito diciendo la decisión
—concurrent, concurrent, linear, concurrent con el aviso a cuadro entero tercero,
la inversión aceptada y explicada, las dos alternativas descartadas— y el barrido
de los cinco bloques encontró un segundo pasaje más chico del mismo tipo, en el
cierre del done de la misma task.

De ahí salió el arreglo, y no se quedó en el proyecto: **la regla A4 del repo padre
tiene ahora un gate** —un plan no se aprueba con una decisión pendiente adentro, y
la aprobación no lo levanta— y **se está construyendo el chequeo equivalente en el
validador**. Diferir a la ejecución es autonomía y está bien; diferir a alguien de
afuera es el defecto.

## 2. Decisiones tomadas

**Ninguna con `scope: phase-03`, y una de scope `project` que gobierna la fase
entera.**

- **ADR 0019 — el bloque de layout es una extensión por encima del interstitial
  estándar** (`scope: project`, 2026-09-07). Es la decisión de arquitectura de la
  fase y salió del `DESIGN.md`, corregida por Nicolás por audio antes de que la
  fase existiera. Un asset con bloque lo dibuja nuestro plugin; uno sin bloque se
  reproduce por su `URI` hasta el fin del asset, que es exactamente un aviso lineal
  declarado como se declaró siempre; y un bloque que falla cae al mismo lugar. Es
  `project` y no `phase-03` porque decide cómo se lee el formato y no sólo cómo lo
  lee esta demo. La consecuencia que escribe sin suavizar es que **el degradado no
  es transparente**: la norma no tiene modelo de superposición, así que un cliente
  conforme que no entienda el bloque pausa el primario y el aviso concurrente se
  convierte en uno lineal que interrumpe. Es material para SVTA.

**Tres decisiones que las tasks tomaron y que no son ADR**, porque no cambian cómo
se lee el formato sino cómo lo lee este cliente. Las tres están en el contrato de
`docs/`:

- **El desplazamiento de cada aviso sale de la `DURATION` de nivel superior
  acumulada** (T-01), y no del `start` del item. Lo decidió el caso que todavía no
  existía: el asset sin bloque no tiene dónde llevar un `start`, y `DURATION` es
  obligatorio en cada Asset-Description. Lo que cuesta quedó escrito: la `DURATION`
  es metadato declarado, la capa declara la secuencia y no la corrige.
- **La ventana declarada decide el fin de un aviso** (T-02), con la divergencia con
  la norma escrita como tal y dicha en consola con el número. Tres razones y una
  medición, arriba.
- **La barra marca el break entero con una sola marca, y el ADR 0018 no se
  reescribe** (T-02). El contrato define `kind` por si el rango cambia el largo de
  la línea de tiempo (ADR 0016), y bajo este render el aviso a cuadro entero no lo
  cambia: marcarlo de reemplazo diría que hubo un reemplazo donde no lo hubo. La
  anticipación del 0018 se cumple el día que un aviso de esta capa detenga el
  programa de verdad.

Los ADR **0002, 0003, 0007, 0015, 0016, 0017 y 0018** gobernaron la fase y ninguno
se reabrió.

## 3. Tasks

Las cinco en `done`, cada una con su carpeta de evidencia. Ninguna necesitó plan
escrito: el plan de construcción salía del `DESIGN.md`.

| id | qué dejó | verificación |
| --- | --- | --- |
| T-01 | Un break de tres avisos en secuencia, `itemId` como identidad de cada uno, y la precarga del siguiente 3 s antes | `activeAt` con una experiencia por aviso en 20, 32 y 44; el nodo del segundo es `ad2-overlay`; un rango del 20 al 56; `readyState` 4 antes de cada transición |
| T-02 | El asset sin bloque, el repliegue, la regla de fin y los tres escalones del Apéndice D.5 | Siete corridas con la consola entera; `paused` en falso durante el cuadro entero; 180/20/48 antes, durante y después; el solape medido en 357,5 px y 6,09 s |
| T-03 | `decoderCount` del `attach` al GET, como `qa-decoder-count` | Cinco URLs idénticas carácter por carácter sin configurar, y las mismas cinco más `?qa-decoder-count=3` configurado |
| T-04 | Dieciséis tests nuevos (43 en total) y quince mutaciones | Quince cortes, quince corridas en rojo, sesenta y ocho rojos, ninguna verde |
| T-05 | El break mezclado como quinto de la corrida grabable, y dos datos que mentían corregidos | Una sola corrida de 174 s: 3484 muestras, peor salto atrás 0,000 s, `seeking` vacío, nueve avisos con una experiencia cada uno |

**Tres tasks tuvieron que decidir algo que su bloque no enumeraba, y las tres lo
escribieron en lugar de improvisarlo.** La T-01, que el `src` no sirve para
distinguir dos creativos y qué sirve en su lugar. La T-02, cuáles de los cuatro
casos de "no lo puedo reproducir" se detectan y por qué los otros dos no. Y la
T-03, qué hace la librería con un valor que no es una cuenta: avisa por consola y
no lo manda, que es la forma que `checkConfig` y `ensurePositioned` ya tenían.

**Una mutación que el bloque de la T-04 pedía no se pudo aplicar**, y la razón vale
más que la mutación: el bloque enumeraba "la regla de fin resuelta por `DURATION`
en lugar de por el fin del asset", escrito con la decisión todavía abierta. La
T-02 la cerró en ese sentido, así que eso dejó de ser una mutación de la regla para
**ser** la regla. En su lugar se rompieron las dos formas en que esa decisión se
deshace sin que se note.

## 4. Lo que queda abierto

**Para Nicolás, y con fecha:**

- **El tramo invertido del par de compatibilidad.** Del 144 al 156 el pane de
  fábrica muestra el programa y el nuestro la pantalla tapada, porque el break de
  clase Apple dura 12 s y el nuestro 48. La decisión está tomada y aplicada —se
  acepta y se explica—, y lo que queda son dos cosas: **que Nicolás lo mire
  corriendo la demo**, porque si se cuenta bien en escenario sólo se juzga mirando
  los dos panes en el mismo cuadro; y **que se lo cuente a David antes del sync del
  21**, junto con el argumento del atraso retirado por el ADR 0017, que ya venía
  pendiente de la fase 04. Los dos van en la misma conversación.
- **Trece commits sin pushear** en `git@github.com:qualabs/hls-non-linear-ads-demo`,
  que son toda la fase 03: el diseño, el ADR 0019, las cinco tasks y este cierre.

**De las cinco tasks:**

- **Dos de los cuatro casos de "no lo puedo reproducir" no se detectan**, y los dos
  están escritos con su razón. El `mediaType` que el cliente no soporta no se
  detecta porque en el momento de resolver, el `type` de un asset de media playlist
  es el mismo string para cualquier códec que tenga adentro: el chequeo miraría el
  contenedor y no rechazaría nada de lo que realmente falla. **El layout que pide
  más elementos que los decodificadores declarados sí se puede hacer ahora**: la
  T-02 lo dejó afuera porque el número no existía, la T-03 lo trajo, y el lugar
  donde el bloque inutilizable ya cae al repliegue —`read()`— tiene el número en su
  propio alcance. Es una línea, y no se agregó para no dejar plomería sin
  consumidor.
- **La divergencia con la norma en la regla de fin** queda abierta como pregunta de
  especificación, no de código: este cliente termina el aviso cuando se cumple la
  ventana declarada y la norma dice que termina cuando termina el asset. Está
  escrita en el contrato con lo que promete y lo que no.
- **Las dos preguntas que la fase le devuelve a SVTA**, las dos del `DESIGN.md`:
  qué regla de claves desconocidas tiene el JSON del asset list, que la norma no
  define y de la que depende la mitad de la legitimidad de la extensión; y qué
  atributos del Date Range de interstitial conservan su significado en la clase
  hermana, que venía abierta del ADR 0016.
- **Si el `decoderCount` significa algo real bajo este render.** El primario sigue
  decodificando detrás del aviso a cuadro entero, o sea que no se libera un
  decodificador. La fase no lo midió por diseño —es passthrough y ninguna decisión
  de acá consume ese número— y la pregunta sigue donde estaba, para la fase que le
  dé semántica.
- **La no conformidad del `URI` absoluto** de los asset-list de la demo, declarada
  fuera de alcance y sin corregir.

**Lo que David pidió y quedó afuera de la fase:** la pantalla inicial que pregunta
cuántos decoders hay, el botón de enable/disable de avisos concurrentes, y que el
asset-list cambie según el parámetro, que es trabajo del APS y está fuera de
alcance del proyecto desde el ADR 0005.

## 5. Riesgos que se materializaron

**R2, la inversión del par de compatibilidad: se materializó exactamente como
estaba escrito**, y es el único que lo hizo. Son 12 segundos de 48 y quedaron
aceptados y explicados en la tabla que el script imprime y en `Before you record`.
Lo que el riesgo no anticipó es que su mitigación era el defecto de diseño de la
Parte 1: estaba escrita como "es decisión de producto y de David", que es la forma
que hace frenar a la ejecución.

**R1, el negro en las transiciones de adentro del break: no se materializó, y por
construcción.** La precarga trae el aviso siguiente 3 segundos antes preguntándole
al contrato `activeAt(t + 3)`, y hasta que le toca el nodo está en su caja con
`opacity: 0`, en pausa y muteado. Lo que quedaba de riesgo —que traerlo antes no
alcanzara— lo afirma la lectura: `readyState` 4 en el instante anterior a cada
transición.

**R3, R4 y R5 no se materializaron.** El degradado no transparente está escrito sin
suavizar en el ADR 0019 y nadie lo contó como equivalencia. El contrato no se
amplió a mano alzada: la regla de fin salió como versión del documento con la
medición al lado. Y el calendario no apretó: la fase agregó sobre un escalón que ya
estaba parado.

**Un riesgo que no estaba en la lista y se materializó igual**: que la fase llegara
a ejecución con una decisión adentro. No es un riesgo de esta fase sino de cómo se
diseñan las fases, y por eso el arreglo salió del proyecto y quedó en la regla A4
del repo padre.

## 6. Recomendaciones para la fase siguiente

1. **Pushear los trece commits.** Toda la fase 03 está sólo en local.
2. **Cerrar el caso del `decoderCount` contra el layout**, que ahora es una línea
   en `read()` y era el único de los cuatro casos de repliegue que quedó afuera por
   falta de un dato que ya existe.
3. **Corregir la oración vieja del contrato**: el argumento del campo `kind` cierra
   con "sin este campo la barra no puede pintar dos colores", y desde la T-06 de la
   fase 04 los dos colores están uno en cada pane. Es la recomendación 4 del informe
   de la fase 04, sigue sin pagarse, y este cierre no la tocó porque su alcance
   excluía `docs/`.
4. **Llevar las dos preguntas a SVTA como preguntas de especificación**, no como
   hallazgos de la demo. Las dos tienen la forma que la especificación necesita y
   ninguna bloquea código.
5. **No importar el instrumento de verificación de esta fase a la que sigue sin
   preguntarse si se le parece.** Es la misma corrección que la fase 04 recibió al
   revés, y sale del mismo error.

## 7. Correcciones post-ejecución

`grep -n "post-ejecuci"` sobre el `TASKS.md` de la fase **no devuelve ninguna
línea**, y no hay ningún `feedback-<n>.md` en la fase. **Ninguna de las cinco tasks
necesitó una corrección después de haberse declarado `done`**, igual que en las
fases 01, 02 y 04.

Leído como medición, cuatro fases sin una sola corrección dice algo sobre las
definiciones de done y algo sobre la convención. Lo que sostuvo el `done` acá es
identificable y no es exigencia genérica: **cada definición de done pedía una
lectura numérica del estado con el recorrido corriendo**, escrita antes de saber
qué iba a devolver. Las tres cosas que en otro proyecto habrían vuelto después —el
segundo creativo que no se dibuja, el primario que se detiene sin que se note, la
URL que cambió sin que nadie la mirara— las agarró la lectura, y las tres estaban
pedidas en el bloque.

**Lo que sí volvió, y la convención no lo cuenta**: dos bloques suponían algo que
el código no hacía. El de la T-01 pedía distinguir dos creativos por el `src`, que
es un `blob:`; el de la T-04 pedía una mutación sobre una regla que la T-02 había
cerrado en el otro sentido. Las dos tasks **devolvieron el problema en lugar de
acomodar el resultado**, y eso es lo contrario de una corrección post-ejecución:
es el encargo el que estaba mal, no el trabajo. Es la misma familia que la única
anomalía de la fase 04, y ya van dos.

## 8. Revisión de documentación

Superficie por superficie, con el resultado por superficie.

- **El índice de fases del `PROJECT.md`.** Actualizado en este pase. La línea de la
  fase 03 se reescribió para decir en qué terminó y no en qué consistía su plan: el
  modelo del ADR 0019 construido, la regla de fin decidida midiendo, el break
  mezclado adentro de la corrida que se graba, y el defecto de diseño que la fase
  encontró en sí misma. `last_update` queda en 2026-09-07 y el `status` del proyecto
  en `ongoing`: quedan la grabación, iOS y la especificación de SVTA.
- **La sección "A confirmar" del `PROJECT.md`.** Actualizada en este pase con un
  item nuevo: el tramo invertido del par de compatibilidad, que va contado a David
  antes del sync del 21 junto con el argumento del atraso retirado, que ya estaba
  en la lista. Los dos son la misma conversación y por eso quedan uno al lado del
  otro. El resto de los items no los tocó esta fase.
- **El `PHASE.md` de la fase.** `status: closed` y `closed: 2026-09-07`. **El cuerpo
  no se toca**: es el contrato de la fase y describe correctamente lo que se
  propuso. Queda dicho acá que su mitigación del R2 tiene el mismo defecto que la
  Parte 1 arregló en el `TASKS.md` —"es decisión de producto y de David, porque es
  lo que él cuenta en escenario"— y **no se corrigió**, porque el alcance de este
  cierre eran los cinco bloques de tasks. Es la primera línea a mirar la próxima vez
  que alguien pase por acá.
- **El `TASKS.md` de la fase.** Corregido antes del cierre y en su propio commit
  (Parte 1): el bloque de la T-05 dice la decisión en lugar de diferirla. Las cinco
  tasks ya estaban en `done` con su carpeta de evidencia apuntada, y no hay líneas
  `post-ejecución:` que agregar.
- **El `DESIGN.md` de la fase.** Sin cambios y **a propósito**: es el registro de
  la exploración y no se reescribe para que coincida con lo que las tasks
  terminaron haciendo. Sus dos partes viejas —el cierre de la sección 10 y la
  sección 12 entera— ya estaban anotadas como tales en el `LOG.md`.
- **El `LOG.md` del proyecto.** Entrada de cierre agregada. Las once entradas de la
  ventana de la fase quedan como están: son el registro de lo que pasó.
- **`docs/arc42/`.** **No existe en este proyecto, y este cierre no lo crea.** El
  documento de arquitectura del producto es
  `docs/contrato-senalizacion-renderizado.md`, que la fase 02 creó y el `PROJECT.md`
  nombra como tal. **Lo pusieron al día las tasks y no este cierre**, que es como
  debe ser: la T-01 agregó la regla 6 —dos experiencias se distinguen por `itemId`,
  nunca por `id`— y la sección de cómo se ordenan los avisos de un break; la T-02
  agregó "De dónde sale el fin de un aviso", con la divergencia con la norma escrita
  como tal, y "Qué pasa con un asset que este cliente no puede dibujar", con los dos
  casos que no se detectan y los dos escalones que son del asset-list entero. Se
  re-leyó entero y **sigue describiendo este sistema**. Le queda **una oración
  vieja**, heredada de la fase 04 y no de ésta: el argumento del campo `kind` cierra
  con "sin este campo la barra no puede pintar dos colores", y los dos colores están
  uno en cada pane desde la T-06 de la fase 04. Es la recomendación 3.
- **El resto de `docs/`.** `docs/integrating-the-library.md` al día, y también por
  las tasks: la T-03 agregó `DECODER_COUNT_PARAM` a la superficie pública, el
  parámetro `decoderCount` del `attach` con lo que hace y lo que no, y la sección
  que explica por qué el nombre es `qa-decoder-count` y no `decoderCount` pelado.
  Ninguna otra sección se tocó.
- **El `README.md` del proyecto.** Al día, y por la T-05: la sección "Run it" dice
  que la playlist lleva cinco breaks, cuatro de un aviso y el último de cuatro
  seguidos con uno a cuadro entero, y `Before you record` explica el tramo invertido
  para que quien grabe no lo reporte como defecto. **No tiene línea que apunte a
  `docs/arc42/` ni la puede tener, porque ese directorio no existe**; lo que tiene
  es la tabla de qué hay dónde, que nombra los dos documentos de `docs/` y para
  quién son.
- **`CLAUDE.md` del proyecto.** **No existe, y esta fase no lo necesita.** Las
  convenciones viven en los ADR, en el `PHASE.md` de cada fase y en el `README.md`.
  Lo único que esta fase podría haber querido escribir como convención —que acá se
  verifica leyendo el estado y no mirando capturas— está en el `TASKS.md` de esta
  fase, que es donde corresponde, porque fue la vara de esta fase y no del proyecto:
  la 04 verificó mirando y estuvo bien.
- **`.project/knowledge/`.** No existe y esta fase tampoco la crea. Nada de lo que
  la fase aprendió quedó sin lugar: los hallazgos están en los documentos de las
  tasks, las decisiones en el ADR 0019 y en el contrato, y las mediciones en la
  evidencia.
- **El `CLAUDE.md` y `knowledge/` del repo raíz.** **Sí cambió algo, y es lo único
  de esta fase que salió del proyecto.** El defecto de diseño de la Parte 1 —una
  fase aprobada con una decisión adentro que depende de una persona— produjo el gate
  nuevo de la **regla A4**: un plan no se aprueba con una decisión pendiente
  adentro, *"esto lo decide quien ejecuta, con este criterio"* está bien y *"esto lo
  decide Nicolas"* es un defecto del plan, y la aprobación no levanta el gate. El
  chequeo equivalente en `scripts/validar-proyecto.py` **se está construyendo y no
  está**, así que hoy la regla se sostiene sola.
- **El runbook / doc de instalación.** El proyecto no tiene uno separado: lo que
  cumple esa función es la sección "Run it" del `README.md`, y la fase no agregó ni
  rompió ningún paso de setup. `./run.sh` y `npm start` siguen siendo lo mismo, no
  hay dependencias npm nuevas, y los asset-list que la fase agregó son datos que el
  servidor ya sirve.
