---
id: "0043"
title: El aviso lineal va tercero, y ahí se pone el caso de negocio
status: accepted
scope: phase-08
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El minuto del break de hidratación lleva cuatro avisos: uno lineal de diez segundos y
tres no lineales. El lineal existe para mostrar que el mismo mecanismo también hace el
caso tradicional, y es un `ASSET` sin bloque de layout, que es el requerimiento 4 del
documento del evento y en este repositorio ya se reproduce por el camino único del
ADR 0019.

Dónde cae ese aviso adentro del minuto es lo que decide si la comparación entre las dos
formas de poner publicidad se ve o se explica. Nicolás lo pidió en segundo o tercer
lugar.

## Decisión

**El lineal es el tercero de los cuatro, y el beat que se dispara en el cambio del aviso
2 al 3 es donde el guion cuenta el caso de negocio.**

El orden del minuto es una **curva de intrusión**: banner inferior, que deja el partido
entero a la vista; formato L, que lo repliega a una esquina; lineal, que lo tapa; y
overlay de esquina, que lo devuelve.

**Tercero y no segundo**, por tres razones que apuntan al mismo lado:

- **La línea de base tiene que estar construida antes de romperla.** En segundo lugar el
  lineal interrumpe cuando el espectador vio un solo aviso no lineal, así que la
  comparación es contra una impresión y no contra una costumbre.
- **La adyacencia con la L es la más filosa del minuto.** La L es lo más intrusivo que
  todavía deja ver el partido y el lineal es lo primero que no lo deja, así que el corte
  queda entre "casi no puedo verlo" y "no puedo verlo", que es el corte que usa la tesis.
- **El minuto termina en la solución y no en el problema**, porque después del lineal
  queda el overlay y el último cuadro del break es el partido a la vista con publicidad
  encima.

## Consecuencias

- **La comparación entra adentro de un solo minuto y en un solo player**, así que el
  espectador acaba de sentir lo que la frase le va a explicar.
- De ahí sale una consecuencia de alcance: **esta demo no necesita el par de
  compatibilidad.** La comparación está en el tiempo y no en el espacio, así que no hay
  dos players en pantalla ni un segundo Date Range de la clase de Apple, y no hay que
  explicar por qué uno de los dos paneles se ve distinto. Ese argumento lo hace
  `compatibility-pair`, que es la demo técnica y se queda como está.
- El beat del cambio 2 → 3 es el momento más importante del minuto y el único lugar donde
  la demo argumenta en palabras: su texto se juzga aparte del resto del guion.
- Descartado el lineal primero: pone la comparación antes de que haya algo con qué
  comparar, y arranca el minuto con la imagen del problema. Descartado el lineal último:
  cierra con la pantalla tapada. Descartado el lineal afuera del minuto, en un break
  propio: es más fiel a cómo sería en aire, y rompe todo lo anterior.
