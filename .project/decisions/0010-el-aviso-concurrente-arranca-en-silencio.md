---
id: 0010
title: Arrancar el aviso concurrente en silencio y dejarle el audio al contenido primario
status: superseded
scope: phase-01
date: 2026-09-03
supersedes: null
superseded_by: 0014
---

## Contexto

Cuando la experiencia concurrente tiene sonido, hay que decidir qué pasa
con el audio del contenido primario, y la demo lo va a tener que resolver
de alguna manera visible.

El documento de requerimientos no dice nada al respecto. El modelo de
datos de la herramienta de SVTA tiene un campo `volume` por asset y otro
para el contenido primario, lo que sugiere que se espera mezclar o
atenuar, pero no fija ninguna política.

## Decisión

El aviso concurrente arranca en silencio, el contenido primario conserva
su audio, y la página expone un control visible para activar el audio del
aviso.

## Consecuencias

La demo muestra lo que existe para mostrar. Un aviso concurrente que se
lleva el audio es indistinguible de una interrupción, que es exactamente
lo contrario de lo que la publicidad no lineal propone.

El campo `volume` del layout se lee y se respeta como estado inicial del
control, así que el modelo de datos se usa completo y no se ignora la
mitad.

La demo no propone una política de mezcla. La mezcla es una decisión de
producto, de quien arma la campaña, y este POC no la inventa. Si la
especificación de SVTA quiere fijar una, este ADR no la bloquea: fija el
comportamiento de la demo, no el del formato.

El control visible tiene además un beneficio de escenario, porque
activarlo en vivo es una manera de mostrar que las dos fuentes de audio
están ahí y que la elección es del reproductor.
