#!/usr/bin/env python3
"""Watch the 180 s run of demo/multiview-offer end to end, driving the chrome.

Connects over CDP to the already-running Chrome (port 9333), opens a page of its
own, sets an exact viewport, plays the run once from 0 to the end without
seeking, samples the contract and the DOM twice a second, and performs the
gestures a viewer would perform at the seconds the script declares.

Everything it prints is read: the contract off `window.demo.provider`, the
decoders off the <video> elements inside the container, the chrome off its own
DOM. Nothing is asserted here.
"""
import asyncio
import json
import sys
from playwright.async_api import async_playwright

URL = "http://localhost:8090/index.html"
OUT = sys.argv[1]
WIDTH = int(sys.argv[2]) if len(sys.argv) > 2 else 1440
HEIGHT = int(sys.argv[3]) if len(sys.argv) > 3 else 900
TAG = sys.argv[4] if len(sys.argv) > 4 else "wide"

READ = """
() => {
  const d = window.demo;
  if (!d || !d.provider) return { ready: false };
  const t = d.video.currentTime;
  const active = d.provider.activeAt(t);
  const offer = d.provider.offerAt(t);
  const box = (b) => [b.top, b.right, b.bottom, b.left].join(' ');
  const videos = [...d.concurrent.container.querySelectorAll('video')].map((v) => ({
    ready: v.readyState, paused: v.paused, t: Number(v.currentTime.toFixed(2)),
    w: v.videoWidth, h: v.videoHeight, vol: v.volume, muted: v.muted
  }));
  const panel = document.querySelector('.qa-views');
  const rows = [...document.querySelectorAll('.qa-views__row')].map((r) => ({
    name: r.querySelector('.qa-views__name')?.textContent,
    checked: r.getAttribute('aria-checked'),
    disabled: r.disabled,
    locked: r.classList.contains('qa-views__row--locked')
  }));
  return {
    ready: true,
    t: Number(t.toFixed(2)),
    active: active.map((e) => ({
      id: e.id, itemId: e.itemId, type: e.type,
      views: e.views ? e.views.length : null,
      elements: e.elements.map((el) => ({ id: el.id, box: box(el.box), z: el.zDepth, vol: el.volume }))
    })),
    offer: offer ? offer.itemId : null,
    videos,
    chrome: {
      announce: !!document.querySelector('.qa-announce--on'),
      dot: !!document.querySelector('.qa-btn--views.qa-btn--new'),
      viewsBtn: !!document.querySelector('.qa-btn--views'),
      wayOutBtn: !!document.querySelector('.qa-btn--way-out'),
      panelOpen: !!(panel && panel.classList.contains('qa-views--on')),
      note: document.querySelector('.qa-views__note')?.textContent || null,
      rows,
      boxBtns: document.querySelectorAll('.qa-box__btn').length
    },
    page: {
      state: document.getElementById('state')?.textContent,
      shapes: [...document.querySelectorAll('.shape figcaption')].map((n) => n.textContent),
      wayout: [...document.querySelectorAll('#wayout dd')].map((n) => n.textContent),
      runOpen: [...document.querySelectorAll('.run__row--open .run__when')].map((n) => n.textContent)
    }
  };
}
"""


async def main():
    log = open(f"{OUT}/run-{TAG}.jsonl", "w")
    console = open(f"{OUT}/console-{TAG}.log", "w")
    async with async_playwright() as p:
        browser = await p.chromium.connect_over_cdp("http://127.0.0.1:9333", timeout=180000)
        ctx = browser.contexts[0]
        page = await ctx.new_page()
        cdp = await ctx.new_cdp_session(page)
        await cdp.send("Emulation.setDeviceMetricsOverride", {
            "width": WIDTH, "height": HEIGHT, "deviceScaleFactor": 1, "mobile": False
        })
        page.on("console", lambda m: console.write(f"[{m.type}] {m.text}\n"))
        page.on("pageerror", lambda e: console.write(f"[pageerror] {e}\n"))
        await page.goto(URL, wait_until="load")

        # Scroll past the opening so the player is on screen: that is what starts
        # the programme, and it is the same gesture a reader makes.
        await page.evaluate("() => document.querySelector('.stage').scrollIntoView()")
        await page.wait_for_timeout(1500)

        player = page.locator("#player")
        box = await player.bounding_box()
        cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2

        async def wake():
            """Reveal the chrome: it hides on a timer and nothing suspends it."""
            await page.mouse.move(cx, cy - 10)
            await page.mouse.move(cx, cy)
            await page.wait_for_timeout(120)

        async def shot(name):
            # The player back on screen before every frame: a click that had to
            # wait for an element scrolls the page looking for it, and a
            # screenshot of the wrong scroll position says nothing.
            await page.evaluate("() => document.querySelector('.stage').scrollIntoView()")
            await page.wait_for_timeout(150)
            await page.screenshot(path=f"{OUT}/shots/{TAG}-{name}.png")

        async def click(selector, note):
            await wake()
            try:
                await page.locator(selector).first.click(timeout=4000)
                console.write(f"[action] clicked {selector} ({note})\n")
            except Exception as exc:  # noqa: BLE001
                console.write(f"[action-failed] {selector} ({note}): {exc}\n")

        async def ensure_panel(note):
            await wake()
            try:
                open_now = await page.evaluate(
                    "() => !!document.querySelector('.qa-views--on')")
                if not open_now:
                    await page.locator('.qa-btn--views').first.click(timeout=4000)
                    console.write(f"[action] opened the list ({note})\n")
                else:
                    console.write(f"[action] the list was already open ({note})\n")
            except Exception as exc:  # noqa: BLE001
                console.write(f"[action-failed] open the list ({note}): {exc}\n")

        async def click_row(index, note):
            await wake()
            try:
                await page.locator(".qa-views__row").nth(index).click(timeout=4000)
                console.write(f"[action] row {index} ({note})\n")
            except Exception as exc:  # noqa: BLE001
                console.write(f"[action-failed] row {index} ({note}): {exc}\n")

        # Sound on, once, at the start: an offer opens with the programme
        # sounding and every feed silent, which is a mix nobody hears on mute.
        await click(".qa-btn--audio", "sound on")

        script = [
            (26.0, "shot", "01-concurrent-ad"),
            (46.0, "shot", "02-offer-opens"),
            (48.0, "panel", "before the first tick"),
            (49.0, "shot", "03-selector-open"),
            (51.0, "row", (1, "raise feed 1")),
            (55.0, "shot", "04-two-boxes"),
            (59.0, "panel", "before the second tick"),
            (60.0, "row", (2, "raise feed 2")),
            (64.0, "shot", "05-three-boxes"),
            (68.0, "panel", "before the third tick"),
            (69.0, "row", (3, "raise feed 3")),
            (73.0, "shot", "06-four-boxes"),
            (78.0, "enlarge", 1),
            (82.0, "shot", "07-enlarged"),
            (87.0, "enlarge", 0),
            (91.0, "shot", "08-back-to-the-grid"),
            (96.0, "click", (".qa-btn--way-out", "leave with the button")),
            (99.0, "shot", "09-left-the-window"),
            (121.0, "shot", "10-long-catalogue-opens"),
            (124.0, "panel", "before the first tick"),
            (126.0, "row", (1, "raise feed 1")),
            (130.0, "panel", "before the second tick"),
            (131.0, "row", (2, "raise feed 2")),
            (135.0, "panel", "before the third tick"),
            (136.0, "row", (3, "raise feed 3")),
            (140.0, "panel", "look at a full grid"),
            (141.0, "shot", "11-grid-full-rows-disabled"),
            (145.0, "row", (1, "lower feed 1")),
            (147.0, "row", (4, "raise feed 4, which was disabled a moment ago")),
            (151.0, "shot", "12-swapped"),
            (156.0, "panel", "before unticking"),
            (157.0, "row", (2, "lower")),
            (159.0, "row", (3, "lower")),
            (161.0, "row", (4, "lower the last one, which is the way out")),
            (165.0, "shot", "13-left-by-unticking"),
            (178.0, "shot", "14-end-of-the-run"),
        ]
        step = 0

        samples = []
        last_state = None
        while True:
            data = await page.evaluate(READ)
            if data.get("ready"):
                samples.append(data)
                log.write(json.dumps(data) + "\n")
                log.flush()
                t = data["t"]
                while step < len(script) and script[step][0] <= t:
                    _, kind, arg = script[step]
                    step += 1
                    if kind == "shot":
                        await shot(arg)
                    elif kind == "click":
                        await click(arg[0], arg[1])
                    elif kind == "panel":
                        await ensure_panel(arg)
                    elif kind == "row":
                        await click_row(arg[0], arg[1])
                    elif kind == "enlarge":
                        await wake()
                        try:
                            btns = page.locator(".qa-box__btn")
                            n = await btns.count()
                            console.write(f"[action] box buttons on screen: {n}\n")
                            await btns.nth(arg).click(timeout=4000)
                            console.write(f"[action] box button {arg}\n")
                        except Exception as exc:  # noqa: BLE001
                            console.write(f"[action-failed] box button {arg}: {exc}\n")
                if t >= 179.0:
                    break
            await page.wait_for_timeout(500)

        await shot("15-final")
        # The three sections below the picture, each as its own image, at the end
        # of the run -- which is the only moment the gallery of shapes has
        # anything in it, because it fills as the run is walked.
        for i, name in enumerate(["17-announces", "18-shapes", "19-signalling"]):
            await page.evaluate(f"() => document.querySelectorAll('.chapter')[{i}].scrollIntoView()")
            await page.wait_for_timeout(400)
            await page.locator(".chapter").nth(i).screenshot(
                path=f"{OUT}/shots/{TAG}-{name}.png")
        await page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(600)
        await page.screenshot(path=f"{OUT}/shots/{TAG}-16-full-page.png", full_page=True)
        await page.close()
    log.close()
    console.close()
    print(f"samples: {len(samples)}")


asyncio.run(main())
