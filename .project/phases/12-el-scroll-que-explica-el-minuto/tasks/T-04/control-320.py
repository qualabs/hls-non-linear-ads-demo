# Where do the 334 px at a 320 px viewport come from? Measured with the figure in
# place, with the figure hidden, and element by element.
import json, tempfile
from playwright.sync_api import sync_playwright
URL="http://localhost:8099/index.html"
out={}
with sync_playwright() as p:
    profile=tempfile.mkdtemp(dir="/dev/shm",prefix="chrome-t04d-")
    for label,css in (("figure in place",""),("figure hidden",".coexist{display:none !important}")):
        ctx=p.chromium.launch_persistent_context(f"{profile}/{label}",channel="chrome",headless=True,
            viewport={"width":320,"height":780},
            args=["--autoplay-policy=no-user-gesture-required","--mute-audio"])
        page=ctx.new_page(); page.goto(URL,wait_until="load"); page.wait_for_timeout(2500)
        if css: page.add_style_tag(content=css); page.wait_for_timeout(300)
        out[label]=page.evaluate("""()=>{
          const wide=[...document.querySelectorAll('body *')]
            .filter(e=>e.getBoundingClientRect().right>320.5)
            .map(e=>({el:e.tagName.toLowerCase()+'.'+(e.className||'').toString().split(' ')[0],
                      right:Math.round(e.getBoundingClientRect().right)}));
          return {doc:document.documentElement.scrollWidth, client:document.documentElement.clientWidth,
                  overflowing:wide.slice(0,12)};}""")
        ctx.close()
print(json.dumps(out,indent=1))
