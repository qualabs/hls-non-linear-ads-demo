"""T-06 -- el cromo se puede quedar quieto: la medicion, con su control.

Lo que se mide es un COMPORTAMIENTO EN EL TIEMPO, asi que el instrumento es un
reloj y una captura: la clase de la capa la registra un MutationObserver con
`performance.now`, y lo que juzga cada lectura es esa clase mas la imagen. En
este repositorio ya hubo dos falsos "OK" por mirar estilos computados, asi que
la opacidad se anota pero no decide.

LAS DOS CORRIDAS SON LA MEDICION, y la segunda es la mitad que puede fallar:

  1. CON HOLD. Un movimiento de mouse real trae el cromo, un componente toma un
     hold, y pasan 6 s sin ninguna actividad -- mas que los 2600 ms del
     presupuesto del mouse y mas que los 5000 ms del tactil. El cromo tiene que
     seguir arriba. Despues se suelta el hold y se mide cuanto tarda en bajar,
     que es el temporizador arrancando de nuevo desde ahi.
  2. SIN HOLD, que es el control. La misma pagina, la misma espera de 6 s y el
     mismo movimiento de mouse, sin tomar nada. El cromo tiene que bajar, y el
     log dice a los cuantos ms. Sin esta corrida la primera no prueba nada: un
     cromo que se queda arriba porque el temporizador nunca se armo se ve igual
     que uno que se queda arriba por el hold.

La pagina que se mide esta en un directorio temporal y trae `lib/controls.js`
por un enlace, asi que lo que corre es el archivo vivo y no una copia.

Uso:  python3 t06run.py <carpeta-de-salida> [url]
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
URL = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8106/"

ESPERA_MS = 6000
VIEWPORT = {"width": 1280, "height": 720}


def corrida(page, con_hold):
    etiqueta = "con-hold" if con_hold else "sin-hold"
    page.goto(URL)
    page.wait_for_function("() => window.__t06 !== undefined")
    # Que el elemento este REPRODUCIENDO es la premisa de toda la medicion: el
    # temporizador solo se arma con `paused === false`.
    page.wait_for_function("() => window.__t06.estado().pausado === false")

    lectura = {"etiqueta": etiqueta, "inicial": page.evaluate("() => window.__t06.estado()")}

    # Un movimiento de mouse de verdad: el evento que llega a la pagina es
    # `isTrusted` y de `pointerType` "mouse", que es el que fija el presupuesto
    # en CONTROLS_HIDE_MS y trae el cromo.
    caja = page.locator("#box").bounding_box()
    page.mouse.move(caja["x"] + caja["width"] / 2, caja["y"] + caja["height"] / 2)
    page.mouse.move(caja["x"] + caja["width"] / 2 + 4, caja["y"] + caja["height"] / 2 + 4)
    page.evaluate("() => window.__t06.marca('el mouse se movio')")

    if con_hold:
        page.evaluate("() => { window.__t06.handle.hold('la lista'); window.__t06.marca('hold tomado'); }")

    page.wait_for_timeout(ESPERA_MS)
    page.evaluate(f"() => window.__t06.marca('pasaron {ESPERA_MS} ms sin actividad')")
    lectura["a_los_6s"] = page.evaluate("() => window.__t06.estado()")
    page.screenshot(path=str(OUT / f"t06-{etiqueta}-a-los-6s.png"))

    if con_hold:
        page.evaluate("() => { window.__t06.handle.release('la lista'); window.__t06.marca('hold soltado'); }")
        bajo = True
        try:
            page.wait_for_function("() => !window.__t06.handle.up()", timeout=8000)
            # Y ADEMAS QUE LA IMAGEN YA NO LO TENGA. La clase se va en un
            # instante y la capa se apaga en 180 ms de transicion, asi que una
            # captura sacada al sacarse la clase muestra el cromo entero y
            # miente sobre lo que se esta midiendo: paso la primera vez.
            page.wait_for_function("() => window.__t06.estado().opacidad === '0'", timeout=2000)
        except Exception:
            bajo = False
        lectura["despues_de_soltar"] = page.evaluate("() => window.__t06.estado()")
        lectura["bajo_al_soltar"] = bajo
        page.screenshot(path=str(OUT / f"t06-{etiqueta}-despues-de-soltar.png"))

    lectura["log"] = page.evaluate("() => window.__t06.log")

    # Los ms que importan, sacados del log de la pagina y no de los sleeps.
    def ms_de(texto):
        for fila in lectura["log"]:
            if fila.get("ev") == "marca" and fila.get("texto") == texto:
                return fila["ms"]
        return None

    def primera_bajada(desde):
        for fila in lectura["log"]:
            if fila.get("ev") == "clase" and fila.get("arriba") is False and fila["ms"] >= desde:
                return fila["ms"]
        return None

    t_mouse = ms_de("el mouse se movio")
    bajada = primera_bajada(t_mouse)
    lectura["desde_el_mouse"] = {
        "movimiento_ms": t_mouse,
        "bajada_ms": bajada,
        "tardanza_ms": None if bajada is None else round(bajada - t_mouse, 2)
    }
    if con_hold:
        t_soltar = ms_de("hold soltado")
        bajada_post = primera_bajada(t_soltar) if t_soltar else None
        lectura["desde_el_soltar"] = {
            "soltado_ms": t_soltar,
            "bajada_ms": bajada_post,
            "tardanza_ms": None if bajada_post is None else round(bajada_post - t_soltar, 2)
        }
    return lectura


with sync_playwright() as p:
    # El Chrome del sistema: el Chromium que trae Playwright no resuelve fuentes
    # en esta maquina y las capturas quedan sin texto.
    navegador = p.chromium.launch(channel="chrome", headless=True)
    pagina = navegador.new_page(viewport=VIEWPORT, device_scale_factor=2)
    medicion = {
        "url": URL,
        "espera_ms": ESPERA_MS,
        "viewport": VIEWPORT,
        "corridas": [corrida(pagina, True), corrida(pagina, False)]
    }
    navegador.close()

(OUT / "t06-la-medicion.json").write_text(json.dumps(medicion, indent=2, ensure_ascii=False))

for c in medicion["corridas"]:
    print(f"== {c['etiqueta']}")
    print(f"   a los {ESPERA_MS} ms: arriba={c['a_los_6s']['arriba']}  clase={c['a_los_6s']['clase']}"
          f"  opacidad={c['a_los_6s']['opacidad']}  pausado={c['a_los_6s']['pausado']}")
    d = c["desde_el_mouse"]
    print(f"   desde el movimiento del mouse: bajo a los {d['tardanza_ms']} ms" if d["tardanza_ms"] is not None
          else "   desde el movimiento del mouse: no bajo")
    if "desde_el_soltar" in c:
        s = c["desde_el_soltar"]
        print(f"   desde que se solto el hold: bajo a los {s['tardanza_ms']} ms"
              if s["tardanza_ms"] is not None else "   desde que se solto el hold: no bajo")
print(f"\n{OUT / 't06-la-medicion.json'}")
