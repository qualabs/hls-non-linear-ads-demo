"""T-01 -- el recorrido de los cinco breaks consumiendo la libreria construida.

Es el mismo metodo de la T-12 de la fase 01 y a proposito: una sola carga, sin
un solo seek, los cinco breaks llegando solos uno cada veinticinco segundos, y
un contador de eventos `seeking` puesto en el elemento primario para que el "sin
seeks" sea una lectura de la pagina y no una promesa del script.

Lo que esta corrida agrega es lo de esta task. Primero, que lo que la pagina
carga es `dist/qualabs-concurrent-hls.js` y ningun modulo de `lib/`: se lee de
los requests de red, no del HTML. Segundo, que la capa donde se dibuja la
experiencia la crea la libreria adentro del contenedor y ya no la escribe la
pagina. Y tercero, en una segunda carga al final, que el chequeo de la
configuracion del ADR 0002 avisa cuando la instancia trae la maquinaria de
interstitials encendida.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

# Los mismos offsets de captura que eligio el barrido de luz de la T-12.
BREAKS = [
    (1, 20,  8.0, "cornerOverlay",             "Overlay"),
    (2, 45, 10.1, "squeezebackLShape",         "LBox video"),
    (3, 70,  6.0, "squeezebackLShape-image",   "LBox image"),
    (4, 95,  8.0, "squeezebackDoubleBox",      "Side by side pullback"),
    (5, 120, 2.5, "multiView",                 "Quad"),
]

ESTADO = """
() => {
  const capa = document.querySelector('.qa-concurrent-layer');
  const v = window.demo.video, s = document.getElementById('stock-video');
  return {
    time: +v.currentTime.toFixed(2),
    primario: { paused: v.paused, muted: v.muted, readyState: v.readyState },
    deFabrica: { time: +s.currentTime.toFixed(2), paused: s.paused,
                 reemplazando: window.demo.stock.playingAd },
    assets: [...capa.querySelectorAll('.ad')].map(n => ({
      id: n.dataset.elementId, tag: n.tagName.toLowerCase(),
      adTime: n.tagName === 'IMG' ? null : +n.currentTime.toFixed(2),
      paused: n.tagName === 'IMG' ? null : n.paused,
      listo: n.tagName === 'IMG' ? n.naturalWidth > 0 : n.readyState >= 2,
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

# El corte, leido de la pagina viva y no del codigo.
EL_CORTE = """
() => {
  const capa = document.querySelector('.qa-concurrent-layer');
  const cont = document.getElementById('player');
  const cs = getComputedStyle(capa);
  return {
    global: {
      existe: typeof window.QualabsConcurrentHls === 'object',
      superficie: Object.keys(window.QualabsConcurrentHls).sort(),
      version: window.QualabsConcurrentHls.VERSION,
      hlsConfig: Object.keys(window.QualabsConcurrentHls.hlsConfig),
      claseConcurrente: window.QualabsConcurrentHls.CONCURRENT_CLASS
    },
    diagnostico: window.demo.concurrent.diagnostics,
    laCapa: {
      laCreoLaLibreria: !!capa,
      elDivDeLaPaginaYaNoEsta: document.getElementById('ads') === null,
      dentroDelContenedor: cont.contains(capa),
      hermanaDelPrimario: capa.parentElement === window.demo.video.parentElement,
      position: cs.position, inset: cs.inset,
      pointerEvents: cs.pointerEvents,
      // El invariante del apilado: sin z-index la capa no es contexto de
      // apilado y el zDepth del layout decide quien queda arriba.
      zIndex: cs.zIndex
    },
    elPrimarioEstaDentro: cont.contains(window.demo.video),
    hayRenderer: !!window.demo.renderer
  };
}
"""

res = {"breaks": {}}
console, requests = [], []

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda m: console.append({"type": m.type, "text": m.text[:300]}))
        pg.on("request", lambda r: requests.append(r.url))
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.provider.experiences.length === 5", timeout=30000)
        pg.evaluate("""() => {
          window.__seeks = [];
          window.demo.video.addEventListener('seeking',
            () => window.__seeks.push(+window.demo.video.currentTime.toFixed(2)));
        }""")
        res["elCorte"] = pg.evaluate(EL_CORTE)
        print("CORTE", json.dumps(res["elCorte"], indent=2), flush=True)
        t_pared = time.monotonic()

        for n, t0, off, layout, nombre in BREAKS:
            pg.wait_for_function(f"window.demo.video.currentTime >= {t0 + off}", timeout=200000)
            pg.wait_for_function("""(n) => {
              const a = [...document.querySelectorAll('.qa-concurrent-layer .ad')];
              return a.length === n && a.every(x => x.tagName === 'IMG' ? x.naturalWidth > 0
                                                                        : (x.readyState >= 2 && !x.paused));
            }""", arg=(3 if layout == "multiView" else (2 if layout.startswith("squeezebackLShape") else 1)),
              timeout=30000)
            estado = pg.evaluate(ESTADO)
            estado["paredSegundos"] = round(time.monotonic() - t_pared, 2)
            pg.locator("#player").screenshot(path=str(OUT / f"t01-{n}-{layout}-player.png"))
            if n == 5:
                pg.locator(".pair").screenshot(path=str(OUT / "t01-el-par.png"))
                pg.screenshot(path=str(OUT / "t01-la-pagina-entera.png"), full_page=True)
            res["breaks"][f"{n}-{nombre}"] = estado
            print(f'CAPTURA break {n} {nombre}: t={estado["time"]}s pared={estado["paredSegundos"]}s '
                  f'assets={[a["id"] for a in estado["assets"]]}', flush=True)

        res["seeksDelPrimario"] = pg.evaluate("window.__seeks")
        res["recargas"] = 1
        res["errores"] = [c for c in console if c["type"] == "error"]
        res["laLibreriaQueSeCargo"] = {
            "construida": [u for u in requests if "/dist/" in u],
            "modulosDeLib": [u for u in requests if "/lib/" in u]
        }
    finally:
        pg.close()

# Segunda carga, corta: el chequeo del ADR 0002. Una instancia de fabrica, un
# contenedor suelto, y lo que la libreria contesta.
consola2 = []
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.on("console", lambda m: consola2.append({"type": m.type, "text": m.text[:400]}))
        pg.goto(URL, wait_until="load")
        pg.wait_for_function("!!window.QualabsConcurrentHls", timeout=20000)
        res["elChequeoDelAdr0002"] = pg.evaluate("""() => {
          const caja = document.createElement('div');
          caja.style.position = 'relative';
          document.body.appendChild(caja);
          const video = document.createElement('video');
          caja.appendChild(video);
          const deFabrica = new Hls();                                  // sin la config
          const bien = new Hls({ ...QualabsConcurrentHls.hlsConfig });   // con la config
          const a = QualabsConcurrentHls.attach(deFabrica, { container: caja, video });
          const b = QualabsConcurrentHls.attach(bien, { container: caja, video });
          const salida = { deFabrica: a.diagnostics, conLaConfig: b.diagnostics };
          deFabrica.destroy(); bien.destroy(); caja.remove();
          return salida;
        }""")
        res["consolaDelChequeo"] = [c for c in consola2 if c["type"] == "error"]
    finally:
        pg.close()

res["consola"] = console
(OUT / "t01-sin-seek.json").write_text(json.dumps(res, indent=2))
print("WROTE", OUT / "t01-sin-seek.json")
print("SEEKS:", res["seeksDelPrimario"], "ERRORES:", len(res["errores"]))
print("CHEQUEO 0002:", json.dumps(res["elChequeoDelAdr0002"], indent=2))
