#!/usr/bin/env python3
"""Cuánto se mueve un creativo de video: el % de píxeles que cambian cada 0,5 s.

Fase 15, feedback de Nicolás: con la imagen quieta, el video tiene que notarse
video de lejos. Esto lo mide sobre el HLS EMPAQUETADO, que es lo que se ve, y no
sobre el SVG: `ffmpeg` saca un cuadro cada 0,5 s de la playlist entera y se
compara cada cuadro con el siguiente.

    % de cambio de un par   píxeles cuyo canal más distinto difiere en más de
                            UMBRAL (sobre 255), dividido por los píxeles del cuadro
    media                   el promedio de todos los pares: cuánto se mueve
    mínimo                  el par más quieto: si el movimiento es continuo o hay
                            tramos parados

El cuadro entero del video es la región del aviso, cada creativo empaquetado al
tamaño de su caja (`puente-a-video.sh`), CON UNA EXCEPCIÓN: el backplate de la L
se empaqueta a cuadro entero y el primario tapa su rectángulo de arriba a la
derecha. Con `--ele` se mide sólo lo que se ve de la L: la columna izquierda (el
25 % del ancho) y la banda de abajo (el 25 % del alto), que es el
`viewportPrimario` "0 0 25 25" de stage.json.

El control del instrumento es `--autotest`: dos cuadros iguales tienen que dar
0 % y un cuadro con la mitad cambiada, 50 %. Y el número de cada creativo se lee
contra el mismo número del creativo anterior, medido antes de cambiarlo.

Uso:  medir-movimiento.py [--ele] <index.m3u8> [<index.m3u8> ...]
      medir-movimiento.py --autotest
"""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops

UMBRAL = 24
PASO = 0.5


def porcentaje(a, b, ele=False):
    d = ImageChops.difference(a.convert("RGB"), b.convert("RGB"))
    r, g, bl = d.split()
    m = ImageChops.lighter(ImageChops.lighter(r, g), bl).point(lambda v: 255 if v > UMBRAL else 0)
    if not ele:
        return 100.0 * m.histogram()[255] / (a.width * a.height)
    w, h = a.size
    tapado = (w // 4, 0, w, h - h // 4)  # lo que cubre el primario
    mascara = Image.new("L", (w, h), 255)
    mascara.paste(0, tapado)
    visibles = mascara.histogram()[255]
    cambiados = ImageChops.multiply(m, mascara).histogram()[255]
    return 100.0 * cambiados / visibles


def medir(playlist, ele=False):
    with tempfile.TemporaryDirectory(dir=os.environ.get('XDG_RUNTIME_DIR')) as d:
        subprocess.run(["ffmpeg", "-v", "error", "-i", str(playlist), "-vf", f"fps={1 / PASO}",
                        f"{d}/c%04d.png"], check=True)
        cuadros = sorted(Path(d).glob("c*.png"))
        imgs = [Image.open(c) for c in cuadros]
        pares = [porcentaje(imgs[i], imgs[i + 1], ele) for i in range(len(imgs) - 1)]
    return len(cuadros), pares


def autotest():
    a = Image.new("RGB", (100, 100), (10, 10, 10))
    b = a.copy()
    b.paste((200, 50, 50), (0, 0, 50, 100))
    assert porcentaje(a, a.copy()) == 0.0, "dos cuadros iguales no dan 0 %"
    assert abs(porcentaje(a, b) - 50.0) < 1e-9, "medio cuadro distinto no da 50 %"
    # con --ele: cambiar sólo el rectángulo que tapa el primario no cuenta, y
    # cambiar la columna izquierda sí
    c = a.copy(); c.paste((200, 50, 50), (25, 0, 100, 75))
    assert porcentaje(a, c, ele=True) == 0.0, "--ele cuenta lo que tapa el primario"
    e = a.copy(); e.paste((200, 50, 50), (0, 0, 25, 100))
    assert porcentaje(a, e, ele=True) > 0, "--ele no ve la columna"
    print("autotest: iguales 0 %, medio cuadro distinto 50 %; con --ele, lo tapado 0 % y la columna > 0 %")


def main():
    if sys.argv[1:] == ["--autotest"]:
        autotest()
        return
    ele = "--ele" in sys.argv
    for p in [x for x in sys.argv[1:] if x != "--ele"]:
        n, pares = medir(p, ele)
        media = sum(pares) / len(pares)
        print(f"{p}{' (sólo la L visible)' if ele else ''}: {n} cuadros cada {PASO} s  media {media:6.2f} %  mínimo {min(pares):6.2f} %  "
              f"máximo {max(pares):6.2f} %")


if __name__ == "__main__":
    main()
