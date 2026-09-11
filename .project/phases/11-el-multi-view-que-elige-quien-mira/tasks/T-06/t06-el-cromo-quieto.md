# El cromo se puede quedar quieto: el mecanismo de holds, con su control

2026-09-11. `lib/controls.js` tiene ahora un `Set` de holds: cualquier
componente suspende el auto-ocultado mientras algo está abierto sobre la imagen,
y el temporizador vuelve a correr cuando el último lo soltó (ADR 0067). Sin esto
el selector de la T-07 se cierra a los 2,6 s en medio de la elección.

## 1. Lo que se agregó

| dónde | qué |
| --- | --- |
| `createHolds(onIdle)` | el `Set` y sus tres operaciones, puro y exportado: `held`, `take`, `release`. `onIdle` se dispara cuando se suelta **el último** hold y nunca antes |
| `createControls` | `arm()` no arranca el temporizador con un hold puesto; `hide()` no baja el cromo con un hold puesto; `hold(token)` toma y muestra |
| el handle | `hold` y `release` salen con `show`, `hide` y `up`. El token es de quien lo toma, así que dos cosas abiertas son independientes |

Soltar es idempotente y soltar algo que no se tomó no hace nada: `release`
devuelve temprano si el token no estaba, de modo que el que cierra puede
llamarlo sin averiguar antes si llegó a tomarlo.

**Los dos tiempos no se tocaron**: `CONTROLS_HIDE_MS` sigue en 2600 y
`CONTROLS_HIDE_TOUCH_MS` en 5000. Sin holds el cromo se comporta exactamente
como antes, y la corrida de control de abajo es la que lo mide.

## 2. El instrumento

| | |
| --- | --- |
| la página | una superficie de 960 × 540 dentro de un viewport de 1280 × 720, con `lib/controls.js` traído por un enlace: lo que corre es el archivo vivo y no una copia |
| el elemento que reproduce | un `<video>` real sobre un `captureStream` de un canvas, **reproduciendo** (`paused === false` anotado en cada lectura): el temporizador sólo se arma con el elemento en marcha, así que sobre uno en pausa la medición no diría nada |
| el gesto | `page.mouse.move` sobre la imagen: el evento que llega es `isTrusted` y de `pointerType` "mouse", que es el que fija el presupuesto en 2600 ms y trae el cromo |
| lo que juzga | la clase de la capa registrada por un `MutationObserver` con `performance.now`, más la captura. La opacidad se anota y no decide |
| el script | `t06run.py`, y la lectura entera en `t06-la-medicion.json` |

Los milisegundos son del reloj de la página y no la suma de los `sleep` del
script. **Y la captura espera a que la transición termine**: la clase se va en un
instante y la capa se apaga en 180 ms, así que una captura sacada al sacarse la
clase muestra el cromo entero y miente sobre lo que se está midiendo.

## 3. Las dos corridas, que son la medición

Las dos son la misma página, el mismo movimiento de mouse y la misma espera de
6 s sin ninguna actividad —más que los 2600 ms del presupuesto del mouse y más
que los 5000 ms del táctil—. La única variable es el hold.

| corrida | a los 6 s | cuándo bajó |
| --- | --- | --- |
| **con hold** | **arriba**: `qa-controls qa-controls--on`, opacidad 1 | no bajó en los 6 s; bajó **2600,3 ms después de soltarlo**, que es el temporizador arrancando de nuevo desde ahí |
| **sin hold** (el control) | **abajo**: `qa-controls`, opacidad 0 | **2598,2 ms después del movimiento del mouse** |

Las capturas: `t06-con-hold-a-los-6s.png` (la barra, el play y el audio sobre la
imagen), `t06-sin-hold-a-los-6s.png` (nada más que la imagen) y
`t06-con-hold-despues-de-soltar.png`.

**El control es lo que hace que esto pueda fallar.** Un cromo que se queda
arriba porque el temporizador nunca se armó se ve igual que uno que se queda
arriba por el hold; la segunda corrida dice que en esa misma página, sin el
hold, el cromo se va a los 2,6 s.

## 4. El test y lo que mata

`test/chrome-holds.test.js`, cinco casos sobre `createHolds`: el que suelta
primero no baja el cromo del otro, soltar dos veces arma la cuenta una sola vez,
soltar un token que nadie tomó no cambia nada, tomar dos veces con el mismo
token es un hold, y un set sin callback es un set.

Sin campaña de mutación, que el nivel de verificación de la task no pide. Sí un
chequeo de que el test no es vacío, sobre una copia y no sobre el archivo del
repositorio: reemplazado el `Set` por la semántica de un flag —`release` vacía
todo y avisa siempre— caen 4 de los 5 casos.

## 5. Lo que quedó para la T-07

El orden de los dos listeners del toque afuera. Con el cromo arriba y la lista
abierta, un toque en la imagen llega primero al `pointerdown` de los controles,
donde `hide()` no hace nada porque el hold está puesto, y después al listener
que la T-07 registre, que cierra la lista y suelta el hold: el cromo no
desaparece con la lista, se va 2,6 s más tarde como después de cualquier otro
gesto. Es consecuencia del orden de registro y no de una decisión, así que la
T-07 lo tiene que verificar en pantalla.
