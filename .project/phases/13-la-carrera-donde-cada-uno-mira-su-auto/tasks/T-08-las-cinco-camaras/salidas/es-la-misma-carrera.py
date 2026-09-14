"""es-la-misma-carrera.py -- la comprobacion propia de esta task, medida.

LA PREGUNTA. `PHASE.md` la nombra como el R1: que los seis feeds NO se lean como la misma
carrera. La lamina de las seis la contesta a ojo, y esto la contesta con un numero, porque un
"se ven parecidos" no tiene forma de dar distinto.

QUE SE MIDE: EL CIELO. El parrafo del mundo dice "late afternoon under a high, even
overcast" y "a pale sky", y esa es la propiedad que un feed generado aparte rompe primero: la
hora del dia. Es ademas el unico parche que esta en las dos clases de toma -- una camara de a
bordo casi no muestra asfalto, y la T-05 midio que con asfalto el instrumento se mueve por el
barrido de la imagen y no por el mundo.

EL INSTRUMENTO, dicho entero porque de el depende que el numero signifique algo:

  - De cada feed armado se sacan 32 cuadros, uno cada dos segundos. 32 y no uno: un feed son
    ocho clips de generaciones distintas, y un solo cuadro mediria un clip.
  - De cada cuadro se toman los pixeles de la MITAD DE ARRIBA con saturacion < 0,20 y valor
    > 0,55 -- o sea la parte clara y sin color, que es lo que un cielo cubierto es -- y se
    saca la mediana.
  - UN CUADRO CON MENOS DE 2 % DE PIXELES ASI NO VOTA. Es el mismo piso que la T-03 se puso:
    sin el, un cuadro sin cielo devuelve el color de tres pixeles y lo llama cielo.
  - El color del feed es la mediana de los cuadros que votaron.

LOS TRES CONTROLES, y sin ellos esto no mide nada:

  1. HORA DORADA -- los MISMOS cuadros del primer feed virados con la formula de la T-02. Si
     el numero no se mueve, el instrumento no mide la luz.
  2. OTRO MUNDO -- metraje real de la demo del break, que nadie preparo para esto. Si no se
     mueve, no mide el lugar.
  3. LA MITAD DE ABAJO -- el mismo operador sobre la mitad de abajo de los mismos cuadros,
     que es asfalto, piano y carroceria. Si devolviera lo mismo que la de arriba, lo que se
     esta midiendo no es la luz del cielo sino el gris promedio de la imagen, y los seis
     coincidirian por construccion sin que eso dijera nada del mundo.

  python3 es-la-misma-carrera.py <carpeta de trabajo en /dev/shm>
"""
import os
import statistics
import subprocess
import sys

sys.dont_write_bytecode = True

import itertools

from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
FASE = os.path.abspath(os.path.join(AQUI, "..", ".."))
sys.path.insert(0, os.path.join(FASE, "T-01-el-mundo-y-los-autos", "salidas"))
from de import d as dE00  # noqa: E402

RAIZ = os.path.abspath(os.path.join(FASE, "..", "..", "..", ".."))
FUENTES = os.path.join(RAIZ, "demo", "race-multiview", "content", ".fuentes")
T = sys.argv[1]
ORDEN = ["caldrix", "marvok", "noctev", "runtak", "pentav", "quentra"]
PISO_PCT = 2.0


def sh(*a):
    subprocess.run(a, check=True, capture_output=True)


def cielo(p):
    """Mediana del cielo de un cuadro, o None si el cuadro no tiene suficiente cielo."""
    im = Image.open(p).convert("RGB")
    w, h = im.size
    arriba = im.crop((0, 0, w, h // 2))
    px = list(arriba.getdata())
    sel = []
    for r, g, b in px:
        mx, mn = max(r, g, b), min(r, g, b)
        v = mx / 255.0
        s = 0.0 if mx == 0 else (mx - mn) / mx
        if s < 0.20 and v > 0.55:
            sel.append((r, g, b))
    pct = 100.0 * len(sel) / len(px)
    if pct < PISO_PCT:
        return None, pct
    return tuple(round(statistics.median(c[i] for c in sel)) for i in range(3)), pct


def hexa(t):
    return "#%02X%02X%02X" % t


def medir_feed(cam):
    d = os.path.join(T, "cielo", cam)
    os.makedirs(d, exist_ok=True)
    mp4 = os.path.join(FUENTES, cam + ".mp4")
    votos, saltados = [], 0
    for i in range(32):
        p = os.path.join(d, "%02d.png" % i)
        if not os.path.exists(p):
            sh("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(i * 2 + 0.5),
               "-i", mp4, "-frames:v", "1", p)
        c, pct = cielo(p)
        if c is None:
            saltados += 1
        else:
            votos.append(c)
    if not votos:
        return None, 0, saltados
    med = tuple(round(statistics.median(v[i] for v in votos)) for i in range(3))
    return med, len(votos), saltados


print("El cielo de los seis feeds -- mediana de hasta 32 cuadros por feed\n")
print("  %-10s %-9s %-8s %s" % ("feed", "cielo", "votaron", "no votaron (sin cielo suficiente)"))
colores = {}
for cam in ORDEN:
    med, n, s = medir_feed(cam)
    colores[cam] = med
    print("  %-10s %-9s %-8s %d" % (cam, hexa(med) if med else "(ninguno)", n, s))

print("\n" + "=" * 80)
print("LOS QUINCE PARES -- dE00 entre los cielos de los seis feeds")
print("=" * 80 + "\n")
pares = sorted((dE00(hexa(colores[a]), hexa(colores[b])), a, b)
               for a, b in itertools.combinations(ORDEN, 2))
for x, a, b in pares:
    print("  %-10s %-10s %5.1f" % (a, b, x))
print("\n  entre los seis: %.1f a %.1f" % (pares[0][0], pares[-1][0]))

print("\n" + "=" * 80)
print("LOS CONTROLES")
print("=" * 80 + "\n")

# 1. HORA DORADA sobre los MISMOS cuadros del primer feed.
d0 = os.path.join(T, "cielo", ORDEN[0])
dd = os.path.join(T, "cielo", "CONTROL-hora-dorada")
os.makedirs(dd, exist_ok=True)
votos = []
for f in sorted(os.listdir(d0)):
    o = os.path.join(dd, f)
    if not os.path.exists(o):
        sh("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", os.path.join(d0, f),
           "-vf", "colorbalance=rs=.25:gs=.05:bs=-.20:rm=.20:bm=-.18:rh=.15:bh=-.12,"
                  "eq=saturation=1.25:gamma=0.92", o)
    c, _ = cielo(o)
    if c:
        votos.append(c)
dorada = tuple(round(statistics.median(v[i] for v in votos)) for i in range(3))
print("  1. HORA DORADA -- los mismos cuadros de %s virados: %s"
      % (ORDEN[0], hexa(dorada)))
print("     contra su propio original (%s): dE00 %.1f"
      % (hexa(colores[ORDEN[0]]), dE00(hexa(dorada), hexa(colores[ORDEN[0]]))))
print("     contra los seis: %.1f a %.1f\n"
      % (min(dE00(hexa(dorada), hexa(colores[c])) for c in ORDEN),
         max(dE00(hexa(dorada), hexa(colores[c])) for c in ORDEN)))

# 2. OTRO MUNDO -- metraje real de la demo del break.
otro = os.path.join(T, "cielo", "CONTROL-otro-mundo")
os.makedirs(otro, exist_ok=True)
votos = []
for i, seg in enumerate((3, 5, 7, 9)):
    p = os.path.join(otro, "%02d.png" % i)
    if not os.path.exists(p):
        sh("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(seg), "-i",
           os.path.join(RAIZ, "demo", "hydration-break", "content", ".fuentes", "9439150.mp4"),
           "-frames:v", "1", "-vf", "scale=1280:720", p)
    c, _ = cielo(p)
    if c:
        votos.append(c)
if votos:
    mundo = tuple(round(statistics.median(v[i] for v in votos)) for i in range(3))
    print("  2. OTRO MUNDO -- metraje real de la demo del break: %s" % hexa(mundo))
    print("     contra los seis: %.1f a %.1f\n"
          % (min(dE00(hexa(mundo), hexa(colores[c])) for c in ORDEN),
             max(dE00(hexa(mundo), hexa(colores[c])) for c in ORDEN)))
else:
    print("  2. OTRO MUNDO -- ningun cuadro voto: ese metraje no tiene cielo claro.\n")

# 3. LA MITAD DE ABAJO -- el control que dice si lo de arriba es cielo o es "cualquier
#    parche claro". Se corre el MISMO operador sobre la mitad de ABAJO de los mismos
#    cuadros, que es asfalto, piano y carroceria.
#
#    OJO CON COMO SE LEE, porque la primera version de este control se escribio esperando
#    que el piso del 2 % rechazara esos cuadros, y NO LOS RECHAZA: 29 de 32 votan, porque
#    el asfalto claro y los pianos blancos tambien son claros y sin color. O sea que el
#    piso no separa arriba de abajo, y decir "mide cielo" apoyandose en el habria sido
#    falso. Lo que SI separa es el color que devuelve cada mitad, y eso es lo que se
#    imprime: si la mitad de abajo diera lo mismo que la de arriba, el numero de los
#    quince pares no estaria midiendo la luz del cielo sino el gris promedio de la imagen,
#    y los seis coincidirian por construccion.
print("  3. LA MITAD DE ABAJO de los mismos cuadros -- asfalto, piano y carroceria:")
abajo = os.path.join(T, "cielo", "CONTROL-sin-cielo")
os.makedirs(abajo, exist_ok=True)
votos, novoto = [], 0
for f in sorted(os.listdir(d0)):
    o = os.path.join(abajo, f)
    if not os.path.exists(o):
        im = Image.open(os.path.join(d0, f))
        w, h = im.size
        im.crop((0, h // 2, w, h)).save(o)
    c, pct = cielo(o)
    if c is None:
        novoto += 1
    else:
        votos.append(c)
piso = tuple(round(statistics.median(v[i] for v in votos)) for i in range(3))
print("     de %d cuadros, %d NO votaron y %d votaron: el piso del %.0f %% NO los rechaza,"
      % (len(votos) + novoto, novoto, len(votos), PISO_PCT))
print("     porque el asfalto claro y los pianos blancos tambien son claros y sin color.")
print("     Lo que separa no es el piso sino el color: la mitad de abajo devuelve %s,"
      % hexa(piso))
print("     contra %s de la mitad de arriba -- dE00 %.1f."
      % (hexa(colores[ORDEN[0]]), dE00(hexa(piso), hexa(colores[ORDEN[0]]))))
print("     Ese numero contra el 0,9-7,9 de los seis pares es lo que dice que arriba y")
print("     abajo no son el mismo parche, y que los seis coinciden en ALGO y no en todo.")
