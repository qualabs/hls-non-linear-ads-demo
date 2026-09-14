"""medir-fichas-nuevas.py -- si la ficha regenerada se parece al color que Veo dibuja.

LA PREGUNTA CAMBIO DE SENTIDO. La T-01 medía la ficha para escribir `race.json`; acá
`race.json` ya está escrito, medido sobre los catorce clips, y lo que se mide es si la ficha
—el retrato— se acerca a él. El objetivo no es que dé cero: es que la imagen del repositorio
no contradiga lo que se va a ver. Un dE00 por debajo de la escala de esta serie (11,0, que es
la distancia a la que el pasto ya se lee como otro verde que el verde de PENTAV) alcanza.

EL ESTIMADOR ES EL MISMO de la T-01 y de la T-02, cargado por path: mediana de los pixeles
con S>0.35 y V>0.25 sobre un recorte central. En una ficha el auto llena el centro y lo que
queda afuera del filtro son las gomas negras y el asfalto gris.

EL CONTROL es el mismo de siempre y va en cada ficha: un recorte de la esquina, donde sólo
hay asfalto desenfocado, tiene que devolver `(ninguno)`.

  python3 medir-fichas-nuevas.py <carpeta con N-nombre.jpg>
"""
import sys

# NO SE ESCRIBE BYTECODE. Estos scripts importan `de.py` y `medir-color.py` de las carpetas
# de la T-01 y la T-02, y el import deja un __pycache__ adentro de carpetas que SI van a
# git. Un temporal que termina commiteado es basura en el arbol de otra task.
sys.dont_write_bytecode = True

import importlib.util
import itertools
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..",
    "T-01-el-mundo-y-los-autos", "salidas")))
from de import d  # noqa: E402

from PIL import Image  # noqa: E402

_r = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..",
                  "T-02-el-sondeo-de-dos-clips", "salidas", "medir-color.py")
_s = importlib.util.spec_from_file_location("medir_color", os.path.abspath(_r))
_mc = importlib.util.module_from_spec(_s)
_s.loader.exec_module(_mc)

# lo que Veo dibuja, medido sobre los catorce clips del programa -- es el objetivo
VEO = {"1-caldrix": "#CCB21F", "2-marvok": "#381A6A", "3-noctev": "#24ACC8",
       "4-runtak": "#661955", "5-pentav": "#2D6E24", "6-quentra": "#876E46"}

carpeta = sys.argv[1]
med = {}
print("la ficha regenerada contra el color que Veo dibuja\n")
for k in sorted(VEO):
    p = os.path.join(carpeta, k + ".jpg")
    if not os.path.exists(p):
        print(f"  {k:12s} FALTA")
        continue
    img = Image.open(p).convert("RGB")
    w, h = img.width, img.height
    centro = (int(w * .22), int(h * .35), int(w * .56), int(h * .38))
    esquina = (int(w * .02), int(h * .04), int(w * .14), int(h * .10))
    m = _mc.medir(img, centro)
    c = _mc.medir(img, esquina)
    if not m["filtrado"]:
        print(f"  {k:12s} sin pixeles saturados en el centro")
        continue
    med[k] = m["filtrado"]
    print(f"  {k:12s} ficha {m['filtrado']}  hue={_mc.hue(m['filtrado']):3d}deg  "
          f"({m['pct']:4.1f}% del recorte)   Veo {VEO[k]}   "
          f"dE00 = {d(m['filtrado'], VEO[k]):5.1f}"
          f"   CONTROL esquina: {c['filtrado'] or '(ninguno)'}")

print("\nmutuas sobre las fichas regeneradas:")
mn = (999, None)
for a, b in itertools.combinations(sorted(med), 2):
    v = d(med[a], med[b])
    print(f"  {a:12s} vs {b:12s} {v:6.1f}")
    if v < mn[0]:
        mn = (v, (a, b))
print(f"  --> MIN MUTUA = {mn[0]:.1f}  {mn[1]}")
print("\n  referencia: sobre los clips del programa la minima mutua es 13,7 (MARVOK/RUNTAK)")
