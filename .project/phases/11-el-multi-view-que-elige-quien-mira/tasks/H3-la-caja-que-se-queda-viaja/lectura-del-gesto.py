"""La lectura DURANTE el gesto: la caja de cada elemento del multi view, cuadro a cuadro.

QUÉ MIDE Y POR QUÉ ASÍ. Una lectura antes del gesto y otra después da lo mismo con
transición y sin ella: las dos leen la caja quieta. Lo único que las distingue es
lo que pasa en el medio, así que esto instala un muestreador en
`requestAnimationFrame` que anota la caja pintada --`getBoundingClientRect`, que
es la que el transform mueve-- en cada cuadro de los 700 ms siguientes al click.

CONTRA QUÉ SE LEE. Contra el contenido primario, que ya se movía antes de esta
tarea: es la misma lectura, en el mismo gesto, sobre el elemento cuyo movimiento
ya estaba aprobado. Un número solo no dice nada.

Uso:  python lectura-del-gesto.py <url> <salida.json> [--headful]
"""
import json
import sys
import time

from playwright.sync_api import sync_playwright

VISTAS = ['view-caminandes-a', 'view-caminandes-b', 'view-ed-a']
NOMBRES = {'view-caminandes-a': 'Caminandes, early', 'view-caminandes-b': 'Caminandes, late',
           'view-ed-a': 'Elephants Dream, early'}
PRIMARIO = 'Tears of Steel'
MS = 700

MUESTREADOR = """
([sel, ms]) => {
  const player = document.getElementById('player');
  const pr = player.getBoundingClientRect();
  const t0 = performance.now();
  window.__muestras = [];
  window.__listo = false;
  const caja = (s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [+(r.left - pr.left).toFixed(1), +(r.top - pr.top).toFixed(1),
            +r.width.toFixed(1), +r.height.toFixed(1)];
  };
  const paso = () => {
    const t = performance.now() - t0;
    const fila = { ms: +t.toFixed(1), cajas: {} };
    for (const [nombre, s] of Object.entries(sel)) fila.cajas[nombre] = caja(s);
    window.__muestras.push(fila);
    if (t < ms) requestAnimationFrame(paso); else window.__listo = true;
  };
  requestAnimationFrame(paso);
}
"""


def selectores():
    s = {'primario': '#video'}
    for v in VISTAS:
        s[v] = f'.ad[data-element-id="{v}"]'
    return s


def mostrar_cromo(pagina):
    """El cromo se esconde solo; un movimiento del puntero sobre el reproductor lo trae."""
    caja = pagina.locator('#player').bounding_box()
    pagina.mouse.move(caja['x'] + caja['width'] / 2, caja['y'] + caja['height'] / 2)
    pagina.wait_for_timeout(150)


def muestrear(pagina, apretar, nombre, boton):
    """Instala el muestreador, aprieta lo que sea, y devuelve los cuadros."""
    pagina.evaluate(MUESTREADOR, [selectores(), MS])
    apretar()
    pagina.wait_for_function('window.__listo === true', timeout=10000)
    return {'gesto': nombre, 'boton': boton, 'cuadros': pagina.evaluate('window.__muestras')}


def gesto(pagina, etiqueta_boton, nombre):
    """El botón de una caja: agrandar o volver a la grilla."""
    mostrar_cromo(pagina)
    boton = pagina.locator(f'.qa-box__btn[aria-label^="{etiqueta_boton}"]')
    boton.wait_for(state='visible', timeout=10000)
    return muestrear(pagina, boton.click, nombre, etiqueta_boton)


def subir(pagina, vista, nombre):
    """Una fila del selector: sube una cámara y la grilla se re-compone alrededor."""
    mostrar_cromo(pagina)
    pagina.locator('.qa-btn--views').click()
    fila = pagina.locator(f'.qa-views__row:has-text("{NOMBRES[vista]}")').first
    fila.wait_for(state='visible', timeout=10000)
    salida = muestrear(pagina, fila.click, nombre, NOMBRES[vista])
    pagina.locator('.qa-btn--views').click()
    return salida


def main():
    url, salida = sys.argv[1], sys.argv[2]
    headful = '--headful' in sys.argv
    salidas = {'url': url, 'tomada': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
               'ms': MS, 'gestos': []}
    with sync_playwright() as p:
        navegador = p.chromium.launch(
            channel='chrome', headless=not headful,
            args=['--autoplay-policy=no-user-gesture-required', '--mute-audio'])
        salidas['navegador'] = f'Chrome {navegador.version}'
        ctx = navegador.new_context(viewport={'width': 1600, 'height': 1000})
        pagina = ctx.new_page()
        errores = []
        pagina.on('console', lambda m: errores.append(m.text[:200])
                  if m.type in ('error', 'warning') else None)
        try:
            pagina.goto(url, wait_until='load')
            pagina.wait_for_function('document.getElementById("video").videoWidth > 0',
                                     timeout=30000)
            salidas['contexto'] = pagina.evaluate("""() => {
              const r = document.getElementById('player').getBoundingClientRect();
              const v = document.getElementById('video');
              return { contenedor: [Math.round(r.width), Math.round(r.height)],
                       video: [v.videoWidth, v.videoHeight],
                       hls: window.Hls ? window.Hls.version : null };
            }""")
            # La oferta de tres vistas va de t=45s a t=105s.
            print('esperando la ventana de la oferta (t=48s)...', flush=True)
            pagina.wait_for_function(
                'document.getElementById("video").currentTime > 48', timeout=180000)
            print('ventana abierta', flush=True)

            # Subir dos cámaras: la grilla queda en tres cajas y hay algo que se mueva.
            mostrar_cromo(pagina)
            pagina.locator('.qa-btn--views').click()
            for v in VISTAS[:2]:
                pagina.locator(f'.qa-views__row:has-text("{NOMBRES[v]}")').first.click()
                pagina.wait_for_timeout(600)
            pagina.locator('.qa-btn--views').click()
            pagina.wait_for_timeout(600)
            salidas['grilla'] = pagina.evaluate(
                '(sel) => Object.fromEntries(Object.entries(sel).map(([n, s]) => {'
                ' const el = document.querySelector(s); if (!el) return [n, null];'
                ' const r = el.getBoundingClientRect();'
                ' const p = document.getElementById("player").getBoundingClientRect();'
                ' return [n, [Math.round(r.left - p.left), Math.round(r.top - p.top),'
                ' Math.round(r.width), Math.round(r.height)]]; }))', selectores())

            # EL GESTO QUE SE PIDIÓ, y su referencia, en este orden: agrandar una
            # vista, volver a la grilla, agrandar el primario, volver.
            salidas['gestos'].append(gesto(
                pagina, f'{NOMBRES["view-caminandes-a"]}: to the whole picture',
                'agrandar una vista'))
            pagina.wait_for_timeout(900)
            salidas['gestos'].append(gesto(
                pagina, f'{NOMBRES["view-caminandes-a"]}: back to the grid',
                'desagrandar una vista'))
            pagina.wait_for_timeout(900)
            salidas['gestos'].append(gesto(
                pagina, f'{PRIMARIO}: to the whole picture',
                'agrandar el primario (la referencia)'))
            pagina.wait_for_timeout(900)
            salidas['gestos'].append(gesto(
                pagina, f'{PRIMARIO}: back to the grid',
                'desagrandar el primario (la referencia)'))
            pagina.wait_for_timeout(900)
            # La otra cara de lo mismo: una caja que se queda y cambia de lugar
            # porque subió otra. La que sube --view-ed-a-- es nueva y NO tiene
            # que viajar de ningún lado: aparece en su caja.
            salidas['gestos'].append(subir(
                pagina, 'view-ed-a', 'subir una tercera cámara'))
            pagina.wait_for_timeout(900)
            # UNA FOTO EN EL MEDIO DEL VIAJE, que es lo único que una serie de
            # cajas no dice: dónde está el botón del cromo mientras la caja
            # todavía está viajando.
            if len(sys.argv) > 3 and sys.argv[3].endswith('.png'):
                mostrar_cromo(pagina)
                pagina.locator(
                    f'.qa-box__btn[aria-label^="{NOMBRES["view-caminandes-a"]}: to the whole"]'
                ).click()
                pagina.wait_for_timeout(150)
                pagina.screenshot(path=sys.argv[3])
                print(f'foto a ~150 ms del click en {sys.argv[3]}', flush=True)
        finally:
            navegador.close()
    salidas['avisos'] = sorted(set(errores))
    with open(salida, 'w', encoding='utf-8') as f:
        json.dump(salidas, f, indent=1)
    print(f'{len(salidas["gestos"])} gestos escritos en {salida}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
