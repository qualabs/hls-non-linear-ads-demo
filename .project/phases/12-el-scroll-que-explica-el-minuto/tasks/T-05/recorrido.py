"""El recorrido guiado de `demo/hydration-break`, mirado de punta a punta y no a saltos.

Qué mide, y contra qué:

  1  LA APERTURA. Las cuatro frases de `story/story.json` están en el panel, y el
     scroll de la sección mueve `--t` de 0 a 1 hasta que la sección se marca
     `data-done`. Se compara el texto del DOM contra el JSON servido.

  2  EL ARRANQUE POR VIEWPORT, CON SU REFERENCIA. Primero se espera con el player
     abajo del pliegue y se comprueba que NO arranca (el caso que tiene que dar lo
     contrario); recién despues se lo trae a pantalla y se comprueba que arranca.
     Sin la primera mitad, la segunda pasa aunque el umbral no haga nada.

  3  LAS SEIS PLACAS. Muestreo cada 100 ms de: `currentTime`, la placa visible y su
     texto, si el video está pausado, el rótulo del botón, `body[data-story]`, la
     línea de estado, y qué pliegue está marcado. De ahí salen, por placa: en qué
     segundo del programa apareció, cuánto duró en pantalla, y si el programa
     estuvo quieto mientras la placa estaba arriba.

  4  EL BOTÓN. Su rótulo durante el recorrido y el que queda al terminar.

  5  EL REINICIO. Un clic vuelve el programa a cero y repite la primera placa.

Salida: JSON por stdout y capturas en el directorio de salida.
"""
import json, sys, tempfile, time, urllib.request
from playwright.sync_api import sync_playwright

OUT = sys.argv[1]
URL = sys.argv[2]

story = json.load(urllib.request.urlopen(URL.rsplit('/', 1)[0] + '/story/story.json'))
r = {"url": URL, "story_opening": story["opening"],
     "story_beats": [{"id": b["id"], "text": b["text"], "hold": b["hold"]} for b in story["beats"]]}

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        tempfile.mkdtemp(dir="/dev/shm", prefix="chrome-t05-"),
        channel="chrome", headless=True, viewport={"width": 1280, "height": 800},
        args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"])
    page = ctx.new_page()
    errs = []
    page.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    page.on("console", lambda m: errs.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)

    page.goto(URL, wait_until="load")
    page.wait_for_timeout(2000)

    # ---- 1. la apertura -------------------------------------------------------
    r["apertura_lineas_dom"] = page.eval_on_selector_all(
        ".opening__line", "els => els.map(e => e.textContent.replace(/\\u2060/g, ''))")
    r["apertura_coincide_con_json"] = r["apertura_lineas_dom"] == story["opening"]
    page.screenshot(path=f"{OUT}/apertura-0.png")
    sec = "document.getElementById('opening')"
    r["apertura_t"] = []
    alto = page.evaluate(f"{sec}.getBoundingClientRect().height")
    for frac in (0.0, 0.25, 0.5, 0.75, 1.0):
        page.evaluate(f"window.scrollTo(0, {alto} * {frac})")
        page.wait_for_timeout(400)
        r["apertura_t"].append({
            "scroll": round(alto * frac),
            "t": page.evaluate(f"getComputedStyle({sec}).getPropertyValue('--t').trim()"),
            "done": page.evaluate(f"{sec}.dataset.done !== undefined"),
            "frase_encendida": page.evaluate(
                "Array.from(document.querySelectorAll('.opening__line'))"
                ".map(e => getComputedStyle(e).opacity).map(Number)")
        })
        if frac in (0.5, 1.0):
            page.screenshot(path=f"{OUT}/apertura-{int(frac*100)}.png")

    # ---- 2. el arranque por viewport, con su referencia ------------------------
    # La referencia: con el player abajo del pliegue el recorrido NO arranca.
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(3000)
    r["con_player_abajo_del_pliegue"] = {
        "visible_del_player": page.evaluate(
            "(() => { const b = document.getElementById('player').getBoundingClientRect();"
            " const alto = Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));"
            " return +(alto / b.height).toFixed(3); })()"),
        "placa_visible": page.evaluate("!document.getElementById('card').hidden"),
        "data_story": page.evaluate("document.body.dataset.story ?? null"),
        "currentTime": page.evaluate("document.getElementById('video').currentTime"),
    }

    # Y ahora sí: la imagen en pantalla.
    page.evaluate("document.getElementById('player').scrollIntoView({block:'center'})")
    t0 = time.time()
    page.wait_for_selector("#card:not([hidden])", timeout=20000)
    r["con_el_player_en_pantalla"] = {
        "visible_del_player": page.evaluate(
            "(() => { const b = document.getElementById('player').getBoundingClientRect();"
            " const alto = Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));"
            " return +(alto / b.height).toFixed(3); })()"),
        "segundos_hasta_la_primera_placa": round(time.time() - t0, 2),
        "data_story": page.evaluate("document.body.dataset.story ?? null"),
    }

    # ---- 3. las placas, muestreadas hasta que el recorrido termina -------------
    LEER = """() => {
      const card = document.getElementById('card');
      const video = document.getElementById('video');
      const marcada = document.querySelector('.asset[data-live], .asset[data-on], .asset--live, details[data-live]');
      return {
        t: +video.currentTime.toFixed(2),
        paused: video.paused,
        placa: card.hidden ? null : card.textContent,
        boton: document.getElementById('skip').textContent.trim(),
        story: document.body.dataset.story ?? null,
        estado: document.getElementById('state').textContent,
        marca: marcada ? marcada.querySelector('summary')?.textContent.trim() ?? marcada.textContent.trim().slice(0,80) : null,
        fichas: document.querySelectorAll('#shapes .shape').length || document.querySelectorAll('#shapes > *').length,
        pliegues: document.querySelectorAll('#assets details').length,
        abiertos: Array.from(document.querySelectorAll('#assets details')).map(d => d.open)
      };
    }"""
    muestras = []
    placas = []
    actual = None
    arranque_wall = time.time()
    cap = 0
    while time.time() - arranque_wall < 240:
        m = page.evaluate(LEER)
        m["wall"] = round(time.time() - arranque_wall, 2)
        muestras.append(m)
        if m["placa"] != actual:
            if m["placa"] is not None:
                placas.append({"texto": m["placa"], "aparece_en_t": m["t"], "wall_desde": m["wall"],
                               "boton": m["boton"], "paused_al_aparecer": m["paused"]})
                cap += 1
                page.wait_for_timeout(150)
                page.screenshot(path=f"{OUT}/placa-{cap}.png")
            elif placas:
                placas[-1]["desaparece_en_t"] = m["t"]
                placas[-1]["segundos_en_pantalla"] = round(m["wall"] - placas[-1]["wall_desde"], 2)
                placas[-1]["programa_avanzo_mientras_estuvo"] = round(
                    m["t"] - placas[-1]["aparece_en_t"], 2)
            actual = m["placa"]
        if m["story"] == "done":
            break
        page.wait_for_timeout(100)

    r["placas"] = placas
    r["muestras_totales"] = len(muestras)
    r["boton_durante"] = sorted({m["boton"] for m in muestras if m["story"] == "running"})
    page.wait_for_timeout(1500)
    r["al_terminar"] = page.evaluate(LEER)
    page.screenshot(path=f"{OUT}/al-terminar.png")

    # el programa sigue corriendo cuando el recorrido terminó
    t_a = page.evaluate("document.getElementById('video').currentTime")
    page.wait_for_timeout(2000)
    t_b = page.evaluate("document.getElementById('video').currentTime")
    r["el_programa_sigue_solo"] = {"antes": round(t_a, 2), "dos_segundos_despues": round(t_b, 2),
                                  "avanzo": round(t_b - t_a, 2)}

    # ---- 4/5. el botón que reinicia -------------------------------------------
    r["boton_al_terminar"] = page.inner_text("#skip")
    page.click("#skip")
    page.wait_for_selector("#card:not([hidden])", timeout=20000)
    r["reinicio"] = {
        "placa": page.inner_text("#card"),
        "currentTime": round(page.evaluate("document.getElementById('video').currentTime"), 2),
        "data_story": page.evaluate("document.body.dataset.story ?? null"),
        "boton": page.inner_text("#skip"),
    }
    page.screenshot(path=f"{OUT}/reinicio.png")

    # la salida por el botón a mitad de recorrido
    page.click("#skip")
    page.wait_for_function("document.body.dataset.story === 'done'", timeout=15000)
    page.wait_for_timeout(800)
    r["salida_por_el_boton"] = {
        "data_story": page.evaluate("document.body.dataset.story ?? null"),
        "boton": page.inner_text("#skip"),
        "placa_visible": page.evaluate("!document.getElementById('card').hidden"),
    }

    r["errores"] = errs
    ctx.close()

json.dump(r, open(f"{OUT}/recorrido.json", "w"), indent=2, ensure_ascii=False)
print(json.dumps(r, indent=2, ensure_ascii=False))
