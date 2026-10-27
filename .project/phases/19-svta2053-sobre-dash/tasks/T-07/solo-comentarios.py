# Are the changes of a commit range to the published files of a demo comments only?
# For every changed file: take the old and the new text, cut out every comment
# (HTML <!-- -->, CSS /* */, JS // and /* */ outside strings), and compare what is left.
import subprocess, sys, re
base, head, *demos = sys.argv[1:]
def strip_js(s):
    out=[]; i=0; n=len(s); q=None
    while i<n:
        c=s[i]
        if q:
            out.append(c)
            if c=='\\': out.append(s[i+1:i+2]); i+=2; continue
            if c==q: q=None
            i+=1; continue
        if c in '"\'`': q=c; out.append(c); i+=1; continue
        if s.startswith('//',i):
            j=s.find('\n',i); i=n if j<0 else j; continue
        if s.startswith('/*',i):
            j=s.find('*/',i+2); i=n if j<0 else j+2; continue
        out.append(c); i+=1
    return ''.join(out)
strip = {'.html': lambda s: re.sub(r'<!--.*?-->', '', s, flags=re.S),
         '.css': lambda s: re.sub(r'/\*.*?\*/', '', s, flags=re.S),
         '.js': strip_js, '.mjs': strip_js}
red=0
files=subprocess.run(['git','diff','--name-only',base,head,'--']+[f'demo/{d}' for d in demos],capture_output=True,text=True).stdout.split()
for f in files:
    ext=re.search(r'\.[a-z]+$',f).group(0)
    old=subprocess.run(['git','show',f'{base}:{f}'],capture_output=True,text=True).stdout
    new=subprocess.run(['git','show',f'{head}:{f}'],capture_output=True,text=True).stdout
    if ext not in strip: print('NOT CHECKED (no comment syntax):',f); red=1; continue
    same = strip[ext](old)==strip[ext](new)
    print(('comments only ' if same else 'CODE CHANGED  ')+f)
    red |= not same
sys.exit(red)
