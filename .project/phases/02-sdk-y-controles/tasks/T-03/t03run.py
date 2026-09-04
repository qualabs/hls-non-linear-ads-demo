"""T-03 -- los controles de la composicion, medidos en la pagina viva.

Cuatro capturas a tamano real y tres mediciones. El metodo es el de la T-01 y la
T-10: una sola carga sobre el servidor de la demo, todo lo que se afirma leido de
la pagina, y el fullscreen tomado en fullscreen de verdad --con un click real
sobre el boton, que es lo unico que el browser acepta como gesto de usuario-- y
no con un getComputedStyle que diga que el elemento esta visible.

Lo que hay que ver:

1. La caja que el renderizador mide no cambio. Los controles son un overlay
   sobre la imagen y no una franja debajo, asi que la caja sigue siendo el
   contenedor 16:9. Se compara `layer.getBoundingClientRect()` contra el
   contenedor y contra la caja de la imagen, y se miden los quince pixeles de un
   break contra `boxToPixels`.
2. El apilado. Con la experiencia sintetica que pone el aviso de fondo y el
   primario encima --el layout que ningun asset-list del recorrido tiene-- los
   controles siguen arriba de los dos, y la capa de avisos sigue sin z-index.
3. La barra mide lo mismo antes, durante y despues de un break (ADR 0016).
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

# La caja que el renderizador mide, la del contenedor, y la de la imagen de
# verdad: el <video> con object-fit contain adentro de su caja de layout.
CAJAS = """
() => {
  const r6 = (n) => +n.toFixed(6);
  const caja = (el) => { const b = el.getBoundingClientRect();
    return { x: r6(b.x), y: r6(b.y), w: r6(b.width), h: r6(b.height) }; };
  const cont = document.getElementById('player');
  const capa = document.querySelector('.qa-concurrent-layer');
  const ctrl = document.querySelector('.qa-controls');
  const v = window.demo.video;
  const vb = v.getBoundingClientRect();
  // La imagen adentro del <video>: object-fit contain sobre la relacion de
  // aspecto del contenido.
  const ar = v.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : null;
  let imagen = null;
  if (ar) {
    const w = Math.min(vb.width, vb.height * ar);
    const h = Math.min(vb.height, vb.width / ar);
    imagen = { x: r6(vb.x + (vb.width - w) / 2), y: r6(vb.y + (vb.height - h) / 2),
               w: r6(w), h: r6(h) };
  }
  return {
    contenedor: caja(cont),
    laQueMideElRenderizador: caja(capa),
    losControles: caja(ctrl),
    elVideo: caja(v),
    laImagen: imagen,
    fullscreen: document.fullscreenElement === cont,
    zIndexDeLaCapaDeAvisos: getComputedStyle(capa).zIndex,
    zIndexDeLosControles: getComputedStyle(ctrl).zIndex
  };
}
"""

# La barra: el riel es lo que se mide, y el largo se relee del primario.
LA_BARRA = """
() => {
  const riel = document.querySelector('.qa-track__rail');
  const b = riel.getBoundingClientRect();
  const v = window.demo.video;
  return {
    anchoDelRielPx: +b.width.toFixed(3),
    izquierdaPx: +b.x.toFixed(3),
    largoReleidoDelPrimario: Number.isFinite(v.duration) ? +v.duration.toFixed(3) : null,
    textoDelLargo: document.querySelector('.qa-time--total').textContent,
    textoDelReloj: document.querySelector('.qa-time--elapsed').textContent,
    currentTime: +v.currentTime.toFixed(2),
    cuantasBarrasEnElPane: document
      .getElementById('pane-demo').querySelectorAll('.qa-track__rail').length,
    hayAviso: window.demo.provider.activeAt(v.currentTime).length > 0
  };
}
"""

# Los quince pixeles: lo que el renderizador dibujo contra lo que el contrato
# dice, con el area que el propio renderizador mide.
PIXELES = """
() => {
  const r6 = (n) => +n.toFixed(6);
  const capa = document.querySelector('.qa-concurrent-layer');
  const area = capa.getBoundingClientRect();
  const v = window.demo.video;
  const activas = window.demo.provider.activeAt(v.currentTime);
  const out = [];
  for (const e of activas) {
    for (const el of e.elements) {
      const esperado = QualabsConcurrentHls.boxToPixels
        ? QualabsConcurrentHls.boxToPixels(el.box, area)
        : { left: area.width * el.box.left / 100,
            top: area.height * el.box.top / 100,
            width: area.width - area.width * el.box.left / 100 - area.width * el.box.right / 100,
            height: area.height - area.height * el.box.top / 100 - area.height * el.box.bottom / 100 };
      let medido;
      if (el.primary) {
        const b = v.getBoundingClientRect();
        medido = { left: b.x - area.x, top: b.y - area.y, width: b.width, height: b.height };
      } else {
        const n = capa.querySelector(`.ad[data-element-id="${el.id}"]`);
        if (!n) continue;
        const b = n.getBoundingClientRect();
        medido = { left: b.x - area.x, top: b.y - area.y, width: b.width, height: b.height };
      }
      const delta = Math.max(...['left','top','width','height'].map(k => Math.abs(medido[k] - esperado[k])));
      out.push({ tipo: e.type, elemento: el.id, primario: el.primary,
                 esperadoPx: Object.fromEntries(Object.entries(esperado).map(([k,x]) => [k, r6(x)])),
                 medidoPx: Object.fromEntries(Object.entries(medido).map(([k,x]) => [k, r6(x)])),
                 deltaMaxPx: r6(delta) });
    }
  }
  return out;
}
"""

# La experiencia sintetica del apilado: el aviso de fondo en zDepth 0 y el
# primario encima en 1, que es el caso que ningun asset-list del recorrido
# tiene y el que rompe si la capa de avisos se cierra.
SONDA = """
() => {
  const { provider, renderer, video } = window.demo;
  provider.experiences.length = 0;
  provider.experiences.push({
    id: 'zDepthProbe', type: 'squeezebackFrame',
    startTime: video.currentTime - 0.5, duration: 90,
    elements: [
      { id: 'adDetras', primary: false, box: { top: 0, right: 0, bottom: 0, left: 0 },
        zDepth: 0, volume: 0, uri: '/content/no-es-un-asset.mp4', mediaType: 'video/mp4' },
      { id: 'primaryContent', primary: true, box: { top: 20, right: 20, bottom: 20, left: 20 },
        zDepth: 1, volume: 100, uri: null, mediaType: null }
    ]
  });
  renderer.tick();
  const capa = document.querySelector('.qa-concurrent-layer');
  const detras = capa.querySelector('.ad[data-element-id="adDetras"]');
  if (detras) detras.style.background = 'magenta';
  return { construido: !!detras };
}
"""

# Quien tapa a quien, leido con elementFromPoint y no con un z-index computado:
# manda el pixel.
QUIEN_TAPA = """
() => {
  const cont = document.getElementById('player');
  const b = cont.getBoundingClientRect();
  const capa = document.querySelector('.qa-concurrent-layer');
  const v = window.demo.video;
  const detras = capa.querySelector('.ad[data-element-id="adDetras"]');
  const quien = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    return { tag: el.tagName.toLowerCase(), clase: el.className,
             id: el.dataset ? (el.dataset.elementId || null) : null,
             esElVideo: el === v, esElAviso: el === detras,
             dentroDeLosControles: !!el.closest('.qa-controls') };
  };
  const centro = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  // Un punto del riel de la barra, y otro sobre el aviso de fondo que queda
  // fuera de la caja del primario (el primario ocupa del 20 al 80 por ciento).
  const riel = document.querySelector('.qa-track__rail').getBoundingClientRect();
  return {
    elBotonCentral: quien(centro.x, centro.y),
    laBarra: quien(riel.x + riel.width * 0.5, riel.y + riel.height / 2),
    elControlDeAudio: quien(b.x + b.width - 26, b.y + 26),
    // Adentro de la caja del primario, arriba del aviso de fondo, y lejos de
    // todo control: tiene que ser el video y no el aviso.
    dondeElPrimarioTapaAlAviso: quien(b.x + b.width * 0.5, b.y + b.height * 0.32),
    // Afuera de la caja del primario: el aviso de fondo, que se ve.
    dondeSeVeElAvisoDeFondo: quien(b.x + b.width * 0.08, b.y + b.height * 0.5),
    zIndexDeLaCapaDeAvisos: getComputedStyle(capa).zIndex,
    zIndexDelPrimario: getComputedStyle(v).zIndex,
    positionDelPrimario: getComputedStyle(v).position,
    zIndexDelAvisoDeFondo: detras ? getComputedStyle(detras).zIndex : null,
    zIndexDeLosControles: getComputedStyle(document.querySelector('.qa-controls')).zIndex
  };
}
"""

res = {}
console = []

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.on("console", lambda m: console.append({"type": m.type, "text": m.text[:300]}))
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer && window.demo.concurrent.controls)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
        pg.evaluate("""() => {
          window.__seeks = [];
          window.demo.video.addEventListener('seeking',
            () => window.__seeks.push(+window.demo.video.currentTime.toFixed(2)));
        }""")

        res["superficie"] = pg.evaluate("""() => ({
          controles: !!window.demo.concurrent.controls,
          claves: Object.keys(window.demo.concurrent).sort(),
          elVideoNoTraeControlesNativos: !document.getElementById('video').hasAttribute('controls'),
          elDeFabricaSiLosTrae: document.getElementById('stock-video').hasAttribute('controls'),
          elBotonViejoYaNoEsta: document.getElementById('ad-audio') === null,
          cuantasBarrasEnLaPagina: document.querySelectorAll('.qa-track__rail').length
        })""")
        print("SUPERFICIE", json.dumps(res["superficie"]), flush=True)

        # ---- 1. LA COMPOSICION SIN AVISO --------------------------------
        # El primer break empieza a los 20 s, asi que cualquier momento antes
        # sirve. Se mueve el mouse para que los controles esten a la vista.
        pg.wait_for_function("window.demo.video.currentTime > 6", timeout=60000)
        cont = pg.locator("#player")
        cont.hover()
        time.sleep(0.4)
        res["cajasSinAviso"] = pg.evaluate(CAJAS)
        res["barraAntes"] = pg.evaluate(LA_BARRA)
        cont.screenshot(path=str(OUT / "t03-1-sin-aviso.png"))
        print("SIN AVISO", json.dumps(res["barraAntes"]), flush=True)

        # ---- 2. LA COMPOSICION CON AVISO --------------------------------
        pg.wait_for_function("window.demo.provider.activeAt(window.demo.video.currentTime).length > 0",
                             timeout=60000)
        pg.wait_for_function("""(() => {
          const a = [...document.querySelectorAll('.qa-concurrent-layer .ad')];
          return a.length > 0 && a.every(n => n.tagName === 'IMG' ? n.naturalWidth > 0
                                                                  : n.readyState >= 2 && n.currentTime > 1.5);
        })()""", timeout=60000)
        cont.hover()
        time.sleep(0.4)
        res["cajasConAviso"] = pg.evaluate(CAJAS)
        res["barraDurante"] = pg.evaluate(LA_BARRA)
        res["pixelesConAviso"] = pg.evaluate(PIXELES)
        cont.screenshot(path=str(OUT / "t03-2-con-aviso.png"))
        print("CON AVISO", json.dumps(res["barraDurante"]), flush=True)
        print("PIXELES  ", json.dumps([{"e": x["elemento"], "d": x["deltaMaxPx"]} for x in res["pixelesConAviso"]]), flush=True)

        # ---- 3. LA BARRA DESPUES DEL BREAK ------------------------------
        pg.wait_for_function("window.demo.provider.activeAt(window.demo.video.currentTime).length === 0 "
                             "&& window.demo.video.currentTime > 33", timeout=90000)
        cont.hover()
        time.sleep(0.3)
        res["barraDespues"] = pg.evaluate(LA_BARRA)
        print("DESPUES  ", json.dumps(res["barraDespues"]), flush=True)

        # ---- 4. FULLSCREEN, CON UN CLICK DE VERDAD ----------------------
        pg.locator(".qa-btn--full").click()
        pg.wait_for_function("document.fullscreenElement === document.getElementById('player')",
                             timeout=10000)
        time.sleep(0.8)
        pg.mouse.move(960, 500)
        time.sleep(0.4)
        res["cajasFullscreen"] = pg.evaluate(CAJAS)
        res["barraFullscreen"] = pg.evaluate(LA_BARRA)
        res["fullscreenDeVerdad"] = pg.evaluate("""() => ({
          fullscreenElement: document.fullscreenElement ? document.fullscreenElement.id : null,
          esElContenedor: document.fullscreenElement === document.getElementById('player'),
          innerWidth: window.innerWidth, innerHeight: window.innerHeight,
          screen: { w: screen.width, h: screen.height },
          // La capa de avisos entro con el: es hija del contenedor.
          laCapaDeAvisosEntro: document.fullscreenElement
            .contains(document.querySelector('.qa-concurrent-layer')),
          losControlesEntraron: document.fullscreenElement
            .contains(document.querySelector('.qa-controls')),
          controlesALaVista: document.querySelector('.qa-controls').classList.contains('qa-controls--on')
        })""")
        print("FULLSCREEN", json.dumps(res["fullscreenDeVerdad"]), flush=True)
        pg.screenshot(path=str(OUT / "t03-3-fullscreen-con-controles.png"))

        # Los controles se esconden solos: no se toca el mouse y se espera.
        pg.wait_for_function("!document.querySelector('.qa-controls').classList.contains('qa-controls--on')",
                             timeout=15000)
        time.sleep(0.5)
        res["controlesEscondidos"] = pg.evaluate("""() => ({
          claseEncendida: document.querySelector('.qa-controls').classList.contains('qa-controls--on'),
          opacidad: getComputedStyle(document.querySelector('.qa-controls')).opacity,
          sigueEnFullscreen: document.fullscreenElement === document.getElementById('player')
        })""")
        pg.screenshot(path=str(OUT / "t03-4-fullscreen-controles-escondidos.png"))
        print("ESCONDIDOS", json.dumps(res["controlesEscondidos"]), flush=True)

        # ---- 5. EL APILADO ----------------------------------------------
        pg.evaluate("() => document.exitFullscreen()")
        pg.wait_for_function("!document.fullscreenElement", timeout=10000)
        time.sleep(0.5)
        res["sonda"] = pg.evaluate(SONDA)
        time.sleep(0.6)
        cont.hover()
        time.sleep(0.3)
        res["quienTapaAQuien"] = pg.evaluate(QUIEN_TAPA)
        cont.screenshot(path=str(OUT / "t03-5-apilado-aviso-de-fondo.png"))
        print("APILADO", json.dumps(res["quienTapaAQuien"], indent=1), flush=True)

        res["seeksDelPrimario"] = pg.evaluate("window.__seeks")
        res["errores"] = [c for c in console if c["type"] == "error"]
    finally:
        pg.close()

res["consola"] = console[-40:]
(OUT / "t03-la-medicion.json").write_text(json.dumps(res, indent=2))
print("\nWROTE", OUT / "t03-la-medicion.json")
print("ERRORES:", len(res.get("errores", [])), "| SEEKS:", res.get("seeksDelPrimario"))
