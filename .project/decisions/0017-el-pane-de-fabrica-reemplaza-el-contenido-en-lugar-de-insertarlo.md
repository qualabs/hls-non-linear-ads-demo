---
id: 0017
title: El pane del cliente de mercado reemplaza el contenido en lugar de insertarlo
status: accepted
scope: project
date: 2026-09-07
supersedes: null
superseded_by: null
---

## Contexto

Un interstitial tradicional tiene dos modos y son el mismo tag con distinto
`X-RESUME-OFFSET`: reemplazo, donde el aviso ocupa un tramo de la línea de
tiempo del primario y un pedazo del programa no se ve; e inserción, donde el
aviso se agrega y el primario vuelve donde lo dejó (ADR 0016).

**La demo corre inserción**, con `X-RESUME-OFFSET=0` en el Date Range de clase
Apple que escribe `scripts/senalizar-contenido.sh`, y la consecuencia está
medida: la T-12 de la fase 01 encontró que después de cuatro breaks el cliente
de fábrica va **49,47 s de programa atrás**, a 12,37 s por break, y que el
quinto aviso lineal no se completa nunca adentro del recorrido, porque para ese
`START-DATE` el pane de la izquierda todavía está lejos.

Ese atraso está escrito como argumento. El informe de cierre de la fase 01 lo
presenta como el segundo de los dos argumentos de la demo, y el `README.md`
tiene un párrafo entero dedicado a él.

Nicolás probó la demo desde el celular y encontró lo que ese argumento cuesta:
**los dos players están en segundos distintos del programa, así que no se pueden
comparar.** Alguien que mira dos panes al lado quiere compararlos, y lo primero
que ve es que están mostrando escenas distintas de la misma película.

## Decisión

El Date Range de clase Apple de cada break lleva la forma de **reemplazo**. El
tag concurrente no cambia.

Con reemplazo los dos clientes se quedan en el mismo segundo del programa: fuera
del break muestran el mismo cuadro, adentro uno muestra el programa con el aviso
encima y el otro el aviso en lugar del programa, y cuando el break termina
vuelven a estar en el mismo segundo.

**Qué forma exacta tiene el reemplazo es una medición y no una lectura de la
especificación**: si el offset tiene que valer la duración del aviso o si el
atributo tiene que faltar, y qué hace hls.js 1.7.2 con cada una. La decisión es
el modo; el atributo lo fija la medición.

## Consecuencias

**El argumento del atraso se retira, y se retira a propósito.** Se midió en dos
tasks de la fase 01 y está escrito en su informe de cierre, que no se reescribe
porque es la prueba de lo que se midió. Lo que lo reemplaza es un argumento de
otra forma: **el del atraso hay que mirarlo en el tiempo** —hay que ver los dos
panes un rato, entender que uno viene retrasado y aceptar que eso importa—, y
**el nuevo se ve en un cuadro solo**: al mismo segundo del programa, uno muestra
el aviso encima del programa y el otro en lugar del programa.

**Y es el argumento más honesto sobre lo que un cliente de mercado hace con un
break.** Con reemplazo, el contenido que salió al aire durante el break no se ve:
eso es lo que reemplazar significa, y es lo que la demo está contrastando.

**El quinto break se vuelve visible en el pane de la izquierda**, que hoy no
ocurre nunca. El recorrido pasa a mostrar cinco avisos lineales en lugar de
cuatro, sin cambiar el contenido ni los asset-list.

**La palabra "reemplazo" se usa en este repositorio en dos sentidos y este ADR
cambia el segundo.** Uno es que el aviso ocupa el cuadro entero en lugar de
dibujarse encima del contenido, que es lo que quieren decir `js/stock-player.js`
y el comentario de `index.html`, y que era cierto desde la fase 01. El otro es el
modo de reanudación que saltea un pedazo del programa, que es el de este ADR y el
del 0016. Lo que cambia es el segundo; el primero no se movió.

**El ADR 0016 no cambia su decisión.** La clase concurrente sigue sin tener
ninguno de los dos modos y sigue sin cambiar el largo de la línea de tiempo, y el
largo que lee nuestra barra sigue siendo el del VOD primario, que esta decisión
no toca. Lo que queda viejo es la frase de su contexto que dice que la que corre
es la inserción, y por eso ese ADR lleva nota fechada.

**Lo que el reloj del pane de fábrica reporta durante el break sigue siendo el
del aviso y no el del programa**, que ya era cierto y ya estaba escrito en
`js/stock-player.js`. Dejaba de importar porque era una línea de texto; con una
barra en ese pane pasa a estar en pantalla, y qué muestra esa barra es una
decisión de la fase y no un efecto de esta.

**Es reversible y es una línea.** El atributo lo escribe un `printf` de
`scripts/senalizar-contenido.sh`, y volver a inserción es volver ese valor. Lo que
no es reversible en una línea es el texto: el argumento vive en el `README.md` y
en lo que David presenta.

**Para David es un cambio de lo que él cuenta en escenario**, así que conviene
contárselo antes del sync del 21 de septiembre y no después.
