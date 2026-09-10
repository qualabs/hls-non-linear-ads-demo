# Evidencia de la T-06 — la cama negra deja de romper el alfa de una imagen

Registro de lo que se midió el 2026-09-10. No es instrucción vigente.

## El defecto, y por qué entró en esta fase

`createNode` escribía `background: '#000'` en **todo** nodo de aviso. La razón
escrita al lado es de video —un elemento de video es transparente hasta que
decodifica— y la línea corría antes de distinguir de qué nodo se trata, así que
una imagen con alfa se componía contra negro para siempre.

Lo encontró Nicolás en el inspector. Entró en la fase 09 **no** porque sea una
línea en el archivo que ya estaba abierto, que es el razonamiento con el que se
estira el alcance, sino porque **un nodo con cama difumina la cama**: a opacidad
0,5 lo que aparece sobre la imagen es un rectángulo medio negro y no medio banner.
El difuminado del banner que la T-03 entrega no se podía entregar bien con la
línea puesta, así que arreglarla es una precondición de esa task y no una
extensión de la fase.

## El chequeo que puede fallar

`asercion-antes-y-despues.txt` tiene la misma aserción sobre el DOM vivo corrida
**antes** y **después**, en el mismo instante del programa. Las dos filas cambian
de forma distinta, que es lo que había que distinguir:

- `IMG banner` pasó de `rgb(0, 0, 0)` a `(sin valor)`.
- `VIDEO lBackplate` lo tiene en las dos corridas.

Un test que sólo mirara el `<img>` no habría protegido la cama del video.

## El alfa, medido

El creativo del banner es 1120×126 color type 6, y usa su alfa de verdad: **51,1 %
de píxeles opacos, 2,2 % transparentes y 46,7 % con alfa parcial**. Casi medio
creativo se estaba pintando sobre negro, así que no era un caso de borde.

## Las capturas, miradas

Las dos son el **mismo cuadro** del programa, t=28.5, con el mismo HUD.

- `antes-banner-con-cama-negra.png` — el banner adentro de un rectángulo negro de
  esquinas rectas que ocupa el ancho entero. La cancha queda tapada y los bordes
  en ángulo del creativo están rellenos de negro.
- `despues-banner-con-su-alfa.png` — el rectángulo se fue. El banner se lee con su
  forma propia, en ángulo, y **la cancha y las piernas de los jugadores se ven a
  través de sus bordes** y a través de su cuerpo semitransparente.

## El límite

Lo que esto arregla es que la librería **deje de romper** el alfa. Que un creativo
se vea bien —que su alfa esté bien calculado, que no asuma un fondo— sigue siendo
de quien lo hace.
