---
id: 0003
title: Separar señalización y renderizado en dos capas con un contrato entre ellas
status: accepted
scope: phase-01
date: 2026-09-03
supersedes: null
superseded_by: null
---

## Contexto

La forma en que la demo se entera de que hay una experiencia concurrente
y la forma en que la dibuja son dos problemas que cambian a ritmos
distintos.

El primero va a cambiar varias veces. Hoy se resuelve leyendo los
DATERANGE que hls.js sin modificar le entrega a la aplicación, tal como
lo fija el ADR 0002. Se ven venir por lo menos otras dos formas: un
hls.js parcheado, y la API client-side del issue `video-dev/hls.js#7571`,
que está abierto con milestone 1.8.0 y que permitiría insertarle a
hls.js los eventos que hoy no reconoce en lugar de parchear su
comparación de clases.

El segundo, el renderizado, es donde está la mayor parte del trabajo de
la fase y todo el riesgo visual, y no depende de HLS en absoluto.

## Decisión

La demo se construye como dos capas separadas con un contrato entre
ellas.

La capa de señalización tiene una sola responsabilidad: producir, para
un tiempo de reproducción dado, la lista de experiencias concurrentes
activas con su layout ya resuelto.

La capa de renderizado consume eso y no sabe nada de HLS.

## Consecuencias

La señalización tiene hoy una implementación y puede tener otras sin
tocar el renderizado. Cambiar de la lectura de DATERANGE a un hls.js
parcheado, o a la API client-side cuando salga, es reemplazar una capa y
no reescribir la demo.

Es también lo que permite que la parte de iOS que entra por Emil comparta
el modelo aunque no comparta una línea de código: lo que se comparte es
el contrato, no la implementación.

El costo es la disciplina de no dejar que el renderizado lea nada de HLS
por atajo, porque el día que lo haga la capa deja de ser reemplazable y
la consecuencia anterior se pierde sin que nadie lo note.
