# T-01 — El recorrido, las tres campañas y la única fuente de los números

Todo lo que se puede decidir sin dibujar, decidido. Los números viven en un solo archivo,
**`demo/stage-pair/stage.json`**, que después leen la señalización, la captura y las tres
páginas. Acá está el porqué de cada número; el número está allá.

## 1. La línea de base de la fase, medida antes de tocar nada

Sobre `28999e2`, con el árbol modificado sólo en `.project/` y ni una línea de código tocada.

```
$ git rev-parse --short HEAD
28999e2
$ npm test
ℹ tests 193
ℹ suites 0
ℹ pass 193
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2540.122024
```

```
$ npm run check
## ADR 0003 -- the rendering side does not know one word of the transport
   GREEN: 3 occurrence(s), all of them on the accepted list.
     lib/controls.js:33  // or 'interstitial' -- which the contract carries on purpose, because the two
     lib/controls.js:133  interstitial: '#ffcc00'
     lib/controls.js:169  interstitial: 'traditional interstitial: the content is replaced by the ad'
## ADR 0015 -- the library side does not name the demo application
   GREEN: zero hits.
verificar-cortes: both seams hold.
EXIT=0
```

**Coincide con lo que `PHASE.md` declara**: 193 pruebas, 193 pasan, 0 fallan; las dos costuras
verdes, salida 0, tres ocurrencias aceptadas en la primera y cero hits en la segunda. Es el
número contra el que la T-12 compara, y se compara **por nombres y no sólo por el total**.

## 2. Las tres campañas

Tres marcas de fantasía, una por rubro. Los tres criterios del contrato aplicados, y el
primero **contrastado contra una búsqueda y no contra la memoria**.

### ZUMBRA — bebida. Ya decidida y aprobada; acá sólo se transcribe

Su brief vive en la cabecera de `tasks/T-04/zumbra-16x9.svg` y **no se redefine**.

| | |
| --- | --- |
| producto | gaseosa cítrica sin azúcar, 330 ml, cuatro botánicos |
| claim | *CITRUS, OUT LOUD* |
| apoyo | *Sparkling citrus. Zero sugar.* / *NOW IN FOUR BOTANICALS* |
| paleta | verde cítrico `#8ef06a` sobre fondo verde profundo `#0c1a14`→`#04070a`; lata `#1d4a2e`→`#e4fbc2`; texto `#f2f8ee` |
| objeto | la lata, construida en cuatro cuerpos de radio distinto |
| movimiento | la carbonatación: burbujas en bucle de 3 s con `begin` negativo y fases repartidas, y un anillo de doce rayos que gira 30° en 6 s |

### KOVRIN — calzado

| | |
| --- | --- |
| producto | zapatilla de trail, 240 g, tres terrenos |
| claim | *BUILT FOR THE LONG WAY* |
| apoyo | *Trail cushioning. 240 grams.* / *THREE TERRAINS, ONE OUTSOLE* |
| paleta | naranja ascua `#ff7a3c` sobre pizarra `#12151c`→`#080a0f`; zapatilla `#2a2f3a`→`#f2ece6` |
| objeto | la zapatilla de perfil: suela con tacos, cuña de mediasuela, capellada y cordones |
| movimiento | **el suelo y no el zapato**: el patrón de tacos corre por debajo en bucle de 3 s, y un arco de polvo pulsa en 6 s |

### KETRAVA — turismo

| | |
| --- | --- |
| producto | rutas de costa en barco chico, salidas de nueve puertos |
| claim | *THE SLOW COAST* |
| apoyo | *Island routes, small boats.* / *DEPARTURES FROM NINE PORTS* |
| paleta | arena cálida `#ffcf8a` y aguamarina `#5fd2c4` sobre azul de mar profundo `#071822`→`#03080d` |
| objeto | un cabo con su faro y planos de mar en capas, con un barco chico |
| movimiento | **paralaje**: los planos de mar corren a velocidades distintas en bucle de 3 s, y el haz del faro barre en 6 s |

### Los tres criterios, y contra qué se contrastaron

**(a) El nombre no evoca una marca real del rubro.** Buscado, no recordado. Lo que se
descartó vale tanto como lo que quedó, así que va escrito:

| candidato | rubro | qué devolvió la búsqueda | veredicto |
| --- | --- | --- | --- |
| TARVO | calzado | **TARVAS**, marca finlandesa de calzado, Helsinki, 2017, fabricada en Parkano | **descartado** |
| STRAVON | calzado | **Stravers Shoes**, Ámsterdam desde 1960, y **STRAYE**, zapatillas de skate | **descartado**: comparte `STRAV-` con una marca del mismo rubro |
| KOVRIN | calzado | ninguna marca de calzado. Lo más cercano son las marcas **KOVVAR**, **KOVEN** y **KOUVRI**, las tres con otra grafía y ninguna del rubro | **elegido** |
| SOLVANE | turismo | nada exacto, pero **Solvang** existe y es un destino turístico conocido | **descartado** |
| MIRALTA | turismo | **Miral** / **Miral Travel** / **Miral Destinations**, Abu Dhabi, turismo y entretenimiento | **descartado** |
| ORVANTE | turismo | **Orvante Group**, inversión hotelera | **descartado** |
| KETRAVA | turismo | ninguna marca de viajes. Lo más cercano en los resultados son operadores reales sin parecido de nombre | **elegido** |

**(b) La paleta no es la de una marca conocida.** Las tres se apartan a propósito de los
repertorios del rubro: la de calzado no usa el negro-con-volt ni el blanco-con-tres-franjas
que son marca registrada de dos deportivas conocidas, y usa un naranja ascua sobre pizarra;
la de turismo no usa el celeste corporativo de aerolínea sino un azul de mar profundo con
arena cálida. Y las tres se distinguen entre sí, que es lo que hace que tres breaks seguidos
no se lean como el mismo aviso repetido: verde, naranja y azul.

**(c) Nada del dibujo imita un logotipo existente.** Los tres objetos son el producto y no
un emblema: una lata, una zapatilla de perfil, un cabo con un faro. Ninguna de las tres
campañas lleva un símbolo de marca separado del nombre.

## 3. Las tres formas y sus `viewBox`

| forma | `viewBox` | relación | layout | `viewport` del aviso |
| --- | --- | --- | --- | --- |
| **16:9** | `0 0 1920 1080` | 16:9 | `squeezebackDoubleBox` | `"25 0 25 50"` |
| **banner** | `0 0 1680 189` | 8,889:1 | `lowerThirdOverlay` | `"70 6.25 12.5 6.25"` |
| **backplate** | `0 0 1920 1080` | 16:9 con guarda | `squeezebackLShape` | `"0 0 0 0"`, `zDepth` 0 |

Los tres `viewport` están **medidos sobre las señalizaciones que ya están en el repositorio**,
no elegidos de nuevo: el del banner sale de `demo/hydration-break/signalling/`, los otros dos
de `demo/compatibility-pair/signalling/`.

El banner: 87,5 % × 17,5 % de un cuadro de 1920×1080 son **1680 × 189 px exactos**, y
1680 / 189 = 8,889. La caja del aviso del `squeezebackDoubleBox` es 50 % × 50 % sobre un
cuadro 16:9, o sea 16:9 otra vez: se autora a 1920×1080 y se dibuja en 960×540, que en vector
no cuesta nada.

### La guarda del backplate, que es lo que esta task tenía que elegir

El ADR 0047 manda que el aviso de la L sea **un solo elemento a cuadro entero en `zDepth` 0**
y que el contenido primario vaya encima, encogido y anclado contra dos bordes. Lo que esta
task elige es **cuáles dos y con qué inset**:

- **arriba y derecha**, que es lo que el propio ADR ejemplifica y lo que deja la L abajo y a
  la izquierda, que es donde la industria la pone;
- **inset del 25 % en los dos ejes** → `"primaryContent": { "zDepth": 1, "viewport": "0 0 25 25" }`.

El 25 % escala los dos ejes por igual, así que el primario mantiene su relación de aspecto:
1440 × 810 sobre 1920 × 1080 sigue siendo 16:9, que es la condición que el ADR 0047 pone.
`demo/hydration-break` usa 26 % y funciona en pantalla; se elige 25 % porque es el mismo orden
de magnitud con la aritmética limpia sobre la grilla de autoría, y porque es el número que el
`squeezebackDoubleBox` ya usa en sus propios insets.

**De ahí sale qué región del backplate tiene que quedar vacía**, en coordenadas de su
`viewBox`:

| | |
| --- | --- |
| guarda (lo que el primario tapa) | `x 480, y 0, ancho 1440, alto 810` |
| lo que se ve | la columna izquierda `x 0..480` a alto entero, y la banda inferior `y 810..1080` a ancho entero |

Eso es la L. El dibujo tiene que estar compuesto para que lo que se lea sea una L y no un
fondo con un agujero.

## 4. El recorrido del par: tres breaks

| break | offset | duración | forma | layout | campaña | rica (sin declarar, o 2) | magra (1) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **A** | 20 s | 12,0 s | 16:9 | `squeezebackDoubleBox` | **ZUMBRA** | el creativo 16:9 **en video** | el **mismo** como `image/svg+xml` |
| **B** | 65 s | 12,0 s | backplate | `squeezebackLShape` | **KETRAVA** | el backplate **en video** | el **mismo** como `image/svg+xml` |
| **C** | 110 s | 12,0 s | banner | `lowerThirdOverlay` | **KOVRIN** | el banner **en video** | el **mismo** como `image/svg+xml` |

**Entre la rica y la magra de un break cambia una sola cosa: el `type` y el `uri` del asset.**
El layout, el `viewport`, el `zDepth`, la campaña y la duración son idénticos, y que sean
idénticos es lo que la demo afirma (ADR 0084).

**Por qué cada campaña cayó en su break:**

- **ZUMBRA en el A** porque su 16:9 es el único creativo ya autorado y aprobado, así que el
  primer break que se ve en cámara es la pieza terminada.
- **KETRAVA en el B** porque un paisaje es la silueta que mejor tolera que le tapen el centro:
  la guarda del backplate cae sobre cielo y mar, donde no hay nada que perder.
- **KOVRIN en el C** porque una zapatilla de perfil es la única de las tres siluetas que llena
  una tira de 8,889:1 sin quedar perdida en el medio.

**Los tres duran lo mismo** —12,0 s— para que el creativo 16:9 de cada campaña sirva de aviso
lineal en su break sin recortarse (ADR 0082). Y 12 s son además **cuatro vueltas exactas** del
bucle de 3 s con que está autorada ZUMBRA.

**Los offsets** dejan huecos de programa iguales, 33 s, y el primer break entra a los 20 s
para que la demo lo alcance rápido. El último termina en **122 s**, bastante antes de los
~195 s donde arrancan los créditos.

> **Nota del 2026-09-22, agregada por la T-12.** Los `~195 s` eran la estimación con la que esta
> task trabajó, antes de que hubiera una medición. La T-03 la midió: el fundido a negro arranca
> en **193,0 s**, el negro pleno en **198,0 s** y la placa fija de créditos en **199,0 s**, así
> que el programa se cortó en **198,0 s**. El número vive en `stage.json` (`programa._largo`). La
> conclusión de este párrafo no cambia: 122 s sigue quedando muy por debajo.

### Lo que queda pendiente, y por qué no se inventa

**`programa.largo` queda en `null` en `stage.json`, marcado por su dependencia.** Lo cierra la
T-03 **sumando los `#EXTINF` de la playlist empaquetada**, que es la única medición que vale:
ni el contenedor de origen ni el `-t` del `ffmpeg`.

Lo que sí queda escrito es **la regla que lo resuelve**: los offsets de arriba necesitan
`largo ≥ 135 s`. Si lo que la T-03 mida queda por debajo, los offsets se re-espacian
manteniendo los huecos iguales; si queda por encima, valen tal cual. El dato de contexto que
la regla respeta es que David dijo que el evento da unos dos minutos de demo para todo, y por
eso las páginas permiten saltar a un break sin esperar en lugar de acortar el programa.

## 5. Las cadencias

| | valor | de dónde sale |
| --- | --- | --- |
| **el programa** | **29,97** | La mitad exacta de los 59,94 de SPARKS, que es lo que el ADR 0059 permite: se descartan cuadros enteros y no se remuestrea a otra cadencia. Se elige la mitad y no los 59,94 porque el sobre medido del proyecto es de cinco elementos a 30 fps (T-01 de la fase 01) y `race.html` llega a cinco; 59,94 lo duplicaría sin que nada de la demo lo pida. |
| **los creativos** | **30** | Un SVG no tiene cadencia de origen que respetar: no es video filmado ni generado, así que no hay cuadros que duplicar ni que descartar. Es el mismo caso por el que el ADR 0059 deja en 30 lo que nace de una pieza fija, y es el fps del sobre medido. |

> **Nota del 2026-09-22, agregada por la T-12.** Donde la fila del programa dice que `race.html`
> llega a cinco elementos, el máximo real es **cuatro**: tres cámaras más el primario, porque el
> tope de cuatro cajas del ADR 0066 cuenta al programa como una caja. Medido en la T-10. El
> argumento de la fila no cambia: 30 fps sigue estando adentro del sobre de la fase 01.

## 6. El inventario: nueve piezas de autoría, dieciocho assets

Cada forma viaja en los dos medios (ADR 0084). **No son dieciocho piezas de autoría: son
nueve, y nueve corridas del puente de la T-05.**

| # | campaña | forma | SVG autorado (variante imagen) | video (variante rica) | dónde se usa |
| --- | --- | --- | --- | --- | --- |
| 1 | ZUMBRA | 16:9 | `graphics/campaigns/zumbra-16x9.svg` | `content/creatives/zumbra-16x9/index.m3u8` | break A, y el lineal del break A |
| 2 | ZUMBRA | banner | `graphics/campaigns/zumbra-banner.svg` | `content/creatives/zumbra-banner/index.m3u8` | `race.html` |
| 3 | ZUMBRA | backplate | `graphics/campaigns/zumbra-backplate.svg` | `content/creatives/zumbra-backplate/index.m3u8` | `race.html` |
| 4 | KETRAVA | 16:9 | `graphics/campaigns/ketrava-16x9.svg` | `content/creatives/ketrava-16x9/index.m3u8` | el lineal del break B |
| 5 | KETRAVA | banner | `graphics/campaigns/ketrava-banner.svg` | `content/creatives/ketrava-banner/index.m3u8` | `race.html` |
| 6 | KETRAVA | backplate | `graphics/campaigns/ketrava-backplate.svg` | `content/creatives/ketrava-backplate/index.m3u8` | break B |
| 7 | KOVRIN | 16:9 | `graphics/campaigns/kovrin-16x9.svg` | `content/creatives/kovrin-16x9/index.m3u8` | el lineal del break C |
| 8 | KOVRIN | banner | `graphics/campaigns/kovrin-banner.svg` | `content/creatives/kovrin-banner/index.m3u8` | break C |
| 9 | KOVRIN | backplate | `graphics/campaigns/kovrin-backplate.svg` | `content/creatives/kovrin-backplate/index.m3u8` | `race.html` |

Los `type` son `image/svg+xml` para la columna del SVG y `application/vnd.apple.mpegurl` para
la del video.

**El par usa cinco de las nueve piezas y `race.html` usa las otras cuatro.** Eso es lo que
hace que las nueve existan y no tres: sin la tercera página, cuatro formas no tendrían dónde
verse.

## 7. El desvío: los SVG autorados van a `graphics/`, no a `content/`

**El `TASKS.md` dice que los nueve SVG viven en `demo/stage-pair/content/`** (DoD de la T-04),
y no pueden vivir ahí. La razón es medible:

```
$ git check-ignore -v demo/stage-pair/content/zumbra-16x9.svg
.gitignore:4:content/	demo/stage-pair/content/zumbra-16x9.svg
```

`content/` está gitignoreado, y el propio `.gitignore` argumenta la regla con el criterio que
da la respuesta: es *"the packaged content… que cualquier clone puede reconstruir con un
comando"*. **Nueve SVG escritos a mano no son eso.** Si van ahí, un clone limpio se queda sin
creativos, ningún script los puede rehacer, y la fase pierde de git justo aquello sobre lo que
apoya su tesis: que los creativos están escritos a mano y no generados.

**El precedente del repositorio dice lo contrario del `TASKS.md`**, y está medido:

```
$ git ls-files demo/hydration-break/graphics/ | wc -l
18
$ git ls-files demo/hydration-break/content/ | wc -l
0
```

**Y ese cero va con su control, porque un cero lo produce igual una consulta rota que una
carpeta fuera de git:**

```
$ git ls-files demo/hydration-break/js/ | wc -l
5          <- el instrumento sabe encontrar
$ ls demo/hydration-break/content/ | wc -l
5          <- la carpeta existe y tiene cinco entradas: el cero de arriba es de git, no del disco
```

O sea: los SVG autorados trackeados en `graphics/`, la salida empaquetada fuera de git en
`content/`.

**Lo que se hace en su lugar**, y es lo que este documento y `stage.json` ya declaran:

- los nueve SVG viven en **`demo/stage-pair/graphics/campaigns/`** y van a git;
- la **variante de imagen** se sirve desde ese mismo archivo autorado, así que su `uri` en el
  asset-list magro apunta a `/graphics/campaigns/…svg`;
- la **variante de video** es salida del puente de la T-05 y sí vive en `content/`, que es
  exactamente lo que `content/` significa en este repositorio.

Alcanza a la T-04 (dónde se escriben), a la T-06 (de ahí salen los `uri` de los seis
asset-lists) y a la T-11 (el `CREDITS.md` audita las dos carpetas y no sólo `content/`).
