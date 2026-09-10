---
id: "0056"
title: La cama negra es del video, y una imagen conserva su alfa
status: accepted
scope: phase-09
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

`createNode` le escribía un fondo negro a **todo** nodo de aviso, con una razón
escrita al lado que es legítima: un elemento de video es transparente hasta que
decodifica su primer cuadro, y sin esa cama se vería el contenido primario a
través del aviso mientras arranca.

La razón es de video y la línea corría antes de distinguir de qué nodo se trata.
Sobre una imagen con canal alfa hace lo contrario de lo que se quiere: la compone
contra negro y su transparencia deja de existir.

**Y no es un defecto estético.** Uno de los objetivos de la demo del break de
hidratación es mostrar que la librería acepta PNGs con transparencia, así que con
la línea puesta esa capacidad estaba anunciada y no existía. Medido sobre el
creativo del banner —1120×126, color type 6— el **47 % de sus píxeles lleva alfa
parcial** y sólo el 51 % es opaco: casi medio creativo se estaba pintando sobre
negro.

**Tampoco lo podía arreglar la página.** Es un estilo inline que la librería
escribe sobre el nodo que ella crea, y ninguna hoja de estilos de un integrador le
gana.

Lo encontró Nicolás en el inspector, destildando la propiedad.

## Decisión

**La cama negra la lleva el nodo de video y no la lleva la imagen.** El
discriminante es `isImage`, que este archivo ya calcula nueve líneas más arriba
para decidir qué elemento crear, así que la condición no agrega nada nuevo al
archivo.

**Y el argumento no es que sea más prudente: es que los dos daños no duran lo
mismo.** A un video la cama le cuesta sólo hasta que decodifica, y de ahí en más
es invisible porque el video es opaco. A una imagen con alfa le cuesta **para
siempre**. Una sola respuesta para los dos no puede estar bien.

Descartado: **sacar la línea para los dos.** Devuelve el parpadeo del contenido
primario a través del aviso mientras el video arranca, que es lo que la línea
estaba puesta para evitar. El arreglo es la condición, no el borrado.

Descartado también: **una tabla de qué formatos llevan alfa**, para dejarle la
cama a un JPEG, que no tiene ninguna. Esta capa no lee un contenedor para deducir
lo que hay adentro, y el contrato rechaza exactamente eso en su sección de qué
cuenta como "no lo puedo dibujar": *"el chequeo miraría el contenedor y no lo que
importa"*. Una tabla de formatos, además, es una cosa para mantener.

## Consecuencias

- **La capacidad que la demo anuncia existe.** Verificado en pantalla sobre el
  mismo cuadro antes y después: el rectángulo negro con esquinas rectas se fue, y
  el banner se lee con su forma propia, con la cancha y las piernas de los
  jugadores viéndose a través de sus bordes.
- **Era una precondición del difuminado y no una capacidad vecina.** Un nodo con
  cama difumina la cama: a opacidad 0,5 lo que aparece sobre la imagen es un
  rectángulo medio negro y no medio banner. La transición que el ADR 0050 declara
  para el banner no se podía entregar bien con esta línea puesta, y ése es el
  motivo por el que se arregló dentro de esta fase en lugar de derivarse a otra.
- **Lo que queda expuesto**, y es chico: una imagen puede dejar ver el contenido
  primario a través de ella en los cuadros previos a cargar. `bringAhead` ya la
  trae tres segundos antes en `opacity: 0`, así que en el camino ordinario llega
  cargada, y con el difuminado además entra por opacidad.
- El nodo de video conserva su cama, y eso se afirma en el chequeo y no se supone:
  la aserción sobre el DOM mira los dos nodos y no sólo el que cambia.
- Lo que esto **no** arregla es que un creativo esté mal calculado o asuma un
  fondo. La librería deja de romper el alfa; que el creativo se vea bien sigue
  siendo de quien lo hace.
