import json, sys, tempfile
from playwright.sync_api import sync_playwright

OUT = "/dev/shm/f12-t02-20260911-b4e1"
URL = "http://localhost:8092/index.html"
report = {}

with sync_playwright() as p:
    for name, w, h in [("1907", 1907, 1000), ("400x780", 400, 780)]:
        profile = tempfile.mkdtemp(dir="/dev/shm", prefix="chrome-gal-")
        ctx = p.chromium.launch_persistent_context(
            profile, channel="chrome", headless=True,
            viewport={"width": w, "height": h},
            args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
        )
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.goto(URL, wait_until="load")
        # wait for the gallery to be drawn, not for a timer
        page.wait_for_function("() => document.querySelectorAll('#shapes figure').length > 0", timeout=20000)
        page.wait_for_timeout(1200)
        seccion = page.locator('section[aria-label="Two ways to run an Ad"]')
        seccion.scroll_into_view_if_needed()
        page.wait_for_timeout(800)
        m = page.evaluate("""() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          cards: [...document.querySelectorAll('#shapes figure')].map(f => ({
            caption: f.querySelector('.shape__caption').textContent,
            boxes: [...f.querySelectorAll('.shape__box')].map(b => ({
              id: b.querySelector('.shape__id').textContent,
              inset: b.querySelector('.shape__inset').textContent,
              primary: b.classList.contains('shape__box--primary'),
              css: getComputedStyle(b).inset,
              rect: (r => ({w: Math.round(r.width), h: Math.round(r.height)}))(b.getBoundingClientRect()),
              overflows: b.scrollHeight > b.clientHeight + 1 || b.scrollWidth > b.clientWidth + 1
            }))
          }))
        })""")
        m["console_errors"] = errors
        report[name] = m
        seccion.screenshot(path=f"{OUT}/seccion-1-{name}.png")
        page.screenshot(path=f"{OUT}/pagina-{name}.png", full_page=True)
        ctx.close()

print(json.dumps(report, indent=2, ensure_ascii=False))
