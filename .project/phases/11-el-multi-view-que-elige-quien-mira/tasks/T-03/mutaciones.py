#!/usr/bin/env python3
# La campana de mutacion de la T-03, scopeada: una rotura por regla, y cada
# rotura corre SOLO los tests que cubren esa regla, y no la suite entera -- una
# rotura que pone rojo a otro test no prueba nada sobre el suyo.
#
# Correr: python3 .project/phases/11-el-multi-view-que-elige-quien-mira/tasks/T-03/mutaciones.py
# Sale 0 si TODAS las roturas dieron rojo, y 1 si alguna quedo verde, que es el
# hallazgo. Se copia el arbol a RAM y se muta la copia, nunca el arbol vivo.
import io, os, shutil, subprocess, sys, tempfile

# El arbol se copia a RAM y se muta ahi. Nunca sobre el arbol vivo: hay otras
# tasks corriendo en paralelo y una mutacion de `lib/` las pondria en rojo por un
# motivo que no es el suyo.
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
WORK = tempfile.mkdtemp(prefix='t03-mutaciones-', dir='/dev/shm')
for item in ('lib', 'test'):
    shutil.copytree(os.path.join(RAIZ, item), os.path.join(WORK, item))
shutil.copy(os.path.join(RAIZ, 'package.json'), WORK)
SRC = os.path.join(WORK, 'lib/signalling.js')
PRISTINE = io.open(SRC, encoding='utf8').read()

ROWS = {
    2: "  [2, ['25 50 25 0', '25 0 25 50']],",
    3: "  [3, ['0 50 50 0', '0 0 50 50', '50 25 0 25']],",
    4: "  [4, ['0 50 50 0', '0 0 50 50', '50 50 0 0', '50 0 0 50']]",
}

BREAKS = [
    dict(
        regla='los cuatro viewport del N=4 son los del Quad del repositorio (ADR 0065)',
        rotura='se dan vuelta dos viewports de la grilla llena: la de abajo a la izquierda con la de abajo a la derecha',
        patron='the four boxes of the full grid|the shapes are the four rows',
        viejo=ROWS[4],
        nuevo="  [4, ['0 50 50 0', '0 0 50 50', '50 0 0 50', '50 50 0 0']]",
    ),
    dict(
        regla='el N=2 lleva bandas negras para que sx == sy en el primario (ADR 0065)',
        rotura='el N=2 pasa a ser dos mitades de alto completo',
        patron='keeps the aspect ratio|the shapes are the four rows',
        viejo=ROWS[2],
        nuevo="  [2, ['0 50 0 0', '0 0 0 50']],",
    ),
    dict(
        regla='el orden de las cajas es el de la seleccion, y el primario es la primera',
        rotura='la lista se devuelve invertida',
        patron='reading order|the four boxes of the full grid|the shapes are the four rows',
        viejo='  return [...shape];',
        nuevo='  return [...shape].reverse();',
    ),
    dict(
        regla='N=1 es la lista vacia, que es la salida del multi view (ADR 0071)',
        rotura='N=1 pasa a devolver el cuadro entero en vez de nada',
        patron='one box is the empty list|every shape places every box',
        viejo='  [1, []],',
        nuevo="  [1, ['0 0 0 0']],",
    ),
    dict(
        regla='un N sin forma no compone nada y lo dice (ADR 0066: el tope es de pantalla)',
        rotura='un N por encima del tope devuelve la ultima fila en vez de nada',
        patron='the cap of the screen|no shape for',
        viejo='  const shape = VIEWPORTS_BY_COUNT.get(Number(count));',
        nuevo='  const shape = VIEWPORTS_BY_COUNT.get(Number(count)) ?? VIEWPORTS_BY_COUNT.get(MAX_BOXES);',
    ),
    dict(
        regla='la tabla se entrega copiada y no prestada',
        rotura='se devuelve la fila de la tabla misma',
        patron='cannot be edited through the list',
        viejo='  return [...shape];',
        nuevo='  return shape;',
    ),
]


def correr(patron):
    return subprocess.run(
        ['node', '--test', '--test-name-pattern', patron, 'test/multiview-geometry.test.js'],
        cwd=WORK, capture_output=True, text=True)


def resumen(salida):
    return ' '.join(l.strip() for l in salida.splitlines()
                    if l.startswith(('# tests', '# pass', '# fail')) or l.startswith(('ℹ tests', 'ℹ pass', 'ℹ fail')))


print('# T-03 -- campana de mutacion scopeada')
print('# Una rotura por regla. Cada una corre SOLO los tests que la cubren.')
print('# Verde de partida (sin romper nada), sobre la copia de /dev/shm:')
base = correr('.')
print('   node --test --test-name-pattern "." test/multiview-geometry.test.js  ->  ' + resumen(base.stdout))
assert base.returncode == 0, 'la copia no arranca en verde'

ok = True
for i, b in enumerate(BREAKS, 1):
    assert b['viejo'] in PRISTINE, b['viejo']
    io.open(SRC, 'w', encoding='utf8').write(PRISTINE.replace(b['viejo'], b['nuevo'], 1))
    r = correr(b['patron'])
    io.open(SRC, 'w', encoding='utf8').write(PRISTINE)
    rojo = r.returncode != 0
    ok = ok and rojo
    print('\n%d. REGLA  %s' % (i, b['regla']))
    print('   ROTURA %s' % b['rotura'])
    print('   -%s' % b['viejo'].strip())
    print('   +%s' % b['nuevo'].strip())
    print('   TESTS  --test-name-pattern "%s"' % b['patron'])
    print('   %s  ->  %s' % ('ROJO (la rotura se detecta)' if rojo else 'VERDE -- HALLAZGO: la rotura NO se detecta', resumen(r.stdout)))
    if rojo:
        fallidos = [l.strip() for l in r.stdout.splitlines() if l.strip().startswith('✖') and 'failing tests' not in l]
        vistos = []
        for f in fallidos:
            if f not in vistos:
                vistos.append(f)
        for f in vistos:
            print('     %s' % f)

shutil.rmtree(WORK, ignore_errors=True)
print('\n# Resultado: %s' % ('las %d roturas dieron rojo.' % len(BREAKS) if ok else 'alguna rotura quedo verde, y eso es el hallazgo.'))
sys.exit(0 if ok else 1)
