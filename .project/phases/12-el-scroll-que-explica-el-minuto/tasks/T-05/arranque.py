"""El arranque por viewport, medido con sus dos referencias.

La primera corrida de `recorrido.py` no pudo medir esto: al recorrer la apertura para
leer `--t`, el player cruzó el umbral y el recorrido ya estaba arrancado cuando se
quiso mirar el caso contrario. Acá se mide al revés y sobre una página recién cargada:

  a  sin scrollear un píxel, seis segundos            -> NO arranca   (referencia)
  b  con el player al ~30 % visible, cuatro segundos  -> NO arranca   (referencia)
  c  con el player entero en pantalla                 -> arranca

Y de paso mide la primera placa, que en la corrida larga quedó cortada por el mismo
motivo: cuánto se queda en pantalla contra el `hold` que declara `story.json`.
"""
import json, sys, tempfile, time
from playwright.sync_api import sync_playwright

OUT, URL = sys.argv[1], sys.argv[2]
r = {}

VISIBLE = """() => { const b = document.getElementById('player').getBoundingClientRect();
  const alto = Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
  return +(alto / b.height).toFixed(3); }"""
ESTADO = """() => ({ visible_del_player: (() => { const b = document.getElementById('player').getBoundingClientRect();
    const alto = Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    return +(alto / b.height).toFixed(3); })(),
  placa_visible: !document.getElementById('card').hidden,
  data_story: document.body.dataset.story ?? null,
  currentTime: +document.getElementById('video').currentTime.toFixed(2),
  paused: document.getElementById('video').paused })"""

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        tempfile.mkdtemp(dir="/dev/shm", prefix="chrome-t05arr-"),
        channel="chrome", headless=True, viewport={"width": 1280, "height": 800},
        args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
    page = ctx.new_page()
    errs = []
    page.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    page.on("console", lambda m: errs.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
    page.goto(URL, wait_until="load")

    # a) sin tocar el scroll
    page.wait_for_timeout(6000)
    r["a_sin_scrollear"] = page.evaluate(ESTADO)

    # b) el player asomando por abajo, por debajo del umbral
    page.evaluate("""() => { const b = document.getElementById('player').getBoundingClientRect();
        window.scrollBy(0, b.top - innerHeight + b.height * 0.3); }""")
    page.wait_for_timeout(4000)
    r["b_al_30_por_ciento"] = page.evaluate(ESTADO)
    page.screenshot(path=f"{OUT}/arranque-b-30pc.png")

    # c) la imagen en pantalla
    t0 = time.time()
    page.evaluate("document.getElementById('player').scrollIntoView({block:'center'})")
    page.wait_for_selector("#card:not([hidden])", timeout=15000)
    r["c_en_pantalla"] = page.evaluate(ESTADO)
    r["c_en_pantalla"]["segundos_hasta_la_placa"] = round(time.time() - t0, 2)
    r["c_placa"] = page.inner_text("#card")
    page.screenshot(path=f"{OUT}/arranque-c-placa-1.png")

    # la primera placa, cronometrada contra su `hold`
    while not page.evaluate("document.getElementById('card').hidden"):
        page.wait_for_timeout(100)
    r["placa_1_en_pantalla_s"] = round(time.time() - t0, 2)
    r["despues_de_la_placa_1"] = page.evaluate(ESTADO)
    r["errores"] = errs
    ctx.close()

json.dump(r, open(f"{OUT}/arranque.json", "w"), indent=2, ensure_ascii=False)
print(json.dumps(r, indent=2, ensure_ascii=False))
