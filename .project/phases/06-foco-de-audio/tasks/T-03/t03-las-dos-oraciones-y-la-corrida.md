# T-03 — Las dos oraciones del README, y la corrida mirada entera

El README de la demo ya no afirma de menos: los dos párrafos que contaban la
mezcla del asset list como si fuera la última palabra ahora dicen que es el
**estado inicial** y que quien mira se lleva el audio a una caja tocándola. Y la
corrida de tres minutos está mirada de punta a punta, en un solo playback
continuo y sin seeks, con el gesto adentro: los cinco breaks se ven como se
veían, los cuatro avisos del break 5 entran en su segundo, y el foco anda en el
Quad y en un `cornerOverlay`.

## Las dos oraciones, tal como quedaron

**En el párrafo del switch de `## Before you record`**, después de la frase que
cierra con el ADR 0014:

> That mix is the initial state and not the last word: while the chrome is on
> screen, a press on any video box of the ad hands that box the whole sound --
> it goes to 100 and everything else to 0, the programme included -- and the
> declared mix comes back on a second press, or on its own when the ad leaves
> the screen (ADR 0026).

**En el párrafo del Quad**, pegada a la frase que decía que así suena un quad
*when the signalling picks one to listen to*:

> Here the signalling only proposes: with the chrome on screen, a press on a
> quadrant moves the whole sound over to it, a yellow ring marks the box being
> heard, and the declared 100/10 comes back when that box is pressed again or
> when the break ends (ADR 0026).

Entre las dos está la política completa del ADR 0026 y no una aproximación: el
asset list declara el estado inicial, quien mira lo sobrescribe mientras el aviso
está en pantalla, el foco es exclusivo —el elemento tocado a 100 y todo el resto
a 0, el primario incluido—, el gesto cuenta sólo con el cromo arriba, enfocable
es una caja de video del aviso, y el override muere con el aviso (ADR 0029).

## Tres cosas que la task decidió

- **Una sola oración en cada párrafo, y el anillo se nombra en el del Quad.** El
  párrafo del switch es donde vive la política, así que ahí va la regla; el del
  Quad es el beat concreto que se ve en cámara, así que ahí va la marca que dice
  cuál caja se está escuchando. Escribir el anillo en los dos habría sido la
  misma frase dos veces.
- **El párrafo del Quad se reacomodó de ancho, y ninguna palabra suya cambió.**
  Meter una oración en el medio dejaba una línea de cinco palabras: el reflow es
  del envoltorio y el `git diff` de esas líneas no toca una sola palabra.
- **El encabezado de la sección sigue diciendo "six to expect", y está bien.**
  Las dos oraciones entraron adentro de párrafos que ya existían y no agregaron
  un ítem en negrita, así que la cuenta de la sección no envejeció. Era la
  afirmación con más chance de quedar vieja por un cambio de este tamaño.

## La sección `Before you record`, leída línea por línea

Nada más quedó viejo. El párrafo del break 5 y el del aviso a cuadro entero
hablan de la mezcla declarada, que es exactamente lo que las dos oraciones nuevas
llaman estado inicial; el de LBox image dice que ese aviso no tiene banda sonora,
y las imágenes no son enfocables (ADR 0027), lo que la corrida además muestra:
sus dos nodos entran con `pointer-events: none`.

**Una sola línea de la sección la corrida no puede confirmar ni desmentir**: los
0,7 s de atraso del pane de fábrica sobre la corrida entera. La lectura del final
da al pane de fábrica alrededor de un segundo atrás (170,2 s contra 171,4 s), y
no es una medición de eso: son dos líneas de estado que se pintan cada una con su
propio `timeupdate`, así que la muestra trae medio segundo de holgura, y el costo
que produce el número es el traspaso del MediaSource, que en un Chrome headless
sobre una máquina compartida no cuesta lo que en la máquina donde se graba. El
número es de la fase 04 y su dueño es la evidencia de la T-07 de esa fase; nada
de la fase 06 tocó la implementación que lo produjo, así que la línea se queda
como está y esto queda anotado.

## Cómo se verificó

Nivel `bajo` y vara de POC: sin tests nuevos y sin campaña de mutación. La suite
y las dos costuras, verbatim, en `t03-suite-y-costuras.txt`: `npm test` da
**49 en verde** —los mismos 49 de la T-01 y la T-02, porque esta task no agrega
lógica— y `npm run check` sigue en `both seams hold.`.

**Los links del README se chequearon y no se declararon**, en
`t03-links-del-readme.txt`: los seis links relativos resuelven en disco, y de las
22 rutas que el documento nombra en backticks existen todas menos `/dist/` y
`/vendor/`, que están bien escritas porque son los dos puntos de montaje de URL
del servidor y no rutas de disco.

**La corrida entera**, en `t03-corrida-mirada.txt`: `./run.sh`, un solo playback
de 171 s desde el segundo 0, sin seeks, con el switch de la composición encendido
a mano con el botón del cromo, que es sin lo cual el `muted` de los nodos del
aviso no dice nada. Quince lecturas en verde y doce cuadros mirados:

- **Los cinco breaks entran en su segundo** —20,2 s, 45,4 s, 70,2 s, 95,3 s y
  120,2 s— y adentro del break 5 los cuatro avisos se relevan en el 132, el 144 y
  el 156. Cada uno con su cuadro: `t03-break1-cornerOverlay.png`,
  `t03-break2-lbox-video.png`, `t03-break3-lbox-image.png`,
  `t03-break4-quad.png`, `t03-break5-aviso1.png` a `t03-break5-aviso4.png`, y
  `t03-final-fuera-de-break.png` con el programa solo y su audio devuelto.
- **El foco en el `cornerOverlay` del break 1**: un click y el aviso pasa de 0 a
  100 sin mutear, el programa cae a 0 y aparece el anillo
  (`t03-break1-foco.png`); tocado de nuevo, vuelve la mezcla declarada.
- **El foco en el Quad del break 4**: sin foco, `view3` a 100 y los otros dos
  cuadrantes y el primario a 10; un click sobre `view2` lo lleva a 100 con el
  resto a 0 y muteado y el primario a 0, con un anillo y uno solo
  (`t03-break4-quad-foco.png`); tocado de nuevo vuelve el 100/10 declarado y no
  queda anillo (`t03-break4-quad-foco-suelto.png`).
- **Un click con mouse alcanza**, las dos veces, que es la asimetría del gesto
  saliendo del predicado del cromo y no de una rama por dispositivo.

**Dos cosas del harness que valen para la próxima corrida.** Todo lo que lee el
cromo se ancla en `#player`: la página tiene dos players con el mismo cromo y un
selector global mide el pane de fábrica. Y el audio audible se apaga con
`--mute-audio` en el Chrome de la corrida en lugar de tocar el sink del sistema:
el switch de la composición se levanta igual y las lecturas de `volume` y `muted`
son las mismas.
