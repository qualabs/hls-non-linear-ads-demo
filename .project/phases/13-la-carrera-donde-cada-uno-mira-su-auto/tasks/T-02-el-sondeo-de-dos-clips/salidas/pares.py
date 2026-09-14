"""pares.py -- la distancia entre cada par de colores de un juego, y el par mas cercano.

ES LA MEDICION QUE CONTESTA LA PREGUNTA DE LA DEMO. Que cada auto se parezca a su ficha es
util; lo que decide si el selector significa algo es que los seis se distingan ENTRE SI,
porque en la grilla hay cuatro cajas a la vez y el color es lo unico que dice cual es cual.
Un juego donde todos se corrieron parejo hacia otro lado sigue sirviendo; uno donde dos se
juntaron, no.

SU REFERENCIA ES `pares-1-fichas-T01.json`, que son los seis hexadecimales de race.json
medidos sobre las fichas quietas. Ese juego da 22,3 de minimo. Correr el mismo instrumento
sobre los colores medidos en movimiento y comparar los dos minimos es toda la medicion, y
lo que la hace valer es que el numero de referencia NO sale de este calculo: sale de la
T-01, medido sobre otras imagenes, antes de que estos clips existieran.

Se le pasa un .json con {etiqueta: "#RRGGBB", ...} y el titulo sale del nombre del archivo.
"""
import sys, os, itertools, json

T01 = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "..", "..", "T-01-el-mundo-y-los-autos", "salidas")
sys.path.insert(0, os.path.abspath(T01))
from de import d  # noqa: E402

cols = json.load(open(sys.argv[1]))
print(os.path.basename(sys.argv[1]).replace(".json", ""))
m = (999, None)
for a, b in itertools.combinations(cols, 2):
    v = d(cols[a], cols[b])
    print(f"  {a:<16s} {cols[a]}  vs  {b:<16s} {cols[b]}   dE00={v:6.1f}")
    if v < m[0]:
        m = (v, (a, b))
print(f"  --> MIN MUTUA = {m[0]:.1f}   {m[1]}")
