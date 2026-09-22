#!/usr/bin/env python3
"""The audit of CREDITS.md: every asset file of this demo has a declared origin.

WHY THIS IS A SCRIPT AND NOT A READING. The phase this demo was built for claims
that nothing on screen came out of an image or a video model. That claim cannot be
held by looking at pixels, so it is held by a list -- and a list is only worth
something while it is complete. Complete is a property a program can check and a
person cannot, because the tree is hundreds of files and it grows by a packaging
run, which is the moment nobody is thinking about a credit.

WHAT IT COMPARES. The tree of `brand/`, `content/` and `graphics/` against the paths
CREDITS.md declares. It does not read the prose: it takes the backticked tokens that
appear IN THE TABLE ROWS of that document -- a line starting with `|` -- and asks,
file by file, whether one of them covers it (the same path, or a prefix ending in
`/`).

WHY ONLY THE TABLE ROWS, WHICH IS THE PART THAT WAS GOT WRONG FIRST. A section
heading of CREDITS.md says things like "-- `content/race/`", and a prose sentence
names `content/creatives/`. Accepting those as declarations makes every file under
them covered by a mention that promises nothing, and then the check passes over a
creative that nobody credited. It was seen happening: with headings accepted, a
planted `graphics/campaigns/fantasma-generado.svg` came out GREEN. A declaration is
a row of a table with an origin written next to it, and nothing else is one.

HOW TO SEE IT FIND. Pass paths as arguments: they are planted files that do not
exist, and each one has to come out named. A run with no arguments that goes green
means nothing on its own, which is why the planted run is not optional here:

    ./test/verificar-creditos.py                                   # the real tree
    ./test/verificar-creditos.py graphics/campaigns/planted.svg    # has to go red

Exit status is 0 when every file is declared and 1 when one is not, so this can be
run before publishing without reading its output.
"""
import os
import re
import sys

DEMO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CREDITS = os.path.join(DEMO, "CREDITS.md")
ASSET_DIRS = ("brand", "content", "graphics")


def declared_paths():
    """The backticked path tokens of the table rows of CREDITS.md."""
    out = set()
    for line in open(CREDITS, encoding="utf-8"):
        if not line.lstrip().startswith("|"):
            continue
        for token in re.findall(r"`([^`]+)`", line):
            if "/" in token and token.split("/")[0] in ASSET_DIRS:
                out.add(token)
    return sorted(out)


def asset_files():
    out = []
    for d in ASSET_DIRS:
        for base, _, names in os.walk(os.path.join(DEMO, d)):
            for name in names:
                out.append(os.path.relpath(os.path.join(base, name), DEMO))
    return out


def covering(path, declared):
    for d in declared:
        if path == d or (d.endswith("/") and path.startswith(d)):
            return d
    return None


def main():
    declared = declared_paths()
    planted = sys.argv[1:]
    files = sorted(asset_files() + planted)
    missing = [f for f in files if covering(f, declared) is None]

    print("== CREDITS.md: EVERY ASSET HAS A DECLARED ORIGIN ==")
    print(f"    origins declared in the tables of CREDITS.md   {len(declared)}")
    print(f"    files under {', '.join(d + '/' for d in ASSET_DIRS)}"
          f"{'':>10}{len(files)}" + (f"  ({len(planted)} planted)" if planted else ""))
    for f in missing:
        print(f"    NO ORIGIN DECLARED   {f}")
    if missing:
        print(f"  RED   {len(missing)} file(s) with no origin. An undeclared asset "
              f"blocks the demo.")
        return 1
    print("  GREEN every file of the tree is covered by a row of CREDITS.md")
    if not planted:
        print("        (a green run says nothing on its own: pass a planted path "
              "and watch it go red)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
