# Informe de cierre — fase 11: el multi view que elige quien mira

Cerrada el 2026-09-11, el mismo día que se abrió y se generó.

## 1. Resumen

La librería quedó con dos tags hermanos. El que ya existía declara un layout y el
cliente obedece; el nuevo, `com.qualabs.hls.multiViewInterstitial`, **anuncia un
catálogo y no una composición**, y quien mira la arma: sube y baja cámaras desde una
lista de casilleros en la barra, agranda una a cuadro entero con su audio, y sale
devolviendo el contenido principal exactamente como venía. Una sola playlist lleva
los dos, y la demo `demo/multiview-offer/` la recorre entera en 180 segundos.

El cambio más caro no se ve en pantalla: **`build()` y `clear()` dejaron de ser
totales y pasaron a trabajar por diferencia**, que es el código que dibuja todos los
avisos que ya andaban. Por eso la fase se apoyó en una lectura del recorrido de
`compatibility-pair` tomada **antes** de tocar nada, con su comparador probado en
rojo, y dio verde después de cada task que entró a ese camino.

**Lo más valioso que dejó la fase no está en el diff, y son dos cosas.**

La primera es **dónde el plan estaba mal**. Cinco líneas escritas de buena fe pedían
algo falso, algo imposible o algo que chocaba con una decisión ya tomada del
proyecto, y las tasks no las obedecieron: cada una resolvió lo que la línea quería
lograr y dejó escrito qué no siguió y por qué. Están enumeradas en la sección 3.

La segunda es **que la mitad de los defectos de la fase aparecieron midiendo y no
mirando**, y el peor de todos no lo atrapó ninguna prueba. Tocar una caja cuya
composición había cambiado después de que el nodo se creara dejaba **toda la
composición en silencio**, y las 170 pruebas pasaban enteras mientras eso ocurría,
porque un listener del DOM no se observa sin DOM. La sección 5 lo cuenta con sus
números.

**Y la fase produjo seis hallazgos que no eran tasks.** Seis carpetas de
`tasks/` no llevan número —`H2` a `H6`, `T-01-regresion-del-foco` y
`cableado-de-attach`— porque son defectos y huecos que aparecieron ejecutando, cada
uno con su medición, su control en rojo y su cierre. Son la mitad de lo que la fase
aprendió.

**La línea de base y el cierre, medidos con los mismos comandos:**

| chequeo | base 2026-09-11 (árbol heredado, `11a1f8c`) | cierre 2026-09-12T01:20:30Z |
| --- | --- | --- |
| `npm test` | **72 pruebas, 72 pasan, 0 fallan** | **183 pruebas, 183 pasan, 0 fallan** |
| los 5 archivos de test que la fase no tocó | (adentro de las 72) | **62 pruebas, 62 pasan, 0 fallan** |
| `npm run check` | verde | verde: 3 ocurrencias aceptadas, cero hits |
| `npm run mutaciones` | 4 chequeos verdes, 10 roturas rojas | **9 chequeos verdes, 20 roturas rojas** |
| `demo/compatibility-pair/test/signalled-run.test.js` | 3 pruebas | **3 pruebas, 3 pasan** |
| `demo/hydration-break/test/signalled-run.test.js` | 5 pruebas | **10 pruebas, 10 pasan** |

Las 111 pruebas de diferencia no son todas de esta fase: cinco chequeos de
`npm run mutaciones` y tres pruebas de la demo del break son de la fase 12, que
corrió en paralelo sobre `demo/hydration-break/`.

## 2. Decisiones tomadas

**Doce ADR.** Diez salieron del evento de generación y dos se escribieron durante la
ejecución, cada uno por un defecto que el diseño no había previsto.

| id | scope | decisión |
| --- | --- | --- |
| **0063** | project | La clase de multi view es hermana, y su `kind` toca tres tablas |
| **0064** | project | El bloque de multi view anuncia un catálogo y no un layout |
| **0065** | project | La geometría la calcula la librería, y una caja es la salida |
| **0066** | project | El tope de cuatro es de pantalla y no de oferta |
| **0067** | phase-11 | El selector es una lista de casilleros en la barra y no se oculta sola |
| **0068** | phase-11 | El anuncio son dos piezas: un popup que se va y un punto que se queda |
| **0069** | project | Agrandar es foco completo y desagrandar no toca el audio |
| **0070** | project | Cambiar la composición mueve las cajas y no la reconstruye |
| **0071** | project | La salida del multi view es `clear()` y tiene dos entradas |
| **0072** | project | El estado de quien mira vive en un módulo que decora al proveedor |
| **0078** | project | El foco de audio muere con su caja y no con la composición |
| **0079** | project | La caja de un aviso viaja con una transformación inversa que se suelta |

Ocho de los diez del evento son `scope: project` y dos son `phase-11`. La entrada
del `LOG.md` de ese día dice *"siete son `scope: project` … dos … son
`scope: phase-11`"*, y esa cuenta no cierra contra los diez archivos: son ocho y
dos. Los ADR en disco son la fuente y están bien.

**Los dos ADR de ejecución son el resultado más transferible de la fase, porque los
dos corrigen una afirmación que un ADR anterior había dado por cierta sin medirla.**

**El 0078 generaliza al 0029 y no lo supersede.** El ADR 0029 fijó cinco caminos de
salida del foco de audio, y dos estaban escritos nombrando el mecanismo que los
producía —*"se rearma la composición: … el renderer hace `clear()` y reconstruye, el
nodo enfocado ya no existe"*—. Los dos decían lo mismo porque hasta ese momento eran
lo mismo: cualquier cambio destruía todo. El ADR 0070 rompió esa coincidencia. El
0078 enuncia las dos salidas al nivel al que siempre se referían —**el foco se suelta
cuando el nodo que lo tenía deja de existir**— y el criterio para no supersederlo es
el que el proyecto ya usa: *"no es cuánto cambió, es si algo dejó de ser verdad"*.
Nada de lo que el 0029 decide se volvió falso, así que queda `accepted` con
`generalized_by: "0078"` y una nota fechada al pie.

**El 0079 no es ni supersede ni generalización del 0070, y eso se argumentó en lugar
de resolverse por default.** El 0070 escribió como consecuencia que *"la transición
sale gratis y ya está construida"*. Era cierto para el contenido primario, que se
mueve con un `transform` que sí se anima, y **falso para los nodos de aviso**, que se
colocan con `left`, `top`, `width` y `height` y no tenían ningún `transform` encima.
El ADR 0079 lo dice sin rodeos:

> **El ADR 0070 no queda superseded por esto y no es un detalle de forma.** Su
> decisión … sigue entera y en pie. Lo que estaba mal era una de sus consecuencias,
> que afirmó construido un mecanismo que para los nodos de aviso no existía. Un
> supersede diría que la decisión dejó de valer, y una generalización diría que este
> espacio contiene al suyo; ninguna de las dos es cierta.

Y deja la lección escrita: *"una consecuencia de un ADR que afirma que algo 'ya está
construido' es una afirmación sobre el código y no sobre la decisión, y se verifica
antes de escribirla o se mide después. Ésta se descubrió mirando, que es la manera
cara."*

## 3. Tasks, y las cinco líneas del plan que no se obedecieron

Las trece en `done`.

| id | qué dejó |
| --- | --- |
| T-01 | El reparto como función pura, `build`/`clear` incrementales, la cuarta razón para `place()`. 13 pruebas nuevas, 5 roturas scopeadas en rojo |
| T-02 | La clase, el `kind` en sus tres tablas, la lectura del catálogo, y el test de la relación entre las tablas |
| T-03 | `viewportsFor(count)` y `MAX_BOXES` derivado de la tabla. 12 pruebas, 6 roturas en rojo |
| T-04 | El contenido empaquetado y la playlist con los dos tags sobre 180 s |
| T-05 | `lib/multiview.js`: el estado de quien mira. 27 pruebas, 10 roturas en rojo |
| T-06 | El mecanismo de *holds*. 5 pruebas, y el control sin hold |
| T-07 | El selector. 41 chequeos de navegador, 0 fallas; 4 pruebas |
| T-08 | El popup y el punto. 36 chequeos, 0 fallas; 2 roturas en rojo |
| T-09 | Agrandar y desagrandar. Las tres lecturas de `volume`, 3 roturas de navegador y 3 sobre funciones puras |
| T-10 | La salida por sus dos entradas. 3 roturas + el control sin mutación, y el grep del CC con su ocurrencia plantada |
| T-11 | La página de la demo y la corrida de 180 s mirada entera a dos anchos |
| T-12 | La no-regresión: los conteos de cierre y el comparador del recorrido con su control en rojo |
| T-13 | Los dos documentos de `docs/`, el `README.md` de la raíz, y los ADR 0078 y 0079 |

### Las cinco líneas del plan que estaban mal

Es lo primero que se pierde si un informe sólo lista lo entregado, así que va con la
línea original y el argumento de por qué no se siguió.

**1. El test de las tres tablas pedía algo que no puede ser cierto (T-02).** El plan
decía: *"Un test que asserta que las tres tablas tienen el mismo conjunto de
claves."* No lo pueden tener. Las dos del cromo se indexan por **todo** `kind` que
cruza la costura, porque la misma barra se dibuja sobre un player de fábrica y ahí lo
que se reproduce es el `interstitial`; la tercera es la lista de lo que **este**
player reproduce, y el `interstitial` está deliberadamente afuera (ADR 0018). El test
que se escribió asserta la relación verdadera y lo deja dicho en su cabecera:

```
//   THE THREE TABLES DO NOT HOLD THE SAME KEYS, and that is the correction this
//   file makes to the shortest way of saying it. … So what is asserted
//   is the relation and not an equality: every kind has a colour and a name, the
//   kinds played are the kinds whose list this layer resolves, and every one of
//   those has both.
```

Y la aserción que reemplaza a la igualdad hace más que ella: `KINDS_PLAYED` se compara
contra la lista de `kind` que la capa **resuelve**, que son dos listas decididas en dos
archivos por dos razones y tienen que ser la misma.

**2. El botón de agrandar no podía vivir del lado que el plan decía (T-09).** El plan
nombraba `lib/renderer.js` —`createNode`— como el lugar del botón. No puede ir ahí, y
la razón es una decisión de esta misma fase: agrandar es **geometría y audio a la
vez**, y ningún lado es dueño de las dos. La caja a cuadro entero es estado de quien
mira (`lib/multiview.js`) y el audio es el índice único del renderizado (`setFocus`),
y el ADR 0072 fija que **el renderizado nunca aprende qué es una oferta**, así que el
renderizado no puede llamar a `enlarge`. Se resolvió en el cromo, que ya tenía esa
costura abierta desde `releaseFocus` (ADR 0031).

**3. El selector no se cierra al tildar (T-07).** El plan decía *"cierra al elegir, al
tocar afuera, o con escape"*. Las otras dos se implementaron; la primera no. Choca con
la forma que el ADR 0067 eligió, una lista de casilleros donde la misma fila sube y
baja: armar la grilla de cuatro son tres tildes, y cerrar en cada una las volvería tres
tildes y tres aperturas, que es justo lo que Nicolás pidió evitar —*"que te deje ir
seleccionando qué videos querés ver"*—. El argumento que la task escribió mide el costo
de los dos errores: *"El costo de equivocarse para este lado es una línea; para el
otro, el gesto central de la fase se hace tres veces más largo en la demo que se va a
mostrar."*

**4. La aserción del N=4 no podía leer de `demo/` (T-03).** El plan pedía assertar
contra `demo/compatibility-pair/signalling/asset-list-multiView.json` leído. El ADR
0023 prohíbe exactamente eso: `test/` lee sólo `test/` y `lib/`, y *"que `test/` lea
`demo/<nombre>/`"* está en su tabla de descartados. La aserción lee la copia que ya
vivía en `test/fixtures/asset-lists/`, y **no hubo que copiar nada**: el Quad estaba
entre los trece que el ADR 0023 mandó copiar enteros. La intención se cumplió igual y
un poco mejor, porque los cuatro `viewport` se leen **atravesando la resolución** y no
del JSON crudo, que es lo que hace que coincidan con lo que termina en pantalla.

**5. El plan no nombraba quién cablea el módulo nuevo (`cableado-de-attach`).** La
decisión 11 del `DESIGN.md` dice que `attach()` cablea `createMultiview` entre
`createSignalling` y `createRenderer`, y **ninguna fila del `TASKS.md` nombra
`lib/concurrent-hls.js` como entry point de eso**. Es un hueco del plan y no una task,
así que se hizo con su evidencia propia: dos líneas en `attach()`, la corrida mirada
sobre la demo servida con 21 chequeos y 0 fallas, y la comprobación de que el botón del
selector —que ahora existe en el DOM de las dos demos que ya andaban— queda
`hidden=True, display=none` en las dos, medido y no supuesto.

Y un sexto caso, de otra forma: **T-09 y T-10 no pudieron aplicar su propio cambio**,
porque tocaba archivos de otra task que estaba corriendo al mismo tiempo. Las dos
entregaron parche (`wiring.patch` y `way-out.patch`) en lugar de editar. El de la T-09
lo aplicó el coordinador; el de la T-10 quedó anotado como *"sin aplicar"* en la tabla
de la fase. **Hoy los dos están aplicados**, verificado en el árbol
(`lib/renderer.js:1285 function focusOn(id)`, `lib/concurrent-hls.js:317`,
`lib/controls.js:1265 const wayOutBtn`), y la celda de evidencia de la T-10 quedó vieja
contra el código. Se corrigió en este cierre.

**Y una task entera existió porque el plan no la tenía: la T-08 no tocó `TASKS.md`.**
Su informe lo dice: *"la tabla de la fase no se tocó … hay tasks corriendo en paralelo
y `TASKS.md` es de todas. La línea de la T-08 la escribe quien coordine."* Es la
decisión correcta contra el riesgo de dos escrituras concurrentes, y su precio es que
la tabla de la fase quedó desactualizada hasta que alguien la miró.

### Los seis hallazgos que no eran tasks

| carpeta | qué era | cómo se descubrió |
| --- | --- | --- |
| `T-01-regresion-del-foco` | Tocar una caja cuya composición cambió después de crearse dejaba **toda la composición en silencio** | midiendo |
| `H2` | El botón de la cuarta caja quedaba **debajo del botón de play** y no se podía presionar | midiendo |
| `H3` | Una caja que cambiaba de lugar **saltaba en vez de viajar** | mirando |
| `H4` | El botón de una caja **no viajaba con su caja**: quedaba 380 ms sobre una imagen ajena | mirando, después medido |
| `H5` | El rectángulo de una caja medía **12,8 px más que la caja** (`content-box`) | midiendo |
| `H6` | En un teléfono la nota del tope quedaba **abajo del pliegue** del panel | midiendo |

Cinco de los seis tocaron `lib/`. Ninguno estaba en el plan.

## 4. Hilos abiertos

**La fase no produjo ningún dato sobre viabilidad en red, y eso se escribió antes de
empezar para que no quedara como un supuesto de quien lea.** La T-01 de la fase 01
midió **decodificación** de cinco elementos simultáneos con contenido local, y esta
demo también sirve contenido local desde `server.mjs`. Al cerrar la fase **no se puede
afirmar nada sobre cuánto ancho de banda pide una grilla de cuatro sobre una conexión
real**, ni sobre qué hace el ABR con cuatro instancias de hls.js compitiendo. Es el
riesgo R5, aceptado sin mitigar, y sigue abierto tal cual.

**La segunda entrada del `<pre>` del audio: el renderer con DOM sigue sin tests.** Las
183 pruebas son todas de funciones puras. La regresión del foco lo demostró de la peor
manera —pasó entera por la suite en verde—, y lo que la cubre hoy es una lectura del
`volume` de cada elemento sobre el navegador contra su propia referencia, que es un
instrumento y no una suite. El ADR 0078 lo deja escrito como costo.

**El popup y el punto no se vieron en la demo servida en el 8082 al momento de su
task**, porque la T-08 decidió no reconstruir `dist/` con dos tasks editando `lib/`.
Se vieron después, en la corrida de la T-11.

**La demo no ejercita el solapamiento de un aviso con un multi view** (R6). El modelo
lo soporta por el ADR 0072 y no hay una pantalla que lo muestre.

**Y una restricción del archivo que no está escrita en ningún lado y va a volver:** la
hoja de estilos de la librería vive adentro de un template literal de JS, así que **un
backtick en un comentario corta el string**. `construir-libreria.sh` salió con
`SyntaxError: Unexpected identifier 'paintBoxes'` durante la H5. El comentario quedó
sin backticks; el próximo que se escriba adentro de `CONTROLS_CSS` se lo encuentra de
nuevo.

## 5. Riesgos que se materializaron, y los defectos que aparecieron midiendo

**R1 se materializó, y es el defecto más caro de la fase.** El riesgo escrito era que
el refactor de `build`/`clear` cambiara en silencio cómo se dibujan los avisos que ya
andan. Lo que apareció fue una variante que el riesgo no nombraba y que es peor,
porque no toca lo que se dibuja sino lo que se oye.

**La regresión del foco de audio.** `applyPlan` reescribe `slot.entry.element` con el
elemento que el contrato entrega en esa pasada, pero **el listener de `pointerdown` que
`createNode` le puso al nodo cerró sobre el elemento con el que el nodo se creó**. Con
la composición cambiada, el toque hace `setFocus` sobre un elemento que ya no está en
el índice, `effectiveVolumeOf` compara por identidad y devuelve 0 **para todos**, y
ningún nodo lleva el anillo porque ninguno es el enfocado. No se corrige solo: el
silencio dura hasta el próximo cambio de composición.

La medición es **el mismo gesto sobre la misma caja dos veces**, y la referencia está
adentro de la lectura: la número 2 es el caso que ya andaba, y es contra ella que se
juzga la 5.

```
ANTES DEL ARREGLO — 5_same_tap_on_the_same_box
 "programme": 0,
 "views": [ {"id":"view-caminandes-a","volume":0,"muted":true,"ring":false},
            {"id":"view-caminandes-b","volume":0,"muted":true,"ring":false} ],
 "anythingAudible": false

DESPUÉS DEL ARREGLO — 5_same_tap_on_the_same_box
 "programme": 0,
 "views": [ {"id":"view-caminandes-a","volume":1,"muted":false,"ring":true},
            {"id":"view-caminandes-b","volume":0,"muted":true,"ring":false} ],
 "anythingAudible": true
```

`anythingAudible: false` con el programa en 0 y las dos vistas en 0 quiere decir que
**no sonaba nada**. Y lo que hay que mirar dos veces es que la suite estaba en verde
mientras eso pasaba: la campaña que se escribió después lo confirma en la columna de
la derecha.

```
M1  entryOf contesta con la primera caja y no con la que se toco   | prueba nueva: 0 pasan, 3 fallan | suite entera: 167 pasan, 3 fallan
M2  entryOf no encuentra nunca nada                                 | prueba nueva: 1 pasan, 2 fallan | suite entera: 168 pasan, 2 fallan
M3  el listener del toque vuelve a quedarse con el elemento de su creacion | prueba nueva: 3 pasan, 0 fallan | suite entera: 170 pasan, 0 fallan
--  sin mutacion, el control                                        | prueba nueva: 3 pasan, 0 fallan | suite entera: 170 pasan, 0 fallan
```

**M3 es la regresión original vuelta a plantar, y da 170 pasan, 0 fallan.** La suite
entera, verde, con el defecto adentro. Lo único que la ve es la prueba nueva, y la
prueba nueva no existía porque hasta el ADR 0070 la pregunta no se podía hacer.

**R4 no se materializó y se cerró con números.** La composición no queda a medias, y
está asserteado: *"applied, the composition is exactly the target: not one node more
and not one less"*. La rotura R5 de la campaña de la T-01 —aplicar el plan a medias—
la pone en rojo.

**R7 no se materializó, y la mitigación encontró que el plan estaba mal** (sección 3,
caso 1).

**R2 y R3 no se materializaron.** El anuncio se construyó y se midió; el auto-ocultado
con hold se midió contra su control: **2600,3 ms desde que se suelta el hold** contra
**2598,2 ms desde el movimiento del mouse sin hold**, o sea el temporizador arranca de
nuevo y no se rompió.

### Los otros defectos que aparecieron midiendo, y su número

**El botón que no se podía presionar (H2).** Lo encontró la T-10, no mirando la
pantalla sino porque Playwright no pudo hacer click. El botón de la cuarta caja en
`[646, 403, 34, 34]` contra un play en `[603, 359, 74, 74]`: **31×30 de los 34×34
tapados**. La T-09 había escrito la esquina a mano —arriba a la izquierda, *"la única
esquina libre en las tres formas"*— y en la grilla de 2×2 esa esquina de la cuarta caja
es el centro del cuadro. Peor en un teléfono: **31×31 de 34×34**, porque el botón sube
a 44 px por `any-pointer: coarse`. El arreglo no nombra la grilla de 2×2: recorre las
cuatro esquinas y devuelve la primera que no cae sobre ninguna pieza del cromo, con los
tres rectángulos del cromo **medidos** y no escritos. Mueve un botón de una forma:
`nw,nw` / `nw,nw,nw` / `nw,nw,nw,`**`ne`**. Su rojo es la corrida entera contra un build
con la regla vieja puesta, y **dos de las cuatro formas quedan verdes con el defecto
adentro**, que es lo que separa esta medición de una que se pone roja por cualquier
cosa.

**El rectángulo que medía 12,8 px de más (H5).** `.qa-box` escribe `width`/`height` y
tiene `padding`, y la hoja de la librería no declaraba `box-sizing`.

```
ANTES    escrito   550.0 x   309.4   pintado   562.8 x   322.2   sobra +12.8 x +12.8   MIDE DE MAS
         botón [1072.4, 315.8, 34, 34]   RECORTADO por el borde de la imagen
DESPUÉS  escrito   550.0 x   309.4   pintado   550.0 x   309.4   sobra +0.0 x +0.0   mide la caja
         botón [1059.6, 315.8, 34, 34]   adentro de la imagen
```

Una línea en `lib/controls.js`. Y el efecto sobre la medición heredada de la H2 es el
que la aritmética predice y no una coincidencia: de trece lecturas de esquina,
**cambian dos, las dos `ne`, cada una 12 px a la izquierda**, y las once `nw` quedan
idénticas.

**La nota que no se leía en un teléfono (H6).** La dejó medida la T-11 mirando la
corrida a dos anchos. A 420 px el panel mostraba 137 px de los 297 que mide, y la nota
que explica por qué dos filas están grises quedaba **0 de 44,4 px visible**; a 1440,
44,4 de 44,4. Dos líneas adentro de `paintRows`. El control tiene sus dos mitades: **el
420 en rojo** dice que el chequeo puede fallar y falla donde el hallazgo lo describió, y
**el 1440 en verde con el defecto puesto** dice que mide el pliegue del teléfono y no
cualquier cosa.

**La caja que saltaba (H3) y el botón que no la seguía (H4).** El único de los seis que
se descubrió mirando. Medido cuadro a cuadro sobre `requestAnimationFrame`, con el
contenido primario como referencia de adentro de la misma corrida, porque él ya se
movía antes:

```
sin el cambio   view-caminandes-a  (550,0,550,309.4) -> (0,0,1100,618.8)  cuadros intermedios:  0  SALTO
                primario           (0,0,550,309.4)  -> (0,0,1100,618.8)  cuadros intermedios: 22  MOVIMIENTO
con el cambio   view-caminandes-a  (550,0,550,309.4) -> (0,0,1100,618.8)  cuadros intermedios: 21  MOVIMIENTO
```

Y la vista que **entra** sigue con 0 cuadros intermedios antes y después, que es la
mitad que prueba que entrar no es viajar. El botón, después de la H4, pasó de una
deriva máxima de **550,0 px** a **0,1 px** sobre los 380 ms del viaje.

## 6. Recomendaciones para la fase siguiente

**Las verificaciones que no podían fallar fueron varias, y el patrón vale más que los
casos.** Cada una la encontró **quien la había escrito**, corriéndola contra algo que
tenía que dar lo contrario. Eso es lo que hay que llevarse: no que hubo errores, sino
que el que los encontró fue el control y no un revisor.

- **La opacidad se lee del nodo y el que se apaga es el padre (T-08).**
  `getComputedStyle(nodo).opacity` devuelve la opacidad **de ese nodo**, así que
  adentro de una capa apagada sigue contestando `1`. La rotura que mete el popup
  adentro del cromo —el error exacto que ese chequeo existe para encontrar— daba **36
  chequeos, 0 fallas**. Se arregló con `checkVisibility({ opacityProperty: true })`,
  que mira a los ancestros, y la misma rotura pasó a dar 2 fallas.
- **Los píxeles contados afuera de la caja cuando el botón salta adentro (H4).** La
  primera cuenta medía cuántos píxeles del botón caían **afuera** de su caja. Al
  desagrandar, el botón salta al rincón del cuadrante, que está **adentro** del cuadro
  entero del que la imagen todavía está saliendo: daba **0,0 px con el defecto a la
  vista**. La cuenta final mide contra la **esquina**, que es lo que no se puede
  fingir, y la huella del defecto viejo quedó impresa en la salida definitiva —
  `el botón llegó a caer 0.0 px afuera de su caja` en la misma línea donde la deriva da
  550 px.
- **La primera galería dibujaba dos de tres breaks (T-11).** Los rangos resuelven **de
  a uno**, a medida que cada asset-list vuelve de la red, y nada anuncia el último. Una
  sección dibujada en el primer cuadro que tenía algo mostró **dos de los tres breaks
  de una playlist que señaliza tres**, *"no error, no warning, and nothing on the
  screen to say one was missing"*. La respuesta del contrato es `programRanges().settled`,
  y el dibujo pasó a exigirlo en lugar de exigir "hay suficiente". Quedó escrito en
  `docs/integrating-the-library.md` como sección propia, que es el único lugar donde un
  integrador lo va a leer a tiempo.
- **Que un elemento exista en el DOM no es que se vea (H6).** `note.hidden === false`
  también es cierto con el defecto puesto. En la salida del rojo, `note is shown` da
  **OK** y lo que cae es `note is whole`.
- **Medir sobre una página que tapa el defecto (H5).** Las tres páginas de demo traen
  `* { box-sizing: border-box }`, así que sobre ellas el antes y el después dan
  idénticos. De ahí la elección de medir sobre la página del último commit, sin hoja
  propia.
- **Una lectura antes y otra después del gesto da lo mismo con transición y sin ella
  (H3, H4)**, porque las dos leen la caja quieta. Lo único que las distingue es lo que
  pasa en el medio, y de ahí el muestreador por cuadro.

Es la quinta y sexta vez que el proyecto paga este defecto, después de la fase 07 y la
09. **Lo que cambió en esta fase es que las seis las encontró el propio autor**, porque
todas las tasks de nivel alto llevaban el control escrito en el plan. El costo de no
tenerlo escrito se ve en la única afirmación de la fase que quedó sin control: la T-09
dice *"con el cromo abajo el botón no está"* y lo que midió es la opacidad del padre
(`layerOpacity=0`) con los cuatro botones todavía en el DOM (`buttons=4`). La lectura
correcta está tomada; la afirmación es más fuerte que el número, y no hay rotura que la
haga fallar.

**Y una recomendación de gobierno, no de código: tres tasks escribiendo `lib/` a la vez
produjo cuatro efectos distintos y ninguno estaba en el plan de riesgos.** Dos parches
sin aplicar, un `dist/` sin reconstruir, una tabla de fase sin actualizar, y una celda
de evidencia que quedó vieja contra el código. Las tasks hicieron lo correcto en las
cuatro —no editar archivos ajenos—, y el precio lo pagó la coordinación. Si una fase
futura vuelve a paralelizar sobre `lib/`, **el plan tiene que nombrar quién aplica los
parches y cuándo se reconstruye `dist/`**, que es exactamente lo que acá no estaba
escrito.

**Para quien entre a `lib/renderer.js` después:** el reparto de nodos es ahora una
función pura sobre datos y `place()` sigue siendo el único que escribe geometría. Lo que
esta fase agregó como trampa es que **un listener registrado en `createNode` cierra
sobre el elemento de esa pasada**, y el contrato entrega objetos nuevos en cada pasada.
Cualquier listener que guarde un elemento tiene el mismo defecto que tuvo el del foco, y
no lo va a ver `node --test`.

## 7. Correcciones post-ejecución

**Ninguna.** `grep -n "post-ejecuci"` sobre el `TASKS.md` de la fase no devuelve nada.

Leído como medición y no como log, el cero acá dice bastante menos que en otras fases,
y conviene decir por qué. **Lo que en otra fase habría sido una corrección
post-ejecución, en ésta fue una carpeta de hallazgo.** Los seis defectos de la sección 5
llegaron después de que la task que los produjo se declarara `done` —el del foco después
de la T-01, el del botón después de la T-09, el del rectángulo después de la H4— y
ninguno se anotó como `post-ejecución:` en el bloque de su task. Se abrió una carpeta
con su medición en su lugar.

Esa elección tiene una razón buena y un costo. La razón buena es que cada uno traía su
propia campaña y su propio control en rojo, que no entran en una línea. El costo es que
**el bloque de la T-09 no dice que su botón quedaba debajo del play, y el de la T-01 no
dice que dejó la composición muda**: quien lea esas tasks las ve terminadas y limpias, y
lo que pasó después está en una carpeta hermana que nada en el bloque nombra.

Para la próxima, las dos cosas: la carpeta con la medición **y** la línea en el bloque
apuntando a ella.

## 8. Revisión de documentación

Superficie por superficie, con lo que se actualizó o por qué no necesitaba nada.

**El índice de fases de `PROJECT.md`** — escrito en este cierre. Su línea dice qué quedó
construido, cuáles fueron las cinco líneas del plan que no se obedecieron, y que la
regresión del foco pasó entera por una suite en verde.

**`docs/arc42/`** — no existe, y esta fase no lo crea. La razón es la que el proyecto ya
tiene escrita desde la fase 02: los dos documentos de `docs/` cumplen ese papel para el
único lector que tienen, quien construye con la sdk. La pregunta de si el documento
todavía describe el sistema se contesta sobre esos dos, abajo.

**`docs/contrato-senalizacion-renderizado.md`** — **corregido**, y era la corrección que
la fase debía. Gana el `type` `multiViewOffer`, la forma `View`, los dos campos que sólo
trae una oferta, la sección *La oferta de varias vistas*, y `provider.experiences` como
propiedad entregada por referencia. Y dice explícitamente lo que un lector supone al
revés: *"Las formas de `Element` y de `Range` no cambiaron para agregar la oferta, y eso
es el dato y no una tranquilidad."*

**`docs/integrating-the-library.md`** — **corregido**. El bloque de configuración de
`attach`, la descripción de los controles con la lista de vistas, y la sección nueva
*The list of breaks is not complete until it says so*, que es donde quedó escrito el
defecto de los dos breaks de tres. Es la superficie pública y era la mitad que la
recomendación 2 del informe de la fase 06 pide no olvidar.

**El `README.md` de la raíz** — **corregido**. La clase hermana en la apertura, la fila
de `multiview-offer` en la tabla de demos, `lib/multiview.js` en la tabla de archivos, y
el párrafo que explica que el estado de quien mira se sienta entre las dos capas sin que
ninguna se entere.

**El `README.md` de `demo/multiview-offer/`** — **escrito**, nuevo. Cuenta la corrida, la
razón de que no haya recorrido guiado, y de dónde sale el contenido.

**El `CLAUDE.md` del proyecto** — existe y es nuevo, sin commitear. **Ninguna task de
esta fase lo nombra como entregable**, y la H4 lo registró como hallazgo cuando apareció
en el árbol a mitad de su corrida. Se leyó al cerrar y describe el proyecto que hay hoy:
enruta a los cuatro lugares donde viven las reglas, y su sección sobre publicar en GCS
no la contradice nada de esta fase. No se tocó.

**`.project/knowledge/`** — no existe, y la fase no produjo nada que califique. Lo que
aprendió sobre cómo trabajar está en la sección 6 de este informe y lo que decidió está
en sus doce ADR; ninguna fase posterior lo necesita como insumo.

**El `CLAUDE.md` y el `knowledge/` del repo padre** — **no necesitaban nada**. El
candidato era el patrón de la sección 6, un chequeo que no puede fallar, pero es un
riesgo que el proyecto ya nombra y persigue en cada fase y no una regla nueva. Lo que sí
sería candidato a regla —quién aplica los parches cuando dos tasks comparten un archivo—
está propuesto en la sección 6 y no se escribió: una regla se acuerda antes de aplicarse.

**El doc de instalación o runbook** — el proyecto no tiene uno separado: `./run.sh <demo>`
es el punto de entrada y lo dice el `README.md`. La fase agregó una demo, así que agregó
un argumento válido a ese comando, y eso está en el `README.md` de la raíz y en el de la
demo. El comentario de cabecera de `run.sh` decía *"with the only one that exists as the
default"* y pasó a decir *"with the oldest one as the default"*, que es la afirmación que
esta fase volvió falsa.

**Las carpetas `tasks/` de esta fase** — marcadas como **registro** y no como instrucción
vigente. Los `README.md` de evidencia arrancan diciendo que son el registro de lo que se
midió ese día. Sus mediciones, sus capturas y sus salidas prueban qué se corrió; no se
reescriben. Lo único que se corrigió en la gobernanza de la fase es la celda de evidencia
de la T-10, que decía *"sin aplicar"* de un parche que hoy está aplicado: eso es un
puntero vigente y no un registro.

**`PHASE.md`** — su tabla de línea de base decía *"cero hits en las dos"* costuras, y la
primera tiene tres, las tres en la lista aceptada del propio chequeo. Lo encontró la
T-12 midiendo y la celda ya está corregida con su nota fechada al pie, que además dice lo
que importa: *"la frase sobrevivió a toda la fase repetida en los despachos"*.
