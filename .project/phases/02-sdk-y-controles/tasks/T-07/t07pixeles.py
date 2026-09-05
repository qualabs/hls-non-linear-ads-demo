"""T-07 -- la prueba del cuarto: la captura reducida al 25 % de su lado, leida
en sus pixeles y mirada.

La T-04 la corrio sobre los dos colores de la barra y le encontro un defecto que
de cerca no se veia. Acá se corre sobre lo que esta task agrega --el logo y la
perilla-- y ademas se vuelve a correr sobre las marcas, porque el skin les movio
el sustrato: el riel dejo de medir lo mismo y la perilla dejo de ser blanca.

Uso: t07pixeles.py <captura.png> <medicion.json> <clave> <carpeta-de-salida>
"""
import sys, json, math, pathlib
from PIL import Image

CAPTURA = pathlib.Path(sys.argv[1])
MED = json.load(open(sys.argv[2]))[sys.argv[3]]
CLAVE = sys.argv[3]
OUT = pathlib.Path(sys.argv[4]); OUT.mkdir(parents=True, exist_ok=True)
ESCALA = 4

original = Image.open(CAPTURA).convert("RGB")
reducida = original.resize((original.width // ESCALA, original.height // ESCALA), Image.LANCZOS)
nombre_reducida = OUT / f"{CAPTURA.stem}-un-cuarto.png"
reducida.save(nombre_reducida)


def px(img, x, y):
    return tuple(img.getpixel((int(x), int(y))))


def dist(a, b):
    return round(math.dist(a, b), 1)


def luz(p):
    return round(0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2], 1)


def recorte(caja, margen=2):
    """La caja de la pagina entera, en la reducida, con un margen."""
    x = max(0, int(caja["left"] / ESCALA) - margen)
    y = max(0, int(caja["top"] / ESCALA) - margen)
    w = int(caja["width"] / ESCALA) + margen * 2
    h = int(caja["height"] / ESCALA) + margen * 2
    return (x, y, min(reducida.width, x + w), min(reducida.height, y + h))


def mirar(caja, nombre, aumento=6):
    """El recorte de la reducida, agrandado con vecino mas cercano para poder
    MIRARLO: agrandar con interpolacion inventaria nitidez que la reduccion ya
    se llevo, que es justamente lo que la prueba quiere ver."""
    if not caja:
        return None
    c = reducida.crop(recorte(caja))
    c.resize((c.width * aumento, c.height * aumento), Image.NEAREST).save(OUT / nombre)
    return {"tamanoEnLaReducida": [c.width, c.height], "archivo": nombre}


res = {"captura": CAPTURA.name, "clave": CLAVE,
       "tamano": [original.width, original.height],
       "reducida": [reducida.width, reducida.height]}

# ---- 1. el logo de la placa de los controles ------------------------------
for etiqueta, caja_placa, caja_logo, archivo in (
    ("placaDeLosControles", MED.get("placa"), MED.get("logo"), f"{CAPTURA.stem}-un-cuarto-placa.png"),
    ("placaDelEncabezado", MED.get("marca"), MED.get("logoDelEncabezado"), f"{CAPTURA.stem}-un-cuarto-encabezado.png"),
):
    if not caja_placa:
        continue
    # En fullscreen la pagina no esta en el cuadro: su caja se sigue midiendo en
    # el DOM y los pixeles de ese rectangulo son los del video, asi que leerla
    # ahi seria leer la pelicula y llamarla logo.
    if etiqueta == "placaDelEncabezado" and MED.get("fullscreen"):
        res[etiqueta] = "el encabezado de la pagina no esta en el cuadro en fullscreen"
        continue
    caja = reducida.crop(recorte(caja_logo, margen=0))
    pixeles = list(caja.getdata())
    luces = sorted(luz(p) for p in pixeles)
    # La tinta del wordmark contra el papel de la placa: si la reduccion se
    # llevo el wordmark, el minimo sube hacia el papel y el rango se cierra.
    res[etiqueta] = {
        "altoDelLogoEnLaReducida": round(caja_logo["height"] / ESCALA, 2),
        "anchoDelLogoEnLaReducida": round(caja_logo["width"] / ESCALA, 2),
        "papel": luz(px(reducida, caja_placa["left"] / ESCALA + 1, caja_placa["top"] / ESCALA + 1)),
        "tintaMasOscura": luces[0],
        "percentil5": luces[max(0, len(luces) // 20)],
        "rangoDeLuz": round(luces[-1] - luces[0], 1),
        **(mirar(caja_logo, archivo) or {})
    }

# ---- 2. la perilla, que es donde va el acento -----------------------------
if MED.get("perilla"):
    p = MED["perilla"]
    res["perilla"] = {
        "declarada": MED["colorPerilla"],
        "ladoEnLaReducida": round(p["width"] / ESCALA, 2),
        "leidaEnLaReducida": list(px(reducida, (p["left"] + p["width"] / 2) / ESCALA,
                                     (p["top"] + p["height"] / 2) / ESCALA)),
        **(mirar(p, f"{CAPTURA.stem}-un-cuarto-perilla.png", aumento=10) or {})
    }
    res["perilla"]["distanciaAlRellenoBlanco"] = dist(res["perilla"]["leidaEnLaReducida"], (255, 255, 255))

# ---- 3. las marcas, otra vez: el skin les movio el sustrato ---------------
marcas = [n for n in MED.get("nodos", []) if n["clase"] == "qa-mark"]
cues = [n for n in MED.get("nodos", []) if n["clase"] == "qa-cue"]
if marcas and cues:
    fila = lambda n: int((n["dibujado"]["top"] + n["dibujado"]["height"] / 2) / ESCALA)
    res["marcas"] = {
        "altoEnLaReducida": marcas[0]["dibujado"]["height"] / ESCALA,
        "anchoDeCadaBreak": round(marcas[0]["dibujado"]["width"] / ESCALA, 2),
        "filaDelRiel": fila(marcas[0]), "filaDelCarril": fila(cues[0]),
        "breaks": []
    }
    for i, (m, c) in enumerate(zip(marcas, cues), start=1):
        x = round((m["dibujado"]["left"] + m["dibujado"]["width"] / 2) / ESCALA)
        v = px(reducida, x, fila(marcas[0]))
        a = px(reducida, x, fila(cues[0]))
        res["marcas"]["breaks"].append({"break": i, "x": x, "marca": list(v), "cue": list(a),
                                        "distanciaRgb": dist(v, a)})
    x_libre = round((MED["riel"]["left"] + MED["riel"]["width"] * 0.85) / ESCALA)
    res["marcas"]["fueraDeUnBreak"] = {"x": x_libre,
                                       "riel": list(px(reducida, x_libre, fila(marcas[0])))}

print(json.dumps(res, indent=2))
