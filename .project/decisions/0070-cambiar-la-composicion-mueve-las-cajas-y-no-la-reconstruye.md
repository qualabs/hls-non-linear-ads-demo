---
id: "0070"
title: Cambiar la composición mueve las cajas y no la reconstruye, así que build y clear trabajan por diferencia
status: accepted
scope: project
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El renderizado reconstruye la composición cuando cambia la identidad de lo que
está activo: `tick()` arma una `nextKey` con los `itemId` y, si difiere de la
anterior, corre `clear()` y vuelve a `build()`. `clear()` destruye todos los nodos
—`detach()` y `remove()`— y `build()` los vuelve a crear.

Eso alcanzaba mientras la composición sólo cambiaba cuando cambiaba el aviso. Con
el multi view cambia por gesto de quien mira: subir una cámara, bajarla, agrandar,
desagrandar.

Hay dos maneras de implementarlo y una es mucho peor de lo que parece. Si cada
cambio produjera un `itemId` nuevo, la máquina existente haría todo el trabajo sin
tocar el renderizado; el costo es que **cada caja se rebuffera** en cada toque del
selector, o sea negro de uno a tres segundos por caja. En un modelo donde el gesto
central es ir agregando y sacando videos, eso es el defecto entero.

## Decisión

**Los nodos que sobreviven a un cambio se quedan.** Sólo se crea el nodo de una
vista que sube y sólo se destruye el de una que baja; agrandar y desagrandar no
crean ni destruyen nada, y todo lo demás se mueve a su caja nueva.

Dos cosas, y ninguna es nueva en forma:

- **Una cuarta razón para llamar a `place()`**, con la forma de `turning()`: un
  predicado que compara lo que cada elemento tiene dibujado contra lo que debería
  tener, y cuando difieren pide `place({ animate: true })`.
- **`build()` y `clear()` trabajan por diferencia.** El reparto entre lo que se
  conserva, lo que se crea y lo que se destruye sale de una **función pura**, que
  recibe lo dibujado y lo que tiene que estar y devuelve el plan.

**La propiedad que hoy compran las funciones totales tiene que seguir valiendo: la
composición no puede quedar a medias.** Aplicado el plan, lo dibujado es
exactamente el objetivo, ni un nodo de más ni uno de menos.

## Consecuencias

**La transición sale gratis y ya está construida.** `place({ animate: true })`
interpola `transform` y `opacity` con los 380 ms y la curva de la fase 09
(ADR 0051, 0053), así que cada cámara que sube empuja a las otras a su lugar nuevo
con tiempo. `aws-multiview` tuvo que cubrir el mismo momento congelando el último
cuadro (su R18) porque allá la composición la corta el servidor; acá es local.

**Es el cambio más caro de la fase y toca el código que dibuja los avisos que ya
andan**, así que la verificación no puede ser la suite existente sola. Los 72
tests de hoy fueron escritos contra el comportamiento **total**, y por
construcción pueden pasar enteros mientras la ruta incremental deja una
composición distinta en pantalla.

**La propiedad que hay que fijar, y que no existía porque no hacía falta, es una
equivalencia: para una experiencia que no cambia, la ruta incremental y la total
dejan la misma composición.** Es lo que hace que el refactor sea auditable en vez
de creíble, y es assertable porque el plan es una función pura sobre datos.

**Que el reparto sea puro es la decisión que hace todo lo anterior posible.** Un
diff enredado con el DOM se prueba mirando, y mirar es lo que este proyecto ya
descubrió dos veces que no alcanza.
