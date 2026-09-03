import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
results = []
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    ctx = b.contexts[0]
    page = None
    for pg in ctx.pages:
        if pg.url.startswith("http://127.0.0.1:8811/"):
            page = pg; break
    if page is None:
        page = ctx.new_page()
    page.set_viewport_size({"width": 1280, "height": 900}) if False else None
    for n in [1, 2, 3, 4, 5]:
        page.bring_to_front()
        page.goto(f"http://127.0.0.1:8811/medicion-1.html?n={n}")
        page.wait_for_function("window.__M1 && window.__M1.supported", timeout=30000)
        time.sleep(4)
        page.bring_to_front()
        page.evaluate("window.__M1.startAll()")
        time.sleep(12)
        out = page.evaluate("window.__M1.measure()")
        out["visibility"] = page.evaluate("({vis:document.visibilityState, focus:document.hasFocus()})")
        out["chrome"] = page.evaluate("navigator.userAgent")
        out["hlsjs"] = page.evaluate("window.__M1.version")
        results.append(out)
        page.screenshot(path=str(OUT / f"m1-n{n}.png"))
        print(json.dumps({"n": n, "rate": [x["rateVsWall"] for x in out["per"]],
                          "fps": [x["fps"] for x in out["per"]],
                          "dropped": [x["dropped"] for x in out["per"]],
                          "errors": len(out["errors"])}), flush=True)
(OUT / "m1-resultados.json").write_text(json.dumps(results, indent=2))
print("WROTE", OUT / "m1-resultados.json")
