# T-10 — `race.html`: los avisos primero y después la ventana de multi view

**La tercera página existe y corre de punta a punta con `./run.sh stage-pair`: cuatro avisos
no lineales sobre la carrera entre los segundos 6 y 48, ocho segundos de carrera limpia, y a
los 56 la ventana de multi view con las seis cámaras.** Medido en el navegador leyendo el
contrato: las dos clases hermanas conviven en una sola playlist y **nunca se solapan**, y el
control puesto a propósito abre un solapamiento de 16 s.

`npm test` pasa de **207 a 216** —los 9 del test nuevo— con 0 fallas, y `npm run check` sale
`EXIT=0`.

## 1. Qué quedó escrito

| archivo | qué es |
| --- | --- |
| `demo/stage-pair/race.html` | la página |
| `demo/stage-pair/js/race.js` | su módulo: el bloque del integrador, la línea del contrato, el recorrido y los saltos |
| `demo/stage-pair/scripts/senalizar-carrera.sh` | la señalización de la carrera: la playlist con sus cinco tags |
| `demo/stage-pair/scripts/escribir-asset-lists-carrera.mjs` | los cuatro asset-lists de aviso y el de la oferta, derivados de `stage.json` |
| `demo/stage-pair/test/verificar-carrera.py` | el instrumento de esta página, con sus controles y las capturas |
| `demo/stage-pair/css/player.css` | sección nueva al pie, `RACE.HTML` |
| `demo/stage-pair/test/signalled-run.test.js` | 9 pruebas más, sobre lo que el señalizador escribió |
| `demo/stage-pair/stage.json` | bloque `carrera`: `breaks`, `oferta` y `playlist` |
| `demo/stage-pair/scripts/senalizar-contenido.sh` | **una línea**, la que llama al señalizador de la carrera |

**Ese último es el único archivo de otra task que se tocó, y hubo que tocarlo.** `./run.sh`
llama a un solo script por demo —`senalizar-contenido.sh`— y `run.sh` está fuera del alcance de
la fase, así que el único gancho para señalizar una tercera página es ese archivo. Lo que se
agregó es una llamada y nada de su lógica, **condicionada a que la señalización vaya a la
carpeta de la demo**: el test de la T-06 le pasa `SIGNALLING` a un temporal y cuenta los
archivos que salieron, así que cinco archivos más ahí lo habrían puesto rojo por una causa que
no es la suya. Con la condición, las 14 pruebas de la T-06 siguen verdes sin cambiar una línea.

## 2. El recorrido, y de dónde sale cada número

Todo vive en `stage.json`, bloque `carrera` (ADR 0044). Ni un segundo está tipeado en la página
ni en el señalizador.

```
  aviso R1  t=  6s a  12s  (6s)  lowerThirdOverlay      ZUMBRA
  aviso R2  t= 18s a  24s  (6s)  squeezebackLShape      KOVRIN
  aviso R3  t= 30s a  36s  (6s)  lowerThirdOverlay      KETRAVA
  aviso R4  t= 42s a  48s  (6s)  squeezebackLShape      ZUMBRA
  la ventana   t=56s a 120s  (64s)  multi view   signalling/asset-list-race-offer.json
      World feed               el contenido principal
      CALDRIX, car cam         /content/race/caldrix/index.m3u8
      MARVOK, car cam          /content/race/marvok/index.m3u8
      NOCTEV, car cam          /content/race/noctev/index.m3u8
      RUNTAK, car cam          /content/race/runtak/index.m3u8
      PENTAV, car cam          /content/race/pentav/index.m3u8
      QUENTRA, car cam         /content/race/quentra/index.m3u8
```

**Las cuatro piezas son exactamente las cuatro que `assets.piezas` marcaba con uso `race`.** El
par usa las tres 16:9 como aviso lineal, la L de KETRAVA y el banner de KOVRIN; las cuatro que
sobraban son las de esta página. Así **las nueve piezas autoradas se ven en la demo** y ninguna
queda sin usar. El orden alterna la forma —banner, L, banner, L— y no repite campaña en breaks
contiguos.

**Duran 6 s y no los 12 del par, y el número sale del creativo y no del reloj**: los nueve
están autorados con un bucle de 3 s y un anillo de 6 s, así que 6 s son dos bucles exactos y
una vuelta entera del anillo, y el aviso abre y cierra idéntico. Con 12 s los cuatro se
comerían 48 de los 56 segundos previos a la ventana y la carrera dejaría de verse, que es lo
contrario de lo que un aviso no lineal afirma.

**`ofertaEn` no se movió.** Es el instante desde el que la T-09 capturó las seis cámaras, así
que moverlo obliga a recapturarlas; los cuatro avisos se acomodaron adentro de los 56 s que ya
había.

**Esta página no lleva el control de decodificadores** —es de la página del par— así que no hay
escalón magro que servir: los cuatro avisos son `application/vnd.apple.mpegurl`.

## 3. El orden es el argumento, medido y con el control en rojo

Se lee `programRanges()` del contrato, que es lo que el player resolvió de la playlist y no lo
que `stage.json` declara, y se compara el final del último aviso contra el comienzo de la
ventana.

```
$ ./demo/stage-pair/test/verificar-carrera.py --puerto 8099 --que orden

== 1. EL ORDEN: LOS AVISOS PRIMERO, LA VENTANA DESPUÉS ==

  los rangos que el player resolvió de la playlist
      RACE-R1-CONCURRENT       concurrent     6.0 s ->   12.0 s
      RACE-R2-CONCURRENT       concurrent    18.0 s ->   24.0 s
      RACE-R3-CONCURRENT       concurrent    30.0 s ->   36.0 s
      RACE-R4-CONCURRENT       concurrent    42.0 s ->   48.0 s
      RACE-MULTIVIEW           multiview     56.0 s ->  120.0 s
    son los cuatro avisos más la ventana                     VERDE   4 concurrent + 1 multiview
    ningún aviso se solapa con la ventana                    VERDE   hueco 8.0 s entre el último aviso y la ventana

  EL CONTROL — CONTROL_AVISO_EN_VENTANA=1 corre el último aviso adentro
      RACE-R1-CONCURRENT       concurrent     6.0 s ->   12.0 s
      RACE-R2-CONCURRENT       concurrent    18.0 s ->   24.0 s
      RACE-R3-CONCURRENT       concurrent    30.0 s ->   36.0 s
      RACE-MULTIVIEW           multiview     56.0 s ->  120.0 s
      RACE-R4-CONCURRENT       concurrent    66.0 s ->   72.0 s
    CONTROL: la misma lectura ve el solapamiento             VERDE   hueco -16.0 s, o sea el aviso cae DENTRO de la ventana

VERDE: las mediciones dieron lo esperado y los controles también.
```

**Los 16 segundos del control son lo que hace que los 8 de arriba signifiquen algo**: el
instrumento sabe ver un solapamiento, así que cuando dice que no lo hay, no lo hay. La palanca
—`CONTROL_AVISO_EN_VENTANA`— vive en el generador y no en el instrumento, que es lo mismo que
la T-06 hizo con la duración del break concurrente.

**Y es también la separación que David pidió**, entre la señalización de publicidad y la
extensión de Qualabs, hecha visible en el tiempo y no sólo en el árbol de archivos: la playlist
lleva las dos clases hermanas del ADR 0063 y sus rangos no se intercalan.

## 4. La ventana y el catálogo

```
$ ./demo/stage-pair/test/verificar-carrera.py --puerto 8099 --que ventana

== 2. LA VENTANA ABRE DONDE stage.json DICE, Y OFRECE LO QUE HAY EMPAQUETADO ==

      contrato   56.0 s -> 120.0 s
      stage.json 56 s -> 120 s
    la ventana abre en carrera.ofertaEn                      VERDE
    y dura carrera.ofertaDura                                VERDE

      cámaras empaquetadas en disco   6
      caldrix    CALDRIX, car cam     /content/race/caldrix/index.m3u8
      marvok     MARVOK, car cam      /content/race/marvok/index.m3u8
      noctev     NOCTEV, car cam      /content/race/noctev/index.m3u8
      runtak     RUNTAK, car cam      /content/race/runtak/index.m3u8
      pentav     PENTAV, car cam      /content/race/pentav/index.m3u8
      quentra    QUENTRA, car cam     /content/race/quentra/index.m3u8
    el catálogo tiene una entrada por cámara empaquetada     VERDE   6 de 6
    con el id y el nombre que stage.json les da              VERDE
    y las filas del selector son el programa más las cámaras VERDE
    el catálogo es más largo que el tope de 4 de la grilla   VERDE

  EL CONTROL — la misma lectura fuera de la ventana
    CONTROL: no hay oferta un segundo antes de abrir         VERDE   t=55 s
    CONTROL: no hay oferta dentro del primer aviso           VERDE   t=7 s

VERDE: las mediciones dieron lo esperado y los controles también.
```

**El catálogo se deriva de lo que está empaquetado**, como en `demo/race-multiview/`: agregar
una cámara es empaquetarla y no editar una lista. El test lo prueba corriendo el mismo script
sobre un árbol con una cámara y sobre uno con seis.

**El control es que la ventana no esté abierta cuando no está abierta.** Sin él, una lectura
que dijera "hay oferta" en cualquier segundo pasaría la medición de arriba sin medir nada.

## 5. Elegir una cámara y agrandarla, por la chrome de la librería

Se toca lo que toca una persona: el botón de la barra, las filas del selector y el botón de la
caja. La página no agregó ningún control propio sobre la imagen.

```
$ ./demo/stage-pair/test/verificar-carrera.py --puerto 8099 --que grilla

== 3. ELEGIR CÁMARAS Y AGRANDAR UNA, POR LA CHROME DE LA LIBRERÍA ==
    CONTROL: con nada tildado hay un solo elemento de video  VERDE   1
    tildada CALDRIX, car cam                                 VERDE   2 elementos de video (el programa y 1 cámara/s)
    tildada MARVOK, car cam                                  VERDE   3 elementos de video (el programa y 2 cámara/s)
    tildada NOCTEV, car cam                                  VERDE   4 elementos de video (el programa y 3 cámara/s)
    con la grilla llena, la fila de RUNTAK, car cam queda bloqueada VERDE   el tope es de la grilla (4 cajas, ADR 0066)
    y el catálogo sigue ofreciendo todas                     VERDE   el tope nunca es de la oferta

      cajas en pantalla   ['primaryContent', 'caldrix', 'marvok', 'noctev']
    las cajas son el programa y las cámaras tildadas         VERDE
      la línea dice      t=64.0s · multi view · 4 boxes · CALDRIX, car cam at full frame · 4 video elements in the player, 4 decoding
    agrandada, la línea la nombra a cuadro entero            VERDE
    y desagrandada vuelve la grilla                          VERDE   t=66.2s · multi view · 4 boxes · 4 video elements in the player, 4 decoding

VERDE: las mediciones dieron lo esperado y los controles también.
```

**El control es la lectura con nada tildado: un elemento.** Si el conteo diera lo mismo con
tres cámaras arriba, lo que se está contando no son decodificadores.

**El pico real de elementos de video de esta página es CUATRO y no cinco.** El tope del
ADR 0066 es de cuatro CAJAS y el programa es una de ellas, así que el máximo son tres cámaras
más el primario. El número no se tipeó ni en el test ni en el instrumento: los dos leen
`MAX_BOXES` de `lib/signalling.js`.

## 6. El test de la demo

Nueve pruebas nuevas sobre lo que el señalizador escribió de verdad, con el árbol de cámaras
pasado por entorno para que corran sin ffmpeg y sin un byte de video:

```
✔ la carrera sale con un tag por aviso más el de la ventana, y las dos clases son hermanas
✔ EL ORDEN ES EL ARGUMENTO: los cuatro avisos terminan antes de que la ventana abra
✔ el chequeo del orden ve un aviso corrido adentro de la ventana
✔ la ventana abre en carrera.ofertaEn y dura lo que su asset-list declara
✔ el tag de la ventana no lleva X-RESTRICT y los de los avisos sí
✔ la oferta anuncia un catálogo y no un layout
✔ el catálogo son las cámaras EMPAQUETADAS, con el nombre que stage.json les da
✔ cada aviso de la carrera es la pieza de su campaña, en la forma que stage.json declara
✔ la hoja de la carrera sale de los archivos y no de sí misma
ℹ tests 23   pass 23   fail 0        (las 14 de la T-06 más estas 9)
```

**Y se los vio rojos, en dos aserciones distintas y con dos defectos plantados distintos.**

Un offset del último aviso corrido adentro de la ventana, en `stage.json`:

```
✖ EL ORDEN ES EL ARGUMENTO: los cuatro avisos terminan antes de que la ventana abra
  AssertionError: RACE-R4-CONCURRENT termina en 66s y la ventana abre en 56s
ℹ tests 23   pass 22   fail 1
```

Un `viewport` plantado en el generador de la carrera:

```
✖ cada aviso de la carrera es la pieza de su campaña, en la forma que stage.json declara
  AssertionError: Expected values to be strictly equal:
    actual:   '10 10 10 10',
    expected: '70 6.25 12.5 6.25',
ℹ tests 23   pass 22   fail 1
```

Los dos mensajes **nombran el valor que se movió**, que es lo que hace que el rojo sirva para
arreglarlo y no sólo para saber que algo pasó. Sacados los plantados, las 23 vuelven a verde.

## 7. Las capturas

A 1907 de ancho y a 400×780, que son los dos anchos contra los que este proyecto mide. La
secuencia entera, en el orden en que se ve:

| | |
| --- | --- |
| [`race-1907-1-la-carrera-sola.png`](race-1907-1-la-carrera-sola.png) | el programa, nada señalizado |
| [`race-1907-2-aviso-1-r1-zumbra-banner.png`](race-1907-2-aviso-1-r1-zumbra-banner.png) | ZUMBRA en el banner, sobre la carrera corriendo |
| [`race-1907-2-aviso-2-r2-kovrin-backplate.png`](race-1907-2-aviso-2-r2-kovrin-backplate.png) | KOVRIN en la L, con el programa encogido arriba a la derecha |
| [`race-1907-2-aviso-3-r3-ketrava-banner.png`](race-1907-2-aviso-3-r3-ketrava-banner.png) | KETRAVA en el banner |
| [`race-1907-2-aviso-4-r4-zumbra-backplate.png`](race-1907-2-aviso-4-r4-zumbra-backplate.png) | ZUMBRA en la L, sobre un plano general del circuito |
| [`race-1907-3-la-ventana-abierta.png`](race-1907-3-la-ventana-abierta.png) | la ventana abrió y no hay nada levantado |
| [`race-1907-4-el-catalogo.png`](race-1907-4-el-catalogo.png) | el selector de la librería, con las seis cámaras por su nombre |
| [`race-1907-5-la-grilla-llena.png`](race-1907-5-la-grilla-llena.png) | la grilla de cuatro cajas |
| [`race-1907-6-una-camara-a-cuadro-entero.png`](race-1907-6-una-camara-a-cuadro-entero.png) | CALDRIX agrandada |

Las mismas nueve a 400 de ancho, con el prefijo `race-400-`.

**La transición se entiende en una captura sola**, que era el criterio: el anillo de la imagen
es ámbar mientras hay un aviso y teal mientras la ventana está abierta, la línea de abajo dice
qué clase está activa, y la columna de la derecha marca en qué fila del recorrido está el
reloj. Alguien que mire un cuadro suelto de la grabación sabe si está viendo publicidad o la
extensión sin que nadie se lo explique.

**El panel del selector recortado a ancho de teléfono** es el defecto conocido y cerrado sin
cambio, porque la demo es 16:9. No reapareció: a 400 la página cae a una columna y la grilla
entra entera adentro de la caja 16:9.

## 8. Lo que esta task NO hizo

- **No tocó `lib/`** —`git diff --stat -- lib/` vacío— ni el contrato, ni ninguna de las cuatro
  demos publicadas, ni `index.html`, `inspect.html`, `js/app.js`, `js/inspect.js`, `run.sh`,
  `server.mjs` o `package.json`.
- **No tocó la señalización del par** salvo la línea de llamada de la sección 1, que es la única
  forma de que `./run.sh stage-pair` señalice la tercera página sin entrar a `run.sh`.
- **No tocó `verificar-creativo.sh`**, que es de una task cerrada y tiene el defecto del
  `-ss 0` que la T-09 dejó escrito. Esta task no compara cuadros de video contra cuadros de
  navegador, así que no lo necesitó.
- **No agregó audio a nada** y la página no promete audio por cámara.
- **No escribió el `CREDITS.md` ni el README** de la demo, que son de la T-11.
- **No commiteó ni publicó nada.**
- **No midió nada sobre iOS ni sobre Safari.** Todo se midió en el Chrome real del sistema.

## 9. Lo que apareció y es de otro

- **La fase afirma cinco elementos de video a la vez en `race.html` y son cuatro.** Está en el
  R13 del `PHASE.md` (*"cuatro cámaras más el primario"*), en la sección de `DESIGN.md` sobre
  las cámaras, y en el comentario `carrera._fps` de `stage.json` que escribió la T-09. El tope
  del ADR 0066 es de cuatro **cajas** y el programa es una de ellas, así que el máximo son tres
  cámaras más el primario: medido arriba, y la fila de la cuarta cámara queda deshabilitada. No
  cambia ninguna decisión —el sobre medido en la fase 01 era de cinco elementos y el pico real
  está por debajo— pero los tres textos afirman un número que la librería no permite. No se
  corrigieron acá: son de otras tasks.
