---
id: "0089"
title: El contenido primario se dibuja encima de los elementos con los que no se superpone
status: accepted
scope: project
date: 2026-09-29
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El renderizador daba a cada elemento `z-index = zDepth` (regla 2 del contrato). En un side by side
(`squeezebackDoubleBox`, primario 0, aviso 1) eso deja el aviso arriba del primario. Quieto no se
nota, porque las dos cajas no se tocan. En la entrada y en la salida sí: el primario se achica
desde el cuadro entero hasta su caja, y crece de vuelta en los últimos 380 ms, mientras el aviso
está quieto en la suya. Con el aviso arriba, la transición se lee como un aviso pegado encima del
programa. Nicolás pidió que el principal vaya siempre por encima en esas transiciones, en la
librería y para todos los layouts que corresponda.

## Decisión

**El primario se dibuja por encima de todo elemento con el que su `box` no se superpone.** Donde
se superponen manda el `zDepth` declarado, porque ahí el orden es el significado: un overlay va
encima del programa y el fondo de la L va debajo. Es `stackingOf` en `lib/renderer.js`, una función
pura: duplica los índices para hacer lugar, al primario le da uno más que el elemento más alto que
no toca, y un elemento que lo pisa y estaba declarado arriba lo sube por encima.

La regla lee la geometría que el contrato ya trae, así que un layout nuevo tiene la misma respuesta
sin que nadie lo agregue a una lista.

## Consecuencias

- Quieto no cambia nada que se vea: sólo se reordenan cajas que no se tocan. Lo verifican las
  otras cuatro demos recorridas break por break.
- Cambia la entrada y la salida de los side by side, y también las del multi view, donde el
  primario se achica sobre las cámaras que entran: el mismo efecto de destapar.
- El test es de la función pura, con sus controles; en el navegador, `z-index` leído cuadro a
  cuadro durante la transición.
