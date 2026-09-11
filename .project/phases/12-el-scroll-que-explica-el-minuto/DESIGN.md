# Fase 12: el scroll que explica el minuto

> **Diseño acordado con Nicolás el 2026-09-11**, sin objeciones y sin cambios en
> ninguna de las cinco decisiones. Es la etapa 1 del modo C del skill
> `create-project`: la exploración de la fase, con sus alternativas y sus descartes.
> El acuerdo sobre este documento es el evento que generó `PHASE.md`, `TASKS.md` y
> los ADR 0073 a 0077; de ahí en adelante el contrato de la fase es `PHASE.md` y
> este archivo queda como la procedencia, para quien venga después a preguntar por
> qué la fase terminó siendo así.

La página de `demo/hydration-break` termina hoy con tres bloques que **recapitulan**
el minuto que se acaba de ver. El pedido los reemplaza por cuatro que **explican el
mecanismo**: qué es un aviso lineal y qué es uno no lineal, qué puede hacer la clase
concurrente y cómo convive con el interstitial de siempre, la señalización de este
ejemplo navegable, y los créditos.

Es la mitad de la página que lee el ingeniero que ya vio el minuto y ahora pregunta
qué fue eso. La otra mitad —la apertura y el player— no se toca.

---

## Las cinco decisiones

Las cinco se cerraron por la opción recomendada, que es la marcada en negrita.

| # | la decisión | opciones | resuelta en |
| --- | --- | --- | --- |
| **D1** | cómo se muestran los tipos de aviso | capturas generadas por script · **diagrama dibujado del contrato** · híbrido | **el diagrama** · ADR 0073 |
| **D2** | cuántos tipos se muestran | **los cuatro que este minuto reproduce** · esos más el catálogo de la herramienta de SVTA · los cinco nombres del documento de David | **los cuatro** · ADR 0074 |
| **D3** | qué significa "navegable" | **un pliegue por aviso con su JSON crudo adentro** · un visor de árbol JSON · el resumen de hoy más un botón "ver crudo" | **el pliegue**, y el aviso en pantalla se **marca** pero no se abre solo · ADR 0075 |
| **D4** | si la convivencia lleva figura | prosa sola · **dos columnas dibujadas sobre una playlist** · un link a `compatibility-pair` | **las dos columnas** · ADR 0076 |
| **D5** | el tope de secciones que la página se fijó | subir el tope a cinco bloques · **tres secciones más el pie de créditos, que es la forma de hoy** · fusionar 1 y 2 | **tres más el pie** · ADR 0077 |

Cada una está argumentada más abajo, con lo que se descarta y por qué.

---

## Lo que entra como dato y no se discute acá

Es el pedido de Nicolás del 2026-09-11. Va citado para que nadie lo reabra por
costumbre.

**El orden y el contenido de las cuatro secciones.** Qué son los avisos lineales y
los no lineales con imágenes de los distintos tipos; cómo funciona el
`concurrentInterstitial`, qué puede hacer y cómo convive con el interstitial común;
el DateRange y el asset list del ejemplo que se está viendo, navegable; créditos.

**La copia va en inglés y en la voz que la página ya tiene.** La presenta David
Hassoun en el evento de Apple del 7 de octubre.

**El encuadre es de convivencia y no de reemplazo.** Textual: *"es una forma más
polite, no es reemplazar una cosa con otra, es dar más opciones"*.

**No se implementa nada en esta etapa.** No se toca `index.html`, no se commitea, no
se pushea, y `lib/` y `demo/multiview-offer/` son de otras tasks que corren en
paralelo.

---

## El punto de partida, medido

Leído de los archivos, no de memoria.

### Qué hay hoy abajo de la imagen

`demo/hydration-break/index.html` tiene 192 líneas y tres bloques después del
player:

| bloque | qué dice | de dónde sale |
| --- | --- | --- |
| `What the player did` | un recap del minuto: una playlist, un tag, cuatro avisos, cero segundos de programa reemplazados, más tres números (`4` / `3` / `0`) | escrito a mano en el HTML |
| `The signalling, as it is served` | dos `<pre>`: el `EXT-X-DATERANGE` de la playlist que este player está reproduciendo, y un **resumen** del asset-list que fue a buscar | leído en vivo por `showSignalling()` en `js/app.js` |
| `Credits` (pie, `min-height: 72vh`) | de quién es cada cosa en pantalla | escrito a mano |

### Las dos reglas que la página se puso, y que el pedido pone a prueba

Las dos están escritas en el comentario de cabecera del propio `index.html`, que en
esta demo es la documentación real.

**Primera, la vara de verdad.** *"NONE OF IT IS A RECORDING (…) it is why no caption
on this page can claim something it has not read off the contract."* El mismo
comentario aparece en `app.js`, sobre `showSignalling`: *"this page does not get to
claim something it has not read. A tag pasted into the HTML would be an
illustration, and an illustration of a playlist is worth nothing to an audience that
reads playlists for a living."*

**Segunda, el tope de secciones.** *"Three sections and a hard cap of four in total
counting the player: one idea per screen, and three is better than four."*

### Una convención de copia que está viva y sin commitear

El árbol de trabajo tiene hoy un cambio sin commitear sobre `index.html` y sobre
`story/story.json` que no es de esta propuesta y que hay que respetar: **`Ad` y `Ads`
van con mayúscula** —`Four Ads`, `each Ad`, `the four Ad creatives`—. La copia nueva
de abajo la sigue.

### Qué muestra hoy el bloque de señalización, exactamente

El tag va entero, cortado en las comas para que se lea en cuatro renglones. El JSON
**no** va entero: `showSignalling` lo reduce a `URI`, `DURATION`, `type` y la lista
de cajas, y el comentario dice por qué —*"the whole file is 100 lines and the point
is what a break declares, not every viewport of every box"*—. O sea que hoy ya hay
una reducción, y "navegable" es exactamente el mecanismo que permite sacarla sin
perder la pantalla.

### El minuto, tal como el asset-list lo declara

Los cuatro avisos de `signalling/asset-list-hydration-break.json`:

| # | `type` | forma | medio | `DURATION` |
| --- | --- | --- | --- | --- |
| 1 | `lowerThirdOverlay` | banda inferior, el partido entero a la vista | `image/png` | 16 s |
| 2 | `squeezebackLShape` | L, el partido replegado a una esquina (`primaryContent` en `0 0 26 26`) | HLS | 16 s |
| 3 | *(sin bloque)* | lineal a cuadro entero, el programa corriendo detrás | HLS | 8 s |
| 4 | `cornerOverlay` | esquina inferior derecha, el partido vuelve | HLS | 24 s |

Tres formas de aviso y no dos, que es el ADR 0046, y la curva de intrusión del
ADR 0043. **El pedido de la sección 1 ya está reproducido en la propia demo**: el
minuto contiene el contraste lineal / no lineal que la sección tiene que explicar.

---

## D1. Los tipos de aviso se dibujan del contrato, no se fotografían

Es el problema de diseño más caro del pedido, porque una captura choca de frente con
la vara de la página: **una captura es una afirmación congelada que envejece sin
avisar**, y la página entera está construida sobre lo contrario.

### Las tres opciones

| opción | qué es | costo | qué se rompe |
| --- | --- | --- | --- |
| **A. capturas** | PNG de la demo corriendo, uno por forma, generados por script | medio | envejecen; obligan a un modo de captura en la página que nadie ejercita en el evento; contradicen la frase más fuerte de la página |
| **B. diagrama del contrato** (recomendada) | cada forma dibujada como las cajas que el layout declara, leídas **en vivo** de lo que este player resolvió | bajo | es esquemático: no muestra el creativo |
| **C. híbrido** | el diagrama como figura y la captura adentro de cada caja | alto | suma los dos costos y no cancela ninguno |

### Por qué B

**Es la única que no puede quedar vieja.** El diagrama no es una imagen guardada: es
markup que se arma en el momento con las cajas que la librería ya resolvió. Si el
asset-list cambia, el dibujo cambia solo. No hay nadie a quien haya que acordarse de
avisarle, que es la pregunta que Nicolás hizo y la única respuesta que no depende de
que alguien se acuerde.

**Y se lee del contrato, que es la vara de la página aplicada a una imagen.** El
proveedor ya entrega, por aviso, el `type`, el `box` de cada elemento en porcentajes
de inset, el `zDepth`, el `mediaType` y cuál elemento es el contenido primario. Eso
es literalmente el dibujo: cuatro rectángulos y un recorte. **La página no tiene que
saber nada nuevo para dibujarlo, y no re-implementa nada** —los dos defaults que la
herramienta de SVTA omite (ADR 0004, ADR 0014) ya vienen aplicados del otro lado de
la costura—.

**Y para esta audiencia es más legible que una foto.** El público lee playlists para
vivir: un rectángulo rotulado `70 6.25 12.5 6.25` contra la caja de la imagen dice
más que un cuadro del partido con un banner encima, que ya vieron en movimiento
treinta segundos antes.

### Cómo se arma, concretamente

Los cuatro avisos se enumeran **muestreando `activeAt` a lo largo del rango** que
`programRanges()` reporta, y juntando los `itemId` distintos. Es diez líneas y usa
sólo los dos métodos que el contrato documenta. Verificado en la fuente antes de
proponerlo: `activeAt` filtra el array completo de experiencias resueltas
(la función `activeAt` de `lib/signalling.js`, que es un `filter` sobre el array completo), así que **contesta por tiempos que todavía no se
reprodujeron**, que es la premisa sobre la que se apoya todo esto.

Hay un atajo y se descarta: el proveedor también expone `experiences` crudo
(el campo `experiences` del objeto que devuelve `createSignalling` en `lib/signalling.js`), pero ese campo **no está en el contrato documentado**, que
son dos métodos. Usarlo desde una demo es tomar una superficie privada; documentarlo
sería un cambio de librería, y la librería es de otra task.

### Y si igual se eligen las capturas, esto es lo que habría que construir

Se dice con estas palabras porque Nicolás lo pidió así.

**El script sería `demo/hydration-break/scripts/capturar-los-tipos.sh`**, hermano de
los tres que esta demo ya tiene con `google-chrome --headless=new --screenshot`
(`creativos.sh`, `l-capas.sh`, `paquete-de-canal.sh`). Levanta el server de la demo,
pide la página con un parámetro de captura —`?captura=<segundo>`, que la página tiene
que aprender a leer: buscar ese segundo, pausar, esconder el cromo y la placa— y
saca un PNG por forma, al tamaño de la caja.

**Quién las regenera:** nadie automáticamente. `run.sh` no, porque necesita un
browser y un server y `run.sh` es el comando único de la demo. Es un paso propio, del
mismo tipo que `setup-content.sh`, y lo nombra el README.

**Cómo se nota que quedaron viejas:** el script escribe `graphics/tipos/manifest.json`
con, por PNG, el `itemId`, el `type`, las cajas con que se tomó y un **hash de
`signalling/asset-list-hydration-break.json` y de `plate.json`**. Un chequeo nuevo de
`test/comprobaciones.js` compara ese hash contra los archivos vivos y **se pone rojo**
cuando difieren. Que se note no puede depender del ojo de nadie.

**Lo que cuesta, dicho de frente:** la página crece un modo que existe sólo para
sacarse fotos y que no se ejercita en el evento; el repositorio gana PNGs que hay que
mantener; y la frase *"none of it is a recording"* pasa a convivir con cuatro
grabaciones en la misma página. Es caro para lo que compra.

---

## D2. Se muestran los cuatro avisos de este minuto, y el resto del catálogo se nombra

**Opción A (recomendada): los cuatro que este minuto reproduce.** Tres no lineales y
uno lineal es exactamente la distinción que la sección tiene que explicar, con la
ventaja de que el lector los acaba de ver en movimiento. Se dibujan del contrato, así
que son verdad por construcción.

**Opción B: los cuatro más el catálogo que emite la herramienta de SVTA**
(`cornerOverlay`, `lowerThirdOverlay`, `squeezebackFrame`, `squeezebackDoubleBox`,
`squeezebackLShape`, `multiView`). Los seis existen como asset-list en
`demo/compatibility-pair/signalling/`, así que se podrían dibujar. El costo es que la
página pasaría a mostrar cajas de una señalización que **este player no reprodujo**,
y habría que rotularlo como tal en cada ficha. Además cruza la línea del ADR 0021 —un
signalling por demo— o copia archivos, que es peor.

**Opción C: los cinco nombres del documento de requerimientos de David** (Overlay,
L-box con video, L-box con imagen, Side by side pullback, Quad). Se descarta: el
mapeo de esos cinco nombres a los identificadores de la herramienta es el **ADR 0012,
que está en estado `proposed` y pendiente de la respuesta de David**. Ponerlo en una
página que él presenta es escribir en pantalla una conciliación que él todavía no
confirmó.

**Lo que sí entra sin costo** es una línea de prosa al pie de la sección 1 que diga
que el mecanismo no se agota en estas tres formas, sin enumerar. Una línea, no una
tabla.

---

## D3. "Navegable" es un pliegue por aviso, y lo de hoy queda adentro

El pedido es explícito en que lo que hace verdadera a esa sección —el tag y el JSON
leídos en vivo— no se pierde. Así que navegable se **suma** encima.

### Las tres opciones

| opción | qué es | qué cuesta |
| --- | --- | --- |
| **A. un pliegue por aviso** (recomendada) | un `<details>` por `ASSET`: el `<summary>` es la línea de resumen que hoy se imprime, y adentro va el **JSON crudo de ese asset, verbatim** | ~40 líneas |
| B. visor de árbol JSON | cada nodo del JSON plegable, con resaltado | un componente que nadie pidió, y en una página sin framework |
| C. el resumen de hoy más un botón "ver crudo" | mínimo | no es navegar: es un interruptor entre dos bloques, y el de abajo vuelve a ser cien líneas |

### Qué se puede plegar, abrir y resaltar, concretamente

- **Se pliega el aviso.** Cuatro `<details>` cerrados, uno por `ASSET`. El
  `<summary>` dice `Ad 2 · squeezebackLShape · 16 s · video`, que es la misma
  reducción que hoy se imprime: **deja de ser el contenido y pasa a ser el rótulo.**
- **Se abre el JSON crudo.** Adentro va `JSON.stringify(asset, null, 2)` del asset
  entero. Hoy esas cien líneas no están en ningún lado de la página; con el pliegue
  entran sin costar pantalla. La reducción deja de ser una pérdida.
- **Se resalta lo que está en pantalla.** El `<summary>` del aviso activo lleva una
  marca en vivo. No hace falta nada nuevo para saber cuál es: `paint()` ya llama a
  `provider.activeAt(video.currentTime)` en cada `timeupdate` y compara por `itemId`,
  que es la regla 6 del contrato. Son quince líneas más.
- **El tag se queda como está**, cortado en las comas, y gana una glosa de una línea
  por atributo, **dibujada sólo para los atributos que la línea realmente trae**. Ahí
  entra la frase más honesta que la página puede decirle a esta audiencia:
  `X-RESUME-OFFSET` **no significa nada en un Date Range de clase concurrente**,
  porque no hay nada interrumpido que reanudar, y está escrito como pregunta abierta
  para SVTA (ADR 0016).

### La sub-decisión: el aviso en pantalla se marca, pero no se abre solo

Abrir el pliegue solo se siente inteligente y pelea contra el que está leyendo: si
alguien abrió el aviso 3 para leerlo, el player le abre el 4 encima a los ocho
segundos. **Se marca y no se abre.** Si se quiere la variante automática, la forma
que no pelea es abrirlo **una sola vez** y no volver a tocar ese pliegue.

---

## D4. La convivencia se dibuja con dos columnas sobre una sola playlist

Es el corazón del encuadre polite, así que conviene que no sea sólo prosa.

**Opción A: prosa sola.** Alcanza para decirlo, y deja el punto más importante de la
sección con el mismo peso visual que el resto.

**Opción B (recomendada): una figura chica de dos columnas.** A la izquierda *"a
client in the market today"*, a la derecha *"the same client, with the library on
top"*, y arriba de las dos una sola playlist. Es la forma dibujada de lo que el
ADR 0007 sostiene y de lo que `compatibility-pair` demuestra con dos players. Treinta
líneas de markup y CSS, sin imágenes.

**Opción C: un link a `compatibility-pair`.** Se descarta como reemplazo: la otra
demo no está servida cuando corre ésta —`run.sh` sirve una demo por vez, ADR 0022—,
así que sería un link roto en escenario. Como mención en prosa, sin link, sí.

---

## D5. Tres secciones más el pie de créditos, que es la forma que la página ya tiene

El tope que la página se fijó es *"three sections and a hard cap of four in total
counting the player"*. Cuatro bloques nuevos parecen romperlo, y mirado de cerca no
lo rompen: **los créditos de hoy ya son un pie y no una sección** —`chapter--end`,
`min-height: 72vh`, contra las secciones que son `100vh`—.

Así que la cuenta queda igual que hoy: **player + tres secciones de pantalla completa
+ el pie de créditos.** El tope no se sube, y la regla que lo sostiene —una idea por
pantalla— se cumple: avisos lineales y no lineales, la clase concurrente, la
señalización.

Lo que sí hay que hacer es **reescribir el comentario de cabecera de `index.html`**,
porque hoy describe tres bloques que dejan de existir con ese nombre. Un archivo
cuyo comentario describe otra versión del archivo es exactamente el defecto que la
fase 10 persiguió once veces.

Descartado subir el tope a cinco: la regla no es un número, es la idea por pantalla,
y cinco pantallas abajo de un player es un documento y no una página de demo.
Descartado fusionar 1 y 2: son dos ideas —la taxonomía y el mecanismo— y fusionarlas
deja la sección más larga de la página justo donde el lector recién llega.

---

## La estructura nueva, sección por sección

La copia de abajo es **borrador**, en inglés y en la voz de la página. Está para que
se discuta el contenido, no para que se apruebe palabra por palabra.

### 1 — `Two ways to run an Ad`

**De dónde sale:** el contrato, en vivo, para las cuatro fichas. La prosa es nueva.

- **Kicker:** `Two ways to run an Ad`
- **H2:** *A linear Ad takes the picture. A non-linear Ad shares it.*
- **Lede:** *A linear Ad replaces the programme for as long as it runs: the viewer
  cannot see the match, and the programme comes back when the Ad ends. That is the
  break everybody knows, and it still works. A non-linear Ad is drawn into a box over
  a programme that never stopped. Same break, same inventory, and the picture
  underneath keeps running.*
- **La galería de formas:** cuatro fichas, una por aviso del minuto. Cada una es un
  cuadro 16:9 con las cajas que el layout declara, dibujadas en los porcentajes
  exactos, con el contenido primario marcado. Rotulada con el `type`, el medio y la
  duración, leídos del contrato. La del aviso 3 es un solo rectángulo a cuadro entero
  y dice *no layout block: played full frame*.
- **Cierre:** los tres números que hoy están arriba (`4` Ads in one break · `3`
  shapes · `0` seconds of programme replaced), **reusados tal cual**.
- **Una línea al pie:** que las formas no se agotan en estas tres, sin enumerar (D2).

### 2 — `The signalling class`

**De dónde sale:** el contrato documentado (`docs/contrato-senalizacion-renderizado.md`)
y los ADR 0009, 0007, 0016 y 0019. Todo lo que afirma es verificable en este
repositorio.

- **Kicker:** `The signalling class`
- **H2:** *One playlist. One tag. Four Ads, and the match never stopped.* **(reusado
  tal cual, es el mejor título de la página)**
- **Lede:** el de hoy, casi verbatim: *The programme carries a single
  `EXT-X-DATERANGE` of a custom class. An unmodified hls.js plays it; a library on top
  reads the asset-list the tag points at, and draws each Ad into the box the layout
  declares — over the picture, without replacing it.*
- **Qué puede hacer**, en cinco líneas cortas y cada una sostenida por el contrato:
  - Varios avisos en un break, reproducidos en el orden del array (Apéndice D.2).
  - Cada aviso declara sus cajas como insets porcentuales **de la imagen**, y declara
    también dónde va el programa: el contenido primario es un elemento del layout
    como cualquier otro.
  - Un elemento puede ser un video o **una imagen fija**, y esta demo lo muestra.
  - La mezcla de audio se declara por elemento, y la composición conserva un solo
    control de audio.
  - La clase concurrente **nunca cambia el largo de la línea de tiempo** (ADR 0016).
- **La convivencia**, que es el punto de la sección:
  *It does not replace the interstitial. It stands next to it.* —
  `com.apple.hls.interstitial` sigue significando exactamente lo que significa hoy. La
  clase concurrente es **hermana** y no una extensión: en HLS la clase de un Date Range
  se compara por igualdad exacta de string, así que un cliente que nunca la oyó
  nombrar la ignora. Eso no es una limitación a esquivar, es lo que permite servir las
  dos a la vez — la misma playlist lleva los dos tags y **cada cliente se queda con el
  que entiende**. Y adentro del break pasa lo mismo: un `ASSET` sin bloque de layout es
  un aviso a cuadro entero, reproducido por el mismo camino de código. *The
  interstitial we are used to is one of the options, not the thing being taken away.*
- **La figura de dos columnas** (D4).

**Este encuadre ya está en la demo y conviene decirlo**: el beat
`el-caso-de-negocio` de `story/story.json` dice *"Full-screen Ads can live here too,
the interstitials we are used to today."* La sección 2 es esa frase desplegada, no
una posición nueva.

### 3 — `The signalling, as it is served`

**De dónde sale:** la playlist y el asset-list que este player fue a buscar, en vivo.
Nada escrito a mano.

- **Kicker, H2 y lede reusados verbatim.** Son los mejores de la página:
  *Read off this page's own playlist, right now.* / *Not an illustration. The tag
  below is the one in the media playlist this player is playing, and the JSON is the
  asset-list it fetched.*
- El `<pre>` del tag, como hoy, más la glosa por atributo presente.
- Los cuatro `<details>`, con el JSON crudo adentro y la marca del aviso en pantalla.

### 4 — `Credits`

**Sin cambios**, y sigue siendo el pie. Ya está en último lugar.

---

## Qué se reusa y qué se tira

**Se reusa, y estas son las líneas que sobreviven:**

| qué | a dónde va |
| --- | --- |
| el H2 `One playlist. One tag. Four Ads, and the match never stopped.` | título de la sección 2 |
| el lede de `What the player did` (*The programme carries a single EXT-X-DATERANGE…*) | lede de la sección 2, casi verbatim |
| la lista de tres números (`4` / `3` / `0`) | cierre de la sección 1 |
| el kicker, el H2 y el lede de `The signalling, as it is served` | sección 3, verbatim |
| `showSignalling()` de `js/app.js` | se muda a `js/senalizacion.js` y crece; su lectura en vivo es la base del pliegue |
| el bloque de créditos entero | sección 4, sin tocar |
| las clases `chapter`, `chapter__inner`, `kicker`, `lede`, `facts`, `code` | tal cual; la estética no cambia |

**Se tira:**

- El **kicker** `What the player did` y su H2 como sección propia: el recap deja de
  ser un bloque y su contenido se reparte entre 1 y 2.
- La frase *"which is why the clock in the corner keeps running through all
  fifty-eight seconds"*: describe un detalle del cuadro que el lector ya no tiene a la
  vista cuando llega ahí, y la sección 2 dice lo mismo mejor con el ADR 0016.
- El **resumen** del asset-list como contenido: pasa a ser el rótulo del pliegue.

---

## Qué hay que construir de cero

| pieza | qué es | tamaño |
| --- | --- | --- |
| `js/tipos.js` | módulo nuevo: muestrea `activeAt` sobre el rango, junta los `itemId` distintos y dibuja una ficha por forma con las cajas del contrato | ~140 líneas (≈60 de código) |
| `js/senalizacion.js` | `showSignalling` sale de `app.js`: pliegues, glosa por atributo, marca del aviso en pantalla | ~180 líneas, de las cuales ~45 se mudan |
| `css/page.css` | las fichas de las formas, los pliegues, la marca, la figura de dos columnas | ~130 líneas |
| `index.html` | el markup de las cuatro secciones y **el comentario de cabecera reescrito** | ~90 líneas tocadas |
| copia en inglés | secciones 1 y 2 | ~320 palabras |
| `test/comprobaciones.js` + suite + `mutaciones.mjs` | dos chequeos nuevos con su control | ~110 líneas |

**Total ≈ 650 líneas**, de las cuales cerca de 250 son comentario, que en esta demo
es la documentación real. Un día de trabajo, en cuatro tasks que se pueden hacer en
este orden: la galería, la señalización navegable, la copia y el markup, los
chequeos.

---

## Cómo se verifica

**Los dos chequeos nuevos, en la suite de la demo**, que es donde vive lo que puede
romperse en silencio editando un archivo:

1. **La galería no tiene una lista de tipos adentro.** `index.html` y `js/tipos.js`
   no contienen ninguno de los identificadores de layout como literal: si el nombre
   de una forma aparece escrito, la galería dejó de derivarse del contrato y es una
   afirmación. Es el chequeo que hace que D1 sea una propiedad y no una intención.
2. **Todo lo que la sección 1 promete existe en el asset-list.** Cuatro avisos,
   exactamente uno sin bloque de layout, exactamente uno cuyos elementos son
   `image/*`. Ya existe como `lasTresFormasDelMinuto` en `test/comprobaciones.js`: lo
   que falta es que la galería se apoye en el mismo dato.

**Los dos van con su control en `mutaciones.mjs`**, que es la lección que este
proyecto pagó seis veces: un chequeo que nadie vio fallar es un chequeo que nadie
sabe que puede fallar.

**Y la verificación visual es una captura headless real y no un `getComputedStyle`.**
A 400×780 y a 1907 de ancho, que son los dos anchos contra los que esta página ya
midió. El cuerpo del documento no puede scrollear de costado: es la regla que
`chapter__inner { min-width: 0 }` ya defiende, y un `<details>` con JSON adentro es
exactamente el elemento que la vuelve a poner en riesgo.

---

## Fuera de alcance

- **Tocar la apertura y el player.** La fase empieza donde empieza el scroll.
- **`lib/`.** Nada de esto necesita un cambio de librería, y eso es una propiedad del
  diseño y no una casualidad: si la galería necesitara un método nuevo en el
  proveedor, sería una señal de que se está dibujando algo que el contrato no dice.
- **`demo/multiview-offer/` y `demo/compatibility-pair/`.** La primera es de la
  fase 11, que corre en paralelo; la segunda se queda como está.
- **El deck y lo que David dice en escenario**, que son de él.

---

## Lo que no se pudo determinar

- **Si el scroll de abajo entra en la grabación.** `PROJECT.md` dice que en escenario
  se muestran grabaciones y que la ventana de grabación es del 28 al 30 de
  septiembre, y no dice qué encuadra esa grabación. Si se graba sólo el player, las
  cuatro secciones son para el link que queda después y no para el escenario, y eso
  cambia cuánto conviene invertir en la figura de D4. **Lo contesta Nicolás o David,
  no el repositorio.**
- **Si David quiere los cinco nombres de su documento de requerimientos en pantalla.**
  El mapeo de esos nombres a los identificadores de la herramienta es el ADR 0012 y
  está en estado `proposed`, esperando su respuesta desde el 2026-09-03. Por eso D2 no
  los pone.
- **Si la clase `multiView` de la fase 11 termina apareciendo en esta demo.** No
  bloquea nada: la galería recomendada se deriva del asset-list de esta demo, así que
  si un día aparece, aparece dibujada sola.
