"""T-12 -- el recorrido entero en UNA corrida, sin un solo seek. Es el done.

La pagina se carga una vez y se la deja reproducir. Los cinco breaks llegan
solos, uno cada veinticinco segundos, y de cada uno se saca la captura en el
instante que el barrido de `t12run.py` eligio como el mas claro de su ventana.
No hay seeks, no hay recargas y no se toca el reloj de nadie: eso es lo que hace
que el recorrido sea grabable, y por eso esta corrida es la evidencia del done y
no la otra.

De paso queda atrapado el segundo argumento que encontro la T-09. Los cinco
breaks llevan tambien su Date Range de clase Apple, asi que el cliente de
fabrica reemplaza cinco veces y vuelve al primario donde lo habia dejado: se
atrasa doce segundos por break. A los 160 s de la corrida va cuarenta y ocho
segundos de programa atras del nuestro, y los dos paneles muestran escenas
distintas de la misma pelicula.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

# El offset de la captura de cada break sale del barrido de luz de `t12run.py`:
# el instante en que el asset mas oscuro del layout esta lo mas claro posible.
# En el LBox image el barrido es plano, porque los dos assets son imagenes fijas,
# asi que ahi la captura va al medio de la ventana.
BREAKS = [
    (1, 20,  8.0, "cornerOverlay",             "Overlay"),
    (2, 45, 10.1, "squeezebackLShape",         "LBox video"),
    (3, 70,  6.0, "squeezebackLShape-image",   "LBox image"),
    (4, 95,  8.0, "squeezebackDoubleBox",      "Side by side pullback"),
    (5, 120, 2.5, "multiView",                 "Quad"),
]
# El instante del programa que el cliente de fabrica se perdio: los dos en el
# contenido primario, sin ningun aviso en pantalla, y a cuarenta y ocho segundos
# uno del otro.
T_PERDIDO = 160

ESTADO = """
() => {
  const listo = (n) => n.tagName === 'IMG' ? n.naturalWidth > 0 : n.readyState >= 2;
  const c = document.createElement('canvas'); c.width = 64; c.height = 36;
  const g = c.getContext('2d', { willReadFrequently: true });
  const lum = (n) => {
    if (!listo(n)) return null;
    g.drawImage(n, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i+1] + 0.0722 * d[i+2];
    return +(s / (d.length / 4)).toFixed(1);
  };
  const v = window.demo.video, s = document.getElementById('stock-video');
  return {
    time: +v.currentTime.toFixed(2),
    primario: { paused: v.paused, muted: v.muted, readyState: v.readyState, luz: lum(v) },
    deFabrica: { time: +s.currentTime.toFixed(2), paused: s.paused, luz: lum(s),
                 reemplazando: window.demo.stock.playingAd },
    assets: [...document.querySelectorAll('#ads .ad')].map(n => ({
      id: n.dataset.elementId, tag: n.tagName.toLowerCase(),
      adTime: n.tagName === 'IMG' ? null : +n.currentTime.toFixed(2),
      paused: n.tagName === 'IMG' ? null : n.paused,
      muted: n.tagName === 'IMG' ? null : n.muted,
      listo: listo(n), luz: lum(n),
      w: n.tagName === 'IMG' ? n.naturalWidth : n.videoWidth,
      h: n.tagName === 'IMG' ? n.naturalHeight : n.videoHeight })),
    videosEnLaPestana: document.querySelectorAll('video').length,
    contract: document.getElementById('contract').textContent,
    demoState: document.getElementById('demo-state').textContent,
    stockState: document.getElementById('stock-state').textContent,
    paneDemo: document.getElementById('pane-demo').dataset.state,
    paneStock: document.getElementById('pane-stock').dataset.state,
    boton: { text: document.getElementById('ad-audio').textContent.trim(),
             disabled: document.getElementById('ad-audio').disabled }
  };
}
"""

res = {"breaks": {}, "linea_de_tiempo": []}
console = []
seeks = []

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda m: console.append({"type": m.type, "text": m.text[:300]}))
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.provider.experiences.length === 5", timeout=30000)
        # Un contador de seeks del propio elemento, para que el "sin seeks" no
        # sea una promesa del script sino una lectura de la pagina.
        pg.evaluate("""() => {
          window.__seeks = [];
          window.demo.video.addEventListener('seeking',
            () => window.__seeks.push(+window.demo.video.currentTime.toFixed(2)));
        }""")
        t_pared = time.monotonic()

        for n, t0, off, layout, nombre in BREAKS:
            objetivo = t0 + off
            pg.wait_for_function(f"window.demo.video.currentTime >= {objetivo}", timeout=200000)
            pg.wait_for_function("""(n) => {
              const a = [...document.querySelectorAll('#ads .ad')];
              return a.length === n && a.every(x => x.tagName === 'IMG' ? x.naturalWidth > 0
                                                                        : (x.readyState >= 2 && !x.paused));
            }""", arg=(3 if layout == "multiView" else (2 if layout.startswith("squeezebackLShape") else 1)),
              timeout=30000)
            estado = pg.evaluate(ESTADO)
            pg.locator("#player").screenshot(path=str(OUT / f"t12-{n}-{layout}-player.png"))
            pg.locator(".pair").screenshot(path=str(OUT / f"t12-{n}-{layout}-el-par.png"))
            if n == 5:
                pg.screenshot(path=str(OUT / "t12-la-pagina-entera.png"), full_page=True)
            estado["paredSegundos"] = round(time.monotonic() - t_pared, 2)
            res["breaks"][f"{n}-{nombre}"] = estado
            print(f'CAPTURA break {n} {nombre}: t={estado["time"]}s pared={estado["paredSegundos"]}s '
                  f'luz=' + json.dumps({a["id"]: a["luz"] for a in estado["assets"]}) +
                  f' | fabrica t={estado["deFabrica"]["time"]} '
                  f'reemplazando={estado["deFabrica"]["reemplazando"]}', flush=True)
            res["linea_de_tiempo"].append({"hito": f"break {n} {nombre}", "programa": estado["time"],
                                           "pared": estado["paredSegundos"]})

        # El programa que el cliente de fabrica se perdio.
        pg.wait_for_function(f"window.demo.video.currentTime >= {T_PERDIDO}", timeout=200000)
        pg.wait_for_function("window.demo.provider.activeAt(window.demo.video.currentTime).length === 0",
                             timeout=20000)
        perdido = pg.evaluate(ESTADO)
        perdido["paredSegundos"] = round(time.monotonic() - t_pared, 2)
        perdido["atrasoDelDeFabricaSegundos"] = round(perdido["time"] - perdido["deFabrica"]["time"], 2)
        res["el_programa_que_se_perdio"] = perdido
        pg.locator(".pair").screenshot(path=str(OUT / "t12-el-programa-que-el-de-fabrica-se-perdio.png"))
        print("PERDIDO", json.dumps({k: perdido[k] for k in
              ("time", "atrasoDelDeFabricaSegundos", "paneDemo", "paneStock", "demoState", "stockState")}), flush=True)

        res["seeksDelPrimario"] = pg.evaluate("window.__seeks")
        res["recargas"] = 1
        res["errores"] = [c for c in console if c["type"] == "error"]
    finally:
        pg.close()

res["consola"] = console
(OUT / "t12-sin-seek.json").write_text(json.dumps(res, indent=2))
print("WROTE", OUT / "t12-sin-seek.json")
print("SEEKS:", res["seeksDelPrimario"], "ERRORES:", len(res["errores"]))
