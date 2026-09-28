#!/usr/bin/env python3
"""Las tres mediciones de `index.html`, sobre la página real y con sus controles.

No hay banco acá: lo que se mide es **la página que se le muestra a Apple**, con
su switch, sus dos players y su bloque de integrador. Un banco mediría otra cosa,
y la T-02 ya midió en aislamiento; el contrato de la T-07 pide medir *el recorrido
real*.

════════════════════════════════════════════════════════════════════════════════
LAS TRES MEDICIONES, Y EL CONTROL DE CADA UNA
════════════════════════════════════════════════════════════════════════════════

1. EL PARÁMETRO VIAJA  (`--que parametro`)

   Se lee **de la red**, interceptando los pedidos que el navegador hizo de
   verdad, y no del código de la página ni de lo que la página imprime. Por cada
   posición del switch:

       sin declarar  ->  la URI del asset-list sale SIN `qa-decoder-count`
       1             ->  `?qa-decoder-count=1`
       2             ->  `?qa-decoder-count=2`

   **El control negativo es la posición "sin declarar".** Si ahí también
   apareciera el parámetro, lo que el instrumento está leyendo no es la petición.
   Y el contra-control es que en las otras dos SÍ aparece, con el valor exacto:
   un lector roto que no encuentra nunca nada daría verde en la primera fila y
   rojo en las otras dos.

2. LA CUENTA DE DECODIFICADORES POR ESCALÓN  (`--que decodificadores`)

   Es la premisa del ADR 0084 medida donde importa. Se cuentan los elementos
   `<video>` vivos **adentro del contenedor de nuestro pane** mientras el aviso
   está en pantalla, en los tres breaks:

       escalón magro (1)  ->  1 elemento: el contenido primario, y el aviso es un `<img>`
       escalón rico  (2)  ->  2 elementos: el primario y el aviso

   **El escalón rico es el control.** Si los dos dieran lo mismo, lo medido sería
   el instrumento y no la composición; si el magro diera dos, la premisa del
   ADR 0084 es falsa y la escalera no tiene escalones. Se toma además la cuenta
   FUERA del break, que tiene que ser 1 en los dos escalones: es la referencia
   contra la que el 2 del escalón rico significa algo.

   Acá sí se busca entre break y break, y es legítimo: lo que se mide es la
   composición del DOM y no un instante del reloj.

3. LOS DOS PANES SIGUEN ENTRANDO Y SALIENDO JUNTOS  (`--que tramo`)

   Es la medición que la T-06 dejó verde sobre su banco, repetida **sobre
   index.html**, que es donde el par termina argumentando. El instrumento es el
   mismo que la fase 03 eligió —se lee el estado del navegador y no una captura—
   y la mecánica está en la cabecera de `banco-de-medicion.html`.

   **El control es el mismo**: `CONTROL_DURACION_CONCURRENTE` escribe los tres
   asset-lists concurrentes con una duración distinta a la de su break, que es
   exactamente el defecto de `compatibility-pair`, y tiene que dar DISTINTO.

   Acá **no** se busca: escribir un `currentTime` es intervenir sobre el mismo
   reloj que se está midiendo.

════════════════════════════════════════════════════════════════════════════════
USO
════════════════════════════════════════════════════════════════════════════════
    medir-escalera.py --puerto 8097 [--que todo|parametro|decodificadores|tramo]

Levanta su propio `server.mjs` en ese puerto y lo baja **por el PID que guardó**.
El puerto se pasa a propósito y no se adivina: en esta máquina corren demos de
Nicolás en 8080, 8081 y 8082.

El intérprete es el del skill playwright, resuelto por el mismo camino que
`test/medir-tramo-invertido.py`. Se puede pisar con `PY=<ruta>`.
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
PARAMETRO = STAGE["decodificadores"]["parametro"]
POSICIONES = STAGE["decodificadores"]["posiciones"]

# La misma holgura que la medición de la T-06, y por la misma razón: se muestrea
# cada 100 ms y los dos panes son dos players que no comparten reloj de muestreo.
# El defecto que se busca vale DOCE segundos.
HOLGURA = 0.5

ETIQUETA = {None: "not declared"}


def etiqueta(posicion):
    return ETIQUETA.get(posicion["valor"], str(posicion["valor"]))


# ── el sampler del tramo invertido, corriendo ADENTRO de la página ───────────
# Va adentro y no en Python porque un muestreo hecho de a un `evaluate` por
# lectura mide también la latencia del puente, y son dos lecturas cada 100 ms.
# Es el mismo muestreo que `test/banco-de-medicion.html`, sobre `window.demo`.
SAMPLER = """
async (breaks) => {
  const d = window.demo;
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  const enAdStock = () =>
    (d.stock.hls.interstitialsManager?.playingItem?.event?.identifier ?? null) !== null;
  const relojStock = () => {
    const t = d.stock.hls.interstitialsManager?.primary?.currentTime;
    return Number.isFinite(t) ? t : d.stock.programme.currentTime;
  };
  const enAdDemo = () => d.provider.activeAt(d.video.currentTime).length > 0;
  const relojDemo = () => d.video.currentTime;

  for (let i = 0; i < 300; i++) {
    if (d.stock.hls.interstitialsManager?.primary && d.video.readyState >= 2) break;
    await dormir(100);
  }

  const panes = { stock: { enAd: enAdStock, reloj: relojStock },
                  demo:  { enAd: enAdDemo,  reloj: relojDemo } };
  const filas = breaks.map((b) => ({ break: b.id, stock: {}, demo: {} }));
  const previo = { stock: null, demo: null };
  const dentro = { stock: false, demo: false };
  const cursor = { stock: 0, demo: 0 };

  const ultimo = breaks[breaks.length - 1];
  const limite = (ultimo.offset + ultimo.duracion + 60) * 1000;
  const arranque = Date.now();
  while (Date.now() - arranque < limite) {
    for (const [nombre, pane] of Object.entries(panes)) {
      const ahora = pane.enAd();
      const reloj = pane.reloj();
      const fila = filas[cursor[nombre]]?.[nombre];
      if (fila) {
        if (!dentro[nombre] && ahora && fila.entra === undefined) fila.entra = previo[nombre] ?? reloj;
        if (dentro[nombre] && !ahora && fila.entra !== undefined && fila.sale === undefined) {
          fila.sale = reloj;
          cursor[nombre] += 1;
        }
      }
      dentro[nombre] = ahora;
      if (!ahora) previo[nombre] = reloj;
    }
    if (cursor.stock >= breaks.length && cursor.demo >= breaks.length) return filas;
    await dormir(100);
  }
  return filas.map((f) => ({ ...f, timeout: true }));
}
"""

# La composición, contada ADENTRO del contenedor de nuestro pane. Se cuenta ahí y
# no en el documento entero porque el documento tiene además el `<video>` del pane
# de fábrica, que no es parte de la composición que la librería arma.
COMPOSICION = """
() => {
  const d = window.demo;
  const caja = d.concurrent.container;
  const activas = d.provider.activeAt(d.video.currentTime);
  return {
    enAd: activas.length > 0,
    t: d.video.currentTime,
    videos: caja.querySelectorAll('video').length,
    imagenes: caja.querySelectorAll('img').length,
    medios: [...new Set(activas.flatMap((e) => e.elements)
      .filter((el) => !el.primary).map((el) => el.mediaType || 'null'))],
    tipos: activas.map((e) => e.type)
  };
}
"""


def senalizar(control=None):
    entorno = dict(os.environ)
    if control:
        entorno["CONTROL_DURACION_CONCURRENTE"] = str(control)
    subprocess.run([str(DEMO / "scripts/senalizar-contenido.sh")],
                   cwd=DEMO, env=entorno, check=True, stdout=subprocess.DEVNULL)


class Pagina:
    """index.html abierta, con los pedidos del asset-list capturados de la red."""

    def __init__(self, pw, puerto):
        self.navegador = pw.chromium.launch(
            channel="chrome",
            args=["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
        )
        self.page = self.navegador.new_page(viewport={"width": 1907, "height": 1000})
        self.pedidos = []
        # De la RED y no del DOM: es la petición que el navegador emitió.
        self.page.on("request", lambda r: self.pedidos.append(r.url))
        self.url = f"http://localhost:{puerto}/index.html"

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

    def asset_lists(self):
        return [u for u in self.pedidos if "/signalling/asset-list-break-" in u]

    def cerrar(self):
        self.navegador.close()


# ── 1. el parámetro ──────────────────────────────────────────────────────────

def medir_parametro(puerto):
    from playwright.sync_api import sync_playwright
    print("\n== 1. EL PARÁMETRO VIAJA — leído de la red, no del código ==")
    rojo = 0
    with sync_playwright() as pw:
        pagina = Pagina(pw, puerto)
        try:
            pagina.abrir()
            for indice, posicion in enumerate(POSICIONES):
                pagina.elegir(indice)
                pagina.page.wait_for_function(
                    "(n) => window.demo.pedidos.length >= n", arg=len(STAGE["breaks"])
                )
                # DISTINTAS, y no la lista cruda: el pedido del último break de
                # la corrida anterior puede llegar después del click que rearma,
                # así que la lista cruda trae una repetición que no es un pedido
                # de más. Lo que la medición afirma es de QUÉ archivos se pidieron
                # y con qué parámetro, y eso no cambia. Un pedido del escalón
                # equivocado sí rompería la fila: llevaría otro valor del
                # parámetro, o ninguno, y las dos ramas de abajo lo cazan.
                urls = sorted(set(pagina.asset_lists()))
                esperado = posicion["valor"]
                print(f"\n  posición «{etiqueta(posicion)}»  ->  playlist {posicion['respuesta']}")
                for u in urls:
                    print(f"    {u.split('localhost:' + str(puerto))[-1]}")
                con = [u for u in urls if f"{PARAMETRO}=" in u]
                if esperado is None:
                    ok = len(urls) == len(STAGE["breaks"]) and not con
                    print(f"    -> {len(urls)} pedidos, {len(con)} con {PARAMETRO}."
                          f"  {'VERDE: el control negativo no lleva el parámetro' if ok else 'ROJO'}")
                else:
                    ok = (len(urls) == len(STAGE["breaks"])
                          and all(f"{PARAMETRO}={esperado}" in u for u in urls))
                    print(f"    -> {len(urls)} pedidos, todos con {PARAMETRO}={esperado}."
                          f"  {'VERDE' if ok else 'ROJO'}")
                rojo += 0 if ok else 1
        finally:
            pagina.cerrar()
    return rojo


# ── 2. los decodificadores ───────────────────────────────────────────────────

def medir_decodificadores(puerto):
    from playwright.sync_api import sync_playwright
    print("\n== 2. LA CUENTA DE ELEMENTOS <video> POR ESCALÓN, SOBRE LA PÁGINA REAL ==")
    print("   (adentro del contenedor de nuestro pane; el escalón rico es el control)")
    rojo = 0
    esperado = {1: 1, 2: 2, None: 2}
    with sync_playwright() as pw:
        pagina = Pagina(pw, puerto)
        try:
            pagina.abrir()
            for indice, posicion in enumerate(POSICIONES):
                pagina.elegir(indice)
                print(f"\n  posición «{etiqueta(posicion)}»  ->  playlist {posicion['respuesta']}")
                for brk in STAGE["breaks"]:
                    fuera, dentro = muestrear_break(pagina.page, brk)
                    quiere = esperado[posicion["valor"]]
                    ok = dentro["videos"] == quiere and fuera["videos"] == 1
                    print(
                        f"    break {brk['id'].upper()}  "
                        f"fuera del break (t={fuera['t']:6.2f}): {fuera['videos']} video / {fuera['imagenes']} img   "
                        f"DENTRO: {dentro['videos']} video / {dentro['imagenes']} img   "
                        f"medio del aviso: {', '.join(dentro['medios']) or '(ninguno)'}   "
                        f"layout: {', '.join(dentro['tipos'])}   "
                        f"{'OK' if ok else 'ROJO'}"
                    )
                    rojo += 0 if ok else 1
        finally:
            pagina.cerrar()
    return rojo


def muestrear_break(page, brk):
    """La composición justo antes del break y la más poblada de adentro.

    Adentro se toma el MÁXIMO y no una muestra: lo que la premisa afirma es
    cuántos decodificadores la composición llega a tener vivos a la vez.

    **Y la referencia de "fuera del break" se toma a más de tres segundos del
    break**, que no es un margen de comodidad: `bringAhead` construye el nodo del
    aviso hasta 3 s antes de que se vea (medido en la T-02), así que una muestra
    tomada a dos segundos del break cuenta un elemento que todavía no está en
    pantalla y la referencia deja de ser la referencia. Se vio: con el escalón
    rico, el break C daba 2 elementos `<video>` FUERA del break.
    """
    page.evaluate("(t) => window.demo.irA(t)", max(0.5, brk["offset"] - 9))
    esperar(page, lambda m: not m["enAd"] and m["t"] >= brk["offset"] - 9, 40)
    fuera = esperar(page, lambda m: not m["enAd"] and m["t"] <= brk["offset"] - 4, 40)
    # Dos muestras seguidas y no una: el renderizador limpia en su propio bucle de
    # cuadro, así que la muestra inmediatamente posterior a una búsqueda puede
    # todavía contar el nodo del break del que se acaba de salir. Es el
    # instrumento y no la página: medido aparte, una salida natural de un break
    # deja UN elemento en el cuadro siguiente.
    time.sleep(0.4)
    segunda = page.evaluate(COMPOSICION)
    if not segunda["enAd"] and segunda["t"] <= brk["offset"] - 3.5:
        fuera = segunda
    esperar(page, lambda m: m["enAd"], 30)
    dentro = page.evaluate(COMPOSICION)
    fin = time.time() + brk["duracion"] - 1
    while time.time() < fin:
        m = page.evaluate(COMPOSICION)
        if not m["enAd"]:
            break
        if m["videos"] > dentro["videos"] or m["imagenes"] > dentro["imagenes"]:
            dentro = m
        time.sleep(0.2)
    return fuera, dentro


def esperar(page, condicion, segundos):
    fin = time.time() + segundos
    while time.time() < fin:
        m = page.evaluate(COMPOSICION)
        if condicion(m):
            return m
        time.sleep(0.1)
    raise TimeoutError("la página no llegó al estado esperado")


# ── 3. el tramo invertido ────────────────────────────────────────────────────

def medir_tramo(puerto, control_duracion):
    from playwright.sync_api import sync_playwright
    rojo = 0
    with sync_playwright() as pw:
        def una_pasada(titulo, esperado_igual):
            pagina = Pagina(pw, puerto)
            try:
                pagina.abrir()
                filas = pagina.page.evaluate(SAMPLER, STAGE["breaks"])
            finally:
                pagina.cerrar()
            return informe_tramo(titulo, filas, esperado_igual)

        senalizar()
        rojo += una_pasada("3. LOS DOS PANES ENTRAN Y SALEN JUNTOS — index.html, escalón rico", True)
        senalizar(control=control_duracion)
        rojo += una_pasada(
            f"   EL CONTROL — el break concurrente dura {control_duracion} s y su lineal no", False)
        senalizar()
    return rojo


def informe_tramo(titulo, filas, esperado_igual):
    print(f"\n== {titulo} ==")
    rojo = 0
    for fila in filas:
        s, d = fila["stock"], fila["demo"]
        if any(k not in x for x in (s, d) for k in ("entra", "sale")):
            print(f"  break {fila['break'].upper()}  INCOMPLETO  {json.dumps(fila)}")
            rojo += 1
            continue
        de, ds = abs(s["entra"] - d["entra"]), abs(s["sale"] - d["sale"])
        igual = de <= HOLGURA and ds <= HOLGURA
        print(f"  break {fila['break'].upper()}  "
              f"fábrica {s['entra']:7.3f} -> {s['sale']:7.3f}   "
              f"nuestro {d['entra']:7.3f} -> {d['sale']:7.3f}   "
              f"delta entrada {de:6.3f} s  salida {ds:6.3f} s   "
              f"{'IGUAL   ' if igual else 'DISTINTO'}")
        if igual is not esperado_igual:
            rojo += 1
    return rojo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--puerto", type=int, required=True)
    ap.add_argument("--que", default="todo",
                    choices=["todo", "parametro", "decodificadores", "tramo"])
    ap.add_argument("--control-duracion", type=float, default=24.0)
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
        senalizar()
        if args.que in ("todo", "parametro"):
            rojo += medir_parametro(args.puerto)
        if args.que in ("todo", "decodificadores"):
            rojo += medir_decodificadores(args.puerto)
        if args.que in ("todo", "tramo"):
            rojo += medir_tramo(args.puerto, args.control_duracion)
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
