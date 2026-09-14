"""las-laminas.py -- las cuatro laminas de esta task, hechas por un script y no a mano para
que se puedan rehacer cuando un clip se regenere.

  1. LOS OCHO CLIPS, tres cuadros cada uno -- principio, medio y final. Tres y no uno
     porque lo que hay que poder ver de un vistazo no es como se ve un cuadro sino si el
     mundo se sostiene adentro del clip, que es el modo de falla que costo nueve
     regeneraciones en el programa.
  2. EL CRUCE CONTRA EL PROGRAMA: el amarillo de la camara al lado del amarillo de la
     casilla 8, que es el seguimiento cerrado de CALDRIX que cae DENTRO de la ventana.
  3. LA CAMARA QUE NO MIRA ATRAS: los dos rechazados, donde el auto violeta quedo ADELANTE.
  4. AL ANCHO DE UNA CAJA: el mismo cuadro a 470 px -- una de cuatro cajas a 1907 de ancho --
     y a 190 px -- una de cuatro a 400, o sea un telefono --, que es como se va a ver de
     verdad. Es la lamina que contesta si el color identifica al auto, porque a cuadro
     entero identifica cualquier cosa.

  python3 las-laminas.py <carpeta de trabajo> <carpeta lamina/>
"""
import os
import sys

from PIL import Image, ImageDraw

T, OUT = sys.argv[1], sys.argv[2]
CUADROS, PROG = os.path.join(T, "cuadros"), os.path.join(T, "cuadros-programa")
os.makedirs(OUT, exist_ok=True)

CLIPS = ["01-arco-recta", "02-ponton-curva-larga", "03-casco-costa", "04-morro-costa",
         "05-rueda-piano", "06-arco-tribuna", "07-aleron-recta", "08-arco-curvon"]
ANGULO = {"01-arco-recta": "arco de seguridad, recta principal",
          "02-ponton-curva-larga": "ponton, curva larga",
          "03-casco-costa": "casco del piloto, tramo costero",
          "04-morro-costa": "morro, tramo costero",
          "05-rueda-piano": "rueda delantera sobre el piano",
          "06-arco-tribuna": "arco de seguridad, frente a la tribuna",
          "07-aleron-recta": "aleron trasero mirando adelante, recta",
          "08-arco-curvon": "arco de seguridad, curvon"}


def fila(nombre, tiempos, ancho=420, etiqueta=None):
    ims = [Image.open(os.path.join(CUADROS, f"{nombre}-t{t}.png")).convert("RGB")
           for t in tiempos]
    h = int(720 * ancho / 1280)
    fila = Image.new("RGB", (ancho * len(ims), h + 24), (16, 16, 16))
    for i, im in enumerate(ims):
        fila.paste(im.resize((ancho, h)), (i * ancho, 24))
    d = ImageDraw.Draw(fila)
    d.text((8, 7), etiqueta or nombre, fill=(255, 235, 60))
    return fila


# --- 1. los ocho ---------------------------------------------------------------------
filas = [fila(c, ["0.2", "4.0", "7.8"], etiqueta=f"{c}   --   {ANGULO[c]}   --   t=0,2 / 4,0 / 7,8 s")
         for c in CLIPS]
W, H = filas[0].size
uno = Image.new("RGB", (W, H * len(filas) + 34), (16, 16, 16))
ImageDraw.Draw(uno).text((10, 11), "CALDRIX, camara de a bordo -- los ocho clips, 64 s", fill=(255, 255, 255))
for i, f in enumerate(filas):
    uno.paste(f, (0, 34 + i * H))
uno.save(os.path.join(OUT, "1-lamina-de-contacto.jpg"), quality=88)

# --- 2. el cruce contra el programa ----------------------------------------------------
izq = Image.open(os.path.join(CUADROS, "01-arco-recta-t4.0.png")).convert("RGB")
med = Image.open(os.path.join(CUADROS, "05-rueda-piano-t4.0.png")).convert("RGB")
der = Image.open(os.path.join(PROG, "08-caldrix-cerrado-t4.0.png")).convert("RGB")
A = 620
h = int(720 * A / 1280)
cruce = Image.new("RGB", (A * 3, h + 52), (16, 16, 16))
for i, im in enumerate((izq, med, der)):
    cruce.paste(im.resize((A, h)), (i * A, 44))
d = ImageDraw.Draw(cruce)
d.text((10, 8), "EL CRUCE: el mismo auto visto desde su propia camara y desde el programa, "
                "los dos DENTRO de la ventana de la oferta", fill=(255, 255, 255))
for i, txt in enumerate(["camara de a bordo, clip 1   #FCF855",
                         "camara de a bordo, clip 5   #D5C30C",
                         "programa, casilla 8 (s 56-64)   #C1A70E"]):
    d.text((i * A + 10, 28), txt, fill=(255, 235, 60))
cruce.save(os.path.join(OUT, "2-el-cruce-contra-el-programa.jpg"), quality=88)

# --- 3. la camara que no mira atras ----------------------------------------------------
rech = [Image.open(os.path.join(T, "rechazados", f"{n}-t4.0.png")).convert("RGB")
        for n in ("03-trasera-marvok", "07-trasera-costa")]
A = 640
h = int(720 * A / 1280)
r = Image.new("RGB", (A * 2, h + 52), (16, 16, 16))
for i, im in enumerate(rech):
    r.paste(im.resize((A, h)), (i * A, 44))
d = ImageDraw.Draw(r)
d.text((10, 8), "LO QUE VOLVIO CUANDO SE PIDIO UNA CAMARA MIRANDO HACIA ATRAS: la camara "
                "quedo mirando adelante y el auto violeta quedo ADELANTE", fill=(255, 255, 255))
for i, txt in enumerate(["clip 3, rechazado -- MARVOK adelante",
                         "clip 7, rechazado -- MARVOK adelante, y es un auto de ruedas cubiertas"]):
    d.text((i * A + 10, 28), txt, fill=(255, 120, 120))
r.save(os.path.join(OUT, "3-la-camara-que-no-mira-atras.jpg"), quality=88)

# --- 4. al ancho de una caja -----------------------------------------------------------
# 470 px es una de cuatro cajas a 1907 de ancho; 190 px es una de cuatro a 400. Los dos
# anchos son los que este proyecto ya usa para mirar la grilla.
muestras = ["01-arco-recta", "04-morro-costa", "05-rueda-piano", "07-aleron-recta"]
cajas = Image.new("RGB", (470 * len(muestras), 264 + 107 + 60), (16, 16, 16))
d = ImageDraw.Draw(cajas)
d.text((10, 8), "AL ANCHO DE UNA CAJA: arriba 470 px (una de cuatro a 1907), abajo 190 px "
                "(una de cuatro a 400, o sea telefono)", fill=(255, 255, 255))
for i, n in enumerate(muestras):
    im = Image.open(os.path.join(CUADROS, f"{n}-t4.0.png")).convert("RGB")
    cajas.paste(im.resize((470, 264)), (i * 470, 28))
    cajas.paste(im.resize((190, 107)), (i * 470 + 140, 28 + 264 + 12))
    d.text((i * 470 + 8, 28 + 264 + 12 + 107 + 4), n, fill=(255, 235, 60))
cajas.save(os.path.join(OUT, "4-al-ancho-de-una-caja.jpg"), quality=88)

# --- 5. la carroceria de cerca, con su control ------------------------------------------
# Cada recorte a resolucion completa y ampliado x2 con NEAREST, que no inventa bordes: lo
# que se lea estaba en el pixel. Un recorte reducido no muestra una palabra de cuatro letras
# en un ponton, que es exactamente lo que hay que poder decidir.
RECORTES = {"01-arco-recta": (340, 140), "02-ponton-curva-larga": (0, 300),
            "03-casco-costa": (300, 180), "04-morro-costa": (400, 480),
            "05-rueda-piano": (0, 440), "06-arco-tribuna": (340, 430),
            "07-aleron-recta": (340, 400), "08-arco-curvon": (340, 430)}
tiles = []
for n, (x, y) in RECORTES.items():
    im = Image.open(os.path.join(CUADROS, f"{n}-t4.0.png")).convert("RGB")
    im = im.crop((x, y, x + 600, y + 240)).resize((1200, 480), Image.NEAREST)
    ImageDraw.Draw(im).text((8, 8), n, fill=(255, 40, 40))
    tiles.append(im)
# EL CONTROL, sin el cual un recorte sin letras no prueba nada -- podria ser que no pueda
# mostrar ninguna: el mismo recorte, con el mismo comando, sobre la casilla 12 del programa,
# donde el auto magenta SI lleva letras en la carroceria.
ctrl = Image.open(os.path.join(PROG, "12-runtak-t2.0.png")).convert("RGB")
ctrl = ctrl.crop((300, 300, 900, 540)).resize((1200, 480), Image.NEAREST)
ImageDraw.Draw(ctrl).text((8, 8), "CONTROL -- programa, casilla 12: aca SI hay letras en la "
                                  "carroceria", fill=(0, 255, 255))
tiles.append(ctrl)
W, H = tiles[0].size
s = Image.new("RGB", (W * 2, H * ((len(tiles) + 1) // 2)))
for i, t in enumerate(tiles):
    s.paste(t, ((i % 2) * W, (i // 2) * H))
s.resize((W, H * ((len(tiles) + 1) // 2) // 2)).save(
    os.path.join(OUT, "5-la-carroceria-de-cerca.jpg"), quality=90)

for f in sorted(os.listdir(OUT)):
    print(" ", f, os.path.getsize(os.path.join(OUT, f)) // 1024, "KB")
