import json, sys, time
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome", headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    pg.goto(sys.argv[1] + "/index.html?izq=ours-2dec-img&der=dash-2dec-img")
    pg.wait_for_function("window.demo && demo.lados.der.video.readyState >= 2 && demo.lados.izq.video.readyState >= 2", timeout=30000)
    pg.evaluate("demo.irA(63)")
    for i in range(8):
        time.sleep(1)
        print(json.dumps(pg.evaluate("""() => Object.fromEntries(['izq','der'].map(l => {
          const p = demo.lados[l];
          const ads = [...p.caja.player.querySelectorAll('.qa-concurrent-layer video')].map(v => +v.currentTime.toFixed(2));
          return [l, { prog: +p.programa.currentTime.toFixed(2), ads }]; }))""")))
    b.close()
