import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True,
                          args=["--autoplay-policy=no-user-gesture-required"])
    page = b.new_page(viewport={"width": 1400, "height": 900}, device_scale_factor=1)
    page.goto("http://localhost:8108/")
    page.wait_for_timeout(6000)
    caja = page.locator(".player, #player, .qa-controls").first.bounding_box()
    page.mouse.move(caja["x"] + caja["width"]/2, caja["y"] + caja["height"]/2)
    page.mouse.move(caja["x"] + caja["width"]/2+3, caja["y"] + caja["height"]/2+3)
    page.wait_for_timeout(500)
    medidas = page.evaluate("""() => {
      const tops = [...document.getElementsByClassName('qa-controls__top')];
      return tops.map((t) => {
        const r = t.getBoundingClientRect();
        const b = t.getElementsByClassName('qa-btn--audio')[0].getBoundingClientRect();
        return { hijos: t.children.length, display: getComputedStyle(t).display,
                 top: Math.round(r.top), right: Math.round(r.right),
                 audio: { ancho: Math.round(b.width), top: Math.round(b.top), right: Math.round(b.right) },
                 vistas: t.getElementsByClassName('qa-btn--views').length };
      });
    }""")
    print(medidas)
    page.screenshot(path="/dev/shm/t07-out/t07-regresion-compatibility-pair.png")
    b.close()
