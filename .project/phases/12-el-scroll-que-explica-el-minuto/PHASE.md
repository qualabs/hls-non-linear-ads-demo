---
phase: 12-el-scroll-que-explica-el-minuto
title: "El scroll que explica el minuto: la página de abajo deja de recapitular y pasa a explicar"
status: closed
started: 2026-09-11
closed: 2026-09-11
---

# Fase 12: el scroll que explica el minuto

La página de `demo/hydration-break` termina hoy con tres bloques que **recapitulan**
el minuto que se acaba de ver. Esta fase los reemplaza por cuatro que **explican el
mecanismo**, para el ingeniero que ya vio el minuto y ahora pregunta qué fue eso.

El diseño y sus descartes están en `DESIGN.md`; las decisiones, en los ADR 0073 a
0077. Este documento es el contrato de la fase.

## Objetivo

Que la página, de la cintura para abajo, conteste cuatro preguntas en orden: qué es
un aviso lineal y qué es uno no lineal, qué puede hacer la clase concurrente y cómo
convive con el interstitial de siempre, qué dice la señalización de este ejemplo, y
de quién es cada cosa en pantalla.

Y que lo conteste **sin bajar la vara que la página ya se puso**: nada afirma algo
que no haya leído del contrato, y nada de lo que se ve es una grabación.

## El encuadre, que es un requisito y no un tono

Es la instrucción de Nicolás del 2026-09-11 y gobierna toda la copia de la
sección 2: *"es una forma más polite, no es reemplazar una cosa con otra, es dar más
opciones"*.

La página no argumenta que el interstitial tradicional esté mal. Argumenta que las
dos formas se sirven juntas y que cada cliente se queda con la que entiende, que es
lo que el ADR 0007 sostiene y lo que `compatibility-pair` demuestra con dos players.
Queda fijado en el ADR 0076, con alcance de proyecto, porque también es lo que David
dice en escenario.

## Alcance

1. **Las cuatro secciones en su orden nuevo**, con la copia en inglés y en la voz
   que la página ya tiene, y el comentario de cabecera de `index.html` reescrito
   para que describa el archivo que queda (ADR 0077).
2. **La galería de formas de aviso**, dibujada de lo que el proveedor resolvió y no
   fotografiada, con la guarda que fija esa propiedad (ADR 0073, 0074).
3. **La señalización navegable**: un pliegue por aviso con su JSON crudo adentro, la
   glosa por atributo del tag, y la marca en vivo del aviso que está en pantalla
   (ADR 0075).
4. **La figura de la convivencia**, dos columnas sobre una sola playlist (ADR 0076).
5. **La no-regresión**: que la demo que se graba siga en pie.

## Los archivos que esta fase toca, y por qué la lista está acá

La fase 11 está en curso al mismo tiempo y tiene tres tasks corriendo sobre `lib/`.
Las dos avanzan en paralelo porque **no comparten un solo archivo**, y eso deja de
ser cierto en silencio si nadie lo escribe.

Esta fase toca **solamente** esto, todo adentro de `demo/hydration-break/`:

| archivo | quién lo toca |
| --- | --- |
| `index.html` | T-01 y T-04 |
| `js/tipos.js` (nuevo) | T-02 |
| `js/senalizacion.js` (nuevo) | T-03 |
| `js/app.js` | T-02 y T-03, una línea cada una |
| `css/page.css` | T-01, T-02, T-03 y T-04, cada una su bloque |
| `test/comprobaciones.js`, `test/signalled-run.test.js`, `test/mutaciones.mjs` | T-02, T-03 y T-05 |

**Y no toca `lib/`, que es lo importante.** Nada de esta fase necesita un cambio de
librería, y eso es una propiedad del diseño y no una casualidad: si la galería
necesitara un método nuevo en el proveedor, sería la señal de que está dibujando
algo que el contrato no dice. Si aparece esa necesidad, **es una dependencia y se
reporta**, no se entra a `lib/`.

Tampoco toca `demo/multiview-offer/` ni `demo/compatibility-pair/`.

## La dependencia que la fase tiene con la 11, y cómo se neutraliza

La fase 11 le agrega a `programRanges()` un `kind` nuevo, `'multiview'`. La galería
de la T-02 lee esa lista, así que **filtra por `kind === 'concurrent'`** en lugar de
suponer que hay un solo rango. Con eso la T-02 se escribe hoy y sigue siendo
correcta el día que la 11 aterrice, sin esperarla y sin coordinar.

## El criterio de la fase

**La vara de la página no baja, y es la que decide los dos problemas de diseño.**
Está escrita en el comentario de cabecera del propio `index.html`: *"no caption on
this page can claim something it has not read off the contract"*, y *"none of it is
a recording"*.

De ahí salen las dos propiedades que la fase tiene que dejar en pie:

- **Lo que se dibuja se deriva.** La galería no es una imagen guardada ni una lista
  de tipos escrita a mano: se arma con las cajas que el proveedor ya resolvió. Si el
  asset-list cambia, el dibujo cambia solo.
- **Lo que hoy es verdad no se pierde.** El tag y el asset-list se siguen leyendo en
  vivo de lo que este player está reproduciendo. Navegable se **suma** encima: el
  resumen de hoy deja de ser el contenido y pasa a ser el rótulo del pliegue, y el
  JSON crudo —que hoy no está en ningún lado de la página— entra adentro.

## La verificación de la fase, y qué mide cada cosa

**Un chequeo que no puede fallar no es un chequeo.** Es la lección que este proyecto
pagó seis veces en dos días, y acá se aplica a la pieza cuyo valor entero es una
propiedad negativa.

**La galería lleva su propia guarda, y la guarda es una aserción y no una
intención.** Todo el valor de dibujarla del contrato es que no puede quedar vieja,
así que si mañana alguien la reemplaza por imágenes fijas o por una lista de tipos
escrita a mano, algo tiene que ponerse rojo. El chequeo mide la propiedad y no
repite la conclusión: **ninguno de los identificadores de layout aparece como
literal en `index.html` ni en `js/tipos.js`**. Va con su control en la campaña de
mutación, que planta un identificador a propósito y exige que el chequeo lo
encuentre. Lo construye la T-02.

**La verificación visual es una captura headless real y no un `getComputedStyle`.**
A 400×780 y a 1907 de ancho, que son los dos anchos contra los que esta página ya
midió. El cuerpo del documento no puede scrollear de costado: es lo que
`chapter__inner { min-width: 0 }` ya defiende, y un `<details>` con cien líneas de
JSON adentro es exactamente el elemento que lo vuelve a poner en riesgo.

**La línea de base se mide antes de tocar nada**, con los mismos comandos de la
fase 11: `npm test`, `npm run check` y `npm run mutaciones`. La toma la T-01 y la
compara la T-05.

## La pregunta que quedó sin contestar, y cómo se diseña con ella abierta

**No se sabe si el scroll de abajo entra en la grabación del 28 al 30 o si se graba
solamente el player.** `PROJECT.md` dice que en escenario se muestran grabaciones y
que la ventana es esa, y no dice qué encuadra. Nicolás aprobó el diseño sin cerrarla,
así que queda escrita acá como lo que es: **un dato que cambia cuánto conviene
invertir, no una decisión pendiente que frene la fase.**

La fase se diseña con la recomendación puesta: **se construye todo**, porque la
página vive después del evento como el link que queda, y porque cuatro de las cinco
tasks producen material que sirve igual en los dos escenarios.

**Lo que se pierde si al final se graba sólo el player es chico y es concreto: la
T-04**, la figura de la convivencia. Es la única pieza cuyo valor es enteramente de
escenario, es media jornada, y está aislada como task propia exactamente por eso: si
la respuesta llega y es "sólo el player", se saca sin tocar nada más. Las otras
cuatro tasks no cambian.

## Lo que la fase NO va a producir

Va escrito acá para que al cerrar no quede como un supuesto de quien lea.

- **Ningún cambio en la librería ni en el contrato entre las dos capas.** Al cerrar
  esta fase, `lib/` está exactamente como la dejó la fase 11.
- **Ninguna captura de pantalla de la demo como material de la página.** Es el
  ADR 0073, y decirlo acá es lo que evita que alguien lo lea como un olvido.
- **Ningún dibujo de los layouts que esta demo no reproduce** —`squeezebackFrame`,
  `squeezebackDoubleBox`, `multiView`— ni los cinco nombres del documento de
  requerimientos de David. Es el ADR 0074, y su razón es que el ADR 0012 sigue en
  estado `proposed`.
- **Ningún test de DOM del renderizado.** La línea del proyecto no cambia: lo que se
  vuelve puro se testea, y lo que queda es pintura, que se mira.
- **Ninguna conclusión sobre iOS.**

## Fuera de alcance

- La apertura de la página y el player. La fase empieza donde empieza el scroll.
- `lib/`, `demo/multiview-offer/` y `demo/compatibility-pair/`.
- El deck y lo que David dice en escenario, que son de él.
- Llevar nada de esto a la especificación de SVTA.

## Riesgos y mitigaciones

| | riesgo | mitigación |
| --- | --- | --- |
| **R1** | **La galería se degrada a una lista escrita a mano** en el primer apuro, y con eso la página pierde la única propiedad que la hace distinta de un PowerPoint. | La guarda de la T-02, con su control en la campaña de mutación. Es el riesgo que la fase existe para atajar. |
| **R2** | **El `<details>` con el JSON crudo rompe el ancho de la página en un teléfono.** Ya pasó en esta misma página con los `<pre>`: el documento scrolleaba a 539 px sobre un viewport de 500. | Captura real a 400×780 en la T-03, mirando la imagen y no un estilo computado. |
| **R3** | **Cuatro secciones abajo del player convierten la demo en un documento** y nadie las lee en escenario. | El ADR 0077 las deja en tres más el pie, que es la forma que la página ya tiene. El riesgo residual se acepta. |
| **R4** | **`activeAt` no contesta por tiempos que todavía no se reprodujeron** y la galería se queda sin datos hasta que el break llega. | Verificado en la fuente antes de diseñar: `activeAt` filtra el array completo de experiencias resueltas. La T-02 lo comprueba en su primer paso y, si resultara falso, **para y reporta** en lugar de parsear el asset-list por su cuenta, que es lo que duplicaría los dos defaults del ADR 0004. |
| **R5** | **La fase 11 cambia la forma de `programRanges()`** mientras esta fase se construye. | El ADR 0072 fija que la 11 no cambia una sola forma de dato, y la T-02 filtra por `kind === 'concurrent'` en vez de suponer un rango único. |
| **R6** | **Se graba sólo el player** y la T-04 no se ve nunca. | Aislada como task propia y removible sin tocar el resto. Aceptado y escrito arriba. |

## La arquitectura, y dónde está

El proyecto no usa `docs/arc42/`: su documento de arquitectura son los dos de
`docs/`, y así quedó desde la fase 02.

**Esta fase no le cambia nada a ninguno de los dos, y por eso no hay una task de
documentación.** `docs/contrato-senalizacion-renderizado.md` es la superficie entre
las dos capas y esta fase la **consume** sin tocarla: la galería lee `activeAt` y
`programRanges`, que es exactamente lo que el contrato ya documenta.
`docs/integrating-the-library.md` es la superficie pública de la librería, y la fase
no toca la librería.

Lo que sí es documentación y sí se toca es **el comentario de cabecera de
`index.html`**, que en esta demo es la documentación real del archivo. Va en la
T-01, que es la que lo vuelve falso.

## Stakeholders

- **Nicolás Levy** pidió la reestructura, fijó el encuadre de convivencia y aprobó
  el diseño el 2026-09-11 sin cambiarle ninguna de las cinco decisiones.
- **David Hassoun** presenta esta página en el evento de Apple del 7 de octubre. La
  copia se escribe en inglés por eso. No participó del diseño.

## Timeline

Un día de trabajo, en cinco tasks. Es anterior a la ventana de grabación del 28 al
30 de septiembre y corre en paralelo con la fase 11, que vive en `lib/` y en
`demo/multiview-offer/`.
