# Diseño — fase 08: la demo del break de hidratación

Una demo nueva en `demo/`, para el HLS Interest Group. El objetivo lo fijó Nicolás
y va textual, porque es lo que mueve la vara de todo lo demás:

> *"es una demo nueva en `demo/`. La demo que ya tenemos debe quedar y es una demo
> técnica que su objetivo es validar el desarrollo. Esta es una demo que su objetivo
> es mostrar el potencial de uno o varios casos de uso reales de esta forma de poner
> ads y como este desarrollo lo resuelve."*

Las siete fases anteriores construyeron el mecanismo y lo verificaron. Ninguna tuvo
que hacer que alguien **quiera** el mecanismo. Esta sí, y es un tipo de trabajo
distinto: la vara no es que el layout caiga en el píxel correcto, es que **un
ingeniero de un broadcaster entienda el caso de negocio en treinta segundos de
mirar la pantalla**. Lo estético es el vehículo de eso y no el entregable.

Sigue siendo un POC y la vara de ejecución es la de siempre: quick and dirty en lo
que no se ve, y nada se mide más allá de lo que hace falta para que la pantalla
cuente el caso.

## Lo primero, porque acota la fase entera: nada de lo que ya funciona se toca

Medido antes de diseñar, leyendo el repositorio corriendo:

- **`demo/compatibility-pair/` no cambia.** Es la demo técnica y su objetivo —validar
  el desarrollo— sigue vigente y es otro. Esta fase no le agrega una sección, no le
  cambia el copy y no le mueve el recorrido. Una demo nueva es una carpeta nueva.
- **La sdk no cambia.** `./run.sh <demo>` ya empaqueta el contenido de la demo que se
  le nombra, escribe su playlist señalizada, construye la librería y sirve **la
  carpeta de esa demo como raíz de documentos** (ADR 0022). El árbol de `demo/` es
  una lista y agregarle un elemento no toca la raíz.
- **El mecanismo entero ya está construido.** Los cinco layouts, el aviso lineal por
  el mismo camino de código que el repliegue (ADR 0019), la mezcla que declara el
  asset list (ADR 0014), el foco de audio (fase 06), el cromo con la barra
  arrastrable (fases 02, 04 y 07). Esta fase **no agrega una capacidad al player**:
  le pone adelante un caso de uso y una página que lo cuenta.
- **Frenar el programa congela la composición entera.** `lib/renderer.js` aplica el
  estado de reproducción en cada `play` y en cada `pause` del primario, y lo aplica
  leyendo `video.paused` en lugar de recordar qué evento lo trajo hasta ahí
  (`applyPlayback`, y los dos listeners que lo llaman). Es lo que hace que el freno
  que pide el guion sea **un `video.pause()` y nada más**, incluso en medio de un
  aviso con tres cajas de video corriendo. Esto está **leído en el código y no medido
  en el navegador**, y por eso es lo primero que la fase mide (riesgo R6).
- **El contrato ya expone exactamente las dos consultas que el guion necesita.**
  `provider.programRanges()` devuelve los rangos del programa ordenados, cada uno con
  su `id` y su `kind`, y `provider.experiences` lleva un `itemId`, un `startTime` y
  una `duration` por aviso. Los dos están documentados en
  `docs/contrato-senalizacion-renderizado.md` y los dos son sincrónicos.
- **La tabla del recorrido ya se lee desde JavaScript.** El suite de la demo actual
  parsea el array `RECORRIDO` de su propio `scripts/senalizar-contenido.sh` con una
  expresión regular y chequea que cada fila nombre un asset list que existe
  (`demo/compatibility-pair/test/signalled-run.test.js`). Que la señalización sea
  legible como dato desde el suite no es algo que esta fase tenga que inventar: es
  precedente.

## El caso de uso: el break de hidratación

Decidido por Nicolás, y es uno solo. Un partido de fútbol para el juego un minuto:
los jugadores toman agua, el técnico habla con el equipo. La transmisión **no corta a
tanda**. Deja la imagen en vivo y le pone publicidad no lineal encima.

Su argumento, que es la tesis que la demo demuestra: **el espectador se queda
mirando**, así que ve más tiempo de publicidad; una tanda lineal en ese minuto lo
manda al baño.

En ese minuto hay **cuatro avisos: uno lineal y tres no lineales.** El lineal dura
diez segundos y existe para mostrar que el mismo mecanismo también hace el caso
tradicional.

Las marcas son **de fantasía y con identidad propia**: una cola, unos zapatos, una
empresa de viajes.

## La propiedad que hace que esto valga, y es una propiedad y no un detalle

**No es una grabación.** Es el player haciendo de verdad lo que hace, con la página
acompañando. El programa es un HLS real, los `EXT-X-DATERANGE` son reales, el asset
list se pide por red y se resuelve, y los avisos son elementos de video reproduciendo.
Alguien de la industria mirando eso **sabe que no le están mostrando un video de After
Effects**, y ese saber es la mitad de lo que la demo vende: el mecanismo existe.

Es la misma línea que David puso sobre el proyecto entero —*"I don't want it smoke in
mirrors"*, y descartó explícitamente el compositing de video—, aplicada a la capa que
esta fase agrega.

**Lo que eso obliga, y es la restricción de diseño más fuerte de la fase: ningún beat
del guion puede afirmar un estado que no leyó.** El texto que aparece en pantalla se
dispara contra la señalización resuelta y no contra un cronómetro, así que una placa
no puede decir "ahora entra la L" si la L no entró. Si la página pudiera mentir sobre
lo que el player está haciendo, sería un video de After Effects con más pasos.

## La tensión estética, y la resolución es de Nicolás

Una estética minimalista y una pantalla con cuatro avisos simultáneos tiran para
lados opuestos: lo primero pide vacío y lo segundo es densidad.

La resolución usa esa fuerza en lugar de pelearla. **La pausa es donde vive lo
minimalista** —fondo oscuro, una frase, tipografía grande— **y el player es donde vive
la densidad.** No compiten porque **nunca están en pantalla al mismo tiempo**.

Y de paso resuelve el problema de fondo, que no era estético: con la pausa que explica
primero, **el espectador sabe qué está mirando antes de mirarlo**. Una pantalla con
cuatro cosas encima es ilegible para quien la ve por primera vez sin que nadie le diga
qué mirar; con la frase adelante, los mismos cuatro elementos son la confirmación de
algo que ya entendió.

## Un flujo, no dos modos

La demo guiada **arranca sola** al entrar. Cuando termina, el usuario queda libre para
jugar con el player. Y hay un **botón para saltear la guiada**, para el que ya la vio.

**Un estado, no dos páginas.** No hay pantalla de selección, no hay `?modo=guiado`, no
hay dos rutas que haya que mantener iguales.

La razón de que arranque sola: **alguien que abre el link desde un mail no sabe que hay
un botón**, y sin la guía se pierde el caso de negocio entero. Un botón "empezar la
demo guiada" convierte el caso de negocio en algo opcional, y es justo lo que la demo
existe para contar.

## La estética alineada a Apple, y qué se acordó que significa

Seis propiedades, y están acá porque cada una descarta algo concreto:

1. **Una idea por pantalla**, con secciones de altura completa, y el scroll contando la
   historia.
2. **Mucho aire.**
3. **Jerarquía de dos o tres tamaños tipográficos y nada más.**
4. **Paleta corta, casi todo neutro: el color lo trae el video y no la página.**
5. **Cero decoración**: sin gradientes de adorno, sin sombras dramáticas.
6. **Movimiento sobrio**, y **el video es el producto**: va primero, grande y sin
   marco.

De la 1 y la 6 sale la forma de la página: **la primera sección es el player a altura
completa** y es donde corre la demo guiada. Abajo, el scroll para quien quiere saber
cómo, con un tope de **cuatro secciones en total** —el player, el mecanismo, la
señalización mostrada como lo que es, y los créditos con las marcas de Qualabs y
SVTA—. El tope es un tope y no un objetivo: tres secciones es mejor que cuatro.

Dos cosas que ya están decididas en el proyecto y esta página hereda: **la marca de
Qualabs va junto a la de SVTA**, y **no va adentro del cuadro** (fase 04). El masthead
la lleva, el video no.

**La página está escrita en inglés**, como la de la demo actual y por la misma razón:
el lector es la sala del HLS Interest Group. El diseño, el `README.md` de la demo y el
guion como archivo se escriben en español, que es el idioma del repositorio.

## La forma del recorrido: un break, cuatro avisos

Un solo `EXT-X-DATERANGE` de la clase concurrente, con un asset list de cuatro
`ASSETS`, sobre un plate de ~90 s que tiene tres actos: juego, parada, juego.

**El aviso lineal es un `ASSET` sin bloque de layout.** Que sea un asset sin bloque no
es una interpretación: es el requerimiento 4 del documento que David armó para el
evento, que pide que la clase concurrente extienda a la interstitial existente *"para
mantener compatibilidad hacia atrás cuando el asset-list JSON responde un interstitial
tradicional"*. Un `ASSET` con `URI` y `DURATION` y sin bloque de los nuestros es
exactamente ese caso, y en este repositorio ya se reproduce a cuadro entero con el
programa corriendo detrás por el camino único del ADR 0019. Nada nuevo que construir.

**Y el minuto muestra tres formas de aviso y no dos**, porque uno de los tres no
lineales es una **imagen fija**: lineal a cuadro entero, imagen fija no lineal, y video
no lineal. Es una capacidad del mecanismo y por eso está acá y no en la sección de
assets (D10).

El reparto del minuto, y los segundos son propuesta de esta fase y no una restricción
del mecanismo:

| # | aviso | largo | forma | asset |
| --- | --- | --- | --- | --- |
| 1 | no lineal | ~16 s | banner inferior que tapa parte de la pantalla | **imagen fija** |
| 2 | no lineal | ~16 s | formato L, el programa se repliega a la esquina | video |
| 3 | **lineal** | 10 s | cuadro entero, el programa corre detrás | video |
| 4 | no lineal | ~16 s | overlay de esquina, el más liviano de los tres | video |

Suma ~58 s, que es el minuto, y **el orden es una curva de intrusión**: el banner deja
el partido entero a la vista, la L lo repliega a una esquina, el lineal lo tapa, y el
overlay lo devuelve. Por qué el lineal cae tercero está en D7.

**Qué identificador de la herramienta de SVTA le toca a cada forma lo decide la task**,
con el criterio de que el `type` es una etiqueta opaca y lo que gobierna la pantalla son
las cajas (`docs/contrato-senalizacion-renderizado.md`, regla 1).

## De dónde salen los tiempos: la cadena va en una sola dirección

Es la única decisión de diseño que había que resolver, y el defecto que evita es
concreto: **el guion tiene beats en segundos y la señalización ya declara cuándo entra
cada break; si eso queda en dos lugares, se desincroniza en la primera edición y la
explicación aparece sobre otra cosa.**

Y no son dos lugares, son cuatro. El plate declara dónde está la parada del juego; el
`RECORRIDO` del script de señalización declara en qué segundo entra el break; el asset
list declara cuánto dura cada aviso; y el guion dice cuándo hablar. Cada uno de esos
cuatro sabe algo que los otros no, y la única forma en que esto no se rompe es que
**cada número viva en exactamente un lugar y los de abajo lo lean**:

```
el plate           declara  →  dónde está la parada del juego
el RECORRIDO       lee la parada  y  declara  →  en qué segundo entra el break
el asset list      declara  →  cuántos avisos y cuánto dura cada uno
el guion           lee el break y los avisos  y  declara  →  qué se dice y cuánto se frena
```

Una sola dirección, sin ciclos. Mover la parada en el plate mueve el break; agregar un
aviso al asset list corre los que siguen y el guion los sigue; y **el guion no tiene un
solo segundo absoluto de la línea de tiempo del programa**.

### D1 — El guion se ancla a la señalización, y los segundos se resuelven en vivo

**Decisión.** Un beat no dice *"al segundo 20,2"*: dice a qué rango o a qué aviso se
cuelga, y con cuánta anticipación. Tres formas de ancla y no más:

| ancla | qué resuelve |
| --- | --- |
| `{"at": "start"}` | el arranque, antes de que el programa empiece a correr |
| `{"before": {"break": n}, "lead": s}` | `s` segundos antes de que arranque el n-ésimo rango concurrente |
| `{"at": {"break": n, "ad": k}, "lead": s}` | `s` segundos antes de que arranque el k-ésimo aviso de ese break |

La resolución es del contrato y de nada más. `break: n` es el n-ésimo elemento de
`provider.programRanges().ranges` filtrado por `kind === 'concurrent'` —que ya viene
ordenado por `startTime`—, y `ad: k` es el k-ésimo de `provider.experiences` cuyo `id`
coincide con el de ese rango, ordenado por `startTime`. **La página no construye un
identificador**: `AD-1-CONCURRENT` es una convención del script de señalización y el
guion no la conoce.

El `lead` es un número absoluto y está bien que lo sea: es una anticipación, no una
posición, así que no puede desincronizarse de nada. Es también lo que hace que la placa
llegue **antes** de lo que va a explicar, que es el punto entero de la sección de la
tensión estética.

**Descartado: que `senalizar-contenido.sh` emita un `recorrido.json` y la página lo
lea.** Es la forma que primero parece obvia, porque el script ya imprime esa tabla para
la persona que graba. Pero es una copia: los mismos números escritos por segunda vez en
un archivo, más un paso de build, y a cambio de cero verdad nueva —el `provider` ya los
tiene, resueltos, y encima resueltos contra lo que el player efectivamente bajó y no
contra lo que el script creyó—. Y tiene un defecto propio: un `recorrido.json` no sabe
qué asset list falló al bajar, y el `provider` sí.

**Descartado: beats en segundos absolutos con un comentario que pida mantenerlos.** Es
el defecto que esta sección existe para evitar.

### D2 — El guion es un archivo declarado, y es JSON

**Decisión.** El guion vive en `demo/<slug>/story/story.json` y la página lo pide con
`fetch`. Nicolás va a reescribir esos textos diez veces antes de la presentación y no
tiene que abrir un `.js` para eso.

JSON y no otra cosa por dos razones. La primera es que **es el formato de los datos
declarados de este repositorio**: los trece asset lists son JSON y el suite los lee
como datos. La segunda es que la estética le pone un techo al largo de cada texto —una
frase, tipografía grande—, y una o dos oraciones es exactamente el largo que JSON
maneja sin dolor.

`story/` y no `guion/` porque el árbol de una demo está en inglés (`content/`,
`signalling/`, `brand/`, `scripts/`), y no `script/` porque colisiona a la vista con
`scripts/`, que son los shell scripts.

**Descartado: un módulo JS que exporte el array.** Se edita mejor —comillas invertidas,
saltos de línea, comentarios— y no necesita `fetch`. Se descarta porque es el lenguaje
de la página: la línea entre "archivo declarado" y "código" se adelgaza, y el día que
alguien meta una función adentro el guion dejó de ser un dato. **Descartado: markdown
con frontmatter por beat.** Se edita mejor que las dos, y pide un parser en la página
para ganar comodidad en un archivo de cuatro o cinco entradas.

La forma de un beat, y son cuatro campos:

```json
{
  "beats": [
    {
      "id": "apertura",
      "anchor": { "at": "start" },
      "text": "Un minuto de juego detenido. La transmisión no corta a tanda.",
      "hold": 6
    },
    {
      "id": "el-lineal",
      "anchor": { "at": { "break": 1, "ad": 3 }, "lead": 1.5 },
      "text": "Así se hace hoy: diez segundos de pantalla tapada.",
      "hold": 6
    }
  ]
}
```

`hold` son los segundos que la placa se queda, y es absoluto por la misma razón que el
`lead`: es el largo de una pausa y no un punto de la línea de tiempo.

### D3 — El guion se arma cuando la señalización está resuelta, y el primer beat es una placa con el player en pausa

El problema: **los asset lists se piden por red.** Al segundo cero no hay rangos, así
que un guion que resuelve sus anclas al cargar la página las resuelve todas contra una
lista vacía. `provider.programRanges()` devuelve un `settled` justamente para esto, y
vale `true` cuando la fuente no puede entregar más rangos y no queda ninguno a medio
resolver.

**Decisión.** El guion se arma cuando `settled` es `true`, y **el primer beat es una
placa con el player en pausa**. Con eso la carrera desaparece en lugar de mitigarse: la
página arranca en pausa mostrando su primera frase, y el programa no empieza a correr
hasta que esa placa se va, momento en el que la señalización hace rato que está
resuelta.

Que el primer beat sea una placa sobre negro con el player quieto **es además la
apertura que la estética pide**: una idea por pantalla, y el video entra después de la
frase que dice qué se va a ver.

Leído en el código y no medido: los `EXT-X-DATERANGE` de esta demo van en la media
playlist (ADR 0005), así que la capa de señalización los ve todos en el primer
`LEVEL_UPDATED` y pide los asset lists ahí mismo (`createSignalling` en
`lib/signalling.js`). El intervalo real entre el `play` y el `settled` no está medido y
no hace falta que lo esté, porque la placa no depende de que sea corto.

**Descartado: resolver cada ancla tarde, cuando el programa se le acerca.** Anda, y es
más código para sostener un caso que la placa de apertura ya eliminó.

### D4 — El freno es `video.pause()`, y la página no toca la librería

**Decisión.** Cuando un beat llega, la página llama `video.pause()` sobre el elemento
del contenido primario. Nada más. La composición entera se congela —las tres cajas de
video del aviso incluidas— porque el renderer aplica el estado de reproducción en cada
`pause` del primario leyendo `video.paused`, y lo aplica a todos los nodos que tienen
línea de tiempo.

**Lo que esto compra es que la superficie pública de la librería no cambia.** Ni
`attach` ni `attachControls` reciben nada nuevo, el contrato entre señalización y
renderizado no se mueve, y la demo nueva usa la sdk exactamente como la usa la demo
actual. Una demo que necesita una capacidad nueva del player no es una demo, es una
fase de la librería.

Los beats se disparan desde un **loop de `requestAnimationFrame` propio de la página** y
no desde `timeupdate`. `timeupdate` llega unas cuatro veces por segundo, así que un beat
puede cruzarse hasta ~250 ms tarde, y 250 ms tarde en un beat anclado al cambio de aviso
significa que el aviso nuevo ya se vio: es exactamente el tamaño de la cosa que el beat
quiere anticipar.

**Si algo de esto no se puede hacer desde afuera de la librería, es un hallazgo para
reportar y no un cambio para hacer adentro de esta fase.**

### D5 — El oscurecimiento y la tipografía son una capa de la página, y el player necesita su propio contexto de apilado

**Decisión.** La placa es un elemento de la página por encima de la caja del player:
un fondo oscuro casi opaco y una frase centrada. No es un filtro sobre el video, no es
una clase que la librería dibuje, y no vive adentro del contenedor que el renderer
gobierna.

Y hay una trampa concreta medida en el código: **el cromo se dibuja con
`z-index: 2147483000`** (`CONTROLS_Z_INDEX`, `lib/controls.js:49`), que es un número
elegido para ganarle a cualquier cosa. Si el contenedor del player no crea su propio
contexto de apilado, ese `z-index` compite con los elementos de la página y le gana a
la placa. La solución es de una línea en el CSS de la página —`isolation: isolate` en el
contenedor del player— y con eso el `z-index` del cromo queda encerrado adentro de su
caja y la placa se apila por encima con un número normal.

Vale escribirlo acá porque es una hora perdida para quien no lo sabe, y porque la
alternativa —ponerle a la placa un `z-index` todavía más alto— anda y deja la página con
un número mágico que nadie puede explicar.

### D6 — El guion tiene una sola salida, y es el botón

**Decisión.** La demo guiada termina de dos maneras: porque se acabó el último beat, o
porque el usuario apretó el botón de saltear. **Nada más la corta.** En particular, un
click o un toque sobre los controles del player no la corta.

La razón es que **esto se graba**. Una segunda salida que se dispara con cualquier gesto
sobre el player es una salida que se dispara sola en medio de una toma, y una toma
arruinada cuesta más que la molestia de tener que apretar el botón. El botón es para
quien ya la vio, que es lo que Nicolás pidió, y es visible durante toda la demo guiada.

Cuando el guion termina, termina: no queda un estado guiado latente al que se pueda
volver. Eso es lo que hace que "un flujo, no dos modos" sea cierto en el código y no
sólo en la página.

**Descartado: que cualquier gesto sobre el player ceda el control.** Es lo que haría un
producto y no lo que le sirve a una grabación.

### D7 — El aviso lineal va tercero, y ahí se pone el caso de negocio

**Decisión.** El lineal de diez segundos es el **tercero** de los cuatro, y el beat que
se dispara en el cambio del aviso 2 al 3 es donde el guion cuenta el caso de negocio.

Lo que compra, y es lo que no se puede tener de otra manera: **la comparación entra
adentro de un solo minuto y en un solo player.** El espectador ve la forma nueva, la
siente cuando la pantalla se le tapa, y la recupera. **Acaba de sentir** lo que la frase
le va a explicar, que es la diferencia entre un argumento y una demostración.

De ahí sale una consecuencia de alcance que vale plata: **esta demo no necesita el par
de compatibilidad.** La comparación está en el tiempo y no en el espacio, así que no hay
dos players en pantalla, no hay un segundo `EXT-X-DATERANGE` de la clase de Apple, y no
hay que explicar por qué uno de los dos paneles se ve distinto. Ese argumento ya lo hace
`compatibility-pair`, que es la demo técnica y se queda como está.

**Por qué tercero y no segundo**, que son las dos posiciones posibles, y las tres
razones apuntan al mismo lado:

- **La línea de base tiene que estar construida antes de romperla.** En segundo lugar el
  lineal interrumpe cuando el espectador vio un solo aviso no lineal, así que la
  comparación es contra una impresión y no contra una costumbre. Con dos avisos delante,
  mirar el partido con publicidad encima ya se volvió lo normal, y taparlo se siente.
- **La adyacencia con la L es la más filosa del minuto.** La L es lo más intrusivo que
  todavía deja ver el partido —el programa replegado a una esquina— y el lineal es lo
  primero que no lo deja. Ponerlos uno al lado del otro hace que el corte sea entre
  "casi no puedo verlo" y "no puedo verlo", que es el corte exacto que la tesis usa.
- **El minuto termina en la solución y no en el problema.** Después del lineal queda el
  overlay, el más liviano de los tres, así que el último cuadro del break es el partido
  a la vista con publicidad encima.

**Descartado: el lineal primero.** Pone la comparación antes de que haya algo con qué
comparar, y arranca el minuto con la imagen del problema. **Descartado: el lineal
último.** Cierra con la pantalla tapada, que es terminar en el problema. **Descartado: el
lineal afuera del minuto**, en un break propio antes de la parada. Es más fiel a cómo
sería en aire y rompe lo de arriba: la comparación deja de ser inmediata y el minuto de
hidratación deja de ser el único break de la demo.

### D8 — El corrimiento de la parada del juego se declara una vez en la demo

El plate se arma concatenando clips y la parada del juego cae en un segundo que decide
esa edición. El `RECORRIDO` del script de señalización tiene que poner el break
exactamente ahí, y si los dos números se escriben a mano en dos archivos, la demo
completa se corre de lugar la primera vez que alguien reedita el plate.

**Decisión.** El corrimiento de la parada es **un valor declarado una vez** en la demo,
y los dos scripts —el que empaqueta el contenido y el que señaliza— lo leen de ese
lugar. Es el mismo criterio que la cadena de arriba, aplicado al único eslabón que no
puede leerse del contrato porque todavía no hay player: el plate no está en git
—`content/` está gitignoreado— así que el número no puede vivir en el material.

**Y el suite de la demo lo chequea**, que es lo que hace que la decisión no sea un
acuerdo verbal: el break que el script señaliza tiene que arrancar en el corrimiento
declarado.

### D9 — Lo pictórico se genera, la tipografía se compone, y el movimiento se genera sólo donde la tipografía puede irse de cuadro

**Decisión.** Tres caminos, y el corte es por tipo de pieza y no por comodidad:

- **Lo pictórico se genera**: la lata, el zapato, la foto del destino, el fondo del
  panel. `agy` tiene una herramienta `generate_image` con siete proporciones y hasta
  tres imágenes de referencia para editar o componer; el skill `antigravity-cli` quedó
  actualizado con lo medido. Vertex `gemini-2.5-flash-image` también anda.
- **La geometría y la tipografía se escriben a mano como SVG**: el marco de la L, el
  banner, el scorebug, el reloj, el bug de canal, los wordmarks y todo el texto chico.
  Rasterizado con Chrome headless, que da alfa real y dimensiones exactas.
- **El movimiento se genera con Veo**, y sólo en el spot lineal de diez segundos.

Las dos primeras las decide una medición y no una preferencia: **la L generada volvió
como la foto de una L dentro de un rectángulo negro, sin alfa y con las dimensiones
equivocadas, y la versión SVG compuso perfecto en el primer intento**; el titular grande
sale tipográficamente perfecto y **el texto chico sobre el producto sale deformado.**

**La tercera la decide una corrida, y es la que fija dónde el movimiento sirve y dónde
no.** Medido en `cto-assistant-501315` con `veo-3.1-fast-generate-001` en `us-central1`,
dándole como entrada la imagen fija de una marca de fantasía: 8,0 s de 1920×1080 a
24 fps, h264, 25.353.878 bytes, **sin pista de audio**, en 118 s de generación por
`:predictLongRunning` más polling de `:fetchPredictOperation`. El archivo y tres cuadros
extraídos están en
`/home/nicolas/Develop/ai_workspace/cto-assistant/sandbox/veo-neonectar-8s-2026-09-09.mp4`.
Tres cosas mirando los cuadros:

1. **Honra el primer cuadro.** El frame 0 es la imagen de entrada, con el titular y el
   tagline intactos y legibles. Y sale a 1920×1080 exactos, que es algo que el generador
   de imagen no hace.
2. **Mejora el texto chico pero no lo garantiza.** En la imagen de entrada el texto de la
   botella era un renglón de caracteres dados vuelta —`S9KIMLING BOTANICAL SODL`— y en el
   video se lee `SPARKLING BOTANICAL SOOL`: legible, y con una palabra todavía mal.
3. **Y el hallazgo que fija la regla: el titular se va de cuadro cuando la cámara
   empuja.** En el último cuadro no está, y lo que queda es un plano de producto sin
   tipografía. No es un defecto del modelo —no hay nada deformado ni desaparecido en los
   cuadros mirados— es lo que hace un movimiento de cámara.

**De ahí sale el reparto, y es lo contrario de lo que la comodidad sugeriría:**

- **El spot lineal de diez segundos se genera con Veo, y la tipografía vuelve al final
  compuesta con SVG.** Es mejor así y no un remiendo: la tipografía queda exacta en lugar
  de que el modelo la re-renderice, y el movimiento se usa para lo que sirve, que es la
  parte pictórica.
- **Los formatos no lineales —la L, el banner inferior, el panel— siguen siendo imagen
  fija con la tipografía compuesta.** Ahí el texto tiene que quedarse quieto y legible
  durante todo el break, así que un movimiento que se lleva el titular es exactamente lo
  que no se quiere. Es la misma razón por la que la geometría es SVG, aplicada al tiempo
  en lugar del espacio.

**Dos trampas de instrumento que esta medición dejó, y las dos son del mismo tipo que el
hallazgo de la fase 07.** La primera: **los ids de modelo se buscan en la documentación y
no se inventan.** Los `-preview` no existen más y los vivos terminan en `-001`
(`veo-3.1-fast-generate-001`, `veo-3.1-generate-001`), y el 404 de un id retirado dice
*"was not found **or** your project does not have access to it"*, que **no distingue las
dos cosas**: probar candidatos hasta que uno responda mide la lista de candidatos y no la
disponibilidad. La segunda: **con un cuerpo vacío el chequeo no puede dar otra cosa que
un 400**, porque la validación corre antes del lookup del modelo. Los tres resultados
sobre el mismo endpoint dicen cosas distintas y sólo uno dice algo: `{}` da
`400 Empty instances.` exista el modelo o no; `{"instances":[{}],"parameters":{}}` da
`404 ... does not have access` sobre un id retirado y `400 No inputs provided` sobre uno
vivo, que es el que confirma el acceso.

**Del costo, leído y no medido**: la variante fast está entre US$0,10 y US$0,15 por
segundo según la documentación, o sea del orden de un dólar el clip. **No está verificado
contra la factura.**

**El chequeo de vestido comercial es un paso y no una nota**, y aplica igual al video
generado. El dato que lo obliga está medido: **el generador deriva hacia el vestido
comercial real incluso cuando se le prohíbe explícitamente.** Con la pipa de Nike y las
tiras de Adidas prohibidas en el prompt, el zapato volvió con un destello lateral curvo
incómodamente parecido a una pipa; y un fondo de fútbol no pedido salió con una camiseta
parecida a la de un club conocido, con parche de sponsor en el pecho.

Así que **cada creativo generado pasa un chequeo humano de vestido comercial antes de ir
a pantalla**, y eso entra en la definición de done de la task que produce los creativos,
no en un párrafo del README. Marcas de fantasía sí; imitación de vestido comercial real
no: nada de script cursivo blanco sobre rojo para la cola, nada de pipa para los
zapatos.

### D10 — El banner inferior es una imagen fija, y eso es una capacidad que la demo demuestra

**Decisión.** El primero de los tres avisos no lineales es una **imagen fija** y no un
video, y el guion lo nombra: el minuto muestra **tres formas de aviso** —lineal a cuadro
entero, imagen fija no lineal, video no lineal— en lugar de dos. Es un argumento y no un
asset, porque lo que demuestra es que el mecanismo acepta las dos cosas.

**Y no cuesta trabajo nuevo: está construido, verificado, y ya corre en la demo actual.**
Medido leyendo el repositorio:

- El elemento del layout declara su MIME y el renderer decide con él: `isImage` mira el
  `mediaType` y `build` crea un `<img>` en lugar de un `<video>`
  (`lib/renderer.js:80` y `:294`). Nada más cambia en el camino.
- **Los tres lugares donde una imagen no es un video ya están resueltos**, y son de la
  fase 01: una imagen no entra en `playable()`, así que el `play`, el `pause` y el seek
  del primario no la tocan; `applyAudio` la saltea, porque una fija no tiene audio; y el
  aviso de asset cortado no aplica, porque no hay nada que cortar.
- El asset list ya tiene la forma: `asset-list-squeezebackLShape-image.json`, donde los
  elementos declaran `"type": "image/jpeg"` y un `uri` a un `.jpg`. Es el break 3 del
  recorrido de la demo actual, "LBox image", y es uno de los cinco layouts del documento
  de requerimientos.
- La ventana la declara la señalización y no el asset, que es lo que hace que una imagen
  —que no tiene largo propio— pueda ocupar un tramo del break igual que un video. Es la
  regla que la fase 03 midió y dejó escrita: **la ventana declarada decide.**

**Lo que sí obliga es una restricción de autoría del creativo, y es concreta.** El ADR
0013 llena cada caja con recorte centrado y sin deformar (`object-fit: cover`), así que
una imagen que no tiene la relación de aspecto de su caja **se recorta**, y lo que se
recorta son los bordes, que es donde vive la tipografía de un banner. Así que el banner
se escribe como SVG **a la relación de aspecto exacta de su caja**, calculada de los
porcentajes del `viewport` sobre el área de la imagen. Es una cuenta y la hace la task.

Encaja con D9 en lugar de tensionarlo: los formatos no lineales ya iban a ser imagen fija
con la tipografía compuesta, porque el texto tiene que quedarse quieto y legible durante
todo el break. Esta decisión toma eso y lo convierte en algo que la demo **dice**.

**Descartado: que las tres formas no lineales sean video** y que la capacidad de imagen
se cuente en el README. Un README no lo lee nadie en escenario, y la capacidad se ve en
un cuadro.

## Los assets, y las trampas legales que ya están medidas

El anexo completo está en
`/home/nicolas/Develop/ai_workspace/cto-assistant/sandbox/contenido-demo-hls-ig-2026-09-09.md`,
y se sostiene salvo en una fila de su tabla de herramientas: la que dice que no hay
generación de video en este proyecto. Sí la hay, con los ids vigentes de Veo, y está
medido corriéndolo (D9). Todo lo demás del anexo queda en pie. Lo que decide esta fase:

**El contenido está decidido: partido amateur limpio de derechos, más los gráficos de
transmisión hechos por nosotros.** Es decisión de Nicolás y coincide con lo que la
investigación recomendó por su lado.

Por qué esa es la única vía: **el mercado se parte en dos y no hay dinero que cierre la
grieta.** Todo lo que *parece* una transmisión es un partido profesional real con
derechos de liga, club y sponsors —escudos, camisetas con sponsor, vallas LED, alfombra
del círculo central—, y todo lo que es *legalmente limpio* es metraje amateur que no
parece una transmisión. Lo que cierra la grieta es **el paquete de canal ficticio**:
con un bug de canal, un scorebug y un reloj inventados en la esquina, el ojo lee la
imagen como un feed. **Es la pieza de mayor palanca de toda la lista de assets**, y es
SVG.

Tres correcciones a premisas que pueden estar dando vueltas:

- **Pagar stock no compra indemnidad.** La licencia más generosa del mercado cubre sólo
  archivos **sin alterar** y exactamente como se bajaron, cubre copyright y no marcas, y
  excluye explícitamente lo que venga de una marca representada adentro del archivo. Un
  overlay de publicidad es alteración. La razón para pagar es otra —un clip filmado a
  propósito no tiene derechos de liga por debajo— y la decisión tomada la hace
  irrelevante para esta fase.
- **Los clips gratis que "parecen transmisión" son grabaciones de hinchas en partidos
  profesionales reales**, y ninguna de esas páginas trae una advertencia: todas dicen
  "free to use" y la restricción vive sólo en los términos del sitio. La indemnidad
  corre al revés, uno indemniza al banco de stock.
- **El riesgo de vestido comercial es de dilución y no de confusión**, así que no hace
  falta que nadie se confunda ni que compitamos con el dueño de la marca. Y la sala es
  la sala equivocada para probarlo: el público del HLS Interest Group son ingenieros de
  broadcast y ad-tech, gente que trabaja para, le vende a, o protege exactamente a esos
  anunciantes. Una imitación visible se lee como descuido y le baja credibilidad a la
  capacidad que se está mostrando.

Una restricción concreta sobre la selección del plate, que sale del anexo y no se
inventa acá: **los clips más limpios de técnico y equipo muestran lo que parecen
menores, y no hay releases.** Para una demo pública se prefieren clips de adultos aunque
encuadren peor.

Lo que hay que producir, con el esfuerzo medido del anexo:

| pieza | esfuerzo | cómo |
| --- | --- | --- |
| identidad de las tres marcas de fantasía | 2–3 h | wordmarks SVG a mano, imágenes generadas, más el chequeo de vestido comercial |
| creativos no lineales: L, banner, overlay | 2–3 h | SVG con alfa real, cada uno a la relación de aspecto exacta de su caja (D10) |
| spot lineal de 10 s | ~2 h | imagen generada, movida con Veo, y la tipografía compuesta encima con SVG; más una cama musical CC0, porque Veo sale sin audio |
| paquete de canal ficticio: bug, scorebug, reloj, equipos inventados | 2–3 h | SVG quemado sobre el plate |
| armado del plate: buscar, recortar, concatenar a ~90 s, ambiente | ~4 h | los clips gratis son de 7 a 20 s, así que hay que concatenar varios |
| **total** | **≈ 1,5 a 2 días de una persona** | |

**Lo que no se consigue a ningún precio**, dicho sin vueltas: un feed real de
transmisión en vivo con una parada en juego real. La demo tiene que **representar** una
parada, no **ser** una.

## Lo que esta fase NO hace

Es la mitad del valor del diseño, porque una demo "linda" es un pozo sin fondo.

- **No toca `demo/compatibility-pair/`.** Ni una línea, ni un píxel. Es la demo técnica
  y su objetivo sigue siendo válido.
- **No cambia la librería.** La superficie pública queda igual y el contrato entre las
  dos capas queda igual. Si la página necesita algo que la sdk no da, eso se reporta
  como hallazgo (D4).
- **No agrega un layout ni una capacidad al mecanismo.** Los cinco layouts están, el
  aviso lineal está, la mezcla está, el foco está.
- **No hay par de compatibilidad en esta página**, ni un segundo
  `EXT-X-DATERANGE` de la clase de Apple. La comparación va en el tiempo (D7).
- **No hay narración ni TTS.** Tipografía, y nada más. Fue explícito.
- **No hay iOS.** Sigue siendo de Emil y de otra conversación.
- **No hay stream en vivo de verdad.** Es un VOD con los Date Ranges en la media
  playlist (ADR 0005), igual que la demo actual, y el plate representa una parada del
  juego en lugar de serla.
- **No se filma nada y no se compra stock.** La decisión de contenido lo resuelve, y
  con eso la pregunta del tier de Storyblocks se cae sola.
- **El metraje del programa no se genera**, y esto es lo primero que hay que leer junto
  con D9: **el generador de video está disponible y aun así el plate se construye.** El
  argumento nunca fue la falta de acceso, así que tenerlo no lo mueve. Es que un minuto
  pide seis o más generaciones de 8 a 10 segundos que tengan que coincidir en estadio,
  camiseta, luz y posición de cámara, y los modelos de hoy no sostienen eso. Y el
  público del HLS Interest Group mira video por trabajo: un miembro que se deforma, una
  pelota que desaparece o una textura de tribuna que repta se van a notar, y van a
  distraer del mecanismo que se está mostrando. Un spot de producto de ocho segundos con
  un solo movimiento de cámara es el caso donde el modelo hoy es bueno; un minuto de
  partido con continuidad no lo es.
- **No hay diseño responsive completo.** El objetivo es la grabación y la sala. El
  celular tiene que ser **usable** —Nicolás prueba desde ahí, y es de donde salieron las
  fases 04 y 07— y no tiene una versión propia.
- **No hay teclado ni accesibilidad sobre la página.** Misma razón que en las fases 06 y
  07: no está en el pedido y la vara es la de un POC.
- **No hay ad server, ni VAST, ni telemetría, ni analytics.** El asset list es un
  archivo servido de la carpeta de la demo, como en la demo actual.
- **No hay internacionalización.** La página en inglés, y punto.
- **No se pule.** Un POC no se pule: la vara es que la pantalla cuente el caso, no que
  la transición esté en la curva correcta.

Y una que no es de alcance sino de reuso, y conviene dejarla escrita: **si esta demo
se va a reusar comercialmente** —llamadas de venta, el sitio, un loop en un stand— la
decisión de contenido se reabre, porque filmar el plate propio pasa a ser la opción
barata. Hoy se diseña para la sala del HLS Interest Group y nada más.

## Riesgos

**R1. El plate no aparece.** El material limpio son clips de 7 a 20 s y hay que
concatenar varios para llegar a ~90 s con tres actos, y la parada del juego es la parte
más difícil de encontrar en material amateur. Mitigación: el paquete de canal ficticio
es lo que hace que casi cualquier metraje limpio se lea como transmisión, así que se
produce **primero** y no último; y la parada se puede armar con un plano de técnico y
equipo que no tiene que ser del mismo partido que el juego, porque una transmisión real
también corta de plano.

**R2. El generador deriva hacia el vestido comercial real.** Está medido y pasó dos
veces en la investigación, con la prohibición escrita en el prompt. Mitigación: el
chequeo humano de vestido comercial es un paso de la definición de done de la task de
creativos (D9), no una recomendación.

**R3. El trabajo de assets es de 1,5 a 2 días de una persona, y es la misma persona que
la librería.** No es un riesgo de fecha —esta demo no tiene una— es de secuencia: la
página no se puede empezar si primero hay que juntar el plate. Mitigación: **la página se
construye contra el contenido de la demo actual como suplente.** El plate y los creativos
entran cuando estén, y hasta entonces el guion se resuelve igual porque se ancla a la
señalización y no al material (D1). Los dos frentes no se bloquean, y ninguno de los dos
espera al otro para arrancar.

**R4. La página se convierte en un pozo sin fondo.** "Linda" no tiene criterio de
terminado. Mitigación: la sección de fuera de alcance, el tope de cuatro secciones, y
que el criterio de aceptación de la fase sea el de los treinta segundos y no una lista
de refinamientos.

**R5. El guion y el player se pelean.** Un beat frena el programa y el usuario lo
despausa, o al revés. Mitigación: D6, una sola salida, y el botón visible durante toda
la demo guiada.

**R6. Frenar la composición en medio de un aviso está leído en el código y no medido en
el navegador.** Es la propiedad sobre la que se apoya el guion entero: si el `pause` del
primario no congelara las cajas de video del aviso, la placa aparecería sobre un aviso
que sigue corriendo y el mecanismo de la demo guiada se cae. Mitigación: **es lo primero
que la fase mide**, antes de escribir el guion, y se mide en el break de cuatro avisos y
no en uno de un aviso solo.

**La fecha no es un riesgo de esta fase, y es una decisión de Nicolás y no una pregunta
pendiente.** El proyecto corre contra el evento del 7 de octubre y la ventana de
grabación del 28 al 30 de septiembre; **esta demo no está atada a ninguna de las dos.**
Está escrito acá, donde estaría el riesgo, porque el lugar donde no está es el que hace
que alguien lo vuelva a levantar: la fecha **no se pregunta de nuevo**.

## Arquitectura del producto y documentación

El proyecto no tiene `docs/arc42/` y esta fase no lo crea: los dos documentos de
`docs/` cumplen ese papel para el único lector que tienen, quien construye con la sdk.
**Ninguno de los dos cambia**, porque la superficie pública de la librería y el
contrato entre las dos capas quedan iguales (D4). Si al ejecutar resulta que alguno
tenía que cambiar, eso es el hallazgo de D4 y no un edit silencioso.

Lo que sí se escribe, y sale de un ADR que ya existe: el **ADR 0025** dice que el README
de la raíz enruta y cada demo cuenta su corrida. Así que la fase entrega
`demo/<slug>/README.md` con lo que la demo necesita antes de correr, qué pone en
pantalla y qué esperar mientras corre —incluido el paso de encender el audio una vez al
empezar, que es el mismo de la demo actual y por la misma política de autoplay—, y una
fila nueva en la tabla de `demo/` del README de la raíz que diga **qué argumenta** esta
demo. La atribución de las licencias del material va en el `CREDITS.md` de la demo y en
la página, como en la actual.

## Verificación

`npm test` y `npm run check` en verde, y la corrida mirada entera.

**La demo nueva trae su propio suite**, adentro de su carpeta, que es lo que el ADR 0023
deja como única forma: `test/` lee `test/` y `lib/` y nada más, así que lo que chequea la
forma de una corrida vive en la demo. `node --test` lo descubre sin argumentos.

Tres chequeos, y el primero es el que hace que D1 sea una propiedad y no una intención:

1. **Cada ancla del guion nombra un break y un aviso que existen.** Se resuelve el guion
   contra la señalización de la demo —el `RECORRIDO` del script y los asset lists— y toda
   ancla tiene que caer en un rango y en un aviso que están ahí. Un guion que referencia
   el aviso 4 de un break que tiene tres es lo que este chequeo agarra, y es exactamente
   el modo en que la desincronización va a volver a aparecer.
2. **El break arranca en el corrimiento declarado de la parada** (D8).
3. **El asset list del break declara cuatro avisos, exactamente uno sin bloque de
   layout** —el lineal del ADR 0019, y está tercero— **y exactamente uno cuyos elementos
   son `image/*`**, que es el banner de D10. Las tres formas del minuto quedan asertadas
   en lugar de confiadas al que edite el archivo.

Y una condición sobre el chequeo 1, que sale del hallazgo de la fase 07 —**un chequeo
negativo pide su control**—: el chequeo tiene que poder fallar, así que se verifica con
un ancla deliberadamente equivocada antes de darlo por bueno. Es la segunda vez en este
proyecto que un chequeo escrito de buena fe no podía fallar, y no va a ser la tercera
acá.

Lo que **no** se verifica con tests: la página. Es interfaz, el error está en la
pantalla, y lo que corresponde es mirarla —una captura por estado del guion y la corrida
entera mirada de punta a punta—, que es el nivel de verificación que las fases 04, 06 y
07 usaron para el cromo.

## Quién mira

**Sin fecha, y es decisión tomada.** Las fechas del proyecto —el draft del 21 de
septiembre, la ventana de grabación del 28 al 30, el evento del 7 de octubre— gobiernan
la librería y no gobiernan esta demo. No se planifica contra ninguna de ellas y no se
vuelve a preguntar.

Lo que la fase sí tiene es una diferencia de naturaleza con las siete anteriores, y esa
no cambia: **es la primera cuyo entregable es lo que se ve en escenario y no lo que lo
hace posible.**

Quien mira es Nicolás, y lo que mira son los treinta segundos: abrir la página, no tocar
nada, y ver si el caso de negocio llegó.
