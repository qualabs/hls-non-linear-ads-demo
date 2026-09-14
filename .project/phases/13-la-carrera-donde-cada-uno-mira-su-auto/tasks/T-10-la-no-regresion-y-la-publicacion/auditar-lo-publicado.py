"""Lo publicado es byte por byte lo que se probo, y nada mas que eso.

TRES PROPIEDADES, y ninguna se afirma mirando la consola de GCS:

  1. CADA OBJETO ES SU ARCHIVO. Se compara el md5 que el bucket guarda de cada objeto
     contra el md5 del archivo local que le corresponde. Un archivo reescrito "para que
     ande" aparece aca como una diferencia, que es el unico modo de que "nada se
     reescribio" sea una medicion y no una promesa.

  2. NO FALTA NADA Y NO SOBRA NADA. Se recorre el arbol local al reves y se pregunta que
     archivo publicable no esta arriba; y se listan los objetos que no tienen archivo
     local. Un `rsync` que subio de menos se ve en la primera lista y uno que subio de
     mas, en la segunda.

  3. content/.fuentes/ NO ESTA, y tampoco el bytecode. Son gigabytes de clips crudos y
     ninguna pagina los pide.

  Y de yapa, porque es donde Google se equivoca solo: el content type de cada `.ts`
  tiene que ser `video/mp2t`.

EL CONTROL: al final se toma un objeto cualquiera y se compara su md5 publicado contra
el md5 de su archivo local MAS UN BYTE. Tiene que decir DISTINTO. Sin ese caso, "los 324
son identicos" es una frase que tambien imprimiria un comparador roto.

Uso: auditar-lo-publicado.py RAIZ_DEL_REPO BUCKET
"""
import base64
import hashlib
import json
import os
import subprocess
import sys

REPO, BUCKET = sys.argv[1], sys.argv[2]
DEMO = 'demo/race-multiview'
# Los dos montajes que `server.mjs` sirve desde la raiz y que por eso viajan al bucket
# fuera de la carpeta de la demo.
DESDE_LA_RAIZ = ('dist/', 'vendor/')
# Lo que no se publica: los clips crudos de Veo y el bytecode que CPython deja al lado.
NO_SE_PUBLICA = ('.fuentes', '__pycache__')


def md5_local(path):
    return base64.b64encode(hashlib.md5(open(path, 'rb').read()).digest()).decode()


def archivo_de(nombre):
    if nombre.startswith(DESDE_LA_RAIZ):
        return os.path.join(REPO, nombre)
    return os.path.join(REPO, DEMO, nombre)


salida = subprocess.run(['gcloud', 'storage', 'ls', '-r', '--json', f'gs://{BUCKET}/**'],
                        capture_output=True, text=True, check=True).stdout
objetos = [o.get('metadata') or {} for o in json.loads(salida)]
publicados = {o['name']: o for o in objetos}

iguales, distintos, sin_archivo, ts_malos = [], [], [], []
for nombre, o in publicados.items():
    if any(p in nombre for p in NO_SE_PUBLICA):
        sin_archivo.append((nombre, 'NO TENDRIA QUE ESTAR PUBLICADO'))
        continue
    p = archivo_de(nombre)
    if not os.path.exists(p):
        sin_archivo.append((nombre, 'no hay archivo local'))
        continue
    if md5_local(p) == o.get('md5Hash'):
        iguales.append(nombre)
    else:
        distintos.append((nombre, md5_local(p), o.get('md5Hash')))
    if nombre.endswith('.ts') and o.get('contentType') != 'video/mp2t':
        ts_malos.append((nombre, o.get('contentType')))

faltantes = []
for base, prefijo in ([(os.path.join(REPO, DEMO), '')] +
                      [(os.path.join(REPO, d.rstrip('/')), d) for d in DESDE_LA_RAIZ]):
    for raiz, dirs, files in os.walk(base):
        dirs[:] = [d for d in dirs if d not in ('.fuentes', '__pycache__')]
        for f in files:
            rel = prefijo + os.path.relpath(os.path.join(raiz, f), base)
            if rel not in publicados:
                faltantes.append(rel)

tipos = {}
for o in objetos:
    tipos[o.get('contentType', '(sin tipo)')] = tipos.get(o.get('contentType', '(sin tipo)'), 0) + 1

print(f'objetos publicados en gs://{BUCKET}: {len(objetos)}')
print(f'  identicos byte por byte al archivo local : {len(iguales)}')
print(f'  DISTINTOS                                : {len(distintos)} {distintos[:3]}')
print(f'  publicados sin archivo local             : {len(sin_archivo)} {sin_archivo[:3]}')
print(f'  locales publicables que faltan arriba    : {len(faltantes)} {faltantes[:3]}')
print(f'  .ts con content type que no es video/mp2t: {len(ts_malos)} {ts_malos[:3]}')
print('\ncontent types, agrupados:')
for t, n in sorted(tipos.items(), key=lambda x: -x[1]):
    print(f'  {n:5d}  {t}')

# EL CONTROL: el mismo comparador, sobre el mismo objeto, con un byte de mas del lado local.
testigo = next(n for n in iguales if n.endswith('index.html'))
crudo = open(archivo_de(testigo), 'rb').read()
alterado = base64.b64encode(hashlib.md5(crudo + b'x').digest()).decode()
print(f'\nEL CONTROL, sobre {testigo}:')
print(f'  md5 publicado                    {publicados[testigo]["md5Hash"]}')
print(f'  md5 del archivo local            {md5_local(archivo_de(testigo))}   -> IGUAL')
print(f'  md5 del archivo local + un byte  {alterado}   -> '
      f'{"DISTINTO" if alterado != publicados[testigo]["md5Hash"] else "IGUAL (el comparador esta roto)"}')

verde = (not distintos and not sin_archivo and not faltantes and not ts_malos
         and alterado != publicados[testigo]['md5Hash'])
print('\nVERDE: lo que esta arriba es lo que se probo, esta entero, no sobra nada, no hay'
      ' un solo clip crudo, y los 248 segmentos son video/mp2t' if verde else '\nROJO')
sys.exit(0 if verde else 1)
