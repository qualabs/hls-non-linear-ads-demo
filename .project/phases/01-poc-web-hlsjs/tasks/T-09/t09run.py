"""T-09 -- el par de compatibilidad en la pagina de la demo.

Atrapa UN instante: la instancia de fabrica reproduciendo el aviso lineal y la
de la demo todavia en el contenido primario con la experiencia concurrente
encima. Una sola captura con los dos al lado, porque la evidencia es que ocurre
simultaneamente.

Sin ningun seek: las dos instancias arrancan de cero y se las deja llegar al
START-DATE, que es lo que va a pasar en la grabacion.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

res = {}
reqs = []
console = []

SNAPSHOT = """
() => {
  const { hls, video, provider, stock } = window.demo;
  const stockVideo = document.getElementById('stock-video');
  const overlay = document.querySelector('#ads .ad');

  // Los Date Ranges tal como los ve CADA instancia, con sus atributos. Es el
  // hallazgo de la T-02 que hay que ver sostenido ahora que comparten pagina.
  const dateRanges = (h) => {
    const d = h.latestLevelDetails;
    return Object.entries((d && d.dateRanges) || {}).map(([id, r]) => ({
      id, class: r.class, isInterstitial: r.isInterstitial,
      startDate: String(r.startDate),
      attr: Object.assign({}, r.attr)
    }));
  };
  const q = (el) => {
    const p = el.getVideoPlaybackQuality ? el.getVideoPlaybackQuality() : null;
    return { currentTime: +el.currentTime.toFixed(2), paused: el.paused, muted: el.muted,
             readyState: el.readyState, w: el.videoWidth, h: el.videoHeight,
             decoded: p ? p.totalVideoFrames : null, dropped: p ? p.droppedVideoFrames : null };
  };

  return {
    wall: +performance.now().toFixed(1),
    demo: {
      interstitialsManager: hls.interstitialsManager === null ? 'null' : String(typeof hls.interstitialsManager),
      dateRanges: dateRanges(hls),
      video: q(video),
      overlay: overlay ? q(overlay) : null,
      active: provider.activeAt(video.currentTime).map((e) => ({
        type: e.type, id: e.id,
        window: [+e.startTime.toFixed(2), +(e.startTime + e.duration).toFixed(2)],
        elements: e.elements.map((el) => ({ zDepth: el.zDepth, id: el.id, primary: el.primary,
                                            box: el.box, uri: el.uri })) })),
      paneState: document.getElementById('pane-demo').dataset.state,
      stateLine: document.getElementById('demo-state').textContent,
      hud: document.getElementById('hud').textContent,
      contract: document.getElementById('contract').textContent
    },
    stock: {
      interstitialsManager: stock.hls.interstitialsManager == null ? 'null' : 'objeto',
      scheduled: stock.scheduled,
      playingAd: stock.playingAd,
      dateRanges: dateRanges(stock.hls),
      video: q(stockVideo),
      paneState: document.getElementById('pane-stock').dataset.state,
      stateLine: document.getElementById('stock-state').textContent,
      hud: document.getElementById('stock-hud').textContent
    }
  };
}
"""

# Interferencia: cuanto avanza cada elemento contra el reloj de pared y cuantos
# cuadros descarta, con los TRES decodificando a la vez. Es la lectura de la
# T-01 hecha en la pagina de la demo, ahora que una de las instancias tiene el
# controlador de interstitials encendido.
CONCURRENCIA = """
async () => {
  const pick = () => ({
    'demo/primary': window.demo.video,
    'demo/overlay': document.querySelector('#ads .ad'),
    'stock/linear-ad': document.getElementById('stock-video')
  });
  const snap = () => Object.fromEntries(Object.entries(pick()).map(([k, el]) => {
    if (!el) return [k, null];
    const p = el.getVideoPlaybackQuality ? el.getVideoPlaybackQuality() : null;
    return [k, { t: el.currentTime, decoded: p ? p.totalVideoFrames : null,
                 dropped: p ? p.droppedVideoFrames : null }];
  }));
  const a = snap(); const w0 = performance.now();
  await new Promise((r) => setTimeout(r, 3000));
  const b = snap(); const wall = (performance.now() - w0) / 1000;
  const out = { wallSeconds: +wall.toFixed(3), elements: {} };
  for (const k of Object.keys(b)) {
    if (!a[k] || !b[k]) { out.elements[k] = null; continue; }
    const dt = b[k].t - a[k].t;
    const dd = b[k].decoded - a[k].decoded;
    const dp = b[k].dropped - a[k].dropped;
    out.elements[k] = { avanceSegundos: +dt.toFixed(3),
                        avanceContraRelojDePared: +(100 * dt / wall).toFixed(1),
                        cuadrosDecodificados: dd, cuadrosDescartados: dp,
                        fps: +(dd / wall).toFixed(1),
                        porcentajeDescartado: dd ? +(100 * dp / (dd + dp)).toFixed(2) : null };
  }
  return out;
}
"""

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    ctx = b.contexts[0]
    pg = ctx.pages[0] if ctx.pages else ctx.new_page()
    pg.set_viewport_size({"width": 1600, "height": 1000})
    pg.on("console", lambda m: console.append({"type": m.type, "text": m.text[:400]}))
    pg.on("response", lambda r: reqs.append({"url": r.url, "status": r.status,
                                             "ct": r.headers.get("content-type")}))
    pg.goto(URL, wait_until="load")
    pg.bring_to_front()
    pg.wait_for_function("!!(window.demo && window.demo.provider && window.demo.stock)", timeout=30000)

    # Lo que cada instancia hizo con el par de tags, ANTES de que empiece el
    # aviso: es la lectura de la T-02 y hay que verla sostenida.
    pg.wait_for_function("window.demo.stock.scheduled.length > 0", timeout=30000)
    pg.wait_for_function("window.demo.provider.experiences.length > 0", timeout=30000)
    res["antes_del_aviso"] = pg.evaluate(SNAPSHOT)
    print("ANTES", json.dumps({"stock": res["antes_del_aviso"]["stock"]["scheduled"],
                               "demo": [e["type"] for e in res["antes_del_aviso"]["demo"]["active"]],
                               "t": res["antes_del_aviso"]["demo"]["video"]["currentTime"]}), flush=True)

    # EL INSTANTE. Las cuatro condiciones a la vez, sin tocar ningun reloj:
    # la de fabrica en el aviso lineal, la de la demo en el primario con la
    # experiencia encima, y los dos elementos de la demo pintando.
    pg.wait_for_function("""
      () => {
        const { video, provider, stock } = window.demo;
        const sv = document.getElementById('stock-video');
        const ov = document.querySelector('#ads .ad');
        return stock.playingAd === 'AD-1-LINEAR'
          && sv.readyState >= 2 && !sv.paused && sv.currentTime > 0.5
          && provider.activeAt(video.currentTime).length > 0
          && !video.paused
          && ov && ov.readyState >= 2 && !ov.paused && ov.currentTime > 0.5;
      }
    """, timeout=90000, polling=100)

    res["el_instante"] = pg.evaluate(SNAPSHOT)
    print("INSTANTE", json.dumps({
        "stock": {"playingAd": res["el_instante"]["stock"]["playingAd"],
                  "t": res["el_instante"]["stock"]["video"]["currentTime"],
                  "line": res["el_instante"]["stock"]["stateLine"]},
        "demo": {"active": [e["type"] for e in res["el_instante"]["demo"]["active"]],
                 "t": res["el_instante"]["demo"]["video"]["currentTime"],
                 "line": res["el_instante"]["demo"]["stateLine"]}}, indent=1), flush=True)

    # UNA captura, los dos al lado. El recorte es el bloque del par, que es lo
    # que tiene los dos players con sus etiquetas y nada mas.
    pg.locator(".pair").screenshot(path=str(OUT / "t09-el-par-en-el-mismo-instante.png"))
    pg.screenshot(path=str(OUT / "t09-la-pagina-entera.png"), full_page=True)

    res["concurrencia"] = pg.evaluate(CONCURRENCIA)
    print("CONCURRENCIA", json.dumps(res["concurrencia"], indent=1), flush=True)
    res["durante_la_medicion_de_concurrencia"] = pg.evaluate(SNAPSHOT)

    # Y despues: la de fabrica vuelve al primario y la de la demo pierde la
    # experiencia. Que las dos salgan del estado tambien es parte del par.
    pg.wait_for_function("""
      () => window.demo.stock.playingAd === null
         && window.demo.provider.activeAt(window.demo.video.currentTime).length === 0
    """, timeout=90000, polling=200)
    time.sleep(0.5)
    res["despues_del_aviso"] = pg.evaluate(SNAPSHOT)
    pg.locator(".pair").screenshot(path=str(OUT / "t09-despues-del-aviso.png"))
    print("DESPUES", json.dumps({"stock": res["despues_del_aviso"]["stock"]["stateLine"],
                                 "demo": res["despues_del_aviso"]["demo"]["stateLine"]}), flush=True)

res["red"] = reqs
res["consola"] = console
(OUT / "t09-medicion.json").write_text(json.dumps(res, indent=2))
print("WROTE", OUT / "t09-medicion.json")
