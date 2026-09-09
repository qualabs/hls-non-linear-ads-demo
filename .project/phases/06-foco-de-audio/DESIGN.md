# Fase 06: el foco de audio

El ADR 0014 dejó el audio de cada elemento del aviso en manos del asset list: el
`volume` declarado es el estado inicial y la mezcla la escribe quien arma la
campaña. Esta fase le da la otra mitad a quien mira: un toque sobre una caja del
aviso y esa caja es la que suena.

Es una fase chica y es un POC. Lo que se muestra es **cómo sería**, no un
producto terminado, así que nada acá se mide ni se pule más allá de lo que hace
falta para que el gesto funcione en pantalla.

El insumo es el análisis del 2026-09-09
(`sandbox/analisis-foco-de-audio-2026-09-09.md` del repo padre), que midió las
tensiones y dejó cinco casos abiertos. Este documento los cierra.

## Lo que entra como dato y no se discute acá

**Quien mira puede callar un aviso que el anunciante declaró a 100.** Es la
decisión de producto y la tomó Nicolás, con tres argumentos:

- El asset list todavía está en desarrollo, así que una restricción futura puede
  vivir ahí: un campo que diga si el volumen se puede cambiar, o si un elemento
  es enfocable.
- Un usuario ya puede mutear o bajar el volumen del televisor, así que
  impedirlo es en buena medida ilusorio.
- Y sobre todo: en un multiview tiene sentido que quien mira elija qué escuchar,
  y lo que estamos construyendo es un multiview.

Su encuadre del alcance, textual: *"creo que tiene sentido desarrollarlo como
prueba de concepto para mostrar cómo sería. Y luego, cualquier cosa, agregar
restricciones a futuro dentro del asset list para poder decir que se puede o que
no. Pero hoy prefiero agregarlo."*

O sea: la capacidad se agrega ahora y la restricción es una nota a futuro, fuera
del alcance de esta fase.

## El punto de partida, medido

Catorce hechos del código, y cada uno decide algo de abajo.

1. **`applyAudio` es el único lugar que escribe el audio de la composición**
   (`lib/renderer.js:471-481`). Corre después de cada `build` y otra vez en cada
   `volumechange` del primario.
2. **Ahí el `muted` del primario no se toca nunca, a propósito**: es el switch de
   la composición y es de quien mira. Lo que sí hace es usarlo como compuerta de
   los elementos del aviso (`const off = video.muted`).
3. `volumeOf` (`lib/renderer.js:81-85`) convierte el `volume` declarado a
   fracción, con default 0 en el aviso y 100 en el primario (ADR 0014).
4. **La mezcla del Quad**: primario 10, `view2` 10, `view3` 100, `view4` 10
   (`demo/compatibility-pair/signalling/asset-list-multiView.json`). Darle al
   elemento tocado "el nivel del primario" ahí no cambia nada audible.
5. **En `cornerOverlay` la misma regla produce audio doble**: el primario está en
   100 por default y el aviso en 0, así que subir el aviso a 100 deja dos bandas
   sonoras a la vez.
6. `clear()` devuelve el primario a `volume = 1` y no toca su `muted`
   (`lib/renderer.js:540-560`), así que la vuelta al final del break ya está
   resuelta y no hay que inventarla.
7. **Cuando cambia el `nextKey` el renderer hace `clear()` y reconstruye todo**
   (`lib/renderer.js:188-215`). El nodo enfocado se destruye.
8. Cada nodo de video ya detecta que su asset se terminó adentro de su ventana y
   lo dice por consola (`lib/renderer.js:243-253`).
9. **La capa de avisos no recibe punteros a propósito**
   (`lib/concurrent-hls.js:122`), para no comerse los clicks que son de lo que
   está abajo.
10. **En touch, el primer toque muestra y no actúa**, y está medido en la fase 04
    (`lib/controls.js:214-228`): con el cromo invisible, un toque abajo buscó a
    134 s, uno en el medio pausó, y uno arriba a la derecha levantó el mute.
11. Y el detalle que decide el gesto: **en el segundo toque el `pointerdown` del
    contenedor llama a `hide()`** cuando el blanco no está adentro de la capa del
    cromo (`lib/controls.js:742`), así que cuando llega el `click` de ese mismo
    toque el cromo ya está abajo.
12. `createControls` devuelve `{ layer, track, show, hide }`
    (`lib/controls.js:814`): no expone si el cromo está arriba, aunque
    internamente lo sabe (`up()`).
13. **`controls.js` tiene prohibido tocar la capa de los avisos** y está escrito
    (`lib/controls.js:41-47`).
14. El `id` de un elemento es `source.id ?? 'asset'` (`lib/signalling.js:84`), y
    `activeAt` devuelve una **lista** de experiencias (`lib/signalling.js:352`).
    Dos experiencias solapadas sin `id` propio chocan las dos en `'asset'`.

## Decisión 1: foco exclusivo, y es un índice único de toda la composición

El elemento con foco suena a 100 y **todo el resto de la composición va a 0**,
el primario incluido. En los elementos del aviso eso es `muted`, que es lo que
`applyAudio` ya hace cuando el nivel es 0; en el primario es `volume = 0` y nunca
`muted`.

El foco es **un índice de estado del renderer, uno solo para toda la
composición**, y no un flag por elemento. De ahí sale gratis el caso de dos o más
elementos no primarios con audio: el Quad son tres cuadrantes más el primario, y
dos experiencias solapadas pueden poner avisos de dos breaks distintos encima del
programa (`asset-list-solapado.json`). Con un índice único sobre lo que está en
pantalla, **eso no es un caso**: es la misma regla aplicada a una lista más
larga.

La implementación del audio es una línea. Donde `applyAudio` hoy dice
`volumeOf(element)`, dice el nivel efectivo, que es `volumeOf(element)` cuando
nadie tiene el foco, 1 en el elemento que lo tiene, y 0 en todos los demás. La
aritmética va en una función pura exportada al lado de `volumeOf`, por la misma
razón por la que esa está exportada: un test le puede apuntar sin un navegador.
La firma exacta la elige quien ejecuta; el criterio es que sea pura y que el
resto de `applyAudio` no cambie de forma.

**Y no se pisa con el switch único.** Confirmado en el código: el foco escribe
`volume`, y `muted` sólo en los nodos del aviso, que es donde `applyAudio` ya lo
escribía. `video.muted` no se toca en ningún camino. Las dos cosas quedan bien
nombradas: el switch decide **si suena algo** y el foco decide **qué, de lo que
suena**. Con la composición muteada, tocar una caja no suena y sí se ve, porque
la compuerta del punto 2 sigue en pie y la marca de la decisión 5 no depende del
audio. Levantar el mute desde el gesto sería exactamente la peor de las tres
mediciones de la fase 04.

Descartado: **la regla tal como venía enunciada**, o sea darle al elemento tocado
el nivel del primario. Es un no-op en el Quad, que es el único layout de la
corrida grabada con más de una fuente audible, y produce dos bandas sonoras a la
vez en `cornerOverlay`. Un foco es una redistribución y esa regla lo escribe como
una asignación. Descartado también **atenuar el resto** en lugar de callarlo:
inventa un número de mezcla que nadie declaró y no arregla el Quad, donde
`view3` a 100 seguiría tapando a todos. Y descartado que **el elemento con foco
conserve su nivel declarado** y sólo bajen los demás: en el Quad la composición
entera quedaría en 10, o sea que enfocar bajaría el volumen, que en cámara se lee
como una falla.

## Decisión 2: enfocable es una caja de video del aviso, y nada más

El primario **no es blanco del gesto**, y la razón es una colisión: un
`pointerdown` sobre la imagen ya significa alternar el cromo
(`lib/controls.js:724-744`). El primario ocupa el fondo entero, así que hacerlo
enfocable convertiría cada toque sobre la imagen con el cromo arriba en un cambio
de audio, y el gesto que hoy baja el cromo pasaría a cambiar el sonido.

Las imágenes tampoco: una foto no tiene audio, y volver a habilitarle punteros
sólo crearía una zona donde el toque no alterna el cromo y no hace nada.

No hace falta un blanco para "sólo el programa". El switch de la composición ya
apaga todo, y la mezcla declarada es la respuesta del anunciante: volver a ella es
la decisión 4.

**El aviso lineal a pantalla completa del break 5 sí es enfocable y no molesta.**
Se chequeó: declara 100 en el aviso y 0 en el programa
(`lib/signalling.js:208-216`), así que enfocarlo, y desenfocarlo, dan la misma
mezcla que ya estaba. Tapa la imagen entera y por eso hereda el toque que
alternaba el cromo, pero el resultado audible es idéntico, así que no necesita
una excepción por tamaño de caja.

Descartado: **hacer enfocable el primario** para tener una vuelta a "sólo el
programa" desde el gesto. Cuesta la colisión de arriba, y el camino de vuelta ya
existe.

## Decisión 3: el gesto es un `pointerdown` sobre la caja, y sólo cuenta con el cromo arriba

Un cambio de foco disparado desde un blanco invisible tiene el defecto que la
fase 04 midió, agravado: el sonido cambia y no hay nada en pantalla que explique
por qué. Así que el toque sobre una caja enfoca **sólo cuando el cromo está
arriba**, que es la misma regla que ya gobierna los botones y la barra.

**Una regla, dos comportamientos, y ninguno escrito aparte.** El predicado es
*¿está el cromo arriba?* y no *¿es el segundo toque?*, y el cromo ya distingue
las dos entradas: su `pointermove` sólo actúa con `pointerType === 'mouse'`
(`lib/controls.js:717-720`, con la razón escrita de que el movimiento de un dedo
es un drag y no un hover). De ahí sale la asimetría sin una segunda regla. **Con
mouse el hover ya puso el cromo arriba, así que el click actúa de una** y no hay
sorpresa, porque el cromo está a la vista todo el tiempo. **En celular no hay
hover: el primer toque muestra y el segundo actúa**, que es lo que ya cuesta
cualquier control de este player. Y en un híbrido —una notebook con pantalla
táctil— la respuesta no depende de qué dispositivo es sino de si el cromo está
visible en ese momento, que es la única forma de que no haya un tercer caso.

**Es un `pointerdown` y no un `click`, y eso lo decide el punto 11.** En el
segundo toque, el `pointerdown` del contenedor baja el cromo antes de que llegue
el `click`, así que un gesto que preguntara por el estado del cromo en el `click`
fallaría justo en el toque que tiene que actuar. El `pointerdown` del nodo corre
**antes** que el del contenedor, porque burbujea desde el blanco, así que lee el
cromo como estaba cuando el dedo bajó. Es también lo que hace la barra, que
navega en el press.

**Los punteros se habilitan en el nodo y no en la capa.** La capa sigue con
`pointerEvents: 'none'` y su invariante intacto; lo que se habilita es
`pointer-events: auto` en los nodos de video del aviso. Eso toca un invariante con
razón escrita (punto 9), así que va con su nota: la capa deja de comerse los
clicks de abajo porque el que los recibe es el nodo, y el otro invariante de esa
función, el `z-index` ausente, no se toca. Los punteros se habilitan en `place()`
y no en `createNode`, y esto no es un detalle: `bringAhead` construye nodos con
`opacity: 0` que ya están posicionados sobre su caja, y **opacity no detiene un
dedo**, que es la lección de la fase 04 una capa más arriba. `place()` sólo
recorre lo que está en pantalla, así que un nodo precargado no puede tomar el
gesto.

**El cableado va en `attach()`**, que es el punto de entrada cuyo trabajo es
juntar las dos piezas. `createControls` agrega `up` a su handle y `attach()` le
pasa al renderer un predicado que lo consulta. Como es una función que se
evalúa en el momento del toque, no importa que el renderer se cree antes que los
controles. Con eso el renderer no aprende qué es el cromo y los controles no
aprenden qué es una caja de aviso.

Descartado: **que el listener viva en `attach()`** y despache por el
`data-element-id` del nodo. Además de darle al renderer una API pública de foco
que nadie más necesita, se rompe con el punto 14: dos experiencias solapadas sin
`id` propio comparten el `id` `'asset'`, y el foco terminaría en la caja
equivocada. El renderer tiene la referencia al nodo y no necesita nombrarlo.
Descartado también **leer la clase `qa-controls--on` desde el renderer**: le
enseña al renderer qué es el cromo y necesita un selector, que es una de las
palabras que el grep del ADR 0015 prohíbe en `lib/`.

## Decisión 4: la vuelta es a la mezcla declarada, y el foco tiene cuatro salidas

Cuando el foco se suelta, la composición vuelve a **la mezcla que declara el
asset list**, no al primario. Es lo que manda el ADR 0014, y en el Quad importa:
ahí ningún elemento declara 100 para el primario, declara 10. Volver "al
primario" inventaría una mezcla que la campaña no escribió y dejaría el programa
más fuerte de lo que su autor pidió.

Cuatro caminos, y ninguno pregunta nada:

1. **Se toca de nuevo el elemento enfocado.** El gesto es un toggle. Descartado
   el foco idempotente, que es lo que hace el multiview: acá deja a quien mira
   sin salida salvo buscar otra caja, y en `cornerOverlay` hay una sola.
2. **Se rearma la composición.** Cuando cambia el `nextKey`, el renderer hace
   `clear()` y reconstruye (punto 7): el nodo enfocado ya no existe y el foco
   muere con él. **El truco del multiview no aplica**: ahí el foco se conserva por
   identidad de contenido, y acá el aviso que lo tenía simplemente no está.
   Descartado conservarlo por posición de caja o por `id` de elemento: le daría a
   un anunciante nuevo el audio que quien mira eligió para otro, en silencio y
   por una coincidencia de layout. La pantalla cambia entera en ese borde, así que
   el cambio de sonido tiene causa visible.
3. **El asset del elemento enfocado se termina antes que su ventana.** El
   renderer ya lo detecta (punto 8). Ahí se suelta el foco y vuelve la mezcla
   declarada. El último cuadro se queda en la caja hasta que la ventana cierre,
   porque la composición sigue la ventana y eso es del contrato, pero la
   composición no queda muda. Descartado mantener el foco hasta que la ventana
   cierre: es la falla que el ADR 0014 existe para evitar, audio faltante que no
   se ve en cámara, reintroducida por la puerta de al lado. Y descartado sacar el
   nodo cuando su asset termina: cambia la regla del contrato y no es de esta
   fase.
4. **Cierra el break.** Ya funciona: `clear()` devuelve el primario a 100 y no
   toca su `muted` (punto 6). No se agrega nada.

## Decisión 5: la marca la dibuja el renderer sobre el nodo que creó

Un anillo sobre la caja que suena. Lo dibuja el renderer, porque `controls.js`
tiene prohibido tocar la capa de los avisos (punto 13) y el renderer ya es dueño
de esos nodos y ya les escribe estilo.

Es un `outline` de 4 px en amarillo saturado (`#FFD400`) con `outline-offset`
negativo, escrito inline sobre el nodo. Las tres propiedades están elegidas y
cada una por una razón: `outline` se pinta **arriba** del contenido, que es lo que
un `border` o un `box-shadow` interno no hacen sobre un elemento reemplazado como
un `<video>`; no participa del layout, así que no mueve la caja que el layout
declaró; y el offset negativo lo dibuja por dentro del borde, así que no lo
recorta la caja de al lado. Si el color hay que cambiarlo, el criterio es que se
lea sobre cualquier creativo y que no sea un color de marca, porque nada en la
capa de avisos está marcado.

Se escribe donde se escribe el audio, o sea cuando el foco cambia: una sola
función mueve el índice, recalcula la mezcla y mueve el anillo, así que no hay dos
fuentes de verdad sobre quién suena.

**Sobrevive al auto-hide por construcción y no por una excepción.** El auto-hide
baja la opacidad de la capa del cromo, y esta marca vive en la otra capa. Es la
lección más barata del multiview y acá sale gratis.

Y con eso alcanza para que el foco que se mueve solo se vea: cuando el asset se
termina o la composición se rearma, el anillo desaparece con el nodo. Descartado
un toast: la marca moviéndose es el aviso, y un toast es una pieza de interfaz
nueva en la capa que no le corresponde.

Descartado el **parlante al lado del anillo**. Los pseudo-elementos no se
renderizan sobre un `<video>`, así que el glifo pide un nodo hermano adentro de
la capa de avisos y una caja más que seguir en `place()`. Es maquinaria real para
un POC, y el anillo aparece en el mismo gesto que cambia el sonido, así que el
gesto es el que le enseña qué significa.

## Decisión 6: el ADR de esta fase generaliza el 0014 y no lo supersede

Nada de lo que el 0014 decide se vuelve falso. Su palabra es **inicial** y el
contrato la repite (`docs/contrato-senalizacion-renderizado.md:214`): un control
de quien mira que cambia la mezcla después de arrancada es exactamente lo que esa
palabra deja abierto.

Lo que sí cambia es la frase de cierre del 0014, que reparte quién decide cuál de
varias fuentes concurrentes querría escuchar quien mira: el 0014 le asigna la
respuesta a quien arma la campaña. Esta fase se la da también a quien mira. El
reparto queda así, y es la relación que el ADR nuevo escribe:

- **El asset list declara la mezcla** y es el estado inicial de cada elemento. Eso
  es del 0014 y no se toca.
- **Quien mira puede sobrescribirla mientras el aviso está en pantalla**, y el
  override muere con el aviso: el default vuelve a ser lo declarado.

Va como `generalizes: ["0014"]` en el ADR nuevo y `generalized_by` en el 0014, que
es una relación que este proyecto ya tiene de primera clase en el frontmatter de
sus ADR (el 0015 está generalizado por el 0020). Descartado un **supersede**,
porque el mecanismo del 0014 sigue en pie completo, y descartada una **excepción
escrita adentro del 0014**, porque ese ADR asignó el dueño de la respuesta de
forma explícita y cambiarlo es una decisión nueva y no una nota al pie.

El contrato de señalización y renderizado no cambia. `volume` ya está en él y el
documento dice de sí mismo que la política de audio no está ahí, así que un
override en tiempo de ejecución es del renderizado por definición del propio
documento. La costura del ADR 0003 aguanta sin excepciones nuevas y el grep de
`scripts/verificar-cortes.mjs` no crece.

## Decisión 7: el foco es un paso opcional de la corrida grabada

La corrida de tres minutos **no depende del foco**: se graba igual sin tocar
ninguna caja, y la mezcla declarada sigue contando lo que cuenta hoy. El foco es
un beat más que quien graba puede usar, típicamente en el Quad del break 4, que es
donde hay cuatro fuentes y la elección se ve.

Eso hace dos cosas. La primera es que saca la fecha del medio: si el foco queda
listo después de que la corrida esté grabada, no se rompe nada, porque nada del
guion lo pide. La segunda es que no se agrega un gesto nuevo a una toma que hay
que ejecutar en cámara, que era el riesgo sin contrapartida.

Lo que sí es de esta fase: **dos afirmaciones del README de la demo quedan
incompletas y se completan acá.** El párrafo de `Before you record` dice que el
switch es de la composición entera y que lo que vale cada elemento adentro es la
mezcla que declara el asset list; y el párrafo del Quad dice que así suenan cuatro
fuentes concurrentes *"when the signalling picks one to listen to"*. Con foco, la
señalización propone y quien mira dispone. Una oración en cada uno.

Descartado: **hacer del foco un paso del guion**. Agrega un gesto que hay que
acertar en cámara para mostrar algo que la mezcla del Quad ya muestra, y devuelve
la fecha del sync al medio de una fase chica.

## Cómo se verifica

Vara de POC, quick and dirty. Un test unitario sobre la función pura de la
decisión 1, `npm test` y `npm run check` en verde, y a mano con el player
corriendo:

- **Quad (break 4)**: con el cromo arriba, tocar cada cuadrante y escuchar que
  suena uno solo, incluido el primario callado; tocar de nuevo el enfocado y
  escuchar que vuelve la mezcla declarada, o sea `view3` a 100 y el resto a 10.
- **Un break de `cornerOverlay`**: tocar el aviso y escuchar que el programa se
  calla, que es el defecto de audio doble que la decisión 1 resuelve.
- **Break 5**, que son cuatro avisos en fila: enfocar uno y verificar que en el
  borde al siguiente el anillo desaparece y vuelve la mezcla declarada.
- **Primer toque con el cromo abajo en celular**: no cambia el audio.

No se mide nada más. Ninguna decisión de hoy necesita un número.

## Riesgos

**R1. Habilitar punteros en las cajas de aviso toca un invariante con razón
escrita.** Mitigación, y es de diseño: se habilitan en los nodos y no en la capa,
así que la capa sigue sin comerse clicks ajenos, y el invariante que de verdad
hay que cuidar, el `z-index` ausente, no se toca.

**R2. Un nodo precargado invisible toma el gesto.** Es el mismo defecto que la
fase 04 midió una capa más arriba, y opacity no detiene un dedo. Mitigación: los
punteros se habilitan en `place()`, que sólo recorre lo que está en pantalla.

**R3. El anillo puede no leerse como "esto es lo que suena" en cámara.**
Aceptado: el gesto es su explicación, y la corrida grabada no depende del foco
(decisión 7), así que el costo de que se lea a medias es cero.

## Fuera de alcance

- **La restricción futura en el asset list**, o sea un campo que diga si el
  volumen de un elemento se puede cambiar o si un elemento es enfocable. Es del
  formato y no del renderizado, el formato está en desarrollo, y el ADR 0004
  manda consumir el asset list como lo emite la herramienta de SVTA: inventarle
  un campo hoy es adelantarse a SVTA. Va a la lista de preguntas para SVTA sobre
  el formato del `PROJECT.md`, al lado de la que ya está y que es exactamente
  ésta, "cuál de varias fuentes concurrentes se escucha y cómo se expresa".
- **Atenuación o ducking** como mezcla alternativa al foco exclusivo.
- **Que el botón de audio diga qué se está escuchando.** Hoy sabe mute y unmute,
  y con foco "desmuteado" deja de decir qué vas a escuchar. No es bloqueante:
  eso lo contesta la marca sobre la caja, que es donde el multiview la puso.
- **Foco por teclado y accesibilidad.** La capa de avisos es `aria-hidden` a
  propósito, porque la imagen es el aviso.
- **Eventos de tracking**, tipo los `mute` y `unmute` que VAST 4.3 define como
  Player Operation Metrics. No hay nada que reportar en un POC sin ad server.
- **El pane de fábrica.** No lo maneja la librería.
- **La regla de la fase 04.** No se toca, ni para ampliarla ni para excepcionarla.

## Lo que se consideró y se descartó

| alternativa | por qué no |
| --- | --- |
| darle al elemento tocado el nivel del primario, la regla como venía enunciada | no-op en el Quad, que es el único layout de la corrida con más de una fuente audible, y audio doble en `cornerOverlay` |
| atenuar el resto en lugar de callarlo | inventa un número de mezcla que nadie declaró, y `view3` a 100 seguiría tapando a todos |
| que el elemento enfocado conserve su nivel declarado | en el Quad la composición entera queda en 10: enfocar bajaría el volumen |
| un flag de foco por elemento | permite dos focos a la vez, que es el defecto que la fase entera resuelve |
| hacer enfocable el primario | colisiona con el toque que alterna el cromo, y la vuelta a la mezcla declarada ya da la salida |
| el gesto en el `click` | el `pointerdown` del contenedor baja el cromo antes, así que fallaría justo en el toque que tiene que actuar |
| habilitar punteros en la capa en vez de en los nodos | la capa volvería a comerse los clicks que son de lo que está abajo |
| habilitar punteros en `createNode` | los nodos precargados están posicionados con `opacity: 0`, y opacity no detiene un dedo |
| el listener en `attach()` despachando por `data-element-id` | dos experiencias solapadas sin `id` comparten `'asset'`, y el foco iría a la caja equivocada |
| leer `qa-controls--on` desde el renderer | le enseña al renderer qué es el cromo y pide un selector, que el grep del ADR 0015 prohíbe en `lib/` |
| foco idempotente, como el multiview | deja sin salida a quien mira salvo buscar otra caja, y en `cornerOverlay` hay una sola |
| conservar el foco al rearmar la composición | le daría a un anunciante nuevo el audio que quien mira eligió para otro, por una coincidencia de layout |
| mantener el foco cuando el asset se termina | composición muda con un cuadro congelado: la falla que el ADR 0014 existe para evitar |
| sacar el nodo cuando su asset se termina | cambia la regla del contrato de que la composición sigue la ventana |
| volver al primario en vez de a la mezcla declarada | en el Quad el primario declara 10, así que sería una mezcla que la campaña no escribió |
| un parlante al lado del anillo | los pseudo-elementos no se renderizan sobre un `<video>`: pide un nodo hermano y una caja más en `place()` |
| un toast cuando el foco se mueve solo | el anillo que se va es el aviso, y el toast es interfaz nueva en la capa que no le corresponde |
| supersede del ADR 0014 | nada de lo que el 0014 decide se vuelve falso |
| una excepción escrita adentro del 0014 | ese ADR asignó el dueño de la respuesta de forma explícita; cambiarlo es una decisión nueva |
| hacer del foco un paso del guion de la corrida | un gesto más que acertar en cámara para mostrar lo que la mezcla del Quad ya muestra |
