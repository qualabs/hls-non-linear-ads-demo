"""T-01 -- el recorrido de los cinco breaks, que tiene que seguir corriendo igual.

Es la restriccion del bloque, no una de las cuatro lecturas: lo que se afirma es
que despues de cambiar el desplazamiento, la identidad y la precarga, la corrida
que hoy se graba entrega los mismos rangos y la misma experiencia adentro de cada
break, sin un solo seek.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"
BREAKS = [(1, 20, "cornerOverlay"), (2, 45, "squeezebackLShape"),
          (3, 70, "squeezebackLShape"), (4, 95, "squeezebackDoubleBox"),
          (5, 120, "multiView")]
FIN = 135.0

ESTADO = """
() => {
  const v = window.demo.video;
  return {
    t: +v.currentTime.toFixed(3),
    activas: window.demo.provider.activeAt(v.currentTime).map((e) => ({
      id: e.id, itemId: e.itemId, type: e.type,
      startTime: +e.startTime.toFixed(3), duration: +e.duration.toFixed(3),
      elementos: e.elements.length })),
    nodos: [...window.demo.layer.querySelectorAll('.ad')]
      .map((n) => ({ elementId: n.dataset.elementId, opacity: n.style.opacity || '',
                     readyState: typeof n.readyState === 'number' ? n.readyState : null }))
  };
}
"""

res = {"dentro": [], "rangos": None, "seeks": None, "errores": []}
consola = []
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda m: consola.append({"type": m.type, "text": m.text[:400]}))
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.provider.experiences.length === 5", timeout=30000)
        pg.evaluate("""() => { window.__seeks = [];
            window.demo.video.addEventListener('seeking', function () {
              window.__seeks.push(+this.currentTime.toFixed(2)); }); }""")
        pend = list(BREAKS)
        while True:
            m = pg.evaluate(ESTADO)
            for fila in list(pend):
                n, t0, layout = fila
                if m["t"] >= t0 + 6:
                    res["dentro"].append(dict(m, breakN=n, esperado=layout))
                    pend.remove(fila)
                    print(f"break {n} t={m['t']}s  activas="
                          f"{[(e['itemId'], e['type'], e['startTime'], e['duration']) for e in m['activas']]}"
                          f"  nodos={[(x['elementId'], x['opacity']) for x in m['nodos']]}", flush=True)
            if m["t"] >= FIN:
                break
            time.sleep(0.05)
        res["rangos"] = pg.evaluate("() => window.demo.provider.programRanges()")
        res["seeks"] = pg.evaluate("window.__seeks")
    finally:
        pg.close()
res["errores"] = [c for c in consola if c["type"] == "error"]
(OUT / "t01-el-recorrido-de-los-cinco.json").write_text(json.dumps(res, indent=2))
print("\nrangos:", json.dumps(res["rangos"]["ranges"]))
print("settled:", res["rangos"]["settled"], " seeks:", res["seeks"])
print("errores:", res["errores"])
