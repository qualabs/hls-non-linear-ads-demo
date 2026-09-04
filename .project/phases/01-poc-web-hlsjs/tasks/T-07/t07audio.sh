#!/usr/bin/env bash
# The audio control of ADR 0010, measured on the machine's own output.
set -euo pipefail
D=/dev/shm/t07-20260904T114155Z-23702
SK=/home/nicolas/.claude/skills/playwright
MON="$(pactl get-default-sink).monitor"
OUTJSON=$D/t07-audio-en-la-salida.json

step() { (cd "$SK" && python3 scripts/run.py "$D/t07step.py" "$1" | tail -1); }

level() { # $1 label
  local raw=$D/lvl.raw
  timeout 2 parec --format=s16le --rate=16000 --channels=1 -d "$MON" --raw > "$raw" || true
  python3 - "$raw" "$1" <<'PY'
import sys, array, math, json, subprocess
raw, label = sys.argv[1], sys.argv[2]
data = open(raw, 'rb').read()
a = array.array('h'); a.frombytes(data[:len(data)//2*2])
rms = math.sqrt(sum(x*x for x in a)/len(a))/32768 if len(a) else None
peak = max(abs(x) for x in a)/32768 if len(a) else None
inputs = subprocess.run(['pactl','list','sink-inputs'],capture_output=True,text=True).stdout
streams = [l.strip() for l in inputs.splitlines() if l.strip().startswith(('Sink Input #','Mute:','application.name =','media.name ='))]
print(json.dumps({'label': label, 'samples': len(a), 'rms': None if rms is None else round(rms,6),
                  'peak': None if peak is None else round(peak,6), 'sinkInputs': streams}))
PY
}

echo "{" > "$OUTJSON"
echo "  \"monitor\": \"$MON\"," >> "$OUTJSON"
echo "  \"pasos\": [" >> "$OUTJSON"

record() { # $1 label
  step rewind > /dev/null
  local st lv
  st=$(step state)
  lv=$(level "$1")
  echo "    {\"estado\": $st, \"salida\": $lv}," >> "$OUTJSON"
  echo "== $1"; echo "   estado: $st"; echo "   salida: $lv"
}

step prepare > /dev/null
record 1-los-dos-en-silencio
step click > /dev/null
record 2-audio-del-aviso-encendido
step unmute-primary > /dev/null
record 3-los-dos-suenan
step click > /dev/null
record 4-el-aviso-en-silencio-otra-vez
step mute-primary > /dev/null

# trailing comma out, and close
python3 - "$OUTJSON" <<'PY'
import sys, json, re
p = sys.argv[1]
s = open(p).read().rstrip().rstrip(',')
s += "\n  ]\n}\n"
json.loads(s)
open(p,'w').write(s)
print("WROTE", p)
PY
