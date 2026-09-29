#!/usr/bin/env python3
"""Cuadros intermedios de la entrada y la salida de un squeezeback, y quién está arriba.

Fase 15, pedido de Nicolás (ADR 0089): en la transición de un side by side el
contenido principal tiene que ir por ENCIMA del aviso, para que se vea achicarse
y destaparlo, y al salir volver a taparlo. Esto abre `inspect.html` (un solo
player, nuestra librería, dos decodificadores) en el break A --un
squeezebackDoubleBox--, y en la ventana de la entrada (desde el segundo 19,85) y
en la de la salida (desde el 31,45) saca una serie de capturas del player y, en
cada una, lee el `z-index` que el renderizador le puso al primario y al aviso.

Se corre contra la librería de ANTES y la de DESPUÉS con el mismo instrumento:
las capturas se comparan a ojo, y el `z-index` dice quién está arriba sin mirar.

Uso:  capturar-transicion.py --puerto 8096 --salida <dir> --rotulo antes|despues
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

_PY = os.environ.get("PY", "/home/nicolas/Skills/playwright/.venv/bin/python")
try:
    import playwright  # noqa: F401
except ModuleNotFoundError:
    if not os.access(_PY, os.X_OK):
        sys.exit(f"falta playwright, y el python del skill no está en {_PY}")
    os.execv(_PY, [_PY, os.path.abspath(__file__), *sys.argv[1:]])

from playwright.sync_api import sync_playwright  # noqa: E402

LEER = """
() => {
  const slot = document.getElementById('slot');
  const primario = slot.querySelector('video:not(.ad)');
  const aviso = slot.querySelector('.ad');
  return {
    t: +window.demo.video.currentTime.toFixed(3),
    zPrimario: primario ? getComputedStyle(primario).zIndex : null,
    zAviso: aviso ? getComputedStyle(aviso).zIndex : null,
    transformPrimario: primario ? getComputedStyle(primario).transform : null
  };
}
"""


def serie(pagina, desde, salida, nombre, n=9):
    pagina.evaluate("t => window.demo.irA(t)", desde - 4)
    pagina.wait_for_function("t => window.demo.video.currentTime >= t", arg=desde, timeout=30000, polling=10)
    filas = []
    caja = pagina.locator("#slot .player")
    for i in range(n):
        estado = pagina.evaluate(LEER)
        caja.screenshot(path=str(salida / f"{nombre}-{i}.png"))
        filas.append(estado)
    return filas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--puerto", type=int)
    ap.add_argument("--base")
    ap.add_argument("--salida", required=True)
    ap.add_argument("--rotulo", required=True)
    args = ap.parse_args()
    base = args.base.rstrip("/") if args.base else f"http://localhost:{args.puerto}"
    salida = Path(args.salida)
    salida.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome",
                                 args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
        pagina = nav.new_page(viewport={"width": 1907, "height": 1100})
        # LAS TRANSICIONES CSS SE CORREN A UN DÉCIMO DE VELOCIDAD, por el protocolo
        # de devtools: duran 380 ms y una captura tarda 200, así que a velocidad real
        # caen uno o dos cuadros adentro. El video sigue a velocidad normal; lo que
        # se estira es la animación que el renderizador dispara.
        cdp = pagina.context.new_cdp_session(pagina)
        cdp.send("Animation.enable")
        cdp.send("Animation.setPlaybackRate", {"playbackRate": 0.1})
        pagina.goto(f"{base}/inspect.html")
        pagina.wait_for_function("window.demo && window.demo.video && window.demo.video.readyState >= 2")
        resultado = {
            "entrada": serie(pagina, 19.85, salida, f"{args.rotulo}-entrada"),
            "salida": serie(pagina, 31.5, salida, f"{args.rotulo}-salida"),
        }
        nav.close()
    (salida / f"{args.rotulo}-zindex.json").write_text(json.dumps(resultado, indent=2))
    for fase, filas in resultado.items():
        print(f"== {args.rotulo}, {fase}")
        for f in filas:
            arriba = "?"
            if f["zPrimario"] not in (None, "auto") and f["zAviso"] not in (None, "auto"):
                arriba = "PRIMARIO" if int(f["zPrimario"]) > int(f["zAviso"]) else "aviso"
            print(f"   t={f['t']:>7}  z primario {str(f['zPrimario']):>4}  z aviso {str(f['zAviso']):>4}  arriba: {arriba}")


if __name__ == "__main__":
    main()
