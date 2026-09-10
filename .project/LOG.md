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

## 2026-09-07 — T-03 de la fase 04: los controles usables con el dedo

El tercero de los defectos, y el único de los tres que empezaba con una
medición. Nicolás reportó que en el celular los controles aparecen y desaparecen
casi de inmediato al tocar.

**Las dos causas candidatas existen las dos, y la del código es la que explica
el síntoma.** El `pointerleave` de `lib/controls.js` dispara 0,2 ms después del
`pointerup` porque en touch el puntero deja de existir cuando el dedo se
levanta: medido con eventos táctiles reales, la capa estuvo arriba **118,9 ms**
—exactamente lo que el dedo estuvo apretando— y el `click` de ese mismo toque
aterrizó cuando ya no había nada en pantalla. La causa enunciada, la del
temporizador que no se renueva con el movimiento, se aisló apretando el dedo y
sin levantarlo: sin `pointerleave`, la capa bajó a los **2601,3 ms** y en esos
4 segundos llegaron **cero** `pointermove`. Es cierta y es la segunda: son 2,6 s
y no 100 ms. Arreglar una sola habría dejado el síntoma a medias.

**El tercer defecto existía, y no estaba en un lugar sino en tres.** El bloque
nombraba `.qa-track`, y es cierto —un toque en la franja de abajo con los
controles invisibles seekeó 134,01 s—, pero los cuatro controles tienen
`pointer-events: auto`: el toque en el centro pausó la composición y el de
arriba a la derecha levantó el mute, que de los tres es el peor en cámara.

**Y apagar `pointer-events` mientras la capa está escondida cubre sólo la
mitad.** El `pointerdown` se resuelve antes de que corra cualquier listener, así
que el seek de la barra queda muerto; el `click` se resuelve **después**, ya con
la capa de vuelta en pantalla, así que un botón lo recibe igual. Se midió: un
toque sobre el medio invisible dio `pointerdown` en el elemento de video y
`click` en el botón de play, y la composición se pausó. Por eso hay dos
mecanismos y no uno, y el click se traga en un solo lugar, en fase de captura
sobre el contenedor.

**Lo que se decidió.** `pointerleave` deja de esconder para todo lo que no sea
un mouse y sigue siendo el gesto del mouse. El gesto que esconde en touch es un
segundo toque sobre la imagen, que alterna; sobre el mobiliario nunca alterna. De
las tres opciones que el bloque enumeraba, *el temporizador sólo mientras
reproduce* **ya estaba implementado** —`arm()` ya tenía `if (!video.paused)`—,
así que la decisión real era el toque. `CONTROLS_HIDE_MS` se queda en 2600 y
aparece `CONTROLS_HIDE_TOUCH_MS = 5000`, porque no son la misma cantidad: con
mouse el número es "cuánto después de que dejás de mover" y el movimiento lo
renueva —3,6 s de movimiento continuo y siguen arriba—, con el dedo es la
interacción entera y no hay nada que lo renueve. Y `--qa-icon` pasa de 34 a
44 px, que es un token y no un layout nuevo, con el juego nuevo indexado por el
instrumento y no por el tamaño de la pantalla.

**El apagado de `pointer-events` va detrás de `(any-pointer: coarse)`, y esa es
la mitad que es una decisión.** En el mouse el agujero existe pero no es un
defecto, y cerrarlo ahí sí sería un cambio: medido, en escritorio un click sin
mover con los controles escondidos seekea 113,49 s, y después del cambio sigue
seekeando 113,56 s. Es `any-pointer` y no `pointer` porque un laptop con
pantalla táctil tiene puntero fino primario y un pulgar además.

**Lo que la corrida con el dedo devuelve después:** la capa queda arriba
5000,2 ms en lugar de 118,9, y la baja el temporizador y no el dedo levantándose;
el toque en la franja ya no seekea y muestra; el del centro ya no pausa y
muestra; el de arriba a la derecha ya no toca el audio y muestra; la pausa y el
audio se accionan con el dedo con los controles a la vista; y el segundo toque
sobre la imagen los esconde sin seekear, con el siguiente trayéndolos de vuelta.
La corrida con mouse da los mismos números que antes en las ocho lecturas, con
los tokens del escritorio intactos en 34 px.

**Lo que se dejó a propósito sin cambiar: la altura de la barra.** `.qa-track`
da 30 px de blanco sobre un riel de 8 px, y ese número sale de
`calc(var(--qa-rail) * 3 + 6px)`, que es la aritmética de dos carriles. La T-06
saca el carril de abajo y reescribe esa expresión, así que un valor puesto hoy
contra ella es un valor escrito dos veces. Queda anotado para esa task.

`verificar-cortes` verde con las mismas 5 ocurrencias aceptadas y cero hits del
lado de ADR 0015, `npm test` 27 de 27, y la comparación de la caja pedida contra
la dibujada en 0 px en el escritorio y 0,007813 px en el teléfono —el mismo
número antes y después del cambio, que es el redondeo sub-pixel de una caja de
361,52 px y no un corrimiento—.

Evidencia en `.project/phases/04-refinamiento/tasks/T-03/`, con la lectura y las
capturas de antes del cambio al lado de las de después. Commit sin push.

## 2026-09-07 — Ninguna afirmación viva dice que la marca de Qualabs va adentro del player

Nicolás pidió, sobre la T-02 ya cerrada, sacar toda referencia a ese logo adentro
del player si quedaba en algún lugar más. La búsqueda sobre los archivos vigentes
del proyecto devolvió dos, las dos ya anotadas por la T-02 y ninguna nueva:

- La sección 9 de `docs/integrating-the-library.md` decía que esta demo es la
  página mínima con **dos** opciones agregadas, `logo` y `onResolved`. Desde la
  T-02 agrega una.
- El comentario de cabecera de `css/player.css` describe lo que esta página le
  entrega al cromo y cerraba con el logo viajando como archivo a `attach`, lo que
  en ese párrafo se leía como si esta página todavía lo pasara.

**El resto de las menciones quedan, porque no son "ese logo":** la opción `logo`,
el nodo `qa-brand` y su CSS son el mecanismo genérico con el que un integrador
pone su propia marca —la sección 7 dice "The brand is yours, because this library
ships none"—, el inventario de `brand/` del `README.md` es un inventario, y la
atribución de `CREDITS.md` es cierta.

**Una precisión sobre la definición de done de la T-02, porque el registro tiene
que decir de quién fue el error.** El bloque de la task pedía "la sección 7 del
documento del integrador sin cambios", que es exactamente el alcance correcto: la
sección 7 es la superficie pública y la sección 9 es una descripción de esta demo.
Lo que se ensanchó fue el encargo al subagente, que pidió probarlo con un `git
diff` vacío sobre el archivo entero. Con esa prueba la sección 9 quedaba
inmovilizada sin que ninguna task lo hubiera decidido, y por eso el subagente
frenó y la devolvió en lugar de elegir por su cuenta. El bloque no cambia.

`verificar-cortes` verde con las dos costuras. Commit sin push.

## 2026-09-07 — La separabilidad se decide, y las tres lecturas no entran en el script

La T-04 de la fase 04, que es trabajo de decisión y no toca código. Tres
decisiones, cada una con su razón escrita al lado.

**La entrada pública es una segunda función y no una opción de `attach`:**
`attachControls(video, { container, provider, logo })`. La razón del cambio de
superficie no es la comodidad de esta demo, es que un integrador puede querer el
cromo y no la parte de concurrentes. Y la forma se decide por tres hechos del
código: `attach` pide una instancia de hls.js que el cromo no necesita, hace
cinco cosas de las que una opción tendría que apagar cuatro, y una de esas cinco
es `checkConfig`, que escribe en `console.error` cuando la instancia trae la
máquina de interstitials prendida. La instancia del pane de fábrica la trae
prendida a propósito, así que la opción obligaría a apagar la alarma de la
librería con un flag. `attach` no cambia: el agregado es aditivo.

**Las marcas de la barra de ese pane salen de su propio player**, del
`hls.interstitialsManager` que `js/stock-player.js` ya lee, con el pane
implementando el `programRanges()` del contrato desde su propio manager. Lo que
ese player agendó sólo lo sabe ese player; nuestra señalización sabe lo que la
playlist señaliza, que es otro hecho. Si ese pane dejara de agendar un break, una
barra alimentada por nuestro proveedor seguiría pintando cinco marcas y estaría
mintiendo sobre el pane, y la barra es el instrumento sobre el que se apoya la
comparación cuadro a cuadro. Es también la primera vez que se ejerce la
consecuencia que el ADR 0003 escribió en la fase 01: el contrato con una segunda
implementación, del lado de la demo, sin tocar el renderizado.

**Las tres lecturas del ADR 0007 no entran en `scripts/verificar-cortes.mjs`.**
Las dos costuras de ese script son greps que tienen que volver vacíos sobre el
texto de un archivo, y de las tres lecturas dos no existen en ningún archivo. La
versión que un grep sí podría hacer —buscar `new Hls()` en `js/stock-player.js`—
cubre un tercio de una de las tres y pintaría verde bajo un script cuya última
línea dice que las dos costuras se sostienen, que es justo la confusión que el R1
de la fase existe para evitar. Quedan escritas en el documento de la task, con
instrumento, valor esperado y forma de la falla para cada una, y las corre la
T-07, cuyo bloque ya nombra la decisión de la T-04 como punto de partida.

**Cuatro cosas del bloque que no coinciden con el código, con la evidencia al
lado.** La nota fechada del ADR 0015 que la task pedía poner ya estaba puesta:
entró con `1716f6f plan(fase-04)`, y no se reescribió. `lib/controls.js` sí
nombra a la señalización y al renderizado, en prosa y siete veces; lo que es
cierto y es más fuerte es que no tiene una sola línea `import`. "Su pestaña de
red" no es una lectura que una sola página permita hacer tal cual, porque los dos
players comparten la línea de tiempo de recursos del navegador, así que el pedido
hay que atribuirlo: se resuelve con lo que esa instancia declara en sus propios
eventos y con la huella `_HLS_primary_id` que hls.js le pone a lo que pide su
controlador de interstitials, las dos medidas en la fase 01. Y de los campos de
un evento del manager sólo están medidos `identifier`, `dateRange.class` y
`assetListUrl`: la posición y el largo de las marcas quedan como lectura de la
T-07 en lugar de supuestos hoy.

**No sale un ADR**, y la razón es que las tres decisiones son instancias de
decisiones ya aceptadas: la nota del 2026-09-07 del ADR 0015 para la
separabilidad y la entrada pública más, el ADR 0018 para de dónde salen las
marcas —su última consecuencia ya delega esto y deja el argumento contrario
escrito—, y la nota del 2026-09-07 del ADR 0007 para las tres lecturas. Lo que la
task produce es la forma de una función, que va al documento del integrador
porque es donde el ADR 0015 dice que vive la superficie, y un procedimiento de
lectura, que va al documento de la task. Sí habría un ADR el día que exista el
principio de atrás —una capacidad nueva se publica como función, una perilla como
opción de `attach`—, pero hoy hay un caso solo y una regla escrita sobre un caso
solo es ese caso con otra forma. Se propone cuando la fase 03 traiga el segundo.

`docs/integrating-the-library.md` cambia en tres lugares y la sección 7 no se
toca: una oración en la introducción, un párrafo que acota las dos exigencias de
la sección 2 —la 2.1 es del experimento concurrente y no le aplica a la entrada
nueva—, y la sección 6 con la fila del global y la subsección de `attachControls`.
Queda dicho que entre esta task y la T-07 el documento describe una función que
la librería construida todavía no exporta: es lo que el bloque pide, una decide y
la otra construye, y está acotado porque `dist/` se arma en cada arranque desde
`lib/` y la fase cierra antes de la grabación.

Nada que correr, que es la verificación mínima que el bloque pide: la task no
toca código y lo que escribe son la decisión y el documento del integrador, que
ni `verificar-cortes` ni `npm test` miran. Ninguna línea del pane del otro
tocada.

Evidencia en `.project/phases/04-refinamiento/tasks/T-04/`. Commit sin push.

## 2026-09-07 — El pane de fábrica reemplaza: 49,47 s de atraso pasaron a 0,72 s

La T-05 de la fase 04. El Date Range de clase Apple de cada break pasa a la
forma de reemplazo, que es una línea de `scripts/senalizar-contenido.sh`, y con
eso los dos panes se quedan en el mismo segundo del programa.

**La forma del reemplazo es la ausencia del atributo, y la decidió una medición
que no dio lo que el bloque esperaba.** Se corrieron las dos candidatas más la
inserción como control: `X-RESUME-OFFSET=0` deja el punto de retorno en el
segundo en que el aviso empezó y produce el atraso de la fase 01 —12,5 s después
del primer break y 12,36 s después del segundo, contra los 12,37 s por break que
midió la T-12—, y las dos candidatas lo ponen doce segundos más adelante, con el
mismo `resumeTime` en cuatro de los cinco breaks y el mismo patrón de estrategia
de append. O sea que **las dos reemplazan y no se separan por el modo**, que es
por donde el bloque esperaba que la medición eligiera.

Lo que las separa aparece en la agenda leída después de que llegan los asset
list: con el atributo ausente `resumeOffset` queda en `NaN` y hls.js resuelve el
retorno contra el largo que **midió** del aviso —`AD-3-LINEAR` salió con
`duration` 12,037 s, `resumptionOffset` 12,037 y `resumeTime` 82,059—, y con el
offset escrito a mano vale el número escrito: el mismo evento, el mismo aviso,
`resumptionOffset` 12 y `resumeTime` 82,021. Son 38 ms acá y son la diferencia
entre un punto de retorno que es una propiedad del aviso y uno que es una
constante que hay que mantener igual al aviso. Una cuarta corrida con el asset
list declarando 8,0 s dejó el `duration` del evento en 12,027, o sea que el largo
que la forma ausente usa es el medido y no el declarado. Por eso quedó la
ausencia, y las dos son un `printf`, así que es reversible.

**El recorrido corre entero y el número es 0,72 s.** Una sola corrida, la página
cargada una vez, cero seeks del elemento del pane de la demo: a los 160 s —el
mismo instante en que la T-12 leyó 49,47 s— el pane de la demo va en 160,106 s y
el de fábrica en 159,381 s, y la captura de los dos muestra el mismo cuadro de la
misma película. Los cinco avisos lineales entran enteros, el quinto incluido:
`AD-5-LINEAR` arrancó en 120,021 y cerró en 132,059, con el VOD de 180 s todavía
lejos, así que el recorrido pasa a mostrar cinco avisos lineales en lugar de
cuatro.

**Los 0,72 s son de dos breaks y de ninguno de los otros tres**, y eso el
barrido lo muestra como escalera y no como deriva: 0,016 s hasta pasado el break
1, 0,258 s después del 2, 0,259 s después del 3 y 0,725 s después del 4 y del 5.
Los tres breaks que hls.js appendea en el lugar no cuestan nada; los dos que
pasan el MediaSource al asset y de vuelta cuestan 0,24 s y 0,47 s, que es el
precio del reattach, y son también los dos únicos seeks de la corrida —los hizo
hls.js solo, en 57,06 y 107,06—.

**Un hallazgo que le cambia la pregunta a la T-07.** El ADR 0017 y el comentario
de `js/stock-player.js` dicen que el tiempo que un cliente de mercado reporta
durante un aviso de reemplazo es el del aviso y no el del programa. Medido, es
una cosa o la otra según el break: el del aviso en los breaks 2 y 4, donde hls.js
pasa el MediaSource, y el del **programa** en los breaks 1, 3 y 5, donde appendea
el aviso adentro de la línea de tiempo del primario. La estrategia la elige hls.js
por break, según si el punto de retorno cae en un borde de segmento —sobre una
grilla de 2 s, 32, 82 y 132 caen; 57 y 107 no—. Ya está en pantalla: adentro del
quinto break la línea de estado de ese pane dice `125.3s of the ad` de un aviso
de 12 s. Esta task no lo toca, porque es el pane del otro y qué muestra ese pane
durante un interstitial lo decide la T-07; lo que le deja es que la respuesta que
su riesgo R3 pedía medir no es una sino dos, y que una de las dos ya miente en un
rótulo que entra en cámara.

**El `README.md` cambia en dos lugares y el informe de la fase 01 en ninguno.**
El párrafo del atraso se reescribió con el argumento nuevo —afuera del break los
dos panes muestran el mismo cuadro, adentro uno tiene el aviso encima de la
imagen y el otro el aviso en lugar de la imagen, y cuando vuelve están otra vez
en el mismo segundo— y se sumó el ítem que dice de dónde sale la fracción de
segundo que queda, para que quien grabe no lo reporte como defecto. Con eso la
sección pasa de tres cosas que esperar a cuatro, y el conteo de su párrafo de
entrada se corrigió. El informe de la fase 01 y la evidencia de la T-12 no se
tocaron: son el registro de lo que la inserción produjo.

`npm test`: 27 de 27. Es el chequeo que menos se espera y el que la task tenía
que correr, porque `test/program-ranges-and-volume.test.js` parsea la tabla del
recorrido y el `PLANNED-DURATION` del archivo que la task edita; ninguna de las
dos formas se movió. `verificar-cortes` no corre: ninguna de sus dos costuras
mira ese script.

Evidencia en `.project/phases/04-refinamiento/tasks/T-05/`. Commit sin push.

## 2026-09-07 — T-06 de la fase 04: la barra sobre el riel, y quién elige lo que marca

Se fue el carril de abajo. Nuestra barra queda con cinco marcas violetas adentro
del riel y nada colgando debajo: **10 nodos de marca pasaron a 5, y los 5 que
estaban a +11 px del borde de abajo del riel pasaron a 0.** El contenedor
`.qa-track__cues` no existe más en el DOM, y los bloques `.qa-cue` y
`.qa-track__cues` no existen más en el CSS. La captura de la tira de abajo, antes
y después, es la definición de done a simple vista.

**Lo que costó decidir no fue el carril: fue quién elige los rangos que una barra
marca**, y el bloque no lo nombra. Con el carril afuera y sin nada más, nuestra
barra dibujaba los diez rangos del contrato en los mismos cinco lugares —el
concurrente y el de reemplazo de cada break tienen el mismo `x` y el mismo `w`,
951,09 y 36,09 px el primero, que es la medición de la T-04 de la fase 02
saliendo sola otra vez—, o sea un color encima de otro y ninguna información
nueva. La respuesta quedó forzada por tres cosas ya cerradas: el contrato entrega
las dos clases a propósito y el proveedor de la página sigue devolviendo 10
rangos, 5 y 5, antes y después; la barra no puede filtrar por clase porque es la
misma barra que la T-07 le pone al pane de fábrica alimentada con
`kind: 'interstitial'` y porque la fase 03 va a tener un rango de reemplazo que
es nuestro; y no hay dónde ponerlo como opción, porque la T-04 cerró la firma de
`attachControls`. Así que lo elige **quien conecta un proveedor con una barra**:
`playedRanges(provider)` en `lib/concurrent-hls.js`, un `Set` de las clases que
este player reproduce, y `lib/controls.js` dibuja todo lo que recibe. Es un `Set`
y no una constante porque es la lista de lo que este player reproduce y no una
definición de la clase concurrente, y las dos dejan de ser la misma lista en la
fase 03. No se tocó `lib/signalling.js` ni la forma del contrato.

**La altura: 44 px, un solo valor, para los dos punteros.**
`calc(var(--qa-rail) * 3 + 6px)` era la aritmética de dos carriles —la mitad de
lo que sobraba debajo del riel tenía que ser el hueco más el carril— y daba 30 px
sobre un riel de 8. Con un carril esa cuenta no resuelve nada, así que el número
se eligió por lo único que le queda que decidir: cuánto mide el blanco que se
toca. La T-03 había dejado anotado que 30 está abajo de los 44 con los que se
dibuja un blanco táctil, y que el número salía de la expresión que esta task
reescribe. Es la única longitud del cromo que **no** escala con `--qa-rail`: lo
que se ve es el riel y sigue escalando, lo que se toca es una caja invisible y un
blanco es físico. Y es un valor y no uno por puntero, que es donde se aparta del
patrón de la T-03: un icono de 44 px en escritorio cambia cómo se ve el player,
una caja invisible de 44 px no se ve y le compra al mouse un click que aterriza
donde apuntó.

**Lo que la altura cuesta, medido, y lo que no.** La fila pasa de 34 a 44 px y el
bloque de la barra de 50 a 60, así que el riel sube 5 px dentro del cuadro
(y = 695,52 → 690,52). El borde de abajo de la barra no se movió. Y la caja del
contenedor y la del elemento de video son **idénticas antes y después** —715 ×
402,19 px, mismo origen—, así que la capa sigue siendo un overlay sobre la imagen
y el renderizado resuelve los layouts contra la misma caja: la caja pedida contra
la dibujada adentro del break del Quad da **delta máximo 0 px en los cuatro
elementos, antes y después**. Con el dedo (412 × 915, emulación táctil, imagen de
361,52 × 203,34) `.qa-track` mide 44 px, `--qa-icon` 44, y las cinco marcas están
sobre el riel.

**La lista de aceptadas de `verificar-cortes` bajó de cinco a tres**, que era la
mitad del valor de la task. Se fueron tres líneas —la clave `interstitial: {` de
`RANGE_LANES`, el `title:` del carril y el `background: ${RANGE_COLOURS.interstitial};`
del CSS del carril— y entró una: la entrada de `RANGE_TITLES`, con el texto
reescrito porque la marca de esa clase ahora va en el riel del player que sí
reemplaza, así que el nombre describe el comportamiento de ese player y no el de
un tercero. Las razones de las dos que quedaron se reescribieron donde dejaron de
ser exactas: `RANGE_COLOURS` es ahora también la tabla contra la que se chequea
una clase antes de dibujarla, así que la tabla de la que sale el color y la que
agarra el error son la misma y no se pueden desincronizar. Las cabeceras del
script y de `lib/controls.js` decían "cinco lugares" y "a sixth one fires": dicen
tres y "a fourth".

**Dos afirmaciones vivas se reescribieron.** La sección 2.2 del documento del
integrador decía "with the breaks marked on two lanes" —la T-04 la dejó anotada—
y ahora dice que los breaks van marcados sobre la barra misma y nada colgando
debajo, con un párrafo nuevo que dice que una barra marca lo que reproduce el
player al que está pegada y que los breaks salen del `provider` que el integrador
entrega. Y una que el bloque no nombra: la fila de `lib/controls.js` en el
`README.md` decía "the two lanes that mark where the breaks are". Es la misma
clase de afirmación y estaba en el mismo estado. La sección 7 del documento del
integrador no se tocó: los dos colores siguen fuera de la superficie pública y lo
que dice ahí sigue siendo cierto. `.project/PROJECT.md` tampoco: lo que dice de
los dos carriles está en la lista de fases cerradas, que es registro histórico.

`verificar-cortes` verde con las dos costuras y tres aceptadas. `npm test` 27 de
27, igual que antes: `rangeSpan` no se movió y el archivo sí. Y el test sirvió —un
backtick que se fue adentro del template de CSS rompió `lib/controls.js`, y lo
agarraron el test que importa `rangeSpan` y el chequeo de sintaxis del build en la
misma corrida—.

Evidencia en `.project/phases/04-refinamiento/tasks/T-06/`. Commit sin push.

## 2026-09-07 — T-07 de la fase 04: los dos panes con el mismo cromo, y qué reloj muestra la barra del de fábrica

Cerró la fase 04. El pane del cliente de mercado tiene la misma barra, los mismos
cuatro botones y el mismo reloj que el de la demo, y sigue siendo `new Hls()` sin
una sola opción: la entrada pública que decidió la T-04 —`attachControls(video,
{ container, provider, logo })`— existe, está agregada al objeto que el build
cuelga del global, y no hace nada más que dibujar el cromo y dejar el contenedor
como contexto de posicionamiento. Ninguna instancia entra, ninguna señalización
se crea y nada de lo nuestro le pide algo a la red por ese pane.

**La decisión de la task fue qué reloj muestra esa barra, y una medición dejó al
otro camino sin defensa.** La barra de ese pane es la barra del **programa**: su
reloj, su largo y sus marcas salen de `hls.interstitialsManager.primary` y de
`manager.events`, que es el mismo objeto que `js/stock-player.js` ya leía, y
ninguno de los tres sale del elemento. Alimentada con el elemento, en los dos
breaks donde hls.js le pasa el MediaSource al asset esa barra mostraría **0:02 de
0:12** y **perdería las cinco marcas**, porque con `duration` en 12,032 los cinco
rangos caen más allá del final y `rangeSpan` devuelve `null` para los cinco. Con
el programa muestra 0:45 / 3:00 y la perilla en el borde de la segunda marca.

**Y lo que muestra es cierto en los cinco breaks y no en tres.** La afirmación de
la barra es dónde quedó el playhead del programa de ese cliente, y durante un
break la respuesta es adentro de los doce segundos que el break le saca al
programa: camina esos doce segundos donde el aviso está appendeado en el lugar
(0:22 adentro de 20,02–32,06) y se queda quieto en el segundo en que el break
empezó donde el MediaSource se fue al asset (0:45). Las dos son ciertas y ninguna
dice que el programa se esté viendo; lo que ocupa ese tramo lo dice la marca. El
reloj del aviso no se perdió: es la línea de texto de abajo, que pasó a leer
`interstitialPlayer` y dice `2.1s of 12.0s` en los cinco. Ahí murió el
`125.3s of the ad` que la T-05 encontró mintiendo en cámara.

**Los cuatro controles quedan y los cuatro hacen algo**, porque un botón que está
y no hace nada es una diferencia entre los dos panes que además miente. La pausa
acciona el elemento, y es el control que la comparación cuadro a cuadro necesita.
El fullscreen acciona el contenedor, que es la decisión del ADR 0015, así que no
toca la maquinaria del break. El audio funciona en los dos panes y **los dos no
pueden sonar a la vez**: quien levanta el mute apaga al otro, en cinco líneas de
`js/app.js`, porque quién se queda con el audio de una grabación de dos players
es asunto de la página y no de la librería. El default no se movió. Y el seek
seekea el **programa**, escrito sobre `primary.currentTime`: afuera de un break
hls.js lo lleva al borde de segmento —90,01 pedido, 91,021 quedó— y **adentro de
un break no lo toma**, medido cuatro veces en las dos estrategias y en los dos
sentidos, que es el `X-RESTRICT="SKIP"` del tag haciéndose valer. Eso convirtió
al seek en la razón para no sacarlo: no es mobiliario, es la política del aviso
en funcionamiento.

**Las tres lecturas del ADR 0007, verdes.** La instancia: `userConfig` con **cero
claves** —más fuerte que la línea del archivo, porque cubre el argumento que
alguien le pase mañana— con la maquinaria presente, contra la del pane de al lado
que tiene una opción y la maquinaria ausente. La red, atribuida por dos lados: la
instancia declara los cinco `assetListUrl` en `/signalling/asset-list-linear.json`
y nada más, y de la página los cinco concurrentes salieron una vez cada uno y
**pelados**, con la huella `_HLS_primary_id` sólo en el lineal y **cero**
concurrentes con ella. Los agendados: cinco, los cinco de clase
`com.apple.hls.interstitial`, cero de la concurrente.

`verificar-cortes` verde con las dos costuras —la de ADR 0015 con cero hits, que
es la que hay que mirar acá—, `npm test` 27 de 27, el build sin quejas, y la caja
pedida contra la dibujada con **delta máximo 0 px** adentro de los dos breaks.
Cero errores y cero warnings de consola en la corrida de los dos panes.

**Cuatro afirmaciones vivas se reescribieron**: la fila de `lib/concurrent-hls.js`
del `README.md`, que decía que la superficie es "`attach`, y la configuración"; la
sección 9 del documento del integrador, que decía que esta demo es la página
mínima con una opción agregada y ahora dice que hay una llamada más; el párrafo
del par de compatibilidad del `README.md`, que decía "with nothing of this demo
wired into it" y ahora distingue la instancia del cromo; y el comentario de
`index.html`, que decía que los controles son los del player de la derecha. Más
una que nadie había anotado y que la decisión obliga: la sección 6 del documento
del integrador decía que el primer argumento de `attachControls` es "el elemento",
y ahora dice qué es y por qué, con el caso concreto de un cliente que deja de
reportar el programa mientras el aviso está en pantalla. La sección 7 no se tocó.

Y una precisión sobre el bloque: **de los cuatro controles, tres accionan el
elemento y el cuarto no**. El fullscreen acciona el contenedor, por el ADR 0015.

Evidencia en `.project/phases/04-refinamiento/tasks/T-07/`. Commit sin push.

## 2026-09-07 — Fase 04 cerrada: los seis puntos cerrados y una sola diferencia entre los dos panes

Las siete tasks en `done`, ninguna abandonada, ninguna con corrección
post-ejecución. La fase se abrió y se cerró el mismo día, así que no se comió
los días de la 03 y no hubo que ejercer el orden de recorte del R4: la T-07, que
era lo primero que se recortaba, se hizo entera.

**El criterio se cumplió.** Los dos players quedan idénticos en todo —el mismo
cromo, la misma barra, el mismo reloj, ninguna marca sobre la imagen, el mismo
segundo del programa— y distintos en una sola cosa: qué muestran durante el
break. El de la izquierda sigue siendo `new Hls()` con cero opciones, verificado
con las tres lecturas del ADR 0007 y no afirmado.

**Lo que la fase produjo y no estaba en los seis puntos** es lo más valioso que
deja, y son cinco de las siete tasks: el aviso volvía 4 s desfasado del programa
después de una pausa —11,483 s contra los 7,387 que el contrato pedía, y un
elemento en el segundo equivocado se ve perfecto en una captura— (T-01); un toque
invisible levantaba el mute, y apagar los eventos de puntero cubría sólo la mitad
porque el `pointerdown` se resuelve antes de cualquier listener y el `click`
después, ya con la capa de vuelta en pantalla (T-03); el atraso de 49,47 s se fue
a 0,72 s y el quinto break pasó a verse, con los 0,72 s repartidos en los dos
breaks donde hls.js pasa el MediaSource al asset y cero en los otros tres (T-05);
qué reporta el elemento del pane de fábrica durante un aviso no tiene una
respuesta sino dos, según si el punto de retorno cae en un borde de segmento
(T-05); alimentar la barra de ese pane con su elemento le hacía perder las cinco
marcas (T-07); y el rótulo de ese pane decía `125.3s of the ad` de un aviso de
12 s, que ahora dice `2.1s of 12.0s` (T-07).

**Dos tasks tuvieron que decidir algo que su bloque no decidía**, y las dos
quedaron escritas: la T-06, quién elige los rangos que una barra marca —quedó en
`playedRanges(provider)`, un `Set` de las clases que ese player reproduce—, y la
T-07, qué muestra la barra del pane de fábrica, que quedó siendo la barra del
programa. Es un aprendizaje sobre cómo se escriben los bloques y no un defecto de
las tasks: el de la T-07 nombraba la pregunta y por eso su decisión fue trabajo
previsto, el de la T-06 no la nombraba y por eso fue trabajo encontrado.

**El validador de frontmatter de ADR salió rojo con 20 hallazgos, todos de la
misma clase**: los 18 `id:` más el `superseded_by: 0014` del 0010 y el
`supersedes: 0010` del 0014, sin comillar. En YAML un cero a la izquierda es
octal, así que `0011` vuelve como `9`, que es el id de otro ADR de esta carpeta, y
no hay error en ningún parser. Ninguno de los 20 es una relación mal puesta, así
que no había nada que decidir sobre qué extremo se mueve: se comillan en un commit
propio inmediatamente después de este cierre. Es el mismo barrido que ya se hizo
en los otros nueve proyectos del repo; este había quedado afuera porque había
agentes trabajando adentro.

**Lo que le queda a la fase 03**, que estaba escrita y sin arrancar, es un
precedente y no una decisión pendiente: la sección 10 del documento de la T-07.
Desde la 03 nuestro player reproduce un aviso lineal adentro del break, así que
nuestro elemento va a poder dejar de reportar el programa por el mismo mecanismo;
la respuesta está en la sección 3 de ese documento y la segunda mitad la escribió
la T-06 con `KINDS_PLAYED`. Hay que aplicarlo, no decidirlo.

**El hilo abierto real: 13 commits sin pushear**, de `1716f6f plan(fase-04)` a
este cierre. La demo que se graba existe hoy en un solo disco.

Revisión de documentación, superficie por superficie, en la sección 8 del
informe. Este pase toca el índice de fases del `PROJECT.md` —la línea de la 04
reescrita con lo que la fase terminó siendo— y el item del argumento del atraso
de "A confirmar", que estaba en futuro y ahora dice lo que la T-05 midió. Dos
afirmaciones vivas quedaron anotadas y sin aplicar porque el alcance de este pase
era `.project/`: el comentario de cabecera de `css/player.css` y la justificación
del campo `kind` en el contrato de `docs/`. `docs/arc42/` no existe en este
proyecto y este cierre no lo crea: el documento de arquitectura es el contrato
entre las dos capas, que se re-leyó entero y sigue describiendo este sistema.

Informe en `.project/phases/04-refinamiento/REPORT.md`. `PHASE.md` en `closed`
con fecha 2026-09-07. Commit sin push.

## 2026-09-07 — La fase 03 tiene diseño, y el diseño se corrigió dos veces antes de existir

**La fase 03 se había generado sin etapa de diseño.** Tenía `PHASE.md` y
`TASKS.md` y no tenía `DESIGN.md`, a diferencia de la fase 01. Es plausiblemente
la causa de lo que después se le encontró: cinco punteros de arranque de task a
archivos que la fase 02 había mudado, un párrafo que un ADR del mismo día
invalidó, dos ADR de scope `project` sin listar entre las decisiones que la
gobiernan, y dos huecos del código sin dueño. Nada de eso tuvo dónde aparecer,
porque no hubo documento de exploración.

El `review-previo.md` que Nicolás pidió antes de arrancar la fase **es ese
documento**, y pasa a ser el `DESIGN.md` de la fase con `git mv`, para que la
historia quede. Nicolás: *"el documento review-previo.md en realidad no debería
ser el DESIGN.md? al final del día estamos diseñando"*.

**Lo corrigieron dos cosas, en el mismo día y en este orden.**

**Uno, la corrección de Nicolás por audio, que es la decisión de arquitectura de
la fase entera.** `X-AD-CREATIVE-SIGNALING` es una extensión **por encima** del
interstitial estándar: un asset con el bloque lo dibuja nuestro plugin; un asset
sin el bloque no se saltea, se reproduce su `URI`, que es exactamente un aviso
lineal declarado como se declaró siempre; y un bloque que falla cae al mismo
lugar. Sus palabras: *"lo que yo esperaría de nuestro plugin es que utilice la
mecánica que ya existe de interstitial para ese segmento... que nuestro plugin sea
retrocompatible... de esa forma nuestro módulo extiende el comportamiento por
defecto que HLS ya define y no tenemos que tener otro mecanismo de cómo poner
lineal"*. La consecuencia grande es que **el aviso lineal y el repliegue son el
mismo mecanismo**, y las dos tasks que los tenían separados se fusionan.

**Lo que esa corrección descartó, y queda anotado acá porque no va al
documento:** la primera versión del `review-previo.md` recomendaba declarar el
aviso lineal **con** bloque `X-AD-CREATIVE-SIGNALING`, con tres razones —dejar el
`URI` de nivel superior libre para el repliegue, que era la única forma que el
resolvedor de hoy podía ver, y que así el lineal tenía `duration` propia— y con un
`"type": "linear"` inventado. El ejemplo que lo destapó estaba en su propio
asset-list: el bloque del asset lineal apuntaba **al mismo `URI` que el nivel
superior ya declaraba**. Redundante por construcción. El `DESIGN.md` no lleva esa
recomendación: lleva el modelo corregido, y el registro de que hubo una anterior
vive acá.

**Dos, la verificación contra la norma**, que hasta ese momento nadie había hecho
contra este diseño. Se leyó `draft-pantos-hls-rfc8216bis-22` —1 de mayo de 2026,
obsoleta la RFC 8216— y corrigió cuatro cosas más:

- **La secuencia ya está en la norma** (Apéndice D.2: *"The client SHOULD play the
  interstitial assets back-to-back in the order that they appear in the ASSETS
  array"*), es `SHOULD` y no `MUST`, y no hay offset de inicio por asset: que las
  duraciones acumulen aparece sólo implícito en el ejemplo del D.7. O sea que el
  orden es herencia y la ubicación precisa en el tiempo sigue siendo nuestra. La
  acumulación de duraciones dejó de presentarse como idea propia.
- **"Reproducí el `URI` por su `DURATION`" está mal.** La norma dice *"the
  interstitial MUST end upon reaching the end of the interstitial asset(s)"*. El
  `DURATION` es metadato declarativo. La regla se escribe **"hasta el fin del
  asset"**, y eso agranda el hueco de que el contrato no tenga noción de
  secuencia.
- **La norma no tiene modelo de superposición.** Todo el Apéndice D asume que el
  primario se detiene. Así que **el degradado no es transparente**: un player
  conforme sin nuestro plugin pausa el primario para reproducir el asset del
  repliegue, y un aviso concurrente se convierte en uno lineal que interrumpe. Es
  un buen repliegue y no una equivalencia.
- **La garantía del prefijo `X-` es más floja de lo que suponíamos.** El *"clients
  MUST ignore any other attribute/value pair with an unrecognized AttributeName"*
  de la 6.3.1 cubre los atributos de los tags. El bloque de SVTA vive en el JSON
  del asset list, y para ese JSON la norma no define ninguna regla de claves
  desconocidas: la extensión es legítima y esa mitad se apoya en convención y no
  en obligación. Es pregunta para SVTA.

**Tres obligaciones** que el diseño ahora respeta y escribe: el `URI` del
Asset-Description debe ser absoluto —los de la demo son absolutos de path y no de
URI, queda anotado como no conformidad del dato—; cada asset es un Playlist y debe
ser VOD, así que el repliegue no puede ser un creativo suelto; y los interstitials
anidados deben ignorarse.

**Y una confirmación que vale la pena dejar escrita:** la norma dice que la
ausencia de `X-RESUME-OFFSET` significa reemplazo (*"its value is considered to be
the duration of the interstitial"*) y que `=0` significa que el primario retoma
donde quedó. **La T-05 de la fase 04 llegó a la ausencia midiendo en el navegador,
sin haber leído la norma, y coincide** (ADR 0017 y su nota fechada). La decisión
que se había tomado con una fuente pasa a tener dos.

## 2026-09-07 — ADR 0019: el bloque de layout es una extensión por encima del interstitial estándar

La decisión de arquitectura de la fase 03, sacada del `DESIGN.md` de la fase.
`X-AD-CREATIVE-SIGNALING` es una extensión por encima del interstitial estándar:
un asset con el bloque lo dibuja nuestro plugin, un asset sin el bloque se
reproduce por su `URI` hasta el fin del asset —que es exactamente un aviso
lineal, declarado como se declaró siempre—, y un bloque que falla cae al mismo
lugar. **El aviso lineal y el repliegue son el mismo mecanismo.** Scope
`project`, porque decide cómo se lee el formato y no sólo cómo lo lee esta demo.

La consecuencia que el ADR escribe sin suavizar es que **el degradado no es
transparente**: la norma no tiene modelo de superposición, así que un cliente
conforme que lea el asset-list y no entienda el bloque pausa el primario, y el
aviso concurrente se convierte en uno lineal que interrumpe. Es un buen repliegue
y no una equivalencia.

**Ninguna relación con un ADR anterior, y conviene decir por qué no.** El ADR
0009 rechazó la palabra "extensión" para la **clase del Date Range**, y este la
usa para el **JSON del asset list**: son dos niveles distintos, y en el segundo la
relación sí tiene algo detrás, porque las claves obligatorias siguen ahí y un
cliente que ignora el bloque igual reproduce. Nada del 0009 dejó de ser cierto.
Tampoco del 0002, del 0007 ni del 0016. El 0018 anticipa en una consecuencia que
nuestro player va a producir un rango de clase `interstitial` sobre su propio
riel, y bajo el render que esta fase adopta esa anticipación no se sigue sola;
pero una anticipación en una consecuencia no es una decisión que dejó de ser
cierta, así que el 0018 no se toca y la pregunta queda planteada en el `DESIGN.md`
y en la task que la construye.

**El documento de arquitectura del producto —el contrato entre las dos capas, en
`docs/contrato-senalizacion-renderizado.md`— sí tiene un delta pendiente por esta
decisión**, y no se aplica acá: la regla 5 dice que `activeAt` es la única fuente
de la ventana de activación, calculada desde `startTime` y `duration`, y la regla
de la norma es "hasta el fin del asset". Las dos no pueden ser ciertas a la vez
cuando el creativo dura otra cosa que su `DURATION` declarada. Cómo se resuelve es
la decisión de la task que construye el mecanismo, y la versión del documento sale
de ahí; escribirla antes sería fijar por escrito una salida que todavía no se
eligió.

## 2026-09-07 — La fase 03 se regenera desde el diseño: siete tasks y la T-04 fusionada

Etapa 2 del modo de apertura de fase: con el `DESIGN.md` escrito, el `PHASE.md` y
el `TASKS.md` se generan desde ahí en lugar de parchearse. No es la misma
operación que corregir punteros, y los dos archivos son escritura nueva.

**Lo que quedó resuelto, item por item.**

- **La T-04 y la T-05 se fusionan en una.** El ADR 0019 dice que el aviso lineal
  y el repliegue son el mismo camino de código —un asset sin bloque se reproduce
  por su `URI` hasta el fin del asset, y un bloque que falla cae al mismo lugar—,
  así que dos tasks eran dos implementaciones del mismo mecanismo. La fase pasa de
  ocho tasks a siete y se renumera entera: ninguna tenía evidencia ni plan, así
  que la renumeración no rompe nada.
- **Los cinco punteros a `js/signalling.js` y `js/renderer.js`** apuntan a `lib/`,
  que es donde la fase 02 dejó la librería (ADR 0015).
- **El párrafo del atraso del pane de fábrica se fue de la task del recorrido.**
  El ADR 0017 lo invalidó: el atraso ya no existe —0,72 s medidos por la T-05 de
  la fase 04—, el quinto aviso ya se ve y el argumento se retiró a propósito. Lo
  reemplaza la inversión del par de compatibilidad, que el `DESIGN.md` describe con
  sus tres salidas y que es decisión de David porque es lo que él cuenta en
  escenario.
- **Los ADR 0017, 0018 y 0019 entran en la lista de decisiones que gobiernan la
  fase**, que antes tenía cinco y ahora tiene ocho.
- **Los dos bugs que la fase no nombraba tienen dueño.** Que dos experiencias
  consecutivas del mismo `type` son indistinguibles para el renderizador —y por
  eso el segundo creativo no se ve nunca— es de la T-03, que es exactamente el
  escenario que lo destapa. Que el `kind` está hardcodeado y es por break y no por
  aviso es de la T-04, junto con la decisión de si hace falta arreglarlo.
- **La regla del repliegue se escribe "hasta el fin del asset"** en todos lados, y
  nunca "por su `DURATION`".
- **La T-01 se reescribe entera.** Lo que medía está contestado en el `DESIGN.md`
  por lectura, y lo que queda por medir son tres cosas: el arranque en frío de cada
  instancia de hls.js en las tres transiciones de adentro del break —la que puede
  arruinar la grabación, porque cada nodo nace con fondo negro y hoy no se nota con
  un aviso por break—, qué hace el renderizador con dos experiencias solapadas que
  declaran cajas distintas para el primario, y si el primario decodificando detrás
  de un aviso opaco cuesta lo mismo que decodificando visible.
- **La T-02 deja de escribir el plan de construcción**, porque el plan existe y
  sale del diseño, y pasa a ser el punto donde la medición vuelve a los artefactos.

**El riesgo R1 de la fase cambió de identidad.** Era "el aviso lineal puede
reabrir el ADR 0002", y el ADR 0019 lo cerró: el asset sin bloque lo reproduce
nuestro plugin con el mismo `attachAsset` que usa para todo lo demás. El R1 nuevo
son los tres arranques en frío adentro del break, que es lo que se ve en cámara.

**Y una línea del índice de fases del `PROJECT.md` se corrigió en el mismo pase**,
porque decía dos cosas que dejaron de ser ciertas: que la fase arranca después de
la 04, que está cerrada, y que el aviso lineal es el único item capaz de reabrir un
ADR de la fase 01.

La fase queda en `planning`. No se ejecutó ninguna task: esto es diseño, y Nicolás
lo revisa antes de dar el OK para implementar.

## 2026-09-07 — La verificación de la fase 03 se reescribe: se lee el estado, no se miran capturas

Nicolás corrigió el enfoque de la fase por dos lados y los dos son de fondo.

**El parpadeo negro entre avisos no es un hallazgo que merezca una medición.** Es
la consecuencia conocida de crear la instancia del aviso que entra recién cuando el
anterior salió, con arreglo conocido —traer el asset siguiente mientras corre el
actual—, así que medir cuánto dura para después precargar igual es trabajo que
ninguna decisión de la fase necesita. La precarga pasó a ser **construcción**: es
la tercera cosa que cubre la T-01, junto con la secuencia y el bug de la identidad.

**Verificar mirando capturas está mal para esta fase.** Lo que la fase construye es
mecánico —que el aviso 2 arranque cuando el 1 termina, que un asset sin bloque
dispare su `URI`, que un parámetro viaje en el pedido— y todo eso es un número o un
booleano que se lee del navegador. Cada definición de done se reescribió como una
aserción sobre el estado que **puede fallar sola**, sin que nadie mire: qué devuelve
`activeAt` en un instante dado, qué nodos hay en la capa y con qué `src`, qué
`volume` y qué `paused` tiene el `<video>` del primario, qué URL salió al
asset-list, qué devuelve `programRanges()`. `window.demo` ya expone el proveedor, el
renderizador y la capa, así que el instrumento existe.

**De dónde salió el error, que es lo que importa que quede escrito.** La fase 04
verificaba con capturas a tamaño real y **estaba bien**: sus seis defectos eran
visuales —un logo sobre la imagen, el amarillo colgando debajo del riel, los
controles que desaparecían al tocar— y mirar era la medición. Acá el contenido es
mecánico y la captura no afirma nada: un asset que corta medio segundo antes se ve
idéntico en la foto. **Se importó el instrumento de una fase a otra que no se le
parece.**

**Y el límite, que es la mitad que evita el péndulo.** Hay cosas que sólo se juzgan
mirando —si la mezcla se cuenta bien en escenario, si el par de compatibilidad dice
lo que tiene que decir— y para esas el revisor es Nicolás corriendo la demo. Eso ya
estaba resuelto así en la fase 04 y no se reemplaza por un artefacto guardado en una
carpeta. El tramo invertido de la T-05 es el caso: no se afirma con una lectura, se
mira.

**Las dos primeras tasks se cayeron, y la fase quedó en cinco.** La T-01 medía tres
cosas. El parpadeo se murió por lo de arriba. Si el primario decodificando detrás de
un aviso opaco cuesta lo mismo que visible no lo consume ninguna decisión de esta
fase: el `decoderCount` es passthrough por diseño y no hace nada con ese costo, así
que la pregunta vuelve a quedar abierta en el `PHASE.md` para la fase que le dé
semántica al número. Y qué hace el renderizador con dos experiencias solapadas sí le
importa a una decisión concreta —la regla de fin—, así que bajó a ser una lectura
adentro de esa task en lugar de una medición aparte. Sin las tres, la T-02 se quedó
sin nada que devolver al diseño: lo único que le quedaba era el pase de la medición,
porque el plan de construcción ya salía del `DESIGN.md`. La fase se renumeró entera
y ninguna task tenía plan ni evidencia, así que no rompió nada.

**El riesgo R1 cambió de forma.** Era "los tres arranques en frío se ven en cámara,
y la mitigación es medirlos primero". Ahora la mitigación es que se precargan, y lo
que queda de riesgo es que traer el asset antes no alcance para que el primer cuadro
esté listo a tiempo: el done de la T-01 lo afirma leyendo `readyState` del nodo que
entra en el instante anterior a la transición, así que si no alcanzó se sabe ahí y
no en la grabación.

**Dos cosas del `DESIGN.md` quedaron viejas y no se tocaron**, porque el diseño es
el registro de lo que se leyó y no se reescribe para que coincida con las tasks: el
cierre de la sección 10 —"es lo primero que hay que medir"— y la sección 12 entera,
que enumera las tres cosas sin medir como la primera task de la fase. De esas tres,
una se murió, otra volvió a ser pregunta abierta y la tercera se mudó adentro de la
T-02.

La fase sigue en `planning`. No se ejecutó ninguna task.

## 2026-09-07 — T-01 de la fase 03: tres avisos en un break, la identidad de cada uno y la precarga

La primera task de la fase 03 está hecha. Un break de tres avisos corre entero,
en secuencia y no encimados, el segundo se ve aunque comparta layout con el
primero, y ninguna de las transiciones pasa por un cuadro en negro. Evidencia en
`tasks/T-01/`; el escenario es `signalling/asset-list-multiAd.json`, que es un
JSON y no una rama.

**El desplazamiento de cada aviso sale de la `DURATION` de nivel superior de su
asset, acumulada, y el `start` del item pasa a leerse adentro de su propio
asset.** Las tres alternativas estaban abiertas y hoy coinciden en todos los
asset-list de la demo, así que la que decidió no fue el dato sino el caso que
todavía no existe: el asset sin bloque de la T-02 no tiene dónde llevar un
`start`, y `DURATION` es obligatorio en cada Asset-Description por el Apéndice
D.2. Una regla escrita sobre el `start` sirve para los avisos que dibujamos y no
dice nada del que no. Los seis payloads de la herramienta traen un solo asset con
`start: 0`, así que el acumulador vale 0 y nada de lo que ya corría se movió.

**Lo que la decisión cuesta quedó escrito y no resuelto.** La `DURATION` es
metadato declarado: un servidor de decisioning puede declarar un número y servir
un creativo de otro largo, y entonces los avisos que vienen después quedan
colocados contra un número que nunca fue cierto. La capa declara la secuencia y
no la corrige. Es la misma tensión que la norma abre con "hasta el fin del
asset", y de qué lado queda es la decisión de la T-02: acá se documentó el
comportamiento, no se eligió el lado.

**La identidad es un campo nuevo del contrato, `itemId`, y `id` no cambió de
significado.** `id` sigue nombrando el Date Range —lo comparten los tres avisos, y
es lo que hace que la barra marque un rango por break y no tres—, y `itemId`
nombra un aviso. La clave del renderizador pasó a ser el `itemId`. Es la regla 6
del contrato, y el mismo arreglo se aplicó a `js/contract-trace.js`, que llevaba
la misma clave y por lo tanto también se saltaba el segundo aviso en la consola:
una traza que se saltea un aviso es peor que no tener traza.

**La precarga trae el aviso siguiente 3 segundos antes preguntándole al contrato
`activeAt(t + 3)`**, o sea sin agregarle un método al proveedor. Hasta que le
toca, el nodo está en la capa y en su caja con `opacity: 0` —que lo esconde sin
sacarlo de la pintura, y un nodo que no se pinta tampoco se decodifica—, en pausa
y muteado, porque `applyPlayback` y `applyAudio` leen `drawn` y el nodo
precargado no está en `drawn`. Los 3 segundos son un trade y está argumentado
donde vive: alcanzan para las dos vueltas de red de un arranque en frío y son una
fracción chica de un aviso, así que hay como mucho un decodificador de más y sólo
durante la cola del aviso anterior.

**Las cuatro lecturas, con el recorrido corriendo.** `activeAt` devuelve
exactamente una experiencia en un instante de cada aviso, con `startTime` en 20,
32 y 44, que es lo que el desplazamiento predice. En el instante del segundo
aviso el nodo de la capa es `ad2-overlay`. `programRanges()` devuelve un rango
para el Date Range, del 20 al 56. Y en el instante anterior a cada transición el
nodo que entra ya está en la capa con `readyState` 4.

**El contraste se corrió y no se dio por sabido.** La misma corrida con la clave
vieja y la precarga apagada: en el instante del segundo aviso el nodo de la capa
es `ad1-overlay` con `currentTime` 12,032 s —el primer creativo pasado su propio
fin, corriendo de largo— y el segundo no se dibuja nunca; y antes de cada
transición el nodo que entra no existe. El tercer aviso sí se dibujaba, porque
cambia de `type`: por eso el defecto aparece cuando dos avisos comparten layout y
no antes.

**El bloque supone algo que el código no hace, y no se acomodó el resultado.** El
done pide distinguir los dos creativos por el `src` del nodo. Un asset de media
playlist se adjunta con una segunda instancia del player, así que el `src` es un
`blob:` del MediaSource y no nombra al creativo. Lo que lo nombra es el
`data-element-id` del nodo y el `uri` del elemento del contrato, y las dos
lecturas están en la evidencia.

**La costura del ADR 0015 atrapó dos cruces reales mientras se escribía la
task**: dos comentarios de `lib/` que nombraban la demo para argumentar un
número. Los dos se reescribieron sin nombrarla. Es exactamente para lo que la
verificación existe, y no habría aparecido leyendo el diff.

`verificar-cortes` verde en las dos costuras, `npm test` 27 de 27, la caja pedida
contra la dibujada con 0,0 píxeles de diferencia en los seis elementos de los
tres layouts encadenados, y el recorrido de los cinco breaks entregando los
mismos diez rangos, sin seeks y sin errores de consola.

**Lo que la task no tocó y quedó anotado.** El modo de un solo break de
`scripts/senalizar-contenido.sh` escribe `PLANNED-DURATION=12` fijo, así que el
tag concurrente del break de tres avisos declara 12 y el break dura 36. Es inerte
para nuestro player —el rango del concurrente sale de las experiencias, no del
tag— y el recorrido que se graba no lo usa, pero es un dato que miente. El
recorrido y su script son de la T-05.

## 2026-09-07 — T-02 de la fase 03: el asset sin bloque, el repliegue y de dónde sale el fin de un aviso

La task de nivel alto de la fase está hecha, y es la que David marcó como lo más
importante del día. Un asset sin bloque `X-AD-CREATIVE-SIGNALING` se reproduce
solo, a cuadro entero, con el programa corriendo detrás; un bloque que falla cae
al mismo lugar; y los tres escalones del Apéndice D.5 hacen cada uno lo suyo.
Evidencia en `tasks/T-02/`: siete corridas, una por escenario, con la consola
entera. `signalling/asset-list-linear.json`, el aviso lineal declarado sin bloque
desde la fase 01, resuelve hoy a una experiencia y se reproduce.

**La regla de fin la decide la ventana declarada, y es una divergencia con la
norma escrita como tal.** El Apéndice D dice que el interstitial termina al
terminar el asset; este cliente termina cuando se cumple la `duration` declarada,
y `activeAt` sigue siendo la única fuente de la ventana de activación. Tres
razones: un asset que nunca carga nunca termina, así que la regla del fin real
necesita igual un corte por tiempo debajo y ese corte es la duración declarada;
el contrato tiene más de un lector y con dos fuentes pueden contestar distinto
sobre el mismo instante; y la lista de rangos es monótona por promesa, así que un
fin que llega del asset movería una `duration` ya publicada.

**Lo que decidió no fue el argumento sino la lectura del solape, que se corrió.**
Con un asset-list solapado a propósito, en el instante del solape `activeAt`
devuelve dos experiencias, `drawn` queda con dos entradas apuntando al mismo
`<video>` y gana la última: el contenido primario terminó a **357,5 píxeles** de
la caja que la primera experiencia había pedido, con el aviso de esa experiencia
dibujado sobre un área que el primario ya no ocupaba. Y al cerrarse el solape el
aviso que seguía corriendo se destruyó y se reconstruyó, tirando **6,09 s** de
asset ya traído — un arranque en frío en el medio del break, que es justo lo que
la T-01 había sacado. Si el fin real mandara, eso pasaría en operación normal
cada vez que un creativo dure más que su `DURATION` declarada.

**La divergencia deja de ser silenciosa.** Las dos direcciones fallan sin verse
—un creativo más corto se queda en su última imagen hasta que la ventana cierre,
uno más largo se corta a mitad de camino, y las dos se ven idénticas a un aviso
normal—, así que el renderizador las dice en la consola con el número. La capa
sigue sin corregir nada: declara la secuencia y no la mueve.

**Se detectan tres de los cuatro casos de "no lo puedo reproducir", y los dos que
no están escritos con su razón.** No se detecta el `mediaType` que el cliente no
soporta, porque en el momento de resolver el `type` de un asset de media playlist
es el mismo string para cualquier códec que tenga adentro: el chequeo miraría el
contenedor y rechazaría nada de lo que realmente falla. Y no se detecta el layout
que pide más elementos que los decodificadores declarados, porque el número es de
la T-03; cuando exista, la comparación es una línea en el lugar donde el bloque
inutilizable ya cae al repliegue.

**La suite de tests atrapó un chequeo que habría replegado sobre todo.** La
primera versión tomaba un `uri` vacío en un elemento por bloque ilegible y puso
nueve tests en rojo: la herramienta de SVTA emite `"uri": ""` en los seis
payloads, con `"URI": "[PATH TO ASSET]"` arriba. Un cliente así replegaría sobre
todos los asset-list que la herramienta produce, que es exactamente lo que el
ADR 0004 decide no hacer. El chequeo se sacó.

**La barra marca el break entero con una sola marca, como hoy, y el ADR 0018 no
se reescribe.** El contrato define `kind` por si el rango cambia el largo de la
línea de tiempo (ADR 0016), y bajo este render el aviso a cuadro entero no lo
cambia: marcarlo de reemplazo diría que hubo un reemplazo donde no lo hubo. La
anticipación del ADR 0018 se cumple el día que un aviso de esta capa detenga el
programa de verdad.

**El ADR 0016 quedó verificado y no afirmado.** El `duration` del primario y el
`startTime` y el `duration` del rango son los mismos tres números antes, durante
y después del aviso a cuadro entero: 180, 20 y 48. Y durante el aviso el `<video>`
del primario tiene `volume` 0 y **`paused` en falso**, que es la lectura que una
captura del cuadro entero no puede dar.

**El segundo escalón lo contestó la norma y la fase lo tenía más grueso.** Un
asset que no se puede reproducir se saltea solo, con las ventanas de los que
siguen intactas —medido: el tercer asset sigue arrancando en el segundo 44—; un
asset-list que no se puede leer cancela el break entero y no reporta rango; un
`ASSETS` vacío no produce nada. El "si no están, salteá el break entero" que la
fase tenía escrito era una sola cosa donde hay tres.

`verificar-cortes` verde en las dos costuras, `npm test` 27 de 27, la caja pedida
contra la dibujada con 0,0 píxeles de diferencia —incluida la caja `0 0 0 0` del
aviso a cuadro entero, que es la primera vez que se dibuja una así—, y el
recorrido de los cinco breaks entregando los mismos diez rangos, sin seeks y sin
errores de consola.

**Lo que la task no tocó y queda anotado para la T-05.** Durante el aviso a
cuadro entero, la línea de la demo dice "primary content + CONCURRENT AD (linear)
· nothing was replaced". Es literalmente cierto —el primario nunca se detuvo— y
en escenario puede leerse al revés. Es la página de la demo y no la librería, y
la decisión de qué cuenta el pane durante el break mezclado es de producto.

## 2026-09-07 — T-03 de la fase 03: el `decoderCount` viaja, y el nombre del parámetro se decide contra la norma

La task es passthrough y quedó passthrough: el integrador declara
`decoderCount` en el `attach` del SDK, el número viaja en el GET al asset-list, y
nada de este lado lo lee de vuelta. No se agregó detección de nada.

**El nombre es `qa-decoder-count`, y la norma decidió la mitad.** El draft reserva
el prefijo `_HLS_` para sus propios query params, así que por ahí no se puede ir.
La reserva no es teórica acá: en la misma corrida el pane de fábrica pide
`asset-list-linear.json?_HLS_primary_id=<uuid>`, que es la maquinaria de
interstitials de hls.js poniéndole su huella al pedido, y esa huella es lo que la
evidencia del par de compatibilidad usa para saber qué pidió cada pane. La otra
mitad la decidió el repo: el namespace del vendor, como el global, la clase de la
capa, el `--qa-accent` y la clase de Date Range del ADR 0009. El asset-list es de
quien lo sirve y puede traer query propia, así que un `decoderCount` pelado sería
reclamar un nombre en espacio compartido. El día que la especificación nombre la
capacidad, ese nombre reemplaza a éste.

**La condición que se rompe sin verse quedó medida contra el antes.** Se corrió el
recorrido completo antes de tocar una línea, se guardaron las cinco URLs, y
después del cambio salieron **idénticas carácter por carácter**, sin query string,
con los mismos diez rangos, cero seeks y cero errores. Configurado en 3, las
mismas cinco URLs más `?qa-decoder-count=3`, verificado por concatenación.

**Lo único que el bloque no enumeraba y hubo que decidir: qué hace la librería con
un valor que no es una cuenta.** Avisa por consola y no lo manda, en lugar de
reenviarlo. Un valor así llega igual al servidor de decisioning, donde se ignora
en silencio o se contesta mal, y las dos son fallas que se parecen a que todo
anda. Es la forma que `checkConfig` y `ensurePositioned` ya tienen en ese archivo:
verificar y avisar, no exigir y no romper. El aviso sale una sola vez para los
cinco breaks, porque lo que puede estar mal es lo que escribió el integrador.

**El gancho que la T-02 dejó no necesitó plomería.** Aquella task no detectó el
caso del layout que pide más elementos que los decodificadores declarados porque
el número no existía, y dejó escrito que sería una línea donde el bloque
inutilizable ya cae al repliegue. Ese lugar lo llama `read()`, que tiene el número
en su propio alcance: no se agregó un parámetro sin consumidor para dejarlo
"preparado".

`verificar-cortes` verde en las dos costuras —el ADR 0015 con cero cruces, que es
el que dice que esto nace del lado del SDK—, `npm test` 27 de 27, y la comparación
de cajas no corresponde porque la task no toca el renderizado.

## 2026-09-07 — T-04 de la fase 03: dieciséis tests, quince mutaciones y ninguna verde

La suite pasa de 27 a **43 tests**, y los dieciséis nuevos apuntan a lo único que
esta fase agregó que no se ve en la pantalla: la aritmética de la secuencia —dónde
cae cada aviso, que sale de la `DURATION` de nivel superior acumulada, y cuál aviso
es cuál, que es el `itemId`— y la decisión del asset sin bloque, o sea cuándo un
asset cae al repliegue y cuándo no. La otra mitad ya estaba afirmada: las lecturas
del estado con el recorrido corriendo son el done de la T-01, la T-02 y la T-03, y
un navegador levantado acá no habría agregado nada.

**Cada test se vio en rojo, y las dos mutaciones que más dicen no son las que se
diseñaron para eso.** Quince cortes, quince corridas en rojo, sesenta y ocho rojos
en total y el árbol restaurado y verificado después de cada uno. Ninguna quedó
verde, así que no hubo hallazgos. Pero dos se salen de escala: **M10** —contar un
`uri` vacío como bloque ilegible, que es el error de diseño que la T-02 cometió en
su primera versión— pone en rojo diez tests, **nueve de ellos de los archivos que
ya estaban**, porque los seis payloads de la herramienta dejan de resolver a su
layout. Y **M15** —exigir un bloque `primaryContent`, que la herramienta omite en
los dos overlays— pone dieciséis. Las dos son la misma familia: un repliegue que se
dispara cuando no debería reemplaza un layout señalizado por un aviso a cuadro
entero, y la grabación de eso es la grabación de un aviso reproduciéndose.

**Una mutación que el bloque pedía no se pudo aplicar, porque describe la regla que
la T-02 eligió.** El bloque enumera "la regla de fin resuelta por `DURATION` en
lugar de por el fin del asset", y esa frase se escribió con la decisión abierta. La
T-02 la cerró en el otro sentido —la ventana declarada decide, `activeAt` sigue
siendo la única fuente— así que resolver el fin por la `DURATION` declarada no es
una mutación de esa regla: es la regla. En su lugar se rompieron las dos formas en
que esa decisión se deshace sin que se note, las dos sobre
`asset-list-solapado.json`, que es el único fixture donde el número declarado y la
ventana real no coinciden: acumular el desplazamiento desde las ventanas en lugar
de desde la `DURATION`, y hacer del rango del break la suma de las ventanas en
lugar de su unión.

**El segundo escalón del Apéndice D.5 se cubre por las puntas.** La cancelación del
break vive en el `catch` de `createSignalling`, donde está el `fetch`, y ese no es
un camino puro. Se afirma la entrada —el fixture del asset-list ilegible no es
JSON— y la salida —un break que no resolvió nada no es ningún rango—, y la
distinción con el salteo de un asset, que es de lo que se trata el escalón y en
pantalla se parece, queda afirmada entera.

`npm test` 43 de 43. `verificar-cortes` no corresponde —la task no toca `lib/`,
`js/` ni `css/`— y se corrió igual, verde en las dos costuras, porque la campaña
escribe sobre `lib/signalling.js` y sobre dos fixtures y eso verifica que los
quince cortes se restauraron.

## 2026-09-07 — T-05 de la fase 03: el break mezclado es el quinto de la corrida, y el par se invierte 12 s de 48

El break que David pidió —"concurrent, concurrent, linear, concurrent"— está adentro
de la corrida que se graba. **Es el quinto y último, y no es un break nuevo**: el
programa dura 180 s y un sexto break querría 48 s más los 13 que separan a los
otros, o sea terminar en el 193. Los cinco arranques quedan donde estaban —20, 45,
70, 95 y 120— y lo que cambia es el último, que pasa de un aviso de 12 s a cuatro de
48. El Quad se corre del 120 al 95 y el Side by side pullback, que estaba en el 95,
**no se cae de la corrida: es el segundo aviso de adentro del break mezclado**, doce
segundos enteros como cualquier otro. Los cinco nombres del documento de
requerimientos siguen estando.

Va último y no cuarto por lo que cuenta mejor en escenario: es lo nuevo de la fase y
lo que hay que explicar, así que cae después de los cuatro layouts sueltos, donde el
presentador puede hablar encima del tramo invertido en vez de tener que volver sobre
él. Cierra en el 168 y quedan 12 s de programa, que es lo mismo que separa a los
otros breaks.

**La inversión del par de compatibilidad se acepta y se explica, que era la decisión
de producto que el bloque dejaba abierta.** Los dos tags del break arrancan en el
mismo segundo (ADR 0018) y lo que no comparten es el largo: 12 s el de clase Apple y
48 el nuestro. Del 132 en adelante el pane de fábrica ya volvió al programa y el
nuestro sigue adentro del break, y del 144 al 156 —el aviso a cuadro entero— la
comparación queda al revés. Son 12 segundos de 48 y no cambian el argumento: los dos
players están haciendo lo mismo en momentos distintos, porque les tocaron breaks de
largos distintos, y el argumento vive en los otros 36. Está escrito en la tabla que
el script imprime y en `Before you record`, que es donde el presentador lo lee antes
de grabar. Si se cuenta bien en escenario lo juzga Nicolás mirando los dos panes.

**Dos datos que mentían y eran de esta task.** El `PLANNED-DURATION` estaba escrito
a mano en 12 en los dos tags, así que el concurrente de un break de varios avisos
declaraba doce segundos de un break de cuarenta y ocho: inerte para este player
—el rango sale de las experiencias y no del tag— y falso para cualquier otro cliente
que lea la playlist. Ahora cada tag declara la suma de las `DURATION` de su propio
asset-list, leída del archivo, y en el modo de un solo break también: `20 multiAd`
declara 36. Y la línea de estado del pane de la demo decía `nothing was replaced`
también durante el aviso a cuadro entero, que es cierto y se lee al revés con la
pantalla tapada; ahora dice `the programme is still playing underneath, covered and
silent`, decidido por la caja y el `zDepth` del elemento y no por el `type`, así que
un layout que algún día declare un aviso a cuadro entero con bloque recibe la misma
línea.

**El done, leído de una sola corrida de 174 s sin un seek.** 3484 muestras del
`currentTime` contra el reloj de pared: peor salto hacia atrás 0,000 s y peor
adelanto 0,009 s, con la lista de eventos `seeking` vacía. `programRanges()` devuelve
los mismos segundos que la tabla, con `AD-5-CONCURRENT` en el 120 y 48 s de largo. Y
en un instante de adentro de cada uno de los nueve avisos `activeAt` devuelve
exactamente una experiencia, en el orden que la mezcla declara, con el `itemId`
distinguiendo el primero del cuarto aunque compartan `type`. Cero advertencias y cero
errores de consola.

`npm test` 43 de 43, con `program-ranges-and-volume` movido detrás del recorrido: el
largo de cada tag se calcula del asset-list en vez de leerse de un literal, los diez
rangos se comparan contra la lectura de esta task y los nueve que no se movieron se
siguen comparando contra la de la fase 02. `verificar-cortes` verde en las dos
costuras.

## 2026-09-07 — Fase 03 cerrada: el modelo del ADR 0019 construido, y una decisión que la fase no debió llevar adentro

**Las cinco tasks en `done` y la fase cerrada el mismo día que se diseñó.** Lo
que entrega son capacidades nuevas y no arreglos, que es lo que la separa de la
04: un break de cuatro avisos mezclando concurrente y lineal, el asset sin bloque,
y el `decoderCount` viajando al pedido del asset-list. Las tres están adentro de
la corrida que se graba. Informe en `phases/03-breaks-multiples-y-repliegue/REPORT.md`.

**El modelo del ADR 0019 dejó de ser una predicción.** Un asset sin bloque
`X-AD-CREATIVE-SIGNALING` se reproduce solo, a cuadro entero, con el programa
corriendo detrás, y un bloque que falla cae al mismo lugar: el aviso lineal y el
repliegue resultaron **el mismo camino de código**, una task sola con una sola
implementación. Y el ADR 0016 quedó verificado y no afirmado — 180, 20 y 48 antes,
durante y después del aviso a cuadro entero, con el `<video>` del primario en
`volume` 0 y `paused` en falso.

**La regla de fin la decidió una medición.** La tensión entre la regla 5 del
contrato y "hasta el fin del asset" no se podía resolver razonando, así que se
corrió un asset-list solapado a propósito y la alternativa mostró lo que cuesta:
el primario terminó a **357,5 píxeles** de la caja que la primera experiencia
había pedido, y al cerrarse el solape se tiraron **6,09 s** de asset ya bajado.
Decide la ventana declarada, y la divergencia con la norma quedó escrita en
`docs/` y dicha en consola con el número.

**Cuatro hallazgos que nadie pidió.** Que el `src` de un nodo no distingue dos
creativos porque es un `blob:` del MediaSource, así que el bloque de la T-01
suponía algo que el código no hace. Que la reserva del prefijo `_HLS_` no era
teórica: el pane de fábrica pide `?_HLS_primary_id=<uuid>` en la misma corrida, y
esa huella es la que prueba que ese player sigue sin modificar. Que dos mutaciones
de los tests —contar un `uri` vacío como bloque ilegible, y exigir un bloque
`primaryContent`— ponen en rojo a nueve y a dieciséis tests de los que ya estaban,
que es el lado caro de la frontera del repliegue: uno que se dispara cuando no
debería reemplaza un layout señalizado. Y que el `PLANNED-DURATION` escrito a mano
declaraba doce segundos de un break de cuarenta y ocho.

**La verificación cambió de instrumento respecto de la fase 04, y está
argumentado.** Allá los defectos eran visuales y mirar era la medición; acá el
contenido es mecánico y una captura no afirma nada sobre él, así que cada
definición de done se escribió como una lectura del estado que puede fallar sola.
Lo que sólo se juzga mirando sigue teniendo a Nicolás corriendo la demo como
revisor.

**El defecto de diseño, que es el hallazgo de gobierno.** El bloque de la T-05
llevaba adentro que la salida de la inversión del par de compatibilidad "es
decisión de producto y de David": una fase aprobada con una decisión que depende
de una persona, que hizo frenar a la ejecución para preguntar, que es exactamente
lo que diseñar la fase existe para evitar. Se corrigió antes del cierre y en su
propio commit —el bloque dice la decisión: concurrent, concurrent, linear,
concurrent con el aviso a cuadro entero tercero, la inversión aceptada y explicada
en sus 12 segundos de 48, las dos alternativas descartadas— y el barrido de los
cinco bloques encontró un segundo pasaje más chico del mismo tipo. **De ahí salió
el gate nuevo de la regla A4 del repo padre** —un plan no se aprueba con una
decisión pendiente adentro, y la aprobación no lo levanta—, más el chequeo
equivalente que se está construyendo en `scripts/validar-proyecto.py`.

**Lo que queda abierto**: el tramo invertido pendiente de que Nicolás lo mire
corriendo la demo y de que se lo cuente a David antes del sync del 21, que va en
la misma conversación que el argumento del atraso retirado por el ADR 0017; trece
commits sin pushear, que son toda la fase; el caso del `decoderCount` contra el
layout, que la T-02 dejó afuera por falta de un dato que la T-03 después trajo y
hoy es una línea; y las dos preguntas de especificación para SVTA.

**El validador reporta dos rojos y ninguno es de esta fase**: las fases 02 y 04 no
tienen `DESIGN.md`. No se silencian y no se rellenan.

## 2026-09-08 — Fase 05 abierta y generada el mismo día: la raíz es la sdk, y seis ADR

La fase 05 se abrió en diseño y se generó el mismo día. El `DESIGN.md` —453
líneas, ocho decisiones, cada una con su alternativa descartada— quedó aprobado
sin cambios, y de ahí salieron el `PHASE.md`, el `TASKS.md` con seis tasks y seis
ADR nuevos, el 0020 al 0025.

**Lo que la fase hace**: mover al árbol del repositorio la línea que el ADR 0015
ya trazó adentro del código. La raíz queda con la sdk (`lib/`, `dist/`, `test/`,
`docs/`, `vendor/`, `server.mjs`, `run.sh`, `package.json`, y los dos scripts de
la librería) y la página baja entera a `demo/compatibility-pair/`, que es la
primera de varias demos. Y de paso corta el único acoplamiento que va en la
dirección equivocada: tres tests que leen JSON de `.project/`, dos que leen
`signalling/` y uno que parsea `scripts/senalizar-contenido.sh`.

**Los seis ADR y qué decidió cada uno.**

- **0020** — la raíz del repositorio es la librería y `demo/` es donde se la
  muestra, con una subcarpeta por demo. Reparto archivo por archivo, resuelto con
  una sola pregunta ("¿existiría si no hubiera ninguna demo?"), `vendor/` en la
  raíz porque la versión de hls.js es una propiedad de la sdk (ADR 0002), y una
  demo se nombra por el argumento que hace: `compatibility-pair`, no la ocasión,
  no el contenido, no la plataforma. **Generaliza el ADR 0015**, que queda
  `accepted` con `generalized_by: "0020"` y una nota fechada: la línea se
  ensancha del código al árbol y nada de lo que ese ADR afirma deja de valer.
- **0021** — un `signalling/` por demo, y el criterio para la lista repetida: dos
  demos que necesitaran el archivo idéntico son una demo con dos corridas, no una
  carpeta compartida. Descartado un `demo/signalling/` común, que cuesta una
  pregunta nueva por cada asset-list que se agregue.
- **0022** — el servidor recibe su raíz de documentos como argumento y monta
  `/dist/` y `/vendor/` contra la raíz del repositorio. Ocho líneas en un archivo
  de cuarenta, y a cambio los trece asset-lists, el script de señalización y los
  tres scripts de contenido quedan byte por byte iguales. Descartado reescribir
  las URIs con el prefijo de la demo (trece archivos y va contra el ADR 0004) y
  descartados los symlinks (los rechaza la guarda de traversal del propio
  servidor).
- **0023** — el código no lee `.project/` y la documentación sí lo cita. `test/`
  sólo lee `test/` y `lib/`; los fixtures se copian a `test/fixtures/` y de ahí en
  adelante son del test, sin chequeo contra el original; lo que habla del script
  de señalización baja a `demo/compatibility-pair/test/` y afirma sobre los
  archivos de la demo. La cita de `docs/contrato-senalizacion-renderizado.md` se
  queda, con una cláusula que diga que apunta a la evidencia de una fase cerrada:
  un test que **lee** el registro se rompe si el registro se reorganiza, un
  documento que lo **cita** no se rompe con nada.
- **0024** — el manifiesto declara la sdk sin afirmar que está publicada.
  `name: qualabs-concurrent-hls`, `main`/`exports` a `./lib/concurrent-hls.js` y
  no a `dist/` (que está gitignoreado), `files: ["lib/", "dist/", "docs/"]`, que
  es el campo que hace el trabajo por lo que no está adentro, `private: true` y
  `0.0.0` intactos, y `scripts` con los cuatro verbos de la sdk. `serve` y
  `content` salen porque nombran rutas de una demo.
- **0025** — el README de la raíz enruta y cada demo cuenta su corrida, con el
  reparto sección por sección de las nueve que tiene hoy. Dos reglas: cada párrafo
  va donde vive su tema y el otro README recibe un puntero y nunca un resumen, y
  el README de la raíz no describe la corrida.

**Lo que no se volvió ADR y por qué.** Las tres consecuencias que la mudanza
obliga —`lib/controls.js` deja de citar la ruta de `brand/README.md`, el grep del
ADR 0003 reescribe dos rutas, el `.gitignore` no se toca— no son decisiones
nuevas: son trabajo, y están en los bloques de las tasks. El nombre de la demo
quedó adentro del 0020, porque el criterio para nombrar una demo y la existencia
de `demo/` son la misma convención.

**El invariante que fija el orden de las tasks**, y es el hallazgo de gobierno de
esta generación: **ningún commit deja `npm test` en rojo y ninguno deja a `test/`
leyendo una demo.** Los dos acoplamientos que la fase corta se cruzan justo en el
medio de la mudanza, así que la autosuficiencia de la suite va primera (T-01), el
servidor segundo (T-02) y la mudanza tercera (T-03) llevando adentro el test nuevo
de la demo, porque separarlo en un commit propio es tener un commit con la suite
roja o con las tres afirmaciones sobre el script borradas. Ese chequeo es el que
encontró el `PLANNED-DURATION` de doce segundos en un break de cuarenta y ocho,
así que no se apaga ni por un commit.

**Los niveles de verificación.** La T-01 es la única `alto`, y no por dificultad:
lo que entrega es la red de regresión del proyecto, y una red que quedó más floja
pasa en verde igual. Lleva campaña de mutación acotada a la única regla que es
dueña —la tabla de la corrida sale de un fixture y no de un parseo— y el `diff` de
cada copia contra su original, que es el único momento en que las dos copias se
comparan a propósito: el ADR 0023 prohíbe un chequeo permanente, no verificar la
copia el día que se hace. La T-05 es `mínimo` porque todo su entregable es prosa.
Las otras cuatro son `bajo`.

**Una consecuencia del ADR 0023 que apareció escribiendo la T-02 y quedó anotada
en el propio ADR**: con `test/` leyendo sólo `test/` y `lib/`, nada de la raíz que
no sea `lib/` se puede testear unitariamente, y hoy eso es `server.mjs` y los dos
scripts de la sdk. Los tres se chequean corriéndolos. Es el costo de que la regla
no tenga excepciones, y se acepta escrito, porque una excepción es por dónde esta
regla se despegaría.

**El proyecto no tiene `docs/arc42/` y esta fase no lo crea.** Sus dos documentos
de `docs/` cumplen ese papel para el único lector que tienen, quien construye con
la sdk, y el diseño ya resolvió explícitamente no partir `docs/` en subcarpetas
por audiencia.

**El validador reporta dos rojos y ninguno es de esta fase**: las fases 02 y 04
siguen sin `DESIGN.md`. No se silencian y no se rellenan. La fase 05 sale limpia,
incluido el chequeo de que ningún bloque de task difiera una decisión a una
persona.

## 2026-09-08 — T-01 de la fase 05: la suite dejó de leer la gestión del desarrollo, y los 43 tests son los mismos 43

`test/` ya no lee un solo archivo fuera de `test/` y `lib/`, salvo el script de
señalización, que quedó en un lugar solo y con el porqué escrito al lado. Los
cinco JSON de mediciones y los trece asset-lists se copiaron a `test/fixtures/`,
y de ahí en adelante son del test: **dieciocho de dieciocho copias idénticas a su
original**, verificadas con `diff` y `sha256` el día que se hicieron, que es el
único momento en que las dos copias se comparan a propósito. La evidencia de las
fases quedó intacta como registro.

**La tabla de la corrida dejó de salir de un parseo.** Las cinco tandas —segundo
y asset-list— se declaran en `test/fixtures/run.json`, que reemplaza el
`matchAll` sobre `senalizar-contenido.sh` del que salía la mitad de los tests de
`program-ranges-and-volume.test.js`. Las tres afirmaciones que hablan del script
—que señaliza cinco breaks, que el `PLANNED-DURATION` se computa y no se tipea, y
que escribe las dos `CLASS`— siguen leyendo el script en la raíz, que es donde
todavía está: las muda la T-03, cuando exista la demo sobre la que pueden hablar.

**La red no perdió tensión, y eso se midió.** Los 43 tests son los mismos 43, con
los mismos nombres y en el mismo orden (`diff` del inventario antes y después,
vacío). La campaña de mutación acotada a la regla que la task es dueña —sacar una
tanda, cambiar un segundo, apuntar a un asset-list que no está— dio **tres rojos
de tres**, cada uno en el test dueño de la regla y con el mensaje que nombra la
causa. Ninguna quedó verde.

**Los tests nuevos son afirmaciones nuevas adentro del test que ya existía**, no
tests con nombre propio: es la única forma de cumplir a la vez lo que el bloque
pide —tests nuevos— y lo que restringe —la misma lista de nombres y la misma
cuenta—, y el propio bloque señala ese test como el lugar. La cuenta quedó en 43.
El nombre del test quedó a medio camino de lo que hace hoy, y se resuelve en la
T-03, que lo parte en dos.

**Un hallazgo, y es del instrumento y no del código**: el grep de la definición de
done, `/usr/bin/grep -rn "\.project\|signalling/" test/`, no puede dar vacío como
está escrito. Devuelve quince líneas, las quince adentro de dos JSON de
mediciones recién copiados, y son líneas de consola que el navegador imprimió
durante la corrida medida, con la URL del asset-list adentro del texto. Es dato
medido y editarlo sería falsificar un registro. El instrumento correcto es el
mismo grep sobre el código de la suite (`--include=*.js`), que sí da vacío.
Aplica igual a la T-03 y a la T-06, que repiten ese grep con `demo/` agregado, y
queda reportado sin tocar sus bloques. Por la misma razón,
`test/fixtures/README.md` escribe la procedencia sin el prefijo de la carpeta de
gestión y sin nombrar la carpeta de señalización, y dice ahí mismo que lo hace a
propósito, para que nadie borre la procedencia arreglando un grep.

`npm test` en verde y las dos costuras de `verificar-cortes.mjs` en verde. La
evidencia, con el inventario antes y después, los diffs y la salida verbatim de
las tres mutaciones, en `phases/05-la-sdk-y-sus-demos/tasks/T-01/`.

## 2026-09-08 — T-02 de la fase 05: el servidor sirve la carpeta que se le nombra, y el `..` que dispara el 403 no es el que uno escribiría

`server.mjs` recibe la raíz de documentos como primer argumento y monta `/dist/` y
`/vendor/` contra la raíz del repositorio (ADR 0022). **Sin argumento sirve la raíz
del repositorio**, que es lo que servía antes, así que el commit es una suma:
`run.sh` sigue diciendo `node server.mjs` y la demo levanta igual, con los once
archivos que la página carga en 200 y con su `Content-Type`.

Son tres piezas y 59 líneas, la mitad comentario: `DOCS` con el argumento resuelto
contra la raíz, `MOUNTS` con las dos rutas de la sdk, y `resolveFile()` que
reemplaza el `join` y la guarda y devuelve el archivo o `null`, que es el 403. El
costo de los dos montajes —un pedido a la demo devuelve archivos que no están abajo
del directorio que se le pasó— quedó escrito arriba de la constante, que es donde
lo lee quien edite el archivo.

**El hallazgo es de la guarda de traversal, y cambió cuál es el pedido que la
prueba.** El handler parsea con `new URL(...)`, y ese parser colapsa los `../` del
path antes de que el servidor vea nada: `/dist/../../etc/passwd` llega como
`/etc/passwd` y da 404 abajo de la raíz de documentos, no 403. Pasaba lo mismo antes
de esta task, y es por eso que la guarda vieja no se disparaba nunca. El `..` que
sobrevive es el percent-encodeado con la barra adentro, `%2e%2e%2f`, porque el
parser no decodifica `%2f` como separador y el `decodeURIComponent` corre después.
Y ahí la guarda importa de verdad: abajo de un montaje lo que se junta es el resto
del path, que es relativo, así que su `../` sobrevive a `normalize()` y lo único que
lo para es la comparación de prefijo. `/dist/%2e%2e%2f%2e%2e%2fetc/passwd` da 403, y
`/vendor/%2e%2e%2fdist/qualabs-concurrent-hls.js` también, que es el que muestra que
cada montaje sirve su propio subárbol y nada más. La comparación pasó a ser contra
`root + sep` en lugar de a secas, para que una carpeta hermana con el mismo prefijo
de nombre tampoco pase.

**Tests nuevos no hay, y es una decisión de la fase y no una omisión**: un test que
importara `server.mjs` dejaría a `test/` leyendo fuera de `test/` y `lib/`, que es
justo lo que el ADR 0023 acaba de instalar. El instrumento son los pedidos con su
salida verbatim. `npm test` quedó en 43 de 43, la misma cuenta que dejó la T-01, y
`verificar-cortes.mjs` en `both seams hold.` — `server.mjs` no está en la lista de
archivos de ninguna de las dos costuras, así que la palabra `demo` de su comentario
no las mueve.

Dos cosas que el bloque no cubría y se resolvieron sin preguntar. La línea de
arranque ahora dice qué carpeta está sirviendo (`-- serving compatibility-pair`):
cuesta un `relative()`, es lo primero que uno quiere saber cuando la página no
carga, y nadie parsea esa salida. Y el encabezado dejó de decir "40 lines", porque
el archivo dejó de tener cuarenta; dice "a few dozen", que es la afirmación que la
próxima edición no vuelve a falsear.

La evidencia, con los pedidos verbatim, la suite, las costuras y la corrida de
`run.sh`, en `phases/05-la-sdk-y-sus-demos/tasks/T-02/`.

## 2026-09-08 — T-03 de la fase 05: la página bajó a `demo/compatibility-pair/`, y la raíz quedó siendo la sdk

La mudanza, que es la fase. Veintiséis archivos tracked se movieron con `git mv`
—`index.html`, `css/`, `js/`, `brand/`, `signalling/` con sus trece asset-lists,
`CREDITS.md` y los tres scripts de contenido— y `content/` con su cache
`.fuentes/` de 660 MB con un `mv`, porque está gitignoreado y nunca estuvo en el
índice: nada se volvió a bajar. La raíz quedó con `lib/`, `dist/`, `test/`,
`docs/`, `vendor/`, `server.mjs`, `run.sh`, `package.json`, `README.md` y los dos
scripts de la sdk. `git log --follow` sigue la historia de cada archivo mudado:
veinticinco renombres al 100% y el de `index.html` al 98%, que son sus dos `src`.

**Un commit solo, con el test de la demo adentro**, y está así por el invariante
de la fase: separarlo es tener un commit con la suite roja o uno con las tres
afirmaciones sobre `senalizar-contenido.sh` borradas, que es el chequeo que
encontró el `PLANNED-DURATION` de doce segundos en un break de cuarenta y ocho.
`demo/compatibility-pair/test/signalled-run.test.js` son esas tres afirmaciones,
ahora sobre los archivos de la demo y no contra el fixture: leen el script y el
`signalling/` de la demo, e importan las dos constantes de clase de
`lib/signalling.js`, que es la demo nombrando a la sdk, la dirección que el
ADR 0015 permite. `npm test` quedó en 46: los 43 de `test/` que dejó la T-01 más
los 3 de la demo, sin un test borrado ni un valor esperado cambiado. `node --test`
sin argumentos descubre las dos carpetas en una sola corrida.

**Las cuatro ediciones de ruta fueron cuatro, y las trece URIs de asset-list no se
tocaron**, que es lo que el ADR 0022 existe para evitar: los dos `src` de la sdk en
`index.html` pasaron a absolutos, `run.sh` toma la demo como argumento con
`compatibility-pair` de default, las dos rutas del lado del renderizado de la
costura del ADR 0003 se reescribieron bajo `demo/compatibility-pair/`, y la cita
de `brand/README.md` en `lib/controls.js` perdió la ruta y se quedó con la frase.
Los tres scripts de contenido no se editaron —hacen `cd "$(dirname "$0")/.."`— y
el `.gitignore` tampoco.

**Un renombre de test que vale anotar.** El que se llamaba `the run of the script
is the five breaks of the recording` ahora se llama `the run of the recording is
five breaks, each naming an asset-list of this suite`. El nombre viejo nombraba al
script y el test ya no lo lee: la T-01 le había sacado el parseo de la tabla y esta
task le sacó las dos afirmaciones que le quedaban sobre él.

**El grep de la autosuficiencia encontró un comentario mío.** El texto que
explicaba dónde quedó la otra mitad del test decía la ruta completa
`demo/compatibility-pair/test/`, y el literal `demo/` es justo uno de los tres que
ese grep busca en el código de `test/`. Es el mismo caso que el punto 4 del bloque
—la cita de la librería a `brand/README.md`— y se arregló igual: se saca la ruta y
se queda la frase.

Tres cosas que el bloque no cubría, decididas sin preguntar: `run.sh` chequea que
la carpeta de la demo exista y dice qué nombre no encontró, que es la línea que un
argumento nuevo trae consigo; el comentario de `verificar-cortes.mjs` arriba de
`files` dice por qué dos de los cuatro archivos están adentro de una demo; y un
párrafo de `test/fixtures/README.md` pasó a decir que las tres afirmaciones viven
en la suite de la demo, porque decía "what stays over the script" y esta task las
bajó. Era el único lugar del repositorio donde la mudanza dejaba una frase falsa y
no lo cubre la T-05, que es de los otros dos README.

`./run.sh` levanta la demo desde la estructura nueva y sirve
`demo/compatibility-pair`. El recorrido corrió de punta a punta sin un salto,
muestreado cada 250 ms: los cinco breaks arrancaron en su segundo declarado, el
mezclado corrió sus cuatro avisos en orden y cerró en el 168, el pane de fábrica
hizo sus cinco avisos lineales de 12 s, y en 250 pedidos no hubo un solo status
mayor o igual a 400. Las dos costuras en `both seams hold.`

La evidencia —el árbol, la suite, las costuras, el recorrido entero y un cuadro
por break, más el sexto del aviso a cuadro entero donde el par se invierte— en
`phases/05-la-sdk-y-sus-demos/tasks/T-03/`.

## 2026-09-08 — T-04 de la fase 05: el manifiesto declara la sdk, y `files` se lee corriendo `npm pack`

El `package.json` pasó de doce líneas a veinte y quedó siendo la única afirmación
del repositorio sobre qué es el producto (ADR 0024). `name` es
`qualabs-concurrent-hls`, que es el nombre del archivo construido y del global que
define; `main` y `exports` apuntan a `./lib/concurrent-hls.js`, que es el punto de
entrada de las fuentes y no `dist/`, que está gitignoreado y sería una afirmación
falsa en todo clone nuevo; y `files` es `["lib/", "dist/", "docs/"]`. `description`
y `type: "module"` no se tocaron, y `private: true` con `version: 0.0.0` se quedan:
el manifiesto declara qué **es** la sdk sin afirmar que está publicada.

**`npm pack --dry-run` es el campo `files` leído por la herramienta**, y lista diez
archivos: los cinco de `lib/`, el de `dist/`, los dos de `docs/`, y `package.json`
con `README.md`. Nada de `demo/`, `test/`, `scripts/`, `vendor/`, `server.mjs` ni
`run.sh`, que es lo que este campo dice sobre todo por omisión. Los dos últimos no
son una fuga: npm los incluye siempre, con `files` o sin él, junto con `LICENSE` y
el archivo de `main`. Y dos cosas que sólo se ven corriendo el comando, las dos a
favor del ADR y no en contra: **`dist/` entra al paquete aunque esté
gitignoreado**, porque `files` es una lista blanca y le gana al `.gitignore` que
npm usa cuando no hay `.npmignore`; y **`private: true` no frena a `npm pack`**, lo
que frena es `npm publish`. O sea que el campo es verificable hoy, sin publicar
nada, que es la consecuencia que el ADR le pedía.

**Los cuatro verbos existen y corren**: `build` (`./scripts/construir-libreria.sh`)
dio los 2328 lines del global `QualabsConcurrentHls`, `check`
(`./scripts/verificar-cortes.mjs`) dio `both seams hold.`, `test` quedó en 46 de 46
y `start` levantó la demo sirviendo `demo/compatibility-pair`, con el HTML, hls.js,
la librería construida y un asset-list en 200, que son las tres raíces que el
servidor monta. `check` corre el `.mjs` sin `node` adelante porque el archivo tiene
su shebang y el bit de ejecución; los cuatro verbos son la ruta al archivo y nada
más.

**`serve` y `content` se fueron del manifiesto** porque nombraban rutas de una demo
—y `content` además apuntaba a una ruta que la T-03 ya había movido—. La T-05 los
escribe en el README de la demo con su ruta completa. El efecto de segundo orden
que el ADR anticipa se cumple: el nombre de la demo por default quedó en un solo
lugar del repositorio, la línea `DEMO="${1:-compatibility-pair}"` de `run.sh`, que
además quedó siendo el único arrancador del servidor.

**El hallazgo: el nombre viejo sobrevive en dos lugares, y esta task no los tocó.**
El grep del árbol tracked fuera de `.project/` devuelve `README.md:1`, que es de la
T-05 y está siendo reescrito, y `server.mjs:107`, que es la etiqueta de la línea de
arranque. El segundo se deja por dos razones: el bloque de esta task es el
manifiesto, y sobre todo **cuál tiene que ser la etiqueta nueva no lo decide ningún
ADR**. `server.mjs` sirve una demo y no la sdk, así que copiarle el `name` del
manifiesto es la respuesta cómoda y no necesariamente la correcta. Es una etiqueta
de consola, sin efecto funcional y sin costura que la mire. Queda reportado.

Ninguna costura se movió, y estaba previsto que pudiera pasar: el grep del ADR 0015
busca el literal `demo` con lista de aceptados vacía, y el `./run.sh` de `start` lo
contiene, pero su lista de archivos es `lib/*.js` y `scripts/construir-libreria.sh`
y el manifiesto no está adentro. Se corrió igual.

La evidencia, con la salida verbatim de los cinco comandos, en
`phases/05-la-sdk-y-sus-demos/tasks/T-04/`.

## 2026-09-08 — T-05 de la fase 05: el README de la raíz enruta y la demo cuenta su corrida

Las 347 líneas y nueve secciones del README único quedaron en dos documentos: la
raíz en 170 líneas, que dice qué es la sdk y dónde está escrita cada cosa, y
`demo/compatibility-pair/README.md` en 243, que dice qué muestra esa demo y cómo
se levanta. El reparto lo decidió el ADR 0025 y esta task lo ejecutó sin
redecidir nada: *Run it*, *Before you record* con su tabla de los cinco breaks y
*The compatibility pair* bajaron enteros a la demo; *The two layers* y *The
library, and the page that uses it* se quedaron en la raíz; *Test it* y *What is
where* se partieron, cada uno con lo suyo.

**La raíz ya no describe la corrida, y esa es la propiedad que la fase compra.**
No queda una sola línea de los cinco breaks, del audio, de ffmpeg ni del
localhost arriba; lo que hay es una sección `demo/` de una fila —qué argumenta
`compatibility-pair`, el link a su README, el ADR 0007— más `./run.sh <demo>`.
Una demo nueva agrega una fila y escribe su propio README, sin tocar ninguna otra
sección.

**Los dos punteros eran la duplicación menos visible de las tres**, porque
estaban escritos completos en el README y en `docs/`. La maquinaria de
interstitials apagada quedó en tres líneas —el requisito, que es de la sdk— y
manda a `docs/integrating-the-library.md` §2.1 por el por qué, el warning y el
síntoma. Los dos defaults que la herramienta omite quedaron en que no emite
`volume` ni el bloque `primaryContent` de los dos overlays y que la capa los
asume, con el detalle de cada uno en el contrato. Los dos dicen lo justo para
saber si hay que seguirlos, que es lo que un puntero tiene que hacer y un resumen
no.

**La cita de `docs/` a `.project/` se quedó, con su cláusula.** El JSON de la
T-06 de la fase 01 es la evidencia de una fase cerrada, y ahora el contrato lo
dice: la cita es la procedencia de una medición, no una ruta que alguien resuelva
en tiempo de ejecución (ADR 0023). Nada más de `docs/` se tocó.

**Tres cosas que el bloque no cubría, decididas y hechas.** El título de la raíz
era `# hls-non-linear-ads-demo`, el `name` que el ADR 0024 sacó del manifiesto, y
pasó a `# qualabs-concurrent-hls`: con eso se cierra uno de los dos
sobrevivientes del nombre viejo que reportó la T-04, y el otro —la etiqueta de
consola de `server.mjs:107`— sigue abierto y no es de esta task. La frase "one
thing to do before the camera rolls, and five to expect" tenía seis párrafos
abajo y quedó en seis. Y dos filas de tabla que decían "the same contract" y
"none of the above" se apoyaban en secciones que ahora viven en el otro
documento: se reescribieron, porque la regla es que cada README se lea solo.

**El chequeo de links fue más allá del link markdown a propósito**: lo que se
quedó viejo dos veces en esta fase fue una ruta escrita en un comentario, no un
link. Se resolvieron contra el disco los 12 links markdown y las 48 rutas
escritas en prosa o en un bloque de código de los dos documentos, y el único
hallazgo fue `verificar-cortes.mjs` suelto en la fila de `scripts/`, que no
resuelve desde la raíz: quedó `scripts/verificar-cortes.mjs`, que es la
convención que la tabla ya usaba para los cinco archivos de `lib/`.

`npm test` en 46 de 46 y las dos costuras en verde. Ninguna de las dos mira un
README —la del ADR 0015 grepea `lib/*.js` y `scripts/construir-libreria.sh`, y el
grep de autosuficiencia de `test/` va acotado a `*.js`—, y se corrieron igual.

La evidencia, con la salida verbatim del chequeo de links y de la suite, en
`phases/05-la-sdk-y-sus-demos/tasks/T-05/`.

## 2026-09-08 — T-06 de la fase 05: la fase probada como un todo, y los dos hallazgos que quedaban, cerrados

La verificación de la fase corrida sobre el resultado entero, en el orden que el
`PHASE.md` fija. `./run.sh` levantó la demo desde la estructura nueva sin
argumento, el recorrido de los cinco breaks corrió entero hasta el final
—`video.ended` en 180.03 s— y de los 250 pedidos de la corrida ninguno volvió con
status >= 400, que es el chequeo que atrapa una ruta que sólo falla en runtime.
`npm test` en 46 de 46, `npm run check` en `both seams hold.`, y el grep de
autosuficiencia de `test/` en cero líneas.

**La cuenta de tests es la misma que antes de la fase**, y era la forma en que
esto podía salir mal en silencio: 43 en `test/` antes y 43 después, con los
mismos tres archivos y las mismas cuentas por archivo, más los 3 de la demo. El
número que más podía moverse, el de `program-ranges-and-volume.test.js`, quedó en
12 de los dos lados: las tres afirmaciones que bajaron a la demo se compensan con
el test de integridad del fixture que la T-01 agregó.

**Y lo que sólo se podía mirar acá, porque es sobre el conjunto**: el `ls` de la
raíz devuelve `lib/`, `dist/`, `test/`, `docs/`, `vendor/`, `demo/`, `scripts/`,
`server.mjs`, `run.sh`, `package.json` y `README.md`, y nada de la página. Ni un
archivo de la demo quedó arriba, que es el defecto que ninguna task anterior iba a
encontrar porque cada una miraba su propio pedazo.

**Los seis cuadros, mirados como imagen**, uno por break más el del aviso a cuadro
entero de adentro del mezclado. Los cinco layouts se ven como tienen que verse, y
el del break 2 se comparó contra el de la T-03: la misma composición, los mismos
recuadros, el mismo segundo. La mudanza no movió un píxel.

**La etiqueta de `server.mjs` quedó decidida.** La T-04 la había dejado abierta
con razón, porque ningún ADR dice cuál tiene que ser y copiarle el `name` del
manifiesto a un servidor que sirve una demo era la respuesta cómoda. El criterio
que la cierra es que **la etiqueta nombra a la herramienta que imprime la línea**,
que es la convención que las otras dos ya usaban: `construir-libreria:` sale de
`scripts/construir-libreria.sh` y `verificar-cortes:` de
`scripts/verificar-cortes.mjs`, las dos el nombre del archivo sin extensión. Así
que dice `server:`. No le corresponde el nombre del producto porque no sirve la
sdk, y tampoco el de una demo porque sirve la que se le nombre; qué carpeta está
sirviendo ya lo dice la misma línea después del guión. Con eso el nombre viejo no
queda en ningún archivo tracked fuera de `.project/`.

**El chequeo de rutas se corrió sobre el árbol entero y no sobre dos archivos**,
que es el otro hallazgo que la fase dejó abierto: lo que se quedó viejo dos veces
acá fue una ruta adentro de un comentario, no un link. Los 36 archivos de texto
tracked fuera de `.project/`, con los links markdown y además cada ruta escrita en
prosa, en un bloque de código o en un comentario. 12 links y 179 rutas resueltas,
y **una ruta vieja**: `test/fixtures/README.md` decía que `run.json` reemplaza el
parseo de `scripts/senalizar-contenido.sh`, y ese script bajó a
`demo/compatibility-pair/scripts/` con la mudanza, así que la ruta apuntaba al
`scripts/` de la sdk, que no lo tiene. Quedó nombrado por lo que es, el script de
señalización de la demo.

**Y una frase que un ajuste de la propia fase dejó falsa.** Ese mismo README
justificaba escribir sus rutas sin prefijo diciendo que el grep de autosuficiencia
mira la carpeta entera, "este README incluido"; el grep se acotó al código cuando
la T-01 encontró las quince líneas de dato medido, así que el README dejó de estar
adentro del alcance y la razón escrita dejó de ser cierta. El párrafo ahora dice
el alcance que el chequeo tiene, y la omisión se queda, porque una ruta completa
es algo para seguir y la procedencia de una copia es algo para saber. Los dos
arreglos quedaron anotados como `post-ejecución:` en las tasks que los
introdujeron.

**Lo que se reporta y no se toca**: las cinco citas a `.project/` de ese README
podrían escribirse completas, porque el ADR 0023 dice explícitamente que la
documentación cita el registro y el grep acotado ya no las alcanza. Es cambiar una
decisión de la T-01 y no arreglar un defecto, así que queda dicho para el cierre.

Cero hallazgos abiertos. La evidencia, con la salida verbatim de los cuatro
chequeos, los seis cuadros y el chequeo de rutas con su script, en
`phases/05-la-sdk-y-sus-demos/tasks/T-06/`.

## 2026-09-08 — Fase 06 abierta y generada el mismo día: el foco de audio, y cinco ADR

La fase 06 se abrió en diseño y se generó el mismo día. El `DESIGN.md` —405
líneas, siete decisiones, cada una con sus alternativas descartadas y una tabla
de descartes al final— quedó aprobado, y de ahí salieron el `PHASE.md`, el
`TASKS.md` con tres tasks y cinco ADR nuevos, el 0026 al 0030.

**Lo que la fase hace**: darle a quien mira la mitad que el ADR 0014 le había
dejado a quien arma la campaña. Con el cromo arriba, un toque sobre una caja de
video del aviso y esa caja es la que suena; el resto de la composición, primario
incluido, va a 0. Es una fase chica y es un POC: lo que se muestra es cómo sería,
así que nada se mide más allá de lo que hace falta para que el gesto funcione en
pantalla.

**El insumo** es el análisis en `sandbox/analisis-foco-de-audio-2026-09-09.md` del
repo padre, que midió catorce hechos del código y dejó cinco casos abiertos; el
diseño los cierra.

**Los cinco ADR y qué decidió cada uno.**

- **0026** — el foco es exclusivo y es **un índice único de toda la composición**,
  no un flag por elemento. El elemento con foco suena a 100 y todo el resto va a
  0, el primario con `volume = 0` y nunca con `muted`. De ahí salen gratis el Quad
  (tres cuadrantes más el primario) y dos experiencias solapadas. La aritmética va
  en una función pura al lado de `volumeOf`. **Generaliza el ADR 0014**, que queda
  `accepted` con `generalized_by: "0026"` y una nota fechada: el asset list
  declara el estado inicial y eso no cambia; lo que se ensancha es quién contesta
  cuál de varias fuentes concurrentes se escucha, que el 0014 le asignaba a quien
  arma la campaña. Descartada la regla como venía enunciada, "el elemento tocado
  se lleva el nivel del primario", que medida contra el código es un no-op en el
  Quad y produce audio doble en `cornerOverlay`.
- **0027** — enfocable es **una caja de video del aviso y nada más**. El primario
  no es blanco del gesto porque un `pointerdown` sobre la imagen ya significa
  alternar el cromo, y hacerlo enfocable convertiría cada toque en un cambio de
  audio. Las imágenes tampoco, porque no tienen audio. El aviso lineal a cuadro
  entero del break 5 sí es enfocable y no molesta: declara 100 en el aviso y 0 en
  el programa, así que enfocarlo da la mezcla que ya estaba.
- **0028** — el gesto es un **`pointerdown` sobre la caja** y **sólo cuenta con el
  cromo arriba**. Una regla, dos comportamientos: con mouse el hover ya subió el
  cromo, así que el click actúa de una y en escritorio es un click y no dos; en
  celular el primer toque muestra y el segundo actúa; en un híbrido decide si el
  cromo está visible. Es `pointerdown` y no `click` porque en el segundo toque el
  `pointerdown` del contenedor baja el cromo antes de que llegue el `click`. Los
  punteros se habilitan en el **nodo** y en **`place()`**, no en la capa y no en
  `createNode`: `bringAhead` construye nodos posicionados con `opacity: 0` y
  opacity no detiene un dedo. El cableado va en `attach()`, con `up` agregado al
  handle de `createControls` y un predicado que el renderer consulta.
- **0029** — el foco **se suelta a la mezcla declarada**, no al primario (en el
  Quad el primario declara 10), por cuatro caminos y sin preguntar nada: se toca
  de nuevo el elemento enfocado, se rearma la composición, el asset se termina
  antes que su ventana, o cierra el break. Los dos últimos ya están detectados en
  el código; el cierre de break ya funciona con `clear()`.
- **0030** — la **marca la dibuja el renderer** sobre el nodo que creó, porque
  `controls.js` tiene prohibido tocar la capa de los avisos. Un `outline` de 4 px
  en `#FFD400` con `outline-offset` negativo, inline sobre el nodo, escrito en la
  misma función que mueve el índice y recalcula la mezcla. Sobrevive al auto-hide
  por construcción, porque vive en la otra capa. Descartados el toast y el parlante
  al lado del anillo.

**Dos de las siete decisiones del diseño no se volvieron ADR, y es a propósito.**
La sexta decide que el ADR de esta fase **generaliza el 0014 y no lo supersede**:
eso no es una decisión sobre el sistema sino sobre cómo se escribe el registro, y
queda expresada donde vive, en el `generalizes: ["0014"]` del 0026 y en la nota
fechada del 0014. Un ADR cuyo contenido fuera "este ADR generaliza a aquél" no
afirma nada del sistema. La séptima decide que **el foco es un paso opcional de la
corrida grabada** y que el guion no lo pide: es alcance y calendario, no forma del
sistema, así que vive en el `PHASE.md` —en el fuera de alcance y en la sección de
calendario— y su parte entregable, las dos oraciones del README de la demo, es la
T-03.

**Las tres tasks, y las tres en `bajo`.** T-01, el foco cambia la mezcla y el
índice es uno solo, con el test unitario de la función pura que es la única lógica
no visual de la fase; T-02, el gesto mueve el foco y el anillo dice cuál es;
T-03, las dos oraciones del README y la corrida mirada entera. Ninguna lleva
campaña de mutación: lo que la fase entrega se escucha y se mira en pantalla, y
su modo de falla está a la vista en el primer break. Vara de POC, escrita en el
`TASKS.md` para que quien ejecute no la suba por prolijidad.

**La documentación del producto no cambia, y la respuesta es del propio
documento.** El contrato de señalización y renderizado ya trae `volume` y dice de
sí mismo que la política de audio no está ahí
(`docs/contrato-senalizacion-renderizado.md:214`), así que un override en tiempo
de ejecución es del renderizado por definición: la costura del ADR 0003 aguanta
sin excepciones nuevas y el grep de `scripts/verificar-cortes.mjs` no crece. El
proyecto no tiene `docs/arc42/` y esta fase no lo crea, por la misma razón que la
fase 05: los dos documentos de `docs/` cumplen ese papel para el único lector que
tienen.

**El validador** quedó con los dos rojos conocidos y ninguno nuevo: las fases 02 y
04 sin `DESIGN.md`, que es una decisión pendiente y no se toca acá.

## 2026-09-09 — T-01 de la fase 06: el audio sale de un índice único, y el índice compara por identidad

El audio de la composición pasó a salir de un índice de foco único. Con nadie
enfocado suena la mezcla que declara el asset list, que es lo que ya sonaba; con
un elemento enfocado suena ése a 100 y todo el resto va a 0, el primario
incluido. El gesto que mueve el índice es de la T-02, así que **en pantalla no
cambió nada**: lo que esta task entrega es la aritmética, y por eso su
verificación es un test unitario y no una mirada.

**Cinco lugares de `lib/renderer.js`, y uno solo es código nuevo de decisión.**
`effectiveVolumeOf(element, focused)` es la función pura exportada al lado de
`volumeOf`, con tres ramas: lo declarado cuando nadie tiene el foco, 1 en el que
lo tiene, 0 en el resto. `applyAudio` cambió en una línea, la que decía
`volumeOf(element)`. El índice es un `let focused = null` junto al resto del
estado del renderer. Y las tres salidas del ADR 0029 que no dependen del gesto
quedaron donde el evento ya estaba: la segunda y la cuarta en `clear()`, que en
el código son el mismo evento, y la tercera en el `ended` del nodo.

**`video.muted` no se toca en ningún camino**, que era el invariante de riesgo: el
foco escribe `volume`, y `muted` sólo en los nodos del aviso, donde `applyAudio`
ya lo escribía. La compuerta `const off = video.muted` sigue apareciendo una sola
vez y es la misma línea de código. Con la composición muteada, tocar una caja
cambia qué se escucharía y no se escucha nada, que es lo correcto: el switch
decide si suena algo y el foco decide qué, de lo que suena.

**El índice compara por identidad del elemento y no por `id`, y es una decisión
de la task.** Un `id` nombra un elemento adentro de un layout, y la composición
puede tener elementos de más de un layout a la vez —dos experiencias solapadas
ponen avisos de dos breaks distintos encima del programa—, así que la identidad
es la única comparación que no depende de que dos layouts no hayan coincidido en
un nombre. Los elementos son estables porque `activeAt` filtra un array guardado
(`lib/signalling.js:519`), que es de lo que ya depende `bringAhead` para
reconocer un nodo precargado.

**El foco se suelta en todo `ended` y no sólo en los que la advertencia
reporta**, que es la otra decisión. Un nodo que terminó está callado igual, y el
foco quedándose ahí deja la composición entera en 0: audio faltante, que es la
falla que no se ve en un cuadro.

**Verificación, nivel `bajo` y sin campaña de mutación.** `npm test` da **49 en
verde**, los 46 de antes más los tres casos de la función pura, sin un solo valor
esperado de los que ya existían tocado; `npm run check` sigue en
`both seams hold.`. El test nuevo es `test/audio-focus.test.js` y no una sección
adentro de `program-ranges-and-volume.test.js`, cuyo encabezado declara ser la
medición de la T-06 de otra fase. Sus datos son los asset lists reales de
`test/fixtures/`, y eso es lo que hace que los casos sean los que importan: el
Quad, donde una regla que le diera al elemento tocado el nivel del primario no
cambiaría nada audible, y el cornerOverlay, donde quedarían dos bandas sonoras a
la vez.

## 2026-09-09 — Fase 05 cerrada: la raíz es la sdk, y el cierre llegó sin decisiones adentro

Las seis tasks en `done` y el informe en
`phases/05-la-sdk-y-sus-demos/REPORT.md`. La fase se abrió, se diseñó y se
ejecutó el 2026-09-08 y se cerró al día siguiente.

**Lo que entrega, y las dos cosas son verificables sin opinión.** La raíz es la
sdk: el `ls` devuelve `lib/`, `dist/`, `test/`, `docs/`, `vendor/`, `demo/`,
`scripts/`, `server.mjs`, `run.sh`, `package.json` y `README.md`, y ni un archivo
de la página quedó arriba. Y una demo es una carpeta que se nombra, se levanta y
se multiplica sin tocar la librería: `./run.sh <demo>` sirve su propia carpeta
como raíz de documentos con `/dist/` y `/vendor/` de la sdk montados encima
(ADR 0022), que es lo que dejó los trece asset-lists y los tres scripts de
contenido byte por byte iguales y la cuenta de rutas de runtime por editar en dos
`src`.

**Lo que midió la T-06 sobre el resultado entero**: el recorrido de punta a punta
desde la estructura nueva sin un salto, `video.ended` en 180,03 s; 250 pedidos y
ninguno con status ≥ 400; 46 tests en verde, los 43 de `test/` —los mismos 43 que
antes de la fase, con los mismos nombres y las mismas cuentas por archivo— más
los 3 de la demo; las dos costuras en `both seams hold.`; el grep de
autosuficiencia en cero; y los cinco breaks mirados en cuadro, con el del break 2
comparado contra el de la T-03. La mudanza no movió un píxel.

**Nueve commits**: los seis de las tasks (`94677ca`, `e69166b`, `e1ad898`,
`dbcca8d`, `c9fccad`, `aa89d90`) y tres arreglos que la fase se hizo a sí misma
—`a797f37` el grep acotado al código, `20923ef` el `status` que decía `planning`
con las seis tasks hechas, y `4ac7ee6` las cinco citas de
`test/fixtures/README.md` escritas completas—.

**El cierre no llevó ninguna decisión adentro, y la que llegó se resolvió antes
de él.** La T-06 dejó dicho que las cinco citas a `.project/` podían escribirse
completas y lo dejó "para el cierre" porque cambiaba una decisión de la T-01. No
era una decisión pendiente: el ADR 0023 de esta misma fase ya la había tomado, y
su título la dice entera. Las citas estaban abreviadas para no disparar un grep
que buscaba esos nombres en la carpeta entera, ese grep se acotó al código en
`a797f37`, y con eso la razón de la abreviatura desapareció. Se escribieron
completas y las cinco resuelven.

**Los cuatro hallazgos que la fase produjo y no arregló**, que son los que tienen
que sobrevivir al cierre y están en la sección 4 del informe:

- **La definición de done de tres tasks pedía un grep que no podía pasar nunca.**
  Devuelve quince líneas y las quince están adentro de dos JSON de mediciones:
  son líneas de consola que el navegador imprimió durante la corrida medida, o
  sea dato medido, y editarlo falsificaría un registro. Lo encontró la T-01
  corriendo el grep que su propio done le pedía en lugar de declararlo pasado. Lo
  que queda abierto no es el grep, es cómo se escribió: **un chequeo que no puede
  pasar nunca y un chequeo que pasa siempre son el mismo defecto.**
- **El `..` que uno escribiría nunca disparó el 403, y nunca lo disparó**, porque
  `new URL()` colapsa los `../` del path antes de que el servidor vea nada y el
  pedido llega como una ruta abajo de la raíz de documentos: 404 y no 403. El
  vector real es el percent-encodeado con la barra adentro, `%2e%2e%2f`. La
  guarda hoy anda, y no la cubre ningún test ni la puede cubrir, porque un test
  que importara `server.mjs` rompería el ADR 0023: la única red son los cuatro
  pedidos de la evidencia de la T-02.
- **El verbo `content` del manifiesto estaba roto desde la T-03 y sacarlo lo
  arregló de rebote.** La T-04 lo sacó porque nombraba una ruta de una demo, y el
  dato es que además apuntaba a una ruta que la mudanza ya había movido. Nada en
  el repositorio chequea que un `script` del manifiesto resuelva a un archivo que
  existe: el `package.json` no está adentro de la lista de ninguna de las dos
  costuras.
- **La etiqueta de consola de `server.mjs` quedó decidida por la T-06 con un
  criterio que ya estaba en el repositorio sin estar escrito**: la etiqueta nombra
  a la herramienta que imprime la línea, que es lo que `construir-libreria:` y
  `verificar-cortes:` ya hacían. Por eso dice `server:`, y por eso costó una
  decisión en la última task en lugar de resolverse sola.

**Tres correcciones post-ejecución, en la T-01, la T-03 y la T-04, y las tres las
encontró la T-06.** Es la primera fase del proyecto con más de dos, y leídas como
medición dicen algo del instrumento y no del `done`: el bloque de la T-06 pide
explícitamente que lo que encuentre se corrija en la task que lo introdujo, así
que tres correcciones son la convención funcionando. Dos de las tres son
documentación y ninguna es código, en el mismo archivo —`test/fixtures/README.md`,
que ninguna task tenía como entregable después de la T-01—, y la tercera no es
una corrección sino una decisión que la T-04 devolvió a propósito.

**De los cinco riesgos se materializó uno, el R2, y en una forma adyacente a la
escrita**: la ruta que se queda vieja apareció dos veces y las dos veces adentro
de un comentario, no en un `src` ni en una URI. Es el ADR 0022 funcionando mejor
que el enunciado del riesgo, y el instrumento que lo atrapó fue un chequeo de
rutas sobre los 36 archivos de texto tracked —12 links y 179 rutas resueltas— y
no el navegador. El R5 no se materializó: 26 archivos con `git mv`, 25 renombres
al 100 % y el de `index.html` al 98 %, y `content/.fuentes/` mudado con un `mv`
sin volver a bajar nada, 660 MB medidos contra los 535 MB que estimaba el riesgo.

**La revisión de documentación cerró trece superficies.** Los dos README y la
cláusula de procedencia de `docs/` los habían dejado al día las tasks, no el
cierre; `docs/contrato-senalizacion-renderizado.md` se re-leyó entero y sigue
describiendo este sistema, porque el delta de la fase es de forma y no de
comportamiento; `docs/arc42/`, el `CLAUDE.md` del proyecto, `.project/knowledge/`
y un `INSTALL.md` no existen y este cierre no los crea, con la razón escrita en
cada caso. Lo único que el cierre escribió es la línea de la fase en el índice del
`PROJECT.md` y `last_update`. **El `status` del proyecto queda en `ongoing`**: la
fase 06 está abierta.

**El validador sale en rojo con dos hallazgos y ninguno es de esta fase**: las
fases 02 y 04 siguen sin `DESIGN.md`. Son los mismos dos que reportó la apertura,
no se silencian y no se rellenan, y la decisión es de Nicolás. La fase 05 sale
limpia.

**Y un agujero que el cierre encontró y no le corresponde llenar: la fase 06 no
tiene línea en el índice de fases del `PROJECT.md`.** Está abierta desde el
2026-09-08 y el índice no la nombra. Es el mismo agujero que tuvo la 05 mientras
estaba abierta, así que no es un olvido de una vez: el índice se está escribiendo
al cerrar y no al abrir, y el comentario del propio índice dice que la línea de
una fase abierta dice para qué está.

## 2026-09-09 — T-02 de la fase 06: el gesto mueve el foco, y el anillo se va cuando el asset se termina

Con el cromo arriba, un toque sobre una caja de video del aviso enfoca esa caja:
suena ésa sola —el primario callado incluido—, un anillo amarillo aparece encima,
y tocarla de nuevo devuelve la mezcla que declara el asset list. Con el cromo
abajo el toque no cambia el audio: muestra el cromo, que es lo que ya hace
cualquier control de este player. El índice que la T-01 dejó en `null` ahora se
mueve, así que la fase se ve y se escucha en pantalla.

**La asimetría salió del predicado y no de dos reglas.** El gesto pregunta *¿está
el cromo arriba?* y nada más, así que con mouse —donde el hover ya lo subió— **un
click actúa de una**, y con dedo el primer toque muestra y el segundo actúa. No
hay una rama por dispositivo en ninguna parte, y por eso una notebook con pantalla
táctil no es un tercer caso: la respuesta depende de si el cromo está visible en
ese momento y no de qué la tocó.

**Cuatro lugares de tres archivos.** El gesto es un `pointerdown` en el nodo,
agregado en `createNode` adentro de la rama de video, que es la que sólo corren
las cajas de video del aviso; los punteros se habilitan en `place()`, que sólo
recorre lo que está en pantalla; `setFocus` mueve el índice, mueve el anillo y
recalcula la mezcla en un solo lugar, y las dos salidas que la T-01 había escrito
pasaron a llamarlo. `lib/controls.js` devuelve `up` en su handle y
`lib/concurrent-hls.js` le pasa al renderer `chromeUp: () => controls?.up() ??
false`. Lo que cruza es un booleano: el renderer no lee ninguna clase del cromo y
el cromo no aprende qué es una caja de aviso.

**El anillo se va en el `ended` del nodo, y es la decisión de la task.** El
ADR 0030 dice que el anillo se va con el nodo, y en dos de las cuatro salidas eso
es literal porque el nodo se destruye. En la tercera no: un asset que se terminó
antes que su ventana **se queda en pantalla** con su último cuadro hasta que la
ventana cierre, así que un anillo que sobreviviera ahí estaría marcando la única
caja que con seguridad no suena. Por eso el `ended` pasa por `setFocus(null)`,
que es la misma puerta que las otras tres, y no por una línea propia.

**El invariante de la capa se tocó por primera vez desde que se escribió y quedó
con su nota**: la capa sigue con `pointerEvents: 'none'` y sigue sin `z-index`, y
lo que recibe el press es el nodo de adentro, así que no se come ningún click de
lo que está abajo.

**Verificación, nivel `bajo` y sin campaña de mutación.** `npm test` da **49 en
verde**, los mismos 49 de la T-01, porque esta task no agrega lógica no visual;
`npm run check` sigue en `both seams hold.`. Lo demás se miró con el player
corriendo y el switch de la composición encendido a mano —sin eso el `muted` de
los nodos del aviso no dice nada—: doce lecturas, todas en verde. El Quad con un
click de mouse deja `view2` a 100 sin mutear, todo el resto a 0 y el anillo sobre
esa caja sola; el `cornerOverlay` con un click calla el programa, que es el audio
doble que la fase existe para resolver; y en el break 5 el nodo precargado de
`ad2-box` está sobre su caja con `opacity: 0` y `pointer-events: none`, así que un
click ahí no cambia un solo nivel. El caso táctil se hizo con toques reales por
CDP: el primero sube el cromo y no toca el audio, el segundo enfoca.

**Y una nota de la corrida y no del código: para que la medición fuera del audio
audible hubo que apagar el sink del sistema**, porque la verificación honesta pide
levantar el switch de la composición y eran las cuatro de la mañana. Se restauró
al terminar.

## 2026-09-09 — T-03 de la fase 06: las dos oraciones del README, y la corrida mirada entera

El README de la demo decía que la mezcla del asset list la declara la campaña y
el reproductor la obedece, y con foco eso quedó a mitad de camino: la mezcla es
el **estado inicial** y quien mira se la lleva a una caja tocándola. Las dos
oraciones —una en el párrafo del switch de `Before you record` y una en el del
Quad— dicen la política completa del ADR 0026 entre las dos: el estado inicial,
el override mientras el aviso está en pantalla, el foco exclusivo con el primario
callado incluido, el gesto que cuenta sólo con el cromo arriba, la caja de video
del aviso como único blanco, y el override que muere con el aviso.

**El anillo se nombra en el párrafo del Quad y no en el del switch.** El del
switch es donde vive la política y el del Quad es el beat que se ve en cámara, así
que la marca que dice cuál caja se escucha va donde alguien la va a estar mirando.
Escribirla en los dos era la misma frase dos veces.

**El encabezado de la sección sigue diciendo "six to expect" y no envejeció**,
porque las dos oraciones entraron adentro de párrafos que ya existían y no
agregaron un ítem en negrita. Era la afirmación de la sección con más chance de
quedar vieja por un cambio de este tamaño, y el resto se leyó línea por línea.

**La corrida se miró de punta a punta en un solo playback de 171 s, sin seeks.**
Los cinco breaks entran en su segundo —20,2 / 45,4 / 70,2 / 95,3 / 120,2— y los
cuatro avisos del break 5 se relevan en el 132, el 144 y el 156. El foco anda en
el `cornerOverlay` del break 1, donde un click calla el programa, y en el Quad del
break 4, donde el cuadrante tocado va a 100, el resto y el primario a 0 y queda un
anillo y uno solo; tocado de nuevo vuelve el 100/10 declarado. Con mouse alcanzó
**un** click las dos veces. Doce cuadros y quince lecturas, todas en verde;
`npm test` sigue en 49 y `npm run check` en `both seams hold.`.

**Una línea de la sección la corrida no puede confirmar ni desmentir, y se dejó
como está**: los 0,7 s de atraso del pane de fábrica. La lectura del final da
alrededor de un segundo, y no es una medición de eso —dos líneas de estado con su
propio `timeupdate`, medio segundo de holgura— y el costo que produce el número es
el traspaso del MediaSource, que en un Chrome headless sobre una máquina
compartida no cuesta lo que en la máquina donde se graba. El número es de la fase
04 y nada de la 06 tocó la implementación que lo produjo.

**Y una nota de harness que ya se pagó dos veces**: todo lo que lee el cromo se
ancla en `#player`, porque la página tiene dos players con el mismo cromo y un
selector global mide el pane de fábrica y reporta que el gesto no funciona cuando
sí funciona. El audio audible, esta vez, se apagó con `--mute-audio` en el Chrome
de la corrida en lugar de tocar el sink del sistema.

## 2026-09-09 — Corrección post-ejecución en la T-02: el primario también suelta el foco

Nicolás pidió, sobre el gesto que la T-02 ya había cerrado: *"si toco el
contenido principal de nuevo, entonces vuelva el contenido principal. Además,
que si toco el contenido principal, también sea como deseleccionar."* El ADR
0027 ya había mirado esa puerta durante la T-02 y la había descartado por una
colisión: hacer enfocable el primario convertiría cada toque sobre la imagen
con el cromo arriba en un cambio de audio, y el gesto que baja el cromo (fase
04) pasaría a cambiar el sonido en su lugar.

La colisión seguía siendo válida, así que el pedido no se resolvió reabriendo
esa puerta sino agregando una angosta y condicional: con el cromo arriba y
algo enfocado, un `pointerdown` sobre el primario suelta ese foco y el toque
se consume ahí, sin llegar a alternar el cromo; con nada enfocado, la misma
condición contesta que no hay nada que soltar y el toque cae al comportamiento
de siempre. Las dos lecturas son mutuamente excluyentes por construcción, así
que la colisión que el ADR 0027 describió no reaparece: no hay un estado en el
que el mismo toque pueda significar las dos cosas.

**El diff son las mismas tres piezas que la T-02 ya tocaba, y nada del blanco
del gesto cambió.** `lib/renderer.js` gana `releaseFocus()`, que suelta el foco
si hay uno puesto; `lib/controls.js` recibe ese predicado en `createControls`
con el mismo default seguro que `chromeUp` (`() => false`); `lib/concurrent-hls.js`
lo cablea en `attach()` con la misma forma que `chromeUp`, evaluado en el
momento del toque. Es una corrección sobre una task ya `done` y no una task
nueva —queda anotada como `post-ejecución:` en el bloque de la T-02 de
`phases/06-foco-de-audio/TASKS.md`— y quedó registrada en el **ADR 0031**, que
supersede al **ADR 0027** en su afirmación de que el primario nunca tiene
efecto de audio; lo que el 0027 decidió sobre qué es enfocable y por qué el
primario queda afuera de esa lista sigue en pie tal como está escrito ahí.

**Verificación.** `npm test` sigue en 49 verdes y `npm run check` en `both
seams hold.`, sin cambios en ninguno de los dos. Con el player corriendo y
anclado en `#player` —la página tiene dos paneles con el mismo cromo, y un
selector global mide el de fábrica— se comprobaron los cuatro casos del
pedido sobre el Quad del break 4: con `view2` enfocado, un toque en el
primario devuelve la mezcla declarada (`view3` a 100, el resto y el primario a
10) y saca el anillo; hecho con un toque táctil, que es el caso que antes
hubiera bajado el cromo en el segundo toque, el cromo se queda arriba; sin
nada enfocado, un toque en el primario sigue alternando el cromo como
siempre (primero lo sube, un segundo toque lo baja); y re-tocar la caja
enfocada —el camino que ya existía— sigue soltando el foco sin que este
cambio le haya tocado una línea.

## 2026-09-09 — Fase 06 cerrada: el foco de audio, y una línea de `docs/` que nadie tenía como entregable

La fase 06 cierra con las tres tasks en `done`, una corrección post-ejecución y
el informe en `phases/06-foco-de-audio/REPORT.md`. El `PHASE.md` pasa a `closed`
con `closed: 2026-09-09` y la línea de la fase en el índice del `PROJECT.md` se
reescribió de la intención al resultado.

**Lo que queda construido.** Con los controles a la vista, un toque sobre una
caja de video del aviso le da todo el sonido a esa caja y deja el resto de la
composición en 0, el programa incluido; un anillo amarillo dice cuál es; y la
mezcla que declara el asset list vuelve por cinco caminos. Las dos propiedades
que lo dejan barato de extender son de forma: **todo pasa por una puerta**,
`setFocus`, que mueve el índice, el anillo y la mezcla en un solo lugar, y la
asimetría entre el mouse y el dedo sale de **un solo predicado**, ¿está el cromo
arriba?, sin una rama por dispositivo en ninguna parte.

**Los seis ADR de la fase son `scope: project`, y el informe lo dice.** Filtrar
por `scope: phase-06` devuelve cero, porque ninguna de las seis decide cómo se
ejecuta esta fase: deciden quién contesta qué se escucha en este producto. Se
identifican por la ventana de fechas, el 0026 al 0030 del 2026-09-08 y el 0031
del 2026-09-09.

**Los dos hallazgos del cierre.**

1. **El `PHASE.md` llegó diciendo `planning` con las tres tasks en `done`, y es
   la segunda fase seguida** —a la 05 le pasó lo mismo el día anterior, commit
   `20923ef`—. Nadie mueve el `status` al arrancar la ejecución, y el contrato
   afirma algo falso de sí mismo durante toda la fase. Las dos veces lo encontró
   alguien que estaba mirando otra cosa. Su lugar natural no es este proyecto
   sino el skill `create-project`, que es el dueño del ciclo de vida de una fase,
   y no se escribe solo: va con su texto exacto a Nicolás.
2. **La documentación del producto se revisó por el README de la demo y no por
   `docs/`.** La T-03 tenía como entregable las dos oraciones del README de la
   demo y leyó su sección línea por línea; los dos documentos de `docs/`, que son
   el documento de arquitectura de este producto, no los leyó nadie. La línea que
   quedó vieja es una y se corrigió en este pase: la fila de §5 de
   `docs/integrating-the-library.md` decía que el volumen de cada elemento
   durante un break es *"which the asset-list declares"*, que con foco es la
   mitad de la política. `docs/contrato-senalizacion-renderizado.md` se re-leyó y
   sigue describiendo el sistema, por su propia línea 214.

**La corrección post-ejecución, leída como medición.** Una sola en tres tasks, y
no dice que el `done` de la T-02 estuviera flojo: el comportamiento que Nicolás
pidió estaba en el fuera de alcance del `PHASE.md` con su razón escrita en el
ADR 0027, así que ninguna verificación de la task podía encontrarlo. Dice otra
cosa: **un gesto se juzga usándolo.** El diseño miró esa puerta y la descartó por
una colisión real, y la colisión resultó evitable con una condición que el diseño
no consideró.

**Verificación del cierre.** `npm test` en 49 verdes y `npm run check` en
`both seams hold.`. El validador sale en rojo con los dos hallazgos de siempre
—las fases 02 y 04 sin `DESIGN.md`—, ninguno de esta fase y la decisión sigue
siendo de Nicolás. El `status` del proyecto queda en `ongoing`: quedan la
grabación, iOS y la especificación de SVTA.

## 2026-09-09 — Fase 07 abierta: la pelotita de la barra se agarra y se arrastra

Nicolás probó la demo y pidió una sola cosa: poder agarrar la pelotita de la
barra de progreso y moverla, con mouse y con el dedo, y que el seek pase al
soltar. *"Es como un drag and drop en una dimensión."* La fase 07 se abre en
diseño con ese alcance y nada más. Es reactiva y su precedente es la fase 04:
si aparecen dos o tres detalles más de usabilidad, caen acá.

**Un dato que se midió antes de diseñar, y que cambia una línea del pedido: la
pelotita ya existe y se ve.** `.qa-track__knob` está en el código desde la fase
02 (`7c2a228`) y `paint()` la mueve todos los frames con el `currentTime`. Mirada
en el player corriendo en el 8080, con el cromo arriba y el programa en el
segundo 60, es un punto de 14 px en `rgb(55,180,167)` —el `--qa-accent` que la
demo le pasa— con anillo blanco, sobre la cabeza del fill y por encima de las
cinco marcas. Así que la fase **no agrega la pelotita: le agrega el gesto**, que
es lo que el pedido dice en su segunda oración.

Por qué él la vio ausente queda escrito como lectura y no como medición: un punto
que sólo informa no se lee como un agarre. De ahí sale la única decisión que el
diseño se lleva de ese párrafo, que la pelotita crezca mientras se arrastra, y
nada más: el tamaño en reposo y el color no se tocan porque ninguna decisión de
hoy necesita ese número.

**El modelo del gesto es uno solo y no dos.** `pointerdown` en cualquier parte de
la barra y la pelotita salta ahí y empieza el scrub; `pointermove` y la pelotita
sigue al puntero; `pointerup` y ahí es el seek. Un toque suelto es un arrastre de
longitud cero, así que no hay rama de "modo toque" contra "modo arrastre" y no
hay que acertar si el dedo cayó sobre la pelotita o al lado. Es la misma forma que
la asimetría mouse/dedo de la fase 06: un solo camino da los dos casos.

**Las cinco decisiones del diseño.** D1, mientras se arrastra la posición la manda
el puntero y no el video, con un estado de scrub que el frame loop respeta —sin
eso la pelotita salta atrás sola en cada frame—. D2, `setPointerCapture` sobre la
barra, para que el arrastre sobreviva a salirse de los 44 px. D3,
`touch-action: none` en la barra, que hoy está en `auto`: no habilita el gesto,
impide que el browser lo lea como scroll. D4, el cromo no se baja en medio de un
arrastre. D5, la pelotita crece mientras se arrastra.

**El único cambio sobre lo que ya funciona, y es lo que hay que cuidar**: hoy el
seek pasa en el `pointerdown` de la barra y con esto pasa en el `pointerup`. Es
lo que habilita el arrastre, porque un gesto que seekea al apretar no tiene nada
que arrastrar. Un toque suelto tiene que seguir seekeando exactamente donde
seekea hoy, y eso está escrito como riesgo R1 y como criterio de la task.

## 2026-09-09 — Fase 07 generada del diseño: dos tasks y cinco ADR

El diseño de la fase 07 quedó acordado y de ahí salieron el `PHASE.md`, el
`TASKS.md` con dos tasks y cinco ADR nuevos, el **0032 al 0036**.

**Los cinco ADR van con `scope: phase-07`, y es una decisión de esta generación.**
Las fases 05 y 06 marcaron todas las suyas `project` y sus informes lo dijeron
como dato; éstas van al scope que el skill fija por default y que la práctica
vieja del proyecto ya usaba —el ADR 0002, apagar la maquinaria de interstitials,
es `phase-01`, y el 0015, el límite del sdk, es `phase-02`—. El criterio es el que
distingue esos dos grupos: las de la 05 y la 06 dicen qué es este repositorio y
quién contesta qué se escucha, y éstas dicen cómo se comporta un control. Efecto
práctico, y por eso se anota: el filtro por scope del cierre (Mode D) vuelve a
devolver algo, que es la primera vez desde la fase 02.

**Las dos tasks.** La T-01 es el gesto entero y es entero un solo archivo,
`lib/controls.js`: el scrub, el seek movido al soltar, el pintado que sigue al
puntero, la captura, el cromo que se queda arriba y la pelotita que crece. La
T-02 lo mira con los dos punteros sobre el resultado final, más las dos
superficies de `docs/`, que es el hallazgo 2 del cierre de la fase 06 puesto a
trabajar: esa fase revisó el README de la demo y no los documentos del producto.

**Las dos en `bajo` y sin tests nuevos**, y está argumentado en el preámbulo del
`TASKS.md` para que quien ejecute no lo suba por prolijidad: la fase no agrega
lógica no visual, la cuenta de la fracción es la que ya existe en `seekFromEvent`,
y las dos fallas posibles —el toque suelto que seekea en otro lado, o el arrastre
que no arrastra— están a la vista en la primera pasada con el player.

**La documentación del producto no cambia por la generación.** La superficie
pública no se mueve —ni `attach` ni `attachControls` reciben nada nuevo— y el
contrato entre señalización y renderizado no habla del cromo. Lo que sí queda
escrito en el `PHASE.md` es que la revisión del cierre lee los dos documentos de
`docs/` y no sólo el README de la demo.

**El validador sale en verde, y por primera vez.** Los dos hallazgos de siempre
—las fases 02 y 04 sin `DESIGN.md`— dejaron de ser rojos mientras esta fase se
diseñaba: el commit `6d4eb79` los bajó de la lista `EXCEPTIONS` del skill a
`.project/EXCEPTIONS.md`, con su razón escrita, una por hallazgo. No es trabajo de
esta fase y se anota igual, porque cierra el hilo que los informes de la 05 y de
la 06 dejaron abierto como decisión de Nicolás: quedaron aceptados y no
silenciados, y el validador los imprime con su razón en cada corrida. La fase 07
sale limpia y los 36 ADR pasan el chequeo de frontmatter.

## 2026-09-09 — T-01 de la fase 07: la barra se arrastra, y el seek pasó al soltar

Un press en cualquier parte de la barra pone la pelotita ahí y empieza el
arrastre, la pelotita sigue al puntero, y al soltar el video seekea a donde
quedó. Un press y release sin mover seekea a ese punto, que es lo que la barra ya
hacía y **con el mismo número**: 45,0 s medidos contra 45,0 esperados sobre el
25 % de un programa de 180 s, delta 0. Ése era el riesgo R1 de la fase y es lo
único que este cambio podía romper.

**Un solo archivo, `lib/controls.js`, y el corte está en una función que se
partió en dos.** La cuenta de la fracción quedó igual y se llama
`fractionFromEvent`; escribir `video.currentTime` se mudó a `endScrub`, que es el
release. El estado es uno, `let scrubbing = null`, la fracción que el puntero
pide, y `paint()` lo lee en lugar del `currentTime` mientras dura el gesto, con
lo que el fill, la pelotita y el reloj de la izquierda cuentan lo mismo. Las
marcas no participan: son el largo y no la posición.

**Cuatro decisiones de la task que su bloque no decidía.** La captura no se
suelta a mano porque el browser la devuelve sola en el `pointerup` y en el
`pointercancel`, y lo que sí se agregó es `lostpointercapture`, que es la red del
caso en que la captura se vaya por abajo: **un scrub que queda abierto deja el
cromo arriba para siempre**, porque `hide()` no corre mientras existe. Se agregó
`user-select: none` en la barra, que no estaba en el diseño ni en ningún ADR: es
un defecto que el arrastre introduce y que antes no podía existir, porque un
press con mouse que viaja selecciona el texto que cruza y los dos relojes están
pegados a esa caja; va sobre el elemento del que el arrastre sale y sobre ninguno
más. El `pointerup` no actúa si no había arrastre. Y la pelotita crece a 2,5
veces el riel, que son 20 px medidos contra 14 en reposo.

**Verificación, nivel `bajo` y sin campaña de mutación.** `npm test` da **49 en
verde**, los mismos de antes y sin un valor esperado tocado; `npm run check`
sigue en `both seams hold.`. Lo demás se miró con el player corriendo, anclado en
`#player`: `touch-action` pasó de `auto` a `none`; durante el arrastre la
pelotita va a 40 %, 55 % y 70 % y el `currentTime` **se queda quieto en 45,0** en
las tres lecturas; al soltar en el 70 % da 126,0 contra 126,0 esperados; un
arrastre 260 px arriba de la barra sigue vivo y soltado al 85 % y 300 px arriba
da 153,0 contra 153,0; con el puntero apretado y quieto 4,2 s el cromo sigue
arriba; y la selección de texto después del arrastre vuelve vacía.

## 2026-09-09 — T-02 de la fase 07: los dos punteros, y el chequeo del scroll que no podía fallar

Los seis casos corridos con mouse y con el dedo sobre el resultado de la T-01,
todos en verde, y anclados en `#player`. Con mouse: la pelotita al 50 % con el
programa en 90 s de 180; un click suelto al 10 % da 18,0 contra 18,0 esperados;
un arrastre del 10 % al 60 % deja el `currentTime` quieto en 18,0 y al soltar da
108,0; apretado y llevado 400 px arriba de la barra sigue vivo y soltado al 20 %
da 36,0; y con el puntero apretado y casi quieto 4,3 s el cromo sigue arriba.

**El caso del scroll necesitó un control, y sin él era un chequeo que no podía
fallar.** A 420 × 900 la página **no scrollea** —`scrollHeight` 760 contra 760 de
ventana—, así que "arrastrar no scrolleó" ahí no prueba nada. A 420 × 420 sí
scrollea, 687 contra 420, y con eso la pregunta tiene respuesta: el mismo
arrastre vertical **fuera** del player lleva el `scrollY` de 120 a 265, y
**empezando en la barra** el `scrollY` se queda en 267 a lo largo de 160 px de
movimiento hacia arriba, con la pelotita yendo a 45 % y 60 %, creciendo a 20 px, y
el seek al soltar en 108,0 contra 108,0. Es la segunda vez en el proyecto que un
chequeo escrito de buena fe no podía fallar; la primera fue el grep del hallazgo 1
de la fase 05.

**Lo que ya andaba, sigue.** Las cinco marcas en el riel en los dos punteros; la
regla de la fase 04 intacta —con el cromo abajo el primer toque lo sube y no
cambia el `currentTime`, medido 30 s antes y 30 s después—; y la composición sin
moverse, con dos cuadros sacados con el Chrome del sistema, que es el que tiene
los códecs: el break 1 en el 25,3 y el Quad del break 4 en el 100,1 con sus cuatro
videos, las cinco marcas y la pelotita al 55,6 %.

**La documentación, y una superficie de tres necesitaba algo.**
`docs/integrating-the-library.md` enumera en su §3 lo que el cromo le da a quien
integra, y la barra pasó a hacer algo que esa lista no decía: se corrigió con una
oración que dice el gesto entero. Es la misma forma de hallazgo que el cierre de
la fase 06 encontró en ese mismo archivo —la lista no era falsa, describía de
menos—, y esta vez la encontró la task y no el cierre, que era exactamente para lo
que estaba escrita. El contrato de señalización no dice nada del seek ni del
gesto: sus seis menciones a la barra son sobre qué se pinta. El README de la demo
no quedó viejo y el gesto no entra al guion, que es decisión del `PHASE.md`.

`npm test` en 49 verdes y `npm run check` en `both seams hold.`

**Dos notas del harness.** Las coordenadas de la barra se leen justo antes de
despachar el toque, porque un `currentTime` escrito a mano reacomoda la página y
un rect viejo manda el toque a donde la barra ya no está —se ve como "el gesto no
anda" y es el harness, y costó tres corridas—. Y antes de arrastrar hay que
verificar que el cromo esté arriba en lugar de suponerlo: el arrastre de control
pasa por la imagen y de paso lo baja.

## 2026-09-09 — Fase 07 cerrada: la barra se arrastra, y un chequeo que no podía fallar

La fase 07 cierra con las dos tasks en `done`, **ninguna corrección
post-ejecución** y el informe en `phases/07-la-pelotita-de-la-barra/REPORT.md`. El
`PHASE.md` pasa a `closed` con `closed: 2026-09-09` y la línea de la fase entra al
índice del `PROJECT.md`. Abierta, diseñada, generada, ejecutada y cerrada el mismo
día.

**Lo que queda construido.** Un press en cualquier parte de la barra pone la
pelotita ahí y empieza el arrastre, la pelotita sigue al puntero, y al soltar el
video seekea a donde quedó, con mouse y con el dedo. Lo que lo hizo chico es que
es **un gesto y no dos**: un toque suelto es un arrastre de longitud cero, así que
no hay rama por tipo de gesto y nada tiene que averiguar si el puntero cayó sobre
un punto de 14 px. Y la pelotita no se agregó porque **ya existía y se veía** desde
la fase 02: lo que faltaba era el gesto, que es lo que el propio pedido decía en su
segunda oración.

**El riesgo R1 medido y no impresionado.** Lo único que este cambio podía romper
es el toque suelto, porque el seek pasó del press al release: 45,0 s contra 45,0
esperados al 25 % de la barra, y otras tres lecturas con delta 0. La mitigación
funcionó porque el criterio estaba escrito como número.

**El hallazgo es de método.** El chequeo del scroll con el dedo, tal como el
`PHASE.md` lo pedía, **no podía fallar**: la página de la demo no scrollea
—`scrollHeight` 760 contra 760 de ventana— así que arrastrar sin scrollear da verde
aunque `touch-action` no exista. Con un viewport donde la página sí scrollea, 687
contra 420, y con un control —el mismo arrastre vertical fuera del player, que
lleva el `scrollY` de 120 a 265— la verificación dice algo: empezando en la barra
el `scrollY` se queda en 267 a lo largo de 160 px. Es la segunda vez en el proyecto
que un chequeo escrito de buena fe no podía fallar, y agrega la otra mitad de la
recomendación 2 de la fase 05: **un chequeo negativo pide su control.**

**Dos cosas del proceso que salieron distinto que las dos fases anteriores.** El
`status` del `PHASE.md` lo movió la ejecución —a `in-progress` en el primer commit
de la T-01 y a `closing` al terminar la T-02—, que es el agujero que los cierres de
la 05 y de la 06 tuvieron que arreglar. Y la corrección de
`docs/integrating-the-library.md` la encontró **la task y no el cierre**, porque el
bloque de la T-02 la pedía por nombre: es el hallazgo 2 del cierre de la fase 06
puesto a trabajar, y funcionó.

**Un hilo viejo que se cerró y no es de esta fase.** Las fases 02 y 04 sin
`DESIGN.md` dejaron de estar en rojo: el commit `6d4eb79` las bajó de la lista
`EXCEPTIONS` del skill a `.project/EXCEPTIONS.md` con su razón escrita. El
validador sale en **GREEN** con las dos aceptadas y las imprime con su razón en
cada corrida.

**Verificación del cierre.** `npm test` en 49 verdes, `npm run check` en
`both seams hold.`, y `validar-proyecto.py` en verde con 36 ADR y 7 fases. El
`status` del proyecto queda en `ongoing`: quedan la grabación, iOS y la
especificación de SVTA.

## 2026-09-09 — Fase 08 abierta: la demo del break de hidratación

Una demo nueva en `demo/`, para el HLS Interest Group, y el objetivo lo fijó
Nicolás: *"es una demo nueva en `demo/`. La demo que ya tenemos debe quedar y es
una demo técnica que su objetivo es validar el desarrollo. Esta es una demo que su
objetivo es mostrar el potencial de uno o varios casos de uso reales de esta forma
de poner ads y como este desarrollo lo resuelve."* La fase 08 se abre en diseño con
ese alcance.

**Es la primera fase del proyecto cuyo entregable es lo que se ve en escenario y no
lo que lo hace posible**, y eso mueve la vara: no es que el layout caiga en el píxel
correcto, es que un ingeniero de un broadcaster entienda el caso de negocio en
treinta segundos de mirar la pantalla. El caso de uso lo decidió Nicolás y es uno
solo, el break de hidratación: el partido para un minuto, la transmisión no corta a
tanda y le pone publicidad no lineal encima de la imagen en vivo, con cuatro avisos
adentro —uno lineal de diez segundos y tres no lineales— y marcas de fantasía.

**Lo que se midió antes de diseñar acota la fase entera: nada de lo que ya funciona
se toca.** La demo actual no cambia, la sdk no cambia, y el mecanismo está
construido. `./run.sh <demo>` ya sirve la carpeta de cualquier demo como raíz de
documentos (ADR 0022), así que una demo nueva es una carpeta y no un cambio en la
raíz. Y frenar el primario congela la composición entera, porque el renderer aplica
el estado de reproducción en cada `pause` leyendo `video.paused`: eso está **leído en
el código y no medido en el navegador**, y es el riesgo R6 y lo primero que la fase
mide.

**La decisión que había que resolver era de dónde salen los tiempos del guion.** No
eran dos lugares sino cuatro —el plate, el `RECORRIDO`, el asset list y el guion—, y
la cadena queda en una sola dirección con cada número en un solo lugar: el guion se
ancla a la señalización y los segundos se resuelven en vivo contra
`provider.programRanges()` y `provider.experiences`, que es lo que el contrato ya
expone. Un beat dice "antes del break 1" o "antes del aviso 2 del break 1", nunca un
segundo absoluto. Se descartó que el script de señalización emita un
`recorrido.json`: es una copia de números que el `provider` ya tiene resueltos, y
encima resueltos contra lo que el player bajó y no contra lo que el script creyó.

**Las nueve decisiones.** D1, el guion se ancla a la señalización. D2, es un archivo
declarado y es JSON. D3, se arma con `settled` y el primer beat es una placa con el
player en pausa, lo que hace desaparecer la carrera con la red en lugar de mitigarla.
D4, el freno es `video.pause()` y la página no toca la librería. D5, la placa es una
capa de la página, y el contenedor del player necesita `isolation: isolate` porque el
cromo se dibuja con `z-index: 2147483000`. D6, una sola salida y es el botón, porque
esto se graba. D7, el aviso lineal va primero y ahí se cuenta el caso de negocio, lo
que mete la comparación adentro de un solo minuto y **hace que esta demo no necesite
el par de compatibilidad**. D8, el corrimiento de la parada se declara una vez y el
suite lo chequea. D9, lo pictórico se genera, la geometría se escribe como SVG, y
cada creativo generado pasa un chequeo humano de vestido comercial, porque está
medido que el generador deriva hacia el vestido comercial real aunque se le prohíba.

Que el lineal sea un `ASSET` sin bloque de layout no es interpretación: es el
requerimiento 4 del documento que David armó para el evento, y en este repositorio
ya se reproduce por el camino único del ADR 0019.

**Un dato que se midió durante el diseño porque el input se dio vuelta dos veces:
Veo no está disponible en `cto-assistant-501315`.** Los cinco modelos de Veo e
`imagen-3.0-generate-002` devuelven 404 *"does not have access"* con
`{"instances":[{}],"parameters":{}}`. La confusión venía de un chequeo con el cuerpo
vacío, que devuelve `400 Empty instances.` exista el modelo o no porque la validación
corre antes del lookup: **es la segunda vez en el proyecto que un chequeo no podía
fallar**, después del scroll de la fase 07. Queda escrito como "no disponible hoy,
con la vía para tenerlo" —se habilita en la consola y es un hilo de Nicolás— y sin
calidad medida. El spot lineal se compone con ffmpeg, y el metraje del programa no se
genera por una razón que no es el acceso: un minuto pide seis o más generaciones que
coincidan en estadio, camiseta, luz y cámara.

**El fuera de alcance es la mitad del diseño**, porque una demo "linda" no tiene
criterio de terminado. Y el contenido está decidido: partido amateur limpio de
derechos más los gráficos de transmisión hechos por nosotros, con el paquete de canal
ficticio como pieza de mayor palanca. El trabajo de assets es de 1,5 a 2 días de una
persona (riesgo R3), y su mitigación es que la página se construya contra el
contenido de la demo actual como suplente, para que los dos frentes no se bloqueen.

## 2026-09-09 — Corrección al diseño de la fase 08: Veo sí está disponible, y el reparto de la tipografía cambia

La entrada anterior dice que Veo no está disponible en `cto-assistant-501315`, y está
mal. **Queda en pie porque el LOG es registro y no documento vigente**, y porque cómo
se llegó al error es parte del hallazgo: el diseño ya está corregido y es el que vale.

**Lo que faltaba era ir a la documentación a buscar los ids vigentes.** Los `-preview`
que probamos —el relevamiento de contenido y las dos mediciones de hoy— **no existen
más**, y los vivos terminan en `-001`. Verificado: `veo-3.1-fast-generate-001` y
`veo-3.1-generate-001` devuelven `400 No inputs provided`, o sea que el lookup del
modelo pasó; `veo-3.1-fast-generate-preview` sigue en 404.

**Y la trampa es del mensaje**: el 404 dice *"was not found **or** your project does not
have access to it"* y **no distingue las dos cosas**, así que probar candidatos hasta que
uno responda mide la lista de candidatos y no la disponibilidad. Es del mismo orden que
el chequeo del cuerpo vacío y que el chequeo del scroll de la fase 07: **tres veces
seguidas el instrumento decidió el resultado.**

**Lo medido corriéndolo**, con `veo-3.1-fast-generate-001` en `us-central1` sobre la
imagen fija de una marca de fantasía: 8,0 s de 1920×1080 a 24 fps, h264, 25.353.878
bytes, sin pista de audio, en 118 s. Honra el primer cuadro con el titular intacto; sale
a 1920×1080 exactos, que el generador de imagen no hace; mejora el texto chico sin
garantizarlo —`S9KIMLING BOTANICAL SODL` en la entrada, `SPARKLING BOTANICAL SOOL` en el
video—; y **el titular se va de cuadro cuando la cámara empuja**, que no es un defecto
sino lo que hace un movimiento de cámara. El archivo y tres cuadros están en
`sandbox/veo-neonectar-8s-2026-09-09.mp4`.

**Ese último punto es el que cambia el diseño, y lo cambia hacia un reparto y no hacia
un "sí, se puede".** El D9 pasa a ser: lo pictórico se genera, la tipografía se compone,
y **el movimiento se genera sólo donde la tipografía puede irse de cuadro**. O sea que el
spot lineal de diez segundos se genera con Veo y la tipografía vuelve al final compuesta
con SVG —exacta, en lugar de re-renderizada por el modelo—, y los formatos no lineales
siguen siendo imagen fija con tipografía compuesta, porque ahí el texto tiene que
quedarse quieto y legible durante todo el break. El costo de la variante fast, entre
US$0,10 y US$0,15 el segundo, queda escrito como **leído y no verificado en la factura**.

**Lo que no se movió: el metraje del programa se sigue construyendo.** El argumento nunca
fue la disponibilidad, así que tenerla no lo toca, y el diseño ahora lo dice más fuerte
que antes: el generador está disponible y aun así el plate se construye, porque un minuto
pide seis o más generaciones que coincidan en estadio, camiseta, luz y cámara, y porque
la sala mira video por trabajo. Un spot de producto de ocho segundos con un solo
movimiento de cámara es donde el modelo hoy es bueno; un minuto de partido no lo es.

## 2026-09-09 — Tres cambios de Nicolás al diseño de la fase 08: el lineal tercero, el banner como imagen fija, y la fecha cerrada

**1. El aviso lineal se movió de primero a tercero**, que es lo que Nicolás pidió
—*"el lineal lo quiero en 2do o tercer lugar"*—. El argumento de fondo de D7 no se
movió: la comparación entre lineal y no lineal sigue entrando adentro de un solo
minuto y en un solo player, y con eso esta demo sigue sin necesitar el par de
compatibilidad. Lo que se reescribió es el por qué de la posición. **Elegí tercero y
no segundo por tres razones que apuntan al mismo lado**: la línea de base tiene que
estar construida antes de romperla, y con un solo aviso no lineal delante la
comparación es contra una impresión y no contra una costumbre; la adyacencia con la L
es la más filosa del minuto, porque la L es lo más intrusivo que todavía deja ver el
partido y el lineal es lo primero que no lo deja, así que el corte queda entre "casi
no puedo verlo" y "no puedo verlo"; y el minuto termina en la solución, porque después
del lineal queda el overlay y el último cuadro del break es el partido a la vista con
publicidad encima. **El orden del minuto es ahora una curva de intrusión**: banner, L,
lineal, overlay.

**2. El banner inferior pasa a ser imagen fija, y entró como decisión propia, D10.** No
es un detalle de assets: el minuto pasa a mostrar **tres formas de aviso** —lineal a
cuadro entero, imagen fija no lineal, video no lineal— y eso es una capacidad que la
demo demuestra. **No cuesta trabajo nuevo, y esto es lo que puede sorprender: está
construido, verificado y ya corre en la demo actual.** El elemento del layout declara
su MIME, `isImage` lo mira y `build` crea un `<img>` en lugar de un `<video>`
(`lib/renderer.js:80` y `:294`); los tres lugares donde una imagen no es un video ya
están resueltos desde la fase 01 —no entra en `playable()`, `applyAudio` la saltea, y
el aviso de asset cortado no aplica—; el asset list ya tiene la forma en
`asset-list-squeezebackLShape-image.json`, que es el break 3 del recorrido de la demo
actual; y la ventana la declara la señalización y no el asset, que es la regla que la
fase 03 midió. **Lo único que obliga es una restricción de autoría**: el ADR 0013 llena
cada caja con recorte centrado, así que una imagen que no tiene la relación de aspecto
de su caja se recorta por los bordes, que es donde vive la tipografía de un banner. El
banner se escribe como SVG a la relación de aspecto exacta de su caja. Y encaja con D9
en lugar de tensionarlo: los no lineales ya iban a ser imagen fija con tipografía
compuesta, y esta decisión convierte eso en algo que la demo dice.

**3. La fecha se cerró y no queda como riesgo.** *"no importa la fecha! guardá por algún
lado de que esto no importa... no me lo preguntes más."* El R7 dejó de ser un riesgo
abierto: **las fechas del proyecto gobiernan la librería y no gobiernan esta demo**, y
está escrito en el lugar donde estaba el riesgo, porque el lugar donde no está es el
que hace que alguien lo vuelva a levantar. La sección de calendario pasó a llamarse
"Quién mira" y dice lo mismo. Y el R3 se reescribió sin apoyarse en fechas: el riesgo
de los 1,5 a 2 días de assets no es de plazo sino de secuencia, que la página no se
pueda empezar si primero hay que juntar el plate, y su mitigación es la misma —la
página se construye contra el contenido de la demo actual como suplente—.

Con D10 las decisiones del diseño pasan a ser **diez**, así que los ADR de la etapa 2
van del **0037 al 0046**. El chequeo 3 del suite ahora asierta las tres formas: cuatro
avisos, exactamente uno sin bloque de layout y tercero, y exactamente uno cuyos
elementos son `image/*`.

## 2026-09-09 — Fase 08 generada del diseño aprobado: ocho tasks y diez ADR

Nicolás aprobó el diseño y la cadena entera: *"bien, cualquier cosa corregimos post
ejecución. Dale!"* — autorización para generar y ejecutar, sin puertas de aprobación en
el medio, con las dudas chicas resueltas por el criterio del diseño y reportadas en
lugar de preguntadas.

**Diez ADR, del 0037 al 0046**, todos `accepted`. Nueve con `scope: phase-08` y uno
`project`: el **0045**, lo pictórico se genera, la tipografía se compone y el movimiento
se genera sólo donde la tipografía puede irse de cuadro, porque gobierna cualquier
trabajo de assets del proyecto y no sólo el de esta demo.

**Ocho tasks, ordenadas por riesgo y no por dependencia**, que es el criterio del
ADR 0008. La T-01 mide el freno de la composición en el navegador, que es la propiedad de
la que cuelga el guion entero y **lo único que puede cambiar el tamaño de la fase**
(R6). La T-02 deja la demo corriendo con el material de la demo actual como suplente, que
es la mitigación de R3 y lo que desacopla la página del trabajo de assets. La T-03 ataca
el plate y el paquete de canal ficticio, que es lo que puede no aparecer (R1) y la pieza
de mayor palanca. Después: el guion, los creativos, la página, el suite y la
documentación.

**Un riesgo nuevo que no estaba en el diseño, el R7**: un chequeo escrito de buena fe
puede no poder fallar, y ya pasó tres veces en este proyecto —el scroll de la fase 07
sobre una página que no scrollea, el cuerpo vacío que devuelve 400 exista el modelo o no,
y el 404 que no distingue "no existe" de "no tenés acceso"—. Su mitigación es un paso de
la T-07: el chequeo de anclas se corre con un ancla deliberadamente equivocada y tiene
que fallar, y el resultado de ese control va en la evidencia.

**Los niveles de verificación**: la T-07 es la única `alto`, porque es código que corre
desatendido y cuya falla es un verde que no significa nada, y su campaña de mutación es
una rotura por regla asertada. La T-01 y la T-08 son `mínimo`, porque toda su salida es
algo que una persona lee antes de que algo dependa de ello. Las otras cinco son `bajo`:
son pantalla, y el error está en la pantalla.

**El límite de gasto quedó escrito en el `PHASE.md`** y no en un mensaje: `agy` libre,
Veo hasta dos generaciones de hasta 10 s con `veo-3.1-fast-generate-001`, cualquier otro
servicio pago no. La T-05 para y pregunta antes de encadenar una tercera.

`validar-proyecto.py` en **GREEN** con 46 ADR y 8 fases, con las dos excepciones
históricas de siempre impresas con su razón. El `status` de la fase queda en
`in-progress`.

## 2026-09-09 — T-01 de la fase 08: el freno de la composición, medido, y el riesgo R6 cerrado a favor

**`video.pause()` sobre el contenido primario congela también las cajas de video del
aviso, y `video.play()` las reanuda.** Así que el freno del guion es un `pause` y la
librería no se toca (ADR 0040): la fase no crece, que es lo que este riesgo decidía.

Medido en Chrome real por el skill `playwright`, en una pestaña propia, contra la demo
actual servida en el 8080 —que quedó arriba y **no se tocó: la task no modificó un solo
archivo del repositorio**—, con las consultas ancladas en `#player` porque la página
tiene dos players con el mismo cromo.

**El Quad es el caso que valía medir**, porque dibuja tres cajas de video a la vez. El
primario pasa de 100,959 a pausado en 100,959, y las tres cajas de 5,958 corriendo a
5,959 pausadas, **y a 5,959 otra vez 1600 ms después**. Con el `play`, 7,169 · 7,168 ·
7,167 y las tres corriendo. Lo mismo con una caja en el aviso a cuadro entero del break
mezclado y en su `cornerOverlay`. La corrida se repitió entera y dio los mismos números.

**Las dos lecturas separadas por 1600 ms son el instrumento y no un detalle**: distinguen
"quieto" de "todavía no arrancó", que en una captura se ven igual.

**Y el chequeo trae su control adentro de la misma corrida**, que es lo que el riesgo R7
de esta fase pide. Este chequeo podría no poder fallar: si los nodos nunca hubieran
arrancado, `paused` habría dado `true` durante la pausa igual. Lo que lo salva son las
lecturas de los extremos: antes del `pause` los nodos están en `paused: false` y su
`currentTime` avanza 1,21 s entre esa lectura y la de después del `play`, sobre ~1200 ms
de reloj de pared. Los nodos pueden correr y estaban corriendo, así que el cero de avance
durante la pausa dice algo.

**Tres cosas que quedan escritas para la T-04**: el `play` reanuda cada caja en el mismo
cuadro donde había quedado, así que no hay que guardar ni restaurar posiciones; el
`currentTime` del primario tampoco se mueve, así que un beat puede leer la posición
durante la pausa sin carrera; y el `readyState` se queda en 4 en todos los nodos, así que
reanudar no paga un rebuffer.

`npm test` en 49 verdes y `npm run check` en `both seams hold.`, sin cambios en el
repositorio que pudieran haberlos movido.

## 2026-09-09 — T-02 de la fase 08: la demo nueva corre, y el minuto entero se ve

`demo/hydration-break/` existe y `PORT=8081 ./run.sh hydration-break` la levanta. El
minuto del break de hidratación corre con sus cuatro avisos en la curva de intrusión del
ADR 0043, todavía con el material de la demo actual como suplente (mitigación de R3).

**La sdk no se tocó y `demo/compatibility-pair/` tampoco.** El único archivo de la raíz
que participa es `run.sh` tal como está, y el puerto sale de la variable `PORT` que
`server.mjs` ya leía: **el ADR 0022 alcanzó para una demo nueva sin una línea de cambio
en la raíz**, que era la apuesta del alcance.

**El recorrido, impreso por el propio script**: break de 15 a 73 s, y adentro
`lowerThirdOverlay` de 15 a 31 con `image/jpeg`, `squeezebackLShape` de 31 a 47,
`linear` de 47 a 57 a cuadro entero, y `cornerOverlay` de 57 a 73. El plate son 90 s.

**Lo que el player resolvió, leído del contrato**: un solo rango `HYDRATION-BREAK`,
`kind: concurrent`, en el 15 y por 58 s, y las cuatro experiencias con los `itemId`
`HYDRATION-BREAK.0` a `.3`. El lineal llega como experiencia de tipo `linear` con el
primario y el aviso los dos en caja `{0,0,0,0}` y el aviso un `zDepth` más arriba: **el
camino único del ADR 0019 sin una línea de código nueva.**

**La línea de estado de la página dice de qué forma es cada aviso leyendo sólo el
contrato**, y en el primero dice `still image`. En el lineal dice
`the match is underneath, covered`, y eso también sale del contrato y no del tipo del
aviso: un aviso que tapa es una caja y un `zDepth`.

**Un defecto encontrado y arreglado en el camino, y es de la estética.** El picture no
entraba en el viewport: con el ancho como único tope, un cuadro de 16:9 en una ventana de
1920×887 mide 1600×900 y **la franja del banner —que es justamente el aviso— caía abajo
del pliegue.** Se ve en la primera captura que saqué. El ancho ahora está topeado también
por el alto disponible y la relación de aspecto lo convierte de vuelta en ancho; medido
después, el player mide 1115×627 y termina en el píxel 730 de 887. Una idea por pantalla,
y una página que hay que scrollear para ver el pie del video tiene dos.

**Dos cosas dichas y no resueltas.** No hay asset de la marca de SVTA en el repositorio
—lo único vendorizado es el kit de Qualabs— así que la página pone `with the SVTA` como
texto: **no se fabrica el logo de un tercero.** Y el material es provisorio, dicho en el
encabezado del script que lo empaqueta, en la línea de crédito de la página y en la
salida del script.

`npm test` en 49 verdes y `npm run check` en `both seams hold.`

## 2026-09-09 — T-03 de la fase 08: el plate propio, el paquete de canal, y cinco de seis clips que no pasaron el chequeo de cuadro

El plate propio existe: 88 s en tres actos —14 de juego, 60 de parada, 14 de juego— con
metraje amateur limpio de derechos y el paquete de canal ficticio quemado encima. El
material de la Blender Foundation dejó de ser el plate y quedó sólo como creativo
provisorio de los avisos, que es de la T-05.

**El paquete de canal salió como el ADR 0045 lo reparte, y el reparto se notó.** El
scorebug, el bug del canal y la placa de parada son SVG rasterizado con Chrome headless
—alfa real, 1280×720 exactos— y **el reloj lo dibuja ffmpeg y no el SVG**, porque un
reloj que no corre es la diferencia entre un gráfico y una transmisión. El SVG deja el
hueco y la herramienta lo llena: 32:16 a los 6 s, 32:30 a los 20, 33:30 a los 80. La
placa **COOLING BREAK · PLAY STOPPED** aparece sólo entre los segundos 14 y 74, y esos
números salen de `plate.json`: el gráfico que dice "play stopped" y el break que dibuja
publicidad encima leen un solo número (ADR 0044).

**El chequeo de cuadro no fue una formalidad: de seis candidatos, cinco fallaron, y
ninguno lo decía en su título.** Todos se presentan como "free to use". Uno traía una
camiseta réplica de selección con **escudo de federación y las tres tiras de una marca
real**; otro mostraba **menores**; otros dos, marca comercial legible en primer plano. El
del escudo se recuperó con un recorte verificado en cuatro momentos del clip, y el
recorte quedó escrito en el script con la frase de que **no es encuadre, es el chequeo**.

El criterio con el que se aceptó lo que se aceptó es el de la investigación de contenido:
lo que descalifica es un escudo de club profesional, una marca de liga o una valla, porque
eso convierte al clip en la grabación de un partido con derechos encima; la ropa deportiva
con marca sobre un equipo amateur es aparición incidental, que es el caso débil, y **queda
anotado para el chequeo final de cuadro antes de grabar**.

**La debilidad que queda es de relato y no de derechos, y se reporta en lugar de
esconderse**: los actos de juego y los de parada son equipos y canchas distintos. Se buscó
la versión coherente —el mismo equipo tiene clips de juego— y son planos cortos sin
profundidad, no planos anchos de transmisión. Las dos opciones existen y ninguna tiene las
dos cosas; se eligió el plano ancho porque **es lo que hace que el paquete de canal
funcione**, y se puede dar vuelta con una línea del script.

**Dos defectos propios, del mismo tipo y los dos encontrados mirando.** La placa de parada
salió con las dos etiquetas pisándose y la segunda fuera de su caja: 13 caracteres de
13 px bold con 1,4 de tracking miden 123 px, así que la segunda no podía arrancar en 176.
Vale anotarlo porque **la lección no son esos números**: la investigación dice que el
generador deforma el texto chico, y esto era SVG escrito a mano y salió mal igual —
tipografía sobre una forma se mira, la haya escrito quien la haya escrito. Y el factor de
estiramiento de la parada estaba invertido, `PTS/factor` acelera en lugar de estirar, así
que el plate salió de 62,3 s en vez de 88. **Lo delató el número y no la pantalla**: un
plate corto no se ve mal, se ve como otro plate.

`npm test` en 49 verdes y `npm run check` en `both seams hold.`

## 2026-09-09 — T-04 de la fase 08: el guion corre, y ningún beat nombra un segundo del programa

La demo guiada arranca sola: el player en pausa con la primera placa, y en cada beat la
experiencia se frena, una línea de tipografía dice lo que está por pasar, se va, y el
player sigue para que se vea pasar. Cuando el último beat termina, el player queda libre.

**El ADR 0037 quedó cumplido y verificable: ni el guion ni el código contienen un segundo
del programa.** Los cinco beats se anclan a la señalización —`{"at":"start"}`,
`{"before":{"break":1},"lead":2.5}`, `{"at":{"break":1,"ad":3},"lead":1.5}`— y
`resolveAnchor` es el único lugar de la demo que convierte señalización en segundos,
leyendo `programRanges()` y `experiences`. La página no construye identificadores:
`HYDRATION-BREAK` es una convención del script de señalización y el guion no sabe que
existe. Un ancla que no resuelve devuelve `null`, se dice por consola y el beat se saltea
en lugar de inventarse en otro segundo.

**Medido, los cinco beats frenan antes de lo que anuncian**: 0, 11,75, 28,71, 45,36 y
54,66 contra anclas en 0, 11,5, 28,5, 44,5 y 54,5. Y **un número que conviene tener a la
vista: el loop llega hasta ~1 s tarde cuando la pestaña no tiene el foco**, porque
`requestAnimationFrame` se estrangula a ~1 Hz en segundo plano. El margen real es el
`lead` menos ese segundo, así que bajar el `lead` de 1,5 s deja de ser seguro. Está
escrito para que nadie lo baje creyendo que gana precisión.

**Las tres invariantes quedaron medidas.** Un `pointerdown` y un click despachados directo
al botón de play del cromo y a la barra no cortan la guiada y no arrancan el programa; un
click real ni llega al cromo, porque `elementFromPoint` devuelve la placa en el centro del
player y sobre la barra; y el botón sí la corta en cualquier momento, dejando el player
libre y desapareciendo él mismo.

**Tres defectos encontrados y arreglados, y los tres se vieron y no se razonaron.**

1. **La placa no tapaba el cromo, y el ADR 0041 ya decía por qué.** La escribí como hija de
   `#player` y el ADR dice afuera del contenedor que el renderer gobierna:
   `isolation: isolate` impide que el `z-index: 2147483000` escape, pero una placa adentro
   compite en el mismo contexto y pierde. En la primera captura la barra de progreso, el
   mute y el play estaban dibujados encima de la placa. Pasó a ser hermana de `#player`.
2. **El programa arrancaba detrás de una placa que decía que estaba por arrancar.** La
   placa se come los gestos de una persona, pero eso es un hecho de la hoja de estilos;
   ahora hay un hecho del estado: mientras una placa está arriba, cualquier `play` vuelve
   a pausar. Es la versión que sobrevive a que alguien mueva un `z-index`.
3. **Y esa guarda, escrita en el orden natural, trabó el guion entero**: el `play()` que el
   propio beat hace al terminar es un `play`, así que con `speaking` en `true` se cancelaba
   a sí mismo y la guiada no pasaba de su primera placa. El orden de dos líneas es la
   diferencia y está escrito al lado.

**La librería no se tocó.** El freno es `video.pause()` y nada más, que es lo que la T-01
midió, y el `play()` reanuda cada caja en el cuadro donde quedó, así que el guion no
guarda ni restaura posiciones. El hallazgo del ADR 0040 no se disparó.

`npm test` en 49 verdes y `npm run check` en `both seams hold.`

## 2026-09-09 — T-05 de la fase 08: los cuatro creativos son nuestros, y el generador no derivó esta vez

Los cuatro avisos del minuto son de tres marcas inventadas: **NEONECTAR** (gaseosa),
**KALTO** (zapatillas) y **MERIDIA** (viajes). Cada creativo tiene las dos mitades del
ADR 0045: lo pictórico generado, y la geometría y toda la tipografía escritas como SVG y
rasterizadas con Chrome headless.

**Cero generaciones de Veo de las dos autorizadas.** El clip de 8 s de NEONECTAR ya
existía y ya estaba pagado —es el que se generó para resolver si Veo estaba disponible— y
es exactamente lo que el spot lineal necesitaba. Con la tipografía compuesta encima al
final, es el ADR 0045 corriendo en lugar de descrito. Las dos imágenes de `agy` van contra
la suscripción.

**Un refinamiento del hallazgo del ADR 0045, medido acá.** La investigación midió que el
generador deriva hacia el vestido comercial real aunque se le prohíba: con la pipa y las
tiras prohibidas, el zapato volvió con un destello lateral parecido a una pipa. **Esta vez
no derivó**, y la única diferencia entre los dos prompts es que éste **nombra la
alternativa**: no dice sólo "no imites una pipa", dice "un único acento continuo en ámbar
recorriendo la entresuela". La hipótesis, con una observación a favor y no como ley:
**prohibir deja el hueco y el modelo lo llena con lo que conoce; describir la alternativa
le da con qué llenarlo.** Cuesta una oración en el prompt.

El chequeo de vestido comercial se hizo pieza por pieza y está escrito: el zapato mirado a
cuadro completo y en dos ampliaciones —la línea ámbar sigue la curva de la suela y **no
sube al empeine**, que es la diferencia entre un acento propio y una pipa—, y la costa sin
edificios, personas, carteles ni texto.

**Dos defectos encontrados mirando la pantalla, y el primero era el más caro.** Cada
creativo salía perfecto al tamaño exacto de su caja y después `empaquetar-contenido.sh` lo
empaquetaba a 1280×720 como el plate, así que **el recorte centrado del ADR 0013 se
llevaba la mitad de la tipografía**. El script pasó a recibir el tamaño como argumento y
cada aviso se sirve a su medida, verificado con `ffprobe`: 512×720, 1280×288, 320×180 y
1280×720. Y el segundo: **la barra de progreso del cromo se come el pie de los creativos
que llegan al borde inferior**; el cromo se esconde solo, pero un creativo que sólo se lee
cuando el cromo está abajo es un creativo que a veces no se lee, así que los dos SVG
llevan la restricción escrita.

**Y un defecto de la T-04 que esta task encontró**, anotado como `post-ejecución` en su
bloque: la placa quedaba visible después de terminar la guiada, con `card.hidden` leyendo
`true` todo el tiempo, porque el `display: grid` de la hoja de estilos le gana al
`[hidden]` del navegador —uno es regla de autor y el otro de user-agent—. **Lo encontró una
captura y no la verificación**, que había leído la propiedad en lugar de mirar la imagen.
Es la lección de nivel `bajo` del skill, en vivo: un estilo computado no es evidencia de
que algo se ve.

Las fuentes generadas quedaron **versionadas** en `graphics/creativos/fuentes/` con su
razón escrita: `content/` está gitignoreado porque se puede reconstruir, y **una
generación no se repite**. Sin ellas la demo sólo correría en la máquina donde se
generaron. Y con esto el material de la Blender Foundation salió del todo: la línea de
crédito de la página ya no lo nombra.

`npm test` en 49 verdes y `npm run check` en `both seams hold.`

## 2026-09-09 — T-06 de la fase 08: la página, y la señalización mostrada como lo que es

Cuatro secciones contando el player, que es el tope, y las tres de abajo están abajo del
pliegue a propósito: **nada de lo que hay ahí explica el caso de negocio**, porque eso ya
pasó en la imagen y en treinta segundos. El scroll es para el ingeniero que ahora pregunta
qué fue lo que vio.

**La sección que vale para esta sala es la de la señalización, y no es una ilustración.**
La página fetchea la propia playlist que el player está tocando, saca la línea del
`EXT-X-DATERANGE` —la parte por las comas para que se lea en cuatro renglones—, sigue su
`X-ASSET-LIST` y muestra la forma de cada asset, incluido el tercero, que aparece como
`"(no layout block: a linear ad, played full frame)"`. Es la misma regla de la línea de
estado aplicada al scroll: **esta página no afirma nada que no haya leído.** Un tag pegado
en el HTML sería una ilustración, y una ilustración de una playlist no vale nada para gente
que lee playlists para vivir; además el `START-DATE` se mueve en cada empaquetado, así que
uno pegado a mano estaría mal mañana.

Las seis propiedades de la estética quedaron con su medición donde se podía: **una idea por
pantalla** son 887 px de sección sobre 887 de viewport en las dos secciones de contenido, y
lo que costó fue el bloque del asset list —cien líneas— que scrollea adentro de sí mismo en
lugar de empujar su sección abajo del pliegue. **Cero color en las tres secciones de
abajo**, que es la propiedad de la que cuelga el diseño: una página que trae su propio color
compite con la imagen que existe para mostrar.

**Un defecto encontrado en el celular que no se veía en el escritorio.** La página
desbordaba horizontalmente: medido a 500 px de ancho, el documento scrolleaba hasta 539. Y
la causa no era el bloque de código sino su padre — **un ítem de grid se niega a encogerse
por debajo del tamaño de su contenido**, así que el `white-space: pre` del `<pre>`
ensanchaba la sección entera y el `overflow-x: auto` del bloque no hacía nada mientras su
contenedor crecía feliz. Una línea, `min-width: 0`. Después: 485 sobre 500 y los dos
bloques scrolleando adentro de sí mismos. Es exactamente el tipo de defecto que la vara del
celular existe para agarrar, y no era gusto: scrollear de costado es la única cosa que esta
página no puede hacer nunca.

`npm test` en 49 verdes y `npm run check` en `both seams hold.`

## 2026-09-09 — T-07 de la fase 08: el suite de la demo, y las siete roturas que dieron rojo

La demo nueva tiene su propio suite adentro de su carpeta, que es lo que el ADR 0023 deja
como única forma. `npm test` pasó de 49 a **55 verdes**.

**Cuatro chequeos**, y el primero es el que hace que el ADR 0037 sea una propiedad y no
una intención: toda ancla del guion cae en un break y en un aviso que existen, **y el beat
frena antes de lo que anuncia**. La segunda mitad no es un extra — un `lead` negativo o un
ancla al aviso equivocado resuelven perfecto y ponen la placa tarde, que es el mismo
defecto con otra cara. Los otros tres: el break arranca en el `paradaEn` declarado y la
parada cabe adentro del plate (ADR 0044); el minuto declara sus tres formas —cuatro
avisos, uno sin bloque de layout y tercero, uno de imagen fija— (ADR 0043 y 0046); y cada
`uri` apunta adentro de `/content/`.

**Lo que hace que el chequeo de anclas pruebe algo: ejecuta `resolveAnchor` de
`js/story.js`, que es el código de la página y no una reimplementación.** El test arma un
proveedor desde los archivos declarados y le pasa ese proveedor a la misma función que
corre en el navegador. Y los tres chequeos son funciones puras en `comprobaciones.js` en
lugar de asserts sueltos, por la campaña: **un chequeo reimplementado es un chequeo
distinto que puede pasar donde el original falla**, así que las dos corridas ejecutan el
mismo código.

**La campaña de mutación: siete roturas, una por regla, cada una corriendo sólo el chequeo
que la cubre, y las siete dieron ROJO.** `npm run mutaciones`. La que más vale es la del
`image/jpeg` del banner cambiado por un `.m3u8`: **es una línea que deja la demo andando y
le saca el argumento** —el aviso se ve, el break pasa, y el minuto deja de mostrar tres
formas para mostrar dos— y nada excepto ese chequeo lo notaría.

**Y la campaña trae su propio control**: antes de romper nada corre los tres chequeos sobre
los archivos como están y exige verde. Sin eso, una campaña donde todo da rojo se vería
igual de exitosa que una correcta, que es la misma trampa un escalón más arriba.

Es la única task `alto` de la fase, y la razón está escrita: es código que corre
desatendido y cuya falla es un verde que no significa nada, que es exactamente el modo en
que este proyecto ya se equivocó tres veces.

`npm run check` en `both seams hold.`

## 2026-09-09 — T-08 de la fase 08: la documentación, y el status pasa a closing

Tres archivos, con el reparto del ADR 0025: el README de la raíz enruta y cada demo cuenta
su corrida. `demo/hydration-break/README.md`, una fila nueva en la tabla de `demo/` que
dice **qué argumenta** esta demo y no qué contiene, y el `CREDITS.md` completado. El README
de `compatibility-pair` no se tocó y su fila quedó como estaba.

**Cómo se aplicó la política de documentación del repo padre.** El punto de entrada va
exacto y una sola vez, `./run.sh hydration-break`, y lo demás apunta en lugar de
transcribir: en particular **el README no reproduce el recorrido del minuto con sus
segundos**, porque el script de señalización lo imprime en cada arranque y una tabla ahí
sería una copia que se despega. Tampoco lleva los tamaños de las cajas, ni la cuenta de
tests, ni los segundos de la parada: cada uno de esos datos tiene otro dueño.

Y las dos cosas que el README dice porque no se pueden averiguar corriendo nada: **encender
el audio una vez antes de grabar**, con la razón; y **cuáles son los dos archivos que se
editan y que no son código** —`story/story.json` para el texto del guion y `plate.json`
para el segundo de la parada—, que es lo que hace que reescribir el guion diez veces no sea
tocar JavaScript.

**La demo se levantó desde el punto de entrada documentado y con `content/` borrado**, para
que el README se pruebe y no se declare: bajó los clips, armó el plate, quemó el paquete de
canal, compuso los cuatro creativos, escribió la playlist, construyó la librería y sirvió
la carpeta. Después: un rango concurrente, cuatro avisos, 88 s de programa, la placa de
apertura arriba con el player quieto, y el tag real en la sección de señalización.

`npm test` en 55 verdes, `npm run check` en `both seams hold.`, `npm run mutaciones` con
las siete roturas en rojo. El 8080 de Nicolás quedó arriba todo el tiempo.

Las ocho tasks están hechas, así que el `status` del `PHASE.md` pasa a `closing`.

## 2026-09-09 — Fase 08 cerrada: la segunda demo, y la página que no afirma nada que no haya leído

La fase entrega `demo/hydration-break/` y es **la primera del proyecto cuyo entregable es
lo que se ve en escenario y no lo que lo hace posible**. Un minuto de juego detenido con
cuatro avisos encima de la imagen en vivo, el lineal tercero, y con eso la comparación
entre las dos formas de poner publicidad entra **adentro de un solo minuto y un solo
player** — que es lo que hace que esta demo **no necesite el par de compatibilidad**.

**Diez ADR, del 0037 al 0046**, nueve `phase-08` y uno `project`, el 0045. Ocho tasks,
todas `done`, ordenadas por riesgo. `npm test` de 49 a **55 verdes**, `npm run check` en
`both seams hold.`, `npm run mutaciones` con **siete roturas en rojo**, y
`validar-proyecto.py` en GREEN con 46 ADR y 8 fases.

**Lo que la hace defendible frente a la sala es una propiedad y no una lista de features:
la página no afirma nada que no haya leído.** El guion se ancla a la señalización y no a
un cronómetro —ni él ni el código contienen un segundo del programa—, la línea de estado
dice de qué forma es cada aviso leyendo el contrato, y la sección que muestra el
`EXT-X-DATERANGE` lo lee de la playlist que el player está tocando.

**Y la librería no se tocó, que no fue disciplina sino consecuencia de medir antes de
construir.** La T-01 midió que el `pause` del primario congela las tres cajas de video del
aviso, así que el freno del guion es una línea y el hallazgo del ADR 0040 nunca se disparó.
En ocho tasks no hubo un solo cambio en `lib/`.

**El hallazgo más caro no es de código: de seis candidatos de metraje "free to use", cinco
no pasaron el chequeo de cuadro** —escudo de federación con tres tiras, menores, marca
comercial legible— **y ninguno lo decía en su título**. El que se usó se salvó con un
recorte verificado en cuatro momentos, escrito en el script como lo que es: no es encuadre,
es el chequeo.

**El R7 se materializó dos veces adentro de la fase y las dos veces lo agarró un control.**
En la T-01 el chequeo del freno podría haber dado verde con nodos que nunca arrancaron, y
lo salvan las lecturas de los extremos; y la campaña de mutación de la T-07 existe entera
por eso, con su propio control. **Y apareció un riesgo que no estaba escrito: mirar la
propiedad en lugar de la imagen.** Dos defectos se escondieron detrás de un valor correcto
—`card.hidden` en `true` con la placa en pantalla, y el creativo perfecto que el empaquetado
re-recortaba— y los dos los encontró una captura.

**La revisión de documentación encontró una corrección que ninguna task había visto**:
`docs/integrating-the-library.md` tenía dos reglas de hoja de estilos y le faltaba la que
esta fase pagó con una hora — si la página dibuja algo encima de la imagen, el contenedor
necesita `isolation: isolate` **y** el elemento propio tiene que ser hermano y no hijo. Le
pasa a cualquier integrador, no sólo a esta demo. El contrato entre las dos capas se releyó
y sigue vigente sin cambios, y que una demo entera se haya construido contra él sin pedirle
un campo es la mejor evidencia de que describe lo que hay.

**Una decisión de Nicolás revirtió una mía, y el informe la cuenta así.** Yo versioné el
video generado con el argumento de que una generación no se repite; su criterio es que el
repositorio no carga video y que **el resultado no tiene que ser idéntico**, así que alcanza
con el prompt correcto. El mp4 salió de git sin borrarse del disco, las imágenes se quedaron
—más la de entrada del video, que faltaba—, y `setup-content.sh` es el punto de entrada
único que baja los clips y genera el spot.

Quedan cuatro hilos abiertos, y el primero es de contenido: **los actos de juego y de parada
del plate son equipos distintos.** La versión coherente existe y no tiene plano ancho de
transmisión; se da vuelta con una línea si Nicolás prefiere lo otro.

El `status` del proyecto queda en `ongoing`: quedan la grabación, iOS y la especificación
de SVTA.

## 2026-09-09 — Post-cierre de la fase 08: la L estaba autorada al revés, y el contrato ya tenía la forma correcta

Nicolás probó la demo y marcó que **la L no está hecha como la industria la hace**. Estaba
declarada como **dos elementos de aviso** —una tira vertical y una horizontal— con el
primario replegado a una esquina y sin declararse como elemento.

Lo que se hace de verdad, en sus palabras: *"el video principal se encoge y se pone por
delante, manteniendo su relación de aspecto y quedando unido contra los bordes superior y
derecho... el aviso es un único video que ocupa todo el viewport completo pero está en el
fondo... El usuario final percibe una banda con forma de L, pero la realidad es que es un
video completo de fondo con el principal arriba."*

**Y no es estético: el público del HLS Interest Group es el que sabe cómo se autora una L
de verdad**, así que una demo que existe para mostrar el mecanismo tenía su propia L hecha
de la forma que ese público no usa. Es exactamente quien lo iba a notar.

**El dato que más importa del arreglo: el contrato lo expresó sin pedirle nada.** Su regla
2 ya nombraba la forma —"el aviso está en `zDepth` 0 y el contenido primario en 1, o sea
que el aviso es el fondo"— y su regla 3 dice que el primario es un elemento del layout como
cualquier otro. El renderizador ya la contemplaba **por nombre**: posiciona el primario en
absoluto para que su `z-index` sea comparable, y su comentario dice que sin eso *"the
layouts where the ad is the background and the picture goes on top of it would come out
inverted"*. **Rehacer la L fue leer el documento y declarar distinto, con cero cambios en
`lib/`.**

Queda como **ADR 0047**. La caja del primario es `0 0 40 40` —el 60 % de los dos ejes, que
es lo que mantiene la relación de aspecto sobre un área de 16:9— y el aviso es un solo
elemento a cuadro entero en `zDepth` 0.

**Y el creativo cambió de forma con él**: de dos tiras a un video a viewport completo cuyo
contenido vive en las dos bandas. Su SVG pasó a ser **una plantilla**, porque dónde
terminan las bandas es la caja del primario vista del otro lado: `scripts/creativos.sh` lee
esos números del asset list y los sustituye. Escritos en los dos lugares se despegarían y
el creativo quedaría con tipografía debajo del partido o con una franja negra al costado,
**sin que nada falle**. Es el criterio del ADR 0044 aplicado a la geometría de un creativo.

Aplicado como `post-ejecución` en la T-02 —la señalización— y en la T-05 —el creativo—, y
con una sección nueva en el `REPORT.md` que cuenta las dos correcciones posteriores al
cierre. `npm test` en 55 verdes, `npm run check` en `both seams hold.`, `npm run mutaciones`
con las siete roturas en rojo, y `validar-proyecto.py` en verde con **47 ADR**.

## 2026-09-10 — El plate no convence, se intentó regenerar la parada, y no entró

Nicolás probó la demo y marcó el defecto: *"veo un video de gente jugando un deporte y
luego un video de cuando se están hidratando, y el problema es que el usuario final
percibe como que el video principal cambió... queda la duda de si es un interstitial de
cuando se reemplaza el video primario."* **Es el peor defecto posible para esta demo**,
porque la propiedad que existe para demostrar es que el primario nunca se reemplaza.

Su propuesta: regenerar la parada con Veo desde cuadros del propio clip de juego, para que
el plate sea un solo partido de punta a punta. **Se intentó en siete generaciones, US$ 5,44,
y no entró.** El registro completo, con los siete cuadros y el mecanismo, está en
`phases/08-.../tasks/T-03/generacion-de-la-parada/`.

**Lo que funcionó, y hay que decirlo primero**: la continuidad generada es inequívocamente
el mismo partido —misma cancha, misma reja, mismos banderines, misma luz, cámara quieta— y
los jugadores van y toman agua. Y `lastFrame` converge de verdad: cerrando contra un cuadro
dado, el último generado queda prácticamente igual a ése. **El mecanismo que Nicolás
propuso anda.**

**Lo que lo frenó**: el generador **dibuja marcas comerciales sobre la ropa**. Felino
saltando en tres pecheras; con la pechera resuelta como "un número y nada más", tres tiras
y un swoosh en una botineta; dándole al buzo y al botín algo que dibujar, regresó con más
tiras y un escudo; con el modelo no-fast, swooshes en el pecho más grandes y legibles. El
único prompt que las eliminó —la gente lejos y el primer plano vacío— **reinventó la
cancha**.

**Y el puente de 8 s con los dos extremos clavados —la idea que salía de que el intento 1
no fracasara sino que fracasara para el trabajo equivocado— inventó una tercera escena en
el medio**: jugó el primer plano, cortó a un lugar que no existe en ninguno de los dos
extremos, y cortó al segundo. Peor que el corte que venía a arreglar.

**El mecanismo que explica los siete de una sola vez**: Veo honra los extremos que se le
dan e **inventa todo lo que queda en el medio**. Con el medio corto y los dos extremos en
la misma escena, lo que inventa es plausible y la costura desaparece; **con los extremos en
escenas distintas, lo del medio es una escena nueva**, y ahí aparecen las marcas y las
canchas que no existen. De ahí la regla: **un puente sólo puede disolver un corte entre
cosas que ya son casi la misma**, y este corte es entre dos rodajes distintos — no es un
problema de prompt ni de modelo.

**La decisión es de Nicolás y es de postura: no se dibujan marcas de terceros.** Es la
misma que ya había tomado al elegir marcas de fantasía en lugar de reales; dibujar un
swoosh es esa decisión con otra ropa, en la dirección que ya había descartado. Y la
distinción que decide no es técnica: comparado al tamaño de entrega, en el clip real las
prendas están limpias y en el generado las marcas están **dibujadas**. No se hereda una
marca incidental — se la dibuja. La investigación de contenido trata la ropa deportiva con
marca como el caso débil, y lo es cuando la filmaste.

**El plate se queda con el corte**, que era la salida declarada de antemano por la regla de
aceptación: o el puente entra limpio, o se vuelve al corte. No había una tercera donde
entra con una marca chica.

Y quedan escritos los tres caminos ya descartados, para que nadie los recorra de nuevo: la
continuidad gráfica **ya estaba** y no alcanzó —el scorebug, el bug y el reloj persisten a
través del corte y Nicolás percibió el cambio igual—; reordenar los clips de la parada no
ayuda porque los tres son del mismo rodaje ajeno; y el perfil del autor en Pexels no tiene
clips hermanos del mismo picado. **La vía que sí lo resolvería es la que la investigación ya
había nombrado: metraje propio con una parada real, filmado.**

## 2026-09-10 — La parada generada, el gráfico que cambia y el reparto de múltiplos de ocho

Tres cosas cerraron juntas y la primera habilitó las otras dos.

**La cadena entró.** La parada del juego son ocho eslabones de 8 s generados con Veo, 64,03 s
concatenados, cada uno sembrado del último cuadro del anterior y el octavo cerrando contra el
primer cuadro del acto 3. Sin deriva de escena, muestreado cada 8 s en los 64. El plate es
ahora **un solo partido de punta a punta** y el corte de escena que hacía percibir *que el
video principal había cambiado* ya no existe.

Lo que cambió no fue el prompt: fue **el umbral**. Nicolás miró los clips y fijó la distinción
que faltaba — *"en el programa, una marca incidental en la ropa se acepta, igual que si
estuviera filmada. En la publicidad, las marcas son inventadas y nunca imitan a una real"* —.
Con ese umbral lo que no entra es una marca **dominando el cuadro**, no cualquier marca, y
cinco clips que yo había dado por rechazados entraban. **El chequeo estaba bien medido y mal
calibrado**, y esa diferencia no la podía ver quien escribió el chequeo.

**Sin disolvencias, y la razón va escrita.** Los dos empalmes están sembrados desde los cuadros
que empalman, así que ya son continuos: una disolvencia sobre movimiento continuo **no suaviza
un corte, inventa uno**. Se ve como un defecto de codificación y no como una edición.

**El gráfico cambia porque cambió el estado del partido** (ADR 0049), no para disimular nada:
no hay nada que disimular. El tanteador se va, `HYDRATION BREAK` ocupa su lugar, el bug del
canal se queda, y **el reloj corre a través del cambio** porque en una parada de hidratación el
partido no está detenido reglamentariamente. Nicolás corrigió la razón que yo había escrito, no
la implementación, y tenía razón en corregir eso: **una razón equivocada sobrevive mejor que un
error**.

**El espacio publicitario quedó en múltiplos de 8** (ADR 0048), porque ésa es la unidad de una
generación. El reparto es 16 / 16 / 8 / 24 y vive en `plate.json`, de donde salen los `DURATION`
del asset list, el `-t` de cada creativo y el largo de su empaquetado. Con su chequeo y tres
roturas propias en la campaña de mutación.

**Y al medir los largos empaquetados apareció un defecto que llevaba toda la fase adentro.**
`movido()` entregaba creativos más cortos que su ventana: `-loop 1` sirve la imagen a 25 fps y el
`fps=30` de `zoompan` **reetiqueta** esos cuadros en lugar de remuestrearlos, así que 24 s de
imagen salían como 20 s de video. Un aviso que termina antes de su ventana es el único defecto
de este mecanismo que **nada en pantalla reporta** — se ve como que el aviso se cortó, y se
habría leído como un problema de la librería. Lo delató el número y no la pantalla: 20,00 medidos
contra 24 declarados.

**Y uno que sí se veía, en todos los cuadros de la demo.** El bug del canal terminaba en x=1240
sobre 1280 y la librería dibuja su control de audio en x 1222..1261 (ADR 0015), así que la
palabra SPORT quedaba debajo del botón. Ahora cierra en 1210, con el número escrito al lado: es
la única coordenada del paquete que la elige la librería y no el diseño.

Verificado en pantalla sobre el plate real: t=12 s tanteador y pelota en juego; t=15 s
`HYDRATION BREAK` y los jugadores caminando a tomar agua. Tres segundos de distancia, un cambio
de gráfico, ningún corte. 56 tests verdes, los cuatro chequeos verdes, las diez roturas rojas.
