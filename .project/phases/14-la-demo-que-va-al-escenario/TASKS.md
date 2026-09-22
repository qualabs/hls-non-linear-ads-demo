# Tasks — fase 14-la-demo-que-va-al-escenario

| id | brief | status | plan | evidence |
| --- | --- | --- | --- | --- |
| T-01 | El recorrido, las tres campañas y la única fuente de los números. Sin dibujar nada | done | — | [`tasks/T-01/RECORRIDO.md`](tasks/T-01/RECORRIDO.md) |
| T-02 | La hipótesis del SVG animado adentro de `<img>`, con sus controles | done | — | [`tasks/T-02/VERDICTO.md`](tasks/T-02/VERDICTO.md) |
| T-03 | SPARKS: licencia, atribución, transcodificación y empaquetado | done | — | [`tasks/T-03/`](tasks/T-03/) · `demo/stage-pair/content/primary/` (99 seg, 197,998 s) · `demo/stage-pair/CREDITS.md` |
| T-04 | Las tres campañas en sus tres formas. `ZUMBRA` 16:9 hecha y aprobada | done | — | [`tasks/T-04/`](tasks/T-04/) · las nueve piezas en `demo/stage-pair/graphics/campaigns/` · identidades aprobadas por Nicolás el 2026-09-22 |
| T-05 | El puente a video: del SVG animado a HLS | done | — | [`tasks/T-05/PUENTE.md`](tasks/T-05/PUENTE.md) · las nueve piezas en `demo/stage-pair/content/creatives/` (12,000 s, 360 cuadros, 30 fps) · `demo/stage-pair/scripts/{puente-a-video,capturar-svg.py,empaquetar-creativo,verificar-creativo,pxdif}` |
| T-06 | La señalización del par: dos playlists, dos juegos de asset-lists, un lineal por break | done | — | [`tasks/T-06/SENALIZACION.md`](tasks/T-06/SENALIZACION.md) · `demo/stage-pair/signalling/` (9 asset-lists) · `demo/stage-pair/scripts/{senalizar-contenido.sh,escribir-asset-lists.mjs}` · `demo/stage-pair/test/` (14 pruebas + el banco de medición) |
| T-07 | `index.html`: el par, con el control de decodificadores | done | — | [`tasks/T-07/PAGINA.md`](tasks/T-07/PAGINA.md) · `demo/stage-pair/{index.html,js/app.js,js/stock-player.js,css/player.css,brand/}` · `demo/stage-pair/test/medir-escalera.py` · 10 capturas a 1907 y a 400 |
| T-08 | `inspect.html`: el player solo, con lo que hay que leer en cámara | done | — | [`tasks/T-08/PAGINA.md`](tasks/T-08/PAGINA.md) · `demo/stage-pair/{inspect.html,js/inspect.js}` · `demo/stage-pair/css/player.css` (sección nueva) · `demo/stage-pair/test/verificar-inspect.py` · `scripts/verificar-cortes.mjs` (la hoja, en el corte) · 12 capturas a 1907 y a 400 |
| T-09 | La escena de la carrera en SVG, y las cámaras que la enmarcan | done | — | [`tasks/T-09/CARRERA.md`](tasks/T-09/CARRERA.md) · el programa y las seis cámaras en `demo/stage-pair/content/race/` (120 s y 64 s, 30 fps, 1280×720) · `demo/stage-pair/scripts/{escribir-carrera.mjs,puente-carrera.sh,lamina-carrera.sh,verificar-fase-carrera.sh}` · `demo/stage-pair/stage.json` (bloque `carrera`) · la lámina de las seis cámaras en el mismo instante |
| T-10 | `race.html`: los avisos primero y después la ventana de multi view | done | — | [`tasks/T-10/RACE.md`](tasks/T-10/RACE.md) · `demo/stage-pair/{race.html,js/race.js}` · `demo/stage-pair/scripts/{senalizar-carrera.sh,escribir-asset-lists-carrera.mjs}` · `demo/stage-pair/test/verificar-carrera.py` · `demo/stage-pair/css/player.css` (sección nueva) · `demo/stage-pair/stage.json` (`carrera.breaks` y la oferta) · 9 pruebas más en `test/signalled-run.test.js` (207 → 216) · 18 capturas a 1907 y a 400 |
| T-11 | El README de la demo, los créditos, y el README de la raíz | done | — | `demo/stage-pair/{README.md,CREDITS.md}` · `demo/stage-pair/test/verificar-creditos.py` (el cruce del árbol contra los créditos, con sus plantados en rojo) · `README.md` de la raíz (dos filas: `race-multiview` y `stage-pair`) |
| T-12 | La no-regresión y la publicación | done | — | [`tasks/T-12/NO-REGRESION.md`](tasks/T-12/NO-REGRESION.md) · `tasks/T-12/{la-linea-de-base.txt,publicar.sh,la-corrida-en-seco.txt}` · 4 capturas. La no-regresión en verde, y **la demo publicada el 2026-09-22 en `qualabs-hls-demo-stage-pair`**, verificada sin credenciales (ver el cierre, abajo) |

## El orden, y de dónde sale

No sale de un calendario: **esta fase no tiene timeline**, por decisión de Nicolás. Sale de la
dependencia técnica entre las tasks. **El número es identidad y no orden**, salvo donde este
párrafo dice lo contrario.

- **La T-02 va temprano y antes que lo que quede de la T-04.** Su verdicto decide si el banner
  y la L viajan como `image/svg+xml` o si hay que bajarlos por la escalera de salida, y eso
  cambia qué se autora. Autorar primero y verificar después es pagar la autoría dos veces.
- **La T-03 es la única bloqueada por un insumo de afuera**, el archivo de SPARKS. De ella
  cuelgan la T-06 y la T-12; todo lo demás avanza sin ella.
- **La T-05 va después de la T-04**, porque captura lo que la T-04 escribe.
- **La T-06 va después de la T-03 y de la T-05**, porque la señalización necesita los offsets
  del programa empaquetado y las URI de los creativos ya empaquetados.
- **Las T-07 y T-08 van después de la T-06**, porque una página que no tiene qué reproducir no
  se puede mirar.
- **Las T-09 y T-10, que son la tercera página, van después de las dos primeras**, por
  instrucción de Nicolás y porque reusan el puente de la T-05 y los creativos de la T-04.
- **La T-12 corre al final de todo**, después de la T-10 y de la T-11, porque es lo que
  verifica que nada de lo anterior rompió lo que ya existía.

**La compuerta, y es una sola.** Nicolás mira **la primera forma de cada campaña** antes de que
se autoren las otras dos de esa campaña (adentro de la T-04). No es de plata: una identidad
equivocada hace que las tres formas estén equivocadas a la vez, y mirar una temprano cuesta un
tercio. Con `ZUMBRA` ya se cumplió. Hasta que la respuesta llegue para una campaña, la fase no
autora las otras dos formas de esa campaña; si no llega, eso no es un bloqueo de la fase, es la
fase haciendo lo que se le pidió.

**No hay task de tests aparte, y es la misma razón de la fase 13:** lo que esta fase construye
viaja con su chequeo adentro de la task que lo construye —la aserción de la captura es de la
T-05, la del tramo invertido es de la T-06, la del parámetro es de la T-07—. La T-12 es otra
cosa: no testea lo que la fase construye, verifica que lo que ya existía sigue en pie.

**No hay task de documentación de `docs/`** y está argumentado en `PHASE.md`: la fase no cambia
ninguno de los dos documentos. La documentación que sí produce —el porqué de cada línea del SVG
y de cada flag de la captura— va en la cabecera del archivo que la ejecuta (ADR 0061), así que
la escribe la misma task que lo escribe.

## Constraints que valen para todas las tasks de esta fase

**Antes de empezar, leer `knowledge/reglas-para-workers.md` del repo padre**
(`/home/nicolas/Develop/ai_workspace/cto-assistant/knowledge/reglas-para-workers.md`). Lo de
abajo es lo que esta fase agrega, no lo que ese archivo ya dice.

- **No se toca `lib/`.** Si una task descubre que necesita entrar a la librería, **para y
  reporta**: escribe qué hace falta y por qué, y no entra. Vale también para el contrato entre
  las dos capas.
- **No se tocan las cuatro demos publicadas** —`compatibility-pair`, `hydration-break`,
  `multiview-offer`, `race-multiview`— ni su contenido ni su señalización ni sus buckets.
  Copiar un archivo desde ellas sí; escribir adentro de ellas no.
- **Fuera de `demo/stage-pair/` se tocan exactamente dos archivos en toda la fase**: el
  `README.md` de la raíz (T-11) y `scripts/verificar-cortes.mjs` (T-06). Cualquier otro archivo
  fuera de esa carpeta es de otra tarea y no se edita, ni para un arreglo obvio.
- **Nada generado por un modelo de imagen o de video entra a esta demo** (ADR 0080). Ni propio,
  ni heredado de otra demo, ni aportado por un tercero. Todo asset declara su procedencia en el
  `CREDITS.md` de la demo, y **un archivo sin procedencia declarada bloquea la demo**.
- **Todo SVG se parsea como XML antes de usarlo** —`xml.dom.minidom.parse` o equivalente— en
  cualquier paso que lo abra, lo capture o lo copie. Razón medida: una tabla markdown adentro de
  un comentario XML rompe el documento entero, porque el separador `| --- |` contiene `--`, que
  es ilegal dentro de `<!-- -->`; **Chrome no dibuja nada y no emite ningún error**, así que la
  captura sale negra y el pipeline sigue. Este proyecto escribe cabeceras largas como
  documentación, que es exactamente donde uno escribe una tabla.
- **Toda captura de verificación de una animación se toma a la resolución nativa del
  creativo.** Medido sobre `ZUMBRA`: a 800 px de ancho un creativo de 1920 se reduce 2,4× y las
  burbujas mueven entre 0,5 y 3 píxeles de 383.200 comparados, con lo que dos capturas seguidas
  dan el mismo hash por casualidad y el positivo sale "2 de 3"; a 1920×1080 el mismo par mueve
  14.620. **Un "md5 igual" a resolución reducida no prueba nada**, y el número de píxeles
  distintos va en la evidencia, no sólo el veredicto.
- **Los temporales van a `$XDG_RUNTIME_DIR/cto/<tarea>-<fecha>-<azar>/`**, una carpeta por
  corrida, y se borra entera al terminar. Nunca adentro del repositorio ni del working
  directory: ensucia el árbol y termina commiteado. **`/dev/shm` está prohibido**: también es
  RAM, pero **cualquier usuario de la máquina lee lo que hay adentro**, mientras que
  `$XDG_RUNTIME_DIR` es privada del dueño de la sesión. Y el log de una corrida nunca vive
  adentro de la carpeta que esa corrida borra.
- **Lo que se levanta, se baja por el PID que se guardó al lanzarlo.** Nunca `pkill -f`,
  `killall` ni `fuser -k`: en esta máquina corren demos de Nicolás en 8080, 8081 y 8082, y un
  patrón que parece propio alcanza a las de él. Si hace falta un puerto ocupado, se usa otro.
- **`./run.sh` reconstruye `dist/` en cada arranque**, así que correrlo mientras alguien edita
  `lib/` mete código a medio escribir en todas las demos servidas. Para una corrida de esta
  fase: `./run.sh stage-pair` en un puerto propio, y se baja por su PID.
- **Nada se commitea y nada se pushea.** Cada task termina dejando el árbol modificado y sin
  commitear, y eso es su entregable: el commit no es parte de ninguna task de esta fase.

---

# La demo del par

## T-01 — El recorrido, las tres campañas y la única fuente de los números

- **Objective:** que todo lo que se puede decidir sin dibujar esté decidido y escrito, y que los
  números de la demo existan en un solo archivo que después leen la señalización, la captura y
  las tres páginas. Importa porque es lo que hace que la T-04 dibuje contra una especificación
  y no contra una idea a medio formar, y porque es la única task de la fase cuyo error se
  corrige gratis.

- **What it must cover:**
  - **La línea de base de la fase, medida antes de tocar nada** y guardada como evidencia:
    `npm test` y `npm run check`. `PHASE.md` dice que el 2026-09-21, sobre el commit `28999e2`,
    son 193 pruebas en verde y las dos costuras verdes con tres ocurrencias aceptadas en la
    primera. La task **anota el número que le da a ella**, y si no coincide, eso es lo que
    reporta.
  - **Los briefs de las tres campañas**: bebida, calzado y turismo. La de bebida es `ZUMBRA` y
    **ya está decidida y aprobada**: acá se transcribe su brief desde la cabecera del SVG, no se
    la redefine. Para las otras dos, nombre de la marca de fantasía, qué vende, claim, paleta, y
    qué hace el movimiento. Tres criterios, y la task los aplica sin consultar a nadie: **(a)**
    el nombre no evoca una marca real del rubro, contrastado contra una búsqueda y no contra la
    memoria —es lo que se hizo con `ZUMBRA`—; **(b)** la paleta no es la de una marca conocida;
    **(c)** nada del dibujo imita un logotipo existente.
  - **Las tres formas y sus `viewBox` exactos** (ADR 0081): 16:9, el banner de 8,89:1, y el
    backplate a cuadro entero con su guarda. La guarda se deriva de la caja del primario del
    `squeezebackLShape` (ADR 0047): la task **elige contra qué dos bordes se ancla el primario y
    con qué inset**, y escribe el `viewport` resultante. De ahí sale qué región del backplate
    tiene que quedar vacía.
  - **El recorrido del par: tres breaks, una forma y una campaña por break**, según la tabla de
    la sección 8 de `DESIGN.md` —side by side, L-shape, banner—. Los tres breaks duran lo mismo,
    para que el creativo 16:9 de cada campaña sirva de lineal en su break sin recortarse.
  - **Y cada forma en sus dos variantes de medio** (ADR 0084): video para el escalón de dos
    decodificadores, `image/svg+xml` para el de uno. El inventario que esta task escribe son
    **nueve piezas de autoría y dieciocho assets**, y deja claro cuál de los dieciocho es cuál,
    porque los dos juegos de asset-lists se generan de ahí y no se editan a mano por separado.
  - **Los offsets y la duración de los breaks**, calculados contra el tramo de SPARKS previo a
    los créditos, que empiezan en 199,0 s y dejan el corte del programa en 198,0 s. Si la T-03 todavía no midió el largo exacto de lo
    empaquetado, esta parte queda declarada con la regla que la resuelve y se completa con el
    número medido; **no se inventa una duración**. El dato de contexto que la regla tiene que
    respetar: David dijo que el evento da unos dos minutos de demo para todo.
  - **El archivo único de números**, en la forma que el proyecto ya usa (`race.json` de la fase
    13): fps, largo del programa, la lista de breaks con su offset, su duración, su campaña y el
    identificador de su respuesta rica y su magra, y los tres `viewBox`. Lo van a leer la
    señalización, la captura y las páginas, y **existe desde acá** para que ninguna de ellas
    repita un número.
  - Entry points: `DESIGN.md` de esta fase, los ADR 0047, 0081 y 0082,
    `tasks/T-04/zumbra-16x9.svg` para el brief de la primera campaña,
    `demo/race-multiview/race.json` como molde del archivo de números, y
    `demo/compatibility-pair/signalling/` como molde de las señalizaciones.
  - Constraints: no se dibuja ni un SVG en esta task. Sin dependencias.

- **Definition of done:** existe un documento en `tasks/T-01/` con los tres briefs, las tres
  formas con sus `viewBox`, la tabla de los tres breaks y la línea de base medida; y el archivo
  de números existe con todos los campos, y con los que dependan de la medición de la T-03
  marcados como pendientes por esa dependencia y no en blanco.
- **nivel de verificación:** mínimo. Toda la salida es un documento que una persona lee antes de
  que nada dependa de él, y su único error caro —un número inventado— lo previene la regla de
  dejar pendiente lo que no se sabe.

## T-02 — La hipótesis del SVG animado adentro de `<img>`, con sus controles

- **Objective:** que esté contestado, con evidencia y no con una lectura de código, si un
  `image/svg+xml` con animación declarativa se dibuja y **se mueve** adentro de la composición
  que la librería arma, y cuánto vale el adelanto del reloj de esa animación. Importa porque de
  la respuesta depende si el banner y la L cuestan cero de SDK o si hay que bajarlos por la
  escalera de salida, y porque contestarla después de autorar es pagar la autoría dos veces.

- **What it must cover:**
  - **Se mide adentro de la composición real**, con la librería dibujando el elemento en su caja
    sobre una señalización de prueba, y no con el SVG abierto suelto en una pestaña. Lo que hay
    que saber es qué pasa por el camino que el código toma, incluido el `object-fit: cover` que
    `place()` le pone al nodo.
  - **A resolución nativa**, por la constante medida del bloque de constraints. Una comprobación
    a 800 px ya dio un falso negativo sobre este mismo creativo.
  - **El caso positivo**: un SVG con animación SMIL y otro con animación CSS declarada adentro
    del propio documento, servidos como `image/svg+xml`. Dos capturas en dos instantes separados
    tienen que salir **distintas**, y la evidencia lleva el número de píxeles distintos.
  - **Los tres controles, y ninguno es opcional**, porque el instrumento —comparar dos
    capturas— pasa igual si la comparación está rota:
    - un SVG **sin ninguna animación** tiene que dar dos capturas **idénticas**. Si da distintas,
      lo que se midió es el instrumento y el positivo no vale nada;
    - un SVG animado **por JavaScript** tiene que dar dos capturas **idénticas**, porque el
      script no corre adentro de un `<img>`. Si da distintas, la hipótesis está mal en la otra
      dirección y eso cambia qué se puede autorar;
    - **el mismo archivo servido en un `<img>` común de la página**, fuera de la librería, para
      separar "no anima adentro de un `<img>`" de "no anima adentro de esta composición".
  - **El arranque del reloj.** `bringAhead` construye el nodo hasta tres segundos antes de que
    el elemento se vea, a `opacity: 0`. La task mide si, cuando el elemento aparece, la animación
    está en su comienzo o ya avanzada, y **cuánto**: una animación con un cambio inequívoco en un
    instante conocido alcanza. `ZUMBRA` ya está autorada contra el caso peor —bucle de 3 s con
    fases repartidas, anillo que cierra a los 6 s—, así que el número sirve para autorar las
    otras dos campañas, no para rehacer la primera.
  - **Las fuentes.** Un SVG referenciado por `src` se dibuja aislado y no trae recursos de red.
    La task prueba tres cosas y dice cuáles funcionan: una familia del sistema —la pila que
    `ZUMBRA` ya usa—, un `@font-face` a un archivo externo, y la fuente embebida como datos
    adentro del propio SVG. El texto de prueba tiene que ser uno que se note si sale en otra
    tipografía.
  - **La transparencia.** Un `<img>` no lleva la cama negra que la librería le pone a los video
    (ADR 0056), así que un SVG con fondo transparente debería componer contra el programa. La
    task lo mira, porque el banner y la L lo van a usar.
  - **Un elemento de imagen no consume un decodificador de video, y eso se verifica y no se
    asume.** Es la premisa sobre la que se apoya la escalera entera del ADR 0084: si fuera falsa,
    la respuesta magra pediría lo mismo que la rica y la escalera no tendría escalones. Se
    cuentan, sobre la misma señalización de prueba, **los elementos `<video>` y las instancias
    del player que la composición tiene vivas** con un elemento de aviso en video y con el mismo
    elemento como `image/svg+xml`. El de video es el control: tiene que dar **más**; el de
    imagen tiene que dar **uno**, que es el contenido primario. Si los dos dan lo mismo, lo que
    se midió es el instrumento; si el de imagen da dos, **la premisa es falsa, la task para y lo
    reporta**, porque lo que se cae ahí es la afirmación de la demo y no su implementación.
  - **El verdicto se escribe como verdicto**, no como narración: para cada una de las siete
    preguntas —anima SMIL, anima CSS, corre JS, cuánto se adelanta el reloj, qué fuentes
    resuelven, cómo compone el alfa, cuántos decodificadores pide una imagen— una respuesta y su
    evidencia pegada.
  - Entry points: `lib/renderer.js:209` (`isImage`), `lib/renderer.js:699` (`createNode`),
    `lib/media.js` (`attachAsset`), `lib/renderer.js` alrededor de `place()` y de `bringAhead`.
    El skill `playwright` para el navegador; usar Chrome real, porque el Chromium empaquetado de
    Playwright no resuelve fuentes en esta máquina y eso contaminaría justo la pregunta de las
    fuentes.
  - Constraints: **no se toca `lib/`**, ni siquiera para instrumentar. Todo lo de prueba vive en
    el temporal de la corrida y no queda en el árbol. Sin dependencias.

- **Definition of done:** un documento en `tasks/T-02/` con las seis respuestas, cada una con su
  captura o su medición pegada, y con los tres controles corridos y su resultado escrito
  —incluido el caso en que un control salga al revés de lo esperado, que es un hallazgo y no un
  error de la task—. El documento termina diciendo **cuál de las tres ramas de la escalera de
  salida de `DESIGN.md` queda elegida** para el banner y para la L.
- **nivel de verificación:** alto. Es una verificación cuyo verdicto decide el pipeline de las
  tasks que siguen, y su modo de falla es el que este proyecto ya cometió tres veces: un chequeo
  escrito de buena fe que no podía fallar. Los controles son obligatorios y su resultado va en la
  evidencia.

## T-03 — SPARKS: licencia, atribución, transcodificación y empaquetado

- **Objective:** que `demo/stage-pair/content/primary/` exista, empaquetado a HLS como los demás
  primarios del repositorio, y que la licencia esté leída y la atribución redactada. Importa
  porque es el programa sobre el que la demo argumenta, y porque una licencia asumida es
  exactamente la clase de afirmación que este proyecto no hace.

- **What it must cover:**
  - **El material**: `TechblogAssets/Sparks/encodes/Sparks_4096x2160_5994fps_SDR.mp4`, de
    Netflix Open Content. 419.744.507 B, 229,9 s totales y los créditos arrancando en **199,0 s**,
    H.264 Main L5.1 yuv420p 4096×2160 a 59,94, **SDR**, audio AAC-HE 2.0 a 48 k, licencia
    **CC BY 4.0**. Que sea SDR es lo que evita el tone-mapping.
  - **El programa de la demo es el tramo previo a los créditos.** El corte exacto lo elige la
    task mirando dónde empiezan; los créditos no entran.
  - **La cadencia sale de la fuente** (ADR 0059): 59,94 o su mitad exacta, **nunca un resample a
    otra cadencia**. Si la task necesita apartarse de esa regla, eso es un ADR y se escribe
    antes de empaquetar.
  - **El audio es AAC-HE**, que no es lo que traen los otros primarios. Si el empaquetado lo
    recodifica, la cabecera del script dice con qué y por qué; si lo pasa tal cual, dice que lo
    pasó.
  - **La atribución, redactada contra el default de CC BY 4.0**, porque **ni el sitio ni el
    bucket especifican una forma**. Cinco piezas: el creador, el aviso de copyright, el aviso de
    licencia con su enlace, el enlace al material, e **indicar que se modificó**. Lo último es lo
    que se olvida y acá es seguro que aplica: la demo recorta, recodifica y reempaqueta.
  - **Meridian no se usa, y la task no lo reconsidera.** Su propio
    `TechblogAssets/Meridian/meridian_license.txt` declara **CC BY-NC-ND**, que contradice el
    CC BY 4.0 que el sitio anuncia para el conjunto. Sin derivados y sin uso comercial es lo
    contrario de lo que esta demo hace. Si la task encuentra una contradicción parecida en el
    material de SPARKS, **para y reporta**: cuando dos fuentes de licencia se contradicen, manda
    la más restrictiva que esté pegada al archivo.
  - **La transcodificación y el empaquetado** siguen el camino que las demos ya tienen:
    `scripts/preparar-contenido.sh` y `scripts/empaquetar-contenido.sh`, copiados del molde que
    mejor encaje y adaptados, con su cabecera explicando cada flag (ADR 0061). El original crudo
    va a `content/.fuentes/`, que **no se publica**.
  - **El largo del programa se mide sumando los `#EXTINF` de la playlist empaquetada**, no se
    lee del contenedor de origen ni del `-t` del `ffmpeg`. Ese número vuelve al archivo de
    números de la T-01 y cierra los pendientes que dejó.
  - **Se mira el material.** El mismo chequeo de cuadro que la fase 08 tuvo que hacer: nada que
    no queramos en pantalla en un evento de Apple.
  - Entry points: `demo/compatibility-pair/scripts/preparar-contenido.sh` y
    `empaquetar-contenido.sh`, el ADR 0059, y el `CLAUDE.md` de la raíz para lo que no se
    publica.
  - Constraints: no se toca ninguna otra demo. Depende de T-01 para saber qué tramo hace falta.

- **Definition of done:** `demo/stage-pair/content/primary/index.m3u8` existe y reproduce de
  punta a punta sin créditos; el largo medido por suma de `#EXTINF` está escrito en el archivo de
  números; y el `CREDITS.md` de la demo tiene la atribución con sus cinco piezas, incluida la
  mención de que el material se modificó.
- **nivel de verificación:** bajo. El resultado se mira en pantalla y el error está a la vista.
  La parte que no es visual —la atribución— se cubre con el texto escrito, que es observable
  contra las cinco piezas que la licencia pide.

## T-04 — Las tres campañas en sus tres formas

- **Objective:** que existan los nueve SVG —tres campañas por tres formas— y que cualquiera que
  los mire diga "esto es una publicidad" y no "esto es un gráfico". Importa porque es lo que
  David pidió cambiar y porque es el riesgo real de la decisión del SVG.

- **What it must cover:**
  - **Lo que ya está hecho no se rehace.** `ZUMBRA` en su forma 16:9 está autorada y **aprobada
    por Nicolás**, con el ajuste de la tapa de la lata aplicado y también aprobado. Vive en
    `tasks/T-04/`. Es la **referencia de estructura** de todo lo demás: qué secciones tiene el
    archivo, qué explica la cabecera, cómo se reparte el movimiento. No se copia el dibujo.
  - **Lo que falta**: las otras dos formas de `ZUMBRA` —banner y backplate—, y las tres formas
    de las campañas de calzado y de turismo.
  - **Una identidad por campaña, tres `viewBox`** (ADR 0081): la misma marca, la misma paleta y
    el mismo movimiento autorados para tres cajas. Que las tres se lean como la misma campaña es
    parte del entregable.
  - **La compuerta, una por campaña que falta:** se autora la forma **16:9** primero y Nicolás
    la mira antes de las otras dos. Es la que se ve a cuadro entero en el lineal y donde una
    identidad floja se nota más.
  - **Lo que la T-02 decidió se aplica sin discutirlo de nuevo**: si el reloj se adelanta, el
    bucle no tiene momento feo; si la tipografía tiene que ir a trazos, va a trazos.
  - **El backplate deja su guarda vacía**, en la región que la T-01 fijó, y el dibujo está
    compuesto para que lo que se ve sea una L y no un fondo con un agujero.
  - **El banner compone contra el programa**, así que su fondo es el que la T-02 haya validado.
  - **Nada de marcas reales, nada de personas reconocibles, nada generado por un modelo.** Si
    hiciera falta una fotografía adentro del creativo, no entra: se resuelve con vector.
  - **Cada archivo lleva su cabecera** con el porqué de sus decisiones de autoría (ADR 0061), en
    la forma que `zumbra-16x9.svg` ya fijó.
  - **Cada archivo se parsea como XML** antes de darlo por bueno, por la razón del bloque de
    constraints.
  - **Los nueve SVG autorados viven en `demo/stage-pair/graphics/campaigns/`, no en `content/`**, que está gitignoreado por ser lo que un clone reconstruye con un comando. La razón medida y el precedente del repositorio están en [`tasks/T-01/RECORRIDO.md`](tasks/T-01/RECORRIDO.md), sección 7.
  - Entry points: `tasks/T-04/zumbra-16x9.svg` y su cabecera; los briefs y los `viewBox` de la
    T-01; el verdicto de la T-02; `demo/compatibility-pair/brand/` para ver cómo el proyecto
    trata sus propios activos de marca.
  - Constraints: las marcas son **inventadas**, no la de Qualabs: la fase 04 sacó la marca propia
    de adentro del cuadro y esta fase no la vuelve a meter. Depende de T-01 y T-02.

- **Definition of done:** los nueve SVG existen en `demo/stage-pair/graphics/campaigns/` —ahí y no
  en `content/`, que está gitignoreado y los sacaría del repositorio (T-01 §7)—, los nueve parsean
  como XML, se abren en el navegador y se mueven; las tres formas de cada campaña puestas una al
  lado de la otra se leen como la misma campaña; y Nicolás vio la 16:9 de cada campaña antes de
  que existieran sus otras dos.
- **nivel de verificación:** bajo. Es autoría visual: una persona la mira y el error está en la
  pantalla. La verificación principal es la captura al tamaño real de uso, una por forma, a
  resolución nativa.
- **post-ejecución:** 2026-09-21, la tapa de la lata de `ZUMBRA` no se leía como una tapa;
  corregida y aprobada, con la evidencia del antes y el después en
  `tasks/T-04/evidencia-tapa-antes-despues.png`.

## T-05 — El puente a video: del SVG animado a HLS

- **Objective:** que exista un script que toma un SVG animado y devuelve un HLS reproducible, y
  que de él salgan los videos que la demo necesita. Importa porque **el aviso lineal lo reproduce
  también el pane de fábrica**, que sólo entiende medios, y sin ese video se cae el argumento de
  la demo; y porque el programa de la carrera de la T-09 sale del mismo script.

- **What it must cover:**
  - **La cadena**: navegador headless que abre el SVG a un tamaño fijo, captura cuadro por cuadro
    contra un reloj controlado, `ffmpeg` que arma el video, y el empaquetador de la demo que lo
    lleva a HLS. Los parámetros —tamaño, fps, duración— salen del archivo de números de la T-01 y
    no se escriben dos veces.
  - **El reloj se controla, no se espera.** Capturar mirando el reloj de pared da cuadros
    repetidos y cuadros perdidos según cuánto tarde cada captura. La forma correcta es avanzar la
    animación de forma determinística y capturar; la task escribe cuál usó y por qué.
  - **Se captura a la resolución nativa del creativo**, por la constante medida del bloque de
    constraints, y se escala en el empaquetado si hace falta. Capturar chico y agrandar pierde lo
    único que el vector aportaba.
  - **La aserción de que lo capturado es lo animado**, con su control: el conteo de cuadros del
    video y su duración, contra la duración declarada de la animación. **El control es una
    captura cortada a propósito, que tiene que dar rojo.** Es la lección medida de la fase 10,
    donde un comentario afirmaba que `-sseof -1 -frames:v 1` daba el último cuadro y daba el 168
    de 192.
  - **Todo sale mudo.** Nicolás lo decidió: por ahora la demo no lleva audio. Un SVG no tiene
    sonido y acá no se le agrega ninguno, ni al lineal. Si más adelante se decide que el lineal
    lleve voz o música, se agrega en este paso y su procedencia se declara en el `CREDITS.md` con
    la misma vara que todo lo demás.
  - **Los elementos concurrentes salen en silencio**, que es el default del proyecto: el `volume`
    ausente es silencio (ADR 0014).
  - **Las salidas de esta task son las nueve variantes de video del par**: las tres formas de
    cada una de las tres campañas. Las nueve variantes de imagen no pasan por acá: son los SVG
    tal cual, servidos como `image/svg+xml`, salvo que la T-02 haya dictaminado que hay que
    rasterizarlos a un cuadro fijo. El programa de la carrera y sus cámaras los produce la T-09
    con este mismo script, sin modificarlo.
  - **La cabecera del script explica cada flag** (ADR 0061).
  - Entry points: `demo/race-multiview/scripts/` y
    `demo/hydration-break/scripts/empaquetar-contenido.sh` como moldes del empaquetado, el skill
    `playwright` para el navegador, y el archivo de números de la T-01.
  - Constraints: no se toca `lib/` ni otra demo. Los cuadros intermedios van al temporal de la
    corrida y se borran. Depende de T-04.

- **Definition of done:** cada creativo capturado reproduce en el navegador y lo que se ve es la
  animación entera; la aserción de cuadros y duración corre en verde y **se la vio roja** con la
  captura cortada; y el script deja escrito qué mecanismo de reloj usó.
- **nivel de verificación:** alto. Produce un artefacto cuyo defecto —cuadros perdidos, un bucle
  cortado, un arranque tarde— es invisible en el archivo y sólo aparece en cámara, y la aserción
  que lo cubre corre después sin que nadie la mire.

## T-06 — La señalización del par

- **Objective:** que el recorrido del par exista señalizado: los tres breaks, cada uno con su
  respuesta rica y su magra, con un asset-list lineal propio por break, y con **una playlist por
  escalón de respuesta** para que el control de la página sea un `if`. Importa porque es lo que
  hace que el parámetro signifique algo, y porque es donde muere el tramo invertido.

- **What it must cover:**
  - **`senalizar-contenido.sh`, copiado del molde y adaptado**, que corre en cada arranque porque
    el `START-DATE` se calcula del `EXT-X-PROGRAM-DATE-TIME` del contenido empaquetado y
    re-empaquetar lo mueve. Escribe **dos** playlists señalizadas: la rica y la magra.
  - **Los dos tags por break, en el mismo `START-DATE`** (ADR 0007): el de clase
    `com.apple.hls.interstitial` que el pane de fábrica reproduce, y el de clase
    `com.qualabs.hls.concurrentInterstitial` que reproduce el nuestro.
  - **Un asset-list lineal por break, con la `DURATION` de su break** y con el creativo 16:9 de
    la campaña de ese break (ADR 0082). Es lo contrario de lo que `compatibility-pair` hace —un
    `asset-list-linear.json` único, `adA`, 12,0 s, compartido por los cinco breaks contra un
    quinto break concurrente de 48— y es lo que elimina el tramo invertido sin tocar el
    `START-DATE` compartido.
  - **Los seis asset-lists concurrentes**, tres ricos y tres magros, según la tabla de la
    sección 8 de `DESIGN.md`. **Entre el rico y el magro de un break cambia una sola cosa: el
    `type` y el `uri` del asset** (ADR 0084). El layout, el `viewport`, el `zDepth`, la campaña y
    la duración son idénticos, y que sean idénticos es lo que la demo afirma:
    - break A: `squeezebackDoubleBox`, el creativo 16:9 en video / el mismo como `image/svg+xml`;
    - break B: `squeezebackLShape`, el backplate en video / el mismo como `image/svg+xml`;
    - break C: `lowerThirdOverlay`, el banner en video / el mismo como `image/svg+xml`.
  - **El lineal sigue estando en los tres breaks**, en el tag de clase Apple, que es lo que
    reproduce el pane de fábrica. Lo que ya no pasa es que nuestro cliente baje a él por falta de
    decodificadores.
  - **La medición del tramo invertido, con su control.** Se mide **leyendo el estado del
    navegador**, que es el instrumento que la fase 03 eligió y argumentó, no mirando capturas:
    para cada break, el segundo en que cada pane entra y sale. Tiene que dar el mismo en los dos.
    **El control es la misma medición contra un asset-list lineal de duración distinta a la de su
    break, que tiene que dar rojo**, porque eso es exactamente lo que `compatibility-pair` tiene.
  - **`demo/stage-pair/test/signalled-run.test.js`**, como lo tiene cada demo del repositorio,
    con lo que se pueda assertar sin navegador: que las dos playlists traen los tags que la tabla
    declara, que cada lineal tiene la duración de su break, que **ningún asset-list magro declara
    un asset de video**, y que el rico y el magro de un mismo break **coinciden en todo menos en
    el `type` y el `uri`** — el layout, el `viewport`, el `zDepth` y la duración tienen que ser
    idénticos, porque eso es lo que el ADR 0084 afirma.
  - **`scripts/verificar-cortes.mjs`: agregar la copia de `contract-trace.js` de esta demo a la
    lista de archivos auditados.** Hoy la lista nombra sólo los de `compatibility-pair`, así que
    la copia nueva quedaría fuera del chequeo sin que nada avise. **Y se verifica viéndolo
    rojo**: se planta un término del transporte en la copia nueva, se corre, tiene que dar rojo,
    se saca.
  - **Los nueve SVG autorados viven en `demo/stage-pair/graphics/campaigns/`, no en `content/`**, que está gitignoreado por ser lo que un clone reconstruye con un comando. La razón medida y el precedente del repositorio están en [`tasks/T-01/RECORRIDO.md`](tasks/T-01/RECORRIDO.md), sección 7.
  - Entry points: `demo/compatibility-pair/scripts/senalizar-contenido.sh` y su carpeta
    `signalling/` como molde, los ADR 0007, 0019, 0047 y 0082, y `scripts/verificar-cortes.mjs`.
  - Constraints: no se toca `lib/`, ni ninguna otra demo, ni el `signalling/` de ninguna de
    ellas. `scripts/verificar-cortes.mjs` es el único archivo fuera de `demo/stage-pair/` que
    esta task edita. Depende de T-03 y T-05.

- **Definition of done:** `./run.sh stage-pair` levanta y el recorrido corre de punta a punta en
  las dos playlists; los tres breaks entran y salen en el mismo segundo en los dos panes, medido
  y con el control en rojo; `node --test` incluye el test de la demo nueva y pasa; y
  `npm run check` sale 0 con la copia de `contract-trace.js` adentro de su lista, habiéndola
  visto roja.
- **nivel de verificación:** alto. Es de donde salen los segundos sobre los que se apoya todo lo
  demás, y un `START-DATE` corrido o una `DURATION` que no coincide con su break no se ven hasta
  que están en cámara. Lo fija la medición del tramo invertido, que es la parte cuyo error es más
  caro.

## T-07 — `index.html`: el par, con el control de decodificadores

- **Objective:** que exista la página principal: dos panes sobre la misma playlist en un cuadro,
  el recorrido pasando por las tres formas no lineales, y un control de tres posiciones que
  cambia lo que el asset-list devuelve. Importa porque es la pieza que David eligió como la
  principal y la que sostiene el argumento de Nicolás, *"estás monetizando sin ocupar toda la
  pantalla"*.

- **What it must cover:**
  - **El par**, con `stock-player.js` y `contract-trace.js` copiados de
    `demo/compatibility-pair/js/` —no importados, que el ADR 0022 lo impide— y el bloque cercado
    de "lo que un integrador escribe" mantenido como está, porque es la superficie del ADR 0015 y
    `npm run check` la audita.
  - **El control, tres posiciones**: sin declarar, 1 y 2 (ADR 0083). Cada una elige **la
    playlist** y el valor que se le pasa a `attach()`, y **rearma el player**. Rearmarlo no es un
    rodeo: `decoderCount` se lee una sola vez, al crear la señalización (`lib/signalling.js:687`,
    llamada desde `lib/concurrent-hls.js:260`), así que cambiarlo en vivo lo rearma igual.
  - **La verificación de que el parámetro viaja, con su control negativo.** Se lee el pedido del
    asset-list en las tres posiciones: en 1 tiene que llevar `qa-decoder-count=1`, en 2
    `qa-decoder-count=2`, y **en "sin declarar" la URI tiene que salir sin el parámetro, byte por
    byte como saldría para un integrador que nunca oyó de la opción**. Ese es el control: si ahí
    también aparece, la medición está leyendo otra cosa.
  - **Y la cuenta de decodificadores, por escalón, sobre la página real.** Con el control en 2 la
    composición tiene que tener **más de un** elemento `<video>` vivo durante el break —el
    primario y el aviso—, y con el control en 1 **exactamente uno**, el primario. Es la premisa
    del ADR 0084 medida donde importa, y el escalón rico es su control: si los dos dan lo mismo,
    la medición no está mirando la composición. La T-02 ya la verificó en aislamiento; acá se
    verifica que el recorrido real la cumple en los tres breaks.
  - **La página dice que no hay servidor.** Una línea, visible, que diga que el parámetro es el
    que un ad presentation server leería y que acá la respuesta está horneada por valor. Sin eso
    la página afirma algo que no leyó.
  - **Los dos panes idénticos en todo salvo en qué muestran durante el break**, que es el
    criterio que la fase 04 fijó: el mismo cromo, la misma barra, el mismo reloj, ninguna marca
    sobre la imagen.
  - **La copia va en inglés**, como las cuatro demos anteriores, porque la presenta David.
  - **La verificación visual es una captura headless real** a 400×780 y a 1907 de ancho, una por
    posición del control, y se mira la imagen: un `getComputedStyle` ya dio falsos "OK" dos veces
    en este proyecto.
  - Entry points: `demo/compatibility-pair/index.html`, `js/app.js`, `js/stock-player.js`,
    `js/contract-trace.js` y `css/`; `docs/integrating-the-library.md` para `decoderCount`.
  - Constraints: no se toca `lib/` ni `demo/compatibility-pair/`. Depende de T-06.

- **Definition of done:** la página corre, el par muestra los tres breaks con sus tres formas,
  las tres posiciones del control devuelven lo que la tabla de `DESIGN.md` dice, la medición del
  parámetro está hecha en las tres con su control negativo en rojo, y las seis capturas están
  guardadas.
- **nivel de verificación:** alto, y lo fija el chequeo del parámetro. El resto de la task es
  interfaz y sería `bajo`, pero la verificación de que `qa-decoder-count` viaja y de que no viaja
  cuando no se declara es exactamente la clase de chequeo que pasa por la razón equivocada.

## T-08 — `inspect.html`: el player solo, con lo que hay que leer en cámara

- **Objective:** que exista la segunda página: el mismo contenido con un único player, el
  nuestro, y al lado el fragmento de playlist con los DATERANGE y el asset-list que se resolvió.
  Importa porque es donde David abre el network tab, y con un player solo se sigue mucho más
  fácil qué está pasando.

- **What it must cover:**
  - **Un solo player**, sin el pane de fábrica. Es lo que la hace simple.
  - **Lo que muestra se lee, no se transcribe.** El fragmento de playlist sale de la playlist que
    el player está tocando, y el asset-list se muestra tal como volvió. Es la línea que la fase 12
    fijó. Si la página tuviera que afirmar un número, ese número se deriva del contrato y no se
    escribe.
  - **Se puede saltar a un break sin esperar.** David tiene unos dos minutos para todo.
  - **La misma línea sobre el servidor** que la T-07, porque esta página también muestra el
    pedido.
  - **La copia va en inglés.**
  - **Captura headless real** a los dos anchos.
  - Entry points: `demo/hydration-break/index.html` y `demo/hydration-break/js/senalizacion.js`
    como molde de una página que lee la señalización en vivo; la T-07 para el cromo y el CSS, que
    se comparten.
  - Constraints: no se toca `lib/` ni otra demo, y **no se duplica el CSS**: las páginas de esta
    demo comparten hoja. Depende de T-06 y T-07.

- **Definition of done:** la página corre, el tag que muestra es el que la playlist trae y el
  JSON que muestra es el que volvió —verificado cambiando la señalización y viendo cambiar la
  página—, y las capturas a los dos anchos están guardadas.
- **nivel de verificación:** bajo. Es interfaz y la verificación principal es mirar la captura; la
  única parte no visual, que lo que muestra sea leído y no transcripto, se verifica cambiando la
  fuente y viendo cambiar la pantalla.

---

# La tercera página: la carrera

## T-09 — La escena de la carrera en SVG, y las cámaras que la enmarcan

- **Objective:** que exista el contenido de la tercera página: una carrera hecha en SVG —autos,
  pista, competencia, simple— con su programa y una cámara por auto, todo capturado a video.
  Importa porque el cierre de la presentación era `race-multiview` y está caído entero por la
  restricción, así que el cierre hay que reconstruirlo.

- **What it must cover:**
  - **Una sola escena.** Los autos, la pista y lo que se ve alrededor se dibujan una vez.
  - **Cada cámara enmarca una región distinta de esa escena, siguiendo a su auto.** No es la
    misma animación recoloreada: seis clips que son el mismo movimiento con otro color se leen
    como seis copias y una fila del selector deja de significar algo. Enmarcar distinto cuesta
    casi lo mismo —es cambiar un rectángulo, no dibujar otra escena— y hace que cada cámara vea a
    los demás autos entrar y salir de cuadro en momentos distintos, que es lo que las vuelve
    cámaras de la misma carrera. Es el R1 de la fase 13 resuelto por construcción.
  - **El mecanismo lo elige la task**, y el camino seguro es animar el `transform` de un grupo en
    lugar de el `viewBox` de la raíz, porque que `viewBox` anime no está verificado acá y lo otro
    es lo que `zumbra-16x9.svg` ya hace. **Si enmarcar por cámara resulta más caro que lo que
    dice este bloque, eso es un hallazgo y se reporta**: el que lo escribió no lo midió.
  - **El programa** es su propio encuadre: el corte de realización que va saltando entre autos, y
    es el contenido primario del player, así que sale a video sí o sí.
  - **Las cámaras van a video y no como imagen**, y la razón no es el costo: el ADR 0027 dice que
    enfocable es una caja de video del aviso y nada más, así que una cámara servida como imagen
    **no toma el foco de audio** y el beat de agrandar una cámara y quedarse adentro de ese auto
    —el pago que `race-multiview` tenía— no existiría. Con el puente de la T-05 ya corriendo para
    el programa, capturarlas es el mismo comando con otro encuadre.
  - **Las cámaras salen mudas**, por decisión de Nicolás: por ahora la demo va toda sin audio.
    El foco de audio sigue funcionando porque los feeds son video, así que el mecanismo está;
    sencillamente no suena nada.
  - **Cuántos autos lo fija la task**, con dos criterios: **la oferta tiene que superar el tope
    de cuatro de la grilla** (ADR 0066), porque si todo lo ofrecido entra en pantalla a la vez
    elegir no significa nada; y los colores tienen que distinguirse en una caja de media
    pantalla, que es el criterio que la fase 13 ya usó. Ningún nombre ni color evoca un equipo o
    un piloto real.
  - **Ni números ni patrocinadores en los autos.** El auto se reconoce por el color; el nombre
    vive en la fila del selector, que es texto del navegador.
  - **Cada archivo se parsea como XML** y **cada captura de verificación se toma a resolución
    nativa**, por el bloque de constraints.
  - Entry points: `tasks/T-04/zumbra-16x9.svg` como referencia de estructura y de animación
    declarativa; el script de la T-05; los ADR 0027, 0064 y 0066;
    `demo/race-multiview/race.json` y su `senalizar-contenido.sh` como molde de los números y de
    la ventana.
  - Constraints: no se toca `lib/` ni otra demo. Depende de T-04 y T-05, y va después de T-08.

- **Definition of done:** el programa y las cámaras existen empaquetados a HLS y reproducen; las
  cámaras puestas una al lado de la otra **se leen como cámaras distintas de la misma carrera**,
  y la evidencia es una lámina de contacto con un cuadro de cada una en el mismo instante —si dos
  son el mismo movimiento con otro color, el encuadre no está haciendo nada y eso se ve ahí—; y
  la aserción de cuadros y duración de la T-05 corre en verde sobre cada pieza.
- **nivel de verificación:** alto. Corre el mismo pipeline de captura de la T-05, cuyo defecto es
  invisible en el archivo, y produce el contenido sobre el que se apoya la página que cierra la
  presentación.

## T-10 — `race.html`: los avisos primero y después la ventana de multi view

- **Objective:** que exista la tercera página: la carrera corriendo, con los mismos creativos no
  lineales de las tres campañas **antes** de que se abra la ventana de multi view, y después la
  ventana con su catálogo de cámaras. Importa porque es lo que Nicolás pidió para tener *"una 3ra
  demo súper potente con todo lo que creamos junto"*, y porque es el cierre que reemplaza al que
  se cayó.

- **What it must cover:**
  - **El orden es el argumento**: primero la publicidad no lineal sobre la carrera, después la
    ventana de multi view. Es lo que hace que una sola página muestre lo viejo, lo nuevo y la
    extensión, y es también donde se ve la separación que David pidió entre la señalización de
    publicidad y la extensión de Qualabs, que son dos clases hermanas (ADR 0063).
  - **Los avisos son los mismos creativos** de la T-04, no otros. Qué formas entran y en qué
    breaks lo decide la task con el criterio de que se vean sobre imagen en movimiento y de que
    entren en el tiempo que la carrera dura antes de la ventana.
  - **El bloque de oferta es el del ADR 0064 tal como está**, sin pedirle un campo al contrato:
    un catálogo, y la grilla la calcula la librería (ADR 0065) con su tope de cuatro (ADR 0066).
  - **Esta página no lleva el control de decodificadores.** Es de la página del par, y meterlo
    acá sería un segundo lugar donde mantener el mismo `if`.
  - **El aviso del multi view y el selector son los de la librería**, sin tocarlos: lo que esta
    página aporta es contenido y señalización.
  - **La página no promete audio por cámara**, porque las cámaras van mudas.
  - **La copia va en inglés.**
  - **`test/signalled-run.test.js` de la demo cubre también esta página**: que la ventana abre
    donde el archivo de números dice, y que el catálogo tiene tantas entradas como cámaras
    empaquetadas —el chequeo que la fase 13 hizo pasar de una a seis sin que nadie editara un
    script—.
  - **Captura headless real** a los dos anchos, con la grilla llena. El panel del selector
    recortado a ancho de teléfono es un defecto conocido y cerrado sin cambio, porque la demo es
    16:9: si reaparece, se anota y no se arregla acá.
  - Entry points: `demo/race-multiview/index.html` y `js/senalizacion.js` como molde;
    `demo/multiview-offer/` para una playlist que lleva las dos clases; los ADR 0063, 0064, 0065
    y 0066.
  - Constraints: no se toca `lib/` ni otra demo. Depende de T-09, y va después de T-08.

- **Definition of done:** `./run.sh stage-pair` y la página corre de punta a punta: los avisos no
  lineales aparecen antes de la ventana, la ventana abre donde el archivo de números dice, el
  catálogo ofrece todas las cámaras empaquetadas, se pueden subir hasta cuatro, agrandar una y
  salir; el test de la demo pasa; y las capturas a los dos anchos están guardadas.
- **nivel de verificación:** bajo. Es interfaz sobre un mecanismo que está construido y verificado
  desde la fase 11, y lo que esta página aporta —contenido y señalización— tiene su parte medible
  en el test de la ventana y del catálogo.

---

# El cierre

## T-11 — El README de la demo, los créditos, y el README de la raíz

- **Objective:** que la demo se explique sola y que el `README.md` de la raíz deje de estar
  desactualizado. Importa porque el README de la raíz lista tres demos y son cuatro —el hueco que
  el cierre de la fase 13 reportó sin tocar— y esta fase agrega la quinta.

- **What it must cover:**
  - **`demo/stage-pair/README.md`**: qué argumenta esta demo, qué muestra cada una de sus tres
    páginas, cómo se corre, y qué hace el control de decodificadores, con la aclaración de que no
    hay servidor.
  - **`demo/stage-pair/CREDITS.md`**: **la procedencia de cada asset, sin excepción.** SPARKS con
    su atribución de cinco piezas incluida la mención de que se modificó; los nueve SVG y la
    escena de la carrera como obra propia escrita a mano; el audio del lineal si lo hay. Es el
    instrumento de la afirmación "acá no hay nada generado por un modelo": esa afirmación no se
    sostiene mirando píxeles, se sostiene con la lista completa, y **un archivo sin línea en esta
    tabla bloquea la demo**.
  - **`README.md` de la raíz**: la tabla de demos pasa de tres filas a cinco, con una línea por
    demo que diga qué argumenta, en el registro que las tres que ya están usan.
  - **El `CREDITS.md` audita `content/` y `graphics/`**, no sólo `content/`: los nueve SVG autorados viven en `graphics/campaigns/` por la razón medida en [`tasks/T-01/RECORRIDO.md`](tasks/T-01/RECORRIDO.md), sección 7.
  - Entry points: `demo/race-multiview/README.md` y `demo/compatibility-pair/CREDITS.md` como
    moldes; `README.md` de la raíz, sección `demo/`.
  - Constraints: en el README de la raíz **se agregan filas y se corrige la que falta, y nada
    más**: no se reescribe el documento. Es el único archivo fuera de `demo/stage-pair/` que esta
    task toca. Depende de T-03 a T-10.

- **Definition of done:** los dos documentos de la demo existen; el `CREDITS.md` tiene una fila
  por cada archivo de `content/` y el `ls` de esa carpeta no devuelve ninguno que falte en la
  tabla; y la tabla del README de la raíz tiene las cinco demos.
- **nivel de verificación:** mínimo. Es documentación que una persona lee antes de que nada
  dependa de ella, y el único chequeo que importa —que no falte un asset en los créditos— es un
  `ls` contra la tabla.

## T-12 — La no-regresión y la publicación

- **Objective:** que esté probado que la demo nueva no rompió nada de lo que ya existía, y que la
  demo quede publicada en `qualabs-hls-demo-stage-pair`. Importa porque el criterio de la fase es
  que nada de lo que funciona se rompe, y porque una demo publicada es la que se puede abrir desde
  cualquier máquina el día del evento.

- **What it must cover:**
  - **La suite entera**, comparada contra el conteo con el que la fase arrancó (la T-01 lo anotó),
    más los tests nuevos de la demo. **Cero pruebas desaparecidas**, comparando nombres y no sólo
    el total, que es el chequeo que la fase 11 introdujo.
  - **Las dos costuras**, `npm run check`, con la lista ya extendida por la T-06.
  - **`git diff --stat -- lib/` vacío, con su control**: se toca una línea de `lib/`, se corre,
    tiene que dar no vacío, se revierte. Sin el control, un diff vacío también lo produce un
    comando mal escrito.
  - **`git diff --stat -- demo/compatibility-pair demo/hydration-break demo/multiview-offer
    demo/race-multiview` vacío**, con el mismo control.
  - **Las cuatro demos publicadas siguen respondiendo**, verificado **sin credenciales**: un
    `curl` que lleve el token del ambiente prueba que vos la ves, no que la vea otro.
  - **La publicación** en **`qualabs-hls-demo-stage-pair`**: el bucket en el HOST y no en el path,
    los `.ts` con `video/mp2t` puesto a mano, `content/.fuentes/` excluido con un patrón que
    coincida de verdad, los objetos verificados por md5, y el acceso probado sin credenciales. El
    camino completo está en el `CLAUDE.md` de la raíz y **no se reescribe nada de la demo para que
    el deploy funcione**: si un camino de deploy pide editar la demo, el camino está mal.
  - **Y los `.svg` necesitan su tipo de contenido.** Es el mismo modo de falla que el `.ts`:
    Google adivina por extensión y lo que la demo necesita es `image/svg+xml`, porque el
    `mediaType` que el asset-list declara y el que el servidor manda tienen que coincidir. Se
    verifica pidiendo el archivo y mirando el header, no asumiéndolo.
  - **La no-regresión se hace primero y no depende de nadie.**
  - Entry points: `CLAUDE.md` de la raíz, sección de publicación; el informe de la T-10 de la fase
    13 como molde de la verificación.
  - Constraints: no se toca nada de las otras demos ni sus buckets. Depende de todas.

- **Definition of done:** la suite pasa con el conteo esperado y sin pruebas desaparecidas; las dos
  costuras salen 0; los dos `git diff --stat` salen vacíos **y se los vio no vacíos** con su
  control; las cuatro demos publicadas responden sin credenciales; y la demo nueva responde en
  `qualabs-hls-demo-stage-pair`, con los `.svg` devolviendo `image/svg+xml` y los `.ts`
  devolviendo `video/mp2t`, verificado sin credenciales.
- **nivel de verificación:** alto. Corre sin que nadie la mire, su salida es la que autoriza a
  decir que no se rompió nada, y sus chequeos son todos negativos —"no hay diferencias", "no falta
  ninguna prueba"—, que es la clase de afirmación que una búsqueda rota produce igual que un
  repositorio limpio.

- **cierre de la T-12 — 2026-09-22, la publicación está hecha.** La task quedó en `in-progress`
  porque su Definition of done la incluye y faltaba el OK de Nicolás. Con el OK dado, la demo se
  publicó en **`qualabs-hls-demo-stage-pair`** y se verificó **sin credenciales**, con `curl` sin
  ningún token:

  ```
  /index.html                               200 text/html
  /inspect.html                             200 text/html
  /race.html                                200 text/html
  /content/primary/con-daterange-rica.m3u8  200 application/vnd.apple.mpegurl
  /content/primary/seg000.ts                200 video/mp2t
  /graphics/campaigns/zumbra-16x9.svg       200 image/svg+xml
  /                                         403   (listar denegado, que es lo correcto)
  /no-existe                                404   (control del instrumento)
  ```

  **Y el paso 7 de `publicar.sh` no verificó nada**: devolvió `0 objetos comparados por md5, 0
  distintos` y salió 0, porque su bucle hace `continue` cuando no puede mapear un objeto a un
  archivo local y su código de salida depende sólo del contador de distintos. La comparación se
  rehizo a mano sobre cuatro archivos —`index.html`, `race.html`, un SVG y un `.ts`—: los cuatro
  idénticos, con el control de comparar `index.html` local contra `race.html` remoto, que da
  distinto. Está en la §1 y en la §4 del `REPORT.md` de la fase.
