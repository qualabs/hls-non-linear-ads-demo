#!/usr/bin/env python3
"""el-montaje-corte-por-corte.py -- que el montaje tenga las catorce casillas en el orden
del plan, y que entre dos casillas haya un CORTE y no un fundido.

Son dos cosas y se miden aparte:

1. EL ORDEN. Cada casilla del montaje se compara contra los catorce clips de origen, no
   contra el que deberia ser. Si la casilla 7 del programa no se pareciera mas al clip 07
   que a los otros trece, el concat las tomo en otro orden -- y eso da 2688 cuadros igual.
   La comparacion contra los trece que NO son es la referencia, y no sale de este calculo:
   son los archivos de la T-03.

2. EL CORTE.

POR QUE NO ALCANZA CON QUE EL SCRIPT NO PIDA FUNDIDOS. Los 2688 cuadros ya prueban que no
se descarto ninguno, pero no prueban ni el orden ni la dureza del corte: un concat con las
entradas mal ordenadas da 2688 cuadros igual, y un fundido de cuatro cuadros tambien.

COMO SE VE. Por cada uno de los trece cortes se sacan los dos cuadros que lo rodean -- el
ultimo de una casilla y el primero de la siguiente, separados por 1/24 de segundo -- y se
ponen pegados. Con un corte duro, los dos cuadros son dos imagenes distintas y no se
parecen en nada. Con un fundido encadenado habria una mezcla de las dos, que es el modo de
falla que este proyecto describe como "el que mas cuesta ver".

Y la distancia entre los dos cuadros se MIDE ademas de mirarse: la diferencia media
absoluta entre el cuadro de antes y el de despues. La REFERENCIA no sale de este calculo:
es la misma diferencia entre dos cuadros consecutivos de ADENTRO de una casilla, donde por
construccion no hay corte. Si un corte midiera como el interior de una casilla, ahi no hubo
corte.
"""
import pathlib, subprocess
from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat

AQUI = pathlib.Path(__file__).resolve().parent
TASK = AQUI.parent
RAIZ = TASK.parents[4]
PROGRAMA = RAIZ / "demo/race-multiview/content/.fuentes/programa.mp4"
RACE = __import__("json").loads((RAIZ / "demo/race-multiview/race.json").read_text())
CLIP, FPS, LARGO = RACE["clipDura"], RACE["fps"], RACE["largo"]
T = pathlib.Path("/dev/shm/montaje-cortes")
T.mkdir(exist_ok=True)


def cuadro(n):
    """El cuadro numero n del programa, por numero de cuadro y no por segundo."""
    f = T / f"f{n:05d}.png"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(PROGRAMA),
                    "-vf", f"select=eq(n\\,{n})", "-vsync", "0", "-frames:v", "1", str(f)], check=True)
    return Image.open(f).convert("RGB")


def distancia(a, b):
    """Diferencia media absoluta por canal, en niveles de 0 a 255."""
    m = ImageStat.Stat(ImageChops.difference(a, b)).mean
    return sum(m) / len(m)


ANCHO_MIN = 300
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
filas, medidas = [], []
for k in range(1, LARGO // CLIP):
    n = k * CLIP * FPS
    antes, despues = cuadro(n - 1), cuadro(n)
    d_corte = distancia(antes, despues)
    # La referencia: dos cuadros consecutivos de adentro de la casilla que termina.
    d_dentro = distancia(cuadro(n - 20), cuadro(n - 19))
    medidas.append((k, d_corte, d_dentro))
    filas.append((k, antes.resize((ANCHO_MIN, 169), Image.LANCZOS), despues.resize((ANCHO_MIN, 169), Image.LANCZOS), d_corte, d_dentro))

MARGEN, AIRE = 10, 8
ancho = MARGEN * 2 + ANCHO_MIN * 2 + AIRE
alto_fila = 169 + 20
lamina = Image.new("RGB", (ancho, MARGEN + len(filas) * alto_fila + MARGEN), (24, 24, 26))
d = ImageDraw.Draw(lamina)
y = MARGEN
for k, a, b, dc, dd in filas:
    d.text((MARGEN, y), f"corte {k}: casilla {k} -> casilla {k+1}   ·   segundo {k*CLIP}   ·   "
                        f"distancia en el corte {dc:.1f}   ·   entre dos cuadros de adentro {dd:.1f}",
           font=F, fill=(235, 235, 235))
    y += 20
    lamina.paste(a, (MARGEN, y)); lamina.paste(b, (MARGEN + ANCHO_MIN + AIRE, y))
    y += 169
lamina.save(TASK / "cuadros" / "1-los-trece-cortes.jpg", quality=90)

# ---------------------------------------------------------------------------------------
# 1. EL ORDEN: cada casilla del montaje contra los catorce clips de origen
# ---------------------------------------------------------------------------------------
CLIPS = sorted((RAIZ / "demo/race-multiview/content/.fuentes/programa").glob("*.mp4"))
assert len(CLIPS) == 14, CLIPS


def cuadro_de(video, n, tag):
    f = T / f"{tag}-{n:05d}.png"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video),
                    "-vf", f"select=eq(n\\,{n})", "-vsync", "0", "-frames:v", "1", str(f)], check=True)
    return Image.open(f).convert("RGB")


print("casilla   el clip mas parecido               distancia   el segundo mas parecido      distancia")
mal = 0
for k in range(14):
    prog = cuadro_de(PROGRAMA, k * CLIP * FPS + 96, "p")
    cerca = sorted((distancia(prog, cuadro_de(c, 96, f"c{i}")), c.stem) for i, c in enumerate(CLIPS))
    if cerca[0][1] != CLIPS[k].stem:
        mal += 1
    marca = "" if cerca[0][1] == CLIPS[k].stem else "   <-- NO ES EL QUE EL PLAN PIDE"
    print(f"  {k+1:2d}      {cerca[0][1]:<32} {cerca[0][0]:7.2f}   {cerca[1][1]:<26} {cerca[1][0]:7.2f}{marca}")
print(f"\n{14 - mal} de 14 casillas salieron del clip que el plan les asigna.\n")

# ---------------------------------------------------------------------------------------
# 2. EL CORTE
# ---------------------------------------------------------------------------------------
print("corte  casilla       distancia en el corte   REFERENCIA dentro de la casilla   razon")
for k, dc, dd in medidas:
    print(f"  {k:2d}    {k} -> {k+1:<2d}            {dc:6.1f}                    {dd:6.1f}                   {dc/dd:5.1f}x")
cs = [m[1] for m in medidas]; ds = [m[2] for m in medidas]
print(f"\nel corte mas flojo mide {min(cs):.1f} y el interior mas movido mide {max(ds):.1f}: "
      f"{'no se tocan, o sea que los trece son cortes' if min(cs) > max(ds) else 'SE TOCAN -- hay un corte que no se distingue del interior de una casilla'}")
print(f"lamina: {TASK / 'cuadros' / '1-los-trece-cortes.jpg'}")
