"""T-01 -- el estado de la composicion gobierna a todos sus elementos.

La secuencia es la que Nicolas describio probando la demo desde el celular, y se
corre con gestos de verdad y no por JS, porque el defecto aparece por un gesto:
se pausa la composicion CLICKEANDO el boton de play, y se hace el seek
CLICKEANDO la barra, que es la unica manera de que lo que se mide sea el camino
que el dedo recorre.

  1. EL DEFECTO. Composicion pausada, seek que cae adentro de la ventana de un
     aviso concurrente de video --el Quad del break 5, tres nodos de video mas
     el primario--. Todos los elementos tienen que quedar detenidos.
  2. LA VUELTA. Play, y todos arrancan juntos.

La lectura es nodo por nodo y lee TRES campos y no uno: `paused`, `volume` /
`muted` y `currentTime`. Los dos ultimos son lo unico de esta task que no se ve
en la pantalla --un elemento que arranca con el volumen equivocado o en el
segundo equivocado se ve perfecto-- y los tres pasan por la misma funcion que se
edito. El `paused` de la composicion se lee tambien, porque el "todos" lo
incluye.

Y las otras dos cosas que se corren porque la task edita el renderizado: la
comparacion de la caja que el contrato pide contra la que el navegador dibujo, y
el recorrido de los cinco breaks, que tiene que seguir corriendo igual.

Uso:  python3 t01run.py <carpeta-de-salida> <etiqueta>
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
ETIQUETA = sys.argv[2] if len(sys.argv) > 2 else "despues"
URL = "http://localhost:8080/"

# El break 5, multiView: tres assets de video mas el primario, y con la mezcla
# declarada --100 en uno y 10 en los otros tres--, asi que la columna del volumen
# dice algo. Se cae en el MEDIO de la ventana --120 s a 132 s-- para que el
# `startAt` tenga que desplazar el asset y la columna del segundo tambien diga
# algo.
T_ADENTRO_DEL_QUAD = 126.0
QUAD_EMPIEZA = 120.0

# El recorrido, que es la tabla de scripts/senalizar-contenido.sh.
RECORRIDO = [(1, 26.0, "Overlay"), (2, 51.0, "LBox video"), (3, 76.0, "LBox image"),
             (4, 101.0, "Side by side pullback"), (5, 126.0, "Quad")]

# La lectura nodo por nodo. Tres campos por nodo y el estado de la composicion.
MEDIDA = """
() => {
  const r = (n) => (typeof n === 'number' ? +n.toFixed(4) : n);
  const v = window.demo.video;
  const drawn = window.demo.renderer.drawn;
  return {
    composicion: { paused: v.paused, muted: v.muted, volume: r(v.volume),
                   currentTime: r(v.currentTime) },
    cuantosElementos: drawn.length,
    elementos: drawn.map((d) => {
      const img = d.node.tagName === 'IMG';
      return {
        id: d.element.id,
        primary: !!d.element.primary,
        nodo: d.node.tagName,
        volumenDeclarado: d.element.volume,
        arranqueQuePideElContrato: d.experience
          ? r(Math.max(0, v.currentTime - d.experience.startTime)) : null,
        paused: img ? null : d.node.paused,
        muted: img ? null : d.node.muted,
        volume: img ? null : r(d.node.volume),
        currentTime: img ? null : r(d.node.currentTime),
        readyState: img ? null : d.node.readyState
      };
    })
  };
}
"""

# La caja que el contrato pide contra la que el navegador dibujo. Es la medicion
# de la T-03 de la fase 02, que dio 0,00 px siete veces.
PIXELES = """
() => {
  const r6 = (n) => +n.toFixed(6);
  const capa = document.querySelector('.qa-concurrent-layer');
  const marco = capa.getBoundingClientRect();
  const v = window.demo.video;
  // La aritmetica del contrato, escrita aca y no importada de la libreria: lo
  // que se compara es lo que el contrato PIDE contra lo que el navegador
  // dibujo, y para eso las dos cuentas tienen que ser independientes. Es la
  // imagen adentro del marco --la relacion de aspecto del contenido, centrada--
  // y despues los porcentajes de inset sobre esa imagen.
  const ar = v.videoWidth / v.videoHeight;
  const w = Math.min(marco.width, marco.height * ar);
  const h = Math.min(marco.height, marco.width / ar);
  const area = { left: (marco.width - w) / 2, top: (marco.height - h) / 2, width: w, height: h };
  const out = [];
  for (const e of window.demo.provider.activeAt(v.currentTime)) {
    for (const el of e.elements) {
      const izq = (area.width * el.box.left) / 100;
      const arr = (area.height * el.box.top) / 100;
      const esperado = {
        left: area.left + izq,
        top: area.top + arr,
        width: area.width - izq - (area.width * el.box.right) / 100,
        height: area.height - arr - (area.height * el.box.bottom) / 100
      };
      let medido;
      if (el.primary) {
        const b = v.getBoundingClientRect();
        medido = { left: b.x - marco.x, top: b.y - marco.y, width: b.width, height: b.height };
      } else {
        const n = capa.querySelector(`.ad[data-element-id="${el.id}"]`);
        if (!n) continue;
        const b = n.getBoundingClientRect();
        medido = { left: b.x - marco.x, top: b.y - marco.y, width: b.width, height: b.height };
      }
      const delta = Math.max(...['left','top','width','height']
        .map((k) => Math.abs(medido[k] - esperado[k])));
      out.push({ elemento: el.id, primario: !!el.primary,
                 esperadoPx: Object.fromEntries(Object.entries(esperado).map(([k,x]) => [k, r6(x)])),
                 medidoPx: Object.fromEntries(Object.entries(medido).map(([k,x]) => [k, r6(x)])),
                 deltaMaxPx: r6(delta) });
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


def mostrar_controles(pg):
    pg.evaluate("() => window.demo.concurrent.controls.show()")
    time.sleep(0.2)


def clickear(pg, selector):
    """Un click de verdad, que es lo que el defecto necesita para aparecer."""
    mostrar_controles(pg)
    pg.locator(selector).click()
    time.sleep(0.5)


def seek_clickeando_la_barra(pg, t):
    """El seek por la barra, que es el gesto: un `pointerdown` sobre el riel, en
    la fraccion del largo del programa que corresponde al segundo pedido."""
    mostrar_controles(pg)
    riel = pg.locator("#pane-demo .qa-track__rail")
    caja = riel.bounding_box()
    largo = pg.evaluate("() => window.demo.video.duration")
    riel.click(position={"x": (t / largo) * caja["width"], "y": caja["height"] / 2})
    time.sleep(0.5)


def maximo(px):
    return max([x["deltaMaxPx"] for x in px], default=None)


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

        # ---- el recorrido de los cinco breaks, reproduciendo ---------------
        # Muteado, que es como arranca la pagina: lo que se mira aca es que los
        # cinco sigan armandose y reproduciendo igual. La mezcla se mide abajo.
        recorrido = []
        for n, t, nombre in RECORRIDO:
            pg.evaluate("(t) => { const v = window.demo.video;"
                        " if (v.paused) v.play(); v.currentTime = t; }", t)
            pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
            pg.wait_for_function(LISTO, timeout=30000)
            time.sleep(1.2)
            m = pg.evaluate(MEDIDA)
            recorrido.append({
                "break": n, "nombre": nombre, "t": m["composicion"]["currentTime"],
                "primarioPausado": m["composicion"]["paused"],
                "cuantosElementos": m["cuantosElementos"],
                "deltaMaxPx": maximo(pg.evaluate(PIXELES)),
                "elementos": m["elementos"]
            })
        salida["elRecorrido"] = recorrido
        pg.screenshot(path=str(OUT / f"t01-3-el-recorrido-{ETIQUETA}.png"))

        # ---- el audio de la composicion, con un click de verdad ------------
        # Es la configuracion con la que se graba, y la que hace que la columna
        # `muted` diga algo: un nodo con nivel > 0 tiene que quedar audible.
        if pg.evaluate("() => window.demo.video.muted"):
            clickear(pg, "#pane-demo .qa-btn--audio")
        salida["audioDeLaComposicion"] = pg.evaluate(
            "() => ({ muted: window.demo.video.muted })")

        # ---- 1. el defecto: pausar, y despues el seek adentro del aviso ----
        # Se sale del break primero, para que el seek sea el que crea los nodos:
        # el defecto es del CREAR y no del transicionar.
        pg.evaluate("() => { window.demo.video.currentTime = 10; }")
        pg.wait_for_function(
            "window.demo.provider.activeAt(window.demo.video.currentTime).length === 0",
            timeout=30000)
        time.sleep(0.5)
        clickear(pg, "#pane-demo .qa-btn--play")   # la pausa
        salida["pausadaAntesDelSeek"] = pg.evaluate(
            "() => ({ paused: window.demo.video.paused,"
            " t: +window.demo.video.currentTime.toFixed(3),"
            " cuantosNodosDeAviso: document.querySelectorAll('.qa-concurrent-layer .ad').length })")

        seek_clickeando_la_barra(pg, T_ADENTRO_DEL_QUAD)
        pg.wait_for_function(LISTO, timeout=30000)
        time.sleep(1.5)
        salida["pausadaAdentroDelAviso"] = pg.evaluate(MEDIDA)
        salida["pausadaAdentroDelAviso"]["pixeles"] = pg.evaluate(PIXELES)
        mostrar_controles(pg)
        pg.screenshot(path=str(OUT / f"t01-1-pausada-adentro-del-aviso-{ETIQUETA}.png"))

        # Un segundo de reloj de pared con la composicion pausada: un nodo que
        # avanzo su `currentTime` esta reproduciendo, y eso no se ve en una sola
        # lectura.
        antes = pg.evaluate(MEDIDA)
        time.sleep(1.5)
        despues = pg.evaluate(MEDIDA)
        salida["unSegundoDeParedConLaPausa"] = {
            "antes": {e["id"]: e["currentTime"] for e in antes["elementos"]},
            "despues": {e["id"]: e["currentTime"] for e in despues["elementos"]},
            "avanzo": {e["id"]: (None if e["currentTime"] is None else
                                 round(d["currentTime"] - e["currentTime"], 4))
                       for e, d in zip(antes["elementos"], despues["elementos"])}
        }

        # ---- 2. la vuelta: play, y todos arrancan juntos --------------------
        clickear(pg, "#pane-demo .qa-btn--play")
        time.sleep(1.0)
        salida["reproduciendoAdentroDelAviso"] = pg.evaluate(MEDIDA)
        salida["reproduciendoAdentroDelAviso"]["pixeles"] = pg.evaluate(PIXELES)
        mostrar_controles(pg)
        pg.screenshot(path=str(OUT / f"t01-2-play-y-arrancan-juntos-{ETIQUETA}.png"))

        # Y el audio de vuelta como estaba, que es como la pagina arranca.
        clickear(pg, "#pane-demo .qa-btn--audio")
    finally:
        salida["consola"] = [c for c in consola if c["type"] in ("warning", "error")]
        (OUT / f"t01-la-lectura-{ETIQUETA}.json").write_text(json.dumps(salida, indent=2))
        pg.close()


def tabla(titulo, m):
    c = m["composicion"]
    print(f"--- {titulo}   composicion: paused={c['paused']} muted={c['muted']} "
          f"volume={c['volume']} t={c['currentTime']}")
    print(f"    {'elemento':<16}{'nodo':<7}{'paused':<9}{'muted':<8}{'volume':<9}"
          f"{'currentTime':<13}{'pide':<8}")
    for e in m["elementos"]:
        print(f"    {e['id']:<16}{e['nodo']:<7}{str(e['paused']):<9}{str(e['muted']):<8}"
              f"{str(e['volume']):<9}{str(e['currentTime']):<13}"
              f"{str(e['arranqueQuePideElContrato']):<8}")
    if "pixeles" in m:
        print(f"    caja pedida contra dibujada: delta max {maximo(m['pixeles'])} px "
              f"sobre {len(m['pixeles'])} elementos")


print(f"\n===== {ETIQUETA} =====")
print("El recorrido de los cinco breaks:")
for r in salida["elRecorrido"]:
    avisos = [e for e in r["elementos"] if not e["primary"]]
    print(f"  break {r['break']}  t={r['t']:<8} {r['nombre']:<24} "
          f"{r['cuantosElementos']} elementos, {len(avisos)} avisos, "
          f"pausados={[e['paused'] for e in avisos]}, caja delta {r['deltaMaxPx']} px")
print()
tabla("PAUSADA, adentro del aviso", salida["pausadaAdentroDelAviso"])
print(f"    avance del currentTime en 1,5 s de pared con la pausa: "
      f"{salida['unSegundoDeParedConLaPausa']['avanzo']}")
print()
tabla("PLAY, adentro del aviso", salida["reproduciendoAdentroDelAviso"])
print("\nconsola:", salida["consola"])
