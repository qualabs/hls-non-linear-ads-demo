"""T-08 -- el anuncio: la corrida mirada, con sus lecturas.

Lo que se verifica es de dos clases y se miran las dos en la misma corrida:

  1. LO QUE SE VE, que son las capturas, al tamano real de uso (960x540, el
     recorte es el player y no la pagina). Nicolas las mira.
  2. LO QUE PUEDE FALLAR EN SILENCIO: que el toque sobre el popup llegue al
     primario -- con su control, que es el mismo toque con el popup tomando
     punteros --, y que el popup no sea una pieza del cromo, que se mide
     dejando que el cromo se vaya solo y leyendo el popup despues.

El punto se lee del PSEUDO-ELEMENTO y no de la clase que lo enciende: la clase
es lo que este cambio escribe, y lo que se ve es la regla.

Y toda captura espera al valor asentado: el cromo se apaga con una transicion
de 180 ms y el popup con otra, asi que una captura disparada apenas cambia una
clase fotografia algo que ya no es verdad.

Uso:  python3 t08run.py <carpeta-de-salida> [url]
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
URL = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:8108/"

ASENTARSE_MS = 700    # PRIMARY_MOVE_MS es 380: una captura antes de eso miente
FUNDIDO_MS = 320      # las dos transiciones del anuncio son de 180 ms
VERDE = "rgb(51, 204, 102)"   # RANGE_COLOURS.multiview, escrito aca a proposito

fallas = []
hechos = []


def chequear(ok, texto):
    print(("   OK   " if ok else "   FALLA") + "  " + texto)
    hechos.append(texto)
    if not ok:
        fallas.append(texto)


def capturar(page, nombre):
    page.locator("#stage").screenshot(path=str(OUT / nombre))
    return nombre


with sync_playwright() as p:
    # El Chrome del sistema: el Chromium de Playwright no resuelve fuentes aca.
    navegador = p.chromium.launch(channel="chrome", headless=True,
                                  args=["--autoplay-policy=no-user-gesture-required"])
    page = navegador.new_page(viewport={"width": 1024, "height": 640}, device_scale_factor=2)
    lecturas = {}

    page.goto(URL)
    page.wait_for_function("() => window.__t08 !== undefined")
    page.wait_for_function("() => document.getElementById('v').readyState >= 2", timeout=20000)
    page.wait_for_function("() => window.__t08.estado().pausado === false", timeout=10000)

    stage = page.locator("#stage")
    caja = stage.bounding_box()
    neutro = (caja["x"] + 80, caja["y"] + caja["height"] * 0.55)

    # ---- A. SIN OFERTA, que es el control de todo lo de abajo -------------
    print("\n== A. sin oferta: la referencia")
    page.mouse.move(*neutro)
    page.mouse.move(neutro[0] + 4, neutro[1])
    page.wait_for_timeout(FUNDIDO_MS)
    estado = page.evaluate("() => window.__t08.estado()")
    lecturas["A-sin-oferta"] = estado
    chequear(not estado["ventanaAbierta"], "no hay ventana de multi view en el segundo %.1f" % estado["t"])
    chequear(estado["cromo"]["arriba"], "el cromo esta arriba, asi que el boton se veria si existiera")
    chequear(estado["boton"]["oculto"], "el boton del selector no esta")
    chequear(estado["punto"]["content"] == "none", "no hay punto: content es %r" % estado["punto"]["content"])
    chequear(estado["popup"]["opacidad"] == "0" and estado["popup"]["texto"] == "",
             "no hay popup: opacidad %s y sin texto" % estado["popup"]["opacidad"])
    capturar(page, "t08-1-sin-oferta.png")

    # ---- B. LA VENTANA SE ABRE -------------------------------------------
    print("\n== B. la ventana se abre: el popup y el punto")
    page.evaluate("() => { document.getElementById('v').currentTime = 8; }")
    page.wait_for_function("() => window.__t08.estado().ventanaAbierta === true", timeout=10000)
    page.evaluate("() => window.__marca('la ventana abrio')")
    page.mouse.move(neutro[0] + 8, neutro[1])
    page.wait_for_function("() => window.__t08.estado().popup.opacidad === '1'", timeout=3000)
    estado = page.evaluate("() => window.__t08.estado()")
    lecturas["B-la-ventana-abierta"] = estado
    pop = estado["popup"]
    chequear(pop["clase"] and pop["opacidad"] == "1", "el popup esta arriba, opacidad %s" % pop["opacidad"])
    chequear(pop["visible"], "y se ve de verdad, contando a sus ancestros: checkVisibility %s" % pop["visible"])
    chequear(pop["padre"] == "player", "cuelga del player y no del cromo: su padre es %r" % pop["padre"])
    chequear(pop["texto"] == "Multi view available", "lo que dice: %r" % pop["texto"])
    chequear(pop["rol"] == "status", "es una region viva: role=%r" % pop["rol"])
    chequear(pop["pointerEvents"] == "none", "no toma punteros: pointer-events %s" % pop["pointerEvents"])
    chequear(not estado["boton"]["oculto"], "el boton del selector aparecio con la ventana")
    punto = estado["punto"]
    chequear(punto["content"] != "none" and punto["clase"],
             "el punto esta sobre el boton: content %r, %s" % (punto["content"], punto["ancho"]))
    chequear(punto["color"] == VERDE, "y es el verde con el que la barra marca esta ventana: %s" % punto["color"])
    chequear(len(estado["cajas"]) == 1, "una sola caja: el programa como venia")
    capturar(page, "t08-2-el-popup-y-el-punto.png")

    # ---- C. EL TOQUE ATRAVIESA -------------------------------------------
    print("\n== C. un toque sobre el popup llega al primario")
    centro = page.evaluate("() => window.__t08.centroDelPopup()")
    debajo = page.evaluate("() => window.__t08.quienEstaAbajo()")
    chequear(debajo == "v", "quien recibe el toque en el centro del popup: %r" % debajo)
    page.evaluate("() => window.__t08.limpiarToques()")
    page.mouse.click(centro["x"], centro["y"])
    page.wait_for_timeout(120)
    toques = page.evaluate("() => window.__t08.toques")
    lecturas["C-el-toque-atraviesa"] = {"debajo": debajo, "toques": toques, "centro": centro}
    chequear(len(toques) == 1 and toques[0]["en"] == "primario",
             "el toque de verdad llego al primario: %s" % toques)

    # EL CONTROL: el mismo toque, con el popup tomando punteros. Sin esto el
    # chequeo de arriba pasa aunque el popup no este en ese punto.
    pe = page.evaluate("() => window.__t08.conPunteros(true)")
    debajo_ctl = page.evaluate("() => window.__t08.quienEstaAbajo()")
    page.evaluate("() => window.__t08.limpiarToques()")
    page.mouse.click(centro["x"], centro["y"])
    page.wait_for_timeout(120)
    toques_ctl = page.evaluate("() => window.__t08.toques")
    lecturas["C-el-control"] = {"pointerEvents": pe, "debajo": debajo_ctl, "toques": toques_ctl}
    chequear(debajo_ctl == "qa-announce qa-announce--on",
             "CONTROL: con punteros, quien recibe es el popup: %r" % debajo_ctl)
    chequear(all(t["en"] != "primario" for t in toques_ctl) and len(toques_ctl) == 1,
             "CONTROL: y el primario NO recibe nada: %s" % toques_ctl)
    page.evaluate("() => window.__t08.conPunteros(false)")
    chequear(page.evaluate("() => window.__t08.quienEstaAbajo()") == "v",
             "devuelto a como estaba, el toque vuelve a atravesar")

    # ---- D. EL POPUP SE VA SOLO Y EL PUNTO SE QUEDA ----------------------
    print("\n== D. el popup se va solo, el punto se queda")
    page.wait_for_function("() => window.__t08.estado().popup.opacidad === '0'", timeout=9000)
    page.mouse.move(neutro[0] + 12, neutro[1])
    page.wait_for_timeout(FUNDIDO_MS)
    estado = page.evaluate("() => window.__t08.estado()")
    lecturas["D-el-popup-se-fue"] = estado
    chequear(not estado["popup"]["clase"] and estado["popup"]["opacidad"] == "0", "el popup se fue solo")
    chequear(not estado["popup"]["visible"], "y no se ve: checkVisibility %s" % estado["popup"]["visible"])
    chequear(estado["popup"]["texto"] == "", "y la region viva quedo vacia, para que la proxima sea un cambio")
    chequear(estado["ventanaAbierta"], "la ventana sigue abierta")
    chequear(estado["punto"]["content"] != "none", "el punto sigue puesto sobre el boton")
    capturar(page, "t08-3-el-punto-sin-el-popup.png")

    # ---- E. LA PRIMERA CAMARA SE LLEVA EL PUNTO --------------------------
    print("\n== E. subir una camara se lleva el punto")
    page.locator(".qa-btn--views").click()
    page.wait_for_timeout(FUNDIDO_MS)
    page.locator(".qa-views__row").nth(1).click()
    page.wait_for_timeout(ASENTARSE_MS)
    estado = page.evaluate("() => window.__t08.estado()")
    chequear(len(estado["cajas"]) == 2, "dos cajas: la camara subio (hay %d)" % len(estado["cajas"]))
    chequear(estado["punto"]["content"] == "none" and not estado["punto"]["clase"],
             "el punto se fue con la primera camara: content %r" % estado["punto"]["content"])
    page.keyboard.press("Escape")
    page.wait_for_timeout(FUNDIDO_MS)
    estado = page.evaluate("() => window.__t08.estado()")
    lecturas["E-una-camara-arriba"] = estado
    chequear(not estado["lista"]["abierta"], "la lista se cerro con escape")
    chequear(estado["cromo"]["arriba"] and estado["punto"]["content"] == "none",
             "el boton esta a la vista y no tiene punto")
    capturar(page, "t08-4-sin-punto-con-una-camara.png")

    # Y baja de nuevo: con la grilla vacia otra vez, la senal vuelve.
    page.locator(".qa-btn--views").click()
    page.wait_for_timeout(FUNDIDO_MS)
    page.locator(".qa-views__row").nth(1).click()
    page.wait_for_timeout(ASENTARSE_MS)
    estado = page.evaluate("() => window.__t08.estado()")
    lecturas["E-la-camara-bajo"] = estado
    chequear(len(estado["cajas"]) == 1 and estado["punto"]["content"] != "none",
             "destildada la ultima, el punto vuelve: no hay ninguna camara arriba")
    page.keyboard.press("Escape")

    # ---- F. NI UNO NI OTRO SOBREVIVEN AL CIERRE DE LA VENTANA ------------
    print("\n== F. la ventana se cierra")
    page.evaluate("() => { document.getElementById('v').currentTime = 70; }")
    page.wait_for_function("() => window.__t08.estado().ventanaAbierta === false", timeout=10000)
    page.mouse.move(neutro[0] + 16, neutro[1])
    page.wait_for_timeout(FUNDIDO_MS)
    estado = page.evaluate("() => window.__t08.estado()")
    lecturas["F-la-ventana-se-cerro"] = estado
    chequear(estado["popup"]["opacidad"] == "0" and not estado["popup"]["visible"], "no hay popup")
    chequear(estado["boton"]["oculto"], "el boton se fue con la ventana")
    chequear(estado["punto"]["content"] == "none", "y no hay punto")

    # ---- G. EL POPUP NO ES UNA PIEZA DEL CROMO ---------------------------
    # La ventana se abre de nuevo, se trae el cromo con un movimiento, y no se
    # toca nada mas: el cromo se va a los 2600 ms y el popup a los 4500, asi que
    # lo que se mide es que el segundo sigue arriba despues del primero.
    print("\n== G. el cromo se va y el popup se queda")
    page.evaluate("() => { document.getElementById('v').currentTime = 8; }")
    page.wait_for_function("() => window.__t08.estado().ventanaAbierta === true", timeout=10000)
    page.mouse.move(neutro[0] + 20, neutro[1])
    page.evaluate("() => window.__marca('la ventana abrio por segunda vez')")
    page.wait_for_function("() => window.__t08.estado().popup.opacidad === '1'", timeout=3000)
    page.wait_for_function("() => window.__t08.estado().cromo.opacidad === '0'", timeout=6000)
    estado = page.evaluate("() => window.__t08.estado()")
    lecturas["G-el-cromo-se-fue-y-el-popup-no"] = estado
    chequear(not estado["cromo"]["arriba"] and estado["cromo"]["opacidad"] == "0", "el cromo se fue solo")
    chequear(estado["popup"]["visible"] and estado["popup"]["opacidad"] == "1",
             "y el popup SE SIGUE VIENDO con el cromo abajo: checkVisibility %s, opacidad %s"
             % (estado["popup"]["visible"], estado["popup"]["opacidad"]))
    capturar(page, "t08-5-el-popup-sin-cromo.png")
    page.wait_for_function("() => window.__t08.estado().popup.opacidad === '0'", timeout=9000)

    log = page.evaluate("() => window.__log")
    lecturas["log"] = log

    def ms_de(texto):
        return next((f["ms"] for f in log if f.get("marca") == texto), None)

    abrio = ms_de("la ventana abrio por segunda vez")
    cromo_abajo = next((f["ms"] for f in log
                        if f.get("quien") == "cromo" and f.get("arriba") is False and f["ms"] > abrio), None)
    popup_abajo = next((f["ms"] for f in log
                        if f.get("quien") == "popup" and f.get("arriba") is False and f["ms"] > abrio), None)
    print("   el cromo bajo a los %.1f ms de abrirse la ventana" % (cromo_abajo - abrio))
    print("   el popup bajo a los %.1f ms" % (popup_abajo - abrio))
    lecturas["G-los-tiempos"] = {"abrio": abrio, "cromo_abajo": cromo_abajo, "popup_abajo": popup_abajo,
                                 "cromo_ms": round(cromo_abajo - abrio, 1),
                                 "popup_ms": round(popup_abajo - abrio, 1)}
    chequear(popup_abajo > cromo_abajo,
             "el popup duro mas que el cromo: %.1f ms contra %.1f ms" %
             (popup_abajo - abrio, cromo_abajo - abrio))

    (OUT / "t08-la-corrida.json").write_text(json.dumps(lecturas, indent=2), encoding="utf-8")
    navegador.close()

print("\n== %d chequeos, %d fallas" % (len(hechos), len(fallas)))
if fallas:
    for f in fallas:
        print("   FALLA  " + f)
    sys.exit(1)
print("   todo verde")
