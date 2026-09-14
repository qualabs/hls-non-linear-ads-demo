"""medir-verde.py -- el verde de PENTAV, medido igual en varios clips.

QUE MIDE. Renombrar el color de la casilla 10 de APPLE GREEN a LIME GREEN puede correr el
tono, y PENTAV tiene que seguir siendo el mismo auto que en las casillas 6 y 7, que no se
tocaron. Se toma la mediana RGB de los pixeles claramente verdes -- G por encima de R y de
B con margen, y no oscuros -- sobre ocho cuadros del clip.

LA REFERENCIA NO SALE DE ESTE CLIP. Se compara contra las casillas 6 y 7, que son las otras
dos donde corre PENTAV y que siguen diciendo APPLE GREEN. Y el CONTROL NEGATIVO es la
casilla 5, donde el auto es BRIGHT AQUAMARINE: si la medida no lo separa del verde, no mide
el tono sino "hay algo verdoso en cuadro".
"""
import subprocess, sys, statistics
from PIL import Image
import io, os

def verde_de(clip):
    px = []
    for s in range(8):
        raw = subprocess.run(
            ["ffmpeg","-hide_banner","-loglevel","error","-ss",str(s),"-i",clip,
             "-frames:v","1","-f","image2pipe","-vcodec","png","-"],
            capture_output=True).stdout
        im = Image.open(io.BytesIO(raw)).convert("RGB")
        for r,g,b in im.getdata():
            if g > r + 25 and g > b + 25 and g > 60:
                px.append((r,g,b))
    if not px:
        return None, 0
    return tuple(int(statistics.median(c[i] for c in px)) for i in range(3)), len(px)

D = sys.argv[1]
for etiqueta, nombre in [
        ("REFERENCIA  casilla  6 (PENTAV, APPLE GREEN, sin tocar)", "06-runtak-pentav-frenada"),
        ("REFERENCIA  casilla  7 (PENTAV, APPLE GREEN, sin tocar)", "07-quentra-sobrepaso"),
        ("MEDIDA      casilla 10 (PENTAV, LIME GREEN, nueva)     ", "10-pentav-quentra-eses"),
        ("CONTROL -   casilla  5 (NOCTEV, AQUAMARINE, no verde)  ", "05-noctev-chicana"),
        ("CONTROL -   casilla 10 RECHAZADA (APPLE GREEN)         ",
         "rechazados-la-marca-en-la-carroceria/10-pentav-quentra-eses"),
]:
    ruta = os.path.join(D, nombre + ".mp4")
    if not os.path.exists(ruta):
        print("%s  (no esta)" % etiqueta); continue
    rgb, n = verde_de(ruta)
    print("%s  %s  #%02X%02X%02X  (%d px)"
          % (etiqueta, rgb, rgb[0], rgb[1], rgb[2], n) if rgb
          else "%s  sin pixeles verdes" % etiqueta)
