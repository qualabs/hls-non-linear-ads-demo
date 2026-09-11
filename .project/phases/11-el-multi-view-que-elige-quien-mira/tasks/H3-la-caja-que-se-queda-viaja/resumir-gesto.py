"""Cuántos cuadros intermedios tuvo cada gesto, que es lo que separa un salto de un movimiento.

Un cuadro es INTERMEDIO cuando la caja no es ni la de partida ni la de llegada.
Con transicion hay una decena; sin ella hay cero y la caja cambia de un cuadro al
siguiente. Se cuenta por elemento, no por gesto: en un mismo gesto el primario y
una vista pueden comportarse distinto, que es exactamente lo que se esta midiendo.
"""
import json, sys

def resumen(archivo):
    d = json.load(open(archivo))
    print(f"### {archivo}   ({d['navegador']}, contenedor {d['contexto']['contenedor']})")
    for g in d['gestos']:
        print(f"  {g['gesto']}")
        for el in ('primario', 'view-caminandes-a', 'view-caminandes-b', 'view-ed-a'):
            serie = [tuple(f['cajas'][el]) for f in g['cuadros'] if f['cajas'].get(el)]
            if not serie:
                print(f"    {el:20s} sin nodo"); continue
            partida, llegada = serie[0], serie[-1]
            intermedios = [c for c in serie if c != partida and c != llegada]
            distintos = len({c for c in serie})
            cambio = partida != llegada
            ms = [f['ms'] for f, c in zip([f for f in g['cuadros'] if f['cajas'].get(el)], serie)
                  if c != partida]
            dur = f"{ms[-1] - ms[0] + (ms[1]-ms[0] if len(ms)>1 else 0):.0f}ms" if ms else '-'
            print(f"    {el:20s} {partida} -> {llegada}   "
                  f"cuadros intermedios: {len(intermedios):3d}   cajas distintas: {distintos:3d}"
                  f"   {'MOVIMIENTO' if len(intermedios) else ('SALTO' if cambio else 'quieto')}")
for a in sys.argv[1:]:
    resumen(a); print()
