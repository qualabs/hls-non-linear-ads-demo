---
id: "0041"
title: La placa es una capa de la página, y el player lleva su propio contexto de apilado
status: accepted
scope: phase-08
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La pausa del guion es donde vive lo minimalista: fondo oscuro, una frase, tipografía
grande. Eso tiene que taparle el player, que es donde vive la densidad.

Y hay una trampa concreta: **el cromo se dibuja con `z-index: 2147483000`**
(`CONTROLS_Z_INDEX` en `lib/controls.js`), un número elegido para ganarle a cualquier
cosa de la página en la que la librería se embeba.

## Decisión

**La placa es un elemento de la página por encima de la caja del player**: un fondo
oscuro casi opaco y una frase centrada. No es un filtro sobre el video, no es una clase
que la librería dibuje, y no vive adentro del contenedor que el renderer gobierna.

**Y el contenedor del player lleva `isolation: isolate`**, con lo que el `z-index` del
cromo queda encerrado adentro de su propia caja y la placa se apila por encima con un
número normal.

## Consecuencias

- La librería no se toca, que es la misma línea del ADR 0040.
- El cromo queda detrás de la placa, que es lo que la estética quiere: durante la pausa
  no hay controles a la vista.
- Descartado darle a la placa un `z-index` todavía más alto. Anda, y deja la página con
  un número mágico que nadie puede explicar sin leer el código de la librería.
- Vale escrito porque es una hora perdida para quien no lo sabe: sin el contexto de
  apilado, la placa se dibuja y no se ve, y nada en la consola lo dice.
