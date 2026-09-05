"""T-05 -- el volumen que declara el asset list, leido POR ELEMENTO.

Como se mide, y es la restriccion de la task y no un detalle: se leen `muted`
y `volume` de CADA nodo del layout, el primario incluido. NO se graba el
monitor del sink de PulseAudio: la fase 01 dejo escrito con dos corridas que el
instrumento no anda en esta maquina --devuelve cero bytes tambien cuando no hay
sonido, comprobado con un tono puro sin browser-- y que, aunque anduviera,
graba la MEZCLA y no dice cual de los elementos suena.

Seis estados, y los tres ultimos son los que fallan en silencio:

  1. QUAD CON LA MEZCLA, con el audio de la composicion encendido: el elemento
     de abajo a la izquierda en 100 y los otros tres en 10.
  2. DESPUES DEL QUAD: el primario vuelve a su audio entero. Un primario que se
     queda en el 10 % de la mezcla sigue el resto del programa sin que nada en
     pantalla lo diga.
  3. EL QUAD CON LA COMPOSICION MUTEADA: el mute de la composicion tapa los
     elementos del aviso sin borrar la mezcla.
  4. UN BREAK SIN `volume` Y SIN BLOQUE `primaryContent` (cornerOverlay).
  5. UN BREAK SIN `volume` Y CON BLOQUE `primaryContent` (squeezebackDoubleBox),
     que es la asimetria exacta: el default de 0 es del aviso y no del primario.
  6. EL BREAK DE STILLS (LBox image), donde no hay audio que poner en ningun
     lado y poner uno tirar.

El audio de la composicion se enciende CLICKEANDO el control, y no por JS: es
un gesto del usuario, que es lo que la politica de autoplay pide para dejar
sonar algo que empezo muteado.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

T_QUAD = 124.0          # break 5, multiView, 120 s -> 132 s
T_DESPUES_QUAD = 137.0  # afuera del break, con el quad recien cerrado
T_OVERLAY = 22.0        # break 1, cornerOverlay: sin volume y sin primaryContent
T_DOBLE = 99.0          # break 4, squeezebackDoubleBox: sin volume, CON primaryContent
T_STILLS = 74.0         # break 3, LBox image: los dos assets son <img>

MEDIDA = """
() => {
  const r = (n) => (typeof n === 'number' ? +n.toFixed(4) : n);
  const v = window.demo.video;
  const drawn = window.demo.renderer.drawn;
  return {
    t: r(v.currentTime),
    composicion: { muted: v.muted, volume: r(v.volume) },
    cuantosElementos: drawn.length,
    elementos: drawn.map((d) => ({
      id: d.element.id,
      primary: d.element.primary,
      zDepth: d.element.zDepth,
      caja: `${d.element.box.top} ${d.element.box.right} ${d.element.box.bottom} ${d.element.box.left}`,
      cuadrante: d.element.box.top >= 50
        ? (d.element.box.left >= 50 ? 'abajo a la derecha' : 'abajo a la izquierda')
        : (d.element.box.left >= 50 ? 'arriba a la derecha' : 'arriba a la izquierda'),
      volumenDeclarado: d.element.volume,
      nodo: d.node.tagName,
      // Lo que se pidio medir: muted y volume DEL NODO, uno por uno.
      muted: d.node.tagName === 'IMG' ? null : d.node.muted,
      volume: d.node.tagName === 'IMG' ? null : r(d.node.volume),
      // Y si ademas esta sonando de verdad: un nodo audible que la politica de
      // autoplay no dejo arrancar es un recuadro negro.
      paused: d.node.tagName === 'IMG' ? null : d.node.paused,
      readyState: d.node.tagName === 'IMG' ? null : d.node.readyState,
      tiempoDelAsset: d.node.tagName === 'IMG' ? null : r(d.node.currentTime)
    }))
  };
}
"""

LISTO = """(() => {
  const a = [...document.querySelectorAll('.qa-concurrent-layer .ad')];
  if (a.length === 0) return false;
  return a.every(n => n.tagName === 'IMG' ? n.complete : (n.readyState >= 2 && n.currentTime > 0.4));
})()"""


def ir_a(pg, t, con_aviso=True):
    pg.evaluate(f"() => {{ const v = window.demo.video; if (v.paused) v.play(); v.currentTime = {t}; }}")
    pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
    if con_aviso:
        pg.wait_for_function(LISTO, timeout=30000)
    time.sleep(0.8)


def clickear_audio(pg):
    """El control de la composicion, con un click de verdad: es el gesto que la
    politica de autoplay pide para dejar sonar lo que arranco muteado."""
    pg.evaluate("() => window.demo.concurrent.controls.show()")
    pg.locator(".qa-btn--audio").click()
    time.sleep(0.4)


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

        # ---- 1. el quad con la mezcla, con el audio encendido ---------------
        clickear_audio(pg)
        salida["composicionEncendida"] = pg.evaluate("() => ({ muted: window.demo.video.muted })")
        ir_a(pg, T_QUAD)
        salida["quadConMezcla"] = pg.evaluate(MEDIDA)
        pg.evaluate("() => { window.demo.video.pause(); window.demo.concurrent.controls.show(); }")
        time.sleep(0.4)
        pg.screenshot(path=str(OUT / "t05-1-quad-con-la-mezcla.png"))

        # ---- 2. despues del quad: el primario recupera su audio -------------
        ir_a(pg, T_DESPUES_QUAD, con_aviso=False)
        salida["despuesDelQuad"] = pg.evaluate(MEDIDA)

        # ---- 3. el quad con la composicion muteada --------------------------
        ir_a(pg, T_QUAD)
        clickear_audio(pg)
        salida["quadCompuestaMuteada"] = pg.evaluate(MEDIDA)
        clickear_audio(pg)  # de vuelta encendida para lo que sigue

        # ---- 4. un break sin volume y sin bloque primaryContent -------------
        ir_a(pg, T_OVERLAY)
        salida["overlaySinVolumen"] = pg.evaluate(MEDIDA)
        pg.evaluate("() => { window.demo.video.pause(); window.demo.concurrent.controls.show(); }")
        time.sleep(0.4)
        pg.screenshot(path=str(OUT / "t05-2-overlay-sin-volumen.png"))

        # ---- 5. un break sin volume y CON bloque primaryContent -------------
        ir_a(pg, T_DOBLE)
        salida["dobleBoxSinVolumen"] = pg.evaluate(MEDIDA)

        # ---- 6. el break de stills -----------------------------------------
        ir_a(pg, T_STILLS)
        salida["stills"] = pg.evaluate(MEDIDA)
    finally:
        salida["consola"] = [c for c in consola if c["type"] in ("warning", "error")]
        (OUT / "t05-la-medicion.json").write_text(json.dumps(salida, indent=2))
        pg.close()

for k, m in salida.items():
    if not isinstance(m, dict) or "elementos" not in m:
        continue
    print(f"--- {k}  t={m['t']}  composicion muted={m['composicion']['muted']}")
    for e in m["elementos"]:
        print(f"    {e['id']:<14} {'primario' if e['primary'] else 'aviso   '} "
              f"{e['cuadrante']:<22} declarado={e['volumenDeclarado']:<5} "
              f"volume={e['volume']} muted={e['muted']} paused={e['paused']}")
print("consola:", salida["consola"])
