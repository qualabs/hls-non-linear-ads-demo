# Los rangos del programa, leídos antes del primer break (2026-09-04)

Dos corridas sobre la página viva, sin un solo seek y sin un error de consola.
El documento que las gobierna es `docs/contrato-senalizacion-renderizado.md`,
sección "Los rangos del programa".

## 1. La lista completa, con el primer break todavía por delante

`t02run.py` → `t02-los-rangos-del-programa.json`.

A los **0,8 s de reloj de pared y con `currentTime` en 0**, o sea antes de que la
reproducción hubiera avanzado un cuadro y veinte segundos antes de que empiece el
primer break, `provider.programRanges()` devuelve **los diez rangos del
recorrido**: cinco de clase `interstitial` y cinco de clase `concurrent`, uno de
cada clase por break, en 20, 45, 70, 95 y 120 s, de 12 s cada uno.

En el mismo instante `activeAt(0)` devuelve una lista vacía, que es la diferencia
entera entre las dos consultas.

El largo no sale de la consulta: la corrida lo relee del contenido primario
—180 s— y calcula ahí la fracción de cada rango sobre la barra, que es lo que va
a hacer quien pinte.

## 2. La promesa, en sus dos estados

`t02run2.py` → `t02-la-promesa-de-la-lista.json`. Los asset-list llegan dos
segundos tarde a propósito, con la demora puesta en la red del browser y sin
tocar una línea de código, porque una promesa que solo se observa cumplida no
está medida.

| momento | `settled` | rangos |
| --- | --- | --- |
| asset-list en vuelo, t = 1,85 s | `false` | 5, todos `interstitial` |
| asset-list resueltos, t = 9,97 s | `true` | 10, cinco y cinco |
| adentro del primer break, t = 25,02 s | `true` | 10, cinco y cinco |

Los cinco rangos de la lectura parcial están idénticos en la final: la lista solo
creció. Y es la lectura parcial la que muestra de dónde sale cada mitad: el rango
de clase Apple se lee del tag y está en el instante en que la playlist llega; el
concurrente necesita su asset-list y aparece cuando vuelve.

Adentro del primer break, con los dos rangos de ese break en la lista,
`activeAt(25,02)` devuelve **una sola experiencia**, `AD-1-CONCURRENT`
(`cornerOverlay`). El rango de clase Apple está marcado y no se reproduce, que es
exactamente lo que la barra tiene que poder decir.
