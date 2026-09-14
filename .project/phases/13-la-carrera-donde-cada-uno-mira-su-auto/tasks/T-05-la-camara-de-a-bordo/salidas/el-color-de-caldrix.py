"""el-color-de-caldrix.py -- el cruce que la compuerta 2 existe para medir: si el auto de
esta camara es el mismo auto que el programa muestra, y si sigue siendo el mismo a lo largo
de los ocho clips.

LAS TRES PREGUNTAS SON DISTINTAS Y LAS TRES SE CONTESTAN POR SEPARADO:

  1. EL CRUCE CONTRA EL PROGRAMA. El amarillo que esta camara dibuja sobre su propia
     carroceria contra el amarillo que el PROGRAMA dibuja sobre CALDRIX. La referencia no
     sale de este calculo: son las cuatro casillas del programa donde CALDRIX esta nombrado
     y grande -- la 2, la 3, la 8 y la 13 --, medidas por la T-03 con sus propios recortes,
     que este script carga POR PATH y no copia. La 8 es la que importa mas, porque es la
     unica que cae DENTRO de la ventana de la oferta (segundos 56 a 64 de una ventana que va
     de 28 a 92): ahi el espectador puede tener el programa y esta camara en pantalla al
     mismo tiempo, y son los dos unicos cuadros de la demo que se comparan solos.

  2. LA CONSTANCIA ENTRE LOS OCHO. Un feed son ocho clips seguidos DEL MISMO AUTO, asi que
     una dispersion grande es el auto cambiando de color adentro de su propia caja. Es lo
     que la T-03 midio para el programa y encontro llegando a 35,8 en QUENTRA; aca la
     pregunta es la misma con ocho medidas en vez de dos.

  3. SI SE PUEDE CONFUNDIR CON OTRO AUTO. El color del feed contra los otros cinco de
     `race.json`. Es la fila del selector: si el amarillo de esta camara queda mas cerca de
     otro auto que de si mismo, la fila no significa nada.

EL ESTIMADOR NO SE ELIGE ACA. Es el de la T-01 -- mediana de los pixeles con S>0,35 y
V>0,25 --, cargado por path desde la T-02, que es el mismo con el que se midieron las fichas
y los catorce clips del programa. Medir con otro haria que la diferencia entre los numeros
incluyera la diferencia entre los dos estimadores y no habria forma de separarlas.

EL CONTROL VA EN CADA CUADRO y es el de la T-02: un recorte de asfalto vacio del MISMO
cuadro tiene que devolver "(ninguno)", cero pixeles cromaticos. Si devolviera un color, el
instrumento estaria midiendo el piso y llamandolo librea. Los ocho recortes se dibujaron
sobre su cuadro y se miraron antes de medir (marcar.py de la T-03).

  python3 el-color-de-caldrix.py <carpeta de cuadros de la camara> <carpeta de cuadros del programa>
"""
import sys

# NO SE ESCRIBE BYTECODE: el import deja un __pycache__ adentro de carpetas que SI van a
# git, y un temporal commiteado es basura en el arbol de otra task.
sys.dont_write_bytecode = True

import glob
import importlib.util
import itertools
import json
import os
import statistics

from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
FASE = os.path.abspath(os.path.join(AQUI, "..", ".."))
T01 = os.path.join(FASE, "T-01-el-mundo-y-los-autos", "salidas")
T02 = os.path.join(FASE, "T-02-el-sondeo-de-dos-clips", "salidas")
T03 = os.path.join(FASE, "T-03-el-programa", "salidas")
sys.path.insert(0, T01)

from de import d  # noqa: E402  -- dE00, la de la T-01

_spec = importlib.util.spec_from_file_location("medir_color", os.path.join(T02, "medir-color.py"))
_mc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mc)
medir, hue = _mc.medir, _mc.hue

PISO_PCT = 15.0   # por debajo de esto la medida no vota, igual que en la T-03

# Los seis de race.json, medidos por la T-03 SOBRE LOS CATORCE CLIPS DEL PROGRAMA. Es la
# referencia de la pregunta 3 y no sale de este calculo.
RACE = {"CALDRIX": "#CCB21F", "MARVOK": "#381A6A", "NOCTEV": "#24ACC8",
        "RUNTAK": "#661955", "PENTAV": "#2D6E24", "QUENTRA": "#876E46"}

# Las casillas del programa donde CALDRIX esta nombrado y grande, con los recortes que dejo
# la T-03. La 8 es la que cae adentro de la ventana de la oferta.
CASILLAS_CALDRIX = ["02-caldrix-seguimiento-t4.0", "03-caldrix-marvok-rebufo-t4.0",
                    "08-caldrix-cerrado-t4.0", "13-caldrix-marvok-recta-t4.0"]


def medidas(cuadros, rects_dir, pedidos, etiqueta="CALDRIX"):
    """Devuelve [(base, hex, pct)] para la etiqueta pedida, e imprime cada recorte."""
    salida = []
    for base in pedidos:
        rj = os.path.join(rects_dir, base + ".json")
        png = os.path.join(cuadros, base + ".png")
        if not (os.path.exists(rj) and os.path.exists(png)):
            print("  %-34s FALTA (%s)" % (base, "sin rects" if not os.path.exists(rj) else "sin cuadro"))
            continue
        img = Image.open(png)
        for it in json.load(open(rj)):
            m = medir(img, it["rect"])
            f, q = m["filtrado"], m["cromatico"]
            linea = ("  %-34s %-14s filtrado %-9s %5.1f%%   cromatico %-9s %5.1f%%"
                     % (base, it["etiqueta"], f or "(ninguno)", m["pct"],
                        q or "(ninguno)", m["pctC"]))
            if f:
                linea += "  hue=%3ddeg" % hue(f)
            print(linea)
            if it["etiqueta"] == etiqueta and f and m["pct"] >= PISO_PCT:
                salida.append((base, f, m["pct"]))
    return salida


def representante(ms):
    canales = [round(statistics.median(int(x[1][1:][i:i + 2], 16) for x in ms))
               for i in (0, 2, 4)]
    return "#%02X%02X%02X" % tuple(canales)


def main():
    cuadros_cam, cuadros_prog = sys.argv[1], sys.argv[2]
    rects_cam = os.path.join(AQUI, "rects")
    rects_prog = os.path.join(T03, "rects")

    print("=" * 86)
    print("1. LOS OCHO CLIPS DE LA CAMARA -- cada recorte, con su control de asfalto")
    print("=" * 86)
    bases = sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(rects_cam, "*.json")))
    cam = medidas(cuadros_cam, rects_cam, bases)

    print()
    print("=" * 86)
    print("2. LAS CUATRO CASILLAS DEL PROGRAMA DONDE ESTA CALDRIX -- la referencia")
    print("=" * 86)
    print("   (recortes de la T-03, cargados por path: los midio otra task sobre otras imagenes)")
    prog = medidas(cuadros_prog, rects_prog, CASILLAS_CALDRIX)

    if not cam or not prog:
        sys.exit("\nsin medidas suficientes por encima del piso del %.0f%%" % PISO_PCT)

    rep_cam, rep_prog = representante(cam), representante(prog)

    print()
    print("=" * 86)
    print("3. EL CRUCE: el auto de la camara contra el auto del programa")
    print("=" * 86)
    print()
    print("  la camara de a bordo  %s  hue=%3ddeg   n=%d clips" % (rep_cam, hue(rep_cam), len(cam)))
    print("  el programa           %s  hue=%3ddeg   n=%d casillas" % (rep_prog, hue(rep_prog), len(prog)))
    print("  race.json             %s  hue=%3ddeg   (lo que el selector pinta en la fila)"
          % (RACE["CALDRIX"], hue(RACE["CALDRIX"])))
    print()
    print("  dE00  camara  vs  programa   = %5.1f" % d(rep_cam, rep_prog))
    print("  dE00  camara  vs  race.json  = %5.1f" % d(rep_cam, RACE["CALDRIX"]))
    print()
    print("  y clip por clip contra la casilla 8, que es la unica que cae DENTRO de la ventana:")
    c8 = [x for x in prog if x[0].startswith("08-")]
    if c8:
        for base, h, pct in cam:
            print("    %-34s %s  vs  casilla 8 %s   dE00=%5.1f"
                  % (base, h, c8[0][1], d(h, c8[0][1])))
    else:
        print("    la casilla 8 no dio medida por encima del piso")

    print()
    print("=" * 86)
    print("4. LA CONSTANCIA ENTRE LOS OCHO -- un feed es el mismo auto ocho veces")
    print("=" * 86)
    print()
    for base, h, pct in cam:
        print("    %-34s %s  (%4.1f%% del recorte)  dE00 vs representante=%5.1f"
              % (base, h, pct, d(h, rep_cam)))
    par = max(itertools.combinations(cam, 2), key=lambda ab: d(ab[0][1], ab[1][1]))
    print()
    print("    DISPERSION MAXIMA = %.1f   entre %s y %s"
          % (d(par[0][1], par[1][1]), par[0][0], par[1][0]))

    print()
    print("=" * 86)
    print("5. SI SE PUEDE CONFUNDIR CON OTRO AUTO -- el color del feed contra los otros cinco")
    print("=" * 86)
    print()
    otros = sorted((d(rep_cam, v), k) for k, v in RACE.items() if k != "CALDRIX")
    for v, k in otros:
        print("    %-9s %s   dE00=%6.1f" % (k, RACE[k], v))
    print()
    print("    el mas cercano de los otros cinco esta a %.1f; el propio CALDRIX del programa,"
          % otros[0][0])
    print("    a %.1f. Si el primero fuera menor que el segundo, la fila del selector no"
          % d(rep_cam, rep_prog))
    print("    significaria nada.")


if __name__ == "__main__":
    main()
