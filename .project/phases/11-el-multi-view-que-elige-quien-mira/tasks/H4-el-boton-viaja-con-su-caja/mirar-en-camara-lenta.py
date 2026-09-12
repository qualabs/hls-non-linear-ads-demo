"""Fotos del gesto EN CÁMARA LENTA, para poder mirar el medio del viaje.

POR QUÉ EN CÁMARA LENTA Y NO A RELOJ. La curva del proyecto --cubic-bezier(0.22,
0.61, 0.36, 1)-- es de salida rápida: a los 40 ms de los 380 el viaje ya lleva un
tercio, y a los 120 ms, tres cuartos. Una foto pedida a reloj llega tarde, porque
sacarla cuesta más que eso. Así que se baja el `playbackRate` de TODAS las
animaciones del navegador por CDP --que es una perilla del navegador y no un
cambio en el código-- y el viaje de 380 ms pasa a durar 3800. Las fotos se piden
a décimas de segundo y caen donde se las pide.

Uso: python mirar-en-camara-lenta.py <url> <prefijo>
"""
import sys
import time

from playwright.sync_api import sync_playwright

VISTAS = ['view-caminandes-a', 'view-caminandes-b', 'view-ed-a']
NOMBRES = {'view-caminandes-a': 'Caminandes, early', 'view-caminandes-b': 'Caminandes, late',
           'view-ed-a': 'Elephants Dream, early'}
LENTO = 0.1
# En milisegundos del gesto, no del reloj: lo que se ve dividido por LENTO.
TIEMPOS = [10, 25, 45, 70, 150]


def cromo(pagina):
    caja = pagina.locator('#player').bounding_box()
    pagina.mouse.move(caja['x'] + caja['width'] / 2, caja['y'] + caja['height'] / 2)
    pagina.wait_for_timeout(150)


def serie(pagina, cdp, apretar, prefijo, etiqueta):
    caja = pagina.locator('#player').bounding_box()
    recorte = {'x': caja['x'], 'y': caja['y'], 'width': caja['width'], 'height': caja['height']}
    cdp.send('Animation.setPlaybackRate', {'playbackRate': LENTO})
    t0 = time.monotonic()
    apretar()
    for ms in TIEMPOS:
        falta = (ms / LENTO) / 1000 - (time.monotonic() - t0)
        if falta > 0:
            pagina.wait_for_timeout(falta * 1000)
        pagina.screenshot(path=f'{prefijo}-{etiqueta}-{ms:03d}ms.png', clip=recorte)
    cdp.send('Animation.setPlaybackRate', {'playbackRate': 1})
    print(f'{etiqueta}: {len(TIEMPOS)} fotos', flush=True)


def main():
    url, prefijo = sys.argv[1], sys.argv[2]
    with sync_playwright() as p:
        nav = p.chromium.launch(channel='chrome', headless=True,
                                args=['--autoplay-policy=no-user-gesture-required',
                                      '--mute-audio'])
        ctx = nav.new_context(viewport={'width': 1600, 'height': 1000})
        pagina = ctx.new_page()
        cdp = ctx.new_cdp_session(pagina)
        cdp.send('Animation.enable')
        try:
            pagina.goto(url, wait_until='load')
            pagina.wait_for_function('document.getElementById("video").videoWidth > 0',
                                     timeout=30000)
            pagina.wait_for_function(
                'document.getElementById("video").currentTime > 46', timeout=180000)
            cromo(pagina)
            pagina.locator('.qa-btn--views').click()
            for v in VISTAS:
                pagina.locator(f'.qa-views__row:has-text("{NOMBRES[v]}")').first.click()
                pagina.wait_for_timeout(600)
            pagina.locator('.qa-btn--views').click()
            pagina.wait_for_timeout(800)
            cromo(pagina)
            caja = pagina.locator('#player').bounding_box()
            pagina.screenshot(path=f'{prefijo}-0-grilla-de-cuatro.png',
                              clip={'x': caja['x'], 'y': caja['y'],
                                    'width': caja['width'], 'height': caja['height']})
            cromo(pagina)
            serie(pagina, cdp, pagina.locator(
                f'.qa-box__btn[aria-label^="{NOMBRES["view-caminandes-a"]}: to the whole"]'
            ).click, prefijo, 'agrandar')
            pagina.wait_for_timeout(900)
            cromo(pagina)
            serie(pagina, cdp, pagina.locator(
                f'.qa-box__btn[aria-label^="{NOMBRES["view-caminandes-a"]}: back to the grid"]'
            ).click, prefijo, 'desagrandar')
        finally:
            nav.close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
