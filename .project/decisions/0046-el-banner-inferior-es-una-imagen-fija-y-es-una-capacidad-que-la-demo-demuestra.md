---
id: "0046"
title: El banner inferior es una imagen fija, y es una capacidad que la demo demuestra
status: accepted
scope: phase-08
date: 2026-09-09
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

El minuto lleva tres avisos no lineales, y el mecanismo acepta que un elemento del layout
sea una imagen y no un video. Eso está construido desde la fase 01 y hoy sólo se ve en el
recorrido de la demo técnica, donde es uno de los cinco layouts del documento de
requerimientos.

Lo que hay medido, leyendo el repositorio: el elemento declara su MIME y el renderer
decide con él —`isImage` mira el `mediaType` y `build` crea un `<img>` en lugar de un
`<video>`—; los tres lugares donde una imagen no es un video están resueltos, porque no
entra en `playable()`, `applyAudio` la saltea y el aviso de asset cortado no aplica; el
asset list ya tiene la forma en `asset-list-squeezebackLShape-image.json`, con
`"type": "image/jpeg"` y un `uri` a un `.jpg`; y la ventana la declara la señalización y
no el asset, que es lo que hace que una imagen —que no tiene largo propio— pueda ocupar
un tramo del break igual que un video.

## Decisión

**El banner inferior, que es el primero de los tres avisos no lineales, es una imagen
fija.** Con eso el minuto muestra **tres formas de aviso** y no dos: lineal a cuadro
entero, imagen fija no lineal, y video no lineal.

Es un argumento y no un asset, y por eso el guion lo nombra: lo que demuestra es que el
mecanismo acepta las dos cosas.

## Consecuencias

- **No cuesta trabajo nuevo en la librería.** La capacidad está construida, verificada y
  corriendo; lo que esta decisión agrega es que la demo la *diga*.
- **Obliga una restricción de autoría del creativo, y es concreta.** El ADR 0013 llena
  cada caja con recorte centrado y sin deformar, así que una imagen que no tiene la
  relación de aspecto de su caja se recorta, y lo que se recorta son los bordes, que es
  donde vive la tipografía de un banner. El banner se escribe como SVG a la relación de
  aspecto exacta de su caja, calculada de los porcentajes del `viewport`.
- Encaja con el ADR 0045 en lugar de tensionarlo: los formatos no lineales ya iban a ser
  imagen fija con tipografía compuesta.
- El suite de la demo asierta las tres formas, así que ninguna se puede perder editando
  el asset list: cuatro avisos, exactamente uno sin bloque de layout, y exactamente uno
  cuyos elementos son `image/*`.
- Descartado que las tres formas no lineales sean video y que la capacidad de imagen se
  cuente en el README. Un README no lo lee nadie en escenario, y la capacidad se ve en un
  cuadro.
