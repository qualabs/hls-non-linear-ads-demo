# T-01 — El freno de la composición, medido en el navegador

**El riesgo R6 queda cerrado y a favor: `video.pause()` sobre el contenido primario
congela también las cajas de video del aviso, y `video.play()` las reanuda.** Así que el
freno del guion es un `pause` y la librería no se toca (ADR 0040), y la fase no crece.

## Cómo se midió

Chrome real por el skill `playwright`, en una pestaña propia con label, contra la demo
actual servida en el 8080 —que quedó arriba y **no se tocó**: esta task no modificó un
solo archivo del repositorio—. Las consultas ancladas en `#player`, que es el pane de la
demo, porque la página tiene dos players con el mismo cromo.

El instrumento es `t01-medir-freno.js`. Para cada break: se busca la posición, se
reproduce tres segundos para que el aviso arranque de verdad, se lee, se pausa el
primario, **se lee dos veces separadas por 1600 ms**, se reanuda y se lee otra vez. Lo
que se lee de cada nodo es `currentTime`, `paused` y `readyState`, más
`provider.activeAt(t)` para dejar escrito qué aviso estaba en pantalla.

Las dos lecturas de la pausa son lo que distingue **quieto** de **todavía no arrancó**,
que en una captura se ven igual.

Se midió en tres lugares del recorrido, y el primero es el que importa porque es el que
tiene varias cajas a la vez:

| break | qué hay en pantalla | cajas de video del aviso |
| --- | --- | --- |
| `AD-4-CONCURRENT.0`, `multiView`, t=95..107 | el Quad | **3** |
| `AD-5-CONCURRENT.2`, `linear`, t=144..156 | el aviso a cuadro entero del break mezclado | 1 |
| `AD-5-CONCURRENT.0`, `cornerOverlay`, t=120..132 | el primer aviso del break mezclado | 1 |

## Las lecturas

El Quad, que es el caso más exigente. `t01-lecturas.json` las trae completas:

| lectura | primario | `currentTime` del primario | las tres cajas |
| --- | --- | --- | --- |
| antes del `pause` | corriendo | 100,959 | 5,958 · 5,958 · 5,958, las tres corriendo |
| pausa, t0 | pausado | 100,959 | 5,959 · 5,959 · 5,959, las tres pausadas |
| pausa, t0 + 1600 ms | pausado | 100,959 | **5,959 · 5,959 · 5,959, sin moverse** |
| después del `play` | corriendo | 102,170 | 7,169 · 7,168 · 7,167, las tres corriendo |

Los otros dos breaks dan lo mismo con una caja: 5,958 → pausada en 5,959 → 5,959 a los
1600 ms → 7,167 después del `play` en el lineal a cuadro entero, y 5,960 → 5,960 → 5,960
→ 7,166 en el `cornerOverlay`.

La corrida se repitió entera y devolvió los mismos números.

## El control, porque un chequeo negativo lo pide

Este chequeo **podría no poder fallar**: si los nodos del aviso nunca hubieran arrancado,
`paused` habría dado `true` durante la pausa igual, y la lectura habría parecido un
éxito. Es el defecto que la fase 07 encontró en el chequeo del scroll y que el riesgo R7
de esta fase nombra.

El control está adentro de la misma corrida y son las dos lecturas de los extremos:
**antes del `pause` los nodos están en `paused: false`, y entre esa lectura y la de
después del `play` su `currentTime` avanza 1,21 s** (5,958 → 7,169) sobre ~1200 ms de
reloj de pared. O sea que los nodos **pueden** correr y **estaban** corriendo, así que el
cero de avance durante los 1600 ms de la pausa dice algo.

## Qué queda escrito para la T-04

- El freno es `video.pause()` sobre el primario, y **el `play` lo reanuda todo en el
  mismo cuadro del aviso** donde había quedado: no hay que guardar y restaurar posiciones.
- El primario también se congela, obviamente, y su `currentTime` no se mueve, así que un
  beat puede leer la posición durante la pausa sin carrera.
- `readyState` se queda en 4 en todos los nodos durante la pausa, así que reanudar no
  paga un rebuffer.

## La captura

`t01-quad-congelado.png`: el Quad detenido en t=102,5 s, con los cuatro cuadrantes
dibujados y el botón de play a la vista. La línea de estado del pane dice
`primary content + CONCURRENT AD (multiView) · 102.5s · nothing was replaced`.
