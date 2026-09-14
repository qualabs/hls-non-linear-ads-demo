"""colores-del-programa.py -- el color de cada auto medido SOBRE LOS CLIPS DEL PROGRAMA,
que es lo que el espectador va a ver, y la separacion entre los seis.

POR QUE SE MIDE ACA Y NO SE LEE DE LA FICHA. Los seis hexadecimales que la T-01 dejo en
`race.json` se midieron sobre las fichas, y las fichas las dibujo Imagen. Los clips los
dibuja Veo, que es otro modelo, y el sondeo de la T-02 midio lo que eso cuesta: de los seis
colores pedidos, cinco volvieron a mas de 7 de dE00 de su ficha y tres a mas de 25. La regla
que la propia T-01 escribio -- "una propiedad se mide atravesando la herramienta que la
produce" -- aplicada un nivel mas arriba: la herramienta que produce lo que se ve es Veo.

Asi que aca la ficha deja de ser la especificacion y el clip pasa a serlo. Lo que sale de
este script es lo que va a `race.json`, y las fichas se regeneran despues para parecerse a
esto y no al reves.

LAS DOS PREGUNTAS SON DISTINTAS Y LAS DOS SE CONTESTAN:

  1. LA SEPARACION MUTUA -- que los seis se distingan ENTRE SI. Es de lo que depende que el
     selector signifique algo: hay cuatro cajas en pantalla a la vez y el color es lo unico
     que dice cual es cual. Un juego corrido parejo hacia otro lado sigue sirviendo; uno
     donde dos se juntaron, no.
  2. LA CONSTANCIA DE CADA AUTO ENTRE CASILLAS -- que CALDRIX sea el mismo amarillo en la
     casilla 2 y en la 13. Si cada casilla lo dibuja de otro color, el color no identifica
     nada aunque los seis esten separados adentro de cada cuadro. Esta pregunta no existia
     en el sondeo, porque con un clip no hay entre que comparar.

EL ESTIMADOR Y POR QUE HAY DOS. `filtrado` (S>0.35) es el de la T-01, el unico comparable
contra el hexadecimal de la ficha. `cromatico` (S>0.12) es el mismo con la puerta abierta.
En una toma de carrera la librea vuelve lavada y del recorte pasa a veces el 2 %: una
mediana sobre el 2 % de los pixeles no es el color del auto, es el color de los pocos
brillos que quedaron saturados. Por eso toda fila lleva su `%` y por eso la agregacion
DESCARTA las medidas por debajo de PISO_PCT: una medicion sobre cuatro pixeles no vota.

EL CONTROL VA EN CADA CUADRO y es el mismo de la T-02: un recorte de asfalto vacio del
MISMO cuadro tiene que devolver "(ninguno)" -- cero pixeles cromaticos. Si devolviera un
color, el instrumento estaria midiendo el asfalto y llamandolo librea.

  python3 colores-del-programa.py <carpeta de cuadros> <rects/*.json ...>
"""
import sys

# NO SE ESCRIBE BYTECODE. Estos scripts importan `de.py` y `medir-color.py` de las carpetas
# de la T-01 y la T-02, y el import deja un __pycache__ adentro de carpetas que SI van a
# git. Un temporal que termina commiteado es basura en el arbol de otra task.
sys.dont_write_bytecode = True

import json
import os
import statistics
import sys

sys.path.insert(0, os.path.abspath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..",
    "T-02-el-sondeo-de-dos-clips", "salidas")))
sys.path.insert(0, os.path.abspath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..",
    "T-01-el-mundo-y-los-autos", "salidas")))

import itertools  # noqa: E402

from PIL import Image  # noqa: E402

from de import d  # noqa: E402  -- dE00, la de la T-01

# `medir-color.py` de la T-02 se carga POR PATH y no se copia. Es el mismo estimador con el
# que se midio el sondeo y con el que la T-01 midio las fichas: si aca se midiera con otro,
# la diferencia entre los numeros incluiria la diferencia entre los dos estimadores y no
# habria forma de separarlas. El guion del nombre impide un `import` normal.
import importlib.util  # noqa: E402
_ruta = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..",
                     "T-02-el-sondeo-de-dos-clips", "salidas", "medir-color.py")
_spec = importlib.util.spec_from_file_location("medir_color", os.path.abspath(_ruta))
_mc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mc)
medir, hue = _mc.medir, _mc.hue

PISO_PCT = 15.0   # por debajo de esto la medida no vota en la agregacion

# CUAL DE LOS DOS ESTIMADORES AGREGA, y por que este. Se agrega el `filtrado` (S>0.35), que
# es el de la T-01 y el unico comparable contra el hexadecimal de la ficha. El `cromatico`
# (S>0.12) se imprime al lado pero NO vota, porque sobre un auto oscuro arrastra hacia los
# brillos: MARVOK, que es violeta, mide #3B1F5B con el filtrado y #9D93C4 con el cromatico
# en el mismo recorte -- un lavanda palido que es el reflejo del cielo sobre la carroceria y
# no la librea. El precio de usar el filtrado es que sobre un auto lejano y lavado pasa el
# 4 % del recorte, y por eso existe el piso: una medicion sobre el 4 % de los pixeles no
# vota. Las dos columnas quedan impresas para que se pueda ver donde se separan.

FICHAS = {"CALDRIX": "#CEBC35", "MARVOK": "#632EA3", "NOCTEV": "#09B3A1",
          "RUNTAK": "#5B223C", "PENTAV": "#38822D", "QUENTRA": "#55432E"}


def main():
    cuadros = sys.argv[1]
    porauto = {k: [] for k in FICHAS}
    print("=" * 78)
    print("1. CADA CUADRO, CADA RECORTE")
    print("=" * 78)
    for pedido in sys.argv[2:]:
        base = os.path.basename(pedido).replace(".json", "")
        clip, t = base.rsplit("-t", 1)
        img = Image.open(os.path.join(cuadros, f"{clip}-t{t}.png"))
        print(f"\n--- {clip}  t={t}s  ({img.width}x{img.height}) ---")
        for it in json.load(open(pedido)):
            m = medir(img, it["rect"])
            et = it["etiqueta"]
            ref = FICHAS.get(et.split("-")[0])
            f, q = m["filtrado"], m["cromatico"]
            linea = (f"  {et:<16s} filtrado {f or '(ninguno)':<8s} {m['pct']:5.1f}%"
                     f"   cromatico {q or '(ninguno)':<8s} {m['pctC']:5.1f}%")
            if q:
                linea += f"  hue={hue(q):3d}deg"
            if ref and q:
                linea += f"  dE00 vs ficha={d(q, ref):5.1f}"
            print(linea)
            if et in FICHAS and f and m["pct"] >= PISO_PCT:
                porauto[et].append((clip, t, f, m["pct"]))

    print()
    print("=" * 78)
    print(f"2. EL COLOR DE CADA AUTO -- mediana de sus medidas con >= {PISO_PCT:.0f}% del recorte")
    print("=" * 78)
    repre = {}
    for k, v in porauto.items():
        if not v:
            print(f"\n  {k:<9s} SIN MEDIDAS por encima del piso")
            continue
        canales = []
        for i in (0, 2, 4):
            canales.append(round(statistics.median(int(x[2][1:][i:i + 2], 16) for x in v)))
        rep = "#%02X%02X%02X" % tuple(canales)
        repre[k] = rep
        disp = max((d(a[2], b[2]) for a, b in itertools.combinations(v, 2)), default=0.0)
        print(f"\n  {k:<9s} {rep}  hue={hue(rep):3d}deg   n={len(v)} medidas   "
              f"dispersion entre casillas (max dE00) = {disp:.1f}   "
              f"dE00 vs su ficha = {d(rep, FICHAS[k]):.1f}")
        for clip, t, h, pct in v:
            print(f"      {clip:<26s} t={t}s  {h}  ({pct:4.1f}%)  dE00 vs representante="
                  f"{d(h, rep):5.1f}")

    print()
    print("=" * 78)
    print("3. LA SEPARACION ENTRE LOS SEIS -- lo que decide si el selector significa algo")
    print("=" * 78)
    print()
    for juego, nombre in ((repre, "los clips del programa (Veo)"),
                          (FICHAS, "las fichas de la T-01 (Imagen) -- REFERENCIA, medida "
                                   "por otra task sobre otras imagenes")):
        if len(juego) < 2:
            continue
        print(f"  {nombre}")
        m = (999, None)
        for a, b in itertools.combinations(sorted(juego), 2):
            v = d(juego[a], juego[b])
            print(f"    {a:<9s} {juego[a]}  vs  {b:<9s} {juego[b]}   dE00={v:6.1f}")
            if v < m[0]:
                m = (v, (a, b))
        print(f"    --> MIN MUTUA = {m[0]:.1f}   {m[1]}\n")


if __name__ == "__main__":
    main()
