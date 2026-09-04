# El contrato entre la señalización y el renderizado

Es la única superficie entre las dos capas del ADR 0003. De este lado, el
renderizado, no se importa el player, no se leen tags y no se pide nada por
red: se recibe un **proveedor**, se recibe una **manera de poner un asset en un
elemento**, y se dibujan cajas.

## El proveedor

Un objeto con un método:

```js
provider.activeAt(time) -> Experience[]
```

`time` es el tiempo de reproducción del contenido primario en segundos, el que
da `video.currentTime`. Devuelve las experiencias activas en ese instante, y un
array vacío cuando no hay ninguna. Es sincrónico, se puede llamar en cada
cuadro, y devuelve los mismos objetos mientras la experiencia siga activa.

## Los datos

```js
Experience {
  id: string          // identificador de la señalización; sirve para nombrar la experiencia en un log
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

## Las cinco reglas de lectura

1. **`box` son insets en porcentaje, no coordenadas.** Cuánto se recorta cada
   borde respecto del área del player. `{0,0,0,0}` es el cuadro entero;
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
   y `duration` vienen para mostrar un contador, no para decidir.

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
Quien la implementa es `js/app.js`, que es el archivo que conoce los dos lados
porque es el que los une, y ahí adentro sí se sabe que un `mediaType` de media
playlist necesita una segunda instancia del player. Que dos elementos de video,
cada uno con su propia instancia, reproduzcan al mismo tiempo es lo que midió
la T-01.

El día que la capa de abajo se reemplace, esta función se reemplaza con ella y
el renderizado no cambia, que es exactamente lo que el ADR 0003 compra.

## Lo que el contrato NO dice

- **Nada del transporte.** Ni tags, ni JSON, ni clases, ni red. Cambiar de
  transporte es reemplazar la capa de abajo.
- **Nada de píxeles.** El área del player la conoce el renderizado y solo el
  renderizado.
- **La política de audio no está acá.** El `volume` es el estado inicial
  declarado, y el ADR 0010 manda por encima: el aviso arranca en silencio, el
  primario conserva su audio, y hay un control visible para activarlo. Ojo con
  esto, porque los dos se cruzan: la herramienta de SVTA no emite `volume` en
  ningún elemento, así que el default que la capa asume es 100 en los seis
  layouts. Si el renderizado obedeciera el campo al pie de la letra, el aviso
  arrancaría a todo volumen. El ADR 0010 es el que decide.

## Los dos defaults que la herramienta omite

Los midió la T-03 sobre los seis payloads que emite la herramienta de SVTA, y
están resueltos en `t06-los-seis-payloads-resueltos.json`. La capa los **asume**
en lugar de exigirlos, porque el ADR 0004 manda consumir el asset-list tal como
la herramienta lo emite:

| Lo que falta | Cuándo | Lo que la capa asume |
| --- | --- | --- |
| el bloque `primaryContent` entero | en `cornerOverlay` y `lowerThirdOverlay`, los dos overlays | `zDepth` 0, `volume` 100, `viewport` `"0 0 0 0"`, que es el preset de la propia herramienta |
| el campo `volume` | en los seis layouts, en todos los elementos | 100 |

El renderizado no ve esto: le llega el elemento primario completo y un `volume`
en todos los elementos, siempre.

## Un supuesto que conviene tener a la vista

El `start` de cada item del `payload` se lee como un desplazamiento desde el
`START-DATE` de la señalización, y no desde el comienzo de cada `ASSET`. El
bloque se declara `"type": "slot"` y los seis payloads de la herramienta traen
un único asset con `start: 0`, así que hoy las dos lecturas coinciden. Un
asset-list con varios `ASSETS` las separaría, y es una pregunta para SVTA antes
que una decisión de código.
