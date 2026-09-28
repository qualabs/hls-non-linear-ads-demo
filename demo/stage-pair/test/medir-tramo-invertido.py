#!/usr/bin/env python3
"""La medición del tramo invertido de esta demo, con su control.

Lo que se mide: **para cada break, el segundo del programa en que cada pane entra
y en que sale**. Tienen que ser el mismo en los dos, y eso es lo que el ADR 0082
compró al darle a cada break su propio asset-list lineal con la duración de ese
break.

Lo que se lee es **el estado del navegador** y no una captura, que es el
instrumento que la fase 03 eligió y argumentó; la mecánica de cada lectura está
en la cabecera de `banco-de-medicion.html`, que es la página que este script
maneja.

────────────────────────────────────────────────────────────────────────────────
EL CONTROL, Y SIN ÉL ESTA MEDICIÓN NO PRUEBA NADA
────────────────────────────────────────────────────────────────────────────────
Dos panes que entran y salen en el mismo segundo es un resultado negativo -- "no
hay diferencia" -- y un negativo lo produce igual una señalización correcta que un
instrumento que no sabe ver una diferencia. Así que se corre DOS veces:

    la medición    la señalización tal cual                 -> tiene que dar IGUAL
    el control     los tres breaks concurrentes de otra
                   duración que su lineal, que es
                   exactamente lo que compatibility-pair
                   tiene                                    -> tiene que dar DISTINTO

El control se enciende con `CONTROL_DURACION_CONCURRENTE`, que es una palanca de
`senalizar-contenido.sh`. Si el control diera igual, lo que se midió es el
instrumento.

────────────────────────────────────────────────────────────────────────────────
USO
────────────────────────────────────────────────────────────────────────────────
    medir-tramo-invertido.py --puerto 8097 [--decoders 1|2] [--images 1|0]

Mide sólo los breaks con default lineal: en el que no tiene (ADR 0087) el pane
de fábrica no reproduce nada y no hay tramo que comparar.

El intérprete es **el del skill playwright**, que es el que tiene el paquete y el
Chrome real del sistema configurado; es el mismo que resuelve
`scripts/puente-a-video.sh`, y este archivo se re-ejecuta con él si el `python3`
con el que lo invocaron no lo tiene. Se puede pisar con `PY=<ruta>`.

Levanta su propio `server.mjs` en ese puerto y lo baja **por el PID que guardó**.
El puerto se pasa a propósito y no se adivina: en esta máquina corren demos de
Nicolás en 8080, 8081 y 8082.
"""

import argparse
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

# El intérprete con playwright, resuelto una sola vez y por el mismo camino que
# scripts/puente-a-video.sh: un import que falla no es una razón para no medir.
_PY = os.environ.get("PY", "/home/nicolas/Skills/playwright/.venv/bin/python")
try:
    import playwright  # noqa: F401
except ModuleNotFoundError:
    if not os.access(_PY, os.X_OK):
        sys.exit(f"falta playwright, y el python del skill no está en {_PY}")
    os.execv(_PY, [_PY, os.path.abspath(__file__), *sys.argv[1:]])

DEMO = Path(__file__).resolve().parent.parent
SDK = DEMO.parent.parent

# Cuánto puede separarse la entrada o la salida de un pane de la del otro para que
# se siga leyendo como "el mismo segundo". Es medio segundo y no cero, y el motivo
# es del instrumento y no de la señalización: se muestrea cada 100 ms y los dos
# panes son dos players independientes que no comparten reloj de muestreo. El
# defecto que esta medición busca -- el de compatibility-pair -- vale DOCE
# segundos, así que media décima de holgura no lo puede esconder.
HOLGURA = 0.5


def senalizar(control=None):
    entorno = dict(os.environ)
    if control:
        entorno["CONTROL_DURACION_CONCURRENTE"] = str(control)
    subprocess.run(
        [str(DEMO / "scripts/senalizar-contenido.sh")],
        cwd=DEMO, env=entorno, check=True, stdout=subprocess.DEVNULL
    )


def medir(puerto, decoders, images):
    from playwright.sync_api import sync_playwright

    stage = json.loads((DEMO / "stage.json").read_text())
    src = "/" + stage["playlists"]["par"]
    url = (f"http://localhost:{puerto}/test/banco-de-medicion.html"
           f"?src={src}&decoders={decoders}&images={images}")

    with sync_playwright() as pw:
        navegador = pw.chromium.launch(
            channel="chrome",
            args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
        )
        try:
            page = navegador.new_page(viewport={"width": 1280, "height": 480})
            page.goto(url)
            # El script de la página es un módulo con un `await` de nivel
            # superior, así que `window.medir` no existe todavía cuando el goto
            # vuelve. Evaluarlo sin esperar funciona una vez de cada dos, que es
            # peor que no funcionar nunca.
            page.wait_for_function("() => typeof window.medir === 'function'")
            return page.evaluate("() => window.medir()")
        finally:
            navegador.close()


def informe(titulo, filas, stage, esperado_igual):
    print(f"\n== {titulo} ==")
    rojo = 0
    for fila, brk in zip(filas, [b for b in stage["breaks"] if b["lineal"]]):
        s, d = fila["stock"], fila["demo"]
        falta = any(k not in x for x in (s, d) for k in ("entra", "sale"))
        if falta:
            print(f"  break {fila['break'].upper()}  INCOMPLETO  {json.dumps(fila)}")
            rojo += 1
            continue
        de, ds = abs(s["entra"] - d["entra"]), abs(s["sale"] - d["sale"])
        igual = de <= HOLGURA and ds <= HOLGURA
        veredicto = "IGUAL   " if igual else "DISTINTO"
        print(
            f"  break {fila['break'].upper()}  "
            f"fábrica {s['entra']:7.3f} -> {s['sale']:7.3f}   "
            f"nuestro {d['entra']:7.3f} -> {d['sale']:7.3f}   "
            f"delta entrada {de:6.3f} s  salida {ds:6.3f} s   {veredicto}"
        )
        if igual is not esperado_igual:
            rojo += 1
    return rojo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--puerto", type=int, required=True)
    ap.add_argument("--decoders", type=int, default=2, choices=[1, 2])
    ap.add_argument("--images", type=int, default=1, choices=[0, 1])
    ap.add_argument("--control-duracion", type=float, default=24.0)
    args = ap.parse_args()

    stage = json.loads((DEMO / "stage.json").read_text())

    server = subprocess.Popen(
        ["node", "server.mjs", f"demo/{DEMO.name}"],
        cwd=SDK, env={**os.environ, "PORT": str(args.puerto)},
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    print(f"server PID {server.pid} en el puerto {args.puerto}")
    time.sleep(1.0)
    rojo = 0
    try:
        senalizar()
        rojo += informe(
            f"LA MEDICIÓN — señalización tal cual, {args.decoders} decodificadores, imágenes {args.images}",
            medir(args.puerto, args.decoders, args.images), stage, esperado_igual=True
        )
        senalizar(control=args.control_duracion)
        rojo += informe(
            f"EL CONTROL — el break concurrente dura {args.control_duracion} s y su lineal no",
            medir(args.puerto, args.decoders, args.images), stage, esperado_igual=False
        )
    finally:
        # Por el PID que se guardó, nunca por patrón: en esta máquina hay otras
        # demos corriendo y un patrón que parece propio alcanza a las de al lado.
        server.send_signal(signal.SIGTERM)
        server.wait(timeout=10)
        print(f"\nserver {server.pid} bajado")
        # Y la señalización se deja como estaba, sin el control encendido.
        senalizar()

    print("\nVERDE: la medición dio igual y el control dio distinto."
          if rojo == 0 else f"\nROJO: {rojo} break(s) no dieron lo esperado.")
    sys.exit(1 if rojo else 0)


if __name__ == "__main__":
    main()
