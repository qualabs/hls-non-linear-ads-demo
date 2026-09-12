"""La lectura del hallazgo 1 de la H4, vuelta a tomar: ¿el rectángulo de una caja MIDE la caja?

DE DÓNDE SALE. La H4 dejó el defecto medido en `hallazgo-box-sizing.json`:
`.qa-box` escribe `width`/`height`, tiene `padding` y la hoja de la librería no
declara `box-sizing`, así que el rectángulo es **content-box** y mide dos paddings
de más en cada eje. Esto es esa misma lectura, guardada como script para poder
tomarla dos veces: antes del arreglo y después.

QUÉ COMPARA, y son dos cosas que fallan por separado:

  1. **Lo escrito contra lo pintado.** `paintBoxes` escribe cuatro longitudes por
     caja. El rectángulo pintado tiene que medir exactamente eso. Si mide más, lo
     que `boxButtonCorner` recibió --la caja verdadera-- y donde el DOM termina
     poniendo el botón son dos lugares distintos, que es el defecto.
  2. **El botón contra la imagen.** Un botón montado en una esquina de su caja
     tiene que caer entero adentro del área de imagen. En `ne` con el rectángulo
     de más, el botón se va por el borde derecho y se ve recortado.

SOBRE QUÉ PÁGINA. Sobre una que NO declare `box-sizing: border-box`. Las páginas
de las demos lo declaran para todo en su propia hoja, así que tapan el defecto sin
arreglarlo: medido ahí, el antes y el después dan lo mismo y la lectura no prueba
nada. La página de esta corrida es `demo/multiview-offer/index.html` tal como está
en el último commit, que es la misma sobre la que la H2 y la H4 tomaron las suyas y
no tiene hoja propia.

SU ROJO es la corrida de antes, con el mismo script y la misma página.

Uso:  python leer-el-rectangulo.py <url> <salida.json> [foto.png]
Sale 0 si el rectángulo mide la caja y los botones caen adentro de la imagen, 1 si no.
"""
import json
import sys

from playwright.sync_api import sync_playwright

NOMBRES = {'view-caminandes-a': 'Caminandes, early', 'view-caminandes-b': 'Caminandes, late',
           'view-ed-a': 'Elephants Dream, early'}
TOLERANCIA = 0.05

LECTURA = """() => {
  const player = document.getElementById('player');
  const pr = player.getBoundingClientRect();
  const rel = (r) => [+(r.left - pr.left).toFixed(1), +(r.top - pr.top).toFixed(1),
                      +r.width.toFixed(1), +r.height.toFixed(1)];
  const video = document.getElementById('video');
  // El área de imagen: el 16/9 del video adentro del contenedor, que es contra lo
  // que se recorta un botón que se pasa del borde.
  const ar = video.videoWidth / video.videoHeight;
  let iw = pr.width, ih = pr.width / ar;
  if (ih > pr.height) { ih = pr.height; iw = pr.height * ar; }
  const cajas = [...document.querySelectorAll('.qa-box')].map((node) => {
    const btn = node.firstElementChild;
    return {
      id: node.dataset.boxId || '(sin dataset)',
      clase: node.className,
      boxSizing: getComputedStyle(node).boxSizing,
      padding: getComputedStyle(node).paddingTop,
      escrito: { ancho: node.style.width, alto: node.style.height,
                 izq: node.style.left, arriba: node.style.top },
      rectangulo: rel(node.getBoundingClientRect()),
      boton: rel(btn.getBoundingClientRect())
    };
  });
  return { contenedor: [+pr.width.toFixed(1), +pr.height.toFixed(1)],
           imagen: [+((pr.width - iw) / 2).toFixed(1), +((pr.height - ih) / 2).toFixed(1),
                    +iw.toFixed(1), +ih.toFixed(1)],
           cajas };
}"""


def mostrar_cromo(pagina):
    caja = pagina.locator('#player').bounding_box()
    pagina.mouse.move(caja['x'] + caja['width'] / 2, caja['y'] + caja['height'] * 0.62)
    pagina.wait_for_timeout(150)


def main():
    url, salida = sys.argv[1], sys.argv[2]
    foto = next((a for a in sys.argv[3:] if a.endswith('.png')), None)
    with sync_playwright() as p:
        navegador = p.chromium.launch(
            channel='chrome', headless=True,
            args=['--autoplay-policy=no-user-gesture-required', '--mute-audio'])
        ctx = navegador.new_context(viewport={'width': 1600, 'height': 1000})
        pagina = ctx.new_page()
        try:
            pagina.goto(url, wait_until='load')
            pagina.wait_for_function('document.getElementById("video").videoWidth > 0',
                                     timeout=30000)
            print('esperando la ventana de la oferta (t=48s)...', flush=True)
            pagina.wait_for_function(
                'document.getElementById("video").currentTime > 48', timeout=180000)
            # La grilla de dos por dos: el primario más las tres cámaras.
            mostrar_cromo(pagina)
            pagina.locator('.qa-btn--views').click()
            for v in NOMBRES.values():
                pagina.locator(f'.qa-views__row:has-text("{v}")').first.click()
                pagina.wait_for_timeout(600)
            pagina.locator('.qa-btn--views').click()
            pagina.wait_for_timeout(700)
            mostrar_cromo(pagina)
            d = pagina.evaluate(LECTURA)
            d['url'] = url
            d['navegador'] = f'Chrome {navegador.version}'
            if foto:
                pagina.screenshot(path=foto)
        finally:
            navegador.close()
    with open(salida, 'w', encoding='utf-8') as f:
        json.dump(d, f, indent=1)

    ix, iy, iw, ih = d['imagen']
    print(f"### {salida}   ({d['navegador']}, contenedor {d['contenedor']}, "
          f"imagen {d['imagen']})")
    malos = 0
    for c in d['cajas']:
        esc = c['escrito']
        quiere = [float(esc['izq'][:-2]), float(esc['arriba'][:-2]),
                  float(esc['ancho'][:-2]), float(esc['alto'][:-2])]
        # Lo escrito es relativo al contenedor, igual que la lectura.
        mide = abs(c['rectangulo'][2] - quiere[2]) <= TOLERANCIA \
            and abs(c['rectangulo'][3] - quiere[3]) <= TOLERANCIA
        b = c['boton']
        adentro = (b[0] >= ix - TOLERANCIA and b[1] >= iy - TOLERANCIA
                   and b[0] + b[2] <= ix + iw + TOLERANCIA
                   and b[1] + b[3] <= iy + ih + TOLERANCIA)
        if not mide or not adentro:
            malos += 1
        sobra_x = c['rectangulo'][2] - quiere[2]
        sobra_y = c['rectangulo'][3] - quiere[3]
        print(f"  {c['clase']:<20s} box-sizing={c['boxSizing']:<11s} padding={c['padding']}")
        print(f"    escrito {quiere[2]:7.1f} x {quiere[3]:7.1f}   "
              f"pintado {c['rectangulo'][2]:7.1f} x {c['rectangulo'][3]:7.1f}   "
              f"sobra {sobra_x:+.1f} x {sobra_y:+.1f}   "
              f"{'mide la caja' if mide else 'MIDE DE MAS'}")
        print(f"    botón {b}   "
              f"{'adentro de la imagen' if adentro else 'RECORTADO por el borde de la imagen'}")
    if malos:
        print(f"\n== ROJO: {malos} caja(s) cuyo rectángulo no mide la caja o cuyo botón "
              f"se sale de la imagen ==")
    else:
        print("\n== VERDE: los cuatro rectángulos miden su caja y los cuatro botones "
              "caen adentro de la imagen ==")
    return 1 if malos else 0


if __name__ == '__main__':
    sys.exit(main())
