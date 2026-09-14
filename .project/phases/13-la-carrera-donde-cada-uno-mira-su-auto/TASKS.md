# Tasks — fase 13-la-carrera-donde-cada-uno-mira-su-auto

| id | brief | status | plan | evidence |
| --- | --- | --- | --- | --- |
| T-01 | El mundo, los seis autos, el plan de tomas y `race.json`. Sin generar nada | done | — | [`tasks/T-01-el-mundo-y-los-autos/`](tasks/T-01-el-mundo-y-los-autos/el-mundo-y-los-seis-autos.md) |
| T-02 | El sondeo de dos clips, antes de gastar en catorce | done | — | [`tasks/T-02-el-sondeo-de-dos-clips/`](tasks/T-02-el-sondeo-de-dos-clips/el-sondeo.md) |
| T-03 | El programa: catorce cortes entre autos, con su ambiente dirigido | done | — | [`tasks/T-03-el-programa/`](tasks/T-03-el-programa/los-catorce-clips.md) |
| T-04 | Los dos relatores, y el anuncio anclado al segundo en que abre la ventana | done | — | [`tasks/T-04-el-relato-y-el-montaje/`](tasks/T-04-el-relato-y-el-montaje/el-relato-y-el-montaje.md) |
| T-05 | La cámara de a bordo del que va adelante: ocho clips, sesenta y cuatro segundos | done | — | [`tasks/T-05-la-camara-de-a-bordo/`](tasks/T-05-la-camara-de-a-bordo/la-camara-de-caldrix.md) |
| T-06 | La cadena: el concat y el empaquetado a 24 fps | done | — | [`tasks/T-06-la-cadena/`](tasks/T-06-la-cadena/la-cadena-a-24-fps.md) |
| T-07 | La señalización, el asset-list y el test de la demo | done | — | [`tasks/T-07-la-senalizacion/`](tasks/T-07-la-senalizacion/la-senalizacion-y-la-demo-corriendo.md) |
| T-08 | Las cinco cámaras restantes | todo | — | — |
| T-09 | La página, los créditos y el README | todo | — | — |
| T-10 | La no-regresión y la publicación | todo | — | — |

**Las tasks están agrupadas en tres etapas y el orden es el de las etapas.** El reparto,
sus techos de gasto y qué queda en disco si se aborta están en `PHASE.md`, que es el
contrato; acá van una vez, en la tabla de abajo, para que quien ejecute no tenga que
cambiar de archivo para saber cuándo parar.

| etapa | tasks | techo de generaciones | techo en US$ |
| --- | --- | ---: | ---: |
| **1. El programa** | T-01 a T-04 | **28** (2 del sondeo + 26 del programa) | **22,40** |
| **2. Una cámara** | T-05 a T-07 | **16** | **12,80** |
| **3. Las cinco restantes** | T-08 a T-10 | **72** | **57,60** |

**Entre una etapa y la siguiente la fase se detiene, y eso no es una task que espera.**
Cada task de este archivo termina entregando algo y ninguna queda a mitad de camino: la
última de cada etapa cierra con el material de la compuerta puesto donde se lo pueda mirar,
y la primera de la etapa siguiente arranca cuando la fase vuelva a correr. Ninguna task
dispara una generación de una etapa que todavía no arrancó.

**La T-01 no gasta un centavo de Veo a propósito.** Todo lo que se puede decidir en papel
—el párrafo del mundo, los seis autos, el plan de tomas, los números de la demo— se decide
antes de la primera generación, para que el sondeo de la T-02 pruebe algo que ya está
escrito y no sirva de excusa para pensarlo mientras se genera.

**La T-04 va después de la T-03 y no en paralelo.** Los relatores cuentan lo que está en
pantalla, así que el montaje del programa tiene que estar cerrado antes de que se escriba
una línea. Es la misma dependencia que la demo del partido resolvió atando tres instantes
de voz al gráfico.

**La cadena, la señalización y la página no se construyen en la etapa 1.** Podrían
construirse contra un contenido de reemplazo y adelantar el camino crítico, y se descartó:
la forma de esta fase existe para no hacer trabajo que puede tirarse, y un descarte en la
compuerta 1 se llevaría puesto todo eso sin que nadie lo hubiera mirado. En la etapa 2 se
construyen contra el contenido real, que es mejor material de prueba que cualquier
reemplazo.

**No hay task de documentación de `docs/`** y está argumentado en `PHASE.md`: la fase no
cambia ninguno de los dos. La documentación que sí produce —los prompts y el porqué de cada
línea— va en las cabeceras de los scripts que los ejecutan (ADR 0061), así que la escribe
la misma task que los escribe.

**Y no hay task de tests aparte.** El default del proyecto es que lo que se construye viaje
con sus chequeos: la aserción del anuncio es de la T-04 y la de los largos es de la T-06.
La T-10 es otra cosa: no testea lo que la fase construye, verifica que lo que ya existía
sigue en pie.

---

# Etapa 1 — el programa

## T-01 — El mundo, los seis autos, el plan de tomas y `race.json`

- **Objective:** que todo lo que se puede decidir sin generar esté decidido y escrito, y
  que los números de la demo existan en un solo archivo. Importa porque es lo que hace que
  el sondeo de la T-02 mida un prompt y no una idea a medio formar, y porque es la única
  task de la fase cuyo error se corrige gratis.

- **What it must cover:**
  - **La línea de base de la fase, medida antes de tocar nada** y guardada como evidencia:
    `npm test`, `npm run check` y `npm run mutaciones`. `PHASE.md` dice que sobre el commit
    `1767254` son 184 pruebas en verde y las dos costuras verdes, con tres ocurrencias
    aceptadas en la primera: la task **anota el número que le da a ella**, y si no coincide,
    eso es lo que reporta.
  - **El precio vivo, releído, antes de que exista la primera generación.** Las cabeceras
    de `generar-parada.sh` y `generar-la-l.sh` dicen US$0,08/s y ese comentario quedó viejo;
    los techos de esta fase están calculados a **US$0,10/s** para `veo-3.1-fast-generate-001`
    a 720p, o sea US$0,80 por clip de 8 s. Se relee la página de pricing de Vertex y **se
    escribe el número que dice ese día, con la fecha**. Si difiere, la task recalcula los
    tres techos con el número nuevo y los deja escritos: **el techo es en dólares y las
    generaciones son la consecuencia**, no al revés.
  - **El párrafo del mundo.** Un solo párrafo —circuito, clima, hora del día, qué se ve más
    allá de la pista— que va a encabezar todos los prompts idéntico. Es lo único que hace
    que siete piezas generadas por separado se lean como la misma carrera.
  - **Los seis autos, decididos acá.** Un color dominante y un acento por auto, y un nombre
    de equipo inventado. La task los elige con tres criterios y no consulta a nadie:
    **(a)** los seis colores se distinguen entre sí en una caja de media pantalla, y quedan
    afuera el rojo, el naranja papaya, el verde oscuro, el plateado y la combinación azul
    con cian, por ser identidades de equipos reales; **(b)** ningún nombre evoca un equipo
    ni un piloto de la parrilla actual, contrastado contra la parrilla y no contra la
    memoria; **(c)** cada nombre se sintetiza una vez con la voz que lo va a decir y se
    escucha, porque en la demo del partido hubo que mandarle **"Norvick"** al sintetizador
    para que no dijera *Norwich*. La ortografía que se le manda a la voz puede ser distinta
    de la que se escribe en el selector, y si lo es, se anota al lado.
  - **Las seis fichas de auto**, generadas con `agy` y su `generate_image`, que va contra la
    suscripción y no contra la tarjeta: cuestan **US$0**. Van al repositorio, como
    `kalto-shoe` y las otras dos, porque son livianas.
  - **Ni números ni patrocinadores en el auto, y el prompt no los menciona.** El ADR 0045 y
    el 0062 ya midieron que la tipografía adentro del cuadro generado vuelve deformada. Un
    número de auto es tipografía: pedirlo es pedir un número ilegible. El auto se reconoce
    por el color; el nombre vive en la fila del selector, que es texto del navegador.
  - **Donde el prompt prohíbe, describe la alternativa.** Es la lección medida de la fase
    08 y su otra mitad también vale: describir de más le da permiso. *"Liso"* no es una
    alternativa.
  - **El audio se dirige, y no se da por sentado.** El prompt describe qué se oye —motores,
    gomas, aire, el público lejos— porque un prompt que no menciona el sonido devolvió
    diálogo en inglés en la demo del partido.
  - **El plan de tomas del programa**: catorce casillas de ocho segundos, con qué auto y qué
    clase de toma va en cada una. **La casilla que cubre el segundo 28 tiene que admitir el
    anuncio**: nada de choque, entrada a boxes ni bandera, porque ahí una línea que dice que
    las cámaras están disponibles no tiene dónde caer. Es una restricción del plan y no del
    montaje, y por eso se resuelve acá y no después.
  - **`race.json`, la única fuente de los números de la demo**: `fps`, el largo del
    programa, `ofertaEn`, `ofertaDura`, y la lista de feeds con su `id`, su `name` y su
    color. Es el ADR 0044 aplicado de nuevo. Lo van a leer el armado del audio, el
    empaquetado y la señalización, y **existe desde acá** para que la T-04 pueda assertar
    contra él sin esperar a la etapa 2.
  - **Entry points:** `demo/hydration-break/graphics/creativos/fuentes/README.md`, que es
    la receta y los cinco modos de falla; `demo/hydration-break/plate.json` por la forma del
    archivo de números; los ADR 0044, 0045, 0059, 0061 y 0062.
  - **Constraints:** **cero generaciones de Veo en esta task.** Nada fuera de
    `demo/race-multiview/` y de la carpeta de la fase. No se toca `lib/`. Los temporales van
    a `/dev/shm`.

- **Definition of done:** existen el párrafo del mundo, la ficha y el prompt de los seis
  autos, las seis imágenes en el repositorio, el plan de catorce tomas con su casilla del
  segundo 28 marcada, y `race.json`. Está escrito el precio del día con su fecha y los tres
  techos recalculados si cambió. Está escrita la línea de base de los tres comandos. El
  gasto de Veo de esta task es cero y eso se ve en que no hay un solo mp4 nuevo.

- **nivel de verificación:** **alto para el precio y la línea de base, bajo para el resto.**
  Lo que se verifica con instrumento es el precio y los tres comandos. Lo demás es papel, y
  su chequeo es la T-02.

## T-02 — El sondeo de dos clips, antes de gastar en catorce

- **Objective:** saber si el párrafo del mundo y la ficha de los autos devuelven una
  carrera, con dos generaciones en lugar de catorce. Importa porque es la diferencia entre
  descubrir un prompt equivocado por US$1,60 y descubrirlo por US$16,80.

- **What it must cover:**
  - **Dos generaciones y ni una más**, las dos de clase programa —una toma de un auto
    pasando y una de dos autos peleando—, con el párrafo del mundo al frente y el prompt
    tal como lo dejó la T-01. **US$1,60.**
  - **Se miran contra el brief y no contra el gusto**, y lo que se mira está enumerado
    porque enumerarlo es lo que hace que el sondeo sirva: que se lea como una carrera y no
    como un auto de calle; que la librea sea la que la ficha describe y no una que se
    parezca a una real; que los dos clips parezcan el mismo circuito, el mismo clima y la
    misma hora; que la tipografía no haya aparecido sola; y que el audio no traiga habla,
    comprobado con la transcripción y no de oído.
  - **La lámina de contacto**, con una línea por clip diciendo qué se miró de cada uno.
  - **Si el sondeo no pasa, la task termina igual y su entregable es otro**: la lámina, la
    lista de qué falló, y el prompt corregido. Eso no es un fracaso de la task, es lo que la
    task existe para producir barato. La corrección puede costar dos generaciones más;
    pasadas **cuatro en total**, la task cierra con el diagnóstico escrito y sin insistir,
    porque a esa altura lo que falla no es la redacción sino el encuadre, y para eso está el
    R1 de `PHASE.md`.
  - **Entry points:** la T-01; `demo/hydration-break/scripts/generar-parada.sh` por el
    cuerpo del request, el `:predictLongRunning` y el polling de `:fetchPredictOperation`.
  - **Constraints:** los `.mp4` crudos van a `content/.fuentes/`, que está gitignoreado. No
    se toca `lib/`.

- **Definition of done:** existen dos clips —o hasta cuatro, con la razón escrita—, su
  lámina de contacto, y una línea por cada punto de la lista de arriba diciendo qué se vio.
  El total de generaciones y de dólares está escrito. El veredicto está escrito: el prompt
  queda como está, o queda corregido y se dice qué se le cambió.

- **nivel de verificación:** **bajo y a propósito.** Es una task de mirar. Lo único que
  lleva instrumento es la transcripción del audio, y su control es el de la T-03.

## T-03 — El programa: catorce cortes entre autos, con su ambiente dirigido

- **Objective:** que exista `programa.mp4`, 112,000 s exactos, catorce clips de ocho
  segundos que cortan entre los seis autos, con el audio de carrera que Veo genera y sin
  una palabra hablada adentro. Importa porque es lo que se ve a cuadro entero y lo que sigue
  viéndose adentro de una caja cuando la grilla está llena.

- **What it must cover:**
  - **Catorce generaciones sobre el plan de tomas de la T-01**, con el prompt que dejó la
    T-02 y el párrafo del mundo idéntico al frente de cada una.
  - **Se disparan en lotes y no de a una.** La regla de mirar una antes de encadenar el
    resto es de una cadena sembrada, y acá no hay cadena: los clips son independientes. Se
    lanzan de a diez por `:predictLongRunning`, se pollean juntos y se revisan en lámina de
    contacto. Es lo que convierte tres horas de modelo en una jornada de trabajo.
  - **El portón de transcripción sobre el audio de cada clip.** Se extrae el audio con
    `ffmpeg -vn`, se transcribe local con la misma herramienta con la que este proyecto
    transcribió los 64 s de la parada, y un clip cuya transcripción devuelva habla **se
    regenera**. Es la falla exacta que la demo del partido descubrió tarde. **El control:**
    la misma comprobación sobre uno de los clips de
    `demo/hydration-break/content/.fuentes/parada/`, que sí tiene diálogo, tiene que
    rechazarlo — y hay que verla rechazarlo.
  - **Los niveles se emparejan clip por clip.** En la parada del partido hubo 18 LU de
    dispersión entre ocho clips y cinco de los ocho clipeaban. Se normaliza cada uno antes
    de concatenar, y se mide antes y después.
  - **El concat es plano y no descarta ningún cuadro.** El `select=gte(n\,1)` de la fase 08
    existe porque el cuadro 0 de un eslabón sembrado es la versión que el generador hizo del
    último del anterior. Acá no hay siembra, así que **entran los 192 cuadros de cada clip**
    y 14 × 192 a 24 fps dan 112,000 s exactos. Si el resultado no da 112,000, hay un clip
    que no salió de 8 s y eso es lo que se reporta.
  - **El corte entre clips no se disimula.** Nada de fundidos: un corte cada ocho segundos
    es lo que hace un realizador de carrera, y un fundido encadenado es además el modo de
    falla que este proyecto describe como *"el que más cuesta ver"*.
  - **El techo de esta task son 26 generaciones**, unos US$20,80, que es lo que queda de la
    etapa 1 después del sondeo. Pasado el techo, **la task cierra con lo que tenga**: los
    clips buenos, la lámina, y cuáles casillas del plan quedaron sin cubrir. Un programa
    incompleto con su lista de huecos es mejor material de compuerta que una task que sigue
    gastando.
  - **El total corrido de generaciones y de dólares**, en la evidencia, sumado al de la
    T-02.
  - **Entry points:** la T-01 y la T-02; `demo/hydration-break/scripts/armar-plate.sh` por
    la forma del concat; `research/2026-09-11-audio-para-la-demo/informe.md`, secciones 1 y
    2, por las mediciones de audio de material generado.
  - **Constraints:** nada fuera de `demo/race-multiview/`. Los `.mp4` crudos van a
    `content/.fuentes/`. No se toca `lib/`.

- **Definition of done:** `programa.mp4` mide 112,000 s medidos con `ffprobe`, tiene 2688
  cuadros a 24 fps, y su transcripción no devuelve habla. El portón se vio rechazar el clip
  de control. La dispersión de sonoridad entre los catorce tramos está medida y escrita,
  antes y después de emparejar. La lámina de contacto está en `research/`, con el total de
  generaciones y de dólares.

- **nivel de verificación:** **medio.** Lo medible —duración, cuadros, sonoridad, habla— se
  mide con su control. Lo que se ve es mirar.

## T-04 — Los dos relatores, y el anuncio anclado al segundo en que abre la ventana

- **Objective:** que el programa tenga dos voces contando la carrera, y que la línea que
  anuncia las cámaras termine de decirse justo antes del segundo en que la señalización va a
  abrir la ventana. Importa porque es la mitad del pedido, porque es lo que convierte
  catorce cortes en una transmisión, y porque es el punto que Nicolás marcó: el anuncio
  tiene que caer **en** la ventana, no cerca.

- **What it must cover:**
  - **`gemini-2.5-flash-tts`, `en-GB`, dos voces repartidas por función**: Charon relata lo
    que pasa y Kore comenta por qué. Se reusan las dos de la demo del partido, con sus
    prompts de estilo adaptados a una carrera. La razón del reparto ya está escrita y vale
    igual acá: *"dos voces diciendo lo mismo suenan peor que una sola"*.
  - **El guion se escribe contra el programa ya montado de la T-03**, no contra una idea de
    carrera. Lo que se dice tiene que ser lo que está en pantalla en ese segundo, que es lo
    que la demo del partido hizo atando tres instantes de voz al gráfico.
  - **La línea del anuncio.** Termina de decirse en `[ofertaEn − 0,5 ; ofertaEn]`, o sea que
    la voz entra antes que el tag. Es lo que la demo del partido midió: el silbato cae 0,2 s
    antes de que el gráfico cambie, *"que es como pasa en una transmisión: primero se oye,
    después se ve"*. El segundo se lee de `race.json` y no se tipea.
  - **La aserción, que es la mitad de la task.** Se asserta que el fin hablado de la línea
    del anuncio cae en esa ventana de medio segundo, leyendo el segundo del mismo
    `race.json` del que lo va a leer el tag en la T-07. **El control, sin el cual no es un
    chequeo:** la misma comprobación sobre una copia con la línea corrida 3 s tiene que
    ponerse roja, y hay que verla ponerse roja.
  - **Una línea, un archivo, un nivel.** Cada línea se sintetiza sola y se normaliza sola a
    −20 LUFS, porque Kore sale unos 3 dB más fuerte que Charon y en una conversación eso se
    oye como que una está más cerca del micrófono.
  - **El portón de transcripción.** Ninguna línea entra a la mezcla sin que una
    transcripción diga qué dijo. El sintetizador tiene dos fallas intermitentes y las dos
    son invisibles en el archivo: **lee el prompt de estilo en voz alta** y **repite una
    frase**. Con el prompt largo original, cinco de quince líneas salieron cuatro veces más
    largas de lo pedido. La duración sola no alcanza: dice "raro", no dice qué se dijo. **El
    control:** una línea plantada a propósito con el prompt adentro tiene que ser rechazada
    por el portón.
  - **La mezcla**: las voces sobre el ambiente del programa, con el ambiente por debajo. En
    la demo del partido la cama va 12 dB debajo de las voces, y la razón se traslada: *"si
    compite con el relator, se pierden los dos"*. Acá el número se remide, porque el
    ambiente es otro.
  - **El relato no deja de hablar durante la ventana.** En la demo del partido hay un hueco
    de diez segundos porque el aviso lineal declara volumen 100 contra 0 del programa. Acá
    no hay aviso lineal y el programa suena durante toda la ventana, así que no hay hueco
    que justificar: lo que sí hay es que quien enfoque una cámara **deja de oír a los
    relatores**, y eso es lo correcto y es la demostración.
  - **El material de la compuerta, armado y puesto donde se lo pueda mirar.** Es lo último
    que hace esta task y es parte de su entregable: `programa.mp4` con el audio mezclado, la
    salida de la aserción del anuncio, la lámina de contacto de los catorce clips, y el
    total de dólares de la etapa 1. Un mp4 solo no alcanza para decidir si se sigue.
  - **Entry points:** `demo/hydration-break/audio/README.md` y `audio/guion.md`, que son el
    molde entero; `research/2026-09-11-audio-para-la-demo/pista-relator/`, por la forma del
    cuerpo de la llamada y la línea de tiempo; `demo/hydration-break/audio/medir.md`, por
    cómo se mide y dónde engaña cada medición.
  - **Constraints:** nada fuera de `demo/race-multiview/`. El audio sí va al repositorio,
    como en la demo del partido: son cientos de kilobytes, no video. Cero generaciones de
    Veo.

- **Definition of done:** existe el programa de 112,000 s con las dos voces y el ambiente
  mezclados. Existe el `guion.md` de la demo con la tabla de voz, entrada, salida, qué hay
  en pantalla y la línea. La transcripción de cada línea está guardada y el portón se vio
  rechazar la línea plantada. La aserción del anuncio pasa y se la vio fallar sobre la copia
  corrida. El material de la compuerta está junto y listado en un solo lugar.

- **nivel de verificación:** **alto.** Es la task con más propiedades medibles de la fase:
  la duración, el nivel por línea, el contenido de cada línea y el instante del anuncio. Las
  cuatro tienen forma de dar distinto.

---

# Etapa 2 — una cámara

## T-05 — La cámara de a bordo del que va adelante

- **Objective:** que exista un feed de 64,000 s exactos, la cámara de a bordo del auto que
  va adelante, cortando entre ángulos de esa cabina, con el audio de ese auto. Importa
  porque es la que tiene que representar a las otras cinco, y el criterio por el que es ésta
  y no otra está en `PHASE.md`.

- **What it must cover:**
  - **Ocho generaciones**, con el párrafo del mundo idéntico y la ficha del auto que va
    adelante. Los ángulos cambian entre clips —casco, morro, trasera—, que es lo que hace
    una transmisión real y lo que vuelve legítimo el corte cada ocho segundos.
  - **Las dos primeras se miran antes de disparar las otras seis.** No es una compuerta ni
    tiene ceremonia: es la misma disciplina de lote de la T-03, escrita porque acá la clase
    de toma cambia y el sondeo de la T-02 fue de clase programa.
  - **La cámara muestra su auto y no otro, y el auto es el del programa.** Es la propiedad
    que hace que el selector signifique algo, y es la única que se puede comprobar cruzando
    dos piezas: el color del auto en esta cámara contra el mismo auto en los clips del
    programa donde aparece. Si no se lee como el mismo auto, eso es el hallazgo de la etapa.
  - **El portón de transcripción, con el mismo control de la T-03.**
  - **El emparejado de niveles, igual que en la T-03.**
  - **El largo es exacto y no aproximado**: 8 × 192 cuadros a 24 fps son 64,000 s. Una
    cámara más corta que la ventana deja la caja vacía antes del final, que es lo que le pasa
    a Sintel en la demo de la fase 11 y que allá se declaró en vez de arreglarse. Acá el
    material se produce, así que se produce del largo correcto.
  - **El techo de esta task son 16 generaciones**, US$12,80, que es el techo entero de la
    etapa 2. Pasado el techo, la task cierra con lo que tenga y con cuántos de los ocho
    tramos quedaron.
  - **Entry points:** la T-01 y la T-03; el ADR 0014 y el ADR 0026 por la mezcla y el foco
    de audio; `demo/multiview-offer/scripts/preparar-contenido.sh` por cómo se declara un
    feed que no cubre su ventana, que es justo lo que acá no puede pasar.
  - **Constraints:** las mismas de la T-03.

- **Definition of done:** un archivo de 64,000 s medidos con `ffprobe`, 1536 cuadros a
  24 fps, con audio y sin habla. La lámina de contacto de los ocho clips, con una línea por
  clip. El cruce contra el programa está mirado y escrito: el auto de la cámara y el auto
  del programa son el mismo, o no lo son y se dice por qué. El total de dólares de la
  etapa 2.

- **nivel de verificación:** **medio**, más una comprobación que la T-03 no tiene: el cruce
  de la cámara contra el programa, que es la propiedad que esta etapa existe para medir.

## T-06 — La cadena: el concat y el empaquetado a 24 fps

- **Objective:** que un comando empaquete el programa y la cámara como VOD en HLS. Importa
  porque es lo que hace que `./run.sh race-multiview` funcione y porque el largo de cada
  pieza deja de ser una intención y pasa a ser algo que se mide.

- **What it must cover:**
  - **`empaquetar-contenido.sh` copiado del de `demo/hydration-break/`** y no del de
    `demo/multiview-offer/`. El de multiview tiene 1280×720, 30 fps y `-g 60` fijos y no
    toma audio; el de hydration-break toma `SRC OUT SS DUR CROP ANCHO ALTO FPS AUDIO` por
    argumento, que es lo que esta demo necesita. **Los dos dejaron de ser la misma copia y
    el comentario de multiview todavía dice "copia byte por byte": es un hallazgo previo, se
    reporta y no se toca.**
  - **24 fps y no 30**, porque el ADR 0059 manda empaquetar el video generado a la cadencia
    de su fuente y Veo entrega 24. El GOP sigue siendo `fps × 2`, o sea 48, para que los
    cortes caigan sobre keyframe.
  - **1280×720 para todo, programa y cámaras.** No se empaqueta cada cámara al tamaño de su
    caja, que es lo que hace la demo del partido con sus creativos, porque acá la caja cambia
    de tamaño en vivo cuando sube o baja otra cámara y una vista agrandada va casi a cuadro
    entero. Es lo que la demo de la fase 11 ya hace.
  - **Segmentos de 2 s y `EXT-X-PROGRAM-DATE-TIME`**, sin el cual un `START-DATE` no se
    puede resolver (ADR 0005).
  - **`preparar-contenido.sh`, con el guard de fuentes faltantes**: si no están los mp4 de
    `content/.fuentes/`, el script dice qué falta y cómo se genera, en lugar de fallar
    adentro de ffmpeg.
  - **La comprobación de largos, con su control.** Cada playlist tiene que sumar exactamente
    lo que su pieza declara en `race.json` —112,000 y 64,000— **medido sumando los
    `#EXTINF`** y no confiando en el `-t` que se le pasó a ffmpeg. Es la diferencia entre
    medir la salida y repetir la entrada. **El control:** una playlist recortada a mano tiene
    que dar rojo, y hay que verla dar rojo.
  - **Entry points:** `demo/multiview-offer/scripts/preparar-contenido.sh` por la forma del
    script; `demo/hydration-break/scripts/empaquetar-contenido.sh` por el recipe; los ADR
    0005, 0044 y 0059.
  - **Constraints:** nada fuera de `demo/race-multiview/`. No se edita el empaquetador de
    ninguna de las otras dos demos: se copia. `run.sh` no se toca. Cero generaciones de Veo.

- **Definition of done:** `./demo/race-multiview/scripts/preparar-contenido.sh` deja dos
  directorios en `content/` y cada playlist suma su largo exacto sumando `#EXTINF`. La
  comprobación de largos se vio fallar sobre una playlist recortada. Los números que la demo
  usa aparecen una sola vez en el árbol, y eso se comprueba con un grep que los busque en
  los demás archivos.

- **nivel de verificación:** **medio.** Hay una propiedad medible con su control y lo demás
  es un script que corre o no corre.

## T-07 — La señalización, el asset-list y el test de la demo

- **Objective:** que la playlist lleve un `EXT-X-DATERANGE` de la clase de multi view que
  abre en `ofertaEn` y dura `ofertaDura`, apuntando a un asset-list que ofrece la cámara que
  hay; y que la demo corra de punta a punta. Importa porque es la primera vez que el
  software lee lo que esta fase produjo, y porque es el material de la compuerta 2.

- **What it must cover:**
  - **`senalizar-contenido.sh`, con la forma del de `demo/multiview-offer/`**: la tabla del
    recorrido, el `START-DATE` resuelto contra el `EXT-X-PROGRAM-DATE-TIME` de la propia
    playlist, la clase derivada del `type` del payload y no tipeada, el `PLANNED-DURATION`
    derivado de sumar los `DURATION`, y la inserción con `awk` antes del primer `#EXTINF`.
    Los segundos salen de `race.json`.
  - **Un solo break y una sola ventana.**
  - **El asset-list, en la forma del ADR 0064 y sin un campo de más.** `type: "offer"` en el
    nivel del bloque, un item de `payload` con `type: "multiViewOffer"`, `start`, `duration`,
    `primaryName`, y `views[]` con `id`, `name`, `type` y `uri`. **Sin `viewport`, sin
    `zDepth` y sin `volume`**, que son los tres campos que una vista no declara y que la
    librería ignora con un warning. El `URI` de nivel superior del asset lleva el `uri` de la
    primera vista, que es el repliegue para un cliente que no lee el bloque.
  - **`views[]` tiene las entradas que hay, que en esta etapa es una.** Con una vista la
    grilla es de dos cajas y el mecanismo se ejercita entero igual: se sube, se agranda, se
    escucha ese auto, se baja, se sale. La lista se llena en la etapa 3 sin tocar el script.
  - **Los nombres de las filas salen del asset-list y son lo único que esta demo puede
    escribir en el selector.** El título del panel, el texto del popup y la línea de la
    grilla llena son literales de `lib/controls.js` y no se pueden cambiar desde acá. Si
    alguno queda mal para una carrera, **eso es un hallazgo y se reporta**, no se entra a la
    librería.
  - **El test de la demo**, con el molde de
    `demo/multiview-offer/test/signalled-run.test.js`: corre el script de señalización con
    `SRC`/`OUT` sobre una playlist mínima y cuenta los tags que salieron **de verdad**, en
    lugar de buscarlos en el texto del script. Importa las constantes de clase de la
    librería en vez de escribirlas, para que no se puedan desincronizar.
  - **La hoja de señales para quien mira la demo.** El script imprime, como el de la
    fase 11, la tabla del recorrido y qué mirar; acá además los segundos en que conviene
    subir la cámara, porque esta demo se maneja a mano y no tiene guion de placas.
  - **El material de la compuerta 2**, que es esta demo corriendo: se deja escrito el
    comando exacto con el puerto, qué se ve y en qué orden, y las capturas de la ventana
    abierta con la cámara arriba y agrandada.
  - **Entry points:** `demo/multiview-offer/scripts/senalizar-contenido.sh`,
    `demo/multiview-offer/signalling/asset-list-offer-5.json`,
    `demo/multiview-offer/test/signalled-run.test.js`; los ADR 0005, 0063, 0064 y 0066.
  - **Constraints:** nada fuera de `demo/race-multiview/`. No se toca `lib/`. Cero
    generaciones de Veo.

- **Definition of done:** `./run.sh race-multiview` levanta la demo **en un puerto que no
  sea 8080, 8081 ni 8082**, la ventana abre en el segundo declarado, el selector muestra el
  programa y la cámara, se sube, se agranda, se oye el auto y se sale. `npm test` pasa con
  el test nuevo adentro. Las capturas y el comando están escritos.

- **nivel de verificación:** **alto.** Es donde por primera vez se ve si lo que la fase
  produjo lo lee el software, y es el material sobre el que se decide si se generan las
  cinco restantes.

---

# Etapa 3 — las cinco restantes

## T-08 — Las cinco cámaras restantes

- **Objective:** que existan cinco feeds más de 64,000 s exactos, uno por auto, de modo que
  el catálogo tenga seis y sea más largo que la grilla. Importa porque el catálogo más largo
  que la grilla es la mitad del argumento de esta demo.

- **What it must cover:**
  - **Cuarenta generaciones**, ocho por cámara, con el párrafo del mundo idéntico y la ficha
    del auto que corresponde. Dos cámaras más de a bordo y tres de seguimiento, según el
    reparto del `DESIGN.md`. Las de seguimiento cortan entre posiciones de pista, que es lo
    que hace un realizador.
  - **El prompt que se usa es el que la T-05 dejó probado**, con la ficha del auto cambiada.
    Ése es el valor de la etapa 2 y es lo que hace que esta task sea la más mecánica de la
    fase a pesar de ser la más cara.
  - **Lotes de diez, lámina de contacto, portón de transcripción con su control, y
    emparejado de niveles**, igual que la T-03 y la T-05.
  - **Las seis cámaras se miran juntas, en una grilla**, que es la comprobación que ninguna
    task anterior pudo hacer: el defecto que importa acá —que no parezcan la misma carrera—
    sólo se ve comparándolas.
  - **El piso son cinco cámaras en total y no seis.** Si una cámara entera no sale usable
    dentro del techo, la demo se entrega con cinco y **eso no la rompe**: el argumento
    necesita que el catálogo sea más largo que la grilla, y cinco contra cuatro cajas ya lo
    es. La task baja a cinco, lo escribe, y sigue. Con menos de cinco en total, cierra con lo
    que tenga y con el conteo.
  - **El techo de esta task son 72 generaciones**, US$57,60, que es el techo de la etapa 3.
  - **Entry points:** la T-05, que es el molde entero.
  - **Constraints:** las mismas de la T-05.

- **Definition of done:** cinco archivos más —o menos, con el conteo y la razón escritos— de
  64,000 s medidos, cada uno con 1536 cuadros a 24 fps y con audio. Ninguna transcripción
  devuelve habla. Una lámina de contacto por cámara. La captura de las seis juntas, mirada.
  El total de dólares de la fase, sumado.

- **nivel de verificación:** **medio**, con la comparación en grilla como la única
  comprobación propia de esta task.

## T-09 — La página, los créditos y el README

- **Objective:** que la demo tenga su página en inglés, con la apertura, el player y dos
  secciones de scroll que se derivan de lo que el player está reproduciendo; y que el README
  cuente cómo se corre y cómo se regenera el contenido. Importa porque es lo que queda
  publicado después del evento.

- **What it must cover:**
  - **El boilerplate se copia y no se reescribe**: el bloque *WHAT AN INTEGRATOR WRITES* de
    `js/app.js`, el arranque muteado por política de autoplay, el `IntersectionObserver` al
    60 %, `js/dom.js`, `js/opening.js`, el markup de `#player` con su `isolation: isolate`,
    los tres `<script>` en su orden, y `brand/` byte por byte.
  - **Dos secciones de scroll y no tres.** Se reusan `js/recorrido.js` y `js/senalizacion.js`
    con su prosa reescrita. **Se descarta la sección de `js/contrato.js`**, que explica el
    formato campo por campo: eso ya lo cuenta `multiview-offer`, y el argumento de esta
    página es el caso de uso. Son 298 líneas de mecanismo que no se copian.
  - **La copia argumenta el caso de uso.** Por qué un canal de carreras quiere esto: el
    programa nunca se detiene, y quien mira elige seguir a su piloto sin perderlo. No
    argumenta que la transmisión tradicional esté mal, que es el encuadre del ADR 0076 y
    tiene alcance de proyecto.
  - **Nada de lo que se afirma se escribe a mano si se puede leer del contrato**, que es la
    vara que la página de la fase 12 se puso y que esta no baja.
  - **`CREDITS.md`**, con una fila por pieza: qué es, cómo se produjo, y con qué modelo. Es
    material generado y no hay licencia de terceros que respetar, y **eso se dice**, igual
    que la demo del partido dice que su cama de cancha es grabación propia.
  - **El README**, con las secciones del de `multiview-offer`: cómo se corre, qué se ve, qué
    hay abajo del cuadro, de quién es cada cosa, los archivos que deciden, y cómo se testea.
    **Y una sección que la otra no necesita: cómo se regenera el contenido**, que acá cuesta
    plata, con el total real de la fase escrito y con la advertencia de que se corre a mano y
    de que el resultado no va a ser idéntico.
  - **La medición de las seis filas del selector**, que es el R5 de `PHASE.md`. Captura
    headless real a 400×780 y a 1907 de ancho, con la grilla llena y el panel abierto. Si el
    panel deja de ser usable, **eso es una dependencia de `lib/` y se reporta**: no se entra
    a la librería. Y en las dos capturas el documento no puede scrollear de costado.
  - **Entry points:** `demo/multiview-offer/index.html`, `js/app.js`, `js/recorrido.js`,
    `js/senalizacion.js`, `css/page.css`, `README.md` y `CREDITS.md`; el ADR 0076 y el 0077.
  - **Constraints:** no se agregan colores, que es la propiedad que la estética de este
    proyecto defiende desde la fase 04. Se reusan las clases que ya existen. Nada fuera de
    `demo/race-multiview/`. Cero generaciones de Veo.

- **Definition of done:** la página se lee entera en los dos anchos, las dos secciones se
  llenan solas de lo que el player reproduce, el README y `CREDITS.md` están escritos, y
  están las capturas del selector con seis filas y la grilla llena, con el veredicto escrito
  de si entró o si es una dependencia.

- **nivel de verificación:** **bajo**, salvo la medición del selector, que es alto porque es
  la única que puede convertir esta fase en una que toca `lib/`.

## T-10 — La no-regresión y la publicación

- **Objective:** que lo que ya existía siga en pie, y que la demo quede publicada en su
  bucket. Importa por dos razones distintas: la primera es el criterio de la fase, y la
  segunda es que con el contenido publicado la fase de iOS no tiene que generar nada.

- **What it must cover:**
  - **Los tres comandos contra la línea de base de la T-01**: `npm test`, `npm run check` y
    `npm run mutaciones`. La suite tiene que tener **al menos** las pruebas de la línea de
    base, comparando nombres y no conteos, porque un conteo igual puede esconder una que se
    fue y otra que llegó.
  - **Las dos costuras siguen verdes.** La primera reporta tres ocurrencias, las tres en la
    lista aceptada, y la segunda cero hits. Si aparece una cuarta en la primera, eso es un
    hallazgo de esta fase y se reporta con su archivo y su línea; **no se la agrega a la
    lista de aceptadas**, que es lo que el propio script pide.
  - **`lib/` no cambió**, y eso se comprueba y no se afirma: `git diff --stat` sobre `lib/`
    contra el commit con el que la fase arrancó, y tiene que estar vacío. Si no lo está, eso
    es el hallazgo más importante del informe.
  - **La demo del break de hidratación sigue en pie**, que es la que se graba:
    `demo/hydration-break/test/signalled-run.test.js` más la campaña de mutación.
  - **La publicación**, por el camino que el `CLAUDE.md` de la raíz documenta y que no se
    puede deducir mirando: un bucket por demo con el nombre en el **host** y no en el path,
    `US-CENTRAL1`, acceso uniforme, `allUsers` con `roles/storage.legacyObjectReader`, la
    carpeta de la demo en la raíz del bucket más `dist/` y `vendor/`, y **el content type de
    cada `.ts` puesto a mano en `video/mp2t`**, porque Google adivina el formato de
    traducciones de Qt a partir de la extensión.
  - **Nada se reescribe para que ande.** Lo que se publica es byte por byte lo que se probó.
    Si el camino de publicación pide editar la demo, el camino está mal.
  - **`content/.fuentes/` no se publica.** Son los clips crudos de Veo, son varios
    gigabytes, y ninguna página los pide.
  - **El acceso público se verifica sin credenciales.** Un `curl` que lleve el token del
    entorno prueba que vos lo ves, no que lo vea otro.
  - **Entry points:** `CLAUDE.md` de la raíz, sección *Where the demos are published*;
    `scripts/construir-libreria.sh`.
  - **Constraints:** no se toca ninguna de las otras tres demos ni sus buckets. **La task
    termina con el árbol modificado y sin commitear**, que es como termina toda task de este
    repositorio: no es algo que esta task espere, es cómo entrega. Cero generaciones de Veo.

- **Definition of done:** los tres comandos corrieron y su salida está pegada en la
  evidencia, con la comparación de nombres de pruebas contra la línea de base. El `git diff
  --stat` de `lib/` está vacío y pegado. La URL pública responde 200 sin credenciales y el
  video reproduce desde ahí. El total de dólares gastado en la fase está sumado y escrito,
  etapa por etapa, contra los techos que `PHASE.md` declaró.

- **nivel de verificación:** **alto.** Es la task cuyo producto entero es una afirmación
  sobre otra cosa, así que cada afirmación va con el comando que la produjo.
