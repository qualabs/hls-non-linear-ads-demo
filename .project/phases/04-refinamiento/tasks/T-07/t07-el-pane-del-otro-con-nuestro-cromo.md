# El pane del otro con nuestro cromo, y su propio riel

2026-09-07. Los dos panes tienen la misma barra, los mismos cuatro botones y el
mismo reloj, y el de la izquierda sigue siendo `new Hls()` sin una sola opción.
La entrada pública que decidió la T-04 existe y está publicada; el riel de ese
pane marca sus cinco interstitials en amarillo, leídos de su propia agenda; y
las tres lecturas del ADR 0007 se corrieron sobre la página andando.

Lo que costó decidir fue **qué reloj muestra esa barra**, y la respuesta no salió
de una lectura de la especificación sino de una medición que dejó el otro camino
sin defensa: alimentada con el elemento, esa barra en dos de los cinco breaks
muestra **0:02 de 0:12** y **pierde las cinco marcas**. Está en la sección 3.

---

## 1. El instrumento

| | |
| --- | --- |
| superficie | 1600 × 1000 css px, `dpr 1`, así que las capturas son a tamaño real. La imagen de cada pane queda en 715 × 402,19 px |
| camino | el Chrome real por CDP en el 9333 contra el servidor del 8080, el mismo de la T-01, la T-03 y la T-06 |
| lo que juzga | los dos panes leídos **en el mismo instante**, y de cada barra lo que **muestra** —el texto del reloj, el `left` de la perilla, la caja de cada marca— y no la propiedad de la que podría salir. Más la imagen: en este repositorio ya hubo dos falsos "OK" por medir estilos computados |
| scripts | `t07run.py` (los dos panes, y con `controles` como segundo argumento los cuatro controles) y `t07seek.py` (el seek adentro del break, en las dos estrategias) |

Un pane se maneja seteando `interstitialsManager.primary.currentTime`, que es la
línea de tiempo del programa, y **la corrida comprueba dónde aterrizaron los
dos**. Sin esa comprobación la primera corrida capturó un pane adentro del break
1 y el otro adentro del break 2, que es exactamente el cuadro que esta fase
existe para que no pase.

## 2. Qué se construyó, archivo por archivo

| archivo | qué |
| --- | --- |
| `lib/concurrent-hls.js` | `attachControls(video, { container, provider, logo })`, la entrada pública de la T-04, **y agregada al objeto que el build cuelga del global** —sin eso queda inalcanzable, que es donde estaba `createControls`—. `ensurePositioned` sale de `createLayer`: las dos entradas necesitan el contenedor como contexto de posicionamiento y por la misma razón |
| `js/stock-player.js` | la fachada del programa y la implementación del contrato de ADR 0003 para ese pane, las dos leídas de su propio `interstitialsManager`. Y la línea de estado corregida: el reloj del aviso sale de `interstitialPlayer` |
| `index.html` | un `id` en el contenedor de ese pane, y el comentario que decía que los controles son del player de la derecha |
| `css/player.css` | `--qa-accent` pasa de `.pane-demo .player` a `.pane .player`: una regla, y cada pane toma su propio color de identidad |
| `js/app.js` | el contenedor que va a `createStockPlayer`, y `oneAudioAtATime`: los dos botones de audio funcionan y los dos panes no pueden sonar a la vez |
| `lib/controls.js` | una línea de JSDoc: qué es el primer argumento. Sección 3 |
| `README.md`, `docs/integrating-the-library.md` | las afirmaciones vivas. Sección 7 |

`attachControls` **no hace nada más** que `createControls` más el contexto de
posicionamiento, y eso es la mayor parte del punto: no lee la configuración de
ninguna instancia porque no recibe ninguna, no crea señalización ni capa de
avisos, no le aplica ningún `transform` al elemento, y no le pide nada a la red.
La lectura 2 de la sección 5 es cierta por construcción y no por revisión.

## 3. La decisión: qué muestra esa barra durante un interstitial

**La barra de ese pane es la barra del PROGRAMA. Su reloj, su largo y sus marcas
salen los tres de `hls.interstitialsManager.primary` y de `manager.events`, que
es el mismo objeto que ese archivo ya leía, y ninguno de los tres sale del
elemento. El reloj del aviso no se pierde y no es asunto de esa barra: es la
línea de texto abajo de la imagen, donde `interstitialPlayer` lo reporta igual
en los cinco breaks.**

### 3.1 Lo que reporta cada fuente, medido en las dos estrategias

hls.js elige break por break cómo resuelve el retorno, y lo que el elemento
reporta depende de esa elección. Los dos breaks corridos, con el aviso en
pantalla:

| | break 1 (`appendInPlace`) | break 2 (el MediaSource al asset) |
| --- | --- | --- |
| tramo del programa que ocupa | 20,021 → 32,059 | 45,021 → 57,059 |
| `video.currentTime` | 22,292 · **el programa** | 2,144 · **el aviso** |
| `video.duration` | 180,021 · el programa | 12,032 · **el aviso** |
| `primary.currentTime` | 22,292 · el programa | 45,021 · el programa, quieto en el segundo en que el break empezó |
| `primary.duration` | 180,021 | 180,021 |
| `interstitialPlayer.currentTime` / `.duration` | 2,292 / 12,037 · el aviso | 2,144 / 12,037 · el aviso |
| **lo que la barra muestra** | **0:22 / 3:00**, perilla 12,3831 % | **0:45 / 3:00**, perilla 25,0089 % |
| **lo que mostraría leyendo el elemento** | 0:22 / 3:00, perilla 12,3831 % | **0:02 / 0:12**, perilla 17,8228 %, **0 de las 5 marcas dibujables** |

La última fila es la contrafactual, calculada en la página con la aritmética de
`rangeSpan` y `formatClock`, y es la que cierra la discusión. Con `duration`
igual a 12,032 el largo del programa **es** el del aviso, así que los cinco
rangos —que arrancan en 20, 45, 70, 95 y 120— caen todos más allá del final:
`rangeSpan` devuelve `null` para los cinco y no se dibuja ninguno. La barra no
quedaría "corrida un poco": en dos de los cinco breaks se quedaría sin las cinco
marcas y con el riel entero reescalado a doce segundos.

### 3.2 Por qué el programa, en una frase por razón

1. **Lo que una barra significa lo fija su riel.** Ese riel es el programa
   entero, 180 s, con los breaks marcados encima como posiciones del programa. Un
   reloj de otra línea de tiempo sobre ese riel no es un error de precisión: son
   dos unidades en un mismo eje.
2. **Leer el elemento acierta en tres de cinco, y cuál de los cinco depende de
   un detalle que nadie puede explicar en cámara**: si el punto de retorno cae en
   un borde de la grilla de 2 s. Sobre esta grilla —los cortes están en los pares
   más el ancla de 0,021 s— caen 32, 82 y 132 y no caen 57 y 107, y por eso son
   tres y dos. Cambiar el contenido cambia el reparto.
3. **La barra es el instrumento sobre el que se apoya la comparación cuadro a
   cuadro**, y esa comparación necesita un solo eje en los dos panes.
4. **Le cuesta cero al pane.** Leer su propio manager es lo que ese archivo ya
   hacía para la línea de estado y para su getter `scheduled`, y leer no modifica
   la instancia, que sigue siendo `new Hls()` (sección 5).

### 3.3 Y lo que muestra es cierto en los cinco, no en tres

La afirmación que la barra hace es *dónde está el playhead del programa de este
cliente*, y durante un break la respuesta es **adentro de los doce segundos que
ese break le saca al programa** —o sea adentro de la marca amarilla que la barra
dibuja ahí—. Eso vale en las dos estrategias, y las dos maneras de estar adentro
son las dos ciertas:

- donde hls.js appendea el aviso en el lugar, el playhead **camina** esos doce
  segundos: 0:22 adentro del tramo 20,02–32,06;
- donde le pasa el MediaSource al asset, **se queda** en el segundo en que el
  break empezó: 0:45, con la perilla exactamente en el borde izquierdo de la
  segunda marca (25,0089 %, que es el mismo `left` que la marca).

Ninguna de las dos dice que el programa se esté viendo. Dice dónde quedó, y lo
que ocupa ese tramo lo dice la marca. **Eso es lo que reemplazar significa**, y
es el argumento que el ADR 0017 dejó en pie: al mismo segundo del programa, uno
muestra el aviso encima y el otro en lugar del programa.

Consecuencia que conviene tener escrita porque se ve en la captura del break 2:
adentro de un break de esa clase los dos relojes se separan hasta 2,3 s, porque
el del pane de fábrica se queda quieto mientras el del otro sigue caminando por
el programa. Afuera del break vuelven a coincidir —0,011 s medido— y en el break
appendeado coinciden todo el tiempo: 0,000 s. No es una desincronización: es que
en ese pane el programa **no avanza** durante el aviso, que es la definición del
modo.

### 3.4 Lo que esto le pide a la librería, que es nada

`createControls` lee cuatro propiedades de lo que recibe y las escribe de vuelta,
y eso es todo su contacto. Así que lo que ese pane le pasa es un objeto de
veinte líneas que reporta el programa y le reenvía `play`, `pause` y
`addEventListener` al elemento. La librería no aprendió una opción nueva, no
tiene una tabla de casos y no sabe que existe un cliente de mercado: lo único que
cambió es una línea de JSDoc que dice qué es ese primer argumento, porque la
demo lo ejerce y un documento que dijera "el elemento" sería falso sobre su
propia superficie.

`paused` y `muted` **no** van proxeados: son del elemento y son ciertos
cualquiera sea la fuente que el elemento esté reproduciendo.

### 3.5 La alternativa que no se tomó

Congelar la barra en el arranque del break en los cinco, para que las dos
estrategias se vean iguales. Se descarta porque sería inventar una conducta para
tapar la elección de hls.js, y porque en los tres breaks appendeados el playhead
del programa **sí** camina por el tramo: mostrarlo quieto sería escribir mal a
propósito lo único que esta barra tiene que decir.

## 4. La otra decisión: los cuatro controles, uno por uno

**Los cuatro quedan y los cuatro hacen algo.** El criterio de la fase manda sacar
toda diferencia entre los dos panes que no sea el mecanismo, y un botón que está
y no hace nada es una diferencia que además miente. Lo corrido está en
`t07-la-lectura-controles.json`.

### La pausa — queda, y acciona el elemento

Es el control que la comparación cuadro a cuadro necesita: para comparar dos
panes hay que parar los dos. Medido: `paused` false → true → false sobre el
elemento de ese pane. Adentro de un break pausa lo que ese elemento esté
reproduciendo —el aviso donde el MediaSource se fue al asset, el tramo del
programa donde el aviso está appendeado—, y las dos son lo que un cliente de
mercado hace.

### El audio — queda, acciona, y los dos panes no pueden sonar a la vez

Las dos consideraciones del bloque tiran para lados distintos y la exclusividad
paga las dos: el botón está y funciona, así que no hay una diferencia de
mobiliario; y no hay manera de tener dos panes audibles, que en cámara es lo peor
de los tres estados posibles —dos bandas de sonido de la misma película a una
fracción de segundo—.

Medido, en los dos sentidos: los dos arrancan muteados; se levanta el de fábrica
y queda `{fabrica: audible, demo: muteada}`; se levanta el de la demo y queda
`{fabrica: muteada, demo: audible}`.

**Va en la página y no en la librería, y esa es la parte que importa.** El botón
de la librería sigue haciendo una sola cosa —dar vuelta el `muted` de lo que se
le dio— y quién se queda con el audio de una grabación de dos players es asunto
de la página, que es la que tiene dos. Son cinco líneas en `js/app.js`. El
default no se mueve: los dos arrancan muteados para que la política de autoplay
deje empezar, y el audio de la composición sigue siendo el del pane de la demo.

Una interacción que conviene tener anotada porque no es obvia: el renderizado le
escribe el `volume` declarado al elemento primario en cada break (ADR 0014), y
eso dispara un `volumechange`. El listener chequea `muted` y no `volume`, así que
un break no le saca el audio a nadie: si el pane de la demo está muteado, sale
por donde entró.

### El fullscreen — queda, y es el más barato de los cuatro

No acciona el elemento: acciona el **contenedor**, que es lo que ADR 0015 decidió
—lo que va a pantalla completa es la composición—. Así que no tiene nada que ver
con la maquinaria del break y no hay nada que decidir sobre su verdad. Medido:
`document.fullscreenElement === #stock-player`, la clase `qa-controls--full`
puesta, los tokens grandes y el ícono de salir. La captura es
`t07-6-fullscreen-del-pane-de-fabrica.png`, y ahí se ven las cinco marcas sobre
un riel de 10 px.

### El seek — queda, y seekea el PROGRAMA

Escrito sobre el elemento aterrizaría en la línea de tiempo del aviso en los
breaks donde el MediaSource se fue al asset, y no significaría nada. Escrito
sobre `primary.currentTime` es un segundo del programa, que es lo que la barra
dibuja, y **qué significa ese segundo lo decide la maquinaria de hls.js**, que es
lo que el bloque dice que es.

Medido, y las dos respuestas son de ese cliente y no nuestras:

- **Afuera de un break**, click al 50 % del riel —90,01 s— y el programa quedó en
  **91,021 s**: hls.js lo llevó al borde de segmento siguiente. La barra pide un
  segundo; ese cliente elige a qué cuadro puede ir.
- **Adentro de un break, el seek no se toma.** Click al 5 % del riel —9 s— y el
  programa se quedó en 45,021 mientras el aviso seguía corriendo. Repetido en
  `t07seek.py` en las dos estrategias y en los dos sentidos —a 9 s y a 150 s—:
  cuatro intentos, el reloj del programa quieto en los cuatro y el aviso
  avanzando. Es el `X-RESTRICT="SKIP"` que el tag de clase Apple lleva escrito, y
  hls.js 1.7.2 lo hace valer.

Y ahí está la razón de fondo para no sacarlo, que el informe de la fase 02 no
podía tener: **el seek de ese pane no es mobiliario, es la política del aviso en
funcionamiento.** Un espectador que arrastra la barra adentro del break y ve que
no se mueve está viendo lo que un aviso no salteable hace, en un cliente que ya
está en el mercado, sin que nadie lo explique.

## 5. Las tres lecturas

Las tres verifican el invariante del ADR 0007 —que ese pane sigue siendo un
cliente sin modificar— con el procedimiento que escribió la sección 4 de la T-04.
Todas de la misma corrida, con la página ya pasada por dos breaks.
`t07-la-lectura-los-dos-panes.json`, clave `lasTresLecturas`.

### Lectura 1 — la instancia se construye con cero opciones · **verde**

| | |
| --- | --- |
| esperado | la línea sin un solo argumento, y el HUD diciendo `PRESENT` |
| medido | `Object.keys(hls.userConfig).length` = **0**, `userConfig` = `{}`; `interstitialsManager != null` = true; `config.interstitialsController` = true; HUD: `hls.js 1.7.2 · interstitials manager: PRESENT · playing ./content/primary/con-daterange.m3u8` |
| y al lado | la instancia del pane de la demo, en la misma página: **1** opción y `interstitialsManager` **ausente** |

`hls.userConfig` es lo que la instancia recibió, así que es más fuerte que la
línea del archivo: cubre el argumento que alguien le pase mañana desde otro lado.
Y el contraste con el pane de al lado es lo que hace que la lectura diga algo:
uno con cero opciones y la maquinaria prendida, el otro con una y la maquinaria
apagada, en la misma página y sobre la misma playlist.

### Lectura 2 — su red nunca pide un asset-list concurrente · **verde**

Los dos players comparten una sola línea de tiempo de recursos, así que el pedido
hay que **atribuirlo** y son dos lecturas, como la T-04 midió:

| | |
| --- | --- |
| lo que esa instancia declara | los cinco eventos con `assetListUrl = /signalling/asset-list-linear.json`. **Nada más**: ahí está todo lo que esa instancia puede llegar a pedir |
| lo que la página pidió | los cinco concurrentes —`cornerOverlay`, `squeezebackLShape`, `squeezebackLShape-image`, `squeezebackDoubleBox`, `multiView`— **una vez cada uno y pelados**, y `asset-list-linear.json?_HLS_primary_id=4815ec2f-b655-4fc5-be55-0e9bb6601fed` |
| concurrentes con la huella `_HLS_primary_id` | **cero** |

La huella es de un controlador de interstitials de hls.js y está medida desde la
T-02 de la fase 01. Nuestro lado nunca la pone: la señalización usa `fetch` sobre
la URL del tag y las instancias por asset se construyen con
`interstitialsController: undefined`, así que no piden asset-lists.

### Lectura 3 — sigue agendando el Date Range de clase Apple · **verde**

| | |
| --- | --- |
| esperado | cinco eventos, los cinco de clase `com.apple.hls.interstitial`, ninguno de la concurrente |
| medido | **5**, los cinco `com.apple.hls.interstitial`; de la clase concurrente: **0**. El getter de la página (`window.demo.stock.scheduled`) dice lo mismo, y la consola imprime `[stock] scheduled 5: AD-1-LINEAR (com.apple.hls.interstitial), … AD-5-LINEAR (com.apple.hls.interstitial)` |

Las tres quedan escritas acá y no adentro de `scripts/verificar-cortes.mjs`, que
es la decisión 3 de la T-04: dos de las tres no existen en ningún archivo y ese
script son dos greps que tienen que volver vacíos.

## 6. Los chequeos

- `node scripts/verificar-cortes.mjs`: **verde**, las dos costuras. La de ADR
  0003 con las mismas tres aceptadas de la T-06 —la task le agrega texto a
  `lib/controls.js` y ninguna de las palabras de la lista— y la de ADR 0015 con
  **cero hits**, que es lo que hay que mirar acá: `attachControls` está del lado
  de la librería y la fachada que la usa está del lado de la página.
- `npm test`: **27 de 27**, igual que antes.
- `./scripts/construir-libreria.sh`: arma el `dist/` sin quejarse, y
  `attachControls` aparece en el objeto del global.
- **La caja pedida contra la dibujada**, adentro de los dos breaks: **delta máximo
  0 px** en los dos —2 elementos en el `cornerOverlay`, 3 en el
  `squeezebackLShape`—. Hacía falta porque la task toca los controles y la hoja de
  estilos de la página, y esa capa está sobre la misma imagen contra la que se
  resuelven los layouts.
- **Consola**: cero errores y cero warnings en la corrida de los dos panes. En la
  de los controles aparece uno no fatal, `[stock] error networkError aborted
  fatal: false`, que es un fragmento cancelado por un seek abrupto y lo produce el
  instrumento y no la página.

## 7. Las afirmaciones vivas

Las dos que la T-04 dejó anotadas para que no pase lo de la sección 9 después de
la T-02, y dos más que aparecieron con el cambio. Ninguna es track de cambios: el
texto queda como si siempre hubiera sido así.

| dónde | qué decía | qué dice |
| --- | --- | --- |
| `README.md`, la fila de `lib/concurrent-hls.js` | que la superficie es "`attach`, y la configuración" | `attach` para la experiencia concurrente, `attachControls` para el cromo solo, y la configuración |
| `docs/integrating-the-library.md`, sección 9 | que esta demo es la página mínima con una opción agregada | la página mínima con una opción agregada **más una llamada más de la sección 6**, y lo que esa segunda llamada recibe: el objeto que hace que su barra lea el programa y no el aviso que lo reemplaza |
| `README.md`, el párrafo del par de compatibilidad | "with nothing of this demo wired into it" | nada de esta demo cableado **en la instancia**, y tres párrafos nuevos: que los dos panes llevan el mismo cromo y por qué eso no lo modifica, que cada barra marca lo suyo, y qué reloj muestra la barra de la izquierda |
| `index.html`, el comentario del encabezado | que los controles son los del player de la derecha, y que ninguno de los dos muestra nativos | los controles son de los dos, con la misma razón, y las marcas de cada barra son las de su propio player |

Y una del documento del integrador que **no** estaba anotada y que la decisión de
la sección 3 obliga: la sección 6 decía que `video` es "el elemento". Ahora dice
qué es y por qué, con el caso concreto —un cliente que reemplaza el contenido
deja de reportar el programa mientras el aviso está en pantalla— porque es
exactamente el caso que hace útil esa entrada pública, y un integrador que lo
descubra en la toma no tiene cómo saber que la respuesta existe.

Lo que **no** se tocó: la sección 7, que es la superficie de marca. Después de la
T-02 ninguno de los dos panes lleva logo sobre la imagen y ese pane no recibe la
opción, así que ahí no hay nada que decir. Los dos colores funcionales siguen
fuera de la superficie pública, y lo que la sección dice de ellos —"the violet of
a concurrent range and the yellow of a traditional one, on the bar"— es más cierto
hoy que ayer: el amarillo se mudó a la barra del player que sí reemplaza.

## 8. Las capturas

Todas a `dpr 1`, así que son a tamaño real.

| archivo | qué muestra |
| --- | --- |
| `t07-1-los-dos-panes-afuera-del-break.png` | los dos panes con el mismo cromo, el mismo cuadro de la misma película y **el mismo reloj, 0:09 / 3:00**. Las únicas diferencias son el color de identidad de cada pane —borde, perilla, marcas— y sus rótulos |
| `t07-4-1-…-break-1-appendInPlace.png` | adentro del break appendeado: los dos relojes en 0:22, uno con el aviso encima del programa y el otro con el aviso en lugar del programa |
| `t07-4-2-…-break-2-mediasource-al-asset.png` | adentro del break donde el MediaSource se va al asset, que es **la captura de la decisión de la sección 3**: la barra de la izquierda dice 0:45 / 3:00 con la perilla en el borde de la segunda marca, y la línea de abajo dice `2.1s of 12.0s` del aviso |
| `t07-2-el-riel-del-pane-de-fabrica.png` | el pane de fábrica entero, con sus **cinco interstitials marcados sobre el riel** |
| `t07-3-la-tira-del-pane-de-fabrica.png` | la tira de la barra sola: cinco marcas amarillas adentro del riel y **nada colgando debajo** |
| `t07-5-1` y `t07-5-2` | la barra de ese pane adentro de cada uno de los dos breaks |
| `t07-6-fullscreen-del-pane-de-fabrica.png` | ese pane a pantalla completa, con el cromo en los tokens grandes |
| `t07-7-la-pagina-entera.png` | la página completa |

Las lecturas de esas mismas corridas están en `t07-la-lectura-los-dos-panes.json`,
`t07-la-lectura-controles.json` y `t07-el-seek-adentro-del-break.json`.

## 9. Lo que no coincide con el bloque

Cuatro cosas, con la evidencia al lado.

1. **"El cromo trae cuatro y los cuatro accionan el elemento" es falso para uno
   de los cuatro.** El fullscreen acciona el **contenedor**
   (`container.requestFullscreen()`, `lib/controls.js`), que es la decisión del
   ADR 0015: lo que va a pantalla completa es la composición y no un `<video>`. Es
   una precisión y no un detalle, porque es la que hace que el fullscreen sea el
   más barato de decidir de los cuatro: no toca la maquinaria del break, así que
   no hay ninguna verdad que verificar sobre él.

2. **La frase que el bloque cita de `js/stock-player.js` apuntaba al objeto
   equivocado, y no sólo a una conducta de dos.** La T-05 ya corrigió que el reloj
   del elemento es del aviso en dos breaks y del programa en tres. Lo que faltaba
   es que **el manager sí tiene una respuesta única, y son dos**: `primary`
   reporta el programa en los cinco y `interstitialPlayer` reporta el aviso en los
   cinco. O sea que el problema nunca fue que la información no existiera, sino
   que la línea leía la propiedad de al lado. La frase se reescribió sobre eso: el
   archivo ahora dice qué objeto contesta qué.

3. **"Ese pane hoy está muteado a propósito, porque el audio de la composición es
   del pane de la demo (ADR 0014)"**: lo primero es cierto y la atribución al ADR
   0014 no. Ese ADR decide el volumen inicial de cada elemento **adentro de** la
   composición y el default cuando el campo falta; no dice nada sobre cuál de los
   dos panes se queda con el audio de una grabación, porque no sabe que hay dos.
   Esa parte era un default de la página, escrito en un comentario. Queda dicho
   porque la decisión del audio de la sección 4 lo toca, y así queda claro que no
   contradice ningún ADR: el default no se movió.

4. **"Su pestaña de red nunca pide un asset-list concurrente" sigue sin ser una
   lectura que una sola página permita hacer tal cual**, que es lo que la T-04
   midió y esta task confirma corriéndola: hay una sola línea de tiempo de
   recursos y el pedido hay que atribuirlo. Las dos lecturas de la sección 5 son
   la misma afirmación, verificable.

Y una que el bloque **sí** anticipa y conviene cerrar con el número: el bloque
dice que qué muestra esa barra "puede ser un defecto o puede ser exactamente la
verdad de lo que significa reemplazar". Medido, es lo segundo **con la fuente
correcta** y lo primero con la otra: el mismo componente, alimentado con el
elemento, en dos de los cinco breaks se queda sin las cinco marcas.

## 10. Lo que esto le deja a la fase 03

Uno, y no es una decisión pendiente sino un precedente: desde la fase 03 nuestro
player reproduce un aviso lineal adentro del break, o sea que **nuestro** elemento
va a poder dejar de reportar el programa por el mismo mecanismo. La respuesta ya
está escrita y es la de la sección 3 —el reloj de una barra sale de donde viva la
posición del programa, y el del aviso es otra afirmación en otro lugar—, y la
segunda mitad la escribió la T-06: `KINDS_PLAYED` se lleva la clase de reemplazo
el día que este player la reproduzca.
