"""T-07 -- el pane del otro con nuestro cromo, y su propio riel.

Lo que mide y captura, en orden:

  1. LOS DOS PANES CON EL MISMO CROMO, a tamano real (dpr 1), AFUERA y ADENTRO
     de un break, y adentro de los dos breaks que hls.js resuelve distinto: el 1
     lo appendea en el lugar y el 2 le pasa el MediaSource al asset. De cada
     lectura sale, de los dos panes: las marcas de la barra con su caja y su
     color, el reloj que la barra MUESTRA (el texto, no la propiedad), la
     posicion de la perilla, y los numeros crudos del pane de fabrica -- el
     reloj del elemento, el del programa que reporta su manager, y los dos
     largos -- que son lo que dice si la barra esta mostrando el programa o el
     aviso.
  2. LAS TRES LECTURAS del ADR 0007, que son lo unico que separa un pane sin
     modificar de uno que lo parece: la configuracion de la instancia, la
     atribucion de los asset-list de la pestana de red, y los eventos agendados.
  3. LA CAJA QUE EL CONTRATO PIDE CONTRA LA QUE EL NAVEGADOR DIBUJO en el pane
     de la demo, adentro del break, porque la task toca los controles y la hoja
     de estilos de la pagina.

Con `controles` como segundo argumento corre en cambio los cuatro controles del
pane de fabrica, uno por uno, con la lectura de antes y de despues.

Uso:  python3 t07run.py <carpeta-de-salida> [controles]
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
MODO = sys.argv[2] if len(sys.argv) > 2 else "los-dos-panes"
URL = "http://localhost:8080/"
VIEWPORT = {"width": 1600, "height": 1000, "deviceScaleFactor": 1, "mobile": False}

# La barra de un pane, leida por lo que MUESTRA y no por lo que podria mostrar.
LA_BARRA = """
(id) => {
  const r = (n) => { const b = n.getBoundingClientRect();
    return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2),
             bottom: +b.bottom.toFixed(2) }; };
  const p = document.getElementById(id);
  const capa = p.querySelector('.qa-controls');
  if (!capa) return { hayCromo: false };
  const riel = p.querySelector('.qa-track__rail');
  const cajaRiel = r(riel);
  const marcas = [...p.querySelectorAll('.qa-mark')].map((n) => {
    const c = r(n);
    return { caja: c, color: n.style.background, titulo: n.title,
             izquierda: n.style.left, ancho: n.style.width,
             pxDebajoDelRiel: +(c.bottom - cajaRiel.bottom).toFixed(2) };
  });
  return {
    hayCromo: true,
    cromoArriba: capa.classList.contains('qa-controls--on'),
    transcurrido: p.querySelector('.qa-time--elapsed').textContent,
    total: p.querySelector('.qa-time--total').textContent,
    perillaIzquierda: p.querySelector('.qa-track__knob').style.left,
    rellenoAncho: p.querySelector('.qa-track__fill').style.width,
    botones: [...p.querySelectorAll('.qa-btn')].map((b) => b.getAttribute('aria-label')),
    marca: getComputedStyle(p.querySelector('.player')).getPropertyValue('--qa-accent').trim(),
    perillaColor: getComputedStyle(p.querySelector('.qa-track__knob')).backgroundColor,
    contenedor: r(p.querySelector('.player')),
    track: r(p.querySelector('.qa-track')), rail: cajaRiel,
    player: r(p), video: r(p.querySelector('video')),
    cuantasMarcas: marcas.length,
    cuantasCuelgan: marcas.filter((m) => m.pxDebajoDelRiel > 0.5).length,
    marcas
  };
}
"""

# Los numeros crudos de los dos panes en el mismo instante.
LOS_RELOJES = """
() => {
  const n = (x) => typeof x === 'number' && Number.isFinite(x) ? +x.toFixed(3) : x;
  const m = window.demo.stock.hls.interstitialsManager;
  const sv = document.getElementById('stock-video');
  const dv = window.demo.video;
  const item = m && m.playingItem;
  const ip = m && m.interstitialPlayer;
  return {
    demo: { elemT: n(dv.currentTime), elemDur: n(dv.duration), paused: dv.paused, muted: dv.muted,
            concurrentesActivos: window.demo.provider.activeAt(dv.currentTime).map((e) => e.type) },
    fabrica: {
      elemT: n(sv.currentTime), elemDur: n(sv.duration), paused: sv.paused, muted: sv.muted,
      programaT: n(m.primary.currentTime), programaDur: n(m.primary.duration),
      loQueLaFachadaDevuelve: { currentTime: n(window.demo.stock.programme.currentTime),
                                duration: n(window.demo.stock.programme.duration) },
      ad: item && item.event ? item.event.identifier : null,
      appendInPlace: item && item.event ? item.event.appendInPlace : null,
      breakSpan: item ? { start: n(item.start), end: n(item.end) } : null,
      enElAviso: ip ? { currentTime: n(ip.currentTime), duration: n(ip.duration) } : null,
      lineaDeEstado: document.getElementById('stock-state').textContent,
      rangosQueDeclara: window.demo.stock.programRanges(),
      // LA CONTRAFACTUAL, que es el otro lado de la decision de esta task:
      // que mostraria esta misma barra si se le hubiera pasado el elemento en
      // lugar de la fachada del programa. La aritmetica es la de `rangeSpan` y
      // `formatClock` de lib/controls.js, repetida aca para poder leerla sin
      // cambiar la pagina.
      siLaBarraLeyeraElElemento: (() => {
        const c01 = (x) => Math.max(0, Math.min(1, x));
        const reloj = (s) => !Number.isFinite(s) || s < 0 ? '--:--'
          : Math.floor(Math.floor(s) / 60) + ':' + String(Math.floor(s) % 60).padStart(2, '0');
        const largo = Number.isFinite(sv.duration) && sv.duration > 0 ? sv.duration : 0;
        const dibujables = window.demo.stock.programRanges().ranges.filter((x) => {
          if (!(largo > 0)) return false;
          const a = c01(x.startTime / largo);
          const b = c01((x.startTime + x.duration) / largo);
          return b > a;
        }).length;
        return { transcurrido: reloj(sv.currentTime), total: reloj(largo),
                 perillaPorCiento: largo ? +(c01(sv.currentTime / largo) * 100).toFixed(4) : 0,
                 marcasQueSePodrianDibujar: dibujables };
      })()
    },
    lineaDeEstadoDeLaDemo: document.getElementById('demo-state').textContent
  };
}
"""

LAS_TRES_LECTURAS = """
() => {
  const hls = window.demo.stock.hls;
  const m = hls.interstitialsManager;
  const recursos = performance.getEntriesByType('resource').map((x) => x.name)
    .filter((u) => /asset-list/.test(u));
  const cuenta = {};
  for (const u of recursos) cuenta[u] = (cuenta[u] || 0) + 1;
  return {
    unaLaInstancia: {
      cuantasOpciones: Object.keys(hls.userConfig || {}).length,
      userConfig: hls.userConfig,
      managerPresente: m != null,
      hud: document.getElementById('stock-hud').textContent,
      interstitialsControllerEnLaConfig: !!hls.config.interstitialsController,
      elOtroPaneCuantasOpciones: Object.keys(window.demo.hls.userConfig || {}).length,
      elOtroPaneManagerPresente: window.demo.hls.interstitialsManager != null
    },
    dosLaRed: {
      loQueEsaInstanciaDeclara: (m.events || []).map((e) => e.assetListUrl),
      assetListsDeLaPagina: cuenta,
      conHuellaDeControladorDeInterstitials: Object.keys(cuenta).filter((u) => /_HLS_primary_id/.test(u)),
      concurrentesConHuella: Object.keys(cuenta).filter((u) => /_HLS_primary_id/.test(u) && !/linear/.test(u)),
      concurrentesPelados: Object.keys(cuenta).filter((u) => !/_HLS_primary_id/.test(u) && !/linear/.test(u))
    },
    tresLosAgendados: {
      cuantos: (m.events || []).length,
      eventos: (m.events || []).map((e) => ({ id: e.identifier, clase: e.dateRange && e.dateRange.class })),
      getterDeLaPagina: window.demo.stock.scheduled,
      deLaClaseConcurrente: (m.events || []).filter(
        (e) => e.dateRange && e.dateRange.class === window.QualabsConcurrentHls.CONCURRENT_CLASS).length
    }
  };
}
"""

PIXELES = """
() => {
  const r6 = (n) => +n.toFixed(6);
  const capa = document.querySelector('.qa-concurrent-layer');
  const marco = capa.getBoundingClientRect();
  const v = window.demo.video;
  const ar = v.videoWidth / v.videoHeight;
  const w = Math.min(marco.width, marco.height * ar);
  const h = Math.min(marco.height, marco.width / ar);
  const area = { left: (marco.width - w) / 2, top: (marco.height - h) / 2, width: w, height: h };
  const out = [];
  for (const e of window.demo.provider.activeAt(v.currentTime)) {
    for (const el of e.elements) {
      const izq = (area.width * el.box.left) / 100;
      const arr = (area.height * el.box.top) / 100;
      const esperado = { left: area.left + izq, top: area.top + arr,
        width: area.width - izq - (area.width * el.box.right) / 100,
        height: area.height - arr - (area.height * el.box.bottom) / 100 };
      let medido;
      if (el.primary) { const b = v.getBoundingClientRect();
        medido = { left: b.x - marco.x, top: b.y - marco.y, width: b.width, height: b.height };
      } else { const n = capa.querySelector(`.ad[data-element-id="${el.id}"]`);
        if (!n) continue; const b = n.getBoundingClientRect();
        medido = { left: b.x - marco.x, top: b.y - marco.y, width: b.width, height: b.height }; }
      const delta = Math.max(...['left','top','width','height'].map((k) => Math.abs(medido[k] - esperado[k])));
      out.push({ elemento: el.id, primario: !!el.primary, deltaMaxPx: r6(delta) });
    }
  }
  return out;
}
"""

LISTO = """(() => {
  const a = [...document.querySelectorAll('.qa-concurrent-layer .ad')];
  if (a.length === 0) return false;
  return a.every(n => n.tagName === 'IMG' ? n.complete : n.readyState >= 2);
})()"""

salida = {"url": URL, "modo": MODO, "viewport": VIEWPORT}
consola = []


def caja(pg, id_):
    return pg.evaluate("(id) => { const b = document.getElementById(id).getBoundingClientRect();"
                       " return { x: b.x, y: b.y, w: b.width, h: b.height }; }", id_)


def despertar(pg, id_):
    """El cromo de ese pane arriba, con un mouse de verdad y dos movimientos.
    Con los dos elementos en pausa el cromo del otro no se cae al salir de su
    caja: `pointerleave` esconde solo si esta reproduciendo."""
    c = caja(pg, id_)
    pg.mouse.move(c["x"] + c["w"] * 0.5, c["y"] + c["h"] * 0.35)
    time.sleep(0.15)
    pg.mouse.move(c["x"] + c["w"] * 0.5 + 3, c["y"] + c["h"] * 0.35 + 2)
    time.sleep(0.2)
    pg.wait_for_function(
        "(id) => document.getElementById(id).querySelector('.qa-controls')"
        ".classList.contains('qa-controls--on')", arg=id_, timeout=5000)


def losDos(pg):
    despertar(pg, "stock-player")
    despertar(pg, "player")
    lectura = {"fabrica": pg.evaluate(LA_BARRA, "pane-stock"),
               "demo": pg.evaluate(LA_BARRA, "pane-demo"),
               "relojes": pg.evaluate(LOS_RELOJES)}
    r = lectura["relojes"]
    lectura["elMismoSegundoDelPrograma"] = {
        "demo": r["demo"]["elemT"], "fabrica": r["fabrica"]["programaT"],
        "diferenciaSegundos": round(abs(r["demo"]["elemT"] - r["fabrica"]["programaT"]), 3),
        "elMismoRelojEnLasDosBarras": lectura["demo"]["transcurrido"] == lectura["fabrica"]["transcurrido"]}
    return lectura


def pausar(pg):
    pg.evaluate("() => { window.demo.video.pause(); document.getElementById('stock-video').pause(); }")
    time.sleep(0.4)


def reproducir(pg):
    pg.evaluate("() => { window.demo.video.play().catch(() => {});"
                " document.getElementById('stock-video').play().catch(() => {}); }")


def enUnBreak(negado=False):
    return ("() => { const m = window.demo.stock.hls.interstitialsManager;"
            " const dentro = !!(m.playingItem && m.playingItem.event)"
            " || window.demo.provider.activeAt(window.demo.video.currentTime).length > 0;"
            f" return {'!dentro' if negado else 'dentro'}; }}")


def ubicar(pg, t):
    """Los dos panes en el mismo segundo del programa, VERIFICADO.

    Un seek escrito adentro de un break no siempre lo toma la maquinaria de
    hls.js -- el tag lleva X-RESTRICT=SKIP y la decision de que significa un
    seek ahi es de ese cliente y no nuestra-- asi que ubicar espera a estar
    afuera de un break antes de escribirlo, y despues comprueba donde
    aterrizaron los dos. Sin esta comprobacion la corrida anterior capturo un
    pane adentro del break 1 y el otro adentro del break 2, que es justo el
    cuadro que esta fase existe para que no pase."""
    for intento in range(4):
        if pg.evaluate(enUnBreak()):
            reproducir(pg)
            esperar(pg, enUnBreak(negado=True), 45)
            pausar(pg)
        pg.evaluate("(t) => { window.demo.video.currentTime = t;"
                    " window.demo.stock.hls.interstitialsManager.primary.currentTime = t; }", t)
        time.sleep(1.2)
        donde = pg.evaluate("() => ({ demo: window.demo.video.currentTime,"
                            " fabrica: window.demo.stock.hls.interstitialsManager.primary.currentTime })")
        if abs(donde["demo"] - t) < 2 and abs(donde["fabrica"] - t) < 2:
            return {"pedido": t, "aterrizaron": donde, "intentos": intento + 1}
    return {"pedido": t, "aterrizaron": donde, "intentos": 4, "fallo": True}


def esperar(pg, cond, s=40):
    t0 = time.time()
    while time.time() - t0 < s:
        if pg.evaluate(cond):
            return True
        time.sleep(0.2)
    return False


with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    ctx = b.contexts[0]
    pg = ctx.new_page()
    pg.on("console", lambda m: consola.append({"type": m.type, "text": m.text}))
    try:
        cdp = ctx.new_cdp_session(pg)
        cdp.send("Emulation.setDeviceMetricsOverride", VIEWPORT)
        pg.goto(URL, wait_until="load")
        pg.wait_for_function("!!(window.demo && window.demo.renderer && window.demo.stock)", timeout=30000)
        pg.wait_for_function("window.demo.video.readyState >= 2", timeout=30000)
        pg.wait_for_function("document.getElementById('stock-video').readyState >= 2", timeout=30000)
        pg.wait_for_function("window.demo.provider.programRanges().settled === true", timeout=30000)
        pg.wait_for_function("window.demo.stock.programRanges().ranges.length === 5", timeout=30000)
        pg.evaluate("() => document.querySelector('.pair').scrollIntoView({ block: 'center' })")
        time.sleep(0.4)

        if MODO == "controles":
            # LOS CUATRO CONTROLES, uno por uno, sobre el pane de fabrica.
            ubicar(pg, 8.0)
            reproducir(pg)
            time.sleep(1.0)
            uno = {}

            # 1. la pausa
            despertar(pg, "stock-player")
            antes = pg.evaluate(LOS_RELOJES)
            pg.click("#stock-player .qa-btn--play")
            time.sleep(0.8)
            uno["laPausa"] = {"antes": antes, "despues": pg.evaluate(LOS_RELOJES)}
            despertar(pg, "stock-player")
            pg.click("#stock-player .qa-btn--play")
            time.sleep(0.8)
            uno["laPausa"]["yDeVuelta"] = pg.evaluate(LOS_RELOJES)

            # 2. el audio, y que los dos panes no puedan sonar a la vez
            elMute = ("() => ({ fabrica: document.getElementById('stock-video').muted,"
                      " demo: window.demo.video.muted })")
            despertar(pg, "stock-player")
            uno["elAudio"] = {"antes": pg.evaluate(elMute)}
            pg.click("#stock-player .qa-btn--audio")
            time.sleep(0.5)
            uno["elAudio"]["fabricaDesmuteada"] = pg.evaluate(elMute)
            despertar(pg, "player")
            pg.click("#player .qa-btn--audio")
            time.sleep(0.5)
            uno["elAudio"]["yLaDemoDesmuteada"] = pg.evaluate(elMute)
            pg.evaluate("() => { window.demo.video.muted = true;"
                        " document.getElementById('stock-video').muted = true; }")

            # 3. el seek de la barra, afuera y adentro de un break
            def seekear(fraccion):
                c = pg.evaluate("() => { const b = document.querySelector('#stock-player .qa-track__rail')"
                                ".getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; }")
                pg.mouse.move(c["x"] + c["w"] * fraccion, c["y"] + c["h"] / 2)
                time.sleep(0.1)
                pg.mouse.down()
                pg.mouse.up()
                time.sleep(1.5)

            despertar(pg, "stock-player")
            antes = pg.evaluate(LOS_RELOJES)
            seekear(0.5)
            uno["elSeek"] = {"afueraDeUnBreak": {"antes": antes, "despues": pg.evaluate(LOS_RELOJES),
                                                 "fraccionPedida": 0.5}}
            ubicar(pg, 43.0)
            reproducir(pg)
            esperar(pg, "() => { const m = window.demo.stock.hls.interstitialsManager;"
                        " return !!(m.playingItem && m.playingItem.event); }")
            time.sleep(1.5)
            despertar(pg, "stock-player")
            antes = pg.evaluate(LOS_RELOJES)
            seekear(0.05)
            uno["elSeek"]["adentroDeUnBreak"] = {"antes": antes, "despues": pg.evaluate(LOS_RELOJES),
                                                 "fraccionPedida": 0.05}

            # 4. el fullscreen
            pausar(pg)
            elFull = ("() => ({ elemento: document.fullscreenElement ? document.fullscreenElement.id : null,"
                      " claseFull: !!document.querySelector('#stock-player .qa-controls.qa-controls--full') })")
            despertar(pg, "stock-player")
            pg.click("#stock-player .qa-btn--full")
            time.sleep(1.2)
            uno["elFullscreen"] = {"despuesDeApretar": pg.evaluate(elFull)}
            pg.screenshot(path=str(OUT / "t07-6-fullscreen-del-pane-de-fabrica.png"))
            pg.keyboard.press("Escape")
            time.sleep(1.2)
            uno["elFullscreen"]["yDeVuelta"] = pg.evaluate(elFull)
            salida["losCuatroControles"] = uno
        else:
            # ---- 1. AFUERA DEL BREAK, los dos panes a tamano real
            ubicado = ubicar(pg, 8.0)
            pausar(pg)
            salida["afueraDelBreak"] = losDos(pg)
            salida["afueraDelBreak"]["comoSeLlego"] = ubicado
            despertar(pg, "stock-player")
            despertar(pg, "player")
            pg.locator(".pair").screenshot(path=str(OUT / "t07-1-los-dos-panes-afuera-del-break.png"))
            pg.locator("#stock-player").screenshot(path=str(OUT / "t07-2-el-riel-del-pane-de-fabrica.png"))
            m = salida["afueraDelBreak"]["fabrica"]
            tira = {"x": m["contenedor"]["x"], "y": m["track"]["y"] - 10,
                    "width": m["contenedor"]["w"],
                    "height": (m["contenedor"]["bottom"] - m["track"]["y"]) + 10}
            despertar(pg, "stock-player")
            pg.screenshot(path=str(OUT / "t07-3-la-tira-del-pane-de-fabrica.png"), clip=tira)

            # ---- 2. ADENTRO de los dos breaks que hls.js resuelve distinto
            for n, (desde, cual, nombre) in enumerate([(18.0, "AD-1-LINEAR", "break-1-appendInPlace"),
                                                       (43.0, "AD-2-LINEAR", "break-2-mediasource-al-asset")],
                                                      start=1):
                ubicado = ubicar(pg, desde)
                reproducir(pg)
                # LOS DOS adentro del MISMO break, y el de fabrica adentro del que
                # se espera: sin el identificador la condicion la cumple un pane
                # adentro del break 1 mientras el otro esta en el 2.
                esperar(pg, "() => { const m = window.demo.stock.hls.interstitialsManager;"
                            f" return m.playingItem && m.playingItem.event"
                            f" && m.playingItem.event.identifier === '{cual}'"
                            " && window.demo.provider.activeAt(window.demo.video.currentTime).length > 0; }")
                pg.wait_for_function(LISTO, timeout=20000)
                time.sleep(2.0)
                pausar(pg)
                salida[f"adentroDel-{nombre}"] = losDos(pg)
                salida[f"adentroDel-{nombre}"]["comoSeLlego"] = ubicado
                salida[f"adentroDel-{nombre}"]["laCajaPedidaContraLaDibujada"] = pg.evaluate(PIXELES)
                despertar(pg, "stock-player")
                despertar(pg, "player")
                pg.locator(".pair").screenshot(
                    path=str(OUT / f"t07-4-{n}-los-dos-panes-adentro-del-{nombre}.png"))
                despertar(pg, "stock-player")
                pg.locator("#stock-player").screenshot(
                    path=str(OUT / f"t07-5-{n}-la-barra-del-pane-de-fabrica-adentro-del-{nombre}.png"))

            # ---- 3. LAS TRES LECTURAS, con el recorrido ya pasado por dos breaks
            salida["lasTresLecturas"] = pg.evaluate(LAS_TRES_LECTURAS)
            pg.screenshot(path=str(OUT / "t07-7-la-pagina-entera.png"), full_page=True)
    finally:
        salida["consola"] = [c for c in consola if c["type"] in ("error", "warning")]
        salida["consolaStock"] = [c["text"] for c in consola if c["text"].startswith("[stock] scheduled")][:1]
        (OUT / f"t07-la-lectura-{MODO}.json").write_text(
            json.dumps(salida, indent=2, default=str), encoding="utf8")
        pg.close()

print(json.dumps({k: v for k, v in salida.items() if k != "consola"}, indent=1, default=str)[:7000])
print("consola (error/warning):", json.dumps(salida["consola"], indent=1)[:1500])
