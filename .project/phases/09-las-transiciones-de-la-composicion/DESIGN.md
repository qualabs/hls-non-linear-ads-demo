# Fase 09: las transiciones de la composición

Cuando un aviso entra o sale, la composición cambia de golpe. Esta fase le pone
tiempo a ese cambio, y lo pone **en la librería**: `lib/` es lo único que esta
fase toca.

Es una fase de sdk y no de demo. La 08 lo dejó escrito antes de que esto
existiera: *"La librería no cambia. La superficie pública y el contrato entre las
dos capas quedan iguales. Si la página necesita algo que la sdk no da, eso es un
hallazgo para reportar y no un cambio para hacer acá"* (ADR 0040). Nicolás pidió
esto diciendo que es trabajo de la sdk, así que es el caso que ese ADR anticipó y
la fase 08 queda como está.

## Lo que se pidió, en los términos en que se pidió

**La L.** No que aparezca la L y el primario se achique al mismo tiempo. La L ya
está puesta, y el primario **se achica sobre ella**:

> *"da la sensación de como que el contenido ya estaba abajo y ¡vup! aparece...
> entonces es visualmente más agradable y no es que ¡pac! de repente cambia el
> contenido de golpe"*

A la salida el primario se agranda de vuelta y la tapa.

**El banner y las imágenes.** Un difuminado corto para entrar y uno rápido para
salir, con opacidad: *"así como que tiene un poco más de vida la demo"*.

**El aviso a cuadro entero, nada.** *"ahí no hay ningún efecto, ahí es un cambio
brusco y está, está bien, es lo que es"*.

**Y va fijo en la sdk**, no como algo que cada demo prenda: *"dejémoslo medio como
fijo que siempre tengan estos elementos"*.

**El tiempo lo paga el aviso.** *"la entrada y salida de las cosas debe ocupar el
tiempo definido para que estas publicidades se muestren en pantalla, entonces
debería verse sí."* O sea que nada sobrevive a su ventana: la entrada ocurre en
los primeros milisegundos de la ventana y la salida termina exactamente en el
borde, no después.

## Lo que ya está en pie, leído en el código y no supuesto

**1. El efecto que describe ya es la arquitectura, y lo único que falta es la
interpolación.** El aviso de la L es un backplate a cuadro entero en `zDepth` 0 y
el contenido primario es un elemento del layout en `zDepth` 1 con su caja
encogida (ADR 0047, sobre las reglas 2 y 3 del contrato). O sea que *"el contenido
ya estaba abajo"* no hay que construirlo: es literalmente cierto hoy. Lo que pasa
es que la caja se escribe sin tiempo en el medio.

**2. Mover el primario es UNA línea, y de ahí sale que esto sea barato.**
`movePrimary` escribe cinco propiedades de geometría, pero cuatro de ellas
—`renderer.js:555-558`— son la **caja base**: el rectángulo de la imagen, que no
cambia mientras no cambie el área. Lo que mueve al primario es
`renderer.js:560`, el `transform`. Un `transform` es exactamente lo que una
transición de CSS interpola sin tocar layout.

Las cuatro asignaciones directas de `renderer.js:507-510` son las de `sizeAsset`,
que es la caja de un **nodo de aviso** y no la del primario: ésas sí son `left`,
`top`, `width` y `height`, o sea propiedades de layout. Esta fase **no las
anima**, y por eso no paga reflow por cuadro en ningún camino.

**3. `lib/` no anima geometría hoy.** Las únicas dos transiciones existentes son
de los controles: `controls.js:176` (180 ms de opacidad) y `controls.js:323`
(120 ms de color y transform). No hay con qué pelearse y tampoco hay un patrón
previo que copiar.

**4. El bucle es de cuadro, y `place()` no corre en cada cuadro.** `tick()` va por
`requestAnimationFrame` (`renderer.js:779-782`), pero `place()` se llama sólo
cuando cambia el `itemId` de lo activo o cuando el área se movió más de medio
píxel (`moved`, `renderer.js:203-206`). En régimen, ninguna de las dos: nadie
reescribe el `transform` por cuadro, así que una transición no se corta a sí
misma.

**5. La secuencia real de cajas del primario en el break de hidratación**, leída
del asset list y de los dos defaults que la capa asume:

| # | aviso | `type` | caja del primario | `zDepth` |
| --- | --- | --- | --- | --- |
| 1 | banner | `lowerThirdOverlay` | cuadro entero (default #1) | 0 |
| 2 | L | `squeezebackLShape` | `0 0 26 26`, o sea 74 % anclado arriba a la derecha | 1 |
| 3 | lineal | `linear` (sintetizado) | cuadro entero | 0 |
| 4 | overlay | `cornerOverlay` | cuadro entero (default #1) | 0 |

## La pregunta que decide la fase

**¿Cómo distingue la librería una transición de L de una de aviso a cuadro
entero?** La solución obvia —animá toda caja que cambie— parecía descartada,
porque el aviso a cuadro entero también compone cajas y ahí el corte brusco es lo
correcto.

**No está descartada: es la respuesta, y no hace falta ningún campo nuevo.** Son
dos bits y los dos ya están.

**El de la geometría no es un bit: es la identidad del valor.** El aviso a cuadro
entero declara `primaryContent` con `viewport: '0 0 0 0'` y `zDepth` 0
(`lib/signalling.js:214`), así que el primario **sí se compone** —el supuesto
contrario es falso— pero su caja es el cuadro entero. `movePrimary` sobre esa caja
calcula `scale(1, 1)` y `translate(0px, 0px)`: la identidad. Una transición sobre
el `transform` del primario interpola entonces entre dos geometrías **idénticas**,
y no se ve nada. No hay rama, no hay campo y no hay etiqueta que leer: el
mecanismo se apaga solo donde tiene que apagarse, porque ahí no hay nada que
mover.

Esto vale para los cuatro avisos del break: entre el banner y la L la caja pasa
de cuadro entero a 74 % y se ve; entre la L y el lineal vuelve a cuadro entero
debajo de un aviso que ya tapa todo; entre el lineal y el overlay no se mueve.

**El del difuminado sí es un bit, y también existe.** `experience.type ===
'linear'` distingue al aviso a cuadro entero de cualquier otro. Y no es una
etiqueta que alguien tenga que escribir en un asset list: `'linear'` es una
etiqueta **de este contrato**, que la capa de señalización pone cuando un `ASSET`
no trae bloque o trae uno que no se puede dibujar (`LINEAR_TYPE`,
`lib/signalling.js:142`; ADR 0019). El repliegue cae al mismo lugar, así que un
bloque roto también entra sin difuminado, que es lo correcto: en pantalla es un
aviso a cuadro entero y nada más.

**Conclusión: la superficie pública no cambia en nada.** Ni un campo en el asset
list, ni una opción en `attach`, ni una línea del contrato. La fase es interna de
punta a punta, y eso además es lo que hace posible que vaya fija en la sdk como
Nicolás pidió: no hay nada que una demo pueda prender ni apagar.

## Las decisiones

### D1. El discriminante de la geometría es la caja que el layout ya declara

Se anima el `transform` del contenido primario **siempre**, sin preguntar de qué
layout se trata. Donde el layout no le da una caja más chica, la transición
interpola entre la identidad y la identidad y en pantalla no pasa nada.

Lo que se descartó es una rama por `type` para la geometría —animar sólo en
`squeezeback*`—, y no por elegancia: una rama por etiqueta hay que mantenerla
cada vez que aparece un layout, y se equivoca al primer layout nuevo que encoja
el primario sin llamarse squeezeback. La caja, en cambio, es el dato que ya decide
qué se ve.

### D2. Se animan `transform` y `opacity`, y ninguna propiedad de layout

Nunca `left`, `top`, `width` ni `height`. Dos razones y las dos alcanzan solas.
La primera es que son las propiedades de un **nodo de aviso** (`sizeAsset`), y
animar la caja de un aviso no es nada de lo que se pidió. La segunda es el costo:
son propiedades que el navegador resuelve haciendo layout, y esto se graba.

Consecuencia: la banda de la L nunca se anima por sí misma. Lo que el espectador
ve moverse es el primario, y la banda aparece porque el primario la destapa, que
es exactamente lo que Nicolás describió.

### D3. El difuminado se prende para todo aviso menos el de cuadro entero

Un nodo de aviso entra y sale con opacidad, salvo cuando su experiencia es
`type === 'linear'`, donde aparece y desaparece sin nada.

La alternativa era difuminar **sólo las imágenes** (`isImage`, que el archivo ya
tiene), leyendo *"el banner y las imágenes"* al pie de la letra. Se descarta
porque deja al overlay de video entrando de golpe en la misma demo donde el
banner entra difuminado, y *"siempre tengan estos elementos"* dice lo contrario.
Si mirándolo resulta que el video tenía que entrar seco, la vuelta es cambiar un
predicado de una línea.

### D4. La salida termina en el borde de la ventana, no arranca ahí

La transición se paga con el tiempo propio del aviso. Eso convierte la salida en
una **agenda** y no en un ciclo de vida: el difuminado de un nodo empieza 120 ms
antes de que su ventana cierre y llega a cero justo en el borde, y el primario
empieza a crecer 380 ms antes y llega al cuadro entero justo en el borde.

**Y ahí está lo que hace que el mecanismo sea chico: mientras la transición
corre, la ventana todavía no cerró.** El nodo del aviso está vivo por derecho
propio, el backplate de la L sigue dibujado, y el primario lo tapa creciendo
encima — que es exactamente lo que se pidió. No hay que mantener a nadie vivo más
allá de su tiempo, así que no hay `detach` postergado, no hay nodos retirándose,
no hay temporizador de limpieza y no hay un nodo invisible que pueda comerse un
gesto.

**El instante de cada cosa sale del contrato y no de un reloj propio.** Cuánto
queda de la ventana de un elemento es
`experience.startTime + experience.duration - video.currentTime`, que es la misma
cuenta que el archivo ya hace en `renderer.js:330`. La regla 5 queda intacta:
`activeAt` sigue siendo lo único que decide si un aviso está activo, y esto sólo
lee dónde está parado adentro de una ventana que ya está abierta.

**Es una función del instante y no de un evento que ya pasó**, y por eso un seek
hacia atrás que salga de los últimos 120 ms vuelve a subir la opacidad sin que
nadie tenga que acordarse de nada.

Lo único que falta para poder agendarlo: el primario entra a `drawn` sin su
experiencia (`renderer.js:383`), así que no hay de dónde leer su ventana. Se le
agrega el campo. `warnIfCut` ya se protege de que no esté (`renderer.js:701`), así
que agregarlo no cambia nada de lo que hoy funciona.

### D5. Un solo escritor, tres disparadores, y `clear()` no cambia

`place()` sigue siendo el único que escribe geometría y opacidad. Lo que cambia es
cuándo se lo llama: hoy son dos disparadores —cambió el aviso activo, o se movió
el área— y pasan a ser tres. El tercero es que un elemento cruzó el umbral de su
salida. Cada entrada de `drawn` recuerda qué se le escribió por última vez, así
que la comparación es una comparación y no una reescritura por cuadro.

Un segundo escritor que corriera en cada `tick()` al lado de `applyAudio` era la
alternativa, y se descarta: dos funciones escribiendo el `transform` del mismo
elemento se pisan, y averiguar cuál ganó es el tipo de defecto que no se ve en
un cuadro.

**Y `clear()` no cambia en una línea.** En el borde de la ventana el nodo del
aviso ya está en opacidad 0 y el primario ya está en el cuadro entero, así que
destruir el nodo y borrarle el atributo `style` al primario —lo que `clear()` hace
hoy, en `renderer.js:721-737`— es visualmente un no-op. El borrado del atributo
sigue siendo obligatorio y sigue ocurriendo en el acto: con la composición vacía
`place()` no recorre nada, y un atributo que quedara dejaría al video del tamaño
del break anterior en cuanto alguien redimensionara la ventana.

### D6. Un cambio de tamaño re-coloca sin animar

`place()` corre por dos caminos distintos y hoy no los distingue: uno es
**componer** —cambió el aviso activo— y el otro es **re-colocar** porque el área
se movió. Redimensionar la ventana o entrar a pantalla completa tiene que ser
instantáneo; animarlo sería la ventana arrastrando la imagen atrás de sí misma.

`place()` recibe entonces cuál de los dos caminos es, y escribe la
`transition-property` en consecuencia: la propiedad viaja en la misma pasada que
la geometría, así que el camino de re-colocar no arranca ninguna transición
aunque el valor cambie. `tick()` ya calcula la diferencia entre los dos casos
(`nextKey !== key` contra `resized`) y no hay que derivar nada nuevo.

### D7. Los tiempos son constantes exportadas de `lib/renderer.js`

Cuatro números: cuánto tarda la geometría, cuánto el difuminado de entrada,
cuánto el de salida, y las curvas. Van como constantes exportadas arriba del
archivo, al lado de `PRELOAD_LEAD_SECONDS` y `CUT_TOLERANCE_SECONDS`, que es
donde este archivo ya pone lo que alguien puede querer discutir.

Los valores de arranque son **380 ms** para la geometría con curva de salida
suave, **200 ms** para el difuminado de entrada y **120 ms** para el de salida.
Son valores para corregir mirando y no mediciones: el orden de magnitud sale de
lo que hace un squeezeback de aire, y la asimetría del difuminado sale de que
Nicolás la pidió así.

La geometría usa **un solo número para entrar y para salir**. Un segundo número
para la salida es una línea el día que mirándolo haga falta; hoy sería un botón
más sin nadie que lo haya pedido.

No van como custom properties de CSS ni como opciones de `attach`: eso las
volvería configurables por demo, que es lo contrario de lo que se pidió.

### D8. Un nodo construido en el momento entra sin difuminado

Los nodos que `bringAhead` trae anticipados ya están en el DOM en opacidad 0
(`renderer.js:440`), así que difuminarlos es cambiar un valor que el navegador ya
tenía calculado. Un nodo que `build` construye en el momento
(`renderer.js:394`) se crea y se inserta en la misma pasada, y ahí una transición
no arranca sin forzar un reflow o esperar un cuadro.

Ese nodo entra sin difuminado, y no se paga ninguna de las dos cosas. El camino
es el de caer en el medio de la ventana de un aviso, o sea un seek, donde un
difuminado además sería incorrecto: nadie está viendo entrar al aviso, se está
cayendo adentro de uno que ya estaba corriendo. En la corrida derecha del break
los cuatro avisos llegan anticipados y difuminan.

### D9. La ventana no se toca por ningún lado, y al creativo no se le recorta nada

Que la transición se pague con el tiempo del aviso habilita una lectura
equivocada: que haya que recortarle o demorarle contenido al creativo para hacerle
lugar. No es eso, y la diferencia es la línea entre esta fase y una que rompe el
mecanismo.

El aviso arranca en el instante 0 de su ventana, suena y se ve completo. Lo que
ocurre durante los primeros 380 ms es que el primario se achica **encima**, con el
aviso ya jugando debajo. Nada de esta fase toca `build`, ni `attachAsset`, ni
`applyPlayback`, ni `applyAudio`, ni el `startAt` con el que un nodo arranca: no
se pierde un cuadro ni se demora un arranque. Lo mismo a la salida, donde los
últimos 120 ms del creativo se ven difuminándose en lugar de no verse.

Y por el otro lado la ventana tampoco se estira. La regla 5 del contrato queda
intacta —`activeAt` es la única fuente de la ventana de activación— y `warnIfCut`
sigue midiendo en el mismo instante, así que el número que sale a la consola es el
mismo que antes de esta fase.

### D10. La fase se verifica en `demo/compatibility-pair`, y no se la toca

Los tres casos que hay que mirar están autorados ahí desde la fase 05: la L con
su geometría (`asset-list-squeezebackLShape.json`), el overlay y la L de imagen
para la opacidad (`asset-list-cornerOverlay.json`,
`asset-list-squeezebackLShape-image.json`), y el aviso a cuadro entero con el
repliegue para la exclusión (`asset-list-linear.json`,
`asset-list-repliegue-bloque-roto.json`).

Verificar ahí sale gratis: los casos ya están, cada break trae un aviso solo así
que la entrada y la salida se ven contra el programa entero, y no hay que abrir
`demo/hydration-break/`, que es de otra sesión.

**Y las dos demos autoran la L distinto, así que hay que mirar las dos.** La
técnica la autoró con dos tiras encima del primario (`zDepth` 1 y 2 contra el 0
del primario) y la del break de hidratación con un backplate a cuadro entero
debajo (ADR 0047). Bajo el mismo mecanismo las dos salidas se ven distinto y las
dos son correctas: en la técnica las tiras se difuminan sobre una imagen que
crece, y en la otra la imagen tapa al backplate al crecer. La segunda forma es la
que Nicolás describió, así que se la mira en la demo del break de hidratación
—correrla y mirarla, sin tocar un archivo— aceptando que su contenido está a
mitad de camino en otra sesión.

## Lo que NO se hace

Es la mitad del valor de esta fase. En una fase de animación el alcance no se
escapa por el costado: se escapa porque animar una cosa más siempre parece una
línea más.

- **No se toca `demo/`, ni una línea, en ninguna de las dos demos.** Si el diseño
  necesita que una demo cambie, eso es un hallazgo para reportar y no un cambio
  para hacer (ADR 0040, del otro lado). `demo/hydration-break/` además tiene
  trabajo sin commitear de otra sesión.
- **No cambia la superficie pública**: ni un campo en el asset list, ni una
  opción en `attach`, ni una línea del contrato. Si al ejecutar resulta que algo
  de esto tenía que cambiar, se para y se reporta.
- **No hay efecto en el aviso a cuadro entero**, ni a la entrada ni a la salida.
- **No se anima la caja de ningún nodo de aviso.** La banda de la L no crece: la
  destapa el primario.
- **No se animan los controles.** Ya tienen sus dos transiciones y no se tocan.
- **No se anima nada más de la librería**: ni el anillo del foco de audio, ni la
  barra de tiempo, ni la pelotita, ni el logo, ni la marca del rango.
- **No hay fade de audio.** Ni rampa de volumen al entrar o salir de un aviso, ni
  cross-fade de la mezcla. El audio sigue conmutando como conmuta hoy.
- **No hay `prefers-reduced-motion`.** Es una capacidad de accesibilidad sobre una
  demo que se graba en una máquina nuestra, y las fases 06, 07 y 08 ya dejaron la
  accesibilidad afuera por la misma razón.
- **No se le recorta ni se le demora un cuadro a ningún creativo**, ni se estira
  ninguna ventana. Es la lectura equivocada de "ocupar el tiempo del aviso"
  (D9).
- **No hay animación al redimensionar** ni al entrar a pantalla completa (D6).
- **No hay animación de arranque.** La primera aparición del player no difumina.
- **No se compone video**: nada de cross-fade entre el programa y un creativo.
  David lo descartó explícitamente para el proyecto entero.
- **No se toca `docs/contrato-senalizacion-renderizado.md`.** El contrato no
  cambia. Lo único que se documenta es una nota corta al integrador en
  `docs/integrating-the-library.md`, porque la imagen se mueve sola y quien
  integra tiene que saber que es la librería y no su página.
- **No se pule.** Un POC no se pule: la vara es que se vea mejor que el corte
  seco, mirado por Nicolás una vez.

## Riesgos

**R1. La transición no arranca, porque la misma pasada que la escribe borra el
estilo.** `clear()` y `place()` corren en el mismo `tick()`, y `clear()` le borra
al primario el atributo `style` entero. Que la transición dispare depende de que
la `transition-property` esté en el estilo **posterior** al cambio, que es lo que
D6 hace escribiéndola en la misma pasada que la geometría. Es la propiedad sobre
la que se apoya la fase entera: si no se cumple, no hay animación en ningún camino
y el diseño cambia.

*Mitigación:* **es lo primero que se mide y se mide antes de construir nada
encima**, en el navegador y sobre la L de la demo técnica. Si sale al revés, la
alternativa es una hoja de estilos inyectada por la librería —`controls.js:459-461`
ya inyecta una— y la fase paga una pieza más.

**R2. Una ventana más corta que la transición.** Con una ventana de 300 ms, el
primario está adentro de sus últimos 380 ms desde el primer cuadro.

*Aceptado, y degrada bien:* como el objetivo sale del tiempo que queda, el
primario apunta al cuadro entero desde el arranque y simplemente no se achica. Es
lo que la regla dice —la transición está acotada por la ventana— y el resultado es
que no hay efecto, no que haya un cuadro roto. La ventana más corta de la demo es
de 8 s.

**R3. Los últimos 120 ms, donde las dos cosas pasan juntas.** El nodo del aviso se
difumina mientras el primario todavía está creciendo encima. En la L del break de
hidratación eso deja, sobre el final, una banda fina de backplate difuminándose
hacia el fondo de la página en lugar de quedar tapada.

*Mitigación:* se mira. Para cuando faltan 120 ms de una animación de 380 con curva
de salida suave, el primario ya cubre casi todo el cuadro y lo que queda es una
banda angosta y cerrándose, así que la apuesta es que no se ve. Si se ve, la vuelta
es una línea y sale del contrato sin agregarle nada: un elemento del aviso con
`zDepth` por debajo del primario no necesita difuminar a la salida, porque su
salida es que el primario lo tape. No se escribe antes de mirar.

**R4. La lectura equivocada de "ocupar el tiempo del aviso":** recortarle o
demorarle contenido al creativo.

*Mitigación:* D9 lo declara, y el control es de código y no de intención — esta
fase no toca `build`, `attachAsset`, `applyPlayback`, `applyAudio` ni el `startAt`.
El chequeo mirado es que el creativo del aviso lineal se oiga y se vea entero, y
que `warnIfCut` no cambie lo que dice.

**R5. Animar sale caro en el cuadro y esto se graba.** Una animación que hace
layout por cuadro se ve como tirones justo en el momento que la demo quiere lucir.

*Mitigación:* D2, que limita lo animado a `transform` y `opacity`, las dos que el
compositor resuelve sin layout; y D5, que evita reescribir por cuadro. Se mira en
la corrida.

**R6. El efecto queda mal a la vista, con números que eligió otro.** Los cuatro
valores de D7 no están medidos.

*Mitigación:* están en un solo lugar y son constantes exportadas, así que
corregirlos es una línea; y la última task es la corrida mirada. Riesgo aceptado:
no se pule.

**R7. Un chequeo escrito de buena fe puede no poder fallar.** Pasó cuatro veces en
este proyecto. Acá el candidato es el test del discriminante, que puede pasar
porque las dos ramas devuelven lo mismo.

*Mitigación:* el test del discriminante se corre con el predicado invertido a
propósito antes de darlo por bueno, y ese control va en la evidencia.

## Verificación

**Lo que se puede testear sin navegador, y es justo el bit que decide todo.** Los
cuatro suites de `test/` corren con `node --test` y sólo importan funciones puras
de `renderer.js` (`boxToPixels`, `volumeOf`, `effectiveVolumeOf`): el renderer con
DOM no está testeado y esta fase no lo va a testear. Pero el discriminante de D3
**es** una función pura sobre una experiencia ya resuelta, y el instante en que
empieza una salida **también**: cuánto queda de una ventana es aritmética sobre
tres números. Las dos se exportan como funciones puras y se prueban con los
fixtures que ya existen — la L y el overlay difuminan, el lineal y los tres
repliegues no — más los casos de borde de la agenda: el instante justo del umbral,
la ventana más corta que la transición, y el tiempo anterior al arranque. Es donde
equivocarse es invisible, y es lo que queda cubierto por tests.

**Lo demás se mira.** En `demo/compatibility-pair` (D10): la entrada y la salida de
la L, la entrada y la salida del banner de imagen y del overlay, el corte seco del
aviso a cuadro entero en sus dos puntas, el redimensionado durante y después de un
break, y un seek hacia atrás que salga de los últimos 120 ms de un aviso. Y en
`demo/hydration-break`, corriéndola sin tocarla, la forma del ADR 0047: el primario
tapando el backplate al crecer, en los últimos 380 ms de la L y antes de que el
aviso a cuadro entero arranque.

**Y las dos suites de siempre en verde**: `npm test` y `npm run check`.

## El orden del trabajo

Cinco tasks, y el orden lo pone el riesgo y no la comodidad.

1. **Las dos funciones puras y sus tests.** El discriminante del difuminado y la
   aritmética de la agenda, con los fixtures que ya existen y el control del
   predicado invertido (R7). Primero porque es lo único que se cierra sin
   navegador.
2. **La geometría del primario, entrada y salida.** D1, D4, D5 y D6 juntos, porque
   son el mismo cambio en `place()` y en `tick()`, más el campo que le falta a la
   entrada del primario. **Acá se mide R1**, y si R1 sale al revés se para y se
   reporta antes de seguir.
3. **El difuminado de los nodos de aviso, entrada y salida.** D3, D8 y D9 sobre la
   agenda que la task 2 ya dejó puesta.
4. **Los tiempos y la nota al integrador.** D7 más el párrafo en
   `docs/integrating-the-library.md`.
5. **La corrida mirada y las suites.** Los casos de la sección anterior sobre las
   dos demos, más `npm test` y `npm run check`.

## Hallazgos

**Nadie tiene que cambiarle el asset list a ninguna demo.** Con la transición
adentro de la ventana, los últimos 380 ms de la L siguen siendo tiempo de la L y
el aviso a cuadro entero todavía no arrancó, así que la salida se ve en las dos
demos —cada una en su forma, según cómo autoró la L (D10)— sin mover un orden ni
un `DURATION`.

**El primario sí se compone en el aviso a cuadro entero.** `lib/signalling.js:214`
lo declara a cuadro entero y en `zDepth` 0. Lo que hace que ese aviso no tenga
efecto no es que el primario falte, es que su caja es la identidad, y eso resultó
mejor: la exclusión sale sin escribir una rama.
