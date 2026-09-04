"""T-09 -- el area de los layouts es la del video y no la del contenedor.

Dos mitades, las dos necesarias:

  1. EN VENTANA no se mueve nada. Las dos cajas coinciden ahi, asi que la caja
     que el contrato pide y la que el browser dibuja tienen que seguir dando
     0,00 px de diferencia en los elementos de los cinco breaks. Es la
     regresion que importa: la fase 01 midio ese cero cinco veces.

  2. EN FULLSCREEN sobre un viewport que a proposito no es 16:9, la caja de
     cada aviso queda adentro del rectangulo de la imagen y el rectangulo del
     primario es el mismo con aviso y sin aviso. Los numeros salen de aca y la
     prueba sale de los PIXELES de las capturas, que las mide t09pixeles.py.

La imagen se calcula en esta sonda y no se le pregunta a la libreria: si la
libreria se equivoca, una medicion que le pregunta a ella se equivoca igual.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

# t de arranque de cada break, del generador de la playlist, y su layout.
BREAKS = [(20, "Overlay"), (45, "LBox video"), (70, "LBox image"),
          (95, "Side by side pullback"), (120, "Quad")]
SIN_AVISO = 36.0   # entre el primer y el segundo break

MEDIDA = """
() => {
  const r = (n) => +n.toFixed(6);
  const cont = document.getElementById('player');
  const capa = document.querySelector('.qa-concurrent-layer');
  const v = window.demo.video;
  const f = capa.getBoundingClientRect();
  const ar = v.videoWidth / v.videoHeight;
  // La imagen: el marco reducido a la relacion de aspecto del video y centrado.
  const w = Math.min(f.width, f.height * ar), h = Math.min(f.height, f.width / ar);
  const img = { left: f.left + (f.width - w) / 2, top: f.top + (f.height - h) / 2,
                width: w, height: h, right: 0, bottom: 0 };
  img.right = img.left + img.width; img.bottom = img.top + img.height;

  const active = window.demo.provider.activeAt(v.currentTime);
  const elementos = [];
  for (const e of active) for (const el of e.elements) {
    const L = img.width * el.box.left / 100, T = img.height * el.box.top / 100;
    const px = { left: L, top: T,
                 width:  img.width  - L - img.width  * el.box.right  / 100,
                 height: img.height - T - img.height * el.box.bottom / 100 };
    const esperado = { left: img.left + px.left, top: img.top + px.top,
                       width: px.width, height: px.height };
    const node = el.primary ? v : capa.querySelector(`.ad[data-element-id="${el.id}"]`);
    const b = node.getBoundingClientRect();
    elementos.push({
      tipo: e.type, id: el.id, primario: !!el.primary,
      esperado: { left: r(esperado.left), top: r(esperado.top),
                  width: r(esperado.width), height: r(esperado.height) },
      dibujado: { left: r(b.left), top: r(b.top), width: r(b.width), height: r(b.height) },
      delta: { left: r(Math.abs(b.left - esperado.left)), top: r(Math.abs(b.top - esperado.top)),
               width: r(Math.abs(b.width - esperado.width)), height: r(Math.abs(b.height - esperado.height)) },
      dentroDeLaImagen: b.left >= img.left - 0.5 && b.top >= img.top - 0.5 &&
                        b.right <= img.right + 0.5 && b.bottom <= img.bottom + 0.5,
      relacionDeAspectoDeSuCaja: r(b.width / b.height)
    });
  }
  // El primario sin layout activo: donde lo deja la hoja de estilos.
  const vb = v.getBoundingClientRect();
  return {
    fullscreen: document.fullscreenElement === cont,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    t: r(v.currentTime),
    marco: { left: r(f.left), top: r(f.top), width: r(f.width), height: r(f.height) },
    imagen: { left: r(img.left), top: r(img.top), width: r(img.width), height: r(img.height) },
    corrimientoPorLado: r(img.left - f.left),
    relacionDeAspectoDelMarco: r(f.width / f.height),
    relacionDeAspectoDelVideo: r(ar),
    videoIntrinseco: { w: v.videoWidth, h: v.videoHeight },
    cajaDelVideoEnElDom: { left: r(vb.left), top: r(vb.top), width: r(vb.width), height: r(vb.height) },
    tipo: active.map((e) => e.type),
    elementos
  };
}
"""

LISTO = """(() => {
  const a = [...document.querySelectorAll('.qa-concurrent-layer .ad')];
  if (a.length === 0) return false;
  return a.every(n => n.tagName === 'IMG' ? n.complete : (n.readyState >= 2 && n.currentTime > 0.4));
})()"""


def ir_a(pg, t):
    pg.evaluate(f"() => {{ window.demo.video.currentTime = {t}; }}")
    pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
    time.sleep(0.7)


def esperar_aviso(pg):
    pg.wait_for_function("window.demo.provider.activeAt(window.demo.video.currentTime).length > 0",
                         timeout=30000)
    pg.wait_for_function(LISTO, timeout=30000)
    time.sleep(0.4)


def controles_escondidos(pg):
    """Sin tocar el mouse: se esconden solos a los 2,6 s mientras corre."""
    pg.wait_for_function("!document.querySelector('.qa-controls').classList.contains('qa-controls--on')",
                         timeout=15000)
    time.sleep(0.3)


with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    salida = {}
    try:
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)

        # ---- mitad 1: en ventana, los ceros -------------------------------
        enVentana = []
        for t, nombre in BREAKS:
            ir_a(pg, t + 2)
            esperar_aviso(pg)
            m = pg.evaluate(MEDIDA)
            m["break"] = nombre
            enVentana.append(m)
        salida["enVentana"] = enVentana
        ir_a(pg, SIN_AVISO)
        time.sleep(0.5)
        salida["enVentanaSinAviso"] = pg.evaluate(MEDIDA)
        controles_escondidos(pg)
        pg.screenshot(path=str(OUT / "t09-1-ventana-sin-aviso.png"))
        ir_a(pg, 22)
        esperar_aviso(pg)
        controles_escondidos(pg)
        pg.screenshot(path=str(OUT / "t09-2-ventana-con-aviso.png"))

        # ---- mitad 2: fullscreen sobre un viewport que no es 16:9 ---------
        ir_a(pg, SIN_AVISO)
        pg.locator(".qa-btn--full").click()
        pg.wait_for_function("document.fullscreenElement === document.getElementById('player')",
                             timeout=10000)
        time.sleep(1.2)
        ir_a(pg, SIN_AVISO)
        salida["fullscreenSinAviso"] = pg.evaluate(MEDIDA)
        controles_escondidos(pg)
        pg.screenshot(path=str(OUT / "t09-3-fullscreen-sin-aviso.png"))

        ir_a(pg, 22)
        esperar_aviso(pg)
        salida["fullscreenConAviso"] = pg.evaluate(MEDIDA)
        controles_escondidos(pg)
        pg.screenshot(path=str(OUT / "t09-4-fullscreen-con-aviso.png"))

        ir_a(pg, 47)
        esperar_aviso(pg)
        salida["fullscreenConSqueezeback"] = pg.evaluate(MEDIDA)
        controles_escondidos(pg)
        pg.screenshot(path=str(OUT / "t09-5-fullscreen-squeezeback.png"))

        pg.evaluate("() => document.exitFullscreen()")
        time.sleep(0.6)
    finally:
        (OUT / "t09-la-medicion.json").write_text(json.dumps(salida, indent=2))
        pg.close()

print(json.dumps({k: (v if not isinstance(v, list) else f"{len(v)} breaks")
                  for k, v in salida.items()}, indent=1)[:400])
