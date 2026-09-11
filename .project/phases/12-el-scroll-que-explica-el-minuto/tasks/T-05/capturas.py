"""Los dos anchos de la página, de arriba a abajo, y lo que tiene que seguir en pie.

Mide, en 400x780 y en 1907:
  - `scrollWidth` contra `clientWidth` del documento (la página no scrollea de costado)
  - las cuatro secciones por su `aria-label`, en orden
  - la galería (fichas), los pliegues del asset list, y la figura de la convivencia
  - el `START-DATE` que el `<pre>` del tag muestra, para cotejarlo contra el .m3u8
  - errores de consola

Y guarda la página entera en los dos anchos, más la sección 3 con un pliegue abierto,
que es el estado donde el ancho se rompe.
"""
import json, sys, tempfile
from playwright.sync_api import sync_playwright

OUT = sys.argv[1]
URL = sys.argv[2]
r = {"url": URL, "anchos": {}}

LEER = """() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  bodyScrollWidth: document.body.scrollWidth,
  secciones: Array.from(document.querySelectorAll('section[aria-label]')).map(s => s.getAttribute('aria-label')),
  fichas: document.querySelectorAll('#shapes .shape').length,
  rotulos_fichas: Array.from(document.querySelectorAll('#shapes .shape figcaption')).map(e => e.textContent.trim()),
  pliegues: document.querySelectorAll('#assets details').length,
  rotulos_pliegues: Array.from(document.querySelectorAll('#assets details > summary')).map(e => e.textContent.trim()),
  abiertos: Array.from(document.querySelectorAll('#assets details')).map(d => d.open),
  glosa: Array.from(document.querySelectorAll('.gloss li, .gloss tr, .gloss p')).map(e => e.textContent.trim()),
  figura: document.querySelectorAll('.coexist').length,
  columnas_figura: Array.from(document.querySelectorAll('.coexist__client, .coexist > figure > div')).map(e => Math.round(e.getBoundingClientRect().width)),
  tag: document.getElementById('tag') ? document.getElementById('tag').textContent : null,
  estado: document.getElementById('state').textContent,
  hud: document.getElementById('hud').textContent
})"""

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        tempfile.mkdtemp(dir="/dev/shm", prefix="chrome-t05cap-"),
        channel="chrome", headless=True, viewport={"width": 1280, "height": 800},
        args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
    for nombre, w, h in (("400x780", 400, 780), ("1907", 1907, 980)):
        page = ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
        page.on("console", lambda m: errs.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.set_viewport_size({"width": w, "height": h})
        page.goto(URL, wait_until="load")
        page.wait_for_selector("#assets details", timeout=30000)
        page.wait_for_selector("#shapes .shape", timeout=30000)
        page.wait_for_timeout(1500)
        medida = page.evaluate(LEER)
        medida["errores"] = errs
        page.screenshot(path=f"{OUT}/pagina-{nombre}.png", full_page=True)
        # la sección 3 con el pliegue más largo abierto: el estado donde el ancho se rompe
        page.evaluate("document.querySelectorAll('#assets details')[1].open = true")
        page.wait_for_timeout(600)
        medida["con_el_pliegue_2_abierto"] = page.evaluate(
            "() => ({scrollWidth: document.documentElement.scrollWidth,"
            " clientWidth: document.documentElement.clientWidth})")
        page.evaluate("document.getElementById('assets').scrollIntoView({block:'start'})")
        page.wait_for_timeout(400)
        page.screenshot(path=f"{OUT}/seccion-3-abierta-{nombre}.png")
        r["anchos"][nombre] = medida
        page.close()
    ctx.close()

json.dump(r, open(f"{OUT}/capturas.json", "w"), indent=2, ensure_ascii=False)
print(json.dumps(r, indent=2, ensure_ascii=False))
