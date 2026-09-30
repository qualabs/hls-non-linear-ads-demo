import sys, time, json
from playwright.sync_api import sync_playwright
base=sys.argv[1]
with sync_playwright() as pw:
    nav=pw.chromium.launch(channel="chrome",args=["--autoplay-policy=no-user-gesture-required","--mute-audio"])
    p=nav.new_page(viewport={"width":1920,"height":960})
    red=[]
    p.on("requestfinished", lambda r: "asset-list-break-a" in r.url and red.append(("finished", r.url, r.response().status if r.response() else None, r.resource_type)))
    p.on("requestfailed", lambda r: "asset-list-break-a" in r.url and red.append(("failed", r.url, r.failure)))
    p.goto(base+"/index.html?izq=nativo&der=ours-2dec-img")
    p.wait_for_function("window.demo && window.demo.lados && window.demo.lados.izq.stock")
    p.evaluate("""() => { const h=window.demo.lados.izq.stock.hls, E=Hls.Events; window.__ev=[];
      for (const n of ['ASSET_LIST_LOADING','ASSET_LIST_LOADED','INTERSTITIAL_STARTED','INTERSTITIAL_ENDED','ERROR'])
        h.on(E[n], (e,d) => window.__ev.push({n, id:d?.event?.identifier, det:d?.details, fatal:d?.fatal, err:d?.error?.message, url:String(d?.event?.assetListUrl??d?.url??''), keys:Object.keys(d||{})})); }""")
    p.wait_for_function("window.demo.lados.izq.programa.currentTime > 24", timeout=60000)
    time.sleep(1)
    print("RED (browser network log):"); [print("  ",r) for r in red]
    print("HLS EVENTS:"); [print("  ",json.dumps(e)) for e in p.evaluate("()=>window.__ev")]
    print("PANEL izq:", p.locator("#wire-izq").inner_text())
    p.locator("#pane-izq .wire--pane").screenshot(path=sys.argv[2]+"/panel-antes.png")
    nav.close()
