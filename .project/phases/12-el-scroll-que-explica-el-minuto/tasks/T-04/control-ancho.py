# Does the figure push the document sideways? Measured with the two lines that
# defend it and, as the reference, with them taken away at runtime.
import json, tempfile
from playwright.sync_api import sync_playwright
URL="http://localhost:8099/index.html"
BREAK_IT = """
  .coexist__tags { overflow-wrap: normal !important; word-break: normal !important; min-width: auto !important; }
  .coexist__takes { overflow-wrap: normal !important; word-break: normal !important; }
  .coexist__client { min-width: auto !important; }
"""
rows=[]
with sync_playwright() as p:
    profile=tempfile.mkdtemp(dir="/dev/shm",prefix="chrome-t04c-")
    for width in (320, 360, 400):
        for guarded in (True, False):
            ctx=p.chromium.launch_persistent_context(f"{profile}/{width}-{guarded}",channel="chrome",
                headless=True,viewport={"width":width,"height":780},
                args=["--autoplay-policy=no-user-gesture-required","--mute-audio"])
            page=ctx.new_page(); page.goto(URL,wait_until="load"); page.wait_for_timeout(2500)
            if not guarded:
                page.add_style_tag(content=BREAK_IT); page.wait_for_timeout(300)
            m=page.evaluate("""()=>({doc:document.documentElement.scrollWidth,
                client:document.documentElement.clientWidth,
                tags:Math.ceil(document.querySelector('.coexist__tags').scrollWidth),
                col:Math.ceil(document.querySelectorAll('.coexist__client')[1].scrollWidth)})""")
            rows.append({"viewport":width,"guarded":guarded,**m})
            ctx.close()
print(json.dumps(rows,indent=1))
