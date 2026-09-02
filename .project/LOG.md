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
