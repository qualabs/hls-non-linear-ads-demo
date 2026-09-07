---
id: "0016"
title: La clase concurrente nunca cambia el largo de la línea de tiempo
status: accepted
scope: project
date: 2026-09-04
supersedes: null
superseded_by: null
---

## Contexto

Un interstitial tradicional tiene dos modos, y son el mismo tag con distinto
`X-RESUME-OFFSET`:

- **Reemplazo.** El aviso ocupa un tramo de la línea de tiempo del primario y
  el primario vuelve más adelante, así que un pedazo del programa no se ve. El
  largo total de lo que se mira no cambia.
- **Inserción.** El aviso se agrega y el primario vuelve donde lo dejó, así
  que no se pierde programa y el largo total de lo que se mira crece.

Las dos están medidas en esta demo, y la que corre es la segunda. La playlist
escribe `X-RESUME-OFFSET=0` en el Date Range de clase Apple, y la T-12 midió
la consecuencia en el cliente de fábrica: después de cuatro breaks va
**49,47 s de programa atrás** del player de la demo, a 12,37 s por break, que
es la duración del aviso. Cada break le agregó tiempo de reloj y no le
adelantó programa.

La experiencia concurrente no hace ninguna de las dos cosas. El primario no
se detiene, no se saltea nada y no se agrega nada: el aviso se dibuja encima
de la línea de tiempo que ya estaba corriendo. También está medido, en la
misma corrida: 160,0 s de programa en 160,15 s de reloj de pared, o sea
0,999, con cinco breaks adentro y sin un solo seek.

## Decisión

**La clase concurrente no tiene ninguno de los dos modos del interstitial
tradicional. Siempre va sobre la línea de tiempo existente y nunca la cambia
de largo.**

## Consecuencias

**Refuerza el ADR 0009 desde otro lado, y con un argumento independiente.**
El 0009 dice que la clase concurrente es hermana y no una extensión, y lo
sostiene sobre el protocolo: en HLS la clase se compara por igualdad exacta
de string y no hay herencia. Este ADR agrega un argumento de semántica que no
depende de cómo se comparen las clases: **la clase concurrente tiene
estrictamente menos modos que la de interstitial.** Una extensión promete que
donde funciona la clase padre funciona la hija, y una clase que no puede
hacer ninguna de las dos cosas que la padre hace no cumple esa promesa. Es
material para la especificación de SVTA, junto con el 0009.

**La barra de progreso de la composición no crece cuando entra un break**, y
el largo total es una propiedad del contenido primario y no del calendario de
avisos. Es lo que hace que una sola barra para toda la experiencia sea
posible.

**Y aun así el largo se relee, en lugar de guardarse como constante.** Para
la experiencia concurrente el largo es invariante, así que cachearlo sería
correcto hoy; pero la fase 03 mete interstitials tradicionales adentro del
break, y esos sí tienen los dos modos y sí pueden cambiarlo. Un supuesto que
se rompe entre fases y no avisa es exactamente el que no conviene cablear.

**`X-RESUME-OFFSET` no significa nada en un Date Range de clase
concurrente**, porque no hay nada interrumpido que reanudar. Hoy la playlist
igual lo escribe, con valor 0, copiado del tag de ejemplo del documento de
requerimientos. No es un defecto a corregir ahora —ningún cliente de la demo
lo lee: el nuestro ignora el atributo y el de fábrica ignora la clase— y sí
es una pregunta para SVTA: qué atributos del Date Range de interstitial
conservan su significado en la clase hermana y cuáles no.

> **Nota del 2026-09-07.** El contexto de arriba dice que de los dos modos del
> interstitial tradicional "la que corre es la segunda", la inserción, y lo
> sostiene sobre el `X-RESUME-OFFSET=0` de la playlist y sobre los 49,47 s que
> midió la T-12. **Desde la fase 04 la demo corre el primero**: el Date Range de
> clase Apple lleva la forma de reemplazo, para que los dos panes se queden en el
> mismo segundo del programa y se puedan comparar cuadro a cuadro (ADR 0017). La
> medición de los 49,47 s no se toca: sigue siendo el registro de lo que la
> inserción produjo, y deja de describir a la demo.
>
> **La decisión de este ADR no cambia**, y conviene decir por qué no. La clase
> concurrente sigue sin tener ninguno de los dos modos y sigue sin cambiar el
> largo de la línea de tiempo; el largo que relee nuestra barra sale del contenido
> primario, que es un VOD que el cambio de atributo no toca. Lo que hay ahora es
> un rango de reemplazo corriendo de verdad, y corre en el pane del otro player.
> Con eso la razón para releer el largo en lugar de guardarlo gana una segunda
> fuente antes de la fase 03: el pane de fábrica pasa a tener su propia barra, y
> lo que su elemento reporta durante un aviso de reemplazo es el tiempo del aviso
> y no el del programa.
