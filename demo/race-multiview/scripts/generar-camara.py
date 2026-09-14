#!/usr/bin/env python3
"""generar-camara.py -- los ocho clips de la camara de a bordo de CALDRIX, y su receta.

EL ADR 0061 MANDA QUE LA RECETA VIVA CON EL GENERADOR, asi que los ocho prompts estan aca
adentro y no en un documento al lado. Lo que el documento de la task agrega es el porque de
la FORMA del prompt; lo que esta aca es el texto exacto que viaja.

Este archivo es el hermano de `generar-programa.py` y comparte con el todo lo que ya se
pago aprendiendo: la forma en bloques rotulados, la camara primero y ultimo, el padron de
seis colores adentro del bloque del mundo, el tope duro contra un registro de lanzamientos.
Lo que cambia es la clase de toma, y de ahi salen las cuatro decisiones de abajo.

----------------------------------------------------------------------------------------
1. LA CAMARA DE A BORDO ES LA TOMA QUE EL MODELO DEVUELVE SOLO
----------------------------------------------------------------------------------------
La T-03 lo dejo escrito como corolario y aca se comprueba antes de gastar los ocho: dos de
las catorce casillas del programa pidieron una camara EXTERIOR viajando al lado del auto
--"a camera car running alongside at the same speed, level with it"-- y las dos volvieron
con la camara MONTADA SOBRE EL AUTO. Hicieron falta tres generaciones y cambiar el idioma
del pedido ("trackside camera position with a long lens") para sacarsela de encima.

O sea que esta task juega a favor de la corriente: lo que alla costo US$1,60 en descartes
es lo que aca hay que conseguir. La consecuencia practica es que el bloque de camara puede
ser corto y no tiene que pelear con el mundo, que es lo que pasaba con los planos aereos.

----------------------------------------------------------------------------------------
2. EL PROBLEMA DE ESTA CAMARA ES IDENTIFICAR EL AUTO, Y SE RESUELVE ENCUADRANDO
----------------------------------------------------------------------------------------
PHASE.md elige esta camara por ser la mas dificil y nombra por que: "en una toma de a bordo
el auto casi no esta en cuadro, y la identificacion es lo unico que hace que una fila del
selector signifique algo". Una fila que dice CALDRIX al lado de una caja donde se ve
asfalto y nada mas no dice nada.

NO SE RESUELVE PIDIENDO EL COLOR: se resuelve pidiendo QUE PARTE DEL AUTO ESTA EN CUADRO.
Una camara de a bordo real siempre tiene carroceria propia adentro del encuadre --el morro
delante de la T-cam, el arco de seguridad, los espejos, el ponton, el aleron trasero en la
camara que mira hacia atras-- y esa carroceria es del color del auto. Asi que los ocho
prompts declaran, en el bloque `THE CAR THIS CAMERA IS ON`, que la camara va atornillada al
auto AMARILLO y que se ve su carroceria amarilla en cuadro, y cada casilla dice CUAL pieza:
el morro, el arco, el espejo, el ponton, el aleron.

Es lo mismo que la fase 08 hizo con la librea y la T-03 con el encuadre: se describe la cosa
que tiene que estar, en lugar de pedir un atributo y esperar que el modelo lo ponga en algun
lado. Y es medible, que es lo que lo hace un criterio y no un gusto: se mide el color de esa
carroceria en cada uno de los ocho y se lo compara contra el CALDRIX del programa.

----------------------------------------------------------------------------------------
3. `APPLE` NO VIAJA EN NINGUNO DE LOS OCHO
----------------------------------------------------------------------------------------
El padron de seis colores del bloque del mundo decia BRIGHT APPLE GREEN, y la casilla 10 del
programa volvio con `Apple` pintado en el ponton del auto verde, con su tipografia y media
manzana roja al lado. El arreglo medido fue renombrar ese verde a BRIGHT LIME GREEN --sacar
la palabra, no prohibirla-- y la casilla volvio limpia a la primera.

Aca el renombre va en LOS OCHO y no en uno, y por dos razones independientes:

  - No hay nada que preservar. Las trece casillas del programa que no se tocaron tenian el
    texto que de verdad habia viajado, y ese es el motivo por el que el renombre alla fue
    por casilla. Estos ocho clips no existen todavia.
  - La demo la presenta David Hassoun en el evento de Apple. De todas las marcas que el
    modelo puede pintar en una carroceria, esa es la peor, y una camara de a bordo tiene la
    carroceria propia en cuadro los ocho segundos.

El mecanismo es el mismo `color_renombrado` de `generar-programa.py` y se niega a correr si
el texto que reemplaza no esta en el prompt: sin ese guarda, un renombre que deja de
enganchar es un no-op silencioso y el clip sale con el nombre viejo sin que nada avise.

----------------------------------------------------------------------------------------
4. LA GEOMETRIA: EL BLOQUE `CALZADA` VA DESDE EL PRIMER CLIP
----------------------------------------------------------------------------------------
Lo pide la cabecera de `generar-programa.py` con su razon: "una camara de a bordo es el caso
donde menos calzada hay en cuadro, que es justo lo que rompio la casilla 12". Las cuatro
casillas que Nicolas rechazo por geometria fallaban porque los autos CRUZABAN la posicion de
la camara y del otro lado el modelo inventaba el mundo.

En una camara de a bordo ese cruce no puede ocurrir con el auto propio --la camara va
atornillada a el--, asi que el riesgo cambia de lugar y queda en dos sitios:

  - OTRO auto que cruza la camara. Por eso ningun prompt pide un sobrepaso ni un auto que
    pasa al lado: el unico auto ajeno que aparece es MARVOK, DETRAS, en las dos camaras que
    miran hacia atras, y ahi no cruza nada.
  - UN SOLO MOVIMIENTO POR CLIP, que es la segunda palanca de la T-03. Nada de chicanas, ni
    eses, ni frenada mas entrada a la curva: rectas y curvas largas abiertas, una por clip.

`SEGUIMIENTO`, el otro bloque de `generar-programa.py`, NO va: pide una camara que viaja AL
LADO de los autos mirandolos desde afuera, que es exactamente lo contrario de esto.

----------------------------------------------------------------------------------------
5. EL SONIDO SE DIRIGE Y LA NEGACION NO SE AMPLIA
----------------------------------------------------------------------------------------
La linea de sonido es la del programa con el contenido cambiado a lo que se oye adentro de
un auto: motor, cambios, aire, gomas sobre el piano. La oracion de negacion queda LETRA POR
LETRA como en las catorce del programa --"No speech, no commentary, no music"-- y no se le
agrega "no team radio" aunque la radio de equipo sea el riesgo obvio de una toma de a bordo:
la radio ES habla y ya esta cubierta, y la regla de la fase 08 dice que nombrar de mas da
permiso. Catorce de catorce clips del programa volvieron sin una palabra con esta linea.

----------------------------------------------------------------------------------------
EL TOPE ES DURO Y ESTA EN EL CODIGO
----------------------------------------------------------------------------------------
El techo de la etapa 2 es de US$12,80 --PHASE.md y TASKS.md--, o sea 16 generaciones a
US$0,80. Contra este archivo el techo es ese entero: la etapa 2 no gasto un centavo antes.

EL REGISTRO CUENTA LANZAMIENTOS Y NO CLIPS, y esa diferencia ya costo dos lineas en la
T-03: dos operaciones volvieron con `code 14, Service is currently unavailable` de Vertex,
o sea `done: true` y sin video, y hubo que relanzarlas. Se anotan igual --lo que se cuenta
es lo que se pidio-- porque contar clips convertiria cada error del servicio en presupuesto
invisible.

    ./generar-camara.py 1 2           lanza esos dos clips
    ./generar-camara.py 1-8           lanza los que falten de los ocho
    ./generar-camara.py --regenerar 3 vuelve a generar el 3 aunque ya exista

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
DEST = os.path.join(RAIZ, "content", ".fuentes", "camaras", "caldrix")
REGISTRO = os.path.abspath(os.path.join(
    RAIZ, "..", "..", ".project", "phases", "13-la-carrera-donde-cada-uno-mira-su-auto",
    "tasks", "T-05-la-camara-de-a-bordo", "salidas", "registro-de-generaciones.tsv"))

MODELO = os.environ.get("VEO_MODELO", "veo-3.1-fast-generate-001")
REGION = "us-central1"
SEGUNDOS = 8
PRECIO_POR_SEGUNDO = 0.10          # US$/s, 720p con audio, releido de Vertex el 2026-09-12
TOPE_GENERACIONES = 16             # US$12,80 = el techo entero de la etapa 2
LOTE = 10                          # cuantas se lanzan a la vez

# El renombre del verde, que va en los ocho. El porque esta arriba, en la seccion 3.
RENOMBRE_VERDE = ("BRIGHT APPLE GREEN", "BRIGHT LIME GREEN")

# ---------------------------------------------------------------------------------------
# LOS BLOQUES CONSTANTES.
#
# LUGAR y AUTOS son BYTE POR BYTE los de `generar-programa.py`. No se mejoran ni se
# resumen: son lo unico que hace que el programa y esta camara se lean como la misma
# carrera, que es el R1 de PHASE.md, y una palabra distinta aca es una variable suelta en
# la unica comparacion que la compuerta 2 existe para hacer.
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

# EL AUTO SOBRE EL QUE VA LA CAMARA. Es el bloque que esta camara tiene y el programa no, y
# es la respuesta al problema de la identificacion: dice de que color es la carroceria que
# se ve en cuadro, que es la unica parte del auto que una toma de a bordo muestra. El
# porque esta arriba, en la seccion 2.
EL_AUTO = (
    "THE CAR THIS CAMERA IS ON: the camera is bolted to the BRIGHT LEMON YELLOW car, which "
    "is leading the race. Its own bright lemon yellow bodywork is in the frame for the "
    "whole eight seconds, painted that one flat colour, and the driver's helmet is the same "
    "bright lemon yellow. The yellow paint stays the same shade from the first frame to the "
    "last."
)

# LA CALZADA. Identico al de `generar-programa.py`: una sola calzada con sus dos bordes
# corridos de punta a punta y todos los autos yendo para el mismo lado. El porque esta
# arriba, en la seccion 4.
CALZADA = (
    "THE TRACK IN THIS SHOT: one single road, and the whole shot happens on it. One strip "
    "of grey asphalt runs through the frame, bounded on one side by a painted kerb with "
    "grass beyond it and on the other by the barrier wall, and those two edges run along "
    "it unbroken from the first frame to the last. Every car in the shot runs the same way "
    "down that road for the whole eight seconds, moving forward all the time and holding "
    "one heading: no car ever turns back on itself."
)

# LA CAMARA ATORNILLADA. Dice en positivo lo que una camara de a bordo hace: no se mueve
# respecto del auto, asi que la carroceria se queda quieta en el cuadro y lo que corre es
# el mundo. Es la forma que el modelo sostiene --la misma propiedad que hace funcionar al
# bloque SEGUIMIENTO del programa-- pero desde adentro del auto.
ATORNILLADA = (
    "THE CAMERA IN THIS SHOT: the camera is fixed to the car and moves with it, so the "
    "car's own bodywork stays in exactly the same place in the frame from the first frame "
    "to the last, and what streams past is the road, the kerb, the barrier and everything "
    "beyond them. The camera holds one heading all the way through, the same heading the "
    "car holds, and it never turns round to look back down the road unless this shot says "
    "it faces backwards from the start."
)

SONIDO = (
    "SOUND: heard from on board -- the car's own engine close and loud, gearshifts, rushing "
    "air over the car, tyres scrubbing on asphalt and a distant crowd. No speech, no "
    "commentary, no music."
)

# ---------------------------------------------------------------------------------------
# LOS OCHO CLIPS. Cada uno es (numero, nombre, camara, en_cuadro, otros_autos, camara_otra_vez).
#
# `camara` es lo PRIMERO del prompt y `otra` lo ULTIMO, que es la forma que la T-03 midio
# como la que gana. Las dos dicen lo mismo con otras palabras a proposito.
#
# EL REPARTO DE ANGULOS, que es lo que vuelve legitimo un corte cada ocho segundos dentro de
# un mismo feed: cinco puntos de montaje --arco de seguridad mirando adelante, morro,
# trasera, ponton y rueda--, con el arco repetido tres veces porque es la camara de a bordo
# principal de cualquier transmision. Y cada uno en un tramo distinto del circuito, para que
# ocho clips de la misma cabina no se lean como el mismo clip ocho veces.
# ---------------------------------------------------------------------------------------

CLIPS = [
    dict(
        n=1, nombre="01-arco-recta",
        camara="CAMERA: television race coverage, on-board camera. The shot comes from the "
               "camera mounted on the roll hoop behind the driver's head, looking forward "
               "over the top of the car and down the main straight.",
        cuadro="IN FRAME: the yellow nose of the car stretching away below the camera with "
               "the yellow halo bar across the bottom of the frame and the yellow mirrors on "
               "either side, the grey road running straight ahead between its white edge "
               "lines, the barrier wall on one side and the grandstand beyond it.",
        otros="THE OTHER CARS: the road ahead is clear. This car is leading and there is no "
              "car in front of it.",
        otra="CAMERA, AGAIN: an on-board roll-hoop camera looking forward over the nose, "
             "fixed to the car, with the car's yellow bodywork held still in the frame.",
    ),
    dict(
        n=2, nombre="02-ponton-curva-larga",
        camara="CAMERA: television race coverage, on-board camera. The shot comes from a "
               "small camera mounted on the sidepod, low down at the side of the car, "
               "looking forward along the bodywork through one long open right-hand curve.",
        cuadro="IN FRAME: the yellow sidepod and the yellow nose of the car filling the "
               "lower left of the frame with the front right wheel turning beside them, and "
               "the road curving away ahead with its painted kerb on the inside.",
        otros="THE OTHER CARS: the road ahead is clear. This car is leading and there is no "
              "car in front of it.",
        otra="CAMERA, AGAIN: an on-board sidepod camera looking forward along the car's own "
             "yellow bodywork, fixed to the car, through one long open curve.",
    ),
    dict(
        n=3, nombre="03-casco-costa",
        # SEGUNDA VERSION. La primera pedia una camara MIRANDO HACIA ATRAS y el modelo
        # devolvio una camara montada atras pero mirando adelante, con el auto violeta
        # ADELANTE -- o sea CALDRIX persiguiendo, que es lo contrario de lo que el programa
        # cuenta. El diagnostico y la cuenta estan en el informe de la task; lo que queda
        # escrito aca es la regla: LA CAMARA DE A BORDO DE VEO MIRA PARA ADELANTE, y pedirle
        # que mire para atras devuelve la misma toma con el auto ajeno del lado equivocado.
        camara="CAMERA: television race coverage, on-board helmet camera. The shot comes from "
               "a small camera on top of the driver's helmet, looking forward out of the "
               "cockpit along the coastal stretch of the circuit.",
        cuadro="IN FRAME: the yellow halo bar curving across the top of the frame, the "
               "driver's gloved hands on the steering wheel below, the yellow nose of the car "
               "stretching away ahead between the two front wheels, and the barrier with the "
               "flat grey sea beyond it along one side.",
        otros="THE OTHER CARS: the road ahead is clear. This car is leading and there is no "
              "car in front of it.",
        otra="CAMERA, AGAIN: an on-board helmet camera looking forward out of the cockpit, "
             "fixed to the car, with the car's own yellow halo and yellow nose held still in "
             "the frame.",
    ),
    dict(
        n=4, nombre="04-morro-costa",
        camara="CAMERA: television race coverage, on-board camera. The shot comes from a "
               "camera mounted on the nose of the car, low and close to the road, looking "
               "forward along the coastal stretch of the circuit.",
        cuadro="IN FRAME: the yellow nose and the yellow front wing of the car across the "
               "bottom of the frame with the two front wheels turning on either side, the "
               "road running ahead, and the barrier with the flat grey sea beyond it along "
               "one side.",
        otros="THE OTHER CARS: the road ahead is clear. This car is leading and there is no "
              "car in front of it.",
        otra="CAMERA, AGAIN: an on-board nose camera looking forward low over the road, fixed "
             "to the car, with the car's own yellow front wing held still in the frame.",
    ),
    dict(
        n=5, nombre="05-rueda-piano",
        camara="CAMERA: television race coverage, on-board camera. The shot comes from a "
               "camera mounted on the side of the cockpit and looking down and across at the "
               "front left wheel, close to the road, as the car runs along a painted kerb.",
        cuadro="IN FRAME: the front left wheel turning against the yellow bodywork of the "
               "car, the yellow suspension arms reaching out to it, and the white and red "
               "kerb running under the wheel with the grey asphalt beside it.",
        otros="THE OTHER CARS: no other car is in frame.",
        otra="CAMERA, AGAIN: an on-board cockpit-side camera looking down at the front left "
             "wheel and the kerb, fixed to the car, with the car's own yellow bodywork held "
             "still in the frame.",
    ),
    dict(
        n=6, nombre="06-arco-tribuna",
        camara="CAMERA: television race coverage, on-board camera. The shot comes from the "
               "camera mounted on the roll hoop behind the driver's head, looking forward "
               "over the top of the car along the stretch of track that runs past the main "
               "grandstand.",
        cuadro="IN FRAME: the yellow nose of the car stretching away below the camera with "
               "the yellow halo bar across the bottom of the frame and the top of the "
               "driver's yellow helmet just under it, the road ahead, and the grey "
               "grandstand with its sparse crowd going by on one side.",
        otros="THE OTHER CARS: the road ahead is clear. This car is leading and there is no "
              "car in front of it.",
        otra="CAMERA, AGAIN: an on-board roll-hoop camera looking forward over the nose, "
             "fixed to the car, with the car's yellow bodywork held still in the frame.",
    ),
    dict(
        n=7, nombre="07-aleron-recta",
        # SEGUNDA VERSION, Y ES EL PLANO QUE LAS DOS PRIMERAS DEVOLVIERON SOLAS. Cuando se le
        # pidio una camara mirando hacia atras, el modelo puso la camara ATRAS y la dejo
        # mirando adelante: el aleron trasero enmarcando el cuadro, el auto entero por
        # delante y la pista mas alla. Es un plano bueno y es distinto de los otros siete, y
        # lo unico que estaba mal era el auto ajeno adelante. Asi que se pide eso mismo, en
        # positivo, con la ruta despejada -- que es ademas lo que le corresponde al que va
        # primero. Es la leccion del encuadre de la T-03 otra vez: se nombra el plano que el
        # modelo sabe hacer, no las coordenadas de la camara.
        camara="CAMERA: television race coverage, on-board camera looking forward from the "
               "back of the car. The shot comes from a camera mounted on the rear wing and "
               "looking forward along the whole length of the car, down the main straight.",
        cuadro="IN FRAME: the yellow rear wing framing the top of the frame, the yellow "
               "engine cover, the driver's yellow helmet and the yellow halo below it, the "
               "yellow nose stretching away ahead between the front wheels, and the empty "
               "road running out in front of the car.",
        otros="THE OTHER CARS: the road ahead is clear. This car is leading and there is no "
              "car in front of it.",
        otra="CAMERA, AGAIN: an on-board camera on the rear wing looking forward over the "
             "whole car, fixed to the car, with the car's own yellow bodywork held still in "
             "the frame and the road ahead empty.",
    ),
    dict(
        n=8, nombre="08-arco-curvon",
        camara="CAMERA: television race coverage, on-board camera. The shot comes from the "
               "camera mounted on the roll hoop behind the driver's head, looking forward "
               "over the top of the car through one long open left-hand curve.",
        cuadro="IN FRAME: the yellow nose of the car stretching away below the camera with "
               "the yellow halo bar across the bottom of the frame, the road curving away "
               "ahead with its white and red kerb on the inside, and the low green coastal "
               "scrub beyond the barrier.",
        otros="THE OTHER CARS: the road ahead is clear. This car is leading and there is no "
              "car in front of it.",
        otra="CAMERA, AGAIN: an on-board roll-hoop camera looking forward over the nose, "
             "fixed to the car, through one long open curve, with the car's yellow bodywork "
             "held still in the frame.",
    ),
]


def prompt_de(c):
    """El prompt completo de un clip. La camara primero y la camara ultimo.

    El orden de los bloques del medio es el de `generar-programa.py` con dos agregados que
    esta camara necesita: `EL_AUTO` --de que color es la carroceria que se ve-- va antes del
    mundo, porque es lo que hay EN CUADRO; y `ATORNILLADA` va pegado a `CALZADA`, que es
    donde el programa pone `SEGUIMIENTO`.

    El renombre del verde va sobre el prompt YA ARMADO y no sobre cada bloque, porque el
    nombre del color aparece en el padron de seis del bloque del mundo y podria aparecer
    ademas en el bloque del clip: dejar una de las dos apariciones en pie no sirve de nada.
    """
    bloques = [c["camara"], c["cuadro"], EL_AUTO, c["otros"], CALZADA, ATORNILLADA,
               LUGAR, AUTOS, SONIDO, c["otra"]]
    p = "\n\n".join(bloques)
    viejo, nuevo = RENOMBRE_VERDE
    if viejo not in p:
        raise SystemExit(
            "clip %d: el renombre pide reemplazar %r y ese texto no esta en el prompt. El "
            "renombre se convirtio en un no-op y el clip saldria con el nombre viejo sin "
            "que nada avise." % (c["n"], viejo))
    return p.replace(viejo, nuevo)


# ---------------------------------------------------------------------------------------
# El registro de gasto, que es lo que hace que el tope no dependa de la memoria de nadie.
# ---------------------------------------------------------------------------------------

def generaciones_ya_lanzadas():
    if not os.path.exists(REGISTRO):
        return 0
    with open(REGISTRO) as f:
        return sum(1 for ln in f if ln.strip() and not ln.startswith("#"))


def anotar(clip, operacion, estado):
    nuevo = not os.path.exists(REGISTRO)
    os.makedirs(os.path.dirname(REGISTRO), exist_ok=True)
    with open(REGISTRO, "a") as f:
        if nuevo:
            f.write("# una linea por GENERACION LANZADA, que es lo que se paga.\n")
            f.write("# fecha\tclip\toperacion\tUS$\testado\n")
        f.write("%s\t%s\t%s\t%.2f\t%s\n" % (
            time.strftime("%Y-%m-%dT%H:%M:%S"), clip, operacion,
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
        sys.exit(__doc__.splitlines()[0] + "\n  uso: generar-camara.py <clips: 1 2 | 1-8>")

    pedidos = []
    for a in args:
        if "-" in a:
            d, h = a.split("-")
            pedidos += list(range(int(d), int(h) + 1))
        else:
            pedidos.append(int(a))

    os.makedirs(DEST, exist_ok=True)
    porhacer = []
    for n in pedidos:
        c = next(x for x in CLIPS if x["n"] == n)
        salida = os.path.join(DEST, c["nombre"] + ".mp4")
        if os.path.exists(salida) and os.path.getsize(salida) > 0 and not regenerar:
            print("== clip %2d (%s): ya esta, no se regenera ==" % (n, c["nombre"]))
            continue
        porhacer.append(c)
    if not porhacer:
        print("nada para generar")
        return

    ya = generaciones_ya_lanzadas()
    if ya + len(porhacer) > TOPE_GENERACIONES:
        sys.exit("TOPE: hay %d generaciones lanzadas y se piden %d; el tope de la etapa 2 es "
                 "%d (US$%.2f). Corre menos clips o cierra la task con lo que hay."
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
                print("  clip %2d: ERROR al lanzar -- %s" % (c["n"], json.dumps(r)[:400]))
                anotar(c["n"], "(sin operacion)", "ERROR-AL-LANZAR")
                continue
            anotar(c["n"], op, "lanzada")
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
                salida = os.path.join(DEST, c["nombre"] + ".mp4")
                if "error" in e:
                    print("  clip %2d: Vertex devolvio error: %s"
                          % (c["n"], json.dumps(e["error"])[:300]))
                    continue
                vids = (e.get("response") or {}).get("videos") or []
                if not vids or not vids[0].get("bytesBase64Encoded"):
                    print("  clip %2d: termino sin video -- %s"
                          % (c["n"], json.dumps(e)[:300]))
                    continue
                with open(salida, "wb") as f:
                    f.write(base64.b64decode(vids[0]["bytesBase64Encoded"]))
                dur = sh("ffprobe -v error -show_entries format=duration -of csv=p=0 '%s'" % salida)
                print("  clip %2d LISTO  %s  (%ss, %.1f MB)"
                      % (c["n"], os.path.basename(salida), dur,
                         os.path.getsize(salida) / 1e6))
            pendientes = siguen
            if pendientes:
                print("     siguen %d ..." % len(pendientes))
        for c, op in pendientes:
            print("  clip %2d: NO TERMINO en quince minutos. La operacion sigue viva y el "
                  "clip se baja con ella sin volver a pagar:\n     %s" % (c["n"], op))


if __name__ == "__main__":
    main()
