#!/usr/bin/env bash
# La campaña de mutación de la T-10: una rotura por regla, cada una sobre la
# misma medición de las tres entradas. Se rompe, se reconstruye la librería, se
# mide, y se restaura desde la copia intacta.
set -euo pipefail
cd /dev/shm/t10-20260911-a7f3
PY=/home/nicolas/.claude/skills/playwright/.venv/bin/python

restore() {
  cp multiview.pristine.js sdk/lib/multiview.js
  cp renderer.pristine.js  sdk/lib/renderer.js
  (cd sdk && ./scripts/construir-libreria.sh >/dev/null)
}

run() {  # $1 = nombre
  (cd sdk && ./scripts/construir-libreria.sh >/dev/null)
  timeout 420 "$PY" medir-salida.py http://localhost:8087/index.html "$PWD/shots" \
    > "mut-$1.log" 2>&1 || echo "  (la corrida terminó con error: ver mut-$1.log)"
  $PY - "$1" <<'PYEOF'
import json, sys
name = sys.argv[1]
raw = open(f'/dev/shm/t10-20260911-a7f3/mut-{name}.log').read()
if '===JSON===' not in raw:
    print(f'  {name}: la corrida no llegó a imprimir lecturas'); sys.exit()
d = json.loads(raw.split('===JSON===')[1])
for k in ['A', 'B', 'C']:
    r = d.get(f'{k}_2_after')
    if not r:
        print(f'  {k}: sin lectura'); continue
    ok = r['style'] is None and r['volume'] == 1 and r['nodes'] == 0
    print(f"  {k}_after  style={'null' if r['style'] is None else 'ESCRITO'}"
          f"  volume={r['volume']}  nodes={r['nodes']}  -> {'VERDE' if ok else 'ROJO'}")
PYEOF
}

echo "== M1: el botón no llega a clear() (exit() devuelve el mismo estado) =="
restore
python3 - <<'PY'
import io
p='/dev/shm/t10-20260911-a7f3/sdk/lib/multiview.js'
s=io.open(p,encoding='utf-8').read()
old="""export function exit(state) {
  validate(state);
  return emptySelection(state.offer);
}"""
new="""export function exit(state) {
  validate(state);
  return state;
}"""
assert s.count(old)==1
io.open(p,'w',encoding='utf-8').write(s.replace(old,new))
PY
run m1

echo "== M2: clear() no devuelve el audio del primario (se saca node.volume = 1) =="
restore
python3 - <<'PY'
import io
p='/dev/shm/t10-20260911-a7f3/sdk/lib/renderer.js'
s=io.open(p,encoding='utf-8').read()
old="        node.volume = 1;\n        continue;"
new="        continue;"
assert s.count(old)==1
io.open(p,'w',encoding='utf-8').write(s.replace(old,new))
PY
run m2

echo "== M3: clear() deja el nodo en la capa (se saca node.remove()) =="
restore
python3 - <<'PY'
import io
p='/dev/shm/t10-20260911-a7f3/sdk/lib/renderer.js'
s=io.open(p,encoding='utf-8').read()
old="        continue;\n      }\n      detach?.();\n      node.remove();"
new="        continue;\n      }\n      detach?.();"
assert s.count(old)==1
io.open(p,'w',encoding='utf-8').write(s.replace(old,new))
PY
run m3

echo "== restaurado y medido sin mutación (el control de la campaña) =="
restore
run sin-mutacion
