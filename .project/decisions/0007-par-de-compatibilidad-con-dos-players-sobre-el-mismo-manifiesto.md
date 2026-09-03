---
id: 0007
title: Mostrar la compatibilidad hacia atrás con dos players sobre el mismo manifiesto
status: accepted
scope: phase-01
date: 2026-09-03
supersedes: null
superseded_by: null
---

## Contexto

El argumento más fuerte que la demo puede hacer frente a la audiencia del
evento no es que nuestro cliente hace algo nuevo, sino que eso nuevo se
despliega sin romperle nada a los clientes que ya están en el mercado.

Ese argumento necesita un mecanismo, y el mecanismo no puede ser la
herencia de clases. En HLS la clase de un DATERANGE se compara por
igualdad exacta de string, tal como lo fija el ADR 0009, así que ningún
cliente existente reconoce una clase derivada. La compatibilidad hacia
atrás no puede venir de que una clase extienda a la otra: tiene que venir
de servir las dos cosas y dejar que cada cliente se quede con la que
entiende.

La misma configuración de hls.js que el ADR 0002 usa para apagar la
maquinaria de interstitials permite tener, en la misma página y con la
misma librería, una instancia que se comporta como cualquier cliente de
mercado y otra que hace lo nuestro.

## Decisión

La demo muestra la compatibilidad hacia atrás en la misma página, con dos
players sobre el mismo manifiesto.

La media playlist lleva dos tags en el mismo `START-DATE`: uno de clase
`com.apple.hls.interstitial` con el aviso lineal, y otro de clase
`com.qualabs.hls.concurrentInterstitial` con la experiencia concurrente.

Al lado del cliente de la demo corre una instancia de hls.js sin
modificar y con su configuración de fábrica, que reproduce el aviso
lineal e ignora lo que no entiende, mientras el cliente de la demo elige
la experiencia concurrente.

## Consecuencias

La demo deja de decir "nuestro cliente hace algo nuevo" y pasa a decir
"esto se despliega sin romperle a nadie", que es un argumento mucho más
fuerte frente a esa audiencia.

El costo es chico y está acotado: un tag más en la playlist, un
asset-list más, y una segunda instancia de player en la página. No agrega
riesgo técnico, porque la instancia de fábrica hace exactamente lo que ya
sabe hacer.

Cada Date Range del par lleva su propio `ID`, por la nota del ADR 0005
sobre la fusión de tags con identificador repetido.
