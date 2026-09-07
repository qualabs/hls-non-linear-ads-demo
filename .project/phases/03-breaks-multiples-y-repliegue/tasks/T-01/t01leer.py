"""T-01 -- las cuatro lecturas del break de tres avisos, en UNA corrida.

La pagina se carga una vez y se la deja reproducir de punta a punta del break.
Nada se afirma mirando: cada numero se lee del estado con el recorrido
corriendo, y `window.demo` expone el proveedor, el renderizador y la capa.

Lo que sale de la corrida:

  1. LA SECUENCIA. En un instante de adentro de cada aviso, `activeAt(t)`
     devuelve exactamente una experiencia, con su `startTime` en el segundo que
     el desplazamiento elegido predice (acumular la DURATION de nivel superior).

  2. LA IDENTIDAD. En el instante del segundo aviso, que nodo hay en la capa:
     su `data-element-id`, su `src` y el `uri` que el contrato le declara.

  3. LA BARRA. `programRanges()` para ese Date Range: un rango, del arranque
     del primer aviso al fin del ultimo.

  4. LA PRECARGA. En el instante anterior a cada transicion, que nodos hay en
     la capa y con que `readyState`.

  Y la caja pedida contra la dibujada, en los tres layouts encadenados.

Uso:  python3 t01leer.py <carpeta-de-salida> <etiqueta>
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
ETIQUETA = sys.argv[2] if len(sys.argv) > 2 else "con-el-arreglo"
URL = "http://localhost:8080/"

# El break: START-DATE en el segundo 20 y tres assets de 12 s declarados.
# Los tres numeros de la prediccion salen de acumular la DURATION de nivel
# superior de cada asset, que es el desplazamiento que la task eligio.
SLOT = 20.0
DURACIONES = [12.0, 12.0, 12.0]
PREDICHO = []
_acc = 0.0
for _d in DURACIONES:
    PREDICHO.append(SLOT + _acc)
    _acc += _d

AVISOS = [
    (0, "ad1-overlay", "cornerOverlay", "/content/adB/index.m3u8", [0, 75, 75, 0]),
    (1, "ad2-overlay", "cornerOverlay", "/content/adC/index.m3u8", [75, 0, 0, 75]),
    (2, "ad3-box", "squeezebackDoubleBox", "/content/adA/index.m3u8", [25, 0, 25, 50]),
]
# Un instante adentro de cada aviso, y uno un poco antes de cada transicion.
DENTRO = [p + 6.0 for p in PREDICHO]
ANTES = [p - 0.6 for p in PREDICHO]
FIN = PREDICHO[-1] + DURACIONES[-1] + 2.0
PASO = 0.05

ESTADO = """
() => {
  const r = (x) => (typeof x === 'number' && isFinite(x) ? +x.toFixed(3) : null);
  const v = window.demo.video;
  const layer = window.demo.layer;
  const frame = layer.getBoundingClientRect();
  const activas = window.demo.provider.activeAt(v.currentTime);
  const nodo = (n) => ({
    tag: n.tagName.toLowerCase(),
    elementId: n.dataset.elementId ?? null,
    src: n.currentSrc || n.src || null,
    readyState: typeof n.readyState === 'number' ? n.readyState : null,
    complete: typeof n.complete === 'boolean' ? n.complete : null,
    paused: typeof n.paused === 'boolean' ? n.paused : null,
    muted: typeof n.muted === 'boolean' ? n.muted : null,
    volume: typeof n.volume === 'number' ? n.volume : null,
    currentTime: r(n.currentTime),
    opacity: n.style.opacity || '',
    zIndex: n.style.zIndex || '',
    rect: (({x, y, width, height}) => ({left: +x.toFixed(3), top: +y.toFixed(3),
      width: +width.toFixed(3), height: +height.toFixed(3)}))(n.getBoundingClientRect())
  });
  return {
    t: r(v.currentTime),
    paused: v.paused,
    videoW: v.videoWidth, videoH: v.videoHeight,
    frame: {left: +frame.x.toFixed(3), top: +frame.y.toFixed(3),
            width: +frame.width.toFixed(3), height: +frame.height.toFixed(3)},
    primaryRect: (({x, y, width, height}) => ({left: +x.toFixed(3), top: +y.toFixed(3),
      width: +width.toFixed(3), height: +height.toFixed(3)}))(v.getBoundingClientRect()),
    primaryVolume: v.volume,
    activas: activas.map((e) => ({
      id: e.id, itemId: e.itemId, type: e.type,
      startTime: r(e.startTime), duration: r(e.duration),
      elements: e.elements.map((el) => ({
        id: el.id, primary: el.primary, box: el.box, zDepth: el.zDepth,
        volume: el.volume, uri: el.uri, mediaType: el.mediaType
      }))
    })),
    nodosEnLaCapa: [...layer.querySelectorAll('.ad')].map(nodo),
    dibujado: (window.demo.renderer?.drawn ?? []).map((d) => ({
      elementId: d.element.id, primary: d.element.primary, uri: d.element.uri,
      box: d.element.box, itemId: d.experience?.itemId ?? null
    })),
    rangos: window.demo.provider.programRanges()
  };
}
"""

INSTRUMENTAR = """
() => {
  window.__seeks = [];
  window.demo.video.addEventListener('seeking', function () {
    window.__seeks.push(+this.currentTime.toFixed(2));
  });
}
"""

res = {"etiqueta": ETIQUETA, "slotStart": SLOT, "duraciones": DURACIONES,
       "predicho": PREDICHO, "experiencias": None,
       "dentro": [], "antes": [], "rangos": None, "seeks": None,
       "errores": [], "consola": []}
consola = []

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda m: consola.append({"type": m.type, "text": m.text[:400]}))
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.provider.experiences.length === 3", timeout=30000)
        pg.evaluate(INSTRUMENTAR)
        res["experiencias"] = pg.evaluate("""() => window.demo.provider.experiences.map((e) => ({
            id: e.id, itemId: e.itemId, type: e.type,
            startTime: +e.startTime.toFixed(3), duration: +e.duration.toFixed(3)}))""")

        pend_dentro = list(enumerate(DENTRO))
        pend_antes = list(enumerate(ANTES))
        while True:
            m = pg.evaluate(ESTADO)
            t = m["t"] or 0
            for i, marca in list(pend_antes):
                if t >= marca:
                    res["antes"].append(dict(m, aviso=i + 1, marca=marca))
                    pend_antes.remove((i, marca))
                    print(f"ANTES de la transicion al aviso {i+1}: t={t}s  "
                          f"nodos={[ (n['elementId'], n['readyState']) for n in m['nodosEnLaCapa'] ]}",
                          flush=True)
            for i, marca in list(pend_dentro):
                if t >= marca:
                    res["dentro"].append(dict(m, aviso=i + 1, marca=marca))
                    pend_dentro.remove((i, marca))
                    print(f"DENTRO del aviso {i+1}: t={t}s  activas="
                          f"{[(e['itemId'], e['type'], e['startTime']) for e in m['activas']]}",
                          flush=True)
            if t >= FIN:
                res["rangos"] = m["rangos"]
                break
            time.sleep(PASO)
        res["seeks"] = pg.evaluate("window.__seeks")
    finally:
        pg.close()

res["consola"] = consola
res["errores"] = [c for c in consola if c["type"] == "error"]
(OUT / f"t01-lecturas-{ETIQUETA}.json").write_text(json.dumps(res, indent=2))
print(f"\nescrito {OUT}/t01-lecturas-{ETIQUETA}.json")
print("seeks:", res["seeks"])
print("errores:", res["errores"])
