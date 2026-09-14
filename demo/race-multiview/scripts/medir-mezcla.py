#!/usr/bin/env python3
"""medir-mezcla.py -- cuanto margen tiene el relato sobre el ambiente MIENTRAS habla.

QUE PREGUNTA CONTESTA, que no es la que contesta la sonoridad integrada. Que el ambiente
mida -30 LUFS y el relato -20 dice cuanto miden los dos archivos enteros. No dice si en el
segundo 41, cuando dos autos frenan rueda a rueda y el relator esta hablando encima, la
voz sigue arriba: la sonoridad integrada es un promedio con compuerta y ese segundo pesa
menos de un uno por ciento. Lo que hace que un relato se pierda no es el promedio del
ambiente, es su pico.

ASI QUE SE MIDE MOMENTO A MOMENTO. ebur128 entrega sonoridad momentanea (ventana de 400 ms)
cada 100 ms; se toma la del relato y la del ambiente en el mismo instante, se restan, y se
mira la distribucion de esa resta SOLO EN LOS INSTANTES EN QUE ALGUIEN HABLA -- que salen
de audio/tiempos.json, no de un detector, porque los tiempos son dato y no estimacion.

LA REFERENCIA NO SALE DE ESTE CALCULO, que es la parte que hace que el numero signifique
algo. Se mide lo mismo contra ambiente-sin-emparejar.wav: los catorce clips
concatenados a su nivel original, sin la ganancia por clip que les pone armar-programa.sh.
Es el mismo montaje sin el trabajo de esta task, armado con los mismos archivos, y es lo
que responde "y si no hubieras hecho nada, que pasaba". Si el margen emparejado y el crudo
dieran parecido, la normalizacion no estaria haciendo nada y habria que decirlo.

EL UMBRAL. Se cuenta cuantos instantes de habla quedan por debajo de 6 dB de margen, que es
el piso que la practica de transmision toma como "el fondo empieza a disputar la palabra".
No es un aprobado/desaprobado: es una cuenta, y al lado esta la misma cuenta sobre el crudo.

Uso:  ./medir-mezcla.py
"""
import json, pathlib, re, statistics, subprocess, sys

AQUI = pathlib.Path(__file__).resolve().parent
DEMO = AQUI.parent
AUDIO = DEMO / "audio"
TRABAJO = DEMO / "content/.fuentes/audio"
# Se descartan 0,45 s en cada punta de una linea. NO ES UN MARGEN DE CORTESIA: la ventana
# de la sonoridad momentanea es de 400 ms, asi que en los primeros 400 ms de una linea esa
# ventana todavia contiene el silencio de antes y devuelve una voz mas baja de la que hay.
# Medir ahi es medir el instrumento. Con 0,20 s el minimo daba -23,2 dB, y esos -23,2 eran
# una ventana medio vacia y no un momento en que el ambiente tapo al relator.
BORDE = 0.45

# Y SE DESCARTAN LAS PAUSAS DE ADENTRO DE UNA LINEA. Entre dos frases de una misma linea la
# voz se calla dos o tres decimas, y ahi el margen se derrumba -- el minimo daba -23,2 dB en
# el segundo 75,5, que es una coma del relator y no un momento en que el ambiente lo tapo.
# "Mientras habla" quiere decir mientras suena una voz, asi que se pide que la momentanea
# del relato este a menos de 10 dB del nivel al que se nivelo cada linea (-20 LUFS). El
# mismo filtro corre sobre la referencia sin emparejar, asi que la comparacion no se mueve.
ACTIVO = -30.0


def momentanea(wav):
    """{t redondeado a 0,1 s: sonoridad momentanea en LUFS}"""
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(wav),
                        "-af", "ebur128", "-f", "null", "-"],
                       capture_output=True, text=True)
    fuera = {}
    for m in re.finditer(r"t:\s*([0-9.]+).*?M:\s*(-?[0-9.]+)", p.stderr):
        fuera[round(float(m.group(1)), 1)] = float(m.group(2))
    if not fuera:
        sys.exit(f"ebur128 no devolvio una sola medida para {wav}")
    return fuera


def resumen(nombre, voz, amb, instantes):
    margenes = [voz[t] - amb[t] for t in instantes
                if t in voz and t in amb and amb[t] > -120 and voz[t] >= ACTIVO]
    if not margenes:
        sys.exit("no hay instantes comparables")
    bajos = [m for m in margenes if m < 6.0]
    print(f"  {nombre:<34} n={len(margenes):4d}  min {min(margenes):6.1f}  "
          f"p10 {statistics.quantiles(margenes, n=10)[0]:6.1f}  "
          f"mediana {statistics.median(margenes):6.1f}  max {max(margenes):6.1f}  "
          f"debajo de 6 dB: {len(bajos):4d} ({100*len(bajos)/len(margenes):.1f} %)")
    peores = sorted((v - amb[t], t) for t, v in voz.items()
                    if t in instantes and t in amb and amb[t] > -120 and v >= ACTIVO)[:3]
    print("       los tres peores instantes: " +
          "   ".join(f"{t:.1f} s (casilla {int(t // 8) + 1}): {m:.1f} dB" for m, t in peores))
    return margenes


tiempos = json.loads((AUDIO / "tiempos.json").read_text())
instantes = []
for f in tiempos:
    t = round(f["inicio"] + BORDE, 1)
    while t <= f["fin"] - BORDE:
        instantes.append(round(t, 1))
        t = round(t + 0.1, 1)

voz = momentanea(TRABAJO / "relato.wav")
activos = [t for t in instantes if voz.get(t, -120) >= ACTIVO]
largo = json.loads((DEMO / "race.json").read_text())["largo"]
print(f"instantes medidos: {len(activos)} de 0,1 s ({len(activos)/10:.1f} s con voz sonando, "
      f"de los {largo} s del programa). Quedaron afuera {len(instantes) - len(activos)} "
      f"instantes de pausa adentro de una linea.\n")
print("margen del relato sobre el ambiente, en dB, momento a momento:")
emparejado = resumen("el ambiente emparejado", voz, momentanea(TRABAJO / "ambiente.wav"), instantes)
crudo = resumen("REFERENCIA sin emparejar", voz, momentanea(TRABAJO / "ambiente-sin-emparejar.wav"), instantes)

print(f"\n  la normalizacion por clip mueve la mediana {statistics.median(emparejado) - statistics.median(crudo):.1f} dB "
      f"y el peor momento {min(emparejado) - min(crudo):.1f} dB.")
