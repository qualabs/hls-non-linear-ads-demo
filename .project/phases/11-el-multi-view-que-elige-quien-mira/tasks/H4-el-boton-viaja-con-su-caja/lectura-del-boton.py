"""La lectura DURANTE el gesto: dónde está el botón del cromo contra dónde está su caja, cuadro a cuadro.

DE DÓNDE SALE. Es el muestreador de la H3 --`lectura-del-gesto.py`, en la carpeta
de al lado-- con una columna más. Aquél leía la caja de cada elemento del multi
view en cada cuadro de los 700 ms que siguen a un click; éste lee además la caja
del BOTÓN que el cromo dibuja sobre esa misma caja, en el mismo cuadro y en las
mismas coordenadas.

QUÉ MIDE Y POR QUÉ ASÍ. Una lectura antes del gesto y otra después da lo mismo
con el arreglo y sin él: las dos leen el botón quieto sobre su caja quieta. Lo
único que las distingue es el medio, y en el medio la caja está viajando: lo que
se compara es el rectángulo del botón contra el rectángulo de SU caja EN EL MISMO
CUADRO. La cuenta es una sola, `fuera`: cuántos píxeles del botón caen afuera de
su caja. Un botón que viaja con la suya da 0 en todos los cuadros; un botón que
se teletransporta al destino mientras la imagen todavía sale del origen da
centenares, y los da justo en los cuadros del medio.

CONTRA QUÉ SE LEE, y son dos referencias y no una:

  1. **Adentro de la misma corrida**, el gesto de subir una tercera cámara deja
     cuatro cajas con botón de las cuales UNA viaja y tres se quedan. Las tres
     quietas son la referencia: si `fuera` diera distinto de 0 también en ellas,
     lo que está mal es esta cuenta y no el cromo.
  2. **Contra el árbol sin el arreglo**, que es la referencia que hace que esto
     sea una medición y no una afirmación: la misma corrida, en el mismo
     navegador, sobre una librería construida del `lib/` de antes.

Uso:  python lectura-del-boton.py <url> <salida.json> [foto.png] [--headful]
"""
import json
import sys
import time

from playwright.sync_api import sync_playwright

VISTAS = ['view-caminandes-a', 'view-caminandes-b', 'view-ed-a']
NOMBRES = {'view-caminandes-a': 'Caminandes, early', 'view-caminandes-b': 'Caminandes, late',
           'view-ed-a': 'Elephants Dream, early'}
PRIMARIO = 'Tears of Steel'
NOMBRE_DE = dict({'primario': PRIMARIO}, **NOMBRES)
MS = 700

# El muestreador. Por cuadro anota, para cada elemento, la caja de su imagen y la
# caja de su botón, las dos en coordenadas del reproductor. El botón se busca por
# su `aria-label`, que empieza con el nombre de la caja y sobrevive al cambio de
# "to the whole picture" a "back to the grid": es la misma caja y es el mismo
# botón aunque el gesto que ofrece haya cambiado.
MUESTREADOR = """
([sel, etiquetas, ms]) => {
  const player = document.getElementById('player');
  const pr = player.getBoundingClientRect();
  const t0 = performance.now();
  window.__muestras = [];
  window.__listo = false;
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [+(r.left - pr.left).toFixed(1), +(r.top - pr.top).toFixed(1),
            +r.width.toFixed(1), +r.height.toFixed(1)];
  };
  const boton = (nombre) => {
    const pre = etiquetas[nombre] + ':';
    for (const b of document.querySelectorAll('.qa-box__btn')) {
      if ((b.getAttribute('aria-label') || '').startsWith(pre)) return rect(b);
    }
    return null;
  };
  const paso = () => {
    const t = performance.now() - t0;
    const fila = { ms: +t.toFixed(1), cajas: {}, botones: {} };
    for (const [nombre, s] of Object.entries(sel)) {
      fila.cajas[nombre] = rect(document.querySelector(s));
      fila.botones[nombre] = boton(nombre);
    }
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
    pagina.evaluate(MUESTREADOR, [selectores(), NOMBRE_DE, MS])
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
    foto = next((a for a in sys.argv[3:] if a.endswith('.png')), None)
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

            # LOS CUATRO GESTOS QUE MUEVEN UNA CAJA CON BOTÓN, en este orden:
            # agrandar una vista, volver a la grilla, agrandar el primario, volver,
            # y subir una tercera cámara, que es el que deja tres cajas quietas al
            # lado de la que viaja.
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
                'agrandar el primario'))
            pagina.wait_for_timeout(900)
            salidas['gestos'].append(gesto(
                pagina, f'{PRIMARIO}: back to the grid',
                'desagrandar el primario'))
            pagina.wait_for_timeout(900)
            salidas['gestos'].append(subir(
                pagina, 'view-ed-a', 'subir una tercera cámara'))
            pagina.wait_for_timeout(900)
            # UNA FOTO EN EL MEDIO DEL VIAJE, que es lo único que una serie de
            # números no dice: cómo se ve el botón mientras su caja va viajando.
            if foto:
                mostrar_cromo(pagina)
                pagina.locator(
                    f'.qa-box__btn[aria-label^="{NOMBRES["view-caminandes-a"]}: to the whole"]'
                ).click()
                pagina.wait_for_timeout(150)
                pagina.screenshot(path=foto)
                print(f'foto a ~150 ms del click en {foto}', flush=True)
        finally:
            navegador.close()
    salidas['avisos'] = sorted(set(errores))
    with open(salida, 'w', encoding='utf-8') as f:
        json.dump(salidas, f, indent=1)
    print(f'{len(salidas["gestos"])} gestos escritos en {salida}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
