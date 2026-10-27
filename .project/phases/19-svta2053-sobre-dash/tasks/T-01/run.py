import json, sys, time
from playwright.sync_api import sync_playwright
base = sys.argv[1]
with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome", headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    pg = b.new_page()
    pg.goto(base + "/probe.html")
    time.sleep(8)
    snap1 = pg.evaluate("LOG.slice()")
    pg.evaluate("document.getElementById('v').currentTime = 40")
    time.sleep(10)
    log = pg.evaluate("LOG.slice()")
    print(json.dumps({"after8s_count": len(snap1), "log": log}, indent=1))
    b.close()
