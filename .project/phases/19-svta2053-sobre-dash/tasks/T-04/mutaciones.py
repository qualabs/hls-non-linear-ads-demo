import subprocess, shutil, sys
F='dash/signalling.js'
orig=open(F).read()
M=[
 ("sin presentationTimeOffset", "(event.presentationTime - (stream.presentationTimeOffset || 0)) / timescale", "(event.presentationTime) / timescale", "presentationTimeOffset of its stream"),
 ("sin recorte al fin del Period", "duration = duration == null ? room : Math.min(duration, room);", "duration = duration == null ? room : duration;", "ends at the end of its Period"),
 ("sin el flag de 0121", "if (features[CONCURRENT_FEATURE] !== true) {", "if (false) {", "without features.concurrentPresentation"),
 ("features desconocidas aceptadas", "if (unknown.length) {", "if (false) {", "a feature this reader does not implement"),
 ("slots no contiguos aceptados", "if (Math.abs(start - expected) > CONTIGUITY_TOLERANCE) {", "if (false) {", "hole or an overlap"),
 ("start del slot sin poner en 0", "payload: [{ ...item, start: 0 }]", "payload: [{ ...item }]", "one asset per slot"),
 ("pedido a 60 s exclusivo", "return time >= startTime - lead && time < end;", "return time > startTime - lead && time < end;", "60 s before the break"),
 ("break terminado se pide igual", "return time >= startTime - lead && time < end;", "return time >= startTime - lead;", "a seek into the window"),
 ("maxDuration ignorado", "const length = [duration, max]", "const length = [duration]", "the breaks of the MPD"),
 ("el lineal no gana", "return replacing.length ? replacing : active;", "return [...replacing, ...active];", "drawn alone"),
 ("cue sensible a mayúsculas", ".map((v) => String(v).trim().toUpperCase());", ".map((v) => String(v).trim());", "the cue takes the values"),
 ("ONCE no se gasta", "      if (!spent) continue;\n      state.spent = true;", "      if (true) continue;\n      state.spent = true;", "a ONCE break leaves"),
 ("post-roll sin esperar el fin", "    if (!postRollDue({ sourceClosed, bufferedToEnd })) return;", "    if (!sourceClosed) return;", "post-roll waits"),
 ("Period sin encadenar", "const start = period.start ?? previousEnd;", "const start = period.start ?? 0;", "a Period begins"),
 ("sobre remoto sin validar el tipo", "envelope.type !== 'slot' ||", "", "\\$remote.slots has to answer"),
 ("capacidades no viajan", "const url = listRequestUrl(remote, base, sendCapabilities ? declared : null);", "const url = listRequestUrl(remote, base, null);", "at load: every break"),
]
rows=[]
try:
    for name,a,b,pat in M:
        assert orig.count(a)==1, name
        open(F,'w').write(orig.replace(a,b))
        r=subprocess.run(['node','--test','--test-name-pattern',pat,'test/dash-signalling.test.js'],capture_output=True,text=True)
        out=r.stdout
        p=[l for l in out.splitlines() if l.startswith('ℹ pass')][0].split()[-1]
        f=[l for l in out.splitlines() if l.startswith('ℹ fail')][0].split()[-1]
        rows.append((name,pat,p,f,'ROJO' if int(f)>0 else 'VERDE (hallazgo)'))
finally:
    open(F,'w').write(orig)
print('| ruptura | tests corridos (patrón) | pass | fail | |\n| --- | --- | --- | --- | --- |')
for r in rows: print('| %s | `%s` | %s | %s | %s |'%r)
