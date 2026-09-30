#!/usr/bin/env python3
"""index.html con un control por player: cada lado dibuja lo suyo y pide con lo suyo.

Fase 15, pedido de Nicolás: cada pane de la página del par se configura solo --
"HLS interstitials nativo" o "con nuestra librería", y en el segundo las dos
capacidades -- y la combinación viaja en la URL. Esto abre la página con cada
combinación de COMBINACIONES, salta a los breaks A y B con los botones de la
página, y mide por lado:

  LO QUE DIBUJA. Un lado nativo, en B (que tiene lineal), está reproduciendo el
  aviso lineal (`playingAd` de su propio interstitials manager); en A, que no
  tiene default (ADR 0087), no reproduce nada. Un lado con nuestra librería
  tiene activo el layout que sus capacidades mandan (ADR 0085 y 0088), leído del
  contrato de ESA instancia, y la cuenta de <video> y <img> de SU caja.

  LO QUE PIDE. La lista de pedidos de asset-list de ESE lado: los dos piden el
  MISMO asset-list por break (ADR 0090), nuestra librería con SUS sgai-* y el
  nativo sin ellos, y sólo para los breaks con default. Dos lados del mismo modo con capacidades distintas tienen que dar
  queries distintas.

EL CONTROL es que la medición distingue: la combinación "nuestro 1 dec con
imágenes" contra "nuestro 1 dec sin imágenes" tiene que dar composiciones
distintas en B en los dos lados, y el nativo contra nativo, la misma.

Uso:  verificar-pares.py --puerto 8093 --salida <dir>     (o --base <url>)
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
BREAKS = {b["id"]: b for b in STAGE["breaks"]}

COMBINACIONES = [
    ("nativo", "ours-2dec-img"),        # el default: lo que ya se mostró
    ("ours-1dec-img", "ours-1dec-noimg"),
    ("nativo", "nativo"),
    ("ours-2dec-noimg", "nativo"),
]


def esperado(config, brk):
    """Lo que un lado tiene que dibujar en un break, escrito acá y no leído de la página."""
    if config == "nativo":
        return {"aviso_lineal": bool(brk["lineal"])}
    dec, img = config.split("-")[1:]
    if dec == "2dec":
        return {"layout": brk["layout"], "video": 2, "img": 0}
    if img == "img":
        return {"layout": STAGE["formas"][brk["formaImagen"]]["layout"], "video": 1, "img": 1}
    if brk["lineal"]:
        return {"layout": "linear", "video": 2, "img": 0}
    return {"layout": None, "video": 1, "img": 0}


LEER_LADO = """
lado => {
  const l = window.demo.lados[lado];
  const caja = document.getElementById('slot-' + lado);
  if (l.modo === 'nativo') {
    // Qué asset reproduce el hls.js de fábrica, leído de su propio manager: es la
    // medición de que ignora el bloque enriquecido y toma la parte estándar.
    const a = l.stock.hls.interstitialsManager?.playingAsset;
    return { aviso_lineal: l.stock.playingAd != null, t: l.programa.currentTime,
             asset: a ? { uri: new URL(a.uri, location.href).pathname, duracion: a.duration } : null };
  }
  const t = l.video.currentTime;
  return {
    layout: l.concurrent.provider.activeAt(t).map((e) => e.type)[0] ?? null,
    video: [...caja.querySelectorAll('video')].filter((v) => v.readyState > 0 || v.src).length,
    img: [...caja.querySelectorAll('img')].filter((i) => i.getAttribute('src') && !/logo/i.test(i.getAttribute('src'))).length,
    t
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
    rojo, filas, composiciones_b = 0, [], {}

    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome",
                                 args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
        for izq, der in COMBINACIONES:
            pagina = nav.new_page(viewport={"width": 1907, "height": 1300})
            pagina.goto(f"{base}/index.html?izq={izq}&der={der}")
            pagina.wait_for_function("window.demo && window.demo.lados")
            config = pagina.evaluate("() => window.demo.config")
            leido = {lado: (c["modo"] if c["modo"] == "nativo" else
                            f"ours-{c['capacidades']['videoDecoders']}dec-{'img' if c['capacidades']['imageOverVideo'] else 'noimg'}")
                     for lado, c in config.items()}
            ok_url = leido == {"izq": izq, "der": der}
            rojo += 0 if ok_url else 1
            print(f"\n== izq={izq}  der={der}   la página leyó la URL: {'ok' if ok_url else 'ROJO ' + str(leido)}")
            for brk_id in ("a", "b", "c"):
                brk = BREAKS[brk_id]
                pagina.get_by_role("button", name=f"break {brk_id.upper()}", exact=True).click()
                # Un lado nativo congela su reloj de programa durante el aviso lineal:
                # adentro del break el reloj que avanza es el del aviso. Así que el
                # lado nativo "entró" cuando reproduce el aviso o, si el break no
                # tiene lineal, cuando su programa pasó el punto; el nuestro, cuando
                # su reloj -- que nunca se detiene -- pasó el punto.
                pagina.wait_for_function("""t => ['izq','der'].every((lado) => {
                    const l = window.demo.lados[lado];
                    return l.modo === 'nativo'
                      ? l.stock.playingAd != null || l.programa.currentTime > t
                      : l.video.currentTime > t; })""",
                    arg=brk["offset"] + 3.5, timeout=40000)
                time.sleep(1.0)
                for lado, cfg in (("izq", izq), ("der", der)):
                    obtenido = pagina.evaluate(LEER_LADO, lado)
                    t = round(obtenido.pop("t"), 1)
                    asset = obtenido.pop("asset", None)
                    if cfg == "nativo":
                        # LA PARTE ESTÁNDAR DEL ASSET-LIST ENRIQUECIDO (ADR 0090): en un break
                        # con default, el hls.js de fábrica reproduce su URI y su DURATION.
                        pieza = next(p for p in STAGE["assets"]["piezas"]
                                     if p["campana"] == brk["campana"] and p["forma"] == "16x9")
                        # La duración es la que hls.js MIDIÓ del asset (medido: 12,067 s para un
                        # creativo de 360 cuadros declarado en 12), así que se compara con una
                        # tolerancia de dos cuadros y no por igualdad.
                        esp_asset = {"uri": "/" + pieza["video"], "duracion": brk["duracion"]} if brk["lineal"] else None
                        ok_asset = (asset is None and esp_asset is None) or (
                            asset is not None and esp_asset is not None and asset["uri"] == esp_asset["uri"]
                            and abs(asset["duracion"] - esp_asset["duracion"]) <= 2 / 30)
                        rojo += 0 if ok_asset else 1
                        print(f"   {'ok  ' if ok_asset else 'ROJO'} break {brk_id} {lado} asset que reproduce hls.js: {asset}"
                              + ("" if ok_asset else f"   esperado {esp_asset}"))
                    esp = esperado(cfg, brk)
                    ok = obtenido == esp
                    rojo += 0 if ok else 1
                    print(f"   {'ok  ' if ok else 'ROJO'} break {brk_id} {lado} ({cfg:<15}) t={t:>6}  {obtenido}"
                          + ("" if ok else f"   esperado {esp}"))
                    if brk_id == "b":
                        composiciones_b[(izq, der, lado)] = json.dumps(obtenido, sort_keys=True)
                pagina.screenshot(path=str(salida / f"par-{izq}__{der}-break-{brk_id}.png"), full_page=True)
            # LO QUE PIDIÓ CADA LADO
            for lado, cfg in (("izq", izq), ("der", der)):
                pedidos = [p["url"] for p in pagina.evaluate("l => window.demo.pedidos(l)", lado)]
                if cfg == "nativo":
                    # El mismo asset-list que pide nuestra librería (ADR 0090), sin sgai-*.
                    ok = bool(pedidos) and all("asset-list-break-" in u and "sgai-" not in u for u in pedidos)
                else:
                    dec, img = cfg.split("-")[1:]
                    q = f"sgai-video-decoders={dec[0]}&sgai-image-over-video={1 if img == 'img' else 0}"
                    ok = bool(pedidos) and all("asset-list-break-" in u and q in u for u in pedidos)
                rojo += 0 if ok else 1
                print(f"   {'ok  ' if ok else 'ROJO'} pedidos {lado} ({cfg}): {len(pedidos)}")
                for u in sorted(set(pedidos)):
                    print(f"          {u.split('/signalling/')[-1]}")
            pagina.locator("#pane-izq .wire--pane").screenshot(path=str(salida / f"pedidos-{izq}__{der}-izq.png"))
            pagina.locator("#pane-der .wire--pane").screenshot(path=str(salida / f"pedidos-{izq}__{der}-der.png"))
            pagina.close()
        nav.close()

    # EL CONTROL: la medición distingue lo que tiene que distinguir, e iguala lo igual
    img_vs_noimg = composiciones_b[("ours-1dec-img", "ours-1dec-noimg", "izq")] != \
        composiciones_b[("ours-1dec-img", "ours-1dec-noimg", "der")]
    nat_vs_nat = composiciones_b[("nativo", "nativo", "izq")] == composiciones_b[("nativo", "nativo", "der")]
    print(f"\ncontrol: en B, 1 dec con imágenes contra sin imágenes -> {'distintos' if img_vs_noimg else 'IGUALES (ROJO)'}")
    print(f"control: en B, nativo contra nativo -> {'iguales' if nat_vs_nat else 'DISTINTOS (ROJO)'}")
    rojo += (0 if img_vs_noimg else 1) + (0 if nat_vs_nat else 1)
    print("\nVERDE" if rojo == 0 else f"\nROJO ({rojo})")
    sys.exit(1 if rojo else 0)


if __name__ == "__main__":
    main()
