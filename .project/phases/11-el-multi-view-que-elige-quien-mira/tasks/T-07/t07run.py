"""T-07 -- el selector: la corrida mirada, con sus lecturas.

Lo que se verifica es de dos clases y se miran las dos en la misma corrida:

  1. LO QUE SE VE, que son las capturas, al tamano real de uso (960x540, el
     recorte es el player y no la pagina). Nicolas las mira.
  2. LO QUE PUEDE FALLAR EN SILENCIO, que son las lecturas: las cajas que hay
     en pantalla y donde, contra la geometria calculada aparte en este mismo
     archivo a partir de la imagen medida del navegador; que filas estan
     deshabilitadas; y a los cuantos ms se va el cromo despues de cerrar la
     lista.

Los gestos son gestos de verdad -- `page.mouse` sobre coordenadas -- asi que lo
que corre son los listeners de la libreria y no una llamada a sus funciones.

Uso:  python3 t07run.py <carpeta-de-salida> [url]
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
URL = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8107/"

ANCHO, ALTO = 960, 540
ASENTARSE_MS = 700   # PRIMARY_MOVE_MS es 380: una captura antes de eso miente
LISTA_MS = 260       # la transicion del panel es de 140 ms
ESPERA_HOLD_MS = 6000

# Las formas del ADR 0065, copiadas del payload que la tabla emite: top right
# bottom left, en porcentaje de inset. Estan aca a mano A PROPOSITO -- si se
# leyeran de la libreria, la comparacion seria la libreria contra si misma.
FORMAS = {
    2: ["25 50 25 0", "25 0 25 50"],
    3: ["0 50 50 0", "0 0 50 50", "50 25 0 25"],
    4: ["0 50 50 0", "0 0 50 50", "50 50 0 0", "50 0 0 50"],
}

fallas = []


def chequear(ok, texto):
    print(("   OK   " if ok else "   FALLA") + "  " + texto)
    if not ok:
        fallas.append(texto)


def area_de_la_imagen(imagen):
    """La caja de la imagen dentro del contenedor, con la relacion que el
    navegador reporta: el mismo encaje que hace el renderer, escrito aparte."""
    ar = imagen["ancho"] / imagen["alto"]
    if ANCHO / ALTO > ar:
        alto, ancho = ALTO, ALTO * ar
    else:
        ancho, alto = ANCHO, ANCHO / ar
    return {"left": (ANCHO - ancho) / 2, "top": (ALTO - alto) / 2, "ancho": ancho, "alto": alto}


def caja_esperada(viewport, area):
    top, right, bottom, left = [float(v) for v in viewport.split()]
    x = area["left"] + area["ancho"] * left / 100
    y = area["top"] + area["alto"] * top / 100
    return {
        "left": round(x), "top": round(y),
        "ancho": round(area["ancho"] * (100 - left - right) / 100),
        "alto": round(area["alto"] * (100 - top - bottom) / 100),
    }


def parecidas(a, b, tol=2):
    return all(abs(a[k] - b[k]) <= tol for k in ("left", "top", "ancho", "alto"))


def capturar(page, nombre, neutro=None):
    """La captura, con el puntero fuera de la lista: un hover sobre una fila se
    lee como si esa fila estuviera elegida, y eso es la captura mintiendo."""
    if neutro:
        page.mouse.move(*neutro)
        page.wait_for_timeout(180)
    page.locator("#stage").screenshot(path=str(OUT / nombre))
    return nombre


with sync_playwright() as p:
    # El Chrome del sistema: el Chromium de Playwright no resuelve fuentes aca.
    navegador = p.chromium.launch(channel="chrome", headless=True,
                                  args=["--autoplay-policy=no-user-gesture-required"])
    page = navegador.new_page(viewport={"width": 1024, "height": 640}, device_scale_factor=2)
    lecturas = {}

    page.goto(URL)
    page.wait_for_function("() => window.__t07 !== undefined")
    page.wait_for_function("() => document.getElementById('v').readyState >= 2", timeout=20000)
    # Adentro de la ventana, que abre en el segundo 4.
    page.evaluate("() => { document.getElementById('v').currentTime = 8; }")
    page.wait_for_function("() => window.__t07.estado().ventanaAbierta === true", timeout=10000)
    page.wait_for_function("() => window.__t07.estado().pausado === false", timeout=10000)

    stage = page.locator("#stage")
    caja_stage = stage.bounding_box()
    centro = (caja_stage["x"] + caja_stage["width"] / 2, caja_stage["y"] + caja_stage["height"] * 0.42)
    neutro = (caja_stage["x"] + 70, caja_stage["y"] + caja_stage["height"] * 0.30)

    # 1. El cromo, con un movimiento de mouse de verdad, y el boton que aparece
    #    con la ventana.
    page.mouse.move(*centro)
    page.mouse.move(centro[0] + 4, centro[1] + 4)
    page.evaluate("() => window.__marca('el mouse se movio')")
    boton = page.locator(".qa-btn--views")
    estado = page.evaluate("() => window.__t07.estado()")
    lecturas["1-la-ventana-abierta"] = estado
    print("\n== 1. la ventana abierta, nada tildado")
    chequear(estado["boton"] is not None and not estado["boton"]["oculto"],
             "el boton del selector esta en la fila de arriba")
    chequear(estado["cromo"]["arriba"], "el cromo esta arriba")
    chequear(len(estado["cajas"]) == 1, "una sola caja: el programa como venia")

    # 2. La lista abierta, y el hold: 6 s sin actividad, mas que el presupuesto
    #    del mouse (2600) y que el tactil (5000).
    boton.click()
    page.evaluate("() => window.__marca('se abrio la lista')")
    page.wait_for_timeout(ESPERA_HOLD_MS)
    estado = page.evaluate("() => window.__t07.estado()")
    lecturas["2-la-lista-abierta-a-los-6s"] = estado
    print("\n== 2. la lista abierta, y seis segundos sin tocar nada")
    chequear(estado["lista"]["abierta"] and estado["lista"]["opacidad"] == "1",
             "la lista sigue abierta a los %d ms" % ESPERA_HOLD_MS)
    chequear(estado["cromo"]["arriba"], "el cromo sigue arriba: el hold esta puesto")
    filas = estado["lista"]["filas"]
    chequear(len(filas) == 6, "seis filas: el programa mas las cinco vistas (hay %d)" % len(filas))
    chequear(filas[0]["bloqueada"] and filas[0]["tildada"] == "true",
             "la primera fila es el programa, tildada y bloqueada (%s)" % filas[0]["nombre"])
    chequear(all(f["tildada"] == "false" for f in filas[1:]), "ninguna vista arranca tildada")
    chequear(all(not f["deshabilitada"] for f in filas), "con la grilla vacia no hay filas grises")
    chequear(estado["lista"]["nota"]["oculta"], "sin grilla llena no hay linea al pie")
    capturar(page, "t07-1-la-lista-abierta.png", neutro)

    # 3. Las tres formas, tildando de a una.
    imagen = area_de_la_imagen(estado["imagen"])
    print("\n== 3. tildar: las tres formas")
    print("   la imagen dentro del contenedor: %s" % imagen)
    nombres = ["t07-2-dos-cajas.png", "t07-3-tres-cajas.png", "t07-4-cuatro-cajas.png"]
    for i, nombre in enumerate(nombres):
        page.locator(".qa-views__row").nth(i + 1).click()
        page.wait_for_timeout(ASENTARSE_MS)
        estado = page.evaluate("() => window.__t07.estado()")
        n = i + 2
        lecturas["3-forma-de-%d" % n] = estado
        cajas = estado["cajas"]
        esperadas = [caja_esperada(v, imagen) for v in FORMAS[n]]
        chequear(len(cajas) == n, "%d cajas en pantalla (hay %d)" % (n, len(cajas)))
        for j, (c, e) in enumerate(zip(cajas, esperadas)):
            chequear(parecidas(c, e),
                     "caja %d en %s, esperada %s" % (j, {k: c[k] for k in ('left','top','ancho','alto')}, e))
        chequear(all(c.get("pausado") is not True for c in cajas[1:]),
                 "las vistas subidas estan reproduciendo")
        capturar(page, nombre, neutro)

    # 4. La grilla llena: las demas filas deshabilitadas, y la linea que dice
    #    por que.
    print("\n== 4. la grilla llena")
    filas = estado["lista"]["filas"]
    tildadas = [f for f in filas if f["tildada"] == "true"]
    grises = [f["nombre"] for f in filas if f["deshabilitada"]]
    chequear(len(tildadas) == 4, "cuatro filas tildadas, contando el programa (hay %d)" % len(tildadas))
    chequear(len(grises) == 2, "las dos que no estan tildadas quedan deshabilitadas: %s" % grises)
    chequear(all(not f["deshabilitada"] for f in tildadas),
             "ninguna tildada se deshabilita: la grilla llena sigue siendo destildable")
    nota = estado["lista"]["nota"]
    chequear(not nota["oculta"] and "4" in nota["texto"], "la linea al pie: %r" % nota["texto"])

    # 5. Un toque afuera: cierra la lista, y el cromo se va despues, solo.
    print("\n== 5. el toque afuera, y el cromo que se va despues")
    page.mouse.move(caja_stage["x"] + 90, caja_stage["y"] + caja_stage["height"] * 0.75)
    page.evaluate("() => window.__marca('el mouse se movio afuera de la lista')")
    page.mouse.down()
    page.mouse.up()
    page.evaluate("() => window.__marca('toque afuera')")
    page.wait_for_timeout(LISTA_MS)
    estado = page.evaluate("() => window.__t07.estado()")
    lecturas["5-despues-del-toque-afuera"] = estado
    chequear(not estado["lista"]["abierta"] and estado["lista"]["opacidad"] == "0",
             "la lista se cerro con el toque afuera")
    chequear(estado["cromo"]["arriba"], "el cromo NO se fue con la lista")
    chequear(len(estado["cajas"]) == 4, "la grilla de cuatro sigue en pantalla")
    capturar(page, "t07-5-la-grilla-sin-la-lista.png")
    # Y ahora se va solo, que es lo que hay que mirar: el presupuesto del mouse.
    page.wait_for_function("() => !window.__t07.estado().cromo.arriba", timeout=8000)
    page.wait_for_function("() => window.__t07.estado().cromo.opacidad === '0'", timeout=2000)
    estado = page.evaluate("() => window.__t07.estado()")
    lecturas["5-el-cromo-ya-se-fue"] = estado
    capturar(page, "t07-6-el-cromo-se-fue-solo.png")
    log = page.evaluate("() => window.__log")
    lecturas["log"] = log

    def ms_de(texto):
        return next((f["ms"] for f in log if f.get("marca") == texto), None)

    def bajada_desde(ms):
        return next((f["ms"] for f in log if f.get("arriba") is False and f["ms"] >= ms), None)

    t_toque = ms_de("toque afuera")
    t_bajada = bajada_desde(t_toque)
    tardanza = None if t_bajada is None else round(t_bajada - t_toque, 1)
    lecturas["5-desde-el-toque"] = {"toque_ms": t_toque, "bajada_ms": t_bajada, "tardanza_ms": tardanza}
    print("   el cromo bajo %s ms despues del toque que cerro la lista" % tardanza)
    chequear(tardanza is not None and 2400 <= tardanza <= 2900,
             "se fue a los 2,6 s del toque, como despues de cualquier otro gesto")

    # 6. Escape.
    print("\n== 6. escape")
    page.mouse.move(*centro)
    boton.click()
    page.wait_for_timeout(LISTA_MS)
    abierta = page.evaluate("() => window.__t07.estado().lista.abierta")
    page.keyboard.press("Escape")
    page.wait_for_timeout(LISTA_MS)
    estado = page.evaluate("() => window.__t07.estado()")
    lecturas["6-escape"] = estado
    chequear(abierta and not estado["lista"]["abierta"], "escape cierra la lista")
    chequear(estado["boton"]["expandido"] == "false", "el boton queda sin expandir")

    # 7. Destildar baja las cajas.
    print("\n== 7. destildar")
    boton.click()
    page.wait_for_timeout(LISTA_MS)
    page.locator(".qa-views__row").nth(3).click()
    page.wait_for_timeout(ASENTARSE_MS)
    estado = page.evaluate("() => window.__t07.estado()")
    chequear(len(estado["cajas"]) == 3, "destildar una baja a tres cajas (hay %d)" % len(estado["cajas"]))
    chequear(all(not f["deshabilitada"] for f in estado["lista"]["filas"]),
             "con una caja libre las filas vuelven a estar habilitadas")
    chequear(estado["lista"]["nota"]["oculta"], "y la linea al pie ya no esta")
    capturar(page, "t07-7-destildar-vuelve-a-tres.png", neutro)
    page.locator(".qa-views__row").nth(2).click()
    page.locator(".qa-views__row").nth(1).click()
    page.wait_for_timeout(ASENTARSE_MS)
    estado = page.evaluate("() => window.__t07.estado()")
    lecturas["7-destildadas-todas"] = estado
    chequear(len(estado["cajas"]) == 1, "destildar la ultima deja una sola caja: la salida")
    capturar(page, "t07-8-destildadas-todas.png", neutro)

    # 8. Pantalla completa: la lista es furniture y tiene que crecer con ella.
    print("\n== 8. pantalla completa")
    page.mouse.move(*centro)
    page.locator(".qa-btn--full").click()
    page.wait_for_timeout(600)
    page.mouse.move(centro[0] + 3, centro[1] + 3)
    lleno = page.evaluate("() => document.fullscreenElement !== null")
    chequear(lleno, "el contenedor se fue a pantalla completa")
    if lleno:
        page.locator(".qa-btn--views").click()
        page.wait_for_timeout(LISTA_MS)
        medidas = page.evaluate("""() => {
          const p = document.getElementsByClassName('qa-views')[0];
          const f = p.getElementsByClassName('qa-views__row')[0];
          return { panel: p.getBoundingClientRect().width, fila: f.getBoundingClientRect().height,
                   texto: getComputedStyle(f).fontSize };
        }""")
        lecturas["8-pantalla-completa"] = medidas
        print("   el panel mide %s px y una fila %s px, con el texto en %s"
              % (round(medidas["panel"]), round(medidas["fila"]), medidas["texto"]))
        chequear(medidas["texto"] == "18px", "la fila toma el token grande del cromo en pantalla completa")
        page.locator("#stage").screenshot(path=str(OUT / "t07-9-pantalla-completa.png"))
        page.keyboard.press("Escape")
        page.wait_for_timeout(500)

    navegador.close()

(OUT / "t07-la-corrida.json").write_text(json.dumps(lecturas, indent=2, ensure_ascii=False))
print("\n%d chequeo(s) fallado(s)" % len(fallas))
for f in fallas:
    print("  FALLA: " + f)
print(OUT / "t07-la-corrida.json")
sys.exit(1 if fallas else 0)
