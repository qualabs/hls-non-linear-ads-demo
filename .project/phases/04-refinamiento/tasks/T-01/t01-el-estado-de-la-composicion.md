# El estado de la composición: aplicado, y no propagado

2026-09-07. La pausa de la composición gobernando a todos sus elementos, con la
secuencia que Nicolás describió corrida con gestos de verdad y leída nodo por
nodo antes y después del cambio.

## 1. El defecto, y cuál de las dos mitades era

`lib/renderer.js` tenía la respuesta a una sola pregunta —si un elemento del
aviso reproduce— saliendo de dos lugares. Los listeners de `play` y `pause` del
primario propagaban las **transiciones**, y `build()` decidía el estado de un
nodo **en el momento de crearlo**, con un `node.play()` que no miraba
`video.paused`.

Los dos lugares dan la misma respuesta mientras la composición esté
reproduciendo, y difieren exactamente cuando un nodo se crea con la composición
detenida: un seek que cae adentro de la ventana de un aviso concurrente de video
con la pausa puesta armaba el nodo y lo arrancaba, así que el aviso reproducía
solo con todo lo demás quieto.

## 2. El arreglo es la forma que el mute ya tenía

El mute estaba resuelto de la forma correcta y es el modelo que se copió:
`applyAudio()` corre después de cada `build` y también en cada `volumechange`,
así que una composición muteada gobierna igual a los elementos nuevos y a los
que ya estaban. Falta lo mismo para el estado de reproducción y es lo que se
agregó, con la misma forma:

```js
function applyPlayback() {
  for (const { node } of playable()) {
    if (video.paused) node.pause();
    else node.play().catch(() => {});
  }
}
```

No toma argumento, y eso es el punto: lo que llega a los elementos es
`video.paused` y no el nombre del evento que trajo la llamada. Corre en tres
lugares y en ninguno más —después de cada `build`, en el `play` del primario y
en su `pause`—, los dos listeners son la misma función, y el `node.play()` de
`build()` se fue. Hay un lugar que contesta la pregunta.

**El orden dentro de `tick` es `applyPlayback()` y después `applyAudio()`**, y
es el que estaba: el nodo se crea muteado, arranca muteado —que es la única
manera de que la política de autoplay lo deje arrancar— y recién entonces
`applyAudio` le da el volumen que su elemento declara.

Las dos cosas que no se movieron: cada nodo de video se sigue creando `muted`, y
el `startAt` que `build()` le pasa a `attachAsset` sigue siendo el que deja el
asset en el segundo correcto. Lo que `applyPlayback` gobierna es **si**
reproduce, no dónde.

## 3. La lectura nodo por nodo, en los dos estados

El break 5, `multiView`: tres assets de video más el primario, con la mezcla
declarada 10 / 10 / 100 / 10. Se cae en el medio de la ventana —126,0 s de un
break que va de 120 s a 132 s—, así que el contrato pide un desplazamiento de
5,998 s en cada asset. Composición con el audio encendido, pausada con un click
en el botón de play y el seek hecho con un click sobre la barra.

**Composición pausada, adentro del aviso.** Las tres columnas, y la cuarta es lo
que el contrato pide en ese segundo:

| elemento         | paused | muted | volume | currentTime | pide  |
| ---------------- | ------ | ----- | ------ | ----------- | ----- |
| `primaryContent` | true   | false | 0,1    | 125,998     | —     |
| `view2`          | true   | false | 0,1    | 5,998       | 5,998 |
| `view3`          | true   | false | 1      | 5,998       | 5,998 |
| `view4`          | true   | false | 0,1    | 5,998       | 5,998 |

Antes del cambio, los mismos cuatro nodos en el mismo segundo: el primario en
`paused: true` y los tres del aviso en `paused: false`, con su `currentTime` en
7,540 contra los 5,998 que el contrato pide. Y el `currentTime` de los tres
avanzó 1,534 s en 1,5 s de reloj de pared con la composición detenida, que es la
manera de decir "está reproduciendo" que no depende de una sola lectura. Después
del cambio ese avance es 0,000 en los cuatro.

**Play, y arrancan juntos.** Un click en el mismo botón:

| elemento         | paused | muted | volume | currentTime | pide  |
| ---------------- | ------ | ----- | ------ | ----------- | ----- |
| `primaryContent` | false  | false | 0,1    | 127,403     | —     |
| `view2`          | false  | false | 0,1    | 7,403       | 7,403 |
| `view3`          | false  | false | 1      | 7,403       | 7,403 |
| `view4`          | false  | false | 0,1    | 7,403       | 7,403 |

La columna del volumen es la mezcla declarada, elemento por elemento, en los dos
estados: 0,1 en el primario y en `view2` y `view4`, 1 en `view3`. Y `muted` en
`false` en los cuatro, que es lo que corresponde con el audio de la composición
encendido y ningún nivel en 0.

**La tercera columna atrapó la mitad del defecto que no se ve.** Antes del
cambio, al apretar play el asset estaba en 11,483 contra los 7,387 que el
contrato pedía: los nodos habían seguido corriendo los cuatro segundos que la
composición estuvo detenida, así que el aviso volvía desfasado del programa. Un
elemento en el segundo equivocado se ve perfecto en una captura.

## 4. Lo que se corrió porque la task edita el renderizado

- `node scripts/verificar-cortes.mjs`: las dos costuras en verde, las cinco
  ocurrencias de siempre en la lista de aceptadas.
- `npm test`: 27 de 27.
- **La caja que el contrato pide contra la que el navegador dibuja**: 0,00 px de
  diferencia máxima sobre los cuatro elementos, en los dos estados, y sobre los
  cinco breaks del recorrido. La aritmética del contrato está escrita en el
  script de la medición y no importada de la librería, para que las dos cuentas
  sean independientes.
- **El recorrido de los cinco breaks**, reproduciendo: 2, 3, 3, 2 y 4 elementos,
  los avisos de video en `paused: false` en los cuatro breaks que los tienen, y
  los dos stills del break 3 sin línea de tiempo que gobernar.

## 5. Lo que se mide y no cierra

El seek deja una línea en la consola —`[hls] error networkError aborted fatal:
false`— y aparece igual antes y después del cambio, en las dos corridas. Es la
petición que el seek cancela, no es fatal y no es de esta task.

## Evidencia

- `t01run.py` — la corrida, con la secuencia y las dos mediciones.
- `t01-la-lectura-despues.json`, `t01-la-lectura-antes.json` — las lecturas
  completas, el recorrido incluido.
- `t01-1-pausada-adentro-del-aviso-despues.png` — el Quad detenido con la
  composición pausada, y la misma toma antes del cambio en
  `t01-1-pausada-adentro-del-aviso-antes.png`.
- `t01-2-play-y-arrancan-juntos-despues.png`, `t01-3-el-recorrido-despues.png`.
- `t01-los-invariantes.txt` — las dos costuras y los 27 tests.
