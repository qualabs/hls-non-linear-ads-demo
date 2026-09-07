"""T-07 -- el seek adentro de un break, en las dos estrategias, dos veces cada
una: lo que hls.js hace con un seek escrito sobre la linea de tiempo del
programa mientras un aviso de reemplazo esta en pantalla (X-RESTRICT=SKIP)."""
import json, time
from playwright.sync_api import sync_playwright

URL = "http://localhost:8080/"
LEER = ("() => { const m = window.demo.stock.hls.interstitialsManager;"
        " const v = document.getElementById('stock-video');"
        " const it = m.playingItem; const n = (x) => Number.isFinite(x) ? +x.toFixed(3) : x;"
        " return { elemT: n(v.currentTime), programaT: n(m.primary.currentTime),"
        " ad: it && it.event ? it.event.identifier : null,"
        " aip: it && it.event ? it.event.appendInPlace : null,"
        " span: it ? [n(it.start), n(it.end)] : null }; }")

out = {}
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    pg.goto(URL, wait_until="load")
    pg.wait_for_function("!!(window.demo && window.demo.stock)", timeout=30000)
    pg.wait_for_function("document.getElementById('stock-video').readyState >= 2", timeout=30000)
    pg.wait_for_function("(window.demo.stock.hls.interstitialsManager.events||[]).length === 5", timeout=30000)
    for nombre, desde, cual in [("break-1-appendInPlace", 18.0, "AD-1-LINEAR"),
                                ("break-2-mediasource", 43.0, "AD-2-LINEAR")]:
        pg.evaluate("(t) => { window.demo.stock.hls.interstitialsManager.primary.currentTime = t; }", desde)
        time.sleep(1.0)
        pg.evaluate("() => document.getElementById('stock-video').play().catch(() => {})")
        t0 = time.time()
        while time.time() - t0 < 40:
            r = pg.evaluate(LEER)
            if r["ad"] == cual:
                break
            time.sleep(0.2)
        time.sleep(1.5)
        antes = pg.evaluate(LEER)
        intentos = []
        for destino in (9.0, 150.0):
            pg.evaluate("(t) => { window.demo.stock.hls.interstitialsManager.primary.currentTime = t; }", destino)
            time.sleep(1.5)
            intentos.append({"pedido": destino, "quedo": pg.evaluate(LEER)})
        out[nombre] = {"antes": antes, "intentos": intentos}
        pg.evaluate("() => document.getElementById('stock-video').pause()")
    pg.close()
print(json.dumps(out, indent=1))
