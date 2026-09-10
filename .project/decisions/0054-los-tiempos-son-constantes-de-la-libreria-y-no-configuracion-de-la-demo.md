---
id: "0054"
title: Los tiempos son constantes de la librería y no configuración de la demo
status: accepted
scope: phase-09
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Nicolás pidió que el comportamiento vaya **fijo** en la sdk y no como algo que cada
demo prenda: *"dejémoslo medio como fijo que siempre tengan estos elementos"*. Y al
mismo tiempo dio los tiempos como valores para corregir mirando y no como
mediciones: el achique del primario en 350 a 400 ms, el difuminado del banner en
unos 200 ms para entrar y más rápido para salir.

Las dos cosas juntas dicen dónde tienen que vivir esos números: en un lugar donde
se cambien de una línea, y que no sea la página.

## Decisión

**Cuatro constantes exportadas arriba de `lib/renderer.js`**, al lado de
`PRELOAD_LEAD_SECONDS` y `CUT_TOLERANCE_SECONDS`, que es donde este archivo ya pone
lo que alguien puede querer discutir: **380 ms** para la geometría con curva de
salida suave, **200 ms** para el difuminado de entrada, **120 ms** para el de
salida, más las curvas.

**Un solo número para las dos direcciones de la geometría**, no dos. Un segundo
número para la salida es una línea el día que mirándolo haga falta; hoy sería un
botón más sin nadie que lo haya pedido.

Descartado: custom properties de CSS que la página pudiera redefinir, y una opción
en `attach`. Las dos vuelven el efecto configurable por demo, que es exactamente lo
contrario de lo que se pidió.

## Consecuencias

- Corregir el efecto mirándolo es editar un número en un archivo, y no hay un
  segundo lugar donde el mismo valor esté escrito.
- **El doc del integrador nombra las constantes y no copia sus valores**, porque un
  número copiado en un doc es un número que queda viejo.
- El orden de magnitud sale de lo que hace un squeezeback de aire y la asimetría del
  difuminado sale de que Nicolás la pidió así. Ninguno de los cuatro está medido, y
  la fase lo declara como riesgo aceptado en lugar de darlos por buenos.
