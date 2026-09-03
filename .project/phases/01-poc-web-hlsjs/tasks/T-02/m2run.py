import sys, json, time, pathlib
from playwright.sync_api import sync_playwright
OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    ctx = b.contexts[0]
    page = None
    for pg in ctx.pages:
        if pg.url.startswith("http://127.0.0.1:8811/"):
            page = pg; break
    if page is None: page = ctx.new_page()
    page.bring_to_front()
    page.goto("http://127.0.0.1:8811/medicion-2.html")
    page.wait_for_function("window.__M2 && window.__M2.start", timeout=30000)
    time.sleep(4)
    page.bring_to_front()
    snaps = {}
    print(json.dumps(page.evaluate("window.__M2.start()")), flush=True)
    for t in [4, 8, 11, 13, 16, 20]:
        while True:
            ct = page.evaluate("document.getElementById('vdemo').currentTime")
            if ct >= t or ct > 38: break
            time.sleep(0.3)
        snaps[f"t{t}"] = page.evaluate("window.__M2.snapshot()")
        page.screenshot(path=str(OUT / f"m2-t{t}.png"))
        print(t, json.dumps(snaps[f"t{t}"])[:400], flush=True)
    log = page.evaluate("window.__M2.log")
    (OUT / "m2-log.json").write_text(json.dumps({"log": log, "snapshots": snaps}, indent=2))
    print("WROTE", OUT / "m2-log.json")
