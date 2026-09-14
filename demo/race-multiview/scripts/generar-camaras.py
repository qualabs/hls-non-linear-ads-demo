#!/usr/bin/env python3
"""generar-camaras.py -- los cuarenta clips de las cinco camaras que le faltan al catalogo.

Es el hermano chico de `generar-camara.py`: aquel produjo la camara de a bordo de CALDRIX y
dejo el molde probado; este lo corre cinco veces mas con la ficha del auto cambiada. LO QUE
NO HACE ES REDISENARLO. Los bloques del mundo no se copian: se IMPORTAN por path de
`generar-camara.py` y de `generar-programa.py`, asi que el parrafo del lugar, la ficha de
los seis autos, la calzada, la camara atornillada, el sonido y el bloque del seguimiento son
LOS MISMOS BYTES que ya viajaron. Copiarlos habria dejado dos originales que se despegan el
dia que alguien corrija uno.

----------------------------------------------------------------------------------------
LAS DOS CLASES DE TOMA, Y POR QUE EL REPARTO NO SE ELIGE ACA
----------------------------------------------------------------------------------------
`DESIGN.md` reparte los seis feeds: el que va adelante y el que lo persigue van A BORDO, el
quinto tambien, y el tercero, el cuarto y el sexto van de SEGUIMIENTO del realizador. Con
CALDRIX ya hecho, aca quedan dos de a bordo --MARVOK y PENTAV-- y tres de seguimiento
--NOCTEV, RUNTAK y QUENTRA--.

  - A BORDO hereda el molde entero de la T-05, incluido el bloque `EL_AUTO`, que es la
    respuesta al problema de la identificacion: no se pide el color, se pide QUE PIEZA de la
    carroceria propia esta en cuadro. Lo unico que cambia es la palabra del color.

  - SEGUIMIENTO no necesita ese bloque --el auto se ve entero-- y usa en su lugar el
    `SEGUIMIENTO` del programa, que es el que separo las diez casillas aprobadas de las
    cuatro rechazadas: la camara viaja al lado del auto a su velocidad, lo sostiene en el
    mismo lugar del cuadro y NUNCA LO DEJA PASAR. Dos de los ocho clips de cada camara de
    seguimiento usan `PISTA` en su lugar --camara clavada en el piso, paneando--, que es la
    otra forma que el programa dio por buena, en la casilla 6.

----------------------------------------------------------------------------------------
LO QUE ESTA FASE YA MIDIO Y ACA NO SE VUELVE A DESCUBRIR
----------------------------------------------------------------------------------------
1. NINGUN CLIP PIDE QUE EL AUTO CRUCE LA POSICION DE LA CAMARA. `past the camera` salio mal
   en 4 de 4 clips rechazados del programa: cuando el auto cruza la lente, del otro lado el
   modelo inventa el mundo y la calzada se abre en una explanada. Ni una sola de las 40
   tomas lo pide, y las de seguimiento dicen en positivo lo contrario -- la distancia entre
   el auto y la camara no cambia --.

2. NINGUN CLIP PIDE UN PLANO AEREO. Cinco pedidos de helicoptero, cinco fracasos en la
   T-03, y la conclusion escrita fue "la palanca no es escribir mejor". `DESIGN.md` nombra
   el helicoptero entre las tomas de un realizador; la medicion dice que este modelo no la
   sostiene, asi que las tres camaras de seguimiento cortan entre POSICIONES DE PISTA, que
   es lo otro que hace un realizador.

3. NINGUNA CAMARA DE A BORDO MIRA HACIA ATRAS. La T-05 lo pago dos veces: pedir la camara
   mirando por el camino que el auto deja devuelve la camara montada atras MIRANDO ADELANTE,
   y con eso el auto ajeno queda del lado equivocado y la carrera sale invertida.

4. UN SOLO MOVIMIENTO POR CLIP. Nada de chicanas, eses, ni frenada mas entrada a la curva.
   Rectas y curvas largas abiertas, una por clip.

5. NADA DE TIPOGRAFIA PEDIDA. Ni numeros, ni carteles, ni rotulos: la carroceria se describe
   en positivo --lisa, recien salida del taller de pintura-- que es lo que ya viaja adentro
   del bloque `AUTOS` importado.

----------------------------------------------------------------------------------------
EL PADRON DE SEIS COLORES VIAJA TAL CUAL LO DEJO LA T-05, Y ESO INCLUYE `AQUAMARINE`
----------------------------------------------------------------------------------------
El renombre `BRIGHT APPLE GREEN` -> `BRIGHT LIME GREEN` se importa de `generar-camara.py` y
va en los cuarenta: la casilla 10 del programa volvio con `Apple` pintado en el ponton, y la
demo la presenta David Hassoun en el evento de Apple.

`BRIGHT AQUAMARINE` NO se renombra, y la decision es deliberada porque el mismo fenomeno lo
alcanza -- la casilla 4 del programa volvio con `AQUAAMARINE` escrito en el aleron --. Las
dos razones:

  - NO ES UNA MARCA. Lo que el R2 prohibe es que el auto se parezca a un equipo real; un
    garabato con forma de patrocinador ya esta medido por la T-03 como algo que "no rompe la
    legibilidad de nada" y que a 190 px desaparece. `Apple` era otra cosa.
  - CAMBIAR LA PALABRA DEL COLOR MUEVE EL COLOR. La T-01 gasto tres iteraciones descubriendo
    exactamente eso: `VIVID YELLOW-GREEN` devolvia amarillo y `BRIGHT APPLE GREEN` devolvia
    verde. El auto de NOCTEV ya esta medido en el programa en `#24ACC8`, y su fila del
    selector esta pintada de ese color; renombrar su color por prolijidad seria mover el
    unico numero que hace que la fila signifique algo, para arreglar un garabato que a
    tamano de caja no se ve.

----------------------------------------------------------------------------------------
EL TOPE ES DURO, ESTA EN EL CODIGO, Y SE PUEDE VER FRENAR SIN LLAMAR A VERTEX
----------------------------------------------------------------------------------------
El techo de la etapa 3 es US$57,60 -- `PHASE.md` y `TASKS.md` --, o sea 72 generaciones a
US$0,80. El registro cuenta LANZAMIENTOS y no clips, porque ~20 % de las operaciones vuelven
con `code 14, Service is currently unavailable` (`done: true` y sin video) y hay que
relanzarlas: contar clips convertiria cada error del servicio en presupuesto invisible.

`--contar` corre el chequeo del tope y SALE ANTES DEL PRIMER POST. Es el arreglo que la T-05
propuso y que esta task hereda: alli, construir el control de "el tope no frena cuando no
tiene que frenar" costo una generacion de US$0,80 lanzada sin querer, porque la unica forma
de ver el caso que NO frena era llamar a Vertex.

    ./generar-camaras.py marvok 1 2        lanza esos dos clips de MARVOK
    ./generar-camaras.py noctev 1-8        lanza los que falten de los ocho de NOCTEV
    ./generar-camaras.py runtak --regenerar 3   vuelve a generar el 3 aunque ya exista
    ./generar-camaras.py pentav 1-8 --contar    dice que haria y cuanto costaria, sin lanzar
"""
import base64
import importlib.util
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

sys.dont_write_bytecode = True

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, ".."))
REGISTRO = os.path.abspath(os.path.join(
    RAIZ, "..", "..", ".project", "phases", "13-la-carrera-donde-cada-uno-mira-su-auto",
    "tasks", "T-08-las-cinco-camaras", "salidas", "registro-de-generaciones.tsv"))


def _modulo(nombre, archivo):
    spec = importlib.util.spec_from_file_location(nombre, os.path.join(AQUI, archivo))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


# LOS BLOQUES NO SE COPIAN, SE IMPORTAN. Si alguien corrige el parrafo del mundo en la T-05,
# estos cuarenta clips lo heredan; una copia se habria quedado vieja sin avisar.
_bordo = _modulo("generar_camara", "generar-camara.py")
_prog = _modulo("generar_programa", "generar-programa.py")

LUGAR, AUTOS, CALZADA = _bordo.LUGAR, _bordo.AUTOS, _bordo.CALZADA
ATORNILLADA, SONIDO_BORDO = _bordo.ATORNILLADA, _bordo.SONIDO
RENOMBRE_VERDE = _bordo.RENOMBRE_VERDE
SEGUIMIENTO, PISTA, UNICIDAD = _prog.SEGUIMIENTO, _prog.PISTA, _prog.UNICIDAD

# EL PADRON DE SEIS, con el que trabaja el guarda del color. Los nombres estan escritos, y
# contra eso hay un chequeo: los seis tienen que seguir estando en el bloque `AUTOS` que se
# importo, YA RENOMBRADO. Una lista tipeada que nadie contrasta contra su fuente es la clase
# de referencia que devuelve lo que le pediste y no verifica nada.
PADRON = ["BRIGHT LEMON YELLOW", "BRIGHT ELECTRIC PURPLE", "BRIGHT AQUAMARINE",
          "DEEP PLUM MAGENTA", "BRIGHT LIME GREEN", "DARK BRONZE GOLD"]
_faltan = [x for x in PADRON if x not in AUTOS.replace(*RENOMBRE_VERDE)]
if _faltan:
    raise SystemExit("el padron de seis del bloque del mundo ya no nombra: %s" % _faltan)

MODELO = os.environ.get("VEO_MODELO", "veo-3.1-fast-generate-001")
REGION = "us-central1"
SEGUNDOS = 8
PRECIO_POR_SEGUNDO = 0.10          # US$/s, 720p con audio, releido de Vertex el 2026-09-12
TOPE_GENERACIONES = 72             # US$57,60 = el techo entero de la etapa 3
LOTE = 10                          # cuantas se lanzan a la vez

# EL SONIDO DE UNA CAMARA DE SEGUIMIENTO NO ES EL DE UNA DE A BORDO: desde la pista se oye
# el auto pasar de lejos a cerca, el eco contra las vallas y la tribuna, no los cambios
# adentro del habitaculo. LA ORACION DE NEGACION QUEDA LETRA POR LETRA -- "No speech, no
# commentary, no music" --: es la que volvio catorce de catorce sin una palabra en el
# programa y ocho de ocho en la camara de CALDRIX, y ampliarla es darle permiso.
SONIDO_SEGUIMIENTO = (
    "SOUND: heard from the side of the track -- the car's engine rising and falling as it "
    "runs, tyres on asphalt, wind across the microphone and a distant crowd. No speech, no "
    "commentary, no music."
)


def el_auto(d):
    """El bloque `THE CAR THIS CAMERA IS ON` de la T-05, con la ficha del auto cambiada.

    SE DERIVA DEL TEXTO IMPORTADO Y NO SE REESCRIBE. El bloque nombra el amarillo cuatro
    veces --en mayusculas en el padron, dos veces en minusculas dentro de una oracion, y una
    vez suelto en "The yellow paint"--, y los cuatro salen del mismo par de reemplazos. Una
    version escrita a mano por camara es justamente donde una de las cuatro se queda en
    amarillo sin que nadie lo vea.

    LO QUE ADEMAS CAMBIA ES LA POSICION EN LA CARRERA, y no es un detalle: el texto de la
    T-05 dice "which is leading the race" porque CALDRIX va primero. Dejarlo en MARVOK, que
    persigue, contradiria los tres clips de ese feed donde el auto amarillo se ve adelante.
    """
    p = _bordo.EL_AUTO
    p = p.replace("which is leading the race", d["posicion"])
    p = p.replace("BRIGHT LEMON YELLOW", d["color"])
    p = p.replace("bright lemon yellow", d["adjetivo"])
    p = p.replace("yellow", d["pieza"])
    if "LEMON" in p or "yellow" in p or "leading the race" in p:
        raise SystemExit("el bloque del auto quedo con la ficha de CALDRIX adentro: %r" % p)
    return p


# ---------------------------------------------------------------------------------------
# LAS CINCO CAMARAS.
#
# `color` es la palabra EXACTA con la que el padron de seis nombra a ese auto, asi que el
# clip y el mundo hablan del mismo auto con las mismas palabras. `adjetivo` es esa palabra
# en minusculas para usar dentro de las oraciones.
#
# EL REPARTO DE ANGULOS es lo que vuelve legitimo un corte cada ocho segundos adentro de un
# mismo feed, y es distinto en cada clase de toma:
#
#   - A BORDO corta entre PUNTOS DE MONTAJE --arco de seguridad, morro, ponton, rueda,
#     casco, aleron--, que es lo que hace una transmision real.
#   - SEGUIMIENTO corta entre POSICIONES DE PISTA --recta, curvon, tramo costero, tribuna,
#     piano--, que es lo que hace un realizador.
#
# Y cada feed usa un reparto DISTINTO del de los otros, para que seis cajas en pantalla no
# se lean como el mismo clip seis veces. Eso es lo que la lamina de las seis mide.
# ---------------------------------------------------------------------------------------


def bordo(n, nombre, camara, cuadro, otros, otra, ajenos=()):
    return dict(n=n, nombre=nombre, clase="bordo", camara=camara, cuadro=cuadro,
                otros=otros, otra=otra, ajenos=ajenos)


def segui(n, nombre, camara, cuadro, otros, otra, pista=False, ajenos=()):
    return dict(n=n, nombre=nombre, clase="seguimiento", camara=camara, cuadro=cuadro,
                otros=otros, otra=otra, pista=pista, ajenos=ajenos)


SOLO = "THE CARS IN THIS SHOT: one only, the %s car. No other car is in frame."
DELANTE = ("THE CARS IN THIS SHOT: two only -- this %s car, and the %s car a long way "
           "ahead of it down the road, small in the distance and never getting closer. " +
           UNICIDAD)
DESPEJADO = "THE OTHER CARS: the road ahead is clear and no other car is in frame."


CAMARAS = {
    # -----------------------------------------------------------------------------------
    # MARVOK -- a bordo, el que persigue. Hereda el molde de CALDRIX entero.
    #
    # ES EL UNICO FEED DONDE OTRO AUTO APARECE, y aparece ADELANTE Y LEJOS en tres de los
    # ocho: es lo que el programa cuenta en las casillas 3 y 13 --MARVOK detras de
    # CALDRIX-- y es lo unico que hace que el catalogo cuente una carrera y no seis paseos.
    # Adelante y lejos es ademas la unica posicion segura: un auto que no se acerca nunca
    # cruza la camara, que es lo que rompe la geometria.
    # -----------------------------------------------------------------------------------
    "marvok": dict(
        color="BRIGHT ELECTRIC PURPLE", adjetivo="bright electric purple", pieza="purple",
        posicion="which is running second and chasing the car ahead of it",
        clase="bordo",
        clips=[
            bordo(1, "01-arco-recta",
                  "CAMERA: television race coverage, on-board camera. The shot comes from "
                  "the camera mounted on the roll hoop behind the driver's head, looking "
                  "forward over the top of the car and down the main straight.",
                  "IN FRAME: the purple nose of the car stretching away below the camera "
                  "with the purple halo bar across the bottom of the frame and the purple "
                  "mirrors on either side, the grey road running straight ahead between its "
                  "white edge lines, the barrier wall on one side and the grandstand beyond "
                  "it.",
                  DELANTE % ("BRIGHT ELECTRIC PURPLE", "BRIGHT LEMON YELLOW"),
                  # el amarillo adelante y lejos: es lo que el programa cuenta
                  "CAMERA, AGAIN: an on-board roll-hoop camera looking forward over the "
                  "nose, fixed to the car, with the car's purple bodywork held still in the "
                  "frame.", ajenos=["BRIGHT LEMON YELLOW"]),
            bordo(2, "02-morro-curvon",
                  "CAMERA: television race coverage, on-board camera. The shot comes from a "
                  "camera mounted on the nose of the car, low and close to the road, looking "
                  "forward through one long open left-hand curve.",
                  "IN FRAME: the purple nose and the purple front wing of the car across the "
                  "bottom of the frame with the two front wheels turning on either side, and "
                  "the road curving away ahead with its white and red kerb on the inside.",
                  DESPEJADO,
                  "CAMERA, AGAIN: an on-board nose camera looking forward low over the road, "
                  "fixed to the car, with the car's own purple front wing held still in the "
                  "frame."),
            bordo(3, "03-arco-costa",
                  "CAMERA: television race coverage, on-board camera. The shot comes from "
                  "the camera mounted on the roll hoop behind the driver's head, looking "
                  "forward over the top of the car along the coastal stretch of the circuit.",
                  "IN FRAME: the purple nose of the car stretching away below the camera "
                  "with the purple halo bar across the bottom of the frame, the road running "
                  "ahead, and the barrier with the flat grey sea beyond it along one side.",
                  DELANTE % ("BRIGHT ELECTRIC PURPLE", "BRIGHT LEMON YELLOW"),
                  # el amarillo adelante y lejos: es lo que el programa cuenta
                  "CAMERA, AGAIN: an on-board roll-hoop camera looking forward over the "
                  "nose, fixed to the car, with the car's purple bodywork held still in the "
                  "frame.", ajenos=["BRIGHT LEMON YELLOW"]),
            bordo(4, "04-casco-tribuna",
                  "CAMERA: television race coverage, on-board helmet camera. The shot comes "
                  "from a small camera on top of the driver's helmet, looking forward out of "
                  "the cockpit along the stretch of track that runs past the main grandstand.",
                  "IN FRAME: the purple halo bar curving across the top of the frame, the "
                  "driver's gloved hands on the steering wheel below, the purple nose of the "
                  "car stretching away ahead between the two front wheels, and the grey "
                  "grandstand with its sparse crowd going by on one side.",
                  DESPEJADO,
                  "CAMERA, AGAIN: an on-board helmet camera looking forward out of the "
                  "cockpit, fixed to the car, with the car's own purple halo and purple nose "
                  "held still in the frame."),
            bordo(5, "05-ponton-curva-larga",
                  "CAMERA: television race coverage, on-board camera. The shot comes from a "
                  "small camera mounted on the sidepod, low down at the side of the car, "
                  "looking forward along the bodywork through one long open right-hand curve.",
                  "IN FRAME: the purple sidepod and the purple nose of the car filling the "
                  "lower left of the frame with the front right wheel turning beside them, "
                  "and the road curving away ahead with its painted kerb on the inside.",
                  DESPEJADO,
                  "CAMERA, AGAIN: an on-board sidepod camera looking forward along the car's "
                  "own purple bodywork, fixed to the car, through one long open curve."),
            bordo(6, "06-rueda-piano",
                  "CAMERA: television race coverage, on-board camera. The shot comes from a "
                  "camera mounted on the side of the cockpit and looking down and across at "
                  "the front left wheel, close to the road, as the car runs along a painted "
                  "kerb.",
                  "IN FRAME: the front left wheel turning against the purple bodywork of the "
                  "car, the purple suspension arms reaching out to it, and the white and red "
                  "kerb running under the wheel with the grey asphalt beside it.",
                  "THE OTHER CARS: no other car is in frame.",
                  "CAMERA, AGAIN: an on-board cockpit-side camera looking down at the front "
                  "left wheel and the kerb, fixed to the car, with the car's own purple "
                  "bodywork held still in the frame."),
            bordo(7, "07-aleron-recta",
                  "CAMERA: television race coverage, on-board camera looking forward from "
                  "the back of the car. The shot comes from a camera mounted on the rear "
                  "wing and looking forward along the whole length of the car, down the main "
                  "straight.",
                  "IN FRAME: the purple rear wing framing the top of the frame, the purple "
                  "engine cover, the driver's purple helmet and the purple halo below it, "
                  "the purple nose stretching away ahead between the front wheels, and the "
                  "road running out in front of the car.",
                  DELANTE % ("BRIGHT ELECTRIC PURPLE", "BRIGHT LEMON YELLOW"),
                  # el amarillo adelante y lejos: es lo que el programa cuenta
                  "CAMERA, AGAIN: an on-board camera on the rear wing looking forward over "
                  "the whole car, fixed to the car, with the car's own purple bodywork held "
                  "still in the frame.", ajenos=["BRIGHT LEMON YELLOW"]),
            bordo(8, "08-arco-dunas",
                  "CAMERA: television race coverage, on-board camera. The shot comes from "
                  "the camera mounted on the roll hoop behind the driver's head, looking "
                  "forward over the top of the car down a fast open stretch with the coastal "
                  "scrub alongside.",
                  "IN FRAME: the purple nose of the car stretching away below the camera "
                  "with the purple halo bar across the bottom of the frame and the top of "
                  "the driver's purple helmet just under it, the road ahead, and the low "
                  "green coastal scrub beyond the barrier on one side.",
                  DESPEJADO,
                  "CAMERA, AGAIN: an on-board roll-hoop camera looking forward over the "
                  "nose, fixed to the car, with the car's purple bodywork held still in the "
                  "frame."),
        ]),

    # -----------------------------------------------------------------------------------
    # PENTAV -- a bordo, el otro de la pelea del medio. Mismo molde, otro reparto de
    # puntos de montaje y otros tramos, para que los tres feeds de a bordo no se lean como
    # el mismo feed tres veces.
    # -----------------------------------------------------------------------------------
    "pentav": dict(
        color="BRIGHT LIME GREEN", adjetivo="bright lime green", pieza="green",
        posicion="which is running in the middle of the field",
        clase="bordo",
        clips=[
            bordo(1, "01-morro-recta",
                  "CAMERA: television race coverage, on-board camera. The shot comes from a "
                  "camera mounted on the nose of the car, low and close to the road, looking "
                  "forward down the main straight.",
                  "IN FRAME: the green nose and the green front wing of the car across the "
                  "bottom of the frame with the two front wheels turning on either side, the "
                  "grey road running straight ahead between its white edge lines, and the "
                  "barrier wall on one side.",
                  DESPEJADO,
                  "CAMERA, AGAIN: an on-board nose camera looking forward low over the road, "
                  "fixed to the car, with the car's own green front wing held still in the "
                  "frame."),
            bordo(2, "02-arco-curva-larga",
                  "CAMERA: television race coverage, on-board camera. The shot comes from "
                  "the camera mounted on the roll hoop behind the driver's head, looking "
                  "forward over the top of the car through one long open right-hand curve.",
                  "IN FRAME: the green nose of the car stretching away below the camera with "
                  "the green halo bar across the bottom of the frame, and the road curving "
                  "away ahead with its white and red kerb on the inside.",
                  DESPEJADO,
                  "CAMERA, AGAIN: an on-board roll-hoop camera looking forward over the "
                  "nose, fixed to the car, through one long open curve, with the car's green "
                  "bodywork held still in the frame."),
            bordo(3, "03-ponton-costa",
                  "CAMERA: television race coverage, on-board camera. The shot comes from a "
                  "small camera mounted on the sidepod, low down at the side of the car, "
                  "looking forward along the bodywork on the coastal stretch of the circuit.",
                  "IN FRAME: the green sidepod and the green nose of the car filling the "
                  "lower left of the frame with the front right wheel turning beside them, "
                  "and the barrier with the flat grey sea beyond it running along one side.",
                  DESPEJADO,
                  "CAMERA, AGAIN: an on-board sidepod camera looking forward along the car's "
                  "own green bodywork, fixed to the car."),
            bordo(4, "04-arco-tribuna",
                  "CAMERA: television race coverage, on-board camera. The shot comes from "
                  "the camera mounted on the roll hoop behind the driver's head, looking "
                  "forward over the top of the car along the stretch of track that runs past "
                  "the main grandstand.",
                  "IN FRAME: the green nose of the car stretching away below the camera with "
                  "the green halo bar across the bottom of the frame and the top of the "
                  "driver's green helmet just under it, the road ahead, and the grey "
                  "grandstand with its sparse crowd going by on one side.",
                  DELANTE % ("BRIGHT LIME GREEN", "DEEP PLUM MAGENTA"),
                  "CAMERA, AGAIN: an on-board roll-hoop camera looking forward over the "
                  "nose, fixed to the car, with the car's green bodywork held still in the "
                  "frame.", ajenos=["DEEP PLUM MAGENTA"]),
            bordo(5, "05-casco-curvon",
                  "CAMERA: television race coverage, on-board helmet camera. The shot comes "
                  "from a small camera on top of the driver's helmet, looking forward out of "
                  "the cockpit through one long open left-hand curve.",
                  "IN FRAME: the green halo bar curving across the top of the frame, the "
                  "driver's gloved hands on the steering wheel below, the green nose of the "
                  "car stretching away ahead between the two front wheels, and the road "
                  "curving away with its painted kerb on the inside.",
                  DESPEJADO,
                  "CAMERA, AGAIN: an on-board helmet camera looking forward out of the "
                  "cockpit, fixed to the car, with the car's own green halo and green nose "
                  "held still in the frame."),
            bordo(6, "06-aleron-dunas",
                  "CAMERA: television race coverage, on-board camera looking forward from "
                  "the back of the car. The shot comes from a camera mounted on the rear "
                  "wing and looking forward along the whole length of the car, down a fast "
                  "open stretch with the coastal scrub alongside.",
                  "IN FRAME: the green rear wing framing the top of the frame, the green "
                  "engine cover, the driver's green helmet and the green halo below it, the "
                  "green nose stretching away ahead between the front wheels, and the road "
                  "running out in front of the car with the low green coastal scrub beyond "
                  "the barrier.",
                  DESPEJADO,
                  "CAMERA, AGAIN: an on-board camera on the rear wing looking forward over "
                  "the whole car, fixed to the car, with the car's own green bodywork held "
                  "still in the frame."),
            bordo(7, "07-rueda-piano",
                  "CAMERA: television race coverage, on-board camera. The shot comes from a "
                  "camera mounted on the side of the cockpit and looking down and across at "
                  "the front left wheel, close to the road, as the car runs along a painted "
                  "kerb.",
                  "IN FRAME: the front left wheel turning against the green bodywork of the "
                  "car, the green suspension arms reaching out to it, and the white and red "
                  "kerb running under the wheel with the grey asphalt beside it.",
                  "THE OTHER CARS: no other car is in frame.",
                  "CAMERA, AGAIN: an on-board cockpit-side camera looking down at the front "
                  "left wheel and the kerb, fixed to the car, with the car's own green "
                  "bodywork held still in the frame."),
            bordo(8, "08-morro-costa",
                  "CAMERA: television race coverage, on-board camera. The shot comes from a "
                  "camera mounted on the nose of the car, low and close to the road, looking "
                  "forward along the coastal stretch of the circuit.",
                  "IN FRAME: the green nose and the green front wing of the car across the "
                  "bottom of the frame with the two front wheels turning on either side, the "
                  "road running ahead, and the barrier with the flat grey sea beyond it "
                  "along one side.",
                  DELANTE % ("BRIGHT LIME GREEN", "DEEP PLUM MAGENTA"),
                  "CAMERA, AGAIN: an on-board nose camera looking forward low over the road, "
                  "fixed to the car, with the car's own green front wing held still in the "
                  "frame.", ajenos=["DEEP PLUM MAGENTA"]),
        ]),

    # -----------------------------------------------------------------------------------
    # NOCTEV -- seguimiento, el tercero. El corte del realizador entre posiciones de pista.
    # -----------------------------------------------------------------------------------
    "noctev": dict(
        color="BRIGHT AQUAMARINE", adjetivo="bright aquamarine", pieza="aquamarine",
        clase="seguimiento",
        clips=[
            segui(1, "01-recta-principal",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed, down the main straight, and holds the "
                  "whole car in the frame, seen from the side.",
                  "IN FRAME: one car alone at full speed, seen from the side, the whole car "
                  "from its front wing to its rear wing filling the middle of the frame, "
                  "with the road under it and the barrier and the grandstand streaming past "
                  "behind it.",
                  SOLO % "BRIGHT AQUAMARINE",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and looking across at its flank. It keeps "
                  "the same distance from the car for the whole shot."),
            # SEGUNDA VERSION DE LA TOMA. Las dos primeras pidieron la camara en el
            # EXTERIOR DE UNA CURVA paneando, y las dos devolvieron un auto de RUEDAS
            # CUBIERTAS -- un prototipo cerrado, que no existe en este mundo de seis
            # monoplazas --. Es el mismo defecto que la T-05 vio una vez, asi que van tres
            # en la fase. El diagnostico esta en el informe; lo que queda escrito aca es la
            # regla: EL EXTERIOR DE UNA CURVA COMPONE UN TRES CUARTOS DE FRENTE, y de
            # frente este modelo dibuja una carroceria cerrada. Todas las tomas que
            # volvieron con el auto DE COSTADO trajeron ruedas descubiertas.
            #
            # Asi que no se insiste una tercera vez con el mismo texto -- que es la leccion
            # de los cinco planos aereos de la T-03 --: se nombra el plano que el modelo si
            # sostiene. La camara sigue quieta al borde de la pista, que es lo que esta
            # casilla aporta al reparto, pero mira el COSTADO del auto en un tramo recto, y
            # las ruedas descubiertas se nombran en positivo adentro del cuadro en vez de
            # prohibir la carroceria cerrada.
            segui(2, "02-costa-quieta",
                  "CAMERA: television race coverage, trackside camera position with a long "
                  "lens. A broadcast camera stands on the ground beside the coastal stretch "
                  "of the circuit and pans with a single car running down the road in front "
                  "of it, holding the car side-on in the middle of the frame the whole time.",
                  "IN FRAME: one car alone seen square from the side, the whole car from its "
                  "front wing to its rear wing filling the middle of the frame, its four "
                  "wheels out in the open air clear of the bodywork and the driver's head "
                  "out in the open above it, with the barrier and the flat grey sea behind "
                  "the road.",
                  SOLO % "BRIGHT AQUAMARINE",
                  "CAMERA, AGAIN: a long-lens trackside broadcast camera on the ground at "
                  "the edge of the circuit, panning with the car and staying where it is, "
                  "looking across at its flank.",
                  pista=True),
            segui(3, "03-costa",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed, along the coastal stretch of the "
                  "circuit, and holds the whole car in the frame, seen from the side.",
                  "IN FRAME: one car alone at full speed, seen from the side, the whole car "
                  "filling the middle of the frame, with the barrier and the flat grey sea "
                  "streaming past behind it.",
                  SOLO % "BRIGHT AQUAMARINE",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and looking across at its flank. It keeps "
                  "the same distance from the car for the whole shot."),
            segui(4, "04-tribuna-cerrado",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed along the stretch of track in front of "
                  "the main grandstand, close in on the car so that its flank fills the "
                  "frame.",
                  "IN FRAME: the flank of one car close up, seen from the side -- the "
                  "sidepod, the rear wheel and the rear wing filling the frame -- with the "
                  "grey grandstand and its sparse crowd streaming past behind it.",
                  SOLO % "BRIGHT AQUAMARINE",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and close in on its flank. It keeps the "
                  "same distance from the car for the whole shot."),
            segui(5, "05-dunas-alto",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed down a fast open stretch with the "
                  "coastal scrub alongside, raised a little above the car and looking "
                  "slightly down at it.",
                  "IN FRAME: one car alone at full speed, seen from the side and a little "
                  "above, the whole car in the middle of the frame with its painted engine "
                  "cover and rear wing showing, and the low green coastal scrub streaming "
                  "past behind it.",
                  SOLO % "BRIGHT AQUAMARINE",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, a little above it and looking down across at it. It "
                  "keeps the same distance from the car for the whole shot."),
            segui(6, "06-recta-bajo",
                  "CAMERA: television race coverage, trackside camera position with a long "
                  "lens. A broadcast camera stands low on the ground beside a straight, at "
                  "the height of the wheels, and pans with a single car running down the "
                  "road in front of it, keeping the car in the middle of the frame the whole "
                  "time.",
                  "IN FRAME: one car alone seen low from the side, at wheel height, the "
                  "whole car filling the middle of the frame with the grey asphalt and the "
                  "white edge line running under it.",
                  SOLO % "BRIGHT AQUAMARINE",
                  "CAMERA, AGAIN: a long-lens trackside broadcast camera low on the ground "
                  "at the edge of the circuit, panning with the car and staying where it is.",
                  pista=True),
            segui(7, "07-curva-larga",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed through one long open right-hand "
                  "curve, and holds the whole car in the frame, seen from the side.",
                  "IN FRAME: one car alone through a long open curve, seen from the side, "
                  "the whole car filling the middle of the frame, with the painted kerb on "
                  "the inside of the curve and the barrier beyond it streaming past.",
                  SOLO % "BRIGHT AQUAMARINE",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and looking across at its flank. It keeps "
                  "the same distance from the car for the whole shot."),
            segui(8, "08-muro-diagonales",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed down a stretch of track with the "
                  "concrete barrier wall close behind it, and holds the whole car in the "
                  "frame, seen from the side.",
                  "IN FRAME: one car alone at full speed, seen from the side, the whole car "
                  "filling the middle of the frame, with the bare grey concrete wall and its "
                  "wide diagonal bands of white and slate grey streaming past behind it.",
                  SOLO % "BRIGHT AQUAMARINE",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and looking across at its flank. It keeps "
                  "the same distance from the car for the whole shot."),
        ]),

    # -----------------------------------------------------------------------------------
    # RUNTAK -- seguimiento, uno de la pelea del medio. Otro reparto de posiciones de pista.
    # -----------------------------------------------------------------------------------
    "runtak": dict(
        color="DEEP PLUM MAGENTA", adjetivo="deep plum magenta", pieza="magenta",
        clase="seguimiento",
        clips=[
            segui(1, "01-costa",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed, along the coastal stretch of the "
                  "circuit, and holds the whole car in the frame, seen from the side.",
                  "IN FRAME: one car alone at full speed, seen from the side, the whole car "
                  "from its front wing to its rear wing filling the middle of the frame, "
                  "with the barrier and the flat grey sea streaming past behind it.",
                  SOLO % "DEEP PLUM MAGENTA",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and looking across at its flank. It keeps "
                  "the same distance from the car for the whole shot."),
            segui(2, "02-tribuna",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed along the stretch of track in front of "
                  "the main grandstand, and holds the whole car in the frame, seen from the "
                  "side.",
                  "IN FRAME: one car alone at full speed, seen from the side, the whole car "
                  "filling the middle of the frame, with the grey grandstand and its sparse "
                  "crowd streaming past behind it.",
                  SOLO % "DEEP PLUM MAGENTA",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and looking across at its flank. It keeps "
                  "the same distance from the car for the whole shot."),
            segui(3, "03-curvon-alto",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed through one long open left-hand curve, "
                  "raised a little above the car and looking slightly down at it.",
                  "IN FRAME: one car alone through a long open curve, seen from the side and "
                  "a little above, the whole car in the middle of the frame with its painted "
                  "engine cover and rear wing showing, and the white and red kerb running "
                  "under its inside wheels.",
                  SOLO % "DEEP PLUM MAGENTA",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, a little above it and looking down across at it. It "
                  "keeps the same distance from the car for the whole shot."),
            segui(4, "04-recta-piano",
                  "CAMERA: television race coverage, trackside camera position with a long "
                  "lens. A broadcast camera stands on the ground beside a straight, level "
                  "with a painted kerb, and pans with a single car running along the kerb in "
                  "front of it, keeping the car in the middle of the frame the whole time.",
                  "IN FRAME: one car alone seen from the side of the track, the whole car "
                  "filling the middle of the frame, with the white and red kerb running "
                  "under its wheels and the grey asphalt beside it.",
                  SOLO % "DEEP PLUM MAGENTA",
                  "CAMERA, AGAIN: a long-lens trackside broadcast camera on the ground at "
                  "the edge of the circuit, panning with the car and staying where it is.",
                  pista=True),
            segui(5, "05-dunas",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed down a fast open stretch with the "
                  "coastal scrub alongside, and holds the whole car in the frame, seen from "
                  "the side.",
                  "IN FRAME: one car alone at full speed, seen from the side, the whole car "
                  "filling the middle of the frame, with the low green coastal scrub "
                  "streaming past behind it.",
                  SOLO % "DEEP PLUM MAGENTA",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and looking across at its flank. It keeps "
                  "the same distance from the car for the whole shot."),
            segui(6, "06-muro-cerrado",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed with the concrete barrier wall close "
                  "behind it, close in on the car so that its flank fills the frame.",
                  "IN FRAME: the flank of one car close up, seen from the side -- the "
                  "sidepod, the rear wheel and the rear wing filling the frame -- with the "
                  "bare grey concrete wall and its wide diagonal bands of white and slate "
                  "grey streaming past behind it.",
                  SOLO % "DEEP PLUM MAGENTA",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and close in on its flank. It keeps the "
                  "same distance from the car for the whole shot."),
            segui(7, "07-curva-larga-bajo",
                  "CAMERA: television race coverage, trackside camera position with a long "
                  "lens. A broadcast camera stands low on the ground at the outside of one "
                  "long open curve, at the height of the wheels, and pans with a single car "
                  "as it runs round the curve in front of it, keeping the car in the middle "
                  "of the frame the whole time.",
                  "IN FRAME: one car alone through a long open curve, seen low from the "
                  "side at wheel height, the whole car filling the middle of the frame with "
                  "the painted kerb running under its inside wheels.",
                  SOLO % "DEEP PLUM MAGENTA",
                  "CAMERA, AGAIN: a long-lens trackside broadcast camera low on the ground "
                  "at the edge of the circuit, panning with the car through the curve and "
                  "staying where it is.",
                  pista=True),
            segui(8, "08-recta-principal",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed, down the main straight, and holds the "
                  "whole car in the frame, seen from the side.",
                  "IN FRAME: one car alone at full speed, seen from the side, the whole car "
                  "filling the middle of the frame, with the road under it and the barrier "
                  "wall streaming past behind it.",
                  SOLO % "DEEP PLUM MAGENTA",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and looking across at its flank. It keeps "
                  "the same distance from the car for the whole shot."),
        ]),

    # -----------------------------------------------------------------------------------
    # QUENTRA -- seguimiento, el que remonta desde atras. Tercer reparto de posiciones.
    # -----------------------------------------------------------------------------------
    "quentra": dict(
        color="DARK BRONZE GOLD", adjetivo="dark bronze gold", pieza="bronze",
        clase="seguimiento",
        clips=[
            segui(1, "01-tribuna",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed along the stretch of track in front of "
                  "the main grandstand, and holds the whole car in the frame, seen from the "
                  "side.",
                  "IN FRAME: one car alone at full speed, seen from the side, the whole car "
                  "from its front wing to its rear wing filling the middle of the frame, "
                  "with the grey grandstand and its sparse crowd streaming past behind it.",
                  SOLO % "DARK BRONZE GOLD",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and looking across at its flank. It keeps "
                  "the same distance from the car for the whole shot."),
            segui(2, "02-curvon",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed through one long open right-hand "
                  "curve, and holds the whole car in the frame, seen from the side.",
                  "IN FRAME: one car alone through a long open curve, seen from the side, "
                  "the whole car filling the middle of the frame, with the white and red "
                  "kerb on the inside of the curve and the barrier beyond it streaming past.",
                  SOLO % "DARK BRONZE GOLD",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and looking across at its flank. It keeps "
                  "the same distance from the car for the whole shot."),
            segui(3, "03-costa-alto",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed along the coastal stretch of the "
                  "circuit, raised a little above the car and looking slightly down at it.",
                  "IN FRAME: one car alone at full speed, seen from the side and a little "
                  "above, the whole car in the middle of the frame with its painted engine "
                  "cover and rear wing showing, and the barrier with the flat grey sea "
                  "beyond it streaming past behind.",
                  SOLO % "DARK BRONZE GOLD",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, a little above it and looking down across at it. It "
                  "keeps the same distance from the car for the whole shot."),
            segui(4, "04-dunas-cerrado",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed down a fast open stretch with the "
                  "coastal scrub alongside, close in on the car so that its flank fills the "
                  "frame.",
                  "IN FRAME: the flank of one car close up, seen from the side -- the "
                  "sidepod, the rear wheel and the rear wing filling the frame -- with the "
                  "low green coastal scrub streaming past behind it.",
                  SOLO % "DARK BRONZE GOLD",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and close in on its flank. It keeps the "
                  "same distance from the car for the whole shot."),
            segui(5, "05-muro",
                  "CAMERA: television race coverage, trackside camera position with a long "
                  "lens. A broadcast camera stands on the ground beside a stretch of track "
                  "with the concrete barrier wall behind the road, and pans with a single "
                  "car running down the road in front of it, keeping the car in the middle "
                  "of the frame the whole time.",
                  "IN FRAME: one car alone seen from the side of the track, the whole car "
                  "filling the middle of the frame, with the bare grey concrete wall and its "
                  "wide diagonal bands of white and slate grey behind the road.",
                  SOLO % "DARK BRONZE GOLD",
                  "CAMERA, AGAIN: a long-lens trackside broadcast camera on the ground at "
                  "the edge of the circuit, panning with the car and staying where it is.",
                  pista=True),
            segui(6, "06-recta-principal",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed, down the main straight, and holds the "
                  "whole car in the frame, seen from the side.",
                  "IN FRAME: one car alone at full speed, seen from the side, the whole car "
                  "filling the middle of the frame, with the road under it and the barrier "
                  "and the grandstand streaming past behind it.",
                  SOLO % "DARK BRONZE GOLD",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and looking across at its flank. It keeps "
                  "the same distance from the car for the whole shot."),
            segui(7, "07-piano-bajo",
                  "CAMERA: television race coverage, trackside camera position with a long "
                  "lens. A broadcast camera stands low on the ground beside a painted kerb, "
                  "at the height of the wheels, and pans with a single car running along the "
                  "kerb in front of it, keeping the car in the middle of the frame the whole "
                  "time.",
                  "IN FRAME: one car alone seen low from the side at wheel height, the whole "
                  "car filling the middle of the frame, with the white and red kerb running "
                  "under its wheels and the grey asphalt beside it.",
                  SOLO % "DARK BRONZE GOLD",
                  "CAMERA, AGAIN: a long-lens trackside broadcast camera low on the ground "
                  "at the edge of the circuit, panning with the car and staying where it is.",
                  pista=True),
            segui(8, "08-curva-larga",
                  "CAMERA: television race coverage, with a long lens. The camera runs "
                  "alongside one car at its own speed through one long open left-hand curve, "
                  "and holds the whole car in the frame, seen from the side.",
                  "IN FRAME: one car alone through a long open curve, seen from the side, "
                  "the whole car filling the middle of the frame, with the painted kerb on "
                  "the inside of the curve and the low green coastal scrub beyond the "
                  "barrier streaming past.",
                  SOLO % "DARK BRONZE GOLD",
                  "CAMERA, AGAIN: a long-lens broadcast camera travelling alongside the car "
                  "at its own speed, level with it and looking across at its flank. It keeps "
                  "the same distance from the car for the whole shot."),
        ]),
}


def prompt_de(cam, c):
    """El prompt completo de un clip, con el orden de bloques que la T-03 midio como el que
    gana: la camara PRIMERO y la camara ULTIMO, y el mundo en el medio.

    La unica diferencia entre las dos clases esta en los dos bloques del medio:

      a bordo        ... EL_AUTO ... CALZADA, ATORNILLADA ...   (el de la T-05)
      seguimiento    ...          ... CALZADA|PISTA, SEGUIMIENTO ...  (el del programa)
    """
    d = CAMARAS[cam]
    if c["clase"] == "bordo":
        medio = [el_auto(d), c["otros"], CALZADA, ATORNILLADA]
        sonido = SONIDO_BORDO
    else:
        # PISTA Y SEGUIMIENTO SON EXCLUYENTES, y es la unica trampa de esta clase de toma.
        # PISTA termina en "the camera keeps its place on the ground beside the track" y
        # SEGUIMIENTO empieza en "the camera travels along the track alongside the car":
        # los dos juntos son una camara que se queda quieta viajando. Es como se contradice
        # un prompt sin darse cuenta, y por eso hay un guarda abajo que lo mira en el texto
        # armado en vez de confiar en este `if`.
        medio = [c["otros"], PISTA] if c.get("pista") else [c["otros"], CALZADA, SEGUIMIENTO]
        sonido = SONIDO_SEGUIMIENTO
    # `propio` son los bloques que hablan de ESTE clip; `LUGAR` y `AUTOS` son el mundo y
    # nombran a los seis autos siempre. La separacion existe para el guarda del color de
    # abajo: buscar el color en el prompt entero da que si aunque el clip hable de otro auto.
    propio = "\n\n".join([c["camara"], c["cuadro"]] +
                         [b for b in medio if b not in (CALZADA, PISTA, SEGUIMIENTO,
                                                        ATORNILLADA)] + [c["otra"]])
    bloques = [c["camara"], c["cuadro"]] + medio + [LUGAR, AUTOS, sonido, c["otra"]]
    p = "\n\n".join(bloques)

    viejo, nuevo = RENOMBRE_VERDE
    if viejo not in p:
        raise SystemExit(
            "%s clip %d: el renombre pide reemplazar %r y ese texto no esta en el prompt. "
            "El renombre se convirtio en un no-op y el clip saldria con el nombre viejo sin "
            "que nada avise." % (cam, c["n"], viejo))
    p = p.replace(viejo, nuevo)

    # EL GUARDA DEL COLOR. El error que atrapa es el que un copiar-pegar entre cinco fichas
    # comete: los clips de una camara nombrando el auto de otra. El feed entero saldria del
    # auto equivocado y ni el largo ni el audio ni la lamina lo notarian.
    #
    # SE MIRA `propio` Y NO EL PROMPT ENTERO, y esa es toda la diferencia entre un guarda y
    # una linea decorativa: el bloque `AUTOS` nombra a los seis autos en las cuarenta, asi
    # que preguntar "esta mi color en el prompt?" da que si SIEMPRE -- tambien cuando el clip
    # habla de otro auto. La primera version de este guarda preguntaba eso y se la vio pasar
    # con la ficha de RUNTAK apuntando al bronce.
    #
    # Y no alcanza con que este el propio: hay que mirar QUE OTROS estan. Tres clips de
    # MARVOK y dos de PENTAV nombran a proposito un segundo auto adelante, y esos van
    # declarados en `ajenos`. Cualquier otro color del padron en los bloques del clip es un
    # auto que nadie pidio.
    propios = {col for col in PADRON if col in propio}
    ajenos = set(c.get("ajenos", ()))
    if d["color"] not in propios:
        raise SystemExit(
            "%s clip %d: los bloques de este clip no nombran %r, que es el color de su auto "
            "en el padron de seis. El clip saldria de otro auto." % (cam, c["n"], d["color"]))
    sobran = propios - {d["color"]} - ajenos
    if sobran:
        raise SystemExit(
            "%s clip %d: los bloques del clip nombran %s, que no es su auto ni esta "
            "declarado en `ajenos`." % (cam, c["n"], ", ".join(sorted(sobran))))

    # EL GUARDA DE LA CAMARA QUIETA QUE VIAJA. Mira el TEXTO ARMADO y no la bandera que lo
    # armo, que es lo que lo hace valer: la primera version de este archivo puso los dos
    # bloques en los cuatro clips de `pista` y el prompt pedia una camara clavada en el piso
    # que ademas corre al lado del auto. Nada lo habria avisado.
    QUIETA = "The camera keeps its place on the ground beside the track"
    VIAJA = "the camera travels along the track alongside the car"
    if QUIETA in p and VIAJA in p:
        raise SystemExit(
            "%s clip %d: el prompt lleva la camara quieta Y la camara que viaja al lado del "
            "auto. Son excluyentes y juntas piden una camara que se queda quieta viajando."
            % (cam, c["n"]))
    return p


# ---------------------------------------------------------------------------------------
# El registro de gasto, que es lo que hace que el tope no dependa de la memoria de nadie.
# ---------------------------------------------------------------------------------------

def generaciones_ya_lanzadas():
    if not os.path.exists(REGISTRO):
        return 0
    with open(REGISTRO) as f:
        return sum(1 for ln in f if ln.strip() and not ln.startswith("#"))


def anotar(cam, clip, operacion, estado):
    nuevo = not os.path.exists(REGISTRO)
    os.makedirs(os.path.dirname(REGISTRO), exist_ok=True)
    with open(REGISTRO, "a") as f:
        if nuevo:
            f.write("# una linea por GENERACION LANZADA, que es lo que se paga.\n")
            f.write("# fecha\tcamara\tclip\toperacion\tUS$\testado\n")
        f.write("%s\t%s\t%s\t%s\t%.2f\t%s\n" % (
            time.strftime("%Y-%m-%dT%H:%M:%S"), cam, clip, operacion,
            SEGUNDOS * PRECIO_POR_SEGUNDO, estado))


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
    args = sys.argv[1:]
    regenerar = "--regenerar" in args
    contar = "--contar" in args
    args = [a for a in args if a not in ("--regenerar", "--contar")]
    if len(args) < 2:
        sys.exit(__doc__.splitlines()[0] + "\n  uso: generar-camaras.py <%s> <clips: 1 2 | "
                 "1-8> [--regenerar] [--contar]" % "|".join(CAMARAS))

    cam, args = args[0], args[1:]
    if cam not in CAMARAS:
        sys.exit("camara desconocida %r; son: %s" % (cam, ", ".join(CAMARAS)))
    dest = os.path.join(RAIZ, "content", ".fuentes", "camaras", cam)

    pedidos = []
    for a in args:
        if "-" in a:
            d, h = a.split("-")
            pedidos += list(range(int(d), int(h) + 1))
        else:
            pedidos.append(int(a))

    os.makedirs(dest, exist_ok=True)
    porhacer = []
    for n in pedidos:
        c = next(x for x in CAMARAS[cam]["clips"] if x["n"] == n)
        salida = os.path.join(dest, c["nombre"] + ".mp4")
        if os.path.exists(salida) and os.path.getsize(salida) > 0 and not regenerar:
            print("== %s clip %2d (%s): ya esta, no se regenera ==" % (cam, n, c["nombre"]))
            continue
        porhacer.append(c)
    if not porhacer:
        print("nada para generar")
        return

    ya = generaciones_ya_lanzadas()
    if ya + len(porhacer) > TOPE_GENERACIONES:
        sys.exit("TOPE: hay %d generaciones lanzadas y se piden %d; el tope de la etapa 3 es "
                 "%d (US$%.2f). Corre menos clips o cierra la task con lo que hay."
                 % (ya, len(porhacer), TOPE_GENERACIONES, TOPE_GENERACIONES * SEGUNDOS
                    * PRECIO_POR_SEGUNDO))

    print("== %s: %d generacion(es), %s, %ds, 720p, con audio -- US$%.2f ==\n"
          "   lanzadas hasta ahora: %d de %d (US$%.2f de US$%.2f)\n"
          % (cam, len(porhacer), MODELO, SEGUNDOS,
             len(porhacer) * SEGUNDOS * PRECIO_POR_SEGUNDO, ya, TOPE_GENERACIONES,
             ya * SEGUNDOS * PRECIO_POR_SEGUNDO,
             TOPE_GENERACIONES * SEGUNDOS * PRECIO_POR_SEGUNDO))

    if contar:
        # SALE ANTES DEL PRIMER POST. Es lo que hace que el caso "el tope NO frena" se pueda
        # ver sin pagarlo: el chequeo de arriba ya corrio y no freno, y aca no se toca la red.
        for c in porhacer:
            prompt_de(cam, c)     # los prompts se arman igual, que es donde estan los guardas
            print("   %2d %s" % (c["n"], c["nombre"]))
        print("\n   --contar: no se lanzo nada.")
        return

    token = sh("gcloud auth print-access-token")
    proyecto = sh("gcloud config get-value project")
    if not token or not proyecto:
        sys.exit("sin credenciales: gcloud auth login")
    base = ("https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/"
            "google/models/%s" % (REGION, proyecto, REGION, MODELO))

    for i in range(0, len(porhacer), LOTE):
        lote = porhacer[i:i + LOTE]
        vivas = []
        for c in lote:
            p = prompt_de(cam, c)
            with open(os.path.join(dest, c["nombre"] + ".prompt.txt"), "w") as f:
                f.write(p + "\n")
            r = post(base + ":predictLongRunning", token, {
                "instances": [{"prompt": p}],
                "parameters": {"aspectRatio": "16:9", "sampleCount": 1,
                               "durationSeconds": SEGUNDOS, "resolution": "720p",
                               "generateAudio": True}})
            op = r.get("name")
            if not op:
                print("  clip %2d: ERROR al lanzar -- %s" % (c["n"], json.dumps(r)[:400]))
                anotar(cam, c["n"], "(sin operacion)", "ERROR-AL-LANZAR")
                continue
            anotar(cam, c["n"], op, "lanzada")
            vivas.append((c, op))
            print("  clip %2d (%s)  op %s" % (c["n"], c["nombre"], op.split("/")[-1]))

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
                salida = os.path.join(dest, c["nombre"] + ".mp4")
                if "error" in e:
                    print("  clip %2d: Vertex devolvio error: %s"
                          % (c["n"], json.dumps(e["error"])[:300]))
                    continue
                vids = (e.get("response") or {}).get("videos") or []
                if not vids or not vids[0].get("bytesBase64Encoded"):
                    print("  clip %2d: termino sin video -- %s" % (c["n"], json.dumps(e)[:300]))
                    continue
                with open(salida, "wb") as f:
                    f.write(base64.b64decode(vids[0]["bytesBase64Encoded"]))
                dur = sh("ffprobe -v error -show_entries format=duration -of csv=p=0 '%s'" % salida)
                print("  clip %2d LISTO  %s  (%ss, %.1f MB)"
                      % (c["n"], os.path.basename(salida), dur, os.path.getsize(salida) / 1e6))
            pendientes = siguen
            if pendientes:
                print("     siguen %d ..." % len(pendientes))
        for c, op in pendientes:
            print("  clip %2d: NO TERMINO en quince minutos. La operacion sigue viva y el "
                  "clip se baja con ella sin volver a pagar:\n     %s" % (c["n"], op))


if __name__ == "__main__":
    main()
