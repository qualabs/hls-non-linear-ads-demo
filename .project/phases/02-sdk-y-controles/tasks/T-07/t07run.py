"""T-07 -- el skin y el branding: las capturas a tamano real y la prueba del cuarto.

Dos modos. `antes` corre contra el arbol sin tocar y guarda LA MISMA captura del
pane sin modificar que `despues` vuelve a tomar, para poder compararlas pixel a
pixel: es la unica forma de mostrar que el skin no lo alcanzo. `despues` toma
ademas las tres capturas de la composicion --sin aviso, con aviso y en
fullscreen-- y mide la barra y la placa del logo.

Se pausa a proposito, como la T-04: los controles se esconden solos a los 2,6 s
mientras corre y en pausa se quedan.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

MODO = sys.argv[1]
OUT = pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

T_SIN_AVISO = 60.0
T_CON_AVISO = 22.0   # adentro del primer break, cornerOverlay
T_STOCK = 8.0        # el pane sin modificar, en un cuadro fijo y comparable

MEDIDA = """
() => {
  const r = (n) => (n === null || n === undefined) ? null : +n.toFixed(4);
  const caja = (n) => { if (!n) return null; const b = n.getBoundingClientRect();
    return { left: r(b.left), top: r(b.top), width: r(b.width), height: r(b.height) }; };
  const q = (s) => document.querySelector(s);
  const v = window.demo.video;
  const rail = q('.qa-track__rail');
  const est = (n, p) => n ? getComputedStyle(n)[p] : null;
  return {
    t: r(v.currentTime),
    pausado: v.paused,
    largo: v.duration,
    contenedor: caja(document.getElementById('player')),
    riel: caja(rail),
    relleno: caja(q('.qa-track__fill')),
    perilla: caja(q('.qa-track__knob')),
    colorPerilla: est(q('.qa-track__knob'), 'backgroundColor'),
    carrilDeCues: caja(q('.qa-track__cues')),
    marcas: document.querySelectorAll('.qa-mark').length,
    nodos: [...document.querySelectorAll('.qa-mark, .qa-cue')].map((n) => ({
      clase: n.className,
      color: getComputedStyle(n).backgroundColor,
      dibujado: { left: +n.getBoundingClientRect().left.toFixed(4),
                  top: +n.getBoundingClientRect().top.toFixed(4),
                  width: +n.getBoundingClientRect().width.toFixed(4),
                  height: +n.getBoundingClientRect().height.toFixed(4) }
    })),
    marca: caja(q('.masthead .brand')),
    logoDelEncabezado: caja(q('.masthead .brand img')),
    cues: document.querySelectorAll('.qa-cue').length,
    colorMarca: est(q('.qa-mark'), 'backgroundColor'),
    colorCue: est(q('.qa-cue'), 'backgroundColor'),
    placa: caja(q('.qa-brand')),
    colorPlaca: est(q('.qa-brand'), 'backgroundColor'),
    logo: caja(q('.qa-brand img')),
    srcDelLogo: q('.qa-brand img') ? q('.qa-brand img').getAttribute('src') : null,
    botonAudio: caja(q('.qa-btn--audio')),
    botonPlay: caja(q('.qa-btn--play')),
    botonFull: caja(q('.qa-btn--full')),
    tiempos: [...document.querySelectorAll('.qa-time')].map((n) => ({
      texto: n.textContent, tamano: getComputedStyle(n).fontSize,
      familia: getComputedStyle(n).fontFamily.split(',')[0]
    })),
    fullscreen: document.fullscreenElement === document.getElementById('player'),
    claseDeLaCapa: q('.qa-controls').className,
    viewport: { w: window.innerWidth, h: window.innerHeight }
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


def pausar_con_controles(pg):
    pg.evaluate("() => { window.demo.video.pause(); window.demo.concurrent.controls.show(); }")
    time.sleep(0.5)


def fijar_stock(pg):
    """El pane sin modificar, en un cuadro fijo: sin esto la comparacion antes/
    despues compara dos cuadros distintos de la pelicula y no dos skins."""
    pg.evaluate(f"""() => {{
      const v = document.getElementById('stock-video');
      v.pause(); v.currentTime = {T_STOCK};
    }}""")
    pg.wait_for_function("document.getElementById('stock-video').readyState >= 2", timeout=30000)
    time.sleep(1.0)
    pg.evaluate("() => document.getElementById('stock-video').pause()")
    time.sleep(0.4)


with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    salida = {"modo": MODO}
    consola = []
    pg.on("console", lambda m: consola.append({"type": m.type, "text": m.text}))
    try:
        pg.set_viewport_size({"width": 1920, "height": 1080})
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
        pg.wait_for_function("window.demo.provider.programRanges().settled === true", timeout=30000)

        # ---- el pane sin modificar, igual en los dos modos --------------------
        ir_a(pg, T_SIN_AVISO)
        pausar_con_controles(pg)
        fijar_stock(pg)
        # EL PANE, ALINEADO A UNA FILA ENTERA. La rasterizacion de un texto
        # depende de la fraccion de pixel en la que cae, no de su posicion: con
        # el encabezado puesto el pane baja 13,x px y el mismo texto sale con
        # otro antialiasing, que en un diff se lee como un cambio de skin. Se lo
        # empuja a una fila entera en las DOS corridas, con un `top` relativo
        # que no cambia el layout, y ahi el diff mide lo que se quiere medir.
        pg.evaluate("""() => {
          const pane = document.getElementById('pane-stock');
          pane.style.position = 'relative';
          pane.style.top = '0px';
          const t = pane.getBoundingClientRect().top;
          pane.style.top = (Math.ceil(t) - t) + 'px';
        }""")
        time.sleep(0.3)
        pane = pg.locator("#pane-stock")
        pane.screenshot(path=str(OUT / f"pane-stock-{MODO}.png"))
        salida["paneSinModificar"] = pg.evaluate("""() => {
          const r = (n) => +n.toFixed(4);
          const caja = (n) => { const b = n.getBoundingClientRect();
            return { width: r(b.width), height: r(b.height) }; };
          const pane = document.getElementById('pane-stock');
          const player = pane.querySelector('.player');
          const pb = player.getBoundingClientRect(), nb = pane.getBoundingClientRect();
          const v = document.getElementById('stock-video');
          return {
            pane: caja(pane), player: caja(player),
            playerDentroDelPane: { x: r(pb.left - nb.left), y: r(pb.top - nb.top),
                                   w: r(pb.width), h: r(pb.height) },
            controlesNativos: v.hasAttribute('controls'),
            t: r(v.currentTime), pausado: v.paused,
            estado: pane.dataset.state,
            texto: pane.querySelector('.state').textContent
          };
        }""")
        if MODO == "despues":
            # LA MISMA CAPTURA CON EL ENCABEZADO ESCONDIDO. Con el encabezado
            # puesto el pane baja 13 px y cae en otra fraccion de pixel, asi que
            # un diff contra la corrida de antes mide el corrimiento y no el
            # skin. Escondido, el pane vuelve a la fila exacta en la que estaba:
            # ahi el diff mide lo unico que se quiere medir.
            pg.evaluate("() => { document.querySelector('.masthead').style.display = 'none'; }")
            time.sleep(0.4)
            pane.screenshot(path=str(OUT / "pane-stock-despues-sin-encabezado.png"))
            pg.evaluate("() => { document.querySelector('.masthead').style.display = ''; }")
            time.sleep(0.4)

        if MODO == "antes":
            salida["enVentana"] = pg.evaluate(MEDIDA)
            pg.screenshot(path=str(OUT / "pagina-antes.png"))
        else:
            # ---- 1. la composicion sin aviso ---------------------------------
            salida["enVentana"] = pg.evaluate(MEDIDA)
            pg.screenshot(path=str(OUT / "t07-1-sin-aviso.png"))
            caja = pg.evaluate("""() => { const c = document.getElementById('player').getBoundingClientRect();
                return { x: Math.round(c.left), y: Math.round(c.top), width: Math.round(c.width), height: Math.round(c.height) }; }""")
            pg.screenshot(path=str(OUT / "t07-4-el-pane-de-cerca.png"), clip=caja)

            # ---- 2. con un aviso en pantalla ---------------------------------
            pg.evaluate("() => window.demo.video.play()")
            ir_a(pg, T_CON_AVISO)
            pg.wait_for_function(LISTO, timeout=30000)
            pausar_con_controles(pg)
            fijar_stock(pg)
            salida["conAviso"] = pg.evaluate(MEDIDA)
            pg.screenshot(path=str(OUT / "t07-2-con-aviso.png"))

            # ---- 3. fullscreen ------------------------------------------------
            pg.evaluate("() => window.demo.video.play()")
            ir_a(pg, T_SIN_AVISO)
            pg.locator(".qa-btn--full").click()
            pg.wait_for_function("document.fullscreenElement === document.getElementById('player')", timeout=10000)
            time.sleep(1.2)
            ir_a(pg, T_SIN_AVISO)
            pausar_con_controles(pg)
            salida["fullscreen"] = pg.evaluate(MEDIDA)
            pg.screenshot(path=str(OUT / "t07-3-fullscreen.png"))
            pg.evaluate("() => document.exitFullscreen()")
            time.sleep(0.8)
    finally:
        salida["consola"] = [c for c in consola if c["type"] in ("warning", "error")]
        (OUT / f"medicion-{MODO}.json").write_text(json.dumps(salida, indent=2))
        pg.close()

print(json.dumps({k: v for k, v in salida.items() if k in ("modo", "paneSinModificar", "consola")}, indent=2)[:1200])
