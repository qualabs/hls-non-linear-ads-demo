"""Corre `medicion-t01.html` y deja su lectura en disco.

Levanta el servidor del repositorio con la RAIZ como document root --que es lo
que hace alcanzables `/lib/`, `/vendor/` y el contenido ya empaquetado de
`compatibility-pair`-- abre la pagina en un Chrome propio, le pide las dos
rutas, e imprime la tabla.

    python3 medicion-t01.py [--puerto N] [--headful] [--salida lectura.json]

Sin `--puerto` toma uno libre del sistema, para no pisar --ni depender de-- el
servidor de una demo que alguien tenga levantado.

El navegador es propio y no el de nadie, como en la lectura del recorrido de la
T-12: el renderizado se mueve con `requestAnimationFrame`, asi que una pestana
en segundo plano lo dejaria corriendo a 1 Hz y la medicion seria sobre eso.
"""
import argparse
import json
import os
import pathlib
import socket
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

RAIZ = pathlib.Path(__file__).resolve().parents[5]
PAGINA = '/.project/phases/11-el-multi-view-que-elige-quien-mira/tasks/T-01/medicion-t01.html'


def puerto_libre():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--puerto', type=int, default=0)
    ap.add_argument('--headful', action='store_true')
    ap.add_argument('--salida', default=str(pathlib.Path(__file__).with_name('lectura.json')))
    args = ap.parse_args()

    puerto = args.puerto or puerto_libre()
    # LA RAIZ COMO DOCUMENT ROOT y no la carpeta de una demo: lo que esta pagina
    # necesita alcanzable es `/lib/`, que no esta abajo de ninguna.
    servidor = subprocess.Popen(
        ['node', 'server.mjs', '.'], cwd=RAIZ,
        env={**os.environ, 'PORT': str(puerto)},
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    try:
        time.sleep(1.0)
        if servidor.poll() is not None:
            sys.exit(f'el servidor no levanto en el puerto {puerto}:\n{servidor.stdout.read()}')
        url = f'http://localhost:{puerto}{PAGINA}'
        with sync_playwright() as p:
            navegador = p.chromium.launch(
                channel='chrome', headless=not args.headful,
                args=['--autoplay-policy=no-user-gesture-required', '--mute-audio'])
            ctx = navegador.new_context(viewport={'width': 1280, 'height': 900})
            pagina = ctx.new_page()
            avisos = []
            pagina.on('console', lambda m: avisos.append(f'{m.type}: {m.text[:200]}')
                      if m.type in ('error', 'warning') else None)
            pagina.goto(url, wait_until='load')
            pagina.wait_for_function('window.medicion && window.medicion.listo', timeout=30000)
            resultados = pagina.evaluate('window.medicion.correr()')
            veredictos = pagina.evaluate('window.medicion.veredictos')
            tabla = pagina.inner_text('#out')
            lectura = {
                'navegador': f'Chrome {navegador.version}',
                'url': url,
                'resultados': resultados,
                'veredictos': veredictos,
                'avisos': avisos
            }
            navegador.close()
    finally:
        servidor.terminate()
        servidor.wait(timeout=10)

    pathlib.Path(args.salida).write_text(json.dumps(lectura, indent=2), encoding='utf-8')
    print(tabla)
    print(f'lectura completa en {args.salida}')

    # EL VEREDICTO, Y ES CONTRA SU PROPIA REFERENCIA. En la ruta incremental los
    # nodos que sobreviven tienen que ser los mismos y su reloj no puede haber
    # vuelto atras; en la total --misma pagina, misma espera, itemId distinto--
    # tienen que ser otros. Sin la segunda mitad, un reloj que avanza no prueba
    # nada: podria estar avanzando porque nada cambio.
    inc, tot = veredictos
    problemas = []
    for s in inc['sobreviven']:
        if not s['mismoNodo']:
            problemas.append(f"incremental: {s['id']} se reconstruyo")
        if s['volvioACero']:
            problemas.append(f"incremental: el reloj de {s['id']} volvio atras")
    if all(s['mismoNodo'] for s in tot['sobreviven']):
        problemas.append('total: nada se reconstruyo, asi que la referencia no separa las dos rutas')
    if inc['nueva'] is None or inc['nueva']['t'] > 0.5:
        problemas.append('incremental: la caja que sube no arranca de cero, no hay referencia de un cero')
    if not inc['bajo']:
        problemas.append('incremental: la caja que baja sigue dibujada')
    if problemas:
        print('\n== HALLAZGOS ==')
        for p_ in problemas:
            print('  -', p_)
        sys.exit(1)
    print('== VERDE: lo que sobrevive no se reconstruye, y la ruta total muestra lo contrario ==')


if __name__ == '__main__':
    main()
