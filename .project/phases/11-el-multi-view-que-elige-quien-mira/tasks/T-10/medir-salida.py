"""T-10: the way out of the multi view, measured by each of its entrances.

Every run drives the real demo through real gestures and reads the SAME four
things off the page at three moments -- before anything is raised, with a grid
on the screen and the audio taken by one of its boxes, and after the way out:

  style   `getAttribute('style')` of the primary <video>. `null` means the
          attribute is gone and the page's stylesheet is deciding again, which
          is the whole of the viewport invariant (ADR 0071).
  volume  `video.volume`. 1 is the programme's own audio back.
  nodes   how many view nodes are left in the renderer's layer.
  boxes   how many buttons the chrome has hung on the composition.

The middle reading is what gives the other two a way to fail: with a grid up the
style attribute is written and the audio has been taken off the programme, so a
check that passed by accident would have to pass there too.

Three entrances, one implementation:
  A  the button of the way out, pressed from a box at full frame.
  B  unticking the last view that is up.
  C  the window closing with views still up.

Usage: medir-salida.py URL SHOTS_DIR
"""
import io
import json
import sys

from playwright.sync_api import sync_playwright

URL = sys.argv[1]
SHOTS = sys.argv[2]

READ = """() => {
  const video = document.getElementById('video');
  const layer = document.querySelector('.qa-concurrent-layer');
  const nodes = [...layer.querySelectorAll('video.ad, img.ad')];
  const wayOut = document.querySelector('.qa-btn--way-out');
  return {
    clock: Math.round(video.currentTime * 1000) / 1000,
    style: video.getAttribute('style'),
    transform: getComputedStyle(video).transform,
    volume: Math.round(video.volume * 1000) / 1000,
    muted: video.muted,
    nodes: nodes.length,
    nodeIds: nodes.map((n) => n.dataset.elementId),
    rings: nodes.filter((n) => (n.style.outline || '') !== '').map((n) => n.dataset.elementId),
    boxButtons: document.querySelectorAll('.qa-box__btn').length,
    buttonRects: [...document.querySelectorAll('.qa-box__btn')].map((b) => {
      const r = b.getBoundingClientRect();
      return { label: b.getAttribute('aria-label'),
               rect: [Math.round(r.left), Math.round(r.top),
                      Math.round(r.width), Math.round(r.height)] };
    }),
    playRect: (() => { const b = document.querySelector('.qa-btn--play');
      if (!b) return null; const r = b.getBoundingClientRect();
      return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
    })(),
    wayOutPresent: !!wayOut,
    wayOutHidden: wayOut ? wayOut.hidden : null,
    viewsHidden: document.querySelector('.qa-btn--views')?.hidden ?? null,
    contract: document.getElementById('contract').textContent
  };
}"""


def wake(page):
    """A mouse over the picture, which is what brings the chrome up."""
    box = page.locator('#player').bounding_box()
    page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] * 0.62)
    page.wait_for_timeout(120)


def open_page(p, browser):
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.on('console', lambda m: print(f'[console:{m.type}] {m.text}', flush=True))
    page.on('pageerror', lambda e: print(f'[pageerror] {e}', flush=True))
    page.on('requestfinished', lambda q: (print(f'[http {q.response().status}] {q.url}', flush=True)
                                          if q.response() and q.response().status >= 400 else None))
    page.on('requestfailed', lambda q: print(f'[http FAIL] {q.url} {q.failure}', flush=True))
    page.goto(URL, wait_until='load')
    page.wait_for_function("() => document.getElementById('video').readyState >= 2", timeout=30000)
    return page


def into_the_window(page, at):
    """Into the window of the offer, which runs from 45 s to 105 s."""
    page.evaluate("(t) => { const v = document.getElementById('video');"
                  " v.muted = false; v.currentTime = t; v.play().catch(() => {}); }", at)
    page.wait_for_function("(t) => document.getElementById('video').currentTime > t",
                           arg=at - 1, timeout=30000)
    # The page saying the window is open, rather than this script assuming it.
    page.wait_for_selector('.qa-btn--views:not([hidden])', timeout=30000)
    wake(page)


def raise_views(page, n):
    """Tick the first `n` rows of the list that are not the programme."""
    page.click('.qa-btn--views')
    page.wait_for_selector('.qa-views--on', timeout=5000)
    rows = page.locator('.qa-views__row:not(.qa-views__row--locked)')
    names = []
    for i in range(n):
        wake(page)
        names.append(rows.nth(i).inner_text().strip())
        rows.nth(i).click()
        page.wait_for_timeout(400)
    page.keyboard.press('Escape')
    page.wait_for_timeout(900)
    wake(page)
    return names


def take_the_audio(page, index=0):
    """A press on a box of video, which is the gesture that moves the focus
    (ADR 0028). It is what takes the programme off 1, and therefore what makes
    `volume === 1` after the way out a check that can fail."""
    wake(page)
    node = page.locator('.qa-concurrent-layer video.ad').nth(index)
    # The CENTRE of the box and not its corner: the chrome hangs the button of
    # ADR 0069 in the top-left corner of every box, and a press there is that
    # button's and not this gesture's.
    node.click()
    page.wait_for_timeout(400)
    wake(page)


def dump(out):
    with io.open(f'{SHOTS}/../lecturas.json', 'w', encoding='utf-8') as fh:
        json.dump(out, fh, indent=1)


def main():
    out = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel='chrome', headless=True,
            args=['--autoplay-policy=no-user-gesture-required'])

        # ---- A: the button, pressed from a box at full frame ---------------
        page = open_page(p, browser)
        into_the_window(page, 50)
        out['A_0_before'] = page.evaluate(READ)
        out['A_rows'] = raise_views(page, 3)
        # THE LAST ONE RAISED, and that is not arbitrary: a box whose
        # composition changed after its node was built does not take the focus
        # (see bug-foco.py, a finding outside this task), so the gesture is
        # aimed where it is known to work and the check keeps its control.
        take_the_audio(page, 2)
        out['A_1a_grid_of_four'] = page.evaluate(READ)
        page.screenshot(path=f'{SHOTS}/t10-a-0-grilla-de-cuatro.png')
        # And enlarge a box, so the way out is taken from the state the diagram
        # calls Agrandada and not only from the grid. The THIRD box and not the
        # fourth: in the 2x2 the fourth box's corner is the centre of the
        # picture, where the play button is, and the two controls overlap --
        # a finding of its own, outside this task.
        wake(page)
        page.locator('.qa-box__btn').nth(2).click()
        page.wait_for_timeout(900)
        wake(page)
        out['A_1_grid'] = page.evaluate(READ)
        page.screenshot(path=f'{SHOTS}/t10-a-1-antes-de-salir.png')
        wake(page)
        page.click('.qa-btn--way-out')
        page.wait_for_timeout(1200)
        wake(page)
        out['A_2_after'] = page.evaluate(READ)
        dump(out)
        page.screenshot(path=f'{SHOTS}/t10-a-2-despues-de-salir.png')
        page.close()

        # ---- B: unticking the last view that is up -------------------------
        page = open_page(p, browser)
        into_the_window(page, 50)
        out['B_0_before'] = page.evaluate(READ)
        out['B_rows'] = raise_views(page, 1)
        take_the_audio(page, 0)
        out['B_1_grid'] = page.evaluate(READ)
        page.screenshot(path=f'{SHOTS}/t10-b-1-antes-de-salir.png')
        wake(page)
        page.click('.qa-btn--views')
        page.wait_for_selector('.qa-views--on', timeout=5000)
        wake(page)
        page.locator('.qa-views__row:not(.qa-views__row--locked)').nth(0).click()
        page.wait_for_timeout(600)
        page.keyboard.press('Escape')
        page.wait_for_timeout(900)
        wake(page)
        out['B_2_after'] = page.evaluate(READ)
        dump(out)
        page.screenshot(path=f'{SHOTS}/t10-b-2-despues-de-salir.png')
        page.close()

        # ---- C: the window closing with views still up ---------------------
        page = open_page(p, browser)
        into_the_window(page, 95)
        out['C_0_before'] = page.evaluate(READ)
        out['C_rows'] = raise_views(page, 2)
        take_the_audio(page, 1)
        out['C_1_grid'] = page.evaluate(READ)
        page.screenshot(path=f'{SHOTS}/t10-c-1-antes-de-salir.png')
        # Nobody touches anything: the window runs out. The page says so by
        # taking the button of the list away, which is tied to the offer.
        page.wait_for_function(
            "() => document.querySelector('.qa-btn--views').hidden", timeout=40000)
        page.wait_for_timeout(1200)
        out['C_2_after'] = page.evaluate(READ)
        dump(out)
        page.screenshot(path=f'{SHOTS}/t10-c-2-despues-de-salir.png')
        page.close()

        browser.close()

    print('===JSON===')
    print(json.dumps(out, indent=1))


main()
