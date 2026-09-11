"""El veredicto sobre la lectura que toma `bug-foco.py` de la T-10, que es el
mismo gesto sobre la MISMA caja dos veces. La lectura no falla nunca: mide. Esto
es lo que puede ponerse rojo.

LA REFERENCIA ESTA ADENTRO. La lectura 2 -- una sola vista arriba, el toque -- es
el caso que ya andaba, y es contra ella que se juzga la 5, que es el mismo toque
despues de que subio una segunda vista. Si la 2 saliera mal, el rojo seria del
instrumento y no del arreglo, asi que se juzgan las dos y se dicen por separado.

    python3 juzgar-foco.py <lectura.json>     0 verde, 1 rojo
"""
import json, sys

d = json.loads(open(sys.argv[1]).read().split('===JSON===', 1)[-1])
VISTA = 'view-caminandes-a'


def juzgar(nombre, lectura, cuantas):
    v = {x['id']: x for x in lectura['views']}
    fallos = []
    if len(lectura['views']) != cuantas:
        fallos.append('hay %d cajas y tiene que haber %d' % (len(lectura['views']), cuantas))
    if not lectura['anythingAudible']:
        fallos.append('NO SE OYE NADA')
    if v.get(VISTA, {}).get('volume') != 1:
        fallos.append('la caja tocada esta en %s y no en 1' % v.get(VISTA, {}).get('volume'))
    if v.get(VISTA, {}).get('muted') is not False:
        fallos.append('la caja tocada quedo muteada')
    if not v.get(VISTA, {}).get('ring'):
        fallos.append('la caja tocada no lleva el anillo')
    if lectura['programme'] != 0:
        fallos.append('el programa esta en %s y no en 0' % lectura['programme'])
    print('%-46s %s' % (nombre, 'OK' if not fallos else 'ROJO: ' + '; '.join(fallos)))
    return not fallos


ref = juzgar('la referencia  (una vista, el toque)', d['2_tap_on_it__the_reference'], 1)
caso = juzgar('el caso        (dos vistas, el mismo toque)', d['5_same_tap_on_the_same_box'], 2)
print('== %s ==' % ('VERDE' if ref and caso else 'ROJO'))
sys.exit(0 if ref and caso else 1)
