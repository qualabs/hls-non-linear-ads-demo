"""T-05 -- el recorrido grabable con el break mezclado adentro, de punta a punta.

Una sola carga y ni un seek: la pagina se abre, se deja reproducir hasta pasado
el fin del break mezclado, y de ahi salen las tres cosas que el done pide.

  1. La monotonia del `currentTime`. Un muestreador adentro de la pagina anota
     cada 50 ms el reloj del primario junto al reloj de pared, asi que un salto
     no se juzga contra un umbral inventado sino contra el tiempo que paso: a
     `playbackRate` 1 los dos avanzan lo mismo, y un seek -- hacia atras o hacia
     adelante -- es exactamente la lectura donde dejan de hacerlo.

  2. Los rangos contra la tabla que el script imprime.

  3. `activeAt` en un instante de adentro de cada aviso, incluidos los cuatro
     del break mezclado, en el orden que la mezcla declara.

Uso: python t05recorrido.py <directorio de salida>
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

# Los instantes de lectura, uno por aviso de la corrida: seis segundos adentro
# de la ventana de cada uno, que es donde el aviso ya esta y todavia no se va.
# Los cuatro ultimos son los del break mezclado.
INSTANTES = [
    (26.0, "break 1", "cornerOverlay"),
    (51.0, "break 2", "squeezebackLShape"),
    (76.0, "break 3", "squeezebackLShape"),
    (101.0, "break 4", "multiView"),
    (126.0, "break 5 / aviso 1", "cornerOverlay"),
    (138.0, "break 5 / aviso 2", "squeezebackDoubleBox"),
    (150.0, "break 5 / aviso 3", "linear"),
    (162.0, "break 5 / aviso 4", "cornerOverlay"),
    (172.0, "despues del break 5", None),
]
FIN = 174.0

ESTADO = """
() => {
  const v = window.demo.video;
  const caja = (b) => `${b.top} ${b.right} ${b.bottom} ${b.left}`;
  return {
    t: +v.currentTime.toFixed(3),
    activas: window.demo.provider.activeAt(v.currentTime).map((e) => ({
      id: e.id, itemId: e.itemId, type: e.type,
      startTime: +e.startTime.toFixed(3), duration: +e.duration.toFixed(3),
      elementos: e.elements.map((el) => ({
        id: el.id, primary: el.primary, zDepth: el.zDepth, box: caja(el.box),
        volume: el.volume, uri: el.uri, mediaType: el.mediaType }))
    })),
    nodos: [...window.demo.layer.querySelectorAll('.ad')].map((n) => ({
      elementId: n.dataset.elementId,
      tag: n.tagName.toLowerCase(),
      opacity: n.style.opacity || '',
      readyState: typeof n.readyState === 'number' ? n.readyState : null,
      volume: typeof n.volume === 'number' ? +n.volume.toFixed(3) : null,
      muted: typeof n.muted === 'boolean' ? n.muted : null,
      paused: typeof n.paused === 'boolean' ? n.paused : null,
      currentTime: typeof n.currentTime === 'number' ? +n.currentTime.toFixed(3) : null
    })),
    primario: { paused: v.paused, volume: +v.volume.toFixed(3), muted: v.muted,
                duration: +v.duration.toFixed(3), playbackRate: v.playbackRate,
                style: v.getAttribute('style') },
    linea: document.getElementById('demo-state').textContent,
    lineaDeFabrica: document.getElementById('stock-state')?.textContent ?? null
  };
}
"""

MUESTREADOR = """
() => {
  const v = window.demo.video;
  window.__seeks = [];
  v.addEventListener('seeking', function () { window.__seeks.push(+this.currentTime.toFixed(3)); });
  window.__muestras = [];
  window.__t0 = performance.now();
  window.__sampler = setInterval(() => {
    window.__muestras.push([+((performance.now() - window.__t0) / 1000).toFixed(3),
                            +v.currentTime.toFixed(3)]);
  }, 50);
}
"""

res = {"lecturas": [], "rangos": None, "rangosDuranteElBreak": None,
       "seeks": None, "muestras": None, "errores": [], "consola": []}
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
        pg.wait_for_function("window.demo.provider.programRanges().settled === true", timeout=30000)
        pg.evaluate(MUESTREADOR)
        pend = list(INSTANTES)
        while True:
            m = pg.evaluate(ESTADO)
            for fila in list(pend):
                t0, nombre, esperado = fila
                if m["t"] >= t0:
                    res["lecturas"].append(dict(m, momento=nombre, esperado=esperado))
                    pend.remove(fila)
                    print(f"{nombre:22s} t={m['t']:7.3f}s  "
                          f"activas={[(e['itemId'], e['type'], e['startTime'], e['duration']) for e in m['activas']]}",
                          flush=True)
                    print(f"{'':22s} linea={m['linea']!r}", flush=True)
            if res["rangosDuranteElBreak"] is None and m["t"] >= 150.0:
                res["rangosDuranteElBreak"] = pg.evaluate("() => window.demo.provider.programRanges()")
            if m["t"] >= FIN:
                break
            time.sleep(0.05)
        res["rangos"] = pg.evaluate("() => window.demo.provider.programRanges()")
        res["seeks"] = pg.evaluate("window.__seeks")
        pg.evaluate("clearInterval(window.__sampler)")
        res["muestras"] = pg.evaluate("window.__muestras")
    finally:
        pg.close()

res["consola"] = consola
res["errores"] = [c for c in consola if c["type"] == "error"]

# La monotonia, juzgada contra el reloj de pared y no contra un umbral.
peor_atras, peor_adelante = 0.0, 0.0
for (w0, t0), (w1, t1) in zip(res["muestras"], res["muestras"][1:]):
    d = t1 - t0
    if d < 0:
        peor_atras = min(peor_atras, d)
    peor_adelante = max(peor_adelante, d - (w1 - w0))
res["monotonia"] = {
    "muestras": len(res["muestras"]),
    "peorSaltoHaciaAtras": round(peor_atras, 3),
    "peorAdelantoSobreElRelojDePared": round(peor_adelante, 3),
    "primera": res["muestras"][0], "ultima": res["muestras"][-1]
}

(OUT / "t05-el-recorrido-con-el-break-mezclado.json").write_text(json.dumps(res, indent=2))
print("\nrangos:", json.dumps(res["rangos"]["ranges"]))
print("settled:", res["rangos"]["settled"], " seeks:", res["seeks"])
print("monotonia:", json.dumps(res["monotonia"]))
print("errores:", res["errores"])
