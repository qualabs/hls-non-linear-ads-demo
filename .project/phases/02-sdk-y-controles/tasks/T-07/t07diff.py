"""T-07 -- el pane sin modificar, antes y despues, pixel a pixel.

La captura del elemento `#pane-stock` de las dos corridas, comparada entera. Es
la unica forma de mostrar que el skin no lo alcanzo: mirar las capturas prueba
que se parece, y lo que hay que probar es que es el mismo.

Dos cosas hacen falta para que el numero signifique algo, y las dos las prepara
t07run.py: el video del pane se para en el mismo segundo en las dos corridas
--si no, se comparan dos cuadros distintos de la pelicula-- y el pane se empuja
a una fila entera de pixeles, porque la rasterizacion de un texto depende de la
fraccion de pixel en la que cae y el encabezado nuevo lo baja 13,x px.

Uso: t07diff.py <antes.png> <despues.png>
"""
import sys
from PIL import Image, ImageChops

a = Image.open(sys.argv[1]).convert("RGB")
b = Image.open(sys.argv[2]).convert("RGB")
print(f"antes    {sys.argv[1]}  {a.size[0]}x{a.size[1]}")
print(f"despues  {sys.argv[2]}  {b.size[0]}x{b.size[1]}")
if a.size != b.size:
    print("RED: distinto tamano, no son comparables")
    raise SystemExit(1)
d = ImageChops.difference(a, b)
caja = d.getbbox()
distintos = sum(1 for p in d.get_flattened_data() if p != (0, 0, 255) and p != (0, 0, 0))
print(f"pixeles distintos: {0 if caja is None else distintos} de {a.width * a.height}")
print(f"caja de la diferencia: {caja}")
print("GREEN: el pane sin modificar es el mismo pixel por pixel" if caja is None
      else "RED: algo del pane cambio")
raise SystemExit(0 if caja is None else 1)
