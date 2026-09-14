#!/usr/bin/env bash
# regenerar-fichas.sh -- las seis fichas de auto, regeneradas contra el color que Veo
# dibuja y no contra el que se le pidio.
#
# QUE CAMBIO Y POR QUE. La T-01 genero las fichas con `agy`/Imagen y midio sobre ellas los
# seis hexadecimales que quedaron en `race.json`. El sondeo de la T-02 descubrio el problema
# de fondo: **las fichas las dibuja Imagen y los 62 clips los dibuja Veo, que es otro
# modelo**, asi que esa calibracion se hizo contra el generador equivocado. Medido sobre los
# catorce clips del programa, cinco de los seis autos volvieron a mas de 7 de dE00 de su
# ficha y dos a mas de 16.
#
# Asi que el orden se da vuelta: **manda lo que Veo dibuja**. Los hexadecimales de
# `race.json` se miden sobre los clips, y las fichas se regeneran para parecerse a ellos.
# La ficha deja de ser la especificacion del auto y pasa a ser su RETRATO: lo que el
# espectador va a ver, en un plano quieto y limpio donde se puede mirar sin que pase nada.
#
# CUESTA US$0. `generate_image` de `agy` va contra la suscripcion de Antigravity y no contra
# la tarjeta, asi que regenerar una ficha no toca el techo de la etapa, que es de Veo.
#
# AL GENERADOR SE LE DAN PALABRAS Y TAMBIEN EL HEXADECIMAL. La T-01 escribio que a un modelo
# generativo un codigo no le dice nada y que lo que obedece son las palabras; se le dan las
# dos cosas porque probar cuesta cero, y lo que decide sigue siendo la medicion sobre la
# imagen que vuelve.
#
# LAS SEIS SALEN EN PARALELO. Cada `generate_image` tarda unos seis minutos, asi que en
# serie son media hora y en paralelo son seis minutos. Cada corrida escribe su consola en
# su propio archivo, FUERA de la carpeta de trabajo que se borra al final.
set -euo pipefail
cd "$(dirname "$0")"

RAIZ=$(cd ../../../../../.. && pwd)
FICHAS="$RAIZ/.project/phases/13-la-carrera-donde-cada-uno-mira-su-auto/tasks/T-01-el-mundo-y-los-autos/fichas"
SALIDA=${1:?uso: regenerar-fichas.sh <carpeta de salida en /dev/shm>}
mkdir -p "$SALIDA"

# El parrafo de restriccion, IDENTICO al de la T-01: no se toca, porque lo que esta task
# cambia es el color y nada mas, y cambiar dos cosas a la vez haria que no se pudiera
# atribuir el resultado.
RESTRICCION='Do NOT imitate the trade dress of any real racing team. No prancing horse, no charging bull, no three-pointed star, no four rings, no winged badge, no papaya orange, no Italian red, no British racing green, no silver arrows. Invent an original livery. If you find yourself reaching for something that looks like a team you know, change it.'

cuerpo() {  # $1 = palabras del dominante, $2 = hexadecimal medido, $3 = palabras del acento
  cat <<EOF
$RESTRICCION

A single contemporary open-cockpit single-seater racing car with exposed wheels, three-quarter front view from slightly above, standing still on dry mid-grey asphalt under a high even overcast: soft flat light, no sun, no hard shadows, no lens flare. The whole car is one flat $1 (exactly the colour $2) -- nose, sidepods, engine cover and rear wing all the same colour -- with a single continuous $3 stripe of even width running from the tip of the nose, over the top of the car, to the trailing edge of the rear wing. The wheels are matt black with plain dark grey rims. The driver's helmet is the same $1 as the car with the same $3 stripe over the crown. There is no number, no lettering, no logo and no sponsor marking anywhere on the car, on the wheels, on the helmet or on the ground. Behind the car the background is the same empty grey asphalt continuing out of focus to all edges of the frame, with nothing on it. Photographic, sharp, motorsport press photography.
EOF
}

# EL COLOR QUE SE PIDE NO ES EL QUE SE QUIERE MEDIR, Y ESA ES LA CALIBRACION DE ESTA
# VUELTA. El generador dibuja la carroceria con su sombreado, asi que la mediana sobre el
# cuerpo del auto vuelve mas OSCURA que el color pedido, y de forma sistematica: pedido
# #24ACC8 devolvio #0387AA (unos 12 de L* menos) y pedido #876E46 devolvio #5A452A (unos 18
# menos). Asi que a los dos que quedaron lejos se les pide una version mas clara, calculada
# para que lo MEDIDO caiga en el color de los clips. Es el mismo metodo que la T-01 uso para
# las palabras: se itera contra la medicion, no contra la intencion.
#
# Y A LOS OTROS CUATRO NO SE LES PIDE NADA NUEVO. CALDRIX, MARVOK y PENTAV ya estaban mas
# cerca del color de Veo con la ficha vieja que con la regenerada, asi que la ficha vieja es
# el mejor retrato y se queda. Regenerar para que el archivo tenga fecha de hoy no mejora
# nada.
#
# auto : archivo : palabras del dominante : hexadecimal que se PIDE : acento
AUTOS=(
  "1-caldrix:RICH GOLDEN LEMON YELLOW:#CCB21F:GRAPHITE BLACK"
  "2-marvok:DEEP INDIGO VIOLET:#381A6A:PURE WHITE"
  "3-noctev:LIGHT BRIGHT SKY CYAN:#5AC9E6:GRAPHITE BLACK"
  "4-runtak:DEEP MAGENTA PLUM:#661955:PURE WHITE"
  "5-pentav:MEDIUM GRASS GREEN:#2D6E24:PURE WHITE"
  "6-quentra:LIGHT SANDY TAN:#BFA179:PURE WHITE"
)

# Se puede pedir un subconjunto: regenerar-fichas.sh <salida> 3-noctev 6-quentra
if [ $# -gt 1 ]; then
  shift
  PEDIDOS=("$@")
  FILTRADOS=()
  for a in "${AUTOS[@]}"; do
    for q in "${PEDIDOS[@]}"; do [ "${a%%:*}" = "$q" ] && FILTRADOS+=("$a"); done
  done
  AUTOS=("${FILTRADOS[@]}")
fi

for a in "${AUTOS[@]}"; do
  archivo=${a%%:*}; resto=${a#*:}
  dom=${resto%%:*}; resto=${resto#*:}
  hex=${resto%%:*}; acento=${resto##*:}
  destino="$SALIDA/$archivo.jpg"
  P="$(cuerpo "$dom" "$hex" "$acento")

Generate that image with generate_image, ImageName \"$archivo\", AspectRatio \"16:9\". Then copy the generated file to exactly $destino (use the cp command). Reply with only DONE."
  agy -p "$P" --add-dir "$SALIDA" --dangerously-skip-permissions --print-timeout 20m \
      > "$SALIDA/../consola-$archivo.log" 2>&1 &
  echo "  lanzada $archivo  (pid $!)"
done
wait
echo "== las seis terminaron =="
ls -la "$SALIDA"
echo
echo "Las fichas del repositorio estan en $FICHAS y se reemplazan a mano despues de medirlas."
