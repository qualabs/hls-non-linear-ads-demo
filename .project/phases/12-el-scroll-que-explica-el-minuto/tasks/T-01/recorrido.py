import tempfile, json
from playwright.sync_api import sync_playwright
OUT = "/dev/shm/f12-t01-20260911-a7c2"
URL = "http://localhost:8090/index.html"
r = {}
with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(tempfile.mkdtemp(dir="/dev/shm", prefix="chrome-run-"),
        channel="chrome", headless=True, viewport={"width": 1280, "height": 800},
        args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
    page = ctx.new_page()
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.on("console", lambda m: errs.append(f"console.error: {m.text}") if m.type == "error" else None)
    page.goto(URL, wait_until="load")
    page.wait_for_timeout(1500)
    r["opening_lines"] = page.eval_on_selector_all(".opening__panel *", "els => els.length")
    # scroll until the player is 60% visible so the walkthrough starts
    page.evaluate("document.getElementById('player').scrollIntoView({block:'center'})")
    page.wait_for_selector("#card:not([hidden])", timeout=20000)
    r["first_card"] = page.inner_text("#card")
    page.screenshot(path=f"{OUT}/run-card.png")
    r["skip_label_during"] = page.inner_text("#skip")
    r["state_line"] = page.inner_text("#state")
    r["hud"] = page.inner_text("#hud")
    # end the walkthrough with the one way out
    page.click("#skip")
    page.wait_for_function("document.body.dataset.story === 'done'", timeout=15000)
    page.wait_for_function("document.getElementById('skip').textContent.trim() === 'Play the walkthrough again'", timeout=15000)
    r["skip_label_after"] = page.inner_text("#skip")
    # restart
    page.click("#skip")
    page.wait_for_selector("#card:not([hidden])", timeout=20000)
    r["restarted_card"] = page.inner_text("#card")
    r["currentTime_after_restart"] = page.evaluate("document.getElementById('video').currentTime")
    r["errors"] = errs
    ctx.close()
print(json.dumps(r, indent=2, ensure_ascii=False))
