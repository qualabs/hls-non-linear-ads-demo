"""Los tokens despues del refactor: el cromo y el anuncio los resuelven igual,
y el juego de pantalla completa sigue ganando. La referencia es el juego chico."""
from playwright.sync_api import sync_playwright
T = ["--qa-pad", "--qa-icon", "--qa-play", "--qa-text", "--qa-rail", "--qa-logo", "--qa-radius"]
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome", headless=True, args=["--autoplay-policy=no-user-gesture-required"])
    page = b.new_page(viewport={"width": 1024, "height": 640})
    page.goto("http://localhost:8108/")
    page.wait_for_function("() => window.__t08 !== undefined")
    leer = """(t) => {
      const capa = document.getElementsByClassName('qa-controls')[0];
      const pop = document.getElementsByClassName('qa-announce')[0];
      const de = (n) => Object.fromEntries(t.map((k) => [k, getComputedStyle(n).getPropertyValue(k).trim()]));
      return { cromo: de(capa), anuncio: de(pop) };
    }"""
    chico = page.evaluate(leer, T)
    page.evaluate("""() => {
      document.getElementsByClassName('qa-controls')[0].classList.add('qa-controls--full');
      document.getElementsByClassName('qa-announce')[0].classList.add('qa-announce--full');
    }""")
    grande = page.evaluate(leer, T)
    print("chico  cromo  ", chico["cromo"])
    print("chico  anuncio", chico["anuncio"])
    print("grande cromo  ", grande["cromo"])
    print("grande anuncio", grande["anuncio"])
    ok = (chico["cromo"] == chico["anuncio"] and grande["cromo"] == grande["anuncio"]
          and chico["cromo"] != grande["cromo"])
    print("IGUALES los dos, y el juego grande es OTRO:", ok)
    b.close()
