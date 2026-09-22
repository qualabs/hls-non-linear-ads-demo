#!/usr/bin/env python3
"""¿Un scrub en una barra deja los dos panes en el mismo segundo? Con su control.

Se mide sobre `index.html`, la página real, y **el gesto es un gesto**: se apoya
el puntero sobre la barra del pane, se arrastra y se suelta, que es lo único que
el chrome escucha. Nada se escribe en el reloj desde el instrumento, porque
escribirlo sería medir otra cosa que la que la persona hace en el escenario.

════════════════════════════════════════════════════════════════════════════════
QUÉ SE MIDE Y CONTRA QUÉ
════════════════════════════════════════════════════════════════════════════════

LA PROPIEDAD es la separación entre los dos relojes del programa después de
soltar la barra: el `currentTime` del elemento de nuestro pane, y el
`interstitialsManager.primary.currentTime` del pane de fábrica, que es el reloj
del programa de ese lado (la cabecera de `stock-player.js` tiene el porqué). Se
leen **en la misma llamada**, porque dos llamadas separadas miden también el
puente.

EL CONTROL es la misma medición con el enlace apagado, `window.demo.enlace =
false`, que deja la página como estaba antes de que el enlace existiera: cada
barra mueve su propio pane. Un número chico con el enlace prendido no dice nada
hasta que el mismo número sale grande con el enlace apagado — un instrumento que
no sepa leer un reloj da chico siempre.

LOS CASOS, que son los que tienen forma de fallar distinto:

  1. desde NUESTRA barra, destino FUERA de un break
  2. desde la barra de FÁBRICA, destino FUERA de un break
  3. destino ADENTRO de un break: `objetivoSeguro` lo lleva a la cabeza del
     break, y lo que se exige es que los DOS terminen ahí
  4. LA TRAMPA: el gesto se hace mientras el pane de fábrica está ADENTRO de un
     break, que es donde una escritura sobre su reloj se acepta y no hace nada.
     Medido por la T-07 sin resolver: 90,79 s de separación.

════════════════════════════════════════════════════════════════════════════════
USO
════════════════════════════════════════════════════════════════════════════════
    medir-enlace-de-barras.py --puerto 8099 [--capturas <dir>]

Levanta su propio `server.mjs` en ese puerto y lo baja por el PID que guardó.
En esta máquina corren demos de Nicolás en 8080, 8081 y 8082: el puerto se pasa.

El intérprete es el del skill playwright, como en `medir-escalera.py`.
"""

import argparse
import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

_PY = os.environ.get("PY", "/home/nicolas/Skills/playwright/.venv/bin/python")
try:
    import playwright  # noqa: F401
except ModuleNotFoundError:
    if not os.access(_PY, os.X_OK):
        sys.exit(f"falta playwright, y el python del skill no está en {_PY}")
    os.execv(_PY, [_PY, os.path.abspath(__file__), *sys.argv[1:]])

DEMO = Path(__file__).resolve().parent.parent
SDK = DEMO.parent.parent
STAGE = json.loads((DEMO / "stage.json").read_text())
BREAKS = STAGE["breaks"]

# La separación que cuenta como "el mismo segundo". Los dos panes son dos
# players que no comparten reloj de muestreo y el programa sigue corriendo entre
# una lectura y la otra; el defecto que se busca vale DECENAS de segundos.
HOLGURA = 1.5

# EL CONTROL EXIGE LA NEGACIÓN EXACTA DE LO QUE EXIGE LA MEDICIÓN, y no un
# número propio. Sin enlace, un gesto tiene que dejar el par SIN cumplir las dos
# cosas juntas: o quedan separados, o no llegaron a lo que la barra pidió. Un
# umbral de separación propio se rompería justo en el caso más importante — un
# gesto sobre la barra de fábrica desde adentro de un break no mueve nada, así
# que la separación queda chica porque el seek no ocurrió, que es el defecto
# mismo. Lo que demuestra que el instrumento sabe ENCONTRAR una separación son
# los casos en que sí la encuentra, y las separaciones medidas quedan impresas.

# Los dos relojes, en una sola llamada.
RELOJES = """
() => {
  const d = window.demo;
  const stock = d.stock.hls.interstitialsManager?.primary?.currentTime;
  return {
    nuestro: d.video.currentTime,
    stock: Number.isFinite(stock) ? stock : d.stock.programme.currentTime,
    nuestroEnAd: d.provider.activeAt(d.video.currentTime).length > 0,
    stockEnAd: (d.stock.hls.interstitialsManager?.playingItem?.event?.identifier ?? null) !== null,
    enlace: d.enlace,
    ultimo: d.ultimoEnlace
  };
}
"""


def en_break(segundo):
    return any(b["offset"] <= segundo < b["offset"] + b["duracion"] for b in BREAKS)


def cabeza_segura(segundo):
    """Lo mismo que `objetivoSeguro` de la página, para saber qué esperar."""
    for b in BREAKS:
        if b["offset"] <= segundo < b["offset"] + b["duracion"]:
            return max(0.05, b["offset"] - 5)
    return segundo


class Pagina:
    def __init__(self, pw, puerto):
        self.navegador = pw.chromium.launch(
            channel="chrome",
            args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
        )
        self.page = self.navegador.new_page(viewport={"width": 1907, "height": 1000})
        self.consola = []
        self.page.on("console", lambda m: self.consola.append(m.text))
        self.url = f"http://localhost:{puerto}/index.html"

    def abrir(self):
        self.page.goto(self.url)
        self.page.wait_for_function("() => window.demo && window.demo.video")
        self.page.wait_for_function(
            "() => window.demo.stock.hls.interstitialsManager?.primary != null"
            " && window.demo.video.readyState >= 2"
        )
        return self

    def relojes(self):
        return self.page.evaluate(RELOJES)

    # ── el gesto ────────────────────────────────────────────────────────────
    def escrubear(self, pane, fraccion):
        """Apoyar, arrastrar y soltar sobre la barra de ese pane.

        Es el gesto entero y no un click: el chrome de la librería hace la
        búsqueda al SOLTAR (ADR 0032/0033), así que un instrumento que sólo
        apretara mediría un estado que la página nunca muestra.
        """
        slot = "#demo-slot" if pane == "demo" else "#stock-slot"
        # Primero el puntero sobre el player, que es lo que levanta el chrome.
        caja = self.page.locator(f"{slot} .player").bounding_box()
        self.page.mouse.move(caja["x"] + caja["width"] / 2, caja["y"] + caja["height"] / 2)
        self.page.wait_for_timeout(200)
        rail = self.page.locator(f"{slot} .qa-track__rail").bounding_box()
        y = rail["y"] + rail["height"] / 2
        self.page.mouse.move(rail["x"] + rail["width"] * 0.05, y)
        self.page.mouse.down()
        # Un arrastre de verdad, en pasos: el chrome pinta la perilla del puntero
        # mientras dura y escribe al final.
        for paso in range(1, 6):
            self.page.mouse.move(rail["x"] + rail["width"] * (0.05 + (fraccion - 0.05) * paso / 5), y)
            self.page.wait_for_timeout(40)
        self.page.mouse.up()

    def esperar_quietos(self, esperado=None, segundos=25):
        """Hasta que los dos panes estén afuera de un break y el enlace resuelto.

        Se espera a que los dos estén FUERA de un break porque adentro el reloj
        del programa del pane de fábrica se congela en el segundo en que el break
        empezó, y esa diferencia no es separación: es lo que reemplazar significa.
        Lo que la medición afirma es dónde quedó el par, y eso se lee con el
        programa corriendo de los dos lados.

        **Y se espera a que el par haya llegado, no sólo a que esté quieto.** El
        camino caro del enlace rearma los dos players, y mientras rearma no hay
        `interstitialsManager` todavía: los dos relojes leen cero, los dos dicen
        que no hay aviso, y una muestra tomada ahí daría separación cero — un
        verde que no significa nada. Por eso, cuando se sabe a qué segundo se
        apuntó, la muestra no se acepta hasta que alguno de los dos está cerca.
        """
        fin = time.time() + segundos
        ultimo = None

        def sirve(m):
            if m["nuestroEnAd"] or m["stockEnAd"]:
                return False
            if esperado is None:
                return True
            return max(m["nuestro"], m["stock"]) >= esperado - 2

        while time.time() < fin:
            ultimo = self.relojes()
            if sirve(ultimo):
                # Dos muestras seguidas: la primera puede caer entre la escritura
                # y su lectura de vuelta.
                time.sleep(0.6)
                segunda = self.relojes()
                if sirve(segunda):
                    return segunda
                ultimo = segunda
            time.sleep(0.25)
        return ultimo

    def ir_a(self, segundo):
        """Mover el par sin la barra, para dejarlo donde el caso lo necesita."""
        self.page.evaluate("(t) => window.demo.irA(t)", segundo)

    def cerrar(self):
        self.navegador.close()


def fraccion_para(page, pane, segundo):
    """Qué fracción de ESA barra es ese segundo, con el largo que esa barra usa.

    Las dos barras no tienen por qué medir el mismo largo — la nuestra lee
    `video.duration` y la de fábrica `interstitialsManager.primary.duration` —
    así que la fracción se calcula con el largo de la barra que se va a tocar.
    """
    largo = page.evaluate(
        "(p) => p === 'demo' ? window.demo.video.duration"
        " : (window.demo.stock.hls.interstitialsManager?.primary?.duration"
        "    ?? window.demo.stock.programme.duration)",
        pane,
    )
    return min(0.98, max(0.01, segundo / largo)), largo


CASOS = [
    # (nombre, barra, segundo pedido, dónde dejar el par antes del gesto)
    ("1. desde NUESTRA barra, destino fuera de un break", "demo", 140.0, 8.0),
    ("2. desde la barra de FÁBRICA, destino fuera de un break", "stock", 140.0, 8.0),
    ("3. desde NUESTRA barra, destino ADENTRO del break B", "demo", 70.0, 8.0),
    ("4. desde la barra de FÁBRICA, destino ADENTRO del break B", "stock", 70.0, 8.0),
    ("5. LA TRAMPA: gesto desde NUESTRA barra con el par ADENTRO del break A",
     "demo", 140.0, "break-a"),
    ("6. LA TRAMPA: gesto desde la barra de FÁBRICA con el par ADENTRO del break A",
     "stock", 140.0, "break-a"),
]


# Lo que la página dice de sí misma mientras se la mide. Se imprimen SÓLO las
# líneas del enlace: las del contrato las imprime cada armado y no son de esto.
def del_enlace(linea):
    return linea.startswith("[app]") and any(
        marca in linea for marca in ("scrub", "did not take", "never took", "NOT tied"))


def dejar_el_par_en(pagina, segundo, tolerancia=5.0, intentos=3):
    """Mover el par a ese segundo sin tocar ninguna barra, y confirmarlo.

    Se confirma porque el caso anterior pudo dejar el par rearmándose, y un
    `irA` escrito sobre un player que todavía no existe se pierde igual que
    cualquier otro (es la razón por la que `buscar()` existe en la página). Un
    caso montado sobre un punto de partida que no es el que dice ser mide otra
    cosa y lo dice en verde.
    """
    for _ in range(intentos):
        pagina.ir_a(segundo)
        fin = time.time() + 12
        while time.time() < fin:
            m = pagina.relojes()
            if abs(m["nuestro"] - segundo) < tolerancia and abs(m["stock"] - segundo) < tolerancia:
                return m
            time.sleep(0.25)
    return None


def una_corrida(pw, puerto, enlace, capturas=None, solo=None):
    print(f"\n{'═' * 78}\n{'CON EL ENLACE PRENDIDO' if enlace else 'EL CONTROL — EL ENLACE APAGADO, cada barra mueve su pane'}\n{'═' * 78}")
    rojo = 0
    pagina = Pagina(pw, puerto)
    try:
        pagina.abrir()
        for nombre, barra, pedido, desde in CASOS:
            if solo and nombre.split(".")[0] not in solo:
                continue
            pagina.page.evaluate("(v) => { window.demo.enlace = v; }", enlace)
            # Dejar el par donde el caso lo pide, sin tocar ninguna barra.
            if desde == "break-a":
                partida = dejar_el_par_en(pagina, BREAKS[0]["offset"] - 3)
                if partida is None:
                    print(f"\n  {nombre}\n      ROJO: el par no llegó al punto de partida")
                    rojo += 1
                    continue
                fin = time.time() + 30
                while time.time() < fin:
                    m = pagina.relojes()
                    if m["stockEnAd"] and m["nuestroEnAd"]:
                        break
                    time.sleep(0.2)
                antes = pagina.relojes()
                if not antes["stockEnAd"]:
                    print(f"\n  {nombre}\n      ROJO: el pane de fábrica no llegó a entrar al break")
                    rojo += 1
                    continue
            else:
                if dejar_el_par_en(pagina, desde) is None:
                    print(f"\n  {nombre}\n      ROJO: el par no llegó al punto de partida")
                    rojo += 1
                    continue
                antes = pagina.relojes()
            pagina.consola.clear()

            esperado = cabeza_segura(pedido)
            fraccion, largo = fraccion_para(pagina.page, barra, pedido)
            pagina.escrubear(barra, fraccion)
            if enlace:
                despues = pagina.esperar_quietos(esperado)
            else:
                # Sin enlace no hay par al que esperar: cada barra movió su pane
                # y el otro se quedó donde estaba, que es justamente lo que se
                # quiere ver. Se deja asentar y se lee, con los dos indicadores
                # de "adentro de un break" impresos para que la lectura se audite.
                time.sleep(2.5)
                despues = pagina.relojes()

            delta = abs(despues["nuestro"] - despues["stock"])
            junto = delta <= HOLGURA
            # Con el enlace prendido se exige además que el par haya ido A DONDE
            # LA BARRA PIDIÓ: dos panes juntos en el segundo equivocado están
            # juntos y no sirven. El pedido se compara contra el objetivo seguro,
            # que es lo que la página hace con un destino adentro de un break, y
            # con holgura amplia porque el programa corre mientras se espera.
            llego = abs(max(despues["nuestro"], despues["stock"]) - esperado) < 30
            ok = (junto and llego) if enlace else not (junto and llego)
            camino = (despues.get("ultimo") or {}).get("camino") if enlace else "—"
            print(f"\n  {nombre}")
            print(f"      antes del gesto   nuestro {antes['nuestro']:7.2f}   fábrica {antes['stock']:7.2f}"
                  f"   {'(los dos adentro del break)' if antes['stockEnAd'] else ''}")
            print(f"      la barra pidió    {pedido:7.2f} s  (fracción {fraccion:.3f} de {largo:.2f} s)"
                  f"   → objetivo seguro {esperado:.2f} s"
                  + ("   [el destino cae adentro de un break]" if en_break(pedido) else ""))
            print(f"      después           nuestro {despues['nuestro']:7.2f}   fábrica {despues['stock']:7.2f}"
                  f"   SEPARACIÓN {delta:7.2f} s   camino: {camino}"
                  f"   (en aviso: nuestro {despues['nuestroEnAd']}, fábrica {despues['stockEnAd']})")
            for linea in [l for l in pagina.consola if del_enlace(l)]:
                print(f"      consola: {linea}")
            pagina.consola.clear()
            print(f"      -> {'VERDE' if ok else 'ROJO'}"
                  f"   (juntos: {junto}, llegaron a lo pedido: {llego}"
                  + (")" if enlace else "; el control exige que NO se den las dos)"))
            if capturas:
                destino = Path(capturas) / (
                    f"enlace-{'on' if enlace else 'off'}-caso-{nombre.split('.')[0]}.png")
                pagina.page.screenshot(path=str(destino))
            rojo += 0 if ok else 1
    finally:
        pagina.cerrar()
    return rojo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--puerto", type=int, required=True)
    ap.add_argument("--capturas", default=None)
    ap.add_argument("--que", default="todo", choices=["todo", "enlace", "control"])
    ap.add_argument("--casos", default=None,
                    help="los números de los casos a correr, separados por coma")
    args = ap.parse_args()

    if args.capturas:
        Path(args.capturas).mkdir(parents=True, exist_ok=True)

    server = subprocess.Popen(
        ["node", "server.mjs", f"demo/{DEMO.name}"],
        cwd=SDK, env={**os.environ, "PORT": str(args.puerto)},
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    print(f"server PID {server.pid} en el puerto {args.puerto}")
    time.sleep(1.0)
    rojo = 0
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            solo = set(args.casos.split(",")) if args.casos else None
            if args.que in ("todo", "enlace"):
                rojo += una_corrida(pw, args.puerto, True, args.capturas, solo)
            if args.que in ("todo", "control"):
                rojo += una_corrida(pw, args.puerto, False, args.capturas, solo)
    finally:
        # Por el PID guardado, nunca por patrón.
        server.send_signal(signal.SIGTERM)
        server.wait(timeout=10)
        print(f"\nserver {server.pid} bajado")

    print("\nVERDE: el enlace deja los dos panes en el mismo segundo, y el control "
          "sin enlace los deja separados."
          if rojo == 0 else f"\nROJO: {rojo} caso(s) no dieron lo esperado.")
    sys.exit(1 if rojo else 0)


if __name__ == "__main__":
    main()
