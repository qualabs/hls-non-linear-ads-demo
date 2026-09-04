# El área de los layouts es la del video: qué cambió y qué se midió

2026-09-04. Una sola cosa cambia de lugar —la caja contra la que se resuelven
los insets porcentuales— y con ella desaparecen las dos consecuencias que la
T-03 había dejado medidas.

## 1. De dónde sale el rectángulo de la imagen

El renderizador sigue midiendo la capa que le dieron, que cubre el contenedor,
y ahora la reduce a la relación de aspecto del contenido y la centra. Es una
función pura, `imageBox(frame, ratio)`, y la relación de aspecto sale de
`video.videoWidth / video.videoHeight` del elemento que ya estaba
reproduciendo: el navegador lo reporta con el pixel aspect ratio aplicado, así
que es la forma en que el video se ve y no la de su matriz de muestras. Antes
de que llegue la metadata no hay relación y no hay imagen, y la función
devuelve el marco tal cual en lugar de `NaN`.

**No se toca la relación de aspecto del video**, que era la restricción dura:
lo que aparece en una pantalla de otra forma son barras negras al costado, y
las barras quedan afuera del área.

Con eso, dos consecuencias en el código:

- **Los avisos** se posicionan sumando el origen de la imagen a lo que
  `boxToPixels` devuelve. Un aviso declarado pegado a la izquierda cae en el
  borde izquierdo de la imagen y no en el de la pantalla.
- **El primario** recibe la caja de la imagen como caja propia —`position:
  absolute` con el `left`, `top`, `width` y `height` de la imagen— y el
  `transform` lo lleva de ahí a la caja que el layout pide. Su caja pasa a
  tener la relación de aspecto del video, así que el `object-fit: cover` del
  ADR 0013 no tiene nada que recortarle. Y es **el mismo rectángulo** que
  ocupa sin layout en pantalla, donde la hoja de estilos lo encaja en el
  contenedor sin deformarlo, que es la misma aritmética que hace `imageBox`.
  Por eso el encuadre dejó de saltar: los dos estados nombran el mismo
  rectángulo.

## 2. En ventana no se movió nada

Las dos cajas coinciden ahí —marco 715 × 402,1875, relación 1,778, la misma
del video— así que el cambio no tiene que mover un píxel. Es la regresión que
importa, porque la fase 01 midió ese cero cinco veces.

`t09-la-medicion.json`, los cinco breaks del recorrido: la caja que el
contrato pide, calculada en la sonda y no preguntada a la librería, contra la
que el navegador dibuja.

| break | layout | elementos | delta máximo |
| --- | --- | --- | --- |
| Overlay | `cornerOverlay` | 2 | 0,000000 px |
| LBox video | `squeezebackLShape` | 3 | 0,000000 px |
| LBox image | `squeezebackLShape` | 3 | 0,000000 px |
| Side by side pullback | `squeezebackDoubleBox` | 2 | 0,000000 px |
| Quad | `multiView` | 4 | 0,000000 px |

**14 elementos, delta máximo 0,000000 px**, primarios incluidos.

Y en píxeles, recortando las capturas de ventana a la caja del contenedor
(715 × 402 en 988, 257): la imagen llena el recorte de borde a borde, igual
con aviso y sin aviso. No hay barras porque en ventana no las hay.

## 3. En fullscreen, sobre un viewport que no es 16:9

Viewport 1920 × 901, relación 2,131 contra 1,778 del contenido. El marco es
1920 × 901 y la imagen 1601,778 de ancho arrancando en 159,111 — los mismos
números que midió la T-03.

**Los píxeles**, con el mismo scanner corrido sobre las capturas de la T-03 y
sobre las de esta task (`t09-los-pixeles.txt`). Busca la primera y la última
columna que no es negra, sobre el PPM crudo:

| captura | la imagen, por píxeles |
| --- | --- |
| T-03, sin aviso | x 159..1760, ancho 1602 |
| T-03, con aviso | **x 0..1919, ancho 1920** |
| T-09, sin aviso | x 159..1760, ancho 1602 |
| T-09, con `cornerOverlay` | x 159..1760, ancho 1602 |
| T-09, con `squeezebackLShape` | x 159..1760, ancho 1602 |

Las dos primeras filas son el salto de encuadre: el mismo player, con y sin
break, con la imagen ocupando dos rectángulos distintos. Las tres últimas son
el mismo rectángulo las tres veces.

**Los avisos, adentro.** En las capturas con aviso, las barras negras —x 4..158
y x 1761..1915— tienen **canal máximo 0**: negro puro, ningún elemento las
pisa. Vale para el `cornerOverlay`, cuya caja arranca pegada a la izquierda y
es el que haría visible el corrimiento, y para el `squeezebackLShape`, que
tiene una barra vertical y una horizontal.

Se descartan 4 px por lado, y no es para que el número salga: es el anillo teal
(#37b4a7) con que la página de la demo marca "hay un aviso" —
`.pane[data-state='ad'] .player { outline-color }`—, que en fullscreen queda
pegado al borde de la pantalla. Aparece en las cuatro esquinas de las capturas
con aviso y en ninguna de las capturas sin aviso, es de la página y no de la
composición, y las filas exactas que ocupa están en el archivo de píxeles.

**La geometría, para acompañar.** En fullscreen el delta entre la caja que el
contrato pide y la que el navegador dibuja es **≤ 0,0122 px**, no 0,000000 como
en ventana. No es un error de la conversión: el navegador cuantiza las
longitudes a 1/64 de píxel —0,015625— y 159,111 no cae en esa grilla, mientras
que los números de la ventana sí. Todos los elementos dan `dentroDeLaImagen:
true` con media décima de tolerancia.

## Tres cosas que quedaron anotadas y no arregladas

**1. La primera consecuencia del bloque no era lo que el código hacía.** El
bloque dice que hoy un aviso pegado a la izquierda *cae* sobre la barra negra.
Con un layout activo no había barra negra: el primario estaba en `cover` sobre
el contenedor y lo llenaba, así que el aviso arrancaba en x = 0 y la imagen
también. La T-03 ya lo había dicho al pie de su JSON. Lo que estaba medido y
era cierto es el recorte del primario y el salto de encuadre; el aviso sobre la
barra es la forma que ese mismo defecto toma en cuanto el primario deja de
recortarse. Las dos se arreglan con este cambio, así que el done no se mueve.

**2. Que el rectángulo sea el mismo sin aviso depende de la hoja de estilos de
la página.** La librería sólo maneja al primario mientras hay un layout; sin
layout le devuelve el elemento a la página, y lo que hace que el rectángulo
coincida es que `.video` esté en `object-fit: contain`. Una página que lo
pusiera en `cover` recuperaría el salto, al revés. Es material para la T-08, la
documentación del integrador: qué tiene que cumplir el elemento que reproduce
el contenido primario.

**3. Los controles siguen sobre el contenedor y no sobre la imagen.** En
fullscreen la barra, el scrim y los botones cruzan las barras negras. Esta task
no los tocó, y no es evidente que haya que tocarlos: son el marco alrededor de
la composición y no un elemento del layout. Vale tenerlo presente en la T-04,
que pinta los rangos del programa sobre esa misma barra.
