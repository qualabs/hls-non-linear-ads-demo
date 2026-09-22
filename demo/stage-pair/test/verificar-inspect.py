#!/usr/bin/env python3
"""Lo que `inspect.html` muestra está LEÍDO, y las capturas con que se mira.

La verificación principal de esta página es mirarla: es interfaz, y lo que decide
si cumple es si un dato que David tiene que señalar se distingue en un proyector.
Eso lo hace `--que capturas`, y lo mira una persona.

Lo que sí es medible es la otra mitad del contrato de la T-08: que **lo que la
página muestra lo leyó y no lo transcribió**. Eso no se ve en una captura —una
transcripción y una lectura se dibujan igual—, así que se mide moviendo la fuente
y mirando moverse la pantalla.

════════════════════════════════════════════════════════════════════════════════
LAS DOS MEDICIONES, Y EL CONTROL DE CADA UNA
════════════════════════════════════════════════════════════════════════════════

1. LO QUE MUESTRA ESTÁ LEÍDO  (`--que lectura`)

   Tres comparaciones contra el disco, leído por este script y no por la página:

       el rango de la playlist   contra las líneas #EXT-X-DATERANGE del break
       el pedido                 contra el nombre del asset-list de ese break
       la respuesta              contra los bytes del archivo que se pidió

   **Y un movimiento de la fuente, que es el control que importa**, porque una
   página que transcribiera pasaría las tres comparaciones de arriba el día que
   se escribió. `CONTROL_DURACION_CONCURRENTE=24` mueve las DOS fuentes de una
   vez, y por eso es este y no otro: reescribe los asset-lists concurrentes, y el
   tag toma su PLANNED-DURATION de la declaración de ese mismo archivo.

       la playlist del disco  ->  PLANNED-DURATION 12 -> 24, y la tarjeta 1 tiene
                                  que mostrar el tag nuevo
       el asset-list          ->  duration 12 -> 24, y la tarjeta 3 tiene que
                                  mostrar el archivo nuevo byte por byte

   **El START-DATE no sirve de control y vale decir por qué**: volver a señalar no
   lo mueve. Se resuelve contra el EXT-X-PROGRAM-DATE-TIME del empaquetado, así
   que es función pura de ese empaquetado y sólo cambia si el contenido se vuelve
   a empaquetar.

   **Y el comparador se prueba contra algo que sabe que está**: la misma
   comparación contra el asset-list de OTRO break tiene que dar DISTINTO. Sin
   eso, tres verdes sólo prueban que el comparador dice verde.

2. EL PARÁMETRO ESTÁ EN LA PANTALLA Y EN LA RED  (`--que parametro`)

   La T-07 ya midió que `qa-decoder-count` viaja. Lo que esta página agrega es
   que **se lee en cámara**, así que se compara lo que la tarjeta 2 dibuja contra
   lo que el navegador pidió de verdad, en las tres posiciones del switch.

   **El control negativo es la posición "sin declarar"**: ahí la pantalla y la
   red tienen que salir las dos SIN el parámetro. Si apareciera, lo que la página
   está dibujando no es la petición.

3. LAS CAPTURAS  (`--que capturas`)

   A 1907 de ancho y a 400x780, que son los dos anchos contra los que este
   proyecto ya mide, con el aviso EN PANTALLA. Se guardan donde diga `--salida`.

════════════════════════════════════════════════════════════════════════════════
USO
════════════════════════════════════════════════════════════════════════════════
    verificar-inspect.py --puerto 8097 [--que todo|lectura|parametro|capturas]
                         [--salida <dir>]

Levanta su propio `server.mjs` en ese puerto y lo baja **por el PID que guardó**.
El puerto se pasa a propósito y no se adivina: en esta máquina corren demos de
Nicolás en 8080, 8081 y 8082.

El intérprete es el del skill playwright, resuelto por el mismo camino que
`test/medir-escalera.py`. Se puede pisar con `PY=<ruta>`.
"""

import argparse
import json
import os
import re
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
PARAMETRO = STAGE["decodificadores"]["parametro"]
POSICIONES = STAGE["decodificadores"]["posiciones"]
BREAKS = STAGE["breaks"]
RICA = DEMO / STAGE["playlists"]["rica"]

ETIQUETA = {None: "not declared"}


def etiqueta(posicion):
    return ETIQUETA.get(posicion["valor"], str(posicion["valor"]))


def senalizar(control=None):
    entorno = dict(os.environ)
    if control:
        entorno["CONTROL_DURACION_CONCURRENTE"] = str(control)
    subprocess.run([str(DEMO / "scripts/senalizar-contenido.sh")],
                   cwd=DEMO, env=entorno, check=True, stdout=subprocess.DEVNULL)


# ── el disco, leído por este script y no por la página ───────────────────────

def rangos_del_disco(break_id):
    prefijo = f'ID="AD-{break_id.upper()}-'
    return [l for l in RICA.read_text().split("\n")
            if l.startswith("#EXT-X-DATERANGE:") and prefijo in l]


def asset_list_del_disco(break_id, respuesta="rica"):
    brk = next(b for b in BREAKS if b["id"] == break_id)
    return (DEMO / "signalling" / brk[respuesta]).read_text()


def start_date(linea):
    m = re.search(r'START-DATE="([^"]+)"', linea)
    return m.group(1) if m else None


class Pagina:
    """inspect.html abierta, con los pedidos capturados de la red."""

    def __init__(self, pw, puerto, ancho=1907, alto=1000):
        self.navegador = pw.chromium.launch(
            channel="chrome",
            args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
        )
        self.page = self.navegador.new_page(viewport={"width": ancho, "height": alto})
        self.pedidos = []
        # De la RED y no del DOM: es la petición que el navegador emitió.
        self.page.on("request", lambda r: self.pedidos.append(r.url))
        self.url = f"http://localhost:{puerto}/inspect.html"

    def abrir(self):
        self.page.goto(self.url)
        self.page.wait_for_function("() => window.demo && window.demo.video")
        return self

    def elegir(self, indice):
        """El switch, tocado como lo toca una persona: el botón."""
        self.pedidos.clear()
        self.page.get_by_role("button", name=etiqueta(POSICIONES[indice]), exact=True).click()
        self.page.wait_for_function(
            "(v) => window.demo && window.demo.posicion && window.demo.posicion.valor === v",
            arg=POSICIONES[indice]["valor"],
        )

    def ir_al_break(self, brk, adentro=True):
        """Al break, y opcionalmente hasta que el aviso esté EN PANTALLA."""
        objetivo = brk["offset"] + (2 if adentro else -6)
        self.page.evaluate("(s) => window.demo.irA(s)", objetivo)
        self.page.wait_for_function(
            "(id) => window.demo.mostrado === id", arg=brk["id"], timeout=30000
        )
        if adentro:
            # Que el aviso esté RESUELTO no alcanza para una captura: hay que
            # esperar a que el elemento haya dibujado un cuadro después de la
            # búsqueda, o lo que se fotografía es el negro del buffer y no la
            # composición. Se espera a que esté reproduciendo de verdad y se le
            # da una vuelta de reloj.
            self.page.wait_for_function(
                "() => window.demo.provider.activeAt(window.demo.video.currentTime).length > 0",
                timeout=30000,
            )
            self.page.wait_for_function(
                "() => { const v = window.demo.video;"
                " return !v.paused && v.readyState >= 3 && v.currentTime > 0; }",
                timeout=30000,
            )
            self.page.wait_for_timeout(1500)

    def esperar_respuesta(self, break_id):
        self.page.wait_for_function(
            "(id) => (window.demo.intercambio[id] || {}).cuerpo != null",
            arg=break_id, timeout=30000,
        )

    # lo que está DIBUJADO, que es lo que se ve en cámara
    def rangos_en_pantalla(self):
        # Se deshace el plegado en comas que la página hace para que la línea
        # entre en el ancho de la tarjeta: lo que se compara contra el disco es
        # el tag, no cómo está partido.
        return [re.sub(r",\n\s+", ",", t) for t in
                self.page.locator("#ranges .range__line").all_text_contents()]

    def pedido_en_pantalla(self):
        return self.page.locator("#request").inner_text().strip()

    def respuesta_en_pantalla(self):
        return self.page.locator("#answer").inner_text()

    def asset_lists_de_la_red(self):
        return sorted({u for u in self.pedidos if "/signalling/asset-list-break-" in u})

    def cerrar(self):
        self.navegador.close()


def fila(nombre, ok, detalle=""):
    print(f"    {nombre:<52} {'VERDE' if ok else 'ROJO'}   {detalle}")
    return 0 if ok else 1


# ── 1. lo que muestra está leído ─────────────────────────────────────────────

def medir_lectura(puerto):
    from playwright.sync_api import sync_playwright
    print("\n== 1. LO QUE LA PÁGINA MUESTRA ESTÁ LEÍDO, NO TRANSCRIPTO ==")
    rojo = 0
    with sync_playwright() as pw:
        pagina = Pagina(pw, puerto)
        try:
            senalizar()
            pagina.abrir()
            brk = BREAKS[0]
            pagina.ir_al_break(brk, adentro=False)
            pagina.esperar_respuesta(brk["id"])

            print(f"\n  break {brk['id'].upper()}, escalón «not declared» (playlist rica)")
            disco_rangos = rangos_del_disco(brk["id"])
            pantalla_rangos = pagina.rangos_en_pantalla()
            rojo += fila("los rangos de la pantalla == los del archivo",
                         pantalla_rangos == disco_rangos,
                         f"{len(pantalla_rangos)} rango(s)")
            for l in pantalla_rangos:
                print(f"      {l[:118]}")

            pedido = pagina.pedido_en_pantalla()
            esperado_uri = f"/signalling/{brk['rica']}"
            rojo += fila("el pedido dibujado nombra el asset-list del break",
                         pedido.startswith(esperado_uri), pedido)

            disco_json = asset_list_del_disco(brk["id"])
            pantalla_json = pagina.respuesta_en_pantalla()
            rojo += fila("la respuesta dibujada == los bytes del archivo",
                         pantalla_json.strip() == disco_json.strip(),
                         f"{len(pantalla_json)} car.")

            # EL COMPARADOR, PROBADO CONTRA ALGO QUE SABE QUE ESTÁ DISTINTO.
            otro = asset_list_del_disco(BREAKS[1]["id"])
            rojo += fila("CONTROL del comparador: contra el asset-list de otro break",
                         pantalla_json.strip() != otro.strip(), "tiene que dar DISTINTO")

            # ── EL CONTROL: SE MUEVE LA FUENTE Y TIENE QUE MOVERSE LA PANTALLA ──
            # `CONTROL_DURACION_CONCURRENTE` reescribe los asset-lists concurrentes
            # con otra duración, y el tag concurrente toma su PLANNED-DURATION de la
            # declaración de ese mismo archivo. Así que un solo control mueve LAS DOS
            # fuentes que la página muestra: la playlist de la tarjeta 1 y el JSON de
            # la tarjeta 3. Una página que transcribiera pasaría las comparaciones de
            # arriba el día que se escribió y fallaría acá.
            #
            # No se usa el START-DATE para esto, y vale decir por qué: volver a
            # señalar NO lo mueve. Se resuelve contra el EXT-X-PROGRAM-DATE-TIME del
            # empaquetado, así que es función pura de ese empaquetado y sólo cambia
            # si el contenido se vuelve a empaquetar, que es minutos de ffmpeg.
            print("\n  EL CONTROL — CONTROL_DURACION_CONCURRENTE=24 reescribe la fuente")
            senalizar(control=24)
            pagina.page.reload()
            pagina.page.wait_for_function("() => window.demo && window.demo.video")
            pagina.esperar_respuesta(brk["id"])

            con_rangos = pagina.rangos_en_pantalla()
            disco_rangos_2 = rangos_del_disco(brk["id"])
            duraciones = [re.search(r"PLANNED-DURATION=(\S+)", l).group(1) for l in con_rangos]
            print(f"      PLANNED-DURATION en pantalla, antes  "
                  f"{[re.search(r'PLANNED-DURATION=(\S+)', l).group(1) for l in pantalla_rangos]}")
            print(f"      PLANNED-DURATION en pantalla, ahora  {duraciones}")
            rojo += fila("el tag de la pantalla cambió", con_rangos != pantalla_rangos)
            rojo += fila("y es el de la playlist nueva, línea por línea",
                         con_rangos == disco_rangos_2)

            con_control = pagina.respuesta_en_pantalla()
            disco_control = asset_list_del_disco(brk["id"])
            rojo += fila("el JSON de la pantalla cambió",
                         con_control.strip() != pantalla_json.strip())
            rojo += fila("y es el archivo nuevo, byte por byte",
                         con_control.strip() == disco_control.strip(),
                         "duration: " + str(json.loads(con_control)["ASSETS"][0]
                                            ["X-AD-CREATIVE-SIGNALING"]["payload"][0]["duration"]))
        finally:
            pagina.cerrar()
            senalizar()  # el disco vuelve a lo que estaba
    return rojo


# ── 2. el parámetro, en la pantalla y en la red ──────────────────────────────

def medir_parametro(puerto):
    from playwright.sync_api import sync_playwright
    print("\n== 2. EL PARÁMETRO SE LEE EN CÁMARA, Y ES EL QUE SALIÓ POR LA RED ==")
    rojo = 0
    with sync_playwright() as pw:
        pagina = Pagina(pw, puerto)
        try:
            pagina.abrir()
            brk = BREAKS[0]
            for indice, posicion in enumerate(POSICIONES):
                pagina.elegir(indice)
                pagina.esperar_respuesta(brk["id"])
                pantalla = pagina.pedido_en_pantalla()
                red = [u for u in pagina.asset_lists_de_la_red() if f"break-{brk['id']}-" in u]
                print(f"\n  posición «{etiqueta(posicion)}»  ->  playlist {posicion['respuesta']}")
                print(f"      pantalla  {pantalla}")
                for u in red:
                    print(f"      red       {u.split(f'localhost:{puerto}')[-1]}")
                esperado = posicion["valor"]
                if esperado is None:
                    ok_p = PARAMETRO not in pantalla.split("—")[0]
                    ok_r = bool(red) and all(f"{PARAMETRO}=" not in u for u in red)
                    rojo += fila("CONTROL NEGATIVO: la pantalla no lleva el parámetro", ok_p)
                    rojo += fila("CONTROL NEGATIVO: la red tampoco", ok_r)
                else:
                    ok_p = f"?{PARAMETRO}={esperado}" in pantalla
                    ok_r = bool(red) and all(f"{PARAMETRO}={esperado}" in u for u in red)
                    rojo += fila(f"la pantalla dibuja {PARAMETRO}={esperado}", ok_p)
                    rojo += fila("y la red llevó lo mismo", ok_r)
        finally:
            pagina.cerrar()
    return rojo


# ── 3. las capturas ──────────────────────────────────────────────────────────

def capturar(puerto, salida):
    from playwright.sync_api import sync_playwright
    salida = Path(salida)
    salida.mkdir(parents=True, exist_ok=True)
    print(f"\n== 3. LAS CAPTURAS -> {salida} ==")
    hechas = []
    with sync_playwright() as pw:
        for ancho, alto in ((1907, 1000), (400, 780)):
            pagina = Pagina(pw, puerto, ancho, alto)
            try:
                pagina.abrir()
                for indice, posicion in enumerate(POSICIONES):
                    pagina.elegir(indice)
                    breaks = BREAKS if ancho == 1907 else BREAKS[:1]
                    for brk in breaks:
                        pagina.ir_al_break(brk, adentro=True)
                        pagina.esperar_respuesta(brk["id"])
                        nombre = (f"inspect-{ancho}-paso-"
                                  f"{etiqueta(posicion).replace(' ', '-')}-break-{brk['id']}.png")
                        pagina.page.screenshot(path=str(salida / nombre), full_page=True)
                        hechas.append(nombre)
                        print(f"    {nombre}")
            finally:
                pagina.cerrar()
    return hechas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--puerto", type=int, required=True)
    ap.add_argument("--que", default="todo", choices=["todo", "lectura", "parametro", "capturas"])
    ap.add_argument("--salida", default=str(
        SDK / ".project/phases/14-la-demo-que-va-al-escenario/tasks/T-08"))
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
        if args.que in ("todo", "lectura"):
            rojo += medir_lectura(args.puerto)
        if args.que in ("todo", "parametro"):
            rojo += medir_parametro(args.puerto)
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
