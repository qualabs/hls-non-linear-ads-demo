#!/usr/bin/env python3
"""The PNG of every frozen SVG of stage.json (`svgFijo` -> `pngFijo`), or the check
that the committed ones still are what their SVG draws.

WHY (phase 17, ADR 0101). The image option of a break is a frozen SVG (phase 15), and a
Roku does not decode SVG: its Poster draws PNG, JPEG and WebP. So right after the SVG
option each asset-list offers the same option with this PNG. The web never reaches it:
to the library both ask for the same thing, and the SVG comes first (ADR 0097).

HOW. The SVG is opened in Chrome AS A DOCUMENT OF ITS OWN, which is how an <img> draws
it, at its viewBox size (1920x1080) and a device scale factor of 1, and captured with
`omit_background`, which keeps the transparency the L backplate has in its guard. It is
the same system Chrome (`channel="chrome"`) and colour profile as capturar-svg.py, for
the same reason: the bundled Chromium does not resolve the system fonts the creatives
are drawn with. The file goes to git next to its SVG.

--verificar rasterizes again into a temporary folder and counts the differing pixels
against the committed PNG with pxdif.sh, the instrument of this demo. A PNG left behind
by an SVG that changed stops it.

Usage:  rasterizar-fijo.py [--verificar]
"""

import argparse
import json
import re
import subprocess
import sys
import tempfile
import xml.dom.minidom
from pathlib import Path

DEMO = Path(__file__).resolve().parent.parent

# Pixels that may differ between two rasterizations of the same SVG before it counts as
# a different picture. Measured on this machine: two runs of the same file give 0, so
# the threshold is 0 and anything else is reported with its count.
TOLERANCE = 0


def pairs():
    stage = json.loads((DEMO / "stage.json").read_text(encoding="utf-8"))
    out = []
    for p in stage["assets"]["piezas"]:
        if "svgFijo" in p or "pngFijo" in p:
            if not (p.get("svgFijo") and p.get("pngFijo")):
                sys.exit(f"stage.json: {p['svg']} declares only one of svgFijo and pngFijo")
            out.append((DEMO / p["svgFijo"], DEMO / p["pngFijo"]))
    if not out:
        sys.exit("stage.json declares no svgFijo: nothing to rasterize")
    return out


def size(svg: Path):
    try:
        xml.dom.minidom.parse(str(svg))
    except Exception as e:  # noqa: BLE001 -- any parse error is the failure
        sys.exit(f"BROKEN XML {svg.name}: {e}")
    m = re.search(r'viewBox\s*=\s*"([-\d.\s]+)"', svg.read_text(encoding="utf-8"))
    if not m:
        sys.exit(f"{svg.name}: no viewBox, so no native size")
    _, _, w, h = (float(v) for v in m.group(1).split())
    return int(w), int(h)


def rasterize(browser, svg: Path, png: Path):
    w, h = size(svg)
    page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
    try:
        page.goto(svg.as_uri(), wait_until="load")
        page.screenshot(path=str(png), omit_background=True)
    finally:
        page.close()
    return w, h


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--verificar", action="store_true")
    args = ap.parse_args()

    from playwright.sync_api import sync_playwright

    red = 0
    with tempfile.TemporaryDirectory(prefix="rasterizar-fijo-") as tmp, sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", args=["--force-color-profile=srgb"])
        try:
            for svg, png in pairs():
                if not args.verificar:
                    w, h = rasterize(browser, svg, png)
                    print(f"rasterizar-fijo: {png.relative_to(DEMO)}  {w}x{h}")
                    continue
                if not png.exists():
                    print(f"RED {png.relative_to(DEMO)}: missing")
                    red += 1
                    continue
                fresh = Path(tmp) / png.name
                rasterize(browser, svg, fresh)
                count = int(subprocess.run([str(DEMO / "scripts/pxdif.sh"), str(png), str(fresh)],
                                           check=True, capture_output=True, text=True).stdout.split()[0])
                verdict = "GREEN" if count <= TOLERANCE else "RED"
                red += verdict == "RED"
                print(f"{verdict} {png.relative_to(DEMO)}: {count} px differ from its SVG drawn again")
        finally:
            browser.close()
    sys.exit(1 if red else 0)


if __name__ == "__main__":
    main()
