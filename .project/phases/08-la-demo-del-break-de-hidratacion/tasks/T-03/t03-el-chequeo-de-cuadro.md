# T-03 — El plate y el paquete de canal ficticio

El plate propio existe: 88 s en tres actos —14 s de juego, 60 s de parada del juego, 14 s
de juego— con metraje amateur limpio de derechos y **el paquete de canal ficticio quemado
encima**. El material de la Blender Foundation dejó de ser el plate y quedó sólo como
creativo provisorio de los avisos, que es de la T-05.

## El paquete de canal, que es la pieza de mayor palanca

Cuatro elementos, todos inventados y todos nuestros: el **scorebug** con dos clubes que no
existen (NOR 1 – HAV 0), el **bug del canal** (VEKTA SPORT), el **reloj**, y la placa
**COOLING BREAK · PLAY STOPPED** que aparece **sólo mientras el juego está parado**.

El reparto de herramientas es el del ADR 0045 y se cumplió: la geometría y la tipografía
son SVG rasterizado con Chrome headless —alfa real, 1280×720 exactos— y **el reloj lo
dibuja ffmpeg y no el SVG**, porque un reloj que no corre es la diferencia entre un
gráfico y una transmisión. El SVG deja el hueco y la herramienta lo llena: en la evidencia
se lee 32:16 a los 6 s, 32:30 a los 20, y 33:30 a los 80.

La placa de parada se enciende con `enable='between(t,14,74)'`, y los segundos salen de
`plate.json`: **el gráfico que dice "play stopped" y el break que dibuja publicidad encima
leen un solo número** (ADR 0044).

## El chequeo de cuadro, que no fue una formalidad

**Seis candidatos revisados mirando los cuadros. Cinco fallaron, y ninguno lo decía en su
título.** Todos se presentan como "free to use".

| clip | qué se vio | veredicto |
| --- | --- | --- |
| 31370180, partido amateur, plano lateral ancho | en el tercio izquierdo, **camiseta réplica de selección con escudo de federación y las tres tiras de una marca real** | **recuperado con recorte**, verificado en cuatro momentos |
| 2932300, detrás del arco | tres tiras en el pantalón del arquero, y no es un ángulo de transmisión | descartado |
| 8937700, técnico y equipo | **son menores**, y no hay releases | descartado |
| 9439150, círculo de equipo | marca comercial legible en el pantalón | descartado para primer plano |
| 9441632, charla de equipo | marca comercial legible en un cuadro, equipo amateur adulto | **aceptado y anotado** |
| 9502518 y 9517718, banco y agua | equipo amateur adulto, sin marca legible en los cuadros mirados | **aceptados** |

El caso de 31370180 es el que vale mirar, y está en
`t03-el-clip-descartado-por-escudo.png`: es exactamente la trampa que la investigación de
contenido describe. Un clip que el banco de stock titula "amateur soccer match" y que
trae un escudo de federación en cuadro. **El recorte no es encuadre: es el chequeo**, y
los números están en `scripts/armar-plate.sh` con esa frase escrita al lado.

**El criterio con el que se aceptó lo que se aceptó**, y es el de la investigación: lo que
descalifica un clip es un escudo de club profesional, una marca de liga o una valla
publicitaria, porque eso lo convierte en la grabación de un partido con derechos encima.
La ropa deportiva con marca es aparición incidental de producto sobre un equipo amateur, y
es el caso débil. **Queda anotado para el chequeo final de cuadro antes de grabar**, que
es lo que la investigación pide.

## La debilidad que queda, y es de relato y no de derechos

**Los actos de juego y los de parada son equipos y canchas distintos.** El juego es un
partido masculino en cancha de césped sintético; la parada es un equipo femenino amateur
en otra cancha. Una transmisión real corta de plano pero no cambia de partido.

Se buscó la versión coherente: el mismo equipo femenino tiene clips de juego (9501822,
9502522) y **son planos cortos con poca profundidad de campo, no planos anchos de
transmisión**. O sea que las dos opciones existen y ninguna tiene las dos cosas:

- **la que está**: plano ancho de transmisión en el juego, dos partidos distintos.
- **la otra**: un solo partido, sin un plano ancho que se lea como cámara de transmisión.

Se eligió la primera porque **el plano ancho es lo que hace que el paquete de canal
funcione**, que es lo que esta task existe para conseguir. Es una decisión de relato y
está acá para que se pueda dar vuelta con una línea del script si Nicolás prefiere lo
otro.

## Un defecto propio, encontrado mirando

La placa de parada salió mal la primera vez: **"COOLING BREAK" y "PLAY STOPPED" se pisaban
y la segunda se salía de su propia caja.** Trece caracteres de 13 px bold con 1,4 de
tracking miden unos 123 px, así que la segunda etiqueta no podía arrancar en 176 ni la
caja medir 232.

Vale anotarlo porque **la lección no son estos números**: la investigación de contenido
dice que el *generador* deforma el texto chico, y esto era SVG escrito a mano y salió mal
igual. **Tipografía sobre una forma se mira, la haya escrito quien la haya escrito.**

Y un segundo defecto del mismo tipo: el factor de estiramiento de la parada estaba
invertido —`setpts=PTS/factor` acelera, `PTS*factor` estira— y el plate salió de 62,3 s en
lugar de 88. Lo delató el número, no la pantalla: un plate corto no se ve mal, se ve como
otro plate.

## La corrida, con el plate propio adentro

Las cuatro líneas de estado, leídas del contrato:

```
22.0s · ad on screen: lowerThirdOverlay · still image · the match is still playing
38.0s · ad on screen: squeezebackLShape · video · the match is still playing
52.0s · ad on screen: linear · video · the match is underneath, covered
65.0s · ad on screen: cornerOverlay · video · the match is still playing
```

`t03-la-l-sobre-el-plate.png` es la que muestra por qué esto valía: el partido replegado a
la esquina **con el scorebug y la placa de parada adentro del repliegue**, y la publicidad
en las dos barras de la L. La historia se lee sin que nadie la cuente.
