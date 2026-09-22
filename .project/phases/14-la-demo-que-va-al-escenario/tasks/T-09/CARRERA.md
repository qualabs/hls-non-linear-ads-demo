# T-09 — La escena de la carrera en SVG, y las cámaras que la enmarcan

**El programa y las seis cámaras existen, empaquetados a HLS, y las seis se leen como seis
cámaras de la misma carrera y no como seis copias.** La escena se dibuja UNA vez y los siete
archivos la comparten; lo único distinto entre uno y otro son las dos animaciones de la
cámara. Medido: la pareja de cámaras **más parecida** difiere en el **41,62 %** del cuadro,
contra el **1,47 %** de una copia recoloreada, que es el caso que el `DESIGN.md` descarta.

El pipeline es el de la T-05 sin una línea modificada. Lo que esta task agregó fue la escena,
los encuadres, y **un instrumento nuevo de fase**, porque el que había mide mal sobre estas
piezas por una razón medida que está en la sección 5.

## 1. Qué quedó, y dónde

| pieza | de la escena | salida | cuadros | duración | peso |
| --- | --- | --- | --- | --- | --- |
| `content/race/program/` | 0 → 120 s | 1280×720 @ 2500k | 3.600 | 120,000 s | 39 MB |
| `content/race/caldrix/` | 56 → 120 s | 1280×720 @ 2500k | 1.920 | 64,000 s | 20 MB |
| `content/race/marvok/` | 56 → 120 s | 1280×720 @ 2500k | 1.920 | 64,000 s | 20 MB |
| `content/race/noctev/` | 56 → 120 s | 1280×720 @ 2500k | 1.920 | 64,000 s | 20 MB |
| `content/race/runtak/` | 56 → 120 s | 1280×720 @ 2500k | 1.920 | 64,000 s | 20 MB |
| `content/race/pentav/` | 56 → 120 s | 1280×720 @ 2500k | 1.920 | 64,000 s | 21 MB |
| `content/race/quentra/` | 56 → 120 s | 1280×720 @ 2500k | 1.920 | 64,000 s | 21 MB |

Todo **mudo** (`-an`), VOD, MPEG-TS de 2 s, GOP 60, con `EXT-X-PROGRAM-DATE-TIME`.

**Lo escrito a mano es el generador, no los SVG.** `demo/stage-pair/scripts/escribir-carrera.mjs`
emite los siete archivos a `content/race/svg/`, que está gitignoreado por la misma razón que el
resto de `content/`: es lo que un clone reconstruye con un comando. Los nueve creativos de la
T-04 sí viven en git porque ahí lo autorado ES el SVG; acá lo autorado es la receta.

**Los números viven en `stage.json`**, en un bloque `carrera` nuevo: la cadencia, el largo, dónde
abre la ventana, el tamaño de salida y la lista de cámaras con su nombre y su color. La
realización —la geometría del circuito, los carriles, los tiempos de vuelta, los zooms y el plan
de cortes— vive en la cabecera del generador, que es donde el ADR 0061 la manda.

**Seis autos.** El criterio de la task pedía superar el tope de cuatro cajas de la grilla
(ADR 0066), porque si todo lo ofrecido entra en pantalla a la vez elegir no significa nada. Seis
es además el tamaño del catálogo de `demo/race-multiview`, la demo que esta reemplaza, y los
nombres son los de aquella —ya verificados como de fantasía—. Los colores son nuevos, elegidos
con separación de tono y de luminancia; ninguno evoca un equipo ni un piloto real, y **no hay
un número ni una letra en toda la escena**.

## 2. Las cámaras: una escena, siete encuadres

**Se anima el `transform` de un grupo y no el `viewBox` de la raíz**, que es el camino que la
task marcaba como seguro. El armado son dos grupos anidados, porque un elemento admite una sola
animación de `transform` en modo replace: el de afuera apunta (`translate`) y el de adentro se
acerca (`scale`). Un punto p del mundo cae en pantalla en z·p + T, así que centrar el auto pide
T(t) = C − z·p(t), y eso se emite muestreado cada 0,2 s.

**La cámara no se despega del auto entre muestras, y no por suerte.** Los dos lados se muestrean
en la MISMA grilla de tiempos y T = C − z·p es afín en p, así que la interpolación lineal de
C − z·p es exactamente C − z por la interpolación lineal de p. Con dos grillas distintas, no.

**Enmarcar distinto costó lo que la task decía que costaba**: es una animación más por archivo,
sobre el mismo dibujo. El archivo de una cámara pesa 190 KB y el de la escena sola sería 186 KB.

**Tres parejas repartidas por el circuito, y adentro de cada pareja una cámara abierta y una
cerrada.** Si los seis autos estuvieran juntos, las seis cámaras verían lo mismo; si estuvieran
repartidos de a uno, no habría carrera. De a dos, con tiempos de vuelta casi iguales adentro de
la pareja, hay tres peleas rueda a rueda a la vez en tres lugares distintos de la pista. Y las
dos cámaras de una misma pelea no se confunden: una va a 1,35 con el centro 130 unidades
adelante del auto y la otra a 2,45 con el centro 40 atrás.

**El programa es su propio encuadre**: quince planos con corte seco, dos de ellos generales
—el circuito entero, donde se ven las tres peleas a la vez—, y el resto siguiendo a un auto con
zoom y distancia distintos. El corte se emite como una pareja de muestras separadas 1/60 s, así
que ningún cuadro capturado a 30 fps cae adentro del salto.

**Las cámaras arrancan en el segundo 56 de la escena y no en el 0**, que es donde `race.html`
abre la ventana de multi view (`stage.json`, `carrera.ofertaEn`). El cuadro 0 de una cámara es el
mismo instante de la carrera que el programa está mostrando cuando quien mira abre la ventana:
los mismos adelantamientos desde otro lado, y no dos carreras distintas. **Si ese número se
mueve, las cámaras hay que volver a capturarlas**, y está escrito en `stage.json` al lado del
número.

## 3. Que son seis cámaras y no seis copias: lo que se mira y lo que se mide

**Lo que se mira:** [`lamina-seis-camaras.png`](lamina-seis-camaras.png), un cuadro de cada
cámara en el mismo instante, sacado de los HLS empaquetados.

**Lo que se mide** (`scripts/lamina-carrera.sh`), sobre esos mismos cuadros, con umbral 5 %:

```
cámaras comparadas de a pares, en el segundo 0 del clip, umbral 5%
  caldrix   vs marvok      383598 px   41.62 %
  caldrix   vs noctev      449958 px   48.82 %
  caldrix   vs runtak      515402 px   55.92 %
  caldrix   vs pentav      513778 px   55.75 %
  caldrix   vs quentra     579239 px   62.85 %
  marvok    vs noctev      510078 px   55.35 %
  marvok    vs runtak      513234 px   55.69 %
  marvok    vs pentav      551023 px   59.79 %
  marvok    vs quentra     578739 px   62.80 %
  noctev    vs runtak      418234 px   45.38 %
  noctev    vs pentav      584032 px   63.37 %
  noctev    vs quentra     651635 px   70.71 %
  runtak    vs pentav      501638 px   54.43 %
  runtak    vs quentra     596819 px   64.76 %
  pentav    vs quentra     440622 px   47.81 %

  CONTROL cero   la misma cámara dos veces                 0 px    0.00 %
  CONTROL copia  la misma toma, autos recoloreados     13526 px    1.47 %
  la pareja de cámaras MÁS parecida (caldrix vs marvok)    383598 px   41.62 %
  VERDE las seis se leen como seis encuadres distintos y no como copias
```

**El número solo no diría nada, y por eso van los dos controles.** El **control de copia** es la
alternativa que se descartó —*"lo hacemos la misma para todos y después cambiamos el color del
auto"*— construida de verdad: la cámara de CALDRIX con los seis colores rotados y nada más,
capturada y empaquetada por el mismo camino. Da **1,47 %**, que es el techo de lo que una copia
recoloreada puede diferir. La pareja real más parecida está **28 veces** por encima de ese techo.
El **control de cero** extrae dos veces el mismo cuadro del mismo HLS y da **0**: si diera
distinto, lo que la tabla mide sería ruido de extracción y no encuadre.

## 4. El corte de realización, en el video empaquetado

[`programa-corte-de-realizacion.png`](programa-corte-de-realizacion.png) — seis cuadros del
programa: un plano general, los dos lados de un corte, y tres planos de auto.

El corte dura **un cuadro**, medido sobre el HLS que se entrega, alrededor del corte del segundo
9 (cuadro 270):

```
cuadro del corte 268->269:   3708 px  (0,40 % del cuadro)
cuadro del corte 269->270: 374530 px  (40,64 %)
cuadro del corte 270->271:  44531 px  (4,83 %)
```

Los 3.708 px son lo que el plano general se mueve en un cuadro y los 44.531 lo que se mueve el
plano de auto que entra; entre medio, el salto.

## 5. La aserción de la T-05, y el defecto que apareció al correrla acá

**Las tres cosas que `verificar-creativo.sh` mide dieron verde en cuadros y en duración sobre las
siete piezas** —3.600 cuadros y 120,000 s el programa, 1.920 y 64,000 s cada cámara—, y los dos
controles del puente se vieron en rojo, cada uno en la aserción que le toca
([`corrida-completa.log`](corrida-completa.log)).

**La aserción de fase se puso roja en cinco de las siete piezas, y el defecto no es del
contenido: es de cómo se saca el cuadro 0 del video.** `verificar-creativo.sh` extrae cada cuadro
con `ffmpeg -ss $t -i $HLS -frames:v 1`, y **el MPEG-TS que escribe el empaquetado no empieza en
cero**: su primer PTS es 1,4667 s, que es el retardo de multiplexado por defecto del contenedor.
Con `-ss 0` el punto pedido queda antes del comienzo del stream y lo que vuelve no es el primer
cuadro. Medido sobre `content/race/caldrix/`:

```
$ ffprobe -v error -select_streams v:0 -show_entries packet=pts_time -of csv=p=0 \
    content/race/caldrix/index.m3u8 | head -3
1.466667
1.533333
1.500000

$ pxdif.sh (cuadro del video con -ss 0)  (navegador en t=56)  5%    537653
$ pxdif.sh (primer cuadro SIN -ss)       (navegador en t=56)  5%      2733
```

Los 2.733 px son el ruido de recodificación de un cuadro que **sí** es el mismo; los 537.653 son
otro momento de la carrera. Con el cuadro 0 equivocado, la aserción de fase compara cualquier
cosa contra cualquier cosa, y el par 0→15 de la aserción de movimiento mide un salto que el SVG
no tiene: sobre CALDRIX leía 574.225 px contra los 332.451 del SVG, y con el cuadro correcto lee
332.325 contra 332.451.

**El defecto está también sobre los nueve creativos de la T-05 y ahí no dio vuelta el
veredicto**, porque aquellas piezas se mueven poco y la comparación entre dos candidatos
—cuadro 0 contra cuadro 15— quedaba del lado correcto. Sobre una cámara que barre la pista, se
da vuelta.

**Lo que se hizo:** `verificar-creativo.sh` **no se tocó**, porque es de una task cerrada y
modificarlo cambiaría lo que la T-05 certificó. En su lugar hay un instrumento propio,
`scripts/verificar-fase-carrera.sh`, que decodifica los primeros 61 cuadros de una sola pasada
—sin `-ss`, así que no hay punto de partida que elegir mal— y **mide la fase por mínimo y no por
una comparación entre dos candidatos**: el cuadro 0 del video se compara contra siete cuadros del
navegador y lo que se afirma es dónde cae el mínimo.

Las siete piezas dan el mínimo en el cuadro 0 ([`fase-y-movimiento.log`](fase-y-movimiento.log)),
con el movimiento del video siguiendo al del SVG en los cuatro pares. Sobre CALDRIX:

```
        cuadros   0-> 15  video  332325 px (36.0596 %)   SVG  332451 px (36.0732 %)   ok
        cuadros  15-> 30  video  354592 px (38.4757 %)   SVG  354375 px (38.4521 %)   ok
        cuadros  30-> 45  video  334414 px (36.2862 %)   SVG  334215 px (36.2646 %)   ok
        cuadros  45-> 60  video  320330 px (34.7580 %)   SVG  319898 px (34.7112 %)   ok
  VERDE el video conserva el movimiento del SVG en los cuatro pares (holgura 1/4)
        cuadro 0 del video vs cuadro  0 del navegador      2733 px
        cuadro 0 del video vs cuadro  5 del navegador    134919 px
        cuadro 0 del video vs cuadro 10 del navegador    244912 px
        cuadro 0 del video vs cuadro 15 del navegador    332339 px
        cuadro 0 del video vs cuadro 20 del navegador    376548 px
        cuadro 0 del video vs cuadro 25 del navegador    392143 px
        cuadro 0 del video vs cuadro 30 del navegador    375964 px
  VERDE el mínimo cae en el cuadro 0 del navegador
```

**Y el instrumento se vio encontrar antes de creerle.** `--desfasar N` parte del cuadro N del
video en lugar del 0, y el mínimo tiene que caer en N. Un instrumento que siempre contestara
"cae en 0" contestaría eso también con un video corrido:

```
        cuadro 10 del video vs cuadro  0 del navegador    245325 px
        cuadro 10 del video vs cuadro  5 del navegador    196094 px
        cuadro 10 del video vs cuadro 10 del navegador      3380 px
        cuadro 10 del video vs cuadro 15 del navegador    195927 px
        cuadro 10 del video vs cuadro 20 del navegador    286231 px
  VERDE el mínimo cae en el cuadro 10 del navegador
```

**La corrección que le haría falta a `verificar-creativo.sh` no se aplicó y se deja escrita**: el
cuadro 0 se saca sin `-ss`, y la aserción de fase se decide por mínimo sobre varios candidatos en
lugar de por una comparación entre dos. Los nueve creativos de la T-05 habría que volver a
verificarlos con eso puesto; su veredicto no cambia —el movimiento y la duración no dependen de
este defecto— pero la evidencia de la fase, hoy, vale menos de lo que dice.

> **Nota del 2026-09-22, agregada por la T-12.** El párrafo de arriba queda como está porque es
> el registro de lo que esta task vio. Las dos cosas que deja pendientes **ya están hechas**:
> `demo/stage-pair/scripts/verificar-creativo.sh` saca el cuadro 0 **sin `-ss`** y decide la fase
> **por mínimo sobre siete candidatos**, y los nueve creativos de la T-05 se re-verificaron en
> verde con esa corrección puesta, con su control en rojo (un video corrido 15 cuadros da rojo, y
> con `--desfase 15` vuelve a verde). La corrida está en
> [`tasks/T-05/reverificacion-2026-09-22.log`](../T-05/reverificacion-2026-09-22.log).

## 6. Lo que esta task NO hizo

- **No tocó `lib/`**, ni el contrato, ni ninguna de las cuatro demos publicadas, ni las páginas
  ni la señalización del par.
- **No tocó `capturar-svg.py`, `empaquetar-creativo.sh`, `verificar-creativo.sh` ni `pxdif.sh`.**
  El pipeline es el de la T-05 tal cual; lo propio de acá es qué piezas se capturan y desde qué
  instante.
- **No escribió `race.html` ni su señalización**, que son de la T-10. Lo que esta task le deja
  son los siete HLS y el bloque `carrera` de `stage.json`.
- **No agregó audio a nada.** Todo sale con `-an`.
- **No declaró la procedencia de estas siete piezas en el `CREDITS.md`** de la demo, que es de la
  T-11. La procedencia es el generador: un script que dibuja primitivas vectoriales, sin un solo
  píxel rasterizado y sin nada salido de un modelo.
- **No commiteó nada.**
