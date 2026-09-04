"""T-11 -- la captura del par, sin un solo seek.

La captura del layout se tomo despues de un seek al instante con mas luz, y por
eso en ella el player de fabrica va por su propio reloj: el unico que se
adelanto fue el de la demo. Esta corrida no toca el reloj de nadie. Carga la
pagina y espera: a los 20 s los dos clientes reaccionan al mismo par de Date
Ranges, y a los ~26 s los tres assets del multiview ya tienen luz. Ahi se
captura, con los dos players en el mismo instante.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

res = {}
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        # El instante en que los dos clientes entran, sin seek.
        pg.wait_for_function("window.demo.video.currentTime >= 20.1", timeout=90000)
        res["al_entrar"] = pg.evaluate("""() => ({
          time: +window.demo.video.currentTime.toFixed(2),
          paneDemo: document.getElementById('pane-demo').dataset.state,
          paneStock: document.getElementById('pane-stock').dataset.state,
          demoState: document.getElementById('demo-state').textContent,
          stockState: document.getElementById('stock-state').textContent,
          cuadrantes: document.querySelectorAll('#ads .ad').length
        })""")
        print("ENTRADA", json.dumps(res["al_entrar"]), flush=True)
        # Y el instante de la captura, tambien sin seek.
        pg.wait_for_function("window.demo.video.currentTime >= 25.8", timeout=60000)
        res["en_la_captura"] = pg.evaluate("""() => ({
          time: +window.demo.video.currentTime.toFixed(2),
          primario: { paused: window.demo.video.paused, muted: window.demo.video.muted },
          cuadrantes: [...document.querySelectorAll('#ads .ad')].map(v => ({
            id: v.dataset.elementId, adTime: +v.currentTime.toFixed(2), paused: v.paused,
            readyState: v.readyState, muted: v.muted, w: v.videoWidth, h: v.videoHeight })),
          paneDemo: document.getElementById('pane-demo').dataset.state,
          paneStock: document.getElementById('pane-stock').dataset.state,
          demoState: document.getElementById('demo-state').textContent,
          stockState: document.getElementById('stock-state').textContent,
          contract: document.getElementById('contract').textContent
        })""")
        print("CAPTURA", json.dumps(res["en_la_captura"]), flush=True)
        pg.locator("#player").screenshot(path=str(OUT / "t11-multiView-player.png"))
        pg.locator(".pair").screenshot(path=str(OUT / "t11-el-par-con-el-multiview.png"))
        pg.screenshot(path=str(OUT / "t11-la-pagina-entera.png"), full_page=True)
    finally:
        pg.close()

(OUT / "t11-sin-seek.json").write_text(json.dumps(res, indent=2))
print("WROTE", OUT / "t11-sin-seek.json")
