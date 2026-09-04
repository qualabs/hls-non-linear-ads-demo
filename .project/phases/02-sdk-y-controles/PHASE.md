---
phase: 02-sdk-y-controles
title: El SDK y sus controles
status: in-progress
started: 2026-09-04
closed: null
---

# Fase 02: el SDK y sus controles

## Objetivo

Cortar la librería de la aplicación de demo, y darle a la librería los
controles de la composición.

Son una sola fase porque **el límite del SDK y la propiedad de los controles
son la misma decisión**, y separarlas significa tomarla dos veces. El
renderizado ya es hoy dueño del elemento que va a fullscreen y de cómo se
presenta el contenido primario: dibuja adentro de `#player` y mueve el
`<video>` primario con un `transform` (`js/renderer.js:191`). Los controles
nativos son parte de ese elemento, así que escalan con la transformación, y
con más de un `<video>` en pantalla controlan un pedazo y no la experiencia.
Entonces los controles no son decoración de la página del integrador: son
parte de lo que el SDK entrega, y su superficie pública no se puede fijar
antes de que existan.

**El corte va primero adentro de la fase**, porque lo que se construya antes
nace del lado equivocado de la línea y hay que mudarlo después. Es lo mismo
que la fase 01 hizo con el ADR 0003: decidir la costura antes de construir y
verificarla con un grep en cada task.

## Alcance

- **El corte.** La librería se lleva `js/signalling.js`, `js/renderer.js`, el
  `attachAsset` que hoy vive en `js/app.js` y los controles. La demo se queda
  con `index.html`, el player de fábrica del par de compatibilidad y
  `js/contract-trace.js`. Distribución por `<script src>`, sin bundler y sin
  dependencias (ADR 0015).
- **El contrato del ADR 0003 promovido a `docs/`**, que es el documento de
  arquitectura del producto que la fase 01 dejó pendiente, y **ampliado** con
  la consulta que la barra necesita: hoy contesta qué está activo en este
  instante, y para pintar los rangos hace falta saber dónde están todos los
  rangos del programa.
- **Los controles propios de la composición**, adentro de la librería: una
  sola barra de progreso de todo el contenido, debajo del área donde se mueven
  los sub-players; los rangos marcados por color; la pausa centrada en la
  composición; un solo control de audio arriba a la derecha; y el fullscreen
  de la composición, con los controles apareciendo al mover el mouse. Los
  controles nativos sobre el contenido primario dejan de estar.
- **El volumen que declara el asset list** (ADR 0014), con la mezcla que David
  propuso como caso de la demo.
- **El skin y el branding de Qualabs**, con el brand kit que ya está
  vendorizado en `brand/`.
- **La documentación del integrador**: qué agregar, qué tiene que tener su
  página, cómo se inicializa.

## Fuera de alcance

- **iOS.** Nicolás lo dejó afuera de estas dos fases. Sigue sin alcance ni
  fecha, y David lo reabrió en la reunión del 2026-09-04 sin que quedara
  contestado.
- **El break con varios avisos, el repliegue y el `decoderCount`.** Son la
  fase 03, y van después porque necesitan el corte hecho.
- **El modelo de detección de capacidades.** Sigue fuera del proyecto.
- **Los ADR 0011 y 0012.** En pausa, esperando a David.
- **El link desplegado para que David dé feedback.** Se resuelve fuera de las
  fases.
- **Un bundler, un framework o una dependencia de npm.** La ausencia de las
  tres es una propiedad deliberada de la fase 01 y esta fase la conserva.

## Decisiones que gobiernan la fase

- **ADR 0015**, el límite del SDK y la propiedad de los controles. Es el ADR
  0003 de esta fase: se decide al principio y se verifica con un grep.
- **ADR 0014**, el volumen que declara el asset list, con el default en
  silencio. Supersede al 0010.
- **ADR 0016**, que la clase concurrente nunca cambia el largo de la línea de
  tiempo. Es lo que sostiene que una sola barra alcance y que no crezca
  cuando entra un break.
- De la fase 01 siguen en pie el **0001** (el render en el DOM sobre el
  video), el **0003** (las dos capas y su contrato) y el **0013** (el llenado
  de la caja).

## Arquitectura del producto

El proyecto todavía no tiene un documento de arquitectura propio, y **esta
fase lo crea**: es el contrato del ADR 0003, hoy en
`phases/01-poc-web-hlsjs/tasks/T-06/t06-contrato.md`, promovido a `docs/`.

El delta que la fase le introduce son dos cosas. La primera es el límite del
ADR 0015, que agrega una segunda costura a la única que el contrato describe.
La segunda es la consulta de los rangos del programa, que es lo único del
contrato que no alcanza para lo que la fase tiene que dibujar.

## Riesgos y mitigaciones

**R1. Un corte que se afirma en lugar de verificarse.** Es el riesgo de
cualquier separación en dos: la línea se dibuja el primer día y se cruza a la
semana sin que nadie lo note. La fase 01 lo resolvió con un grep corrido en
seis tasks.

Mitigación: el mismo método, en la T-01 y repetido en cada task que agregue
código a la librería, más la página del integrador medida en líneas.

**R2. Los controles pelean con el apilado de los layouts.** La capa donde se
dibujan los avisos queda deliberadamente sin `z-index`, para que no sea un
contexto de apilado y el `zDepth` del layout decida quién queda arriba; el
renderizador le pone `position: relative` al primario por la misma razón.
Desde la T-01 esa capa la crea la librería con sus propiedades en línea, así
que el invariante dejó de estar en una hoja de estilos que el integrador
podía pisar. Una barra de
controles adentro del contenedor tiene que quedar arriba de todos los
elementos de todos los layouts, y hay layouts donde el aviso es el fondo y el
primario va encima.

Mitigación: los controles van en su propia capa, con un `z-index` por encima
del máximo `zDepth` que los layouts usan, y sin darle un `z-index` a la capa
de avisos, que es lo que el invariante necesita. La task que los dibuja lo verifica contra el
layout que pone el aviso atrás.

**R3. El fullscreen no existe, y el que hay es del elemento equivocado.** Es
lectura del código y conviene tenerla a la vista antes de planificar: en el
repositorio no hay una sola llamada a `requestFullscreen`. El único camino a
fullscreen hoy es el botón nativo del `<video>` primario, que lleva a
fullscreen ese elemento solo, y la capa de avisos es su hermana, así que el
aviso no se vería. El comentario de `index.html` que dice que el elemento que
va a fullscreen es el contenedor describe una intención, no lo que el código
hace. El defecto conocido —el botón de audio del aviso (`#ad-audio`) está
fuera de `#player` y desaparece en fullscreen— es un síntoma del mismo hueco.
Y hay una consecuencia estructural: si la barra va **debajo** del área de la
composición y tiene que verse en fullscreen, el elemento que va a fullscreen
deja de ser la caja 16:9 de la imagen.

Mitigación: el fullscreen es de la composición y lo pide la librería, y la
task que lo hace se verifica con una captura tomada en fullscreen. No con un
`getComputedStyle`: en este repo ya hubo dos falsos "OK" por medir estilos en
lugar de mirar la imagen.

**R4. La barra se queda con un largo cacheado.** Para la experiencia
concurrente el largo del programa es invariante, así que guardarlo funciona
hasta que la fase 03 mete un interstitial tradicional adentro del break.

Mitigación: el ADR 0016 dice por qué se relee, y el test de la T-06 lleva la
mutación que destapa el cacheo.

**R5. El skin es alcance propio y no salió de la reunión.** Lo más cercano
que dijo David es "make it look a little more Pro", y lo dijo sobre el
marcador de los breaks. Riesgo aceptado: es la decisión de Nicolás y la
dirección elegida. Si el calendario aprieta, el skin es lo primero que se
recorta, y por eso va tarde en el orden de las tasks.

## Timeline

- **21 de septiembre**: sync de una hora con David. La fase apunta a estar
  cerrada antes.
- **28 al 30 de septiembre**: ventana de grabación. El software tiene que
  estar operativo antes.
- **7 de octubre**: presentación en el evento de Apple.

Si el calendario aprieta, el orden de recorte es de abajo hacia arriba: el
corte y el contrato son el piso porque la fase 03 los necesita, los controles
son lo que David pidió en la reunión, y el skin y la documentación son lo que
se puede recortar sin que la demo deje de mostrar lo que muestra.

## Stakeholders

- **Nicolás Levy**: owner. Construye la demo y no la delega.
- **David Hassoun**: presenta en escenario y fija el alcance. Viaja el
  miércoles siguiente a la reunión del 2026-09-04 y vuelve el 21.
- **Emil**: la parte de iOS, fuera de esta fase. Hereda el límite del ADR
  0015, no el código.

## Preguntas abiertas que esta fase no resuelve

- **Si la grabación usa fullscreen.** Si lo que se graba es la página de dos
  panes, nunca. En ese caso el fullscreen de la composición es un requisito de
  calidad del SDK y no de la demo, y eso cambia su prioridad adentro de la
  fase pero no su alcance.
- **iOS**, que David reabrió y quedó sin contestar.
- **Los ADR 0011 y 0012**, que siguen en `proposed` esperando a David.
- **Los assets que faltan.** Están medidos en
  `phases/01-poc-web-hlsjs/tasks/T-12/t12-los-assets-que-faltan.md` y son la
  única cosa del proyecto que depende de alguien de afuera, con esa persona
  viajando. No es trabajo de esta fase y sí es lo que hay que soltar primero.
