#!/usr/bin/env python3
"""El break A en el player de fábrica: el programa sigue, sin trabarse y sin error a la vista.

Fase 15, T-19 (ADR 0091): el manifest de interstitials nombra también el break A,
cuyo asset-list no tiene parte estándar (sin `URI`, ADR 0087). hls.js lo programa,
no tiene nada que reproducir y lo saltea. Esto lo mide como lo va a grabar David:
la página se abre y se deja correr desde cero, sin saltos, y del segundo 15 al 36
del programa se muestrea cada 200 ms:

  EL RELOJ DEL PROGRAMA. El hueco más largo en que no avanzó; más de medio segundo
  es una traba. Y cuánto avanzó contra el reloj de pared: un aviso reproducido lo
  congelaría doce segundos.

  LA LÍNEA DE ESTADO del lado nativo (`#state-izq` en index, `#state` en inspect):
  cada texto distinto que mostró, que es lo que se ve en cámara.

  LA CONSOLA Y LOS EVENTOS `waiting`, que no se ven pero se informan.

  EL PANEL DE PEDIDOS del lado nativo en index ("Asset-list requests this player
  made"): después de A tiene que listar el pedido de A con "skipped: no default
  content" (T-20), y después de B, el de B con "plays its default".

Medido así se encontró la traba que obliga a `X-RESUME-OFFSET=0` en ese tag (ADR
0091): sin el atributo, el reloj del programa salta al fin del break y el video queda
congelado en el borde de lo que bajó, más de 40 s.

EL CONTROL es el break B con el mismo instrumento: tiene lineal, y ahí el reloj del
programa tiene que quedar congelado mientras hls.js reproduce el aviso.

Uso:  medir-a-nativo.py --puerto 8093 --salida <dir>     (o --base <url>)
"""

import argparse
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

PAGINAS = {
    "index": ("index.html?izq=nativo&der=ours-2dec-img", "window.demo.lados.izq.programa",
              "window.demo.lados.izq.stock", "#state-izq", "#slot-izq", "#pane-izq .wire--pane"),
    "inspect": ("inspect.html?modo=nativo", "window.demo.stock.programme",
                "window.demo.stock", "#state", "#slot", None),
}

ESPIAR = """
sel => { window.__esperas = 0;
  for (const v of document.querySelectorAll(sel + ' video')) v.addEventListener('waiting', () => window.__esperas++); }
"""


def tramo(pagina, reloj, stock, estado, desde, hasta):
    """Muestras del reloj del programa, del aviso y de la línea de estado entre dos segundos del programa."""
    pagina.wait_for_function(f"t => {reloj}.currentTime >= t", arg=desde, timeout=90000, polling=50)
    muestras, t0 = [], time.monotonic()
    while True:
        m = pagina.evaluate(f"""() => ({{ t: {reloj}.currentTime, aviso: {stock}.playingAd != null,
            estado: document.querySelector('{estado}').textContent.trim(), esperas: window.__esperas }})""")
        m["pared"] = time.monotonic() - t0
        muestras.append(m)
        if m["t"] >= hasta or m["pared"] > (hasta - desde) + 25:
            return muestras
        time.sleep(0.2)


def resumen(muestras):
    hueco, quieto_desde = 0.0, None
    for a, b in zip(muestras, muestras[1:]):
        if b["t"] - a["t"] < 0.02:
            quieto_desde = a["pared"] if quieto_desde is None else quieto_desde
            hueco = max(hueco, b["pared"] - quieto_desde)
        else:
            quieto_desde = None
    estados = list(dict.fromkeys(m["estado"] for m in muestras))
    return {
        "programa_avanzo_s": round(muestras[-1]["t"] - muestras[0]["t"], 2),
        "pared_s": round(muestras[-1]["pared"], 2),
        "hueco_mas_largo_s": round(hueco, 2),
        "muestras_con_aviso": sum(m["aviso"] for m in muestras),
        "waiting": muestras[-1]["esperas"] - muestras[0]["esperas"],
        "estados": estados,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--puerto", type=int)
    ap.add_argument("--base")
    ap.add_argument("--salida", required=True)
    args = ap.parse_args()
    base = args.base.rstrip("/") if args.base else f"http://localhost:{args.puerto}"
    salida = Path(args.salida)
    salida.mkdir(parents=True, exist_ok=True)
    rojo, informe = 0, {}
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome",
                                 args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
        for nombre, (ruta, reloj, stock, estado, caja, panel) in PAGINAS.items():
            pagina = nav.new_page(viewport={"width": 1920, "height": 960})
            consola = []
            pagina.on("console", lambda m: m.type in ("warning", "error") and consola.append(f"{m.type}: {m.text[:200]}"))
            pagina.on("pageerror", lambda e: consola.append(f"pageerror: {e}"))
            pedidos = []
            pagina.on("request", lambda r: "/signalling/asset-list-" in r.url and pedidos.append(r.url.split("/signalling/")[-1]))
            pagina.goto(f"{base}/{ruta}")
            pagina.wait_for_function(f"window.demo && {reloj} && {reloj}.currentTime > 0", timeout=30000)
            pagina.evaluate(ESPIAR, caja)
            a = resumen(tramo(pagina, reloj, stock, estado, 15, 36))
            pagina.screenshot(path=str(salida / f"{nombre}-nativo-tras-a.png"))
            panel_a = None
            if panel:
                time.sleep(0.5)
                panel_a = pagina.locator(panel).inner_text()
                pagina.locator(panel).screenshot(path=str(salida / f"{nombre}-panel-tras-a.png"))
            # El control: B, con lineal, congela el reloj del programa mientras suena el aviso.
            pagina.evaluate(f"() => {{ {reloj}.currentTime = 60; }}")
            b = resumen(tramo(pagina, reloj, stock, estado, 61, 80))
            panel_b = None
            if panel:
                panel_b = pagina.locator(panel).inner_text()
                pagina.locator(panel).screenshot(path=str(salida / f"{nombre}-panel-tras-b.png"))
            pagina.close()
            ok_a = a["hueco_mas_largo_s"] <= 0.5 and a["muestras_con_aviso"] == 0 and a["programa_avanzo_s"] >= 20 \
                and all(e.startswith("primary content") for e in a["estados"])
            ok_b = b["hueco_mas_largo_s"] >= 8 and b["muestras_con_aviso"] > 0
            ok_consola = not any(c.startswith(("error", "pageerror")) for c in consola)
            ok_panel = panel is None or (
                "asset-list-break-a.json" in panel_a and "skipped: no default content" in panel_a
                and "asset-list-break-b.json" in panel_b and "plays its default" in panel_b)
            rojo += (0 if ok_a else 1) + (0 if ok_b else 1) + (0 if ok_consola else 1) + (0 if ok_panel else 1)
            informe[nombre] = {"a": a, "control_b": b, "consola": consola, "pedidos": sorted(set(pedidos))}
            print(f"\n== {nombre} (nativo)")
            print(f"   {'ok  ' if ok_a else 'ROJO'} A: el programa avanzó {a['programa_avanzo_s']} s en {a['pared_s']} s de pared,"
                  f" hueco más largo {a['hueco_mas_largo_s']} s, muestras con aviso {a['muestras_con_aviso']}, waiting {a['waiting']}")
            otros = [e for e in a["estados"] if not e.startswith("primary content")]
            print(f"        línea de estado: {len(a['estados'])} textos, todos 'primary content · …'" if not otros
                  else f"        línea de estado, además de 'primary content': {otros}")
            print(f"   {'ok  ' if ok_b else 'ROJO'} control B: hueco más largo {b['hueco_mas_largo_s']} s, muestras con aviso {b['muestras_con_aviso']}")
            print(f"        línea de estado: {[e for e in b['estados'] if not e.startswith('primary content')][:1]} …")
            print(f"   {'ok  ' if ok_consola else 'ROJO'} consola ({len(consola)} avisos, ningún error):")
            for c in consola:
                print(f"        {c}")
            print(f"        pedidos: {sorted(set(pedidos))}")
            if panel:
                print(f"   {'ok  ' if ok_panel else 'ROJO'} panel de pedidos tras A: {panel_a!r}")
                print(f"        tras B: {panel_b!r}")
        nav.close()
    (salida / "medir-a-nativo.json").write_text(json.dumps(informe, indent=2, ensure_ascii=False))
    print("\nVERDE" if rojo == 0 else f"\nROJO ({rojo})")
    sys.exit(1 if rojo else 0)


if __name__ == "__main__":
    main()
