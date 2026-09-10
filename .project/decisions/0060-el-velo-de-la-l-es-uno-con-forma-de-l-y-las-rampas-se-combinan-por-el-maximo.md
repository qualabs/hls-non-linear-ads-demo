---
id: "0060"
title: El velo de la L es uno con forma de L, y las rampas se combinan por el máximo
status: accepted
scope: phase-10
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La L lleva un velo oscuro debajo de la tipografía para que el texto se despegue del
fondo. Estaba hecho de **dos rectángulos, uno por banda**, y eso tiene tres defectos
que no son de calibración sino **de la forma**, los tres medidos:

- **El de abajo terminaba de golpe** donde se le acababa el ancho: un salto de alfa
  de **180 sobre 255 en un solo píxel**.
- **Donde los dos se pisaban, las opacidades se componían**, dejando el codo en
  **231** contra **192 y 158** de cada banda por separado. O sea que la esquina donde
  la L se dobla era la parte más oscura del cuadro, y por acumulación y no por
  diseño.
- Y **del lado derecho la banda inferior se quedaba sin velo ninguno.**

Dos rectángulos que se cruzan tienen siempre un borde donde uno termina y una suma
donde se pisan. No hay opacidad que arregle eso.

## Decisión

**Un solo velo con forma de L**: dos rampas que cubren el **cuadro entero** y se
combinan con `lighten`, o sea **el máximo de las dos y no la suma**.

Medido después: salto máximo **1 sobre 255**, el codo en el mismo valor que las
bandas, y la banda inferior cubierta de punta a punta.

**Su opacidad está a la vista en el template porque es un equilibrio y no un valor
derivado.** Con el velo cubriendo el codo, el velo y el zapato pelean, y **0,55** es
donde el zapato conserva luminancia y la tipografía sigue despegada.

## Consecuencias

- **La forma dejó de tener bordes propios.** Los únicos bordes que quedan son los de
  las rampas, que es lo que una rampa es.
- **El máximo y no la suma es la parte que hay que no romper.** Combinadas por suma,
  dos rampas que cubren el cuadro entero oscurecen todo el cuadro; por máximo, cada
  punto toma la más oscura de las dos y el resto queda como estaba. Alguien que
  refactoree a dos rectángulos porque parece más simple compra de vuelta los tres
  defectos de arriba.
- El velo cubre el codo, que es lo que habilitó poner el zapato entero ahí (el
  recorte del zapato se calcula desde su caja medida por energía de borde, no desde
  constantes), y a cambio obliga a negociar la opacidad contra la luminancia del
  producto.
