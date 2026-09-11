import json, tempfile
from playwright.sync_api import sync_playwright

URL = "http://localhost:8085/index.html"
OUT = "/dev/shm/f12-t03-20260911-9c4d"
report = {}

medir = """() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  bodyScrollWidth: document.body.scrollWidth,
  folds: [...document.querySelectorAll('#assets details')].map(d => ({
    label: d.querySelector('.asset__label').textContent,
    open: d.open,
    width: Math.round(d.getBoundingClientRect().width),
    preScrollWidth: d.querySelector('pre') ? d.querySelector('pre').scrollWidth : null,
    preClientWidth: d.querySelector('pre') ? d.querySelector('pre').clientWidth : null
  })),
  gloss: [...document.querySelectorAll('.gloss dt')].map(dt => dt.textContent)
})"""

with sync_playwright() as p:
    for name, w, h in [("1907", 1907, 1000), ("400x780", 400, 780)]:
        ctx = p.chromium.launch_persistent_context(tempfile.mkdtemp(dir="/dev/shm", prefix="chrome-t03p-"),
            channel="chrome", headless=True, viewport={"width": w, "height": h},
            args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
        page = ctx.new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: errs.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.goto(URL, wait_until="load")
        page.wait_for_function("() => document.querySelectorAll('#assets details').length === 4", timeout=20000)
        seccion = page.locator('section[aria-label="The signalling, as it is served"]')
        seccion.scroll_into_view_if_needed()
        page.wait_for_timeout(600)

        cerrado = page.evaluate(medir)
        seccion.screenshot(path=f"{OUT}/seccion-3-cerrada-{name}.png")

        # el estado donde aparece el riesgo R2: el pliegue del aviso 2, que es el JSON más largo
        page.locator("#assets details").nth(1).locator("summary").click()
        page.wait_for_timeout(500)
        abierto = page.evaluate(medir)
        seccion.screenshot(path=f"{OUT}/seccion-3-abierta-{name}.png")
        page.screenshot(path=f"{OUT}/pagina-{name}.png", full_page=True)

        report[name] = {"cerrado": cerrado, "abierto": abierto, "console_errors": errs}
        ctx.close()

print(json.dumps(report, indent=2, ensure_ascii=False))
