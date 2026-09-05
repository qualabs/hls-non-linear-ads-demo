# Tasks — fase 02-sdk-y-controles

**El corte va primero, y es la única cosa del orden que no es negociable.**
Lo que se construya antes de que la línea exista nace del lado equivocado y
hay que mudarlo después, y eso vale para los controles de esta fase y para el
`decoderCount` y el repliegue de la fase 03, que son configuración y
comportamiento del SDK.

Después va el contrato, porque la barra no se puede pintar con la única
consulta que hoy existe. Después los controles, que son la mayor parte de la
superficie pública que el ADR 0015 fija. Los tests van antes que el skin a
propósito: si el calendario aprieta, lo que se recorta es lo de abajo de la
lista, y lo que no puede quedar sin cubrir es lo que falla en silencio.

**Las dos costuras se verifican con `scripts/verificar-cortes.mjs`**, en cada
task que agregue código a la librería. Corre los dos greps —el del ADR 0003, que
el renderizado no nombre el transporte, y el del ADR 0015, que la librería no
nombre la demo— y los compara contra la lista de ocurrencias aceptadas que lleva
adentro, cada una con su razón escrita. Una ocurrencia que no esté en esa lista
lo hace fallar diciendo cuál y dónde. La lista se indexa por el contenido de la
línea y no por su número, así que una edición más arriba no la mueve.

| id   | brief                                                          | status  | plan | evidence |
| ---- | -------------------------------------------------------------- | ------- | ---- | -------- |
| T-01 | El corte: la librería y la aplicación de demo como dos cosas     | done    | —    | `.project/phases/02-sdk-y-controles/tasks/T-01/` |
| T-02 | El contrato en `docs/`, ampliado con los rangos del programa     | done    | —    | `.project/phases/02-sdk-y-controles/tasks/T-02/` |
| T-03 | Los controles de la composición: barra, pausa, audio y fullscreen | done    | —    | `.project/phases/02-sdk-y-controles/tasks/T-03/` |
| T-09 | El área de los layouts es la del video, no la del contenedor      | done    | —    | `.project/phases/02-sdk-y-controles/tasks/T-09/` |
| T-04 | Los rangos del programa marcados en la barra                     | done    | —    | `.project/phases/02-sdk-y-controles/tasks/T-04/` |
| T-05 | El volumen del asset list, con la mezcla que David propuso       | done    | —    | `.project/phases/02-sdk-y-controles/tasks/T-05/` |
| T-06 | Tests: los rangos del programa y el default de volumen           | planned | —    | —        |
| T-07 | El skin y el branding de Qualabs                                 | planned | —    | —        |
| T-08 | La documentación del integrador                                  | planned | —    | —        |

---

## T-01 — El corte: la librería y la aplicación de demo como dos cosas

- **Objetivo:** dibujar la línea del ADR 0015 antes de construir nada encima.
  Es la task que hace que los controles, y después el `decoderCount` de la
  fase 03, nazcan del lado correcto en lugar de mudarse.
- **Qué tiene que cubrir:** la librería se lleva `js/signalling.js`,
  `js/renderer.js` y el `attachAsset` que hoy vive en `js/app.js` —es el que
  sabe de hls.js, así que es funcionalidad y no plomería del integrador—; la
  demo se queda con `index.html`, `js/stock-player.js` y
  `js/contract-trace.js`. La superficie pública es la que fija el ADR 0015:
  una instancia de hls.js, un contenedor, encender lo concurrente, y una
  configuración opcional. **La distribución es un `<script src>` clásico que
  define un global, sin bundler y sin dependencias**, y eso obliga a resolver
  qué pasa con los `import`/`export` de hoy: o la librería termina siendo un
  archivo, o hay un paso que la arma, como `run.sh` ya genera la playlist
  señalizada en cada arranque. Hay una pregunta de API que conviene contestar
  acá y no descubrir después: el `interstitialsController: undefined` del ADR
  0002 lo pone hoy la aplicación, y si el integrador crea su propia instancia
  de hls.js hay que decidir si la librería lo exige, lo documenta o lo
  verifica y avisa. Punto de partida: los ADR 0015 y 0003, `js/app.js` e
  `index.html`. Restricción: **la demo no cambia lo que hace.** El recorrido
  de los cinco breaks tiene que seguir corriendo igual, hls.js entra sin
  modificar, y el grep de la costura del ADR 0003 sigue dando cero del lado
  del renderizado. Sin dependencias.
- **Definición de done:** la demo corre el recorrido de los cinco breaks
  consumiendo la librería construida, en una sola carga y sin seek, con una
  captura que lo muestra; el grep desde el lado de la librería no encuentra
  una sola referencia a la demo; y la página del integrador está medida en
  líneas, con ese número en la evidencia.
- **nivel de verificación:** bajo. Es una mudanza cuyo error aparece en el
  primer break que no se dibuja, y lo único que puede fallar en silencio es el
  corte, que lo cubre el grep.

## T-02 — El contrato en `docs/`, ampliado con los rangos del programa

- **Objetivo:** que el proyecto tenga por fin su documento de arquitectura, y
  que el contrato conteste la pregunta que la barra necesita. Hoy contesta qué
  está activo en este instante; para pintar los rangos hace falta saber dónde
  están todos los rangos del programa.
- **Qué tiene que cubrir:** promover
  `phases/01-poc-web-hlsjs/tasks/T-06/t06-contrato.md` a `docs/`. Es el único
  documento vivo que dejó la fase 01, hoy vive adentro de la evidencia de una
  fase cerrada, y la fase de iOS lo va a necesitar porque es exactamente la
  pieza que cambia al pasar de hls.js a AVFoundation. Al moverlo hay que
  corregir lo que el ADR 0014 cambió: la tabla de los dos defaults que la
  herramienta omite y la sección "Lo que el contrato NO dice" citan al 0010 y
  dicen que el aviso arranca en silencio siempre.

  La consulta nueva se diseña acá, y tiene tres condiciones. Contesta dónde
  están todos los rangos del programa y no qué está activo ahora. **Dice de
  qué clase es cada rango**, porque los colores tienen dueño y la misma
  playlist lleva un Date Range de clase Apple por break que la capa hoy
  descarta por clase (`lib/signalling.js:125`). Y **no trae el largo total como
  dato propio**, porque el largo se relee y no se guarda (ADR 0016).

  Hay un detalle del modelo que hay que resolver y no inventar: hoy las
  experiencias se resuelven a medida que llegan los asset-list, y para pintar
  la barra desde el segundo cero hace falta saber si ya están todas. En un VOD
  con los Date Ranges escritos en la media playlist llegan todos en el primer
  `LEVEL_UPDATED` y cada asset-list se pide ahí mismo, pero eso es una
  propiedad del ADR 0005 y no del contrato, y el contrato tiene que decir qué
  promete. Punto de partida: el contrato de la T-06, `lib/signalling.js`, y los
  ADR 0003, 0005, 0014 y 0016. Restricción: el renderizado sigue sin saber una
  palabra del transporte y el grep del corte sigue dando cero. Depende de
  T-01.
- **Definición de done:** `docs/` existe con el contrato adentro, la consulta
  nueva está escrita ahí con la misma forma que el resto del documento y
  contestada por la capa de señalización, y una corrida muestra los rangos de
  los cinco breaks del recorrido, con su clase, antes de que empiece el
  primero.
- **nivel de verificación:** bajo. Lo que puede fallar en silencio son los
  rangos y el largo, y los tests que les corresponden son los de la T-06.

## T-03 — Los controles de la composición: barra, pausa, audio y fullscreen

- **Objetivo:** los controles propios, adentro de la librería, que mandan
  sobre toda la experiencia y no sobre uno de sus elementos. Es lo que David
  pidió en la reunión: "we would want to have maintain the progress bar on the
  bottom and only have one progress bar".
- **Qué tiene que cubrir:**

  **Los controles nativos sobre el primario dejan de estar** (`controls` en
  `index.html:93`). La razón está medida en el código y no es de gusto:
  `lib/renderer.js:197` escala el primario con un `transform` y los controles
  nativos son parte del elemento, así que escalan con él; y con más de un
  `<video>` en pantalla controlan un pedazo y no la composición.

  **Una sola barra de progreso, de todo el contenido**, debajo del área donde
  se mueven los sub-players. **No crece cuando entra un break** y el largo se
  vuelve a leer en lugar de guardarse (ADR 0016).

  **La pausa, centrada en la composición.** Pausar la composición es pausar
  todo, y la mecánica ya existe: el renderizador sigue el `play`, el `pause` y
  el `seeked` del primario y mueve con ellos los elementos del aviso.

  **Un solo control de audio, arriba a la derecha.** Reemplaza dos cosas de
  hoy: el control nativo de volumen del primario y el botón `#ad-audio`. La
  mezcla por elemento la declara el asset list (ADR 0014, y la implementa la
  T-05); éste es el control de la composición, y es además el que la saca del
  mute con el que la página arranca por la política de autoplay. Hay un estado
  que hoy dice algo y se queda sin lugar: el botón sabía decir "el aviso en
  pantalla no tiene audio", que es distinto de "no hay aviso" y en cámara se
  distinguen. La task decide dónde queda eso, o que se va.

  **El fullscreen es de la composición**, y los controles aparecen al mover el
  mouse y se esconden solos. Dos cosas que hay que resolver acá: hoy **no hay
  una sola llamada a `requestFullscreen` en el repositorio**, así que el único
  camino es el botón nativo del `<video>`, que lleva a fullscreen el elemento
  de video solo y deja afuera la capa de avisos, que es su hermana. Y si la
  barra va debajo del área de la composición, el elemento que va a fullscreen
  deja de ser la caja 16:9 de la imagen; hay que decidir cuál es y que el
  renderizador siga midiendo el área de la imagen y no la del contenedor
  nuevo, porque hoy la toma de `layer.getBoundingClientRect()`.

  **El defecto que esta task arregla:** el botón de audio del aviso está hoy
  afuera de `#player` (`index.html:98`), que es el contenedor que la página
  documenta como el que va a fullscreen, así que en fullscreen desaparece.
  Deja de estar afuera porque deja de existir donde estaba.

  **El apilado.** Los controles tienen que quedar arriba de todos los
  elementos de todos los layouts, incluido el que pone el aviso de fondo y el
  primario encima, y sin convertir a `.ads` en un contexto de apilado:
  `css/player.css` la deja deliberadamente sin `z-index` para que el `zDepth`
  del layout decida, y cerrarla pondría todos los avisos arriba de la imagen.

  Punto de partida: los ADR 0015 y 0016, `lib/renderer.js`, `css/player.css`,
  `index.html`, y las dos imágenes de referencia que mandó Nicolás.
  Restricción: **no se toca el pane de fábrica**, que conserva sus controles
  nativos porque es un cliente de mercado y así se ve un cliente de mercado
  (ADR 0007). Depende de T-01.
- **Definición de done:** cuatro capturas a tamaño real —la composición sin
  aviso, con aviso, en fullscreen con los controles a la vista, y en
  fullscreen con los controles escondidos—, en las cuatro se ve una sola barra
  con el largo del programa entero, y en las de fullscreen se ve el control de
  audio, que es el que hoy desaparece. La barra mide lo mismo antes, durante y
  después de un break.
- **nivel de verificación:** bajo. Es interfaz y el error está en la pantalla.
  La verificación es mirar las capturas, y las de fullscreen tomadas en
  fullscreen de verdad: en este repo ya hubo dos falsos "OK" por medir estilos
  computados en lugar de mirar la imagen.

## T-04 — Los rangos del programa marcados en la barra

- **Objetivo:** que la barra diga dónde están los breaks. Es lo que David pidió
  como nice-to-have —"if you could also show like a marker on the progress bar
  when there's an ad break... make it look a little more Pro"— y es lo primero
  que alguien mirando entiende sin que se lo expliquen.
- **Qué tiene que cubrir:** los rangos que devuelve la consulta de la T-02,
  pintados sobre la barra de la T-03.

  **Los colores tienen dueño.** El amarillo ya significa interstitial
  tradicional, que es lo que usa Apple, y se respeta. El concurrente lleva
  **violeta**. El naranja fuerte queda descartado por dos razones: al lado del
  amarillo se confunde a distancia y esto se ve en pantalla grande, y en este
  repositorio el ámbar `--q-amber-400` ya significa otra cosa, que es el pane
  donde el contenido fue reemplazado (`css/player.css:65`). Es reversible: es
  un valor.

  El violeta no está en el brand kit de Qualabs, que es teal, naranja, tinta y
  papel. Entra como color funcional y no como color de marca, igual que el
  amarillo.

  Hay que **decidir y dejar dicho si la barra marca también el rango del
  interstitial tradicional** que la misma playlist lleva en cada break y que
  el player de la demo ignora por clase. Marcarlo muestra dónde un cliente de
  mercado se habría detenido, y no marcarlo evita señalar en nuestra barra un
  break que nuestro player no reproduce. Las dos son defendibles; la que se
  elija se escribe.

  Punto de partida: la consulta de la T-02, la barra de la T-03,
  `brand/README.md` y `css/player.css`. Depende de T-02 y T-03.
- **Definición de done:** una captura a tamaño real donde se ven los cinco
  breaks del recorrido marcados en la barra con el color que a cada clase le
  toca, y la misma captura reducida a un cuarto, que es la prueba barata de
  que los dos colores se distinguen a distancia.
- **nivel de verificación:** bajo. Es interfaz y el error está en la pantalla.
  La aritmética que pone cada rango en su lugar la cubren los tests de la
  T-06.

## T-05 — El volumen del asset list, con la mezcla que David propuso

- **Objetivo:** implementar el ADR 0014. El estado inicial del audio de cada
  elemento sale del asset list, y el default cuando el campo no viene es
  silencio.
- **Qué tiene que cubrir:** el renderizador deja de ignorar el campo a
  propósito (`lib/renderer.js:77-82`), y con él se va el comentario que lo
  explica.

  **El default de 0 es de los elementos del aviso y no del primario.**
  `resolveElement` resuelve todos los elementos con la misma constante,
  primario incluido, y el bloque `primaryContent` que emite la herramienta
  tampoco trae `volume` —se ve en `signalling/asset-list-multiView.json`—, así
  que un `DEFAULT_VOLUME = 0` a secas deja el contenido primario en silencio
  en los cinco layouts. Es la falla que no se ve en una captura.

  Un asset list nuevo con **la mezcla que David propuso**: 100 abajo a la
  izquierda y 10 en el resto, sobre el layout que tiene cuatro elementos, que
  es `multiView`.

  Los dos documentos vigentes que citan el ADR 0010 y quedan viejos: la
  sección `Before you record` del `README.md` y las líneas que
  `scripts/senalizar-contenido.sh` imprime en cada arranque. Los dos le dicen
  a quien graba que desmutee el primario antes de tocar el botón del aviso, y
  ese consejo nació de que el aviso arrancaba siempre callado.

  **Cómo se verifica el audio es una restricción y no un detalle: por
  elemento, leyendo `muted` y `volume` de cada nodo.** No con el monitor del
  sink de PulseAudio: la fase 01 lo dejó escrito con dos corridas, el
  instrumento no anda en esta máquina y, aunque anduviera, graba la mezcla y
  no dice cuál de los elementos suena.

  Punto de partida: el ADR 0014, `lib/renderer.js`, `lib/signalling.js` y
  `signalling/asset-list-multiView.json`. Depende de T-03.
- **Definición de done:** con el break de `multiView` en pantalla, la lectura
  por elemento muestra el de abajo a la izquierda en 100 y los otros tres en
  10, y el primario con su audio; y en un break cuyo asset list no declara
  `volume`, los elementos del aviso salen en 0 y el primario no. Los dos
  textos de grabación dicen lo que la demo hace ahora.
- **nivel de verificación:** alto. Es lo único de la fase que falla en
  silencio y en la peor dirección: un `||` en lugar de un `??`, o el default
  de 0 aplicado también al primario, no se ven en una captura y se descubren
  en la toma. Los tests y la campaña de mutación que este nivel debe son los
  de la T-06, y esa task los tiene enumerados.

## T-06 — Tests: los rangos del programa y el default de volumen

- **Objetivo:** cubrir lo único de la fase que puede fallar sin que nadie lo
  vea. Todo lo demás está en la pantalla.
- **Qué tiene que cubrir:** las funciones puras que la fase agrega y nada más.
  Son dos: la que produce los rangos del programa a partir de las experiencias
  resueltas, con su clase y su posición sobre el largo total, y la que decide
  el volumen inicial de un elemento.

  Los casos del volumen: un asset list sin el campo (los elementos del aviso
  en 0 **y el primario no**), un `volume: 0` explícito, un `volume: 100`, y la
  mezcla de la T-05. Los de los rangos: el recorrido de los cinco breaks, un
  rango de cada clase, y **los mismos rangos sobre un programa de otro
  largo** —una mutación que cablea el largo pasa desapercibida si todos los
  casos corren sobre el mismo, que es exactamente lo que la T-08 de la fase 01
  encontró con el 960—.

  La campaña de mutación que debe la T-05, una rotura por regla y corriendo
  sólo los tests que cubren esa regla. Las tres que importan: el `??` cambiado
  por `||` en el volumen, el default de 0 aplicado también al primario, y el
  largo total cacheado en lugar de releído. Una mutación que quede verde es un
  hallazgo y no una aprobación.

  Punto de partida: `test/layout-resolution.test.js`, que ya entra por la
  misma puerta que la aplicación. Restricción, y es la que define el tamaño de
  esta task: no hay tests de DOM, ni de browser, ni comparación de imágenes,
  ni cobertura como objetivo. Depende de T-04 y T-05.
- **Definición de done:** un comando corre los tests y pasan, con los casos de
  arriba cubiertos, y cada test nuevo se vio en rojo por lo menos una vez, con
  su mutación anotada.
- **nivel de verificación:** mínimo. La salida entera es una corrida que una
  persona mira. La campaña de mutación la pide el bloque, y la debe la T-05.

## T-07 — El skin y el branding de Qualabs

- **Objetivo:** que el reproductor se vea como un producto y lleve la marca.
  Es alcance propio: lo más cercano que dijo David es "make it look a little
  more Pro", y lo dijo sobre el marcador de los breaks.
- **Qué tiene que cubrir:** el skin de los controles de la T-03, en la
  dirección que eligió Nicolás, con el brand kit que ya está vendorizado en
  `brand/`. Dos cosas que el propio `brand/README.md` deja escritas y que hay
  que respetar: **el logo necesita una superficie clara** —su wordmark es
  tinta y su marca tiene formas casi blancas, así que sobre el fondo oscuro
  del player se pierde la mitad; va sobre una placa clara y no recoloreado—, y
  **la paleta se usa como acento y no como superficie**, porque en un player
  la imagen es el sujeto y todo lo demás es mobiliario encima de ella. El logo
  todavía no está en la página, y David fue explícito con que va a estar.

  El color del rango concurrente lo fijó la T-04 y no se retoca acá.

  Restricción: los archivos de `brand/` son copias byte a byte y no se editan;
  si algo del kit no sirve, se resuelve alrededor. Depende de T-03 y T-04.
- **Definición de done:** capturas a tamaño real de la composición sin aviso,
  con aviso y en fullscreen, con el skin puesto y el logo donde va; y el pane
  de fábrica sin tocar, que es la mitad del argumento de la página.
- **nivel de verificación:** bajo. Es estética y el error está en la pantalla.

## T-08 — La documentación del integrador

- **Objetivo:** que alguien que no somos nosotros pueda agregar esto a su
  página leyendo un documento. Es la forma que David le puso a esto —"then
  it's actually like clean on how this could be distributed and shared"— y es
  lo que convierte el corte del ADR 0015 en algo que se puede entregar.
- **Qué tiene que cubrir:** qué agregar (el `<script src>`, la instancia de
  hls.js, el contenedor), qué tiene que tener su página, cómo se inicializa y
  qué configuración opcional hay. Qué se lleva la librería y qué queda de su
  lado, que es el límite del ADR 0015 contado para quien integra y no para
  quien lo construyó. Y las dos cosas que la librería exige y no puede
  adivinar: el controlador de interstitials de hls.js apagado (ADR 0002), y
  que los controles nativos sobre el primario no van, con la razón, porque un
  integrador que no la sepa los va a volver a encender.

  La página de la demo es el ejemplo, y su medida en líneas es la prueba de
  que el documento no está mintiendo.

  Restricción: es documentación del producto y va a `docs/`, al lado del
  contrato. No es un README de repo ni un segundo punto de entrada del
  `README.md`, que sigue siendo el único. Depende de T-01, T-03 y T-07.
- **Definición de done:** el documento existe en `docs/`, y la página mínima
  que describe coincide con la de la demo línea por línea, sin un paso que el
  documento no diga.
- **nivel de verificación:** mínimo. La salida entera la lee una persona antes
  de que nada dependa de ella.

## T-09 — El área de los layouts es la del video, no la del contenedor

> **Se ejecuta ANTES que la T-04**, aunque su número sea más alto: cambia la
> medición sobre la que se apoya todo el renderizado, y una medición se cambia
> antes de construirle cosas encima. El número es alto porque las tasks de la
> T-04 en adelante ya estaban escritas y renumerarlas rompería sus referencias.

- **Objetivo:** que la caja contra la que se resuelven los insets porcentuales
  sea la de la **imagen** y no la del contenedor. Lo decidió Nicolás el
  2026-09-04: *"el viewport lo define el video (con su relación de aspecto), no
  el tamaño de la pantalla"*, con la restricción de que cambiar la relación de
  aspecto del video original no es una opción.
- **Qué tiene que cubrir:** hoy el renderizador toma el área con
  `layer.getBoundingClientRect()`, que es la caja del contenedor. En ventana el
  contenedor es 16:9 y las dos cajas coinciden, así que no se nota; en
  fullscreen sobre una pantalla de otra forma no coinciden, y la T-03 lo midió:
  contenedor 1920x901, imagen 1601,778 de ancho desde el píxel 159,111.

  Las dos consecuencias que este cambio elimina, escritas porque son las que
  prueban que sirvió: un aviso declarado pegado a la izquierda hoy caería sobre
  la barra negra, fuera de la imagen; y el encuadre del primario cambia al
  entrar y salir de cada break, porque con un layout activo llena el área y sin
  aviso vuelve a entrar entero.

  Hace además verdadera en fullscreen la nota del ADR 0013 que dice que el
  recorte nunca le toca al contenido primario, que hoy sólo vale en ventana.
  Restricción: **la relación de aspecto del video no se toca.** Depende de T-03.
- **Definición de done:** en ventana, las mediciones de 0,00 px siguen dando
  0,00 px — es la regresión que importa, porque ahí las dos cajas coinciden y el
  cambio no tiene que mover nada. En fullscreen sobre un viewport que a
  propósito no es 16:9: la caja de cada aviso queda **adentro** del rectángulo
  de la imagen, y el rectángulo del primario es **el mismo** con aviso y sin
  aviso. Con capturas.
- **nivel de verificación:** bajo. El error está en la pantalla, y se verifica
  mirando los píxeles de las capturas y no los estilos computados: en este repo
  ya hubo dos falsos "OK" por medir lo segundo.
