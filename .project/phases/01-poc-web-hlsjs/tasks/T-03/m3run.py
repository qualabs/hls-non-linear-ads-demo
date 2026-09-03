import sys, json, time, pathlib
from playwright.sync_api import sync_playwright
OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
TIPOS = ["cornerOverlay","lowerThirdOverlay","squeezebackFrame","squeezebackDoubleBox","squeezebackLShape","multiView"]
res = {"nuestro": {}, "herramienta": {}}
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    ctx = b.contexts[0]
    ours = None
    for pg in ctx.pages:
        if pg.url.startswith("http://127.0.0.1:8811/"): ours = pg; break
    if ours is None: ours = ctx.new_page()
    tool = ctx.new_page()
    tool.goto("https://www.svta.org/wp-content/nlag/v4/", wait_until="load")
    tool.wait_for_selector("#adType", timeout=30000)
    for t in TIPOS:
        tool.bring_to_front()
        tool.select_option("#adType", t)
        tool.click("#addAssetBtn")
        time.sleep(0.8)
        js = tool.evaluate("document.getElementById('jsonPreview').textContent")
        try: res["herramienta"][t] = json.loads(js)
        except Exception: res["herramienta"][t] = {"raw": js[:2000]}
        tool.locator("#previewPlayer").screenshot(path=str(OUT / f"m3-svta-{t}.png"))
    for t in TIPOS:
        ours.bring_to_front()
        ours.goto("http://127.0.0.1:8811/medicion-3.html")
        ours.wait_for_function("!!(window.__M3 && window.__M3.render)", timeout=30000)
        ours.bring_to_front()
        out = ours.evaluate(f"window.__M3.render('{t}')")
        res["nuestro"][t] = out
        ours.locator("#player").screenshot(path=str(OUT / f"m3-nuestro-{t}.png"))
        print(t, json.dumps([{ "el":e["elemento"], "d":e["deltaMaxPx"], "asp":e["aspectoCaja"],
                              "dist%":e["distorsion"], "play":e["reproduciendo"]} for e in out["elementos"]]), flush=True)
    tool.close()
(OUT / "m3-resultados.json").write_text(json.dumps(res, indent=2))
print("WROTE", OUT / "m3-resultados.json")
