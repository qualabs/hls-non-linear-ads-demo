---
id: "0078"
title: El foco de audio muere con su caja y no con la composición
status: accepted
scope: project
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: ["0029"]
generalized_by: null
---

## Contexto

El ADR 0029 fijó cinco caminos de salida del foco de audio y a qué mezcla se
vuelve. Dos de ellos están escritos nombrando el mecanismo que los producía: *"se
rearma la composición: cuando cambia el `nextKey`, el renderer hace `clear()` y
reconstruye, el nodo enfocado ya no existe y el foco muere con él"*, y *"cierra el
break"*. Los dos decían lo mismo porque hasta ese momento las dos cosas eran la
misma: cualquier cambio destruía todos los nodos, así que no había con qué
distinguirlas.

El ADR 0070 rompió esa coincidencia. Los nodos que sobreviven a un cambio se
quedan, así que hoy la composición puede cambiar de forma alrededor de una caja
que nunca dejó de reproducirse.

Eso deja la pregunta sin contestar justo donde el multi view la hace todo el
tiempo: alguien le da el sonido a una cámara, sube otra, y la grilla se re-arma
alrededor de la que estaba sonando. Con la letra del 0029 leída al pie, ese gesto
—que no es sobre el audio y que no toca esa caja— apagaría el sonido que esa
persona acababa de elegir. Y lo apagaría **en silencio**: un foco que se suelta se
oye y no se ve, así que no hay nada en pantalla que lo reporte.

## Decisión

**El foco se suelta cuando el nodo que lo tenía deja de existir, y no cuando la
composición cambia.** Es la pregunta exacta en lugar de la aproximación que el
0029 podía hacer cuando todo dejaba de existir al mismo tiempo, y es lo que esas
dos salidas siempre quisieron decir.

De ahí salen las tres cosas que esto fija, y ninguna agrega un camino nuevo:

- **Una composición que cambia de forma alrededor de una caja que sigue viva deja
  el foco donde quien mira lo puso.** Es la única respuesta que no le saca el
  audio a una caja que no se fue a ninguna parte.
- **El índice viaja con su elemento.** El foco es el objeto del elemento (ADR
  0026) y el contrato entrega objetos nuevos en cada pasada, así que una entrada
  que se conserva se vuelve a atar al elemento de esta pasada. Sin eso, un cambio
  de forma soltaría un foco que nadie pidió soltar.
- **La identidad sigue siendo la de la regla 6 del contrato**, `itemId` más la
  identidad del elemento. El foco nunca se conserva por posición de caja ni por
  `id` de elemento, que es lo que el 0029 descartó y sigue descartado: dos
  experiencias solapadas sin `id` propio comparten ese campo, y conservar por ahí
  le daría a un anunciante el audio que quien mira eligió para otro.

Las cinco salidas del 0029 y el destino que ese ADR fijó —la mezcla que declara el
asset list— quedan exactamente como están. Lo que cambia es por qué se disparan
dos de ellas.

## Consecuencias

**Es una generalización del ADR 0029 y no un supersede, y el criterio es el que
este proyecto ya usa: no es cuánto cambió, es si algo dejó de ser verdad.** Nada
de lo que el 0029 decide se vuelve falso. El destino de la vuelta sigue siendo la
mezcla declarada; las cinco salidas siguen siendo cinco; los cuatro descartes de
ese ADR —el foco idempotente, conservarlo por posición o por `id`, mantenerlo
cuando el asset se termina, volver al primario— siguen en pie tal como están
escritos. Lo único que pasó es que la condición que dos de sus salidas nombran
ahora se puede alcanzar sin que se rearme nada, y esta decisión la enuncia al
nivel al que siempre se refería.

**El borde entre dos avisos de un mismo break se comporta igual que antes**, y eso
importa porque es donde el 0029 argumentó: ahí el aviso que tenía el foco
efectivamente no está —cambió el `itemId`—, así que el nodo se destruye, el foco
se cae solo y la marca del ADR 0030 desaparece con él. La pantalla cambia entera
en ese borde, así que el cambio de sonido sigue teniendo causa visible.

**Dónde se hace la pregunta también cambia, y es la mitad que lo hace auditable.**
Se hace donde se aplica el plan, que es el único lugar que sabe qué nodos
sobrevivieron, y no en el camino de destruir, que sólo podía contestar bien
cuando destruía todo. Lo que queda como aserción es que después de aplicar el
plan, un foco que apunta a un elemento que no está dibujado se suelta.

**El costo es que este camino no lo ve `node --test`**: un listener del DOM no se
observa sin DOM, y la regresión que lo descubrió —tocar una caja cuya composición
había cambiado después de crearse dejaba toda la composición muda— pasó entera por
la suite en verde. Lo que la cubre es la lectura del `volume` de cada elemento
sobre el navegador, contra su propia referencia.
