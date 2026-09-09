# T-01 — El scrub: un solo camino, y el seek al soltar

La barra se arrastra. Un press en cualquier parte de ella pone la pelotita ahí y
empieza el arrastre, la pelotita sigue al puntero, y al soltar el video seekea a
donde quedó. Un press y release sin mover seekea a ese punto, que es lo que la
barra ya hacía y con el mismo número.

## Qué cambió, y es todo un archivo

Todo en `lib/controls.js`:

- **`let scrubbing = null`**, el arrastre en vuelo expresado como la fracción del
  programa que el puntero pide. Es el único estado que la barra guarda, y existe
  porque un arrastre es el único momento en que lo que la barra muestra no es lo
  que el video está haciendo.
- **`paint()` cambia en una línea**: el `at` sale de `scrubbing * length` cuando
  hay arrastre y del `currentTime` cuando no. Lo leen las tres cosas que llevan
  una posición —el `fill`, el `knob` y el reloj `elapsed`—, así que la barra
  entera dice lo mismo durante el gesto. `paintRanges` no se tocó: las marcas son
  el largo y no la posición.
- **`seekFromEvent` se partió en dos.** La cuenta quedó igual y ahora se llama
  `fractionFromEvent`, que devuelve la fracción y nada más; escribir
  `video.currentTime` pasó a `endScrub`, que es el release. Ésa es la línea del
  ADR 0032 y es lo único de esta task que cambia algo que ya funcionaba.
- **Cuatro listeners sobre la barra**, donde antes había uno: `pointerdown`
  arranca el scrub, agrega la clase del anillo grande y captura el puntero;
  `pointermove` y `pointerup` mueven la fracción, y el up además cierra con seek;
  `pointercancel` y `lostpointercapture` cierran sin seek.
- **`hide()` no corre con un scrub en vuelo** (ADR 0035), y `endScrub` llama a
  `show()`, que rearma el temporizador desde el final del gesto.
- **La hoja de estilos**: `touch-action: none` y `user-select: none` en
  `.qa-track`, y `.qa-track__knob--scrubbing` con el tamaño sobre `--qa-rail`
  como todo el resto del cromo.

## Cuatro cosas que la task decidió

- **La captura no se suelta a mano.** El ADR 0034 dice capturar en el press y
  soltar en el release; el browser devuelve la captura solo en `pointerup` y en
  `pointercancel`, así que una llamada a `releasePointerCapture` sería una línea
  que no hace nada. Lo que sí se agregó es `lostpointercapture`, que es la red
  para el caso en que la captura se vaya por abajo: **un scrub que queda abierto
  no es desprolijidad, deja el cromo arriba para siempre**, porque `hide()` no
  corre mientras existe.
- **`user-select: none` en la barra**, que no estaba en el diseño y no está en
  ningún ADR. Es un defecto que el arrastre introduce y que antes no podía
  existir: un press con mouse que viaja selecciona el texto que cruza, y los dos
  relojes están pegados a esta caja. Va sobre el elemento del que el arrastre
  sale y sobre ninguno más, que es el mínimo que lo arregla. Medido después:
  `getSelection()` vuelve vacío tras un arrastre de 4 segundos.
- **El `pointerup` no actúa si no había arrastre.** Un release sobre la barra sin
  su press —un botón soltado acá después de apretarse en otro lado— no es un
  gesto de esta barra y no seekea.
- **La pelotita crece a 2,5 veces el riel** y no a otro número: a 1,75 en reposo,
  eso son 14 px contra 20 px medidos, que es la diferencia que se ve sin que la
  barra parezca otra.

## Cómo se verificó

Nivel `bajo`, sin tests nuevos y sin campaña de mutación. La suite y las dos
costuras, verbatim, en `t01-suite-y-costuras.txt`: `npm test` da **49 en verde**,
los mismos 49 de antes de la task y sin un valor esperado tocado, y
`npm run check` sigue en `both seams hold.`

Lo demás se miró con el player corriendo en el 8080, anclado en `#player` porque
la página tiene dos panes con el mismo cromo. Las lecturas están en
`t01-lecturas.json`. Programa de 180 s, riel de 608,2 px:

| qué | lectura |
| --- | --- |
| `touch-action` de `.qa-track` | `none` (antes de la task: `auto`) |
| `user-select` de `.qa-track` | `none` |
| click suelto al 25 % | `currentTime` 45,0 s contra 45,0 s esperados, **delta 0** |
| arrastre, mientras está apretado | la pelotita va a 40 %, 55 % y 70 % y el `currentTime` **se queda en 45,0** en las tres lecturas |
| la pelotita mientras se arrastra | 20 px, contra 14 px en reposo |
| al soltar en el 70 % | `currentTime` 126,0 s contra 126,0 esperados, **delta 0**, y la pelotita vuelve a 14 px |
| arrastre 260 px **arriba** de la barra | sigue: la pelotita en 50 % con el puntero afuera; soltado al 85 % y 300 px arriba, `currentTime` 153,0 contra 153,0, **delta 0** |
| puntero apretado y quieto 4,2 s | el cromo sigue arriba, y sigue arriba al soltar |
| selección de texto tras el arrastre | vacía |

Los dos cuadros son `t01-arrastrando.png` —la pelotita agrandada al 45 %, con el
fill llegando hasta ella y las marcas de los cinco breaks atrás— y
`t01-en-reposo.png`.

El caso táctil, que es la otra mitad del pedido, es de la T-02.
