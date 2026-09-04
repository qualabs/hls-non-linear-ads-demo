"""T-04 -- la captura reducida a un cuarto, leida en sus pixeles.

La prueba barata de que los dos colores se distinguen a distancia: se reduce la
captura a TAMANO REAL al 25 % de su lado y se leen los pixeles de la imagen
reducida, no un estilo computado. Es la misma leccion que este repositorio ya
pago dos veces con dos falsos "OK".

Uso: t04pixeles.py <captura.png> <medicion.json> <clave> <salida.png>
"""
import sys, json, subprocess, pathlib, math

CAPTURA = pathlib.Path(sys.argv[1])
MEDICION = json.load(open(sys.argv[2]))[sys.argv[3]]
SALIDA = pathlib.Path(sys.argv[4])
ESCALA = 4  # un cuarto de lado

subprocess.run(["convert", str(CAPTURA), "-resize", "25%", str(SALIDA)], check=True)


def pixel(img, x, y):
    out = subprocess.run(["convert", str(img), "-format", f"%[pixel:p{{{x},{y}}}]", "info:"],
                         capture_output=True, text=True, check=True).stdout.strip()
    nums = out[out.find("(") + 1:out.find(")")].split(",")
    return tuple(int(float(n)) for n in nums[:3])


def distancia(a, b):
    return round(math.dist(a, b), 1)


marcas = [n for n in MEDICION["nodos"] if n["clase"] == "qa-mark"]
cues = [n for n in MEDICION["nodos"] if n["clase"] == "qa-cue"]
riel = MEDICION["riel"]

def fila_del_centro(nodo):
    """La fila de la imagen reducida que cae ENTERA adentro del carril.

    Con `round` el centro de un carril de 8 px que arranca en una y par cae
    justo en el borde entre dos filas y la lectura sale mitad carril y mitad
    fondo -- que es una medicion del redondeo y no del color. Truncar toma la
    fila que empieza antes del centro, y esa fila esta contenida en el carril
    siempre que el carril mida al menos dos filas, que es lo que la reduccion
    tiene que dejar en pie.
    """
    return int((nodo["dibujado"]["top"] + nodo["dibujado"]["height"] / 2) / ESCALA)


filas = {
    "riel (marca concurrente)": fila_del_centro(marcas[0]),
    "carril de abajo (cue de interstitial)": fila_del_centro(cues[0]),
}

resultado = {
    "captura": CAPTURA.name,
    "reducida": SALIDA.name,
    "tamano": subprocess.run(["identify", "-format", "%wx%h", str(SALIDA)],
                             capture_output=True, text=True, check=True).stdout,
    "tamanoOriginal": subprocess.run(["identify", "-format", "%wx%h", str(CAPTURA)],
                                     capture_output=True, text=True, check=True).stdout,
    "alturaDeLasMarcasEnLaReducida": {
        "marca": marcas[0]["dibujado"]["height"] / ESCALA,
        "cue": cues[0]["dibujado"]["height"] / ESCALA,
        "anchoDeCadaBreak": round(marcas[0]["dibujado"]["width"] / ESCALA, 2)
    },
    "filasLeidas": filas,
    "breaks": [],
    "fueraDeUnBreak": {}
}

for i, (m, c) in enumerate(zip(marcas, cues), start=1):
    x = round((m["dibujado"]["left"] + m["dibujado"]["width"] / 2) / ESCALA)
    violeta = pixel(SALIDA, x, filas["riel (marca concurrente)"])
    amarillo = pixel(SALIDA, x, filas["carril de abajo (cue de interstitial)"])
    resultado["breaks"].append({
        "break": i, "x": x,
        "declarado": {"marca": m["color"], "cue": c["color"]},
        "leidoEnLaReducida": {"marca": list(violeta), "cue": list(amarillo)},
        "distanciaRgbEntreLosDos": distancia(violeta, amarillo)
    })

# Un punto del riel que no es un break, para que el contraste de arriba sea
# contra algo y no contra si mismo.
x_libre = round((riel["left"] + riel["width"] * 0.85) / ESCALA)
resultado["fueraDeUnBreak"] = {
    "x": x_libre,
    "riel": list(pixel(SALIDA, x_libre, filas["riel (marca concurrente)"])),
    "carrilDeAbajo": list(pixel(SALIDA, x_libre, filas["carril de abajo (cue de interstitial)"]))
}

print(json.dumps(resultado, indent=2))
