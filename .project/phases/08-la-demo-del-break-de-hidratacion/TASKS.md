# Tasks — fase 08-la-demo-del-break-de-hidratacion

Ocho tasks, **ordenadas por riesgo y no por dependencia**, que es el criterio del ADR
0008. La **T-01** mide la propiedad de la que cuelga el guion entero y es lo único que
puede cambiar el tamaño de la fase. La **T-02** deja la demo corriendo contra el
contenido de la demo actual como suplente, que es lo que desacopla los dos frentes
(riesgo R3). La **T-03** ataca el material, que es lo que puede no aparecer (R1). De ahí
en adelante es construcción: el guion, los creativos, la página, el suite y la
documentación.

**Vara de POC.** La librería no se toca en ninguna de las ocho, y `demo/compatibility-pair/`
tampoco. Los tests nuevos de la fase son los tres chequeos del suite propio de la demo y
viven en la T-07; el resto de la verificación es mirar la pantalla, que es lo que
corresponde a una página.

**El límite de gasto está en el `PHASE.md`** y se respeta a rajatabla: `agy` libre, Veo
hasta dos generaciones, cualquier otro servicio pago no. Si una task necesita más, para
y pregunta.

| id   | brief                                                          | status  | plan | evidence |
| ---- | -------------------------------------------------------------- | ------- | ---- | -------- |
| T-01 | El freno de la composición, medido en el navegador (R6)         | done    | —    | [tasks/T-01/](tasks/T-01/) |
| T-02 | La demo nueva corre, con el plate suplente                     | done    | —    | [tasks/T-02/](tasks/T-02/) |
| T-03 | El plate y el paquete de canal ficticio                        | done    | —    | [tasks/T-03/](tasks/T-03/) |
| T-04 | El guion: anclas, placa, botón, y el freno                     | done    | —    | [tasks/T-04/](tasks/T-04/) |
| T-05 | Los creativos de las tres marcas de fantasía                   | done    | —    | [tasks/T-05/](tasks/T-05/) |
| T-06 | La página: las secciones, la estética y las marcas             | done    | —    | [tasks/T-06/](tasks/T-06/) |
| T-07 | El suite de la demo, y el control de su chequeo negativo        | done    | —    | [tasks/T-07/](tasks/T-07/) |
| T-08 | La documentación: el README de la demo, la fila de la raíz      | pending | —    | —        |

---

## T-01 — El freno de la composición, medido en el navegador (R6)

- **Objetivo:** está medido, con el player corriendo y un aviso en pantalla, que
  `video.pause()` sobre el contenido primario **congela también las cajas de video del
  aviso**, y que `video.play()` las reanuda. Con eso el guion de la T-04 es un `pause` y
  la librería no se toca; sin eso, frenar pasa a ser trabajo de la librería y la fase
  crece.
- **Qué tiene que cubrir:**

  - **Se mide, no se razona.** La propiedad está leída en el código —`applyPlayback` en
    `lib/renderer.js` recorre `playable()` y decide con `video.paused`, y los listeners de
    `play` y `pause` lo llaman— y eso es justamente lo que esta task no acepta como
    evidencia.
  - **Se mide donde hay varias cajas de video a la vez**, no en un aviso de una sola. En
    el recorrido de la demo actual eso es el break del Quad, en `t≈95`, que dibuja tres
    cajas de aviso; y el break mezclado desde `t≈120`, que trae cuatro avisos en
    secuencia, incluido el lineal a cuadro entero.
  - **Empezá acá:** la demo actual ya está servida en el 8080 y **no se toca**. La página
    es `demo/compatibility-pair/index.html` y expone `window.demo` con `video`,
    `provider` y `renderer`. **Anclá las consultas en `#player`**, que es el pane de esta
    demo: la página tiene dos players con el mismo cromo y `document.querySelector('video')`
    puede devolver el otro.
  - **Qué leer, y que sea estado y no una captura.** Para cada nodo de video del aviso
    adentro de `#player`: `paused`, `currentTime` y `readyState`. Antes del `pause`,
    después del `pause` —dos lecturas separadas por medio segundo, para distinguir
    "quieto" de "todavía no arrancó"— y después del `play`. Y `provider.activeAt(t)` en
    cada momento, para dejar escrito qué aviso estaba en pantalla.
  - **Navegador con el skill `playwright`**, que es el default del repo padre.
  - **Constraint:** no se modifica un archivo del repositorio en esta task. Es una
    medición. Y no se corre ningún `pkill` ni `killall`.
  - Sin dependencias.
- **Definición de done:** un archivo de lecturas en `tasks/T-01/` donde, para el break del
  Quad y para el mezclado, los nodos de video del aviso pasan de `paused: false` a
  `paused: true` con el `pause` del primario y vuelven a `false` con el `play`, y donde el
  `currentTime` de cada nodo **no avanza** entre las dos lecturas de la pausa. Más una
  captura de la pantalla congelada. Si algún nodo sigue corriendo, la task **no falla: el
  hallazgo es el resultado**, y se reporta enseguida porque cambia el tamaño de la fase.
- **nivel de verificación:** mínimo. Toda la salida es una lectura que una persona lee
  antes de que algo dependa de ella, y lo único que decide es si se sigue por el camino
  del ADR 0040 o por otro.

## T-02 — La demo nueva corre, con el plate suplente

- **Objetivo:** existe `demo/hydration-break/` y `./run.sh hydration-break` la levanta:
  empaqueta su contenido, escribe su playlist señalizada y la sirve. En pantalla corre un
  break de cuatro avisos en la curva de intrusión del ADR 0043 —banner, L, lineal,
  overlay— con el lineal tercero, y **todavía con el material de la demo actual como
  suplente**, que es lo que desacopla esta fase del trabajo de assets (R3).
- **Qué tiene que cubrir:**

  - **La carpeta es una demo más y la sdk no cambia.** El ADR 0022 ya sirve la carpeta de
    la demo como raíz de documentos, así que no hay que tocar `run.sh`, `server.mjs` ni
    `scripts/` de la raíz. Si algo de la raíz pareciera necesitar un cambio, es un
    hallazgo para reportar (ADR 0040) y no un cambio para hacer.
  - **Empezá acá:** `demo/compatibility-pair/` es el molde —`scripts/preparar-contenido.sh`,
    `scripts/empaquetar-contenido.sh`, `scripts/senalizar-contenido.sh`, `signalling/`,
    `index.html`, `js/app.js`— y `docs/integrating-the-library.md` es lo que una página
    escribe para usar la sdk. Los ADR a leer antes de tocar algo: **0022** (la raíz de
    documentos), **0021** (un signalling por demo), **0019** (el aviso lineal es un asset
    sin bloque), **0043** (el orden del minuto), **0046** (el banner es imagen fija),
    **0044** (el corrimiento declarado una vez), **0013** (el llenado de la caja).
  - **El asset list del break**: un solo `EXT-X-DATERANGE` de la clase concurrente con
    cuatro `ASSETS`. El primero un banner inferior cuyos elementos son `image/*`; el
    segundo la L; el tercero **sin bloque de layout**, que es el lineal de 10 s; el cuarto
    un overlay de esquina. `asset-list-squeezebackLShape-image.json` de la demo actual es
    la forma que ya existe para el caso de la imagen.
  - **El corrimiento de la parada se declara una vez** (ADR 0044), en un archivo de la
    demo que **los dos scripts leen** —el que empaqueta y el que señaliza— y que el suite
    de la T-07 también pueda leer. El script de señalización ya invoca `node -e` para leer
    los asset lists, así que un JSON sirve para los tres lectores.
  - **El plate suplente**: el mismo material abierto de la Blender Foundation que la demo
    actual empaqueta, recortado al largo que el minuto necesita. La atribución que la
    licencia exige va desde ya en el `CREDITS.md` de la demo, aunque el material sea
    provisorio.
  - **Cuidado con `lib/`.** `npm run check` grepea el literal `demo` en `lib/*.js` con
    lista de aceptados vacía (ADR 0015). Esta task no debería tocar `lib/`, y si lo
    tocara, no puede nombrar la demo ahí.
  - **Constraint:** el server del 8080 queda arriba y sirve la demo actual. Si hace falta
    servir la demo nueva, **es otro puerto**, y se dice cuál.
  - Sin dependencias.
- **Definición de done:** `./run.sh hydration-break` en otro puerto levanta la página, la
  corrida entera se ve, y el break entra en el corrimiento declarado con los cuatro avisos
  en orden: el banner con el partido entero a la vista, la L con el programa replegado, el
  lineal tapando la pantalla con el programa corriendo detrás, y el overlay. Evidencia: la
  tabla que imprime el script de señalización y una captura por aviso. Y `npm test` y
  `npm run check` siguen en verde.
- **nivel de verificación:** bajo. Lo que esta task produce se ve en la pantalla y un
  error se corrige barato; la lógica no visual que agrega —el corrimiento declarado y la
  forma del asset list— la asierta la T-07.

## T-03 — El plate y el paquete de canal ficticio

- **Objetivo:** existe el plate propio de la demo: ~90 s en tres actos —juego, parada del
  juego, juego— con material amateur limpio de derechos, y **con el paquete de canal
  ficticio quemado encima**: bug de canal, scorebug, reloj y nombres de equipos
  inventados. Con eso el metraje se lee como una transmisión en vivo, que es lo que ningún
  material legalmente limpio hace por sí solo.
- **Qué tiene que cubrir:**

  - **Es la pieza de mayor palanca de la fase y por eso va temprano** (R1). El paquete de
    canal es lo que cierra la grieta entre "parece transmisión" y "es legalmente limpio".
  - **Empezá acá:** el anexo de contenido en
    `sandbox/contenido-demo-hls-ig-2026-09-09.md` del repo padre, que trae las fuentes
    revisadas una por una con su licencia y el link donde se leyó, las dos trampas
    —quién tiene los derechos de verdad, y marcas reales en cuadro— y el pipeline
    verificado de SVG a PNG con alfa por Chrome headless más el overlay con ffmpeg.
  - **El paquete se escribe como SVG** y se rasteriza con Chrome headless, no se genera
    (ADR 0045): es geometría y tipografía chica.
  - **Las dos trampas legales, y las dos son de mirar los cuadros y no los títulos.** Un
    clip que parece transmisión es casi siempre la grabación de un hincha en un partido
    profesional real, con escudo, camiseta con sponsor y vallas; y el material limpio
    puede traer una marca incidental en cuadro. **Chequeo de cuadro antes de usar cada
    clip.**
  - **Y una restricción de selección que no es estética:** los clips más limpios de
    técnico y equipo muestran lo que parecen menores y no hay releases, así que **se
    prefieren clips de adultos aunque encuadren peor.**
  - **El corrimiento de la parada** es el valor que la T-02 declaró: el plate se corta
    para que la parada arranque ahí, o se cambia ese valor. Nunca los dos números a mano.
  - **Constraint:** nada de servicios pagos. El material es gratis y de licencia leída.
  - Depende de T-02, que es donde el corrimiento se declara.
- **Definición de done:** `content/primary/` empaquetado desde el plate propio, la parada
  del juego arranca en el corrimiento declarado, y el paquete de canal se ve en el cuadro
  durante los tres actos. Evidencia: la lista de clips usados con su fuente y su licencia,
  una captura de cada acto, y la nota del chequeo de cuadro por clip.
- **nivel de verificación:** bajo. Es imagen: el error está en la pantalla y lo que hay
  que hacer es mirarla, un cuadro por acto.

## T-04 — El guion: anclas, placa, botón, y el freno

- **Objetivo:** la demo guiada corre. Al entrar, el player está en pausa con la primera
  placa; cuando se va, el programa arranca; y en cada beat la experiencia se frena sola,
  la placa explica lo que está por pasar, se va, y el player sigue para que se vea pasar.
  El beat del cambio del aviso 2 al 3 cuenta el caso de negocio. Hay un botón para
  saltear, y cuando el guion termina el usuario queda libre con el player.
- **Qué tiene que cubrir:**

  - **Las anclas se resuelven contra el contrato y nunca contra un cronómetro** (ADR
    0037). `provider.programRanges()` para los rangos y `provider.experiences` para los
    avisos, y **la página no construye identificadores**: `break: n` es el n-ésimo rango
    con `kind === 'concurrent'`, y `ad: k` el k-ésimo aviso de ese rango ordenado por
    `startTime`. Si al terminar la task hay un segundo absoluto del programa escrito en
    el código o en el guion, la task se hizo distinta de como está decidida.
  - **El guion es `story/story.json`** (ADR 0038), con `id`, `anchor`, `text` y `hold` por
    beat. Los textos se editan sin tocar JavaScript.
  - **El armado espera `settled` y el primer beat es una placa con el player en pausa**
    (ADR 0039). No hay resolución tardía de anclas.
  - **El freno es `video.pause()`** (ADR 0040) y los beats se disparan desde un loop de
    `requestAnimationFrame` propio de la página, no desde `timeupdate`.
  - **La placa es una capa de la página y `#player` lleva `isolation: isolate`** (ADR
    0041), porque el cromo se dibuja con `z-index: 2147483000`.
  - **Una sola salida, el botón** (ADR 0042). Un gesto sobre los controles **no** corta la
    guiada.
  - **Empezá acá:** `docs/contrato-senalizacion-renderizado.md` es el documento del
    contrato, y la sección "Los rangos del programa" es la que describe `programRanges`.
    `demo/compatibility-pair/js/app.js` muestra cómo una página lee el contrato sin
    saber nada de la librería.
  - **El texto del beat del caso de negocio se juzga aparte.** Es el único lugar donde la
    demo argumenta en palabras y no en pantalla: es donde el espectador pasa de "casi no
    puedo ver el partido" a "no puedo verlo". **Si sale flojo, se dice en lugar de dejarlo
    pasar.**
  - **Constraint:** la librería no se toca. Si el freno o la placa no se pudieran hacer
    desde afuera, es un hallazgo para reportar (ADR 0040) y ahí la fase cambia de tamaño.
  - Depende de T-01, que es la que dice si el freno es un `pause`, y de T-02.
- **Definición de done:** la corrida guiada entera se ve de punta a punta: la placa de
  apertura con el player quieto, un beat antes del break, el beat del cambio 2 → 3, y el
  final que deja el player libre. El botón de saltear corta la guiada en cualquier momento
  y un click sobre los controles no la corta. Ni el guion ni el código contienen un
  segundo absoluto del programa. Evidencia: una captura por beat, el `story.json`, y la
  corrida mirada.
- **nivel de verificación:** bajo. Es interfaz y el error está en la pantalla —una placa
  sobre lo que no corresponde se ve en la primera pasada—; la lógica no visual que agrega,
  que es la resolución de las anclas, la asierta la T-07.
- **post-ejecución:** 2026-09-09, la placa quedaba visible después de terminar la guiada, y
  `card.hidden` leía `true` todo el tiempo: el `display: grid` de la hoja de estilos le gana
  al `[hidden]` del navegador, porque uno es regla de autor y el otro de user-agent. Se
  agregó `.card[hidden] { display: none }` y el `end()` ahora también borra el `data-on`
  que la dejaba opaca. **Lo encontró una captura de la T-05 y no la verificación de la
  T-04**, que había leído la propiedad en lugar de mirar la imagen.

## T-05 — Los creativos de las tres marcas de fantasía

- **Objetivo:** existen los creativos del minuto: las tres marcas de fantasía —una cola,
  unos zapatos, una empresa de viajes— con identidad propia, el banner inferior como
  imagen fija, la L, el overlay de esquina, y el spot lineal de diez segundos. Y ninguno
  imita el vestido comercial de una marca real.
- **Qué tiene que cubrir:**

  - **El reparto de herramientas del ADR 0045**, y no el que salga más cómodo: lo
    pictórico se genera con `agy generate_image`; la geometría y **toda la tipografía** se
    escriben como SVG y se rasterizan con Chrome headless; y el movimiento se genera sólo
    en el spot lineal, donde la tipografía vuelve al final compuesta con SVG.
  - **El banner va a la relación de aspecto exacta de su caja** (ADR 0046), calculada de
    los porcentajes del `viewport` sobre el área de la imagen, porque el ADR 0013 llena
    cada caja con recorte centrado y lo que se recorta son los bordes, que es donde vive
    la tipografía de un banner.
  - **El chequeo de vestido comercial es un paso, no una formalidad**, y está medido dos
    veces que el generador deriva hacia marcas reales aunque se le prohíba
    explícitamente. Nada de script cursivo blanco sobre rojo para la cola, nada de pipa ni
    de tres tiras para los zapatos. **Cada pieza generada se mira antes de ir a pantalla,
    y la nota del chequeo queda escrita.**
  - **El límite de gasto**: `agy` libre; **Veo hasta dos generaciones** de hasta 10 s con
    `veo-3.1-fast-generate-001`. Si hicieran falta más, **la task para y pregunta** en
    lugar de encadenarlas. Ningún otro servicio pago.
  - **El spot lineal sale sin audio** —Veo no lo genera— así que lleva una cama musical
    CC0.
  - **Empezá acá:** el skill `antigravity-cli` para `generate_image`, y el anexo de
    contenido para el pipeline de SVG a PNG con alfa y el overlay con ffmpeg. Los ids de
    Veo vigentes terminan en `-001` y **se buscan en la documentación, no se inventan**:
    el 404 de un id retirado no distingue "no existe" de "no tenés acceso".
  - Depende de T-02, que es de donde salen las cajas y sus relaciones de aspecto.
- **Definición de done:** los cuatro creativos están en `content/` y se ven en el break,
  cada uno en su caja y sin deformación ni recorte de tipografía. Y **hay una nota de
  chequeo de vestido comercial por pieza generada**, escrita, que diga qué se miró: sin
  esa nota la pieza no va a pantalla y la task no está hecha. Evidencia: los creativos, la
  captura de cada uno en su caja, y las notas del chequeo.
- **nivel de verificación:** bajo. Son imágenes y un spot: el error está en la pantalla.
  El chequeo de vestido comercial no es un test sino un paso de la definición de done, y
  ahí es donde vive el rigor de esta task.

## T-06 — La página: las secciones, la estética y las marcas

- **Objetivo:** la página cuenta el caso en la estética acordada: el player primero,
  grande y sin marco, a altura completa; el scroll contando la historia hacia abajo; y el
  masthead con la marca de Qualabs junto a la de SVTA.
- **Qué tiene que cubrir:**

  - **Las seis propiedades de la estética**: una idea por pantalla con secciones de altura
    completa; mucho aire; jerarquía de dos o tres tamaños tipográficos y nada más; paleta
    corta y casi toda neutra, con **el color traído por el video y no por la página**;
    cero decoración —sin gradientes de adorno, sin sombras dramáticas—; y movimiento
    sobrio.
  - **Tope de cuatro secciones**, y el tope es un tope y no un objetivo: el player, el
    mecanismo, la señalización mostrada como lo que es, y los créditos. Tres es mejor que
    cuatro.
  - **La marca de Qualabs va junto a la de SVTA y nunca adentro del cuadro**, que es lo
    que la fase 04 dejó cerrado.
  - **La página está en inglés**, como la de la demo actual y por la misma razón: el
    lector es la sala del HLS Interest Group.
  - **El celular tiene que ser usable, no tener una versión propia.** Es de donde salieron
    las fases 04 y 07, así que se mira una vez desde ahí.
  - **Constraint:** no se pule. La vara es que la pantalla cuente el caso en treinta
    segundos, no que la transición esté en la curva correcta (R4).
  - Depende de T-02 y de T-04.
- **Definición de done:** la página se abre, no se toca nada, y a los treinta segundos el
  caso de negocio llegó. Evidencia: una captura por sección al tamaño real de uso, más una
  del celular.
- **nivel de verificación:** bajo. Es la interfaz entera: una captura por estado al tamaño
  real de uso, y mirar la imagen.

## T-07 — El suite de la demo, y el control de su chequeo negativo

- **Objetivo:** la demo nueva tiene su propio suite, adentro de su carpeta, que asierta
  las tres cosas que pueden romperse en silencio editando un archivo: que **toda ancla del
  guion cae en un break y en un aviso que existen**, que **el break arranca en el
  corrimiento declarado**, y que **el asset list declara las tres formas del minuto**.
- **Qué tiene que cubrir:**

  - **El chequeo de anclas es el que hace que el ADR 0037 sea una propiedad y no una
    intención.** Resuelve el guion contra la señalización de la demo —la tabla del script
    y los asset lists— y exige que toda ancla caiga en un rango y en un aviso presentes.
    Un guion que referencia el aviso 4 de un break que tiene tres tiene que ser un rojo.
  - **Y el chequeo pide su control** (R7): antes de darlo por bueno se lo corre con un
    ancla deliberadamente equivocada y **tiene que fallar**. El resultado de ese control
    va en la evidencia. Es la cuarta vez que este proyecto se cruza con un chequeo que no
    podía fallar, y por eso está escrito como paso.
  - **El chequeo del corrimiento** (ADR 0044): el break que el script señaliza arranca en
    el valor declarado.
  - **El chequeo de las tres formas** (ADR 0043 y 0046): cuatro avisos, exactamente uno
    sin bloque de layout **y tercero**, y exactamente uno cuyos elementos son `image/*`.
  - **Empezá acá:** `demo/compatibility-pair/test/signalled-run.test.js` es el molde y
    dice por qué existe: el suite de la sdk lee datos congelados a propósito (ADR 0023) y
    lo que no notaría es que la corrida de **esta** demo cambie de forma. Lee los archivos
    de la demo, no `test/fixtures/`.
  - **Constraint:** el suite lo descubre `node --test` sin argumentos desde la raíz. **Se
    corre `npm test`**, no `node --test test/`, que da un rojo que no existe.
  - Depende de T-02 y de T-04.
- **Definición de done:** `npm test` en verde con los tres chequeos nuevos sumados a los
  que ya había, y la evidencia del control del chequeo de anclas: la corrida con el ancla
  equivocada, en rojo, pegada verbatim.
- **nivel de verificación:** alto. Es código que corre desatendido y cuya falla es un
  verde que no significa nada, que es exactamente el modo en que este proyecto ya se
  equivocó tres veces. La campaña de mutación es una por regla que el suite asierta: un
  ancla fuera de rango, un corrimiento cambiado, y un asset list al que se le saca la
  imagen o se le mueve el lineal; cada rotura corre **sólo el chequeo que la cubre**, y
  una rotura que queda en verde es un hallazgo.

## T-08 — La documentación: el README de la demo, la fila de la raíz

- **Objetivo:** la demo se puede correr sin preguntarle a nadie, y quien llega al
  repositorio sabe cuál de las dos demos mirar y por qué.
- **Qué tiene que cubrir:**

  - **El ADR 0025 reparte esto**: el README de la raíz **enruta** y cada demo **cuenta su
    corrida**. Así que `demo/hydration-break/README.md` con lo que la demo necesita antes
    de correr, qué pone en pantalla, y qué esperar mientras corre —incluido **encender el
    audio una vez al empezar**, que es el mismo paso de la demo actual y por la misma
    política de autoplay del browser—; y una **fila nueva** en la tabla de `demo/` del
    README de la raíz que diga **qué argumenta** esta demo, no qué contiene.
  - **El `CREDITS.md` de la demo** con la atribución que las licencias del material
    exigen, y la misma línea de crédito en la página.
  - **La política de documentación del repo padre** —`knowledge/documentation-policy.md`—
    decide qué va en el documento y qué en el `--help` de la herramienta. Leerla antes de
    escribir.
  - **Constraint:** el README de `demo/compatibility-pair/` no se toca. La fila nueva se
    agrega a la tabla de la raíz sin reescribir la que ya está.
  - Depende de las siete anteriores.
- **Definición de done:** alguien que no trabajó en la fase levanta la demo siguiendo su
  README y ve la corrida, y la tabla de la raíz tiene las dos demos con lo que cada una
  argumenta. Evidencia: los dos archivos y el diff de la fila.
- **nivel de verificación:** mínimo. Toda la salida es texto que una persona lee antes de
  que algo dependa de ella.
