"""La campana de mutacion scopeada de la T-01: una rotura por regla del reparto.

POR QUE SCOPEADA. Una rotura que se corre contra la suite entera no dice cual de
los tests la vio, y un test que la ve por casualidad --porque toca lo mismo de
paso-- cuenta igual que el que la cubre a proposito. Aca cada rotura corre SOLO
los tests que cubren su regla, asi que lo que se demuestra es que ESE test es el
que la atrapa.

Y LO PRIMERO ES EL CONTROL. Antes de mutar nada, cada recorte de tests se corre
sobre el arbol sin tocar y tiene que estar verde. Sin eso una rotura que sale
roja no prueba nada: podria estar roja desde antes.

UNA ROTURA QUE QUEDA VERDE ES UN HALLAZGO Y NO UN PASE, y el script sale 1.

NO SE TOCA EL ARBOL DEL REPOSITORIO. Se copia `lib/` y `test/` a una carpeta en
RAM, se muta la copia, y se corre ahi.

    python3 mutaciones.py
"""
import pathlib
import shutil
import subprocess
import sys
import tempfile

RAIZ = pathlib.Path(__file__).resolve().parents[5]
ARCHIVO = 'test/composition-plan.test.js'

# Cada fila: el nombre de la regla, el texto a romper, con que se lo reemplaza, y
# el patron de los tests que cubren ESA regla y ninguna otra.
MUTACIONES = [
    ('R1 la identidad se compara por el `id` del break y no por el `itemId`',
     "return `${experience?.itemId ?? ''}",
     "return `${experience?.id ?? ''}",
     'the second ad of a break recognises no box of the first one as its own'),

    ('R2 la identidad se compara solo por el `id` del elemento',
     "return `${experience?.itemId ?? ''}\\u0000${element?.id ?? ''}\\u0000${ordinal}`;",
     "return `${element?.id ?? ''}\\u0000${ordinal}`;",
     'two overlapping breaks that name their boxes the same keep them apart'),

    ('R3 no se destruye lo que sobra',
     '    destroy: drawn.filter((entry) => !kept.has(entry))',
     '    destroy: []',
     'applied, the composition is exactly the target|with an empty target'),

    ('R4 no se marca lo que cambio de caja',
     'export function sameGeometry(a, b) {\n  return a.zDepth === b.zDepth &&',
     'export function sameGeometry(a, b) {\n  return true || a.zDepth === b.zDepth &&',
     'an element that changes box without changing identity|a change of stacking alone'),

    ('R5 el plan se aplica a medias: solo los que sobreviven',
     '  return plan.order.map((slot) => {',
     '  return plan.keep.map((slot) => {',
     'applied, the composition is exactly the target'),
]


def main():
    taller = pathlib.Path(tempfile.mkdtemp(prefix='t01-mutaciones-', dir='/dev/shm'))
    try:
        for carpeta in ('lib', 'test'):
            shutil.copytree(RAIZ / carpeta, taller / carpeta)
        (taller / 'package.json').write_text('{ "name": "mutantes", "private": true, "type": "module" }\n')
        fuente = taller / 'lib' / 'renderer.js'
        original = fuente.read_text()

        def correr(patron):
            return subprocess.run(
                ['node', '--test', '--test-name-pattern', patron, ARCHIVO],
                cwd=taller, capture_output=True, text=True)

        def cuenta(salida):
            return ' / '.join(l for l in salida.splitlines()
                              if l.startswith('ℹ pass') or l.startswith('ℹ fail'))

        hallazgos = []
        print('== CONTROL: el arbol sin mutar, con cada uno de los recortes de tests ==\n')
        for nombre, _, _, patron in MUTACIONES:
            r = correr(patron)
            print(f'  [{"VERDE" if r.returncode == 0 else "ROJO "}] {nombre}')
            print(f'          {cuenta(r.stdout)}')
            if r.returncode != 0:
                hallazgos.append(f'CONTROL {nombre}: rojo sin mutar nada')

        print('\n== LAS CINCO ROTURAS ==\n')
        for nombre, viejo, nuevo, patron in MUTACIONES:
            if original.count(viejo) != 1:
                hallazgos.append(f'{nombre}: el texto a romper aparece {original.count(viejo)} veces')
                continue
            fuente.write_text(original.replace(viejo, nuevo))
            r = correr(patron)
            fuente.write_text(original)
            print(f'  [{"ROJO (la rotura se ve)" if r.returncode else "VERDE -- HALLAZGO"}] {nombre}')
            print(f'          {cuenta(r.stdout)}')
            for linea in r.stdout.splitlines():
                if linea.strip().startswith('✖') and 'test/' not in linea:
                    print(f'          primera que cae: {linea.strip()}')
                    break
            if r.returncode == 0:
                hallazgos.append(f'{nombre}: quedo verde')

        print()
        if hallazgos:
            print('== HALLAZGOS ==')
            for h in hallazgos:
                print('  -', h)
            return 1
        print('== las cinco roturas se ven, y el arbol sin mutar esta verde en las cinco ==')
        return 0
    finally:
        shutil.rmtree(taller, ignore_errors=True)


if __name__ == '__main__':
    sys.exit(main())
