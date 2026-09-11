"""Las otras dos demos, medidas despues del cableado.

La pregunta es una sola y no es de opinion: con `attach()` pasandole ahora un
`multiview` al cromo, el boton del selector EXISTE en el DOM de las dos demos
que ya andaban. Lo que hay que medir es si ocupa lugar. `.qa-btn[hidden]`
declara `display:none` -- la regla esta escrita a mano porque `.qa-btn` es
`display:grid` y le gana al [hidden] del navegador -- asi que la fila de arriba
tiene que quedar donde estaba, con el boton de audio pegado al borde.
"""
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)

DEMOS = [
    ("compatibility-pair", "http://localhost:8080/", "#player"),
    ("hydration-break", "http://localhost:8081/", "#player"),
]

LECTURA = """
(sel) => {
  const stage = document.querySelector(sel);
  const fila = stage.getElementsByClassName('qa-controls__top')[0];
  const r = fila.getBoundingClientRect();
  const hijos = [...fila.children].map((n) => {
    const c = n.getBoundingClientRect();
    return {
      clase: n.className, oculto: n.hidden,
      display: getComputedStyle(n).display,
      caja: { left: Math.round(c.left), top: Math.round(c.top),
              ancho: Math.round(c.width), alto: Math.round(c.height) }
    };
  });
  const audio = hijos.find((h) => h.clase.includes('qa-btn--audio'));
  return {
    fila: { left: Math.round(r.left), top: Math.round(r.top),
            ancho: Math.round(r.width), alto: Math.round(r.height) },
    hijos,
    audioPegadoAlBorde: audio
      ? audio.caja.top === Math.round(r.top) &&
        audio.caja.left + audio.caja.ancho === Math.round(r.left + r.width)
      : false
  };
}
"""

fallas = []
lecturas = {}


def chequear(ok, texto):
    print(("   OK   " if ok else "   FALLA") + "  " + texto)
    if not ok:
        fallas.append(texto)


with sync_playwright() as p:
    nav = p.chromium.launch(channel="chrome", headless=True,
                            args=["--autoplay-policy=no-user-gesture-required"])
    for nombre, url, sel in DEMOS:
        print("\n== %s  (%s)" % (nombre, url))
        page = nav.new_page(viewport={"width": 1400, "height": 900}, device_scale_factor=2)
        page.goto(url)
        page.wait_for_selector("%s .qa-controls__top" % sel, timeout=25000)
        page.wait_for_timeout(1500)
        stage = page.locator(sel)
        b = stage.bounding_box()
        page.mouse.move(b["x"] + b["width"] / 2, b["y"] + b["height"] * 0.5)
        page.mouse.move(b["x"] + b["width"] / 2 + 4, b["y"] + b["height"] * 0.5 + 4)
        page.wait_for_timeout(400)
        e = page.evaluate(LECTURA, sel)
        lecturas[nombre] = e
        print("   " + json.dumps(e["fila"]))
        for h in e["hijos"]:
            print("   %-28s hidden=%-5s display=%-6s %s"
                  % (h["clase"], h["oculto"], h["display"], json.dumps(h["caja"])))
        vistas = [h for h in e["hijos"] if "qa-btn--views" in h["clase"]]
        chequear(len(vistas) == 1, "el boton del selector existe en el DOM (attach le pasa multiview)")
        if vistas:
            chequear(vistas[0]["oculto"] is True, "y llega oculto: no hay oferta en esta playlist")
            chequear(vistas[0]["display"] == "none",
                     "con display:none, que es la regla .qa-btn[hidden] escrita a mano")
            chequear(vistas[0]["caja"]["ancho"] == 0 and vistas[0]["caja"]["alto"] == 0,
                     "y no ocupa un pixel: caja %s" % json.dumps(vistas[0]["caja"]))
        chequear(e["audioPegadoAlBorde"],
                 "el boton de audio sigue pegado al borde de la fila, como antes del cableado")
        stage.screenshot(path=str(OUT / ("regresion-%s.png" % nombre)))
        page.close()
    nav.close()

(OUT / "otras-demos.json").write_text(json.dumps(lecturas, indent=2, ensure_ascii=False))
if fallas:
    print("\nFALLARON:")
    for f in fallas:
        print("  - " + f)
    sys.exit(1)
print("\n== TODO VERDE ==")
