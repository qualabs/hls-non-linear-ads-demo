#!/usr/bin/env python3
"""Las otras demos del repositorio con la librería nueva: que carguen sin errores y
cómo queda cada break. Levanta `server.mjs` por demo en el puerto que se le pase y
lo baja por su PID. Por cada rango concurrente del programa, busca a 2,5 s de su
comienzo, espera, saca una captura y anota los layouts activos, el z-index del
primario y los de los avisos.

Uso: recorrer-demos.py --puerto 8097 --salida <dir>
"""
import argparse, json, os, signal, subprocess, sys, time
from pathlib import Path
_PY = "/home/nicolas/Skills/playwright/.venv/bin/python"
try:
    import playwright  # noqa
except ModuleNotFoundError:
    os.execv(_PY, [_PY, os.path.abspath(__file__), *sys.argv[1:]])
from playwright.sync_api import sync_playwright

SDK = Path(__file__).resolve().parents[5]
DEMOS = ["compatibility-pair", "hydration-break", "multiview-offer", "race-multiview"]
LEER = """() => {
  const d = window.demo, t = d.video.currentTime;
  const ads = [...document.querySelectorAll('.ad')].filter((n) => getComputedStyle(n).opacity !== '0');
  return { t: +t.toFixed(2), layouts: d.provider.activeAt(t).map((e) => e.type),
           zPrimario: getComputedStyle(d.video).zIndex, zAvisos: ads.map((n) => getComputedStyle(n).zIndex) };
}"""

ap = argparse.ArgumentParser(); ap.add_argument("--puerto", type=int, required=True); ap.add_argument("--salida", required=True)
a = ap.parse_args(); out = Path(a.salida); out.mkdir(parents=True, exist_ok=True)
rojo = 0
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel="chrome", args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
    for demo in DEMOS:
        srv = subprocess.Popen(["node", "server.mjs", f"demo/{demo}"], cwd=SDK, env={**os.environ, "PORT": str(a.puerto)},
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1.0)
        try:
            pg = nav.new_page(viewport={"width": 1600, "height": 1000})
            errores = []
            pg.on("pageerror", lambda e: errores.append(str(e)))
            pg.goto(f"http://localhost:{a.puerto}/index.html")
            pg.wait_for_function("window.demo && window.demo.video && window.demo.video.readyState >= 1", timeout=60000)
            pg.wait_for_function("window.demo.provider.programRanges().settled", timeout=60000)
            rangos = pg.evaluate("() => window.demo.provider.programRanges().ranges.filter((r) => r.kind !== 'interstitial')"
                                 ".map((r) => ({ id: r.id, kind: r.kind, start: r.startTime }))")
            print(f"== {demo}: {len(rangos)} rangos")
            for i, r in enumerate(rangos):
                pg.evaluate("t => { window.demo.video.currentTime = t; window.demo.video.play().catch(() => {}); }", r["start"] + 2.5)
                time.sleep(2.5)
                estado = pg.evaluate(LEER)
                pg.screenshot(path=str(out / f"demo-{demo}-{i}.png"))
                print(f"   {r['id']:<22} {r['kind']:<11} t={estado['t']:>7}  {estado['layouts']}  z primario {estado['zPrimario']}  z avisos {estado['zAvisos']}")
            print(f"   errores de página: {len(errores)} {errores[:2]}")
            rojo += 1 if errores else 0
            pg.close()
        finally:
            srv.send_signal(signal.SIGTERM); srv.wait(timeout=10)
    nav.close()
print("VERDE: ninguna demo tiró errores" if rojo == 0 else f"ROJO: {rojo} demo(s) con errores")
sys.exit(1 if rojo else 0)
