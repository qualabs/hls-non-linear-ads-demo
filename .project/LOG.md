# Log

## 2026-09-02 — Proyecto creado

Proyecto creado a partir de la minuta de la reunión del 2026-09-02 entre
David Hassoun y Nicolás Levy (`tactiq-2026-09-02-001`, Doc
`1ZSrYPeRoNzypDRCLoenWpISu17M9PJ3erWQFkfaPL7U`), que fijó alcance,
fechas y reparto de la demo de publicidad no lineal en HLS para el
evento de Apple del 7 de octubre de 2026.

Tipo `desarrollo` con fecha dura. Owner: Nicolás Levy, que tomó la demo
para sí y no la delegó. Canal del proyecto: `#wg-hls-presentation`.

`projects/` está en el `.gitignore` del repo padre `cto-assistant`, así
que el proyecto es su propio work tree: se corrió `git init` dentro de
`projects/hls-non-linear-ads-demo/` y los commits de este proyecto no
llegan nunca al repo padre.

## 2026-09-02 — Repo qualabs/hls-non-linear-ads-demo creado

Creado en GitHub bajo la organización `qualabs`, **privado** y
verificado como tal (`"private": true`, `"visibility": "private"`),
vacío (`size: 0`). Agregado como remoto `origin` del work tree local.
**Nada pusheado.**

## 2026-09-02 — Fase 01 abierta y generada en el mismo pase

`01-plataforma-y-primer-draft`, en estado `in-progress`. La fase existe
por el riesgo de plataforma: el camino crítico se eligió sobre
información que nadie tiene, y el 21 de septiembre es el día en que se
sabe si aguanta. Cierra en ese hito, con el primer draft andando y el
sync de una hora con David.

El diseño de la fase no necesitó un `DESIGN.md`: la minuta ya trae el
alcance, los layouts, los assets, el timeline y el reparto, así que
`PHASE.md` y `TASKS.md` se escribieron directo. Nueve tasks, T-01 a
T-09, ninguna de fases posteriores.

## 2026-09-02 — ADR 0001: hls.js como camino crítico

Registrada la decisión de plataforma con la reserva explícita de
revisarla cuando lleguen los detalles técnicos que David fue a buscar.
Es la decisión que la T-01 puede llegar a superseder.

## 2026-09-02 — Hueco declarado: los requerimientos de alto nivel no están accesibles

El documento de requerimientos de alto nivel está en una tab de un
Google Doc que Nicolás mencionó y que devuelve 404 desde el CLI y desde
el connector, con todas las cuentas disponibles. El `PROJECT.md` tiene
la sección declarada y **vacía a propósito**: no se dedujo nada ni se
completó con supuestos. Resolver el acceso es parte de la T-07.

Quedan además como a confirmar, tal como la minuta los marca: el nombre
exacto de Roger [?] (la persona del lado de Apple), la forma exacta del
namespace `com.qualabs.hls-concurrent-interstitial` [?], el nombre del
quinto layout ("pullback" [?]), y August [?], la persona con la que
David trabaja el deck.

## 2026-09-02 — Los requerimientos de alto nivel, ahora accesibles

El documento que David armó para la gente del evento se pudo leer. Con
él se llenó la sección de requerimientos que estaba declarada y vacía en
el `PROJECT.md`, y se corrigieron cosas que venían de la minuta:

- **Los layouts son cinco, no seis.** El documento los enumera Overlay,
  LBox Video, LBox Image, Side by Side pullback y Quad (editorial). La
  minuta había partido "Side by Side pullback" en dos y contado el
  editorial por separado.
- **La clase del DATERANGE es `com.qualabs.hls.concurrentInterstitial`**,
  con puntos y no con guiones. Sale textual del documento. Cuando SVTA
  publique, la forma pasa a su namespace,
  `com.svta.hls.concurrentInterstitial`, con el nombre todavía a definir
  del lado de ellos.
- **La persona del lado de Apple es Rob**, no Roger.
- **El Layout Controller es una herramienta de SVTA**, en
  `https://www.svta.org/wp-content/nlag/v4/`, con offsets porcentuales
  relativos al viewport.
- **El stretch de capabilities es más preciso de lo que estaba escrito**:
  pasarle la capacidad al APS en el request del asset list, por
  inyección de parámetro en la URL.
- **El SDK, óptimamente, es una librería** que se incluye en la
  aplicación y se activa si la clase está definida en el DATERANGE.

Con eso se cerraron tres de los cuatro items marcados `[?]`: el nombre
de Rob, la forma del namespace y el nombre del quinto layout. Queda
August [?].

## 2026-09-02 — La detección de capacidades queda fuera de alcance

El documento incluye una especificación técnica completa de detección de
capacidad de decodificación concurrente (draft v0.9 del 2026-08-17,
capítulos 0 a 13). Nicolás la deja expresamente fuera de alcance, y no
como trabajo para más adelante: su posición es que detectar qué puede
hacer cada dispositivo es el encuadre equivocado y que la solución
correcta es dar un listado de opciones. Está escrita en el `PROJECT.md`
con su cita textual, porque es una posición que va a tener que sostener
varias veces: la detección es uno de los dos problemas que David piensa
marcar en escenario, y pasarle la capacidad al APS sigue siendo stretch
de la demo.

## 2026-09-02 — Discrepancia de fechas: el primer draft

El documento dice "First draft of demos Sept 1" y la minuta fija el
lunes 21 de septiembre. No se eligió ninguna de las dos: queda como
pregunta abierta para David en el `PROJECT.md` y en la T-07, y es ahora
el riesgo R3 de la fase 01, que está planificada contra el 21. El resto
del timeline coincide, salvo que el documento no incluye el test run del
5 de octubre.

## 2026-09-03 — Se borra la planificación de la fase 01

Nicolás pidió borrar todo lo planificado y empezar de cero: la fase se había
abierto antes de tener los datos que la fase necesitaba, así que su alcance y sus
tareas describían un trabajo que nadie había podido verificar que fuera el
correcto.

Se borran `phases/01-plataforma-y-primer-draft/` (PHASE.md y TASKS.md) y el ADR
`0001-hls-js-camino-critico.md`.

Quedan en pie `PROJECT.md` y esta bitácora. El PROJECT.md no salió de una
planificación: salió del documento de requerimientos y de la minuta de la reunión
con David Hassoun, que son datos reales.

Esta entrada no se borra junto con lo que describe. Una bitácora sirve
justamente para dejar registro de que algo existió y por qué se sacó; borrarla
haría que el próximo lector no entienda por qué el proyecto tiene un PROJECT.md
y ninguna fase.

## 2026-09-03 — Fase 01 abierta de nuevo, en diseño

Se abre `phases/01-poc-web-hlsjs/` con su `DESIGN.md`, y sin `PHASE.md`
ni `TASKS.md`, que es lo que corresponde a una fase que todavía está en
exploración. El objetivo lo fijó Nicolás: un POC funcional en web usando
hls.js.

El diseño se apoya en dos cosas que se midieron en vez de suponerse. La
primera es el código de `hls.js@1.7.2` bajado del registro de npm, leído
para saber qué hace hoy con los Date Ranges de una clase que no es la de
Apple. La segunda es el código de la herramienta de SVTA
(`https://www.svta.org/wp-content/nlag/v4/`), leído para saber qué JSON
emite de verdad.

## 2026-09-03 — El diseño de la fase 01 se acordó y se generaron los artefactos

Se generaron desde el `DESIGN.md`, sin desarmarlo: el `PHASE.md` con el
contrato de la fase, el `TASKS.md`, y doce ADR en `decisions/`.

Ocho de los doce salen de las decisiones del diseño. Los otros cuatro
salen de decisiones de Nicolás de hoy:

- **0009, de alcance proyecto**: la clase concurrente es hermana de la de
  interstitial y no una extensión. El fundamento es que en HLS la clase
  se compara por igualdad exacta de string y el formato no tiene
  herencia, así que "extensión" promete una compatibilidad que el
  protocolo no puede dar. Contradice al documento de requerimientos de
  David en un punto explícito y es material para la especificación de
  SVTA.
- **0010**: el aviso concurrente arranca en silencio, el primario
  conserva su audio, y hay un control visible para activarlo.
- **0011 y 0012, en estado `proposed`**: el reparto de layouts entre el
  draft y la grabación, y el mapeo de los cinco nombres al campo `type`.
  Son propuestas a David y esperan su confirmación.

El `TASKS.md` se generó a propósito sin tasks de construcción. El diseño
pide tres mediciones antes de comprometer un plan, así que las tres
mediciones son las primeras tasks y la cuarta es la que cierra el plan
con sus resultados.

## 2026-09-03 — Corrieron las tres mediciones de la fase 01

Las tres corrieron en el Chrome real del sistema (Google Chrome 152,
Linux, ocho hilos), sobre contenido HLS empaquetado con ffmpeg y servido
por HTTP desde un directorio temporal. La evidencia quedó en
`phases/01-poc-web-hlsjs/tasks/T-01`, `T-02` y `T-03`, con el banco de
pruebas incluido para poder repetirlas.

**T-01, la concurrencia de decodificadores.** De uno a cinco elementos
`<video>` de 1280x720 a 30 fps, cada uno con su propia instancia de
hls.js, reproducen simultáneamente al 99,6 por ciento del reloj de pared,
con 29,8 a 29,9 cuadros por segundo cada uno y entre 0 y 8 cuadros
descartados sobre unos 358, sin ningún error de hls.js. El multiview no
está bloqueado por concurrencia de decodificadores en esta máquina, así
que el riesgo R2 de la fase queda cerrado y la propuesta del ADR 0011 se
mantiene en pie.

Vale anotar una trampa de método que casi arruina la medición, porque la
va a encontrar cualquiera que la repita: con la pestaña en segundo plano,
un solo video de 720p avanza al 2,7 por ciento del reloj de pared y
decodifica menos de un cuadro por segundo, y `document.visibilityState`
sigue diciendo `visible`. Los primeros números daban imposibles hasta que
la corrida de control con un solo elemento mostró que el problema no era
la concurrencia. La medición válida trae la pestaña al frente antes de
empezar.

**T-02, la cadena de señalización y el par de compatibilidad.** Los tres
hallazgos que hasta ahora eran lectura de código quedaron confirmados en
ejecución. La instancia de fábrica arma su agenda con un solo evento, el
del aviso lineal, y marca la clase concurrente como `isInterstitial:
false`. Las dos instancias reciben los dos Date Ranges completos, con
todos sus atributos, incluido el `X-ASSET-LIST` de la clase concurrente.
La instancia con `interstitialsController` vacío queda sin manager de
interstitials, nunca pide ningún asset-list por su cuenta, y es la
aplicación la que pide el de la clase concurrente y resuelve el layout.
En el `START-DATE` compartido, la de fábrica reproduce el aviso lineal y
la de la demo sigue en el contenido primario, que es el par de
compatibilidad del ADR 0007 funcionando.

**T-03, el render contra la vista previa de la herramienta.** La
geometría cierra exacta: cero píxeles de diferencia entre la caja que
describe el modelo y la que dibuja el navegador, en los quince elementos
de los seis tipos. Lo que el modelo no dice es cómo llena un asset una
caja cuya relación de aspecto no es la suya, y eso pasa en tres de esos
quince elementos: la banda de `lowerThirdOverlay` y las dos barras de
`squeezebackLShape`. Estirado, el aviso queda con 233, 150 y 60 por
ciento de distorsión respecto de su relación original. La política de
llenado la va a tener que decidir el renderizador y el hueco se le
reporta a SVTA, que es lo que manda el ADR 0004.

Dos detalles del formato que emite la herramienta y que no se ven leyendo
el ejemplo: omite el bloque `primaryContent` cuando está en sus valores
por defecto, y omite `volume` cuando vale 100. El renderizador tiene que
asumir esos defaults en lugar de exigir los campos.

Ninguna de las tres mediciones cambió una decisión del diseño. Las tres
la confirman, y la T-03 le agrega al renderizador un requisito que el
diseño no tenía escrito.

## 2026-09-03 — El plan de construcción de la fase 01, cerrado con las mediciones

Las tres mediciones se leyeron con Nicolás y las tres dieron bien, así
que la T-04 cerró el plan: ocho tasks de construcción, de la T-05 a la
T-12, ordenadas como manda el ADR 0008 y mapeadas contra la escalera de
repliegue del `PHASE.md`. El orden es el banco de la demo, la capa de
señalización con su contrato, el mínimo del `cornerOverlay`, los tests de
la resolución del layout, el par de compatibilidad, el squeezeback, el
multiview, y los cinco layouts en un recorrido grabable. Cada escalón de
la escalera queda parado por una task concreta: el piso al terminar la
T-07, y de ahí para arriba T-10, T-11 y T-12.

La vara es la de un POC, y Nicolás la fijó al autorizar el plan: "esto es
una POC que luego podemos cambiar y mejorar". Quedó afuera a propósito
todo lo que no hace que la demo funcione ni destraba una decisión de hoy:
medición de performance, manejo de errores más allá de que no se rompa en
cámara, abstracciones para casos que la demo no muestra, un panel de
debug para mostrar el asset-list (lo muestra la pestaña de red), y
cualquier task de la especificación de SVTA, que Nicolás dejó fuera de
esta fase. De tests va uno solo, sobre las funciones puras de la
resolución del layout, que es lo único que puede romperse sin que nadie
lo vea.

**ADR 0013: la política de llenado.** Es lo que la T-03 dejó abierto y el
plan tenía que decidir. El renderizador llena cada caja con recorte
centrado y sin deformar el asset. De las tres formas posibles es la única
que respeta a la vez la caja que el layout declara y la forma del
creativo: estirar deforma hasta 233 por ciento en un caso ya medido, y
encajar el asset entero deja la caja del aviso parcialmente vacía, que en
cámara se lee como que el player no terminó de dibujar. Lo que se paga es
que un pedazo del creativo no entra, y para esta demo eso se arregla
cambiando el asset. La decisión fija el comportamiento de la demo y no
toma posición sobre el formato: el hueco es real y va a SVTA como
pregunta, porque mientras el modelo no diga por asset el modo de llenado
o la relación de aspecto para la que el creativo está pensado, dos
clientes que cumplen la especificación dibujan el mismo layout distinto.

**Corrección al ADR 0011.** Justificaba meter el Quad en el borrador
diciendo que era el único layout con riesgo sin medir. La T-01 corrió el
mismo día y lo midió, así que el pasaje ahora dice lo que se sabe: hasta
cinco elementos de video conviven, la capacidad está disponible, y el
Quad va temprano porque es el que más muestra de qué se trata la
publicidad no lineal y cuesta lo mismo que cualquier otro layout. El ADR
sigue en `proposed`, que es lo que corresponde a una propuesta que espera
la confirmación de David.

## 2026-09-04 — T-05: el banco de la demo

El repo dejó de tener solamente `.project/`: en la raíz están ahora la
página, el servidor y los scripts de contenido. Sin bundler, sin
framework y sin dependencias de npm, con hls.js vendorizado en 1.7.2 y
sin tocar (ADR 0002). Un comando, `./run.sh`, empaqueta el contenido si
no está y levanta el servidor de archivos estáticos.

Se verificó como está escrito el criterio: clon limpio del repo, un
comando, y el primario reproduciendo. En el Chrome del sistema: hls.js
reporta 1.7.2, el `interstitialsManager` de la instancia queda en
`null`, el VOD primario
reproduce a 1280x720, y la pestaña de red muestra la media playlist más
los segmentos, servidos por el servidor estático y nada más. La página
tiene ya la capa vacía sobre el elemento de video donde el renderizador
va a dibujar, y nada más que eso: no hay layout, no hay Date Range y no
hay experiencia concurrente.

**El contenido.** Big Buck Bunny quedó descartado por pedido de Nicolás,
así que el material es de las otras películas abiertas de la Blender
Foundation, todas bajo Creative Commons Attribution: el primario son
tres minutos de *Tears of Steel*, y los tres avisos cortos salen del
trailer de *Sintel*, de *Caminandes: Gran Dillama* y del teaser de
*Elephants Dream*. La atribución que la licencia exige está en
`CREDITS.md` y al pie de la página. La ventana del primario no arranca
en el principio de la película: se eligió un tramo sin placas de
créditos, sin armas y con la imagen cambiando bastante, porque esto se
graba y un aviso dibujado encima se tiene que ver.

**Dos supuestos del plan que no se sostuvieron.** El esqueleto reusable
de `aws-multiview/demo-ibc/` trae hls.js 1.7.0 y no la 1.7.2 que fija el
ADR 0002, así que la copia vendorizada salió del tarball de npm de la
1.7.2. Y el script de empaquetado de la T-01 no se pudo reusar tal cual:
su entrada son fuentes sintéticas de `testsrc2`, que era lo correcto
para medir decodificadores y es lo contrario de lo que una demo grabada
necesita. Se reusó su invocación de ffmpeg verbatim y se le cambió la
entrada por un archivo real.

Del esqueleto sí se reusó lo demás: la forma de la página, con todo
adentro del contenedor que va a fullscreen; el kit de marca en `brand/`
copiado a disco en vez de linkeado; y la decisión de vendorizar hls.js
en lugar de traerlo de un CDN.

## 2026-09-04 — T-06: la capa de señalización y el contrato

Ya existe el corte en dos capas del ADR 0003, y existe de las dos
mitades. La de abajo, `js/signalling.js`, es la única que sabe lo que es
HLS: se suscribe a `LEVEL_UPDATED`, se queda con los Date Ranges de
clase `com.qualabs.hls.concurrentInterstitial`, pide su `X-ASSET-LIST`
—la aplicación, no hls.js, que sigue con su controlador de interstitials
apagado— y resuelve el bloque `X-AD-CREATIVE-SIGNALING`. La de arriba
recibe un objeto con un método, `activeAt(time)`, y una lista de cajas
en porcentajes. El contrato entre las dos está escrito en
`phases/01-poc-web-hlsjs/tasks/T-06/t06-contrato.md`.

El corte se verificó como se dijo que se iba a verificar, con grep: del
lado del renderizado no aparece ni una vez hls.js, ni un Date Range, ni
un asset-list, ni un manifiesto. Las diecinueve menciones están todas en
la capa de señalización. `js/app.js` conoce los dos lados porque es el
que los une, y es el único.

En el Chrome del sistema, con la playlist que lleva los dos Date Ranges
en el mismo `START-DATE` —la forma que midió la T-02—, el Date Range
concurrente se resuelve a `t=20.00s` contra el
`EXT-X-PROGRAM-DATE-TIME` del primario, y la consola anuncia la
experiencia a los `20.07s` con sus dos cajas ordenadas por `zDepth`: el
contenido primario en z0 con el cuadro entero, y `adOverlay1` en z1 con
la caja `0 75 75 0`. A los `32.02s` dice que no hay nada activo. Todavía
no se dibuja nada encima del video: eso es la T-07.

**Las tres cosas que podían fallar en silencio.** Los dos defaults que
la herramienta de SVTA omite se asumen y no se exigen, así que los seis
payloads que la T-03 guardó verbatim resuelven todos, incluidos los dos
overlays que no traen el bloque `primaryContent`; quedaron resueltos en
`t06-los-seis-payloads-resueltos.json`. La ventana de activación es
semiabierta y se verificó en sus cuatro bordes. Y el orden por `zDepth`
es ascendente y estable, que es lo que hace que en `squeezebackFrame` el
aviso quede de fondo y el contenido primario encima.

**Lo que el plan no tenía previsto.** La playlist señalizada no puede
ser un archivo en git, porque su `START-DATE` se resuelve contra el
reloj que el empaquetado escribe y ese reloj es la hora de pared de
cuando se empaquetó. Es un artefacto generado:
`scripts/senalizar-contenido.sh` la escribe desde la playlist del
primario y `run.sh` la reescribe en cada arranque. Por el mismo motivo
esta task se llevó puestas dos piezas que el bloque de la T-07
enumeraba, el tag en la playlist y el asset-list servido al lado, porque
sin ellas el done de la T-06 no se podía cumplir.

**Y un cruce que conviene tener anotado.** La herramienta no emite
`volume` en ninguno de los seis layouts, así que el default asumido es
100 en todos los elementos, aviso incluido. El ADR 0010 pide leer ese
campo como estado inicial del control de audio, y con este default eso
sería un aviso a todo volumen. Manda la decisión del mismo ADR: el
aviso arranca en silencio. Le toca a la T-07.

## 2026-09-04 — T-07: el mínimo en pantalla, y el escalón 4 parado

El primer aviso concurrente está dibujado. La capa de renderizado es
`js/renderer.js`: toma el proveedor del contrato, convierte los cuatro
porcentajes de inset a la caja en píxeles sobre el área del player,
dibuja cada asset como un elemento posicionado encima del video primario
y llena cada caja con recorte centrado, con el modo en una sola
constante como pide el ADR 0013. Con eso queda parado el escalón 4 de la
escalera de repliegue, que es el piso de la fase: desde acá siempre hay
algo grabable.

En el Chrome del sistema, con la página cargada y **sin ningún seek**, el
primario reproduce y a los 20 segundos el aviso aparece solo en la
esquina superior izquierda. El área del player es 1280x720 y la caja del
aviso 320x180 desde 0,0. A los 32 desaparece y el primario vuelve al
cuadro entero.

La caja dibujada coincide con la que el contrato pidió: **0,00 píxeles de
diferencia** en los dos elementos, midiendo el rectángulo que el DOM
reporta contra la cuenta de los porcentajes hecha aparte del
renderizador, y otros 0,00 con el player en 960x540 después de un
resize, que es lo que prueba que la conversión se recalcula. Es el mismo
cero que midió la T-03 entre el modelo de SVTA y lo que el browser
dibuja.

En la red están las tres piezas de la cadena, las tres con 200: la media
playlist con el tag, que pide hls.js; el asset-list JSON, que pide la
aplicación; y el contenido del aviso con sus seis segmentos, que pide la
segunda instancia de hls.js. El asset-list del Date Range de clase Apple
sigue sin pedirlo nadie.

**El control de audio del ADR 0010 se probó, no se declaró.** El aviso
arranca muteado; un click real lo desmutea, el segundo lo vuelve a
mutear, y el estado del primario no lo toca nadie en todo el recorrido.
Con los dos en silencio, la salida de la máquina son 32000 muestras de
silencio exacto y Chrome no tiene un solo stream de playback abierto; al
clickear el control, Chrome abre un stream sin mutear con el primario
todavía en silencio, así que el sonido que aparece es el del aviso. Los
dos elementos decodifican audio al mismo tiempo. Lo que no se pudo medir
es el nivel de la salida mientras suena: en esta máquina `parec` devuelve
cero bytes sobre el monitor del sink cada vez que algo suena, y se
reproduce con un tono de 440 Hz sin browser de por medio, así que es el
stack de audio de la sesión y no la demo.

**Lo que el bloque no tenía previsto, y es lo que vale de esta task.** El
contrato estaba incompleto, y no en los datos sino en una capacidad: da
el `uri` y el `mediaType`, que alcanzan para saber qué va en la caja,
pero en un browser un `uri` de media playlist no lo reproduce el
elemento de video solo, y ésa es la única cosa que el renderizado
necesita y no puede hacer sin cruzar la costura. Se resolvió sin romper
el corte: el renderizado **recibe** una función `attachAsset` que
devuelve cómo desconectar, y quien la implementa es `js/app.js`, que es
el archivo que conoce los dos lados porque es el que los une. El corte
se verificó otra vez con grep y del lado del renderizado no hay un solo
hit. El día que la capa de abajo se reemplace, esa función se reemplaza
con ella.

Y una que es de escenario y no de código: la página arranca el primario
muteado para que la política de autoplay deje empezar sin un click, así
que si el operador enciende el audio del aviso sin haber desmuteado
antes el primario, lo que se ve es exactamente lo contrario de lo que el
ADR 0010 quiere mostrar. Es una instrucción de la grabación, y le toca a
la T-12.

## 2026-09-04 — T-08: los tests de la resolución del layout

Quince tests en `test/layout-resolution.test.js`, que corren con `npm
test` —`node --test`, sin una sola dependencia— y pasan los quince. La
task existe por una razón sola: la resolución del layout es lo único de
la fase que puede fallar en silencio, porque todo lo demás se ve en la
pantalla y los layouts se miran de a uno. El parseo, los defaults, el
orden y la ventana de activación pueden estar mal para un layout
mientras el que se está mirando anda bien.

Los casos salen de datos reales y no inventados: el test lee los seis
payloads verbatim de la herramienta de SVTA de la evidencia de la T-03,
entra por `resolveAssetList` —la misma puerta que usa `js/app.js`— y
compara las quince cajas contra los píxeles que la misma T-03 midió
sobre un área de 960x540, con igualdad exacta. Un test escrito con un
payload inventado sólo probaría que el código hace lo que creía quien lo
escribió.

**Cada test se vio en rojo antes de darlo por bueno.** Se rompió a mano
una cosa por vez en la lógica de producción, se corrió la suite, se
anotó qué test se puso rojo y se devolvió el código: dieciocho
mutaciones, ninguna sobrevivió, y los quince tests aparecieron en rojo
por lo menos una vez. Ningún test destapó un defecto, así que el diff de
la task son los tests y su evidencia; `js/` no se tocó.

Tres casos hubo que inventarlos porque no hay payload real que los
ejercite, y el que importa es un `volume: 0` explícito. La herramienta no
emite el campo nunca, así que la capa asume 100 en los seis layouts; pero
el día que alguien mande un aviso deliberadamente en silencio, un `||`
en lugar de un `??` lo convertiría en uno a todo volumen y nada en la
pantalla lo diría. Los otros dos son un `viewport` que no trae cuatro
números y un empate de `zDepth`.

De paso quedaron a la vista tres cosas del código que el bloque no
decía. Los datos de la T-03 no se cruzan por `id`, porque el único aviso
de tres layouts le sale a la herramienta como `adOverlay1` y la T-03 lo
llamó `asset1`. La caja medida a 960x540 no alcanza para cubrir la
conversión: una mutación que cablea el 960 pasa los quince elementos, así
que hay un test más al doble del área. Y `DEFAULT_PRIMARY` no cambia el
comportamiento —los defaults por campo dan lo mismo—: documenta el
supuesto y evita un warning, no lo sostiene.

## 2026-09-04 — T-09: el par de compatibilidad en la página de la demo

La página es dos players, y con eso queda hecho el argumento más fuerte
que la demo puede hacer, que no es visual: esto se despliega sin
romperle nada a los clientes que ya están en el mercado. A la izquierda,
hls.js a su configuración de fábrica sin nada de esta demo adentro; a la
derecha, la misma librería, la misma versión y sin tocar, con las dos
capas encima. **Los dos cargan la misma URL**, que en el código es la
misma constante y en la página está impresa debajo de cada player.

El instante está en una sola captura, porque la evidencia es que ocurre
simultáneamente: a los 20,81 s del primario la instancia de la demo
sigue en el contenido con el `cornerOverlay` encima y la de fábrica está
a 0,6 s del aviso lineal, con el contenido fuera de la pantalla. Sin
ningún seek, las dos arrancando de cero y cruzando el `START-DATE`
reproduciendo, que es lo que va a pasar en la grabación. La playlist se
sirvió exactamente dos veces, una por cliente.

Lo que la T-02 midió se sostiene ahora que comparten página: las dos
instancias reciben los dos Date Ranges completos, la de fábrica agenda un
solo evento y la de la demo tiene el manager de interstitials en `null`.
Y no se pisaron en nada: con tres elementos decodificando a la vez, los
tres al 100 % del reloj de pared, a 30 cuadros por segundo y con cero
descartados. Es el resultado de la T-01 otra vez, ahora con un
controlador de interstitials encendido en una de las instancias, que era
justamente lo que la T-01 no tenía.

Cuatro cosas aparecieron al hacerlo. La primera es que esta task no
agregó nada de señalización: el `EXT-X-DATERANGE` de clase Apple y su
asset-list estaban servidos desde la T-06, así que el argumento de
compatibilidad estaba latente en la playlist hacía dos tasks y lo único
que faltaba era alguien en la página que lo mostrara.

La segunda corrige un renglón de la T-06 y de la T-07: el asset-list del
Date Range de clase Apple ya no es cierto que no lo pida nadie, lo pide
la instancia de fábrica. Y se ve de quién es cada pedido sin
instrumentar nada, porque el de la de fábrica lleva el
`?_HLS_primary_id` que hls.js le agrega y el del concurrente, que lo
pide la aplicación, no lleva nada.

La tercera es un segundo argumento que salió gratis y que nadie fue a
buscar: cuando el aviso termina, la instancia de fábrica vuelve al
primario en el segundo donde lo había dejado, mientras la de la demo va
doce segundos más adelante. El cliente de mercado se perdió los doce
segundos de programa que reemplazó y el de la demo no se perdió
ninguno, y eso se ve en un solo cuadro con los dos en escenas
distintas. Es material de guión para la T-12.

La cuarta es de etiquetado y sale de la anterior: los dos paneles no
pueden compartir un reloj, porque el tiempo que reporta un cliente de
mercado mientras reemplaza es el del aviso y no el del programa. Lo que
distingue un estado del otro no es el número sino de dónde sale, así que
la etiqueta de la izquierda se arma con `interstitialsManager.playingItem`,
que es la misma propiedad que ya había leído la T-02.

## 2026-09-04 — T-10: el mecanismo de squeezeback

El segundo de los tres mecanismos anda, y con él queda parado el escalón
3 de la escalera. Es el primero que **mueve el contenido primario**: el
video se achica con una transformación de CSS a la caja que declara su
`primaryContent` y las dos barras del `squeezebackLShape` se dibujan en
el espacio liberado. En el renderizador el método que coloca se partió
en dos, porque los dos tipos de elemento llegan a su caja desde lugares
distintos: un nodo del aviso lo crea el renderizador y la caja **es** su
geometría, mientras el primario ya está en pantalla y lo único que hay
que hacer con él es moverlo. El layout entra por datos, un asset-list
más en `signalling/`, y el interruptor de cuál señalizar es un argumento
del script que escribe la playlist.

La geometría vuelve a dar cero: 0,00 px de diferencia entre la caja que
pidió el contrato y la que dibuja el navegador en los tres elementos,
con el área del player en 715x402,19, y otros 0,00 px después de un
resize a 435x244,69. El mismo cero de la T-03 y de la T-07, ahora con el
primario movido por una transformación en vez de redimensionado.

El layout se eligió porque pone a prueba la política de llenado, y la
prueba salió limpia: las dos barras son las cajas más lejanas del
aspecto del asset entre las quince que midió la T-03 —0,7111 y 4,4444
contra un asset de 1,7778— y con recorte centrado cada una deja afuera
el 60 % del asset sin estirar nada. Los 60 % y 150 % de deformación que
la T-03 calculó para esas mismas cajas son lo que costaría llenarlas
estirando, y no se paga. Entre el mismo cuadro dibujado con recorte y
dibujado estirado cambia el 55,27 % de los píxeles, así que la constante
del ADR 0013 no es decorativa.

El detalle de apilado del que había que cuidarse muerde de verdad, y lo
que lo evita es una palabra: `position`. Una transformación crea un
contexto de apilado propio pero no posiciona el elemento, y `z-index` en
un elemento estático se ignora, así que un primario achicado solamente
con la transformación pierde su `zDepth`. Se midió con la nota que la
T-07 dejó para esta task, y con el caso que ningún layout ejercitaba:
una experiencia sintética con el aviso detrás del primario, el de atrás
pintado de un color. Con el primario posicionado ese color ocupa el
63,85 % del cuadro, que es exactamente el 64 % que queda afuera de su
caja; sacándole el `position` pasa al 99,73 % y el contenido primario
desaparece detrás del aviso. La nota de la T-07 queda cerrada.

Y aparece un límite del mecanismo que el ADR 0001 no dice: la
transformación solo achica el primario sin deformarlo mientras su caja
conserve la relación de aspecto del área del player, porque si no la
conserva la escala es distinta en cada eje y el modo de llenado no puede
salvarla —la transformación escala lo que `object-fit` ya dibujó—. La
nota final del ADR 0013, que el recorte nunca le toca al primario, es
cierta en los seis payloads de la herramienta, pero la razón es más
fuerte que lo que el ADR dice: con este mecanismo la política de
recorte no llega al primario. El renderizador avisa en vez de deformar
en silencio.

Dos cosas quedan anotadas para más adelante. El invariante que sostiene
el orden no lo cubre ningún test: los 15 de la T-08 son lógica pura
sobre la resolución del layout, y esto solo falla en pantalla. Y la
elección de creativos de la T-12 gana un criterio: la primera corrida
del layout dio un squeezeback con las dos barras casi negras, porque uno
de los assets tiene una luminancia media de 7 a 30 sobre 255 en sus doce
segundos, y una barra negra no permite ver si el aviso está deformado.
No alcanza con que el recorte no se coma nada importante; el cuadro
también tiene que tener luz para que se lea en cámara.

## 2026-09-04 — T-11: el mecanismo de multiview, y el escalón 2 parado

El tercero de los tres mecanismos anda, y con él queda parado el escalón
2 de la escalera: los tres mecanismos con un layout de cada uno, más el
par de compatibilidad. Es el que el ADR 0008 dejó para el final porque
era el único que dependía de una capacidad que había que medir antes de
comprometerla, y **entró sin una línea de código**. El diff contra la
T-10 son dos cosas y las dos del lado de los datos: el asset-list de
`multiView` con las URIs de los tres assets puestas, y un comentario en
el script que escribe la playlist. Ningún archivo de `js/`, `css/`,
`index.html` ni `test/` cambió.

Los cuatro cuadrantes reproducen a la vez, y la medición entra a la
ventana sin seek: la página se carga y se deja llegar a los 20 s sola.
En la pestaña hay cinco elementos de video y cinco instancias de hls.js,
porque a los cuatro del layout se suma el player de fábrica del par, y
en 9,01 s de reloj de pared los cinco dan el mismo número: `rateVsWall`
0,999, 30,0 fps, cero cuadros descartados, cero corruptos y ningún error
de hls.js. La T-01 había medido 0,996 y cuatro descartados con cinco
elementos en su banco de pruebas; en la página los números son los
mismos dentro del ruido, con los descartados en cero. La capacidad que
autorizaba esta task quedó confirmada donde importa, que es la página
que se va a grabar.

La geometría vuelve a dar cero por cuarta vez: 0,00 px entre la caja que
pidió el contrato y la que dibuja el navegador en los cuatro elementos,
con el área del player en 715x402,19 y cada cuadrante en 357,5x201,09, y
otros 0,00 px después de un resize. Y este layout es el otro extremo de
la política de llenado del ADR 0013: las cuatro cajas son cuadrantes del
área del player, así que conservan su relación de aspecto y el recorte
es cero, contra el 60 % que dejaban afuera las dos barras del
squeezeback.

Del audio se pudo medir una parte y conviene tenerla separada de la que
no. Lo que sostiene que el sonido sale del contenido primario son el
`muted` de cada uno de los cinco elementos —los tres cuadrantes del
aviso muteados y el primario no, y un elemento muteado no rinde su audio
a la salida—, los streams de playback que Chrome abre en el sink del
sistema —cero con los cinco muteados, uno en el instante en que algo se
desmutea— y el audio que cada elemento decodifica, que es el mismo esté
muteado o no y por eso dice quién decodifica y no quién se escucha. Lo
que **no** se pudo medir es el nivel de la salida mientras suena:
`parec` devolvió cero bytes en los cuatro estados, incluido el estado en
que nada sonaba, mientras el mismo comando desde una shell con la página
cerrada devuelve 32000 muestras de silencio exacto. La T-07 había leído
ese cero como "cero bytes cuando algo suena"; con esta corrida el cero
también aparece con nada sonando, así que lo que hay es un instrumento
poco confiable en esta sesión y no una regla, y no se apoya nada en él.
De fondo hay además una razón para no volver por ese camino: el monitor
del sink graba la mezcla, así que funcionando diría que algo suena y no
cuál de los cuatro elementos.

Tres cosas quedan anotadas. La primera es que los tres mecanismos del
ADR 0008 son dos caminos de código y no tres: el ADR los separa por lo
que hacen en pantalla, que para ordenar el trabajo por riesgo fue lo
correcto, pero en el renderizador un multiview es un squeezeback con
cuatro cajas. Lo que el ADR anticipa para los layouts de un mismo
mecanismo vale también cruzando la frontera entre el B y el C.

La segunda es que el control de audio del ADR 0010 es uno para todo el
aviso, y con tres fuentes concurrentes esa pregunta se ve: el botón
enciende los tres cuadrantes a la vez y aparece la de cuál querría
escuchar quien mira. Hoy no hay dato para contestarla, porque la
herramienta no emite el `volume` que su propio modelo tiene por
elemento, así que una mezcla por cuadrante sería inventada. Es el hueco
que el ADR 0010 ya había anotado, y el multiview lo vuelve una pregunta
concreta para SVTA.

La tercera es de assets y le toca a la T-12. La nota que la T-10 dejó
sobre la luz de los creativos ahora está medida a lo largo de toda la
ventana: el teaser de *Elephants Dream* no pasa de 42,4 de luminancia
media en ninguno de los doce segundos, y en el mejor instante el 66 % de
su cuadrante sigue siendo casi negro. La salida que usó la T-10, que fue
cambiar el asset oscuro por otro, acá no existe: el layout consume los
tres assets de aviso del repo de una sola vez, porque la cuarta fuente
es el contenido primario. El listado de SVTA que la T-12 va a pedir
necesita al menos un asset más, y con luz.

## 2026-09-04 — T-12: los cinco layouts en una corrida, y el escalón 1 parado

El recorrido es una sola playlist con diez `EXT-X-DATERANGE`, cinco pares
de la misma `START-DATE`: uno de la clase concurrente por layout y uno de
la clase de Apple al lado, que es el par de compatibilidad de la T-09
repetido cinco veces. Los cinco nombres del documento de requerimientos
quedan cubiertos con el mapeo del ADR 0012 —Overlay a los 20 s, LBox
video a los 45, LBox image a los 70, Side by side pullback a los 95 y
Quad a los 120— y los cinco breaks duran doce segundos.

El done está en una sola corrida y sin tocar el reloj de nadie: la
página se carga una vez, llega sola a cada break y de cada uno sale una
captura a tamaño real. No es una promesa del script, es una lectura de la
página: el elemento primario lleva un contador de eventos `seeking` y la
corrida termina con la lista vacía, con una sola carga y sin un error de
consola. Y avanza al reloj de pared: 160,0 s de programa en 160,15 s de
pared, o sea 0,999, el mismo número de la T-01 y de la T-11.

Lo único que agregó código es el asset de imagen del LBox image, y son 24
líneas en dos archivos: la función que decide si el nodo es un `<img>` o
un `<video>` según el `mediaType`, la que separa los nodos del aviso que
tienen línea de tiempo y audio de los que no, y la rama de imagen de
`attachAsset`, que es un `src` y nada más. Más dos líneas de
`Content-Type` en el servidor estático. Los cinco breaks, los cinco Date
Ranges, los dos asset-list nuevos y el recorrido entero son datos y no
aparecen en el diff de código: es lo que el ADR 0008 anticipaba, ahora
contado en líneas.

La geometría vuelve a dar cero por quinta vez: 0,00 px entre la caja que
pidió el contrato y la que dibuja el navegador en los catorce elementos
de los cinco layouts, y otros 0,00 px en los catorce después de un
resize. Dos de esas catorce cajas no son un elemento de video sino una
imagen, y el llenado del ADR 0013 las trata igual: las dos barras del L
dejan afuera el 60 % del asset en el break de video y en el de imagen,
porque la caja no cambió y el tipo de asset no le importa a la política.

Del audio quedó un caso que el ADR 0010 no cubría. El control anda en
cuatro de los cinco breaks, y en el quinto no hay nada que encender
porque los dos assets son cuadros fijos. El botón lo dice en lugar de
quedar gris como si no hubiera aviso en pantalla, que son dos estados
distintos y en cámara se distinguen. La otra mitad de la pregunta de
audio, la que dejó abierta la T-11 —cuál de las fuentes concurrentes
querría escuchar quien mira—, no se contestó: quedó anotada como pregunta
para SVTA en el `PHASE.md`, junto con una segunda que apareció acá, que
es dónde va un asset que es una imagen cuando el `URI` del `ASSET` que lo
contiene es un campo de HLS y espera algo reproducible.

El segundo argumento de la T-09 quedó atrapado en un cuadro. Como los
cinco breaks llevan también su Date Range lineal, el cliente de fábrica
reemplaza cinco veces y vuelve al primario donde lo había dejado: a los
160 s va 49,5 s de programa atrás del nuestro, los dos en el contenido
primario y en escenas distintas. Los doce segundos por break que declara
el tag le cuestan 12,4 s de programa, y esta medición no separa el costo
de la transición de una detención del player de la izquierda.

La instrucción de grabación que la T-07 dejó pendiente quedó donde la lee
quien graba y no en una evidencia: abre la sección `Before you record`
del `README.md` y `./run.sh` la imprime en cada arranque junto con la
tabla de los cinco breaks. Hay que desmutear el contenido primario con el
control nativo antes de tocar el botón del aviso, porque la página
arranca muteada por la política de autoplay y encender el audio del
aviso con el primario en silencio muestra lo contrario de lo que el ADR
0010 quiere mostrar.

Y los assets. Cuatro de los cinco layouts quedan bien y uno no, y está
medido: el barrido de luminancia de la T-11 se corrió sobre las tres
fuentes enteras para elegir la ventana de doce segundos de cada creativo
—la ventana cuyo instante más oscuro es el más claro posible— y adentro
del navegador sobre los cinco breaks. El asset más oscuro de cada layout
mide 162,7, 151,6, 135,1 y 162,7 en los cuatro primeros breaks, y 24,5 en
el Quad. El Quad es el que se queda sin material y no hay con qué
arreglarlo desde acá, porque consume los tres assets de aviso de una sola
vez; y no es la ventana elegida sino la fuente: en los 75 segundos del
teaser de *Elephants Dream* no hay un instante que llegue a 46 de
luminancia sobre 255. El pedido para David es un creativo de video de
doce segundos, 1280x720 o más, con media arriba de 100 y sin ningún
instante por debajo de 40. Y el del LBox con video, que es el que David
marcó como el más difícil de conseguir, hoy está cubierto recortando el
60 % de un clip de 16:9: lo que falta ahí no es luz sino un creativo
hecho para la forma de la barra, o que el modelo diga por asset la
relación de aspecto para la que el creativo está pensado.

Con esto la fase tiene parado el escalón 1 de la escalera de repliegue,
que es el que se graba, y las ocho tasks de construcción están cerradas.

## 2026-09-04 — Fase 01 cerrada

`phases/01-poc-web-hlsjs/` pasa a `closed` con su informe en `REPORT.md`.
Doce tasks, las doce en `done`, ninguna abandonada ni bloqueada, y
dieciséis commits en el work tree del proyecto, ninguno pusheado.

**El resultado es que el POC existe y anda**: los cinco layouts del
documento de requerimientos en una sola corrida de punta a punta, sin un
solo seek, sobre hls.js 1.7.2 sin modificar y con su controlador de
interstitials apagado, con una instancia de fábrica al lado sobre la misma
playlist mostrando que un cliente de mercado sigue funcionando. Es el
escalón 1 de la escalera de repliegue del `PHASE.md`, que es el que se
graba, y quedó parado diecisiete días antes del hito del 21 de septiembre
contra el que la fase estaba planificada.

**Ninguno de los cuatro riesgos de la fase se materializó.** El R2, la
concurrencia de decodificadores, es el que se cerró con un número: la
T-01 midió cinco elementos al 0,996 del reloj de pared en un banco de
pruebas y la T-11 volvió a medir lo mismo en la página que se va a
grabar, con cinco elementos de video y cinco instancias de hls.js en la
misma pestaña, al 0,999 y con cero cuadros descartados. La segunda
medición salió mejor que la primera. Sí se materializó, en parte, un
riesgo de los que cruzan fases: el de los assets del L-box con video.

**Lo que queda abierto está consolidado en la sección 4 del informe** y
replicado en el `PROJECT.md`, que es el documento vivo donde alguien lo
va a buscar: los ADR 0011 y 0012 esperando la confirmación de David, el
pedido de assets con números, los dos LBox que declaran el mismo `type`,
`squeezebackFrame` sin correlato en los cinco nombres, las preguntas de
audio y de llenado para SVTA, la fecha del primer draft, y un artefacto
de decodificación en un cuadro del panel de fábrica al que no se le
inventa una causa.

**El cierre encontró dos números mal en el registro de la T-12**, y los
dos quedaron anotados como `post-ejecución:` sin reescribir el original.
El primero: el cliente de fábrica reemplaza cuatro veces en la corrida y
no cinco, y la consecuencia es de grabación, porque el quinto aviso
lineal no se ve nunca en el panel de la izquierda dentro del recorrido.
El `README.md` arrastra el mismo cinco y hay que corregirlo ahí, que es
donde lo lee quien graba; quedó fuera de este cierre, cuyo alcance era
`.project/`. El segundo: el piso de luminancia que el pedido de assets le
pide a David no lo cumple uno de los dos creativos que el pedido cita
como referencia, así que se le pide como criterio deseado y no como el
estándar que el material ya cumple.

El `status` del proyecto queda en `ongoing`: quedan la grabación, la
parte de iOS que entra por Emil, y la especificación de SVTA.

## 2026-09-04 — Fases 02 y 03 abiertas y generadas en el mismo pase

Las dos en `planning`, con su `PHASE.md` y su `TASKS.md` escritos en el mismo
pase, más tres ADR. Sale de la reunión del 2026-09-04 con David Hassoun y de
las decisiones que Nicolás tomó sobre el análisis de
`propuesta-de-fases-post-01.md`. No hizo falta un `DESIGN.md`: las decisiones
llegaron tomadas, así que la generación es lo único que quedaba.

**`02-sdk-y-controles`, ocho tasks.** El SDK y sus controles son una sola fase
porque el límite del SDK y la propiedad de los controles son la misma
decisión, y separarlas significa tomarla dos veces: el renderizado ya es hoy
dueño del elemento que va a fullscreen y mueve el primario con un `transform`,
así que un tercero no puede quedarse con sus controles nativos sobre ese
elemento. **El corte va primero adentro de la fase**, porque lo construido
antes nace del lado equivocado de la línea. Después el contrato promovido a
`docs/` y ampliado, después los controles, los rangos marcados y el volumen,
después los tests, y al final el skin y la documentación del integrador.

**`03-breaks-multiples-y-repliegue`, ocho tasks**, y **no arranca antes de que
cierre la 02**. Su primera task es una medición, como la T-01 de la fase 01,
porque el aviso lineal en el medio de un break es el único item que queda en
el proyecto capaz de reabrir un ADR de la fase 01: es un reemplazo, el
contrato no tiene noción de primario pausado, y el ADR 0002 apagó justamente
esa maquinaria. Las tasks de construcción están escritas contra lo que hoy se
sabe y la T-02 las puede reescribir con la medición en la mano.

**Tres ADR.** El **0014** respeta el `volume` que declara el asset list y fija
el default del campo ausente en 0, o sea silencio; supersede al **0010**, que
queda en `superseded` con `superseded_by: 0014` y el cuerpo sin tocar. Es una
divergencia deliberada con la semántica de SVTA —para la herramienta de David
el campo ausente vale 100— y la razón es que audio inesperado en cámara es
peor que audio faltante; va a la lista de cosas para SVTA. El **0015** fija el
límite del SDK y la propiedad de los controles, y es el que gobierna la fase
02: se decide al principio y se verifica con un grep, como la 01 hizo con el
0003. El **0016** registra que la clase concurrente no tiene ninguno de los
dos modos del interstitial tradicional —ni reemplaza un tramo ni se inserta
estirando la línea de tiempo—, lo que refuerza el 0009 desde otro lado y es lo
que sostiene que la barra no crezca y que el largo se relea.

**`PROJECT.md`**: las líneas de las dos fases nuevas, la de "fuera de alcance"
sobre detección de capacidades reescrita —lo que queda afuera es el modelo, y
el passthrough del `decoderCount` entra en la fase 03—, y la pregunta del
`volume` para SVTA corregida, porque la herramienta sí lo emite cuando no vale
100.

**Lo que quedó afuera a propósito**: iOS, los ADR 0011 y 0012, el modelo de
detección de capacidades, el link desplegado para David, la pantalla inicial
de la demo que pregunta cuántos decoders hay, y que el asset-list cambie según
el parámetro, que es trabajo del APS.

Nada de código: el pase tocó `.project/` y nada más. Commit sin push.

## 2026-09-04 — T-01 de la fase 02: la línea del ADR 0015, dibujada antes de construir

El repositorio pasó a ser dos cosas. La librería es `lib/` —señalización,
renderizado, el `attachAsset` que salió de `js/app.js` y un punto de entrada que
los junta— y la demo es `index.html`, `css/` y `js/`. Es una mudanza y no un
rediseño: los cinco breaks llegan a los mismos instantes que midió la T-12 de la
fase 01, en una sola carga, sin un solo seek y sin un error de consola.

**El empaquetado se resolvió con un paso que arma la librería** y no con un
archivo escrito a mano. `scripts/construir-libreria.sh` concatena los cuatro
archivos de `lib/`, saca los `import` y los `export`, envuelve en un IIFE y
define `window.QualabsConcurrentHls`; `run.sh` lo corre en cada arranque, como
ya corre el que escribe la playlist señalizada. El argumento no es de gusto: el
grep del ADR 0003 es **por archivo**, así que una librería escrita como un solo
archivo dejaría de ser verificable el mismo día en que se separa; y los quince
tests importan las funciones puras de las dos capas como módulos ES, de manera
que un archivo clásico obligaría a reescribirlos. Lo que protege la
concatenación no es la expresión regular sino un `node --check` sobre una copia
`.cjs`, donde un `import` sobreviviente o un nombre declarado dos veces son
errores de sintaxis.

**El `interstitialsController` del ADR 0002: la librería verifica y avisa.** No
puede exigirlo —el controlador se instancia en el constructor de hls.js, así que
cuando la instancia llega ya está decidido— y documentarlo no alcanza porque el
error es silencioso: con la maquinaria encendida el player agenda el Date Range
de clase Apple y reemplaza el contenido, o sea que el integrador ve un player
normal funcionando bien. Tirar una excepción sería una promesa más grande de la
que un plugin puede hacer sobre algo que se arregla en una línea. La librería
entrega además la configuración (`QualabsConcurrentHls.hlsConfig`) para que el
camino correcto sea un spread. Verificado en vivo con dos instancias, una de
fábrica y una con la configuración.

**La capa donde se dibuja pasó a ser de la librería.** Era un `<div id="ads">`
que escribía la página y estilaba `css/player.css`, y esa regla lleva un
invariante —sin `z-index`, para que el `zDepth` del layout decida el apilado—
que es del renderizador y no del que escribe la página. Ahora la crea la
librería adentro del contenedor, con las tres propiedades en línea.

**La página del integrador son trece líneas**, ocho de JavaScript entre dos
vallas de `js/app.js` y cinco de marcado. El mínimo son diez: `audioControl` y
su botón son provisorios hasta la T-03, y `onResolved` es la traza de consola de
esta página.

Los dos greps dan cero: el del ADR 0003, que es el mismo comando de seis tasks
de la fase 01 con la ruta nueva, y el del ADR 0015, que es nuevo. `npm test`,
15/15. Commit sin push.

**Tres cosas quedaron anotadas y no arregladas.** La primera: el `PHASE.md` de
la fase y el ADR 0015 nombran `js/renderer.js:191` y la regla `.ads` de
`css/player.css`, que después de esta task no existen; el ADR es un registro con
fecha y se deja en pie, pero la mitigación del R2 del `PHASE.md` le da a la T-03
una instrucción sobre un selector que ya no está. En el `TASKS.md`, que es el
plan vivo, las rutas sí se siguieron hasta su lugar nuevo. La segunda: el
`<video controls>` del primario sigue ahí, porque sacarlo es de la T-03. La
tercera: el botón `#ad-audio` sigue siendo de la página y se le pasa a la
librería como elemento, que es el único cruce de la línea que queda vivo.

## 2026-09-04 — T-02 de la fase 02: el contrato en `docs/`, con los rangos del programa

El proyecto tiene por fin un documento de arquitectura.
`docs/contrato-senalizacion-renderizado.md` es el contrato del ADR 0003, que
vivía adentro de la evidencia de una fase cerrada y es el único documento vivo
que la fase 01 dejó. Es también la pieza que la fase de iOS necesita, porque es
exactamente lo que cambia al pasar de hls.js a AVFoundation. Al moverlo se
actualizaron las referencias vivas —el `README.md` y los comentarios de
`lib/signalling.js` y `lib/renderer.js`—; la entrada de esta bitácora que lo
nombra en su lugar viejo se deja en pie, porque es un registro con fecha.

**La consulta nueva es `provider.programRanges()`, y contesta dónde están todos
los rangos del programa.** Devuelve `{ ranges, settled }`, con cada rango en
`{ id, kind, startTime, duration }` ordenado por `startTime`. Cumple las tres
condiciones que la fase le puso: contesta dónde están todos y no cuál corre
ahora, dice de qué clase es cada uno, y **no trae el largo total**, que quien
pinta relee del contenido primario en cada pintada (ADR 0016). La posición sobre
la barra es una división que hace la barra.

**Lo que cruza la costura es el `kind` del rango y no la clase de HLS.** La capa
de señalización traduce en un solo lugar: `com.apple.hls.interstitial` es
`'interstitial'` y la clase concurrente es `'concurrent'`. La distinción es de
semántica y no de transporte —el rango concurrente nunca cambia el largo de la
línea de tiempo y el de reemplazo sí, que es el ADR 0016—, así que sobrevive a un
cambio de transporte, que es lo que el ADR 0003 compra. La capa dejó de descartar
el Date Range de clase Apple, que estaba ahí y no se leía: es el que marca dónde
un cliente de mercado se habría detenido. No se cuela en `activeAt`, que sigue
siendo solo de la experiencia concurrente, y eso está medido adentro de un break.

**La completitud se prometió, en lugar de heredarla de una coincidencia.**
`settled` es verdadero cuando la fuente de los rangos está cerrada —una playlist
que ya no puede crecer— y ningún asset-list quedó en vuelo; la lista, además, es
monótona: un rango que ya salió no cambia ni desaparece. El límite es explícito y
está escrito: `settled` habla de la señalización y no del programa, y sobre una
fuente que sigue creciendo no se vuelve verdadero nunca. Que en este POC la lista
esté completa antes del primer break es una propiedad del ADR 0005 —VOD con los
Date Ranges en la media playlist— y no del contrato.

**Las dos corridas.** La primera lee los diez rangos del recorrido —cinco de cada
clase, en 20, 45, 70, 95 y 120 s— a los 0,8 s de reloj de pared y con
`currentTime` en 0, o sea veinte segundos antes de que empiece el primero. La
segunda demora los asset-list dos segundos a propósito para ver la promesa en sus
dos estados, porque una promesa que solo se observa cumplida no está medida: con
los asset-list en vuelo `settled` es falso y la lista tiene cinco rangos, todos
de clase Apple, que son los que se leen del tag; cuando vuelven son diez y
`settled` es verdadero, y los cinco primeros están idénticos. Sin seeks y sin un
error de consola.

Los dos greps dan cero y `npm test` da 15/15. Commit sin push.

**Cuatro cosas quedaron anotadas y no arregladas.** La primera y la que más
importa: el contrato ya dice lo que el ADR 0014 decidió —el default de `volume`
ausente es 0 en los elementos del aviso y 100 en el contenido primario— y el
código todavía no, porque implementarlo es la T-05. Hasta que la T-05 corra, el
documento va una task adelante de `lib/signalling.js`, que tiene una sola
constante en 100 para todos los elementos, y del renderizador, que ignora el
campo a propósito. La segunda: cuando la T-05 corra, el test
`no payload of the tool carries volume, and every element comes out at 100` se
pone rojo, y ningún bloque de la fase lo dice: la T-06 enumera los casos nuevos y
ninguna enumera el que hay que cambiar. La tercera: la lista de textos vigentes
que citan el ADR 0010 y quedan viejos tiene un ítem más que el que la T-05
enumera, que es la sección `The two layers` del `README.md`. Y la cuarta: el
rango de clase Apple se marca con lo que el tag declara, `PLANNED-DURATION=12`,
que no es lo que el aviso lineal dura de verdad —la T-12 de la fase 01 midió
12,37 s por break—; para la barra manda la señalización, y conviene saberlo
antes de pintarla.

## 2026-09-04 — T-03 de la fase 02: los controles de la composición

Los controles propios, adentro de la librería: una sola barra abajo de todo con
el largo del programa entero, la pausa centrada, un control de audio arriba a la
derecha y el fullscreen de la composición, que hasta hoy no existía —no había una
sola llamada a `requestFullscreen` en el repositorio—. Los controles nativos
sobre el primario dejaron de estar y el botón `#ad-audio` dejó de existir. Todo
en `lib/controls.js`, que es un archivo nuevo de la librería y entra al script
que `run.sh` arma en cada arranque.

**La consecuencia estructural que el bloque planteó como condicional la
contestaron las imágenes de referencia.** Si la barra iba debajo del área de la
composición, el elemento que va a fullscreen dejaba de ser la caja 16:9 de la
imagen y el renderizador —que mide con `layer.getBoundingClientRect()`— se
llevaba la barra adentro del área, corriendo todas las cajas de todos los
layouts. Las imágenes ponen la barra abajo de todo pero **adentro del marco**,
sobre la imagen, con el reloj a la izquierda y el largo a la derecha. Entonces no
hay contenedor nuevo: el que va a fullscreen es el contenedor que el integrador
entrega, que es el mismo que la capa de avisos cubre y el mismo que el
renderizador mide, y la trampa no se compensa porque no existe. Medido: la caja
que mide el renderizador, la del contenedor, la del `<video>` y la de la imagen
son la misma —715 × 402,1875 px— con y sin aviso, y los píxeles de los elementos
del break dan delta máximo **0,000000 px** contra `boxToPixels`.

**El apilado se verificó contra el caso que el recorrido no tiene.** Los controles
son una capa hermana de la de avisos, con `z-index: 2147483000` —arriba del rango
que el `zDepth` de un payload ajeno puede tomar, no arriba del máximo visto— y sin
tocarle el `z-index` a la capa de avisos, que sigue en `auto` y por lo tanto sigue
sin ser un contexto de apilado. Con la sonda sintética de la T-10 de la fase 01,
que pone el aviso de fondo en `zDepth` 0 y el primario encima en 1, el aviso se ve
atrás, el primario adelante y los cuatro controles arriba de los dos.

**El estado que se quedaba sin lugar se mudó, no se cayó.** El botón `#ad-audio`
distinguía "no hay aviso" de "el aviso en pantalla no tiene audio", y el control
de la composición no puede heredarlos porque **nunca está deshabilitado**: la
composición siempre tiene audio. Los dos estados eran de un control que dejó de
existir. La información se mudó a la línea de estado del pane, que es donde la
página ya dice qué hay en pantalla, y se calcula del contrato —el `mediaType` de
cada elemento— así que no agrega una línea a la superficie pública.

**Las cuatro capturas, y las de fullscreen tomadas en fullscreen de verdad**, con
un click real sobre el botón, que es lo único que el navegador acepta como gesto
de usuario. En las cuatro se ve una sola barra con `3:00`, que es el programa
entero. Y la barra mide lo mismo antes, durante y después de un break: 559,313 px
de riel y 180,000 s releídos del primario en los tres momentos, que es el
invariante del ADR 0016 y lo que la fase 03 va a poner a prueba.

Los dos greps dan cero —el archivo nuevo entra al del renderizado contra el
transporte— y `npm test` da 15/15. La página del integrador baja de ocho líneas de
código a siete. Commit sin push.

**Cuatro cosas quedaron anotadas y no arregladas.** La primera y la que más
importa para el argumento de la demo: **el pane de fábrica no tiene controles
nativos y nunca los tuvo.** El ADR 0015 cierra diciendo que los conserva y que la
asimetría entre los dos panes refuerza la compatibilidad, y el bloque de la task
lo repite como restricción; en el código `#stock-video` entró en la T-09 de la
fase 01 con `playsinline muted` y nada más. Antes de esta task el único pane con
controles nativos era el nuestro —la asimetría al revés— y después no los tiene
ninguno de los dos. La task tiene prohibido tocar ese pane, así que queda dicho: si
la asimetría es parte del argumento, es una línea. La segunda: **`squeezebackFrame`
no está en el recorrido.** El bloque y el contrato lo citan como el layout que pone
el aviso de fondo, y ninguno de los seis asset-list de `signalling/` es ese layout:
en los cinco del recorrido el primario está siempre en `zDepth` 0. Es el sexto
payload de la herramienta de SVTA y vive en los fixtures de los tests, que es por
lo que el apilado se verificó con la sonda. La tercera: **en fullscreen sobre un
viewport que no tiene la relación de aspecto del contenido, el encuadre del
primario salta al entrar y al salir de cada break** —con un layout activo el
primario llena el área por `object-fit: cover` del ADR 0013, y sin aviso vuelve a
`contain` y aparece el pilarbox, medido en 159,111 px por lado sobre un viewport de
1920 × 901—; las cajas del layout quedan exactas en los dos casos, así que ningún
aviso flota fuera de la imagen. Y la cuarta: **la barra quedó seekeable y eso no lo
pidió ningún bloque**; se agregó porque una barra que no lleva a ningún lado se lee
como rota, y son cinco líneas si se quiere sacar.

## 2026-09-04 — T-09 de la fase 02: el área de los layouts es la del video

Se ejecuta antes que la T-04 aunque el número sea más alto, porque cambia la
medición sobre la que se apoya todo el renderizado y una medición se cambia
antes de construirle cosas encima.

**Lo que cambió, en una línea:** la caja contra la que se resuelven los insets
porcentuales pasa a ser la de la imagen y no la del contenedor. Decisión de
Nicolás: *"el viewport lo define el video (con su relación de aspecto), no el
tamaño de la pantalla"*, con la restricción de que la relación de aspecto del
video original no se toca.

El renderizador sigue midiendo la capa que recibió y ahora la reduce a la
relación de aspecto del contenido y la centra, en una función pura —`imageBox`—
que toma la relación de `video.videoWidth / video.videoHeight`, que es la del
elemento que ya estaba reproduciendo y la que el navegador reporta con el pixel
aspect ratio aplicado. Antes de que llegue la metadata no hay imagen y devuelve
el marco tal cual. Los avisos se posicionan sumando el origen de la imagen, y
el primario recibe la caja de la imagen como caja propia y el `transform` lo
lleva de ahí a la del layout, lo que le da a su caja la relación de aspecto del
video y deja al `object-fit: cover` del ADR 0013 sin nada que recortarle.

**En ventana no se movió nada, que es la regresión que importaba.** Las dos
cajas coinciden ahí, así que el cambio no tiene que mover un píxel, y la fase 01
midió ese cero cinco veces. Los cinco breaks del recorrido, catorce elementos,
primarios incluidos: **delta máximo 0,000000 px** entre la caja que el contrato
pide —calculada en la sonda, no preguntada a la librería— y la que el navegador
dibuja. Y recortando las capturas de ventana a la caja del contenedor, la imagen
la llena de borde a borde igual con aviso y sin aviso.

**En fullscreen sobre un viewport de 1920 × 901 —relación 2,131 contra 1,778 del
contenido— la prueba salió de los píxeles de las capturas**, con el mismo
scanner corrido sobre las de la T-03 y las de esta task. La T-03, sin aviso:
imagen en x 159..1760. La T-03, con aviso: **x 0..1919**, o sea el salto de
encuadre, el mismo player con la imagen ocupando dos rectángulos distintos.
Después del cambio, las tres capturas —sin aviso, con `cornerOverlay` y con
`squeezebackLShape`— dan **x 159..1760 las tres**. Y las barras negras tienen
canal máximo 0 en las capturas con aviso: negro puro, ningún elemento las pisa,
incluido el overlay de esquina, que es el que arranca pegado a la izquierda y el
que haría visible el corrimiento. La geometría acompaña con delta ≤ 0,0122 px en
fullscreen, que no es error de la conversión sino la cuantización del navegador a
1/64 de píxel, en la que 159,111 no cae y los números de la ventana sí.

Los dos greps de la fase dan cero y `npm test` da 15/15. La página del integrador
no se toca. Se agregó una **nota fechada al ADR 0013**, porque su párrafo de
cierre —que el recorte nunca le toca al primario— valía en ventana y no en
fullscreen, y ahora vale en las dos; la decisión del ADR no cambia. Y una línea a
la regla 1 del contrato en `docs/`, que decía "el área del player" sin decir cuál
de las dos cajas era. Commit sin push.

**Tres cosas quedaron anotadas y no arregladas.** La primera: **la primera
consecuencia del bloque no era lo que el código hacía.** El bloque dice que hoy
un aviso pegado a la izquierda cae sobre la barra negra; con un layout activo no
había barra negra, porque el primario estaba en `cover` sobre el contenedor y lo
llenaba, así que el aviso arrancaba en x = 0 y la imagen también. La T-03 ya lo
había dicho al pie de su JSON. Lo medido y cierto era el recorte del primario y
el salto de encuadre, y el aviso sobre la barra es la forma que ese mismo defecto
toma en cuanto el primario deja de recortarse: las dos se arreglan con este
cambio y el done no se mueve. La segunda: **que el rectángulo del primario sea el
mismo sin aviso depende de la hoja de estilos de la página**, que tiene `.video`
en `object-fit: contain`; sin layout la librería le devuelve el elemento a la
página, y una página que lo pusiera en `cover` recuperaría el salto al revés. Es
material para la T-08, la documentación del integrador. La tercera: **los
controles siguen sobre el contenedor y no sobre la imagen**, así que en
fullscreen la barra y el scrim cruzan las barras negras. Esta task no los tocó y
no es evidente que haya que tocarlos —son el marco alrededor de la composición y
no un elemento del layout—, pero conviene tenerlo presente en la T-04, que pinta
los rangos del programa sobre esa misma barra.

## 2026-09-04 — T-04 de la fase 02: los rangos del programa marcados en la barra

**La decisión que el bloque dejó abierta: la barra marca las dos clases.** No
sólo el rango concurrente que este player dibuja, sino también el interstitial
tradicional que la misma playlist lleva en cada break y que el player ignora por
clase. La razón no es estética: una barra que marca sólo lo que este player
dibuja se queda callada sobre un break que un cliente de mercado sí toma, y eso
es lo que la página existe para mostrar. Y el silencio no escala: una playlist
con un break de reemplazo sin rango concurrente al lado no tendría nada que lo
avisara.

**Y una cosa que apareció al medir y que decide cómo se dibuja: los dos rangos de
cada break están en el mismo lugar**, mismo `START-DATE` y misma duración, que es
lo que hace al par de compatibilidad ser un par. O sea que marcar las dos clases
una encima de la otra agrega un color y no información. Lo que las separa no es
dónde están sino de quién es cada una, así que se dibujan en dos carriles:
**sobre el riel, en violeta `#a273ff`, lo que este player reproduce** —el relleno
le pasa por adentro y la perilla lo cruza—, y **debajo del riel, en un carril
propio, en amarillo `#ffcc00`, lo que hace el otro cliente**, que ningún playhead
toca porque no es esta línea de tiempo. Esa separación es lo que hace que el
amarillo se lea como "acá un cliente de mercado reemplaza" y no como "acá pasa
algo en este player". Se descartó un segundo riel tenue de ancho completo:
diría lo mismo con más claridad y se lee como una segunda barra de progreso, que
es exactamente lo que David pidió que no hubiera.

Los dos son colores funcionales y no de marca —el kit de Qualabs es teal,
naranja, tinta y papel—: el amarillo porque es el que los players de Apple usan
para el interstitial y llega leído, y el violeta porque no tiene convención que
respetar. El naranja fuerte queda afuera porque al lado del amarillo deja de ser
otro color a distancia.

**La barra en fullscreen sigue cruzando las barras negras, y se queda así.** Era
la observación que la T-09 dejó abierta. Las imágenes de referencia muestran la
barra ocupando todo el ancho del marco, es lo que hace cualquier player, y la
distinción ya tiene lugar: el renderizador mide la imagen porque las cajas del
layout son porcentajes de lo que alguien mira, y los controles miden el
contenedor porque son el marco alrededor de esa imagen.

**Medido.** Los cinco breaks marcados con `settled` en `true` antes de que
empiece el primero; el riel mide lo mismo con aviso y sin aviso —1042,84 +
559,31— que es el ADR 0016 visto en la barra; y la geometría de cada marca contra
la aritmética calculada en la sonda da delta ≤ 0,0122 px, que es la cuantización
del navegador a 1/64 de píxel. La captura reducida al 25 % de su lado, leída en
sus píxeles y no en un estilo computado, da violeta `114, 80, 206` contra
amarillo `255, 232, 0` en la página entera y `173, 122, 255` contra `245, 196, 3`
en fullscreen, con 2 px de alto por carril. Los dos greps de la fase, `npm test`
15/15, y la página del integrador sin cambios en once líneas. Commit sin push.

**Tres cosas quedaron anotadas y no arregladas.** La primera: **el grep del ADR
0003 lleva un término que la T-02 dejó viejo.** La lista de la T-03 incluye
`interstitial` y ahora da cinco hits del lado del renderizado, que son el valor
`kind` del contrato, su color, su carril y su tooltip; el contrato dice de frente
que eso es lo que cruza la costura, así que lo viejo es la lista y no el código.
Corrido sin ese término, el grep sigue dando cero. La segunda: **la T-06 pide una
función que en el código son tres.** Su bloque habla de "la que produce los
rangos del programa… con su clase y su posición sobre el largo total", y esa
partición es la del ADR 0016: la señalización produce los rangos con su clase
(`rangeOfExperiences`, `rangeOfDateRange`) y el renderizado los pone sobre el
largo que relee (`rangeSpan`), porque el largo no cruza la costura. La tercera:
**el grep del ADR 0015 encontró algo real y se corrigió en el momento.** El
comentario de los colores explicaba el descarte del naranja con "en este demo el
ámbar ya significa otra cosa", que es cierto y es de esta página y no de una
librería que se distribuye; la razón se mudó al documento de la task y en el
código quedó la que sí es de los colores.

## 2026-09-04 — El chequeo de los dos cortes deja de ser un grep y pasa a ser un script

La T-04 dejó anotado que el grep del ADR 0003 había dejado de dar cero y que la
decisión de qué hacer con la lista de términos no era de esa task. **Nicolás
eligió: la palabra `interstitial` se queda en la búsqueda y los cinco lugares
aceptados quedan registrados.** Sacarla de la lista era la otra salida y queda
descartada porque debilita la única alarma que impide que las dos capas se
vuelvan a mezclar: el término quedaría libre de aparecer en cualquier lado y por
cualquier motivo.

El chequeo pasa a ser `scripts/verificar-cortes.mjs`, que corre los dos greps de
la fase —el del 0003 y el del 0015— y compara lo que encuentran contra una lista
de ocurrencias aceptadas, en vez de dejar que cada task decida sola si cinco hits
son buenos o malos. Sale con código distinto de cero cuando aparece una que no
está, diciendo cuál y dónde.

**Dos cosas de la forma de la lista, y la segunda es la que la hace servir.** Las
excepciones se registran por el **contenido** de la línea y no por su número
—recortada y con los espacios internos colapsados—, porque los números se corren
con cualquier edición de más arriba y un chequeo que falla por motivos falsos se
termina apagando. Y cada excepción lleva escrito **por qué** es aceptable, al
punto de que el script se niega a correr con una que no lo tenga: una lista de
excepciones sin razones es una lista que la próxima persona amplía sin pensar,
que es como esta alarma se moriría, no de golpe sino de a una línea por vez.

**Un chequeador que nunca se vio fallar no se sabe si chequea**, así que se lo
hizo fallar. Con una referencia falsa a `details.dateRanges` metida en
`lib/renderer.js` salta el corte del 0003 y nombra archivo, línea y texto; con un
`document.getElementById('player')` en el mismo archivo salta el del 0015; y con
una copia de una línea ya aceptada salta igual, que es el caso que la lista
podría haber absorbido en silencio. El corte por contenido también se vio
funcionar sin fabricar nada: el comentario que se le agregó a `lib/controls.js`
—el que dice que esas cinco menciones están registradas y que una sexta salta—
corrió cuatro de las aceptadas de las líneas 60, 93, 96 y 238 a las 65, 98, 101 y
243, y el script siguió en verde.

**Lo que se miró de cerca y no cambió de estado: las cinco ocurrencias son
legítimas, y cuatro lo son por la misma razón.** Tres son el valor `'interstitial'`
del `kind` usado como clave —el color, el carril— o una referencia a esa clave
—el CSS que lee el color—, y una es el comentario que explica por qué el kind
cruza la costura. La quinta es la única que es prosa y no una clave: el tooltip
del carril. Se acepta porque describe un **comportamiento de reproducción** —que
otro cliente reemplaza el contenido— y no un mecanismo de transporte: no nombra
una etiqueta, ni una playlist, ni una clase de HLS. Queda escrito en el script
que el día que ese texto explique de dónde sale el rango deja de ser aceptable, y
que el arreglo es reescribir la frase y no ampliar la lista.

**Y una fuga que el script cierra de paso.** El grep del 0003 corre sobre una
lista de archivos escrita a mano, así que un archivo nuevo en `lib/` que nadie
agregue a ninguna lista pasaría por no ser mirado. El script exige que cada
`lib/*.js` esté declarado de un lado o del otro de la costura y falla nombrando
al que no lo esté. El grep del 0015 no tenía ese problema y sigue corriendo sobre
`lib/*.js` entero.

`npm test` da 15/15 y los dos cortes dan verde. Commit sin push.

## 2026-09-04 — T-05 de la fase 02: el volumen que declara el asset list

El ADR 0014 implementado. El renderizado dejó de ignorar el campo a propósito, y
lo que había que decidir bien no era leerlo sino **con qué default**: la
herramienta de SVTA no emite `volume` en ningún elemento, el bloque
`primaryContent` incluido, así que un `DEFAULT_VOLUME = 0` a secas deja el
programa mudo en los cinco layouts y una captura del recorrido se ve idéntica.
El default quedó partido en dos —0 en los elementos del aviso, 100 en el
primario— y el operador es `??` y no `||`, que es la otra rotura de un caracter:
con `||`, un `volume: 0` declarado a propósito sale a todo volumen.

**El volumen declarado se respeta en todos los elementos, y la asimetría es
únicamente del default.** El ADR 0014 dice "el contenido primario conserva su
audio" y el done de la task dice que en el Quad el de abajo a la izquierda va en
100 y "los otros tres" en 10 sobre un layout de cuatro elementos, o sea que el
primario es uno de esos tres. Se resolvió por el done, y por dos cosas más: el
objetivo de la task dice "cada elemento" sin recortar, y el contrato de la T-02
—escrito después del ADR— dice lo mismo. La razón de fondo es que una mezcla que
deja el programa al mismo nivel que el aviso contra el que se mezcla no es una
mezcla. Lo que el ADR no dice en ningún lado es qué hacer con un `volume`
declarado en el bloque del primario, y eso es lo que esta task decidió.

Dos cosas más que el renderizado tuvo que hacerse cargo, y las dos fallan en
silencio: **el mute de la composición tapa los elementos del aviso** —si no, el
aviso sería lo único que suena antes de que alguien lo pida, porque la página
arranca muteada por la política de autoplay—, y **al cerrar el break el primario
recupera su audio entero**, porque `volume` es una propiedad y no un estilo y un
primario que se queda en el 10 % de la mezcla sigue así el resto del programa.

La mezcla que propuso David —100 abajo a la izquierda y 10 en el resto— es un
asset list y no código: va sobre `signalling/asset-list-multiView.json`, que es
el break del Quad del recorrido, y los otros cuatro siguen sin declarar `volume`
para que el otro caso se pueda mostrar en la misma corrida.

**Verificado leyendo `muted` y `volume` de cada nodo**, que es la restricción, y
no con el monitor del sink de PulseAudio, que la fase 01 dejó descartado con dos
corridas. Con el Quad en pantalla: `view3` (abajo a la izquierda) en 1, y el
primario, `view2` y `view4` en 0,1, los cuatro sonando. Sin `volume` declarado,
en los dos sabores —con y sin bloque `primaryContent` en el payload—: el aviso en
0 y muteado, el primario en 1. Después del break, el primario en 1.

El test que afirmaba "no payload of the tool carries volume, and every element
comes out at 100" dejó de ser cierto y se corrigió, no se borró: ahora afirma que
el aviso sale en silencio y el programa no. Se lo vio en rojo con las dos
roturas de un caracter, una por una. `npm test` da 15/15 y
`scripts/verificar-cortes.mjs` da verde. Commit sin push.

Tres documentos vigentes decían lo contrario de lo que la demo hace ahora y no
uno: además de la sección `Before you record` del README y de las líneas que
imprime `scripts/senalizar-contenido.sh`, el README tenía el párrafo de la
arquitectura —"una mezcla por cuadrante sería inventada y no señalizada"— y el de
los dos defaults que la herramienta omite. Corregidos los cuatro textos.


## 2026-09-05 — T-06 de la fase 02: los tests de lo que falla en silencio

Doce tests nuevos en `test/program-ranges-and-volume.test.js`, sobre las
funciones puras que la fase agregó y nada más: **dónde están los breaks y de qué
clase es cada uno**, **dónde cae eso sobre el largo total del programa**, y **en
qué volumen arranca cada elemento**. Todo lo demás que la fase agregó está en la
pantalla, y un control mal dibujado es un control mal dibujado. Sin DOM, sin
browser, sin comparación de imágenes y sin cobertura como objetivo. `npm test`
cierra en 27/27 y `scripts/verificar-cortes.mjs` da verde.

Los datos son los reales. Los cinco breaks salen de la tabla `RECORRIDO` de
`scripts/senalizar-contenido.sh`, parseada y no copiada; los layouts, de
`signalling/`; y los valores esperados son las lecturas de la T-02 sobre el
contrato en vuelo, de la T-04 sobre las marcas de la barra y de la T-05 sobre
cada nodo. Es lo mismo que hizo la T-08 de la fase 01 con la medición de la
T-03: un test escrito con un payload inventado sólo prueba que el código hace lo
que creía quien lo escribió. Los tres casos que sí son inventados lo dicen donde
están.

**El test que existe por el error de la T-08 de la fase 01**: los mismos diez
rangos sobre un programa de otro largo. Aquella corría todos sus casos sobre una
sola resolución y una mutación que cableaba el 960 pasaba desapercibida; acá el
número es el largo del programa, que el ADR 0016 manda releer y no guardar. Las
dos lecturas —180 s y 360 s— se toman adentro del mismo test, una después de la
otra, para que un largo cacheado en la primera llamada falle sin importar desde
dónde se corra el archivo.

**El detector del `??` se mudó de lado**, y es lo que la T-05 dejó anotado: con
el default del aviso ya en 0, un `volume: 0` explícito en un elemento del aviso
da 0 con los dos operadores. Lo que los separa es el `0` explícito en el
primario, cuyo default es 100.

**La campaña de mutación: once roturas, una por regla, corriendo sólo los tests
que cubren esa regla. Ninguna quedó verde.** Las tres que el bloque nombra
murieron con la aserción a la vista: el `??` cambiado por `||` (actual 100,
esperado 0), el default de 0 aplicado también al primario (actual 0, esperado
100 en `squeezebackDoubleBox/primaryContent`) y el largo total cacheado (actual
11,111111, esperado 5,555556). Cada uno de los doce tests se vio en rojo al menos
una vez. Las dos tablas —qué mató cada mutación y qué mutación mató cada test—
están en `tasks/T-06/t06-la-campana-de-mutacion.md`, y las corridas verbatim en
`t06-los-invariantes.txt`.

La regla del default asimétrico necesitó **dos** roturas y no una: está escrita
en dos capas, `resolveElement` en la señalización y `volumeOf` en el
renderizado, y hay que romper las dos. La del renderizado destapó el único hueco
de la task: ese default sólo se alcanza cuando el `volume` no es un número, y
después de `resolveElement` siempre lo es, así que ningún test manejado por
datos reales llega ahí. Lo tapa un test que llama a `volumeOf` directo con el
campo ausente y con un string, que es el borde que la T-05 había dejado anotado
—el contrato declara `volume: number // 0..100` y nadie valida el extremo—.

Nada de la lógica de producción cambió: ningún test destapó un defecto, y cada
mutación se restauró antes de la siguiente. Commit sin push.

Tres cosas del bloque que no coincidían con el código, anotadas enteras en el
documento de la campaña. **Las funciones puras que la fase agrega no son dos,
son seis**, y están de los dos lados de la costura del ADR 0003: la clase cruza
el contrato como dato y la posición sobre el largo total es una división que
hace quien pinta, con un largo que el contrato deliberadamente no lleva. **El
recorrido de los cinco breaks no se puede leer desde git**, porque la playlist
señalizada es contenido generado y su `START-DATE` es la hora de pared del
empaquetado (ADR 0005); lo que está en git es la tabla del script que la
escribe. Y **`KIND_OF_CLASS` no es "el único lugar" donde una clase se vuelve un
`kind`, aunque su comentario lo diga**: el `kind` que llega al `Range` sale de
dos literales, uno en `rangeOfExperiences` y otro en `rangeOfDateRange`, y lo
que el mapa decide es por cuál de los dos caminos entra el Date Range. No es un
defecto —el ruteo y la etiqueta coinciden por construcción— pero un test sobre
el mapa solo no protege la etiqueta, y lo que la protege es la comparación de
los diez rangos enteros contra la lectura de la T-02.

## 2026-09-05 — T-07 de la fase 02: el skin y la marca

El skin de los controles y el logo de Qualabs, que hasta hoy estaba vendorizado
en `brand/` y no aparecía en ninguna pantalla. Alcance propio: lo más cercano
que dijo David es "make it look a little more Pro". Todo en `lib/controls.js`,
más una placa en el encabezado de la página y el token que la página le pasa al
chrome.

**El logo va en dos lugares y son el mismo archivo**: una placa sobre el titular
y una placa que la librería dibuja adentro del contenedor, en una fila propia de
la barra. La segunda existe porque es la única que sigue en el cuadro en
fullscreen, que es el único marco que tiene una grabación en fullscreen.

**No va en una esquina de la imagen, y eso está medido y no supuesto.** Un bug
de canal va en una esquina, y en este player la imagen es del layout: `multiView`
pone un elemento en las cuatro esquinas y el aviso de `cornerOverlay` **es** la
esquina superior izquierda. Se probó arriba a la izquierda y la captura quedó
como evidencia de la opción descartada: la placa le tapaba la mitad al aviso que
la demo existe para mostrar. La barra es la franja que la composición ya le cedió
al mobiliario, y la fila propia arriba del riel es lo que hace que la marca
tampoco le saque ancho a la barra de progreso.

**La librería no lleva marca, y por eso la marca es del que la integra.** El logo
entra por `attach` como `logo: { src, alt }` —un archivo del integrador, la
librería no trae ninguno— y el color por la propiedad CSS `--qa-accent` que él
pone sobre su contenedor; la tipografía es `inherit`, así que el chrome sale en
Poppins sin que la librería nombre una fuente ni la distribuya. Sin ninguna de
las tres, el player sale blanco y sin marca, que es lo que parece un player sin
marca. Costo dicho de frente: la valla de `js/app.js` pasa de ocho líneas a
nueve, y la novena es opcional.

**Acento y no superficie**, que es la segunda regla del kit: teal sólo en la
perilla y en el anillo de foco. **El relleno del progreso se dejó blanco a
propósito** aunque pintarlo hubiera sido el gesto más visible, porque es el
sustrato sobre el que la T-04 midió que las marcas violetas se leen a un cuarto.
Y la placa clara es la primera regla del kit, verificada mirándola: sobre el
fondo oscuro de la página el "qua" del wordmark desaparece y sobrevive el "labs".

**Los tamaños del chrome son tokens y en fullscreen cambian de juego** —botones
de 34 a 46, pausa de 74 a 104, tiempos de 13 a 18, riel de 8 a 10—, con la clase
puesta por la misma función que pinta el icono de fullscreen.

**La prueba del cuarto encontró un defecto real, como en la T-04.** El logo del
player a 22 px queda en 5,5 px reducido y el wordmark se disuelve, y no se
arregla agrandándolo: a un cuarto, esa imagen mide 179 px de ancho y un "qualabs"
legible necesita 48 de esos 179. O sea que **en la página de dos panes la marca
que se lee de lejos es la del encabezado**, que a un cuarto queda en 11 px y se
lee entera. En fullscreen no hay encabezado, así que ahí sí tiene que leerse la
del player: se subió de 32 a 40 px y con eso queda en 10 px reducido y se lee.
La T-04 sigue en pie: violeta contra amarillo a 276–284 de distancia RGB, contra
los 282–292 de aquella medición, y el riel fuera de un break en `127, 127, 125`.

**El pane sin modificar quedó igual y no se afirma: 0 píxeles distintos de
429.177.** Para que ese número signifique algo hicieron falta dos cosas, y la
segunda es la que casi produce un falso positivo: el video del pane se para en el
mismo segundo en las dos corridas, y el pane se empuja a una fila entera de
píxeles, porque el encabezado nuevo lo baja 13,x px y la rasterización de un
texto depende de la fracción de píxel en la que cae. Sin esa alineación el diff
daba 2,7 % de píxeles distintos que eran antialiasing y no skin.

Los dos greps de la fase en verde, `npm test` 27/27, y la página del integrador
sin cambios fuera de la línea del logo. Commit sin push.

**Cuatro cosas quedaron anotadas.** **La dirección del skin no está escrita en
ningún lado**: el bloque la da por elegida y en la fase sólo hay las dos imágenes
de referencia de la T-03 —que fijaron dónde va cada control, no cómo se ve— y el
"more Pro" de David; el skin se decidió con eso y con las dos reglas del kit. Un
**`networkError aborted` no fatal** aparece a veces en la consola de la sonda y
también aparece en el árbol sin los cambios corriendo la misma secuencia: es un
fragmento que hls.js cancela cuando la sonda hace seek. Un **comentario de
`index.html`** seguía afirmando que el pane de fábrica conserva sus controles
nativos, que es lo que la nota fechada del ADR 0015 ya había corregido, y se
corrigió el comentario. Y **el bloque pide que en las tres capturas se vea el
pane sin modificar**, que en la de fullscreen es imposible por construcción.

## 2026-09-05 — T-08 de la fase 02: la documentación del integrador

Última task de la fase. El documento es `docs/integrating-the-library.md`, al
lado del contrato, y está en inglés como el `README.md` y el código: es lo único
de `docs/` que lee alguien que no somos nosotros, y David lo pidió con esa forma
—*"then it's actually like clean on how this could be distributed and shared"*—.
El `README.md` sigue siendo el único punto de entrada; el documento no se
referencia desde ahí.

**Las dos exigencias que la librería no puede adivinar, con la razón y no como
regla.** La maquinaria de interstitials de hls.js va apagada (ADR 0002), y lo
que importa es por qué la librería avisa en vez de exigir: hls.js instancia el
controlador en el constructor, así que para cuando la instancia llega a `attach`
ya está decidido, y con la maquinaria encendida el player del integrador **anda
igual** —agenda el Date Range de clase Apple que la misma playlist lleva y
reemplaza el contenido—, o sea que no hay excepción, no hay error y no hay nada
en pantalla: el único síntoma es la ausencia de lo que integró. Y los controles
nativos sobre el primario no van, porque el renderizador lo escala con un
`transform` y los controles son parte del elemento, así que escalan con él; con
más de un `<video>` en pantalla mandan sobre un pedazo y no sobre la composición.

**La prueba de que el documento no miente es la comparación línea por línea, y
dio limpia.** Seis líneas de JavaScript en la página mínima contra las ocho de la
demo, con tres diferencias: `logo` y `onResolved`, las dos opcionales y las dos
declaradas opcionales en el documento, y la URL del contenido escrita entera en
vez de la constante `SRC`. Las cuatro líneas de marcado son idénticas y las dos
reglas de CSS coinciden —la del `<video>`, carácter por carácter—. Nada de lo que
la demo hace porque la librería existe quedó afuera del documento, y nada de lo
que el documento pide falta en la demo.

**La medida de hoy son 12 líneas** —8 de JS entre las vallas de `js/app.js` más 4
de marcado—, con el mínimo en 10. **El número de la T-07 estaba corrido en uno**:
la valla pasó de siete a ocho y no de ocho a nueve, porque las ocho de la T-01
incluían el `audioControl` que la T-03 borró al llevarse los controles a la
librería. Quedó como nota fechada en la evidencia de la T-07, sin reescribir lo
que aquella task afirmó.

**El hallazgo son dos requisitos que la librería tiene y nadie había escrito, y
los dos salieron de comparar y no del bloque.** El primero: **la librería
necesita el global `Hls` y nunca lo recibe**. La superficie del ADR 0015 entrega
la instancia, no el constructor, y la librería lo busca en el global tres veces
—`lib/concurrent-hls.js:167`, `lib/signalling.js:204` y `lib/media.js:34`, que
hace `new Hls(...)` por cada asset—. O sea que el orden de los dos `<script src>`
importa, y un integrador que haga `import Hls from 'hls.js'` reproduce el
contenido primario y se come un `ReferenceError` en el primer break: la misma
forma de falla que el ADR 0002, anda hasta que importa. El segundo: **la librería
le borra el atributo `style` al elemento de video** al terminar cada break
(`lib/renderer.js:346`), que es justo el mecanismo del que depende la garantía de
la T-09, y de paso se lleva puesto cualquier estilo en línea que el integrador le
haya puesto. Los dos están escritos en el documento; no se tocó código, porque es
una task de documentación y el global es la forma de distribución que el ADR 0015
eligió.

Lo que la T-09 dejó para acá también entró: **que el encuadre no salte depende de
una regla de la hoja de estilos del integrador**, `object-fit: contain` sobre el
elemento de video. Sin layout activo la librería le devuelve el elemento a la
página y de ahí el rectángulo lo decide su CSS; con `cover` el salto vuelve al
revés, sin error y sin log.

Los dos greps de la fase en verde y `npm test` 27/27, aunque la task no toca
código. Commit sin push.

## 2026-09-05 — Fase 02 cerrada

Nueve tasks en `done`, ninguna abandonada ni bloqueada, y ninguna línea
`post-ejecución:` en el `TASKS.md`. `phases/02-sdk-y-controles/PHASE.md` pasa a
`status: closed` con `closed: 2026-09-05`. El informe está en
`phases/02-sdk-y-controles/REPORT.md`.

**Lo que la fase deja no es una demo con el código ordenado: es una librería**,
y las tres cosas que lo sostienen se verifican. El corte del ADR 0015 lo chequea
`scripts/verificar-cortes.mjs`, al que se hizo fallar de tres maneras antes de
creerle; la página del integrador son 12 líneas comparadas línea por línea
contra la página mínima del documento; y el documento existe, en `docs/`, al
lado del contrato entre las dos capas, que es el documento de arquitectura del
producto que la fase 01 dejó pendiente. La librería se quedó con los controles
de la composición, incluido un fullscreen que antes de esta fase no existía en
el repositorio.

**Ningún ADR nuevo durante la ejecución, y tres notas fechadas.** Las decisiones
llegaron tomadas en el pase que generó las fases 02 y 03 —el 0014, el 0015 y el
0016—, y lo que la construcción produjo fueron correcciones al texto de las que
ya estaban: el 0015 afirmaba que el pane de fábrica conserva controles nativos
que nunca tuvo, el 0014 se leía como que el primario queda siempre en 100
cuando lo que se implementó es que el volumen declarado se obedece en todos los
elementos y la asimetría es sólo del default, y el 0013 valía en ventana y ahora
vale también en fullscreen.

**Los riesgos, uno por uno.** El R1 no se materializó y su alarma sonó tres
veces; lo más cerca que estuvo fue una fuga que el `PHASE.md` no nombró, el
chequeo corriendo sobre una lista de archivos escrita a mano. El R2 no se
materializó, con la salvedad de que el layout que pone el aviso de fondo no está
en el recorrido y la verificación es contra una sonda. **El R3 sí se
materializó**, en una forma adyacente a la escrita: como nunca había habido un
camino a fullscreen, nadie había medido ahí, y la primera medición encontró que
el renderizador tomaba el área del contenedor y no la de la imagen; costó la
T-09, que no estaba en el plan. El R4 no se materializó y se lo fue a buscar con
una mutación. El R5 se materializó en la mitad que no era la del calendario: la
dirección del skin no tiene fuente escrita en ningún lado.

**Lo que queda abierto y es de código son dos cosas, las dos de la T-08 y las
dos escritas en el documento del integrador**: la librería necesita el global
`Hls` y su superficie pública no lo pide —un integrador que importe hls.js como
módulo ve el primario reproducir bien y falla recién en el primer break, que es
la misma forma de falla del ADR 0002—, y la librería le borra el atributo
`style` al elemento de video al terminar cada break, que es el mecanismo del que
depende la garantía de la T-09 y de paso se lleva estilos en línea del
integrador.

**Y una contradicción entre documentos vivos, encontrada en el cierre**: el
`README.md` dice "and five lines:" arriba de un bloque de seis, mientras
`docs/integrating-the-library.md` dice seis en dos lugares. El error viene de la
T-01 y ninguna task posterior lo miró. No se corrigió acá porque el alcance del
cierre era `.project/`; queda como recomendación 3.

`PROJECT.md`: la línea de la fase 02 reescrita con lo que la fase terminó
siendo, `last_update` en 2026-09-05, y dos preguntas nuevas para David en "A
confirmar" —la mezcla del Quad, donde el primario queda a 10, y la dirección del
skin, que él no vio—. El `status` del proyecto sigue en `ongoing`. Nada de
código: el pase tocó `.project/` y nada más. Commit sin push.

## 2026-09-07 — Fase 04 escrita: el refinamiento, y va antes que la 03

Nicolás probó la demo desde el celular y salieron seis puntos. Ninguno agrega
una capacidad: tres son defectos y tres sacan diferencias entre los dos panes.
Él la llamó **fase de refinamiento** y así quedó nombrada. La fase está
aprobada, no propuesta.

**Es la 04 y se ejecuta antes que la 03.** El número es más alto porque la 03 ya
estaba escrita y renumerarla rompía sus referencias; el orden sale de otra
cosa: **esto es lo que se graba** y la 03 son capacidades nuevas, con la ventana
de grabación del 28 al 30 de septiembre en el medio. Queda dicho en el
`PHASE.md` de la 04, en el primer bloque del `PHASE.md` de la 03 y en las dos
líneas del índice de fases del `PROJECT.md`.

**El criterio de la fase** es sacar toda diferencia entre los dos players que no
sea el mecanismo que la demo muestra. Hoy difieren en tres cosas a la vez —uno
inserta, uno tiene skin, uno se atrasa— y alguien que mira no sabe cuál de las
tres es el punto. Está escrito en el `PHASE.md` porque es lo que decide los
casos que los seis puntos no enumeran, y en la fase aparecieron cuatro: qué
controles del cromo actúan sobre el pane del otro, si su barra muestra el reloj
del aviso o el del programa, si la marca tiene que volver a la imagen, y qué
rótulos de la página son diferencias legítimas.

**Ocho tasks.** Los tres defectos primero (T-01 la pausa de la composición que
tiene que gobernar a todos sus elementos, T-02 el logo que sale de los
controles, T-03 los controles usables con el dedo), después la separabilidad
(T-04, que decide y no toca el pane del otro), después el reemplazo (T-05), la
barra de un solo carril (T-06), el cromo del otro pane (T-07) y el par completo
con su única diferencia (T-08).

**Dos ADR nuevos y tres notas fechadas.** El **0017** es que el pane del cliente
de mercado reemplaza el contenido en lugar de insertarlo, con el argumento del
atraso retirado a propósito. El **0018** es que cada barra marca sólo lo que ese
player reproduce y lo marca sobre su propio riel, que supersede el diseño de dos
carriles de la T-04 de la fase 02 y de paso paga la recomendación 5 de su
informe, que pedía promover esa decisión a ADR. Las notas: el **0015** gana que
los controles funcionan con o sin experiencias concurrentes y pierde la pata del
argumento de compatibilidad que su nota del 2026-09-04 apoyaba en los 49,5 s; el
**0016** conserva su decisión y su contexto deja de describir a la demo, porque
la que corre ahora es el reemplazo; y el **0007** dice qué cubre "sin modificar"
ahora que ese pane lleva nuestro cromo, que es la instancia y su configuración y
no el mobiliario, verificado con tres lecturas de la página corriendo.

**Lo que la escritura de la fase encontró y no estaba en los seis puntos.** La
causa del defecto de móvil que dice el encargo —el temporizador que se renueva
con el mouse— no es la que explica el síntoma: el `pointerleave` del contenedor
dispara apenas se levanta el dedo, así que esconde los controles en cada toque,
y un temporizador de 2600 ms se vería como un ocultamiento lento y no como "casi
de inmediato". Está escrito como riesgo R2 y la T-03 mide antes de arreglar. Y
hay un tercer defecto del mismo toque: la capa de controles se esconde con
`opacity: 0`, que no desactiva los eventos de puntero, así que un toque en la
franja de abajo con los controles invisibles seekea en lugar de mostrarlos.

**Lo que queda anotado y no se tocó.** El informe de la fase 01 sigue diciendo
que el atraso es el segundo argumento de la demo, y no se reescribe porque es el
registro de lo que se midió: el retiro está en el ADR 0017, en el `PROJECT.md` y
—cuando la T-05 corra— en el párrafo del `README.md` que lo afirma. El `README.md`
no se tocó acá, porque el alcance de este pase era `.project/`. Nada de código.

`PROJECT.md`: índice de fases con la 04 y la línea de la 03 corregida por el
orden, `last_update` en 2026-09-07, y una entrada nueva en "A confirmar" para
David, porque el punto 1 cambia lo que él cuenta en escenario. Commit sin push.

## 2026-09-07 — Fase 04 replanificada: se va la T-08 y la verificación pasa a liviana

Dos cambios que pidió Nicolás sobre la fase que se había escrito unas horas
antes, los dos de gobernanza y ninguno de código.

**La T-08 se fue y no la reemplaza nada.** Era la que producía el cuadro de los
dos panes en el mismo segundo y enumeraba las diferencias que sobreviven. Él
dijo que la hace a mano y más rápido, así que la fase queda en **siete tasks**,
T-01 a T-07, y el criterio de la fase pasa a verificarlo él con el recorrido
corriendo. Lo único que se preservó de esa task es la lista de las diferencias
legítimas —el color de identidad de cada pane y sus rótulos—, que ahora vive en
el `PHASE.md` al lado del criterio: no es un artefacto que alguien tenga que
producir, es lo que le dice al que mira cuáles son hallazgos y cuáles no.

**La verificación de la fase baja a liviana, y el fundamento quedó escrito.**
Los seis defectos de esta fase se ven todos: la pausa que no manda, los
controles que no se pueden tocar, el logo, la barra, el reemplazo. Ninguno falla
en silencio y el revisor es Nicolás mirando la pantalla, así que construir
aparato es gastar en algo que su ojo hace mejor. Es lo contrario de la T-05 de
la fase 02, que llevó `alto` porque un volumen mal resuelto no se ve en una
captura y se descubre en la toma. El razonamiento está en el `PHASE.md` porque
es lo que decide los casos que él no enumeró.

**El límite de liviano, que también quedó escrito: no se agrega aparato nuevo,
no se deja de correr lo que ya existe.** Siguen corriendo `verificar-cortes`
(las dos costuras), `npm test` (los 27) y la comparación de la caja pedida
contra la dibujada (0,00 px siete veces), cada uno en las tasks que tocan lo que
ese chequeo mira. Se fueron las campañas de mutación, las capturas a un cuarto
como requisito, y las mediciones que existían para probar algo en lugar de para
atrapar un defecto. **Cada task dice qué le queda y qué se le fue**, para que la
ausencia se lea como decisión y no como descuido.

**Niveles:** la T-02 baja de `bajo` a `mínimo` (una línea de `js/app.js` que se
va, y nada que correr). Las otras seis se quedan donde estaban, porque `bajo` ya
significa lo que él pidió —sin campaña, sin tests nuevos de lo visual, una
captura a tamaño real y la suite existente una vez al final—: lo que estaba de
más no era el nivel sino lo que cada definición de done pedía.

**Dos hallazgos de este pase, y los dos son tasks donde el defecto NO se ve en
la pantalla.** La **T-05**: dos panes desincronizados por un par de segundos se
ven sincronizados, y la comparación cuadro a cuadro es toda la fase, así que lo
que cierra esa task es la lectura del `currentTime` de los dos elementos y no la
captura. Y **el `npm test` de la T-05, que nadie esperaba**:
`test/program-ranges-and-volume.test.js` parsea la tabla del recorrido y el
`PLANNED-DURATION` de `scripts/senalizar-contenido.sh`, que es exactamente el
archivo donde esa task cambia el `X-RESUME-OFFSET`. La **T-07** ya lo tenía
escrito: un pane que parezca sin modificar y no lo esté se ve igual de bien, y
lo agarran las tres lecturas de la página corriendo. Ninguna de las dos lecturas
es aparato nuevo y ninguna se recorta.

Y una lectura menor en la T-01: `volume`/`muted` y `currentTime` se suman a la
lectura nodo por nodo que la task ya iba a hacer, porque un elemento que arranca
con el volumen o el segundo equivocado se ve bien y las dos cosas pasan por
`build()`, que es la función que la task edita. Dos columnas más en una lectura
que ya existía, no una medición nueva.

Alcance del pase: sólo `.project/`. Los ADR 0017 y 0018 y las notas fechadas no
se tocaron, siguen valiendo. El `PROJECT.md` tampoco: su entrada de la fase 04
no dice cuántas tasks tiene y sigue siendo cierta. Commit sin push.

## 2026-09-07 — T-01 de la fase 04: el estado de la composición gobierna a todos sus elementos

El primero de los tres defectos que Nicolás encontró probando la demo desde el
celular: con la composición pausada, un seek que caía adentro de un aviso
concurrente de video arrancaba a reproducir ese aviso solo, con todo lo demás
detenido.

**La causa era la que el bloque de la task decía, y era la mitad general del
problema y no el caso.** `lib/renderer.js` tenía la respuesta a una sola
pregunta —si un elemento del aviso reproduce— saliendo de dos lugares: los
listeners de `play` y `pause` del primario propagaban las transiciones, y
`build()` decidía el estado de un nodo al crearlo, con un `node.play()` que no
miraba `video.paused`. Los dos coinciden mientras la composición reproduzca y
difieren exactamente cuando un nodo nace con la pausa puesta.

**El arreglo copia la forma que el mute ya tenía**, que era el modelo que la
task señalaba. `applyPlayback()` no toma argumento y lee `video.paused`, corre
después de cada `build` y en el `play` y el `pause` del primario —los dos
listeners son la misma función—, y el `node.play()` de `build()` se fue. Queda un
solo lugar que contesta. El orden dentro de `tick` es `applyPlayback()` y
después `applyAudio()`, que es el que ya estaba: el nodo arranca muteado, que es
la única manera de que la política de autoplay lo deje arrancar, y recién
entonces toma el volumen que su elemento declara. Cada nodo se sigue creando
`muted` y el `startAt` sigue siendo el que posiciona el asset.

**La lectura nodo por nodo, con las tres columnas y en los dos estados** (break
5, `multiView`, caído en 126,0 s de una ventana de 120 s a 132 s, con la pausa y
el seek hechos con clicks de verdad). Pausada: los cuatro elementos en `paused:
true`, los tres del aviso en el 5,998 que el contrato pide, y 0,000 s de avance
del `currentTime` en 1,5 s de reloj de pared. Play: los cuatro en `paused:
false` y los tres en 7,403, que es lo que el contrato pide en ese segundo. El
volumen es la mezcla declarada en los dos estados: 0,1 en el primario, `view2` y
`view4`, y 1 en `view3`.

**La tercera columna atrapó la mitad del defecto que no se ve, y era la razón
por la que estaba pedida.** Antes del cambio, al volver de la pausa el asset
estaba en 11,483 contra los 7,387 que el contrato pedía: los nodos habían
seguido corriendo los cuatro segundos que la composición estuvo detenida, así
que el aviso volvía desfasado del programa. Un elemento en el segundo equivocado
se ve perfecto en una captura.

**Los tres chequeos, los tres en verde**: `verificar-cortes` (las dos costuras),
`npm test` (27 de 27) y la caja pedida contra la dibujada, 0,00 px sobre los
cuatro elementos en los dos estados y sobre los cinco breaks del recorrido. El
recorrido sigue corriendo igual: 2, 3, 3, 2 y 4 elementos, con los stills del
break 3 sin línea de tiempo que gobernar.

Una línea de consola que aparece igual antes y después y no es de esta task:
`[hls] error networkError aborted fatal: false`, la petición que el seek
cancela. No es fatal.

Evidencia en `.project/phases/04-refinamiento/tasks/T-01/`, con la lectura de
antes del cambio al lado de la de después. Commit sin push.

## 2026-09-07 — T-02 de la fase 04: el logo de Qualabs sale de los controles del player

El segundo de los puntos de Nicolás, y el que menos código toca: la marca sale
de adentro de la imagen y queda la del encabezado, que es la que se lee de
lejos. Supersede la parte de la T-07 de la fase 02 que puso el logo en la barra.

**El cambio es de la demo y no de la librería, y esa distinción era la task.**
Lo que se fue es la línea de `js/app.js` que pasaba `logo` a `attach`. La opción
`logo`, su documentación —la sección 7 del documento del integrador, *The brand
is yours, because this library ships none*—, el nodo `qa-brand` de
`lib/controls.js` y su CSS se quedaron los cuatro en pie. Sacar la opción le
habría quitado a un integrador la única manera de poner su marca adentro del
cuadro, que es un problema distinto del que Nicolás encontró. La prueba de que
la superficie no se movió es el diff vacío sobre
`docs/integrating-the-library.md`.

**Cambió un segundo archivo, y es la página afirmando algo que su código dejó de
hacer.** `index.html` tenía dos comentarios que decían que la marca de esta
página está en dos lugares y son un archivo: el de la cabecera y el de arriba
del `masthead`. Los dos se reescribieron a la misma cantidad de líneas a
propósito, porque el comentario de `js/app.js` referencia `index.html:139` y
`index.html:119` y las dos referencias siguen apuntando a lo que nombran.

**La captura, a tamaño real y con los controles a la vista**, que es la salida
entera de la task: el break 1 —el `cornerOverlay`, el mismo aviso con el que la
T-07 de la fase 02 mostró la marca— sin nada nuestro encima, y el logo del
encabezado en su lugar, 193,75 × 44 px y el mismo archivo de `brand/`. Antes, la
placa de la barra medía 115,34 × 35,19 px; después no hay nodo `qa-brand`
adentro de `#player`. El largo del riel no se movió —el logo vivía en una fila
propia arriba del reloj y del riel—: `0:28` y `3:00` en los dos extremos, en las
dos capturas.

**No se corrió nada más, y no es un recorte.** Los dos archivos editados no son
ninguno de los que `scripts/verificar-cortes.mjs` mira, y `npm test` importa las
funciones puras de las dos capas, que esta task no toca. La captura reducida a
un cuarto tampoco: estaba para probar que la marca que sobrevive a la reducción
es la del encabezado, y eso ya lo midió la T-07 de la fase 02 —a un cuarto el
logo de 22 px de la barra queda en 5,5 px y el wordmark se disuelve—.

**Dos afirmaciones vivas quedaron viejas y las dos quedan para que Nicolás
decida, porque arreglarlas rompe algo que la task pide.** La sección 9 del
documento del integrador dice que la demo de este repositorio es la página
mínima *con dos opciones agregadas, `logo` y `onResolved`*, y desde hoy es una;
no se corrigió porque la definición de done de la task es el diff vacío sobre
ese archivo. Y el comentario de `css/player.css` que explica por qué el color va
por CSS cierra diciendo que *el logo viaja por el otro camino, como archivo
pasado a `attach`*, en un párrafo sobre lo que esta página le entrega al cromo;
la oración sigue siendo cierta del mecanismo, pero se lee como si la página
todavía lo pasara, y ese archivo está en la lista que `verificar-cortes` mira.

El conteo de 12 líneas de la página de esta demo no se tocó: vive en la
evidencia de la T-08 de la fase 02 y en el informe de esa fase, los dos registro
histórico.

Evidencia en `.project/phases/04-refinamiento/tasks/T-02/`, con la captura de
antes del cambio al lado de la de después. Commit sin push.
