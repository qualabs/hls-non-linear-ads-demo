#!/usr/bin/env python3
"""medir-el-barrido.py -- cuanto se da vuelta el encuadre adentro de un clip.

QUE MIDE Y POR QUE ESTO. Los cinco clips que Nicolas rechazo los rechazo por la misma cosa
dicha de cinco maneras: adentro de los ocho segundos, lo que esta en cuadro se da vuelta.
Autos yendo contramano, una vuelta en U, un auto que entra perpendicular. Eso deja una
huella medible: el DESPLAZAMIENTO HORIZONTAL DEL FONDO cambia de signo a mitad del clip.

COMO. Por cada par de cuadros consecutivos se toma una banda horizontal del fondo (el
tercio que va del 22% al 48% de la altura, que es donde estan las vallas, la tribuna y las
dunas), se reduce a un perfil de 160 columnas sumando filas, y se busca el corrimiento
entre -14 y +14 columnas que minimiza la diferencia absoluta. Eso da un `dx` por cuadro.

EL NUMERO ES `R = |suma(dx)| / suma(|dx|)`, entre 0 y 1:

  R cerca de 1  el encuadre barre para UN SOLO LADO todo el clip.
  R cerca de 0  barre para un lado y despues para el otro: se dio vuelta.

LA REFERENCIA NO SALE DE ESTE CALCULO, y es lo unico que hace que el numero valga: son
los NUEVE clips que Nicolas dio por buenos y los CINCO que rechazo, mirados por el antes
de que este script existiera. Si el instrumento no separa esos dos grupos, no mide lo que
dice medir y no se lo puede usar para decir nada de los clips nuevos. Eso se imprime al
final y se decide ahi, no antes.

    ./medir-el-barrido.py <clip.mp4> [...]      imprime una linea por clip
"""
import os
import subprocess
import sys
import tempfile

from PIL import Image

ANCHO = 160
ALTO = 90
BANDA = (int(ALTO * 0.22), int(ALTO * 0.48))   # filas del fondo
MAXDX = 14


def perfiles(mp4, tmp):
    """Un perfil de 160 columnas por cuadro, sacado de la banda del fondo."""
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-i", mp4,
         "-vf", "scale=%d:%d,format=gray" % (ANCHO, ALTO),
         os.path.join(tmp, "%04d.png")], check=True)
    out = []
    for nombre in sorted(os.listdir(tmp)):
        im = Image.open(os.path.join(tmp, nombre))
        px = im.load()
        perfil = []
        for x in range(ANCHO):
            s = 0
            for y in range(*BANDA):
                s += px[x, y]
            perfil.append(s)
        out.append(perfil)
    return out


def corrimiento(a, b):
    """El dx que mejor alinea `b` sobre `a`, por diferencia absoluta minima."""
    mejor, mejor_dx = None, 0
    for dx in range(-MAXDX, MAXDX + 1):
        ini = max(0, -dx)
        fin = min(ANCHO, ANCHO - dx)
        if fin - ini < ANCHO // 2:
            continue
        s = 0
        for x in range(ini, fin):
            d = a[x] - b[x + dx]
            s += d if d > 0 else -d
        s /= (fin - ini)
        if mejor is None or s < mejor:
            mejor, mejor_dx = s, dx
    return mejor_dx


def medir(mp4):
    with tempfile.TemporaryDirectory(dir="/dev/shm") as tmp:
        ps = perfiles(mp4, tmp)
    dxs = [corrimiento(ps[i], ps[i + 1]) for i in range(len(ps) - 1)]
    total = sum(abs(d) for d in dxs)
    neto = abs(sum(dxs))
    r = (neto / total) if total else 0.0
    return r, neto, total, dxs


if __name__ == "__main__":
    for mp4 in sys.argv[1:]:
        r, neto, total, dxs = medir(mp4)
        signos = "".join("+" if d > 0 else ("-" if d < 0 else ".") for d in dxs)
        print("%-34s R=%.2f  neto=%3d  recorrido=%3d" % (
            os.path.basename(mp4)[:34], r, neto, total))
        print("      %s" % signos)
