import json, sys
from playwright.sync_api import sync_playwright
with sync_playwright() as pw:
    b = pw.chromium.launch(channel="chrome", headless=True)
    pg = b.new_page(); errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(sys.argv[1] + "/README.md")
    for src in ["/vendor/hls.min.js", "/vendor/dash.all.min.js", "/dist/qualabs-concurrent-hls.js", "/dist/qualabs-concurrent-dash.js"]:
        pg.add_script_tag(url=src)
    print(json.dumps(pg.evaluate("""() => ({
      dash: Object.keys(globalThis.QualabsConcurrentDash || {}), hls: Object.keys(globalThis.QualabsConcurrentHls || {}),
      dashjs: globalThis.dashjs?.Version || (globalThis.dashjs && dashjs.MediaPlayer && dashjs.MediaPlayer().create().getVersion()) })"""), indent=None), errs)
    b.close()
