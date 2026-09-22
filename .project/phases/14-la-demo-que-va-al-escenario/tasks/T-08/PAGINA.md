# T-08 — `inspect.html`: el player solo, con lo que hay que leer en cámara

**La segunda página existe y corre.** Un solo player —el nuestro— y al lado las tres movidas
del intercambio en el orden en que pasan: **lo que dijo la playlist**, los dos `EXT-X-DATERANGE`
del break sobre el mismo `START-DATE`; **lo que pidió el cliente**, la URL que salió con
`qa-decoder-count` picado adentro; y **lo que volvió**, el cuerpo de esa misma URL, verbatim.

Ninguna de las tres está escrita en la página: se leen de la playlist que el player está
tocando, del *performance timeline* y de la URL que ahí se leyó. **Eso está medido moviendo la
fuente y viendo moverse la pantalla**, que es la única forma de distinguir una lectura de una
transcripción.

`npm test` sigue en **207/207** y `npm run check` sale **`EXIT=0`**, ahora con
`demo/stage-pair/css/player.css` adentro del corte del ADR 0003 —**visto en rojo**.

## 1. Qué quedó escrito

| archivo | qué es |
| --- | --- |
| `demo/stage-pair/inspect.html` | la página: el switch, el player solo y las tres tarjetas |
| `demo/stage-pair/js/inspect.js` | el bloque cercado del integrador, la lectura de las tres fuentes y el switch |
| `demo/stage-pair/css/player.css` | **+1 sección al final**, `INSPECT.HTML`, en la misma hoja de las tres páginas |
| `demo/stage-pair/test/verificar-inspect.py` | las dos mediciones con sus controles, y las capturas |
| `scripts/verificar-cortes.mjs` | **+1 archivo** en la lista del corte del ADR 0003: la hoja de esta demo |

Nada más se tocó: `git status --porcelain` sobre `lib/`, `docs/`, las cuatro demos publicadas,
`run.sh`, `server.mjs`, `package.json` y el `README.md` de la raíz sale **vacío**.

## 2. Las capturas

A los dos anchos contra los que este proyecto mide, todas con el aviso **en pantalla**.

| | |
| --- | --- |
| [`inspect-1907-paso-2-break-a.png`](inspect-1907-paso-2-break-a.png) | side by side, el aviso en video, `?qa-decoder-count=2` |
| [`inspect-1907-paso-1-break-a.png`](inspect-1907-paso-1-break-a.png) | **el mismo break**, el mismo dibujo, `image/svg+xml`, `?qa-decoder-count=1` |
| [`inspect-1907-paso-not-declared-break-a.png`](inspect-1907-paso-not-declared-break-a.png) | el control negativo: la URL sale sin el parámetro, y se lee que sale sin él |
| [`…break-b.png`](inspect-1907-paso-1-break-b.png) · [`…`](inspect-1907-paso-2-break-b.png) · [`…`](inspect-1907-paso-not-declared-break-b.png) | la L de KETRAVA, en los tres escalones |
| [`…break-c.png`](inspect-1907-paso-1-break-c.png) · [`…`](inspect-1907-paso-2-break-c.png) · [`…`](inspect-1907-paso-not-declared-break-c.png) | el banner de KOVRIN, en los tres escalones |
| [`inspect-400-paso-1-break-a.png`](inspect-400-paso-1-break-a.png) · [`…`](inspect-400-paso-2-break-a.png) · [`…`](inspect-400-paso-not-declared-break-a.png) | los tres escalones a 400 × 780, en una columna |

## 3. Lo que la hace distinta de `index.html`, que es todo lo que se sacó

David abre el network tab sobre **esta** y no sobre el par: con dos players la mitad de lo que
se ve es ruido para eso. Así que se fue el pane de fábrica y con él todo lo que existía por ser
dos —el segundo player, el arbitraje de un solo audio, el objetivo que los dos panes pudieran
alcanzar—, y lo que queda es corto.

**Y está dimensionada para una sala y no para un escritorio.** La URL del pedido es el tipo más
grande de la página después de los títulos, porque es la línea que alguien va a leer en voz alta
señalando; el número de cada tarjeta es un disco y no un `1.` delante de una frase, porque un
dígito adentro de un anillo sigue siendo un dígito a ocho metros; y hay **un solo acento por
tarjeta** —la clase, el parámetro, el cuerpo—, porque un segundo acento le saca el señalamiento
al primero.

Dos cosas que no son decoración:

- **El rango que este cliente se quedó está marcado por lo que el cliente hizo, no por su
  `CLASS`.** Se marca porque **pidió la lista a la que ese rango apunta**, y la evidencia es la
  petición que la tarjeta 2 está mostrando una tarjeta más abajo. Antes de que las peticiones
  estén, los dos rangos se dibujan sin marca en lugar de adivinar.
- **Un salto es una búsqueda y no un rearmado**, que es lo único que esta página hace distinto
  del par. Allá el rearmado existía por el *otro* pane, cuya escritura sobre el reloj del
  programa adentro de un break se acepta y se pierde; acá no hay otro pane y el nuestro no tiene
  esa restricción porque nunca se reemplazó nada (ADR 0016). Lo que sí sobrevive de aquella
  medición es **la relectura**: se escribe, se lee un cuarto de segundo después, y se reintenta
  si no entró.

El escalón sí rearma, y por la razón de siempre: `decoderCount` se lee una sola vez, al crear la
señalización.

## 4. Las dos mediciones, con sus controles

`demo/stage-pair/test/verificar-inspect.py` levanta su propio `server.mjs` y lo baja por el PID
que guardó.

### 4.1 Lo que la página muestra está leído, no transcripto

```
$ ./demo/stage-pair/test/verificar-inspect.py --puerto 8097 --que lectura
server PID 2788297 en el puerto 8097

== 1. LO QUE LA PÁGINA MUESTRA ESTÁ LEÍDO, NO TRANSCRIPTO ==

  break A, escalón «not declared» (playlist rica)
    los rangos de la pantalla == los del archivo         VERDE   2 rango(s)
      #EXT-X-DATERANGE:ID="AD-A-LINEAR",CLASS="com.apple.hls.interstitial",START-DATE="2026-09-22T04:40:47.832-0300",X-ASSET
      #EXT-X-DATERANGE:ID="AD-A-CONCURRENT",CLASS="com.qualabs.hls.concurrentInterstitial",START-DATE="2026-09-22T04:40:47.8
    el pedido dibujado nombra el asset-list del break    VERDE   /signalling/asset-list-break-a-rica.json — no qa-decoder-count on this request
    la respuesta dibujada == los bytes del archivo       VERDE   834 car.
    CONTROL del comparador: contra el asset-list de otro break VERDE   tiene que dar DISTINTO

  EL CONTROL — CONTROL_DURACION_CONCURRENTE=24 reescribe la fuente
      PLANNED-DURATION en pantalla, antes  ['12', '12']
      PLANNED-DURATION en pantalla, ahora  ['12', '24']
    el tag de la pantalla cambió                         VERDE
    y es el de la playlist nueva, línea por línea        VERDE
    el JSON de la pantalla cambió                        VERDE
    y es el archivo nuevo, byte por byte                 VERDE   duration: 24

server 2788297 bajado

VERDE: las mediciones dieron lo esperado y los controles también.
```

**Por qué el control es ése y no el `START-DATE`.** El primer intento usó el `START-DATE`: se
vuelve a señalar, se mueve, y la pantalla tiene que moverse con él. **Dio rojo y el rojo era
mío**: el `START-DATE` se resuelve contra el `EXT-X-PROGRAM-DATE-TIME` del empaquetado, así que
es función pura de ese empaquetado y volver a señalar no lo mueve —sólo lo mueve volver a
empaquetar, que son minutos de `ffmpeg`—.

```
  CONTROL 1 — se vuelve a señalar el contenido (el START-DATE se mueve)
      antes    2026-09-22T04:40:47.832-0300
      ahora    2026-09-22T04:40:47.832-0300
    el START-DATE de la pantalla cambió                  ROJO
```

El control que quedó mueve **las dos** fuentes de una vez y por eso es mejor:
`CONTROL_DURACION_CONCURRENTE=24` reescribe los asset-lists concurrentes, y el tag toma su
`PLANNED-DURATION` de la declaración de ese mismo archivo. Una página que transcribiera pasaría
las tres comparaciones contra el disco el día que se escribió, y fallaría ésta.

**Y el comparador se probó contra algo que sabe que está distinto**: la misma comparación contra
el asset-list de otro break tiene que dar DISTINTO, y da.

### 4.2 El parámetro se lee en cámara, y es el que salió por la red

La T-07 ya midió que `qa-decoder-count` viaja. Lo que esta página agrega es que **se lee**, así
que se compara lo que la tarjeta 2 dibuja contra lo que el navegador pidió.

```
$ ./demo/stage-pair/test/verificar-inspect.py --puerto 8097 --que parametro
server PID 2789529 en el puerto 8097

== 2. EL PARÁMETRO SE LEE EN CÁMARA, Y ES EL QUE SALIÓ POR LA RED ==

  posición «not declared»  ->  playlist rica
      pantalla  /signalling/asset-list-break-a-rica.json — no qa-decoder-count on this request
      red       /signalling/asset-list-break-a-rica.json
    CONTROL NEGATIVO: la pantalla no lleva el parámetro  VERDE
    CONTROL NEGATIVO: la red tampoco                     VERDE

  posición «1»  ->  playlist magra
      pantalla  /signalling/asset-list-break-a-magra.json?qa-decoder-count=1
      red       /signalling/asset-list-break-a-magra.json?qa-decoder-count=1
    la pantalla dibuja qa-decoder-count=1                VERDE
    y la red llevó lo mismo                              VERDE

  posición «2»  ->  playlist rica
      pantalla  /signalling/asset-list-break-a-rica.json?qa-decoder-count=2
      red       /signalling/asset-list-break-a-rica.json?qa-decoder-count=2
    la pantalla dibuja qa-decoder-count=2                VERDE
    y la red llevó lo mismo                              VERDE

server 2789529 bajado

VERDE: las mediciones dieron lo esperado y los controles también.
```

El control negativo es la posición "sin declarar", y el contra-control son las otras dos: un
lector roto que nunca encontrara nada daría verde en la primera y rojo en las otras dos.

### 4.3 Lo que se arregló por mirar las capturas, que es la verificación que esta página pide

Dos defectos que ningún `getComputedStyle` habría reportado, los dos encontrados mirando la
imagen:

- **El primer juego de capturas salió con el cuadro en negro y la línea de estado diciendo
  `0.0s` mientras la barra marcaba 0:22.** Que el aviso esté *resuelto* no alcanza para
  fotografiar: hay que esperar a que el elemento haya dibujado un cuadro después de la búsqueda.
  El instrumento ahora espera a que esté reproduciendo de verdad. **Y el segundo defecto era de
  la página**: la línea de estado se pintaba sólo en `timeupdate`, que no dispara sobre un
  elemento pausado o buscando, así que después de un salto seguía reportando el segundo
  anterior. Ahora se pinta también en `seeked`. Una línea debajo del cuadro que no coincide con
  el cuadro es peor que no tener línea, y en un proyector es lo que se lee en voz alta.
- **El anillo que el pane crece mientras hay un aviso cortaba el texto de arriba**, porque se
  dibuja fuera del cuadro y acá no había una tercera línea de etiqueta que dejara lugar, como sí
  hay en `index.html`.

## 5. El corte de costuras cubriendo la hoja, visto en rojo

`demo/stage-pair/css/player.css` quedó fuera del chequeo: la hoja se creó después de la T-06 y
la T-07 no la tocó para no pisar trabajo ajeno. Ahora está en la lista del corte del ADR 0003,
con el porqué escrito en el script —**una hoja es un consumidor del contrato y es el que más
fácil se olvida, porque no es código**: una regla nombrada por un tag, una clase `.daterange`, un
comentario que explica un color por el lugar del que vino el break.

Verde con la hoja adentro:

```
$ npm run check
## ADR 0003 -- the rendering side does not know one word of the transport
   /usr/bin/grep -n -i -E "hls|daterange|…" lib/renderer.js lib/controls.js lib/multiview.js \
     demo/compatibility-pair/js/contract-trace.js demo/compatibility-pair/css/player.css \
     demo/stage-pair/js/contract-trace.js demo/stage-pair/css/player.css

   GREEN: 3 occurrence(s), all of them on the accepted list.
EXIT=0
```

Y **rojo con un término plantado en esa hoja**, que es lo que prueba que la línea nueva mide algo:

```
$ printf '\n/* PLANTADO: .daterange { color: red; } */\n' >> demo/stage-pair/css/player.css
$ npm run check

   RED: 1 occurrence(s) that are not on the accepted list.

     demo/stage-pair/css/player.css:446
       /* PLANTADO: .daterange { color: red; } */
EXIT=1
```

Sacado el plantado, `grep -c PLANTADO` da 0 y vuelve a `EXIT=0`.

## 6. La no-regresión

```
$ npm test
ℹ tests 207
ℹ pass 207
ℹ fail 0

$ npm run check
verificar-cortes: both seams hold.
EXIT=0
```

## 7. Lo que esta task NO hizo

- **No tocó `lib/`**, ni el contrato, ni ninguna de las cuatro demos publicadas, ni
  `index.html`, ni `js/app.js`, ni `js/stock-player.js`, ni la señalización de la T-06.
- **No agregó CSS duplicado**: la sección nueva vive al final de la hoja de las tres páginas,
  bajo el encabezado que nombra la página, que es donde su propia cabecera dice que va.
- **No midió nada sobre iOS ni sobre Safari.** Todo se midió en el Chrome real del sistema.
- **No escribió `CREDITS.md` ni el `README.md` de la demo**, que son de la T-11.
- **No commiteó, no pusheó y no publicó nada a GCS.**
