#!/usr/bin/env python3
"""Los dos panes de `index.html` entran y salen juntos de cada break con default.

Es la medición del tramo invertido (ADR 0082) sobre la página que se le muestra a
Apple, con sus dos players y su bloque de integrador, y no sobre un banco. El
instrumento es el que eligió la fase 03 —se lee el estado del navegador y no una
captura— y la mecánica está en la cabecera de `banco-de-medicion.html`.

**Sólo los breaks con default lineal** (ADR 0087): en el que no tiene, el pane de
fábrica no reproduce nada y no hay tramo que comparar. El nuestro se mide sobre
esos mismos breaks, por el ID del rango, para que los dos recorran la misma
secuencia.

**El control**: `CONTROL_DURACION_CONCURRENTE` escribe los asset-lists
concurrentes con una duración distinta a la de su break, que es exactamente el
defecto de `compatibility-pair`, y tiene que dar DISTINTO.

Acá **no** se busca: escribir un `currentTime` es intervenir sobre el mismo reloj
que se está midiendo.

Lo que medía este archivo hasta la fase 14 además del tramo —que el parámetro
viaja y cuántos `<video>` hay por escalón— lo mide ahora
`test/verificar-capacidades.py`, en las cuatro combinaciones del control.

USO
    medir-tramo-en-el-par.py --puerto 8097

Levanta su propio `server.mjs` en ese puerto y lo baja **por el PID que guardó**.
El puerto se pasa a propósito y no se adivina: en esta máquina corren demos de
Nicolás en 8080, 8081 y 8082. El intérprete es el del skill playwright; se puede
pisar con `PY=<ruta>`.
"""

import argparse
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

_PY = os.environ.get("PY", "/home/nicolas/Skills/playwright/.venv/bin/python")
try:
    import playwright  # noqa: F401
except ModuleNotFoundError:
    if not os.access(_PY, os.X_OK):
        sys.exit(f"falta playwright, y el python del skill no está en {_PY}")
    os.execv(_PY, [_PY, os.path.abspath(__file__), *sys.argv[1:]])

DEMO = Path(__file__).resolve().parent.parent
SDK = DEMO.parent.parent
STAGE = json.loads((DEMO / "stage.json").read_text())
MEDIDOS = [b for b in STAGE["breaks"] if b["lineal"]]

# La misma holgura que la medición de la T-06, y por la misma razón: se muestrea
# cada 100 ms y los dos panes son dos players que no comparten reloj de muestreo.
# El defecto que se busca vale DOCE segundos.
HOLGURA = 0.5

# ── el sampler del tramo invertido, corriendo ADENTRO de la página ───────────
# Va adentro y no en Python porque un muestreo hecho de a un `evaluate` por
# lectura mide también la latencia del puente, y son dos lecturas cada 100 ms.
# Es el mismo muestreo que `test/banco-de-medicion.html`, sobre `window.demo`.
SAMPLER = """
async (breaks) => {
  const d = window.demo;
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  const enAdStock = () =>
    (d.stock.hls.interstitialsManager?.playingItem?.event?.identifier ?? null) !== null;
  const relojStock = () => {
    const t = d.stock.hls.interstitialsManager?.primary?.currentTime;
    return Number.isFinite(t) ? t : d.stock.programme.currentTime;
  };
  const ids = new Set(breaks.map((b) => `AD-${b.id.toUpperCase()}-CONCURRENT`));
  const enAdDemo = () => d.provider.activeAt(d.video.currentTime).some((e) => ids.has(e.id));
  const relojDemo = () => d.video.currentTime;

  for (let i = 0; i < 300; i++) {
    if (d.stock.hls.interstitialsManager?.primary && d.video.readyState >= 2) break;
    await dormir(100);
  }

  const panes = { stock: { enAd: enAdStock, reloj: relojStock },
                  demo:  { enAd: enAdDemo,  reloj: relojDemo } };
  const filas = breaks.map((b) => ({ break: b.id, stock: {}, demo: {} }));
  const previo = { stock: null, demo: null };
  const dentro = { stock: false, demo: false };
  const cursor = { stock: 0, demo: 0 };

  const ultimo = breaks[breaks.length - 1];
  const limite = (ultimo.offset + ultimo.duracion + 60) * 1000;
  const arranque = Date.now();
  while (Date.now() - arranque < limite) {
    for (const [nombre, pane] of Object.entries(panes)) {
      const ahora = pane.enAd();
      const reloj = pane.reloj();
      const fila = filas[cursor[nombre]]?.[nombre];
      if (fila) {
        if (!dentro[nombre] && ahora && fila.entra === undefined) fila.entra = previo[nombre] ?? reloj;
        if (dentro[nombre] && !ahora && fila.entra !== undefined && fila.sale === undefined) {
          fila.sale = reloj;
          cursor[nombre] += 1;
        }
      }
      dentro[nombre] = ahora;
      if (!ahora) previo[nombre] = reloj;
    }
    if (cursor.stock >= breaks.length && cursor.demo >= breaks.length) return filas;
    await dormir(100);
  }
  return filas.map((f) => ({ ...f, timeout: true }));
}
"""

def senalizar(control=None):
    entorno = dict(os.environ)
    if control:
        entorno["CONTROL_DURACION_CONCURRENTE"] = str(control)
    subprocess.run([str(DEMO / "scripts/senalizar-contenido.sh")],
                   cwd=DEMO, env=entorno, check=True, stdout=subprocess.DEVNULL)


class Pagina:
    """index.html abierta."""

    def __init__(self, pw, puerto):
        self.navegador = pw.chromium.launch(
            channel="chrome",
            args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
        )
        self.page = self.navegador.new_page(viewport={"width": 1907, "height": 1000})
        self.url = f"http://localhost:{puerto}/index.html"

    def abrir(self):
        self.page.goto(self.url)
        self.page.wait_for_function("() => window.demo && window.demo.video")
        return self

    def cerrar(self):
        self.navegador.close()


# ── el tramo invertido ────────────────────────────────────────────────────

def medir_tramo(puerto, control_duracion):
    from playwright.sync_api import sync_playwright
    rojo = 0
    with sync_playwright() as pw:
        def una_pasada(titulo, esperado_igual):
            pagina = Pagina(pw, puerto)
            try:
                pagina.abrir()
                filas = pagina.page.evaluate(SAMPLER, MEDIDOS)
            finally:
                pagina.cerrar()
            return informe_tramo(titulo, filas, esperado_igual)

        senalizar()
        rojo += una_pasada("LOS DOS PANES ENTRAN Y SALEN JUNTOS — index.html, capacidad inicial", True)
        senalizar(control=control_duracion)
        rojo += una_pasada(
            f"   EL CONTROL — el break concurrente dura {control_duracion} s y su lineal no", False)
        senalizar()
    return rojo


def informe_tramo(titulo, filas, esperado_igual):
    print(f"\n== {titulo} ==")
    rojo = 0
    for fila in filas:
        s, d = fila["stock"], fila["demo"]
        if any(k not in x for x in (s, d) for k in ("entra", "sale")):
            print(f"  break {fila['break'].upper()}  INCOMPLETO  {json.dumps(fila)}")
            rojo += 1
            continue
        de, ds = abs(s["entra"] - d["entra"]), abs(s["sale"] - d["sale"])
        igual = de <= HOLGURA and ds <= HOLGURA
        print(f"  break {fila['break'].upper()}  "
              f"fábrica {s['entra']:7.3f} -> {s['sale']:7.3f}   "
              f"nuestro {d['entra']:7.3f} -> {d['sale']:7.3f}   "
              f"delta entrada {de:6.3f} s  salida {ds:6.3f} s   "
              f"{'IGUAL   ' if igual else 'DISTINTO'}")
        if igual is not esperado_igual:
            rojo += 1
    return rojo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--puerto", type=int, required=True)
    ap.add_argument("--control-duracion", type=float, default=24.0)
    args = ap.parse_args()

    server = subprocess.Popen(
        ["node", "server.mjs", f"demo/{DEMO.name}"],
        cwd=SDK, env={**os.environ, "PORT": str(args.puerto)},
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    print(f"server PID {server.pid} en el puerto {args.puerto}")
    time.sleep(1.0)
    rojo = 0
    try:
        rojo += medir_tramo(args.puerto, args.control_duracion)
    finally:
        # Por el PID que se guardó, nunca por patrón: en esta máquina hay otras
        # demos corriendo y un patrón que parece propio alcanza a las de al lado.
        server.send_signal(signal.SIGTERM)
        server.wait(timeout=10)
        print(f"\nserver {server.pid} bajado")

    print("\nVERDE: las mediciones dieron lo esperado y los controles también."
          if rojo == 0 else f"\nROJO: {rojo} fila(s) no dieron lo esperado.")
    sys.exit(1 if rojo else 0)


if __name__ == "__main__":
    main()
