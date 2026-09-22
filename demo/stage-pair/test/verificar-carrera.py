#!/usr/bin/env python3
"""Lo que `race.html` afirma, medido en el navegador, y las capturas con que se mira.

La afirmación de esta página es un ORDEN: los avisos no lineales primero y la
ventana de multi view después. Un orden no se prueba mirando una captura -- una
captura es un instante -- así que se mide leyendo el contrato a lo largo del
recorrido, que es el instrumento que la fase 03 eligió para este proyecto y no
uno nuevo.

════════════════════════════════════════════════════════════════════════════════
LAS TRES MEDICIONES, Y EL CONTROL DE CADA UNA
════════════════════════════════════════════════════════════════════════════════

1. EL ORDEN ES EL ARGUMENTO  (`--que orden`)

   Se leen los rangos del programa del contrato -- `programRanges()`, que es lo
   que el player resolvió de la playlist y no lo que stage.json declara -- y se
   compara el final del último rango de clase concurrente contra el comienzo del
   de multi view. Tienen que estar separados, y la separación se imprime en
   segundos.

   **EL CONTROL: `CONTROL_AVISO_EN_VENTANA=1`**, que corre el último aviso
   adentro de la ventana. Es exactamente lo que la página afirma que no pasa, y
   la misma lectura tiene que dar ROJO. Sin verlo rojo, un verde sólo dice que la
   función devuelve verde.

2. LA VENTANA Y EL CATÁLOGO  (`--que ventana`)

   Dónde abre la ventana y qué ofrece, leído del contrato y comparado contra las
   dos fuentes que no son la página: `stage.json` para el segundo y el nombre de
   cada cámara, y el DISCO para cuántas cámaras hay empaquetadas. El catálogo
   tiene que tener una entrada por cámara empaquetada -- el chequeo que la fase
   13 hizo pasar de una a seis sin que nadie editara un script -- y tiene que ser
   más largo que el tope de cuatro de la grilla (ADR 0066).

   **EL CONTROL: la ventana NO está abierta antes de abrir.** Se lee `offerAt`
   un segundo antes de `ofertaEn` y adentro de un aviso, y las dos tienen que dar
   `null`. Una lectura que dijera "hay oferta" en cualquier segundo pasaría la
   medición de arriba sin medir nada.

3. LA GRILLA, TOCADA COMO LA TOCA UNA PERSONA  (`--que grilla`)

   Por el selector que dibuja la librería y no por una llamada que esta página
   agregó: se abre la lista de la barra, se tildan cámaras de a una y se cuentan
   los elementos `<video>` vivos adentro del contenedor. Después se agranda una
   caja por su propio botón y se lee el contrato.

   **EL CONTROL es la lectura con nada tildado**: un elemento, que es el
   contenido primario. Si diera lo mismo que con tres tildadas, lo que se está
   contando no son decodificadores.

   **Y EL TOPE SE VE**: con la grilla llena, la fila siguiente queda deshabilitada
   y el catálogo sigue ofreciendo las seis. El tope es de la grilla y nunca de la
   oferta.

4. LAS CAPTURAS  (`--que capturas`)

   La secuencia entera, a 1907 de ancho y a 400x780, que son los dos anchos
   contra los que este proyecto ya mide: la carrera sola, los cuatro avisos, la
   ventana recién abierta, la grilla llena y una cámara a cuadro entero.

   El panel del selector recortado a ancho de teléfono es un defecto conocido y
   cerrado sin cambio, porque la demo es 16:9.

════════════════════════════════════════════════════════════════════════════════
USO
════════════════════════════════════════════════════════════════════════════════
    verificar-carrera.py --puerto 8099 [--que todo|orden|ventana|grilla|capturas]
                         [--salida <dir>]

Levanta su propio `server.mjs` en ese puerto y lo baja **por el PID que guardó**.
El puerto se pasa a propósito y no se adivina: en esta máquina corren demos de
Nicolás en 8080, 8081 y 8082.

El intérprete es el del skill playwright, resuelto por el mismo camino que
`test/verificar-inspect.py`. Se puede pisar con `PY=<ruta>`.
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
CARRERA = STAGE["carrera"]
BREAKS = CARRERA["breaks"]
CAMARAS = CARRERA["camaras"]
# El tope de cajas de la grilla es de la librería (ADR 0066) y se lee de ahí, no
# se tipea acá: un número copiado de un ADR a un test es un número que puede
# quedar viejo sin que nada avise.
MAX_CAJAS = int(json.loads(
    subprocess.run(
        ["node", "--input-type=module", "-e",
         f"import {{ MAX_BOXES }} from '{SDK}/lib/signalling.js';"
         " process.stdout.write(JSON.stringify(MAX_BOXES));"],
        capture_output=True, text=True, check=True).stdout))


def empaquetadas():
    """Las cámaras que están EN DISCO, que es lo que el catálogo tiene que ofrecer."""
    return [c for c in CAMARAS if (DEMO / c["video"]).exists()]


def senalizar(control=False):
    entorno = dict(os.environ)
    if control:
        entorno["CONTROL_AVISO_EN_VENTANA"] = "1"
    subprocess.run([str(DEMO / "scripts/senalizar-carrera.sh")],
                   cwd=DEMO, env=entorno, check=True, stdout=subprocess.DEVNULL)


class Pagina:
    """race.html abierta, con los dos gestos que una persona hace sobre ella."""

    def __init__(self, pw, puerto, ancho=1907, alto=1000):
        self.navegador = pw.chromium.launch(
            channel="chrome",
            args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
        )
        self.page = self.navegador.new_page(viewport={"width": ancho, "height": alto})
        self.url = f"http://localhost:{puerto}/race.html"

    def abrir(self):
        self.page.goto(self.url)
        self.page.wait_for_function("() => window.race && window.race.video")
        # Los rangos aparecen a medida que cada asset-list resuelve. Se espera a
        # que estén los cinco antes de leer nada: una lectura hecha a los 200 ms
        # mediría cuántos habían llegado y no qué señaliza la playlist.
        self.page.wait_for_function(
            "(n) => window.race.provider.programRanges().ranges.length === n",
            arg=len(BREAKS) + 1, timeout=30000)
        return self

    def rangos(self):
        return self.page.evaluate(
            "() => window.race.provider.programRanges().ranges"
            ".map((r) => ({ id: r.id, kind: r.kind, start: r.startTime, dura: r.duration }))")

    def ir_a(self, segundo, esperar_aviso=False, esperar_oferta=False):
        self.page.evaluate("(s) => window.race.irA(s)", segundo)
        if esperar_aviso:
            self.page.wait_for_function(
                "() => window.race.provider.activeAt(window.race.video.currentTime).length > 0",
                timeout=60000)
        if esperar_oferta:
            self.page.wait_for_function(
                "() => window.race.provider.offerAt(window.race.video.currentTime) != null",
                timeout=60000)
        if esperar_aviso or esperar_oferta:
            # Que el rango esté resuelto no alcanza para una captura: hay que
            # esperar a que el elemento haya dibujado un cuadro después de la
            # búsqueda, o lo que se fotografía es el negro del buffer.
            self.page.wait_for_function(
                "() => { const v = window.race.video;"
                " return !v.paused && v.readyState >= 3 && v.currentTime > 0; }", timeout=60000)
            self.page.wait_for_timeout(1500)

    def oferta_en(self, segundo):
        """El catálogo que el contrato ofrece en ese segundo, o None."""
        return self.page.evaluate(
            "(s) => { const o = window.race.provider.offerAt(s);"
            " return o ? { views: o.views.map((v) => ({ id: v.id, name: v.name, uri: v.uri })),"
            " rows: window.race.provider.rows(o).map((r) => ({ id: r.id, name: r.name })) } : null; }",
            segundo)

    def videos(self):
        return self.page.evaluate("() => window.race.container.querySelectorAll('video').length")

    def linea(self):
        return self.page.locator("#state").inner_text()

    # ── los gestos, por la chrome de la librería y no por un hook de la página ──

    def _despertar_chrome(self):
        caja = self.page.locator("#player").bounding_box()
        self.page.mouse.move(caja["x"] + caja["width"] / 2, caja["y"] + caja["height"] / 2)
        self.page.wait_for_timeout(300)

    def abrir_selector(self):
        self._despertar_chrome()
        self.page.locator(".qa-btn--views").click()
        self.page.wait_for_selector(".qa-views__row")

    def cerrar_selector(self):
        self._despertar_chrome()
        self.page.locator(".qa-btn--views").click()
        self.page.wait_for_timeout(300)

    def tildar(self, nombre):
        self.page.locator(".qa-views__row", has_text=nombre).click()
        self.page.wait_for_timeout(900)

    def fila_bloqueada(self, nombre):
        return self.page.locator(".qa-views__row", has_text=nombre).is_disabled()

    def cajas(self):
        return self.page.evaluate(
            "() => [...document.querySelectorAll('.qa-box')].map((n) => n.dataset.boxId)")

    def agrandar(self, caja_id):
        self._despertar_chrome()
        self.page.locator(f'.qa-box[data-box-id="{caja_id}"] .qa-box__btn').click()
        self.page.wait_for_timeout(1800)

    def cerrar(self):
        self.navegador.close()


def fila(nombre, ok, detalle=""):
    print(f"    {nombre:<56} {'VERDE' if ok else 'ROJO'}   {detalle}")
    return 0 if ok else 1


# ── 1. el orden ──────────────────────────────────────────────────────────────

def leer_el_orden(pagina):
    """Devuelve (rangos, hueco): el hueco entre el último aviso y la ventana."""
    rangos = pagina.rangos()
    avisos = [r for r in rangos if r["kind"] == "concurrent"]
    ventana = next(r for r in rangos if r["kind"] == "multiview")
    ultimo = max(r["start"] + r["dura"] for r in avisos)
    return rangos, ventana["start"] - ultimo, avisos, ventana


def medir_orden(puerto):
    from playwright.sync_api import sync_playwright
    print("\n== 1. EL ORDEN: LOS AVISOS PRIMERO, LA VENTANA DESPUÉS ==")
    rojo = 0
    with sync_playwright() as pw:
        pagina = Pagina(pw, puerto)
        try:
            senalizar()
            pagina.abrir()
            rangos, hueco, avisos, ventana = leer_el_orden(pagina)
            print("\n  los rangos que el player resolvió de la playlist")
            for r in rangos:
                print(f"      {r['id']:<24} {r['kind']:<11} "
                      f"{r['start']:6.1f} s -> {r['start'] + r['dura']:6.1f} s")
            rojo += fila("son los cuatro avisos más la ventana",
                         len(avisos) == len(BREAKS) and ventana is not None,
                         f"{len(avisos)} concurrent + 1 multiview")
            rojo += fila("ningún aviso se solapa con la ventana", hueco > 0,
                         f"hueco {hueco:.1f} s entre el último aviso y la ventana")

            # ── EL CONTROL: un aviso ADENTRO de la ventana tiene que dar rojo ──
            print("\n  EL CONTROL — CONTROL_AVISO_EN_VENTANA=1 corre el último aviso adentro")
            senalizar(control=True)
            pagina.page.reload()
            pagina.abrir()
            _, hueco_c, avisos_c, ventana_c = leer_el_orden(pagina)
            for r in sorted(avisos_c + [ventana_c], key=lambda r: r["start"]):
                print(f"      {r['id']:<24} {r['kind']:<11} "
                      f"{r['start']:6.1f} s -> {r['start'] + r['dura']:6.1f} s")
            rojo += fila("CONTROL: la misma lectura ve el solapamiento", hueco_c < 0,
                         f"hueco {hueco_c:.1f} s, o sea el aviso cae DENTRO de la ventana")
        finally:
            pagina.cerrar()
            senalizar()  # el disco vuelve a lo que estaba
    return rojo


# ── 2. la ventana y el catálogo ──────────────────────────────────────────────

def medir_ventana(puerto):
    from playwright.sync_api import sync_playwright
    print("\n== 2. LA VENTANA ABRE DONDE stage.json DICE, Y OFRECE LO QUE HAY EMPAQUETADO ==")
    rojo = 0
    en_disco = empaquetadas()
    with sync_playwright() as pw:
        pagina = Pagina(pw, puerto)
        try:
            pagina.abrir()
            ventana = next(r for r in pagina.rangos() if r["kind"] == "multiview")
            print(f"\n      contrato   {ventana['start']:.1f} s -> "
                  f"{ventana['start'] + ventana['dura']:.1f} s")
            print(f"      stage.json {CARRERA['ofertaEn']} s -> "
                  f"{CARRERA['ofertaEn'] + CARRERA['ofertaDura']} s")
            rojo += fila("la ventana abre en carrera.ofertaEn",
                         ventana["start"] == CARRERA["ofertaEn"])
            rojo += fila("y dura carrera.ofertaDura",
                         ventana["dura"] == CARRERA["ofertaDura"])

            pagina.ir_a(CARRERA["ofertaEn"] - 2, esperar_oferta=True)
            oferta = pagina.oferta_en(CARRERA["ofertaEn"] + 1)
            print(f"\n      cámaras empaquetadas en disco   {len(en_disco)}")
            for v in oferta["views"]:
                print(f"      {v['id']:<10} {v['name']:<20} {v['uri']}")
            rojo += fila("el catálogo tiene una entrada por cámara empaquetada",
                         len(oferta["views"]) == len(en_disco),
                         f"{len(oferta['views'])} de {len(en_disco)}")
            rojo += fila("con el id y el nombre que stage.json les da",
                         [(v["id"], v["name"]) for v in oferta["views"]]
                         == [(c["id"], c["nombre"]) for c in en_disco])
            rojo += fila("y las filas del selector son el programa más las cámaras",
                         [r["name"] for r in oferta["rows"]]
                         == [CARRERA["programa"]["nombre"]] + [c["nombre"] for c in en_disco])
            rojo += fila(f"el catálogo es más largo que el tope de {MAX_CAJAS} de la grilla",
                         len(oferta["views"]) > MAX_CAJAS)

            # ── EL CONTROL: la ventana no está abierta cuando no está abierta ──
            print("\n  EL CONTROL — la misma lectura fuera de la ventana")
            for etiqueta, segundo in (("un segundo antes de abrir", CARRERA["ofertaEn"] - 1),
                                      ("dentro del primer aviso", BREAKS[0]["offset"] + 1)):
                rojo += fila(f"CONTROL: no hay oferta {etiqueta}",
                             pagina.oferta_en(segundo) is None, f"t={segundo} s")
        finally:
            pagina.cerrar()
    return rojo


# ── 3. la grilla ─────────────────────────────────────────────────────────────

def medir_grilla(puerto):
    from playwright.sync_api import sync_playwright
    print("\n== 3. ELEGIR CÁMARAS Y AGRANDAR UNA, POR LA CHROME DE LA LIBRERÍA ==")
    rojo = 0
    en_disco = empaquetadas()
    with sync_playwright() as pw:
        pagina = Pagina(pw, puerto)
        try:
            pagina.abrir()
            pagina.ir_a(CARRERA["ofertaEn"] - 2, esperar_oferta=True)

            # EL CONTROL, y va primero: con nada tildado hay UN elemento, que es
            # el contenido primario. Si el conteo diera lo mismo con tres
            # cámaras arriba, lo que se está contando no son decodificadores.
            solo = pagina.videos()
            rojo += fila("CONTROL: con nada tildado hay un solo elemento de video",
                         solo == 1, f"{solo}")

            pagina.abrir_selector()
            subidas = []
            for camara in en_disco[:MAX_CAJAS - 1]:
                pagina.tildar(camara["nombre"])
                subidas.append(camara)
                n = pagina.videos()
                rojo += fila(f"tildada {camara['nombre']}", n == len(subidas) + 1,
                             f"{n} elementos de video (el programa y {len(subidas)} cámara/s)")

            siguiente = en_disco[MAX_CAJAS - 1]
            rojo += fila(f"con la grilla llena, la fila de {siguiente['nombre']} queda bloqueada",
                         pagina.fila_bloqueada(siguiente["nombre"]),
                         f"el tope es de la grilla ({MAX_CAJAS} cajas, ADR 0066)")
            rojo += fila("y el catálogo sigue ofreciendo todas",
                         len(pagina.oferta_en(CARRERA["ofertaEn"] + 1)["views"]) == len(en_disco),
                         "el tope nunca es de la oferta")
            pagina.cerrar_selector()

            cajas = pagina.cajas()
            print(f"\n      cajas en pantalla   {cajas}")
            rojo += fila("las cajas son el programa y las cámaras tildadas",
                         cajas == ["primaryContent"] + [c["id"] for c in subidas])

            pagina.agrandar(subidas[0]["id"])
            linea = pagina.linea()
            print(f"      la línea dice      {linea}")
            rojo += fila("agrandada, la línea la nombra a cuadro entero",
                         f"{subidas[0]['nombre']} at full frame" in linea)
            pagina.agrandar(subidas[0]["id"])
            rojo += fila("y desagrandada vuelve la grilla",
                         "at full frame" not in pagina.linea()
                         and f"{len(subidas) + 1} boxes" in pagina.linea(),
                         pagina.linea())
        finally:
            pagina.cerrar()
    return rojo


# ── 4. las capturas ──────────────────────────────────────────────────────────

def capturar(puerto, salida):
    from playwright.sync_api import sync_playwright
    salida = Path(salida)
    salida.mkdir(parents=True, exist_ok=True)
    print(f"\n== 4. LAS CAPTURAS -> {salida} ==")
    en_disco = empaquetadas()
    with sync_playwright() as pw:
        for ancho, alto in ((1907, 1000), (400, 780)):
            pagina = Pagina(pw, puerto, ancho, alto)
            try:
                pagina.abrir()

                def foto(nombre):
                    pagina.page.screenshot(path=str(salida / f"race-{ancho}-{nombre}.png"),
                                           full_page=True)
                    print(f"    race-{ancho}-{nombre}.png")

                pagina.ir_a(2)
                pagina.page.wait_for_timeout(2000)
                foto("1-la-carrera-sola")

                for i, brk in enumerate(BREAKS, start=1):
                    pagina.ir_a(brk["offset"] + 2, esperar_aviso=True)
                    foto(f"2-aviso-{i}-{brk['id']}-{brk['campana']}-{brk['forma']}")

                pagina.ir_a(CARRERA["ofertaEn"] - 2, esperar_oferta=True)
                foto("3-la-ventana-abierta")

                pagina.abrir_selector()
                foto("4-el-catalogo")
                subidas = []
                for camara in en_disco[:MAX_CAJAS - 1]:
                    pagina.tildar(camara["nombre"])
                    subidas.append(camara)
                pagina.cerrar_selector()
                pagina.page.wait_for_timeout(2000)
                foto("5-la-grilla-llena")

                pagina.agrandar(subidas[0]["id"])
                foto("6-una-camara-a-cuadro-entero")
            finally:
                pagina.cerrar()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--puerto", type=int, required=True)
    ap.add_argument("--que", default="todo",
                    choices=["todo", "orden", "ventana", "grilla", "capturas"])
    ap.add_argument("--salida", default=str(
        SDK / ".project/phases/14-la-demo-que-va-al-escenario/tasks/T-10"))
    args = ap.parse_args()

    server = subprocess.Popen(
        ["node", "server.mjs", f"demo/{DEMO.name}"],
        cwd=SDK, env={**os.environ, "PORT": str(args.puerto)},
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    print(f"server PID {server.pid} en el puerto {args.puerto}")
    time.sleep(1.0)
    rojo = 0
    try:
        if args.que in ("todo", "orden"):
            rojo += medir_orden(args.puerto)
        if args.que in ("todo", "ventana"):
            rojo += medir_ventana(args.puerto)
        if args.que in ("todo", "grilla"):
            rojo += medir_grilla(args.puerto)
        if args.que in ("todo", "capturas"):
            capturar(args.puerto, args.salida)
    finally:
        # Por el PID que se guardó, nunca por patrón: en esta máquina hay otras
        # demos corriendo y un patrón que parece propio alcanza a las de al lado.
        server.send_signal(signal.SIGTERM)
        server.wait(timeout=10)
        print(f"\nserver {server.pid} bajado")

    print("\nVERDE: las mediciones dieron lo esperado y los controles también."
          if rojo == 0 else f"\nROJO: {rojo} fila(s) no dieron lo esperado.")
    sys.exit(1 if rojo else 0)


if __name__ == "__main__":
    main()
