# T-07 of phase 19: the pair with an HLS pane and a DASH pane, captured at real size.
import json, sys, time
from playwright.sync_api import sync_playwright
base, out = sys.argv[1], sys.argv[2]
with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome", headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    logs = []
    pg.on("console", lambda m: logs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    pg.on("pageerror", lambda e: logs.append(f"pageerror: {e}"))
    pg.goto(base + "/index.html?izq=ours-2dec-img&der=dash-2dec-img")
    pg.wait_for_function("window.demo && demo.lados.der.video.readyState >= 2 && demo.lados.izq.video.readyState >= 2", timeout=30000)
    def estado():
        return pg.evaluate("""() => Object.fromEntries(['izq','der'].map(l => {
          const p = demo.lados[l]; const t = p.programa.currentTime;
          return [l, { modo: p.modo, t: +t.toFixed(2), state: document.getElementById('state-' + l).textContent,
            presented: (p.concurrent.presentedAt(p.video.currentTime) || []).map(e => e.itemId + ':' + e.type + ':' + e.elements.filter(x => !x.primary).map(x => x.mediaType || 'linear').join('+')),
            pedidos: p.pedidos.map(x => x.url.replace(location.origin, '')) }];
        }))""")
    shots = {}
    for name, t, wait in [("pre", 0.05, 4), ("break-b", 64, 6), ("lineal", 145, 9)]:
        if t > 0.05:
            pg.evaluate(f"demo.irA({t})")
        time.sleep(wait)
        pg.screenshot(path=f"{out}/{name}.png")
        shots[name] = estado()
    print(json.dumps(shots, indent=1))
    print("\n".join(logs[:30]))
    b.close()
