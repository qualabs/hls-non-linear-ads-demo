#!/usr/bin/env python3
"""generar-programa.py -- las catorce casillas del programa de la carrera, y su receta.

EL ADR 0061 MANDA QUE LA RECETA VIVA CON EL GENERADOR, asi que los catorce prompts estan
aca adentro y no en un documento al lado. Lo que el documento de la task agrega es el
porque de la FORMA del prompt; lo que esta aca es el texto exacto que viaja.

----------------------------------------------------------------------------------------
POR QUE ESTO ES PYTHON Y NO BASH, que es lo que usa el resto del repositorio
----------------------------------------------------------------------------------------
Por dos razones y las dos son de esta task:

  1. SE DISPARAN DIEZ A LA VEZ Y SE POLLEAN JUNTAS. Catorce generaciones de a una son tres
     horas de reloj esperando; lanzadas juntas son veinte minutos. En bash eso es un
     manojo de subprocesos y archivos de estado; aca es una lista.

  2. UN SCRIPT QUE CORRE NO SE EDITA, y en bash eso no es una recomendacion: `bash` lee el
     script por tramos mientras corre, asi que editarlo a mitad de corrida mata el proceso.
     A la T-02 le costo una corrida (la generacion quedo hecha en Vertex y sin bajar, y se
     recupero por el `operationName`). Python lee el archivo entero antes de ejecutar una
     linea, asi que el mismo error no cuesta nada.

----------------------------------------------------------------------------------------
LA FORMA DEL PROMPT, Y POR QUE ES OTRA QUE LA DEL SONDEO
----------------------------------------------------------------------------------------
El sondeo de la T-02 midio que el parrafo del mundo se come la instruccion de camara:
tres generaciones seguidas pidieron un aereo y las tres volvieron a nivel de pista; la
cuarta, sin el parrafo del mundo y con la misma instruccion de camara, devolvio el cenital
a la primera.

Lo que el sondeo NO probo -- y se lee mal en su informe -- es "poner la clase de toma
primera", porque en el clip C la clase de toma era la primera linea de SU bloque pero el
bloque entero seguia entrando despues de las 190 palabras del mundo. En el prompt completo
la camara nunca estuvo primera. Aca si.

La forma nueva mueve tres cosas:

  1. LA CAMARA ES LO PRIMERO Y LO ULTIMO DEL PROMPT. El mundo queda en el medio, que es
     donde va un fondo constante. Primera y ultima posicion son las dos que un modelo de
     lenguaje pondera mas, y la instruccion que tiene que ganar ocupa las dos.

  2. EL MUNDO PIERDE TODA PALABRA QUE IMPLIQUE UN PUNTO DE VISTA. "Beyond the barriers:"
     no es una descripcion del lugar, es una instruccion de camara disfrazada: dice donde
     esta parado el que mira -- de este lado de las vallas, a nivel de pista. Lo mismo
     "wind over the camera" y "on the horizon". El mundo de aca enumera lo que hay en el
     circuito sin decir desde donde se ve. Los sustantivos y sus adjetivos se conservan
     letra por letra, porque de ellos depende que catorce cortes se lean como la misma
     carrera, y eso el sondeo lo midio andando (2,1 a 6,0 de dE00 entre clips contra 14 a
     19 del control de luz y 18 a 22 del control de lugar).

  3. CADA BLOQUE DICE QUE ES. "CAMERA", "IN FRAME", "THE CARS IN THIS SHOT", "THE PLACE",
     "SOUND". Un parrafo sin rotulo compite con los demas por ser el tema del prompt.

----------------------------------------------------------------------------------------
LA GEOMETRIA DEL CIRCUITO: EL MODELO LA PIERDE CUANDO LOS AUTOS PASAN POR LA CAMARA
----------------------------------------------------------------------------------------
Diez de las catorce casillas Nicolas las dio por buenas y cuatro no -- la 1, la 5, la 10 y
la 12 --, y lo que describe de las cuatro es siempre lo mismo: autos que en un momento van
para el otro lado, un auto que da vuelta y una pista que se genera rara, una continuidad
que se corta, un auto que se regenera.

LO QUE LAS CUATRO PIDEN Y NINGUNA APROBADA NECESITA: que los autos CRUCEN LA POSICION DE
LA CAMARA. Las cuatro tienen "past the camera" o "towards the camera" escrito en el bloque
de camara; las diez aprobadas lo tienen dos veces (casillas 2 y 6) y en las dos el modelo
lo ignoro y entrego un seguimiento. La cuenta esta medida sobre los catorce prompts:

    frase en el prompt          rechazadas (4)   aprobadas (10)
    "past the camera"                4                2
    "towards the camera"             2                0
    "with a long lens"               3                6      <- no separa nada

La tercera fila importa tanto como las dos primeras: el teleobjetivo parecia la receta
cuando se miraron los catorce originales, y despues de regenerar quedo en las dos listas.
Lo que separa es el cruce.

POR QUE ROMPE. Cuando el auto pasa al lado de la camara, la camara tiene que barrer medio
circulo en menos de un segundo, y del otro lado el modelo ya no tiene de donde copiar el
mundo: lo inventa. Ahi aparecen la calzada nueva, el auto que se vuelve otro auto o cambia
de color, el segundo auto que desaparece, y --lo que Nicolas nombra primero-- el sentido
de marcha dado vuelta, porque un auto que venia de frente pasa a irse de espaldas en el
mismo clip.

Y HAY UNA TOMA QUE EL MODELO SI SOSTIENE, que es la que tienen todas las aprobadas cuando
se las mira cuadro a cuadro: la camara VIAJA AL LADO de los autos a su misma velocidad,
los autos se quedan en el mismo lugar del cuadro los ocho segundos, y lo que se mueve es
el fondo. El auto nunca deja de estar en cuadro, asi que nunca hay que volver a dibujarlo.

LAS TRES PALANCAS, en orden de cuanto pagan:

  1. QUE LOS AUTOS NO PASEN POR LA CAMARA. El bloque `SEGUIMIENTO` pide la toma de arriba
     en positivo -- la camara va con ellos, la distancia no cambia, el fondo pasa -- y deja
     una sola negacion, "never turns round to look back down the road", porque un
     MOVIMIENTO DE CAMARA no es un objeto que se pueda pintar, a diferencia de `boards` o
     de `lettering`.

  2. PEDIR UN SOLO MOVIMIENTO POR CLIP. Una chicana, unas eses o una frenada con entrada a
     la curva son dos cambios de sentido en ocho segundos, y ahi el modelo suelta los dos
     bordes de la calzada: los pianos quedan como franjas sueltas sobre asfalto abierto y
     el auto termina en una explanada. Es la misma leccion del encuadre --se nombra el
     plano y no se dan las coordenadas-- aplicada a la accion: se nombra UNA cosa que el
     auto hace. Por eso ninguna de las cuatro nombra ya la curva donde ocurria.

  3. EL BLOQUE `CALZADA`, que declara que hay UNA sola calzada con sus dos bordes corridos
     de punta a punta y que todos los autos van para el mismo lado todo el clip. Escrito en
     positivo por la misma razon que la seccion de abajo: nombrar lo prohibido le da
     permiso.

Y la toma se dice en `CAMERA` y en `CAMERA, AGAIN`, que son las dos posiciones que el
hallazgo del encuadre midio como las que ganan.

LAS DIEZ APROBADAS NO LLEVAN NINGUNO DE LOS BLOQUES NUEVOS -- salvo la 6, que lleva
`PISTA`, la calzada mas una camara quieta --. Volvieron bien asi, y su `.prompt.txt` tiene
que seguir siendo el texto que de verdad viajo a Vertex. Para la etapa 2 -- ocho clips
seguidos de la misma cabina -- `CALZADA` conviene desde el principio: una camara de a bordo
es el caso donde menos calzada hay en cuadro, que es justo lo que rompio la casilla 12.

----------------------------------------------------------------------------------------
LA TIPOGRAFIA Y LAS VALLAS: LA HIPOTESIS ES QUE LA PROHIBICION NOMBRA LO PROHIBIDO
----------------------------------------------------------------------------------------
El sondeo volvio con renglones de letras en el morro y con carteles rojos en las vallas, y
concluyo que "no parece arreglable por prompt" porque la prohibicion ya estaba escrita con
su alternativa, que es la receta de la fase 08.

Hay una lectura mas fina y es la que este prompt prueba: **la alternativa nombraba el
objeto prohibido**. El mundo del sondeo decia que las vallas estan "faced with boards
painted in wide diagonal bands" -- y `boards` es exactamente la palabra de los carteles de
publicidad de un circuito. Y del auto decia "there is no number, no lettering, no logo and
no sponsor marking anywhere on the car, on the driver's helmet or on the team clothing":
cuatro menciones de tipografia en una sola oracion. La regla de la fase 08 tiene dos
mitades y la segunda es "describir de mas le da permiso".

Asi que aca:

  - Las vallas son "bare grey concrete walls painted in wide diagonal bands of white and
    slate grey". Desaparece la palabra `boards`.
  - El auto no lleva una lista de prohibiciones sino una descripcion positiva de la
    superficie: "The paint is the whole livery: clean, smooth, unbroken bodywork, straight
    out of the paint shop". Se nombra una cosa que existe en el mundo y que no tiene
    letras, en lugar de nombrar las letras para prohibirlas.

Si vuelve igual, la hipotesis era falsa y lo que corresponde es medir con que frecuencia
aparece y cuanto cuesta regenerar, que es lo que hace el informe de la task.

Y HAY UNA SEGUNDA MITAD DE LA MISMA REGLA, QUE ES LA QUE ROMPIO LA CASILLA 10: si nombrar
lo prohibido le da permiso, NOMBRAR UNA MARCA SE LO DA TAMBIEN, y no hace falta pedirla.
La casilla 10 volvio con `Apple` escrito en el ponton del auto verde, con su tipografia y
media manzana roja al lado, y con `Apple` repetido en los carteles de la valla. El prompt
no pide ninguna marca en ningun lado. Lo que si tiene es el nombre del color:

    BRIGHT APPLE GREEN

La cuenta separa limpio y esta medida sobre los catorce prompts. La palabra `APPLE` esta
en las catorce, porque el padron de seis colores va en el bloque del mundo. Lo que cambia
es si ademas esta en `THE CARS IN THIS SHOT`, que es el bloque que dice que hay EN CUADRO:

    APPLE en el bloque de la casilla     la 1, la 4, la 6, la 7, la 10, la 11, la 14
    APPLE solo en el padron del mundo    la 2, la 3, la 5, la 8, la 9, la 12, la 13

La casilla 5 es la unica de las catorce que volvio sin una sola letra en la carroceria, y
es del segundo grupo. La 10 es del primero, y el auto que lleva la marca pintada es
exactamente el auto cuyo color se nombro en ese bloque. El resto del prompt describe una
transmision deportiva, que es un genero lleno de marcas: el modelo tiene el hueco y una
sola palabra candidata para llenarlo.

EL ARREGLO ES SACAR LA PALABRA, NO PROHIBIRLA. Escribir "sin logos de Apple" es la peor
forma de pedirlo, por la misma regla de arriba. La casilla 10 renombra su verde a
`BRIGHT LIME GREEN` en TODO su prompt, el padron del mundo incluido, y no se agrega ni una
negacion. `LIME` se eligio por hue y no por sonar bien: el verde que Veo dibujo para
`APPLE GREEN` es un verde amarillento, que es donde cae `lime`, y correrlo hacia el azul
--emerald, shamrock-- lo acercaria a BRIGHT AQUAMARINE, que es otro de los seis.

Las otras trece no se tocan: volvieron aprobadas y su `.prompt.txt` tiene que seguir siendo
el texto que de verdad viajo. Por eso el renombre es por casilla y no una edicion del
padron.

LA PROHIBICION DE HABLA SI SE QUEDA (`No speech, no commentary, no music`). El riesgo R3
es caro -- la demo del partido volvio con dialogo en ingles entre los jugadores -- y el
sondeo midio que con esta linea puesta ninguno de los tres clips trajo una palabra.

----------------------------------------------------------------------------------------
LOS COLORES: ACA SE PIDEN PALABRAS Y NO SE ESPERAN HEXADECIMALES
----------------------------------------------------------------------------------------
Las seis palabras de color son las que la T-01 dejo escritas y las que el clip C del
sondeo probo que devuelven seis autos distintos entre si (minima mutua 16,3 contra 8,0 sin
la lista numerada). Lo que cambia respecto de la T-01 es que NO se espera que el
hexadecimal de vuelta sea el de la ficha: los hexadecimales de `race.json` se miden sobre
estos catorce clips, porque el que dibuja lo que el espectador ve es Veo y no el generador
de imagenes con el que se calibraron las fichas.

EL PADRON DE SEIS COLORES VA EN EL BLOQUE DEL MUNDO, o sea en las catorce, y no solo en
las casillas donde estan los seis. El sondeo dejo el hallazgo H2: las cuatro casillas de
plano general no nombraban ningun color y Veo elegia, distinto cada vez. Con el padron en
el mundo, toda casilla sabe cual es la paleta de la carrera aunque muestre un auto solo.

Y NINGUNA CASILLA TIENE UN AUTO SIN NOMBRAR. El plan de tomas de la T-01 escribia la
casilla 7 como "toma a un auto mas lento", sin decir cual: un auto sin color declarado es
un septimo color en pantalla en una demo que promete seis. Va nombrado (PENTAV), y el plan
de tomas quedo actualizado con eso.

----------------------------------------------------------------------------------------
EL TOPE ES DURO Y ESTA EN EL CODIGO
----------------------------------------------------------------------------------------
El techo de la etapa 1 es de US$30,00 -- subio de US$26,00, y antes de US$22,40, cada vez
que Nicolas decidio pagar otra tanda de regeneraciones; la ultima para sacarle la marca a
la casilla 10 -- y el sondeo de la T-02 gasto US$3,20 que no pasan por este registro, asi
que contra este archivo el techo son US$26,80, o sea 33 generaciones a US$0,80. Ese es el
tope de aca.

EL REGISTRO CUENTA LANZAMIENTOS Y NO CLIPS, y esa diferencia costo dos lineas: de las
cuatro de la regeneracion, dos volvieron con `code 14, Service is currently unavailable` de
Vertex, o sea `done: true` y sin video. Se anotan igual --lo que se cuenta es lo que se
pidio-- y volver a pedirlas gasta dos lineas mas. Contar clips en vez de lanzamientos
convertiria cada error del servicio en presupuesto invisible.

El tope no depende de que alguien se acuerde: cada lanzamiento escribe una linea en el
registro, y el script se niega a lanzar si la proxima linea pasaria de 28. El registro vive
en la carpeta de la task y no en la de salida, porque es la evidencia del gasto y tiene que
sobrevivir a que se borren los clips.

    ./generar-programa.py 4 8          lanza esas dos casillas
    ./generar-programa.py 1-14         lanza las que falten de las catorce
    ./generar-programa.py --regenerar 7   vuelve a generar la 7 aunque ya exista

Un clip que ya esta no se regenera, asi que volver a correrlo no gasta.
"""
import base64
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

RAIZ = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
DEST = os.path.join(RAIZ, "content", ".fuentes", "programa")
REGISTRO = os.path.abspath(os.path.join(
    RAIZ, "..", "..", ".project", "phases", "13-la-carrera-donde-cada-uno-mira-su-auto",
    "tasks", "T-03-el-programa", "salidas", "registro-de-generaciones.tsv"))

MODELO = os.environ.get("VEO_MODELO", "veo-3.1-fast-generate-001")
REGION = "us-central1"
SEGUNDOS = 8
PRECIO_POR_SEGUNDO = 0.10          # US$/s, 720p con audio, releido de Vertex el 2026-09-12
TOPE_GENERACIONES = 33             # US$26,40 aca + US$3,20 del sondeo = el techo de la etapa.
LOTE = 10                          # cuantas se lanzan a la vez

# ---------------------------------------------------------------------------------------
# LOS BLOQUES CONSTANTES. Van identicos en las catorce y son lo que hace que catorce
# generaciones separadas se lean como una sola carrera.
# ---------------------------------------------------------------------------------------

LUGAR = (
    "THE PLACE -- the same circuit, the same weather and the same hour in every shot of "
    "this race. A fictional single-seater championship on a wide, flat coastal circuit. "
    "Late afternoon under a high, even overcast: soft flat light, no sun, no hard shadows, "
    "no lens flare. Dry mid-grey asphalt, plain white edge lines, wide kerbs painted in "
    "alternating white and red blocks at the corners. Along the track: low green coastal "
    "scrub, bare grey concrete walls painted in wide diagonal bands of white and slate "
    "grey, a grey grandstand with a sparse crowd, a flat grey sea and a pale sky. Daylight "
    "throughout: no rain, no night, no floodlights."
)

AUTOS = (
    "THE CARS -- contemporary open-cockpit single-seaters with exposed wheels, matt black "
    "tyres on plain dark grey rims. Six cars run in this championship and they are told "
    "apart by their paint alone: BRIGHT LEMON YELLOW, BRIGHT ELECTRIC PURPLE, BRIGHT "
    "AQUAMARINE, DEEP PLUM MAGENTA, BRIGHT APPLE GREEN and DARK BRONZE GOLD. Each car is "
    "that one flat colour over its whole body, with a single accent stripe running from "
    "the nose to the tail, and the driver's helmet is painted the same colour as its car. "
    "The paint is the whole livery: clean, smooth, unbroken bodywork, straight out of the "
    "paint shop."
)

SONIDO = (
    "SOUND: engines, tyres scrubbing on asphalt, rushing air and a distant crowd. "
    "No speech, no commentary, no music."
)

UNICIDAD = (
    "All the colours in frame are different from one another: no two cars share a colour "
    "and no colour is repeated anywhere."
)

# EL BLOQUE DE LA CALZADA. Dice lo que ninguna otra parte del prompt dice: que hay UNA
# sola calzada, con sus dos bordes corridos de punta a punta, y que todos los autos van
# PARA EL MISMO LADO todo el clip. El porque esta arriba, en "LA GEOMETRIA DEL CIRCUITO".
CALZADA = (
    "THE TRACK IN THIS SHOT: one single road, and the whole shot happens on it. One strip "
    "of grey asphalt runs through the frame, bounded on one side by a painted kerb with "
    "grass beyond it and on the other by the barrier wall, and those two edges run along "
    "it unbroken from the first frame to the last. Every car in the shot runs the same way "
    "down that road for the whole eight seconds, moving forward all the time and holding "
    "one heading: no car ever turns back on itself."
)

# LA CAMARA QUIETA. Es la calzada mas una camara que no se muda de lugar, y es la unica
# forma que viajo en la casilla 6, que Nicolas dio por buena. Va aparte porque su ultima
# oracion --la camara clavada en el piso-- es justo lo que las cuatro casillas del
# seguimiento NO piden.
PISTA = CALZADA + (
    " The camera keeps its place on the "
    "ground beside the track, so whatever stands behind the road at the start of the shot "
    "is still behind it at the end."
)

# EL BLOQUE DEL SEGUIMIENTO. Pide la toma que las diez aprobadas tienen y las cuatro
# rechazadas no: la camara viaja al lado de los autos a su misma velocidad, los sostiene
# en el mismo lugar del cuadro los ocho segundos, y nunca los deja pasar. El porque esta
# arriba, en "LA GEOMETRIA DEL CIRCUITO".
SEGUIMIENTO = (
    "THE CAMERA IN THIS SHOT: the camera travels along the track alongside the car or cars "
    "it is following, at their speed and level with them, looking across at them from the "
    "side. They keep the same place and the same size in the frame from the first frame to "
    "the last, and the distance between them and the camera never changes, so the road, "
    "the kerb, the barrier and everything behind them stream past for the whole eight "
    "seconds. The camera holds one heading all the way through, the same heading they "
    "hold, and it never turns round to look back down the road."
)

# ---------------------------------------------------------------------------------------
# LAS CATORCE CASILLAS. Cada una es (numero, nombre, camara, en_cuadro, autos, camara_otra_vez).
#
# `camara` es lo PRIMERO del prompt y `camara_otra_vez` lo ULTIMO, y esa es la forma entera.
# Las dos dicen lo mismo con otras palabras a proposito: la primera pone la camara en el
# mundo, la ultima la vuelve a poner despues de que el mundo hablo.
# ---------------------------------------------------------------------------------------

CASILLAS = [
    dict(
        n=1, nombre="01-los-seis-trackside",
        # TOMA DE SEGUIMIENTO. La casilla necesita los seis autos en cuadro y que no pase
        # nada mas, asi que es la que menos tiene para perder sacandole el cruce: los seis
        # bajan la recta costera y la camara va con ellos. Es la forma de la casilla 13
        # con seis autos en vez de dos.
        seguimiento=True,
        camara="CAMERA: television race coverage, with a long lens. The camera runs "
               "alongside the six cars at their own speed, down a long straight on the "
               "coastal side of the circuit, and holds all six of them in the frame, seen "
               "from the side.",
        cuadro="IN FRAME: the six cars in a tight train seen from the side, one behind the "
               "other and all six in the frame at once, with the road under them and the "
               "barrier, the dunes and the grey sea streaming past behind them.",
        autos="THE CARS IN THIS SHOT: all six, in running order from the front -- 1st BRIGHT "
              "LEMON YELLOW, 2nd BRIGHT ELECTRIC PURPLE, 3rd BRIGHT AQUAMARINE, 4th DEEP PLUM "
              "MAGENTA, 5th BRIGHT APPLE GREEN, 6th DARK BRONZE GOLD. " + UNICIDAD,
        otra="CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the six cars "
             "at their own speed, level with them and looking across at them from the side. "
             "It keeps the same distance from them for the whole shot.",
    ),
    dict(
        n=2, nombre="02-caldrix-seguimiento",
        camara="CAMERA: television race coverage, trackside camera position with a long lens. "
               "A broadcast camera stands at the outside of a long corner and follows one car "
               "through it, panning to keep it in frame as it goes past. The camera is on the "
               "ground at the edge of the circuit and stays there.",
        cuadro="IN FRAME: one car alone through a long corner, seen from the side of the "
               "track, filling the right half of the frame, with the kerb under its wheels.",
        autos="THE CARS IN THIS SHOT: one only, the BRIGHT LEMON YELLOW car. No other car is "
              "in frame.",
        otra="CAMERA, AGAIN: a long-lens trackside broadcast camera panning with the car from "
             "the edge of the circuit.",
    ),
    dict(
        n=3, nombre="03-caldrix-marvok-rebufo",
        camara="CAMERA: television race coverage, trackside camera position with a long lens. "
               "A broadcast camera stands at the exit of a corner and pans with two cars as "
               "they come through it and accelerate away.",
        cuadro="IN FRAME: two cars through a corner, seen from the side of the track. The "
               "second sits right behind the first through the turn and pulls out of its "
               "slipstream on the exit, looking for a way past.",
        autos="THE CARS IN THIS SHOT: two only -- the BRIGHT LEMON YELLOW car in front and the "
              "BRIGHT ELECTRIC PURPLE car behind it. " + UNICIDAD,
        otra="CAMERA, AGAIN: a long-lens trackside broadcast camera at the exit of the corner, "
             "panning with the two cars.",
    ),
    dict(
        n=4, nombre="04-los-seis-aereo",
        camara="CAMERA: television race coverage, helicopter shot. The coverage cuts to the "
               "helicopter camera, high in the air above the circuit and looking down at the "
               "main straight from the sky. The whole shot is filmed from the helicopter: "
               "everything is seen from above and nothing in it is at track level. The "
               "helicopter drifts slowly forward along the straight.",
        cuadro="IN FRAME: the main straight seen from the air, with the six cars running down "
               "it one behind the other with clear gaps between them. The cars are seen from "
               "above, their painted engine covers and rear wings facing the camera. The "
               "grandstand runs along one side of the straight and the grey sea lies on the "
               "other.",
        autos="THE CARS IN THIS SHOT: all six, in running order from the front -- 1st BRIGHT "
              "LEMON YELLOW, 2nd BRIGHT ELECTRIC PURPLE, 3rd BRIGHT AQUAMARINE, 4th DEEP PLUM "
              "MAGENTA, 5th BRIGHT APPLE GREEN, 6th DARK BRONZE GOLD. " + UNICIDAD,
        otra="CAMERA, AGAIN: the helicopter camera, looking down at the track from the air. "
             "Nothing in this shot is filmed from track level.",
    ),
    dict(
        n=5, nombre="05-noctev-chicana",
        # TOMA DE SEGUIMIENTO. La chicana se fue entera: es el lugar del circuito donde el
        # auto cambia de sentido dos veces, y ninguna version que la nombraba sobrevivio.
        # Lo que la casilla tiene que entregar es NOCTEV identificable por su color, y eso
        # se consigue con el auto solo a fondo por un tramo abierto. La linea del relato
        # que nombraba la chicana se reescribe, que es lo barato.
        seguimiento=True,
        camara="CAMERA: television race coverage, with a long lens. The camera runs "
               "alongside one car at its own speed, down a fast open stretch of the "
               "circuit, and holds the whole car in the frame, seen from the side.",
        cuadro="IN FRAME: one car alone at full speed, seen from the side, the whole car "
               "from its front wing to its rear wing filling the middle of the frame, with "
               "the kerb, the barrier and the grandstand streaming past behind it.",
        autos="THE CARS IN THIS SHOT: one only, the BRIGHT AQUAMARINE car. No other car is in "
              "frame.",
        otra="CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car at "
             "its own speed, level with it and looking across at its flank. It keeps the "
             "same distance from the car for the whole shot.",
    ),
    dict(
        n=6, nombre="06-runtak-pentav-frenada",
        # REGENERADA POR GEOMETRIA. La primera version pedia la frenada Y la entrada a la
        # curva ("as they turn in"): los autos llegaban de frente a la camara y despues
        # doblaban, y esos dos sentidos seguidos en ocho segundos se leen como una vuelta
        # en U y los autos yendo para atras. Aca se filma SOLO la frenada, sin la entrada:
        # los dos autos vienen por la recta y pasan. El relato --"side by side into the
        # braking zone, and neither of them lifts"-- sigue siendo lo que se ve.
        pista=True,
        camara="CAMERA: television race coverage, trackside camera position with a long "
               "lens. A broadcast camera stands at the edge of the circuit beside the braking "
               "zone at the end of a long straight, and pans with two cars as they brake side "
               "by side and come past the camera still side by side.",
        cuadro="IN FRAME: two cars side by side under braking at the end of the straight, "
               "seen from the side of the track, wheel to wheel and neither giving way, brake "
               "dust off the discs and one front wheel locking and smoking, the two of them "
               "staying alongside each other all the way past the camera.",
        autos="THE CARS IN THIS SHOT: two only -- the DEEP PLUM MAGENTA car and the BRIGHT "
              "APPLE GREEN car, side by side. " + UNICIDAD,
        otra="CAMERA, AGAIN: a long-lens trackside broadcast camera beside the braking zone. "
             "The two cars come down the road side by side and go past the camera, both "
             "running the same way; the camera stays at the edge of the track.",
    ),
    dict(
        n=7, nombre="07-quentra-sobrepaso",
        camara="CAMERA: television race coverage, low trackside camera position. A broadcast "
               "camera sits on the ground at the apex of a corner, right beside the kerb and "
               "at wheel height, and pans with the cars as they come through and go away.",
        cuadro="IN FRAME: two cars arrive at the corner one behind the other and the one "
               "behind takes the other around the outside, running close to the kerb on the "
               "way out. Seen low, from the edge of the track.",
        autos="THE CARS IN THIS SHOT: two only -- the DARK BRONZE GOLD car, which does the "
              "overtaking, and the BRIGHT APPLE GREEN car, which is overtaken. " + UNICIDAD,
        otra="CAMERA, AGAIN: a low trackside broadcast camera at the apex, at wheel height, "
             "panning with the cars.",
    ),
    dict(
        n=8, nombre="08-caldrix-cerrado",
        # DOS INTENTOS DE ESTA CASILLA VOLVIERON CON LA CAMARA MONTADA EN EL AUTO, y los dos
        # la pedian en geometria: "a camera car running alongside at the same speed, level
        # with it". El tercero la pide como lo que es -- una camara de transmision al borde
        # de la pista con teleobjetivo -- y esa es la diferencia. Importa mas que en el resto
        # de las casillas: esta es el cruce de la compuerta 2, CALDRIX visto DESDE AFUERA
        # adentro de la ventana, para poder compararlo contra su propia camara de a bordo. Un
        # plano de a bordo aca mata la comparacion, porque serian dos veces la misma cosa.
        camara="CAMERA: television race coverage, trackside camera position with a long lens, "
               "held tight on one car. A broadcast camera stands at the edge of the circuit on "
               "the outside of a long left-hander and pans with the car as it comes through, "
               "close enough that the car fills the frame. The camera is on the ground beside "
               "the track and this is not an on-board camera.",
        cuadro="IN FRAME: one car alone through a long left-hander, seen from the side of the "
               "track, the whole car from the front wing to the rear wing filling the frame, "
               "with the kerb and the barrier sweeping past behind it.",
        autos="THE CARS IN THIS SHOT: one only, the BRIGHT LEMON YELLOW car. No other car is "
              "in frame.",
        otra="CAMERA, AGAIN: a long-lens trackside broadcast camera panning with the car from "
             "the edge of the circuit. The camera is never on board the car.",
    ),
    dict(
        n=9, nombre="09-marvok-noctev-curvon",
        camara="CAMERA: television race coverage, trackside camera position with a long lens. "
               "A broadcast camera stands on the outside of a fast sweeping corner and pans "
               "with two cars as they go through it.",
        cuadro="IN FRAME: two cars nose to tail through a fast sweeper, seen from the side of "
               "the track, the second right on the gearbox of the first.",
        autos="THE CARS IN THIS SHOT: two only -- the BRIGHT ELECTRIC PURPLE car in front and "
              "the BRIGHT AQUAMARINE car behind it. " + UNICIDAD,
        otra="CAMERA, AGAIN: a long-lens trackside broadcast camera on the outside of the "
             "sweeper, panning with the two cars.",
    ),
    dict(
        n=10, nombre="10-pentav-quentra-eses",
        # TOMA DE SEGUIMIENTO. Las eses ya no estan y el cruce por camara tampoco: quedan
        # los dos autos juntos por el tramo costero, que es la forma de la casilla 13 con
        # el mar detras. El mar se pide en las dos posiciones que ganan --la primera y la
        # ultima-- porque en la version anterior no aparecio; el relato, igual, ya no
        # depende de que aparezca.
        seguimiento=True,
        camara="CAMERA: television race coverage, with a long lens. The camera runs "
               "alongside two cars at their own speed, along the coastal stretch of the "
               "circuit, with the flat grey sea beyond the barrier behind them, and holds "
               "both of them in the frame, seen from the side.",
        cuadro="IN FRAME: two cars close together, one just ahead of the other, seen from "
               "the side and both in the frame at once, with the barrier and the flat grey "
               "sea streaming past behind them.",
        # Y EL VERDE SE RENOMBRA. La version anterior de esta casilla resolvio la geometria
        # y volvio con `Apple` pintado en el ponton del auto verde y en los carteles de la
        # valla. La unica palabra del prompt que lo invita es el nombre del color, y esta
        # casilla es de las que ademas lo nombran aca, en el bloque de lo que hay en cuadro.
        # El porque completo esta arriba, en "LA TIPOGRAFIA Y LAS VALLAS".
        color_renombrado=("BRIGHT APPLE GREEN", "BRIGHT LIME GREEN"),
        autos="THE CARS IN THIS SHOT: two only -- the BRIGHT APPLE GREEN car and the DARK "
              "BRONZE GOLD car, close together. " + UNICIDAD,
        otra="CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the two cars "
             "at their own speed on the coastal stretch, level with them and looking across "
             "at them, with the flat grey sea behind them for the whole shot.",
    ),
    dict(
        n=11, nombre="11-los-seis-aereo-costa",
        camara="CAMERA: television race coverage, helicopter shot. The coverage cuts to the "
               "helicopter camera, high in the air above the coastal section of the circuit "
               "and looking down at it from the sky. The whole shot is filmed from the "
               "helicopter: everything is seen from above and nothing in it is at track "
               "level. The helicopter moves slowly along the line of the track.",
        cuadro="IN FRAME: the coastal section of the circuit seen from the air, curving "
               "between the green scrub on one side and the grey sea on the other, with the "
               "whole field spread out along it and seen from above.",
        autos="THE CARS IN THIS SHOT: all six, spread along the track -- BRIGHT LEMON YELLOW, "
              "BRIGHT ELECTRIC PURPLE, BRIGHT AQUAMARINE, DEEP PLUM MAGENTA, BRIGHT APPLE "
              "GREEN and DARK BRONZE GOLD. " + UNICIDAD,
        otra="CAMERA, AGAIN: the helicopter camera, looking down at the track from the air. "
             "Nothing in this shot is filmed from track level.",
    ),
    dict(
        n=12, nombre="12-runtak-rueda-piano",
        # TOMA DE SEGUIMIENTO. El piano se queda, porque es lo que el relato mira, pero la
        # camara sube del piso a la altura del auto y se aleja hasta que entra entero: el
        # encuadre a la altura de la rueda dejaba fuera de cuadro casi toda la calzada, y
        # sin calzada el modelo redibuja el auto --y le cambia el color, que en esta demo
        # es la identidad.
        seguimiento=True,
        camara="CAMERA: television race coverage, with a long lens. The camera runs "
               "alongside one car at its own speed while the car runs along the edge of the "
               "track with its near-side wheels up on the painted kerb, and holds the whole "
               "car in the frame, seen from the side.",
        cuadro="IN FRAME: one car seen from the side, the whole car from its front wing to "
               "its rear wing, running along the edge of the road with its near-side wheels "
               "riding the painted white and red kerb and the rear wheel working over the "
               "blocks, with the kerb and the barrier streaming past behind it.",
        autos="THE CARS IN THIS SHOT: one only, the DEEP PLUM MAGENTA car. No other car is in "
              "frame.",
        otra="CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car at "
             "its own speed, level with it and looking across at its flank while its "
             "near-side wheels ride the kerb. It keeps the same distance from the car for "
             "the whole shot.",
    ),
    dict(
        n=13, nombre="13-caldrix-marvok-recta",
        camara="CAMERA: television race coverage, trackside camera position with a long lens. "
               "A broadcast camera stands beside the main straight, in front of the "
               "grandstand, and pans with two cars as they come past at full speed.",
        cuadro="IN FRAME: two cars at full speed down the main straight, seen from the side of "
               "the track, the second right on the tail of the first with the gap closed, the "
               "grandstand behind them.",
        autos="THE CARS IN THIS SHOT: two only -- the BRIGHT LEMON YELLOW car in front and the "
              "BRIGHT ELECTRIC PURPLE car right behind it. " + UNICIDAD,
        otra="CAMERA, AGAIN: a long-lens trackside broadcast camera beside the main straight, "
             "panning with the two cars.",
    ),
    dict(
        n=14, nombre="14-los-seis-tribuna",
        camara="CAMERA: television race coverage, trackside camera position. A fixed broadcast "
               "camera stands on the ground at the edge of the circuit opposite the main "
               "grandstand and films the field as it streams past. The cars enter the frame "
               "from one side, cross it and leave by the other; the camera stays where it is.",
        cuadro="IN FRAME: the main grandstand behind the track with its sparse crowd on its "
               "feet, and the field crossing the frame in a loose train from one side to the "
               "other, seen from the side of the track.",
        autos="THE CARS IN THIS SHOT: all six, in a loose train -- BRIGHT LEMON YELLOW, BRIGHT "
              "ELECTRIC PURPLE, BRIGHT AQUAMARINE, DEEP PLUM MAGENTA, BRIGHT APPLE GREEN and "
              "DARK BRONZE GOLD. " + UNICIDAD,
        otra="CAMERA, AGAIN: a fixed trackside broadcast camera opposite the grandstand. The "
             "cars pass across the frame; the camera stays at the edge of the track.",
    ),
]


def prompt_de(c):
    """El prompt completo de una casilla. La camara primero y la camara ultimo.

    `pista` agrega la calzada mas la camara quieta, y lo lleva solo la casilla 6.
    `seguimiento` agrega la calzada mas la camara que viaja con los autos, y lo llevan las
    cuatro casillas que se regeneraron porque los autos cruzaban la camara. Las diez
    aprobadas no llevan ninguno de los dos, porque volvieron bien sin ellos y su
    `.prompt.txt` tiene que seguir siendo el texto que de verdad viajo.

    `color_renombrado` cambia el nombre de un color en TODO el prompt de esa casilla, y lo
    lleva solo la 10. El reemplazo va sobre el prompt YA ARMADO y no sobre cada bloque,
    porque el nombre del color aparece en dos lugares -- el padron de seis del bloque del
    mundo, que es constante y va en las catorce, y el bloque de esta casilla -- y dejar una
    de las dos apariciones en pie no sirve de nada: alcanza una para invitar la marca.
    """
    bloques = [c["camara"], c["cuadro"]]
    if c.get("pista"):
        bloques.append(PISTA)
    if c.get("seguimiento"):
        bloques += [CALZADA, SEGUIMIENTO]
    bloques += [c["autos"], LUGAR, AUTOS, SONIDO, c["otra"]]
    p = "\n\n".join(bloques)
    if c.get("color_renombrado"):
        viejo, nuevo = c["color_renombrado"]
        if viejo not in p:
            raise SystemExit(
                "casilla %d: color_renombrado pide reemplazar %r y ese texto no esta en el "
                "prompt. El renombre se convirtio en un no-op y el clip saldria con el "
                "nombre viejo sin que nada avise." % (c["n"], viejo))
        p = p.replace(viejo, nuevo)
    return p


# ---------------------------------------------------------------------------------------
# El registro de gasto, que es lo que hace que el tope no dependa de la memoria de nadie.
# ---------------------------------------------------------------------------------------

def generaciones_ya_lanzadas():
    if not os.path.exists(REGISTRO):
        return 0
    with open(REGISTRO) as f:
        return sum(1 for ln in f if ln.strip() and not ln.startswith("#"))


def anotar(casilla, operacion, estado):
    nuevo = not os.path.exists(REGISTRO)
    os.makedirs(os.path.dirname(REGISTRO), exist_ok=True)
    with open(REGISTRO, "a") as f:
        if nuevo:
            f.write("# una linea por GENERACION LANZADA, que es lo que se paga.\n")
            f.write("# fecha\tcasilla\toperacion\tUS$\testado\n")
        f.write("%s\t%s\t%s\t%.2f\t%s\n" % (
            time.strftime("%Y-%m-%dT%H:%M:%S"), casilla, operacion,
            SEGUNDOS * PRECIO_POR_SEGUNDO, estado))


# ---------------------------------------------------------------------------------------
# Vertex
# ---------------------------------------------------------------------------------------

def sh(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout.strip()


def post(url, token, cuerpo):
    req = urllib.request.Request(
        url, data=json.dumps(cuerpo).encode(),
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return {"error": {"http": e.code, "body": e.read().decode()[:600]}}


def main():
    args = [a for a in sys.argv[1:]]
    regenerar = "--regenerar" in args
    args = [a for a in args if a != "--regenerar"]
    if not args:
        sys.exit(__doc__.splitlines()[0] + "\n  uso: generar-programa.py <casillas: 4 8 | 1-14>")

    pedidas = []
    for a in args:
        if "-" in a:
            d, h = a.split("-")
            pedidas += list(range(int(d), int(h) + 1))
        else:
            pedidas.append(int(a))

    os.makedirs(DEST, exist_ok=True)
    porhacer = []
    for n in pedidas:
        c = next(x for x in CASILLAS if x["n"] == n)
        salida = os.path.join(DEST, c["nombre"] + ".mp4")
        if os.path.exists(salida) and os.path.getsize(salida) > 0 and not regenerar:
            print("== casilla %2d (%s): ya esta, no se regenera ==" % (n, c["nombre"]))
            continue
        porhacer.append(c)
    if not porhacer:
        print("nada para generar")
        return

    ya = generaciones_ya_lanzadas()
    if ya + len(porhacer) > TOPE_GENERACIONES:
        sys.exit("TOPE: hay %d generaciones lanzadas y se piden %d; el tope de la T-03 es %d "
                 "(US$%.2f). Corre menos casillas o cierra la task con lo que hay."
                 % (ya, len(porhacer), TOPE_GENERACIONES, TOPE_GENERACIONES * SEGUNDOS
                    * PRECIO_POR_SEGUNDO))

    token = sh("gcloud auth print-access-token")
    proyecto = sh("gcloud config get-value project")
    if not token or not proyecto:
        sys.exit("sin credenciales: gcloud auth login")
    base = ("https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/"
            "google/models/%s" % (REGION, proyecto, REGION, MODELO))

    print("== %d generacion(es), %s, %ds, 720p, con audio -- US$%.2f ==\n"
          % (len(porhacer), MODELO, SEGUNDOS, len(porhacer) * SEGUNDOS * PRECIO_POR_SEGUNDO))

    for i in range(0, len(porhacer), LOTE):
        lote = porhacer[i:i + LOTE]
        vivas = []
        for c in lote:
            p = prompt_de(c)
            # El prompt queda escrito al lado del clip: sin eso, el clip es un mp4 del que
            # nadie sabe que se le pidio, y todo el trabajo es comparar lo que volvio contra
            # lo que se pidio.
            with open(os.path.join(DEST, c["nombre"] + ".prompt.txt"), "w") as f:
                f.write(p + "\n")
            r = post(base + ":predictLongRunning", token, {
                "instances": [{"prompt": p}],
                "parameters": {"aspectRatio": "16:9", "sampleCount": 1,
                               "durationSeconds": SEGUNDOS, "resolution": "720p",
                               "generateAudio": True}})
            op = r.get("name")
            if not op:
                print("  casilla %2d: ERROR al lanzar -- %s" % (c["n"], json.dumps(r)[:400]))
                anotar(c["n"], "(sin operacion)", "ERROR-AL-LANZAR")
                continue
            anotar(c["n"], op, "lanzada")
            vivas.append((c, op))
            print("  casilla %2d (%s)  op %s" % (c["n"], c["nombre"], op.split("/")[-1]))

        print("\n  ... esperando %d generacion(es)" % len(vivas))
        pendientes = list(vivas)
        for vuelta in range(60):
            if not pendientes:
                break
            time.sleep(15)
            siguen = []
            for c, op in pendientes:
                e = post(base + ":fetchPredictOperation", token, {"operationName": op})
                if not e.get("done"):
                    siguen.append((c, op))
                    continue
                salida = os.path.join(DEST, c["nombre"] + ".mp4")
                if "error" in e:
                    print("  casilla %2d: Vertex devolvio error: %s"
                          % (c["n"], json.dumps(e["error"])[:300]))
                    continue
                vids = (e.get("response") or {}).get("videos") or []
                if not vids or not vids[0].get("bytesBase64Encoded"):
                    print("  casilla %2d: termino sin video -- %s"
                          % (c["n"], json.dumps(e)[:300]))
                    continue
                with open(salida, "wb") as f:
                    f.write(base64.b64decode(vids[0]["bytesBase64Encoded"]))
                dur = sh("ffprobe -v error -show_entries format=duration -of csv=p=0 '%s'" % salida)
                print("  casilla %2d LISTA  %s  (%ss, %.1f MB)"
                      % (c["n"], os.path.basename(salida), dur,
                         os.path.getsize(salida) / 1e6))
            pendientes = siguen
            if pendientes:
                print("     siguen %d ..." % len(pendientes))
        for c, op in pendientes:
            print("  casilla %2d: NO TERMINO en quince minutos. La operacion sigue viva y el "
                  "clip se baja con ella sin volver a pagar:\n     %s" % (c["n"], op))


if __name__ == "__main__":
    main()
