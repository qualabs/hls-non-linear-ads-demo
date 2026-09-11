---
id: "0071"
title: La salida del multi view es clear(), y tiene dos entradas y una sola implementación
status: accepted
scope: project
date: 2026-09-11
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

Nicolás puso el invariante de la salida en palabras y es fuerte: salir *"quiere
decir poner simplemente el contenido original como venía, el principal y listo,
sin tocar nada de la cámara, del CC, del viewport"*.

Un botón no garantiza eso. Lo que lo garantiza es que no exista un segundo camino
de vuelta, porque dos caminos son dos cosas que pueden diferir, y la que difiere
se descubre en cámara.

El proyecto ya tiene ese camino escrito: `clear()` en `lib/renderer.js`, que es lo
que corre cuando la composición se queda sin experiencias activas.

## Decisión

**Salir del multi view es `clear()`**, el mismo evento que cierra un break
concurrente, sin una ruta propia.

Tiene **dos entradas y una sola implementación**: el botón de salir, y destildar
la última vista, que deja una sola caja y por lo tanto ninguna composición
(ADR 0065). Las dos llaman a lo mismo.

**No se escribe un `exitMultiview()` que restaure cosas.**

## Consecuencias

Las garantías, una por una, y todas son propiedades de `clear()` que ya existen:

- **El viewport.** `node.removeAttribute('style')` sobre el primario borra el
  atributo entero, y con él el `transform`, el `left`, el `top`, el `width`, el
  `height` y la transición. Lo que vuelve a decidir es la hoja de estilos de la
  página, que es la que decidía antes. **No hay estado que pueda quedar
  desincronizado porque no se guarda ningún estado**, y ésa es la razón por la que
  esta decisión es barata y confiable a la vez.
- **El audio.** `node.volume = 1` en la misma pasada. El mute no se toca: es de
  quien mira y su control está en pantalla.
- **El anillo y el foco.** `setFocus(null)` es la primera línea.
- **Los decodificadores.** Cada nodo de vista se `detach()`ea y se `remove()`e, así
  que las instancias secundarias de hls.js mueren con ellos.
- **El CC.** No hay nada que restaurar porque no hay nada que se haya tocado:
  `lib/` no menciona `textTracks`, `cue`, `subtitle` ni `caption` ni una vez. El
  invariante no se construye, se conserva, y se chequea con un grep.

**El botón es un atajo y no una alternativa.** Irse de una grilla de cuatro
destildando cuesta tres gestos, y "¿cómo salgo de esto?" se contesta mejor con
algo que se ve que con algo que se deduce.

**No hace falta el caso especial de `aws-multiview`.** Allá `removeRegion` se
niega a sacar la última región porque algo tiene que quedar; acá una sola caja es
un estado perfectamente legal, porque es el programa.

**Se verifica corriendo las dos entradas y comparando contra la misma
referencia**: el `style` del primario es `null` antes y después por los dos
caminos, y `volume` vale 1. Que las dos den lo mismo es lo que prueba que hay una
sola puerta; si divergen, es que alguien escribió la segunda.

**Y el chequeo del CC necesita un control para poder fallar**: se corre el grep
sobre un `lib/` con una ocurrencia plantada a propósito y se confirma que la
encuentra. Un grep que da cero sobre un archivo donde nunca hubo nada no prueba
nada, y este proyecto ya escribió dos chequeos que no podían fallar.
