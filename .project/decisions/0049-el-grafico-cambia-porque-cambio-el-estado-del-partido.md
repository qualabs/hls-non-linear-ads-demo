---
id: "0049"
title: El gráfico del canal cambia en la parada porque cambió el estado del partido, y el reloj no se detiene
status: accepted
scope: phase-08
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El paquete de canal ficticio era una sola pieza: el bug, el tanteador y el reloj, quemados
sobre el plate de punta a punta. Cuando la parada del juego pasó a ser video generado desde
el cuadro de juego —los mismos jugadores dejando de jugar y yendo a tomar agua—, Nicolás
pidió que el gráfico acompañara:

> *"Ahí el tanteador se va y debería aparecer `HYDRATION BREAK`. Se van los tanteadores."*

Y después corrigió **la razón** con la que yo lo había escrito, que decía que el gráfico
suavizaba el corte:

> *"Es que no va a haber un salto raro, porque la imagen va a mostrar que van a dejar de
> jugar y van a pasar a tomar agua."*

## Decisión

**El paquete se parte en tres piezas y el tanteador se reemplaza por una placa
`HYDRATION BREAK` durante la parada**, con el bug del canal siempre presente y **el reloj
corriendo a través del cambio**.

La razón es que **cambió el estado del partido**, y el gráfico es cómo una transmisión dice
eso: en ese minuto no hay nada que tantear. **No mitiga una discontinuidad: no hay
discontinuidad** — la parada sale generada desde el cuadro de juego, así que la imagen ya
muestra a los jugadores dejando de jugar.

**El reloj no se detiene, y la razón es de fútbol y no de diseño:** en una parada de
hidratación el partido no está detenido reglamentariamente. Un reloj corriendo mientras el
tanteador se va dice exactamente *"el partido no se detuvo, la transmisión cambió de
gráfico"*, que es la propiedad que esta demo existe para mostrar, dicha con gráficos.

Las dos placas dejan el hueco del reloj en las **mismas coordenadas**: la placa cambia por
debajo y los dígitos no se mueven. El reloj se dibuja último en la cadena de filtros, así
que no hay un instante del cambio en el que quede tapado.

## Por qué la razón está escrita en los tres archivos

Porque **una razón equivocada sobrevive mejor que un error**. Si el comentario dijera "el
gráfico disimula el corte", el día que alguien mire y vea que no hay corte lo sacaría, con
toda la lógica del mundo — y se llevaría lo que la demo demuestra. Un error se descubre
mirando; una razón equivocada se hereda.

## Consecuencias

- El segundo del cambio sale de `plate.json` (ADR 0044), el mismo del que sale dónde poner
  el break: el gráfico que cambia y la publicidad que se dibuja encima leen un solo número.
- El paquete es tres SVG y no uno, con un encabezado compartido que dice por qué está
  partido.
- El bug del canal cierra en x=1210 sobre 1280 y no contra el borde, porque la librería
  dibuja su control de audio arriba a la derecha (ADR 0015) y medido cae en x 1222..1261. Es
  la única coordenada del paquete que la elige la librería y no el diseño.

## Lo que se descartó

**Dejar el tanteador durante la parada.** Es lo que había, y era defendible mientras la
parada fuera un corte a otro rodaje: la continuidad gráfica ayudaba a que el corte no se
notara. Con la parada generada desde el cuadro de juego esa función desapareció, y lo que
quedaba era un tanteador sobre un minuto en el que no hay nada que tantear.
