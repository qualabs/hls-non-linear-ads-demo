---
phase: 06-foco-de-audio
title: "El foco de audio: un toque sobre una caja y esa caja es la que suena"
status: closed
started: 2026-09-08
closed: 2026-09-09
---

# Fase 06: el foco de audio

El ADR 0014 dejó el audio de cada elemento del aviso en manos del asset list: el
`volume` declarado es el estado inicial y la mezcla la escribe quien arma la
campaña. Esta fase le da la otra mitad a quien mira: con el cromo arriba, un
toque sobre una caja del aviso y esa caja es la que suena.

Es una fase chica y es un POC. Lo que se muestra es **cómo sería**, no un
producto terminado. Nada acá se mide ni se pule más allá de lo que hace falta
para que el gesto funcione en pantalla, y ninguna decisión de hoy necesita un
número.

## Objetivo

Que quien mira pueda elegir cuál de las fuentes que hay en pantalla escucha, y
que la composición vuelva sola a la mezcla que declara el asset list cuando el
foco se suelta.

## La asimetría del gesto, que es una regla sola y no dos

El predicado es **¿está el cromo arriba?**, y no *¿es el segundo toque?*. De ahí
salen dos comportamientos sin escribir una segunda regla:

- **Con mouse el hover ya puso el cromo arriba, así que el click actúa de una.**
  En escritorio es **un** click y no dos, y no hay sorpresa porque el cromo está
  a la vista todo el tiempo.
- **En celular no hay hover: el primer toque muestra y el segundo actúa**, que
  es lo que ya cuesta cualquier control de este player (la regla de la fase 04,
  `lib/controls.js:214-228`).
- **En un híbrido** —una notebook con pantalla táctil— la respuesta no depende de
  qué dispositivo es, sino de si el cromo está visible en ese momento. Es la
  única forma de que no haya un tercer caso.

Está escrito acá porque es el punto donde el contrato se puede leer de menos: un
"sólo cuenta con el cromo arriba" a secas se implementa como dos clicks en
escritorio, y eso sería un gesto peor que el que ya existe.

## Alcance

1. **El nivel efectivo de cada elemento sale de un índice de foco único**, uno
   solo para toda la composición y no un flag por elemento. Con foco puesto suena
   ese elemento a 100 y todo el resto va a 0, el primario incluido. La aritmética
   vive en una función pura exportada al lado de `volumeOf` (ADR 0026).
2. **Enfocable es una caja de video del aviso, y nada más** (ADR 0027).
3. **El gesto es un `pointerdown` sobre la caja y sólo cuenta con el cromo
   arriba**, con los punteros habilitados en `place()` y el predicado del cromo
   cableado en `attach()` (ADR 0028).
4. **El foco se suelta a la mezcla declarada, por cuatro caminos**: se toca de
   nuevo el elemento enfocado, se rearma la composición, el asset se termina
   antes que su ventana, o cierra el break (ADR 0029).
5. **La marca es un anillo que dibuja el renderer sobre el nodo que creó**, en la
   misma función que mueve el índice y recalcula la mezcla (ADR 0030).
6. **Dos afirmaciones del README de la demo se completan**, una oración en cada
   una: el párrafo del switch de `Before you record` y el párrafo del Quad.
7. **La verificación**: un test unitario sobre la función pura, `npm test` y
   `npm run check` en verde, y la corrida mirada a mano con el player.

## Fuera de alcance

- **La restricción futura en el asset list**, o sea un campo que diga si el
  volumen de un elemento se puede cambiar o si un elemento es enfocable. Es del
  formato y no del renderizado, el formato está en desarrollo, y el ADR 0004
  manda consumir el asset list como lo emite la herramienta de SVTA: inventarle
  un campo hoy es adelantarse a SVTA. La pregunta ya está en la lista para SVTA
  del `PROJECT.md`, y es exactamente ésta: cuál de varias fuentes concurrentes se
  escucha y cómo se expresa.
- **El primario y las imágenes como blanco del gesto.** Un `pointerdown` sobre la
  imagen ya significa alternar el cromo, y una foto no tiene audio (ADR 0027).
- **Atenuación o ducking** como mezcla alternativa al foco exclusivo.
- **Que el botón de audio diga qué se está escuchando.** Hoy sabe mute y unmute,
  y con foco "desmuteado" deja de decir qué vas a escuchar. No es bloqueante: eso
  lo contesta la marca sobre la caja.
- **Foco por teclado y accesibilidad.** La capa de avisos es `aria-hidden` a
  propósito, porque la imagen es el aviso.
- **Eventos de tracking**, tipo los `mute` y `unmute` que VAST 4.3 define como
  Player Operation Metrics. No hay nada que reportar en un POC sin ad server.
- **El pane de fábrica.** No lo maneja la librería.
- **La regla de la fase 04.** No se toca, ni para ampliarla ni para
  excepcionarla.
- **Hacer del foco un paso del guion de la corrida grabada.** El foco es un beat
  opcional: la corrida se graba igual sin tocar ninguna caja, y agregar un gesto
  que hay que acertar en cámara no compra nada que la mezcla del Quad no muestre
  ya.

## Decisiones que gobiernan la fase

Las cinco que esta fase toma:

- **ADR 0026**, el foco es exclusivo y es un índice único de toda la composición.
  **Generaliza el ADR 0014**: nada de lo que ese ADR decide deja de valer, y lo
  que se ensancha es quién puede contestar cuál de varias fuentes concurrentes se
  escucha. El asset list declara el estado inicial; quien mira lo sobrescribe
  mientras el aviso está en pantalla y el override muere con el aviso.
- **ADR 0027**, enfocable es una caja de video del aviso y nada más.
- **ADR 0028**, el gesto es un `pointerdown` sobre la caja, sólo cuenta con el
  cromo arriba, y los punteros se habilitan en el nodo y en `place()`.
- **ADR 0029**, el foco se suelta a la mezcla declarada, por cuatro caminos y sin
  preguntar nada.
- **ADR 0030**, la marca la dibuja el renderer sobre el nodo que creó.

Las que ya estaban y acotan lo que se puede hacer:

- **ADR 0014**, el `volume` del asset list es el estado inicial de cada elemento,
  con el default en 0 para el aviso y 100 para el primario. Es la mezcla a la que
  el foco vuelve, y es lo que descarta volver "al primario".
- **ADR 0015**, el límite del SDK y la propiedad de los controles. Su grep
  prohíbe selectores en `lib/`, y eso descarta que el renderer lea la clase del
  cromo.
- **ADR 0003**, las dos capas. El foco es renderizado y no señalización, así que
  la costura aguanta sin excepciones nuevas y el grep de
  `scripts/verificar-cortes.mjs` no crece.
- **ADR 0004**, consumir el asset list tal como lo emite la herramienta de SVTA.
  Es lo que deja la restricción futura afuera.
- **La regla de la fase 04**, que no es un ADR sino comportamiento medido y
  escrito en `lib/controls.js`: el primer toque muestra y no actúa, y el segundo
  `pointerdown` baja el cromo antes de que llegue el `click`. Es lo que decide
  que el gesto sea un `pointerdown`.

## Riesgos

**R1. Habilitar punteros en las cajas de aviso toca un invariante con razón
escrita** (`lib/concurrent-hls.js:122`: la capa no recibe punteros para no
comerse los clicks de lo que está abajo). Mitigación, y es de diseño: se
habilitan en los nodos y no en la capa, así que la capa sigue sin comerse clicks
ajenos, y el invariante que de verdad hay que cuidar, el `z-index` ausente, no se
toca. La implementa la T-02 y la nota va con el cambio.

**R2. Un nodo precargado invisible toma el gesto.** Es el mismo defecto que la
fase 04 midió una capa más arriba: `bringAhead` construye nodos ya posicionados
sobre su caja con `opacity: 0`, y opacity no detiene un dedo. Mitigación: los
punteros se habilitan en `place()`, que sólo recorre lo que está en pantalla. Lo
chequea la T-02 en el borde entre los cuatro avisos del break 5.

**R3. El anillo puede no leerse como "esto es lo que suena" en cámara.**
Aceptado: el gesto es su explicación, y la corrida grabada no depende del foco,
así que el costo de que se lea a medias es cero.

## La verificación de la fase

Vara de POC, quick and dirty, y el instrumento es el que ya existe.

- **Un test unitario sobre la función pura del nivel efectivo.** Es la única
  lógica no visual de la fase.
- **`npm test` y `npm run check` en verde.**
- **A mano, con el player corriendo:**
  - **Quad (break 4)**: con el cromo arriba, tocar cada cuadrante y escuchar que
    suena uno solo, incluido el primario callado; tocar de nuevo el enfocado y
    escuchar que vuelve la mezcla declarada, o sea `view3` a 100 y el resto a 10.
  - **Un break de `cornerOverlay`**: tocar el aviso y escuchar que el programa se
    calla, que es el defecto de audio doble que la fase resuelve.
  - **Break 5**, que son cuatro avisos en fila: enfocar uno y verificar que en el
    borde al siguiente el anillo desaparece y vuelve la mezcla declarada.
  - **Primer toque con el cromo abajo en celular**: no cambia el audio.

No se mide nada más.

## Arquitectura del producto

El proyecto no tiene `docs/arc42/` y esta fase no lo crea: sus dos documentos de
`docs/` cumplen ese papel para el único lector que tienen, quien construye con la
sdk.

**El contrato de señalización y renderizado no cambia**, y la razón es del propio
documento: `volume` ya está en él y dice de sí mismo que la política de audio no
está ahí, así que un override en tiempo de ejecución es del renderizado por
definición. La costura del ADR 0003 aguanta sin excepciones nuevas. El delta de
la fase es de comportamiento del renderizado y está escrito en los ADR 0026 a
0030.

## Calendario y quién mira

El primer draft para David es el 21 de septiembre y la ventana de grabación es
del 28 al 30. Esta fase no está en el camino crítico de ninguna de las dos
fechas: el foco es un beat opcional de la corrida, así que si queda listo después
de que la corrida esté grabada no se rompe nada, porque nada del guion lo pide.
Lo que Nicolás mira es el gesto en el player, que es lo que igual iba a mirar.
