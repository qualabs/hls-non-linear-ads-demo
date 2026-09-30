#!/usr/bin/env python3
"""La barra del player nativo deja de marcar el break que saltea, y no lo vuelve a marcar.

Fase 15, T-21, pedido de David: el break A no tiene default (ADR 0087, 0091) y el
hls.js de fábrica lo saltea, así que su barra no lo marca desde que se sabe --
cuando llegó su asset-list y no le dio nada que reproducir -- y no lo vuelve a
marcar nunca: ni con un seek en la barra, ni con los saltos de la página (que
reconstruyen los dos players), ni al pasar por ahí, ni cuando hls.js vuelve a
pedir la lista después de un seek. B y C se siguen marcando, y el pane de nuestra
librería e inspect.html no cambian.

Lo que se lee es la barra dibujada: los `.qa-mark` del player, pasados a segundos
del programa por su `left`, y no una propiedad de la página.

  1. apenas carga, antes de que llegue la lista de A (si alcanza a verse);
  2. cargada: la lista de A llegó y la marca ya no está;
  3. después de cada salto: start, break A, break B, break C;
  4. un seek con la barra, un clic en el riel, a un punto antes de A, y el programa
     corriendo hasta pasar A; hls.js tiene que haber vuelto a pedir la lista de A
     (se lee en la red), que es el caso de volver a programar el interstitial;
  5. sólo inspect: a nuestra librería y de vuelta al nativo, y otro seek con la
     barra antes de A después del cambio.

EL CONTROL es la misma medición contra la página publicada antes de este cambio:
ahí A sigue marcado después de cargar.

Uso:  verificar-marca-a-nativo.py --puerto 8093 --salida <dir>     (o --base <url>)
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

DEMO = Path(__file__).resolve().parent.parent
STAGE = json.loads((DEMO / "stage.json").read_text())
OFFSETS = {b["id"]: b["offset"] for b in STAGE["breaks"]}

MARCAS = """
([caja, reloj]) => {
  const largo = eval(reloj).duration;
  return [...document.querySelectorAll(caja + ' .qa-mark')].map((m) => parseFloat(m.style.left) / 100 * largo);
}
"""


def breaks_marcados(pagina, caja, reloj):
    """Qué breaks marca la barra de un player, por la posición de cada marca."""
    marcados = []
    for inicio in pagina.evaluate(MARCAS, [caja, reloj]):
        cerca = [b for b, off in OFFSETS.items() if abs(off - inicio) < 1.5]
        marcados.append(cerca[0] if cerca else f"?{inicio:.1f}")
    return sorted(marcados)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--puerto", type=int)
    ap.add_argument("--base")
    ap.add_argument("--salida", required=True)
    args = ap.parse_args()
    base = args.base.rstrip("/") if args.base else f"http://localhost:{args.puerto}"
    salida = Path(args.salida)
    salida.mkdir(parents=True, exist_ok=True)
    rojo, filas = 0, []

    def fila(pagina, pag, paso, caja, reloj, esperado, extra=None):
        """Una fila: lo que marca la barra de `caja`, y en index también el pane nuestro."""
        nonlocal rojo
        marcados = breaks_marcados(pagina, caja, reloj)
        ok = esperado is None or marcados == esperado
        texto_extra = ""
        if extra:
            m_extra = breaks_marcados(pagina, *extra["barra"])
            ok = ok and (not extra["exigir"] or m_extra == ["a", "b", "c"])
            texto_extra = f"   nuestro {m_extra}"
        rojo += 0 if ok else 1
        t = pagina.evaluate(f"() => {reloj}.currentTime")
        print(f"   {'ok  ' if ok else 'ROJO'} {paso:<44} t={t:6.1f}  marca {marcados}"
              f"{'' if esperado is None or marcados == esperado else ' (esperado ' + str(esperado) + ')'}{texto_extra}")
        nombre = pag + "-" + paso.split(" (")[0].replace(".", "").replace("'", "").replace(" ", "-").lower()
        pagina.locator(f"{caja} .player").first.screenshot(path=str(salida / f"{nombre}.png"))
        filas.append({"pagina": pag, "paso": paso, "t": t, "marca": marcados, "ok": ok})

    def seek_con_barra(pagina, caja, reloj, segundo):
        """Un clic en el riel, con el cromo arriba (ADR 0028)."""
        pagina.locator(caja).hover()
        time.sleep(0.4)
        riel = pagina.locator(f"{caja} .qa-track").bounding_box()
        largo = pagina.evaluate(f"() => {reloj}.duration")
        pagina.mouse.click(riel["x"] + riel["width"] * (segundo / largo), riel["y"] + riel["height"] / 2)
        pagina.wait_for_function(f"() => {reloj}.currentTime < {segundo + 6}", timeout=15000)
        pagina.mouse.move(5, 5)
        time.sleep(1.5)

    def recorrido(pagina, pag, caja, reloj, stock, extra=None):
        """Los pasos 1 a 4, iguales en las dos páginas."""
        nonlocal rojo
        pedidos_a = []
        pagina.on("request", lambda r: "asset-list-break-a.json?_HLS_primary_id" in r.url and pedidos_a.append(1))
        pagina.wait_for_function(f"() => window.demo && {reloj} && {reloj}.duration > 0 "
                                 f"&& document.querySelectorAll('{caja} .qa-mark').length > 0", timeout=30000)
        temprano = dict(extra, exigir=False) if extra else None
        fila(pagina, pag, "1. apenas carga (lista de A sin llegar)", caja, reloj, None, temprano)
        pagina.wait_for_function(f"() => {stock}.hls.interstitialsManager.events"
                                 ".some((e) => e.identifier === 'AD-A-LINEAR' && e.assetListLoaded)", timeout=30000)
        time.sleep(0.5)
        fila(pagina, pag, "2. cargada (lista de A llegó)", caja, reloj, ["b", "c"], temprano)
        for texto in ("start", "break A", "break B", "break C"):
            pagina.get_by_role("button", name=texto, exact=True).click()
            time.sleep(4)
            fila(pagina, pag, f"3. salto '{texto}'", caja, reloj, ["b", "c"], extra)
        antes = len(pedidos_a)
        seek_con_barra(pagina, caja, reloj, 8)
        fila(pagina, pag, "4. seek con la barra antes de A", caja, reloj, ["b", "c"], extra)
        pagina.wait_for_function(f"() => {reloj}.currentTime > 34", timeout=60000, polling=250)
        fila(pagina, pag, "4. y el programa pasó por A", caja, reloj, ["b", "c"], extra)
        repedida = len(pedidos_a) > antes
        rojo += 0 if repedida else 1
        print(f"   {'ok  ' if repedida else 'ROJO'} hls.js volvió a pedir la lista de A después del seek: "
              f"{len(pedidos_a) - antes} pedido(s)")
        return pedidos_a

    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome",
                                 args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])

        print("== index, player nativo a la izquierda")
        pagina = nav.new_page(viewport={"width": 1920, "height": 960})
        pagina.goto(f"{base}/index.html?izq=nativo&der=ours-2dec-img")
        recorrido(pagina, "index", "#slot-izq", "window.demo.lados.izq.programa", "window.demo.lados.izq.stock",
                  extra={"barra": ("#slot-der", "window.demo.lados.der.programa"), "exigir": True})
        pagina.close()

        print("\n== inspect.html?modo=nativo")
        pagina = nav.new_page(viewport={"width": 1920, "height": 960})
        pagina.goto(f"{base}/inspect.html?modo=nativo")
        nativo = ("#slot", "window.demo.stock.programme")
        pedidos_a = recorrido(pagina, "inspect", *nativo, "window.demo.stock")
        # 5. A nuestra librería, que marca los tres, y de vuelta al nativo, que reconstruye.
        pagina.get_by_role("button", name="With our library", exact=True).click()
        pagina.wait_for_function("() => window.demo.modo === 'ours' && document.querySelectorAll('#slot .qa-mark').length === 3",
                                 timeout=30000)
        fila(pagina, "inspect", "5. cambio a nuestra librería", "#slot", "window.demo.video", ["a", "b", "c"])
        pagina.get_by_role("button", name="HLS interstitials, native", exact=True).click()
        pagina.wait_for_function("() => window.demo.modo === 'nativo' && document.querySelectorAll('#slot .qa-mark').length > 0",
                                 timeout=30000)
        time.sleep(1.5)
        fila(pagina, "inspect", "5. de vuelta al nativo", *nativo, ["b", "c"])
        antes = len(pedidos_a)
        seek_con_barra(pagina, *nativo, 8)
        fila(pagina, "inspect", "5. seek con la barra antes de A, tras el cambio", *nativo, ["b", "c"])
        pagina.wait_for_function(f"() => {nativo[1]}.currentTime > 34", timeout=60000, polling=250)
        fila(pagina, "inspect", "5. y el programa pasó por A, tras el cambio", *nativo, ["b", "c"])
        repedida = len(pedidos_a) > antes
        rojo += 0 if repedida else 1
        print(f"   {'ok  ' if repedida else 'ROJO'} hls.js volvió a pedir la lista de A tras el cambio y el seek: "
              f"{len(pedidos_a) - antes} pedido(s)")
        pagina.close()
        nav.close()
    (salida / "verificar-marca-a-nativo.json").write_text(json.dumps(filas, indent=2))
    print("\nVERDE" if rojo == 0 else f"\nROJO ({rojo})")
    sys.exit(1 if rojo else 0)


if __name__ == "__main__":
    main()
