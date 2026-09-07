"""T-02 -- el logo de Qualabs sale de los controles del player.

La salida es una captura a tamano real de los dos panes: sin marca sobre la
imagen y con la del encabezado en su lugar. Se corre por el mismo camino que la
T-01 -- el Chrome real por CDP en el 9333, contra el servidor del 8080 -- y con
los controles a la vista, porque la barra es donde estaba el logo y una captura
con los controles escondidos no muestra nada.

Se cae en el break 1 --el `cornerOverlay`, que es el aviso con el que la T-07 de
la fase 02 mostro la marca-- para que la captura tenga aviso adentro del cuadro
y se vea que no hay ninguna marca encima de el.

Dos lecturas del DOM acompanan la captura, que son las dos afirmaciones que la
captura hace, escritas como booleanos: que no hay nodo `qa-brand` adentro del
contenedor, y que el `img` de la marca del encabezado sigue ahi.

Uso:  python3 t02run.py <carpeta-de-salida> <etiqueta>
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
ETIQUETA = sys.argv[2] if len(sys.argv) > 2 else "despues"
URL = "http://localhost:8080/"

T_ADENTRO_DEL_OVERLAY = 26.0   # break 1, cornerOverlay

LISTO = """(() => {
  const a = [...document.querySelectorAll('.qa-concurrent-layer .ad')];
  if (a.length === 0) return false;
  return a.every(n => n.tagName === 'IMG' ? n.complete : n.readyState >= 2);
})()"""

MEDIDA = """
() => {
  const contenedor = document.getElementById('player');
  const marca = contenedor.querySelector('.qa-brand');
  const enc = document.querySelector('.masthead .brand img');
  const caja = (n) => { const b = n.getBoundingClientRect();
    return { width: +b.width.toFixed(2), height: +b.height.toFixed(2) }; };
  return {
    marcaAdentroDelCuadro: marca ? { existe: true, ...caja(marca) } : { existe: false },
    marcaDelEncabezado: enc
      ? { existe: true, src: enc.getAttribute('src'), alt: enc.alt, ...caja(enc) }
      : { existe: false },
    controlesALaVista: document.querySelector('#player .qa-controls')
      ?.classList.contains('qa-controls--on') ?? null,
    t: +window.demo.video.currentTime.toFixed(2),
    cuantosAvisos: document.querySelectorAll('.qa-concurrent-layer .ad').length
  };
}
"""

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    pg.set_viewport_size({"width": 1600, "height": 1000})
    salida = {"etiqueta": ETIQUETA}
    consola = []
    pg.on("console", lambda m: consola.append({"type": m.type, "text": m.text}))
    try:
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
        pg.wait_for_function("window.demo.provider.programRanges().settled === true",
                             timeout=30000)

        pg.evaluate("(t) => { const v = window.demo.video;"
                    " if (v.paused) v.play(); v.currentTime = t; }",
                    T_ADENTRO_DEL_OVERLAY)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
        pg.wait_for_function(LISTO, timeout=30000)
        time.sleep(1.5)

        pg.evaluate("() => window.demo.concurrent.controls.show()")
        time.sleep(0.4)
        salida["laLectura"] = pg.evaluate(MEDIDA)
        pg.screenshot(path=str(OUT / f"t02-1-los-dos-panes-{ETIQUETA}.png"))
    finally:
        salida["consola"] = [c for c in consola if c["type"] in ("warning", "error")]
        (OUT / f"t02-la-lectura-{ETIQUETA}.json").write_text(json.dumps(salida, indent=2))
        pg.close()

m = salida["laLectura"]
print(f"\n===== {ETIQUETA} =====")
print(f"  t={m['t']}s, {m['cuantosAvisos']} avisos en el cuadro, "
      f"controles a la vista: {m['controlesALaVista']}")
print(f"  marca adentro del cuadro: {m['marcaAdentroDelCuadro']}")
print(f"  marca del encabezado:     {m['marcaDelEncabezado']}")
print(f"  consola: {salida['consola']}")
