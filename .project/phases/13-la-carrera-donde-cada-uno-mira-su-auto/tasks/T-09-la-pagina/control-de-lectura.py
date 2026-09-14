"""El control de las dos secciones: lo que dibujan sale de la red y no del markup.

Una seccion que 'se llena sola del contrato' y una seccion con el catalogo tipeado adentro se
ven IGUAL mientras la red anda. Se separan cortando la red: si el asset-list no se puede leer,
lo escrito a mano sigue ahi y lo leido desaparece. Esta es la corrida con y la corrida sin.
"""
import json, sys
from playwright.sync_api import sync_playwright

URL, ALJSON = sys.argv[1], sys.argv[2]
AT = float(json.load(open(sys.argv[3]))['ofertaEn']) + 3.0

READ = """() => ({
  filas: [...document.querySelectorAll('#run .run__row')].length,
  camaras: [...document.querySelectorAll('#run .run__names li')].map(n => n.textContent),
  copia: document.querySelector('#run .run__what p')?.textContent.slice(0, 48) ?? '(sin fila)',
  tags: document.querySelectorAll('#tags .tag').length,
  pliegues: document.querySelectorAll('#assets .asset').length,
  niveles: document.querySelectorAll('#payload .payload__level').length,
  estado: document.getElementById('state').textContent
})"""

def corrida(browser, cortar):
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    if cortar:
        page.route('**/signalling/asset-list-*.json', lambda r: r.abort())
    page.goto(URL, wait_until='load')
    page.locator('#player').scroll_into_view_if_needed()
    page.wait_for_function("() => document.getElementById('video').readyState >= 2", timeout=60000)
    page.evaluate("(t) => { const v = document.getElementById('video');"
                  " v.muted = true; v.currentTime = t; v.play().catch(() => {}); }", AT)
    page.wait_for_function("(t) => document.getElementById('video').currentTime > t",
                           arg=AT + 1.0, timeout=60000)
    page.wait_for_timeout(2500)
    out = page.evaluate(READ)
    page.close()
    return out

with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True,
                          args=['--autoplay-policy=no-user-gesture-required'])
    con = corrida(b, False)
    sin = corrida(b, True)
    b.close()

for rotulo, r in (('CON el asset-list', con), ('SIN el asset-list (abortado)', sin)):
    print(f'\n== {rotulo} ==')
    for k, v in r.items():
        print(f'  {k:<9} {v}')

verde = (con['filas'] == 1 and con['camaras'] and con['pliegues'] == 1 and con['niveles'] == 4
         and sin['filas'] == 0 and sin['camaras'] == [] and sin['niveles'] == 0)
print('\nVERDE: con la red las dos secciones se llenan, y sin ella quedan vacias -- o sea que lo'
      ' que muestran lo leyeron' if verde else '\nROJO: el control no separo las dos corridas')
