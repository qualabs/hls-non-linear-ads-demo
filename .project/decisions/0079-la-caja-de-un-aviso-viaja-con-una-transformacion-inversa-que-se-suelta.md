---
id: "0079"
title: La caja de un aviso viaja con una transformación inversa que se suelta
status: accepted
scope: project
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El ADR 0070 dio por sentado que mover una caja no costaba nada: *"la transición
sale gratis y ya está construida"*, porque `place({ animate: true })` ya
interpolaba `transform` y `opacity` con el tiempo y la curva de la fase 09.

**Era cierto para el contenido primario y falso para los nodos de aviso**, y las
dos mitades de esa frase son la misma decisión de la fase 01 vista desde los dos
lados. El primario está en pantalla llenando el cuadro y lo que hay que hacer con
él es moverlo, así que se mueve con un `transform` y ése es el que se anima. Un
nodo de aviso lo crea el renderizado y **su caja es su geometría**: se coloca con
`left`, `top`, `width` y `height`. No tenía ningún `transform` encima, así que la
lista de propiedades animadas nombraba una que en ese nodo no cambiaba nunca, y
cambiar las cuatro medidas de layout de golpe es un salto. Con un solo aviso por
break eso no se veía porque una caja de aviso no cambiaba de lugar nunca; el
selector del multi view es exactamente el gesto que la hace cambiar de lugar.

Animar las cuatro medidas tampoco es una salida: es la propiedad que el ADR 0051
descartó, porque obliga al navegador a resolver layout en cada cuadro, y el
momento en que eso pasaría es justo el único en que **toda** la composición se
mueve a la vez.

## Decisión

**Una caja que cambia de lugar se escribe en su destino y una transformación
inversa la pinta donde estaba; soltar esa transformación es el viaje.**

En orden, y es el orden lo que lo hace funcionar:

1. El nodo se coloca en su caja **de destino**, en una sola escritura y sin
   transición: las cuatro medidas de layout quedan siendo la verdad sobre dónde
   está la caja.
2. Se le escribe la transformación que lo devuelve a la caja de la que venía —una
   traslación y una escala, con el origen arriba a la izquierda—, que es una
   función **pura y exportada**, porque todo lo que puede estar mal ahí es
   aritmética y la aritmética se apunta sin navegador.
3. Se lee una propiedad geométrica del nodo. **Eso es el mecanismo y no una
   precaución**: dos escrituras de estilo en el mismo turno del bucle de eventos
   son una sola para el navegador, así que sin esa lectura pintaría únicamente la
   segunda y no habría transición.
4. La transformación se suelta a la identidad con una transición de `transform`,
   en el tiempo y la curva del movimiento de la composición.

**Qué caja viaja y cuál no se decide con una sola cosa: dónde se dibujó la última
vez.** Un nodo que no tiene esa memoria es un nodo que está entrando, y entrar no
es viajar. La salida es una opacidad y un `clear`, y tampoco. Lo que queda es la
caja que estaba y ahora está en otro lado, que es el gesto que se pidió. Un
cambio de tamaño de la ventana queda afuera sin un chequeo de más, porque es el
único que coloca sin animar (ADR 0053).

## Consecuencias

**Lo que se anima sigue siendo `transform` y `opacity`, y ninguna propiedad de
layout** (ADR 0051). Lo que esta decisión agrega es el `transform` que un nodo de
aviso no tenía, no una excepción a esa regla: es lo que la vuelve verdadera
también de este lado.

**El costo es un layout por caja que viaja, una vez por gesto y nunca por
cuadro.** Lo que corre sesenta veces por segundo después de esa lectura es la
transformación, que es trabajo del compositor.

**Las dos maneras de llegar a la caja siguen siendo dos y el viaje es uno solo.**
Cuál de los dos elementos lo está haciendo es la única rama; cuánto tarda y a qué
se parece es una sola respuesta, así que una caja de aviso que se re-acomoda
llega con el mismo tiempo y la misma curva con los que la imagen del programa
llegó siempre.

**Y la mueve completa, con lo que esté dibujado encima.** El botón que el cromo
dibuja sobre una caja tiene que llegar cuando llega la caja, así que el tiempo y
la curva se **importan** del archivo que los define en lugar de escribirse de
nuevo (ADR 0054): un segundo número es un segundo número que mantener, y el día
que alguien corrija el movimiento mirándolo, el que no se mueve es el cromo.

**El ADR 0070 no queda superseded por esto y no es un detalle de forma.** Su
decisión —que los nodos que sobreviven se quedan, que `build` y `clear` trabajen
por diferencia a partir de una función pura, y que la composición no pueda quedar
a medias— sigue entera y en pie. Lo que estaba mal era una de sus consecuencias,
que afirmó construido un mecanismo que para los nodos de aviso no existía. Un
supersede diría que la decisión dejó de valer, y una generalización diría que este
espacio contiene al suyo; ninguna de las dos es cierta. Queda una nota fechada al
pie del 0070, con su prosa intacta, apuntando acá.

**Y la lección que se paga dos veces si no queda escrita:** una consecuencia de un
ADR que afirma que algo *"ya está construido"* es una afirmación sobre el código y
no sobre la decisión, y se verifica antes de escribirla o se mide después. Ésta se
descubrió mirando, que es la manera cara.
