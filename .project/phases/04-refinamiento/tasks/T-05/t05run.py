"""T-05 -- el recorrido entero con el reemplazo puesto, en UNA corrida.

La pagina se carga una vez y se la deja reproducir hasta pasados los cinco
breaks. No hay seeks, no hay recargas y no se toca el reloj de nadie, que es la
restriccion del recorrido, y los dos elementos llevan su propio contador de
`seeking` para que el "sin seeks" sea una lectura de la pagina y no una promesa
del script.

Lo que se saca de la corrida, que es la definicion de done:

  LA CAPTURA ADENTRO DEL BREAK. Los dos panes en el mismo instante, con el
  numero al lado: el segundo del programa de cada uno. Es el cuadro que la fase
  existe para hacer posible --uno con el aviso encima de la imagen y el otro con
  el aviso en lugar de la imagen, los dos en el mismo segundo-- y hasta esta
  task no se podia tomar.

  EL ATRASO AL FINAL DEL RECORRIDO. El `currentTime` de los dos elementos a los
  160 s, que es el mismo instante en que la T-12 de la fase 01 leyo 49,47 s de
  atraso con la insercion puesta. De las dos cosas es la unica que agarra el
  error fino: dos panes desincronizados por un par de segundos se ven
  sincronizados.

  EL QUINTO BREAK. Con la insercion el pane de fabrica llegaba al quinto
  START-DATE 49,5 s tarde y el aviso no se completaba nunca. Se leen los eventos
  del manager de ese pane con el identificador del evento adentro, mas el
  segundo en que el primario retomo, que es lo que dice que el aviso entro
  entero.

Del elemento del pane de fabrica se leen DOS relojes y no uno, porque durante un
aviso de reemplazo no son el mismo: el `currentTime` del elemento es el del
aviso cuando hls.js cambia el MediaSource, y el `primary.currentTime` del manager
es siempre el segundo del PROGRAMA. Afuera del break los dos coinciden.

Uso:  python3 t05run.py <carpeta-de-salida>
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

# El recorrido, que es la tabla de scripts/senalizar-contenido.sh, y el segundo
# de cada ventana donde se toma la captura del par.
BREAKS = [(1, 20, 6.0, "cornerOverlay", "Overlay"),
          (2, 45, 6.0, "squeezebackLShape", "LBox video"),
          (3, 70, 6.0, "squeezebackLShape-image", "LBox image"),
          (4, 95, 6.0, "squeezebackDoubleBox", "Side by side pullback"),
          (5, 120, 6.0, "multiView", "Quad")]
# El mismo instante en que la T-12 leyo el atraso, para que los dos numeros se
# comparen y no se parezcan.
T_FINAL = 160.0
PASO = 0.25

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
    playingAd: window.demo.stock.playingAd,
    paneDemo: document.getElementById('pane-demo').dataset.state,
    paneStock: document.getElementById('pane-stock').dataset.state,
    demoState: document.getElementById('demo-state').textContent,
    stockState: document.getElementById('stock-state').textContent,
    contract: document.getElementById('contract').textContent,
    avisosDibujados: document.querySelectorAll('#ads .ad').length
  };
}
"""

INSTRUMENTAR = """
() => {
  window.__seeks = { demo: [], stock: [] };
  window.demo.video.addEventListener('seeking', function () {
    window.__seeks.demo.push(+this.currentTime.toFixed(2));
  });
  document.getElementById('stock-video').addEventListener('seeking', function () {
    window.__seeks.stock.push(+this.currentTime.toFixed(2));
  });
  // Los eventos del manager del pane de fabrica CON el identificador adentro.
  // La linea de estado de la pagina no lo lleva, y sin el no se puede decir que
  // el que entro entero fue el quinto.
  window.__eventos = [];
  const hls = window.demo.stock.hls;
  const s = document.getElementById('stock-video');
  const m = () => hls.interstitialsManager;
  for (const name of ['INTERSTITIAL_STARTED', 'INTERSTITIAL_ASSET_STARTED',
                      'INTERSTITIAL_ASSET_ENDED', 'INTERSTITIAL_ENDED',
                      'INTERSTITIALS_PRIMARY_RESUMED']) {
    hls.on(Hls.Events[name], (_e, d) => window.__eventos.push({
      evento: name,
      id: d?.event?.identifier ?? d?.schedule?.[d?.scheduleIndex]?.event?.identifier ?? null,
      elemT: +s.currentTime.toFixed(3),
      primaryT: +(m()?.primary?.currentTime ?? NaN).toFixed(3)
    }));
  }
}
"""

res = {"tagDeClaseApple": None, "capturas": [], "final": None, "eventos": [],
       "seeks": None, "barrido": [], "errores": []}
consola = []

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda mm: consola.append({"type": mm.type, "text": mm.text[:300]}))
        res["tagDeClaseApple"] = pg.request.get(
            URL + "content/primary/con-daterange.m3u8").text().splitlines()[6]
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.provider.experiences.length === 5", timeout=30000)
        pg.wait_for_function("!!window.demo.stock.hls.interstitialsManager", timeout=30000)
        pg.evaluate(INSTRUMENTAR)

        pendientes = {n: (t0, off, layout, nombre) for n, t0, off, layout, nombre in BREAKS}
        while True:
            m = pg.evaluate(RELOJES)
            res["barrido"].append(m)
            t = m["demoT"] or 0
            for n in sorted(pendientes):
                t0, off, layout, nombre = pendientes[n]
                if t >= t0 + off:
                    m2 = dict(m, break_=n, nombre=nombre, layout=layout)
                    m2["mismoSegundoDelPrograma"] = round(
                        (m["demoT"] or 0) - (m["stockPrimaryT"] or 0), 3)
                    pg.locator(".pair").screenshot(
                        path=str(OUT / f"t05-{n}-{layout}-los-dos-panes.png"))
                    res["capturas"].append(m2)
                    del pendientes[n]
                    print(f'CAPTURA break {n} {nombre}: demo t={m["demoT"]}s  '
                          f'fabrica programa={m["stockPrimaryT"]}s elemento={m["stockElemT"]}s  '
                          f'aviso={m["playingAd"]}  paneStock={m["paneStock"]}', flush=True)
                    break
            if t >= T_FINAL:
                break
            time.sleep(PASO)

        final = pg.evaluate(RELOJES)
        final["atrasoDelDeFabricaSegundos"] = round(
            (final["demoT"] or 0) - (final["stockElemT"] or 0), 2)
        final["atrasoContraElProgramaDelManager"] = round(
            (final["demoT"] or 0) - (final["stockPrimaryT"] or 0), 2)
        final["laT12MidioSegundos"] = 49.47
        res["final"] = final
        pg.locator(".pair").screenshot(path=str(OUT / "t05-el-atraso-que-se-fue.png"))
        pg.screenshot(path=str(OUT / "t05-la-pagina-entera.png"), full_page=True)

        res["eventos"] = pg.evaluate("window.__eventos")
        res["seeks"] = pg.evaluate("window.__seeks")
    finally:
        pg.close()

res["errores"] = [c for c in consola if c["type"] == "error"]
res["consola"] = consola
(OUT / "t05-el-recorrido.json").write_text(json.dumps(res, indent=2))

print("\n===== los cinco breaks, los dos panes en el mismo instante =====")
print(f"{'break':<7}{'layout':<26}{'demo t':<10}{'fabrica programa':<19}"
      f"{'fabrica elemento':<19}{'aviso':<16}{'delta':<8}")
for c in res["capturas"]:
    print(f"{c['break_']:<7}{c['layout']:<26}{str(c['demoT']):<10}"
          f"{str(c['stockPrimaryT']):<19}{str(c['stockElemT']):<19}"
          f"{str(c['playingAd']):<16}{str(c['mismoSegundoDelPrograma']):<8}")

f = res["final"]
print("\n===== el atraso al final del recorrido =====")
print(f"  pane de la demo:      {f['demoT']} s")
print(f"  pane de fabrica:      {f['stockElemT']} s  (elemento)   "
      f"{f['stockPrimaryT']} s  (programa, segun su manager)")
print(f"  atraso:               {f['atrasoDelDeFabricaSegundos']} s   "
      f"contra los {f['laT12MidioSegundos']} s que midio la T-12 de la fase 01")
print(f"  demoState:  {f['demoState']}")
print(f"  stockState: {f['stockState']}")

print("\n===== los eventos del pane de fabrica =====")
for e in res["eventos"]:
    print(f"  {e['evento']:<32}{str(e['id']):<16}elemento={e['elemT']:<10}"
          f"programa={e['primaryT']}")
print("\nseeks:", res["seeks"])
print("errores:", res["errores"])
