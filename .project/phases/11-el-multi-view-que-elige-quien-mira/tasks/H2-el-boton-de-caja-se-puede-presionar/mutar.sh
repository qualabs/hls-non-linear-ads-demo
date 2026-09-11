#!/usr/bin/env bash
# mutar.sh -- one break per rule, over the node suite of the corner, plus the
# run with nothing broken at the end. A check that was never seen failing is not
# a check: this is where each of the four tests is made to go red on purpose.
#
# It runs against a COPY of lib/ and test/ in /dev/shm and never touches the
# repository. Usage: mutar.sh WORKDIR
set -uo pipefail
W="$1"
cd "$W"

ORIG=lib/controls.js.orig
run() {
  echo ""
  echo "=============================================================="
  echo "== $1"
  echo "=============================================================="
  node --test test/box-button-corner.test.js 2>&1 | grep -E '^(✔|✖|ℹ (tests|pass|fail))'
}

mutate() {
  cp "$ORIG" lib/controls.js
  W="$W" python3 -c "
import io, os, sys
p = os.path.join(os.environ['W'], 'lib/controls.js')
s = io.open(p, encoding='utf-8').read()
old, new = sys.argv[1], sys.argv[2]
assert s.count(old) == 1, 'la mutacion no encontro su ancla'
io.open(p, 'w', encoding='utf-8').write(s.replace(old, new))
" "$2" "$3"
}

cp "$ORIG" lib/controls.js
run "M0 -- sin mutar: el control"

mutate m1 \
  "export function boxButtonCorner(box, taken, button) {
  let best" \
  "export function boxButtonCorner(box, taken, button) {
  return BOX_CORNERS[0];
  let best"
run "M1 -- la regla de la T-09: siempre la esquina de arriba a la izquierda"

mutate m2 \
  "export function boxButtonCorner(box, taken, button) {
  let best" \
  "export function boxButtonCorner(box, taken, button) {
  return 'se';
  let best"
run "M2 -- siempre la de abajo a la derecha"

mutate m3 \
  "export const BOX_CORNERS = ['nw', 'ne', 'sw', 'se'];" \
  "export const BOX_CORNERS = ['se', 'sw', 'ne', 'nw'];"
run "M3 -- el orden de preferencia dado vuelta"

cp "$ORIG" lib/controls.js
run "M4 -- sin mutar otra vez, para que el verde del final sea del codigo y no del cansancio"
