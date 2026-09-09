#!/usr/bin/env bash
# Arma el plate del partido: tres actos —juego, parada del juego, juego— desde
# clips amateur limpios de derechos, y deja el resultado en un solo mp4 listo
# para que el paquete de canal se le queme encima.
#
# POR QUÉ SE ARMA Y NO SE COMPRA. El mercado de metraje se parte en dos y no hay
# dinero que cierre la grieta: todo lo que PARECE una transmisión es un partido
# profesional real con derechos de liga, club y sponsors, y todo lo que es
# legalmente limpio es metraje amateur que no parece una transmisión. Los clips
# de acá son del segundo grupo; lo que los hace leerse como un feed es el
# paquete de canal de `paquete-de-canal.sh`, que es la pieza de mayor palanca de
# la demo.
#
# EL CHEQUEO DE CUADRO ESTÁ HECHO Y ESCRITO, clip por clip, en
# `../../.project/phases/08-la-demo-del-break-de-hidratacion/tasks/T-03/`. No es
# una formalidad: de seis candidatos revisados mirando los cuadros, uno traía un
# escudo de federación y las tres tiras de una marca real, y otro mostraba
# menores. Los títulos de los bancos de stock no dicen nada de eso.
#
# Los tres actos y sus largos salen de plate.json (ADR 0044), que es el mismo
# archivo del que el script de señalización saca dónde poner el break: el
# gráfico que dice "play stopped" y el break que dibuja publicidad encima leen
# un solo número.
set -euo pipefail
cd "$(dirname "$0")/.."

F=content/.fuentes
OUT=${1:?mp4 de salida}

JUEGO=$(node -e 'process.stdout.write(String(require("./plate.json").paradaEn))')
PARADA=$(node -e 'process.stdout.write(String(require("./plate.json").paradaDura))')
LARGO=$(node -e 'process.stdout.write(String(require("./plate.json").largo))')
COLA=$(awk -v l="$LARGO" -v j="$JUEGO" -v p="$PARADA" 'BEGIN { printf "%s", l - j - p }')

# EL RECORTE DEL CLIP DE JUEGO NO ES ENCUADRE: ES EL CHEQUEO DE CUADRO. En el
# tercio izquierdo del cuadro original hay un jugador con una camiseta réplica
# de selección —escudo de federación visible, y las tres tiras de una marca real
# en la manga—. El recorte lo saca, y se verificó en cuatro momentos del clip.
# Cambiar estos números sin volver a mirar los cuadros vuelve a meter la marca.
RECORTE_JUEGO=2688:1512:1152:400
# El acto 3 usa OTRA ventana del mismo cuadro 4K, así que se lee como otro
# encuadre de cámara en lugar de como el mismo plano repetido. Sigue afuera del
# tercio izquierdo, que es lo que importa.
RECORTE_COLA=2688:1512:700:500

# La parada se arma con tres clips del mismo equipo amateur adulto y se ESTIRA al
# largo declarado. Estirar es legítimo acá y no lo sería en el juego: son planos
# de gente sentada y hablando, donde un 1,3x no se ve; una pelota moviéndose a
# 1,3x sí.
PARADA_CRUDA=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F/9502518.mp4" \
  | awk '{s=$1} END {print s}')
for c in 9517718 9441632; do
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$F/$c.mp4")
  PARADA_CRUDA=$(awk -v a="$PARADA_CRUDA" -v b="$d" 'BEGIN { printf "%s", a + b }')
done
# El factor MULTIPLICA el PTS y no lo divide, que es lo que estira en lugar de
# acelerar. Escrito al revés la primera vez, el plate salió de 62,3 s en lugar de
# 88, y el número es lo que lo delató: 45,375 / 1,32 = 34,3, más los dos actos de
# 14. Un plate corto no se ve mal en pantalla, se ve como otro plate.
FACTOR=$(awk -v cruda="$PARADA_CRUDA" -v pedida="$PARADA" 'BEGIN { printf "%.5f", pedida / cruda }')

echo "plate: ${JUEGO}s de juego + ${PARADA}s de parada + ${COLA}s de juego = ${LARGO}s"
echo "  la parada son ${PARADA_CRUDA}s de material estirados por $FACTOR"

ffmpeg -hide_banner -loglevel error -y \
  -i "$F/31370180.mp4" -i "$F/9502518.mp4" -i "$F/9517718.mp4" -i "$F/9441632.mp4" \
  -filter_complex "\
[0:v]crop=$RECORTE_JUEGO,scale=1280:720,fps=30,setsar=1,trim=duration=$JUEGO,setpts=PTS-STARTPTS[a1];\
[1:v]crop=3840:2160:128:0,scale=1280:720,fps=30,setsar=1,setpts=PTS*$FACTOR[p1];\
[2:v]crop=3840:2160:128:0,scale=1280:720,fps=30,setsar=1,setpts=PTS*$FACTOR[p2];\
[3:v]crop=3840:2160:128:0,scale=1280:720,fps=30,setsar=1,setpts=PTS*$FACTOR[p3];\
[p1][p2][p3]concat=n=3:v=1:a=0,trim=duration=$PARADA,setpts=PTS-STARTPTS[a2];\
[0:v]crop=$RECORTE_COLA,scale=1280:720,fps=30,setsar=1,trim=duration=$COLA,setpts=PTS-STARTPTS[a3];\
[a1][a2][a3]concat=n=3:v=1:a=0[v]" \
  -map "[v]" -an \
  -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p \
  "$OUT"

echo "$OUT  ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s)"
