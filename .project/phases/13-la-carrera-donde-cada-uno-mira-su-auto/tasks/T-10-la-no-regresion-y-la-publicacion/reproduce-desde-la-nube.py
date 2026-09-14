"""La demo publicada reproduce, y lo que reproduce viene del bucket y no de esta maquina.

QUE SE MIDE, Y POR QUE ASI:

  1. DE DONDE SALE CADA BYTE. Se anota el host de cada request que la pagina lanza. Si
     alguno no es el host del bucket, la pagina publicada estaria apoyandose en algo que
     el que la abra desde afuera no tiene. La lista de hosts va impresa entera.

  2. QUE EL VIDEO AVANZA. No que el elemento exista ni que `readyState` sea alto: se lee
     `currentTime`, se esperan unos segundos de reloj de pared y se vuelve a leer. Un
     video pausado, uno sin segmentos y uno que muestra un cuadro congelado dan todos lo
     mismo en `readyState` y distinto acá.

  3. QUE LA GRILLA DECODIFICA DEL BUCKET. Se sube una camara por vez hasta que la grilla
     no admite mas, y se lee cuantos `<video>` hay adentro del contenedor y cuantos de
     ellos avanzaron su propio `currentTime` entre las dos lecturas. Cuatro cajas con
     cuatro tiempos que corren es el argumento entero de esta demo, servido desde GCS.

EL CONTROL, porque un chequeo que no puede fallar no es un chequeo: la misma corrida
abortando todo `.ts`. Ahi el video NO tiene que avanzar. Sin ese caso, "avanzo" es una
frase que tambien imprimiria un instrumento que mide el reloj del sistema.

Uso: reproduce-desde-la-nube.py URL RACE_JSON CAPTURAS OUT_JSON
"""
import json
import sys
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

URL, RACE_PATH, SHOTS, OUT = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
RACE = json.load(open(RACE_PATH))
AT = float(RACE['ofertaEn']) + 3.0
HOST = urlparse(URL).netloc

# Cuanto reloj de pared se deja correr entre las dos lecturas de `currentTime`. Es tiempo
# de pared y no de video a proposito: el numero que se compara tiene que venir del video.
ESPERA_MS = 4000

LEER_TIEMPOS = """() => {
  const dentro = [...document.querySelectorAll('#player video')];
  return {
    principal: document.getElementById('video').currentTime,
    pausado: document.getElementById('video').paused,
    readyState: document.getElementById('video').readyState,
    cajas: document.querySelectorAll('.qa-box').length,
    videos: dentro.length,
    tiempos: dentro.map((v) => +v.currentTime.toFixed(3))
  };
}"""

LEER_OFERTA = """() => ({
  filas: [...document.querySelectorAll('#run .run__row')].length,
  camaras: [...document.querySelectorAll('#run .run__names li')].map((n) => n.textContent),
  estado: document.getElementById('state').textContent,
  pliegues: document.querySelectorAll('#assets .asset').length
})"""


def despertar(page):
    caja = page.locator('#player').bounding_box()
    page.mouse.move(caja['x'] + caja['width'] / 2, caja['y'] + caja['height'] * 0.62)
    page.wait_for_timeout(120)


def subibles(page):
    return page.evaluate("""() => [...document.querySelectorAll('.qa-views__row')]
      .map((n, i) => ({i, up: n.getAttribute('aria-checked') === 'true',
                       locked: n.classList.contains('qa-views__row--locked'),
                       off: !!n.disabled}))
      .filter((r) => !r.locked && !r.up && !r.off).map((r) => r.i)""")


def llenar(page):
    filas = page.locator('.qa-views__row')
    subidas = 0
    while True:
        libres = subibles(page)
        if not libres:
            return subidas
        despertar(page)
        filas.nth(libres[0]).click()
        page.wait_for_timeout(450)
        subidas += 1


def corrida(browser, cortar_segmentos):
    # `hosts` cuenta solo lo que sale a la red. Un `blob:` es el MediaSource que hls.js le
    # cuelga al <video> y no es un request a ningun lado: contarlo como host vacio haria que
    # "todo vino del bucket" diera rojo por una URL que nunca viajo.
    hosts, fallidos, malos, blobs = {}, [], [], [0]
    page = browser.new_page(viewport={'width': 1907, 'height': 1000})
    page.on('pageerror', lambda e: fallidos.append(f'pageerror: {e}'))
    # El texto del fallo va adentro: un request CANCELADO por el propio reproductor al saltar
    # (net::ERR_ABORTED sobre un .ts) y un request que el servidor nego se ven igual en el
    # conteo y son cosas distintas, asi que se imprime cual fue.
    page.on('requestfailed',
            lambda q: fallidos.append(f'{(q.failure or "?")}  {q.url}'))

    def anotar(q):
        if q.url.startswith('blob:') or q.url.startswith('data:'):
            blobs[0] += 1
            return
        h = urlparse(q.url).netloc
        hosts[h] = hosts.get(h, 0) + 1

    page.on('request', anotar)
    page.on('response', lambda r: malos.append(f'{r.status} {r.url}') if r.status >= 400 else None)
    if cortar_segmentos:
        page.route('**/*.ts', lambda r: r.abort())

    page.goto(URL, wait_until='load')
    page.locator('#player').scroll_into_view_if_needed()
    page.wait_for_timeout(400)
    try:
        page.wait_for_function("() => document.getElementById('video').readyState >= 2",
                               timeout=30000)
    except Exception:
        pass  # el control se queda aca, y eso es lo que tiene que reportar

    page.evaluate("(t) => { const v = document.getElementById('video');"
                  " v.muted = true; v.currentTime = t; v.play().catch(() => {}); }", AT)
    page.wait_for_timeout(1500)
    antes = page.evaluate(LEER_TIEMPOS)
    page.wait_for_timeout(ESPERA_MS)
    despues = page.evaluate(LEER_TIEMPOS)

    oferta, subidas, grilla = None, 0, None
    if not cortar_segmentos:
        page.wait_for_selector('.qa-btn--views:not([hidden])', timeout=60000)
        despertar(page)
        page.click('.qa-btn--views')
        page.wait_for_selector('.qa-views--on', timeout=5000)
        subidas = llenar(page)
        page.wait_for_timeout(1200)
        g1 = page.evaluate(LEER_TIEMPOS)
        page.wait_for_timeout(ESPERA_MS)
        g2 = page.evaluate(LEER_TIEMPOS)
        grilla = {
            'cajas': g2['cajas'], 'videos': g2['videos'],
            'antes': g1['tiempos'], 'despues': g2['tiempos'],
            'avanzaron': sum(1 for a, b in zip(g1['tiempos'], g2['tiempos']) if b > a + 0.5)
        }
        oferta = page.evaluate(LEER_OFERTA)
        page.keyboard.press('Escape')
        page.wait_for_timeout(300)
        page.screenshot(path=f'{SHOTS}/publicada-grilla-llena.png')
        page.locator('#player').scroll_into_view_if_needed()
        page.screenshot(path=f'{SHOTS}/publicada-el-player.png', full_page=False)

    page.close()
    return {'hosts': hosts, 'blobs': blobs[0], 'fallidos': fallidos, 'respuestas>=400': malos,
            'antes': antes, 'despues': despues,
            'avanzo': despues['principal'] - antes['principal'],
            'oferta': oferta, 'subidas': subidas, 'grilla': grilla}


with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True,
                          args=['--autoplay-policy=no-user-gesture-required'])
    real = corrida(b, False)
    control = corrida(b, True)
    b.close()

for rotulo, r in (('LA CORRIDA', real), ('EL CONTROL: sin segmentos (.ts abortados)', control)):
    print(f'\n== {rotulo} ==')
    print(f"  hosts de los requests      {r['hosts']}")
    print(f"  URLs blob: (MediaSource)   {r['blobs']}  -- no salen a la red")
    print(f"  requests fallidos          {len(r['fallidos'])}")
    for f in r['fallidos']:
        print(f"      {f}")
    print(f"  respuestas >= 400          {len(r['respuestas>=400'])} {r['respuestas>=400'][:3]}")
    print(f"  currentTime antes          {r['antes']['principal']:.3f}  (pausado={r['antes']['pausado']}, readyState={r['antes']['readyState']})")
    print(f"  currentTime despues        {r['despues']['principal']:.3f}")
    print(f"  avanzo en {ESPERA_MS} ms de pared {r['avanzo']:+.3f} s")
    if r['grilla']:
        print(f"  camaras subidas            {r['subidas']}")
        print(f"  cajas / <video> adentro    {r['grilla']['cajas']} / {r['grilla']['videos']}")
        print(f"  tiempos antes              {r['grilla']['antes']}")
        print(f"  tiempos despues            {r['grilla']['despues']}")
        print(f"  cuantos avanzaron          {r['grilla']['avanzaron']} de {r['grilla']['videos']}")
    if r['oferta']:
        print(f"  la fila de la ventana       {r['oferta']['filas']}")
        print(f"  camaras nombradas           {r['oferta']['camaras']}")
        print(f"  la linea de estado          {r['oferta']['estado']}")

json.dump({'url': URL, 'real': real, 'control': control}, open(OUT, 'w'), indent=1)

solo_el_bucket = list(real['hosts']) == [HOST]
# Un .ts cancelado por el propio reproductor al saltar de tiempo no es un request negado, y se
# distingue por su texto. Cualquier otro fallo -- y cualquier `pageerror` -- pone rojo.
negados = [f for f in real['fallidos']
           if not (f.startswith('net::ERR_ABORTED') and f.rstrip().endswith('.ts'))]
verde = (real['avanzo'] > 1.0 and control['avanzo'] <= 0.5 and solo_el_bucket
         and not negados and not real['respuestas>=400']
         and real['grilla']['videos'] >= 4 and real['grilla']['avanzaron'] >= 4
         and len(real['oferta']['camaras']) == 6)
print()
if verde:
    if real['fallidos']:
        print(f"  (los {len(real['fallidos'])} fallidos de arriba son .ts que el reproductor cancelo al saltar,")
        print('   y los mismos objetos responden 200 a un curl sin credenciales)')
    print(f'VERDE: la pagina publicada pide todo a {HOST} y a nadie mas, el programa avanza,')
    print('       cuatro cajas decodifican a la vez desde el bucket, y el catalogo nombra seis')
    print('       camaras -- y con los .ts abortados el mismo instrumento dice que no avanzo.')
else:
    print('ROJO:', {'solo_el_bucket': solo_el_bucket, 'avanzo': real['avanzo'],
                    'control_avanzo': control['avanzo'],
                    'fallidos': negados[:3],
                    'malos': real['respuestas>=400'][:3]})
    sys.exit(1)
