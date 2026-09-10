---
id: "0052"
title: La salida termina en el borde de la ventana y no arranca ahí
status: accepted
scope: phase-09
date: 2026-09-10
supersedes: null
superseded_by: null
generalizes: null
generalized_by: null
---

## Contexto

La primera forma de la salida era un cambio de ciclo de vida: `clear()` dejaba de
destruir y pasaba a **retirar**, con el nodo quedándose en el DOM mientras su
opacidad bajaba, el `detach` postergado, un temporizador de limpieza, y una guarda
para el caso de que empezara otro break en el medio. Eso ponía la transición
**después** del cierre de la ventana.

Nicolás lo corrigió antes de que se escribiera:

> *"la entrada y salida de las cosas debe ocupar el tiempo definido para que estas
> publicidades se muestren en pantalla, entonces debería verse sí."*

O sea que nada sobrevive a su ventana.

## Decisión

**La transición se paga con el tiempo propio del aviso.** El difuminado de un nodo
empieza 120 ms antes de que su ventana cierre y llega a cero justo en el borde; el
primario empieza a crecer 380 ms antes y llega al cuadro entero justo en el borde.
La salida deja de ser un ciclo de vida y pasa a ser una **agenda**.

**Y ahí está lo que hace chico al mecanismo: mientras la transición corre, la
ventana todavía no cerró.** El nodo del aviso está vivo por derecho propio, el
backplate de la L sigue dibujado, y el primario lo tapa creciendo encima. No hay
que mantener a nadie vivo más allá de su tiempo, así que **no hay `detach`
postergado, no hay nodos retirándose, no hay temporizador y no hay un nodo
invisible que pueda comerse un gesto.** El problema que la primera forma resolvía
desaparece en lugar de resolverse.

**El instante de cada cosa sale del contrato y no de un reloj propio.** Cuánto
queda de la ventana de un elemento es
`experience.startTime + experience.duration - video.currentTime`, la misma cuenta
que el archivo ya hace en `renderer.js:330`. La regla 5 del contrato queda intacta:
`activeAt` sigue siendo lo único que decide si un aviso está activo, y esto sólo lee
dónde está parado adentro de una ventana que ya está abierta.

**Un solo escritor y tres disparadores.** `place()` sigue siendo el único que
escribe geometría y opacidad; lo que cambia es cuándo se lo llama. Hoy son dos
—cambió el aviso activo, o se movió el área— y pasan a ser tres, con el tercero
siendo que un elemento cruzó el umbral de su salida. Cada entrada de `drawn`
recuerda qué se le escribió por última vez, así que la comparación es una
comparación y no una reescritura por cuadro. Descartado: un segundo escritor
corriendo en cada `tick()` al lado de `applyAudio`, porque dos funciones escribiendo
el `transform` del mismo elemento se pisan y averiguar cuál ganó es el tipo de
defecto que no se ve en un cuadro.

## Consecuencias

- **`clear()` no cambia en una línea.** En el borde de la ventana el nodo ya está en
  opacidad 0 y el primario ya está en el cuadro entero, así que destruir el nodo y
  borrarle el atributo `style` al primario es visualmente un no-op. El borrado sigue
  siendo obligatorio y sigue siendo inmediato: con la composición vacía `place()` no
  recorre nada, y un atributo que quedara dejaría al video del tamaño del break
  anterior en cuanto alguien redimensionara la ventana.
- **La salida se ve en las dos demos y nadie tiene que cambiar un asset list.** Los
  últimos 380 ms de la L siguen siendo tiempo de la L, así que el aviso que viene
  después todavía no arrancó y no la tapa.
- **Es una función del instante y no de un evento que ya pasó**, así que un seek
  hacia atrás que salga de los últimos 120 ms vuelve a subir la opacidad sin que
  nadie tenga que acordarse de nada.
- La entrada de `drawn` del contenido primario necesita su experiencia, que hoy no
  lleva (`renderer.js:383`), porque sin ella no hay de dónde leer la ventana.
  `warnIfCut` ya se protege de que no esté (`renderer.js:701`).
- **Una ventana más corta que la transición degrada a "no hay efecto"**, no a un
  cuadro roto: como el objetivo sale del tiempo que queda, el primario apunta al
  cuadro entero desde el primer cuadro y no se achica. Es lo que la regla dice, o sea
  que la transición está acotada por la ventana.
- Sobre el final de una salida las dos cosas pasan juntas: el nodo se difumina
  mientras el primario todavía crece encima. Si eso deja ver una banda fina de fondo,
  la vuelta sale del contrato sin agregarle nada — un elemento con `zDepth` por
  debajo del primario no necesita difuminar a la salida, porque su salida es que el
  primario lo tape — y no se escribe antes de mirarlo.
