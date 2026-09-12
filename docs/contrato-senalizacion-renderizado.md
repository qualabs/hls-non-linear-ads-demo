# El contrato entre la señalización y el renderizado

Es la única superficie entre las dos capas del ADR 0003. De este lado, el
renderizado, no se importa el player, no se leen tags y no se pide nada por
red: se recibe un **proveedor**, se recibe una **manera de poner un asset en un
elemento**, y se dibujan cajas.

## El proveedor

Un objeto con dos métodos:

```js
provider.activeAt(time) -> Experience[]
provider.programRanges() -> { ranges: Range[], settled: boolean }
```

`activeAt` contesta **qué está activo en este instante**. `time` es el tiempo de
reproducción del contenido primario en segundos, el que da `video.currentTime`.
Devuelve las experiencias activas en ese instante, y un array vacío cuando no
hay ninguna. Es sincrónico, se puede llamar en cada cuadro, y devuelve los
mismos objetos mientras la experiencia siga activa.

`programRanges` contesta **dónde están todos los rangos del programa**, que es
otra pregunta y no una versión más larga de la primera. Tiene su propia sección
más abajo.

Hay además una propiedad, `provider.experiences`, que es la lista de experiencias
que la capa fue resolviendo, **entregada por referencia**. No contesta ninguna de
las dos preguntas —no filtra por instante ni ordena por tiempo— y está para que
una página pueda nombrar un break que todavía no ocurrió. Quien la lee no la
ordena ni la modifica: es el estado de la capa y no una copia.

## Los datos

```js
Experience {
  id: string          // identificador de la señalización; sirve para nombrar el BREAK en un log
  itemId: string      // identidad de este aviso adentro del break; única entre todas las experiencias
  type: string        // etiqueta opaca del layout: 'cornerOverlay', 'squeezebackLShape', ...
                      // 'linear' es el de un aviso al que esta capa no le dibuja layout
                      // 'multiViewOffer' es el de una oferta, que trae catálogo y no layout
  startTime: number   // segundos de reproducción en que arranca
  duration: number    // segundos que dura
  elements: Element[] // ordenados por zDepth ascendente; vacío cuando no hay composición
  views: View[]       // SÓLO en una oferta: el catálogo que se ofrece
  primaryName: string // SÓLO en una oferta: cómo se llama el contenido primario en la lista
}

Element {
  id: string          // 'primaryContent' para el contenido primario, o el id que trae el aviso
  primary: boolean    // true en el único elemento que es el contenido primario
  box: { top, right, bottom, left }   // porcentajes de INSET sobre el área del player, 0..100
  zDepth: number      // orden de apilado; el mayor queda arriba
  volume: number      // 0..100
  uri: string|null    // el asset a reproducir; null en el primario, que ya está en pantalla
  mediaType: string|null  // el MIME del asset; null en el primario
}

View {
  id: string          // identidad de la vista; es por donde se la sube y se la baja
  name: string        // la etiqueta que alguien lee en la lista
  uri: string|null    // el asset a reproducir
  mediaType: string|null  // el MIME del asset
}
```

**Las formas de `Element` y de `Range` no cambiaron para agregar la oferta, y eso
es el dato y no una tranquilidad.** Una vista que sube se entrega como un
`Element` igual a cualquier otro, con su `box`, su `zDepth` y su `volume` ya
resueltos, así que el lado que dibuja no aprendió una forma nueva ni un campo
nuevo. Lo único que se sumó son los dos campos que sólo trae una oferta.

## Las seis reglas de lectura

1. **`box` son insets en porcentaje, no coordenadas.** Cuánto se recorta cada
   borde respecto del área del player, **que es la caja de la imagen y no la
   del contenedor**: la relación de aspecto la pone el video, no el tamaño de
   la pantalla, así que en una pantalla que no tiene la forma del contenido las
   cajas se reparten sobre la imagen y no sobre las barras negras de al lado
   (T-09). `{0,0,0,0}` es el cuadro entero;
   `{0,75,75,0}` es la esquina superior izquierda a un cuarto de cada lado. La
   conversión a píxeles es una resta, y la midió la T-03 con cero píxeles de
   diferencia en los quince elementos de los seis layouts:

   ```
   left = W * box.left/100        width  = W - left - W * box.right/100
   top  = H * box.top/100         height = H - top  - H * box.bottom/100
   ```

2. **`elements` ya viene ordenado por `zDepth` ascendente**: se dibuja en ese
   orden y el último queda arriba. No hay que reordenar. El orden importa de
   verdad: en `squeezebackFrame` el aviso está en `zDepth` 0 y el contenido
   primario en 1, o sea que el aviso es el fondo.

3. **El contenido primario es un elemento del layout como cualquier otro**, con
   su `box`, su `zDepth` y su `volume`, y se distingue por `primary: true`. No
   trae `uri` porque ya está reproduciéndose: lo que hay que hacer con él es
   moverlo a su caja.

4. **La caja se llena con recorte centrado y sin deformar** (`object-fit:
   cover`, ADR 0013), con el modo en una sola constante del renderizador. Tres
   de las quince cajas medidas no tienen la relación de aspecto del asset, y
   estirarlas deforma hasta un 233 por ciento.

5. **`activeAt` es la única fuente de la ventana de activación.** No hay que
   comparar tiempos: si la experiencia está en la lista, está activa. `startTime`
   y `duration` vienen para mostrar un contador, no para decidir. Los rangos del
   programa no sirven para esto: dicen dónde están los breaks, no cuál corre
   ahora. La ventana es **declarada** y puede no coincidir con el largo real del
   asset: de dónde sale el fin y qué cuesta, en "De dónde sale el fin de un
   aviso".

6. **Dos experiencias se distinguen por `itemId`, nunca por `id` ni por
   `type`.** Un break trae varios avisos y los tres campos no dicen lo mismo:
   `id` nombra el break y lo comparten todos sus avisos, `type` es la etiqueta
   del layout y dos avisos seguidos pueden compartirla —es lo natural, no lo
   raro—, y `itemId` es el único que nombra a un aviso. Quien dibuja se entera
   de que un aviso terminó y empezó otro comparando `itemId`: comparando
   cualquiera de los otros dos, el segundo creativo de un break no se dibuja
   nunca y en pantalla se ve el primero corriendo de largo.

## La oferta de varias vistas

Una experiencia puede traer un **catálogo** en lugar de un layout, y las dos se
distinguen por el campo: la que trae `views` es una oferta. Lo que la señalización
anuncia ahí es qué más se puede mirar y cómo se llama cada cosa; **dónde va cada
caja no lo dice, porque no lo puede saber**: depende de cuántas cajas terminen en
pantalla, y eso se decide de este lado y varias veces mientras la ventana está
abierta.

De ahí salen las tres consecuencias que hay que leer, y ninguna cambia la forma
de un dato:

1. **Una vista no declara `viewport`, ni `zDepth`, ni `volume`.** Los tres
   dependen de la composición, que no existe cuando se escribe el catálogo. Si el
   payload los trae, la capa los ignora y lo dice por consola: obedecerlos
   colocaría una caja contra un número que su autor nunca conoció, y rechazar la
   oferta entera por una clave de más sería replegar por algo que no se ve en
   ninguna pantalla.

2. **`elements` vacío es una respuesta y no un dato que falta.** Es lo que
   contesta una oferta mientras nadie eligió nada: una sola caja no es una
   composición, así que lo que hay que dibujar es el programa exactamente como
   estaba. La ventana abierta y la composición armada son dos cosas distintas y
   pueden no coincidir en ningún instante de la ventana.

3. **Las cajas las calcula la librería, en una lista ordenada y con el primario
   siempre primero.** La forma sale de cuántas cajas hay: dos van lado a lado con
   banda arriba y abajo, tres y cuatro se reparten la pantalla. El orden es el de
   la selección y es una promesa: una lista en otro orden es cada caja con la
   imagen de otro, y no hay nada en una pantalla que lo diga.

**El tope de cajas es de la pantalla y nunca de la oferta.** Un catálogo es tan
largo como quiera quien lo publica, y lo que está topeado es cuánto de él está
arriba a la vez. El número sale de la tabla de formas y no está escrito al lado
de ella.

**El sobre es el mismo que el de un aviso.** `start`, `duration`, `id`, `itemId`
y la acumulación de offsets por `DURATION` significan exactamente lo mismo en los
dos casos: una oferta se coloca sobre la línea de tiempo por la misma suma. Lo
único que no comparten es qué hay adentro.

## Qué promete el renderizado sobre los nodos

El contrato de arriba dice qué se entrega; esto dice qué le pasa a lo entregado,
y es una promesa del lado que dibuja porque es donde se rompe.

**Un elemento que sigue estando entre dos respuestas conserva su nodo.** Cuando
la composición cambia no se destruye y se reconstruye todo: se crea sólo lo que
aparece, se destruye sólo lo que se va, y lo que queda se mueve a su caja nueva.
Lo que eso compra es que una caja que no se fue a ninguna parte no se rebuffere
—no vuelve a cero, no se pone negra— y que el foco de audio que alguien le puso
siga donde lo puso.

**Lo que decide si un elemento "sigue estando" es la identidad de la regla 6**,
`itemId` más la identidad del elemento, y nunca el `id` ni la posición de la
caja. Dos experiencias solapadas sin `id` propio comparten ese campo, y comparar
por ahí le entrega a un anunciante el nodo —y el audio— de otro, en silencio y
por una coincidencia de layout.

**Y aplicar el cambio no deja la composición a medias**: terminado, lo dibujado
es exactamente lo que el contrato pidió, ni un nodo de más ni uno de menos.

## Los rangos del programa

`activeAt` alcanza para dibujar lo que está pasando y no alcanza para dibujar
una barra, que tiene que mostrar dónde están los breaks antes de que ocurran.
Esa es la segunda consulta:

```js
provider.programRanges() -> { ranges: Range[], settled: boolean }

Range {
  id: string        // el mismo identificador de la señalización que trae la experiencia
  kind: string      // 'concurrent' | 'multiview' | 'interstitial'
  startTime: number // segundos de reproducción en que arranca
  duration: number  // segundos que dura
}
```

`ranges` viene ordenado por `startTime` ascendente. Es sincrónico y barato, y se
puede llamar en cada pintada.

**`kind` dice de qué clase es el rango, y es un dato y no una decoración.** El
programa lleva tres clases de rango encima de la misma línea de tiempo. Dos se
dibujan sobre el contenido sin detenerlo: la experiencia concurrente, y la oferta
de varias vistas. La tercera es el interstitial tradicional que la misma playlist
señaliza en cada break para los clientes que ya están en el mercado (ADR 0007),
que este reproductor no reproduce y que igual está ahí: marca dónde un cliente de
mercado se habría detenido. Son cosas distintas, se pintan de colores distintos, y
sin este campo la barra no puede pintar más de un color.

**Qué kinds están en la lista y cuáles marca una barra son dos preguntas
distintas.** Esta lista los lleva todos, porque es lo que hace legible el par de
clientes; cuáles de ellos son breaks **de este** player lo decide quien cablea un
proveedor a una barra, y no la barra (ADR 0018). Una barra sobre un player que
sí reemplaza el contenido marca justamente el kind que éste no marca.

**Lo que cruza es la clase de rango y no la clase del transporte.** `kind` es uno
de esos tres strings, no el de la clase de HLS: la capa de señalización es la que
traduce, y un Date Range de cualquier otra clase no es un rango de esta lista. Un
rango es de los que se dibujan encima o es de reemplazo, y esa distinción es de
semántica —los primeros nunca cambian el largo de la línea de tiempo y el segundo
sí (ADR 0016)—, así que sobrevive a un cambio de transporte, que es exactamente lo
que el ADR 0003 compra.

**No hay largo total acá.** Un `Range` dice en qué segundo empieza y cuántos
dura, y nada más. La posición sobre la barra es una división que hace quien
pinta, con el largo que **relee** del contenido primario cada vez. El largo no
se guarda ni se entrega como dato: para la experiencia concurrente es invariante
—no crece cuando entra un break— pero un interstitial tradicional adentro del
break sí puede cambiarlo, y un supuesto que se rompe entre fases y no avisa es
el que no conviene cablear (ADR 0016).

### Qué promete la lista, y hasta dónde

La lista se puede pedir en cualquier momento, incluido el segundo cero. Lo que
promete es esto:

1. **Es monótona.** Un rango que ya salió no cambia ni desaparece: conserva su
   `id`, su `kind`, su `startTime` y su `duration`. Lo único que puede pasar
   entre dos consultas es que aparezcan rangos nuevos.
2. **`settled` en `true` significa que la lista está completa**: la
   señalización ya entregó todos los rangos que va a entregar y ninguno quedó a
   medio resolver. Con `settled` en `false` la lista es parcial y hay que volver
   a preguntar. Quien pinta re-lee, igual que re-lee el largo.

**El límite, dicho de frente: `settled` habla de la señalización y no del
programa.** Se vuelve `true` cuando la fuente de los rangos está cerrada —una
playlist que ya no puede crecer— y todo lo que esa fuente disparó terminó de
resolverse. Sobre una fuente que sigue creciendo, `settled` no se vuelve `true`
nunca y la barra se repinta a medida que los rangos llegan.

Que en este POC la lista esté completa antes de que empiece el primer break es
una propiedad del ADR 0005 y no del contrato: el primario es un VOD con los
Date Ranges escritos en la media playlist, así que llegan todos en la primera
actualización de nivel y ahí mismo se piden sus asset-list. El día que la
señalización sea live, o una agenda que se resuelve por partes, la promesa sigue
valiendo y la coincidencia no.

Un rango cuyo asset-list falla no entra en la lista, y el error queda en la
consola. La lista dice lo que la capa sabe, y no promete lo que no pudo leer.

## El reproductor de assets

El contrato le da al renderizado el `uri` del asset y su `mediaType`, y con eso
alcanza para saber **qué** hay que poner en la caja. No alcanza para poner
nada: en un browser, un `uri` de media playlist no lo reproduce el elemento de
video solo. Y esa es la única cosa que el renderizado necesita y no puede
hacer sin cruzar la costura.

Se resuelve con una función que el renderizado **recibe**, y no con un import:

```js
attachAsset(node, { uri, mediaType, startAt }) -> detach()
```

`node` es el elemento de video que el renderizado creó para ese asset,
`startAt` es el segundo del asset por donde tiene que arrancar —cero cuando la
experiencia recién empieza, y el desplazamiento correspondiente cuando se cae
en el medio de la ventana—, y lo que devuelve es la manera de desconectarlo
cuando la experiencia termina.

Del lado del renderizado esa función es opaca: la llama y guarda el `detach`.
Quien la implementa es `lib/media.js`, que es el archivo de la librería que
conoce a hls.js, y ahí adentro sí se sabe que un `mediaType` de media playlist
necesita una segunda instancia del player. Que dos elementos de video, cada uno
con su propia instancia, reproduzcan al mismo tiempo es lo que midió la T-01 de
la fase 01.

El día que la capa de abajo se reemplace, esta función se reemplaza con ella y
el renderizado no cambia, que es exactamente lo que el ADR 0003 compra.

## Lo que el contrato NO dice

- **Nada del transporte.** Ni tags, ni JSON, ni red. La clase de HLS tampoco
  cruza: lo que sale de la señalización es el `kind` del rango, que es
  semántica y no transporte. Cambiar de transporte es reemplazar la capa de
  abajo.
- **Nada de píxeles.** El área del player la conoce el renderizado y solo el
  renderizado.
- **Nada de quién compuso.** Una composición que armó quien mira llega igual que
  una que declaró quien publica: los mismos `Element`, con sus cajas ya
  resueltas. Quién eligió, y cómo se guarda esa elección, viven entre las dos
  capas y ninguna de las dos se entera.
- **El largo total del programa.** Lo lee quien pinta, del contenido primario y
  cada vez (ADR 0016).
- **La política de audio no está acá.** El `volume` es el estado inicial
  declarado de cada elemento, y el ADR 0014 es el que manda: se respeta lo que
  el asset list diga, y cuando el campo no viene el default de la capa es 0 en
  los elementos del aviso y 100 en el contenido primario. Ojo con la asimetría,
  porque es la que apaga el programa si se pierde: la herramienta de SVTA no
  emite `volume` en ningún elemento —tampoco en el bloque `primaryContent`—, así
  que un default de 0 aplicado a todos deja el primario mudo en los cinco
  layouts. El reproductor conserva además un control visible de audio, que es de
  la composición entera.

## Los dos defaults que la herramienta omite

Los midió la T-03 sobre los seis payloads que emite la herramienta de SVTA, y
están resueltos en
`.project/phases/01-poc-web-hlsjs/tasks/T-06/t06-los-seis-payloads-resueltos.json`.
Ese archivo es la evidencia de una fase cerrada, y la cita es su procedencia:
dice dónde se hizo la medición, no dónde hay un archivo que alguien lea en
tiempo de ejecución (ADR 0023).
La capa los **asume** en lugar de exigirlos, porque el ADR 0004 manda consumir
el asset-list tal como la herramienta lo emite:

| Lo que falta | Cuándo | Lo que la capa asume |
| --- | --- | --- |
| el bloque `primaryContent` entero | en `cornerOverlay` y `lowerThirdOverlay`, los dos overlays | `zDepth` 0, `volume` 100, `viewport` `"0 0 0 0"`, que es el preset de la propia herramienta |
| el campo `volume` | en los seis layouts, en todos los elementos | 0 en los elementos del aviso, 100 en el contenido primario (ADR 0014) |

Es una divergencia deliberada con la semántica de la herramienta, para la que un
`volume` ausente vale 100: audio inesperado en cámara es peor que audio
faltante, y el ADR 0014 lo argumenta y lo deja anotado como pregunta para SVTA.

El renderizado no ve nada de esto: le llega el elemento primario completo y un
`volume` en todos los elementos, siempre.

## Cómo se ordenan los avisos de un break

Un asset-list trae varios `ASSETS` y se reproducen **en el orden del array**.
Eso no es una decisión de esta capa: lo hereda de la norma, Apéndice D.2.

**El desplazamiento de cada aviso sale de la `DURATION` de nivel superior de su
asset, acumulada.** El primer asset arranca en el `START-DATE` de la
señalización, el segundo donde el primero termina, y así. El `start` del item
del bloque `X-AD-CREATIVE-SIGNALING` se lee entonces como un desplazamiento
**adentro de su propio asset**, y no desde el `START-DATE`.

**Por qué la `DURATION` y no el `start`.** El desplazamiento tiene que salir de
un campo que **todos** los assets tengan. `DURATION` es obligatorio en cada
Asset-Description por el Apéndice D.2; el bloque es una extensión nuestra y un
asset puede no traerlo —ese asset es un aviso lineal (ADR 0019), y no tiene
dónde escribir un `start`—. Una regla escrita sobre el `start` funciona para los
avisos que dibujamos y no dice nada del que no.

Los seis payloads que emite la herramienta de SVTA traen un único asset con
`start: 0`, así que el acumulador vale 0 y las dos lecturas coinciden en todos
los asset-list de la demo.

**Lo que esto cuesta, dicho de frente.** La `DURATION` es metadato
**declarado**: un servidor de decisioning puede declarar un número y servir un
creativo de otro largo. Cuando eso pasa, los avisos que vienen después quedan
colocados contra un número que nunca fue cierto. La capa **declara la secuencia
y no la corrige**: no mide el creativo ni mueve las ventanas de los avisos
siguientes. De dónde sale el fin de cada aviso, y qué pasa cuando el declarado y
el real no coinciden, es la sección siguiente.

## De dónde sale el fin de un aviso

**La ventana declarada decide, y `activeAt` sigue siendo la única fuente de la
ventana de activación** (regla 5). Un aviso entra en su `startTime` y sale
cuando se cumple su `duration`, y ni el renderizado ni nadie más consulta el
asset para saber si terminó.

**Es una divergencia con la norma y no un descuido.** El Apéndice D dice que en
ausencia de `X-PLAYOUT-LIMIT` *"the interstitial MUST end upon reaching the end
of the interstitial asset(s)"*, o sea que el fin lo pone el asset y no el
`DURATION` que lo describe. Este cliente hace la otra cosa. Las tres razones, en
orden de peso:

1. **El fin real no es una fuente que se pueda prometer.** Un asset que nunca
   carga nunca termina, así que una regla escrita sobre el fin del elemento
   necesita igual un corte por tiempo debajo — y ese corte es la duración
   declarada. No reemplaza a la ventana: le agrega una segunda fuente encima.
2. **El contrato tiene más de un lector.** La ventana la leen el renderizado y
   quien traza el contrato, cada uno por su lado y en el mismo cuadro. Con dos
   fuentes de verdad los dos pueden contestar distinto sobre el mismo instante,
   y ahí el contrato deja de ser uno.
3. **La lista de rangos es monótona** (más arriba): un rango que ya salió
   conserva su `duration`. Un fin que llega del asset la movería después de
   publicada.

**Qué pasa cuando el fin real no coincide con el declarado, medido y no
supuesto.** Las dos direcciones fallan distinto y ninguna de las dos se ve:

- **El creativo dura menos que su ventana.** El elemento llega a su última
  imagen y se queda ahí hasta que la ventana cierre. En pantalla es idéntico a
  un aviso que sigue corriendo.
- **El creativo dura más que su ventana.** Se lo saca a mitad de camino. En
  pantalla es idéntico a un aviso que terminó.

Por eso **el renderizado lo dice en la consola las dos veces**, con el número: es
el único lugar donde esa diferencia aparece. La capa sigue sin corregir nada — no
mueve las ventanas de los avisos siguientes, que ya estaban calculadas contra la
`DURATION` declarada — pero deja de ser silenciosa.

**Y por qué no se eligió que el fin real mandara**, con el número que lo decide.
Bajo esa regla un creativo más largo que su `DURATION` declarada se solapa con el
aviso siguiente **en operación normal**, y el renderizado no tiene modelo para
dos experiencias a la vez: las dos declaran caja para el contenido primario, las
dos entradas apuntan al mismo elemento y gana la última. Medido sobre un
asset-list solapado a propósito, en el instante del solape el contenido primario
quedó en la caja de la segunda experiencia, a **357,5 píxeles** de la que la
primera había pedido, con el aviso de la primera dibujado contra un área que el
primario ya no ocupaba. La divergencia que la regla declarada deja es un aviso
cortado o congelado; la que la otra abre es la composición entera mal dibujada.

## Qué pasa con un asset que este cliente no puede dibujar

Un `ASSET` de la lista se resuelve de una de tres maneras, y son la decisión del
ADR 0019 junto con los tres escalones del Apéndice D.5:

| El asset | Qué produce |
| --- | --- |
| trae un bloque `X-AD-CREATIVE-SIGNALING` utilizable | las experiencias que el bloque declara, con su layout |
| no trae bloque, o trae uno que este cliente no puede dibujar | **una** experiencia a cuadro entero con el `URI` del propio asset |
| no trae ninguna de las dos cosas | nada: se saltea **ese asset** y no el break |

**El aviso lineal y el repliegue son el mismo camino.** Un asset sin bloque es un
aviso lineal declarado como se declaró siempre — `URI` y `DURATION`, nada
nuestro— y un bloque que falla cae exactamente al mismo lugar. No hay dos
mecanismos y no hace falta un campo nuevo: la experiencia sintetizada usa el
mismo `viewport`, el mismo `zDepth` y el mismo `volume` que cualquier otro
layout. Su `type` es `'linear'`, que es una etiqueta **de este contrato** y no un
valor que alguien tenga que escribir en un asset-list.

**El contenido primario no se detiene.** El aviso ocupa el cuadro entero por
`zDepth` y el primario queda debajo, tapado y en silencio, pero reproduciéndose.
Es lo que mantiene invariante el largo de la línea de tiempo (ADR 0016) y lo que
hace que un aviso lineal nuestro no se parezca al de un cliente de mercado, que
sí interrumpe.

**La mezcla del aviso lineal es la inversa de la del concurrente**, y la
asimetría es deliberada: 100 en el aviso y 0 en el programa. Un aviso concurrente
que no declara volumen entra callado porque se mezcla **sobre** un programa que
alguien está escuchando; este no se mezcla sobre nada — tapa el cuadro—, y un
aviso a cuadro entero sin sonido es una falla que nada en pantalla reporta.

### Qué cuenta como "no lo puedo dibujar", y qué no

Se detectan tres formas, y las tres son sobre la forma del dato:

- **No hay bloque.** No es una falla: es un aviso lineal.
- **El bloque no tiene payload usable**: no hay `payload`, está vacío, o alguno
  de sus items no tiene ventana —un `duration` que no es un número positivo— o
  declara un layout sin assets adentro, o un catálogo sin vistas adentro. Nada de
  eso puede volverse una caja en una pantalla.
- **El asset no tiene nada reproducible**: ni bloque usable ni un `URI` con una
  `DURATION` positiva. Ahí se saltea ese asset, y **el desplazamiento de los que
  siguen no se mueve**: la `DURATION` declarada se acumula igual, así que las
  ventanas de los demás quedan donde estaban. Saltear un asset moviendo a los
  otros sería el break fallando de a un aviso por vez, que es justo lo que el
  Apéndice D.5 separa.

Y dos que **no** se detectan, cada una por una razón distinta:

- **El `mediaType` que este cliente no soporta.** En el momento de resolver no
  hay con qué contestarlo: el `type` de un asset de media playlist es el mismo
  string para cualquier códec que haya adentro, así que el chequeo miraría el
  contenedor y no lo que importa, rechazando nada de lo que realmente falla. Una
  respuesta honesta llega recién cuando el elemento intenta reproducir, que es
  otro mecanismo y otro momento.
- **Un layout que pide más elementos que los decodificadores declarados.** El
  número todavía no existe. Cuando exista, la comparación es una línea en el
  mismo lugar donde el bloque inutilizable ya cae al repliegue, y no necesita
  mecanismo nuevo.

**Un `uri` vacío en un elemento no cuenta como bloque ilegible.** La herramienta
de SVTA emite `"uri": ""` en los seis payloads, con `"URI": "[PATH TO ASSET]"`
arriba: un cliente que lo tomara por ilegible replegaría sobre todos los
asset-list que la herramienta produce, y el ADR 0004 es exactamente la decisión
de no hacer eso.

### Los dos escalones que son del asset-list entero

- **El asset-list no se puede leer** —no llega, o no es JSON—: se cancela el
  break entero con offset 0. Bajo este render el offset 0 ya está aplicado,
  porque el primario nunca se detuvo, así que cancelar es esto: ninguna
  experiencia, **ningún rango en la lista de rangos**, y el programa siguiendo.
  El error en la consola es el único rastro que deja, y por eso es un error y no
  una advertencia.
- **`ASSETS` viene vacío**: se aplica el offset y no se reproduce nada. Ninguna
  experiencia y ningún rango, con una advertencia en la consola.

### Qué marca la barra durante un aviso a cuadro entero

**Nada aparte.** El break entero sigue siendo **un** rango de clase
`concurrent`, desde el arranque del primer aviso hasta el fin del último, con el
aviso a cuadro entero adentro.

La razón es la definición de `kind` de más arriba: un rango es concurrente o es
de reemplazo, y lo que los separa es si cambia el largo de la línea de tiempo
(ADR 0016). Bajo este render el aviso a cuadro entero **no lo cambia** —el
primario nunca se detuvo—, así que marcarlo como rango de reemplazo diría que
hubo un reemplazo sobre un riel donde no lo hubo, y marcarlo como concurrente no
agregaría nada al rango que ya está. El día que un aviso de esta capa detenga el
programa de verdad, ese aviso sí es un rango propio y sí es de reemplazo, y ahí
la distinción tiene qué decir.
