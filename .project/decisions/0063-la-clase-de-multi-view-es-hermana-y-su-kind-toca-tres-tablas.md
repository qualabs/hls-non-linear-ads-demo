---
id: "0063"
title: La clase de multi view es hermana de las otras dos, y su kind toca tres tablas y no una
status: accepted
scope: project
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La experiencia de multi view la anuncia la playlist con un Date Range, igual que
el aviso concurrente, y hay que decidir qué relación tiene su clase con las dos
que el proyecto ya lee.

El ADR 0009 ya contestó la pregunta análoga para la clase concurrente y su
argumento no depende de qué experiencia se anuncie: en HLS la clase de un
DATERANGE se compara por igualdad exacta de string y el formato no tiene ningún
mecanismo de herencia, así que "extiende a" no tiene nada detrás que lo
implemente. `lib/signalling.js` lo tiene escrito como un objeto de una entrada por
clase, `KIND_OF_CLASS`, y `kindOfClass()` devuelve `null` para cualquier otra.

Lo que no es análogo es lo que pasa aguas abajo del `kind`. El aviso concurrente
entró cuando sólo había dos kinds, y desde entonces aparecieron tres tablas
indexadas por ese campo, en dos archivos distintos.

## Decisión

`com.qualabs.hls.multiViewInterstitial`, **hermana** de
`com.qualabs.hls.concurrentInterstitial` y de `com.apple.hls.interstitial`, y no
extensión de ninguna. Cruza la costura del ADR 0003 como un `kind` nuevo,
`'multiview'`, con lo que la clase de HLS sigue sin cruzar.

Del tag se mantienen `ID`, `START-DATE`, `X-ASSET-LIST` y `PLANNED-DURATION` con
el mismo significado. `X-RESUME-OFFSET` y `X-SNAP` siguen siendo inertes por la
razón del ADR 0016: no hay nada interrumpido que reanudar. **`X-RESTRICT="SKIP"`
se omite**, porque no hay break que saltear: el contenido principal sigue
corriendo y componer es opcional.

**Y el `kind` nuevo se agrega a las tres tablas que lo indexan, no a dos:**

- `KINDS_PLAYED` en `lib/concurrent-hls.js`, porque un rango de multi view **sí**
  es algo que este player reproduce y por lo tanto algo que su barra marca
  (ADR 0018).
- `RANGE_COLOURS` en `lib/controls.js`.
- `RANGE_TITLES` en `lib/controls.js`.

## Consecuencias

**La tercera tabla es la que falla en silencio, y por eso la decisión la nombra en
lugar de dejarla al que implemente.** El comentario de `RANGE_TITLES` ya lo tiene
escrito: *"A kind with no NAME is a mark with no tooltip. A kind with no COLOUR is
a mark that is not drawn at all"*. Un `kind` agregado a dos de las tres produce un
rango que el player reproduce y la barra no marca, sin error de ningún tipo, que
es exactamente la clase de falla que este proyecto ya pagó varias veces.

De ahí sale un chequeo barato que la fase entrega: **un test que asserta que las
tres tablas tienen el mismo conjunto de claves**. Es lo que convierte "acordate de
tocar las tres" en algo que no se puede olvidar.

**No prometemos una compatibilidad que el protocolo no puede dar**, igual que en
el ADR 0009: un cliente de interstitials va a ignorar la clase nueva por completo.
La compatibilidad hacia atrás sale de servir las dos cosas (ADR 0007) y del
repliegue del ADR 0019, no de la relación entre las clases.

Es material para la especificación de SVTA y por eso el alcance es de proyecto:
decide cómo se señaliza la experiencia de multi view, no sólo cómo la señaliza
esta demo. Cuando SVTA publique, la clase pasa a su namespace y la relación entre
las tres sigue siendo la que fija este ADR.
