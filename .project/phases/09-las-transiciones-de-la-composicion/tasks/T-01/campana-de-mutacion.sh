#!/usr/bin/env bash
# Campana de mutacion de la T-01, fase 09. Una rotura por regla, y en cada una
# corren SOLO los tests que cubren esa regla -- no la suite entera. Una rotura
# que queda verde es un hallazgo y no un pase.
set -u
cd "$1" || exit 1
F=lib/renderer.js
cp "$F" /dev/shm/t01-mutaciones-20260910-a3f9/renderer.orig.js

restore() { cp /dev/shm/t01-mutaciones-20260910-a3f9/renderer.orig.js "$F"; }
trap restore EXIT

fallos=0
mutar() {
  local n="$1" regla="$2" patron="$3" viejo="$4" nuevo="$5"
  restore
  python3 - "$F" "$viejo" "$nuevo" <<'PY'
import sys
p, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(p, encoding='utf-8').read()
if s.count(old) != 1:
    print('MUTACION NO APLICABLE: el texto aparece %d veces' % s.count(old)); sys.exit(3)
open(p, 'w', encoding='utf-8').write(s.replace(old, new, 1))
PY
  if [ $? -ne 0 ]; then echo "M$n  $regla -- NO SE PUDO APLICAR"; fallos=$((fallos+1)); return; fi
  local out
  out=$(node --test --test-name-pattern="$patron" test/transition-schedule.test.js 2>&1)
  local pass fail
  pass=$(printf '%s' "$out" | sed -n 's/^# pass \([0-9]*\)$/\1/p')
  fail=$(printf '%s' "$out" | sed -n 's/^# fail \([0-9]*\)$/\1/p')
  [ -z "$pass" ] && pass=$(printf '%s' "$out" | grep -oP '(?<=^. pass )\d+' | head -1)
  [ -z "$fail" ] && fail=$(printf '%s' "$out" | grep -oP '(?<=^. fail )\d+' | head -1)
  if [ "${fail:-0}" -gt 0 ]; then
    echo "M$n  ROJO ($fail de $((pass+fail)) tests caidos)  --  $regla"
  else
    echo "M$n  *** VERDE -- HALLAZGO ***  ($pass tests corrieron y ninguno cayo)  --  $regla"
    fallos=$((fallos+1))
  fi
}

echo "== Campana de mutacion T-01 -- $(date -u +%Y-%m-%dT%H:%M:%SZ) =="
echo

mutar 1 "el aviso a cuadro entero NO difumina (control de R7: predicado invertido)" \
  '(a layout fade|per ad and not per break|fallback of ADR 0019)' \
  'return experience?.type !== FULL_FRAME_TYPE;' \
  'return experience?.type === FULL_FRAME_TYPE;'

mutar 2 "la etiqueta es la que escribe la capa de senalizacion" \
  'the label this file copies' \
  "export const FULL_FRAME_TYPE = 'linear';" \
  "export const FULL_FRAME_TYPE = 'lineal';"

mutar 3 "la ventana se lee desde el arranque del AVISO y no del break" \
  '(what is left of a window|does not start at zero)' \
  'return experience.startTime + experience.duration - time;' \
  'return experience.duration - time;'

mutar 4 "el lead viene en milisegundos y la ventana en segundos" \
  '(a frame inside the lead|the middle of a window)' \
  'return remainingIn(experience, time) <= leadMs / 1000;' \
  'return remainingIn(experience, time) <= leadMs;'

mutar 5 "la salida es el FINAL de la ventana y no el principio" \
  '(a frame inside the lead|before the window opens)' \
  'return remainingIn(experience, time) <= leadMs / 1000;' \
  'return remainingIn(experience, time) >= leadMs / 1000;'

mutar 6 "una experiencia ausente no revienta y cae del lado del efecto" \
  'no type at all' \
  'return experience?.type !== FULL_FRAME_TYPE;' \
  'return experience.type !== FULL_FRAME_TYPE;'

restore
echo
if [ "$fallos" -eq 0 ]; then
  echo "Las seis roturas quedaron ROJAS. El archivo esta restaurado."
else
  echo "$fallos rotura(s) no fallaron o no se aplicaron: es un hallazgo."
fi
echo "Verificacion de restauracion:"
diff -q /dev/shm/t01-mutaciones-20260910-a3f9/renderer.orig.js "$F" && echo "  renderer.js identico al original"
