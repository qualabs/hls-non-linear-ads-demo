"""T-09: the three readings of the mix, taken off the running page.

Drives the real demo through the real gestures -- hover, open the list, tick
three rows, press the button on a box, press it again -- and reads `volume`,
`currentTime` and the focus ring off every element of the composition at three
moments: in the grid, with one box at full frame, and back in the grid.

The measurement that gives this a way to fail is the THIRD reading against the
SECOND. They have to be identical: coming back to the grid gives the geometry
back and does not touch the audio (ADR 0069). The reading that says the check
is not vacuous is the first one, which is a different mix.
"""
import json
import sys
import time

from playwright.sync_api import sync_playwright

URL = sys.argv[1]
SHOTS = sys.argv[2]

READ = """() => {
  const video = document.getElementById('video');
  const layer = document.querySelector('.qa-concurrent-layer');
  const chrome = document.querySelector('.qa-controls');
  const nodes = [...layer.querySelectorAll('video.ad, img.ad')];
  const of = (id, n) => ({
    id,
    volume: Math.round(n.volume * 1000) / 1000,
    muted: n.muted,
    currentTime: Math.round(n.currentTime * 1000) / 1000,
    paused: n.paused,
    readyState: n.readyState,
    ring: (n.style.outline || '') !== '',
    rect: (() => { const r = n.getBoundingClientRect();
      return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })()
  });
  return {
    clock: Math.round(video.currentTime * 1000) / 1000,
    chromeUp: chrome.classList.contains('qa-controls--on'),
    chromeOpacity: getComputedStyle(chrome).opacity,
    buttons: [...document.querySelectorAll('.qa-box__btn')].map((b) => b.getAttribute('aria-label')),
    elements: [of('primaryContent', video), ...nodes.map((n) => of(n.dataset.elementId, n))]
  };
}"""


def wake(page):
    """A mouse over the picture, which is what brings the chrome up."""
    box = page.locator('#player').bounding_box()
    page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] * 0.62)
    page.wait_for_timeout(120)


def main():
    out = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel='chrome', headless=True,
            args=['--autoplay-policy=no-user-gesture-required',
                  '--use-fake-ui-for-media-stream'])
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        page.on('console', lambda m: print(f'[console:{m.type}] {m.text}', flush=True))
        page.on('pageerror', lambda e: print(f'[pageerror] {e}', flush=True))
        page.goto(URL, wait_until='load')

        page.wait_for_function("() => document.getElementById('video').readyState >= 2",
                               timeout=30000)
        # Into the window of the offer: 45 s to 105 s of the programme.
        page.evaluate("() => { const v = document.getElementById('video');"
                      " v.muted = false; v.currentTime = 50; v.play().catch(() => {}); }")
        page.wait_for_function("() => document.getElementById('video').currentTime > 49",
                               timeout=30000)
        # The button of the list appears with the window, so it is the page
        # saying the offer is on rather than this script assuming it.
        page.wait_for_selector('.qa-btn--views:not([hidden])', timeout=30000)

        # ---- the grid: tick every view of the catalogue ---------------------
        wake(page)
        page.click('.qa-btn--views')
        page.wait_for_selector('.qa-views--on', timeout=5000)
        rows = page.locator('.qa-views__row:not(.qa-views__row--locked)')
        n = rows.count()
        out['rows'] = [rows.nth(i).inner_text().strip() for i in range(n)]
        for i in range(n):
            wake(page)
            rows.nth(i).click()
            page.wait_for_timeout(400)
        page.keyboard.press('Escape')
        page.wait_for_timeout(1200)
        wake(page)
        page.wait_for_selector('.qa-box__btn', timeout=5000)

        out['1_in_the_grid'] = page.evaluate(READ)
        page.screenshot(path=f'{SHOTS}/1-grid.png')

        # ---- one box to the whole picture -----------------------------------
        # The SECOND view and not the first, so a reading that came out right by
        # position instead of by identity comes out wrong.
        labels = out['1_in_the_grid']['buttons']
        target = labels[2]
        out['enlarged'] = target
        wake(page)
        page.click(f'.qa-box__btn[aria-label="{target}"]')
        page.wait_for_timeout(900)
        wake(page)
        out['2_at_full_frame'] = page.evaluate(READ)
        page.screenshot(path=f'{SHOTS}/2-enlarged.png')

        # ---- and back ---------------------------------------------------------
        wake(page)
        page.click('.qa-box__btn')
        page.wait_for_timeout(900)
        wake(page)
        out['3_back_in_the_grid'] = page.evaluate(READ)
        page.screenshot(path=f'{SHOTS}/3-back.png')

        # ---- the two gestures on one box do not collide ----------------------
        # The box that is sounding right now is the one that was enlarged. Its
        # own press toggles the audio OFF (ADR 0028), so if the press on the
        # button reached the box underneath as well, this would come back at
        # volume 0 -- a box at full frame that nobody hears. It is the one
        # reading where "the button does not hit the box" can fail.
        wake(page)
        page.click(f'.qa-box__btn[aria-label="{target}"]')
        page.wait_for_timeout(900)
        wake(page)
        out['5_enlarged_again'] = page.evaluate(READ)
        page.screenshot(path=f'{SHOTS}/5-enlarged-again.png')
        wake(page)
        page.click('.qa-box__btn')
        page.wait_for_timeout(700)
        wake(page)
        out['6_back_again'] = page.evaluate(READ)

        # ---- and with the chrome down, the button is not there ---------------
        page.mouse.move(5, 5)          # off the picture: a mouse leaving hides it
        page.wait_for_timeout(3200)
        out['4_chrome_down'] = page.evaluate(READ)
        page.screenshot(path=f'{SHOTS}/4-chrome-down.png')

        browser.close()
    print('===JSON===')
    print(json.dumps(out, indent=1))


main()
