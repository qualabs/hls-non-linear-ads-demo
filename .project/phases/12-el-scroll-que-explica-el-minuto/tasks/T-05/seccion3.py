"""La sección 3, que es la que puede quedar muerta sin que nada falle.

Tres cosas:

  1  LA LECTURA EN VIVO. El `START-DATE` que se ve en el `<pre>` del tag se compara
     contra el que trae `content/primary/con-daterange.m3u8` pedido por HTTP acá al
     lado, que es una fuente independiente de la página. Un tag pegado en el HTML es
     lo único que esta sección no puede ser.

  2  LA GLOSA, una línea por atributo, y sólo por los que la línea trae.

  3  LA MARCA EN VIVO, por instantes, con el caso que tiene que dar lo contrario:
     afuera del break no hay ninguna marca. La tercera columna es la línea de estado
     que `app.js` pinta de la misma llamada al contrato, que es una segunda lectura.
"""
import json, re, sys, tempfile, urllib.request
from playwright.sync_api import sync_playwright

OUT, URL = sys.argv[1], sys.argv[2]
base = URL.rsplit('/', 1)[0]
playlist = urllib.request.urlopen(base + '/content/primary/con-daterange.m3u8').read().decode()
tag_del_m3u8 = next(l for l in playlist.splitlines() if l.startswith('#EXT-X-DATERANGE'))
r = {"tag_del_m3u8": tag_del_m3u8,
     "start_date_del_m3u8": re.search(r'START-DATE="([^"]+)"', tag_del_m3u8).group(1)}

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        tempfile.mkdtemp(dir="/dev/shm", prefix="chrome-t05s3-"),
        channel="chrome", headless=True, viewport={"width": 1280, "height": 900},
        args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
    page = ctx.new_page()
    errs = []
    page.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    page.on("console", lambda m: errs.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
    page.goto(URL, wait_until="load")
    page.wait_for_selector("#assets details", timeout=30000)
    page.wait_for_timeout(1200)

    r["tag_en_pantalla"] = page.inner_text("#tag")
    r["start_date_en_pantalla"] = re.search(r'START-DATE="([^"]+)"', r["tag_en_pantalla"]).group(1)
    r["la_pagina_lee_en_vivo"] = r["start_date_en_pantalla"] == r["start_date_del_m3u8"]
    r["glosa"] = page.evaluate(
        "() => Array.from(document.querySelectorAll('.gloss dt')).map(dt => [dt.textContent.trim(), dt.nextElementSibling.textContent.trim()])")
    r["atributos_del_tag"] = re.findall(r'([A-Z][A-Z0-9-]+)=', r["tag_en_pantalla"])

    MARCA = """() => ({
      t: +document.getElementById('video').currentTime.toFixed(1),
      marcado: Array.from(document.querySelectorAll('#assets details'))
        .filter(d => d.hasAttribute('data-live'))
        .map(d => d.querySelector('.asset__label').textContent.trim()),
      estado: document.getElementById('state').textContent,
      abiertos: Array.from(document.querySelectorAll('#assets details')).map(d => d.open)
    })"""
    # el recorrido arranca cuando la imagen se ve, y se saltea por el botón, que es la
    # única salida (ADR 0042). Sin traer el player a pantalla primero no hay recorrido
    # que saltear, y el botón lo que hace entonces es arrancarlo.
    page.evaluate("document.getElementById('player').scrollIntoView({block:'center'})")
    page.wait_for_selector("#card:not([hidden])", timeout=20000)
    page.click("#skip")
    page.wait_for_function("document.body.dataset.story === 'done'", timeout=20000)
    page.evaluate("document.getElementById('video').pause()")
    r["por_instantes"] = []
    for t in (5, 20, 35, 48, 60, 76, 80):
        page.evaluate(f"document.getElementById('video').currentTime = {t}")
        page.wait_for_timeout(700)
        r["por_instantes"].append(page.evaluate(MARCA))
    page.evaluate("document.getElementById('video').currentTime = 35")
    page.wait_for_timeout(700)
    page.evaluate("document.getElementById('assets').scrollIntoView({block:'center'})")
    page.wait_for_timeout(300)
    page.screenshot(path=f"{OUT}/seccion-3-marca.png")
    r["errores"] = errs
    ctx.close()

json.dump(r, open(f"{OUT}/seccion3.json", "w"), indent=2, ensure_ascii=False)
print(json.dumps(r, indent=2, ensure_ascii=False))
