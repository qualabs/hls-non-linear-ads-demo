# La señalización, el asset-list y la demo corriendo

Cero generaciones de Veo, cero dólares. La demo corre de punta a punta: la ventana abre en el
segundo 28,000 de reproducción, el selector lista el programa y la cámara de CALDRIX, se sube,
se agranda —y ahí el audio se pasa entero a la cámara—, se baja y se sale. `npm test` da **193
pruebas, 193 pasan**, con las nueve nuevas adentro.

El veredicto en una línea: **el software lee lo que esta fase produjo, y el tag y el anuncio
hablado caen donde tienen que caer porque el número lo declara `race.json` una sola vez: la voz
se calla en 27,640 s y la ventana abre en 28,000 s, 0,360 s después.**

---

## 1. El tag y el audio caen en el mismo segundo, medidos por separado

Es el punto que Nicolás marcó —*"tiene que caer donde la señalización abre la ventana, no
cerca"*— y es el R4 de la fase. Las dos mediciones son de instrumentos distintos sobre
artefactos distintos, y el único punto en común es `race.json`:

| | qué se midió | sobre qué | resultado |
| --- | --- | --- | ---: |
| el audio | el último instante en que el relato está por encima de −50 dB | `relato.wav`, la mezcla rendida | **27,640 s** |
| el tag | `START-DATE` − `EXT-X-PROGRAM-DATE-TIME` | `content/primary/con-daterange.m3u8`, la playlist servida | **28,000 s** |
| | | **la voz entra antes que el tag, por** | **0,360 s** |

Que la voz entre antes y no encima es lo que la demo del partido dejó medido: *"primero se oye,
después se ve"*. Verbatim en
[`salidas/el-tag-contra-el-audio.txt`](salidas/el-tag-contra-el-audio.txt) y
[`salidas/el-anuncio-contra-la-ventana.txt`](salidas/el-anuncio-contra-la-ventana.txt).

**Y se vio despegarse.** Moviendo `ofertaEn` de 28 a 31 en `race.json`, el tag lo sigue solo y
el audio no puede: `verificar-anuncio.mjs` pasa de VERDE a **ROJO** con el mensaje exacto del
defecto —*"fin hablado 27.640 s, ventana [30.5 ; 31]"*—, que es "cerca" en lugar de "en". Eso es
lo que prueba que el anclaje existe y no es una coincidencia de dos números que se escribieron
iguales.

## 2. La demo corriendo

```
cd /home/nicolas/Develop/ai_workspace/cto-assistant/projects/hls-non-linear-ads-demo
PORT=8099 ./run.sh race-multiview
```

**8099 y no 8080, 8081 ni 8082**, que son de Nicolás. `run.sh` no se tocó: toma el nombre de la
demo como argumento y usa su carpeta como raíz de documentos.

| | qué se ve | lo que reporta el contrato |
| --- | --- | --- |
| **t=0 a 28** | la carrera, el programa cortando entre autos | `the programme, nothing signalled` · 1 elemento de video, 1 decodificando |
| **t=28** | [el popup **Multi view available**](capturas/a-abre-la-ventana.jpg) y el punto verde en el botón del selector | `multi view offered · 1 feed(s) · nothing raised` |
| **se sube la cámara** | [dos cajas: el programa y CALDRIX a bordo](capturas/2-camara-arriba.jpg) | `multi view · 2 boxes` · **2 elementos de video, 2 decodificando** |
| **se agranda** | [CALDRIX a cuadro entero, con la marca del foco](capturas/3-agrandada.jpg) | `multi view · 2 boxes · CALDRIX, on-board at full frame` |
| **se sale** | [vuelve el programa solo](capturas/4-salida.jpg) | `multi view offered · 1 feed(s) · nothing raised` · 1 elemento, 1 decodificando |

**El selector dice lo que tiene que decir**: `World feed` con la etiqueta *always on* y sin
casillero, y `CALDRIX, on-board` con el suyo. Los dos nombres salen de `race.json`.

**El beat de audio de esta demo, medido y no mirado.** Agrandar la cámara es foco exclusivo
(ADR 0026), y lo que eso hace se lee en los dos elementos de video del DOM:

| | el programa | la cámara |
| --- | ---: | ---: |
| con las dos cajas arriba | `volume: 1` | `volume: 0` |
| con la cámara agrandada | **`volume: 0`** | **`volume: 1`** |

O sea: agrandar la cámara **calla la transmisión y deja al espectador adentro del auto**. Las
dos pistas están empaquetadas al mismo nivel —−21,9 y −22,6 LUFS medidos sobre un segmento de
cada una—, así que el cambio es de contenido y no de volumen.

**Lo que esta medición NO prueba**, y hay que decirlo: la captura corre headless y con el audio
del browser apagado, así que lo que se midió es el reparto de volumen entre los dos elementos,
que es el mecanismo. Que suene, suena cuando alguien levanta el mute con el control que dibuja
la librería, y eso lo tiene que hacer una persona.

**Un 404 en la corrida y es el favicon**, que lo trae la T-09 con `brand/`. Ningún otro: el
asset-list, la playlist de la cámara y los segmentos responden 200.

## 3. El asset-list se genera, y es lo único que esta demo hace distinto del molde

`demo/multiview-offer/` lleva sus asset-lists escritos a mano, y ahí está bien: sus vistas son
tramos de películas que no tienen otra fuente. Acá la fuente existe y es `race.json`, así que la
lista se deriva. Es el ADR 0044 con otra cara: **el nombre de la fila del selector es lo único
que hace que elegir una cámara signifique algo, y escrito a mano viviría en dos archivos.**

Sale en la forma del ADR 0064 y sin un campo de más: `type: "offer"` en el bloque, un item con
`type: "multiViewOffer"`, `start`, `duration`, `primaryName` y `views[]` con `id`, `name`, `type`
y `uri`. **Sin `viewport`, sin `zDepth` y sin `volume`.** El `URI` de nivel superior lleva el
`uri` de la primera vista, que es el repliegue del ADR 0019.

**Con una vista, que es lo que hay.** La grilla es de dos cajas y el mecanismo se ejercita
entero. La etapa 3 deja cinco cámaras más, `preparar-contenido.sh` las empaqueta y el catálogo
pasa de una a seis **sin que nadie edite un script ni una lista**; la suite lo corre en los dos
extremos, con una cámara y con las seis.

Está gitignoreado, por el mismo argumento con el que lo están `dist/` y la playlist señalizada:
se arma en cada arranque, así que una copia en git sólo podría ser una vieja.

## 4. El test, y los tres rojos que se vieron

`test/signalled-run.test.js`, con el molde del de la fase 11: corre **este** script sobre una
playlist mínima de nueve líneas con `SRC`/`OUT`, más un árbol de contenido de una playlist vacía
con `CONTENT`/`LISTA`, y cuenta lo que salió **de verdad**. No necesita ffmpeg ni los 120 MB de
video, así que corre en `npm test` sobre un clon limpio. La clase se importa de
`lib/signalling.js` y no se escribe, para que no se puedan desincronizar.

**Nueve pruebas, y las tres roturas que la task pedía ver:**

| se rompió | qué se puso rojo |
| --- | --- |
| **el segundo del tag**: `OFERTA_EN=31` tipeado en el script en lugar de leerlo de `race.json` | *the window opens at the second race.json declares* y *the cue sheet prints the seconds of the window* |
| **el nombre de una vista**: `name: "Camera 1"` tipeado en el generador del asset-list | *the catalogue is the cameras that are packaged, named as race.json names them* y la hoja de señales |
| **el largo de un segmento**: playlist recortada, y un `#EXTINF` estirado a 2,500 | los dos controles de `verificar-largos.mjs`, que es la T-06 |

Verbatim en [`salidas/los-controles-en-rojo.txt`](salidas/los-controles-en-rojo.txt), con el
`md5sum -c` al final que muestra que los dos archivos volvieron a como estaban.

**Y una rotura que se probó primero y salió VERDE, que es la que enseña algo.** Cambiar
`ofertaEn` en `race.json` no pone rojo el test, y está bien: el test compara la salida del script
contra `race.json`, así que mover la declaración mueve las dos puntas a la vez. Eso es el diseño
funcionando, no un agujero — lo que el test tiene que atrapar es que **alguien tipee el número en
lugar de leerlo**, y eso es lo que se rompió arriba. El que sí se pone rojo moviendo `race.json`
es `verificar-anuncio.mjs`, porque del otro lado tiene un audio ya rendido que no puede seguirlo.

## 5. Lo que no se rompió

| chequeo | resultado | línea de base de la fase |
| --- | --- | --- |
| `npm test` | **193 pruebas, 193 pasan, 0 fallan** | 184 + las 9 nuevas |
| `npm run check` | **verde**, salida 0: 3 ocurrencias, las tres en la lista aceptada; cero hits en la segunda | igual |
| `npm run mutaciones` | **las 20 roturas dieron rojo y los 9 chequeos dan verde** | igual |
| `git diff --stat -- lib/` | **vacío** | `lib/` no cambió |

`git status` no muestra un solo archivo trackeado modificado: todo lo que estas dos tasks
escribieron vive adentro de `demo/race-multiview/` y de `.project/phases/13-…/`. Verbatim en
[`salidas/no-se-rompio-nada.txt`](salidas/no-se-rompio-nada.txt).

## 6. La página que hay, y la que no

**La demo corre sobre una página mínima**, y decirlo es parte de entregarla: `index.html`,
`js/app.js` y un `css/page.css` de sesenta líneas, que son el contenedor, el video, las seis
líneas que escribe un integrador y la línea de estado. Existe porque la definición de terminado
de esta task es la demo corriendo, y sin página no hay demo.

**Lo que no está y es de la T-09**: la apertura, las dos secciones de scroll que se dibujan solas
del contrato, `CREDITS.md`, el README, y `brand/` byte por byte. La línea de estado sí está acá y
no allá, porque es el instrumento con el que se verificó esta task: dice cuántos elementos de
video hay adentro del contenedor y cuántos están decodificando, que es la única afirmación de
esta demo que el contrato no puede hacer.

## 7. Lo que esta task NO hizo

- **Las cinco cámaras restantes.** El catálogo de hoy tiene una. Lo que queda probado es que
  pasar de una a seis no toca un script.
- **`lib/`.** Los literales del panel —el título *Multi view*, el texto del popup *Multi view
  available*, la etiqueta *always on*— son de `lib/controls.js` y se leen bien para una carrera.
  No hubo nada que reportar por ese lado.
- **El R5**, las seis filas en el panel del selector. Con una fila no se puede medir; es de la
  T-09 y necesita el catálogo lleno.
- **Nada sobre red.** Todo se sirvió local desde `server.mjs`.

## 8. Un hallazgo que el test encontró y sí se arregló, porque era de esta task

El `X-ASSET-LIST` del tag se escribía como `/$LISTA`, o sea la ruta en disco del archivo. Con los
defaults las dos se escriben igual —`signalling/asset-list-offer.json`— y no se notaba; con el
`LISTA` del test apuntando a un temporal salía `X-ASSET-LIST="//tmp/race-multiview-XXXX/..."`.
La URL y la ruta en disco son dos cosas, y ahora se derivan por separado. **Lo encontró el test
la primera vez que corrió**, que es exactamente para lo que existen `SRC`, `OUT`, `CONTENT` y
`LISTA`.
