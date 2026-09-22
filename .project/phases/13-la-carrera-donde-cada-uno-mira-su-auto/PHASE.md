---
phase: 13-la-carrera-donde-cada-uno-mira-su-auto
title: "La carrera donde cada uno mira su auto: el contenido que el multi view estaba esperando"
status: closed
started: 2026-09-12
closed: 2026-09-21
---

# Fase 13: la carrera donde cada uno mira su auto

La fase 11 construyó el mecanismo del multi view y lo mostró con cinco tramos de tres
películas de Blender, que es material que ya estaba en disco. Esta fase le pone el caso de
uso por el que el mecanismo existe —una carrera, seis cámaras, quien mira elige el auto
que le importa— y ese caso de uso hay que producirlo entero.

**Por eso esta fase no es una fase de software: es una producción de video con una
señalización alrededor.** El diseño y sus descartes están en `DESIGN.md`; lo que sigue es
el contrato.

## Objetivo

Que exista `demo/race-multiview/`: una carrera de 112 s con dos relatores, cuyo programa
va cortando entre los autos, y en la que a los 28 s los relatores anuncian que se
habilitaron las cámaras justo cuando la señalización abre una ventana de 64 s con un
catálogo de **seis** feeds. Quien mira sube hasta tres al lado del programa, las cambia,
agranda una y escucha ese auto, y sale.

Y que la demo quede **publicada**, porque con los videos publicados la fase de iOS no
tiene que generar nada.

## Las tres compuertas, que son el contrato y no una nota al pie

**El gasto de esta fase es de dos dígitos altos en un proyecto que hasta hoy gastó
US$5,44 en total.** Por eso no se genera todo de una vez. La fase avanza en tres etapas y
**cada una termina en que Nicolás mira el resultado y decide si se sigue**, que es la
instrucción textual: *"comencemos por partes y voy validando los videos… si no me gusta
cómo va quedando el resultado al menos no gastamos tanto antes de desechar el trabajo"*.

| etapa | qué produce | generaciones (esperadas / techo) | US$ (esperado / techo) |
| --- | --- | ---: | ---: |
| **1. El programa** | `programa.mp4`, 112 s, con los dos relatores | 23 / **37** | 18,40 / **30,00** |
| **2. Una cámara** | la demo corriendo con un catálogo de una vista | 12 / **16** | 9,60 / **12,80** |
| **3. Las cinco restantes** | la demo completa, publicada | 60 / **72** | 48,00 / **57,60** |
| | **la fase entera** | **95 / 116** | **76,00 / 92,80** |

**El techo de la etapa 1 lo levantó Nicolás dos veces y el de la tabla es el vigente.**
Arrancó en **US$22,40** (28 generaciones). El 2026-09-14, después de mirar las catorce
casillas del programa y pedir que se regeneraran las que no servían, lo subió a **US$26,00**
para pagar la segunda regeneración, y más tarde ese mismo día a **US$30,00** para regenerar la
casilla 10, que era la única que quedaba inutilizable. Los dos aumentos están escritos en los
informes de gasto de esas dos regeneraciones —[`tasks/T-03-el-programa/regeneracion-de-cuatro-casillas/el-gasto.md`](tasks/T-03-el-programa/regeneracion-de-cuatro-casillas/el-gasto.md)
y [`tasks/T-03-el-programa/la-casilla-diez-sin-la-marca/el-gasto.md`](tasks/T-03-el-programa/la-casilla-diez-sin-la-marca/el-gasto.md)—
y el generador hizo cumplir el techo nuevo igual que el viejo, contando líneas de su registro.
La etapa 1 cerró en **US$26,40 / 33 generaciones**, por debajo del techo vigente. Las 37
generaciones de la tabla son lo que US$30,00 compra a US$0,80 cada una.

**El techo de la fase entera no se movió con ese aumento y sigue siendo el declarado:
US$92,80 / 116 generaciones**, así que la última fila dejó de ser la suma de las tres de
arriba, a propósito. La fase cerró en **US$74,40 / 93 generaciones**.

De esa tabla salen los dos números que la decisión de Nicolás necesita, y por eso están
escritos y no estimados:

- **Lo máximo que se puede gastar antes de que él vea algo son US$30,00** (US$22,40 cuando la
  fase arrancó).
- **Lo máximo antes de que apruebe cómo se ve una cámara son US$42,80** (US$35,20 cuando la
  fase arrancó).

**El techo no es una esperanza, es un corte por task.** Pasado el techo de su etapa, la
task **para y reporta con lo que tenga** en lugar de seguir generando. Una estimación sin
un corte escrito es una estimación que nadie va a poder invocar el día que se pase.

**Una compuerta no se cruza sola.** Terminada una etapa, la fase queda esperando: no se
dispara una sola generación de la etapa siguiente hasta que la respuesta llegó. Si no
llega, eso no es un bloqueo de la fase, es la fase haciendo lo que se le pidió.

### El sondeo de la etapa 1, que es una compuerta más chica y de otro dueño

Adentro de la etapa 1, **antes de los catorce clips del programa van dos clips de
sondeo**, mirados contra el brief. Cuesta **US$1,60** y existe para no gastar catorce
generaciones sobre un prompt equivocado: el párrafo del mundo y la ficha de los autos
llegan a ese punto escritos pero nunca probados, y probarlos vale dos clips.

No es una compuerta de Nicolás y no lo espera a él. Es del que coordina, y sale de sus
palabras: *"es para no gastar catorce generaciones en un prompt equivocado"*.

### La etapa 1 se entrega con el relato puesto, y es una decisión

Podría entregarse muda —el relato cuesta dos centavos pero depende del montaje, así que si
el montaje se descarta el relato se rehace— y aun así **se entrega con las dos voces
puestas**, por dos razones.

**La primera es que un montaje mudo no es lo que hay que juzgar.** El programa son catorce
cortes de ocho segundos entre autos distintos; sin una voz que los hile, eso no se lee como
una transmisión de carrera sino como un reel. Una compuerta que muestra el artefacto
equivocado da la respuesta equivocada, y de las dos equivocaciones posibles la cara es
rechazar un montaje bueno porque suena a reel: eso no cuesta media jornada, cuesta la demo.

**La segunda es que el anuncio es la propiedad que la fase existe para demostrar.** La
línea que dice que las cámaras están disponibles tiene que caer exactamente donde la
señalización abre la ventana, y eso obliga a que el clip que está en pantalla en el
segundo 28 **admita** ese anuncio: si ahí hay un choque o una entrada a boxes, la línea no
tiene dónde caer y el montaje hay que rehacerlo igual. Una etapa 1 sin relato valida un
programa que todavía no se sabe si sirve.

**Y lo que se rehace si el montaje se descarta es menos de lo que parece.** La estructura
del guion —el reparto de voces, dónde va cada línea, el anclaje del anuncio, los prompts de
estilo— sobrevive entera; lo único que se reescribe son las frases que nombran lo que está
en pantalla.

### La cámara de la etapa 2 es la de a bordo del auto que va adelante

Se elige una sola y tiene que representar a las otras cinco, así que se elige **la más
difícil y no la más segura**. Una cámara de a bordo y una de seguimiento no prueban lo
mismo, y el criterio es cuál de las dos, si sale bien, permite deducir más sobre la otra:

- **Es la clase de toma más difícil.** En una toma de a bordo el auto casi no está en
  cuadro: se ve el morro, el arco de seguridad y la pista. **Es el caso más débil para
  identificar al auto por su color**, y la identificación es lo único que hace que una fila
  del selector signifique algo.
- **Es la única que prueba que la cámara y el programa son la misma carrera.** El auto que
  va adelante es el que más aparece en el programa, así que es el único feed donde se puede
  cruzar lo que muestra la cámara contra lo que muestra el programa. En una de seguimiento
  esa comprobación es trivial porque el auto se ve entero.
- **Es donde vive el beat de audio.** Agrandar una cámara de a bordo calla la transmisión y
  deja a quien mira adentro de ese auto (ADR 0014 y 0026). Es el pago que esta demo tiene y
  las otras no.
- **Es la corrida más larga de una misma cosa**: ocho clips de la misma cabina, que es
  donde primero aparece que seis generaciones del mismo auto se van separando.

Si la de a bordo aguanta, una de seguimiento —donde el auto se ve entero y los cortes son
los del realizador— es el caso más fácil. Al revés no vale.

### Qué queda si se aborta, y en cuál de las dos compuertas

Va escrito acá porque un aborto que deja el árbol a medias convierte un descarte barato en
una limpieza cara.

**La regla, una sola: `demo/race-multiview/` existe en el árbol sólo cuando corre de punta
a punta.** Hasta que la etapa 3 cierra, la carpeta se construye pero no es entregable, y un
aborto la saca. Con eso `main` nunca carga una cuarta demo que no anda.

**Abortando en la compuerta 1** —la carrera generada no convence—:

- **Se saca del árbol** `demo/race-multiview/` entera. No llegó a existir nada más: la
  cadena, la señalización y la página se construyen recién en la etapa 2, justamente para
  que un descarte acá no se lleve puesto trabajo que nadie miró.
- **Sobrevive versionado**, en `.project/phases/13-…/tasks/`: el párrafo del mundo, la
  ficha y el prompt de los seis autos, las seis imágenes, el plan de catorce tomas, el
  guion de los relatores con sus tiempos, el registro de corrida con los dólares exactos, y
  **la razón por la que se rechazó**. Eso es lo que hace barato un segundo intento.
- **Sobrevive en disco y NO se borra**: `content/.fuentes/` con los clips crudos. Son hasta
  US$22 de material y el reflejo de limpiar es lo único que los pone en riesgo. Las láminas
  de contacto y las mediciones van a `research/`, que es donde este proyecto las guarda.
- La fase cierra con `status: abandoned` y un `REPORT.md` que dice qué se generó, qué
  costó y qué se vio. **El informe de una fase abortada es su entregable**, no un trámite.

**Abortando en la compuerta 2** —el programa estaba bien, la cámara no—: lo mismo, más el
programa terminado, que queda en `.fuentes/` con su receta. **La carpeta de la demo se saca
igual**, y conviene decir por qué en vez de dejarlo a criterio: una demo con el programa y
sin oferta corre y no demuestra nada de lo que este proyecto tiene para mostrar, y sentada
en `demo/` parecería una cuarta demo. Lo que la etapa 3 y la fase de iOS necesitan de ahí
—el video y la receta— está en `.fuentes/` y en la carpeta de la fase.

## Alcance

1. **El contenido generado**: hasta 62 clips de 8 s con `veo-3.1-fast-generate-001` a
   720p —14 para el programa y 8 por cada una de las seis cámaras— más seis fichas de auto
   generadas con `agy`, que sí van al repositorio porque son livianas. Repartidos en las
   tres etapas de arriba.
2. **El audio**: los dos relatores con `gemini-2.5-flash-tts` en `en-GB`, el ambiente que
   Veo ya trae dirigido por prompt, y la mezcla.
3. **La cadena**: `race.json`, `preparar-contenido.sh`, el empaquetador copiado del de
   `hydration-break`, y el empaquetado a HLS a 1280×720 y **24 fps** (ADR 0059).
4. **La señalización**: `senalizar-contenido.sh` con una sola ventana de multi view, y el
   asset-list en la forma del ADR 0064, sin tocarle un campo.
5. **La página**, con su apertura, su player y dos secciones de scroll.
6. **La publicación** en su bucket propio de GCS, por el camino que el `CLAUDE.md` de la
   raíz ya documenta.

## El criterio de la fase

**Nada de lo que ya funciona se rompe, y eso se prueba y no se promete.** Es el criterio
que la fase 11 fijó y acá es más barato de cumplir que nunca, porque esta fase **no toca
`lib/`**: lo que hay que demostrar es que no la tocó.

La línea de base está medida sobre el árbol de trabajo de hoy, que es el commit `1767254`
**más un cambio sin commitear**:

| chequeo | comando | línea de base 2026-09-12 |
| --- | --- | --- |
| la suite | `npm test` | **184 pruebas, 184 pasan, 0 fallan** |
| las dos costuras | `npm run check` | **verde, y sale 0**: la primera reporta 3 ocurrencias, las tres en la lista aceptada; la segunda, cero hits |
| la campaña de la demo grabada | `npm run mutaciones` | la toma la T-01 |

**La costura está verde por un cambio que todavía no está commiteado, y decirlo es la
mitad del valor de la tabla.** El comentario de `lib/renderer.js:401` nombraba el
transporte y ponía roja la primera costura; está reescrito en el árbol —*"these two strings
arrive as JSON"*— sin ampliar la lista de aceptadas, y se lo vio rojo de nuevo volviéndole
a poner el término. Pero `git status` lo sigue mostrando como modificado: **quien haga
`checkout` de `1767254` limpio va a ver la costura roja y va a pensar que la rompió esta
fase.** La T-01 vuelve a medir sobre el árbol que tenga y anota cuál es.

**El número de la suite no se compara contra el de esta tabla.** Es el del día en que se
abrió la fase; lo que cada task compara es contra el conteo con el que esa task arrancó.

## Los archivos que esta fase toca, y por qué la lista está acá

Todo lo que se escribe es **nuevo y vive adentro de `demo/race-multiview/`**. Ninguna task
edita un archivo que ya existe, y eso es una propiedad del diseño y no una casualidad: el
mecanismo está construido y verificado desde la fase 11, así que una demo nueva es una
carpeta nueva.

**Y no toca `lib/`.** Si aparece algo que sí obligue a entrar a la librería, **es una
dependencia y se reporta**: se para, se escribe qué hace falta y por qué, y no se entra.
Ya se miró dónde podría aparecer y está en el riesgo R5.

Tampoco toca `demo/hydration-break/`, `demo/multiview-offer/`, `demo/compatibility-pair/`,
los dos documentos de `docs/`, `run.sh`, `server.mjs` ni `package.json`. `run.sh` no
necesita cambio: toma el nombre de la demo como argumento y usa su carpeta como raíz de
documentos.

## La verificación de la fase, y qué mide cada cosa

**Un chequeo que no puede fallar no es un chequeo**, y en una fase de contenido el riesgo
es que todo se verifique mirando. Tres cosas de acá sí son medibles, y las tres llevan su
control escrito en la task:

- **El anuncio contra la ventana** (T-04). Se asserta que el fin hablado de la línea del
  anuncio cae en `[ofertaEn − 0,5 ; ofertaEn]`. El control: la misma comprobación sobre
  una copia con la línea corrida 3 s tiene que ponerse roja. Sin eso el chequeo aprueba
  cualquier cosa, y "cerca" es exactamente lo que Nicolás pidió que no pasara.
- **El portón de transcripción** (T-03 y T-04). Ninguna pieza de audio entra a la mezcla
  sin que una transcripción diga qué dijo, porque las dos fallas del sintetizador —leer el
  prompt en voz alta, repetir una frase— son invisibles en el archivo y en su duración. El
  control: una línea plantada con el prompt adentro tiene que ser rechazada.
- **Los largos contra la ventana** (T-06). Cada feed dura exactamente lo que la ventana, y
  eso se mide sumando los `#EXTINF` de su playlist y no confiando en el `-t` del ffmpeg. El
  control: una playlist recortada a mano tiene que dar rojo.

**Lo que no es medible se mira, y se mira entero.** Cada clip generado pasa por ojo humano
antes de entrar: es la práctica que este proyecto ya tiene escrita —*"cada pieza generada
se mira antes de ir a pantalla"*— y no hay instrumento que la reemplace para "este auto se
parece a uno de verdad".

**La verificación visual de la página es una captura headless real y no un
`getComputedStyle`.** A 400×780 y a 1907 de ancho, que son los dos anchos contra los que
este proyecto ya mide.

## Lo que la fase NO va a producir

Va escrito acá para que al cerrar no quede como un supuesto de quien lea.

- **Ningún cambio en `lib/` ni en el contrato entre las dos capas.** Al cerrar, la
  librería está exactamente como la dejaron las fases 11 y 12.
- **Ningún campo nuevo de señalización.** El bloque de oferta es el del ADR 0064 tal como
  está: seis entradas en `views[]` en lugar de cinco no es un cambio de formato, porque el
  ADR 0066 ya dice que el catálogo es tan largo como el que publica quiera.
- **Ningún aviso.** Esta demo no lleva un aviso concurrente ni uno lineal: es la única
  puramente editorial de las cuatro, y está argumentado en `DESIGN.md`.
- **Ningún dato sobre viabilidad en red.** Es el R5 de la fase 11 y sigue igual: todo se
  sirve local desde `server.mjs`. Al cerrar **no se va a poder afirmar nada** sobre cuánto
  ancho de banda pide esta grilla ni sobre qué hace el ABR con cuatro instancias. Y acá la
  tentación es mayor, porque la demo se publica: que esté en GCS no la convierte en una
  medición de red.
- **Ninguna garantía de derechos más allá de haberlo mirado.** El material es generado y
  las marcas son inventadas, y eso se verifica con ojo humano clip por clip. No hay acá un
  análisis de propiedad intelectual y no se lo va a poder citar como si lo hubiera.
- **Ningún test de DOM del renderizado.** La línea del proyecto no cambia.
- **Ninguna conclusión sobre iOS.** Lo que esta fase le deja a iOS es contenido publicado,
  que es otra cosa.

## Fuera de alcance

- iOS.
- Las otras tres demos, `lib/`, y los dos documentos de `docs/`.
- Una cámara de boxes como séptimo feed.
- Más de cuatro cajas, paginación, y elegir la forma del mosaico.
- La grabación de escenario, que es de otra ventana del calendario.
- El deck y lo que David dice en escenario.
- Llevar nada de esto a la especificación de SVTA.

## Riesgos y mitigaciones

| | riesgo | mitigación |
| --- | --- | --- |
| **R1** | **Las seis cámaras no se leen como la misma carrera.** Es el riesgo número uno y es el único que puede hacer que el gasto entero no sirva: seis clips generados por separado pueden traer seis circuitos, seis climas y seis horas del día. | El párrafo del mundo, idéntico en todos los prompts, probado en el sondeo de dos clips **antes** de los catorce del programa, y probado de nuevo contra el programa en la compuerta 2, que es donde se cruzan una cámara y el programa por primera vez. Si aun así no cierra, la carrera pasa a ser **nocturna bajo luz artificial**, donde el fondo oscuro esconde la diferencia y el costo es el mismo. |
| **R2** | **Veo dibuja una librea que se parece a una de verdad**, que es el modo de falla mejor documentado de esta herramienta en este proyecto: dibuja vestido comercial real aunque se le prohíba. | Describir la alternativa en lugar de prohibir —un color dominante y un acento, nombrados—, no pedir números ni patrocinadores, y mirar cada clip. Los seis colores se eligen fuera de la identidad de los equipos reales. |
| **R3** | **El audio generado trae habla.** Ya pasó: la demo del partido pidió imagen sin mencionar el sonido y volvió con diálogo en inglés entre los jugadores, repetido entre clips. | Dirigir el audio en el prompt describiendo qué se oye, y el portón de transcripción sobre cada clip. Un clip con habla se regenera. |
| **R4** | **El anuncio cae cerca de la ventana y no en ella**, que es el defecto que Nicolás nombró explícitamente. | `ofertaEn` declarado una sola vez en `race.json` y leído por los dos lados, más la aserción con su control (T-04). |
| **R5** | **Seis filas no entran en el panel del selector.** Es el único lugar donde esta fase podría terminar necesitando `lib/`. El panel ya scrollea y ya se auto-desplaza al pie, y la fase 11 lo midió con cinco vistas: a 1440 `scrollHeight` y `clientHeight` dan los dos 297, o sea que entraba justo; a 420 con la grilla llena, el título, la línea y la primera fila quedaban a cero píxeles visibles. **Seis filas empujan ese margen.** | Se mide en la T-09 a los dos anchos, con la grilla llena, mirando la captura. Si el panel deja de ser usable, **eso es una dependencia de `lib/` y se reporta**: no se entra a la librería a arreglarlo. |
| **R6** | **El gasto se va de las manos**, que es el riesgo que reestructuró esta fase. | Las tres compuertas, con su techo en generaciones y en dólares escrito arriba, más el sondeo de dos clips adentro de la etapa 1. El techo lo hace cumplir cada task parando, no alguien acordándose. |
| **R7** | **Cuatro decodificadores de video generado a la vez.** | Está adentro del sobre medido: la T-01 de la fase 01 midió **cinco** elementos a 1280×720 y 30 fps, y esto son cuatro a 24. Aceptado sin mitigar. |
| **R8** | **La fase queda parada en una compuerta** y la ventana de grabación se acerca. | Es el costo aceptado de la forma que Nicolás eligió, y se acepta sabiendo cuánto vale: la etapa 1 es de una jornada y media, así que la primera decisión llega temprano. Lo que la fase hace mientras espera es nada, que es el punto. |
| **R9** | **No se sabe si esta demo entra en la grabación del 28 al 30**, igual que no se sabía con el scroll de la fase 12. | Se construye todo, por la misma razón que allá: la página vive después del evento como el link que queda, y acá además la publicación es lo que habilita iOS. Es un dato que cambia cuánto conviene invertir, no una decisión pendiente que frene la fase. |

## La arquitectura, y dónde está

El proyecto no usa `docs/arc42/`: su documento de arquitectura son los dos de `docs/`.

**Esta fase no le cambia nada a ninguno de los dos, y por eso no hay task de
documentación.** `docs/contrato-senalizacion-renderizado.md` es la superficie entre las
dos capas y esta fase la **consume** sin tocarla; `docs/integrating-the-library.md` es la
superficie pública y la fase no toca la librería.

La documentación que sí produce es la de la demo, y va donde el ADR 0061 manda: **la
receta de generación vive con el generador**. Los prompts y el porqué de cada línea van en
las cabeceras de los scripts de `demo/race-multiview/scripts/` y en el README de la
carpeta de fuentes, no en el informe de esta fase.

## Stakeholders

- **Nicolás Levy** pidió la demo, fijó las seis cámaras y el tope de cuatro cajas, y
  **decide en las tres compuertas**. Pre-autorizó el presupuesto con la condición de que se
  gaste por etapas.
- **David Hassoun** presenta. La copia va en inglés por eso. No participó del diseño.
- **Emil** entra después por la parte de iOS, y lo que esta fase le deja es el contenido
  publicado.

## Timeline

Cinco a seis jornadas de trabajo, en diez tasks, **más lo que tarden las dos compuertas**,
que no está en manos de la fase. El reparto: la etapa 1 es una jornada y media, la etapa 2
dos, y la etapa 3 dos. La etapa 1 llega rápido a propósito, porque una compuerta temprana
sólo sirve si el material para decidir llega temprano.

Corre antes del sync del 21 de septiembre y antes de la ventana de grabación del 28 al 30.
No compite con el recorrido que se graba: es una carpeta aparte y no toca ninguna de las
otras tres demos.
