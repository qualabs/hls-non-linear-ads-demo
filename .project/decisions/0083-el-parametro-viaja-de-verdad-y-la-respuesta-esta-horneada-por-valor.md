---
id: "0083"
title: El parámetro de decodificadores viaja de verdad y la respuesta está horneada por valor
status: accepted
scope: phase-14
date: 2026-09-21
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

David pidió que en escenario se vea que el pedido del asset-list lleva cuántos
decodificadores tiene el dispositivo y que **la respuesta cambia** con ese número. Dijo
además que la versión ideal sería que un ad presentation server adapte la respuesta de forma
dinámica, pero que para la demo alcanza con cambiar a qué superficie se llama.

La capacidad existe en la librería desde hace fases y está documentada en
`docs/integrating-the-library.md`: `attach` recibe `decoderCount`, `usableDecoderCount` lo
valida, `assetListUrl` lo agrega como `qa-decoder-count`, y `createSignalling` lo lee **una
sola vez**. Lo que no existe es nada del otro lado que lo lea.

Y no puede existir: **las demos se publican como archivos estáticos en un bucket de GCS**, sin
servidor. Cualquier diseño que pidiera responder el parámetro en tiempo de pedido muere el
día que la demo se publica, que es el día en que hace falta.

La instrucción de Nicolás fue explícita: *"no quiero es hacer un servidor del otro lado para
responder esto, va a ser simplemente casi que un if"*.

## Decisión

**El parámetro viaja de verdad, y la respuesta está horneada por valor.**

- El control declara `decoderCount`, así que `qa-decoder-count` **sale en la petición real**
  del asset-list y se ve en el network tab. No se simula, no se dibuja: es la URI que la
  librería construye.
- La señalización escribe **una playlist por escalón de respuesta**, cada una con sus
  `X-ASSET-LIST` apuntando a su juego de asset-lists estáticos. El control elige la playlist
  y el valor, y rearma el player.
- **No hay servidor, y la página lo dice.** Una línea visible en cada página que muestre el
  pedido: el parámetro es el que un ad presentation server leería, y acá la respuesta está
  horneada por valor.

**Tres posiciones, y la del medio es la que más dice:** sin declarar, 1 y 2. En "sin
declarar" la URI sale **exactamente igual** que para un integrador que nunca oyó de la
opción, que es una rama real de `usableDecoderCount` y no una convención de la página. El
punto en cámara es la misma petición con y sin el parámetro, una al lado de la otra.

**No hay una posición 3 ni una 4**, porque ningún layout de esta demo pide más de dos
decodificadores de video: el primario más un elemento de aviso. Un escalón que nada usa sería
una afirmación falsa con forma de control.

## Consecuencias

**Rearmar el player al cambiar de posición no es un rodeo, es el contrato.** `decoderCount`
se lee una sola vez al crear la señalización, con el argumento escrito de por qué: lo que ese
valor puede tener de equivocado es una afirmación del integrador, y es una y no una por
break. Cambiarlo en vivo rearma el player con cualquier diseño.

**Que "sin declarar" y "2" devuelvan lo mismo es verdad y no una simplificación**: un ad
server que no recibe el dato contesta con su default.

**La demo no puede afirmar que existe adaptación dinámica**, y la línea de la página está
justamente para que no lo parezca. Si alguna vez hay un servidor, esta decisión no lo
estorba: el parámetro que ya viaja es el que ese servidor leería.

**El costo es un juego de asset-lists por escalón.** Son archivos que el script de
señalización escribe, así que el costo es de archivos y no de mantenimiento; lo que hay que
cuidar es que los dos juegos se generen del mismo lugar y no se editen a mano por separado.
