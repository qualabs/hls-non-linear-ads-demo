#!/usr/bin/env python3
"""La barra de progreso siempre visible y el play/pause sólo con el mouse encima, en index e
inspect; race.html sin cambios. Mide la opacidad EFECTIVA (el producto con la de los ancestros)
de la barra y del botón, con el mouse fuera de los players y después encima.
Uso: medir.py <base> <salida> <rotulo>"""
import sys, time
_PY = "/home/nicolas/Skills/playwright/.venv/bin/python"
try:
    import playwright  # noqa
except ModuleNotFoundError:
    import os; os.execv(_PY, [_PY, os.path.abspath(__file__), *sys.argv[1:]])
from playwright.sync_api import sync_playwright
base, salida, rotulo = sys.argv[1].rstrip("/"), sys.argv[2], sys.argv[3]
LEER = """() => {
  const efectiva = (n) => { let o = 1; for (; n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity; return +o.toFixed(2); };
  return [...document.querySelectorAll('.qa-controls')].map((c) => ({
    barra: efectiva(c.querySelector('.qa-track')), play: efectiva(c.querySelector('.qa-btn--play')),
    marcas: c.querySelectorAll('.qa-mark').length }));
}"""
rojo = 0
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel="chrome", args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
    for pagina, espera_barra in (("index.html", True), ("inspect.html", True), ("race.html", False)):
        pg = nav.new_page(viewport={"width": 1920, "height": 960})
        errores = []
        pg.on("console", lambda m: m.type == "error" and errores.append(m.text[:100]))
        pg.goto(f"{base}/{pagina}"); time.sleep(3)
        pg.mouse.move(5, 5); time.sleep(4)          # fuera de los players, y más de 2,6 s quieto
        fuera = pg.evaluate(LEER)
        pg.screenshot(path=f"{salida}/{rotulo}-{pagina.split('.')[0]}-mouse-fuera-1920x960.png")
        caja = pg.locator(".player").first.bounding_box()
        pg.mouse.move(caja["x"] + caja["width"] / 2, caja["y"] + caja["height"] / 2); time.sleep(0.6)
        encima = pg.evaluate(LEER)[0]
        pg.screenshot(path=f"{salida}/{rotulo}-{pagina.split('.')[0]}-mouse-encima-1920x960.png")
        ok_fuera = all((c["barra"] == 1) == espera_barra and c["play"] == 0 for c in fuera)
        ok_marcas = all(c["marcas"] > 0 for c in fuera) if espera_barra else True
        ok_encima = encima["play"] == 1 and encima["barra"] == 1
        ok = ok_fuera and ok_marcas and ok_encima and not errores
        rojo += 0 if ok else 1
        print(f"{'ok  ' if ok else 'ROJO'} {pagina:<13} mouse fuera: {fuera}   mouse encima (1er player): {encima}   errores {len(errores)}")
        pg.close()
    nav.close()
print("VERDE" if rojo == 0 else f"ROJO ({rojo})")
sys.exit(1 if rojo else 0)
