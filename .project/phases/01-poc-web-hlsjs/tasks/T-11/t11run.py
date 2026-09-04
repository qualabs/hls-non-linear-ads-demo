"""T-11 -- el mecanismo de multiview, con el layout multiView.

Mide cuatro cosas sobre el navegador real, con la pagina de la demo servida en
el 8080 y el Date Range de la clase concurrente apuntando al asset-list de
`multiView`:

1. Que los CUATRO CUADRANTES reproducen a la vez, en el formato de la T-01 y
   para poder comparar contra ella: por cada elemento, cuanto avanzo su
   `currentTime` contra el reloj de pared, cuantos cuadros decodifico y cuantos
   descarto. La T-01 midio esto en un banco de pruebas sintetico; aca es la
   pagina de la demo, con el player de fabrica del par de compatibilidad
   decodificando al lado, o sea CINCO elementos de video y cinco instancias de
   hls.js en la misma pestana. La entrada a la ventana es SIN SEEK: la pagina
   se carga y se deja llegar a los 20 s sola, asi que el numero no depende de
   que un seek haya calentado el buffer.
2. La caja pedida contra la dibujada, en pixeles, con la cuenta de los
   porcentajes hecha aparte del renderizador. Es la misma medicion de la T-07 y
   la T-10, ahora con cuatro elementos y con el primario metido en un cuadrante.
   Dos veces: a tamano real y despues de un resize.
3. El llenado del ADR 0013 en las cuatro cajas. En este layout las cuatro son
   cuadrantes del area del player, asi que conservan su relacion de aspecto: el
   numero esperado es cero recorte y cero estiramiento, y es el contraste con
   las barras del squeezeback de la T-10.
4. El audio del ADR 0010 con TRES avisos a la vez. Lo que se puede medir en
   esta maquina y lo que no lo dejo escrito la T-07: la captura del monitor del
   sink devuelve cero bytes cada vez que algo suena, y `captureStream` ignora el
   `muted` del elemento. Asi que se mide el `muted` de cada uno de los cinco
   elementos, los bytes de audio que cada uno decodifica, y los streams de
   playback que Chrome abre en el sink del sistema, en cuatro estados.
"""
import sys, json, time, pathlib, subprocess, array, math
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

res = {}
reqs = []
console = []

# --- la salida de audio de la maquina, medida por afuera del browser ---

def default_monitor():
    sink = subprocess.run(["pactl", "get-default-sink"], capture_output=True, text=True, timeout=5).stdout.strip()
    return sink + ".monitor"

def chrome_streams():
    """Los streams de playback abiertos en el sink del sistema."""
    try:
        out = subprocess.run(["pactl", "list", "sink-inputs"], capture_output=True, text=True, timeout=5).stdout
    except Exception as e:
        return {"error": str(e)}
    return [l.strip() for l in out.splitlines()
            if l.strip().startswith(("Sink Input #", "Mute:", "application.name =", "media.name ="))]

def output_level(mon, seconds=2):
    """El nivel de la salida. La T-07 midio que aca devuelve cero bytes cuando
    algo suena; se corre igual para dejar dicho si eso sigue pasando."""
    try:
        raw = subprocess.run(
            ["bash", "-c", f"timeout {seconds} parec --format=s16le --rate=16000 --channels=1 -d {mon} --raw"],
            capture_output=True, timeout=seconds + 6).stdout
    except Exception as e:
        return {"error": str(e)}
    a = array.array("h"); a.frombytes(raw[:len(raw) // 2 * 2])
    if not len(a):
        return {"muestras": 0, "rms": None, "peak": None}
    rms = math.sqrt(sum(x * x for x in a) / len(a)) / 32768
    return {"muestras": len(a), "rms": round(rms, 6), "peak": round(max(abs(x) for x in a) / 32768, 6)}

# --- lo que se evalua en la pagina ---

# El inventario de elementos de video de la pestana, con el uri que cada uno
# esta reproduciendo sacado del contrato y no del DOM.
SNAP = """
() => {
  const { video, provider } = window.demo;
  const uris = {};
  for (const e of provider.activeAt(video.currentTime))
    for (const el of e.elements) uris[el.id] = el.uri;
  const q = (v) => {
    const x = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : {};
    return { t: +v.currentTime.toFixed(3), rs: v.readyState, paused: v.paused,
             w: v.videoWidth, h: v.videoHeight,
             total: x.totalVideoFrames, dropped: x.droppedVideoFrames,
             corrupted: x.corruptedVideoFrames,
             audioBytes: v.webkitAudioDecodedByteCount ?? null,
             muted: v.muted, volume: v.volume };
  };
  const rows = [{ element: 'primaryContent', quadrant: true,
                  src: 'content/primary/con-daterange.m3u8', s: q(video) }];
  for (const n of document.querySelectorAll('#ads .ad'))
    rows.push({ element: n.dataset.elementId, quadrant: true,
                src: uris[n.dataset.elementId] || '(no esta en el contrato)', s: q(n) });
  const stock = document.getElementById('stock-video');
  rows.push({ element: 'stockPlayer', quadrant: false,
              src: 'content/primary/con-daterange.m3u8 (el player de fabrica)', s: q(stock) });
  return rows;
}
"""

MEASURE = """
() => {
  const { video, provider, renderer } = window.demo;
  const layer = document.getElementById('ads');
  const area = layer.getBoundingClientRect();
  const active = provider.activeAt(video.currentTime);
  const r6 = (v) => +v.toFixed(6);
  const out = { time: +video.currentTime.toFixed(3),
                playerArea: { w: +area.width.toFixed(2), h: +area.height.toFixed(2),
                              aspecto: +(area.width / area.height).toFixed(4) },
                fillMode: renderer.FILL_MODE, elements: [] };
  for (const exp of active) {
    out.type = exp.type; out.id = exp.id;
    out.window = [ +exp.startTime.toFixed(2), +(exp.startTime + exp.duration).toFixed(2) ];
    for (const el of exp.elements) {
      // La caja esperada: regla 1 del contrato, recalculada ACA a partir de los
      // porcentajes y no preguntada al renderizador.
      const left = area.width * el.box.left / 100;
      const top = area.height * el.box.top / 100;
      const esperado = { left, top,
        width: area.width - left - area.width * el.box.right / 100,
        height: area.height - top - area.height * el.box.bottom / 100 };
      const node = el.primary ? video : layer.querySelector(`.ad[data-element-id="${el.id}"]`);
      const r = node ? node.getBoundingClientRect() : null;
      const got = r ? { left: r.left - area.left, top: r.top - area.top, width: r.width, height: r.height } : null;
      const delta = got ? Math.max(Math.abs(got.left - esperado.left), Math.abs(got.top - esperado.top),
                                   Math.abs(got.width - esperado.width), Math.abs(got.height - esperado.height)) : null;
      const cs = node ? getComputedStyle(node) : null;
      const src = node ? { w: node.videoWidth, h: node.videoHeight } : null;

      // El llenado, con la cuenta del ADR 0013 sobre la caja dibujada.
      let llenado = null;
      if (src && src.w && src.h && got) {
        const aspectoFuente = src.w / src.h;
        const aspectoCaja = got.width / got.height;
        const escala = Math.max(got.width / src.w, got.height / src.h);   // cover
        const visible = { w: Math.min(src.w, got.width / escala), h: Math.min(src.h, got.height / escala) };
        llenado = {
          aspectoFuente: +aspectoFuente.toFixed(4),
          aspectoCaja: +aspectoCaja.toFixed(4),
          fuentePx: { w: +src.w.toFixed(0), h: +src.h.toFixed(0) },
          visibleDeLaFuentePx: { w: +visible.w.toFixed(1), h: +visible.h.toFixed(1) },
          recortePorCiento: +((1 - (visible.w * visible.h) / (src.w * src.h)) * 100).toFixed(2),
          ejeRecortado: aspectoCaja > aspectoFuente ? 'vertical' : (aspectoCaja < aspectoFuente ? 'horizontal' : 'ninguno'),
          estiramientoSiFillPorCiento: +(Math.abs(aspectoCaja / aspectoFuente - 1) * 100).toFixed(1)
        };
      }
      out.elements.push({
        element: el.id, primary: el.primary, zDepth: el.zDepth, box: el.box,
        uri: el.uri, mediaType: el.mediaType, volume: el.volume,
        esperadoPx: Object.fromEntries(Object.entries(esperado).map(([k,v]) => [k, r6(v)])),
        medidoPx: got && Object.fromEntries(Object.entries(got).map(([k,v]) => [k, r6(v)])),
        deltaMaxPx: delta === null ? null : +delta.toFixed(6),
        objectFit: cs && cs.objectFit,
        zIndex: cs && cs.zIndex,
        position: cs && cs.position,
        transform: cs && cs.transform,
        llenado,
        video: node ? { readyState: node.readyState, paused: node.paused,
                        currentTime: +node.currentTime.toFixed(2), muted: node.muted,
                        w: node.videoWidth, h: node.videoHeight } : null
      });
    }
  }
  return out;
}
"""

ESTADO_AUDIO = """
() => {
  const els = [['primaryContent', document.getElementById('video')],
               ['stockPlayer', document.getElementById('stock-video')]];
  for (const n of document.querySelectorAll('#ads .ad')) els.push([n.dataset.elementId, n]);
  const out = { adAudioOn: window.demo.renderer.adAudioOn,
                boton: { text: document.getElementById('ad-audio').textContent.trim(),
                         disabled: document.getElementById('ad-audio').disabled },
                elementos: {} };
  for (const [id, v] of els)
    out.elementos[id] = { muted: v.muted, volume: v.volume, paused: v.paused,
                          currentTime: +v.currentTime.toFixed(2),
                          audioBytes: v.webkitAudioDecodedByteCount ?? null,
                          audioTracks: v.audioTracks ? v.audioTracks.length : null };
  return out;
}
"""

MON = default_monitor()

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    ctx = b.contexts[0]
    pg = ctx.new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda m: console.append({"type": m.type, "text": m.text[:400]}))
        pg.on("response", lambda r: reqs.append({"resp": r.url, "status": r.status,
                                                 "ct": r.headers.get("content-type")}))
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)

        # ---------- 1. los cuatro cuadrantes a la vez, SIN SEEK ----------
        # La pagina llega a los 20 s sola. Son 20 s de espera y valen la pena:
        # el numero no queda apoyado en un seek que calento el buffer.
        pg.wait_for_function("window.demo.video.currentTime >= 19.5", timeout=60000)
        pg.wait_for_function("""(() => {
          const a = [...document.querySelectorAll('#ads .ad')];
          return a.length === 3 && a.every(v => v.readyState >= 2 && !v.paused && v.currentTime > 0.2);
        })()""", timeout=30000)
        res["al_entrar_sin_seek"] = pg.evaluate("""() => ({
          time: +window.demo.video.currentTime.toFixed(2),
          cuadrantes: [...document.querySelectorAll('#ads .ad')].map(v => ({
            id: v.dataset.elementId, currentTime: +v.currentTime.toFixed(2), paused: v.paused,
            readyState: v.readyState, muted: v.muted, w: v.videoWidth, h: v.videoHeight })),
          videosEnLaPestana: document.querySelectorAll('video').length,
          contract: document.getElementById('contract').textContent,
          paneDemo: document.getElementById('pane-demo').dataset.state,
          paneStock: document.getElementById('pane-stock').dataset.state
        })""")
        print("ENTRADA", json.dumps(res["al_entrar_sin_seek"]), flush=True)

        # La serie de la T-01: dos muestras y la resta, contra el reloj de pared.
        s0 = pg.evaluate(SNAP)
        t0 = time.monotonic()
        time.sleep(9.0)
        s1 = pg.evaluate(SNAP)
        dt = time.monotonic() - t0
        by0 = {r["element"]: r["s"] for r in s0}
        per = []
        for i, r in enumerate(s1):
            a = by0.get(r["element"])
            if a is None:
                continue
            s = r["s"]
            adv = s["t"] - a["t"]
            dec = s["total"] - a["total"]
            drop = s["dropped"] - a["dropped"]
            per.append({
                "i": i, "element": r["element"], "cuadrante": r["quadrant"], "src": r["src"],
                "size": f'{s["w"]}x{s["h"]}',
                "advancedSeconds": round(adv, 3), "rateVsWall": round(adv / dt, 3),
                "framesDecoded": dec, "fps": round(dec / dt, 1),
                "dropped": drop, "droppedPorCiento": round(100.0 * drop / dec, 2) if dec else None,
                "corrupted": s["corrupted"] - a["corrupted"],
                "readyState": s["rs"], "paused": s["paused"]
            })
        res["concurrencia"] = {
            "comoSeEntro": "sin seek: la pagina llego a los 20 s reproduciendo",
            "n": len(per), "cuadrantes": sum(1 for x in per if x["cuadrante"]),
            "wallSeconds": round(dt, 2), "per": per,
            "errors": [c for c in console if c["type"] == "error"],
            "visibility": pg.evaluate("({vis: document.visibilityState, focus: document.hasFocus()})"),
            "chrome": pg.evaluate("navigator.userAgent"),
            "hlsjs": pg.evaluate("Hls.version"),
            "videosEnLaPestana": pg.evaluate("document.querySelectorAll('video').length")
        }
        print("CONC", json.dumps(res["concurrencia"]["per"], indent=1), flush=True)

        # ---------- 2 y 3. la geometria y el llenado, con capturas ----------
        # Volver al medio del aviso: los assets arrancan con un fundido desde
        # negro, y un cuadrante negro no dice nada en camara (nota de la T-10).
        pg.evaluate("() => { window.demo.video.currentTime = 27.0; }")
        pg.wait_for_function("""(() => {
          const a = [...document.querySelectorAll('#ads .ad')];
          return a.length === 3 && a.every(v => v.readyState >= 2 && !v.paused && v.currentTime > 6.0);
        })()""", timeout=30000)
        time.sleep(1.0)
        res["geometria"] = pg.evaluate(MEASURE)
        print("GEOM deltas", [e["deltaMaxPx"] for e in res["geometria"]["elements"]], flush=True)

        pg.locator("#player").screenshot(path=str(OUT / "t11-multiView-player.png"))
        pg.locator(".pair").screenshot(path=str(OUT / "t11-el-par-con-el-multiview.png"))
        pg.screenshot(path=str(OUT / "t11-la-pagina-entera.png"), full_page=True)

        # ---------- la caja despues de un resize ----------
        pg.set_viewport_size({"width": 1000, "height": 800})
        time.sleep(0.8)
        res["geometria_resize"] = pg.evaluate(MEASURE)
        print("GEOM resize deltas", [e["deltaMaxPx"] for e in res["geometria_resize"]["elements"]], flush=True)
        pg.set_viewport_size({"width": 1600, "height": 1000})
        time.sleep(0.8)

        # ---------- 4. el audio, con tres avisos a la vez ----------
        pasos = []

        def paso(nombre):
            pg.evaluate("() => { window.demo.video.currentTime = 21.0; }")
            pg.wait_for_function("""(() => {
              const a = [...document.querySelectorAll('#ads .ad')];
              return a.length === 3 && a.every(v => v.readyState >= 2 && !v.paused);
            })()""", timeout=30000)
            time.sleep(1.2)
            estado = pg.evaluate(ESTADO_AUDIO)
            streams = chrome_streams()
            nivel = output_level(MON)
            # Los bytes de audio de un segundo, por elemento: dice quien
            # decodifica, no quien se escucha.
            a1 = pg.evaluate(ESTADO_AUDIO)
            time.sleep(1.0)
            a2 = pg.evaluate(ESTADO_AUDIO)
            bytes_seg = {}
            for k, v in a2["elementos"].items():
                if v["audioBytes"] is not None and a1["elementos"][k]["audioBytes"] is not None:
                    bytes_seg[k] = v["audioBytes"] - a1["elementos"][k]["audioBytes"]
            pasos.append({"paso": nombre, "estado": estado,
                          "streamsDeChrome": streams, "nivelDeLaSalida": nivel,
                          "bytesDeAudioEnUnSegundo": bytes_seg})
            print("AUDIO", nombre, json.dumps({"muted": {k: v["muted"] for k, v in estado["elementos"].items()},
                                               "streams": len([s for s in streams if str(s).startswith("Sink Input")]),
                                               "nivel": nivel, "bytesSeg": bytes_seg}), flush=True)

        paso("1-como-arranca-la-pagina-todo-en-silencio")
        # Un click real, que es lo que la politica de autoplay pide y lo que la
        # T-07 uso: el gesto habilita despues desmutear el primario por JS.
        pg.locator("#ad-audio").click()
        paso("2-los-tres-avisos-con-audio-el-primario-todavia-muteado")
        pg.locator("#ad-audio").click()
        pg.evaluate("() => { document.getElementById('video').muted = false; }")
        paso("3-el-estado-del-ADR-0010-primario-con-audio-y-los-tres-avisos-en-silencio")
        pg.locator("#ad-audio").click()
        paso("4-los-cuatro-con-audio")
        pg.locator("#ad-audio").click()
        pg.evaluate("() => { document.getElementById('video').muted = true; }")
        res["audio"] = {"monitor": MON, "pasos": pasos}
        pg.locator("#player").screenshot(path=str(OUT / "t11-audio-los-tres-avisos.png"))

        # ---------- fuera de la ventana: los cuatro cuadrantes se deshacen ----------
        pg.evaluate("() => { window.demo.video.currentTime = 40; }")
        pg.wait_for_function("window.demo.provider.activeAt(window.demo.video.currentTime).length === 0", timeout=20000)
        time.sleep(0.8)
        res["despues_de_la_ventana"] = pg.evaluate("""() => {
          const v = document.getElementById('video');
          const r = v.getBoundingClientRect(), a = document.getElementById('ads').getBoundingClientRect();
          return { avisos: document.querySelectorAll('#ads .ad').length,
                   videosEnLaPestana: document.querySelectorAll('video').length,
                   primaryStyle: v.getAttribute('style'),
                   primaryTransform: getComputedStyle(v).transform,
                   primarioPx: { w: +r.width.toFixed(2), h: +r.height.toFixed(2) },
                   areaPx: { w: +a.width.toFixed(2), h: +a.height.toFixed(2) },
                   contract: document.getElementById('contract').textContent };
        }""")
        pg.locator("#player").screenshot(path=str(OUT / "t11-despues-del-aviso.png"))
    finally:
        pg.close()

res["red"] = reqs
res["consola"] = console
(OUT / "t11-medicion.json").write_text(json.dumps(res, indent=2))
print("WROTE", OUT / "t11-medicion.json")
