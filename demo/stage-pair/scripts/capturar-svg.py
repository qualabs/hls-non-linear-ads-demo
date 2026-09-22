#!/usr/bin/env python3
"""Captura un SVG animado a una secuencia de PNG, cuadro por cuadro, contra un
reloj controlado.

Es la primera mitad del puente a video de la fase 14: SVG animado -> cuadros ->
(empaquetar-creativo.sh) -> HLS. Existe porque **el aviso lineal lo reproduce
también el pane de fábrica**, que es un player de mercado y sólo entiende medios:
un SVG no es un medio.

────────────────────────────────────────────────────────────────────────────────
EL RELOJ SE CONTROLA, NO SE ESPERA. ES LA DECISIÓN CENTRAL DE ESTE ARCHIVO.
────────────────────────────────────────────────────────────────────────────────
Capturar mirando el reloj de pared —dormir 33 ms, sacar la foto, repetir— da
cuadros repetidos y cuadros perdidos según cuánto tarde cada captura, y el error
no se ve en el archivo resultante. `--virtual-time-budget` de Chrome tampoco
sirve: NO es determinista, y está medido en esta misma fase —la misma página con
el mismo budget, dos corridas, dio 7.137 píxeles de diferencia—.

El reloj que sí es determinista es el del propio documento SVG:

    svg.pauseAnimations()          congela el reloj de SMIL
    svg.setCurrentTime(t)          lo posiciona EXACTAMENTE en t

Es la API de `SVGSVGElement` y es la que corresponde acá porque **los nueve
creativos de esta demo están animados SÓLO con SMIL** (`<animate>` y
`<animateTransform>`, cero `@keyframes` y cero `<script>`; verificado por
`--verificar-smil`). Para un creativo con animación CSS este reloj NO alcanzaría
y habría que sumarle `document.getAnimations()`; el script lo detecta y se niega
a capturar en lugar de producir un video quieto.

Entre el `setCurrentTime` y la foto se esperan DOS `requestAnimationFrame`: el
primero es donde el motor recalcula el estilo con el nuevo tiempo, el segundo
garantiza que ese cuadro ya se compuso. Con uno solo se captura el cuadro
anterior una de cada tantas veces, que es la clase de defecto que sólo aparece en
cámara.

────────────────────────────────────────────────────────────────────────────────
POR QUÉ EL SVG SE INCRUSTA EN LA PÁGINA Y NO SE ABRE EN UN <img>
────────────────────────────────────────────────────────────────────────────────
Adentro de un `<img>` el documento SVG es inaccesible desde afuera: no hay a quién
pedirle `setCurrentTime`, así que no hay reloj que controlar. Incrustado en el DOM
el dibujo es el mismo —no hay script en estos SVG, que es lo que un `<img>`
bloquea (T-02), ni recursos de red que un documento aislado no traería— y el
reloj queda al alcance. `--verificar-encuadre` mide justamente eso: el mismo SVG
incrustado contra el mismo SVG abierto como documento propio, congelados los dos
en t=0, tienen que dar 0 píxeles de diferencia.

────────────────────────────────────────────────────────────────────────────────
SE CAPTURA A LA RESOLUCIÓN NATIVA DEL CREATIVO
────────────────────────────────────────────────────────────────────────────────
El tamaño sale del `viewBox` del propio archivo y no de un parámetro: 1920x1080
para el 16:9 y el backplate, 1680x189 para el banner. Capturar chico y agrandar
después pierde lo único que el vector aportaba, y además rompe la verificación:
está medido en esta fase que a 800 px de ancho un creativo de 1920 mueve entre
0,5 y 3 píxeles de 383.200, contra 14.620 a resolución nativa. El escalado, si
hace falta, va en el empaquetado.

`device_scale_factor = 1` para que un píxel CSS sea un píxel del PNG.

────────────────────────────────────────────────────────────────────────────────
DOS GUARDAS, Y LAS DOS SON DE MODOS DE FALLA SILENCIOSOS
────────────────────────────────────────────────────────────────────────────────
1. **El SVG se parsea como XML antes de tocarlo.** Un SVG mal formado no se
   dibuja y NO AVISA: Chrome deja la captura en negro sin emitir un solo error.
   El caso medido en esta fase es una tabla markdown adentro de un comentario
   XML, porque el separador `| --- |` contiene `--`, que es ilegal dentro de
   `<!-- -->` — y este proyecto escribe cabeceras largas como documentación, que
   es justo donde uno escribe una tabla.
2. **El PNG alfa se conserva** (`omit_background`), y quien decide sobre qué se
   aplana es el empaquetado. Aplanar acá contra el blanco del `<body>` metería un
   fondo que el creativo no tiene, y el backplate de la L usa transparencia en su
   guarda a propósito.

Se usa el Chrome REAL del sistema (`channel="chrome"`) y no el Chromium que trae
Playwright: el bundled no resuelve las fuentes del sistema en esta máquina, y los
nueve creativos están dibujados contra una pila de familias del sistema (T-02,
pregunta 5). Es un navegador PROPIO de esta corrida, no el compartido del skill
`playwright`, y se cierra al terminar.
"""

import argparse
import re
import sys
import xml.dom.minidom
from pathlib import Path

WRAPPER = """<!doctype html><meta charset="utf-8">
<style>html,body{{margin:0;padding:0;background:transparent;overflow:hidden}}
 svg{{display:block;width:{w}px;height:{h}px}}</style>
{svg}"""


def leer_svg(path: Path) -> tuple[str, int, int]:
    """Parsea el SVG como XML (la guarda) y devuelve su markup y su tamaño nativo."""
    try:
        xml.dom.minidom.parse(str(path))
    except Exception as e:  # noqa: BLE001 -- cualquier error de parseo es la falla
        sys.exit(f"XML ROTO {path.name}: {e}")

    texto = path.read_text(encoding="utf-8")
    m = re.search(r'viewBox\s*=\s*"([-\d.\s]+)"', texto)
    if not m:
        sys.exit(f"{path.name}: sin viewBox, no hay resolución nativa que deducir")
    _, _, w, h = (float(v) for v in m.group(1).split())
    # El markup para incrustar: sin la PI de XML, que en HTML no va.
    markup = re.sub(r"^\s*<\?xml[^>]*\?>\s*", "", texto)
    return markup, int(w), int(h)


def tecnicas_de_animacion(markup: str) -> dict:
    return {
        "smil": len(re.findall(r"<animate|<animateTransform|<animateMotion|<set\b", markup)),
        "css": len(re.findall(r"@keyframes|animation\s*:", markup)),
        "script": len(re.findall(r"<script\b", markup)),
    }


def abrir(p, markup, w, h):
    page = p.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
    page.set_content(WRAPPER.format(w=w, h=h, svg=markup), wait_until="load")
    page.evaluate("() => document.querySelector('svg').pauseAnimations()")
    return page


def cuadro(page, t: float, destino: Path | None):
    """Posiciona el reloj del SVG en t y captura. Devuelve los bytes del PNG."""
    page.evaluate(
        """t => new Promise(r => {
             document.querySelector('svg').setCurrentTime(t);
             requestAnimationFrame(() => requestAnimationFrame(r));
           })""",
        t,
    )
    return page.screenshot(path=str(destino) if destino else None, omit_background=True)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("svg", type=Path)
    ap.add_argument("salida", type=Path, nargs="?", help="directorio de los PNG")
    ap.add_argument("--fps", type=float, default=30.0)
    ap.add_argument("--duracion", type=float, default=12.0)
    ap.add_argument("--desde", type=float, default=0.0, help="instante del primer cuadro")
    ap.add_argument("--solo", type=float, action="append", default=None,
                    help="capturar sólo estos instantes (repetible); el nombre es el índice")
    ap.add_argument("--verificar-smil", action="store_true",
                    help="sólo informa qué técnica de animación usa el archivo")
    ap.add_argument("--verificar-encuadre", type=Path, default=None,
                    help="además captura el MISMO SVG como documento propio en este PNG")
    args = ap.parse_args()

    markup, w, h = leer_svg(args.svg)
    tec = tecnicas_de_animacion(markup)
    if args.verificar_smil:
        print(f"{args.svg.name}\t{w}x{h}\tsmil={tec['smil']}\tcss={tec['css']}\tscript={tec['script']}")
        return
    if tec["css"]:
        sys.exit(f"{args.svg.name}: usa animación CSS ({tec['css']} ocurrencias) y "
                 "setCurrentTime NO la controla. Este reloj no alcanza: pararía en un "
                 "video quieto sin avisar.")
    if not tec["smil"]:
        sys.exit(f"{args.svg.name}: no tiene animación SMIL; no hay nada que capturar.")

    from playwright.sync_api import sync_playwright

    n = int(round(args.duracion * args.fps))
    args.salida.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as pw:
        navegador = pw.chromium.launch(channel="chrome", args=["--force-color-profile=srgb"])
        try:
            page = abrir(navegador, markup, w, h)
            if args.solo:
                for i, t in enumerate(args.solo):
                    cuadro(page, t, args.salida / f"f{i:05d}.png")
                print(f"{args.svg.name}: {len(args.solo)} cuadro(s) en {args.salida}")
            else:
                for i in range(n):
                    cuadro(page, args.desde + i / args.fps, args.salida / f"f{i:05d}.png")
                print(f"{args.svg.name}: {n} cuadros {w}x{h} a {args.fps} fps "
                      f"({args.duracion} s) en {args.salida}")
            if args.verificar_encuadre:
                # El mismo archivo abierto como DOCUMENTO PROPIO, que es como lo
                # dibuja un <img>. Congelado en el mismo t=0 que el incrustado.
                doc = navegador.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
                doc.goto(args.svg.resolve().as_uri())
                doc.evaluate("() => document.documentElement.pauseAnimations()")
                cuadro(doc, 0.0, args.verificar_encuadre)
                doc.close()
        finally:
            navegador.close()


if __name__ == "__main__":
    main()
