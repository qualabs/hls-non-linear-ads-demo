"""El identifier del Slot llega a los eventos de tracking: dist/ real, playlist y listas reales.

Una página arnés (servida por page.route, sin tocar la demo) carga /vendor/hls.min.js y
/dist/qualabs-concurrent-hls.js, hace attach con onTracking y reproduce el manifest
concurrente de stage-pair a través de A (20-32 s) y B (65-77 s).

Lo esperado NO sale del código bajo prueba: sale del JSON que el servidor devolvió para
cada asset-list (leído de la respuesta de red). Control: --sin-ids reescribe las respuestas
sin `identifiers`, y los eventos tienen que llegar vacíos.
"""
import json, sys, time
from playwright.sync_api import sync_playwright
base, modo = sys.argv[1], sys.argv[2]   # modo: 2dec | 1dec-noimg
sin_ids = '--sin-ids' in sys.argv
caps = {'2dec': '{videoDecoders: 2, imageOverVideo: true}', '1dec-noimg': '{videoDecoders: 1, imageOverVideo: false}'}[modo]
HTML = f"""<!doctype html><meta charset=utf-8><body style="margin:0;background:#000">
<div id=c style="position:relative;width:960px;height:540px;overflow:hidden"><video id=v muted playsinline style="width:100%;height:100%"></video></div>
<script src="/vendor/hls.min.js"></script><script src="/dist/qualabs-concurrent-hls.js"></script>
<script>
window.eventos = [];
const hls = new Hls({{ ...QualabsConcurrentHls.hlsConfig }});
window.h = QualabsConcurrentHls.attach(hls, {{ container: document.getElementById('c'), capabilities: {caps},
  onTracking: (e) => {{ window.eventos.push(e); console.log('[tracking] ' + e.type + ' ' + e.itemId + ' ' + JSON.stringify(e.identifiers)); }} }});
hls.loadSource('/content/primary/con-daterange-concurrente.m3u8'); hls.attachMedia(document.getElementById('v'));
document.getElementById('v').play().catch(()=>{{}});
</script>"""
servido = {}
with sync_playwright() as pw:
    nav = pw.chromium.launch(channel='chrome', args=['--autoplay-policy=no-user-gesture-required', '--mute-audio'])
    p = nav.new_page(viewport={'width': 960, 'height': 540})
    p.route(base + '/arnes.html', lambda r: r.fulfill(status=200, content_type='text/html', body=HTML))
    def lista(route):
        resp = route.fetch(); j = resp.json()
        if sin_ids:
            for a in j['ASSETS']:
                for it in (a.get('X-AD-CREATIVE-SIGNALING') or {}).get('payload') or []: it.pop('identifiers', None)
        brk = route.request.url.split('asset-list-break-')[1][0]
        servido[brk] = [i for a in j['ASSETS'] for it in (a.get('X-AD-CREATIVE-SIGNALING') or {}).get('payload') or [] for i in it.get('identifiers', [])]
        route.fulfill(response=resp, json=j)
    p.route('**/signalling/asset-list-break-*', lista)
    p.on('console', lambda m: m.text.startswith('[tracking]') and print('   console:', m.text))
    p.goto(base + '/arnes.html')
    p.wait_for_function('document.getElementById("v").readyState >= 2', timeout=30000)
    for desde, hasta in ((16, 34), (61, 79)):
        p.evaluate(f'() => {{ document.getElementById("v").currentTime = {desde}; }}')
        p.wait_for_function(f'document.getElementById("v").currentTime > {hasta}', timeout=60000, polling=250)
    eventos = p.evaluate('() => window.eventos')
    nav.close()
rojo = 0
print(f'== modo {modo}{" (CONTROL: listas servidas sin identifiers)" if sin_ids else ""}')
print('   identifiers servidos por lista:', json.dumps(servido))
for e in eventos:
    brk = e['id'].split('-')[1].lower()
    ok = e['identifiers'] == servido.get(brk)
    rojo += 0 if ok else 1
    print(f"   {'ok  ' if ok else 'ROJO'} {e['type']:<9} t={e['time']:6.2f} {e['itemId']:<20} {e['experienceType']:<20} identifiers={json.dumps(e['identifiers'])}")
tipos = [(e['type'], e['id']) for e in eventos]
esperados = {'2dec': [('slotStart', 'AD-A-CONCURRENT'), ('slotEnd', 'AD-A-CONCURRENT'), ('slotStart', 'AD-B-CONCURRENT'), ('slotEnd', 'AD-B-CONCURRENT')],
             '1dec-noimg': [('slotStart', 'AD-B-CONCURRENT'), ('slotEnd', 'AD-B-CONCURRENT')]}[modo]
ok = tipos == esperados
rojo += 0 if ok else 1
print(f"   {'ok  ' if ok else 'ROJO'} secuencia {tipos}" + ('' if ok else f'  esperada {esperados}'))
vacios = all(e['identifiers'] == [] for e in eventos)
print('   todos los eventos sin identifiers:', vacios)
print('VERDE' if rojo == 0 else f'ROJO ({rojo})')
