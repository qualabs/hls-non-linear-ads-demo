#!/usr/bin/env python3
"""index.html a 1920x960: el top de los dos players coincide en las cuatro combinaciones de modos.
Uso: medir.py <base> <salida> <rotulo>"""
import sys, time
_PY = "/home/nicolas/Skills/playwright/.venv/bin/python"
try:
    import playwright  # noqa
except ModuleNotFoundError:
    import os; os.execv(_PY, [_PY, os.path.abspath(__file__), *sys.argv[1:]])
from playwright.sync_api import sync_playwright
base, salida, rotulo = sys.argv[1].rstrip("/"), sys.argv[2], sys.argv[3]
LEER = """() => Object.fromEntries(['izq', 'der'].map((l) => {
  const r = (s) => document.querySelector(s).getBoundingClientRect();
  return [l, { player: Math.round(r(`#slot-${l} .player`).top), control: Math.round(r(`#control-${l}`).height) }];
}))"""
rojo = 0
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel="chrome", args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
    for izq in ("nativo", "ours-2dec-img"):
        for der in ("nativo", "ours-2dec-img"):
            pg = nav.new_page(viewport={"width": 1920, "height": 960})
            errores = []
            pg.on("console", lambda m: m.type == "error" and errores.append(m.text[:100]))
            pg.goto(f"{base}/index.html?izq={izq}&der={der}"); time.sleep(4)
            m = pg.evaluate(LEER)
            ok = m["izq"]["player"] == m["der"]["player"] and m["izq"]["control"] == m["der"]["control"] and not errores
            rojo += 0 if ok else 1
            print(f"{'ok  ' if ok else 'ROJO'} izq={izq:<14} der={der:<14} top player izq {m['izq']['player']} der {m['der']['player']}   "
                  f"alto control izq {m['izq']['control']} der {m['der']['control']}   errores {len(errores)}")
            pg.screenshot(path=f"{salida}/{rotulo}-index-{izq}__{der}-1920x960.png")
            pg.close()
    nav.close()
print("VERDE" if rojo == 0 else f"ROJO ({rojo})")
sys.exit(1 if rojo else 0)
