"""T-06 -- la barra marca solo lo que ese player reproduce, y sobre el riel.

Lo que mide, en orden:

  1. LAS MARCAS Y EL RIEL: cada nodo de marca de la barra de nuestro pane con su
     caja, y cuanto de esa caja queda POR DEBAJO del borde de abajo del riel. Es
     la lectura que decide "nada colgando debajo", y va junto con la captura:
     en este repositorio ya hubo dos falsos "OK" por mirar estilos computados,
     asi que lo que se compara son rectangulos dibujados y una imagen.
  2. LA CAJA DE LA BARRA: .qa-track, .qa-track__rail, la fila y el bloque de la
     barra, mas los tokens, para ver a donde se movio la barra adentro del cuadro.
  3. LA CAPTURA A TAMANO REAL del pane nuestro (dpr 1, sin reducir) y un recorte
     de la tira de abajo, que es donde el carril colgaba.
  4. LA CAJA QUE EL CONTRATO PIDE CONTRA LA QUE EL NAVEGADOR DIBUJO, adentro del
     break del Quad: la capa de controles esta sobre la misma imagen contra la
     que se resuelven los layouts, y la altura de .qa-track cambia.

Con `telefono` como tercer argumento corre lo mismo en el viewport de un telefono
y con la emulacion tactil de Chrome prendida, que es el instrumento con el que se
eligio la altura de la barra: el punto 1 y la captura, y nada mas.

Uso:  python3 t06run.py <carpeta-de-salida> <etiqueta> [telefono]
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
ETIQUETA = sys.argv[2] if len(sys.argv) > 2 else "despues"
URL = "http://localhost:8080/"

ESCRITORIO = {"width": 1600, "height": 1000, "deviceScaleFactor": 1, "mobile": False}
# El telefono de la T-03: 412 x 915 css px, donde los dos panes se apilan
# (css/player.css apila a 960 px) y es la superficie desde la que Nicolas
# encontro el defecto. dpr 1 para que la captura sea a tamano real.
TELEFONO = {"width": 412, "height": 915, "deviceScaleFactor": 1, "mobile": False}
CON_EL_DEDO = len(sys.argv) > 3 and sys.argv[3] == "telefono"
VIEWPORT = TELEFONO if CON_EL_DEDO else ESCRITORIO
T_ADENTRO_DEL_QUAD = 126.0

MARCAS = """
() => {
  const r = (n) => { const b = n.getBoundingClientRect();
    return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2),
             bottom: +b.bottom.toFixed(2), right: +b.right.toFixed(2) }; };
  const p = document.getElementById('player');
  const track = p.querySelector('.qa-track');
  const rail = p.querySelector('.qa-track__rail');
  const cajaRiel = r(rail);
  const nodos = [...p.querySelectorAll('.qa-track .qa-mark, .qa-track .qa-cue')].map((n) => {
    const c = r(n);
    return { clase: n.className, titulo: n.title, caja: c,
             pxDebajoDelRiel: +(c.bottom - cajaRiel.bottom).toFixed(2),
             pxSobreElRiel: +(cajaRiel.y - c.y).toFixed(2) };
  });
  return {
    track: r(track), rail: cajaRiel,
    fila: r(p.querySelector('.qa-controls__row')),
    barra: r(p.querySelector('.qa-controls__bar')),
    player: r(p), video: r(p.querySelector('video')),
    contenedorDeCues: p.querySelector('.qa-track__cues') ? r(p.querySelector('.qa-track__cues')) : null,
    marcas: nodos,
    cuantasMarcas: nodos.length,
    cuantasCuelgan: nodos.filter((n) => n.pxDebajoDelRiel > 0.5).length,
    rangosDelProveedorDeLaPagina: window.demo.provider.programRanges().ranges
      .map((x) => ({ id: x.id, kind: x.kind, startTime: +x.startTime.toFixed(3), duration: +x.duration.toFixed(3) })),
    tokens: (() => { const c = getComputedStyle(p.querySelector('.qa-controls'));
      return { '--qa-rail': c.getPropertyValue('--qa-rail').trim(),
               '--qa-icon': c.getPropertyValue('--qa-icon').trim(),
               '--qa-pad': c.getPropertyValue('--qa-pad').trim() }; })(),
    altoDeTrackComputado: getComputedStyle(track).height
  };
}
"""

PIXELES = """
() => {
  const r6 = (n) => +n.toFixed(6);
  const capa = document.querySelector('.qa-concurrent-layer');
  const marco = capa.getBoundingClientRect();
  const v = window.demo.video;
  const ar = v.videoWidth / v.videoHeight;
  const w = Math.min(marco.width, marco.height * ar);
  const h = Math.min(marco.height, marco.width / ar);
  const area = { left: (marco.width - w) / 2, top: (marco.height - h) / 2, width: w, height: h };
  const out = [];
  for (const e of window.demo.provider.activeAt(v.currentTime)) {
    for (const el of e.elements) {
      const izq = (area.width * el.box.left) / 100;
      const arr = (area.height * el.box.top) / 100;
      const esperado = { left: area.left + izq, top: area.top + arr,
        width: area.width - izq - (area.width * el.box.right) / 100,
        height: area.height - arr - (area.height * el.box.bottom) / 100 };
      let medido;
      if (el.primary) { const b = v.getBoundingClientRect();
        medido = { left: b.x - marco.x, top: b.y - marco.y, width: b.width, height: b.height };
      } else { const n = capa.querySelector(`.ad[data-element-id="${el.id}"]`);
        if (!n) continue; const b = n.getBoundingClientRect();
        medido = { left: b.x - marco.x, top: b.y - marco.y, width: b.width, height: b.height }; }
      const delta = Math.max(...['left','top','width','height'].map((k) => Math.abs(medido[k] - esperado[k])));
      out.push({ elemento: el.id, primario: !!el.primary, deltaMaxPx: r6(delta) });
    }
  }
  return out;
}
"""

LISTO = """(() => {
  const a = [...document.querySelectorAll('.qa-concurrent-layer .ad')];
  if (a.length === 0) return false;
  return a.every(n => n.tagName === 'IMG' ? n.complete : n.readyState >= 2);
})()"""

salida = {"etiqueta": ETIQUETA, "url": URL, "viewport": VIEWPORT, "conElDedo": CON_EL_DEDO}
consola = []


def despertar(pg, caja):
    """El cromo arriba, con un mouse de verdad y dos movimientos: el segundo
    rearma el temporizador justo antes de la captura."""
    pg.mouse.move(caja["x"] + caja["w"] * 0.5, caja["y"] + caja["h"] * 0.35)
    time.sleep(0.15)
    pg.mouse.move(caja["x"] + caja["w"] * 0.5 + 3, caja["y"] + caja["h"] * 0.35 + 2)
    time.sleep(0.15)
    pg.wait_for_function(
        "() => document.querySelector('#player .qa-controls').classList.contains('qa-controls--on')",
        timeout=5000)


with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    ctx = b.contexts[0]
    pg = ctx.new_page()
    pg.on("console", lambda m: consola.append({"type": m.type, "text": m.text}))
    try:
        cdp = ctx.new_cdp_session(pg)
        cdp.send("Emulation.setDeviceMetricsOverride", VIEWPORT)
        if CON_EL_DEDO:
            cdp.send("Emulation.setTouchEmulationEnabled", {"enabled": True, "maxTouchPoints": 5})
        pg.goto(URL, wait_until="load")
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
        pg.wait_for_function("window.demo.provider.programRanges().settled === true", timeout=30000)
        pg.evaluate("() => document.getElementById('player').scrollIntoView({ block: 'center' })")
        time.sleep(0.4)

        # ---- 1 y 2: las marcas, el riel y la caja de la barra, fuera de un break
        pg.evaluate("() => { const v = window.demo.video; v.currentTime = 8; v.pause(); }")
        time.sleep(0.6)
        caja_player = pg.evaluate("() => { const b = document.getElementById('player').getBoundingClientRect();"
                                  "return { x: b.x, y: b.y, w: b.width, h: b.height }; }")
        despertar(pg, caja_player)
        salida["lasMarcasYElRiel"] = pg.evaluate(MARCAS)

        # ---- 3: la captura a tamano real y el recorte de la tira de abajo
        despertar(pg, caja_player)
        pg.locator("#player").screenshot(path=str(OUT / f"t06-1-nuestra-barra-{ETIQUETA}.png"))
        m = salida["lasMarcasYElRiel"]
        tira = {"x": m["player"]["x"], "y": m["barra"]["y"] - 8,
                "width": m["player"]["w"], "height": (m["player"]["bottom"] - m["barra"]["y"]) + 8}
        despertar(pg, caja_player)
        pg.screenshot(path=str(OUT / f"t06-2-la-tira-de-abajo-{ETIQUETA}.png"), clip=tira)
        salida["laTira"] = tira

        if CON_EL_DEDO:
            salida["elInstrumento"] = pg.evaluate(
                "() => ({ coarse: matchMedia('(pointer: coarse)').matches,"
                " anyCoarse: matchMedia('(any-pointer: coarse)').matches,"
                " maxTouchPoints: navigator.maxTouchPoints,"
                " ontouchstart: 'ontouchstart' in window })")
            raise SystemExit(0)

        # ---- 4: la caja pedida contra la dibujada, adentro del break del Quad
        pg.evaluate("(t) => { const v = window.demo.video; v.currentTime = t; if (v.paused) v.play(); }",
                    T_ADENTRO_DEL_QUAD)
        pg.wait_for_function("() => window.demo.provider.activeAt(window.demo.video.currentTime).length > 0",
                             timeout=20000)
        pg.wait_for_function(LISTO, timeout=20000)
        time.sleep(0.5)
        pg.evaluate("() => window.demo.video.pause()")
        time.sleep(0.3)
        salida["laCajaPedidaContraLaDibujada"] = pg.evaluate(PIXELES)
        despertar(pg, caja_player)
        salida["lasMarcasYElRielAdentroDelBreak"] = pg.evaluate(MARCAS)
        pg.locator("#player").screenshot(path=str(OUT / f"t06-3-adentro-del-quad-{ETIQUETA}.png"))
    finally:
        salida["consola"] = [c for c in consola if c["type"] in ("error", "warning")]
        (OUT / f"t06-la-lectura-{ETIQUETA}.json").write_text(json.dumps(salida, indent=2), encoding="utf8")
        pg.close()

m = salida["lasMarcasYElRiel"]
print(f"viewport: {VIEWPORT}  con el dedo: {CON_EL_DEDO}")
print(f"marcas: {m['cuantasMarcas']}  cuelgan debajo del riel: {m['cuantasCuelgan']}")
print(f"track: {m['track']}")
print(f"rail:  {m['rail']}")
print(f"fila:  h={m['fila']['h']}   barra: h={m['barra']['h']}   tokens: {m['tokens']}")
print(f"contenedor de cues: {m['contenedorDeCues']}")
for n in m["marcas"]:
    print(f"  {n['clase']:24s} x={n['caja']['x']:8.2f} w={n['caja']['w']:7.2f} "
          f"y={n['caja']['y']:8.2f} h={n['caja']['h']:6.2f} debajoDelRiel={n['pxDebajoDelRiel']:+.2f}")
print("rangos del proveedor de la pagina:",
      len(m["rangosDelProveedorDeLaPagina"]),
      {k: sum(1 for x in m["rangosDelProveedorDeLaPagina"] if x["kind"] == k)
       for k in {x["kind"] for x in m["rangosDelProveedorDeLaPagina"]}})
if "elInstrumento" in salida:
    print("el instrumento:", salida["elInstrumento"])
if "laCajaPedidaContraLaDibujada" in salida:
    print("caja pedida contra dibujada, delta max px:",
          max([x["deltaMaxPx"] for x in salida["laCajaPedidaContraLaDibujada"]], default=None),
          f'({len(salida["laCajaPedidaContraLaDibujada"])} elementos)')
print("consola (error/warning):", json.dumps(salida["consola"], indent=2)[:1200])
