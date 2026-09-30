#!/usr/bin/env python3
"""La barra del player nativo de index deja de marcar el break que saltea, y no lo vuelve a marcar.

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
     (se lee en la red), que es el caso de volver a programar el interstitial.

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
    nat = ("#slot-izq", "window.demo.lados.izq.programa")
    nuestro = ("#slot-der", "window.demo.lados.der.programa")

    def fila(pagina, paso, esperado_nat, nombre_captura, nuestro_completo=True):
        nonlocal rojo
        m_nat = breaks_marcados(pagina, *nat)
        m_nuestro = breaks_marcados(pagina, *nuestro)
        # El nuestro resuelve sus listas al arrancar (ADR 0039): en los dos primeros
        # pasos puede estar a medio resolver, y ahí sólo se informa.
        ok = (esperado_nat is None or m_nat == esperado_nat) and (not nuestro_completo or m_nuestro == ["a", "b", "c"])
        rojo += 0 if ok else 1
        t = pagina.evaluate(f"() => {nat[1]}.currentTime")
        print(f"   {'ok  ' if ok else 'ROJO'} {paso:<44} t={t:6.1f}  nativo marca {m_nat}"
              f"{'' if esperado_nat is None or m_nat == esperado_nat else ' (esperado ' + str(esperado_nat) + ')'}"
              f"   nuestro {m_nuestro}")
        pagina.locator("#pane-izq .player").first.screenshot(path=str(salida / f"{nombre_captura}.png"))
        filas.append({"paso": paso, "t": t, "nativo": m_nat, "nuestro": m_nuestro, "ok": ok})

    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome",
                                 args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
        pagina = nav.new_page(viewport={"width": 1920, "height": 960})
        pedidos_a = []
        pagina.on("request", lambda r: "asset-list-break-a.json?_HLS_primary_id" in r.url and pedidos_a.append(time.monotonic()))
        pagina.goto(f"{base}/index.html?izq=nativo&der=ours-2dec-img")
        pagina.wait_for_function(f"window.demo && window.demo.lados && {nat[1]}.duration > 0 "
                                 "&& document.querySelectorAll('#slot-izq .qa-mark').length > 0", timeout=30000)
        print("== index, player nativo a la izquierda")
        # 1. Antes de que llegue la lista de A: se informa lo que haya, sin esperado.
        fila(pagina, "1. apenas carga (lista de A sin llegar)", None, "1-apenas-carga", nuestro_completo=False)
        # 2. Cargada: la lista de A llegó.
        pagina.wait_for_function("() => window.demo.lados.izq.stock.hls.interstitialsManager.events"
                                 ".some((e) => e.identifier === 'AD-A-LINEAR' && e.assetListLoaded)", timeout=30000)
        time.sleep(0.5)
        fila(pagina, "2. cargada (lista de A llegó)", ["b", "c"], "2-cargada", nuestro_completo=False)
        # 3. Los saltos, que reconstruyen los dos players.
        for texto, destino in (("start", 0.05), ("break A", None), ("break B", None), ("break C", None)):
            pagina.get_by_role("button", name=texto, exact=True).click()
            time.sleep(4)
            fila(pagina, f"3. salto '{texto}'", ["b", "c"], f"3-salto-{texto.replace(' ', '-').lower()}")
        # 4. Un seek con la barra a un punto antes de A, con el cromo arriba (ADR 0028).
        antes = len(pedidos_a)
        track = pagina.locator("#slot-izq .qa-track")
        pagina.locator("#slot-izq").hover()
        time.sleep(0.4)
        caja = track.bounding_box()
        largo = pagina.evaluate(f"() => {nat[1]}.duration")
        pagina.mouse.click(caja["x"] + caja["width"] * (8 / largo), caja["y"] + caja["height"] / 2)
        pagina.wait_for_function(f"() => {nat[1]}.currentTime < 15", timeout=15000)
        pagina.mouse.move(5, 5)
        time.sleep(1.5)
        fila(pagina, "4. seek con la barra antes de A", ["b", "c"], "4-seek-barra-antes-de-a")
        pagina.wait_for_function(f"() => {nat[1]}.currentTime > 34", timeout=60000, polling=250)
        fila(pagina, "4. y el programa pasó por A", ["b", "c"], "4-paso-por-a")
        repedida = len(pedidos_a) > antes
        rojo += 0 if repedida else 1
        print(f"   {'ok  ' if repedida else 'ROJO'} hls.js volvió a pedir la lista de A después del seek: "
              f"{len(pedidos_a) - antes} pedido(s)")
        pagina.close()

        # inspect.html, modo nativo: sin cambios, marca los tres.
        pagina = nav.new_page(viewport={"width": 1920, "height": 960})
        pagina.goto(f"{base}/inspect.html?modo=nativo")
        pagina.wait_for_function("() => window.demo?.stock?.hls.interstitialsManager?.events"
                                 ".some((e) => e.identifier === 'AD-A-LINEAR' && e.assetListLoaded)", timeout=40000)
        time.sleep(0.5)
        m = breaks_marcados(pagina, "#slot", "window.demo.stock.programme")
        ok = m == ["a", "b", "c"]
        rojo += 0 if ok else 1
        print(f"\n== inspect.html?modo=nativo\n   {'ok  ' if ok else 'ROJO'} con la lista de A llegada marca {m} (sin cambios)")
        pagina.locator("#slot .player").first.screenshot(path=str(salida / "inspect-nativo.png"))
        filas.append({"paso": "inspect nativo", "nativo": m, "ok": ok})
        nav.close()
    (salida / "verificar-marca-a-nativo.json").write_text(json.dumps(filas, indent=2))
    print("\nVERDE" if rojo == 0 else f"\nROJO ({rojo})")
    sys.exit(1 if rojo else 0)


if __name__ == "__main__":
    main()
