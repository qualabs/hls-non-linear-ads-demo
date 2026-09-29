#!/usr/bin/env python3
"""Congela un creativo SVG animado en UN cuadro: la variante de imagen del aviso.

Por qué existe (fase 15): la opción de imagen de cada break tiene que LEERSE como
imagen. Un SVG con movimiento adentro de un `<img>` se ve igual que un video, y
Nicolás tuvo que inspeccionar el elemento para saber cuál era cuál. La imagen es
el mismo creativo, el mismo encuadre y la misma caja, quieta.

CÓMO: el SVG autorado se abre en Chrome como documento propio, se congela el reloj
de SMIL en `t` (`pauseAnimations` + `setCurrentTime`, el mismo reloj determinista
que usa `capturar-svg.py`), y cada valor que una animación está pisando en ese
instante se ESCRIBE como atributo de su elemento: un `<animate>` deja el valor
animado del atributo que anima, y un `<animateTransform>` deja la transformación
entera consolidada en una `matrix(...)`. Después se sacan todas las animaciones y
se serializa el documento. El resultado es el cuadro `t` del creativo, en vector,
sin una sola animación.

POR QUÉ NO ALCANZA CON BORRAR LAS ANIMACIONES: los valores base del autor no son
un cuadro. Las burbujas de ZUMBRA, por ejemplo, tienen `opacity="0"` y ningún
`cy`: sin sus animaciones no se dibujan.

Los creativos de esta demo están animados SÓLO con SMIL (lo verifica
`capturar-svg.py --verificar-smil`). Si un día aparece un `@keyframes` o un
`<script>`, este script se niega en lugar de dejar algo moviéndose.

Uso:  congelar-svg.py <entrada.svg> <salida.svg> <t en segundos>
"""

import os
import re
import sys
import xml.dom.minidom
from pathlib import Path

_PY = os.environ.get("PY", "/home/nicolas/Skills/playwright/.venv/bin/python")
try:
    import playwright  # noqa: F401
except ModuleNotFoundError:
    if not os.access(_PY, os.X_OK):
        sys.exit(f"falta playwright, y el python del skill no está en {_PY}")
    os.execv(_PY, [_PY, os.path.abspath(__file__), *sys.argv[1:]])

from playwright.sync_api import sync_playwright  # noqa: E402

CONGELAR = """
async (t) => {
  const svg = document.documentElement;
  svg.pauseAnimations();
  svg.setCurrentTime(t);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const anims = [...document.querySelectorAll('animate, animateTransform, animateMotion, set')];
  const cambios = [];
  const vistos = new Set();
  for (const a of anims) {
    const href = a.getAttribute('href') || a.getAttribute('xlink:href');
    const blanco = href ? document.querySelector(href) : a.parentElement;
    const attr = a.getAttribute('attributeName');
    if (a.localName === 'animateTransform') {
      if (vistos.has(blanco)) continue;
      vistos.add(blanco);
      // animVal es de sólo lectura, así que no se puede `consolidate()`: se
      // multiplican los items en orden, que es lo que consolidar haría.
      const lista = blanco.transform.animVal;
      let m = null;
      for (let i = 0; i < lista.numberOfItems; i++) {
        const x = lista.getItem(i).matrix;
        m = (m ?? new DOMMatrix()).multiply(new DOMMatrix([x.a, x.b, x.c, x.d, x.e, x.f]));
      }
      cambios.push([blanco, 'transform',
        m ? `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map((n) => +n.toFixed(4)).join(' ')})` : null]);
    } else if (a.localName === 'animate' || a.localName === 'set') {
      const prop = blanco[attr];
      let valor;
      if (prop && prop.animVal !== undefined && typeof prop.animVal === 'object' && 'value' in prop.animVal) {
        valor = String(+prop.animVal.value.toFixed(4));
      } else if (prop && prop.animVal !== undefined && typeof prop.animVal === 'number') {
        valor = String(+prop.animVal.toFixed(4));
      } else {
        valor = getComputedStyle(blanco).getPropertyValue(attr).trim();
      }
      cambios.push([blanco, attr, valor]);
    } else {
      throw new Error(`${a.localName}: no sé congelarlo`);
    }
  }
  for (const a of anims) a.remove();
  for (const [el, attr, valor] of cambios) {
    if (valor === null) el.removeAttribute(attr); else el.setAttribute(attr, valor);
  }
  return { animaciones: anims.length, cambios: cambios.length,
           svg: new XMLSerializer().serializeToString(document) };
}
"""


def main():
    if len(sys.argv) != 4:
        sys.exit(__doc__.strip().splitlines()[-1])
    entrada, salida, t = Path(sys.argv[1]).resolve(), Path(sys.argv[2]), float(sys.argv[3])
    fuente = entrada.read_text()
    if re.search(r"@keyframes|animation\s*:|<script", fuente):
        sys.exit(f"{entrada.name}: tiene animación CSS o script, y este script sólo congela SMIL")

    with sync_playwright() as pw:
        nav = pw.chromium.launch(channel="chrome")
        pagina = nav.new_page()
        pagina.goto(entrada.as_uri())
        r = pagina.evaluate(CONGELAR, t)
        nav.close()

    cuerpo = r["svg"]
    cuerpo = re.sub(r"^<\?xml[^>]*\?>\s*", "", cuerpo)
    cabecera = (f"<!-- GENERADO por scripts/congelar-svg.py desde {entrada.name}, cuadro t={t:g} s. "
                "No se edita: se edita el original y se vuelve a correr. Es la variante de imagen "
                "del aviso (fase 15) y no tiene ninguna animación. -->\n")
    texto = '<?xml version="1.0" encoding="UTF-8"?>\n' + cabecera + cuerpo + ("\n" if not cuerpo.endswith("\n") else "")
    # Sin los comentarios: el del autor explica sus animaciones con los nombres de
    # las etiquetas, y eso no es una animación.
    if re.search(r"<(animate|animateTransform|animateMotion|set)\b", re.sub(r"<!--.*?-->", "", texto, flags=re.S)):
        sys.exit("quedó una animación en la salida")
    xml.dom.minidom.parseString(texto.encode())  # un SVG mal formado no se dibuja y no avisa
    salida.write_text(texto)
    print(f"{salida}: {r['animaciones']} animaciones congeladas en t={t:g} s, {r['cambios']} valores escritos")


if __name__ == "__main__":
    main()
