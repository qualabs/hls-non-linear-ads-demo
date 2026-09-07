"""T-03 -- el decoderCount, leido del pedido y no de una foto de la pestana de red.

Lo que se lee es el GET al asset-list: la URL exacta que sale a la red, tal como
la pestana de red la muestra, mas la linea que la capa de senalizacion imprime
con la URL que construyo. Son dos fuentes independientes del mismo string.

Dos corridas, y la diferencia entre las dos es UNA LINEA DE LA PAGINA DEL
INTEGRADOR y ni un byte de la libreria:

  sin configurar   la pagina tal como esta en el repo
  configurado      la misma pagina con `decoderCount: N` agregado al `attach`,
                   inyectado interceptando js/app.js con page.route -- el archivo
                   del repo no se toca, porque la demo no configura decoders
                   (fuera de alcance de la fase)

Con --recorrido corre ademas el recorrido de los cinco breaks hasta el segundo
135 y devuelve los rangos, los seeks y la consola, que es la condicion 2 en su
forma mas dura: sin configurar no cambia nada de lo que hay hoy.

Uso:  python3 t03leer.py <carpeta-de-salida> <etiqueta> [--decoder-count N] [--recorrido]
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
ETIQUETA = sys.argv[2]
ARGS = sys.argv[3:]
DECODER = None
if "--decoder-count" in ARGS:
    DECODER = ARGS[ARGS.index("--decoder-count") + 1]
RECORRIDO = "--recorrido" in ARGS

URL = "http://localhost:8080/"
BREAKS = [(1, 20, "cornerOverlay"), (2, 45, "squeezebackLShape"),
          (3, 70, "squeezebackLShape"), (4, 95, "squeezebackDoubleBox"),
          (5, 120, "multiView")]
FIN = 135.0

ORIGINAL = "  onResolved: logResolved\n});"

ESTADO = """
() => {
  const v = window.demo.video;
  return {
    t: +v.currentTime.toFixed(3),
    activas: window.demo.provider.activeAt(v.currentTime).map((e) => ({
      id: e.id, itemId: e.itemId, type: e.type,
      startTime: +e.startTime.toFixed(3), duration: +e.duration.toFixed(3),
      elementos: e.elements.length })),
    nodos: [...window.demo.layer.querySelectorAll('.ad')]
      .map((n) => ({ elementId: n.dataset.elementId, opacity: n.style.opacity || '' }))
  };
}
"""

res = {"etiqueta": ETIQUETA, "decoderCount": DECODER, "pedidos": [], "consola_asset_list": [],
       "dentro": [], "rangos": None, "seeks": None, "errores": [], "inyeccion": None}
consola = []
pedidos = []


def anotar(req):
    if "/signalling/" in req.url:
        pedidos.append({"url": req.url, "metodo": req.method})


with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda m: consola.append({"type": m.type, "text": m.text[:400]}))
        pg.on("request", anotar)

        if DECODER is not None:
            def con_decoder(route):
                r = route.fetch()
                cuerpo = r.text()
                n = cuerpo.count(ORIGINAL)
                res["inyeccion"] = {"ocurrencias": n, "linea": f"  decoderCount: {DECODER}"}
                if n != 1:
                    route.abort()
                    raise SystemExit(f"la inyeccion no encontro exactamente un attach: {n}")
                nuevo = cuerpo.replace(
                    ORIGINAL, f"  onResolved: logResolved,\n  decoderCount: {DECODER}\n}});")
                route.fulfill(response=r, body=nuevo)
            pg.route("**/js/app.js", con_decoder)

        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.provider.experiences.length === 5", timeout=30000)
        res["superficie"] = pg.evaluate(
            "() => ({ claves: Object.keys(QualabsConcurrentHls),"
            " param: QualabsConcurrentHls.DECODER_COUNT_PARAM })")

        if RECORRIDO:
            pg.evaluate("""() => { window.__seeks = [];
                window.demo.video.addEventListener('seeking', function () {
                  window.__seeks.push(+this.currentTime.toFixed(2)); }); }""")
            pend = list(BREAKS)
            while True:
                m = pg.evaluate(ESTADO)
                for fila in list(pend):
                    n, t0, layout = fila
                    if m["t"] >= t0 + 6:
                        res["dentro"].append(dict(m, breakN=n, esperado=layout))
                        pend.remove(fila)
                        print(f"break {n} t={m['t']}s  activas="
                              f"{[(e['itemId'], e['type'], e['startTime'], e['duration']) for e in m['activas']]}",
                              flush=True)
                if m["t"] >= FIN:
                    break
                time.sleep(0.05)
            res["seeks"] = pg.evaluate("window.__seeks")
        else:
            time.sleep(3)

        res["rangos"] = pg.evaluate("() => window.demo.provider.programRanges()")
    finally:
        pg.close()

res["pedidos"] = pedidos
res["consola_asset_list"] = [c["text"] for c in consola if "asset-list" in c["text"]]
res["errores"] = [c for c in consola if c["type"] == "error"]
(OUT / f"t03-{ETIQUETA}.json").write_text(json.dumps(res, indent=2))

print(f"\n--- {ETIQUETA} (decoderCount={DECODER}) ---")
for q in pedidos:
    print(" ", q["url"])
print("rangos:", json.dumps(res["rangos"]["ranges"]))
print("settled:", res["rangos"]["settled"], " seeks:", res["seeks"])
print("errores:", res["errores"])
