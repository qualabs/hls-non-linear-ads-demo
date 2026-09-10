# Informe de cierre — fase 08: la demo del break de hidratación

## 1. Resumen

La fase entrega **la segunda demo del repositorio**, `demo/hydration-break/`, y es la
primera del proyecto **cuyo entregable es lo que se ve en escenario y no lo que lo hace
posible**. Las siete anteriores construyeron el mecanismo y lo verificaron; ninguna tuvo
que hacer que alguien quiera el mecanismo.

Lo que hay en pantalla: un minuto de juego detenido en un partido de fútbol, con la
transmisión que no corta a tanda y le pone **cuatro avisos encima de la imagen en vivo**.
El orden es una curva de intrusión —banner, L, lineal, overlay— y **el lineal va tercero**,
que es lo que mete la comparación entre las dos formas de poner publicidad **adentro de un
solo minuto y un solo player**. De ahí sale una consecuencia de alcance que se cobró sola:
**esta demo no necesita el par de compatibilidad**, porque la comparación va en el tiempo
y no en el espacio.

**Tres formas de aviso y no dos** —lineal a cuadro entero, imagen fija no lineal, video no
lineal—, y la primera es la que agrega algo: el mecanismo acepta una imagen tan bien como
un video, y este minuto lo dice en pantalla en lugar de en un README.

Y la propiedad que hace que todo esto valga, escrita como propiedad: **no es una
grabación**, y por lo tanto **la página no afirma nada que no haya leído**. El guion se
ancla a la señalización y no a un cronómetro, así que ni él ni el código contienen un
segundo del programa; la línea de estado dice de qué forma es cada aviso leyendo el
contrato; y la sección que muestra el `EXT-X-DATERANGE` lo lee de la playlist que el player
está tocando.

**La librería no se tocó**, y eso no fue disciplina sino consecuencia de medir antes de
construir: la primera task midió que el `pause` del primario congela las tres cajas de
video del aviso, así que el freno del guion es una línea y el hallazgo del ADR 0040 nunca
se disparó.

## 2. Decisiones tomadas

Diez ADR, del **0037** al **0046**. Nueve con `scope: phase-08` y uno `project`.

| ADR | qué decide |
| --- | --- |
| 0037 | el guion se ancla a la señalización y los segundos se resuelven en vivo |
| 0038 | el guion es un archivo declarado, y es JSON |
| 0039 | el guion se arma con `settled`, y el primer beat es una placa con el player en pausa |
| 0040 | el freno de la experiencia es un `pause` del primario, y la página no toca la librería |
| 0041 | la placa es una capa de la página, y el player lleva su propio contexto de apilado |
| 0042 | el guion tiene una sola salida, y es el botón |
| 0043 | el aviso lineal va tercero, y ahí se pone el caso de negocio |
| 0044 | el corrimiento de la parada del juego se declara una vez en la demo |
| **0045** (`project`) | lo pictórico se genera, la tipografía se compone, y el movimiento se genera sólo donde la tipografía puede irse de cuadro |
| 0046 | el banner inferior es una imagen fija, y es una capacidad que la demo demuestra |

El **0045** es el único `project` porque gobierna cualquier trabajo de assets del proyecto
y no sólo el de esta demo. Los otros nueve son de este minuto y de esta página.

**El 0043 se escribió dos veces**, y conviene que quede dicho: el diseño lo cerró con el
lineal **primero** y Nicolás lo pidió segundo o tercero. El argumento de fondo no se movió
—la comparación adentro de un solo minuto— y lo que se reescribió fue el por qué de la
posición. Se eligió tercero por tres razones que apuntan al mismo lado, y la que decidió es
la **adyacencia con la L**: la L es lo más intrusivo que todavía deja ver el partido y el
lineal es lo primero que no lo deja, así que juntos el corte queda entre "casi no puedo
verlo" y "no puedo verlo", que es el corte exacto que la tesis usa.

## 3. Tasks

Ocho, las ocho `done`, ordenadas por riesgo y no por dependencia (ADR 0008).

| id | qué dejó | nivel |
| --- | --- | --- |
| T-01 | el freno de la composición medido en el navegador: R6 cerrado a favor | mínimo |
| T-02 | la demo corriendo con el plate suplente, y el ADR 0022 alcanzó sin tocar la raíz | bajo |
| T-03 | el plate propio de tres actos y el paquete de canal ficticio | bajo |
| T-04 | el guion: anclas, placa, botón y freno | bajo |
| T-05 | los cuatro creativos de tres marcas de fantasía | bajo |
| T-06 | la página: cuatro secciones, la estética, y la señalización mostrada como lo que es | bajo |
| T-07 | el suite propio de la demo y su campaña de mutación | **alto** |
| T-08 | la documentación: el README de la demo y la fila de la raíz | mínimo |

**La T-07 fue la única `alto`**, y la razón se cumplió: es código que corre desatendido y
cuya falla es un verde que no significa nada. `npm test` pasó de 49 a 55, y `npm run
mutaciones` rompe una regla a la vez con **siete roturas y siete rojos**.

## 4. Hilos abiertos

- **La coherencia del plate.** Los actos de juego y los de parada son equipos y canchas
  distintos: el juego es un partido masculino en césped sintético, la parada un equipo
  femenino en otra cancha. Una transmisión real corta de plano pero no cambia de partido.
  La versión coherente existe —el mismo equipo tiene clips de juego— y **no tiene un plano
  ancho que se lea como cámara de transmisión**, así que las dos opciones existen y ninguna
  tiene las dos cosas. Se eligió el plano ancho porque es lo que hace funcionar al paquete
  de canal. **Se da vuelta con una línea de `armar-plate.sh`** si Nicolás prefiere lo otro.
- **No hay asset de la marca de SVTA en el repositorio.** El branding del proyecto pide las
  dos marcas juntas y lo único vendorizado es el kit de Qualabs, así que la página nombra a
  SVTA como texto. No se fabrica el logo de un tercero. Si aparece el archivo, entra en
  `brand/` con su procedencia como los de Qualabs.
- **El texto del beat del caso de negocio.** Es el único lugar donde la demo argumenta en
  palabras y no en pantalla, y el único texto de la fase donde el autor no es el lector
  correcto. Se cambia editando una línea de `story/story.json`, que es para lo que el guion
  es un archivo declarado.
- **El chequeo final de cuadro antes de grabar.** En los clips de la parada hay ropa
  deportiva con marca comercial legible en un par de cuadros. Es aparición incidental sobre
  un equipo amateur, que es el caso débil, y queda anotado para una última pasada humana
  antes de la grabación, que es lo que la investigación de contenido pide.
- **El patrón del instrumento, que ya es de nivel repo.** Tres veces en este proyecto un
  chequeo escrito de buena fe no podía dar otra cosa que verde. Puede ser material de regla
  para el repo padre; la propuesta con el texto exacto no se escribió acá porque una regla
  no se aplica sola.

## 5. Riesgos que se materializaron

**R1, el plate, se materializó y se resolvió.** Y el número es el hallazgo más caro de la
fase: **de seis candidatos de metraje "free to use", cinco no pasaron el chequeo de
cuadro** —uno con escudo de federación y las tres tiras de una marca real, uno con
menores, dos con marca comercial legible en primer plano—, y **ninguno lo decía en su
título**. El que se usó se salvó con un recorte que saca el tercio izquierdo del cuadro,
verificado en cuatro momentos del clip, y que quedó escrito en el script como lo que es:
**no es encuadre, es el chequeo**.

**R2, la deriva del generador, no se materializó, y eso también fue un dato.** El prompt de
la zapatilla no derivó hacia el vestido comercial real, y la única diferencia con la
corrida de la investigación —que sí derivó— es que este prompt **nombra la alternativa** en
lugar de sólo prohibir. Queda como hipótesis con una observación a favor: prohibir deja el
hueco y el modelo lo llena con lo que conoce.

**R3, la secuencia de los assets, se mitigó como estaba escrito.** La T-02 construyó la
demo contra el contenido de la demo vecina como suplente, así que el guion y la página
avanzaron sin material propio. Los dos frentes no se bloquearon.

**R6, el freno, se cerró a favor en la primera task**, que es lo que decidía el tamaño de
la fase.

**R7, el chequeo que no puede fallar, se materializó dos veces adentro de la fase** —y las
dos veces lo agarró un control y no una intuición. En la T-01, el chequeo del freno podría
haber dado verde con nodos que nunca arrancaron, y lo que lo salva son las lecturas de los
extremos, que muestran el `currentTime` avanzando 1,21 s. Y en la T-07 la campaña de
mutación existe entera por eso, con su propio control: sin romper nada, los tres chequeos
tienen que dar verde.

**El riesgo que no estaba escrito y apareció: mirar la propiedad en lugar de la imagen.**
Dos defectos de esta fase se escondieron detrás de un valor correcto. `card.hidden` leía
`true` mientras la placa seguía en pantalla, y el creativo salía perfecto al tamaño exacto
de su caja mientras el empaquetado lo re-recortaba. Los dos los encontró una captura.

## 6. Recomendaciones para la próxima fase

1. **Mirar la corrida guiada entera, de punta a punta, en la pantalla donde se va a
   grabar.** Es lo único que esta fase verificó por partes y no de una sola pasada: cada
   beat tiene su captura y cada aviso la suya, pero la impresión de los treinta segundos
   —que es el criterio de aceptación— sólo la puede juzgar Nicolás mirándola correr.
2. **Decidir la coherencia del plate antes de la grabación y no durante.** Es la única
   decisión de contenido que quedó abierta, y cambiar de opción cuesta una línea hoy y una
   regeneración de todo el plate el día de la toma.
3. **Cuando el `lead` de un beat se toque, no bajarlo de 1,5 s.** Está medido: el loop
   llega hasta ~1 s tarde con la pestaña sin foco, así que el margen real es el `lead`
   menos ese segundo.
4. **Si aparece una fase de refinamiento reactiva** —como la 04 y la 07 lo fueron—, el
   lugar de los defectos de esta demo es su propia carpeta y no la librería: en ocho tasks
   no hubo un solo cambio en `lib/`, y ése es un dato sobre dónde vive lo que falta.

## 7. Correcciones post-ejecución

Una sola, y está en el bloque de la T-04:

> **post-ejecución:** 2026-09-09, la placa quedaba visible después de terminar la guiada, y
> `card.hidden` leía `true` todo el tiempo: el `display: grid` de la hoja de estilos le
> gana al `[hidden]` del navegador, porque uno es regla de autor y el otro de user-agent.
> Se agregó `.card[hidden] { display: none }` y el `end()` ahora también borra el
> `data-on` que la dejaba opaca. **Lo encontró una captura de la T-05 y no la verificación
> de la T-04**, que había leído la propiedad en lugar de mirar la imagen.

**Leída como medición y no como registro**: una corrección sobre ocho tasks es poco, pero
la que hubo dice algo preciso sobre cómo se verificó la T-04. Su verificación era de nivel
`bajo`, que es el nivel correcto para una interfaz, y el nivel `bajo` dice textualmente que
la verificación es **una captura al tamaño real de uso** y que **un estilo computado no es
evidencia de que algo se ve**. La T-04 leyó `card.hidden` y no miró la imagen del estado
final, y el defecto sobrevivió exactamente el tiempo que tardó otra task en sacar una
captura. No es un problema del plan de la T-04 sino de su ejecución: el criterio estaba
escrito y no se aplicó al último estado.

## 8. Revisión de documentación

Superficie por superficie, con qué se hizo en cada una o por qué no necesitaba nada.

**El índice de fases de `PROJECT.md`** — escrito. La línea de la fase 08 dice qué terminó
siendo: la segunda demo, la primera fase cuyo entregable es lo que se ve en escenario, el
lineal tercero y la consecuencia de que no haga falta el par de compatibilidad, que la
página no afirma nada que no haya leído, que la librería no se tocó, y el hallazgo de los
cinco clips de seis. `last_update` ya estaba en 2026-09-09.

**`docs/arc42/`** — no existe y esta fase no lo creó. Los dos documentos de `docs/` cumplen
ese papel para el único lector que tienen, que es quien construye con la sdk, y la pregunta
que corresponde —¿siguen describiendo este sistema?— se contestó leyéndolos:

- **`docs/contrato-senalizacion-renderizado.md`** — releído y **sigue vigente sin cambios**.
  El contrato no se movió: la fase lo consumió entero —`activeAt`, `programRanges`, los
  `itemId`, el `mediaType` de cada elemento— y no le pidió nada nuevo. Que una demo se haya
  podido construir contra él sin agregarle un campo es la mejor evidencia de que describe
  lo que hay.
- **`docs/integrating-the-library.md`** — **corregido, y la corrección la encontró esta
  revisión y no la task**. Su sección 3, "What your stylesheet has to say", tenía dos reglas
  y una prohibición, y le faltaba la que esta fase pagó con una hora: **si la página dibuja
  algo encima de la imagen, el contenedor necesita `isolation: isolate`, y el elemento
  propio tiene que ser hermano del contenedor y no hijo.** El cromo se dibuja con
  `z-index: 2147483000` y sin las dos cosas juntas lo que la página dibuja se pinta y no se
  ve, sin nada en la consola. Le pasa a cualquier integrador que quiera poner un cartel
  sobre el player, no sólo a esta demo. El conteo de la sección se actualizó a tres reglas.

**El resto de `docs/`** — son esos dos y nada más.

**El `README.md` de la raíz** — **actualizado**: una fila nueva en la tabla de `demo/` que
dice **qué argumenta** esta demo y no qué contiene. La fila de `compatibility-pair` y su
README no se tocaron, que es lo que el fuera de alcance pedía. La línea que apunta a
`docs/` y dice para quién es sigue siendo cierta y no cambió.

**El `CLAUDE.md` del proyecto** — no existe. La fase no creó uno: no apareció una
convención propia que no cupiera en un ADR o en el README de la demo.

**`.project/knowledge/`** — no existe, y esta fase no lo necesitó. Nada de lo que produjo
informa a **varias** fases futuras: el conocimiento cross-fase que generó —el reparto de
herramientas de generación— está en el ADR 0045, que es `project` justamente por eso.

**El `CLAUDE.md` y el `knowledge/` del repo padre** — **no se tocaron, y hay un candidato
anotado sin aplicar.** El patrón del chequeo que no puede fallar lleva tres apariciones en
este proyecto, y el paso que falta en las tres es el mismo: ir a la fuente antes de
fabricar el instrumento. Puede ser material de regla para el repo padre, pero **una regla
no se aplica sola**: va con el texto exacto, Nicolás corrige y aprueba, y recién ahí se
edita el archivo. Queda como hilo abierto en la sección 4.

**El runbook de la demo** — es su `README.md`, escrito en la T-08 y **corregido después**,
cuando la decisión de sacar el video de git cambió cómo se levanta: ahora avisa arriba, en
la sección de correr, que el repositorio no carga video y que hay un paso que se ejecuta
una vez y gasta en la cuenta de quien lo corre. Es la obligación de que un cambio que
agrega un paso de setup no deje el runbook sin él, y se pagó en el mismo commit.

**El `CREDITS.md` de la demo** — escrito en la T-03, completado en la T-05 y corregido en el
cambio del video: la procedencia clip por clip, el tratamiento de cada uno, el párrafo de
por qué el recorte no es encuadre sino el chequeo, y qué está versionado y qué no.

## Una decisión de Nicolás que revirtió una mía

Va acá, al final y con nombre, porque el informe expone el estado final y esto es una cosa
que **cambió después de estar hecha**.

En la T-05 decidí **versionar el video generado** —25 MB de mp4 en git— con este argumento:
`content/` está gitignoreado porque se puede reconstruir, y una generación no se repite, así
que sin el archivo la demo sólo corre en la máquina donde se generó.

**Nicolás lo dio vuelta, y su criterio es el que vale**: el repositorio no carga video,
porque subir video es pesado y no aporta; lo que carga es la receta. Y agregó lo que a mi
argumento le faltaba: **el resultado no tiene que ser idéntico** —con un modelo generativo
no existe eso— así que alcanza con que esté el prompt correcto y con que se entienda por
qué dice lo que dice.

Las dos razones, dichas juntas: yo optimicé que la demo corriera igual en cualquier máquina,
y el costo que eso pagaba era el peso de un repositorio que se le entrega a David y a Apple.
Su criterio resuelve el mismo problema por el otro lado, y de paso elimina la única cosa que
yo no podía garantizar.

Lo que quedó: el mp4 salió de git sin borrarse del disco, las imágenes se quedaron —más una
que faltaba, la de entrada del video, sin la cual la receta no se puede correr—, y
`scripts/setup-content.sh` es el punto de entrada único que baja los clips y genera el spot,
con preflight que dice qué falta antes de trabajar. El README de `graphics/creativos/fuentes/`
pasó a ser la receta: los prompts textuales y **las tres razones del prompt del video**, que
es la parte que ninguna documentación de Google trae.

## Correcciones posteriores al cierre

La fase quedó cerrada y Nicolás la probó. Lo que encontró está aplicado como
`post-ejecución` sobre las tasks que corresponden, y las dos correcciones merecen estar acá
porque cambian lo que el informe dice más arriba.

**El player que la guiada no soltaba** (T-04). Termina la guiada, aprieta play, y el
programa no arranca. Medidos los cuatro caminos antes de tocar nada, el roto no era el que
él describió sino **saltear con una placa arriba**: las dos salidas tempranas de `say()`
dejaban la bandera de la guarda prendida para siempre y desde ahí **todo** `play` se
cancelaba. El player no estaba muerto, seguía agarrado. La guarda pasó a **vivir lo que vive
la placa** y hay una sola función que suelta lo que la guiada tomó. Es la segunda vez que
esa guarda muerde, y la primera vez se arregló el caso —el orden de dos líneas— y no la
forma; ése es el hallazgo.

**La L estaba autorada al revés** (T-02 y T-05, ADR 0047). Estaba declarada como dos
elementos de aviso, y la industria la autora como **un aviso a cuadro entero al fondo con el
contenido primario encogido encima**, manteniendo su relación de aspecto y anclado contra los
bordes superior y derecho. No es estético: **el público de esta demo es el que sabe cómo se
hace de verdad**, y una demo que existe para mostrar el mecanismo tenía su propia L
autorada de la forma que ese público no usa.

**Y el dato que esa corrección deja sobre el proyecto: el contrato lo expresó sin pedirle
nada.** Su regla 2 ya nombraba la forma —*"el aviso está en `zDepth` 0 y el contenido
primario en 1, o sea que el aviso es el fondo"*— y el renderizador ya la contemplaba por
nombre, con un comentario que dice que sin posicionar el primario en absoluto *"the layouts
where the ad is the background and the picture goes on top of it would come out inverted"*.
Rehacer la L fue **leer el documento y declarar distinto**, con cero cambios en `lib/`. Eso
refuerza lo que la sección 8 dice del contrato: que una demo entera se haya construido
contra él sin pedirle un campo, y que además se haya podido rehacer un layout leyéndolo, es
la mejor evidencia de que describe lo que hay.

## Verificación del cierre

`npm test` en **55 verdes**, `npm run check` en `both seams hold.`, `npm run mutaciones` con
**las siete roturas en rojo y los tres chequeos en verde sin romper nada**, y
`validar-proyecto.py` en **GREEN** con 46 ADR y 8 fases —las dos excepciones históricas de
las fases 02 y 04 impresas con su razón—.

La demo se levantó **desde el punto de entrada documentado y con `content/` borrado**, para
que el README se probara y no se declarara. El server de la demo vecina en el 8080 quedó
arriba y sin tocar durante toda la fase; esta demo corrió en el 8081.
