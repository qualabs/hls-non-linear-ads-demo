---
name: Demo de publicidad no lineal en HLS (HLS Interest Day)
slug: hls-non-linear-ads-demo
description: >
  Construir la demo de publicidad no lineal en HLS que David Hassoun
  presenta en el evento de Apple del 7 de octubre de 2026 (el "HLS
  Interest Day"). La demo se muestra grabada, pero el software tiene
  que funcionar de verdad: David descartó explícitamente el
  compositing de video. Nicolás construye la demo y no la delega,
  trae a Emil para la parte de iOS, y apunta primero a hls.js como
  camino crítico. Alcance, fechas y reparto salen de la reunión del
  2026-09-02 con David y del documento de requerimientos que David
  mantiene para la gente del evento.
status: ongoing
type: desarrollo
owner: nicolas-levy
started: 2026-09-02
last_update: 2026-09-04
tags: [hls, hls-interstitials, non-linear-ads, svta, apple, hlsjs, avfoundation, demo]
repo: https://github.com/qualabs/hls-non-linear-ads-demo
output_pointers:
  - kind: external-repo
    label: código de la demo (privado, org qualabs)
    url: https://github.com/qualabs/hls-non-linear-ads-demo
  - kind: drive-doc
    label: minuta de la reunión de alcance con David Hassoun (2026-09-02)
    url: https://docs.google.com/document/d/1ZSrYPeRoNzypDRCLoenWpISu17M9PJ3erWQFkfaPL7U
  - kind: url
    label: Layout Controller de SVTA, la herramienta contra la que se resuelve el renderizado
    url: https://www.svta.org/wp-content/nlag/v4/
related_processes: []
related_wgs: [svta-ads]
---

# Demo de publicidad no lineal en HLS (HLS Interest Day)

Este documento tiene dos fuentes. La primera es la minuta de la reunión
del 2026-09-02 entre David Hassoun y Nicolás Levy, que fijó alcance,
fechas y reparto; está en `processes/cto-minutes/data/meetings-index.json`
como `tactiq-2026-09-02-001` y el Doc completo es
`1ZSrYPeRoNzypDRCLoenWpISu17M9PJ3erWQFkfaPL7U`. La segunda es el
documento de requerimientos que David armó para la gente del evento, que
es de donde sale la sección "Requerimientos de alto nivel" y todo lo
técnico que se cita textual. Donde las dos difieren, está dicho.

El nombre "HLS Interest Day" lo aporta Nicolás. La minuta se refiere al
evento como "el evento de Apple del 7 de octubre".

## Lo primero: la fecha real del proyecto es la grabación, no la presentación

La presentación es el 7 de octubre, pero el software tiene que estar
terminado **entre el 28 y el 30 de septiembre**, que es la ventana de
grabación. En el escenario se muestran grabaciones y no una corrida en
vivo, y esa decisión suena a reducción de riesgo hasta que se la lee
junto con la otra: David dijo "I don't want it smoke in mirrors" y
descartó explícitamente el compositing de video que mostrara cómo se
vería la cosa. Las dos frases juntas son más exigentes que cada una por
separado, porque dicen que el software tiene que estar operativo antes
de grabar y no antes de presentar. El proyecto tiene entonces una
semana menos de la que aparenta.

El hito duro del medio es el primer draft de las demos andando, más un
sync de una hora con David para revisar el estado completo. Es el punto
donde se sabe si el plan aguanta. Su fecha es la primera pregunta
abierta del proyecto: la minuta la fija el **lunes 21 de septiembre**,
el día en que David vuelve de Europa, y el documento de requerimientos
dice **1 de septiembre**. Están a veinte días una de otra sobre un
proyecto de cinco semanas, y la del documento ya pasó. La planificación
de la fase 01 corre contra el 21 hasta que David confirme cuál vale.

## El riesgo número uno: hls.js contra AVFoundation

El camino crítico elegido es hls.js, y la elección se tomó sobre
información que ninguno de los dos tiene todavía.

Nicolás eligió hls.js por experiencia previa, con el argumento de que si
no sale lo que debería ser más fácil, el proyecto está en problemas, y
dejó la reserva explícita de cambiar si aparece información nueva.
David también prefiere hls.js, porque permite mostrar la pestaña de red
del browser durante la demo.

La contra-indicación no está resuelta. A David le dijo Rob que hay
implementaciones públicas en Swift que no existen en hls.js, algo
alrededor de reemplazar una clase y de cómo eso funciona con el
DATERANGE, y que eso haría el trabajo bastante más fácil en
AVFoundation. También le dijo que el trabajo en hls.js que mejoraría
esto está planificado pero **no hecho**, así que hoy la vía posible es
parchear o modificar hls.js en lugar de hacer una implementación limpia.
El documento de requerimientos lo deja escrito así: sobre hls.js, que es
la opción óptima si se logra limpiamente, "Rob warned might not be
suited for this yet but it is on their roadmap", y David anota que no
sabe qué parte exactamente, que puede conseguir más detalles, y que
presume que se trata de definir la clase en el DATERANGE y de poder
inyectar una custom que interopere bien. David no tiene esos detalles
porque creía tener grabada esa conversación y no la tenía, y durante la
reunión mandó un email a Rob con Nicolás en copia para recuperarlos.

El documento también fija qué combinación es aceptable si la limpia no
sale: iOS nativo limpio más web parcheado a lo bruto, o web limpio solo.

Lo que esto significa en concreto: **dos semanas de trabajo pueden ir a
la plataforma equivocada y descubrirse en el sync del primer draft**,
cuando ya no queda margen antes de la grabación. Es el riesgo que decide
la fase 01, y su mitigación está en el `PHASE.md` de esa fase.

La decisión de plataforma no tiene ADR propio: es el objetivo que Nicolás
le fijó a la fase 01, y lo que la sostiene está en el `PHASE.md` de esa
fase, en el riesgo R3. La información que David recuperó de Rob Walch la
descomprime en lugar de contradecirla: para una demo, cualquiera de las
dos plataformas sirve.

## Objetivo y motivación

El objetivo es tener funcionando, grabada y presentable, una demo de
publicidad no lineal en HLS: un player que use la clase custom para
cargar el asset list y que resuelva el renderizado del layout del
interstitial con un layout controller, mostrando varios de los layouts
principales y no uno solo.

La motivación tiene tres partes que la minuta deja explícitas. La
primera es que el interés de la industria en publicidad no lineal está
creciendo y la idea gustó donde se presentó. La segunda es que el
branding de Qualabs es parte del entregable y no un adorno: David se
aseguró de que exista un namespace propio y dijo que si Qualabs hace el
trabajo, se va a destacar, aparejado con el de SVTA porque el trabajo se
hace con ellos. La tercera es que la demo es lo que después empuja la
especificación de SVTA, que es el tercer frente de este trabajo.

## Requerimientos de alto nivel

El documento que David armó para la gente del evento explica qué están
haciendo, qué quieren lograr y cómo planean hacerlo. Lo que sigue es lo
que fija para esta demo.

**El marco.** El trabajo extiende la guía SVTA2053 (Ad Creative
Signaling in DASH and HLS) a su v3, para incorporar experiencias de
publicidad concurrente no lineal alineadas con IAB y con la
actualización de VAST. Los formatos que se buscan cubrir son Linear Ad,
Pause Ad, Menu Ad, Squeezeback y Overlay, extendiendo las
implementaciones para permitir más control de la presentación del lado
del cliente.

**El mecanismo en HLS**, en los cinco puntos que el documento enumera.

1. Se usan los tags DATERANGE y el flujo de interstitials existentes
   para llegar al asset-list JSON.
2. Se extienden las guías de SVTA sobre ese asset-list JSON para que
   incluya los datos de layout de la experiencia concurrente, sea
   publicitaria o editorial.
3. La intención es proveer una librería implementable dentro de las
   aplicaciones cliente, que permita reemplazar opcionalmente la clase
   por defecto `com.apple.hls.interstitial` del DATERANGE por la clase
   concurrente, y con eso habilitar la experiencia.
4. Esa clase concurrente extiende, óptimamente, a la clase interstitial
   existente, para mantener compatibilidad hacia atrás cuando el
   asset-list JSON responde un interstitial tradicional.
5. Si el asset-list trae los datos adicionales de la experiencia
   concurrente, el cliente la renderiza.

**El layout controller.** Es una herramienta de SVTA, en
`https://www.svta.org/wp-content/nlag/v4/`, y trabaja con offsets
porcentuales relativos al viewport. Es contra ella que se resuelve el
layout y el renderizado.

**La forma de los datos.** El DATERANGE lleva la clase custom, y el
asset-list lleva por asset un bloque `X-AD-CREATIVE-SIGNALING` con su
`version`, un `type` de slot y un `payload` que declara el tipo de
presentación (por ejemplo `cornerOverlay`), su `start`, su `duration` y
un `layout` con los assets, cada uno con su `viewport` de cuatro valores
porcentuales y su `zDepth`.

**El tercer frente.** El documento pide actualizar el spec doc de SVTA
al estado actual de todas las decisiones y de la solución propuesta.

## Alcance

### Must-have

- **El SDK, con al menos una plataforma funcionando.** El player usa la
  clase del DATERANGE para cargar y manejar el asset-list.json
  enriquecido para la experiencia concurrente, y ese manejo incluye el
  layout y el renderizado resueltos contra el Layout Controller. El
  documento anota que iOS puede salir más limpio, pero que hls.js es
  más impactante.
- **El SDK, óptimamente, en forma de librería** que se incluya en la
  aplicación y se active si la clase está definida en el DATERANGE.
  Puede requerir más setup y scaffolding según la plataforma.
- **Al menos una plataforma**, entre web con hls.js e iOS con Swift.
- **La aplicación de demo**, con un stream que recorra los distintos
  layouts de ad y muestre el asset-list.json. Mostrar además los tags
  DATERANGE o el manifest de cada uno es opcional. En web se resuelve
  con las herramientas de red del browser; en iOS habría que exponerlo
  dentro de la propia app, por ejemplo en un iPad.

### Stretch

- Las dos plataformas, web y iOS.
- Controles e indicador de si el device soporta múltiples decoders, y
  pasar esa capacidad al APS en el request del asset list, por inyección
  de parámetro en la URL.

### Fuera de alcance

- El deck y la presentación, que son de David (trabaja el deck con
  August [?]).
- El scheduling de DATERANGE, que es otro de los focos grandes del
  evento y que Apple va a presentar. A David le gustaría mostrar en la
  discusión cómo se conecta con este trabajo si hay tiempo, pero quedó
  como deseable y sin owner.
- **El modelo** de detección de capacidades de la especificación, por la
  posición de Nicolás que está más abajo. Lo que sí entra, en la fase 03, es
  el passthrough: el SDK recibe un `decoderCount` configurado, lo lleva al
  pedido del asset-list, y hace repliegue con él.

## Los cinco layouts

El documento los enumera: Overlay, L-box con video, L-box con imagen,
Side by side pullback, y Quad, que es el editorial. El L-box con video
es, según David, el más difícil de conseguir en assets.

1. Overlay.
2. L-box con video.
3. L-box con imagen.
4. Side by side pullback.
5. Quad, el layout editorial.

El reparto de estos cinco entre el primer draft y la grabación del 28 al
30 no está definido en ninguna de las dos fuentes, y queda como pregunta
a cerrar en el sync del primer draft.

## Assets

Hay material y los dos coincidieron en que conseguirlo no debería ser
difícil.

- El listado de assets abiertos de SVTA, que David tiene consolidado en
  una planilla propia porque el sitio oficial es incómodo de usar.
  Incluye varios de los que usan normalmente los distribuidores de TV,
  que son visualmente atractivos. David quedó en compartirlo.
- Material del IAB.
- Assets de Apple, que David cree que se pueden conseguir. Nadie tomó
  esa gestión en la reunión.
- Imágenes generadas con IA para los L-box.
- Un dataset público de YouTube que viene usando Nicolás, con la
  advertencia de que es contenido generado por usuarios y se nota.

**Big Buck Bunny queda descartado**, por pedido de Nicolás: su sola
aparición transmite que lo que se está mirando es una prueba de
concepto.

**Lo que el POC de la fase 01 midió sobre los assets, porque cambia el
pedido.** El recorrido corre completo con material abierto de la Blender
Foundation, y cuatro de los cinco layouts quedan bien. Falta material para
dos cosas distintas: un creativo de video con luz para el Quad, que
consume los tres assets de aviso de una sola vez y por eso no admite el
reemplazo puntual; y un creativo hecho para la forma de la barra del
LBox, que hoy se cubre recortando el 60 % de un clip de 16:9. El pedido,
con el método y los números, está en
`phases/01-poc-web-hlsjs/tasks/T-12/t12-los-assets-que-faltan.md`.

## Namespace y branding

Mientras SVTA no publique la especificación, la demo usa un namespace
propio de Qualabs para la clase custom: **`com.qualabs.hls.concurrentInterstitial`**.
El documento lo trae textual:

```
#EXT-X-DATERANGE:ID="AD-1-0",CLASS="com.qualabs.hls.concurrentInterstitial",
START-DATE="2019-01-01T00:12:10.939Z",END-DATE="2019-01-01T00:12:10.939Z",
X-RESUME-OFFSET=0,X-SNAP="OUT,IN",X-ASSET-LIST="https://sgai.example.org/asset-list",
X-RESTRICT="SKIP",PLANNED-DURATION=24,SCTE35-OUT=0xFC30...
```

Cuando SVTA publique, la clase pasa al namespace de ellos, que en el
documento aparece como `com.svta.hls.concurrentInterstitial` y con el
nombre todavía a definir.

El branding de Qualabs se muestra junto al de SVTA. David se aseguró de
que el namespace propio existiera y fue explícito en que el logo de
Qualabs va a estar ahí.

## Detección de capacidades: la especificación existe, y queda fuera

El documento de requerimientos incluye, antes de la sección de qué hay
que construir, una especificación técnica completa de detección de
capacidad de decodificación concurrente: "Concurrent Media Decode
Capability Detection for SGAI Non-Linear Ad Experiences", draft v0.9 del
2026-08-17, de David Hassoun, con capítulos numerados del 0 al 13.
Define un modelo de capacidad de cuatro dimensiones, un probe de cliente
en cuatro fases, bindings normativos por plataforma, una escalera de
fallback y cómo se señala la capacidad al ad stack.

**Nicolás la deja expresamente fuera de alcance por ahora**, y su
posición no es que sea trabajo para más adelante, sino que el encuadre
está equivocado:

> Lo de detección de capacidades por ahora olvidate. Algo pasa que
> todavía siguen pensando en eso cuando la solución ya la tenemos, que
> son las opciones. Pero bueno, va a llevarme más tiempo que entiendan
> que dar un listado de opciones es la solución correcta.

El argumento es que averiguar de antemano qué puede hacer cada
dispositivo es el problema equivocado, y que la solución correcta es dar
un listado de opciones. El propio documento ya contiene mecanismos de
esa forma en su sección de device detection: placements que declaran qué
tipos de presentación soportan (Replace, Insert, Concurrent,
ConcurrentStatic), multi layout con fallback, y una única respuesta VAST
que traiga a la vez los assets de la experiencia concurrente y los de la
lineal.

Esto no cierra la discusión, y por eso la posición queda escrita. El
tema vuelve por dos lados: la detección es uno de los dos problemas
abiertos que David piensa marcar en escenario, y pasarle la capacidad de
múltiples decoders al APS sigue listado como stretch de la demo. Lo que
queda fuera es el modelo de detección de la especificación, no el
stretch tal como David lo escribió.

Y ese stretch dejó de ser stretch. **La fase 03 se lleva el `decoderCount`**
como configuración del SDK que viaja al pedido del asset-list, más el
repliegue del lado del cliente cuando lo que vuelve no se puede reproducir.
David coincide en el reparto: "it's not the SDK's responsibility to determine
the decoders, that's the application developer's". El SDK recibe el número;
averiguarlo sigue siendo del que integra, y el modelo de detección sigue
afuera.

## Reparto y compromisos

El reparto quedó fijado en un intercambio puntual: David preguntó si la
demo la iba a hacer Nicolás o si había que meter a Pablo, mencionando
también a Juan Pablo, y Nicolás la tomó para sí. La demo no está
delegada, y si más adelante hay que moverla a otra persona hay que
reabrir esa conversación explícitamente, porque quedó zanjada por un
compromiso personal y no por una asignación de equipo.

- **Nicolás Levy** construye la demo. Además: hablar con Emil para la
  parte de iOS, volcar los requerimientos de la demo en el documento de
  David, levantar el proyecto de GitHub con el plan, crear un canal
  dedicado para este trabajo, y ayudar con la actualización de la
  especificación de SVTA (prioridad baja, y quién hace el primer pase
  quedó abierto).
- **David Hassoun** hace la presentación y el deck, trabajando con
  August [?] y siguiendo el proceso por etapas que pide Apple: outline,
  outline slides, script por slide, slides de alta fidelidad. Además:
  recuperar los detalles técnicos de AVFoundation contra hls.js y
  compartirlos, agregar el timeline al documento (hecho durante la
  reunión), actualizar la especificación de SVTA y mandarla al grupo de
  DASH para feedback, ver si Olivier puede ayudar con esa
  actualización, compartir el listado de assets abiertos de SVTA,
  volver a pedir que cancelen la serie de calendario del Advertising
  WG, y confirmar si va al evento del día siguiente al de Apple.
- **Emil** entra por la parte de iOS. Nicolás dijo que le habla
  directamente. La minuta no registra alcance ni fechas para él.
- La **especificación de SVTA** se retoma entre los dos cuando la demo
  esté encaminada. Es el tercer frente y el de menor prioridad según
  David, aunque tiene la misma fecha límite que el más alto.

## Timeline

| Fecha | Hito |
| --- | --- |
| 2026-09-21 (lunes) | Primer draft de las demos andando, más un sync de una hora con David para revisar el estado completo. David lo agendó a las 7:00 de su hora. Es el día en que vuelve de Europa. |
| 2026-09-28 a 2026-09-30 | Grabación final de las demos. Es la fecha real del proyecto. |
| 2026-10-05 (lunes) | Test run que pide Apple. La minuta anota que el transcript dice "Monday" y que la fecha sale del calendario. |
| 2026-10-06 (martes) | Dress rehearsal. Misma nota de fuente que el test run. |
| 2026-10-07 (miércoles) | Presentación en el evento de Apple, y especificación de SVTA actualizada con todas las decisiones tomadas. |

El timeline del documento de requerimientos coincide con este salvo en
dos puntos: pone el primer draft de las demos el 1 de septiembre en
lugar del 21, y no incluye el test run del 5 de octubre.

David está fuera por IBC y unos días más, y vuelve el 21 de septiembre.
Dejó dicho que igual está disponible durante IBC y la semana siguiente,
y que Nicolás lo pinguee si necesita algo. El modo de trabajo acordado
hasta el 21 es coordinación por chat con un sync semanal.

## Los dos problemas abiertos que David va a marcar en escenario

David fue explícito en que parte del valor de la presentación es nombrar
lo que todavía no está resuelto, y señaló dos puntos sobre los que
piensa insistir. No son problemas a resolver en este proyecto, pero
condicionan qué muestra la demo.

1. **Cómo se detecta que un device puede hacer esto, y cómo se entera el
   interstitial service.** Es lo mismo que planteó Rob, y David lo
   describe como un foco de interés de todos. Es también el tema sobre
   el que Nicolás sostiene que el encuadre está equivocado, más arriba.
2. **Qué hacer cuando el ad break no se puede llenar con un ad no
   lineal**, es decir si se cae el break entero o no.

## Riesgos que cruzan fases

El riesgo de plataforma está arriba, y su mitigación está en el
`PHASE.md` de la fase 01 porque es lo que esa fase resuelve. Los que
siguen cruzan todo el proyecto.

- **La fecha percibida no es la fecha real.** Cualquier planificación
  que apunte al 7 de octubre en lugar del 28 de septiembre llega una
  semana tarde. Mitigación: el timeline de arriba y el hito del primer
  draft son las fechas de trabajo; el 7 de octubre no se usa como fecha
  de ingeniería.
- **Los assets del L-box con video.** Es el layout más difícil de
  conseguir en material, según David. Mitigación: entra temprano en el
  relevamiento de assets, para que la falta se descubra con tiempo de
  buscar alternativas.
- **La especificación de SVTA es el frente que se cae solo.** David
  dijo que de los tres es el menos importante y lo puso al final, pero
  la quiere actualizada para el día de la presentación. Ya nombró las
  dos salidas que tiene pensadas, que son que Nicolás haga un primer
  pase o que Olivier ayude. Mitigación: decidir cuál de las dos se usa
  antes de que la presión de la fecha decida sola. Sin owner asignado
  todavía.
- **La demo está atada a un compromiso personal.** No está delegada, y
  moverla requiere reabrir la conversación con David. Riesgo aceptado
  explícitamente: es la condición bajo la que se tomó el trabajo.

## A confirmar

La lista consolidada, con los números y la evidencia de cada una, está en
la sección 4 del informe de cierre de la fase 01
(`phases/01-poc-web-hlsjs/REPORT.md`). Acá quedan los enunciados.

**Para David:**

- **La fecha del primer draft.** El documento de requerimientos dice
  "First draft of demos Sept 1" y la minuta fija el lunes 21 de
  septiembre. David dijo en la reunión que ya había agregado el timeline
  al documento, lo que hace la contradicción más difícil de leer. La fase
  01 se planificó contra el 21 y cerró el 4 de septiembre, así que la
  pregunta dejó de ser urgente para esa fase y sigue sin contestar para
  el resto del proyecto.
- **August [?]**: la persona con la que David trabaja el deck.
- **El reparto de los cinco layouts** entre el primer draft y la
  grabación, propuesto en el ADR 0011, que sigue en `proposed`. El POC
  pasó de largo esa línea: hoy están los cinco. Lo que falta confirmar es
  si esos cinco son los cinco que él quiere mostrar.
- **El mapeo de los cinco nombres al campo `type`**, propuesto en el ADR
  0012, que sigue en `proposed`. Dos puntos concretos: los dos LBox son
  hoy el mismo layout hasta el MIME del asset —mismo `type`, mismos
  `viewport`, mismos `zDepth`, y nada en el payload que los nombre—, y
  `squeezebackFrame` es el único identificador de la herramienta sin
  correlato en los cinco nombres del documento.
- **Los assets que faltan, con números.** El Quad se queda sin material y
  no se arregla desde acá, porque consume los tres assets de aviso de una
  sola vez; y el LBox con video, el que David marcó como el más difícil de
  conseguir, hoy está cubierto recortando el 60 % de un clip de 16:9. El
  pedido medido está en
  `phases/01-poc-web-hlsjs/tasks/T-12/t12-los-assets-que-faltan.md`.
- **Quién hace el primer pase de la especificación de SVTA.**
- **Qué significa `version: 2`** en el bloque `X-AD-CREATIVE-SIGNALING`.

**Para SVTA, sobre el formato**, y ninguna bloquea código: cuál de varias
fuentes concurrentes se escucha y cómo se expresa; el `volume`, que la
herramienta no emite cuando vale 100 y cuyo default en ausencia el formato no
fija (el ADR 0014 lo decide para la demo en silencio, que es una divergencia
deliberada con la semántica de la herramienta); cómo llena un
asset una caja cuya relación de aspecto no es la suya (el ADR 0013 lo
decidió para la demo y no para el formato); dónde va un asset que es una
imagen, cuando el `URI` del `ASSET` que lo contiene espera algo
reproducible; la divergencia de modelos de coordenadas entre HLS y DASH;
y si el layout debería viajar en el propio DateRange Object en vez de en
el asset-list.

## Coordinación

El canal del proyecto es **`#wg-hls-presentation`** en Slack (lo define
Nicolás; la minuta registra el compromiso de crear un canal dedicado
pero no su nombre). Coordinación por chat con David, con un sync
semanal, y el sync de una hora del 21 de septiembre ya agendado.

## Phases

<!-- La línea de una fase abierta dice para qué está; al cerrar se reescribe
     con lo que la fase terminó siendo (Mode D). -->

- **01-poc-web-hlsjs**: el POC funcional en web, cerrado con los cinco
  layouts del documento de requerimientos andando en una sola corrida de
  punta a punta sobre hls.js **sin modificar**, y con una instancia de
  fábrica al lado sobre la misma playlist mostrando que un cliente de
  mercado sigue funcionando. Dejó parado el escalón más alto de la
  escalera de repliegue, que es el que se graba. Informe en
  `phases/01-poc-web-hlsjs/REPORT.md`.
- **02-sdk-y-controles**: cortar la librería de la aplicación de demo y darle
  a la librería los controles de la composición: una sola barra de progreso de
  todo el contenido con los rangos marcados por color, la pausa, un solo
  control de audio y el fullscreen de la composición. Van juntos porque el
  límite del SDK y la propiedad de los controles son la misma decisión (ADR
  0015), y el corte va primero adentro de la fase. Abierta.
- **03-breaks-multiples-y-repliegue**: un break con varios avisos mezclando
  concurrente y lineal, el repliegue del lado del cliente al lineal
  tradicional del asset, y el `decoderCount` como passthrough hasta el pedido
  del asset-list. Abierta, y no arranca antes de que cierre la 02. Su primera
  task es una medición, porque el aviso lineal en el medio del break es el
  único item que queda capaz de reabrir un ADR de la fase 01.
