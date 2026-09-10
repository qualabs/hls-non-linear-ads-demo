# Evidencia de la T-03 — el difuminado de los nodos de aviso

Registro de lo que se midió el 2026-09-10. No es instrucción vigente.

## Lo que quedó en `lib/renderer.js`

`place()` escribe la opacidad del nodo de aviso, con la transición cuando
corresponde y en la duración que corresponde según la dirección: 200 ms entrando,
120 ms saliendo. `leavingNow` decide también **quién no tiene salida que pintar**.
Y `build()` dejó de borrarle la opacidad al nodo anticipado, porque ése era el 0
desde el que la entrada interpola.

## El defecto que se evitó en el diseño y quedó verificado

Si un nodo que no difumina pudiera estar "saliendo", su opacidad se iría a 0
**120 ms antes** de que cierre su ventana, destapando el contenido primario
durante esos 120 ms. Es lo contrario del corte seco que el aviso a cuadro entero
tiene que ser.

Por eso `leavingNow` contesta `false` para él: su salida es que `clear()` lo
destruya en el borde. **La muestra que lo prueba es la de 53.999**, la última
antes del borde, donde el aviso a cuadro entero sigue en opacidad 1.

## Los tres casos, medidos

`mediciones.txt` tiene las rampas. En resumen:

- **Entrada del banner**: 0 → 0.295 → 0.802 → 0.976 → 1 entre 14.00 y 14.20.
- **Salida del banner**: 1 → 0.779 → 0.198 → 0.017 entre 29.88 y 30.00, y el nodo
  desaparece **después** del borde.
- **El aviso a cuadro entero**: aparece con `duration: 0ms` y opacidad 1, mantiene
  una sola opacidad distinta en 382 muestras, y sigue entero en la última muestra
  antes de su borde. Sin efecto en ninguna de las dos puntas.

## R3, contestado con dos mediciones

El riesgo era que en los últimos 120 ms el backplate se difumine mientras el
primario todavía crece encima, dejando ver una banda de fondo. En ~45.96 el
primario está en escala **0.9990** (medición de la T-02) y el backplate en
opacidad **0.198**: cuando el backplate empieza a irse de verdad, el primario ya
cubre el 99,9 % del cuadro. La banda sin tapar es de **~1 píxel** al 20 % de
opacidad. No hay nada que ver, y **no hace falta la línea del `zDepth`** que el
ADR 0052 dejaba preparada. Queda igual como cosa para mirar en la T-05.

## La captura, mirada

- `banner-entrando-opacidad-0.295.png` — la entrada del banner **cazada en vuelo y
  congelada** en 0.295: "MERIDIA", "SOMEWHERE ELSE, THIS WEEK" y "SEE THE FARES"
  fantasma sobre la cancha, con los jugadores viéndose enteros a través.

  Y es el cuadro que **prueba que la T-06 y la T-03 componen bien juntas**: antes
  de la T-06 este mismo cuadro habría sido un rectángulo negro translúcido, porque
  un nodo con cama difumina la cama.

## Una cosa que no se hizo, a propósito

**No se le apagan los punteros al nodo que se está yendo.** La primera forma del
diseño lo pedía, porque ahí el nodo sobrevivía a su ventana y podía comerse un
gesto siendo invisible. Con la salida adentro de la ventana el nodo está activo
por derecho propio mientras se va —`activeAt` lo dice— así que apagarle los
punteros sería inventar una regla. Lo que queda es un cuadro o dos en opacidad 0
antes de que `clear()` lo destruya, y el foco de audio muere con él de todas
formas (ADR 0029).
