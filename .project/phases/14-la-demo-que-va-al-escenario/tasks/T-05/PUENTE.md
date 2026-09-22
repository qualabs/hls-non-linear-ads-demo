# T-05 — El puente a video: del SVG animado a HLS

**Las nueve piezas están convertidas y las nueve pasan la aserción.** El puente es
`demo/stage-pair/scripts/puente-a-video.sh`, que encadena un navegador headless con reloj
controlado, `ffmpeg` y el empaquetador, y corre la verificación sobre cada salida. El
control cortado y el control congelado **se vieron en rojo**, cada uno en la aserción que le
toca.

El mecanismo de reloj es `svg.pauseAnimations()` + `svg.setCurrentTime(t)`, la API del
documento SVG. No es el reloj de pared ni `--virtual-time-budget`.

## 1. Qué quedó convertido, y dónde

Todo en `demo/stage-pair/content/creatives/<pieza>/index.m3u8`, VOD, MPEG-TS de 2 s,
**mudo** (`-an`), 30 fps, 12,000 s, 360 cuadros, GOP 60.

| pieza | SVG | captura | salida | bitrate | peso |
| --- | --- | --- | --- | --- | --- |
| `zumbra-16x9` | 1920×1080 | 1920×1080 | **1280×720** | 2500k | 3,2 MB |
| `zumbra-banner` | 1680×189 | 1680×189 | **1120×126** | 800k | 828 KB |
| `zumbra-backplate` | 1920×1080 | 1920×1080 | **1280×720** | 2500k | 2,1 MB |
| `ketrava-16x9` | 1920×1080 | 1920×1080 | **1280×720** | 2500k | 3,7 MB |
| `ketrava-banner` | 1680×189 | 1680×189 | **1120×126** | 800k | 1,1 MB |
| `ketrava-backplate` | 1920×1080 | 1920×1080 | **1280×720** | 2500k | 3,0 MB |
| `kovrin-16x9` | 1920×1080 | 1920×1080 | **1280×720** | 2500k | 3,7 MB |
| `kovrin-banner` | 1680×189 | 1680×189 | **1120×126** | 800k | 1,1 MB |
| `kovrin-backplate` | 1920×1080 | 1920×1080 | **1280×720** | 2500k | 2,9 MB |

**La cadencia y la duración salen de `stage.json`** (`creativos.fps`, `creativos.duracion`) y
no están escritas en ningún script. **El tamaño de salida sale de los `viewport` de
`stage.json`** sobre un cuadro de 1280×720, que es "cada creativo sale al tamaño exacto de su
caja" — el precedente escrito de `demo/hydration-break/scripts/creativos.sh`, cuya razón es el
ADR 0013: una caja se llena con recorte centrado, y un creativo con otra relación de aspecto
se recorta por los bordes, que es donde vive la tipografía.

**La excepción es el 16:9, y es la única decisión de tamaño que no sale de una fórmula.** Su
caja sobre el par mide 640×360, pero esa misma pieza es el **aviso lineal** de su break
(ADR 0082) y ahí ocupa la pantalla entera del pane de fábrica. Sale a 1280×720, el tamaño del
contenido primario. Un 640×360 estirado al doble en cámara es exactamente lo que un vector
venía a evitar.

**El banner no podía salir a su resolución nativa**: 189 es impar y `yuv420p` no admite un
lado impar. 1120×126 son dos tercios exactos de 1680×189, los dos lados pares y la relación
8,889:1 intacta, y es además el tamaño en que se dibuja sobre un cuadro de 1280×720.
`empaquetar-creativo.sh` para con un error si le pasan un lado impar, en lugar de dejar que
`ffmpeg` lo diga en una línea que se pierde.

**Evidencia visual:** [`evidencia-nueve-videos.png`](evidencia-nueve-videos.png) — un cuadro de
cada uno de los nueve HLS producidos, a t = 1,0 s. El negro de los tres backplates es la
guarda, y es correcto: son los 1440×810 que el contenido primario tapa en `zDepth` 1.

## 2. El instrumento, arreglado antes de medir nada

El comparador de píxeles de la T-02 **devolvía 0 para un negro contra un verde**, y el defecto
muerde exactamente en esta task, que compara cuadros de video contra cuadros de navegador.
Reproducido:

```
$ identify -format "%f %[colorspace]\n" negro.png verde.png
negro.png Gray          <- ImageMagick guarda en escala de grises lo que tiene los 3 canales iguales
verde.png sRGB
$ ./pxdif-t02.sh negro.png verde.png
0
```

El arreglo es `-colorspace sRGB` en las **dos** entradas, y vive en
`demo/stage-pair/scripts/pxdif.sh`, con su `--autotest`, que corre **antes** de cada corrida
del puente:

```
  OK    negro vs verde                         20000
  OK    negro vs negro                         0
  OK    negro vs 10 columnas de 100            1000
  OK    GRIS vs verde (el caso que fallaba)    20000
  OK    ruido de +-3/255, umbral 0             20000
  OK    ruido de +-3/255, umbral 5%            0
  OK    verde vs negro, umbral 5%              20000
pxdif: instrumento validado contra 7 casos de respuesta conocida.
```

**Y apareció un segundo defecto del mismo instrumento, que no estaba en el encargo.** Contar
todo píxel que difiera aunque sea en una unidad no sirve entre dos cuadros de video: un video
**congelado** —el mismo PNG repetido 360 veces— decodifica cuadros que difieren en **328.496
px de 921.600** con umbral 0. Es el ±1 de cuantización de H.264 repartido por todo el cuadro,
y con umbral 0 un video quieto pasa por "movido". Medido a varios umbrales sobre ese mismo par:

```
congelado, umbral 0  : 328496
congelado, umbral 2% :   9841
congelado, umbral 5% :    563
congelado, umbral 8% :     39
```

De ahí el tercer argumento de `pxdif.sh`, el umbral, que por defecto es 0 —la semántica que la
T-02 usaba para comparar navegador contra navegador— y es 5 % en todo lo que toca un cuadro de
video.

## 3. El reloj, que es la decisión central

**`svg.pauseAnimations()` y `svg.setCurrentTime(t)`.** Es la API de `SVGSVGElement`, y
corresponde acá porque los nueve creativos están animados **sólo con SMIL**, verificado y no
supuesto:

```
ketrava-16x9.svg	1920x1080	smil=8	css=0	script=0
ketrava-backplate.svg	1920x1080	smil=5	css=0	script=0
ketrava-banner.svg	1680x189	smil=5	css=0	script=0
kovrin-16x9.svg	1920x1080	smil=7	css=0	script=0
kovrin-backplate.svg	1920x1080	smil=4	css=0	script=0
kovrin-banner.svg	1680x189	smil=1	css=0	script=0
zumbra-16x9.svg	1920x1080	smil=27	css=0	script=0
zumbra-backplate.svg	1920x1080	smil=30	css=0	script=0
zumbra-banner.svg	1680x189	smil=32	css=0	script=0
```

`setCurrentTime` **no controla una animación CSS**, así que `capturar-svg.py` se niega a
capturar un archivo que declare `@keyframes` en lugar de producir un video quieto sin avisar.

**Por qué no el reloj de pared:** dormir y fotografiar da cuadros repetidos y perdidos según
cuánto tarde cada captura, y el error no se ve en el archivo. **Por qué no
`--virtual-time-budget`:** no es determinista, y está medido en esta fase — la misma página con
el mismo budget, dos corridas, 7.137 px de diferencia.

Entre el `setCurrentTime` y la foto se esperan **dos** `requestAnimationFrame`: el primero es
donde el motor recalcula el estilo con el nuevo tiempo, el segundo garantiza que ese cuadro ya
se compuso.

**El SVG se incrusta en el DOM y no se abre en un `<img>`**, porque adentro de un `<img>` el
documento es inaccesible y no hay a quién pedirle `setCurrentTime`. Que eso no cambie el dibujo
**se midió**, congelando los dos en t = 0: el mismo archivo incrustado contra el mismo archivo
abierto como documento propio, a 1920×1080, dio **0 píxeles de diferencia**.

## 4. La aserción, y sus dos controles vistos en rojo

`verificar-creativo.sh` mide tres cosas, cada una contra su referencia:

1. **cuadros decodificados y duración** (`ffprobe -count_frames`, y la suma de los `#EXTINF`)
   contra lo declarado;
2. **que el video se mueva lo que el SVG se mueve**: para cada par de instantes, el movimiento
   del video contra el movimiento del mismo par de cuadros del navegador, como fracción del
   cuadro;
3. **que se mueva en fase**: el cuadro 0 del video se parece más al cuadro 0 del navegador que
   al cuadro 15. Ésta es la aserción tal como corrió acá; la corrección del 2026-09-22 —el
   cuadro 0 sacado sin `-ss` y el mínimo sobre siete candidatos— está al final de esta sección.

### Control a) la captura cortada a la mitad — rojo en duración, verde en movimiento

```
== CONTROL a) la captura cortada a la mitad: tiene que dar ROJO ==
.../hls-cortado/index.m3u8  (1280x720, 180 cuadros a 30 fps, gop=60, 3 segmentos, 6.000 s por suma de #EXTINF)
  ROJO  cuadros decodificados: 180, declarado 360
  ROJO  duración por suma de #EXTINF: 6.000 s, declarado 12 s (delta 6.000 s)
        cuadros   0-> 15  video   29754 px (3.2285 %)   SVG   29094 px (1.4031 %)   ok
        cuadros  15-> 30  video   25244 px (2.7391 %)   SVG   55261 px (2.6650 %)   ok
        cuadros  30-> 45  video   26351 px (2.8593 %)   SVG   58699 px (2.8308 %)   ok
        cuadros  45-> 60  video   25743 px (2.7933 %)   SVG   57557 px (2.7757 %)   ok
  VERDE el video conserva el movimiento del SVG en los cuatro pares (holgura 1/4)
  VERDE el video está en fase con el SVG (19922 < 31123)
  => 2 aserción(es) en rojo
```

Que el movimiento salga **verde** acá es parte del control: prueba que lo que se puso rojo es
la duración y no otra cosa.

### Control b) el video congelado — rojo en movimiento, verde en duración

```
== CONTROL b) el video congelado: tiene que dar ROJO ==
.../hls-congelado/index.m3u8  (1280x720, 360 cuadros a 30 fps, gop=60, 6 segmentos, 12.000 s por suma de #EXTINF)
  VERDE cuadros decodificados: 360 (declarado 360)
  VERDE duración por suma de #EXTINF: 12.000 s (declarado 12 s, delta 0.000 s)
        cuadros   0-> 15  video     563 px (0.0611 %)   SVG   29094 px (1.4031 %)   FALLA
        cuadros  15-> 30  video     528 px (0.0573 %)   SVG   55261 px (2.6650 %)   FALLA
        cuadros  30-> 45  video       0 px (0.0000 %)   SVG   58699 px (2.8308 %)   FALLA
        cuadros  45-> 60  video       0 px (0.0000 %)   SVG   57557 px (2.7757 %)   FALLA
  ROJO  el video PIERDE el movimiento del SVG en los pares: 0->15 15->30 30->45 45->60
  => 1 aserción(es) en rojo
```

El video congelado tiene la duración correcta, los 360 cuadros correctos y **pesa lo mismo**.
Lo único que lo delata es esta medición.

**Los dos controles comparten UNA sola captura real**, y no es economía: la aserción de
movimiento compara contra el movimiento del SVG, así que un control congelado verificado contra
una referencia también congelada no se podría poner rojo nunca.

### Por qué la referencia es el propio SVG y no un número

La primera versión de esta aserción exigía que el video moviera más del 1 % del cuadro, y
**KOVRIN la puso roja**: su movimiento es "el suelo y no el zapato", un patrón de tacos de bajo
contraste, y movió 3.495 px de 921.600 (0,38 %). El video estaba bien — el mismo par movía
7.775 px de 2.073.600 en el navegador, o sea **0,375 %**, así que el video movió *más* que el
SVG como fracción del cuadro. Lo que estaba mal era el número fijo, calibrado contra un creativo
ruidoso.

Un umbral absoluto sobre "cuánto se mueve" no puede existir: cuánto se mueve es una propiedad
del creativo. Lo que el pipeline tiene que garantizar es que **no pierde** el movimiento que
había, y eso sólo se mide contra el movimiento que había.

**Evidencia visual del caso difícil:**
[`evidencia-movimiento-kovrin.png`](evidencia-movimiento-kovrin.png) — dos cuadros del video de
`kovrin-16x9` separados 0,5 s y su diferencia con el contraste estirado, donde se ve la tira de
tacos corrida y el arco de polvo.

### Las nueve, en verde

Las dos columnas siguen la una a la otra en las nueve piezas, que es la forma de la propiedad
que se quería demostrar. La corrida completa, verbatim
([`corrida-completa.log`](corrida-completa.log), 2026-09-22 08:47–09:01):

| pieza | video (mín–máx, % del cuadro) | SVG (mín–máx, % del cuadro) |
| --- | --- | --- |
| `zumbra-16x9` | 2,74 – 3,23 | 1,40 – 2,83 |
| `zumbra-banner` | 1,37 – 1,53 | 0,94 – 1,48 |
| `zumbra-backplate` | 1,46 – 1,70 | 0,80 – 1,47 |
| `ketrava-16x9` | 3,55 – 8,13 | 3,49 – 3,52 |
| `ketrava-banner` | 6,70 – 13,89 | 6,24 – 6,95 |
| `ketrava-backplate` | 1,85 – 4,40 | 1,77 – 2,02 |
| `kovrin-16x9` | 0,38 – 0,59 | 0,38 – 0,39 |
| `kovrin-banner` | 1,67 – 1,90 | 2,14 – 2,17 |
| `kovrin-backplate` | 0,69 – 0,83 | 0,75 – 0,77 |

Las nueve dieron `en verde` en las tres aserciones, y las nueve dieron 360 cuadros decodificados
y 12,000 s por suma de `#EXTINF`.

Esa tabla es la de esa corrida y **dos cosas la dejaron vieja después**, las dos abajo: las tres
filas de banner se midieron sobre los videos anteriores a que se les sacara el alfa —los tres
banners se re-empaquetaron a las 09:16 del mismo día—, y las nueve se midieron con la extracción
de cuadros que la corrección del 2026-09-22 reemplazó.

### La aserción de fase, corregida el 2026-09-22

**El cuadro 0 del video no era el cuadro 0 del video.** `verificar-creativo.sh` sacaba cada
cuadro con `ffmpeg -ss $t -i $HLS -frames:v 1`, y el MPEG-TS que escribe el empaquetado **no
empieza en cero**: su primer PTS es 1,4667 s, el retardo de multiplexado por defecto del
contenedor. Con `-ss 0` el punto pedido queda antes del comienzo del stream y lo que vuelve no es
el primer cuadro. Medido sobre `content/creatives/zumbra-16x9/`:

```
$ ffprobe -v error -select_streams v:0 -show_entries packet=pts_time -of csv=p=0 \
    content/creatives/zumbra-16x9/index.m3u8 | head -3
1.466667
1.500000
1.566667

$ pxdif (cuadro con -ss 0)      vs (navegador f00000)  5%   19922 px
$ pxdif (primer cuadro SIN -ss) vs (navegador f00000)  5%    2882 px
$ pxdif (cuadro con -ss 0)      vs (primer cuadro SIN -ss)  18829 px
```

Los 2.882 px son el ruido de recodificación de un cuadro que **sí** es el mismo; los 19.922 son
otro instante de la animación. El defecto lo encontró la T-09 corriendo esta misma aserción sobre
las cámaras de la carrera, donde **sí** da vuelta el veredicto; acá no lo daba vuelta porque
estas nueve piezas se mueven poco y el orden entre los dos candidatos quedaba del lado correcto.

**Qué cambió en el script.** Los 61 primeros cuadros se decodifican de **una sola pasada y sin
`-ss`**, así que no hay punto de partida que elegir mal; y la fase se decide por **mínimo sobre
siete candidatos** (los cuadros 0, 5, 10, 15, 20, 25 y 30 del navegador) en lugar de por una
comparación entre dos, donde un empate lo decide el ruido. El criterio es el que la T-09 dejó
validado en `verificar-fase-carrera.sh`; los dos scripts siguen separados porque tienen entradas
distintas —aquél recaptura el navegador desde el SVG y éste recibe los PNG que ya originaron el
video— y porque aquél no mide ni cuadros ni duración.

**El instrumento se vio encontrar, en las dos direcciones**
([`reverificacion-2026-09-22.log`](reverificacion-2026-09-22.log)). `--desfasar N` parte del
cuadro N del video en lugar del 0 y el mínimo tiene que caer en N; con N = 10 sobre
`zumbra-16x9` el mínimo se corre al 10 (2.949 px, contra 10.487 del vecino más cercano). Y contra
un control plantado —el mismo SVG capturado desde t = 0,5 s, empaquetado, y verificado contra la
referencia que arranca en 0— la aserción nueva se pone **roja y nombra el desfasaje**:

```
        cuadro 0 del video vs cuadro  0 del navegador     15942 px
        cuadro 0 del video vs cuadro 15 del navegador      2910 px
  ROJO  el mínimo cae en el cuadro 15 del navegador y el cuadro del video es el 0
```

Ese mismo control **pasaba en verde con la aserción anterior** (`11629 < 22582`), que es la
medida de lo que la corrección compra: un video quince cuadros corrido se declaraba en fase.

**Las nueve, re-verificadas.** Las tres aserciones en verde en las nueve, 360 cuadros y 12,000 s
en las nueve, y el mínimo de fase en el cuadro 0 en las nueve:

| pieza | video (mín–máx, % del cuadro) | SVG (mín–máx, % del cuadro) | fase: mín (cuadro 0) vs 2.º candidato |
| --- | --- | --- | --- |
| `zumbra-16x9` | 1,46 – 2,86 | 1,40 – 2,83 | 2.882 vs 5.478 |
| `zumbra-banner` | 1,20 – 1,49 | 0,95 – 1,48 | 1.162 vs 1.747 |
| `zumbra-backplate` | 0,83 – 1,48 | 0,80 – 1,47 | 4.630 vs 6.442 |
| `ketrava-16x9` | 3,55 – 3,58 | 3,49 – 3,52 | 1.005 vs 13.259 |
| `ketrava-banner` | 6,84 – 7,48 | 6,28 – 6,83 | 1.024 vs 5.471 |
| `ketrava-backplate` | 1,85 – 2,15 | 1,77 – 2,02 | 5.717 vs 13.398 |
| `kovrin-16x9` | 0,32 – 0,39 | 0,38 – 0,39 | 3.150 vs 4.481 |
| `kovrin-banner` | 1,90 – 2,08 | 2,15 – 2,20 | 1.881 vs 2.416 |
| `kovrin-backplate` | 0,61 – 0,74 | 0,75 – 0,77 | 5.394 vs 7.269 |

Las tres filas de banner son además las primeras medidas sobre los videos **sin alfa**, que son
los que hoy están en `content/creatives/`.

Las dos columnas del movimiento siguen la una a la otra igual que antes, y en tres piezas
—`kovrin-16x9`, `kovrin-banner` y `kovrin-backplate`— el video mueve algo **menos** que el SVG,
dentro de la holgura de 1/4 que la aserción declara. El segundo candidato de fase más cercano es
el de `kovrin-banner`, con el mínimo a 1,28 veces de distancia: es un bucle que vuelve por donde
salió, así que el cuadro 30 del navegador se le parece.

## 5. Lo que esta task NO hizo

- **No tocó `lib/`**, ni el contrato, ni ninguna de las cuatro demos publicadas.
- **No produjo las variantes de imagen**: son los nueve SVG tal cual, servidos como
  `image/svg+xml` desde `graphics/campaigns/`, según dictaminó la T-02.
- **No produjo el programa de la carrera ni sus cámaras**: eso es la T-09, con este mismo script
  y sin modificarlo.
- **No agregó audio a nada.** Todo sale con `-an`.
- **No commiteó nada.**
- **No midió nada sobre iOS ni sobre Safari.** Todo se capturó y se verificó en el Chrome real
  del sistema.
- **No declaró la procedencia de los nueve videos en el `CREDITS.md`** de la demo, que hoy sólo
  cubre SPARKS y `hls.js`. Es de la T-11 y se reporta acá para que no se pierda: la procedencia
  de estos nueve es la misma que la de sus SVG, que están escritos a mano y en git.
