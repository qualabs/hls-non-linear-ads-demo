---
id: "0009"
title: Tratar la clase concurrente como hermana de la de interstitial, no como una extensión
status: accepted
scope: project
date: 2026-09-03
supersedes: null
superseded_by: null
---

## Contexto

El documento de requerimientos de David describe la clase
`com.qualabs.hls.concurrentInterstitial` como una extensión de
`com.apple.hls.interstitial`, y el motivo declarado de plantearla así es
preservar la compatibilidad hacia atrás.

Esa herencia es conceptual y ningún cliente puede actuar sobre ella. En
HLS la clase de un DATERANGE se compara por igualdad exacta de string y
el formato no tiene ningún mecanismo de herencia, así que "extensión" no
tiene nada detrás que la implemente. hls.js lo muestra en una sola línea:
el getter de `loader/date-range.ts:189` es
`return this.class === CLASS_INTERSTITIAL`.

Rob Walch, que mantiene hls.js, ya escribió en público la misma posición
en el issue `video-dev/hls.js#7571`: "side by side, pip, and overlay
would not be considered interstitials and deserve a class of their own".

## Decisión

La clase concurrente es **hermana** de la clase de interstitial, no una
extensión de ella, y así se la nombra de acá en adelante en todo el
material del proyecto.

La compatibilidad hacia atrás no sale de la relación entre las dos
clases. Sale de servir las dos cosas y dejar que cada cliente se quede
con la que entiende, que es el ADR 0007.

## Consecuencias

Se deja de prometer una compatibilidad que el protocolo no puede dar. Un
implementador que lea "extensión" espera que un cliente de interstitials
haga algo razonable con la clase nueva, y lo que va a pasar es que la
ignore por completo.

Es material para la especificación de SVTA, y por eso el alcance de esta
decisión es de proyecto y no de la fase: decide cómo se señaliza la
experiencia concurrente para siempre, y no solamente cómo la señaliza
esta demo. Cuando SVTA publique, la forma pasa a su namespace,
`com.svta.hls.concurrentInterstitial`, con el nombre todavía a definir
del lado de ellos, y la relación entre las dos clases sigue siendo la que
fija este ADR.

Contradice el documento de requerimientos de David en un punto explícito,
así que la posición hay que sostenerla en la conversación con él, con el
argumento de la comparación exacta de strings y con la cita de Rob.
