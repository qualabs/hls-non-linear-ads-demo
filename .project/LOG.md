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
