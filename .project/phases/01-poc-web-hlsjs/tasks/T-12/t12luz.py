"""T-12 -- la luminancia de los creativos, medida fuera del browser.

Es la contraparte offline del barrido que `t12run.py` hace en el canvas de la
pagina, y sirve para dos cosas que en el browser no se pueden hacer: recorrer
las fuentes ENTERAS —el primario son doce minutos de pelicula— para elegir la
ventana de doce segundos de cada creativo, y medir el asset ya empaquetado sin
que el reloj de reproduccion se meta en el medio.

Metodo, el mismo de la T-11 y el mismo que corre en la pagina: dos muestras por
segundo escaladas a 64x36 en rgb24, y la luma Rec.709 (0,2126 R + 0,7152 G +
0,0722 B) de cada muestra, en la escala 0..255. La ventana elegida de cada
fuente es la de doce segundos cuyo instante MAS OSCURO es el mas claro posible:
lo que arruina una captura es un instante negro adentro de la ventana y no un
promedio bajo, que es lo que se aprendio en la T-10 y en la T-11.

Uso: t12luz.py <directorio-de-salida>
"""
import subprocess, sys, json, pathlib

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
REPO = pathlib.Path(__file__).resolve().parents[5]
W, H, FPS = 64, 36, 2.0

def serie(path, vf=None, extra=None):
    """La serie de luminancias de un archivo. `vf` reemplaza el prefijo del
    filtro (vacio para una imagen fija, que con `fps` no da ningun cuadro)."""
    pre = f"fps={FPS}," if vf is None else vf
    cmd = ["ffmpeg", "-v", "error"] + (extra or []) + \
          ["-i", str(path), "-vf", pre + f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    n = W * H * 3
    out = []
    for i in range(len(raw) // n):
        f = raw[i*n:(i+1)*n]
        s = 0
        for j in range(0, n, 3):
            s += 0.2126 * f[j] + 0.7152 * f[j+1] + 0.0722 * f[j+2]
        out.append(round(s / (W * H), 1))
    return out

def resumen(l):
    return {"muestras": len(l), "min": min(l), "media": round(sum(l) / len(l), 1), "max": max(l)}

def mejor_ventana(l, dur=12.0):
    k = int(dur * FPS)
    best = None
    for i in range(0, len(l) - k + 1):
        v = l[i:i+k]
        c = (min(v), round(sum(v) / len(v), 1), round(i / FPS, 1))
        if best is None or (c[0], c[1]) > (best[0], best[1]):
            best = c
    return {"desdeSegundo": best[2], "min": best[0], "media": best[1]}

FUENTES = [  # nombre, archivo, crop previo, ventana elegida, ventana vieja
    ("Sintel trailer (adA)",          "sintel.mp4",     "crop=1280:544:0:88,", 28.5, 20),
    ("Caminandes Gran Dillama (adB)", "caminandes.mp4", "",                    35,   35),
    ("Elephants Dream teaser (adC)",  "ed.mp4",         "",                    31,   52),
]
EMPAQUETADOS = [
    ("adA -- Sintel, 28,5 a 40,5 s",           "content/adA/index.m3u8", None),
    ("adB -- Caminandes, 35 a 47 s",           "content/adB/index.m3u8", None),
    ("adC -- Elephants Dream, 31 a 43 s",      "content/adC/index.m3u8", None),
    ("primario -- Tears of Steel, 270 a 450 s","content/primary/index.m3u8", None),
    ("adImageA -- Caminandes, cuadro de 25 s", "content/adImageA/creative.jpg", ""),
    ("adImageB -- Sintel, cuadro de 6,5 s",    "content/adImageB/creative.jpg", ""),
]

res = {"metodo": "luma Rec.709 sobre el cuadro escalado a 64x36, dos muestras por segundo, escala 0..255",
       "fuentes": {}, "empaquetados": {}}

for nombre, archivo, crop, elegida, vieja in FUENTES:
    l = serie(REPO / "content/.fuentes" / archivo, vf=(crop + f"fps={FPS},") if crop else None)
    d = {"laFuenteEntera": resumen(l), "mejorVentanaDe12s": mejor_ventana(l), "serie": l}
    for etiqueta, desde in (("ventanaElegida", elegida), ("ventanaDeLaT05", vieja)):
        a = int(desde * FPS); v = l[a:a + int(12 * FPS)]
        d[etiqueta] = {"desdeSegundo": desde, **resumen(v)}
    res["fuentes"][nombre] = d
    print(f'{nombre:34s} fuente {resumen(l)}  elegida {d["ventanaElegida"]}', flush=True)

for nombre, ruta, vf in EMPAQUETADOS:
    l = serie(REPO / ruta, vf=vf)
    res["empaquetados"][nombre] = {**resumen(l), "serie": l}
    print(f'{nombre:42s} {resumen(l)}', flush=True)

(OUT / "t12-luz-de-los-assets.json").write_text(json.dumps(res, indent=2))
print("WROTE", OUT / "t12-luz-de-los-assets.json")
