"""T-02 -- las lecturas del asset sin bloque y de los escalones del repliegue.

Un escenario por corrida. La pagina se carga una vez y se la deja reproducir de
punta a punta del break sin un solo seek; en cada marca se lee el estado y se
guarda entero. Nada se afirma mirando: `window.demo` expone el proveedor, el
renderizador y la capa, y de ahi salen todos los numeros.

Cada escenario es un asset-list de `signalling/` senalizado en el segundo 20 con
`./scripts/senalizar-contenido.sh 20 <escenario>`, que es lo que hace el runner.

Con `--audio` levanta el mute de la composicion antes de empezar, con un click
real sobre el control que dibuja la libreria -- que es lo que hace el operador
una vez al arrancar la grabacion. Hace falta para leer el `muted` de los nodos
del aviso: la pagina arranca muteada por la politica de autoplay y el mute de la
composicion tapa el volumen de cada elemento (ADR 0014).

Uso:  python3 t02leer.py <carpeta-de-salida> <escenario> [--audio]
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
ESC = sys.argv[2]
AUDIO = "--audio" in sys.argv[3:]
URL = "http://localhost:8080/"
PASO = 0.05

# Marcas de cada escenario: el instante y para que se lee. Las ventanas salen de
# acumular la DURATION de nivel superior desde el START-DATE en el segundo 20,
# que es la regla que la T-01 fijo.
ESCENARIOS = {
    # El break mezclado: overlay, squeezeback, LINEAL sin bloque, overlay.
    # Ventanas 20-32, 32-44, 44-56, 56-68.
    "mezclado": {
        "espera": 4,
        "fin": 70.0,
        "marcas": [
            (10.0, "antes del break"),
            (26.0, "dentro del aviso 1, concurrente"),
            (38.0, "dentro del aviso 2, concurrente"),
            (50.0, "dentro del aviso 3, LINEAL a cuadro entero"),
            (56.3, "un instante despues del fin del tercero"),
            (62.0, "dentro del aviso 4, concurrente"),
            (68.5, "despues del break entero"),
        ],
    },
    # Un bloque que este cliente no puede dibujar: el asset cae a su propio URI.
    # Ventanas 20-32, 32-44 (repliegue), 44-56.
    "repliegue-bloque-roto": {
        "espera": 3,
        "fin": 58.0,
        "marcas": [
            (26.0, "dentro del aviso 1, concurrente"),
            (38.0, "dentro del aviso 2, el del bloque roto"),
            (50.0, "dentro del aviso 3, concurrente"),
        ],
    },
    # Un asset sin nada reproducible: se saltea ESE asset y no el break.
    # Ventanas 20-32, [32-44 vacia], 44-56.
    "repliegue-sin-uri": {
        "espera": 2,
        "fin": 58.0,
        "marcas": [
            (26.0, "dentro del aviso 1, concurrente"),
            (38.0, "en la ventana del asset salteado"),
            (50.0, "dentro del aviso 3, concurrente"),
        ],
    },
    # El asset-list entero no se puede leer: el break se cancela con offset 0.
    "repliegue-json-roto": {
        "espera": 0,
        "fin": 40.0,
        "marcas": [
            (10.0, "antes del break"),
            (26.0, "en la ventana del break cancelado"),
            (38.0, "despues de la ventana del break cancelado"),
        ],
    },
    # ASSETS vacio: se aplica el offset y no se reproduce nada.
    "repliegue-vacio": {
        "espera": 0,
        "fin": 40.0,
        "marcas": [
            (10.0, "antes del break"),
            (26.0, "en la ventana del break vacio"),
            (38.0, "despues de la ventana del break vacio"),
        ],
    },
    # Dos experiencias solapadas a proposito: el primer item declara 18 s dentro
    # de un asset que declara 12, asi que su ventana pisa la del segundo.
    # Ventanas 20-38 y 32-44; el solape es 32-38.
    "solapado": {
        "espera": 2,
        "fin": 46.0,
        "marcas": [
            (26.0, "solo el aviso 1"),
            (34.5, "EL SOLAPE: las dos experiencias activas"),
            (41.0, "solo el aviso 2"),
        ],
    },
}

CFG = ESCENARIOS[ESC]

ESTADO = """
() => {
  const r = (x) => (typeof x === 'number' && isFinite(x) ? +x.toFixed(3) : null);
  const v = window.demo.video;
  const layer = window.demo.layer;
  const f = layer.getBoundingClientRect();
  const frame = {left: +f.x.toFixed(3), top: +f.y.toFixed(3),
                 width: +f.width.toFixed(3), height: +f.height.toFixed(3)};
  const activas = window.demo.provider.activeAt(v.currentTime);
  const rect = (n) => (({x, y, width, height}) => ({left: +x.toFixed(3), top: +y.toFixed(3),
      width: +width.toFixed(3), height: +height.toFixed(3)}))(n.getBoundingClientRect());
  const nodo = (n) => ({
    tag: n.tagName.toLowerCase(),
    elementId: n.dataset.elementId ?? null,
    readyState: typeof n.readyState === 'number' ? n.readyState : null,
    paused: typeof n.paused === 'boolean' ? n.paused : null,
    muted: typeof n.muted === 'boolean' ? n.muted : null,
    volume: typeof n.volume === 'number' ? n.volume : null,
    currentTime: r(n.currentTime),
    duration: r(n.duration),
    ended: typeof n.ended === 'boolean' ? n.ended : null,
    opacity: n.style.opacity || '',
    zIndex: n.style.zIndex || '',
    rect: rect(n)
  });

  // LA CAJA PEDIDA, calculada aparte del renderizador: la imagen dentro del
  // cuadro (relacion de aspecto del primario, centrada) y los insets en
  // porcentaje del contrato. Es la misma aritmetica escrita de nuevo, que es
  // lo que la hace una comparacion y no un eco.
  const ratio = v.videoWidth / v.videoHeight;
  const W = frame.width, H = frame.height;
  const aw = (ratio > 0 && W && H) ? Math.min(W, H * ratio) : W;
  const ah = (ratio > 0 && W && H) ? Math.min(H, W / ratio) : H;
  const area = {left: frame.left + (W - aw) / 2, top: frame.top + (H - ah) / 2,
                width: aw, height: ah};
  const pedida = (box) => {
    const left = (area.width * box.left) / 100;
    const top = (area.height * box.top) / 100;
    return {
      left: +(area.left + left).toFixed(3),
      top: +(area.top + top).toFixed(3),
      width: +(area.width - left - (area.width * box.right) / 100).toFixed(3),
      height: +(area.height - top - (area.height * box.bottom) / 100).toFixed(3)
    };
  };
  const cajas = (window.demo.renderer?.drawn ?? []).map((d) => {
    const node = d.element.primary ? v : d.node;
    const p = pedida(d.element.box);
    const dib = rect(node);
    const delta = Math.max(Math.abs(p.left - dib.left), Math.abs(p.top - dib.top),
                           Math.abs(p.width - dib.width), Math.abs(p.height - dib.height));
    return {itemId: d.experience?.itemId ?? null, elementId: d.element.id,
            primary: d.element.primary, box: d.element.box,
            pedida: p, dibujada: dib, delta: +delta.toFixed(3)};
  });

  return {
    t: r(v.currentTime),
    primario: {
      paused: v.paused,
      volume: v.volume,
      muted: v.muted,
      duration: r(v.duration),
      style: v.getAttribute('style'),
      rect: rect(v)
    },
    videoW: v.videoWidth, videoH: v.videoHeight,
    frame,
    activas: activas.map((e) => ({
      id: e.id, itemId: e.itemId, type: e.type,
      startTime: r(e.startTime), duration: r(e.duration),
      elements: e.elements.map((el) => ({
        id: el.id, primary: el.primary, box: el.box, zDepth: el.zDepth,
        volume: el.volume, uri: el.uri, mediaType: el.mediaType
      }))
    })),
    nodosEnLaCapa: [...layer.querySelectorAll('.ad')].map(nodo),
    dibujado: (window.demo.renderer?.drawn ?? []).map((d) => ({
      elementId: d.element.id, primary: d.element.primary, uri: d.element.uri,
      itemId: d.experience?.itemId ?? null
    })),
    cajas,
    rangos: window.demo.provider.programRanges()
  };
}
"""

INSTRUMENTAR = """
() => {
  window.__seeks = [];
  window.demo.video.addEventListener('seeking', function () {
    window.__seeks.push(+this.currentTime.toFixed(2));
  });
}
"""

res = {"escenario": ESC, "audio": None, "experiencias": None, "marcas": [], "rangosAlFinal": None,
       "seeks": None, "consola": [], "errores": [], "warns": []}
consola = []

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda m: consola.append({"type": m.type, "text": m.text[:500]}))
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        # Esperar a que el asset-list este resuelto. Con cero experiencias no hay
        # nada que esperar: se espera a que la senalizacion deje de tener pedidos
        # en vuelo, que es lo que `settled` dice.
        if CFG["espera"]:
            pg.wait_for_function(
                f"window.demo.provider.experiences.length === {CFG['espera']}", timeout=30000)
        else:
            pg.wait_for_function("window.demo.provider.programRanges().settled === true",
                                 timeout=30000)
        if AUDIO:
            # Un click de verdad y no `video.muted = false`: la politica de
            # autoplay pausa un elemento que se vuelve audible sin gesto, y un
            # primario pausado invalidaria todas las lecturas de esta corrida.
            pg.hover("#player")
            pg.click("#player .qa-btn--audio")
            pg.wait_for_function("window.demo.video.muted === false", timeout=5000)
            res["audio"] = pg.evaluate(
                "() => ({muted: window.demo.video.muted, paused: window.demo.video.paused})")
            print("  audio de la composicion levantado:", json.dumps(res["audio"]), flush=True)
        pg.evaluate(INSTRUMENTAR)
        res["experiencias"] = pg.evaluate(
            """() => window.demo.provider.experiences.map((e) => ({
                id: e.id, itemId: e.itemId, type: e.type,
                startTime: +e.startTime.toFixed(3), duration: +e.duration.toFixed(3),
                elements: e.elements.map((el) => ({id: el.id, primary: el.primary,
                    box: el.box, zDepth: el.zDepth, volume: el.volume,
                    uri: el.uri, mediaType: el.mediaType}))}))""")

        pend = list(CFG["marcas"])
        while True:
            m = pg.evaluate(ESTADO)
            t = m["t"] or 0
            for marca in list(pend):
                if t >= marca[0]:
                    res["marcas"].append(dict(m, marca=marca[0], para=marca[1]))
                    pend.remove(marca)
                    print(f"  t={t:7.3f}s  {marca[1]}\n"
                          f"            activas={[(e['itemId'], e['type']) for e in m['activas']]}"
                          f"  nodos={[n['elementId'] for n in m['nodosEnLaCapa']]}"
                          f"  primario(paused={m['primario']['paused']},"
                          f" vol={m['primario']['volume']})", flush=True)
            if t >= CFG["fin"]:
                res["rangosAlFinal"] = m["rangos"]
                break
            time.sleep(PASO)
        res["seeks"] = pg.evaluate("window.__seeks")
    finally:
        pg.close()

res["consola"] = consola
res["errores"] = [c for c in consola if c["type"] == "error"]
res["warns"] = [c for c in consola if c["type"] in ("warning", "warn")]
(OUT / f"t02-{ESC}{'-con-audio' if AUDIO else ''}.json").write_text(json.dumps(res, indent=2))
print(f"\nescrito {OUT}/t02-{ESC}{'-con-audio' if AUDIO else ''}.json")
print("seeks:", res["seeks"])
print("rangos al final:", json.dumps(res["rangosAlFinal"]))
for c in res["errores"]:
    print("ERROR consola:", c["text"][:200])
for c in res["warns"]:
    print("WARN consola:", c["text"][:200])
