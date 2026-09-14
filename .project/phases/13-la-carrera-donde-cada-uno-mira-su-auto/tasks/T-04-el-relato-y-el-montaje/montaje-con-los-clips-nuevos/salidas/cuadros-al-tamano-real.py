#!/usr/bin/env python3
"""cuadros-al-tamano-real.py -- tres cuadros del programa terminado, a los dos anchos en
que se van a ver de verdad.

POR QUE ESTO EXISTE. Hay una decision esperando y se toma mirando, no leyendo un numero:
once de los catorce clips traen tipografia ilegible en la carroceria (T-03 seccion 3), y
limpiarlos por regeneracion cuesta unos US$56, que es dos veces y media el techo de esta
etapa. Lo unico que hace falta para decidir es verlo al tamano al que se va a ver.

LOS DOS ANCHOS NO SON ARBITRARIOS. 470 px es una caja de la grilla de cuatro con la pagina
a 1907 de ancho, que es una pantalla grande; 190 px es una caja de cuatro a 400, que es un
telefono. Son los dos anchos contra los que este proyecto ya mide.

LOS TRES CUADROS SON LOS PEORES Y NO LOS MEJORES, que es la unica forma de que mirarlos
sirva para algo. La casilla 4 es la unica de las catorce donde el modelo escribio una
palabra LEGIBLE -- AQUAAMARINE, tomada del propio prompt -- y es ademas la que esta en
pantalla cuando se abre la ventana. La casilla 10 es la que trae la tipografia inventada
mas grande y mas nitida de las catorce, y es el clip que se acaba de reemplazar. La 12 es
la unica que se mira por un motivo que no es la tipografia: es el instante en que se esta
diciendo la linea que nombra la rueda sobre el piano, o sea la casilla donde el relato y la
imagen tienen que coincidir o no coinciden en ninguna.

Salen dos cosas, y las dos hacen falta:
  - los archivos sueltos a 470 y a 190 px, que son el tamano real y no dependen de como se
    mire la lamina;
  - una lamina de 940 px de ancho que los pone 1:1 al lado del cuadro entero. SE MIRA AL
    100 %: cualquier zoom la invalida, que es justamente el error que esta task tiene que
    evitar.
"""
import pathlib, subprocess
from PIL import Image, ImageDraw, ImageFont

AQUI = pathlib.Path(__file__).resolve().parent
TASK = AQUI.parent
RAIZ = TASK.parents[5]
PROGRAMA = RAIZ / "demo/race-multiview/content/.fuentes/programa.mp4"
SALIDA = TASK / "cuadros"
SALIDA.mkdir(exist_ok=True)

# (segundo del programa, casilla, que se mira ahi)
CUADROS = [
    (28.0, 4,  "el segundo en que abre la ventana. AQUAAMARINE escrito en el aleron"),
    (76.0, 10, "PENTAV y QUENTRA con el mar detras, y la tipografia inventada del clip nuevo"),
    (91.0, 12, "la rueda sobre el piano, mientras se dice la linea 15"),
]
ANCHOS = [470, 190]
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
FCH = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)

filas = []
for seg, casilla, nota in CUADROS:
    png = SALIDA / f"casilla-{casilla:02d}-t{seg:g}s-1280.png"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(seg),
                    "-i", str(PROGRAMA), "-frames:v", "1", str(png)], check=True)
    entero = Image.open(png).convert("RGB")
    chicos = {}
    for a in ANCHOS:
        alto = round(entero.height * a / entero.width)
        im = entero.resize((a, alto), Image.LANCZOS)
        im.save(SALIDA / f"casilla-{casilla:02d}-t{seg:g}s-{a}px.png")
        chicos[a] = im
    filas.append((seg, casilla, nota, entero, chicos))

# La lamina: 940 px de ancho = 470 + 190 + aire, todo 1:1.
MARGEN, AIRE = 10, 16
ANCHO = 940
alturas = [18 + max(f[4][470].height, f[4][190].height) + 14 + 15 + round(f[3].height * (ANCHO - 2*MARGEN) / f[3].width) + 26 for f in filas]
lamina = Image.new("RGB", (ANCHO, MARGEN + sum(alturas) + MARGEN), (24, 24, 26))
d = ImageDraw.Draw(lamina)
y = MARGEN
for (seg, casilla, nota, entero, chicos), alto in zip(filas, alturas):
    d.text((MARGEN, y), f"casilla {casilla}  ·  segundo {seg:g} del programa  ·  {nota}", font=F, fill=(235, 235, 235))
    y += 18
    x = MARGEN
    for a in ANCHOS:
        lamina.paste(chicos[a], (x, y))
        d.text((x, y + chicos[a].height + 2), f"{a} px de ancho — {'una caja de cuatro a 1907' if a == 470 else 'una caja de cuatro a 400, o sea telefono'}",
               font=FCH, fill=(150, 150, 155))
        x += a + AIRE
    y += max(chicos[470].height, chicos[190].height) + 14
    ancho_entero = ANCHO - 2 * MARGEN
    grande = entero.resize((ancho_entero, round(entero.height * ancho_entero / entero.width)), Image.LANCZOS)
    d.text((MARGEN, y), "el mismo cuadro a cuadro entero (reducido, solo para ubicarse)", font=FCH, fill=(150, 150, 155))
    y += 15
    lamina.paste(grande, (MARGEN, y))
    y += grande.height + 26

lamina.save(TASK / "cuadros" / "0-las-tres-casillas-a-470-y-190.jpg", quality=92)
print(f"escritos en {SALIDA}")
for f in sorted(SALIDA.iterdir()):
    print(" ", f.name, Image.open(f).size)
