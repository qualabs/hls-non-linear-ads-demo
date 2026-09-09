# T-01 — el foco cambia la mezcla, y el índice es uno solo

El audio de la composición sale de un índice de foco único. Con nadie enfocado
suena la mezcla que declara el asset list, que es lo que ya sonaba; con un
elemento enfocado suena ése a 100 y todo el resto va a 0, el primario incluido.
El gesto que mueve el índice es de la T-02, así que después de esta task el
índice está siempre en `null` y en pantalla no cambió nada: lo que esta task
entrega es la aritmética, y su único test es el de la función pura.

## Qué cambió, y son cinco lugares de un solo archivo

Todo en `lib/renderer.js`:

- **`effectiveVolumeOf(element, focused)`**, nueva, pura y exportada al lado de
  `volumeOf`. Devuelve `volumeOf(element)` cuando `focused` es falsy, 1 cuando
  `element === focused`, y 0 en cualquier otro caso.
- **`let focused = null`**, el índice, junto al resto del estado del renderer.
  Uno solo para toda la composición y no un flag por elemento.
- **`applyAudio`, una línea**: `volumeOf(element)` pasó a ser
  `effectiveVolumeOf(element, focused)`. Nada más de la función cambió, y
  `video.muted` sigue apareciendo una sola vez y en la misma línea de código, la
  compuerta `const off = video.muted`.
- **`clear`**: el foco se suelta ahí, que son la segunda y la cuarta salida del
  ADR 0029 —se rearma la composición, o cierra el break— y son la misma línea
  porque en el código son el mismo evento.
- **El `ended` del nodo**: tercera salida. Si el que terminó tenía el foco, se
  suelta y se vuelve a aplicar el audio.

Y el test nuevo, `test/audio-focus.test.js`, con los tres casos de la función:
sin foco cada elemento devuelve lo declarado, el enfocado devuelve 1 —incluso el
cuadrante que declara 10, así que enfocar nunca baja el volumen— y todos los
demás devuelven 0, el `primaryContent` del Quad y el programa del cornerOverlay
incluidos. Los datos son los asset lists reales de `test/fixtures/`.

## Tres cosas que la task decidió

- **El índice compara por identidad del elemento y no por `id`.** Un `id` nombra
  un elemento adentro de un layout, y la composición puede tener elementos de
  más de un layout a la vez (dos experiencias solapadas), así que la identidad
  es la única comparación que no depende de que dos layouts no hayan coincidido
  en un nombre. Los elementos son estables: `activeAt` filtra un array guardado
  (`lib/signalling.js:519`), que es lo mismo de lo que ya depende `bringAhead`.
- **El foco se suelta en todo `ended` y no sólo en los que la advertencia
  reporta.** Un nodo que terminó está callado igual, y el foco quedándose ahí
  deja la composición entera en 0, que es audio faltante.
- **El test va en un archivo nuevo** y no adentro de
  `program-ranges-and-volume.test.js`, cuyo encabezado declara ser la medición de
  la T-06 de otra fase.

## Verificación

Nivel `bajo`, sin campaña de mutación. La salida verbatim está en
`t01-suite-y-costuras.txt`:

- `npm test`: **49 en verde**, los 46 de antes más los 3 casos nuevos, sin un
  solo valor esperado de los que ya existían tocado.
- `npm run check`: `both seams hold.` Las dos costuras siguen donde estaban.
- `/usr/bin/grep -n 'video\.muted' lib/renderer.js`: una sola aparición, la
  misma de antes (el número de línea corrió de 472 a 534 por los comentarios que
  se agregaron arriba).
