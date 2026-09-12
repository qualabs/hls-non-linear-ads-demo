"""H6: is the explanation of the cap ON THE SCREEN, on a phone, with the grid
full -- which is a different question from whether it is in the document.

The finding the T-11 left measured: at 420 px the panel of the list is clipped
to the height of the picture and scrolls, and what a phone was left looking at
was the head of the list. The line "4 boxes is what the screen holds. Lower one
to raise another." and the grey rows it explains were below the fold, and at
1440 both were there -- so the reference of this measurement is not a number
somebody chose, it is the same reading at the width where it already worked.

WHAT IS MEASURED IS NOT THAT THE NODE EXISTS. `note.hidden === false` is true in
the defect too: the line is in the document, painted, with its text set. What
decides whether it can be read is where it lands against the SCROLLPORT of the
panel -- the client box, which is what the panel actually shows of itself -- so
every reading here is a vertical intersection of one rectangle with that box,
and the bar is the whole element and not a sliver of it: half a sentence is not
a sentence somebody read.

THREE READINGS PER WIDTH, AND THE FIRST ONE IS THE CONTROL THAT MUST ANSWER THE
OTHER WAY:

  con-lugar     two boxes up, room left on the grid. There is no line, because
                there is nothing to explain, and the panel is at its HEAD: the
                title is whole. A change that simply parked every panel at the
                bottom would show up right here.
  grilla-llena  the grid filled by ticking, which is the gesture the finding
                was found in. The line is whole and every grey row is whole.
  reabierto     the same list closed and opened again with the grid already
                full, which is the other way into the same state and goes
                through a different path in the file (buildRows, not pick).

Usage: medir-el-pliegue.py URL SHOTS_DIR OUT_JSON TAG
"""
import io
import json
import sys

from playwright.sync_api import sync_playwright

URL = sys.argv[1]
SHOTS = sys.argv[2]
OUT = sys.argv[3]
TAG = sys.argv[4] if len(sys.argv) > 4 else 'con'

# The two widths of the T-11 run, and they are the measurement and its
# reference: 420 is the phone the finding is about, 1440 is where the line and
# the grey rows were already on screen and have to stay there.
WIDTHS = [
    {'tag': '420', 'viewport': {'width': 420, 'height': 860}},
    {'tag': '1440', 'viewport': {'width': 1440, 'height': 900}}
]

# The second window of the run: five feeds offered, four boxes of cap, so the
# grid can be filled and two rows go grey. The first window offers three and
# can never fill it.
AT = 121.0

READ = """() => {
  const panel = document.querySelector('.qa-views');
  if (!panel) return {error: 'no panel'};
  const pr = panel.getBoundingClientRect();
  const cs = getComputedStyle(panel);
  // THE SCROLLPORT AND NOT THE BORDER BOX. What the panel shows of itself is
  // its client box: the border box less the borders, and less a scrollbar if
  // the browser drew one inside it. clientHeight is that height by definition,
  // so nothing here adds up paddings by hand.
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
  // How much of an element's height is inside the scrollport, and whether that
  // is all of it. A pixel of tolerance, because these are fractional lengths
  // off tokens and not integers.
  const seen = (el) => {
    const r = el.getBoundingClientRect();
    const top = Math.max(r.top, port.top);
    const bottom = Math.min(r.bottom, port.top + port.height);
    const vis = Math.max(0, bottom - top);
    return {rect: rect(el), visible: +vis.toFixed(1),
            fraction: +(vis / r.height).toFixed(3), whole: vis >= r.height - 1};
  };
  const note = document.querySelector('.qa-views__note');
  const frame = document.querySelector('.qa-controls').getBoundingClientRect();
  return {
    frame: {width: +frame.width.toFixed(1), height: +frame.height.toFixed(1)},
    panel: {rect: rect(panel), port,
            scrollTop: +panel.scrollTop.toFixed(1),
            scrollHeight: panel.scrollHeight,
            clientHeight: panel.clientHeight,
            overflow: panel.scrollHeight - panel.clientHeight},
    title: seen(document.querySelector('.qa-views__title')),
    note: Object.assign({hidden: note.hidden, text: note.textContent}, seen(note)),
    rows: [...document.querySelectorAll('.qa-views__row')].map((n) => Object.assign({
      name: n.querySelector('.qa-views__name').textContent,
      checked: n.getAttribute('aria-checked') === 'true',
      disabled: n.disabled
    }, seen(n))),
    boxes: document.querySelectorAll('.qa-box').length
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
    page.on('requestfailed', lambda q: print(f'[http FAIL] {q.url}', flush=True))
    page.goto(URL, wait_until='load')
    page.wait_for_function("() => document.getElementById('video').readyState >= 2",
                           timeout=30000)
    return page


def into_the_window(page):
    page.evaluate("(t) => { const v = document.getElementById('video');"
                  " v.muted = true; v.currentTime = t; v.play().catch(() => {}); }", AT)
    page.wait_for_function("(t) => document.getElementById('video').currentTime > t",
                           arg=AT + 0.5, timeout=30000)
    page.wait_for_selector('.qa-btn--views:not([hidden])', timeout=30000)
    wake(page)


def open_list(page):
    page.click('.qa-btn--views')
    page.wait_for_selector('.qa-views--on', timeout=5000)


def tick(page, first, last):
    """The feeds from `first` to `last` raised, one at a time, which is the only
    gesture this list has. The range and not a count, because a row is a tick
    box: pressing one that is already up LOWERS it, so a second pass that
    started at zero again would take down what the first pass raised."""
    rows = page.locator('.qa-views__row:not(.qa-views__row--locked)')
    for i in range(first, last):
        wake(page)
        rows.nth(i).click()
        page.wait_for_timeout(400)
    wake(page)


def verdict(reading, expect_note):
    """What has to be true, said as data so the json carries it.

    With the grid full: the line is there and whole, and every grey row is
    whole. With room on the grid: no line at all, and the panel is at its head
    -- the title whole -- which is the reading that has to answer the other way.
    """
    grey = [r for r in reading['rows'] if r['disabled']]
    if expect_note:
        checks = {
            'note is shown': not reading['note']['hidden'],
            'note is whole': reading['note']['whole'],
            'there are grey rows': len(grey) > 0,
            'every grey row is whole': all(r['whole'] for r in grey)
        }
    else:
        checks = {
            'no note': reading['note']['hidden'],
            'no grey rows': len(grey) == 0,
            'the head is shown': reading['title']['whole']
        }
    return checks, all(checks.values())


def main():
    out = {'tag': TAG, 'url': URL, 'widths': {}}
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel='chrome', headless=True,
            args=['--autoplay-policy=no-user-gesture-required'])
        for width in WIDTHS:
            w = width['tag']
            page = open_page(browser, width['viewport'])
            into_the_window(page)
            states = {}

            # 1. Room on the grid: two boxes, no line.
            open_list(page)
            tick(page, 0, 1)
            states['con-lugar'] = page.evaluate(READ)
            page.screenshot(path=f'{SHOTS}/{TAG}-{w}-con-lugar.png')

            # 2. The grid filled by ticking, which is the gesture of the finding.
            tick(page, 1, 3)
            states['grilla-llena'] = page.evaluate(READ)
            page.screenshot(path=f'{SHOTS}/{TAG}-{w}-grilla-llena.png')

            # 3. The same state reached the other way: closed and opened again.
            page.keyboard.press('Escape')
            page.wait_for_timeout(400)
            wake(page)
            open_list(page)
            page.wait_for_timeout(300)
            states['reabierto'] = page.evaluate(READ)
            page.screenshot(path=f'{SHOTS}/{TAG}-{w}-reabierto.png')

            for name, reading in states.items():
                checks, green = verdict(reading, name != 'con-lugar')
                reading['checks'] = checks
                reading['green'] = green
            out['widths'][w] = {'viewport': width['viewport'], 'states': states,
                                'green': all(s['green'] for s in states.values())}
            with io.open(OUT, 'w', encoding='utf-8') as fh:
                json.dump(out, fh, indent=1)
            page.close()
        browser.close()

    print(f'=== {TAG} ===')
    for width in WIDTHS:
        w = width['tag']
        r = out['widths'][w]
        print(f"\n{w} px  {r['viewport']['width']}x{r['viewport']['height']}  "
              f"{'GREEN' if r['green'] else 'RED'}")
        for name, st in r['states'].items():
            pan = st['panel']
            print(f"  [{name}] panel {pan['clientHeight']} px of {pan['scrollHeight']} "
                  f"(overflow {pan['overflow']}, scrollTop {pan['scrollTop']})  "
                  f"{'green' if st['green'] else 'RED'}")
            print(f"     title  visible {st['title']['visible']:>5} of "
                  f"{st['title']['rect']['height']:>5}  whole={st['title']['whole']}")
            print(f"     note   visible {st['note']['visible']:>5} of "
                  f"{st['note']['rect']['height']:>5}  whole={st['note']['whole']}  "
                  f"hidden={st['note']['hidden']}")
            for row in st['rows']:
                flag = 'grey ' if row['disabled'] else ('up   ' if row['checked'] else '     ')
                print(f"     row {flag}{row['name'][:24]:<24} visible "
                      f"{row['visible']:>5} of {row['rect']['height']:>5}  "
                      f"whole={row['whole']}")
            for text, ok in st['checks'].items():
                print(f"     {'OK  ' if ok else 'FAIL'} {text}")
    print('\nALL GREEN' if all(out['widths'][w['tag']]['green'] for w in WIDTHS)
          else '\nSOMETHING RED')


main()
