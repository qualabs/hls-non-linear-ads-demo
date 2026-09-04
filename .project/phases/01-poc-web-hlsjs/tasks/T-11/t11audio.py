"""T-11 -- el audio del ADR 0010 con tres avisos a la vez, medido aparte.

La corrida principal dejo la captura del monitor del sink en cero muestras en
los cuatro estados, incluido el estado en que NADA sonaba, y eso no coincide con
la T-07, que en el estado silencioso habia grabado 32000 muestras de silencio
exacto. Asi que este paso vuelve sobre lo mismo con el instrumento a la vista:
el codigo de salida y el stderr de `parec`, el estado del sink, y la lista de
streams tal como la imprime `pactl`.
"""
import sys, json, time, pathlib, subprocess, array, math
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

MON = subprocess.run(["pactl", "get-default-sink"], capture_output=True, text=True).stdout.strip() + ".monitor"

def sink_state():
    """El estado de cada sink. En `pactl list sinks` el `State:` viene ANTES del
    `Name:` dentro de cada bloque, asi que el bloque se cierra en el `Sink #`
    siguiente y no en el campo que aparece primero."""
    out = subprocess.run(["pactl", "list", "sinks"], capture_output=True, text=True, timeout=5).stdout
    estados, bloque = {}, {}
    def cerrar():
        if bloque.get("name"):
            estados[bloque["name"]] = bloque.get("state")
        bloque.clear()
    for line in out.splitlines():
        s = line.strip()
        if s.startswith("Sink #"):
            cerrar()
        elif s.startswith("State:"):
            bloque["state"] = s.split(None, 1)[1]
        elif s.startswith("Name:") and "name" not in bloque:
            bloque["name"] = s.split(None, 1)[1]
    cerrar()
    return estados

def sink_inputs():
    out = subprocess.run(["pactl", "list", "sink-inputs"], capture_output=True, text=True, timeout=5).stdout
    return [l.strip() for l in out.splitlines()
            if l.strip().startswith(("Sink Input #", "Sink:", "Mute:", "Corked:",
                                     "application.name =", "media.name ="))]

def output_level(seconds=2):
    r = subprocess.run(
        ["bash", "-c", f"timeout {seconds} parec --format=s16le --rate=16000 --channels=1 -d {MON} --raw"],
        capture_output=True, timeout=seconds + 6)
    a = array.array("h"); a.frombytes(r.stdout[:len(r.stdout) // 2 * 2])
    o = {"returncode": r.returncode, "stderr": r.stderr.decode()[:300],
         "bytes": len(r.stdout), "muestras": len(a)}
    if len(a):
        o["rms"] = round(math.sqrt(sum(x * x for x in a) / len(a)) / 32768, 6)
        o["peak"] = round(max(abs(x) for x in a) / 32768, 6)
    return o

ESTADO = """
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
                          audioBytes: v.webkitAudioDecodedByteCount ?? null };
  return out;
}
"""

res = {"monitor": MON, "pasos": []}

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        # Antes de abrir la pagina: el piso de la medicion, con la pestana sin
        # existir todavia. Si aca hay muestras y despues no, el que las tapa es
        # el browser sonando y no el instrumento.
        res["antes_de_abrir_la_pagina"] = {"sinks": sink_state(), "streams": sink_inputs(),
                                           "nivel": output_level()}
        pg.goto(URL, wait_until="load")
        pg.bring_to_front()
        pg.wait_for_function("!!(window.demo && window.demo.renderer)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)

        def paso(nombre):
            pg.evaluate("() => { window.demo.video.currentTime = 21.0; }")
            pg.wait_for_function("""(() => {
              const a = [...document.querySelectorAll('#ads .ad')];
              return a.length === 3 && a.every(v => v.readyState >= 2 && !v.paused);
            })()""", timeout=30000)
            time.sleep(1.2)
            a1 = pg.evaluate(ESTADO)
            sinks_antes = sink_state()
            streams = sink_inputs()
            nivel = output_level()
            a2 = pg.evaluate(ESTADO)
            bytes_seg = {k: a2["elementos"][k]["audioBytes"] - a1["elementos"][k]["audioBytes"]
                         for k in a2["elementos"]
                         if a2["elementos"][k]["audioBytes"] is not None}
            res["pasos"].append({"paso": nombre, "estado": a2, "sinks": sinks_antes,
                                 "streamsDeChrome": streams, "nivelDeLaSalida": nivel,
                                 "bytesDeAudioEnLosDosSegundosDeLaCaptura": bytes_seg})
            print(nombre, json.dumps({"muted": {k: v["muted"] for k, v in a2["elementos"].items()},
                                      "streams": len([s for s in streams if s.startswith("Sink Input")]),
                                      "sinks": sinks_antes, "nivel": nivel}), flush=True)

        paso("1-como-arranca-la-pagina-todo-en-silencio")
        pg.locator("#ad-audio").click()
        paso("2-los-tres-avisos-con-audio-el-primario-todavia-muteado")
        pg.locator("#ad-audio").click()
        pg.evaluate("() => { document.getElementById('video').muted = false; }")
        paso("3-el-estado-del-ADR-0010-primario-con-audio-y-los-tres-avisos-en-silencio")
        pg.locator("#ad-audio").click()
        paso("4-los-cuatro-con-audio")
        pg.locator("#ad-audio").click()
        pg.evaluate("() => { document.getElementById('video').muted = true; }")
        pg.locator("#player").screenshot(path=str(OUT / "t11-audio-los-tres-avisos.png"))
    finally:
        pg.close()

    time.sleep(3)
    res["despues_de_cerrar_la_pagina"] = {"sinks": sink_state(), "streams": sink_inputs(),
                                          "nivel": output_level()}

(OUT / "t11-audio.json").write_text(json.dumps(res, indent=2))
print("WROTE", OUT / "t11-audio.json")
