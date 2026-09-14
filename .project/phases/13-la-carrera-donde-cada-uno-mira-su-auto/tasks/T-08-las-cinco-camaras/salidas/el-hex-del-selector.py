"""el-hex-del-selector.py -- la decision que la T-05 dejo abierta: si el `#CCB21F` de CALDRIX
en `race.json` tiene que correrse hacia el amarillo mas brillante que devuelve su camara de
a bordo.

LA PREGUNTA NO ES "CUAL DE LOS DOS AMARILLOS ES EL VERDADERO", y por eso la T-05 no la pudo
cerrar sola. El hexadecimal de `race.json` no existe para reproducir un cuadro: existe para
que LAS SEIS FILAS DEL SELECTOR se distingan entre si y contra el fondo oscuro del panel. Con
esa vara, lo que hay que medir no es la distancia entre la camara y el programa -- eso ya lo
midio la T-05 en 15,4 -- sino DOS cosas que la T-05 no midio:

  1. LA SEPARACION ENTRE LAS SEIS FILAS. Si las seis ya se distinguen, mover una las
     reacomoda a todas y puede acercar dos que hoy estan separadas. El riesgo de tocar es
     real y el beneficio seria estetico.

  2. CADA FILA CONTRA EL FONDO DEL PANEL. Una fila que no se despega del fondo no se lee, y
     esa es la unica falla que rompe el selector de verdad. El fondo es
     `rgba(12, 16, 24, 0.82)` de `.qa-views` en `lib/controls.js`, o sea #0C1018 sobre el
     video. Se mide contra los dos extremos de lo que puede haber atras: el panel sobre negro
     (#0A0D13, el caso mas oscuro) y sobre un cuadro claro del programa (el caso mas claro),
     porque un panel translucido no tiene UN fondo.

Y SE MIDE SOBRE EL PROGRAMA, que es la toma donde los seis autos se comparan. Los seis
hexadecimales de `race.json` salieron de ahi -- la T-03 los midio sobre los catorce clips --,
asi que la comparacion entre filas es una comparacion entre seis medidas del mismo origen. El
amarillo de la camara de a bordo NO entra en la cuenta: ahi el color lo deforma la luz de
adentro del auto, que es justo la razon por la que se ve mas brillante.

EL CONTROL, sin el cual "las seis se distinguen" no significa nada: la misma cuenta sobre seis
grises que NADIE podria distinguir en una fila, y sobre el par mas parecido de la serie. Si el
instrumento no separa los grises, no esta midiendo separacion.

  python3 el-hex-del-selector.py
"""
import json
import os
import sys

sys.dont_write_bytecode = True

import itertools

AQUI = os.path.dirname(os.path.abspath(__file__))
FASE = os.path.abspath(os.path.join(AQUI, "..", ".."))
sys.path.insert(0, os.path.join(FASE, "T-01-el-mundo-y-los-autos", "salidas"))
from de import d as _d  # noqa: E402  -- el mismo dE00 con el que se midio todo lo demas


def dE00(a, b):
    """`de.d` de la T-01 toma hexadecimales; aca se trabaja con ternas, asi que se convierte
    en la puerta y no se reimplementa la formula. Reimplementarla seria medir con otro
    instrumento y los numeros dejarian de ser comparables con los de las otras tasks."""
    f = lambda x: x if isinstance(x, str) else "#%02X%02X%02X" % tuple(x)
    return _d(f(a), f(b))

RACE = os.path.abspath(os.path.join(FASE, "..", "..", "..", "..", "demo", "race-multiview",
                                    "race.json"))


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mezcla(frente, fondo, a):
    """El panel es translucido: lo que se ve es su color mezclado con lo que hay atras."""
    return tuple(round(frente[i] * a + fondo[i] * (1 - a)) for i in range(3))


def hexa(t):
    return "#%02X%02X%02X" % t


feeds = json.load(open(RACE))["feeds"]
print("Los seis colores de race.json, que son los que la T-03 midio sobre el programa:\n")
for f in feeds:
    print("  %-14s %-8s %s" % (f["id"].replace("view-", "").upper(), f["color"],
                               f["name"]))

# ------------------------------------------------------------------------------------
print("\n" + "=" * 86)
print("1. LAS SEIS FILAS ENTRE SI -- dE00 de los quince pares")
print("=" * 86 + "\n")
pares = []
for a, b in itertools.combinations(feeds, 2):
    x = dE00(a["color"], b["color"])
    pares.append((x, a["id"].replace("view-", ""), b["id"].replace("view-", "")))
for x, a, b in sorted(pares):
    print("  %-10s %-10s %6.1f" % (a, b, x))
minimo = min(pares)
print("\n  el par mas parecido: %s / %s, dE00 %.1f" % (minimo[1], minimo[2], minimo[0]))

# EL CONTROL. Seis grises que en una fila del selector nadie podria distinguir: si el
# instrumento no los marca como el caso malo, no esta midiendo lo que dice medir.
GRISES = ["#6E6E6E", "#727272", "#767676", "#7A7A7A", "#7E7E7E", "#828282"]
gp = [dE00(a, b) for a, b in itertools.combinations(GRISES, 2)]
print("  CONTROL -- seis grises separados de a cuatro puntos de luminancia: dE00 de %.1f a "
      "%.1f" % (min(gp), max(gp)))

# ------------------------------------------------------------------------------------
print("\n" + "=" * 86)
print("2. CADA FILA CONTRA EL FONDO DEL PANEL")
print("=" * 86)
print("""
  El panel es rgba(12, 16, 24, 0.82), asi que su color depende de lo que tenga atras. Se
  miden los dos extremos: sobre negro y sobre un gris claro, que es lo mas claro que el
  video puede poner atras.
""")
PANEL = (12, 16, 24)
for nombre, atras in (("sobre negro", (0, 0, 0)), ("sobre un cuadro claro", (200, 200, 200))):
    fondo = mezcla(PANEL, atras, 0.82)
    print("  %-24s el panel queda en %s" % (nombre, hexa(fondo)))
    for f in feeds:
        x = dE00(f["color"], fondo)
        print("      %-10s %-8s  dE00 %6.1f" % (f["id"].replace("view-", ""), f["color"], x))
    # CONTROL: un color que de verdad no se despega de ese fondo.
    print("      %-10s %-8s  dE00 %6.1f   <-- CONTROL: un gris casi igual al fondo"
          % ("(control)", hexa(fondo), dE00(mezcla(PANEL, atras, 0.82), fondo)))
    casi = tuple(min(255, c + 10) for c in fondo)
    print("      %-10s %-8s  dE00 %6.1f   <-- CONTROL: el fondo + 10 por canal"
          % ("(control)", hexa(casi), dE00(casi, fondo)))
    print()

# ------------------------------------------------------------------------------------
print("=" * 86)
print("3. QUE PASARIA SI SE CORRIERA EL DE CALDRIX")
print("=" * 86)
print("""
  La T-05 midio el amarillo de la camara de a bordo en #F6F252 y dejo dos salidas: dejarlo,
  o correrlo hacia el promedio de los dos. Aca se calculan las dos, contra la unica vara que
  importa -- la separacion de las seis filas -- y no contra el cuadro.
""")
CAMARA = "#F6F252"
PROMEDIO = hexa(tuple(round((rgb("#CCB21F")[i] + rgb(CAMARA)[i]) / 2) for i in range(3)))
for etiqueta, h in (("como esta (el programa)", "#CCB21F"),
                    ("el promedio de los dos", PROMEDIO),
                    ("el de la camara de a bordo", CAMARA)):
    otros = [f for f in feeds if f["id"] != "view-caldrix"]
    ds = [(dE00(h, f["color"]), f["id"].replace("view-", "")) for f in otros]
    cerca = min(ds)
    fondo_n = mezcla(PANEL, (0, 0, 0), 0.82)
    fondo_c = mezcla(PANEL, (200, 200, 200), 0.82)
    print("  %-28s %s   al auto mas cercano (%s): %5.1f   al fondo: %5.1f / %5.1f"
          % (etiqueta, h, cerca[1], cerca[0], dE00(h, fondo_n), dE00(h, fondo_c)))
