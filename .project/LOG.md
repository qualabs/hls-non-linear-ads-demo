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
