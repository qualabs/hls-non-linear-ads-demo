"""T-03, segunda corrida -- el fullscreen con un aviso en pantalla.

Una sola cosa: en fullscreen el contenedor deja de tener la relacion de aspecto
de la imagen, porque el navegador le impone el tamano de la pantalla y la
pantalla no siempre es 16:9. La caja que el renderizador mide es el contenedor,
asi que las cajas del layout se reparten sobre esa caja y no sobre la imagen.
Esto lo mide y lo fotografia, para que la consecuencia se vea y no se explique.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

MEDIDA = """
() => {
  const r3 = (n) => +n.toFixed(3);
  const cont = document.getElementById('player');
  const capa = document.querySelector('.qa-concurrent-layer');
  const v = window.demo.video;
  const a = capa.getBoundingClientRect();
  const vb = v.getBoundingClientRect();
  const ar = v.videoWidth / v.videoHeight;
  const w = Math.min(vb.width, vb.height * ar), h = Math.min(vb.height, vb.width / ar);
  const imagen = { x: r3(vb.x + (vb.width - w) / 2), w: r3(w), h: r3(h) };
  return {
    fullscreen: document.fullscreenElement === cont,
    laQueMideElRenderizador: { x: r3(a.x), w: r3(a.width), h: r3(a.height) },
    laImagen: imagen,
    corrimientoPorLado: r3(imagen.x - a.x),
    relacionDeAspectoDeLaCaja: r3(a.width / a.height),
    avisos: [...capa.querySelectorAll('.ad')].map(n => {
      const b = n.getBoundingClientRect();
      return { id: n.dataset.elementId, x: r3(b.x), w: r3(b.width),
               empiezaAntesDeLaImagen: b.x < imagen.x - 0.5 };
    }),
    tipo: window.demo.provider.activeAt(v.currentTime).map(e => e.type)
  };
}
"""

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
        # El primer break, el overlay de esquina: es el que hace visible el
        # corrimiento porque su caja arranca en el borde izquierdo.
        pg.wait_for_function("window.demo.provider.activeAt(window.demo.video.currentTime).length > 0",
                             timeout=60000)
        pg.wait_for_function("""(() => {
          const a = [...document.querySelectorAll('.qa-concurrent-layer .ad')];
          return a.length > 0 && a.every(n => n.readyState >= 2 && n.currentTime > 1.0);
        })()""", timeout=60000)
        antes = pg.evaluate(MEDIDA)
        pg.locator(".qa-btn--full").click()
        pg.wait_for_function("document.fullscreenElement === document.getElementById('player')", timeout=10000)
        time.sleep(1.0)
        pg.mouse.move(960, 500)
        time.sleep(0.4)
        despues = pg.evaluate(MEDIDA)
        pg.screenshot(path=str(OUT / "t03-6-fullscreen-con-aviso.png"))
        print("ANTES  ", json.dumps(antes, indent=1), flush=True)
        print("DESPUES", json.dumps(despues, indent=1), flush=True)
        (OUT / "t03-el-fullscreen-y-la-caja.json").write_text(
            json.dumps({"enElMarco": antes, "enFullscreen": despues}, indent=2))
        pg.evaluate("() => document.exitFullscreen()")
    finally:
        pg.close()
