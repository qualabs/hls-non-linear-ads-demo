"""T-02 -- los rangos del programa, leidos antes de que empiece el primer break.

El metodo es el de la T-01 y a proposito: una sola carga sobre el servidor de la
demo, sin un solo seek, y todo lo que se afirma leido de la pagina viva.

Lo que esta corrida tiene que mostrar es una cosa: que `provider.programRanges()`
contesta donde estan TODOS los rangos del recorrido, con su clase, en un momento
en que el primer break todavia no empezo. El primer break arranca a los 20 s, asi
que la lectura se toma apenas la lista queda completa y se anota el
`currentTime` de esa lectura, que es lo que hace que "antes" sea una medicion y
no una promesa.

Se anotan ademas tres cosas que el contrato promete y conviene ver de frente: que
la lista es monotona (una lectura mas temprana es un prefijo de la final), que
`settled` no se vuelve verdadero antes de tiempo, y que los rangos de clase Apple
NO se cuelan en `activeAt`, que sigue siendo solo de la experiencia concurrente.
"""
import sys, json, time, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
URL = "http://localhost:8080/"

LECTURA = """
() => {
  const p = window.demo.provider;
  const r = p.programRanges();
  const v = window.demo.video;
  return {
    currentTime: +v.currentTime.toFixed(3),
    // El largo NO sale de la consulta: se relee del primario, que es de donde
    // lo va a releer la barra (ADR 0016).
    largoDelPrimarioReleido: Number.isFinite(v.duration) ? +v.duration.toFixed(3) : null,
    settled: r.settled,
    cuantos: r.ranges.length,
    porClase: r.ranges.reduce((a, x) => (a[x.kind] = (a[x.kind] || 0) + 1, a), {}),
    ranges: r.ranges.map(x => ({
      id: x.id, kind: x.kind,
      startTime: +x.startTime.toFixed(3), duration: +x.duration.toFixed(3),
      // La division que hace quien pinta, con el largo releido. No es un dato
      // del contrato: es lo que la barra va a calcular en cada pintada.
      fraccion: Number.isFinite(v.duration)
        ? { desde: +(x.startTime / v.duration).toFixed(5),
            hasta: +((x.startTime + x.duration) / v.duration).toFixed(5) }
        : null
    })),
    // Lo que activeAt contesta en el mismo instante: nada, porque no empezo
    // ningun break, y nunca un rango de clase Apple.
    activeAhora: p.activeAt(v.currentTime).map(e => e.id),
    experienciasResueltas: p.experiences.length,
    esUnArrayNuevo: p.programRanges().ranges !== p.programRanges().ranges,
    mismosObjetos: p.programRanges().ranges[0] === p.programRanges().ranges[0]
  };
}
"""

res = {"lecturas": []}
console = []

with sync_playwright() as p:
    b = p.chromium.connect_over_cdp("http://127.0.0.1:9333")
    pg = b.contexts[0].new_page()
    try:
        pg.set_viewport_size({"width": 1600, "height": 1000})
        pg.on("console", lambda m: console.append({"type": m.type, "text": m.text[:300]}))
        t0 = time.monotonic()
        pg.goto(URL, wait_until="load")
        pg.wait_for_function("!!(window.demo && window.demo.provider)", timeout=30000)
        pg.evaluate("""() => {
          window.__seeks = [];
          window.demo.video.addEventListener('seeking',
            () => window.__seeks.push(+window.demo.video.currentTime.toFixed(2)));
        }""")

        # La primera lectura, lo mas temprano que se puede: es la que muestra que
        # `settled` no miente mientras la lista se esta armando.
        primera = pg.evaluate(LECTURA)
        primera["paredSegundos"] = round(time.monotonic() - t0, 2)
        res["lecturas"].append(primera)
        print("LECTURA 1 (apenas hay provider):", json.dumps(
            {k: primera[k] for k in ("currentTime", "settled", "cuantos", "porClase")}), flush=True)

        # Y la lectura que la task pide: la lista completa, con el primer break
        # todavia por delante.
        pg.wait_for_function("window.demo.provider.programRanges().settled === true", timeout=30000)
        completa = pg.evaluate(LECTURA)
        completa["paredSegundos"] = round(time.monotonic() - t0, 2)
        res["lecturas"].append(completa)
        res["laLectura"] = completa
        print("LECTURA 2 (settled):", json.dumps(completa, indent=2), flush=True)

        # El prefijo: todo rango de la primera lectura sigue igual en la segunda.
        res["monotona"] = all(
            any(a == b_ for b_ in completa["ranges"]) for a in primera["ranges"])

        # El primer break del recorrido empieza a los 20 s, y esto es lo unico
        # que hace que la lectura sirva para pintar una barra desde el segundo
        # cero: se leyo antes.
        res["antesDelPrimerBreak"] = {
            "currentTimeDeLaLectura": completa["currentTime"],
            "primerRangoEmpiezaEn": min(r["startTime"] for r in completa["ranges"]),
            "loLeyoAntes": completa["currentTime"] < min(r["startTime"] for r in completa["ranges"])
        }
        res["seeksDelPrimario"] = pg.evaluate("window.__seeks")
        res["errores"] = [c for c in console if c["type"] == "error"]
        res["trazaDeLaSenalizacion"] = [c["text"] for c in console
                                        if c["text"].startswith("[signalling]")]
    finally:
        pg.close()

res["consola"] = console
(OUT / "t02-los-rangos-del-programa.json").write_text(json.dumps(res, indent=2))
print("\nWROTE", OUT / "t02-los-rangos-del-programa.json")
print("MONOTONA:", res["monotona"], "| ANTES DEL PRIMER BREAK:", res["antesDelPrimerBreak"],
      "| SEEKS:", res["seeksDelPrimario"], "| ERRORES:", len(res["errores"]))
