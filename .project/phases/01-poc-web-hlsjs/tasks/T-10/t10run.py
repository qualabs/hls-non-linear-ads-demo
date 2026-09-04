"""T-10 -- el mecanismo de squeezeback, con el layout squeezebackLShape.

Mide tres cosas, y las tres sobre el navegador real:

1. La caja dibujada contra la caja que pidio el contrato, en pixeles, con la
   cuenta de los porcentajes hecha aparte del renderizador. Dos veces: a tamano
   real y despues de un resize, que es lo que prueba que la conversion se
   recalcula. Es la misma medicion que la T-07, y ahora tiene que sostenerse con
   el primario movido por una transformacion.
2. El llenado del ADR 0013 en las dos cajas mas alejadas de la relacion de
   aspecto del asset que midio la T-03: aspecto del asset, aspecto de la caja,
   cuanto queda afuera por el recorte, y cuanto se estiraria si se llenara con
   `fill`. Mas el par de capturas de la misma barra en los dos modos, congelada
   en el mismo cuadro, para que la diferencia se pueda ver y medir.
3. El orden por zDepth cuando el aviso va DETRAS del primario, que es la nota
   que la T-07 dejo para esta task. Se ejercita con una experiencia sintetica
   —el contrato es data plana, asi que se puede construir a mano— cuyo elemento
   de atras es un nodo vacio pintado de magenta: si el centro del player sale
   magenta, el aviso quedo encima del primario y el orden se rompio.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

res = {}
reqs = []
console = []

MEASURE = """
() => {
  const { video, provider, renderer } = window.demo;
  const layer = document.getElementById('ads');
  const area = layer.getBoundingClientRect();
  const active = provider.activeAt(video.currentTime);
  const r6 = (v) => +v.toFixed(6);
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
      const src = node ? { w: node.videoWidth, h: node.videoHeight } : null;

      // El llenado, con la cuenta del ADR 0013 sobre la caja dibujada.
      let llenado = null;
      if (src && src.w && src.h && got) {
        const aspectoFuente = src.w / src.h;
        const aspectoCaja = got.width / got.height;
        const escala = Math.max(got.width / src.w, got.height / src.h);   // cover
        const visible = { w: Math.min(src.w, got.width / escala), h: Math.min(src.h, got.height / escala) };
        llenado = {
          aspectoFuente: +aspectoFuente.toFixed(4),
          aspectoCaja: +aspectoCaja.toFixed(4),
          // Lo que se ve del asset, en pixeles del asset y en proporcion.
          fuentePx: { w: +src.w.toFixed(0), h: +src.h.toFixed(0) },
          visibleDeLaFuentePx: { w: +visible.w.toFixed(1), h: +visible.h.toFixed(1) },
          recortePorCiento: +((1 - (visible.w * visible.h) / (src.w * src.h)) * 100).toFixed(2),
          ejeRecortado: aspectoCaja > aspectoFuente ? 'vertical' : (aspectoCaja < aspectoFuente ? 'horizontal' : 'ninguno'),
          // Lo que se estiraria si la caja se llenara con `fill`, que es el
          // numero con el que la T-03 midio la deformacion.
          estiramientoSiFillPorCiento: +(Math.abs(aspectoCaja / aspectoFuente - 1) * 100).toFixed(1)
        };
      }
      out.elements.push({
        element: el.id, primary: el.primary, zDepth: el.zDepth, box: el.box,
        uri: el.uri, mediaType: el.mediaType,
        esperadoPx: Object.fromEntries(Object.entries(esperado).map(([k,v]) => [k, r6(v)])),
        medidoPx: got && Object.fromEntries(Object.entries(got).map(([k,v]) => [k, r6(v)])),
        deltaMaxPx: delta === null ? null : +delta.toFixed(6),
        objectFit: cs && cs.objectFit,
        zIndex: cs && cs.zIndex,
        position: cs && cs.position,
        transform: cs && cs.transform,
        llenado,
        video: node ? { readyState: node.readyState, paused: node.paused,
                        currentTime: +node.currentTime.toFixed(2), muted: node.muted,
                        w: node.videoWidth, h: node.videoHeight } : null
      });
    }
  }
  return out;
}
"""

# La experiencia sintetica del punto 3, construida a mano contra el contrato.
PROBE = """
() => {
  const { provider, renderer, video } = window.demo;
  window.__guardado = provider.experiences.slice();
  provider.experiences.length = 0;
  provider.experiences.push({
    id: 'zDepthProbe', type: 'squeezebackFrame',
    startTime: video.currentTime - 0.5, duration: 90,
    elements: [
      { id: 'adDetras', primary: false, box: { top: 0, right: 0, bottom: 0, left: 0 },
        zDepth: 0, volume: 100, uri: '/content/no-es-un-asset.mp4', mediaType: 'video/mp4' },
      { id: 'primaryContent', primary: true, box: { top: 20, right: 20, bottom: 20, left: 20 },
        zDepth: 1, volume: 100, uri: null, mediaType: null }
    ]
  });
  renderer.tick();
  const detras = document.querySelector('#ads .ad[data-element-id="adDetras"]');
  // Un color y no una pelicula: lo que se mide es quien tapa a quien.
  if (detras) detras.style.background = 'magenta';
  const cs = getComputedStyle(video);
  return { construido: !!detras,
           primario: { position: cs.position, zIndex: cs.zIndex, transform: cs.transform },
           detras: detras ? { zIndex: getComputedStyle(detras).zIndex } : null };
}
"""

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    ctx = b.contexts[0]
    pg = ctx.new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda m: console.append({"type": m.type, "text": m.text[:400]}))
        pg.on("response", lambda r: reqs.append({"resp": r.url, "status": r.status,
                                                 "ct": r.headers.get("content-type")}))
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)

        # Entrar a la ventana cruzandola, no cayendo adentro.
        pg.evaluate("() => { window.demo.video.currentTime = 19.0; }")
        pg.wait_for_function("window.demo.provider.activeAt(window.demo.video.currentTime).length > 0", timeout=30000)
        # Las dos barras con cuadro pintado.
        pg.wait_for_function("""(() => {
          const a = [...document.querySelectorAll('#ads .ad')];
          return a.length === 2 && a.every(v => v.readyState >= 2 && !v.paused && v.currentTime > 0.2);
        })()""", timeout=30000)
        time.sleep(1.0)
        res["al_cruzar"] = pg.evaluate("""() => ({
          time: +window.demo.video.currentTime.toFixed(2),
          barras: [...document.querySelectorAll('#ads .ad')].map(v => ({
            id: v.dataset.elementId, currentTime: +v.currentTime.toFixed(2), paused: v.paused,
            readyState: v.readyState, w: v.videoWidth, h: v.videoHeight })),
          contract: document.getElementById('contract').textContent,
          paneState: document.getElementById('pane-demo').dataset.state
        })""")

        # Adelantar hasta la mitad del aviso para las capturas: los dos assets
        # arrancan con un fundido desde negro y una barra negra no dice si el
        # aviso se ve deformado o no, que es lo que hay que ver. De paso el
        # seek ejercita que el aviso sigue al primario.
        pg.evaluate("() => { window.demo.video.currentTime = 28.0; }")
        pg.wait_for_function("""(() => {
          const a = [...document.querySelectorAll('#ads .ad')];
          return a.length === 2 && a.every(v => v.readyState >= 2 && !v.paused && v.currentTime > 7.0);
        })()""", timeout=30000)
        time.sleep(1.0)

        res["geometria"] = pg.evaluate(MEASURE)
        print("GEOM", json.dumps(res["geometria"], indent=1)[:2200], flush=True)

        pg.locator("#player").screenshot(path=str(OUT / "t10-squeezebackLShape-player.png"))
        pg.locator(".pair").screenshot(path=str(OUT / "t10-el-par-con-el-squeezeback.png"))
        pg.screenshot(path=str(OUT / "t10-la-pagina-entera.png"), full_page=True)

        # --- el llenado, con el mismo cuadro en los dos modos ---
        # Pausar el primario pausa el aviso (el aviso sigue al contenido), asi
        # que las dos capturas son el mismo cuadro del mismo asset.
        pg.evaluate("() => window.demo.video.pause()")
        time.sleep(0.5)
        bar = pg.locator('#ads .ad[data-element-id="adBarVertical"]')
        bar.screenshot(path=str(OUT / "t10-barra-cover.png"))
        pg.evaluate("""() => { document.querySelector('#ads .ad[data-element-id="adBarVertical"]')
                                 .style.objectFit = 'fill'; }""")
        time.sleep(0.3)
        bar.screenshot(path=str(OUT / "t10-barra-fill.png"))
        res["llenado_modos"] = pg.evaluate("""() => {
          const n = document.querySelector('#ads .ad[data-element-id="adBarVertical"]');
          return { objectFitAhora: getComputedStyle(n).objectFit,
                   rect: (r => ({ w: +r.width.toFixed(2), h: +r.height.toFixed(2) }))(n.getBoundingClientRect()),
                   fuente: { w: n.videoWidth, h: n.videoHeight },
                   cuadro: +n.currentTime.toFixed(3) };
        }""")
        pg.evaluate("""() => { document.querySelector('#ads .ad[data-element-id="adBarVertical"]')
                                 .style.objectFit = window.demo.renderer.FILL_MODE; }""")
        pg.evaluate("() => window.demo.video.play()")
        time.sleep(0.6)

        # --- la caja despues de un resize ---
        pg.set_viewport_size({"width": 1000, "height": 800})
        time.sleep(0.8)
        res["geometria_resize"] = pg.evaluate(MEASURE)
        pg.set_viewport_size({"width": 1600, "height": 1000})
        time.sleep(0.8)

        # --- el orden por zDepth con el aviso DETRAS (nota de la T-07) ---
        res["zdepth"] = {"sonda": pg.evaluate(PROBE)}
        time.sleep(0.8)
        res["zdepth"]["geometria"] = pg.evaluate(MEASURE)
        pg.locator("#player").screenshot(path=str(OUT / "t10-zdepth-primario-posicionado.png"))
        # Y la trampa, a proposito: el primario achicado por la transformacion
        # pero SIN posicionar, que es lo que deja su z-index sin efecto.
        pg.evaluate("() => { document.getElementById('video').style.position = 'static'; }")
        time.sleep(0.5)
        res["zdepth"]["sin_posicionar"] = pg.evaluate("""() => {
          const cs = getComputedStyle(document.getElementById('video'));
          return { position: cs.position, zIndex: cs.zIndex, transform: cs.transform };
        }""")
        pg.locator("#player").screenshot(path=str(OUT / "t10-zdepth-primario-estatico.png"))
        pg.evaluate("() => { document.getElementById('video').style.position = 'relative'; }")
        pg.evaluate("""() => { const { provider, renderer } = window.demo;
          provider.experiences.length = 0;
          provider.experiences.push(...window.__guardado);
          renderer.tick(); }""")
        time.sleep(0.5)

        # --- fuera de la ventana: el primario vuelve al cuadro entero ---
        pg.evaluate("() => { window.demo.video.currentTime = 40; }")
        pg.wait_for_function("window.demo.provider.activeAt(window.demo.video.currentTime).length === 0", timeout=20000)
        time.sleep(0.6)
        res["despues_de_la_ventana"] = pg.evaluate("""() => {
          const v = document.getElementById('video');
          const r = v.getBoundingClientRect(), a = document.getElementById('ads').getBoundingClientRect();
          return { avisos: document.querySelectorAll('#ads .ad').length,
                   primaryStyle: v.getAttribute('style'),
                   primaryTransform: getComputedStyle(v).transform,
                   primarioPx: { w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
                   areaPx: { w: +a.width.toFixed(2), h: +a.height.toFixed(2) },
                   contract: document.getElementById('contract').textContent };
        }""")
        pg.locator("#player").screenshot(path=str(OUT / "t10-despues-del-aviso.png"))
    finally:
        pg.close()

res["red"] = reqs
res["consola"] = console
(OUT / "t10-medicion.json").write_text(json.dumps(res, indent=2))
print("WROTE", OUT / "t10-medicion.json")
