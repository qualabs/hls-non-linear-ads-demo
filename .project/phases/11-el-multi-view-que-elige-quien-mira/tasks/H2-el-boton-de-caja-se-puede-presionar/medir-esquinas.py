"""H2: the button of every box, in the three shapes, asked the only question
that decides whether it can be pressed -- WHO GETS THE POINT.

The defect this measures was found by the T-10 and stated in pixels: in the 2x2
the fourth box's button sits at [646, 403, 34, 34] under a play button at
[603, 359, 74, 74]. A style read of that button says nothing is wrong -- it is
visible, it is 34 px, it is where the arithmetic put it -- because what is wrong
is not in the button, it is on top of it. So nothing here reads a style.

Three readings per box, and each one can fail on its own:

  owner    `document.elementFromPoint` at the CENTRE of the button, which is the
           point a finger aims at. It is the browser's own hit test, the same
           one a press goes through, and it answers with the element that would
           get the press and not with the one that asked.
  belongs  whether that element is the button or something inside it.
  click    a real Playwright click, with no `force`: it refuses to press a
           point somebody else owns, which is exactly how the T-10 found this.
           What proves it ARRIVED is not that it did not throw -- it is that the
           composition went to full frame ON THE BOX THAT WAS PRESSED, read
           back off the label of the one button that is left.

And the control the whole thing hangs on: THE THREE SHAPES, not the one that
failed. Two of them were already right, so a fix that moved every button would
show up here as two shapes changing answer.

Usage: medir-esquinas.py URL SHOTS_DIR OUT_JSON [TAG]
"""
import io
import json
import sys

from playwright.sync_api import sync_playwright, Error as PwError

URL = sys.argv[1]
SHOTS = sys.argv[2]
OUT = sys.argv[3]
TAG = sys.argv[4] if len(sys.argv) > 4 else 'fix'

# THE THREE SHAPES OF ADR 0065, and a fourth reading that is the same 2x2 on a
# small screen. The programme is always one of the boxes, so a composition of N
# needs N-1 views raised.
#
# The small one is not decoration: at 1280 the bar is a tenth of the picture and
# no corner of any box reaches it, so a rule that only avoided the play button
# would look right in all three. On a phone half the picture is barely taller
# than the bar, and the corners at the bottom are IN it -- which is the reading
# that says why the bar is one of the rectangles this chrome measures.
SHAPES = [
    {'tag': '2-cajas', 'n': 2, 'viewport': {'width': 1280, 'height': 900}},
    {'tag': '3-cajas', 'n': 3, 'viewport': {'width': 1280, 'height': 900}},
    {'tag': '4-cajas', 'n': 4, 'viewport': {'width': 1280, 'height': 900}},
    {'tag': '4-cajas-en-un-telefono', 'n': 4, 'viewport': {'width': 420, 'height': 820}}
]

READ = """() => {
  // WHO it is, said so that a reading can be read: the element itself, and then
  // the nearest thing up the tree that carries a name. An icon inside a button
  // is that button as far as a press is concerned, and `svg` on its own would
  // not say which button it is the icon of.
  const describe = (el) => {
    if (!el) return null;
    const named = el.closest ? el.closest('[aria-label]') : null;
    return el.tagName.toLowerCase() +
      (typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\\s+/).join('.') : '') +
      (named ? ` in ${named.className}[${named.getAttribute('aria-label')}]` : '');
  };
  const asRect = (r) => [Math.round(r.left), Math.round(r.top),
                         Math.round(r.width), Math.round(r.height)];
  const overlap = (a, b) => {
    const w = Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]);
    const h = Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]);
    return w > 0 && h > 0 ? [w, h, w * h] : [0, 0, 0];
  };
  const furniture = {};
  for (const [name, sel] of [['row', '.qa-controls__top'], ['play', '.qa-btn--play'],
                             ['bar', '.qa-controls__bar']]) {
    const node = document.querySelector(sel);
    furniture[name] = node ? asRect(node.getBoundingClientRect()) : null;
  }
  const buttons = [...document.querySelectorAll('.qa-box__btn')].map((btn) => {
    const r = btn.getBoundingClientRect();
    const rect = asRect(r);
    // THE CENTRE, because that is the point a press is aimed at and the only
    // one whose owner decides anything.
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const owner = document.elementFromPoint(cx, cy);
    return {
      label: btn.getAttribute('aria-label'),
      corner: (btn.parentElement.className.match(/qa-box--(\\w+)/) || [null, 'nw'])[1],
      rect,
      point: [Math.round(cx), Math.round(cy)],
      owner: describe(owner),
      belongs: !!owner && (owner === btn || btn.contains(owner)),
      overPlay: furniture.play ? overlap(rect, furniture.play) : null,
      overRow: furniture.row ? overlap(rect, furniture.row) : null,
      overBar: furniture.bar ? overlap(rect, furniture.bar) : null
    };
  });
  const layer = document.querySelector('.qa-controls');
  return {
    layer: asRect(layer.getBoundingClientRect()),
    furniture,
    buttons,
    viewNodes: document.querySelectorAll('.qa-concurrent-layer video.ad, '
      + '.qa-concurrent-layer img.ad').length
  };
}"""


def wake(page):
    """A mouse over the picture, which is what brings the chrome up."""
    box = page.locator('#player').bounding_box()
    page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] * 0.62)
    page.wait_for_timeout(120)


def open_page(browser, viewport):
    page = browser.new_page(viewport=viewport)
    page.on('pageerror', lambda e: print(f'[pageerror] {e}', flush=True))
    page.on('requestfailed', lambda q: print(f'[http FAIL] {q.url} {q.failure}', flush=True))
    page.goto(URL, wait_until='load')
    page.wait_for_function("() => document.getElementById('video').readyState >= 2", timeout=30000)
    return page


def into_the_window(page, at=50):
    page.evaluate("(t) => { const v = document.getElementById('video');"
                  " v.muted = false; v.currentTime = t; v.play().catch(() => {}); }", at)
    page.wait_for_function("(t) => document.getElementById('video').currentTime > t",
                           arg=at - 1, timeout=30000)
    page.wait_for_selector('.qa-btn--views:not([hidden])', timeout=30000)
    wake(page)


def raise_views(page, n):
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


def press(page, index, expected_label):
    """A real click on box `index`, and what it did.

    The click is the gesture; the proof is the label of the single button that
    is left, which names the box that went to full frame. Then the same button
    again, which is the way back to the grid -- so the next box is measured on
    the same composition as this one and not on whatever the last press left."""
    out = {'index': index, 'label': expected_label}
    wake(page)
    try:
        page.locator('.qa-box__btn').nth(index).click(timeout=4000)
        out['clicked'] = True
    except PwError as err:
        out['clicked'] = False
        out['error'] = str(err).strip().splitlines()[0]
        return out
    page.wait_for_timeout(900)
    wake(page)
    labels = [b.get_attribute('aria-label')
              for b in page.locator('.qa-box__btn').all()]
    out['afterLabels'] = labels
    out['enlargedOne'] = len(labels) == 1 and labels[0].endswith('back to the grid')
    out['enlargedIsTheOnePressed'] = (
        len(labels) == 1 and labels[0].split(':')[0] == expected_label.split(':')[0])
    # Back to the grid, for the next box.
    wake(page)
    page.locator('.qa-box__btn').nth(0).click(timeout=4000)
    page.wait_for_timeout(900)
    wake(page)
    out['backToGrid'] = page.locator('.qa-box__btn').count()
    return out


def main():
    out = {'tag': TAG, 'url': URL, 'shapes': {}}
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel='chrome', headless=True,
            args=['--autoplay-policy=no-user-gesture-required'])
        for shape in SHAPES:
            n = shape['n']
            page = open_page(browser, shape['viewport'])
            into_the_window(page)
            rows = raise_views(page, n - 1)
            reading = page.evaluate(READ)
            reading['raised'] = rows
            reading['viewport'] = shape['viewport']
            reading['boxes'] = len(reading['buttons'])
            page.screenshot(path=f"{SHOTS}/{TAG}-{shape['tag']}.png")
            presses = []
            for i, btn in enumerate(reading['buttons']):
                presses.append(press(page, i, btn['label']))
            reading['presses'] = presses
            reading['green'] = (
                reading['boxes'] == n
                and all(b['belongs'] for b in reading['buttons'])
                and all(pr.get('clicked') and pr.get('enlargedIsTheOnePressed')
                        for pr in presses))
            out['shapes'][shape['tag']] = reading
            with io.open(OUT, 'w', encoding='utf-8') as fh:
                json.dump(out, fh, indent=1)
            page.close()
        browser.close()

    print(f'=== {TAG} ===')
    for shape in SHAPES:
        r = out['shapes'][shape['tag']]
        print(f"{shape['tag']}  {r['viewport']['width']}x{r['viewport']['height']}  "
              f"boxes={r['boxes']}  play={r['furniture']['play']}  bar={r['furniture']['bar']}  "
              f"{'GREEN' if r['green'] else 'RED'}")
        for b, pr in zip(r['buttons'], r['presses']):
            print(f"   {b['label'][:34]:<34} corner={b['corner']} rect={b['rect']} "
                  f"point={b['point']} belongs={b['belongs']} owner={b['owner']}")
            print(f"      overPlay={b['overPlay']} overBar={b['overBar']} "
                  f"overRow={b['overRow']} clicked={pr.get('clicked')} "
                  f"enlargedIsTheOnePressed={pr.get('enlargedIsTheOnePressed')} "
                  f"{pr.get('error', '')}")
    print('ALL GREEN' if all(out['shapes'][s['tag']]['green'] for s in SHAPES)
          else 'SOMETHING RED')


main()
