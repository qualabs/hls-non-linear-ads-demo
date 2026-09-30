#!/usr/bin/env python3
"""inspect.html con el mismo control que cada player del par: los cinco modos, en A y B.

Fase 15, pedido de Nicolás: el player solo de `inspect.html` se configura igual que
un pane de `index.html` -- "HLS interstitials, native" o "With our library" con
las dos capacidades --, con la misma gramática en la URL (`?modo=...`). Por cada
modo y en los breaks A y B mide:

  LO QUE DIBUJA, con la misma regla que `verificar-pares.py` (de donde se importa
  `esperado`, para que las dos páginas se midan contra lo mismo).

  LO QUE LA PÁGINA DICE QUE SE PIDIÓ. La tarjeta 2 muestra la URL que el
  navegador pidió de verdad (se compara con la red): nuestra librería, el
  asset-list del break con SUS sgai-*; el nativo, el MISMO asset-list (ADR 0090)
  sin sgai-*, y en A, que no tiene lineal, ningún pedido.

  LA TARJETA 4. Con nuestra librería, el desenlace del filtro; en nativo, que no
  hay filtro -- sin opciones inventadas.

Uso:  verificar-inspect-modos.py --puerto 8093 --salida <dir>     (o --base <url>)
"""

import argparse
import importlib.util
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

_spec = importlib.util.spec_from_file_location("pares", Path(__file__).with_name("verificar-pares.py"))
pares = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(pares)
esperado, BREAKS = pares.esperado, pares.BREAKS

MODOS = ["nativo", "ours-2dec-img", "ours-2dec-noimg", "ours-1dec-img", "ours-1dec-noimg"]

LEER = """
() => {
  const d = window.demo, slot = document.getElementById('slot');
  if (d.modo === 'nativo') return { aviso_lineal: d.stock.playingAd != null };
  const t = d.video.currentTime;
  return {
    layout: d.provider.activeAt(t).map((e) => e.type)[0] ?? null,
    video: [...slot.querySelectorAll('video')].filter((v) => v.readyState > 0 || v.src).length,
    img: [...slot.querySelectorAll('img')].filter((i) => i.getAttribute('src') && !/logo/i.test(i.getAttribute('src'))).length
  };
}
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--puerto", type=int)
    ap.add_argument("--base")
    ap.add_argument("--salida", required=True)
    args = ap.parse_args()
    base = args.base.rstrip("/") if args.base else f"http://localhost:{args.puerto}"
    salida = Path(args.salida)
    salida.mkdir(parents=True, exist_ok=True)
    rojo = 0
    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome",
                                 args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
        for modo in MODOS:
            pagina = nav.new_page(viewport={"width": 1907, "height": 1150})
            red = []
            pagina.on("request", lambda r: "/signalling/asset-list-" in r.url and red.append(r.url))
            pagina.goto(f"{base}/inspect.html?modo={modo}")
            pagina.wait_for_function("window.demo && window.demo.modo")
            leido = pagina.evaluate("() => new URLSearchParams(location.search).get('modo')")
            pulsado = pagina.evaluate("() => [...document.querySelectorAll('#steps button[aria-pressed=\"true\"]')].map((b) => b.textContent)")
            ok = leido == modo
            rojo += 0 if ok else 1
            print(f"\n== modo={modo}   URL: {'ok' if ok else 'ROJO ' + str(leido)}   control: {pulsado}")
            for brk_id in ("a", "b", "c"):
                brk = BREAKS[brk_id]
                pagina.get_by_role("button", name=f"break {brk_id.upper()}", exact=True).click()
                pagina.wait_for_function("""t => { const d = window.demo;
                    return d.modo === 'nativo' ? (d.stock.playingAd != null || d.stock.programme.currentTime > t)
                                               : d.video.currentTime > t; }""", arg=brk["offset"] + 3.5, timeout=40000)
                pagina.wait_for_function("id => window.demo.mostrado === id", arg=brk_id, timeout=10000)
                time.sleep(1.2)
                obtenido = pagina.evaluate(LEER)
                esp = esperado(modo, brk)
                ok_dibujo = obtenido == esp
                pedido = pagina.locator("#request").inner_text().strip()
                if modo == "nativo":
                    ok_pedido = (pedido.startswith(f"/signalling/asset-list-break-{brk_id}.json") and "sgai-" not in pedido) \
                        if brk["lineal"] else "no request" in pedido
                else:
                    dec, img = modo.split("-")[1:]
                    q = f"sgai-video-decoders={dec[0]}&sgai-image-over-video={1 if img == 'img' else 0}"
                    ok_pedido = pedido.startswith(f"/signalling/asset-list-break-{brk_id}.json?{q}")
                # lo dibujado en la tarjeta 2 es lo que salió por la red
                en_red = any(pedido.replace("\n", "") in u for u in red) if "no request" not in pedido else True
                tarjeta4 = pagina.locator("#outcome").inner_text().strip()
                ok_t4 = ("hls.js" in tarjeta4 and not pagina.locator("#filter .filter__option").count()) \
                    if modo == "nativo" else bool(tarjeta4) and "hls.js" not in tarjeta4
                ok_all = ok_dibujo and ok_pedido and en_red and ok_t4
                rojo += 0 if ok_all else 1
                print(f"   {'ok  ' if ok_all else 'ROJO'} break {brk_id}  dibuja {obtenido}{'' if ok_dibujo else ' esperado ' + str(esp)}")
                print(f"          tarjeta 2: {pedido.replace(chr(10), '')[:110]}   {'(en la red)' if en_red else '(NO está en la red)'}")
                print(f"          tarjeta 4: {tarjeta4[:110]}")
                pagina.screenshot(path=str(salida / f"inspect-{modo}-break-{brk_id}.png"), full_page=True)
            pagina.close()
        nav.close()
    print("\nVERDE" if rojo == 0 else f"\nROJO ({rojo})")
    sys.exit(1 if rojo else 0)


if __name__ == "__main__":
    main()
