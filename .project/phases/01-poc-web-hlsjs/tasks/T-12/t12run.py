"""T-12 -- los cinco layouts del recorrido, medidos uno por uno.

Esta corrida SI usa seeks, porque lo que mide es cada uno de los cinco breaks y
esperar el recorrido entero para cada medicion son diez minutos. La corrida sin
un solo seek, que es la del done, es `t12sinseek.py`.

Mide tres cosas por break:

1. La LUZ de cada asset a lo largo de los doce segundos de la ventana, con el
   metodo que dejo escrito la T-11: un canvas de 64x36 y la luma Rec.709 del
   cuadro, muestreada mientras la pagina reproduce. De aca sale el instante de
   la captura de cada layout —el mas claro de la ventana— y sale tambien el
   numero que dice que layout se queda sin material.
2. La CAJA pedida contra la dibujada, en pixeles, con la cuenta de los
   porcentajes hecha aparte del renderizador. Es la misma medicion de la T-07,
   la T-10 y la T-11, ahora sobre los cinco layouts y sobre los dos tipos de
   nodo: un <video> y un <img>.
3. El LLENADO del ADR 0013 en cada caja, que en el LBox image es la primera vez
   que se calcula sobre la relacion de aspecto de una imagen.

Y una vez, en el break de las imagenes, el estado del control de audio del
ADR 0010: es el unico layout de los cinco cuyos assets no tienen audio.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

# El recorrido, igual que en scripts/senalizar-contenido.sh.
# Numero de break, segundo en que arranca, `type` que declara el payload, nombre
# del archivo de la captura y nombre del documento de requerimientos. El tipo y
# el archivo no son lo mismo en el break 3: los dos LBox declaran el mismo
# `squeezebackLShape` y lo que los distingue es el tipo de asset (ADR 0012).
BREAKS = [
    (1, 20,  "cornerOverlay",        "cornerOverlay",           "Overlay"),
    (2, 45,  "squeezebackLShape",    "squeezebackLShape",       "LBox video"),
    (3, 70,  "squeezebackLShape",    "squeezebackLShape-image", "LBox image"),
    (4, 95,  "squeezebackDoubleBox", "squeezebackDoubleBox",    "Side by side pullback"),
    (5, 120, "multiView",            "multiView",               "Quad"),
]

# La luminancia de cada nodo del aviso y del primario, con el canvas de la T-11.
# Generalizada a los dos tipos de nodo, porque un <img> no tiene videoWidth ni
# currentTime.
LUZ = """
() => {
  const c = document.createElement('canvas'); c.width = 64; c.height = 36;
  const g = c.getContext('2d', { willReadFrequently: true });
  const listo = (n) => n.tagName === 'IMG' ? n.naturalWidth > 0 : n.videoWidth > 0;
  const lum = (n) => {
    if (!listo(n)) return null;
    g.drawImage(n, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i+1] + 0.0722 * d[i+2];
    return +(s / (d.length / 4)).toFixed(1);
  };
  const out = { time: +window.demo.video.currentTime.toFixed(2),
                primaryContent: lum(window.demo.video), assets: {} };
  for (const n of document.querySelectorAll('#ads .ad'))
    out.assets[n.dataset.elementId] = {
      tag: n.tagName.toLowerCase(),
      adTime: n.tagName === 'IMG' ? null : +n.currentTime.toFixed(2),
      luz: lum(n) };
  return out;
}
"""

MEASURE = """
() => {
  const { video, provider, renderer } = window.demo;
  const layer = document.getElementById('ads');
  const area = layer.getBoundingClientRect();
  const active = provider.activeAt(video.currentTime);
  const r6 = (v) => +v.toFixed(6);
  const src = (n) => n.tagName === 'IMG'
    ? { w: n.naturalWidth, h: n.naturalHeight }
    : { w: n.videoWidth, h: n.videoHeight };
  const out = { time: +video.currentTime.toFixed(3),
                playerArea: { w: +area.width.toFixed(2), h: +area.height.toFixed(2),
                              aspecto: +(area.width / area.height).toFixed(4) },
                fillMode: renderer.FILL_MODE, elements: [] };
  for (const exp of active) {
    out.type = exp.type; out.id = exp.id;
    out.window = [ +exp.startTime.toFixed(2), +(exp.startTime + exp.duration).toFixed(2) ];
    for (const el of exp.elements) {
      // La caja esperada: regla 1 del contrato, recalculada ACA a partir de los
      // porcentajes y no preguntada al renderizador.
      const left = area.width * el.box.left / 100;
      const top = area.height * el.box.top / 100;
      const esperado = { left, top,
        width: area.width - left - area.width * el.box.right / 100,
        height: area.height - top - area.height * el.box.bottom / 100 };
      const node = el.primary ? video : layer.querySelector(`.ad[data-element-id="${el.id}"]`);
      const r = node ? node.getBoundingClientRect() : null;
      const got = r ? { left: r.left - area.left, top: r.top - area.top, width: r.width, height: r.height } : null;
      const delta = got ? Math.max(Math.abs(got.left - esperado.left), Math.abs(got.top - esperado.top),
                                   Math.abs(got.width - esperado.width), Math.abs(got.height - esperado.height)) : null;
      const cs = node ? getComputedStyle(node) : null;
      const s = node ? src(node) : null;

      let llenado = null;
      if (s && s.w && s.h && got) {
        const aspectoFuente = s.w / s.h;
        const aspectoCaja = got.width / got.height;
        const escala = Math.max(got.width / s.w, got.height / s.h);   // cover
        const visible = { w: Math.min(s.w, got.width / escala), h: Math.min(s.h, got.height / escala) };
        llenado = {
          aspectoFuente: +aspectoFuente.toFixed(4),
          aspectoCaja: +aspectoCaja.toFixed(4),
          fuentePx: { w: s.w, h: s.h },
          visibleDeLaFuentePx: { w: +visible.w.toFixed(1), h: +visible.h.toFixed(1) },
          recortePorCiento: +((1 - (visible.w * visible.h) / (s.w * s.h)) * 100).toFixed(2),
          ejeRecortado: aspectoCaja > aspectoFuente ? 'vertical' : (aspectoCaja < aspectoFuente ? 'horizontal' : 'ninguno'),
          estiramientoSiFillPorCiento: +(Math.abs(aspectoCaja / aspectoFuente - 1) * 100).toFixed(1)
        };
      }
      out.elements.push({
        element: el.id, primary: el.primary, tag: node ? node.tagName.toLowerCase() : null,
        zDepth: el.zDepth, box: el.box, uri: el.uri, mediaType: el.mediaType, volume: el.volume,
        esperadoPx: Object.fromEntries(Object.entries(esperado).map(([k,v]) => [k, r6(v)])),
        medidoPx: got && Object.fromEntries(Object.entries(got).map(([k,v]) => [k, r6(v)])),
        deltaMaxPx: delta === null ? null : +delta.toFixed(6),
        objectFit: cs && cs.objectFit, zIndex: cs && cs.zIndex,
        position: cs && cs.position, transform: cs && cs.transform,
        llenado
      });
    }
  }
  return out;
}
"""

ESTADO = """
() => ({
  time: +window.demo.video.currentTime.toFixed(2),
  contract: document.getElementById('contract').textContent,
  demoState: document.getElementById('demo-state').textContent,
  stockState: document.getElementById('stock-state').textContent,
  paneDemo: document.getElementById('pane-demo').dataset.state,
  paneStock: document.getElementById('pane-stock').dataset.state,
  boton: { text: document.getElementById('ad-audio').textContent.trim(),
           disabled: document.getElementById('ad-audio').disabled },
  adAudioOn: window.demo.renderer.adAudioOn,
  videosEnLaPestana: document.querySelectorAll('video').length,
  imagenesDelAviso: document.querySelectorAll('#ads img.ad').length,
  nodos: [...document.querySelectorAll('#ads .ad')].map(n => ({
    id: n.dataset.elementId, tag: n.tagName.toLowerCase(),
    muted: n.tagName === 'IMG' ? null : n.muted,
    listo: n.tagName === 'IMG' ? n.naturalWidth > 0 : n.readyState >= 2,
    w: n.tagName === 'IMG' ? n.naturalWidth : n.videoWidth,
    h: n.tagName === 'IMG' ? n.naturalHeight : n.videoHeight }))
})
"""

res = {"breaks": {}}
reqs, console = [], []

def esperar_nodos(pg, n):
    pg.wait_for_function("""(n) => {
      const a = [...document.querySelectorAll('#ads .ad')];
      return a.length === n && a.every(x => x.tagName === 'IMG' ? x.naturalWidth > 0
                                                                : (x.readyState >= 2 && !x.paused));
    }""", arg=n, timeout=30000)

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda m: console.append({"type": m.type, "text": m.text[:400]}))
        pg.on("response", lambda r: reqs.append({"resp": r.url, "status": r.status,
                                                 "ct": r.headers.get("content-type")}))
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
        # Los cinco breaks resueltos de una sola vez, al parsear la playlist.
        pg.wait_for_function("window.demo.provider.experiences.length === 5", timeout=30000)
        res["laSenalizacion"] = pg.evaluate("""() => ({
          experiencias: window.demo.provider.experiences.map(e => ({
            id: e.id, type: e.type, ventana: [+e.startTime.toFixed(2), +(e.startTime + e.duration).toFixed(2)],
            elementos: e.elements.map(el => ({ id: el.id, zDepth: el.zDepth, mediaType: el.mediaType })) })),
          dateRangesDeLaDemo: Object.keys(window.demo.hls.latestLevelDetails?.dateRanges || {}),
          managerDeInterstitials: window.demo.hls.interstitialsManager === null ? 'null' : typeof window.demo.hls.interstitialsManager,
          agendadosPorElDeFabrica: window.demo.stock.scheduled
        })""")
        print("SENAL", json.dumps(res["laSenalizacion"], indent=1), flush=True)

        for n, t0, layout, archivo, nombre in BREAKS:
            info = {"nombre": nombre, "type": layout, "ventana": [t0, t0 + 12]}
            # --- 1. la luz, muestreada mientras reproduce dentro de la ventana ---
            pg.evaluate(f"() => {{ window.demo.video.currentTime = {t0 + 0.4}; }}")
            n_nodos = 3 if layout == "multiView" else (2 if layout == "squeezebackLShape" else 1)
            esperar_nodos(pg, n_nodos)
            serie = []
            while True:
                m = pg.evaluate(LUZ)
                if m["time"] >= t0 + 11.6:
                    break
                luces = [v["luz"] for v in m["assets"].values() if v["luz"] is not None]
                m["luzDelMasOscuro"] = min(luces) if luces else None
                serie.append(m)
                time.sleep(0.4)
            info["luz"] = serie
            mejor = max((m for m in serie if m["luzDelMasOscuro"] is not None),
                        key=lambda m: m["luzDelMasOscuro"])
            info["instanteMasClaro"] = mejor
            info["offsetDeLaCaptura"] = round(mejor["time"] - t0, 1)
            print(f"LUZ break {n} {nombre}: mejor t={mejor['time']} (+{info['offsetDeLaCaptura']}s) "
                  f"min={mejor['luzDelMasOscuro']} " +
                  json.dumps({k: v["luz"] for k, v in mejor["assets"].items()}), flush=True)

            # --- 2 y 3. la caja y el llenado, en el instante mas claro ---
            pg.evaluate(f"() => {{ window.demo.video.currentTime = {mejor['time']}; }}")
            esperar_nodos(pg, n_nodos)
            time.sleep(0.9)
            info["geometria"] = pg.evaluate(MEASURE)
            info["estado"] = pg.evaluate(ESTADO)
            print(f"GEOM break {n}: deltas", [e["deltaMaxPx"] for e in info["geometria"]["elements"]],
                  "| recorte", [e["llenado"] and e["llenado"]["recortePorCiento"] for e in info["geometria"]["elements"]],
                  flush=True)
            pg.locator("#player").screenshot(path=str(OUT / f"t12-{n}-{archivo}-medicion.png"))

            # --- la caja despues de un resize, en los cinco layouts ---
            # Se vuelve a entrar por el principio de la ventana antes de
            # redimensionar: el instante mas claro puede caer al final de los
            # doce segundos, y el resize mas la medicion no entran en lo que
            # queda. La primera corrida se quedo sin ventana en el LBox video y
            # devolvio una medicion vacia.
            pg.evaluate(f"() => {{ window.demo.video.currentTime = {t0 + 2.0}; }}")
            esperar_nodos(pg, n_nodos)
            pg.set_viewport_size({"width": 1000, "height": 800})
            time.sleep(0.7)
            info["geometria_resize"] = pg.evaluate(MEASURE)
            print(f"GEOM break {n} resize: deltas",
                  [e["deltaMaxPx"] for e in info["geometria_resize"]["elements"]] or "VACIO",
                  flush=True)
            pg.set_viewport_size({"width": 1600, "height": 1000})
            time.sleep(0.7)

            # --- el control de audio en el break de las imagenes ---
            if nombre == "LBox image":
                pg.evaluate(f"() => {{ window.demo.video.currentTime = {mejor['time']}; }}")
                esperar_nodos(pg, n_nodos)
                time.sleep(0.6)
                info["audioConAssetsDeImagen"] = pg.evaluate(ESTADO)
                print("AUDIO imagen", json.dumps(info["audioConAssetsDeImagen"]["boton"]), flush=True)
            res["breaks"][f"{n}-{nombre}"] = info

        # --- fuera de toda ventana: la pagina se deshace ---
        pg.evaluate("() => { window.demo.video.currentTime = 140; }")
        pg.wait_for_function("window.demo.provider.activeAt(window.demo.video.currentTime).length === 0", timeout=20000)
        time.sleep(0.8)
        res["despues_del_ultimo_break"] = pg.evaluate("""() => {
          const v = document.getElementById('video');
          const r = v.getBoundingClientRect(), a = document.getElementById('ads').getBoundingClientRect();
          return { avisos: document.querySelectorAll('#ads .ad').length,
                   videosEnLaPestana: document.querySelectorAll('video').length,
                   primaryStyle: v.getAttribute('style'),
                   primaryTransform: getComputedStyle(v).transform,
                   primarioPx: { w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
                   areaPx: { w: +a.width.toFixed(2), h: +a.height.toFixed(2) },
                   contract: document.getElementById('contract').textContent };
        }""")
    finally:
        pg.close()

res["red"] = reqs
res["consola"] = console
res["errores"] = [c for c in console if c["type"] == "error"]
(OUT / "t12-medicion.json").write_text(json.dumps(res, indent=2))
print("WROTE", OUT / "t12-medicion.json")
print("ERRORES EN CONSOLA:", len(res["errores"]))
