#!/usr/bin/env python3
"""inspect.html e index.html a 1920x1080 (viewport útil 1920x960): capturas, y en
inspect, que el player y las tarjetas 1 a 3 terminen por encima del borde de la
ventana sin scroll; en las dos, que los saltos anden y la consola quede limpia.
Uso: medir-layout.py <base> <salida> <rotulo>"""
import sys, time
_PY = "/home/nicolas/Skills/playwright/.venv/bin/python"
try:
    import playwright  # noqa
except ModuleNotFoundError:
    import os; os.execv(_PY, [_PY, os.path.abspath(__file__), *sys.argv[1:]])
from playwright.sync_api import sync_playwright
base, salida, rotulo = sys.argv[1].rstrip("/"), sys.argv[2], sys.argv[3]
rojo = 0
BORDES = """() => Object.fromEntries(['#pane', '.exchange .move:nth-of-type(1)', '.exchange .move:nth-of-type(2)',
  '.exchange .move:nth-of-type(3)'].map((s) => [s, Math.round(document.querySelector(s).getBoundingClientRect().bottom)]))"""
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel="chrome", args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
    for url in ("inspect.html", "index.html"):
        pg = nav.new_page(viewport={"width": 1920, "height": 960})
        errores = []
        pg.on("pageerror", lambda e: errores.append(str(e)))
        pg.on("console", lambda m: m.type == "error" and errores.append(m.text[:120]))
        pg.goto(f"{base}/{url}"); time.sleep(4)
        for b in ("break A", "break B", "break C"):
            pg.get_by_role("button", name=b, exact=True).click(); time.sleep(7)
            t = pg.evaluate("() => { const d = window.demo; const v = d.video; return +v.currentTime.toFixed(1); }")
            print(f"{url} {b}: t={t}")
            pg.screenshot(path=f"{salida}/{rotulo}-{url.split('.')[0]}-{b.replace(' ', '')}-1920x960.png")
        if url == "inspect.html":
            pg.get_by_role("button", name="break B", exact=True).click(); time.sleep(7)
            pg.screenshot(path=f"{salida}/{rotulo}-inspect-1920x960.png")
            bordes = pg.evaluate(BORDES)
            alto = pg.evaluate("() => [scrollY, innerHeight]")
            entra = all(v <= 960 for v in bordes.values()) and alto[0] == 0
            rojo += 0 if entra else 1
            print(f"   bordes inferiores: {bordes}  scrollY={alto[0]}  -> {'ENTRA sin scroll' if entra else 'NO ENTRA'}")
        else:
            pg.screenshot(path=f"{salida}/{rotulo}-index-1920x960.png")
        print(f"   errores de consola: {len(errores)} {errores[:2]}")
        rojo += 1 if errores else 0
        pg.close()
    nav.close()
print("VERDE" if rojo == 0 else f"ROJO ({rojo})")
sys.exit(1 if rojo else 0)
