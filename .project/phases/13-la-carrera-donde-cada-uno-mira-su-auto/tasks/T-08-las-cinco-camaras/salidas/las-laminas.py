"""las-laminas.py -- las laminas de esta task, hechas por un script para que se puedan
rehacer cuando un clip se regenere.

  1. UNA LAMINA POR CAMARA: los ocho clips, tres cuadros cada uno -- principio, medio y
     final. TRES Y NO UNO por la razon que la T-05 dejo escrita: lo que hay que poder ver de
     un vistazo no es como se ve un cuadro sino si el mundo se sostiene ADENTRO del clip, que
     es el modo de falla que costo nueve regeneraciones en el programa.

  2. LA LAMINA DE LAS SEIS JUNTAS, que es la comprobacion propia de esta task y la unica que
     ninguna anterior pudo hacer. El defecto que busca es que los seis feeds NO parezcan la
     misma carrera: mismo circuito, misma hora, mismo cielo, mismos pianos. Eso solo se ve
     comparandolas, y por eso las seis van en una grilla y no una debajo de la otra.

  3. LAS SEIS AL ANCHO DE UNA CAJA -- 470 px, una de cuatro cajas a 1907 de ancho, y 190 px,
     una de cuatro a 400, o sea un telefono --. Es como se van a ver de verdad, y es la
     lamina que contesta si el color identifica al auto: a cuadro entero identifica
     cualquier cosa.

  python3 las-laminas.py <carpeta de cuadros> <carpeta lamina/> <camara> [camara ...]
  python3 las-laminas.py <carpeta de cuadros> <carpeta lamina/> --seis
"""
import os
import sys

from PIL import Image, ImageDraw

CUADROS, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

ORDEN = ["caldrix", "marvok", "noctev", "runtak", "pentav", "quentra"]
CLASE = {"caldrix": "a bordo", "marvok": "a bordo", "pentav": "a bordo",
         "noctev": "seguimiento", "runtak": "seguimiento", "quentra": "seguimiento"}


def cuadro(cam, clip, t):
    return Image.open(os.path.join(CUADROS, cam, "%s-t%s.png" % (clip, t))).convert("RGB")


def clips_de(cam):
    d = os.path.join(CUADROS, cam)
    return sorted({f.rsplit("-t", 1)[0] for f in os.listdir(d) if f.endswith(".png")})


def fila(cam, clip, ancho=420):
    ims = [cuadro(cam, clip, t) for t in ("0.2", "4.0", "7.8")]
    h = int(720 * ancho / 1280)
    f = Image.new("RGB", (ancho * len(ims), h + 24), (16, 16, 16))
    for i, im in enumerate(ims):
        f.paste(im.resize((ancho, h)), (i * ancho, 24))
    ImageDraw.Draw(f).text((8, 7), "%s   --   t=0,2 / 4,0 / 7,8 s" % clip, fill=(255, 235, 60))
    return f


def apilar(filas, titulo, alto_tit=34):
    W, H = filas[0].size
    im = Image.new("RGB", (W, H * len(filas) + alto_tit), (16, 16, 16))
    ImageDraw.Draw(im).text((10, 11), titulo, fill=(255, 255, 255))
    for i, f in enumerate(filas):
        im.paste(f, (0, alto_tit + i * H))
    return im


def lamina_de_camara(cam):
    clips = clips_de(cam)
    im = apilar([fila(cam, c) for c in clips],
                "%s, camara de %s -- los %d clips, %d s"
                % (cam.upper(), CLASE[cam], len(clips), len(clips) * 8))
    p = os.path.join(OUT, "1-%s.jpg" % cam)
    im.save(p, quality=88)
    print(p)


def lamina_de_las_seis():
    """Las seis en grilla de 3x2, el mismo instante de sus feeds (t=4,0 del clip 4).

    EL INSTANTE ES EL MISMO PARA LAS SEIS a proposito: lo que se compara es el MUNDO --la
    luz, el cielo, el asfalto, los pianos, la valla--, y dos cuadros de momentos distintos
    meterian la hora del dia adentro de la comparacion.
    """
    ancho = 620
    h = int(720 * ancho / 1280)
    cel_h = h + 26
    grilla = Image.new("RGB", (ancho * 3, cel_h * 2 + 40), (16, 16, 16))
    d = ImageDraw.Draw(grilla)
    d.text((10, 13), "Las seis camaras del catalogo, el mismo instante de cada feed -- "
                     "lo que se mira es si es la misma carrera", fill=(255, 255, 255))
    for i, cam in enumerate(ORDEN):
        clips = clips_de(cam)
        im = cuadro(cam, clips[3], "4.0")
        x, y = (i % 3) * ancho, 40 + (i // 3) * cel_h
        grilla.paste(im.resize((ancho, h)), (x, y + 26))
        d.text((x + 8, y + 8), "%d. %s  (%s)  --  %s"
               % (i + 1, cam.upper(), CLASE[cam], clips[3]), fill=(255, 235, 60))
    p = os.path.join(OUT, "2-las-seis-en-grilla.jpg")
    grilla.save(p, quality=90)
    print(p)

    # A TAMANO DE CAJA. 470 px es una de cuatro cajas a 1907 de ancho; 190 px es una de
    # cuatro a 400, o sea un telefono. Las dos tiras van con los seis en el mismo orden que
    # el selector, que es como el espectador las va a comparar.
    for px, nombre in ((470, "3-al-ancho-de-una-caja-470.jpg"),
                       (190, "4-al-ancho-de-una-caja-190.jpg")):
        hh = int(720 * px / 1280)
        tira = Image.new("RGB", (px * 6, hh + 22), (16, 16, 16))
        dd = ImageDraw.Draw(tira)
        for i, cam in enumerate(ORDEN):
            clips = clips_de(cam)
            tira.paste(cuadro(cam, clips[3], "4.0").resize((px, hh)), (i * px, 22))
            dd.text((i * px + 4, 6), cam.upper(), fill=(255, 235, 60))
        p = os.path.join(OUT, nombre)
        tira.save(p, quality=92)
        print(p)


if sys.argv[3] == "--seis":
    lamina_de_las_seis()
else:
    for cam in sys.argv[3:]:
        lamina_de_camara(cam)
