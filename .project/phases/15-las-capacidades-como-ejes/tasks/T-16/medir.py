#!/usr/bin/env python3
"""inspect.html a 1920x960: la tarjeta 3 termina donde termina la 4, todo sin scroll de página,
y la URL de la tarjeta 2 en una sola línea, en A, B y C y en los modos de URL más larga.
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
  const b = (s) => Math.round(document.querySelector(s).getBoundingClientRect().bottom);
  const req = document.getElementById('request'), cs = getComputedStyle(req);
  return { player: b('#pane'), t1: b('.exchange .move:nth-of-type(1)'), t2: b('.exchange .move:nth-of-type(2)'),
           t3: b('.exchange .move:nth-of-type(3)'), t4: b('.move--kept'), scrollY: scrollY,
           doc: document.documentElement.scrollHeight, lineas: Math.round(req.getBoundingClientRect().height / parseFloat(cs.lineHeight)),
           url: req.innerText.trim() };
}"""
rojo = 0
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel="chrome", args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
    for modo in ("ours-2dec-img", "ours-1dec-img", "ours-1dec-noimg", "nativo"):
        pg = nav.new_page(viewport={"width": 1920, "height": 960})
        errores = []
        pg.on("console", lambda m: m.type == "error" and errores.append(m.text[:100]))
        pg.goto(f"{base}/inspect.html?modo={modo}"); time.sleep(4)
        for brk in ("A", "B", "C"):
            pg.get_by_role("button", name=f"break {brk}", exact=True).click(); time.sleep(8)
            m = pg.evaluate(LEER)
            ok = m["lineas"] == 1 and abs(m["t3"] - m["t4"]) <= 2 and max(m["player"], m["t3"], m["t4"]) <= 960 and m["scrollY"] == 0
            rojo += 0 if ok else 1
            print(f"{'ok  ' if ok else 'ROJO'} {modo:<16} {brk}  player {m['player']}  t1 {m['t1']} t2 {m['t2']} t3 {m['t3']} t4 {m['t4']}  "
                  f"líneas URL {m['lineas']}  scrollY {m['scrollY']}  ({m['url'][:90]})")
            if modo in ("ours-2dec-img", "nativo"):
                pg.screenshot(path=f"{salida}/{rotulo}-inspect-{modo}-break{brk}-1920x960.png")
        print(f"     errores de consola: {len(errores)}")
        rojo += 1 if errores else 0
        pg.close()
    nav.close()
print("VERDE" if rojo == 0 else f"ROJO ({rojo})")
sys.exit(1 if rojo else 0)
