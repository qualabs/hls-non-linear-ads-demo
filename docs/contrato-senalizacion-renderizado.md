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

## Los datos

```js
Experience {
  id: string          // identificador de la señalización; sirve para nombrar el BREAK en un log
  itemId: string      // identidad de este aviso adentro del break; única entre todas las experiencias
  type: string        // etiqueta opaca del layout: 'cornerOverlay', 'squeezebackLShape', ...
  startTime: number   // segundos de reproducción en que arranca
  duration: number    // segundos que dura
  elements: Element[] // ordenados por zDepth ascendente
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
```

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
   ahora.

6. **Dos experiencias se distinguen por `itemId`, nunca por `id` ni por
   `type`.** Un break trae varios avisos y los tres campos no dicen lo mismo:
   `id` nombra el break y lo comparten todos sus avisos, `type` es la etiqueta
   del layout y dos avisos seguidos pueden compartirla —es lo natural, no lo
   raro—, y `itemId` es el único que nombra a un aviso. Quien dibuja se entera
   de que un aviso terminó y empezó otro comparando `itemId`: comparando
   cualquiera de los otros dos, el segundo creativo de un break no se dibuja
   nunca y en pantalla se ve el primero corriendo de largo.

## Los rangos del programa

`activeAt` alcanza para dibujar lo que está pasando y no alcanza para dibujar
una barra, que tiene que mostrar dónde están los breaks antes de que ocurran.
Esa es la segunda consulta:

```js
provider.programRanges() -> { ranges: Range[], settled: boolean }

Range {
  id: string        // el mismo identificador de la señalización que trae la experiencia
  kind: string      // 'concurrent' | 'interstitial'
  startTime: number // segundos de reproducción en que arranca
  duration: number  // segundos que dura
}
```

`ranges` viene ordenado por `startTime` ascendente. Es sincrónico y barato, y se
puede llamar en cada pintada.

**`kind` dice de qué clase es el rango, y es un dato y no una decoración.** El
programa lleva dos clases de rango encima de la misma línea de tiempo. Uno es la
experiencia concurrente, que se dibuja sobre el contenido sin detenerlo. El otro
es el interstitial tradicional que la misma playlist señaliza en cada break para
los clientes que ya están en el mercado (ADR 0007), que este reproductor no
reproduce y que igual está ahí: marca dónde un cliente de mercado se habría
detenido. Son dos cosas distintas, se pintan de colores distintos, y sin este
campo la barra no puede pintar dos colores.

**Lo que cruza es la clase de rango y no la clase del transporte.** `kind` es
`'concurrent'` o `'interstitial'`, no el string de la clase de HLS: la capa de
señalización es la que traduce, y un Date Range de cualquier otra clase no es un
rango de esta lista. Un rango es concurrente o es de reemplazo, y esa distinción
es de semántica —la primera nunca cambia el largo de la línea de tiempo y la
segunda sí (ADR 0016)—, así que sobrevive a un cambio de transporte, que es
exactamente lo que el ADR 0003 compra.

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
colocados contra un número que nunca fue cierto, y nadie avisa. La capa
**declara la secuencia y no la corrige**: no mide el creativo ni mueve las
ventanas de los avisos siguientes. Es la misma tensión que la norma abre al
decir que el interstitial termina al terminar el asset y no al cumplirse su
`DURATION`, y de qué lado queda es una pregunta abierta del proyecto.
