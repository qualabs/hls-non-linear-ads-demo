#!/usr/bin/env python3
"""las-lineas-contra-su-casilla.py -- las cuatro casillas donde se decidio el texto, con
cuatro cuadros cada una y la linea que se dice encima.

POR QUE ESTA LAMINA. El criterio de la fase es que el relato cuente lo que se ve, y eso no
se puede auditar leyendo el guion: hay que poder poner la frase al lado de la imagen. Son
las cuatro casillas donde esta corrida tomo una decision de texto -- la 5 y la 9 porque la
linea nombraba algo que no esta, la 12 porque ademas tiene un corte adentro, y la 10 porque
la linea vieja volvio a ser cierta y la decision fue NO tocarla.

Los cuatro cuadros de cada casilla son a 0,5 / 2,5 / 4,5 / 6,5 s: un cuadro solo no alcanza
porque lo que se juzga es si la frase vale durante los ocho segundos, no en un instante.
"""
import json, pathlib, subprocess
from PIL import Image, ImageDraw, ImageFont

AQUI = pathlib.Path(__file__).resolve().parent
TASK = AQUI.parent
RAIZ = TASK.parents[5]
DEMO = RAIZ / "demo/race-multiview"
CLIPS = sorted((DEMO / "content/.fuentes/programa").glob("*.mp4"))
TIEMPOS = json.loads((DEMO / "audio/tiempos.json").read_text())
T = pathlib.Path("/dev/shm/lineas-vs-casillas"); T.mkdir(exist_ok=True)

QUE = [("06", "la chicana y los pianos ya no estan en el clip"),
       ("11", "no van en fila: van rueda a rueda"),
       ("13", "el mar aparecio, asi que la linea vieja volvio a ser cierta"),
       ("15", "el auto corre AL LADO del piano, no encima")]
SEGS = [0.5, 2.5, 4.5, 6.5]
ANCHO = 320
F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 13)
FCH = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)

filas = []
for id, nota in QUE:
    linea = next(f for f in TIEMPOS if f["id"] == id)
    clip = next(c for c in CLIPS if c.name.startswith(f"{linea['casilla']:02d}-"))
    ims = []
    for s in SEGS:
        png = T / f"{id}-{s}.png"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(s),
                        "-i", str(clip), "-frames:v", "1", str(png)], check=True)
        im = Image.open(png).convert("RGB")
        ims.append(im.resize((ANCHO, round(im.height * ANCHO / im.width)), Image.LANCZOS))
    filas.append((linea, clip.stem, nota, ims))

MARGEN, AIRE = 10, 6
alto_im = filas[0][3][0].height
ancho = MARGEN * 2 + ANCHO * 4 + AIRE * 3
alto_fila = 18 + 16 + alto_im + 18
lamina = Image.new("RGB", (ancho, MARGEN + len(filas) * alto_fila + MARGEN), (24, 24, 26))
d = ImageDraw.Draw(lamina)
y = MARGEN
for linea, clip, nota, ims in filas:
    d.text((MARGEN, y), f'linea {linea["id"]}  ·  casilla {linea["casilla"]} ({clip})  ·  '
                        f'segundos {linea["inicio"]:.2f} a {linea["fin"]:.2f} del programa', font=FCH, fill=(150, 150, 155))
    y += 16
    d.text((MARGEN, y), f'"{linea["texto"]}"', font=F, fill=(245, 245, 245))
    y += 18
    x = MARGEN
    for im in ims:
        lamina.paste(im, (x, y)); x += ANCHO + AIRE
    y += alto_im
    d.text((MARGEN, y + 2), f"0,5 / 2,5 / 4,5 / 6,5 s del clip  —  {nota}", font=FCH, fill=(150, 150, 155))
    y += 18
sal = TASK / "cuadros" / "2-las-lineas-contra-su-casilla.jpg"
lamina.save(sal, quality=92)
print(sal, lamina.size)
