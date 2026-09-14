"""comparar-mundo.py -- si dos clips se leen como la misma carrera, el mismo circuito y la
misma luz, medido sobre parches del cuadro y no sobre una impresion.

QUE SE PUEDE MEDIR Y QUE NO, dicho antes de los numeros porque es lo que decide cuanto
valen. Dos tomas de la misma carrera pueden ser un aereo y una rueda: no comparten encuadre,
ni horizonte, ni tribuna. Lo que SI comparten, y es lo que este script mide:

  - el ASFALTO, que esta en las dos y que el parrafo del mundo describe ("dry mid-grey
    asphalt"). Si en un clip es gris medio y en el otro es marron o azulado, la luz o el
    lugar cambiaron.
  - el CUADRO ENTERO, cuya mediana dice el nivel de luz y la dominante de color. Una tarde
    cubierta y una hora dorada no dan el mismo a*/b*.

Lo que NO mide, y por eso no se va a afirmar: que sea el mismo circuito. Dos asfaltos
grises iguales bajo la misma luz pueden ser dos lugares distintos. El "mismo circuito" lo
decide el ojo mirando la lamina, y este script no lo reemplaza.

EL INSTRUMENTO TIENE QUE PODER DAR DISTINTO, y por eso toda corrida lleva sus referencias
negativas al lado de los clips:

  1. el mismo cuadro con una virada calida fuerte (la "hora dorada" sintetica). Si el
     numero no se mueve, el instrumento no mide la luz.
  2. un cuadro de OTRO mundo -- metraje real de otra demo de este repositorio -- en el mismo
     parche. Si el numero no se mueve, el instrumento no mide el lugar.

Una comparacion sin esas dos filas seria un numero chico del que nadie sabe si es chico
porque los clips coinciden o porque el instrumento devuelve siempre lo mismo.
"""
import sys, json, os, statistics, itertools, colorsys
from PIL import Image

T01 = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "..", "..", "T-01-el-mundo-y-los-autos", "salidas")
sys.path.insert(0, os.path.abspath(T01))
from de import d, hex2lab  # noqa: E402


def parche(ruta, rect):
    img = Image.open(ruta).convert("RGB")
    if rect is None:
        crop = img
    else:
        x, y, w, h = rect
        crop = img.crop((x, y, x + w, y + h))
    px = list(crop.getdata())
    return "#%02X%02X%02X" % tuple(
        round(statistics.median(c[i] for c in px)) for i in range(3))


if __name__ == "__main__":
    # argv[1]: json [{etiqueta, cuadro, rect:[x,y,w,h]|null}, ...]
    items = json.load(open(sys.argv[1]))
    med = {}
    print("mediana del parche, y su Lab\n")
    for it in items:
        h = parche(it["cuadro"], it.get("rect"))
        med[it["etiqueta"]] = h
        L, a, b = hex2lab(h)
        hu = round(colorsys.rgb_to_hsv(*[int(h[1:][i:i+2], 16) / 255 for i in (0, 2, 4)])[0] * 360)
        print(f"  {it['etiqueta']:<34s} {h}   L*={L:5.1f}  a*={a:6.1f}  b*={b:6.1f}  hue={hu:3d}deg")
    print("\ndE00 entre parches:")
    for x, y in itertools.combinations(med, 2):
        print(f"  {x:<34s} vs {y:<34s} {d(med[x], med[y]):6.1f}")
