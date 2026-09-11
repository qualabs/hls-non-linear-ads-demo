# Evidencia de la T-03 — la señalización navegable: los pliegues, la glosa y la marca en vivo

Registro de lo que se corrió y se miró el 2026-09-11. No es instrucción vigente: lo que
se vuelve a correr son los tres instrumentos de acá abajo y los tres comandos de siempre.

## Lo que se construyó

| archivo | qué es |
| --- | --- |
| `demo/hydration-break/js/senalizacion.js` | el módulo: `showSignalling` sale de `app.js` y crece con los pliegues, la glosa por atributo y la marca en vivo |
| `demo/hydration-break/js/app.js` | dos líneas: el import y la llamada, y la función que se fue |
| `demo/hydration-break/index.html` | una línea menos: el `<pre id="list">` del resumen |
| `demo/hydration-break/css/page.css` | la glosa, los pliegues y la marca, sin colores nuevos |
| `demo/hydration-break/test/comprobaciones.js` | `cadaPliegueRotulaSuAviso`, el chequeo nuevo |
| `demo/hydration-break/test/signalled-run.test.js` | la prueba que lo corre sobre los archivos de verdad |
| `demo/hydration-break/test/mutaciones.mjs` | cuatro roturas, una por cada cláusula del chequeo |

**La lectura en vivo no se tocó.** La playlist se sigue pidiendo por red y el asset-list
se sigue sacando del `X-ASSET-LIST` del tag; lo que cambió es qué se hace con lo que
llega. El `START-DATE` de la captura —`2026-09-10T23:45:37.717-0300`— es el del
empaquetado de esa jornada, que es lo que prueba que no hay nada pegado.

## Lo que se sacó, que es una línea del plan que no se siguió al pie

El plan decía que la sección conserva sus dos `<pre>`. **El `<pre id="list">` se
eliminó**, y la razón es la decisión misma del ADR 0075: el resumen del asset-list
*"deja de ser el contenido y pasa a ser el rótulo"*, así que nadie lo escribe más. Un
`<pre>` que dice `loading…` y que ningún código vuelve a tocar es exactamente la mentira
que el comentario de cabecera de `index.html` prohíbe. El `<pre id="tag">` no se tocó.

La glosa no tiene caja de montaje en el markup: la dibuja el módulo y la inserta
inmediatamente después del `<pre>` del tag, que es el bloque que explica. Así la frase
del comentario de cabecera —dos contenedores vacíos a propósito— sigue siendo cierta.

## Las tres corridas

| archivo | qué dice |
| --- | --- |
| `linea-de-base-suite.txt` | `npm test` **antes de tocar nada**: 156 pruebas, 156 en verde |
| `suite.txt` | `npm test` al terminar: **164 pruebas, 164 en verde** |
| `costuras.txt` | `npm run check` — las dos costuras en pie |
| `mutaciones.txt` | `npm run mutaciones` — **6 chequeos en verde y 15 roturas en rojo** |

**Las ocho pruebas de diferencia están medidas y no supuestas.** Una es de esta task: la
carpeta de la demo pasó de 6 a 7 (`node --test demo/hydration-break/test/signalled-run.test.js`
→ `tests 7`). Las otras siete son de la fase 11, que corre en paralelo: mientras esta
task se ejecutaba apareció `test/enlarge-and-shrink.test.js`, sin trackear y con siete
pruebas adentro (`node --test test/enlarge-and-shrink.test.js` → `tests 7`).

`npm run check` difiere de la línea de base en tres números de línea de `lib/controls.js`
—23/111/147 pasaron a 33/127/163—, que son ocurrencias ya ACEPTADAS que se corrieron de
lugar porque la fase 11 está editando ese archivo. La lista del chequeo está indexada por
el contenido de la línea y no por su número, así que no es un hallazgo.

## El chequeo nuevo, y las cuatro roturas que lo vieron ponerse rojo

`cadaPliegueRotulaSuAviso` compara los rótulos que **produce la página** —
`labelsOfAssetList` de `js/senalizacion.js`, que es el código que corre en vivo y no una
reimplementación— contra el asset-list, en cuatro cláusulas: un pliegue por `ASSET`, el
ordinal del aviso que muestra, el layout que ese aviso declara y ningún otro, y la
duración que declara.

**Los rótulos entran por parámetro y no se calculan adentro del chequeo**, y eso es lo
que lo hace capaz de fallar: romper el asset-list no sirve como rotura, porque los
rótulos lo siguen y el chequeo quedaría verde. Lo que hay que romper es la
correspondencia entre lo que el pliegue dice y el aviso que tiene adentro, que es lo que
pasa cuando alguien escribe un rótulo a mano.

Las cuatro, del pie de `mutaciones.txt`:

```
  ROJO   cadaPliegueRotulaSuAviso
         rotura: el pliegue del aviso lineal pasa a decir `lowerThirdOverlay` escrito a mano
         dijo:   el pliegue 3 nombra `lowerThirdOverlay`, que su aviso no declara
  ROJO   cadaPliegueRotulaSuAviso
         rotura: se dibujan tres pliegues para cuatro avisos
         dijo:   la sección dibuja 3 pliegues y el asset list declara 4 avisos
  ROJO   cadaPliegueRotulaSuAviso
         rotura: el rótulo del primer pliegue se queda con los 12 s de una versión anterior
         dijo:   el pliegue 1 no dice los 16 s que declara su aviso
  ROJO   cadaPliegueRotulaSuAviso
         rotura: los dos primeros pliegues se rotulan al revés
         dijo:   el pliegue 1 se rotula "Ad 2 · …" y tiene adentro el aviso 1 del break
```

## La marca del aviso al aire, medida de dos maneras

`marca.json`, escrito por `marca.py`. La identidad se compara por `itemId` contra
`provider.activeAt(video.currentTime)`, que es la regla 6 del contrato.

**Por instantes, con su referencia.** El caso que tiene que dar lo contrario está adentro
de la tabla: afuera del break no hay ninguna marca.

| `currentTime` | pliegue marcado | la línea de estado de la página |
| --- | --- | --- |
| 5 s | *ninguno* | `the match, no ad` |
| 20 s | `Ad 1 · lowerThirdOverlay · 16 s · still image` | `ad on screen: lowerThirdOverlay · still image` |
| 35 s | `Ad 2 · squeezebackLShape · 16 s · video` | `ad on screen: squeezebackLShape · video` |
| 48 s | `Ad 3 · no layout block, played full frame · 8 s` | `ad on screen: linear · video` |
| 60 s | `Ad 4 · cornerOverlay · 24 s · video` | `ad on screen: cornerOverlay · video` |
| 76 s | `Ad 4 · cornerOverlay · 24 s · video` | `ad on screen: cornerOverlay · video` |
| 80 s | *ninguno* | `the match, no ad` |

La tercera columna es la línea que `app.js` ya pintaba antes de esta task, leída de la
misma llamada: es una fuente independiente de la marca y dice lo mismo.

**Y cambiando sola.** La segunda mitad de `marca.py` termina el recorrido guiado por el
botón, pone el programa a caminar y **no vuelve a tocar nada**: se muestrea cada 250 ms y
se anotan los cambios.

```
t=13.2  ninguno
t=15.3  Ad 1 · lowerThirdOverlay · 16 s · still image
t=33.7  Ad 2 · squeezebackLShape · 16 s · video
t=48.0  Ad 3 · no layout block, played full frame · 8 s
t=56.2  Ad 4 · cornerOverlay · 24 s · video
t=80.7  ninguno
```

Los segundos del cambio caen después del borde declarado (14 / 30 / 46 / 54 / 78) porque
el muestreo es cada 250 ms de reloj y el programa corre a 8×: cada muestra son hasta 2 s
de programa. Lo que la corrida prueba es el orden y que la marca se mueve sola, no el
borde exacto, que es lo que mide la tabla de arriba.

**Y no se abrió ningún pliegue** (ADR 0075). En las 40 muestras de la corrida libre el
estado de los cuatro `<details>` fue siempre `[false, false, false, false]`: un solo
valor distinto en todo el muestreo, que es lo que dice `libre_abiertos` en `marca.json`.

`marca-1907.png` y `marca-400x780.png` son la marca en pantalla: el rótulo más claro, la
regla de la izquierda encendida y las tres palabras `ON SCREEN NOW`. Sin un color nuevo,
que es la propiedad que esta página defiende desde la fase 04.

## El ancho, que es el riesgo R2 y apareció

`medicion-ancho.json`, escrito por `ancho.py`, a 400×780 con el pliegue del aviso 2
abierto, que es el JSON más largo de los cuatro:

| | `scrollWidth` | `clientWidth` |
| --- | --- | --- |
| los cuatro pliegues cerrados | 400 | 400 |
| el pliegue 2 abierto, con `min-width: 0` en `.asset` | 400 | 400 |
| **el mismo pliegue abierto, sin esa línea** | **471** | 400 |

**El riesgo se materializó exactamente como el ADR 0075 lo anunció**, y la primera
corrida de `pliegues.py` lo encontró antes de que existiera el arreglo: el documento
scrolleaba a 471 sobre un viewport de 400. La causa es la misma de la fase 04 un nivel
más adentro: `.assets` es un grid, un ítem de grid no se achica por debajo de su
contenido, y el `white-space: pre` del JSON abierto es contenido de 449 px. El
`overflow-x: auto` del bloque de código no alcanza solo, porque la caja donde vive estaba
dispuesta a crecer.

La medición de arriba es con su referencia: el 400 no prueba nada sin el 471 al lado, y
el 471 se vuelve a obtener inyectando `.asset { min-width: auto }` sobre la página
servida, sin tocar el árbol.

`medicion-pliegues.json` tiene la corrida completa en los dos anchos, cerrado y abierto:
**1907 sobre 1907 y 400 sobre 400 en los cuatro estados, y cero errores de consola.**

## Las capturas

| archivo | qué es |
| --- | --- |
| `seccion-3-abierta-400x780.png` | **la que el plan pide**: el pliegue del aviso 2 abierto a 400 px, con el JSON crudo entero y el documento sin scroll de costado |
| `seccion-3-cerrada-400x780.png` | la misma sección con los cuatro pliegues cerrados |
| `seccion-3-abierta-1907.png`, `seccion-3-cerrada-1907.png` | lo mismo a 1907 px |
| `pagina-1907.png`, `pagina-400x780.png` | la página entera en los dos anchos |
| `marca-1907.png`, `marca-400x780.png` | los cuatro pliegues con el aviso 2 al aire |

## Los tres instrumentos

| archivo | qué hace |
| --- | --- |
| `pliegues.py` | carga la página en los dos anchos, espera a que los cuatro pliegues estén dibujados (y no a un temporizador), mide `scrollWidth` contra `clientWidth` con todo cerrado y con el pliegue 2 abierto, lee rótulos, estado de apertura y los atributos de la glosa, y escribe las capturas |
| `marca.py` | termina el recorrido guiado por el botón, recorre el break por instantes y después lo deja caminar solo, y anota qué pliegue está marcado y si alguno se abrió |
| `ancho.py` | la medición del R2 con su referencia: el mismo pliegue abierto con y sin la línea que lo arregla |

Los tres necesitan `playwright` —en esta máquina, el del skill
`/home/nicolas/.claude/skills/playwright/.venv/bin/python`— y la demo servida.

## Cómo se sirvió la demo

`PORT=8085 node server.mjs demo/hydration-break`, y **no** `./run.sh hydration-break`,
por la misma razón que la T-01 y la T-02: `run.sh` reconstruye `dist/` desde `lib/` en
cada arranque, y `lib/` lo están editando las tasks de la fase 11. El `dist/` y la
playlist señalizada que se usaron son los que `run.sh` escribió en esa jornada. El server
se apagó al terminar, por su PID.

## Un hallazgo de la fase 11, que no se tocó

A las 13:49 `npm test` dio **4 archivos en rojo por un `SyntaxError` en `lib/controls.js`**
(línea 618, `Unexpected identifier 'on'`), con el archivo escrito a las 13:48. Un minuto
después `node --check lib/controls.js` pasaba y la suite volvía al verde: era una edición
de la fase 11 a mitad de camino, vista en vuelo. No se tocó nada y queda anotado porque
cualquiera que corra la suite en esa ventana ve cuatro rojos que no son suyos.
