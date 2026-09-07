"""T-03 -- los controles usables con el dedo.

El sintoma que Nicolas reporto es de un GESTO, asi que el instrumento es un
gesto de verdad y no un estilo computado: la pagina se abre en un viewport de
telefono con la emulacion tactil de Chrome prendida --`pointer: coarse`,
`maxTouchPoints` distinto de cero, `ontouchstart` presente-- y cada toque se
despacha con `Input.dispatchTouchEvent`, asi que los eventos que llegan a la
pagina son `isTrusted` y de `pointerType` "touch", y el `pointerleave` que
aparece despues de levantar el dedo lo produce el navegador y no este script.
En este repositorio ya hubo dos falsos "OK" por mirar `getComputedStyle`, y por
eso lo que juzga cada punto es un evento tactil real mas una captura.

Lo que mide, en orden:

  1. LA CAUSA, que son dos candidatas y no son excluyentes. La del `pointerleave`
     se mide con un toque completo: la secuencia de eventos y los milisegundos
     que la capa estuvo arriba. La del temporizador se AISLA apretando el dedo y
     sin levantarlo: mientras el dedo esta abajo no hay `pointerleave`, asi que
     si la capa se va igual la que la baja es la unica otra cosa que puede.
  2. EL TERCER DEFECTO: con los controles invisibles, un toque en la franja de
     abajo, uno en el centro y uno arriba a la derecha. `opacity` no apaga los
     eventos de puntero, asi que lo que se mide es si el primer toque NAVEGA en
     lugar de mostrar.
  3. EL GESTO, que es la definicion de done: un toque que trae los controles y
     los deja arriba, la pausa y el audio apretados con el dedo, y el gesto que
     los esconde haciendolo. Con capturas.
  4. LA CORRIDA CON MOUSE, en el viewport de escritorio y con la emulacion
     tactil apagada, para que el escritorio se compare contra si mismo.
  5. LAS AREAS DE TOQUE, que son tokens de tamano: la caja de cada boton.
  6. LA CAJA QUE EL CONTRATO PIDE CONTRA LA QUE EL NAVEGADOR DIBUJO, adentro
     del break del Quad, que es la medicion que la fase corre donde una task
     toca los controles.

Uso:  python3 t03run.py <carpeta-de-salida> <etiqueta>
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
ETIQUETA = sys.argv[2] if len(sys.argv) > 2 else "despues"
URL = "http://localhost:8080/"

# El telefono: 412 x 915 css px, que es donde los dos panes se apilan
# (css/player.css apila a 960 px) y es la superficie desde la que Nicolas
# encontro el defecto. dpr 2 para que la captura se lea; no cambia el layout.
TELEFONO = {"width": 412, "height": 915, "deviceScaleFactor": 2, "mobile": False}
ESCRITORIO = {"width": 1600, "height": 1000}

T_ADENTRO_DEL_QUAD = 126.0

# ---------------------------------------------------------------- el registro
# Los eventos que llegan al contenedor, en fase de captura, y los cambios de
# clase de la capa por MutationObserver: el par "evento a los X ms / clase a los
# X ms" es lo que dice QUE evento la bajo.
INSTRUMENTO = """
() => {
  window.__t03 = { log: [], t0: performance.now() };
  const L = window.__t03;
  const c = document.getElementById('player');
  const layer = c.querySelector('.qa-controls');
  const arriba = () => layer.classList.contains('qa-controls--on');
  const push = (o) => L.log.push({ ms: +(performance.now() - L.t0).toFixed(2), ...o });
  L.marca = (texto) => push({ ev: 'marca', texto, arriba: arriba() });
  L.desde = () => L.log.length;
  L.tramo = (n) => L.log.slice(n);
  for (const t of ['pointerdown','pointerup','pointermove','pointerleave','click']) {
    window.addEventListener(t, (e) => {
      if (!(e.target === c || c.contains(e.target))) return;
      push({ ev: t, pointerType: e.pointerType, trusted: e.isTrusted,
             target: String(e.target.className || e.target.tagName || ''), arriba: arriba() });
    }, true);
  }
  new MutationObserver(() => push({ ev: 'clase', arriba: arriba() }))
    .observe(layer, { attributes: true, attributeFilter: ['class'] });
  return {
    coarse: matchMedia('(pointer: coarse)').matches,
    hoverNone: matchMedia('(hover: none)').matches,
    maxTouchPoints: navigator.maxTouchPoints,
    ontouchstart: 'ontouchstart' in window,
    viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
    // Nunca se muestran controles nativos, solo los nuestros.
    controlesNativos: [...document.querySelectorAll('video')]
      .map((v) => ({ id: v.id, controls: v.hasAttribute('controls') }))
  };
}
"""

CAJAS = """
() => {
  const p = document.getElementById('player');
  const r = (n) => { const b = n.getBoundingClientRect();
    return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2),
             cx: +(b.x + b.width / 2).toFixed(2), cy: +(b.y + b.height / 2).toFixed(2) }; };
  const q = (s) => { const n = p.querySelector(s); return n ? r(n) : null; };
  const capa = p.querySelector('.qa-controls');
  const css = getComputedStyle(capa);
  return {
    player: r(p), play: q('.qa-btn--play'), audio: q('.qa-btn--audio'),
    full: q('.qa-btn--full'), track: q('.qa-track'), rail: q('.qa-track__rail'),
    tokens: { '--qa-icon': css.getPropertyValue('--qa-icon').trim(),
              '--qa-play': css.getPropertyValue('--qa-play').trim(),
              '--qa-rail': css.getPropertyValue('--qa-rail').trim() }
  };
}
"""

ESTADO = """
() => { const v = window.demo.video;
  return { paused: v.paused, muted: v.muted, t: +v.currentTime.toFixed(3),
           ms: +(performance.now() - window.__t03.t0).toFixed(2),
           arriba: document.querySelector('#player .qa-controls').classList.contains('qa-controls--on') }; }
"""

# Un punto ADENTRO de la imagen y AFUERA de todo el mobiliario, calculado en la
# pagina y no a ojo: las cajas de los botones se mueven con los tokens, y un
# punto elegido a mano se vuelve un toque sobre la barra en cuanto un token
# crece. Los que devuelve son los dos toques "sobre la imagen" del gesto.
PUNTOS_LIBRES = """
() => {
  const p = document.getElementById('player');
  const b = p.getBoundingClientRect();
  const cajas = ['.qa-btn--play', '.qa-btn--audio', '.qa-btn--full', '.qa-track']
    .map((s) => p.querySelector(s)).filter(Boolean).map((n) => n.getBoundingClientRect());
  const libre = (x, y) => !cajas.some((r) =>
    x >= r.x - 8 && x <= r.right + 8 && y >= r.y - 8 && y <= r.bottom + 8);
  const out = [];
  for (const fy of [0.18, 0.32, 0.48, 0.62]) {
    for (const fx of [0.12, 0.24, 0.50, 0.74, 0.88]) {
      const x = b.x + b.width * fx, y = b.y + b.height * fy;
      if (libre(x, y)) out.push({ x: +x.toFixed(2), y: +y.toFixed(2), fx, fy });
    }
  }
  return out;
}
"""

# La caja que el contrato pide contra la que el navegador dibujo. Es la
# aritmetica de la T-03 de la fase 02, escrita aca y no importada de la
# libreria: lo que se compara son dos cuentas independientes.
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

ESCONDIDOS = ("() => !document.querySelector('#player .qa-controls')"
              ".classList.contains('qa-controls--on')")

salida = {"etiqueta": ETIQUETA}
consola = []


def toque(cdp, x, y, apretado_ms=70):
    """Un toque de verdad: touchStart, el dedo abajo un rato, touchEnd."""
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart",
             "touchPoints": [{"x": x, "y": y, "radiusX": 12, "radiusY": 12, "id": 1}]})
    time.sleep(apretado_ms / 1000)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})


def dedo_abajo(cdp, x, y):
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart",
             "touchPoints": [{"x": x, "y": y, "radiusX": 12, "radiusY": 12, "id": 1}]})


def dedo_arriba(cdp):
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})


def tramo(pg, desde):
    return pg.evaluate("(n) => window.__t03.tramo(n)", desde)


def cuanto_estuvo_arriba(log):
    """Los milisegundos entre la clase que la puso arriba y la que la bajo, y el
    evento que quedo pegado a la bajada."""
    subio = next((e for e in log if e["ev"] == "clase" and e["arriba"]), None)
    if not subio:
        return {"subio": False}
    i = next((k for k, e in enumerate(log)
              if e["ev"] == "clase" and not e["arriba"] and e["ms"] > subio["ms"]), None)
    if i is None:
        return {"subio": True, "bajo": False, "msArribaAlMenos": round(log[-1]["ms"] - subio["ms"], 2)}
    antes = [e for e in log[:i] if e["ev"] != "clase"]
    return {"subio": True, "bajo": True,
            "msArriba": round(log[i]["ms"] - subio["ms"], 2),
            "eventoPegadoALaBajada": (antes[-1]["ev"] if antes else None),
            "msEntreEseEventoYLaBajada": (round(log[i]["ms"] - antes[-1]["ms"], 2) if antes else None)}


def esperar_escondidos(pg, ms=12000):
    pg.wait_for_function(ESCONDIDOS, timeout=ms)


def foto(pg, nombre):
    pg.locator("#player").screenshot(path=str(OUT / f"t03-{nombre}-{ETIQUETA}.png"))


with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    ctx = b.contexts[0]
    pg = ctx.new_page()
    pg.on("console", lambda m: consola.append({"type": m.type, "text": m.text}))
    try:
        cdp = ctx.new_cdp_session(pg)
        cdp.send("Emulation.setDeviceMetricsOverride", TELEFONO)
        cdp.send("Emulation.setTouchEmulationEnabled", {"enabled": True, "maxTouchPoints": 5})
        pg.goto(URL, wait_until="load")
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
        pg.wait_for_function("window.demo.provider.programRanges().settled === true", timeout=30000)
        pg.evaluate("() => document.getElementById('player').scrollIntoView({ block: 'center' })")
        time.sleep(0.4)
        salida["elInstrumento"] = pg.evaluate(INSTRUMENTO)
        salida["lasAreasDeToque"] = pg.evaluate(CAJAS)
        cajas = salida["lasAreasDeToque"]
        pl = cajas["player"]
        libres = pg.evaluate(PUNTOS_LIBRES)
        salida["losToquesSobreLaImagen"] = {"candidatos": libres,
                                            "usados": [libres[0], libres[-1]]}
        IMG_A, IMG_B = libres[0], libres[-1]

        # ============================================================ 1. LA CAUSA
        # 1.a el toque completo.
        pg.evaluate("() => { const v = window.demo.video; v.currentTime = 10; if (v.paused) v.play(); }")
        time.sleep(0.5)
        esperar_escondidos(pg)
        d = pg.evaluate("() => window.__t03.desde()")
        toque(cdp, IMG_A["x"], IMG_A["y"])
        time.sleep(0.15)
        foto(pg, "1a-el-toque-primera-lectura")
        time.sleep(0.15)
        estado_300 = pg.evaluate(ESTADO)
        time.sleep(1.7)
        foto(pg, "1b-el-toque-segunda-lectura")
        estado_2000 = pg.evaluate(ESTADO)
        time.sleep(2.5)
        foto(pg, "1c-el-toque-tercera-lectura")
        estado_4500 = pg.evaluate(ESTADO)
        time.sleep(1.0)
        estado_5500 = pg.evaluate(ESTADO)
        log = tramo(pg, d)
        # Los ms de cada lectura son los del reloj de la PAGINA y no la suma de
        # los sleeps: cada captura mete su propia latencia, asi que una etiqueta
        # nominal mentiria sobre cuando se leyo.
        subio = next((e for e in log if e["ev"] == "clase" and e["arriba"]), None)
        t_subio = subio["ms"] if subio else None
        def lectura(e):
            return {"msDesdeQueSubieron": (None if t_subio is None
                                           else round(e["ms"] - t_subio, 2)),
                    "arriba": e["arriba"]}
        salida["laCausaPointerleave"] = {
            "loQueMide": "un toque completo sobre la imagen, con el dedo levantandose",
            "secuencia": log, "lectura": cuanto_estuvo_arriba(log),
            "lasCuatroLecturas": [lectura(x) for x in
                                  (estado_300, estado_2000, estado_4500, estado_5500)]}

        # 1.b el temporizador, aislado: el dedo se aprieta y NO se levanta, asi
        # que no hay `pointerleave`. Si la capa se baja igual, la bajo el
        # temporizador, y el numero dice cuanto duro.
        esperar_escondidos(pg)
        d = pg.evaluate("() => window.__t03.desde()")
        dedo_abajo(cdp, IMG_A["x"], IMG_A["y"])
        time.sleep(4.0)
        con_el_dedo_abajo = pg.evaluate(ESTADO)
        log = tramo(pg, d)
        dedo_arriba(cdp)
        time.sleep(0.4)
        salida["laCausaTemporizador"] = {
            "loQueMide": "el dedo apretado 4 s sin levantarlo: sin pointerleave, "
                         "lo unico que puede bajar la capa es el temporizador",
            "secuencia": log, "lectura": cuanto_estuvo_arriba(log),
            "arribaConElDedoAbajoALos4000ms": con_el_dedo_abajo["arriba"],
            "cuantosPointermoveLlegaron": len([e for e in log if e["ev"] == "pointermove"])}

        # ================================================== 2. EL TERCER DEFECTO
        # Con los controles invisibles: un toque en la franja de abajo, uno en el
        # centro y uno arriba a la derecha.
        tercero = {}
        # la franja de abajo, al 80% del riel
        pg.evaluate("() => { const v = window.demo.video; v.currentTime = 10; if (v.paused) v.play(); }")
        time.sleep(0.4)
        esperar_escondidos(pg)
        antes = pg.evaluate(ESTADO)
        d = pg.evaluate("() => window.__t03.desde()")
        toque(cdp, cajas["rail"]["x"] + cajas["rail"]["w"] * 0.80, cajas["track"]["cy"])
        time.sleep(0.35)
        despues = pg.evaluate(ESTADO)
        foto(pg, "2-el-primer-toque-en-la-franja-de-abajo")
        tercero["laFranjaDeAbajo"] = {
            "antes": antes, "despues": despues,
            "seekeo": abs(despues["t"] - antes["t"]) > 5,
            "saltoSegundos": round(despues["t"] - antes["t"], 3),
            "mostroLosControles": despues["arriba"], "secuencia": tramo(pg, d)}
        # el centro, donde esta el boton de play de 74 px
        pg.evaluate("() => { const v = window.demo.video; v.currentTime = 10; if (v.paused) v.play(); }")
        time.sleep(0.4)
        esperar_escondidos(pg)
        antes = pg.evaluate(ESTADO)
        d = pg.evaluate("() => window.__t03.desde()")
        toque(cdp, cajas["play"]["cx"], cajas["play"]["cy"])
        time.sleep(0.35)
        despues = pg.evaluate(ESTADO)
        tercero["elCentro"] = {"antes": antes, "despues": despues,
                               "cambioLaPausa": antes["paused"] != despues["paused"],
                               "mostroLosControles": despues["arriba"],
                               "secuencia": tramo(pg, d)}
        pg.evaluate("() => { const v = window.demo.video; if (v.paused) v.play(); }")
        time.sleep(0.4)
        # arriba a la derecha, el boton de audio
        esperar_escondidos(pg)
        antes = pg.evaluate(ESTADO)
        d = pg.evaluate("() => window.__t03.desde()")
        toque(cdp, cajas["audio"]["cx"], cajas["audio"]["cy"])
        time.sleep(0.35)
        despues = pg.evaluate(ESTADO)
        tercero["arribaALaDerecha"] = {"antes": antes, "despues": despues,
                                       "cambioElAudio": antes["muted"] != despues["muted"],
                                       "mostroLosControles": despues["arriba"],
                                       "secuencia": tramo(pg, d)}
        pg.evaluate("() => { window.demo.video.muted = true; }")
        salida["elTercerDefecto"] = tercero

        # ========================================================== 3. EL GESTO
        # La definicion de done, con el dedo: un toque que los trae y los deja
        # arriba el tiempo suficiente para apretar uno, la pausa y el audio
        # accionados con el dedo, y el gesto que los esconde haciendolo.
        gesto = {}
        pg.evaluate("() => { const v = window.demo.video; v.currentTime = 10; if (v.paused) v.play(); }")
        time.sleep(0.4)
        esperar_escondidos(pg)
        toque(cdp, IMG_A["x"], IMG_A["y"])   # traerlos
        time.sleep(1.2)   # el rato que tarda una persona en mirar y apuntar
        gesto["alSegundoYPocoDelToque"] = pg.evaluate(ESTADO)
        antes = pg.evaluate(ESTADO)
        toque(cdp, cajas["play"]["cx"], cajas["play"]["cy"])             # la pausa
        time.sleep(0.4)
        despues = pg.evaluate(ESTADO)
        foto(pg, "3-la-pausa-con-el-dedo")
        gesto["laPausaConElDedo"] = {"antes": antes, "despues": despues,
                                     "pauso": antes["paused"] is False and despues["paused"] is True,
                                     "yLosControlesQuedaronArriba": despues["arriba"]}
        antes = pg.evaluate(ESTADO)
        toque(cdp, cajas["audio"]["cx"], cajas["audio"]["cy"])           # el audio
        time.sleep(0.4)
        despues = pg.evaluate(ESTADO)
        foto(pg, "4-el-audio-con-el-dedo")
        gesto["elAudioConElDedo"] = {"antes": antes, "despues": despues,
                                     "cambioElAudio": antes["muted"] != despues["muted"],
                                     "yLosControlesQuedaronArriba": despues["arriba"]}
        pg.evaluate("() => { window.demo.video.muted = true; }")
        # de vuelta a reproducir, y el gesto que los esconde
        antes = pg.evaluate(ESTADO)
        toque(cdp, cajas["play"]["cx"], cajas["play"]["cy"])
        time.sleep(0.5)
        gesto["yDeVueltaAReproducir"] = pg.evaluate(ESTADO)
        d = pg.evaluate("() => window.__t03.desde()")
        antes = pg.evaluate(ESTADO)
        toque(cdp, IMG_B["x"], IMG_B["y"])   # el segundo toque
        time.sleep(0.4)
        despues = pg.evaluate(ESTADO)
        foto(pg, "5-el-gesto-que-los-esconde")
        gesto["elGestoQueLosEsconde"] = {
            "antes": antes, "despues": despues,
            "losEscondio": antes["arriba"] is True and despues["arriba"] is False,
            "sinSeekear": abs(despues["t"] - antes["t"]) < 5, "secuencia": tramo(pg, d)}
        # y el tercer toque los trae de vuelta
        toque(cdp, IMG_B["x"], IMG_B["y"])
        time.sleep(0.3)
        gesto["yElTercerToqueLosTraeDeVuelta"] = pg.evaluate(ESTADO)
        salida["elGesto"] = gesto

        # ======= 6. la caja pedida contra la dibujada, adentro del Quad --------
        pg.evaluate("(t) => { const v = window.demo.video; if (v.paused) v.play(); v.currentTime = t; }",
                    T_ADENTRO_DEL_QUAD)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
        pg.wait_for_function(LISTO, timeout=30000)
        time.sleep(1.2)
        px = pg.evaluate(PIXELES)
        toque(cdp, IMG_A["x"], IMG_A["y"])
        time.sleep(0.2)
        foto(pg, "6-adentro-del-quad-con-los-controles")
        salida["laCajaPedidaContraLaDibujada"] = {
            "enElTelefono": {"t": T_ADENTRO_DEL_QUAD, "elementos": px,
                             "deltaMaxPx": max([x["deltaMaxPx"] for x in px], default=None)}}

        # ============================================== 4. LA CORRIDA CON MOUSE
        # El viewport de escritorio y la emulacion tactil APAGADA, para que el
        # escritorio se compare contra si mismo.
        cdp.send("Emulation.setTouchEmulationEnabled", {"enabled": False})
        cdp.send("Emulation.clearDeviceMetricsOverride")
        pg.set_viewport_size(ESCRITORIO)
        time.sleep(0.6)
        pg.evaluate("() => document.getElementById('player').scrollIntoView({ block: 'center' })")
        time.sleep(0.3)
        salida["elInstrumentoDelMouse"] = pg.evaluate(
            "() => ({ coarse: matchMedia('(pointer: coarse)').matches,"
            " hoverNone: matchMedia('(hover: none)').matches,"
            " maxTouchPoints: navigator.maxTouchPoints,"
            " viewport: { w: innerWidth, h: innerHeight } })")
        cajas_mouse = pg.evaluate(CAJAS)
        salida["lasAreasDeToqueEnElEscritorio"] = cajas_mouse
        pm = cajas_mouse["player"]
        raton = {}
        pg.evaluate("() => { const v = window.demo.video; v.currentTime = 10; if (v.paused) v.play(); }")
        time.sleep(0.5)
        # el mouse entra y se queda quieto: el temporizador de escritorio
        pg.mouse.move(pm["x"] - 40, pm["y"] - 40)
        time.sleep(0.2)
        esperar_escondidos(pg)
        d = pg.evaluate("() => window.__t03.desde()")
        pg.mouse.move(pm["x"] + pm["w"] * 0.25, pm["y"] + pm["h"] * 0.25)
        time.sleep(3.4)
        log = tramo(pg, d)
        raton["elMouseEntraYSeQuedaQuieto"] = {"secuencia": log, "lectura": cuanto_estuvo_arriba(log)}
        # el mouse se mueve y los renueva
        d = pg.evaluate("() => window.__t03.desde()")
        for k in range(9):
            pg.mouse.move(pm["x"] + pm["w"] * (0.25 + k * 0.05), pm["y"] + pm["h"] * 0.30)
            time.sleep(0.4)
        raton["elMouseSeMueveYLosRenueva"] = {"arribaDespuesDe3600msDeMovimiento": pg.evaluate(ESTADO)["arriba"]}
        # el mouse sale del contenedor
        d = pg.evaluate("() => window.__t03.desde()")
        pg.mouse.move(pm["x"] + pm["w"] * 0.5, pm["y"] - 120)
        time.sleep(0.5)
        log = tramo(pg, d)
        raton["elMouseSaleDelContenedor"] = {
            "secuencia": log, "lectura": cuanto_estuvo_arriba(log),
            "escondidos": pg.evaluate(ESTADO)["arriba"] is False}
        # los cuatro controles con el mouse
        pg.mouse.move(pm["x"] + pm["w"] * 0.25, pm["y"] + pm["h"] * 0.25)
        time.sleep(0.2)
        foto(pg, "7-el-escritorio-con-los-controles")
        antes = pg.evaluate(ESTADO)
        pg.mouse.click(cajas_mouse["play"]["cx"], cajas_mouse["play"]["cy"])
        time.sleep(0.4)
        despues = pg.evaluate(ESTADO)
        raton["clickEnLaPausa"] = {"antes": antes, "despues": despues,
                                   "cambioLaPausa": antes["paused"] != despues["paused"]}
        antes = pg.evaluate(ESTADO)
        pg.mouse.click(cajas_mouse["audio"]["cx"], cajas_mouse["audio"]["cy"])
        time.sleep(0.4)
        despues = pg.evaluate(ESTADO)
        raton["clickEnElAudio"] = {"antes": antes, "despues": despues,
                                   "cambioElAudio": antes["muted"] != despues["muted"]}
        pg.evaluate("() => { const v = window.demo.video; v.muted = true; if (v.paused) v.play(); }")
        time.sleep(0.4)
        # el seek con el mouse, con los controles ARRIBA
        antes = pg.evaluate(ESTADO)
        pg.mouse.move(cajas_mouse["rail"]["x"] + cajas_mouse["rail"]["w"] * 0.30, cajas_mouse["track"]["cy"])
        time.sleep(0.1)
        pg.mouse.down(); pg.mouse.up()
        time.sleep(0.5)
        despues = pg.evaluate(ESTADO)
        raton["elSeekConLosControlesArriba"] = {"antes": antes, "despues": despues,
                                                "seekeo": abs(despues["t"] - antes["t"]) > 5,
                                                "saltoSegundos": round(despues["t"] - antes["t"], 3)}
        # y el caso de borde del escritorio: los controles ESCONDIDOS y un click
        # sin mover el mouse antes. Es donde un arreglo del dedo podria romper el
        # mouse, asi que se mide y no se afirma.
        pg.evaluate("() => { const v = window.demo.video; v.currentTime = 10; if (v.paused) v.play(); }")
        time.sleep(0.4)
        pg.mouse.move(cajas_mouse["rail"]["x"] + cajas_mouse["rail"]["w"] * 0.70, cajas_mouse["track"]["cy"])
        time.sleep(0.2)
        esperar_escondidos(pg)
        antes = pg.evaluate(ESTADO)
        d = pg.evaluate("() => window.__t03.desde()")
        pg.mouse.down(); pg.mouse.up()
        time.sleep(0.5)
        despues = pg.evaluate(ESTADO)
        raton["elClickSinMoverConLosControlesEscondidos"] = {
            "antes": antes, "despues": despues,
            "seekeo": abs(despues["t"] - antes["t"]) > 5,
            "saltoSegundos": round(despues["t"] - antes["t"], 3),
            "secuencia": tramo(pg, d)}
        foto(pg, "8-el-escritorio-escondidos")
        salida["laCorridaConMouse"] = raton

        # y la caja pedida contra la dibujada tambien en el escritorio
        pg.evaluate("(t) => { const v = window.demo.video; if (v.paused) v.play(); v.currentTime = t; }",
                    T_ADENTRO_DEL_QUAD)
        pg.wait_for_function(LISTO, timeout=30000)
        time.sleep(1.2)
        px = pg.evaluate(PIXELES)
        salida["laCajaPedidaContraLaDibujada"]["enElEscritorio"] = {
            "t": T_ADENTRO_DEL_QUAD, "elementos": px,
            "deltaMaxPx": max([x["deltaMaxPx"] for x in px], default=None)}
        pg.evaluate("() => { window.demo.video.muted = true; }")
    finally:
        salida["consola"] = [c for c in consola if c["type"] in ("warning", "error")]
        (OUT / f"t03-la-lectura-{ETIQUETA}.json").write_text(json.dumps(salida, indent=2))
        pg.close()

# ------------------------------------------------------------------ el informe
print(f"\n===== {ETIQUETA} =====")
i = salida["elInstrumento"]
print(f"el instrumento: pointer coarse={i['coarse']} hover:none={i['hoverNone']} "
      f"maxTouchPoints={i['maxTouchPoints']} ontouchstart={i['ontouchstart']} "
      f"viewport={i['viewport']}")
print(f"controles nativos: {i['controlesNativos']}")
print(f"los dos toques sobre la imagen: {salida['losToquesSobreLaImagen']['usados']}")
t = salida["lasAreasDeToque"]["tokens"]
c = salida["lasAreasDeToque"]
print(f"tokens en el telefono: {t}   audio={c['audio']['w']}x{c['audio']['h']} "
      f"play={c['play']['w']}x{c['play']['h']} full={c['full']['w']}x{c['full']['h']} "
      f"track h={c['track']['h']}")
print("\n1. LA CAUSA")
a = salida["laCausaPointerleave"]
print(f"   pointerleave: {a['lectura']}")
print("   cuatro lecturas despues del toque: " +
      "  ".join(f"{x['msDesdeQueSubieron']} ms -> arriba={x['arriba']}" for x in a["lasCuatroLecturas"]))
for e in a["secuencia"]:
    print(f"     {e}")
b_ = salida["laCausaTemporizador"]
print(f"   temporizador (dedo abajo, sin pointerleave): {b_['lectura']}")
print(f"   arriba con el dedo abajo a los 4000 ms={b_['arribaConElDedoAbajoALos4000ms']}  "
      f"pointermove que llegaron={b_['cuantosPointermoveLlegaron']}")
print("\n2. EL TERCER DEFECTO (controles invisibles)")
for k, v in salida["elTercerDefecto"].items():
    r = {x: y for x, y in v.items() if x != "secuencia"}
    print(f"   {k}: { {q: r[q] for q in r if q not in ('antes','despues')} }")
    print(f"      antes={r['antes']}  despues={r['despues']}")
    for e in v.get("secuencia", []):
        print(f"        {e}")
print("\n3. EL GESTO CON EL DEDO")
for k, v in salida["elGesto"].items():
    print(f"   {k}: { {x: y for x, y in v.items() if x != 'secuencia'} }")
print("\n4. LA CORRIDA CON MOUSE")
print(f"   el instrumento: {salida['elInstrumentoDelMouse']}")
for k, v in salida["laCorridaConMouse"].items():
    print(f"   {k}: { {x: y for x, y in v.items() if x != 'secuencia'} }")
print("\n6. LA CAJA PEDIDA CONTRA LA DIBUJADA")
for donde, v in salida["laCajaPedidaContraLaDibujada"].items():
    print(f"   {donde}: delta max {v['deltaMaxPx']} px sobre {len(v['elementos'])} elementos")
print(f"\nconsola: {salida['consola']}")
