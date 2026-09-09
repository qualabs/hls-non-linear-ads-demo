# Informe de cierre — fase 07: la pelotita de la barra

**Fase abierta, diseñada, generada, ejecutada y cerrada el 2026-09-09, con las dos
tasks en `done`.** Ninguna abandonada, ninguna agregada, ninguna corrección
post-ejecución.

## 1. Resumen

La barra se arrastra. Un press en cualquier parte de ella pone la pelotita ahí y
empieza el arrastre, la pelotita sigue al puntero, y al soltar el video seekea a
donde quedó. Con mouse y con el dedo, con el mismo código.

Lo que hace que sea chico es que es **un gesto y no dos**: un press y release sin
mover es un arrastre de longitud cero, así que no hay rama de "modo toque" contra
"modo arrastre", y nada tiene que averiguar si el puntero cayó sobre la pelotita
—que mide 14 px— o al lado. Cayó en la barra, y con eso alcanza.

**Y la pelotita no se agregó, porque ya estaba.** El pedido empieza diciendo que
no está; medido contra el player antes de diseñar nada, existe desde la fase 02 y
se ve: un punto de 14 px en el `--qa-accent` de la demo, con anillo blanco, sobre
la cabeza del fill. Lo que faltaba era el gesto, que es lo que el mismo pedido
dice en su segunda oración. De ese párrafo la fase se llevó una sola decisión, que
la pelotita crezca mientras se arrastra, y nada más.

### Lo que la fase midió

Programa de 180 s, todo anclado en `#player` porque la página tiene dos panes con
el mismo cromo.

- **El toque suelto sigue seekeando donde seekeaba**: 45,0 s contra 45,0
  esperados al 25 % de la barra, delta 0. Era el riesgo R1 y es lo único que este
  cambio podía romper.
- **Durante el arrastre el video no se mueve**: la pelotita va a 40 %, 55 % y
  70 % y el `currentTime` se queda en 45,0 en las tres lecturas; al soltar en el
  70 %, 126,0 contra 126,0.
- **El arrastre sobrevive a irse de la barra**: 260 px hacia arriba y sigue vivo;
  soltado al 85 % y 300 px arriba, 153,0 contra 153,0.
- **El cromo no se baja**: con el puntero apretado y quieto 4,2 s sigue arriba, y
  sigue arriba al soltar.
- **Con el dedo**: la pelotita a 45 % y 60 %, el `currentTime` quieto, y al soltar
  108,0 contra 108,0.
- **La pelotita crece de 14 px a 20 px** mientras se arrastra, y vuelve.
- **49 tests en verde** —los mismos 49 con los que la fase arrancó— y
  `npm run check` en `both seams hold.`

### Los commits

| commit | qué es |
| --- | --- |
| `aa9c8fe` | el diseño de una página, con sus cinco decisiones |
| `c6a87c8` | la fase generada: `PHASE.md`, `TASKS.md` y los ADR 0032 a 0036 |
| `6d7a175` | T-01: la barra se arrastra, y el seek pasó al soltar |
| `d304c70` | T-02: los dos punteros, y el chequeo del scroll que no podía fallar |

## 2. Decisiones tomadas

Cinco ADR nuevos, el **0032 al 0036**, y los cinco con **`scope: phase-07`**.

Ese scope es una decisión de la generación y va dicha, porque las dos fases
anteriores hicieron lo contrario y sus informes lo marcaron: las de la 05 y la 06
dicen qué es este repositorio y quién contesta cuál de varias fuentes se escucha,
y éstas dicen cómo se comporta un control. Es el default del skill y es la
práctica vieja del proyecto —el ADR 0002 es `phase-01` y el 0015 es `phase-02`—.
El efecto práctico es que **el filtro por scope del cierre vuelve a devolver algo,
por primera vez desde la fase 02**.

- **ADR 0032 — el scrub es un solo camino, y el seek pasa al soltar.** Es la
  decisión de la que salen todas las demás, y su valor está en lo que no obliga a
  escribir: ninguna rama por tipo de gesto, y ninguna cuenta que pregunte si el
  puntero cayó sobre un punto de 14 px, que es la cuenta que falla con el dedo.
- **ADR 0033 — mientras se arrastra, la posición la manda el puntero.** El frame
  loop respeta un estado de scrub; lo leen el fill, la pelotita y el reloj de la
  izquierda, y las marcas no, porque son el largo y no la posición. Descartado
  seekear en cada `pointermove`: no es lo que se pidió y sobre HLS son decenas de
  búsquedas por gesto.
- **ADR 0034 — el arrastre es de la barra hasta que se suelta.**
  `setPointerCapture` para que sobreviva a irse de los 44 px, y
  `touch-action: none` para que el browser no lo lea como scroll.
- **ADR 0035 — el cromo no se baja en medio de un arrastre.** Descartado sostenerlo
  llamando a `show()` en cada move, que falla justo en el caso que el ADR cubre: el
  dedo apoyado y quieto, donde no hay moves.
- **ADR 0036 — la pelotita crece mientras se arrastra, y en reposo no cambia.** Es
  la única cosa que la fase se llevó de "no está la pelotita", y es deliberadamente
  la más chica: el tamaño en reposo y el color no se tocan porque no se midieron.

## 3. Tasks

Dos, las dos en `done`, las dos en nivel `bajo` y sin tests nuevos.

| id | qué dejó |
| --- | --- |
| T-01 | el gesto entero en `lib/controls.js`: `fractionFromEvent` y `endScrub` donde había un listener, el estado `scrubbing`, `paint()` leyéndolo, la captura, `hide()` que no corre durante el gesto, y las dos reglas de la hoja de estilos |
| T-02 | los seis casos con los dos punteros sobre el resultado final, el control del scroll, dos cuadros con el Chrome del sistema, y las tres superficies de documentación leídas una por una |

**Sin tests nuevos, y no es un descuido**: la fase no agrega lógica no visual. La
cuenta de la fracción es la que ya existía y lo único que se movió es cuándo se
escribe `video.currentTime`. Estaba escrito en el preámbulo del `TASKS.md` para
que quien ejecutara no lo subiera por prolijidad, y se cumplió.

### Lo que las tasks decidieron y su bloque no decidía

Cinco cosas, ninguna preguntada, y **cuatro son de la misma clase**: el borde de un
gesto que el diseño describió por su camino feliz.

- **La captura no se suelta a mano** (T-01). El browser la devuelve sola en el
  `pointerup` y en el `pointercancel`, así que una llamada a
  `releasePointerCapture` sería una línea que no hace nada. Lo que sí se agregó es
  `lostpointercapture`, y por una razón que no es prolijidad: **un scrub que queda
  abierto deja el cromo arriba para siempre**, porque `hide()` no corre mientras
  existe.
- **El `pointerup` no actúa si no había arrastre** (T-01). Un release sobre la
  barra sin su press no es un gesto de esta barra.
- **`user-select: none` en la barra** (T-01), que no está en el diseño ni en ningún
  ADR. Es un defecto que el arrastre **introduce** y que antes no podía existir: un
  press con mouse que viaja selecciona el texto que cruza, y los dos relojes están
  pegados a esa caja. Va sobre el elemento del que el arrastre sale y sobre ninguno
  más, que es el mínimo que lo arregla, y está medido: la selección vuelve vacía
  tras un arrastre de 4 s.
- **La pelotita crece a 2,5 veces el riel** (T-01), que son 20 px medidos contra
  14 en reposo.
- **El viewport del caso táctil** (T-02), que es la sección 4.

## 4. Lo que queda abierto

### El hallazgo

**El chequeo del scroll no podía fallar tal como estaba escrito, y hay que verlo
como método y no como un caso.** El `PHASE.md` pedía, con toque, que arrastrar no
scrolleara la página. Corrido a 420 × 900 da verde, y no prueba nada: esa página
**no scrollea** —`scrollHeight` 760 contra 760 de ventana—, así que el chequeo
pasa aunque `touch-action` no exista. A 420 × 420 la página sí scrollea, 687
contra 420, y ahí la pregunta tiene respuesta: el mismo arrastre vertical **fuera**
del player lleva el `scrollY` de 120 a 265, y **empezando en la barra** se queda en
267 a lo largo de 160 px.

Es la **segunda vez en el proyecto** que un chequeo escrito de buena fe no podía
fallar; la primera fue el grep del hallazgo 1 de la fase 05, y de ahí salió su
recomendación 2, correr el chequeo al escribirlo. Lo que esta vez agrega es la
otra mitad: **un chequeo negativo pide su control**. "No pasó nada" sólo vale si
está mostrado que en las mismas condiciones algo podía pasar.

### Lo que se queda de pie por decisión

- **La pelotita en reposo** no se tocó: ni tamaño, ni color, ni forma. Se midió que
  se ve, y agrandarla cambia cómo se ve la barra en cámara. **Si Nicolás vuelve a
  decir que no la ve, ahí el número que falta es el del tamaño en reposo**, y se
  mide aparte.
- **El preview del cuadro al que se va a saltar**, que es lo que un player de
  mercado tiene y éste no: pide thumbnails que este repositorio no genera.
- **Teclado y accesibilidad sobre la barra.** Misma razón que en la fase 06.
- **El gesto no entra al guion de la corrida grabada.** Es un beat opcional, igual
  que el foco: la corrida se graba igual sin arrastrar nada.

### Uno que dejó de estar abierto, y no por esta fase

**Las fases 02 y 04 sin `DESIGN.md`** venían en rojo desde la fase 05 y eran la
decisión pendiente que dos informes seguidos le dejaron a Nicolás. Mientras esta
fase se diseñaba, el commit `6d4eb79` las bajó de la lista `EXCEPTIONS` del skill
a `.project/EXCEPTIONS.md`, con su razón escrita, una por hallazgo. **El validador
sale en verde con las dos aceptadas**, y aceptadas no es silenciadas: las imprime
con su razón en cada corrida.

## 5. Riesgos que se materializaron

El `PHASE.md` escribió tres. **No se materializó ninguno.**

- **R1 — el toque suelto deja de seekear donde seekeaba.** No se materializó, y es
  el único que se midió como comparación en lugar de mirarse: 45,0 s contra 45,0
  esperados, y otras tres lecturas con delta 0. La mitigación era la forma del
  criterio —el mismo punto tiene que dar el mismo segundo— y funcionó porque estaba
  escrita como número y no como impresión.
- **R2 — el press sobre la barra deja de llegar, o alterna el cromo.** No se
  materializó. El `pointerdown` del contenedor no se tocó, y con el cromo abajo el
  primer toque lo sube y no cambia el `currentTime` (30 s antes, 30 s después): la
  regla de la fase 04 quedó intacta.
- **R3 — un arrastre en mobile scrollea la página.** No se materializó, y es el
  único cuya verificación hubo que rehacer. Está en la sección 4.

## 6. Recomendaciones para la fase siguiente

1. **Un chequeo que dice "no pasó X" se escribe con su control.** Es el hallazgo en
   forma operativa y es la continuación de la recomendación 2 de la fase 05: correr
   el chequeo al escribirlo atrapa el que no puede pasar nunca; el control atrapa el
   que pasa siempre.
2. **Si una fase toca `lib/controls.js`, `docs/integrating-the-library.md` es parte
   del entregable y no del cierre.** Esta fase lo puso en el bloque de una task y
   por eso lo encontró la task; la 06 lo dejó para el cierre y por eso lo encontró
   el cierre.
3. **El punto de entrada de cualquier cosa que toque la barra es el par
   `fractionFromEvent` / `endScrub`.** Uno contesta dónde está el puntero y el otro
   es el único lugar donde se escribe `video.currentTime` desde el cromo.

## 7. Correcciones post-ejecución

**Ninguna.** `grep -n "post-ejecuci"` sobre el `TASKS.md` de la fase devuelve una
línea, y no es una corrección: es la instrucción, adentro del bloque de la T-02,
de que lo que esa task encuentre se corrige en la task que lo introdujo. No hay
ningún `feedback-<n>.md`.

Leído como medición, lo que dice es poco y conviene no estirarlo: es una fase de
dos tasks donde la segunda existe para mirar a la primera, así que lo que la T-02
hubiera encontrado habría aparecido como corrección de la T-01 y no como un
defecto en producción. No encontró nada. **La medición de verdad de esta fase la
va a dar Nicolás usándola**, que es de donde salió el pedido.

## 8. Revisión de documentación

- **El índice de fases del `PROJECT.md`.** Escrito en este pase, con lo que la fase
  terminó siendo. `last_update` queda en 2026-09-09. **El `status` del proyecto
  sigue en `ongoing`**: quedan la grabación, iOS y la especificación de SVTA.
- **El resto del `PROJECT.md`.** Sin cambios. La sección "A confirmar" no la tocó
  esta fase: su ítem sobre de qué es la barra de progreso cuando hay varios videos
  sigue abierto igual, porque es sobre **qué** marca la barra y esta fase cambió
  **cómo** se la toca.
- **El `PHASE.md` de la fase.** `status: closed` y `closed: 2026-09-09`. El cuerpo
  no se toca. Y una nota de proceso: **el `status` lo movió la ejecución esta vez**,
  a `in-progress` en el primer commit de la T-01 y a `closing` al terminar la T-02,
  que es lo que las fases 05 y 06 no hicieron y sus cierres tuvieron que arreglar.
- **El `TASKS.md` de la fase.** Sin cambios en este pase: las dos tasks ya están en
  `done` con su evidencia apuntada.
- **`docs/arc42/`.** No existe en este proyecto y este cierre no lo crea, por la
  misma razón de las fases 05 y 06: el documento de arquitectura del producto son
  los dos de `docs/`, y tienen un solo lector.
- **`docs/integrating-the-library.md`.** **Corregido, y por la T-02 y no por este
  cierre**, que es la diferencia con la fase 06. Su §3 enumera lo que el cromo le
  da a quien integra y la barra pasó a hacer algo que esa lista no decía; la
  oración nueva dice el gesto entero y cita el ADR 0032. La superficie pública no
  se movió —ni `attach` ni `attachControls` reciben nada nuevo, y `attachControls`
  sigue sin exponer nada del scrub—, así que §6 no cambió.
- **`docs/contrato-senalizacion-renderizado.md`.** Re-leído y **sin cambios**: es
  el contrato entre señalización y renderizado, y la barra es cromo. Sus seis
  menciones a la barra hablan de qué se pinta —dónde caen los breaks, de qué color,
  cómo se reparte la posición— y ninguna del gesto ni del seek.
- **El `README.md` de la raíz.** Sin cambios. Enruta y no describe el
  comportamiento del cromo; su única línea sobre `lib/controls.js` lista las piezas
  y sigue exacta. No tiene línea a `docs/arc42/` ni la puede tener.
- **El `README.md` de la demo.** Sin cambios, y es una decisión: ninguna de sus
  afirmaciones sobre la barra quedó vieja, y el gesto **no entra al guion de la
  corrida** porque es un beat opcional, igual que el foco de la fase 06.
- **El `CLAUDE.md` del proyecto y `.project/knowledge/`.** No existen y este cierre
  no los crea. Lo que la fase aprendió tiene lugar: las decisiones en los cinco
  ADR, el hallazgo acá, y las mediciones en la evidencia de las dos tasks.
- **El `CLAUDE.md` y `knowledge/` del repo raíz.** Nada que agregar, y el candidato
  se revisó: el hallazgo del chequeo sin control es general —vale para cualquier
  verificación negativa, en cualquier proyecto—, y por eso mismo **no se escribe
  solo**. Va con su texto exacto a Nicolás, que corrige y aprueba. Por ahora vive
  en la recomendación 1.
- **El documento de install/runbook.** El proyecto no tiene `INSTALL.md`, y ninguna
  task agregó ni rompió un paso de setup: no entró una dependencia, no cambió el
  comando de arranque, y `dist/` se sigue armando desde `lib/`.
- **Las carpetas `tasks/` de la fase, marcadas como registro.** Las dos son
  evidencia y no instrucción vigente: los `.json` son lecturas de una corrida
  fechada, los dos `.md` están escritos en pasado, y las capturas llevan el estado
  en el nombre. Ninguna se reescribe. La única que se lee como algo más que
  registro es la de la T-02, por sus dos notas de harness —leer el rect de la barra
  justo antes de despachar el toque, y verificar que el cromo esté arriba en lugar
  de suponerlo—, que es lo que la próxima corrida con el dedo va a necesitar.

### El gate del cierre

`validar-proyecto.py` sale en **GREEN**: 36 ADR y 7 fases, `every ADR frontmatter
and every phase holds`, con los dos hallazgos de las fases 02 y 04 aceptados y con
su razón. La fase 07 sale limpia, con su `DESIGN.md` en su lugar y los cinco ADR
con el frontmatter válido.
