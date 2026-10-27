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
  nativo sin ellos, también A, que no tiene default y el nativo saltea (ADR 0091).
  Dos lados del mismo modo con capacidades distintas tienen que dar
  queries distintas.

EL CONTROL es que la medición distingue: la combinación "nuestro 1 dec con
imágenes" contra "nuestro 1 dec sin imágenes" tiene que dar composiciones
distintas en B en los dos lados, y el nativo contra nativo, la misma.

Uso:  verificar-pares.py --puerto 8093 --salida <dir>     (o --base <url>)
"""

import argparse
import json
import os
import re
import sys
import time
from urllib.parse import parse_qsl, urlsplit
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


def leer_config(c):
    """The configuration of a pane as the page read it, in the grammar of the URL."""
    if c["modo"] == "nativo":
        return "nativo"
    cap = c["capacidades"]
    return f"{c['modo']}-{cap['concurrentVideo']}dec-{'img' if cap['concurrentImage'] else 'noimg'}"


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
    ap.add_argument("--solo-dash", action="store_true", help="only the HLS|DASH pairs (phase 19)")
    args = ap.parse_args()
    base = args.base.rstrip("/") if args.base else f"http://localhost:{args.puerto}"
    salida = Path(args.salida)
    salida.mkdir(parents=True, exist_ok=True)
    rojo, filas, composiciones_b = 0, [], {}

    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome",
                                 args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
        for izq, der in ([] if args.solo_dash else COMBINACIONES):
            pagina = nav.new_page(viewport={"width": 1907, "height": 1300})
            pagina.goto(f"{base}/index.html?izq={izq}&der={der}")
            pagina.wait_for_function("window.demo && window.demo.lados")
            config = pagina.evaluate("() => window.demo.config")
            leido = {lado: leer_config(c) for lado, c in config.items()}
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

        rojo += pares_dash(nav_dash := pw.chromium.launch(channel="chrome", args=[
            "--autoplay-policy=no-user-gesture-required", "--mute-audio"]), base, salida)
        nav_dash.close()

    # EL CONTROL: la medición distingue lo que tiene que distinguir, e iguala lo igual
    if not args.solo_dash:
        img_vs_noimg = composiciones_b[("ours-1dec-img", "ours-1dec-noimg", "izq")] != \
            composiciones_b[("ours-1dec-img", "ours-1dec-noimg", "der")]
        nat_vs_nat = composiciones_b[("nativo", "nativo", "izq")] == composiciones_b[("nativo", "nativo", "der")]
        print(f"\ncontrol: en B, 1 dec con imágenes contra sin imágenes -> {'distintos' if img_vs_noimg else 'IGUALES (ROJO)'}")
        print(f"control: en B, nativo contra nativo -> {'iguales' if nat_vs_nat else 'DISTINTOS (ROJO)'}")
        rojo += (0 if img_vs_noimg else 1) + (0 if nat_vs_nat else 1)
    print("\nVERDE" if rojo == 0 else f"\nROJO ({rojo})")
    sys.exit(1 if rojo else 0)


# ===========================================================================
# HLS AGAINST DASH (phase 19)
# ===========================================================================
# One pane with our library over HLS and one over DASH, with the same
# capabilities, in each of the four combinations. What has to come out the same,
# break by break, is what the pair claims: the option PRESENTED (after the
# renderer's failover, its layout and its media, a playlist and an MPD counting as
# the same video), the WINDOW of every break on each pane's contract, the QUERY each
# pane asked its list with, that B (ONCE) does not come back after a seek, that
# the traditional linear break is on screen in both, and what the post-roll plays.
# The two programmes start at the same 0.0667 s (T-06), so nothing is discounted.
#
# TWO CONTROLS, because a comparison that always says "the same" measures nothing:
# two DASH panes with different capabilities have to give different compositions
# in B; and an MPD of a creative answered 404 (a Playwright route, the files are
# not touched) has to make the DASH pane fall to its next option while the HLS one,
# which never asks for that MPD, does not.

PARES_DASH = [(f"ours-{d}-{i}", f"dash-{d}-{i}") for d in ("2dec", "1dec") for i in ("img", "noimg")]

LEER_PANE = """
lado => {
  const l = window.demo.lados[lado];
  const t = l.video.currentTime;
  const norm = (m) => /mpegurl|dash\\+xml/i.test(m || '') ? 'video' : (m || 'linear');
  const presented = l.concurrent.presentedAt(t).map((e) => ({
    type: e.type, media: e.elements.filter((x) => !x.primary).map((x) => norm(x.mediaType)) }));
  const ranges = l.concurrent.provider.programRanges().ranges.map((r) => ({
    id: String(r.id), kind: r.kind, startTime: r.startTime, duration: r.duration }));
  const linear = l.modo === 'ours' ? l.concurrent.linearOnScreen()
    : presented.some((e) => e.type === 'linear') && l.concurrent.presentedAt(t).some((e) => String(e.id) === String(window.demo.stage.breaks.length + 1));
  return { modo: l.modo, t, programa: l.programa.currentTime, presented, ranges, linear,
           pedidos: l.pedidos.map((p) => p.url), post: l.presentados?.post ?? null };
}
"""


def break_de(pane_id, modo):
    """The letter of a break from the id each transport gives it: `AD-B` in HLS, the Event@id 3 in DASH."""
    if modo == "dash":
        n = int(pane_id) if str(pane_id).isdigit() else 0
        if 1 <= n <= len(STAGE["breaks"]):
            return STAGE["breaks"][n - 1]["id"]
        return STAGE["breakLineal"]["id"] if n == len(STAGE["breaks"]) + 1 else None
    m = re.match(r"^AD-([A-Z0-9]+)", str(pane_id), re.I)
    return m.group(1).lower() if m else None


def ventanas(leido):
    """The window of every break on a pane's contract, by letter, to the millisecond."""
    return {break_de(r["id"], leido["modo"]): (r["kind"], round(r["startTime"], 3), round(r["duration"], 3))
            for r in leido["ranges"]}


def query_de(urls, letra):
    for u in urls:
        if re.search(rf"(asset-list|slots)-break-{letra}\.json", u):
            return "&".join(sorted(f"{k}={v}" for k, v in parse_qsl(urlsplit(u).query)))
    return None


def esperar(pagina, expr, arg=None, timeout=40000):
    pagina.wait_for_function(expr, arg=arg, timeout=timeout)


def pares_dash(nav, base, salida):
    rojo = 0
    composicion_b = {}

    def check(ok, texto):
        nonlocal rojo
        rojo += 0 if ok else 1
        print(f"   {'ok  ' if ok else 'ROJO'} {texto}")

    casos = [(izq, der, None) for izq, der in PARES_DASH]
    casos += [("dash-1dec-img", "dash-1dec-noimg", None),                      # control 1
              ("ours-2dec-img", "dash-2dec-img", "**/ketrava-backplate/*/dash/manifest.mpd")]  # control 2
    for izq, der, plantado in casos:
        pagina = nav.new_page(viewport={"width": 1907, "height": 1300})
        if plantado:
            pagina.route(plantado, lambda ruta: ruta.fulfill(status=404, body="planted 404"))
        pagina.goto(f"{base}/index.html?izq={izq}&der={der}")
        esperar(pagina, "window.demo && window.demo.lados && ['izq','der'].every((l) => window.demo.lados[l].video.readyState >= 2)")
        print(f"\n== izq={izq}  der={der}" + (f"  404 PLANTADO en {plantado}" if plantado else ""))
        comparar = plantado is None and izq.startswith("ours")
        leer = lambda: {lado: pagina.evaluate(LEER_PANE, lado) for lado in ("izq", "der")}
        # Each break right after its own jump: a jump rebuilds both panes, so what one
        # arming asked for and resolved is read inside that arming.
        for letra in ("pre", "a", "b", "c"):
            brk = BREAKS[letra]
            if letra == "pre":
                pagina.get_by_role("button", name="start", exact=True).click()
                at = 4.0
            else:
                pagina.get_by_role("button", name=f"break {letra.upper()}", exact=True).click()
                at = brk["offset"] + 3.5
            esperar(pagina, "t => ['izq','der'].every((l) => window.demo.lados[l].video.currentTime > t)", at)
            time.sleep(1.0)
            par = leer()
            for lado in ("izq", "der"):
                print(f"   break {letra:<4} {lado} t={par[lado]['t']:6.1f}  {par[lado]['presented']}")
            if letra == "b":
                composicion_b[(izq, der)] = {lado: json.dumps(par[lado]["presented"]) for lado in ("izq", "der")}
            pagina.screenshot(path=str(salida / f"dash-{izq}__{der}{'-404' if plantado else ''}-break-{letra}.png"))
            if not comparar:
                continue
            check(par["izq"]["presented"] == par["der"]["presented"],
                  f"break {letra}: the same presented in both ({par['izq']['presented'] or 'nothing'})")
            vh, vd = ventanas(par["izq"]).get(letra), ventanas(par["der"]).get(letra)
            check((vh is None and vd is None) or (vh and vd and vh[0] == vd[0] and abs(vh[1] - vd[1]) <= 0.05
                                                   and abs(vh[2] - vd[2]) <= 0.05),
                  f"window of {letra}: HLS {vh}  DASH {vd}")
            qh, qd = query_de(par["izq"]["pedidos"], letra), query_de(par["der"]["pedidos"], letra)
            check(qh is not None and qh == qd and "sgai-video-decoders" in qh, f"request of {letra}: HLS ?{qh}  DASH ?{qd}")
            if letra == "b":
                # ONCE: out of it and back, in the same arming (irA seeks, it does not rebuild)
                pagina.evaluate("demo.irA(80)")
                esperar(pagina, "() => ['izq','der'].every((l) => window.demo.lados[l].video.currentTime > 79)")
                time.sleep(1.0)
                pagina.evaluate("demo.irA(67)")
                esperar(pagina, "() => ['izq','der'].every((l) => Math.abs(window.demo.lados[l].video.currentTime - 67.5) < 1.5)")
                time.sleep(1.0)
                par = leer()
                check(par["izq"]["presented"] == [] and par["der"]["presented"] == []
                      and ventanas(par["izq"]).get("b") is None and ventanas(par["der"]).get("b") is None,
                      f"B (ONCE) after leaving it and seeking back: HLS {par['izq']['presented']}  DASH {par['der']['presented']}, "
                      f"its window gone from both bars")
        if comparar:
            pagina.get_by_role("button", name=f"break {STAGE['breakLineal']['id'].upper()} (traditional)", exact=True).click()
            try:
                esperar(pagina, "() => ['izq','der'].every((l) => { const x = window.demo.lados[l]; "
                        "return x.modo === 'ours' ? x.concurrent.linearOnScreen() : x.concurrent.presentedAt(x.video.currentTime).some((e) => e.type === 'linear'); })",
                        timeout=30000)
            except Exception:
                pass
            par = leer()
            check(par["izq"]["linear"] and par["der"]["linear"],
                  f"the linear break on screen in both: HLS {par['izq']['linear']} (programme {par['izq']['programa']:.1f})  "
                  f"DASH {par['der']['linear']} (programme {par['der']['programa']:.1f})")
            pagina.screenshot(path=str(salida / f"dash-{izq}__{der}-break-linear.png"))
            esperar(pagina, "() => ['izq','der'].every((l) => window.demo.lados[l].programa.currentTime > 163)", timeout=30000)
            par = leer()
            check(all(par[l]["programa"] > 162 for l in par), f"both back to the programme after it: HLS {par['izq']['programa']:.1f}  DASH {par['der']['programa']:.1f}")
            pagina.get_by_role("button", name="break POST", exact=True).click()
            try:
                esperar(pagina, "() => ['izq','der'].every((l) => window.demo.lados[l].presentados?.post)", timeout=60000)
            except Exception:
                pass
            par = leer()
            resumen = lambda r: r and {k: r.get(k) for k in ("type", "outcome", "presented", "itemId") if k in r}
            ph, pd = resumen(par["izq"]["post"]), resumen(par["der"]["post"])
            check(bool(ph) and bool(pd) and ph.get("presented") == pd.get("presented") and (ph.get("presented") or {}).get("linear") is True,
                  f"post-roll presented: HLS {ph}  DASH {pd}")
        if plantado:
            hls_b = json.loads(composicion_b[(izq, der)]["izq"])
            dash_b = json.loads(composicion_b[(izq, der)]["der"])
            ok = hls_b and dash_b and hls_b[0]["media"] == ["video"] and dash_b[0]["media"] != ["video"]
            rojo += 0 if ok else 1
            print(f"control: with the MPD of B answered 404, DASH falls to its next option and HLS does not -> "
                  f"HLS {hls_b}  DASH {dash_b}  {'ok' if ok else 'ROJO'}")
        pagina.close()
    distintos = composicion_b[("dash-1dec-img", "dash-1dec-noimg")]["izq"] != composicion_b[("dash-1dec-img", "dash-1dec-noimg")]["der"]
    print(f"control: in B, DASH 1 dec with images against without -> {'different' if distintos else 'THE SAME (ROJO)'}")
    rojo += 0 if distintos else 1
    return rojo


if __name__ == "__main__":
    main()
