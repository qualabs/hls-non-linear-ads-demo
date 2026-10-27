---
id: "0128"
title: dash/signalling.js lee el EventStream del texto del MPD en el interceptor de respuesta, no de los eventos de dash.js
status: accepted
scope: phase-19
date: 2026-10-26
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El diseño de la fase 19 suscribía la librería a los eventos del MPD con `onReceive` y dejaba el
interceptor de respuesta como repuesto para leer `ReplacePresentation` (ADR 0125). T-01 midió dash.js
5.2.1: los eventos llegan todos al cargar, pero el cuerpo en CDATA no llega (`messageData`
`undefined`: el modelo lee `__cdata` y el parser deja `#cdata`), los atributos de
`ReplacePresentation` no llegan, y `Event@id` pasa por `parseInt`. Las tres cosas están en el nodo
crudo del manifest, por una ruta que no es API. El interceptor recibe el MPD como texto antes que los
eventos.

## Decisión

`dash/signalling.js` registra un `addResponseInterceptor`, toma la respuesta que es el MPD, la
parsea con `DOMParser`, y de ahí saca cada Event de los dos esquemas (el de SVTA y el de Replace):
su cuerpo en CDATA o en texto, sus atributos, su id como string. El tiempo de cada Event lo calcula
la librería con `Period@start`, `@timescale` y `@presentationTimeOffset`. No usa los eventos de
dash.js.

## Consecuencias

- Todo por API pública, y sin depender del bug del CDATA ni del borrado de `messageData` a los 10 s:
  esto deja sin efecto, para el código, la consecuencia del ADR 0120 que decía que el cuerpo se lee
  del evento al recibirlo.
- El prototipo calcula el inicio de los Periods sólo con `Period@start` o con el fin del anterior;
  un MPD de varios Periods sin esos datos queda fuera, como live.
- El bug del CDATA va al REPORT, para David (los ejemplos de §6.1 usan CDATA) y para upstream.
