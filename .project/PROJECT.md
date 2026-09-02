---
name: Demo de publicidad no lineal en HLS (HLS Interest Day)
slug: hls-non-linear-ads-demo
description: >
  Construir la demo de publicidad no lineal en HLS que el chair del WG
  presenta en el evento de la industria del 7 de octubre de 2026 (el "HLS
  Interest Day"). La demo se muestra grabada, pero el software tiene
  que funcionar de verdad: el chair del WG descartó explícitamente el
  compositing de video. El líder del proyecto construye la demo y no la delega,
  trae al colaborador externo para la parte de iOS, y apunta primero a hls.js como
  camino crítico. Alcance, fechas y reparto salieron de la reunión
  del 2026-09-02 con el chair del WG.
status: ongoing
type: desarrollo
owner: qualabs
started: 2026-09-02
last_update: 2026-09-02
tags: [hls, hls-interstitials, non-linear-ads, svta, apple, hlsjs, avfoundation, demo]
repo: https://github.com/qualabs/hls-non-linear-ads-demo
output_pointers:
  - kind: external-repo
    label: código de la demo (privado, org qualabs)
    url: https://github.com/qualabs/hls-non-linear-ads-demo
  - kind: drive-doc
    label: minuta de la reunión de alcance con el chair del WG (2026-09-02)
    url: https://docs.google.com/document/d/1ZSrYPeRoNzypDRCLoenWpISu17M9PJ3erWQFkfaPL7U
related_processes: []
related_wgs: [svta-ads]
---

# Demo de publicidad no lineal en HLS (HLS Interest Day)

Toda la información de este documento sale de la minuta de la reunión
del 2026-09-02 entre el chair del WG y el líder del proyecto, salvo donde se
indique otra fuente. La minuta está en
`processes/cto-minutes/data/meetings-index.json` como
`tactiq-2026-09-02-001`, y el Doc completo es
`1ZSrYPeRoNzypDRCLoenWpISu17M9PJ3erWQFkfaPL7U`.

El nombre "HLS Interest Day" lo aporta el líder del proyecto. La minuta se refiere al
evento como "el evento de la industria del 7 de octubre".

## Lo primero: la fecha real del proyecto es la grabación, no la presentación

La presentación es el 7 de octubre, pero el software tiene que estar
terminado **entre el 28 y el 30 de septiembre**, que es la ventana de
grabación. En el escenario se muestran grabaciones y no una corrida en
vivo, y esa decisión suena a reducción de riesgo hasta que se la lee
junto con la otra: el chair del WG dijo "I don't want it smoke in mirrors" y
descartó explícitamente el compositing de video que mostrara cómo se
vería la cosa. Las dos frases juntas son más exigentes que cada una por
separado, porque dicen que el software tiene que estar operativo antes
de grabar y no antes de presentar. El proyecto tiene entonces una
semana menos de la que aparenta.

El hito duro del medio es el **lunes 21 de septiembre**: primer draft de
las demos andando, más un sync de una hora con el chair del WG para revisar el
estado completo. Es el día en que el chair del WG vuelve de Europa, y es el punto
donde se sabe si el plan aguanta.

## El riesgo número uno: hls.js contra AVFoundation

El camino crítico elegido es hls.js, y la elección se tomó sobre
información que ninguno de los dos tiene todavía.

El líder del proyecto eligió hls.js por experiencia previa, con el argumento de que si
no sale lo que debería ser más fácil, el proyecto está en problemas, y
dejó la reserva explícita de cambiar si aparece información nueva.
El chair del WG también prefiere hls.js, porque permite mostrar la pestaña de red
del browser durante la demo.

La contra-indicación no está resuelta. Al chair del WG le dijo el revisor de la spec de HLS que hay
implementaciones públicas en Swift que no existen en hls.js, algo
alrededor de reemplazar una clase y de cómo eso funciona con el
DATERANGE, y que eso haría el trabajo bastante más fácil en
AVFoundation. También le dijo que el trabajo en hls.js que mejoraría
esto está planificado pero **no hecho**, así que hoy la vía posible es
parchear o modificar hls.js en lugar de hacer una implementación limpia.
El chair del WG no tiene los detalles porque creía tener grabada esa conversación
y no la tenía, y durante la reunión mandó un email al revisor de la spec de HLS con
El líder del proyecto en copia para recuperarlos.

Lo que esto significa en concreto: **dos semanas de trabajo pueden ir a
la plataforma equivocada y descubrirse en el sync del 21 de
septiembre**, cuando ya no queda margen antes de la grabación. Es el
riesgo que decide la fase 01, y su mitigación está en el `PHASE.md` de
esa fase.

La decisión de plataforma está registrada como ADR
`decisions/0001-hls-js-camino-critico.md`. Si la información que el chair del WG
recupera la contradice, se escribe un ADR nuevo que la supersede.

## Objetivo y motivación

El objetivo es tener funcionando, grabada y presentable, una demo de
publicidad no lineal en HLS: un player que use la clase custom para
cargar el asset list y que resuelva el renderizado del layout del
interstitial con un layout controller, mostrando varios de los layouts
principales y no uno solo.

La motivación tiene tres partes que la minuta deja explícitas. La
primera es que el interés de la industria en publicidad no lineal está
creciendo y la idea gustó donde se presentó. La segunda es que el
branding de Qualabs es parte del entregable y no un adorno: el chair del WG se
aseguró de que exista un namespace propio y dijo que si Qualabs hace el
trabajo, se va a destacar, aparejado con el de SVTA porque el trabajo se
hace con ellos. La tercera es que la demo es lo que después empuja la
especificación de SVTA, que es el tercer frente de este trabajo.

## Alcance

### Must-have

Es la lista que el chair del WG recorrió en la reunión como el mínimo.

- Una plataforma funcionando, con el player usando la clase custom para
  cargar el asset list.
- El renderizado del layout del interstitial resuelto por un **layout
  controller**.
- Ejemplos de los layouts principales, no uno solo (ver la lista abajo).
- Como opción dentro de la demo, poder mostrar junto al player el
  DATERANGE que viene o el manifest completo resaltado, más el asset
  list ya cargado. En web se resuelve con las herramientas de red del
  browser; en iOS habría que exponerlo dentro de la propia app, por
  ejemplo en un iPad. El chair del WG lo nombró como opción deseable dentro del
  must-have, no como stretch.

### Stretch

Los stretch goals que el chair del WG nombró, en sus palabras.

- Las dos plataformas, web y iOS.
- Controles e indicador para el ad no lineal.
- Detección de si el device soporta múltiples decoders, para pasar esa
  capability al servicio de interstitials, sea en el request o
  reflejada en el asset list.

### Fuera de alcance

- El deck y la presentación, que son del chair del WG (trabaja el deck con
  Una persona del equipo del evento).
- El scheduling de DATERANGE, que es otro de los focos grandes del
  evento y que el anfitrión del evento va a presentar. Al chair del WG le gustaría mostrar en la
  discusión cómo se conecta con este trabajo si hay tiempo, pero quedó
  como deseable y sin owner.

## Los seis layouts

El chair del WG nombró seis. El L-box con video es, según él, el más difícil de
conseguir en assets.

1. Overlay.
2. L-box con video.
3. L-box con imagen.
4. Side-by-side.
5. "Pullback" [?]. El nombre exacto queda a confirmar con el chair del WG: la
   minuta lo marca como término dudoso del transcript.
6. Uno más editorial. La minuta no lo describe más allá de eso.

El reparto de estos seis entre el primer draft del 21 de septiembre y la
grabación del 28 al 30 no está definido en la minuta, y queda como
pregunta a cerrar en el sync del 21.

## Assets

Hay material y los dos coincidieron en que conseguirlo no debería ser
difícil.

- El listado de assets abiertos de SVTA, que el chair del WG tiene consolidado en
  una planilla propia porque el sitio oficial es incómodo de usar.
  Incluye varios de los que usan normalmente los distribuidores de TV,
  que son visualmente atractivos. El chair del WG quedó en compartirlo.
- Material del IAB.
- Assets del anfitrión del evento, que el chair del WG cree que se pueden conseguir. Nadie tomó
  esa gestión en la reunión.
- Imágenes generadas con IA para los L-box.
- Un dataset público de YouTube que viene usando el líder del proyecto, con la
  advertencia de que es contenido generado por usuarios y se nota.

**Big Buck Bunny queda descartado**, por pedido del líder del proyecto: su sola
aparición transmite que lo que se está mirando es una prueba de
concepto.

## Namespace y branding

Mientras SVTA no publique la especificación, la demo usa un namespace
propio de Qualabs para la clase custom. La forma que aparece en la
minuta es `com.qualabs.hls-concurrent-interstitial` [?], marcada como a
confirmar porque el transcript devuelve una variante deformada
("com.callabs.hls concurrent interstitial").

El branding de Qualabs se muestra junto al de SVTA. El chair del WG se aseguró de
que el namespace propio existiera y fue explícito en que el logo de
Qualabs va a estar ahí.

## Reparto y compromisos

El reparto quedó fijado en un intercambio puntual: el chair del WG preguntó si la
demo la iba a hacer el líder del proyecto o si había que meter a otra persona del equipo, mencionando
también a otra persona del equipo, y el líder del proyecto la tomó para sí. La demo no está
delegada, y si más adelante hay que moverla a otra persona hay que
reabrir esa conversación explícitamente, porque quedó zanjada por un
compromiso personal y no por una asignación de equipo.

- **El líder del proyecto** construye la demo. Además: hablar con el colaborador externo para la
  parte de iOS, volcar los requerimientos de la demo en el documento de
  El chair del WG, levantar el proyecto de GitHub con el plan, crear un canal
  dedicado para este trabajo, y ayudar con la actualización de la
  especificación de SVTA (prioridad baja, y quién hace el primer pase
  quedó abierto).
- **El chair del WG** hace la presentación y el deck, trabajando con
  Una persona del equipo del evento y siguiendo el proceso por etapas que pide el anfitrión del evento: outline,
  outline slides, script por slide, slides de alta fidelidad. Además:
  recuperar los detalles técnicos de AVFoundation contra hls.js y
  compartirlos, agregar el timeline al documento (hecho durante la
  reunión), actualizar la especificación de SVTA y mandarla al grupo de
  DASH para feedback, ver si un participante del WG puede ayudar con esa
  actualización, compartir el listado de assets abiertos de SVTA,
  volver a pedir que cancelen la serie de calendario del Advertising
  WG, y confirmar si va al evento del día siguiente al de Apple.
- **El colaborador externo** entra por la parte de iOS. El líder del proyecto dijo que le habla
  directamente. La minuta no registra alcance ni fechas para él.
- La **especificación de SVTA** se retoma entre los dos cuando la demo
  esté encaminada. Es el tercer frente y el de menor prioridad según
  El chair del WG, aunque tiene la misma fecha límite que el más alto.

## Timeline

| Fecha | Hito |
| --- | --- |
| 2026-09-21 (lunes) | Primer draft de las demos andando, más un sync de una hora con el chair del WG para revisar el estado completo. El chair del WG lo agendó a las 7:00 de su hora. Es el día en que vuelve de Europa. |
| 2026-09-28 a 2026-09-30 | Grabación final de las demos. Es la fecha real del proyecto. |
| 2026-10-05 (lunes) | Test run que pide el anfitrión del evento. La minuta anota que el transcript dice "Monday" y que la fecha sale del calendario. |
| 2026-10-06 (martes) | Dress rehearsal. Misma nota de fuente que el test run. |
| 2026-10-07 (miércoles) | Presentación en el evento de la industria, y especificación de SVTA actualizada con todas las decisiones tomadas. |

El chair del WG está fuera por IBC y unos días más, y vuelve el 21 de septiembre.
Dejó dicho que igual está disponible durante IBC y la semana siguiente,
y que el líder del proyecto lo pinguee si necesita algo. El modo de trabajo acordado
hasta el 21 es coordinación por chat con un sync semanal.

## Los dos problemas abiertos que el chair del WG va a marcar en escenario

El chair del WG fue explícito en que parte del valor de la presentación es nombrar
lo que todavía no está resuelto, y señaló dos puntos sobre los que
piensa insistir. No son problemas a resolver en este proyecto, pero
condicionan qué muestra la demo.

1. **Cómo se detecta que un device puede hacer esto, y cómo se entera el
   interstitial service.** Es lo mismo que planteó el revisor de la spec de HLS, y el chair del WG lo
   describe como un foco de interés de todos. Aparece también como
   stretch goal de la demo.
2. **Qué hacer cuando el ad break no se puede llenar con un ad no
   lineal**, es decir si se cae el break entero o no.

## Requerimientos de alto nivel: falta el documento

**No hay requerimientos de alto nivel volcados acá, porque el documento
que los tiene no es accesible.** Está en una tab de un Google Doc que
El líder del proyecto mencionó, y devuelve 404 tanto desde el CLI como desde el
connector, con todas las cuentas disponibles.

Este es el lugar declarado para esos requerimientos. Queda vacío a
propósito: no se dedujeron ni se completaron con supuestos. Se llena
cuando se resuelva el acceso, que es parte de la task T-07 de la fase
01.

Lo que sí está registrado de ese documento, por lo que se habló en la
reunión, es que el chair del WG lo armó para la gente del evento explicando qué
están haciendo, qué quieren lograr y cómo planean hacerlo, que lo
compartió en pantalla, que ya agregó el timeline y las fechas, y que
El líder del proyecto quedó en volcar ahí los requerimientos de la demo para poder
planificar contra ese target.

## Riesgos que cruzan fases

El riesgo de plataforma está arriba, y su mitigación está en el
`PHASE.md` de la fase 01 porque es lo que esa fase resuelve. Los que
siguen cruzan todo el proyecto.

- **La fecha percibida no es la fecha real.** Cualquier planificación
  que apunte al 7 de octubre en lugar del 28 de septiembre llega una
  semana tarde. Mitigación: el timeline de arriba y el hito del 21 de
  septiembre son las fechas de trabajo; el 7 de octubre no se usa como
  fecha de ingeniería.
- **Los assets del L-box con video.** Es el layout más difícil de
  conseguir en material, según el chair del WG. Mitigación: entra temprano en el
  relevamiento de assets, para que la falta se descubra con tiempo de
  buscar alternativas.
- **La especificación de SVTA es el frente que se cae solo.** el chair del WG
  dijo que de los tres es el menos importante y lo puso al final, pero
  la quiere actualizada para el día de la presentación. Ya nombró las
  dos salidas que tiene pensadas, que son que el líder del proyecto haga un primer
  pase o que un participante del WG ayude. Mitigación: decidir cuál de las dos se usa
  antes de que la presión de la fecha decida sola. Sin owner asignado
  todavía.
- **La demo está atada a un compromiso personal.** No está delegada, y
  moverla requiere reabrir la conversación con el chair del WG. Riesgo aceptado
  explícitamente: es la condición bajo la que se tomó el trabajo.

## A confirmar

Cosas que la minuta trae marcadas como dudosas y que no se resolvieron
a ojo.

- **El revisor de la spec de HLS**: del lado del anfitrión del evento que le dio al chair del WG el
  feedback sobre el diseño y la comparación con AVFoundation. El
  transcript la devuelve también con otras grafías; por contexto es la
  misma persona. Nombre exacto sin confirmar.
- **`com.qualabs.hls-concurrent-interstitial` [?]**: forma exacta del
  namespace propio.
- **"Pullback" [?]**: nombre del quinto layout.
- **Una persona del equipo del evento**: la persona con la que el chair del WG trabaja el deck.
- El reparto de los seis layouts entre el primer draft y la grabación.
- Quién hace el primer pase de la especificación de SVTA.

## Coordinación

El canal del proyecto es **`#wg-hls-presentation`** en Slack (lo define
El líder del proyecto; la minuta registra el compromiso de crear un canal dedicado
pero no su nombre). Coordinación por chat con el chair del WG, con un sync
semanal, y el sync de una hora del 21 de septiembre ya agendado.

## Phases

<!-- La línea de cada fase se escribe cuando esa fase cierra (Mode D). -->
