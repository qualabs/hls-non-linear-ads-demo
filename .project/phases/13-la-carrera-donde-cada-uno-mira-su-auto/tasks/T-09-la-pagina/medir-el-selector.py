"""T-09 / R5: do the rows of this catalogue fit in the panel of the selector, and does the
page stay inside its own width -- at a phone and at a desktop, with the grid as full as the
catalogue allows and the list open.

THE INSTRUMENT IS THE ONE PHASE 11 BUILT, on purpose. `H6-la-nota-del-tope-se-lee-en-un-
telefono/medir-el-pliegue.py` measured the same panel with five views, and the value of
reusing it is that its numbers and these are comparable: the same readings, taken the same
way, so a row that stopped fitting is visible as a difference and not as an opinion. What is
added here is the second property -- the document may not scroll sideways -- which that task
had no reason to measure.

WHAT IS MEASURED IS NOT THAT A NODE EXISTS. `row.hidden === false` is true in the defect too.
What decides whether a row can be read is where it lands against the SCROLLPORT of the panel
-- the client box, which is what the panel actually shows of itself -- so every reading here
is a vertical intersection of one rectangle with that box, and the bar is the whole element:
half a row is not a row somebody read.

THE TWO CONTROLS, because a check that cannot fail is not a check:

  `con-lugar`   is the control of the panel reading. One camera up, room left on the grid:
                there is no line about the cap, because there is nothing to explain, and the
                panel is at its HEAD -- the title whole. A measurement that simply parked
                every panel at the bottom would show up right here.
  `ancho`       is the control of the sideways reading. After measuring, a block wider than
                the viewport is inserted, the same reading is taken again and has to come
                back RED, and the block is removed. Without it, "the document does not
                scroll sideways" is a sentence that would also be printed by a broken
                instrument.

Usage: medir-el-selector.py URL SHOTS_DIR OUT_JSON RACE_JSON
"""
import io
import json
import sys

from playwright.sync_api import sync_playwright

URL = sys.argv[1]
SHOTS = sys.argv[2]
OUT = sys.argv[3]
RACE = json.load(open(sys.argv[4]))

# The two widths the phase asks for. 400x780 is the phone; 1907 is the desktop the demo is
# shown on. The height of the desktop is the window a laptop gives after its chrome.
WIDTHS = [
    {'tag': '400x780', 'viewport': {'width': 400, 'height': 780}},
    {'tag': '1907x1000', 'viewport': {'width': 1907, 'height': 1000}}
]

# Inside the window, read off race.json and not typed: the second the offer opens plus a few,
# so the asset-list has resolved and the selector is populated.
AT = float(RACE['ofertaEn']) + 3.0

READ = """() => {
  const panel = document.querySelector('.qa-views');
  const doc = document.documentElement;
  // THE DOCUMENT'S OWN WIDTH. scrollWidth is how wide the content really is and clientWidth
  // is how wide the viewport shows; the difference is exactly what a sideways scrollbar
  // would scroll. Both the root and the body are read, because an overflowing child can push
  // either one.
  const sideways = {
    docScrollWidth: doc.scrollWidth,
    docClientWidth: doc.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    overflowX: doc.scrollWidth - doc.clientWidth,
    bodyOverflowX: document.body.scrollWidth - doc.clientWidth
  };
  sideways.clean = sideways.overflowX <= 0 && sideways.bodyOverflowX <= 0;
  if (!panel) return {sideways, panel: null};
  const pr = panel.getBoundingClientRect();
  const cs = getComputedStyle(panel);
  const port = {
    left: pr.left + parseFloat(cs.borderLeftWidth),
    top: pr.top + parseFloat(cs.borderTopWidth),
    width: panel.clientWidth,
    height: panel.clientHeight
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return {left: +r.left.toFixed(1), top: +r.top.toFixed(1),
            width: +r.width.toFixed(1), height: +r.height.toFixed(1)};
  };
  const seen = (el) => {
    const r = el.getBoundingClientRect();
    const top = Math.max(r.top, port.top);
    const bottom = Math.min(r.bottom, port.top + port.height);
    const vis = Math.max(0, bottom - top);
    return {rect: rect(el), visible: +vis.toFixed(1),
            fraction: +(vis / r.height).toFixed(3), whole: vis >= r.height - 1};
  };
  const note = document.querySelector('.qa-views__note');
  return {
    sideways,
    panel: {rect: rect(panel), port,
            scrollTop: +panel.scrollTop.toFixed(1),
            scrollHeight: panel.scrollHeight,
            clientHeight: panel.clientHeight,
            overflow: panel.scrollHeight - panel.clientHeight},
    title: seen(document.querySelector('.qa-views__title')),
    note: note ? Object.assign({hidden: note.hidden, text: note.textContent}, seen(note))
               : {hidden: true, text: '', visible: 0, whole: false,
                  rect: {left: 0, top: 0, width: 0, height: 0}},
    rows: [...document.querySelectorAll('.qa-views__row')].map((n) => Object.assign({
      name: n.querySelector('.qa-views__name').textContent,
      checked: n.getAttribute('aria-checked') === 'true',
      locked: n.classList.contains('qa-views__row--locked'),
      disabled: !!n.disabled
    }, seen(n))),
    boxes: document.querySelectorAll('.qa-box').length,
    state: document.getElementById('state').textContent
  };
}"""

# The control of the sideways reading: a block wider than the viewport, measured, removed.
WIDEN = """() => {
  const doc = document.documentElement;
  const probe = document.createElement('div');
  probe.id = 'control-de-ancho';
  probe.style.cssText = `width:${doc.clientWidth + 400}px;height:4px`;
  document.body.appendChild(probe);
  const read = {overflowX: doc.scrollWidth - doc.clientWidth,
                bodyOverflowX: document.body.scrollWidth - doc.clientWidth};
  probe.remove();
  read.clean = read.overflowX <= 0 && read.bodyOverflowX <= 0;
  read.after = {overflowX: doc.scrollWidth - doc.clientWidth,
                bodyOverflowX: document.body.scrollWidth - doc.clientWidth};
  return read;
}"""


def wake(page):
    """A mouse over the picture, which is what brings the chrome up."""
    box = page.locator('#player').bounding_box()
    page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] * 0.62)
    page.wait_for_timeout(120)


def open_page(browser, viewport):
    page = browser.new_page(viewport=viewport)
    page.on('pageerror', lambda e: print(f'[pageerror] {e}', flush=True))
    page.on('requestfailed', lambda q: print(f'[http FAIL] {q.url}', flush=True))
    page.goto(URL, wait_until='load')
    # The picture is below an opening that is three screens tall, and the programme does not
    # start until the player is on screen. Scrolling to it is what a reader does.
    page.locator('#player').scroll_into_view_if_needed()
    page.wait_for_timeout(400)
    page.wait_for_function("() => document.getElementById('video').readyState >= 2",
                           timeout=60000)
    return page


def into_the_window(page):
    page.evaluate("(t) => { const v = document.getElementById('video');"
                  " v.muted = true; v.currentTime = t; v.play().catch(() => {}); }", AT)
    page.wait_for_function("(t) => document.getElementById('video').currentTime > t",
                           arg=AT + 0.5, timeout=60000)
    page.wait_for_selector('.qa-btn--views:not([hidden])', timeout=60000)
    wake(page)


def open_list(page):
    page.click('.qa-btn--views')
    page.wait_for_selector('.qa-views--on', timeout=5000)


def raisable(page):
    """The rows that can still be raised: not the programme, not already up, not greyed."""
    return page.evaluate("""() => [...document.querySelectorAll('.qa-views__row')]
      .map((n, i) => ({i, up: n.getAttribute('aria-checked') === 'true',
                       locked: n.classList.contains('qa-views__row--locked'),
                       off: !!n.disabled}))
      .filter((r) => !r.locked && !r.up && !r.off).map((r) => r.i)""")


def fill(page, limit=None):
    """Raise cameras one at a time until the grid takes no more, which is the gesture the
    finding of phase 11 was found in. It is a range and not a count: a row is a tick box, so
    pressing one that is already up would LOWER it."""
    rows = page.locator('.qa-views__row')
    raised = 0
    while True:
        free = raisable(page)
        if not free or (limit is not None and raised >= limit):
            return raised
        wake(page)
        rows.nth(free[0]).click()
        page.wait_for_timeout(450)
        raised += 1


def main():
    out = {'url': URL, 'at': AT, 'widths': {}}
    with sync_playwright() as p:
        # The system Chrome and not the bundled Chromium: the bundled one does not resolve
        # fonts on this machine, and a measurement of what is visible cannot be taken in a
        # browser whose text has no height.
        browser = p.chromium.launch(
            channel='chrome', headless=True,
            args=['--autoplay-policy=no-user-gesture-required'])
        for width in WIDTHS:
            w = width['tag']
            page = open_page(browser, width['viewport'])
            into_the_window(page)
            states = {}

            open_list(page)
            page.wait_for_timeout(300)
            raised_one = fill(page, limit=1)
            states['con-lugar'] = page.evaluate(READ)
            page.screenshot(path=f'{SHOTS}/{w}-con-lugar.png')

            more = fill(page)
            states['grilla-llena'] = page.evaluate(READ)
            states['grilla-llena']['raised'] = raised_one + more
            page.screenshot(path=f'{SHOTS}/{w}-grilla-llena.png')

            page.keyboard.press('Escape')
            page.wait_for_timeout(400)
            wake(page)
            open_list(page)
            page.wait_for_timeout(300)
            states['reabierto'] = page.evaluate(READ)
            page.screenshot(path=f'{SHOTS}/{w}-reabierto.png')

            control = page.evaluate(WIDEN)

            # The page end to end, which is the other half of the definition of done.
            page.keyboard.press('Escape')
            page.wait_for_timeout(300)
            page.evaluate("() => window.scrollTo(0, 0)")
            page.wait_for_timeout(300)
            page.screenshot(path=f'{SHOTS}/{w}-pagina-entera.png', full_page=True)
            states['pagina-entera'] = page.evaluate(READ)

            out['widths'][w] = {'viewport': width['viewport'], 'states': states,
                                'control-de-ancho': control}
            with io.open(OUT, 'w', encoding='utf-8') as fh:
                json.dump(out, fh, indent=1)
            page.close()
        browser.close()

    ok = True
    for width in WIDTHS:
        w = width['tag']
        r = out['widths'][w]
        print(f"\n================ {w} ================")
        for name, st in r['states'].items():
            sw = st['sideways']
            print(f"\n[{name}]")
            print(f"  sideways  document {sw['docScrollWidth']} wide in a viewport of "
                  f"{sw['docClientWidth']}  ->  overflow {sw['overflowX']} px "
                  f"(body {sw['bodyOverflowX']})  {'CLEAN' if sw['clean'] else 'SCROLLS'}")
            if not sw['clean']:
                ok = False
            if not st['panel']:
                print('  panel     not open')
                continue
            pan = st['panel']
            print(f"  panel     shows {pan['clientHeight']} px of {pan['scrollHeight']} "
                  f"(overflow {pan['overflow']}, scrollTop {pan['scrollTop']})")
            print(f"  title     visible {st['title']['visible']:>6} of "
                  f"{st['title']['rect']['height']:>6}  whole={st['title']['whole']}")
            print(f"  note      visible {st['note']['visible']:>6} of "
                  f"{st['note']['rect']['height']:>6}  whole={st['note']['whole']}  "
                  f"hidden={st['note']['hidden']}")
            for row in st['rows']:
                flag = ('locked' if row['locked'] else
                        'grey  ' if row['disabled'] else
                        'up    ' if row['checked'] else '      ')
                print(f"  row {flag} {row['name'][:26]:<26} visible {row['visible']:>6} of "
                      f"{row['rect']['height']:>6}  whole={row['whole']}")
                if not row['whole']:
                    ok = False
            print(f"  boxes     {st['boxes']}")
            print(f"  state     {st['state']}")
        c = r['control-de-ancho']
        print(f"\n  CONTROL   with a block 400 px wider than the viewport: overflow "
              f"{c['overflowX']} px  ->  {'CLEAN (the check is broken)' if c['clean'] else 'SCROLLS, as it must'}"
              f"   ; removed again: overflow {c['after']['overflowX']} px")
        if c['clean']:
            ok = False

    print('\nEVERY ROW WHOLE AND NO SIDEWAYS SCROLL' if ok else '\nSOMETHING IS RED')


main()
