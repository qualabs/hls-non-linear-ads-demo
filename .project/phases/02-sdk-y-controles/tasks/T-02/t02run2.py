"""T-02 -- la promesa de la lista, vista en los dos estados, y activeAt adentro
de un break.

La primera corrida leyo la lista ya completa: en este POC los cinco asset-list
resuelven en menos de un segundo, asi que `settled` nunca se vio en falso y una
promesa que solo se observa cumplida no esta medida. Aca los asset-list llegan a
proposito tarde -- dos segundos de demora puestos en la red del browser, sin
tocar una linea de codigo -- para leer la lista mientras se esta armando.

Lo que tiene que mostrar:

  1. Con los asset-list en vuelo, `settled` es FALSO y la lista es parcial: estan
     los rangos que se leen del tag y no los que hay que ir a buscar.
  2. Cuando llegan, `settled` es verdadero y la lista es la final. Ningun rango
     de la lectura parcial cambio: la lista solo crecio.
  3. Adentro del primer break, `activeAt` devuelve la experiencia concurrente y
     NADA de clase Apple, aunque el rango de clase Apple si este en la lista.
     Son dos preguntas distintas y contestan distinto en el mismo instante.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"
DEMORA = 2.0

LISTA = """
() => {
  const p = window.demo.provider, v = window.demo.video;
  const r = p.programRanges();
  return {
    currentTime: +v.currentTime.toFixed(3),
    settled: r.settled,
    cuantos: r.ranges.length,
    porClase: r.ranges.reduce((a, x) => (a[x.kind] = (a[x.kind] || 0) + 1, a), {}),
    ranges: r.ranges.map(x => ({ id: x.id, kind: x.kind,
                                 startTime: +x.startTime.toFixed(3),
                                 duration: +x.duration.toFixed(3) })),
    activeAhora: p.activeAt(v.currentTime).map(e => ({ id: e.id, type: e.type }))
  };
}
"""

res = {}
console = []

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda m: console.append({"type": m.type, "text": m.text[:300]}))

        def tarde(route):
            time.sleep(DEMORA)
            route.continue_()
        pg.route("**/signalling/asset-list-*.json", tarde)

        pg.goto(URL, wait_until="commit")
        pg.wait_for_function("!!(window.demo && window.demo.provider)", timeout=30000)
        # La lectura parcial se toma cuando la playlist ya entrego sus Date
        # Ranges y los asset-list todavia estan en vuelo: es el instante en que
        # media lista existe y la otra media no.
        pg.wait_for_function("window.demo.provider.programRanges().ranges.length > 0", timeout=30000)
        res["parcial"] = pg.evaluate(LISTA)
        print("PARCIAL:", json.dumps({k: res["parcial"][k] for k in
              ("currentTime", "settled", "cuantos", "porClase")}), flush=True)

        pg.wait_for_function("window.demo.provider.programRanges().settled === true", timeout=60000)
        res["completa"] = pg.evaluate(LISTA)
        print("COMPLETA:", json.dumps({k: res["completa"][k] for k in
              ("currentTime", "settled", "cuantos", "porClase")}), flush=True)

        res["soloCrecio"] = all(a in res["completa"]["ranges"] for a in res["parcial"]["ranges"])

        # Adentro del primer break, que empieza a los 20 s.
        pg.wait_for_function("window.demo.video.currentTime >= 25", timeout=200000)
        res["adentroDelPrimerBreak"] = pg.evaluate(LISTA)
        print("ADENTRO DEL BREAK:", json.dumps({
            "currentTime": res["adentroDelPrimerBreak"]["currentTime"],
            "activeAhora": res["adentroDelPrimerBreak"]["activeAhora"],
            "cuantos": res["adentroDelPrimerBreak"]["cuantos"],
            "porClase": res["adentroDelPrimerBreak"]["porClase"]}), flush=True)
        res["errores"] = [c for c in console if c["type"] == "error"]
    finally:
        pg.close()

(OUT / "t02-la-promesa-de-la-lista.json").write_text(json.dumps(res, indent=2))
print("\nWROTE", OUT / "t02-la-promesa-de-la-lista.json")
print("SOLO CRECIO:", res["soloCrecio"], "| ERRORES:", len(res["errores"]))
