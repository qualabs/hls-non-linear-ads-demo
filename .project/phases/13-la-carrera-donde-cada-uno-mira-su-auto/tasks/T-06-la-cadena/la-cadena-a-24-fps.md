# La cadena: el concat y el empaquetado a 24 fps

Cero generaciones de Veo, cero dólares. `./demo/race-multiview/scripts/preparar-contenido.sh`
deja dos directorios en `content/` y las dos playlists suman su largo exacto: **112,000000 s
el programa y 64,000000 s la cámara, con 0,000000 s de diferencia contra lo que declara
`race.json`.**

El veredicto en una línea: **la cadena corre y mide, y medir la suma de los `#EXTINF` resultó
ser la mitad del chequeo y no el chequeo entero — el defecto que el ADR 0059 previene no mueve
la suma, y eso se midió en lugar de suponerlo.**

Salida verbatim de la corrida en
[`salidas/el-empaquetado.txt`](salidas/el-empaquetado.txt), y la del chequeo con sus controles
en [`salidas/la-comprobacion-de-largos.txt`](salidas/la-comprobacion-de-largos.txt).

---

## 1. Qué quedó empaquetado, y dónde

| pieza | directorio | segmentos | suma de `#EXTINF` | declarado en `race.json` |
| --- | --- | ---: | ---: | ---: |
| el programa | `demo/race-multiview/content/primary/` | 56 | **112,000000 s** | `largo` 112 |
| CALDRIX, a bordo | `demo/race-multiview/content/view-caldrix/` | 32 | **64,000000 s** | `ofertaDura` 64 |

1280×720, H.264 + AAC, segmentos de 2 s con `EXT-X-PROGRAM-DATE-TIME`, **24 fps y GOP 48**.
Las dos llevan audio: el mezclado de `audio/programa.m4a` y `audio/caldrix.m4a`, que es el que
las tasks anteriores dejaron emparejado a −23,0 LUFS. Medido sobre un segmento suelto: −21,9
LUFS el programa y −22,6 la cámara, que es lo que hace que agrandar la cámara sea un cambio de
contenido y no un salto de volumen (ADR 0026).

`content/` entero está gitignoreado. Lo que va al repositorio es la receta.

## 2. Los tres scripts, y por qué el empaquetador es copia de la demo del partido

- **`scripts/empaquetar-contenido.sh`** — copia del de `demo/hydration-break/`, que es lo que
  `DESIGN.md` manda y no del de `multiview-offer`, de donde sale todo lo demás de esta demo. La
  razón es la firma: el de multiview tiene 1280×720, 30 fps y `-g 60` fijos adentro y no toma
  audio; el de hydration-break toma `SRC OUT SS DUR CROP ANCHO ALTO FPS AUDIO`, que es
  exactamente lo que hace falta acá. El cuerpo de ffmpeg es byte por byte el mismo; la cabecera
  se reescribió porque la del original habla de la L y del spot lineal, que acá no existen.
- **`scripts/preparar-contenido.sh`** — la forma del de `multiview-offer`: guard de fuentes con
  el mensaje de qué correr, y una llamada al empaquetador por pieza.
- **`scripts/verificar-largos.mjs`** — la medición, corrida al final de `preparar-contenido.sh`
  y no en un paso aparte, porque un chequeo que hay que acordarse de correr es un chequeo que no
  se corre.

**El catálogo es el que hay, y eso es lo que hace que la etapa 3 no toque nada.** `race.json`
declara las seis cámaras; el preparador empaqueta las que tengan su mp4 en `content/.fuentes/`.
Hoy es una. Cuando la T-08 deje las otras cinco, se empaquetan solas.

## 3. La comprobación de largos, y el control que le faltaba

**Lo que se mide es la suma de los `#EXTINF` de la playlist servida y no el `-t` que se le pasó
a ffmpeg.** Leer el `-t` de vuelta es repetir la orden: una referencia que devuelve lo que se le
pidió. Lo que el player reproduce, y lo que un cliente lee para resolver un `START-DATE`, es la
playlist.

**Los dos controles se vieron en rojo**, y los dos se arman rompiendo la playlist real y se
miden con la misma función que mide la buena:

| | suma | contra 112,000 | veredicto |
| --- | ---: | ---: | --- |
| el programa, como se sirve | 112,000000 s | 0,000000 | **VERDE** |
| *control: sin el último segmento* | *110,000000 s* | *−2,000000* | ***ROJO*** |
| *control: con un `#EXTINF` estirado a 2,500* | *112,500000 s* | *+0,500000* | ***ROJO*** |

### Y acá apareció lo que esta task no esperaba

El comentario que se estaba por dejar escrito decía que un GOP desacoplado del fps —`-g 60` con
una entrada de 24, que es el defecto exacto que el ADR 0059 previene— haría que *"la suma deje
de ser la que se pidió"*. **Se midió antes de dejarlo escrito y es falso.** Empaquetada la misma
cámara con `-g 60`:

| | segmentos | suma | `TARGETDURATION` | segmentos que lo pasan |
| --- | ---: | ---: | ---: | --- |
| GOP 48, el bueno | 32 | 64,000000 s | 2 s | ninguno (todos de 2,000) |
| GOP 60, desacoplado | 26 | **64,000000 s** | 2 s | **25, de 2,500 s** |

La suma no se mueve un microsegundo. Lo que sí pasa es que ffmpeg corta sobre el keyframe, que
ahora cae cada 2,5 s, y **escribe una playlist inválida**: declara `#EXT-X-TARGETDURATION:2` y
adentro lleva segmentos de 2,5, que es lo que el RFC 8216 §4.3.3.1 prohíbe. Y no dice una
palabra.

**Así que el chequeo mide dos propiedades y no una**, cada una con su forma de dar distinto: la
pieza dura lo que declara, y ningún segmento pasa el target duration que la propia playlist
declara. El control de la segunda es el mismo `#EXTINF` estirado, que es exactamente el archivo
que sale del GOP desacoplado.

**La tolerancia es un cuadro, 41,7 ms**, y está argumentada en la cabecera: los `#EXTINF` salen
del reloj de 90 kHz del mpegts y pueden cerrar unos microsegundos al costado; cualquier defecto
que importe se mide en cientos de milisegundos para arriba.

## 4. Los números aparecen una sola vez, y eso lo chequea la suite

`112`, `64` y `28` no están tipeados en ningún archivo de la demo fuera de `race.json`. Se
comprueba en `test/signalled-run.test.js`, que recorre el árbol de la demo **con los comentarios
sacados** —media demo es prosa que explica por qué un número es el que es, y un chequeo que
prohibiera escribir "112 s" en un comentario sería un chequeo contra la documentación— y con una
lista de aceptadas de una sola línea: `verificar-linea-15.mjs` dimensiona un buffer de pipe en 64
MiB, que es un número sobre un pipe.

**Y el chequeo tiene su propio control**, porque un recorrido de árbol que devuelve una lista
vacía es indistinguible de uno roto: se plantan tres archivos en un temporal —uno que tipea el
número, uno que lo escribe en un comentario, uno que lo lleva pegado a una palabra (`base64`)— y
se asserta que encuentra exactamente el primero.

## 5. Lo que no se tocó

`lib/` no cambió: `git diff --stat -- lib/` vacío. Ninguna de las otras tres demos, ni `run.sh`,
ni `server.mjs`, ni `package.json`. El empaquetador de las otras dos demos no se editó: se copió.

## 6. Dos hallazgos que se reportan y no se arreglan

- **El comentario de `demo/multiview-offer/scripts/empaquetar-contenido.sh` miente.** Dice que es
  *"copia byte por byte"* del de `compatibility-pair`, y los dos scripts ya no son la misma copia
  desde que la fase 10 le agregó a hydration-break los argumentos de tamaño, fps y audio. Es el
  hallazgo que `PHASE.md` ya anticipó; se reporta y no se toca, porque es de otra demo.
- **`dist/` estaba viejo en disco.** El `dist/qualabs-concurrent-hls.js` que había antes de esta
  corrida no es el que `lib/` produce hoy: `run.sh` lo reconstruyó y el md5 cambió. El build es
  determinista —reconstruirlo dos veces da el mismo archivo— y `dist/` está gitignoreado, así que
  lo único que esto dice es que **la última vez que alguien arrancó una demo, `lib/` era otra**.
  No había ninguna demo sirviendo en 8080, 8081 ni 8082 cuando se reconstruyó.
