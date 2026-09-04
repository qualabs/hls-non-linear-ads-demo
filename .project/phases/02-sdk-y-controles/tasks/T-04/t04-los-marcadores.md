# Los rangos del programa, marcados en la barra: las decisiones y lo que se midió

2026-09-04. La decisión que el bloque dejó abierta, la que apareció al medir, y
las capturas que prueban una y otra.

## 1. La barra marca las dos clases

El bloque pide decidir si la barra marca también el rango del interstitial
tradicional, que la misma playlist lleva en cada break y que este player ignora
por clase. **Las marca.**

La razón no es que se vea mejor: es que una barra que marca sólo lo que este
player dibuja **se queda callada sobre un break que un cliente de mercado sí
toma**, y eso es justamente lo que la página existe para mostrar. La demo es un
par de players sobre una sola playlist (ADR 0007) y la barra es el único lugar
donde eso se ve sin comparar dos panes. Con las dos clases marcadas, la barra
dice de un vistazo lo que hoy hay que explicar: en el mismo segundo hay dos
señales, cada cliente se queda con la suya, y una de las dos detiene el
programa.

La otra opción —marcar sólo lo nuestro, para no señalar en nuestra barra un
break que no reproducimos— es defendible y pierde por dos cosas. La primera es la
de arriba. La segunda es que el silencio no escala: en cuanto una playlist traiga
un break de reemplazo sin un rango concurrente al lado, la barra no lo mostraría
y no habría nada que avisara que faltó.

## 2. Lo que apareció al medir, y que es lo que decide cómo se dibuja

**Los dos rangos de cada break están en el mismo lugar.** No es una casualidad de
esta playlist: los dos Date Ranges se escriben con el mismo `START-DATE` y la
misma duración, que es lo que hace al par de compatibilidad ser un par. Medido en
`t04-la-medicion.json`: los diez rangos caen de a dos, `AD-n-LINEAR` y
`AD-n-CONCURRENT`, en 20, 45, 70, 95 y 120 s, de 12 s cada uno.

Entonces marcar las dos clases **una encima de la otra no agrega información**:
agrega un color en el mismo pedazo de barra. Lo que las separa no es dónde están
sino de quién es cada una, así que lo que las separa en la pantalla es el
carril:

- **Sobre el riel va lo que este player reproduce**, en violeta. El relleno del
  progreso le pasa por adentro y la perilla lo cruza, porque está en esta línea
  de tiempo.
- **Debajo del riel, en un carril propio, va lo que hace el otro cliente**, en
  amarillo. Ningún playhead lo toca, porque no es esta línea de tiempo.

Esa es la mitad que hace que el amarillo se lea como "acá un cliente de mercado
reemplaza" y no como "acá pasa algo en este player". La otra mitad es el color, y
está abajo.

**El riel pasó de 6 a 8 px y el carril de abajo mide otros 8**, y eso lo decidió
la prueba del cuarto y no el gusto: reducida al 25 %, una franja de 6 px queda en
1,5 filas de la imagen, o sea que ninguna fila cae entera adentro y las dos que
la tocan salen mitad color y mitad fondo. Con 8 px quedan dos filas y una de las
dos es color puro. Es el tamaño mínimo que sobrevive a la reducción, que es la
prueba que el done pide.

Se descartó una variante: un segundo riel tenue de ancho completo debajo del
primero, con los bloques amarillos encima, que diría lo mismo con más claridad.
Queda afuera porque **David pidió una sola barra de progreso** —"we would want to
have maintain the progress bar on the bottom and only have one progress bar"— y
un segundo riel de ancho completo se lee como una segunda barra, esté dibujado
como esté.

## 3. Los colores

`RANGE_COLOURS` en `lib/controls.js`, y son colores **funcionales** y no de
marca: el kit de Qualabs es teal, naranja, tinta y papel, y ninguno de los dos
está ahí (`brand/README.md`). Entran igual que entra el rojo de un indicador.

| clase | color | por qué |
| --- | --- | --- |
| `interstitial` | `#ffcc00` | es el amarillo con el que los players de Apple marcan el interstitial tradicional, así que llega leído |
| `concurrent` | `#a273ff` | no tiene convención que respetar, porque es lo que se muestra por primera vez |

El naranja fuerte queda descartado por dos razones, y las dos son de esta
pantalla y no de gusto: al lado del amarillo deja de ser otro color a distancia,
y esto se mira en pantalla grande desde lejos; y en este repositorio el ámbar
`--q-amber-400` ya significa otra cosa, que es el pane donde el contenido fue
reemplazado (`css/player.css:25`). La primera razón está escrita en el código,
que es donde gobierna; la segunda es de esta página y no de la librería, así que
está acá y no adentro de un archivo que se distribuye a un tercero.

Los dos son valores y los dos son una línea.

## 4. La barra en fullscreen sigue cruzando las barras negras, y se queda así

La T-09 lo dejó anotado: los controles se dibujan sobre el **contenedor** y no
sobre la imagen, así que en fullscreen la barra y su scrim cruzan el pilarbox.
Esta task pinta sobre esa barra y la pregunta le tocaba.

**Se queda como está**, por tres cosas:

1. Las imágenes de referencia que mandó Nicolás muestran la barra ocupando todo
   el ancho del marco. No es una omisión: es lo que se pidió.
2. Es lo que hace cualquier player. El pilarbox es del contenido y el mobiliario
   es del marco; una barra metida adentro de la imagen quedaría flotando con
   negro a los dos lados, que es lo que se ve roto.
3. La distinción tiene un lugar y ya está tomada: el **renderizador** mide la
   imagen porque las cajas del layout son porcentajes de lo que alguien está
   mirando (T-09); los **controles** miden el contenedor porque son el marco
   alrededor de esa imagen. Que las dos cajas sean distintas es la decisión, no
   el defecto.

Se ve en `t04-5-fullscreen.png`: el riel arranca en x = 54,8 y mide 1764,3 px
sobre un viewport de 1920, o sea que cruza las dos barras negras de 159 px. Las
cinco marcas de este recorrido caen entre el 11 % y el 73 % de la barra, o sea
sobre la imagen; una marca de un break en los primeros o los últimos segundos del
programa caería sobre el negro, y ahí se lee igual.

## 5. Las capturas, y la prueba del cuarto

`t04run.py` toma las capturas y mide, `t04pixeles.py` reduce y lee los píxeles.
Se pausa a propósito: los controles se esconden solos a los 2,6 s mientras corre
y en pausa se quedan, así que la captura es reproducible.

- **`t04-1-los-cinco-breaks.png`**, a tamaño real (1920 × 901), con el programa
  en 1:00 de 3:00. Los cinco breaks marcados, cada uno con su marca violeta sobre
  el riel y su cue amarillo debajo. **Dos de las cinco marcas quedan detrás del
  relleno blanco y se siguen viendo**, que es lo que prueba que un break ya
  pasado sigue en el mapa: las marcas se dibujan **encima** del relleno.
- **`t04-2-los-cinco-breaks-un-cuarto.png`**, la misma reducida al 25 % de su
  lado (480 × 225). Es la prueba barata de que los dos colores se distinguen a
  distancia, y se lee de los píxeles de la imagen reducida y no de un estilo
  computado.
- `t04-3-la-barra-de-cerca.png` es el recorte de la barra del mismo cuadro, que
  es lo que hace legible en un documento algo que en la página entera mide 8 px.
- `t04-4-con-aviso.png` es el mismo estado con `cornerOverlay` en pantalla: **el
  riel mide exactamente lo mismo** —left 1042,84, ancho 559,31— con aviso y sin
  aviso, que es el ADR 0016 visto en la barra.
- `t04-5-fullscreen.png` y `t04-6-fullscreen-un-cuarto.png` son el caso de la
  pantalla grande.

### Lo que dice la reducción al cuarto

En la reducida, cada marca mide **2 px de alto** y cada break **9,3 px de ancho**
en la página entera, y 29,4 px de ancho en fullscreen. Los colores leídos en el
centro de cada break, contra los declarados `rgb(162,115,255)` y
`rgb(255,204,0)`:

| | marca (violeta) | cue (amarillo) | distancia RGB |
| --- | --- | --- | --- |
| página entera, break 1 | 114, 80, 206 | 255, 232, 0 | 292,3 |
| página entera, break 3 | 131, 96, 219 | 255, 224, 0 | 282,3 |
| página entera, break 5 | 123, 90, 216 | 255, 228, 0 | 288,3 |
| fullscreen, break 1 | 173, 122, 255 | 245, 196, 3 | 272,3 |
| fullscreen, break 5 | 170, 120, 255 | 247, 197, 4 | 273,6 |

Los cinco breaks de cada captura están en `t04-un-cuarto.json` y
`t04-un-cuarto-fullscreen.json`. Fuera de un break, la misma fila del riel lee
`79, 77, 74` en la página entera: gris del riel, o sea que el contraste de arriba
es contra algo y no contra sí mismo.

La lectura se hace en la fila que cae **entera** adentro del carril y no en la
del centro redondeada: un carril de 8 px que arranca en una `y` par tiene su
centro justo en el borde entre dos filas de la imagen reducida, y ahí la lectura
sale mitad carril y mitad fondo, que es una medición del redondeo. Con la fila
mal elegida el violeta del fullscreen daba `60, 45, 67`; con la fila entera da
`173, 122, 255`. El carril mide 2 px reducido justamente para que haya una fila
entera que leer.

### La geometría

Cada marca contra lo que la aritmética dice, con el largo releído del primario
(180 s) y calculado en la sonda y no preguntado a la librería:

| | riel | delta máximo en left | delta máximo en ancho |
| --- | --- | --- | --- |
| en ventana | 1042,84 + 559,31 | 0,0104 px | 0,0063 px |
| con aviso | 1042,84 + 559,31 | 0,0104 px | 0,0063 px |
| en fullscreen | 54,84 + 1764,31 | 0,0122 px | 0,0115 px |

No es error de la conversión: es la cuantización del navegador a 1/64 de píxel,
la misma que la T-09 midió. Y los diez rangos están en la lista con `settled` en
`true` antes de que empiece el primero, así que la barra sale marcada de entrada
y no se completa a la vista.

## 6. Dónde quedó la aritmética, y por qué ahí

`rangeSpan(range, length)` en `lib/controls.js`: pura, exportada, y devuelve
`null` para un rango que no se puede ubicar —sin largo, sin ancho, o pasado el
final—. Es la función que la T-06 tiene que apuntar.

Está del lado del renderizado y no de la señalización **porque el largo no cruza
la costura**: el contrato dice que un `Range` trae en qué segundo empieza y
cuánto dura y nada más, y que la posición sobre la barra es una división que hace
quien pinta, con el largo que relee del contenido primario cada vez (ADR 0016).
Una función de la capa de señalización que devolviera la posición tendría que
guardar el largo, que es exactamente lo que el ADR no quiere.

---

## Tres cosas que quedaron anotadas y no arregladas

**1. El grep del ADR 0003 lleva un término que la T-02 dejó viejo.** La lista de
la T-03 incluye `interstitial`, y desde esta task ese término aparece cinco veces
del lado del renderizado: es el valor `'interstitial'` del campo `kind` del
contrato, su color, su carril y su tooltip. El contrato de la T-02 dice de frente
que **eso es lo que cruza la costura** —"lo que cruza es la clase de rango y no
la clase del transporte"—, así que lo que quedó viejo es la lista de términos y
no el código. Corrido sin ese término, el grep sigue dando cero. Está en
`t04-los-invariantes.txt` con las dos corridas y los cinco hits a la vista. La
decisión de qué hacer con la lista no es de esta task: o pierde el término, o lo
conserva con la excepción escrita.

**2. La T-06 pide una función que en el código son dos.** Su bloque dice "la que
produce los rangos del programa a partir de las experiencias resueltas, con su
clase y **su posición sobre el largo total**". En el código eso está partido y
tiene que estarlo: `rangeOfExperiences` y `rangeOfDateRange` (señalización)
producen los rangos con su clase, y `rangeSpan` (renderizado) los pone sobre el
largo. La partición es la del ADR 0016 y está explicada arriba. La T-06 apunta a
las tres, no a una.

**3. El bloque plantea el marcado del interstitial como si agregara posición.**
"Marcarlo muestra dónde un cliente de mercado se habría detenido" es cierto y no
agrega un lugar nuevo: el lugar ya estaba marcado por el rango concurrente del
mismo break, porque los dos Date Ranges comparten `START-DATE` y duración. Lo que
agrega es de qué clase es cada cosa, y eso es lo que empujó el diseño a dos
carriles en lugar de dos colores en el mismo. La decisión del bloque no cambia;
cambia lo que hay que dibujar para que se lea.
