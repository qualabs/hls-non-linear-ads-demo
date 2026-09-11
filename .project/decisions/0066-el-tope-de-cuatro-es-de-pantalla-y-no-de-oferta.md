---
id: "0066"
title: El tope de cuatro es de pantalla y no de oferta, y con la grilla llena las filas se deshabilitan
status: accepted
scope: project
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El diseño anterior de esta fase suponía que quien mira entraba al multi view con
todo lo que la oferta trajera, y de ahí salía un caso de error: qué hacer con una
oferta de más de tres vistas. Con el modelo de selector (ADR 0067) ese supuesto se
cae, y con él el caso de error: **una oferta más larga que la grilla pasa a ser lo
normal**. Una playlist puede anunciar ocho cámaras perfectamente.

Lo que queda por decidir es otra cosa: qué pasa cuando alguien intenta subir una
cuarta vista con la grilla ya llena.

## Decisión

**El tope de cuatro es de cajas en pantalla y no de vistas ofrecidas.** Nada se
recorta en la oferta: el catálogo es tan largo como el que publica quiera, y la
librería no lo cuestiona.

Con cuatro cajas arriba, las filas del selector que no están en pantalla quedan
**deshabilitadas**, con una línea que dice por qué. El movimiento de quien mira es
bajar una y subir otra.

## Consecuencias

**Dos toques, los dos obvios, ninguno sorprendente.** Es la propiedad que decide
esta forma contra las otras tres.

**Reemplazar automáticamente a la última que entró queda descartado** porque falla
en la dirección invisible: quien mira agregó una cámara y perdió otra, y no hay
nada en pantalla que diga qué pasó.

**El canje de `aws-multiview` queda descartado, y conviene decir por qué, porque
es la solución correcta allá.** Su regla R8 —elegir un deporte que ya está en
pantalla intercambia las dos regiones— existe por una condición de aquel
catálogo: cuatro deportes y cuatro regiones, así que con el mosaico lleno la lista
de ausentes está vacía. Su propio `menu.js` lo dice: *"a list of only the absent
ones would be empty exactly in the full mosaic, which is where the demo spends
most of its time"*. Acá la oferta es más larga que la grilla por construcción, así
que la lista nunca está vacía y el canje resolvería un problema que no tenemos a
cambio de un concepto más.

**Una grilla más grande queda descartada** por el *"llegamos hasta ahí"* de
Nicolás.

El alcance es de proyecto porque decide algo del formato y no sólo del control:
dice que una oferta puede declarar más vistas de las que cualquier cliente va a
poder mostrar a la vez, y que eso es legal. Un cliente con otro tope —o una
plataforma que componga seis— lee la misma oferta sin cambiarle nada.
