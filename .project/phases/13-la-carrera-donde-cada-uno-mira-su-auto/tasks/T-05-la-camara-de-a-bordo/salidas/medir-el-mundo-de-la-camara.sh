#!/usr/bin/env bash
# medir-el-mundo-de-la-camara.sh -- si los ocho clips de la camara de a bordo son la misma
# carrera que el programa, y si son la misma carrera entre si.
#
# QUE ESTA EN JUEGO. Es el R1 de PHASE.md --"las seis camaras no se leen como la misma
# carrera"-- medido en el unico feed que se puede cruzar contra el programa. Y es ademas la
# pregunta de la constancia: ocho clips seguidos de la misma cabina son la corrida mas larga
# de una misma cosa que esta fase tiene, asi que es donde primero aparece que el modelo se
# separa de si mismo entre generaciones.
#
# QUE SE MIDE. Los dos parches que estan en todos los cuadros y que el parrafo del mundo
# describe: el ASFALTO ("dry mid-grey asphalt") y el CIELO ("a pale sky", "high, even
# overcast"). No se mide "el mismo circuito", que no es medible con esto y lo decide el ojo
# sobre la lamina; se mide si la luz y el piso son los mismos.
#
# LA REFERENCIA NO SALE DE ESTE CALCULO, que es lo unico que la hace valer: son los parches
# de asfalto de las cuatro casillas del programa donde corre CALDRIX, con los recortes que
# dejo la T-03 --otra task, otras imagenes, otro dia-- y cuyo resultado ya esta publicado:
# entre los catorce clips del programa el asfalto se movia 4,6 a 9,2 y el cielo 5,8.
#
# LOS DOS CONTROLES SON LOS DE LA T-02 Y LA T-03, y sin ellos un numero chico no distingue
# entre "coinciden" y "este instrumento devuelve siempre lo mismo":
#   1. el mismo cuadro virado a hora dorada -- si el numero no se mueve, no mide la luz.
#   2. un cuadro de OTRO mundo, metraje real de la demo del break -- si no se mueve, no
#      mide el lugar.
#
# Los recortes de la camara son los MISMOS que usa el-color-de-caldrix.py (CTRL-asfalto y
# CIELO de `rects/`), que ya se dibujaron sobre su cuadro y se miraron.
set -euo pipefail
cd "$(dirname "$0")"

RAIZ=$(cd ../../../../../.. && pwd)
T02=../../T-02-el-sondeo-de-dos-clips/salidas
T03RECTS=../../T-03-el-programa/salidas/rects
T=${1:?uso: medir-el-mundo-de-la-camara.sh <carpeta de trabajo en /dev/shm>}

PY=/dev/shm/t03venv/bin/python
[ -x "$PY" ] || { uv venv --python 3.12 /dev/shm/t03venv >/dev/null 2>&1
                  uv pip install --python "$PY" pillow numpy >/dev/null 2>&1; }

# CONTROL 1 -- la misma imagen con la luz cambiada (la virada es la de la T-02, letra por letra).
ffmpeg -hide_banner -loglevel error -y -i "$T/cuadros/01-arco-recta-t4.0.png" \
  -vf "colorbalance=rs=.25:gs=.05:bs=-.20:rm=.20:bm=-.18:rh=.15:bh=-.12,eq=saturation=1.25:gamma=0.92" \
  "$T/cuadros/CONTROL-hora-dorada.png"
# CONTROL 2 -- otro mundo: metraje real de la demo del break.
ffmpeg -hide_banner -loglevel error -y -ss 3 -i "$RAIZ/demo/hydration-break/content/.fuentes/9439150.mp4" \
  -frames:v 1 -vf scale=1280:720 "$T/cuadros/CONTROL-otro-mundo.png"

# El json se arma leyendo los rects que ya estan dibujados y mirados, en vez de volver a
# tipear las coordenadas: dos copias del mismo rectangulo se despegan.
"$PY" - "$T" > "$T/mundo.json" <<'PY'
import glob, json, os, sys
T = sys.argv[1]
items = []
for j in sorted(glob.glob("rects/*.json")):
    base = os.path.basename(j)[:-5]
    for it in json.load(open(j)):
        if it["etiqueta"] in ("CTRL-asfalto", "CIELO"):
            que = "asfalto" if it["etiqueta"] == "CTRL-asfalto" else "cielo"
            items.append({"etiqueta": "CAM %-8s %s" % (que, base.split("-t")[0][:14]),
                          "cuadro": f"{T}/cuadros/{base}.png", "rect": it["rect"]})
# el asfalto de las cuatro casillas del programa donde corre CALDRIX: los recortes son de
# la T-03 y los cuadros salen de los mp4 del programa.
for j in sorted(glob.glob("../../T-03-el-programa/salidas/rects/*caldrix*.json")):
    base = os.path.basename(j)[:-5]
    for it in json.load(open(j)):
        if it["etiqueta"] == "CTRL-asfalto":
            items.append({"etiqueta": "PROG asfalto %s" % base.split("-t")[0][:14],
                          "cuadro": f"{T}/cuadros-programa/{base}.png", "rect": it["rect"]})
items.append({"etiqueta": "CTRL hora dorada asfalto", "cuadro": f"{T}/cuadros/CONTROL-hora-dorada.png",
              "rect": [440, 230, 180, 35]})
items.append({"etiqueta": "CTRL otro mundo piso", "cuadro": f"{T}/cuadros/CONTROL-otro-mundo.png",
              "rect": [600, 430, 300, 60]})
json.dump(items, sys.stdout, indent=1)
PY

"$PY" -W ignore "$T02/comparar-mundo.py" "$T/mundo.json"
