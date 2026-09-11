import json, tempfile
from playwright.sync_api import sync_playwright

URL = "http://localhost:8085/index.html"
r = {"seeks": [], "libre": []}

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(tempfile.mkdtemp(dir="/dev/shm", prefix="chrome-t03m-"),
        channel="chrome", headless=True, viewport={"width": 1280, "height": 900},
        args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
    page = ctx.new_page()
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on("console", lambda m: errs.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
    page.goto(URL, wait_until="load")
    page.wait_for_function("() => document.querySelectorAll('#assets details').length === 4", timeout=20000)

    # end the walkthrough the one way out, so the player is free
    page.evaluate("document.getElementById('player').scrollIntoView({block:'center'})")
    page.wait_for_selector("#card:not([hidden])", timeout=20000)
    page.click("#skip")
    page.wait_for_function("document.body.dataset.story === 'done'", timeout=15000)

    lee = """() => ({
      t: +document.getElementById('video').currentTime.toFixed(2),
      marcado: [...document.querySelectorAll('#assets details')]
        .filter(d => d.hasAttribute('data-live'))
        .map(d => d.querySelector('.asset__label').textContent),
      abiertos: [...document.querySelectorAll('#assets details')].map(d => d.open),
      enPantalla: document.getElementById('state').textContent
    })"""

    # A) la tabla de instantes: adentro de cada aviso y afuera del break
    page.evaluate("document.getElementById('video').pause()")
    for t in [5, 20, 35, 48, 60, 76, 80]:
        page.evaluate(f"document.getElementById('video').currentTime = {t}")
        page.wait_for_timeout(450)
        r["seeks"].append(page.evaluate(lee))

    # B) la corrida libre: nadie toca nada, el player camina el break solo
    page.evaluate("""() => {
      const v = document.getElementById('video');
      v.currentTime = 12; v.playbackRate = 8; v.play();
    }""")
    for _ in range(40):
        page.wait_for_timeout(250)
        r["libre"].append(page.evaluate(lee))

    r["errors"] = errs
    ctx.close()

# la corrida libre, comprimida: sólo los cambios de marca
compacto, previo = [], None
for m in r["libre"]:
    clave = tuple(m["marcado"])
    if clave != previo:
        compacto.append({"t": m["t"], "marcado": m["marcado"]})
        previo = clave
r["libre_cambios"] = compacto
r["libre_abiertos"] = sorted({tuple(m["abiertos"]) for m in r["libre"]})
del r["libre"]
print(json.dumps(r, indent=2, ensure_ascii=False))
