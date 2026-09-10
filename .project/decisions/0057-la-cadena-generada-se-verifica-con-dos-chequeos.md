---
id: "0057"
title: La cadena generada se verifica con dos chequeos, porque el de costuras es ciego a un corte suave
status: accepted
scope: phase-10
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El plate del partido se arma concatenando eslabones de video generado, cada uno
sembrado del último cuadro del anterior. `verificar-plate.sh` mide si las costuras
se ven: la diferencia media de luminancia entre cada par de cuadros consecutivos a
lo largo del plate entero, donde un corte aparece como un pico.

**Ese chequeo mide continuidad, y continuidad no es identidad de escena.** Dejó de
ser teórico cuando un eslabón volvió con un **fundido encadenado adentro** —los
jugadores duplicados y semitransparentes durante unos treinta cuadros, y del otro
lado del fundido otra escena, con un arco y una reja que no estaban—. Su serie de
diferencias se quedó **entre 3,1 y 6,0 de punta a punta**, y su costura con el
eslabón anterior midió **1,9x**, igual que las buenas. Un corte suave atraviesa el
chequeo sin despeinarse.

## Decisión

**Dos chequeos, y cada uno contesta una pregunta que el otro no puede.**

- **`verificar-plate.sh`** pregunta *¿se ve la costura?* Corre **después** de armar
  el plate y mide continuidad cuadro a cuadro.
- **`verificar-cadena.sh`** pregunta *¿es la misma escena?* Corre **antes** de armar
  el plate. Recorta la franja de arriba del cuadro —reja, pista, arco: lo que no se
  mueve, porque los jugadores están abajo— y la compara contra el mismo recorte del
  acto 1.

**Y se muestrean tres momentos de cada eslabón y no uno.** También está medido: el
eslabón del fundido daba **30,8 a los dos segundos —limpio— y 57,2 a los cuatro**.
Un fundido puede ocupar un tercio del eslabón y dejar los otros dos limpios, así que
una sola muestra por eslabón lo deja pasar.

Descartado: **un solo chequeo más exigente.** No es un problema de exigencia. La
diferencia entre cuadros consecutivos no contiene la información que hace falta:
sobre un fundido de treinta cuadros, cada par consecutivo es casi idéntico al
anterior, que es precisamente lo que un fundido es.

## Consecuencias

- **El chequeo de costuras dice en su propio encabezado lo que no puede ver**, y
  está escrito ahí y no en un ADR porque es donde lo lee quien lo corre. Sin esa
  nota se usa como si viera todo, que es lo que pasó.
- Los dos chequeos corren en momentos distintos del pipeline, así que no se pueden
  fusionar sin que uno pierda su lugar: el de cadena existe para **no** armar un
  plate con un eslabón malo adentro.
- **Verificado contra el caso conocido y no sólo argumentado**: puesto el eslabón
  del fundido en su lugar, `verificar-cadena.sh` lo marca; con el bueno, la cadena
  entera pasa. Es un chequeo que se probó capaz de fallar, que en este proyecto es un
  requisito y no una prolijidad.
- Los tres modos en que una generación salió mal quedan anotados juntos donde vive la
  receta (ADR 0061), y **los tres pasan el chequeo de costura**: deriva de escena
  entre eslabones, una prohibición sin alternativa que el modelo llena con lo que
  conoce, y este fundido con un corte adentro. Ninguno se deduce de los otros dos.
