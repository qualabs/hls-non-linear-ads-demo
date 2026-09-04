"""T-11 -- elegir el instante de la captura, y medir por que hay que elegirlo.

La primera captura del layout salio con dos de los tres cuadrantes del aviso en
negro: `view2` con una luminancia media de 0,2 sobre 255 y `view4` con 7,1. Es
la misma cosa que la T-10 encontro con las barras del squeezeback, y ahora se
mide sobre los tres assets a la vez y a lo largo de toda la ventana, en vez de
sobre una sola captura.

Se recorre la ventana del aviso muestreando la luminancia de cada cuadrante con
un canvas —el contenido es del mismo origen que la pagina, asi que el canvas no
se tine— y se elige el instante donde el cuadrante mas oscuro de los tres esta
lo mas claro posible. Esa es la captura a tamano real del done, y la tabla queda
como evidencia de que el problema es de datos y no de codigo.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

LUZ = """
() => {
  const c = document.createElement('canvas'); c.width = 64; c.height = 36;
  const g = c.getContext('2d', { willReadFrequently: true });
  const lum = (v) => {
    if (!v.videoWidth) return null;
    g.drawImage(v, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i+1] + 0.0722 * d[i+2];
    return +(s / (d.length / 4)).toFixed(1);
  };
  const out = { time: +window.demo.video.currentTime.toFixed(2),
                primaryContent: lum(window.demo.video), cuadrantes: {} };
  for (const n of document.querySelectorAll('#ads .ad'))
    out.cuadrantes[n.dataset.elementId] = { adTime: +n.currentTime.toFixed(2), luz: lum(n) };
  return out;
}
"""

res = {}
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)

        # El barrido: la ventana va de 20 a 32 s; se muestrea de 21 a 31.
        serie = []
        for t in [round(20.5 + 0.5 * i, 1) for i in range(21)]:
            pg.evaluate(f"() => {{ window.demo.video.currentTime = {t}; }}")
            pg.wait_for_function("""(() => {
              const a = [...document.querySelectorAll('#ads .ad')];
              return a.length === 3 && a.every(v => v.readyState >= 2);
            })()""", timeout=30000)
            time.sleep(0.45)
            m = pg.evaluate(LUZ)
            luces = [v["luz"] for v in m["cuadrantes"].values() if v["luz"] is not None]
            m["luzDelMasOscuro"] = min(luces) if luces else None
            serie.append(m)
            print(t, m["primaryContent"], {k: v["luz"] for k, v in m["cuadrantes"].items()},
                  "min", m["luzDelMasOscuro"], flush=True)
        res["barrido"] = serie
        mejor = max((m for m in serie if m["luzDelMasOscuro"] is not None),
                    key=lambda m: m["luzDelMasOscuro"])
        res["instanteElegido"] = mejor
        print("MEJOR", json.dumps(mejor), flush=True)

        # La captura, en el instante elegido y con los cuatro reproduciendo.
        pg.evaluate(f"() => {{ window.demo.video.currentTime = {mejor['time']}; }}")
        pg.wait_for_function("""(() => {
          const a = [...document.querySelectorAll('#ads .ad')];
          return a.length === 3 && a.every(v => v.readyState >= 2 && !v.paused);
        })()""", timeout=30000)
        time.sleep(0.9)
        res["enLaCaptura"] = pg.evaluate("""() => ({
          time: +window.demo.video.currentTime.toFixed(2),
          primario: { paused: window.demo.video.paused, readyState: window.demo.video.readyState },
          cuadrantes: [...document.querySelectorAll('#ads .ad')].map(v => ({
            id: v.dataset.elementId, adTime: +v.currentTime.toFixed(2),
            paused: v.paused, readyState: v.readyState, muted: v.muted,
            w: v.videoWidth, h: v.videoHeight })),
          contract: document.getElementById('contract').textContent,
          paneDemo: document.getElementById('pane-demo').dataset.state,
          paneStock: document.getElementById('pane-stock').dataset.state,
          stockState: document.getElementById('stock-state').textContent,
          demoState: document.getElementById('demo-state').textContent
        })""")
        pg.locator("#player").screenshot(path=str(OUT / "t11-multiView-player.png"))
        pg.locator(".pair").screenshot(path=str(OUT / "t11-el-par-con-el-multiview.png"))
        pg.screenshot(path=str(OUT / "t11-la-pagina-entera.png"), full_page=True)
    finally:
        pg.close()

(OUT / "t11-luz.json").write_text(json.dumps(res, indent=2))
print("WROTE", OUT / "t11-luz.json")
