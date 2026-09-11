import sys, json, tempfile, os
from playwright.sync_api import sync_playwright

OUT = "/dev/shm/f12-t01-20260911-a7c2"
URL = "http://localhost:8090/index.html"

sizes = [("400x780", 400, 780), ("1907", 1907, 1000)]
report = {}

with sync_playwright() as p:
    profile = tempfile.mkdtemp(dir="/dev/shm", prefix="chrome-shoot-")
    for name, w, h in sizes:
        ctx = p.chromium.launch_persistent_context(
            profile + "/" + name,
            channel="chrome",
            headless=True,
            viewport={"width": w, "height": h},
            args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
        )
        page = ctx.new_page()
        errors = []
        page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.goto(URL, wait_until="load")
        page.wait_for_timeout(3500)
        # scroll to the bottom so lazy layout settles, then back up
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1500)
        m = page.evaluate("""() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            bodyScrollWidth: document.body.scrollWidth,
            innerWidth: window.innerWidth,
            docHeight: document.documentElement.scrollHeight,
            tag: (document.getElementById('tag')||{}).textContent,
            list: ((document.getElementById('list')||{}).textContent||'').slice(0,200),
            shapes: document.getElementById('shapes') ? document.getElementById('shapes').innerHTML.trim() : 'MISSING',
            assets: document.getElementById('assets') ? document.getElementById('assets').innerHTML.trim() : 'MISSING',
            sections: [...document.querySelectorAll('section.chapter, footer.chapter')].map(s => s.getAttribute('aria-label'))
        })""")
        m["console_errors"] = errors
        report[name] = m
        page.screenshot(path=f"{OUT}/scroll-{name}.png", full_page=True)
        page.evaluate("window.scrollTo(0,0)")
        page.wait_for_timeout(300)
        ctx.close()

print(json.dumps(report, indent=2, ensure_ascii=False))
