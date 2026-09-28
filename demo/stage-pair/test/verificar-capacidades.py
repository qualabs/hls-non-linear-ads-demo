#!/usr/bin/env python3
"""El APS devuelve lo mismo y la pantalla no: las cuatro combinaciones del control.

Es la verificación de la fase 15 (ADR 0085, 0086 y 0087), y mide tres cosas en el
navegador, con la página de verdad y el control apretado como lo aprieta David:

1. LO QUE VIAJA. La URL del asset-list que el navegador pidió, leída de la red,
   lleva `sgai-video-decoders` y `sgai-image-over-video` con los valores del
   control. Control: las cuatro combinaciones tienen que dar cuatro queries
   DISTINTAS; si dieran la misma, lo que se lee no es el control.

2. LO QUE VUELVE. El cuerpo de la respuesta de cada break, leído de la red, es
   IDÉNTICO byte por byte en las cuatro combinaciones. Control: el cuerpo de un
   break contra el de otro tiene que dar DISTINTO, o el comparador dice igual a
   todo.

3. LO QUE SE DIBUJA. En la ventana del break se cuentan los `<video>` y los
   `<img>` de la composición, y se lee el reporte del filtro que la librería le
   pasa a la página (`window.demo.selecciones`). Lo esperado sale de las reglas
   del ADR 0085 y no de la página:

       2 decodificadores, con o sin imágenes   la opción de video: 2 <video>
       1 decodificador, con imágenes           la de imagen: 1 <video> y 1 <img>
       1 decodificador, sin imágenes           con default, el lineal: 2 <video>
                                               sin default, nada: 1 <video>

   Y ése es el control de la medición: las cuatro combinaciones no pueden dar la
   misma composición, y si la dieran, el filtro no está filtrando.

Y deja una captura por combinación y por break en `--salida`, a 1907 de ancho, y
las de la combinación que se saltea también a 400x780.

USO
    verificar-capacidades.py --puerto 8093 --salida <dir> [--pagina inspect|index]

NO levanta servidor: mide el que está en ese puerto. El puerto se pasa a
propósito: en esta máquina corren demos de Nicolás en 8080, 8081 y 8082.
"""

import argparse
import hashlib
import json
import os
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

from playwright.sync_api import sync_playwright  # noqa: E402

DEMO = Path(__file__).resolve().parent.parent
STAGE = json.loads((DEMO / "stage.json").read_text())
BREAKS = {b["id"]: b for b in STAGE["breaks"]}

COMBINACIONES = [
    {"videoDecoders": 2, "imageOverVideo": True},
    {"videoDecoders": 2, "imageOverVideo": False},
    {"videoDecoders": 1, "imageOverVideo": True},
    {"videoDecoders": 1, "imageOverVideo": False},
]


def esperado(capacidad, brk):
    """Lo que el ADR 0085 manda dibujar, escrito acá y no leído de la página."""
    if capacidad["videoDecoders"] >= 2:
        return {"outcome": "drawn", "chosen": 0, "video": 2, "img": 0}
    if capacidad["imageOverVideo"]:
        return {"outcome": "drawn", "chosen": 1, "video": 1, "img": 1}
    if brk["lineal"]:
        return {"outcome": "default", "chosen": None, "video": 2, "img": 0}
    return {"outcome": "skipped", "chosen": None, "video": 1, "img": 0}


def nombre(capacidad):
    return f"dec{capacidad['videoDecoders']}-img{'si' if capacidad['imageOverVideo'] else 'no'}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--puerto", type=int, required=True)
    ap.add_argument("--salida", required=True)
    ap.add_argument("--pagina", default="inspect", choices=["inspect", "index"])
    args = ap.parse_args()
    salida = Path(args.salida)
    salida.mkdir(parents=True, exist_ok=True)
    base = f"http://localhost:{args.puerto}"
    contenedor = "#slot" if args.pagina == "inspect" else "#demo-slot"

    filas, rojo = [], 0
    pedidos = []  # (url, cuerpo)

    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome",
                                 args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
        pagina = nav.new_page(viewport={"width": 1907, "height": 1100})

        def al_responder(resp):
            if "/signalling/asset-list-break-" in resp.url:
                try:
                    pedidos.append((resp.url, resp.text()))
                except Exception as error:  # noqa: BLE001
                    pedidos.append((resp.url, f"<sin cuerpo: {error}>"))
        pagina.on("response", al_responder)

        pagina.goto(f"{base}/{args.pagina}.html")
        pagina.wait_for_function("window.demo && window.demo.video")

        for capacidad in COMBINACIONES:
            # EL CONTROL SE APRIETA COMO LO APRIETA DAVID: los dos botones. La
            # página rearma el player en cada uno, así que se aprietan los dos y
            # se espera al rearmado del último.
            for eje, valor in capacidad.items():
                txt = str(valor).lower() if isinstance(valor, bool) else str(valor)
                boton = pagina.locator(f'button[data-eje="{eje}"][data-valor="{txt}"]')
                if boton.get_attribute("aria-pressed") != "true":
                    boton.click()
                    time.sleep(0.8)
            pagina.wait_for_function(
                "c => JSON.stringify(window.demo.capacidades) === JSON.stringify(c)", arg=capacidad)
            desde = len(pedidos)

            for brk_id in ("a", "b"):
                brk = BREAKS[brk_id]
                if args.pagina == "inspect":
                    pagina.evaluate("t => window.demo.irA(t)", brk["offset"] - 2)
                else:
                    pagina.evaluate("t => window.demo.irA(t)", brk["offset"] - 2)
                # Adentro del break, con la transición de entrada terminada.
                pagina.wait_for_function(
                    "t => window.demo.video.currentTime > t", arg=brk["offset"] + 3.5, timeout=30000)
                composicion = pagina.evaluate(
                    """sel => {
                        const c = document.querySelector(sel);
                        const vivos = [...c.querySelectorAll('video')].filter((v) => v.readyState > 0 || v.src);
                        return {
                          video: vivos.length,
                          img: [...c.querySelectorAll('img')].filter((i) => i.getAttribute('src')
                               && !/logo/i.test(i.getAttribute('src'))).length,
                          t: window.demo.video.currentTime
                        };
                    }""", contenedor)
                seleccion = pagina.evaluate(
                    "id => { const s = window.demo.selecciones[id]; return s ? s.assets[0] : null }", brk_id)
                captura = salida / f"{args.pagina}-{nombre(capacidad)}-break-{brk_id}-1907.png"
                pagina.screenshot(path=str(captura), full_page=True)
                if brk_id == "a" and capacidad == COMBINACIONES[-1]:
                    pagina.set_viewport_size({"width": 400, "height": 780})
                    time.sleep(0.6)
                    pagina.screenshot(path=str(salida / f"{args.pagina}-{nombre(capacidad)}-break-a-400.png"),
                                      full_page=True)
                    pagina.set_viewport_size({"width": 1907, "height": 1100})

                esp = esperado(capacidad, brk)
                obtenido = {
                    "outcome": seleccion and seleccion["outcome"],
                    "chosen": seleccion and seleccion["items"][0]["chosen"],
                    "video": composicion["video"],
                    "img": composicion["img"],
                }
                ok = obtenido == esp
                rojo += 0 if ok else 1
                filas.append({
                    "combinacion": nombre(capacidad), "break": brk_id, "t": round(composicion["t"], 2),
                    "esperado": esp, "obtenido": obtenido, "ok": ok,
                    "descartes": seleccion and [d["reason"] for d in seleccion["items"][0]["discarded"]],
                })
            for url, _ in pedidos[desde:]:
                filas[-1].setdefault("pedidos", []).append(url)

        nav.close()

    # ── 1. lo que viaja ─────────────────────────────────────────────────────
    queries = {}
    for url, _ in pedidos:
        q = url.split("?", 1)[1] if "?" in url else ""
        queries.setdefault(q, 0)
        queries[q] += 1
    print("1. LO QUE VIAJA -- las queries distintas que salieron:")
    for q, n in sorted(queries.items()):
        print(f"     ?{q}   ({n} pedidos)")
    if len(queries) != len(COMBINACIONES):
        print(f"   ROJO: {len(queries)} queries distintas para {len(COMBINACIONES)} combinaciones")
        rojo += 1

    # ── 2. lo que vuelve ────────────────────────────────────────────────────
    print("2. LO QUE VUELVE -- el sha256 del cuerpo, por break:")
    por_break = {}
    for url, cuerpo in pedidos:
        brk = url.split("asset-list-break-")[1].split(".json")[0]
        por_break.setdefault(brk, set()).add(hashlib.sha256(cuerpo.encode()).hexdigest()[:16])
    for brk, hashes in sorted(por_break.items()):
        print(f"     break {brk}: {len(hashes)} cuerpo(s) distinto(s) {sorted(hashes)}")
        if len(hashes) != 1:
            rojo += 1
    todos = [next(iter(h)) for h in por_break.values()]
    control = len(set(todos)) == len(todos)
    print(f"   control: los cuerpos de breaks distintos son distintos entre sí -> {'sí' if control else 'NO'}")
    rojo += 0 if control else 1

    # ── 3. lo que se dibuja ─────────────────────────────────────────────────
    print("3. LO QUE SE DIBUJA:")
    for f in filas:
        marca = "ok  " if f["ok"] else "ROJO"
        print(f"   {marca} {f['combinacion']:<12} break {f['break']}  t={f['t']:>6}  "
              f"obtenido {f['obtenido']}  esperado {f['esperado']}")
        for d in f["descartes"] or []:
            print(f"          descartada: {d}")
    distintas = {json.dumps(f["obtenido"], sort_keys=True) for f in filas if f["break"] == "b"}
    print(f"   control: composiciones distintas en el break b sobre 4 combinaciones -> {len(distintas)}")
    if len(distintas) < 3:
        rojo += 1

    (salida / f"{args.pagina}-mediciones.json").write_text(
        json.dumps({"filas": filas, "queries": queries}, indent=2, ensure_ascii=False))
    print(f"\n{'VERDE' if rojo == 0 else f'ROJO ({rojo})'}")
    sys.exit(1 if rojo else 0)


if __name__ == "__main__":
    main()
