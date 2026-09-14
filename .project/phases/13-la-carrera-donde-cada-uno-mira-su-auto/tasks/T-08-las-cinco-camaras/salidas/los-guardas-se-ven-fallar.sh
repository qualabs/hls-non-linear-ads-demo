#!/usr/bin/env bash
# los-guardas-se-ven-fallar.sh -- cada guarda de `generar-camaras.py` roto a proposito, para
# verlo ponerse rojo. Un guarda que nunca se vio fallar no es un guarda: es una linea que
# nadie sabe si engancha.
#
# LOS CUATRO CASOS, Y LO QUE MIDE CADA UNO:
#
#   1. EL TOPE FRENA. Con el registro lleno a 72 lineas, pedir una mas tiene que salir con
#      error ANTES de tocar la red.
#   2. EL TOPE NO FRENA. Es el caso que la T-05 no pudo construir sin pagar una generacion
#      de US$0,80, y es el que hace que el 1 valga: un tope que rechaza TODO tambien "frena".
#      Con `--contar` se ve pasar el chequeo y salir sin lanzar.
#   3. LA CAMARA QUIETA QUE VIAJA. Los bloques PISTA y SEGUIMIENTO juntos.
#   4. EL AUTO EQUIVOCADO. El color del padron cambiado por el de otra camara.
#
# Ninguno toca Vertex. Se corre desde esta carpeta.
set -uo pipefail
cd "$(dirname "$0")"
G="../../../../../../demo/race-multiview/scripts/generar-camaras.py"
T=$(mktemp -d "/dev/shm/guardas-$(date +%Y%m%dT%H%M%S)-XXXXXX")
trap 'rm -rf "$T"' EXIT

corre() {   # corre() <titulo> <comando...>  -- imprime salida y codigo de salida
  echo "----------------------------------------------------------------------"
  echo "# $1"
  echo "  \$ ${*:2}"
  echo
  "${@:2}" 2>&1 | sed 's/^/  /'
  echo "  [salida $?]"
  echo
}

echo "######################################################################"
echo "# 1 y 2 -- EL TOPE, en sus dos casos"
echo "######################################################################"
echo
echo "El registro de verdad tiene $(grep -vc '^#' registro-de-generaciones.tsv 2>/dev/null || echo 0) generaciones anotadas."
echo "Los dos casos se corren contra un registro FALSO en $T, con el de verdad intacto."
echo

# EL ARBOL FALSO TIENE QUE TENER LA MISMA FORMA QUE EL DE VERDAD, porque el generador
# calcula la ruta del registro a partir de la suya: <proyecto>/demo/race-multiview/scripts.
# La primera version de este control lo armo con un nivel de menos, el registro falso quedo
# en otro lado, y el caso 1 -- el que TIENE que frenar -- paso en verde. Romper el
# instrumento no puede costar el dato, asi que el registro de verdad ni se toca.
FDEMO="$T/proj/demo/race-multiview"
mkdir -p "$FDEMO/scripts"
cp "$(dirname "$G")"/generar-camara.py "$(dirname "$G")"/generar-camaras.py \
   "$(dirname "$G")"/generar-programa.py "$FDEMO/scripts/"
REG="$T/proj/.project/phases/13-la-carrera-donde-cada-uno-mira-su-auto/tasks/T-08-las-cinco-camaras/salidas/registro-de-generaciones.tsv"
mkdir -p "$(dirname "$REG")"

{ echo "# falso"; for i in $(seq 1 72); do echo "x	marvok	1	op$i	0.80	lanzada"; done; } > "$REG"
corre "1. con 72 anotadas y una pedida, TIENE que frenar" \
      python3 "$FDEMO/scripts/generar-camaras.py" marvok 1 --contar

{ echo "# falso"; for i in $(seq 1 60); do echo "x	marvok	1	op$i	0.80	lanzada"; done; } > "$REG"
corre "2. con 60 anotadas y ocho pedidas, NO tiene que frenar (y no lanza: --contar)" \
      python3 "$FDEMO/scripts/generar-camaras.py" marvok 1-8 --contar

echo "######################################################################"
echo "# 3 -- LA CAMARA QUIETA QUE VIAJA"
echo "######################################################################"
echo
cat > "$T/romper-pista.py" <<'PY'
import importlib.util, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("g", sys.argv[1])
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
# EL CLIP 2 DE NOCTEV ES DE `pista`. Se le pone ADEMAS el bloque del seguimiento, que es
# exactamente el error que la primera version de este archivo tenia en los cuatro clips de
# pista de las tres camaras de seguimiento.
orig = g.PISTA
g.PISTA = orig + "\n\n" + g.SEGUIMIENTO
c = next(x for x in g.CAMARAS["noctev"]["clips"] if x["n"] == 2)
g.prompt_de("noctev", c)
print("NO FALLO -- el guarda no engancha")
PY
corre "3. al clip 2 de NOCTEV (de pista) se le agrega el bloque del seguimiento" \
      python3 "$T/romper-pista.py" "$G"

echo "######################################################################"
echo "# 4 -- EL AUTO EQUIVOCADO"
echo "######################################################################"
echo
cat > "$T/romper-color.py" <<'PY'
import importlib.util, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("g", sys.argv[1])
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
# La ficha de RUNTAK dice que su auto es DEEP PLUM MAGENTA, pero sus ocho clips nombran otro
# color. Es lo que un copiar-pegar entre cinco fichas produce, y el feed entero saldria del
# auto equivocado sin que nada avise.
g.CAMARAS["runtak"]["color"] = "DARK BRONZE GOLD"
c = next(x for x in g.CAMARAS["runtak"]["clips"] if x["n"] == 1)
g.prompt_de("runtak", c)
print("NO FALLO -- el guarda no engancha")
PY
corre "4. la ficha de RUNTAK dice bronce y sus clips nombran magenta" \
      python3 "$T/romper-color.py" "$G"

echo "######################################################################"
echo "# 5 -- EL CONTROL DEL CONTROL: sin romper nada, los cuarenta prompts se arman"
echo "######################################################################"
echo
cat > "$T/todos.py" <<'PY'
import importlib.util, sys
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("g", sys.argv[1])
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
n = 0
for cam, d in g.CAMARAS.items():
    for c in d["clips"]:
        g.prompt_de(cam, c); n += 1
print("%d prompts armados, ningun guarda salto" % n)
PY
corre "5. los cuarenta, sin tocar nada" python3 "$T/todos.py" "$G"
