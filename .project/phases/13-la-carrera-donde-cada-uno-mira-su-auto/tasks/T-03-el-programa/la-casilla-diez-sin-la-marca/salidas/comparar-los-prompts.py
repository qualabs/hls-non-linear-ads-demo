import sys, os, importlib.util
sys.path.insert(0, "scripts")
spec = importlib.util.spec_from_file_location("g", "scripts/generar-programa.py")
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
DEST = "content/.fuentes/programa"

print("== 1. LOS CATORCE CONTRA SU .prompt.txt EN DISCO")
for c in g.CASILLAS:
    p = g.prompt_de(c) + "\n"
    disco = open(os.path.join(DEST, c["nombre"] + ".prompt.txt")).read()
    print("%2d %-28s %s" % (c["n"], c["nombre"], "IDENTICO" if p == disco else "DISTINTO"))

print()
print("== 2. LA PALABRA `APPLE` EN EL PROMPT QUE EL GENERADOR ARMA HOY")
for c in g.CASILLAS:
    p = g.prompt_de(c)
    print("%2d %-28s apple=%d  lime=%d" % (
        c["n"], c["nombre"], p.upper().count("APPLE"), p.upper().count("LIME")))

print()
print("== 3. EL CONTROL: el renombre se ve dar distinto y se ve fallar")
c10 = next(c for c in g.CASILLAS if c["n"] == 10)
con = g.prompt_de(c10)
guardado = c10.pop("color_renombrado")
sin = g.prompt_de(c10)
c10["color_renombrado"] = guardado
print("con renombre: apple=%d lime=%d  |  sin renombre: apple=%d lime=%d  |  iguales? %s"
      % (con.upper().count("APPLE"), con.upper().count("LIME"),
         sin.upper().count("APPLE"), sin.upper().count("LIME"), con == sin))
print("el diff, las dos apariciones:")
for a, b in zip(sin.splitlines(), con.splitlines()):
    if a != b:
        print("   -", a[:110])
        print("   +", b[:110])

print()
print("== 4. EL CONTROL DEL GUARDA: un renombre que no engancha tiene que MORIR, no pasar")
c10["color_renombrado"] = ("BRIGHT TANGERINE ORANGE", "BRIGHT LIME GREEN")
try:
    g.prompt_de(c10)
    print("   MAL: no murio")
except SystemExit as e:
    print("   muere:", str(e)[:150])
c10["color_renombrado"] = guardado
