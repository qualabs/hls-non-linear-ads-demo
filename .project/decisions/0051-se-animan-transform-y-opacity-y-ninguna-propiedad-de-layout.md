---
id: "0051"
title: Se animan `transform` y `opacity`, y ninguna propiedad de layout
status: accepted
scope: phase-09
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

En `lib/renderer.js` la geometría se escribe en dos lugares distintos y no son
simétricos. El contenido primario se mueve con un `transform`
(`renderer.js:560`, ADR 0001): las otras cuatro propiedades que `movePrimary`
escribe son la caja base, el rectángulo de la imagen, que no cambia mientras no
cambie el área. Un nodo de aviso, en cambio, se coloca escribiendo `left`, `top`,
`width` y `height` (`sizeAsset`, `renderer.js:505-511`).

O sea que "animar la geometría" significa una cosa muy distinta según de qué
elemento se hable, y las dos no cuestan lo mismo.

## Decisión

**Se animan `transform` y `opacity`, y nunca `left`, `top`, `width` ni `height`.**

Dos razones y cada una alcanza sola. La primera es de alcance: las cuatro
propiedades de layout son las de un nodo de aviso, y animar la caja de un aviso no
es nada de lo que se pidió. La segunda es de costo: son propiedades que el
navegador resuelve haciendo layout en cada cuadro de la animación, mientras
`transform` y `opacity` las resuelve el compositor — y esto se graba, así que un
tirón en el cuadro cae justo en el momento en que la demo quiere lucir.

## Consecuencias

- **La banda de la L nunca se anima por sí misma.** Lo que el espectador ve moverse
  es el contenido primario, y la banda aparece porque el primario la destapa. Es
  exactamente lo que Nicolás describió —*"el contenido ya estaba abajo y ¡vup!
  aparece"*— así que la restricción de costo y el efecto pedido apuntan al mismo
  lado.
- Que el efecto de la L funcione depende de la forma del ADR 0047: el aviso a
  cuadro entero por detrás y el primario encima. Sobre la L autorada como dos tiras
  el mecanismo también corre, y lo que se ve es la imagen creciendo mientras las
  tiras se difuminan.
- Ninguna de las dos animaciones necesita que el aviso cambie de tamaño, así que
  `sizeAsset` queda sin tocar.
