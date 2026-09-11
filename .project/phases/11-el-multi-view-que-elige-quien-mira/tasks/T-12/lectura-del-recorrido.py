"""La lectura del recorrido de `compatibility-pair`, y su comparación contra la base.

QUÉ MIDE. Los 180 s de la demo que se graba, corridos de punta a punta sin un
solo seek, leyendo en catorce segundos muestreados **qué hay dibujado en el pane
de la demo y en qué caja está cada cosa, en píxeles**: el contenido primario, los
nodos del aviso, y las marcas de la barra. La suite del proyecto no ve píxeles
--es lógica pura-- así que ésta es la única lectura que puede decir que la
composición de un aviso quedó distinta en pantalla mientras los 72 tests siguen
en verde.

CUÁL ES SU FORMA DE FALLAR. `comparar` vuelve a tomar la lectura y la contrasta
contra la base elemento por elemento y caja por caja: igual quiere decir igual.
Sale 0 en verde y 1 en rojo. Para que eso valga algo hay que haberlo visto fallar,
y por eso existe `--lectura`: se le pasa una lectura alterada a mano --un elemento
movido diez píxeles-- y tiene que salir roja.

POR QUÉ LOS SEGUNDOS SON ÉSTOS. Cada muestra cae en el medio de su ventana y a
más de tres segundos de cualquier borde, que es `PRELOAD_LEAD_SECONDS` de
`lib/renderer.js`: adentro de esos tres segundos el renderizado ya construyó los
nodos del aviso que viene con `opacity: 0`, y una muestra ahí leería una
composición que depende de cuándo llegó la red. Las transiciones son de 380 ms
para el primario y de 200 ms para el aviso, así que en el medio de una ventana no
hay ninguna corriendo y las cajas están quietas.

EL NAVEGADOR ES PROPIO Y NO EL DEL USUARIO. Chrome del sistema lanzado por
Playwright, headless por default, con su propio perfil temporal: el recorrido no
depende de que haya un Chrome abierto ni de qué esté haciendo quien lo tenga
abierto. El renderizado se mueve con `requestAnimationFrame`, así que una pestaña
en segundo plano lo dejaría corriendo a 1 Hz; headless renderiza.

Uso:

    python3 lectura-del-recorrido.py tomar     <salida.json>
    python3 lectura-del-recorrido.py comparar  <base.json> [--guardar <salida.json>]
    python3 lectura-del-recorrido.py comparar  <base.json> --lectura <archivo.json>

Opciones: `--url` (default http://localhost:8080/), `--headful` para verlo correr.
Necesita el server de la demo levantado: `./run.sh` desde la raíz del repositorio.
"""
import argparse
import json
import pathlib
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

# Los cinco breaks del recorrido son 20-32, 45-57, 70-82, 95-107 y 120-168, el
# último con sus cuatro avisos de doce segundos. Catorce muestras: una en el medio
# de cada aviso y seis de programa entre medio.
SEGUNDOS = [10.0, 26.0, 38.0, 51.0, 63.0, 76.0, 88.0, 101.0,
            113.0, 126.0, 138.0, 150.0, 162.0, 174.0]

PASO_S = 0.1
# Si el reloj del primario no avanza durante esto, la corrida está trabada y no
# hay lectura que tomar: mejor romper que devolver una lectura a medias.
ATASCO_S = 25.0

# La lectura de un instante, en las coordenadas del contenedor del reproductor.
# Todo lo que se mide sale de `getBoundingClientRect`, que es la caja pintada
# --el primario se achica con un `transform`, así que su rectángulo de layout no
# dice dónde está--.
MUESTRA = """
() => {
  const player = document.getElementById('player');
  const pr = player.getBoundingClientRect();
  const caja = (el) => {
    const r = el.getBoundingClientRect();
    return [Math.round(r.left - pr.left), Math.round(r.top - pr.top),
            Math.round(r.width), Math.round(r.height)];
  };
  const nodo = (el, id) => {
    const cs = getComputedStyle(el);
    return {
      id,
      etiqueta: el.tagName,
      caja: caja(el),
      z: cs.zIndex,
      opacidad: +(+cs.opacity).toFixed(2),
      mudo: !!el.muted,
      volumen: typeof el.volume === 'number' ? +el.volume.toFixed(2) : null
    };
  };
  const v = window.demo.video;
  const composicion = [nodo(v, 'primario')];
  for (const el of player.querySelectorAll('.ad')) {
    composicion.push(nodo(el, el.dataset.elementId || '(sin id)'));
  }
  return {
    t: +v.currentTime.toFixed(2),
    pausado: v.paused,
    composicion,
    contrato: window.demo.provider.activeAt(v.currentTime).map((e) => ({
      tipo: e.type,
      itemId: e.itemId,
      elementos: e.elements.map((el) => el.id ?? '(sin id)')
    })),
    marcas: [...player.querySelectorAll('.qa-mark')].map(caja)
  };
}
"""

CONTEXTO = """
() => {
  const player = document.getElementById('player');
  const r = player.getBoundingClientRect();
  const v = window.demo.video;
  return {
    contenedor: [Math.round(r.width), Math.round(r.height)],
    video: [v.videoWidth, v.videoHeight],
    duracion: +v.duration.toFixed(2),
    hls: window.Hls ? window.Hls.version : null
  };
}
"""


def commit(repo):
    """El commit sobre el que se toma la lectura, y qué había sin commitear.

    Los archivos sucios van nombrados y no resumidos en la palabra "sucio":
    una lectura tomada con `lib/` modificado y una tomada con un archivo de
    evidencia sin commitear son dos cosas distintas, y la diferencia es
    justamente lo que esta lectura sirve para probar.
    """
    def git(*args):
        # Sin `strip()`: los dos primeros caracteres de una línea de
        # `--porcelain` son el estado y pueden ser espacios, así que recortarlos
        # se come una letra del primer archivo de la lista.
        return subprocess.run(['git', '-C', str(repo), *args],
                              capture_output=True, text=True).stdout
    sha = git('rev-parse', 'HEAD').strip()
    sucios = [linea[3:] for linea in git('status', '--porcelain').splitlines()]
    if not sucios:
        return f'{sha} · árbol limpio'
    return f"{sha} · sin commitear: {', '.join(sucios)}"


def tomar(url, headful, repo):
    """Corre el recorrido entero y devuelve la lectura."""
    lectura = {
        'tomada': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'commit': commit(repo),
        'url': url,
        'viewport': [1600, 1000],
        'segundos': SEGUNDOS,
        'muestras': []
    }
    with sync_playwright() as p:
        navegador = p.chromium.launch(
            channel='chrome', headless=not headful,
            args=['--autoplay-policy=no-user-gesture-required', '--mute-audio'])
        lectura['navegador'] = f'Chrome {navegador.version}'
        ctx = navegador.new_context(viewport={'width': 1600, 'height': 1000})
        pagina = ctx.new_page()
        avisos = []
        pagina.on('console', lambda m: avisos.append(m.text[:200])
                  if m.type in ('error', 'warning') else None)
        try:
            pagina.goto(url, wait_until='load')
            pagina.wait_for_function('!!(window.demo && window.demo.renderer)', timeout=30000)
            pagina.wait_for_function('window.demo.video.videoWidth > 0', timeout=30000)
            lectura['contexto'] = pagina.evaluate(CONTEXTO)

            pendientes = list(SEGUNDOS)
            ultimo_t, visto = -1.0, time.monotonic()
            while pendientes:
                t = pagina.evaluate('window.demo.video.currentTime')
                if t > ultimo_t + 0.01:
                    ultimo_t, visto = t, time.monotonic()
                elif time.monotonic() - visto > ATASCO_S:
                    raise RuntimeError(
                        f'el reloj del primario no avanza desde {ultimo_t:.2f}s: corrida trabada')
                if t >= pendientes[0]:
                    objetivo = pendientes.pop(0)
                    muestra = pagina.evaluate(MUESTRA)
                    muestra['objetivo'] = objetivo
                    lectura['muestras'].append(muestra)
                    print(f"  {objetivo:6.1f}s  leido en {muestra['t']:7.2f}s  "
                          f"{len(muestra['composicion'])} nodos  "
                          f"{len(muestra['contrato'])} experiencia(s)", flush=True)
                else:
                    time.sleep(PASO_S)
        finally:
            navegador.close()
    lectura['avisos'] = sorted({a for a in avisos})
    return lectura


def dif_nodos(a, b):
    """Las diferencias entre dos composiciones, nodo por nodo y campo por campo."""
    salida = []
    for i in range(max(len(a), len(b))):
        va = a[i] if i < len(a) else None
        vb = b[i] if i < len(b) else None
        if va is None:
            salida.append(f'      + nodo que no estaba en la base: {json.dumps(vb)}')
            continue
        if vb is None:
            salida.append(f'      - nodo de la base que ya no está: {json.dumps(va)}')
            continue
        for campo in ('id', 'etiqueta', 'caja', 'z', 'opacidad', 'mudo', 'volumen'):
            if va.get(campo) != vb.get(campo):
                extra = ''
                if campo == 'caja':
                    d = [y - x for x, y in zip(va['caja'], vb['caja'])]
                    extra = f'   (movida {d[0]:+d}, {d[1]:+d} px; tamaño {d[2]:+d}, {d[3]:+d} px)'
                salida.append(f"      nodo {i} ({va['id']}) · {campo}: "
                              f'base {json.dumps(va.get(campo))} → '
                              f'ahora {json.dumps(vb.get(campo))}{extra}')
    return salida


def comparar(base, nueva):
    """Contrasta dos lecturas. Devuelve (texto, hubo_diferencias)."""
    lineas, rojo = [], False

    def corto(lectura):
        """El commit y su árbol, en una línea: la lista entera está en el JSON."""
        sha, _, sucios = lectura['commit'].partition(' · sin commitear: ')
        if not sucios:
            return f'{sha[:12]} · árbol limpio'
        archivos = sucios.split(', ')
        cabeza = ', '.join(archivos[:3])
        resto = f' (+{len(archivos) - 3} más)' if len(archivos) > 3 else ''
        return f'{sha[:12]} · sin commitear: {cabeza}{resto}'

    lineas.append('## Las condiciones de las dos lecturas')
    lineas.append(f"   base:  {base['tomada']}  ·  {corto(base)}")
    lineas.append(f"   ahora: {nueva['tomada']}  ·  {corto(nueva)}")
    for campo in ('url', 'viewport', 'segundos'):
        if base.get(campo) != nueva.get(campo):
            rojo = True
            lineas.append(f'   DISTINTO {campo}: base {base.get(campo)} → ahora {nueva.get(campo)}')
    for campo in ('contenedor', 'video'):
        if base.get('contexto', {}).get(campo) != nueva.get('contexto', {}).get(campo):
            rojo = True
            lineas.append(f"   DISTINTO {campo}: base {base['contexto'].get(campo)} → "
                          f"ahora {nueva['contexto'].get(campo)}")
    if rojo:
        lineas.append('   Las dos lecturas no se tomaron en las mismas condiciones, así que')
        lineas.append('   una diferencia de píxeles de acá abajo no prueba nada.')
    else:
        lineas.append('   Las mismas: mismo contenedor, mismo video, mismos segundos.')
    lineas.append('')

    por_objetivo = {m['objetivo']: m for m in nueva['muestras']}
    iguales = 0
    lineas.append('## Los segundos muestreados')
    for mb in base['muestras']:
        objetivo = mb['objetivo']
        mn = por_objetivo.get(objetivo)
        if mn is None:
            rojo = True
            lineas.append(f'   {objetivo:6.1f}s  FALTA en la lectura nueva')
            continue
        difs = dif_nodos(mb['composicion'], mn['composicion'])
        if mb['contrato'] != mn['contrato']:
            difs.append(f"      contrato: base {json.dumps(mb['contrato'])} → "
                        f"ahora {json.dumps(mn['contrato'])}")
        if mb['marcas'] != mn['marcas']:
            difs.append(f"      marcas de la barra: base {json.dumps(mb['marcas'])} → "
                        f"ahora {json.dumps(mn['marcas'])}")
        if difs:
            rojo = True
            lineas.append(f"   {objetivo:6.1f}s  DISTINTO  ({len(mb['composicion'])} nodos en la base)")
            lineas.extend(difs)
        else:
            iguales += 1
            nodos = ', '.join(n['id'] for n in mb['composicion'])
            lineas.append(f'   {objetivo:6.1f}s  igual     [{nodos}]')
    sobrantes = [m['objetivo'] for m in nueva['muestras']
                 if m['objetivo'] not in {x['objetivo'] for x in base['muestras']}]
    if sobrantes:
        rojo = True
        lineas.append(f'   segundos que la base no tiene: {sobrantes}')
    lineas.append('')
    total = len(base['muestras'])
    lineas.append(f'== {"ROJO" if rojo else "VERDE"}: {iguales} de {total} segundos iguales ==')
    if rojo:
        lineas.append('   El recorrido cambió. Lo que cambió está arriba, y es un hallazgo:')
        lineas.append('   se reporta antes de tocar nada.')
    else:
        lineas.append('   El recorrido dibuja lo mismo, en las mismas cajas, que antes de la fase.')
    return '\n'.join(lineas), rojo


def main():
    raiz = pathlib.Path(__file__).resolve().parents[4]
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='accion', required=True)
    t = sub.add_parser('tomar', help='corre el recorrido y escribe la lectura')
    t.add_argument('salida')
    c = sub.add_parser('comparar', help='vuelve a tomar la lectura y la contrasta contra la base')
    c.add_argument('base')
    c.add_argument('--lectura', help='comparar este archivo en vez de correr el recorrido')
    c.add_argument('--guardar', help='dónde dejar la lectura que se acaba de tomar')
    for p in (t, c):
        p.add_argument('--url', default='http://localhost:8080/')
        p.add_argument('--headful', action='store_true')
    args = ap.parse_args()

    if args.accion == 'tomar':
        print(f'== el recorrido, {len(SEGUNDOS)} segundos muestreados sobre {args.url} ==',
              flush=True)
        lectura = tomar(args.url, args.headful, raiz)
        pathlib.Path(args.salida).write_text(json.dumps(lectura, indent=2), encoding='utf-8')
        print(f"\nlectura de {len(lectura['muestras'])} segundos escrita en {args.salida}")
        print(f"commit: {lectura['commit']}")
        return 0

    base = json.loads(pathlib.Path(args.base).read_text(encoding='utf-8'))
    if args.lectura:
        nueva = json.loads(pathlib.Path(args.lectura).read_text(encoding='utf-8'))
        print(f'== comparando {args.lectura} contra la base {args.base} ==\n', flush=True)
    else:
        print(f'== el recorrido otra vez, contra la base {args.base} ==', flush=True)
        nueva = tomar(args.url, args.headful, raiz)
        if args.guardar:
            pathlib.Path(args.guardar).write_text(json.dumps(nueva, indent=2), encoding='utf-8')
            print(f'\nlectura nueva guardada en {args.guardar}')
        print()
    texto, rojo = comparar(base, nueva)
    print(texto)
    return 1 if rojo else 0


if __name__ == '__main__':
    sys.exit(main())
