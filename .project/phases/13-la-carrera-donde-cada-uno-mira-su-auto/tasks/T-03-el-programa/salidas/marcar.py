"""marcar.py -- dibuja los rectangulos de medicion sobre el cuadro, para poder MIRARLOS
antes de creerle a un numero salido de ellos.

POR QUE EXISTE. Un rectangulo puesto a ciegas mide lo que le toca: un pedazo de asfalto, la
sombra de abajo del alerón, el pasto del costado. El numero que sale de ahi tiene la misma
pinta que el bueno. La T-02 dejo escrito el caso extremo: un recorte sobre el alerón NEGRO
devolvia dE00 7,2 contra la ficha de RUNTAK -- un numero excelente -- calculado sobre UN
pixel. Asi que cada juego de rectangulos se dibuja y se mira, y recien despues se mide.

  python3 marcar.py <cuadro.png> <rects.json> <salida.png>
"""
import json
import sys

from PIL import Image, ImageDraw

img = Image.open(sys.argv[1]).convert("RGB")
d = ImageDraw.Draw(img)
for it in json.load(open(sys.argv[2])):
    x, y, w, h = it["rect"]
    color = (255, 0, 0) if not it["etiqueta"].startswith("CTRL") else (0, 128, 255)
    d.rectangle([x, y, x + w, y + h], outline=color, width=3)
    d.text((x + 2, max(0, y - 12)), it["etiqueta"], fill=color)
img.save(sys.argv[3])
print(sys.argv[3])
