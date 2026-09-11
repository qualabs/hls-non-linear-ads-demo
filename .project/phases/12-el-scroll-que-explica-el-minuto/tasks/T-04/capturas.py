import json, tempfile
from playwright.sync_api import sync_playwright

OUT = "/dev/shm/t04-convivencia-20260911T175519-a7c1"
URL = "http://localhost:8099/index.html"

sizes = [("400x780", 400, 780), ("1907", 1907, 1000)]
report = {}

with sync_playwright() as p:
    profile = tempfile.mkdtemp(dir="/dev/shm", prefix="chrome-t04-")
    for name, w, h in sizes:
        ctx = p.chromium.launch_persistent_context(
            profile + "/" + name, channel="chrome", headless=True,
            viewport={"width": w, "height": h},
            args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
        )
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.goto(URL, wait_until="load")
        page.wait_for_timeout(3500)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1500)

        m = page.evaluate("""() => {
          const fig = document.querySelector('.coexist');
          const cols = [...document.querySelectorAll('.coexist__client')];
          const r = (e) => { const b = e.getBoundingClientRect(); return {x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height)}; };
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            innerWidth: window.innerWidth,
            figurePresent: !!fig,
            figureBox: fig ? r(fig) : null,
            columns: cols.map(r),
            stacked: cols.length === 2 ? r(cols[0]).y !== r(cols[1]).y : null,
            labels: [...document.querySelectorAll('.coexist__label, .coexist__tags li, .coexist__same, .coexist__client h3, .coexist__takes, .coexist__what, .coexist figcaption')].map(e => e.textContent.replace(/\\s+/g,' ').trim()),
            shapes: document.querySelectorAll('.shape').length,
            assets: document.querySelectorAll('.asset').length,
            sections: [...document.querySelectorAll('section.chapter, footer.chapter')].map(s => s.getAttribute('aria-label')),
          };
        }""")
        m["console_errors"] = errors
        report[name] = m

        sec = page.locator('section[aria-label="The signalling class"]')
        sec.scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        sec.screenshot(path=f"{OUT}/seccion-2-{name}.png")
        page.locator('.coexist').screenshot(path=f"{OUT}/figura-{name}.png")
        page.screenshot(path=f"{OUT}/pagina-{name}.png", full_page=True)
        ctx.close()

print(json.dumps(report, indent=2, ensure_ascii=False))
