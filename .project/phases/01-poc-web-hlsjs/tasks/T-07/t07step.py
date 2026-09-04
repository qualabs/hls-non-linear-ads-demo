"""One step of the audio test, one process.

Why it is split into steps: recording the machine's output has to happen
OUTSIDE the Playwright context. Measured here: a `parec` started inside
`with sync_playwright()` is killed on time and returns rc 124 but writes zero
bytes, and the same call before entering the context writes its 64000. So
Playwright drives the page and bash records the sound.
"""
import sys, json, time
from playwright.sync_api import sync_playwright

STEP = sys.argv[1]
URL = "http://localhost:8080/"

STATE = """
() => {
  const video = window.demo.video;
  const ad = document.querySelector('#ads .ad');
  const s = (el) => el ? { muted: el.muted, volume: el.volume, paused: el.paused,
                           currentTime: +el.currentTime.toFixed(2), readyState: el.readyState } : null;
  return { primary: s(video), ad: s(ad),
           adsOnScreen: document.querySelectorAll('#ads .ad').length,
           button: document.getElementById('ad-audio').textContent.trim(),
           contract: document.getElementById('contract').textContent };
}
"""

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    ctx = b.contexts[0]
    pg = ctx.pages[0] if ctx.pages else ctx.new_page()

    if STEP == "prepare":
        pg.set_viewport_size({"width": 1420, "height": 1020})
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
        pg.evaluate("() => { window.demo.video.currentTime = 19.0; }")
        pg.wait_for_function("window.demo.provider.activeAt(window.demo.video.currentTime).length > 0", timeout=30000)
        pg.wait_for_function("(() => { const a = document.querySelector('#ads .ad'); return a && a.readyState >= 2 && !a.paused; })()", timeout=30000)
    elif STEP == "rewind":
        # Back to the start of the window before each recording: the window is
        # twelve seconds long and reconnecting over CDP eats some of them.
        pg.evaluate("() => { window.demo.video.currentTime = 20.6; }")
        time.sleep(0.8)
    elif STEP == "click":
        # A REAL click, dispatched as input by the browser: it is the control of
        # ADR 0010 being used, and it is also the user gesture that gives the
        # page the right to make sound.
        pg.locator("#ad-audio").click()
        time.sleep(0.5)
    elif STEP == "unmute-primary":
        # The primary's control is the player's native one; here it is set
        # directly, which the click above has already authorised.
        pg.evaluate("() => { window.demo.video.muted = false; window.demo.video.volume = 1; }")
        time.sleep(0.5)
    elif STEP == "mute-primary":
        pg.evaluate("() => { window.demo.video.muted = true; }")
    elif STEP == "state":
        pass
    else:
        raise SystemExit(f"unknown step {STEP}")

    print(json.dumps(pg.evaluate(STATE)))
