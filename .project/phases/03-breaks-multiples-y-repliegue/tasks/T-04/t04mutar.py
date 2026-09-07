#!/usr/bin/env python3
"""Mutation campaign for T-04 of phase 03.

One break per rule: apply the mutation, run the whole suite, record which tests
went red and with what message, restore from git, verify the tree is clean
again. A mutation that comes back green is a finding.
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

# .project/phases/<phase>/tasks/T-04/ -> the repository, so the script runs from
# wherever it is called from and the runs are written outside the repository.
ROOT = Path(__file__).resolve().parents[5]
OUT = Path(tempfile.mkdtemp(prefix='t04-mutaciones-'))

SIG = 'lib/signalling.js'

MUTATIONS = [
    dict(
        id='M01-fixture-del-break-de-tres',
        rule='the fixture of the break of three is the one the readings were taken on',
        file='signalling/asset-list-multiAd.json',
        find='"type": "cornerOverlay",\n            "start": 0,\n            "duration": 12.0,\n            "layout": {\n              "assets": [\n                {\n                  "id": "ad2-overlay",',
        repl='"type": "lowerThirdOverlay",\n            "start": 0,\n            "duration": 12.0,\n            "layout": {\n              "assets": [\n                {\n                  "id": "ad2-overlay",',
    ),
    dict(
        id='M02-el-acumulador-no-arranca-en-cero',
        rule='the offset accumulator starts at zero, so a break of one asset opens at the START-DATE',
        file=SIG,
        find='  let assetStart = 0;',
        repl='  let assetStart = 1;',
    ),
    dict(
        id='M03-el-offset-sale-de-la-ventana-y-no-de-la-DURATION',
        rule='the offset of each asset is the accumulated top-level DURATION and not the window of the ad before it',
        file=SIG,
        find='    assetStart += Number.isFinite(declared) ? declared : 0;',
        repl='    assetStart = out.length\n      ? out[out.length - 1].startTime + out[out.length - 1].duration - slotStart\n      : assetStart + (Number.isFinite(declared) ? declared : 0);',
    ),
    dict(
        id='M04-el-start-se-lee-desde-el-START-DATE',
        rule="the item's start is an offset inside its own asset",
        file=SIG,
        find='    startTime: slotStart + assetStart + Number(item.start ?? 0),',
        repl='    startTime: slotStart + Number(item.start ?? 0),',
    ),
    dict(
        id='M05-la-identidad-vuelve-a-ser-la-del-Date-Range',
        rule='each ad of a break has an identity of its own',
        file=SIG,
        find="        out.push(resolveExperience(item, { id, itemId: `${id}.${out.length}`, slotStart, assetStart }));",
        repl='        out.push(resolveExperience(item, { id, itemId: id, slotStart, assetStart }));',
    ),
    dict(
        id='M06-el-ordinal-es-el-del-array-ASSETS',
        rule='the ordinal of an ad is of the whole break and not of the ASSETS array',
        file=SIG,
        find="        out.push(resolveExperience(item, { id, itemId: `${id}.${out.length}`, slotStart, assetStart }));",
        repl="        out.push(resolveExperience(item, { id, itemId: `${id}.${assets.indexOf(asset)}`, slotStart, assetStart }));",
    ),
    dict(
        id='M07-la-mezcla-del-aviso-a-cuadro-entero-no-se-invierte',
        rule='a full-frame ad sounds and the programme under it does not',
        file=SIG,
        find="      primaryContent: { zDepth: 0, volume: 0, viewport: '0 0 0 0' },",
        repl="      primaryContent: { zDepth: 0, volume: 100, viewport: '0 0 0 0' },",
    ),
    dict(
        id='M08-un-item-sin-ventana-pasa-por-usable',
        rule='an item with no window is a block this client cannot draw (the fallback that does not fire)',
        file=SIG,
        find='    if (!(Number(item.duration) > 0)) return null;',
        repl='    if (item.duration === undefined) return null;',
    ),
    dict(
        id='M09-un-layout-sin-assets-pasa-por-usable',
        rule='a layout with no assets in it is a block this client cannot draw',
        file=SIG,
        find='    if (!Array.isArray(assets) || assets.length === 0) return null;',
        repl='    if (!Array.isArray(assets)) return null;',
    ),
    dict(
        id='M10-el-uri-vacio-cuenta-como-bloque-ilegible',
        rule='an empty uri is not a failure of the block (the fallback that fires when it should not)',
        file=SIG,
        find='    const assets = item.layout?.assets;\n    if (!Array.isArray(assets) || assets.length === 0) return null;',
        repl='    const assets = item.layout?.assets;\n    if (!Array.isArray(assets) || assets.length === 0) return null;\n    if (assets.some((a) => !a.uri)) return null;',
    ),
    dict(
        id='M11-el-salteo-de-un-asset-cancela-el-break',
        rule='what is skipped is that asset and not the break',
        file=SIG,
        find="        ' is not. The assets after it keep their windows (Appendix D.5).');",
        repl="        ' is not. The assets after it keep their windows (Appendix D.5).');\n      out.length = 0;\n      return out;",
    ),
    dict(
        id='M12-el-fixture-del-asset-list-ilegible-pasa-a-ser-JSON-valido',
        rule='the asset-list that cannot be read is a list that cannot be read',
        file='signalling/asset-list-repliegue-json-roto.json',
        find='"DURATION": 12.0, } ]',
        repl='"DURATION": 12.0 } ] }',
    ),
    dict(
        id='M13-ASSETS-vacio-no-se-reporta',
        rule='a list that declares no ASSETS says so',
        file=SIG,
        find='  if (!Array.isArray(assets) || assets.length === 0) {',
        repl='  if (!Array.isArray(assets)) {',
    ),
    dict(
        id='M15-un-layout-sin-primaryContent-cuenta-como-ilegible',
        rule='a layout that carries no primaryContent block is drawable: the tool omits it on the two overlays',
        file=SIG,
        find='    if (!Array.isArray(assets) || assets.length === 0) return null;',
        repl='    if (!Array.isArray(assets) || assets.length === 0) return null;\n    if (!item.layout?.primaryContent) return null;',
    ),
    dict(
        id='M14-el-rango-del-break-es-la-suma-y-no-la-union',
        rule='the range of a break spans from the first ad to start to the last one to end',
        file=SIG,
        find='  return { id, kind: \'concurrent\', startTime, duration: end - startTime };',
        repl="  return { id, kind: 'concurrent', startTime, duration: experiences.reduce((s, e) => s + e.duration, 0) };",
    ),
]


def run_suite():
    p = subprocess.run(['npm', 'test'], cwd=ROOT, capture_output=True, text=True)
    return p.stdout + p.stderr


def reds(output):
    """The tests that failed, with the message node printed for each one.

    Read off the `failing tests:` block at the end of the run and not off the
    list above it: the list says WHICH one failed and the block says why, and
    the block also names each test once.
    """
    if '\u2716 failing tests:' not in output:
        return []
    tail = output.split('\u2716 failing tests:', 1)[1].splitlines()
    out = []
    for i, line in enumerate(tail):
        m = re.match(r'^\s*\u2716 (.*?) \(\d', line)
        if not m:
            continue
        message, where = '', ''
        for j in range(i + 1, min(i + 60, len(tail))):
            mm = re.match(r'^\s*((?:Assertion)?Error[^:]*): (.*)$', tail[j])
            if mm and not message:
                message = f'{mm.group(1)}: {mm.group(2)}'.strip()
            mw = re.search(r'break-sequence-and-fallback\.test\.js:(\d+):(\d+)', tail[j])
            if mw and message and not where:
                where = f'test/break-sequence-and-fallback.test.js:{mw.group(1)}'
            if message and where:
                break
        out.append({'test': m.group(1), 'message': message, 'where': where})
    return out


def totals(output):
    t = {}
    for key in ('tests', 'pass', 'fail'):
        m = re.search(rf'^ℹ {key} (\d+)$', output, re.M)
        if m:
            t[key] = int(m.group(1))
    return t


results = []
for mut in MUTATIONS:
    path = ROOT / mut['file']
    text = path.read_text()
    if text.count(mut['find']) != 1:
        print(f"!! {mut['id']}: the anchor appears {text.count(mut['find'])} times, not once")
        sys.exit(1)
    path.write_text(text.replace(mut['find'], mut['repl']))
    output = run_suite()
    (OUT / f"{mut['id']}.txt").write_text(output)
    subprocess.run(['git', 'checkout', '--', mut['file']], cwd=ROOT, check=True)
    clean = subprocess.run(['git', 'diff', '--quiet'], cwd=ROOT).returncode == 0
    r = {'id': mut['id'], 'rule': mut['rule'], 'file': mut['file'],
         'totals': totals(output), 'reds': reds(output), 'restored': clean}
    results.append(r)
    print(f"{mut['id']}: {r['totals']} restored={clean}")
    for red in r['reds']:
        print(f"    ✖ {red['test']}  [{red['where']}]\n      {red['message'][:200]}")

(OUT / 'mutaciones.json').write_text(json.dumps(results, indent=2, ensure_ascii=False))
print(f'\n{OUT}')
