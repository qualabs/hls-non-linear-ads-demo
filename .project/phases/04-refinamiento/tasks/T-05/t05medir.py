"""T-05 -- que forma tiene el reemplazo, medido y no supuesto.

Las dos candidatas del bloque, contra la inserccion que corre hoy como control:

  insercion                       X-RESUME-OFFSET=0          (lo que hay)
  offset-igual-a-la-duracion      X-RESUME-OFFSET=12
  atributo-ausente                sin X-RESUME-OFFSET

Se corre una vez por candidata, con la playlist ya escrita en esa forma. Lo que
se mide es lo que hls.js 1.7.2 hace con cada una, en dos lugares:

  LA AGENDA. Lo que el `interstitialsManager` del pane de fabrica resolvio de
  cada evento antes de reproducir nada: `resumeOffset`, `resumptionOffset`,
  `resumeTime`, `duration` y `appendInPlace`, que es la estrategia con la que
  hls.js va a meter el aviso --appendear en el lugar sobre la linea de tiempo
  del primario, o cambiar el MediaSource--.

  LA REPRODUCCION. El barrido del reloj de los dos panes desde que la pagina
  carga hasta pasado el segundo break, sin un solo seek. Las tres columnas son
  el `currentTime` del elemento de cada pane y el `primary.currentTime` que el
  manager del de fabrica reporta, que es su nocion del segundo del PROGRAMA y no
  la del aviso. De ahi sale el numero que decide: donde retoma el primario
  despues del break --20 s es insercion, 32 s es reemplazo-- y el atraso contra
  el pane de la demo.

La agenda se lee dos veces, antes y despues del barrido, porque el `duration`
del evento cambia cuando el asset list llega: hasta ese momento hls.js usa el
`PLANNED-DURATION` del tag, y despues el largo que el asset list declara. De cual
de los dos sale el segundo en que el primario retoma es justamente la diferencia
entre las dos candidatas.

Uso:  python3 t05medir.py <carpeta-de-salida> <etiqueta> [hasta-que-segundo]
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
ETIQUETA = sys.argv[2]
URL = "http://localhost:8080/"
HASTA = float(sys.argv[3]) if len(sys.argv) > 3 else 60.0  # dos breaks por default
PASO = 0.25

# La agenda del pane de fabrica. `resumeOffset` puede ser NaN --que es como
# hls.js representa el atributo ausente-- y NaN no sobrevive a JSON, asi que va
# como string.
AGENDA = """
() => {
  const m = window.demo.stock.hls.interstitialsManager;
  if (!m) return null;
  const n = (x) => (typeof x === 'number' && isFinite(x) ? +x.toFixed(3) : String(x));
  return {
    eventos: (m.events || []).map((e) => ({
      id: e.identifier,
      clase: e.dateRange?.class,
      startTime: n(e.startTime),
      duration: n(e.duration),
      plannedDuration: n(e.dateRange?.plannedDuration),
      resumeOffset: n(e.resumeOffset),
      resumptionOffset: n(e.resumptionOffset),
      resumeTime: n(e.resumeTime),
      cumulativeDuration: n(e.cumulativeDuration),
      startIsAligned: e.startIsAligned,
      appendInPlace: e.appendInPlace,
      assetListLoaded: e.assetListLoaded
    })),
    largos: { primary: n(m.primary?.duration), integrated: n(m.integrated?.duration) }
  };
}
"""

RELOJES = """
() => {
  const r = (x) => (typeof x === 'number' && isFinite(x) ? +x.toFixed(3) : null);
  const v = window.demo.video;
  const s = document.getElementById('stock-video');
  const m = window.demo.stock.hls.interstitialsManager;
  return {
    demoT: r(v.currentTime),
    stockElemT: r(s.currentTime),
    stockPrimaryT: r(m?.primary?.currentTime),
    stockIntegratedT: r(m?.integrated?.currentTime),
    playingAd: window.demo.stock.playingAd,
    paneStock: document.getElementById('pane-stock').dataset.state,
    stockPaused: s.paused
  };
}
"""

res = {"etiqueta": ETIQUETA, "tagDeClaseApple": None, "assetListLineal": None,
       "agenda": None, "agendaDespues": None, "barrido": [],
       "eventosDelDeFabrica": [], "seeksDelPrimario": None, "errores": []}
consola = []

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda mm: consola.append({"type": mm.type, "text": mm.text[:300]}))
        # El tag que se esta midiendo, leido del servidor y no del disco: es lo
        # que el cliente recibe.
        res["tagDeClaseApple"] = pg.request.get(
            URL + "content/primary/con-daterange.m3u8").text().splitlines()[6]
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("!!window.demo.stock.hls.interstitialsManager", timeout=30000)
        pg.wait_for_function("window.demo.stock.hls.interstitialsManager.events.length === 5",
                             timeout=30000)
        pg.evaluate("""() => {
          window.__seeks = [];
          document.getElementById('stock-video').addEventListener('seeking', function () {
            window.__seeks.push(+this.currentTime.toFixed(2));
          });
        }""")
        res["assetListLineal"] = pg.request.get(
            URL + "signalling/asset-list-linear.json").text().strip()
        res["agenda"] = pg.evaluate(AGENDA)

        capturado = set()
        while True:
            m = pg.evaluate(RELOJES)
            res["barrido"].append(m)
            t = m["demoT"] or 0
            # Una captura adentro de cada uno de los dos breaks.
            for n, t0 in ((1, 20.0), (2, 45.0)):
                if n not in capturado and t0 + 5 <= t <= t0 + 11:
                    pg.locator(".pair").screenshot(
                        path=str(OUT / f"t05-{ETIQUETA}-break{n}-el-par.png"))
                    capturado.add(n)
            if t >= HASTA:
                break
            time.sleep(PASO)

        res["agendaDespues"] = pg.evaluate(AGENDA)
        res["seeksDelPrimario"] = pg.evaluate("window.__seeks")
    finally:
        pg.close()

res["eventosDelDeFabrica"] = [c["text"] for c in consola
                              if c["text"].startswith("[stock] INTERSTITIAL")]
res["errores"] = [c for c in consola if c["type"] == "error"]
res["consola"] = consola
(OUT / f"t05-{ETIQUETA}.json").write_text(json.dumps(res, indent=2))


def en(t):
    """La muestra mas cercana a un segundo del pane de la demo."""
    return min(res["barrido"], key=lambda m: abs((m["demoT"] or 0) - t))


print(f"\n===== {ETIQUETA} =====")
print("tag:", res["tagDeClaseApple"])
print("asset list lineal:", res["assetListLineal"])
print(f"\n{'evento':<16}{'start':<8}{'dur':<7}{'resumeOffset':<14}"
      f"{'resumptionOff':<15}{'resumeTime':<12}{'aligned':<9}{'appendInPlace':<14}")
for e in res["agenda"]["eventos"]:
    print(f"{e['id']:<16}{str(e['startTime']):<8}{str(e['duration']):<7}"
          f"{str(e['resumeOffset']):<14}{str(e['resumptionOffset']):<15}"
          f"{str(e['resumeTime']):<12}{str(e['startIsAligned']):<9}"
          f"{str(e['appendInPlace']):<14}")
print(f"\nla misma agenda con los asset list ya cargados:")
print(f"{'evento':<16}{'dur':<7}{'resumeOffset':<14}{'resumptionOff':<15}"
      f"{'resumeTime':<12}{'appendInPlace':<14}{'listaCargada':<14}")
for e in (res["agendaDespues"] or {}).get("eventos", []):
    print(f"{e['id']:<16}{str(e['duration']):<7}{str(e['resumeOffset']):<14}"
          f"{str(e['resumptionOffset']):<15}{str(e['resumeTime']):<12}"
          f"{str(e['appendInPlace']):<14}{str(e['assetListLoaded']):<14}")
print("\nel barrido, en los segundos que deciden:")
print(f"{'demo t':<9}{'stock elem':<12}{'stock primary':<15}{'aviso':<16}{'atraso':<8}")
for t in [x for x in (10, 19.5, 26, 35, 44.5, 51, 60) if x <= HASTA]:
    m = en(t)
    atraso = (None if m["stockPrimaryT"] is None
              else round((m["demoT"] or 0) - m["stockPrimaryT"], 2))
    print(f"{str(m['demoT']):<9}{str(m['stockElemT']):<12}{str(m['stockPrimaryT']):<15}"
          f"{str(m['playingAd']):<16}{str(atraso):<8}")
print("\neventos del de fabrica:", res["eventosDelDeFabrica"])
print("seeks del elemento de fabrica:", res["seeksDelPrimario"])
print("errores:", res["errores"])
