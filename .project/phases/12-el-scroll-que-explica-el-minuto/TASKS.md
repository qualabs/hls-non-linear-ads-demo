# Tasks — fase 12-el-scroll-que-explica-el-minuto

| id | brief | status | plan | evidence |
| --- | --- | --- | --- | --- |
| T-01 | Las cuatro secciones, la copia en inglés y el comentario de cabecera | done | — | [`tasks/T-01/`](tasks/T-01/README.md) |
| T-02 | La galería de formas, dibujada del contrato, con su guarda | done | — | [`tasks/T-02/`](tasks/T-02/README.md) |
| T-03 | La señalización navegable: los pliegues, la glosa y la marca en vivo | done | — | [`tasks/T-03/`](tasks/T-03/README.md) |
| T-04 | La figura de la convivencia, dos columnas sobre una playlist | done | — | [`tasks/T-04/`](tasks/T-04/README.md) |
| T-05 | La no-regresión: que la demo que se graba siga en pie | done | — | [`tasks/T-05/`](tasks/T-05/README.md) |
| T-06 | La afirmación falsa afuera, y lo que puede ir en una caja adentro | done | — | [`tasks/T-06/`](tasks/T-06/README.md) |
| T-07 | El payload explicado: la glosa del bloque, campo por campo | done | — | [`tasks/T-07/`](tasks/T-07/README.md) |
| T-08 | La marca, centrada y en blanco, y la misma cerrando los créditos | done | — | [`tasks/T-08/`](tasks/T-08/README.md) |

**Las tres últimas son el feedback de Nicolás sobre la página ya construida**, y entran
como tasks de la fase y no como una fase nueva: no cambian el objetivo ni el alcance de
la 12, corrigen y completan lo que las cinco primeras dejaron. Las tres corrieron juntas
y se verificaron una vez, así que las tres corridas viven en `tasks/T-06/` y las otras
dos apuntan ahí.

**El orden lo pone quién es dueño de `index.html`.** La T-01 va primera porque deja
el esqueleto y los dos puntos de montaje donde las otras enganchan; sin ella, la T-02
y la T-03 no tienen dónde dibujar. La T-04 vuelve a tocar `index.html`, así que corre
después de la T-01 y **nunca a la vez**.

**La T-02 y la T-03 van una después de la otra y no en paralelo**, aunque cada una
tenga su módulo propio: las dos agregan una línea a `js/app.js`, y dos agentes
editando el mismo archivo por una línea cada uno es la clase de conflicto que cuesta
más resolver que serializar.

**Lo primero que se ve en pantalla es la T-01**, y se ve entera: las cuatro secciones
con su copia final, con dos cajas vacías donde después entran la galería y los
pliegues. La página se lee de punta a punta desde la primera task, que es lo que
permite discutir la copia antes de construir lo de adentro.

**Por qué no hay tasks de tests aparte, salvo la T-05.** El default del proyecto es
que lo que se construye viaje con sus tests, y acá lo testeable es chico y vive
pegado a lo que lo produce: la guarda de la galería es de la T-02 y el chequeo de los
pliegues es de la T-03. La T-05 es otra cosa y por eso sí es una task: no escribe
tests de lo que la fase construye, **verifica que lo que ya existía sigue en pie**.

**Y no hay task de documentación.** Los dos documentos de `docs/` no cambian, y está
argumentado en `PHASE.md`. La única documentación que esta fase vuelve falsa es el
comentario de cabecera de `index.html`, y lo arregla la misma task que lo rompe.

---

## T-01 — Las cuatro secciones, la copia en inglés y el comentario de cabecera

- **Objective:** la página, de la cintura para abajo, está en su orden nuevo y se lee
  entera: avisos lineales y no lineales, la clase concurrente y su convivencia, la
  señalización, y los créditos. La copia final está puesta, en inglés y en la voz de
  la página, y el comentario de cabecera describe el archivo que quedó y no el
  anterior. Importa porque es el esqueleto del que cuelga todo lo demás, y porque es
  el momento de discutir la copia: después ya está construida alrededor.

- **What it must cover:**
  - **Las cuatro secciones en el orden del pedido**, con la estructura sección por
    sección de `DESIGN.md` como fuente de la copia. El borrador de ahí es material de
    trabajo y no texto aprobado palabra por palabra: se puede mejorar, y lo que no se
    puede es cambiar el encuadre del ADR 0076.
  - **Lo que se reusa va reusado y no reescrito.** El H2 *"One playlist. One tag. Four
    Ads, and the match never stopped."*, el lede de `What the player did`, la lista de
    tres números, y el kicker, el H2 y el lede de `The signalling, as it is served`.
    Están nombrados uno por uno en la sección *Qué se reusa y qué se tira* de
    `DESIGN.md`.
  - **Los dos puntos de montaje, vacíos.** Un contenedor para la galería en la
    sección 1 y otro para los pliegues en la sección 3. Vacíos y sin texto de relleno:
    una caja vacía se ve, y un "loading…" que nunca carga miente.
  - **La sección 3 conserva sus dos `<pre>` funcionando.** `showSignalling()` de
    `js/app.js` los busca por `id`, así que se mueven intactos con sus `id` intactos.
    La página tiene que seguir mostrando el tag y el asset-list al terminar esta task.
  - **Los créditos se mueven sin tocarse** y siguen siendo el pie, con su
    `chapter--end`.
  - **El comentario de cabecera reescrito** (ADR 0077): el de hoy describe tres
    bloques que dejan de existir con ese nombre, y dice que el tope es de cuatro
    contando el player. Lo nuevo dice que el tope es de ideas por pantalla y que los
    créditos son el pie.
  - **La convención de mayúsculas que está viva:** `Ad` y `Ads` van con mayúscula.
    Hay un cambio sin commitear en el árbol que la aplica, y la copia nueva la sigue.
  - **La línea de base de la fase**, medida antes de tocar nada y guardada como
    evidencia: `npm test`, `npm run check` y `npm run mutaciones`.
  - **Entry points:** `demo/hydration-break/index.html` de la línea 130 al final,
    `demo/hydration-break/css/page.css` en el bloque *THE SCROLL BELOW THE PICTURE*,
    y las secciones *La estructura nueva, sección por sección* y *Qué se reusa y qué
    se tira* de `DESIGN.md`. Los ADR 0076 y 0077.
  - **Constraints:** no se toca la apertura, ni `.stage`, ni `#player`, ni una línea
    de `js/app.js`. No se toca `lib/` ni las otras dos demos. La estética no cambia:
    se reusan las clases que ya existen —`chapter`, `chapter__inner`, `kicker`,
    `lede`, `facts`, `code`— y no se agregan colores, que es la propiedad que la
    página defiende desde la fase 04. Sin dependencias.

- **Definition of done:** la demo levanta con `./run.sh hydration-break`, el
  recorrido guiado corre igual que antes, y bajando se leen las cuatro secciones en
  orden con su copia final y las dos cajas de montaje vacías. El tag y el asset-list
  se siguen viendo en la sección 3. Capturas a 400×780 y a 1907 de ancho, y en las
  dos el documento no scrollea de costado.

- **nivel de verificación:** **bajo**. Es interfaz y el error está en la pantalla.
  Sin tests nuevos: no hay lógica no visual acá. La verificación es mirar las dos
  capturas, y la suite existente corre entera una vez al final.

## T-02 — La galería de formas, dibujada del contrato, con su guarda

- **Objective:** la sección 1 muestra las formas de aviso de este minuto como las
  cajas que el layout declara, derivadas de lo que el proveedor resolvió y no de una
  lista escrita en la página. Queda fijado por aserción que es así: si alguien la
  reemplaza por imágenes o por una lista de tipos a mano, la suite se pone roja.
  Importa porque el valor entero de la pieza es que no puede quedar vieja, y una
  propiedad negativa que nadie mide dura hasta el primer apuro.

- **What it must cover:**
  - **La enumeración sale del contrato y de sus dos métodos.** Se recorren los rangos
    de `programRanges()` **filtrando por `kind === 'concurrent'`**, se muestrea
    `activeAt` a lo largo de cada uno, y se juntan los `itemId` distintos, que es la
    regla 6 del contrato. El filtro por `kind` es lo que hace que esta task no dependa
    de la fase 11.
  - **El primer paso es comprobar la premisa.** `activeAt` tiene que contestar por
    tiempos que todavía no se reprodujeron. Está leído en la fuente y es un `filter`
    sobre el array completo de experiencias resueltas, así que debería. **Si resulta
    falso, la task para y reporta**: la salida es el hallazgo, no un parser del
    asset-list escrito en la página, que duplicaría los dos defaults del ADR 0004 y es
    exactamente lo que el diseño descartó.
  - **Una ficha por aviso.** Un cuadro 16:9 con las cajas del layout en los
    porcentajes exactos de `box`, el contenido primario marcado, y el apilado en el
    orden de `zDepth` que el contrato ya entrega ordenado. Rotulada con el `type`, el
    medio y la duración, **todo leído del contrato**. La del aviso lineal es un solo
    rectángulo a cuadro entero.
  - **La guarda, que es la mitad de la task.** Un chequeo nuevo en
    `test/comprobaciones.js`: ninguno de los identificadores de layout aparece como
    literal en `index.html` ni en `js/tipos.js`. Es una propiedad medible y no una
    conclusión repetida.
  - **Y la guarda va con su control**, porque un chequeo que nadie vio fallar es un
    chequeo que nadie sabe que puede fallar: en `test/mutaciones.mjs`, una copia con
    un identificador plantado a propósito, y el chequeo tiene que encontrarlo.
  - **Una línea de prosa al pie de la sección**, diciendo que las formas no se agotan
    en éstas, sin enumerar (ADR 0074).
  - **Entry points:** `docs/contrato-senalizacion-renderizado.md`, secciones *Los
    datos*, *Las seis reglas de lectura* y *Los rangos del programa*; `js/app.js`, la
    función `shape()` y `paint()`, que ya leen el contrato de esta misma manera;
    `test/comprobaciones.js` y `test/mutaciones.mjs` como molde de forma. Los
    ADR 0073 y 0074.
  - **Constraints:** no se toca `lib/`. Si la galería parece necesitar un método nuevo
    del proveedor, eso es un hallazgo y se reporta: es la señal de que está dibujando
    algo que el contrato no dice. El módulo nuevo es `js/tipos.js` y el único cambio
    en `js/app.js` es una línea de import y su llamada. Depende de T-01.

- **Definition of done:** la sección 1 muestra cuatro fichas cuyas cajas coinciden con
  los `viewport` del asset-list, comprobado contra los números de
  `signalling/asset-list-hydration-break.json`. `npm test` verde con el chequeo nuevo
  adentro, y `npm run mutaciones` mostrando que ese chequeo se pone rojo cuando se
  planta un identificador. Captura de la sección a 1907 de ancho.

- **nivel de verificación:** **bajo**. Es interfaz y un dibujo mal ubicado se ve en la
  captura. Lleva tests igual, y no por costumbre: la derivación de las cajas y la
  guarda son lógica no visual, que es exactamente lo que este nivel sí manda testear.
  Sin campaña de mutación completa: sólo el control de la guarda, que es una rotura
  deliberada sobre un chequeo.

## T-03 — La señalización navegable

- **Objective:** el asset-list de este ejemplo se puede recorrer: un pliegue por
  aviso, cerrado, con el JSON crudo de ese asset adentro, y el aviso que está en
  pantalla marcado en vivo. Lo que hoy hace verdadera a la sección —el tag y el JSON
  leídos del player que está corriendo— sigue intacto. Importa porque hoy la página
  muestra un resumen y esconde cien líneas, y el público lee playlists para vivir.

- **What it must cover:**
  - **`showSignalling()` se muda de `js/app.js` a `js/senalizacion.js`** y crece ahí.
    La lectura en vivo no cambia: la playlist se sigue pidiendo por red y el
    asset-list se sigue sacando del `X-ASSET-LIST` del tag.
  - **Un `<details>` por `ASSET`**, cerrado. El `<summary>` es la línea de resumen que
    hoy se imprime —`Ad 2 · squeezebackLShape · 16 s · video`—, que **deja de ser el
    contenido y pasa a ser el rótulo**. Adentro, el JSON crudo de ese asset,
    `JSON.stringify(asset, null, 2)`, sin reducir.
  - **La marca del aviso en pantalla.** El `<summary>` del aviso activo lleva una
    marca en vivo, comparando por `itemId` contra `provider.activeAt(video.currentTime)`,
    que es la regla 6 del contrato y lo que `paint()` ya hace en cada `timeupdate`.
  - **Se marca y no se abre solo** (ADR 0075). Abrir el pliegue automáticamente pelea
    con quien está leyendo: si alguien abrió el aviso 3, el player le abriría el 4
    encima a los ocho segundos.
  - **La glosa del tag**, una línea por atributo, **dibujada sólo para los atributos
    que la línea realmente trae**. Incluye la que le importa a esta audiencia:
    `X-RESUME-OFFSET` no significa nada en un Date Range de clase concurrente, porque
    no hay nada interrumpido que reanudar, y está anotado como pregunta abierta para
    SVTA (ADR 0016).
  - **El `<pre>` del tag no cambia**, cortado en las comas como hoy.
  - **El ancho, que es donde esto se rompe.** `#list` tiene hoy `max-height: 26vh` y
    `overflow: auto`; con los pliegues cerrados el bloque es corto y el tope se puede
    subir. Lo que no puede pasar es que el JSON crudo empuje el ancho del documento:
    ya pasó en esta página con los `<pre>`, a 500 px de viewport el documento
    scrolleaba a 539.
  - **Un chequeo nuevo**: el rótulo de cada pliegue nombra un aviso que existe en el
    asset-list, con la misma forma de función pura que `test/comprobaciones.js` ya
    usa, y su control en `test/mutaciones.mjs`.
  - **Entry points:** `js/app.js`, la función `showSignalling()` entera con su
    comentario, que explica por qué la sección es como es; `css/page.css`, las reglas
    `.code` y `#list`; `test/comprobaciones.js`. El ADR 0075 y el ADR 0016.
  - **Constraints:** no se toca `lib/`. No se pierde la lectura en vivo: un tag pegado
    en el HTML es lo único que esta sección no puede ser. El único cambio en
    `js/app.js` además de sacar la función es la línea de import. Depende de T-01, y
    corre después de T-02 porque las dos tocan `js/app.js`.

- **Definition of done:** la sección 3 muestra el tag con su glosa y cuatro pliegues
  cerrados; abriendo uno se ve el JSON crudo completo de ese asset; durante el break
  el aviso en pantalla está marcado y la marca cambia sola de uno al siguiente.
  `npm test` verde con el chequeo nuevo, `npm run mutaciones` mostrándolo fallar.
  Capturas a 400×780 con un pliegue abierto, y el documento no scrollea de costado.

- **nivel de verificación:** **bajo**. Es interfaz. Los tests nuevos cubren la parte
  no visual —que los rótulos se correspondan con los avisos del asset-list— y el
  render se mira. La captura con el pliegue **abierto** no es opcional: es el estado
  donde el riesgo R2 aparece, y una captura del estado cerrado no lo mostraría.

## T-04 — La figura de la convivencia

- **Objective:** la sección 2 muestra dibujado lo que dice en palabras: una sola
  playlist, dos clientes, y cada uno quedándose con el tag que entiende. Importa
  porque es el punto más importante de la sección y en prosa sola tiene el mismo peso
  visual que el resto.

- **What it must cover:**
  - **Dos columnas y una playlist arriba.** A la izquierda *a client in the market
    today*, a la derecha *the same client, with the library on top*. Markup y CSS, sin
    imágenes y sin librerías.
  - **El encuadre del ADR 0076**, que es lo que la figura tiene que hacer sentir: no
    es que una columna esté bien y la otra mal; es que las dos se sirven juntas.
  - **Lo que la figura afirma tiene que ser verdad y es verificable**: las dos clases
    son `com.apple.hls.interstitial` y `com.qualabs.hls.concurrentInterstitial`, y lo
    que cada cliente hace con la que no entiende está en el ADR 0007 y en el ADR 0009.
  - **Sin link a `compatibility-pair`.** `run.sh` sirve una demo por vez (ADR 0022),
    así que ese link estaría roto en escenario. La otra demo se menciona en prosa y
    sin enlazar.
  - **Entry points:** el ADR 0076, el ADR 0009, el ADR 0007 y el README de
    `demo/compatibility-pair/`, sección *The compatibility pair*.
  - **Constraints:** no se toca `lib/` ni la otra demo. Toca `index.html`, así que
    corre cuando la T-01 está terminada y no a la vez. Es la task removible de la
    fase: si al final se graba sólo el player, se saca sin tocar nada más. Depende de
    T-01.

- **Definition of done:** la figura se ve en la sección 2 a 1907 y a 400 px de ancho,
  en las dos apilada de forma legible, y ninguna de sus etiquetas afirma algo que no
  esté en los tres ADR que la fundan.

- **nivel de verificación:** **bajo**. Es interfaz, sin lógica, y el error está en la
  captura. Sin tests nuevos.

## T-05 — La no-regresión: que la demo que se graba siga en pie

- **Objective:** después de cuatro tasks sobre la página que se graba, lo que ya
  funcionaba sigue funcionando, y eso está medido contra la línea de base que tomó la
  T-01 en lugar de afirmado. Importa porque esta demo es la que se muestra el 7 de
  octubre y porque las cuatro tasks anteriores tocaron el archivo del que cuelga todo.

- **What it must cover:**
  - **Las tres corridas, comparadas contra la línea de base de la T-01**: `npm test`,
    `npm run check` y `npm run mutaciones`. Un número distinto de pruebas no es un
    hallazgo por sí solo —esta fase agrega chequeos—, pero cada diferencia tiene que
    quedar explicada.
  - **El recorrido guiado, mirado.** La apertura, el arranque por viewport al 60 %,
    las seis placas, el botón que cambia de rótulo al terminar, y el reinicio. Es lo
    que la T-01 puede haber roto sin que ningún test lo note: el guion se ancla a la
    señalización y no al HTML, pero el botón y la placa viven en `index.html`.
  - **Los dos anchos**, 400×780 y 1907, la página entera de arriba a abajo.
  - **Que la sección 3 sigue leyendo en vivo**, comprobado de la única forma que lo
    prueba: mirando que el `START-DATE` del tag en pantalla coincida con el de
    `content/primary/con-daterange.m3u8` recién escrito, que cambia en cada
    empaquetado.
  - **Entry points:** `PHASE.md`, sección *La verificación de la fase*; el README de
    la demo, sección *What you will see*; `test/signalled-run.test.js`.
  - **Constraints:** esta task no arregla lo que encuentra: reporta. Un arreglo dentro
    de la task de verificación es un arreglo que nadie revisó. Depende de T-01, T-02,
    T-03 y T-04.

- **Definition of done:** las tres corridas en verde con cada diferencia contra la
  línea de base explicada, el recorrido guiado completo mirado de punta a punta, y las
  capturas de los dos anchos guardadas como evidencia. Si algo quedó roto, está
  reportado con su evidencia en lugar de arreglado.

- **nivel de verificación:** **alto**. Es la task que existe para atajar el error de
  las otras cuatro, y el error que busca es el que ninguna pantalla reporta: una demo
  que se graba una vez y se presenta en un escenario. Su campaña de mutación es la que
  el proyecto ya tiene, `npm run mutaciones`, y su fuente independiente es la línea de
  base medida antes de que la fase empezara.

## T-06 — La afirmación falsa afuera, y lo que puede ir en una caja adentro

- **Objective:** la sección 1 deja de afirmar lo que este minuto contradice en pantalla,
  y pasa a decir qué se puede poner adentro de una caja. Importa porque las dos mitades
  son la misma regla: la página no afirma lo que no leyó, y lo que puede leer no lo
  escribe a mano.

- **What it must cover:**
  - **`0 seconds of programme replaced` sale.** Es cierto sobre la línea de tiempo
    (ADR 0016) y al revés sobre la pantalla, porque el tercer aviso es lineal y tapa el
    partido. Lo que va en su lugar sale del contrato o no va nada.
  - **Qué tipo de asset acepta un layout, establecido leyendo `lib/` y no de memoria.**
    Si algo que Nicolás nombró no está soportado, va al informe y no a la página; si hay
    algo soportado que no nombró, va también.
  - **Los MIME que la página muestra se leen del contrato**, y una guarda nueva lo fija
    con su control en la campaña de mutación, como la del ADR 0073.
  - **La lista de archivos de esa guarda alcanza lo que se escriba.**
  - **Entry points:** `lib/media.js` entero; `lib/renderer.js`, `createNode` e
    `isImage`; los ADR 0056, 0046 y 0013; `test/comprobaciones.js` como molde.
  - **Constraints:** no se toca `lib/`, ni `story/story.json`, ni las otras dos demos.

- **Definition of done:** la sección 1 muestra las formas de asset que la librería
  acepta de verdad, rotuladas con los MIME de esta corrida, y el número falso no está.
  `npm test` y `npm run mutaciones` en verde con el chequeo nuevo y su rotura adentro.
  Capturas a 400×780 y a 1907.

- **nivel de verificación:** **bajo**. Es interfaz. Lo que lleva test es lo no visual:
  la guarda de los medios.

## T-07 — El payload explicado: la glosa del bloque, campo por campo

- **Objective:** `The signalling, as it is served` explica qué se espera adentro de un
  `X-AD-CREATIVE-SIGNALING`: los campos obligatorios, los opcionales que importan con su
  default, y cómo se arman `primaryContent` y `assets`. Importa porque la sección muestra
  el JSON crudo desde la T-03 y el público que lo va a leer nunca vio esta extensión.

- **What it must cover:**
  - **Una fila por campo que este asset-list realmente trae**, dibujada del archivo como
    la glosa del tag se dibuja del tag, y agrupada por la profundidad donde vive.
  - **Lo que cada fila afirma sale de `lib/signalling.js`**: qué se rechaza, qué se
    asume, y cuál es la asunción.
  - **Un campo sin frase escrita lo dice en pantalla**, como ya hace un atributo
    desconocido del tag, y un chequeo nuevo exige que no haya ninguno.
  - **El ancho no se rompe con un pliegue abierto.**
  - **Entry points:** `lib/signalling.js`, `usablePayload`, `resolveElement`,
    `resolveExperience` y `resolveAssetList`; los ADR 0004, 0014 y 0019.
  - **Constraints:** no se toca `lib/`. Depende de la T-03, que es de quien es el módulo.

- **Definition of done:** la sección muestra la glosa del bloque arriba de los pliegues,
  con los dieciocho campos de este archivo explicados. `npm test` verde con el chequeo
  nuevo y `npm run mutaciones` mostrándolo fallar en las dos direcciones. Capturas a
  400×780 y a 1907, con un pliegue abierto.

- **nivel de verificación:** **bajo**. Es interfaz, y lo no visual —la correspondencia
  entre la glosa y el archivo— es lo que lleva chequeo.

## T-08 — La marca, centrada y en blanco, y la misma cerrando los créditos

- **Objective:** el logo de arriba queda centrado, sin plancha, con el logotipo en
  blanco y un poco más grande, y la misma marca cierra el pie. Importa porque es la
  segunda vez que Nicolás pide sacar el fondo blanco, así que deja de ser una
  preferencia y pasa a ser una regla de la página.

- **What it must cover:**
  - **El logo de Qualabs nunca va sobre una plancha blanca.** Si no se ve sobre el
    fondo, lo que cambia es el logo.
  - **`brand/logo-qualabs.svg` no se edita**: es copia del kit de marca con su
    procedencia escrita. La variante va al lado, con su propio comentario diciendo qué
    se le cambió y por qué.
  - **El logotipo en blanco y el isotipo con sus tintas**, que es lo que se pidió
    conservar si se podía.
  - **Un pie con la misma marca, y un solo pie**: los créditos ya son el pie (ADR 0077).
  - **Entry points:** `brand/README.md`, `brand/logo-qualabs.svg`, el bloque del
    masthead en `css/page.css`.
  - **Constraints:** el `alt` sigue siendo `Qualabs`. No se toca el kit de marca.

- **Definition of done:** el logo se ve en blanco, centrado y sin superficie clara
  debajo, en los dos anchos, arriba y en el pie, comprobado en captura y no en estilo
  computado.

- **nivel de verificación:** **bajo**, y el error está en la pantalla — que es
  literalmente donde estuvo: la primera versión del SVG no se dibujaba.
