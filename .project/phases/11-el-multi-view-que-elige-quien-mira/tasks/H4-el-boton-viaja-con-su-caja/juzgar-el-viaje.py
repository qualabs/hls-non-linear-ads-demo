"""El veredicto de una lectura: ¿el botón estuvo montado sobre su caja en TODOS los cuadros del viaje?

LA CUENTA ES UNA Y SE LLAMA `deriva`. El botón va montado en una esquina de su
caja, a una distancia fija de ella. Por cuadro se mide el vector que va de ESA
esquina de la caja al borde correspondiente del botón, y se lo compara contra el
mismo vector en el cuadro final, que es el estado quieto al que el gesto llegó.
`deriva` es cuánto se aparta, en píxeles, por el eje que más se aparta. Un botón
que viaja con su caja da 0 en todos los cuadros; un botón que se teletransporta
al destino mientras la imagen todavía sale del origen da la distancia entera
entre las dos cajas.

POR QUÉ CONTRA LA ESQUINA Y NO CONTRA LA CAJA ENTERA. La primera versión de esta
cuenta medía cuántos píxeles del botón caían AFUERA de su caja, y se la comió el
gesto de desagrandar: el botón salta al rincón del cuadrante, que está adentro
del cuadro entero del que la imagen todavía está saliendo, así que daba cero
mientras el defecto estaba a la vista. Un botón adentro de su caja pero en otro
lugar de ella es el mismo defecto. La esquina es lo que no se puede fingir.

Y POR QUÉ CONTRA EL CUADRO FINAL Y NO CONTRA UNA CONSTANTE. Porque hay una
distancia fija pero no es la misma para las cuatro esquinas (ver el hallazgo del
informe: en `ne`, `sw` y `se` el botón cuelga 12,8 px afuera de su caja, y eso ya
pasaba antes de esta tarea). Medido contra el cuadro final, lo que se compara es
la misma caja con la misma esquina, así que esa diferencia se cancela y lo que
queda es el viaje.

LAS DOS REFERENCIAS, porque un número solo no dice nada:

  1. **Adentro de la misma corrida**, el gesto de subir una tercera cámara deja
     cuatro cajas con botón de las cuales UNA viaja y tres se quedan. Las tres
     quietas tienen que dar 0: si dieran distinto, lo que está mal es esta cuenta.
  2. **Contra el árbol sin el arreglo** (`medicion-sin-el-arreglo.txt`), que es la
     misma corrida sobre una librería construida del `lib/` de antes.

Uso:  python juzgar-el-viaje.py <lectura.json> [...]
Sale 0 si todas las lecturas están en verde, 1 si alguna no.
"""
import json
import sys

ELEMENTOS = ['primario', 'view-caminandes-a', 'view-caminandes-b', 'view-ed-a']
UMBRAL = 1.0


def esquina_de(caja, boton):
    """En qué esquina de su caja va montado el botón, leído del cuadro quieto."""
    cx, cy = boton[0] + boton[2] / 2, boton[1] + boton[3] / 2
    return ('e' if cx > caja[0] + caja[2] / 2 else 'w',
            's' if cy > caja[1] + caja[3] / 2 else 'n')


def vector(caja, boton, esq):
    """De la esquina de la caja al borde del botón que se apoya en ella."""
    x = (boton[0] - caja[0]) if esq[0] == 'w' \
        else (boton[0] + boton[2]) - (caja[0] + caja[2])
    y = (boton[1] - caja[1]) if esq[1] == 'n' \
        else (boton[1] + boton[3]) - (caja[1] + caja[3])
    return x, y


def fuera(caja, boton):
    """Cuántos píxeles del botón caen afuera de su caja. Secundaria: ver el docstring."""
    return max(0.0, caja[0] - boton[0],
               (boton[0] + boton[2]) - (caja[0] + caja[2]),
               caja[1] - boton[1],
               (boton[1] + boton[3]) - (caja[1] + caja[3]))


def veredicto(archivo):
    d = json.load(open(archivo))
    print(f"### {archivo}   ({d['navegador']}, contenedor {d['contexto']['contenedor']}, "
          f"{d['tomada']})")
    malos = 0
    for g in d['gestos']:
        print(f"  {g['gesto']}")
        for el in ELEMENTOS:
            cuadros = [f for f in g['cuadros']
                       if f['cajas'].get(el) and f['botones'].get(el)]
            if not cuadros:
                print(f"    {el:20s} sin botón en pantalla durante el gesto")
                continue
            fin = cuadros[-1]
            esq = esquina_de(fin['cajas'][el], fin['botones'][el])
            vx0, vy0 = vector(fin['cajas'][el], fin['botones'][el], esq)
            serie = [tuple(f['cajas'][el]) for f in cuadros]
            partida, llegada = serie[0], serie[-1]
            intermedios = sum(1 for c in serie if c != partida and c != llegada)
            viaja = 'VIAJA ' if intermedios else 'quieta'
            derivas = []
            for f in cuadros:
                vx, vy = vector(f['cajas'][el], f['botones'][el], esq)
                derivas.append((f['ms'], max(abs(vx - vx0), abs(vy - vy0))))
            peor_ms, peor = max(derivas, key=lambda x: x[1])
            pasados = [ms for ms, v in derivas if v > UMBRAL]
            estado = 'ok' if not pasados else f'ROJO en {len(pasados)}/{len(derivas)} cuadros'
            if pasados:
                malos += 1
            afuera = max(fuera(f['cajas'][el], f['botones'][el]) for f in cuadros)
            print(f"    {el:20s} caja {viaja} ({intermedios:3d} cuadros intermedios)   "
                  f"esquina {''.join(esq)}   deriva máx {peor:7.1f} px a los {peor_ms:6.1f} ms"
                  f"   {estado}")
            if pasados:
                print(f"    {'':20s}   fuera del umbral desde los {min(pasados):.1f} ms "
                      f"hasta los {max(pasados):.1f} ms; el botón llegó a caer "
                      f"{afuera:.1f} px afuera de su caja")
    if malos:
        print(f"\n== ROJO: {malos} elemento(s) con el botón fuera de su esquina durante el gesto ==")
    else:
        print("\n== VERDE: el botón se mantuvo en su esquina en todos los cuadros de todos "
              "los gestos ==")
    return malos


peor = 0
for a in sys.argv[1:]:
    peor += veredicto(a)
    print()
sys.exit(1 if peor else 0)
