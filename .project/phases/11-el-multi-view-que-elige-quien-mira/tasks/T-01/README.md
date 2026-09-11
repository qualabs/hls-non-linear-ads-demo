# Evidencia de la T-01 — la composición cambia sin reconstruirse

Registro de lo que se midió el 2026-09-11. No es instrucción vigente: lo que se
vuelve a correr son los dos instrumentos de acá abajo, y cómo se corren lo dicen
ellos.

## Los dos instrumentos

| archivo | qué hace |
| --- | --- |
| `medicion-t01.py` + `medicion-t01.html` | corre **dos composiciones que comparten elementos**, una detrás de la otra, y lee el `currentTime` de cada nodo antes y después del cambio. `python3 medicion-t01.py` (necesita `playwright`; en esta máquina, el del skill: `/home/nicolas/Skills/playwright/.venv/bin/python`) |
| `mutaciones.py` | la campaña de mutación scopeada: una rotura por regla del reparto, y en cada una **sólo los tests que cubren esa regla**. `python3 mutaciones.py` |

## Lo que dice la medición

Las dos mismas composiciones se corren por **dos rutas**, y lo único que cambia
entre ellas es la identidad de la segunda: en la incremental lleva el mismo
`itemId` —que es lo que el multi view produce—, y en la total lleva uno distinto,
que es exactamente la alternativa que el ADR 0070 descartó. Sin esa segunda
mitad un reloj que avanza no prueba nada.

| ruta | `boxA` / `boxB` | t antes | t justo después | t más tarde |
| --- | --- | --- | --- | --- |
| incremental | **el mismo nodo** | 2,848 / 2,840 | 2,919 / 2,914 | 4,422 / 4,415 |
| total | otro nodo | 7,405 / 7,390 | **0,000 / 0,000** | 8,924 / 8,916 |

La caja que sube (`boxD`) arranca en 0,000 en las dos, que es la referencia de
adentro de la misma lectura: un cero es un cero y no un efecto de cómo se mide.
Las dos rutas terminan en la misma composición —`boxA 634x0x326x184`,
`boxB 0x0x326x184`, `boxD 634x356x326x184`—, que es la equivalencia vista en
pantalla. Los números completos, en `lectura.json`.

## Lo que dice el recorrido

`recorrido.txt` son las tres corridas del comparador de la T-12, con sus dos
lecturas al lado (`recorrido-sin-la-t01.json` y `recorrido-con-la-t01.json`).

Las dos se tomaron sobre un **worktree aparte en RAM**, con `lib/` en HEAD y
únicamente `lib/renderer.js` cambiado, servido en un puerto propio: así lo que se
mide es esta task y no el trabajo en curso de las otras.

| | |
| --- | --- |
| el árbol HEAD, sin un solo cambio, contra la base committeada | **14 de 14 iguales**; el único rojo es el puerto, y está acá para aislarlo |
| con la T-01, contra ese mismo árbol sin ella, en el mismo puerto | **VERDE, 14 de 14 iguales** |
| el control: la misma lectura contra la base alterada a mano | **ROJO**, nombra `adOverlay1` y el segundo 26 |

## Los conteos

| chequeo | resultado | archivo |
| --- | --- | --- |
| `npm test` | 124 pruebas, 124 pasan (13 las agrega esta task) | `suite.txt` |
| `npm run check` | verde: 3 ocurrencias aceptadas en la primera costura, cero hits en la segunda | `costuras.txt` |
| `mutaciones.py` | las 5 roturas en rojo, y el árbol sin mutar verde en los 5 recortes | `mutaciones.txt` |
| `npm run mutaciones` | las 10 roturas en rojo y los 4 chequeos en verde | `mutaciones-hydration.txt` |
