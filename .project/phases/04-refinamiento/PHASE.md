---
phase: 04-refinamiento
title: "El refinamiento: una sola diferencia entre los dos players"
status: planning
started: 2026-09-07
closed: null
---

# Fase 04: el refinamiento

**Es la fase 04 y se ejecuta antes que la 03.** El número es más alto porque la
03 ya estaba escrita cuando esta apareció, y renumerarla rompería las
referencias que su `PHASE.md` y su `TASKS.md` ya tienen. El orden no sale del
número: **esto es lo que se graba, y la fase 03 son capacidades nuevas.** La
ventana de grabación es del 28 al 30 de septiembre, y lo que entra en cámara es
el recorrido que ya existe con los dos panes al lado. Si algo no llega, lo que
falta es una capacidad que David pidió; si esto no llega, lo que se graba se
graba con los defectos que Nicolás encontró probándolo.

## Objetivo

Que la demo se pueda mostrar, y que lo que muestre sea una sola cosa.

Los seis puntos de esta fase salieron de Nicolás probando la demo desde el
celular. Ninguno agrega una capacidad: tres son defectos que la hacen incómoda
o inusable, y tres sacan diferencias entre los dos panes que no son el
mecanismo que la demo existe para mostrar.

## El criterio de la fase

**Sacar toda diferencia entre los dos players que no sea el mecanismo que la
demo muestra.**

Hoy difieren en tres cosas a la vez: uno inserta el aviso y el otro lo dibuja
encima, uno tiene nuestro skin y el otro los controles pelados, y uno se atrasa
respecto del otro. Alguien que mira dos panes distintos en tres dimensiones no
sabe cuál de las tres es el punto. Con los seis cambios quedan idénticos en
todo y distintos en una sola cosa: **qué muestran durante el break.**

Este criterio no está acá como declaración de estilo. Está para decidir lo que
los seis puntos no enumeran, y decide bien: un botón que existe en un pane y no
en el otro es una diferencia, una marca que está en una imagen y no en la otra
es una diferencia, y un reloj que en un pane cuenta el programa y en el otro
cuenta el aviso es una diferencia que además puede ser cierta y hay que decidir
qué se hace con ella. Cada vez que aparezca un caso no enumerado, se resuelve
contra esta frase.

**Quién lo verifica: Nicolás, con el recorrido corriendo y los dos panes a la
vista.** No hay una task que lo enumere ni que produzca el cuadro de los dos
panes en el mismo segundo, porque ese artefacto lo arma él y lo arma más rápido
a mano. Lo único que conviene tener escrito para cuando mire es cuáles son las
diferencias legítimas: el color de identidad de cada pane y sus rótulos —el
`--q-slate-400` del de fábrica contra el nuestro, las líneas `role`, `role-sub`
y `role-reads`, la línea de estado y el `data-state` que la hoja de estilos
pinta—, que existen para que alguien mirando una
grabación sin sonido sepa cuál es cuál y qué está haciendo cada uno. Eso es la
página hablando de la página. Cualquier otra cosa es un hallazgo.

## Alcance

Los seis puntos, en el orden en que Nicolás los dijo y no en el que se
ejecutan.

1. **El interstitial del pane sin modificar reemplaza el contenido en lugar de
   insertarlo.** Hoy inserta y retoma donde interrumpió, así que los dos
   players quedan en segundos distintos del programa. Con reemplazo los dos
   muestran el mismo contenido al mismo tiempo y se pueden comparar cuadro a
   cuadro. Es el `X-RESUME-OFFSET` de la playlist (ADR 0017).
2. **La pausa de la composición manda sobre los avisos.** Con la composición
   pausada, un seek que cae adentro de un aviso concurrente de video arranca a
   reproducir ese aviso solo. El estado de la composición tiene que gobernar a
   todos sus elementos, siempre.
3. **La barra pinta sólo lo que ese player reproduce, y sólo sobre el riel.**
   Se va el carril de abajo: el amarillo colgando debajo del riel se lee como
   otro elemento y no como parte de la barra. Cada player marca en su propio
   riel lo suyo (ADR 0018).
4. **El pane sin modificar lleva nuestro skin, y sigue siendo un cliente sin
   modificar.** El skin y los controles tienen que poder usarse **sin la parte
   de concurrentes**: ese pane sigue corriendo hls.js pelado y lo único nuestro
   es el cromo. Con eso hay paridad visual y el argumento de compatibilidad
   queda intacto.
5. **El logo de Qualabs sale de los controles del player.** Queda el del
   encabezado, que es el que se lee de lejos.
6. **Los controles se pueden usar con el dedo.** Hoy aparecen y desaparecen
   casi de inmediato al tocar, así que desde un celular no se pueden usar. Y
   hay que decidir qué gesto los esconde en touch, porque "sacar el mouse" no
   existe.

## Fuera de alcance

- **Todo lo de la fase 03**: el break con varios avisos, el aviso lineal en el
  medio, el repliegue y el `decoderCount`. Esta fase no toca ninguno, y está
  escrita para no dejarle nada roto: la regla de la barra del ADR 0018 está
  redactada sobre el player y no sobre la clase de rango, justamente porque en
  la fase 03 nuestro player empieza a reproducir un aviso lineal adentro del
  break.
- **El layout responsive de la página de la demo.** A 960 px los dos panes se
  apilan (`css/player.css`), y así se ve desde el celular. Ningún punto de esta
  fase pide cambiarlo: el celular es donde Nicolás la prueba, no lo que se
  graba.
- **El fullscreen**, más allá de que los controles sigan funcionando en él. Lo
  que se graba es la página de dos panes.
- **iOS**, y **los ADR 0011 y 0012**, que siguen en pausa esperando a David.
- **El global `Hls` y el borrado del atributo `style`**, las dos cosas de código
  que la fase 02 dejó abiertas. Son de la superficie pública y no de lo que se
  graba, y esta fase no las toca.
- **Un bundler, un framework o una dependencia de npm.** Sigue siendo una
  propiedad deliberada del proyecto.

## Decisiones que gobiernan la fase

- **ADR 0017**, que el pane del cliente de mercado reemplaza el contenido en
  lugar de insertarlo, con el argumento del atraso retirado a propósito.
- **ADR 0018**, que cada barra marca sólo lo que ese player reproduce y lo
  marca sobre su propio riel. Supersede el diseño de dos carriles de la T-04 de
  la fase 02, que vivía en el documento de esa task y que el informe de cierre
  recomendó promover a ADR.
- **ADR 0007**, el par de compatibilidad. Es el que se rompería con la lectura
  equivocada del punto 4, y por eso lleva nota fechada que dice qué cubre "sin
  modificar": la instancia y su configuración, no el cromo de alrededor.
- **ADR 0015**, el límite del SDK y la propiedad de los controles. No se
  contradice y se amplía con nota fechada: los controles funcionan con o sin
  experiencias concurrentes. La misma nota retira la pata del argumento de
  compatibilidad que su nota del 2026-09-04 apoyaba en el atraso de 49,5 s.
- **ADR 0016**, que la clase concurrente nunca cambia el largo de la línea de
  tiempo. Su decisión no cambia; su contexto describe una configuración que la
  demo deja de correr, y lleva nota fechada.
- De la fase 01 siguen en pie el **0001**, el **0002**, el **0003** y el
  **0013**, y ninguno se toca.

## Arquitectura del producto

**El contrato no cambia.** `programRanges()` sigue devolviendo todos los rangos
del programa con su `kind`, y el campo sigue siendo necesario: es lo que le
permite a cada barra pintar el rango que marca en el color que esa clase ya
tiene. Lo que cambia es quién filtra: la barra decide qué marca, y el contrato
sigue diciendo dónde están todos los rangos y de qué clase es cada uno. Sacar
el `kind` del contrato habría sido la forma equivocada de implementar el punto
3, y la fase 03 lo habría tenido que reponer.

**El documento del integrador sí cambia**, y es el único delta de arquitectura
de la fase: hoy la única entrada pública es `attach(hls, { container })`, que
enciende la experiencia concurrente entera —crea la capa de avisos, la
señalización y el renderizado (`lib/concurrent-hls.js:131`)—. El punto 4 pide
que el cromo se pueda usar solo, así que hay una entrada pública más y hay que
escribirla en `docs/integrating-the-library.md`, incluida su tabla de
superficie. En el código la separación ya está casi hecha y conviene tenerlo a
la vista: `createControls` ya acepta `provider = null` y su archivo no nombra ni
a la señalización ni al renderizado, así que lo que falta no es desacoplar sino
publicar.

## La verificación de la fase, y por qué es liviana

**Los seis defectos de esta fase se ven todos.** La pausa que no manda se ve,
los controles que no se pueden tocar se sienten, el logo se ve, la barra se ve,
el reemplazo se ve. Ninguno falla en silencio. Y el revisor es Nicolás mirando
la pantalla, así que construir aparato de verificación acá es gastar en algo que
su ojo ya hace mejor y más rápido.

Es lo contrario de la T-05 de la fase 02, que llevó nivel `alto` con tests y una
campaña de mutación porque un volumen mal resuelto no se ve en una captura y se
descubre en la toma. Esa fase tenía una cosa así. Acá quedan dos que tampoco se
ven, y las dos están más abajo en esta sección, pero ninguna de las dos es
aritmética que un test pueda cubrir: una es un atributo de la playlist y la otra
es una afirmación sobre un pane, y lo que las agarra es una lectura de la página
corriendo. Por eso ninguna task de esta fase pasa de `bajo`.

**Liviano significa no agregar aparato nuevo. No significa dejar de correr lo
que ya existe.** Tres cosas siguen corriendo al final de cada task que las
toque, porque cada una es un comando y las tres protegen mediciones que ya se
pagaron:

- `node scripts/verificar-cortes.mjs`, las dos costuras, donde la task toque
  alguno de los archivos que ese script mira: `lib/renderer.js`,
  `lib/controls.js`, `js/contract-trace.js`, `css/player.css`, cualquier
  `lib/*.js` y `scripts/construir-libreria.sh`.
- `npm test`, los 27 tests que ya están, donde la task toque `lib/`. Y también
  en la T-05, que es la que menos se lo espera: `test/program-ranges-and-volume.test.js`
  parsea la tabla del recorrido y el `PLANNED-DURATION` de
  `scripts/senalizar-contenido.sh`, que es justamente el archivo que esa task
  edita.
- La comparación de la caja que el contrato pide contra la que el navegador
  dibuja, donde la task toque el renderizado o los controles. Dio 0,00 px siete
  veces y es lo único que atrapa un corrimiento que nadie ve.

Lo que se fue: las campañas de mutación, las capturas reducidas a un cuarto como
requisito, y las mediciones nuevas que existían para probar algo en lugar de
para atrapar un defecto. Cada task dice qué le queda y qué se le fue, para que
la ausencia se lea como una decisión y no como un descuido.

**Las dos tasks donde el ojo no es el instrumento**, y las dos lo llevan escrito
en su definición de done. La **T-05**: dos panes desincronizados por un par de
segundos se ven sincronizados, y la fase entera se apoya en que estén en el
mismo segundo, así que lo que lo dice es la lectura del `currentTime` de los dos
elementos y no la pantalla. Y la **T-07**: un pane que parezca sin modificar y
no lo esté se ve exactamente igual de bien, y lo que lo agarra son las tres
lecturas de la página corriendo. Ninguna de las dos lecturas es aparato nuevo y
ninguna se recorta.

## Lo que esta fase le hace al argumento de la fase 01, dicho de frente

El punto 1 mata el segundo argumento de la demo tal como está escrito hoy.

La T-09 y la T-12 de la fase 01 midieron el atraso del cliente de mercado
—49,47 s de programa después de cuatro breaks, a 12,37 s por break, y el quinto
aviso lineal que nunca se completa adentro del recorrido— y el informe de cierre
de esa fase lo presenta como el segundo de los dos argumentos que la demo hace.
El `README.md` tiene un párrafo entero dedicado a él.

**Nicolás lo cambió a propósito, y la razón es la forma de cada argumento.** El
del atraso hay que mirarlo en el tiempo: hay que ver los dos panes un rato,
entender que uno viene retrasado y aceptar que eso importa. El nuevo se ve en un
cuadro solo: al mismo segundo del programa, uno muestra el aviso **encima** del
programa y el otro **en lugar** del programa.

Cómo queda el registro: el informe de la fase 01 no se reescribe, porque es la
prueba de lo que se midió. El retiro se escribe donde alguien lo va a buscar
hoy: en el ADR 0017, en el `PROJECT.md`, y en el párrafo del `README.md` que lo
afirma, que es documento vivo y lo cambia la task que cambia el comportamiento.

## Riesgos y mitigaciones

**R1. La lectura del punto 4 que rompe la demo.** El punto se puede leer de dos
formas y una la rompe: si el pane del otro corre nuestra librería para tener el
skin, deja de ser un cliente sin modificar y el argumento de compatibilidad se
cae, porque el punto es que un cliente de mercado funciona sobre la misma
playlist **sin tocarlo**.

Mitigación: es el mismo mecanismo que la fase 02 usó para el corte. La
separabilidad **se decide al principio** —la T-04, antes de que se toque el pane
del otro— y **se verifica** con tres lecturas de la página corriendo, no con una
afirmación: que la instancia de ese pane se sigue construyendo con cero opciones
(`new Hls()`), que su pestaña de red nunca pide un asset-list concurrente, y que
sigue agendando el Date Range de clase Apple. Las tres tienen instrumentación en
la página desde la fase 01.

**R2. La causa del defecto de móvil puede no ser la que está escrita.** La causa
probable enunciada es que el temporizador de auto-ocultar se renueva con el
movimiento del mouse, que en touch no existe. La lectura del código dice otra
cosa: `container.addEventListener('pointerleave', () => { if (!video.paused)
hide(); })` (`lib/controls.js:615`), y en touch el puntero deja de existir cuando
el dedo se levanta, así que `pointerleave` dispara inmediatamente después del
`pointerup` y esconde los controles en cada toque. Eso explica "aparecen y
desaparecen casi de inmediato" mejor que un temporizador de 2600 ms, que se
vería como un ocultamiento lento. Las dos causas no son excluyentes.

Mitigación: la task mide antes de cambiar y juzga por el síntoma y no por la
hipótesis. Y la verificación es en un celular o en emulación de touch de verdad:
en este repositorio ya hubo dos falsos "OK" por medir estilos computados en
lugar de mirar la pantalla.

**R3. Nadie midió qué lee el elemento del pane de fábrica durante un aviso, y de
eso depende su barra.** Los controles leen `currentTime`, `duration`, `paused` y
`muted` del elemento que reproduce el contenido primario. En ese pane, durante
un interstitial, hls.js pasa el MediaSource del primario al asset y de vuelta, y
`js/stock-player.js` ya lo dice en una línea: el tiempo que reporta un cliente de
mercado durante un aviso de reemplazo es el del aviso y no el del programa. O sea
que esa barra puede mostrar el reloj del aviso durante el break.

Mitigación: la T-07 lo mide antes de decidir qué muestra esa barra, y lo que
muestre tiene que ser cierto, porque la barra es el instrumento sobre el que se
apoya la comparación cuadro a cuadro. Que sea un defecto o que sea exactamente
la verdad de lo que significa reemplazar es la decisión de esa task.

**R4. El calendario, y esta fase se lo come a la 03.** El sync con David es el
21 de septiembre, la ventana de grabación del 28 al 30, y la fase 03 tiene
adentro lo que David marcó como lo más importante del día. Cada día de esta
fase es un día que la 03 no tiene.

Mitigación: los tres defectos van primero porque son chicos y dejan la demo
usable desde donde Nicolás la está probando. Si el calendario aprieta, el orden
de recorte es de abajo hacia arriba: el pane del otro con nuestro cromo (T-07)
es lo más caro y lo que se recorta primero, al costo de quedarse sin paridad
visual; el reemplazo del punto 1 y los tres defectos no se recortan, porque son
lo que se ve en cámara.

**R5. El argumento retirado no tiene reemplazo medido todavía.** El del atraso
se midió en dos tasks y está escrito en un informe cerrado. El nuevo —que al
mismo segundo uno muestra el aviso encima y el otro en lugar del programa— no
existe como artefacto: nunca se produjo un cuadro de los dos panes en el mismo
segundo del programa, porque hasta hoy no podían estar en el mismo segundo.

Mitigación: el cuadro lo arma Nicolás, y lo que la fase le deja lista es la
condición que lo hace posible. Después de la T-05 los dos panes están en el
mismo segundo del programa, y la lectura del `currentTime` de los dos elementos
que esa task pide es lo que dice que el cuadro se puede tomar. Hasta que el
cuadro exista, el retiro es una apuesta.

## Timeline

- **21 de septiembre**: sync de una hora con David. Esta fase apunta a estar
  cerrada antes, porque lo que se le muestra ese día es esto.
- **28 al 30 de septiembre**: ventana de grabación. Es la fecha real.
- **7 de octubre**: presentación en el evento de Apple.

## Stakeholders

- **Nicolás Levy**: owner, y la fuente de los seis puntos. Los encontró probando
  la demo desde el celular.
- **David Hassoun**: presenta en escenario. No vio ni el skin ni la marca, y no
  pidió ninguno de los seis puntos. El punto 1 cambia el argumento que él
  presenta, así que es de las cosas que conviene contarle antes del 21 y no
  después.
- **Emil**: la parte de iOS, fuera de esta fase. Hereda el límite del ADR 0015
  con su ampliación: los controles funcionan con o sin experiencias
  concurrentes.

## Preguntas abiertas que esta fase no resuelve

- **Si el pane de fábrica conserva autoridad además de apariencia.** Nuestro
  cromo trae controles que actúan sobre el elemento: pausan, silencian y
  seekean. Ese pane hoy está muteado a propósito y nadie lo maneja. La T-07
  decide cuáles de los cuatro controles actúan ahí, y las dos consideraciones
  tiran para lados distintos: un control que está y no hace nada es una
  diferencia propia, y dos panes audibles a la vez es peor en cámara.
- **Si la marca tiene que volver a la imagen.** Con el punto 5 no queda ninguna
  marca adentro del cuadro, y en fullscreen no hay encabezado. Hoy no cuesta
  nada porque lo que se graba es la página de dos panes; el día que se grabe
  fullscreen, vuelve.
- **La confirmación de David sobre la mezcla del Quad y la dirección del skin**,
  que la fase 02 le devolvió y sigue sin contestar.
- **Los assets que faltan** y **la fecha del primer draft**, que siguen abiertos
  de antes y esta fase no toca.
