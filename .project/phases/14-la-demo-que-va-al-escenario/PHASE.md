---
phase: 14-la-demo-que-va-al-escenario
title: "La demo que va al escenario: tres páginas, y los creativos escritos en SVG"
status: closed
started: 2026-09-21
closed: 2026-09-22
---

# Fase 14: la demo que va al escenario

Apple comunicó que **en la presentación que se hace en sus oficinas** no se puede mostrar
contenido de video ni de imagen generado por modelos de IA. Eso tumbó la fase 14 anterior el
mismo día que se abrió, sacó del guion a `race-multiview` —el cierre, que es contenido generado
de punta a punta— y dio vuelta el problema que esa fase resolvía: hacen falta avisos que
parezcan avisos, **sin marcas reales y sin generación por modelos**.

**La restricción es de esa presentación y no de todo lo que el proyecto produce ni de lo que la
marca publica**: las cuatro demos que ya existen siguen publicadas, `race-multiview` incluida.
Lo que cambia es cómo se produce el contenido de la que se muestra ahí (ADR 0080).

Esta fase construye **una demo nueva con tres páginas, en `demo/stage-pair/`**, que es la que
se le muestra a Apple. **Las cuatro demos que existen no se tocan** y quedan como demos
internas.

El diseño y sus descartes están en `DESIGN.md`; lo que sigue es el contrato.

## Objetivo

Que exista `demo/stage-pair/` y que, corriendo, sostenga cuatro afirmaciones en cámara:

1. **El mismo stream, dos clientes, un cuadro.** Un hls.js de fábrica al lado de uno con la
   librería, sobre la misma playlist: así es hoy, así podría ser.
2. **Se monetiza el mismo espacio sin tapar la pantalla.** Del lado de fábrica el
   interstitial común tapa el cuadro; del nuestro **el recorrido pasa por las tres formas no
   lineales, una por break**: side by side, L-shape y banner.
3. **Se puede abrir el network tab y leer todo**: el manifest, los tags DATERANGE, el pedido
   del asset-list con su parámetro, y el JSON que vuelve.
4. **La capacidad del dispositivo degrada el formato del aviso, no el aviso.** El control
   declara cuántos decodificadores hay, `qa-decoder-count` **viaja de verdad** en la petición
   (ADR 0083), y el asset-list que vuelve trae **la misma forma en otro medio**: con dos
   decodificadores las variantes de video, con uno las de imagen (ADR 0084). El publisher sigue
   monetizando y el espectador sigue viendo publicidad no lineal; lo único que cambia es con qué
   está dibujada.

Y que la tercera página cierre con lo que `race-multiview` cerraba y ya no puede: **una
carrera hecha en SVG, una cámara por auto, con los avisos no lineales adelante y la ventana de
multi view después**.

## La decisión que gobierna la fase

**Cada demo resuelve su propio contenido, y el de ésta se escribe como SVG animado** (ADR 0080,
que supersede al 0045 porque aquel era una receta única para todo el proyecto). La restricción
de la presentación es sobre la salida de modelos generativos de imagen y de video; un SVG es
código que el navegador dibuja. El razonamiento completo, y lo que esa decisión disuelve —todo
el problema de recorte que arrastraban el banner de 8,89:1 y las tiras de la L—, está en la
sección 3 de `DESIGN.md`.

De ahí salen las dos cosas que el resto de la fase tiene que resolver:

- **Un SVG no es un medio.** El aviso lineal lo reproduce también el pane de fábrica, que sólo
  entiende medios, y el programa de la carrera es el contenido primario de un player. Por eso
  hay un paso de pipeline que anima el SVG y **lo captura a video** (T-05). Y como cada forma
  viaja en los dos medios (ADR 0084), ese paso corre sobre las nueve piezas, más el programa de
  la carrera y sus cámaras.
- **Un SVG puede alcanzar con cero librería, y puede que no.** `lib/renderer.js:209` define
  `isImage` como `/^image\//i`, que matchea `image/svg+xml`, y `lib/media.js` le hace
  `node.src = uri` al `<img>` que `createNode` ya creó. **Es una hipótesis, no un hecho**, y
  la T-02 la verifica antes de que se autoren las campañas que faltan.

## Alcance

1. **Tres campañas, tres formas cada una** (ADR 0081). Tres marcas de fantasía —bebida,
   calzado y turismo—, cada una autorada como SVG con tres `viewBox`: 16:9, banner de 8,89:1 y
   backplate a cuadro entero con su guarda. **Nueve piezas.** La de bebida, `ZUMBRA`, ya está
   hecha y aprobada en su forma 16:9.
2. **Las dos variantes de medio de cada forma** (ADR 0084): cada uno de los nueve SVG viaja
   además capturado a video. No son dieciocho piezas de autoría, son nueve y nueve corridas de
   un script.
3. **El puente a video**: navegador headless → cuadros → `ffmpeg` → HLS. Produce la variante de
   video de las nueve piezas, el programa de la carrera y sus cámaras. Todo mudo, salvo el
   lineal si se decide que lleve sonido.
4. **El contenido primario del par**: **SPARKS**, de Netflix Open Content, CC BY 4.0,
   transcodificado y empaquetado a HLS como los demás primarios del repositorio.
5. **La señalización del par**: tres breaks, y **una playlist por escalón de respuesta** —la
   rica y la magra—, cada una con su juego de asset-lists estáticos, más **un asset-list
   lineal por break, con la duración de su break** (ADR 0082).
6. **Tres páginas**: `index.html`, el par con el control de decodificadores; `inspect.html`,
   el player solo con lo que hay que leer en cámara; y `race.html`, la carrera en SVG con los
   avisos antes de la ventana de multi view.
7. **La escena de la carrera**: una sola escena en SVG, y **cada cámara la enmarca distinto
   siguiendo a su auto**, capturada a video.
8. **La demo publicada** en **`qualabs-hls-demo-stage-pair`**, por el camino que el
   `CLAUDE.md` de la raíz ya documenta.

## El criterio de la fase

**Nada de lo que ya funciona se rompe, y eso se prueba y no se promete.** Es el criterio que
la fase 11 fijó, y acá es barato de cumplir porque esta fase **no toca `lib/`**: lo que hay que
demostrar es que no la tocó.

La línea de base está **medida el 2026-09-21** sobre el árbol de trabajo, que es el commit
`28999e2` con `.project/` modificado y nada de código:

| chequeo | comando | línea de base 2026-09-21 |
| --- | --- | --- |
| la suite | `npm test` | **193 pruebas, 193 pasan, 0 fallan** |
| las dos costuras | `npm run check` | **verde, y sale 0**: la primera reporta 3 ocurrencias, las tres en la lista aceptada; la segunda, cero hits |

**El número de la suite no se compara contra el de esta tabla.** Es el del día en que se abrió
la fase; lo que cada task compara es contra el conteo con el que esa task arrancó.

**Y hay un detalle de la segunda costura que esta fase tiene que atender.**
`scripts/verificar-cortes.mjs` nombra los archivos que audita uno por uno, y del lado de las
demos son sólo dos: `demo/compatibility-pair/js/contract-trace.js` y
`demo/compatibility-pair/css/player.css`. La demo nueva **copia** `contract-trace.js`, que es
el consumidor del contrato del ADR 0003, así que su copia hay que agregarla a esa lista o
queda fuera del chequeo sin que nada avise. Va en la T-06.

## Los archivos que esta fase toca

**Casi todo lo que se escribe es nuevo y vive adentro de `demo/stage-pair/`.** Fuera de esa
carpeta se tocan exactamente dos archivos, los dos por una razón escrita:

- **`README.md` de la raíz** — lista tres demos y son cuatro. Es el hueco que el cierre de la
  fase 13 reportó sin tocar, y esta fase agrega la quinta, así que la corrección entra acá
  (T-11).
- **`scripts/verificar-cortes.mjs`** — la lista de archivos auditados, por la razón de arriba
  (T-06).

**No se toca `lib/`.** Si aparece algo que obligue a entrar a la librería, **es una dependencia
y se reporta**: se para, se escribe qué hace falta y por qué, y no se entra. Ya se miró dónde
podría aparecer y está en R1.

Tampoco se tocan `demo/compatibility-pair/`, `demo/hydration-break/`, `demo/multiview-offer/`,
`demo/race-multiview/`, los dos documentos de `docs/`, `run.sh`, `server.mjs` ni
`package.json`. `run.sh` no necesita cambio: toma el nombre de la demo como argumento y usa su
carpeta como raíz de documentos. `server.mjs` tampoco: sirve la carpeta entera, así que una
segunda y una tercera página son dos archivos más.

## La verificación de la fase, y qué mide cada cosa

**Un chequeo que no puede fallar no es un chequeo**, y en una fase que produce imagen el
riesgo es que todo se verifique mirando. Cinco cosas de acá son medibles, y las cinco llevan su
control escrito en la task:

- **Todo SVG se parsea como XML antes de usarse.** Es una guarda y no una medición, y está
  acá porque su modo de falla es el peor que tiene esta fase: **un SVG mal formado no se
  dibuja y no avisa**. El caso medido es una tabla markdown adentro de un comentario XML —el
  separador `| --- |` contiene `--`, ilegal dentro de `<!-- -->`—, que dejó a Chrome sin
  dibujar nada y a la captura en negro, sin un solo error.
- **Toda verificación de animación captura a la resolución nativa del creativo.** Medido sobre
  ZUMBRA: a 800 px de ancho un creativo de 1920 se reduce 2,4× y las burbujas mueven **entre
  0,5 y 3 píxeles de 383.200 comparados**, así que dos capturas seguidas dan el mismo hash por
  casualidad y el positivo sale "2 de 3"; **a 1920×1080 el mismo par mueve 14.620**. Un "md5
  igual" a resolución reducida no prueba nada.
- **La hipótesis del SVG adentro de `<img>`** (T-02). Dos capturas en dos instantes tienen que
  dar **distintas** para un SVG animado por SMIL/CSS. Los controles: un SVG sin animación tiene
  que dar **idénticas**, y uno animado por JavaScript también. Sin los dos controles, el
  positivo no dice nada.
- **La captura a video contiene la animación entera** (T-05). El conteo de cuadros y la
  duración del HLS resultante contra la duración declarada de la animación. El control: una
  captura cortada a propósito tiene que dar rojo. Es la lección de la fase 10, donde un
  comentario afirmaba que `-sseof -1 -frames:v 1` daba el último cuadro y daba el 168 de 192.
- **Un elemento de imagen no consume un decodificador de video** (T-02, y de nuevo por escalón
  en la T-07). Es la premisa sobre la que se apoya la escalera entera del ADR 0084, así que se
  verifica y no se asume: se cuentan los elementos `<video>` y las instancias del player que la
  composición tiene viva en cada escalón. La magra tiene que dar **uno**, que es el contenido
  primario, y la rica **más de uno**. La rica es el control: si las dos dan lo mismo, lo que se
  midió es el instrumento; y si la magra da dos, la premisa es falsa y la escalera no tiene
  escalones.
- **El parámetro viaja, y no viaja cuando no se declara** (T-07). Se lee el pedido del
  asset-list en las tres posiciones del control. El control negativo es la posición "sin
  declarar": si ahí también aparece `qa-decoder-count`, la medición está leyendo otra cosa.
- **No hay tramo invertido** (T-06). Los dos panes empiezan y terminan cada break en el mismo
  segundo, medido leyendo el estado del navegador y no mirando capturas, que es el instrumento
  que la fase 03 eligió y argumentó. El control: la misma medición contra un asset-list lineal
  de duración distinta a la de su break tiene que dar rojo, porque eso es exactamente lo que
  `compatibility-pair` tiene.

**Lo que no es medible se mira, y se mira entero.** Cada creativo pasa por ojo humano antes de
entrar, y **Nicolás mira la primera forma de una campaña antes de que se autoren las otras
dos**: es la única compuerta de la fase y no es de plata, es de dirección de arte. Con ZUMBRA
ya se cumplió.

**La verificación visual de las páginas es una captura headless real y no un
`getComputedStyle`**, a 400×780 y a 1907 de ancho, que son los dos anchos contra los que este
proyecto ya mide.

## Lo que la fase NO va a producir

Va escrito acá para que al cerrar no quede como un supuesto de quien lea.

- **Ningún contenido generado por un modelo de imagen o de video**, ni propio ni heredado ni
  aportado por un tercero. Todo asset que entre declara su procedencia en su `CREDITS.md`, y
  **un archivo sin procedencia declarada bloquea la demo**. Es el instrumento: la afirmación
  "no hay nada generado" no se sostiene mirando píxeles, se sostiene con la lista completa.
- **Ningún cambio en `lib/` ni en el contrato entre las dos capas.**
- **Ningún campo nuevo de señalización.** Todo lo que la demo usa está en el contrato desde
  hace fases, incluidos `qa-decoder-count` y el bloque de oferta de multi view del ADR 0064.
- **Ningún multi view en la página del par.** La separación que David pidió entre la
  señalización de publicidad y la extensión de Qualabs se ve en el árbol: el par no lo lleva,
  y `race.html` muestra primero la publicidad y después la ventana.
- **Ningún cambio a las cuatro demos publicadas.** Siguen como están, con su contenido y su
  publicación intactos, incluido el tramo invertido de `compatibility-pair`.
- **Ningún audio**, por decisión de Nicolás: las cámaras salen mudas y ninguna página promete
  audio por cámara. El foco de audio sigue funcionando porque los feeds son video, así que el
  mecanismo está; sencillamente no suena nada.
- **Ningún dato sobre viabilidad en red.** Todo se sirve local desde `server.mjs`, y que la
  demo termine publicada en GCS no la convierte en una medición de red.
- **Ninguna garantía de derechos más allá de haber leído la licencia del título y de haber
  escrito los creativos nosotros.** No hay acá un análisis de propiedad intelectual y no se lo
  va a poder citar como si lo hubiera.
- **Ninguna conclusión sobre iOS.**

## Fuera de alcance

- El **guion de la demo** —qué se muestra, en qué orden y en cuántos segundos—. Es lo único
  que David nombró en la reunión y nadie tomó, y es una decisión de contenido de la
  presentación, no de este repositorio.
- La **grabación**, y si esta demo entra en ella.
- El **deck** y lo que David dice en escenario.
- La **especificación de SVTA**, que es otro frente con su propio dueño y su propia fecha.
- **iOS**, TestFlight y la cuenta de desarrollador de Apple.

## Riesgos y mitigaciones

| | riesgo | mitigación |
| --- | --- | --- |
| **R1** | **La hipótesis del SVG adentro de `<img>` es falsa**, y las variantes de imagen del escalón de un decodificador no se mueven. Es el único lugar donde esta fase podría terminar necesitando `lib/`. | La T-02 la verifica **temprano**, con sus controles y a resolución nativa. Y si se cae, **el argumento no se cae con ella**: esas variantes pasan a ser piezas fijas, que siguen siendo publicidad no lineal sobre el programa. Lo que la hipótesis decide es si ese escalón se ve en movimiento o quieto, no si existe. Capturar esa variante a video **no** es una salida, porque es justo lo que el escalón de un decodificador no puede hacer. Si aun así hiciera falta `lib/`, es una dependencia y **se reporta, no se entra**. |
| **R1b** | **Un elemento de imagen sí consume un decodificador de video**, y entonces la escalera del ADR 0084 no tiene escalones y el argumento entero se cae. Es casi seguro que no —para un `image/*` el renderizador crea un `<img>` y `attachAsset` le pone un `src` sin instanciar ningún player— pero es una premisa y no una medición. | Se verifica en la T-02 con su control, y se vuelve a medir por escalón sobre la página real en la T-07. Si resultara falsa, **se para y se reporta**: no hay un plan B que se pueda improvisar, porque lo que se cae es la afirmación y no la implementación. |
| **R2** | **Un SVG mal formado no se dibuja y no avisa**, y el pipeline sigue con una captura negra. Ya pasó, con una tabla markdown adentro de un comentario XML. | Todo paso que consuma un SVG lo parsea como XML antes de usarlo. Es una guarda de pipeline y no una revisión humana, porque el defecto es invisible. |
| **R3** | **Una verificación de animación a resolución reducida da un falso negativo.** Está medido: 0,5 a 3 px de 383.200 a 800 de ancho, contra 14.620 a 1920×1080. | Toda captura de verificación se toma a la resolución nativa del creativo, y el número de píxeles distintos va en la evidencia y no sólo el veredicto. |
| **R4** | **`bringAhead` construye el nodo tres segundos antes de que se vea**, así que el reloj de una animación SMIL puede arrancar antes y el creativo entrar a pantalla a mitad de camino. | ZUMBRA ya está autorada contra eso —bucle de 3 s con fases repartidas y un anillo que cierra a los 6 s—, así que el bucle no tiene momento feo. La T-02 mide cuánto vale el adelanto para que las otras dos campañas se autoren sabiéndolo. No hay cambio de código en ninguna rama. |
| **R5** | **Las fuentes externas no cargan adentro de un `<img>`**, y el texto del creativo sale en otra tipografía o no sale. | ZUMBRA ya usa una pila del sistema métricamente compatible, sin `@font-face`. La T-02 **confirma el supuesto sobre el que ya se dibujó** en lugar de descubrirlo. |
| **R6** | **La captura a video no contiene lo que la animación tenía**: cuadros perdidos, arranque tarde, corte antes de que el bucle cierre. Ninguna se ve en el tamaño del archivo. | La aserción de cuadros y duración de la T-05, con su control en rojo. Es la lección medida de la fase 10. |
| **R7** | **Las seis cámaras de la carrera se leen como seis copias y no como seis cámaras.** Es el R1 de la fase 13 con otra herramienta. | Una sola escena, enmarcada distinto por cámara siguiendo a su auto, así que cada una ve a los demás entrar y salir de cuadro en momentos distintos. Se resuelve por construcción y no por prompt. Se verifica mirando las cámaras una al lado de la otra: si dos son el mismo movimiento con otro color, el encuadre no está haciendo nada. |
| **R8** | **La demo parece afirmar que hay un servidor que adapta la respuesta, y no lo hay.** | Las páginas que muestran el pedido lo dicen en palabras: el parámetro es el que un ad presentation server leería, y acá la respuesta está horneada por valor (ADR 0083). |
| **R9** | **Los creativos parecen un gráfico y no un aviso.** Es el riesgo real de la decisión del SVG, y es de dirección de arte y no técnico. | Nicolás mira la primera forma de cada campaña antes de que se autoren las otras dos. Con ZUMBRA ya se cumplió, y su estructura es la referencia de las otras dos. |
| **R10** | **La atribución de SPARKS queda mal hecha.** El sitio no especifica la forma, así que es fácil poner un crédito de una línea y creerlo suficiente. | Se redacta contra el default de CC BY 4.0, con sus cinco piezas, y la que se olvida —**indicar que se modificó**— es segura acá, porque la demo recorta, recodifica y reempaqueta. |
| **R11** | **La copia de `contract-trace.js` queda fuera del chequeo de costuras**, porque `verificar-cortes.mjs` nombra los archivos uno por uno. | La T-06 la agrega a la lista, y lo verifica **viendo el chequeo ponerse rojo** con un término del transporte plantado en la copia nueva. |
| **R12** | **Los dos minutos de demo del evento.** David dijo que hay aproximadamente dos minutos para todo, y esta fase entrega tres páginas. | El programa del par es el tramo previo a los créditos de SPARKS, cortado en 198,0 s —los créditos arrancan en 199,0 s—, y las páginas permiten saltar a un break sin esperar. Lo que no hace esta fase es el guion, que es lo que decide cuánto se muestra. |
| **R13** | **Cuatro elementos de video a la vez en `race.html`**: tres cámaras más el primario. El tope del ADR 0066 es de cuatro **cajas** y el programa es una de ellas, así que la cuarta cámara no se puede agregar. | Está adentro del sobre medido: la T-01 de la fase 01 midió cinco elementos a 1280×720 y 30 fps, y el pico real queda por debajo. Aceptado sin mitigar. |

## La arquitectura, y dónde está

El proyecto no usa `docs/arc42/`: su documento de arquitectura son los dos de `docs/`.

**Esta fase no le cambia nada a ninguno de los dos, y por eso no hay task de documentación de
`docs/`.** `docs/contrato-senalizacion-renderizado.md` es la superficie entre las dos capas y
esta fase la **consume** sin tocarla; `docs/integrating-the-library.md` es la superficie
pública, y ya documenta `decoderCount` y el parámetro `qa-decoder-count` en el que se
convierte, así que la fase lo usa tal como está escrito.

La documentación que sí produce es la de la demo, y va donde el ADR 0061 manda: **la receta
vive con el generador**. El porqué de cada línea de un SVG y de cada flag de la captura va en
la cabecera del archivo que lo ejecuta, no en el informe de esta fase. ZUMBRA ya está escrita
así.

## Los ADR

**Cuatro escritos al abrir**, porque son los que alguien podría deshacer sin saber por qué son
así:

| id | título | scope |
| --- | --- | --- |
| **0080** | Cada demo resuelve su propio contenido, y el de la que va a la presentación se escribe como SVG animado | `project` |
| **0081** | Una identidad por campaña, autorada tres veces con tres `viewBox` | `project` |
| **0082** | Un asset-list lineal por break, con la duración de su break | `project` |
| **0083** | El parámetro de decodificadores viaja de verdad y la respuesta está horneada por valor | `phase-14` |
| **0084** | La capacidad del dispositivo degrada el formato del aviso y no el aviso | `project` |

**El 0083 y el 0084 están separados a propósito**: el primero dice **cómo** viaja el dato y cómo
se sirve la respuesta sin servidor, y el segundo **qué** contiene cada respuesta. El día que haya
un ad presentation server de verdad, el 0083 queda superseded y el 0084 sigue en pie tal cual,
porque la política de degradar el formato y no el aviso es del ad stack y no del transporte.

**El 0080 supersede al ADR 0045** por dos motivos y no por uno: su primer camino —*"lo pictórico
se genera"*— es exactamente lo que dejó de estar disponible en esa presentación, y además era
**una receta única para todo el proyecto**, lo que sólo funciona mientras todas las demos tengan
las mismas ataduras. El criterio que lo reemplaza es que **cada contenido se resuelve en su
propia demo**. El 0045 queda `superseded` con su nota fechada, y lo que tenía de acertado está
conservado adentro del 0080. **El ADR 0062 no se toca**: dice dónde puede ir el movimiento
generado, lo que sigue siendo cierto y sigue gobernando cualquier demo que no vaya a la
presentación.

**Lo que todavía no es ADR y por qué** está en la sección 11 de `DESIGN.md`. El caso principal
es la forma de las cámaras de la carrera: se escribe cuando la T-09 la haya construido, porque
su consecuencia —que se lean como cámaras de la misma carrera— es una afirmación que hoy no
está medida.

## Stakeholders

- **Nicolás Levy** pidió la demo, decidió los creativos en SVG, las tres campañas, el contenido
  primario, la tercera página y el bucket. **Mira la primera forma de cada campaña**; con
  ZUMBRA ya lo hizo.
- **David Hassoun** presenta. La copia de las páginas va en inglés por eso, como en las cuatro
  demos anteriores. Fijó los tres primeros requisitos del objetivo; no participó de este
  diseño.
- **Emil Santurio** entra después por la parte de iOS, y lo que esta fase le deja es contenido
  publicado. David reportó en la reunión que Emil estaba produciendo material publicitario,
  sin que Emil lo confirmara; si ese material aparece, **es una entrada para los creativos y no
  un reemplazo del pipeline**, y pasa por el mismo chequeo de procedencia que todo lo demás.

## Sobre la fecha

**Esta fase no tiene timeline y no se planifica contra un deadline.** Nicolás lo sacó del
alcance de forma explícita: *"sobre la fecha olvidate porque eso lo tengo control yo y no pasa
nada"*. Lo que ordena las tasks es la dependencia técnica entre ellas.

Se escribe acá porque todas las fases anteriores tienen esa sección y su ausencia se leería
como un olvido.
