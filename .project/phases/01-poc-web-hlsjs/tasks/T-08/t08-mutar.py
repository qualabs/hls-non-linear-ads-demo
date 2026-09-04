#!/usr/bin/env python3
"""T-08: break the production code by hand, one thing at a time, and check that
the test that covers it goes red. Restores from git after every mutation."""
import json
import subprocess
import sys
from pathlib import Path

# .project/phases/01-poc-web-hlsjs/tasks/T-08/ -> the root of the repo.
REPO = Path(__file__).resolve().parents[5]
SIG = REPO / "js/signalling.js"
REN = REPO / "js/renderer.js"

MUTATIONS = [
    ("M01 parseViewport swaps right with left", SIG,
     "return { top: n[0], right: n[1], bottom: n[2], left: n[3] };",
     "return { top: n[0], right: n[3], bottom: n[2], left: n[1] };"),
    ("M02 parseViewport stops checking the four numbers", SIG,
     "if (n.length !== 4 || n.some((v) => !Number.isFinite(v))) {",
     "if (false) {"),
    ("M03 startTime forgets the slotStart", SIG,
     "startTime: slotStart + Number(item.start ?? 0),",
     "startTime: Number(item.start ?? 0),"),
    ("M04 duration off by one second", SIG,
     "duration: Number(item.duration),",
     "duration: Number(item.duration) + 1,"),
    ("M05 an empty uri is taken as a uri", SIG,
     "uri: isPrimary ? null : source.uri || null,",
     "uri: isPrimary ? null : source.uri ?? null,"),
    ("M06 mediaType is dropped", SIG,
     "mediaType: isPrimary ? null : source.type || null",
     "mediaType: null"),
    ("M07 the sort by zDepth is removed", SIG,
     "    .sort((a, b) => a.zDepth - b.zDepth);",
     "    ;"),
    ("M08 the sort by zDepth is reversed", SIG,
     ".sort((a, b) => a.zDepth - b.zDepth);",
     ".sort((a, b) => b.zDepth - a.zDepth);"),
    ("M09 the assets go into the array before the primary", SIG,
     """  const elements = [resolveElement({ id: 'primaryContent', ...primary }, true)]
    .concat((layout.assets || []).map((a) => resolveElement(a, false)))""",
     """  const elements = (layout.assets || []).map((a) => resolveElement(a, false))
    .concat([resolveElement({ id: 'primaryContent', ...primary }, true)])"""),
    ("M10 the assumed primaryContent changes", SIG,
     "export const DEFAULT_PRIMARY = { zDepth: 0, volume: 100, viewport: '0 0 0 0' };",
     "export const DEFAULT_PRIMARY = { zDepth: 3, volume: 100, viewport: '10 0 0 0' };"),
    ("M11 the payload's primaryContent is ignored", SIG,
     "const primary = layout.primaryContent ?? DEFAULT_PRIMARY;",
     "const primary = DEFAULT_PRIMARY;"),
    ("M12 the assumed volume changes", SIG,
     "export const DEFAULT_VOLUME = 100;",
     "export const DEFAULT_VOLUME = 50;"),
    ("M13 volume falls back with || instead of ??", SIG,
     "volume: Number(source.volume ?? DEFAULT_VOLUME),",
     "volume: Number(source.volume || DEFAULT_VOLUME),"),
    ("M14 the window opens one instant late", SIG,
     "return experiences.filter((e) => time >= e.startTime && time < e.startTime + e.duration);",
     "return experiences.filter((e) => time > e.startTime && time < e.startTime + e.duration);"),
    ("M15 the window closes one instant late", SIG,
     "return experiences.filter((e) => time >= e.startTime && time < e.startTime + e.duration);",
     "return experiences.filter((e) => time >= e.startTime && time <= e.startTime + e.duration);"),
    ("M16 only the first active experience comes back", SIG,
     "return experiences.filter((e) => time >= e.startTime && time < e.startTime + e.duration);",
     "return experiences.filter((e) => time >= e.startTime && time < e.startTime + e.duration).slice(0, 1);"),
    ("M17 the width forgets to subtract the left inset", REN,
     "width: area.width - left - (area.width * box.right) / 100,",
     "width: area.width - (area.width * box.right) / 100,"),
    ("M18 the left inset is computed on a hard-coded 960", REN,
     "const left = (area.width * box.left) / 100;",
     "const left = (960 * box.left) / 100;"),
]


def restore():
    subprocess.run(["git", "checkout", "--", "js/"], cwd=REPO, check=True)


def run_tests():
    p = subprocess.run(["node", "--test"], cwd=REPO, capture_output=True, text=True)
    failed = [l.strip()[2:].split(" (")[0]
              for l in p.stdout.splitlines() if l.startswith("✖ ")]
    return p.returncode, failed


restore()
code, failed = run_tests()
assert code == 0 and not failed, f"the suite is not green before starting: {failed}"
print("baseline: green\n")

report = []
for name, path, old, new in MUTATIONS:
    src = path.read_text()
    assert src.count(old) == 1, f"{name}: the pattern appears {src.count(old)} times"
    path.write_text(src.replace(old, new))
    code, failed = run_tests()
    restore()
    print(f"{name}\n  exit={code}  red: {failed or 'NOTHING -- the mutation survived'}\n")
    report.append({"mutation": name, "exit": code, "red": failed})

Path(__file__).with_name("t08-resultado.json").write_text(json.dumps(report, indent=1))
survived = [r["mutation"] for r in report if not r["red"]]
print("survived (nobody noticed):", survived or "none")
