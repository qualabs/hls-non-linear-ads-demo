"""La campana de mutacion del arreglo: una rotura por regla, sobre el arbol CON
el arreglo, y en cada una se corre la suite entera. Lo que se mide en cada fila
es doble: si la prueba nueva la ve, y si la ven las 167 que ya estaban.

M3 es la regresion misma restituida. Su fila es la unica que importa dos veces:
dice que las 167 no la veian -- que es por que llego a produccion -- y dice que
la prueba nueva tampoco la ve, porque un listener del DOM no se puede observar
sin un DOM. Esa mitad la cubre la lectura del navegador, y esta escrito aca para
que nadie deduzca lo contrario de una campana en verde.
"""
import re, shutil, subprocess, sys, pathlib

SDK = pathlib.Path('/dev/shm/t11-foco-20260911-b7k2/sdk')
REN = SDK / 'lib/renderer.js'
SANO = REN.read_text()
NUEVA = 'test/focus-after-a-composition-change.test.js'

MUTACIONES = [
    ('M1  entryOf contesta con la primera caja y no con la que se toco',
     'return drawn.find((entry) => entry.node === node) ?? null;',
     'return drawn[0] ?? null;'),
    ('M2  entryOf no encuentra nunca nada',
     'return drawn.find((entry) => entry.node === node) ?? null;',
     'return null;'),
    ('M3  el listener del toque vuelve a quedarse con el elemento de su creacion',
     '''        const entry = entryOf(drawn, node);
        if (!entry) return;
        setFocus(entry.element === focused ? null : entry.element);''',
     '        setFocus(element === focused ? null : element);'),
    ('--  sin mutacion, el control', None, None),
]


def corrida(args):
    p = subprocess.run(['node', '--test'] + args, cwd=SDK, capture_output=True, text=True)
    t = p.stdout
    n = lambda k: re.search(r'^ℹ %s (\d+)$' % k, t, re.M)
    if not n('pass'):
        return 'NO CORRIO'
    return '%s pasan, %s fallan' % (n('pass').group(1), n('fail').group(1))


for nombre, viejo, nuevo in MUTACIONES:
    if viejo is None:
        REN.write_text(SANO)
    else:
        assert SANO.count(viejo) == 1, nombre
        REN.write_text(SANO.replace(viejo, nuevo))
    print('%-72s | prueba nueva: %-22s | suite entera: %s'
          % (nombre, corrida([NUEVA]), corrida([])))
    sys.stdout.flush()

REN.write_text(SANO)
print('\nel arbol queda sano:', corrida([]))
