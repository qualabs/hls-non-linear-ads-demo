#!/usr/bin/env python3
"""One deliberate break per rule, each running only the tests that cover it.

A break that stays GREEN is a finding: it means the rule is not actually
checked by anything. Runs over a copy of the tree, never the live one.
"""
import pathlib
import shutil
import subprocess
import sys

ARBOL = pathlib.Path(sys.argv[1])
LIB = ARBOL / 'lib/multiview.js'
ORIGINAL = LIB.read_text()

MUTACIONES = [
    (
        'the cap of four boxes is not applied',
        'if (boxes > MAX_BOXES) {',
        'if (false) {',
        'five boxes',
    ),
    (
        'the same view can be raised twice',
        'if (new Set(raised).size !== raised.length) {',
        'if (false) {',
        'the same view twice',
    ),
    (
        'the enlarged box does not have to be on the grid',
        'if (enlarged !== PRIMARY_ID && !raised.includes(enlarged)) {',
        'if (false) {',
        'enlarged box is not on the grid',
    ),
    (
        'the row of the programme is not locked',
        "{ id: PRIMARY_ID, name: state.offer.primaryName, checked: true, locked: true, disabled: false }",
        "{ id: PRIMARY_ID, name: state.offer.primaryName, checked: true, locked: false, disabled: false }",
        'the programme is the first row',
    ),
    (
        'the programme can be taken off the grid',
        "    throw new Error('multiview: the programme cannot be taken off the grid (ADR 0067): it carries' +",
        "    return state; // eslint-disable-line\n    throw new Error('multiview: the programme cannot be taken off the grid (ADR 0067): it carries' +",
        'the programme is the first row',
    ),
    (
        'a full grid does not disable the rows that are down',
        'const full = state.raised.length + 1 >= MAX_BOXES;',
        'const full = false;',
        'with the grid full',
    ),
    (
        'the composition is rebuilt on every frame',
        'if (cached && cached.state === state && cached.source === experience) return cached.experience;',
        '',
        'the same object',
    ),
    (
        'a view loses its MIME on the way into the box',
        '{ id: view.id, uri: view.uri, type: view.mediaType, viewport: viewports[i + 1], zDepth: i + 1 },',
        '{ id: view.id, uri: view.uri, viewport: viewports[i + 1], zDepth: i + 1 },',
        'uri and its MIME',
    ),
    (
        'lowering the enlarged view leaves the enlargement pointing at it',
        'const enlarged = state.enlarged === id || !raised.length ? null : state.enlarged;',
        'const enlarged = !raised.length ? null : state.enlarged;',
        'lowering the box that is enlarged',
    ),
    (
        'the boxes come out in the order of the catalogue and not of the selection',
        '...state.raised.map((id, i) => {',
        '...[...state.raised].sort().map((id, i) => {',
        'in the order the views were raised',
    ),
]

fallos = []
for titulo, antes, despues, patron in MUTACIONES:
    if ORIGINAL.count(antes) != 1:
        print(f'!! {titulo}: the text to break appears {ORIGINAL.count(antes)} times, not once')
        fallos.append(titulo)
        continue
    LIB.write_text(ORIGINAL.replace(antes, despues))
    proc = subprocess.run(
        ['node', '--test', '--test-name-pattern', patron, 'test/multiview-state.test.js'],
        cwd=ARBOL, capture_output=True, text=True)
    salida = proc.stdout + proc.stderr
    corridos = [l for l in salida.splitlines() if l.startswith('# pass') or l.startswith('ℹ pass')]
    paso = proc.returncode == 0
    npass = next((l for l in salida.splitlines() if l.strip().startswith('ℹ pass')), '?')
    nfail = next((l for l in salida.splitlines() if l.strip().startswith('ℹ fail')), '?')
    estado = 'GREEN -- FINDING' if paso else 'red (the rule is checked)'
    print(f'{estado:26}  {titulo}')
    print(f'{"":26}  tests named /{patron}/: {npass.strip()}, {nfail.strip()}')
    if paso:
        fallos.append(titulo)
    LIB.write_text(ORIGINAL)

print()
if fallos:
    print(f'{len(fallos)} of {len(MUTACIONES)} breaks were not caught: {fallos}')
    sys.exit(1)
print(f'all {len(MUTACIONES)} deliberate breaks were caught by the tests that cover their rule')
