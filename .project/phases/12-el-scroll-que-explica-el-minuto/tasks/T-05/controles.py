"""Los dos controles: las mediciones de arriba, puestas a dar rojo a propósito.

Una medición que no puede dar distinto no mide nada, así que acá se rompe lo que cada
una mira y se comprueba que cambia.

  1  LA LECTURA EN VIVO. La playlist se intercepta en la red y se le reescribe el
     `START-DATE` antes de que llegue al player. Si la sección 3 leyera un tag pegado
     en el HTML, el `<pre>` seguiría diciendo el de siempre. Tiene que decir el nuevo.

  2  EL ANCHO. Con el pliegue más largo abierto a 400 px se apaga en caliente la línea
     que lo defiende (`.asset { min-width: 0 }`) y el documento tiene que pasar a
     scrollear de costado. Es el riesgo R2 vuelto a provocar sobre el árbol de hoy.
"""
import json, re, sys, tempfile
from playwright.sync_api import sync_playwright

OUT, URL = sys.argv[1], sys.argv[2]
FALSO = "2001-01-02T03:04:05.678-0300"
r = {"start_date_plantado": FALSO}

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        tempfile.mkdtemp(dir="/dev/shm", prefix="chrome-t05ctl-"),
        channel="chrome", headless=True, viewport={"width": 400, "height": 780},
        args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])

    # --- control 1: la lectura en vivo, con la playlist reescrita en vuelo ----------
    page = ctx.new_page()

    def reescribir(route):
        res = route.fetch()
        cuerpo = res.text()
        route.fulfill(response=res, body=re.sub(r'START-DATE="[^"]+"', f'START-DATE="{FALSO}"', cuerpo))

    page.route("**/con-daterange.m3u8", reescribir)
    page.goto(URL, wait_until="load")
    page.wait_for_selector("#assets details", timeout=30000)
    page.wait_for_timeout(1500)
    en_pantalla = page.inner_text("#tag")
    r["control_1"] = {
        "start_date_en_pantalla": re.search(r'START-DATE="([^"]+)"', en_pantalla).group(1),
        "siguio_a_la_red": FALSO in en_pantalla,
    }
    page.close()

    # --- control 2: el ancho, con la guarda apagada en caliente --------------------
    page = ctx.new_page()
    page.goto(URL, wait_until="load")
    page.wait_for_selector("#assets details", timeout=30000)
    page.wait_for_timeout(1200)
    page.evaluate("document.querySelectorAll('#assets details')[1].open = true")
    page.wait_for_timeout(500)
    medir = ("() => ({scrollWidth: document.documentElement.scrollWidth,"
             " clientWidth: document.documentElement.clientWidth})")
    r["control_2"] = {"con_la_guarda": page.evaluate(medir)}
    page.add_style_tag(content=".asset { min-width: auto }")
    page.wait_for_timeout(500)
    r["control_2"]["sin_la_guarda"] = page.evaluate(medir)
    page.evaluate("document.getElementById('assets').scrollIntoView({block:'start'})")
    page.wait_for_timeout(300)
    page.screenshot(path=f"{OUT}/control-ancho-sin-guarda-400.png")
    ctx.close()

r["control_1"]["rojo"] = r["control_1"]["siguio_a_la_red"]
r["control_2"]["rojo"] = r["control_2"]["sin_la_guarda"]["scrollWidth"] > r["control_2"]["sin_la_guarda"]["clientWidth"]
json.dump(r, open(f"{OUT}/controles.json", "w"), indent=2, ensure_ascii=False)
print(json.dumps(r, indent=2, ensure_ascii=False))
