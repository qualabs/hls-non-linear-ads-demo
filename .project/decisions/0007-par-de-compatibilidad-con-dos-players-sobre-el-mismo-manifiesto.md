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

> **Nota del 2026-09-07.** La fase 04 le pone a ese pane **nuestro cromo**: el
> mismo skin y los mismos controles que dibuja la librería en el pane de la demo,
> para que las dos imágenes se diferencien en el mecanismo y no en el mobiliario.
> Eso obliga a decir qué cubre "sin modificar" en este ADR, porque hay una lectura
> que lo rompería: si ese pane corriera nuestra librería para tener el skin, el
> argumento se cae, ya que el punto es que un cliente de mercado funciona sobre la
> misma playlist **sin tocarlo**.
>
> **Lo que queda sin modificar es la instancia y su configuración**, y el cromo lo
> dibuja la página alrededor. Los controles se pueden usar sin la parte de
> concurrentes (nota del 2026-09-07 del ADR 0015), así que ese pane sigue
> corriendo hls.js pelado. Y no se afirma: se verifica con tres lecturas de la
> página corriendo, que son la definición de done de la task que lo viste. La
> instancia se construye con cero opciones (`new Hls()`), su pestaña de red nunca
> pide un asset-list concurrente, y sigue agendando el Date Range de clase Apple.
>
> La otra mitad del cambio es que **ese pane pasa a marcar sus propios rangos en su
> propia barra** (ADR 0018), y que ninguno de los dos muestra controles nativos
> (nota del 2026-09-04 del ADR 0015). Y el argumento de este ADR deja de apoyarse
> en el atraso del cliente de mercado, porque desde el ADR 0017 ese pane reemplaza
> en lugar de insertar y el atraso no existe.
