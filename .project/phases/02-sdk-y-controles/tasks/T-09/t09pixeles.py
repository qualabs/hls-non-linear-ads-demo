"""Los pixeles de las capturas de la T-09, que es donde esta el error.

No lee un estilo computado: convierte el PNG a PPM crudo y mira los canales.
Una columna es NEGRA si ninguno de sus pixeles pasa el umbral; el borde de la
imagen es la primera columna que no lo es.

MARGEN. Se descartan 4 px por lado. No es para que el numero salga: es el anillo
teal (#37b4a7 = 55,180,167) con que la pagina de la demo marca "hay un aviso"
--`.pane[data-state=ad] .player { outline-color }`-- que en fullscreen queda
pegado al borde de la pantalla y aparece en las cuatro esquinas de las capturas
con aviso y en ninguna de las capturas sin aviso. Es de la pagina y no de la
composicion. Las filas exactas que ocupa estan impresas abajo.
"""
import subprocess, sys, pathlib

UMBRAL = 10
MARGEN = 4


def leer(png):
    raw = subprocess.run(["convert", str(png), "-depth", "8", "ppm:-"],
                         capture_output=True, check=True).stdout
    campos, i = [], 2
    while len(campos) < 3:
        while raw[i:i + 1].isspace(): i += 1
        j = i
        while not raw[j:j + 1].isspace(): j += 1
        campos.append(int(raw[i:j])); i = j
    return campos[0], campos[1], raw[i + 1:]


def perfil_columnas(w, h, px, y0, y1):
    col = [0] * w
    for y in range(y0, y1):
        m = memoryview(px)[y * w * 3:(y + 1) * w * 3]
        for x in range(w):
            v = m[x * 3]
            if m[x * 3 + 1] > v: v = m[x * 3 + 1]
            if m[x * 3 + 2] > v: v = m[x * 3 + 2]
            if v > col[x]: col[x] = v
    return col


def perfil_filas(w, h, px, x0, x1):
    fil = [0] * h
    for y in range(h):
        fil[y] = max(px[(y * w + x0) * 3:(y * w + x1) * 3])
    return fil


def bordes(p, a, b):
    i0 = next((i for i in range(a, b) if p[i] > UMBRAL), None)
    i1 = next((i for i in range(b - 1, a - 1, -1) if p[i] > UMBRAL), None)
    return i0, i1


for png in sorted(pathlib.Path(sys.argv[1]).glob("*.png")):
    w, h, px = leer(png)
    M = MARGEN
    col = perfil_columnas(w, h, px, M, h - M)
    fil = perfil_filas(w, h, px, M, w - M)
    x0, x1 = bordes(col, M, w - M)
    y0, y1 = bordes(fil, M, h - M)
    izq = max(col[M:x0]) if x0 > M else None
    der = max(col[x1 + 1:w - M]) if x1 + 1 < w - M else None
    print(f"{png.name}  {w}x{h}")
    print(f"   la imagen, por pixeles:  x {x0}..{x1}  ancho {x1 - x0 + 1}   |   "
          f"y {y0}..{y1}  alto {y1 - y0 + 1}   |   relacion {(x1 - x0 + 1) / (y1 - y0 + 1):.3f}")
    print(f"   barra izquierda x {M}..{x0 - 1}: canal maximo {izq}   "
          f"barra derecha x {x1 + 1}..{w - M - 1}: canal maximo {der}")
    banda = perfil_columnas(w, h, px, M, h // 4)
    bx0, bx1 = bordes(banda, M, w - M)
    print(f"   en la banda del overlay de esquina (y {M}..{h // 4 - 1}): x {bx0}..{bx1}")
