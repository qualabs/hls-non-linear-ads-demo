"""HALLAZGO fuera del alcance de la T-10: el gesto que mueve el audio deja de
funcionar sobre una caja cuya composición cambió después de que se creó el nodo.

El mismo gesto, sobre la MISMA caja, dos veces:

  1. con una sola vista arriba, el toque toma el foco: anillo puesto y el
     programa a 0.
  2. se sube una segunda vista -- que no toca la primera, que sigue reproduciendo
     -- y el mismo toque sobre la MISMA caja deja la composición ENTERA en 0 y
     sin anillo en ninguna parte.

La primera lectura es la referencia: es lo que hace que la segunda pueda dar
distinto, y da distinto.
"""
import json
import sys

from playwright.sync_api import sync_playwright

URL = sys.argv[1]

READ = """() => {
  const video = document.getElementById('video');
  const nodes = [...document.querySelectorAll('.qa-concurrent-layer video.ad')];
  return {
    programme: Math.round(video.volume * 1000) / 1000,
    views: nodes.map((n) => ({ id: n.dataset.elementId,
                               volume: Math.round(n.volume * 1000) / 1000,
                               muted: n.muted,
                               ring: (n.style.outline || '') !== '' })),
    anythingAudible: (video.volume > 0 && !video.muted)
      || nodes.some((n) => n.volume > 0 && !n.muted)
  };
}"""


def wake(page):
    box = page.locator('#player').bounding_box()
    page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] * 0.62)
    page.wait_for_timeout(120)


def tick_row(page, i):
    wake(page)
    page.click('.qa-btn--views')
    page.wait_for_selector('.qa-views--on', timeout=5000)
    wake(page)
    page.locator('.qa-views__row:not(.qa-views__row--locked)').nth(i).click()
    page.wait_for_timeout(500)
    page.keyboard.press('Escape')
    page.wait_for_timeout(800)
    wake(page)


def tap_first_view(page):
    wake(page)
    page.locator('.qa-concurrent-layer video.ad').nth(0).click()
    page.wait_for_timeout(500)
    wake(page)


def main():
    out = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True,
                                    args=['--autoplay-policy=no-user-gesture-required'])
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        page.goto(URL, wait_until='load')
        page.wait_for_function("() => document.getElementById('video').readyState >= 2",
                               timeout=30000)
        page.evaluate("() => { const v = document.getElementById('video');"
                      " v.muted = false; v.currentTime = 50; v.play().catch(() => {}); }")
        page.wait_for_function("() => document.getElementById('video').currentTime > 49",
                               timeout=30000)
        page.wait_for_selector('.qa-btn--views:not([hidden])', timeout=30000)

        tick_row(page, 0)
        out['1_one_view_up'] = page.evaluate(READ)
        tap_first_view(page)
        out['2_tap_on_it__the_reference'] = page.evaluate(READ)
        # Back to nobody focused, so the second tap starts where the first did.
        tap_first_view(page)
        out['3_tap_again_lets_it_go'] = page.evaluate(READ)
        # A SECOND VIEW GOES UP. Nothing about the first one changes on screen
        # beyond its rectangle: the node is kept, it never stopped playing.
        tick_row(page, 1)
        out['4_second_view_up'] = page.evaluate(READ)
        tap_first_view(page)
        out['5_same_tap_on_the_same_box'] = page.evaluate(READ)
        browser.close()
    print('===JSON===')
    print(json.dumps(out, indent=1))


main()
