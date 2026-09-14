"""medir-color.py -- el color de un recorte de un cuadro, con el MISMO estimador con el
que la T-01 midio las fichas.

POR QUE IMPORTA QUE SEA EL MISMO. El numero contra el que se compara -- el hexadecimal de
race.json -- salio de `mediana.py` de la T-01: mediana de los pixeles del recorte con
S>0.35 y V>0.25 en HSV. Si aca se midiera con otro estimador, la diferencia entre el color
de la ficha y el del clip incluiria la diferencia entre los dos estimadores, y no habria
forma de separarlas. `de.py` se importa por path desde la carpeta de la T-01 en lugar de
copiarse, por la misma razon: dos copias de la misma formula se despegan.

QUE DEVUELVE, y las tres columnas son distintas:

  - `filtrado`: la mediana de los pixeles con S>0.35 y V>0.25. Es el estimador de la T-01,
    y es el unico comparable contra el hexadecimal de la ficha.
  - `cromatico`: la mediana de los pixeles con S>0.12 y V>0.20. Es el mismo estimador con
    la puerta mucho mas abierta.
  - `crudo`: la mediana de TODOS los pixeles del recorte.

SE DEVUELVEN LOS TRES PORQUE EL DE LA T-01 SE ROMPE ACA, y el modo de romperse es traidor.
La ficha es un auto quieto, cerca y bien iluminado: su librea pasa el filtro con el 20 o el
30 por ciento del recorte. En una toma de carrera la misma librea vuelve lavada por la
distancia, el desenfoque de movimiento y la luz plana, y del recorte pasa el 2 por ciento.
Una mediana sobre el 2 por ciento de los pixeles no es el color del auto: es el color de
los pocos brillos que quedaron saturados, y salta de cuadro a cuadro aunque el auto sea el
mismo.

`cromatico` es la misma medicion sin ese sesgo, y sigue teniendo que dar rojo donde no hay
auto: el asfalto de estos clips mide S entre 0,03 y 0,08, muy por debajo de 0,12. Si las
dos columnas coinciden, el numero es solido; si se separan, el de la T-01 esta midiendo
brillos y el que vale es el otro. `%pasa` dice sobre cuanta superficie salio cada uno, y
sin ese porcentaje los dos hexadecimales se leerian como igual de confiables.

EL CONTROL ESTA EN EL USO Y NO EN EL SCRIPT. Una medicion de color que no se vio dar
distinto sobre un recorte donde el auto no esta no mide el auto, mide el asfalto. Por eso
cada corrida mide tambien un recorte de asfalto vacio del MISMO cuadro y reporta su dE00
contra la ficha: si ese numero no es grande, el instrumento no esta midiendo el auto.
"""
import sys, json, colorsys, statistics, os
from PIL import Image

T01 = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "..", "..", "T-01-el-mundo-y-los-autos", "salidas")
sys.path.insert(0, os.path.abspath(T01))
from de import d  # noqa: E402  -- dE00 entre dos hexadecimales, la de la T-01


def medir(img, rect):
    """rect = (x, y, w, h) en pixeles sobre la imagen."""
    x, y, w, h = rect
    crop = img.crop((x, y, x + w, y + h)).convert("RGB")
    px = list(crop.getdata())
    n = len(px)
    sat, cro = [], []
    for r, g, b in px:
        _, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if s > 0.35 and v > 0.25:
            sat.append((r, g, b))
        if s > 0.12 and v > 0.20:
            cro.append((r, g, b))

    def mediana(muestras):
        if not muestras:
            return None
        return "#%02X%02X%02X" % tuple(
            round(statistics.median(c[i] for c in muestras)) for i in range(3))

    return {"n": n, "pasa": len(sat), "pct": 100.0 * len(sat) / n if n else 0.0,
            "pasaC": len(cro), "pctC": 100.0 * len(cro) / n if n else 0.0,
            "filtrado": mediana(sat), "cromatico": mediana(cro), "crudo": mediana(px)}


def hue(hexv):
    h = hexv.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return round(colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)[0] * 360)


if __name__ == "__main__":
    # argv: <cuadro.png> <json con [{etiqueta, rect:[x,y,w,h], ref:"#RRGGBB"|null}, ...]>
    cuadro, pedido = sys.argv[1], sys.argv[2]
    img = Image.open(cuadro)
    print(f"{os.path.basename(cuadro)}  ({img.width}x{img.height})")
    for it in json.load(open(pedido)):
        m = medir(img, it["rect"])
        ref = it.get("ref")
        f, q, c = m["filtrado"], m["cromatico"], m["crudo"]
        print(f"  {it['etiqueta']:<22s} rect={tuple(it['rect'])!s:<22s} ref={ref or '-'}")
        for nombre, val, cnt, pct in (("filtrado S>.35", f, m["pasa"], m["pct"]),
                                      ("cromatico S>.12", q, m["pasaC"], m["pctC"]),
                                      ("crudo  todos  ", c, m["n"], 100.0)):
            linea = f"      {nombre}  {val or '(ninguno)':<8s}"
            if val:
                linea += f" hue={hue(val):3d}deg"
            else:
                linea += "          "
            linea += f"  n={cnt:7d} ({pct:5.1f}%)"
            if ref and val:
                linea += f"  dE00 vs ref = {d(val, ref):5.1f}"
            print(linea)
