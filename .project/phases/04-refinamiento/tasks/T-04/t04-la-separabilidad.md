# La separabilidad: el cromo sin la parte de concurrentes

2026-09-07. La task decide tres cosas y no toca una línea de código. Lo que
sigue es lo que la T-06 y la T-07 construyen, y está escrito para que se pueda
leer sin abrir un archivo.

Las tres decisiones, en una línea cada una:

| | decisión | razón, en corto |
| --- | --- | --- |
| 1 | la entrada pública es una **segunda función**, `attachControls(video, { container, provider, logo })` | el cromo no necesita una instancia de hls.js, y una opción de `attach` tendría que apagar cuatro de las cinco cosas que `attach` hace |
| 2 | las marcas de la barra de ese pane salen de **su propio player**, `hls.interstitialsManager`, leído desde la demo | una barra tiene que poder equivocarse cuando el pane se equivoca, y lo que ese player agendó sólo lo sabe ese player |
| 3 | las tres lecturas **no entran** en `scripts/verificar-cortes.mjs`: quedan escritas acá, en la sección 4, y las corre la T-07 | las dos costuras de ese script son greps que tienen que volver vacíos sobre el texto de un archivo, y dos de las tres lecturas no existen en ningún archivo |

---

## 1. Lo que ya estaba hecho, verificado

El bloque de la task dice que la separación en el código está casi hecha y que
lo que falta no es desacoplar sino publicar. Es cierto, y estos son los tres
hechos que lo sostienen:

- `createControls({ container, video, provider = null, logo = null })`
  (`lib/controls.js:502`). Con `provider` en `null` la única función que lo usa
  —`paintRanges`— sale en la primera línea (`lib/controls.js:609`), y no hay
  ningún otro uso: son dos en todo el archivo.
- `lib/controls.js` **no tiene una sola línea `import`**. Cero. No depende de la
  señalización, del renderizado ni de hls.js, y lee del elemento cuatro
  propiedades —`currentTime`, `duration`, `paused`, `muted`— que escribe de
  vuelta.
- Y no se puede llamar de afuera: `scripts/construir-libreria.sh:53` cuelga del
  global un solo objeto, `QualabsConcurrentHls = { VERSION, CONCURRENT_CLASS,
  hlsConfig, attach }`. `createControls` existe adentro del IIFE y es
  inalcanzable. Publicar es agregarla a ese objeto.

---

## 2. Decisión 1 — la forma de la entrada pública

```js
QualabsConcurrentHls.attachControls(video, {
  container,        // requerido
  provider = null,  // opcional: cualquier cosa con programRanges()
  logo = null       // opcional
});
// devuelve { container, video, controls }
```

**La razón del cambio de superficie no es la comodidad de esta demo**, y esto es
lo que se escribe al lado de la forma: un integrador puede querer el cromo y no
la parte de concurrentes. El caso concreto es alguien que ya resuelve sus avisos
de otra manera, o que quiere la barra y los botones sobre un player que esta
librería no maneja. Si la razón fuera la demo, la respuesta correcta habría sido
una copia de los controles del lado de la página y ningún cambio de superficie.

### Por qué una segunda función y no una opción de `attach`

1. **`attach` pide una instancia de hls.js y el cromo no necesita ninguna.** Una
   opción obligaría a entregarle nuestra librería el player de ese pane para no
   usarlo: los controles leen cuatro propiedades del elemento y no tocan ningún
   transporte. La forma de la firma es la que dice la verdad sobre el
   acoplamiento, y `attachControls(video, …)` no recibe instancia.
2. **`attach` hace cinco cosas y la opción apagaría cuatro.** Diagnostica la
   configuración, crea la capa de avisos, crea la señalización, crea el
   renderizado y crea los controles (`lib/concurrent-hls.js:135-162`). Una
   opción que apaga cuatro quintos de una función es una segunda función con el
   nombre de la primera.
3. **El diagnóstico no es neutro, y es el argumento que cierra la discusión.**
   `checkConfig` escribe en `console.error` cuando la instancia trae la máquina
   de interstitials prendida (`lib/concurrent-hls.js:60-70`). La instancia de
   ese pane la trae prendida **a propósito**: es lo que hace un cliente de
   mercado. Con una opción, la librería tendría que apagar su propia alarma
   según un flag, y una alarma con interruptor es la que el próximo apaga por el
   motivo equivocado.
4. **Es aditivo.** `attach` conserva su firma, su comportamiento y su handle. No
   se renombra y no se reimplementa: lo que un integrador escribió ayer sigue
   valiendo.

### Qué hace `attachControls`, y qué no hace

Hace dos cosas: llama a `createControls` con lo que recibió, y deja el
contenedor como contexto de posicionamiento si computa `static`. Lo segundo hoy
lo hace `createLayer` (`lib/concurrent-hls.js:93`) y es un requisito de los
controles y no de la capa de avisos: `.qa-controls` es `position: absolute;
inset: 0` (`lib/controls.js:171-173`). En esta demo los dos `.player` ya son
`position: relative` (`css/player.css:117`), pero la librería no puede apoyarse
en el CSS del integrador.

No hace nada más, y eso es la mayor parte del punto:

- **no lee la configuración de la instancia** ni escribe diagnóstico, porque no
  recibe instancia;
- **no crea señalización**: no se suscribe a `LEVEL_UPDATED` y no pide un
  asset-list. Es lo que hace que la lectura 2 de la sección 4 sea cierta por
  construcción y no por revisión;
- **no crea renderizado ni capa de avisos**, así que no le aplica ningún
  `transform` al elemento y no le borra el atributo `style`.

---

## 3. Decisión 2 — de dónde salen las marcas de la barra de ese pane

**De su propio player.** `hls.interstitialsManager`, que `js/stock-player.js` ya
lee para la línea de estado y para su getter `scheduled` (`js/stock-player.js:43`
y `:93-96`). El pane implementa el `programRanges()` del contrato de ADR 0003
desde su propio manager y se lo pasa a `attachControls` como `provider`.

**La razón, al lado:** la regla del ADR 0018 es que una barra marca lo que **ese
player reproduce**, y lo que ese player agendó sólo lo sabe ese player. Nuestra
capa de señalización sabe lo que la **playlist señaliza**, que es otro hecho, y
los dos se separan justo donde importa: si ese player dejara de agendar un break
—un error, otra versión de hls.js, una clase que dejó de reconocer—, una barra
alimentada por nuestro proveedor seguiría pintando cinco marcas y estaría
mintiendo sobre el pane. La barra es el instrumento sobre el que se apoya la
comparación cuadro a cuadro, así que tiene que poder equivocarse cuando el pane
se equivoca.

Y le cuesta cero al pane: leer su propio manager es lo que ese archivo ya hace,
y leer no modifica la instancia, que sigue siendo `new Hls()`.

**La alternativa y por qué no.** Alimentarlo con un proveedor nuestro filtrado
por `kind` mete nuestra capa de señalización adentro de un pane que existe para
no tenerla, y con eso la lectura 2 deja de ser cierta por construcción y pasa a
ser un argumento que hay que rehacer en cada cambio. El ADR 0018 ya la había
nombrado en su última consecuencia.

**Lo que esto le cuesta a la librería: nada, y esa es la parte que conviene
decir.** `lib/controls.js` consume el **contrato** de ADR 0003 y no nuestra
implementación de él. Que el contrato tenga una segunda implementación, del lado
de la demo y alimentada por otro player, es exactamente la consecuencia que el
ADR 0003 escribió en la fase 01 —"la señalización puede tener otras
implementaciones sin tocar el renderizado"— ejercida por primera vez.

### Qué está medido y qué le queda por leer a la T-07

- **Medido**, en la T-02 de la fase 01 (`.project/phases/01-poc-web-hlsjs/tasks/T-02/m2-log.json`):
  `interstitialsManager.events[]` trae `identifier`, `dateRange.class` y
  `assetListUrl`. Nada en este repositorio leyó todavía una posición agendada de
  un evento.
- Así que **la posición y el largo de cada marca son una lectura de la T-07**, y
  tiene dos candidatos: el campo que el evento traiga, si hls.js 1.7.2 expone
  uno, o la misma cuenta que hace la señalización —el `START-DATE` del tag
  contra el `EXT-X-PROGRAM-DATE-TIME` de la playlist—, hecha del lado de la
  demo. Lo que no puede hacer es importar `lib/signalling.js`: el punto es que
  ese pane no dependa de nada nuestro que no sean píxeles.
- La forma que consume la barra es `{ ranges: [{ id, kind, startTime, duration }] }`
  y `settled` no se lee (`lib/controls.js:610`), así que el adaptador es esa
  forma con `kind: 'interstitial'`, que es donde aterriza el amarillo que el
  ADR 0018 muda a ese pane.

### Lo que esta task NO decide

**Qué muestra esa barra durante el interstitial** —el reloj y el largo— es la
decisión de la T-07 y su bloque la tiene escrita. Con reemplazo, hls.js le pasa
el MediaSource al asset, así que `currentTime` y `duration` de ese elemento
durante el aviso pueden ser los del aviso (R3 de la fase). Esta decisión no la
condiciona: las marcas son posiciones sobre la línea de tiempo del programa y el
reloj es otra lectura.

---

## 4. Decisión 3 — las tres lecturas, y dónde viven

Las tres verifican el invariante del ADR 0007: que ese pane sigue siendo un
cliente sin modificar. El invariante ya está escrito en la nota del 2026-09-07
de ese ADR, que enumera las tres. Lo que se agrega acá es **cómo se leen**: el
instrumento, el valor esperado y qué forma tiene una falla.

### Lectura 1 — la instancia se construye con cero opciones

- **Instrumento:** la línea `const hls = new Hls();` de `js/stock-player.js:35`,
  y en la página corriendo el HUD de ese pane, que ya imprime
  `interstitials manager: PRESENT` (`js/stock-player.js:56-59`).
- **Esperado:** la línea sin un solo argumento, y el HUD diciendo `PRESENT`.
- **Falla:** cualquier argumento en esa línea; o el HUD diciendo `none`, que
  sería una instancia configurada como la nuestra.

### Lectura 2 — su red nunca pide un asset-list concurrente

En una sola página hay **una sola pestaña de red**, así que la lectura tiene que
atribuir el pedido y no alcanza con listarlo. Se lee por dos lados:

- **Por instancia:** `hls.interstitialsManager.events.map(e => e.assetListUrl)`
  del pane de fábrica. Ahí está todo lo que esa instancia puede llegar a pedir.
  **Esperado:** los cinco eventos declaran `/signalling/asset-list-linear.json`
  y nada más.
- **Por la página:** `performance.getEntriesByType('resource')`. **Esperado:**
  los cinco asset-list concurrentes —`cornerOverlay`, `squeezebackLShape`,
  `squeezebackLShape-image`, `squeezebackDoubleBox`, `multiView`— aparecen una
  vez cada uno y **pelados**, mientras el lineal aparece con
  `?_HLS_primary_id=<uuid>`. Ese query es la huella de un controlador de
  interstitials de hls.js y está medida en la T-02 de la fase 01
  (`asset-list-linear.json?_HLS_primary_id=…` contra `asset-list-concurrent.json`
  sin query). Nuestro lado nunca la pone: la señalización usa `fetch` sobre la
  URL del tag (`lib/signalling.js`) y las instancias por asset se construyen con
  `interstitialsController: undefined` (`lib/media.js:34`), así que no piden
  asset-lists.
- **Falla:** un asset-list concurrente con `_HLS_primary_id`, o dos veces, o un
  evento de esa instancia declarando uno.

### Lectura 3 — sigue agendando el Date Range de clase Apple

- **Instrumento:** la línea `[stock] scheduled N: …` que
  `INTERSTITIALS_UPDATED` ya loguea (`js/stock-player.js:63-67`), y el getter
  `scheduled`, alcanzable en la consola como `window.demo.stock.scheduled`.
- **Esperado:** cinco eventos, los cinco de clase `com.apple.hls.interstitial`,
  y ninguno de la concurrente.
- **Falla:** menos de cinco, o uno de la clase concurrente, que querría decir
  que el pane empezó a entender lo que no tiene que entender.

### Por qué NO entran en `scripts/verificar-cortes.mjs`

1. **La forma no coincide.** Las dos costuras de ese script son greps que tienen
   que volver **vacíos** sobre el texto de un archivo, con exit 1 si encuentran
   algo. Estas tres son afirmaciones **positivas** sobre un navegador corriendo:
   la lectura 1 tiene una mitad en un archivo, y las lecturas 2 y 3 no existen en
   ningún archivo.
2. **La versión que un grep sí podría hacer es peor que nada.** Buscar
   `new Hls()` en `js/stock-player.js` cubre un tercio de una de las tres
   lecturas y pintaría verde bajo un script cuya última línea es
   `verificar-cortes: both seams hold`. Un verde que quiere decir "un tercio
   chequeado" es justo la confusión que el R1 de la fase existe para evitar: un
   pane que **parezca** sin modificar y no lo esté se ve exactamente igual de
   bien.
3. **Hacerlo de verdad adentro es meter un navegador en ese script**, o sea el
   aparato nuevo que la fase prohíbe, en un archivo que hoy son dos greps y
   corre en milisegundos.
4. Y hay un desajuste de listas: `js/stock-player.js` no está en la lista de
   ninguna de las dos costuras, a propósito. Es el lado de la demo y tiene
   permitido nombrar el transporte.

**Dónde quedan entonces:** acá, en esta sección, con instrumento, valor esperado
y forma de la falla para cada una. La T-07 no tiene que reinventarlas y no tiene
que buscarlas: su propio bloque nombra este documento como punto de partida —"la
decisión de la T-04"— y su definición de done pide "las tres lecturas escritas".

---

## 5. Qué le queda a las tasks que construyen

**T-07**, además de lo que su bloque ya dice:

- `attachControls` en `lib/concurrent-hls.js` **y agregada al objeto que el
  build cuelga del global** (`scripts/construir-libreria.sh:53`). Una función
  exportada que no está en ese objeto queda inalcanzable, que es exactamente el
  estado en el que `createControls` está hoy.
- El adaptador del contrato en `js/stock-player.js`, alimentado por el manager de
  ese pane y sin importar nada de `lib/`.
- Dos afirmaciones vivas que dejan de ser ciertas el día que eso entra, y
  ninguna lo es antes: `README.md:126`, que dice que la superficie pública de
  `lib/concurrent-hls.js` es "`attach`, y la configuración"; y la sección 9 del
  documento del integrador, que dice que esta demo es la página mínima con una
  opción agregada, `onResolved` —va a tener una segunda llamada—.

**T-06:** la sección 2.2 del documento del integrador dice hoy
"with the breaks marked on two lanes". El día que se va el carril de abajo deja
de ser cierta.

---

## 6. Qué cambió en el documento del integrador

Tres lugares, y ninguno toca la sección 7:

| lugar | qué |
| --- | --- |
| introducción | una oración: el cromo también se puede usar solo, sobre un player al que la librería no le hace nada más, y eso es una segunda llamada |
| sección 2 | un párrafo que acota las dos exigencias: la 2.1 es del experimento concurrente y no le aplica a `attachControls`, que no recibe instancia; la 2.2 le aplica a las dos por una de sus dos razones —dos juegos de controles sobre el mismo elemento—, y la otra, el `transform` que escala los nativos, es sólo de `attach` |
| sección 6 | la fila de `attachControls` en la tabla del global, y su subsección con la tabla de opciones y el handle que devuelve |

**Y hay una consecuencia de que esta task no toque código: entre la T-04 y la
T-07 el documento describe una función que la librería construida todavía no
exporta.** Es lo que el bloque pide —decide una y construye la otra— y está
acotado: el documento no se publica en ningún lado, `dist/` se arma en cada
arranque desde `lib/`, y la fase cierra antes de la grabación. Queda dicho acá
porque el registro tiene que decirlo, y no adentro del documento, que es
entregable y no track de cambios.

---

## 7. Por qué no sale un ADR

**No sale, y las tres decisiones ya tienen dónde estar escritas:**

- Que el cromo se pueda usar sin la parte de concurrentes, y que eso cueste una
  entrada pública más, es la **nota del 2026-09-07 del ADR 0015**, que ya está
  puesta y que además delega la forma al documento del integrador —"escrita en
  `docs/integrating-the-library.md`"—, que es donde el mismo ADR dice que vive la
  superficie.
- Que una barra marque lo que ese player reproduce es el **ADR 0018**, cuya
  última consecuencia delega de dónde sale a la task que lo construye y ya deja
  el argumento contrario escrito.
- Qué cubre "sin modificar" y cuáles son las tres lecturas es la **nota del
  2026-09-07 del ADR 0007**.

Un ADR nuevo sería las tres cosas repetidas con un cuarto número. Lo que esta
task produce es la **forma** de una función y un **procedimiento** de lectura, y
ninguna de las dos es una decisión de alcance `project`: la forma va al documento
del integrador y el procedimiento va acá.

**Y hay una cosa que sí sería un ADR, el día que exista.** Detrás de la decisión
1 hay un principio posible: una capacidad nueva se publica como función y una
perilla se publica como opción de `attach`. Si eso es lo que va a gobernar el
`decoderCount` y el repliegue de la fase 03 —que el ADR 0015 llama por nombre
"configuración y comportamiento del SDK"—, entonces es una regla de proyecto y se
merece su número. Hoy hay **un** caso, y una regla escrita sobre un caso solo es
ese caso con otra forma. Se propone cuando la fase 03 traiga el segundo.

---

## 8. Lo que no coincide con el bloque

Cuatro cosas, con la evidencia al lado.

1. **La nota fechada del ADR 0015 ya estaba puesta antes de esta task.** El
   bloque la pide como entregable; `git log` dice que entró con el commit de
   planificación de la fase, `1716f6f plan(fase-04)`, y no con la T-04. La nota
   dice exactamente lo que la task tenía que dejar dicho —los controles funcionan
   con o sin experiencias concurrentes, y la fase agrega una entrada pública
   más—, así que no se reescribió ni se le agregó nada: agregarle el nombre de la
   función duplicaría en el ADR lo que el documento del integrador ya dice, y un
   nombre en dos lugares se desincroniza.
2. **"`lib/controls.js` no nombra ni a la señalización ni al renderizado" es
   falso como está escrito.** Nombra a los dos en prosa: "renderer" cinco veces
   y "signalling" dos, en los comentarios que explican por qué la barra no puede
   cambiar la caja que el renderizado mide y cómo crece la lista de rangos. Lo
   que es cierto es más fuerte y es lo que la decisión usa: **el archivo no
   tiene una sola línea `import`**, así que no hay dependencia de código con
   ninguna de las dos capas.
3. **"Su pestaña de red nunca pide un asset-list concurrente" no es una lectura
   que una sola página permita hacer tal cual.** Los dos players comparten la
   línea de tiempo de recursos del navegador, así que hay una sola pestaña de red
   y el pedido hay que atribuirlo. La sección 4 lo resuelve con dos lecturas —lo
   que esa instancia declara en sus propios eventos, y la huella
   `_HLS_primary_id` que hls.js le pone a lo que pide su controlador de
   interstitials—, las dos con evidencia medida en la fase 01. Es la misma
   afirmación, verificable.
4. **La T-02 de la fase 01 no midió ninguna posición agendada.** El bloque de la
   T-04 dice que el manager es la fuente y eso es correcto, pero de los campos de
   un evento sólo están medidos `identifier`, `dateRange.class` y `assetListUrl`.
   La posición y el largo de las marcas quedan como lectura de la T-07, dicho en
   la sección 3 en lugar de supuesto acá.
