# La medición del riesgo R2, con su referencia: el mismo pliegue abierto, con y sin la
# línea `min-width: 0` de `.asset`. Sin la referencia, un `scrollWidth` de 400 no prueba
# que la línea haga algo.
import json, tempfile
from playwright.sync_api import sync_playwright
URL = "http://localhost:8085/index.html"
medir = """() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth
})"""
r = {}
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(tempfile.mkdtemp(dir="/dev/shm", prefix="chrome-t03a-"),
        channel="chrome", headless=True, viewport={"width": 400, "height": 780},
        args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
    page = ctx.new_page()
    page.goto(URL, wait_until="load")
    page.wait_for_function("() => document.querySelectorAll('#assets details').length === 4", timeout=20000)
    page.locator("#assets").scroll_into_view_if_needed()
    r["pliegues cerrados"] = page.evaluate(medir)
    page.locator("#assets details").nth(1).locator("summary").click()
    page.wait_for_timeout(400)
    r["pliegue 2 abierto, con min-width: 0"] = page.evaluate(medir)
    page.add_style_tag(content=".asset { min-width: auto; }")
    page.wait_for_timeout(400)
    r["el mismo pliegue abierto, sin la linea"] = page.evaluate(medir)
    ctx.close()
print(json.dumps(r, indent=2, ensure_ascii=False))
