# Evidencia de la T-05 — la no-regresión: que la demo que se graba siga en pie

Registro de lo que se corrió y se miró el 2026-09-11. No es instrucción vigente: lo que
se vuelve a correr son los cinco instrumentos de acá abajo y los tres comandos de
siempre.

**Esta task no arregló nada.** Lo que apareció está en *Hallazgos*, al final, con su
evidencia al lado.

## El veredicto

**La fase quedó sana.** Las tres corridas están en verde con cada diferencia contra la
línea de base explicada, el recorrido guiado corre entero de punta a punta con sus seis
placas en el segundo que anuncian, la sección 3 sigue leyendo la playlist de la red, y
el documento no scrollea de costado en ninguno de los dos anchos ni con el pliegue más
largo abierto. Cero errores de consola en las cinco corridas de navegador.

## Las tres corridas, contra la línea de base de la T-01

| | línea de base (T-01) | ahora | archivo |
| --- | --- | --- | --- |
| `npm test` | 124 pruebas, 124 en verde | **165 pruebas, 165 en verde** | `suite.txt`, y `suite-2.txt` media hora después |
| `npm run check` | las dos costuras en pie | **las dos costuras en pie** | `costuras.txt` |
| `npm run mutaciones` | 4 chequeos verdes, 10 roturas rojas | **7 chequeos verdes, 17 roturas rojas** | `mutaciones.txt` |

### Las 41 pruebas de diferencia, medidas y no supuestas

**Ninguna prueba de la base desapareció**, que es la pregunta que una no-regresión tiene
que contestar y que un total más alto no contesta. Comparando los nombres de las 124 de
`linea-de-base-suite.txt` contra los de las 165 de ahora:

```
base: 124  ahora: 165
=== PRUEBAS QUE DESAPARECIERON (estaban en la base y no están ahora) ===
(total: 0)
```

Las 41 nuevas, atribuidas a su archivo (`nuevas-por-archivo.txt`):

| archivo | pruebas | de quién |
| --- | --- | --- |
| `demo/hydration-break/test/signalled-run.test.js` | 3 | **esta fase**: la guarda de la galería (T-02), el chequeo de los pliegues (T-03) y el del ritmo del guion (el cambio de copy de hoy) |
| `test/multiview-state.test.js` | 27 | fase 11 |
| `test/enlarge-and-shrink.test.js` | 7 | fase 11 |
| `test/views-selector.test.js` | 4 | fase 11 |

La suite propia de la demo pasó de 5 a 8 pruebas
(`node --test demo/hydration-break/test/signalled-run.test.js` → `tests 8`), que son las
tres de la tabla. El resto de la carpeta `test/` es de la fase 11, que corre en paralelo
sobre `lib/` y no comparte un archivo con esta.

**Y el total de `npm test` no es la suma de los archivos de prueba**: son 163 más 2, y
los 2 son `comprobaciones.js` y `mutaciones.mjs`, que viven adentro de un directorio
`test/` y `node --test` cuenta cada uno como una prueba de archivo. Está en
`conteo-por-archivo.txt`.

### Las tres diferencias de `npm run mutaciones`

`diff-mutaciones.txt` es el diff entero contra la línea de base: **son sólo agregados**.
Las 10 roturas originales salen byte a byte iguales, y lo que se sumó son tres chequeos
con sus 7 roturas: `laGaleriaSeDibujaDelContrato` (1, T-02), `cadaPliegueRotulaSuAviso`
(4, T-03) y `elRitmoDelGuion` (2, el copy de hoy).

### La única diferencia de `npm run check`

Verde igual, con la misma lectura: 3 ocurrencias, todas en la lista aceptada, y cero
hits en la segunda costura. Lo que cambió es de la fase 11 y no de ésta:

```
<    ... lib/renderer.js lib/controls.js demo/compatibility-pair/js/contract-trace.js ...
---
>    ... lib/renderer.js lib/controls.js lib/multiview.js demo/compatibility-pair/js/contract-trace.js ...
11,13c11,13
<      lib/controls.js:22   ...
<      lib/controls.js:101  ...
<      lib/controls.js:137  ...
---
>      lib/controls.js:33   ...
>      lib/controls.js:127  ...
>      lib/controls.js:163  ...
```

`lib/multiview.js` entró a la lista de archivos que la costura vigila, y las tres
ocurrencias aceptadas de `lib/controls.js` se corrieron de línea porque la fase 11 está
editando ese archivo. La lista del chequeo está indexada por el contenido de la línea y
no por su número.

## El recorrido guiado, mirado de punta a punta

`recorrido.py` lo mira entero sin saltear: muestrea cada 100 ms `currentTime`, la placa
visible y su texto, si el video está pausado, el rótulo del botón, `body[data-story]` y
la línea de estado. 742 muestras en una corrida de 90 s. Salida en `recorrido.json`.

**La apertura.** Las cuatro frases del panel son las cuatro de `story/story.json`, letra
por letra, y el scroll de la sección mueve `--t` de 0 a 1 encendiendo una por una:

| scroll | `--t` | `data-done` | opacidad de las cuatro frases |
| --- | --- | --- | --- |
| 0 | 0.0000 | no | `[1, 0, 0, 0]` |
| 600 | 0.3337 | no | `[0, 1, 0, 0]` |
| 1200 | 0.7087 | no | `[0, 0, 1, 0]` |
| 1800 | 1.0000 | **sí** | `[0, 0, 0, 1]` |

**El arranque por viewport, con sus dos referencias** (`arranque.json`). Sobre una
página recién cargada, y en este orden, que es el que hace que la medición signifique
algo:

| | visible del player | ¿arrancó? | programa |
| --- | --- | --- | --- |
| sin scrollear un píxel, 6 s | 0 % | **no** (`data-story` nulo, sin placa) | 0 s, pausado |
| con el player asomando, 4 s | 30 % | **no** (`data-story` nulo, sin placa) | 0 s, pausado |
| con la imagen en pantalla | 100 % | **sí**, la placa a los 0.06 s | 0 s, pausado |

Las dos primeras filas son el caso que tiene que dar lo contrario: sin ellas, la tercera
pasa aunque el umbral de 0,6 no haga nada.

**Las seis placas**, en el segundo del programa que su ancla declara, todas con el
programa quieto detrás y el botón diciendo *Skip the walkthrough*:

| | aparece en | en pantalla | `hold` declarado | el programa avanzó | captura |
| --- | --- | --- | --- | --- | --- |
| 1 · *In this soccer match the hydration break is about to start.* | 0.00 s | 5.44 s | 5 | 0.02 s | `placa-1.png` |
| 2 · *A concurrentInterstitial is inserted, signalling four Ad opportunities…* | 6.02 s | 5.91 s | 5.5 | 0.08 s | `placa-2.png` |
| 3 · *The first Ad is an image, a transparent PNG.* | 11.52 s | 4.94 s | 4.5 | 0.10 s | `placa-3.png` |
| 4 · *The second Ad is a video in an L-SHAPE…* | 28.51 s | 6.93 s | 6.5 | 0.09 s | `placa-4.png` |
| 5 · *Full-screen Ads can live here too…* | 44.53 s | 5.35 s | 5 | 0.09 s | `placa-5.png` |
| 6 · *And back. Fifty-eight seconds of advertising…* | 52.51 s | 7.34 s | 7 | 0.06 s | `placa-6.png` |

Los segundos son exactamente los que el ancla resuelve contra la señalización: el break
arranca en 14 s, así que 8 antes son 6, 2,5 antes son 11,5, y los avisos 2, 3 y 4
arrancan en 30, 46 y 54, con 1,5 de anticipo cada uno. Los medio segundo de más en
pantalla son los 40 ms de layout más los 320 ms de la disolvencia de salida, que el
muestreo cuenta adentro. **El programa avanza menos de 0,1 s mientras una placa está
arriba** —su referencia son los 5 a 17 s que avanza entre placa y placa—, que es
`video.pause()` haciendo lo suyo (ADR 0040).

La placa 1 la mide `arranque.py` y no `recorrido.py`: en la corrida larga el instrumento
recorrió la apertura antes para leer `--t`, el player cruzó el umbral en ese scroll y la
primera placa ya llevaba tres segundos arriba cuando empezó el muestreo. Por eso
`recorrido.json` dice 1.78 s ahí, y por eso su campo `con_player_abajo_del_pliegue`
muestra el recorrido corriendo: **es el orden del instrumento y no la página**, y es lo
que `arranque.py` mide bien sobre una carga limpia.

**El botón y el reinicio.**

| | qué dijo |
| --- | --- |
| rótulo durante todo el recorrido | `Skip the walkthrough`, un solo valor en las 742 muestras |
| al terminar | `Play the walkthrough again`, con `body[data-story] = done` (`al-terminar.png`) |
| el programa después | 54.54 s → 56.54 s en dos segundos de reloj: sigue solo |
| un clic en el botón | vuelve el programa a `currentTime` 0 y repite la primera placa (`reinicio.png`) |
| otro clic a mitad de recorrido | lo termina: `done`, sin placa, y el rótulo vuelve a ser el de reiniciar |

Y al terminar la página de abajo sigue entera: 4 fichas en la galería, 4 pliegues, los
cuatro cerrados.

## La sección 3 sigue leyendo en vivo

`seccion3.py`, salida en `seccion3.json`. El `START-DATE` del `<pre>` del tag se compara
contra el de `content/primary/con-daterange.m3u8` pedido por HTTP aparte, que es una
fuente independiente de la página:

```
START-DATE del .m3u8 : 2026-09-10T23:45:37.717-0300
START-DATE en pantalla: 2026-09-10T23:45:37.717-0300
```

Es el empaquetado del 2026-09-10 y no el de hoy porque la demo se sirvió sin `run.sh`
(abajo dice por qué), así que la playlist es la que quedó escrita esa jornada.

**La glosa dibuja 8 líneas para los 8 atributos que la línea trae** —`ID`, `CLASS`,
`START-DATE`, `X-ASSET-LIST`, `X-RESUME-OFFSET`, `X-SNAP`, `X-RESTRICT`,
`PLANNED-DURATION`— y la de `X-RESUME-OFFSET` dice que no significa nada en esta clase y
que es pregunta abierta para SVTA (ADR 0016).

**La marca en vivo, por instantes, con el caso que da lo contrario.** La tercera columna
es la línea de estado que `app.js` pinta de la misma llamada al contrato, que es una
segunda lectura del mismo hecho:

| `currentTime` | pliegue marcado | la línea de estado |
| --- | --- | --- |
| 5 s | *ninguno* | `the match, no ad` |
| 20 s | `Ad 1 · lowerThirdOverlay · 16 s · still image` | `ad on screen: lowerThirdOverlay · still image` |
| 35 s | `Ad 2 · squeezebackLShape · 16 s · video` | `ad on screen: squeezebackLShape · video` |
| 48 s | `Ad 3 · no layout block, played full frame · 8 s` | `ad on screen: linear · video · the match is underneath, covered` |
| 60 s | `Ad 4 · cornerOverlay · 24 s · video` | `ad on screen: cornerOverlay · video` |
| 76 s | `Ad 4 · cornerOverlay · 24 s · video` | `ad on screen: cornerOverlay · video` |
| 80 s | *ninguno* | `the match, no ad` |

Ningún pliegue se abrió solo en ninguna de las siete lecturas (ADR 0075).

## Los dos anchos

`capturas.py`, salida en `capturas.json` y las dos capturas de página entera.

| | `scrollWidth` / `clientWidth` | con el pliegue 2 abierto | galería | pliegues | figura |
| --- | --- | --- | --- | --- | --- |
| 400 × 780 | 400 / 400 | 400 / 400 | 4 fichas | 4, cerrados | 1, columnas apiladas |
| 1907 | 1907 / 1907 | 1907 / 1907 | 4 fichas | 4, cerrados | 1, dos columnas de 424 px |

Las cuatro secciones de abajo están en el orden del pedido —*Two ways to run an Ad*,
*The signalling class*, *The signalling, as it is served*, y los créditos como pie— y se
leen enteras en las dos capturas. Cero errores de consola en los dos anchos.

## Los dos controles, que son las mediciones puestas a dar rojo

Una medición que no puede dar distinto no mide nada. `controles.py`, salida en
`controles.json`:

**1 · La lectura en vivo.** La playlist se intercepta en la red y se le reescribe el
`START-DATE` a `2001-01-02T03:04:05.678-0300` antes de que llegue al player. El `<pre>`
de la página pasó a decir esa fecha. Si la sección leyera un tag pegado en el HTML
seguiría diciendo el de siempre.

**2 · El ancho.** Con el pliegue 2 abierto a 400 px se apaga en caliente la línea que lo
defiende:

| | `scrollWidth` | `clientWidth` |
| --- | --- | --- |
| con `.asset { min-width: 0 }` | 400 | 400 |
| **sin ella** | **471** | 400 |

Es el mismo 471 que midió la T-03, vuelto a provocar sobre el árbol de hoy
(`control-ancho-sin-guarda-400.png`).

## Los cinco instrumentos

| archivo | qué hace |
| --- | --- |
| `recorrido.py` | el recorrido guiado entero, muestreado cada 100 ms, con captura de cada placa |
| `arranque.py` | el umbral del viewport con sus dos referencias, y la primera placa cronometrada |
| `seccion3.py` | la lectura en vivo contra el `.m3u8` pedido aparte, la glosa, y la marca por instantes |
| `capturas.py` | los dos anchos, la página entera, y el estado con el pliegue más largo abierto |
| `controles.py` | los dos controles de arriba |

Los cinco necesitan `playwright` —en esta máquina, el del skill
`/home/nicolas/.claude/skills/playwright/.venv/bin/python`— y la demo servida.

## Cómo se sirvió la demo

`PORT=8094 node server.mjs demo/hydration-break`, y **no** `./run.sh hydration-break`,
por la misma razón que la T-01, la T-02 y la T-03: `run.sh` reconstruye `dist/` desde
`lib/` en cada arranque, y `lib/` lo está editando la fase 11. El `dist/` y la playlist
señalizada que se usaron son los que `run.sh` escribió el 2026-09-10. El server se apagó
al terminar, por su PID.

El árbol no se movió durante la medición: los `mtime` de `lib/`, `dist/`,
`demo/hydration-break/` y sus tests son los mismos antes y después, y `npm test` dio 165
en verde las dos veces, con media hora de distancia.

## Hallazgos

**H1 · La última placa dice 58 segundos de publicidad y son 64.** Se ve en pantalla en
`placa-6.png`: *"And back. Fifty-eight seconds of advertising in one stoppage…"*. El
reparto de `plate.json` es `[16, 16, 8, 24]`, que suma **64**, `paradaDura` es **64**, y
el tag que la propia página muestra una sección más abajo dice `PLANNED-DURATION=64`. La
glosa de ese atributo, escrita por la T-03, dice que ese número *"es la suma de la
DURATION de cada asset de la lista"*, así que la página se contradice a sí misma a dos
pantallas de distancia.

**No es una regresión de esta fase**: el texto está en `story/story.json` desde el commit
`e214693` del 2026-09-09, y los avisos suman 64 desde `8430cfa`. Es la frase con la que
cierra el recorrido guiado que se graba, así que el costo de dejarla es que se dice mal
en escenario.

**H2 · El README de la demo dice que el aviso lineal es de diez segundos y es de ocho.**
`demo/hydration-break/README.md`, sección *Run it*: *"generates the ten-second linear
spot with Vertex AI"*. `scripts/setup-content.sh` pide `"durationSeconds": 8`, el
asset-list declara `DURATION: 8`, y los `EXTINF` de `content/adLinear/index.m3u8` suman
8.0. Committeado y anterior a esta fase; la campaña de mutación conserva la rotura *"el
lineal vuelve a 10 s"*, que es de cuándo el valor era ése.

Los dos son de copia y de documentación, ninguno de los dos rompe una corrida, y ninguno
se arregló acá: arreglar dentro de la task que verifica es un arreglo que nadie revisó.
