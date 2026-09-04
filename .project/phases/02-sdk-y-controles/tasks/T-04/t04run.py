"""T-04 -- los rangos del programa, marcados en la barra.

Dos capturas y una medicion.

  1. LA CAPTURA A TAMANO REAL con los cinco breaks marcados, y LA MISMA
     REDUCIDA A UN CUARTO, que es la prueba de que los dos colores se
     distinguen a distancia. La reduccion y la lectura de sus pixeles las hace
     t04pixeles.py, sobre la imagen y no sobre un estilo computado.

  2. LA GEOMETRIA de cada marca: donde la dibujo el browser contra donde la
     aritmetica dice que va. La aritmetica se calcula ACA, con el largo releido
     del primario, y no se le pregunta a la libreria: una medicion que le
     pregunta a la libreria se equivoca con ella.

Se pausa a proposito. Los controles se esconden solos a los 2,6 s mientras
corre y con el player en pausa se quedan, asi que la captura es reproducible y
la barra esta entera en las dos.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

# Entre el segundo y el tercer break: dos marcas quedan detras del relleno y
# tres por delante, que es lo que muestra que una marca no se borra al pasarle
# el progreso por encima.
T_SIN_AVISO = 60.0
T_CON_AVISO = 22.0   # adentro del primer break, cornerOverlay

MEDIDA = """
() => {
  const r = (n) => +n.toFixed(6);
  const v = window.demo.video;
  const rail = document.querySelector('.qa-track__rail');
  const railBox = rail.getBoundingClientRect();
  const largo = v.duration;
  const { ranges, settled } = window.demo.provider.programRanges();

  // Lo que la aritmetica dice, calculada aca con el largo releido del primario.
  const esperado = {};
  for (const rg of ranges) {
    esperado[rg.id] = {
      kind: rg.kind,
      left: r(rg.startTime / largo * 100),
      width: r(rg.duration / largo * 100),
      izquierdaEnPx: r(railBox.left + railBox.width * rg.startTime / largo),
      anchoEnPx: r(railBox.width * rg.duration / largo)
    };
  }

  const nodos = [...document.querySelectorAll('.qa-mark, .qa-cue')].map((n) => {
    const b = n.getBoundingClientRect();
    return {
      clase: n.className,
      carril: n.className === 'qa-cue' ? 'debajo del riel' : 'sobre el riel',
      title: n.title,
      color: getComputedStyle(n).backgroundColor,
      estilo: { left: n.style.left, width: n.style.width },
      dibujado: { left: r(b.left), top: r(b.top), width: r(b.width), height: r(b.height) },
      fraccionMedida: {
        desde: r((b.left - railBox.left) / railBox.width),
        hasta: r((b.left + b.width - railBox.left) / railBox.width)
      }
    };
  });

  const relleno = document.querySelector('.qa-track__fill').getBoundingClientRect();
  return {
    t: r(v.currentTime),
    pausado: v.paused,
    largoDelPrimarioReleido: largo,
    settled,
    cuantosRangos: ranges.length,
    porClase: ranges.reduce((a, x) => (a[x.kind] = (a[x.kind] || 0) + 1, a), {}),
    marcasEnElRiel: document.querySelectorAll('.qa-mark').length,
    marcasDebajo: document.querySelectorAll('.qa-cue').length,
    riel: { left: r(railBox.left), top: r(railBox.top), width: r(railBox.width), height: r(railBox.height) },
    relleno: { left: r(relleno.left), width: r(relleno.width) },
    esperado,
    nodos,
    fullscreen: document.fullscreenElement === document.getElementById('player'),
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
    """En pausa los controles no se esconden solos: arm() no arma el timer."""
    pg.evaluate("() => { window.demo.video.pause(); window.demo.concurrent.controls.show(); }")
    time.sleep(0.5)


with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    salida = {}
    consola = []
    pg.on("console", lambda m: consola.append({"type": m.type, "text": m.text}))
    try:
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
        pg.wait_for_function("window.demo.provider.programRanges().settled === true", timeout=30000)

        # ---- 1. en ventana, los cinco breaks -------------------------------
        ir_a(pg, T_SIN_AVISO)
        pausar_con_controles(pg)
        salida["enVentana"] = pg.evaluate(MEDIDA)
        pg.screenshot(path=str(OUT / "t04-1-los-cinco-breaks.png"))
        # La barra sola, recortada del mismo cuadro: el done pide leerla, y en la
        # pagina entera son 8 px de alto en 1080.
        caja = pg.evaluate("""() => { const b = document.querySelector('.qa-controls__bar').getBoundingClientRect();
            return { x: Math.round(b.left), y: Math.round(b.top - 10), width: Math.round(b.width), height: Math.round(b.height + 14) }; }""")
        pg.screenshot(path=str(OUT / "t04-3-la-barra-de-cerca.png"), clip=caja)

        # ---- 2. con un aviso en pantalla ------------------------------------
        pg.evaluate("() => window.demo.video.play()")
        ir_a(pg, T_CON_AVISO)
        pg.wait_for_function(LISTO, timeout=30000)
        pausar_con_controles(pg)
        salida["conAviso"] = pg.evaluate(MEDIDA)
        pg.screenshot(path=str(OUT / "t04-4-con-aviso.png"))

        # ---- 3. fullscreen: la barra cruza las barras negras ----------------
        pg.evaluate("() => window.demo.video.play()")
        ir_a(pg, T_SIN_AVISO)
        pg.locator(".qa-btn--full").click()
        pg.wait_for_function("document.fullscreenElement === document.getElementById('player')", timeout=10000)
        time.sleep(1.2)
        ir_a(pg, T_SIN_AVISO)
        pausar_con_controles(pg)
        salida["fullscreen"] = pg.evaluate(MEDIDA)
        pg.screenshot(path=str(OUT / "t04-5-fullscreen.png"))
        pg.evaluate("() => document.exitFullscreen()")
        time.sleep(0.8)
    finally:
        salida["consola"] = [c for c in consola if c["type"] in ("warning", "error")]
        (OUT / "t04-la-medicion.json").write_text(json.dumps(salida, indent=2))
        pg.close()

for k in ("enVentana", "conAviso", "fullscreen"):
    m = salida.get(k, {})
    print(k, "->", m.get("cuantosRangos"), "rangos,", m.get("marcasEnElRiel"), "marcas /",
          m.get("marcasDebajo"), "cues, viewport", m.get("viewport"))
print("consola:", salida["consola"])
