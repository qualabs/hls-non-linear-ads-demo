"""El cableado de createMultiview en attach(), mirado en la demo servida.

Lo que se verifica es que el selector aparece por `attach()` y por nada mas: la
pagina de la demo escribe las seis lineas de la integracion, no importa un
modulo de lib/ ni cablea una pieza, y la lista sale igual. Y la otra mitad: que
fuera de una ventana de oferta no hay ni boton ni lista, que es lo que hace que
la propiedad de "las otras dos demos no cambian" sea de construccion.

Uso:  python3 corrida.py <carpeta-de-salida> [url]
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
URL = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8109/"

ASENTARSE_MS = 700   # PRIMARY_MOVE_MS es 380
LISTA_MS = 260       # la transicion del panel es de 140 ms

fallas = []
hechos = []


def chequear(ok, texto):
    print(("   OK   " if ok else "   FALLA") + "  " + texto)
    hechos.append(texto)
    if not ok:
        fallas.append(texto)


LECTURA = """
() => {
  const stage = document.getElementById('player');
  const video = document.getElementById('video');
  const layer = stage.getElementsByClassName('qa-concurrent-layer')[0];
  const panel = stage.getElementsByClassName('qa-views')[0];
  const boton = stage.getElementsByClassName('qa-btn--views')[0];
  const filas = panel ? [...panel.getElementsByClassName('qa-views__row')] : [];
  const nota = panel ? panel.getElementsByClassName('qa-views__note')[0] : null;
  const s = stage.getBoundingClientRect();
  const caja = (el) => {
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left - s.left), top: Math.round(r.top - s.top),
             ancho: Math.round(r.width), alto: Math.round(r.height) };
  };
  return {
    t: Number(video.currentTime.toFixed(2)),
    pausado: video.paused,
    contrato: document.getElementById('contract').textContent,
    boton: boton ? { oculto: boton.hidden, expandido: boton.getAttribute('aria-expanded') } : null,
    lista: {
      existe: Boolean(panel),
      abierta: panel ? panel.classList.contains('qa-views--on') : false,
      filas: filas.map((f) => ({
        nombre: f.getElementsByClassName('qa-views__name')[0].textContent,
        tildada: f.getAttribute('aria-checked'),
        deshabilitada: f.disabled,
        bloqueada: f.className.includes('qa-views__row--locked')
      })),
      nota: nota ? { oculta: nota.hidden, texto: nota.textContent } : null
    },
    marcas: [...stage.getElementsByClassName('qa-mark')].map((m) => m.title),
    cajas: [{ id: 'primaryContent', ...caja(video) },
            ...[...layer.children].map((n) => ({ id: n.dataset.id ?? n.className,
                                                 tag: n.tagName, pausado: n.paused ?? null,
                                                 ...caja(n) }))]
  };
}
"""

lecturas = {}

with sync_playwright() as p:
    # El Chrome del sistema: el Chromium de Playwright no resuelve fuentes aca.
    navegador = p.chromium.launch(channel="chrome", headless=True,
                                  args=["--autoplay-policy=no-user-gesture-required"])
    page = navegador.new_page(viewport={"width": 1200, "height": 820}, device_scale_factor=2)
    page.on("console", lambda m: print("   [console:%s] %s" % (m.type, m.text))
            if m.type in ("error", "warning") else None)
    page.on("response", lambda r: print("   [http %d] %s" % (r.status, r.url))
            if r.status >= 400 else None)

    page.goto(URL)
    page.wait_for_function("() => document.getElementById('video').readyState >= 2", timeout=25000)
    stage = page.locator("#player")
    b = stage.bounding_box()
    centro = (b["x"] + b["width"] / 2, b["y"] + b["height"] * 0.42)
    neutro = (b["x"] + 70, b["y"] + b["height"] * 0.30)

    def mover():
        page.mouse.move(*centro)
        page.mouse.move(centro[0] + 4, centro[1] + 4)

    def capturar(nombre):
        page.mouse.move(*neutro)
        page.wait_for_timeout(180)
        stage.screenshot(path=str(OUT / nombre))
        return nombre

    # --- 1. El programa, sin ninguna ventana abierta -----------------------
    print("\n== 1. t=10 s: ninguna ventana abierta")
    page.evaluate("() => { document.getElementById('video').currentTime = 10; }")
    page.wait_for_function("() => document.getElementById('video').currentTime > 10", timeout=15000)
    page.wait_for_timeout(ASENTARSE_MS)
    mover()
    page.wait_for_timeout(200)
    e = page.evaluate(LECTURA)
    lecturas["1-sin-ventana"] = e
    chequear(e["boton"] is not None, "el boton del selector existe: la pagina paso un multiview")
    chequear(e["boton"]["oculto"] is True, "y esta OCULTO fuera de una oferta")
    chequear(len(e["cajas"]) == 1, "una sola caja: el programa como venia")
    chequear(len(e["marcas"]) == 3, "tres marcas en la barra: %s" % e["marcas"])
    capturar("0-sin-ventana.png")

    # --- 2. El aviso concurrente de siempre, a traves del decorador --------
    print("\n== 2. t=26 s: el tag concurrente de siempre")
    page.evaluate("() => { document.getElementById('video').currentTime = 26; }")
    page.wait_for_function("() => document.getElementById('video').currentTime > 26", timeout=15000)
    page.wait_for_timeout(ASENTARSE_MS + 600)
    e = page.evaluate(LECTURA)
    lecturas["2-el-aviso-concurrente"] = e
    chequear(len(e["cajas"]) == 2, "el overlay se dibuja igual que antes (%d cajas)" % len(e["cajas"]))
    chequear("cornerOverlay" in e["contrato"], "el contrato dice %r" % e["contrato"])
    chequear(e["boton"]["oculto"] is True, "el boton del selector sigue oculto: un aviso no es una oferta")

    # --- 3. La oferta de 3 vistas -----------------------------------------
    print("\n== 3. t=50 s: la ventana de la oferta de 3 vistas")
    page.evaluate("() => { document.getElementById('video').currentTime = 50; }")
    page.wait_for_function("() => document.getElementById('video').currentTime > 50", timeout=15000)
    page.wait_for_timeout(ASENTARSE_MS)
    mover()
    page.wait_for_timeout(250)
    e = page.evaluate(LECTURA)
    lecturas["3-la-ventana-abierta"] = e
    chequear(e["boton"]["oculto"] is False, "el boton del selector aparecio con la ventana")
    chequear(len(e["cajas"]) == 1, "todavia una sola caja: componer es opcional")

    page.locator(".qa-btn--views").click()
    page.wait_for_timeout(LISTA_MS)
    e = page.evaluate(LECTURA)
    lecturas["3-la-lista-abierta"] = e
    filas = e["lista"]["filas"]
    chequear(e["lista"]["abierta"], "la lista se abrio")
    chequear(len(filas) == 4, "cuatro filas: el programa mas las tres vistas (hay %d)" % len(filas))
    chequear(filas[0]["bloqueada"] and filas[0]["tildada"] == "true",
             "la primera fila es el programa, tildada y bloqueada (%s)" % filas[0]["nombre"])
    chequear([f["nombre"] for f in filas[1:]] ==
             ["Caminandes, early", "Caminandes, late", "Elephants Dream, early"],
             "los nombres salen del asset-list de la demo: %s" % [f["nombre"] for f in filas[1:]])
    capturar("1-el-selector-en-la-demo.png")

    # --- 4. Tildar: la composicion se arma --------------------------------
    print("\n== 4. tildar dos vistas")
    for i, nombre in enumerate(["2-dos-cajas.png", "3-tres-cajas.png"]):
        page.locator(".qa-views__row").nth(i + 1).click()
        page.wait_for_timeout(ASENTARSE_MS)
        e = page.evaluate(LECTURA)
        lecturas["4-forma-de-%d" % (i + 2)] = e
        chequear(len(e["cajas"]) == i + 2, "%d cajas en pantalla (hay %d)" % (i + 2, len(e["cajas"])))
        chequear(all(c.get("pausado") is not True for c in e["cajas"][1:]),
                 "las vistas subidas estan reproduciendo")
        capturar(nombre)
    chequear("multiViewOffer" in lecturas["4-forma-de-3"]["contrato"],
             "el contrato que la pagina traza es el compuesto: %r"
             % lecturas["4-forma-de-3"]["contrato"])

    # --- 5. Destildar todo: la salida sin ningun caso especial ------------
    print("\n== 5. destildar las dos")
    for i in (2, 1):
        page.locator(".qa-views__row").nth(i).click()
        page.wait_for_timeout(ASENTARSE_MS)
    e = page.evaluate(LECTURA)
    lecturas["5-destildadas"] = e
    chequear(len(e["cajas"]) == 1, "el programa como venia (%d cajas)" % len(e["cajas"]))

    # --- 6. La ventana se cierra sola y el boton se va --------------------
    print("\n== 6. t=110 s: la ventana ya cerro")
    page.evaluate("() => { document.getElementById('video').currentTime = 110; }")
    page.wait_for_function("() => document.getElementById('video').currentTime > 110", timeout=15000)
    page.wait_for_timeout(ASENTARSE_MS)
    mover()
    page.wait_for_timeout(250)
    e = page.evaluate(LECTURA)
    lecturas["6-la-ventana-cerro"] = e
    chequear(e["boton"]["oculto"] is True, "el boton se fue con la ventana")
    chequear(len(e["cajas"]) == 1, "una sola caja")

    navegador.close()

(OUT / "la-corrida.json").write_text(json.dumps(lecturas, indent=2, ensure_ascii=False))
print("\n%d chequeos, %d fallas" % (len(hechos), len(fallas)))
if fallas:
    print("FALLARON:")
    for f in fallas:
        print("  - " + f)
    sys.exit(1)
print("== TODO VERDE ==")
